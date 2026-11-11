// /api/pro/admin — voir lib/pro/routes/admin.mjs
import { servir } from '../../lib/pro/socle.mjs';
import admin from '../../lib/pro/routes/admin.mjs';

export default servir(admin, { methodes: 'GET, POST', maison: true, limite: [120, 60000] });
