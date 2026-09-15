/* Blocs réutilisables entre pages */
const fs = require('fs');
const path = require('path');
const { ICON, SITE, SOCIAL } = require('./gen.js');
const { OFFERS, TESTIS, FAQ, STYLES, TRACKS } = require('./data.js');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Grille tarifaire — `mode` : 'link' (va vers offres) ou 'order' (ouvre le tunnel) */
function pricing(mode) {
  return OFFERS.map((o, i) => {
    const action = mode === 'order'
      ? `<button class="btn ${o.featured ? 'btn-gold' : 'btn-outline'} btn-block" onclick="openOrder('${o.name}')">Choisir ${o.name}</button>`
      : `<a href="/offres" class="btn ${o.featured ? 'btn-gold' : 'btn-outline'} btn-block">Choisir ${o.name}</a>`;
    const oid = o.name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
    return `        <div class="card price card-lift${o.featured ? ' featured' : ''} reveal" data-offer-id="${oid}">
          <span class="price-tag"${o.tag ? '' : ' style="display:none"'}>${o.tag || ''}</span>
          <div class="price-name">${o.name}</div>
          <div class="price-amount">${o.price}<span>€</span></div>
          <div class="price-note">TVA non applicable · art. 293 B du CGI</div>
          <p class="price-desc">${o.desc}</p>
          <ul>
${o.feats.map(f => `            <li>${f}</li>`).join('\n')}
${(o.muted || []).map(f => `            <li class="muted">${f}</li>`).join('\n')}
          </ul>
          ${action}
        </div>`;
  }).join('\n');
}

/* Les tableaux comparatifs défilent horizontalement sur petit écran :
   sans indication, le visiteur ne devine pas qu'il manque des colonnes. */
function scrollHint() {
  return '<p class="scroll-hint" aria-hidden="true">Faites glisser le tableau pour voir toutes les colonnes</p>';
}

function faq(items, hydratable) {
  const contenu = (items || FAQ).map(f => `      <div class="faq-item">
        <button class="faq-q" type="button">${esc(f.q)}</button>
        <div class="faq-a"><div class="faq-a-inner">${esc(f.a)}</div></div>
      </div>`).join('\n');
  /* Un identifiant permet à la couche de contenu de remplacer la liste */
  return hydratable ? `      <div id="faq-list">\n${contenu}\n      </div>` : contenu;
}

function testimonials() {
  return `      <div class="carousel">
        <div class="carousel-track">
${TESTIS.map(t => `          <div class="carousel-slide">
            <div class="card testi">
              <div class="testi-stars" aria-label="5 étoiles sur 5">★★★★★</div>
              <p class="testi-text">« ${esc(t.t)} »</p>
              <div class="testi-who">${esc(t.w)}</div>
            </div>
          </div>`).join('\n')}
        </div>
        <div class="carousel-nav">
          <button class="carousel-arrow carousel-prev" type="button" aria-label="Témoignage précédent">${ICON.arrowL}</button>
          <div class="carousel-dots" role="tablist"></div>
          <button class="carousel-arrow carousel-next" type="button" aria-label="Témoignage suivant">${ICON.arrowR}</button>
        </div>
      </div>`;
}

function trustStrip(light) {
  const items = [
    [ICON.clock, 'Livré en 24 heures'],
    [ICON.shield, 'Zéro droit SACEM'],
    [ICON.lock, 'Paiement sécurisé'],
    [ICON.heart, 'Révision jusqu\'à satisfaction']
  ];
  return `<div class="trust-strip">
${items.map(([ic, l]) => `        <div class="trust-item">${ic}<span>${l}</span></div>`).join('\n')}
      </div>`;
}

function marquee() {
  return `<div class="marquee" aria-hidden="true">
  <div class="marquee-track">
${STYLES.map(s => `    <span class="marquee-item">${s}</span>`).join('\n')}
  </div>
</div>`;
}

/* ═══ Catalogue des réalisations ═══
   Rendu ici en HTML pour deux raisons : Google lit le récit de chaque
   personne, et le catalogue reste lisible si le JavaScript ne charge
   pas. catalogue.js reprend ensuite ces fiches pour l'écoute, et les
   remonte quand le propriétaire ajoute une musique depuis sa console. */
