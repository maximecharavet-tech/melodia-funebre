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
    a: "Oui, et c'est une part importante de notre activité. Les agences partenaires conservent 60 % du montant sur chaque hommage, sans investissement ni charge technique. La page Agences comporte un simulateur de revenus." },

  /* ─── Les questions telles qu'elles se posent ───
     Le service n'a pas de nom de catégorie établi : personne ne le
     cherche par son nom. Ce qui se cherche, ce sont ces phrases-là,
     tapées dans un moteur ou posées à un assistant. Y répondre en
     clair, sur la page, est ce qui rend la maison trouvable — et ces
     réponses alimentent aussi les données structurées FAQPage. ─── */

  { q: "Peut-on vraiment faire composer une chanson pour un enterrement ?",
    a: "Oui, et c'est notre seul métier. Une famille nous raconte le défunt pendant cinq minutes au téléphone ; nous en tirons un texte, une mélodie et un enregistrement écrits pour cette personne et pour personne d'autre. Ce n'est ni une playlist, ni un morceau de catalogue adapté : l'œuvre n'existe pas avant l'entretien et n'est vendue qu'une fois." },
  { q: "Quelle musique choisir quand on ne veut pas d'une chanson connue ?",
    a: "C'est précisément le point de départ de la maison. Une chanson du commerce parle de quelqu'un d'autre : elle est belle, mais elle ne dit pas le métier, l'habitude, la phrase que le défunt répétait. Une œuvre composée pour lui dit ces choses-là, et la salle l'entend." },
  { q: "A-t-on le droit de diffuser cette chanson à l'église ou au crématorium ?",
    a: "Oui, sans démarche. L'œuvre est composée spécialement pour vous et n'est déposée à la SACEM par personne : il n'y a donc aucune redevance à déclarer ni aucune autorisation à demander pour la diffuser, la copier pour la famille ou la conserver." },
  { q: "La cérémonie est dans deux jours. Est-ce encore possible ?",
    a: "Oui. Le délai normal est de vingt-quatre heures à compter de l'entretien téléphonique, et non de la commande. Pour une cérémonie imminente, notre priorité six heures permet une livraison le jour même : cochez l'urgence à la commande ou demandez à être rappelé, nous répondons sept jours sur sept." },
  { q: "La chanson peut-elle être en breton, en corse, ou dans une autre langue ?",
    a: "Oui, et nous l'avons déjà fait. Le catalogue comporte un hommage en polyphonie corse dont les couplets sont en corse et les refrains en français, un hommage breton passant du breton au français, et un hommage mêlant le français et l'hébreu. Dites-nous la langue et le registre de sa région : c'est souvent là que la ressemblance se joue." },
  { q: "Peut-on intégrer un psaume, une sourate ou un texte sacré ?",
    a: "Selon le rite, et pas toujours. Nous composons volontiers autour d'un verset ou d'une prière que la famille nous donne, mais nous refusons de mettre en musique le Coran, et nous ne proposons rien pour la prière funéraire musulmane ni pour la liturgie orthodoxe, où la musique instrumentale n'a pas sa place. La page Rites détaille ce que nous proposons et ce que nous refusons, tradition par tradition." },
  { q: "Peut-on faire composer un hommage pour une personne encore vivante ?",
    a: "Oui. Le catalogue en comporte un, composé pour une femme de quatre-vingt-cinq ans dont les enfants voulaient lui dire de son vivant ce qu'on dit trop souvent après. La démarche est la même : un entretien, un texte, une œuvre. Elle vaut aussi pour un anniversaire, des noces d'or ou un départ." },
  { q: "Qui écoute la chanson avant qu'elle nous soit envoyée ?",
    a: "Nous. La composition s'appuie sur des outils de création musicale assistée, mais le texte, la mélodie et le mixage sont relus, corrigés et validés à la main avant l'envoi. Aucun hommage ne part sans avoir été écouté en entier par un humain." }
];

const STYLES = ['Chanson française', 'Folk acoustique', 'Piano classique', 'Jazz doux', 'Bossa nova', 'Gospel', 'Variété douce', 'Musique du monde', 'Polyphonie corse', 'Celtique', 'Klezmer', 'Bélé antillais', 'Reggae', 'Rock'];

/* La vitrine des réalisations. Miroir de assets/data/content.json, qui fait
   foi : build.js reprend le contenu publié par-dessus ces valeurs. Le
   propriétaire ajoute ses musiques depuis sa console, pas ici. */
