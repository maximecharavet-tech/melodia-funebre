// /api/pro/memorial — voir lib/pro/routes/memorial.mjs
import { servir } from '../../lib/pro/socle.mjs';
import memorial from '../../lib/pro/routes/memorial.mjs';

export default servir(memorial, { methodes: 'GET', public: true, limite: [60, 60000] });
