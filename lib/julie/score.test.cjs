'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const wasm = require('./wasm-test-helper.cjs');

test('score : opposé → 0', async () => {
  const r = await wasm.scoreProspect({ oppose: true });
  assert.equal(r.score, 0);
  assert.equal(r.couleur, 'ash');
  assert.ok(r.motif_zero);
});

test('score : rejeté → 0', async () => {
  const r = await wasm.scoreProspect({ rejete: true });
  assert.equal(r.score, 0);
  assert.ok(r.motif_zero);
});

test('score : pompes funèbres avec courriel = 30', async () => {
  const r = await wasm.scoreProspect({ type: 'funeraire', email: 'a@b.fr' });
  assert.equal(r.score, 30);
  assert.equal(r.contributions.length, 2);
});

test('score : plafonné à 100', async () => {
  const r = await wasm.scoreProspect({
    type: 'funeraire',
    etablissements: 5,
    effectif: '50+',
    email: 'a@b.fr',
    site: 'https://x.fr',
    dirigeant: 'M. X',
    evenements: [
      { kind: 'ouvert', le: '' },
      { kind: 'ouvert', le: '' },
      { kind: 'ouvert', le: '' },
      { kind: 'clique', le: '' },
      { kind: 'clique', le: '' },
      { kind: 'repondu', le: '' }
    ]
  });
  assert.equal(r.score, 100);
  assert.equal(r.couleur, 'or-bright');
});

test('score : stale > 30 j retire 10', async () => {
  const maintenant = new Date().toISOString();
  const ilYa40Jours = new Date(Date.now() - 40 * 86400_000).toISOString();
  const r = await wasm.scoreProspect({
    type: 'funeraire',
    email: 'a@b.fr',
    dernier_contact_le: ilYa40Jours,
    maintenant_iso: maintenant
  });
  // 20 (type) + 10 (email) - 10 (stale) = 20
  assert.equal(r.score, 20);
});
