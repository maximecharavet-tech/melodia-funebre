// /api/pro/portal — voir lib/pro/routes/portal.mjs
import { servir } from '../../lib/pro/socle.mjs';
import portal from '../../lib/pro/routes/portal.mjs';

export default servir(portal, { methodes: 'POST', limite: [10, 60000] });
