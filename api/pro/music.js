// /api/pro/music — voir lib/pro/routes/music.mjs
import { servir } from '../../lib/pro/socle.mjs';
import music from '../../lib/pro/routes/music.mjs';

export default servir(music, { methodes: 'POST', limite: [10, 600000] });