const TRACKS = [
  { id: "demo-8", title: "Jusqu'au jour où l'on se retrouve", who: "Jason, 38 ans", lieu: "",
    style: "Piano classique", file: "audio/jason.mp3",
    story: "Trente-huit ans, et des phrases restées inachevées. Sa famille n'a pas demandé une chanson triste : elle a demandé qu'il soit encore là quelque part — dans la lumière au bord des fenêtres, dans le vent qui traverse les arbres. Piano de concert, violoncelle, voix soul et chœurs, sur un tempo qui ne presse personne.",
    lyrics: "Tu n'es plus là où nos mains peuvent te rejoindre,\nMais tu es partout où nos souvenirs respirent.\nEt tant qu'un cœur prononcera ton nom,\nTu ne disparaîtras jamais.",
    brief: "lumineux · inachevé · aimé" },
  { id: "demo-15", title: "Le rocker au cœur d'or", who: "Gilbert, rocker de Lyon", lieu: "Lyon",
    style: "Rock", file: "audio/gilbert.mp3",
    story: "Né un soir de 1956 dans un quartier populaire de Lyon. À quinze ans il entend à la radio une voix qui hurlait comme un loup — c'était Johnny, et il a couru acheter son premier 45 tours. À dix-huit ans, une vieille Triumph retapée de ses mains, et toutes les routes de France pour suivre la tournée : Paris, Marseille, Toulouse. Il a épousé Martine, qui supportait les vinyles et les week-ends sur la route. À soixante-dix ans il est allé au dernier concert, au Stade de France ; il a levé les bras comme à vingt ans et dit à son fils : « un jour, tu iras pour moi ». Il est rentré, a mis son vinyle préféré, et s'est endormi le sourire aux lèvres. Aujourd'hui les motos sont alignées devant son garage et ses petits-enfants ont découvert Johnny ce soir-là. Guitares électriques, orgue Hammond, et une foule qui chante.",
    lyrics: "Oh Gilbert, le rocker au cœur d'or\nTu as vécu ta vie comme un concert\nEt tu t'en es allé comme une guitare électrique\nVers la scène d'en haut, là où les rockers ne s'éteignent jamais",
    brief: "fidèle · bruyant · tendre" },
  { id: "demo-13", title: "Ta lumière reste", who: "Anthony, routard de la vie", lieu: "Paris et le monde",
    style: "Reggae", file: "audio/anthony.mp3",
    story: "Né en 1976 dans une banlieue grise, loin des tropiques, avec le one-drop dans le cœur. À dix-huit ans, son premier sac : Kingston, Addis-Abeba, les étoiles du Sahara. Il parlait cinq langues, mais le patwa était son cœur, et il revenait à Noël avec des masques d'Afrique et des pierres d'Inde. L'année de ses cinquante ans il est reparti pour l'Éthiopie — « cette fois, je reste un peu plus longtemps » — et n'est jamais revenu. Ses amis ont ramené son sac à dos, mis Exodus à fond dans le jardin de son vieux squat parisien, et dansé jusqu'au lever du soleil. Melodica, basse lourde, batterie one-drop et échos dub.",
    lyrics: "Oh Anthony, le routard de la vie\nTu as aimé la liberté plus que tout\nEt tu t'en es allé comme un son de reggae\nVers les terres d'en haut, là où les voyageurs ne s'arrêtent jamais",
    brief: "libre · voyageur · rieur" },
  { id: "demo-14", title: "Paula, le vent te porte", who: "Paula, 54 ans", lieu: "",
    style: "Folk acoustique", file: "audio/paula.mp3",
    story: "Cinquante-quatre années à semer de l'amour sur les chemins du monde. Elle aimait partir sans savoir où, suivre une route, un soleil, un parfum d'ailleurs — et partout où elle allait, quelque chose la ramenait vers les siens. Elle savait écouter les silences des autres, donner sans compter, aimer sans faire de bruit. Elle cachait parfois ses larmes derrière ses sourires, et trouvait toujours une raison d'aimer encore. Flûte amérindienne, guitare en fingerpicking, voix rauque et polyphonie masculine.",
    lyrics: "Paula, va là où le vent te porte,\nLà où les étoiles n'ont plus de fin.\nNous garderons ta lumière\nAu creux de nos mains.",
    brief: "généreuse · voyageuse · pudique" },
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
  { id: "demo-12", title: "Enfant de la mer", who: "Dorian, tambouyé de Fort-de-France", lieu: "Martinique",
    style: "Bélé antillais", file: "audio/dorian.mp3",
    story: "Né un matin de 1948 à Fort-de-France, entre la mer et les cannes. Son père ramenait les poissons volants, sa mère les histoires d'avant. À dix ans il tenait déjà le tambou et faisait lever tout le quartier. Il connaissait les poissons, les étoiles et les rivières. Il a épousé Yolande ; ils ont eu quatre enfants, deux garçons et deux filles, et la maison n'a jamais manqué de rires ni de musique. Le soir, devant la case, il racontait les légendes aux petits. Quand la maladie est venue, il a demandé qu'on joue du bélé : il a dansé une dernière fois, et il a souri. Tambou bélé, ti-bwa, chacha et guitare ; les couplets en français, un passage en créole.",
    lyrics: "Oh Dorian, enfant de la mer\nTu avais le rythme dans le corps\nEt tu t'en es allé comme se lève le soleil\nIbo pa mouri janmen — les esprits ne meurent jamais",
    brief: "rythmé · conteur · joyeux" },
  { id: "demo-11", title: "Eshet Chayil, femme de valeur", who: "Ruth, 85 ans", lieu: "Paris et Israël",
    style: "Klezmer", mention: "Composé pour une vivante",
    file: "audio/ruth.mp3",
    story: "Née à Paris un soir de janvier, dans une maison modeste où l'on récitait le Shema. Un matin de septembre, elle est partie avec une valise et un Tehillim, et a pleuré en embrassant le sable du chemin. Là-bas elle a trouvé Avraham, et de leur amour sont nés quatre enfants : David, Moshe, Isaac et Sharone. Avraham est parti trop tôt ; elle a serré ses enfants et n'a pas plié. Aujourd'hui, trente voix et plus se lèvent autour de sa table. Violon klezmer, oud, kinnor et chofar, sur le texte d'Eshet Chayil que l'on chante aux femmes de la maison.",
    lyrics: "Ruth, Eshet Chayil, femme de valeur\nQui trouvera une femme comme toi ?\nTon prix dépasse celui des perles\nTu as marché entre deux terres avec foi",
    brief: "croyante · debout · rassembleuse" },
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
