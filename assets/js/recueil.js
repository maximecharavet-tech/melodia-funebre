/* ═══════════════════════════════════════════════════════════════
   recueil.js — Filets d'or et entrées lentes (bibliothèque Motion, MIT)

   Ce que fait ce module, et rien d'autre :

   · LES FILETS D'OR ([data-filet]) se tracent de gauche à droite quand
     ils entrent dans l'écran, en une seconde et demie. Un filet est une
     ligne d'un pixel : l'or ne sert jamais d'aplat.
   · LES GROUPES ([data-recueil]) font entrer leurs éléments
     ([data-recueil-item]) l'un après l'autre, d'un léger mouvement
     vertical — le rythme d'une main qui pose des cartes, pas celui
     d'une démonstration.

   Ce qui est déjà à l'écran au chargement n'est jamais caché puis
   montré : seuls les éléments encore sous la ligne de flottaison sont
   préparés. Sans JavaScript, ou pour qui a demandé à réduire les
   animations, tout est simplement là, immobile.

   Complète motion.js (titre, poussière, portes), ne le remplace pas.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var M = window.MelodiaMotion;
  if (!M || !M.inView || !M.animate) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var DOUX = [0.22, 1, 0.36, 1];
  var hauteur = window.innerHeight || 800;

  function sousLaLigne(el) {
    return el.getBoundingClientRect().top > hauteur * 0.92;
  }

  /* Filets */
  var filets = Array.prototype.filter.call(document.querySelectorAll('[data-filet]'), sousLaLigne);
  filets.forEach(function (f) {
    f.style.transformOrigin = f.getAttribute('data-filet') === 'centre' ? '50% 50%' : '0 50%';
    f.style.transform = 'scaleX(0)';
    f.style.opacity = '0';
  });
  filets.forEach(function (f) {
    M.inView(f, function () {
      M.animate(f, { transform: ['scaleX(0)', 'scaleX(1)'], opacity: [0, 1] },
        { duration: 1.6, ease: DOUX });
    }, { amount: 0.8 });
  });

  /* Groupes */
  var groupes = Array.prototype.filter.call(document.querySelectorAll('[data-recueil]'), sousLaLigne);
  groupes.forEach(function (g) {
    var items = g.querySelectorAll('[data-recueil-item]');
    if (!items.length) return;
    Array.prototype.forEach.call(items, function (i) {
      i.style.opacity = '0';
      i.style.transform = 'translateY(14px)';
    });
    M.inView(g, function () {
      M.animate(items, { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0)'] },
        { duration: 1.1, ease: DOUX, delay: M.stagger(0.14) });
    }, { amount: 0.2 });
  });
})();
