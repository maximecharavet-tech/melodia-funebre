/* ═══════════════════════════════════════════════════════════════
   LES GUIDES — répondre aux questions que les familles posent
   vraiment, avant même de savoir que ce service existe

   POURQUOI CES PAGES

   Le reste du site répond à quelqu'un qui cherche déjà « faire
   composer une chanson pour un défunt ». Or presque personne ne
   cherche cela : la catégorie est neuve, et le mot pour la nommer
   n'existe pas encore dans la tête des gens. Ce qu'une famille tape,
   à deux jours d'une cérémonie, c'est « quelle musique pour un
   enterrement », « a-t-on le droit de passer une chanson à l'église »,
   « musique crémation ». Le site ne répondait à aucune de ces trois
   questions.

   Ces guides y répondent pour de bon — c'est-à-dire qu'ils sont
   utiles même à la famille qui ne nous commandera jamais rien. C'est
   la seule façon d'être lu : une page qui feint de conseiller pour
   ne vendre que ses services se repère en trois lignes, et ne se
   classe pas. La proposition de la maison arrive donc à la fin,
   comme une option parmi d'autres, et une fois seulement.

   PRUDENCE SUR LE DROIT

   Le guide sur les droits d'auteur avance ce qui est constaté et
   vérifiable, et renvoie la famille à son opérateur funéraire pour
   son cas précis. Nous ne sommes pas juristes, la page le dit, et
   aucune formule n'est présentée comme un avis de droit.
   ═══════════════════════════════════════════════════════════════ */

const { ICON, MAIL, SITE } = require('./gen.js');
const P = require('./parts.js');

/* Un guide se décrit par ses questions : elles servent à la fois de
   sommaire lisible, de contenu de page, et de données structurées.
   Une seule source, donc jamais de divergence entre ce que la page
   affiche et ce que les moteurs lisent. */
function jsonldGuide(g) {
  const url = SITE + '/' + g.file.replace('.html', '');
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': url + '#article',
      headline: g.h1texte,
      description: g.desc,
      inLanguage: 'fr-FR',
      isAccessibleForFree: true,
      author: { '@id': SITE + '/#organisation' },
      publisher: { '@id': SITE + '/#organisation' },
      mainEntityOfPage: url,
      image: SITE + '/assets/img/og-melodia.jpg',
      /* Pas de « dateModified » : il serait figé dans le code et
         mentirait dès la première retouche du texte. Une date de
         mise à jour fausse est pire que pas de date du tout — les
         moteurs s'en servent pour juger la fraîcheur. La date de
         publication, elle, ne bouge pas et reste vraie. */
      datePublished: '2026-09-07'
    },
    P.jsonldOrg,
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': url + '#questions',
      mainEntity: g.questions.map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: { '@type': 'Answer', text: q.texte }
      }))
    },
    P.jsonldFil(g.fil, '/' + g.file.replace('.html', ''))
  ];
}

/* Le bloc de questions, rendu en HTML depuis la même liste que le
   JSON-LD. Google exige que la réponse soit visible sur la page :
   une donnée structurée qui décrit un contenu absent est une
   déclaration fausse, et elle est sanctionnée comme telle. */
function questions(g) {
  return `
  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="questions">Les questions qu'on nous pose</h2>
${g.questions.map((q) => `        <h3>${q.q}</h3>
        ${q.html || '<p>' + q.texte + '</p>'}`).join('\n')}
      </div>
    </div>
  </section>`;
}

/* Le renvoi vers la maison. Une fois, à la fin, après le conseil —
   et formulé comme une possibilité, pas comme une conclusion
   obligée. La famille qui vient chercher un conseil doit pouvoir
   repartir avec le conseil seul. */
function proposition(texte) {
  return `
  <section class="section-sm">
    <div class="wrap">
      <div class="guide-fin reveal">
        <div class="eyebrow">Et si rien ne convient</div>
        <p>${texte}</p>
        <div class="hero-actions" style="margin-top:1.6rem;">
          <a href="/demos" class="btn btn-outline">${ICON.note} Écouter des hommages composés</a>
          <button type="button" class="btn btn-ghost" data-rappel>${ICON.phone} Être rappelé</button>
        </div>
      </div>
    </div>
  </section>`;
}

