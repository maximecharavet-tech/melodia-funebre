/**
 * /api/prospect-doublon — Garde anti-doublon inter-collaborateurs.
 *
 * Appelé avant la création d'un prospect ou avant un envoi. Retourne uniquement
 * `{ deja_suivi: true, par: 'un collègue', depuis: '2026-10-04' }` — jamais
 * l'identité du collaborateur ni ses coordonnées.
 *
 * Utilise le service role (SUPABASE_SERVICE_ROLE_KEY) : la lecture est restreinte,
 * la requête ne remonte que 1 ligne.
 *
 * Corps : { siret?, email? }
 * Réponse : { ok: true, deja_suivi: bool, par?, depuis?, source? }
 *
 * License: internal.
 */
import { origineAutorisee, entetesOrigine, entetesService, tropSouvent } from './_courrier.js';

export const config = { runtime: 'nodejs' };

function refus(res, code, status, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, code, message }));
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
    return { email: u && u.email };
  } catch (_) { return null; }
}

async function chercherProspect(filtre) {
  const url = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const res = await fetch(url + '/rest/v1/prospects?select=siret,email,owner,updated_at&limit=1&' + filtre, {
      headers: { apikey: key, authorization: 'Bearer ' + key }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length) return rows[0];
  } catch (_) { /* silencieux */ }
  return null;
}

async function dejaEnvoye(email) {
  const url = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  const ilYA30J = new Date(Date.now() - 30 * 86400_000).toISOString();
  try {
    const res = await fetch(
      url + '/rest/v1/envois_prospect?select=id,envoye_le,statut&limit=1' +
        '&destinataire=eq.' + encodeURIComponent(email) +
        '&envoye_le=gte.' + encodeURIComponent(ilYA30J),
      { headers: { apikey: key, authorization: 'Bearer ' + key } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length) return rows[0];
  } catch (_) { /* silencieux */ }
  return null;
}

export default async function handler(req, res) {
  entetesService({});
  if (!origineAutorisee(req)) return refus(res, 'ORIGINE', 403, 'Origine refusée.');
  entetesOrigine(req, res, ['POST']);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') return refus(res, 'METHODE', 405, 'POST uniquement.');

  const u = await utilisateurCourant(req);
  if (!u || !u.email) return refus(res, 'NON_CONNECTE', 401, 'Session requise.');
  if (await tropSouvent('doublon:' + u.email, 200, 3600_000)) {
    return refus(res, 'RATE_LIMIT', 429, 'Trop de vérifications.');
  }

  const corps = await lireJson(req);
  const siret = String(corps && corps.siret || '').replace(/\D/g, '');
  const email = String(corps && corps.email || '').trim().toLowerCase();

  if (!siret && !email) return refus(res, 'PARAMS', 400, 'SIRET ou courriel requis.');

  if (siret) {
    const ligne = await chercherProspect('siret=eq.' + encodeURIComponent(siret));
    if (ligne) {
      const autre = String(ligne.owner || '').toLowerCase() !== String(u.email).toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        ok: true,
        deja_suivi: true,
        par: autre ? 'un collègue' : 'vous',
        depuis: (ligne.updated_at || '').slice(0, 10),
        source: 'carnet'
      }));
      return;
    }
  }

  if (email) {
    const ligne = await chercherProspect('email=eq.' + encodeURIComponent(email));
    if (ligne) {
      const autre = String(ligne.owner || '').toLowerCase() !== String(u.email).toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        ok: true,
        deja_suivi: true,
        par: autre ? 'un collègue' : 'vous',
        depuis: (ligne.updated_at || '').slice(0, 10),
        source: 'carnet'
      }));
      return;
    }
    const envoi = await dejaEnvoye(email);
    if (envoi) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        ok: true,
        deja_suivi: true,
        par: 'la maison',
        depuis: (envoi.envoye_le || '').slice(0, 10),
        source: 'envoi_recent'
      }));
      return;
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: true, deja_suivi: false }));
}

async function lireJson(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 200_000) try { req.destroy(); } catch (_) {} });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
