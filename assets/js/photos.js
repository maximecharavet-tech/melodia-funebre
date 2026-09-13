/* ═══════════════════════════════════════════════════════════════
   MELODIA — Les photos d'une page de souvenir

   Cinq photos, pas plus. Déposées depuis un téléphone, le plus
   souvent le soir, par quelqu'un qui vient d'enterrer un parent.

   Trois principes gouvernent ce fichier :

   1. Rien n'est perdu faute d'avoir appuyé sur « Enregistrer ».
      Un dépôt, un retrait, un déplacement sont écrits en base tout
      de suite. Une famille en deuil ne doit pas apprendre qu'elle a
      fermé l'onglet trop tôt.

   2. La photo d'origine ne part jamais. Un iPhone produit des
      fichiers de huit mégaoctets ; on réduit dans le navigateur, et
      l'on envoie deux à trois cents kilo-octets. C'est le forfait de
      la famille, et c'est aussi la vitesse à laquelle la page
      s'ouvrira devant une tombe, sur un réseau de cimetière.

   3. Ce qu'on refuse, on le dit en clair. « Erreur 400 » n'a jamais
      aidé personne à comprendre qu'un HEIC d'iPhone ne s'ouvre pas.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MAX = 5;
  var COTE = 1600;      /* plus grand côté, en pixels, après réduction */
  var QUALITE = 0.82;
  var SEUIL = 12 * 1024 * 1024;   /* refus avant même de décoder */
  var DOSSIER = 'souvenirs';

  var REST = window.MelodiaRest || null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function base() {
    return String((window.MELODIA_CONFIG && window.MELODIA_CONFIG.SUPABASE_URL) || '').replace(/\/+$/, '');
  }

  /* ─── Ce qu'on accepte ───
     Le type déclaré par le navigateur ment parfois (un HEIC renommé
     .jpg arrive en image/jpeg) ; le décodage plus bas tranchera pour
     de bon. Ce contrôle-ci sert à répondre vite et clairement dans
     les cas ordinaires. */
  function verifier(f) {
    if (!f) return 'Aucun fichier choisi.';
    if (/heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name)) {
      return 'Ce format d’iPhone (HEIC) ne s’ouvre pas ici. Dans Réglages → Appareil photo → Formats, ' +
             'choisissez « Le plus compatible » ; ou envoyez la photo par courriel, elle deviendra un JPEG.';
    }
    if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|gif)$/i.test(f.name)) {
      return 'Ce fichier n’est pas une photo. Attendus : JPEG, PNG, WebP ou GIF.';
    }
    if (f.size > SEUIL) {
      return 'Cette photo dépasse 12 Mo. Choisissez-en une moins lourde, ou réduisez-la avant l’envoi.';
    }
    return null;
  }

  /* ─── La réduction ───
     createImageBitmap applique l'orientation EXIF : sans cela, une
     photo prise à la verticale arrive couchée sur la page de
     souvenir. Le repli par <img> s'appuie sur le même comportement,
     devenu celui par défaut des navigateurs. */
  async function reduire(fichier) {
    var largeur, hauteur, source;

    if (window.createImageBitmap) {
      try {
        source = await createImageBitmap(fichier, { imageOrientation: 'from-image' });
      } catch (e) { source = null; }
    }
    if (!source) {
      source = await new Promise(function (res, rej) {
        var url = URL.createObjectURL(fichier);
        var img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); res(img); };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          rej(new Error('Cette image ne s’ouvre pas — le fichier est peut-être abîmé, ou dans un format que ce téléphone ne sait pas lire.'));
        };
        img.src = url;
      });
    }

    largeur = source.width || source.naturalWidth;
    hauteur = source.height || source.naturalHeight;
    if (!largeur || !hauteur) throw new Error('Cette image n’a pas pu être mesurée.');

    var f = Math.min(1, COTE / Math.max(largeur, hauteur));
    var l = Math.max(1, Math.round(largeur * f));
    var h = Math.max(1, Math.round(hauteur * f));

    var c = document.createElement('canvas');
    c.width = l; c.height = h;
    var ctx = c.getContext('2d');
    /* Fond blanc : un PNG transparent aplati sur du noir donnerait une
       silhouette illisible dans la galerie. */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, l, h);
    ctx.drawImage(source, 0, 0, l, h);
    if (source.close) source.close();

    var blob = await new Promise(function (res) { c.toBlob(res, 'image/jpeg', QUALITE); });
    if (!blob) throw new Error('La photo n’a pas pu être préparée pour l’envoi.');
    return { blob: blob, largeur: l, hauteur: h };
  }

  /* ─── Le dépôt ───
     Le chemin commence par le jeton de la page : c'est ce que la
     règle du stockage relit pour savoir si l'appelant a le droit
     d'écrire ici. Un jeton qui n'est pas le sien est refusé par la
     base, pas par cet écran. */
  function chemin(jeton) {
    var alea = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    return jeton + '/' + alea + '.jpg';
  }

  async function envoyer(blob, ch) {
    await REST.appel('/storage/v1/object/' + DOSSIER + '/' + ch, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
      body: blob
    });
    return base() + '/storage/v1/object/public/' + DOSSIER + '/' + ch;
  }

  /* Le fichier part après la ligne, jamais avant : si la base refuse
     la mise à jour, la photo est encore là et rien n'est perdu. Un
     objet resté seul au stockage ne gêne personne ; une ligne qui
     pointe vers un fichier disparu affiche un cadre brisé sur la
     page de souvenir. */
  async function oterObjet(p) {
    if (!p || !p.chemin) return;
    try {
      await REST.appel('/storage/v1/object/' + DOSSIER + '/' + p.chemin, { method: 'DELETE' });
    } catch (e) { /* l'essentiel est fait : la page ne l'affiche plus */ }
  }

  /* ═══ L'ÉCRAN ═══ */

  function monter(hote, options) {
    if (!hote) return;
    options = options || {};
    var jeton = options.jeton;
    var liste = (options.photos || []).filter(function (p) { return p && p.url; }).slice(0, MAX);
    var sauver = options.sauver || function () { return Promise.resolve(); };
    var occupe = false;

    function dire(texte, genre) {
      var z = hote.querySelector('.pho-msg');
      if (!z) return;
      z.textContent = texte || '';
      z.className = 'pho-msg' + (genre ? ' ' + genre : '');
      z.style.display = texte ? 'block' : 'none';
    }

    function rendre() {
      var reste = MAX - liste.length;
      var h = '<div class="pho-tete">' +
        '<div class="field-label">Photos — ' + liste.length + ' sur ' + MAX + '</div>' +
        '<p class="pho-aide">Elles s’affichent sur la page de souvenir, dans l’ordre ci-dessous. ' +
          'La première est celle qu’on voit en premier.</p>' +
      '</div>';

      h += liste.length
        ? '<ul class="pho-liste">' + liste.map(function (p, i) {
            return '<li class="pho-item">' +
              '<img src="' + esc(p.url) + '" alt="" loading="lazy" decoding="async">' +
              '<div class="pho-champs">' +
                /* L'identifiant porte le jeton : deux fiches dépliées
                   côte à côte dans la console de la maison auraient
                   sinon les mêmes, et chaque étiquette désignerait le
                   champ de l'autre défunt. On ne l'interroge jamais
                   par querySelector — il peut commencer par un chiffre. */
                '<label class="pho-legende-lbl" for="pho-l-' + esc(jeton) + '-' + i + '">Légende (facultative)</label>' +
                '<input class="field-input pho-legende" id="pho-l-' + esc(jeton) + '-' + i + '" data-i="' + i + '" ' +
                  'maxlength="120" value="' + esc(p.legende || '') + '" placeholder="Été 1998, dans son jardin">' +
              '</div>' +
              '<div class="pho-outils">' +
                '<button type="button" class="pho-btn" data-monter="' + i + '"' + (i === 0 ? ' disabled' : '') +
                  ' aria-label="Monter cette photo">↑</button>' +
                '<button type="button" class="pho-btn" data-descendre="' + i + '"' + (i === liste.length - 1 ? ' disabled' : '') +
                  ' aria-label="Descendre cette photo">↓</button>' +
                '<button type="button" class="pho-btn pho-btn-danger" data-oter="' + i + '" aria-label="Retirer cette photo">✕</button>' +
              '</div>' +
            '</li>';
          }).join('') + '</ul>'
        : '<p class="pho-vide">Aucune photo pour l’instant. La page affichera un ornement sobre.</p>';

      h += '<div class="pho-ajout">' +
        (reste > 0
          ? '<label class="btn btn-outline btn-sm pho-choisir">' +
              '<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden>' +
              'Ajouter ' + (liste.length ? 'une photo' : 'des photos') +
            '</label>' +
            '<span class="pho-reste">Encore ' + reste + '</span>'
          : '<p class="pho-plein">Cinq photos, c’est le maximum. Retirez-en une pour en ajouter une autre.</p>') +
      '</div>' +
      '<div class="pho-msg" style="display:none;"></div>';

      hote.innerHTML = h;
      brancher();
    }

    async function persister() {
      /* Ce qu'on écrit est exactement ce que la page publique lira :
         une adresse, une légende, et le chemin qui permettra de
         retirer le fichier plus tard. */
      await sauver(liste.map(function (p) {
        return { url: p.url, legende: p.legende || '', chemin: p.chemin || '' };
      }));
    }

    async function ajouter(fichiers) {
      if (occupe) return;
      var place = MAX - liste.length;
      if (place <= 0) { dire('Cinq photos, c’est le maximum.', 'err'); return; }

      var pris = Array.prototype.slice.call(fichiers, 0, place);
      var ignores = fichiers.length - pris.length;
      occupe = true;

      var deposees = 0, refus = [];
      for (var i = 0; i < pris.length; i++) {
        var f = pris[i];
        var mauvais = verifier(f);
        if (mauvais) { refus.push(mauvais); continue; }
        dire('Préparation de ' + (i + 1) + ' sur ' + pris.length + '…', '');
        try {
          var r = await reduire(f);
          var ch = chemin(jeton);
          var url = await envoyer(r.blob, ch);
          liste.push({ url: url, legende: '', chemin: ch });
          deposees++;
        } catch (e) {
          refus.push(e.message);
        }
      }

      if (deposees) {
        try { await persister(); }
        catch (e) {
          /* La base a refusé : on remet l'écran d'aplomb plutôt que
             d'afficher des photos qui ne sont enregistrées nulle part. */
          liste = liste.slice(0, liste.length - deposees);
          occupe = false; rendre();
          dire('Le dépôt n’a pas pu être enregistré : ' + e.message, 'err');
          return;
        }
      }

      occupe = false;
      rendre();
      var dit = [];
      if (deposees) dit.push(deposees + ' photo' + (deposees > 1 ? 's' : '') + ' ajoutée' + (deposees > 1 ? 's' : '') + '.');
      if (ignores) dit.push(ignores + ' de plus n’' + (ignores > 1 ? 'ont' : 'a') + ' pas été prise' + (ignores > 1 ? 's' : '') + ' : cinq au total.');
      dit = dit.concat(refus);
      dire(dit.join(' '), refus.length ? 'err' : 'ok');
    }

    /* Les éléments du dedans sont recréés à chaque rendu : leurs
       écouteurs le sont donc aussi, sans risque d'empilement. */
    function brancher() {
      var choix = hote.querySelector('.pho-choisir input[type=file]');
      if (choix) {
        choix.addEventListener('change', function () {
          var f = this.files;
          if (f && f.length) ajouter(f);
          this.value = '';
        });
      }

      hote.querySelectorAll('.pho-legende').forEach(function (e) {
        var avant = e.value;
        e.addEventListener('change', async function () {
          if (this.value === avant) return;
          var i = +this.dataset.i;
          liste[i].legende = this.value.trim();
          try { await persister(); avant = this.value; dire('Légende enregistrée.', 'ok'); }
          catch (err) { dire('La légende n’a pas pu être enregistrée : ' + err.message, 'err'); }
        });
      });
    }

    /* Celui-ci, au contraire, se pose sur l'hôte, qui survit aux
       rendus : il ne doit donc être posé qu'une fois. Reposé à chaque
       rendu, le deuxième clic sur « ✕ » retirerait deux photos. */
    function brancherUneFois() {
      hote.addEventListener('click', async function (ev) {
        if (occupe) return;
        var b = ev.target.closest && ev.target.closest('[data-monter],[data-descendre],[data-oter]');
        if (!b) return;

        var avant = liste.slice();
        var i, retiree = null;

        if (b.dataset.monter !== undefined) {
          i = +b.dataset.monter;
          if (i <= 0) return;
          liste.splice(i - 1, 0, liste.splice(i, 1)[0]);
        } else if (b.dataset.descendre !== undefined) {
          i = +b.dataset.descendre;
          if (i >= liste.length - 1) return;
          liste.splice(i + 1, 0, liste.splice(i, 1)[0]);
        } else {
          i = +b.dataset.oter;
          retiree = liste[i];
          if (!retiree) return;
          liste.splice(i, 1);
        }

        occupe = true;
        try {
          await persister();
          if (retiree) await oterObjet(retiree);
          occupe = false; rendre();
          dire(retiree ? 'Photo retirée.' : 'Ordre enregistré.', 'ok');
        } catch (e) {
          liste = avant;
          occupe = false; rendre();
          dire('Rien n’a été modifié : ' + e.message, 'err');
        }
      });
    }

    brancherUneFois();
    rendre();
  }

  window.MelodiaPhotos = {
    MAX: MAX,
    monter: monter,
    verifier: verifier,
    reduire: reduire
  };
})();
