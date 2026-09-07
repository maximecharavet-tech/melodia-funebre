/* ═══════════════════════════════════════════════════════════════
   partenaire-graphes.js — Ce qu'une agence funéraire veut voir

   POURQUOI

   La console partenaire affichait une marge cumulée depuis
   l'ouverture : un nombre qui ne fait que monter, et qui ne dit rien.
   Un directeur d'agence a deux questions, et deux seulement :

   · « Combien ça m'a rapporté ce mois-ci, comparé aux précédents ? »
     Un cumul depuis l'ouverture ne répond pas : il monte même quand
     l'activité s'effondre.
   · « Où en sont les hommages que j'ai commandés ? » Parce que c'est
     lui qui a une famille au téléphone, pas nous.

   LA MARGE N'EST PLUS ÉCRITE EN DUR

   Elle valait 60 % à cinq endroits du fichier. Le taux se règle
   pourtant dans la console du fondateur : une agence négociée à 55 %
   voyait des montants faux sur son propre écran. Il est lu ici.

   COULEURS

   L'or de la maison assombri (#a98b34) et un bleu (#2f88b8), les
   mêmes que la console commerciale, contrôlés distinguables par un
   daltonien sur le fond sombre — écart de 19,5 en protanopie pour un
   seuil admis à 8.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var eur = function (n) { return (Math.round(n) || 0).toLocaleString('fr-FR') + ' €'; };

  var MARGE = '#a98b34';
  var MAISON = '#2f88b8';

  /* Le taux de reversement, lu dans les réglages de la maison plutôt
     que gravé. Repli à 60 % : c'est le taux annoncé sur le site, donc
     celui qui s'applique quand rien n'a été négocié. */
  function taux() {
    var I = window.MelodiaIntranet;
    var v = (I && I.reglages && I.reglages.valeur) ? Number(I.reglages.valeur('margeAgence')) : NaN;
    return (v >= 0 && v <= 100) ? v : 60;
  }
  function margeDe(prix) { return Math.round((prix || 0) * taux() / 100); }

  function moisCle(d) { var x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); }
  function moisNom(cle) {
    var p = cle.split('-');
    return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
  }

  /* ─── Ce que l'agence a gagné, mois par mois ───
     Douze mois glissants. La part de la maison est montrée par-dessus
     la marge de l'agence : voir les deux évite la conversation
     désagréable où l'agence découvre le partage en fin d'année. */
  function revenus(orders) {
    var O = orders || [];
    var mois = [];
    var d = new Date(); d.setDate(1);
    for (var i = 11; i >= 0; i--) {
      var m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      mois.push(moisCle(m));
    }
    var par = {};
    mois.forEach(function (m) { par[m] = { marge: 0, maison: 0, n: 0 }; });
    O.forEach(function (o) {
      var k = moisCle(o.created_at);
      if (!par[k]) return;
      var mg = margeDe(o.price);
      par[k].marge += mg;
      par[k].maison += (o.price || 0) - mg;
      par[k].n++;
    });

    var totalMarge = 0, max = 0;
    mois.forEach(function (m) {
      totalMarge += par[m].marge;
      var t = par[m].marge + par[m].maison;
      if (t > max) max = t;
    });

    if (!totalMarge) {
      return '<div class="panel gr-panel">' +
        '<div class="panel-title">Vos <em>revenus</em></div>' +
        '<div class="panel-sub">Douze derniers mois</div>' +
        '<p class="gr-vide">Aucune commande enregistrée pour l\'instant. Dès le premier hommage, ' +
        'vous verrez ici ce qu\'il vous rapporte, mois par mois.</p></div>';
    }

    var moisCourant = par[mois[11]], moisPrec = par[mois[10]];
    var ecart = moisPrec.marge ? Math.round((moisCourant.marge - moisPrec.marge) / moisPrec.marge * 100) : null;

    var L = 100, H = 44, gauche = 9, bas = 5;
    var pas = (L - gauche) / 12, barre = pas * 0.56;
    /* Le vide entre les deux segments est réservé dans l'échelle :
       l'ajouter après coup faisait sortir du cadre la colonne la
       plus haute, celle qu'on regarde en premier. */
    var hu = H - bas, ech = max ? (hu - 0.4) / max : 0;

    var colonnes = mois.map(function (m, k) {
      var v = par[m];
      var x = gauche + k * pas + (pas - barre) / 2;
      var hM = v.marge * ech, hH = v.maison * ech;
      var out = '';
      if (hH) out += '<rect x="' + x.toFixed(2) + '" y="' + (hu - hH - hM - (hM ? 0.4 : 0)).toFixed(2) +
        '" width="' + barre.toFixed(2) + '" height="' + hH.toFixed(2) + '" rx="0.5" fill="' + MAISON + '" opacity="0.55"/>';
      if (hM) out += '<rect x="' + x.toFixed(2) + '" y="' + (hu - hM).toFixed(2) +
        '" width="' + barre.toFixed(2) + '" height="' + hM.toFixed(2) + '" rx="0.5" fill="' + MARGE + '"/>';
      out += '<rect class="gr-cible" x="' + (gauche + k * pas).toFixed(2) + '" y="0" width="' + pas.toFixed(2) +
        '" height="' + hu.toFixed(2) + '" fill="transparent" data-info="' +
        esc(new Date(+m.split('-')[0], +m.split('-')[1] - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })) +
        ' · ' + v.n + ' hommage' + (v.n > 1 ? 's' : '') + ' · vous ' + eur(v.marge) + '"/>';
      return out;
    }).join('');

    var reperes = [max, Math.round(max / 2)].filter(function (v, i, a) { return v > 0 && a.indexOf(v) === i; })
      .map(function (v) {
        var y = hu - v * ech;
        return '<line x1="' + gauche + '" y1="' + y.toFixed(2) + '" x2="' + L + '" y2="' + y.toFixed(2) +
          '" stroke="currentColor" stroke-width="0.15" opacity="0.28"/>' +
          '<text x="0" y="' + (y + 1.1).toFixed(2) + '" class="gr-ech">' + v + '</text>';
      }).join('');

    var etiquettes = mois.map(function (m, k) {
      /* Un mois sur trois : douze étiquettes se chevaucheraient. */
      if (k % 3 !== 0 && k !== 11) return '';
      return '<text x="' + (gauche + k * pas + pas / 2).toFixed(2) + '" y="' + (H - 1) + '" class="gr-ech gr-mois">' +
        esc(moisNom(m)) + '</text>';
    }).join('');

    return '<div class="panel gr-panel">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">Vos <em>revenus</em></div>' +
        '<div class="panel-sub">Douze derniers mois · ' + eur(totalMarge) + ' pour votre agence</div>' +
      '</div>' +
      '<div class="gr-legende">' +
        '<span><i style="background:' + MARGE + ';"></i>Votre marge</span>' +
        '<span><i style="background:' + MAISON + ';opacity:.55;"></i>Part maison</span>' +
      '</div></div>' +

      '<div class="pa-mois">' +
        '<div><b>' + eur(moisCourant.marge) + '</b><span>ce mois-ci</span></div>' +
        (ecart !== null
          ? '<div class="pa-ecart ' + (ecart >= 0 ? 'haut' : 'bas') + '">' +
            (ecart >= 0 ? '▲ ' : '▼ ') + Math.abs(ecart) + ' %<span>vs mois précédent</span></div>'
          : '<div class="pa-ecart"><span>premier mois comparable</span></div>') +
      '</div>' +

      '<div class="gr-toile" data-graphe="revenus">' +
        '<svg viewBox="0 0 ' + L + ' ' + H + '" preserveAspectRatio="none" role="img" ' +
          'aria-label="Revenus mensuels sur douze mois. Total pour l\'agence : ' + eur(totalMarge) + '.">' +
          reperes + colonnes + etiquettes +
        '</svg>' +
        '<div class="gr-bulle" hidden></div>' +
      '</div>' +

      '<table class="gr-table"><caption>Détail des six derniers mois</caption>' +
        '<thead><tr><th>Mois</th><th>Hommages</th><th>Votre marge</th></tr></thead><tbody>' +
        mois.slice(6).map(function (m) {
          return '<tr><td>' + esc(new Date(+m.split('-')[0], +m.split('-')[1] - 1, 1)
            .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })) + '</td>' +
            '<td>' + par[m].n + '</td><td>' + eur(par[m].marge) + '</td></tr>';
        }).join('') +
      '</tbody></table>' +
      '<p class="gr-note">Marge calculée au taux de ' + taux() + ' % en vigueur pour votre agence.</p>' +
    '</div>';
  }

  /* ─── Où en sont les hommages commandés ───
     Une agence a des familles au téléphone : elle doit pouvoir dire
     « c'est en composition, vous l'avez demain » sans nous appeler. */
  function avancement(orders, FLOW, ST) {
    var O = orders || [];
    if (!O.length) {
      return '<div class="panel gr-panel">' +
        '<div class="panel-title">L\'<em>avancement</em></div>' +
        '<div class="panel-sub">Où en sont vos hommages</div>' +
        '<p class="gr-vide">Aucune commande en cours. Dès qu\'une famille vous en confie une, ' +
        'vous suivrez ici son avancement sans avoir à nous appeler.</p></div>';
    }

    var etapes = (FLOW || []).map(function (s) {
      return { s: s, l: (ST[s] || {}).label || s, c: (ST[s] || {}).color || '#8e8878',
               n: O.filter(function (o) { return o.status === s; }).length };
    });
    var enCours = O.filter(function (o) { return o.status !== 'livree'; });
    var max = Math.max.apply(null, etapes.map(function (e) { return e.n; }).concat([1]));

    return '<div class="panel gr-panel">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">L\'<em>avancement</em></div>' +
        '<div class="panel-sub">' + enCours.length + ' en cours · ' + O.length + ' au total</div>' +
      '</div></div>' +
      '<div class="pa-etapes">' +
        etapes.map(function (e, i) {
          return '<div class="pa-etape" style="--i:' + i + ';">' +
            '<div class="pa-e-tete"><span class="pa-e-nom">' + esc(e.l) + '</span>' +
            '<span class="pa-e-n">' + e.n + '</span></div>' +
            '<div class="pa-e-piste"><span style="width:' + Math.round(e.n / max * 100) + '%;background:' + e.c + ';"></span></div>' +
          '</div>';
        }).join('') +
      '</div>' +
      (enCours.length
        ? '<p class="gr-note">Une famille qui appelle veut une date. Ouvrez « Mes commandes » : ' +
          'chaque hommage y porte son étape et son échéance.</p>'
        : '<p class="gr-note">Tout est livré. Rien ne traîne.</p>') +
    '</div>';
  }

  function brancher() {
    document.querySelectorAll('[data-graphe]').forEach(function (toile) {
      var bulle = toile.querySelector('.gr-bulle');
      if (!bulle) return;
      var montrer = function (ev) {
        var c = ev.target && ev.target.closest ? ev.target.closest('.gr-cible') : null;
        if (!c) { bulle.hidden = true; return; }
        bulle.textContent = c.dataset.info;
        bulle.hidden = false;
        var r = toile.getBoundingClientRect();
        bulle.style.left = Math.min(Math.max(ev.clientX - r.left, 70), r.width - 70) + 'px';
      };
      toile.addEventListener('mousemove', montrer);
      toile.addEventListener('touchstart', function (ev) {
        if (ev.touches && ev.touches[0]) {
          montrer({ target: document.elementFromPoint(ev.touches[0].clientX, ev.touches[0].clientY),
                    clientX: ev.touches[0].clientX });
        }
      }, { passive: true });
      toile.addEventListener('mouseleave', function () { bulle.hidden = true; });
    });
  }

  window.MelodiaPartenaireGraphes = {
    revenus: revenus, avancement: avancement, brancher: brancher,
    taux: taux, margeDe: margeDe
  };
})();
