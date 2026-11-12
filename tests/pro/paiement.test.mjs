// Stripe (simulé), webhook, codes promo, code maître, essai.
import test from 'node:test';
import assert from 'node:assert/strict';
import { servir, enfiler } from '../../lib/pro/socle.cjs';
import { signerStripe } from '../../lib/pro/fournisseurs.cjs';
import webhook from '../../lib/pro/routes/stripe-webhook.cjs';
import promo from '../../lib/pro/routes/promo.cjs';
import checkout from '../../lib/pro/routes/checkout.cjs';
import trial from '../../lib/pro/routes/trial.cjs';
import dossiers from '../../lib/pro/routes/dossiers.cjs';
import { base, contexte, reponse, requete, utilisateur, fauxReseau, creerDossier, questionnaireComplet, ORG_A, ORG_B } from './aide.mjs';

const SECRET = 'whsec_test_simule';
const ENV = { STRIPE_SECRET_KEY: 'sk_test_simule', STRIPE_WEBHOOK_SECRET: SECRET, PRO_CODE_MAITRE: 'MASTERMAX' };
const hWebhook = servir(webhook, { methodes: 'POST', public: true, brut: true });

async function completer(ctx, id, jeton = 'jeton-a') {
  const r = await dossiers({ methode: 'POST', corps: { action: 'statut', id, vers: 'complet' }, query: {}, utilisateur: utilisateur(ctx.depot, jeton) }, ctx);
  assert.equal(r.status, 200, JSON.stringify(r.json));
}

function evenement(id, type, objet) {
  return JSON.stringify({ id, type, data: { object: objet } });
}

async function envoyerWebhook(ctx, corps, signature) {
  const res = reponse();
  const req = requete({ corps: Buffer.from(corps), entetes: { 'stripe-signature': signature } });
  await hWebhook(req, res, ctx);
  return res;
}

test('webhook : signature invalide refusée', async () => {
  const ctx = contexte(base(), ENV);
  const corps = evenement('evt_1', 'checkout.session.completed', {});
  const r1 = await envoyerWebhook(ctx, corps, 't=1,v1=00');
  assert.equal(r1.statusCode, 400);
  const r2 = await envoyerWebhook(ctx, corps, signerStripe(corps, 'mauvais_secret', Math.floor(ctx.maintenant() / 1000)));
  assert.equal(r2.statusCode, 400);
  // signature juste mais trop vieille (rejeu tardif)
  const r3 = await envoyerWebhook(ctx, corps, signerStripe(corps, SECRET, Math.floor(ctx.maintenant() / 1000) - 3600));
  assert.equal(r3.statusCode, 400);
  assert.equal(ctx.depot.tables.pro_stripe_events, undefined, 'rien n’est enregistré');
});

test('webhook : paiement réel → payé + travail en file ; rejeu accusé sans retraitement', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  await completer(ctx, id);
  await ctx.depot.update('pro_dossiers', { id }, { status: 'en_attente_paiement' });
  await ctx.depot.insert('pro_payments', { dossier_id: id, org_id: ORG_A, methode: 'stripe', statut: 'en_attente', stripe_session_id: 'cs_test_1' });
  const t = Math.floor(ctx.maintenant() / 1000);
  const corps = evenement('evt_paye', 'checkout.session.completed', {
    id: 'cs_test_1', payment_status: 'paid', amount_total: 12000, metadata: { dossier_id: id }, customer: 'cus_1', payment_intent: 'pi_1'
  });
  const r1 = await envoyerWebhook(ctx, corps, signerStripe(corps, SECRET, t));
  assert.equal(r1.statusCode, 200);
  const d = ctx.depot.tables.pro_dossiers.find((x) => x.id === id);
  assert.equal(d.status, 'paye');
  assert.equal(d.paid, true);
  assert.equal(d.montant_cents, 12000);
  assert.equal(ctx.depot.tables.pro_jobs.length, 1);
  const r2 = await envoyerWebhook(ctx, corps, signerStripe(corps, SECRET, t));
  assert.equal(r2.statusCode, 200);
  assert.equal(r2.body.doublon, true);
  assert.equal(ctx.depot.tables.pro_jobs.length, 1, 'le rejeu n’ajoute rien');
});

test('webhook : événement inconnu accusé et ignoré', async () => {
  const ctx = contexte(base(), ENV);
  const corps = evenement('evt_x', 'customer.created', { id: 'cus_x' });
  const r = await envoyerWebhook(ctx, corps, signerStripe(corps, SECRET, Math.floor(ctx.maintenant() / 1000)));
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.ignore, true);
});

