'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const wasm = require('./wasm-test-helper.cjs');

test('délivrabilité : bon courriel note A ou B', async () => {
  const r = await wasm.delivrabilite({
    objet: 'Une chanson pour les familles de Martin',
    preheader: 'Découvrez notre partenariat Melodia',
    texte: 'Bonjour Madame, je me permets de vous écrire pour vous présenter notre service de composition musicale sur mesure. Chaque chanson est livrée en vingt-quatre heures, jouée à la cérémonie et conservée par la famille. Nous partageons soixante pour cent du montant avec l’agence partenaire. Seriez-vous disponible quelques minutes cette semaine pour en parler ?',
    html: '<p>Bonjour</p>',
    liens: ['https://melodia-funebre.fr/professionnels'],
    piece_jointe_ko: false,
    poids_pieces_octets: 200000,
    variables_non_resolues: [],
    personnalise: true,
    a_desabonnement: true
  });
  assert.ok(['A', 'B'].includes(r.note), 'note = ' + r.note);
  assert.ok(r.score >= 75, 'score = ' + r.score);
});

test('délivrabilité : mauvais courriel note E ou F', async () => {
  const r = await wasm.delivrabilite({
    objet: 'GRATUIT !!! URGENT',
    preheader: '',
    texte: 'CLIQUEZ ICI',
    html: '',
    liens: [
      'https://bit.ly/xyz',
      'https://a.fr',
      'https://b.fr',
      'https://c.fr'
    ],
    piece_jointe_ko: true,
    poids_pieces_octets: 10000000,
    variables_non_resolues: ['{agence}', '{ville}'],
    personnalise: false,
    a_desabonnement: false
  });
  assert.ok(['E', 'F'].includes(r.note), 'note = ' + r.note);
  assert.ok(r.problemes.length >= 4);
});

test('délivrabilité : lien externe + raccourcisseur détectés', async () => {
  const r = await wasm.delivrabilite({
    objet: 'Un sujet convenable pour un test',
    preheader: 'Preheader raisonnable',
    texte: 'Un corps de courriel de longueur suffisante pour ne pas déclencher ' +
      'le malus de longueur, avec plusieurs phrases utiles et naturelles ' +
      'qui décrivent le service et proposent un rendez-vous cette semaine, ' +
      'sans emphase excessive ni flatterie. Un lien interne bienvenu.',
    html: '<p>ok</p>',
    liens: ['https://bit.ly/abc', 'https://melodia-funebre.fr/x'],
    variables_non_resolues: [],
    personnalise: true,
    a_desabonnement: true
  });
  const p = r.problemes.join(' | ');
  assert.ok(p.includes('bit.ly') || p.includes('Raccourcisseur'), p);
});
