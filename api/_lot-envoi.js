// ═══════════════════════════════════════════════════════════════
// api/_lot-envoi.js — Envoi groupé personnalisé : lots et file d'envoi
//
// Julie coche des contacts, choisit un modèle, clique UNE fois sur
// « Envoyer ». Ce module crée le lot, le met en file, et le traite pas à
// pas ; la console l'interroge (lot_traiter) tant qu'il reste du travail.
// Il n'existe pas de processus d'arrière-plan sur ce déploiement (le cron
// reste coupé) : la file vit en base (migration 13) et avance tant que la
// console est ouverte ; si l'onglet se ferme, le lot attend, intact, et
// reprend à la réouverture. Rien ne part en double dans aucun cas.
//
// ─── CHAQUE MAIL PASSE PAR LE CHEMIN DE L'ENVOI UNITAIRE ───
// Le traitement appelle la route /api/prospect-mail elle-même (mode
// « envoi », un destinataire par appel) avec la session de Julie :
// rôle relu en base, STOP / désabonnés / rejetés écartés, réservation
// d'idempotence sur 60 jours (api/_envoi-unique.js). Aucun contournement.
//
// ─── PLAFONDS RESEND ───
// Forfait gratuit : 100 courriels par jour et 3 000 par mois, tous envois
// du compte confondus (le journal envois_prospect les compte). La file
// s'arrête proprement quand l'un des deux est atteint : le reste passe en
// « reporté » (reprise d'un clic, un autre jour) et le bilan le dit.
// Débit : un envoi à la fois, une pause entre deux (THROTTLE_MS).
//
// ─── RÉSULTAT PAR DESTINATAIRE ───
//   envoye · deja (< 60 jours, sauté) · desabonne · erreur (message
//   actionnable) · reporte (quota) · attente · ignore (lot annulé)
//
// Le préfixe « _ » : Vercel n'expose pas cette route.
// ═══════════════════════════════════════════════════════════════

import { normaliserEmail } from './_envoi-unique.js';
import { estModeleJulie } from './_modeles-prospect.js';

export const QUOTA_JOUR = 100;
export const QUOTA_MOIS = 3000;
export const LOT_TOTAL_MAX = 500;
export const THROTTLE_MS = 700;
const BUDGET_MS = 20_000;
const REPRISE_EN_COURS_MS = 2 * 60_000;
const RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STATUTS = ['attente', 'en_cours', 'envoye', 'deja', 'desabonne', 'erreur', 'reporte', 'ignore'];

