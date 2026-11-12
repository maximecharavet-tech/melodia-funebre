/* ═══════════════════════════════════════════════════════════════
   MELODIA — Socle des PDF premium supplémentaires (pass 2)

   Quatre documents A4 partagent ici leur charte (noir, ivoire, or),
   leurs gabarits de page et, surtout, leur VERSO : la carte de visite
   officielle de Julie Serve, posée entière, jamais recadrée, jamais
   recouverte de texte. Elle figure sur chacun des quatre.

   Les visuels viennent de assets/pdf-extra/ ; on lit leurs dérivés
   allégés (assets/pdf-extra/opt/, voir scripts/optimiser-pdf-extra.py)
   pour qu'un PDF tienne sous les 2,5 Mo d'une pièce jointe.
   Aucun fournisseur musical n'est nommé : « composé par Melodia
   Funèbre ». Aucun chiffre, aucun témoignage n'est inventé.
   ═══════════════════════════════════════════════════════════════ */
const { fontes, image, SOMBRE } = require('./pdf-style.js');
const eco = require('./pdf-ecoute.js');

const { esc, qrSvg, cssDisque, disque, catalogue, SITE } = eco;
const COURRIEL_JULIE = 'julie@melodia-funebre.fr';
const SITE_COURT = SITE.replace('https://', '');

const img = (nom) => image('assets/pdf-extra/opt/' + nom);

/* Un QR lisible : fond ivoire, zone de silence de 4 modules (dans le
   SVG) plus un liseré ivoire, taille donnée en mm. */
function qr(url, mm, titre) {
  const svg = qrSvg(url).replace(/<svg /, '<svg role="img" aria-label="' + esc(titre || 'QR code') + '" ');
  return `<div class="qr" style="width:${mm}mm;height:${mm}mm">${svg}</div>`;
}

const CSS = `
${fontes()}
${SOMBRE}
:root { --lueur: 0; --ff-d: 'Cormorant Garamond', Georgia, serif; --or: #c9a84c; --or-clair: #e3c977; --ivoire: #f4f1ea;
        --or-grad: linear-gradient(100deg,#8f6f22,#e3c977 45%,#b8922f); }
${cssDisque()}
a { color: #e3c977; text-decoration: none; }
.page { background: #040407; }
.page .dedans { padding: 16mm 16mm 13mm; }
.cadre { position: absolute; inset: 9mm; border: .25mm solid rgba(201,168,76,.28); pointer-events: none; }
.tete { display: flex; justify-content: space-between; align-items: baseline; }
.tete .surtitre.sourd { color: #8a7a46; }
.filet-or { width: 26mm; height: .3mm; background: linear-gradient(90deg,#c9a84c,rgba(201,168,76,0)); margin: 4mm 0 6mm; }
h1 { font-size: 40pt; }
h2 { font-size: 26pt; }
h2.moyen { font-size: 22pt; }
.lede { font-family: var(--ff-d); font-size: 13.5pt; line-height: 1.55; color: #e7e2d6; font-weight: 300; }
p { font-size: 9.8pt; line-height: 1.72; }
.fine { font-size: 7.6pt; line-height: 1.6; color: #9a927e; }
.or { color: #c9a84c; }
.ivoire { color: #f4f1ea; }
.num { font-family: 'Jetbrains Mono', monospace; font-size: 7pt; letter-spacing: .2em; color: #c9a84c; }
.carte2 { border: .25mm solid rgba(201,168,76,.3); background: rgba(201,168,76,.04); padding: 6mm; }
.carte2 h3 { font-size: 14.5pt; margin-bottom: 2.4mm; }
.carte2 p { font-size: 9pt; line-height: 1.66; }
.qr { background: #f4f1ea; padding: 1.4mm; flex: none; }
.qr svg { display: block; width: 100%; height: 100%; }
.pied { margin-top: auto; }
.cache { position: absolute; left: 0; right: 0; bottom: 0; }
.degrade-bas { position: absolute; left: 0; right: 0; bottom: 0; height: 150mm;
  background: linear-gradient(180deg, rgba(4,4,7,0) 0%, rgba(4,4,7,.82) 38%, #040407 72%); }
.degrade-haut { position: absolute; left: 0; right: 0; top: 0; height: 70mm;
  background: linear-gradient(0deg, rgba(4,4,7,0), rgba(4,4,7,.78)); }
.plein { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; }
.cadre-photo { border: .25mm solid rgba(201,168,76,.45); padding: 1.6mm; background: #0a0907; }
.cadre-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.verso .carte-julie { display: block; width: 170mm; height: auto; border: .3mm solid rgba(201,168,76,.55); }
.contact-ligne { display: flex; align-items: center; gap: 7mm; }
.contact-ligne .qrs { display: flex; gap: 6mm; margin-left: auto; }
.qr-legende { font-family: 'Jetbrains Mono', monospace; font-size: 6pt; letter-spacing: .14em; text-transform: uppercase; color: #9a927e; text-align: center; margin-top: 1.6mm; }
`;

