// ═══════════════════════════════════════════════════════════════
// /api/medias-generer — « Générer un visuel Melodia » (console commerciale)
//
// POST { texte, format, carte?, style?, intensite?, variantes? } → lance 1, 2 ou 4 images (202 { tache, variantes })
// POST { garder: dataURL }         → range l'image COMPOSÉE (logo posé) dans « Mes créations »
// GET  ?tache=imt_…                → avance et lit la tâche (une adresse par variante)
// GET  ?brut=imt_…&n=0             → l'image brute d'une variante (même origine, pour poser le logo)
// GET  ?liste=1                    → « Mes créations » rangées
//
// Réservé aux collaborateurs (rôle commercial ou master, relu en base).
// Plafond : MEDIAS_GENERATION_JOUR images par collaborateur et par 24 h
// (10 par défaut). Moteur : Image MAX Gen de Hyper Engine, par son API à
// jeton (lots), qui n'emploie que les moteurs gratuits.
//
// ÉTEINT tant que MEDIAS_GENERATION !== 'true' ou sans
// HYPER_ENGINE_IMAGE_TOKEN : 503 GENERATION_INACTIVE, rien ne part.
// Les images sont rangées dans le bucket « medias-commerciaux » s'il
// existe (migration 014, non appliquée) ; sinon l'adresse du moteur est
// rendue telle quelle et la console la garde dans le navigateur.
// ═══════════════════════════════════════════════════════════════

import { entetesService, origineAutorisee, entetesOrigine, tropSouvent } from './_courrier.js';
import { lireChoix, composerDemande, generationActive, plafondJour, lireGarde, TACHE, BUCKET, FORMATS } from './_medias.js';

const SB_URL = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
const SB_ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dmdta29vemVyZmdnZHZ2dWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NjA1MTUsImV4cCI6MjEwNDEzNjUxNX0.FfvtgMMC7KqbANL7Zz4Ecwd9br5o7_ToDPCIZoB23sw';
const ROLES_PERMIS = ['commercial', 'master'];
const JOUR = 24 * 60 * 60 * 1000;

function moteur() { return (process.env.HYPER_ENGINE_URL || 'https://hyper-engine.ai').replace(/\/+$/, ''); }
function entetesMoteur() {
  return { authorization: 'Bearer ' + String(process.env.HYPER_ENGINE_IMAGE_TOKEN || '').trim(), 'content-type': 'application/json', accept: 'application/json' };
}

async function collaborateur(req) {
  const entete = String(req.headers.authorization || req.headers.Authorization || '');
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : '';
  if (!jeton) return null;
  let moi;
  try {
    const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_ANON, Authorization: 'Bearer ' + jeton } });
    if (!r.ok) return null;
    moi = await r.json();
  } catch (e) { return null; }
  const email = String((moi && moi.email) || '').toLowerCase();
  if (!email) return null;
  const chemin = SB_URL + '/rest/v1/roles?select=role,email&email=ilike.' + encodeURIComponent(email);
  const essais = [{ apikey: SB_ANON, Authorization: 'Bearer ' + jeton }];
  const service = entetesService();
  if (service) essais.push(service);
  for (const headers of essais) {
    try {
      const r = await fetch(chemin, { headers });
      if (!r.ok) continue;
      const l = (await r.json()).filter((x) => String((x && x.email) || '').toLowerCase() === email)[0];
      if (l) return { email, role: l.role || null };
    } catch (e) { /* essai suivant */ }
  }
  return { email, role: null };
}

function dossierDe(prefixe, email) {
  let h = 0;
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return prefixe + '/' + h.toString(16);
}

/* Dépose des octets dans le bucket ; null s'il n'existe pas (migration 014 non appliquée). */
async function deposer(chemin, type, octets) {
  const service = entetesService();
  if (!service) return null;
  const d = await fetch(SB_URL + '/storage/v1/object/' + BUCKET + '/' + chemin, {
    method: 'POST',
    headers: { ...service, 'content-type': type, 'x-upsert': 'true', 'cache-control': '31536000' },
    body: octets
  });
  if (!d.ok) return null;
  return SB_URL + '/storage/v1/object/public/' + BUCKET + '/' + chemin;
}

/* L'image brute du moteur (sans logo), gardée pour que l'adresse ne périme pas. */
async function rangerBrut(email, tache, url) {
  const r = await fetch(url);
  if (!r.ok) return null;
  const type = String(r.headers.get('content-type') || 'image/png').split(';')[0];
  const ext = type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png';
  const octets = Buffer.from(await r.arrayBuffer());
  if (octets.length > 15 * 1024 * 1024) return null;
  return deposer(dossierDe('bruts', email) + '/' + tache + '.' + ext, type, octets);
}

