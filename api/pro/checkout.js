// /api/pro/checkout — voir lib/pro/routes/checkout.cjs
import { servir } from '../../lib/pro/socle.cjs';
import checkout from '../../lib/pro/routes/checkout.cjs';

export default servir(checkout, { methodes: 'POST', limite: [10, 60000] });
