// /api/pro/export — voir lib/pro/routes/export.mjs
import { servir } from '../../lib/pro/socle.mjs';
import export from '../../lib/pro/routes/export.mjs';

export default servir(export, { methodes: 'GET', limite: [10, 60000] });
