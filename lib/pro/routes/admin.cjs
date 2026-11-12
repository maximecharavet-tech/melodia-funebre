// /api/pro/admin — réservé à la maison (master, atelier).
//   GET                                    tableau : file, comptes à valider, essais, coûts du jour, réglages, journal
//   POST { action: 'valider_org', org_id, decision: 'valide'|'refuse'|'suspendu' }
//   POST { action: 'livrer', dossier_id, piste_id }       contrôle maison → livré
//   POST { action: 'reprendre', dossier_id, vers }        contrôle maison → paroles/musique en cours
//   POST { action: 'relancer', dossier_id, type }         travail en échec ou bloqué
//   POST { action: 'reglage', cle, valeur }               pro_settings (valeurs TBD)
//   POST { action: 'offre', id, price_cents, actif }      pro_offers
//   POST { action: 'promos_sync' }                        miroir des codes promo Stripe
'use strict';
const { erreur, ok, transition, auditer, reglages } = require('../socle.cjs');
const { stripe, stripeConfigure } = require('../fournisseurs.cjs');

const CLES_REGLAGES = [
  'essai_par_org', 'essai_duree_s', 'essai_plafond_jour', 'essai_mode',
  'plafond_jour_cents', 'cout_estime_paroles_cents', 'cout_estime_musique_cents',
  'tva_bp', 'mention_tva', 'job_tentatives_max', 'email_alerte'
];
const ENTIERS = ['essai_par_org', 'essai_duree_s', 'essai_plafond_jour', 'plafond_jour_cents', 'cout_estime_paroles_cents', 'cout_estime_musique_cents', 'tva_bp', 'job_tentatives_max'];

async function prevenirLivraison(ctx, d) {
  // Courriel via le module courrier existant, s'il est configuré. Aucun nom
  // de fournisseur, aucun prénom de défunt dans l'objet.
  try {
    if (!ctx.env.RESEND_API_KEY || ctx.sansCourriel) return false;
    const membres = await ctx.depot.select('pro_members', { org_id: d.org_id, statut: 'actif' });
    const dest = membres.filter((m) => ['owner', 'admin', 'conseiller'].includes(m.role)).map((m) => m.email).filter(Boolean);
    if (!dest.length) return false;
    const { envoyer, expediteurCourrier } = await import('../../../api/_courrier.js');
    await envoyer({
      from: expediteurCourrier(), to: dest.slice(0, 10),
      subject: `Dossier ${d.reference} : la chanson est prête`,
      text: `Bonjour,\n\nLa chanson du dossier ${d.reference} est prête. Vous pouvez l’écouter et préparer le QR code depuis votre console :\nhttps://melodia-funebre.fr/pro#/dossiers/${d.id}\n\nComposé par Melodia Funèbre.\n`
    });
    return true;
  } catch (e) { return false; }
}

