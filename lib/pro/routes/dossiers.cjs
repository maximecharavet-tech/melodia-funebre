// /api/pro/dossiers
//   GET  ?org_id=…              liste (champs d'affichage seulement)
//   GET  ?id=…                  fiche complète
//   POST { action: 'creer', org_id }
//   POST { action: 'questionnaire', id, donnees, version_base }   sauvegarde versionnée
//   POST { action: 'statut', id, vers }                           transitions côté agence
//   POST { action: 'paroles', id, titre, paroles, prompt_musique } version éditée par le conseiller
'use strict';
const { erreur, ok, accesDossier, transition, jetonAleatoire, rolePro, auditer, MAISON, ROLES_ECRITURE } = require('../socle.cjs');
const { noyau } = require('../noyau.cjs');

const EDITABLE = ['brouillon', 'complet'];
const STATUTS_AGENCE = ['complet', 'brouillon', 'annule', 'revision_demandee'];

function resume(d) {
  return {
    id: d.id, reference: d.reference, status: d.status, paid: !!d.paid, mode: d.mode, offre_id: d.offre_id,
    prenom: d.prenom_affiche || '', titre: d.titre || '', ceremonie_le: d.ceremonie_le || null,
    date_limite: d.date_limite || null, updated_at: d.updated_at || d.created_at, created_at: d.created_at,
    org_id: d.org_id
  };
}

async function derniere(ctx, table, dossierId) {
  return (await ctx.depot.select(table, { dossier_id: dossierId }, { ordre: 'version.desc', limite: 1 }))[0] || null;
}

