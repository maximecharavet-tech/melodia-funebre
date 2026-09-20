/* ═══════════════════════════════════════════════════════════════
   LA PAGE QUE LE QR OUVRE

   C'est la seule page qui compte vraiment : quelqu'un scanne un carré
   collé sur une carte, parfois des années après, et doit voir un
   message. Trois règles en découlent.

   1. RIEN NE DOIT LA FAIRE ÉCHOUER SILENCIEUSEMENT. Un jeton inconnu,
      un message retiré, une panne de réseau : chaque cas a sa phrase.
      Une page blanche serait la pire des réponses.

   2. LE TEXTE EST INSÉRÉ COMME DU TEXTE, JAMAIS COMME DU HTML.
      Le message vient d'un collègue, mais il passe par une base :
      « textContent » et rien d'autre. Un mot d'adieu ne doit pas
      pouvoir exécuter quoi que ce soit.

   3. L'ADRESSE DU MÉDIA EST VÉRIFIÉE. On n'affiche un fichier que
      s'il vient de notre propre espace de stockage. Sans ce contrôle,
      une ligne fabriquée pourrait faire charger n'importe quoi depuis
      n'importe où.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var C = window.MOT_CONFIG || {};
  var lettre = document.getElementById('lettre');
  var pied = document.getElementById('pied');

  /* L'adresse peut prendre deux formes : « /a/<jeton> », servie par
     une réécriture, ou « /a.html?j=<jeton> » en secours. */
  function jetonDeLAdresse() {
    var parametres = new URLSearchParams(location.search);
    var direct = parametres.get('j');
    if (direct) return direct.trim();
    var morceaux = location.pathname.split('/').filter(Boolean);
    return morceaux.length ? decodeURIComponent(morceaux[morceaux.length - 1]).trim() : '';
  }

  function vider() {
    var s = document.getElementById('squelette');
    if (s) s.remove();
  }

  function element(balise, classe, texte) {
    var e = document.createElement(balise);
    if (classe) e.className = classe;
    if (texte !== undefined) e.textContent = texte;   /* jamais innerHTML */
    return e;
  }

  function annoncer(titre, explication) {
    vider();
    lettre.appendChild(element('h1', 'signataire', titre));
    if (explication) lettre.appendChild(element('p', 'le-mot', explication));
  }

  /* Le fichier doit venir de notre espace, et de nulle part ailleurs. */
  function adresseDeConfiance(url) {
    if (!url) return false;
    var attendu = C.SUPABASE_URL + '/storage/v1/object/public/' + C.ESPACE + '/';
    return typeof url === 'string' && url.indexOf(attendu) === 0;
  }

  function enFrancais(iso) {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) { return ''; }
  }

  function afficher(m, jeton) {
    vider();
    document.title = 'Un mot de ' + m.auteur;

    /* « Pour Camille » se place APRÈS le sur-titre, pas avant : ancré
       sur « lettre.firstChild », on tombait sur un nœud de texte et la
       ligne remplaçait le sur-titre en tête de page. On vise donc
       l'élément lui-même. */
    if (m.pour) {
      var surTitre = lettre.querySelector('.de-la-part');
      var ligne = element('p', 'destinataire', 'Pour ' + m.pour);
      if (surTitre && surTitre.nextSibling) lettre.insertBefore(ligne, surTitre.nextSibling);
      else lettre.appendChild(ligne);
    }
    lettre.appendChild(element('h1', 'signataire', m.auteur));

    if (m.mot) lettre.appendChild(element('p', 'le-mot', m.mot));

    if (m.media_url && adresseDeConfiance(m.media_url)) {
      var bloc = element('div', 'media');
      var type = m.media_type;

      if (type === 'photo') {
        var img = element('img');
        img.src = m.media_url;
        img.alt = 'Photo laissée par ' + m.auteur;
        img.loading = 'lazy';
        img.decoding = 'async';
        bloc.appendChild(img);
      } else if (type === 'video') {
        var v = element('video');
        v.src = m.media_url;
        v.controls = true;
        v.playsInline = true;
        v.preload = 'metadata';
        v.setAttribute('aria-label', 'Vidéo laissée par ' + m.auteur);
        bloc.appendChild(v);
      } else if (type === 'audio') {
        var a = element('audio');
        a.src = m.media_url;
        a.controls = true;
        a.preload = 'metadata';
        a.setAttribute('aria-label', 'Message vocal laissé par ' + m.auteur);
        bloc.appendChild(a);
      }
      if (bloc.childNodes.length) lettre.appendChild(bloc);
    } else if (m.media_url) {
      /* Une adresse qui ne vient pas de notre espace : on ne l'affiche
         pas, et on le dit plutôt que de faire comme si de rien n'était. */
      lettre.appendChild(element('p', 'aide', 'Un fichier était joint, mais il ne provient pas de cet espace : il n’a pas été affiché.'));
    }

    var date = enFrancais(m.cree_le);
    if (date) {
      lettre.appendChild(element('hr', 'filet'));
      lettre.appendChild(element('p', 'de-la-part', 'Déposé le ' + date));
    }

    /* Le lien de retrait n'apparaît que si l'on arrive avec la clé
       d'édition — c'est-à-dire pour son auteur, et personne d'autre. */
    var edition = new URLSearchParams(location.search).get('retirer');
    if (edition && edition.length === 22) proposerRetrait(jeton, edition);

    pied.textContent = 'Ce message restera à cette adresse.';
  }

  function proposerRetrait(jeton, edition) {
    var b = element('button', 'retrait-lien', 'Retirer ce message');
    b.type = 'button';
    b.addEventListener('click', function () {
      if (!window.confirm('Retirer ce message ? Le QR code déjà imprimé affichera qu’il a été retiré.')) return;
      b.disabled = true;
      b.textContent = 'Retrait en cours…';
      appeler('retirer_adieu', { j: jeton, e: edition }).then(function (ok) {
        if (ok === true) location.href = location.pathname;
        else { b.disabled = false; b.textContent = 'Le retrait a échoué'; }
      }).catch(function () {
        b.disabled = false;
        b.textContent = 'Le retrait a échoué';
      });
    });
    var p = element('p');
    p.style.marginTop = '1.2rem';
    p.appendChild(b);
    lettre.appendChild(p);
  }

  function appeler(nom, corps) {
    return fetch(C.SUPABASE_URL + '/rest/v1/rpc/' + nom, {
      method: 'POST',
      headers: {
        apikey: C.SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(corps)
    }).then(function (r) {
      if (!r.ok) throw new Error('Erreur ' + r.status);
      return r.json();
    });
  }

  var jeton = jetonDeLAdresse();

  if (!jeton || jeton.length !== 22) {
    annoncer(
      'Ce lien est incomplet.',
      'Il manque une partie de l’adresse. Rescannez le QR code en cadrant bien les quatre coins du carré.'
    );
    return;
  }

  appeler('adieu', { j: jeton }).then(function (lignes) {
    var m = Array.isArray(lignes) ? lignes[0] : lignes;
    if (!m) {
      annoncer(
        'Ce message n’est plus là.',
        'Il a été retiré par la personne qui l’avait déposé, ou ce QR code n’a jamais mené ici.'
      );
      pied.textContent = '';
      return;
    }
    afficher(m, jeton);
  }).catch(function () {
    annoncer(
      'Le message n’a pas pu être chargé.',
      'La connexion n’a pas abouti. Réessayez dans un instant — le message, lui, est toujours là.'
    );
    var b = element('button', 'btn btn-creux', 'Réessayer');
    b.type = 'button';
    b.style.marginTop = '1.2rem';
    b.addEventListener('click', function () { location.reload(); });
    lettre.appendChild(b);
  });
})();
