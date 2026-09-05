/* ═══════════════════════════════════════════════════════════════
   MELODIA — Le catalogue autour d'une platine

   La grille de douze fiches faisait 3 246 px sur un téléphone : trois
   écrans et demi qu'on traversait au lieu de les regarder. Une seule
   œuvre est désormais en scène, et les douze restent à portée de pouce
   dans la frise du bas.

   Le catalogue est rendu côté serveur — référencement, et il reste
   lisible sans JavaScript. Ce fichier le remplace par la platine dès
   qu'il s'exécute, et se remonte tout seul quand le propriétaire
   ajoute une musique depuis sa console : content.js le rappelle avec
   la nouvelle liste.

   Un seul élément audio, un seul analyseur, une seule platine. Deux
   hommages ne peuvent jamais se superposer.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var grille = document.querySelector('[data-catalogue]');
  if (!grille) return;

  var REDUIT = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PLAY  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>';
  var PREC  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 6h2v12H7zM19 6v12l-9-6z"/></svg>';
  var SUIV  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15 6h2v12h-2zM5 6l9 6-9 6z"/></svg>';
  var CROIX = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  /* Le signe posé sur le jeton : un triangle tant que rien ne joue,
     trois barres quand la lecture est en cours. Un rond doré seul
     n'annonce pas qu'on peut appuyer dessus. */
  var TRIANGLE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var CHEV_G = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var CHEV_D = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  var VUMETRE = '<span class="jet-vu"><i></i><i></i><i></i></span>';
  var JETON_SIGNE = TRIANGLE + VUMETRE;

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

  /* L'initiale tient lieu de portrait. Le repli n'est pas un pis-aller :
     une famille n'a pas toujours de photo qu'elle accepte de voir
     publiée, et une fiche sans visage doit rester aussi soignée. */
  function initiale(o) {
    var s = (o.who || o.title || '').trim();
    return s ? s.charAt(0).toUpperCase() : '♪';
  }

  /* Les trois mots confiés par la famille sont donnés un par un. La
     ligne continue « douce · obstinée · matinale » se lisait comme une
     étiquette de produit. */
  function jetons(brief) {
    var mots = String(brief || '').split('·').map(function (m) { return m.trim(); }).filter(Boolean);
    return mots.map(function (m) { return '<span class="oeuvre-mot">' + esc(m) + '</span>'; }).join('');
  }

  /* ─── Le guilloché ───
     Une rosette d'épitrochoïde, comme la gravure de fond d'un
     certificat. Tracée une fois : trois courbes décalées suffisent à
     donner la moire, et le tracé coûte moins qu'une image de fond. */
  function rosette(R, r, d, tours) {
    var p = '', n = 1200, x, y, t;
    for (var i = 0; i <= n; i++) {
      t = i / n * Math.PI * 2 * tours;
      x = (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t);
      y = (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t);
      p += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    return p;
  }
  function guilloche() {
    var g = document.createElement('div');
    g.className = 'guilloche';
    g.setAttribute('aria-hidden', 'true');
    g.innerHTML = '<svg viewBox="-105 -105 210 210">' +
      '<path d="' + rosette(100, 27, 62, 27) + '" opacity=".9"/>' +
      '<path d="' + rosette(88, 19, 44, 19) + '" opacity=".55"/>' +
      '<path d="' + rosette(70, 11, 26, 11) + '" opacity=".35"/></svg>';
    return g;
  }

  /* ─── Données ─── */
  function lireDonnees() {
    if (window.MELODIA_OEUVRES) return window.MELODIA_OEUVRES;
    var bloc = document.getElementById('oeuvres-data');
    if (!bloc) return [];
    try { return JSON.parse(bloc.textContent) || []; } catch (e) { return []; }
  }

  var OEUVRES = [], visibles = [], cur = -1, joue = false;
  var pastilles = [];

  var audio = new Audio();
  audio.preload = 'none';

  var ctxAudio = null, analyseur = null, spectre = null;
  function graphe() {
    if (ctxAudio || REDUIT) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctxAudio = new AC();
      analyseur = ctxAudio.createAnalyser();
      analyseur.fftSize = 256;
      analyseur.smoothingTimeConstant = 0.8;
      spectre = new Uint8Array(analyseur.frequencyBinCount);
      /* Le son doit continuer d'atteindre les enceintes une fois routé */
      ctxAudio.createMediaElementSource(audio).connect(analyseur);
      analyseur.connect(ctxAudio.destination);
    } catch (e) { ctxAudio = null; analyseur = null; }
  }

  /* ═══════════════════════════════════════════════════════════════
     LA PLATINE — construite une fois, jamais recopiée
     ═══════════════════════════════════════════════════════════════ */
  var scene = document.createElement('div');
  scene.className = 'scene-platine';

  var platine = document.createElement('div');
  platine.className = 'platine';
  platine.innerHTML =
    '<div class="disque-cadre" data-cadre>' +
      '<div class="disque" data-disque></div>' +
      '<div class="disque-bord"></div>' +
      '<div class="etiquette" data-etiquette><b data-ini>♪</b></div>' +
      '<div class="bras" aria-hidden="true"><svg viewBox="0 0 100 100">' +
        '<path class="tige" d="M88 12 L46 74"/><path class="tige" d="M46 74 l-5 7"/>' +
        '<circle class="pivot" cx="88" cy="12" r="6"/></svg></div>' +
    '</div>' +
    '<div class="pupitre">' +
      '<div class="pup-style" data-style></div>' +
      '<div class="pup-mention" data-mention hidden></div>' +
      '<h3 class="pup-titre" data-titre></h3>' +
      '<div class="pup-qui" data-qui></div>' +
      '<div class="pup-onde"><canvas data-onde></canvas></div>' +
      '<div class="pup-bas">' +
        '<button class="jeton" type="button" data-jeton aria-label="Écouter">' + PLAY + '</button>' +
        '<span class="pup-t" data-tc>0:00</span>' +
        '<div class="molette" data-molette role="slider" tabindex="0" aria-label="Position dans l\'hommage"' +
          ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i><u></u></div>' +
        '<span class="pup-t fin" data-td>—:—</span>' +
      '</div>' +
      '<p class="pup-recit" data-recit></p>' +
      '<blockquote class="pup-vers" data-vers></blockquote>' +
      '<div class="pup-brief" data-brief hidden><span>Les mots de la famille</span><em></em></div>' +
    '</div>';
  scene.appendChild(platine);
  platine.querySelector('[data-cadre]').appendChild(guilloche());

  var elDisque   = platine.querySelector('[data-disque]'),
      elEtiq     = platine.querySelector('[data-etiquette]'),
      elCanvas   = platine.querySelector('[data-onde]'),
      pinceau    = elCanvas.getContext('2d'),
      elMolette  = platine.querySelector('[data-molette]'),
      elRempli   = elMolette.querySelector('i'),
      elPoignee  = elMolette.querySelector('u'),
      elJeton    = platine.querySelector('[data-jeton]');

  /* ─── La frise ─── */
  var frise = document.createElement('div');
  frise.className = 'frise';
  /* Le dégradé de l'anneau est défini une fois pour les douze jetons :
     un dégradé SVG ne se partage pas entre documents, mais il se
     partage très bien entre éléments d'une même page. */
  frise.innerHTML =
    '<svg width="0" height="0" aria-hidden="true" style="position:absolute">' +
      '<defs><linearGradient id="degradeOr" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#97803c"/><stop offset="50%" stop-color="#f0e0ae"/>' +
        '<stop offset="100%" stop-color="#c9a84c"/></linearGradient></defs></svg>' +
    '<div class="frise-titre"><span class="mono" data-frise-titre></span></div>' +
    '<div class="frise-cadre">' +
      '<button type="button" class="frise-fleche prec" data-prec-frise aria-label="Hommages précédents">' + CHEV_G + '</button>' +
      '<div class="frise-piste" role="tablist" aria-label="Choisir un hommage"></div>' +
      '<button type="button" class="frise-fleche suiv" data-suiv-frise aria-label="Hommages suivants">' + CHEV_D + '</button>' +
    '</div>';
  var fPiste = frise.querySelector('.frise-piste');
  var fTitre = frise.querySelector('[data-frise-titre]');
  var fPrec = frise.querySelector('[data-prec-frise]');
  var fSuiv = frise.querySelector('[data-suiv-frise]');
  var TOUR = 2 * Math.PI * 32;      /* circonférence de l'anneau du jeton */

  /* Les flèches déplacent la frise de presque une largeur d'écran : assez
     pour avancer franchement, pas assez pour sauter des jetons. */
  function glisserFrise(sens) {
    fPiste.scrollBy({ left: sens * Math.max(140, fPiste.clientWidth * 0.8), behavior: 'smooth' });
  }
  fPrec.addEventListener('click', function () { glisserFrise(-1); });
  fSuiv.addEventListener('click', function () { glisserFrise(1); });

  /* Une flèche qui ne mène nulle part doit le dire. */
  function majFleches() {
    var max = fPiste.scrollWidth - fPiste.clientWidth;
    var x = fPiste.scrollLeft;
    fPrec.disabled = x <= 2;
    fSuiv.disabled = x >= max - 2;
    var inutile = max <= 2;
    fPrec.hidden = fSuiv.hidden = inutile;
  }
  var attenteFleches = null;
  fPiste.addEventListener('scroll', function () {
    if (attenteFleches) return;
    attenteFleches = requestAnimationFrame(function () { attenteFleches = null; majFleches(); });
  }, { passive: true });
  window.addEventListener('resize', function () { setTimeout(majFleches, 120); });

  /* ═══ Peinture d'une œuvre dans la platine ═══ */
  function poser(i) {
    var o = OEUVRES[i];
    if (!o) return;
    cur = i;

    var e = platine.querySelector('[data-etiquette]');
    e.innerHTML = '<b data-ini>' + esc(initiale(o)) + '</b>' +
      (o.photo ? '<img src="' + esc(o.photo) + '" alt="" loading="lazy" decoding="async">' : '');

    platine.querySelector('[data-style]').textContent =
      (o.style || 'Composition originale') + (o.lieu ? '  ·  ' + o.lieu : '');

    var m = platine.querySelector('[data-mention]');
    m.textContent = o.mention || '';
    m.hidden = !o.mention;

    platine.querySelector('[data-titre]').textContent = o.title || 'Sans titre';
    platine.querySelector('[data-qui]').textContent = o.who ? 'Pour ' + o.who : '';

    var r = platine.querySelector('[data-recit]');
    r.textContent = o.story || '';
    r.hidden = !o.story;

    var v = platine.querySelector('[data-vers]');
    v.textContent = o.lyrics || '';
    v.hidden = !o.lyrics;

    var b = platine.querySelector('[data-brief]');
    b.hidden = !o.brief;
    if (o.brief) b.querySelector('em').innerHTML = jetons(o.brief);

    platine.querySelector('[data-tc]').textContent = '0:00';
    platine.querySelector('[data-td]').textContent = '—:—';
    elRempli.style.width = '0';
    elPoignee.style.left = '0';
    elJeton.setAttribute('aria-label', 'Écouter ' + (o.title || 'cet hommage'));

    marquerFrise();
  }

  /* ═══ Commandes ═══ */
  function choisir(i, lancer) {
    if (!OEUVRES[i]) return;
    var change = i !== cur;
    if (change) poser(i);
    if (!lancer) return;
    graphe();
    if (ctxAudio && ctxAudio.state === 'suspended') ctxAudio.resume();
    if (change || audio.src.indexOf(OEUVRES[i].audio) === -1) {
      audio.src = OEUVRES[i].audio;
      audio.currentTime = 0;
    }
    audio.play().catch(bloque);
  }
  function basculer() {
    if (cur < 0) { if (visibles.length) choisir(visibles[0], true); return; }
    if (joue) audio.pause(); else choisir(cur, true);
  }
  /* Enchaîne dans l'ordre affiché, pas dans l'ordre des données :
     après un filtre, « suivant » doit rester ce qu'on voit. */
  function sauter(sens) {
    if (!visibles.length) return;
    var p = visibles.indexOf(cur);
    choisir(visibles[(p + sens + visibles.length) % visibles.length], true);
  }
  function arreter() {
    audio.pause();
    audio.removeAttribute('src');
    joue = false;
    elRempli.style.width = '0';
    elPoignee.style.left = '0';
    platine.querySelector('[data-tc]').textContent = '0:00';
    if (barre) barre.hidden = true;
    document.body.classList.remove('a-ecoute');
    peindre();
  }
  function bloque() {
    joue = false; peindre();
    if (window.melodiaToast) window.melodiaToast('Touchez à nouveau pour lancer la lecture.');
  }

  elJeton.addEventListener('click', basculer);

  audio.addEventListener('play',  function () { joue = true; document.body.classList.add('a-ecoute'); peindre(); });
  audio.addEventListener('pause', function () { joue = false; peindre(); });
  audio.addEventListener('loadedmetadata', function () {
    platine.querySelector('[data-td]').textContent = '−' + fmt(audio.duration);
  });
  audio.addEventListener('timeupdate', function () {
    if (!audio.duration || !isFinite(audio.duration)) return;
    var p = audio.currentTime / audio.duration;
    elRempli.style.width = (p * 100) + '%';
    elPoignee.style.left = (p * 100) + '%';
    elMolette.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    platine.querySelector('[data-tc]').textContent = fmt(audio.currentTime);
    platine.querySelector('[data-td]').textContent = '−' + fmt(audio.duration - audio.currentTime);
    if (bRemplit) bRemplit.style.width = (p * 100) + '%';
    if (bTemps) bTemps.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    arcJeton(jetonCourant(), p);
  });
  audio.addEventListener('ended', function () {
    var p = visibles.indexOf(cur);
    if (p >= 0 && p < visibles.length - 1) sauter(1); else arreter();
  });
  audio.addEventListener('error', function () {
    if (!audio.getAttribute('src')) return;   /* arreter() vide la source */
    if (window.melodiaToast) window.melodiaToast('Cet hommage n\'a pas pu être chargé.');
    joue = false; peindre();
  });

  /* La molette se saisit et se glisse, comme sur un vrai appareil */
  (function () {
    var pris = false;
    function place(e) {
      var r = elMolette.getBoundingClientRect();
      var x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (audio.duration && isFinite(audio.duration)) audio.currentTime = x * audio.duration;
      elRempli.style.width = (x * 100) + '%';
      elPoignee.style.left = (x * 100) + '%';
    }
    elMolette.addEventListener('pointerdown', function (e) {
      pris = true; elMolette.setPointerCapture(e.pointerId); place(e); e.preventDefault();
    });
    elMolette.addEventListener('pointermove', function (e) { if (pris) place(e); });
    elMolette.addEventListener('pointerup', function () { pris = false; });
    elMolette.addEventListener('keydown', function (e) {
      if (!audio.duration) return;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Enter') { basculer(); e.preventDefault(); }
    });
  })();

  /* ═══ Le spectre, dessiné au canvas ═══
     Un tracé miroir : la moitié haute dessinée, la basse repliée à
     l'opacité d'un reflet. Vingt <div> ne donnent pas cette courbe. */
  var largC = 0, hautC = 0;
  function taillerCanvas() {
    var r = elCanvas.getBoundingClientRect();
    if (!r.width) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    elCanvas.width = Math.round(r.width * dpr);
    elCanvas.height = Math.round(r.height * dpr);
    pinceau.setTransform(dpr, 0, 0, dpr, 0, 0);
    largC = r.width; hautC = r.height;
  }
  window.addEventListener('resize', taillerCanvas);

  function arrondi(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath(); c.fill();
  }

  function dessinerOnde(enLecture) {
    if (!largC) return;
    var c = pinceau, L = largC, H = hautC, sol = H * 0.68;
    c.clearRect(0, 0, L, H);

    var N = 56, pas = L / N, larg = Math.max(1.5, pas * 0.34);
    var g = c.createLinearGradient(0, sol - H * 0.55, 0, sol);
    g.addColorStop(0, 'rgba(246,236,201,.95)');
    g.addColorStop(0.45, 'rgba(227,201,119,.85)');
    g.addColorStop(1, 'rgba(151,128,60,.55)');

    for (var i = 0; i < N; i++) {
      var v;
      if (enLecture && spectre) {
        /* Les bacs utiles d'un morceau tiennent dans le premier tiers de
           l'analyse : on s'y tient, et l'on relève les aigus qui
           décroissent naturellement, sans quoi la moitié droite du tracé
           reste plate sur toute musique réelle. */
        var k = Math.min(spectre.length - 1,
                Math.floor(Math.pow(i / N, 1.22) * (spectre.length * 0.38)));
        v = Math.min(1, Math.pow(spectre[k] / 255, 0.68) * (0.72 + (i / N) * 1.05));
      } else if (enLecture) {
        v = 0.18 + Math.abs(Math.sin(Date.now() / 340 + i * 0.38)) * 0.4 * (0.4 + lueur);
      } else {
        v = 0.035 + Math.abs(Math.sin(i * 0.7)) * 0.028;   /* repos : une ligne à peine ondulée */
      }
      var h = Math.max(1.5, v * sol * 0.92);
      var x = i * pas + (pas - larg) / 2;
      c.fillStyle = g;
      c.globalAlpha = 0.92; arrondi(c, x, sol - h, larg, h, larg / 2);
      c.globalAlpha = 0.17; arrondi(c, x, sol + 1, larg, h * 0.42, larg / 2);
    }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(201,168,76,.14)';
    c.fillRect(0, sol, L, 0.5);
  }

  /* ═══ La boucle : lumière, inertie du disque, spectre ═══ */
  var lueur = 0, angle = 0, vitesse = 0, raf = null;
  function boucle() {
    var enLecture = joue && !audio.paused;
    var v = 0;
    if (analyseur && enLecture) {
      analyseur.getByteFrequencyData(spectre);
      var s = 0;
      for (var i = 0; i < spectre.length; i++) s += spectre[i] / 255;
      v = Math.min(1, Math.pow(s / spectre.length, 0.6) * 1.55);
    } else if (enLecture) {
      v = 0.42 + Math.sin(Date.now() / 430) * 0.2;   /* sans analyseur : une respiration */
    }
    /* Montée franche, descente lente : une lumière retombe doucement */
    lueur += (v - lueur) * (v > lueur ? 0.3 : 0.06);
    platine.style.setProperty('--lueur', lueur.toFixed(3));
    if (barre) barre.style.setProperty('--lueur', lueur.toFixed(3));
    var jc = jetonCourant();
    if (jc) jc.style.setProperty('--lueur', lueur.toFixed(3));

    /* Le disque a une masse : sa vitesse monte et retombe. Il ne
       s'arrête pas net comme une animation qu'on coupe. */
    var cible = enLecture ? (REDUIT ? 0 : 0.42) : 0;
    vitesse += (cible - vitesse) * (enLecture ? 0.022 : 0.014);
    if (vitesse > 0.0015) {
      angle = (angle + vitesse) % 360;
      elDisque.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
    }

    dessinerOnde(enLecture);
    /* On ne tourne que tant qu'il reste quelque chose à animer */
    if (enLecture || lueur > 0.002 || vitesse > 0.0015) raf = requestAnimationFrame(boucle);
    else { raf = null; dessinerOnde(false); }
  }
  function reveiller() { if (!raf) raf = requestAnimationFrame(boucle); }
  audio.addEventListener('play', reveiller);

  /* ═══ La barre d'écoute — seulement quand la platine quitte l'écran ═══
     Elle ne double pas la platine : elle prend le relais quand on a
     fait défiler la page plus bas. */
  var barre = null, bTitre, bQui, bLire, bTemps, bJauge, bRemplit;
  function creerBarre() {
    if (barre) return barre;
    barre = document.createElement('div');
    barre.className = 'ecoute';
    barre.hidden = true;
    barre.setAttribute('role', 'region');
    barre.setAttribute('aria-label', 'Lecture en cours');
    barre.innerHTML =
      '<div class="ecoute-inner">' +
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

    barre.querySelector('[data-lire]').addEventListener('click', basculer);
    barre.querySelector('[data-prec]').addEventListener('click', function () { sauter(-1); });
    barre.querySelector('[data-suiv]').addEventListener('click', function () { sauter(1); });
    barre.querySelector('[data-fermer]').addEventListener('click', arreter);

    var viser = function (x) {
      if (!audio.duration) return;
      var r = bJauge.getBoundingClientRect();
      audio.currentTime = Math.min(Math.max((x - r.left) / r.width, 0), 1) * audio.duration;
    };
    var glisse = false;
    bJauge.addEventListener('pointerdown', function (e) { glisse = true; bJauge.setPointerCapture(e.pointerId); viser(e.clientX); });
    bJauge.addEventListener('pointermove', function (e) { if (glisse) viser(e.clientX); });
    bJauge.addEventListener('pointerup', function () { glisse = false; });
    bJauge.addEventListener('keydown', function (e) {
      if (!audio.duration) return;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.currentTime + 5, audio.duration); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(audio.currentTime - 5, 0); e.preventDefault(); }
    });
    return barre;
  }

  var platineVue = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      platineVue = e[0].isIntersecting;
      majBarre();
    }, { threshold: 0.15 }).observe(scene);
  }
  function majBarre() {
    if (!joue) { if (barre) barre.hidden = true; return; }
    creerBarre();
    barre.hidden = platineVue;
  }

  /* ═══ Peinture de l'état ═══ */
  function peindre() {
    platine.classList.toggle('joue', joue);
    elJeton.innerHTML = joue ? PAUSE : PLAY;
    var o = OEUVRES[cur];
    elJeton.setAttribute('aria-label',
      (joue ? 'Mettre en pause ' : 'Écouter ') + ((o && o.title) || 'cet hommage'));
    if (barre && o) {
      bTitre.textContent = o.title || 'Hommage';
      bQui.textContent = [o.who, o.style].filter(Boolean).join(' · ');
      bLire.innerHTML = joue ? PAUSE : PLAY;
      bLire.setAttribute('aria-label', joue ? 'Mettre en pause' : 'Reprendre la lecture');
      barre.classList.toggle('joue', joue);
    }
    majBarre();
    majBoutonTout();
    marquerFrise();
  }

  function marquerFrise() {
    for (var i = 0; i < pastilles.length; i++) {
      var b = pastilles[i];
      if (!b) continue;
      var actif = Number(b.dataset.i) === cur;
      b.setAttribute('aria-current', actif ? 'true' : 'false');
      b.classList.toggle('joue', actif && joue);
      /* Le triangle disparaît dès que les barres prennent le relais */
      var t = b.querySelector('.jet-signe svg');
      var v = b.querySelector('.jet-vu');
      if (t) t.style.display = (actif && joue) ? 'none' : '';
      if (v) v.style.display = (actif && joue) ? '' : 'none';
      if (!actif) arcJeton(b, 0);
    }
  }

  /* L'anneau du jeton actif est la jauge du morceau : on voit d'un
     coup d'œil où l'on en est sans quitter la frise des yeux. */
  function arcJeton(b, part) {
    var a = b && b.querySelector('[data-arc]');
    if (a) a.style.strokeDashoffset = (TOUR * (1 - part)).toFixed(2);
  }
  function jetonCourant() {
    for (var i = 0; i < pastilles.length; i++)
      if (Number(pastilles[i].dataset.i) === cur) return pastilles[i];
    return null;
  }

  /* ═══ Rendu ═══ */
  function rendre() {
    fPiste.innerHTML = '';
    pastilles = [];
    visibles.forEach(function (i) {
      var o = OEUVRES[i];
      var b = document.createElement('button');
      b.className = 'pastille';
      b.type = 'button';
      b.dataset.i = String(i);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-current', 'false');
      b.setAttribute('aria-label', 'Écouter ' + esc(o.title || 'cet hommage'));
      b.innerHTML =
        '<span class="jet">' +
          (o.photo ? '<img src="' + esc(o.photo) + '" alt="" loading="lazy" decoding="async">' : '') +
          '<span class="jet-ini">' + esc(initiale(o)) + '</span>' +
          '<svg class="jet-arc" viewBox="0 0 68 68" style="--tour:' + TOUR.toFixed(2) + '">' +
            '<circle class="arc-piste" cx="34" cy="34" r="32"/>' +
            '<circle class="arc-jauge" cx="34" cy="34" r="32" data-arc/>' +
          '</svg>' +
          '<span class="jet-signe">' + JETON_SIGNE + '</span>' +
        '</span>' +
        '<span class="past-nom">' + esc(String(o.who || o.title || '').split(',')[0]) + '</span>' +
        '<span class="past-style">' + esc(o.style || '') + '</span>';
      b.addEventListener('click', function () {
        /* Toucher un visage, c'est vouloir l'entendre */
        choisir(i, true);
        /* Le jeton choisi revient au centre : la frise avance d'elle-même,
           et le suivant devient atteignable sans aucun glissé. */
        b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        scene.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      fPiste.appendChild(b);
      pastilles.push(b);
    });
    fTitre.textContent = visibles.length + (visibles.length > 1 ? ' hommages composés' : ' hommage composé');

    /* Si l'œuvre en scène vient d'être filtrée, on passe à la première
       qui reste plutôt que de laisser une platine orpheline. */
    if (visibles.indexOf(cur) === -1) {
      if (joue) arreter();
      if (visibles.length) poser(visibles[0]);
    }
    marquerFrise();
    taillerCanvas();
    dessinerOnde(joue);
    majFleches();
  }

  /* ═══ Filtres par style ═══ */
  var hoteFiltres = document.querySelector('[data-catalogue-filtres]');
  var filtreActif = '';

  function rendreFiltres() {
    if (!hoteFiltres) return;
    var styles = [];
    OEUVRES.forEach(function (o) { if (o.style && styles.indexOf(o.style) === -1) styles.push(o.style); });
    /* Un seul style dans le catalogue : le filtre n'apprend rien */
    if (styles.length < 2) { hoteFiltres.innerHTML = ''; hoteFiltres.hidden = true; return; }
    hoteFiltres.hidden = false;
    var compte = function (s) { return OEUVRES.filter(function (o) { return !s || o.style === s; }).length; };
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

  /* ═══ « Tout écouter » ═══ */
  var boutonTout = document.querySelector('[data-tout-ecouter]');
  if (boutonTout) {
    boutonTout.addEventListener('click', function () {
      if (joue) { arreter(); return; }
      if (cur >= 0) { choisir(cur, true); return; }
      if (visibles.length) choisir(visibles[0], true);
    });
  }
  function majBoutonTout() {
    if (!boutonTout) return;
    boutonTout.classList.toggle('en-lecture', joue);
    var t = boutonTout.querySelector('[data-libelle]');
    if (t) t.textContent = joue ? 'Arrêter l\'écoute' : 'Tout écouter';
  }

  /* ═══ Compteurs affichés ailleurs sur la page ═══ */
  function majCompteurs() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-catalogue-total]'), function (e) {
      e.textContent = String(OEUVRES.length);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-catalogue-libelle]'), function (e) {
      e.textContent = OEUVRES.length + (OEUVRES.length > 1 ? ' hommages' : ' hommage');
    });
  }

  /* ═══ Montage, rejouable ═══ */
  function monter(liste) {
    if (liste) window.MELODIA_OEUVRES = liste;
    OEUVRES = (lireDonnees() || []).filter(function (o) { return o && o.audio && o.visible !== false; });
    if (filtreActif && !OEUVRES.some(function (o) { return o.style === filtreActif; })) filtreActif = '';
    calculerVisibles();

    /* La grille rendue par le serveur cède la place. Elle a servi : les
       moteurs et les navigateurs sans JavaScript l'ont déjà lue, et les
       douze œuvres restent décrites une à une dans le JSON-LD de la page. */
    grille.innerHTML = '';
    grille.classList.add('platine-active');
    grille.appendChild(scene);
    grille.appendChild(frise);
    grille.classList.toggle('est-vide', !visibles.length);

    if (visibles.length && cur < 0) poser(visibles[0]);
    rendre();
    rendreFiltres();
    majCompteurs();
    peindre();
  }

  window.addEventListener('pagehide', function () {
    if (raf) cancelAnimationFrame(raf);
    audio.pause();
    if (ctxAudio && ctxAudio.state !== 'closed') ctxAudio.close();
  });

  window.MelodiaCatalogue = { monter: monter, arreter: arreter };
  monter();
})();
