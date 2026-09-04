/* ═══════════════════════════════════════════════════════════════
   MELODIA — Catalogue des réalisations

   Chaque hommage composé devient une fiche : la personne, son
   histoire, les mots que la famille nous avait confiés, et l'œuvre
   qui en est née — écoutable sur place.

   Le catalogue est rendu côté serveur (référencement, et il reste
   lisible sans JavaScript), puis repris ici pour l'écoute. Il se
   remonte tout seul quand le propriétaire ajoute une musique depuis
   sa console : content.js le rappelle avec la nouvelle liste.

   Un seul élément audio pour tout le catalogue — deux hommages ne
   peuvent jamais se superposer, et la barre d'écoute suit la lecture
   pendant qu'on fait défiler les fiches.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var grille = document.querySelector('[data-catalogue]');
  if (!grille) return;

  var REDUIT = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BARRES = 20;

  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  var PREC = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 6h2v12H7zM19 6v12l-9-6z"/></svg>';
  var SUIV = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15 6h2v12h-2zM5 6l9 6-9 6z"/></svg>';
  var CROIX = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  /* Sur téléphone, sept récits complets font sept écrans à faire défiler :
     on ne voit plus la vitrine, on la traverse. La fiche se replie donc sur
     l'essentiel — qui, quel registre, combien de temps — et l'histoire se
     déplie à la demande, ou d'elle-même quand l'hommage se met à jouer. */
  var ETROIT = window.matchMedia('(max-width: 720px)');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(s) {
    if (!isFinite(s) || s < 0) return '—:—';
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }

  /* Le sceau porte l'initiale de la personne : chaque fiche se
     distingue sans qu'aucune photo ne soit demandée à la famille. */
  function initiale(o) {
    var source = (o.who || o.title || '').trim();
    return source ? source.charAt(0).toUpperCase() : '♪';
  }

  /* ─── Données ─── */
  function lireDonnees() {
    if (window.MELODIA_OEUVRES) return window.MELODIA_OEUVRES;
    var bloc = document.getElementById('oeuvres-data');
    if (!bloc) return [];
    try { return JSON.parse(bloc.textContent) || []; } catch (e) { return []; }
  }

  var OEUVRES = [];
  var visibles = [];        /* indices retenus par le filtre courant */
  var cartes = [];          /* une entrée par œuvre, ou null si filtrée */
  var cur = -1, joue = false;
  var durees = {};

  var audio = new Audio();
  audio.preload = 'none';

  /* ─── Spectre réel ─── */
  var ctx = null, analyseur = null, spectre = null;
  function graphe() {
    if (ctx || REDUIT) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      var src = ctx.createMediaElementSource(audio);
      analyseur = ctx.createAnalyser();
      analyseur.fftSize = 128;
      analyseur.smoothingTimeConstant = 0.8;
      /* Le son doit continuer d'atteindre les enceintes une fois routé */
      src.connect(analyseur);
      analyseur.connect(ctx.destination);
      spectre = new Uint8Array(analyseur.frequencyBinCount);
    } catch (e) { ctx = null; analyseur = null; }
  }

  /* ─── Barre d'écoute, créée à la demande ─── */
  var barre = null, bTitre, bQui, bLire, bTemps, bJauge, bRemplit, bOnde, bBarres = [];

  function creerBarre() {
    if (barre) return barre;
    barre = document.createElement('div');
    barre.className = 'ecoute';
    barre.setAttribute('role', 'region');
    barre.setAttribute('aria-label', 'Lecture en cours');
    barre.innerHTML =
      '<div class="ecoute-inner">' +
        '<div class="ecoute-onde" aria-hidden="true"></div>' +
        '<button type="button" class="ecoute-nav" data-prec aria-label="Hommage précédent">' + PREC + '</button>' +
        '<button type="button" class="ecoute-lire" data-lire aria-label="Mettre en pause">' + PAUSE + '</button>' +
        '<button type="button" class="ecoute-nav" data-suiv aria-label="Hommage suivant">' + SUIV + '</button>' +
        '<div class="ecoute-info"><strong data-titre></strong><span data-qui></span></div>' +
        '<div class="ecoute-jauge" data-jauge tabindex="0" role="slider" aria-label="Position dans l\'hommage" ' +
          'aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>' +
        '<span class="ecoute-temps" data-temps>0:00</span>' +
        '<button type="button" class="ecoute-fermer" data-fermer aria-label="Arrêter l\'écoute">' + CROIX + '</button>' +
      '</div>';
    document.body.appendChild(barre);

    bTitre = barre.querySelector('[data-titre]');
    bQui = barre.querySelector('[data-qui]');
    bLire = barre.querySelector('[data-lire]');
    bTemps = barre.querySelector('[data-temps]');
    bJauge = barre.querySelector('[data-jauge]');
    bRemplit = bJauge.querySelector('span');
    bOnde = barre.querySelector('.ecoute-onde');

    for (var i = 0; i < BARRES * 2; i++) {
      var s = document.createElement('span');
      bOnde.appendChild(s);
      bBarres.push(s);
    }

    barre.querySelector('[data-lire]').addEventListener('click', function () { basculer(cur); });
    barre.querySelector('[data-prec]').addEventListener('click', function () { sauter(-1); });
    barre.querySelector('[data-suiv]').addEventListener('click', function () { sauter(1); });
    barre.querySelector('[data-fermer]').addEventListener('click', arreter);

    var viser = function (x) {
      if (!audio.duration) return;
      var r = bJauge.getBoundingClientRect();
      audio.currentTime = Math.min(Math.max((x - r.left) / r.width, 0), 1) * audio.duration;
    };
    var glisse = false;
    bJauge.addEventListener('pointerdown', function (e) {
      glisse = true; bJauge.setPointerCapture(e.pointerId); viser(e.clientX);
    });
    bJauge.addEventListener('pointermove', function (e) { if (glisse) viser(e.clientX); });
    bJauge.addEventListener('pointerup', function () { glisse = false; });
    bJauge.addEventListener('keydown', function (e) {
      if (!audio.duration) return;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.currentTime + 5, audio.duration); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(audio.currentTime - 5, 0); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Enter') { basculer(cur); e.preventDefault(); }
    });
    return barre;
  }

  /* ─── Animation du spectre ─── */
  var pas = 0, raf = null;
  function dessiner() {
    if (bBarres.length) {
      if (analyseur && joue) {
        analyseur.getByteFrequencyData(spectre);
        for (var i = 0; i < bBarres.length; i++) {
          /* Les basses saturent : on compresse pour garder un dessin lisible */
          var v = spectre[Math.floor(i * spectre.length / bBarres.length)] / 255;
          bBarres[i].style.height = (2 + Math.pow(v, 0.72) * 20) + 'px';
        }
      } else if (joue && !REDUIT) {
        pas++;
        for (var j = 0; j < bBarres.length; j++) {
          bBarres[j].style.height =
            (2 + Math.abs(Math.sin((pas + j * 2) * 0.09) * Math.cos((pas + j) * 0.04)) * 18) + 'px';
        }
      } else {
        for (var k = 0; k < bBarres.length; k++) bBarres[k].style.height = '2px';
      }
    }
    raf = requestAnimationFrame(dessiner);
  }

  /* ─── Rendu des fiches ─── */
  function fiche(o, i) {
    var art = document.createElement('article');
    art.className = 'oeuvre';
    art.setAttribute('data-oeuvre', String(i));
    if (o.style) art.setAttribute('data-style', o.style);

    var lieu = o.lieu ? ' · ' + esc(o.lieu) : '';
    var onde = '';
    for (var b = 0; b < BARRES; b++) onde += '<span style="animation-delay:' + (b * 0.07).toFixed(2) + 's"></span>';

    var idDetail = 'oe-detail-' + i;
    art.innerHTML =
      '<div class="oeuvre-haut">' +
        '<div class="oeuvre-sceau" aria-hidden="true"><span>' + esc(initiale(o)) + '</span></div>' +
        '<button type="button" class="oeuvre-lire" data-lire="' + i + '" ' +
          'aria-label="Écouter ' + esc(o.title) + '">' + PLAY + '</button>' +
        '<div class="oeuvre-onde" aria-hidden="true">' + onde + '</div>' +
        '<span class="oeuvre-duree" data-duree>—:—</span>' +
      '</div>' +
      '<div class="oeuvre-corps">' +
        '<div class="oeuvre-style">' + esc(o.style || 'Composition originale') + lieu + '</div>' +
        '<h3 class="oeuvre-titre"><em>' + esc(o.title || 'Sans titre') + '</em></h3>' +
        (o.who ? '<div class="oeuvre-qui">Pour ' + esc(o.who) + '</div>' : '') +
        '<button type="button" class="oeuvre-plus" data-plus aria-expanded="false" ' +
          'aria-controls="' + idDetail + '"><span data-plus-libelle>Son histoire</span>' + CHEVRON + '</button>' +
        '<div class="oeuvre-detail" id="' + idDetail + '">' +
          (o.story ? '<p class="oeuvre-recit">' + esc(o.story) + '</p>' : '') +
          (o.lyrics ? '<blockquote class="oeuvre-vers">' + esc(o.lyrics) + '</blockquote>' : '') +
          (o.brief ? '<div class="oeuvre-brief">' +
              '<span class="mono">Les mots de la famille</span>' +
              '<em>« ' + esc(o.brief) + ' »</em>' +
            '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="oeuvre-jauge" aria-hidden="true"><span></span></div>';

    art.querySelector('[data-lire]').addEventListener('click', function () { basculer(i); });
    art.querySelector('[data-plus]').addEventListener('click', function () { deplier(i); });
    return art;
  }

  function rendre() {
    grille.innerHTML = '';
    cartes = OEUVRES.map(function () { return null; });
    visibles.forEach(function (i) {
      var c = fiche(OEUVRES[i], i);
      cartes[i] = c;
      grille.appendChild(c);
    });
    peindre();
    observerDurees();
    animerEntree();
    majCompact();
  }

  /* Les fiches montent en cascade à l'approche de l'écran. Le décalage
     est calculé sur celles qui entrent ensemble : la vague suit donc la
     largeur réelle de la grille, sans rien savoir du nombre de colonnes. */
  var oeilEntree = null;
  function animerEntree() {
    if (REDUIT || !('IntersectionObserver' in window)) {
      cartes.forEach(function (c) { if (c) c.classList.add('vu'); });
      return;
    }
    if (oeilEntree) oeilEntree.disconnect();
    oeilEntree = new IntersectionObserver(function (entrees) {
      var rang = 0;
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = (rang++ * 0.08).toFixed(2) + 's';
        e.target.classList.add('vu');
        oeilEntree.unobserve(e.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
    visibles.forEach(function (i) { if (cartes[i]) oeilEntree.observe(cartes[i]); });
  }

  /* Déplie ou replie le récit d'une fiche. Ouvrir n'a de sens que
     replié : sur grand écran tout est déjà là. */
  function deplier(i, force) {
    var c = cartes[i];
    if (!c) return;
    var ouvert = force === undefined ? !c.classList.contains('ouvert') : force;
    c.classList.toggle('ouvert', ouvert);
    var b = c.querySelector('[data-plus]');
    if (b) {
      b.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      var l = b.querySelector('[data-plus-libelle]');
      if (l) l.textContent = ouvert ? 'Masquer' : 'Son histoire';
    }
  }

  /* La grille se replie sous 720 px, et se rouvre au-delà */
  function majCompact() {
    grille.classList.toggle('compact', ETROIT.matches);
    if (!ETROIT.matches) cartes.forEach(function (c, i) { if (c) deplier(i, false); });
  }
  if (ETROIT.addEventListener) ETROIT.addEventListener('change', majCompact);
  else if (ETROIT.addListener) ETROIT.addListener(majCompact);

  /* Peint l'état de lecture sur les fiches et la barre */
  function peindre() {
    cartes.forEach(function (c, i) {
      if (!c) return;
      var actif = i === cur;
      c.classList.toggle('actif', actif);
      c.classList.toggle('joue', actif && joue);
      var bouton = c.querySelector('[data-lire]');
      if (bouton) {
        bouton.innerHTML = actif && joue ? PAUSE : PLAY;
        bouton.setAttribute('aria-label',
          (actif && joue ? 'Mettre en pause ' : 'Écouter ') + (OEUVRES[i].title || 'cet hommage'));
      }
      var d = c.querySelector('[data-duree]');
      if (d) d.textContent = fmt(durees[i]);
    });

    if (!barre) { majBoutonTout(); return; }
    var o = OEUVRES[cur];
    if (o) {
      bTitre.textContent = o.title || 'Hommage';
      bQui.textContent = [o.who, o.style].filter(Boolean).join(' · ');
    }
    majBoutonTout();
    bLire.innerHTML = joue ? PAUSE : PLAY;
    bLire.setAttribute('aria-label', joue ? 'Mettre en pause' : 'Reprendre la lecture');
    barre.classList.toggle('joue', joue);
  }

  /* ─── Durées : lues quand la fiche approche de l'écran ─── */
  var vu = {};
  function sonder(i) {
    if (vu[i] || !OEUVRES[i] || !OEUVRES[i].audio) return;
    vu[i] = true;
    var p = new Audio();
    p.preload = 'metadata';
    p.addEventListener('loadedmetadata', function () {
      if (isFinite(p.duration)) {
        durees[i] = p.duration;
        var c = cartes[i];
        var d = c && c.querySelector('[data-duree]');
        if (d) d.textContent = fmt(p.duration);
      }
    });
    p.addEventListener('error', function () {
      var c = cartes[i];
      var d = c && c.querySelector('[data-duree]');
      if (d) d.textContent = '—:—';
    });
    p.src = OEUVRES[i].audio;
  }

  var oeil = null;
  function observerDurees() {
    /* Un catalogue de cinquante hommages ne doit pas déclencher
       cinquante requêtes au chargement : on ne lit la durée que des
       fiches qui approchent de l'écran. */
    if (!('IntersectionObserver' in window)) { visibles.forEach(sonder); return; }
    if (oeil) oeil.disconnect();
    oeil = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        sonder(Number(e.target.getAttribute('data-oeuvre')));
        oeil.unobserve(e.target);
      });
    }, { rootMargin: '300px' });
    visibles.forEach(function (i) { if (cartes[i]) oeil.observe(cartes[i]); });
  }

  /* ─── Commandes ─── */
  function basculer(i) {
    if (i < 0 || !OEUVRES[i]) return;
    graphe();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    creerBarre();
    if (!raf) raf = requestAnimationFrame(dessiner);

    if (cur === i) {
      if (joue) audio.pause();
      else audio.play().catch(bloque);
      return;
    }
    cur = i;
    audio.src = OEUVRES[i].audio;
    /* On écoute une personne : son histoire s'ouvre avec sa chanson */
    if (ETROIT.matches) {
      visibles.forEach(function (j) { if (j !== i) deplier(j, false); });
      deplier(i, true);
    }
    barre.hidden = false;
    document.body.classList.add('a-ecoute');
    audio.play().catch(bloque);
    peindre();
  }

  /* Enchaîne dans l'ordre affiché, pas dans l'ordre des données :
     après un filtre, « suivant » doit rester ce qu'on voit. */
  function sauter(sens) {
    if (!visibles.length) return;
    var p = visibles.indexOf(cur);
    var n = visibles[(p + sens + visibles.length) % visibles.length];
    basculer(n);
  }

  function arreter() {
    audio.pause();
    audio.removeAttribute('src');
    cur = -1; joue = false;
    if (barre) barre.hidden = true;
    document.body.classList.remove('a-ecoute');
    if (bRemplit) bRemplit.style.width = '0';
    cartes.forEach(function (c) {
      if (!c) return;
      var g = c.querySelector('.oeuvre-jauge span');
      if (g) g.style.width = '0';
    });
    peindre();
  }

  function bloque() {
    joue = false;
    peindre();
    if (window.melodiaToast) window.melodiaToast('Touchez à nouveau pour lancer la lecture.');
  }

  audio.addEventListener('play', function () { joue = true; peindre(); });
  audio.addEventListener('pause', function () { joue = false; peindre(); });
  audio.addEventListener('loadedmetadata', function () {
    if (cur >= 0 && isFinite(audio.duration)) durees[cur] = audio.duration;
    peindre();
  });
  audio.addEventListener('timeupdate', function () {
    if (!audio.duration) return;
    var p = audio.currentTime / audio.duration;
    if (bRemplit) bRemplit.style.width = (p * 100) + '%';
    if (bJauge) bJauge.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    if (bTemps) bTemps.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    var c = cartes[cur];
    var g = c && c.querySelector('.oeuvre-jauge span');
    if (g) g.style.width = (p * 100) + '%';
  });
  audio.addEventListener('ended', function () {
    var p = visibles.indexOf(cur);
    if (p >= 0 && p < visibles.length - 1) basculer(visibles[p + 1]);
    else arreter();
  });
  audio.addEventListener('error', function () {
    if (!audio.getAttribute('src')) return;   /* arreter() vide la source */
    if (window.melodiaToast) window.melodiaToast('Cet hommage n\'a pas pu être chargé.');
    joue = false; peindre();
  });

  /* ─── Filtres par style ─── */
  var hoteFiltres = document.querySelector('[data-catalogue-filtres]');
  var filtreActif = '';

  function rendreFiltres() {
    if (!hoteFiltres) return;
    var styles = [];
    OEUVRES.forEach(function (o) {
      if (o.style && styles.indexOf(o.style) === -1) styles.push(o.style);
    });
    /* Un seul style dans le catalogue : le filtre n'apprend rien */
    if (styles.length < 2) { hoteFiltres.innerHTML = ''; hoteFiltres.hidden = true; return; }
    hoteFiltres.hidden = false;

    var compte = function (s) {
      return OEUVRES.filter(function (o) { return !s || o.style === s; }).length;
    };
    hoteFiltres.innerHTML =
      '<button type="button" class="cat-filtre" data-filtre="">Tout <span>' + OEUVRES.length + '</span></button>' +
      styles.map(function (s) {
        return '<button type="button" class="cat-filtre" data-filtre="' + esc(s) + '">' +
          esc(s) + ' <span>' + compte(s) + '</span></button>';
      }).join('');

    Array.prototype.forEach.call(hoteFiltres.querySelectorAll('[data-filtre]'), function (b) {
      b.addEventListener('click', function () { filtrer(b.getAttribute('data-filtre')); });
    });
    marquerFiltre();
  }

  function marquerFiltre() {
    if (!hoteFiltres) return;
    Array.prototype.forEach.call(hoteFiltres.querySelectorAll('[data-filtre]'), function (b) {
      var actif = b.getAttribute('data-filtre') === filtreActif;
      b.classList.toggle('actif', actif);
      b.setAttribute('aria-pressed', actif ? 'true' : 'false');
    });
  }

  function filtrer(style) {
    filtreActif = style || '';
    calculerVisibles();
    rendre();
    marquerFiltre();
  }

  function calculerVisibles() {
    visibles = [];
    OEUVRES.forEach(function (o, i) {
      if (filtreActif && o.style !== filtreActif) return;
      visibles.push(i);
    });
  }

  /* ─── « Tout écouter » : la vitrine en une touche ─── */
  var boutonTout = document.querySelector('[data-tout-ecouter]');
  if (boutonTout) {
    boutonTout.addEventListener('click', function () {
      if (joue) { arreter(); return; }
      if (cur >= 0) { basculer(cur); return; }
      if (visibles.length) basculer(visibles[0]);
    });
  }
  function majBoutonTout() {
    if (!boutonTout) return;
    boutonTout.classList.toggle('en-lecture', joue);
    var t = boutonTout.querySelector('[data-libelle]');
    if (t) t.textContent = joue ? 'Arrêter l\'écoute' : 'Tout écouter';
  }

  /* ─── Compteurs affichés ailleurs sur la page ─── */
  function majCompteurs() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-catalogue-total]'), function (e) {
      e.textContent = String(OEUVRES.length);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-catalogue-libelle]'), function (e) {
      e.textContent = OEUVRES.length + (OEUVRES.length > 1 ? ' hommages' : ' hommage');
    });
  }

  /* ─── Montage, rejouable ─── */
  function monter(liste) {
    if (liste) window.MELODIA_OEUVRES = liste;
    OEUVRES = (lireDonnees() || []).filter(function (o) {
      return o && o.audio && o.visible !== false;
    });
    /* Si l'écoute en cours disparaît du nouveau contenu, on l'arrête */
    if (cur >= OEUVRES.length) arreter();
    durees = {}; vu = {};
    if (filtreActif && !OEUVRES.some(function (o) { return o.style === filtreActif; })) filtreActif = '';
    calculerVisibles();
    rendre();
    rendreFiltres();
    majCompteurs();
    grille.classList.toggle('est-vide', !visibles.length);
    majBoutonTout();
  }

  window.addEventListener('pagehide', function () {
    if (raf) cancelAnimationFrame(raf);
    audio.pause();
    if (ctx && ctx.state !== 'closed') ctx.close();
  });

  window.MelodiaCatalogue = { monter: monter, arreter: arreter };
  monter();
})();
