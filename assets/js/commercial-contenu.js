/* ═══════════════════════════════════════════════════════════════
   MELODIA — Contenu commercial

   Tout ce qu'un collaborateur doit avoir sous la main pour vendre :
   modèles de courriel, script d'appel, réponses aux objections, plan
   de prospection. Séparé de la mécanique de la console pour qu'il se
   relise et se corrige sans toucher au code.

   Une règle tient tout le reste : on ne vend pas un procédé, on vend
   une émotion juste. Le collaborateur ne décrit jamais la musique —
   il la fait écouter.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SITE = 'https://melodia-funebre.fr';

  /* ═══════════════════════════════════════════════════════════
     MODÈLES DE COURRIEL
     Prospection entre professionnels : la loi française l'autorise
     sans accord préalable si le message concerne l'activité du
     destinataire, que l'expéditeur est identifiable, et qu'un moyen
     de refuser figure dans le message. Le pied de page du gabarit
     porte la mention d'opposition — ne jamais la retirer.
     ═══════════════════════════════════════════════════════════ */
  var MODELES = {

    contact: {
      nom: 'Premier contact',
      quand: 'Le tout premier message. À envoyer le matin, entre 8 h et 10 h.',
      etape: 'contacte',
      lien: { texte: 'Écouter trois hommages', url: SITE + '/demos' },
      objet: function (p) {
        return 'Un service que vos confrères de ' + (p.ville || 'votre secteur') + ' ne proposent pas encore';
      },
      titre: function () { return 'Chaque vie mérite une chanson'; },
      texte: function (p) {
        return [
          'Bonjour' + (p.dirigeant ? ' ' + p.dirigeant : '') + ',',

          'Aux obsèques, la musique n\'a presque jamais connu le défunt. Un Ave Maria ' +
          'pour une grand-mère qui ne chantait qu\'en cuisine. Une valse pour un homme ' +
          'qui sifflait dans ses champs. C\'est le seul moment de la cérémonie que les ' +
          'familles n\'ont pas pu rendre personnel.',

          'Nous composons, pour chaque défunt, une chanson originale à partir de ce que ' +
          'la famille raconte : trois traits de caractère, un métier, une habitude. ' +
          'Livrée en vingt-quatre heures, diffusable en cérémonie, sans aucun droit ' +
          'SACEM à régler, et conservée par la famille pour toujours.',

          'Ce que cela change pour ' + (p.nom || 'votre maison') + ' :',

          '· vous conservez 60 % du montant, soit 179 € nets sur une offre à 299 €\n' +
          '· aucun investissement, aucun stock, aucune charge technique\n' +
          '· trente secondes de présentation en rendez-vous suffisent\n' +
          '· un service qu\'aucun de vos confrères ne propose encore',

          'Pour que vous jugiez sur pièce plutôt que sur promesse, nous composons ' +
          'gratuitement un premier hommage pour votre prochaine famille. Vous le ' +
          'présentez. Si cela ne touche pas, nous en restons là.',

          'Le plus simple reste d\'écouter — trois minutes suffisent.',

          'Seriez-vous disponible quelques minutes cette semaine ?'
        ].join('\n\n');
      }
    },

    message: {
      nom: 'Après un appel manqué',
      quand: 'Vous avez appelé, personne n\'a décroché ou vous avez laissé un message.',
      etape: 'contacte',
      lien: { texte: 'Écouter un hommage', url: SITE + '/demos' },
      objet: function (p) { return 'Suite à mon appel — ' + (p.nom || 'Melodia Funèbre'); },
      titre: function () { return 'Je me permets de vous laisser l\'essentiel'; },
      texte: function (p) {
        return [
          'Bonjour' + (p.dirigeant ? ' ' + p.dirigeant : '') + ',',

          'J\'ai essayé de vous joindre aujourd\'hui — je me doute que vos journées ' +
          'ne s\'y prêtent pas toujours. Voici donc l\'essentiel en quelques lignes, ' +
          'vous en ferez ce que vous voudrez.',

          'Nous composons une chanson originale pour chaque défunt, à partir de trois ' +
          'mots donnés par la famille. Livrée en vingt-quatre heures, sans droits ' +
          'SACEM, et elle reste à la famille.',

          'Vous conservez 60 % du montant. La première composition est offerte, pour ' +
          'que vous puissiez la présenter à une famille avant de décider quoi que ce soit.',

          'Écoutez-en une, c\'est plus parlant que tout ce que je pourrais écrire. ' +
          'Et dites-moi simplement si je vous rappelle, ou non.'
        ].join('\n\n');
      }
    },

    apres_appel: {
      nom: 'Récapitulatif après entretien',
      quand: 'Dans l\'heure qui suit un appel qui s\'est bien passé. Le plus important des six.',
      etape: 'interesse',
      lien: { texte: 'Écouter les hommages', url: SITE + '/demos' },
      objet: function (p) { return 'Comme convenu — Melodia Funèbre'; },
      titre: function () { return 'Ce dont nous avons parlé'; },
      texte: function (p) {
        return [
          'Bonjour' + (p.dirigeant ? ' ' + p.dirigeant : '') + ',',

          'Merci du temps que vous m\'avez accordé. Je vous remets par écrit ce dont ' +
          'nous avons parlé, pour que vous puissiez y revenir ou le transmettre.',

          'Le principe : la famille vous confie trois traits de caractère, un métier ou ' +
          'une passion, une habitude quotidienne. Vous nous les transmettez en trois ' +
          'minutes. Nous composons, et l\'hommage vous revient sous vingt-quatre heures, ' +
          'prêt à être diffusé.',

          'Vos conditions :',

          '· 60 % du montant vous reviennent — 89 € sur l\'offre à 149 €, 179 € sur celle à 299 €\n' +
          '· aucun investissement ni engagement de volume\n' +
          '· aucun droit SACEM à déclarer, pour vous comme pour la famille\n' +
          '· la première composition est offerte, sans contrepartie',

          'La suite, si vous le souhaitez : à la prochaine famille qui vous semble ' +
          'réceptive, vous posez les cinq questions. Vous m\'envoyez les réponses. ' +
          'Vous recevez la chanson le lendemain et vous la leur présentez.',

          'Je reste à votre disposition pour toute question.'
        ].join('\n\n');
      }
    },

    relance: {
      nom: 'Relance',
      quand: 'Sept jours après le premier contact, sans réponse. Une seule fois.',
      etape: 'relance',
      lien: { texte: 'Écouter Le Papi Pêcheur', url: SITE + '/demos' },
      objet: function (p) { return 'Trois mots, et une chanson — ' + (p.nom || ''); },
      titre: function () { return 'Trois mots : patient, taquin, silencieux'; },
      texte: function (p) {
        return [
          'Bonjour' + (p.dirigeant ? ' ' + p.dirigeant : '') + ',',

          'Je me permets de revenir vers vous une seule fois, puis je vous laisse tranquille.',

          'Plutôt que de vous réexpliquer, je préfère vous montrer. Une fille nous a ' +
          'donné trois mots pour son père, pêcheur en bord de Loire : « patient, taquin, ' +
          'silencieux ». Voici ce que sa famille a entendu à la cérémonie.',

          'Trois minutes d\'écoute vous diront en une fois ce qu\'un courriel ne dira jamais.',

          'Si le principe vous parle, la première composition est offerte : vous la ' +
          'présentez à une famille, sans engagement.',

          'Et si le moment n\'est pas le bon, dites-le moi simplement — je ne reviendrai pas.'
        ].join('\n\n');
      }
    },

    offre: {
      nom: 'Composition offerte',
      quand: 'L\'agence a dit oui au principe. On enclenche.',
      etape: 'demo_offerte',
      lien: { texte: 'Ouvrir mon espace partenaire', url: SITE + '/compte' },
      objet: function (p) { return 'Votre première composition, offerte'; },
      titre: function () { return 'Nous composons votre premier hommage'; },
      texte: function (p) {
        return [
          'Bonjour' + (p.dirigeant ? ' ' + p.dirigeant : '') + ',',

          'Comme convenu, nous composons gratuitement un premier hommage pour ' +
          (p.nom || 'votre maison') + '.',

          'Voici les cinq questions à poser à la famille. Elles prennent trois minutes, ' +
          'et vous n\'avez rien d\'autre à préparer :',

          '· son prénom, son âge, et le lien avec ceux qui restent\n' +
          '· trois traits de caractère, en un mot chacun\n' +
          '· son métier, ou la passion qui a compté\n' +
          '· une habitude que tout le monde lui connaissait\n' +
          '· une anecdote, si la famille veut bien la confier',

          'Transmettez-les moi et vous recevez la chanson sous vingt-quatre heures. ' +
          'Vous la présentez à la famille. Si cela touche, nous continuons ensemble. ' +
          'Sinon, vous n\'avez rien avancé et rien à nous devoir.',

          'Votre espace partenaire est ouvert : vous y suivez chaque commande en direct.'
        ].join('\n\n');
      }
    },

    reactivation: {
      nom: 'Réactivation',
      quand: 'Trois à six mois après un « pas maintenant ». Jamais avant.',
      etape: 'relance',
      lien: { texte: 'Écouter les dernières compositions', url: SITE + '/demos' },
      objet: function (p) { return 'Des nouvelles, après quelques mois'; },
      titre: function () { return 'Le moment est peut-être meilleur'; },
      texte: function (p) {
        return [
          'Bonjour' + (p.dirigeant ? ' ' + p.dirigeant : '') + ',',

          'Nous nous étions parlé il y a quelques mois : le moment n\'était pas le bon, ' +
          'et je l\'ai entendu.',

          'Je reviens simplement parce que notre catalogue s\'est étoffé depuis. Vous y ' +
          'trouverez des registres très différents — chanson française, gospel, ' +
          'musique du monde, piano — chacun composé pour une personne réelle, à partir ' +
          'de ce que sa famille nous avait raconté.',

          'La première composition reste offerte, dans les mêmes conditions.',

          'Si c\'est toujours non, dites-le moi et je ne reviendrai plus : votre temps ' +
          'compte autant que le mien.'
        ].join('\n\n');
      }
    }
  };

  /* ═══════════════════════════════════════════════════════════
     SCRIPT D'APPEL
     Un appel réussi ne récite rien. Ce script donne les points de
     passage et les mots exacts qui fonctionnent — le collaborateur
     s'en écarte dès qu'il a trouvé sa propre voix.
     ═══════════════════════════════════════════════════════════ */
  var SCRIPT = [
    {
      titre: 'Avant de décrocher',
      duree: '2 minutes',
      points: [
        'Ouvrez la fiche : nom exact de la maison, ville, nom du dirigeant si vous l\'avez.',
        'Vérifiez si c\'est une maison indépendante ou une agence de réseau. Le discours n\'est pas le même : l\'indépendant décide seul, l\'agence de réseau doit en référer.',
        'Ayez un hommage prêt à jouer, son coupé, prêt à être lancé.',
        'Debout, si vous le pouvez. La voix porte autrement.'
      ],
      note: 'N\'appelez jamais un lundi matin ni un vendredi après-midi. Le meilleur créneau : mardi à jeudi, 9 h 30 – 11 h 30, ou 14 h – 16 h.'
    },
    {
      titre: 'Le barrage',
      duree: '15 secondes',
      dire: '« Bonjour, [Prénom Nom] de Melodia Funèbre. Je souhaitais parler au responsable de l\'agence au sujet d\'un service que nous proposons aux pompes funèbres. À qui dois-je m\'adresser ? »',
      points: [
        'Donnez votre nom complet et le nom de la maison. Ne vous excusez pas d\'appeler.',
        'Ne dites jamais « je voulais savoir si… » ni « je ne vous dérange pas ? ». Ces formules invitent au non.',
        'Si on vous demande de quoi il s\'agit : « D\'un service de composition musicale personnalisée pour les cérémonies. C\'est le responsable qui jugera si cela l\'intéresse. »',
        'Si on vous demande d\'envoyer un mail : « Volontiers. À quelle adresse, et à quel nom ? Je le prépare et je rappelle jeudi pour savoir ce qu\'il en pense. » — vous repartez avec l\'adresse ET un rendez-vous.'
      ]
    },
    {
      titre: 'Les vingt premières secondes',
      duree: '20 secondes',
      dire: '« Bonjour [Nom], [Prénom Nom] de Melodia Funèbre. Je vous appelle parce que nous composons des chansons originales pour les cérémonies — une chanson écrite pour le défunt, à partir de ce que la famille raconte. Est-ce que vous avez deux minutes, ou je vous rappelle à un meilleur moment ? »',
      points: [
        'Le sujet est annoncé en une phrase. Personne ne raccroche sur une phrase claire.',
        'Proposer de rappeler désarme : vous laissez la main, et vous obtenez presque toujours les deux minutes.',
        'Puis vous vous taisez. C\'est le moment le plus important de l\'appel.'
      ]
    },
    {
      titre: 'La découverte',
      duree: '1 à 2 minutes',
      points: [
        '« Aujourd\'hui, comment ça se passe pour la musique en cérémonie ? »',
        '« Il vous arrive que la famille demande quelque chose de personnel ? »',
        '« Vous avez combien de cérémonies par mois, à peu près ? »',
        '« Qu\'est-ce que les familles vous redemandent le plus souvent, et que vous ne pouvez pas fournir ? »'
      ],
      note: 'Écoutez vraiment. Ce qu\'ils répondent ici, vous le leur resservirez au moment du pitch — avec leurs mots à eux.'
    },
    {
      titre: 'Le pitch',
      duree: '30 secondes',
      dire: '« Concrètement : la famille vous donne trois mots sur le défunt, son métier, une habitude. Vous nous les transmettez en trois minutes. On compose, et vous avez la chanson le lendemain — diffusable en cérémonie, sans droit SACEM, et la famille la garde. Vous, vous conservez 60 % du montant, sans avancer un centime. »',
      points: [
        'Trois chiffres et rien d\'autre : trois minutes, vingt-quatre heures, soixante pour cent.',
        'Ne parlez jamais de la technologie. Ni « intelligence artificielle », ni « générée ». On vend une chanson écrite pour quelqu\'un.',
        'Si on vous pose la question de front, répondez sans détour — voir les objections.'
      ]
    },
    {
      titre: 'La preuve',
      duree: '3 minutes',
      dire: '« Le plus simple, c\'est d\'écouter. Je vous en fais entendre une ? C\'est un pêcheur de Loire, sa fille nous avait donné trois mots : patient, taquin, silencieux. »',
      points: [
        'Vous annoncez les trois mots AVANT de lancer. C\'est ce qui rend le résultat saisissant.',
        'Vous lancez, et vous ne dites plus rien. Pas un commentaire pendant l\'écoute.',
        'À la fin, vous ne demandez pas « alors ? ». Vous laissez le silence — c\'est à eux de parler.',
        'Au téléphone, laissez plutôt écouter depuis le site : « Je vous envoie le lien, écoutez-le et je vous rappelle jeudi. »'
      ]
    },
    {
      titre: 'L\'engagement',
      duree: '30 secondes',
      dire: '« Je vous propose une chose simple : on vous compose le premier hommage gratuitement. À votre prochaine famille qui vous semble réceptive, vous posez les cinq questions, vous me les envoyez, et vous leur présentez le résultat. Si ça ne touche pas, on en reste là et vous ne me devez rien. »',
      points: [
        'L\'offre gratuite n\'est pas un cadeau : c\'est ce qui rend le « non » difficile à formuler.',
        'Demandez un engagement précis : « Vous pensez que ce sera possible d\'ici quinze jours ? »',
        'Notez la date dans la fiche avant de raccrocher.'
      ]
    },
    {
      titre: 'Prendre congé',
      duree: '20 secondes',
      dire: '« Parfait. Je vous envoie tout par mail dans l\'heure, avec les cinq questions. Je vous rappelle [jour précis] pour voir où nous en sommes. Bonne journée [Nom]. »',
      points: [
        'Toujours une date précise, jamais « je vous rappelle bientôt ».',
        'Toujours un mail dans l\'heure. Le modèle « Récapitulatif après entretien » est fait pour ça.',
        'Même sur un non : « Je comprends. Si les choses changent, vous avez mes coordonnées. » Un non aujourd\'hui n\'est pas un non dans six mois.'
      ]
    },
    {
      titre: 'Après avoir raccroché',
      duree: '2 minutes',
      points: [
        'Notez dans la fiche ce qui s\'est dit, avec leurs mots à eux — pas un résumé.',
        'Mettez le statut à jour et fixez la date de prochaine action.',
        'Envoyez le mail promis maintenant, pas ce soir.'
      ],
      note: 'Une fiche non renseignée est une fiche perdue. Dans trois semaines vous ne vous souviendrez de rien.'
    }
  ];

  /* ═══════════════════════════════════════════════════════════
     OBJECTIONS
     Chacune dit ce qu'elle cache vraiment, la réponse, puis une
     question pour rendre la main. On ne gagne jamais une objection
     en argumentant plus fort : on la gagne en reprenant la parole.
     ═══════════════════════════════════════════════════════════ */
  var OBJECTIONS = [
    {
      objection: 'C\'est cher.',
      cache: 'Ils n\'ont pas encore vu la valeur. Le prix n\'est jamais le vrai sujet à ce stade.',
      reponse: 'Un budget d\'obsèques se compte en milliers d\'euros. Notre première offre est à 149 €, dont 89 € vous reviennent. Sur l\'ensemble, c\'est marginal — et c\'est le seul élément que la famille gardera dans dix ans.',
      relance: 'Sur vos dernières cérémonies, qu\'est-ce que les familles ont emporté avec elles ?'
    },
    {
      objection: 'Les familles ne voudront pas.',
      cache: 'Ils craignent de heurter. C\'est un métier de tact, la crainte est légitime.',
      reponse: 'Vous avez raison de ne pas le proposer à tout le monde. Ne le proposez qu\'aux familles qui parlent du défunt avec des détails — celles qui racontent ses manies, ses phrases. Celles-là disent oui presque toujours. Les autres, laissez-les tranquilles.',
      relance: 'Sur dix familles, combien vous parlent vraiment de la personne ?'
    },
    {
      objection: 'Je n\'ai pas le temps.',
      cache: 'Ils imaginent un dispositif à mettre en place. Ils pensent formation, logiciel, procédure.',
      reponse: 'Trente secondes pour en parler en rendez-vous, trois minutes pour nous transmettre les réponses. Il n\'y a rien à installer, rien à apprendre, rien à stocker. Nous faisons tout le reste.',
      relance: 'Vous avez trois minutes à me consacrer maintenant ? Je vous montre exactement ce que ça donne.'
    },
    {
      objection: 'C\'est de l\'intelligence artificielle ? Ça va être froid.',
      cache: 'La vraie question : est-ce que ça va sonner faux devant une famille en deuil ?',
      reponse: 'La composition s\'appuie sur des outils de création musicale assistée, et je ne vous le cacherai pas. Mais rien ne part sans être relu, corrigé et écouté par un humain — le texte, la mélodie, le mixage. Et surtout : les mots viennent de la famille, pas de la machine. Écoutez-en une et dites-moi si c\'est froid.',
      relance: 'Je vous en fais écouter une maintenant ?'
    },
    {
      objection: 'On travaille déjà avec quelqu\'un pour la musique.',
      cache: 'Souvent : un organiste, un fichier acheté, une playlist. Ce n\'est pas le même service.',
      reponse: 'Nous ne remplaçons personne. Un musicien joue une œuvre qui existe déjà ; nous en écrivons une qui n\'existait pas, pour cette personne-là. Les deux se complètent très bien dans une même cérémonie.',
      relance: 'Votre prestataire actuel, il peut composer sur mesure en vingt-quatre heures ?'
    },
    {
      objection: 'Envoyez-moi une documentation.',
      cache: 'Neuf fois sur dix, c\'est une façon polie de raccrocher.',
      reponse: 'Bien sûr, je vous envoie ça tout de suite. Mais une plaquette ne rendra pas ce que fait une chanson : je vous mets surtout un lien pour en écouter une, ça prend trois minutes.',
      relance: 'Je vous rappelle jeudi en fin de matinée pour savoir ce que vous en avez pensé, ça vous va ?'
    },
    {
      objection: 'Je dois en parler à mon associé / à ma direction.',
      cache: 'Soit c\'est vrai, soit c\'est un refus déguisé. Il faut savoir lequel.',
      reponse: 'Bien sûr. Pour que vous puissiez lui présenter les choses, je vous envoie un récapitulatif d\'une page : le principe, vos conditions, et un lien d\'écoute.',
      relance: 'À votre avis, qu\'est-ce qui le fera hésiter en premier ? Autant que je vous donne la réponse tout de suite.'
    },
    {
      objection: 'Ça ne se fait pas. C\'est déplacé.',
      cache: 'Une conception exigeante du métier. À respecter, pas à combattre.',
      reponse: 'Je comprends, et c\'est une position que je respecte. Nous ne cherchons pas à égayer une cérémonie : nous cherchons à ce que la musique parle enfin de la personne qu\'on enterre, au lieu d\'être empruntée à quelqu\'un d\'autre. Si après écoute vous trouvez cela déplacé, vous aurez eu raison de me le dire.',
      relance: 'Vous m\'accordez trois minutes d\'écoute avant de trancher ?'
    },
    {
      objection: 'Et si la famille n\'aime pas ?',
      cache: 'La peur d\'engager sa réputation. C\'est leur nom sur la cérémonie.',
      reponse: 'Nous reprenons la composition. Une révision est comprise dès l\'offre à 299 €, et elles sont illimitées sur l\'offre Mémorial. Et vous présentez toujours la chanson à la famille avant la cérémonie — jamais de découverte le jour même.',
      relance: 'Ce qui vous inquiète, c\'est le résultat, ou le fait de devoir le défendre devant la famille ?'
    },
    {
      objection: 'Vingt-quatre heures, vraiment ?',
      cache: 'Ils testent votre sérieux. C\'est bon signe : ils se projettent.',
      reponse: 'Vingt-quatre heures à partir du moment où nous avons les réponses, pas de la commande. Et si la cérémonie est très proche, nous livrons en six heures — c\'est compris dans l\'offre Mémorial, et disponible en priorité sur les autres.',
      relance: 'Vos délais à vous, entre le premier rendez-vous et la cérémonie, c\'est combien en général ?'
    },
    {
      objection: 'Qui écrit les paroles ?',
      cache: 'Ils veulent savoir si c\'est sérieux, et si la famille sera respectée.',
      reponse: 'Les paroles sont écrites à partir des mots exacts de la famille, puis relues et corrigées à la main. Rien n\'est inventé sur la personne : si la famille dit qu\'il pêchait, la chanson parle de pêche. Sur la page Écouter, chaque hommage affiche les trois mots de départ à côté du résultat — vous voyez le chemin.',
      relance: 'Regardez la fiche de Maurice, vous verrez exactement ce que la famille avait donné.'
    },
    {
      objection: 'Combien vous en avez déjà fait ?',
      cache: 'Ils cherchent à savoir s\'ils sont vos cobayes.',
      reponse: 'Nous sommes une jeune maison, je ne vais pas vous raconter d\'histoires. C\'est précisément pour cela que la première composition est offerte : vous ne prenez aucun risque, et vous jugez sur le résultat, pas sur nos références.',
      relance: 'Qu\'est-ce qu\'il vous faudrait pour essayer une fois ?'
    }
  ];

  /* ═══════════════════════════════════════════════════════════
     PLAN DE PROSPECTION
     ═══════════════════════════════════════════════════════════ */
  var PLAN = {
    cibles: [
      {
        titre: 'Maisons indépendantes, 1 à 3 agences',
        pourquoi: 'Le dirigeant décide seul et peut dire oui pendant l\'appel. C\'est là que se font les premiers partenariats.',
        priorite: 'Priorité absolue'
      },
      {
        titre: 'Petits groupes régionaux, 4 à 15 agences',
        pourquoi: 'Une décision plus lente, mais un oui vaut plusieurs agences d\'un coup. Visez le directeur, pas le conseiller.',
        priorite: 'Deuxième vague'
      },
      {
        titre: 'Enseignes nationales',
        pourquoi: 'La décision se prend au siège, jamais au comptoir. À garder pour quand vous aurez des références solides à montrer.',
        priorite: 'Plus tard'
      },
      {
        titre: 'Crématoriums et chambres funéraires',
        pourquoi: 'Ils voient passer les familles de plusieurs agences. Un partenaire prescripteur y vaut trois agences.',
        priorite: 'À tester'
      }
    ],
    sequence: [
      { jour: 'Jour 0', action: 'Courriel de premier contact', detail: 'Le matin, entre 8 h et 10 h. Modèle « Premier contact ».' },
      { jour: 'Jour 2', action: 'Appel téléphonique', detail: 'On n\'appelle jamais à froid : le courriel est déjà passé. « Je vous ai écrit mardi… »' },
      { jour: 'Jour 2', action: 'Courriel dans l\'heure', detail: 'Si l\'appel a abouti : « Récapitulatif après entretien ». Sinon : « Après un appel manqué ».' },
      { jour: 'Jour 7', action: 'Relance, une seule fois', detail: 'Modèle « Relance ». On ne relance jamais deux fois.' },
      { jour: 'Jour 21', action: 'Dernier appel', detail: 'Court, sans insister. Si c\'est non, on le note et on passe à autre chose.' },
      { jour: 'Mois 4', action: 'Réactivation', detail: 'Uniquement sur les « pas maintenant ». Jamais sur un refus net.' }
    ],
    rythme: [
      'Vingt fiches nouvelles ajoutées au portefeuille chaque semaine.',
      'Quinze appels par jour, sur deux créneaux : 9 h 30 – 11 h 30 et 14 h – 16 h.',
      'Le lundi matin : on met les fiches à jour et on planifie la semaine. On n\'appelle pas.',
      'Le vendredi après-midi : on écrit les relances de la semaine suivante.',
      'Une fiche sans date de prochaine action est une fiche morte : il ne doit jamais y en avoir.'
    ],
    signaux: [
      'Ils posent une question sur le prix ou sur les délais.',
      'Ils demandent comment ça se passe concrètement avec la famille.',
      'Ils parlent d\'une famille précise, au passé ou au futur.',
      'Ils vous demandent de rappeler à un moment précis.',
      'Ils veulent savoir ce que font leurs confrères.'
    ],
    interdits: [
      'Insister après un refus net. Une agence lassée est perdue pour toujours.',
      'Relancer plus d\'une fois sans réponse.',
      'Promettre un volume ou un chiffre d\'affaires. Nous vendons une différenciation, pas une garantie.',
      'Parler de technologie avant qu\'on vous le demande.',
      'Contacter une agence qui a répondu STOP. C\'est illégal, et la console vous en empêchera.',
      'Envoyer un courriel le dimanche ou après 19 h.'
    ]
  };

  /* Chiffres à connaître par cœur — les seuls à citer */
  var CHIFFRES = [
    ['Part reversée à l\'agence', '60 %'],
    ['Sur l\'offre Essentiel — 149 €', '89 € nets'],
    ['Sur l\'offre Prestige — 299 €', '179 € nets'],
    ['Sur l\'offre Mémorial — 499 €', '299 € nets'],
    ['Investissement demandé', 'Aucun'],
    ['Délai de livraison', '24 heures'],
    ['Livraison en urgence', '6 heures'],
    ['Droits SACEM', 'Aucun'],
    ['Première composition', 'Offerte'],
    ['Temps de brief pour l\'agence', '3 minutes']
  ];

  /* Les cinq questions du brief — à savoir réciter */
  var BRIEF = [
    'Son prénom, son âge, et le lien avec ceux qui restent.',
    'Trois traits de caractère, en un mot chacun.',
    'Son métier, ou la passion qui a compté dans sa vie.',
    'Une habitude que tout le monde lui connaissait.',
    'Une anecdote, si la famille veut bien la confier.'
  ];

  window.MELODIA_VENTE = {
    SITE: SITE,
    MODELES: MODELES,
    SCRIPT: SCRIPT,
    OBJECTIONS: OBJECTIONS,
    PLAN: PLAN,
    CHIFFRES: CHIFFRES,
    BRIEF: BRIEF
  };
})();
