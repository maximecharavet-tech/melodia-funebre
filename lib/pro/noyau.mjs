// Charge melodia_pro.wasm dans Node : le même fichier que le navigateur.
// Une seule source de vérité pour les règles (prix, statut, essai, prompt, QR).
import { readFileSync } from 'node:fs';
import glue from '../../assets/js/vendor/melodia-pro-glue.js';

let promesse = null;

export function noyau() {
  if (!promesse) {
    const octets = readFileSync(new URL('../../assets/js/vendor/melodia_pro.wasm', import.meta.url));
    promesse = glue.charger(octets);
  }
  return promesse;
}
