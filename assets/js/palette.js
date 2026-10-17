/* ═══════════════════════════════════════════════════════════════
   palette.js — Aller partout au clavier (⌘K / Ctrl K)

   POURQUOI

   La console du fondateur compte une vingtaine d'entrées, réparties
   en deux groupes ; la console commerciale une quinzaine. Chercher
   « Plaques QR » dans une colonne de vingt libellés, c'est la lire de
   haut en bas à chaque fois. Les outils de gestion modernes ont tous
   la même réponse : une palette qui s'ouvre au clavier, où l'on tape
   trois lettres et où l'on valide.

   RIEN À MAINTENIR EN DOUBLE

   La palette ne connaît aucune entrée. Elle relit la barre latérale
   au moment où elle s'ouvre — la console commerciale construit la
   sienne à la volée — et, quand on choisit une ligne, elle actionne
   le bouton d'origine. Une entrée ajoutée au menu y figure d'office.

   ACCESSIBILITÉ

   Boîte de dialogue modale, champ en « combobox » relié à une liste
   par aria-activedescendant : un lecteur d'écran annonce la ligne
   active à chaque flèche. Échap ferme et rend le focus là où il était.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var side = document.getElementById('side');
  if (!side) return;

  var MAC = /Mac|iPhone|iPad/.test(navigator.platform || '') || /Mac OS/.test(navigator.userAgent || '');
  var TOUCHE = MAC ? '⌘K' : 'Ctrl K';

  var sansAccent = function (s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  };

  /* ─── Le bouton d'ouverture, en tête du menu ───
     La touche ne se devine pas : le bouton la montre. */
  var declencheur = document.createElement('button');
  declencheur.type = 'button';
  declencheur.className = 'side-recherche';
  declencheur.setAttribute('aria-haspopup', 'dialog');
  declencheur.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
    '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>' +
    '<span class="side-recherche-mot">Aller à…</span><kbd>' + TOUCHE + '</kbd>';
  var marque = side.querySelector('.side-brand');
  if (marque && marque.nextSibling) side.insertBefore(declencheur, marque.nextSibling);
  else side.insertBefore(declencheur, side.firstChild);

  /* ─── La boîte ─── */
  var voile = document.createElement('div');
  voile.className = 'pal-voile';
  voile.hidden = true;
  voile.innerHTML =
    '<div class="pal" role="dialog" aria-modal="true" aria-label="Aller à une section">' +
      '<div class="pal-tete">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
          '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>' +
        '<input class="pal-champ" type="text" role="combobox" aria-expanded="true" aria-controls="pal-liste" ' +
          'aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Rechercher une section…" ' +
          'aria-label="Rechercher une section">' +
        '<kbd class="pal-echap">Échap</kbd>' +
      '</div>' +
      '<ul class="pal-liste" id="pal-liste" role="listbox" aria-label="Sections"></ul>' +
      '<div class="pal-pied"><span><kbd>↑</kbd><kbd>↓</kbd> choisir</span><span><kbd>Entrée</kbd> ouvrir</span></div>' +
    '</div>';
  document.body.appendChild(voile);

  var champ = voile.querySelector('.pal-champ');
  var liste = voile.querySelector('.pal-liste');
  var entrees = [], visibles = [], actif = 0, retour = null;

  /* La barre latérale relue à chaque ouverture, avec le groupe de
     chaque entrée (« Direction », « Développement »…). */
  function relire() {
    var groupe = '';
    entrees = [];
    Array.prototype.forEach.call(side.querySelectorAll('.side-label, .side-item'), function (el) {
      if (el.classList.contains('side-label')) { groupe = el.textContent.trim(); return; }
      /* Une entrée masquée (rôle, réglage) ne s'offre pas non plus ici. */
      if (el.hidden || getComputedStyle(el).display === 'none') return;
      var ico = el.querySelector('.ico');
      var badge = el.querySelector('.side-badge');
      var nom = Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 3; })
        .map(function (n) { return n.textContent; }).join(' ').replace(/\s+/g, ' ').trim() || el.textContent.trim();
      entrees.push({
        el: el, nom: nom, groupe: groupe,
        ico: ico ? ico.textContent : '·',
        badge: badge && badge.style.display !== 'none' && badge.textContent.trim() !== '0' ? badge.textContent.trim() : '',
        actuel: el.classList.contains('active'),
        cle: sansAccent(nom + ' ' + groupe + ' ' + (el.getAttribute('data-mob') || ''))
      });
    });
  }

  function dessiner() {
    var q = sansAccent(champ.value.trim());
    var mots = q.split(/\s+/).filter(Boolean);
    visibles = entrees.filter(function (e) {
      return mots.every(function (m) { return e.cle.indexOf(m) !== -1; });
    });
    /* Ce qui commence par la saisie passe devant ce qui la contient. */
    if (q) visibles.sort(function (a, b) {
      return (sansAccent(a.nom).indexOf(q) === 0 ? 0 : 1) - (sansAccent(b.nom).indexOf(q) === 0 ? 0 : 1);
    });
    if (actif >= visibles.length) actif = Math.max(0, visibles.length - 1);

    if (!visibles.length) {
      liste.innerHTML = '<li class="pal-rien" role="presentation">Aucune section ne correspond à « ' +
        champ.value.replace(/[<>&"]/g, '') + ' ».</li>';
      champ.removeAttribute('aria-activedescendant');
      return;
    }
    var groupePrec = null;
    liste.innerHTML = visibles.map(function (e, i) {
      var tete = '';
      if (!q && e.groupe !== groupePrec) {
        tete = '<li class="pal-groupe" role="presentation">' + e.groupe + '</li>';
        groupePrec = e.groupe;
      }
      return tete + '<li class="pal-ligne' + (i === actif ? ' actif' : '') + '" id="pal-o' + i + '" role="option" ' +
        'aria-selected="' + (i === actif) + '" data-i="' + i + '">' +
        '<span class="pal-ico" aria-hidden="true">' + e.ico + '</span>' +
        '<span class="pal-nom">' + e.nom.replace(/</g, '&lt;') + '</span>' +
        (e.badge ? '<span class="pal-badge">' + e.badge + '</span>' : '') +
        (e.actuel ? '<span class="pal-ici">ici</span>' : (q && e.groupe ? '<span class="pal-g">' + e.groupe + '</span>' : '')) +
      '</li>';
    }).join('');
    champ.setAttribute('aria-activedescendant', 'pal-o' + actif);
    var a = liste.querySelector('.pal-ligne.actif');
    if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
  }

  function ouvrir() {
    if (!voile.hidden) return;
    retour = document.activeElement;
    relire();
    champ.value = '';
    actif = Math.max(0, entrees.findIndex(function (e) { return e.actuel; }));
    voile.hidden = false;
    document.documentElement.classList.add('pal-ouverte');
    dessiner();
    setTimeout(function () { champ.focus(); }, 0);
  }
  function fermer(rendreFocus) {
    if (voile.hidden) return;
    voile.hidden = true;
    document.documentElement.classList.remove('pal-ouverte');
    if (rendreFocus !== false && retour && retour.focus) { try { retour.focus(); } catch (e) {} }
  }
  function choisir(i) {
    var e = visibles[i];
    if (!e) return;
    fermer(false);
    /* Sur téléphone le menu est un tiroir : on le referme derrière soi. */
    side.classList.remove('open');
    e.el.click();
    var main = document.getElementById('view') || document.querySelector('.dash-main');
    if (main) { main.setAttribute('tabindex', '-1'); try { main.focus({ preventScroll: true }); } catch (er) {} }
  }

  declencheur.addEventListener('click', ouvrir);
  voile.addEventListener('mousedown', function (ev) { if (ev.target === voile) fermer(); });
  liste.addEventListener('click', function (ev) {
    var li = ev.target.closest && ev.target.closest('.pal-ligne');
    if (li) choisir(+li.dataset.i);
  });
  liste.addEventListener('mousemove', function (ev) {
    var li = ev.target.closest && ev.target.closest('.pal-ligne');
    if (li && +li.dataset.i !== actif) { actif = +li.dataset.i; dessiner(); }
  });
  champ.addEventListener('input', function () { actif = 0; dessiner(); });
  champ.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); actif = (actif + 1) % Math.max(visibles.length, 1); dessiner(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); actif = (actif - 1 + visibles.length) % Math.max(visibles.length, 1); dessiner(); }
    else if (ev.key === 'Enter') { ev.preventDefault(); choisir(actif); }
    else if (ev.key === 'Escape') { ev.preventDefault(); fermer(); }
    else if (ev.key === 'Tab') { ev.preventDefault(); }
  });

  document.addEventListener('keydown', function (ev) {
    var k = (ev.key || '').toLowerCase();
    if ((ev.metaKey || ev.ctrlKey) && k === 'k') {
      ev.preventDefault();
      if (voile.hidden) ouvrir(); else fermer();
      return;
    }
    /* « / » ouvre aussi, sauf quand on écrit déjà quelque part. */
    if (k === '/' && voile.hidden && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
      var t = ev.target;
      var ecrit = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
      if (!ecrit) { ev.preventDefault(); ouvrir(); }
    }
  });

  window.MelodiaPalette = { ouvrir: ouvrir, fermer: fermer };
})();
