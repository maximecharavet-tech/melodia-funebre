/* ═══════════════════════════════════════════════════════════════
   MELODIA — L'espace de souvenir, côté famille

   La console de la maison et l'espace d'une famille regardaient
   jusqu'ici le même panneau. Ce n'est pas la même personne.

   La maison gère des plaques : elle en produit, elle en facture,
   elle veut savoir combien sont en ligne, en quelle version le QR
   est encodé et combien de modules il compte.

   Une famille a perdu quelqu'un. Elle veut trois choses : voir le
   code qu'on collera sur la pierre, entendre la musique qu'il
   ouvre, et y ajouter quelques photos. Tout le reste est du bruit —
   et « Ouvrir la page telle que la verront les familles » est une
   phrase absurde quand c'est vous, la famille.

   D'où ce fichier : le même socle, la même base, les mêmes droits,
   mais un écran écrit pour elle. Il s'appuie sur MelodiaMemorial
   pour tout ce qui touche à la base et au dessin de la plaque —
   rien n'est réécrit deux fois.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REST = window.MelodiaRest || null;
  var MEM = null;   /* résolu au montage : memorial.js peut charger après */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function enLigne() { return !!(REST && REST.actif); }

  /* Une date française, ou rien. Un tiret entre deux dates absentes
     ressemble à une erreur d'affichage. */
  function jour(d) {
    if (!d) return '';
    var t = new Date(d + 'T12:00:00');
    if (isNaN(t)) return '';
    return t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  var etat = { fiches: [], candidates: [], ouvert: null, hote: null, options: null };

  /* ═══ CHARGEMENT ═══ */

  async function charger(email) {
    var fiches = (await REST.appel(
      '/rest/v1/memoriaux?select=*&proprietaire=eq.' + encodeURIComponent(email) + '&order=created_at.desc')) || [];

    var commandes = (await REST.appel(
      '/rest/v1/orders?select=ref,defunt,audio_url,audio_title,user_email,agence,status,options,price' +
      '&user_email=eq.' + encodeURIComponent(email) + '&order=created_at.desc&limit=100')) || [];

    var deja = {};
    fiches.forEach(function (f) { deja[f.ref] = true; });

    /* Une page de souvenir ne s'ouvre que sur un hommage livré. Un QR
       posé sur une pierre avant que la musique existe mènerait, le
       jour de l'enterrement, à une page vide. */
    etat.fiches = fiches;
    etat.candidates = commandes.filter(function (o) { return o.audio_url && !deja[o.ref]; });
  }

  /* ═══ L'ÉCRAN ═══ */

  function entete() {
    var enL = etat.fiches.filter(function (f) { return f.actif; }).length;
    return '<div class="sv-tete">' +
      '<h2 class="sv-titre">Sa page de souvenir</h2>' +
      '<p class="sv-dit">Un code à coller sur la pierre, la plaque ou le faire-part. ' +
        'Qui le scanne arrive sur une page où votre proche a sa musique, ses mots et ses photos.</p>' +
      (etat.fiches.length
        ? '<p class="sv-compte">' + etat.fiches.length + ' page' + (etat.fiches.length > 1 ? 's' : '') +
          ' · ' + (enL ? enL + ' en ligne' : 'aucune en ligne pour l’instant') + '</p>'
        : '') +
    '</div>';
  }

  function vueListe() {
    var h = entete();

    if (etat.candidates.length) {
      h += '<div class="sv-ouvrir">' +
        '<div class="field-label">Vos hommages livrés, sans page de souvenir</div>' +
        '<ul>' + etat.candidates.slice(0, 12).map(function (o) {
          return '<li>' +
            '<span class="sv-o-nom">' + esc(o.defunt || o.ref) + '</span>' +
            '<button type="button" class="btn btn-gold btn-sm" data-creer="' + esc(o.ref) + '">Créer sa page</button>' +
          '</li>';
        }).join('') + '</ul>' +
        '<p class="sv-aide">La page naît hors ligne. Vous la remplissez tranquillement, ' +
          'et vous seule décidez du moment où elle devient visible.</p>' +
      '</div>';
    }

    if (etat.fiches.length) {
      h += '<ul class="sv-liste">' + etat.fiches.map(function (f) {
        return '<li><button type="button" class="sv-carte" data-ouvrir="' + esc(f.jeton) + '">' +
          '<span class="sv-c-nom">' + esc(f.nom || f.ref) + '</span>' +
          '<span class="sv-c-etat ' + (f.actif ? 'en-ligne' : '') + '">' +
            (f.actif ? 'En ligne' : 'Hors ligne') + '</span>' +
          '<span class="sv-c-fleche" aria-hidden="true">→</span>' +
        '</button></li>';
      }).join('') + '</ul>';
    } else if (!etat.candidates.length) {
      h += '<div class="esp-vide">' +
        '<p>Vous n’avez pas encore de page de souvenir.</p>' +
        '<p class="esp-aide">Elle s’ouvre dès que votre hommage est livré. ' +
          'Si le vôtre l’est déjà et que rien n’apparaît ici, écrivez-nous depuis « Mes demandes ».</p>' +
      '</div>';
    }

    return h;
  }

  /* ─── Une page, dépliée ─── */
  function vueFiche(m) {
    var url = MEM.adresse(m.jeton);
    var qr = window.MelodiaQR ? window.MelodiaQR.svg(url, { niveau: 'H', marge: 3, fond: '#ffffff', encre: '#0b0b11' }) : '';
    var pistes = (m.pistes || []).filter(function (p) { return p && p.url; });
    var vie = [jour(m.ne_le), jour(m.parti_le)].filter(Boolean).join(' — ');

    var h = '<button type="button" class="sv-retour" data-retour>← Toutes mes pages</button>' +
      '<div class="sv-fiche" data-jeton="' + esc(m.jeton) + '">';

    /* ── Le code ── */
    h += '<section class="sv-bloc sv-bloc-code">' +
      '<h3 class="sv-bloc-titre">Le code à faire graver</h3>' +
      '<div class="sv-code">' +
        '<div class="sv-qr">' + qr + '</div>' +
        '<div class="sv-code-a-cote">' +
          '<p class="sv-aide">Scannez-le avec l’appareil photo de votre téléphone : ' +
            'vous verrez exactement ce que verra un visiteur.</p>' +
          '<div class="sv-adresse"><code>' + esc(url) + '</code>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="copier">Copier</button></div>' +
          '<div class="sv-boutons">' +
            '<a class="btn btn-outline btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener">Voir la page ↗</a>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="imprimer">Imprimer la plaque</button>' +
          '</div>' +
          '<details class="sv-pour-graveur"><summary>Pour le marbrier ou l’imprimeur</summary>' +
            '<p class="sv-aide">Un fichier vectoriel s’agrandit sans perdre en netteté ; ' +
              'l’image convient pour un faire-part ou un envoi rapide.</p>' +
            '<div class="sv-boutons">' +
              '<button type="button" class="btn btn-ghost btn-sm" data-act="svg">Plaque en vectoriel (SVG)</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-act="png">Code seul en image (PNG)</button>' +
            '</div>' +
          '</details>' +
        '</div>' +
      '</div>' +
    '</section>';

    /* ── Ce qu'on entend ── */
    h += '<section class="sv-bloc">' +
      '<h3 class="sv-bloc-titre">Sa musique</h3>' +
      (pistes.length
        ? '<ul class="sv-pistes">' + pistes.map(function (p) {
            return '<li>' +
              '<span class="sv-p-titre">' + esc(p.titre || 'Son hommage') + '</span>' +
              '<audio controls preload="none" src="' + esc(p.url) + '"></audio>' +
            '</li>';
          }).join('') + '</ul>' +
          '<p class="sv-aide">C’est ce qu’on entendra en scannant le code.</p>'
        : '<p class="sv-vide">Aucun enregistrement rattaché pour l’instant. ' +
          'La page annonce qu’il arrive bientôt.</p>') +
    '</section>';

    /* ── Ce qu'on lit ── */
    h += '<section class="sv-bloc">' +
      '<h3 class="sv-bloc-titre">Ses mots</h3>' +
      '<div class="field"><label class="field-label" for="sv-nom">Son nom, tel qu’il apparaîtra</label>' +
        '<input class="field-input" id="sv-nom" value="' + esc(m.nom || '') + '"></div>' +
      '<div class="sv-duo">' +
        '<div class="field"><label class="field-label" for="sv-ne">Né(e) le</label>' +
          '<input class="field-input" id="sv-ne" type="date" value="' + esc(m.ne_le || '') + '"></div>' +
        '<div class="field"><label class="field-label" for="sv-parti">Parti(e) le</label>' +
          '<input class="field-input" id="sv-parti" type="date" value="' + esc(m.parti_le || '') + '"></div>' +
      '</div>' +
      (vie ? '<p class="sv-aide">La page affichera : ' + esc(vie) + '</p>' : '') +
      '<div class="field"><label class="field-label" for="sv-mot">Quelques mots</label>' +
        '<textarea class="field-area" id="sv-mot" rows="3" ' +
          'placeholder="Une phrase, pas un discours. C’est ce qu’on lit debout, devant la pierre.">' +
          esc(m.message || '') + '</textarea></div>' +
      '<div class="field"><label class="field-label" for="sv-paroles">Les paroles de sa chanson</label>' +
        '<textarea class="field-area" id="sv-paroles" rows="6" ' +
          'placeholder="Collez-les ici si vous voulez qu’on puisse les lire en écoutant.">' +
          esc(m.paroles || '') + '</textarea>' +
        '<p class="sv-aide">Facultatif. Elles se déplient sur la page, elles ne s’imposent à personne.</p></div>' +
    '</section>';

    /* ── Les photos ── */
    h += '<section class="sv-bloc">' +
      '<h3 class="sv-bloc-titre">Ses photos</h3>' +
      '<div id="sv-photos"></div>' +
    '</section>';

    /* ── Enregistrer, publier ── */
    h += '<div class="form-msg" id="sv-msg"></div>' +
      '<div class="sv-actions">' +
        '<button type="button" class="btn btn-gold" data-act="enregistrer">Enregistrer</button>' +
        '<button type="button" class="btn ' + (m.actif ? 'btn-outline' : 'btn-gold') + '" data-act="bascule">' +
          (m.actif ? 'Retirer la page' : 'Mettre la page en ligne') + '</button>' +
      '</div>' +
      '<p class="sv-etat ' + (m.actif ? 'en-ligne' : '') + '">' +
        (m.actif
          ? 'En ligne. Toute personne qui scanne le code voit cette page.'
          : 'Hors ligne. Le code répond exactement comme un code qui n’existerait pas — ' +
            'personne ne peut deviner que la page existe.') +
        (m.vues ? ' · ' + m.vues + ' visite' + (m.vues > 1 ? 's' : '') : '') +
      '</p>';

    h += '</div>';

    /* La feuille d'impression vit hors de l'écran et n'apparaît qu'au
       moment d'imprimer : pas de fenêtre à ouvrir, donc rien qu'un
       bloqueur de fenêtres puisse empêcher. */
    h += '<div class="sv-impression" aria-hidden="true">' +
      (MEM.plaqueSVG ? MEM.plaqueSVG(m, {}) : '') + '</div>';

    return h;
  }

  /* ═══ RENDU ═══ */

  function rendre() {
    var hote = etat.hote;
    if (!hote) return;
    hote.innerHTML = '<div class="sv-boite"></div>';
    var boite = hote.firstChild;

    var m = etat.ouvert
      ? etat.fiches.filter(function (f) { return f.jeton === etat.ouvert; })[0]
      : null;

    if (m && !window.MelodiaQR) {
      boite.innerHTML = '<p class="sv-vide">Le module du code ne s’est pas chargé. Rechargez la page.</p>';
      return;
    }

    boite.innerHTML = m ? vueFiche(m) : vueListe();
    brancher(boite, m);

    if (m) monterPhotos(m);
  }

  function monterPhotos(m) {
    var cible = document.getElementById('sv-photos');
    if (!cible) return;
    if (!window.MelodiaPhotos) {
      cible.innerHTML = '<p class="sv-vide">Le module des photos ne s’est pas chargé. Rechargez la page.</p>';
      return;
    }
    window.MelodiaPhotos.monter(cible, {
      jeton: m.jeton,
      photos: m.photos || [],
      sauver: async function (liste) {
        var maj = await MEM.enregistrer(m.jeton, { photos: liste });
        /* On recopie ce que la base a réellement retenu : c'est elle
           qui fait foi, et c'est elle qui refuse la sixième. */
        m.photos = (maj && maj.photos) || liste;
      }
    });
  }

  /* ═══ BRANCHEMENTS ═══ */

  function brancher(boite, m) {
    var dire = function (t, genre) {
      var z = document.getElementById('sv-msg');
      if (!z) { if (t) alert(t); return; }
      z.textContent = t || '';
      z.className = 'form-msg' + (genre ? ' ' + genre : '');
      z.style.display = t ? 'block' : 'none';
    };

    boite.addEventListener('click', async function (ev) {
      var cible = ev.target.closest ? ev.target : null;
      if (!cible) return;

      var creer = cible.closest('[data-creer]');
      if (creer) {
        creer.disabled = true; creer.textContent = 'Création…';
        var o = etat.candidates.filter(function (x) { return x.ref === creer.dataset.creer; })[0];
        try {
          var neuve = await MEM.creer(o, etat.options.email, 'famille', 0);
          await charger(etat.options.email);
          etat.ouvert = neuve && neuve.jeton ? neuve.jeton : null;
          rendre();
        } catch (e) {
          creer.disabled = false; creer.textContent = 'Créer sa page';
          alert(e.message);
        }
        return;
      }

      var ouvrir = cible.closest('[data-ouvrir]');
      if (ouvrir) { etat.ouvert = ouvrir.dataset.ouvrir; rendre(); window.scrollTo(0, 0); return; }

      if (cible.closest('[data-retour]')) { etat.ouvert = null; rendre(); window.scrollTo(0, 0); return; }

      var b = cible.closest('[data-act]');
      if (!b || !m) return;
      var act = b.dataset.act;

      if (act === 'copier') {
        try { await navigator.clipboard.writeText(MEM.adresse(m.jeton)); }
        catch (e) {
          var z = boite.querySelector('.sv-adresse code');
          if (z) { var r = document.createRange(); r.selectNodeContents(z); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        }
        b.textContent = 'Copié';
        setTimeout(function () { b.textContent = 'Copier'; }, 1600);
        return;
      }

      if (act === 'imprimer') { window.print(); return; }

      if (act === 'svg') {
        MEM.telecharger('plaque-' + m.jeton + '.svg', MEM.plaqueSVG(m, {}), 'image/svg+xml');
        return;
      }

      if (act === 'png') {
        var res = window.MelodiaQR.canevas(MEM.adresse(m.jeton), { niveau: 'H', taille: 2000, marge: 4 });
        res.canevas.toBlob(function (blob) {
          var u = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = u; a.download = 'code-' + m.jeton + '.png';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        }, 'image/png');
        return;
      }

      if (act === 'enregistrer') {
        b.disabled = true;
        var champs = {
          nom: (document.getElementById('sv-nom') || {}).value || '',
          ne_le: (document.getElementById('sv-ne') || {}).value || null,
          parti_le: (document.getElementById('sv-parti') || {}).value || null,
          message: (document.getElementById('sv-mot') || {}).value || '',
          paroles: (document.getElementById('sv-paroles') || {}).value || ''
        };
        try {
          var maj = await MEM.enregistrer(m.jeton, champs);
          Object.keys(champs).forEach(function (k) { m[k] = maj && maj[k] !== undefined ? maj[k] : champs[k]; });
          dire('Enregistré.', 'ok');
        } catch (e) { dire(e.message, 'err'); }
        b.disabled = false;
        return;
      }

      if (act === 'bascule') {
        /* Mettre en ligne le nom d'un mort n'est pas un réglage. On
           demande, et on dit exactement ce qui devient visible. */
        if (!m.actif && !confirm(
          'Mettre cette page en ligne ?\n\n' +
          'Toute personne qui scanne le code — ou à qui vous donnez le lien — ' +
          'verra son nom, ses dates, ses photos et entendra sa musique.\n\n' +
          'La page n’apparaît pas dans les moteurs de recherche, et vous pouvez ' +
          'la retirer à tout moment.')) return;
        b.disabled = true;
        try {
          var r2 = await MEM.enregistrer(m.jeton, { actif: !m.actif });
          m.actif = r2 ? r2.actif : !m.actif;
          rendre();
        } catch (e) { b.disabled = false; dire(e.message, 'err'); }
        return;
      }
    });
  }

  /* ═══ MONTAGE ═══ */

  async function espace(hote, options) {
    if (!hote) return;
    options = options || {};
    MEM = window.MelodiaMemorial;

    if (!MEM) {
      hote.innerHTML = '<div class="esp-vide"><p>Le module des pages de souvenir ne s’est pas chargé.</p></div>';
      return;
    }
    if (!enLigne() || !options.email) {
      hote.innerHTML = '<div class="esp-vide"><p>La base n’est pas connectée : ' +
        'les pages de souvenir ne peuvent pas être consultées ici.</p></div>';
      return;
    }

    etat.hote = hote;
    etat.options = options;
    hote.innerHTML = '<div class="sv-boite"><p class="sv-chargement">Chargement…</p></div>';

    try { await charger(options.email); }
    catch (e) {
      hote.innerHTML = '<div class="sv-boite"><div class="form-msg err" style="display:block;">' +
        esc(e.message) + '</div></div>';
      return;
    }
    rendre();
  }

  window.MelodiaSouvenir = { espace: espace };
})();