async function admin(rq, ctx) {
  const u = rq.utilisateur;
  if (rq.methode === 'GET') {
    const jour = ctx.maintenant().toISOString().slice(0, 10);
    const [travaux, orgs, essais, usages, offres, journal, controle, promos] = await Promise.all([
      ctx.depot.select('pro_jobs', { etat: { op: 'in', v: ['a_faire', 'en_cours', 'bloque', 'echec'] } }, { ordre: 'prochain_essai.asc', limite: 100 }),
      ctx.depot.select('pro_orgs', { statut: 'en_attente' }, { ordre: 'created_at.asc', limite: 100 }),
      ctx.depot.select('pro_trials', {}, { ordre: 'created_at.desc', limite: 50 }),
      ctx.depot.select('pro_usage', { jour }),
      ctx.depot.select('pro_offers', {}, { ordre: 'ordre.asc' }),
      ctx.depot.select('pro_audit', {}, { ordre: 'created_at.desc', limite: 100 }),
      ctx.depot.select('pro_dossiers', { status: 'controle_maison' }, { ordre: 'updated_at.asc', limite: 100 }),
      ctx.depot.select('pro_promo_codes', {}, { ordre: 'maj_le.desc', limite: 100 })
    ]);
    const r = await reglages(ctx);
    const lignes = await ctx.depot.select('pro_settings', {});
    return ok({
      file: travaux.map((t) => ({ id: t.id, dossier_id: t.dossier_id, type: t.type, etat: t.etat, tentatives: t.tentatives, prochain_essai: t.prochain_essai, erreur: t.derniere_erreur })),
      a_valider: orgs.map((o) => ({ id: o.id, nom: o.nom, siret: o.siret, email: o.email, created_at: o.created_at })),
      controle: controle.map((d) => ({ id: d.id, reference: d.reference, mode: d.mode, org_id: d.org_id, updated_at: d.updated_at })),
      essais: essais.map((t) => ({ org_id: t.org_id, dossier_id: t.dossier_id, statut: t.statut, created_at: t.created_at })),
      couts_du_jour: { total_cents: usages.reduce((s, x) => s + (Number(x.cout_cents) || 0), 0), nombre: usages.length, plafond_cents: r.plafond_jour_cents == null ? null : Number(r.plafond_jour_cents) },
      reglages: lignes.map((l) => ({ cle: l.cle, valeur: l.valeur, tbd: l.valeur == null || !!l.tbd, description: l.description || '' })),
      offres: offres.map((o) => ({ id: o.id, nom: o.nom, prix_cents: o.price_cents == null ? null : Number(o.price_cents), actif: !!o.actif })),
      promos: promos.map((p) => ({ code: p.code, actif: !!p.actif, pourcent_bp: p.pourcent_bp, montant_cents: p.montant_cents, expire_le: p.expire_le })),
      journal: journal.map((j) => ({ quand: j.created_at, qui: j.acteur, action: j.action, cible: j.cible }))
    });
  }

  const c = rq.corps || {};
  if (c.action === 'valider_org') {
    if (!['valide', 'refuse', 'suspendu'].includes(c.decision)) return erreur(400, 'DECISION', 'Décision inconnue.');
    const r = await ctx.depot.update('pro_orgs', { id: c.org_id }, { statut: c.decision, valide_par: u.email, valide_le: ctx.maintenant().toISOString() });
    await auditer(ctx, u, 'org_' + c.decision, c.org_id, {});
    return ok({ organisation: r[0] ? { id: r[0].id, statut: r[0].statut } : null });
  }

  if (c.action === 'livrer' || c.action === 'reprendre') {
    const d = (await ctx.depot.select('pro_dossiers', { id: c.dossier_id }, { limite: 1 }))[0];
    if (!d) return erreur(404, 'INTROUVABLE', 'Dossier introuvable.');
    if (c.action === 'reprendre') {
      if (!['paroles_en_cours', 'musique_en_cours'].includes(c.vers)) return erreur(400, 'VERS', 'Destination inconnue.');
      const t = await transition(ctx, d, c.vers, 'maison', u);
      if (!t.ok) return erreur(409, t.code, 'Reprise impossible à ce stade.');
      const type = c.vers === 'paroles_en_cours' ? 'paroles' : 'musique';
      const n = (await ctx.depot.select('pro_jobs', { dossier_id: d.id, type })).length;
      const ver = type === 'musique'
        ? (((await ctx.depot.select('pro_lyrics_versions', { dossier_id: d.id }, { ordre: 'version.desc', limite: 1 }))[0] || {}).version || 1) * 100 + n
        : n + 1;
      await ctx.depot.insert('pro_jobs', { dossier_id: d.id, type, version: ver, etat: 'a_faire', tentatives: 0, prochain_essai: ctx.maintenant().toISOString(), donnees: { essai: d.mode === 'essai' } }, { ignorerDoublon: true, conflit: 'dossier_id,type,version' });
      return ok({ dossier: { id: d.id, status: c.vers } });
    }
    const piste = (await ctx.depot.select('pro_tracks', { id: c.piste_id, dossier_id: d.id }, { limite: 1 }))[0];
    if (!piste) return erreur(400, 'PISTE', 'Choisissez la piste à livrer.');
    await ctx.depot.update('pro_tracks', { id: piste.id }, { valide_maison: true });
    const t = await transition(ctx, d, 'livre', 'maison', u, { audio_url: piste.chemin });
    if (!t.ok) return erreur(409, t.code, 'Livraison impossible à ce stade.');
    await ctx.depot.update('pro_trials', { dossier_id: d.id }, { statut: 'livre' });
    const courriel = await prevenirLivraison(ctx, d);
    return ok({ dossier: { id: d.id, status: 'livre' }, courriel });
  }

  if (c.action === 'relancer') {
    const d = (await ctx.depot.select('pro_dossiers', { id: c.dossier_id }, { limite: 1 }))[0];
    if (!d) return erreur(404, 'INTROUVABLE', 'Dossier introuvable.');
    const travaux = await ctx.depot.select('pro_jobs', { dossier_id: d.id, type: c.type === 'musique' ? 'musique' : 'paroles' }, { ordre: 'id.desc', limite: 1 });
    const job = travaux[0];
    if (!job || !['echec', 'bloque'].includes(job.etat)) return erreur(409, 'RIEN', 'Aucun travail à relancer.');
    if (d.status === 'echec' && job.type === 'musique') {
      const t = await transition(ctx, d, 'musique_en_cours', 'maison', u);
      if (!t.ok) return erreur(409, t.code, 'Relance impossible.');
    }
    await ctx.depot.update('pro_jobs', { id: job.id }, {
      etat: 'a_faire', tentatives: 0, verrou_jusqua: null, prochain_essai: ctx.maintenant().toISOString(),
      donnees: Object.assign({}, job.donnees || {}, { phase: null })
    });
    await auditer(ctx, u, 'job_relance', d.id, { type: job.type });
    return ok({ relance: true });
  }

  if (c.action === 'reglage') {
    if (!CLES_REGLAGES.includes(c.cle)) return erreur(400, 'CLE', 'Réglage inconnu.');
    let v = c.valeur;
    if (v === '' || v === undefined) v = null;
    if (v != null && ENTIERS.includes(c.cle)) {
      if (!/^\d{1,9}$/.test(String(v))) return erreur(400, 'VALEUR', 'Nombre entier positif attendu.');
      v = String(Number(v));
    }
    if (c.cle === 'essai_mode' && v != null && !['complet', 'extrait'].includes(v)) return erreur(400, 'VALEUR', 'complet ou extrait.');
    const lignes = await ctx.depot.update('pro_settings', { cle: c.cle }, { valeur: v == null ? null : String(v).slice(0, 300), tbd: v == null, maj_par: u.email, maj_le: ctx.maintenant().toISOString() });
    if (!lignes.length) await ctx.depot.insert('pro_settings', { cle: c.cle, valeur: v, tbd: v == null, maj_par: u.email });
    await auditer(ctx, u, 'reglage', c.cle, { valeur: v });
    return ok({ cle: c.cle, valeur: v });
  }

  if (c.action === 'offre') {
    const patch = {};
    if (c.price_cents === null || c.price_cents === '') patch.price_cents = null;
    else if (c.price_cents !== undefined) {
      if (!/^\d{1,7}$/.test(String(c.price_cents))) return erreur(400, 'PRIX', 'Prix en centimes, entier positif.');
      patch.price_cents = Number(c.price_cents);
    }
    if (typeof c.actif === 'boolean') patch.actif = c.actif;
    patch.tbd = patch.price_cents == null;
    const r = await ctx.depot.update('pro_offers', { id: c.id }, patch);
    if (!r.length) return erreur(404, 'OFFRE', 'Offre inconnue.');
    await auditer(ctx, u, 'offre', c.id, patch);
    return ok({ offre: { id: r[0].id, prix_cents: r[0].price_cents } });
  }

  if (c.action === 'promos_sync') {
    if (!stripeConfigure(ctx.env)) return erreur(503, 'PAIEMENT_NON_CONFIGURE', 'Le paiement n’est pas configuré.');
    const l = await stripe(ctx.env, 'GET', '/v1/promotion_codes', { limit: 100 });
    let n = 0;
    for (const p of (l && l.data) || []) {
      const ligne = {
        code: p.code, stripe_promotion_code_id: p.id, actif: !!p.active,
        pourcent_bp: p.coupon && p.coupon.percent_off != null ? Math.round(p.coupon.percent_off * 100) : null,
        montant_cents: p.coupon && p.coupon.amount_off != null ? p.coupon.amount_off : null,
        expire_le: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null, maj_le: ctx.maintenant().toISOString()
      };
      const maj = await ctx.depot.update('pro_promo_codes', { stripe_promotion_code_id: p.id }, ligne);
      if (!maj.length) await ctx.depot.insert('pro_promo_codes', ligne);
      n++;
    }
    await auditer(ctx, u, 'promos_sync', null, { n });
    return ok({ synchronises: n });
  }
  return erreur(400, 'ACTION_INCONNUE', 'Action inconnue.');
}
admin.nom = 'admin';

module.exports = admin;
module.exports.CLES_REGLAGES = CLES_REGLAGES;
