/* Contenu partagé : offres, témoignages, FAQ, styles */
const OFFERS = [
  { name: 'Essentiel', price: 149, desc: "L'hommage sobre et juste, pour l'essentiel du souvenir.",
    feats: ['Une œuvre originale de 2 à 3 minutes', 'Entretien téléphonique de 5 minutes', 'Paroles biographiques uniques', 'Livraison sous 24 heures', 'Fichier MP3 320 kbps', "Droits d'usage à vie"],
    muted: ['Une seule version', 'Sans révision incluse'] },
  { name: 'Prestige', price: 299, featured: true, tag: 'Le plus choisi',
    desc: "L'hommage complet : plus de choix, plus de sérénité.",
    feats: ['Tout ce que comprend Essentiel', 'Deux versions au choix', 'Une révision offerte', 'Version instrumentale seule', 'Paroles imprimables en PDF', 'Fichier WAV sans perte sur demande'], muted: [] },
  { name: 'Mémorial', price: 499, desc: "L'héritage sonore complet, transmis aux générations.",
    feats: ['Tout ce que comprend Prestige', 'Mini-album de trois titres', 'Révisions illimitées', 'Livret souvenir imprimé', 'Priorité urgence 6 heures incluse', 'Accompagnement dédié du fondateur'], muted: [] }
];

const TESTIS = [
  { t: "Quand la chanson de papa a commencé, toute la salle s'est mise à sourire à travers les larmes. Personne ne s'y attendait. C'était lui, c'était exactement lui.", w: 'Claire B. — fille de Maurice, Nantes' },
  { t: "En trente ans de métier, je n'avais jamais vu une famille redemander la musique trois fois après la cérémonie. Depuis, je le propose à chaque premier rendez-vous.", w: "Directeur d'agence de pompes funèbres — Lyon" },
  { t: "Le jardin, le jasmin, ses mains dans la terre : tout y était. Nous l'avons fait écouter à ses arrière-petits-enfants. Nous la gardons comme un trésor de famille.", w: 'Famille de Monique — Avignon' },
  { t: "J'ai appelé un mardi soir, la cérémonie était le jeudi matin. La chanson est arrivée le mercredi à midi. Je ne sais toujours pas comment ils ont fait.", w: 'Thomas R. — fils de Sergio, Marseille' }
];

const FAQ = [
  { q: "Combien de temps faut-il vraiment pour recevoir l'hommage ?",
    a: "Vingt-quatre heures à compter de l'entretien téléphonique, et non de la commande. En cas de cérémonie imminente, notre priorité six heures permet une livraison le jour même : demandez à être rappelé en cochant l'urgence, nous répondons sept jours sur sept." },
  { q: "Faut-il payer des droits SACEM pour diffuser la chanson ?",
    a: "Non, et c'est une différence importante. Chaque œuvre est composée spécialement pour vous et vous est cédée avec ses droits d'usage. Vous pouvez la diffuser en cérémonie, la copier pour la famille, la conserver et la transmettre, sans aucune déclaration ni redevance." },
  { q: "Que se passe-t-il si la chanson ne nous touche pas ?",
    a: "Nous la reprenons. L'offre Prestige comprend une révision, l'offre Mémorial des révisions illimitées. Sur l'offre Essentiel, une révision est facturée 49 €. À ce jour, aucune famille n'est repartie avec une œuvre qu'elle ne souhaitait pas diffuser." },
  { q: "Quelles informations devons-nous fournir ?",
    a: "Très peu, et rien de difficile : le prénom du défunt, trois traits de caractère, son métier ou sa passion, une habitude quotidienne, et si vous le souhaitez une anecdote. Cinq minutes suffisent. Nous posons les questions, vous n'avez rien à préparer." },
  { q: "La voix est-elle générée ou chantée ?",
    a: "La composition s'appuie sur des outils de création musicale assistée, supervisés à chaque étape par la maison : le texte, la mélodie et le mixage sont relus, corrigés et validés à la main avant livraison. Aucun hommage n'est envoyé sans avoir été écouté par un humain." },
  { q: "Peut-on écouter avant de payer ?",
    a: "Vous pouvez écouter les trois hommages de démonstration sur la page Écouter. Pour les agences funéraires, la première composition est offerte : vous la présentez à une famille, et vous décidez ensuite." },
  { q: "Comment se passe le paiement ?",
    a: "Par carte bancaire ou PayPal, en paiement sécurisé au moment de la commande. Vous pouvez aussi enregistrer votre commande et régler après l'entretien téléphonique. Rétractation de 14 jours dans les conditions prévues par la loi." },
  { q: "Travaillez-vous avec les pompes funèbres ?",
    a: "Oui, et c'est une part importante de notre activité. Les agences partenaires conservent 60 % du montant sur chaque hommage, sans investissement ni charge technique. La page Agences comporte un simulateur de revenus." }
];

