// /api/pro/job-tick — voir lib/pro/routes/job-tick.mjs
import { servir } from '../../lib/pro/socle.mjs';
import jobTick from '../../lib/pro/routes/job-tick.mjs';

export default servir(jobTick, { methodes: 'GET, POST', cron: true, limite: [30, 60000] });
