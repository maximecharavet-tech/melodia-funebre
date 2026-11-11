// /api/pro/dossiers — voir lib/pro/routes/dossiers.cjs
import { servir } from '../../lib/pro/socle.cjs';
import dossiers from '../../lib/pro/routes/dossiers.cjs';

export default servir(dossiers, { methodes: 'GET, POST', limite: [120, 60000] });
