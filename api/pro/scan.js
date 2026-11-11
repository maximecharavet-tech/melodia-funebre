// /api/pro/scan — voir lib/pro/routes/scan.mjs
import { servir } from '../../lib/pro/socle.mjs';
import scan from '../../lib/pro/routes/scan.mjs';

export default servir(scan, { methodes: 'POST', public: true, limite: [20, 60000] });
