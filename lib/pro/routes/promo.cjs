// POST /api/pro/promo { code } — validation en direct d'un code saisi dans l'app.
// Réponse identique pour un code inconnu, expiré, ou le code maître saisi par
// un compte qui n'y a pas droit.
'use strict';
const { ok } = require('../socle.cjs');
const { codeMaitre, codeStripe } = require('../paiement.cjs');
const { noyau } = require('../noyau.cjs');

const INCONNU = { valide: false, message: 'Ce code n’est pas valide ou a expiré.' };

async function promo(rq, ctx) {
  const code = String((rq.corps || {}).code || '').slice(0, 80);
  const k = await noyau();
  if (!code.trim()) return ok(INCONNU);
  if (await codeMaitre(ctx, rq.utilisateur, code)) {
    return ok({ valide: true, type: 'maitre', remise: { type: 'pourcent', valeur: 10000 }, message: 'Code appliqué : composition offerte.' });
  }
  if (!k.promoNormaliser({ code }).format_valide) return ok(INCONNU);
  let p = null;
  try { p = await codeStripe(ctx, code); } catch (e) { p = null; }
  if (!p) return ok(INCONNU);
  return ok({ valide: true, type: 'promo', code: p.code, remise: p.remise, expire_le: p.expire_le, message: 'Code appliqué.' });
}
promo.nom = 'promo';

module.exports = promo;
