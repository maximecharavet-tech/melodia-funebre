// /api/pro/invitations — voir lib/pro/routes/invitations.mjs
import { servir } from '../../lib/pro/socle.mjs';
import invitations from '../../lib/pro/routes/invitations.mjs';

export default servir(invitations, { methodes: 'GET, POST', limite: [20, 60000] });
