/* ═══════════════════════════════════════════════════════════════
   MELODIA — Le livret des paroles, relié à la platine

   Sur les pages « maman » et « papa », les paroles sont posées sous le disque d'or.
   Ce script ne fait qu'une chose : dire, en tête du livret, quelle
   voix est en train de chanter. La platine (catalogue.js) l'annonce
   par l'événement « melodia:platine » ; sans lui, le livret reste un
   texte imprimé, complet et lisible.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var livret = document.querySelector('[data-livret]');
  var bandeau = livret && livret.querySelector('[data-livret-ecoute]');
  if (!livret || !bandeau) return;

  document.addEventListener('melodia:platine', function (e) {
    var d = e.detail || {};
    var joue = !!d.joue;
    livret.classList.toggle('en-ecoute', joue);
    if (joue && d.qui) {
      bandeau.innerHTML = '<span class="livret-vu" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span>En écoute · ' + String(d.qui).replace(/[<>&]/g, '') + '</span>';
      bandeau.hidden = false;
    } else {
      bandeau.hidden = true;
    }
  });
})();
