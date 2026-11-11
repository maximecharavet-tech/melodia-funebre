// POST /api/pro/trial { dossier_id, appareil }
//
// « Première composition offerte » — décision n° 2 : une par agence, 2 min 30.
// Éligibilité décidée par le noyau Rust à partir des faits lus en base ;
// empreintes salées (SIRET, domaine, téléphone, appareil) pour qu'une agence
// ne recommence pas sous un autre nom ; consommation atomique (pro_trials est
// unique sur org_id + rang : deux demandes simultanées, une seule passe).
import { erreur, ok, accesDossier, transition, reglages, nombre, enfiler, empreinte, auditer } from '../socle.mjs';
import { noyau } from '../noyau.mjs';

export const MOTIFS = {
  COMPTE_NON_VALIDE: 'Votre agence doit d’abord être validée par la maison.',
  SIRET_INVALIDE: 'Le SIRET de votre agence n’est pas valide.',
  EMAIL_INVALIDE: 'L’adresse e-mail de votre agence n’est pas valide.',
  EMAIL_JETABLE: 'Une adresse e-mail professionnelle est nécessaire pour l’essai.',
  ESSAIS_NON_CONFIGURES: 'Les compositions d’essai ne sont pas encore ouvertes.',
  ESSAI_DEJA_UTILISE: 'La composition d’essai de votre agence a déjà été utilisée.',
  PLAFOND_NON_CONFIGURE: 'Les compositions d’essai ne sont pas encore ouvertes.',
  PLAFOND_JOUR_ATTEINT: 'Les compositions d’essai du jour sont toutes attribuées. Réessayez demain.',
  EMPREINTE_DEJA_UTILISEE: 'Une composition d’essai a déjà été accordée à cette agence.'
};

export default async function trial(rq, ctx) {
  const u = rq.utilisateur;
  const c = rq.corps || {};
  const a = await accesDossier(ctx, u, c.dossier_id, { ecriture: true });
  if (a.erreur) return a.erreur;
  const d = a.dossier;
  if (d.status !== 'complet') return erreur(409, 'ETAT', 'Le questionnaire doit être complet avant de demander l’essai.');
  const org = (await ctx.depot.select('pro_orgs', { id: d.org_id }, { limite: 1 }))[0];
  if (!org) return erreur(404, 'INTROUVABLE', 'Organisation introuvable.');

  const r = await reglages(ctx);
  const k = await noyau();
  const domaine = String(org.email || '').split('@')[1] || '';
  const emp = {
    siret: empreinte(org.siret),
    domaine: /^(gmail|hotmail|outlook|yahoo|orange|free|laposte|sfr|wanadoo|icloud|live)\./i.test(domaine) ? '' : empreinte(domaine),
    telephone: empreinte(String(org.telephone || '').replace(/\D/g, '')),
    appareil: empreinte(String(c.appareil || '').slice(0, 128))
  };
  const tous = await ctx.depot.select('pro_trials', {});
  const miens = tous.filter((t) => t.org_id === org.id && t.statut !== 'refuse');
  const autres = tous.filter((t) => t.org_id !== org.id);
  const connues = autres.flatMap((t) => [t.empreinte_siret, t.empreinte_domaine, t.empreinte_tel, t.empreinte_appareil]).filter(Boolean);
  const jour = ctx.maintenant().toISOString().slice(0, 10);
  const duJour = tous.filter((t) => String(t.created_at || '').slice(0, 10) === jour).length;

  const e = k.essaiEligibilite({
    compte_valide: org.statut === 'valide', siret: org.siret || '', email: org.email || '',
    empreintes: emp, empreintes_connues: connues,
    essais_org_utilises: miens.length, essais_par_org: nombre(r.essai_par_org),
    essais_jour: duJour, plafond_jour: nombre(r.essai_plafond_jour),
    duree_s: nombre(r.essai_duree_s), mode: r.essai_mode || 'complet'
  });
  if (!e.eligible) {
    await auditer(ctx, u, 'essai_refuse', d.id, { motifs: e.motifs });
    return erreur(403, e.motifs[0], MOTIFS[e.motifs[0]] || 'L’essai n’est pas disponible.');
  }
  try {
    await ctx.depot.insert('pro_trials', {
      org_id: org.id, rang: miens.length + 1, dossier_id: d.id, statut: 'accorde',
      empreinte_siret: emp.siret, empreinte_domaine: emp.domaine, empreinte_tel: emp.telephone, empreinte_appareil: emp.appareil,
      duree_s: e.duree_s, mode: e.mode
    });
  } catch (err) {
    if (err.doublon) return erreur(403, 'ESSAI_DEJA_UTILISE', MOTIFS.ESSAI_DEJA_UTILISE);
    throw err;
  }
  const t = await transition(ctx, d, 'essai_accorde', 'service', u, { mode: 'essai' });
  if (!t.ok) return erreur(409, t.code, 'Ce dossier ne peut pas passer en essai maintenant.');
  await ctx.depot.insert('pro_payments', { dossier_id: d.id, org_id: org.id, methode: 'essai', statut: 'paye', montant_cents: 0, devise: 'eur' });
  await enfiler(ctx, d.id, 'paroles', 1, { essai: true, duree_s: e.duree_s, mode: e.mode });
  return ok({ essai: { duree_s: e.duree_s, mode: e.mode, revue_maison: true } });
}
trial.nom = 'trial';
