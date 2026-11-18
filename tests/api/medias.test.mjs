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

test('demande libre : texte exigé, enveloppe Melodia et interdits toujours présents', () => {
  assert.equal(M.lireChoix({ texte: 'des lys', format: 'carre' }).ok, false);
  assert.equal(M.lireChoix({ texte: 'ab', format: 'post' }).ok, false);
  assert.equal(M.lireChoix({ texte: 'une femme nue au piano', format: 'post' }).ok, false);
  const c = M.lireChoix({ texte: '  un piano <b>au loin</b>, roses blanches ', format: 'banniere', carte: 'inconnue' });
  assert.equal(c.ok, true);
  assert.equal(c.texte, 'un piano b au loin /b , roses blanches');
  assert.equal(c.carte, '');
  const d = M.composerDemande(c);
  assert.ok(d.startsWith('Image to create: un piano'));
  assert.match(d, /ivory and soft gold/);
  assert.match(d, /never as a flat fill/);
  assert.match(d, /any text, letters/);
  assert.match(d, /logo, monogram/);
  assert.match(d, /realistic faces of children/);
  assert.match(d, /coffin/);
  assert.match(d, /neon, glitter/);
  assert.match(d, /upper-left area calm/);
  assert.ok(M.composerDemande({ texte: 'x'.repeat(400), format: 'story', carte: 'dorees' }).length < 2000, 'sous la limite du moteur');
});

test('styles artistiques : 20 à 30, sobres, sans nom d’artiste, vignettes présentes, pré-prompt gardé côté serveur', () => {
  assert.ok(M.STYLES.length >= 20 && M.STYLES.length <= 30, 'nombre de styles : ' + M.STYLES.length);
  assert.equal(new Set(M.STYLES.map((s) => s.id)).size, M.STYLES.length);
  const pub = JSON.parse(readFileSync(join(RACINE, 'assets/medias/medias.json'), 'utf8')).styles;
  assert.deepEqual(pub.map((s) => s.id), M.STYLES.map((s) => s.id));
  for (const s of M.STYLES) {
    assert.ok(s.nom && s.prompt.length > 80, s.id);
    assert.doesNotMatch(s.prompt, /\b(pop art|glitch|cyberpunk|cartoon|anime|manga|neon|vaporwave|graffiti|pixel)\b/i, 'style hors ton : ' + s.id);
    // aucun nom d'artiste (vivant ou non) : des époques et des techniques seulement
    assert.doesNotMatch(s.prompt, /\b(Monet|Picasso|Braque|Dali|Dalí|Magritte|Klimt|Mucha|Hokusai|Hiroshige|Rembrandt|Caravaggio|Turner|Friedrich|Seurat|Signac|Matisse|Van Gogh|Rossetti|Millais|Waterhouse|Redon|Moreau|Adams|Kahlo|Banksy|Rutkowski)\b/i, s.id);
    const p = pub.find((x) => x.id === s.id);
    assert.ok(!('prompt' in p), 'le pré-prompt reste côté serveur');
    assert.equal(p.vignette, '/assets/medias/styles/' + s.id + '.webp');
    const f = join(RACINE, p.vignette);
    assert.ok(existsSync(f), 'vignette manquante : ' + p.vignette);
    assert.ok(statSync(f).size < 80 * 1024, 'vignette légère : ' + p.vignette);
  }
});

test('style, intensité et variantes : lus prudemment, interdits toujours présents', () => {
  const base = { texte: 'des lys blancs', format: 'post' };
  let c = M.lireChoix({ ...base, style: 'inconnu', intensite: 9, variantes: 7 });
  assert.equal(c.style, ''); assert.equal(c.intensite, 2); assert.equal(c.variantes, 1);
  const sans = M.composerDemande(c);
  assert.match(sans, /painterly photographic finish/);
  for (const s of M.STYLES) {
    for (const n of [1, 2, 3]) {
      c = M.lireChoix({ ...base, style: s.id, intensite: n, variantes: 4 });
      assert.equal(c.style, s.id); assert.equal(c.intensite, n); assert.equal(c.variantes, 4);
      const d = M.composerDemande(c);
      assert.ok(d.includes(s.prompt), s.id);
      assert.ok(d.includes(M.INTERDITS), 'interdits : ' + s.id);
      assert.match(d, /ivory/);
      assert.ok(d.length < 2000, 'sous la limite du moteur : ' + s.id);
      if (n === 1) assert.match(d, /applied lightly/);
      if (n === 3) assert.match(d, /fully affirmed/);
    }
  }
  assert.equal(M.lireChoix({ ...base, variantes: '2' }).variantes, 2);
});