async function dossiers(rq, ctx) {
  const u = rq.utilisateur;
  if (rq.methode === 'GET') {
    if (rq.query.id) {
      const a = await accesDossier(ctx, u, rq.query.id);
      if (a.erreur) return a.erreur;
      const d = a.dossier;
      const q = await derniere(ctx, 'pro_questionnaires', d.id);
      const versions = await ctx.depot.select('pro_lyrics_versions', { dossier_id: d.id }, { ordre: 'version.desc', limite: 20 });
      const pistes = await ctx.depot.select('pro_tracks', { dossier_id: d.id }, { ordre: 'version.desc' });
      const qr = (await ctx.depot.select('pro_qr', { dossier_id: d.id }, { limite: 1 }))[0] || null;
      const travaux = await ctx.depot.select('pro_jobs', { dossier_id: d.id }, { ordre: 'id.desc', limite: 5 });
      const k = await noyau();
      // Les pistes non validées par la maison ne sont pas écoutables par l'agence.
      const visibles = a.acteur === 'maison' ? pistes : pistes.filter((p) => p.valide_maison);
      const ecoutes = [];
      for (const p of visibles) {
        ecoutes.push({ id: p.id, version: p.version, duree_s: p.duree_s, mode: p.mode, valide_maison: !!p.valide_maison,
          url: p.chemin ? await ctx.depot.urlSignee('pro-audio', p.chemin, 3600) : null });
      }
      return ok({
        dossier: resume(d),
        acteur: a.acteur,
        questionnaire: q ? { version: q.version, donnees: q.donnees } : null,
        paroles: versions.map((v) => ({ version: v.version, titre: v.titre, paroles: v.paroles, prompt_musique: v.prompt_musique, auteur: v.auteur, created_at: v.created_at })),
        pistes: ecoutes,
        qr: qr ? { jeton: qr.jeton, visibilite: qr.visibilite, actif: !!qr.actif, scans: qr.scans || 0, afficher_paroles: !!qr.afficher_paroles, mot_famille: qr.mot_famille || '' } : null,
        travaux: travaux.map((t) => ({ type: t.type, etat: t.etat, tentatives: t.tentatives, version: t.version })),
        suivants: k.statutSuivants({ de: d.status, acteur: a.acteur === 'maison' ? 'maison' : 'agence' }).suivants
      });
    }
    const orgId = rq.query.org_id;
    if (!orgId) return erreur(400, 'ORG_REQUISE', 'Organisation manquante.');
    if (!MAISON.includes(u.roleMaison) && !(await rolePro(ctx, u, orgId))) return erreur(404, 'INTROUVABLE', 'Organisation introuvable.');
    const liste = await ctx.depot.select('pro_dossiers', { org_id: orgId }, { ordre: 'updated_at.desc', limite: 500 });
    return ok({ dossiers: liste.map(resume) });
  }

  const c = rq.corps || {};
  if (c.action === 'creer') {
    if (!c.org_id) return erreur(400, 'ORG_REQUISE', 'Organisation manquante.');
    const maison = MAISON.includes(u.roleMaison);
    const role = maison ? 'owner' : await rolePro(ctx, u, c.org_id);
    if (!role || !ROLES_ECRITURE.includes(role)) return erreur(403, 'LECTURE_SEULE', 'Votre rôle ne permet pas de créer un dossier.');
    const org = (await ctx.depot.select('pro_orgs', { id: c.org_id }, { limite: 1 }))[0];
    if (!org || (org.statut !== 'valide' && !maison)) {
      return erreur(403, 'ORG_NON_VALIDEE', 'Votre agence doit d’abord être validée par la maison.');
    }
    const d = (await ctx.depot.insert('pro_dossiers', {
      org_id: c.org_id, reference: 'MF-' + jetonAleatoire(6), status: 'brouillon', paid: false,
      created_by: u.id, questionnaire_version: 0, updated_at: new Date().toISOString()
    }))[0];
    await auditer(ctx, u, 'dossier_cree', d.id, {});
    return ok({ dossier: resume(d) }, 201);
  }

  const a = await accesDossier(ctx, u, c.id, { ecriture: true });
  if (a.erreur) return a.erreur;
  const d = a.dossier;
  const k = await noyau();

  if (c.action === 'questionnaire') {
    if (!EDITABLE.includes(d.status)) return erreur(409, 'NON_MODIFIABLE', 'Ce dossier n’est plus modifiable à ce stade.');
    const donnees = c.donnees && typeof c.donnees === 'object' ? c.donnees : null;
    if (!donnees) return erreur(400, 'DONNEES', 'Questionnaire manquant.');
    if (JSON.stringify(donnees).length > 60_000) return erreur(413, 'TROP_LONG', 'Le questionnaire est trop long.');
    const version = (d.questionnaire_version || 0) + 1;
    if (c.version_base != null && Number(c.version_base) !== (d.questionnaire_version || 0)) {
      return erreur(409, 'VERSION', 'Le dossier a été modifié ailleurs. Rechargez avant d’enregistrer.');
    }
    await ctx.depot.insert('pro_questionnaires', { dossier_id: d.id, version, donnees, auteur: u.id });
    const v = k.questionnaireValider(donnees);
    const def = donnees.defunt || {};
    const cer = donnees.ceremonie || {};
    const patch = {
      questionnaire_version: version, updated_at: new Date().toISOString(),
      prenom_affiche: String(def.prenom || '').slice(0, 80),
      titre: String((donnees.message || {}).titre || '').slice(0, 120),
      ceremonie_le: cer.date_ceremonie || null, date_limite: cer.date_limite || null,
      offre_id: (donnees.offre || {}).offre_id || null, mode: (donnees.offre || {}).mode || null
    };
    await ctx.depot.update('pro_dossiers', { id: d.id }, patch);
    return ok({ version, validation: v });
  }

  if (c.action === 'statut') {
    if (!STATUTS_AGENCE.includes(c.vers)) return erreur(400, 'STATUT', 'Changement d’état non permis ici.');
    if (c.vers === 'complet') {
      const q = await derniere(ctx, 'pro_questionnaires', d.id);
      const v = k.questionnaireValider(q ? q.donnees : {});
      if (!v.complet) return erreur(422, 'INCOMPLET', 'Le questionnaire n’est pas complet.');
    }
    const t = await transition(ctx, d, c.vers, a.acteur === 'maison' ? 'maison' : 'agence', u);
    if (!t.ok) return erreur(409, t.code, 'Ce changement d’état n’est pas possible maintenant.');
    return ok({ dossier: resume(t.dossier) });
  }

  if (c.action === 'paroles') {
    if (!['paroles_a_valider', 'revision_demandee'].includes(d.status)) {
      return erreur(409, 'NON_MODIFIABLE', 'Les paroles ne sont pas modifiables à ce stade.');
    }
    const q = await derniere(ctx, 'pro_questionnaires', d.id);
    const artistes = (((q && q.donnees) || {}).musique || {}).artistes || [];
    const paroles = String(c.paroles || '');
    if (paroles.trim().length < 20) return erreur(400, 'PAROLES', 'Les paroles sont trop courtes.');
    if (paroles.length > 3000) return erreur(400, 'PAROLES', 'Les paroles dépassent 3 000 caractères.');
    const p = k.promptAssainir({ texte: String(c.prompt_musique || ''), artistes });
    const prec = await derniere(ctx, 'pro_lyrics_versions', d.id);
    const version = (prec ? prec.version : 0) + 1;
    await ctx.depot.insert('pro_lyrics_versions', {
      dossier_id: d.id, version, titre: String(c.titre || (prec && prec.titre) || '').slice(0, 120),
      paroles: k.questionnaireNettoyer({ texte: paroles }).propre,
      prompt_musique: p.texte, auteur: a.acteur === 'maison' ? 'maison' : 'conseiller'
    });
    return ok({ version, prompt_musique: p.texte, segments_retires: p.segments_retires });
  }
  return erreur(400, 'ACTION_INCONNUE', 'Action inconnue.');
}
dossiers.nom = 'dossiers';

module.exports = dossiers;
