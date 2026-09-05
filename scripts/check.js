/* Vérifie que le site est complet avant tout déploiement. */
const fs = require('fs');

const files = [
  'index.html', 'processus.html', 'demos.html', 'rites.html', 'offres.html', 'agences.html',
  'contact.html', 'compte.html', 'dashboard-partenaire.html', 'dashboard-master.html', 'dashboard-commercial.html',
  'mentions-legales.html', 'cgv.html', 'confidentialite.html', '404.html',
  'assets/css/style.css', 'assets/css/dashboard.css',
  'assets/js/main.js', 'assets/js/catalogue.js', 'assets/js/order.js', 'assets/js/atelier-music.js',
  'assets/js/content.js', 'assets/js/proprietaire.js', 'assets/js/livraison.js', 'assets/js/rappel.js', 'assets/js/commercial.js', 'assets/js/courrier.js', 'assets/js/ornements.js', 'api/lead.js', 'api/prospects.js', 'assets/data/content.json',
  'api/_courrier.js', 'api/famille.js', 'api/prospect-mail.js',
  'assets/js/auth.js', 'assets/js/config.js',
  'assets/img/logo-melodia.jpg', 'assets/img/logo-melodia-complet.jpg', 'assets/img/logo-melodia-anime.mp4',
  'assets/img/og-melodia.jpg', 'assets/img/intro-logo.jpg', 'favicon.ico', 'site.webmanifest',
  'assets/img/icons/icon-192.png', 'assets/img/icons/icon-512.png',
  'assets/img/icons/icon-180.png', 'assets/img/icons/maskable-512.png',
  'audio/maurice.mp3', 'audio/monique.mp3', 'audio/sergio.mp3', 'audio/dorian.mp3',
  'audio/anthony.mp3', 'audio/paula.mp3',
  'api/generate-music.js', 'api/music-status.js', 'api/music-config.js', 'api/generate-lyrics.js',
  'vercel.json', 'robots.txt', 'sitemap.xml'
];

let ok = true;
for (const f of files) {
  if (fs.existsSync(f)) console.log('  ok  ', f);
  else { console.error('  MANQUE', f); ok = false; }
}

/* Aucune page ne doit partir avec un lien mort vers une page du site. */
const pages = files.filter(f => f.endsWith('.html'));
const internes = new Set(pages);
for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  const liens = [...html.matchAll(/href="([^"#?:]+\.html)/g)].map(m => m[1]);
  for (const l of new Set(liens)) {
    if (!internes.has(l) && !fs.existsSync(l)) { console.error('  LIEN MORT', p, '->', l); ok = false; }
  }
}

/* Le manifeste ne doit pas référencer d'icône absente. */
try {
  const man = JSON.parse(fs.readFileSync('site.webmanifest', 'utf8'));
  for (const ic of man.icons || []) {
    /* Les icônes portent une empreinte (?v=…) depuis la construction */
    const f = ic.src.replace(/^\//, '').replace(/\?.*$/, '');
    if (!fs.existsSync(f)) { console.error('  ICÔNE MANQUANTE', ic.src); ok = false; }
  }
} catch (e) { console.error('  site.webmanifest illisible :', e.message); ok = false; }

console.log(ok ? '\nSite complet, liens internes valides.' : '\nDes fichiers manquent.');
process.exit(ok ? 0 : 1);
