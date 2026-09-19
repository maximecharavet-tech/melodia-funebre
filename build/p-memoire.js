/* ═══════════════════════════════════════════════════════════════
   LA GRAPPE « MÉMOIRE » — trois pages, trois distances

     · « musique personnalisée défunt »  cherche le style qui lui ressemble
     · « hommage musical défunt »        cherche la forme à donner
     · « dernier hommage musical »       se demande ce qu'il en restera

   La première part du catalogue réel : six vies, six registres, et
   pourquoi. La deuxième range notre métier parmi six autres formes
   d'hommage musical, avec leurs avantages — y compris quand ils sont
   meilleurs que le nôtre. La troisième parle d'après : la page
   hommage, la plaque, le fichier, et à qui tout cela appartient.
   ═══════════════════════════════════════════════════════════════ */

const { page } = require('./gabarit-requete.js');
const { esc, oeuvre, lien } = require('./citations.js');

/* ═══════════════════════════════════════════════════════════════
   11 — MUSIQUE PERSONNALISÉE DÉFUNT : du portrait au registre
   ═══════════════════════════════════════════════════════════════ */
const PORTRAITS = [
  ['Le Papi Pêcheur', "Quarante ans au bord de la Loire, peu de mots, une patience.", "Chanson française, guitare et accordéon, tempo de marche. Le registre suit l’homme : rien de démonstratif."],
  ['Vers les pâturages d’en haut', "Un berger du Niolu, une vie en altitude, une langue.", "Polyphonie corse. Ici le registre n’est pas un habillage : c’est la langue dans laquelle cet homme a vécu."],
  ['Le roi de la route', "Un routier, bruyant, généreux, qui aurait détesté qu’on pleure.", "Funk. Le choix a surpris la famille avant de la convaincre — et l’assemblée a souri."],
  ['Enfant de la mer', "Un tambouyé de Fort-de-France.", "Bélé antillais. Le tambour de son île, joué pour lui."],
  ['Eshet Chayil, femme de valeur', "Une femme de 85 ans, une tradition, un titre qui vient d’un texte.", "Klezmer. Le registre porte une appartenance autant qu’une esthétique."],
  ['Saudade Noite', "Un homme de 69 ans, et un mot portugais qui n’a pas d’équivalent français.", "Bossa nova. Quand la personne tient dans un mot d’une autre langue, le registre vient avec."]
];