test('webhook : session expirée → retour à complet ; remboursement → remboursé', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  await completer(ctx, id);
  await ctx.depot.update('pro_dossiers', { id }, { status: 'en_attente_paiement' });
  const t = Math.floor(ctx.maintenant() / 1000);
  const c1 = evenement('evt_exp', 'checkout.session.expired', { id: 'cs_2', metadata: { dossier_id: id } });
  await envoyerWebhook(ctx, c1, signerStripe(c1, SECRET, t));
  assert.equal(ctx.depot.tables.pro_dossiers.find((x) => x.id === id).status, 'complet');
  await ctx.depot.update('pro_dossiers', { id }, { status: 'livre', paid: true });
  await ctx.depot.insert('pro_payments', { dossier_id: id, org_id: ORG_A, methode: 'stripe', statut: 'paye', stripe_session_id: 'cs_3', stripe_payment_intent: 'pi_9' });
  const c2 = evenement('evt_ref', 'charge.refunded', { id: 'ch_1', payment_intent: 'pi_9' });
  await envoyerWebhook(ctx, c2, signerStripe(c2, SECRET, t));
  assert.equal(ctx.depot.tables.pro_dossiers.find((x) => x.id === id).status, 'rembourse');
});

test('le statut payé ne s’obtient pas par l’API dossiers', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  const r = await dossiers({ methode: 'POST', corps: { action: 'statut', id, vers: 'paye' }, query: {}, utilisateur: utilisateur(ctx.depot, 'jeton-a') }, ctx);
  assert.equal(r.status, 400);
});

// ─── Codes promo ───

function stripePromo(reponses) {
  return fauxReseau([[/api\.stripe\.com\/v1\/promotion_codes/, (u) => {
    const code = new URL(u).searchParams.get('code');
    return { json: { data: reponses[code] ? [reponses[code]] : [] } };
  }]]);
}

test('promo : code Stripe valide, expiré, épuisé, inconnu', async () => {
  const ctx = contexte(base(), ENV);
  const t = Math.floor(ctx.maintenant() / 1000);
  const net = stripePromo({
    NOEL2026: { id: 'promo_1', code: 'NOEL2026', active: true, coupon: { percent_off: 15, valid: true } },
    VIEUX: { id: 'promo_2', code: 'VIEUX', active: true, expires_at: t - 10, coupon: { percent_off: 50 } },
    EPUISE: { id: 'promo_3', code: 'EPUISE', active: true, max_redemptions: 3, times_redeemed: 3, coupon: { amount_off: 1000 } }
  });
  try {
    const u = utilisateur(ctx.depot, 'jeton-a');
    const ok = await promo({ corps: { code: 'noel 2026' }, utilisateur: u }, ctx);
    assert.equal(ok.json.valide, true);
    assert.deepEqual(ok.json.remise, { type: 'pourcent', valeur: 1500 });
    for (const code of ['VIEUX', 'EPUISE', 'INCONNU', '<script>']) {
      const r = await promo({ corps: { code }, utilisateur: u }, ctx);
      assert.equal(r.json.valide, false, code);
    }
  } finally { net.restaurer(); }
});

test('code maître : accepté pour le propriétaire, toutes graphies', async () => {
  const ctx = contexte(base(), ENV);
  const u = utilisateur(ctx.depot, 'jeton-maitre');
  for (const code of ['MASTERMAX', 'mastermax', 'master max', ' Master-Max ']) {
    const r = await promo({ corps: { code }, utilisateur: u }, ctx);
    assert.equal(r.json.valide, true, code);
    assert.equal(r.json.type, 'maitre');
  }
  assert.ok(ctx.depot.tables.pro_audit.some((a) => a.action === 'code_maitre_utilise'));
});

test('code maître : une agence obtient la même réponse qu’un code inconnu (pas d’oracle)', async () => {
  const ctx = contexte(base(), Object.assign({}, ENV, { STRIPE_SECRET_KEY: '' }));
  const u = utilisateur(ctx.depot, 'jeton-a');
  const r1 = await promo({ corps: { code: 'MASTERMAX' }, utilisateur: u }, ctx);
  const r2 = await promo({ corps: { code: 'ZZZZZZZZ' }, utilisateur: u }, ctx);
  assert.deepEqual(r1, r2);
  assert.ok(ctx.depot.tables.pro_audit.some((a) => a.action === 'code_maitre_refuse'));
});

