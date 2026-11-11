'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const wasm = require('./wasm-test-helper.cjs');

test('jours fériés 2026', async () => {
  const r = await wasm.joursFeries(2026);
  assert.ok(r.includes('2026-01-01'), '1er janvier');
  assert.ok(r.includes('2026-04-06'), 'Lundi de Pâques');
  assert.ok(r.includes('2026-05-14'), 'Ascension');
  assert.ok(r.includes('2026-05-25'), 'Lundi de Pentecôte');
  assert.ok(r.includes('2026-12-25'), 'Noël');
});

test('jours fériés : Pâques 2024 et 2025', async () => {
  const r2024 = await wasm.joursFeries(2024);
  assert.ok(r2024.includes('2024-04-01'), 'Lundi de Pâques 2024');
  const r2025 = await wasm.joursFeries(2025);
  assert.ok(r2025.includes('2025-04-21'), 'Lundi de Pâques 2025');
});

test('créneau : depuis lundi matin, saute à mardi (prioritaire)', async () => {
  // 2026-11-09 = lundi
  const r = await wasm.meilleurCreneau({
    cases: [],
    maintenant: '2026-11-09T08:15:00+01:00',
    jours_a_essayer: 7
  });
  assert.equal(r.jour_semaine, 2, 'attendu mardi, reçu ' + r.jour_semaine);
  assert.ok(r.heure >= 8 && r.heure <= 15, 'heure ' + r.heure);
});

test('créneau : depuis vendredi après-midi, saute au lundi >= 10h ou mardi', async () => {
  // 2026-11-13 = vendredi
  const r = await wasm.meilleurCreneau({
    cases: [],
    maintenant: '2026-11-13T16:00:00+01:00',
    jours_a_essayer: 7
  });
  const ok = (r.jour_semaine === 1 && r.heure >= 10) || r.jour_semaine === 2;
  assert.ok(ok, 'reçu jour=' + r.jour_semaine + ' heure=' + r.heure);
});

test('créneau : saute le jour de l’an', async () => {
  // 2026-01-01 = jeudi férié
  const r = await wasm.meilleurCreneau({
    cases: [],
    maintenant: '2026-01-01T07:00:00+01:00',
    jours_a_essayer: 5
  });
  assert.ok(!r.iso.startsWith('2026-01-01'), 'iso = ' + r.iso);
});

test('créneau : un historique d’ouvertures décale la priorité', async () => {
  // On fournit un fort taux d'ouverture le mardi 10h.
  const cases = [];
  for (let i = 0; i < 30; i++) {
    cases.push({ jour_semaine: 2, heure: 10, ouverts: 15, envois: 20 });
  }
  const r = await wasm.meilleurCreneau({
    cases,
    maintenant: '2026-11-09T08:00:00+01:00',
    jours_a_essayer: 7
  });
  assert.equal(r.jour_semaine, 2, 'jour ' + r.jour_semaine);
  assert.equal(r.heure, 10, 'heure ' + r.heure);
});
