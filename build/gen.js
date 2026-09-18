/* Générateur des pages statiques Melodia — sorties committées telles quelles */
const fs = require('fs');
const path = require('path');

/* ─── Empreinte des fichiers servis ───
   Les feuilles et les scripts sont mis en cache un jour, avec une
   semaine de tolérance en plus : une correction n'atteignait donc pas
   un visiteur déjà venu avant le lendemain. On l'a payé une fois — la
   clé Supabase ajoutée à config.js ne parvenait pas au navigateur, et
   le site restait en mode démo en affichant « mot de passe incorrect »
   sur un mot de passe juste.

   Chaque adresse porte désormais une empreinte de son contenu : le
   cache reste long, et le moindre octet changé donne une adresse
   neuve, donc un téléchargement immédiat. */
const crypto = require('crypto');
const RACINE_ACTIFS = require('path').join(__dirname, '..');
const empreintes = {};
function versionne(chemin) {
  if (!(chemin in empreintes)) {
    try {
      const octets = require('fs').readFileSync(require('path').join(RACINE_ACTIFS, chemin));
      empreintes[chemin] = crypto.createHash('sha1').update(octets).digest('hex').slice(0, 8);
    } catch (e) { empreintes[chemin] = ''; }
  }
  const e = empreintes[chemin];
  return e ? chemin + '?v=' + e : chemin;
}

/* Les images sont servies avec « max-age=31536000, immutable » : sans
   empreinte dans leur adresse, un visiteur déjà venu garderait l'ancien
   logo pendant un an. On marque donc toute adresse d'image de la page,
   qu'elle soit relative ou absolue — c'est le même piège que celui qui
   avait retenu la configuration Supabase, appliqué aux images. */
const RE_IMG = new RegExp(
  '(https://melodia-funebre\\.fr/)?(assets/img/(?:[a-z0-9-]+/)?[a-z0-9._-]+' +
  '\\.(?:jpe?g|png|webp|svg|avif|mp4|webm))(\\?v=[a-f0-9]+)?', 'gi');

function empreinterImages(html) {
  return html.replace(RE_IMG, (_, origine, chemin) => (origine || '') + versionne(chemin));
}

const OUT = process.argv[2] || '.';

const SITE = 'https://melodia-funebre.fr';
/* Aucun numéro dans le site : la famille demande à être rappelée. Le
   numéro ne doit pas non plus revenir par les données structurées, qui
   sont lues par les moteurs et publiées en clair. */
const MAIL = 'contact@melodia-funebre.fr';

/* Les comptes publics de la maison. Ici et nulle part ailleurs : ils
   servent au pied de page, aux données structurées « sameAs » qui
   disent à Google que ces comptes sont bien les nôtres, et aux
   partages. Trois copies auraient fini par diverger. */
const SOCIAL = {
  facebook: 'https://www.facebook.com/share/1GUX4Ht8M8/',
  instagram: 'https://www.instagram.com/melodia_funebre'
};

/* Adresses sans extension : « cleanUrls » est actif sur Vercel, qui
   redirige /offres.html vers /offres en 308. Chaque lien interne en
   .html coûtait donc un aller-retour au visiteur comme au robot
   d'indexation, et diluait le lien sur une redirection au lieu de le
   porter sur la page. */
/* La barre se lit comme deux portes, pas comme un sommaire : une
   famille et un dirigeant de pompes funèbres n'arrivent pas pour la
   même chose, et chacun doit voir la sienne au premier regard. Les
   pages secondaires — rites, contact, recrutement — descendent au
   pied, où on les cherche quand on en a besoin. */
const NAVITEMS = [
  ['/processus', 'Comment ça marche'],
  ['/demos', 'Nos hommages'],
  ['/offres', 'Pour les familles'],
  ['/professionnels', 'Pour les professionnels'],
  ['/#faq', 'FAQ']
];