test('cartes d’idées : 10, complètes, pré-prompt ajouté seulement si la carte est choisie, identiques au catalogue public', () => {
  assert.equal(M.IDEES.length, 10);
  const pub = JSON.parse(readFileSync(join(RACINE, 'assets/medias/medias.json'), 'utf8')).idees;
  assert.deepEqual(pub.map((i) => i.id), M.IDEES.map((i) => i.id));
  for (const i of M.IDEES) {
    assert.ok(i.nom && i.idee && i.prompt.length > 120, i.id);
    assert.ok(existsSync(join(RACINE, i.vignette)), i.vignette);
    assert.equal(pub.find((x) => x.id === i.id).idee, i.idee);
    assert.ok(!('prompt' in pub.find((x) => x.id === i.id)), 'le pré-prompt reste côté serveur');
    assert.doesNotMatch(i.prompt, /\b(text|logo|child|children|face)\b/i, 'les interdits sont dans l’enveloppe, pas dans la scène');
    const c = M.lireChoix({ texte: i.idee, format: 'post', carte: i.id });
    assert.equal(c.carte, i.id);
    assert.ok(M.composerDemande(c).includes(i.prompt));
  }
});

test('garder : seule une image (data URL jpeg/png) raisonnable est acceptée', () => {
  const b64 = Buffer.alloc(5000, 7).toString('base64');
  assert.equal(M.lireGarde('data:image/jpeg;base64,' + b64).ext, 'jpg');
  assert.equal(M.lireGarde('data:image/svg+xml;base64,' + b64), null);
  assert.equal(M.lireGarde('data:image/png;base64,AAAA'), null);
  assert.equal(M.lireGarde('https://x/y.png'), null);
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
  moteur = { statut: 'done', url: 'https://cdn.moteur.test/img.png', bucket: true, n: 1 };
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    appels.push({ u, init });
    const rep = (status, corps, type) => ({ ok: status < 300, status, headers: { get: () => type || 'application/json' },
      json: async () => corps, text: async () => JSON.stringify(corps), arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
    if (u.pathname === '/auth/v1/user') return init.headers.Authorization === 'Bearer bon' ? rep(200, { email: moteur.email || 'julie@melodia.test' }) : rep(401, {});
    if (u.pathname === '/rest/v1/roles') return rep(200, [{ email: moteur.email || 'julie@melodia.test', role }]);
    if (u.pathname === '/rest/v1/rpc/melodia_trop_souvent') return rep(404, 'PGRST202');
    if (u.host === 'www.hyper-engine.ai' && u.pathname === '/api/image/tasks') return rep(202, { ok: true, taskId: 'imt_0123456789ab', eta_s: 60 });
    if (u.host === 'www.hyper-engine.ai' && u.pathname === '/api/image/tasks/tick') return rep(200, { ok: true });
    if (u.host === 'www.hyper-engine.ai') return rep(200, { status: moteur.statut, items: Array.from({ length: moteur.n }, (_, k) => ({ status: moteur.statut, url: moteur.statut === 'done' ? (k ? moteur.url.replace('img.png', 'img' + k + '.png') : moteur.url) : null })) });
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
const CHOIX = { texte: 'des lys blancs près d’une fenêtre', format: 'story', carte: 'lys' };

test('route : session, rôle et origine exigés', async () => {
  let res = fausseReponse(); await route(req('POST', CHOIX, { authorization: 'Bearer faux' }), res); assert.equal(res.statusCode, 401);
  role = 'partenaire'; res = fausseReponse(); await route(req('POST', CHOIX), res); assert.equal(res.statusCode, 403);
  role = 'commercial'; res = fausseReponse(); await route(req('POST', CHOIX, { origin: 'https://ailleurs.example' }), res); assert.equal(res.statusCode, 403);
});

test('route : éteinte par défaut, 503 GENERATION_INACTIVE, rien ne part vers le moteur', async () => {
  const res = fausseReponse(); await route(req('POST', CHOIX), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.corps.code, 'GENERATION_INACTIVE');
  assert.equal(res.corps.demande, undefined, 'la demande composée ne sort plus du serveur');
  assert.ok(!appels.some((a) => a.u.host === 'www.hyper-engine.ai'));
  const r2 = fausseReponse(); await route(req('POST', { format: 'post' }), r2); assert.equal(r2.statusCode, 400);
});

test('route allumée : lance, plafonne, suit la tâche et range l’image', async () => {
  process.env.MEDIAS_GENERATION = 'true'; process.env.HYPER_ENGINE_IMAGE_TOKEN = 'imx_test'; process.env.MEDIAS_GENERATION_JOUR = '2';
  let res = fausseReponse(); await route(req('POST', CHOIX), res);
  assert.equal(res.statusCode, 202); assert.equal(res.corps.tache, 'imt_0123456789ab');
  const envoi = appels.find((a) => a.u.pathname === '/api/image/tasks');
  assert.equal(envoi.init.headers.authorization, 'Bearer imx_test');
  const corps = JSON.parse(envoi.init.body);
  assert.equal(corps.items[0].ratio, '9:16'); assert.equal(corps.enrich, false); assert.match(corps.items[0].prompt, /logo, monogram/); assert.match(corps.items[0].prompt, /white lilies in a clear glass vase/);
  res = fausseReponse(); await route(req('POST', CHOIX), res); assert.equal(res.statusCode, 202);
  res = fausseReponse(); await route(req('POST', CHOIX), res); assert.equal(res.statusCode, 429, 'troisième demande au-delà du plafond');

  res = fausseReponse(); await route(req('GET', null, {}, { tache: 'imt_0123456789ab' }), res);
  assert.equal(res.corps.statut, 'fait'); assert.equal(res.corps.stockage, true);
  assert.match(res.corps.url, /^https:\/\/faux\.supabase\.test\/storage\/v1\/object\/public\/medias-commerciaux\/bruts\/[0-9a-f]+\/imt_0123456789ab\.png$/);

  moteur.bucket = false;
  res = fausseReponse(); await route(req('GET', null, {}, { tache: 'imt_0123456789ab' }), res);
  assert.equal(res.corps.stockage, false); assert.equal(res.corps.url, 'https://cdn.moteur.test/img.png', 'sans bucket : l’adresse du moteur');

  moteur.statut = 'running';
  res = fausseReponse(); await route(req('GET', null, {}, { tache: 'imt_0123456789ab' }), res); assert.equal(res.corps.statut, 'en-cours');
  res = fausseReponse(); await route(req('GET', null, {}, { tache: '../x' }), res); assert.equal(res.statusCode, 400);
});

test('variantes : 4 images demandées au moteur, comptées dans le plafond, toutes rendues', async () => {
  process.env.MEDIAS_GENERATION = 'true'; process.env.HYPER_ENGINE_IMAGE_TOKEN = 'imx_test'; process.env.MEDIAS_GENERATION_JOUR = '5';
  moteur.email = 'variantes@melodia.test'; // un plafond neuf, propre à ce test
  let res = fausseReponse(); await route(req('POST', { ...CHOIX, style: 'aquarelle', intensite: 3, variantes: 4 }), res);
  assert.equal(res.statusCode, 202); assert.equal(res.corps.variantes, 4); assert.equal(res.corps.style, 'aquarelle');
  const corps = JSON.parse(appels.find((a) => a.u.pathname === '/api/image/tasks').init.body);
  assert.equal(corps.items.length, 4);
  assert.match(corps.items[0].prompt, /watercolor/); assert.match(corps.items[0].prompt, /fully affirmed/);
  res = fausseReponse(); await route(req('POST', { ...CHOIX, variantes: 2 }), res);
  assert.equal(res.statusCode, 202, '4 + 2 > 5 : réduit à ce qui reste');
  assert.equal(res.corps.variantes, 1); assert.equal(res.corps.plafonne, true);
  assert.equal(JSON.parse(appels.filter((a) => a.u.pathname === '/api/image/tasks').pop().init.body).items.length, 1);
  res = fausseReponse(); await route(req('POST', { ...CHOIX, variantes: 1 }), res);
  assert.equal(res.statusCode, 429, 'plafond épuisé');
  moteur.n = 4;
  res = fausseReponse(); await route(req('GET', null, {}, { tache: 'imt_0123456789ab' }), res);
  assert.equal(res.corps.statut, 'fait'); assert.equal(res.corps.images.length, 4);
  assert.match(res.corps.images[3].url, /imt_0123456789ab-3\.png$/);
  // ?brut=…&n=2 : la troisième variante
  const vus = [];
  const f = globalThis.fetch; globalThis.fetch = async (url, init) => { vus.push(String(url)); return f(url, init); };
  res = fausseReponse(); res.send = (b) => { res.corps = b; return res; };
  await route(req('GET', null, {}, { brut: 'imt_0123456789ab', n: '2' }), res);
  assert.equal(res.statusCode, 200); assert.ok(vus.includes('https://cdn.moteur.test/img2.png'));
});

test('liste : sans origine (GET de même origine) acceptée, dit si la génération est active', async () => {
  const r = req('GET', null, {}, { liste: '1' }); delete r.headers.origin;
  const res = fausseReponse(); await route(r, res);
  assert.equal(res.statusCode, 200); assert.equal(res.corps.actif, false); assert.deepEqual(res.corps.images, []);
});

test('garder : range l’image composée sous gardes/, 503 STOCKAGE sans bucket', async () => {
  const data = 'data:image/jpeg;base64,' + Buffer.alloc(5000, 1).toString('base64');
  let res = fausseReponse(); await route(req('POST', { garder: data }), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.corps.url, /\/medias-commerciaux\/gardes\/[0-9a-f]+\/[a-z0-9]+\.jpg$/);
  moteur.bucket = false;
  res = fausseReponse(); await route(req('POST', { garder: data }), res);
  assert.equal(res.statusCode, 503); assert.equal(res.corps.code, 'STOCKAGE');
  res = fausseReponse(); await route(req('POST', { garder: 'data:text/html;base64,AAAA' }), res); assert.equal(res.statusCode, 400);
});

test('brut : relaie l’image du moteur (pour poser le logo), seulement allumé', async () => {
  let res = fausseReponse(); res.send = (b) => { res.corps = b; return res; };
  await route(req('GET', null, {}, { brut: 'imt_0123456789ab' }), res); assert.equal(res.statusCode, 503);
  process.env.MEDIAS_GENERATION = 'true'; process.env.HYPER_ENGINE_IMAGE_TOKEN = 'imx_test';
  res = fausseReponse(); res.send = (b) => { res.corps = b; return res; };
  await route(req('GET', null, {}, { brut: 'imt_0123456789ab' }), res);
  assert.equal(res.statusCode, 200); assert.equal(res.entetes['Content-Type'], 'image/png'); assert.ok(Buffer.isBuffer(res.corps));
});

test('styles : description publique courte, pré-prompt détaillé (technique, texture, composition), interdits gardés', () => {
  const pub = JSON.parse(readFileSync(join(RACINE, 'assets/medias/medias.json'), 'utf8')).styles;
  for (const s of M.STYLES) {
    const p = pub.find((x) => x.id === s.id);
    assert.ok(p.desc && p.desc.length <= 80 && p.desc === s.desc, 'description : ' + s.id);
    assert.deepEqual(Object.keys(p).sort(), ['desc', 'id', 'nom', 'vignette']);
    assert.match(s.prompt, /Texture:/, s.id); assert.match(s.prompt, /Composition:/, s.id);
    for (const n of [1, 2]) {
      const d = M.composerDemande(M.lireChoix({ texte: 'des lys blancs près d’une fenêtre', format: 'post', style: s.id, intensite: n }));
      assert.ok(d.includes(s.prompt), s.id); assert.ok(d.endsWith(M.INTERDITS), 'interdits en dernier : ' + s.id);
    }
  }
  // sans style : le style photo Melodia
  const sans = M.composerDemande(M.lireChoix({ texte: 'des lys blancs', format: 'post' }));
  assert.ok(sans.includes(M.STYLE)); assert.ok(sans.endsWith(M.INTERDITS));
});

test('console : « Aucun style » par défaut, intensité léger/marqué, 1 à 4 variantes, aucun pré-prompt côté navigateur', () => {
  const js = readFileSync(join(RACINE, 'assets/js/julie/julie-medias.js'), 'utf8');
  assert.match(js, /Aucun style/); assert.match(js, /style: '', intensite: 2/);
  assert.match(js, /\['1', 'Léger'\], \['2', 'Marqué'\]/);
  assert.match(js, /\['4', '4'\]/);
  for (const s of M.STYLES) assert.ok(!js.includes(s.prompt.slice(0, 40)), 'pré-prompt absent du navigateur : ' + s.id);
  assert.match(js, /poserLogo/, 'le logo reste posé par la console');
});
