/* ═══════════════════════════════════════════════════════════════
   MELODIA — L'espace de la famille

   Ce que voit quelqu'un qui a commandé un hommage : où en est-il,
   quand arrive-t-il, comment l'écouter, et comment nous dire quelque
   chose sans reprendre le téléphone.

   Écrit pour un téléphone tenu d'une main, dans les jours qui
   suivent un décès : peu de choses à l'écran, rien à chercher, et la
   prochaine étape toujours annoncée.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var REST = window.MelodiaRest || null;
  var enLigne = function () { return !!(REST && REST.actif); };

  var ETAPES = [
    { id: 'recue',       titre: 'Commande reçue',    dit: 'Nous avons votre demande. Un membre de la maison vous appelle.' },
    { id: 'brief',       titre: 'Entretien fait',    dit: 'Ce que vous nous avez confié est entre les mains du compositeur.' },
    { id: 'composition', titre: 'En composition',    dit: 'Le texte et la mélodie s\'écrivent. Nous relisons chaque étape.' },
    { id: 'livree',      titre: 'Hommage livré',     dit: 'Il est à vous. Écoutez-le, téléchargez-le, gardez-le.' }
  ];

  var TYPES_DEMANDE = {
    revision: 'Demander une correction',
    question: 'Poser une question',
    urgence: 'Signaler une urgence',
    annulation: 'Annuler ma commande',
    autre: 'Autre chose'
  };

  var etat = { commandes: [], demandes: [], vue: 'hommages', ouvert: null };

  /* ─── Le temps qui reste ───
     Une famille ne compte pas en heures ouvrées : elle veut savoir si
     ce sera prêt avant la cérémonie. On dit donc un délai en clair,
     et on ne promet rien qui soit déjà dépassé. */
  function delai(o) {
    if (o.status === 'livree') return { texte: 'Livré', urgent: false, fini: true };
    if (!o.echeance) return { texte: '', urgent: false };
    var reste = new Date(o.echeance) - Date.now();
    if (reste <= 0) return { texte: 'Nous finissons — vous êtes prévenu dès que c\'est prêt', urgent: true };
    var h = Math.floor(reste / 3600000), m = Math.round((reste % 3600000) / 60000);
    if (h >= 24) return { texte: 'Livraison sous ' + Math.round(h / 24) + ' jour(s)', urgent: false };
    if (h >= 1) return { texte: 'Livraison dans environ ' + h + ' h', urgent: h <= 6 };
    return { texte: 'Livraison dans moins d\'une heure', urgent: true };
  }

  function frise(statut) {
    var i = ETAPES.map(function (e) { return e.id; }).indexOf(statut);
    if (i < 0) i = 0;
    return '<ol class="esp-frise">' + ETAPES.map(function (e, k) {
      var cls = k < i ? 'faite' : (k === i ? 'ici' : '');
      return '<li class="' + cls + '">' +
        '<span class="esp-point">' + (k < i ? '✓' : (k + 1)) + '</span>' +
        '<span class="esp-etape"><b>' + esc(e.titre) + '</b>' +
        (k === i ? '<em>' + esc(e.dit) + '</em>' : '') + '</span></li>';
    }).join('') + '</ol>';
  }

  /* Le message est écrit d'avance : une famille en deuil ne doit pas
     avoir à trouver les mots pour expliquer ce qu'elle envoie. */
  function texteProches(o) {
    return 'Voici l\'hommage musical composé pour ' + (o.defunt || 'notre proche') + '.' +
      (o.audio_title ? '\n\n« ' + o.audio_title + ' »' : '') +
      '\n\n' + o.audio_url +
      '\n\nCette œuvre a été écrite pour ' + (o.defunt || 'lui') + ' et pour personne d\'autre. ' +
      'Vous pouvez l\'écouter, la télécharger et la garder.';
  }
  function courrielProches(o) {
    return 'mailto:?subject=' + encodeURIComponent('En souvenir de ' + (o.defunt || 'notre proche')) +
      '&body=' + encodeURIComponent(texteProches(o));
  }

  function lecteur(o) {
    if (!o.audio_url) return '';
    if (/^local:/.test(o.audio_url)) {
      return '<div class="esp-note">Votre hommage est prêt mais n\'a pas encore été déposé en ligne. ' +
             'Nous vous l\'envoyons par courriel — écrivez-nous si vous ne l\'avez pas reçu.</div>';
    }
    var estAudio = /\.(mp3|m4a|wav|ogg|flac)(\?|#|$)/i.test(o.audio_url);
    return '<div class="esp-audio">' +
      (o.audio_title ? '<div class="esp-audio-titre">' + esc(o.audio_title) + '</div>' : '') +
      (estAudio ? '<audio controls preload="none" src="' + esc(o.audio_url) + '"></audio>' : '') +
      '<a class="btn btn-gold btn-block" href="' + esc(o.audio_url) + '" download target="_blank" rel="noopener">' +
        'Télécharger l\'hommage</a>' +
      /* ─── Transmettre aux proches ───
         C'est la demande que les familles nous adressent le plus
         après la livraison : l'envoyer à la tante qui n'a pas pu
         venir, au cousin à l'étranger. Elles le faisaient en nous
         réécrivant. Le partage natif du téléphone est proposé quand
         il existe, le lien copiable partout ailleurs. */
      '<div class="esp-partage">' +
        '<button type="button" class="btn btn-outline btn-sm" data-partager="' + esc(o.ref) + '">' +
          'Envoyer à mes proches</button>' +
        '<a class="btn btn-ghost btn-sm" href="' + esc(courrielProches(o)) + '">Par courriel</a>' +
      '</div>' +
      '<p class="esp-aide">Il est à vous, sans limite : diffusez-le à la cérémonie, copiez-le pour la famille, ' +
        'gardez-le. Aucun droit n\'est à déclarer.</p>' +
    '</div>';
  }

  function carte(o) {
    var d = delai(o);
    var ouvert = etat.ouvert === o.ref;
    var st = (window.MELODIA_STATUS || {})[o.status] || { label: o.status, color: '#888' };
    return '<article class="esp-carte' + (ouvert ? ' ouverte' : '') + '">' +
      '<header class="esp-tete">' +
        '<div style="min-width:0;">' +
          '<h3 class="esp-nom">Hommage à ' + esc(o.defunt || '—') + '</h3>' +
          '<div class="esp-meta">' + esc(o.ref) + ' · ' + esc(o.offer || '') +
            (o.urgence ? ' · <span class="esp-urgence">urgence</span>' : '') + '</div>' +
        '</div>' +
        '<span class="pill" style="color:' + st.color + ';border-color:' + st.color + '55;">' +
          esc(st.label) + '</span>' +
      '</header>' +
      (d.texte ? '<div class="esp-delai' + (d.urgent ? ' presse' : '') + (d.fini ? ' fini' : '') + '">' +
        esc(d.texte) + '</div>' : '') +
      frise(o.status) +
      lecteur(o) +
      '<button type="button" class="esp-plus" data-detail="' + esc(o.ref) + '">' +
        (ouvert ? 'Replier' : 'Voir le détail de ma commande') + '</button>' +
      (ouvert ? detail(o) : '') +
      '<div class="esp-actions">' +
        '<button type="button" class="btn btn-outline btn-sm" data-demande="' + esc(o.ref) + '">Nous écrire</button>' +
      '</div>' +
    '</article>';
  }

  function ligne(l, v) {
    return v ? '<div class="esp-ligne"><span>' + esc(l) + '</span><b>' + esc(v) + '</b></div>' : '';
  }

  function detail(o) {
    var opts = Array.isArray(o.options) ? o.options : [];
    return '<div class="esp-detail">' +
      ligne('Commandé le', new Date(o.created_at).toLocaleDateString('fr-FR',
        { day: 'numeric', month: 'long', year: 'numeric' })) +
      ligne('Offre', o.offer) +
      ligne('Montant', (o.price || 0) + ' €') +
      ligne('Réglé', o.paid ? 'Oui' : (o.paypal_id === 'paypalme' ? 'Paiement envoyé, en cours de vérification' : 'Pas encore')) +
      ligne('Style', o.style) +
      ligne('Ce que vous nous avez dit', [o.traits, o.metier, o.habitude].filter(Boolean).join(' · ')) +
      (opts.length ? '<div class="esp-ligne"><span>Options</span><b>' +
        esc(opts.map(function (x) { return x.titre || x; }).join(', ')) + '</b></div>' : '') +
    '</div>';
  }

  /* ─── Les demandes ─── */
  function carteDemande(d) {
    var etats = { ouverte: ['Envoyée', 'amber'], vue: ['Lue', 'cyan'],
                  traitee: ['Traitée', 'green'], refusee: ['Sans suite', 'dust'] };
    var e = etats[d.statut] || etats.ouverte;
    return '<article class="esp-carte">' +
      '<header class="esp-tete">' +
        '<div style="min-width:0;"><h3 class="esp-nom">' + esc(TYPES_DEMANDE[d.type] || d.type) + '</h3>' +
        '<div class="esp-meta">' + (d.ref ? esc(d.ref) + ' · ' : '') +
          new Date(d.created_at).toLocaleDateString('fr-FR') + '</div></div>' +
        '<span class="pill" style="color:var(--' + e[1] + ');border-color:var(--' + e[1] + ');">' + e[0] + '</span>' +
      '</header>' +
      '<p class="esp-message">' + esc(d.message) + '</p>' +
      (d.reponse ? '<div class="esp-reponse"><b>Notre réponse</b><p>' + esc(d.reponse) + '</p></div>' : '') +
    '</article>';
  }

  /* ═══ Rendu ═══ */
  function rendre() {
    var hote = $('esp-root');
    var u = window.MelodiaAuth.current() || {};
    var enCours = etat.commandes.filter(function (o) { return o.status !== 'livree'; });

    var h = '<div class="esp-bonjour">' +
      '<div class="eyebrow">Votre espace</div>' +
      '<h1 class="h-xl">Bonjour <em>' + esc((u.name || '').split(' ')[0] || 'à vous') + '</em></h1>' +
      '<p class="esp-sous">' +
        (etat.commandes.length
          ? (enCours.length
              ? enCours.length + ' hommage' + (enCours.length > 1 ? 's' : '') + ' en cours de composition.'
              : 'Tous vos hommages sont livrés.')
          : 'Vous n\'avez pas encore de commande.') +
      '</p></div>';

    h += '<nav class="esp-onglets">' +
      [['hommages', 'Mes hommages', etat.commandes.length],
       ['demandes', 'Mes demandes', etat.demandes.length],
       ['compte', 'Mon compte', null]].map(function (t) {
        return '<button type="button" class="esp-onglet' + (etat.vue === t[0] ? ' actif' : '') +
          '" data-vue="' + t[0] + '">' + esc(t[1]) +
          (t[2] ? '<span class="esp-compte">' + t[2] + '</span>' : '') + '</button>';
      }).join('') + '</nav>';

    h += '<div class="esp-corps">';
    if (etat.vue === 'hommages') {
      h += etat.commandes.length
        ? etat.commandes.map(carte).join('')
        : '<div class="esp-vide">' +
            '<p>Aucune commande à votre nom pour l\'instant.</p>' +
            '<p class="esp-aide">Si vous venez de commander, laissez une minute à la page — ' +
              'ou vérifiez que vous utilisez bien l\'adresse donnée lors de la commande.</p>' +
            '<a href="/offres" class="btn btn-gold">Commander un hommage</a>' +
          '</div>';
    } else if (etat.vue === 'demandes') {
      h += '<div class="esp-actions" style="margin-bottom:1.4rem;">' +
        '<button type="button" class="btn btn-gold" data-demande="">Nouvelle demande</button></div>';
      h += etat.demandes.length
        ? etat.demandes.map(carteDemande).join('')
        : '<div class="esp-vide"><p>Aucune demande.</p>' +
          '<p class="esp-aide">Une correction à demander, une question, une cérémonie avancée : ' +
            'écrivez-nous ici, c\'est suivi et daté.</p></div>';
    } else {
      h += vueCompte(u);
    }
    h += '</div>';
    h += '<div id="esp-modale"></div>';

    hote.innerHTML = h;
    brancher();
  }

  function vueCompte(u) {
    var E = window.MelodiaEmpreinte;
    return '<div class="esp-carte">' +
      ligne('Nom', u.name) + ligne('Adresse', u.email) +
      '<div id="esp-empreinte" class="esp-empreinte"></div>' +
      '<div class="esp-actions" style="margin-top:1.4rem;">' +
        '<a href="/contact" class="btn btn-outline btn-sm">Nous joindre</a>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="esp-sortir">Se déconnecter</button>' +
      '</div></div>';
  }

  /* ═══ La demande, en fenêtre ═══ */
  function ouvrirDemande(ref) {
    var choix = Object.keys(TYPES_DEMANDE).map(function (t) {
      return '<option value="' + t + '">' + esc(TYPES_DEMANDE[t]) + '</option>';
    }).join('');
    var cmds = etat.commandes.map(function (o) {
      return '<option value="' + esc(o.ref) + '"' + (o.ref === ref ? ' selected' : '') + '>' +
        esc(o.ref + ' — ' + (o.defunt || '')) + '</option>';
    }).join('');
    $('esp-modale').innerHTML =
      '<div class="esp-voile" id="esp-voile"><div class="esp-fenetre" role="dialog" aria-modal="true" aria-label="Nouvelle demande">' +
        '<h3 class="h-lg">Nous écrire</h3>' +
        '<p class="esp-aide">Nous répondons sous deux heures ouvrées, et sept jours sur sept en cas d\'urgence.</p>' +
        '<div class="field"><label class="field-label" for="dm-type">Votre demande</label>' +
          '<select class="field-select" id="dm-type">' + choix + '</select></div>' +
        (cmds ? '<div class="field"><label class="field-label" for="dm-ref">Hommage concerné</label>' +
          '<select class="field-select" id="dm-ref"><option value="">Aucun en particulier</option>' + cmds + '</select></div>' : '') +
        '<div class="field"><label class="field-label" for="dm-msg">Votre message</label>' +
          '<textarea class="field-area" id="dm-msg" rows="5" placeholder="Dites-nous ce dont vous avez besoin."></textarea></div>' +
        '<div class="form-msg" id="dm-msg-etat"></div>' +
        '<div class="esp-actions">' +
          '<button type="button" class="btn btn-gold" id="dm-envoyer">Envoyer</button>' +
          '<button type="button" class="btn btn-ghost" id="dm-fermer">Annuler</button>' +
        '</div>' +
      '</div></div>';

    var fermer = function () { $('esp-modale').innerHTML = ''; };
    $('dm-fermer').addEventListener('click', fermer);
    $('esp-voile').addEventListener('click', function (e) { if (e.target.id === 'esp-voile') fermer(); });
    document.addEventListener('keydown', function esc2(e) {
      if (e.key === 'Escape') { fermer(); document.removeEventListener('keydown', esc2); }
    });
    $('dm-msg').focus();

    $('dm-envoyer').addEventListener('click', async function () {
      var b = this, m = $('dm-msg-etat');
      var texte = $('dm-msg').value.trim();
      if (!texte) { m.className = 'form-msg err'; m.textContent = 'Dites-nous ce dont vous avez besoin.'; return; }
      b.disabled = true; b.textContent = 'Envoi…';
      try {
        var u = window.MelodiaAuth.current() || {};
        var d = {
          id: 'DEM-' + Date.now().toString(36).toUpperCase().slice(-6),
          ref: ($('dm-ref') ? $('dm-ref').value : '') || '',
          email: u.email || '', nom: u.name || '',
          type: $('dm-type').value, message: texte
        };
        await REST.appel('/rest/v1/demandes', {
          method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(d)
        });
        /* Prévenir la maison sans attendre : l'écran ne doit pas
           dépendre d'un service de messagerie. */
        fetch('/api/lead', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'demande', ref: d.ref || d.id, nom: d.nom, email: d.email,
            offre: TYPES_DEMANDE[d.type] || d.type, message: texte, page: location.pathname
          })
        }).catch(function () {});
        d.statut = 'ouverte'; d.reponse = ''; d.created_at = new Date().toISOString();
        etat.demandes.unshift(d);
        etat.vue = 'demandes';
        fermer(); rendre();
        if (window.melodiaToast) window.melodiaToast('Votre demande est envoyée. Nous revenons vers vous.');
      } catch (e) {
        b.disabled = false; b.textContent = 'Envoyer';
        m.className = 'form-msg err';
        m.textContent = 'Envoi impossible : ' + e.message +
          '. Vous pouvez aussi écrire à contact@melodia-funebre.fr.';
      }
    });
  }

  function brancher() {
    var hote = $('esp-root');
    hote.querySelectorAll('[data-vue]').forEach(function (b) {
      b.addEventListener('click', function () { etat.vue = b.dataset.vue; rendre(); });
    });
    hote.querySelectorAll('[data-detail]').forEach(function (b) {
      b.addEventListener('click', function () {
        etat.ouvert = etat.ouvert === b.dataset.detail ? null : b.dataset.detail;
        rendre();
      });
    });
    hote.querySelectorAll('[data-demande]').forEach(function (b) {
      b.addEventListener('click', function () { ouvrirDemande(b.dataset.demande); });
    });

    /* Le partage natif ouvre l'application que la famille utilise déjà
       — messages, WhatsApp, courriel. Là où il n'existe pas, on copie
       le lien et on le dit : un bouton qui ne fait rien de visible
       laisse croire à une panne. */
    hote.querySelectorAll('[data-partager]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var o = etat.commandes.filter(function (x) { return x.ref === b.dataset.partager; })[0];
        if (!o || !o.audio_url) return;
        var titre = 'En souvenir de ' + (o.defunt || 'notre proche');
        if (navigator.share) {
          try { await navigator.share({ title: titre, text: texteProches(o), url: o.audio_url }); return; }
          catch (e) { if (e && e.name === 'AbortError') return; }
        }
        var dire = function (t) {
          var avant = b.textContent;
          b.textContent = t;
          setTimeout(function () { b.textContent = avant; }, 2200);
        };
        try {
          await navigator.clipboard.writeText(texteProches(o));
          dire('Lien copié — collez-le où vous voulez');
        } catch (e) {
          dire('Copie impossible : utilisez « Par courriel »');
        }
      });
    });
    var sortir = hote.querySelector('#esp-sortir');
    if (sortir) sortir.addEventListener('click', function () {
      window.MelodiaAuth.logout(); location.href = '/compte';
    });
    if (etat.vue === 'compte' && window.MelodiaEmpreinte) blocEmpreinte();
  }

  /* ─── L'empreinte, proposée dans la page ─── */
  async function blocEmpreinte() {
    var z = $('esp-empreinte');
    if (!z) return;
    var E = window.MelodiaEmpreinte;
    var dispo = false;
    try { dispo = await E.disponible(); } catch (e) {}
    if (!dispo) {
      z.innerHTML = '<div class="esp-ligne"><span>Ouverture rapide</span>' +
        '<b style="color:var(--dust);">Cet appareil ne sait pas lire d\'empreinte</b></div>';
      return;
    }
    if (E.enrole()) {
      z.innerHTML = '<div class="esp-ligne"><span>Ouverture rapide</span>' +
        '<b style="color:var(--green);">Active sur cet appareil</b></div>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="esp-oublier">Retirer l\'empreinte de cet appareil</button>';
      $('esp-oublier').addEventListener('click', function () {
        if (!confirm('Vous devrez de nouveau saisir votre mot de passe sur cet appareil. Continuer ?')) return;
        E.oublier(); blocEmpreinte();
      });
      return;
    }
    z.innerHTML = '<div class="esp-ligne"><span>Ouverture rapide</span>' +
      '<b style="color:var(--amber);">Non activée</b></div>' +
      '<p class="esp-aide">Activez-la et votre espace s\'ouvrira d\'un doigt, sans mot de passe. ' +
        'La session est chiffrée sur cet appareil et ne s\'y rouvre qu\'après vérification.</p>' +
      '<button type="button" class="btn btn-outline btn-sm" id="esp-activer">Activer l\'empreinte</button>' +
      '<div class="form-msg" id="esp-emp-etat"></div>';
    $('esp-activer').addEventListener('click', async function () {
      var b = this, m = $('esp-emp-etat');
      b.disabled = true; b.textContent = 'Suivez votre appareil…';
      try {
        await E.activer((window.MelodiaAuth.current() || {}).name || '');
        blocEmpreinte();
        if (window.melodiaToast) window.melodiaToast('Empreinte activée sur cet appareil.');
      } catch (e) {
        b.disabled = false; b.textContent = 'Activer l\'empreinte';
        m.className = 'form-msg err'; m.textContent = e.message;
      }
    });
  }

  /* ═══ Montage ═══ */
  async function monter() {
    var hote = $('esp-root');
    if (!hote) return;
    hote.innerHTML = '<div class="status-live" style="display:inline-flex;">Chargement de votre espace…</div>';
    try {
      etat.commandes = await window.MelodiaDB.mine();
      etat.demandes = enLigne()
        ? ((await REST.appel('/rest/v1/demandes?select=*&order=created_at.desc')) || [])
        : [];
    } catch (e) {
      hote.innerHTML = '<div class="form-msg err" style="display:block;">' +
        'Vos données n\'ont pas pu être chargées : ' + esc(e.message) + '.<br>' +
        'Réessayez dans un instant, ou écrivez-nous à contact@melodia-funebre.fr.</div>';
      return;
    }
    rendre();
    /* Un hommage en composition avance sans qu'on touche à rien : la
       page se relit toute seule plutôt que d'obliger à rafraîchir. */
    setInterval(async function () {
      if (document.hidden) return;
      try {
        var neuf = await window.MelodiaDB.mine();
        if (JSON.stringify(neuf) !== JSON.stringify(etat.commandes)) {
          etat.commandes = neuf;
          rendre();
        }
      } catch (e) {}
    }, 45000);
  }

  window.MelodiaEspace = { monter: monter };
})();
