// POST /api/pro/lyrics { dossier_id } — demander une nouvelle proposition de paroles.
// Met un travail en file ; le moteur (job-tick) fait la rédaction.
import { erreur, ok, accesDossier, enfiler } from '../socle.mjs';

const PERMIS = ['paye', 'essai_accorde', 'paroles_a_valider', 'revision_demandee', 'echec'];

export default async function lyrics(rq, ctx) {
  const a = await accesDossier(ctx, rq.utilisateur, (rq.corps || {}).dossier_id, { ecriture: true });
  if (a.erreur) return a.erreur;
  const d = a.dossier;
  if (!PERMIS.includes(d.status)) return erreur(409, 'ETAT', 'Une nouvelle proposition n’est pas possible à ce stade.');
  if (['revision_demandee', 'echec'].includes(d.status) && a.acteur !== 'maison') {
    return erreur(403, 'RESERVE_MAISON', 'La maison reprend ce dossier ; elle vous tiendra informé.');
  }
  const travaux = await ctx.depot.select('pro_jobs', { dossier_id: d.id, type: 'paroles' });
  if (travaux.some((t) => ['a_faire', 'en_cours'].includes(t.etat))) return ok({ deja_en_file: true }, 202);
  const essai = d.mode === 'essai';
  const premier = travaux[0] && travaux[0].donnees ? travaux[0].donnees : {};
  const job = await enfiler(ctx, d.id, 'paroles', travaux.length + 1, { essai, duree_s: essai ? premier.duree_s : undefined });
  return ok({ en_file: !!job }, 202);
}
lyrics.nom = 'lyrics';
