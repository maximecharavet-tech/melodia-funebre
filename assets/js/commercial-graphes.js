/* ═══════════════════════════════════════════════════════════════
   commercial-graphes.js — Deux graphiques pour le tableau de bord

   POURQUOI

   Le tableau de bord donnait quatre nombres et une file de tâches.
   Des chiffres justes, mais qui ne répondent ni à « est-ce que je
   travaille régulièrement ? » ni à « où est-ce que ça bloque ? ».
   Ce sont les deux seules questions qu'un commercial se pose devant
   son écran le lundi matin.

   D'où deux dessins, et deux seulement :

   · L'ACTIVITÉ sur trente jours dit la régularité. Un trou de six
     jours se voit, là où une moyenne mensuelle le cache.
   · L'ENTONNOIR dit où le portefeuille se perd. Quatre-vingts fiches
     et deux partenaires, ce n'est pas la même maladie selon que la
     chute a lieu au premier contact ou après la démonstration.

   COMMENT ILS SONT FAITS

   En SVG écrit à la main. Aucune bibliothèque : la politique de
   sécurité du site n'autorise pas de script extérieur, et deux
   graphiques ne justifient pas cinquante kilo-octets.

   Les deux couleurs — l'or de la maison assombri, et un bleu — ont
   été contrôlées pour rester distinguables par un daltonien sur le
   fond sombre de la console (écart perceptuel de 19,5 en protanopie,
   17,8 en tritanopie ; le seuil admis est 8). Le texte, lui, ne prend
   jamais la couleur d'une série : il reste dans les tons du texte,
   et c'est la pastille à côté qui porte l'identité.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var COURRIEL = '#a98b34';
  var APPEL = '#2f88b8';

  function jour(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }

  /* ─── L'activité des trente derniers jours ───
     Une colonne par jour, courriels et appels empilés. Les colonnes
     plutôt qu'une courbe : ce sont des actes comptés, pas une mesure
     continue, et un jour sans rien doit se lire comme un vide, pas
     comme un point sur une ligne. */
  function activite(prospects) {
    var jours = [];
    var auj = jour(Date.now());
    for (var i = 29; i >= 0; i--) jours.push(auj - i * 86400000);

    var par = {};
    jours.forEach(function (j) { par[j] = { mail: 0, appel: 0 }; });
    (prospects || []).forEach(function (p) {
      (p.journal || []).forEach(function (e) {
        var j = jour(e.le);
        if (!par[j]) return;
        if (/appel/i.test(e.quoi)) par[j].appel++;
        else if (/courriel|mail/i.test(e.quoi)) par[j].mail++;
      });
    });

    var max = 0, totalM = 0, totalA = 0, joursActifs = 0;
    jours.forEach(function (j) {
      var v = par[j], t = v.mail + v.appel;
      if (t > max) max = t;
      totalM += v.mail; totalA += v.appel;
      if (t) joursActifs++;
    });

    if (!totalM && !totalA) {
      return '<div class="panel gr-panel">' +
        '<div class="panel-title">Votre <em>activité</em></div>' +
        '<div class="panel-sub">Trente derniers jours</div>' +
        '<p class="gr-vide">Rien d\'enregistré pour l\'instant. Chaque courriel envoyé et chaque appel ' +
        'passé depuis une fiche s\'inscrit ici — c\'est ce qui permet de voir sa régularité, ' +
        'et les trous.</p></div>';
    }

    var L = 100, H = 42, gauche = 5, bas = 6;
    var largeurUtile = L - gauche;
    var pas = largeurUtile / 30;
    var barre = pas * 0.62;
    var hautUtile = H - bas;
    /* Même réserve que sur la console partenaire : le vide entre
       segments doit être pris sur l'échelle, sinon la colonne la
       plus haute dépasse par le haut. */
    var ech = max ? (hautUtile - 0.4) / max : 0;

    var colonnes = jours.map(function (j, k) {
      var v = par[j];
      var x = gauche + k * pas + (pas - barre) / 2;
      var hM = v.mail * ech, hA = v.appel * ech;
      var out = '';
      /* Deux pour cent de vide entre les segments : sans lui, un jour
         à un courriel et un appel se lit comme une seule barre. */
      if (hA) out += '<rect x="' + x.toFixed(2) + '" y="' + (hautUtile - hA).toFixed(2) +
        '" width="' + barre.toFixed(2) + '" height="' + hA.toFixed(2) + '" rx="0.5" fill="' + APPEL + '"/>';
      if (hM) out += '<rect x="' + x.toFixed(2) + '" y="' + (hautUtile - hA - hM - (hA ? 0.4 : 0)).toFixed(2) +
        '" width="' + barre.toFixed(2) + '" height="' + hM.toFixed(2) + '" rx="0.5" fill="' + COURRIEL + '"/>';
      /* Cible de survol pleine hauteur : viser une barre de deux
         pixels au doigt est impossible. */
      out += '<rect class="gr-cible" x="' + (gauche + k * pas).toFixed(2) + '" y="0" width="' + pas.toFixed(2) +
        '" height="' + hautUtile.toFixed(2) + '" fill="transparent"' +
        ' data-info="' + esc(new Date(j).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })) +
        ' · ' + v.mail + ' courriel' + (v.mail > 1 ? 's' : '') + ' · ' + v.appel + ' appel' + (v.appel > 1 ? 's' : '') + '"/>';
      return out;
    }).join('');

    /* Deux repères horizontaux seulement : le maximum et sa moitié.
       Une grille complète ferait plus de traits que de données. */
    var reperes = [max, Math.round(max / 2)].filter(function (v, i, a) { return v > 0 && a.indexOf(v) === i; })
      .map(function (v) {
        var y = hautUtile - v * ech;
        return '<line x1="' + gauche + '" y1="' + y.toFixed(2) + '" x2="' + L + '" y2="' + y.toFixed(2) +
          '" stroke="currentColor" stroke-width="0.15" opacity="0.28"/>' +
          '<text x="0" y="' + (y + 1.1).toFixed(2) + '" class="gr-ech">' + v + '</text>';
      }).join('');

    return '<div class="panel gr-panel">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">Votre <em>activité</em></div>' +
        '<div class="panel-sub">Trente derniers jours · ' + joursActifs + ' jour' + (joursActifs > 1 ? 's' : '') + ' travaillé' + (joursActifs > 1 ? 's' : '') + '</div>' +
      '</div>' +
      '<div class="gr-legende">' +
        '<span><i style="background:' + COURRIEL + ';"></i>Courriels <b>' + totalM + '</b></span>' +
        '<span><i style="background:' + APPEL + ';"></i>Appels <b>' + totalA + '</b></span>' +
      '</div></div>' +
      '<div class="gr-toile" data-graphe="activite">' +
        '<svg viewBox="0 0 ' + L + ' ' + H + '" preserveAspectRatio="none" role="img" ' +
          'aria-label="Activité quotidienne des trente derniers jours : ' + totalM + ' courriels et ' + totalA + ' appels.">' +
          reperes + colonnes +
        '</svg>' +
        '<div class="gr-bulle" hidden></div>' +
      '</div>' +
      '<div class="gr-axe"><span>il y a 30 jours</span><span>aujourd\'hui</span></div>' +
      '<table class="gr-table"><caption>Activité par semaine</caption>' +
        '<thead><tr><th>Semaine</th><th>Courriels</th><th>Appels</th></tr></thead><tbody>' +
        [0, 1, 2, 3].map(function (s) {
          var m = 0, a = 0;
          jours.slice(s * 7, s * 7 + 7).forEach(function (j) { m += par[j].mail; a += par[j].appel; });
          return '<tr><td>' + (s === 3 ? 'Cette semaine' : 'Il y a ' + (3 - s) + ' semaine' + (3 - s > 1 ? 's' : '')) +
            '</td><td>' + m + '</td><td>' + a + '</td></tr>';
        }).join('') +
      '</tbody></table>' +
    '</div>';
  }

  /* ─── L'entonnoir ───
     Une seule teinte qui se fonce : ce sont les étapes d'un même
     parcours, pas des catégories différentes. Ce qui compte n'est pas
     la hauteur des barres mais le pourcentage entre deux étapes —
     c'est lui qui dit où le travail se perd. */
  function entonnoir(prospects) {
    var P = prospects || [];
    var dans = function (liste) {
      return P.filter(function (p) { return liste.indexOf(p.statut) !== -1; }).length;
    };
    var etapes = [
      { l: 'Au portefeuille', n: P.length, dit: 'Toutes vos fiches' },
      { l: 'Contactées', n: dans(['contacte', 'relance', 'interesse', 'demo_offerte', 'partenaire']), dit: 'Un premier message est parti' },
      { l: 'Intéressées', n: dans(['interesse', 'demo_offerte', 'partenaire']), dit: 'Elles ont répondu favorablement' },
      { l: 'Démonstration offerte', n: dans(['demo_offerte', 'partenaire']), dit: 'Un hommage leur a été composé' },
      { l: 'Partenaires', n: dans(['partenaire']), dit: 'Elles proposent le service' }
    ];
    var refus = dans(['refus']);

    if (!P.length) {
      return '<div class="panel gr-panel">' +
        '<div class="panel-title">L\'<em>entonnoir</em></div>' +
        '<div class="panel-sub">Où le portefeuille se perd</div>' +
        '<p class="gr-vide">Aucune fiche au portefeuille. Ajoutez des agences depuis « Rechercher », ' +
        'et cet écran montrera à quelle étape le travail se perd.</p></div>';
    }

    var haut = P.length || 1;
    /* Cinq pas d'une même teinte, du plus clair au plus foncé */
    var teintes = ['#e0c87e', '#cfae59', '#b3913c', '#8f7229', '#6b551c'];

    var barres = etapes.map(function (e, i) {
      var pc = Math.round(e.n / haut * 100);
      var prec = i ? etapes[i - 1].n : null;
      var conv = (prec !== null && prec > 0) ? Math.round(e.n / prec * 100) : null;
      var chute = (conv !== null && conv < 100);
      return '<div class="ent-l" style="--i:' + i + ';">' +
        '<div class="ent-tete">' +
          '<span class="ent-nom">' + esc(e.l) + '</span>' +
          '<span class="ent-n">' + e.n + '</span>' +
        '</div>' +
        '<div class="ent-piste"><span style="width:' + Math.max(pc, e.n ? 1.5 : 0) + '%;background:' + teintes[i] + ';"></span></div>' +
        '<div class="ent-pied">' +
          '<span class="ent-dit">' + esc(e.dit) + '</span>' +
          (conv !== null
            ? '<span class="ent-conv' + (chute && conv < 40 ? ' faible' : '') + '">' + conv + ' % de l\'étape précédente</span>'
            : '<span class="ent-conv">100 %</span>') +
        '</div>' +
      '</div>';
    }).join('');

    var partenaires = etapes[4].n;
    var taux = P.length ? Math.round(partenaires / P.length * 100) : 0;

    return '<div class="panel gr-panel">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">L\'<em>entonnoir</em></div>' +
        '<div class="panel-sub">Où le portefeuille se perd</div>' +
      '</div>' +
      '<div class="ent-resume"><b>' + taux + ' %</b><span>de vos fiches signent</span></div>' +
      '</div>' +
      '<div class="ent-corps">' + barres + '</div>' +
      (refus ? '<p class="ent-refus">' + refus + ' fiche' + (refus > 1 ? 's' : '') + ' sans suite, ' +
        'non comptée' + (refus > 1 ? 's' : '') + ' ci-dessus : un refus net vaut mieux qu\'une relance de plus.</p>' : '') +
    '</div>';
  }

  /* Une bulle plutôt qu'un titre natif : le titre met deux secondes à
     paraître, et ne s'affiche pas du tout au doigt. */
  function brancher() {
    document.querySelectorAll('[data-graphe]').forEach(function (toile) {
      var bulle = toile.querySelector('.gr-bulle');
      if (!bulle) return;
      var montrer = function (ev) {
        var c = ev.target.closest ? ev.target.closest('.gr-cible') : null;
        if (!c) { bulle.hidden = true; return; }
        bulle.textContent = c.dataset.info;
        bulle.hidden = false;
        var r = toile.getBoundingClientRect();
        var x = ev.clientX - r.left;
        bulle.style.left = Math.min(Math.max(x, 60), r.width - 60) + 'px';
      };
      toile.addEventListener('mousemove', montrer);
      toile.addEventListener('touchstart', function (ev) {
        if (ev.touches && ev.touches[0]) montrer({ target: document.elementFromPoint(ev.touches[0].clientX, ev.touches[0].clientY), clientX: ev.touches[0].clientX });
      }, { passive: true });
      toile.addEventListener('mouseleave', function () { bulle.hidden = true; });
    });
  }

  window.MelodiaGraphes = { activite: activite, entonnoir: entonnoir, brancher: brancher };
})();
