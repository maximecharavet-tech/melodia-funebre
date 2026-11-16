/* ═══════════════════════════════════════════════════════════════
   hero-film.js — La succession de la couverture

   Huit plans, dans l'ordre du manifeste. Deux lecteurs : pendant que
   l'un est à l'écran, l'autre charge le suivant, et ils se cèdent la
   place par un fondu. Le premier plan démarre sur le fichier léger,
   puis passe à la version pleine s'il en a le temps.

   Rien ne part tout seul pour qui a demandé moins de mouvement, une
   économie de données, ou un réseau trop lent : l'affiche tient alors
   le rôle. Le bouton pause est là parce que le film dure plus de
   cinq secondes — on doit pouvoir l'arrêter.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var racine = document.querySelector('[data-hero-film]');
  var bloc = document.getElementById('hero-suite');
  if (!racine || !bloc) return;

  var suite;
  try { suite = JSON.parse(bloc.textContent); } catch (e) { return; }
  var plans = suite.plans || [];
  if (!plans.length) return;

  var TENUE = suite.tenue || 6.8;
  var FONDU = Math.round((suite.fondu || 1.55) * 1000);
  var TYPE_AV1 = 'video/webm; codecs="av01.0.08M.08"';
  var TYPE_H264 = 'video/mp4; codecs="avc1.640028"';
  var TYPE_LEGER = 'video/mp4; codecs="avc1.64001F"';

  var affiche = racine.querySelector('.hero-affiche');
  var image = affiche ? affiche.querySelector('img') : null;
  var sourcesAffiche = affiche ? affiche.querySelectorAll('source') : [];
  var va = racine.querySelector('[data-plan="a"]');
  var vb = racine.querySelector('[data-plan="b"]');
  var bouton = racine.querySelector('.hero-pause');
  var traits = racine.querySelectorAll('.hero-chap span');

  var portrait = window.matchMedia('(max-width: 860px) and (orientation: portrait)');
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reseau = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
  var typeReseau = reseau.effectiveType || '';
  /* « 4g » annoncé avec un débit modeste reste un réseau qui tient
     le fichier léger. On ne renonce au film que sur un vrai réseau
     lent, ou quand le visiteur a demandé l'économie de données. */
  var econome = reseau.saveData === true
    || typeReseau === 'slow-2g' || typeReseau === '2g' || typeReseau === '3g'
    || (typeReseau !== '4g' && typeof reseau.downlink === 'number' && reseau.downlink > 0 && reseau.downlink < 0.8);

  var index = 0;
  var actif = va;
  var repos = vb;
  var phase = 'lecture';
  var pauseMain = false;
  var visible = true;
  var formatCourant = '';
  var suivantPret = -1;
  var legerEnCours = false;
  var monteeDemandee = false;
  var monteeAnnulee = false;
  var raf = 0;
  var tourne = false;
  var finFondu = 0;
  var mode = 'film';

  function formatCle() { return portrait.matches ? 'p' : 'l'; }
  function paquet(i) { return plans[i][formatCle()]; }
  function position(i) { return formatCle() === 'p' ? plans[i].posP : plans[i].posL; }

  function veutJouer() {
    return mode === 'film' && !pauseMain && visible && !document.hidden;
  }

  function armer(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  }

  function vider(video, relacher) {
    video._silence = true;
    video.pause();
    video.autoplay = false;
    video.removeAttribute('autoplay');
    video.removeAttribute('src');
    while (video.firstChild) video.removeChild(video.firstChild);
    if (relacher) {
      try { video.load(); } catch (e) {}
    }
    video._silence = false;
  }

  function monter(video, descripteur) {
    var jeton = (video._jeton || 0) + 1;
    video._jeton = jeton;
    vider(video, false);
    video.preload = 'auto';
    if (descripteur.leger) {
      var leger = document.createElement('source');
      leger.src = descripteur.mp4;
      leger.type = TYPE_LEGER;
      video.appendChild(leger);
    } else {
      if (descripteur.webm) {
        var w = document.createElement('source');
        w.src = descripteur.webm;
        w.type = TYPE_AV1;
        video.appendChild(w);
      }
      if (descripteur.mp4) {
        var m = document.createElement('source');
        m.src = descripteur.mp4;
        m.type = TYPE_H264;
        video.appendChild(m);
      }
    }
    try { video.load(); } catch (e) {}
    video._silence = false;
    return jeton;
  }

  function jouer(video) {
    armer(video);
    video.autoplay = true;
    var prom = video.play();
    if (prom && prom.catch) {
      prom.catch(function () {
        if (video !== actif) return;
        pauseMain = true;
        rafraichirBouton();
        racine.classList.add('film-repos');
      });
    }
  }

  function cadrer(video, i) {
    var pos = position(i);
    video.style.objectPosition = pos;
    video.style.transformOrigin = pos;
  }

  function souffle(video) {
    video.classList.remove('ken');
    void video.offsetWidth;
    video.classList.add('ken');
  }

  function majChapitres(progres) {
    for (var k = 0; k < traits.length; k++) {
      var li = traits[k].parentNode;
      li.classList.toggle('fait', k < index);
      li.classList.toggle('actif', k === index);
      if (k < index) traits[k].style.transform = 'scaleX(1)';
      else if (k > index) traits[k].style.transform = 'scaleX(0)';
    }
    if (traits[index] && typeof progres === 'number') {
      var p = progres < 0 ? 0 : progres > 1 ? 1 : progres;
      traits[index].style.transform = 'scaleX(' + p.toFixed(3) + ')';
    }
  }

  function rafraichirBouton() {
    if (!bouton) return;
    var enPause = pauseMain;
    racine.classList.toggle('est-pause', enPause);
    bouton.setAttribute('aria-pressed', enPause ? 'true' : 'false');
    bouton.setAttribute('aria-label', enPause ? 'Reprendre le film' : 'Mettre le film en pause');
  }

  function sourcesDu(i, vouloirLeger) {
    var p = paquet(i);
    if (vouloirLeger && p.leger) return { mp4: p.leger, leger: true };
    return { webm: p.webm, mp4: p.mp4, leger: false };
  }

  function preparerSuivant() {
    if (legerEnCours) return;
    var n = (index + 1) % plans.length;
    if (suivantPret === n && repos.readyState >= 2 && repos._format === formatCle()) return;
    var desc = sourcesDu(n, false);
    monter(repos, desc);
    cadrer(repos, n);
    repos._format = formatCle();
    repos._index = n;
    suivantPret = n;
  }

  function abandonnerMontee() {
    if (!legerEnCours) return;
    legerEnCours = false;
    monteeAnnulee = true;
    vider(repos, true);
    suivantPret = -1;
    preparerSuivant();
  }

  function demanderMontee() {
    if (monteeDemandee || !legerEnCours) return;
    var p = paquet(0);
    if (!p.webm && !p.mp4) return;
    monteeDemandee = true;
    var jeton = monter(repos, { webm: p.webm, mp4: p.mp4, leger: false });
    cadrer(repos, 0);
    repos._format = formatCle();
    repos._index = 0;
    var tenter = function () {
      if (repos._jeton !== jeton || monteeAnnulee || !legerEnCours || phase !== 'lecture') return;
      if (actif.currentTime > TENUE - 2.2) return;
      if (repos.readyState < 3) return;
      var cible = actif.currentTime || 0;
      var lancer = function () {
        if (repos._jeton !== jeton || monteeAnnulee || !legerEnCours || phase !== 'lecture') return;
        if (actif.currentTime > TENUE - 2.2) return;
        fondre(repos, 720, true);
      };
      try {
        if (Math.abs((repos.currentTime || 0) - cible) > 0.2) {
          var filet = setTimeout(lancer, 450);
          repos.addEventListener('seeked', function () {
            clearTimeout(filet);
            lancer();
          }, { once: true });
          repos.currentTime = cible;
          return;
        }
      } catch (e) {}
      lancer();
    };
    if (repos.readyState >= 3) tenter();
    else repos.addEventListener('canplay', tenter, { once: true });
  }

  function fondre(entrant, duree, estMontee) {
    if (phase === 'fondu') return;
    phase = 'fondu';
    clearTimeout(finFondu);
    var sortant = actif;
    racine.style.setProperty('--hero-fondu', (duree / 1000) + 's');
    cadrer(entrant, estMontee ? index : (index + 1) % plans.length);
    souffle(entrant);
    entrant.classList.add('est-la');
    jouer(entrant);
    sortant.classList.remove('est-la');
    finFondu = setTimeout(function () {
      sortant.classList.remove('ken', 'est-la');
      sortant.pause();
      actif = entrant;
      repos = sortant;
      if (estMontee) {
        legerEnCours = false;
      } else {
        index = (index + 1) % plans.length;
      }
      phase = 'lecture';
      suivantPret = -1;
      vider(repos, true);
      majChapitres(0);
      if (!estMontee && index === 0) legerEnCours = false;
      if (veutJouer()) {
        if (actif.paused) jouer(actif);
        racine.classList.remove('film-repos');
      } else {
        actif.pause();
        racine.classList.add('film-repos');
      }
      if (!legerEnCours) preparerSuivant();
    }, duree + 60);
  }

  function commencerChapitre() {
    if (phase !== 'lecture') return;
    var n = (index + 1) % plans.length;
    if (suivantPret !== n || repos._format !== formatCle()) preparerSuivant();
    if (repos.readyState < 2 && actif.currentTime < 9.3 && !actif.ended) return;
    try { repos.currentTime = 0; } catch (e) {}
    legerEnCours = false;
    fondre(repos, FONDU, false);
  }

  function tick() {
    if (phase !== 'lecture' || !actif || actif.paused) return;
    var t = actif.currentTime;
    if (!isFinite(t)) return;
    majChapitres(t / TENUE);
    if (legerEnCours && t >= 1.2 && t < TENUE - 2.2) demanderMontee();
    if (legerEnCours && t >= TENUE - 2.2) abandonnerMontee();
    if (!legerEnCours && t >= 3.1) preparerSuivant();
    if (t >= TENUE || actif.ended) commencerChapitre();
  }

  function boucle() {
    if (tourne) return;
    tourne = true;
    var pas = function () {
      if (!tourne) return;
      raf = requestAnimationFrame(pas);
      tick();
    };
    raf = requestAnimationFrame(pas);
  }

  function synchroniser() {
    if (mode !== 'film' || !actif) return;
    if (veutJouer()) {
      racine.classList.remove('film-repos');
      if (actif.paused && actif.readyState >= 2 && phase === 'lecture') jouer(actif);
      boucle();
    } else {
      actif.pause();
      racine.classList.add('film-repos');
    }
  }

  function lancerFilm() {
    mode = 'film';
    racine.classList.add('film-actif');
    formatCourant = formatCle();
    legerEnCours = !!paquet(0).leger;
    var desc = sourcesDu(0, true);
    monter(actif, desc);
    cadrer(actif, 0);
    actif._format = formatCourant;
    var parti = function () {
      souffle(actif);
      actif.classList.add('est-la');
      racine.classList.add('film-lance');
      boucle();
    };
    actif.addEventListener('playing', parti, { once: true });
    if (veutJouer()) jouer(actif);
    majChapitres(0);
    rafraichirBouton();
  }

  function auFormat() {
    var f = formatCle();
    if (f === formatCourant) return;
    formatCourant = f;
    if (mode !== 'film') {
      poserAffiche(index);
      return;
    }
    if (phase === 'fondu') return;
    var t = actif.currentTime || 0;
    var desc = sourcesDu(index, legerEnCours && index === 0);
    monter(actif, desc);
    cadrer(actif, index);
    actif.addEventListener('loadeddata', function une() {
      actif.removeEventListener('loadeddata', une);
      try { actif.currentTime = Math.min(t, 8); } catch (e) {}
      synchroniser();
    });
    vider(repos, true);
    suivantPret = -1;
    if (!legerEnCours) preparerSuivant();
  }

  /* ─── Moins de mouvement : les affiches se relaient, très lentement ─── */
  var calmeTimer = 0;
  var calmeFondu = false;

  function poserAffiche(i) {
    if (!image) return;
    var p = paquet(i);
    var land = plans[i].l;
    var port = plans[i].p;
    if (sourcesAffiche[0]) sourcesAffiche[0].srcset = port.avif;
    if (sourcesAffiche[1]) sourcesAffiche[1].srcset = port.jpg;
    if (sourcesAffiche[2]) sourcesAffiche[2].srcset = land.avif;
    image.src = land.jpg;
    image.style.objectPosition = position(i);
  }

  function prechargerAffiche(i) {
    var p = paquet(i);
    var im = new Image();
    im.src = p.avif || p.jpg;
  }

  function armerCalme() {
    clearTimeout(calmeTimer);
    if (pauseMain || !visible || document.hidden || calmeFondu) return;
    prechargerAffiche((index + 1) % plans.length);
    calmeTimer = setTimeout(fonduCalme, 12000);
  }

  function fonduCalme() {
    if (pauseMain || !visible || document.hidden || calmeFondu || !affiche) return;
    calmeFondu = true;
    var debut = performance.now();
    var duree = 2200;
    var bascule = false;
    var suivant = (index + 1) % plans.length;
    var pas = function (now) {
      if (pauseMain || document.hidden || !visible) {
        affiche.style.opacity = '';
        calmeFondu = false;
        return;
      }
      var k = Math.min(1, (now - debut) / duree);
      affiche.style.opacity = String(k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2);
      if (!bascule && k >= 0.5) {
        bascule = true;
        index = suivant;
        poserAffiche(index);
        majChapitres(1);
      }
      if (k < 1) requestAnimationFrame(pas);
      else {
        affiche.style.opacity = '';
        calmeFondu = false;
        armerCalme();
      }
    };
    requestAnimationFrame(pas);
  }

  function lancerCalme() {
    mode = 'calme';
    racine.classList.add('film-calme');
    majChapitres(1);
    rafraichirBouton();
    if (!pauseMain) armerCalme();
  }

  function apresSeuil(fn) {
    var html = document.documentElement;
    if (html.classList.contains('intro-off')) { fn(); return; }
    if (!document.body.classList.contains('intro-open')) { fn(); return; }
    var obs = new MutationObserver(function () {
      if (!document.body.classList.contains('intro-open')) {
        obs.disconnect();
        fn();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  if (bouton) {
    bouton.addEventListener('click', function () {
      pauseMain = !pauseMain;
      rafraichirBouton();
      if (mode === 'film') synchroniser();
      else if (pauseMain) clearTimeout(calmeTimer);
      else armerCalme();
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) {
      visible = ents[0].isIntersecting;
      racine.classList.toggle('hors-champ', !visible);
      if (mode === 'film') synchroniser();
      else if (visible && !pauseMain) armerCalme();
      else clearTimeout(calmeTimer);
    }, { threshold: 0.12 }).observe(racine);
  }

  document.addEventListener('visibilitychange', function () {
    if (mode === 'film') synchroniser();
    else if (!document.hidden && visible && !pauseMain) armerCalme();
    else clearTimeout(calmeTimer);
  });

  if (portrait.addEventListener) portrait.addEventListener('change', auFormat);
  else if (portrait.addListener) portrait.addListener(auFormat);

  [va, vb].forEach(function (video) {
    if (!video) return;
    armer(video);
    video.addEventListener('ended', function () {
      if (video === actif && phase === 'lecture') commencerChapitre();
    });
    video.addEventListener('error', function () {
      if (video._silence) return;
      if (!video.querySelector('source') && !video.getAttribute('src')) return;
      if (video._repli) return;
      var mp4 = video.querySelector('source[type^="video/mp4"]');
      if (!mp4) return;
      video._repli = true;
      var url = mp4.src;
      var garder = video === actif;
      vider(video);
      video.src = url;
      try { video.load(); } catch (e) {}
      if (garder && veutJouer()) jouer(video);
    });
  });

  if (reduit) {
    apresSeuil(lancerCalme);
    return;
  }
  if (econome) return;

  apresSeuil(lancerFilm);
})();
