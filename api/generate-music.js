// ═══════════════════════════════════════════════════════════════
// /api/generate-music — Lance la composition musicale via l'API Suno
//
// Compatible avec les passerelles au format v1 : api.sunoapi.org,
// sunoapi.com, PiAPI, ou une instance suno-api auto-hébergée.
//
// Variables d'environnement (Vercel → Settings → Environment Variables) :
//   SUNO_API_URL       ex : https://api.sunoapi.org   (sans slash final)
//   SUNO_API_KEY       la clé fournie par le service
//   SUNO_MODEL         facultatif — V3_5 | V4 | V4_5 | V4_5PLUS | V5
//   SUNO_CALLBACK_URL  facultatif — certaines passerelles l'exigent
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_MS = 30000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const base = (process.env.SUNO_API_URL || '').replace(/\/+$/, '');
  const key = process.env.SUNO_API_KEY;
  if (!base || !key) {
    return res.status(503).json({
      error: 'La composition automatique n\'est pas configurée.',
      code: 'NOT_CONFIGURED',
      hint: 'Renseignez SUNO_API_URL et SUNO_API_KEY dans Vercel → Settings → Environment Variables, puis redéployez.'
    });
  }

  const { title, lyrics, style_prompt, instrumental, negative_tags, vocal_gender } = req.body || {};
  if (!lyrics && !instrumental) {
    return res.status(400).json({ error: 'Les paroles sont requises (ou cochez « instrumental »).' });
  }

  // Mode « custom » : on impose nos paroles et notre direction musicale,
  // au lieu de laisser le modèle inventer le texte.
  const payload = {
    customMode: true,
    instrumental: !!instrumental,
    model: process.env.SUNO_MODEL || 'V4_5',
    title: (title || 'Hommage Melodia').slice(0, 80),
    prompt: String(lyrics || '').slice(0, 3000),
    style: (style_prompt || 'french chanson, emotional, acoustic, warm').slice(0, 200)
  };
  if (negative_tags) payload.negativeTags = String(negative_tags).slice(0, 200);
  if (vocal_gender && /^(m|f)$/i.test(vocal_gender)) payload.vocalGender = vocal_gender.toLowerCase();
  // Champ exigé par certaines passerelles : on ne l'envoie que s'il est défini,
  // une chaîne vide étant refusée par plusieurs d'entre elles.
  if (process.env.SUNO_CALLBACK_URL) payload.callBackUrl = process.env.SUNO_CALLBACK_URL;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(`${base}/api/v1/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (!r.ok) {
      return res.status(r.status).json({
        error: data.msg || data.error || data.message || `Le service musical a répondu ${r.status}.`,
        code: 'PROVIDER_ERROR',
        status: r.status,
        detail: data
      });
    }

    // Certaines passerelles renvoient 200 avec un code métier en erreur
    if (data.code && Number(data.code) !== 200 && Number(data.code) !== 0) {
      return res.status(502).json({
        error: data.msg || 'Le service musical a refusé la demande.',
        code: 'PROVIDER_REJECTED',
        detail: data
      });
    }

    const taskId = data.data?.taskId || data.data?.task_id || data.taskId || data.task_id || data.id;
    if (!taskId) {
      return res.status(502).json({
        error: 'Le service musical n\'a pas renvoyé d\'identifiant de tâche.',
        code: 'NO_TASK_ID',
        detail: data
      });
    }

    return res.status(200).json({ taskId, model: payload.model });
  } catch (err) {
    const aborted = err.name === 'AbortError';
    return res.status(aborted ? 504 : 500).json({
      error: aborted
        ? 'Le service musical n\'a pas répondu dans les 30 secondes.'
        : 'Échec de la requête musique : ' + err.message,
      code: aborted ? 'TIMEOUT' : 'FETCH_FAILED'
    });
  } finally {
    clearTimeout(timer);
  }
}
