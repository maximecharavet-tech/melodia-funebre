/* Blocs réutilisables entre pages */
const { ICON, SITE } = require('./gen.js');
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
function oeuvres() {
  const liste = TRACKS;
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
            <div class="oeuvre-qui">Pour ${esc(t.who)}</div>
            <button type="button" class="oeuvre-plus" data-plus aria-expanded="false" aria-controls="oe-detail-${i}"><span data-plus-libelle>Son histoire</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
            <div class="oeuvre-detail" id="oe-detail-${i}">
              <p class="oeuvre-recit">${esc(t.story)}</p>
${t.lyrics ? `              <blockquote class="oeuvre-vers">${esc(t.lyrics)}</blockquote>\n` : ''}              <div class="oeuvre-brief">
                <span class="mono">Les mots de la famille</span>
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
    lyrics: t.lyrics, brief: t.brief, photo: t.photo || '', mention: t.mention || ''
  }));

  /* Mention des portraits — posée par le gabarit, donc impossible à
     oublier sur l'une des pages où le catalogue apparaît, et absente
     tant qu'aucune fiche ne porte de portrait.

     Elle dit ce qui est : ces visages sont des illustrations. Un site
     de composition funéraire qui présente ses réalisations engage la
     confiance de familles endeuillées ; laisser croire qu'on regarde
     la photographie d'un défunt réel, sans que ce soit le cas, serait
     une tromperie sur ce que la maison a effectivement fait. La ligne
     coûte peu et met le catalogue à l'abri. */
  const avecPortrait = liste.some(t => t.photo);
  const mention = avecPortrait
    ? `\n      <p class="note center catalogue-mention">Portraits d'illustration — une famille nous confie des mots, pas toujours un visage.</p>`
    : '';

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
        <p class="cat-compte"><span data-catalogue-libelle>${TRACKS.length} hommages</span> composés à ce jour</p>
        <button type="button" class="btn btn-gold" data-tout-ecouter>
          <span class="cat-eq" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span data-libelle>Tout écouter</span>
        </button>
      </div>
      <div class="cat-filtres" data-catalogue-filtres role="group" aria-label="Filtrer par registre musical" hidden></div>`;
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
const jsonldCatalogue = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': SITE + '/demos#catalogue',
  name: 'Les hommages composés par Melodia Funèbre',
  description: "Chaque œuvre a été écrite pour une seule personne, d'après l'entretien mené avec sa famille.",
  numberOfItems: TRACKS.length,
  itemListElement: TRACKS.map((t, i) => ({
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
};

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
  const d = esc(texte || 'Une chanson originale composée pour votre défunt, à partir de ce que vous racontez de lui.');
  return `
  <section class="section-sm partage-sec">
    <div class="wrap">
      <div class="partage" data-partage data-titre="${t}" data-texte="${d}">
        <div class="partage-mot">
          <span class="eyebrow">Faire connaître</span>
          <p>Quelqu'un autour de vous en aurait besoin ? Ce service est si récent que personne ne pense à le chercher.</p>
        </div>
        <div class="partage-liens">
          <button type="button" class="partage-b partage-natif" data-natif hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
            Partager
          </button>
          <a class="partage-b" data-reseau="whatsapp" href="#" target="_blank" rel="noopener" aria-label="Partager sur WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.6 4c1.9.8 2.3.7 2.7.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2z"/></svg>
            WhatsApp
          </a>
          <a class="partage-b" data-reseau="facebook" href="#" target="_blank" rel="noopener" aria-label="Partager sur Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>
            Facebook
          </a>
          <a class="partage-b" data-reseau="linkedin" href="#" target="_blank" rel="noopener" aria-label="Partager sur LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1a4.2 4.2 0 0 1 3.8-2c4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z"/></svg>
            LinkedIn
          </a>
          <a class="partage-b" data-reseau="mail" href="#" aria-label="Partager par courriel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
            Courriel
          </a>
          <button type="button" class="partage-b" data-copier-lien aria-label="Copier le lien">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
            Copier le lien
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

module.exports = { partage, pricing, faq, scrollHint, testimonials, trustStrip, marquee, oeuvres, vitrineBarre, urgency, esc, jsonldOrg, jsonldFaq, jsonldService, jsonldSite, jsonldCatalogue, jsonldProcessus, jsonldFil };
