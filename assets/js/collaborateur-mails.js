/* ═══════════════════════════════════════════════════════════════
   collaborateur-mails.js — Mails tout faits

   Une bibliothèque de courriers que le collaborateur personnalise,
   relit, copie ou ouvre dans SA messagerie. Aucun service d’envoi
   n’est appelé : ENVOI_ACTIF reste faux. Resend, s’il est un jour
   rallumé, vit dans /api/prospect-mail et ne concerne pas ce module.

   Les liens musicaux sortent du catalogue publié (content.json).
   Si le catalogue ne charge pas, le lien reste un TODO visible —
   on n’invente pas d’adresse.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SITE = 'https://melodia-funebre.fr';
  var ENVOI_ACTIF = false;
  var BANNIERE = '/assets/img/courriel/banniere.jpg';
  var PARRAIN = 'julie-serve';
  /* Trouvés dans le pied du site. TikTok et le LinkedIn de Julie
     n’y figurent pas : les emplacements restent nommés, et ne sont
     pas montrés dans le courriel tant qu’ils ne sont pas remplis. */
  var RESEAUX = [
    { nom: 'Facebook', url: 'https://www.facebook.com/share/1GUX4Ht8M8/' },
    { nom: 'Instagram', url: 'https://www.instagram.com/melodia_funebre' },
    { nom: 'TikTok', url: '{{LIEN_TIKTOK}}' },
    { nom: 'LinkedIn — Julie Serve', url: '{{LIEN_LINKEDIN_JULIE}}' }
  ];
  var SIGNATURE_JULIE = {
    nom: 'Julie Serve',
    role: 'Directrice marketing & commerciale',
    email: 'julie@melodia-funebre.fr',
    photo: '/assets/img/equipe/julie-serve.jpg'
  };

  /* Même règle que build/adresses.js : l’adresse d’un hommage. */
  function limace(texte) {
    return String(texte || '')
      .replace(/œ/g, 'oe').replace(/Œ/g, 'OE')
      .replace(/æ/g, 'ae').replace(/Æ/g, 'AE')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'hommage';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var MODELES = [
    {
      id: 'famille-contact',
      categorie: 'famille',
      nom: 'Famille — premier contact',
      quand: 'Le premier mot, quand une famille a laissé ses coordonnées ou qu’une agence vous demande d’écrire.',
      visuel: '/assets/img/campagne/adieux-en-musique.jpg',
      visuelAlt: 'Affiche Melodia Funèbre : des adieux en musique',
      piste: 'Le Papi Pêcheur',
      champs: ['prénom_défunt', 'famille'],
      requis: ['prénom_défunt'],
      pied: 'famille',
      objet: 'Une musique pour {prénom_défunt}',
      titre: 'Prendre le temps d’écouter',
      texte: [
        'Bonjour,',
        'Vous traversez des jours où chaque décision pèse. Je vous écris de la part de Melodia Funèbre, sans rien vous demander dans l’instant.',
        'Nous composons une chanson originale à partir de ce que vous voulez bien raconter de {prénom_défunt} : quelques traits, une habitude, un métier, une phrase qu’on lui connaissait. La pièce est livrée en vingt-quatre heures. Elle peut être diffusée pendant la cérémonie, sans droit SACEM, et elle reste à la famille {famille}.',
        'Le lien ci-dessous n’est pas la chanson de {prénom_défunt}. C’est un exemple du catalogue, pour entendre le genre de pièce que cela peut être. La sienne, si vous le souhaitez, sera écrite à partir de vos mots seulement.',
        '{lien_musique}',
        'Je reste disponible pour en parler, ou pour ne pas en parler. Les deux réponses sont justes.',
        '{collaborateur}\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'famille-offre',
      categorie: 'famille',
      nom: 'Famille — présenter l’offre',
      quand: 'Quand la famille a demandé ce que cela coûte, et comment cela se passe.',
      visuel: '/assets/img/campagne/melodie-pour-toujours.webp',
      visuelAlt: 'Visuel Melodia : une mélodie pour toujours',
      piste: 'Jean, Paris',
      champs: ['prénom_défunt', 'famille'],
      requis: ['prénom_défunt'],
      pied: 'famille',
      objet: 'Ce que nous pouvons composer pour {prénom_défunt}',
      titre: 'Trois façons de faire, le même égard',
      texte: [
        'Bonjour,',
        'Comme convenu, voici comment se prépare l’hommage de {prénom_défunt}, sans engagement de votre part tant que vous n’avez pas entendu le résultat.',
        'Vous nous confiez quelques éléments : le prénom, trois traits de caractère, un métier ou une passion, une habitude, et si vous le voulez une anecdote. Cela prend quelques minutes. Nous composons, puis vous écoutez avant la cérémonie — jamais de découverte le jour même.',
        'Les trois offres de la maison :',
        '· Essentiel, 149 € — la pièce, livrée en vingt-quatre heures\n· Prestige, 299 € — avec une révision comprise\n· Mémorial, 499 € — révisions illimitées, et priorité si la cérémonie est très proche',
        'Aucun droit SACEM n’est à régler, pour vous comme pour le lieu. La famille {famille} conserve l’enregistrement.',
        'Pour juger sur une musique déjà écrite, et non sur une promesse, cet exemple du catalogue :',
        '{lien_musique}',
        'Ce n’est pas la chanson de {prénom_défunt}. La sienne n’existera que si vous nous confiez vos mots.',
        '{collaborateur}\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'famille-relance',
      categorie: 'famille',
      nom: 'Famille — relance',
      quand: 'Une seule fois, quelques jours après le premier message, s’il est resté sans réponse.',
      visuel: '/assets/img/campagne/ce-que-les-mots.webp',
      visuelAlt: 'Visuel Melodia : ce que les mots ne disent pas toujours',
      piste: 'Sous le lierre',
      champs: ['prénom_défunt', 'famille'],
      requis: ['prénom_défunt'],
      pied: 'famille',
      objet: 'Je me permets de revenir vers vous',
      titre: 'Un seul mot, puis je vous laisse',
      texte: [
        'Bonjour,',
        'Je vous avais écrit au sujet d’une musique pour {prénom_défunt}. Je me permets de revenir une seule fois, puis je n’insisterai pas : votre silence est une réponse, et elle me suffit.',
        'Si le moment n’est pas le bon, vous n’avez rien à faire. Si vous voulez simplement entendre de quoi il s’agit, trois minutes d’un exemple suffisent — ce n’est pas sa chanson, c’est une pièce du catalogue :',
        '{lien_musique}',
        'La famille {famille} reste libre, y compris de ne pas donner suite.',
        '{collaborateur}\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'famille-proposition',
      categorie: 'famille',
      nom: 'Famille — envoyer la proposition musicale',
      quand: 'Pour transmettre un exemple, ou la pièce elle-même une fois qu’elle existe. La case sous le choix de morceau change la phrase.',
      visuel: '/assets/img/campagne/duo-au-piano.webp',
      visuelAlt: 'Visuel Melodia : un duo au piano',
      piste: 'Le Papi Pêcheur',
      champs: ['prénom_défunt', 'famille'],
      requis: ['prénom_défunt'],
      pied: 'famille',
      proposition: true,
      objet: 'La proposition musicale pour {prénom_défunt}',
      titre: 'À écouter quand vous aurez un moment au calme',
      texte: [
        'Bonjour,',
        '{phrase_musique}',
        'Vous pouvez l’écouter ici :',
        '{lien_musique}',
        'Dites-moi simplement ce qui vous touche, et ce qui ne va pas. On reprend le texte autant qu’il le faut avant la cérémonie. Rien n’est diffusé sans votre accord.',
        'La famille {famille} garde l’enregistrement, quoi qu’il arrive ensuite.',
        '{collaborateur}\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'famille-merci',
      categorie: 'famille',
      nom: 'Famille — remerciement après la cérémonie',
      quand: 'Le lendemain, ou dans les jours qui suivent. Pas de relance commerciale.',
      visuel: '/assets/img/campagne/emotion-eternelle.webp',
      visuelAlt: 'Visuel Melodia : une émotion qui demeure',
      piste: 'Sous le lierre',
      champs: ['prénom_défunt', 'famille'],
      requis: ['prénom_défunt'],
      pied: 'famille',
      objet: 'Après la cérémonie de {prénom_défunt}',
      titre: 'Merci de nous avoir fait confiance',
      texte: [
        'Bonjour,',
        'La cérémonie est passée. Merci d’avoir confié à Melodia Funèbre quelques mots sur {prénom_défunt}, et d’avoir laissé cette musique avoir une place.',
        'L’enregistrement reste à la famille {famille}. Vous pouvez le réécouter, le garder, le transmettre. Il n’y a rien d’autre à faire, et rien à nous devoir de plus.',
        'S’il vous est doux de l’entendre encore, le lien demeure :',
        '{lien_musique}',
        'Si ce lien est un exemple du catalogue et non la pièce de {prénom_défunt}, ignorez-le : c’est le fichier que nous vous avons remis qui fait foi.',
        'Avec égard,',
        '{collaborateur}\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'pf-contact',
      categorie: 'pompes',
      nom: 'Pompes funèbres — premier contact',
      quand: 'Premier message à une agence. Le matin. L’identité est claire, et le pied de page porte le refus.',
      visuel: '/assets/img/campagne/affiche-partenaire.jpg',
      visuelAlt: 'Affiche Melodia : devenir partenaire',
      piste: 'Le Papi Pêcheur',
      champs: ['agence', 'ville', 'dirigeant'],
      requis: ['agence'],
      pied: 'prospection',
      objet: 'Un service que vos confrères de {ville} ne proposent pas encore',
      titre: 'Chaque vie mérite une chanson',
      texte: [
        'Bonjour{dirigeant},',
        'Aux obsèques, la musique n’a presque jamais connu le défunt. Nous composons, pour chaque personne, une chanson originale à partir de ce que la famille raconte. Livrée en vingt-quatre heures, diffusable en cérémonie, sans droit SACEM, et conservée par la famille.',
        'Pour {agence}, à {ville} :',
        '· vous conservez 60 % du montant, soit 179 € nets sur une offre à 299 €\n· aucun investissement, aucun stock, aucune charge technique\n· la première composition est offerte, pour que vous jugiez devant une famille',
        'Plutôt qu’un argument, un exemple du catalogue — trois minutes :',
        '{lien_musique}',
        'Seriez-vous disponible quelques minutes cette semaine ?',
        '{collaborateur}\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'pf-relance',
      categorie: 'pompes',
      nom: 'Pompes funèbres — relance',
      quand: 'Sept jours après le premier contact, sans réponse. Une seule fois.',
      visuel: '/assets/img/campagne/affiche-partenaire.jpg',
      visuelAlt: 'Affiche Melodia : devenir partenaire',
      piste: 'Jean, Paris',
      champs: ['agence', 'ville', 'dirigeant'],
      requis: ['agence'],
      pied: 'prospection',
      objet: 'Trois minutes d’écoute — {agence}',
      titre: 'Je me permets de revenir une fois',
      texte: [
        'Bonjour{dirigeant},',
        'Je vous avais écrit au sujet d’un hommage musical original pour les familles de {agence}. Je reviens une seule fois, puis je vous laisse tranquille.',
        'Un exemple vaut mieux qu’un second argument :',
        '{lien_musique}',
        'Si le principe vous parle, la première composition est offerte. Si ce n’est pas le moment, dites-le moi : je ne reviendrai pas.',
        '{collaborateur}\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'seq-1-presentation',
      categorie: 'sequence',
      nom: 'Séquence 1 — Présentation',
      quand: 'Premier message. Faire connaître la maison, sans demander une décision.',
      visuel: '/assets/img/campagne/adieux-en-musique.jpg',
      visuelAlt: 'Affiche Melodia Funèbre : des adieux en musique',
      piste: 'Le Papi Pêcheur',
      champs: ['agence', 'ville', 'dirigeant'],
      requis: ['agence'],
      pied: 'prospection',
      reseaux: true,
      signatureFixe: SIGNATURE_JULIE,
      bouton: { texte: 'Écouter le catalogue', url: SITE + '/demos?parrain=' + PARRAIN },
      objet: '{agence} — une œuvre pour vos familles',
      titre: 'Une chanson écrite pour une personne',
      texte: [
        'Bonjour{dirigeant},',
        'Je suis Julie Serve, de Melodia Funèbre. Je vous écris pour {agence}, à {ville}, sans rien vous demander dans l’instant.',
        'Nous composons une œuvre musicale pour une personne précise, à partir de ce que sa famille raconte d’elle. L’œuvre est livrée en vingt-quatre heures. Elle peut être diffusée pendant la cérémonie, et elle reste à la famille.',
        'Vous n’avez rien à produire : vous présentez, nous composons. Le catalogue est public. Il permet d’entendre ce que cela donne avant d’en parler à qui que ce soit.',
        'Julie Serve\nDirectrice marketing & commerciale\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'seq-2-familles',
      categorie: 'sequence',
      nom: 'Séquence 2 — Pour les familles',
      quand: 'Après la présentation. Ce que la famille reçoit : la chanson, puis la page et son QR.',
      visuel: '/assets/img/campagne/plaque-et-telephone.webp',
      visuelAlt: 'Une plaque commémorative et un téléphone qui ouvre la page de souvenir',
      piste: 'Jean, Paris',
      champs: ['agence', 'ville', 'dirigeant'],
      requis: ['agence'],
      pied: 'prospection',
      reseaux: true,
      signatureFixe: SIGNATURE_JULIE,
      bouton: { texte: 'Voir la page et le QR', url: SITE + '/qr-code-memorial?parrain=' + PARRAIN },
      objet: 'Ce que la famille emporte — {agence}',
      titre: 'La chanson, puis une page que l’on peut rouvrir',
      texte: [
        'Bonjour{dirigeant},',
        'Pour les familles de {agence}, à {ville}, l’hommage ne s’arrête pas à la cérémonie.',
        'La famille reçoit une chanson originale, composée pour le défunt à partir de ce qu’elle a raconté. Elle peut être diffusée le jour même. Ensuite, une page de souvenir prolonge l’hommage, avec un QR code : on peut la rouvrir, la transmettre, la garder.',
        'Ce n’est pas un morceau du commerce. C’est une pièce écrite pour une seule personne. Vous n’avez rien à installer. Vous montrez. Nous livrons.',
        'Julie Serve\nDirectrice marketing & commerciale\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'seq-3-partenariat',
      categorie: 'sequence',
      nom: 'Séquence 3 — Le partenariat',
      quand: 'Les conditions, telles qu’elles sont écrites sur la page Professionnels.',
      visuel: '/assets/img/campagne/affiche-partenaire.jpg',
      visuelAlt: 'Affiche Melodia : devenir partenaire',
      piste: 'Le roi de la route',
      champs: ['agence', 'ville', 'dirigeant'],
      requis: ['agence'],
      pied: 'prospection',
      reseaux: true,
      signatureFixe: SIGNATURE_JULIE,
      bouton: { texte: 'Lire les conditions', url: SITE + '/professionnels?parrain=' + PARRAIN },
      objet: 'Le partenariat, en clair — {agence}',
      titre: 'Ce que vous conservez, et ce que vous n’avez pas à faire',
      texte: [
        'Bonjour{dirigeant},',
        'Voici les conditions, pour {agence} à {ville}, sans autre chiffre que ceux publiés sur le site.',
        '· Vous conservez 60 % du montant payé par la famille, soit 179 € nets sur une offre Prestige.\n· Aucun investissement, aucun stock, aucun minimum, aucun engagement de durée.\n· Aucune démarche SACEM : l’œuvre est originale, et les droits d’usage sont cédés. Rien à déclarer pour la diffuser, la copier pour la famille ou la conserver.\n· La première composition est offerte, pour que vous la présentiez à une famille avant de décider.\n· Le délai annoncé est de vingt-quatre heures.',
        'Vous présentez. Nous composons.',
        'Julie Serve\nDirectrice marketing & commerciale\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'seq-4-relance',
      categorie: 'sequence',
      nom: 'Séquence 4 — Relance',
      quand: 'Une relance douce, si le premier message est resté sans réponse.',
      visuel: '/assets/img/campagne/ce-que-les-mots.webp',
      visuelAlt: 'Visuel Melodia : ce que les mots ne disent pas toujours',
      piste: 'Sous le lierre',
      champs: ['agence', 'ville', 'dirigeant'],
      requis: ['agence'],
      pied: 'prospection',
      reseaux: true,
      signatureFixe: SIGNATURE_JULIE,
      bouton: { texte: 'Écouter un exemple', url: SITE + '/demos?parrain=' + PARRAIN },
      objet: 'Je me permets de revenir — {agence}',
      titre: 'Un mot, sans insister',
      texte: [
        'Bonjour{dirigeant},',
        'Je vous avais écrit au sujet d’un hommage musical pour les familles de {agence}, à {ville}. Je me permets de revenir une fois, calmement.',
        'Si le moment n’est pas le bon, vous n’avez rien à faire. Si vous voulez seulement entendre, le catalogue est là : ce sont des exemples, pas des commandes en cours.',
        'La première composition reste offerte, dans les mêmes conditions.',
        'Julie Serve\nDirectrice marketing & commerciale\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'seq-5-dernier',
      categorie: 'sequence',
      nom: 'Séquence 5 — Dernier mot',
      quand: 'Dernière relance, ou invitation à un échange court. Ensuite, on s’arrête.',
      visuel: '/assets/img/campagne/poignee-de-main.webp',
      visuelAlt: 'Visuel Melodia : une poignée de main',
      piste: 'Le Jardin du Temps',
      champs: ['agence', 'ville', 'dirigeant'],
      requis: ['agence'],
      pied: 'prospection',
      reseaux: true,
      signatureFixe: SIGNATURE_JULIE,
      bouton: { texte: 'Proposer un échange', url: SITE + '/contact?parrain=' + PARRAIN },
      objet: 'Dernier message — {agence}',
      titre: 'Je vous laisse le choix, puis je m’arrête',
      texte: [
        'Bonjour{dirigeant},',
        'C’est mon dernier message à ce sujet, pour {agence} à {ville}. Après celui-ci, je ne reviendrai pas, sauf si vous me le demandez.',
        'Si un échange de quelques minutes vous est utile, je suis disponible. Si ce n’est pas pour vous, répondez STOP : votre adresse est retirée, et je n’insiste pas.',
        'Julie Serve\nDirectrice marketing & commerciale\nMelodia Funèbre'
      ].join('\n\n')
    },
    {
      id: 'fleuriste',
      categorie: 'fleuriste',
      nom: 'Fleuriste — prospection',
      quand: 'Premier message à une boutique qui accompagne des familles. Pas une circulaire.',
      visuel: '/assets/img/campagne/poignee-de-main.webp',
      visuelAlt: 'Visuel Melodia : une poignée de main',
      piste: 'Le Jardin du Temps',
      champs: ['agence', 'ville', 'dirigeant'],
      requis: ['agence'],
      pied: 'prospection',
      objet: 'Pour les familles que vous accompagnez déjà — {ville}',
      titre: 'La musique, au moment où vous composez le bouquet',
      texte: [
        'Bonjour{dirigeant},',
        'Vous voyez les familles au moment où elles choisissent encore quelque chose de juste pour la cérémonie. Je vous écris parce que Melodia Funèbre compose, pour le défunt, une chanson originale à partir de ce que les proches racontent — livrée en vingt-quatre heures, sans droit SACEM.',
        'Ce n’est pas un produit de plus à pousser au comptoir. C’est une phrase que vous pouvez avoir, si une famille demande « est-ce qu’on peut faire quelque chose qui lui ressemble vraiment ». Vous nous les présentez, ou vous nous laissez leurs coordonnées avec leur accord. Nous nous en occupons.',
        '{agence} n’a rien à installer. Si une famille commande, nous convenons ensemble de la forme du renvoi — rien n’est chiffré dans ce message, le taux se fixe de vive voix.',
        'Pour entendre de quoi il s’agit, un exemple du catalogue :',
        '{lien_musique}',
        'Si cela ne vous concerne pas, une réponse en ce sens me suffit.',
        '{collaborateur}\nMelodia Funèbre'
      ].join('\n\n')
    }
  ];

  var CHAMPS = {
    'prénom_défunt': { label: 'Prénom du défunt', placeholder: 'Prénom' },
    famille: { label: 'Famille', placeholder: 'Nom de famille' },
    agence: { label: 'Maison ou boutique', placeholder: 'Nom de l’établissement' },
    ville: { label: 'Ville', placeholder: 'Ville' },
    dirigeant: { label: 'Interlocuteur', placeholder: 'Prénom ou nom' }
  };

  var catalogue = null;

  function chargerCatalogue() {
    if (catalogue) return Promise.resolve(catalogue);
    return fetch('/assets/data/content.json', { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error('catalogue'); return r.json(); })
      .then(function (d) {
        var vus = {};
        catalogue = (d.demos || []).filter(function (x) {
          return x && x.visible !== false && x.audio && x.title;
        }).map(function (x) {
          var slug = limace(x.title);
          if (vus[slug]) { vus[slug]++; slug = slug + '-' + vus[slug]; }
          else vus[slug] = 1;
          var audio = String(x.audio);
          var page = '/ecouter/' + slug;
          return {
            id: x.id || slug,
            titre: x.title,
            qui: x.who || '',
            style: x.style || '',
            audio: /^https?:\/\//i.test(audio) ? audio : '/' + audio.replace(/^\//, ''),
            page: page,
            image: '/assets/img/partage/' + slug + '.jpg'
          };
        });
        return catalogue;
      })
      .catch(function () { catalogue = []; return catalogue; });
  }

  function pisteParTitre(titre) {
    if (!catalogue || !titre) return null;
    var voulu = limace(titre);
    for (var i = 0; i < catalogue.length; i++) {
      if (limace(catalogue[i].titre) === voulu) return catalogue[i];
    }
    return null;
  }

  function urlPublique(chemin) {
    if (!chemin) return '';
    if (/^https:\/\/melodia-funebre\.fr\//.test(chemin)) return chemin;
    if (chemin.charAt(0) === '/' && chemin.indexOf('//') !== 0) return SITE + chemin;
    return '';
  }

  /* {dirigeant} garde l’espace qui le précède quand le nom existe,
     et disparaît avec cet espace sinon : « Bonjour Marie, » / « Bonjour, ». */
  function remplir(texte, vars) {
    return String(texte || '').replace(/\{([^{}]+)\}/g, function (m, k) {
      if (k === 'dirigeant') {
        return vars.dirigeant ? ' ' + vars.dirigeant : '';
      }
      var val = vars[k];
      if (val == null || String(val).trim() === '') return m;
      return String(val);
    });
  }

  function phraseMusique(estExemple, prenom) {
    if (estExemple) {
      return 'Voici un exemple du catalogue, pour que vous entendiez ce que peut être un hommage. La chanson de ' +
        (prenom || '{prénom_défunt}') + ' sera une autre pièce, écrite à partir de vos mots. Ne la prenez pas pour la sienne.';
    }
    return 'Voici la pièce composée pour ' + (prenom || '{prénom_défunt}') +
      '. Écoutez-la au calme. Si un mot sonne faux, dites-le nous : nous la reprenons avant la cérémonie.';
  }

  function autresLiens(choisie) {
    if (!catalogue || !catalogue.length) return [];
    var hors = catalogue.filter(function (p) { return !choisie || p.id !== choisie.id; });
    return hors.slice(0, 2);
  }

  function blocExemples(choisie, autres) {
    var lignes = [];
    if (choisie) lignes.push('· ' + choisie.titre + (choisie.qui ? ' — ' + choisie.qui : '') + ' : ' + urlPublique(choisie.page));
    autres.forEach(function (p) {
      lignes.push('· ' + p.titre + (p.qui ? ' — ' + p.qui : '') + ' : ' + urlPublique(p.page));
    });
    if (!lignes.length) {
      return 'Exemples à écouter\n· Le catalogue n’a pas pu être chargé. Ouvrez la page Écouter du site et copiez-en un lien, sans en inventer.';
    }
    return 'Autres exemples du catalogue (ce ne sont pas des hommages de circonstance) :\n' + lignes.join('\n');
  }

  function manquants(modele, vars) {
    return (modele.requis || []).filter(function (k) {
      return !vars[k] || !String(vars[k]).trim();
    });
  }

  function composer(o) {
    var modele = o.modele;
    var vars = Object.assign({}, o.vars || {});
    var choisie = o.piste || null;
    var autres = autresLiens(choisie);
    var lien = choisie ? urlPublique(choisie.page) : '';
    vars.lien_musique = lien || '{lien_musique}';
    vars.phrase_musique = phraseMusique(o.exemple !== false, vars['prénom_défunt'] || '');
    if (!vars.collaborateur) vars.collaborateur = 'Melodia Funèbre';
    if (!vars.famille) vars.famille = '';
    if (!vars.ville) vars.ville = 'votre secteur';
    if (!vars.agence) vars.agence = '';

    var brut = modele.texte;
    var texte = remplir(brut, vars);
    if (!String((o.vars && o.vars.famille) || '').trim()) {
      texte = texte.replace(/\{famille\}/g, '');
      texte = texte.replace(/\s+à la famille\s*([.])/g, '$1');
      texte = texte.replace(/La famille\s+reste/g, 'Vous restez');
      texte = texte.replace(/[ ]{2,}/g, ' ');
      texte = texte.replace(/\s+([.,])/g, '$1');
    }
    /* La séquence a déjà un bouton et une carte d'écoute : on n'ajoute
       pas la liste d'adresses qui allonge le message. */
    if (!modele.bouton) {
      var suite = blocExemples(choisie, autres);
      if (texte.indexOf(suite) === -1) texte = texte.replace(/\s+$/, '') + '\n\n' + suite;
    }

    var sujet = remplir(modele.objet, vars).replace(/\s{2,}/g, ' ').trim();
    var titre = remplir(modele.titre, vars);
    var bouton = modele.bouton ? {
      texte: remplir(modele.bouton.texte, vars),
      url: avecParrain(remplir(modele.bouton.url, vars))
    } : null;
    var html = habiller({
      sujet: sujet,
      titre: titre,
      texte: texte,
      visuel: modele.visuel,
      visuelAlt: modele.visuelAlt,
      pistes: modele.bouton ? (choisie ? [choisie] : []) : (choisie ? [choisie] : []).concat(autres),
      signature: modele.signatureFixe || o.signature || {},
      pied: modele.pied,
      bouton: bouton,
      reseaux: !!modele.reseaux,
      absolu: !!o.absolu
    });
    return {
      sujet: sujet,
      titre: titre,
      texte: texte,
      html: html,
      lien: lien,
      manquants: manquants(modele, o.vars || {}),
      sansMusique: !choisie
    };
  }

  function avecParrain(url) {
    var u = String(url || '');
    if (!u || u.indexOf('parrain=') !== -1) return u;
    return u + (u.indexOf('?') === -1 ? '?' : '&') + 'parrain=' + PARRAIN;
  }

  function src(chemin, absolu) {
    if (!chemin) return '';
    if (absolu) return urlPublique(chemin) || '';
    if (/^https?:\/\//.test(chemin)) return chemin;
    return chemin.charAt(0) === '/' ? chemin : '/' + chemin;
  }

  function paragraphe(bloc) {
    var t = bloc.trim();
    if (!t) return '';
    if (/^[·•]\s/m.test(t)) {
      var items = t.split('\n').map(function (l) { return l.replace(/^[·•]\s*/, '').trim(); }).filter(Boolean);
      return '<ul style="margin:0 0 16px;padding-left:18px;color:#3d3a33;font-size:15px;line-height:1.65;">' +
        items.map(function (i) { return '<li style="margin:0 0 6px;">' + marque(i) + '</li>'; }).join('') + '</ul>';
    }
    return '<p style="margin:0 0 16px;color:#3d3a33;font-size:15px;line-height:1.7;">' +
      marque(t).replace(/\n/g, '<br>') + '</p>';
  }

  function marque(t) {
    return esc(t).replace(/\{([^{}]+)\}/g, function (m) {
      return '<span style="background:#f3e6c4;color:#6b5420;padding:0 3px;">' + m + '</span>';
    });
  }

  function cartePiste(p, absolu) {
    var page = src(p.page, absolu);
    var image = src(p.image, absolu);
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;background:#faf8f3;border:1px solid #e2ddd0;">' +
      '<tr><td width="96" style="width:96px;padding:0;line-height:0;vertical-align:top;">' +
      '<a href="' + esc(page) + '"><img src="' + esc(image) + '" width="96" height="96" alt="" style="display:block;width:96px;height:96px;object-fit:cover;border:0;"></a></td>' +
      '<td style="padding:10px 12px;font-family:Georgia,serif;vertical-align:middle;">' +
      '<div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#8b8474;">Exemple du catalogue</div>' +
      '<div style="font-size:16px;color:#17150f;margin-top:3px;">' + esc(p.titre) + '</div>' +
      (p.qui ? '<div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#5c574c;margin-top:2px;">' + esc(p.qui) + (p.style ? ' · ' + esc(p.style) : '') + '</div>' : '') +
      '<a href="' + esc(page) + '" style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#97803c;">Écouter</a>' +
      '</td></tr></table>';
  }

  function signatureHtml(sig, absolu) {
    sig = sig || {};
    var photo = sig.photo ? src(sig.photo, absolu) : '';
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b11;border:1px solid #6b5a2a;">' +
      '<tr><td style="padding:16px 18px;font-family:Helvetica,Arial,sans-serif;">' +
      '<div style="font-family:Georgia,serif;font-size:18px;color:#f6f2e8;">' + esc(sig.nom || 'Melodia Funèbre') + '</div>' +
      (sig.role ? '<div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#d9b862;margin-top:4px;">' + esc(sig.role) + '</div>' : '') +
      '<div style="font-size:13px;color:#ece6d6;margin-top:8px;line-height:1.6;">' +
      (sig.email ? esc(sig.email) + '<br>' : '') +
      (sig.tel ? esc(sig.tel) + '<br>' : '') +
      '<a href="' + SITE + '" style="color:#d9b862;text-decoration:none;">melodia-funebre.fr</a></div>' +
      '</td>' +
      (photo ? '<td width="88" style="width:88px;padding:12px;vertical-align:middle;"><img src="' + esc(photo) + '" width="72" height="72" alt="' + esc(sig.nom || '') + '" style="display:block;width:72px;height:72px;border-radius:50%;object-fit:cover;border:1px solid #d9b862;"></td>' : '') +
      '</tr></table>';
  }

  function boutonHtml(b) {
    if (!b || !b.url || !b.texte) return '';
    return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;"><tr><td align="center" bgcolor="#c9a84c" style="background:#c9a84c;border-radius:2px;">' +
      '<a href="' + esc(b.url) + '" style="display:inline-block;padding:12px 22px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#17150f;text-decoration:none;">' +
      esc(b.texte) + '</a></td></tr></table>';
  }

  function reseauxHtml() {
    /* Un emplacement encore nommé ({{…}}) ne part pas chez le
       prospect : le réseau apparaîtra quand son lien sera renseigné. */
    var cellules = RESEAUX.filter(function (r) {
      return r.url && !/^\{\{/.test(r.url);
    }).map(function (r) {
      var contenu = '<a href="' + esc(r.url) + '" style="color:#97803c;text-decoration:none;">' + esc(r.nom) + '</a>';
      return '<td style="padding:0 14px 8px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.4;color:#5c574c;">' + contenu + '</td>';
    }).join('');
    return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;"><tr>' + cellules + '</tr></table>';
  }

  function habiller(o) {
    var corps = String(o.texte || '').split(/\n{2,}/).map(paragraphe).join('');
    var visuel = src(o.visuel, o.absolu);
    var banniere = src(BANNIERE, o.absolu);
    var pistes = (o.pistes || []).map(function (p) { return cartePiste(p, o.absolu); }).join('');
    var pied = o.pied === 'prospection'
      ? 'Vous recevez ce message dans un cadre professionnel. Pour ne plus être contacté, répondez STOP : votre adresse est retirée.'
      : 'Ce message vous est adressé par Melodia Funèbre. Vous pouvez répondre à ce courriel : une personne le lit.';
    return '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>' + esc(o.sujet || 'Melodia Funèbre') + '</title></head>' +
      '<body style="margin:0;padding:0;background:#f4f1ea;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px;"><tr><td align="center">' +
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #e2ddd0;">' +
      '<tr><td style="background:#07070b;padding:0;line-height:0;"><img src="' + esc(banniere) + '" width="600" height="180" alt="Melodia Funèbre — des hommages en musique" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>' +
      '<tr><td style="height:3px;background:#c9a84c;font-size:0;line-height:0;">&nbsp;</td></tr>' +
      (visuel ? '<tr><td style="padding:0;line-height:0;"><img src="' + esc(visuel) + '" width="600" alt="' + esc(o.visuelAlt || '') + '" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>' : '') +
      '<tr><td style="padding:28px 28px 8px;font-family:Helvetica,Arial,sans-serif;">' +
      (o.titre ? '<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:400;font-size:26px;line-height:1.3;color:#17150f;">' + marque(o.titre) + '</h1>' : '') +
      corps +
      (o.bouton ? boutonHtml(o.bouton) : '') +
      (pistes ? '<div style="margin:8px 0 18px;">' + pistes + '</div>' : '') +
      '</td></tr>' +
      '<tr><td style="padding:6px 18px 22px;">' + signatureHtml(o.signature, o.absolu) + '</td></tr>' +
      (o.reseaux ? '<tr><td style="padding:4px 28px 8px;background:#faf8f3;border-top:1px solid #e2ddd0;">' + reseauxHtml() + '</td></tr>' : '') +
      '<tr><td style="padding:14px 28px 18px;background:#faf8f3;border-top:1px solid #e2ddd0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.55;color:#8b8474;">' + esc(pied) + '</td></tr>' +
      '</table></td></tr></table></body></html>';
  }

  function mailto(email, sujet, texte) {
    var dest = String(email || '').trim();
    if (dest && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(dest)) dest = '';
    var q = 'subject=' + encodeURIComponent(sujet || '') + '&body=' + encodeURIComponent(texte || '');
    return (dest ? 'mailto:' + dest : 'mailto:') + '?' + q;
  }

  window.MelodiaMails = {
    ENVOI_ACTIF: ENVOI_ACTIF,
    SITE: SITE,
    MODELES: MODELES,
    CHAMPS: CHAMPS,
    limace: limace,
    chargerCatalogue: chargerCatalogue,
    pisteParTitre: pisteParTitre,
    urlPublique: urlPublique,
    composer: composer,
    mailto: mailto,
    /* Exposé pour que l’espace sache qu’aucun envoi ne part d’ici. */
    envoi: function () { return false; }
  };
})();
