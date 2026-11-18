// Console commerciale : typographie (polices du site, auto-hébergées) et correctifs de mise en page relevés à l'audit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const lire = (f) => readFileSync(join(RACINE, f), 'utf8');
const page = lire('dashboard-commercial.html');
const typo = lire('assets/css/julie-typo.css');

test('typographie : feuille chargée en dernier, polices préchargées et présentes', () => {
  const feuilles = [...page.matchAll(/<link rel="stylesheet" href="([^"?]+)/g)].map((m) => m[1]);
  assert.equal(feuilles.at(-1), '/assets/css/julie-typo.css');
  const pre = [...page.matchAll(/<link rel="preload" href="([^"]+)" as="font" type="font\/woff2" crossorigin>/g)].map((m) => m[1]);
  assert.ok(pre.length >= 3);
  for (const f of pre) assert.ok(existsSync(join(RACINE, f)), 'police préchargée absente : ' + f);
  assert.ok(pre.some((f) => /cormorant-garamond-italic/.test(f)), 'l’italique des titres est préchargé');
  // les polices du site déclarent font-display: swap
  const faces = lire('assets/css/style.css').match(/@font-face\{font-family:'(Jost|Cormorant Garamond)'[^}]+\}/g);
  assert.ok(faces.length >= 8 && faces.every((f) => /font-display:swap/.test(f)));
});

test('typographie : deux familles seulement (Cormorant Garamond, Jost), plus de chasse fixe', () => {
  assert.match(typo, /--ff-m: 'Jost'/);
  assert.doesNotMatch(typo.replace(/\/\*[\s\S]*?\*\//g, ''), /JetBrains|monospace|Inter\b|Arial|Helvetica/);
  assert.match(typo, /font-variant-numeric: lining-nums tabular-nums/);
  assert.match(typo, /--ls-caps: \.12em/);
});

test('téléphone : champs à 16 px (pas de zoom iOS) et cibles tactiles de 44 px', () => {
  const mobile = typo.slice(typo.indexOf('@media (max-width: 760px)'));
  assert.match(mobile, /textarea[\s\S]*?font-size: 16px !important/);
  assert.match(mobile, /min-height: 44px; min-width: 44px/);
});

test('correctifs de mise en page : carte prospect, ligne « sans prochaine action », bloc d’œuvres, boutons Médias', () => {
  assert.match(typo, /\.o-head:has\(\.sel-case\) \{ display: grid/);
  assert.match(typo, /grid-template-areas: "nom actions" "meta actions"/);
  const vente = lire('assets/css/julie-vente.css');
  assert.match(vente, /\.jv-prop-oeuvres \{[^}]*border: 1px solid/);
  assert.match(vente, /\.jv-etape-duree \{ margin-left/);
  assert.match(lire('assets/css/julie-medias.css'), /@media \(max-width: 560px\) \{ \.jm-actions \.btn \{ min-height: 44px; text-transform: none/);
});
