/* ═══════════════════════════════════════════════════════════════
   LA GRAPPE « FABRICATION » — deux pages, deux verbes

   « Créer » et « composer » ne sont pas synonymes dans la tête de
   celui qui tape. Celui qui cherche à CRÉER envisage souvent de le
   faire lui-même : il veut savoir ce que ça demande. Celui qui
   cherche à COMPOSER veut voir la chaîne de fabrication : qui fait
   quoi, dans quel ordre, et combien de temps.

   La première page est donc écrite pour être utile à quelqu'un qui
   ne nous commandera jamais rien — sinon elle ne mérite pas d'être
   lue, et ne sera pas lue. La seconde ouvre l'atelier.
   ═══════════════════════════════════════════════════════════════ */

const { page } = require('./gabarit-requete.js');

/* ═══════════════════════════════════════════════════════════════
   5 — CRÉER UNE CHANSON POUR UN DÉFUNT
   ═══════════════════════════════════════════════════════════════ */
const SOI_MEME = [
  ['Écrire le texte',
   'Une à trois soirées si les mots viennent, davantage s’ils ne viennent pas.',
   'Gratuit',
   'C’est la partie que vous ferez le mieux, et de loin. Personne ne connaît la personne comme vous.'],
  ['Trouver la musique',
   'Quelques heures si vous jouez d’un instrument. Sinon, c’est le mur.',
   'Gratuit, ou le prix d’un musicien',
   'Attention au piège : reprendre la mélodie d’une chanson connue vous interdit de la diffuser publiquement sans autorisation.'],
  ['Enregistrer',
   'Une demi-journée, et il faut un endroit silencieux.',
   'De zéro à quelques centaines d’euros',
   'Un téléphone posé sur une table donne un résultat audible dans un salon, rarement dans une salle de cérémonie avec une sonorisation.'],
  ['Mixer',
   'Quelques heures, et c’est un métier.',
   'Gratuit si vous savez, sinon comptez un prestataire',
   'C’est l’étape qu’on sous-estime toujours. Une belle prise mal mixée passe mal sur une sono d’église.'],
  ['Vérifier les droits',
   'Une heure de lecture.',
   'Gratuit',
   'Une œuvre entièrement de vous ne pose aucun problème. Dès qu’il y a un emprunt, la question se pose — voyez notre page sur les droits.']
];

