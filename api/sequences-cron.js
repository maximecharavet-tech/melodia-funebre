/**
 * /api/sequences-cron — Envoi automatique des étapes de séquence dues.
 *
 * NE FAIT RIEN si `SEQUENCES_AUTO` n'est pas exactement « true » (défaut :
 * désactivé). Cette sémantique ne change pas. Quand le drapeau est à
 * « true », le cron ENVOIE réellement — il ne se contente plus de préparer.
 *
 * ── AUTHENTIFICATION ─────────────────────────────────────────────────
 *   `Authorization: Bearer <CRON_SECRET>` (Vercel Cron l'ajoute tout seul
 *   dès que CRON_SECRET existe). L'en-tête `x-vercel-cron` seul ne suffit
 *   plus : il se fabrique à la main, et il déclenche désormais de vrais
 *   envois. Sans CRON_SECRET : refus.
 *
 * ── LE PIPELINE, UNE INSCRIPTION À LA FOIS ───────────────────────────
 *   1. lit les inscriptions actives dont `prochaine_le <= maintenant` ;
 *   2. sort de la séquence si le prospect est opposé, rejeté, a répondu,
 *      est passé « intéressé / démo / partenaire / refus », ou n'a pas
 *      d'adresse valable (statut « sortie », motif lisible) ;
 *   3. VERROUILLE l'inscription (PATCH conditionnel sur l'ancienne
 *      `prochaine_le`, +15 min) : un second cron simultané n'obtient rien ;
 *   4. envoie par la route /api/prospect-mail (jamais Resend en direct) :
 *      session simulée du propriétaire, rôle relu en base, STOP et
 *      désabonnés respectés, clé d'idempotence (destinataire + modèle +
 *      étape) → un seul courriel, même si 3 crons se marchent dessus ;
 *   5. succès ou « déjà envoyé » → l'étape avance (ou la séquence se
 *      termine) ; une étape « appel » crée une tâche, rien n'est envoyé ;
 *   6. échec réessayable → nouvel essai espacé (1 h, 4 h, 12 h), 3 essais
 *      puis PAUSE avec le motif ; résultat incertain (délai dépassé) →
 *      PAUSE immédiate, à vérifier dans Resend : on ne renvoie jamais à
 *      l'aveugle.
 *
 * ── CE QUI N'EXISTE PAS ──────────────────────────────────────────────
 *   Aucun plafond quotidien. Anti-rafale seulement : traitement en série
 *   (la cadence Resend ~2 req/s est dans _courrier.js), un budget de
 *   temps par exécution et un nombre maximum d'inscriptions par passage.
 *   Le reste attend le passage suivant.
 *
 * ── JOURNAL ──────────────────────────────────────────────────────────
 *   Chaque envoi laisse sa ligne dans public.envois_prospect (sequence_id,
 *   etape) ; chaque exécution écrit une ligne console (inscription,
 *   décision) et renvoie le détail en JSON.
 *
 * ── CRON UTC ─────────────────────────────────────────────────────────
 *   07:40 UTC = 08:40 Paris l'hiver, 09:40 l'été. Le décalage est bénin.
 *
 * Variables (noms uniquement) :
 *   SEQUENCES_AUTO · CRON_SECRET · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY ·
 *   SITE_URL (+ celles de /api/prospect-mail)
 */
import { origineAutorisee, entetesOrigine, entetesService, tropSouvent, SITE } from './_courrier.js';
import { timingSafeEqual } from 'crypto';
import mailHandler from './prospect-mail.js';

export const config = { runtime: 'nodejs', maxDuration: 60 };

const MAX_PAR_PASSAGE = 80;
const BUDGET_MS = 45_000;
const VERROU_MS = 15 * 60_000;
const ESSAIS_MAX = 3;
const PAUSES_ESSAI_H = [1, 4, 12];
const STATUTS_SORTIE = ['interesse', 'demo_offerte', 'partenaire', 'refus'];
const RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sbUrl() { return (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, ''); }

function reponse(res, status, corps) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(corps));
}

