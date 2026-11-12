// Authentification, CORS, limite de débit, routes de génération historiques, marque blanche.
import test from 'node:test';
import assert from 'node:assert/strict';
import { servir, origineAutorisee, blanchir } from '../../lib/pro/socle.cjs';
import { garder } from '../../lib/pro/garde.cjs';
import me from '../../lib/pro/routes/me.cjs';
import { base, contexte, reponse, requete } from './aide.mjs';

const handlerMe = servir(me, { methodes: 'GET' });

test('auth refusée sans jeton', async () => {
  const ctx = contexte(base());
  const res = reponse();
  await handlerMe(requete({ methode: 'GET' }), res, ctx);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, 'NON_CONNECTE');
});

test('auth refusée avec un jeton inconnu', async () => {
  const ctx = contexte(base());
  const res = reponse();
  await handlerMe(requete({ methode: 'GET', jeton: 'forge.forge.forge' }), res, ctx);
  assert.equal(res.statusCode, 401);
});

test('auth acceptée avec un jeton valide', async () => {
  const ctx = contexte(base());
  const res = reponse();
  await handlerMe(requete({ methode: 'GET', jeton: 'jeton-a', origine: 'https://melodia-funebre.fr' }), res, ctx);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.organisations[0].nom, 'Agence A');
  assert.equal(res.headers['access-control-allow-origin'], 'https://melodia-funebre.fr');
});

test('CORS : liste blanche, jamais « * »', async () => {
  for (const o of ['https://melodia-funebre.fr', 'capacitor://localhost', 'https://tauri.localhost', 'http://localhost:3000',
    'https://melodia-funebre-git-claude-x.vercel.app']) {
    assert.ok(origineAutorisee(o, {}), o);
  }
  for (const o of ['https://evil.example', 'http://melodia-funebre.fr', 'https://melodia-funebre.fr.evil.example',
    'https://autre-projet.vercel.app', 'null', '']) {
    assert.ok(!origineAutorisee(o, {}), o);
  }
  const ctx = contexte(base());
  const res = reponse();
  await handlerMe(requete({ methode: 'GET', jeton: 'jeton-a', origine: 'https://evil.example' }), res, ctx);
  assert.equal(res.statusCode, 403);
  assert.equal(res.headers['access-control-allow-origin'], undefined);
});

test('pré-vol OPTIONS sans authentification, méthode refusée', async () => {
  const ctx = contexte(base());
  const r1 = reponse();
  await handlerMe(requete({ methode: 'OPTIONS', origine: 'capacitor://localhost' }), r1, ctx);
  assert.equal(r1.statusCode, 204);
  assert.equal(r1.headers['access-control-allow-origin'], 'capacitor://localhost');
  const r2 = reponse();
  await handlerMe(requete({ methode: 'DELETE', jeton: 'jeton-a' }), r2, ctx);
  assert.equal(r2.statusCode, 405);
});

test('limite de débit : 429 avec Retry-After', async () => {
  const ctx = contexte(base());
  ctx.limite = async () => true;
  const res = reponse();
  await handlerMe(requete({ methode: 'GET', jeton: 'jeton-a' }), res, ctx);
  assert.equal(res.statusCode, 429);
  assert.ok(res.headers['retry-after']);
});

test('route réservée à la maison', async () => {
  const { default: admin } = await import('../../lib/pro/routes/admin.cjs');
  const h = servir(admin, { methodes: 'GET, POST', maison: true });
  const ctx = contexte(base());
  const r1 = reponse();
  await h(requete({ methode: 'GET', jeton: 'jeton-a' }), r1, ctx);
  assert.equal(r1.statusCode, 403);
  const r2 = reponse();
  await h(requete({ methode: 'GET', jeton: 'jeton-commercial' }), r2, ctx);
  assert.equal(r2.statusCode, 403, 'un commercial n’est pas l’atelier');
  const r3 = reponse();
  await h(requete({ methode: 'GET', jeton: 'jeton-maitre' }), r3, ctx);
  assert.equal(r3.statusCode, 200);
});

test('erreur interne : réponse sobre, sans détail', async () => {
  const boom = async () => { throw new Error('mureka a explosé avec la clé sk_live_123'); };
  boom.nom = 'boom';
  const h = servir(boom, { methodes: 'POST' });
  const ctx = contexte(base());
  const res = reponse();
  const avant = console.error;
  console.error = () => {};
  try { await h(requete({ jeton: 'jeton-a', corps: {} }), res, ctx); } finally { console.error = avant; }
  assert.equal(res.statusCode, 500);
  assert.doesNotMatch(JSON.stringify(res.body), /mureka|sk_live/i);
});

// ─── Les trois routes de génération historiques ───

async function appelerGarde(jeton, origine) {
  const ctx = contexte(base());
  const res = reponse();
  const u = await garder(requete({ jeton, origine, corps: {} }), res, { methodes: 'POST', ctx });
  return { u, res };
}

test('routes historiques : sans jeton → 401, jamais « * »', async () => {
  const { u, res } = await appelerGarde(null, 'https://melodia-funebre.fr');
  assert.equal(u, null);
  assert.equal(res.statusCode, 401);
  assert.notEqual(res.headers['access-control-allow-origin'], '*');
});

test('routes historiques : agence ou commercial → 403, atelier et master → passent', async () => {
  assert.equal((await appelerGarde('jeton-a')).res.statusCode, 403);
  assert.equal((await appelerGarde('jeton-commercial')).res.statusCode, 403);
  assert.ok((await appelerGarde('jeton-atelier')).u);
  assert.ok((await appelerGarde('jeton-maitre')).u);
});

test('routes historiques : origine étrangère refusée', async () => {
  const { res } = await appelerGarde('jeton-maitre', 'https://evil.example');
  assert.equal(res.statusCode, 403);
});

test('routes historiques : le gestionnaire réel refuse sans jeton', async () => {
  for (const f of ['generate-lyrics', 'generate-music', 'music-status']) {
    const { default: h } = await import(`../../api/${f}.js`);
    const res = reponse();
    await h(requete({ methode: f === 'music-status' ? 'GET' : 'POST', corps: {}, origine: 'https://evil.example' }), res);
    assert.ok([401, 403].includes(res.statusCode), f + ' → ' + res.statusCode);
    assert.notEqual(res.headers['access-control-allow-origin'], '*', f);
  }
});

test('marque blanche : les messages sortants ne nomment aucun fournisseur', async () => {
  assert.equal(blanchir('La composition a échoué chez Mureka.'), 'La composition a échoué chez le service.');
  assert.doesNotMatch(blanchir('OpenAI, Mistral, Suno, gpt-4o, Stripe'), /openai|mistral|suno|gpt|stripe/i);
  const { default: config } = await import('../../api/music-config.js');
  process.env.MUREKA_API_KEY = 'cle-de-test-qui-ne-doit-pas-sortir';
  const res = reponse();
  await config(requete({ methode: 'GET' }), res);
  delete process.env.MUREKA_API_KEY;
  const t = JSON.stringify(res.body);
  assert.doesNotMatch(t, /mureka|cle-de|key_hint|api\./i);
  assert.equal(res.body.configured, true);
});