/* Les libellés changent avec la nature de l'œuvre. Un hommage est
   composé POUR un défunt, d'après les mots de sa famille ; un message
   de son vivant est composé PAR quelqu'un, d'après ce qu'il a demandé
   lui-même. Employer les mêmes mots pour les deux ferait dire au site
   une chose fausse sur la moitié de son catalogue. */
const REGISTRES = {
  /* 1 · L'hommage — composé SUR quelqu'un, après sa mort, d'après ce
     que sa famille raconte de lui. */
  hommage: {
    qui: 'Pour',
    brief: 'Les mots de la famille',
    partage: 'Partager cet hommage',
    mention: 'Chaque œuvre a bien été composée pour une personne. Les prénoms et les ' +
             'récits qui les accompagnent ont été modifiés : nous ne publions jamais ' +
             'l’histoire d’une famille.'
  },
  /* 2 · L'œuvre offerte — composée POUR quelqu'un qui est encore là,
     d'après ce que sa famille raconte. Les mots sont donc ceux de la
     famille, exactement comme pour un hommage : seul le moment change.
     C'est le cas de Ruth, et confondre ce registre avec le suivant
     ferait dire au site qu'elle a commandé sa propre chanson. */
  vivant: {
    qui: 'Pour',
    brief: 'Les mots de la famille',
    partage: 'Partager cette œuvre',
    mention: 'Ces œuvres ont été offertes à des personnes bien vivantes, qui les ont ' +
             'écoutées. Les prénoms et les récits ont été modifiés, comme pour le reste ' +
             'du catalogue.'
  },
  /* 3 · Le message laissé — composé PAR quelqu'un, de son vivant, pour
     être entendu par ses proches le jour venu. Les mots sont les siens. */
  message: {
    qui: 'De',
    brief: 'Ce qu’il nous a demandé',
    partage: 'Partager ce message',
    mention: 'Ces œuvres ont été commandées par les personnes elles-mêmes, de leur ' +
             'vivant, pour être entendues plus tard par leurs proches. Les prénoms et ' +
             'les récits ont été modifiés, comme pour le reste du catalogue.'
  }
};

