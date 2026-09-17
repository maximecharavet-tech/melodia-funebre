/* ═══════════════════════════════════════════════════════════════
   LA GRAPPE « CHANSON » — quatre intentions, quatre pages

   Quatre formulations proches, quatre lecteurs différents :

     · « chanson hommage défunt »          ne sait pas que ça existe
     · « chanson personnalisée défunt »    craint le modèle type
     · « chanson funéraire personnalisée » craint le ton, le kitsch
     · « chanson dernier hommage »         veut dire ce qu'il n'a pas dit

   Aucune de ces pages ne redit ce que dit sa voisine. La première
   démonte une chanson en cinq pièces ; la deuxième met en regard ce
   que nous demandons et ce que ça devient ; la troisième nomme trois
   tons et ce que nous refusons d'écrire ; la quatrième part de trois
   phrases qu'une famille n'arrivait pas à dire.

   LES EXEMPLES VIENNENT DU CATALOGUE RÉEL

   Pas d'extraits inventés pour la démonstration : les vers cités sont
   ceux des œuvres écoutables sur le site. Si une œuvre est retirée
   depuis la console, l'exemple disparaît proprement et la génération
   le signale — elle ne s'interrompt pas, pour qu'un retrait de démo
   ne bloque jamais une mise en ligne.
   ═══════════════════════════════════════════════════════════════ */

const { page } = require('./gabarit-requete.js');
/* Les aides de citation vivent dans build/citations.js : trois pages
   s'en servent, et une copie par fichier finirait par diverger. */
const { esc, oeuvre, lien, extrait: cite } = require('./citations.js');

const extrait = (titre, legende) => cite(titre, legende, 'p-chansons.js');

/* ═══════════════════════════════════════════════════════════════
   1 — CHANSON HOMMAGE DÉFUNT
   Le lecteur vient d'entendre parler de la chose et ne sait pas ce
   que c'est. La page la démonte en cinq pièces.
   ═══════════════════════════════════════════════════════════════ */
const PIECES = [
  ['Le titre',
   "Il ne dit pas « à mon père ». Il prend une image qui n’appartient qu’à lui — un lieu, un geste, un surnom. C’est le premier signe, pour l’assemblée, qu’il ne s’agit pas d’un morceau pris sur une plateforme."],
  ['Le premier couplet',
   "Il plante la personne dans un décor concret : un bord de Loire, un atelier, une cuisine. Jamais d’adjectifs sur ce qu’elle était — des choses qu’elle faisait. On reconnaît quelqu’un à ses gestes avant de le reconnaître à ses qualités."],
  ['Le refrain',
   "C’est la seule partie que l’assemblée retiendra. Il porte une phrase que la famille pourra se répéter des années plus tard, et c’est là, en général, que le prénom apparaît."],
  ['Le pont',
   "La place des proches. C’est là qu’on nomme les petits-enfants, la femme, le frère — ceux qui restent, et ce qui leur a été transmis. Beaucoup de familles nous disent que c’est le moment où la salle a craqué."],
  ['La fin',
   "Elle ne conclut pas, elle laisse ouvert. Une chanson d’hommage qui se ferme trop proprement sonne faux : il n’y a rien de propre dans ce qui vient d’arriver."]
];

