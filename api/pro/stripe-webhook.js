// /api/pro/stripe-webhook — voir lib/pro/routes/stripe-webhook.mjs
import { servir } from '../../lib/pro/socle.mjs';
import stripeWebhook from '../../lib/pro/routes/stripe-webhook.mjs';

// Corps brut indispensable à la vérification de la signature Stripe.
export const config = { api: { bodyParser: false } };

export default servir(stripeWebhook, { methodes: 'POST', public: true, brut: true, limite: [300, 60000] });
