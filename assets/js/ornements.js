/* ═══════════════════════════════════════════════════════════════
   MELODIA — Les ornements de la maison

   Le site n'avait pas de vocabulaire graphique : du texte, un filet
   d'or, des icônes. Deux à trois images par page, et c'étaient les
   logos. Ce fichier lui en donne un, tiré du logo lui-même — l'anneau,
   la portée, la gravure de fond — et le décline partout.

   Tout est tracé dans le navigateur. Aucune image n'est téléchargée :
   une rosette pèse deux kilo-octets de chemin SVG au lieu de trois
   cents kilo-octets de PNG, elle reste nette à toutes les tailles, et
   elle se colore et s'anime avec le reste de la charte.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUIT = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Une graine stable tirée d'un texte ───
     Le même prénom donne toujours la même gravure : le sceau d'Odette
     est le sien, il ne change pas d'une visite à l'autre. */
  function graine(texte) {
    var h = 2166136261;
    var s = String(texte || 'melodia');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }
  /* Un tirage déterministe à partir de cette graine */
  function des(g) {
    var x = g >>> 0;
    return function () {
      x ^= x << 13; x >>>= 0;
      x ^= x >> 17;
      x ^= x << 5;  x >>>= 0;
      return x / 4294967296;
    };
  }

  /* ─── L'épitrochoïde ───
     La courbe qui trace les rosettes des billets de banque et des
     certificats : un cercle qui roule dans un autre, un point qui
     écrit. Trois paramètres suffisent à changer complètement le dessin,
     et c'est ce qui permet de donner à chaque hommage le sien. */
  function courbe(R, r, d, tours, pas) {
    var p = '', n = pas || 900, x, y, t;
    for (var i = 0; i <= n; i++) {
      t = i / n * Math.PI * 2 * tours;
      x = (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t);
      y = (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t);
      p += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    return p;
  }

  /**
   * Une rosette gravée, unique pour un texte donné.
   * @param {string} cle    ce qui détermine le dessin (un prénom, un titre)
   * @param {object} o      { traits, epaisseur, tours }
   */
  function rosette(cle, o) {
    o = o || {};
    var d = des(graine(cle));
    var n = o.traits || 3;
    var svg = '<svg class="orn-svg" viewBox="-105 -105 210 210" aria-hidden="true" focusable="false">';
    for (var i = 0; i < n; i++) {
      /* Chaque passe est plus petite et plus dense que la précédente :
         c'est ce dégradé de finesse qui fait la moire d'une gravure. */
      var R = 100 - i * 15;
      var r = 9 + Math.floor(d() * 22);
      var dd = R * (0.45 + d() * 0.3);
      var t = r;                       /* la courbe se referme après r tours */
      svg += '<path d="' + courbe(R, r, dd, t, 700) + '" opacity="' +
             (0.85 - i * 0.22).toFixed(2) + '"/>';
    }
    return svg + '</svg>';
  }

  /* ─── La portée ───
     Cinq lignes qui ondulent, comme celles qui traversent le logo.
     Elles servent de séparateur entre deux sections : un filet droit
     ne dit rien, une portée dit qu'ici on écrit de la musique. */
  function portee(cle) {
    var d = des(graine(cle || 'portee'));
    var svg = '<svg class="orn-portee" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">';
    for (var i = 0; i < 5; i++) {
      var y = 22 + i * 9;
      var a = 6 + d() * 9;                       /* amplitude de l'onde */
      var ph = d() * Math.PI * 2;                /* déphasage */
      var p = 'M0 ' + y.toFixed(1);
      for (var x = 20; x <= 1200; x += 20) {
        p += ' L' + x + ' ' + (y + Math.sin(x / 150 + ph) * a).toFixed(1);
      }
      svg += '<path d="' + p + '" style="--rang:' + i + '"/>';
    }
    return svg + '</svg>';
  }

  /* ─── L'emblème ───
     Le logo est une image matricielle : on ne peut pas l'animer trait
     par trait. On l'anime donc par ce qui l'entoure — un anneau qui se
     trace, une lumière qui balaie, un halo qui respire. Le dessin reste
     celui du logo officiel, rien n'en est redessiné de travers. */
  function embleme(o) {
    o = o || {};
    return '' +
      '<div class="embleme' + (o.classe ? ' ' + o.classe : '') + '">' +
        '<div class="emb-halo" aria-hidden="true"></div>' +
        '<svg class="emb-anneau" viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
          '<circle class="emb-trace" cx="100" cy="100" r="96"/>' +
          '<circle class="emb-arc" cx="100" cy="100" r="96"/>' +
        '</svg>' +
        '<div class="emb-rosace" aria-hidden="true">' + rosette('melodia-embleme', { traits: 3 }) + '</div>' +
        '<img class="emb-logo" src="' + (o.src || 'assets/img/logo-melodia.jpg') + '" ' +
             'alt="' + (o.alt || '') + '" width="440" height="440" ' +
             (o.priorite ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"') + '>' +
        '<div class="emb-lueur" aria-hidden="true"></div>' +
      '</div>';
  }

  /* ═══ Pose automatique ═══
     Le générateur de pages n'a qu'à poser un attribut : l'ornement
     apparaît. Une page qui n'en veut pas n'en a pas. */
  function poser() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-orn-rosace]'), function (e) {
      if (e.dataset.ornPose) return;
      e.dataset.ornPose = '1';
      var h = document.createElement('div');
      h.className = 'orn-rosace';
      h.setAttribute('aria-hidden', 'true');
      h.innerHTML = rosette(e.dataset.ornRosace || e.textContent || 'melodia',
                            { traits: Number(e.dataset.ornTraits) || 3 });
      e.insertBefore(h, e.firstChild);
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-orn-portee]'), function (e) {
      if (e.dataset.ornPose) return;
      e.dataset.ornPose = '1';
      e.innerHTML = portee(e.dataset.ornPortee || 'portee');
      e.setAttribute('aria-hidden', 'true');
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-orn-embleme]'), function (e) {
      if (e.dataset.ornPose) return;
      e.dataset.ornPose = '1';
      e.innerHTML = embleme({
        src: e.dataset.ornSrc, alt: e.dataset.ornAlt || '',
        priorite: e.hasAttribute('data-orn-priorite')
      });
    });

    /* Les ornements ne se dessinent qu'à l'approche de l'écran :
       douze rosettes tracées d'un coup au chargement retarderaient
       l'affichage du texte, qui compte davantage. */
    if (!REDUIT && 'IntersectionObserver' in window) {
      var oeil = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (x) {
          if (!x.isIntersecting) return;
          x.target.classList.add('orn-vu');
          oeil.unobserve(x.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      Array.prototype.forEach.call(
        document.querySelectorAll('.orn-rosace, .orn-portee-hote, .embleme'),
        function (e) { oeil.observe(e); });
    } else {
      Array.prototype.forEach.call(
        document.querySelectorAll('.orn-rosace, .orn-portee-hote, .embleme'),
        function (e) { e.classList.add('orn-vu'); });
    }
  }

  window.MelodiaOrnements = { rosette: rosette, portee: portee, embleme: embleme, poser: poser, graine: graine };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poser);
  else poser();
})();
