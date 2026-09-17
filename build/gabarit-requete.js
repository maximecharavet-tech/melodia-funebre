/* ═══════════════════════════════════════════════════════════════
   LE GABARIT DES PAGES DE REQUÊTE

   Treize pages sont demandées sur des formulations voisines :
   « chanson hommage défunt », « chanson personnalisée défunt »,
   « créer une chanson pour un défunt »… Google a un nom pour une
   grappe de pages quasi identiques qui ne diffèrent que par le
   mot-clé — « doorway pages » — et les déclasse en bloc.

   La règle que ce gabarit impose est donc simple et dure :

     IL PARTAGE LA MISE EN PAGE. IL NE PARTAGE AUCUN CONTENU.

   Chaque page apporte son propre corps, ses propres questions, sa
   propre pièce centrale — un tableau, une frise, un comparatif, des
   extraits réels du catalogue — et sa propre phrase de renvoi. Rien
   dans ce fichier ne produit de texte qui se retrouverait à
   l'identique sur deux pages. Les seules chaînes communes sont des
   libellés d'interface (« Sommaire », « Les questions qu'on nous
   pose »), et scripts/check.js vérifie que les corps ne se
   ressemblent pas.

   CE QUI DIFFÈRE D'UN GUIDE

   Les cinq guides existants répondent à une question que la famille
   se pose (« quelle musique pour un enterrement ? »). Ces treize
   pages-ci répondent à une INTENTION : quelqu'un qui tape « composer
   une chanson pour un défunt » ne veut pas la même chose que
   quelqu'un qui tape « chanson pour obsèques » — le premier veut
   savoir comment ça se fabrique, le second veut que ça marche
   vendredi à 14 h. Chaque page nomme donc d'entrée la situation de
   son lecteur, et c'est cette situation qui commande tout le reste.
   ═══════════════════════════════════════════════════════════════ */

const { ICON, SITE } = require('./gen.js');
const P = require('./parts.js');

const esc = (x) => String(x == null ? '' : x)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Le sommaire. Il n'est pas décoratif : il donne à la page ses ancres,
   et à un moteur la carte de ce qu'elle contient. Les titres viennent
   du corps de la page, pas d'une liste écrite à côté — impossible
   qu'ils divergent. */
function sommaire(corps) {
  const titres = [];
  corps.replace(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g, (_, id, t) => {
    titres.push([id, t.replace(/<[^>]+>/g, '').trim()]);
    return '';
  });
  if (titres.length < 2) return '';
  return `
  <nav class="req-sommaire reveal" aria-label="Sommaire">
    <span class="req-sommaire-t">Sommaire</span>
    <ol>
${titres.map(([id, t]) => `      <li><a href="#${esc(id)}">${t}</a></li>`).join('\n')}
    </ol>
  </nav>`;
}

/* Les renvois. Trois pages voisines, et surtout LA RAISON d'y aller —
   « si la cérémonie est dans trois jours », « si vous hésitez encore
   entre un morceau du commerce et une œuvre écrite ». Un bloc de
   liens sans raison est un pied de page déguisé ; il n'aide personne
   et les moteurs le lisent comme tel. */
function voisines(liste) {
  if (!liste || !liste.length) return '';
  return `
  <section class="section-sm">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.2rem;">
        <div class="eyebrow">Autre chose à savoir</div>
      </div>
      <div class="grid-3">
${liste.map(([url, titre, pourquoi]) => `        <a class="req-voisine reveal" href="${esc(url)}">
          <span class="req-voisine-q">${esc(pourquoi)}</span>
          <span class="req-voisine-t">${esc(titre)}</span>
          <span class="req-voisine-l">${ICON.fleche || '→'}</span>
        </a>`).join('\n')}
      </div>
    </div>
  </section>`;
}

/* Les questions, rendues depuis la même liste que les données
   structurées : Google exige que la réponse soit VISIBLE sur la page.
   Déclarer une FAQ que la page n'affiche pas est une déclaration
   fausse, et sanctionnée comme telle. */
