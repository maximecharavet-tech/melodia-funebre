/* ═══════════════════════════════════════════════════════════════
   LES PAGES DE PROCHES — quatre lecteurs de plus

   Après « maman » et « papa » (p-situations.js), les situations qui
   reviennent le plus dans les recherches : on a perdu un grand-parent,
   un frère ou une sœur, son conjoint, un ami. Chacune a ses
   questions propres — qui parle, au nom de qui, que raconter — et
   donc son propre texte : le gabarit partage la mise en page, aucun
   contenu.

   Pas d'audio ici : ces pages renvoient aux hommages de démonstration
   du catalogue (fiches d'écoute existantes). Une œuvre retirée du
   catalogue disparaît de la liste sans casser la génération. Les faits
   cités sont ceux des fiches d'écoute, des offres et du processus ;
   aucun avis, aucun client réel, aucun chiffre inventé.
   ═══════════════════════════════════════════════════════════════ */

const { page } = require('./gabarit-requete.js');
const { extrait: cite, oeuvre, lien } = require('./citations.js');
const { OFFERS, STYLES, enLettres } = require('./data.js');

const extrait = (titre, legende) => cite(titre, legende, 'p-proches.js');
const PUBLIE = '2026-11-28';
const prix = (nom) => { const o = OFFERS.find((x) => x.name === nom); return o ? o.price + ' €' : ''; };
const ESSENTIEL = prix('Essentiel'), PRESTIGE = prix('Prestige'), MEMORIAL = prix('Mémorial');

const liste = (items) => items.map(([titre, texte]) => {
  const t = oeuvre(titre, 'p-proches.js');
  return t ? `          <li><a href="${lien(t)}"><em>${t.title}</em></a> (${t.style.toLowerCase()}) — ${texte}</li>` : '';
}).filter(Boolean).join('\n');

const service = (audience) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Chanson d’hommage composée sur mesure',
  serviceType: 'Composition d’une chanson d’hommage funéraire',
  provider: { '@id': 'https://melodia-funebre.fr/#organisation' },
  areaServed: { '@type': 'Country', name: 'France' },
  audience: { '@type': 'Audience', audienceType: audience },
  offers: OFFERS.map((o) => ({
    '@type': 'Offer', name: o.name, price: String(o.price), priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock', url: 'https://melodia-funebre.fr/offres'
  }))
});

const CADRE = `Les œuvres ci-dessous sont des <strong>hommages de démonstration</strong>, composés par Melodia Funèbre : chaque fiche d’écoute donne le récit de la personne, un extrait des paroles et l’enregistrement complet.`;

/* ═══════════════════════════════════════════════════════════════
   1 — GRAND-PARENT
   ═══════════════════════════════════════════════════════════════ */