/* « categorie » filtre la grille ; sans elle, tout le catalogue. */
function oeuvres(categorie) {
  const R = REGISTRES[categorie] || REGISTRES.hommage;
  const liste = categorie ? TRACKS.filter((t) => (t.categorie || 'hommage') === categorie) : TRACKS;
  if (!liste.length) return '';
  /* L'adresse de chaque œuvre est calculée au même endroit que celle
     des pages d'écoute : voir build/adresses.js. */
  /* Les adresses sont calculées sur le catalogue ENTIER, jamais sur la
     grille filtrée : deux œuvres homonymes se distinguent par un
     suffixe, et ce suffixe doit être le même ici que sur la page
     d'écoute, sinon le lien mène nulle part. */
  const tousSlugs = require('./adresses.js').adresses(TRACKS);
  const slugs = liste.map((t) => tousSlugs[TRACKS.indexOf(t)]);
  const barres = Array.from({ length: 20 },
    (_, b) => `<span style="animation-delay:${(b * 0.07).toFixed(2)}s"></span>`).join('');

  const fiches = liste.map((t, i) => {
    const initiale = (t.who || t.title || '♪').trim().charAt(0).toUpperCase();
    const lieu = t.lieu ? ` · ${esc(t.lieu)}` : '';
    return `        <article class="oeuvre reveal" data-oeuvre="${i}" data-style="${esc(t.style)}">
          <div class="oeuvre-haut">
            ${t.photo
              ? `<div class="oeuvre-sceau oeuvre-sceau-photo" aria-hidden="true"><img src="${esc(t.photo)}" alt="" loading="lazy" decoding="async" width="120" height="120"><span>${esc(initiale)}</span></div>`
              : `<div class="oeuvre-sceau" aria-hidden="true"><span>${esc(initiale)}</span></div>`}
            <button type="button" class="oeuvre-lire" data-lire="${i}" aria-label="Écouter ${esc(t.title)}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
            <div class="oeuvre-onde" aria-hidden="true">${barres}</div>
            <span class="oeuvre-duree" data-duree>—:—</span>
          </div>
          <div class="oeuvre-corps">
            <div class="oeuvre-style">${esc(t.style)}${lieu}</div>
${t.mention ? `            <div class="oeuvre-mention">${esc(t.mention)}</div>\n` : ''}
            <h3 class="oeuvre-titre"><em>${esc(t.title)}</em></h3>
            <div class="oeuvre-qui">${R.qui} ${esc(t.who)}</div>
            <div class="oeuvre-liens">
              <button type="button" class="oeuvre-plus" data-plus aria-expanded="false" aria-controls="oe-detail-${i}"><span data-plus-libelle>Son histoire</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
              <!-- La page de l'œuvre : c'est elle qu'on partage. Un lien
                   vers le catalogue entier ne dit pas ce qu'on va entendre. -->
              <a class="oeuvre-partager" href="/ecouter/${esc(slugs[i])}" aria-label="Page de « ${esc(t.title)} », à partager"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.4 13.4l7.2 4.2M15.6 6.4l-7.2 4.2"/></svg><span>Partager</span></a>
            </div>
            <div class="oeuvre-detail" id="oe-detail-${i}">
              <p class="oeuvre-recit">${esc(t.story)}</p>
${t.lyrics ? `              <blockquote class="oeuvre-vers">${esc(t.lyrics)}</blockquote>\n` : ''}              <div class="oeuvre-brief">
                <span class="mono">${esc(R.brief)}</span>
                <em>${String(t.brief).split('·').map(m => m.trim()).filter(Boolean)
                       .map(m => `<span class="oeuvre-mot">${esc(m)}</span>`).join('')}</em>
              </div>
            </div>
          </div>
          <div class="oeuvre-jauge" aria-hidden="true"><span></span></div>
        </article>`;
  }).join('\n');

  /* Les mêmes données en JSON : catalogue.js s'en sert pour filtrer et
     enchaîner sans avoir à relire le HTML. */
  const donnees = liste.map(t => ({
    id: t.id, title: t.title, who: t.who, lieu: t.lieu,
    style: t.style, audio: t.file, story: t.story,
    lyrics: t.lyrics, brief: t.brief, photo: t.photo || '', mention: t.mention || '',
    /* La platine remplace la grille : sans ce champ, elle écrirait
       « Pour X » et « Les mots de la famille » sur un message que la
       personne a commandé elle-même. */
    categorie: t.categorie || 'hommage',
    page: '/ecouter/' + slugs[liste.indexOf(t)]
  }));

  /* Mention du catalogue — posée par le gabarit, donc impossible à
     oublier sur l'une des pages où le catalogue apparaît.

     Deux choses y sont dites, et toutes deux disent ce qui est.

     La discrétion d'abord : les œuvres sont réelles, mais les prénoms
     et les récits qui les accompagnent ont été modifiés. C'est un
     choix de la maison — on ne publie pas l'histoire d'une famille en
     deuil. Ne pas l'écrire laisserait croire à un conseiller funéraire
     qu'il lit de vrais dossiers ; l'écrire en fait au contraire un
     argument, puisque la discrétion est la première chose qu'on
     attend du métier.

     Les portraits ensuite, et seulement si une fiche en porte : ces
     visages sont des illustrations. Laisser croire qu'on regarde la
     photographie d'un défunt réel serait une tromperie sur ce que la
     maison a effectivement fait.

     Les deux lignes coûtent peu et mettent le catalogue à l'abri. */
  const avecPortrait = liste.some(t => t.photo);
  const mention = `\n      <p class="catalogue-mention center">${R.mention}${
    avecPortrait ? " Les portraits sont des illustrations — une famille nous confie des mots, pas toujours un visage." : ''
  }</p>`;

  return `      <div class="catalogue" data-catalogue>
${fiches}
      </div>${mention}
      <script type="application/json" id="oeuvres-data">${JSON.stringify(donnees).replace(/</g, '\\u003c')}</script>`;
}

/* Bandeau de la vitrine : ce qu'elle contient, et l'écoute intégrale.
   Le compte et les filtres sont remplis par catalogue.js d'après le
   contenu publié — ils suivent donc les ajouts faits en console. */
