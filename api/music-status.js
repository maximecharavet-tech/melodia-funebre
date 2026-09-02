// ═══════════════════════════════════════════════════════════════
// /api/music-status — Suivi d'une composition Mureka
// GET /api/music-status?taskId=xxx&kind=song|instrumental
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_MS = 20000;
const DEFAUT_URL = 'https://api.mureka.ai';

// Statuts terminaux, en échec, renvoyés par Mureka
const ECHECS = {
  FAILED: 'La composition a échoué chez Mureka.',
  FAILURE: 'La composition a échoué chez Mureka.',
  ERROR: 'La composition a échoué chez Mureka.',
  TIMEOUTED: 'Mureka a dépassé son propre délai de génération.',
  TIMEOUT: 'Mureka a dépassé son propre délai de génération.',
  CANCELLED: 'La composition a été annulée.',
  CANCELED: 'La composition a été annulée.'
};

// Statuts terminaux, en succès
const SUCCES = ['SUCCEEDED', 'SUCCESS', 'COMPLETED', 'COMPLETE', 'FINISHED'];

// Libellés d'attente, pour l'affichage
const ATTENTE = ['PREPARING', 'QUEUED', 'PENDING', 'RUNNING', 'PROCESSING', 'STREAMING'];

/** Les passerelles nomment l'audio de plusieurs façons : on ratisse large. */
function extraireTitres(rec) {
  const listes = [rec.choices, rec.results, rec.songs, rec.clips, rec.data, rec.output];
  const items = listes.find(l => Array.isArray(l) && l.length) || [];
  return items.map((t, i) => {
    const url = t.mp3_url || t.url || t.audio_url || t.audioUrl || t.flac_url || t.wav_url || '';
    const ms = t.duration_milliseconds || t.durationMilliseconds || null;
    return {
      id: t.id || t.song_id || String(i),
      title: t.title || '',
      audio_url: url,
      flac_url: t.flac_url || '',
      image_url: t.image_url || t.cover_url || '',
      duration: ms ? Math.round(ms / 1000) : (t.duration || null),
      tags: t.tags || t.genres || ''
    };
  }).filter(t => t.audio_url);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET uniquement' });

  const base = (process.env.MUREKA_API_URL || DEFAUT_URL).replace(/\/+$/, '');
  const key = process.env.MUREKA_API_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Composition automatique non configurée.', code: 'NOT_CONFIGURED' });
  }

  const { taskId, kind } = req.query || {};
  if (!taskId) return res.status(400).json({ error: 'taskId requis' });

  const famille = kind === 'instrumental' ? 'instrumental' : 'song';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(
      `${base}/v1/${famille}/query/${encodeURIComponent(taskId)}`,
      { headers: { 'Authorization': `Bearer ${key}` }, signal: ctrl.signal }
    );
    const texte = await r.text();
    let data;
    try { data = JSON.parse(texte); } catch (e) { data = { raw: texte }; }

    if (!r.ok) {
      const msg = data.error?.message || data.message || data.msg || `Mureka a répondu ${r.status}.`;
      return res.status(r.status).json({ error: typeof msg === 'string' ? msg : JSON.stringify(msg), code: 'PROVIDER_ERROR' });
    }

    const rec = data.data || data;
    const status = String(rec.status || rec.state || 'preparing').toUpperCase();
    const tracks = extraireTitres(rec);

    // Un échec doit interrompre l'interrogation, sinon le client tourne à vide
    const echec = ECHECS[status];
    if (echec) {
      const detail = rec.failed_reason || rec.error_message || rec.message || '';
      return res.status(200).json({
        status, done: false, failed: true,
        error: echec + (detail ? ' (' + detail + ')' : ''),
        tracks
      });
    }

    const done = SUCCES.includes(status) && tracks.length > 0;

    return res.status(200).json({
      status,
      done,
      failed: false,
      waiting: ATTENTE.includes(status),
      partial: !done && tracks.length > 0,
      playable: tracks.length > 0,
      tracks
    });
  } catch (err) {
    const coupe = err.name === 'AbortError';
    return res.status(coupe ? 504 : 500).json({
      error: coupe ? 'Mureka n\'a pas répondu.' : 'Échec du suivi : ' + err.message,
      code: coupe ? 'TIMEOUT' : 'FETCH_FAILED'
    });
  } finally {
    clearTimeout(timer);
  }
}
