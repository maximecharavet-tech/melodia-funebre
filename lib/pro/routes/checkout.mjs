// POST /api/pro/checkout { dossier_id, code }
//
// Le serveur fait foi pour le montant demandé (prix lu dans pro_offers,
// calculé par le noyau Rust en centimes) ; Stripe fait foi pour le montant
// payé (le webhook le recopie). Seul le webhook passe un dossier à « payé »
// — sauf à 0 € par le code maître, où il n'y a rien à encaisser : le
// serveur enregistre alors directement le paiement (méthode code_maitre).
import { erreur, ok, accesDossier, transition, reglages, nombre, enfiler, auditer } from '../socle.mjs';
import { stripe, stripeConfigure } from '../fournisseurs.mjs';
import { codeMaitre, codeStripe } from '../paiement.mjs';
import { noyau } from '../noyau.mjs';

export function urlSite(env) {
  const p = env.PRO_URL_SITE || (env.VERCEL_ENV === 'production' ? 'https://melodia-funebre.fr' : (env.VERCEL_URL ? 'https://' + env.VERCEL_URL : 'https://melodia-funebre.fr'));
  return String(p).replace(/\/+$/, '');
}

export default async function checkout(rq, ctx) {
  const u = rq.utilisateur;
  const c = rq.corps || {};
  const a = await accesDossier(ctx, u, c.dossier_id, { ecriture: true });
  if (a.erreur) return a.erreur;
  const d = a.dossier;
  if (!['complet', 'en_attente_paiement'].includes(d.status)) {
    return erreur(409, 'ETAT', 'Ce dossier n’est pas prêt pour le paiement.');
  }
  const offre = (await ctx.depot.select('pro_offers', { id: d.offre_id || c.offre_id || '', actif: true }, { limite: 1 }))[0];
  if (!offre) return erreur(400, 'OFFRE', 'Choisissez une offre.');
  const r = await reglages(ctx);
  const k = await noyau();
  const code = String(c.code || '').slice(0, 80);

  // ─── Code maître : 0 €, pas de Stripe ───
  if (code && (await codeMaitre(ctx, u, code))) {
    const p = k.prix({ prix_unitaire_cents: offre.price_cents == null ? 0 : Number(offre.price_cents), code_maitre: true });
    if (!p.ok || p.ttc_cents !== 0) return erreur(500, 'CALCUL', 'Calcul impossible.');
    const t = await transition(ctx, d, 'paye', 'service', u, { paid: true, montant_cents: 0, offre_id: offre.id });
    if (!t.ok) return erreur(409, t.code, 'Ce dossier ne peut pas être réglé maintenant.');
    await ctx.depot.insert('pro_payments', {
      dossier_id: d.id, org_id: d.org_id, methode: 'code_maitre', statut: 'paye', montant_cents: 0, devise: 'eur'
    });
    await enfiler(ctx, d.id, 'paroles', 1, { essai: false });
    await auditer(ctx, u, 'paiement_code_maitre', d.id, {});
    return ok({ gratuit: true, dossier: { id: d.id, status: 'paye' } });
  }

  if (offre.price_cents == null) {
    return erreur(409, 'TARIF_NON_FIXE', 'Le tarif de cette offre n’est pas encore fixé. La maison vous recontactera.');
  }
  if (!stripeConfigure(ctx.env)) {
    return erreur(503, 'PAIEMENT_NON_CONFIGURE', 'Le paiement en ligne n’est pas encore configuré.');
  }

  let promo = null;
  if (code) {
    promo = await codeStripe(ctx, code).catch(() => null);
    if (!promo) return erreur(400, 'CODE_INVALIDE', 'Ce code n’est pas valide ou a expiré.');
  }
  const tva = nombre(r.tva_bp);
  const p = k.prix({ prix_unitaire_cents: Number(offre.price_cents), remise: promo ? promo.remise : null, tva_bp: tva });
  if (!p.ok) return erreur(409, p.erreur, p.message);

  const org = (await ctx.depot.select('pro_orgs', { id: d.org_id }, { limite: 1 }))[0] || {};
  const base = urlSite(ctx.env);
  const params = {
    mode: 'payment',
    client_reference_id: d.id,
    // Aucun nom de défunt chez Stripe : la référence suffit.
    line_items: { 0: { quantity: 1, price_data: {
      currency: 'eur',
      unit_amount: Number(offre.price_cents) + (tva ? Math.round(Number(offre.price_cents) * tva / 10000) : 0),
      product_data: { name: `Composition Melodia Funèbre — ${offre.nom}`, description: `Dossier ${d.reference}` }
    } } },
    metadata: { dossier_id: d.id, org_id: d.org_id, reference: d.reference },
    payment_intent_data: { metadata: { dossier_id: d.id, org_id: d.org_id } },
    success_url: `${base}/pro#/dossiers/${d.id}?paiement=ok`,
    cancel_url: `${base}/pro#/dossiers/${d.id}?paiement=annule`,
    locale: 'fr'
  };
  if (org.stripe_customer_id) params.customer = org.stripe_customer_id;
  else { params.customer_email = org.email || u.email; params.customer_creation = 'always'; }
  // Stripe refuse « allow_promotion_codes » avec « discounts » : l'un ou l'autre.
  if (promo) params.discounts = { 0: { promotion_code: promo.id } };
  else params.allow_promotion_codes = 'true';

  const session = await stripe(ctx.env, 'POST', '/v1/checkout/sessions', params,
    `checkout-${d.id}-${d.questionnaire_version || 0}-${promo ? promo.id : 'sans'}`);
  await ctx.depot.insert('pro_payments', {
    dossier_id: d.id, org_id: d.org_id, methode: 'stripe', statut: 'en_attente',
    montant_cents: p.ttc_cents, devise: 'eur', stripe_session_id: session.id, promo_code: promo ? promo.code : null
  }, { ignorerDoublon: true, conflit: 'stripe_session_id' });
  if (d.status === 'complet') await transition(ctx, d, 'en_attente_paiement', 'service', u, { stripe_session_id: session.id });
  return ok({ url: session.url, montant_cents: p.ttc_cents, mention_tva: p.mention_tva });
}
checkout.nom = 'checkout';
