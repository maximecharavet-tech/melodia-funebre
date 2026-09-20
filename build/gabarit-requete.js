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

/* ─── Une affiche au milieu du texte ───
   Ces treize pages répondent à une question tapée dans Google. Elles
   sont longues par nécessité — une réponse courte ne répond pas — et
   n'avaient aucune image : neuf cents mots de gris sur noir, que
   personne ne descend jusqu'au bout.

   L'affiche est choisie PAGE PAR PAGE, jamais tirée au sort ni prise
   à tour de rôle. Deux raisons. D'abord parce qu'une image qui ne
   parle pas du paragraphe qu'elle interrompt est pire que pas
   d'image. Ensuite parce que trois affiches de la médiathèque sont
   inutilisables ici : « une-vie-en-musique », « dernier-message » et
   « salon-tourne-disque » s'adressent à quelqu'un qui compose DE SON
   VIVANT. Les poser devant une famille qui vient de perdre un proche
   serait une faute, pas une maladresse. Les affiches professionnelles
   sont écartées pour la même raison, en sens inverse.

   La médiathèque comptait cinq affiches utilisables ici, et certaines
   revenaient trois fois. Elle en compte vingt : les treize pages ont
   désormais chacune la sienne, et aucune ne se répète. */
const AFFICHES = {
  'chanson-pour-obseques':            ['souvenirs-en-harmonie',
    'La c\u00e9r\u00e9monie a lieu dans trois jours. C\u2019est court, et c\u2019est encore tenable.'],
  'musique-personnalisee-obseques':   ['certaines-melodies',
    'Un morceau du commerce parle de quelqu\u2019un d\u2019autre. C\u2019est l\u00e0 toute la question.'],
  'hommage-musical-obseques':         ['duo-au-piano',
    'Ce qu\u2019on annonce \u00e0 l\u2019assembl\u00e9e tient en une phrase, et voil\u00e0 \u00e0 quoi cela ressemble.'],
  'musique-pour-hommage-funeraire':   ['souvenirs-ukulele',
    'Toutes les occasions ne sont pas une c\u00e9r\u00e9monie. Certaines tiennent dans un salon.'],
  'chanson-hommage-defunt':           ['belle-note-finale',
    'Une chanson d\u2019hommage ne se juge pas \u00e0 la technique, mais \u00e0 ce qu\u2019elle fait \u00e0 la pi\u00e8ce.'],
  'chanson-personnalisee-defunt':     ['racines-antillaises',
    'Personnalis\u00e9e veut dire : dans SA langue et dans SA musique, zouk ou gwoka compris.'],
  'chanson-funeraire-personnalisee':  ['ce-que-les-mots',
    'Le ton juste n\u2019est ni le pathos ni la gaiet\u00e9 forc\u00e9e. C\u2019est le sien.'],
  'chanson-dernier-hommage':          ['adieux-en-musique',
    'Le dernier hommage est le seul qu\u2019on ne pourra pas recommencer.'],
  'creer-chanson-pour-defunt':        ['memoire-autrement',
    'Cr\u00e9er commence par raconter. Le reste est notre travail, pas le v\u00f4tre.'],
  'composer-chanson-pour-defunt':     ['chaque-vie-sa-melodie',
    'Composer, ici, veut dire \u00e9crire une \u0153uvre qui n\u2019existait pas avant lui.'],
  'musique-personnalisee-defunt':     ['melodie-pour-toujours',
    'Le registre se choisit \u00e0 l\u2019entretien, sur ce qu\u2019il \u00e9coutait vraiment.'],
  /* « melodies-generations » porte un avertissement dans la
     médiathèque : elle montre des musiciens qui jouent, et ne doit
     jamais être présentée comme un enterrement. Cette page-ci parle
     précisément des FORMES que prend un hommage en dehors de la mise
     en terre — c'est la seule des treize où elle est à sa place, et
     la légende le dit. */
  'hommage-musical-defunt':           ['melodies-generations',
    'Un hommage musical n\u2019est pas la mise en terre : c\u2019est la veill\u00e9e, l\u2019anniversaire, le d\u00e9voilement d\u2019une st\u00e8le.'],
  'dernier-hommage-musical':          ['plaque-et-telephone',
    'Ce qu\u2019il en reste, des ann\u00e9es plus tard, tient dans un carr\u00e9 grav\u00e9 sur une plaque.']
};


