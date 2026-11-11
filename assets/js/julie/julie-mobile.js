/*!
 * julie-mobile.js — Console Julie v2 · barre d’onglets mobile et balayage.
 *
 * Sous 640 px de large :
 *   · affiche une barre d’onglets fixe (Journée / Pipeline / Prospects / Envois)
 *     avec l’onglet courant souligné ;
 *   · ajoute des actions de balayage sur les cartes `.jv2-carte`
 *     (droite = intéressé, gauche = passer) ;
 *   · ajoute un padding bas pour ne pas masquer le contenu.
 *
 * Aucune interaction ne se déclenche hors mobile. Le comportement desktop
 * existant n’est pas affecté.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J) return;

  var REDUCED = !!(window.MelodiaMotion && window.MelodiaMotion.reduced);

  var ONGLETS = [
    { hash: 'journee',   label: 'Journée' },
    { hash: 'pipeline',  label: 'Pipeline' },
    { hash: 'prospects', label: 'Prospects' },
    { hash: 'accueil',   label: 'Envois' }
  ];

  function esc(s) { return J.esc(s); }

  function estMobile() {
    return window.matchMedia('(max-width: 640px)').matches;
  }

  function hashCourant() {
    var h = (window.location.hash || '').replace(/^#/, '');
    return h || 'journee';
  }

  function barreHTML() {
    return '' +
      '<nav class="jv2-mobile-tabs" aria-label="Navigation principale">' +
        ONGLETS.map(function (o) {
          return '<button type="button" class="jv2-mobile-tab" data-hash="' + esc(o.hash) + '" ' +
            'aria-current="' + (hashCourant() === o.hash ? 'page' : 'false') + '">' +
            '<span class="jv2-mobile-tab-icone" aria-hidden="true"></span>' +
            '<span>' + esc(o.label) + '</span>' +
          '</button>';
        }).join('') +
      '</nav>';
  }

  function monterBarre() {
    /* La barre du bas existe déjà (mobile.js, entrées data-mob) : on ne la double pas. */
    if (!window.__jv2BarreMobile) return;
    if (!estMobile()) return;
    if (document.querySelector('.jv2-mobile-tabs')) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = barreHTML();
    var barre = wrapper.firstChild;
    document.body.appendChild(barre);

    barre.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-hash]');
      if (!b) return;
      window.location.hash = '#' + b.dataset.hash;
    });
  }

  function mettreAJourActif() {
    var barre = document.querySelector('.jv2-mobile-tabs');
    if (!barre) return;
    barre.querySelectorAll('[data-hash]').forEach(function (b) {
      b.setAttribute('aria-current', b.dataset.hash === hashCourant() ? 'page' : 'false');
    });
  }

  function demonterBarre() {
    if (estMobile()) return;
    var b = document.querySelector('.jv2-mobile-tabs');
    if (b) b.remove();
  }

  // ─── Swipe actions sur les cartes ────────────────────────────────────
  var SEUIL = 60;

  function attacherSwipe(carte) {
    if (!carte || carte.dataset.jv2Swipe === '1') return;
    carte.dataset.jv2Swipe = '1';
    var startX = 0, startY = 0, dx = 0, dy = 0, actif = false;

    var hintD = document.createElement('span');
    hintD.className = 'jv2-swipe-hint jv2-swipe-droite';
    hintD.textContent = '✓ intéressé';
    var hintG = document.createElement('span');
    hintG.className = 'jv2-swipe-hint jv2-swipe-gauche';
    hintG.textContent = 'passer ✕';
    carte.style.position = 'relative';
    carte.appendChild(hintD);
    carte.appendChild(hintG);

    carte.addEventListener('touchstart', function (ev) {
      if (!estMobile() || !ev.touches[0]) return;
      startX = ev.touches[0].clientX;
      startY = ev.touches[0].clientY;
      dx = 0; dy = 0; actif = true;
    }, { passive: true });

    carte.addEventListener('touchmove', function (ev) {
      if (!actif || !ev.touches[0]) return;
      dx = ev.touches[0].clientX - startX;
      dy = ev.touches[0].clientY - startY;
      if (Math.abs(dy) > Math.abs(dx)) return; // laisse le scroll vertical
      if (Math.abs(dx) < 8) return;
      if (!REDUCED) carte.style.transform = 'translateX(' + Math.max(-70, Math.min(70, dx)).toFixed(1) + 'px)';
      carte.classList.toggle('jv2-carte-swipe-droite', dx > SEUIL);
      carte.classList.toggle('jv2-carte-swipe-gauche', dx < -SEUIL);
    }, { passive: true });

    carte.addEventListener('touchend', function () {
      if (!actif) return;
      actif = false;
      if (!REDUCED) carte.style.transform = '';
      carte.classList.remove('jv2-carte-swipe-droite', 'jv2-carte-swipe-gauche');
      if (dx > SEUIL) declencherSwipe(carte, 'droite');
      else if (dx < -SEUIL) declencherSwipe(carte, 'gauche');
      dx = 0; dy = 0;
    }, { passive: true });
  }

  function declencherSwipe(carte, direction) {
    var siret = carte.dataset.siret;
    if (!siret) return;
    var bouton;
    if (direction === 'droite') {
      bouton = carte.querySelector('[data-act="interesse"]') ||
               carte.querySelector('[data-act="deplacer"][data-vers="interesse"]');
    } else {
      bouton = carte.querySelector('[data-act="passer"]') ||
               carte.querySelector('[data-act="pas-maintenant"]') ||
               carte.querySelector('[data-act="stop"]');
    }
    if (bouton) {
      try { bouton.click(); } catch (_) {}
    } else if (window.MelodiaMotion && window.MelodiaMotion.toast) {
      window.MelodiaMotion.toast('Action indisponible sur cette carte.', { type: 'warn' });
    }
  }

  function attacherSwipes(root) {
    if (!estMobile()) return;
    (root || document).querySelectorAll('.jv2-carte').forEach(attacherSwipe);
  }

  // ─── Init ────────────────────────────────────────────────────────────
  function init() {
    monterBarre();
    mettreAJourActif();
    attacherSwipes(document);

    var main = document.querySelector('.dash-main');
    if (main && typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function () { attacherSwipes(main); });
      obs.observe(main, { childList: true, subtree: true });
    }

    window.addEventListener('hashchange', mettreAJourActif);

    window.addEventListener('resize', function () {
      if (estMobile()) monterBarre();
      else demonterBarre();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MelodiaJulieMobile = {
    monter: monterBarre,
    demonter: demonterBarre,
    attacherSwipes: attacherSwipes
  };
})();
