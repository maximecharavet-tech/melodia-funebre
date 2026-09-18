/* ═══════════════════════════════════════════════════════════════
   Génération des pages statiques du site.

       npm run build

   Les pages HTML sont produites ici, à partir de partitions communes :
   une seule navigation, un seul pied de page, un seul en-tête. Les
   modifier à la main dans les .html fonctionne, mais la prochaine
   génération écrasera ces retouches — le bon endroit est ce dossier.

   Le contenu éditable (démos, tarifs, témoignages, questions) est repris
   de assets/data/content.json quand il existe, afin que le HTML servi
   corresponde à ce qui a été publié depuis le mode propriétaire.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RACINE = path.resolve(__dirname, '..');
const data = require('./data.js');

/* ─── Reprise du contenu publié ─── */
const fichierContenu = path.join(RACINE, 'assets/data/content.json');
if (fs.existsSync(fichierContenu)) {
  try {
    const c = JSON.parse(fs.readFileSync(fichierContenu, 'utf8'));
    const visibles = l => (l || []).filter(x => x.visible !== false);

    if (c.demos) {
      data.TRACKS.length = 0;
      visibles(c.demos).forEach(d => data.TRACKS.push({
        id: d.id, title: d.title, who: d.who, lieu: d.lieu, style: d.style,
        file: d.audio, story: d.story, lyrics: d.lyrics, brief: d.brief,
        photo: d.photo || '', mention: d.mention || '',
        /* « vivant » range l'œuvre sur /de-son-vivant plutôt que dans le
           catalogue des hommages. Ce ne sont pas les mêmes objets : un
           hommage est écrit SUR quelqu'un après sa mort, un message de
           son vivant est écrit PAR quelqu'un, pour le jour où il ne
           sera plus là. Les mélanger dans une même grille rendrait les
           deux incompréhensibles. Champ absent = hommage. */
        categorie: d.categorie || 'hommage'
      }));
    }
    if (c.offers) {
      data.OFFERS.length = 0;
      c.offers.forEach(o => data.OFFERS.push({
        name: o.name, price: o.price, desc: o.desc,
        featured: !!o.featured, tag: o.tag || '', feats: o.feats || [], muted: o.muted || []
      }));
    }
    if (c.testimonials) {
      data.TESTIS.length = 0;
      visibles(c.testimonials).forEach(t => data.TESTIS.push({ t: t.text, w: t.who }));
    }
    if (c.faq) {
      data.FAQ.length = 0;
      visibles(c.faq).forEach(f => data.FAQ.push({ q: f.q, a: f.a }));
    }
    console.log('  contenu repris de assets/data/content.json');
  } catch (e) {
    console.warn('  content.json illisible, on garde les valeurs par défaut :', e.message);
  }
}

/* ─── Génération ─── */
const { page } = require('./gen.js');
const pages = ['p-index', 'p-processus', 'p-demos', 'p-rites', 'p-offres', 'p-vivant', 'p-agences', 'p-maison', 'p-hyper', 'p-rejoindre', 'p-contact', 'p-application', 'p-compte', 'p-404'];

let total = 0;
for (const m of pages) {
  const p = require('./' + m + '.js');
  const html = page(p);
  fs.writeFileSync(path.join(RACINE, p.file), html);
  total += html.length;
  console.log('  ' + p.file.padEnd(22) + html.length + ' octets');
}
/* Les trois grappes de pages de requête entrent ici : treize pages
   qui répondent chacune à une intention de recherche distincte. Elles
   partagent un gabarit et aucun contenu — scripts/check.js refuse
   qu'elles se ressemblent. */
for (const module of ['./p-legal.js', './p-guides.js',
                      './p-chansons.js', './p-fabrication.js',
                      './p-ceremonie.js', './p-memoire.js']) {
  for (const p of require(module)) {
    const html = page(p);
    fs.writeFileSync(path.join(RACINE, p.file), html);
    total += html.length;
    console.log('  ' + p.file.padEnd(22) + html.length + ' octets');
  }
}

/* Les pages d'écoute, une par hommage. Elles sont nombreuses et se
   ressemblent : on les compte plutôt que de les lister ligne à ligne,
   sans quoi la sortie de la génération devient illisible. */
const ecoutes = require('./p-ecouter.js');
let octetsEcoute = 0;
for (const p of ecoutes) {
  const html = page(p);
  fs.writeFileSync(path.join(RACINE, p.file), html);
  octetsEcoute += html.length;
}
total += octetsEcoute;

