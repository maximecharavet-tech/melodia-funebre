// ═══════════════════════════════════════════════════════════════
// /api/generate-music — Lance la composition musicale via Mureka
//
// Mureka (mureka.ai, SkyworkAI) expose une API publique avec clé,
// contrairement à Suno. Le traitement est asynchrone : cette fonction
// renvoie un identifiant de tâche, interrogé ensuite par
// /api/music-status.
//
// Variables d'environnement (Vercel → Settings → Environment Variables) :
//   MUREKA_API_KEY   obligatoire — clé du tableau de bord Mureka
//   MUREKA_API_URL   facultatif — https://api.mureka.ai par défaut
//   MUREKA_MODEL     facultatif — « auto » par défaut
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_MS = 30000;
const DEFAUT_URL = 'https://api.mureka.ai';

/**
 * Mureka ne prend pas de champs séparés pour la voix ou les styles à
 * exclure : tout passe par une description libre. On la compose ici.
 */
function construirePrompt(style, voix, exclure) {
  const morceaux = [];
  morceaux.push((style || 'french chanson, emotional, acoustic, warm').trim());
  if (voix === 'm') morceaux.push('male vocal');
  else if (voix === 'f') morceaux.push('female vocal');
  if (exclure) morceaux.push('avoid: ' + String(exclure).trim());
  return morceaux.filter(Boolean).join(', ').slice(0, 500);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const base = (process.env.MUREKA_API_URL || DEFAUT_URL).replace(/\/+$/, '');
  const key = process.env.MUREKA_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: 'La composition automatique n\'est pas configurée.',
      code: 'NOT_CONFIGURED',
      hint: 'Renseignez MUREKA_API_KEY dans Vercel → Settings → Environment Variables, puis redéployez.'
    });
  }

  const { title, lyrics, style_prompt, instrumental, negative_tags, vocal_gender } = req.body || {};
  if (!lyrics && !instrumental) {
    return res.status(400).json({ error: 'Les paroles sont requises (ou cochez « instrumental »).' });
  }

  const modele = process.env.MUREKA_MODEL || 'auto';
  const prompt = construirePrompt(style_prompt, vocal_gender, negative_tags);

  // Deux points d'entrée distincts selon qu'il y a une voix ou non
  const chemin = instrumental ? '/v1/instrumental/generate' : '/v1/song/generate';
  const corps = instrumental
    ? { model: modele, prompt }
    : { model: modele, prompt, lyrics: String(lyrics).slice(0, 3000) };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(base + chemin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify(corps),
      signal: ctrl.signal
    });

    const texte = await r.text();
    let data;
    try { data = JSON.parse(texte); } catch (e) { data = { raw: texte }; }

    if (!r.ok) {
      const msg = data.error?.message || data.message || data.msg || data.error
        || `Mureka a répondu ${r.status}.`;
      return res.status(r.status).json({
        error: typeof msg === 'string' ? msg : JSON.stringify(msg),
        code: r.status === 401 || r.status === 403 ? 'BAD_KEY' : 'PROVIDER_ERROR',
        status: r.status,
        trace_id: data.trace_id || null
      });
    }

    const taskId = data.id || data.task_id || data.taskId || data.data?.id;
    if (!taskId) {
      return res.status(502).json({
        error: 'Mureka n\'a pas renvoyé d\'identifiant de tâche.',
        code: 'NO_TASK_ID',
        detail: data
      });
    }

    return res.status(200).json({
      taskId,
      kind: instrumental ? 'instrumental' : 'song',
      model: data.model || modele,
      status: data.status || 'preparing',
      prompt
    });
  } catch (err) {
    const coupe = err.name === 'AbortError';
    return res.status(coupe ? 504 : 500).json({
      error: coupe
        ? 'Mureka n\'a pas répondu dans les 30 secondes.'
        : 'Échec de la requête musique : ' + err.message,
      code: coupe ? 'TIMEOUT' : 'FETCH_FAILED'
    });
  } finally {
    clearTimeout(timer);
  }
}
