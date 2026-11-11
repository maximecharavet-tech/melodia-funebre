// ═══════════════════════════════════════════════════════════════
// Paiement : code maître, codes promo Stripe, prix serveur.
//
// Décision n° 1 : c'est l'agence partenaire qui paie Melodia.
// Décision n° 7 : code maître — 100 % gratuit, sans limite, réservé au
// propriétaire. Sa valeur vit dans PRO_CODE_MAITRE (variable serveur),
// jamais dans le client ni dans le .wasm. Saisie insensible à la casse et
// aux espaces (« master max »). Comparaison en temps constant. Accepté
// seulement pour un compte maison « master » (ou une adresse listée dans
// PRO_CODE_MAITRE_EMAILS) ; pour tout autre compte, la réponse est
// strictement celle d'un code inconnu : pas d'oracle à interroger.
// ═══════════════════════════════════════════════════════════════

import { egalConstant, auditer } from './socle.mjs';
import { stripe, stripeConfigure } from './fournisseurs.mjs';
import { noyau } from './noyau.mjs';

export async function codeMaitre(ctx, utilisateur, saisie) {
  const attendu = String(ctx.env.PRO_CODE_MAITRE || '');
  if (!attendu || !saisie) return false;
  const k = await noyau();
  const a = k.promoNormaliser({ code: saisie }).strict;
  const b = k.promoNormaliser({ code: attendu }).strict;
  if (!b || !egalConstant(a, b)) return false;
  const emails = String(ctx.env.PRO_CODE_MAITRE_EMAILS || '').toLowerCase().split(/[\s,;]+/).filter(Boolean);
  const proprietaire = utilisateur && (utilisateur.roleMaison === 'master' || emails.includes(String(utilisateur.email || '').toLowerCase()));
  await auditer(ctx, utilisateur, proprietaire ? 'code_maitre_utilise' : 'code_maitre_refuse', null, {});
  return !!proprietaire;
}

/**
 * Cherche un code promo actif chez Stripe. Rend null si inconnu, expiré,
 * épuisé ou si le paiement n'est pas configuré.
 */
export async function codeStripe(ctx, code) {
  if (!stripeConfigure(ctx.env)) return null;
  const k = await noyau();
  const n = k.promoNormaliser({ code });
  if (!n.format_valide) return null;
  const liste = await stripe(ctx.env, 'GET', '/v1/promotion_codes', { code: n.stripe, active: 'true', limit: 1 });
  const p = liste && liste.data && liste.data[0];
  if (!p || !p.active) return null;
  const maintenant = Math.floor(ctx.maintenant().getTime() / 1000);
  if (p.expires_at && p.expires_at < maintenant) return null;
  if (p.max_redemptions && p.times_redeemed >= p.max_redemptions) return null;
  const c = p.coupon || {};
  if (c.valid === false) return null;
  return {
    id: p.id,
    code: p.code,
    remise: c.percent_off != null
      ? { type: 'pourcent', valeur: Math.round(Number(c.percent_off) * 100) }
      : { type: 'montant', valeur: Number(c.amount_off || 0) },
    expire_le: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null
  };
}
