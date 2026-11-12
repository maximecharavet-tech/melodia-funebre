// POST /api/pro/music { dossier_id, version }
// Le conseiller a relu les paroles ET le prompt musical : on lance la composition.
'use strict';
const { erreur, ok, accesDossier, transition, enfiler } = require('../socle.cjs');

async function music(rq, ctx) {
  const c = rq.corps || {};
  const a = await accesDossier(ctx, rq.utilisateur, c.dossier_id, { ecriture: true });
  if (a.erreur) return a.erreur;
  const d = a.dossier;
  const acteur = a.acteur === 'maison' ? 'maison' : 'agence';
  const versions = await ctx.depot.select('pro_lyrics_versions', { dossier_id: d.id }, { ordre: 'version.desc' });
  if (!versions.length) return erreur(409, 'SANS_PAROLES', 'Aucune proposition de paroles à composer.');
  const v = c.version ? versions.find((x) => x.version === Number(c.version)) : versions[0];
  if (!v) return erreur(404, 'VERSION', 'Cette version des paroles est introuvable.');
  if (!String(v.prompt_musique || '').trim()) return erreur(422, 'PROMPT_VIDE', 'La description musicale est vide.');
  const t = await transition(ctx, d, 'musique_en_cours', acteur, rq.utilisateur);
  if (!t.ok) return erreur(409, t.code, 'La composition ne peut pas être lancée à ce stade.');
  const job = await enfiler(ctx, d.id, 'musique', v.version, {});
  return ok({ en_file: !!job, version: v.version }, 202);
}
music.nom = 'music';

module.exports = music;