const ICON = {
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l7 3v6c0 4.2-2.9 7.8-7 9-4.1-1.2-7-4.8-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.8 6.6a5 5 0 00-7.1 0L12 8.3l-1.7-1.7a5 5 0 10-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 000-7.1z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8a3 3 0 10-3-3 3 3 0 003 3zM12 8a3 3 0 113-3 3 3 0 01-3 3z"/></svg>',
  euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6a7 7 0 100 12"/><path d="M4 10h9M4 14h9"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 18l-6-6 6-6"/></svg>',
  arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 6l6 6-6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  /* Un écran et un QR code : les deux piliers qui manquaient à
     l'argumentaire des professionnels. */
  ecran: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14h1M20 20h1M14 20h3"/></svg>'
};

/* Les icônes déclarées dans <head> sont la marque réduite « MF »
   (build/marque.svg), et non le logo complet : c'est ce que Google affiche
   à côté du site dans ses résultats, à seize pixels, où l'anneau, la
   colombe et la clé de sol se réduisent à une tache sombre. Google retient
   l'icône la plus proche de 48 px — d'où le 48 exact déclaré, qui l'emporte
   sur le 180 de l'icône Apple. Le logo complet reste l'icône de
   l'application (apple-touch-icon et manifeste), où la taille lui rend
   justice. */