const STYLES = ['Chanson française', 'Folk acoustique', 'Piano classique', 'Jazz doux', 'Bossa nova', 'Gospel', 'Variété douce', 'Musique du monde', 'Polyphonie corse', 'Celtique', 'Klezmer'];

/* La vitrine des réalisations. Miroir de assets/data/content.json, qui fait
   foi : build.js reprend le contenu publié par-dessus ces valeurs. Le
   propriétaire ajoute ses musiques depuis sa console, pas ici. */
const TRACKS = [
  { id: "demo-7", title: "Personne n'oublie ton rire", who: "Odette, super mamie", lieu: "",
    style: "Gospel", file: "audio/odette.mp3",
    story: "Elle cuisinait sans balance, juste à l'œil, et les fêtes attendaient ses plats plutôt que l'inverse. Elle repartait la valise trop pleine et revenait avec le soleil dans la voix. Paul, Thomas, Virginie et Nolan ont grandi à sa table. Orgue Hammond et chœur gospel.",
    lyrics: "personne n'oublie ton rire\nIl arrivait avant toi dans la pièce",
    brief: "généreuse · rieuse · voyageuse" },
  { id: "demo-6", title: "Le vent connaît ton nom", who: "Chantal, 79 ans", lieu: "",
    style: "Piano classique", file: "audio/chantal.mp3",
    story: "Elle aimait les chansons, celles qui font partir l'âme bien avant les pieds. Elle est partie vers le Sud, et la vie y a posé Orlando sur son chemin. Sa famille a demandé que sa foi y soit, et un Ave Maria. Flûte amérindienne, harpe, violoncelles, chœur.",
    lyrics: "Le vent connaît ton nom,\nIl le murmure aux montagnes,\nIl le confie aux étoiles.",
    brief: "voyageuse · douce · croyante" },
  { id: "demo-4", title: "Jean, Paris", who: "Jean, 40 ans", lieu: "Paris",
    style: "Gospel", file: "audio/jean.mp3",
    story: "Parisien dans l'âme et supporter du Paris Saint-Germain, mari de Catia, père de Lucas et Julie. Sa famille a parlé de la ville qu'il aimait, des terrasses et des soirs de match au Parc — puis de ce qui passait avant tout le reste : eux quatre. Piano et saxophone, sur une montée gospel.",
    lyrics: "Paris peut bien continuer sans toi\nMais il manque quelque chose dans ses rues\nUne lumière, un rire, une voix",
    brief: "parisien · supporter · aimant" },
  { id: "demo-9", title: "Vers les pâturages d'en haut", who: "Antone, berger du Niolu", lieu: "Corse",
    style: "Polyphonie corse", file: "audio/antone.mp3",
    story: "Né dans le Niolu, sous le Monte Cintu. Berger comme son père et son grand-père : à douze ans il connaissait déjà chaque pierre, chaque source, chaque printemps des sentiers. Il a épousé Maria aux yeux noirs, fille de berger elle aussi, et ils ont eu cinq enfants — trois garçons, deux filles, tous nés sous le toit des ancêtres. Quand la maladie l'a cloué au lit, il a demandé qu'on ouvre la fenêtre pour voir le village une dernière fois. Polyphonie à trois voix d'hommes, cetera, pirula et ghiterra ; les couplets sont en corse, les refrains en français.",
    lyrics: "Oh Antone, enfant du Niolu sauvage\nTu as aimé la terre plus que les hommes\nEt tu t'en es allé comme s'en vont les bergers\nVers les pâturages d'en haut, vers le ciel éternel",
    brief: "montagnard · fidèle · taiseux" },
  { id: "demo-10", title: "Vers l'île d'Ys", who: "Yann, marin de Bréhat", lieu: "Bréhat",
    style: "Celtique", file: "audio/yann.mp3",
    story: "Né un matin de brume à Bréhat, entre l'écume et les mâts. Son père sentait le sel, sa mère le goémon. À douze ans il montait sur son premier dundee, direction l'Islande. Il a épousé Marie aux cheveux couleur de lin ; ils ont eu quatre enfants, deux filles et deux garçons, et la maison sentait le cidre et le pain noir. Quand la maladie l'a cloué dans son lit, il a demandé qu'on ouvre la fenêtre pour voir la mer une dernière fois. Harpe celtique, bombarde, biniou kozh et violon ; le chant passe du breton au français.",
    lyrics: "Oh Yann, enfant de la côte de Goëlo\nTu as aimé la mer plus qu'on n'aime les rois\nEt tu t'en es allé comme s'en vont les bateaux\nVers l'île d'Ys, vers le pays d'après",
    brief: "marin · courageux · fidèle" },
  { id: "demo-11", title: "Eshet Chayil, femme de valeur", who: "Ruth, 85 ans", lieu: "Paris et Israël",
    style: "Klezmer", mention: "Composé pour une vivante",
    file: "audio/ruth.mp3",
    story: "Née à Paris un soir de janvier, dans une maison modeste où l'on récitait le Shema. Un matin de septembre, elle est partie avec une valise et un Tehillim, et a pleuré en embrassant le sable du chemin. Là-bas elle a trouvé Avraham, et de leur amour sont nés quatre enfants : David, Moshe, Isaac et Sharone. Avraham est parti trop tôt ; elle a serré ses enfants et n'a pas plié. Aujourd'hui, trente voix et plus se lèvent autour de sa table. Violon klezmer, oud, kinnor et chofar, sur le texte d'Eshet Chayil que l'on chante aux femmes de la maison.",
    lyrics: "Ruth, Eshet Chayil, femme de valeur\nQui trouvera une femme comme toi ?\nTon prix dépasse celui des perles\nTu as marché entre deux terres avec foi",
    brief: "croyante · debout · rassembleuse" },
  { id: "demo-8", title: "Jusqu'au jour où l'on se retrouve", who: "Jason, 38 ans", lieu: "",
    style: "Piano classique", file: "audio/jason.mp3",
    story: "Trente-huit ans, et des phrases restées inachevées. Sa famille n'a pas demandé une chanson triste : elle a demandé qu'il soit encore là quelque part — dans la lumière au bord des fenêtres, dans le vent qui traverse les arbres. Piano de concert, violoncelle, voix soul et chœurs, sur un tempo qui ne presse personne.",
    lyrics: "Tu n'es plus là où nos mains peuvent te rejoindre,\nMais tu es partout où nos souvenirs respirent.\nEt tant qu'un cœur prononcera ton nom,\nTu ne disparaîtras jamais.",
    brief: "lumineux · inachevé · aimé" },
  { id: "demo-5", title: "Peppe, tesoro", who: "Giuseppe, 80 ans", lieu: "",
    style: "Musique du monde", file: "audio/giuseppe.mp3",
    story: "Il avait quitté le Sud pour l'usine et gardé le Sud dans l'assiette. Il n'a jamais dit « je t'aime » : il disait « mangia », et cela suffisait. Sa famille voulait sa cuisine, son accent qu'il n'a pas voulu perdre, et les dimanches de tutta la famiglia. Accordéon, piano, violoncelle.",
    lyrics: "Ton prénom tient dans deux langues\nCelle du village et celle d'ici",
    brief: "taiseux · nourricier · fidèle" },
  { id: "demo-1", title: "Le Papi Pêcheur", who: "Maurice, 78 ans", lieu: "Nantes",
    style: "Chanson française", file: "audio/maurice.mp3",
    story: "Pêcheur en bord de Loire pendant quarante ans. Sa famille a parlé de sa patience, de ses gestes précis, de la façon dont il a appris à pêcher à chacun de ses quatre petits-enfants. Guitare et accordéon, sur un tempo de marche tranquille.",
    lyrics: "Quatre paires de mains sur la même canne\nQuatre silences appris au bord de l'eau",
    brief: "patient · taquin · silencieux" },
  { id: "demo-2", title: "Le Jardin du Temps", who: "Monique, 75 ans", lieu: "Avignon",
    style: "Folk acoustique", file: "audio/monique.mp3",
    story: "Jardinière d'Avignon. Roses anciennes, jasmin blanc, les mains dans la terre à chaque printemps. Sa fille voulait « quelque chose qui sente le matin ». Voix féminine, cordes chaleureuses, guitare en arpèges.",
    lyrics: "Elle a planté tout ce qu'elle n'a pas dit\nEt le jasmin lui répond chaque avril",
    brief: "douce · obstinée · matinale" },
  { id: "demo-3", title: "Saudade Noite", who: "Sergio, 69 ans", lieu: "Marseille",
    style: "Bossa nova", file: "audio/sergio.mp3",
    story: "Brésilien de Marseille, danseur infatigable. Sa famille voulait de la joie, pas des larmes : « il aurait détesté qu'on pleure ». Guitare nylon, brosses sur la caisse claire, une dernière samba pour la route.",
    lyrics: "Ne pleurez pas, mettez la musique plus fort\nJ'ai encore un pas de danse à vous apprendre",
    brief: "joyeux · bruyant · généreux" }
];

module.exports = { OFFERS, TESTIS, FAQ, STYLES, TRACKS };
