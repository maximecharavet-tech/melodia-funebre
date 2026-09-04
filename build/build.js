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
        file: d.audio, story: d.story, lyrics: d.lyrics, brief: d.brief
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
const pages = ['p-index', 'p-processus', 'p-demos', 'p-offres', 'p-agences', 'p-contact', 'p-compte', 'p-404'];

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