function head(p) {
  /* L'adresse peut être réécrite : « ecouter-x.html » est servi à
     « /ecouter/x », et c'est cette adresse-là qui doit être canonique
     et partagée. Sans cela, un lien posté sur Facebook renverrait vers
     le nom de fichier. */
  const url = p.url ? SITE + p.url
                    : SITE + '/' + (p.file === 'index.html' ? '' : p.file.replace('.html', ''));
  /* L'aperçu social : une image par page quand elle en a une. Une
     vignette générique sous un lien vers une chanson précise est
     exactement ce qui fait qu'on ne clique pas. */
  const image = SITE + (p.image || '/assets/img/og-melodia.jpg');
  const imageAlt = p.imageAlt || 'Melodia Funèbre — Chaque vie mérite une chanson';
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#040407">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${url}">
${p.noindex ? '<meta name="robots" content="noindex, follow">\n' : ''}<meta property="og:type" content="${p.ogType || 'website'}">
<meta property="og:site_name" content="Melodia Funèbre">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${imageAlt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${p.title}">
<meta name="twitter:description" content="${p.desc}">
<meta name="twitter:image" content="${image}">
${p.metas || ''}
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" type="image/png" sizes="48x48" href="${versionne('assets/img/icons/icon-48.png')}">
<link rel="apple-touch-icon" href="/assets/img/icons/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="apple-mobile-web-app-title" content="Melodia">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${versionne('assets/css/style.css')}">
<noscript><style>
/* Les blocs révélés au défilement partent à opacité zéro : sans JavaScript
   pour les révéler, la page se servirait presque vide. On les rétablit. */
.reveal,.oeuvre{opacity:1!important;transform:none!important}
</style></noscript>
${p.jsonld ? '<script type="application/ld+json">' + JSON.stringify(p.jsonld) + '</script>' : ''}${p.intro ? `
<script>/* Avant le premier rendu : le seuil ne se rejoue pas dans la même session. */
try{if(sessionStorage.getItem('melodia_intro'))document.documentElement.className+=' intro-off';}catch(e){}</script>
<noscript><style>.intro{display:none!important}</style></noscript>` : ''}`;
}

/* « at-top » rend la barre transparente, pour que le bandeau vidéo de
   l'accueil se donne en entier. Sur une page sans bandeau, il n'y a
   rien à laisser voir : le texte défilait sous le logo, illisible.
   La classe n'est donc posée que là où elle a un sens. */
function nav(surBandeau) {
  const links = NAVITEMS.map(([h, l]) => `      <a href="${h}">${l}</a>`).join('\n');
  const mlinks = NAVITEMS.map(([h, l]) => `  <a href="${h}">${l}</a>`).join('\n');
  return `<a class="skip-link" href="#main">Aller au contenu</a>
<div class="grain" aria-hidden="true"></div>
<nav class="nav${surBandeau ? ' at-top' : ''}">
  <div class="nav-inner">
    <a href="/" class="nav-brand" aria-label="Melodia Funèbre, accueil">
      <img src="assets/img/logo-melodia.jpg" alt="" class="nav-logo" width="40" height="40">
      <span><span class="nav-name">Melodia</span><span class="nav-sub">Funèbre</span></span>
    </a>
    <div class="nav-links">
${links}
      <a href="/professionnels#partenariat" class="nav-cta nav-cta-pro">Devenir partenaire</a>
      <a href="/compte" class="nav-compte">Mon compte</a>
    </div>
    <button class="nav-burger" aria-label="Ouvrir le menu" aria-controls="menu-mobile">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
    </button>
  </div>
</nav>
<div class="nav-mobile" id="menu-mobile">
${mlinks}
  <a href="/rites">Les rites</a>
  <a href="/contact">Nous écrire</a>
  <a href="/compte">Mon compte</a>
  <div class="nav-mobile-cta">
    <a href="/professionnels#partenariat" class="btn btn-gold">Devenir partenaire</a>
    <a href="/offres" class="btn btn-outline">Commander un hommage</a>
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
          <li><a href="/processus">Le processus</a></li>
          <li><a href="/demos">Écouter les hommages</a></li>
          <li><a href="/rites">L'hommage selon le rite</a></li>
          <li><a href="/offres">Offres &amp; tarifs</a></li>
          <li><a href="/#faq">Questions fréquentes</a></li>
        </ul>
      </div>
      <div>
        <!-- Les guides répondent à ce que les familles cherchent avant
             de nous connaître. Les placer au pied de chaque page leur
             donne un lien depuis tout le site, sans encombrer une barre
             de navigation déjà pleine — et sans reproduire le
             débordement du menu mobile. -->
        <h4>Conseils</h4>
        <ul class="footer-links">
          <li><a href="/musique-obseques">Quelle musique pour un enterrement</a></li>
          <li><a href="/musique-cremation">La musique en crémation</a></li>
          <li><a href="/musique-sacem-obseques">Droits d'auteur et obsèques</a></li>
        </ul>
      </div>
      <div>
        <h4>Professionnels</h4>
        <ul class="footer-links">
          <li><a href="/professionnels">Pour les pompes funèbres</a></li>
          <li><a href="/professionnels#partenariat">Devenir partenaire</a></li>
          <li><a href="/professionnels#calculateur">Simuler mes revenus</a></li>
          <li><a href="/qui-sommes-nous">Qui sommes-nous</a></li>
          <li><a href="/rejoindre">Nous rejoindre</a></li>
          <li><a href="/compte">Connexion partenaire</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul class="footer-links">
          <li><a href="mailto:${MAIL}">${MAIL}</a></li>
          <li><button type="button" class="lien-rappel" data-rappel>Être rappelé</button></li>
          <li><a href="/contact">Nous écrire</a></li>
          <li><a href="/application">L'application</a></li>
        </ul>
        <!-- Deux réseaux, pas six : une maison qui affiche des icônes
             vers des comptes vides paraît plus petite que si elle n'en
             affichait aucune. -->
        <ul class="footer-social" aria-label="Nos réseaux">
          <li><a href="${SOCIAL.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Melodia Funèbre sur Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8.5V7c0-.7.3-1 1-1h1.5V3.2A16 16 0 0 0 14.6 3C12.3 3 11 4.4 11 6.7v1.8H8.5V12H11v9h3v-9h2.3l.4-3.5H14z"/></svg>
            <span>Facebook</span></a></li>
          <li><a href="${SOCIAL.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Melodia Funèbre sur Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>
            <span>Instagram</span></a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> Melodia Funèbre — Tous droits réservés</span>
      <span class="footer-legal">
        <a href="/mentions-legales">Mentions légales</a>
        <a href="/cgv">CGV</a>
        <a href="/confidentialite">Confidentialité</a>
      </span>
      <span class="signature">
        <img src="assets/img/maxime.png" alt="" class="signature-portrait" width="40" height="40" loading="lazy">
        <span class="signature-mots">
          <span class="signature-role">Fondateur</span>
          <span class="signature-nom">Maxime Charavet</span>
        </span>
      </span>
    </div>
    <!-- La maison qui fait tourner la machine. Discret : c'est une
         signature technique, pas une publicité — d'où le corps réduit
         et l'emblème qui ne s'allume qu'au survol. -->
    <div class="propulse">
      <a href="/hyper-ai-engine" class="propulse-lien">
        <img src="assets/img/hyper-engine.png" alt="" class="propulse-marque" width="26" height="24" loading="lazy">
        <span class="propulse-mots">Propulsé par <b>Hyper A.I Engine</b></span>
      </a>
    </div>
  </div>
</footer>`;
}

function stickyCta() {
  return `<div class="sticky-cta">
  <button type="button" class="btn btn-outline" data-rappel>${ICON.phone} Être rappelé</button>
  <a href="/offres" class="btn btn-gold">Commander</a>
</div>`;
}

/* ─── La porte des professionnels ───
   Un dirigeant de pompes funèbres qui tombe sur une page écrite pour
   les familles doit pouvoir bifurquer sans remonter chercher le menu.
   Discret et unique : deux boutons flottants concurrents se neutralisent
   l'un l'autre. Il ne s'affiche pas sur la page qui lui est destinée. */
function boutonPro(fichier) {
  if (/^(professionnels|compte|espace|404)\./.test(fichier || '')) return '';
  return `<a href="/professionnels" class="pro-flottant" data-pro-flottant>
  <span class="pro-flottant-ico" aria-hidden="true">◈</span>
  <span class="pro-flottant-mot">Professionnels</span>
</a>`;
}


/* Seuil d'entrée — uniquement sur la page d'accueil */
function intro() {
  const barres = [0, 0.18, 0.36, 0.12, 0.5, 0.28, 0.44, 0.08, 0.32]
    .map(d => `<span style="animation-delay:${d}s"></span>`).join('');
  return `<div class="intro" id="intro" aria-label="Entrée du site Melodia Funèbre">
  <div class="intro-inner">
    <div class="intro-line"></div>
    <div class="intro-visuel">
    <div class="intro-scene">
      <span class="intro-onde" aria-hidden="true"></span>
      <span class="intro-onde" aria-hidden="true"></span>
      <span class="intro-onde" aria-hidden="true"></span>
      <svg class="intro-anneau" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <circle class="an-trace" cx="100" cy="100" r="96"/>
        <circle class="an-arc" cx="100" cy="100" r="86"/>
      </svg>
      <img src="assets/img/intro-logo.jpg" alt="Melodia Funèbre" class="intro-logo" width="440" height="440" fetchpriority="high">
    </div>
    <!-- L'animation du logo. Elle se superpose au médaillon dessiné en CSS
         quand elle est prête : le seuil s'affiche à l'instant, la vidéo
         arrive ensuite. Sur connexion lente, en économie de données ou en
         mouvement réduit, elle ne se charge jamais.
         Pas d'image d'attente : elle serait forcément une seconde du film,
         donc un faux départ. Le médaillon dessiné dessous tient ce rôle,
         et il est déjà là. -->
    <div class="intro-film" aria-hidden="true">
      <video class="intro-video" muted playsinline preload="none"
             width="1040" height="880"
             data-src="${versionne('assets/img/intro-melodia.mp4')}"></video>
    </div>
    </div>
    <button type="button" class="intro-son" hidden
            aria-label="Activer le son de l'animation">
      <svg class="son-muet" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>
      <svg class="son-actif" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/></svg>
      <span class="intro-son-mot">Son</span>
    </button>
    <div class="intro-name">Melodia Funèbre</div>
    <div class="intro-wave" aria-hidden="true">${barres}</div>
    <p class="intro-claim">Premier site dédié à la<br><em>musique personnalisée</em> pour funérailles.</p>
    <div class="intro-actions">
      <button class="btn btn-gold btn-lg" id="intro-enter" type="button">Entrer</button>
      <span class="intro-hint">Ou touchez l'écran pour continuer</span>
    </div>
  </div>
</div>`;
}

/* ─── Le compte des hommages ───
   « Les trois hommages de démonstration » est resté écrit tel quel
   pendant que le catalogue passait de trois à seize : accueil, page
   agences et foire aux questions annonçaient toutes un chiffre faux.
   Les gabarits écrivent {{HOMMAGES}} et le nombre est posé ici, en
   toute fin de génération : à ce moment TRACKS a déjà reçu le contenu
   publié, donc un hommage ajouté depuis la console corrige la phrase
   sans que personne n'y touche. */
function comblerHommages(html) {
  if (html.indexOf('{{HOMMAGES}}') === -1) return html;
  const { TRACKS, enLettres } = require('./data.js');
  return html.split('{{HOMMAGES}}').join(enLettres(TRACKS.length));
}

function page(p) {
  /* content.js d'abord : le catalogue se remonte ensuite autour du contenu publié */
  /* config.js en premier : content.js doit savoir où lire le contenu
     publié avant de chercher à le lire. Il ne contient que l'adresse du
     projet et la clé publique, celle qui est faite pour être lue. */
  const base = ['assets/js/config.js', 'assets/js/content.js', 'assets/js/main.js', 'assets/js/application.js',
                'assets/js/rappel.js', 'assets/js/courrier.js', 'assets/js/ornements.js'];
  const scripts = base.concat((p.scripts || []).filter((s) => base.indexOf(s) === -1));
  return absolu(comblerHommages(empreinterImages(`<!DOCTYPE html>
<html lang="fr">
<head>
${head(p)}
</head>
<body>
${p.intro ? intro() + '\n' : ''}${nav(/hero-video/.test(p.body || ''))}
<main id="main">
${p.body}
</main>
<div class="orn-portee-hote orn-portee-pied" data-orn-portee="${(p.file || 'page').replace(/\.html$/, '')}"></div>
${footer()}
${p.sticky === false ? '' : stickyCta() + '\n'}${boutonPro(p.file || '')}
${scripts.map(s => `<script src="${versionne(s)}"></script>`).join('\n')}
${p.inline || ''}
<!-- Mesure d'audience Vercel : sans cookie, activable depuis le tableau de bord.
     Les scripts restent inertes tant que la fonctionnalité n'est pas activée. -->
<script defer src="/_vercel/insights/script.js"></script>
<script defer src="/_vercel/speed-insights/script.js"></script>
</body>
</html>`)));
}

/* ─── Les chemins d'actifs, en absolu ───
   Les pages vivaient toutes à la racine : « assets/css/style.css »
   s'y résolvait correctement. Les pages d'écoute sont servies à
   « /ecouter/<titre> », d'un niveau plus bas — le même chemin y
   désignait « /ecouter/assets/css/style.css », qui n'existe pas. La
   page arrivait donc en texte brut, sans une ligne de style.

   Un chemin absolu se résout pareil depuis n'importe quelle
   profondeur : c'est la correction, et elle vaut pour toutes les
   pages. Seules les références du dépôt sont touchées — les adresses
   complètes, déjà absolues, ne contiennent pas la forme visée. */
function absolu(html) {
  /* « poster » manquait à cette liste : la première vidéo du site n'en
     avait pas, la deuxième si, et son image d'attente est partie en
     relatif. C'est le même défaut que celui du « srcset », dans un
     attribut de plus. */
  html = html.replace(/(\s(?:href|src|srcset|poster|data-src)=")(assets\/|audio\/|sw\.js)/g, '$1/$2');
  /* « srcset » porte plusieurs adresses séparées par des virgules, et
     la règle ci-dessus n'en voit que la première : elle s'accroche au
     guillemet ouvrant. Les candidates suivantes restaient donc
     relatives — « /assets/…-700.webp 700w, assets/…-1100.webp 1100w ».
     Cela marche tant que la page est à la racine, et casse le jour où
     elle est servie sous /ecouter/ ou /m/, c'est-à-dire exactement
     l'adresse qu'ouvre un QR code devant une tombe. On reprend donc
     chaque candidate. */
  return html.replace(/(\ssrcset=")([^"]*)"/g, (_, att, val) =>
    att + val.split(',').map((c) => c.replace(/^(\s*)(assets\/|audio\/)/, '$1/$2')).join(',') + '"');
}

module.exports = { page, ICON, SITE, MAIL, SOCIAL, head, nav, footer, versionne, empreinterImages };
