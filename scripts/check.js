const fs = require('fs');
const files = [
  'index.html','processus.html','demos.html','offres.html','agences.html','contact.html',
  'compte.html','dashboard-partenaire.html','dashboard-master.html',
  'assets/css/style.css','assets/css/dashboard.css',
  'assets/js/main.js','assets/js/auth.js','assets/js/config.js',
  'assets/img/logo-melodia.jpg','assets/img/logo-melodia-anime.mp4',
  'audio/maurice.mp3','audio/monique.mp3','audio/sergio.mp3',
  'vercel.json','robots.txt','sitemap.xml'
];
let ok = true;
for (const f of files) {
  if (fs.existsSync(f)) console.log('  ok  ', f);
  else { console.error('  MANQUE', f); ok = false; }
}
console.log(ok ? '\nSite complet.' : '\nFichiers manquants.');
process.exit(ok ? 0 : 1);
