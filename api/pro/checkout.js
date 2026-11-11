// /api/pro/checkout — voir lib/pro/routes/checkout.mjs
import { servir } from '../../lib/pro/socle.mjs';
import checkout from '../../lib/pro/routes/checkout.mjs';

export default servir(checkout, { methodes: 'POST', limite: [10, 60000] });