// ─── Magasin mémoire (développement, migration 13 absente) ────────
export function creerStoreLotsMemoire() {
  const lots = new Map();
  const items = new Map(); // lotId → [item]
  let seqLot = 0, seqItem = 0;
  return {
    nom: 'memoire', persistant: false, lots, items,
    async creer(lot, liste) {
      for (const l of lots.values()) {
        if (l.proprietaire === lot.proprietaire && l.statut === 'en_cours') throw Object.assign(new Error('LOT_EN_COURS'), { code: 'LOT_EN_COURS' });
      }
      const id = ++seqLot;
      const maintenant = new Date().toISOString();
      lots.set(id, Object.assign({ statut: 'en_cours', note: '', created_at: maintenant, updated_at: maintenant }, lot, { id }));
      items.set(id, liste.map((x, i) => Object.assign({ statut: 'attente', code: '', detail: '', retentable: false, precedent: null, renvoi: null, resend_id: null, traite_le: null }, x, { id: ++seqItem, lot_id: id, rang: i + 1 })));
      return lots.get(id);
    },
    async lire(id) { const l = lots.get(Number(id)); return l ? { lot: l, items: items.get(l.id) } : null; },
    async dernier(proprietaire) {
      const l = [...lots.values()].filter((x) => x.proprietaire === proprietaire).sort((a, b) => b.id - a.id)[0];
      return l ? l.id : null;
    },
    async reclamer(lotId, n) {
      const prises = (items.get(lotId) || []).filter((x) => x.statut === 'attente').slice(0, n);
      prises.forEach((x) => { x.statut = 'en_cours'; x.traite_le = new Date().toISOString(); });
      return prises;
    },
    async majItem(lotId, itemId, patch) { const x = (items.get(lotId) || []).find((i) => i.id === itemId); if (x) Object.assign(x, patch); },
    async majLot(lotId, patch) { const l = lots.get(lotId); if (l) Object.assign(l, patch, { updated_at: new Date().toISOString() }); },
    async reprendreEnCours(lotId, avantMs) {
      (items.get(lotId) || []).forEach((x) => { if (x.statut === 'en_cours' && x.traite_le && Date.parse(x.traite_le) < avantMs) x.statut = 'attente'; });
    },
    async remettreEnFile(lotId) {
      let n = 0;
      (items.get(lotId) || []).forEach((x) => {
        if (x.statut === 'reporte' || (x.statut === 'erreur' && x.retentable)) { x.statut = 'attente'; x.code = ''; x.detail = ''; n++; }
      });
      return n;
    },
    async ignorerRestants(lotId) {
      (items.get(lotId) || []).forEach((x) => { if (x.statut === 'attente' || x.statut === 'reporte') { x.statut = 'ignore'; x.detail = 'Lot annulé.'; } });
    }
  };
}