const creerChanson = page({
  file: 'creer-chanson-pour-defunt.html',
  fil: 'La créer',
  title: 'Créer une chanson pour un défunt : le faire soi-même ou la faire faire | Melodia Funèbre',
  desc: "Ce que demande réellement d’écrire, composer, enregistrer et mixer une chanson d’hommage soi-même — étape par étape, temps et coût — et quand il vaut mieux la faire faire.",
  h1: 'La créer soi-même,<br><em>ou la faire faire.</em>',
  situation: "Pour quelqu’un qui envisage sérieusement de s’en charger lui-même.",
  chapeau: "C’est une belle idée et elle est parfaitement faisable — nous connaissons des familles qui l’ont fait et le résultat valait tous les nôtres. Voici honnêtement ce que ça demande, étape par étape, pour que vous décidiez en connaissance de cause. Si vous repartez d’ici en le faisant vous-même, cette page aura fait son travail.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="etapes">Les cinq étapes, sans rien cacher</h2>
        <p>Une chanson enregistrée, ce n’est pas une étape mais cinq, et elles ne se valent pas : la première est la plus importante et vous la ferez mieux que quiconque ; les trois suivantes sont des métiers.</p>
      </div>
      <div class="part-bloc req-liste reveal" style="margin-top:2rem;">
        <ul class="part-liste">
${SOI_MEME.map(([t, d, c, n]) => `          <li><strong>${t}</strong><span>${d} &middot; ${c}<br>${n}</span></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="quand">Quand le faire soi-même est le bon choix</h2>
        <ul class="liste-or">
          <li><strong>Quelqu’un dans la famille joue et chante.</strong> Une guitare et une voix, dans une église, tiennent parfaitement. Le vivant vaut mieux que l’enregistré, toujours.</li>
          <li><strong>Vous avez du temps devant vous.</strong> Une messe anniversaire dans six mois, ce n’est pas la même chose qu’une cérémonie vendredi.</li>
          <li><strong>Le geste compte autant que le résultat.</strong> Une chanson maladroite chantée par son fils vaut mieux qu’une œuvre parfaite commandée. Personne dans la salle ne s’y trompera.</li>
        </ul>
        <h2 id="quand-pas">Quand ça se passe mal</h2>
        <ul class="liste-or">
          <li><strong>Quand il reste trois jours.</strong> Le deuil et la logistique prennent tout ; une chanson à finir devient une charge de plus, et souvent une source de conflit.</li>
          <li><strong>Quand vous comptez sur la sono de la salle.</strong> Un enregistrement fait au téléphone y devient inaudible. Faites toujours un essai dans la salle, la veille.</li>
          <li><strong>Quand vous reprenez la mélodie d’une chanson existante.</strong> C’est le cas le plus fréquent et le plus mal compris : écrire vos paroles sur un air connu ne vous rend pas propriétaire de l’air.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="faire-faire">Ce que change le fait de la faire faire</h2>
        <p>Trois choses, et il faut les peser : vous n’écrivez plus le texte vous-même — quelqu’un l’écrit d’après ce que vous racontez ; le résultat est mixé, donc il tient sur n’importe quelle sonorisation ; et le délai est tenu, ce qui, la semaine d’une cérémonie, n’est pas un détail.</p>
        <p>Ce que ça ne change pas : la matière reste la vôtre. Ce sont vos souvenirs, vos mots, votre décision sur le ton. <a href="/chanson-personnalisee-defunt">Les neuf questions que nous posons</a> sont exactement celles que vous vous poseriez en écrivant.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Peut-on écrire ses propres paroles sur une musique connue ?",
      texte: "Pour un usage strictement privé, la question se pose peu. Dès qu’il y a diffusion dans une cérémonie ouverte, la mélodie reste l’œuvre de son auteur et son utilisation relève des règles habituelles de droits d’auteur : votre opérateur funéraire et la SACEM sont les bons interlocuteurs pour votre cas." },
    { q: "Peut-on faire chanter quelqu’un en direct pendant la cérémonie ?",
      texte: "Oui, et beaucoup de familles le font. Prévenez l’officiant et le maître de cérémonie à l’avance, faites un essai sur place, et prévoyez une solution de repli enregistrée : une voix qui se brise le jour même est une éventualité réelle." },
    { q: "Quel matériel minimum pour un enregistrement correct ?",
      texte: "Une pièce sans écho — une chambre avec des rideaux vaut mieux qu’un salon carrelé —, un micro branché plutôt que celui du téléphone, et un casque pour se relire. Le reste est du confort." },
    { q: "Combien de temps faut-il, réellement, pour la faire soi-même ?",
      texte: "Les familles qui l’ont fait nous parlent d’une à deux semaines en y travaillant le soir, écriture comprise. En trois jours, c’est possible seulement si quelqu’un joue déjà et que le texte est écrit." },
    { q: "Si nous commençons et que nous n’y arrivons pas, est-il trop tard ?",
      texte: "Non, et c’est une situation fréquente. Un texte déjà écrit fait même gagner du temps : nous composons la musique autour de vos mots plutôt que d’écrire les nôtres." }
  ],
  proposition: "Si vous vous en chargez, gardez cette page sous le coude — elle dit ce qui coince en général. Si vous préférez la faire faire, nous écrivons d’après vos souvenirs et vous recevez l’œuvre avant la cérémonie.",
  bouton: 'Écouter ce que ça donne',
  voisines: [
    ['/composer-chanson-pour-defunt', 'Comment nous composons', "Si vous voulez voir la chaîne complète, étape par étape"],
    ['/musique-sacem-obseques', 'Les droits, en pratique', "Si vous envisagez de reprendre un air existant"],
    ['/chanson-pour-obseques', 'Le jour même', "Si la date approche et qu’il faut que ça marche"]
  ]
});

/* ═══════════════════════════════════════════════════════════════
   6 — COMPOSER UNE CHANSON POUR UN DÉFUNT
   ═══════════════════════════════════════════════════════════════ */
const CHAINE = [
  ['L’entretien', 'Vingt minutes, au téléphone ou par écrit.',
   'Neuf questions, et une seule règle : on note des faits, pas des adjectifs.'],
  ['Le texte', 'Écrit d’abord, toujours.',
   'La musique se plie au texte et jamais l’inverse. Un texte écrit pour tenir dans une mélodie existante s’entend immédiatement.'],
  ['Le registre', 'Choisi avec la famille.',
   'Vingt registres au départ. Le registre sert la personne, pas le goût de celui qui compose.'],
  ['La maquette', 'La première version complète.',
   'Voix, accompagnement, structure. C’est ce que la famille écoute et sur quoi elle peut demander une reprise.'],
  ['La voix', 'Homme ou femme, choisie à la commande.',
   'L’interprétation reste en retrait. Une voix qui appuie l’émotion la détruit — dans une salle, ça s’entend comme une comédie.'],
  ['Le mixage', 'L’étape invisible et décisive.',
   'Une cérémonie se diffuse sur une sonorisation quelconque, souvent médiocre. Le mixage est fait pour ça : tenir là, pas dans un casque de studio.'],
  ['La remise', 'Le fichier, à vous.',
   'Vous le recevez avant la cérémonie, dans un format lisible partout, et vous le gardez.']
];

const composerChanson = page({
  file: 'composer-chanson-pour-defunt.html',
  fil: 'La composer',
  title: 'Composer une chanson pour un défunt : la chaîne complète | Melodia Funèbre',
  desc: "De l’entretien au fichier remis : les sept étapes d’une composition d’hommage, ce qui se décide à chacune, et les trois pièges du registre funéraire.",
  h1: 'De vos mots<br><em>au fichier.</em>',
  situation: "Pour quelqu’un qui veut voir comment ça se fabrique avant de confier quoi que ce soit.",
  chapeau: "Une chanson d’hommage n’est pas un texte qu’on met en musique : c’est une chaîne de sept étapes, dont trois sont invisibles et décident pourtant du résultat. Voici l’atelier ouvert, dans l’ordre, avec ce qui se décide à chaque passage.",
  corps: `
  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="chaine">Sept étapes, dans cet ordre</h2>
        <p>L’ordre n’est pas une préférence d’atelier : inverser deux de ces étapes se paie à l’écoute, et se paie devant l’assemblée.</p>
      </div>
      <div class="part-bloc req-liste reveal" style="margin-top:2rem;">
        <ul class="part-liste">
${CHAINE.map(([t, q, d]) => `          <li><strong>${t}</strong><span>${q}<br>${d}</span></li>`).join('\n')}
        </ul>
      </div>
      <div class="prose reveal" style="margin-top:1.6rem;">
        <p>Le détail complet du circuit, délais compris, est sur la page <a href="/processus">Comment ça se passe</a>.</p>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="pieges">Les trois pièges de la composition funéraire</h2>
        <ul class="liste-or">
          <li><strong>Le tempo trop lent.</strong> Le réflexe est de ralentir pour faire grave. Une salle décroche sur un tempo traînant, et le morceau paraît deux fois plus long qu’il n’est. La gravité vient du dépouillement, pas de la lenteur.</li>
          <li><strong>L’arrangement trop plein.</strong> Chaque instrument ajouté éloigne un peu du texte. Les œuvres qui fonctionnent le mieux tiennent en deux ou trois instruments, souvent moins.</li>
          <li><strong>La rime qui commande.</strong> Dès que la rime décide du mot suivant, la personne disparaît de sa propre chanson. On accepte une rime imparfaite plutôt qu’un mot faux — c’est la règle la plus utile du métier.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="prose reveal">
        <h2 id="outils">Ce que nous disons de nos outils</h2>
        <p>La composition musicale s’appuie sur des outils de génération assistée, encadrés à chaque étape par une personne : le texte est écrit et relu par un humain, le registre est choisi avec la famille, la maquette est retravaillée jusqu’à ce qu’elle tienne, le mixage est vérifié à l’écoute. Nous le disons parce qu’une famille a le droit de le savoir avant de commander, et non après.</p>
        <p>Ce que cela change pour vous : le délai, essentiellement. Ce que cela ne change pas : la matière est la vôtre, et une œuvre qui ne vous convient pas est reprise.</p>
      </div>
    </div>
  </section>`,
  questions: [
    { q: "Qui écrit le texte, exactement ?",
      texte: "Une personne, à partir de l’entretien, et le texte est relu avant que la musique ne commence. C’est la seule étape qui ne souffre aucune automatisation : elle repose entièrement sur ce que la famille a raconté." },
    { q: "Peut-on assister à la composition ou entendre les versions intermédiaires ?",
      texte: "Vous entendez la maquette, c’est-à-dire la première version complète. Les états antérieurs n’apprennent rien et inquiètent pour rien : une œuvre à moitié faite sonne toujours mal." },
    { q: "Combien de reprises sont possibles ?",
      texte: "Le nombre dépend de la formule choisie et il est écrit noir sur blanc avant la commande, avec le délai. Une reprise porte sur ce qui ne va pas — un mot, un tempo, une voix — pas sur une réécriture complète." },
    { q: "Dans quel format le fichier est-il remis ?",
      texte: "Un format audio lisible partout, téléchargeable, sans dispositif qui vous empêcherait de le copier. Il est à vous : vous pouvez le graver, l’envoyer à la famille, le garder trente ans." },
    { q: "Peut-on obtenir une version instrumentale en plus ?",
      texte: "Oui, c’est demandé assez souvent — pour l’entrée ou la sortie, quand les paroles sont réservées au recueillement. Précisez-le à la commande." }
  ],
  proposition: "La chaîne ci-dessus est la nôtre, sans raccourci caché. Vous entrez par un entretien de vingt minutes et vous sortez avec un fichier qui vous appartient.",
  bouton: 'Écouter le résultat',
  voisines: [
    ['/creer-chanson-pour-defunt', 'La faire soi-même', "Si vous hésitez encore à vous en charger"],
    ['/chanson-funeraire-personnalisee', 'Le ton juste', "Si votre question porte sur le rendu plutôt que sur la méthode"],
    ['/processus', 'Le circuit complet', "Si vous voulez les délais et les étapes côté commande"]
  ]
});

module.exports = [creerChanson, composerChanson];