function guide(g) {
  return {
    file: g.file,
    title: g.title,
    desc: g.desc,
    jsonld: jsonldGuide(g),
    body: `
  <section class="page-head">
    <div class="wrap">
      <div class="eyebrow reveal in">${g.fil}</div>
      <h1 class="h-xl reveal in reveal-d1" style="margin-top:.8rem;">${g.h1}</h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.4rem;max-width:64ch;">${g.chapeau}</p>
    </div>
  </section>
${g.corps}
${questions(g)}
${proposition(g.proposition)}
${P.urgency()}`
  };
}


/* ═══════════════════════════════════════════════════════════════
   GUIDE 1 — Quelle musique pour un enterrement
   La question la plus posée, et celle à laquelle le site ne
   répondait nulle part.
   ═══════════════════════════════════════════════════════════════ */
const MOMENTS = [
  {
    t: 'L\'entrée',
    d: 'Le cercueil entre, l\'assemblée est debout. La musique porte la marche : elle doit tenir deux à trois minutes sans se presser, et commencer doucement — une attaque forte fait sursauter une salle déjà tendue.',
    e: 'Un morceau instrumental, ou une chanson dont le premier couplet est calme.'
  },
  {
    t: 'Le recueillement',
    d: 'C\'est le moment central, celui dont on se souvient. La salle est assise, personne ne parle. C\'est là qu\'une chanson avec des paroles trouve sa place : on l\'écoute vraiment, du début à la fin.',
    e: 'Le morceau qui lui ressemble le plus. S\'il n\'y en a qu\'un à choisir, c\'est celui-ci.'
  },
  {
    t: 'La sortie',
    d: 'L\'assemblée se lève et sort. La musique accompagne le mouvement et, souvent, allège. Beaucoup de familles choisissent ici quelque chose de plus vivant — et elles ont raison.',
    e: 'Un morceau qu\'il aimait, même joyeux. Personne ne vous en voudra.'
  }
];

