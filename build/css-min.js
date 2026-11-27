/* ═══════════════════════════════════════════════════════════════
   assets/css/style.min.css — la feuille du site, sans commentaires
   ni blancs inutiles.

   style.css reste la source, commentée, celle qu'on édite. Les pages
   générées chargent la version réduite (environ 312 Ko → moins de la
   moitié). La réduction est volontairement prudente, sans dépendance :
     · les chaînes ('…', "…") et les url(…) sont recopiées telles
       quelles, octet pour octet ;
     · les commentaires (barre-étoile … étoile-barre) sont retirés ;
     · toute suite de blancs devient un seul espace, et l'espace est
       supprimé seulement à côté de « { », « } », « ; » et « , ».
   On ne touche jamais aux espaces autour de « : » ni entre deux mots :
   « a :hover » et « a:hover » ne désignent pas la même chose, pas plus
   que « calc(1px + 2px) » sans ses espaces.
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');

function reduire(css) {
  let out = '';
  let i = 0;
  const n = css.length;
  let blanc = false;
  const pousser = (s) => {
    if (blanc) {
      const a = out[out.length - 1];
      const b = s[0];
      if (out.length && !'{};,'.includes(a) && !'{};,'.includes(b)) out += ' ';
      blanc = false;
    }
    out += s;
  };
  while (i < n) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const fin = css.indexOf('*/', i + 2);
      i = fin === -1 ? n : fin + 2;
      blanc = true;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && css[j] !== c) { if (css[j] === '\\') j++; j++; }
      pousser(css.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if ((c === 'u' || c === 'U') && /^url\(/i.test(css.slice(i, i + 4))) {
      let j = i + 4;
      while (j < n && /\s/.test(css[j])) j++;
      if (css[j] !== '"' && css[j] !== "'") {
        const fin = css.indexOf(')', j);
        pousser(css.slice(i, fin + 1));
        i = fin + 1;
        continue;
      }
    }
    if (/\s/.test(c)) { blanc = true; i++; continue; }
    pousser(c);
    i++;
  }
  return out.trim() + '\n';
}

module.exports = function cssMin(RACINE) {
  const src = path.join(RACINE, 'assets/css/style.css');
  const dst = path.join(RACINE, 'assets/css/style.min.css');
  const avant = fs.readFileSync(src, 'utf8');
  const apres = '/* Généré par build/css-min.js depuis style.css : ne pas éditer. */\n' + reduire(avant);
  if (!fs.existsSync(dst) || fs.readFileSync(dst, 'utf8') !== apres) fs.writeFileSync(dst, apres);
  return { avant: Buffer.byteLength(avant), apres: Buffer.byteLength(apres) };
};
module.exports.reduire = reduire;
