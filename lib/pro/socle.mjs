// ═══════════════════════════════════════════════════════════════
// Socle des routes /api/pro/* — et des trois routes de génération
// historiques (generate-lyrics, generate-music, music-status).
//
// Ce que chaque route obtient sans y penser :
//   - CORS par liste blanche : le site, les aperçus de CE projet, les
//     coquilles d'application (capacitor://localhost, https://tauri.localhost)
//     et localhost en développement. Jamais « * ».
//   - un JWT Supabase vérifié auprès de /auth/v1/user ;
//   - le rôle maison (table roles) et les adhésions pro (pro_members) ;
//   - une limite de débit ;
//   - des erreurs en marque blanche : aucun nom de fournisseur ne sort du
//     serveur (décision n° 6 du 11/11/2026). Les journaux internes, eux,
//     gardent le détail.
//
// Les routes sont des fonctions pures : (requete, ctx) → { status, json }.
// Les tests leur passent un ctx en mémoire ; la production un ctx Supabase.
// ═══════════════════════════════════════════════════════════════

import crypto from 'node:crypto';
import { depotSupabase } from './depot.mjs';
import { noyau } from './noyau.mjs';

// ─── Origines ───────────────────────────────────────────────────────

const COQUILLES = new Set(['capacitor://localhost', 'https://tauri.localhost', 'tauri://localhost', 'http://tauri.localhost']);