const guide1 = guide({
  file: 'musique-obseques.html',
  fil: 'Guide',
  title: 'Quelle musique pour un enterrement ? | Melodia Funèbre',
  desc: "Combien de morceaux, à quels moments, comment choisir sans se tromper, et les vérifications qui évitent l'accident du jour même.",
  h1: 'Quelle musique<br><em>pour un enterrement ?</em>',
  h1texte: 'Quelle musique pour un enterrement ?',
  chapeau: "Vous avez peu de temps, peu d'envie de chercher, et la crainte de mal faire. Voici ce qu'il faut savoir : combien de morceaux prévoir, à quel moment, comment choisir, et les quelques vérifications qui évitent le seul vrai accident — celui du jour même.",
  corps: `
  <!-- ═══ COMBIEN, ET OÙ ═══ -->
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Trois morceaux suffisent</h2>
        <p>La plupart des cérémonies, religieuses comme civiles, tiennent en trois moments musicaux : l'entrée, le recueillement, la sortie. Certaines familles en ajoutent un quatrième, pendant un dépôt de fleurs ou une lecture. Au-delà, la cérémonie se dilue et l'assemblée décroche — les officiants le disent tous.</p>
        <p><strong>Une cérémonie dure en général entre trente et quarante-cinq minutes</strong>, et la musique en occupe huit à douze. Ce n'est pas beaucoup : chaque morceau compte.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.4rem;">
        <div class="eyebrow">Moment par moment</div>
        <h2 class="h-xl">Ce que chaque instant<br><em>demande à la musique.</em></h2>
      </div>
      <div class="grid-3">
${MOMENTS.map((m) => `        <div class="card reveal">
          <h3 class="h-lg">${m.t}</h3>
          <p>${m.d}</p>
          <p style="color:var(--or-patina);font-size:.88rem;margin-top:.9rem;padding-top:.9rem;border-top:1px solid var(--line-soft);">${m.e}</p>
        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- ═══ COMMENT CHOISIR ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Comment choisir, quand on n'a pas d'idée</h2>
        <p>La question n'est pas « quelle est la belle musique d'enterrement ». C'est <strong>« qu'est-ce qui lui ressemble »</strong>. Les cérémonies dont les familles nous reparlent des années après ne sont jamais celles où l'on a passé le morceau qu'il fallait passer.</p>

        <h3>Partez de lui, pas du répertoire</h3>
        <p>Trois questions suffisent, et elles se posent en famille en dix minutes :</p>
        <ul>
          <li>Qu'est-ce qu'il mettait dans la voiture ? C'est souvent la réponse la plus juste, et la plus oubliée.</li>
          <li>Y a-t-il un morceau qu'on associe à un moment précis — un mariage, un départ, une fête, une région ?</li>
          <li>Quel morceau <em>ne</em> supporterait-il <em>pas</em> qu'on passe ? Cette question-là fait souvent rire, et elle détend une réunion difficile.</li>
        </ul>

        <h3>Méfiez-vous du morceau qui vous appartient à vous</h3>
        <p>C'est l'erreur la plus fréquente et la plus douloureuse. Un morceau qui vous bouleverse <em>vous</em> n'est pas forcément le sien : il raconte votre chagrin, pas sa vie. Une bonne façon de trancher : demandez-vous si les autres personnes présentes comprendront pourquoi ce morceau est là. Si vous devez l'expliquer, c'est qu'il est à vous.</p>

        <h3>Lisez les paroles en entier</h3>
        <p>Beaucoup de chansons douces contiennent, au troisième couplet, une phrase que personne ne veut entendre ce jour-là. <strong>Lisez le texte imprimé, en entier, avant de valider.</strong> Cela prend deux minutes et évite le seul incident vraiment irréparable.</p>

        <h3>Écoutez la fin du morceau</h3>
        <p>Beaucoup de chansons se terminent par un fondu long, ou au contraire s'arrêtent net. Dans une salle silencieuse, une fin abrupte est brutale. Écoutez les vingt dernières secondes : c'est ce que la salle entendra le mieux.</p>
      </div>
    </div>
  </section>

  <!-- ═══ SELON LE LIEN ═══ -->
  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Selon qui l'on perd</h2>
        <p>Ce ne sont pas des règles, seulement ce que nous observons le plus souvent — et ce qui, le plus souvent, tombe juste.</p>
        <table>
          <thead><tr><th>Pour</th><th>Ce qui fonctionne le mieux</th></tr></thead>
          <tbody>
            <tr><td>Un père</td><td>Ce qu'il écoutait lui, même si ce n'est pas « de circonstance ». Un père se reconnaît à ses goûts, pas à la solennité.</td></tr>
            <tr><td>Une mère</td><td>Souvent une voix féminine, et souvent un morceau lié à la maison — la cuisine, la voiture, les vacances.</td></tr>
            <tr><td>Un conjoint</td><td>Le morceau du mariage, s'il existe. Il fait pleurer toute la salle, et c'est exactement ce qu'il doit faire.</td></tr>
            <tr><td>Un enfant</td><td>Quelque chose de court et de lumineux. Les cérémonies d'enfants supportent mal la longueur.</td></tr>
            <tr><td>Un ami, un collègue</td><td>Ce qui rappelle le groupe : la chanson des soirées, du club, de l'équipe.</td></tr>
            <tr><td>Une personne très âgée</td><td>La musique de sa jeunesse à elle, pas de la vôtre. L'écart est souvent de quarante ans.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- ═══ LE JOUR MÊME ═══ -->
  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Les vérifications qui évitent l'accident</h2>
        <p>Le mauvais souvenir, dans une cérémonie, ne vient presque jamais du choix du morceau. Il vient de la technique.</p>
        <ul>
          <li><strong>Apportez un fichier, pas un lien.</strong> Un MP3 sur une clé USB fonctionne partout. Une vidéo en ligne dépend d'une connexion, d'une publicité qui se lance, d'un compte connecté. Nous avons vu les trois arriver.</li>
          <li><strong>Prévoyez une copie.</strong> Une seconde clé, ou le fichier aussi sur un téléphone. Les clés se perdent le matin des obsèques comme jamais.</li>
          <li><strong>Donnez l'ordre par écrit</strong> à la personne qui gère le son : quel morceau, à quel moment, et jusqu'où le laisser jouer.</li>
          <li><strong>Dites où couper.</strong> « On arrête après le refrain » évite le silence gêné pendant deux minutes d'outro instrumentale.</li>
          <li><strong>Testez sur place si c'est possible.</strong> Une sono de salle ne rend pas comme des écouteurs : les basses portent, les voix reculent.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- ═══ RENVOIS ═══ -->
  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Deux cas particuliers</h2>
        <p><strong>Si la cérémonie est religieuse</strong>, la tradition impose ses propres règles, et elles ne se ressemblent pas d'un rite à l'autre : ce qui est admis à l'église catholique ne l'est pas dans une liturgie orthodoxe, et la prière funéraire musulmane n'accueille pas de musique instrumentale. Nous les avons détaillées une par une sur <a href="/rites">la page consacrée aux rites</a>.</p>
        <p><strong>Si c'est une crémation</strong>, l'organisation du crématorium ajoute une contrainte de durée et un moment très particulier, celui de la disparition du cercueil. Nous en parlons dans <a href="/musique-cremation">le guide sur la musique en crémation</a>.</p>
        <p><strong>Et sur les droits d'auteur</strong>, la question revient toujours : <a href="/musique-sacem-obseques">a-t-on le droit de diffuser une chanson du commerce à des obsèques</a> ? Réponse courte : oui, presque toujours, et ce n'est en général pas à la famille de s'en occuper.</p>
      </div>
    </div>
  </section>`,
  questions: [
    {
      q: 'Combien de morceaux faut-il prévoir pour des obsèques ?',
      texte: "Trois suffisent dans la très grande majorité des cérémonies : un à l'entrée, un pendant le recueillement, un à la sortie. Certaines familles en ajoutent un quatrième pendant un dépôt de fleurs ou une lecture. Au-delà, la cérémonie se dilue et l'assemblée décroche."
    },
    {
      q: 'Peut-on passer une chanson joyeuse à un enterrement ?',
      texte: "Oui, et c'est fréquent, surtout à la sortie. Une cérémonie n'a pas à être uniformément grave : si le défunt était quelqu'un de gai, une musique triste le trahit. Beaucoup de familles nous disent regretter d'avoir choisi trop solennel."
    },
    {
      q: 'Comment choisir quand la famille n\'est pas d\'accord ?',
      texte: "Revenez au défunt plutôt qu'à vos goûts respectifs : la question « qu'est-ce qu'il mettait dans la voiture » tranche mieux que « qu'est-ce qu'on préfère ». Et souvenez-vous qu'il y a trois moments : cela permet souvent de contenter deux avis plutôt qu'un seul."
    },
    {
      q: 'Faut-il apporter la musique, ou les pompes funèbres la fournissent-elles ?',
      texte: "Les opérateurs funéraires disposent en général d'un fonds musical et d'un système de diffusion, mais si vous voulez un morceau précis, apportez-le. Un fichier MP3 sur une clé USB est ce qui fonctionne le plus sûrement : un lien vers une plateforme dépend d'une connexion et d'un compte connecté."
    },
    {
      q: 'Combien de temps doit durer un morceau de cérémonie ?',
      texte: "Deux à quatre minutes. En dessous, l'entrée ou la sortie n'a pas le temps de se faire ; au-delà, l'assemblée assise décroche. Prévoyez surtout où couper le morceau, et dites-le à la personne qui gère le son."
    },
    {
      q: 'Peut-on faire écrire une chanson pour le défunt plutôt qu\'en choisir une ?',
      texte: "Oui. C'est un service récent et encore peu répandu en France : une œuvre originale est composée à partir de ce que la famille raconte du défunt — son métier, ses habitudes, une anecdote. Elle ne parle que de lui, et n'a aucun droit d'auteur à déclarer puisqu'elle n'appartient à aucun répertoire."
    }
  ],
  proposition: "Il arrive qu'aucune chanson ne convienne — parce qu'elles parlent toutes de quelqu'un d'autre. C'est le point de départ de cette maison : nous composons une œuvre originale à partir de ce que vous nous racontez de lui, en vingt-quatre heures. Vous pouvez en écouter dix-sept, composées pour de vraies personnes, avant de décider quoi que ce soit."
});


/* ═══════════════════════════════════════════════════════════════
   GUIDE 2 — Les droits d'auteur aux obsèques
   Requête à forte intention, concurrence faible, et sujet où la
   maison a quelque chose de vrai à dire.
   ═══════════════════════════════════════════════════════════════ */
const guide2 = guide({
  file: 'musique-sacem-obseques.html',
  fil: 'Guide',
  title: 'SACEM et musique aux obsèques : qui paie ? | Melodia Funèbre',
  desc: "A-t-on le droit de diffuser une chanson à des obsèques, et qui déclare les droits ? Ce qui se passe réellement à l'église, au crématorium et au cimetière.",
  h1: 'A-t-on le droit de<br><em>passer cette chanson ?</em>',
  h1texte: "SACEM et musique aux obsèques : qui paie, et pour quoi",
  chapeau: "C'est la question qui inquiète le plus les familles, et c'est presque toujours pour rien. Voici qui déclare quoi, dans quel lieu, et les deux seuls cas où la question vous concerne vraiment.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2>La réponse courte</h2>
        <p><strong>Oui, vous avez le droit.</strong> Et dans la quasi-totalité des cas, ce n'est pas à vous de vous en occuper : les droits liés à la diffusion de musique dans un lieu accueillant du public sont gérés par l'établissement ou par l'opérateur funéraire, pas par la famille endeuillée.</p>
        <p>Aucune famille, à notre connaissance, ne reçoit de facture de la SACEM après des obsèques. Si l'on vous a laissé entendre le contraire, c'est une confusion avec les règles applicables aux mariages et aux fêtes privées, où l'organisateur est parfois l'assujetti.</p>
        <div class="guide-avis">Nous ne sommes pas juristes et cette page n'est pas un avis de droit. Pour votre cérémonie précise, la personne à interroger est votre conseiller funéraire : c'est lui qui connaît le contrat du lieu retenu, et la question lui prend dix secondes.</div>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Ce qui se passe, lieu par lieu</h2>
        <table>
          <thead><tr><th>Lieu</th><th>Ce qui s'applique en pratique</th></tr></thead>
          <tbody>
            <tr><td>Crématorium</td><td>L'établissement diffuse de la musique toute l'année et relève d'un contrat de diffusion. La famille apporte son fichier, l'établissement s'occupe du reste.</td></tr>
            <tr><td>Salle de cérémonie funéraire</td><td>Même logique : l'opérateur funéraire exploite un lieu de diffusion et en assume les obligations.</td></tr>
            <tr><td>Église</td><td>La musique diffusée pendant un office religieux relève d'un régime propre, négocié entre les autorités religieuses et les sociétés de gestion. La paroisse sait ce qu'elle admet ; la question de la déclaration ne remonte pas à la famille.</td></tr>
            <tr><td>Cimetière, plein air</td><td>Diffusion brève dans un cadre familial restreint. C'est le cas le moins encadré, et le moins problématique en pratique.</td></tr>
          </tbody>
        </table>
        <p>Ce tableau décrit ce que nous constatons auprès des agences avec lesquelles nous travaillons. Les contrats varient d'un établissement à l'autre : c'est pourquoi la seule réponse fiable pour <em>votre</em> cérémonie vient de votre opérateur.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Les deux cas où cela vous concerne vraiment</h2>

        <h3>1. Vous voulez garder l'enregistrement et le partager</h3>
        <p>Diffuser une chanson pendant la cérémonie est une chose. <strong>Copier cette chanson sur des clés USB pour la distribuer à la famille, la mettre en ligne, ou l'inclure dans un film souvenir mis sur les réseaux, en est une autre.</strong> Là, vous sortez du cadre de la diffusion en cérémonie, et l'autorisation de l'ayant droit devient nécessaire.</p>
        <p>C'est le cas le plus courant de mauvaise surprise : une vidéo d'hommage retirée d'une plateforme quelques jours après, pour la musique qu'elle contient — au pire moment.</p>

        <h3>2. Vous voulez faire chanter ou jouer quelqu'un en direct</h3>
        <p>Une interprétation en direct d'une œuvre protégée reste une représentation de cette œuvre. En pratique, dans une cérémonie funéraire, cela ne pose pas de difficulté et personne ne vous en tiendra rigueur. Nous le mentionnons parce que la question nous est posée.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Le cas d'une œuvre écrite pour le défunt</h2>
        <p>Une œuvre composée spécialement pour une personne, et pour elle seule, n'appartient à aucun répertoire et n'a été déposée par personne. Il n'y a donc <strong>rien à déclarer, rien à demander, et rien à payer</strong> — ni pour la diffuser en cérémonie, ni pour la copier pour la famille, ni pour la mettre dans un film souvenir.</p>
        <p>C'est une différence qui compte moins le jour de la cérémonie que les semaines suivantes, quand une famille veut transmettre ce qu'elle a entendu. Nous cédons les droits d'usage avec l'œuvre, précisément pour cela.</p>
        <p>Le détail de ce que couvre cette cession figure dans <a href="/cgv">nos conditions générales</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    {
      q: 'Faut-il payer la SACEM pour diffuser une chanson à un enterrement ?',
      texte: "Pas la famille, dans la quasi-totalité des cas. Les lieux qui accueillent des cérémonies — crématoriums, salles funéraires — diffusent de la musique toute l'année et relèvent d'un contrat de diffusion assumé par l'établissement ou l'opérateur funéraire. Interrogez votre conseiller funéraire pour votre cérémonie précise."
    },
    {
      q: 'A-t-on le droit de passer une chanson du commerce à l\'église ?',
      texte: "La musique diffusée pendant un office relève d'un régime propre, négocié entre les autorités religieuses et les sociétés de gestion. La vraie question à poser n'est donc pas juridique mais pastorale : c'est le célébrant qui décide de ce qu'il admet pendant l'office. Demandez-lui avant de valider votre choix."
    },
    {
      q: 'Peut-on copier la musique de la cérémonie pour la donner à la famille ?',
      texte: "Pour une chanson du commerce, non sans l'autorisation des ayants droit : la copie et la mise en ligne sortent du cadre de la diffusion en cérémonie. C'est le cas le plus fréquent de mauvaise surprise, notamment pour les films souvenirs publiés sur les réseaux, qui se font retirer pour leur bande-son."
    },
    {
      q: 'Une chanson composée pour le défunt est-elle soumise à des droits ?',
      texte: "Non. Une œuvre écrite spécialement pour une personne n'appartient à aucun répertoire et n'a été déposée nulle part : il n'y a rien à déclarer ni à payer, ni pour la diffuser, ni pour la copier, ni pour la conserver."
    },
    {
      q: 'Peut-on diffuser depuis un téléphone ou une plateforme de streaming ?',
      texte: "Techniquement possible, mais déconseillé : la lecture dépend d'une connexion, d'un compte connecté et parfois d'une publicité qui se lance. Apportez plutôt un fichier MP3 sur une clé USB, avec une copie de secours."
    }
  ],
  proposition: "Si l'idée de dépendre d'une autorisation vous pèse — pour diffuser, pour copier, pour transmettre — une œuvre écrite pour lui règle la question à la source. Elle n'appartient à personne d'autre qu'à vous."
});


/* ═══════════════════════════════════════════════════════════════
   GUIDE 3 — La musique en crémation
   Contrainte réelle et mal documentée : le créneau, et le moment
   de la disparition du cercueil.
   ═══════════════════════════════════════════════════════════════ */
const guide3 = guide({
  file: 'musique-cremation.html',
  fil: 'Guide',
  title: 'Quelle musique pour une crémation ? | Melodia Funèbre',
  desc: "Un créneau court, et un instant qui n'existe nulle part ailleurs : la disparition du cercueil. Ce qu'il faut prévoir, et l'erreur de durée fréquente.",
  h1: 'La musique<br><em>en crémation.</em>',
  h1texte: 'Quelle musique pour une crémation ?',
  chapeau: "Une crémation n'est pas un enterrement plus court. Elle a son horaire, sa salle, et surtout un instant qui n'existe nulle part ailleurs : celui où le cercueil disparaît. C'est là que le choix de la musique se joue vraiment.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Le créneau commande tout</h2>
        <p>Un crématorium enchaîne les cérémonies sur des créneaux, en général de trente à quarante-cinq minutes, salle comprise. C'est la contrainte que les familles découvrent le plus tard, et celle qui coûte le plus cher émotionnellement : une cérémonie construite pour une heure se retrouve compressée, et c'est presque toujours la musique qu'on sacrifie en premier.</p>
        <p><strong>Demandez la durée exacte de votre créneau dès le premier rendez-vous</strong>, et construisez la cérémonie à l'intérieur. Trois morceaux de trois minutes, c'est neuf minutes sur trente-cinq : c'est tenable. Cinq morceaux, ce ne l'est pas.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Le moment de la disparition</h2>
        <p>À la fin de la cérémonie, le cercueil quitte la salle — il descend, glisse derrière un rideau, ou la porte se referme selon les établissements. <strong>C'est l'instant le plus dur de la journée</strong>, plus dur que la mise en terre pour beaucoup de familles, parce qu'il est net et sans retour.</p>
        <p>Trois choses que nous avons appris à conseiller pour ce moment :</p>
        <ul>
          <li><strong>Ne le laissez pas en silence.</strong> Le silence rend le mécanisme audible, et c'est un souvenir dont on ne se débarrasse pas.</li>
          <li><strong>Choisissez un morceau qui monte, pas qui s'éteint.</strong> Une fin en fondu au moment de la disparition redouble l'effacement. Une ligne qui tient, ou qui s'élève, porte l'assemblée au lieu de l'enfoncer.</li>
          <li><strong>Prévoyez qu'il dure plus longtemps que nécessaire.</strong> L'opération prend une à deux minutes, mais le silence qui suit est long. Un morceau qui continue laisse à la salle le temps de se relever.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2>La salle, et le son</h2>
        <p>Les salles de crématorium sont conçues pour la parole : elles sont sourdes, souvent moquettées, et leur sonorisation est prévue pour un micro. Deux conséquences pratiques :</p>
        <ul>
          <li><strong>Les morceaux très graves passent mal.</strong> Un orgue profond ou une basse lourde s'y perdent. Les voix et les instruments médiums portent beaucoup mieux.</li>
          <li><strong>Le volume paraît toujours plus faible qu'à l'écoute au casque.</strong> Demandez un essai à votre arrivée : la plupart des établissements l'acceptent volontiers si vous venez un quart d'heure en avance.</li>
        </ul>
        <p>Apportez un fichier MP3 sur clé USB, avec une copie de secours, et remettez à l'agent une liste écrite : quel morceau, à quel moment, jusqu'où le laisser jouer.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2>Crémation et rite religieux</h2>
        <p>La crémation est admise par l'Église catholique depuis 1963, avec une cérémonie qui peut précéder au lieu de culte. D'autres traditions ne l'admettent pas : le judaïsme et l'islam prescrivent l'inhumation. Quand une cérémonie religieuse précède la crémation, ce sont les règles du rite qui s'appliquent pour la musique — nous les avons détaillées <a href="/rites">tradition par tradition</a>.</p>
        <p>Pour tout ce qui concerne le choix du morceau lui-même, le <a href="/musique-obseques">guide général sur la musique aux obsèques</a> vaut aussi pour une crémation. Et sur la question des droits, tout est <a href="/musique-sacem-obseques">ici</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    {
      q: 'Combien de temps dure une cérémonie de crémation ?',
      texte: "En général trente à quarante-cinq minutes de créneau en salle, selon les établissements. Demandez la durée exacte dès le premier rendez-vous : c'est elle qui détermine combien de morceaux vous pouvez prévoir. Trois morceaux de trois minutes tiennent confortablement, cinq ne tiennent pas."
    },
    {
      q: 'Quelle musique passer au moment où le cercueil disparaît ?',
      texte: "Un morceau qui tient ou qui monte, jamais un morceau qui s'éteint en fondu : au moment de la disparition, une fin qui s'efface redouble l'effacement. Et prévoyez plus long que nécessaire, car le silence qui suit l'opération est long."
    },
    {
      q: 'Peut-on laisser le silence pendant la disparition du cercueil ?',
      texte: "C'est déconseillé. Le silence rend le mécanisme audible, et beaucoup de familles nous ont dit que ce bruit était le souvenir dont elles se débarrassaient le moins bien."
    },
    {
      q: 'Peut-on apporter sa propre musique au crématorium ?',
      texte: "Oui, tous les établissements l'acceptent. Apportez un fichier MP3 sur une clé USB avec une copie de secours, et remettez une liste écrite indiquant l'ordre et le moment de chaque morceau. Arrivez un quart d'heure en avance pour faire un essai de son."
    },
    {
      q: 'La crémation est-elle autorisée par les religions ?',
      texte: "L'Église catholique l'admet depuis 1963, et une cérémonie religieuse peut la précéder. Le judaïsme et l'islam prescrivent l'inhumation. Quand un office précède la crémation, ce sont les règles du rite qui s'appliquent à la musique."
    }
  ],
  proposition: "Le moment de la disparition demande un morceau qui tienne debout — et c'est rarement ce qu'on trouve dans un répertoire existant. Nous composons des œuvres écrites pour cet instant précis, à partir de ce que vous nous racontez de lui."
});

module.exports = [guide1, guide2, guide3];
