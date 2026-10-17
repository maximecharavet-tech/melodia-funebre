/* ═══════════════════════════════════════════════════════════════
   maitre-graphes.js — Ce que le fondateur regarde le matin

   POURQUOI

   La vue générale disait « 1 097 € · toutes commandes » : un cumul
   qui ne fait que monter. Il ne répond à aucune des deux questions
   qu'on se pose en ouvrant sa console :

   · « Est-ce que ça monte ou est-ce que ça baisse ? » — d'où l'écart
     sur trente jours glissants, posé sur les tuiles elles-mêmes ;
   · « D'où vient l'argent, et en reste-t-il à encaisser ? » — d'où
     le chiffre d'affaires mois par mois, encaissé et à encaisser, et
     la répartition par offre.

   PAS DE GRAPHIQUE AVANT QU'IL Y AIT DE QUOI

   Douze colonnes vides n'apprennent rien. Les graphiques ne viennent
   qu'à partir de trois commandes, et l'écart ne s'affiche que si la
   période précédente en comptait : « +100 % » sur une base de zéro
   serait un mensonge arithmétique.

   COULEURS

   Les mêmes que la console partenaire et la console commerciale :
   l'or assombri (#a98b34) pour l'encaissé, le bleu (#2f88b8) pour ce
   qui reste dû. Contrôlées sur le fond des consoles (#0b0b11) : écart
   de 19,5 en protanopie et 17,8 en tritanopie, pour un seuil de 8.
   Chaque couleur est aussi nommée dans la légende et dans le tableau
   de détail : l'information ne tient jamais à la seule teinte.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var eur = function (n) { return (Math.round(n) || 0).toLocaleString('fr-FR') + ' €'; };

  var ENCAISSE = '#a98b34';
  var DU = '#2f88b8';
  var JOUR = 86400000;
  var SEUIL = 3;

  function moisCle(d) { var x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); }
  function moisDate(cle) { var p = cle.split('-'); return new Date(+p[0], +p[1] - 1, 1); }
  function moisNom(cle) { return moisDate(cle).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''); }
  function moisLong(cle) { return moisDate(cle).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); }

  /* ─── L'écart sur trente jours ───
     Trente jours glissants contre les trente d'avant, et non « ce mois
     contre le précédent » : le 3 du mois, le mois en cours ne compte
     que trois jours et paraîtrait toujours en chute. */
  function ecart(orders, mesure) {
    var maintenant = Date.now();
    var recent = 0, avant = 0;
    (orders || []).forEach(function (o) {
      var age = maintenant - new Date(o.created_at).getTime();
      if (isNaN(age) || age < 0) return;
      var v = mesure(o);
      if (age < 30 * JOUR) recent += v;
      else if (age < 60 * JOUR) avant += v;
    });
    if (!avant) return null;
    var pct = Math.round((recent - avant) / avant * 100);
    return { pct: pct, sens: pct > 0 ? 'haut' : pct < 0 ? 'bas' : 'stable' };
  }

  /* Le petit mot qui se pose sous la valeur d'une tuile. */
  function ecartHtml(e) {
    if (!e) return '';
    var fleche = e.sens === 'haut' ? '▲' : e.sens === 'bas' ? '▼' : '■';
    var mot = e.sens === 'stable' ? 'stable' : (e.pct > 0 ? '+' : '−') + Math.abs(e.pct) + ' %';
    return '<span class="kpi-ecart ' + e.sens + '" title="Trente derniers jours comparés aux trente précédents">' +
      '<span aria-hidden="true">' + fleche + '</span> ' + mot + ' <span class="kpi-ecart-sur">sur 30 j</span></span>';
  }

  /* ─── Le chiffre d'affaires, mois par mois ─── */
  function chiffre(orders) {
    var O = orders || [];
    if (O.length < SEUIL) return '';
    var mois = [];
    var d = new Date(); d.setDate(1);
    for (var i = 11; i >= 0; i--) mois.push(moisCle(new Date(d.getFullYear(), d.getMonth() - i, 1)));
    var par = {};
    mois.forEach(function (m) { par[m] = { encaisse: 0, du: 0, n: 0 }; });
    O.forEach(function (o) {
      var k = moisCle(o.created_at);
      if (!par[k]) return;
      if (o.paid) par[k].encaisse += o.price || 0; else par[k].du += o.price || 0;
      par[k].n++;
    });

    var total = 0, totalDu = 0, max = 0;
    mois.forEach(function (m) {
      total += par[m].encaisse + par[m].du; totalDu += par[m].du;
      max = Math.max(max, par[m].encaisse + par[m].du);
    });
    /* Une seule colonne pleine sur douze ne montre pas une tendance :
       il faut au moins deux mois d'activité pour qu'il y ait une pente. */
    var actifs = mois.filter(function (m) { return par[m].n; }).length;
    if (!total || actifs < 2) return '';

    var cour = par[mois[11]], prec = par[mois[10]];
    var vCour = cour.encaisse + cour.du, vPrec = prec.encaisse + prec.du;
    var ec = vPrec ? Math.round((vCour - vPrec) / vPrec * 100) : null;

    var L = 100, H = 44, gauche = 9, bas = 5;
    var pas = (L - gauche) / 12, barre = pas * 0.56;
    var hu = H - bas, ech = max ? (hu - 0.4) / max : 0;

    var colonnes = mois.map(function (m, k) {
      var v = par[m];
      var x = gauche + k * pas + (pas - barre) / 2;
      var hE = v.encaisse * ech, hD = v.du * ech;
      var out = '';
      /* Un filet du fond sépare les deux segments : sans lui, l'or et
         le bleu se touchent et la frontière se perd. */
      if (hD) out += '<rect x="' + x.toFixed(2) + '" y="' + (hu - hD - hE - (hE ? 0.4 : 0)).toFixed(2) +
        '" width="' + barre.toFixed(2) + '" height="' + hD.toFixed(2) + '" rx="0.5" fill="' + DU + '"/>';
      if (hE) out += '<rect x="' + x.toFixed(2) + '" y="' + (hu - hE).toFixed(2) +
        '" width="' + barre.toFixed(2) + '" height="' + hE.toFixed(2) + '" rx="0.5" fill="' + ENCAISSE + '"/>';
      out += '<rect class="gr-cible" x="' + (gauche + k * pas).toFixed(2) + '" y="0" width="' + pas.toFixed(2) +
        '" height="' + hu.toFixed(2) + '" fill="transparent" data-info="' +
        esc(moisLong(m) + ' · ' + v.n + ' commande' + (v.n > 1 ? 's' : '') + ' · ' + eur(v.encaisse + v.du) +
          (v.du ? ' dont ' + eur(v.du) + ' à encaisser' : '')) + '"/>';
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
      if (k % 3 !== 0 && k !== 11) return '';
      return '<text x="' + (gauche + k * pas + pas / 2).toFixed(2) + '" y="' + (H - 1) + '" class="gr-ech gr-mois">' +
        esc(moisNom(m)) + '</text>';
    }).join('');

    return '<div class="panel gr-panel">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">Le chiffre <em>d’affaires</em></div>' +
        '<div class="panel-sub">Douze derniers mois · ' + eur(total) + '</div>' +
      '</div>' +
      '<div class="gr-legende">' +
        '<span><i style="background:' + ENCAISSE + ';"></i>Encaissé</span>' +
        '<span><i style="background:' + DU + ';"></i>À encaisser</span>' +
      '</div></div>' +

      '<div class="pa-mois">' +
        '<div><b>' + eur(vCour) + '</b><span>ce mois-ci</span></div>' +
        (ec !== null
          ? '<div class="pa-ecart ' + (ec >= 0 ? 'haut' : 'bas') + '">' +
            (ec >= 0 ? '▲ ' : '▼ ') + Math.abs(ec) + ' %<span>vs mois précédent</span></div>'
          : '<div class="pa-ecart"><span>premier mois comparable</span></div>') +
      '</div>' +

      '<div class="gr-toile" data-graphe="chiffre">' +
        '<svg viewBox="0 0 ' + L + ' ' + H + '" preserveAspectRatio="none" role="img" ' +
          'aria-label="Chiffre d’affaires mensuel sur douze mois : ' + eur(total) + ', dont ' + eur(totalDu) + ' à encaisser.">' +
          reperes + colonnes + etiquettes +
        '</svg>' +
        '<div class="gr-bulle" hidden></div>' +
      '</div>' +

      '<table class="gr-table"><caption>Détail des six derniers mois</caption>' +
        '<thead><tr><th>Mois</th><th>Commandes</th><th>Encaissé</th><th>À encaisser</th></tr></thead><tbody>' +
        mois.slice(6).map(function (m) {
          return '<tr><td>' + esc(moisLong(m)) + '</td><td>' + par[m].n + '</td>' +
            '<td>' + eur(par[m].encaisse) + '</td><td>' + (par[m].du ? eur(par[m].du) : '—') + '</td></tr>';
        }).join('') +
      '</tbody></table>' +
      (totalDu ? '<p class="gr-note">' + eur(totalDu) + ' restent à encaisser sur l’année : ' +
        'la liste des commandes indique lesquelles.</p>' : '') +
    '</div>';
  }

  /* ─── D'où vient l'argent ───
     Une barre par offre, dans l'ordre des prix et non du plus vendu :
     l'ordre ne doit pas changer d'un jour à l'autre, sinon l'œil
     cherche Prestige à un endroit différent chaque matin. */
  function offres(orders) {
    var O = orders || [];
    if (O.length < SEUIL) return '';
    var ORDRE = ['Essentiel', 'Prestige', 'Mémorial'];
    var par = {};
    O.forEach(function (o) {
      var k = o.offer || 'Autre';
      if (!par[k]) par[k] = { n: 0, ca: 0 };
      par[k].n++; par[k].ca += o.price || 0;
    });
    var noms = ORDRE.filter(function (n) { return par[n]; })
      .concat(Object.keys(par).filter(function (n) { return ORDRE.indexOf(n) === -1; }));
    var total = O.reduce(function (s, o) { return s + (o.price || 0); }, 0);
    var max = Math.max.apply(null, noms.map(function (n) { return par[n].ca; }).concat([1]));
    var panier = Math.round(total / O.length);
    var payees = O.filter(function (o) { return o.paid; }).length;

    return '<div class="panel gr-panel">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">La <em>répartition</em></div>' +
        '<div class="panel-sub">Par offre · toutes commandes</div>' +
      '</div></div>' +
      '<div class="pa-mois">' +
        '<div><b>' + eur(panier) + '</b><span>panier moyen</span></div>' +
        '<div class="pa-ecart"><b class="ma-taux">' + Math.round(payees / O.length * 100) + ' %</b><span>commandes payées</span></div>' +
      '</div>' +
      '<div class="ma-offres">' +
        noms.map(function (n) {
          var v = par[n];
          var part = total ? Math.round(v.ca / total * 100) : 0;
          return '<div class="ma-offre">' +
            '<div class="ma-o-tete"><span class="ma-o-nom">' + esc(n) + '</span>' +
              '<span class="ma-o-val">' + eur(v.ca) + ' <span class="ma-o-part">' + part + ' %</span></span></div>' +
            '<div class="ma-o-piste" role="img" aria-label="' + esc(n) + ' : ' + v.n + ' commande' + (v.n > 1 ? 's' : '') +
              ', ' + eur(v.ca) + ', ' + part + ' % du chiffre d’affaires">' +
              '<span style="width:' + Math.max(2, Math.round(v.ca / max * 100)) + '%;"></span></div>' +
            '<div class="ma-o-n">' + v.n + ' commande' + (v.n > 1 ? 's' : '') + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  function brancher() {
    document.querySelectorAll('[data-graphe="chiffre"]').forEach(function (toile) {
      var bulle = toile.querySelector('.gr-bulle');
      if (!bulle || toile.dataset.branche) return;
      toile.dataset.branche = '1';
      var montrer = function (ev) {
        var c = ev.target && ev.target.closest ? ev.target.closest('.gr-cible') : null;
        if (!c) { bulle.hidden = true; return; }
        bulle.textContent = c.dataset.info;
        bulle.hidden = false;
        var r = toile.getBoundingClientRect();
        bulle.style.left = Math.min(Math.max(ev.clientX - r.left, 90), r.width - 90) + 'px';
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

  window.MelodiaMaitreGraphes = { ecart: ecart, ecartHtml: ecartHtml, chiffre: chiffre, offres: offres, brancher: brancher };
})();
