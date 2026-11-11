// GET /api/pro/memorial?j=<jeton>&code=… — PUBLIC (la page /m/<jeton>).
//
// Ne rend une page que si : le jeton existe, le mémorial est publié, la
// chanson est livrée, et la visibilité le permet (« code » exige le bon code).
// Un refus ne dit jamais pourquoi : même réponse pour un jeton inconnu, une
// page retirée ou un code faux — on ne renseigne pas un curieux.
// L'audio est servi par URL signée d'une heure, depuis un bucket privé.
import { erreur, ok, egalConstant } from '../socle.mjs';
import { hacherCode } from './qr.mjs';
import { noyau } from '../noyau.mjs';

const ABSENT = () => erreur(404, 'INDISPONIBLE', 'Cette page n’est pas disponible.');

export default async function memorial(rq, ctx) {
  const j = String(rq.query.j || '').toUpperCase();
  const k = await noyau();
  if (!k.jetonValider({ jeton: j }).valide) return ABSENT();
  const q = (await ctx.depot.select('pro_qr', { jeton: j }, { limite: 1 }))[0];
  if (!q || !q.actif || q.visibilite === 'non') return ABSENT();
  const d = (await ctx.depot.select('pro_dossiers', { id: q.dossier_id }, { limite: 1 }))[0];
  if (!d || d.status !== 'livre') return ABSENT();
  if (q.visibilite === 'code') {
    const code = String(rq.query.code || '');
    if (!code) return ok({ code_requis: true, noindex: true });
    // Au plus dix essais de code par heure et par page : un code de quatre
    // caractères ne se devine pas à coups de requêtes.
    if (await ctx.limite('memorial-code:' + j, 10, 3600_000)) return erreur(429, 'TROP_SOUVENT', 'Trop d’essais. Réessayez dans une heure.');
    if (!q.code_hash || !egalConstant(hacherCode(code, j), q.code_hash)) return erreur(403, 'CODE', 'Code incorrect.');
  }
  const piste = (await ctx.depot.select('pro_tracks', { dossier_id: d.id, valide_maison: true }, { ordre: 'version.desc', limite: 1 }))[0];
  const paroles = (await ctx.depot.select('pro_lyrics_versions', { dossier_id: d.id }, { ordre: 'version.desc', limite: 1 }))[0];
  const quest = (await ctx.depot.select('pro_questionnaires', { dossier_id: d.id }, { ordre: 'version.desc', limite: 1 }))[0];
  const def = ((quest && quest.donnees) || {}).defunt || {};
  const org = (await ctx.depot.select('pro_orgs', { id: d.org_id }, { limite: 1 }))[0] || {};
  return ok({
    noindex: true,
    prenom: d.prenom_affiche || def.prenom || '',
    nom: def.nom || '',
    dates: [def.naissance || '', def.deces || ''].filter(Boolean),
    titre: (paroles && paroles.titre) || d.titre || '',
    paroles: q.afficher_paroles && paroles ? paroles.paroles : null,
    mot_famille: q.mot_famille || '',
    audio: piste && piste.chemin ? await ctx.depot.urlSignee('pro-audio', piste.chemin, 3600) : null,
    photo: q.photo_path ? await ctx.depot.urlSignee('pro-pieces', q.photo_path, 3600) : null,
    cobranding: org.cobranding && org.nom ? {
      nom: org.nom,
      logo: org.logo_path ? await ctx.depot.urlSignee('pro-pieces', org.logo_path, 3600) : null
    } : null,
    signature: 'Composé par Melodia Funèbre'
  });
}
memorial.nom = 'memorial';
