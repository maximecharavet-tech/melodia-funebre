/* ═══════════════════════════════════════════════════════════════
   motion.js — Le mouvement du site public

   Ce qui bouge, et pourquoi :

   · LE TITRE D'ACCUEIL arrive mot à mot, chaque mot remontant d'un
     voile de flou. C'est la première phrase que lit une famille : elle
     doit se poser, pas apparaître d'un bloc.
   · LA POUSSIÈRE D'OR flotte derrière le premier écran — une lumière
     de chapelle, lente. Elle s'arrête quand l'écran n'est plus visible
     ou quand l'onglet est en arrière-plan : elle ne coûte rien au repos.
   · LES PORTES ET LES BOUTONS DORÉS suivent le curseur de quelques
     pixels, et une lumière s'y déplace sous la pointe : on sent que la
     carte répond.
   · LA PARALLAXE, la barre de progression, l'estompage du premier
     écran et le dévoilement des titres sont confiés au navigateur
     (animations pilotées par le défilement, dans la feuille de style) :
     aucun calcul à chaque pixel de défilement, aucune saccade.
   · LES TRANSITIONS ENTRE PAGES aussi (View Transitions, feuille de
     style) : l'ancienne page recule et s'efface, la nouvelle monte.

   Tout s'éteint pour qui a demandé à réduire les animations, et la
   poussière d'or ne se lève pas en économie de données.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUIT = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUIT) return;
  var reseau = navigator.connection || {};
  var ECONOME = !!reseau.saveData;
  var SOURIS = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ─── Le titre, mot à mot ───
     On enveloppe chaque mot sans toucher au sens : <br> et <em> restent
     en place, et le texte lu par un lecteur d'écran est inchangé. */
  $$('[data-titre-anime]').forEach(function (h) {
    var n = 0;
    (function envelopper(el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (noeud) {
        if (noeud.nodeType === 3) {
          var morceaux = noeud.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          morceaux.forEach(function (m) {
            if (!m) return;
            if (/^\s+$/.test(m)) { frag.appendChild(document.createTextNode(m)); return; }
            var s = document.createElement('span');
            s.className = 'mot';
            s.style.setProperty('--i', n++);
            s.textContent = m;
            frag.appendChild(s);
          });
          noeud.parentNode.replaceChild(frag, noeud);
        } else if (noeud.nodeType === 1 && noeud.tagName !== 'BR') {
          envelopper(noeud);
        }
      });
    })(h);
    h.classList.add('titre-anime');
    requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('parti'); }); });
  });

  /* ─── Magnétisme et lumière sous la pointe ─── */
  if (SOURIS) {
    $$('[data-magnetique], .btn-gold').forEach(function (el) {
      var force = el.hasAttribute('data-magnetique') ? 6 : 4;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        el.style.translate = ((x - 0.5) * force).toFixed(2) + 'px ' + ((y - 0.5) * force).toFixed(2) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
      el.classList.add('magnetique');
    });
  }

  /* ─── Poussière d'or derrière le premier écran ─── */
  var hero = document.querySelector('.hero-video');
  if (hero && !ECONOME && window.HTMLCanvasElement) {
    var toile = document.createElement('canvas');
    toile.className = 'poussiere';
    toile.setAttribute('aria-hidden', 'true');
    hero.insertBefore(toile, hero.firstChild);
    var ctx = toile.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, grains = [], visible = true, actif = true, dernier = 0;

    var taille = function () {
      W = hero.clientWidth; H = hero.clientHeight;
      toile.width = W * dpr; toile.height = H * dpr;
      toile.style.width = W + 'px'; toile.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var voulu = Math.round(Math.min(90, W * H / 16000));
      while (grains.length < voulu) grains.push(nouveau(true));
      grains.length = voulu;
    };
    var nouveau = function (partout) {
      return {
        x: Math.random() * W, y: partout ? Math.random() * H : H + 10,
        r: Math.random() * 1.6 + 0.4, v: Math.random() * 0.25 + 0.08,
        d: (Math.random() - 0.5) * 0.15, p: Math.random() * Math.PI * 2, s: Math.random() * 0.02 + 0.006
      };
    };
    var dessiner = function (t) {
      if (!visible || !actif) { dernier = 0; return; }
      requestAnimationFrame(dessiner);
      var dt = dernier ? Math.min((t - dernier) / 16.7, 3) : 1;
      dernier = t;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < grains.length; i++) {
        var g = grains[i];
        g.y -= g.v * dt; g.x += g.d * dt + Math.sin(g.p) * 0.12; g.p += g.s * dt;
        if (g.y < -10) grains[i] = g = nouveau(false);
        var a = 0.25 + Math.sin(g.p * 2) * 0.25 + 0.25;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(232, 201, 120,' + a.toFixed(3) + ')';
        ctx.shadowColor = 'rgba(232, 201, 120, 0.8)';
        ctx.shadowBlur = g.r * 4;
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    taille();
    window.addEventListener('resize', function () { taille(); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible) requestAnimationFrame(dessiner);
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      actif = !document.hidden;
      if (actif) requestAnimationFrame(dessiner);
    });
    requestAnimationFrame(dessiner);
  }

  /* ─── Repli des animations pilotées par le défilement ───
     Les navigateurs qui ne savent pas lier une animation au défilement
     reçoivent la barre de progression par ce script ; la parallaxe et
     l'estompage, purement décoratifs, n'y ont simplement pas lieu. */
  if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
    var barre = document.createElement('div');
    barre.className = 'progression progression-js';
    barre.setAttribute('aria-hidden', 'true');
    document.body.appendChild(barre);
    var maj = function () {
      var h = document.documentElement;
      var p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      barre.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    };
    maj();
    window.addEventListener('scroll', maj, { passive: true });
  } else {
    var barreCss = document.createElement('div');
    barreCss.className = 'progression';
    barreCss.setAttribute('aria-hidden', 'true');
    document.body.appendChild(barreCss);
  }
})();
