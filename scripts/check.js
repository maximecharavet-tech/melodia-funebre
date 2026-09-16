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
                         ['documents/melodia-manuel-de-vente.pdf', 200],
                         ['documents/melodia-plan-linkedin.pdf', 200],
                         ['documents/melodia-plan-reseaux-sociaux.pdf', 200]]) {
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

/* Le QR de démonstration doit être là, et être un vrai QR.
   Il est encodé à la génération ; la première fois, « fs » n'était pas
   importé dans parts.js, le bloc sortait vide et un catch muet ne
   disait rien. Une page qui invite à scanner un code absent est pire
   que pas de section du tout. */
{
  const porteuses = ['index.html', 'professionnels.html', 'qr-code-memorial.html'].filter((f) => fs.existsSync(f));
  const sans = porteuses.filter((f) => {
    const h = fs.readFileSync(f, 'utf8');
    const m = h.match(/<div class="chaine-qr">([\s\S]*?)<\/div>/);
    return !m || !/<path[^>]+d="M/.test(m[1]);
  });
  if (sans.length) {
    console.error('  QR de démonstration absent ou vide : ' + sans.join(', '));
    ok = false;
  } else if (porteuses.length) {
    console.log(`  ok   QR de démonstration présent sur ${porteuses.length} pages`);
  }
}

/* Le service worker doit précharger de quoi afficher une page.
   Sa liste est moissonnée dans index.html : le jour où les chemins
   sont passés en absolu, la moisson n'a plus rien trouvé et le site
   hors ligne se serait ouvert sans style. Une liste vide ne se voit
   nulle part — sauf ici. */
try {
  const sw = fs.readFileSync('sw.js', 'utf8');
  const m = sw.match(/const PRECHARGE = \[([\s\S]*?)\];/);
  const liste = m ? JSON.parse('[' + m[1] + ']') : [];
  const actifs = liste.filter((u) => /^\/assets\//.test(u));
  if (actifs.length < 5) {
    console.error(`  sw.js ne précharge que ${actifs.length} actif(s) — la moisson dans index.html a échoué`);
    ok = false;
  } else {
    console.log(`  ok   sw.js précharge ${liste.length} adresses, dont ${actifs.length} actifs`);
  }
} catch (e) { console.error('  sw.js illisible — ' + e.message); ok = false; }

/* Aucun chemin d'actif relatif, nulle part.
   Trois pages ne vivent pas à la racine : « /m/<jeton> » pour la page
   mémorielle, « /ecouter/<titre> » pour chaque œuvre. « assets/css/
   style.css » y désigne « /m/assets/css/style.css ». La page arrive
   alors en texte brut, sans une ligne de style — c'est exactement ce
   qui est arrivé, et cela n'a été vu qu'en production, sur la page
   qu'ouvre un QR code devant une tombe.

   Le contrôle vaut pour toutes les pages : une page aujourd'hui à la
   racine peut être réécrite demain, et le défaut ne se voit jamais
   avant d'être en ligne. */
{
  const aVerifier = new Set(files.filter((f) => f.endsWith('.html')));
  for (const f of fs.readdirSync('.')) if (/\.html$/.test(f)) aVerifier.add(f);
  const fautives = [];
  for (const f of aVerifier) {
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    const n = (html.match(/\s(?:href|src|srcset|data-src)="(?:assets|audio)\//g) || []).length;
    if (n) fautives.push(`${f} (${n})`);
  }
  if (fautives.length) {
    console.error('  CHEMINS RELATIFS vers les actifs — ils casseront sous /m/ ou /ecouter/ :');
    fautives.forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log(`  ok   ${aVerifier.size} pages, aucun chemin d'actif relatif`);
  }
}

/* Chaque empreinte doit correspondre au fichier qu'elle désigne.
   Les feuilles de style et les scripts sont servis « immutable » pour un
   an : l'empreinte dans leur adresse est la seule chose qui dit à un
   navigateur qu'il faut les recharger. Elle a déjà été figée une fois —
   le jour où les chemins sont devenus absolus, l'expression qui la
   réécrivait dans les cinq consoles ne correspondait plus, et personne
   ne l'a vu : une page marquée d'une empreinte périmée s'affiche très
   bien chez qui ne l'avait jamais ouverte. */
{
  const crypto = require('crypto');
  const periculum = [];
  const aVerifier = new Set(files.filter((f) => f.endsWith('.html')));
  for (const f of fs.readdirSync('.')) if (/\.html$/.test(f)) aVerifier.add(f);
  let n = 0;
  for (const f of aVerifier) {
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/\/(assets\/(?:css|js|img)\/[a-z0-9./-]+)\?v=([a-f0-9]+)/gi)) {
      const [, actif, marque] = m;
      if (!fs.existsSync(actif)) continue;
      const vrai = crypto.createHash('sha1').update(fs.readFileSync(actif)).digest('hex').slice(0, 8);
      n++;
      if (vrai !== marque) periculum.push(`${f} → ${actif} porte ?v=${marque}, le fichier vaut ${vrai}`);
    }
  }
  if (periculum.length) {
    console.error('  EMPREINTES PÉRIMÉES — ces actifs resteront en cache un an :');
    [...new Set(periculum)].forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log(`  ok   ${n} empreintes d'actifs à jour`);
  }
}

/* Deux registres ne doivent jamais porter le même emblème : ce serait
   pire que pas d'emblème du tout, puisque le lecteur y lirait une
   parenté qui n'existe pas. Le repli à la note ne compte pas — il est
   fait pour être partagé par tous les registres sans dessin. */
{
  const { GLYPHES } = require('../build/glyphes.js');
  const vus = new Map();
  const jumeaux = [];
  for (const [nom, d] of Object.entries(GLYPHES)) {
    if (vus.has(d)) jumeaux.push(vus.get(d) + ' et ' + nom);
    else vus.set(d, nom);
  }
  if (jumeaux.length) {
    console.error('  EMBLÈMES EN DOUBLE :');
    jumeaux.forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log(`  ok   ${Object.keys(GLYPHES).length} emblèmes, tous distincts`);
  }
}

/* Un registre du catalogue doit être proposé à la commande.
   Trois l'avaient cessé : soul jazz, musette et country americana
   avaient été ajoutés aux œuvres sans l'être à la liste des styles.
   Une famille pouvait donc entendre une musette sur le site sans
   pouvoir en commander une — et rien ne le signalait. */
{
  const { STYLES } = require('../build/data.js');
  const c = JSON.parse(fs.readFileSync('assets/data/content.json', 'utf8'));
  const duCatalogue = [...new Set((c.demos || [])
    .filter((d) => d.visible !== false).map((d) => d.style).filter(Boolean))];
  const html = fs.existsSync('demos.html') ? fs.readFileSync('demos.html', 'utf8') : '';
  /* Le nom est cherché tel que la page l'ÉCRIT, pas tel qu'il est
     stocké : « R&B » y devient « R&amp;B », et un contrôle naïf
     accusait la page d'un défaut qu'elle n'avait pas. */
  const ech = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const absents = duCatalogue.filter((st) => !html.includes('>' + ech(st) + '<'));
  if (absents.length) {
    console.error('  REGISTRE NON PROPOSÉ — au catalogue, absent de /demos :');
    absents.forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log(`  ok   ${duCatalogue.length} registres du catalogue, tous proposés ` +
                `(${STYLES.length} dans la liste de départ)`);
  }
}

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
