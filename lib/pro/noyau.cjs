// Charge melodia_pro.wasm dans Node : le même fichier que le navigateur.
// Une seule source de vérité pour les règles (prix, statut, essai, prompt, QR).
'use strict';
const { readFileSync } = require('node:fs');
const path = require('node:path');
const glue = require('../../assets/js/vendor/melodia-pro-glue.js');

let promesse = null;

function noyau() {
  if (!promesse) {
    const octets = readFileSync(path.join(__dirname, '..', '..', 'assets', 'js', 'vendor', 'melodia_pro.wasm'));
    promesse = glue.charger(octets);
  }
  return promesse;
}

module.exports = { noyau };
