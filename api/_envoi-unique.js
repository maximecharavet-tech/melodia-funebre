// ═══════════════════════════════════════════════════════════════
// api/_envoi-unique.js — Un même courriel ne part pas deux fois en 60 jours
//
// RÈGLE (décision du fondateur) : le même modèle / la même campagne / la
// même étape de séquence ne peut pas être remis deux fois à la même
// adresse normalisée pendant FENETRE_JOURS = 60 jours. Passé ce délai, un
// nouvel envoi est permis (nouvelle ligne : l'historique n'est pas réécrit).
// La source de vérité est le serveur, et au sein du serveur, la base :
// la fonction public.reserver_envois (migration 20261114_12) pose un verrou
// consultatif sur la clé, lit les envois bloquants des 60 derniers jours et
// insère la réservation dans la même transaction ; une contrainte
// d'exclusion (btree_gist) refuse en plus tout chevauchement de fenêtres.
// Un double clic, un nouvel essai, un cron concurrent, un onglet en double :
// un seul gagne la réservation, seul le gagnant appelle Resend.
//
// ─── LE PROTOCOLE « RÉSERVER, ENVOYER, CONFIRMER » ───
//   1. réserver   reserver_envois(…) : atomique. Les lignes déjà prises dans
//                 la fenêtre sont renvoyées comme doublons (avec la date du
//                 précédent et la date de renvoi possible), SANS envoi.
//   2. envoyer    appel Resend, seulement pour les lignes réservées.
//   3. confirmer  la ligne passe à « envoye » avec l'identifiant Resend.
//
// En cas d'échec de l'étape 2 :
//   · réponse d'erreur nette du prestataire (4xx / 5xx, clé, quota) ou
//     rien n'est parti : la réservation est LIBÉRÉE (statut « echec », qui
//     ne bloque plus) → un nouvel essai est permis tout de suite ;
//   · délai dépassé (TIMEOUT) : on ne sait pas si le message est parti.
//     La ligne reste « incertain » et BLOQUE le renvoi pendant la fenêtre —
//     on préfère manquer un envoi que le doubler. À vérifier dans Resend.
//
// ─── REPLI ───
//   · pas de clé de service (développement) : magasin mémoire de
//     l'instance (atomique dans le processus, même fenêtre de 60 jours) ;
//   · migration 12 absente (fonction inconnue) : magasin mémoire +
//     lecture du journal des 60 derniers jours avant l'envoi. Ce mode n'est
//     PAS atomique entre instances : c'est la migration qui l'apporte ;
//   · base de données en panne : on REFUSE l'envoi (JOURNAL_INDISPONIBLE)
//     plutôt que de risquer un doublon.
//
// Le préfixe « _ » : Vercel n'expose pas cette route.
// ═══════════════════════════════════════════════════════════════

import { createHash } from 'crypto';

export const STATUTS_BLOQUANTS = ['reserve', 'incertain', 'envoye', 'delivre', 'ouvert', 'clique', 'differe', 'rejete', 'plainte'];
/* Statuts d'un envoi « réel » (pour les statistiques) : ni « reserve » ni « echec ». */
export const STATUTS_REELS = ['envoye', 'delivre', 'ouvert', 'clique', 'differe', 'rejete', 'plainte'];

/* ─── La fenêtre : 60 jours ─── */
export const FENETRE_JOURS = 60;
export const FENETRE_MS = FENETRE_JOURS * 24 * 3600 * 1000;

/**
 * Où en est la fenêtre d'un précédent envoi ?
 *   bloque       vrai tant que maintenant < précédent + 60 jours
 *   renvoi       instant (ms) à partir duquel un nouvel envoi est permis
 *   joursRestants  jours entiers restants (arrondi au-dessus), 0 si libre
 * La frontière est nette : à précédent + 60 jours pile, le renvoi est permis.
 * Même règle que la fonction SQL reserver_envois et que le noyau Rust
 * (envoi_fenetre).
 */
