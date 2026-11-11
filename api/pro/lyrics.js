// /api/pro/lyrics — voir lib/pro/routes/lyrics.cjs
import { servir } from '../../lib/pro/socle.cjs';
import lyrics from '../../lib/pro/routes/lyrics.cjs';

export default servir(lyrics, { methodes: 'POST', limite: [10, 600000] });
