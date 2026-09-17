/* ═══════════════════════════════════════════════════════════════
   LA GRAPPE « CÉRÉMONIE » — quatre pages, quatre urgences

   Ces quatre lecteurs ont une date. Ils ne se demandent plus si
   c'est une bonne idée : ils veulent que ça marche.

     · « chanson pour obsèques »            veut que ça marche vendredi
     · « musique personnalisée obsèques »   hésite avec un morceau du commerce
     · « hommage musical obsèques »         ne sait pas quoi dire avant de lancer
     · « musique pour hommage funéraire »   n'est pas forcément aux obsèques

   Chaque page porte donc un objet que les autres n'ont pas : une
   frise du jour, un comparatif chiffré, trois annonces prêtes à
   lire, un panorama de six occasions.

   PRUDENCE SUR LE DROIT
   Rien ici n'est présenté comme un avis juridique. Ce qui relève des
   droits d'auteur renvoie au guide dédié et à l'opérateur funéraire,
   qui connaît les usages de la commune et de la salle.
   ═══════════════════════════════════════════════════════════════ */

const { page } = require('./gabarit-requete.js');

/* ═══════════════════════════════════════════════════════════════
   7 — CHANSON POUR OBSÈQUES : le jour même
   ═══════════════════════════════════════════════════════════════ */
const JOUR = [
  ['La veille', "L’essai dans la salle. C’est la seule vérification qui compte vraiment : brancher la source, monter le son, écouter depuis le fond. Une salle vide sonne autrement qu’une salle pleine, mais un fichier qui ne se lit pas se découvre là, pas le lendemain."],
  ['Une heure avant', "Le fichier est sur place, sur deux supports différents — la clé USB et le téléphone. Le maître de cérémonie sait quel morceau va où."],
  ['L’entrée', "Deux à trois minutes, attaque douce. Le cercueil entre, l’assemblée est debout : une attaque forte fait sursauter une salle déjà tendue."],
  ['Le recueillement', "La place de la chanson écrite pour lui. C’est le seul moment où une assemblée écoute vraiment des paroles, du début à la fin."],
  ['La sortie', "L’assemblée se lève. Beaucoup de familles choisissent ici quelque chose de plus vivant, et elles ont raison."],
  ['Après', "Le fichier reste à vous. Une part des familles le renvoie le soir même à ceux qui n’ont pas pu venir."]
];

const VERIFS = [
  ['Le support', 'Clé USB <em>et</em> téléphone. Deux supports, deux personnes qui les ont.'],
  ['Le format', 'Un fichier audio courant, sans dispositif de protection. Une plateforme de streaming suppose un réseau qui manque souvent dans une église ou un crématorium.'],
  ['Le volume', 'Réglé la veille, marqué au feutre sur la console si besoin. Personne ne cherche le bon niveau devant l’assemblée.'],
  ['Le silence après', 'Cinq à dix secondes avant que quiconque reprenne la parole. C’est ce silence qui fait le moment ; le couper le gâche.'],
  ['Qui appuie', 'Une personne désignée, pas « quelqu’un ». Écrivez son prénom sur le déroulé.']
];