/* Une œuvre renommée change d'adresse, et l'ancienne page reste sur le
   disque : elle continue d'être servie, hors du plan du site, avec un
   contenu qui ne bougera plus. C'est arrivé dès le premier renommage.
   On efface donc ce qui n'a pas été régénéré — et uniquement cela. */
const attendues = new Set(ecoutes.map((p) => p.file));
let effacees = 0;
for (const f of fs.readdirSync(RACINE)) {
  if (!/^ecouter-.+\.html$/.test(f) || attendues.has(f)) continue;
  fs.unlinkSync(path.join(RACINE, f));
  effacees++;
  console.log('  retirée               ' + f);
}
console.log('  ' + ('ecouter-*.html (' + ecoutes.length + ')').padEnd(22) + octetsEcoute + ' octets' +
            (effacees ? '  · ' + effacees + ' orpheline' + (effacees > 1 ? 's' : '') + ' retirée' + (effacees > 1 ? 's' : '') : ''));
console.log('  ' + String(total).padStart(28) + ' octets au total');

/* ─── Empreintes sur les consoles ───
   Les trois tableaux de bord sont des fichiers autonomes, écrits à la
   main, que le générateur ne produit pas. Leurs scripts n'avaient donc
   aucune empreinte, alors que les pages générées en avaient : une
   console pouvait tourner sur un auth.js gardé en cache pendant que la
   page de connexion en servait un neuf. Les deux ne s'accordaient plus
   sur le rôle, et se renvoyaient l'une à l'autre indéfiniment.

   On réécrit donc leurs adresses d'actifs à la construction, comme
   pour le reste du site. */
