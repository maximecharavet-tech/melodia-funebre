// ═══════════════════════════════════════════════════════════════
// /api/music-config — La composition automatique est-elle branchée ?
// Permet à la console d'afficher l'état réel sans exposer la clé.
//
// Marque blanche (décision du 11/11/2026) : ni nom de fournisseur, ni
// adresse d'API, ni indice de clé dans la réponse publique. L'adresse
// de l'atelier manuel n'est ajoutée que si une session maison est
// vérifiée : elle ne figure plus dans le JavaScript statique.
// ═══════════════════════════════════════════════════════════════

import { poserCors, jetonDe, contexteProduction } from '../lib/pro/socle.cjs';

export default async function handler(req, res) {
  poserCors(req, res, 'GET');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const corps = {
    configured: !!process.env.MUREKA_API_KEY,
    engine: 'Melodia Funèbre',
    model: 'composition'
  };
  try {
    const ctx = contexteProduction();
    const u = await ctx.verifierJeton(jetonDe(req));
    if (u) corps.manualUrl = 'https://suno.com/create';
  } catch (e) { /* sans session, l'adresse reste côté serveur */ }
  return res.status(200).json(corps);
}
