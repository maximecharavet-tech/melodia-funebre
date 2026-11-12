// /api/pro/music — voir lib/pro/routes/music.cjs
import { servir } from '../../lib/pro/socle.cjs';
import music from '../../lib/pro/routes/music.cjs';

export default servir(music, { methodes: 'POST', limite: [10, 600000] });
