/**
 * lib/julie/wasm-test-helper.cjs
 *
 * Charge le fichier `assets/js/vendor/julie_v2.wasm` dans Node (`node --test`),
 * et expose les mêmes fonctions que le glue navigateur, mais en asynchrone
 * (`await`). Aucune dépendance npm.
 *
 * Si le wasm n'est pas trouvé, une erreur explicite est levée pour rappeler
 * d'exécuter `console-julie-wasm/BUILD.md` avant les tests.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const WASM_PATH = path.resolve(__dirname, '..', '..', 'assets', 'js', 'vendor', 'julie_v2.wasm');

let instancePromise = null;

function charger() {
  if (instancePromise) return instancePromise;
  if (!fs.existsSync(WASM_PATH)) {
    return Promise.reject(new Error(
      'Wasm introuvable : ' + WASM_PATH + '\n' +
      'Exécutez `cargo build --release --target wasm32-unknown-unknown` ' +
      'dans console-julie-wasm/, puis copiez julie_v2.wasm dans assets/js/vendor/.'
    ));
  }
  const bytes = fs.readFileSync(WASM_PATH);
  instancePromise = WebAssembly.instantiate(bytes, {})
    .then(r => r.instance.exports);
  return instancePromise;
}

function lireRetour(ptr, exports) {
  const memory = new Uint8Array(exports.memory.buffer);
  const lenBytes = memory.subarray(ptr, ptr + 4);
  const len = lenBytes[0] | (lenBytes[1] << 8) | (lenBytes[2] << 16) | (lenBytes[3] << 24);
  const data = memory.slice(ptr + 4, ptr + 4 + (len >>> 0));
  try { exports.dealloc(ptr, 4 + (len >>> 0)); } catch (_) {}
  return new TextDecoder('utf-8').decode(data);
}

async function appeler(nomExport, payload) {
  const exports = await charger();
  const input = JSON.stringify(payload == null ? {} : payload);
  const bytes = new TextEncoder().encode(input);
  const ptr = exports.alloc(bytes.length);
  const memory = new Uint8Array(exports.memory.buffer);
  memory.set(bytes, ptr);
  let outPtr;
  try {
    outPtr = exports[nomExport](ptr, bytes.length);
  } finally {
    try { exports.dealloc(ptr, bytes.length); } catch (_) {}
  }
  return JSON.parse(lireRetour(outPtr, exports));
}

module.exports = {
  charger,
  appeler,
  scoreProspect: p => appeler('score_prospect', p),
  delivrabilite: e => appeler('delivrabilite_verifier', e),
  csvParser: texte => appeler('csv_parser', { texte }),
  csvDetecterColonnes: entetes => appeler('csv_detecter_colonnes', entetes),
  similarite: (a, b) => appeler('similarite', { a, b }),
  dedupeCle: o => appeler('dedupe_cle', o),
  envoiCle: o => appeler('envoi_cle', o),
  domaineSuggere: domaine => appeler('domaine_suggere', { domaine }),
  meilleurCreneau: o => appeler('meilleur_creneau', o),
  sequenceProchaineEtape: o => appeler('sequence_prochaine_etape', o),
  joursFeries: annee => appeler('jours_feries_annee', { annee })
};
