/* Générateur des pages statiques Melodia — sorties committées telles quelles */
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || '.';

const SITE = 'https://melodia-funebre.fr';
const TEL = '07 84 10 16 96';
const TEL_HREF = '+33784101696';
const MAIL = 'contact@melodia-funebre.fr';

const NAVITEMS = [
  ['processus.html', 'Processus'],
  ['demos.html', 'Écouter'],
  ['offres.html', 'Offres'],
  ['agences.html', 'Agences'],
  ['contact.html', 'Contact']
];

const ICON = {
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l7 3v6c0 4.2-2.9 7.8-7 9-4.1-1.2-7-4.8-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.8 6.6a5 5 0 00-7.1 0L12 8.3l-1.7-1.7a5 5 0 10-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 000-7.1z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8a3 3 0 10-3-3 3 3 0 003 3zM12 8a3 3 0 113-3 3 3 0 01-3 3z"/></svg>',
  euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6a7 7 0 100 12"/><path d="M4 10h9M4 14h9"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 18l-6-6 6-6"/></svg>',
  arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 6l6 6-6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 6L6 18M6 6l12 12"/></svg>'
};

function head(p) {
  const url = SITE + '/' + (p.file === 'index.html' ? '' : p.file.replace('.html', ''));
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#040407">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${url}">
${p.noindex ? '<meta name="robots" content="noindex, follow">\n' : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="Melodia Funèbre">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/img/og-melodia.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Melodia Funèbre — Chaque vie mérite une chanson">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${p.title}">
<meta name="twitter:description" content="${p.desc}">
<meta name="twitter:image" content="${SITE}/assets/img/og-melodia.jpg">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/icons/icon-192.png">
<link rel="apple-touch-icon" href="/assets/img/icons/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="apple-mobile-web-app-title" content="Melodia">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=yes">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
${p.jsonld ? '<script type="application/ld+json">' + JSON.stringify(p.jsonld) + '</script>' : ''}${p.intro ? `
<script>/* Avant le premier rendu : le seuil ne se rejoue pas dans la même session. */
try{if(sessionStorage.getItem('melodia_intro'))document.documentElement.className+=' intro-off';}catch(e){}</script>
<noscript><style>.intro{display:none!important}</style></noscript>` : ''}`;
}

function nav() {
  const links = NAVITEMS.map(([h, l]) => `      <a href="${h}">${l}</a>`).join('\n');
  const mlinks = NAVITEMS.map(([h, l]) => `  <a href="${h}">${l}</a>`).join('\n');
  return `<a class="skip-link" href="#main">Aller au contenu</a>
<div class="grain" aria-hidden="true"></div>
<nav class="nav at-top">
  <div class="nav-inner">
    <a href="index.html" class="nav-brand" aria-label="Melodia Funèbre, accueil">
      <img src="assets/img/logo-melodia.jpg" alt="" class="nav-logo" width="40" height="40">
      <span><span class="nav-name">Melodia</span><span class="nav-sub">Funèbre</span></span>
    </a>
    <div class="nav-links">
${links}
      <a href="compte.html" class="nav-cta">Mon compte</a>
    </div>
    <button class="nav-burger" aria-label="Ouvrir le menu" aria-controls="menu-mobile">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
    </button>
  </div>
</nav>
<div class="nav-mobile" id="menu-mobile">
${mlinks}
  <a href="compte.html">Mon compte</a>
  <div class="nav-mobile-cta">
    <a href="offres.html" class="btn btn-gold">Commander un hommage</a>
    <a href="tel:${TEL_HREF}" class="btn btn-outline">${ICON.phone} ${TEL}</a>
  </div>
</div>`;
}

function footer() {
  return `<footer class="footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <img src="assets/img/logo-melodia.jpg" alt="Melodia Funèbre" class="footer-logo" width="52" height="52">
        <p class="footer-tag">Maison française de composition musicale personnalisée pour cérémonies funéraires.</p>
        <p class="footer-baseline">Écoute · Respect · Accompagnement<br>Harmonie · Mémoire</p>
      </div>
      <div>
        <h4>Découvrir</h4>
        <ul class="footer-links">
          <li><a href="processus.html">Le processus</a></li>
          <li><a href="demos.html">Écouter les hommages</a></li>
          <li><a href="offres.html">Offres &amp; tarifs</a></li>
          <li><a href="index.html#faq">Questions fréquentes</a></li>
        </ul>
      </div>
      <div>
        <h4>Professionnels</h4>
        <ul class="footer-links">
          <li><a href="agences.html">Espace agences</a></li>
          <li><a href="agences.html#calculateur">Simuler mes revenus</a></li>
          <li><a href="compte.html">Connexion partenaire</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul class="footer-links">
          <li><a href="mailto:${MAIL}">${MAIL}</a></li>
          <li><a href="tel:${TEL_HREF}">${TEL}</a></li>
          <li><a href="contact.html">Nous écrire</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> Melodia Funèbre — Tous droits réservés</span>
      <span class="footer-legal">
        <a href="mentions-legales.html">Mentions légales</a>
        <a href="cgv.html">CGV</a>
        <a href="confidentialite.html">Confidentialité</a>
      </span>
      <span class="gold">Fondateur : Maxime Charavet</span>
    </div>
  </div>
</footer>`;
}

function stickyCta() {
  return `<div class="sticky-cta">
  <a href="tel:${TEL_HREF}" class="btn btn-outline">${ICON.phone} Appeler</a>
  <a href="offres.html" class="btn btn-gold">Commander</a>
</div>`;
}


/* Seuil d'entrée — uniquement sur la page d'accueil */
function intro() {
  const barres = [0, 0.18, 0.36, 0.12, 0.5, 0.28, 0.44, 0.08, 0.32]
    .map(d => `<span style="animation-delay:${d}s"></span>`).join('');
  return `<div class="intro" id="intro" aria-label="Entrée du site Melodia Funèbre">
  <div class="intro-inner">
    <div class="intro-line"></div>
    <img src="assets/img/intro-logo.jpg" alt="Melodia Funèbre" class="intro-logo" width="440" height="440" fetchpriority="high">
    <div class="intro-name">Melodia Funèbre</div>
    <div class="intro-wave" aria-hidden="true">${barres}</div>
    <p class="intro-claim">Premier site mondial dédié à la<br><em>musique personnalisée</em> pour funérailles.</p>
    <div class="intro-actions">
      <button class="btn btn-gold btn-lg" id="intro-enter" type="button">Entrer</button>
      <span class="intro-hint">Ou touchez l'écran pour continuer</span>
    </div>
  </div>
</div>`;
}

function page(p) {
  /* content.js d'abord : il pose window.MELODIA_TRACKS avant le lecteur */
  const scripts = ['assets/js/content.js', 'assets/js/main.js'].concat(p.scripts || []);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
${head(p)}
</head>
<body>
${p.intro ? intro() + '\n' : ''}${nav()}
<main id="main">
${p.body}
</main>
${footer()}
${p.sticky === false ? '' : stickyCta() + '\n'}${scripts.map(s => `<script src="${s}"></script>`).join('\n')}
${p.inline || ''}
<!-- Mesure d'audience Vercel : sans cookie, activable depuis le tableau de bord.
     Les scripts restent inertes tant que la fonctionnalité n'est pas activée. -->
<script defer src="/_vercel/insights/script.js"></script>
<script defer src="/_vercel/speed-insights/script.js"></script>
</body>
</html>`;
}

module.exports = { page, ICON, SITE, TEL, TEL_HREF, MAIL, head, nav, footer };