const chansonHommageDefunt = page({
  file: 'chanson-hommage-defunt.html',
  fil: 'Chanson hommage',
  title: 'Chanson hommage pour un défunt : ce que c’est vraiment | Melodia Funèbre',
  desc: "Une chanson écrite pour une seule personne, d’après ce que sa famille en raconte. Ce qu’elle contient, pièce par pièce, avec des extraits d’œuvres réelles.",
  h1: 'Une chanson<br><em>pour lui seul.</em>',
  situation: "Pour quelqu’un qui vient d’entendre parler de cette possibilité et se demande de quoi il s’agit exactement.",
  chapeau: "Ce n’est pas un morceau du commerce qu’on aurait choisi parce qu’il l’aimait. C’est une chanson qui n’existait pas la semaine dernière, écrite à partir de ce que sa famille a raconté de lui, et dont personne d’autre au monde ne possède un exemplaire. Voici ce qu’il y a dedans.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="pieces">Ce qu’il y a dans une chanson d’hommage</h2>
        <p>Une chanson d’hommage dure entre deux et quatre minutes et tient en cinq pièces. Aucune n’est décorative : chacune fait un travail précis dans une salle où deux cents personnes attendent sans savoir ce qui va se passer.</p>
      </div>
      <div class="part-bloc req-liste reveal" style="margin-top:2rem;">
        <ul class="part-liste">
${PIECES.map(([t, d]) => `          <li><strong>${t}</strong><span>${d}</span></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="exemples">À quoi ça ressemble</h2>
        <p>Trois premiers vers, pris dans trois œuvres réelles du catalogue. Ils ont tous la même particularité : on ne pourrait les déplacer sur personne d’autre.</p>
      </div>
${extrait('Le Papi Pêcheur', 'Quatre petits-enfants, une seule canne')}
${extrait('Vers les pâturages d’en haut', 'Un berger du Niolu, en polyphonie corse')}
${extrait('Le roi de la route', 'Un routier, en funk — parce qu’il l’aurait voulu ainsi')}
      <div class="prose reveal" style="margin-top:1.4rem;">
        <p>Vous pouvez <a href="/demos">les écouter en entier</a>, avec l’histoire que la famille nous avait confiée à côté de chacune.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="difference">La différence avec un morceau qu’il aimait</h2>
        <p>Passer un morceau qu’il aimait est un choix parfaitement légitime, et la plupart des familles le font — c’est même souvent le bon choix pour l’entrée et la sortie. Mais ce morceau parle de quelqu’un d’autre, ou de personne. L’assemblée l’entend et pense à lui ; elle ne l’entend pas, lui.</p>
        <p>Une chanson écrite pour lui fait l’inverse : elle nomme ce qu’il faisait, les gens qu’il a formés, l’endroit où il allait. C’est pour cela qu’elle se place au recueillement, et pas à l’entrée : c’est le seul moment où une salle écoute vraiment des paroles.</p>
        <p>Les deux ne s’excluent pas. <a href="/musique-obseques">Trois moments musicaux dans une cérémonie</a> : il reste de la place pour les deux.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Faut-il avoir connu la personne pour écrire sa chanson ?",
      texte: "Non, et c’est même l’inverse : nous n’écrivons que d’après ce que la famille raconte. Un entretien d’une vingtaine de minutes, ou un formulaire si vous préférez écrire. Ce sont vos mots qui font la chanson, pas notre idée de la personne." },
    { q: "Combien de temps dure une chanson d’hommage ?",
      texte: "Entre deux et quatre minutes, comme une chanson ordinaire. Au-delà, une assemblée décroche — et une cérémonie ne réserve que huit à douze minutes à la musique en tout." },
    { q: "Peut-on entendre la chanson avant la cérémonie ?",
      texte: "Oui. Vous la recevez avant le jour, vous l’écoutez au calme, et vous pouvez demander une reprise si quelque chose ne va pas. Personne ne doit découvrir sa propre commande devant deux cents personnes." },
    { q: "Et si la famille n’est pas d’accord sur ce qu’il faut dire ?",
      texte: "C’est fréquent, et ce n’est pas un problème : les désaccords portent presque toujours sur les qualificatifs, jamais sur les faits. Nous écrivons à partir des faits — un métier, un lieu, une habitude — et tout le monde s’y reconnaît." },
    { q: "Est-ce que ça se fait, vraiment ?",
      texte: "C’est neuf en France, et la plupart des familles n’en avaient jamais entendu parler avant qu’on leur en parle. Les œuvres du catalogue ont toutes été commandées par des familles ordinaires, pour des cérémonies ordinaires." }
  ],
  proposition: "Nous composons cette chanson-là, pour une personne et une seule, d’après ce que vous nous en racontez. L’entretien dure vingt minutes, vous recevez l’œuvre avant la cérémonie, et le fichier vous appartient.",
  bouton: 'Écouter ce que nous composons',
  voisines: [
    ['/chanson-personnalisee-defunt', 'Ce que nous vous demandons', "Si vous vous demandez sur quoi nous nous appuyons pour écrire"],
    ['/chanson-pour-obseques', 'La chanson le jour même', "Si la cérémonie a déjà une date"],
    ['/creer-chanson-pour-defunt', 'La faire soi-même', "Si vous envisagez de l’écrire vous-même"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   2 — CHANSON PERSONNALISÉE DÉFUNT
   Le lecteur craint le modèle type où l'on changerait le prénom.
   La page met en regard ce qu'on demande et ce que ça devient.
   ═══════════════════════════════════════════════════════════════ */
const DEMANDES = [
  ['Son métier, ou ce qui lui tenait lieu de métier',
   'Le décor du premier couplet. Un pêcheur ne se raconte pas dans le même paysage qu’une institutrice.'],
  ['Trois mots que vous emploieriez pour le décrire',
   'Le ton de toute l’œuvre. « Patient · taquin · silencieux » n’appelle pas la même musique que « flambeur · généreux · bruyant ».'],
  ['Un geste que vous lui revoyez faire',
   'Presque toujours le premier vers. C’est la chose la plus difficile à demander et la plus payante.'],
  ['Ce qu’il disait souvent',
   'Souvent le refrain, parfois mot pour mot. Une expression à lui dans une chanson, c’est ce qui fait retourner la salle.'],
  ['Les prénoms de ceux qui restent',
   'Le pont. On les nomme, ou on nomme ce qu’il leur a transmis.'],
  ['Un lieu qui compte',
   'Le fil de l’œuvre. Un village, une maison, un bout de rivière.'],
  ['La musique qu’il écoutait',
   'Le registre. Pas pour l’imiter — pour ne pas l’insulter.'],
  ['Ce qu’il ne faut surtout pas dire',
   'Aussi utile que le reste. Une brouille, une maladie, un mot interdit : nous n’irons pas.'],
  ['Qui parlera pendant la cérémonie',
   'Pour que la chanson ne répète pas ce que l’éloge dira déjà.']
];

const chansonPersonnaliseeDefunt = page({
  file: 'chanson-personnalisee-defunt.html',
  fil: 'Chanson personnalisée',
  title: 'Chanson personnalisée pour un défunt : ce que nous demandons | Melodia Funèbre',
  desc: "Les neuf questions posées à la famille, et ce que chacune produit dans l’œuvre. Ce que nous ne demandons pas, et pourquoi.",
  h1: 'Personnalisée<br><em>jusqu’où ?</em>',
  situation: "Pour quelqu’un qui craint le modèle type où l’on changerait seulement le prénom.",
  chapeau: "« Personnalisé » est le mot le plus galvaudé du commerce. Voici donc la seule réponse honnête : les neuf questions que nous posons, et ce que chacune devient dans la chanson. Si vous y répondez, il ne reste rien de transposable sur quelqu’un d’autre.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="questions-brief">Neuf questions, et ce qu’elles deviennent</h2>
        <p>L’entretien dure une vingtaine de minutes. Vous pouvez aussi écrire les réponses, si parler est au-dessus de vos forces cette semaine-là — beaucoup de familles préfèrent écrire.</p>
      </div>
      <div class="part-bloc req-liste reveal" style="margin-top:2rem;">
        <ul class="part-liste">
${DEMANDES.map(([q, d]) => `          <li><strong>${q}</strong><span>${d}</span></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="pas-demande">Ce que nous ne demandons pas</h2>
        <p>Nous ne demandons ni sa date de naissance, ni son parcours, ni ses diplômes, ni la cause du décès. Une chanson n’est pas une notice nécrologique : les faits d’état civil n’y produisent rien. Ce qui produit quelque chose, ce sont les gestes, les mots, les lieux.</p>
        <p>Nous ne demandons pas non plus de photo pour écrire. La photo sert ensuite, sur la page hommage si vous en voulez une — pas à la composition.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="preuve">Un exemple, de bout en bout</h2>
        <p>Voici ce qu’une famille nous a dit d’un homme, et ce que la chanson en a fait. Les deux sont publics sur le site.</p>
      </div>
${extrait('Le Papi Pêcheur', 'Ce que la famille avait dit : « patient, taquin, silencieux — il a appris à pêcher à ses quatre petits-enfants »')}
      <div class="prose reveal">
        <p>Ni « patient » ni « silencieux » n’apparaissent dans la chanson. Les quatre petits-enfants, si — devenus quatre paires de mains sur une seule canne. C’est ce déplacement-là qu’on appelle écrire.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Peut-on demander une correction si le texte ne convient pas ?",
      texte: "Oui. Vous recevez l’œuvre avant la cérémonie et vous pouvez demander une reprise. C’est fait pour : un mot qui heurte la famille est un mot à changer, sans discussion." },
    { q: "Peut-on fournir soi-même les paroles ?",
      texte: "Oui, et certaines familles le font — un poème écrit par un proche, une lettre. Nous composons alors la musique autour de votre texte plutôt que d’écrire le nôtre." },
    { q: "Peut-on choisir la voix, homme ou femme ?",
      texte: "Oui, c’est une des questions posées à la commande. Beaucoup de familles choisissent une voix du même sexe que la personne ; d’autres choisissent l’inverse, volontairement." },
    { q: "Est-ce que le prénom est obligatoirement dans la chanson ?",
      texte: "Non. Il y est le plus souvent, dans le refrain, mais certaines familles préfèrent qu’il n’y soit pas — c’est alors un surnom, ou rien du tout. Vous décidez." },
    { q: "Que faites-vous des informations que nous confions ?",
      texte: "Elles servent à écrire, et à rien d’autre. Elles ne sont ni revendues ni publiées : ce qui apparaît sur le site n’apparaît qu’avec l’accord écrit de la famille, et peut être retiré." }
  ],
  proposition: "Les neuf questions ci-dessus sont exactement celles de notre entretien. Vous y répondez en vingt minutes, par téléphone ou par écrit, et l’œuvre en sort.",
  bouton: 'Écouter ce que ça donne',
  voisines: [
    ['/chanson-hommage-defunt', 'Ce qu’il y a dans une chanson', "Si vous voulez d’abord savoir de quoi elle est faite"],
    ['/chanson-funeraire-personnalisee', 'Le ton juste', "Si vous craignez que ce soit trop triste, ou trop kitsch"],
    ['/composer-chanson-pour-defunt', 'Comment elle se fabrique', "Si vous voulez voir la chaîne, du texte au fichier"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   3 — CHANSON FUNÉRAIRE PERSONNALISÉE
   Le lecteur craint le ton : le pleurnichard, le kitsch, le faux
   solennel. La page nomme trois tons et ce qu'on refuse d'écrire.
   ═══════════════════════════════════════════════════════════════ */
const TONS = [
  ['Grave', "La salle est tenue, la musique est nue — un piano, une voix, presque rien. C’est le ton qu’on choisit quand la mort a été brutale, ou quand la personne était elle-même peu démonstrative. Le risque : la lourdeur. On l’évite en gardant l’œuvre courte.", 'Le vent connaît ton nom'],
  ['Tendre', "Le plus demandé, et de loin. Chaleur, sourire possible, larmes admises. Une guitare, un accordéon, une voix qui ne force pas. C’est le ton des grands-parents, des longues vies, des départs attendus.", 'Le Papi Pêcheur'],
  ['Lumineux', "Franchement vivant, parfois dansant. Il choque encore certaines familles et libère toutes les autres. On le choisit quand la personne était ainsi et qu’elle aurait détesté qu’on pleure en rang.", 'Le roi de la route']
];

const chansonFuneraire = page({
  file: 'chanson-funeraire-personnalisee.html',
  fil: 'Le ton juste',
  title: 'Chanson funéraire personnalisée : trouver le ton juste | Melodia Funèbre',
  desc: "Grave, tendre ou lumineux : les trois tons d’une chanson funéraire, avec un exemple écoutable de chacun — et ce que nous refusons d’écrire.",
  h1: 'Ni pleurnichard,<br><em>ni faux solennel.</em>',
  situation: "Pour quelqu’un qui a peur du résultat : trop triste, trop mièvre, ou trop léger.",
  chapeau: "La crainte est légitime. Le registre funéraire est truffé de pièges — la rime facile, l’image toute faite, l’émotion qu’on appuie. Voici les trois tons entre lesquels une famille choisit réellement, un exemple écoutable de chacun, et la liste de ce que nous nous interdisons d’écrire.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="tons">Trois tons, pas davantage</h2>
        <p>Le ton se décide à l’entretien, en une question. Il commande ensuite tout : le registre musical, le tempo, le nombre d’instruments, et jusqu’à la façon dont la voix attaque les fins de phrase.</p>
      </div>
      <div class="grid-3" style="margin-top:2rem;">
${TONS.map(([t, d, ex]) => {
  const o = oeuvre(ex);
  return `        <div class="card reveal">
          <div class="mono">${t}</div>
          <p style="margin-top:.8rem;line-height:1.6;">${d}</p>
          ${o ? `<p style="margin-top:1rem;"><a href="${lien(o)}">Écouter <em>${esc(o.title)}</em></a></p>` : ''}
        </div>`;
}).join('\n')}
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="interdits">Ce que nous nous interdisons</h2>
        <p>Une chanson funéraire rate presque toujours de la même façon. Voici ce que nous ne écrivons pas, et ce que nous mettons à la place.</p>
        <ul class="liste-or">
          <li><strong>Les rimes en « -oir ».</strong> Espoir, revoir, mémoire, au revoir. Elles s’appellent les unes les autres et produisent en quatre vers une carte de condoléances. Nous cherchons ailleurs.</li>
          <li><strong>L’étoile, l’ange, le nuage.</strong> Trois images qui ne désignent personne. Une famille qui les entend pense « c’est joli » ; elle ne pense pas à lui.</li>
          <li><strong>Le vocabulaire religieux dans une cérémonie civile</strong> — et l’inverse. Nous demandons le type de cérémonie avant d’écrire un mot.</li>
          <li><strong>Le « tu me manques » répété.</strong> C’est vrai, et c’est justement pour cela que ça ne s’écrit qu’une fois.</li>
          <li><strong>La voix qui surjoue.</strong> Au chant, l’émotion appuyée s’entend comme une comédie. L’interprétation reste en retrait : c’est le texte qui porte.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="registre">Le registre musical n’est pas le ton</h2>
        <p>Une erreur courante consiste à confondre les deux. Le ton dit comment on regarde la personne ; le registre dit avec quels instruments. On peut écrire un hommage grave en reggae et un hommage lumineux au piano.</p>
        <p>Vingt registres sont proposés au départ, du piano classique à la polyphonie corse, et nous composons aussi hors catalogue. <a href="/demos#registres">Voir les registres et les écouter</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Une chanson gaie pendant des obsèques, est-ce que ça choque ?",
      texte: "Moins qu’on ne le croit, et de moins en moins. Beaucoup de familles choisissent un morceau vivant à la sortie, et personne ne leur en tient rigueur. Au recueillement, en revanche, la salle attend autre chose : c’est une question de moment, pas de convenance." },
    { q: "Peut-on demander une chanson sans paroles ?",
      texte: "Oui. Un instrumental écrit pour la personne existe et se justifie, notamment quand la famille craint que des mots ne blessent quelqu’un dans l’assemblée." },
    { q: "Comment savoir si le ton choisi est le bon ?",
      texte: "Vous l’entendez avant la cérémonie, au calme, et vous pouvez demander une reprise. C’est la seule vérification qui vaille : un ton se juge à l’oreille, pas sur le papier." },
    { q: "Peut-on mélanger deux tons dans la même chanson ?",
      texte: "Oui, et c’est souvent ce qui marche le mieux : un premier couplet grave, une fin lumineuse. La bascule se prépare dès le texte." },
    { q: "Qui décide, si la famille n’est pas d’accord sur le ton ?",
      texte: "Celui qui commande tranche, et nous le lui disons clairement à l’entretien. Une œuvre écrite pour satisfaire trois avis contraires ne satisfait personne." }
  ],
  proposition: "Le ton est la première question que nous posons, avant même le registre. Vous l’entendez ensuite dans la maquette, et vous pouvez le faire corriger.",
  bouton: 'Écouter les trois tons',
  voisines: [
    ['/chanson-personnalisee-defunt', 'Les neuf questions', "Si vous voulez savoir sur quoi nous nous appuyons"],
    ['/hommage-musical-obseques', 'Comment l’annoncer', "Si vous cherchez quoi dire avant de la lancer"],
    ['/chanson-dernier-hommage', 'Dire ce qu’on n’a pas dit', "Si le ton n’est pas votre vraie question"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   4 — CHANSON DERNIER HOMMAGE
   Le lecteur ne cherche pas un service : il cherche à dire quelque
   chose qu'il n'a pas dit. La page part de trois phrases réelles.
   ═══════════════════════════════════════════════════════════════ */
const chansonDernierHommage = page({
  file: 'chanson-dernier-hommage.html',
  fil: 'Dernier hommage',
  title: 'Une chanson comme dernier hommage : dire ce qu’on n’a pas dit | Melodia Funèbre',
  desc: "Ce qu’une chanson dit qu’un éloge funèbre ne dit pas. Trois phrases qu’une famille n’arrivait pas à prononcer, et ce que l’œuvre en a fait.",
  h1: 'Ce qu’on n’a pas<br><em>eu le temps de dire.</em>',
  situation: "Pour quelqu’un à qui il reste quelque chose sur le cœur, et qui ne sait pas où le mettre.",
  chapeau: "La plupart des familles qui nous appellent ne cherchent pas de la musique. Elles cherchent un endroit pour une phrase qu’elles n’ont pas dite — parce que ça ne se disait pas, parce qu’il n’y a pas eu le temps, ou parce que devant deux cents personnes on ne dit pas ces choses-là à voix nue.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="eloge">Ce qu’un éloge ne peut pas faire</h2>
        <p>L’éloge funèbre est un exercice d’équilibre : il doit tenir debout, rester audible par toute l’assemblée, et être prononcé par quelqu’un dont la voix tremble. Il raconte une vie. Il ne peut pas se permettre d’être indirect, ni de s’adresser à un seul.</p>
        <p>Une chanson le peut. Elle passe par l’image plutôt que par la déclaration, elle s’adresse à qui elle veut, et surtout : <strong>ce n’est pas vous qui la prononcez</strong>. C’est ce détail qui la rend supportable. Beaucoup de gens nous disent avoir pu entendre, assis, ce qu’ils n’auraient jamais pu dire debout.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="deplacement">De la phrase impossible au vers</h2>
        <p>Voici comment ça se passe, concrètement. À gauche, ce qu’une famille nous a dit au téléphone, souvent en s’excusant de le dire. À droite, ce que c’est devenu.</p>
      </div>
${extrait('Le Papi Pêcheur', '« On n’a jamais vraiment parlé, lui et moi. On pêchait, c’est tout. »')}
${extrait('Personne n’oublie ton rire', '« Elle riait trop fort, ça nous faisait honte quand on était petits. Ça nous manque. »')}
${extrait('Vers l’île d’Ys', '« Il est parti en mer toute sa vie et il est mort dans un lit. »')}
      <div class="prose reveal" style="margin-top:1.4rem;">
        <p>Dans les trois cas, la phrase de départ n’apparaît nulle part dans l’œuvre. C’est ce qu’on attend d’elle : la porter, pas la répéter.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="apres">Ce que ça ne fait pas</h2>
        <p>Nous ne prétendons pas que cela aide à faire son deuil : nous ne sommes ni thérapeutes ni accompagnants, et personne ne devrait vous vendre cela. Ce qu’une chanson fait est plus modeste et vérifiable — elle donne une place à une phrase, un jour précis, devant les gens qui comptent. Ensuite elle reste, et on peut la remettre.</p>
        <p>Si vous traversez un deuil difficile, les associations d’accompagnement du deuil et votre médecin traitant sont les bons interlocuteurs. Ce n’est pas notre métier.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Peut-on faire écrire la chanson par un proche plutôt que par vous ?",
      texte: "Oui. Si quelqu’un dans la famille a écrit un texte, un poème ou une lettre, nous composons la musique autour. C’est souvent la formule la plus juste quand il reste quelque chose à dire." },
    { q: "Est-il trop tard si les obsèques ont déjà eu lieu ?",
      texte: "Non. Une part des œuvres que nous composons le sont après la cérémonie — pour une messe anniversaire, une dispersion des cendres, ou simplement pour la famille. Rien n’oblige à ce que ce soit le jour même." },
    { q: "Peut-on écrire une chanson pour quelqu’un avec qui on était fâché ?",
      texte: "Oui, et cela se fait. Nous demandons simplement ce qu’il ne faut pas dire, et nous nous y tenons. Une chanson n’a pas à réconcilier qui que ce soit pour être juste." },
    { q: "Faut-il la diffuser devant tout le monde ?",
      texte: "Non. Certaines familles ne la passent pas à la cérémonie et la gardent pour elles. Le fichier vous appartient : vous en faites ce que vous voulez, et rien n’est publié sans votre accord écrit." },
    { q: "Combien de temps faut-il pour l’obtenir ?",
      texte: "Comptez quelques jours en temps normal. Quand une cérémonie est imminente, dites-le d’emblée : le circuit d’urgence existe et le délai est annoncé avant que vous ne payiez quoi que ce soit." }
  ],
  proposition: "Si vous avez une phrase et nulle part où la mettre, c’est exactement ce que nous faisons. Vous nous la dites, elle ne sera pas répétée telle quelle — elle sera portée.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/dernier-hommage-musical', 'Après le jour même', "Si vous vous demandez ce que l’œuvre devient ensuite"],
    ['/chanson-funeraire-personnalisee', 'Le ton juste', "Si vous craignez que ce soit trop"],
    ['/de-son-vivant', 'De son vivant', "Si la personne est encore là et que vous voulez qu’elle l’entende"]
  ]
});

module.exports = [chansonHommageDefunt, chansonPersonnaliseeDefunt, chansonFuneraire, chansonDernierHommage];
