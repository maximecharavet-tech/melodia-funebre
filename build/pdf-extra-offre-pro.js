/* MELODIA — Offre Pro (6 pages A4).
   Tout ce qui est écrit ici est déjà publié sur le site (professionnels, pro, qr-code-memorial) ou
   dans content.json / data.js : questionnaire famille en sept étapes, essai gratuit par agence,
   suivi des dossiers, page de souvenir (jusqu'à cinq photos), plaque QR (79 €), formules 149/299/499 €.
   Aucune interface n'est reproduite : la console est décrite, pas simulée. */
const { enveloppe, versoCarte, qr, img, esc, SITE, SITE_COURT } = require('./pdf-extra-commun.js');

const eur = n => String(n).replace('.', ',') + ' €';

function html(d) {
  const offres = d.offres;
  const opt = id => d.options.find(o => o.id === id) || {};
  const part = n => (Math.round(n * 0.6 * 100) / 100).toFixed(2);

  const couv = `<section class="page">
    <img class="plein" style="object-position:50% 30%" src="${img('plaque-qr.jpg')}" alt="Plaque funéraire gravée d’un QR code, entourée de fleurs et d’une bougie">
    <div class="degrade-bas" style="height:165mm;"></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm;">
      <p class="surtitre">L’offre Pro · Agences et professionnels du funéraire</p>
      <div class="filet-or"></div>
      <h1>De l’entretien <em>à la plaque,</em> tout est prêt.</h1>
      <p class="lede" style="margin-top:6mm;max-width:140mm;">Le questionnaire famille, la composition, le QR code, la plaque et la page de souvenir : l’offre professionnelle, expliquée simplement.</p>
      <p class="surtitre" style="margin-top:8mm;color:#8a7a46;">Composé par Melodia Funèbre · ${SITE_COURT}</p>
    </div>
    <p class="fine" style="position:absolute;right:12mm;top:12mm;color:#d8d0bd;text-shadow:0 0 3px #000;">Photographie illustrative</p></section>`;

  const blocs = [
    ['Le questionnaire', 'Sept étapes, remplies avec la famille ou à sa place, depuis la console. Cinq minutes d’entretien suffisent : un prénom, une vie, des manies.'],
    ['La composition', 'Paroles biographiques uniques, œuvre originale de deux à trois minutes, relecture humaine, livraison sous vingt-quatre heures. Composé par Melodia Funèbre.'],
    ['Le QR code', 'Un code qui ouvre la page de souvenir et lance l’œuvre. Un appareil photo suffit : aucune application à installer.'],
    ['La plaque', 'Le code tient dans quatre centimètres. Nous fournissons la page et le fichier de gravure ; votre agence ou votre marbrier réalise la plaque.'],
    ['Le mémorial', 'Une page de souvenir : son nom, ses dates, les mots de la famille et jusqu’à cinq photos. La famille la publie quand elle le décide.']
  ];
  const p2 = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">L’offre en un regard</p><p class="surtitre sourd">02</p></div><div class="filet-or"></div>
    <h2>Cinq éléments, <em>un seul parcours.</em></h2>
    <p style="margin-top:4mm;max-width:150mm;">Vous présentez, la famille raconte, nous produisons. Voici ce que contient l’offre, dans l’ordre où la famille le vit.</p>
    <div style="margin-top:9mm;display:grid;gap:0;">
      ${blocs.map(([t, x], i) => `<div style="display:flex;gap:8mm;padding:9.5mm 0;border-top:.25mm solid rgba(201,168,76,.3);align-items:baseline;">
        <span class="chiffre" style="font-family:var(--ff-d);font-size:30pt;color:#c9a84c;width:14mm;flex:none;">${i + 1}</span>
        <div><h3 style="font-size:18pt;margin-bottom:2mm;">${t}</h3><p style="font-size:10.2pt;max-width:140mm;">${x}</p></div></div>`).join('')}
    </div>
  </div></section>`;

  const p3 = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">La console des agences</p><p class="surtitre sourd">03</p></div><div class="filet-or"></div>
    <h2>Essayez seul, <em>avant de nous parler.</em></h2>
    <div style="display:flex;gap:10mm;margin-top:8mm;">
      <div style="flex:1;">
        <div style="display:grid;gap:5mm;">
          ${[['Le questionnaire famille', 'Sept étapes, remplies avec la famille ou à sa place.'],
             ['Un essai gratuit par agence', 'Un extrait composé de deux minutes trente, à faire écouter à une famille avant tout engagement.'],
             ['Le suivi de chaque dossier', 'Où en est l’œuvre, où en est la page de souvenir et son QR code.'],
             ['Votre logo', 'Sur les documents remis aux familles.']].map(([t, x]) => `<div class="carte2" style="padding:5mm;"><h3 style="font-size:14pt;">${t}</h3><p style="font-size:9pt;">${x}</p></div>`).join('')}
        </div>
      </div>
      <div style="width:56mm;flex:none;">
        <div class="cadre-photo" style="height:92mm;"><img style="object-position:40% 50%" src="${img('visuel-partition.jpg')}" alt="Partition ancienne ouverte"></div>
        <div style="margin-top:7mm;">${qr(SITE + '/pro', 36, 'QR code vers la console des agences')}<p class="qr-legende" style="text-align:left;">La démonstration</p></div>
      </div>
    </div>
    <h3 style="margin-top:12mm;font-size:17pt;">Pour commencer</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:5mm;">
      ${[['Voir la démonstration', 'Sans compte, avec des dossiers fictifs.'], ['Ouvrir le compte', 'Trois minutes ; la maison vérifie chaque compte d’agence.'], ['Faire l’essai gratuit', 'Un extrait de deux minutes trente, à faire écouter.']].map(([t, x], i) => `<div class="carte2" style="padding:5mm;"><span class="num">0${i + 1}</span><h3 style="font-size:13pt;margin:1.5mm 0;">${t}</h3><p style="font-size:8.8pt;">${x}</p></div>`).join('')}
    </div>
    <p class="fine" style="margin-top:10mm;">La démonstration est ouverte à tous, sans compte, avec des dossiers fictifs. Chaque compte d’agence est vérifié par la maison avant le premier essai. Accès : <a href="${SITE}/pro">${SITE_COURT}/pro</a></p>
  </div></section>`;

  const lignes = offres.map(o => `<tr><td style="padding:3.4mm 0;"><span class="surtitre" style="color:#c9a84c;">${esc(o.name)}</span><p style="font-size:8.6pt;line-height:1.5;margin-top:1mm;">${esc(o.desc)}</p></td>
      <td class="chiffre" style="text-align:right;font-family:var(--ff-d);font-size:20pt;color:#f4f1ea;">${eur(o.price)}</td>
      <td class="chiffre" style="text-align:right;font-family:var(--ff-d);font-size:20pt;color:#c9a84c;">${eur(part(o.price).replace('.', ','))}</td></tr>`).join('');
  const options = ['plaque', 'longue', 'rares', 'langue', 'urgence'].map(opt).filter(o => o.id);
  const p4 = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">Formules et options</p><p class="surtitre sourd">04</p></div><div class="filet-or"></div>
    <h2>Trois formules, <em>des options à la carte.</em></h2>
    <table style="width:100%;border-collapse:collapse;margin-top:8mm;">
      <thead><tr><th style="text-align:left;" class="surtitre">Formule</th><th style="text-align:right;" class="surtitre">Prix famille</th><th style="text-align:right;" class="surtitre">Part agence (60 %)</th></tr></thead>
      <tbody style="border-top:.25mm solid rgba(201,168,76,.3);">${lignes.replace(/<tr>/g, '<tr style="border-bottom:.25mm solid rgba(201,168,76,.18);">')}</tbody>
    </table>
    <p class="fine" style="margin-top:3mm;">La part de 60 % porte sur le montant payé par la famille ; elle est publiée pour les agences de pompes funèbres. Règlement mensuel, sur facture récapitulative. Aucun investissement, aucun stock, aucun minimum.</p>
    <h3 style="margin-top:10mm;font-size:17pt;">Les options</h3>
    <div style="margin-top:4mm;display:grid;grid-template-columns:1fr 1fr;gap:4mm;">
      ${options.map(o => `<div class="carte2" style="padding:4.4mm;"><div style="display:flex;justify-content:space-between;gap:4mm;"><h3 style="font-size:11.5pt;margin:0;">${esc(o.titre.replace(/ — .*$/, ''))}</h3><span class="chiffre" style="font-family:var(--ff-d);font-size:15pt;color:#c9a84c;">${eur(o.prix)}</span></div>${o.inclusDans ? `<p class="fine" style="margin-top:1.5mm;">Incluse dans ${esc(o.inclusDans.join(', '))}.</p>` : ''}</div>`).join('')}
    </div>
    <h3 style="margin-top:10mm;font-size:17pt;">Ce que comprend Prestige</h3>
    <ul style="margin-top:4mm;display:grid;grid-template-columns:1fr 1fr;gap:2.2mm 8mm;">
      ${((offres.find(o => o.id === 'prestige') || {}).feats || []).map(f => `<li style="font-size:9.2pt;color:#c4bba6;border-top:.25mm solid rgba(201,168,76,.2);padding-top:2mm;">${esc(f)}</li>`).join('')}
    </ul>
    <p class="fine" style="margin-top:6mm;">Prix publiés sur ${SITE_COURT}/offres. Chaque œuvre est originale et cédée avec ses droits d’usage à vie.</p>
  </div></section>`;

  const p5 = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">Plaque et mémorial</p><p class="surtitre sourd">05</p></div><div class="filet-or"></div>
    <h2>L’hommage ne s’arrête pas <em>à la cérémonie.</em></h2>
    <div style="display:flex;gap:10mm;margin-top:8mm;">
      <div class="cadre-photo" style="width:78mm;height:110mm;flex:none;"><img style="object-position:50% 50%" src="${img('visuel-bougies.jpg')}" alt="Bougies allumées dans un décor en vitrail"></div>
      <div>
        <div style="display:grid;gap:5mm;">
          ${[['01', 'La plaque', 'Gravée par votre marbrier, ou simplement posée.'], ['02', 'Le QR code', 'Scanné avec l’appareil photo du téléphone.'], ['03', 'La page de souvenir', 'Son nom, ses dates, les mots de la famille, jusqu’à cinq photos.'], ['04', 'Sa musique', 'L’œuvre se lance : celle qui a été écrite pour lui, et pour personne d’autre.']].map(([n, t, x]) => `<div><span class="num">${n}</span><h3 style="font-size:15pt;margin:1mm 0;">${t}</h3><p style="font-size:9pt;">${x}</p></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="carte2" style="margin-top:10mm;display:flex;gap:8mm;align-items:center;">
      ${qr(SITE + '/m/demo', 34, 'QR code vers une page de souvenir de démonstration')}
      <div><h3>Essayez maintenant</h3><p>Scannez ce code : vous arriverez sur une page de souvenir de démonstration, telle qu’une famille la publie. L’appareil photo suffit.</p>
        <p style="margin-top:2mm;"><a href="${SITE}/m/demo">${SITE_COURT}/m/demo</a> · <a href="${SITE}/qr-code-memorial">${SITE_COURT}/qr-code-memorial</a></p></div>
    </div>
    <div class="cadre-photo" style="height:52mm;margin-top:9mm;"><img style="object-position:50% 45%" src="${img('visuel-colombe-detail.jpg')}" alt="Colombe en vitrail"></div>
  </div></section>`;

  return enveloppe('Melodia Funèbre — Offre Pro',
    couv + p2 + p3 + p4 + p5 + versoCarte({ titre: 'Ouvrons votre compte.', chapeau: 'Une démonstration, un essai gratuit, une question sur l’offre Pro : Julie Serve vous répond.', n: '06' }));
}
module.exports = { html, fichier: 'melodia-offre-pro.pdf' };
