/* Vérifie que le site est complet avant tout déploiement. */
const fs = require('fs');

const files = [
  'index.html', 'processus.html', 'demos.html', 'offres.html', 'agences.html',
  'contact.html', 'compte.html', 'dashboard-partenaire.html', 'dashboard-master.html',
  'mentions-legales.html', 'cgv.html', 'confidentialite.html',
  'assets/css/style.css', 'assets/css/dashboard.css',
  'assets/js/main.js', 'assets/js/player.js', 'assets/js/order.js', 'assets/js/atelier-music.js',
  'assets/js/auth.js', 'assets/js/config.js',
  'assets/img/logo-melodia.jpg', 'assets/img/logo-melodia-anime.mp4',
  'audio/maurice.mp3', 'audio/monique.mp3', 'audio/sergio.mp3',
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

console.log(ok ? '\nSite complet, liens internes valides.' : '\nDes fichiers manquent.');
process.exit(ok ? 0 : 1);
