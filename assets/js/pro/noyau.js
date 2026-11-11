// Le noyau Rust (melodia_pro.wasm), chargé une fois, partagé par les vues.
// C'est le même fichier que celui des fonctions serveur.
let promesse = null;
export function noyau() {
  if (!promesse) {
    if (!window.MelodiaProNoyau) return Promise.reject(new Error('noyau absent'));
    promesse = window.MelodiaProNoyau.charger('/assets/js/vendor/melodia_pro.wasm');
  }
  return promesse;
}
