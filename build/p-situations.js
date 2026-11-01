/* ═══════════════════════════════════════════════════════════════
   LES PAGES DE SITUATION — quatre lecteurs précis

   Les piliers (/chanson-hommage, /musique-obseques, /processus)
   répondent à la question générale. Ces quatre pages répondent à une
   situation qu'aucun pilier ne couvre de front : on a perdu SA mère,
   SON père ; on veut une musique SANS paroles ; la cérémonie est
   CIVILE et rien n'est imposé.

   Même règle que les anciennes pages de requête (gabarit-requete.js) :
   le gabarit partage la mise en page, aucun contenu. Les faits cités
   sont ceux du site — délais, offres, rites, œuvres du catalogue —
   et rien d'autre : pas d'avis, pas de chiffre inventé.
   ═══════════════════════════════════════════════════════════════ */

const { page } = require('./gabarit-requete.js');
const { extrait: cite } = require('./citations.js');

const extrait = (titre, legende) => cite(titre, legende, 'p-situations.js');
const PUBLIE = '2026-11-01';

/* ═══════════════════════════════════════════════════════════════
   1 — CHANSON POUR MAMAN DÉCÉDÉE
   ═══════════════════════════════════════════════════════════════ */
const maman = page({
  file: 'chanson-pour-maman-decedee.html',
  fil: 'Pour une maman',
  title: 'Chanson pour maman décédée | Melodia Funèbre',
  desc: "Une chanson pour maman décédée : choisir un morceau existant ou faire écrire la sienne, ce qu’il faut raconter, et comment la faire entendre aux obsèques.",
  datePublished: PUBLIE,
  h1: 'Une chanson<br><em>pour maman.</em>',
  situation: "Pour un fils ou une fille qui cherche quoi faire entendre aux obsèques de sa mère.",
  chapeau: "Il existe de très belles chansons sur les mères. Le plus souvent, pourtant, aucune ne parle de la vôtre : de sa cuisine, de sa voix au téléphone, de la façon dont elle disait votre prénom. Cette page vous aide à choisir — un morceau connu, ou une chanson écrite pour elle — et à préparer le moment où elle sera entendue.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="choisir">Un morceau connu, ou le sien</h2>
        <p>Les deux sont légitimes, et beaucoup de familles font les deux : un morceau qu’elle aimait à l’entrée, une chanson écrite pour elle au moment du recueillement.</p>
        <ul class="liste-or">
          <li><strong>Le morceau qu’elle chantait.</strong> C’est le choix le plus simple et souvent le plus juste — à condition de relire les paroles en entier. Un refrain qu’on fredonnait en faisant la vaisselle peut cacher un couplet qui, entendu à des obsèques, dit tout autre chose.</li>
          <li><strong>Une chanson « pour les mamans ».</strong> Le répertoire en compte beaucoup ; elles touchent tout le monde, et justement : elles parlent de toutes les mères, donc d’aucune en particulier.</li>
          <li><strong>Une chanson écrite pour elle.</strong> Son prénom, ses gestes, les lieux de sa vie, ce qu’elle vous a transmis. C’est la seule qui ne pourrait être chantée pour personne d’autre.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="raconter">Ce qu’il faut raconter d’elle</h2>
        <p>Une chanson pour une mère ne tient pas à ses qualités — « douce », « courageuse », « généreuse » décrivent la moitié des mères du monde. Elle tient à ce qu’elle faisait. Avant d’écrire ou de nous appeler, notez simplement :</p>
        <ul>
          <li>un geste qui n’était qu’à elle : sa façon de cuisiner, de jardiner, de vous recoiffer avant de partir ;</li>
          <li>une phrase qu’elle répétait, mot pour mot, même si elle fait sourire ;</li>
          <li>un lieu : la maison, le marché, la plage de chaque été ;</li>
          <li>ce qu’elle laisse derrière elle — les enfants, les petits-enfants, une recette, une manière de recevoir.</li>
        </ul>
        <p>C’est ainsi qu’est née <em>Le Jardin du Temps</em> : une jardinière d’Avignon, des roses anciennes, du jasmin blanc, et une fille qui voulait « quelque chose qui sente le matin ».</p>
${extrait('Le Jardin du Temps', 'Écrite d’après ce que sa fille a raconté')}
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="registre">Le style : le sien, pas celui des obsèques</h2>
        <p>Rien n’oblige une chanson d’adieu à être lente ou triste. Une mère qui dansait le samedi soir supportera mal un piano funèbre ; une mamie qui tenait une maison toujours pleine appelle peut-être un accordéon. Le catalogue en donne des exemples réels : <em>Sous le lierre</em> en musette pour Yvette, <em>Personne n’oublie ton rire</em> en gospel pour Odette, <em>Le vent connaît ton nom</em> au piano, avec un Ave Maria, parce que la famille de Chantal voulait que sa foi y soit.</p>
        <p>Si elle était croyante et que la cérémonie a lieu à l’église, vérifiez ce que le rite permet avant de choisir : nous l’avons détaillé <a href="/rites">tradition par tradition</a>.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="ceremonie">Le moment où elle sera entendue</h2>
        <p>Une chanson pour une mère se place en général au recueillement, après les prises de parole : la salle est prête à écouter. Prévenez celui ou celle qui conduit la cérémonie, dites en une phrase qu’elle a été écrite pour elle, et laissez un silence après la dernière note. Pour le reste — clé USB, copie de secours, essai de son — les vérifications sont les mêmes que pour toute musique d’obsèques, et nous les avons réunies dans <a href="/musique-obseques">notre guide sur la musique d’un enterrement</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Quelle chanson passer aux obsèques de sa maman ?",
      texte: "Celle qui lui ressemble plutôt que celle qui parle « des mamans » en général : un morceau qu’elle aimait vraiment, dont vous avez relu toutes les paroles, ou une chanson écrite pour elle à partir de ses gestes, de ses lieux et de ce qu’elle vous a transmis." },
    { q: "Peut-on faire écrire une chanson avec le prénom de sa mère ?",
      texte: "Oui. C’est l’objet même d’une chanson d’hommage : son prénom, les lieux de sa vie et ses gestes sont dans le texte. La famille raconte, la maison écrit et compose, et l’œuvre est livrée sous vingt-quatre heures." },
    { q: "Faut-il que la chanson soit triste ?",
      texte: "Non. Le style se choisit d’après elle : musette, gospel, folk, piano… Une chanson lumineuse peut être plus juste qu’une chanson lente, si c’est ainsi qu’on se souvient d’elle." },
    { q: "Peut-on la faire entendre aussi à ses petits-enfants plus tard ?",
      texte: "Oui. Le fichier vous appartient pour un usage familial : vous pouvez le garder, le copier et le transmettre. Une plaque QR posée sur la tombe peut aussi renvoyer à une page souvenir où on l’écoute." },
    { q: "Les obsèques ont lieu dans deux jours, est-ce encore possible ?",
      texte: "Oui. La livraison se fait sous vingt-quatre heures après l’entretien, et une priorité existe pour les cérémonies imminentes, avec une livraison possible en six heures." }
  ],
  proposition: "Si aucun morceau ne lui ressemble, nous écrivons et composons sa chanson d’après ce que vous nous racontez d’elle, et vous la recevez avant la cérémonie.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/chanson-pour-papa-decede', 'Une chanson pour papa', "Si c’est votre père que vous accompagnez"],
    ['/chanson-hommage', 'La chanson d’hommage, tout savoir', "Si vous voulez savoir comment elle s’écrit et ce qu’elle coûte"],
    ['/qr-code-memorial', 'La plaque QR mémorial', "Si vous voulez qu’on puisse l’écouter sur sa tombe"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   2 — CHANSON POUR PAPA DÉCÉDÉ
   ═══════════════════════════════════════════════════════════════ */
const papa = page({
  file: 'chanson-pour-papa-decede.html',
  fil: 'Pour un papa',
  title: 'Chanson pour papa décédé | Melodia Funèbre',
  desc: "Une chanson pour papa décédé : dire ce qu’il n’a jamais dit, choisir un style qui lui ressemble, et réussir le moment où elle passe aux obsèques.",
  datePublished: PUBLIE,
  h1: 'Une chanson<br><em>pour papa.</em>',
  situation: "Pour un enfant qui veut que les obsèques de son père lui ressemblent vraiment.",
  chapeau: "Beaucoup de pères parlaient peu. Ils montraient : un outil prêté, un trajet en voiture, une passion transmise sans un mot. C’est souvent ce que la famille a le plus de mal à dire à voix haute le jour des obsèques — et ce qu’une chanson dit le mieux.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="silence">Les pères qui ne disaient pas « je t’aime »</h2>
        <p>C’est la remarque qui revient le plus quand une famille nous parle d’un père : « il ne le disait pas, mais… ». Ce « mais » est la matière de la chanson. Giuseppe ne disait jamais « je t’aime » ; il disait « mangia », et sa famille savait ce que cela voulait dire. <em>Peppe, tesoro</em> est partie de là.</p>
        <p>Pour préparer la vôtre, cherchez moins ses qualités que ses preuves :</p>
        <ul>
          <li>ce qu’il vous a appris de ses mains — pêcher, réparer, conduire, jardiner ;</li>
          <li>sa passion, même si elle agaçait : un club, une moto, un camion, une musique ;</li>
          <li>une expression à lui, telle qu’il la disait ;</li>
          <li>ce qu’il aimait par-dessus tout, et qu’il n’a peut-être jamais formulé.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="exemple">Un exemple réel</h2>
        <p>Jean avait quarante ans. Parisien, supporter du Paris Saint-Germain, mari de Catia, père de Lucas et Julie. Sa famille a parlé de la ville, des terrasses, des soirs de match au Parc — puis de ce qui passait avant tout : eux quatre. La chanson est un gospel, piano et saxophone.</p>
${extrait('Jean, Paris', 'Composée pour un père de deux enfants')}
        <p>On n’y trouve ni « papa » ni « héros » : une ville, une absence, et ce qu’il y manque désormais. C’est ce déplacement qui rend une chanson pour un père supportable à entendre en public.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="style">Oser son style à lui</h2>
        <p>Un père fan de rock n’a pas à partir sur un adagio. Le catalogue le montre : <em>Le roi de la route</em> est un funk, pour Bernard, chauffeur routier — personne ne l’attendait, et c’était lui. <em>Le rocker au cœur d’or</em> est un rock, pour Gilbert, qui avait couru acheter son premier disque de Johnny à quinze ans. <em>Le Papi Pêcheur</em> est une chanson française pour Maurice, quarante ans de pêche en bord de Loire.</p>
        <p>La seule réserve est le lieu : si la cérémonie est religieuse, certains rites encadrent la musique, voire l’excluent. Vérifiez sur <a href="/rites">la page des rites</a> avant de fixer votre choix.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="qui-parle">Qui la présente</h2>
        <p>Si l’un des enfants prend la parole, c’est souvent le meilleur moment pour la lancer : quelques mots, puis la musique prend le relais là où la voix ne tient plus. Une seule phrase suffit — « nous avons fait écrire une chanson pour lui, avec ce qu’il était » — et rien n’oblige à lire un texte préparé.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Quelle chanson pour l’enterrement de son papa ?",
      texte: "Une chanson qui parle de lui et pas des pères en général : un morceau qu’il écoutait vraiment, dans son style, ou une chanson écrite d’après ce qu’il faisait, ce qu’il transmettait et ce qu’il aimait. Le style peut être le sien, rock ou funk compris." },
    { q: "Mon père parlait peu, de quoi la chanson peut-elle parler ?",
      texte: "De ce qu’il faisait plutôt que de ce qu’il disait : un savoir-faire transmis, une passion, une habitude, une expression. Ce sont ces détails qui permettent à l’assemblée de le reconnaître dès le premier couplet." },
    { q: "Peut-on citer les enfants et petits-enfants dans la chanson ?",
      texte: "Oui, et c’est fréquent : les prénoms des proches, ce qu’il leur a transmis, ce qu’il laisse. Il suffit de les donner lors de l’entretien." },
    { q: "Peut-on avoir une version sans voix pour l’entrée ?",
      texte: "Oui. L’offre Prestige comprend une version instrumentale seule en plus de la version chantée, ce qui permet de faire entendre la même œuvre à l’entrée puis au recueillement." },
    { q: "En combien de temps la chanson est-elle prête ?",
      texte: "Sous vingt-quatre heures après l’entretien téléphonique. Pour une cérémonie imminente, une priorité permet une livraison en six heures." }
  ],
  proposition: "Si sa chanson n’existe pas encore, nous l’écrivons et la composons d’après ce que vous nous racontez de lui, dans le style qui lui ressemble.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/chanson-pour-maman-decedee', 'Une chanson pour maman', "Si c’est votre mère que vous accompagnez"],
    ['/musique-obseques', 'Quelle musique pour un enterrement', "Si vous devez aussi choisir l’entrée et la sortie"],
    ['/processus', 'Comment se compose un hommage', "Si vous voulez savoir ce qui se passe après l’appel"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   3 — MUSIQUE D'OBSÈQUES SANS PAROLES
   ═══════════════════════════════════════════════════════════════ */
const instrumentale = page({
  file: 'musique-obseques-instrumentale.html',
  fil: 'Sans paroles',
  title: 'Musique d’obsèques sans paroles | Melodia Funèbre',
  desc: "Musique instrumentale pour des obsèques : à quels moments elle convient mieux qu’une chanson, comment la choisir, et ce que permet une œuvre originale.",
  datePublished: PUBLIE,
  h1: 'Une musique<br><em>sans paroles.</em>',
  situation: "Pour une famille qui préfère que la musique accompagne, sans rien dire à la place de personne.",
  chapeau: "Une chanson parle ; un instrumental laisse parler. Aux obsèques, c’est parfois exactement ce qu’il faut : pendant l’entrée, pendant un dépôt de fleurs, au moment où le cercueil quitte la salle. Voici où il trouve sa place, et comment le choisir.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="moments">Les moments où il vaut mieux qu’une chanson</h2>
        <ul class="liste-or">
          <li><strong>L’entrée.</strong> L’assemblée s’installe, on se salue à voix basse : des paroles s’y perdraient. Un instrumental installe le calme sans demander d’attention.</li>
          <li><strong>Le dépôt de fleurs ou le défilé devant le cercueil.</strong> C’est un temps qui dure, dont on ne connaît pas la longueur à l’avance. Une musique sans couplets supporte d’être coupée n’importe où.</li>
          <li><strong>La crémation, au moment du départ du cercueil.</strong> Il faut une musique qui tienne sans rien raconter ; nous en parlons en détail dans <a href="/musique-cremation">le guide sur la crémation</a>.</li>
          <li><strong>Derrière une lecture.</strong> Très bas, sous un texte lu, un instrumental soutient la voix au lieu de lui faire concurrence.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="choisir">Comment le choisir</h2>
        <p>On pense d’abord au piano ou à l’orgue, et ils conviennent souvent. Mais un instrumental peut être aussi personnel qu’une chanson : une guitare pour quelqu’un qui en jouait, un accordéon pour une fête de village, une cornemuse pour un Breton. Trois vérifications avant de trancher :</p>
        <ul>
          <li><strong>La fin.</strong> Écoutez la dernière minute. Un morceau qui s’éteint en fondu convient à un recueillement, beaucoup moins au moment où l’on se lève.</li>
          <li><strong>La salle.</strong> Les basses très profondes passent mal dans une salle conçue pour la parole ; les instruments médiums portent mieux.</li>
          <li><strong>Le rite.</strong> Certaines traditions n’admettent pas d’instruments pendant l’office — la liturgie orthodoxe, la prière funéraire musulmane, l’enterrement juif traditionnel. Le détail est sur <a href="/rites">la page des rites</a>.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="meme-oeuvre">La même œuvre, avec et sans voix</h2>
        <p>Une possibilité qu’on oublie : faire entendre la même œuvre deux fois. L’instrumental à l’entrée, quand personne n’écoute encore vraiment ; la version chantée au recueillement, quand la salle est prête. À la seconde écoute, l’assemblée reconnaît la mélodie, et comprend qu’elle a été écrite pour la personne.</p>
        <p>C’est ce que prévoit l’offre Prestige, qui comprend une version instrumentale seule en plus de la version chantée. Et si la famille ne veut aucune voix, la commande permet de demander directement un instrumental seul.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Quelle musique sans paroles pour un enterrement ?",
      texte: "Une pièce instrumentale qui ressemble au défunt — piano, guitare, cordes, accordéon selon ce qu’il aimait —, avec une fin adaptée au moment où elle passe. L’entrée, le dépôt de fleurs et le départ du cercueil sont les moments où elle convient le mieux." },
    { q: "Peut-on faire composer une musique instrumentale pour des obsèques ?",
      texte: "Oui. Il est possible de commander une œuvre originale en instrumental seul, sans voix. L’offre Prestige comprend aussi une version instrumentale en plus de la version chantée de la même œuvre." },
    { q: "Une musique instrumentale est-elle autorisée à l’église ?",
      texte: "Dans la plupart des cérémonies catholiques et protestantes, oui, en accord avec l’officiant. La liturgie orthodoxe exclut les instruments, et la prière funéraire musulmane comme l’enterrement juif traditionnel ne comportent pas de musique instrumentale." },
    { q: "Combien de temps doit durer un morceau d’entrée ?",
      texte: "Assez pour que l’assemblée s’installe : prévoyez plus long que nécessaire et indiquez à l’opérateur qu’il peut baisser le son et couper dès que tout le monde est assis." },
    { q: "Faut-il déclarer une musique instrumentale à la SACEM ?",
      texte: "En pratique, la famille ne déclare rien lors d’une cérémonie : ce sont les lieux et les opérateurs qui relèvent des contrats de diffusion. Une œuvre composée pour le défunt n’appartient à aucun répertoire et ne pose pas la question." }
  ],
  proposition: "Nous composons des œuvres originales, chantées ou instrumentales, écrites pour une personne précise et pour le moment où elles seront entendues.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/musique-obseques', 'Quelle musique pour un enterrement', "Si vous construisez toute la cérémonie"],
    ['/musique-cremation', 'La musique en crémation', "Si la cérémonie a lieu au crématorium"],
    ['/offres', 'Offres et tarifs', "Si vous voulez savoir ce que comprend chaque formule"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   4 — MUSIQUE POUR UNE CÉRÉMONIE CIVILE
   ═══════════════════════════════════════════════════════════════ */
const civile = page({
  file: 'musique-ceremonie-civile.html',
  fil: 'Cérémonie civile',
  title: 'Musique pour une cérémonie civile | Melodia Funèbre',
  desc: "Cérémonie d’obsèques civile ou laïque : quelle musique choisir, à quels moments, comment construire le déroulé quand aucun rite n’impose rien.",
  datePublished: PUBLIE,
  h1: 'La musique<br><em>d’une cérémonie civile.</em>',
  situation: "Pour une famille qui organise des obsèques sans rite religieux, et doit tout décider elle-même.",
  chapeau: "Une cérémonie civile n’a pas de cadre imposé. C’est une liberté, et c’est aussi une charge : personne ne dira à la famille ce qui vient après quoi. La musique y tient donc une place plus grande qu’ailleurs — c’est souvent elle qui donne sa forme à la cérémonie.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="liberte">Ce que change l’absence de rite</h2>
        <p>À l’église, la liturgie fixe l’ordre des choses et la place de la musique. Dans une salle de cérémonie, au crématorium ou au cimetière, rien de tel : la famille choisit les textes, les intervenants, les morceaux, et leur enchaînement. Aucune musique n’est exclue — ni le rock, ni la variété, ni une chanson en langue régionale.</p>
        <p>Cette liberté a un revers. Sans liturgie pour porter l’émotion, une cérémonie civile peut sembler courte ou flottante si rien ne la structure. La musique sert alors de charpente : elle ouvre, elle sépare les prises de parole, elle ferme.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="deroule">Un déroulé simple</h2>
        <p>La plupart des cérémonies, civiles comme religieuses, tiennent en trois moments musicaux. Dans une cérémonie civile, ils servent aussi de repères à l’assemblée :</p>
        <ol>
          <li><strong>L’entrée.</strong> Un morceau calme, souvent instrumental, pendant que chacun s’installe.</li>
          <li><strong>Les prises de parole.</strong> Un proche, puis un autre ; entre deux, un court passage musical laisse le temps de se remettre.</li>
          <li><strong>Le recueillement.</strong> Le morceau qui compte le plus, celui qu’on écoute vraiment, après les mots.</li>
          <li><strong>La sortie.</strong> Quelque chose qui tienne pendant qu’on se lève : rien qui s’éteigne trop vite.</li>
        </ol>
        <p>Au-delà de quatre ou cinq morceaux, la cérémonie se dilue. Si elle se tient au crématorium, le créneau impose sa propre durée : voyez <a href="/musique-cremation">le guide sur la crémation</a>.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="qui">Qui s’occupe de quoi</h2>
        <p>Dans une cérémonie civile, il n’y a pas d’officiant pour enchaîner. Désignez une personne — un proche, ou le maître de cérémonie des pompes funèbres — qui tient la liste et lance chaque morceau. Remettez-lui une feuille écrite : quel morceau, après quelle prise de parole, jusqu’où le laisser jouer. Apportez les fichiers sur une clé USB, avec une copie de secours, et faites un essai de son en arrivant.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="oeuvre">La place d’une œuvre écrite pour la personne</h2>
        <p>C’est dans une cérémonie civile qu’une chanson composée pour le défunt prend le plus de place, faute d’un rite qui la porte. Placée au recueillement, juste après les prises de parole, elle reprend ce qui a été dit et le met en musique. Rien n’oblige qu’elle soit lente : <em>Saudade Noite</em> est une bossa nova, parce que la famille de Sergio voulait de la joie, pas des larmes.</p>
${extrait('Saudade Noite', 'Composée pour un danseur infatigable')}
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Quelle musique pour des obsèques civiles ?",
      texte: "Celle que la famille choisit : aucun rite n’exclut quoi que ce soit. En pratique, trois ou quatre morceaux suffisent — l’entrée, un passage entre les prises de parole, le recueillement et la sortie — choisis d’après ce que le défunt aimait." },
    { q: "Qui lance la musique dans une cérémonie laïque ?",
      texte: "Une personne désignée à l’avance : un proche ou le maître de cérémonie des pompes funèbres. Remettez-lui une liste écrite indiquant chaque morceau, son moment et où l’arrêter." },
    { q: "Peut-on passer une chanson de variété ou de rock à des obsèques civiles ?",
      texte: "Oui. Il suffit de relire les paroles en entier pour éviter un couplet malvenu, et de vérifier la fin du morceau au moment où il passe." },
    { q: "Combien de morceaux prévoir pour une cérémonie civile ?",
      texte: "Trois à quatre en général. Au-delà de cinq, la cérémonie se dilue ; au crématorium, la durée du créneau limite encore le nombre de morceaux." },
    { q: "Peut-on faire écrire une chanson pour une cérémonie civile ?",
      texte: "Oui, et c’est le cadre où elle trouve le plus naturellement sa place. Elle est livrée sous vingt-quatre heures après l’entretien, avec une priorité possible en six heures pour une cérémonie imminente." }
  ],
  proposition: "Pour le moment du recueillement, nous composons une œuvre écrite pour la personne, dans le style qui lui ressemble, et livrée avant la cérémonie.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/rites', 'Musique funéraire selon le rite', "Si une partie de la famille souhaite aussi un temps religieux"],
    ['/musique-obseques-instrumentale', 'Une musique sans paroles', "Si vous cherchez un morceau pour l’entrée ou la sortie"],
    ['/chanson-hommage', 'La chanson d’hommage, tout savoir', "Si vous envisagez une œuvre écrite pour lui ou pour elle"]
  ]
});

module.exports = [maman, papa, instrumentale, civile];
