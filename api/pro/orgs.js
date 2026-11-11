// /api/pro/orgs — voir lib/pro/routes/orgs.mjs
import { servir } from '../../lib/pro/socle.mjs';
import orgs from '../../lib/pro/routes/orgs.mjs';

export default servir(orgs, { methodes: 'POST', limite: [20, 60000] });