// ─── Magasin Supabase (PostgREST) ─────────────────────────────────
export function creerStoreLotsSupabase({ url, entetes, repli }) {
  const memoire = repli || creerStoreLotsMemoire();
  let absent = false; // migration 13 absente
  const H = (extra) => Object.assign({ 'Content-Type': 'application/json' }, entetes(), extra || {});
  const tableAbsente = (status, texte) => (status === 404 || status === 400) && /42P01|PGRST205|lots_envoi/i.test(texte || '');
  const L = url + '/rest/v1/lots_envoi', I = url + '/rest/v1/lots_envoi_items';
  async function lire(u) { const r = await fetch(u, { headers: H() }); if (!r.ok) { const t = await r.text().catch(() => ''); throw Object.assign(new Error('lots ' + r.status), { status: r.status, texte: t }); } return r.json(); }
  async function ecrire(u, methode, corps, retour) {
    const r = await fetch(u, { method: methode, headers: H({ Prefer: retour ? 'return=representation' : 'return=minimal' }), body: corps === undefined ? undefined : JSON.stringify(corps) });
    if (!r.ok) { const t = await r.text().catch(() => ''); throw Object.assign(new Error('lots ' + r.status), { status: r.status, texte: t }); }
    return retour ? r.json() : null;
  }
  /* Exécute sur la base ; si la table n'existe pas, bascule sur la mémoire. */
  async function essayer(fnBase, fnMem) {
    if (!absent) {
      try { return await fnBase(); }
      catch (e) {
        if (e && tableAbsente(e.status, e.texte)) absent = true;
        else throw e;
      }
    }
    return fnMem();
  }
  const store = {
    nom: 'supabase',
    get persistant() { return !absent; },
    async creer(lot, liste) {
      return essayer(async () => {
        let cree;
        try { cree = (await ecrire(L, 'POST', lot, true))[0]; }
        catch (e) {
          if (e.status === 409 || /23505|duplicate|unique/i.test(e.texte || '')) throw Object.assign(new Error('LOT_EN_COURS'), { code: 'LOT_EN_COURS' });
          throw e;
        }
        await ecrire(I, 'POST', liste.map((x, i) => Object.assign({}, x, { lot_id: cree.id, rang: i + 1 })));
        return cree;
      }, () => memoire.creer(lot, liste));
    },
    async lire(id) {
      return essayer(async () => {
        const l = (await lire(L + '?id=eq.' + Number(id)))[0];
        if (!l) return null;
        return { lot: l, items: await lire(I + '?lot_id=eq.' + l.id + '&order=rang.asc&limit=1000') };
      }, () => memoire.lire(id));
    },
    async dernier(proprietaire) {
      return essayer(async () => {
        const l = (await lire(L + '?select=id&proprietaire=eq.' + encodeURIComponent(proprietaire) + '&order=id.desc&limit=1'))[0];
        return l ? l.id : null;
      }, () => memoire.dernier(proprietaire));
    },
    async reclamer(lotId, n) {
      return essayer(async () => {
        const candidats = await lire(I + '?select=id&lot_id=eq.' + lotId + '&statut=eq.attente&order=rang.asc&limit=' + n);
        if (!candidats.length) return [];
        /* PATCH conditionnel : seules les lignes encore « attente » nous reviennent
           (deux onglets ne se partagent jamais la même ligne). */
        return ecrire(I + '?lot_id=eq.' + lotId + '&statut=eq.attente&id=in.(' + candidats.map((c) => c.id).join(',') + ')', 'PATCH',
          { statut: 'en_cours', traite_le: new Date().toISOString() }, true);
      }, () => memoire.reclamer(lotId, n));
    },
    async majItem(lotId, itemId, patch) { return essayer(() => ecrire(I + '?id=eq.' + itemId, 'PATCH', patch), () => memoire.majItem(lotId, itemId, patch)); },
    async majLot(lotId, patch) { return essayer(() => ecrire(L + '?id=eq.' + lotId, 'PATCH', Object.assign({ updated_at: new Date().toISOString() }, patch)), () => memoire.majLot(lotId, patch)); },
    async reprendreEnCours(lotId, avantMs) {
      return essayer(() => ecrire(I + '?lot_id=eq.' + lotId + '&statut=eq.en_cours&traite_le=lt.' + encodeURIComponent(new Date(avantMs).toISOString()), 'PATCH', { statut: 'attente' }),
        () => memoire.reprendreEnCours(lotId, avantMs));
    },
    async remettreEnFile(lotId) {
      return essayer(async () => {
        const a = await ecrire(I + '?lot_id=eq.' + lotId + '&statut=eq.reporte', 'PATCH', { statut: 'attente', code: '', detail: '' }, true);
        const b = await ecrire(I + '?lot_id=eq.' + lotId + '&statut=eq.erreur&retentable=eq.true', 'PATCH', { statut: 'attente', code: '', detail: '' }, true);
        return a.length + b.length;
      }, () => memoire.remettreEnFile(lotId));
    },
    async ignorerRestants(lotId) {
      return essayer(async () => {
        await ecrire(I + '?lot_id=eq.' + lotId + '&statut=in.(attente,reporte)', 'PATCH', { statut: 'ignore', detail: 'Lot annulé.' });
      }, () => memoire.ignorerRestants(lotId));
    }
  };
  return store;
}

// ─── Présentation ─────────────────────────────────────────────────
function compter(items) {
  const c = {}; STATUTS.forEach((s) => { c[s] = 0; });
  items.forEach((x) => { c[x.statut] = (c[x.statut] || 0) + 1; });
  c.total = items.length;
  c.traites = c.envoye + c.deja + c.desabonne + c.erreur + c.ignore;
  return c;
}

const pl = (n, un, plus) => n + ' ' + (n > 1 ? plus : un);

