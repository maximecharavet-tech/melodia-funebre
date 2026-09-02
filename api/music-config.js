// ═══════════════════════════════════════════════════════════════
// /api/music-config — La composition automatique est-elle branchée ?
// Permet à la console d'afficher l'état réel sans jamais exposer la clé.
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const base = (process.env.SUNO_API_URL || '').replace(/\/+$/, '');
  const key = process.env.SUNO_API_KEY;

  return res.status(200).json({
    configured: !!(base && key),
    provider: base ? base.replace(/^https?:\/\//, '') : null,
    model: process.env.SUNO_MODEL || 'V4_5',
    // Empreinte de la clé uniquement : de quoi vérifier qu'elle est bien la bonne,
    // sans jamais la divulguer.
    key_hint: key ? key.slice(0, 3) + '…' + key.slice(-2) : null
  });
}
