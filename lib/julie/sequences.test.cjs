'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const wasm = require('./wasm-test-helper.cjs');

test('séquence : première étape J0', async () => {
  const r = await wasm.sequenceProchaineEtape({
    debut_iso: '2026-11-10T08:40:00+01:00',
    etapes: [
      { jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: [] },
      { jour: 3, modele: 'pf-relance-j4', canal: 'mail', brochures: [] },
      { jour: 7, modele: 'pf-relance-j10', canal: 'mail', brochures: [] }
    ],
    etapes_faites: 0,
    statut: 'nouveau'
  });
  assert.equal(r.terminee, false);
  assert.equal(r.index, 0);
  assert.equal(r.date_iso, '2026-11-10');
  assert.equal(r.canal, 'mail');
  assert.ok(r.cle_idempotence.includes(':0:'));
});

test('séquence : sortie sur réponse', async () => {
  const r = await wasm.sequenceProchaineEtape({
    debut_iso: '2026-11-10T08:40:00+01:00',
    etapes: [{ jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: [] }],
    etapes_faites: 0,
    a_repondu: true
  });
  assert.equal(r.terminee, true);
  assert.ok(r.motif_sortie);
});

test('séquence : sortie sur opposition', async () => {
  const r = await wasm.sequenceProchaineEtape({
    debut_iso: '2026-11-10T08:40:00+01:00',
    etapes: [{ jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: [] }],
    etapes_faites: 0,
    oppose: true
  });
  assert.equal(r.terminee, true);
  assert.ok(r.motif_sortie);
});

test('séquence : sortie sur statut terminal', async () => {
  const r = await wasm.sequenceProchaineEtape({
    debut_iso: '2026-11-10T08:40:00+01:00',
    etapes: [{ jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: [] }],
    etapes_faites: 0,
    statut: 'partenaire'
  });
  assert.equal(r.terminee, true);
});

test('séquence : bascule appel après 2 clics récents', async () => {
  const r = await wasm.sequenceProchaineEtape({
    debut_iso: '2026-11-10T08:40:00+01:00',
    etapes: [
      { jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: [] },
      { jour: 3, modele: 'pf-relance-j4', canal: 'mail', brochures: [] }
    ],
    etapes_faites: 1,
    clics_recents: 2
  });
  assert.equal(r.terminee, false);
  assert.equal(r.canal, 'appel');
});

test('séquence : clé idempotente stable', async () => {
  const e = {
    debut_iso: '2026-11-10T08:40:00+01:00',
    etapes: [{ jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: [] }],
    etapes_faites: 0
  };
  const a = await wasm.sequenceProchaineEtape(e);
  const b = await wasm.sequenceProchaineEtape(e);
  assert.equal(a.cle_idempotence, b.cle_idempotence);
});

test('séquence : toutes les étapes faites → terminée', async () => {
  const r = await wasm.sequenceProchaineEtape({
    debut_iso: '2026-11-10T08:40:00+01:00',
    etapes: [{ jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: [] }],
    etapes_faites: 1
  });
  assert.equal(r.terminee, true);
});
