// /api/pro/me — voir lib/pro/routes/me.cjs
import { servir } from '../../lib/pro/socle.cjs';
import me from '../../lib/pro/routes/me.cjs';

export default servir(me, { methodes: 'GET' });
