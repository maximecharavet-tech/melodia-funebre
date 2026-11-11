// /api/pro/memorial — voir lib/pro/routes/memorial.cjs
import { servir } from '../../lib/pro/socle.cjs';
import memorial from '../../lib/pro/routes/memorial.cjs';

export default servir(memorial, { methodes: 'GET', public: true, limite: [60, 60000] });
