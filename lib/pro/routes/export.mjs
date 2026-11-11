// GET /api/pro/export?mois=2026-11&org_id=… — export comptable mensuel (CSV, séparateur « ; »).
// La maison exporte tout ; un administrateur d'agence, sa seule agence.
// Aucun nom de défunt : la référence du dossier suffit à la comptabilité.
import { erreur, rolePro, ROLES_ADMIN, MAISON, reglages } from '../socle.mjs';

function cellule(v) {
  const s = v == null ? '' : String(v);
  // Neutralise les formules à l'ouverture dans un tableur (=, +, -, @).
  const sur = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
  return /[;"\n]/.test(sur) ? '"' + sur.replace(/"/g, '""') + '"' : sur;
}

function euros(c) {
  return (Number(c || 0) / 100).toFixed(2).replace('.', ',');
}

export default async function exporter(rq, ctx) {
  const u = rq.utilisateur;
  const mois = String(rq.query.mois || '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mois)) return erreur(400, 'MOIS', 'Mois attendu au format AAAA-MM.');
  const maison = MAISON.includes(u.roleMaison);
  const orgId = rq.query.org_id || null;
  if (!maison) {
    if (!orgId) return erreur(400, 'ORG_REQUISE', 'Organisation manquante.');
    const role = await rolePro(ctx, u, orgId);
    if (!role || !ROLES_ADMIN.includes(role)) return erreur(403, 'ADMIN_REQUIS', 'Réservé aux administrateurs de l’agence.');
  }
  const [a, m] = mois.split('-').map(Number);
  const debut = new Date(Date.UTC(a, m - 1, 1)).toISOString();
  const fin = new Date(Date.UTC(a, m, 1)).toISOString();
  const filtres = { created_at: { op: 'gte', v: debut } };
  if (orgId) filtres.org_id = orgId;
  const paiements = (await ctx.depot.select('pro_payments', filtres, { ordre: 'created_at.asc', limite: 5000 }))
    .filter((p) => p.created_at < fin);
  const ids = [...new Set(paiements.map((p) => p.dossier_id))];
  const dossiers = ids.length ? await ctx.depot.select('pro_dossiers', { id: { op: 'in', v: ids } }) : [];
  const orgs = await ctx.depot.select('pro_orgs', orgId ? { id: orgId } : {});
  const r = await reglages(ctx);
  const mention = r.tva_bp == null ? (r.mention_tva || 'TVA non applicable, art. 293 B du CGI') : `TVA ${Number(r.tva_bp) / 100} %`;
  const lignes = [['Date', 'Agence', 'SIRET', 'Dossier', 'Méthode', 'Statut', 'Montant TTC (EUR)', 'Code promo', 'Référence paiement', 'TVA'].join(';')];
  for (const p of paiements) {
    const d = dossiers.find((x) => x.id === p.dossier_id) || {};
    const o = orgs.find((x) => x.id === p.org_id) || {};
    lignes.push([
      String(p.created_at).slice(0, 10), o.nom, o.siret, d.reference, p.methode, p.statut, euros(p.montant_cents),
      p.promo_code, p.stripe_session_id, mention
    ].map(cellule).join(';'));
  }
  return {
    status: 200,
    texte: '﻿' + lignes.join('\r\n') + '\r\n',
    entetes: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="melodia-pro-${mois}.csv"`
    }
  };
}
exporter.nom = 'export';
