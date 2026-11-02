// ═══════════════════════════════════════════════════════════════
// /api/adieu-media — Autorisation d'un dépôt dans le dossier adieux
//
// Le navigateur anonyme ne dépose plus directement. Il décrit le
// fichier (type, taille) ; si c'est admissible, on lui rend une URL
// signée, valable deux minutes, pour CE chemin seulement. Le plafond
// et les types sont aussi ceux du bucket (25 Mo).
//
// Sans clé de service, on répond 503 : on n'ouvre pas le dépôt anonyme
// en repli. Le studio affiche le message.
// ═══════════════════════════════════════════════════════════════

import { origineAutorisee, entetesOrigine, tropSouvent } from './_courrier.js';

const URL_BASE = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PLAFOND = 25 * 1024 * 1024;
const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg'
};

function jeton() {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 24; i++) out += a[Math.floor(Math.random() * a.length)];
  return out;
}

export default async function handler(req, res) {
  entetesOrigine(req, res, 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(origineAutorisee(req) ? 204 : 403).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  if (!origineAutorisee(req)) return res.status(403).json({ error: 'Origine non autorisée.', code: 'ORIGINE' });
  if (!SERVICE) {
    return res.status(503).json({
      error: 'Le dépôt de fichier n’est pas ouvert.',
      code: 'NOT_CONFIGURED'
    });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnu';
  if (await tropSouvent('adieu:' + ip, 20, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Trop de dépôts. Réessayez dans quelques minutes.', code: 'RATE_LIMIT' });
  }

  const d = (req.body && typeof req.body === 'object') ? req.body : {};
  const mime = String(d.mime || '');
  const ext = TYPES[mime];
  const taille = Number(d.taille);
  if (!ext) return res.status(400).json({ error: 'Ce type de fichier n’est pas accepté.', code: 'MIME' });
  if (!Number.isFinite(taille) || taille < 1 || taille > PLAFOND) {
    return res.status(400).json({ error: 'Fichier trop lourd (25 Mo au plus).', code: 'TAILLE' });
  }

  const chemin = 'depot/' + jeton() + '.' + ext;
  const signe = await fetch(URL_BASE + '/storage/v1/object/upload/sign/adieux/' + chemin, {
    method: 'POST',
    headers: {
      apikey: SERVICE,
      Authorization: 'Bearer ' + SERVICE,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ upsert: false })
  });
  const texte = await signe.text();
  let data = null;
  try { data = JSON.parse(texte); } catch (e) { data = null; }
  if (!signe.ok || !data || !data.token) {
    return res.status(502).json({ error: 'Le dépôt n’a pas pu être préparé.', code: 'SIGNATURE' });
  }

  const url = data.signedUrl || data.url || ('/object/upload/sign/adieux/' + chemin);
  const absolu = /^https?:\/\//.test(url) ? url : (URL_BASE + '/storage/v1' + (url.startsWith('/') ? url : '/' + url));
  return res.status(200).json({
    chemin: chemin,
    jeton: data.token,
    url: absolu,
    publicUrl: URL_BASE + '/storage/v1/object/public/adieux/' + chemin,
    mime: mime
  });
}
