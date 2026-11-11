// /api/pro/invitations
//   GET  ?org_id=…                                         membres et invitations en cours
//   POST { action: 'inviter', org_id, email, role }        → lien à transmettre (et courriel si configuré)
//   POST { action: 'accepter', jeton }                     par la personne invitée, connectée avec la même adresse
//   POST { action: 'role', org_id, membre_id, role }       changer un rôle (owner/admin)
//   POST { action: 'retirer', org_id, membre_id }
//
// Le jeton d'invitation n'est conservé qu'en empreinte SHA-256 : une fuite de
// la table ne permet pas de rejoindre une agence.
'use strict';
const crypto = require('node:crypto');
const { erreur, ok, rolePro, auditer, ROLES_ADMIN, MAISON } = require('../socle.cjs');
const { urlSite } = require('./checkout.cjs');

const ROLES = ['owner', 'admin', 'conseiller', 'lecture'];
const hache = (j) => crypto.createHash('sha256').update('melodia-invitation|' + j).digest('hex');

async function invitations(rq, ctx) {
  const u = rq.utilisateur;
  const c = rq.corps || {};
  const maison = MAISON.includes(u.roleMaison);

  if (c.action === 'accepter') {
    const j = String(c.jeton || '');
    if (!/^[A-Za-z0-9_-]{30,64}$/.test(j)) return erreur(400, 'JETON', 'Invitation invalide.');
    const inv = (await ctx.depot.select('pro_invitations', { jeton_hash: hache(j) }, { limite: 1 }))[0];
    if (!inv || inv.acceptee_le || new Date(inv.expire_le) < ctx.maintenant()) return erreur(410, 'EXPIREE', 'Cette invitation n’est plus valable.');
    if (String(inv.email).toLowerCase() !== String(u.email).toLowerCase()) {
      return erreur(403, 'AUTRE_ADRESSE', 'Connectez-vous avec l’adresse qui a reçu l’invitation.');
    }
    await ctx.depot.insert('pro_members', { org_id: inv.org_id, user_id: u.id, email: u.email, role: inv.role, statut: 'actif' }, { ignorerDoublon: true, conflit: 'org_id,user_id' });
    await ctx.depot.update('pro_invitations', { id: inv.id }, { acceptee_le: ctx.maintenant().toISOString() });
    await auditer(ctx, u, 'invitation_acceptee', inv.org_id, {});
    return ok({ org_id: inv.org_id });
  }

  const orgId = rq.methode === 'GET' ? rq.query.org_id : c.org_id;
  const monRole = maison ? 'owner' : await rolePro(ctx, u, orgId);
  if (rq.methode === 'GET') {
    if (!monRole) return erreur(404, 'INTROUVABLE', 'Organisation introuvable.');
    const membres = await ctx.depot.select('pro_members', { org_id: orgId });
    const inv = ROLES_ADMIN.includes(monRole) ? await ctx.depot.select('pro_invitations', { org_id: orgId, acceptee_le: { op: 'is', v: null } }) : [];
    return ok({
      membres: membres.map((m) => ({ id: m.id, email: m.email, role: m.role, statut: m.statut })),
      invitations: inv.map((i) => ({ id: i.id, email: i.email, role: i.role, expire_le: i.expire_le }))
    });
  }
  if (!monRole || !ROLES_ADMIN.includes(monRole)) return erreur(403, 'ADMIN_REQUIS', 'Réservé aux administrateurs de l’agence.');

  if (c.action === 'inviter') {
    const email = String(c.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return erreur(400, 'EMAIL', 'Adresse e-mail invalide.');
    if (!ROLES.includes(c.role) || (c.role === 'owner' && monRole !== 'owner')) return erreur(400, 'ROLE', 'Rôle non permis.');
    const jeton = crypto.randomBytes(24).toString('base64url');
    await ctx.depot.insert('pro_invitations', {
      org_id: orgId, email, role: c.role, jeton_hash: hache(jeton), cree_par: u.email,
      expire_le: new Date(ctx.maintenant().getTime() + 7 * 86400_000).toISOString()
    });
    await auditer(ctx, u, 'invitation', orgId, { role: c.role });
    return ok({ lien: `${urlSite(ctx.env)}/pro#/invitation/${jeton}`, expire_jours: 7 }, 201);
  }
  if (c.action === 'role' || c.action === 'retirer') {
    const m = (await ctx.depot.select('pro_members', { id: c.membre_id, org_id: orgId }, { limite: 1 }))[0];
    if (!m) return erreur(404, 'INTROUVABLE', 'Membre introuvable.');
    const owners = (await ctx.depot.select('pro_members', { org_id: orgId, role: 'owner', statut: 'actif' })).length;
    if (m.role === 'owner' && owners <= 1) return erreur(409, 'DERNIER_PROPRIETAIRE', 'L’agence doit garder au moins un propriétaire.');
    if (c.action === 'retirer') {
      await ctx.depot.update('pro_members', { id: m.id }, { statut: 'suspendu' });
    } else {
      if (!ROLES.includes(c.role) || (c.role === 'owner' && monRole !== 'owner')) return erreur(400, 'ROLE', 'Rôle non permis.');
      await ctx.depot.update('pro_members', { id: m.id }, { role: c.role });
    }
    await auditer(ctx, u, 'membre_' + c.action, orgId, { membre: m.id });
    return ok({});
  }
  return erreur(400, 'ACTION_INCONNUE', 'Action inconnue.');
}
invitations.nom = 'invitations';

module.exports = invitations;
