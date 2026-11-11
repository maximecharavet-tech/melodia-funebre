/**
 * /api/prospect-ia — Accroche personnalisée et vérifications de courriel
 *
 * Deux modes :
 *   accroche   compose 1–2 phrases en français, sobres, concrètes, à partir du
 *              site public du prospect. Jamais d'invention : si rien de
 *              fiable n'est extrait, `accroche` vaut null.
 *   verifier   vérifie des adresses courriel (domaine + syntaxe + MX rapide).
 *
 * ── GARDE-FOUS ───────────────────────────────────────────────────────
 *   · origine, session, rôle « commercial » / « master » (mêmes contrôles que
 *     /api/prospect-mail, dupliqués ici pour ne pas dépendre de ce module) ;
 *   · SSRF : https/http uniquement, refus des IP privées/loopback/link-local
 *     après résolution DNS (dns.promises.lookup), redirections ≤ 2, timeout 6 s,
 *     taille ≤ 300 Ko ;
 *   · moteurs gratuits seulement : Mistral (`MISTRAL_API_KEY`, `mistral-small-latest`),
 *     sinon Pollinations (sans clé). Aucun appel payant ;
 *   · rate-limit `tropSouvent` 40/h/utilisateur pour l'accroche, 120/10min/IP
 *     pour verifier.
 *
 * Variables d'environnement (noms uniquement) :
 *   MISTRAL_API_KEY           (optionnel) clé Mistral « Experiment »
 *   MISTRAL_MODEL         (optionnel) défaut mistral-small-latest
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * License: internal.
 */
import { tropSouvent, origineAutorisee, entetesOrigine, entetesService } from './_courrier.js';
import dns from 'node:dns/promises';

/* Remarque : `_sb-shim.js` n'existe pas encore dans le dépôt. Le code ci-dessous
 *   utilise uniquement `fetch` vers PostgREST pour lire le rôle, comme le fait
 *   api/prospect-mail.js. On n'importe donc pas de client. La ligne ci-dessus
 *   est retirée pour éviter une dépendance fantôme. Le module fonctionne avec
 *   `fetch` natif uniquement. */

export const config = { runtime: 'nodejs' };

const SSRF_TIMEOUT_MS = 6000;
const SSRF_MAX_BYTES = 300 * 1024;
const SSRF_MAX_REDIRECTS = 2;

function clientIp(req) {
  const h = req.headers || {};
  const fwd = String(h['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(h['x-real-ip'] || '');
}

async function roleDe(email) {
  if (!email) return null;
  const url = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const res = await fetch(url + '/rest/v1/roles?select=role&email=eq.' + encodeURIComponent(email), {
      headers: { apikey: key, authorization: 'Bearer ' + key }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length) return String(rows[0].role || '');
  } catch (_) { /* silencieux */ }
  return null;
}

async function utilisateurCourant(req) {
  const auth = String((req.headers && req.headers.authorization) || '');
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!jwt) return null;
  const url = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const res = await fetch(url + '/auth/v1/user', {
      headers: { apikey: key, authorization: 'Bearer ' + jwt }
    });
    if (!res.ok) return null;
    const u = await res.json();
    return { email: u && u.email, id: u && u.id };
  } catch (_) { return null; }
}

function refus(res, code, status, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, code, message }));
}

/* ─── SSRF guard ─────────────────────────────────────────────────────── */

function ipInterdite(ip) {
  // IPv4 : 10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, 0.0.0.0, 100.64/10
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every(n => Number.isFinite(n))) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  // IPv6 basique
  const low = ip.toLowerCase();
  if (low === '::1' || low === '::') return true;
  if (low.startsWith('fe80:') || low.startsWith('fc') || low.startsWith('fd')) return true;
  return false;
}

async function verifierHoteSecurise(hote) {
  try {
    const { address } = await dns.lookup(hote, { family: 0 });
    if (ipInterdite(address)) throw new Error('IP refusée');
    return address;
  } catch (e) {
    throw new Error('DNS : ' + e.message);
  }
}

async function lireSiteSecurise(urlStr) {
  let url = new URL(urlStr);
  if (!/^https?:$/.test(url.protocol)) throw new Error('protocole refusé');
  if (url.username || url.password) throw new Error('authentification URL refusée');

  for (let redir = 0; redir <= SSRF_MAX_REDIRECTS; redir++) {
    await verifierHoteSecurise(url.hostname);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), SSRF_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url.toString(), {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: { 'User-Agent': 'MelodiaBot/1.0 (+https://melodia-funebre.fr)' }
      });
    } finally {
      clearTimeout(t);
    }
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (!loc) throw new Error('redirection sans Location');
      url = new URL(loc, url);
      continue;
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const reader = res.body ? res.body.getReader() : null;
    if (!reader) return '';
    const chunks = [];
    let lu = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lu += value.byteLength;
      if (lu > SSRF_MAX_BYTES) {
        try { reader.cancel(); } catch (_) {}
        break;
      }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks.map(v => Buffer.from(v)));
    return buf.toString('utf8');
  }
  throw new Error('trop de redirections');
}