const chansonPourObseques = page({
  file: 'chanson-pour-obseques.html',
  fil: 'Le jour même',
  title: 'Chanson pour des obsèques : que tout marche le jour même | Melodia Funèbre',
  desc: "Le déroulé heure par heure, la liste de vérifications qui évite l’accident du jour même, et les délais réels quand la cérémonie est dans quelques jours.",
  h1: 'Que ça marche<br><em>le jour même.</em>',
  situation: "Pour quelqu’un qui a déjà une date, et pour qui la seule question est que ça se passe bien.",
  chapeau: "Le seul vrai accident, en musique de cérémonie, n’est pas le mauvais choix : c’est le fichier qui ne se lit pas, le volume qu’on cherche devant deux cents personnes, ou le silence qu’on coupe trop tôt. Voici le déroulé, la liste de vérifications, et les délais réels.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="deroule">Le déroulé, de la veille à après</h2>
      </div>
      <div class="part-bloc req-liste reveal" style="margin-top:2rem;">
        <ul class="part-liste">
${JOUR.map(([t, d]) => `          <li><strong>${t}</strong><span>${d}</span></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="verifications">Cinq vérifications, et rien d’autre</h2>
        <ul class="liste-or">
${VERIFS.map(([t, d]) => `          <li><strong>${t}</strong> ${d}</li>`).join('\n')}
        </ul>
        <p>Le maître de cérémonie de votre opérateur funéraire connaît la salle et fait cela toutes les semaines : donnez-lui le fichier et le déroulé la veille, pas le matin même.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="delais">Si la cérémonie est dans quelques jours</h2>
        <p>C’est le cas le plus fréquent : en France, une inhumation a lieu dans un délai court après le décès, et une famille a rarement plus de quelques jours devant elle.</p>
        <p>Dites-le d’emblée quand vous appelez. Le délai qui vous sera annoncé est un engagement écrit, donné avant que vous ne payiez quoi que ce soit — et si nous ne pouvons pas tenir votre date, nous vous le disons tout de suite plutôt que d’essayer. Les formules et les délais associés sont sur la page <a href="/offres">nos formules</a>.</p>
        <p>Si le délai ne peut pas être tenu, la chanson garde tout son sens après : une messe anniversaire, une dispersion des cendres, ou simplement la famille réunie. <a href="/musique-pour-hommage-funeraire">Les six occasions où une musique d’hommage trouve sa place</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Combien de morceaux faut-il prévoir pour des obsèques ?",
      texte: "Trois suffisent dans la grande majorité des cérémonies : l’entrée, le recueillement, la sortie. Certaines familles en ajoutent un quatrième pendant un dépôt de fleurs. Au-delà, la cérémonie se dilue." },
    { q: "Peut-on diffuser une chanson dans une église ?",
      texte: "Cela dépend de la paroisse et du morceau : les usages varient d’un lieu à l’autre, et c’est au prêtre ou au diacre qui célèbre de le dire. Posez la question dès le premier rendez-vous, avant d’arrêter votre choix." },
    { q: "Et dans un crématorium ?",
      texte: "Les salles de crémation sont généralement équipées et habituées à diffuser des enregistrements apportés par les familles. Le déroulé y est souvent plus court : vérifiez la durée dont vous disposez auprès de l’opérateur." },
    { q: "Qui s’occupe de la diffusion pendant la cérémonie ?",
      texte: "Le maître de cérémonie, dans la quasi-totalité des cas. Confiez-lui le fichier et un déroulé écrit indiquant quel morceau intervient à quel moment, et à quel volume." },
    { q: "Faut-il prévoir une solution de repli ?",
      texte: "Oui, et c’est la recommandation la plus utile de cette page : deux supports, deux personnes. Une clé USB qui ne monte pas et un téléphone déchargé, cela arrive." }
  ],
  proposition: "Quand une date approche, dites-le en appelant : le délai vous est annoncé avant la commande, et s’il ne peut pas être tenu, nous vous le disons plutôt que d’essayer.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/hommage-musical-obseques', 'Comment l’annoncer', "Si vous ne savez pas quoi dire avant de la lancer"],
    ['/musique-obseques', 'Quelle musique choisir', "Si les morceaux ne sont pas encore arrêtés"],
    ['/musique-sacem-obseques', 'Les droits', "Si vous diffusez un morceau du commerce"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   8 — MUSIQUE PERSONNALISÉE OBSÈQUES : l'arbitrage
   ═══════════════════════════════════════════════════════════════ */
const COMPARATIF = [
  ['Ce que l’assemblée entend',
   'Un morceau qu’elle connaît, et qui parle d’autre chose ou de personne.',
   'Une œuvre qui nomme ses gestes, ses lieux, ses proches.'],
  ['Le moment où ça marche',
   'L’entrée et la sortie, portées par la familiarité.',
   'Le recueillement, où l’on écoute vraiment des paroles.'],
  ['Les droits d’auteur',
   'Une diffusion publique relève des règles habituelles ; les usages varient selon le lieu et l’opérateur.',
   'L’œuvre est produite pour vous et vous est remise ; aucune démarche de diffusion à faire de votre côté.'],
  ['Le coût',
   'Nul, ou compris dans la prestation funéraire.',
   'Le prix d’une commande, annoncé avant, sans supplément découvert après.'],
  ['Le délai',
   'Immédiat.',
   'De quelques jours à une semaine selon la formule ; le délai est un engagement écrit.'],
  ['Ce qu’il en reste',
   'Rien qui vous appartienne.',
   'Un fichier qui est à vous, que personne d’autre ne possède.']
];

const musiquePersoObseques = page({
  file: 'musique-personnalisee-obseques.html',
  fil: 'L’arbitrage',
  title: 'Musique personnalisée pour des obsèques : le comparatif honnête | Melodia Funèbre',
  desc: "Morceau du commerce ou œuvre écrite pour la personne : ce qui change réellement, point par point — ce que l’assemblée entend, les droits, le coût, le délai, ce qu’il en reste.",
  h1: 'Un morceau qu’il aimait,<br><em>ou une œuvre pour lui ?</em>',
  situation: "Pour quelqu’un qui hésite entre passer un morceau connu et faire écrire quelque chose.",
  chapeau: "La réponse honnête est : les deux, et la plupart des familles font les deux. Mais si vous devez arbitrer, voici ce qui change réellement d’une solution à l’autre — sans faire semblant que le morceau du commerce serait un mauvais choix, parce qu’il n’en est pas un.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="comparatif">Ce qui change, point par point</h2>
      </div>
      <!-- Les tableaux du site sont stylés à l'intérieur de « prose » :
           un tableau posé ailleurs sortirait nu, et déborderait sur
           téléphone faute de la règle de défilement horizontal. -->
      <div class="prose reveal" style="margin-top:2rem;">
        <table>
          <thead>
            <tr><th scope="col">&nbsp;</th><th scope="col">Un morceau du commerce</th><th scope="col">Une œuvre écrite pour lui</th></tr>
          </thead>
          <tbody>
${COMPARATIF.map(([q, a, b]) => `            <tr><th scope="row">${q}</th><td>${a}</td><td>${b}</td></tr>`).join('\n')}
          </tbody>
        </table>
      </div>
      <div class="prose reveal" style="margin-top:1.6rem;">
        <p>Sur la colonne des droits, ne nous croyez pas sur parole et ne croyez personne : les usages dépendent du lieu, de la commune et de l’opérateur. Notre <a href="/musique-sacem-obseques">guide sur les droits d’auteur en cérémonie</a> dit ce qui est vérifiable, et renvoie au reste.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="instrumental">L’option qu’on oublie : l’instrumental</h2>
        <p>Entre les deux, il existe une solution dont personne ne parle : une musique écrite pour la personne, mais sans paroles. Elle se justifie dans trois cas précis :</p>
        <ul class="liste-or">
          <li><strong>Quand des mots blesseraient quelqu’un</strong> dans l’assemblée — une brouille, un second conjoint, un enfant trop jeune.</li>
          <li><strong>Quand la cérémonie est déjà très parlée</strong> : deux éloges, une lecture, un texte religieux. Une quatrième prise de parole chantée, c’en est trop.</li>
          <li><strong>Pour l’entrée et la sortie</strong>, où les paroles se perdent de toute façon dans le mouvement de la salle.</li>
        </ul>
        <p>Beaucoup de familles commandent les deux versions : l’instrumental à l’entrée, la version chantée au recueillement. C’est la même œuvre, entendue deux fois, et la seconde écoute est celle où la salle comprend.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="ensemble">Comment les faire tenir ensemble</h2>
        <p>Si vous gardez un morceau qu’il aimait et que vous faites écrire une œuvre, ne les mettez pas côte à côte : la comparaison est cruelle pour les deux. Placez le morceau connu à l’entrée ou à la sortie, et l’œuvre écrite au recueillement, séparée par une prise de parole. Le <a href="/musique-obseques">guide des trois moments musicaux</a> détaille ce découpage.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Une œuvre composée coûte-t-elle plus cher qu’une prestation musicale sur place ?",
      texte: "Cela dépend de ce que vous comparez. Un musicien qui se déplace joue une fois ; une œuvre enregistrée reste et peut être rejouée. Les deux se défendent, et beaucoup de familles font intervenir un musicien vivant en plus de l’enregistrement." },
    { q: "Peut-on diffuser une œuvre commandée sans autorisation particulière ?",
      texte: "L’œuvre est produite pour vous et vous est remise : vous n’avez pas de démarche de diffusion à faire de votre côté pour la cérémonie. Pour un usage commercial ultérieur, parlez-nous-en, c’est une autre question." },
    { q: "Peut-on mélanger un morceau connu et une œuvre écrite dans la même cérémonie ?",
      texte: "Oui, et c’est le cas le plus fréquent. Veillez seulement à les séparer par une prise de parole : enchaînés, ils se desservent." },
    { q: "Et si nous ne savons pas quel morceau il aimait ?",
      texte: "C’est plus courant qu’on ne l’imagine, surtout pour les personnes très âgées. C’est même un argument pour l’œuvre écrite : elle ne suppose pas de connaître ses goûts, seulement sa vie." },
    { q: "Peut-on obtenir la version instrumentale et la version chantée ?",
      texte: "Oui, précisez-le à la commande. C’est la même œuvre, déclinée, et cela couvre l’entrée et le recueillement avec une seule matière." }
  ],
  proposition: "Nous composons l’œuvre écrite pour la personne, avec sa version instrumentale si vous la voulez. Le morceau qu’il aimait, lui, ne s’achète pas chez nous — et c’est très bien ainsi.",
  bouton: 'Comparer à l’oreille',
  voisines: [
    ['/chanson-pour-obseques', 'Le jour même', "Si la date est prise et qu’il faut que ça tourne"],
    ['/musique-personnalisee-defunt', 'Du portrait au registre', "Si vous cherchez quel style lui ressemble"],
    ['/musique-sacem-obseques', 'Les droits d’auteur', "Si vous diffusez un morceau du commerce"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   9 — HOMMAGE MUSICAL OBSÈQUES : l'annonce
   ═══════════════════════════════════════════════════════════════ */
const ANNONCES = [
  ['Cérémonie civile',
   "« Nous allons écouter une chanson. Elle a été écrite pour Jean, à partir de ce que nous avons raconté de lui. Personne ne la connaît : c’est la première fois qu’elle est entendue. »"],
  ['Cérémonie religieuse',
   "« Avant la prière, nous vous proposons d’écouter un morceau composé pour Marie. Les mots sont de sa famille. Nous vous demandons quelques instants de silence après. »"],
  ['Crémation',
   "« Ce que vous allez entendre a été écrit pour lui, et pour vous. Prenez le temps : il n’y a rien d’autre à faire pendant ces trois minutes. »"]
];

const hommageMusicalObseques = page({
  file: 'hommage-musical-obseques.html',
  fil: 'L’annoncer',
  title: 'Hommage musical pendant les obsèques : comment l’annoncer | Melodia Funèbre',
  desc: "Trois annonces prêtes à lire — civile, religieuse, crémation —, qui parle, combien de temps de silence garder après, et les erreurs à éviter.",
  h1: 'Quoi dire<br><em>avant de la lancer.</em>',
  situation: "Pour quelqu’un qui a le morceau, et qui redoute le moment de l’introduire.",
  chapeau: "Une musique lancée sans un mot laisse l’assemblée flottante : elle ne sait pas si elle doit écouter, se recueillir ou attendre la suite. Deux phrases suffisent à tout changer. En voici trois versions, prêtes à lire, et ce qu’il faut faire du silence qui suit.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="annonces">Trois annonces, à lire telles quelles</h2>
        <p>Remplacez le prénom, gardez la structure : on dit <strong>ce que c’est</strong>, <strong>d’où ça vient</strong>, et <strong>ce qu’on attend de l’assemblée</strong>. Ces trois choses, et pas une de plus — une annonce longue mange le moment qu’elle annonce.</p>
      </div>
      <div class="grid-3" style="margin-top:2rem;">
${ANNONCES.map(([t, d]) => `        <div class="card reveal">
          <div class="mono">${t}</div>
          <p style="font-family:var(--ff-d);font-style:italic;font-size:1.1rem;color:var(--ivory-ink);margin-top:.8rem;line-height:1.55;">${d}</p>
        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="qui">Qui prononce l’annonce</h2>
        <p>Le maître de cérémonie, presque toujours, et c’est le bon choix : sa voix est neutre, elle ne se brisera pas. Un proche peut le faire s’il le souhaite et s’il s’en sent capable — mais prévoyez que quelqu’un puisse prendre le relais, et dites-le-lui avant. Ce n’est pas un échec de ne pas y arriver, c’est un jour où l’on n’y arrive pas.</p>
        <h2 id="silence">Le silence d’après</h2>
        <p>Cinq à dix secondes, montre en main. C’est long à vivre et c’est ce silence qui fait le moment : il laisse à l’assemblée le temps de revenir. Enchaîner immédiatement sur une prise de parole annule ce que la musique vient de faire.</p>
        <p>Dites-le explicitement au maître de cérémonie : « après le morceau, on attend ». Sans consigne, le réflexe professionnel est d’enchaîner.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="erreurs">Quatre erreurs courantes</h2>
        <ul class="liste-or">
          <li><strong>Annoncer le prix ou le prestataire.</strong> Personne n’a besoin de savoir d’où vient l’œuvre. Dites qu’elle a été écrite pour lui, cela suffit.</li>
          <li><strong>Raconter la chanson avant de la passer.</strong> Elle se suffit. Résumer ses paroles, c’est en tuer l’effet.</li>
          <li><strong>La lancer pendant que les gens s’installent.</strong> Attendez que la salle soit posée et silencieuse, quitte à laisser passer trente secondes.</li>
          <li><strong>Baisser le son « pour ne pas déranger ».</strong> Une musique trop basse oblige à tendre l’oreille et empêche de se laisser prendre. Réglez le volume la veille, et n’y touchez plus.</li>
        </ul>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Faut-il prévenir l’assemblée que la chanson a été écrite sur mesure ?",
      texte: "Oui, en une phrase. Sans cela, une partie de l’assemblée cherchera à reconnaître le morceau au lieu de l’écouter. Dire « personne ne la connaît » libère l’écoute immédiatement." },
    { q: "Peut-on faire lire le texte de la chanson pendant qu’elle passe ?",
      texte: "Non, cela se contrarie : on ne peut pas lire et écouter en même temps. Si vous tenez à ce que les mots soient lus, faites-les imprimer sur le livret remis à l’entrée." },
    { q: "Doit-on rester debout ou assis pendant l’écoute ?",
      texte: "Assis, au recueillement. Debout, l’assemblée attend la suite et n’écoute pas. L’officiant vous le dira aussi." },
    { q: "Et si quelqu’un s’effondre pendant la diffusion ?",
      texte: "Cela arrive, et ce n’est pas un incident à gérer : c’est ce pour quoi les gens sont venus. Le maître de cérémonie sait faire. Prévoyez seulement qu’une personne soit assise à côté de la plus fragile." },
    { q: "Peut-on rejouer le morceau à la fin du repas ou au cimetière ?",
      texte: "Oui, le fichier est à vous. Beaucoup de familles le repassent en petit comité, et disent que c’est là qu’elles l’ont vraiment entendu." }
  ],
  proposition: "Nous fournissons l’œuvre et, si vous le voulez, la phrase d’annonce adaptée à votre cérémonie — c’est compris, il suffit de la demander.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/chanson-pour-obseques', 'Le jour même', "Si la partie technique n’est pas encore réglée"],
    ['/hommage-musical-defunt', 'Sept formes d’hommage', "Si vous hésitez encore sur la forme à donner"],
    ['/chanson-funeraire-personnalisee', 'Le ton juste', "Si vous craignez l’effet sur l’assemblée"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   10 — MUSIQUE POUR HOMMAGE FUNÉRAIRE : les six occasions
   ═══════════════════════════════════════════════════════════════ */
const OCCASIONS = [
  ['Les obsèques', "Trois moments musicaux, huit à douze minutes en tout. C’est le cadre le plus contraint : durée courte, sonorisation imposée, assemblée nombreuse.", "Une œuvre de trois minutes maximum, mixée pour une sono quelconque."],
  ['La crémation', "Souvent plus court encore, et le moment de la descente du cercueil appelle une musique qui tienne sans paroles.", "Un instrumental, ou une chanson dont le premier tiers est calme."],
  ['La dispersion des cendres', "En extérieur, sans sonorisation, avec peu de monde. Le vent mange tout.", "Une enceinte portable, un morceau court, et personne qui parle pendant."],
  ['La messe anniversaire', "Un an après, l’assemblée est plus petite et plus disponible. C’est souvent là qu’on écoute le mieux.", "C’est l’occasion idéale pour une œuvre écrite après coup, quand le temps a manqué."],
  ['La pose d’une plaque ou d’un monument', "Quelques personnes, en plein air, un moment court et officiel.", "Une écoute sur téléphone suffit. C’est aussi le moment où un QR code gravé prend son sens."],
  ['La Toussaint, ou une date à soi', "Aucun cadre, aucune obligation, personne à qui rendre des comptes.", "Ce que vous voulez, aussi souvent que vous voulez. Le fichier est à vous."]
];

const musiquePourHommage = page({
  file: 'musique-pour-hommage-funeraire.html',
  fil: 'Les occasions',
  title: 'Musique pour un hommage funéraire : six occasions, six choix | Melodia Funèbre',
  desc: "Obsèques, crémation, dispersion des cendres, messe anniversaire, pose d’une plaque, Toussaint : ce qui convient à chaque occasion, et ce qui ne passe pas.",
  h1: 'Six occasions,<br><em>six musiques.</em>',
  situation: "Pour quelqu’un dont l’hommage n’a pas forcément lieu pendant les obsèques.",
  chapeau: "On croit qu’un hommage musical, c’est la cérémonie. En réalité c’est au moins six moments différents, avec six contraintes qui n’ont rien à voir — une dispersion en plein vent n’a aucun rapport avec une messe anniversaire. Voici ce qui convient à chacun.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="occasions">Les six occasions</h2>
      </div>
      <div class="part-bloc req-liste reveal" style="margin-top:2rem;">
        <ul class="part-liste">
${OCCASIONS.map(([t, c, q]) => `          <li><strong>${t}</strong><span>${c}<br><em>Ce qui marche :</em> ${q}</span></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="apres-coup">Il n’est pas trop tard</h2>
        <p>Une idée fausse circule : que la musique d’hommage se joue le jour des obsèques ou jamais. Quatre des six occasions ci-dessus arrivent après, et une part des œuvres que nous composons le sont pour ces moments-là — parce qu’il n’y a pas eu le temps, parce que la famille n’était pas prête, ou parce que l’idée est venue plus tard.</p>
        <p>Il n’y a rien de tardif là-dedans. La cérémonie est le moment où l’on doit faire vite ; les autres sont ceux où l’on peut faire bien.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="exterieur">Le cas de l’extérieur</h2>
        <p>Dispersion, cimetière, jardin du souvenir : dehors, tout ce qui vaut à l’intérieur cesse de valoir. Le vent absorbe les aigus, il n’y a pas de mur pour renvoyer le son, et une enceinte de téléphone ne porte pas au-delà de deux mètres.</p>
        <ul class="liste-or">
          <li>Une enceinte portable chargée la veille, posée au sol et non tenue à la main.</li>
          <li>Un cercle serré : les gens se rapprochent, on ne diffuse pas vers un groupe dispersé.</li>
          <li>Un morceau court — deux minutes suffisent dehors, trois paraissent longues.</li>
          <li>Personne qui parle pendant. En extérieur, une voix par-dessus la musique rend les deux inaudibles.</li>
        </ul>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Peut-on faire composer une œuvre plusieurs années après le décès ?",
      texte: "Oui, et cela se fait régulièrement. Le travail est le même : il repose sur ce que la famille raconte, et le temps passé ne l’appauvrit pas — il le rend souvent plus précis." },
    { q: "Faut-il une autorisation pour diffuser de la musique dans un cimetière ?",
      texte: "Un cimetière est soumis au règlement de la commune, et les usages varient. Pour un moment court et à volume modéré, cela ne pose généralement pas de difficulté ; en cas de doute, la question se pose au service des cimetières de la mairie." },
    { q: "Quelle enceinte pour une dispersion en extérieur ?",
      texte: "N’importe quelle enceinte portable du commerce, chargée à bloc, posée au sol. Le modèle importe moins que la charge et la position : tenue à bout de bras, elle disperse le son." },
    { q: "Peut-on rejouer la même œuvre à chaque anniversaire ?",
      texte: "Oui, le fichier est à vous, sans limite d’usage familial. Plusieurs familles nous disent l’écouter chaque année à la même date — c’est même souvent la raison pour laquelle elles l’ont commandée." },
    { q: "Une même œuvre convient-elle à toutes ces occasions ?",
      texte: "Presque toujours, oui, à une réserve près : dehors, préférez une version courte ou instrumentale. C’est la seule adaptation qui vaille la peine d’être demandée." }
  ],
  proposition: "Nous composons pour la cérémonie comme pour les cinq autres occasions, et le fichier vous reste — de sorte que la même œuvre serve aussi bien vendredi que dans dix ans.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/dernier-hommage-musical', 'Ce que ça devient après', "Si votre question porte sur ce qui reste"],
    ['/qr-code-memorial', 'Le QR code sur la sépulture', "Si vous pensez à la pose d’une plaque"],
    ['/chanson-pour-obseques', 'Le jour même', "Si l’hommage a bien lieu aux obsèques"]
  ]
});

module.exports = [chansonPourObseques, musiquePersoObseques, hommageMusicalObseques, musiquePourHommage];
