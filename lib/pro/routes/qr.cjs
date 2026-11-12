// /api/pro/qr
//   POST { dossier_id }                                  crée (ou rend) le jeton stable du mémorial
//   POST { dossier_id, visibilite, code, actif, afficher_paroles, mot_famille }   réglages du mémorial
//
// L'adresse est https://melodia-funebre.fr/m/<jeton> : 12 caractères Crockford
// tirés au hasard, aucun nom, aucune date. Le dessin du QR se fait dans le
// navigateur avec le même noyau Rust (aucune donnée ne repart vers le serveur).
'use strict';
const crypto = require('node:crypto');
const { erreur, ok, accesDossier, jetonAleatoire, auditer } = require('../socle.cjs');

const VISIBILITES = ['public', 'lien', 'code', 'non'];

function hacherCode(code, jeton) {
  return crypto.createHash('sha256').update('melodia-memorial|' + jeton + '|' + String(code).trim().toUpperCase()).digest('hex');
}

async function qr(rq, ctx) {
  const c = rq.corps || {};
  const a = await accesDossier(ctx, rq.utilisateur, c.dossier_id, { ecriture: true });
  if (a.erreur) return a.erreur;
  const d = a.dossier;
  let q = (await ctx.depot.select('pro_qr', { dossier_id: d.id }, { limite: 1 }))[0];
  if (!q) {
    const quest = (await ctx.depot.select('pro_questionnaires', { dossier_id: d.id }, { ordre: 'version.desc', limite: 1 }))[0];
    const vis = (((quest && quest.donnees) || {}).consentements || {}).visibilite;
    for (let i = 0; i < 5 && !q; i++) {
      try {
        q = (await ctx.depot.insert('pro_qr', {
          dossier_id: d.id, jeton: jetonAleatoire(12), visibilite: VISIBILITES.includes(vis) ? vis : 'lien',
          actif: false, scans: 0, afficher_paroles: false
        }))[0];
      } catch (e) { if (!e.doublon) throw e; }
    }
    if (!q) return erreur(500, 'JETON', 'Impossible de créer l’adresse du mémorial.');
    await auditer(ctx, rq.utilisateur, 'qr_cree', d.id, {});
  }
  const patch = {};
  if (VISIBILITES.includes(c.visibilite)) patch.visibilite = c.visibilite;
  if (typeof c.actif === 'boolean') {
    // Publier n'a de sens qu'une fois la chanson livrée et validée par la maison.
    if (c.actif && d.status !== 'livre') return erreur(409, 'NON_LIVRE', 'Le mémorial pourra être publié une fois la chanson livrée.');
    patch.actif = c.actif;
  }
  if (typeof c.afficher_paroles === 'boolean') patch.afficher_paroles = c.afficher_paroles;
  if (typeof c.mot_famille === 'string') patch.mot_famille = c.mot_famille.slice(0, 800);
  if (typeof c.code === 'string' && c.code.trim()) {
    if (c.code.trim().length < 4) return erreur(400, 'CODE_COURT', 'Le code d’accès doit compter au moins 4 caractères.');
    patch.code_hash = hacherCode(c.code, q.jeton);
  }
  if (Object.keys(patch).length) {
    q = (await ctx.depot.update('pro_qr', { id: q.id }, patch))[0];
    await auditer(ctx, rq.utilisateur, 'qr_reglages', d.id, Object.keys(patch));
  }
  return ok({
    qr: { jeton: q.jeton, url: 'https://melodia-funebre.fr/m/' + q.jeton, visibilite: q.visibilite, actif: !!q.actif,
      afficher_paroles: !!q.afficher_paroles, code: !!q.code_hash, scans: q.scans || 0 }
  });
}
qr.nom = 'qr';

module.exports = qr;
module.exports.hacherCode = hacherCode;