/** « 37 envoyés · 5 déjà envoyés (moins de 2 mois) · 12 reportés faute de quota quotidien » */
export function bilanTexte(c, lot) {
  const p = [];
  p.push(pl(c.envoye, 'envoyé', 'envoyés'));
  if (c.deja) p.push(pl(c.deja, 'déjà envoyé', 'déjà envoyés') + ' (moins de 2 mois, sautés)');
  if (c.desabonne) p.push(pl(c.desabonne, 'désabonné', 'désabonnés'));
  if (c.erreur) p.push(pl(c.erreur, 'erreur', 'erreurs'));
  if (c.reporte) p.push(pl(c.reporte, 'reporté', 'reportés') + (lot && lot.note && /mensuel/i.test(lot.note) ? ' faute de quota mensuel' : ' faute de quota quotidien'));
  if (c.attente + c.en_cours) p.push(pl(c.attente + c.en_cours, 'en attente', 'en attente'));
  if (c.ignore) p.push(pl(c.ignore, 'ignoré', 'ignorés'));
  return p.join(' · ');
}

function etatDe(lot, items, quota, persistant) {
  const c = compter(items);
  return {
    lot: { id: lot.id, statut: lot.statut, modele: lot.modele, total: lot.total, note: lot.note || '', created_at: lot.created_at, updated_at: lot.updated_at, persistant: !!persistant },
    compte: c,
    progression: c.total ? Math.round((c.traites + c.reporte) * 100 / c.total) : 100,
    bilan: bilanTexte(c, lot),
    quota: quota || undefined,
    items: items.map((x) => ({
      id: x.id, rang: x.rang, email: x.email, prenom: x.prenom, nom_famille: x.nom_famille, civilite: x.civilite, organisation: x.organisation,
      statut: x.statut, code: x.code, detail: x.detail, retentable: !!x.retentable, precedent: x.precedent, renvoi: x.renvoi
    }))
  };
}

// ─── Classement d'une réponse de la route d'envoi ─────────────────
const FATALS = {
  NON_CONNECTE: 'Session expirée : reconnectez-vous, puis reprenez le lot. Rien d’autre n’est parti.',
  INTERDIT: 'Votre compte n’a pas le droit d’envoyer. Le lot est arrêté.',
  NOT_CONFIGURED: 'L’envoi de courriels n’est pas configuré : rien n’est parti. Le lot attend.',
  ENVOI_DESACTIVE: 'L’envoi automatique est désactivé : rien n’est parti. Le lot attend.',
  JOURNAL_INDISPONIBLE: 'Le journal des envois est injoignable : le lot est arrêté par prudence (aucun risque de doublon). Reprenez dans un instant.',
  RATE_LIMIT: 'Trop d’envois en peu de temps : le lot est en pause. Reprenez dans quelques minutes.',
  ORIGINE: 'Envoi refusé : ouvrez la console depuis melodia-funebre.fr.'
};

export function classerReponse(r) {
  const c = (r && r.corps) || {};
  const status = (r && r.status) || 0;
  if (status === 200 && Array.isArray(c.envoyes) && c.envoyes.length) {
    return { statut: 'envoye', resend_id: c.envoyes[0].id || null };
  }
  const refus = Array.isArray(c.refuses) ? c.refuses[0] : null;
  if (refus) {
    if (refus.code === 'DEJA_ENVOYE' || refus.code === 'DOUBLON') {
      return { statut: 'deja', code: 'DEJA_ENVOYE', detail: refus.motif || 'Déjà envoyé il y a moins de 2 mois.', precedent: refus.precedent || null, renvoi: refus.renvoi || null };
    }
    if (refus.code === 'DESABONNE') return { statut: 'desabonne', code: 'DESABONNE', detail: refus.motif || 'Cette adresse a demandé à ne plus être contactée.' };
    if (refus.code === 'REJETE') return { statut: 'erreur', code: 'REJETE', detail: 'Adresse rejetée (rebond ou signalement) : ne la contactez plus ; corrigez l’adresse dans la fiche.' };
    return { statut: 'erreur', code: refus.code || 'REFUSE', detail: refus.motif || 'Refusé.' };
  }
  if (c.code && FATALS[c.code]) return { fatal: true, code: c.code, detail: FATALS[c.code] };
  if (c.code === 'ENVOI_INCERTAIN') {
    return { statut: 'erreur', code: 'ENVOI_INCERTAIN', detail: 'Le service d’envoi n’a pas répondu à temps : on ne sait pas si le message est parti. Vérifiez dans Resend avant tout nouvel essai (il reste bloqué contre un doublon).' };
  }
  if (c.retentable || status === 429 || status >= 500) {
    return { statut: 'erreur', code: c.code || 'ECHEC_ENVOI', retentable: true, detail: 'Le prestataire a refusé l’envoi (' + (c.motif || c.code || status) + '). Rien n’est compté : « Reprendre » réessaie.' };
  }
  return { statut: 'erreur', code: c.code || 'ERREUR', detail: 'Non envoyé : ' + (c.error || ('erreur ' + status)) + '.' };
}

