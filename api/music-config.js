// ═══════════════════════════════════════════════════════════════
// /api/music-config — La composition automatique est-elle branchée ?
// Permet à la console d'afficher l'état réel sans exposer la clé.
//
// Marque blanche (décision du 11/11/2026) : ni nom de fournisseur, ni
// adresse d'API, ni indice de clé dans la réponse — elle est publique.
// ═══════════════════════════════════════════════════════════════

import { poserCors } from '../lib/pro/socle.cjs';

export default async function handler(req, res) {
  poserCors(req, res, 'GET');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(200).json({
    configured: !!process.env.MUREKA_API_KEY,
    engine: 'Melodia Funèbre',
    model: 'composition'
  });
}
