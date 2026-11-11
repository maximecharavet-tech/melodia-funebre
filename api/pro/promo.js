// /api/pro/promo — voir lib/pro/routes/promo.cjs
import { servir } from '../../lib/pro/socle.cjs';
import promo from '../../lib/pro/routes/promo.cjs';

export default servir(promo, { methodes: 'POST', limite: [10, 600000] });
