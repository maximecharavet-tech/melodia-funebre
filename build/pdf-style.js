/* ═══════════════════════════════════════════════════════════════
   MELODIA — L'habillage des deux documents imprimés

   Deux fonds, et c'est un choix, pas une inconséquence.

   La brochure partenaire est un objet de marque : elle se regarde à
   l'écran, s'envoie en pièce jointe et s'imprime sur beau papier. Elle
   garde donc le noir et l'or du site, et les visuels de campagne en
   pleine page.

   Le manuel du collaborateur est un outil de travail : il s'imprime
   en noir et blanc, se glisse dans une sacoche, s'annote au stylo
   pendant un appel. Un fond noir y coûterait une cartouche par
   exemplaire et rendrait toute annotation impossible. Il est donc sur
   ivoire, avec l'or réservé aux filets et aux chiffres.

   Les polices sont embarquées en base64 : un PDF qui compte sur les
   polices du lecteur n'est pas un PDF, c'est un espoir.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const POLICES = path.join(__dirname, 'polices');

/* Chaque fichier woff2 devient une déclaration @font-face autonome.
   Le sous-ensemble « latin-ext » porte les œ, les ÿ et les guillemets
   dont le français a besoin : on ne le laisse pas de côté. */
function fontes() {
  if (!fs.existsSync(POLICES)) return '';
  return fs.readdirSync(POLICES).filter(f => f.endsWith('.woff2')).map(f => {
    const m = f.match(/^(.*?)-(\d+)-(normal|italic)-(latin(?:-ext)?)\.woff2$/);
    if (!m) return '';
    const famille = m[1].split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
    const b64 = fs.readFileSync(path.join(POLICES, f)).toString('base64');
    return `@font-face{font-family:'${famille}';font-style:${m[3]};font-weight:${m[2]};font-display:block;` +
           `src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
  }).join('\n');
}

/* Une image du dépôt, prête à être posée dans un src. */
function image(relatif) {
  const p = path.join(__dirname, '..', relatif);
  if (!fs.existsSync(p)) throw new Error('Image absente : ' + relatif);
  const type = /\.png$/i.test(relatif) ? 'image/png' : 'image/jpeg';
  return 'data:' + type + ';base64,' + fs.readFileSync(p).toString('base64');
}

const COMMUN = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* Une page = une feuille. Le format est posé ici et nulle part
     ailleurs, pour que le générateur n'ait pas à le redire. */
  @page { size: A4; margin: 0; }
  .page {
    position: relative;
    width: 210mm; height: 297mm;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .page:last-child { page-break-after: auto; break-after: auto; }

  .fond { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .voile { position: absolute; inset: 0; }
  .dedans { position: relative; height: 100%; display: flex; flex-direction: column; }

  /* Cormorant Garamond compose par défaut des chiffres elzéviriens :
     le « 1 » descend sous la ligne, et « 10 764 € » dans un tableau de
     marges ressemble à une coquille. Le jeu de chiffres alignés est
     dans la police, il suffit de le demander. */
  .chiffre, .montant {
    font-variant-numeric: lining-nums tabular-nums;
    font-feature-settings: 'lnum' 1, 'tnum' 1;
  }

  h1, h2, h3, h4 { margin: 0; font-weight: 300; }
  p { margin: 0; }
  ul, ol { margin: 0; padding: 0; list-style: none; }
  em { font-style: italic; }
  strong { font-weight: 500; }

  .surtitre {
    font-family: 'Jetbrains Mono', ui-monospace, monospace;
    font-size: 7pt; letter-spacing: 0.24em; text-transform: uppercase;
  }
  .filet { height: 1px; border: 0; }
`;

/* ─── La brochure : noir, or, pleine page ─── */
const SOMBRE = COMMUN + `
  body { background: #040407; color: #f4f1ea; font-family: 'Jost', system-ui, sans-serif; }
  .page { background: #040407; }
  .voile { background: linear-gradient(180deg, rgba(4,4,7,.35) 0%, rgba(4,4,7,.72) 42%, rgba(4,4,7,.97) 88%); }
  .dedans { padding: 18mm 16mm 14mm; }

  .surtitre { color: #c9a84c; }
  .filet { background: linear-gradient(90deg, #c9a84c, rgba(201,168,76,0)); }

  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 42pt; line-height: 1.02; color: #f4f1ea; }
  h1 em { color: #c9a84c; font-style: italic; }
  h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 27pt; line-height: 1.08; }
  h2 em { color: #c9a84c; }
  h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14pt; color: #f4f1ea; }

  p { font-size: 9.6pt; line-height: 1.72; color: #c4bba6; }
  p.grand { font-size: 12pt; line-height: 1.7; color: #e7e2d6; }
  .disc { font-size: 7.4pt; line-height: 1.6; color: #8e8878; }

  .carte { border: 1px solid rgba(201,168,76,.22); padding: 6mm; background: rgba(201,168,76,.035); }
  .chiffre { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 30pt; color: #c9a84c; line-height: 1; }

  .pied {
    margin-top: auto; padding-top: 5mm; border-top: 1px solid rgba(201,168,76,.2);
    display: flex; justify-content: space-between; align-items: baseline;
  }
  .pied span { font-family: 'Jetbrains Mono', monospace; font-size: 6.6pt; letter-spacing: .16em; color: #6b5828; text-transform: uppercase; }
`;

/* ─── Le manuel : ivoire, filets d'or, annotable ─── */
const CLAIR = COMMUN + `
  body { background: #ffffff; color: #17150f; font-family: 'Jost', system-ui, sans-serif; }
  .page { background: #fbfaf7; }
  .dedans { padding: 16mm 15mm 12mm; }

  .surtitre { color: #8a6f26; }
  .filet { background: linear-gradient(90deg, #c9a84c, rgba(201,168,76,0)); }

  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 38pt; line-height: 1.04; }
  h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24pt; line-height: 1.1; color: #17150f; }
  h2 em { color: #8a6f26; }
  h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 13.5pt; color: #17150f; }

  p { font-size: 9.2pt; line-height: 1.66; color: #3a362c; }
  .disc { font-size: 7.4pt; line-height: 1.6; color: #77715f; }

  .carte { border: 1px solid #e3ddcd; background: #fffefb; padding: 5mm; }
  .chiffre { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22pt; color: #8a6f26; line-height: 1; }

  .pied {
    margin-top: auto; padding-top: 4mm; border-top: 1px solid #e3ddcd;
    display: flex; justify-content: space-between; align-items: baseline;
  }
  .pied span { font-family: 'Jetbrains Mono', monospace; font-size: 6.4pt; letter-spacing: .16em; color: #9a8a5c; text-transform: uppercase; }
`;

module.exports = { fontes, image, SOMBRE, CLAIR };
