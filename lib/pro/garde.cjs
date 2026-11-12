// ═══════════════════════════════════════════════════════════════
// Garde des trois routes de génération historiques
// (generate-lyrics, generate-music, music-status).
//
// Jusqu'au 11/11/2026 elles n'avaient AUCUNE authentification et
// répondaient « Access-Control-Allow-Origin: * » : n'importe qui pouvait
// dépenser les crédits des fournisseurs depuis n'importe quel site.
//
// Désormais : JWT Supabase obligatoire, rôle maison (master ou atelier —
// l'Atelier de dashboard-master), CORS par liste blanche, limite de débit,
// et messages d'erreur sans nom de fournisseur. Les agences passent par
// /api/pro/* (dossier payé ou essai accordé, file de travaux).
// ═══════════════════════════════════════════════════════════════
'use strict';

const { poserCors, origineAutorisee, jetonDe, roleMaison, contexteProduction, limiteMemoire, blanchir, MAISON } = require('./socle.cjs');

function blanchirObjet(o) {
  if (!o || typeof o !== 'object') return o;
  const r = Array.isArray(o) ? [] : {};
  for (const [k, v] of Object.entries(o)) {
    if (k === 'provider' || k === 'model' || k === 'trace_id' || k === 'detail') continue;
    r[k] = typeof v === 'string' ? blanchir(v) : (v && typeof v === 'object' ? blanchirObjet(v) : v);
  }
  return r;
}

/**
 * Rend l'utilisateur si la requête peut passer, sinon répond et rend null.
 * opts : { methodes: 'POST', max: 20, fenetreMs: 60000, ctx (tests) }
 */
async function garder(req, res, opts = {}) {
  const methodes = opts.methodes || 'POST';
  poserCors(req, res, methodes);
  res.setHeader('Cache-Control', 'no-store');
  const json = res.json.bind(res);
  res.json = (o) => json(blanchirObjet(o));
  if (req.method === 'OPTIONS') { res.status(204).end(); return null; }
  const o = req.headers && req.headers.origin;
  if (o && !origineAutorisee(o)) { res.status(403).json({ error: 'Origine non autorisée.', code: 'ORIGINE' }); return null; }
  const ctx = opts.ctx || contexteProduction();
  const u = await ctx.verifierJeton(jetonDe(req));
  if (!u) { res.status(401).json({ error: 'Connectez-vous pour continuer.', code: 'NON_CONNECTE' }); return null; }
  if (!ctx.depot) { res.status(503).json({ error: 'Le service n’est pas encore configuré.', code: 'NON_CONFIGURE' }); return null; }
  u.roleMaison = await roleMaison(ctx, u.email);
  if (!MAISON.includes(u.roleMaison)) {
    res.status(403).json({ error: 'Réservé à l’atelier de la maison.', code: 'RESERVE_MAISON' });
    return null;
  }
  const limite = ctx.limite || limiteMemoire;
  if (await limite((opts.nom || 'gen') + ':' + u.id, opts.max || 20, opts.fenetreMs || 60_000)) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ error: 'Trop de demandes rapprochées. Patientez une minute.', code: 'TROP_SOUVENT' });
    return null;
  }
  return u;
}

module.exports = { garder };
