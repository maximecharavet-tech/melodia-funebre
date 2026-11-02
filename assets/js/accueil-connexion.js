/* ═══════════════════════════════════════════════════════════════
   L'ACCUEIL APRÈS CONNEXION

   Entre le mot de passe et le tableau de bord, un moment : le film
   d'ouverture, muet, et le nom de la personne qui vient d'entrer.
   La console est un outil de travail qu'on ouvre plusieurs fois par
   jour — rien ne doit donc retenir : un clic, une touche, et l'on
   passe. Le film joue jusqu'à son terme si on le laisse faire.

   Muet par choix, pas par contrainte : on ouvre sa console entre
   deux rendez-vous, parfois devant une famille.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUIT = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.MelodiaAccueil = {
    /* Montre l'accueil puis emmène à `destination`. Rend une promesse
       qui n'est jamais rejetée : un accueil raté ne doit jamais
       empêcher quelqu'un d'entrer chez lui. */
    saluer: function (nom, destination) {
      return new Promise(function (fini) {
        var parti = false;
        function adresse(dest) {
          var d = String(dest || '/compte');
          if (/^https?:\/\//.test(d)) return d;
          if (d.charAt(0) !== '/') d = '/' + d;
          return d.replace(/\.html(?=$|\?)/, '');
        }
        function partir() {
          if (parti) return;
          parti = true;
          try { if (voile && voile.parentNode) voile.classList.add('sort'); } catch (e) {}
          setTimeout(function () { location.replace(adresse(destination)); fini(); }, 160);
        }

        /* En mouvement réduit, on n'impose ni film ni attente. */
        if (REDUIT) { location.replace(adresse(destination)); return fini(); }

        var voile = document.createElement('div');
        voile.className = 'accueil';
        voile.setAttribute('role', 'status');
        voile.innerHTML =
          '<video class="accueil-film" muted playsinline preload="none" poster="/assets/img/connexion-poster.jpg" ' +
          'width="720" height="610" aria-hidden="true"></video>' +
          '<div class="accueil-mots">' +
            '<span class="accueil-sur">Bienvenue</span>' +
            '<span class="accueil-nom"></span>' +
            '<span class="accueil-suite">Votre tableau de bord s\'ouvre</span>' +
          '</div>' +
          '<button type="button" class="accueil-passer">Passer</button>';

        /* textContent et non innerHTML : le nom vient d'un compte, donc
           d'une saisie. On ne rend jamais du texte de compte en HTML. */
        voile.querySelector('.accueil-nom').textContent = nom || '';
        document.body.appendChild(voile);
        requestAnimationFrame(function () { voile.classList.add('vu'); });

        var film = voile.querySelector('.accueil-film');
        var src = (window.MELODIA_ACCUEIL_FILM || '/assets/img/connexion.mp4');
        film.src = src;
        try { var lecture = film.play(); if (lecture && lecture.catch) lecture.catch(function () {}); } catch (e) {}

        /* Le film ne retient personne : une seconde et demie, puis la
           console, que la vidéo ait démarré ou non. */
        setTimeout(partir, 1500);
        film.addEventListener('ended', partir);
        film.addEventListener('error', partir);

        voile.addEventListener('click', partir);
        voile.querySelector('.accueil-passer').addEventListener('click', partir);
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); partir(); }
        });
      });
    }
  };
})();