/* Le texte de remplacement décrit CE QU'ON VOIT, une fois par affiche
   et pas une fois par page : la même image ne change pas de contenu
   selon l'endroit où elle est posée. C'est la légende qui s'adapte,
   pas l'alternative. */
const ALT = {
  'adieux-en-musique':      'Une femme en noir, une rose \u00e0 la main, devant une s\u00e9pulture fleurie au soleil couchant',
  'certaines-melodies':     'Une composition musicale \u00e9voqu\u00e9e par une port\u00e9e dor\u00e9e et des photographies de famille',
  'souvenirs-ukulele':      'Quelqu\u2019un jouant d\u2019un instrument \u00e0 cordes lors d\u2019un hommage priv\u00e9',
  'chaque-vie-sa-melodie':  'Une pianiste de dos devant un piano \u00e0 queue, face \u00e0 une baie ouverte sur la mer au soleil couchant',
  'plaque-et-telephone':    'Une femme devant une s\u00e9pulture, son t\u00e9l\u00e9phone \u00e0 la main : l\u2019\u00e9cran joue l\u2019hommage que le QR code de la plaque vient d\u2019ouvrir',
  'souvenirs-en-harmonie':  'Composition cubiste en or et ardoise : un visage de femme, un piano \u00e0 queue, une partition et un cercueil, \u00e9clair\u00e9s d\u2019une bougie',
  'duo-au-piano':           'Un pianiste et une chanteuse interpr\u00e9tant ensemble, au bord de l\u2019eau, devant un escalier de pierre',
  'belle-note-finale':      'Une femme en robe noire tenant une partition, devant un piano \u00e0 queue au soleil couchant',
  'racines-antillaises':    'Une chanteuse antillaise au micro, accompagn\u00e9e d\u2019un guitariste et d\u2019un joueur de tambour, devant une baie au coucher du soleil ; un portrait encadr\u00e9 et une bougie au premier plan',
  'ce-que-les-mots':        'Une femme assise au bord de l\u2019eau parmi des bougies, devant un piano \u00e0 queue et une porte ouverte sur un lever de soleil',
  'memoire-autrement':      'Un visage de profil dessin\u00e9, des photographies de famille qui remontent le long d\u2019une port\u00e9e, et une plaque grav\u00e9e portant un QR code',
  'melodie-pour-toujours':  'Une pianiste au premier plan ; derri\u00e8re elle, un homme \u00e2g\u00e9 gravit un escalier form\u00e9 de touches de piano vers la lumi\u00e8re',
  'melodies-generations':   'Des musiciens r\u00e9unis pour un temps de m\u00e9moire, jouant ensemble'
};


/* L'affiche se glisse après la PREMIÈRE section du corps, pas à la
   fin : posée en bas, elle n'interromprait plus rien et n'aurait
   aucun effet sur le mur de texte qu'elle est censée ouvrir. */
function avecAffiche(p) {
  const choix = AFFICHES[p.file.replace('.html', '')];
  if (!choix) return p.corps;
  const fig = P.afficheCampagne(choix[0], ALT[choix[0]], choix[1]);
  const coupe = p.corps.indexOf('</section>');
  if (coupe < 0) return p.corps + '\n' + fig;
  const fin = coupe + '</section>'.length;
  return p.corps.slice(0, fin) + '\n' + fig + p.corps.slice(fin);
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
${avecAffiche(p)}
${questions(p.questions)}
${proposition(p.proposition, p.bouton)}
${voisines(p.voisines)}
${P.partage(enClair(p), p.desc)}
${P.urgency()}`
  };
}

module.exports = { page };
