// /api/pro/orgs
//   POST { action: 'creer', nom, siret, email, telephone }    → organisation en attente de validation maison
//   POST { action: 'reglages', org_id, cobranding, mode_famille_defaut, nom }
//   POST { action: 'logo', org_id, type, base64 }             → PNG / JPEG / WebP ≤ 2 Mo, jamais de SVG
import { erreur, ok, auditer, rolePro, ROLES_ADMIN, MAISON } from '../socle.mjs';
import { noyau } from '../noyau.mjs';

const TYPES = {
  'image/png': { ext: 'png', magie: (b) => b.length > 8 && b.readUInt32BE(0) === 0x89504e47 },
  'image/jpeg': { ext: 'jpg', magie: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/webp': { ext: 'webp', magie: (b) => b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP' }
};
export const LOGO_MAX = 2 * 1024 * 1024;

/** Contrôle un fichier image : type déclaré ET signature binaire, taille. */
export function controlerImage(type, octets) {
  const t = TYPES[type];
  if (!t) return 'TYPE_REFUSE';
  if (!octets || !octets.length) return 'VIDE';
  if (octets.length > LOGO_MAX) return 'TROP_GROS';
  if (!t.magie(octets)) return 'SIGNATURE_INVALIDE';
  return null;
}

export default async function orgs(rq, ctx) {
  const u = rq.utilisateur;
  const c = rq.corps || {};
  if (c.action === 'creer') {
    const nom = String(c.nom || '').trim().slice(0, 120);
    if (nom.length < 2) return erreur(400, 'NOM_REQUIS', 'Indiquez le nom de l’agence.');
    const k = await noyau();
    const s = k.siretValider({ siret: String(c.siret || '') });
    if (!s.valide) return erreur(400, 'SIRET_INVALIDE', 'Ce numéro SIRET n’est pas valide (14 chiffres).');
    const org = (await ctx.depot.insert('pro_orgs', {
      nom, siret: s.canonique, email: String(c.email || u.email).toLowerCase().slice(0, 200),
      telephone: String(c.telephone || '').slice(0, 30), statut: 'en_attente', cobranding: true
    }))[0];
    await ctx.depot.insert('pro_members', { org_id: org.id, user_id: u.id, email: u.email, role: 'owner', statut: 'actif' });
    await auditer(ctx, u, 'org_creee', org.id, {});
    return ok({ organisation: { id: org.id, nom: org.nom, statut: org.statut } }, 201);
  }

  const orgId = c.org_id;
  if (!orgId) return erreur(400, 'ORG_REQUISE', 'Organisation manquante.');
  const maison = MAISON.includes(u.roleMaison);
  const role = maison ? 'owner' : await rolePro(ctx, u, orgId);
  if (!role || !ROLES_ADMIN.includes(role)) return erreur(403, 'ADMIN_REQUIS', 'Réservé aux administrateurs de l’agence.');

  if (c.action === 'reglages') {
    const patch = { updated_at: new Date().toISOString() };
    if (typeof c.cobranding === 'boolean') patch.cobranding = c.cobranding;
    if (typeof c.mode_famille_defaut === 'boolean') patch.mode_famille_defaut = c.mode_famille_defaut;
    if (typeof c.nom === 'string' && c.nom.trim().length >= 2) patch.nom = c.nom.trim().slice(0, 120);
    const r = await ctx.depot.update('pro_orgs', { id: orgId }, patch);
    await auditer(ctx, u, 'org_reglages', orgId, Object.keys(patch));
    return ok({ organisation: r[0] ? { id: r[0].id, nom: r[0].nom, cobranding: r[0].cobranding } : null });
  }

  if (c.action === 'logo') {
    let octets;
    try { octets = Buffer.from(String(c.base64 || ''), 'base64'); } catch (e) { octets = null; }
    const refus = controlerImage(String(c.type || ''), octets);
    if (refus) {
      const msg = {
        TYPE_REFUSE: 'Formats acceptés : PNG, JPEG ou WebP. Le SVG n’est pas accepté.',
        TROP_GROS: 'Le logo dépasse 2 Mo.',
        SIGNATURE_INVALIDE: 'Ce fichier n’est pas une image valide.',
        VIDE: 'Fichier vide.'
      }[refus];
      return erreur(400, refus, msg);
    }
    const chemin = `${orgId}/logo.${TYPES[c.type].ext}`;
    await ctx.depot.deposer('pro-pieces', chemin, octets, c.type);
    await ctx.depot.update('pro_orgs', { id: orgId }, { logo_path: chemin, updated_at: new Date().toISOString() });
    await auditer(ctx, u, 'org_logo', orgId, { taille: octets.length });
    return ok({ logo: true });
  }
  return erreur(400, 'ACTION_INCONNUE', 'Action inconnue.');
}
orgs.nom = 'orgs';
