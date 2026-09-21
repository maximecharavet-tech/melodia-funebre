/* ═══════════════════════════════════════════════════════════════
   LE STUDIO — déposer son mot, repartir avec son QR

   CE QUE FAIT CE FICHIER, DANS L'ORDRE

   1. Selon la forme choisie, il ouvre la caméra, le micro, ou le
      sélecteur de fichiers.
   2. Il borne ce qui est enregistré : une photo est recompressée,
      une vidéo est coupée à soixante secondes, un audio à trois
      minutes. Personne ne se demande si « c'est trop lourd ».
   3. Il dépose le fichier dans l'espace Supabase, puis appelle la
      fonction qui crée la ligne et rend les deux jetons.
   4. Il dessine le QR et le propose au téléchargement.

   POURQUOI TOUT EST BORNÉ AU MOMENT DE L'ENREGISTREMENT

   Parce qu'un refus après coup — « votre vidéo fait 40 Mo, refaites-la »
   — arrive toujours au pire moment : la personne a déjà dit ce qu'elle
   avait à dire, et ne le redira pas deux fois pareil. On limite donc
   avant, visiblement, avec un compte à rebours.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var C = window.MOT_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  /* Les bornes. La vidéo est la seule qui coûte vraiment : soixante
     secondes en 720p à 1,2 Mbit/s font environ 9 Mo, ce qui s'envoie
     encore depuis un téléphone en déplacement. Au-delà, l'envoi
     échoue au mauvais moment, et le QR met trop longtemps à s'ouvrir
     pour celui qui le scanne dans un couloir. */
  var BORNES = {
    video: { secondes: 60, octets: 24 * 1024 * 1024 },
    audio: { secondes: 180, octets: 12 * 1024 * 1024 },
    photo: { octets: 8 * 1024 * 1024, cote: 1600, qualite: 0.82 }
  };

  var forme = 'texte';
  var campagne = null;      /* la personne qui s'en va, si l'adresse la nomme */
  var blob = null;          /* le fichier prêt à être déposé */
  var blobMime = '';
  var flux = null;          /* le flux caméra/micro en cours */
  var enregistreur = null;
  var minuteur = null;
  var debut = 0;

  var atelier = $('atelier');
  var boutonsAtelier = $('boutons-atelier');
  var aideAtelier = $('aide-atelier');
  var apercuVideo = $('apercu-video');
  var apercuPhoto = $('apercu-photo');
  var apercuAudio = $('apercu-audio');
  var minuterie = $('minuterie');
  var chrono = $('chrono');
  var chronoNote = $('chrono-note');
  var fichier = $('fichier');
  var etat = $('etat');

  /* ─── Petits services ─── */

  function dire(message, echec) {
    etat.textContent = message || '';
    etat.hidden = !message;
    etat.classList.toggle('echec', !!echec);
  }

  function mmss(secondes) {
    var m = Math.floor(secondes / 60);
    var s = Math.floor(secondes % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function poids(octets) {
    if (octets < 1024 * 1024) return Math.round(octets / 1024) + ' Ko';
    return (octets / (1024 * 1024)).toFixed(1).replace('.', ',') + ' Mo';
  }

  function couperFlux() {
    if (flux) { flux.getTracks().forEach(function (p) { p.stop(); }); flux = null; }
    if (minuteur) { clearInterval(minuteur); minuteur = null; }
    atelier.classList.remove('enregistre');
  }

  function cacherApercus() {
    [apercuVideo, apercuPhoto, apercuAudio].forEach(function (e) {
      e.hidden = true;
      if (e.tagName !== 'IMG') { try { e.pause(); } catch (err) {} }
    });
    minuterie.hidden = true;
  }

  function oublierMedia() {
    if (blob && apercuPhoto.src.indexOf('blob:') === 0) URL.revokeObjectURL(apercuPhoto.src);
    blob = null; blobMime = '';
  }

  /* ─── Le choix de la forme ─── */

  Array.prototype.forEach.call(document.querySelectorAll('.forme'), function (b) {
    b.addEventListener('click', function () {
      choisir(b.dataset.forme);
    });
  });

  function choisir(nouvelle) {
    forme = nouvelle;
    Array.prototype.forEach.call(document.querySelectorAll('.forme'), function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.forme === nouvelle));
    });
    couperFlux();
    cacherApercus();
    oublierMedia();
    dire('');
    boutonsAtelier.innerHTML = '';
    aideAtelier.textContent = '';

    if (nouvelle === 'texte') { atelier.hidden = true; return; }
    atelier.hidden = false;

    if (nouvelle === 'photo') return preparerPhoto();
    if (nouvelle === 'audio') return preparerAudio();
    if (nouvelle === 'video') return preparerVideo();
  }

  function bouton(texte, classe, action) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + classe;
    b.textContent = texte;
    b.addEventListener('click', action);
    boutonsAtelier.appendChild(b);
    return b;
  }

  /* ─── La photo ─── */

  function preparerPhoto() {
    aideAtelier.textContent = 'La photo est réduite automatiquement : inutile de la préparer.';
    bouton('Choisir une photo', 'btn-plein', function () {
      fichier.accept = 'image/*';
      fichier.removeAttribute('capture');
      fichier.value = '';
      fichier.click();
    });
    bouton('Prendre une photo', 'btn-creux', function () {
      fichier.accept = 'image/*';
      fichier.setAttribute('capture', 'user');
      fichier.value = '';
      fichier.click();
    });
  }

  function compresserPhoto(f) {
    return new Promise(function (resoudre, rejeter) {
      var lecteur = new Image();
      var adresse = URL.createObjectURL(f);
      lecteur.onload = function () {
        var echelle = Math.min(1, BORNES.photo.cote / Math.max(lecteur.width, lecteur.height));
        var l = Math.max(1, Math.round(lecteur.width * echelle));
        var h = Math.max(1, Math.round(lecteur.height * echelle));
        var toile = document.createElement('canvas');
        toile.width = l; toile.height = h;
        toile.getContext('2d').drawImage(lecteur, 0, 0, l, h);
        URL.revokeObjectURL(adresse);
        toile.toBlob(function (b) {
          if (!b) return rejeter(new Error('La compression a échoué sur cet appareil.'));
          resoudre(b);
        }, 'image/jpeg', BORNES.photo.qualite);
      };
      lecteur.onerror = function () {
        URL.revokeObjectURL(adresse);
        rejeter(new Error('Ce fichier ne semble pas être une image.'));
      };
      lecteur.src = adresse;
    });
  }

  fichier.addEventListener('change', function () {
    var f = fichier.files && fichier.files[0];
    if (!f) return;
    dire('');

    if (forme === 'photo') {
      compresserPhoto(f).then(function (b) {
        blob = b; blobMime = 'image/jpeg';
        cacherApercus();
        apercuPhoto.src = URL.createObjectURL(b);
        apercuPhoto.hidden = false;
        aideAtelier.textContent = 'Photo prête — ' + poids(b.size) + '.';
      }).catch(function (e) { dire(e.message, true); });
      return;
    }

    /* Vidéo ou audio déposés depuis l'appareil : on ne sait pas les
       recompresser dans le navigateur, on vérifie donc la taille et
       on explique quoi faire si c'est trop. */
    var borne = BORNES[forme];
    if (f.size > borne.octets) {
      dire('Ce fichier fait ' + poids(f.size) + ', le maximum est ' + poids(borne.octets) +
           '. Enregistrez directement ici avec le bouton ci-dessus : c’est calibré pour passer.', true);
      return;
    }
    blob = f; blobMime = f.type || (forme === 'video' ? 'video/mp4' : 'audio/mpeg');
    cacherApercus();
    var cible = forme === 'video' ? apercuVideo : apercuAudio;
    cible.src = URL.createObjectURL(f);
    cible.controls = true;
    cible.muted = false;
    cible.hidden = false;
    aideAtelier.textContent = 'Fichier prêt — ' + poids(f.size) + '.';
  });

  /* ─── Le format d'enregistrement ───
     Les navigateurs ne savent pas tous produire les mêmes conteneurs.
     On essaie dans l'ordre du plus largement lisible au moins, et on
     garde le premier accepté. Sans cette recherche, Safari renvoie
     un enregistreur muet et l'on s'en aperçoit à la lecture. */
  function premierFormat(candidats) {
    if (typeof MediaRecorder === 'undefined') return null;
    for (var i = 0; i < candidats.length; i++) {
      if (MediaRecorder.isTypeSupported(candidats[i])) return candidats[i];
    }
    return '';
  }

  function enregistrer(contraintes, candidats, borne, apercu, surFin) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      dire('Ce navigateur ne sait pas enregistrer. Vous pouvez déposer un fichier à la place.', true);
      return;
    }
    navigator.mediaDevices.getUserMedia(contraintes).then(function (f) {
      flux = f;
      var type = premierFormat(candidats);
      if (type === null) {
        couperFlux();
        dire('Ce navigateur ne sait pas enregistrer. Déposez un fichier à la place.', true);
        return;
      }
      var morceaux = [];
      var options = type ? { mimeType: type } : {};
      if (contraintes.video) {
        options.videoBitsPerSecond = 1200000;
        options.audioBitsPerSecond = 96000;
      } else {
        options.audioBitsPerSecond = 96000;
      }
      try { enregistreur = new MediaRecorder(flux, options); }
      catch (e) { enregistreur = new MediaRecorder(flux); }

      enregistreur.ondataavailable = function (e) { if (e.data && e.data.size) morceaux.push(e.data); };
      enregistreur.onstop = function () {
        couperFlux();
        var b = new Blob(morceaux, { type: enregistreur.mimeType || type || 'application/octet-stream' });
        blob = b;
        blobMime = b.type.split(';')[0] || 'application/octet-stream';
        minuterie.hidden = true;
        surFin(b);
      };

      if (apercu) {
        cacherApercus();
        apercuVideo.srcObject = flux;
        apercuVideo.muted = true;          /* sans quoi l'appareil siffle */
        apercuVideo.controls = false;
        apercuVideo.hidden = false;
        apercuVideo.play().catch(function () {});
      }

      enregistreur.start();
      debut = Date.now();
      atelier.classList.add('enregistre');
      minuterie.hidden = false;
      chronoNote.textContent = 'Enregistrement — ' + borne.secondes + ' s maximum';
      minuteur = setInterval(function () {
        var passe = (Date.now() - debut) / 1000;
        chrono.textContent = mmss(passe);
        if (passe >= borne.secondes) arreter();
      }, 200);

      boutonsAtelier.innerHTML = '';
      bouton('Arrêter', 'btn-plein', arreter);
    }).catch(function (e) {
      var message = 'Impossible d’ouvrir ' + (contraintes.video ? 'la caméra' : 'le micro') + '.';
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
        message += ' L’autorisation a été refusée : vous pouvez la redonner dans les réglages du navigateur, ou déposer un fichier à la place.';
      }
      dire(message, true);
    });
  }

  function arreter() {
    if (enregistreur && enregistreur.state !== 'inactive') enregistreur.stop();
  }

  function preparerAudio() {
    aideAtelier.textContent = 'Trois minutes au maximum. Vous pourrez réécouter avant d’envoyer.';
    bouton('Enregistrer ma voix', 'btn-plein', function () {
      dire('');
      enregistrer(
        { audio: true },
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'],
        BORNES.audio, false,
        function (b) {
          cacherApercus();
          apercuAudio.src = URL.createObjectURL(b);
          apercuAudio.hidden = false;
          aideAtelier.textContent = 'Enregistrement prêt — ' + poids(b.size) + '.';
          boutonsAtelier.innerHTML = '';
          bouton('Recommencer', 'btn-creux', preparerAudioRelance);
        }
      );
    });
    bouton('Déposer un fichier', 'btn-creux', function () {
      fichier.accept = 'audio/*';
      fichier.removeAttribute('capture');
      fichier.value = '';
      fichier.click();
    });
  }
  function preparerAudioRelance() { oublierMedia(); cacherApercus(); boutonsAtelier.innerHTML = ''; preparerAudio(); }

  function preparerVideo() {
    aideAtelier.textContent = 'Une minute au maximum. Regardez l’objectif, pas l’écran.';
    bouton('Filmer', 'btn-plein', function () {
      dire('');
      enregistrer(
        { video: { width: { ideal: 720 }, height: { ideal: 1280 }, facingMode: 'user' }, audio: true },
        ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'],
        BORNES.video, true,
        function (b) {
          apercuVideo.srcObject = null;
          apercuVideo.src = URL.createObjectURL(b);
          apercuVideo.muted = false;
          apercuVideo.controls = true;
          apercuVideo.hidden = false;
          aideAtelier.textContent = 'Vidéo prête — ' + poids(b.size) + '.';
          boutonsAtelier.innerHTML = '';
          bouton('Recommencer', 'btn-creux', preparerVideoRelance);
        }
      );
    });
    bouton('Déposer un fichier', 'btn-creux', function () {
      fichier.accept = 'video/*';
      fichier.removeAttribute('capture');
      fichier.value = '';
      fichier.click();
    });
  }
  function preparerVideoRelance() { oublierMedia(); cacherApercus(); boutonsAtelier.innerHTML = ''; preparerVideo(); }

  /* ─── Le compteur de caractères ─── */
  var mot = $('mot'), compteur = $('compteur');
  mot.addEventListener('input', function () { compteur.textContent = mot.value.length; });

  /* ─── L'envoi ─── */

  function extension(mime) {
    var table = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
      'video/mp4': 'mp4', 'video/webm': 'webm',
      'audio/webm': 'webm', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg'
    };
    return table[mime] || 'bin';
  }

  function nomAuHasard() {
    var a = 'abcdefghijkmnpqrstuvwxyz23456789';
    var out = '';
    var tirage = new Uint8Array(20);
    (window.crypto || window.msCrypto).getRandomValues(tirage);
    for (var i = 0; i < tirage.length; i++) out += a[tirage[i] % a.length];
    return out;
  }

  /* L'envoi du fichier passe par XMLHttpRequest et non par fetch :
     lui seul rapporte l'avancement. Sur un téléphone en 4G, une
     vidéo de 9 Mo prend une vingtaine de secondes — sans barre, on
     croit que c'est planté et on recharge la page. */
  function deposerFichier(b, chemin) {
    return new Promise(function (resoudre, rejeter) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', C.SUPABASE_URL + '/storage/v1/object/' + C.ESPACE + '/' + chemin, true);
      xhr.setRequestHeader('apikey', C.SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', 'Bearer ' + C.SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Content-Type', b.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) avancement(e.loaded / e.total);
      };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) resoudre();
        else rejeter(new Error('L’envoi du fichier a échoué (' + xhr.status + ').'));
      };
      xhr.onerror = function () { rejeter(new Error('L’envoi du fichier a échoué : connexion interrompue.')); };
      xhr.send(b);
    });
  }

  var progression = $('progression'), barre = $('barre');
  function avancement(part) {
    progression.hidden = false;
    barre.style.width = Math.round(Math.max(0, Math.min(1, part)) * 100) + '%';
  }

  function appelerFonction(nom, corps) {
    return fetch(C.SUPABASE_URL + '/rest/v1/rpc/' + nom, {
      method: 'POST',
      headers: {
        apikey: C.SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(corps)
    }).then(function (r) {
      return r.text().then(function (t) {
        var d = null;
        try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
        if (!r.ok) {
          var m = (d && (d.message || d.error || d.hint)) || ('Erreur ' + r.status);
          throw new Error(m);
        }
        return d;
      });
    });
  }

  var envoyer = $('envoyer');
  $('formulaire').addEventListener('submit', function (e) {
    e.preventDefault();
    dire('');

    var auteur = $('auteur').value.trim();
    if (!auteur) { dire('Il manque votre prénom.', true); $('auteur').focus(); return; }
    if (!mot.value.trim() && !blob) {
      dire('Écrivez un mot, ou ajoutez une photo, votre voix ou une vidéo.', true);
      mot.focus();
      return;
    }

    envoyer.disabled = true;
    envoyer.textContent = 'Envoi en cours…';

    var chaine = Promise.resolve(null);
    if (blob) {
      var chemin = nomAuHasard() + '.' + extension(blobMime);
      chaine = deposerFichier(blob, chemin).then(function () {
        return C.SUPABASE_URL + '/storage/v1/object/public/' + C.ESPACE + '/' + chemin;
      });
    }

    chaine.then(function (adresseMedia) {
      avancement(1);
      return appelerFonction('deposer_adieu', {
        p_auteur: auteur,
        p_pour: $('pour').value.trim(),
        p_mot: mot.value.trim(),
        p_media_type: blob ? forme : 'texte',
        p_media_url: adresseMedia,
        p_media_mime: blob ? blobMime : null,
        p_campagne: campagne ? campagne.slug : null
      });
    }).then(function (lignes) {
      var ligne = Array.isArray(lignes) ? lignes[0] : lignes;
      if (!ligne || !ligne.jeton) throw new Error('La réponse du serveur est incomplète.');
      montrerResultat(ligne.jeton, ligne.jeton_edition);
    }).catch(function (err) {
      dire(err.message || 'Quelque chose s’est mal passé. Réessayez.', true);
      progression.hidden = true;
    }).then(function () {
      envoyer.disabled = false;
      envoyer.textContent = 'Créer mon QR code';
    });
  });

  /* ─── Le résultat ─── */

  var resultat = $('resultat');
  var toileQR = null;

  function montrerResultat(jeton, edition) {
    var base = location.origin;
    var adresse = base + '/a/' + jeton;
    var retrait = base + '/a/' + jeton + '?retirer=' + edition;

    var cadre = $('cadre-qr');
    cadre.innerHTML = '';
    /* Dix pixels par module : un QR de version 3 fait alors 370 px de
       côté, net à l'écran comme à l'impression sur une vignette de
       trois centimètres. */
    toileQR = window.MotQR.dessiner(adresse, { module: 10, marge: 4, encre: '#101418', papier: '#ffffff' });
    toileQR.setAttribute('role', 'img');
    toileQR.setAttribute('aria-label', 'QR code menant à votre message');
    cadre.appendChild(toileQR);

    $('adresse').textContent = adresse;
    $('adresse-retrait').textContent = retrait;
    $('ouvrir').href = adresse;

    /* Sur une page de départ, le QR individuel n'est pas la fin de
       l'histoire : le message rejoint la carte collective. On le dit,
       sinon on croit avoir fabriqué un objet isolé. */
    if (campagne) {
      var suite = document.createElement('p');
      suite.className = 'aide';
      suite.style.marginTop = '.9rem';
      suite.textContent = 'Votre message rejoint la carte de ' + campagne.nom +
        '. Elle les découvrira tous ensemble.';
      $('adresse').parentNode.insertBefore(suite, $('adresse').nextSibling);
    }

    document.getElementById('formulaire').hidden = true;
    resultat.hidden = false;
    resultat.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /* Le lien de retrait est aussi rangé dans ce navigateur : si la
       personne ferme la page sans l'avoir noté, elle le retrouve en
       revenant. Ce n'est qu'un filet — changer d'appareil le perd. */
    try {
      var gardes = JSON.parse(localStorage.getItem('mots-deposes') || '[]');
      gardes.push({ jeton: jeton, edition: edition, le: new Date().toISOString() });
      localStorage.setItem('mots-deposes', JSON.stringify(gardes.slice(-20)));
    } catch (e) {}
  }

  $('telecharger').addEventListener('click', function () {
    if (!toileQR) return;
    var a = document.createElement('a');
    a.href = toileQR.toDataURL('image/png');
    a.download = 'mon-qr-code.png';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  $('copier').addEventListener('click', function () {
    var texte = $('adresse').textContent;
    var bouton = $('copier');
    var rendre = function (ok) {
      bouton.textContent = ok ? 'Lien copié' : 'Copie impossible';
      setTimeout(function () { bouton.textContent = 'Copier le lien'; }, 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(function () { rendre(true); }, function () { rendre(false); });
    } else { rendre(false); }
  });

  $('recommencer').addEventListener('click', function () {
    location.reload();
  });

  /* ─── La personne qui s'en va ───

     L'adresse « /pour/chloe » amène ici avec « ?p=chloe ». Le nom, le
     texte et l'affiche ne sont PAS écrits dans cette page : ils
     viennent de la base, ce qui permet d'ajouter un collègue sans
     toucher une ligne de code — et garantit qu'on ne déposera jamais
     sur une campagne qui n'existe pas, puisque c'est la base qui
     tranche, à l'aller comme au retour. */

  function nomDeCampagne() {
    /* Attention au piège : « /pour/chloe » est une RÉÉCRITURE. Vercel
       sert bien cette page avec « ?p=chloe », mais côté serveur
       seulement — le navigateur, lui, reste sur « /pour/chloe » et
       « location.search » est vide. Lire le paramètre ne suffit donc
       pas : il faut aussi savoir lire le chemin.

       Et seulement sous « /pour/ » : pris n'importe où, le dernier
       morceau de « /un-mot-pour-toi » serait « un-mot-pour-toi », qui
       a la forme d'un slug et ferait chercher une campagne de ce nom
       sur le studio générique. */
    var p = new URLSearchParams(location.search).get('p');
    if (!p) {
      var m = location.pathname.match(/^\/pour\/([^\/]+)\/?$/);
      if (m) { try { p = decodeURIComponent(m[1]); } catch (e) { p = m[1]; } }
    }
    if (!p) return '';
    p = p.trim().toLowerCase();
    return /^[a-z0-9-]{2,40}$/.test(p) ? p : '';
  }

  function installerCampagne(c) {
    campagne = c;
    document.title = 'Un mot pour ' + c.nom;

    $('sur-titre').textContent = c.sous_titre || 'Carte de départ';
    $('titre').textContent = 'Un mot pour ' + c.nom + '.';
    if (c.intro) $('chapeau').textContent = c.intro;

    if (c.affiche) {
      var img = $('affiche-image');
      /* Deux largeurs : la petite suffit sur un téléphone, la grande
         sert au zoom et aux écrans denses. L'affiche est le seul
         fichier lourd de la page, autant ne pas l'imposer en 4G. */
      img.src = c.affiche + '-640.webp';
      img.srcset = c.affiche + '-640.webp 640w, ' + c.affiche + '-1024.webp 1024w';
      img.sizes = '(min-width: 640px) 36rem, calc(100vw - 2rem)';
      img.alt = c.affiche_alt || ('Affiche de départ de ' + c.nom);
      img.addEventListener('error', function () {
        /* Une affiche manquante ne doit pas laisser un cadre vide en
           haut de page : on retire le bloc et le reste fonctionne. */
        $('affiche').hidden = true;
      });
      $('affiche-legende').textContent = c.messages === 1
        ? 'Un message déposé pour l’instant.'
        : (c.messages > 1 ? c.messages + ' messages déposés pour l’instant.'
                          : 'Soyez le premier à lui laisser un mot.');
      $('affiche').hidden = false;
    }

    /* « Pour qui » est déjà répondu : on le remplit et on le ferme,
       plutôt que de demander à quinze personnes de retaper le même
       prénom — et d'en avoir quinze orthographes sur la carte. */
    var pour = $('pour');
    pour.value = c.nom;
    pour.readOnly = true;
    pour.tabIndex = -1;
    pour.setAttribute('aria-readonly', 'true');
    $('aide-pour').textContent = 'C’est elle qui part. Rien à remplir ici.';
  }

  var slug = nomDeCampagne();
  if (slug) {
    appelerFonction('campagne', { s: slug }).then(function (lignes) {
      var c = Array.isArray(lignes) ? lignes[0] : lignes;
      if (c && c.slug) installerCampagne(c);
      else dire('Cette page de départ n’existe pas, ou elle est close. ' +
                'Vérifiez le lien qu’on vous a transmis.', true);
    }).catch(function () {
      dire('La page n’a pas pu être chargée. Réessayez dans un instant.', true);
    });
  }

  /* On coupe caméra et micro si la page est quittée : une pastille
     d'enregistrement qui reste allumée après coup est inquiétante,
     et à juste titre. */
  window.addEventListener('pagehide', couperFlux);
})();