const musiquePersoDefunt = page({
  file: 'musique-personnalisee-defunt.html',
  fil: 'Le registre',
  title: 'Musique personnalisée pour un défunt : trouver son style | Melodia Funèbre',
  desc: "Six vies réelles, six registres musicaux, et la raison du choix à chaque fois. Comment on passe du portrait d’une personne à la musique qui lui va.",
  h1: 'Quelle musique<br><em>lui ressemble ?</em>',
  situation: "Pour quelqu’un qui cherche le style, et ne sait pas par quel bout le prendre.",
  chapeau: "La question se pose presque toujours à l’envers : « quel style choisir ? ». Elle se résout à l’endroit — on part de la personne, et le registre tombe tout seul. Voici six vies réelles, le registre retenu pour chacune, et pourquoi. Toutes sont écoutables.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="portraits">Six vies, six registres</h2>
        <p>Dans aucun de ces six cas la famille n’est arrivée avec un style en tête. Elle est arrivée avec un métier, un lieu, une habitude — et le registre s’est imposé à l’entretien.</p>
      </div>
      <div class="part-bloc req-liste reveal" style="margin-top:2rem;">
        <ul class="part-liste">
${PORTRAITS.map(([titre, vie, choix]) => {
  const o = oeuvre(titre, 'p-memoire.js');
  const t = o ? `<a href="${lien(o)}">${esc(o.title)}</a>` : esc(titre);
  return `          <li><strong>${t}</strong><span>${vie}<br>${choix}</span></li>`;
}).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="regles">Trois règles qui évitent de se tromper</h2>
        <ul class="liste-or">
          <li><strong>Le registre sert la personne, pas le goût de la famille.</strong> C’est la question la plus difficile de l’entretien : ce que vous aimez, vous, n’entre pas en ligne de compte.</li>
          <li><strong>Ce qu’elle écoutait n’est pas forcément ce qui lui va.</strong> Quelqu’un qui écoutait de la variété toute la journée peut avoir eu une vie qui appelle tout autre chose. Nous demandons les deux, et nous en discutons.</li>
          <li><strong>Un registre inattendu se défend, à condition de l’annoncer.</strong> Le funk pour un routier a fonctionné parce que la famille l’avait dit à l’assemblée. Sans un mot d’explication, le même choix aurait choqué.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="catalogue">Vingt registres au départ, et hors catalogue</h2>
        <p>Le catalogue propose vingt registres, du piano classique à la musique du monde, chacun illustré par une œuvre écoutable quand nous en avons déjà composé une. Si aucun ne lui ressemble, dites-le : nous composons aussi hors catalogue, et cela ne change ni le prix ni le délai.</p>
        <p><a href="/demos#registres">Voir les vingt registres et les écouter</a>.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Peut-on demander un registre qui n’est pas dans la liste ?",
      texte: "Oui. La liste est un point de départ, pas un catalogue fermé. Un registre régional, une langue, un instrument précis : dites-le à l’entretien." },
    { q: "Peut-on demander une chanson dans une autre langue que le français ?",
      texte: "Oui, cela s’est fait — pour une personne dont ce n’était pas la langue maternelle, ou pour une famille binationale. Prévenez-nous dès l’entretien, cela change l’écriture." },
    { q: "Le registre change-t-il le prix ?",
      texte: "Non. Une polyphonie corse et un piano seul coûtent la même chose : le travail est le même, c’est l’habillage qui diffère." },
    { q: "Peut-on entendre le registre avant de valider le texte ?",
      texte: "Les deux arrivent ensemble, dans la maquette : un registre s’apprécie sur la vraie chanson, pas sur un échantillon générique." },
    { q: "Et si la personne détestait la musique ?",
      texte: "Cela arrive, et c’est un vrai cas. On part alors du dépouillement : un instrument, une voix, très peu de notes. Ou bien un instrumental court. Ne pas aimer la musique, ce n’est pas une raison de ne rien avoir." }
  ],
  proposition: "Le registre se décide à l’entretien, à partir de ce que vous racontez — et si nous nous trompons, la maquette est là pour le voir avant la cérémonie.",
  bouton: 'Écouter les vingt registres',
  voisines: [
    ['/chanson-funeraire-personnalisee', 'Le ton juste', "Si votre question porte sur l’émotion plutôt que sur le style"],
    ['/hommage-musical-defunt', 'Sept formes d’hommage', "Si vous n’êtes pas sûr que la chanson soit la bonne forme"],
    ['/musique-personnalisee-obseques', 'Commerce ou sur mesure', "Si vous hésitez encore avec un morceau existant"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   12 — HOMMAGE MUSICAL DÉFUNT : sept formes, dont la nôtre
   ═══════════════════════════════════════════════════════════════ */
const FORMES = [
  ['Le morceau qu’il aimait',
   'Gratuit, immédiat, reconnu de tous.',
   'Il parle d’autre chose que de lui. Et il appartiendra toujours à quelqu’un d’autre.'],
  ['Un musicien qui joue sur place',
   'Le vivant l’emporte sur l’enregistré, toujours. Une guitare dans une église ne se remplace pas.',
   'Il faut le trouver, le payer, et accepter le risque du direct. Rien n’en reste ensuite.'],
  ['La chorale ou l’assemblée qui chante',
   'C’est la forme la plus ancienne, et la plus forte quand elle prend.',
   'Elle suppose une assemblée qui connaît le chant. Dans une cérémonie civile, cela retombe souvent.'],
  ['Un enregistrement de sa propre voix',
   'Bouleversant, et gratuit : un message vocal, une vidéo de famille.',
   'À manier avec précaution. Beaucoup de familles ne le supportent pas le jour même, et il vaut mieux le découvrir avant.'],
  ['Un montage photo sonorisé',
   'Fait par la famille, il raconte une vie en trois minutes.',
   'Il occupe les yeux. Pendant un montage, personne n’écoute la musique.'],
  ['Une chanson écrite par un proche',
   'La forme la plus juste de toutes, quand quelqu’un en est capable.',
   'Elle demande du temps et du sang-froid, la semaine où l’on en a le moins.'],
  ['Une œuvre composée pour la personne',
   'Elle nomme ses gestes et ses proches, elle est mixée pour n’importe quelle sonorisation, et elle reste.',
   'Elle a un prix, et un délai. C’est ce que nous faisons.']
];

const hommageMusicalDefunt = page({
  file: 'hommage-musical-defunt.html',
  fil: 'Les formes',
  title: 'Hommage musical à un défunt : sept formes possibles | Melodia Funèbre',
  desc: "Morceau qu’il aimait, musicien sur place, chorale, sa voix, œuvre composée : ce que chacune de ces sept formes apporte, et ce qu’elle coûte.",
  h1: 'Sept façons<br><em>de lui rendre hommage.</em>',
  situation: "Pour quelqu’un qui cherche la bonne forme, sans savoir encore laquelle.",
  chapeau: "Un hommage musical, ce n’est pas une chose mais sept, et la meilleure dépend de qui vous êtes et de ce dont vous disposez. Voici les sept, avec leur avantage réel et leur défaut réel. La nôtre est la dernière, et ce n’est pas toujours la bonne.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="formes">Sept formes, avec leurs défauts</h2>
      </div>
      <div class="part-bloc req-liste reveal" style="margin-top:2rem;">
        <ul class="part-liste">
${FORMES.map(([t, plus, moins]) => `          <li><strong>${t}</strong><span>${plus}<br><em>Ce qu’il faut savoir :</em> ${moins}</span></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="combiner">Elles se combinent</h2>
        <p>La question n’est pas « laquelle », mais « lesquelles, et à quel moment ». Une cérémonie réserve trois moments à la musique : il y a de la place pour deux formes, rarement trois.</p>
        <p>La combinaison la plus fréquente, et celle qui fonctionne le mieux : un morceau qu’il aimait à l’entrée et à la sortie, une œuvre écrite pour lui au recueillement. Le <a href="/musique-obseques">guide des trois moments</a> détaille ce découpage.</p>
        <p>La combinaison à éviter : deux formes enregistrées qui se suivent. La seconde est toujours perdante.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="voix">Un mot sur l’enregistrement de sa voix</h2>
        <p>C’est la forme la plus puissante des sept, et la seule que nous déconseillons de décider seul. Un message vocal diffusé dans une salle produit un effet qu’on ne peut pas prévoir sur soi-même — encore moins sur sa mère, son frère ou ses enfants.</p>
        <p>Si vous y tenez, écoutez-le d’abord entre vous, à plusieurs, à volume réel. Et gardez-le plutôt pour un moment en petit comité que pour la cérémonie publique.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Combien de formes différentes peut-on mettre dans une même cérémonie ?",
      texte: "Deux, en pratique. Trois si la cérémonie est longue et qu’un officiant les sépare par des prises de parole. Au-delà, l’assemblée ne distingue plus rien." },
    { q: "Un musicien vivant coûte-t-il plus cher qu’une œuvre enregistrée ?",
      texte: "Cela dépend entièrement de qui joue. Un proche musicien ne coûte rien ; un professionnel qui se déplace a son tarif. La vraie différence n’est pas le prix : le musicien joue une fois, l’enregistrement reste." },
    { q: "Peut-on faire chanter l’assemblée dans une cérémonie civile ?",
      texte: "C’est possible mais risqué : sans habitude collective du chant, peu de gens se lancent et le silence qui suit est pénible. Si vous y tenez, faites distribuer les paroles et demandez à trois ou quatre personnes de porter le début." },
    { q: "Le montage photo est-il une bonne idée ?",
      texte: "Oui, mais pas pendant le moment musical. Pendant des images, personne n’écoute. Placez-le au repas ou à l’accueil, et gardez la musique seule pour le recueillement." },
    { q: "Quelle forme choisir quand on a très peu de temps ?",
      texte: "Le morceau qu’il aimait, sans hésiter : c’est immédiat et ça marche. Une œuvre composée demande quelques jours ; si vous ne les avez pas, elle trouvera sa place plus tard." }
  ],
  proposition: "La septième forme est la nôtre : une œuvre écrite pour une personne, remise avant la cérémonie, et qui vous reste. Les six autres ne s’achètent pas chez nous et méritaient d’être nommées.",
  bouton: 'Écouter la septième forme',
  voisines: [
    ['/hommage-musical-obseques', 'Comment l’annoncer', "Une fois la forme choisie"],
    ['/musique-personnalisee-defunt', 'Le registre qui lui ressemble', "Si vous partez sur une œuvre composée"],
    ['/creer-chanson-pour-defunt', 'L’écrire soi-même', "Si la sixième forme vous tente"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   13 — DERNIER HOMMAGE MUSICAL : ce qu'il en reste
   ═══════════════════════════════════════════════════════════════ */
const RESTE = [
  ['Le fichier',
   'Un fichier audio courant, téléchargeable, sans dispositif qui vous empêche de le copier. Vous pouvez l’envoyer, le graver, le sauvegarder ailleurs — et vous devriez : une seule copie n’est pas une copie.'],
  ['La page hommage',
   'Une page à son nom, avec l’œuvre, une photo et quelques lignes. Elle n’est pas référencée sur les moteurs de recherche, elle se partage par un lien, et la famille peut la retirer elle-même à tout moment.'],
  ['La plaque et son code',
   'Un QR code gravé sur la sépulture, qui ouvre la page. C’est la seule partie qui suppose un tiers : votre agence funéraire réalise la plaque, nous fournissons le fichier de gravure.'],
  ['Ce qui ne dépend de personne',
   'Le fichier, une fois chez vous, ne dépend plus de nous. C’est la question à poser à quiconque vous vend ce genre de service, et la réponse doit être écrite.']
];

const dernierHommageMusical = page({
  file: 'dernier-hommage-musical.html',
  fil: 'Ce qu’il en reste',
  title: 'Dernier hommage musical : ce qu’il en reste après la cérémonie | Melodia Funèbre',
  desc: "Le fichier, la page, le QR gravé : ce que devient l’œuvre après la cérémonie, à qui elle appartient, et ce qui arrive si le prestataire disparaît.",
  h1: 'Après la cérémonie,<br><em>qu’est-ce qui reste ?</em>',
  situation: "Pour quelqu’un qui pense déjà à la suite : dans dix ans, dans trente ans.",
  chapeau: "Une cérémonie dure quarante minutes. La question qui compte vraiment vient après : qu’est-ce qui reste, à qui cela appartient, et que se passe-t-il si l’entreprise qui l’a produit ferme ? Voici les réponses, y compris celles qui ne nous arrangent pas.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="reste">Quatre choses, et leur solidité</h2>
      </div>
      <div class="part-bloc req-liste reveal" style="margin-top:2rem;">
        <ul class="part-liste">
${RESTE.map(([t, d]) => `          <li><strong>${t}</strong><span>${d}</span></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="disparition">Et si nous disparaissons ?</h2>
        <p>C’est la question la plus importante de cette page, et la moins posée. Toute jeune entreprise peut fermer, la nôtre comme une autre.</p>
        <p>Si cela arrivait : <strong>le fichier que vous avez téléchargé continue de fonctionner</strong>, parce qu’il est chez vous et pas chez nous. C’est la raison pour laquelle nous vous le remettons plutôt que de vous donner seulement un accès.</p>
        <p>En revanche, <strong>une page hébergée cesse de répondre</strong>, et un QR code gravé qui pointait vers elle devient illisible. C’est vrai de nous comme de n’importe quel prestataire de page mémorielle. La parade est simple et vaut pour tous : téléchargez le fichier et les photos, gardez-les vous-même, et ne faites graver un code qu’en sachant cela.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="transmettre">La transmettre</h2>
        <p>C’est l’usage dont les familles nous parlent le plus, et celui auquel personne ne pense en commandant : l’œuvre se donne. Aux petits-enfants qui n’ont pas connu la personne, au frère qui vivait loin, à ceux qui n’ont pas pu venir.</p>
        <p>Un enregistrement se transmet mieux qu’un texte : on le met, on n’a rien à faire, et il dure trois minutes. Plusieurs familles nous ont dit l’avoir renvoyé le soir même de la cérémonie à ceux qui étaient absents — et que c’est là qu’il avait le plus servi.</p>
        <p>Si vous voulez qu’il soit accessible depuis la sépulture, le <a href="/qr-code-memorial">guide du QR code mémoriel</a> dit ce qu’il faut vérifier avant de graver quoi que ce soit.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "À qui appartient l’œuvre une fois payée ?",
      texte: "Le fichier vous est remis et vous en disposez librement pour votre usage familial : l’écouter, le copier, le transmettre, le diffuser lors d’une cérémonie. Les conditions précises figurent dans nos conditions générales de vente, et nous vous invitons à les lire avant de commander." },
    { q: "Peut-on obtenir une nouvelle copie si on perd le fichier ?",
      texte: "Oui, tant que nous existons : redemandez-la. C’est précisément pour cela que nous vous recommandons d’en garder une copie ailleurs — sur un disque, dans une boîte mail, chez un autre membre de la famille." },
    { q: "La page hommage est-elle visible sur Google ?",
      texte: "Non. Elle porte une consigne de non-indexation et se partage par un lien. C’est un choix : une page de deuil n’a rien à faire dans des résultats de recherche." },
    { q: "Peut-on supprimer la page plus tard ?",
      texte: "Oui, et la famille peut le faire elle-même, à tout moment, sans avoir à le demander ni à se justifier." },
    { q: "Peut-on diffuser l’œuvre publiquement, par exemple sur les réseaux sociaux ?",
      texte: "Pour un partage familial, sans difficulté. Pour une diffusion publique large ou commerciale, parlez-nous-en d’abord : c’est une autre question que celle de l’usage privé, et elle se règle simplement mais elle se règle." }
  ],
  proposition: "Nous remettons le fichier plutôt qu’un simple accès, et la page hommage se retire d’un clic par la famille. C’est ce qui nous paraît honnête pour un objet censé durer plus longtemps que nous.",
  bouton: 'Écouter des hommages composés',
  voisines: [
    ['/qr-code-memorial', 'Le QR code sur la sépulture', "Si vous envisagez de faire graver un code"],
    ['/musique-pour-hommage-funeraire', 'Les six occasions', "Si vous cherchez quand la réécouter"],
    ['/chanson-dernier-hommage', 'Dire ce qu’on n’a pas dit', "Si l’œuvre n’est pas encore écrite"]
  ]
});

module.exports = [musiquePersoDefunt, hommageMusicalDefunt, dernierHommageMusical];
