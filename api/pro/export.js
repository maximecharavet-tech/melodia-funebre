// /api/pro/export — voir lib/pro/routes/export.cjs
import { servir } from '../../lib/pro/socle.cjs';
import exporter from '../../lib/pro/routes/export.cjs';

export default servir(exporter, { methodes: 'GET', limite: [10, 60000] });