export function origineAutorisee(origine, env = process.env) {
  if (!origine || typeof origine !== 'string') return false;
  if (COQUILLES.has(origine)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origine)) return true;
  let hote = '';
  try { hote = new URL(origine).host; } catch (e) { return false; }
  if (!/^https:/.test(origine)) return false;
  const permis = new Set(['melodia-funebre.fr', 'www.melodia-funebre.fr']);
  [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter(Boolean)
    .forEach((h) => permis.add(String(h).replace(/^https?:\/\//, '')));
  if (permis.has(hote)) return true;
  return /^melodia-funebre(-[a-z0-9-]+)?\.vercel\.app$/i.test(hote);
}

export function poserCors(req, res, methodes) {
  const o = req.headers && (req.headers.origin || req.headers.Origin);
  if (o && origineAutorisee(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', methodes + ', OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '600');
}

// ─── Utilitaires ────────────────────────────────────────────────────

export const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Jeton aléatoire Crockford (aucun nom possible : I, L, O, U exclus). */
export function jetonAleatoire(n = 12) {
  const o = crypto.randomBytes(n);
  let s = '';
  for (let i = 0; i < n; i++) s += CROCKFORD[o[i] & 31];
  return s;
}

/** Empreinte salée : jamais la valeur en clair dans la base anti-abus. */
export function empreinte(valeur, sel = process.env.PRO_EMPREINTE_SEL || '') {
  const v = String(valeur || '').trim().toLowerCase();
  if (!v) return '';
  return crypto.createHash('sha256').update(sel + '|' + v).digest('hex');
}

export function egalConstant(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) {
    crypto.timingSafeEqual(x, x); // même coût, quelle que soit la longueur
    return false;
  }
  return crypto.timingSafeEqual(x, y);
}

export function ipDe(req) {
  const h = (req && req.headers) || {};
  return String(h['x-forwarded-for'] || '').split(',')[0].trim() || String(h['x-real-ip'] || '') || 'inconnue';
}

/** Messages de sortie : jamais un nom de fournisseur. */
const FOURNISSEURS = /\b(mureka|suno|udio|mistral|openai|chatgpt|gpt-?\d*\w*|skywork|pollinations|stripe)\b/gi;
export function blanchir(message) {
  return String(message || '').replace(FOURNISSEURS, 'le service');
}

export function erreur(status, code, message) {
  return { status, json: { ok: false, code, message: blanchir(message) } };
}

export function ok(json, status = 200) {
  return { status, json: Object.assign({ ok: true }, json) };
}

// ─── Limite de débit (mémoire de l'instance, ou table si disponible) ─

const compteurs = new Map();
export function limiteMemoire(cle, max, fenetreMs) {
  const t = Date.now();
  const e = compteurs.get(cle);
  if (!e || t > e.fin) { compteurs.set(cle, { n: 1, fin: t + fenetreMs }); return false; }
  e.n += 1;
  if (compteurs.size > 2000) for (const [k, v] of compteurs) if (t > v.fin) compteurs.delete(k);
  return e.n > max;
}

// ─── Authentification ───────────────────────────────────────────────

export function jetonDe(req) {
  const a = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || '');
  return a.startsWith('Bearer ') ? a.slice(7).trim() : '';
}

async function verifierJetonSupabase(jwt) {
  if (!jwt || jwt.split('.').length !== 3) return null;
  const url = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
  const cle = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cle) return null;
  try {
    const r = await fetch(url + '/auth/v1/user', { headers: { apikey: cle, Authorization: 'Bearer ' + jwt } });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? { id: u.id, email: String(u.email || '').toLowerCase() } : null;
  } catch (e) { return null; }
}

/** Rôle maison (master, atelier, commercial) ou null. */
export async function roleMaison(ctx, email) {
  if (!email) return null;
  const r = await ctx.depot.select('roles', { email: email.toLowerCase() }, { colonnes: 'role', limite: 1 });
  return r[0] ? String(r[0].role || '').toLowerCase() : null;
}

export async function adhesions(ctx, utilisateur) {
  return ctx.depot.select('pro_members', { user_id: utilisateur.id, statut: 'actif' });
}

/** Rôle pro dans une organisation, ou null. */
export async function rolePro(ctx, utilisateur, orgId) {
  const r = await ctx.depot.select('pro_members', { user_id: utilisateur.id, org_id: orgId, statut: 'actif' }, { limite: 1 });
  return r[0] ? r[0].role : null;
}

export const ROLES_ECRITURE = ['owner', 'admin', 'conseiller'];
export const ROLES_ADMIN = ['owner', 'admin'];
export const MAISON = ['master', 'atelier'];

/**
 * Accès à un dossier. Rend { dossier, acteur, role } ou une erreur.
 * acteur : 'maison' (master/atelier) ou 'agence' (membre qui peut écrire),
 * ou 'lecture' (membre en lecture seule).
 */
export async function accesDossier(ctx, utilisateur, dossierId, { ecriture = false } = {}) {
  if (!dossierId) return { erreur: erreur(400, 'DOSSIER_REQUIS', 'Dossier manquant.') };
  const d = (await ctx.depot.select('pro_dossiers', { id: dossierId }, { limite: 1 }))[0];
  if (!d) return { erreur: erreur(404, 'INTROUVABLE', 'Ce dossier est introuvable.') };
  if (MAISON.includes(utilisateur.roleMaison)) return { dossier: d, acteur: 'maison', role: 'maison' };
  const role = await rolePro(ctx, utilisateur, d.org_id);
  // Même réponse que « introuvable » : on ne confirme pas l'existence d'un
  // dossier d'une autre agence.
  if (!role) return { erreur: erreur(404, 'INTROUVABLE', 'Ce dossier est introuvable.') };
  if (ecriture && !ROLES_ECRITURE.includes(role)) {
    return { erreur: erreur(403, 'LECTURE_SEULE', 'Votre rôle ne permet que la consultation.') };
  }
  return { dossier: d, acteur: ROLES_ECRITURE.includes(role) ? 'agence' : 'lecture', role };
}

// ─── Réglages, audit, transitions ───────────────────────────────────

/** pro_settings → objet { cle: valeur } ; une valeur NULL reste null (TBD). */
export async function reglages(ctx) {
  const lignes = await ctx.depot.select('pro_settings', {});
  const o = {};
  for (const l of lignes) o[l.cle] = l.valeur == null ? null : l.valeur;
  return o;
}

export function nombre(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function auditer(ctx, qui, action, cible, details) {
  try {
    await ctx.depot.insert('pro_audit', {
      acteur: qui ? (qui.email || qui.id || String(qui)) : 'service',
      action,
      cible: cible == null ? null : String(cible),
      details: details || {}
    });
  } catch (e) { /* le journal ne doit jamais faire échouer l'action */ }
}

/**
 * Transition d'état contrôlée par le noyau Rust, appliquée avec garde
 * optimiste (le statut ne change que s'il vaut encore `de`).
 */
export async function transition(ctx, dossier, vers, acteur, qui, extra) {
  const k = await noyau();
  const v = k.statutTransition({ de: dossier.status, vers, acteur });
  if (!v.ok) return { ok: false, code: v.erreur };
  const maj = await ctx.depot.update('pro_dossiers', { id: dossier.id, status: dossier.status },
    Object.assign({ status: vers, updated_at: new Date().toISOString() }, extra || {}));
  if (!maj.length) return { ok: false, code: 'CONCURRENCE' };
  await auditer(ctx, qui, 'statut', dossier.id, { de: dossier.status, vers, acteur });
  dossier.status = vers;
  return { ok: true, dossier: maj[0] };
}

/** Met un travail en file ; idempotent sur (dossier, type, version). */
export async function enfiler(ctx, dossierId, type, version, donnees) {
  const r = await ctx.depot.insert('pro_jobs', {
    dossier_id: dossierId, type, version: version || 1, etat: 'a_faire', tentatives: 0,
    prochain_essai: new Date().toISOString(), donnees: donnees || {}
  }, { ignorerDoublon: true, conflit: 'dossier_id,type,version' });
  return r[0] || null;
}

// ─── Contexte de production ─────────────────────────────────────────

export function contexteProduction() {
  const depot = depotSupabase();
  return {
    depot,
    env: process.env,
    verifierJeton: verifierJetonSupabase,
    limite: limiteMemoire,
    maintenant: () => new Date()
  };
}

// ─── Corps de requête ───────────────────────────────────────────────

export async function lireBrut(req, max = 2_500_000) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  return new Promise((resoudre, rejeter) => {
    const morceaux = [];
    let n = 0;
    req.on('data', (c) => {
      n += c.length;
      if (n > max) { rejeter(new Error('TROP_GROS')); try { req.destroy(); } catch (e) {} return; }
      morceaux.push(c);
    });
    req.on('end', () => resoudre(Buffer.concat(morceaux)));
    req.on('error', rejeter);
  });
}

/**
 * Enveloppe une route en fonction Vercel.
 * opts : { methodes: 'GET, POST', public: bool, brut: bool, maison: bool,
 *          limite: [max, fenetreMs], cron: bool }
 */
export function servir(route, opts = {}) {
  const methodes = opts.methodes || 'POST';
  return async function handler(req, res, ctxTest) {
    poserCors(req, res, methodes);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (!methodes.split(/,\s*/).includes(req.method)) {
      return res.status(405).json({ ok: false, code: 'METHODE', message: 'Méthode non autorisée.' });
    }
    const o = req.headers && req.headers.origin;
    if (o && !origineAutorisee(o)) {
      return res.status(403).json({ ok: false, code: 'ORIGINE', message: 'Origine non autorisée.' });
    }
    const ctx = ctxTest || contexteProduction();
    if (!ctx.depot) {
      return res.status(503).json({ ok: false, code: 'NON_CONFIGURE', message: 'Le service n’est pas encore configuré.' });
    }
    let brut = null;
    let corps = {};
    try {
      if (req.method !== 'GET') {
        if (opts.brut) brut = await lireBrut(req);
        else if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) corps = req.body;
        else {
          const b = await lireBrut(req);
          corps = b.length ? JSON.parse(b.toString('utf8')) : {};
        }
      }
    } catch (e) {
      return res.status(400).json({ ok: false, code: 'CORPS', message: 'Requête illisible.' });
    }

    let utilisateur = null;
    const jwt = jetonDe(req);
    const cron = opts.cron && ctx.env.CRON_SECRET && egalConstant(jwt, ctx.env.CRON_SECRET);
    if (!opts.public && !cron) {
      utilisateur = await ctx.verifierJeton(jwt);
      if (!utilisateur) {
        return res.status(401).json({ ok: false, code: 'NON_CONNECTE', message: 'Connectez-vous pour continuer.' });
      }
      utilisateur.roleMaison = await roleMaison(ctx, utilisateur.email);
      if (opts.maison && !MAISON.includes(utilisateur.roleMaison)) {
        return res.status(403).json({ ok: false, code: 'RESERVE_MAISON', message: 'Réservé à la maison.' });
      }
    }
    const [max, fenetre] = opts.limite || [60, 60_000];
    const cleLimite = (route.nom || 'pro') + ':' + (utilisateur ? utilisateur.id : ipDe(req));
    if (await ctx.limite(cleLimite, max, fenetre)) {
      res.setHeader('Retry-After', String(Math.ceil(fenetre / 1000)));
      return res.status(429).json({ ok: false, code: 'TROP_SOUVENT', message: 'Trop de demandes rapprochées. Patientez un instant.' });
    }
    try {
      const r = await route({
        methode: req.method, corps, brut, query: req.query || {}, entetes: req.headers || {},
        utilisateur, cron: !!cron, ip: ipDe(req)
      }, ctx);
      if (r.entetes) for (const [k, v] of Object.entries(r.entetes)) res.setHeader(k, v);
      if (r.texte != null) {
        res.status(r.status || 200);
        return res.send ? res.send(r.texte) : res.end(r.texte);
      }
      return res.status(r.status || 200).json(r.json);
    } catch (e) {
      // Le détail reste dans les journaux internes ; la réponse est sobre.
      console.error('[pro]', route.nom || '', e && e.message, e && e.detail ? String(e.detail).slice(0, 200) : '');
      return res.status(500).json({ ok: false, code: 'INTERNE', message: 'Une erreur est survenue. Réessayez dans un instant.' });
    }
  };
}
