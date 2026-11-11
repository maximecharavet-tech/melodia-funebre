// POST /api/pro/portal { org_id } — portail client Stripe (factures, moyens de paiement).
'use strict';
const { erreur, ok, rolePro, ROLES_ADMIN, MAISON } = require('../socle.cjs');
const { stripe, stripeConfigure } = require('../fournisseurs.cjs');
const { urlSite } = require('./checkout.cjs');

async function portal(rq, ctx) {
  const u = rq.utilisateur;
  const orgId = (rq.corps || {}).org_id;
  const role = MAISON.includes(u.roleMaison) ? 'owner' : await rolePro(ctx, u, orgId);
  if (!role || !ROLES_ADMIN.includes(role)) return erreur(403, 'ADMIN_REQUIS', 'Réservé aux administrateurs de l’agence.');
  if (!stripeConfigure(ctx.env)) return erreur(503, 'PAIEMENT_NON_CONFIGURE', 'Le paiement en ligne n’est pas encore configuré.');
  const org = (await ctx.depot.select('pro_orgs', { id: orgId }, { limite: 1 }))[0];
  if (!org || !org.stripe_customer_id) return erreur(409, 'SANS_HISTORIQUE', 'Aucun paiement n’a encore été effectué par cette agence.');
  const s = await stripe(ctx.env, 'POST', '/v1/billing_portal/sessions', {
    customer: org.stripe_customer_id, return_url: urlSite(ctx.env) + '/pro#/facturation', locale: 'fr'
  });
  return ok({ url: s.url });
}
portal.nom = 'portal';

module.exports = portal;
