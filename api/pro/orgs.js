// /api/pro/orgs — voir lib/pro/routes/orgs.cjs
import { servir } from '../../lib/pro/socle.cjs';
import orgs from '../../lib/pro/routes/orgs.cjs';

export default servir(orgs, { methodes: 'POST', limite: [20, 60000] });