const grandParent = page({
  file: 'chanson-pour-grand-parent-decede.html',
  fil: 'Pour un grand-parent',
  title: 'Chanson pour grand-mère ou grand-père décédé(e) : hommage',
  desc: `Une chanson pour votre grand-mère ou votre grand-père décédé(e), écrite d’après ce que la famille raconte de lui ou d’elle. Que dire, quel style. Dès ${ESSENTIEL}.`,
  datePublished: PUBLIE,
  h1: 'Une chanson d’hommage<br><em>pour un grand-parent.</em>',
  situation: "Pour un petit-enfant, un fils ou une fille qui prépare les obsèques d’une grand-mère ou d’un grand-père.",
  chapeau: "Un grand-parent n’est pas la même personne pour tout le monde : pour ses enfants, un père ou une mère ; pour ses petits-enfants, celui ou celle qui avait le temps. C’est aussi quelqu’un qui a grandi avec une autre musique que la vôtre. Cette page vous aide à choisir entre un morceau connu et une chanson écrite pour lui ou pour elle, à décider ce qu’il faut raconter, et vous propose d’écouter des hommages de démonstration écrits pour des grands-parents.",
  corps: `
  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="generation">La musique de sa génération, pas de la vôtre</h2>
        <p>Un grand-père ou une grand-mère a grandi avec des airs que ses petits-enfants n’ont jamais écoutés ; l’écart se compte souvent en décennies. Le choix le plus juste est rarement le morceau que vous écoutez vous-même. Trois pistes reviennent :</p>
        <ul class="liste-or">
          <li><strong>Un air de sa jeunesse</strong> — une valse, une chanson de bal, le refrain qu’il ou elle fredonnait en cuisinant ou en bricolant.</li>
          <li><strong>Le morceau des repas de famille</strong>, celui qu’on mettait à la fin du dessert, ou celui du mariage de ses enfants.</li>
          <li><strong>Un morceau choisi par les petits-enfants</strong>, à condition qu’on le comprenne sans explication : si la salle doit se demander pourquoi, il vaut mieux l’écarter.</li>
        </ul>
        <p>Dans tous les cas, relisez les paroles en entier et vérifiez la fin du morceau : nous détaillons ces contrôles dans <a href="/musique-obseques">le guide de la musique d’un enterrement</a>.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="raconter">Ce qu’il faut raconter de lui, ou d’elle</h2>
        <p>Un grand-parent est souvent résumé en deux mots — « gentil », « toujours là ». Une chanson a besoin d’autre chose : des gestes, des lieux, des objets.</p>
        <ul class="liste-or">
          <li><strong>L’endroit où on le retrouvait</strong> : la cuisine, le jardin, le bord de l’eau, l’atelier.</li>
          <li><strong>Ce qu’il ou elle vous a appris</strong> : pêcher, tricoter, jouer aux cartes, planter, compter la monnaie.</li>
          <li><strong>Une phrase, mot pour mot</strong>, celle qu’on répète encore en famille.</li>
          <li><strong>La table</strong> : qui venait, ce qu’on y mangeait, la place qu’on y trouvait toujours.</li>
          <li><strong>Les prénoms des petits-enfants</strong>, ou leurs surnoms, si la famille souhaite qu’ils figurent.</li>
        </ul>
        <p>Les enfants du défunt connaissent souvent les années que les petits-enfants n’ont pas vues : le métier, la jeunesse, le pays d’origine. Une chanson peut tenir les deux. Mettez-vous d’accord entre cousins sur deux ou trois souvenirs plutôt que sur vingt : c’est la précision qui émeut, pas la quantité.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="exemples">Des hommages de démonstration écrits pour des grands-parents</h2>
        <p>${CADRE}</p>
        <ul class="liste-or">
${liste([
  ['Le Papi Pêcheur', 'Pour Maurice, 78 ans, pêcheur en bord de Loire pendant quarante ans, qui a appris à pêcher à chacun de ses quatre petits-enfants. Guitare et accordéon, sur un tempo de marche tranquille.'],
  ['Sous le lierre', 'Pour Yvette, « la mamie de la maison » : des cartables dans l’entrée, toujours une place de plus à table. Sa famille voulait une valse, pas un chant grave, avec un chœur d’enfants sur le refrain.'],
  ['Personne n’oublie ton rire', 'Pour Odette, « super mamie », qui cuisinait sans balance et à la table de qui Paul, Thomas, Virginie et Nolan ont grandi. Orgue Hammond et chœur gospel.'],
  ['Une lumière sur le porche', 'Pour Mitch, papy de sept petits-enfants : une americana qui passe du français à l’anglais « comme on passe d’une génération à l’autre ».']
])}
        </ul>
${extrait('Le Papi Pêcheur', 'Pour un grand-père qui transmettait ses gestes')}
        <p>Ces quatre œuvres ne se ressemblent pas : une chanson française, une valse musette, un gospel, une americana. C’est ce que la famille a raconté qui a décidé du style, et non l’inverse.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="moment">Où la placer dans la cérémonie</h2>
        <p>Pour un grand-parent, la chanson trouve souvent sa place au moment du recueillement, après les prises de parole : elle reprend en musique ce que les petits-enfants et les enfants viennent de dire. Si un petit-enfant lit un texte, la chanson peut le suivre sans rien y ajouter. Certaines œuvres s’adressent à la personne (« tu »), d’autres parlent d’elle ; le choix se fait à l’entretien, selon qui, dans la famille, doit sembler parler.</p>
        <p>Pour l’entrée ou la sortie, un morceau de sa génération suffit, ou <a href="/musique-obseques-instrumentale">la version sans paroles</a> de sa chanson. Si la famille ne se reconnaît pas dans un rite religieux, <a href="/musique-ceremonie-civile">le déroulé d’une cérémonie civile</a> laisse toute la place.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="vivant">S’il ou elle est encore là</h2>
        <p>Un grand-parent très âgé peut entendre lui-même sa chanson : il ou elle la corrige, la fait écouter à ses petits-enfants, et elle reste ensuite. L’hommage de démonstration pour Ruth, quatre-vingt-cinq ans, est de cette nature : <a href="/ecouter/eshet-chayil-femme-de-valeur"><em>Eshet Chayil, femme de valeur</em></a>. Nous expliquons la démarche sur la page <a href="/de-son-vivant">de son vivant</a>.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="commander">Comment commander</h2>
        <p>Vous décrivez la personne lors d’un entretien téléphonique de quelques minutes — nous posons les questions, vous n’avez rien à préparer. Nous écrivons les paroles, composons la musique, puis un humain écoute l’œuvre en entier avant l’envoi. Elle est livrée sous vingt-quatre heures après l’entretien, avec une priorité possible en six heures pour une cérémonie imminente.</p>
        <p>L’offre Essentiel (${ESSENTIEL}) comprend la chanson ; Prestige (${PRESTIGE}) ajoute une révision, la version instrumentale et les paroles en PDF ; Mémorial (${MEMORIAL}) comprend un mini-album de trois titres et des révisions illimitées. Le détail est sur <a href="/offres">la page des offres</a> et le déroulé sur <a href="/processus">le processus</a>. Pour comprendre ce qu’est une chanson d’hommage avant de décider : <a href="/chanson-hommage">tout savoir sur la chanson d’hommage</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Quelle chanson pour l’enterrement d’une grand-mère ?",
      texte: "Un air de sa génération, le morceau des repas de famille, ou une chanson écrite pour elle d’après ce que la famille raconte. Le critère est simple : la salle doit comprendre sans explication pourquoi ce morceau est là." },
    { q: "Quelle chanson pour l’enterrement d’un grand-père ?",
      texte: "Même démarche : une chanson de sa jeunesse, ou une œuvre écrite pour lui à partir de ses gestes et de ses lieux — la pêche, le jardin, l’atelier. Relisez les paroles en entier avant de la retenir." },
    { q: "Peut-on faire écrire une chanson pour sa grand-mère décédée ?",
      texte: "Oui. Vous décrivez sa vie lors d’un entretien téléphonique ; nous écrivons les paroles et composons la musique, puis une personne écoute l’œuvre en entier avant l’envoi. Elle est livrée sous vingt-quatre heures après l’entretien." },
    { q: "Que dire dans une chanson pour un grand-père décédé ?",
      texte: "Des détails plutôt que des qualités : l’endroit où on le retrouvait, ce qu’il a appris à ses petits-enfants, une phrase qu’il répétait, la table de famille. Deux ou trois souvenirs précis valent mieux qu’une longue liste." },
    { q: "Qui doit commander la chanson : les enfants ou les petits-enfants ?",
      texte: "N’importe lequel des deux, de préférence après en avoir parlé entre vous. Les enfants du défunt connaissent sa jeunesse, les petits-enfants son quotidien : le texte est plus juste quand les deux voix sont entendues." },
    { q: "La chanson peut-elle citer les petits-enfants ?",
      texte: "Oui, si la famille le souhaite : les hommages de démonstration citent parfois des prénoms. Précisez-le à l’entretien, avec les prénoms exacts et leur orthographe." },
    { q: "Peut-on offrir une chanson à un grand-parent encore vivant ?",
      texte: "Oui : une chanson peut être composée de son vivant, écoutée par la personne et conservée par la famille. La démarche est décrite sur la page « de son vivant »." },
    { q: "Combien coûte une chanson d’hommage pour un grand-parent ?",
      texte: `Les offres sont les mêmes pour toutes les situations : Essentiel ${ESSENTIEL}, Prestige ${PRESTIGE}, Mémorial ${MEMORIAL}. Le détail de chacune est sur la page des offres.` }
  ],
  jsonldPlus: [service('Petits-enfants et familles en deuil d’un grand-parent')],
  proposition: "Si aucun morceau ne lui ressemble, nous écrivons et composons sa chanson d’après ce que la famille raconte de lui ou d’elle, et vous la recevez avant la cérémonie.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/chanson-pour-maman-decedee', 'Une chanson pour maman', "Si c’est aussi votre mère que vous accompagnez"],
    ['/chanson-pour-papa-decede', 'Une chanson pour papa', "Si c’est votre père que vous accompagnez"],
    ['/de-son-vivant', 'Une chanson de son vivant', "Si la personne est encore là pour l’entendre"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   2 — FRÈRE OU SŒUR
   ═══════════════════════════════════════════════════════════════ */
const fratrie = page({
  file: 'chanson-pour-frere-soeur-decede.html',
  fil: 'Pour un frère ou une sœur',
  title: 'Chanson pour un frère ou une sœur décédé(e) : hommage',
  desc: `Une chanson pour votre frère ou votre sœur décédé(e), écrite d’après ce que vous seul savez de lui ou d’elle : l’enfance, les surnoms. Dès ${ESSENTIEL}.`,
  datePublished: PUBLIE,
  h1: 'Une chanson d’hommage<br><em>pour un frère, une sœur.</em>',
  situation: "Pour celui ou celle qui doit dire adieu à la personne avec qui il ou elle a grandi.",
  chapeau: "Un frère ou une sœur est la seule personne qui a connu les mêmes parents, la même maison, les mêmes étés. À la cérémonie, les autres parleront du fils, de l’époux, de l’ami : vous pouvez parler de l’enfance. Cette page vous aide à décider ce qu’une chanson peut en dire, à vous mettre d’accord avec vos parents et les proches, et à choisir un style qui lui ressemble.",
  corps: `
  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="enfance">Ce que vous seul savez</h2>
        <p>Personne d’autre dans la salle n’a partagé la chambre, les trajets de vacances ni les disputes que les parents ont oubliées. C’est exactement ce dont une chanson a besoin :</p>
        <ul class="liste-or">
          <li><strong>Les surnoms</strong>, ceux qu’on n’utilisait qu’entre vous.</li>
          <li><strong>Un langage à deux</strong> : une expression, un code, un rire qui partait pour rien.</li>
          <li><strong>Une bêtise d’enfance</strong>, racontée assez précisément pour qu’on la voie.</li>
          <li><strong>Ce que l’un disait de l’autre</strong> devant les parents, ou dans son dos.</li>
          <li><strong>Un lieu</strong> : la maison de famille, une plage, un escalier.</li>
        </ul>
        <p>Une chanson n’a pas besoin de tout dire. Un détail exact vaut mieux que dix qualités, et ce que vous gardez pour vous reste à vous.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="accord">Se mettre d’accord en famille</h2>
        <p>Une cérémonie est le deuil de plusieurs personnes à la fois, et la vôtre n’est pas celle de vos parents. Avant de commander, prévenez-les. Si ses parents sont encore là, la chanson doit pouvoir être entendue par eux sans qu’ils se sentent mis de côté ; s’il ou elle laisse un conjoint ou des enfants, demandez-leur s’il y a un mot, un souvenir ou un prénom à faire figurer.</p>
        <p>Décidez aussi <em>qui parle</em> dans la chanson : « je », comme un frère ou une sœur qui s’adresse à lui ou à elle, ou « nous », au nom de toute la famille. Dire « nous » est plus simple quand plusieurs personnes l’entendent ; dire « je » est plus intime et convient quand c’est vous seul qui la présentez.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="ton">Le ton : ni solennel, ni forcé</h2>
        <p>Un frère ou une sœur part parfois trop tôt, et la salle est alors composée de gens qui n’avaient pas prévu cette cérémonie. Dans plusieurs hommages de démonstration, la famille a demandé que la chanson <em>ne soit pas triste</em> : qu’elle fasse exister la personne encore un peu, plutôt que d’en pleurer l’absence.</p>
        <ul class="liste-or">
${liste([
  ['Jusqu’au jour où l’on se retrouve', 'Pour Jason, 38 ans. Sa famille n’a pas demandé une chanson triste, mais qu’il soit encore là quelque part — dans la lumière au bord des fenêtres, dans le vent. Piano de concert, violoncelle, voix soul.'],
  ['Qui danse avec le vent', 'Pour Pierre, 40 ans, « l’éternel sourire », dont la famille disait que le vrai courage était d’aimer sans filet. Piano, guitare électrique, ballade rock.'],
  ['Paula, le vent te porte', 'Pour Paula, 54 ans, qui savait écouter les silences des autres et donner sans compter. Flûte amérindienne, guitare en fingerpicking, polyphonie masculine.']
])}
        </ul>
${extrait('Jusqu’au jour où l’on se retrouve', 'Composée pour un homme de trente-huit ans')}
        <p>Chacune a un ton différent parce que chaque famille a décrit une personne différente. Il n’y a pas de bonne réponse : seulement celle que la personne aurait reconnue.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="style">Choisir le style : ce que vous écoutiez ensemble</h2>
        <p>Pensez à la musique de l’adolescence, celle qui passait dans la voiture ou derrière la porte fermée de la chambre. Le catalogue va du rock à la ballade rock, du folk au piano, du reggae au funk et au R&amp;B. Plus que le genre, c’est la vitesse qui compte : une chanson pour quelqu’un de vif ne doit pas traîner.</p>
        <p>Si vous hésitez, demandez-vous ce que votre frère ou votre sœur aurait fait baisser ou monter dans la voiture. Le style se confirme à l’entretien, avec vous.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="moment">Quand la faire entendre</h2>
        <p>La chanson prend naturellement place après les prises de parole, au recueillement. Si c’est vous qui lisez un texte, elle peut venir juste après, sans rien y ajouter. Pour l’entrée ou la sortie, <a href="/musique-obseques-instrumentale">la version sans paroles</a> évite d’avoir à choisir entre deux versions. Le guide <a href="/musique-obseques">de la musique d’un enterrement</a> reprend les vérifications à faire avant le jour J.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="commander">Comment commander</h2>
        <p>Un entretien téléphonique de quelques minutes suffit : c’est nous qui posons les questions, à vous de dire ce que vous voulez entendre. La composition, puis une écoute intégrale par un humain, précèdent l’envoi ; la livraison a lieu sous vingt-quatre heures après l’entretien, avec une priorité possible en six heures si la cérémonie est proche.</p>
        <p>Les tarifs sont ceux de la page <a href="/offres">des offres</a> — Essentiel ${ESSENTIEL}, Prestige ${PRESTIGE}, Mémorial ${MEMORIAL}. Pour savoir comment se construit une œuvre de ce genre, lisez <a href="/chanson-hommage">la page sur la chanson d’hommage</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Peut-on faire écrire une chanson pour son frère décédé ?",
      texte: "Oui. Vous racontez votre frère lors d’un entretien téléphonique ; nous écrivons les paroles et composons la musique, puis une personne écoute l’œuvre en entier avant l’envoi. Elle est livrée sous vingt-quatre heures après l’entretien." },
    { q: "Que dire dans une chanson pour une sœur décédée ?",
      texte: "Ce que vous seule savez : un surnom, une expression à deux, une bêtise d’enfance, un lieu. Un détail précis touche plus que dix qualités, et vous restez libre de garder pour vous ce qui est trop intime." },
    { q: "Faut-il prévenir ses parents avant de commander une chanson ?",
      texte: "Oui, c’est préférable. Une cérémonie est le deuil de plusieurs personnes, et la chanson sera entendue par vos parents, par son conjoint, ses enfants. Leur accord évite qu’elle soit vécue comme une prise de parole à leur place." },
    { q: "La chanson doit-elle être triste ?",
      texte: "Non. Dans plusieurs hommages de démonstration, la famille a demandé une chanson qui ne soit pas triste. Le ton se décide à l’entretien, d’après ce que la personne était." },
    { q: "Quel style choisir pour un frère ou une sœur ?",
      texte: "Celui que vous écoutiez ensemble : rock, folk, piano, reggae, funk, R&B… Le style se confirme à l’entretien, en fonction de ce qu’il ou elle écoutait vraiment." },
    { q: "Qui parle dans la chanson : « je » ou « nous » ?",
      texte: "« Je » est plus intime, quand vous êtes seul ou seule à la présenter ; « nous » parle au nom de toute la famille et convient quand plusieurs personnes l’entendent. Le choix se fait avant l’écriture." },
    { q: "Combien coûte une chanson d’hommage pour un frère ou une sœur ?",
      texte: `Les offres sont les mêmes pour toutes les situations : Essentiel ${ESSENTIEL}, Prestige ${PRESTIGE}, Mémorial ${MEMORIAL}. Le détail de chacune est sur la page des offres.` }
  ],
  jsonldPlus: [service('Frères, sœurs et familles en deuil')],
  proposition: "Nous écrivons et composons sa chanson d’après ce que vous seul savez de lui ou d’elle, et vous la recevez avant la cérémonie.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/chanson-pour-maman-decedee', 'Une chanson pour maman', "Si vos parents préparent aussi un hommage"],
    ['/chanson-pour-ami-decede', 'Une chanson pour un ami', "Si ses amis veulent aussi dire quelque chose"],
    ['/musique-obseques', 'Choisir la musique des obsèques', "Pour le déroulé complet et les vérifications du jour J"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   3 — MARI OU ÉPOUSE
   ═══════════════════════════════════════════════════════════════ */
const conjoint = page({
  file: 'chanson-pour-mari-epouse-decede.html',
  fil: 'Pour un mari ou une épouse',
  title: 'Chanson pour un mari ou une épouse décédé(e) : hommage',
  desc: `Une chanson pour votre mari ou votre épouse décédé(e) : ce qu’on dit à celui ou celle qui partageait votre vie, et ce qu’on garde pour soi. Dès ${ESSENTIEL}.`,
  datePublished: PUBLIE,
  h1: 'Une chanson d’hommage<br><em>pour un mari, une épouse.</em>',
  situation: "Pour un veuf ou une veuve qui prépare la cérémonie de la personne dont il ou elle a partagé la vie.",
  chapeau: "Perdre son conjoint, c’est perdre à la fois la personne et la façon dont elle vous parlait. À la cérémonie, tout le monde l’écoutera : ses enfants, ses amis, sa famille — et vous, qui n’aurez peut-être pas la force de parler. Une chanson peut dire ce que vous voulez que la salle entende, et laisser de côté ce qui n’appartient qu’à vous. Cette page vous aide à choisir ce qu’elle dira, à qui elle s’adresse, et comment la faire entendre.",
  corps: `
  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="a-qui">À qui s’adresse la chanson</h2>
        <p>Trois possibilités, et aucune n’est la bonne :</p>
        <ul class="liste-or">
          <li><strong>À lui ou à elle</strong>, avec « tu » : la salle assiste à ce que vous lui dites. C’est le plus bouleversant, et le plus intime.</li>
          <li><strong>À la salle</strong>, en parlant de lui ou d’elle : plus facile à entendre pour les enfants et les amis, et plus proche d’un portrait.</li>
          <li><strong>À vous deux</strong>, en alternant : un couplet pour la salle, un refrain pour lui ou pour elle.</li>
        </ul>
        <p>Choisissez en pensant à ceux qui seront au premier rang : vos enfants entendront la chanson aussi. Si vous hésitez, le plus sûr est d’écrire pour la salle, et de glisser un seul « tu » au refrain.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="raconter">Ce qu’il faut raconter</h2>
        <ul class="liste-or">
          <li><strong>La rencontre</strong> : un lieu, une date, un geste — trois roses offertes un soir d’été en disent plus que « nous nous sommes aimés ».</li>
          <li><strong>La maison</strong> et ses habitudes : le café du matin, la place sur le canapé, la musique du dimanche.</li>
          <li><strong>Un mot à lui ou à elle</strong>, que personne d’autre n’emploie.</li>
          <li><strong>Ce qu’il ou elle laisse</strong> : les enfants, les petits-enfants, un jardin, un bateau, un métier.</li>
          <li><strong>Ce qui le ou la rendait drôle</strong> : un chagrin n’interdit pas de sourire, et la salle en a besoin.</li>
        </ul>
        <p>Gardez pour vous ce qui est trop intime : une chanson sera entendue par la salle entière, et l’entretien est là pour décider avec vous de ce qui y figure.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="couple">Le morceau du couple</h2>
        <p>Beaucoup de couples ont <em>leur</em> chanson : celle du mariage, de la première danse, du trajet vers la mer. Elle peut rester, telle quelle, à l’entrée ou à la sortie de la cérémonie : elle fera pleurer la salle, et c’est ce qu’elle doit faire. Une chanson écrite pour lui ou pour elle ne la remplace pas : placée au recueillement, elle dit ce que le morceau du couple ne peut pas dire — ce qu’il ou elle était, aujourd’hui.</p>
        <p>Nous détaillons les moments où placer une musique dans <a href="/musique-obseques">le guide de la musique d’un enterrement</a>.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="exemples">Des hommages de démonstration où l’on parle de l’être aimé</h2>
        <p>${CADRE}</p>
        <ul class="liste-or">
${liste([
  ['Jean, Paris', 'Pour Jean, 40 ans, mari de Catia et père de Lucas et Julie. La famille a parlé de la ville qu’il aimait, puis de ce qui passait avant tout le reste : eux quatre. Piano et saxophone, sur une montée gospel.'],
  ['Qui danse avec le vent', 'Pour Pierre, 40 ans, dont l’étoile était Emeline. Elle a demandé que la chanson ne soit pas triste, et qu’on y entende ce qu’il lui aurait dit lui-même.'],
  ['Sous le lierre', 'Pour Yvette, qui avait rencontré Marcel un soir d’été ; il lui avait offert trois roses. Une valse musette : accordéon, violon, clarinette.'],
  ['Vers l’île d’Ys', 'Pour Yann, marin de Bréhat, qui a épousé Marie aux cheveux couleur de lin. Une ballade celtique.'],
  ['Une lumière sur le porche', 'Pour Mitch : Sarah l’attendait sous le porche, au bord de la rivière. Guitare, pedal steel, fiddle.']
])}
        </ul>
${extrait('Jean, Paris', 'Composée pour un mari et père de famille')}
        <p>Dans ces œuvres, le conjoint n’est jamais le sujet principal ; il est là, discrètement, comme dans la cérémonie.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="enfants">Avec les enfants</h2>
        <p>Vos enfants ont perdu un parent, et chacun le pleure à sa manière. Avant de commander, demandez-leur s’il y a un souvenir, une phrase ou un surnom à faire figurer : cela fait de la chanson une œuvre de famille, pas seulement la vôtre. S’ils sont adultes, l’un d’eux peut être à vos côtés au moment de l’entretien.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="commander">Comment commander</h2>
        <p>Vous n’avez rien à écrire. Un entretien téléphonique de quelques minutes, au cours duquel nous posons les questions ; puis la composition, et une écoute intégrale par un humain avant l’envoi. La livraison a lieu sous vingt-quatre heures après l’entretien — six heures en priorité, si la cérémonie est proche.</p>
        <p>Essentiel ${ESSENTIEL}, Prestige ${PRESTIGE}, Mémorial ${MEMORIAL} : <a href="/offres">les offres</a> sont détaillées sur leur page, et <a href="/processus">le processus</a> sur la sienne. Pour tout savoir sur la forme d’une chanson d’hommage, lisez <a href="/chanson-hommage">cette page</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Peut-on faire écrire une chanson pour son mari décédé ?",
      texte: "Oui. Vous racontez votre mari lors d’un entretien téléphonique ; nous écrivons les paroles et composons la musique, puis une personne écoute l’œuvre en entier avant l’envoi. Elle est livrée sous vingt-quatre heures après l’entretien." },
    { q: "Quelle chanson pour l’enterrement de sa femme ?",
      texte: "Une chanson qui parle d’elle — ce qu’elle disait, ce qu’elle faisait — plutôt qu’un morceau générique. Le morceau du couple (mariage, première danse) peut rester à l’entrée ou à la sortie, et la chanson écrite pour elle trouver sa place au recueillement." },
    { q: "La chanson doit-elle s’adresser à lui ou à elle, ou parler de lui ou d’elle ?",
      texte: "Les deux se font : un « tu » est plus intime ; parler à la salle est plus facile à entendre pour les enfants. Une solution courante consiste à écrire pour la salle, avec un seul « tu » au refrain." },
    { q: "Peut-on garder le morceau du mariage et ajouter une chanson d’hommage ?",
      texte: "Oui. Le morceau du couple garde sa place à l’entrée ou à la sortie ; la chanson écrite pour la personne s’entend au moment du recueillement." },
    { q: "Comment associer les enfants à la chanson ?",
      texte: "En leur demandant un souvenir, une phrase ou un surnom à faire figurer, avant l’entretien. S’ils sont adultes, l’un d’eux peut être à vos côtés au moment de l’entretien." },
    { q: "Je n’ai pas la force de parler : puis-je quand même la commander ?",
      texte: "Oui. L’entretien dure quelques minutes et c’est nous qui posons les questions : vous n’avez rien à préparer, et un proche peut vous accompagner." },
    { q: "Combien coûte une chanson d’hommage pour un conjoint ?",
      texte: `Les offres sont les mêmes pour toutes les situations : Essentiel ${ESSENTIEL}, Prestige ${PRESTIGE}, Mémorial ${MEMORIAL}. Le détail de chacune est sur la page des offres.` }
  ],
  jsonldPlus: [service('Veufs, veuves et familles en deuil d’un conjoint')],
  proposition: "Nous écrivons et composons sa chanson d’après ce que vous nous racontez de lui ou d’elle, et vous la recevez avant la cérémonie.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/chanson-pour-papa-decede', 'Une chanson pour papa', "Si ses enfants préparent aussi un hommage à leur père"],
    ['/chanson-pour-maman-decedee', 'Une chanson pour maman', "Si ses enfants préparent aussi un hommage à leur mère"],
    ['/musique-ceremonie-civile', 'Une cérémonie civile', "Si la cérémonie n’a pas de cadre religieux"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   4 — AMI
   ═══════════════════════════════════════════════════════════════ */
const ami = page({
  file: 'chanson-pour-ami-decede.html',
  fil: 'Pour un ami',
  title: 'Chanson pour un ami décédé : un hommage sur mesure',
  desc: `Une chanson pour un ami décédé, écrite d’après ce que ses amis racontent de lui : la bande, les soirées, la route. Comment faire, avec qui. Dès ${ESSENTIEL}.`,
  datePublished: PUBLIE,
  h1: 'Une chanson d’hommage<br><em>pour un ami.</em>',
  situation: "Pour celui ou celle qui perd un ami et veut que la cérémonie lui ressemble, sans prendre la place de sa famille.",
  chapeau: "Un ami n’est pas de la famille, et c’est ce qui rend la démarche délicate : on veut dire quelque chose, sans décider à la place de ses proches. Pourtant ce sont souvent les amis qui connaissent la musique qu’il écoutait, les soirées, la route. Cette page vous aide à en parler à sa famille, à réunir ce que vous savez de lui, et à choisir un style qui lui ressemble.",
  corps: `
  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="famille">D’abord, en parler à sa famille</h2>
        <p>C’est la famille qui organise la cérémonie et qui sera au premier rang. Avant de commander, contactez la personne qui s’en occupe — son conjoint, un parent, un enfant — et proposez-lui la chanson comme un cadeau des amis, pas comme une décision. Si elle accepte, la démarche est plus simple pour tout le monde : elle sait ce que la salle entendra, et la chanson peut être placée au bon endroit du déroulé.</p>
        <p>Si elle préfère ne pas ajouter de musique, respectez-le : une chanson peut aussi s’écouter plus tard, entre amis, un soir, ou le jour d’un anniversaire.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="reunir">Ce que les amis savent de lui</h2>
        <p>La famille connaît l’état civil, les amis connaissent le reste. Demandez à chacun une anecdote, par message, en une soirée — puis choisissez-en deux ou trois :</p>
        <ul class="liste-or">
          <li><strong>La bande</strong> : le groupe, l’équipe, l’orchestre, le club où on le retrouvait.</li>
          <li><strong>Ses soirées</strong> : la musique qu’il mettait, la danse qu’il faisait, l’heure à laquelle il partait.</li>
          <li><strong>Un voyage, une route</strong>, un défi tenu ensemble.</li>
          <li><strong>Une phrase de lui</strong>, mot pour mot — celle qu’on répète encore.</li>
          <li><strong>Son rire</strong> : ce qu’il déclenchait dans une pièce.</li>
        </ul>
        <p>Une seule personne parle à l’entretien, au nom des autres : désignez-la avant d’appeler, pour que le texte garde une voix.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="exemples">Des hommages de démonstration à ses amis, ses soirées, sa route</h2>
        <p>${CADRE}</p>
        <ul class="liste-or">
${liste([
  ['Saudade Noite', 'Pour Sergio, 69 ans, Brésilien de Marseille, danseur infatigable. Sa famille voulait de la joie, pas des larmes : « il aurait détesté qu’on pleure ». Bossa nova.'],
  ['Le rocker au cœur d’or', 'Pour Gilbert, rocker de Lyon, qui suivait la tournée de Johnny sur les routes de France. Guitares électriques, orgue Hammond, et une foule qui chante.'],
  ['Le roi de la route', 'Pour Bernard, 69 ans, quarante ans d’autoroutes au volant de son camion. Du funk.'],
  ['Ta lumière reste', 'Pour Anthony, « routard de la vie », qui parlait cinq langues et gardait le patwa dans le cœur. Du reggae.'],
  ['La lumière que tu laissais', 'Pour Mathieu, soignant, qui passait ses nuits dans les couloirs de l’hôpital. Piano, saxophone ténor, Rhodes et chœur soul.']
])}
        </ul>
${extrait('Saudade Noite', 'Composée pour un danseur infatigable')}
        <p>Un rocker se raconte en rock, un danseur en bossa nova : le style n’est pas décoratif, il dit quelque chose de la personne.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="style">Le style : celui de la soirée</h2>
        <p>Pour un ami, la meilleure question est : <em>qu’est-ce qu’il aurait mis sur la platine ?</em> Rock, funk, reggae, bossa nova, folk, piano — le catalogue couvre ${enLettres(STYLES.length)} styles, du chant corse au gospel. Si vous n’êtes pas sûrs, choisissez le morceau qui revient quand vous pensez à lui : c’est presque toujours le bon.</p>
        <p>Il n’est pas obligé d’être doux. Plusieurs hommages de démonstration sont rythmés, parce que la personne l’était. Seul compte que la salle puisse se dire : « c’est lui. »</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="ceremonie">À la cérémonie</h2>
        <p>La place des amis dépend du cadre. Dans une cérémonie religieuse, leur temps de parole est limité, et la chanson est plus souvent écoutée au recueillement ; dans une <a href="/musique-ceremonie-civile">cérémonie civile</a>, on peut lui réserver un moment à part, entre deux prises de parole. Si les amis se retrouvent ensuite autour d’un verre, c’est un second moment où elle a toute sa place.</p>
        <p>Les contrôles techniques — clé USB, copie de secours, essai de son — figurent dans <a href="/musique-obseques">le guide de la musique d’un enterrement</a>.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="commander">Comment commander</h2>
        <p>Une seule commande, passée par la personne désignée : un entretien téléphonique de quelques minutes, où nous posons les questions. Nous écrivons, composons, et un humain écoute l’œuvre en entier avant l’envoi. Vous la recevez sous vingt-quatre heures après l’entretien ; une priorité en six heures existe si la cérémonie approche.</p>
        <p>Les tarifs — Essentiel ${ESSENTIEL}, Prestige ${PRESTIGE}, Mémorial ${MEMORIAL} — sont sur <a href="/offres">la page des offres</a>. Pour comprendre comment se construit une chanson d’hommage : <a href="/chanson-hommage">c’est ici</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Peut-on faire écrire une chanson pour un ami décédé ?",
      texte: "Oui. Une personne désignée décrit l’ami lors d’un entretien téléphonique ; nous écrivons les paroles et composons la musique, puis une personne écoute l’œuvre en entier avant l’envoi. Elle est livrée sous vingt-quatre heures après l’entretien." },
    { q: "Faut-il l’accord de la famille pour commander une chanson pour un ami ?",
      texte: "Ce n’est pas une obligation légale, mais c’est une question de respect : c’est la famille qui organise la cérémonie. Proposez-lui la chanson comme un cadeau des amis, avant de commander." },
    { q: "Qui commande quand plusieurs amis veulent participer ?",
      texte: "Une seule personne, désignée à l’avance, qui parle à l’entretien au nom des autres. Chacun lui envoie une anecdote avant l’appel, pour que le texte garde une seule voix." },
    { q: "Quelle chanson pour l’enterrement d’un ami ?",
      texte: "Celle qui lui ressemble : le morceau qu’il mettait en soirée, ou une chanson écrite d’après ce que ses amis racontent de lui. Relisez les paroles en entier avant de retenir un morceau existant." },
    { q: "Que dire dans une chanson pour un ami décédé ?",
      texte: "La bande, les soirées, un voyage, une phrase de lui, son rire. Deux ou trois détails précis valent mieux qu’une longue liste de qualités." },
    { q: "Une chanson peut-elle être écoutée ailleurs qu’à la cérémonie ?",
      texte: "Oui : entre amis, un soir, ou à une date anniversaire. Une fois livrée, la chanson est à vous et peut s’écouter quand vous le souhaitez." },
    { q: "Combien coûte une chanson d’hommage pour un ami ?",
      texte: `Les offres sont les mêmes pour toutes les situations : Essentiel ${ESSENTIEL}, Prestige ${PRESTIGE}, Mémorial ${MEMORIAL}. Le détail de chacune est sur la page des offres.` }
  ],
  jsonldPlus: [service('Amis et proches en deuil')],
  proposition: "Nous écrivons et composons sa chanson d’après ce que ses amis racontent de lui, et vous la recevez avant la cérémonie.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/chanson-pour-frere-soeur-decede', 'Une chanson pour un frère ou une sœur', "Si c’est un frère ou une sœur que vous accompagnez"],
    ['/musique-ceremonie-civile', 'Une cérémonie civile', "Si la place des amis y est plus libre"],
    ['/chanson-hommage', 'La chanson d’hommage, tout savoir', "Pour comprendre comment elle s’écrit et ce qu’elle coûte"]
  ]
});

module.exports = [grandParent, fratrie, conjoint, ami];
