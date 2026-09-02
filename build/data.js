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
    a: "Vingt-quatre heures à compter de l'entretien téléphonique, et non de la commande. En cas de cérémonie imminente, notre priorité six heures permet une livraison le jour même : appelez-nous directement au 07 84 10 16 96, nous décrochons sept jours sur sept." },
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

const STYLES = ['Chanson française', 'Folk acoustique', 'Piano classique', 'Jazz doux', 'Bossa nova', 'Gospel', 'Variété douce', 'Musique du monde'];

const TRACKS = [
  { title: 'Le Papi Pêcheur', who: 'Maurice, 78 ans', style: 'Chanson française', file: 'audio/maurice.mp3',
    story: "Pêcheur en bord de Loire pendant quarante ans. Sa famille a parlé de sa patience, de ses gestes précis, de la façon dont il a appris à pêcher à chacun de ses quatre petits-enfants. Guitare et accordéon, sur un tempo de marche tranquille.",
    brief: 'patient · taquin · silencieux' },
  { title: 'Le Jardin du Temps', who: 'Monique, 75 ans', style: 'Folk acoustique', file: 'audio/monique.mp3',
    story: "Jardinière d'Avignon. Roses anciennes, jasmin blanc, les mains dans la terre à chaque printemps. Sa fille voulait « quelque chose qui sente le matin ». Voix féminine, cordes chaleureuses, guitare en arpèges.",
    brief: 'douce · obstinée · matinale' },
  { title: 'Saudade Noite', who: 'Sergio, 69 ans', style: 'Bossa nova', file: 'audio/sergio.mp3',
    story: "Brésilien de Marseille, danseur infatigable. Sa famille voulait de la joie, pas des larmes : « il aurait détesté qu'on pleure ». Guitare nylon, brosses sur la caisse claire, une dernière samba pour la route.",
    brief: 'joyeux · bruyant · généreux' }
];

module.exports = { OFFERS, TESTIS, FAQ, STYLES, TRACKS };
