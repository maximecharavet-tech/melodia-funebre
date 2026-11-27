/* Questionnaire famille — mêmes sections et mêmes clés que la console Pro
   (assets/js/pro/vues/questionnaire.js, pro_questionnaires.donnees).
   La numérotation est celle du PDF manuscrit : une réponse papier se
   ressaisit question par question. ◆ = règle du noyau Rust (questionnaire.rs). */
window.SCHEMA = (function () {
  const TRAITS = ['généreux·se', 'drôle', 'discret·e', 'courageux·se', 'tendre', 'têtu·e', 'rieur·se', 'curieux·se', 'bricoleur·se', 'voyageur·se', 'fidèle', 'solaire'];
  const INSTRUMENTS = ['piano', 'guitare', 'violon', 'violoncelle', 'cordes', 'accordéon', 'harpe', 'orgue', 'flûte', 'cornemuse', 'saxophone', 'batterie'];
  const STYLES = ['Chanson française', 'Variété', 'Folk acoustique', 'Piano classique', 'Jazz doux', 'Gospel', 'Pop douce', 'Celtique', 'Bossa nova', 'Country', 'Orientale', 'Sacré / liturgique', 'Instrumental'];
  const p = (a) => a.map((x) => [x, x]);
  return [
    { id: 'defunt', n: 1, titre: 'La personne', sous: 'Comment l’appeliez-vous ? Ce qui permet de la nommer juste, et de la chanter juste.', champs: [
      { n: '1.1', cle: 'prenom', lab: 'Prénom d’usage', req: true, aide: 'Le prénom par lequel on l’appelait.', demi: true },
      { n: '1.2', cle: 'nom', lab: 'Nom de famille', demi: true },
      { n: '1.3', cle: 'surnom', lab: 'Surnom affectueux', aide: 'Celui qu’employaient les proches.', demi: true },
      { n: '1.4', cle: 'prononciation', lab: 'Prononciation du prénom', aide: 'Écrit comme il se dit : « Siobhan » → « Chivonne ».', demi: true },
      { n: '1.5', cle: 'genre', lab: 'Pour accorder les paroles, on dit', type: 'radio', req: true, options: [['il', 'il'], ['elle', 'elle'], ['iel', 'iel']] },
      { n: '1.6', cle: 'naissance', lab: 'Date de naissance', type: 'date', demi: true },
      { n: '1.7', cle: 'deces', lab: 'Date du décès', type: 'date', demi: true },
      { n: '1.8', cle: 'lieux', lab: 'Les lieux de sa vie', aide: 'Une ville, un village, une maison, un pays.' },
      { n: '1.9', cle: 'langues', lab: 'Langue(s) parlée(s)', demi: true },
      { n: '1.10', cle: 'langue_refrain', lab: 'Un refrain dans une autre langue ?', aide: 'Par exemple : en breton, en italien.', demi: true }
    ] },
    { id: 'vie', n: 2, titre: 'Sa vie', sous: 'Les souvenirs qu’on raconte encore. C’est d’eux que naît le texte.', champs: [
      { n: '2.1', cle: 'metier', lab: 'Métier', req: true, aide: 'Ou sa passion, si elle disait mieux qui il ou elle était.', demi: true },
      { n: '2.2', cle: 'passion', lab: 'Passion', demi: true },
      { n: '2.3', cle: 'traits', lab: 'Trois traits de caractère', type: 'puces', req: true, options: p(TRAITS), aide: 'Touchez-en trois, ou écrivez les vôtres juste en dessous.' },
      { n: '', cle: 'traits_libre', lab: 'Avec vos mots' },
      { n: '2.4', cle: 'habitude', lab: 'Une habitude qui lui ressemblait' },
      { n: '2.5', cle: 'anecdote', lab: 'Une anecdote', type: 'texte', max: 1500, lignes: 6, aide: 'Le souvenir qu’on raconte encore en famille, avec ses détails : un lieu, une saison, un geste.' },
      { n: '2.6', cle: 'phrase', lab: 'Une phrase qu’elle ou il répétait' },
      { n: '2.7', cle: 'aimait', lab: 'Ce qu’elle ou il aimait', aide: 'Un plat, un lieu, une saison, une équipe, un animal, une chanson…' },
      { n: '2.8', cle: 'proches', lab: 'Proches à nommer dans la chanson', type: 'liste', aide: 'Prénoms séparés par des virgules. Ne les nommez qu’avec leur accord.' },
      { n: '', cle: 'proches_consentement', lab: 'Les proches nommés ont donné leur accord.', type: 'case' },
      { n: '2.9', cle: 'eviter', lab: 'Sujets à éviter', type: 'texte', max: 600, lignes: 3, aide: 'La maladie, un conflit, un mot qui blesse : rien de ce qui est écrit ici ne sera abordé.' }
    ] },
    { id: 'musique', n: 3, titre: 'La musique', sous: 'Pour comprendre l’ambiance qu’elle ou il aurait aimée.', champs: [
      { n: '3.1', cle: 'style', lab: 'Style musical', type: 'radio', req: true, options: p(STYLES), large: true },
      { n: '3.2', cle: 'artistes', lab: 'Artistes qu’elle ou il aimait', type: 'liste', aide: 'Pour l’ambiance seulement : aucun artiste n’est imité ni nommé dans la composition.' },
      { n: '3.3', cle: 'energie', lab: 'Énergie', type: 'energie' },
      { n: '3.4', cle: 'voix', lab: 'Voix', type: 'radio', req: true, options: [['homme', 'Voix d’homme'], ['femme', 'Voix de femme'], ['choeur', 'Chœur'], ['instrumental', 'Instrumental']] },
      { n: '3.5', cle: 'instruments', lab: 'Instruments souhaités', type: 'puces', options: p(INSTRUMENTS) },
      { n: '', cle: 'instruments_eviter', lab: 'Instruments à éviter', type: 'puces', options: p(INSTRUMENTS) },
      { n: '3.6', cle: 'duree', lab: 'Durée', type: 'radio', options: [['courte', 'Environ 2 min 30'], ['standard', 'Environ 3 min 30'], ['longue', 'Environ 4 min 30']] }
    ] },
    { id: 'ceremonie', n: 4, titre: 'La cérémonie', sous: 'Pour que la chanson trouve sa place le jour venu.', champs: [
      { n: '4.1', cle: 'rite', lab: 'Rite', type: 'radio', options: [['civil', 'Civil ou laïque'], ['catholique', 'Catholique'], ['protestant', 'Protestant'], ['orthodoxe', 'Orthodoxe'], ['juif', 'Juif'], ['musulman', 'Musulman'], ['bouddhiste', 'Bouddhiste'], ['hindou', 'Hindou'], ['autre', 'Autre']] },
      { n: '4.2', cle: 'texte', lab: 'Texte à intégrer (prière, poème, verset)', type: 'texte', max: 600, lignes: 3 },
      { n: '4.3', cle: 'moment', lab: 'Moment de diffusion', type: 'radio', options: p(['Entrée', 'Recueillement', 'Hommage', 'Sortie', 'Crémation', 'Inhumation', 'Après la cérémonie']) },
      { n: '4.4', cle: 'date_ceremonie', lab: 'Date et heure de la cérémonie', type: 'datetime-local', demi: true, conseiller: true },
      { n: '4.5', cle: 'date_limite', lab: 'Chanson attendue au plus tard le', type: 'datetime-local', req: true, demi: true, conseiller: true },
      { n: '4.6', cle: 'contraintes', lab: 'Contraintes techniques du lieu', type: 'texte', max: 600, lignes: 2, conseiller: true, aide: 'Sonorisation, clé USB, durée maximale…' }
    ] },
    { id: 'message', n: 5, titre: 'Le message', sous: 'Ce que la chanson doit dire, et à qui.', champs: [
      { n: '5.1', cle: 'ton', lab: 'Le ton', type: 'radio', req: true, options: [['lumineux', 'Lumineux'], ['recueilli', 'Recueilli'], ['nostalgique', 'Nostalgique'], ['joyeux', 'Joyeux, une fête de la vie'], ['serein', 'Serein']] },
      { n: '5.2', cle: 'refrain', lab: 'Un mot ou une phrase pour le refrain', demi: true },
      { n: '5.3', cle: 'titre', lab: 'Un titre, si vous en avez un', demi: true },
      { n: '5.4', cle: 'adresse', lab: 'À qui parle la chanson ?', type: 'radio', options: [['tu', 'À elle ou à lui (tu)'], ['il_elle', 'D’elle ou de lui (il, elle)'], ['nous', 'La famille, d’une seule voix (nous)']] }
    ] },
    { id: 'consentements', n: 6, titre: 'Vos accords', sous: '', info: 'Les informations de ce questionnaire servent uniquement à composer la chanson et à vous la remettre. Elles sont conservées le temps nécessaire, jamais revendues, et vous pouvez demander leur effacement à tout moment. Les numéros de téléphone, adresses ou e-mails écrits dans vos réponses ne sont jamais transmis à la composition.', champs: [
      { n: '6.1', cle: 'rgpd', lab: 'J’ai été informé(e) de l’usage de ces données et je l’accepte.', type: 'case', req: true },
      { n: '6.2', cle: 'relecture_famille', lab: 'Souhaitez-vous relire les paroles avant la composition ?', type: 'radio', req: true, options: [[true, 'Oui, nous souhaitons les relire'], [false, 'Non, notre conseiller s’en charge']] },
      { n: '6.3', cle: 'droit_image', lab: 'Une photo pourra figurer sur la page mémorial (droit à l’image accordé).', type: 'case' },
      { n: '6.4', cle: 'visibilite', lab: 'Page mémorial en ligne', type: 'radio', req: true, options: [['lien', 'Lien privé (recommandé)'], ['code', 'Protégée par un code'], ['public', 'Publique'], ['non', 'Pas de page']], aide: 'La page n’est jamais indexée par les moteurs de recherche.' }
    ] }
  ];
})();

/* Même règle que verifier_etape() du noyau Rust : ce qui manque pour lancer. */
window.manquants = function (q, sec) {
  const e = q[sec.id] || {};
  const vide = (v) => v == null || String(v).trim() === '';
  const m = [];
  switch (sec.id) {
    case 'defunt': if (vide(e.prenom)) m.push('1.1'); if (vide(e.genre)) m.push('1.5'); break;
    case 'vie':
      if (vide(e.metier) && vide(e.passion)) m.push('2.1');
      if (!(e.traits || []).length && vide(e.traits_libre)) m.push('2.3');
      if ((e.proches || []).length && !e.proches_consentement) m.push('2.8');
      break;
    case 'musique': if (vide(e.style)) m.push('3.1'); if (vide(e.voix)) m.push('3.4'); break;
    case 'ceremonie': if (vide(e.date_limite)) m.push('4.5'); break;
    case 'message': if (vide(e.ton)) m.push('5.1'); break;
    case 'consentements':
      if (e.rgpd !== true) m.push('6.1');
      if (typeof e.relecture_famille !== 'boolean') m.push('6.2');
      if (vide(e.visibilite)) m.push('6.4');
      break;
  }
  return m;
};
