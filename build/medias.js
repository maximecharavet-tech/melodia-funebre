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
    largeur: 1264, hauteur: 720, duree: 10,
    audience: 'mixte',
    titre: 'L’atelier, dix secondes',
    legende: 'La caméra traverse la salle de composition, puis s’arrête sur deux personnes penchées sur le même écran. Muette : elle se passe partout, y compris sur un écran d’accueil.',
    usage: 'Réseaux sociaux, écran d’accueil en agence, message à un prospect.'
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
  ['Des mélodies qui restent, au-delà du temps (Antilles)', 'famille'],
  ['La musique pour l’éternité', 'famille']
];

const parId = (id) => MEDIAS.find((m) => m.id === id) || null;
const parAudience = (a) => MEDIAS.filter((m) => m.audience === a);
const videos = () => MEDIAS.filter((m) => m.type === 'video');
const affiches = () => MEDIAS.filter((m) => m.type === 'affiche');

module.exports = { DOSSIER, AUDIENCES, MEDIAS, ATTENDUS, parId, parAudience, videos, affiches };
