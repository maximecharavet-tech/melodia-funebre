// /api/pro/qr — voir lib/pro/routes/qr.cjs
import { servir } from '../../lib/pro/socle.cjs';
import qr from '../../lib/pro/routes/qr.cjs';

export default servir(qr, { methodes: 'POST', limite: [60, 60000] });
