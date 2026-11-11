// /api/pro/portal — voir lib/pro/routes/portal.cjs
import { servir } from '../../lib/pro/socle.cjs';
import portal from '../../lib/pro/routes/portal.cjs';

export default servir(portal, { methodes: 'POST', limite: [10, 60000] });