test('code maître : sans variable d’environnement, rien ne passe', async () => {
  const ctx = contexte(base(), { STRIPE_SECRET_KEY: '' });
  const r = await promo({ corps: { code: 'MASTERMAX' }, utilisateur: utilisateur(ctx.depot, 'jeton-maitre') }, ctx);
  assert.equal(r.json.valide, false);
});

test('code maître : la valeur n’apparaît ni dans le client ni dans le noyau', async () => {
  const fs = await import('node:fs');
  const fichiers = ['assets/js/vendor/melodia_pro.wasm', 'assets/js/vendor/melodia-pro-glue.js'];
  for (const d of ['assets/js/pro', 'assets/js/pro/vues', 'assets/i18n']) {
    if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (fs.statSync(d + '/' + f).isFile()) fichiers.push(d + '/' + f);
  }
  // auth.js n'est pas balayé : il réserve depuis longtemps l'identifiant de connexion
  // « mastermax07 », sans rapport avec le code promo (qui n'est jamais dans le client).
  fichiers.push('pro.html', 'assets/js/hommage.js');
  for (const f of fichiers) {
    if (!fs.existsSync(f)) continue;
    assert.doesNotMatch(fs.readFileSync(f).toString('latin1'), /mastermax/i, f);
  }
});

// ─── Checkout ───

test('checkout : code maître → payé à 0 € sans appeler Stripe', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx, 'jeton-maitre', ORG_A);
  await completer(ctx, id, 'jeton-maitre');
  const net = fauxReseau([]);
  try {
    const r = await checkout({ corps: { dossier_id: id, code: 'master max' }, utilisateur: utilisateur(ctx.depot, 'jeton-maitre') }, ctx);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.gratuit, true);
    assert.equal(net.appels.length, 0);
  } finally { net.restaurer(); }
  const d = ctx.depot.tables.pro_dossiers.find((x) => x.id === id);
  assert.equal(d.status, 'paye');
  assert.equal(ctx.depot.tables.pro_payments[0].methode, 'code_maitre');
  assert.equal(ctx.depot.tables.pro_jobs.length, 1);
});

test('checkout : tarif non fixé (NULL) → 409, pas de paiement', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx, 'jeton-a', ORG_A, questionnaireComplet({ offre: { mode: 'payant', offre_id: 'essentiel' } }));
  await completer(ctx, id);
  const r = await checkout({ corps: { dossier_id: id }, utilisateur: utilisateur(ctx.depot, 'jeton-a') }, ctx);
  assert.equal(r.status, 409);
  assert.equal(r.json.code, 'TARIF_NON_FIXE');
});

test('checkout : sans clé Stripe → « paiement non configuré »', async () => {
  const ctx = contexte(base(), { STRIPE_SECRET_KEY: '' });
  const id = await creerDossier(ctx);
  await completer(ctx, id);
  const r = await checkout({ corps: { dossier_id: id }, utilisateur: utilisateur(ctx.depot, 'jeton-a') }, ctx);
  assert.equal(r.status, 503);
  assert.equal(r.json.code, 'PAIEMENT_NON_CONFIGURE');
});

test('checkout : session Stripe avec code promo → discounts, sans allow_promotion_codes ; sans code → allow', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  await completer(ctx, id);
  const corpsEnvoyes = [];
  const net = fauxReseau([
    [/promotion_codes/, () => ({ json: { data: [{ id: 'promo_1', code: 'NOEL2026', active: true, coupon: { percent_off: 10 } }] } })],
    [/checkout\/sessions/, (u, o) => { corpsEnvoyes.push(o.body); return { json: { id: 'cs_test_' + corpsEnvoyes.length, url: 'https://checkout.stripe.com/c/pay/cs_test' } }; }]
  ]);
  try {
    const u = utilisateur(ctx.depot, 'jeton-a');
    const r = await checkout({ corps: { dossier_id: id, code: 'NOEL2026' }, utilisateur: u }, ctx);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.montant_cents, 10800);
    const b = decodeURIComponent(corpsEnvoyes[0]);
    assert.match(b, /discounts\[0\]\[promotion_code\]=promo_1/);
    assert.doesNotMatch(b, /allow_promotion_codes/);
    assert.doesNotMatch(b, /Jeanne/, 'aucun prénom de défunt chez Stripe');
    assert.match(b, /unit_amount]=12000/);
    assert.equal(ctx.depot.tables.pro_dossiers.find((x) => x.id === id).status, 'en_attente_paiement');
    assert.equal(ctx.depot.tables.pro_dossiers.find((x) => x.id === id).paid, false, 'seul le webhook encaisse');
    const r2 = await checkout({ corps: { dossier_id: id }, utilisateur: u }, ctx);
    assert.equal(r2.status, 200);
    assert.match(decodeURIComponent(corpsEnvoyes[1]), /allow_promotion_codes=true/);
  } finally { net.restaurer(); }
});

