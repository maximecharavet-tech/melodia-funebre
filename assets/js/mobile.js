/* ═══════════════════════════════════════════════════════════════
   mobile.js — Les consoles sur un téléphone

   POURQUOI

   Sur un écran de six pouces, la colonne de gauche devenait un tiroir
   glissant contenant seize entrées sur onze cents pixels : il fallait
   l'ouvrir, faire défiler à l'aveugle, lire des libellés au ras du
   bord, et pendant ce temps la page derrière continuait de défiler
   sous le doigt. Personne ne travaille comme ça debout dans une
   agence funéraire.

   LE PARTI PRIS

   Rien n'est recopié. La barre du bas et la grille d'applications
   sont deux vues sur le menu qui existe déjà : appuyer sur une tuile
   déclenche le bouton d'origine, avec sa logique, ses badges et son
   état. Aucune règle de navigation n'est dupliquée, et une vue
   ajoutée demain à la colonne apparaît d'elle-même sur le téléphone.

   TROIS SURFACES

   1. Une barre du bas, quatre destinations que l'on atteint cent fois
      par jour, marquées « data-mob » dans la page — plus « Tout ».
   2. Une grille d'applications, plein écran, groupée comme la colonne
      l'est déjà. Seize entrées y tiennent d'un regard, quand la même
      liste demandait trois passages de pouce.
   3. Les tableaux larges défilent dans leur propre cadre, au lieu
      d'être coupés au bord de l'écran.

   Rien n'est retiré : toutes les vues du bureau restent atteignables,
   et par le même code.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SEUIL = '(max-width: 860px)';
  var ecran = window.matchMedia(SEUIL);
  var monte = false;
  var barre = null, feuille = null, voile = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Le libellé d'une entrée, sans son glyphe ni son badge : « Atelier
     de composition » et non « ✦Atelier de composition0 ». */
  function libelle(b) {
    var t = '';
    for (var n = b.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) t += n.nodeValue;
      else if (n.nodeType === 1 && !n.classList.contains('ico') && !n.classList.contains('side-badge')) t += n.textContent;
    }
    return t.trim();
  }

  function glyphe(b) {
    var i = b.querySelector('.ico');
    return i ? i.textContent.trim() : '◈';
  }

  function badgeDe(b) {
    var e = b.querySelector('.side-badge');
    if (!e) return null;
    var cache = e.style.display === 'none' || !e.offsetParent && e.style.display === 'none';
    var v = e.textContent.trim();
    return (cache || !v || v === '0') ? null : v;
  }

  /* ─── Lire la colonne ─── */
  function entrees() {
    var col = document.getElementById('side') || document.querySelector('.side');
    if (!col) return null;
    var groupes = [], courant = null;
    [].forEach.call(col.children, function (n) {
      if (n.classList && n.classList.contains('side-label')) {
        courant = { titre: n.textContent.trim(), items: [] };
        groupes.push(courant);
      } else if (n.classList && n.classList.contains('side-item')) {
        if (!courant) { courant = { titre: '', items: [] }; groupes.push(courant); }
        courant.items.push(n);
      }
    });
    return groupes;
  }

  /* ─── La barre du bas ─── */
  function construireBarre(groupes) {
    var choisis = [];
    groupes.forEach(function (g) {
      g.items.forEach(function (b) { if (b.dataset.mob) choisis.push(b); });
    });
    /* Sans marquage explicite, les quatre premières entrées : ce sont
       celles du premier groupe, qui est partout le groupe principal. */
    if (!choisis.length && groupes[0]) choisis = groupes[0].items.slice(0, 4);
    choisis = choisis.slice(0, 4);

    var h = choisis.map(function (b, i) {
      return '<button type="button" class="mob-onglet" data-i="' + i + '">' +
        '<span class="mob-o-ico">' + esc(glyphe(b)) + '</span>' +
        '<span class="mob-o-nom">' + esc(b.dataset.mob || libelle(b)) + '</span>' +
        '<span class="mob-o-pastille" hidden></span></button>';
    }).join('');

    var n = document.createElement('nav');
    n.className = 'mob-barre';
    n.setAttribute('aria-label', 'Navigation principale');
    n.innerHTML = h +
      '<button type="button" class="mob-onglet mob-tout" id="mob-tout" aria-haspopup="dialog" aria-expanded="false">' +
        '<span class="mob-o-ico">▦</span><span class="mob-o-nom">Tout</span>' +
        '<span class="mob-o-pastille" hidden></span></button>';

    n._cibles = choisis;
    n.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('.mob-onglet') : null;
      if (!t) return;
      if (t.id === 'mob-tout') return ouvrir();
      var b = choisis[Number(t.dataset.i)];
      if (b) b.click();
    });
    return n;
  }

  /* ─── La grille d'applications ─── */
  function construireFeuille(groupes) {
    var h = '<div class="mob-apps-tete">' +
        '<div><div class="mob-apps-sur">Toutes les vues</div>' +
        '<div class="mob-apps-titre">Votre <em>console</em></div></div>' +
        '<button type="button" class="mob-fermer" id="mob-fermer" aria-label="Fermer">✕</button></div>' +
      '<div class="mob-apps-corps">';

    groupes.forEach(function (g, gi) {
      if (!g.items.length) return;
      if (g.titre) h += '<div class="mob-groupe">' + esc(g.titre) + '</div>';
      h += '<div class="mob-grille">' + g.items.map(function (b, i) {
        return '<button type="button" class="mob-app" data-g="' + gi + '" data-i="' + i + '">' +
          '<span class="mob-app-ico">' + esc(glyphe(b)) + '<span class="mob-app-pastille" hidden></span></span>' +
          '<span class="mob-app-nom">' + esc(libelle(b)) + '</span></button>';
      }).join('') + '</div>';
    });

    var pied = document.querySelector('.side-foot');
    h += '</div><div class="mob-apps-pied">' + (pied ? pied.innerHTML : '') + '</div>';

    var d = document.createElement('div');
    d.className = 'mob-apps';
    d.id = 'mob-apps';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.setAttribute('aria-label', 'Toutes les vues');
    d.hidden = true;
    d.innerHTML = h;
    d.addEventListener('click', function (e) {
      var f = e.target.closest ? e.target.closest('#mob-fermer') : null;
      if (f) return fermer();
      var t = e.target.closest ? e.target.closest('.mob-app') : null;
      if (!t) return;
      var g = groupes[Number(t.dataset.g)];
      var b = g && g.items[Number(t.dataset.i)];
      if (!b) return;
      fermer();
      b.click();
    });
    return d;
  }

  /* ─── Ouvrir et fermer ───
     Le fond est bloqué pendant l'ouverture : sans cela la page
     continuait de défiler sous le doigt derrière la grille, et on
     revenait ailleurs qu'où on était parti. */
  var defilementGele = 0;
  function ouvrir() {
    if (!feuille || !feuille.hidden) return;
    defilementGele = window.scrollY;
    document.body.classList.add('mob-fige');
    document.body.style.top = (-defilementGele) + 'px';
    feuille.hidden = false;
    voile.hidden = false;
    var t = document.getElementById('mob-tout');
    if (t) t.setAttribute('aria-expanded', 'true');
    /* Le bouton retour d'Android doit refermer la grille, pas quitter
       la console : c'est ce que fait n'importe quelle application. */
    try { history.pushState({ mobApps: 1 }, ''); } catch (e) {}
    var p = feuille.querySelector('.mob-app');
    if (p) p.focus();
  }

  function fermer(parRetour) {
    if (!feuille || feuille.hidden) return;
    feuille.hidden = true;
    voile.hidden = true;
    document.body.classList.remove('mob-fige');
    document.body.style.top = '';
    window.scrollTo(0, defilementGele);
    var t = document.getElementById('mob-tout');
    if (t) { t.setAttribute('aria-expanded', 'false'); t.focus(); }
    if (!parRetour) {
      try { if (history.state && history.state.mobApps) history.back(); } catch (e) {}
    }
  }

  window.addEventListener('popstate', function () {
    if (feuille && !feuille.hidden) fermer(true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && feuille && !feuille.hidden) fermer();
  });

  /* ─── Refléter l'état du menu ───
     La console garde la main : elle marque « active » et met ses
     badges à jour. On se contente de recopier ce qu'elle a décidé. */
  function refleter() {
    if (!monte || !barre) return;
    var cibles = barre._cibles || [];
    var actifAilleurs = true;
    [].forEach.call(barre.querySelectorAll('.mob-onglet'), function (o) {
      if (o.id === 'mob-tout') return;
      var b = cibles[Number(o.dataset.i)];
      if (!b) return;
      var actif = b.classList.contains('active');
      if (actif) actifAilleurs = false;
      o.classList.toggle('actif', actif);
      var p = o.querySelector('.mob-o-pastille'), v = badgeDe(b);
      p.textContent = v || ''; p.hidden = !v;
    });
    var tout = document.getElementById('mob-tout');
    if (tout) tout.classList.toggle('actif', actifAilleurs);

    if (feuille) {
      [].forEach.call(feuille.querySelectorAll('.mob-app'), function (t) {
        var g = GROUPES[Number(t.dataset.g)];
        var b = g && g.items[Number(t.dataset.i)];
        if (!b) return;
        t.classList.toggle('actif', b.classList.contains('active'));
        var p = t.querySelector('.mob-app-pastille'), v = badgeDe(b);
        p.textContent = v || ''; p.hidden = !v;
      });
    }

    /* Un total sur « Tout » : ce qui attend dans les vues qu'on ne
       voit pas depuis la barre est justement ce qu'on risque
       d'oublier. */
    var reste = 0;
    GROUPES.forEach(function (g) {
      g.items.forEach(function (b) {
        if (cibles.indexOf(b) >= 0) return;
        var v = badgeDe(b);
        if (v) reste += (parseInt(v, 10) || 0);
      });
    });
    if (tout) {
      var p = tout.querySelector('.mob-o-pastille');
      p.textContent = reste ? String(reste) : ''; p.hidden = !reste;
    }
  }

  /* ─── Les tableaux larges ───
     Un tableau de comptes ne se replie pas en colonne sans devenir
     illisible : il défile dans son propre cadre, et la page reste
     droite. */
  function encadrerTableaux() {
    var l = document.querySelectorAll('.tbl');
    for (var i = 0; i < l.length; i++) {
      var t = l[i];
      if (t.parentElement && t.parentElement.classList.contains('mob-defile')) continue;
      var c = document.createElement('div');
      c.className = 'mob-defile';
      c.setAttribute('tabindex', '0');
      c.setAttribute('role', 'region');
      c.setAttribute('aria-label', 'Tableau, défilement horizontal');
      t.parentNode.insertBefore(c, t);
      c.appendChild(t);
    }
  }

  var GROUPES = [];

  function monter() {
    if (monte) return;
    GROUPES = entrees();
    if (!GROUPES || !GROUPES.length) return;
    barre = construireBarre(GROUPES);
    feuille = construireFeuille(GROUPES);
    voile = document.createElement('div');
    voile.className = 'mob-voile';
    voile.hidden = true;
    voile.addEventListener('click', function () { fermer(); });
    document.body.appendChild(voile);
    document.body.appendChild(feuille);
    document.body.appendChild(barre);
    document.body.classList.add('mob-console');
    monte = true;
    refleter();
  }

  function demonter() {
    if (!monte) return;
    fermer(true);
    [barre, feuille, voile].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
    barre = feuille = voile = null;
    document.body.classList.remove('mob-console');
    monte = false;
  }

  function ajuster() {
    if (ecran.matches) monter(); else demonter();
    encadrerTableaux();
    refleter();
  }

  var attend = false;
  function planifier() {
    if (attend) return;
    attend = true;
    requestAnimationFrame(function () { attend = false; encadrerTableaux(); refleter(); });
  }

  function demarrer() {
    if (!document.querySelector('.side')) return;   /* rien à refléter */
    ajuster();
    if (ecran.addEventListener) ecran.addEventListener('change', ajuster);
    else if (ecran.addListener) ecran.addListener(ajuster);
    var hote = document.querySelector('.dash') || document.body;
    if (window.MutationObserver) {
      new MutationObserver(planifier).observe(hote, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();

  window.MelodiaMobile = { ouvrir: ouvrir, fermer: fermer, refleter: planifier };
})();
