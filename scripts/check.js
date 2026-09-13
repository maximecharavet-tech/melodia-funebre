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

/* Les deux documents imprimés sont servis en statique et référencés
   par les consoles. Un lien qui télécharge une page 404 se voit à
   l'ouverture du fichier, jamais avant — d'où ce contrôle, qui vérifie
   aussi que le PDF n'est pas un fichier vide de zéro octet. */
for (const [f, mini] of [['documents/melodia-brochure-partenaire.pdf', 400],
                         ['documents/melodia-manuel-de-vente.pdf', 200]]) {
  if (!fs.existsSync(f)) {
    console.error(`  MANQUE ${f} — relancez « npm run pdf »`);
    ok = false;
  } else {
    const ko = Math.round(fs.statSync(f).size / 1024);
    if (ko < mini) { console.error(`  SUSPECT ${f} ne pèse que ${ko} Ko`); ok = false; }
    else console.log(`  ok   ${f} (${ko} Ko)`);
  }
}

/* Chaque œuvre a sa vignette d'aperçu. Sans elle, un lien partagé
   s'affiche sans image dans le fil — c'est-à-dire qu'il ne s'affiche
   pas. Le défaut est invisible sur le site : il ne se voit qu'une fois
   le lien posté, trop tard. */
try {
  const cat = JSON.parse(fs.readFileSync('assets/data/content.json', 'utf8')).demos || [];
  const { adresses } = require('../build/adresses.js');
  const visibles = cat.filter((d) => d.visible !== false);
  const slugs = adresses(visibles);
  const manquantes = slugs.filter((s) => !fs.existsSync('assets/img/partage/' + s + '.jpg'));
  if (manquantes.length) {
    console.error(`  MANQUE ${manquantes.length} vignette(s) de partage — relancez « npm run partage »`);
    manquantes.slice(0, 5).forEach((s) => console.error('         assets/img/partage/' + s + '.jpg'));
    ok = false;
  } else {
    console.log(`  ok   ${slugs.length} vignettes de partage`);
  }
} catch (e) { console.error('  vignettes de partage : ' + e.message); ok = false; }

/* Aucune page ne doit partir avec un lien mort vers une page du site. */
const pages = files.filter(f => f.endsWith('.html'));
/* Toutes les pages du dépôt, pas seulement celles de la liste : les
   dix-huit pages d'écoute sont générées et ne sont pas énumérées. */
for (const f of fs.readdirSync('.')) if (/^ecouter-.+\.html$/.test(f)) pages.push(f);
const internes = new Set(pages);
for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  const liens = [...html.matchAll(/href="([^"#?:]+\.html)/g)].map(m => m[1]);
  for (const l of new Set(liens)) {
    if (!internes.has(l) && !fs.existsSync(l)) { console.error('  LIEN MORT', p, '->', l); ok = false; }
  }

  /* Les liens « /ecouter/<titre> » n'ont pas d'extension : le contrôle
     ci-dessus ne les voyait pas, et une adresse fautive serait partie
     sans bruit — c'est exactement ce qui est arrivé au premier
     renommage. La réécriture de vercel.json les sert depuis le fichier
     « ecouter-<titre>.html », qu'on vérifie donc ici. */
  const ecoutes = [...html.matchAll(/href="\/ecouter\/([a-z0-9-]+)"/g)].map(m => m[1]);
  for (const e of new Set(ecoutes)) {
    if (!fs.existsSync('ecouter-' + e + '.html')) {
      console.error(`  LIEN MORT ${p} -> /ecouter/${e} (ecouter-${e}.html est absent)`);
      ok = false;
    }
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
