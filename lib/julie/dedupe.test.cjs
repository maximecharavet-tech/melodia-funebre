'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const wasm = require('./wasm-test-helper.cjs');

test('similarité : identiques = 1.0', async () => {
  const r = await wasm.similarite('martin', 'martin');
  assert.ok(r.score > 0.999);
});

test('similarité : très proches > 0.95', async () => {
  const r = await wasm.similarite('pompes funebres martin', 'pompes funebres marti');
  assert.ok(r.score > 0.95, 'score = ' + r.score);
});

test('similarité : distincts < 0.5', async () => {
  const r = await wasm.similarite('pompes martin', 'marbrier dupont');
  assert.ok(r.score < 0.5, 'score = ' + r.score);
});

test('clé dédoublonnage : normalise siret + email', async () => {
  const r = await wasm.dedupeCle({
    siret: '123 456 789 00012',
    email: ' A@B.FR ',
    nom: '  Pompes Martin ',
    cp: '69001'
  });
  assert.equal(r.siret, '12345678900012');
  assert.equal(r.email, 'a@b.fr');
  assert.equal(r.nom_cp, 'pompes martin|69001');
});

test('domaine : gmial.com → gmail.com', async () => {
  const r = await wasm.domaineSuggere('gmial.com');
  assert.equal(r.suggestion, 'gmail.com');
});

test('domaine : gmail.com → pas de suggestion', async () => {
  const r = await wasm.domaineSuggere('gmail.com');
  assert.equal(r.suggestion, null);
});

test('domaine : inconnu → null', async () => {
  const r = await wasm.domaineSuggere('un-domaine-inconnu.tld');
  assert.equal(r.suggestion, null);
});

// ─── Clé d'idempotence d'envoi : Rust/WASM, repli JS et serveur donnent la même clé ───
const CAS_CLES = [
  { destinataire: ' Foo@Bar.COM ', modele: 'PF-Relance-J4' },
  { destinataire: 'a@b.fr', modele: 'pf-premier-contact', etape: 0 },
  { destinataire: 'a@b.fr', modele: 'pf-premier-contact', etape: 1 },
  { destinataire: 'a@b.fr', campagne: 'Salon Lyon' },
  { destinataire: 'a@b.fr', sujet: '  Bonjour   MONDE ' },
  { destinataire: 'a@b.fr', sujet: 'Présentation de Mélodia Funèbre' },
  { destinataire: 'x@y.fr' }
];

test('clé d’envoi : normalisation (Foo@Bar.com = foo@bar.com)', async () => {
  const a = await wasm.envoiCle({ destinataire: 'Foo@Bar.com', modele: 'm' });
  const b = await wasm.envoiCle({ destinataire: ' foo@bar.com ', modele: 'M' });
  assert.equal(a.cle, b.cle);
  assert.equal(a.cle, 'foo@bar.com|m:m');
});

test('clé d’envoi : la même étape = la même clé, une autre étape = une autre clé', async () => {
  const k = (e) => wasm.envoiCle({ destinataire: 'a@b.fr', modele: 'x', etape: e });
  assert.equal((await k(1)).cle, (await k(1)).cle);
  assert.notEqual((await k(1)).cle, (await k(2)).cle);
});

test('clé d’envoi : parité Rust/WASM ↔ serveur (api/_envoi-unique.js) ↔ repli JS', async () => {
  const serveur = await import('../../api/_envoi-unique.js');
  global.window = global.window || {};
  delete require.cache[require.resolve('../../assets/js/vendor/julie-fallback.js')];
  require('../../assets/js/vendor/julie-fallback.js');
  const repli = global.window.MelodiaJulieFallback;
  for (const cas of CAS_CLES) {
    const w = (await wasm.envoiCle(cas)).cle;
    assert.equal(w, serveur.cleEnvoi(cas), 'wasm ≠ serveur pour ' + JSON.stringify(cas));
    assert.equal(repli.envoi_cle(cas).cle, w, 'repli ≠ wasm pour ' + JSON.stringify(cas));
  }
});
