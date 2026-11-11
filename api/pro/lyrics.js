// /api/pro/lyrics — voir lib/pro/routes/lyrics.mjs
import { servir } from '../../lib/pro/socle.mjs';
import lyrics from '../../lib/pro/routes/lyrics.mjs';

export default servir(lyrics, { methodes: 'POST', limite: [10, 600000] });
