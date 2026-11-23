// ═══════════════════════════════════════════════════════════════
// /api/ecoute — une agence a écouté un lien reçu par courriel.
//
// POST { ec: <jeton>, oeuvre: <titre>, secondes: <durée> }
// Appelé une fois par la page d'écoute, après 20 s de lecture.
// Ni cookie, ni pixel, ni adresse IP conservée : une ligne « Écoute »
// dans le journal de la fiche, gardée 3 ans au plus (voir _ecoute.js).
// Réponse toujours brève, sans dire si le jeton correspond à une fiche.
// ═══════════════════════════════════════════════════════════════

import { entetesOrigine, origineAutorisee, entetesService, tropSouvent } from './_courrier.js';
import { lireJeton, journalAvecEcoute } from './_ecoute.js';

const SB_URL = () => (process.env.SUPABASE_URL || 'https://lgqmfzbxceitddrqqfdf.supabase.co').replace(/\/+$/, '');

function corpsDe(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b && typeof b === 'object' ? b : {};
}

function fin(res, status, o) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(o));
}

export default async function handler(req, res) {
  entetesOrigine(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return fin(res, 405, { ok: false });
  const o = req.headers && (req.headers.origin || req.headers.Origin);
  if (o && !origineAutorisee(req)) return fin(res, 403, { ok: false });

  const b = corpsDe(req);
  const siret = lireJeton(b.ec);
  if (!siret) return fin(res, 400, { ok: false, code: 'JETON' });
  const service = entetesService({ 'Content-Type': 'application/json' });
  if (!service) return fin(res, 503, { ok: false, code: 'NOT_CONFIGURED' });
  if (await tropSouvent('ecoute:' + siret, 30, 3600_000)) return fin(res, 429, { ok: false, code: 'RATE_LIMIT' });

  try {
    const r = await fetch(SB_URL() + '/rest/v1/prospects?select=owner,siret,journal&siret=eq.' + siret, { headers: service });
    const lignes = r.ok ? await r.json() : [];
    let ecrites = 0;
    for (const p of Array.isArray(lignes) ? lignes : []) {
      const { journal } = journalAvecEcoute(p.journal, { oeuvre: b.oeuvre, secondes: b.secondes });
      const w = await fetch(SB_URL() + '/rest/v1/prospects?siret=eq.' + siret + '&owner=eq.' + encodeURIComponent(p.owner), {
        method: 'PATCH', headers: Object.assign({ Prefer: 'return=minimal' }, service),
        body: JSON.stringify({ journal, updated_at: new Date().toISOString() })
      });
      if (w.ok) ecrites++;
    }
    return fin(res, 200, { ok: true, n: ecrites ? 1 : 0 });
  } catch (e) {
    return fin(res, 200, { ok: false });
  }
}