async function liste() {
  const service = entetesService();
  if (!service) return { stockage: false, images: [] };
  const r = await fetch(SB_URL + '/storage/v1/object/list/' + BUCKET, {
    method: 'POST',
    headers: { ...service, 'content-type': 'application/json' },
    body: JSON.stringify({ prefix: 'gardes/', limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
  }).catch(() => null);
  if (!r || !r.ok) return { stockage: false, images: [] };
  // un niveau par collaborateur : on relit chaque dossier
  const dossiers = (await r.json()).filter((x) => x && !x.id && x.name).map((x) => 'gardes/' + x.name);
  const images = [];
  for (const dos of dossiers.slice(0, 20)) {
    const l = await fetch(SB_URL + '/storage/v1/object/list/' + BUCKET, {
      method: 'POST', headers: { ...service, 'content-type': 'application/json' },
      body: JSON.stringify({ prefix: dos + '/', limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
    }).catch(() => null);
    if (!l || !l.ok) continue;
    for (const f of await l.json()) {
      if (!f || !f.id || !/\.(png|jpe?g|webp)$/i.test(f.name)) continue;
      images.push({ id: f.name.replace(/\.[a-z]+$/i, ''), url: SB_URL + '/storage/v1/object/public/' + BUCKET + '/' + dos + '/' + f.name, le: f.created_at || null });
    }
  }
  images.sort((a, b) => String(b.le).localeCompare(String(a.le)));
  return { stockage: true, images: images.slice(0, 100) };
}

export default async function handler(req, res) {
  entetesOrigine(req, res, 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(origineAutorisee(req) ? 204 : 403).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'GET ou POST uniquement' });
  // un GET de même origine n'envoie pas toujours l'en-tête Origin : on ne refuse que s'il est présent et étranger
  const origine = req.headers.origin || req.headers.Origin;
  if ((req.method === 'POST' || origine) && !origineAutorisee(req)) return res.status(403).json({ error: 'Origine non autorisée.', code: 'ORIGINE' });

  const qui = await collaborateur(req);
  if (!qui) return res.status(401).json({ error: 'Connectez-vous.', code: 'SESSION' });
  if (ROLES_PERMIS.indexOf(qui.role) === -1) return res.status(403).json({ error: 'Réservé aux collaborateurs.', code: 'ROLE' });

  const q = req.query || {};
  if (req.method === 'GET' && q.liste) return res.status(200).json({ ok: true, actif: generationActive(process.env), ...(await liste()) });

  if (req.method === 'POST' && req.body && req.body.garder) {
    const g = lireGarde(req.body.garder);
    if (!g) return res.status(400).json({ error: 'Image illisible ou trop lourde.', code: 'IMAGE' });
    if (await tropSouvent('medias-garde:' + qui.email, 60, JOUR)) return res.status(429).json({ error: 'Trop d’images gardées aujourd’hui.', code: 'PLAFOND' });
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const url = await deposer(dossierDe('gardes', qui.email) + '/' + id + '.' + g.ext, g.type, g.octets).catch(() => null);
    if (!url) return res.status(503).json({ error: 'Rangement en ligne indisponible : l’image reste dans ce navigateur.', code: 'STOCKAGE' });
    return res.status(200).json({ ok: true, url, id });
  }

  if (req.method === 'POST') {
    const choix = lireChoix(req.body);
    if (!choix.ok) return res.status(400).json({ error: choix.error, code: 'CHOIX' });
    const demande = composerDemande(choix);
    if (!generationActive(process.env)) {
      return res.status(503).json({
        error: 'La génération n’est pas encore activée. Le module est prêt : il attend l’accord de Maxime.',
        code: 'GENERATION_INACTIVE'
      });
    }
    const plafond = plafondJour(process.env);
    // chaque variante compte pour un visuel dans le plafond
    for (let k = 0; k < choix.variantes; k++) {
      if (await tropSouvent('medias-gen:' + qui.email, plafond, JOUR)) {
        return res.status(429).json({ error: 'Plafond atteint : ' + plafond + ' visuels par 24 heures.', code: 'PLAFOND' });
      }
    }
    let r, d;
    try {
      r = await fetch(moteur() + '/api/image/tasks', {
        method: 'POST', headers: entetesMoteur(),
        body: JSON.stringify({
          title: 'Melodia · ' + (choix.style || choix.carte || 'libre'), enrich: false,
          items: Array.from({ length: choix.variantes }, () => ({ prompt: demande, ratio: FORMATS[choix.format].ratio }))
        })
      });
      d = await r.json().catch(() => ({}));
    } catch (e) {
      return res.status(502).json({ error: 'Le moteur d’images ne répond pas.', code: 'MOTEUR' });
    }
    if (!r.ok || !d.taskId) return res.status(502).json({ error: (d && (d.message || d.error)) || 'Le moteur d’images a refusé la demande.', code: 'MOTEUR', statut: r.status });
    return res.status(202).json({ ok: true, tache: d.taskId, format: choix.format, style: choix.style, variantes: choix.variantes, eta: d.eta_s || 60 });
  }

  // GET ?brut=… : l'image du moteur, relayée ici (même origine), pour que la console puisse y poser le logo
  if (q.brut) {
    const t = String(q.brut);
    if (!TACHE.test(t)) return res.status(400).json({ error: 'Tâche inconnue.', code: 'TACHE' });
    if (!generationActive(process.env)) return res.status(503).json({ error: 'Génération non activée.', code: 'GENERATION_INACTIVE' });
    try {
      const r = await fetch(moteur() + '/api/image/tasks/' + t, { headers: entetesMoteur() });
      const d = await r.json().catch(() => ({}));
      const n = Math.max(0, Math.min(3, Math.floor(Number(q.n) || 0)));
      const url = ((d.items || [])[n] || {}).url;
      if (!r.ok || !url || !/^https:\/\//.test(url)) return res.status(404).json({ error: 'Image introuvable.', code: 'IMAGE' });
      const i = await fetch(url);
      const type = String(i.headers.get('content-type') || 'image/png').split(';')[0];
      if (!i.ok || !/^image\/(png|jpeg|webp)$/.test(type)) return res.status(502).json({ error: 'Image illisible.', code: 'IMAGE' });
      const octets = Buffer.from(await i.arrayBuffer());
      if (octets.length > 15 * 1024 * 1024) return res.status(502).json({ error: 'Image trop lourde.', code: 'IMAGE' });
      res.setHeader('Content-Type', type);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      return res.status(200).send(octets);
    } catch (e) {
      return res.status(502).json({ error: 'Le moteur d’images ne répond pas.', code: 'MOTEUR' });
    }
  }

  // GET ?tache=…
  const tache = String(q.tache || '');
  if (!TACHE.test(tache)) return res.status(400).json({ error: 'Tâche inconnue.', code: 'TACHE' });
  if (!generationActive(process.env)) return res.status(503).json({ error: 'Génération non activée.', code: 'GENERATION_INACTIVE' });
  try {
    // la file du moteur n'avance que si on la suit
    await fetch(moteur() + '/api/image/tasks/tick', { method: 'POST', headers: entetesMoteur() }).catch(() => null);
    const r = await fetch(moteur() + '/api/image/tasks/' + tache, { headers: entetesMoteur() });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: d.error || 'Tâche illisible.', code: 'MOTEUR' });
    const items = (d.items || []).slice(0, 4);
    const finis = (it) => it && (it.status === 'done' || it.status === 'failed' || it.status === 'cancelled');
    if (!items.length) {
      if (d.status === 'failed' || d.status === 'cancelled') return res.status(200).json({ ok: true, statut: 'echec', error: 'Génération impossible.' });
      return res.status(200).json({ ok: true, statut: 'en-cours' });
    }
    if (!items.every(finis) && d.status !== 'failed' && d.status !== 'cancelled') {
      return res.status(200).json({ ok: true, statut: 'en-cours', faites: items.filter((it) => it.status === 'done').length, total: items.length });
    }
    const urls = [];
    for (let k = 0; k < items.length; k++) {
      const it = items[k];
      if (it.status !== 'done' || !it.url) continue;
      const rangee = await rangerBrut(qui.email, k ? tache + '-' + k : tache, it.url).catch(() => null);
      urls.push({ n: k, url: rangee || it.url, stockage: Boolean(rangee) });
    }
    if (!urls.length) return res.status(200).json({ ok: true, statut: 'echec', error: (items[0] && items[0].error) || 'Génération impossible.' });
    return res.status(200).json({ ok: true, statut: 'fait', url: urls[0].url, stockage: urls[0].stockage, images: urls });
  } catch (e) {
    return res.status(502).json({ error: 'Le moteur d’images ne répond pas.', code: 'MOTEUR' });
  }
}
