/* ═══════════════════════════════════════════════════════════════
   commercial-boite.js — La boîte @melodia-funebre.fr du collaborateur

   POURQUOI CETTE PAGE

   Un collaborateur qui démarche des pompes funèbres depuis une adresse
   personnelle en gmail.com perd la moitié de sa crédibilité avant
   d'avoir été lu. L'adresse professionnelle est un outil de vente
   autant qu'un outil technique. Encore faut-il savoir la brancher :
   c'est ce que personne ne prend le temps d'écrire, et ce qui fait
   qu'une boîte payée reste inutilisée pendant des mois.

   CE QUE CETTE PAGE FAIT, ET CE QU'ELLE NE FAIT PAS

   Elle ne crée aucune boîte. La création se fait dans l'espace client
   OVH, par le fondateur, et rien dans une page web ne peut le faire à
   sa place. La page donne les réglages exacts, la marche à suivre pour
   chaque appareil, et de quoi les recopier sans faute de frappe.

   D'OÙ VIENNENT LES RÉGLAGES

   Ce sont ceux de l'offre MX Plan, celle qui est incluse avec un nom
   de domaine OVH. Les autres offres OVH ont d'autres serveurs — Email
   Pro et Exchange notamment — c'est pourquoi les valeurs sont
   modifiables dans les réglages de la maison plutôt que gravées ici.
   Le fondateur les corrige une fois, tout le monde en profite.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* Réglages de l'offre MX Plan, celle incluse avec un domaine OVH.
     Le fondateur les remplace dans « Réglages » s'il prend une autre
     offre : Email Pro et Exchange utilisent d'autres serveurs. */
  var DEFAUTS = {
    imapServeur: 'ssl0.ovh.net', imapPort: 993, imapChiffrement: 'SSL/TLS',
    smtpServeur: 'ssl0.ovh.net', smtpPort: 465, smtpChiffrement: 'SSL/TLS',
    webmail: 'https://www.ovhcloud.com/fr/mail/',
    offre: 'OVH MX Plan'
  };

  function reg(cle) {
    var I = window.MelodiaIntranet;
    if (I && I.reglages && I.reglages.vives && I.reglages.vives[cle] !== undefined) {
      return I.reglages.vives[cle];
    }
    return DEFAUTS[cle];
  }

  function moi() {
    var u = (window.MelodiaAuth && window.MelodiaAuth.current()) || {};
    return { email: u.email || '', nom: u.name || u.nom || '' };
  }

  /* ─── Un réglage qui se recopie ───
     Une adresse de serveur recopiée à la main est une faute de frappe
     en attente, et le message d'erreur d'un client de messagerie ne
     dit jamais laquelle. D'où le bouton, et le clic sur la valeur. */
  function champ(l, v, aide) {
    return '<div class="bo-champ">' +
      '<div class="bo-l">' + esc(l) + '</div>' +
      '<button type="button" class="bo-v" data-copier="' + esc(v) + '" title="Copier">' +
        '<span>' + esc(v) + '</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
          '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
      '</button>' +
      (aide ? '<div class="bo-aide">' + esc(aide) + '</div>' : '') +
    '</div>';
  }

  /* Les trois parcours, dans l'ordre où on les rencontre : le
     téléphone d'abord, parce que c'est là qu'on lit ses messages entre
     deux rendez-vous. */
  function parcours(m) {
    return [
      {
        id: 'tel', nom: 'Sur le téléphone', duree: '3 minutes',
        ico: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
        intro: 'Le plus important : c\'est là que vous lirez les réponses des agences, souvent dans la voiture entre deux rendez-vous.',
        etapes: [
          ['iPhone', 'Réglages → Applications → Mail → Comptes Mail → Ajouter un compte → Autre → Ajouter un compte Mail.'],
          ['Android', 'Ouvrez Gmail → votre portrait en haut à droite → Ajouter un autre compte → Autre.'],
          ['Ensuite, pour les deux', 'Saisissez l\'adresse et le mot de passe ci-dessus. Si l\'appareil ne trouve pas les réglages tout seul, choisissez <b>IMAP</b> et recopiez les serveurs de la colonne de droite.'],
          ['Le piège', 'L\'identifiant est <b>l\'adresse complète</b>, pas seulement ce qui précède l\'arobase. C\'est l\'erreur qui fait échouer neuf configurations sur dix.']
        ]
      },
      {
        id: 'outlook', nom: 'Dans Outlook', duree: '4 minutes',
        ico: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
        intro: 'Sur ordinateur, pour rédiger confortablement les messages de prospection.',
        etapes: [
          ['Ajouter le compte', 'Fichier → Informations → Ajouter un compte. Saisissez ' + (m.email || 'votre adresse') + '.'],
          ['Choisir le type', 'Si Outlook propose plusieurs types, choisissez <b>IMAP</b> — jamais POP. IMAP garde vos messages sur le serveur, donc lisibles aussi depuis le téléphone. POP les télécharge et les efface du serveur : vous ne les retrouveriez nulle part ailleurs.'],
          ['Les serveurs', 'Recopiez entrant et sortant depuis la colonne de droite. Cochez « Le serveur sortant requiert une authentification », avec les mêmes identifiants que l\'entrant.'],
          ['La signature', 'Fichier → Options → Courrier → Signatures. Le bloc à coller est plus bas sur cette page.']
        ]
      },
      {
        id: 'gmail', nom: 'Depuis Gmail', duree: '5 minutes',
        ico: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
        intro: 'Pour recevoir et <b>envoyer</b> depuis votre adresse professionnelle sans quitter Gmail. C\'est la solution la plus confortable si Gmail est déjà votre habitude.',
        etapes: [
          ['Recevoir', 'Gmail → roue dentée → Voir tous les paramètres → onglet <b>Comptes et importation</b> → « Consulter d\'autres comptes » → Ajouter un compte de messagerie. Saisissez l\'adresse, puis les réglages IMAP.'],
          ['Envoyer — l\'étape à ne pas sauter', 'Même onglet → « Envoyer des e-mails en tant que » → Ajouter une autre adresse. Renseignez les réglages <b>SMTP</b>. Sans cela vous recevez sur l\'adresse professionnelle mais répondez depuis votre adresse personnelle, ce qui ruine l\'effet.'],
          ['Par défaut', 'Toujours dans cet onglet, cliquez « Définir par défaut » à côté de l\'adresse professionnelle. Sinon un message écrit vite partira de la mauvaise adresse.'],
          ['Vérifier', 'Gmail envoie un code de confirmation à l\'adresse professionnelle : relevez-la une première fois par le webmail pour le récupérer.']
        ]
      }
    ];
  }

  function signature(m) {
    return [
      m.nom || 'Prénom Nom',
      'Melodia Funèbre — composition musicale pour cérémonies',
      m.email || 'prenom@melodia-funebre.fr',
      'melodia-funebre.fr'
    ].join('\n');
  }

  function vue() {
    var m = moi();
    var pro = /@melodia-funebre\.fr$/i.test(m.email);

    var h = '<div class="panel bo-tete">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">Votre <em>adresse professionnelle</em></div>' +
        '<div class="panel-sub">' + esc(reg('offre')) + '</div>' +
      '</div></div>' +
      '<p class="panel-note">Une agence funéraire reçoit chaque semaine des sollicitations. ' +
      'Une adresse au nom de la maison est lue ; une adresse personnelle est classée avec le reste. ' +
      'Cette page contient tout ce qu\'il faut pour brancher la vôtre — sur le téléphone d\'abord.</p>' +

      (pro
        ? '<div class="bo-identite">' +
            '<div class="bo-pastille">✓</div>' +
            '<div><div class="bo-adresse">' + esc(m.email) + '</div>' +
            '<div class="bo-note">Votre adresse professionnelle. Le mot de passe est celui que le fondateur vous a transmis ; ' +
            'il n\'est écrit nulle part sur cette page, et personne ne peut le relire à votre place.</div></div>' +
          '</div>'
        : '<div class="form-msg info" style="display:block;">' +
            '<b>Vous êtes connecté avec ' + esc(m.email || 'une adresse extérieure') + '.</b><br>' +
            'Votre boîte au nom de la maison n\'est pas encore ouverte, ou votre compte n\'a pas été créé avec elle. ' +
            'Demandez-la au fondateur : il la crée dans l\'espace client OVH, puis vous transmet le mot de passe. ' +
            'Les réglages ci-dessous vous serviront le jour même.</div>') +
    '</div>';

    /* ─── Les réglages, à droite de la marche à suivre ─── */
    h += '<div class="bo-grille">' +
      '<div class="panel bo-reglages">' +
        '<div class="panel-title" style="font-size:1.1rem;">Les <em>réglages</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.2rem;">À recopier tels quels</div>' +

        '<div class="bo-bloc"><div class="bo-bloc-t">Identifiant</div>' +
          champ('Nom d\'utilisateur', m.email || 'votre adresse complète',
                'L\'adresse entière, arobase comprise.') +
        '</div>' +

        '<div class="bo-bloc"><div class="bo-bloc-t">Courrier entrant — IMAP</div>' +
          champ('Serveur', reg('imapServeur')) +
          champ('Port', reg('imapPort')) +
          champ('Chiffrement', reg('imapChiffrement')) +
        '</div>' +

        '<div class="bo-bloc"><div class="bo-bloc-t">Courrier sortant — SMTP</div>' +
          champ('Serveur', reg('smtpServeur')) +
          champ('Port', reg('smtpPort')) +
          champ('Chiffrement', reg('smtpChiffrement'),
                'Authentification requise, mêmes identifiants que l\'entrant.') +
        '</div>' +

        '<a class="btn btn-outline btn-sm bo-webmail" href="' + esc(reg('webmail')) + '" target="_blank" rel="noopener">' +
          'Ouvrir le webmail OVH</a>' +
        '<p class="bo-secours">Le webmail dépanne toujours : il ne demande aucun réglage, ' +
        'seulement l\'adresse et le mot de passe. Utilisez-le en attendant d\'avoir branché le reste.</p>' +
      '</div>' +

      '<div class="bo-parcours">' +
        parcours(m).map(function (p, i) {
          return '<div class="panel bo-etape" style="--i:' + i + ';">' +
            '<div class="bo-etape-tete">' +
              '<span class="bo-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' + p.ico + '</svg></span>' +
              '<div><div class="panel-title" style="font-size:1.15rem;">' + esc(p.nom) + '</div>' +
              '<div class="panel-sub">' + esc(p.duree) + '</div></div>' +
            '</div>' +
            '<p class="bo-intro">' + p.intro + '</p>' +
            '<ol class="bo-liste">' +
              p.etapes.map(function (e) {
                return '<li><b>' + esc(e[0]) + '</b><span>' + e[1] + '</span></li>';
              }).join('') +
            '</ol>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';

    /* ─── La signature ─── */
    h += '<div class="panel">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">Votre <em>signature</em></div>' +
        '<div class="panel-sub">À coller dans les réglages de votre messagerie</div>' +
      '</div>' +
      '<button class="btn btn-gold btn-sm" data-copier-sig>Copier la signature</button></div>' +
      '<p class="panel-note">Quatre lignes, sans logo ni image : les images sont bloquées par défaut ' +
      'chez la plupart des destinataires professionnels, et une signature à trous fait mauvaise impression.</p>' +
      '<pre class="bo-signature" id="bo-sig">' + esc(signature(m)) + '</pre>' +
    '</div>';

    /* ─── Ce que le fondateur doit faire, si la boîte n'existe pas ─── */
    h += '<div class="panel">' +
      '<div class="panel-title">Si la boîte n\'existe <em>pas encore</em></div>' +
      '<div class="panel-sub" style="margin-bottom:1rem;">Côté fondateur, dans l\'espace client OVH</div>' +
      '<ol class="bo-liste bo-liste-ovh">' +
        '<li><b>Espace client OVH</b><span>Web Cloud → Emails → le domaine melodia-funebre.fr.</span></li>' +
        '<li><b>Ajouter un compte</b><span>Renseignez prenom@melodia-funebre.fr et un mot de passe solide.</span></li>' +
        '<li><b>Transmettre</b><span>L\'adresse et le mot de passe, de la main à la main. Le collaborateur les change à sa première connexion au webmail.</span></li>' +
        '<li><b>Vérifier l\'envoi</b><span>Envoyez-vous un message depuis la nouvelle boîte : s\'il arrive en indésirables, les enregistrements SPF et DKIM du domaine sont à revoir chez OVH.</span></li>' +
      '</ol>' +
    '</div>';

    return h;
  }

  /* Le retour visuel du copier compte autant que le copier lui-même :
     sans lui, on ne sait pas si le clic a pris et on recopie à la
     main, ce qui était exactement le problème. */
  function copier(texte, bouton) {
    var fini = function (ok) {
      if (!bouton) return;
      bouton.classList.add(ok ? 'copie' : 'rate');
      setTimeout(function () { bouton.classList.remove('copie', 'rate'); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(function () { fini(true); }, function () { fini(false); });
      return;
    }
    /* Repli pour les navigateurs anciens et les pages non sécurisées */
    try {
      var z = document.createElement('textarea');
      z.value = texte; z.style.position = 'fixed'; z.style.opacity = '0';
      document.body.appendChild(z); z.select();
      document.execCommand('copy'); document.body.removeChild(z);
      fini(true);
    } catch (e) { fini(false); }
  }

  function brancher() {
    document.querySelectorAll('[data-copier]').forEach(function (b) {
      b.addEventListener('click', function () { copier(b.dataset.copier, b); });
    });
    var sig = document.querySelector('[data-copier-sig]');
    if (sig) sig.addEventListener('click', function () {
      var p = document.getElementById('bo-sig');
      copier(p ? p.textContent : '', sig);
    });
  }

  window.MelodiaBoite = { vue: vue, brancher: brancher, defauts: DEFAUTS };
})();