export function fenetreEnvoi(precedent, maintenant) {
  const p = precedent instanceof Date ? precedent.getTime() : (typeof precedent === 'number' ? precedent : Date.parse(precedent));
  const m = maintenant == null ? Date.now() : (maintenant instanceof Date ? maintenant.getTime() : (typeof maintenant === 'number' ? maintenant : Date.parse(maintenant)));
  const renvoi = p + FENETRE_MS;
  const bloque = m < renvoi;
  return { bloque, precedent: p, renvoi, joursRestants: bloque ? Math.ceil((renvoi - m) / 86400000) : 0 };
}

/** « 12/11 » ; l'année s'ajoute si elle n'est pas l'année courante (heure de Paris) : « 11/01/2027 ». */
export function dateFr(quand, maintenant) {
  const t = quand instanceof Date ? quand : new Date(quand);
  if (isNaN(t.getTime())) return '';
  const f = (d, o) => new Intl.DateTimeFormat('fr-FR', Object.assign({ timeZone: 'Europe/Paris' }, o)).format(d);
  const jm = f(t, { day: '2-digit', month: '2-digit' });
  const an = f(t, { year: 'numeric' });
  const ref = maintenant == null ? new Date() : (maintenant instanceof Date ? maintenant : new Date(maintenant));
  return an === f(ref, { year: 'numeric' }) ? jm : jm + '/' + an;
}

/** Libellé affiché dans la console et dans les motifs de refus. */
export function libelleDeja(info, maintenant) {
  if (!info) return '';
  if (info.statut === 'reserve' || info.statut === 'incertain') {
    return 'Envoi en cours ou à vérifier dans Resend — pas de second envoi avant vérification.';
  }
  const p = dateFr(info.precedent, maintenant), r = dateFr(info.renvoi, maintenant);
  return 'Déjà envoyé le ' + p + ' — renvoi possible à partir du ' + r;
}


export function normaliserEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function normaliserTexte(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
}

/**
 * Clé d'idempotence d'un courriel : destinataire normalisé + portée.
 *   · modèle connu           → « m:<id> »
 *   · sinon une campagne     → « c:<campagne> »
 *   · sinon l'objet          → « o:<objet normalisé> »
 *   · une étape de séquence s'ajoute : « …#e<n> » (la même étape ne part
 *     qu'une fois ; deux étapes distinctes d'un même modèle, si).
 * Foo@Bar.com et foo@bar.com donnent la même clé.
 */
export function cleEnvoi(o) {
  const dest = normaliserEmail(o && o.destinataire);
  const modele = String((o && o.modele) || '').trim().toLowerCase();
  const campagne = String((o && o.campagne) || '').trim().toLowerCase();
  let portee;
  if (modele) portee = 'm:' + modele;
  else if (campagne) portee = 'c:' + campagne;
  else portee = 'o:' + normaliserTexte(o && o.sujet);
  const etape = o && o.etape != null && o.etape !== '' ? Number(o.etape) : null;
  if (etape !== null && Number.isFinite(etape)) portee += '#e' + etape;
  return dest + '|' + portee;
}

/** Clé d'idempotence transmise au prestataire (Idempotency-Key, 24 h). */
export function cleResend(cles) {
  return 'mf-' + createHash('sha256').update([].concat(cles).sort().join('\n')).digest('hex').slice(0, 48);
}

