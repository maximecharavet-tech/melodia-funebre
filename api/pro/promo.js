// /api/pro/promo — voir lib/pro/routes/promo.mjs
import { servir } from '../../lib/pro/socle.mjs';
import promo from '../../lib/pro/routes/promo.mjs';

export default servir(promo, { methodes: 'POST', limite: [10, 600000] });
