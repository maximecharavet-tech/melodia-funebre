// ═══════════════════════════════════════════════════════════════
// Fournisseurs — SERVEUR UNIQUEMENT.
//
// Les noms des fournisseurs n'existent qu'ici et dans les journaux
// internes (décision n° 6 : marque blanche). Tout ce qui remonte vers
// l'utilisateur passe par blanchir() dans socle.mjs.
//
//   Parolier  : Mistral (MISTRAL_API_KEY), puis OpenAI (OPENAI_API_KEY)
//   Musique   : Mureka seulement (MUREKA_API_KEY) — décision n° 3
//   Paiement  : Stripe, mode test (STRIPE_SECRET_KEY sk_test_…)
// ═══════════════════════════════════════════════════════════════

import crypto from 'node:crypto';

const DELAI_MS = 25_000;

async function avecDelai(url, opts, ms = DELAI_MS) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, Object.assign({}, opts, { signal: c.signal }));
  } finally {
    clearTimeout(t);
  }
}

// ─── Parolier ───────────────────────────────────────────────────────

const PAROLIERS = [
  { nom: 'mistral', cle: 'MISTRAL_API_KEY', url: 'https://api.mistral.ai/v1/chat/completions', modele: (e) => e.MISTRAL_MODEL || 'mistral-small-latest' },
  { nom: 'openai', cle: 'OPENAI_API_KEY', url: 'https://api.openai.com/v1/chat/completions', modele: () => 'gpt-4o' }
];

export function parolierConfigure(env) {
  return PAROLIERS.some((p) => env[p.cle]);
}

/** Rend { title, lyrics, style_prompt, fournisseur, jetons }. */
export async function ecrireParoles(env, consigne) {
  const echecs = [];
  for (const p of PAROLIERS.filter((x) => env[x.cle])) {
    try {
      const r = await avecDelai(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env[p.cle] },
        body: JSON.stringify({
          model: p.modele(env), temperature: 0.8, max_tokens: 1400,
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: consigne }]
        })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(p.nom + ' ' + r.status);
      const brut = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '{}';
      let o;
      try { o = JSON.parse(brut); } catch (e) { o = { lyrics: brut }; }
      if (!o.lyrics) throw new Error(p.nom + ' sans paroles');
      return {
        title: String(o.title || '').slice(0, 120),
        lyrics: String(o.lyrics || ''),
        style_prompt: String(o.style_prompt || ''),
        fournisseur: p.nom,
        jetons: (d.usage && d.usage.total_tokens) || null
      };
    } catch (e) {
      echecs.push(e.message);
    }
  }
  const err = new Error('PAROLIER_INDISPONIBLE');
  err.interne = echecs.join(' · ');
  throw err;
}

// ─── Musique ────────────────────────────────────────────────────────

const MUSIQUE_URL = (env) => (env.MUREKA_API_URL || 'https://api.mureka.ai').replace(/\/+$/, '');

export function musiqueConfiguree(env) {
  return !!env.MUREKA_API_KEY;
}

export async function soumettreMusique(env, { prompt, paroles, instrumental }) {
  const chemin = instrumental ? '/v1/instrumental/generate' : '/v1/song/generate';
  const corps = instrumental
    ? { model: env.MUREKA_MODEL || 'auto', prompt }
    : { model: env.MUREKA_MODEL || 'auto', prompt, lyrics: String(paroles || '').slice(0, 3000) };
  const r = await avecDelai(MUSIQUE_URL(env) + chemin, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.MUREKA_API_KEY },
    body: JSON.stringify(corps)
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('MUSIQUE_REFUS_' + r.status); e.temporaire = r.status >= 500 || r.status === 429; throw e; }
  const tache = d.id || d.task_id || d.taskId || (d.data && d.data.id);
  if (!tache) throw new Error('MUSIQUE_SANS_TACHE');
  return { tache: String(tache), genre: instrumental ? 'instrumental' : 'song' };
}

const ECHECS = ['FAILED', 'FAILURE', 'ERROR', 'TIMEOUTED', 'TIMEOUT', 'CANCELLED', 'CANCELED'];
const SUCCES = ['SUCCEEDED', 'SUCCESS', 'COMPLETED', 'COMPLETE', 'FINISHED'];

