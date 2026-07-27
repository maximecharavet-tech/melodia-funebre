// ═══════════════════════════════════════════════════════════════
// /api/generate-music — Lance la composition musicale
// Compatible : API Suno officielle (sunoapi.org / api.sunoapi.org),
// suno-api self-hosted (gcui-art), PiAPI, ou tout endpoint au format v1.
//
// Variables d'environnement Vercel requises :
//   SUNO_API_URL  ex : https://api.sunoapi.org  (sans slash final)
//   SUNO_API_KEY  votre clé du service choisi
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const base = (process.env.SUNO_API_URL || '').replace(/\/+$/, '');
  const key = process.env.SUNO_API_KEY;
  if (!base || !key) {
    return res.status(500).json({
      error: 'SUNO_API_URL et SUNO_API_KEY doivent être définies dans Vercel → Settings → Environment Variables',
      hint: 'Ex : SUNO_API_URL=https://api.sunoapi.org — voir README section Musique'
    });
  }

  const { title, lyrics, style_prompt } = req.body || {};
  if (!lyrics) return res.status(400).json({ error: 'Les paroles (lyrics) sont requises' });

  try {
    // Format standard "custom mode" (paroles fournies + style contrôlé)
    const r = await fetch(`${base}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        customMode: true,
        instrumental: false,
        model: 'V4_5',
        title: (title || 'Hommage Melodia').slice(0, 80),
        prompt: lyrics.slice(0, 3000),
        style: (style_prompt || 'french chanson, emotional, acoustic').slice(0, 200),
        callBackUrl: ''
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.msg || data.error || 'Erreur du service musical' });
    }

    // La plupart des services retournent { data: { taskId } } ou { data: { task_id } }
    const taskId = data.data?.taskId || data.data?.task_id || data.taskId || data.id;
    return res.status(200).json({ taskId, raw: data });
  } catch (err) {
    return res.status(500).json({ error: 'Échec de la requête musique : ' + err.message });
  }
}
