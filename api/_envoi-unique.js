// ═══════════════════════════════════════════════════════════════
// api/_envoi-unique.js — Un même courriel ne part jamais deux fois
//
// RÈGLE : le même modèle / la même campagne / la même étape de séquence
// ne peut JAMAIS être remis deux fois à la même personne. La source de
// vérité est le serveur, et au sein du serveur, la base : une clé
// d'idempotence UNIQUE (public.envois_prospect.cle_idempotence,
// migration 20261114_12). Un double clic, un nouvel essai, un cron
// concurrent, un onglet en double : un seul gagne l'insertion, seul le
// gagnant appelle Resend.
//
// ─── LE PROTOCOLE « RÉSERVER, ENVOYER, CONFIRMER » ───
//   1. réserver   INSERT … ON CONFLICT DO NOTHING : atomique. Les lignes
//                 déjà prises sont renvoyées comme doublons, SANS envoi.
//   2. envoyer    appel Resend, seulement pour les lignes réservées.
//   3. confirmer  la ligne passe à « envoye » avec l'identifiant Resend.
//
// En cas d'échec de l'étape 2 :
//   · réponse d'erreur nette du prestataire (4xx / 5xx, clé, quota) ou
//     rien n'est parti : la réservation est LIBÉRÉE (statut « echec »,
//     clé retirée) → un nouvel essai est permis ;
//   · délai dépassé (TIMEOUT) : on ne sait pas si le message est parti.
//     La ligne reste « incertain » et BLOQUE le renvoi — on préfère
//     manquer un envoi que le doubler. À vérifier dans Resend.
//
// ─── REPLI ───
//   · pas de clé de service (développement) : magasin mémoire de
//     l'instance (atomique dans le processus) ;
//   · migration 12 absente (colonne inconnue) : magasin mémoire +
//     lecture du journal existant avant l'envoi. Ce mode n'est PAS
//     atomique entre instances : c'est la migration qui l'apporte ;
//   · base de données en panne : on REFUSE l'envoi (JOURNAL_INDISPONIBLE)
//     plutôt que de risquer un doublon.
//
// Le préfixe « _ » : Vercel n'expose pas cette route.
// ═══════════════════════════════════════════════════════════════

import { createHash } from 'crypto';

export const STATUTS_BLOQUANTS = ['reserve', 'incertain', 'envoye', 'delivre', 'ouvert', 'clique', 'differe', 'rejete', 'plainte'];

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
// synchrones, aucune attente entre les deux.
export function creerStoreMemoire() {
  const lignes = new Map(); // cle → { id, statut, resend_id }
  let seq = 0;
  return {
    nom: 'memoire',
    persistant: false,
    lignes,
    async reserver(items) {
      return items.map((it) => {
        const ex = lignes.get(it.cle);
        if (ex && STATUTS_BLOQUANTS.indexOf(ex.statut) !== -1) return { ok: false, deja: ex.statut };
        const id = 'm' + (++seq);
        lignes.set(it.cle, { id, statut: 'reserve', resend_id: null, meta: it.meta });
        return { ok: true, id };
      });
    },
    async confirmer(it, resendId) {
      const l = lignes.get(it.cle); if (l && l.id === it.id) { l.statut = 'envoye'; l.resend_id = resendId || null; }
    },
    async liberer(it) {
      const l = lignes.get(it.cle); if (l && l.id === it.id) lignes.delete(it.cle);
    },
    async incertain(it) {
      const l = lignes.get(it.cle); if (l && l.id === it.id) l.statut = 'incertain';
    },
    async dejaEnvoyes(cles) {
      const out = {};
      cles.forEach((c) => { const l = lignes.get(c); if (l && STATUTS_BLOQUANTS.indexOf(l.statut) !== -1) out[c] = l.statut; });
      return out;
    }
  };
}

// ─── Magasin Supabase (PostgREST) ─────────────────────────────────
function colonneAbsente(status, texte) {
  return (status === 400 || status === 404) && /PGRST204|42703|cle_idempotence|column .* does not exist/i.test(texte || '');
}
function tableAbsente(status, texte) {
  return (status === 404 || status === 400) && /42P01|PGRST205|envois_prospect/i.test(texte || '') && !/cle_idempotence/i.test(texte || '');
}

/* Colonnes présentes AVANT la migration 12 (mode dégradé). */
const COLONNES_ANCIENNES = ['collaborateur', 'mode', 'destinataire', 'sujet', 'modele', 'ref', 'societe', 'piece_jointe'];
export function ligneAncienne(meta) {
  const o = {};
  COLONNES_ANCIENNES.forEach((k) => { if (meta && meta[k] !== undefined) o[k] = meta[k]; });
  return o;
}

