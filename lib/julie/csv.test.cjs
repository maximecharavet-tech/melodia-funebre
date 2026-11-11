'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const wasm = require('./wasm-test-helper.cjs');

test('csv : point-virgule simple', async () => {
  const r = await wasm.csvParser('nom;email;ville\nMartin;contact@martin.fr;Lyon');
  assert.equal(r.separateur, ';');
  assert.deepEqual(r.entetes, ['nom', 'email', 'ville']);
  assert.deepEqual(r.lignes[0], ['Martin', 'contact@martin.fr', 'Lyon']);
});

test('csv : guillemets internes', async () => {
  const r = await wasm.csvParser('nom;email\n"Martin ""Frères""";"contact@mf.fr"');
  assert.equal(r.lignes[0][0], 'Martin "Frères"');
  assert.equal(r.lignes[0][1], 'contact@mf.fr');
});

test('csv : tabulation', async () => {
  const r = await wasm.csvParser('nom\temail\nMartin\tcontact@x.fr');
  assert.equal(r.separateur, '\t');
  assert.equal(r.entetes.length, 2);
});

test('csv : BOM ignoré', async () => {
  const r = await wasm.csvParser('\uFEFFnom;email\nX;x@y.fr');
  assert.equal(r.entetes[0], 'nom');
});

test('csv : détection de colonnes', async () => {
  const r = await wasm.csvDetecterColonnes([
    'Raison sociale', 'Courriel', 'Code postal', 'Blah'
  ]);
  assert.equal(r.mapping['Raison sociale'], 'nom');
  assert.equal(r.mapping['Courriel'], 'email');
  assert.equal(r.mapping['Code postal'], 'cp');
  assert.equal(r.mapping['Blah'], undefined);
  assert.ok(r.colonnes_inconnues.includes('Blah'));
});
