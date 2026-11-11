// /api/pro/me — voir lib/pro/routes/me.mjs
import { servir } from '../../lib/pro/socle.mjs';
import me from '../../lib/pro/routes/me.mjs';

export default servir(me, { methodes: 'GET' });
