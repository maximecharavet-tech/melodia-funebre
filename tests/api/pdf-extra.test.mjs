/* Les quatre PDF premium (pass 2) : présents dans le catalogue des pièces jointes (serveur ET console),
   dans le kit de la console, joignables en production (vercel.json), et chacun porte la carte de Julie. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const R = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const outils = require('../../lib/prospect-outils.cjs');

const DOCS = [
  ['presentation-agences', 'melodia-presentation-agences-partenaires.pdf', 'pdf-extra-agences'],
  ['offre-pro', 'melodia-offre-pro.pdf', 'pdf-extra-offre-pro'],
  ['ecoute-prestige', 'melodia-plaquette-ecoute-prestige.pdf', 'pdf-extra-ecoute-prestige'],
  ['fiche-contact-julie', 'melodia-fiche-contact-julie-serve.pdf', 'pdf-extra-contact']
];
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');

for (const [id, fichier, gen] of DOCS) {
  test('PDF extra ' + id, () => {
    assert.ok(outils.BROCHURE_IDS.includes(id), 'id dans le catalogue serveur');
    assert.equal(outils.BROCHURES[id].chemin, 'documents/' + fichier);
    const buf = fs.readFileSync(path.join(R, 'documents', fichier));
    assert.equal(buf.slice(0, 5).toString(), '%PDF-');
    assert.ok(buf.length < outils.PDF_MAX, 'sous la limite de pièce jointe');
    assert.ok(lire('assets/js/collaborateur-mails.js').includes("'" + id + "'"), 'catalogue console');
    assert.ok(lire('assets/js/collaborateur-espace.js').includes('/documents/' + fichier), 'kit console');
    assert.ok(lire('vercel.json').includes(fichier.replace(/^melodia-|\.pdf$/g, '')), 'embarqué par la fonction');
  });
  test('Sources du PDF ' + id + ' : carte de Julie, aucun fournisseur nommé, aucun secret', () => {
    const d = require('../../build/data.js');
    const c = JSON.parse(lire('assets/data/content.json'));
    const html = require('../../build/' + gen + '.js').html({ offres: c.offers, options: d.OPTIONS, demos: c.demos.length });
    assert.ok(html.includes('alt="Carte de visite de Julie Serve'), 'carte présente');
    assert.ok(!/mureka|mastermax/i.test(html.replace(/data:[^"')]+/g, '')));
    assert.ok(/composé par Melodia Funèbre/i.test(html));
  });
}
