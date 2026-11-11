// /api/pro/qr — voir lib/pro/routes/qr.mjs
import { servir } from '../../lib/pro/socle.mjs';
import qr from '../../lib/pro/routes/qr.mjs';

export default servir(qr, { methodes: 'POST', limite: [60, 60000] });
