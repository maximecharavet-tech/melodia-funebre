/* ═══════════════════════════════════════════════════════════════
   Minification prudente de la feuille de style publique (v3).

   assets/css/style.css reste LA source : écrite à la main, abondamment
   commentée, c'est elle qu'on édite. Elle pesait 296 Ko, dont près
   d'un tiers de commentaires ; servie telle quelle, elle coûtait 59 Ko
   en brotli à chaque première visite, sur le téléphone d'une famille.

   La génération produit donc assets/css/style.min.css, que chargent
   les pages générées. Rien n'est réécrit, rien n'est réordonné :
   on ôte les commentaires et les blancs superflus, sans jamais toucher
   aux chaînes ni aux url(). Les espaces ne sont retirés qu'autour de
   « { } ; , > » — jamais autour de « + », « - » ou « : », qui portent
   du sens dans calc() et dans les sélecteurs (« a :hover »).
   Aucune dépendance : un minificateur tiers ferait davantage, et
   changerait ce qu'on ne lui a pas demandé de changer.
   ═══════════════════════════════════════════════════════════════ */
const COLLANT = new Set(['{', '}', ';', ',', '>']);

function minifier(css) {
  let out = '';
  let espace = false;
  let i = 0;
  const n = css.length;
  const emettre = (s) => {
    if (espace && out && !COLLANT.has(out[out.length - 1]) && !COLLANT.has(s[0])) out += ' ';
    espace = false;
    /* « ;} » → « } » : le dernier point-virgule d'un bloc est facultatif. */
    if (s === '}' && out.endsWith(';')) out = out.slice(0, -1);
    out += s;
  };
  while (i < n) {
    const c = css[i];
    /* Commentaire : supprimé, compte comme un blanc. */
    if (c === '/' && css[i + 1] === '*') {
      const fin = css.indexOf('*/', i + 2);
      i = fin < 0 ? n : fin + 2;
      espace = true;
      continue;
    }
    /* Chaîne : recopiée telle quelle, échappements compris. */
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && css[j] !== c) { if (css[j] === '\\') j++; j++; }
      emettre(css.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    /* url( non guillemetée : recopiée jusqu'à la parenthèse fermante. */
    if ((c === 'u' || c === 'U') && /^url\(/i.test(css.slice(i, i + 4))) {
      let j = i + 4;
      while (j < n && /\s/.test(css[j])) j++;
      if (css[j] !== '"' && css[j] !== "'") {
        const fin = css.indexOf(')', j);
        const bout = fin < 0 ? n : fin + 1;
        emettre(css.slice(i, bout));
        i = bout;
        continue;
      }
    }
    if (/\s/.test(c)) { espace = true; i++; continue; }
    emettre(c);
    i++;
  }
  return out.trim() + '\n';
}

const ENTETE = '/* style.min.css — engendré par build/css-min.js depuis style.css. Ne pas éditer : modifier style.css puis lancer la génération. */\n';

module.exports = { minifier, ENTETE };
