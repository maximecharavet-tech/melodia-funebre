// Espace Médias : catalogue complet et en marque blanche, règles de la
// demande d'image (pas de texte, de logo ni de visage), route
// /api/medias-generer réservée aux collaborateurs, éteinte par défaut,
// plafonnée, et qui range l'image dans le bucket quand il existe.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { fausseReponse } from './_faux-serveur.mjs';

process.env.SUPABASE_URL = 'https://faux.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_' + 'x'.repeat(30);
delete process.env.MEDIAS_GENERATION;
delete process.env.HYPER_ENGINE_IMAGE_TOKEN;

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const M = await import('../../api/_medias.js');
const route = (await import('../../api/medias-generer.js')).default;

test('catalogue : 10 vidéos et 10 visuels, chaque fichier présent, aucun nom d’outil', () => {
  const brut = readFileSync(join(RACINE, 'assets/medias/medias.json'), 'utf8');
  const { medias } = JSON.parse(brut);
  assert.equal(medias.filter((m) => m.type === 'video').length, 10);
  assert.equal(medias.filter((m) => m.type === 'visuel').length, 10);
  assert.equal(new Set(medias.map((m) => m.id)).size, medias.length);
  for (const m of medias) {
    assert.ok(m.titre && m.legende && m.vignette, m.id);
    assert.ok(m.legende.length < 280, 'légende courte : ' + m.id);
    assert.ok(existsSync(join(RACINE, m.vignette)), m.vignette);
    assert.ok(m.formats.length >= 3, m.id);
    for (const f of m.formats) {
      const p = join(RACINE, f.url);
      assert.ok(existsSync(p), f.url);
      assert.ok(statSync(p).size < 8 * 1024 * 1024, 'fichier trop lourd : ' + f.url);
    }
  }
  // chaque fichier doit être suivi par git (un .gitignore « videos/ » l'avait déjà caché)
  let suivis = null;
  try { suivis = new Set(execFileSync('git', ['ls-files', 'assets/medias', 'assets/video/hero'], { cwd: RACINE, encoding: 'utf8' }).split('\n')); } catch (e) { suivis = null; }
  if (suivis && suivis.size > 1) {
    for (const m of medias) for (const u of [m.vignette, ...m.formats.map((f) => f.url)]) {
      assert.ok(suivis.has(u.replace(/^\//, '')) || existsSync(join(RACINE, '.git')) === false, 'non suivi par git : ' + u);
    }
  }
  assert.doesNotMatch(brut, /grok|chatgpt|openai|imagine|midjourney|mureka|kokoro/i);
});

test('demande : choix validés, règles de la maison toujours présentes', () => {
  assert.equal(M.lireChoix({ style: 'lys', couleur: 'or' }).ok, false);
  assert.equal(M.lireChoix({ style: 'x', couleur: 'or', format: 'post' }).ok, false);
  assert.equal(M.lireChoix({ style: 'lys', couleur: 'or', format: 'post', precision: 'avec le logo en grand' }).ok, false);
  assert.equal(M.lireChoix({ style: 'lys', couleur: 'or', format: 'post', precision: 'un visage souriant' }).ok, false);
  const c = M.lireChoix({ style: 'partition', couleur: 'ivoire', format: 'banniere', precision: '  un piano <b>au loin</b> ' });
  assert.equal(c.ok, true);
  assert.equal(c.precision, 'un piano b au loin /b');
  const d = M.composerDemande(c);
  assert.match(d, /no text/); assert.match(d, /no logo/); assert.match(d, /no faces in focus/); assert.match(d, /no coffin/);
  assert.match(d, /left third dark/);
  assert.match(d, /five fingers/);
  for (const s of Object.keys(M.STYLES)) for (const k of Object.keys(M.COULEURS)) assert.ok(M.composerDemande({ style: s, couleur: k, format: 'post' }).length < 2000);
});

test('interrupteur : éteint sans MEDIAS_GENERATION=true ET jeton', () => {
  assert.equal(M.generationActive({}), false);
  assert.equal(M.generationActive({ MEDIAS_GENERATION: 'true' }), false);
  assert.equal(M.generationActive({ HYPER_ENGINE_IMAGE_TOKEN: 'imx_a' }), false);
  assert.equal(M.generationActive({ MEDIAS_GENERATION: 'true', HYPER_ENGINE_IMAGE_TOKEN: 'imx_a' }), true);
  assert.equal(M.plafondJour({}), 10);
  assert.equal(M.plafondJour({ MEDIAS_GENERATION_JOUR: '3' }), 3);
  assert.equal(M.plafondJour({ MEDIAS_GENERATION_JOUR: '999' }), 50);
});

/* ─── Route ─── */
let original, appels, role, moteur;
beforeEach(() => {
  original = globalThis.fetch; appels = []; role = 'commercial';
  moteur = { statut: 'done', url: 'https://cdn.moteur.test/img.png', bucket: true };
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    appels.push({ u, init });
    const rep = (status, corps, type) => ({ ok: status < 300, status, headers: { get: () => type || 'application/json' },
      json: async () => corps, text: async () => JSON.stringify(corps), arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
    if (u.pathname === '/auth/v1/user') return init.headers.Authorization === 'Bearer bon' ? rep(200, { email: 'julie@melodia.test' }) : rep(401, {});
    if (u.pathname === '/rest/v1/roles') return rep(200, [{ email: 'julie@melodia.test', role }]);
    if (u.pathname === '/rest/v1/rpc/melodia_trop_souvent') return rep(404, 'PGRST202');
    if (u.host === 'hyper-engine.ai' && u.pathname === '/api/image/tasks') return rep(202, { ok: true, taskId: 'imt_0123456789ab', eta_s: 60 });
    if (u.host === 'hyper-engine.ai' && u.pathname === '/api/image/tasks/tick') return rep(200, { ok: true });
    if (u.host === 'hyper-engine.ai') return rep(200, { status: moteur.statut, items: [{ status: moteur.statut, url: moteur.statut === 'done' ? moteur.url : null }] });
    if (u.host === 'cdn.moteur.test') return rep(200, null, 'image/png');
    if (u.pathname.startsWith('/storage/v1/object/medias-commerciaux/')) return moteur.bucket ? rep(200, {}) : rep(404, { error: 'Bucket not found' });
    if (u.pathname === '/storage/v1/object/list/medias-commerciaux') return moteur.bucket ? rep(200, []) : rep(400, {});
    return rep(404, {});
  };
});
afterEach(() => {
  globalThis.fetch = original;
  delete process.env.MEDIAS_GENERATION; delete process.env.HYPER_ENGINE_IMAGE_TOKEN; delete process.env.MEDIAS_GENERATION_JOUR;
});
const req = (method, body, extra = {}, query = {}) => ({ method, body, query, headers: Object.assign({ origin: 'https://melodia-funebre.fr', authorization: 'Bearer bon' }, extra) });
const CHOIX = { style: 'lys', couleur: 'or', format: 'story' };

test('route : session, rôle et origine exigés', async () => {
  let res = fausseReponse(); await route(req('POST', CHOIX, { authorization: 'Bearer faux' }), res); assert.equal(res.statusCode, 401);
  role = 'partenaire'; res = fausseReponse(); await route(req('POST', CHOIX), res); assert.equal(res.statusCode, 403);
  role = 'commercial'; res = fausseReponse(); await route(req('POST', CHOIX, { origin: 'https://ailleurs.example' }), res); assert.equal(res.statusCode, 403);
});

test('route : éteinte par défaut, 503 GENERATION_INACTIVE, rien ne part vers le moteur', async () => {
  const res = fausseReponse(); await route(req('POST', CHOIX), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.corps.code, 'GENERATION_INACTIVE');
  assert.match(res.corps.demande, /white lilies/);
  assert.ok(!appels.some((a) => a.u.host === 'hyper-engine.ai'));
  const r2 = fausseReponse(); await route(req('POST', { style: 'lys' }), r2); assert.equal(r2.statusCode, 400);
});

test('route allumée : lance, plafonne, suit la tâche et range l’image', async () => {
  process.env.MEDIAS_GENERATION = 'true'; process.env.HYPER_ENGINE_IMAGE_TOKEN = 'imx_test'; process.env.MEDIAS_GENERATION_JOUR = '2';
  let res = fausseReponse(); await route(req('POST', CHOIX), res);
  assert.equal(res.statusCode, 202); assert.equal(res.corps.tache, 'imt_0123456789ab');
  const envoi = appels.find((a) => a.u.pathname === '/api/image/tasks');
  assert.equal(envoi.init.headers.authorization, 'Bearer imx_test');
  const corps = JSON.parse(envoi.init.body);
  assert.equal(corps.items[0].ratio, '9:16'); assert.equal(corps.enrich, false); assert.match(corps.items[0].prompt, /no logo/);
  res = fausseReponse(); await route(req('POST', CHOIX), res); assert.equal(res.statusCode, 202);
  res = fausseReponse(); await route(req('POST', CHOIX), res); assert.equal(res.statusCode, 429, 'troisième demande au-delà du plafond');

  res = fausseReponse(); await route(req('GET', null, {}, { tache: 'imt_0123456789ab' }), res);
  assert.equal(res.corps.statut, 'fait'); assert.equal(res.corps.stockage, true);
  assert.match(res.corps.url, /^https:\/\/faux\.supabase\.test\/storage\/v1\/object\/public\/medias-commerciaux\/generes\/[0-9a-f]+\/imt_0123456789ab\.png$/);

  moteur.bucket = false;
  res = fausseReponse(); await route(req('GET', null, {}, { tache: 'imt_0123456789ab' }), res);
  assert.equal(res.corps.stockage, false); assert.equal(res.corps.url, 'https://cdn.moteur.test/img.png', 'sans bucket : l’adresse du moteur');

  moteur.statut = 'running';
  res = fausseReponse(); await route(req('GET', null, {}, { tache: 'imt_0123456789ab' }), res); assert.equal(res.corps.statut, 'en-cours');
  res = fausseReponse(); await route(req('GET', null, {}, { tache: '../x' }), res); assert.equal(res.statusCode, 400);
});

test('liste : sans origine (GET de même origine) acceptée, dit si la génération est active', async () => {
  const r = req('GET', null, {}, { liste: '1' }); delete r.headers.origin;
  const res = fausseReponse(); await route(r, res);
  assert.equal(res.statusCode, 200); assert.equal(res.corps.actif, false); assert.deepEqual(res.corps.images, []);
});
