// ═══════════════════════════════════════════════════════════════
// /api/music-status — Suivi d'une génération musicale (polling)
// GET /api/music-status?taskId=xxx
// Mêmes variables : SUNO_API_URL, SUNO_API_KEY
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET uniquement' });

  const base = (process.env.SUNO_API_URL || '').replace(/\/+$/, '');
  const key = process.env.SUNO_API_KEY;
  if (!base || !key) return res.status(500).json({ error: 'SUNO_API_URL / SUNO_API_KEY manquantes' });

  const { taskId } = req.query || {};
  if (!taskId) return res.status(400).json({ error: 'taskId requis' });

  try {
    const r = await fetch(`${base}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.msg || 'Erreur statut' });

    // Normaliser la réponse (formats varient selon services)
    const rec = data.data || data;
    const status = rec.status || rec.state || 'PENDING';
    const items = rec.response?.sunoData || rec.data || rec.clips || [];
    const tracks = (Array.isArray(items) ? items : []).map(t => ({
      id: t.id,
      title: t.title,
      audio_url: t.audioUrl || t.audio_url || t.sourceAudioUrl || '',
      stream_url: t.streamAudioUrl || t.stream_audio_url || '',
      image_url: t.imageUrl || t.image_url || '',
      duration: t.duration
    })).filter(t => t.audio_url || t.stream_url);

    return res.status(200).json({
      status,                       // PENDING | TEXT_SUCCESS | FIRST_SUCCESS | SUCCESS | ...
      done: /SUCCESS$/i.test(status) && tracks.length > 0,
      tracks,
      raw: data
    });
  } catch (err) {
    return res.status(500).json({ error: 'Échec polling : ' + err.message });
  }
}