function vitrineBarre() {
  return `      <div class="cat-barre reveal">
        <p class="cat-compte"><span data-catalogue-libelle>${TRACKS.filter((t) => (t.categorie || 'hommage') === 'hommage').length} hommages</span> composés à ce jour</p>
        <button type="button" class="btn btn-gold" data-tout-ecouter>
          <span class="cat-eq" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span data-libelle>Tout écouter</span>
        </button>
      </div>
      <div class="cat-filtres" data-catalogue-filtres role="group" aria-label="Filtrer par registre musical" hidden></div>`;
}

/* ═══ LA CHAÎNE DU SOUVENIR ═══
   Le QR code était une option de 79 € citée en passant. C'est
   pourtant la seule chose que fait Melodia que personne d'autre ne
   fait : la musique continue après la cérémonie.

   La section le montre plutôt que de le dire — plaque, code, page,
   musique — et le QR qui y figure est un vrai QR, encodé à la
   fabrication et pointant vers la page de démonstration. Un visiteur
   sort son téléphone, le scanne, et se trouve devant le produit fini.
   C'est une démonstration qu'aucune capture d'écran ne remplace. */
const MAILLONS = [
  ['La plaque', 'Gravée par votre marbrier, ou simplement posée. Le code tient dans quatre centimètres.',
   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>'],
  ['Le QR code', 'Scanné avec l’appareil photo du téléphone. Aucune application à installer.',
   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14h1M20 20h1M14 20h3"/></svg>'],
  ['La page de souvenir', 'Son nom, ses dates, les mots de la famille et jusqu’à cinq photos.',
   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 13h6M7 16h9"/></svg>'],
  ['Sa musique', 'L’œuvre se lance. Celle qui a été écrite pour lui, et pour personne d’autre.',
   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>']
];

function chaineQR(options) {
  options = options || {};
  /* Le QR est encodé ici, à la génération : la page n'a aucun script à
     charger pour l'afficher, et il reste lisible si le JavaScript ne
     s'exécute pas. */
  let qr = '';
  try {
    const faux = {};
    new Function('window', fs.readFileSync(path.join(__dirname, '..', 'assets/js/qr.js'), 'utf8'))(faux);
    qr = faux.MelodiaQR.svg(SITE + '/m/demo', {
      niveau: 'H', marge: 2, fond: '#ffffff', encre: '#0b0b11',
      titre: 'QR code de démonstration Melodia Funèbre'
    });
  } catch (e) {
    /* Un catch muet avait déjà caché une erreur : « fs » n'était pas
       importé, le QR sortait vide, et rien ne le disait. */
    console.error('  ATTENTION le QR de démonstration n’a pas pu être encodé — ' + e.message);
    qr = '';
  }

  return `  <section class="section${options.clair ? ' section-light' : ''} chaine" id="qr-memorial">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Le code mémoriel</div>
        <h2 class="h-xl">L’hommage ne s’arrête pas<br><em>à la cérémonie.</em></h2>
        <p class="lead" style="margin:1.6rem auto 0;max-width:62ch;">Un QR code permet à la famille de
        retrouver la musique, les souvenirs et la page hommage — des années plus tard.</p>
      </div>

      <ol class="chaine-fil">
        ${MAILLONS.map(([t, d, ico], i) => `<li class="chaine-maillon reveal" style="--d:${i * 0.08}s">
          <span class="chaine-ico" aria-hidden="true">${ico}</span>
          <span class="chaine-n">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="chaine-t">${t}</h3>
          <p class="chaine-d">${d}</p>
        </li>`).join('\n        ')}
      </ol>

      ${qr ? `<div class="chaine-preuve reveal">
        <div class="chaine-qr">${qr}</div>
        <div class="chaine-dit">
          <div class="eyebrow">Essayez maintenant</div>
          <h3 class="h-lg">Scannez ce code avec votre téléphone.</h3>
          <p>Vous arriverez sur une vraie page de souvenir, telle qu’une famille la publie.
          Aucune application, aucun compte : l’appareil photo suffit.</p>
          <div class="chaine-actions">
            <a href="/m/demo" class="btn btn-outline">Ou ouvrez-la ici</a>
            <a href="/qr-code-memorial" class="btn btn-ghost">Comment ça se grave</a>
          </div>
        </div>
      </div>` : ''}
    </div>
  </section>`;
}

/* Bandeau urgence — le chemin le plus rentable du site */
function urgency() {
  return `  <section class="section-sm" style="background:linear-gradient(90deg, rgba(248,113,113,.05), transparent);border-block:1px solid var(--line-soft);">
    <div class="wrap">
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1.2rem;text-align:center;">
        <span class="badge badge-urgent">Cérémonie imminente</span>
        <p style="color:var(--bone);font-size:.95rem;margin:0;">Obsèques dans moins de 72 heures ? Nous composons en priorité, livraison possible en 6 heures.</p>
        <button type="button" class="btn btn-gold btn-sm" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
    </div>
  </section>`;
}

/* ─── L'entité « maison » ───
   Déclarée en Organization, et non en LocalBusiness : ce dernier type
   attend une adresse postale (« address », obligatoire pour Google) et
   décrit un commerce où l'on se rend. La maison travaille par
   téléphone pour toute la France, n'a pas de boutique où recevoir, et
   son adresse de siège n'est pas encore arrêtée. Un LocalBusiness sans
   adresse est signalé invalide par l'outil de test de Google et ne
   produit aucun résultat enrichi — Organization en produit un, et dit
   la vérité.

   Le jour où le siège est déclaré, deux ajouts suffisent : « address »
   (PostalAddress complet) et le retour au type LocalBusiness, avec
   « priceRange » qui n'a de sens que sur ce type-là. */
const jsonldOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': SITE + '/#organisation',
  name: 'Melodia Funèbre',
  alternateName: 'Melodia',
  description: "Maison française de composition musicale personnalisée pour cérémonies funéraires. Une œuvre originale par défunt, livrée en 24 heures, sans droits SACEM.",
  url: SITE,
  /* Pas de « telephone » : ces données sont publiques et indexées. */
  email: 'contact@melodia-funebre.fr',
  image: SITE + '/assets/img/logo-melodia.jpg',
  logo: { '@type': 'ImageObject', url: SITE + '/assets/img/logo-melodia.jpg' },
  founder: { '@type': 'Person', name: 'Maxime Charavet' },
  /* « sameAs » relie la fiche de la maison à ses comptes publics :
     c'est ce qui permet à Google de comprendre que la page Facebook et
     le compte Instagram appartiennent bien à cette organisation, et
     non à une homonyme. */
  sameAs: [SOCIAL.facebook, SOCIAL.instagram],
  foundingDate: '2026',
  areaServed: { '@type': 'Country', name: 'France' },
  knowsLanguage: ['fr', 'co', 'br', 'he', 'it', 'pt'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'contact@melodia-funebre.fr',
    areaServed: 'FR',
    availableLanguage: 'French'
  }
  /* « sameAs » viendra lister les comptes officiels (Instagram,
     Facebook, LinkedIn) dès qu'ils existeront : c'est ce qui permet
     aux moteurs de rattacher ces profils à cette entité plutôt que
     d'en déduire deux entreprises distinctes. */
};

const jsonldFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({
    '@type': 'Question', name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a }
  }))
};

