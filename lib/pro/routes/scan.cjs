// POST /api/pro/scan { j } — PUBLIC. Compteur d'ouvertures anonyme.
// Aucune adresse IP, aucun identifiant n'est conservé : seul un total par jeton.
'use strict';
const { ok } = require('../socle.cjs');
const { noyau } = require('../noyau.cjs');

async function scan(rq, ctx) {
  const j = String((rq.corps || {}).j || '').toUpperCase();
  const k = await noyau();
  if (!k.jetonValider({ jeton: j }).valide) return ok({});
  // Incrément atomique côté base si la fonction existe ; sinon lecture-écriture.
  try {
    await ctx.depot.rpc('pro_compter_scan', { p_jeton: j });
  } catch (e) {
    const q = (await ctx.depot.select('pro_qr', { jeton: j, actif: true }, { limite: 1 }))[0];
    if (q) await ctx.depot.update('pro_qr', { id: q.id }, { scans: (q.scans || 0) + 1 });
  }
  return ok({});
}
scan.nom = 'scan';

module.exports = scan;