// ─── Magasin mémoire ──────────────────────────────────────────────
// Atomique dans un processus : la vérification et la prise sont
// synchrones, aucune attente entre les deux. Même fenêtre de 60 jours
// que la base (mais NON partagé entre instances).
export function creerStoreMemoire(opts) {
  const maintenant = (opts && opts.maintenant) || Date.now;
  const lignes = new Map(); // cle → { id, statut, resend_id, t } (la plus récente)
  let seq = 0;
  const bloquante = (l) => l && STATUTS_BLOQUANTS.indexOf(l.statut) !== -1 && fenetreEnvoi(l.t, maintenant()).bloque;
  const info = (l) => {
    const f = fenetreEnvoi(l.t, maintenant());
    return { statut: l.statut, precedent: new Date(l.t).toISOString(), renvoi: new Date(f.renvoi).toISOString() };
  };
  return {
    nom: 'memoire',
    persistant: false,
    lignes,
    async reserver(items) {
      return items.map((it) => {
        const ex = lignes.get(it.cle);
        if (bloquante(ex)) { const i = info(ex); return { ok: false, deja: i.statut, precedent: i.precedent, renvoi: i.renvoi }; }
        const id = 'm' + (++seq);
        lignes.set(it.cle, { id, statut: 'reserve', resend_id: null, meta: it.meta, t: maintenant() });
        return { ok: true, id };
      });
    },
    async confirmer(it, resendId) {
      const l = lignes.get(it.cle); if (l && l.id === it.id) { l.statut = 'envoye'; l.resend_id = resendId || null; l.t = maintenant(); }
    },
    async liberer(it) {
      const l = lignes.get(it.cle); if (l && l.id === it.id) lignes.delete(it.cle);
    },
    async incertain(it) {
      const l = lignes.get(it.cle); if (l && l.id === it.id) l.statut = 'incertain';
    },
    async dejaEnvoyes(cles) {
      const out = {};
      cles.forEach((c) => { const l = lignes.get(c); if (bloquante(l)) out[c] = info(l); });
      return out;
    }
  };
}

// ─── Magasin Supabase (PostgREST) ─────────────────────────────────
function colonneAbsente(status, texte) {
  return (status === 400 || status === 404) && /PGRST204|42703|cle_idempotence|column .* does not exist/i.test(texte || '');
}
function fonctionAbsente(status, texte) {
  return (status === 404 || status === 400) && /PGRST202|42883|reserver_envois|could not find the function|does not exist/i.test(texte || '');
}

/* Colonnes présentes AVANT la migration 12 (mode dégradé). */
const COLONNES_ANCIENNES = ['collaborateur', 'mode', 'destinataire', 'sujet', 'modele', 'ref', 'societe', 'piece_jointe'];
export function ligneAncienne(meta) {
  const o = {};
  COLONNES_ANCIENNES.forEach((k) => { if (meta && meta[k] !== undefined) o[k] = meta[k]; });
  return o;
}

