// /api/pro/job-tick — voir lib/pro/routes/job-tick.cjs
import { servir } from '../../lib/pro/socle.cjs';
import jobTick from '../../lib/pro/routes/job-tick.cjs';

export default servir(jobTick, { methodes: 'GET, POST', cron: true, limite: [30, 60000] });
