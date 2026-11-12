/* MELODIA — Fiche contact Julie Serve (2 pages A4).
   Page 1 : la carte officielle, entière, 170 mm de large. Page 2 : pour aller plus loin
   (trois QR réels). Aucun numéro de téléphone : il n'y en a pas de publié. */
const { enveloppe, qr, img, SITE, SITE_COURT, COURRIEL_JULIE } = require('./pdf-extra-commun.js');

function html() {
  const p1 = `<section class="page"><div class="cadre"></div>
    <div class="dedans" style="padding:20mm 20mm 14mm;">
      <div class="tete"><p class="surtitre">Fiche contact</p><p class="surtitre sourd">Composé par Melodia Funèbre</p></div>
      <div class="filet-or"></div>
      <h1 style="font-size:44pt;">Julie <em>Serve</em></h1>
      <p class="lede" style="margin-top:3mm;">Directrice marketing &amp; commerciale</p>
      <div style="margin-top:16mm;"><img class="carte-julie" style="display:block;width:170mm;border:.3mm solid rgba(201,168,76,.55);" alt="Carte de visite de Julie Serve, Directrice marketing et commerciale, ${COURRIEL_JULIE}" src="${img('carte-julie-serve.jpg')}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:16mm;">
        <div><p class="surtitre" style="margin-bottom:2mm;">Écrire</p>
          <p style="font-size:13pt;color:#f4f1ea;"><a href="mailto:${COURRIEL_JULIE}">${COURRIEL_JULIE}</a></p></div>
        <div><p class="surtitre" style="margin-bottom:2mm;">Le site</p>
          <p style="font-size:13pt;color:#f4f1ea;"><a href="${SITE}">${SITE_COURT}</a></p></div>
      </div>
      <p style="margin-top:8mm;max-width:150mm;">Julie présente Melodia Funèbre aux agences et aux professionnels du funéraire : stratégie de marque, développement commercial, relation avec les familles et les partenaires.</p>
      <div class="pied" style="display:flex;justify-content:space-between;border-top:.25mm solid rgba(201,168,76,.2);padding-top:4mm;">
        <span class="surtitre" style="color:#6b5828;">Melodia Funèbre</span><span class="surtitre" style="color:#6b5828;">01 / 02</span></div>
    </div></section>`;

  const lien = (t, d, u, etiquette) => `<div class="carte2" style="display:flex;gap:7mm;align-items:center;">
      ${qr(u, 30, 'QR code : ' + t)}
      <div><h3>${t}</h3><p>${d}</p><p style="margin-top:2mm;"><a href="${u}">${u.replace(/^https?:\/\//, '').replace(/^mailto:/, '')}</a></p></div></div>`;

  const p2 = `<section class="page"><div class="cadre"></div>
    <div class="dedans" style="padding:16mm 20mm 14mm;position:relative;">
      <div class="tete"><p class="surtitre">Pour aller plus loin</p><p class="surtitre sourd">Composé par Melodia Funèbre</p></div>
      <div class="filet-or"></div>
      <div class="cadre-photo" style="height:62mm;"><img style="object-position:50% 45%" src="${img('visuel-colombe-detail.jpg')}" alt=""></div>
      <h2 style="margin-top:10mm;">Trois façons de <em>commencer.</em></h2>
      <div class="filet-or"></div>
      <div style="display:grid;gap:5mm;">
        ${lien('Écouter les hommages', 'Les musiques déjà publiées sur le site, composées par Melodia Funèbre. Un clic, ou un scan.', SITE + '/ecouter')}
        ${lien('Devenir partenaire', 'La présentation pour les agences, avec le simulateur et la démonstration de vingt minutes.', SITE + '/professionnels')}
        ${lien('Écrire à Julie', 'Pour une démonstration, un document à recevoir, ou une question sur l’offre.', 'mailto:' + COURRIEL_JULIE)}
      </div>
      <div class="pied" style="display:flex;justify-content:space-between;border-top:.25mm solid rgba(201,168,76,.2);padding-top:4mm;">
        <span class="surtitre" style="color:#6b5828;">Melodia Funèbre</span><span class="surtitre" style="color:#6b5828;">02 / 02</span></div>
    </div></section>`;
  return enveloppe('Melodia Funèbre — Fiche contact Julie Serve', p1 + p2);
}
module.exports = { html, fichier: 'melodia-fiche-contact-julie-serve.pdf' };
