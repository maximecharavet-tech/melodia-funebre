/* ═══════════════════════════════════════════════════════════════
   MELODIA — Lecteur d'hommages
   Spectre réel via Web Audio API (repli sur une animation
   synthétique si l'API est indisponible ou refusée).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var player = document.querySelector('.player');
  if (!player) return;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TRACKS = window.MELODIA_TRACKS || [
    { t: 'Le Papi Pêcheur', s: 'Chanson française · Maurice, 78 ans', f: 'audio/maurice.mp3' },
    { t: 'Le Jardin du Temps', s: 'Folk acoustique · Monique, 75 ans', f: 'audio/monique.mp3' },
    { t: 'Saudade Noite', s: 'Bossa nova · Sergio, 69 ans', f: 'audio/sergio.mp3' }
  ];

  var list = player.querySelector('.player-list');
  var fill = player.querySelector('.player-progress-fill');
  var prog = player.querySelector('.player-progress');
  var wave = player.querySelector('.player-wave');
  if (!list) return;

  var BARS = 44;
  var bars = [];
  if (wave) {
    wave.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < BARS; i++) {
      var b = document.createElement('span');
      b.className = 'pw-bar';
      wave.appendChild(b);
      bars.push(b);
    }
  }

  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  var audio = new Audio();
  audio.preload = 'metadata';
  var cur = -1, playing = false;
  var durations = {};

  /* ─── Durées réelles, lues sans charger tout le fichier ─── */
  TRACKS.forEach(function (tr, i) {
    var probe = new Audio();
    probe.preload = 'metadata';
    probe.addEventListener('loadedmetadata', function () {
      if (isFinite(probe.duration)) { durations[i] = probe.duration; paint(); }
    });
    probe.src = tr.f;
  });

  function fmt(s) {
    if (!isFinite(s) || s < 0) return '—:—';
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }

  /* ─── Web Audio : spectre réel ─── */
  var ctx = null, analyser = null, data = null, srcNode = null;
  function initAudioGraph() {
    if (ctx || REDUCED) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      srcNode = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      /* Le son doit continuer d'atteindre les enceintes une fois routé */
      srcNode.connect(analyser);
      analyser.connect(ctx.destination);
      data = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      ctx = null; analyser = null; /* on retombe sur l'animation synthétique */
    }
  }

  var tick = 0, raf = null;
  function drawWave() {
    if (!bars.length) return;
    if (analyser && playing) {
      analyser.getByteFrequencyData(data);
      for (var i = 0; i < bars.length; i++) {
        /* Les basses saturent : on compresse pour garder un dessin lisible */
        var v = data[Math.floor(i * data.length / bars.length)] / 255;
        bars[i].style.height = (2 + Math.pow(v, 0.72) * 24) + 'px';
      }
    } else if (playing && !REDUCED) {
      tick++;
      for (var j = 0; j < bars.length; j++) {
        bars[j].style.height = (2 + Math.abs(Math.sin((tick + j * 2) * 0.09) * Math.cos((tick + j) * 0.04)) * 22) + 'px';
      }
    } else {
      for (var k = 0; k < bars.length; k++) bars[k].style.height = '2px';
    }
    raf = requestAnimationFrame(drawWave);
  }
  if (!REDUCED) raf = requestAnimationFrame(drawWave);

  /* ─── Rendu de la liste ─── */
  function paint() {
    list.innerHTML = '';
    TRACKS.forEach(function (tr, i) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'player-track' + (i === cur ? ' active' : '');
      row.setAttribute('aria-label', (i === cur && playing ? 'Mettre en pause ' : 'Écouter ') + tr.t);
      var time = i === cur
        ? fmt(audio.currentTime) + ' / ' + fmt(audio.duration || durations[i])
        : fmt(durations[i]);
      row.innerHTML =
        '<span class="pt-btn" aria-hidden="true">' + (i === cur && playing ? PAUSE : PLAY) + '</span>' +
        '<span class="pt-meta"><span class="pt-title">' + tr.t + '</span>' +
        '<span class="pt-sub">' + tr.s + '</span></span>' +
        '<span class="pt-time">' + time + '</span>';
      row.addEventListener('click', function () { toggle(i); });
      list.appendChild(row);
    });
  }

  function toggle(i) {
    initAudioGraph();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (cur === i) {
      if (playing) { audio.pause(); }
      else { audio.play().catch(noteBlocked); }
    } else {
      cur = i;
      audio.src = TRACKS[i].f;
      audio.play().catch(noteBlocked);
    }
  }

  function noteBlocked() {
    playing = false;
    player.classList.remove('playing');
    paint();
    if (window.melodiaToast) window.melodiaToast('Touchez à nouveau pour lancer la lecture.');
  }

  audio.addEventListener('play', function () {
    playing = true; player.classList.add('playing'); paint();
  });
  audio.addEventListener('pause', function () {
    playing = false; player.classList.remove('playing'); paint();
  });
  audio.addEventListener('loadedmetadata', function () {
    if (cur >= 0 && isFinite(audio.duration)) durations[cur] = audio.duration;
    paint();
  });
  audio.addEventListener('timeupdate', function () {
    if (fill && audio.duration) fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    var el = list.querySelector('.player-track.active .pt-time');
    if (el) el.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
  });
  audio.addEventListener('ended', function () {
    /* Enchaîne l'hommage suivant, puis s'arrête en fin de sélection */
    if (cur < TRACKS.length - 1) toggle(cur + 1);
    else { playing = false; player.classList.remove('playing'); if (fill) fill.style.width = '0'; paint(); }
  });
  audio.addEventListener('error', function () {
    if (window.melodiaToast) window.melodiaToast('Cet extrait n\'a pas pu être chargé.');
  });

  /* ─── Barre de progression : clic, glisser, clavier ─── */
  if (prog) {
    prog.setAttribute('role', 'slider');
    prog.setAttribute('tabindex', '0');
    prog.setAttribute('aria-label', 'Position dans le morceau');
    var seek = function (clientX) {
      if (!audio.duration) return;
      var r = prog.getBoundingClientRect();
      var p = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
      audio.currentTime = p * audio.duration;
    };
    prog.addEventListener('click', function (e) { seek(e.clientX); });
    var dragging = false;
    prog.addEventListener('pointerdown', function (e) { dragging = true; prog.setPointerCapture(e.pointerId); seek(e.clientX); });
    prog.addEventListener('pointermove', function (e) { if (dragging) seek(e.clientX); });
    prog.addEventListener('pointerup', function () { dragging = false; });
    prog.addEventListener('keydown', function (e) {
      if (!audio.duration) return;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.currentTime + 5, audio.duration); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(audio.currentTime - 5, 0); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Enter') { if (cur >= 0) toggle(cur); else toggle(0); e.preventDefault(); }
    });
  }

  /* Libère le contexte audio quand on quitte la page */
  window.addEventListener('pagehide', function () {
    if (raf) cancelAnimationFrame(raf);
    audio.pause();
    if (ctx && ctx.state !== 'closed') ctx.close();
  });

  paint();
})();