function enveloppe(titre, corps, extra) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titre)}</title>
  <meta name="author" content="Melodia Funèbre"><meta name="subject" content="Musique d’hommage composée par Melodia Funèbre">
  <style>${CSS}${extra || ''}</style></head><body>${corps}</body></html>`;
}

/* Le verso : la carte de Julie Serve, entière, dans une page de charte.
   170 mm de large sur 210 : 20 mm de marge de chaque côté. */
function versoCarte(opts) {
  const o = Object.assign({ titre: 'Julie Serve vous répond.', chapeau: 'Une question, une démonstration, un hommage à faire entendre : écrivez-lui.', n: '' }, opts);
  return `<section class="page verso"><div class="cadre"></div>
    <div class="dedans" style="padding:20mm 20mm 14mm;">
      <div class="tete"><p class="surtitre">Votre interlocutrice</p><p class="surtitre sourd">Composé par Melodia Funèbre</p></div>
      <div class="filet-or"></div>
      <h2 style="font-size:28pt;">${o.titre}</h2>
      <p class="lede" style="margin-top:4mm;max-width:140mm;">${o.chapeau}</p>
      <div style="margin-top:18mm;"><img class="carte-julie" alt="Carte de visite de Julie Serve, Directrice marketing et commerciale, ${COURRIEL_JULIE}" src="${img('carte-julie-serve.jpg')}"></div>
      <div class="contact-ligne" style="margin-top:16mm;">
        <div>
          <p class="surtitre" style="margin-bottom:2mm;">Julie Serve · Directrice marketing &amp; commerciale</p>
          <p style="font-size:12pt;color:#f4f1ea;"><a href="mailto:${COURRIEL_JULIE}">${COURRIEL_JULIE}</a></p>
          <p style="font-size:10pt;margin-top:1mm;"><a href="${SITE}">${SITE_COURT}</a></p>
        </div>
        <div class="qrs">
          <div>${qr('mailto:' + COURRIEL_JULIE, 22, 'QR code : écrire à Julie Serve')}<p class="qr-legende">Écrire</p></div>
          <div>${qr(SITE + '/professionnels', 22, 'QR code vers la page professionnels')}<p class="qr-legende">Le site</p></div>
        </div>
      </div>
      <div class="pied" style="display:flex;justify-content:space-between;border-top:.25mm solid rgba(201,168,76,.2);padding-top:4mm;">
        <span class="surtitre sourd" style="color:#6b5828;">Melodia Funèbre</span><span class="surtitre" style="color:#6b5828;">${o.n}</span>
      </div>
    </div></section>`;
}

module.exports = { enveloppe, versoCarte, qr, img, esc, disque, catalogue, SITE, SITE_COURT, COURRIEL_JULIE, image };
