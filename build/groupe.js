/* ═══════════════════════════════════════════════════════════════
   LE GROUPE

   Melodia Funèbre est l'une des quatre maisons de Hyper A.I Engine.
   Deux pages le disent — « qui sommes-nous » et la page de Hyper — et
   un texte recopié à deux endroits finit toujours par diverger. Il est
   donc ici, une fois.
   ═══════════════════════════════════════════════════════════════ */

/* Les quatre autres maisons du groupe, décrites avec les mots de la
   planche fournie par le fondateur. Rien n'est reformulé ni enjolivé :
   ce sont des sociétés réelles, et une description inventée sur une
   page « qui sommes-nous » se vérifie en un clic.

   Aucune adresse web n'est posée ici : seule authenticseal.ai figure
   sur la planche, et envoyer des familles vers un site que la maison
   n'a pas vérifié serait léger. Le fondateur donnera les liens. */
const MAISONS = [
  {
    id: 'vigie-orbitale', nom: 'Vigie Orbitale', haut: 640,
    quoi: 'Surveillance orbitale et intelligence spatiale pour la sécurité des territoires et des infrastructures.',
    alt: 'Emblème de Vigie Orbitale : un globe terrestre sombre ceint d’un anneau d’acier et d’une traînée orange, un satellite en orbite.'
  },
  {
    id: 'authenticseal', nom: 'AuthenticSeal AI', haut: 640,
    quoi: 'Certification et authentification par l’IA, pour la vérification sécurisée des données et des systèmes.',
    alt: 'Sceau d’AuthenticSeal AI : un médaillon circuit imprimé bleu et or portant une empreinte digitale stylisée et le mot « Certified ».'
  },
  {
    id: 'ziggy', nom: 'Ziggy', haut: 640,
    quoi: 'IA ludique et éducative, pour accompagner les enfants dans leurs découvertes.',
    alt: 'Emblème de Ziggy gravé dans l’or : un petit robot souriant entouré d’orbites, un cœur-circuit au centre.'
  },
  {
    id: 'melodia', nom: 'Melodia Funèbre', haut: 640,
    quoi: 'Accompagnement musical et mémoriel — la maison dont vous lisez le site.',
    alt: 'Emblème de Melodia Funèbre : les initiales MF en or dans un anneau, une colombe, une clé de sol et une portée.'
  }
];

/* ─── Les films ───
   Trois des quatre maisons ont le leur : un emblème animé, avec du son.
   Le champ « film » est facultatif — une maison qui n'en a pas garde sa
   seule vignette, et la page n'affiche que celles qui en ont une. Le
   jour où le quatrième arrive, il suffit de l'ajouter ici.

   « duree » sert à l'annoncer avant qu'on clique : personne n'ouvre
   une vidéo sans savoir combien de temps elle prend. « carre » dit si
   le film remplit le cadre ou s'il y laisse des bandes : Ziggy est
   vertical, les deux autres sont carrés, et le cadre commun est carré
   pour que les trois s'alignent.

   Tous portent du son : ils ne se lancent donc JAMAIS tout seuls. Rien
   ne se télécharge avant que quelqu'un appuie sur lecture. */
const FILMS = {
  'vigie-orbitale': { duree: 10, carre: true },
  'authenticseal':  { duree: 15, carre: true },
  'ziggy':          { duree: 25, carre: false }
};

/* Les maisons qui ont un film, dans l'ordre de MAISONS. */
const avecFilm = () => MAISONS.filter((m) => FILMS[m.id]).map((m) => ({ ...m, film: FILMS[m.id] }));

module.exports = { MAISONS, FILMS, avecFilm };
