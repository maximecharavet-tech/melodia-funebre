/* ═══════════════════════════════════════════════════════════════
   LA CARTE COLLECTIVE

   C'est ce que scanne la personne qui s'en va. Pas un message : tous
   les messages, d'un coup, dans l'ordre où ils ont été déposés.

   ELLE SUIT LES MÊMES TROIS RÈGLES QUE « lire.js »

   1. Aucun échec silencieux. Un jeton inconnu, une carte vide, une
      panne de réseau : chaque cas a sa phrase. Une page blanche
      serait la pire des réponses — surtout celle-là, qu'on ouvre
      devant les collègues le jour du pot de départ.

   2. Le texte est inséré comme du texte, jamais comme du HTML.
      Quinze personnes ont écrit dans cette page. « textContent » et
      rien d'autre.

   3. L'adresse de chaque fichier est vérifiée : on n'affiche que ce
      qui vient de notre propre espace de stockage.

   ET UNE QUATRIÈME, QUI N'EXISTE QUE SUR CETTE PAGE

   4. LES MÉDIAS SE CHARGENT À LA DEMANDE. Quinze vidéos de soixante
      secondes, c'est cent trente mégaoctets. Chargées d'un bloc sur
      le forfait de quelqu'un qui vient de scanner un carré de papier,
      elles ne s'ouvriraient jamais. « preload=none » et chargement
      paresseux des images : on ne télécharge que ce qu'on regarde.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var C = window.MOT_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var liste = $('messages');

  /* « /carte/<jeton> » est une réécriture : le navigateur n'y voit
     aucun « ?c= », qui n'existe que côté serveur. On lit donc le
     chemin, et le paramètre ne sert qu'en secours. */
  function jetonDeLAdresse() {
    var direct = new URLSearchParams(location.search).get('c');
    if (direct) return direct.trim();
    var morceaux = location.pathname.split('/').filter(Boolean);
    if (!morceaux.length) return '';
    try { return decodeURIComponent(morceaux[morceaux.length - 1]).trim(); }
    catch (e) { return morceaux[morceaux.length - 1].trim(); }
  }

  function element(balise, classe, texte) {
    var e = document.createElement(balise);
    if (classe) e.className = classe;
    if (texte !== undefined) e.textContent = texte;   /* jamais innerHTML */
    return e;
  }

  function annoncer(titre, explication) {
    liste.innerHTML = '';
    $('chapeau').textContent = '';
    var l = element('article', 'lettre');
    l.appendChild(element('h2', 'signataire', titre));
    if (explication) l.appendChild(element('p', 'le-mot', explication));
    liste.appendChild(l);
  }

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

  function bloquerMedia(m) {
    if (!m.media_url || !adresseDeConfiance(m.media_url)) return null;
    var bloc = element('div', 'media');

    if (m.media_type === 'photo') {
      var img = element('img');
      img.src = m.media_url;
      img.alt = 'Photo laissée par ' + m.auteur;
      img.loading = 'lazy';
      img.decoding = 'async';
      bloc.appendChild(img);
    } else if (m.media_type === 'video') {
      var v = element('video');
      v.src = m.media_url;
      v.controls = true;
      v.playsInline = true;
      v.preload = 'none';       /* rien ne part tant qu'on n'a pas cliqué */
      v.setAttribute('aria-label', 'Vidéo laissée par ' + m.auteur);
      bloc.appendChild(v);
    } else if (m.media_type === 'audio') {
      var a = element('audio');
      a.src = m.media_url;
      a.controls = true;
      a.preload = 'none';
      a.setAttribute('aria-label', 'Message vocal laissé par ' + m.auteur);
      bloc.appendChild(a);
    }
    return bloc.childNodes.length ? bloc : null;
  }

  function dessinerMessage(m, rang) {
    var l = element('article', 'lettre lettre-carte');

    var numero = element('p', 'de-la-part', 'Message ' + rang);
    l.appendChild(numero);
    l.appendChild(element('h2', 'signataire', m.auteur));

    if (m.mot) l.appendChild(element('p', 'le-mot', m.mot));

    var media = bloquerMedia(m);
    if (media) l.appendChild(media);
    else if (m.media_url) {
      l.appendChild(element('p', 'aide',
        'Un fichier était joint, mais il ne provient pas de cet espace : il n’a pas été affiché.'));
    }

    var date = enFrancais(m.cree_le);
    if (date) {
      l.appendChild(element('hr', 'filet'));
      l.appendChild(element('p', 'de-la-part', 'Déposé le ' + date));
    }
    return l;
  }

  function afficher(c) {
    document.title = 'La carte de ' + c.nom;
    $('sur-titre').textContent = c.sous_titre || 'La carte';
    $('titre').textContent = 'Pour toi, ' + c.nom + '.';

    if (c.affiche) {
      var img = $('affiche-image');
      img.src = c.affiche + '-640.webp';
      img.srcset = c.affiche + '-640.webp 640w, ' + c.affiche + '-1024.webp 1024w';
      img.sizes = '(min-width: 640px) 36rem, calc(100vw - 2rem)';
      img.alt = c.affiche_alt || ('Affiche de départ de ' + c.nom);
      img.addEventListener('error', function () { $('affiche').hidden = true; });
      $('affiche').hidden = false;
    }

    var messages = Array.isArray(c.messages) ? c.messages : [];
    liste.innerHTML = '';

    if (!messages.length) {
      $('chapeau').textContent = 'Personne n’a encore déposé de mot. Revenez tout à l’heure.';
      $('pied').textContent = '';
      return;
    }

    $('chapeau').textContent = messages.length === 1
      ? 'Un message t’attend.'
      : messages.length + ' messages t’attendent. Ils sont dans l’ordre où ils ont été déposés.';

    messages.forEach(function (m, i) {
      liste.appendChild(dessinerMessage(m, i + 1));
    });

    $('pied').textContent = 'Cette carte restera à cette adresse.';
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

  appeler('carte', { c: jeton }).then(function (c) {
    if (!c || !c.nom) {
      annoncer(
        'Cette carte n’existe pas.',
        'Le lien est peut-être incomplet, ou la carte a été close. Redemandez-le à la personne qui vous l’a transmis.'
      );
      return;
    }
    afficher(c);
  }).catch(function () {
    annoncer(
      'La carte n’a pas pu être chargée.',
      'La connexion n’a pas abouti. Réessayez dans un instant — les messages, eux, sont toujours là.'
    );
    var b = element('button', 'btn btn-creux', 'Réessayer');
    b.type = 'button';
    b.style.marginTop = '1.2rem';
    b.addEventListener('click', function () { location.reload(); });
    liste.firstChild.appendChild(b);
  });
})();