const { versionne, empreinterImages } = require('./gen.js');
const CONSOLES = ['dashboard-master.html', 'dashboard-partenaire.html', 'dashboard-commercial.html', 'espace.html', 'hommage.html'];
let marquees = 0;
for (const f of CONSOLES) {
  const chemin = path.join(RACINE, f);
  if (!fs.existsSync(chemin)) continue;
  const avant = fs.readFileSync(chemin, 'utf8');
  /* Les chemins deviennent absolus, comme pour les pages générées.
     Ce n'est pas cosmétique : « hommage.html » est servi à
     « /m/<jeton> » par une réécriture, et « assets/css/style.css » y
     désignait « /m/assets/css/style.css ». La page qu'ouvre un QR code
     devant une tombe arrivait donc sans une ligne de style et sans
     JavaScript — jamais vu, parce qu'on l'ouvrait toujours par son nom
     de fichier. */
  /* Le « /? » n'est pas décoratif. Depuis que les chemins sont rendus
     absolus, ces pages portent « /assets/css/… » : sans lui, plus rien
     ne correspondait et l'empreinte restait figée sur celle du jour où
     la ligne avait été écrite. Les actifs sont servis « immutable » —
     une empreinte figée, c'est un navigateur qui garde un an la
     feuille de style d'avant. */
  const apres = empreinterImages(avant.replace(
    /(src|href)="\/?(assets\/(?:js|css)\/[a-z0-9.-]+\.(?:js|css))(\?v=[a-f0-9]+)?"/g,
    (_, attr, actif) => attr + '="/' + versionne(actif) + '"'))
    .replace(/(\s(?:src|href|data-src)=")(assets\/|audio\/)/g, '$1/$2');
  if (apres !== avant) { fs.writeFileSync(chemin, apres); marquees++; }
}

/* Le manifeste désigne les icônes de l'application installée. Elles sont
   servies « immutable » comme le reste des images : sans empreinte, un
   téléphone qui a ajouté le site à son écran d'accueil garderait
   l'ancienne icône. Le manifeste, lui, n'est pas mis en cache. */
const MANIF = path.join(RACINE, 'site.webmanifest');
if (fs.existsSync(MANIF)) {
  const avant = fs.readFileSync(MANIF, 'utf8');
  const apres = avant.replace(
    /\/(assets\/img\/(?:[a-z0-9-]+\/)?[a-z0-9._-]+\.(?:jpe?g|png|webp|svg))(\?v=[a-f0-9]+)?/gi,
    (_, chemin) => '/' + versionne(chemin));
  if (apres !== avant) { fs.writeFileSync(MANIF, apres); console.log('  manifeste             icônes marquées'); }
}
console.log('  consoles marquées      ' + marquees + ' / ' + CONSOLES.length);

/* ─── Le travailleur de service ───
   Sa version est l'empreinte de ce qu'il met en cache : à chaque
   déploiement qui change une page ou une ressource, le nom des caches
   change, et les anciens sont effacés à l'activation. Sans cela, une
   correction urgente resterait invisible pour qui a déjà installé
   l'application. */
{
  const modele = fs.readFileSync(path.join(__dirname, 'sw-modele.js'), 'utf8');

  /* La coquille : les pages publiques et ce qu'il faut pour les
     afficher. Ni les consoles, ni l'espace des familles, ni les pages
     mémoriales — elles montrent des données qui changent. */
  const pagesCoquille = [
    'index.html', 'professionnels.html', 'offres.html', 'processus.html',
    'demos.html', 'rites.html', 'contact.html', 'chanson-hommage.html',
    'qr-code-memorial.html', 'musique-obseques.html', '404.html'
  ].filter((f) => fs.existsSync(path.join(RACINE, f)));

  /* On lit dans l'accueil déjà construit les adresses à empreinte
     qu'il charge : les recopier à la main, c'est les laisser dériver. */
  const accueil = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');
  /* La barre oblique du début est devenue obligatoire le jour où les
     chemins sont passés en absolu : sans elle, cette moisson ne
     trouvait plus rien et le service worker partait avec zéro actif —
     un site hors ligne s'ouvrant sans style, c'est-à-dire la panne
     qu'on venait de corriger, déplacée. */
  const actifs = [...new Set(
    [...accueil.matchAll(/(?:src|href)="(\/assets\/(?:css|js|img)\/[^"]+)"/g)].map((m) => m[1])
  )].filter((u) => !/config\.js/.test(u));

  if (!actifs.length) {
    console.error('  ATTENTION le service worker ne précharge aucun actif — la moisson dans index.html n’a rien trouvé');
  }

  const liste = [
    '/', ...pagesCoquille.map((f) => '/' + f.replace(/\.html$/, '')),
    ...actifs, '/site.webmanifest',
    '/assets/img/icons/icon-192.png', '/assets/img/icons/icon-512.png'
  ];

  const empreinte = crypto.createHash('sha1')
    .update(liste.join('|'))
    .update(fs.readFileSync(path.join(RACINE, 'index.html')))
    .update(modele)
    .digest('hex').slice(0, 10);

  const sortie = modele
    .replace('__VERSION__', empreinte)
    .replace('__PRECHARGE__', JSON.stringify(liste, null, 2));
  fs.writeFileSync(path.join(RACINE, 'sw.js'), sortie);
  console.log('  sw.js                 version ' + empreinte + ', ' + liste.length + ' adresses préchargées');
}

/* ─── Plan du site ───
   Écrit à la génération plutôt que tenu à la main : un plan qui date
   d'une refonte précédente envoie les robots sur des pages disparues
   et tait celles qui viennent d'être créées. La date de dernière
   modification vient du fichier lui-même, ce qui la rend juste sans
   que personne ait à y penser. */
const SITE_URL = 'https://melodia-funebre.fr';
const PLAN = [
  ['index.html', '1.0', 'weekly'],
  ['offres.html', '1.0', 'monthly'],
  /* Le second marché de la maison : la même œuvre, commandée pendant
     que la personne est encore là. Priorité haute — c'est la seule
     page du site dont la demande peut être suscitée. */
  ['de-son-vivant.html', '0.9', 'monthly', '/de-son-vivant'],
  ['demos.html', '0.9', 'weekly'],
  ['processus.html', '0.9', 'monthly'],
  ['rites.html', '0.9', 'monthly'],
  ['professionnels.html', '1.0', 'monthly'],
  ['qui-sommes-nous.html', '0.8', 'monthly'],
  ['musique-obseques.html', '0.9', 'monthly'],
  ['musique-sacem-obseques.html', '0.8', 'monthly'],
  ['musique-cremation.html', '0.8', 'monthly'],
  ['chanson-hommage.html', '0.9', 'monthly'],
  ['qr-code-memorial.html', '0.9', 'monthly'],
  /* Les treize pages de requête. Priorité 0,8 : elles visent
     l'acquisition, mais restent en dessous des pages qui portent
     l'offre elle-même. Le nom du fichier suffit à donner l'adresse,
     « cleanUrls » retirant l'extension. */
  ['chanson-hommage-defunt.html', '0.8', 'monthly'],
  ['chanson-personnalisee-defunt.html', '0.8', 'monthly'],
  ['chanson-pour-obseques.html', '0.8', 'monthly'],
  ['chanson-funeraire-personnalisee.html', '0.8', 'monthly'],
  ['musique-personnalisee-obseques.html', '0.8', 'monthly'],
  ['musique-personnalisee-defunt.html', '0.8', 'monthly'],
  ['creer-chanson-pour-defunt.html', '0.8', 'monthly'],
  ['composer-chanson-pour-defunt.html', '0.8', 'monthly'],
  ['hommage-musical-defunt.html', '0.8', 'monthly'],
  ['hommage-musical-obseques.html', '0.8', 'monthly'],
  ['musique-pour-hommage-funeraire.html', '0.8', 'monthly'],
  ['chanson-dernier-hommage.html', '0.8', 'monthly'],
  ['dernier-hommage-musical.html', '0.8', 'monthly'],
  ['rejoindre.html', '0.8', 'monthly'],
  ['contact.html', '0.7', 'yearly'],
  ['application.html', '0.6', 'monthly'],
  ['cgv.html', '0.4', 'yearly'],
  ['mentions-legales.html', '0.3', 'yearly'],
  ['confidentialite.html', '0.3', 'yearly']
];

/* Les pages d'écoute entrent au plan : ce sont elles qu'on partage et
   qu'un moteur doit pouvoir proposer quand quelqu'un cherche « chanson
   pour un pêcheur » ou « hommage en polyphonie corse ». Elles sont
   ajoutées ici, après coup, pour que la liste écrite à la main reste
   lisible. */
for (const p of ecoutes) PLAN.push([p.file, '0.7', 'monthly', p.url]);
/* La page de connexion et l'espace des familles sont hors du plan :
   ils portent « noindex », et lister dans son plan une page qu'on
   demande de ne pas indexer est une contradiction que les moteurs
   relèvent. */

/* ─── La date de dernière modification ───
   Elle venait de la date du fichier. Mais chaque génération réécrit
   les onze pages, même celles dont pas un octet ne change : le plan
   annonçait donc onze pages modifiées à chaque déploiement. Un plan
   qui crie au changement tout le temps ne dit plus rien, et les
   moteurs finissent par ignorer sa date — exactement ce qu'on ne
   veut pas.

   La date suit maintenant le contenu : on garde l'empreinte de
   chaque page d'une génération à l'autre, et la date ne bouge que
   si l'empreinte bouge. Le registre est versionné, pour que la
   date soit la même quelle que soit la machine qui génère. */
const REGISTRE = path.join(__dirname, 'dates-sitemap.json');
let dates = {};
try { dates = JSON.parse(fs.readFileSync(REGISTRE, 'utf8')); } catch (e) { dates = {}; }
const aujourdhui = new Date().toISOString().slice(0, 10);

const entrees = PLAN.map(([f, prio, freq, adresse]) => {
  const chemin = path.join(RACINE, f);
  let quand = aujourdhui;
  if (fs.existsSync(chemin)) {
    const empreinte = crypto.createHash('sha1')
      .update(fs.readFileSync(chemin)).digest('hex');
    const connu = dates[f];
    quand = (connu && connu.empreinte === empreinte) ? connu.date : aujourdhui;
    dates[f] = { empreinte: empreinte, date: quand };
  }
  /* L'adresse annoncée doit être celle de la balise canonique de la
     page. Les pages d'écoute sont servies à « /ecouter/<titre> » par
     une réécriture : annoncer « /ecouter-<titre> » dans le plan aurait
     donné un plan qui contredit chaque page qu'il liste. */
  const url = adresse ? SITE_URL + adresse
                      : SITE_URL + '/' + (f === 'index.html' ? '' : f.replace('.html', ''));
  return `  <url><loc>${url}</loc><lastmod>${quand}</lastmod>` +
         `<changefreq>${freq}</changefreq><priority>${prio}</priority></url>`;
}).join('\n');

fs.writeFileSync(path.join(RACINE, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entrees + '\n</urlset>\n');
fs.writeFileSync(REGISTRE, JSON.stringify(dates, null, 2) + '\n');
console.log('  sitemap.xml            ' + PLAN.length + ' adresses');
