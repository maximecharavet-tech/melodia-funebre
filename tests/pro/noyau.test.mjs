// Le même .wasm que le navigateur, chargé dans Node : vérifie le contrat ABI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { noyau } from '../../lib/pro/noyau.mjs';

test('le noyau pèse moins de 200 Ko', () => {
  assert.ok(statSync('assets/js/vendor/melodia_pro.wasm').size <= 200 * 1024);
});

test('contrat ABI : chaque export répond', async () => {
  const k = await noyau();
  assert.match(k.version().version, /^\d+\.\d+\.\d+$/);
  assert.equal(k.siretValider({ siret: '732 829 320 00074' }).valide, true);
  assert.equal(k.statutTransition({ de: 'en_attente_paiement', vers: 'paye', acteur: 'agence' }).ok, false);
  assert.equal(k.prix({ prix_unitaire_cents: 14900 }).ttc_cents, 14900);
  assert.equal(k.prix({}).erreur, 'TARIF_NON_FIXE');
  assert.equal(k.promoNormaliser({ code: 'master max' }).strict, 'MASTERMAX');
  assert.equal(k.jetonValider({ jeton: '7K3M9QXT2BZZ' }).valide, true);
  assert.deepEqual(k.questionnaireNettoyer({ texte: 'tel 06 12 34 56 78' }).retraits, ['telephone']);
});

test('QR : SVG, formes, refus des couleurs illisibles', async () => {
  const k = await noyau();
  const r = k.qrSvg({ texte: 'https://melodia-funebre.fr/m/7K3M9QXT2BZZ', modules: 'arrondi', yeux: 'arrondi', encre: '#040407', fond: '#f4f1ea', logo: 0.2, formes: true, taille_mm: 30 });
  assert.equal(r.ok, true);
  assert.match(r.svg, /^<svg[\s\S]*<\/svg>$/);
  assert.ok(r.formes.length > 100);
  assert.equal(r.module_um, Math.round(30000 / r.cote));
  assert.equal(k.qrSvg({ texte: 'x', encre: '#c9a84c', fond: '#040407' }).erreur, 'ENCRE_PLUS_CLAIRE_QUE_LE_FOND');
});
