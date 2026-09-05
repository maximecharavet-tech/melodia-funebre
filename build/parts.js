/* Blocs réutilisables entre pages */
const { ICON, SITE } = require('./gen.js');
const { OFFERS, TESTIS, FAQ, STYLES, TRACKS } = require('./data.js');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Grille tarifaire — `mode` : 'link' (va vers offres) ou 'order' (ouvre le tunnel) */
function pricing(mode) {
  return OFFERS.map((o, i) => {
    const action = mode === 'order'
      ? `<button class="btn ${o.featured ? 'btn-gold' : 'btn-outline'} btn-block" onclick="openOrder('${o.name}')">Choisir ${o.name}</button>`
      : `<a href="offres.html" class="btn ${o.featured ? 'btn-gold' : 'btn-outline'} btn-block">Choisir ${o.name}</a>`;
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

const jsonldOrg = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': SITE + '/#organisation',
  name: 'Melodia Funèbre',
  description: "Maison française de composition musicale personnalisée pour cérémonies funéraires. Une œuvre originale par défunt, livrée en 24 heures, sans droits SACEM.",
  url: SITE,
  /* Pas de « telephone » : ces données sont publiques et indexées. */
  email: 'contact@melodia-funebre.fr',
  image: SITE + '/assets/img/logo-melodia.jpg',
  logo: SITE + '/assets/img/logo-melodia.jpg',
  founder: { '@type': 'Person', name: 'Maxime Charavet' },
  areaServed: { '@type': 'Country', name: 'France' },
  priceRange: '149€ – 499€',
  aggregateRating: undefined
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

module.exports = { pricing, faq, scrollHint, testimonials, trustStrip, marquee, oeuvres, vitrineBarre, urgency, esc, jsonldOrg, jsonldFaq, jsonldService };
