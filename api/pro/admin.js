// /api/pro/admin — voir lib/pro/routes/admin.cjs
import { servir } from '../../lib/pro/socle.cjs';
import admin from '../../lib/pro/routes/admin.cjs';

export default servir(admin, { methodes: 'GET, POST', maison: true, limite: [120, 60000] });
