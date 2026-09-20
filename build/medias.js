/* ═══════════════════════════════════════════════════════════════
   LA MÉDIATHÈQUE DE CAMPAGNE

   Le dépôt contenait déjà quatre affiches, dans assets/img/campagne/.
   Elles ne servaient qu'à une chose : faire le fond des pages de la
   brochure PDF. Personne ne pouvait les voir sur le site, ni les
   récupérer, ni savoir qu'elles existaient — pas même le fondateur.

   Ce fichier est la déclaration unique de ces pièces : un objet par
   média, avec son fichier, ses dimensions, à qui il s'adresse et à
   quoi il sert. Les pages s'y réfèrent, scripts/check.js vérifie que
   chaque fichier déclaré existe réellement et qu'aucun ne dépasse le
   budget de poids.

   POURQUOI UNE DÉCLARATION PLUTÔT QU'UNE LECTURE DU DOSSIER

   Parce qu'un fichier posé dans un dossier ne dit pas à qui il
   s'adresse. « affiche-partenaire.jpg » vise une agence funéraire,
   « souvenirs-ukulele.jpg » vise une famille : les afficher côte à
   côte sans le dire serait une erreur commerciale. L'audience est
   donc une donnée, pas une supposition.

   AJOUTER UNE PIÈCE

   Déposer le fichier dans assets/img/campagne/, ajouter son entrée
   ici, relancer « npm run pages ». Le contrôle refusera la
   génération si le fichier manque.
   ═══════════════════════════════════════════════════════════════ */

const DOSSIER = 'assets/img/campagne/';

/* TROIS FICHIERS POUR UNE MÊME AFFICHE, ET POURQUOI

   « fichier » est la pièce d'origine, celle que le kit fait
   télécharger : c'est elle qu'on envoie à un imprimeur, et un JPEG
   s'ouvre partout.

   « web » et « leger » sont les deux versions servies DANS les pages.
   La distinction n'est pas cosmétique : sur un téléphone à double
   densité — c'est-à-dire à peu près tous — le navigateur allait
   chercher le JPEG d'origine, 208 Ko pour un bloc de 362 pixels de
   large. En WebP, la même image à la même taille en fait 108. Une
   famille qui lit une page depuis une salle d'attente paie la
   différence.

   Sans « web », la page retombe sur « fichier ». */

/* Les audiences, nommées une fois. Elles commandent l'étiquette
   affichée sur la vignette et l'ordre du kit. */
const AUDIENCES = {
  pro: 'Pour les professionnels',
  famille: 'Pour les familles',
  mixte: 'Tous publics'
};

