// ═══════════════════════════════════════════════════════════════
// /api/music-config — La composition automatique est-elle branchée ?
// Permet à la console d'afficher l'état réel sans exposer la clé.
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const base = (process.env.MUREKA_API_URL || 'https://api.mureka.ai').replace(/\/+$/, '');
  const key = process.env.MUREKA_API_KEY;

  return res.status(200).json({
    configured: !!key,
    provider: base.replace(/^https?:\/\//, ''),
    engine: 'Mureka',
    model: process.env.MUREKA_MODEL || 'auto',
    // Empreinte seulement : de quoi vérifier que c'est la bonne clé,
    // sans jamais la divulguer.
    key_hint: key ? key.slice(0, 3) + '…' + key.slice(-2) : null
  });
}
