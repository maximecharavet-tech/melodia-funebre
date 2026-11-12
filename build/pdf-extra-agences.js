/* MELODIA — Présentation agences partenaires (6 pages A4).
   Pompes funèbres, crématoriums, marbriers, officiants. Les chiffres (149 / 299 / 499 €, 60 %,
   24 h, 5 min, 79 €) viennent du site et de content.json ; rien n'est inventé. */
const { enveloppe, versoCarte, qr, img, esc, disque, catalogue, SITE, SITE_COURT } = require('./pdf-extra-commun.js');

const eur = n => String(n).replace('.', ',') + ' €';

function html(d) {
  const offres = d.offres;
  const prestige = offres.find(o => o.id === 'prestige') || { price: 299 };
  const net = Math.round(prestige.price * 0.6 * 100) / 100;

  const couv = `<section class="page">
    <img class="plein" src="${img('visuel-colombe-vitrail.jpg')}" alt="Colombe, lys et bougies en vitrail — Melodia Funèbre">
    <div class="degrade-bas"></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm;">
      <p class="surtitre">Dossier de présentation · Agences partenaires</p>
      <div class="filet-or"></div>
      <h1>Offrir aux familles la musique <em>qui leur ressemble.</em></h1>
      <p class="lede" style="margin-top:6mm;max-width:140mm;">Pour les pompes funèbres, les crématoriums, les marbriers et les officiants : une œuvre composée pour leur défunt, présentée par vous, produite par nous.</p>
      <p class="surtitre" style="margin-top:8mm;color:#8a7a46;">Composé par Melodia Funèbre · ${SITE_COURT}</p>
    </div></section>`;

  const etapesFamille = [
    ['Cinq minutes d’entretien', 'La famille raconte : un prénom, un métier, des manies, ce qu’il aurait voulu entendre. Vous menez l’entretien, ou nous le menons en votre nom.'],
    ['Des paroles uniques', 'Les mots viennent de cette vie-là, pas d’un catalogue. Une relecture humaine précède toute livraison.'],
    ['Une œuvre en vingt-quatre heures', 'Composée par Melodia Funèbre, de deux à trois minutes, livrée avant la cérémonie. Une livraison sous six heures existe pour les urgences.'],
    ['Après la cérémonie', 'Une page de souvenir et son QR code, que la famille publie quand elle le décide : l’œuvre se rejoue des années plus tard.']
  ];
  const p2 = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">Ce que vit la famille</p><p class="surtitre sourd">02</p></div><div class="filet-or"></div>
    <div style="display:flex;gap:11mm;">
      <div style="flex:1;">
        <h2>Le seul moment de la cérémonie <em>qu’elle n’avait pas pu rendre personnel.</em></h2>
        <p style="margin-top:6mm;">Aux obsèques, la musique n’a presque jamais connu le défunt. Ici, la salle entend son prénom, son métier, ses manies. C’est ce dont on se souvient — et ce qui fait recommander l’agence qui l’a rendu possible.</p>
        <div style="margin-top:8mm;display:grid;gap:5mm;">
          ${etapesFamille.map(([t, x], i) => `<div style="display:flex;gap:5mm;"><span class="num" style="padding-top:1.6mm;">0${i + 1}</span><div><h3 style="font-size:14pt;margin-bottom:1mm;">${t}</h3><p style="font-size:9pt;line-height:1.62;">${x}</p></div></div>`).join('')}
        </div>
        <div class="carte2" style="margin-top:9mm;border-left:.6mm solid #c9a84c;">
          <h3>Pour votre agence</h3>
          <p>Trois agences se partagent la même ville et le même catalogue. Celle qui fait entendre une chanson écrite pour le défunt devient celle qu’on recommande. Vous présentez, nous produisons : entretien, écriture, composition, mixage, relecture, livraison.</p>
        </div>
      </div>
      <div class="cadre-photo" style="width:62mm;height:215mm;flex:none;margin-top:2mm;"><img style="object-position:46% 50%" src="${img('visuel-violon-detail.jpg')}" alt="Violoniste, bougie et portrait de famille posés dans la mousse"></div>
    </div>
    <div class="pied" style="display:flex;justify-content:space-between;border-top:.25mm solid rgba(201,168,76,.2);padding-top:4mm;"><span class="surtitre" style="color:#6b5828;">Melodia Funèbre</span><span class="surtitre" style="color:#6b5828;">composé par Melodia Funèbre</span></div>
  </div></section>`;

  const metiers = [
    ['Pompes funèbres', 'Vous présentez l’hommage au rendez-vous d’organisation : trente secondes, puis vous faites écouter. La famille décide, vous restez son interlocuteur.'],
    ['Crématoriums', 'La musique de la crémation, écrite pour la personne plutôt que choisie dans une liste. Chaque œuvre a sa page d’écoute, qui s’ouvre d’un clic.'],
    ['Marbriers', 'Le QR code se grave : la plaque ouvre la page de souvenir et l’œuvre. Nous fournissons la page et le fichier de gravure ; vous réalisez la plaque.'],
    ['Officiants', 'Pour une cérémonie civile ou religieuse, une œuvre qui porte les mots de la famille : vous la présentez, la salle l’entend.']
  ];
  const p3 = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">Pour chaque métier</p><p class="surtitre sourd">03</p></div><div class="filet-or"></div>
    <h2>Quatre métiers, <em>une même attention.</em></h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:9mm;">
      ${metiers.map(([t, x], i) => `<div class="carte2" style="min-height:52mm;"><p class="num" style="margin-bottom:2mm;">0${i + 1}</p><h3>${t}</h3><p>${x}</p></div>`).join('')}
    </div>
    <div class="cadre-photo" style="height:100mm;margin-top:9mm;"><img style="object-position:50% 60%" src="${img('visuel-fleurs.jpg')}" alt="Composition florale blanche"></div>
    <p class="fine" style="margin-top:5mm;">Les conditions de partenariat détaillées plus loin sont celles publiées pour les agences de pompes funèbres. Pour les crématoriums, marbriers et officiants, les modalités se précisent avec Julie Serve (dernière page).</p>
  </div></section>`;

  const six = [
    ['Vous créez votre compte', 'Trois minutes, aucune pièce justificative à ce stade.'],
    ['Vous recevez le kit', 'Brochure, argumentaire court et hommages de démonstration à faire écouter en rendez-vous.'],
    ['Un essai gratuit', 'Un extrait composé de deux minutes trente, à présenter avant tout engagement.'],
    ['Vous présentez', '« Nous pouvons faire composer une chanson originale pour lui, livrée avant la cérémonie. »'],
    ['Vous saisissez le brief', 'Cinq questions, trois minutes — ou vous nous passez le contact.'],
    ['Facture mensuelle', 'Vous conservez 60 %, nous facturons les 40 % restants.']
  ];
  const p4 = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">Le partenariat</p><p class="surtitre sourd">04</p></div><div class="filet-or"></div>
    <h2>Vingt minutes pour démarrer. <em>Rien à signer</em> avant la première œuvre.</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm 7mm;margin-top:9mm;">
      ${six.map(([t, x], i) => `<div style="display:flex;gap:4mm;border-top:.25mm solid rgba(201,168,76,.3);padding-top:4mm;"><span class="num">0${i + 1}</span><div><h3 style="font-size:13.5pt;margin-bottom:1mm;">${t}</h3><p style="font-size:8.8pt;line-height:1.6;">${x}</p></div></div>`).join('')}
    </div>
    <div class="carte2" style="margin-top:10mm;display:flex;gap:8mm;align-items:center;border-left:.6mm solid #c9a84c;">
      <div style="font-family:var(--ff-d);font-size:44pt;color:#c9a84c;line-height:1;" class="chiffre">60&nbsp;%</div>
      <p style="font-size:9.6pt;">du montant payé par la famille reste à l’agence : <strong class="ivoire">${eur(net.toFixed(2))}</strong> sur une offre Prestige à ${eur(prestige.price)}. Aucun investissement, aucun stock, aucun minimum, aucun engagement de durée.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:8mm;">
      ${offres.map(o => `<div class="carte2" style="text-align:center;padding:5mm 3mm;"><p class="surtitre" style="color:#c9a84c;">${esc(o.name)}</p><div class="chiffre" style="font-family:var(--ff-d);font-size:26pt;color:#f4f1ea;margin-top:2mm;">${eur(o.price)}</div></div>`).join('')}
    </div>
    <p class="fine" style="margin-top:4mm;">Prix publiés sur ${SITE_COURT}. Le règlement se fait mensuellement, sur facture récapitulative. Chaque œuvre est originale, cédée avec ses droits d’usage ; aucune démarche SACEM n’est nécessaire.</p>
    <div class="cadre-photo" style="height:52mm;margin-top:8mm;"><img style="object-position:50% 55%" src="${img('visuel-partition.jpg')}" alt="Partition ancienne ouverte dans la mousse"></div>
  </div></section>`;

  const choix = ['Le roi de la route', 'Constantine dans ton cœur', 'Jusqu’au jour où l’on se retrouve', 'Sous le lierre'];
  const cat = catalogue();
  const trois = choix.map(t => cat.find(c => c.titre.replace(/['’]/g, '') === t.replace(/['’]/g, ''))).filter(Boolean);
  const p5 = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">À faire entendre</p><p class="surtitre sourd">05</p></div><div class="filet-or"></div>
    <h2>Écoutez, <em>puis décidez.</em></h2>
    <p style="margin-top:4mm;max-width:150mm;">${trois.length === 4 ? 'Quatre' : 'Trois'} des ${cat.length} musiques déjà publiées sur le site, chacune composée par Melodia Funèbre. À faire écouter en rendez-vous, d’un clic ou d’un scan.</p>
    <div style="display:grid;gap:6mm;margin-top:9mm;">
      ${trois.map(m => `<div class="carte2" style="display:flex;gap:7mm;align-items:center;">
        ${disque((m.qui || m.titre).trim().charAt(0).toUpperCase(), 124)}
        <div style="flex:1;"><h3 style="font-size:16pt;">${esc(m.titre)}</h3><p style="font-size:9pt;">${esc(m.qui)}</p><p class="surtitre" style="margin-top:2mm;">${esc(m.style)}</p><p style="margin-top:2mm;font-size:8.4pt;"><a href="${esc(m.url)}">${esc(m.url.replace('https://', ''))}</a></p></div>
        ${qr(m.url, 28, 'QR code vers la page d’écoute de ' + m.titre)}</div>`).join('')}
    </div>
    <p class="fine" style="margin-top:6mm;">Toutes les pages d’écoute : <a href="${SITE}/ecouter">${SITE_COURT}/ecouter</a></p>
  </div></section>`;

  return enveloppe('Melodia Funèbre — Présentation agences partenaires',
    couv + p2 + p3 + p4 + p5 + versoCarte({ titre: 'Parlons de votre agence.', chapeau: 'Une démonstration de vingt minutes, la disponibilité de votre secteur, les modalités pour votre métier : Julie Serve vous répond.', n: '06' }));
}
module.exports = { html, fichier: 'melodia-presentation-agences-partenaires.pdf' };
