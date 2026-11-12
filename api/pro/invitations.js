// /api/pro/invitations — voir lib/pro/routes/invitations.cjs
import { servir } from '../../lib/pro/socle.cjs';
import invitations from '../../lib/pro/routes/invitations.cjs';

export default servir(invitations, { methodes: 'GET, POST', limite: [20, 60000] });
