/* Vérifie que le site est complet avant tout déploiement. */
const fs = require('fs');

const files = [
  'index.html', 'processus.html', 'demos.html', 'rites.html', 'offres.html', 'professionnels.html',
  'contact.html', 'application.html', 'sw.js', 'assets/js/application.js', 'rejoindre.html', 'compte.html', 'espace.html', 'dashboard-partenaire.html', 'dashboard-master.html', 'dashboard-commercial.html',
  'chanson-hommage.html', 'qr-code-memorial.html',
  'mentions-legales.html', 'cgv.html', 'confidentialite.html', '404.html',
  'assets/css/style.css', 'assets/css/dashboard.css',
  'assets/js/main.js', 'assets/js/catalogue.js', 'assets/js/order.js', 'assets/js/atelier-music.js',
  'assets/js/content.js', 'assets/js/proprietaire.js', 'assets/js/intranet.js', 'assets/js/livraison.js', 'assets/js/rappel.js', 'assets/js/commercial.js', 'assets/js/courrier.js', 'assets/js/ornements.js', 'api/lead.js', 'api/prospects.js', 'assets/data/content.json',
  'api/_courrier.js', 'api/famille.js', 'api/prospect-mail.js',
  'assets/js/auth.js', 'assets/js/config.js', 'assets/js/candidature.js', 'assets/js/espace.js',
  'assets/img/logo-melodia.jpg', 'assets/img/logo-melodia-complet.jpg', 'assets/img/logo-melodia-anime.mp4',
  'assets/img/plaque-qr-700.webp', 'assets/img/plaque-qr-700.jpg',
  'assets/img/plaque-qr-1100.webp', 'assets/img/plaque-qr-1100.jpg',
  'assets/img/og-melodia.jpg', 'assets/img/intro-logo.jpg', 'assets/img/maxime.png', 'assets/img/hyper-engine.png', 'assets/img/equipe.jpg', 'favicon.ico', 'site.webmanifest',
  'assets/img/icons/icon-192.png', 'assets/img/icons/icon-512.png',
  'assets/img/icons/icon-180.png', 'assets/img/icons/maskable-512.png',
  'api/generate-music.js', 'api/music-status.js', 'api/music-config.js', 'api/generate-lyrics.js',
  'vercel.json', 'robots.txt', 'sitemap.xml'
];

/* Les hommages étaient listés à la main, et la liste avait pris du
   retard : sept fichiers y figuraient pour dix-sept réellement servis.
   Un catalogue qui grandit à chaque commande ne se tient pas à jour à
   la main — on relit donc ce que le contenu publié référence vraiment,
   ce qui vérifie du même coup que rien n'y pointe dans le vide. */
function audiosDuCatalogue() {
  try {
    const c = JSON.parse(fs.readFileSync('assets/data/content.json', 'utf8'));
    return [...new Set((c.demos || []).map((d) => d.audio).filter((a) => a && !/^https?:/i.test(a)))];
  } catch (e) {
    console.error('  ILLISIBLE assets/data/content.json —', e.message);
    return [];
  }
}
const audios = audiosDuCatalogue();
if (!audios.length) console.error('  ATTENTION aucun hommage trouvé dans le catalogue');
files.push(...audios);

let ok = true;
for (const f of files) {
  if (fs.existsSync(f)) console.log('  ok  ', f);
  else { console.error('  MANQUE', f); ok = false; }
}

/* Deux hommages portant le même titre : les cartes du catalogue
   deviennent indiscernables, et le balisage ItemList annonce deux fois
   le même nom. C'est arrivé une fois, en ajoutant un morceau dont le
   fichier portait déjà le titre d'un autre — d'où ce garde-fou. */
try {
  const cat = JSON.parse(fs.readFileSync('assets/data/content.json', 'utf8')).demos || [];
  const vus = new Map();
  for (const d of cat) {
    const cle = (d.title || '').trim().toLowerCase();
    if (!cle) continue;
    if (vus.has(cle)) {
      console.error(`  DOUBLON titre « ${d.title} » : ${vus.get(cle)} et ${d.id}`);
      ok = false;
    } else vus.set(cle, d.id);
  }
} catch (e) { /* l'illisibilité est déjà signalée plus haut */ }

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

/* ─── Le prix du service QR, à deux endroits ───
   « build/data.js » fabrique la case à cocher du tunnel de commande ;
   « assets/js/memorial.js » affiche le même tarif aux partenaires. Un
   prix changé d'un seul côté ferait payer 79 € à une famille pendant
   qu'une agence en facturerait 99 — et personne ne s'en apercevrait
   avant la première réclamation. On compare, et on refuse de passer. */
try {
  const donnees = fs.readFileSync('build/data.js', 'utf8');
  const module_ = fs.readFileSync('assets/js/memorial.js', 'utf8');
  const a = donnees.match(/id:\s*'plaque',\s*prix:\s*(\d+)/);
  const b = module_.match(/var PRIX_QR = (\d+)/);
  if (!a || !b) {
    console.error('  PRIX QR introuvable', a ? 'dans memorial.js' : 'dans data.js');
    ok = false;
  } else if (a[1] !== b[1]) {
    console.error('  ÉCART DE PRIX  service QR : ' + a[1] + ' € dans data.js, ' + b[1] + ' € dans memorial.js');
    ok = false;
  } else {
    console.log('  ok   service QR à ' + a[1] + ' €, identique des deux côtés');
  }
} catch (e) { console.error('  vérification du prix QR impossible :', e.message); ok = false; }

/* Le message de fin doit dire ce qui ne va pas. « Des fichiers
   manquent » sur un écart de tarif envoie chercher au mauvais
   endroit. */
console.log(ok ? '\nSite complet, liens internes valides.'
                : '\nLa vérification a échoué — voir les lignes ci-dessus.');
process.exit(ok ? 0 : 1);
