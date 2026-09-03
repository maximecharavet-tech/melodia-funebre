/* Blocs réutilisables entre pages */
const { ICON, TEL, TEL_HREF, SITE } = require('./gen.js');
const { OFFERS, TESTIS, FAQ, STYLES } = require('./data.js');

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

function player(head) {
  return `<div class="player reveal">
          <div class="player-head"><span>${head || 'Hommages composés par la maison'}</span><span class="badge badge-live">3 extraits</span></div>
          <div class="player-list"></div>
          <div class="player-progress"><div class="player-progress-fill"></div></div>
          <div class="player-wave"></div>
        </div>`;
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
  telephone: '+33784101696',
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

module.exports = { pricing, faq, scrollHint, testimonials, trustStrip, marquee, player, urgency, esc, jsonldOrg, jsonldFaq, jsonldService };