const jsonldService = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Composition musicale personnalisée pour cérémonie funéraire',
  provider: { '@id': SITE + '/#organisation' },
  areaServed: { '@type': 'Country', name: 'France' },
  offers: OFFERS.map(o => ({
    '@type': 'Offer', name: o.name, price: String(o.price), priceCurrency: 'EUR',
    description: o.desc, availability: 'https://schema.org/InStock', url: SITE + '/offres'
  }))
};

/* ═══════════════════════════════════════════════════════════════
   DONNÉES STRUCTURÉES

   Le service est nouveau : sa catégorie n'a pas de nom établi, et
   personne ne la cherche encore par son nom. Ce qui se cherche, ce
   sont les questions — « peut-on faire composer une chanson pour des
   obsèques », « a-t-on le droit de la diffuser ». Les réponses
   doivent donc être lisibles par une machine autant que par un
   lecteur, et rattachées à des entités nommées : une maison, un
   service, des œuvres, une marche à suivre.

   Ce qui n'y figure PAS, délibérément : aucun « aggregateRating »,
   aucun « review ». Les témoignages du site illustrent ce que le
   service produit ; les déclarer comme des avis clients vérifiés
   serait un faux signal — sanctionné par Google, et une allégation
   trompeuse au sens de l'article L121-2 du code de la consommation.
   Le jour où de vrais avis existeront, ils auront leur place ici.
   ═══════════════════════════════════════════════════════════════ */

const jsonldSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': SITE + '/#site',
  url: SITE,
  name: 'Melodia Funèbre',
  inLanguage: 'fr-FR',
  publisher: { '@id': SITE + '/#organisation' },
  description: "Composition d'une chanson originale pour la cérémonie funéraire d'une personne précise, à partir de ce que sa famille raconte d'elle."
};

/* Le catalogue en entités nommées : c'est ce qui permet à un système
   de répondre « oui, en voici des exemples » plutôt que « peut-être ».
   La liste suit TRACKS : elle n'annonce pas un nombre écrit à la main,
   qui vieillirait à chaque ajout comme l'a fait le reste du site. */
/* Deux listes, parce qu'il y a deux objets. Ranger un message laissé
   de son vivant parmi « les hommages » déclarerait aux moteurs une
   chose fausse : personne n'a composé cette œuvre pour un défunt, son
   auteur l'a commandée lui-même. Le filtre n'est donc pas cosmétique. */
const duRegistre = (c) => TRACKS.filter((t) => (t.categorie || 'hommage') === c);

const listeOeuvres = (liste, id, nom, desc) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': SITE + id,
  name: nom,
  description: desc,
  numberOfItems: liste.length,
  itemListElement: liste.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'MusicRecording',
      name: t.title,
      description: t.story,
      genre: t.style,
      inLanguage: 'fr-FR',
      byArtist: { '@id': SITE + '/#organisation' },
      audio: { '@type': 'AudioObject', contentUrl: SITE + '/' + t.file, encodingFormat: 'audio/mpeg' },
      isFamilyFriendly: true
    }
  }))
});

const jsonldCatalogue = listeOeuvres(
  duRegistre('hommage'), '/demos#catalogue',
  'Les hommages composés par Melodia Funèbre',
  "Chaque œuvre a été écrite pour une seule personne, d'après l'entretien mené avec sa famille.");

/* Les messages laissés de son vivant. La liste n'est publiée que si
   elle contient quelque chose : une liste vide annoncerait un
   catalogue qui n'existe pas. */
const duVivant = () => TRACKS.filter((t) => ['vivant', 'message'].indexOf(t.categorie) !== -1);
const jsonldVivants = duVivant().length
  ? listeOeuvres(
      duVivant(), '/de-son-vivant#oeuvres',
      'Les œuvres composées du vivant de la personne',
      'Des œuvres écrites pendant que la personne était encore là — offertes par ses ' +
      'proches, ou laissées par elle pour le jour venu.')
  : null;

/* La marche à suivre, en sept étapes. Un « HowTo » est l'une des
   formes qu'un assistant reprend le plus volontiers pour répondre à
   « comment ça se passe ». */
const ETAPES = [
  ['Vous commandez, ou vous demandez à être rappelé', "Une commande en ligne ou un rappel. Rien à préparer.", 'Immédiat'],
  ["L'entretien téléphonique", "Cinq questions, cinq minutes : le prénom du défunt, trois traits de caractère, son métier ou sa passion, une habitude quotidienne, une anecdote si vous le souhaitez. Nous posons les questions.", 'Sous 2 heures ouvrées'],
  ["L'écriture des paroles", "Le texte est écrit à partir de ce qui a été dit, et de rien d'autre.", 'Quelques heures'],
  ['La composition et le mixage', "La mélodie s'écrit dans le style choisi, puis l'œuvre est enregistrée et mixée.", 'Quelques heures'],
  ['La relecture humaine', "Texte, mélodie et mixage sont relus et validés à la main. Aucun hommage n'est envoyé sans avoir été écouté.", 'Contrôle systématique'],
  ['La livraison', "Le fichier vous est envoyé par courriel, diffusable en cérémonie, copiable pour la famille, à vous pour toujours.", "24 h après l'entretien"],
  ['La reprise, si nécessaire', "Si l'œuvre ne vous touche pas, elle est reprise. Une révision est incluse en Prestige, illimitée en Mémorial.", 'Sous 12 heures']
];

