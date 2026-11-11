/*!
 * julie-motion.js — Console Julie v2 · mouvement et micro-interactions.
 *
 * Contient :
 *   · la séquence d’arrivée (premier chargement de la journée) : logo,
 *     « Bonjour Julie » mot à mot, cascade des panneaux, sous 1,6 s,
 *     interruptible par n’importe quelle touche ou clic ;
 *   · un wrapper pour l’API View Transitions (`document.startViewTransition`),
 *     avec repli CSS (fondu + 8 px) quand elle n’est pas disponible ;
 *   · le survol magnétique (3 px max) sur les boutons et entrées du sidebar ;
 *   · la gerbe de « poussière d’or » sur canvas (≤ 60 particules, < 900 ms) ;
 *   · les toasts empilables (Sonner-like) ;
 *   · le morphing « Envoyer → Envoi… → ✓ Envoyé » des boutons d’envoi ;
 *   · un helper de skeleton à shimmer doré.
 *
 * Aucune dépendance, aucun bundler. `prefers-reduced-motion: reduce` désactive
 * tous les effets animés (les transitions basculent en fondu/opacité).
 *
 * N’utilise que transform et opacity pour les animations.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J) return;

  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var ATTENTE = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // ─── Arrivée du jour ─────────────────────────────────────────────────
  function cleArrivee() {
    return 'melodia.julie.arrivee.' + J.aujourdhuiParis();
  }

  function dejaVuAujourdhui() {
    try { return localStorage.getItem(cleArrivee()) === '1'; }
    catch (_) { return false; }
  }

  function marquerVuAujourdhui() {
    try { localStorage.setItem(cleArrivee(), '1'); } catch (_) { /* quota */ }
  }

  /**
   * Joue la séquence d’arrivée sur `racine` (une vue déjà rendue).
   * Ne fait rien si on est déjà passé aujourd’hui, ou si l’utilisateur
   * a demandé moins d’animation. Retourne une promesse résolue à la fin.
   */
  function arrivee(racine) {
    if (!racine) return Promise.resolve();
    if (REDUCED) return Promise.resolve();
    if (dejaVuAujourdhui()) return Promise.resolve();
    marquerVuAujourdhui();

    // Skip par touche ou clic
    var skipped = false;
    function skip() { skipped = true; }
    document.addEventListener('keydown', skip, { once: true, passive: true });
    document.addEventListener('click', skip, { once: true, passive: true });

    // 1. Logo (titre « Bonjour Julie »)
    var hello = racine.querySelector('.jv2-hello');
    if (hello) hello.classList.add('jv2-anim-logo');

    // 2. Mot à mot sur .jv2-hello — on remplace le texte par des spans.
    if (hello) {
      var texte = hello.textContent || '';
      var mots = texte.split(/(\s+)/);
      hello.innerHTML = mots.map(function (m) {
        if (!m.trim()) return m;
        return '<span class="jv2-mot">' + J.esc(m) + '</span>';
      }).join('');
      var spans = hello.querySelectorAll('.jv2-mot');
      Array.prototype.forEach.call(spans, function (s, i) {
        s.style.animationDelay = (120 + i * 55) + 'ms';
      });
    }

    // 3. Cascade des panneaux
    var panneaux = racine.querySelectorAll('.jv2-section, .jv2-entete, .jv2-kpis, .jv2-dash-grille, .jv2-dash-barlists');
    Array.prototype.forEach.call(panneaux, function (el, i) {
      el.style.animationDelay = (240 + i * 40) + 'ms';
      el.classList.add('jv2-anim-cascade');
    });

    return ATTENTE(1500).then(function () {
      document.removeEventListener('keydown', skip);
      document.removeEventListener('click', skip);
      if (skipped) return;
      // Nettoyage des classes (l’état final doit rester visible)
      Array.prototype.forEach.call(panneaux, function (el) {
        el.classList.remove('jv2-anim-cascade');
        el.style.animationDelay = '';
      });
    });
  }

  // ─── View transitions ────────────────────────────────────────────────
  function avecTransition(fn) {
    if (REDUCED || typeof document.startViewTransition !== 'function') {
      try {
        var r = fn();
        return Promise.resolve(r);
      } catch (e) {
        return Promise.reject(e);
      }
    }
    return new Promise(function (resolve, reject) {
      var transition;
      try {
        transition = document.startViewTransition(function () {
          try {
            var r = fn();
            if (r && typeof r.then === 'function') r.then(function () {}).catch(function () {});
            resolve(r);
          } catch (e) {
            reject(e);
          }
        });
      } catch (e) {
        // Repli : on exécute simplement
        try { resolve(fn()); } catch (e2) { reject(e2); }
        return;
      }
      if (transition && transition.finished) transition.finished.catch(function () {});
    });
  }

  // ─── Survol magnétique ──────────────────────────────────────────────
  function magnetiser(el) {
    if (REDUCED || !el || el.dataset.jv2Magnet === '1') return;
    el.dataset.jv2Magnet = '1';
    var actif = false;
    el.addEventListener('mousemove', function (ev) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var dx = (ev.clientX - r.left - r.width / 2) / r.width;
      var dy = (ev.clientY - r.top - r.height / 2) / r.height;
      var tx = Math.max(-3, Math.min(3, dx * 3));
      var ty = Math.max(-3, Math.min(3, dy * 3));
      el.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px)';
      actif = true;
    });
    el.addEventListener('mouseleave', function () {
      if (!actif) return;
      el.style.transform = '';
      actif = false;
    });
    el.addEventListener('blur', function () { el.style.transform = ''; });
  }

  function magnetiserAll(racine) {
    if (REDUCED) return;
    var cible = racine || document;
    var els = cible.querySelectorAll('.btn, .jv2-side-item, .side-item');
    Array.prototype.forEach.call(els, magnetiser);
  }

  // ─── Poussière d’or ─────────────────────────────────────────────────
  function burst(ancre, opts) {
    if (REDUCED || !ancre) return;
    opts = opts || {};
    var n = Math.min(60, opts.n || 60);
    var rect = ancre.getBoundingClientRect();
    var taille = 400;
    var canvas = document.createElement('canvas');
    canvas.width = taille;
    canvas.height = taille;
    canvas.style.cssText =
      'position:fixed;left:' + (rect.left + rect.width / 2 - taille / 2) + 'px;' +
      'top:' + (rect.top + rect.height / 2 - taille / 2) + 'px;' +
      'pointer-events:none;z-index:9999;';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) { document.body.removeChild(canvas); return; }

    var particules = [];
    var centre = taille / 2;
    for (var i = 0; i < n; i++) {
      var angle = Math.random() * Math.PI * 2;
      var vitesse = 1 + Math.random() * 3;
      particules.push({
        x: centre, y: centre,
        vx: Math.cos(angle) * vitesse,
        vy: Math.sin(angle) * vitesse - 1.2,
        vie: 1,
        taille: 1 + Math.random() * 2
      });
    }

    var debut = performance.now();
    function frame(t) {
      var ecoule = t - debut;
      ctx.clearRect(0, 0, taille, taille);
      for (var i = 0; i < particules.length; i++) {
        var p = particules[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.vie -= 0.012;
        if (p.vie > 0) {
          ctx.fillStyle = 'rgba(227, 201, 119, ' + Math.max(0, p.vie).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (ecoule < 900) requestAnimationFrame(frame);
      else if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
    requestAnimationFrame(frame);
  }

  // ─── Toasts ─────────────────────────────────────────────────────────
  function conteneurToasts() {
    var c = document.querySelector('.jv2-toasts');
    if (c) return c;
    c = document.createElement('div');
    c.className = 'jv2-toasts';
    c.setAttribute('aria-live', 'polite');
    document.body.appendChild(c);
    return c;
  }

  function toast(msg, opts) {
    opts = opts || {};
    var type = opts.type || 'info';
    var c = conteneurToasts();
    var el = document.createElement('div');
    el.className = 'jv2-toast jv2-toast-' + type;
    el.textContent = msg;
    c.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('jv2-toast-in'); });
    var duree = typeof opts.duree === 'number' ? opts.duree : 3200;
    setTimeout(function () {
      el.classList.remove('jv2-toast-in');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 320);
    }, duree);
  }

  // ─── Morphing du bouton d’envoi ─────────────────────────────────────
  function morphEnvoyer(bouton, promesse) {
    if (!bouton) return Promise.resolve();
    var initial = bouton.getAttribute('data-texte-initial') || bouton.textContent;
    bouton.setAttribute('data-texte-initial', initial);
    bouton.disabled = true;
    bouton.dataset.etat = 'encours';
    bouton.textContent = 'Envoi…';
    return Promise.resolve(promesse)
      .then(function (r) {
        bouton.dataset.etat = 'ok';
        bouton.textContent = '✓ Envoyé';
        setTimeout(function () {
          bouton.disabled = false;
          bouton.dataset.etat = '';
          bouton.textContent = initial;
        }, 1400);
        return r;
      }, function (e) {
        bouton.dataset.etat = 'erreur';
        bouton.textContent = 'Erreur';
        setTimeout(function () {
          bouton.disabled = false;
          bouton.dataset.etat = '';
          bouton.textContent = initial;
        }, 1600);
        throw e;
      });
  }

  // ─── Skeleton ───────────────────────────────────────────────────────
  function skeleton(conteneur, n) {
    if (!conteneur) return;
    var max = Math.max(1, Math.min(8, n || 3));
    var html = '';
    for (var i = 0; i < max; i++) html += '<div class="jv2-skel"></div>';
    conteneur.innerHTML = html;
  }

  // ─── Init globale ───────────────────────────────────────────────────
  function init() {
    magnetiserAll();
    // Rescan après chaque mutation de la zone principale (vues Julie)
    var main = document.querySelector('.dash-main');
    if (main && typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function (mutations) {
        var besoin = false;
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes && mutations[i].addedNodes.length) { besoin = true; break; }
        }
        if (besoin) magnetiserAll(main);
      });
      obs.observe(main, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MelodiaMotion = {
    reduced: REDUCED,
    arrivee: arrivee,
    avecTransition: avecTransition,
    magnetiser: magnetiser,
    magnetiserAll: magnetiserAll,
    burst: burst,
    toast: toast,
    morphEnvoyer: morphEnvoyer,
    skeleton: skeleton
  };
})();
