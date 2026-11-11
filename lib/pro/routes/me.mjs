// GET /api/pro/me — qui suis-je, mes organisations, les offres, l'état des services.
import { adhesions, ok, reglages, nombre, MAISON } from '../socle.mjs';
import { stripeConfigure, parolierConfigure, musiqueConfiguree } from '../fournisseurs.mjs';

export default async function me(rq, ctx) {
  const u = rq.utilisateur;
  const membres = await adhesions(ctx, u);
  const ids = membres.map((m) => m.org_id);
  const orgs = ids.length ? await ctx.depot.select('pro_orgs', { id: { op: 'in', v: ids } }) : [];
  const offres = await ctx.depot.select('pro_offers', { actif: true }, { ordre: 'ordre.asc' });
  const r = await reglages(ctx);
  return ok({
    utilisateur: { id: u.id, email: u.email, maison: MAISON.includes(u.roleMaison), role_maison: u.roleMaison || null },
    organisations: orgs.map((o) => ({
      id: o.id, nom: o.nom, statut: o.statut, logo: !!o.logo_path, cobranding: !!o.cobranding,
      role: (membres.find((m) => m.org_id === o.id) || {}).role
    })),
    offres: offres.map((o) => ({
      id: o.id, nom: o.nom, description: o.description,
      // null = tarif non encore fixé (TBD) : l'interface l'affiche comme tel
      prix_cents: o.price_cents == null ? null : Number(o.price_cents)
    })),
    services: {
      paiement: stripeConfigure(ctx.env),
      paroles: parolierConfigure(ctx.env),
      musique: musiqueConfiguree(ctx.env),
      essai_duree_s: nombre(r.essai_duree_s),
      essais_ouverts: nombre(r.essai_par_org) != null && nombre(r.essai_plafond_jour) != null,
      mention_tva: r.tva_bp == null ? (r.mention_tva || 'TVA non applicable, art. 293 B du CGI') : ''
    }
  });
}
me.nom = 'me';