export function secretValide(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const a = Buffer.from(String((req.headers || {}).authorization || ''));
  const b = Buffer.from('Bearer ' + secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function sb(chemin, { methode = 'GET', corps, retour } = {}) {
  const h = entetesService({ 'Content-Type': 'application/json', Prefer: retour ? 'return=representation' : 'return=minimal' });
  if (!h) return { ok: false, status: 0, data: null };
  try {
    const r = await fetch(sbUrl() + '/rest/v1/' + chemin, { method: methode, headers: h, body: corps ? JSON.stringify(corps) : undefined });
    let data = null;
    const t = await r.text();
    try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
    return { ok: r.ok, status: r.status, data };
  } catch (e) { return { ok: false, status: 0, data: null }; }
}

/* Lundi-vendredi à Paris : un samedi ou un dimanche passe au lundi. */
export function sansWeekEnd(ms) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short' });
  let t = ms;
  for (let i = 0; i < 3; i++) {
    const j = f.format(new Date(t));
    if (j === 'Sat') t += 2 * 86400_000; else if (j === 'Sun') t += 86400_000; else break;
  }
  return t;
}

/** Échéance de l'étape `idx` : début + jour de l'étape, jamais avant demain, jamais un week-end. */
export function echeanceEtape(etapes, idx, debutIso, maintenantMs) {
  const e = etapes[idx] || {};
  const debut = new Date(debutIso).getTime();
  const base = Number.isFinite(debut) ? debut + Number(e.jour || 0) * 86400_000 : maintenantMs + 86400_000;
  return sansWeekEnd(Math.max(base, maintenantMs + 86400_000));
}

/** Pourquoi cette inscription doit-elle sortir de la séquence ? (null = elle continue) */
export function motifSortie(prospect, etapes, idx) {
  if (!prospect) return 'Prospect introuvable';
  if (prospect.oppose) return 'S’est opposé';
  if (prospect.rejete) return 'Adresse rejetée';
  if (prospect.a_repondu_le) return 'A répondu';
  if (STATUTS_SORTIE.includes(String(prospect.statut || ''))) return 'Statut ' + prospect.statut;
  if (idx >= etapes.length) return 'Fin de séquence';
  return null;
}

function essaisDeja(inscription) {
  const m = String(inscription.motif_sortie || '').match(/^Nouvel essai (\d+)\/\d+/);
  return m ? Number(m[1]) : 0;
}

/** Envoie par /api/prospect-mail, sans HTTP : même code, mêmes garde-fous. */
async function envoyerViaRoute(owner, charge) {
  const req = {
    method: 'POST',
    headers: {
      origin: SITE,
      authorization: 'Bearer ' + process.env.CRON_SECRET,
      'x-melodia-sequence-owner': owner
    },
    body: charge
  };
  const res = { statusCode: 200, corps: null, setHeader() {}, end() { return res; } };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.corps = o; return res; };
  await mailHandler(req, res);
  return { status: res.statusCode, corps: res.corps || {} };
}

/**
 * Traite les échéances. Exportée pour les tests ; l'entrée HTTP est plus bas.
 */