export function creerStoreSupabase({ url, entetes, repli, maintenant }) {
  const base = url + '/rest/v1/envois_prospect';
  const maint = maintenant || Date.now;
  const memoire = repli || creerStoreMemoire({ maintenant: maint });
  let degrade = false; // migration 12 absente
  const H = (extra) => Object.assign({ 'Content-Type': 'application/json' }, entetes(), extra || {});
  const depuis = () => new Date(maint() - FENETRE_MS).toISOString();

  /* Mode dégradé : lit le journal des 60 derniers jours (colonnes d'avant la
     migration 12) pour reconnaître ce qui est déjà parti, et garde la prise en mémoire. */
  async function lireJournal(destinataires) {
    const liste = [...new Set(destinataires.map(normaliserEmail))].filter(Boolean);
    if (!liste.length) return [];
    const q = '?select=destinataire,modele,sujet,statut,mode,envoye_le&mode=eq.envoi&limit=2000' +
      '&envoye_le=gt.' + encodeURIComponent(depuis()) +
      '&destinataire=in.(' + liste.map((d) => '"' + d.replace(/"/g, '') + '"').join(',') + ')';
    const r = await fetch(base + q, { headers: H() });
    if (!r.ok) throw Object.assign(new Error('journal ' + r.status), { status: r.status });
    return r.json();
  }
  function connusDuJournal(existant) {
    const connus = new Map();
    existant.forEach((l) => {
      if (STATUTS_BLOQUANTS.indexOf(l.statut) === -1) return;
      const f = fenetreEnvoi(l.envoye_le, maint());
      if (!f.bloque) return;
      const c = cleEnvoi({ destinataire: l.destinataire, modele: l.modele, sujet: l.sujet });
      const ancien = connus.get(c);
      if (!ancien || f.precedent > ancien.t) connus.set(c, { t: f.precedent, statut: l.statut, precedent: new Date(f.precedent).toISOString(), renvoi: new Date(f.renvoi).toISOString() });
    });
    return connus;
  }

  const store = {
    nom: 'supabase',
    get persistant() { return !degrade; },
    get degrade() { return degrade; },
    async reserver(items) {
      if (!degrade) {
        const lignes = items.map((it) => Object.assign({}, it.meta, { cle_idempotence: it.cle }));
        let r;
        try {
          r = await fetch(url + '/rest/v1/rpc/reserver_envois', {
            method: 'POST', headers: H(), body: JSON.stringify({ p_lignes: lignes })
          });
        } catch (e) { throw Object.assign(new Error('JOURNAL_INDISPONIBLE'), { code: 'JOURNAL_INDISPONIBLE' }); }
        if (r.ok) {
          const res = await r.json();
          const parCle = {};
          (Array.isArray(res) ? res : []).forEach((p) => { parCle[p.cle] = p; });
          return items.map((it) => {
            const p = parCle[it.cle];
            if (p && p.ok) return { ok: true, id: p.id };
            return { ok: false, deja: (p && p.deja) || 'envoye', precedent: p && p.precedent ? new Date(p.precedent).toISOString() : null,
              renvoi: p && p.renvoi ? new Date(p.renvoi).toISOString() : null };
          });
        }
        const texte = await r.text().catch(() => '');
        if (fonctionAbsente(r.status, texte) || colonneAbsente(r.status, texte)) degrade = true;
        else throw Object.assign(new Error('JOURNAL_INDISPONIBLE ' + r.status), { code: 'JOURNAL_INDISPONIBLE' });
      }
      /* Dégradé : journal des 60 derniers jours (lecture) + verrou mémoire. */
      let existant;
      try { existant = await lireJournal(items.map((it) => it.meta.destinataire)); }
      catch (e) { throw Object.assign(new Error('JOURNAL_INDISPONIBLE'), { code: 'JOURNAL_INDISPONIBLE' }); }
      const connus = connusDuJournal(existant);
      const aPrendre = items.filter((it) => !connus.has(it.cle));
      const res = await memoire.reserver(aPrendre);
      let k = 0;
      return items.map((it) => {
        const c = connus.get(it.cle);
        return c ? { ok: false, deja: c.statut, precedent: c.precedent, renvoi: c.renvoi } : res[k++];
      });
    },
    async confirmer(it, resendId) {
      if (degrade) {
        await memoire.confirmer(it, resendId);
        /* Dégradé : la ligne de journal est insérée ici (pas de réservation en base). */
        try {
          await fetch(base, { method: 'POST', headers: H({ Prefer: 'return=minimal' }),
            body: JSON.stringify(Object.assign(ligneAncienne(it.meta), { statut: 'envoye', resend_id: resendId || null })) });
        } catch (e) { /* journal indisponible : le verrou mémoire reste */ }
        return;
      }
      await patch(it, { statut: 'envoye', resend_id: resendId || null, envoye_le: new Date(maint()).toISOString() });
    },
    async liberer(it) {
      if (degrade) return memoire.liberer(it);
      /* « echec » ne bloque plus : un nouvel essai est permis tout de suite. */
      await patch(it, { statut: 'echec' });
    },
    async incertain(it) {
      if (degrade) return memoire.incertain(it);
      await patch(it, { statut: 'incertain' });
    },
    /** { cle → { statut, precedent, renvoi } } pour les clés encore bloquées. */
    async dejaEnvoyes(cles, destinataires) {
      const out = {};
      const dest = destinataires || cles.map((c) => c.split('|')[0]);
      try {
        if (!degrade) {
          const liste = [...new Set(dest.map(normaliserEmail))].filter(Boolean);
          if (liste.length) {
            const r = await fetch(base + '?select=cle_idempotence,statut,envoye_le&order=envoye_le.desc' +
              '&statut=in.(' + STATUTS_BLOQUANTS.join(',') + ')' +
              '&envoye_le=gt.' + encodeURIComponent(depuis()) +
              '&cle_idempotence=in.(' + cles.map((c) => '"' + c.replace(/"/g, '') + '"').join(',') + ')', { headers: H() });
            if (r.ok) {
              (await r.json()).forEach((l) => {
                if (STATUTS_BLOQUANTS.indexOf(l.statut) === -1 || out[l.cle_idempotence]) return;
                const f = fenetreEnvoi(l.envoye_le, maint());
                if (f.bloque) out[l.cle_idempotence] = { statut: l.statut, precedent: new Date(f.precedent).toISOString(), renvoi: new Date(f.renvoi).toISOString() };
              });
            } else if (colonneAbsente(r.status, await r.text().catch(() => ''))) degrade = true;
          }
        }
        if (degrade) {
          const connus = connusDuJournal(await lireJournal(dest));
          connus.forEach((v, c) => { if (cles.indexOf(c) !== -1) out[c] = { statut: v.statut, precedent: v.precedent, renvoi: v.renvoi }; });
        }
      } catch (e) { /* lecture impossible : le reste vient de la mémoire */ }
      Object.assign(out, await memoire.dejaEnvoyes(cles));
      return out;
    }
  };

  async function patch(it, corps) {
    const r = await fetch(base + '?id=eq.' + encodeURIComponent(it.id), {
      method: 'PATCH', headers: H({ Prefer: 'return=minimal' }), body: JSON.stringify(corps)
    });
    if (!r.ok) throw Object.assign(new Error('PATCH journal ' + r.status), { status: r.status });
  }
  return store;
}

/**
 * Réserve, envoie, confirme.
 *
 * @param store    magasin (memoire / supabase)
 * @param lignes   [{ cle, meta, charge }] — meta : champs du journal
 * @param envoyer  async (charges, cleResendStr) → { ok, ids } | { ok:false, code, status, error, motif }
 * @returns { envoyes:[{ligne, id}], doublons:[{ligne, deja, precedent?, renvoi?}], echec:null|{...,incertain} }
 */
export async function envoyerUnique({ store, lignes, envoyer }) {
  /* Un doublon DANS le même lot : la première occurrence gagne. */
  const vues = new Set();
  const uniques = [];
  const doublons = [];
  lignes.forEach((l) => {
    if (vues.has(l.cle)) doublons.push({ ligne: l, deja: 'lot' });
    else { vues.add(l.cle); uniques.push(l); }
  });

  const prises = await store.reserver(uniques.map((l) => ({ cle: l.cle, meta: l.meta })));
  const retenues = [];
  uniques.forEach((l, i) => {
    if (prises[i] && prises[i].ok) retenues.push({ ligne: l, it: { cle: l.cle, id: prises[i].id, meta: l.meta } });
    else doublons.push({ ligne: l, deja: (prises[i] && prises[i].deja) || 'envoye',
      precedent: (prises[i] && prises[i].precedent) || null, renvoi: (prises[i] && prises[i].renvoi) || null });
  });
  if (!retenues.length) return { envoyes: [], doublons, echec: null };

  let r;
  try {
    r = await envoyer(retenues.map((x) => x.ligne.charge), cleResend(retenues.map((x) => x.it.cle)));
  } catch (e) {
    r = { ok: false, status: 500, code: 'FETCH_FAILED', error: 'Envoi impossible : ' + e.message };
  }

  if (!r || !r.ok) {
    const incertain = !!r && r.code === 'TIMEOUT';
    for (const x of retenues) {
      try { await (incertain ? store.incertain(x.it) : store.liberer(x.it)); } catch (e) { /* voir journal */ }
    }
    return { envoyes: [], doublons, echec: Object.assign({}, r, { incertain }) };
  }

  const ids = r.ids || [r.id];
  const envoyes = [];
  for (let i = 0; i < retenues.length; i++) {
    const id = ids[i] || null;
    envoyes.push({ ligne: retenues[i].ligne, id });
    /* Si la confirmation échoue, le courriel EST parti : la ligne reste
       « reserve » (bloquante), on ne la libère surtout pas. */
    try { await store.confirmer(retenues[i].it, id); } catch (e) { /* idem */ }
  }
  return { envoyes, doublons, echec: null };
}
