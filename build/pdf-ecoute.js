/* ═══════════════════════════════════════════════════════════════
   MELODIA — « Écoutez » : le catalogue d'exemples, en PDF

   Un document à joindre à un mail de prospection : les musiques
   déjà publiées sur le site, chacune avec son disque d'or, sa page
   d'écoute (lien cliquable + QR). Aucun témoignage, aucun chiffre :
   seulement des pièces que le destinataire peut entendre lui-même.

   Les titres, les prénoms et les styles viennent de
   assets/data/content.json (le catalogue du site). Le disque d'or est
   celui de assets/css/style.css, lu tel quel, pas redessiné. Le QR est
   celui de assets/js/qr.js (encodeur maison). Chaque œuvre est
   « composée par Melodia Funèbre ».
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { fontes, image, SOMBRE } = require('./pdf-style.js');

const RACINE = path.join(__dirname, '..');
const SITE = 'https://melodia-funebre.fr';
const PAR_PAGE = 8;

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Même règle que le site et la console (collaborateur-mails.js). */
function limace(texte) {
  return String(texte || '')
    .replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'hommage';
}

function qrSvg(texte) {
  if (!global.window) global.window = {};
  if (!global.window.MelodiaQR) {
    // eslint-disable-next-line no-eval
    (0, eval)(fs.readFileSync(path.join(RACINE, 'assets/js/qr.js'), 'utf8'));
  }
  return global.window.MelodiaQR.svg(texte, { niveau: 'M', titre: 'QR code vers la page d’écoute' });
}

function catalogue() {
  const c = JSON.parse(fs.readFileSync(path.join(RACINE, 'assets/data/content.json'), 'utf8'));
  const vus = {};
  return (c.demos || []).filter(x => x && x.visible !== false && x.audio && x.title).map(x => {
    let slug = limace(x.title);
    if (vus[slug]) { vus[slug]++; slug += '-' + vus[slug]; } else vus[slug] = 1;
    return { titre: x.title, qui: x.who || '', style: x.style || '', url: SITE + '/ecouter/' + slug };
  });
}

/* Le disque : tout le bloc « Le disque » de la feuille de style du site. */
function cssDisque() {
  const css = fs.readFileSync(path.join(RACINE, 'assets/css/style.css'), 'utf8');
  const a = css.indexOf('/* ─── Le disque ─── */');
  const b = css.indexOf('.etiquette b {', a);
  if (a < 0 || b < 0) throw new Error('Bloc « Le disque » introuvable dans style.css');
  const fin = css.indexOf('}', b) + 1;
  return css.slice(a, fin);
}

function disque(initiale, px) {
  return `<div class="disque-cadre" style="width:${px}px !important;--lueur:0">
    <div class="disque"></div><div class="disque-bord"></div>
    <div class="etiquette"><b style="font-size:${Math.round(px * 0.135)}px !important">${esc(initiale)}</b></div></div>`;
}

function html() {
  const liste = catalogue();
  const pages = [];
  for (let i = 0; i < liste.length; i += PAR_PAGE) pages.push(liste.slice(i, i + PAR_PAGE));
  const fond = image('assets/img/og-melodia.jpg');

  const css = `${fontes()}
  ${SOMBRE}
  :root { --lueur: 0; --ff-d: 'Cormorant Garamond', Georgia, serif; --or-grad: linear-gradient(100deg,#8f6f22,#e3c977 45%,#b8922f); }
  ${cssDisque()}
  .couv { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; height:100%; padding: 0 22mm; }
  .couv h1 { font-size: 46pt; margin: 14mm 0 5mm; }
  .couv .grand { max-width: 130mm; }
  .grille { display:grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 5mm; margin-top: 7mm; height: 228mm; }
  .morceau { display:flex; gap:5mm; align-items:center; border:1px solid rgba(201,168,76,.22); background:rgba(201,168,76,.035); padding:5mm; }
  .morceau .txt { flex:1; min-width:0; }
  .morceau h3 { font-size: 13pt; line-height:1.15; margin-bottom:1.5mm; }
  .morceau .qui { font-size: 8.4pt; color:#c4bba6; line-height:1.4; }
  .morceau .style { font-family:'Jetbrains Mono',monospace; font-size:6.4pt; letter-spacing:.18em; text-transform:uppercase; color:#c9a84c; margin-top:2mm; }
  .morceau a { color:#e3c977; font-size:7.4pt; text-decoration:none; word-break:break-all; display:block; margin-top:2mm; }
  .morceau .qr { width: 22mm; flex: none; background:#f4f1ea; padding:1.6mm; }
  .morceau .qr svg { display:block; width:100%; height:auto; }
  .tete { display:flex; justify-content:space-between; align-items:baseline; }
  .page .dedans { padding: 16mm 14mm 12mm; }
  .page.couverture { background: radial-gradient(ellipse at 50% 34%, #1b1608 0%, #040407 62%); }
  .cta { margin-top: 9mm; font-size: 9pt; color:#c4bba6; }
  .cta a { color:#e3c977; }`;

  const couverture = `<section class="page couverture"><div class="couv">
    <p class="surtitre">Exemples déjà publiés sur le site</p>
    ${disque('M', 250)}
    <h1>Écoutez. <em>Puis décidez.</em></h1>
    <p class="grand">${liste.length} musiques d’hommage, chacune composée par Melodia Funèbre à partir de ce qu’une famille a raconté. Chaque page s’ouvre d’un clic ou d’un scan : écoutez avant de décider.</p>
    <p class="cta"><a href="${SITE}/ecouter">${SITE.replace('https://', '')}/ecouter</a></p>
  </div></section>`;

  const corps = pages.map((p, n) => `<section class="page"><div class="dedans">
    <div class="tete"><p class="surtitre">Le catalogue · ${n + 1} / ${pages.length}</p><p class="surtitre" style="color:#6b5828">Composé par Melodia Funèbre</p></div>
    <hr class="filet" style="margin-top:3mm">
    <div class="grille">${p.map(m => `<article class="morceau">
      ${disque((m.qui || m.titre).trim().charAt(0).toUpperCase(), 78)}
      <div class="txt"><h3>${esc(m.titre)}</h3><p class="qui">${esc(m.qui)}</p><p class="style">${esc(m.style)}</p>
        <a href="${esc(m.url)}">${esc(m.url.replace('https://', ''))}</a></div>
      <div class="qr">${qrSvg(m.url)}</div></article>`).join('')}</div>
    <div class="pied"><span>Melodia Funèbre</span><span>${SITE.replace('https://', '')}</span></div>
  </div></section>`).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Melodia Funèbre — Écoutez</title>
  <style>${css}</style></head><body>${couverture}${corps}</body></html>`;
}

module.exports = { html, fichier: 'melodia-brochure-ecoute-exemples.pdf', catalogue, limace };