function extraireTexte(html) {
  // Retire scripts, styles, commentaires.
  let s = String(html || '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  const title = (s.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const descr = (s.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) || [])[1] || '';
  const h1 = (s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
  const h2 = [];
  const reH2 = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let m;
  while ((m = reH2.exec(s)) && h2.length < 4) h2.push(m[1]);
  const texte = s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    title: title.replace(/\s+/g, ' ').trim(),
    description: descr.replace(/\s+/g, ' ').trim(),
    h1: h1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    h2: h2.map(x => x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()),
    texte: texte.slice(0, 2500)
  };
}

/* ─── Moteur IA ──────────────────────────────────────────────────────── */

async function appelerMistral(prompt) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return null;
  const modele = process.env.MISTRAL_MODEL || 'mistral-small-latest';
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: modele,
        messages: [
          { role: 'system', content: 'Tu écris en français, au vouvoiement, sans emoji, sans flatterie. Deux phrases maximum. 220 caractères maximum. Tu ne mentionnes que des faits présents dans le texte fourni.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 200
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
  } catch (_) { return null; }
}

async function appelerPollinations(prompt) {
  try {
    const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt), {
      headers: { 'User-Agent': 'MelodiaBot/1.0' }
    });
    if (!res.ok) return null;
    const txt = await res.text();
    return String(txt || '').trim().slice(0, 400);
  } catch (_) { return null; }
}

function nettoyerAccroche(txt) {
  if (!txt) return null;
  let s = String(txt).replace(/^["«\s]+|["»\s.]+$/g, '').trim();
  // Supprime les préfixes "Voici" "Bien sûr", etc.
  s = s.replace(/^(Voici|Bien sûr|Voilà)[^.]*\.\s*/i, '');
  // 1–2 phrases max
  const phrases = s.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  if (phrases.length > 220) return phrases.slice(0, 217).trim() + '…';
  if (phrases.length < 20) return null;
  // Refus basique des clichés
  if (/passionn|expert reconnu|leader incontest|au service des familles depuis toujours/i.test(phrases)) {
    return null;
  }
  return phrases;
}

/* ─── Handler ────────────────────────────────────────────────────────── */

export default async function handler(req, res) {
  entetesService({});
  if (!origineAutorisee(req)) return refus(res, 'ORIGINE', 403, 'Origine refusée.');
  entetesOrigine(req, res, ['POST']);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') return refus(res, 'METHODE', 405, 'POST uniquement.');

  const ip = clientIp(req);
  const u = await utilisateurCourant(req);
  if (!u || !u.email) return refus(res, 'NON_CONNECTE', 401, 'Session requise.');
  const role = await roleDe(u.email);
  if (!['commercial', 'master'].includes(String(role || '').toLowerCase())) {
    return refus(res, 'INTERDIT', 403, 'Rôle insuffisant.');
  }

  const corps = await lireJson(req);
  const mode = String(corps && corps.mode || '');

  if (mode === 'accroche') {
    if (await tropSouvent('ia:accroche:' + u.email, 40, 3600_000)) {
      return refus(res, 'RATE_LIMIT', 429, 'Trop de demandes. Réessayez dans une heure.');
    }
    return accrocheHandler(corps, u, res);
  }
  if (mode === 'verifier') {
    if (await tropSouvent('ia:verif:' + (ip || u.email), 120, 600_000)) {
      return refus(res, 'RATE_LIMIT', 429, 'Trop de vérifications.');
    }
    return verifierHandler(corps, res);
  }
  return refus(res, 'MODE', 400, 'Mode inconnu.');
}

async function lireJson(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 400_000) { try { req.destroy(); } catch (_) {} }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (_) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

async function accrocheHandler(corps, u, res) {
  const url = String(corps && corps.site || '').trim();
  const nom = String(corps && corps.nom || '').trim();
  const ville = String(corps && corps.ville || '').trim();
  if (!url) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, accroche: null, raison: 'site manquant' }));
    return;
  }

  let html;
  try {
    html = await lireSiteSecurise(url);
  } catch (e) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, accroche: null, raison: e.message }));
    return;
  }

  const info = extraireTexte(html);
  const contexte = [
    nom ? 'Agence : ' + nom : '',
    ville ? 'Ville : ' + ville : '',
    info.title ? 'Titre : ' + info.title : '',
    info.description ? 'Description : ' + info.description : '',
    info.h1 ? 'H1 : ' + info.h1 : '',
    info.h2.length ? 'H2 : ' + info.h2.join(' | ') : '',
    info.texte ? 'Texte : ' + info.texte.slice(0, 2000) : ''
  ].filter(Boolean).join('\n');

  const prompt =
    'À partir du texte ci-dessous, écris une ou deux phrases factuelles en français, ' +
    'au vouvoiement, sobre, sans emoji, sans flatterie, qui pourraient servir de ' +
    'première ligne d\'un courriel de partenariat. Mentionne UNIQUEMENT un fait ' +
    'présent (année de fondation, ville, valeur affichée, spécialité). ' +
    'Ne recopie pas les phrases. Ne dis pas « je vois que ». 220 caractères max.\n\n' +
    contexte;

  let brut = await appelerMistral(prompt);
  if (!brut) brut = await appelerPollinations(prompt);
  const accroche = nettoyerAccroche(brut);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: true, accroche: accroche || null, source: info.title ? 'site' : 'vide' }));
}

async function verifierHandler(corps, res) {
  const liste = Array.isArray(corps && corps.adresses) ? corps.adresses.slice(0, 50) : [];
  const out = [];
  for (const item of liste) {
    const email = String(item && item.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      out.push({ email, ok: false, raison: 'syntaxe' });
      continue;
    }
    const domaine = email.split('@')[1];
    try {
      const mx = await dns.resolveMx(domaine);
      if (!mx.length) { out.push({ email, ok: false, raison: 'mx vide' }); continue; }
      out.push({ email, ok: true, mx: mx.slice(0, 2).map(r => r.exchange) });
    } catch (e) {
      out.push({ email, ok: false, raison: 'mx introuvable' });
    }
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: true, resultats: out }));
}
