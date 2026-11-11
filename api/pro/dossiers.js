// /api/pro/dossiers — voir lib/pro/routes/dossiers.mjs
import { servir } from '../../lib/pro/socle.mjs';
import dossiers from '../../lib/pro/routes/dossiers.mjs';

export default servir(dossiers, { methodes: 'GET, POST', limite: [120, 60000] });
