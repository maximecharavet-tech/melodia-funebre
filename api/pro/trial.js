// /api/pro/trial — voir lib/pro/routes/trial.cjs
import { servir } from '../../lib/pro/socle.cjs';
import trial from '../../lib/pro/routes/trial.cjs';

export default servir(trial, { methodes: 'POST', limite: [5, 600000] });
