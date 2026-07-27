/* ═══ MELODIA — Interactions du site ═══ */
(function () {
  'use strict';

  /* Nav : transparence en haut de page */
  var nav = document.querySelector('.nav');
  if (nav && document.querySelector('.hero-video')) {
    var onScroll = function () { nav.classList.toggle('at-top', window.scrollY < 60); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Nav mobile */
  var burger = document.querySelector('.nav-burger');
  var mob = document.querySelector('.nav-mobile');
  if (burger && mob) {
    burger.addEventListener('click', function () { mob.classList.toggle('open'); });
    mob.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { mob.classList.remove('open'); }); });
  }

  /* Lien actif */
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* Révélation au défilement */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* FAQ */
  document.querySelectorAll('.faq-q').forEach(function (b) {
    b.addEventListener('click', function () {
      var item = b.closest('.faq-item'), a = item.querySelector('.faq-a'), open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = '0'; });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* Notification */
  window.melodiaToast = function (msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 4200);
  };

  /* Lecteur audio */
  var player = document.querySelector('.player');
  if (player) {
    var tracks = [
      { t: 'Le Papi Pêcheur', s: 'Chanson française · Hommage à Maurice', f: 'audio/maurice.mp3' },
      { t: 'Le Jardin du Temps', s: 'Folk acoustique · Hommage à Monique', f: 'audio/monique.mp3' },
      { t: 'Saudade Noite', s: 'Bossa nova · Hommage à Sergio', f: 'audio/sergio.mp3' }
    ];
    var audio = new Audio(), cur = -1, playing = false;
    var list = player.querySelector('.player-list');
    var fill = player.querySelector('.player-progress-fill');
    var prog = player.querySelector('.player-progress');
    var wave = player.querySelector('.player-wave');
    var bars = [];
    if (wave) { for (var i = 0; i < 40; i++) { var b = document.createElement('span'); b.className = 'pw-bar'; wave.appendChild(b); bars.push(b); } }
    var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
    function fmt(s) { if (!isFinite(s)) return '1:00'; var m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + String(r).padStart(2, '0'); }
    function draw() {
      list.innerHTML = '';
      tracks.forEach(function (tr, i) {
        var row = document.createElement('div');
        row.className = 'player-track' + (i === cur ? ' active' : '');
        row.innerHTML = '<button class="pt-btn" aria-label="Lire">' + (i === cur && playing ? PAUSE : PLAY) + '</button>'
          + '<div class="pt-meta"><div class="pt-title">' + tr.t + '</div><div class="pt-sub">' + tr.s + '</div></div>'
          + '<div class="pt-time">' + (i === cur ? fmt(audio.currentTime) + ' / ' + fmt(audio.duration) : '1:00') + '</div>';
        row.addEventListener('click', function () { toggle(i); });
        list.appendChild(row);
      });
    }
    function toggle(i) {
      if (cur === i) {
        if (playing) { audio.pause(); playing = false; player.classList.remove('playing'); }
        else { audio.play(); playing = true; player.classList.add('playing'); }
      } else { cur = i; audio.src = tracks[i].f; audio.play(); playing = true; player.classList.add('playing'); }
      draw();
    }
    audio.addEventListener('timeupdate', function () {
      if (fill && audio.duration) fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      var el = list.querySelector('.player-track.active .pt-time');
      if (el) el.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    });
    audio.addEventListener('ended', function () { toggle((cur + 1) % tracks.length); });
    if (prog) prog.addEventListener('click', function (e) {
      if (!audio.duration) return;
      var r = prog.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
    var tick = 0;
    setInterval(function () {
      if (!bars.length) return; tick++;
      bars.forEach(function (bar, i) {
        bar.style.height = playing ? (2 + Math.abs(Math.sin((tick + i * 2) * 0.24) * Math.cos((tick + i) * 0.1)) * 22) + 'px' : '2px';
      });
    }, 150);
    draw();
  }
})();
