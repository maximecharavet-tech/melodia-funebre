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
        photo: d.photo || '', mention: d.mention || ''
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
const pages = ['p-index', 'p-processus', 'p-demos', 'p-rites', 'p-offres', 'p-agences', 'p-contact', 'p-compte', 'p-404'];

let total = 0;
for (const m of pages) {
  const p = require('./' + m + '.js');
  const html = page(p);
  fs.writeFileSync(path.join(RACINE, p.file), html);
  total += html.length;
  console.log('  ' + p.file.padEnd(22) + html.length + ' octets');
}
for (const p of require('./p-legal.js')) {
  const html = page(p);
  fs.writeFileSync(path.join(RACINE, p.file), html);
  total += html.length;
  console.log('  ' + p.file.padEnd(22) + html.length + ' octets');
}
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
const { versionne } = require('./gen.js');
const CONSOLES = ['dashboard-master.html', 'dashboard-partenaire.html', 'dashboard-commercial.html'];
let marquees = 0;
for (const f of CONSOLES) {
  const chemin = path.join(RACINE, f);
  if (!fs.existsSync(chemin)) continue;
  const avant = fs.readFileSync(chemin, 'utf8');
  const apres = avant.replace(
    /(src|href)="(assets\/(?:js|css)\/[a-z0-9.-]+\.(?:js|css))(\?v=[a-f0-9]+)?"/g,
    (_, attr, actif) => attr + '="' + versionne(actif) + '"');
  if (apres !== avant) { fs.writeFileSync(chemin, apres); marquees++; }
}
console.log('  consoles marquées      ' + marquees + ' / ' + CONSOLES.length);

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
  ['demos.html', '0.9', 'weekly'],
  ['processus.html', '0.9', 'monthly'],
  ['rites.html', '0.9', 'monthly'],
  ['agences.html', '0.9', 'monthly'],
  ['contact.html', '0.7', 'yearly'],
  ['cgv.html', '0.4', 'yearly'],
  ['mentions-legales.html', '0.3', 'yearly'],
  ['confidentialite.html', '0.3', 'yearly']
];
/* La page de connexion est hors du plan : elle est interdite aux
   robots dans robots.txt, l'y lister serait se contredire. */
const entrees = PLAN.map(([f, prio, freq]) => {
  const chemin = path.join(RACINE, f);
  const quand = fs.existsSync(chemin)
    ? fs.statSync(chemin).mtime.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const url = SITE_URL + '/' + (f === 'index.html' ? '' : f.replace('.html', ''));
  return `  <url><loc>${url}</loc><lastmod>${quand}</lastmod>` +
         `<changefreq>${freq}</changefreq><priority>${prio}</priority></url>`;
}).join('\n');

fs.writeFileSync(path.join(RACINE, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entrees + '\n</urlset>\n');
console.log('  sitemap.xml            ' + PLAN.length + ' adresses');
