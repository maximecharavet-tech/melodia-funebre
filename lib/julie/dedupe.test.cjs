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
