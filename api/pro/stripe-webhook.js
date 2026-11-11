// /api/pro/stripe-webhook — voir lib/pro/routes/stripe-webhook.cjs
import { servir } from '../../lib/pro/socle.cjs';
import stripeWebhook from '../../lib/pro/routes/stripe-webhook.cjs';

// Corps brut indispensable à la vérification de la signature Stripe.
export const config = { api: { bodyParser: false } };

export default servir(stripeWebhook, { methodes: 'POST', public: true, brut: true, limite: [300, 60000] });