/** Rend { etat: 'en_cours'|'fini'|'echec', pistes: [{url, duree}] }. */
export async function suivreMusique(env, tache, genre) {
  const r = await avecDelai(`${MUSIQUE_URL(env)}/v1/${genre === 'instrumental' ? 'instrumental' : 'song'}/query/${encodeURIComponent(tache)}`, {
    headers: { Authorization: 'Bearer ' + env.MUREKA_API_KEY }
  }, 15_000);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('MUSIQUE_SUIVI_' + r.status); e.temporaire = true; throw e; }
  const rec = d.data || d;
  const statut = String(rec.status || rec.state || '').toUpperCase();
  const listes = [rec.choices, rec.results, rec.songs, rec.clips, rec.output];
  const items = listes.find((l) => Array.isArray(l) && l.length) || [];
  const pistes = items.map((t) => ({
    url: t.mp3_url || t.url || t.audio_url || '',
    duree: t.duration_milliseconds ? Math.round(t.duration_milliseconds / 1000) : (t.duration || null)
  })).filter((t) => /^https:\/\//.test(t.url));
  if (ECHECS.includes(statut)) return { etat: 'echec', pistes: [] };
  if (SUCCES.includes(statut) && pistes.length) return { etat: 'fini', pistes };
  return { etat: 'en_cours', pistes: [] };
}

export async function telecharger(url, max = 20 * 1024 * 1024) {
  if (!/^https:\/\//.test(url)) throw new Error('URL_AUDIO_REFUSEE');
  const r = await avecDelai(url, {}, 20_000);
  if (!r.ok) throw new Error('AUDIO_' + r.status);
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length > max) throw new Error('AUDIO_TROP_GROS');
  return b;
}

// ─── Stripe (REST direct, aucune dépendance) ────────────────────────

export function stripeConfigure(env) {
  return /^sk_(test|live)_/.test(String(env.STRIPE_SECRET_KEY || ''));
}

/** Encode un objet imbriqué au format x-www-form-urlencoded de Stripe. */
export function formulaire(obj, prefixe = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const cle = prefixe ? `${prefixe}[${k}]` : k;
    if (typeof v === 'object') formulaire(v, cle, out);
    else out.push(encodeURIComponent(cle) + '=' + encodeURIComponent(String(v)));
  }
  return out.join('&');
}

export async function stripe(env, methode, chemin, params, idempotence) {
  const h = { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY };
  let url = 'https://api.stripe.com' + chemin;
  let body;
  if (methode === 'GET' && params) url += '?' + formulaire(params);
  else if (params) { body = formulaire(params); h['Content-Type'] = 'application/x-www-form-urlencoded'; }
  if (idempotence) h['Idempotency-Key'] = idempotence;
  const r = await avecDelai(url, { method: methode, headers: h, body }, 20_000);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error('PAIEMENT_' + r.status);
    e.interne = d && d.error && d.error.message;
    throw e;
  }
  return d;
}

/**
 * Vérifie l'en-tête Stripe-Signature (t=…,v1=…) : HMAC-SHA256 de
 * « t.corps » avec le secret du webhook, comparaison en temps constant,
 * tolérance de 5 minutes contre le rejeu.
 */
export function verifierSignatureStripe(brut, entete, secret, maintenantS = Math.floor(Date.now() / 1000), tolerance = 300) {
  if (!secret || !entete) return false;
  const parts = String(entete).split(',').map((x) => x.split('='));
  const t = Number((parts.find((p) => p[0] === 't') || [])[1]);
  const v1 = parts.filter((p) => p[0] === 'v1').map((p) => p[1]);
  if (!t || !v1.length || Math.abs(maintenantS - t) > tolerance) return false;
  const attendu = crypto.createHmac('sha256', secret).update(t + '.' + brut.toString('utf8')).digest('hex');
  const a = Buffer.from(attendu, 'hex');
  return v1.some((s) => {
    const b = Buffer.from(String(s), 'hex');
    return b.length === a.length && crypto.timingSafeEqual(a, b);
  });
}

export function signerStripe(brut, secret, t = Math.floor(Date.now() / 1000)) {
  const v = crypto.createHmac('sha256', secret).update(t + '.' + brut).digest('hex');
  return `t=${t},v1=${v}`;
}