// ─── Création ─────────────────────────────────────────────────────
export function nettoyerDestinataire(d) {
  const t = (v, n) => String((v == null ? '' : v)).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
  return {
    email: normaliserEmail(d && d.email), prenom: t(d && d.prenom, 80), nom_famille: t(d && (d.nom_famille || d.nom), 80),
    civilite: t(d && d.civilite, 20), organisation: t(d && (d.organisation || d.societe), 160), ville: t(d && d.ville, 80), ref: t(d && d.ref, 40)
  };
}

function reponseErreur(repondre, code, status, error, extra) { return repondre(status, Object.assign({ ok: false, code, error }, extra || {})); }

/**
 * @param mode     lot_creer | lot_traiter | lot_etat | lot_reprendre | lot_annuler
 * @param d        corps de la requête
 * @param qui      { email, role, nom } — session relue en base
 * @param ctx      { store, envoyerUn(corps) → {status, corps}, quota() → {jour, mois},
 *                   repondre(code, corps), pause?(ms), budgetMs?, maintenant?() }
 */
export async function gererLots(mode, d, qui, ctx) {
  const { store, repondre } = ctx;
  const proprietaire = normaliserEmail(qui.email);
  const maintenant = ctx.maintenant || Date.now;

  async function chargerAutorise(id) {
    const cible = id != null && id !== '' ? id : await store.dernier(proprietaire);
    if (cible == null) return { absent: true };
    const lu = await store.lire(cible);
    if (!lu) return { absent: true };
    if (lu.lot.proprietaire !== proprietaire && qui.role !== 'master') return { interdit: true };
    return lu;
  }
  const quotaVue = async () => {
    try { const q = await ctx.quota(); return { jour: q.jour, mois: q.mois, limiteJour: QUOTA_JOUR, limiteMois: QUOTA_MOIS, restantJour: Math.max(0, QUOTA_JOUR - q.jour), restantMois: Math.max(0, QUOTA_MOIS - q.mois) }; }
    catch (e) { return undefined; }
  };
  const rendre = async (lot, extra) => {
    const lu = await store.lire(lot.id);
    return repondre(200, Object.assign({ ok: true, mode }, etatDe(lu.lot, lu.items, await quotaVue(), store.persistant), extra || {}));
  };

  // ── Créer le lot ──
  if (mode === 'lot_creer') {
    const modele = String(d.modele || '').trim().slice(0, 80);
    if (!estModeleJulie(modele)) {
      return reponseErreur(repondre, 'MODELE_INCONNU', 400, 'Choisissez un des modèles proposés dans la console pour un envoi groupé.');
    }
    const liste = Array.isArray(d.destinataires) ? d.destinataires : [];
    if (!liste.length) return reponseErreur(repondre, 'SELECTION_VIDE', 400, 'Aucun destinataire sélectionné : cochez au moins une personne.');
    if (liste.length > LOT_TOTAL_MAX) return reponseErreur(repondre, 'LOT_TROP_GRAND', 400, 'Au plus ' + LOT_TOTAL_MAX + ' destinataires par lot.');
    const vus = new Set();
    const items = [];
    const invalides = [];
    let doublonsSelection = 0;
    liste.forEach((x) => {
      const n = nettoyerDestinataire(x);
      if (!RE_MAIL.test(n.email)) { invalides.push({ email: String((x && x.email) || ''), motif: 'Adresse e-mail invalide.' }); return; }
      if (vus.has(n.email)) { doublonsSelection++; return; }
      vus.add(n.email); items.push(n);
    });
    if (!items.length) return reponseErreur(repondre, 'SELECTION_VIDE', 400, 'Aucune adresse valide dans la sélection.', { invalides });
    const options = {
      brochures: Array.isArray(d.brochures) ? d.brochures.map((b) => String(b).slice(0, 60)).slice(0, 8) : [],
      layout: String(d.layout || '').slice(0, 20),
      signature: (d.signature && typeof d.signature === 'object') ? {
        nom: String(d.signature.nom || '').slice(0, 80), role: String(d.signature.role || '').slice(0, 90),
        tel: String(d.signature.tel || '').slice(0, 24), photo: String(d.signature.photo || '').slice(0, 300)
      } : {}
    };
    let lot;
    try { lot = await store.creer({ proprietaire, modele, options, statut: 'en_cours', total: items.length, note: '' }, items); }
    catch (e) {
      if (e && e.code === 'LOT_EN_COURS') return reponseErreur(repondre, 'LOT_EN_COURS', 409, 'Un lot est déjà en cours : laissez-le se terminer, ou annulez-le, avant d’en lancer un autre.');
      return reponseErreur(repondre, 'LOT_INDISPONIBLE', 503, 'Le lot n’a pas pu être enregistré : rien n’est parti. Réessayez dans un instant.');
    }
    return rendre(lot, { invalides, doublonsSelection });
  }

  // ── État (dernier lot ou lot précisé) ──
  if (mode === 'lot_etat') {
    const lu = await chargerAutorise(d.lot_id);
    if (lu.interdit) return reponseErreur(repondre, 'INTERDIT', 403, 'Ce lot appartient à un autre collaborateur.');
    if (lu.absent) return repondre(200, { ok: true, mode, lot: null, persistant: store.persistant, quota: await quotaVue() });
    return rendre(lu.lot);
  }

  const lu = await chargerAutorise(d.lot_id);
  if (lu.interdit) return reponseErreur(repondre, 'INTERDIT', 403, 'Ce lot appartient à un autre collaborateur.');
  if (lu.absent) return reponseErreur(repondre, 'LOT_INTROUVABLE', 404, 'Lot introuvable. S’il date d’avant un redémarrage du serveur, relancez la sélection.');
  const lot = lu.lot;

  // ── Annuler ──
  if (mode === 'lot_annuler') {
    await store.ignorerRestants(lot.id);
    await store.majLot(lot.id, { statut: 'annule', note: 'Annulé par ' + (qui.nom || proprietaire) + '.' });
    return rendre(lot);
  }

  // ── Reprendre (reportés + erreurs réessayables) ──
  if (mode === 'lot_reprendre') {
    if (lot.statut === 'en_cours') return rendre(lot);
    const n = await store.remettreEnFile(lot.id);
    if (!n && lot.statut !== 'arrete') return reponseErreur(repondre, 'RIEN_A_REPRENDRE', 409, 'Rien à reprendre dans ce lot.');
    try { await store.majLot(lot.id, { statut: 'en_cours', note: '' }); }
    catch (e) { return reponseErreur(repondre, 'LOT_EN_COURS', 409, 'Un autre lot est déjà en cours.'); }
    return rendre(lot);
  }

  // ── Traiter : envoie les mails, un par un, dans les plafonds ──
  if (mode === 'lot_traiter') {
    if (lot.statut !== 'en_cours') return rendre(lot);
    const t0 = Date.now();
    const budget = ctx.budgetMs != null ? ctx.budgetMs : BUDGET_MS;
    const pause = ctx.pause || ((ms) => new Promise((r) => setTimeout(r, ms)));
    await store.reprendreEnCours(lot.id, maintenant() - REPRISE_EN_COURS_MS);

    let q = { jour: 0, mois: 0 };
    try { q = await ctx.quota(); } catch (e) { /* inconnu : on part de zéro, le journal protège de toute façon */ }
    let restantJour = QUOTA_JOUR - q.jour, restantMois = QUOTA_MOIS - q.mois;
    let arretQuota = null;
    let fatal = null;

    while (Date.now() - t0 < budget) {
      if (restantJour <= 0 || restantMois <= 0) { arretQuota = restantJour <= 0 ? 'jour' : 'mois'; break; }
      const [it] = await store.reclamer(lot.id, 1);
      if (!it) break;
      const corps = {
        mode: 'envoi', modele: lot.modele,
        brochures: (lot.options && lot.options.brochures) || [],
        joindreBrochure: !!(lot.options && lot.options.brochures && lot.options.brochures.length),
        layout: (lot.options && lot.options.layout) || undefined,
        signature: (lot.options && lot.options.signature) || {},
        campagne: 'lot-' + lot.id,
        envois: [{
          to: it.email, ref: it.ref || '', prenom: it.prenom, nom_famille: it.nom_famille, civilite: it.civilite,
          nom: [it.prenom, it.nom_famille].filter(Boolean).join(' '), societe: it.organisation, ville: it.ville
        }]
      };
      let r;
      try { r = await ctx.envoyerUn(corps, { premier: it.rang === 1 }); }
      catch (e) { r = { status: 500, corps: { code: 'ECHEC_ENVOI', retentable: true, motif: String((e && e.message) || e).slice(0, 120) } }; }
      const k = classerReponse(r);
      if (k.fatal) {
        await store.majItem(lot.id, it.id, { statut: 'attente', traite_le: null });
        fatal = k; break;
      }
      await store.majItem(lot.id, it.id, {
        statut: k.statut, code: k.code || '', detail: k.detail || '', retentable: !!k.retentable,
        precedent: k.precedent || null, renvoi: k.renvoi || null, resend_id: k.resend_id || null, traite_le: new Date().toISOString()
      });
      if (k.statut === 'envoye') { restantJour--; restantMois--; await pause(ctx.pauseMs != null ? ctx.pauseMs : THROTTLE_MS); }
      else if (k.statut === 'erreur' && k.retentable) await pause(ctx.pauseMs != null ? ctx.pauseMs : THROTTLE_MS);
    }

    if (arretQuota && !(await store.lire(lot.id)).items.some((y) => y.statut === 'attente')) arretQuota = null;
    if (arretQuota) {
      const motif = arretQuota === 'jour'
        ? 'Quota quotidien Resend atteint (' + QUOTA_JOUR + ' courriels par jour) : le reste est reporté. Reprenez demain.'
        : 'Quota mensuel Resend atteint (' + QUOTA_MOIS + ' courriels par mois) : le reste est reporté au mois prochain.';
      const a = await store.lire(lot.id);
      for (const x of a.items.filter((y) => y.statut === 'attente')) {
        await store.majItem(lot.id, x.id, { statut: 'reporte', code: 'QUOTA_' + arretQuota.toUpperCase(), detail: motif });
      }
      await store.majLot(lot.id, { statut: 'quota', note: motif });
    } else if (fatal) {
      await store.majLot(lot.id, { statut: 'arrete', note: fatal.detail });
    } else {
      const a = await store.lire(lot.id);
      const c = compter(a.items);
      if (!c.attente && !c.en_cours) await store.majLot(lot.id, { statut: 'termine', note: '' });
    }
    return rendre(lot, fatal ? { arret: { code: fatal.code, message: fatal.detail } } : undefined);
  }

  return reponseErreur(repondre, 'MODE_INCONNU', 400, 'Mode de lot inconnu.');
}