export function creerStoreSupabase({ url, entetes, repli }) {
  const base = url + '/rest/v1/envois_prospect';
  const memoire = repli || creerStoreMemoire();
  let degrade = false; // migration 12 absente
  const H = (extra) => Object.assign({ 'Content-Type': 'application/json' }, entetes(), extra || {});

  /* Mode dégradé : lit le journal existant (colonnes d'avant la migration 12)
     pour reconnaître ce qui est déjà parti, et garde la prise en mémoire. */
  async function lireJournal(destinataires) {
    const liste = [...new Set(destinataires.map(normaliserEmail))].filter(Boolean);
    if (!liste.length) return [];
    const q = '?select=destinataire,modele,sujet,statut,mode&mode=eq.envoi&limit=2000&destinataire=in.(' +
      liste.map((d) => '"' + d.replace(/"/g, '') + '"').join(',') + ')';
    const r = await fetch(base + q, { headers: H() });
    if (!r.ok) throw Object.assign(new Error('journal ' + r.status), { status: r.status });
    return r.json();
  }

  const store = {
    nom: 'supabase',
    get persistant() { return !degrade; },
    get degrade() { return degrade; },
    async reserver(items) {
      if (!degrade) {
        const lignes = items.map((it) => Object.assign({}, it.meta, { cle_idempotence: it.cle, statut: 'reserve' }));
        let r;
        try {
          r = await fetch(base + '?on_conflict=cle_idempotence', {
            method: 'POST',
            headers: H({ Prefer: 'resolution=ignore-duplicates,return=representation' }),
            body: JSON.stringify(lignes)
          });
        } catch (e) { throw Object.assign(new Error('JOURNAL_INDISPONIBLE'), { code: 'JOURNAL_INDISPONIBLE' }); }
        if (r.ok) {
          const prises = await r.json();
          const parCle = {};
          (Array.isArray(prises) ? prises : []).forEach((p) => { parCle[p.cle_idempotence] = p; });
          return items.map((it) => (parCle[it.cle] ? { ok: true, id: parCle[it.cle].id } : { ok: false, deja: 'envoye' }));
        }
        const texte = await r.text().catch(() => '');
        if (colonneAbsente(r.status, texte)) degrade = true;
        else throw Object.assign(new Error('JOURNAL_INDISPONIBLE ' + r.status), { code: 'JOURNAL_INDISPONIBLE' });
      }
      /* Dégradé : journal existant (lecture) + verrou mémoire. */
      let existant;
      try { existant = await lireJournal(items.map((it) => it.meta.destinataire)); }
      catch (e) { throw Object.assign(new Error('JOURNAL_INDISPONIBLE'), { code: 'JOURNAL_INDISPONIBLE' }); }
      const connus = new Set(existant.filter((l) => STATUTS_BLOQUANTS.indexOf(l.statut) !== -1)
        .map((l) => cleEnvoi({ destinataire: l.destinataire, modele: l.modele, sujet: l.sujet })));
      const aPrendre = items.filter((it) => !connus.has(it.cle));
      const res = await memoire.reserver(aPrendre);
      let k = 0;
      return items.map((it) => (connus.has(it.cle) ? { ok: false, deja: 'envoye' } : res[k++]));
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
      await patch(it, { statut: 'envoye', resend_id: resendId || null, envoye_le: new Date().toISOString() });
    },
    async liberer(it) {
      if (degrade) return memoire.liberer(it);
      await patch(it, { statut: 'echec', cle_idempotence: null });
    },
    async incertain(it) {
      if (degrade) return memoire.incertain(it);
      await patch(it, { statut: 'incertain' });
    },
    async dejaEnvoyes(cles, destinataires) {
      const out = {};
      const dest = destinataires || cles.map((c) => c.split('|')[0]);
      let existant = [];
      try {
        if (!degrade) {
          const liste = [...new Set(dest.map(normaliserEmail))].filter(Boolean);
          if (liste.length) {
            const r = await fetch(base + '?select=cle_idempotence,statut&cle_idempotence=in.(' +
              cles.map((c) => '"' + c.replace(/"/g, '') + '"').join(',') + ')', { headers: H() });
            if (r.ok) (await r.json()).forEach((l) => { if (STATUTS_BLOQUANTS.indexOf(l.statut) !== -1) out[l.cle_idempotence] = l.statut; });
            else if (colonneAbsente(r.status, await r.text().catch(() => ''))) degrade = true;
          }
        }
        if (degrade) {
          existant = await lireJournal(dest);
          existant.forEach((l) => {
            if (STATUTS_BLOQUANTS.indexOf(l.statut) === -1) return;
            const c = cleEnvoi({ destinataire: l.destinataire, modele: l.modele, sujet: l.sujet });
            if (cles.indexOf(c) !== -1) out[c] = l.statut;
          });
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
  void tableAbsente;
  return store;
}

/**
 * Réserve, envoie, confirme.
 *
 * @param store    magasin (memoire / supabase)
 * @param lignes   [{ cle, meta, charge }] — meta : champs du journal
 * @param envoyer  async (charges, cleResendStr) → { ok, ids } | { ok:false, code, status, error, motif }
 * @returns { envoyes:[{ligne, id}], doublons:[{ligne, deja}], echec:null|{...,incertain} }
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
    else doublons.push({ ligne: l, deja: (prises[i] && prises[i].deja) || 'envoye' });
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