function questions(q) {
  return `
  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="questions">Les questions qu'on nous pose</h2>
${q.map((x) => `        <h3>${x.q}</h3>\n        ${x.html || '<p>' + x.texte + '</p>'}`).join('\n')}
      </div>
    </div>
  </section>`;
}

/* Le renvoi vers la maison : une fois, à la fin, après le contenu, et
   formulé comme une possibilité. Une page qui feint de renseigner pour
   ne vendre que ses services se repère en trois lignes et ne se classe
   pas. Le lecteur doit pouvoir repartir avec le renseignement seul. */
function proposition(texte, bouton) {
  return `
  <section class="section-sm">
    <div class="wrap">
      <div class="guide-fin reveal">
        <div class="eyebrow">Ce que nous faisons, nous</div>
        <p>${texte}</p>
        <div class="hero-actions" style="margin-top:1.6rem;">
          <a href="/demos" class="btn btn-outline">${ICON.note} ${esc(bouton || 'Écouter des hommages composés')}</a>
          <button type="button" class="btn btn-ghost" data-rappel>${ICON.phone} Être rappelé</button>
        </div>
      </div>
    </div>
  </section>`;
}

/* Le titre en texte brut, dérivé du H1 plutôt que ressaisi.

   La première version attendait un champ « h1texte » écrit à la main
   dans chaque page. Aucune des treize ne le renseignait : le JSON-LD
   partait donc SANS « headline » — que Google exige pour un Article —
   et le bloc de partage recevait « undefined » comme titre. Rien ne
   le signalait, puisqu'un champ absent disparaît simplement à la
   sérialisation. Il se calcule maintenant tout seul. */
const enClair = (p) => (p.h1texte || p.h1)
  .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ').trim();

function jsonld(p) {
  const url = SITE + '/' + p.file.replace('.html', '');
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': url + '#article',
      headline: enClair(p),
      description: p.desc,
      inLanguage: 'fr-FR',
      isAccessibleForFree: true,
      author: { '@id': SITE + '/#organisation' },
      publisher: { '@id': SITE + '/#organisation' },
      mainEntityOfPage: url,
      image: SITE + '/assets/img/og-melodia.jpg',
      /* Aucune « dateModified » : figée dans le code, elle mentirait
         dès la première retouche, et les moteurs s'en servent pour
         juger la fraîcheur. La date de publication, elle, reste vraie. */
      datePublished: '2026-09-17'
    },
    P.jsonldOrg,
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': url + '#questions',
      mainEntity: p.questions.map((x) => ({
        '@type': 'Question',
        name: x.q,
        acceptedAnswer: { '@type': 'Answer', text: x.texte }
      }))
    },
    P.jsonldFil(p.fil, '/' + p.file.replace('.html', ''))
  ];
}

/* La situation du lecteur, annoncée d'entrée. C'est ce qui distingue
   réellement ces treize pages les unes des autres : même sujet,
   lecteurs différents, donc réponses différentes. */
function page(p) {
  return {
    file: p.file,
    title: p.title,
    desc: p.desc,
    jsonld: jsonld(p),
    body: `
  <section class="page-head">
    <div class="wrap">
      <div class="eyebrow reveal in">${esc(p.fil)}</div>
      <h1 class="h-xl reveal in reveal-d1" style="margin-top:.8rem;">${p.h1}</h1>
      <p class="req-situation reveal in reveal-d2">${p.situation}</p>
      <p class="lead reveal in reveal-d2" style="margin-top:1.2rem;max-width:64ch;">${p.chapeau}</p>
${sommaire(p.corps)}
    </div>
  </section>
${p.corps}
${questions(p.questions)}
${proposition(p.proposition, p.bouton)}
${voisines(p.voisines)}
${P.partage(enClair(p), p.desc)}
${P.urgency()}`
  };
}

module.exports = { page };
