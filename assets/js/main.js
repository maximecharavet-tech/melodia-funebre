/* ═══════════════════════════════════════════════════════════════
   MELODIA — Interactions du site (v4)
   Navigation · révélations · compteurs · FAQ · carrousel ·
   barre CTA mobile · modales · calculateur partenaire
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ═══ SEUIL D'ENTRÉE ═══
     Affiché une seule fois par session, franchissable au premier geste,
     et refermé de lui-même : personne ne doit rester bloqué devant. */
  var intro = $('#intro');
  if (intro) {
    document.body.classList.add('intro-open');
    /* Marqué dès l'affichage : un rechargement pendant l'animation ne le rejoue pas. */
    try { sessionStorage.setItem('melodia_intro', '1'); } catch (e) {}

    var sortiIntro = false;
    var franchir = function () {
      if (sortiIntro) return;
      sortiIntro = true;
      intro.classList.add('leaving');
      document.body.classList.remove('intro-open');
      setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1400);
    };

    intro.addEventListener('click', franchir);
    document.addEventListener('keydown', function (e) {
      if (sortiIntro) return;
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); franchir(); }
    });
    /* Un défilement vaut aussi franchissement : le visiteur veut déjà entrer. */
    window.addEventListener('wheel', franchir, { passive: true, once: true });
    window.addEventListener('touchmove', franchir, { passive: true, once: true });

    /* Sans animation, on ne fait pas patienter devant un écran fixe. */
    setTimeout(franchir, REDUCED ? 3500 : 5200);
    /* Pas de mise au point automatique sur « Entrer » : elle dessine un liseré
       de focus inutile, alors que la touche Entrée, Espace ou Échap franchit
       déjà le seuil, et que le bouton reste atteignable à la tabulation. */
  }

  /* ═══ NAVIGATION ═══ */
  var nav = $('.nav');
  if (nav) {
    var hasHero = !!$('.hero-video');
    var last = 0;
    var onScroll = function () {
      var y = window.scrollY;
      if (hasHero) nav.classList.toggle('at-top', y < 60);
      /* La barre s'efface quand on descend, revient dès qu'on remonte */
      nav.classList.toggle('hidden', y > 400 && y > last && !$('.nav-mobile.open'));
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var burger = $('.nav-burger');
  var mob = $('.nav-mobile');
  if (burger && mob) {
    var setMenu = function (open) {
      mob.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function () { setMenu(!mob.classList.contains('open')); });
    $$('a', mob).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mob.classList.contains('open')) { setMenu(false); burger.focus(); }
    });
  }

  /* Lien actif — gère aussi les URL propres de Vercel (/offres) */
  var file = location.pathname.split('/').pop() || 'index.html';
  var page = file.replace(/\.html$/, '') || 'index';
  $$('.nav-links a, .nav-mobile a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').replace(/\.html$/, '').replace(/^\//, '');
    if (href && href === page) a.classList.add('active');
  });

  /* ═══ VIDÉO DE COUVERTURE — chargement conditionnel ═══
     Le fichier pèse plus de 5 Mo. Le charger systématiquement revient à
     imposer ce poids à chaque visiteur mobile, en données cellulaires,
     pour un fond décoratif. On ne le charge donc que si le contexte s'y
     prête ; sinon l'affiche du poster tient le rôle. */
  var heroVideo = $('.hero-video video[data-src]');
  if (heroVideo) {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    var economieDonnees = conn.saveData === true;
    var reseauLent = /2g/.test(conn.effectiveType || '');
    var grandEcran = window.matchMedia('(min-width: 900px)').matches;
    /* Sur petit écran, on exige un réseau explicitement rapide.
       Sans l'API Network Information (Safari), on s'abstient. */
    var mobileRapide = conn.effectiveType === '4g' && (conn.downlink === undefined || conn.downlink >= 5);

    if (!REDUCED && !economieDonnees && !reseauLent && (grandEcran || mobileRapide)) {
      heroVideo.src = heroVideo.getAttribute('data-src');
      heroVideo.removeAttribute('data-src');
      var lancer = function () { var pr = heroVideo.play(); if (pr && pr.catch) pr.catch(function () {}); };
      if (heroVideo.readyState >= 2) lancer();
      else heroVideo.addEventListener('loadeddata', lancer, { once: true });
    }
  }

  /* ═══ RÉVÉLATION AU DÉFILEMENT ═══ */
  var reveals = $$('.reveal:not(.in)');
  if (REDUCED) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });

    /* Décalage automatique dans les grilles : effet de cascade sans classe à écrire */
    $$('.grid-2, .grid-3, .grid-4, .steps').forEach(function (grid) {
      $$('.reveal', grid).forEach(function (el, i) {
        if (!/reveal-d\d/.test(el.className)) el.style.transitionDelay = Math.min(i * 0.08, 0.4) + 's';
      });
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ═══ COMPTEURS ═══ */
  var counters = $$('[data-count]');
  if (counters.length) {
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      if (REDUCED) { el.textContent = prefix + target + suffix; return; }
      var dur = 1500, t0 = performance.now();
      var tick = function (now) {
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target % 1 === 0 ? Math.round(target * eased) : (target * eased).toFixed(1);
        el.textContent = prefix + val + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    } else { counters.forEach(run); }
  }

  /* ═══ FAQ ═══ */
  $$('.faq-q').forEach(function (btn, i) {
    var item = btn.closest('.faq-item');
    var panel = $('.faq-a', item);
    if (!panel) return;
    if (!panel.id) panel.id = 'faq-panel-' + i;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', panel.id);
    btn.addEventListener('click', function () {
      var open = item.classList.contains('open');
      /* Accordéon : une seule réponse ouverte à la fois */
      $$('.faq-item.open').forEach(function (o) {
        o.classList.remove('open');
        $('.faq-a', o).style.maxHeight = '0';
        $('.faq-q', o).setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
  /* Recalcule la hauteur si la fenêtre change de largeur */
  window.addEventListener('resize', function () {
    $$('.faq-item.open .faq-a').forEach(function (p) { p.style.maxHeight = p.scrollHeight + 'px'; });
  });

  /* ═══ NOTIFICATION ═══ */
  window.melodiaToast = function (msg) {
    var t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, 4200);
  };

  /* ═══ BARRE CTA MOBILE ═══ */
  var sticky = $('.sticky-cta');
  if (sticky) {
    document.body.classList.add('has-sticky-cta');
    var footer = $('.footer');
    var onCta = function () {
      var past = window.scrollY > 620;
      /* On l'escamote au-dessus du pied de page pour ne pas masquer les mentions */
      var nearFoot = footer && footer.getBoundingClientRect().top < window.innerHeight - 40;
      sticky.classList.toggle('show', past && !nearFoot);
    };
    onCta();
    window.addEventListener('scroll', onCta, { passive: true });
  }

  /* ═══ CARROUSEL ═══ */
  $$('.carousel').forEach(function (car) {
    var track = $('.carousel-track', car);
    var slides = $$('.carousel-slide', car);
    if (!track || slides.length < 2) return;
    var idx = 0, timer = null;
    var dotsWrap = $('.carousel-dots', car);

    var go = function (i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      if (dotsWrap) $$('.carousel-dot', dotsWrap).forEach(function (d, k) {
        d.classList.toggle('active', k === idx);
        d.setAttribute('aria-selected', k === idx ? 'true' : 'false');
      });
    };

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, k) {
        var d = document.createElement('button');
        d.className = 'carousel-dot' + (k === 0 ? ' active' : '');
        d.type = 'button';
        d.setAttribute('aria-label', 'Témoignage ' + (k + 1));
        d.addEventListener('click', function () { go(k); restart(); });
        dotsWrap.appendChild(d);
      });
    }
    var prev = $('.carousel-prev', car), next = $('.carousel-next', car);
    if (prev) prev.addEventListener('click', function () { go(idx - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(idx + 1); restart(); });

    var restart = function () {
      clearInterval(timer);
      if (!REDUCED) timer = setInterval(function () { go(idx + 1); }, 6500);
    };
    car.addEventListener('mouseenter', function () { clearInterval(timer); });
    car.addEventListener('mouseleave', restart);

    /* Balayage au doigt */
    var x0 = null;
    car.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) { go(dx < 0 ? idx + 1 : idx - 1); restart(); }
      x0 = null;
    }, { passive: true });

    restart();
  });

  /* ═══ BANDEAU DÉFILANT ═══ */
  $$('.marquee-track').forEach(function (track) {
    /* On duplique le contenu pour que la boucle soit invisible */
    track.innerHTML = track.innerHTML + track.innerHTML;
  });

  /* ═══ MODALES ═══ */
  var lastFocus = null;
  window.melodiaModal = function (id, open) {
    var m = document.getElementById(id);
    if (!m) return;
    if (open) {
      lastFocus = document.activeElement;
      m.classList.add('open');
      document.body.style.overflow = 'hidden';
      var f = m.querySelector('input, button, select, textarea, a[href]');
      if (f) setTimeout(function () { f.focus(); }, 60);
    } else {
      m.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
  };
  $$('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) window.melodiaModal(m.id, false); });
    $$('.modal-close, [data-modal-close]', m).forEach(function (b) {
      b.addEventListener('click', function () { window.melodiaModal(m.id, false); });
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = $('.modal.open');
    if (open) window.melodiaModal(open.id, false);
  });

  /* ═══ CALCULATEUR PARTENAIRE ═══ */
  var calc = $('[data-calc]');
  if (calc) {
    var rVol = $('#calc-volume', calc);
    var rPrice = $('#calc-price', calc);
    var MARGE = 0.6; /* 60 % reversés à l'agence */
    var euro = function (n) { return n.toLocaleString('fr-FR') + ' €'; };
    var update = function () {
      var vol = parseInt(rVol.value, 10);
      var price = parseInt(rPrice.value, 10);
      /* Hypothèse affichée : environ une famille sur quatre retient l'hommage */
      var taux = 0.25;
      var ventes = Math.round(vol * taux);
      var moisNet = Math.round(ventes * price * MARGE);
      $('#calc-volume-val', calc).textContent = vol + ' obsèques / mois';
      $('#calc-price-val', calc).textContent = euro(price);
      $('#calc-out-ventes', calc).textContent = ventes;
      $('#calc-out-mois', calc).textContent = euro(moisNet);
      $('#calc-out-an', calc).textContent = euro(moisNet * 12);
    };
    [rVol, rPrice].forEach(function (r) { if (r) r.addEventListener('input', update); });
    update();
  }

  /* ═══ ANNÉE COURANTE ═══ */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
