/* ═══════════════════════════════════════════════════════════════
   llms-full.txt — le texte du site, d'un seul tenant.

   llms.txt résume la maison en quelques écrans ; ce fichier-ci donne
   aux systèmes qui lisent le web pour répondre à des questions le
   texte intégral des pages publiques, sans navigation, sans script,
   sans mise en page. Il est produit à chaque génération à partir des
   pages elles-mêmes : il ne peut donc rien affirmer que les pages
   n'affichent pas, et il ne vieillit pas à côté d'elles.

   Sont exclues les pages qui n'ont rien à apprendre à un lecteur
   (mentions légales, confidentialité) : elles restent au plan du site.
   ═══════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');

const EXCLUES = new Set(['mentions-legales.html', 'confidentialite.html']);

const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘',
  laquo: '«', raquo: '»', hellip: '…', mdash: '—', ndash: '–', eacute: 'é', egrave: 'è', agrave: 'à',
  ccedil: 'ç', ecirc: 'ê', ocirc: 'ô', euro: '€', middot: '·', times: '×' };
function decoder(t) {
  return t.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
          .replace(/&([a-z]+);/gi, (m, n) => (ENTITES[n.toLowerCase()] !== undefined ? ENTITES[n.toLowerCase()] : m));
}

function texte(html) {
  let m = (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/) || [])[1] || '';
  m = m.replace(/<(script|style|svg|noscript|template|form|button|select|audio|video|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
       .replace(/<!--[\s\S]*?-->/g, ' ')
       /* Ce qui est caché aux lecteurs d'écran est décoratif. */
       .replace(/<(\w+)\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  m = m.replace(/<h1\b[^>]*>/gi, '\n\n# ').replace(/<h2\b[^>]*>/gi, '\n\n## ')
       .replace(/<h3\b[^>]*>/gi, '\n\n### ').replace(/<h[4-6]\b[^>]*>/gi, '\n\n#### ')
       .replace(/<\/h[1-6]>/gi, '\n\n')
       .replace(/<li\b[^>]*>/gi, '\n- ').replace(/<dt\b[^>]*>/gi, '\n- ').replace(/<dd\b[^>]*>/gi, ' : ')
       .replace(/<summary\b[^>]*>/gi, '\n\n### ').replace(/<\/summary>/gi, '\n\n')
       .replace(/<(br|hr)\b[^>]*>/gi, '\n')
       .replace(/<\/(p|div|section|article|figure|figcaption|blockquote|ul|ol|dl|tr|table|header|footer|details)>/gi, '\n\n')
       .replace(/<[^>]+>/g, ' ');
  m = decoder(m);
  return m.split('\n')
    .map((l) => l.replace(/[ \t\u00a0\u202f]+/g, ' ').trim())
    .join('\n')
    /* Restes d'interface : compteur du lecteur, boutons de partage. */
    .replace(/^(—:—|[0-9]+:[0-9]{2}|Partager|Lire|Pause)$/gm, '')
    .replace(/^- *$/gm, '')
    .replace(/^(#+) *$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = function llmsFull(PLAN, RACINE, SITE_URL) {
  const blocs = [];
  for (const [f, , , adresse] of PLAN) {
    if (EXCLUES.has(f)) continue;
    const chemin = path.join(RACINE, f);
    if (!fs.existsSync(chemin)) continue;
    const html = fs.readFileSync(chemin, 'utf8');
    if (/<meta name="robots" content="noindex/.test(html)) continue;
    const url = adresse ? SITE_URL + adresse
                        : SITE_URL + '/' + (f === 'index.html' ? '' : f.replace('.html', ''));
    const titre = decoder((html.match(/<title>([^<]*)<\/title>/) || [])[1] || f);
    const desc = decoder((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
    const corps = texte(html);
    if (!corps) continue;
    blocs.push('---\n\n' + 'Page : ' + titre + '\nAdresse : ' + url + (desc ? '\nRésumé : ' + desc : '') +
               '\n\n' + corps.replace(/^# /m, '# '));
  }
  const entete = `# Melodia Funèbre — texte intégral du site

> Maison française qui compose une chanson originale pour la cérémonie
> funéraire d'une personne précise, à partir de ce que sa famille
> raconte d'elle. Site : ${SITE_URL} — résumé : ${SITE_URL}/llms.txt

Ce fichier reprend, page par page, le texte public du site, tel qu'il
est affiché. Il est régénéré à chaque mise à jour du site ; en cas de
doute, la page citée fait foi.
`;
  const sortie = entete + '\n' + blocs.join('\n\n') + '\n';
  fs.writeFileSync(path.join(RACINE, 'llms-full.txt'), sortie);
  return { pages: blocs.length, octets: Buffer.byteLength(sortie) };
};
