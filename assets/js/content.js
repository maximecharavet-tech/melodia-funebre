/* ═══════════════════════════════════════════════════════════════
   MELODIA — Couche de contenu
   Le site est servi en HTML statique (bon pour le référencement).
   Ce module vient ensuite appliquer par-dessus le contenu éditable
   depuis la console : démos, offres, témoignages, questions,
   coordonnées. Si le fichier est absent ou illisible, le HTML d'origine
   reste affiché — rien ne casse jamais.

   Priorité de lecture :
     1. brouillon local (aperçu du propriétaire, cet appareil seulement)
     2. assets/data/content.json (le contenu publié)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var FICHIER = 'assets/data/content.json';
  var CLE_BROUILLON = 'melodia_content_draft';
  var CLE_APERCU = 'melodia_content_preview';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  var visibles = function (l) { return (l || []).filter(function (x) { return x.visible !== false; }); };

  var contenu = null;

  /* ─── Chargement ─── */
  function chargerBrouillon() {
    /* L'aperçu n'est actif que si le propriétaire l'a demandé depuis la console */
    try {
      if (sessionStorage.getItem(CLE_APERCU) !== '1') return null;
      var brut = localStorage.getItem(CLE_BROUILLON);
      return brut ? JSON.parse(brut) : null;
    } catch (e) { return null; }
  }

  var pret = (async function () {
    var local = chargerBrouillon();
    if (local) { contenu = local; contenu.__apercu = true; return contenu; }
    try {
      var r = await fetch(FICHIER, { cache: 'no-cache' });
      if (!r.ok) return null;
      contenu = await r.json();
      return contenu;
    } catch (e) {
      return null;   /* hors ligne ou fichier absent : le HTML d'origine suffit */
    }
  })();

  /* ─── Applications ─── */

  function appliquerDemos(c) {
    if (!c.demos) return;
    var actives = visibles(c.demos);
    if (!actives.length) return;

    /* Le lecteur lit cette variable au démarrage */
    window.MELODIA_TRACKS = actives.map(function (d) {
      return { t: d.title, s: (d.style || '') + (d.who ? ' · ' + d.who : ''), f: d.audio };
    });

    /* Page Écouter : les fiches qui accompagnent le lecteur */
    var liste = $('#demos-list');
    if (liste) {
      liste.innerHTML = actives.map(function (d) {
        return '<div class="card card-lift reveal in" style="margin-bottom:1.2rem;">' +
          '<h3 class="h-lg"><em>' + esc(d.title) + '</em></h3>' +
          '<div class="mono" style="margin:.6rem 0 1rem;">' + esc(d.who) + ' · ' + esc(d.style) + '</div>' +
          '<p>' + esc(d.story) + '</p>' +
          (d.brief ? '<div style="margin-top:1.2rem;padding-top:1rem;border-top:1px solid var(--line-soft);">' +
            '<span class="mono" style="color:var(--dust);">Brief de départ</span>' +
            '<div style="font-family:var(--ff-d);font-style:italic;font-size:1.1rem;color:var(--or-patina);margin-top:.4rem;">« ' +
            esc(d.brief) + ' »</div></div>' : '') +
        '</div>';
      }).join('');
    }
  }

  function appliquerOffres(c) {
    if (!c.offers) return;
    c.offers.forEach(function (o) {
      $$('[data-offer-id="' + o.id + '"]').forEach(function (carte) {
        var set = function (sel, val) { var e = $(sel, carte); if (e && val != null) e.textContent = val; };
        set('.price-name', o.name);
        var montant = $('.price-amount', carte);
        if (montant) montant.innerHTML = o.price + '<span>€</span>';
        set('.price-desc', o.desc);
        var ul = $('ul', carte);
        if (ul) {
          ul.innerHTML = (o.feats || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') +
            (o.muted || []).map(function (f) { return '<li class="muted">' + esc(f) + '</li>'; }).join('');
        }
        var tag = $('.price-tag', carte);
        if (tag) { if (o.tag) { tag.textContent = o.tag; tag.style.display = ''; } else tag.style.display = 'none'; }
        var bouton = $('button, a.btn', carte);
        if (bouton) bouton.textContent = 'Choisir ' + o.name;
      });
    });
  }

  function appliquerTemoignages(c) {
    var piste = $('.carousel-track');
    if (!piste || !c.testimonials) return;
    var actifs = visibles(c.testimonials);
    if (!actifs.length) return;
    piste.innerHTML = actifs.map(function (t) {
      return '<div class="carousel-slide"><div class="card testi">' +
        '<div class="testi-stars" aria-label="' + (t.stars || 5) + ' étoiles sur 5">' +
          '★'.repeat(Math.max(1, Math.min(5, t.stars || 5))) + '</div>' +
        '<p class="testi-text">« ' + esc(t.text) + ' »</p>' +
        '<div class="testi-who">' + esc(t.who) + '</div>' +
      '</div></div>';
    }).join('');
    if (window.MelodiaUI && window.MelodiaUI.initCarousel) window.MelodiaUI.initCarousel();
  }

  function appliquerFaq(c) {
    var hote = $('#faq-list');
    if (!hote || !c.faq) return;
    var actives = visibles(c.faq);
    if (!actives.length) return;
    hote.innerHTML = actives.map(function (f) {
      return '<div class="faq-item">' +
        '<button class="faq-q" type="button">' + esc(f.q) + '</button>' +
        '<div class="faq-a"><div class="faq-a-inner">' + esc(f.a) + '</div></div>' +
      '</div>';
    }).join('');
    if (window.MelodiaUI && window.MelodiaUI.initFaq) window.MelodiaUI.initFaq();
  }

  function appliquerContact(c) {
    if (!c.contact) return;
    var t = c.contact;
    /* Le numéro n'apparaît plus sur le site : on ne met à jour que l'email. */
    if (t.email) {
      $$('a[href^="mailto:"]').forEach(function (a) {
        var sujet = (a.getAttribute('href').split('?')[1] || '');
        a.setAttribute('href', 'mailto:' + t.email + (sujet ? '?' + sujet : ''));
        if (/@/.test(a.textContent)) a.textContent = t.email;
      });
    }
  }

  function appliquerIntro(c) {
    var intro = $('#intro');
    if (!intro || !c.intro) return;
    if (c.intro.enabled === false) {
      intro.remove();
      document.body.classList.remove('intro-open');
      return;
    }
    var claim = $('.intro-claim', intro);
    if (claim && c.intro.claim) claim.innerHTML = c.intro.claim;
  }

  function bandeauApercu() {
    var b = document.createElement('div');
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:400;background:#fbbf24;color:#1a1204;' +
      'font-family:var(--ff-m,monospace);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;' +
      'padding:.6rem 1rem;text-align:center;';
    b.innerHTML = 'Aperçu du brouillon — visible par vous seul. ' +
      '<button style="text-decoration:underline;color:inherit;font:inherit;">Quitter l\'aperçu</button>';
    b.querySelector('button').addEventListener('click', function () {
      try { sessionStorage.removeItem(CLE_APERCU); } catch (e) {}
      location.reload();
    });
    document.body.appendChild(b);
  }

  pret.then(function (c) {
    if (!c) return;
    try { appliquerIntro(c); } catch (e) {}
    try { appliquerDemos(c); } catch (e) {}
    try { appliquerOffres(c); } catch (e) {}
    try { appliquerTemoignages(c); } catch (e) {}
    try { appliquerFaq(c); } catch (e) {}
    try { appliquerContact(c); } catch (e) {}
    if (c.__apercu) bandeauApercu();
    document.dispatchEvent(new CustomEvent('melodia:content', { detail: c }));
  });

  window.MelodiaContent = {
    ready: pret,
    get: function () { return contenu; },
    FICHIER: FICHIER,
    CLE_BROUILLON: CLE_BROUILLON,
    CLE_APERCU: CLE_APERCU
  };
})();
