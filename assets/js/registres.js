/* ═══════════════════════════════════════════════════════════════
   LE CARROUSEL DES REGISTRES

   Vingt registres en grille occupaient cinq rangées et près de mille
   pixels de haut : on les survolait sans en retenir un. Ils tiennent
   maintenant sur une seule ligne qui défile.

   CE QUI EST FAIT ICI, ET CE QUI NE L'EST PAS

   Le défilement lui-même est natif — « overflow-x » et
   « scroll-snap ». C'est le navigateur qui le gère : inertie au doigt,
   accroche à la carte, molette horizontale, tout est déjà là et se
   comporte correctement sur chaque appareil. Ce fichier n'ajoute que
   ce que le natif ne donne pas :

     · les deux flèches, qui avancent d'un écran plein de cartes ;
     · leur état désactivé aux deux bouts, pour qu'on voie qu'on y est ;
     · la jauge d'or, qui dit où l'on en est ;
     · le glisser à la souris, que le tactile a et que le bureau n'a pas.

   SI CE FICHIER NE SE CHARGE PAS, la bande défile quand même : elle
   reste une zone à défilement horizontal ordinaire. Les flèches sont
   donc créées ICI, en JavaScript, et non dans le HTML — sans elles,
   pas de boutons morts à l'écran.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var FLECHE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  function installer(boite) {
    var piste = boite.querySelector('[data-piste]');
    if (!piste) return;

    /* Le pas : la largeur d'une carte, filet compris. Mesurée, jamais
       supposée — elle change avec la fenêtre (clamp en CSS). */
    function pas() {
      var c = piste.firstElementChild;
      if (!c) return 200;
      var deux = c.nextElementSibling;
      /* L'écart réel entre deux cartes vaut la différence de leurs
         positions : cela tient compte du filet d'un pixel sans avoir
         à le relire dans la feuille de style. */
      return deux ? (deux.offsetLeft - c.offsetLeft) : c.offsetWidth;
    }

    /* On avance d'autant de cartes entières qu'il en tient à l'écran,
       jamais moins d'une : sur un téléphone où une seule carte est
       visible, la flèche avance bien d'une carte. */
    function bond() {
      var p = pas();
      return Math.max(1, Math.floor(piste.clientWidth / p)) * p;
    }

    var prec = document.createElement('button');
    var suiv = document.createElement('button');
    prec.className = 'reg-fleche reg-prec';
    suiv.className = 'reg-fleche reg-suiv';
    prec.type = suiv.type = 'button';
    prec.innerHTML = FLECHE;
    suiv.innerHTML = FLECHE;
    prec.setAttribute('aria-label', 'Registres précédents');
    suiv.setAttribute('aria-label', 'Registres suivants');
    boite.appendChild(prec);
    boite.appendChild(suiv);

    var jauge = boite.querySelector('[data-jauge]');

    function etat() {
      var max = piste.scrollWidth - piste.clientWidth;
      var x = piste.scrollLeft;
      /* Deux pixels de tolérance : les navigateurs n'atteignent pas
         toujours le maximum au pixel près, et la flèche resterait
         active au bout de la course. */
      prec.disabled = x <= 2;
      suiv.disabled = x >= max - 2;
      if (jauge) {
        var part = piste.clientWidth / piste.scrollWidth;
        jauge.style.width = Math.min(100, part * 100) + '%';
        jauge.style.transform = 'translateX(' + (max > 0 ? (x / max) * ((1 / part) - 1) * 100 : 0) + '%)';
      }
      boite.classList.toggle('reg-debut', x <= 2);
      boite.classList.toggle('reg-fin', x >= max - 2);
    }

    var attente = false;
    piste.addEventListener('scroll', function () {
      if (attente) return;
      attente = true;
      requestAnimationFrame(function () { attente = false; etat(); });
    }, { passive: true });

    prec.addEventListener('click', function () { piste.scrollBy({ left: -bond(), behavior: doux() }); });
    suiv.addEventListener('click', function () { piste.scrollBy({ left: bond(), behavior: doux() }); });

    function doux() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    }

    /* ─── Le glisser à la souris ───────────────────────────────────
       Le tactile fait déjà défiler du doigt ; la souris, non. On le
       lui donne — en prenant garde à ne pas casser le clic : tant que
       le pointeur n'a pas bougé de plus de six pixels, c'est un clic
       et le lien doit s'ouvrir. Au-delà, c'est un glissement, et le
       clic qui suit est annulé à la capture. */
    var attrape = false, depart = 0, gauche = 0, bouge = 0;

    piste.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      attrape = true; bouge = 0;
      depart = e.clientX; gauche = piste.scrollLeft;
      piste.classList.add('reg-attrape');
    });

    piste.addEventListener('pointermove', function (e) {
      if (!attrape) return;
      var d = e.clientX - depart;
      if (Math.abs(d) > bouge) bouge = Math.abs(d);
      if (bouge > 6) {
        /* La capture n'est prise qu'une fois le geste reconnu :
           la prendre dès l'appui volerait le clic aux liens. */
        if (piste.setPointerCapture && e.pointerId != null) {
          try { piste.setPointerCapture(e.pointerId); } catch (_) {}
        }
        piste.scrollLeft = gauche - d;
      }
    });

    function lacher(e) {
      if (!attrape) return;
      attrape = false;
      piste.classList.remove('reg-attrape');
      if (e && piste.releasePointerCapture && e.pointerId != null) {
        try { piste.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      /* Le drapeau retombe au tour suivant, après le clic que le
         navigateur envoie en fin de geste. */
      setTimeout(function () { bouge = 0; }, 0);
    }
    piste.addEventListener('pointerup', lacher);
    piste.addEventListener('pointercancel', lacher);
    piste.addEventListener('click', function (e) {
      if (bouge > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    piste.addEventListener('dragstart', function (e) { if (bouge > 6) e.preventDefault(); });

    window.addEventListener('resize', etat, { passive: true });
    etat();
    boite.classList.add('reg-vivant');
  }

  function demarrer() {
    var boites = document.querySelectorAll('[data-carrousel]');
    for (var i = 0; i < boites.length; i++) installer(boites[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
})();