const jsonldProcessus = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  '@id': SITE + '/processus#howto',
  name: "Faire composer une chanson personnalisée pour une cérémonie funéraire",
  description: "De l'entretien téléphonique à la livraison de l'œuvre, en vingt-quatre heures.",
  inLanguage: 'fr-FR',
  totalTime: 'PT24H',
  estimatedCost: { '@type': 'MonetaryAmount', currency: 'EUR', minValue: 149, maxValue: 499 },
  supply: { '@type': 'HowToSupply', name: "Le prénom du défunt, trois traits de caractère, son métier ou sa passion, une habitude quotidienne" },
  step: ETAPES.map(([nom, txt, quand], i) => ({
    '@type': 'HowToStep', position: i + 1, name: nom, text: txt + ' (' + quand + ')',
    url: SITE + '/processus#etape-' + (i + 1)
  }))
};

/* Fil d'Ariane : il dit à un robot où se situe la page dans le site,
   et s'affiche tel quel dans les résultats de recherche. */
/* ═══════════════════════════════════════════════════════════════
   PARTAGER LA PAGE

   Le bouche-à-oreille est le seul canal qui fonctionne d'emblée pour
   ce service : une famille qui a été touchée en parle à une autre, un
   conseiller funéraire envoie le lien à un confrère. Encore faut-il
   que partager tienne en un geste — copier l'adresse dans la barre du
   navigateur en est trois, sur un téléphone.

   Le partage natif d'abord, quand l'appareil le propose : il ouvre
   l'application que la personne utilise déjà, y compris celles que
   nous ne connaissons pas. Les liens directs ensuite, pour les
   ordinateurs qui n'ont pas ce partage.

   Pas de boutons officiels des plateformes : ce sont des scripts
   extérieurs qui pistent le visiteur et ralentissent la page. Ce sont
   ici de simples liens, et rien ne part avant le clic.
   ═══════════════════════════════════════════════════════════════ */
function partage(titre, texte) {
  const t = esc(titre || 'Melodia Funèbre');
  const d = esc(texte || "Une chanson originale composée pour votre défunt, à partir de ce que vous racontez de lui.");
  return `
  <section class="section-sm partage-sec">
    <div class="wrap">
      <div class="partage" data-partage data-titre="${t}" data-texte="${d}">
        <div class="partage-tete">
          <span class="partage-orn" aria-hidden="true"></span>
          <p>Ce service est si récent que personne ne pense à le chercher.<br><b>Faites-le connaître à qui en aurait besoin.</b></p>
        </div>
        <div class="partage-liens">
          <button type="button" class="partage-r partage-natif" data-natif hidden aria-label="Partager">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
            <i>Partager</i>
          </button>
          <a class="partage-r r-wa" data-reseau="whatsapp" href="#" target="_blank" rel="noopener" aria-label="Partager sur WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.6 4c1.9.8 2.3.7 2.7.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2z"/></svg>
            <i>WhatsApp</i>
          </a>
          <a class="partage-r r-fb" data-reseau="facebook" href="#" target="_blank" rel="noopener" aria-label="Partager sur Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>
            <i>Facebook</i>
          </a>
          <a class="partage-r r-li" data-reseau="linkedin" href="#" target="_blank" rel="noopener" aria-label="Partager sur LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1a4.2 4.2 0 0 1 3.8-2c4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z"/></svg>
            <i>LinkedIn</i>
          </a>
          <a class="partage-r r-ml" data-reseau="mail" href="#" aria-label="Partager par courriel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
            <i>Courriel</i>
          </a>
          <button type="button" class="partage-r r-cp" data-copier-lien aria-label="Copier le lien">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
            <i>Copier</i>
          </button>
        </div>
      </div>
    </div>
  </section>`;
}

function jsonldFil(titre, chemin) {
  const fil = [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' }];
  if (chemin) fil.push({ '@type': 'ListItem', position: 2, name: titre, item: SITE + chemin });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: fil };
}

module.exports = { partage, pricing, faq, scrollHint, testimonials, trustStrip, marquee, oeuvres, vitrineBarre, chaineQR, urgency, esc, jsonldOrg, jsonldFaq, jsonldService, jsonldSite, jsonldCatalogue, jsonldVivants, jsonldProcessus, jsonldFil };
