// /api/pro/trial — voir lib/pro/routes/trial.mjs
import { servir } from '../../lib/pro/socle.mjs';
import trial from '../../lib/pro/routes/trial.mjs';

export default servir(trial, { methodes: 'POST', limite: [5, 600000] });