const MEDIAS = [
  {
    id: 'violoncelliste',
    type: 'video',
    fichier: 'violoncelliste.mp4',
    /* Deux encodages du même plan. Le WebM (VP9) pèse 2,8 Mo contre
       5,7 : les navigateurs qui savent le lire — Chrome, Firefox,
       Edge, Safari 14 et au-delà — téléchargent moitié moins. Le MP4
       reste en second, pour tous les autres. À l'écran, les deux sont
       indiscernables : comparés image par image à 484 px de large. */
    leger: 'violoncelliste.webm',
    affiche: 'violoncelliste.jpg',      /* l'image d'attente */
    afficheLegere: 'violoncelliste-affiche-480.webp',
    largeur: 484, hauteur: 850, duree: 30,
    audience: 'mixte',
    titre: 'La violoncelliste',
    legende: 'Trente secondes, format vertical. Une violoncelliste dans une nef, à la bougie. Pensé pour Instagram, TikTok et WhatsApp.',
    usage: 'Réseaux sociaux, message à un prospect, écran d’accueil en agence.'
  },
  {
    id: 'atelier',
    type: 'video',
    /* Le MP4 reste le fichier principal — c'est lui que Safari lit —
       mais le WebM passe en premier dans la page : 1084 Ko contre 1229,
       et les deux sont indiscernables, comparés image par image à
       1264 px de large sur le plan le plus détaillé. */
    fichier: 'atelier.mp4',
    leger: 'atelier.webm',
    affiche: 'atelier.jpg',
    afficheLegere: 'atelier-affiche-480.webp',
    largeur: 1264, hauteur: 720, duree: 10,
    audience: 'mixte',
    titre: 'L’atelier, dix secondes',
    legende: 'La caméra traverse la salle de composition, puis s’arrête sur deux personnes penchées sur le même écran. Muette : elle se passe partout, y compris sur un écran d’accueil.',
    usage: 'Réseaux sociaux, écran d’accueil en agence, message à un prospect.'
  },
  {
    id: 'ame-des-souvenirs',
    type: 'video',
    fichier: 'ame-des-souvenirs.mp4',
    leger: 'ame-des-souvenirs.webm',
    affiche: 'ame-des-souvenirs.webp',
    afficheLegere: 'ame-des-souvenirs-affiche-480.webp',
    largeur: 484, hauteur: 850, duree: 15,
    audience: 'mixte',
    /* Un WebM ET un MP4, le WebM en premier. Mon premier essai — VP9
       à crf 36 — donnait 1 417 Ko contre 1 219 pour le MP4, et j'en
       avais conclu trop vite qu'il fallait s'en passer. Le réglage
       était simplement trop prudent : à crf 42, le WebM tombe à
       965 Ko pour 37,6 dB par rapport au MP4 servi — plus léger ET
       meilleur à poids égal. Le MP4 reste en second : c'est lui que
       lit Safari. */
    titre: 'La musique donne une âme à nos souvenirs',
    legende: 'Quinze secondes, format vertical. L’affiche cubiste mise en mouvement : un pianiste, une colombe, la lumière qui tourne sur l’or. Même univers que l’affiche fixe, mais elle retient l’œil dans un fil d’actualité.',
    usage: 'Instagram, TikTok, WhatsApp, écran d’accueil en agence.'
  },
  {
    id: 'emotions-qui-traversent',
    type: 'video',
    fichier: 'emotions-qui-traversent.mp4',
    leger: 'emotions-qui-traversent.webm',
    affiche: 'emotions-qui-traversent.webp',
    afficheLegere: 'emotions-qui-traversent-affiche-480.webp',
    largeur: 484, hauteur: 850, duree: 22,
    audience: 'famille',
    titre: 'Des émotions qui traversent le temps',
    legende: 'Vingt-deux secondes. Un violoncelliste au bord de l’eau, des bougies, un portrait encadré posé contre la pierre. La plus longue des trois vidéos, et la plus lente : à réserver aux endroits où l’on regarde vraiment.',
    usage: 'Page de partage, courriel aux familles, écran d’attente en salle.'
  },
  {
    id: 'devenez-partenaire',
    type: 'affiche',
    fichier: 'affiche-partenaire.jpg',
    largeur: 1024, hauteur: 1536,
    audience: 'pro',
    titre: 'Devenez partenaire',
    legende: 'L’affiche de recrutement du réseau : ce que le service apporte à une agence, en quatre points.',
    usage: 'Salon professionnel, courriel de prospection, réseaux sociaux.'
  },
  {
    id: 'adieux-en-musique',
    type: 'affiche',
    fichier: 'adieux-en-musique.jpg',
    leger: 'adieux-en-musique-480.webp',
    web: 'adieux-en-musique-941.webp',
    largeur: 941, hauteur: 1672,
    audience: 'famille',
    titre: 'Des adieux en musique',
    legende: 'La plus sobre des quatre. Elle ne vend rien, elle nomme ce que la maison fait.',
    usage: 'Vitrine d’agence, présentoir, réseaux sociaux.'
  },
  {
    id: 'certaines-melodies',
    type: 'affiche',
    fichier: 'certaines-melodies.jpg',
    leger: 'certaines-melodies-480.webp',
    web: 'certaines-melodies-941.webp',
    largeur: 941, hauteur: 1672,
    audience: 'famille',
    titre: 'Certaines mélodies ne s’éteignent jamais',
    legende: 'Registre plus lyrique, pour une famille qui découvre l’idée.',
    usage: 'Réseaux sociaux, brochure remise en agence.'
  },
  {
    id: 'bien-plus-quun-souvenir',
    type: 'affiche',
    fichier: 'bien-plus-quun-souvenir.webp',
    largeur: 1024, hauteur: 1536,
    audience: 'pro',
    titre: 'Bien plus qu’un souvenir',
    legende: 'La plus complète des affiches professionnelles : la plaque gravée et son QR en situation, cinq raisons de proposer le service, et les quatre sortes d’établissement à qui il s’adresse.',
    usage: 'Salon professionnel, rendez-vous de présentation, vitrine d’agence, courriel de prospection.'
  },
  {
    id: 'une-vie-en-musique',
    type: 'affiche',
    fichier: 'une-vie-en-musique.webp',
    largeur: 1024, hauteur: 1536,
    audience: 'famille',
    titre: 'Une vie en musique',
    legende: 'Un homme âgé, et sa vie qui remonte en photographies le long d’une portée. Elle s’adresse à qui envisage de composer de son vivant, pas à une famille en deuil.',
    usage: 'Page « De son vivant », réseaux sociaux, présentoir en maison de retraite ou en établissement de soins.'
  },
  {
    id: 'dernier-message',
    type: 'affiche',
    fichier: 'dernier-message.webp',
    largeur: 1024, hauteur: 1536,
    audience: 'famille',
    titre: 'Un dernier message en musique',
    legende: 'La même intention que la précédente, mais prise par les mots plutôt que par les images : ce qu’on voudrait dire, et qu’on ne dira pas deux fois.',
    usage: 'Page « De son vivant », courrier aux familles, réseaux sociaux.'
  },
  {
    id: 'melodies-generations',
    type: 'affiche',
    fichier: 'melodies-generations.webp',
    leger: 'melodies-generations-480.webp',
    largeur: 1024, hauteur: 1536,
    audience: 'famille',
    /* ATTENTION AVANT DE S'EN SERVIR — cette affiche montre des
       musiciens qui jouent, et la page des rites dit, pour le rite
       juif : « Aucune musique pour l'enterrement lui-même : ce n'est
       pas notre place. » La scène ne contredit la maison que si on la
       présente comme un enterrement. Elle est juste pour une azkara,
       un dévoilement de stèle ou un hommage civil — les temps de
       mémoire que la maison sert effectivement, avec l'accord du
       rabbin. C'est pourquoi la légende le dit, et c'est pourquoi
       l'affiche n'est pas posée sur la page des rites. */
    titre: 'Des mélodies qui relient les générations',
    legende: 'Pour les temps de mémoire des communautés juives — azkara, dévoilement de stèle, hommage civil — et non pour l’enterrement, qui ne comporte pas de musique. À ne diffuser qu’avec cette précision.',
    usage: 'Présentation à une communauté, courriel à un officiant, après accord du rabbin.'
  },
  {
    id: 'emotion-eternelle',
    type: 'affiche',
    fichier: 'emotion-eternelle.webp',
    leger: 'emotion-eternelle-480.webp',
    largeur: 1024, hauteur: 1536,
    audience: 'pro',
    titre: 'Offrez plus qu’une émotion éternelle',
    legende: 'Elle figurait depuis des semaines dans la liste des pièces annoncées et jamais reçues. La plaque gravée au soleil couchant, cinq raisons de proposer le service, et les cinq sortes d’établissement à qui il s’adresse.',
    usage: 'Salon professionnel, rendez-vous de présentation, courriel de prospection.'
  },
  {
    id: 'plaque-et-telephone',
    type: 'affiche',
    fichier: 'plaque-et-telephone.webp',
    leger: 'plaque-et-telephone-480.webp',
    largeur: 941, hauteur: 1672,
    audience: 'famille',
    titre: 'Plus qu’un souvenir, une mélodie éternelle',
    legende: 'La seule affiche qui montre le geste complet : la plaque, le téléphone, et ce qu’on entend une fois le QR scanné. Elle explique le service sans une ligne de mode d’emploi.',
    usage: 'Page du QR mémorial, vitrine d’agence, réseaux sociaux.'
  },
  {
    id: 'salon-tourne-disque',
    type: 'affiche',
    fichier: 'salon-tourne-disque.webp',
    leger: 'salon-tourne-disque-480.webp',
    largeur: 1024, hauteur: 1536,
    audience: 'famille',
    /* Le pendant masculin de « dernier-message », qui montre une dame.
       Les deux portent le même titre à un mot près et tiennent la même
       page « De son vivant » : c'est voulu, on ne s'adresse pas à un
       homme de quatre-vingts ans avec l'image d'une femme de
       quatre-vingts ans, et réciproquement. Les proposer côte à côte
       laisse le choix à qui diffuse. */
    titre: 'Un dernier message en musique',
    legende: 'Un homme seul dans son salon, sa vie qui remonte en photographies le long d’une portée, un tourne-disque. Elle s’adresse à qui compose de son vivant, pas à une famille en deuil.',
    usage: 'Page « De son vivant », présentoir en maison de retraite, courrier de prévoyance.'
  },
  {
    id: 'chaque-vie-sa-melodie',
    type: 'affiche',
    fichier: 'chaque-vie-sa-melodie.webp',
    leger: 'chaque-vie-sa-melodie-480.webp',
    largeur: 941, hauteur: 1672,
    audience: 'mixte',
    titre: 'Parce que chaque vie mérite sa mélodie',
    legende: 'La plus dépouillée de toutes : une pianiste, une baie ouverte, rien à vendre. C’est celle qui passe partout, y compris là où une plaque gravée serait déplacée.',
    usage: 'Première prise de contact, réseaux sociaux, écran d’accueil en agence.'
  },
  {
    id: 'racines-antillaises',
    type: 'affiche',
    fichier: 'racines-antillaises.webp',
    leger: 'racines-antillaises-480.webp',
    web: 'racines-antillaises-768.webp',
    largeur: 1024, hauteur: 1536,
    audience: 'famille',
    /* La seule affiche de la médiathèque qui nomme des genres
       précis — zouk, gwoka, bèlè. Trois des vingt registres du
       catalogue, donc trois promesses vérifiables et non un décor. */
    titre: 'Des mélodies aux couleurs de nos racines',
    legende: 'Une chanteuse, un très, un tambour, un portrait posé près d’une bougie. Elle répond à une demande que la médiathèque n’avait pas : une famille antillaise ne se reconnaît pas dans un piano à queue au bord d’un lac.',
    usage: 'Familles antillaises ici et aux Antilles, agences d’outre-mer, réseaux sociaux.'
  },
  {
    id: 'memoire-autrement',
    type: 'affiche',
    fichier: 'memoire-autrement.webp',
    leger: 'memoire-autrement-480.webp',
    web: 'memoire-autrement-768.webp',
    largeur: 1024, hauteur: 1536,
    audience: 'famille',
    titre: 'Faire vivre la mémoire autrement',
    legende: 'La plaque gravée et son QR, mais dessinés plutôt que photographiés : le visage, les photographies qui remontent le long d’une portée, la mémoire qui continue. Pour dire le service à qui ne l’a jamais vu.',
    usage: 'Première prise de contact, réseaux sociaux, présentoir en agence.'
  },
  {
    id: 'souvenirs-en-harmonie',
    type: 'affiche',
    fichier: 'souvenirs-en-harmonie.webp',
    leger: 'souvenirs-en-harmonie-480.webp',
    web: 'souvenirs-en-harmonie-768.webp',
    largeur: 941, hauteur: 1672,
    audience: 'mixte',
    /* ATTENTION — c'est la seule affiche de la médiathèque où UN
       CERCUEIL est visible, au premier plan. Elle est juste pour une
       page qui parle déjà de cérémonie, et déplacée partout où le
       lecteur n'en est pas encore là — une première visite, un
       courriel de prospection, une page « de son vivant ». */
    titre: 'Des souvenirs en harmonie',
    legende: 'Traitement cubiste, or et ardoise. Un cercueil y figure au premier plan : à réserver aux pages et aux moments où la cérémonie est déjà le sujet.',
    usage: 'Page de cérémonie, rendez-vous en agence. Pas en première approche.'
  },
  {
    id: 'ce-que-les-mots',
    type: 'affiche',
    fichier: 'ce-que-les-mots.webp',
    leger: 'ce-que-les-mots-480.webp',
    largeur: 941, hauteur: 1672,
    audience: 'famille',
    titre: 'Ce que les mots ne suffisent pas à exprimer',
    legende: 'La seule qui pose une question au lieu d’affirmer. C’est exactement l’état de quelqu’un qui doit parler à une assemblée dans trois jours et ne sait pas par où commencer.',
    usage: 'Réseaux sociaux, courrier aux familles, page d’accueil d’une campagne.'
  },
  {
    id: 'melodie-pour-toujours',
    type: 'affiche',
    fichier: 'melodie-pour-toujours.webp',
    leger: 'melodie-pour-toujours-480.webp',
    largeur: 941, hauteur: 1671,
    audience: 'famille',
    /* ATTENTION — un homme âgé monte un escalier de touches de piano
       vers la lumière. C'est une image d'au-delà, lisible comme telle.
       Elle parle à qui la partage, et peut heurter qui ne partage pas
       cette représentation. Jamais sur la page des rites, qui sert des
       familles de plusieurs confessions. */
    titre: 'Plus qu’une cérémonie, une mélodie pour toujours',
    legende: 'Une pianiste, et un escalier de touches qui monte vers la lumière. Image d’au-delà assumée : elle touche qui s’y reconnaît, et n’est pas neutre pour les autres.',
    usage: 'Cérémonies religieuses ou spirituelles, réseaux sociaux. À éviter en contexte interconfessionnel.'
  },
  {
    id: 'duo-au-piano',
    type: 'affiche',
    fichier: 'duo-au-piano.webp',
    leger: 'duo-au-piano-480.webp',
    largeur: 941, hauteur: 1672,
    audience: 'mixte',
    titre: 'La musique donne une autre dimension au souvenir',
    legende: 'Deux interprètes, un piano, une voix. C’est la seule qui montre la prestation elle-même plutôt que son effet — utile quand l’interlocuteur demande « concrètement, ça donne quoi ? ».',
    usage: 'Rendez-vous de présentation, écran d’accueil, réseaux sociaux.'
  },
  {
    id: 'belle-note-finale',
    type: 'affiche',
    fichier: 'belle-note-finale.webp',
    leger: 'belle-note-finale-480.webp',
    largeur: 941, hauteur: 1672,
    audience: 'famille',
    titre: 'Une belle note finale',
    legende: 'La plus sobre du nouveau lot : une partition tenue à la main, rien d’autre. Elle ne montre ni plaque, ni cercueil, ni escalier — elle passe donc là où les autres ne passent pas.',
    usage: 'Partout, y compris en première approche et en contexte interconfessionnel.'
  },
  {
    id: 'poignee-de-main',
    type: 'affiche',
    fichier: 'poignee-de-main.webp',
    leger: 'poignee-de-main-480.webp',
    largeur: 1070, hauteur: 1470,
    audience: 'pro',
    /* La seule pièce de la médiathèque qui montre deux professionnels
       en train de s'entendre, plutôt qu'un service à vendre. C'est
       aussi la seule au format presque A4, là où toutes les autres
       sont en 2/3 ou en 9/16. */
    titre: 'Devenez partenaire agence',
    legende: 'Un accord qui se conclut dans un hall d’agence. Elle ne décrit aucune prestation : elle s’adresse au directeur qui se demande à qui il confierait ses familles.',
    usage: 'Salon professionnel, courriel de prospection, première page d’un dossier partenaire.'
  },
  {
    id: 'souvenirs-ukulele',
    type: 'affiche',
    fichier: 'souvenirs-ukulele.jpg',
    leger: 'souvenirs-ukulele-480.webp',
    web: 'souvenirs-ukulele-941.webp',
    largeur: 941, hauteur: 1672,
    audience: 'famille',
    titre: 'Des mélodies qui restent',
    legende: 'Une scène jouée, plutôt qu’un objet : l’hommage rendu par quelqu’un.',
    usage: 'Réseaux sociaux, courrier aux familles.'
  }
];

/* Les pièces annoncées mais pas encore reçues. Elles sont nommées ici
   pour que le manque soit VISIBLE plutôt qu'oublié : la section du
   site n'en montre rien, et le fondateur sait ce qu'il reste à
   déposer. Le contrôle ne les exige pas — ce sont des trous connus. */
const ATTENDUS = [
  ['Un service additionnel qui vous démarque', 'pro'],
  ['Ensemble, donnons une voix aux souvenirs', 'pro'],
  ['La musique pour l’éternité', 'famille']
];

const parId = (id) => MEDIAS.find((m) => m.id === id) || null;
const parAudience = (a) => MEDIAS.filter((m) => m.audience === a);
const videos = () => MEDIAS.filter((m) => m.type === 'video');
const affiches = () => MEDIAS.filter((m) => m.type === 'affiche');

module.exports = { DOSSIER, AUDIENCES, MEDIAS, ATTENDUS, parId, parAudience, videos, affiches };
