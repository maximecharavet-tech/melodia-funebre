// POST /api/pro/stripe-webhook — appelé par Stripe, jamais par un navigateur.
//
//  - signature vérifiée (STRIPE_WEBHOOK_SECRET), tolérance 5 min ;
//  - idempotence : pro_stripe_events.event_id est unique, un événement rejoué
//    est accusé sans être retraité ;
//  - SEUL chemin vers « payé » pour un paiement réel.
'use strict';
const { erreur, ok, transition, enfiler, auditer } = require('../socle.cjs');
const { verifierSignatureStripe } = require('../fournisseurs.cjs');

const GERES = ['checkout.session.completed', 'checkout.session.expired', 'payment_intent.payment_failed', 'charge.refunded', 'invoice.paid'];

async function dossierDe(ctx, id) {
  return id ? (await ctx.depot.select('pro_dossiers', { id }, { limite: 1 }))[0] : null;
}

async function webhook(rq, ctx) {
  const secret = ctx.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return erreur(503, 'NON_CONFIGURE', 'Webhook non configuré.');
  const sig = rq.entetes['stripe-signature'] || rq.entetes['Stripe-Signature'];
  const maintenant = Math.floor(ctx.maintenant().getTime() / 1000);
  if (!rq.brut || !verifierSignatureStripe(rq.brut, sig, secret, maintenant)) {
    return erreur(400, 'SIGNATURE', 'Signature invalide.');
  }
  let ev;
  try { ev = JSON.parse(rq.brut.toString('utf8')); } catch (e) { return erreur(400, 'CORPS', 'Corps illisible.'); }
  if (!ev || !ev.id || !ev.type) return erreur(400, 'CORPS', 'Événement incomplet.');

  // Idempotence : la première insertion gagne, les suivantes sont accusées.
  try {
    await ctx.depot.insert('pro_stripe_events', { event_id: ev.id, type: ev.type, traite: false });
  } catch (e) {
    if (e.doublon) return ok({ doublon: true });
    throw e;
  }
  if (!GERES.includes(ev.type)) {
    await ctx.depot.update('pro_stripe_events', { event_id: ev.id }, { traite: true });
    return ok({ ignore: true });
  }

  const o = (ev.data && ev.data.object) || {};
  const qui = 'webhook';
  if (ev.type === 'checkout.session.completed') {
    const d = await dossierDe(ctx, (o.metadata && o.metadata.dossier_id) || o.client_reference_id);
    if (d && o.payment_status === 'paid') {
      await ctx.depot.update('pro_payments', { stripe_session_id: o.id }, {
        statut: 'paye', montant_cents: Number(o.amount_total || 0), stripe_payment_intent: o.payment_intent || null,
        updated_at: new Date().toISOString()
      });
      if (o.customer) await ctx.depot.update('pro_orgs', { id: d.org_id }, { stripe_customer_id: o.customer });
      const t = await transition(ctx, d, 'paye', 'service', qui, { paid: true, montant_cents: Number(o.amount_total || 0) });
      if (t.ok) await enfiler(ctx, d.id, 'paroles', 1, { essai: false });
      else await auditer(ctx, qui, 'paiement_hors_etat', d.id, { status: d.status, code: t.code });
    }
  } else if (ev.type === 'checkout.session.expired') {
    const d = await dossierDe(ctx, (o.metadata && o.metadata.dossier_id) || o.client_reference_id);
    await ctx.depot.update('pro_payments', { stripe_session_id: o.id }, { statut: 'expire', updated_at: new Date().toISOString() });
    if (d && d.status === 'en_attente_paiement') await transition(ctx, d, 'complet', 'service', qui);
  } else if (ev.type === 'payment_intent.payment_failed') {
    const id = o.metadata && o.metadata.dossier_id;
    await ctx.depot.update('pro_payments', { stripe_payment_intent: o.id }, { statut: 'echec', updated_at: new Date().toISOString() }).catch(() => []);
    await auditer(ctx, qui, 'paiement_echec', id || null, {});
  } else if (ev.type === 'charge.refunded') {
    const pi = o.payment_intent;
    const pay = pi ? (await ctx.depot.select('pro_payments', { stripe_payment_intent: pi }, { limite: 1 }))[0] : null;
    if (pay) {
      await ctx.depot.update('pro_payments', { id: pay.id }, { statut: 'rembourse', updated_at: new Date().toISOString() });
      const d = await dossierDe(ctx, pay.dossier_id);
      if (d) await transition(ctx, d, 'rembourse', 'service', qui, { paid: false });
    }
  } else if (ev.type === 'invoice.paid') {
    await auditer(ctx, qui, 'facture_payee', o.id || null, { montant_cents: Number(o.amount_paid || 0) });
  }
  await ctx.depot.update('pro_stripe_events', { event_id: ev.id }, { traite: true });
  return ok({ recu: true });
}
webhook.nom = 'stripe-webhook';

module.exports = webhook;