test('checkout : une agence ne peut pas payer le dossier d’une autre', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  const r = await checkout({ corps: { dossier_id: id }, utilisateur: utilisateur(ctx.depot, 'jeton-b') }, ctx);
  assert.equal(r.status, 404);
});

// ─── Essai ───

test('essai : accordé une fois, refusé la deuxième', async () => {
  const ctx = contexte(base(), ENV);
  const u = utilisateur(ctx.depot, 'jeton-a');
  const id1 = await creerDossier(ctx);
  await completer(ctx, id1);
  const r1 = await trial({ corps: { dossier_id: id1, appareil: 'app-1' }, utilisateur: u }, ctx);
  assert.equal(r1.status, 200, JSON.stringify(r1.json));
  assert.equal(r1.json.essai.duree_s, 150);
  assert.equal(ctx.depot.tables.pro_dossiers.find((x) => x.id === id1).status, 'essai_accorde');
  const id2 = await creerDossier(ctx);
  await completer(ctx, id2);
  const r2 = await trial({ corps: { dossier_id: id2, appareil: 'app-2' }, utilisateur: u }, ctx);
  assert.equal(r2.status, 403);
  assert.equal(r2.json.code, 'ESSAI_DEJA_UTILISE');
});

test('essai : deux demandes simultanées, une seule passe', async () => {
  const ctx = contexte(base(), ENV);
  const u = utilisateur(ctx.depot, 'jeton-a');
  const id1 = await creerDossier(ctx);
  const id2 = await creerDossier(ctx);
  await completer(ctx, id1);
  await completer(ctx, id2);
  const [a, b] = await Promise.all([
    trial({ corps: { dossier_id: id1 }, utilisateur: u }, ctx),
    trial({ corps: { dossier_id: id2 }, utilisateur: u }, ctx)
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 403]);
  assert.equal(ctx.depot.tables.pro_trials.length, 1);
});

test('essai : empreinte déjà vue chez une autre agence (même appareil) → refusé', async () => {
  const ctx = contexte(base(), ENV);
  const idA = await creerDossier(ctx);
  await completer(ctx, idA);
  await trial({ corps: { dossier_id: idA, appareil: 'meme-poste' }, utilisateur: utilisateur(ctx.depot, 'jeton-a') }, ctx);
  const idB = await creerDossier(ctx, 'jeton-b', ORG_B);
  await completer(ctx, idB, 'jeton-b');
  const r = await trial({ corps: { dossier_id: idB, appareil: 'meme-poste' }, utilisateur: utilisateur(ctx.depot, 'jeton-b') }, ctx);
  assert.equal(r.status, 403);
  assert.equal(r.json.code, 'EMPREINTE_DEJA_UTILISEE');
});

test('essai : plafond du jour non saisi (TBD) → essais fermés', async () => {
  const ctx = contexte(base({ essai_plafond_jour: null }), ENV);
  const id = await creerDossier(ctx);
  await completer(ctx, id);
  const r = await trial({ corps: { dossier_id: id }, utilisateur: utilisateur(ctx.depot, 'jeton-a') }, ctx);
  assert.equal(r.status, 403);
  assert.equal(r.json.code, 'PLAFOND_NON_CONFIGURE');
});

test('essai : agence non validée par la maison → refusé', async () => {
  const d = base();
  d.tables.pro_orgs[0].statut = 'en_attente';
  const ctx = contexte(d, ENV);
  // la maison peut créer le dossier ; l'agence en attente, non
  const id = await creerDossier(ctx, 'jeton-maitre', ORG_A);
  await completer(ctx, id, 'jeton-maitre');
  const r = await trial({ corps: { dossier_id: id }, utilisateur: utilisateur(ctx.depot, 'jeton-maitre') }, ctx);
  assert.equal(r.status, 403);
  assert.equal(r.json.code, 'COMPTE_NON_VALIDE');
});

test('idempotence : un travail ne se met en file qu’une fois par dossier et version', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  await enfiler(ctx, id, 'paroles', 1, {});
  await enfiler(ctx, id, 'paroles', 1, {});
  await enfiler(ctx, id, 'musique', 1, {});
  assert.equal(ctx.depot.tables.pro_jobs.length, 2);
});
