// ═══════════════════════════════════════════════════════════════
// /api/music-status — Suivi d'une composition (interrogation périodique)
// GET /api/music-status?taskId=xxx
// Mêmes variables d'environnement que /api/generate-music.
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_MS = 20000;

// Statuts terminaux en échec renvoyés par les passerelles Suno
const ECHECS = {
  CREATE_TASK_FAILED: 'La création de la tâche a échoué côté service.',
  GENERATE_AUDIO_FAILED: 'La génération audio a échoué. Reformulez la direction musicale et relancez.',
  CALLBACK_EXCEPTION: 'Le service a rencontré une erreur interne pendant la composition.',
  SENSITIVE_WORD_ERROR: 'Les paroles ont été refusées par le filtre de contenu du service. Reformulez le passage en cause.',
  FAILED: 'La composition a échoué.',
  ERROR: 'La composition a échoué.'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET uniquement' });

  const base = (process.env.SUNO_API_URL || '').replace(/\/+$/, '');
  const key = process.env.SUNO_API_KEY;
  if (!base || !key) {
    return res.status(503).json({ error: 'Composition automatique non configurée.', code: 'NOT_CONFIGURED' });
  }

  const taskId = (req.query || {}).taskId;
  if (!taskId) return res.status(400).json({ error: 'taskId requis' });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(
      `${base}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
      { headers: { 'Authorization': `Bearer ${key}` }, signal: ctrl.signal }
    );
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
    if (!r.ok) {
      return res.status(r.status).json({ error: data.msg || 'Erreur de statut', code: 'PROVIDER_ERROR', detail: data });
    }

    const rec = data.data || data;
    const status = String(rec.status || rec.state || rec.taskStatus || 'PENDING').toUpperCase();

    // Les formats diffèrent d'une passerelle à l'autre : on ratisse large.
    const items = rec.response?.sunoData || rec.response?.data || rec.sunoData
      || rec.clips || (Array.isArray(rec.data) ? rec.data : []) || [];

    const tracks = (Array.isArray(items) ? items : []).map(t => ({
      id: t.id || t.clip_id || '',
      title: t.title || '',
      audio_url: t.audioUrl || t.audio_url || t.sourceAudioUrl || t.source_audio_url || '',
      stream_url: t.streamAudioUrl || t.stream_audio_url || t.sourceStreamAudioUrl || '',
      image_url: t.imageUrl || t.image_url || t.sourceImageUrl || '',
      duration: t.duration || null,
      tags: t.tags || ''
    })).filter(t => t.audio_url || t.stream_url);

    // Un échec doit interrompre l'interrogation, sinon le client tourne à vide
    const echec = ECHECS[status] || (/FAIL|ERROR|EXCEPTION/.test(status) ? ECHECS.FAILED : null);
    if (echec) {
      return res.status(200).json({
        status, done: false, failed: true,
        error: echec + (rec.errorMessage ? ' (' + rec.errorMessage + ')' : ''),
        tracks
      });
    }

    // SUCCESS = les deux titres sont prêts ; FIRST_SUCCESS = le premier est écoutable
    const done = /^(SUCCESS|COMPLETE|COMPLETED)$/.test(status) && tracks.length > 0;
    const partiel = /FIRST_SUCCESS|TEXT_SUCCESS/.test(status);

    return res.status(200).json({
      status,
      done,
      failed: false,
      partial: partiel && !done,
      playable: tracks.some(t => t.audio_url || t.stream_url),
      tracks
    });
  } catch (err) {
    const aborted = err.name === 'AbortError';
    return res.status(aborted ? 504 : 500).json({
      error: aborted ? 'Le service musical n\'a pas répondu.' : 'Échec du suivi : ' + err.message,
      code: aborted ? 'TIMEOUT' : 'FETCH_FAILED'
    });
  } finally {
    clearTimeout(timer);
  }
}
