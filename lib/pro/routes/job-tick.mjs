// POST /api/pro/job-tick { dossier_id? } — fait avancer la file d'un pas.
// Appelé par le sondage de la console (15 s) ou, plus tard, par un cron
// (Authorization: Bearer CRON_SECRET). Ne rend que des états, jamais de détail fournisseur.
import { ok, accesDossier } from '../socle.mjs';
import { tick } from '../moteur.mjs';

export default async function jobTick(rq, ctx) {
  const id = (rq.corps || {}).dossier_id || rq.query.dossier_id || null;
  let statut = null;
  if (id && rq.utilisateur) {
    const a = await accesDossier(ctx, rq.utilisateur, id);
    if (a.erreur) return a.erreur;
  }
  const faits = await tick(ctx, { max: 2, dossierId: rq.cron ? null : id });
  if (id) {
    const d = (await ctx.depot.select('pro_dossiers', { id }, { limite: 1 }))[0];
    statut = d ? d.status : null;
  }
  return ok({ traites: faits.map((f) => ({ type: f.type, issue: f.issue })), statut });
}
jobTick.nom = 'job-tick';
