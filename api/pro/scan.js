// /api/pro/scan — voir lib/pro/routes/scan.cjs
import { servir } from '../../lib/pro/socle.cjs';
import scan from '../../lib/pro/routes/scan.cjs';

export default servir(scan, { methodes: 'POST', public: true, limite: [20, 60000] });