export async function traiterEcheances({ maintenant = Date.now(), budgetMs = BUDGET_MS, envoyer = envoyerViaRoute } = {}) {
  const t0 = Date.now();
  const bilan = { traitees: 0, envoyees: 0, dejaEnvoyees: 0, appels: 0, sorties: 0, reportees: 0, pauses: 0, verrouillees: 0, restantes: 0, details: [] };
  const note = (ins, decision, extra) => {
    bilan.details.push(Object.assign({ inscription: ins.id, prospect: ins.prospect_siret, etape: ins.etape, decision }, extra || {}));
    console.log('[sequences-cron] inscription ' + ins.id + ' étape ' + ins.etape + ' → ' + decision + (extra && extra.motif ? ' (' + extra.motif + ')' : ''));
  };

  const iso = new Date(maintenant).toISOString();
  const lu = await sb('sequence_inscriptions?select=*&statut=eq.active&prochaine_le=lte.' + encodeURIComponent(iso) +
    '&order=prochaine_le.asc&limit=' + (MAX_PAR_PASSAGE + 1));
  const inscriptions = Array.isArray(lu.data) ? lu.data : [];
  if (inscriptions.length > MAX_PAR_PASSAGE) bilan.restantes = inscriptions.length - MAX_PAR_PASSAGE;
  const dues = inscriptions.slice(0, MAX_PAR_PASSAGE);
  if (!dues.length) return bilan;

  const seqIds = [...new Set(dues.map((i) => Number(i.sequence_id)).filter(Number.isFinite))];
  const seqs = await sb('sequences?select=id,etapes,actif,nom&id=in.(' + seqIds.join(',') + ')');
  const parSeq = {};
  (Array.isArray(seqs.data) ? seqs.data : []).forEach((s) => { parSeq[String(s.id)] = s; });
  const sirets = [...new Set(dues.map((i) => String(i.prospect_siret || '').replace(/[^0-9A-Za-z]/g, '')).filter(Boolean))];
  const pr = await sb('prospects?select=*&siret=in.(' + sirets.map((s) => '"' + s + '"').join(',') + ')');
  const parSiret = {};
  (Array.isArray(pr.data) ? pr.data : []).forEach((p) => { parSiret[String(p.siret)] = p; });

  const maj = (ins, corps) => sb('sequence_inscriptions?id=eq.' + ins.id, { methode: 'PATCH', corps: Object.assign({ updated_at: new Date().toISOString() }, corps) });

  for (let k = 0; k < dues.length; k++) {
    if (Date.now() - t0 > budgetMs) { bilan.restantes += dues.length - k; break; }
    const ins = dues[k];
    bilan.traitees++;
    const seq = parSeq[String(ins.sequence_id)];
    const etapes = seq && Array.isArray(seq.etapes) ? seq.etapes : [];
    const idx = Number(ins.etape || 0);
    const prospect = parSiret[String(ins.prospect_siret)];

    if (!seq || seq.actif === false) {
      await maj(ins, { statut: 'pause', motif_sortie: 'Séquence désactivée' });
      bilan.pauses++; note(ins, 'pause', { motif: 'séquence désactivée' }); continue;
    }
    const sortie = motifSortie(prospect, etapes, idx);
    if (sortie) {
      const fin = sortie === 'Fin de séquence';
      await maj(ins, { statut: fin ? 'terminee' : 'sortie', motif_sortie: sortie });
      bilan.sorties++; note(ins, fin ? 'terminee' : 'sortie', { motif: sortie }); continue;
    }

    /* Verrou optimiste : seule l'exécution qui change `prochaine_le` la première continue. */
    const verrou = await sb('sequence_inscriptions?id=eq.' + ins.id + '&statut=eq.active&prochaine_le=eq.' + encodeURIComponent(ins.prochaine_le),
      { methode: 'PATCH', retour: true, corps: { prochaine_le: new Date(maintenant + VERROU_MS).toISOString(), updated_at: iso } });
    if (!verrou.ok || !Array.isArray(verrou.data) || verrou.data.length !== 1) {
      bilan.verrouillees++; note(ins, 'ignorée', { motif: 'prise par une autre exécution' }); continue;
    }

    const etape = etapes[idx] || {};
    const suite = async (extra) => {
      const next = idx + 1;
      if (next >= etapes.length) { await maj(ins, Object.assign({ etape: next, statut: 'terminee', motif_sortie: 'Fin de séquence' }, extra)); }
      else { await maj(ins, Object.assign({ etape: next, prochaine_le: new Date(echeanceEtape(etapes, next, ins.created_at, maintenant)).toISOString(), motif_sortie: '' }, extra)); }
    };

    if (String(etape.canal || 'mail') === 'appel') {
      await sb('taches', { methode: 'POST', corps: { owner: ins.owner, prospect_siret: ins.prospect_siret, type: 'appel',
        du_le: iso, payload: { sequence_id: ins.sequence_id, etape: idx, modele: etape.modele || '' } } });
      await suite();
      bilan.appels++; note(ins, 'appel à passer (tâche créée)'); continue;
    }

    const adresse = String(prospect.email || '').trim();
    if (!RE_MAIL.test(adresse)) {
      await maj(ins, { statut: 'sortie', motif_sortie: 'Adresse e-mail manquante ou invalide' });
      bilan.sorties++; note(ins, 'sortie', { motif: 'adresse invalide' }); continue;
    }
    if (!etape.modele) {
      await maj(ins, { statut: 'pause', motif_sortie: 'Étape sans modèle' });
      bilan.pauses++; note(ins, 'pause', { motif: 'étape sans modèle' }); continue;
    }

    const r = await envoyer(String(ins.owner || '').toLowerCase(), {
      mode: 'envoi',
      modele: etape.modele,
      brochures: Array.isArray(etape.brochures) ? etape.brochures : [],
      joindreBrochure: Array.isArray(etape.brochures) && etape.brochures.length > 0,
      sequence_id: ins.sequence_id,
      etape: idx,
      envois: [{
        to: adresse, ref: String(prospect.siret || ''),
        nom: prospect.dirigeant || '', societe: prospect.enseigne || prospect.nom || '',
        ville: prospect.ville || '', accroche: prospect.accroche || ''
      }]
    });
    const c = r.corps || {};
    const refus = Array.isArray(c.refuses) ? c.refuses[0] : null;

    if (r.status === 200 && Array.isArray(c.envoyes) && c.envoyes.length) {
      await suite();
      bilan.envoyees++; note(ins, 'envoyé', { id: c.envoyes[0].id });
    } else if (refus && refus.code === 'DEJA_ENVOYE') {
      await suite();
      bilan.dejaEnvoyees++; note(ins, 'déjà envoyé : étape avancée sans renvoi');
    } else if (refus && (refus.code === 'DESABONNE' || refus.code === 'REJETE')) {
      await maj(ins, { statut: 'sortie', motif_sortie: refus.code === 'DESABONNE' ? 'S’est désabonné' : 'Adresse rejetée' });
      bilan.sorties++; note(ins, 'sortie', { motif: refus.code });
    } else if (c.code === 'ENVOI_INCERTAIN') {
      await maj(ins, { statut: 'pause', motif_sortie: 'Envoi incertain : vérifier dans Resend avant de reprendre' });
      bilan.pauses++; note(ins, 'pause', { motif: 'envoi incertain' });
    } else if (c.retentable || r.status === 429 || r.status === 502 || r.status === 503 || r.status === 500) {
      const n = essaisDeja(ins) + 1;
      if (n >= ESSAIS_MAX || r.status === 503 && c.code === 'NOT_CONFIGURED' || c.code === 'NON_CONNECTE' || c.code === 'INTERDIT') {
        await maj(ins, { statut: 'pause', motif_sortie: 'Échec d’envoi (' + (c.code || r.status) + ') : à reprendre à la main' });
        bilan.pauses++; note(ins, 'pause', { motif: c.code || String(r.status) });
      } else {
        await maj(ins, { prochaine_le: new Date(maintenant + PAUSES_ESSAI_H[n - 1] * 3600_000).toISOString(),
          motif_sortie: 'Nouvel essai ' + n + '/' + ESSAIS_MAX + ' : ' + (c.code || r.status) });
        bilan.reportees++; note(ins, 'reportée', { motif: (c.code || r.status) + ', essai ' + n });
      }
    } else {
      await maj(ins, { statut: 'pause', motif_sortie: 'Refus : ' + (refus ? refus.motif : (c.error || r.status)) });
      bilan.pauses++; note(ins, 'pause', { motif: refus ? refus.code : String(r.status) });
    }
  }
  return bilan;
}

export default async function handler(req, res) {
  entetesOrigine(req, res, 'GET, POST');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  /* Le cron de Vercel n'envoie pas d'en-tête Origin ; les appels navigateur, eux, sont filtrés. */
  const o = req.headers && (req.headers.origin || req.headers.Origin);
  if (o && !origineAutorisee(req)) return reponse(res, 403, { ok: false, code: 'ORIGINE', message: 'Origine refusée.' });

  if (process.env.SEQUENCES_AUTO !== 'true') {
    return reponse(res, 200, { ok: false, code: 'DESACTIVE', message: 'SEQUENCES_AUTO désactivé : rien n’est envoyé.' });
  }
  if (!secretValide(req)) return reponse(res, 401, { ok: false, code: 'SECRET', message: 'Secret du cron manquant ou invalide.' });
  if (!entetesService()) return reponse(res, 503, { ok: false, code: 'NOT_CONFIGURED', message: 'Base non configurée.' });

  if (await tropSouvent('cron:sequences', 12, 3600_000)) {
    return reponse(res, 429, { ok: false, code: 'RATE_LIMIT', message: 'Trop d’exécutions.' });
  }
  const bilan = await traiterEcheances();
  return reponse(res, 200, Object.assign({ ok: true }, bilan));
}
