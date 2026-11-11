/*!
 * julie-dashboard.js — Console Julie v2 · tableau de bord.
 *
 * Disposition inspirée de shadcn `dashboard-01` (MIT) : cartes KPI + graphique
 * d’aire interactif + tracker 30 jours + bar lists. Ré-implémenté en SVG pur,
 * sans dépendance (aucune bibliothèque vendorisée).
 *
 * Données : `journal` mode de /api/prospect-mail (80 derniers envois). Si le
 * serveur ne répond pas (ou si la session n’a pas encore d’envoi), on affiche
 * un état vide soigné (idée d’état vide, aucun code repris) avec un renvoi vers
 * « Ma journée ».
 *
 * Aucun token CSS n’est redéfini. `prefers-reduced-motion` désactive les
 * animations d’entrée et le compteur.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J) return;

  var etat = {
    chargement: false,
    data: null
  };

  // ─── Utilitaires ─────────────────────────────────────────────────────
  function esc(s) { return J.esc(s); }

  function isoJour(d) {
    var y = d.getUTCFullYear();
    var m = ('0' + (d.getUTCMonth() + 1)).slice(-2);
    var j = ('0' + d.getUTCDate()).slice(-2);
    return y + '-' + m + '-' + j;
  }

  function agreger(lignes) {
    var aujourdhui = J.parseDate(J.aujourdhuiParis());
    var jours = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date(aujourdhui.getTime() - i * 86400_000);
      jours.push({ date: d, envois: 0, ouverts: 0, clics: 0, rejets: 0 });
    }
    var parDate = {};
    jours.forEach(function (j) { parDate[isoJour(j.date)] = j; });
    (lignes || []).forEach(function (l) {
      var d = J.parseDate(l && l.envoye_le);
      if (!d) return;
      var j = parDate[isoJour(d)];
      if (!j) return;
      j.envois++;
      var st = String(l.statut || '');
      if (st === 'ouvert' || st === 'clique' || (l.ouvert_nb | 0) > 0) j.ouverts++;
      if (st === 'clique' || (l.clique_nb | 0) > 0) j.clics++;
      if (st === 'rejete' || st === 'plainte') j.rejets++;
    });
    return jours;
  }

  function somme(liste, cle) {
    return liste.reduce(function (a, j) { return a + (j[cle] || 0); }, 0);
  }

  function calculerKpis(jours) {
    if (!jours.length) return { envoisAuj: 0, deltaEnvois: 0, ouvSemaine: 0, deltaOuv: 0, clicsSemaine: 0, deltaClics: 0 };
    var aujourdhui = jours[jours.length - 1];
    var hier = jours[jours.length - 2] || { envois: 0 };
    var semaineActuelle = jours.slice(-7);
    var semaineAvant = jours.slice(-14, -7);

    var envoisAuj = aujourdhui.envois;
    var deltaEnvois = hier.envois > 0
      ? Math.round(((envoisAuj - hier.envois) / hier.envois) * 100)
      : (envoisAuj > 0 ? 100 : 0);

    var envSem = somme(semaineActuelle, 'envois');
    var ouvSem = somme(semaineActuelle, 'ouverts');
    var envAv = somme(semaineAvant, 'envois');
    var ouvAv = somme(semaineAvant, 'ouverts');
    var tauxSem = envSem > 0 ? Math.round((ouvSem / envSem) * 100) : 0;
    var tauxAv = envAv > 0 ? Math.round((ouvAv / envAv) * 100) : 0;

    var clicsSemaine = somme(semaineActuelle, 'clics');
    var clicsAv = somme(semaineAvant, 'clics');
    var deltaClics = clicsAv > 0 ? Math.round(((clicsSemaine - clicsAv) / clicsAv) * 100) : 0;

    return {
      envoisAuj: envoisAuj,
      deltaEnvois: deltaEnvois,
      ouvSemaine: tauxSem,
      deltaOuv: tauxSem - tauxAv,
      clicsSemaine: clicsSemaine,
      deltaClics: deltaClics
    };
  }

  function calculerTop(lignes, cle) {
    var parCle = {};
    (lignes || []).forEach(function (l) {
      if (!l) return;
      var st = String(l.statut || '');
      if (st !== 'ouvert' && st !== 'clique' && !(l.ouvert_nb | 0) && !(l.clique_nb | 0)) return;
      var v = String(l[cle] || '(non renseigné)');
      parCle[v] = (parCle[v] || 0) + 1;
    });
    return Object.keys(parCle)
      .map(function (k) { return { label: k, valeur: parCle[k] }; })
      .sort(function (a, b) { return b.valeur - a.valeur; })
      .slice(0, 5);
  }

  // ─── SVG : sparkline ─────────────────────────────────────────────────
  function sparklinePath(valeurs, w, h) {
    if (!valeurs.length) return '';
    var max = Math.max.apply(null, valeurs.concat([1]));
    var p = '';
    for (var i = 0; i < valeurs.length; i++) {
      var x = (i / Math.max(1, valeurs.length - 1)) * w;
      var y = h - (valeurs[i] / max) * h;
      p += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    return p;
  }

  function kpiHTML(label, valeur, unite, delta, sparkData, id) {
    var w = 120;
    var h = 32;
    var d = sparklinePath(sparkData, w, h);
    var classeDelta = delta >= 0 ? 'jv2-kpi-delta-haut' : 'jv2-kpi-delta-bas';
    var sym = delta >= 0 ? '▲' : '▼';
    return '' +
      '<div class="jv2-kpi" data-kpi="' + esc(id) + '">' +
        '<div class="jv2-kpi-label">' + esc(label) + '</div>' +
        '<div class="jv2-kpi-valeur mono" data-count="' + valeur + '">' + valeur + '</div>' +
        '<div class="jv2-kpi-unite">' + esc(unite) + '</div>' +
        '<div class="jv2-kpi-bas">' +
          '<svg class="jv2-spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="' + d + '"/></svg>' +
          '<span class="jv2-kpi-delta ' + classeDelta + '">' + sym + ' ' + Math.abs(delta) + '%</span>' +
        '</div>' +
      '</div>';
  }

  // ─── SVG : graphique d’aire 30 jours ─────────────────────────────────
  function chartHTML(jours) {
    var w = 800;
    var h = 220;
    var pad = 28;
    var maxE = Math.max.apply(null, jours.map(function (j) { return j.envois; }).concat([1]));

    /* Courbe lissée (Catmull-Rom → Bézier), bornée au cadre. */
    function ligne(cle) {
      var pts = jours.map(function (j, i) {
        return [pad + (i / Math.max(1, jours.length - 1)) * (w - pad * 2), h - pad - (j[cle] / maxE) * (h - pad * 2)];
      });
      if (!pts.length) return '';
      var haut = pad, bas = h - pad;
      function b(y) { return Math.max(haut, Math.min(bas, y)); }
      var p = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1) + ' ';
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = b(p1[1] + (p2[1] - p0[1]) / 6);
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = b(p2[1] - (p3[1] - p1[1]) / 6);
        p += 'C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1) + ' ';
      }
      return p;
    }
    function aire(cle) {
      var p = ligne(cle);
      var xFin = pad + (w - pad * 2);
      var yBas = h - pad;
      return p + 'L' + xFin.toFixed(1) + ',' + yBas.toFixed(1) + ' L' + pad + ',' + yBas.toFixed(1) + ' Z';
    }

    return '' +
      '<div class="jv2-chart">' +
        '<div class="jv2-chart-label">Envois, ouvertures, clics · 30 jours</div>' +
        '<svg class="jv2-chart-svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-label="Graphique d’activité">' +
          '<path class="jv2-chart-aire-envois" d="' + aire('envois') + '"/>' +
          '<path class="jv2-chart-aire-ouverts" d="' + aire('ouverts') + '"/>' +
          '<path class="jv2-chart-aire-clics" d="' + aire('clics') + '"/>' +
          '<path class="jv2-chart-ligne-envois" d="' + ligne('envois') + '"/>' +
          '<path class="jv2-chart-ligne-ouverts" d="' + ligne('ouverts') + '"/>' +
          '<path class="jv2-chart-ligne-clics" d="' + ligne('clics') + '"/>' +
        '</svg>' +
        '<div class="jv2-chart-legende">' +
          '<span><i class="jv2-dot-envois"></i> Envois</span>' +
          '<span><i class="jv2-dot-ouverts"></i> Ouverts</span>' +
          '<span><i class="jv2-dot-clics"></i> Cliqués</span>' +
        '</div>' +
      '</div>';
  }

  // ─── Tracker 30 jours ────────────────────────────────────────────────
  function trackerHTML(jours) {
    var cases = jours.map(function (j) {
      var total = j.envois + j.ouverts + j.clics;
      var niveau = total === 0 ? 0 : total < 3 ? 1 : total < 6 ? 2 : total < 12 ? 3 : 4;
      var titre = isoJour(j.date) + ' · ' + j.envois + ' envois · ' + j.ouverts + ' ouverts';
      return '<div class="jv2-tracker-case jv2-tracker-n' + niveau + '" title="' + esc(titre) + '"></div>';
    }).join('');
    return '' +
      '<div class="jv2-tracker">' +
        '<div class="jv2-tracker-label">Activité · 30 derniers jours</div>' +
        '<div class="jv2-tracker-grille">' + cases + '</div>' +
      '</div>';
  }

  // ─── Bar list ────────────────────────────────────────────────────────
  function barListHTML(titre, items) {
    if (!items || !items.length) return '';
    var max = Math.max.apply(null, items.map(function (x) { return x.valeur; }).concat([1]));
    var rows = items.map(function (x) {
      var pct = Math.round((x.valeur / max) * 100);
      return '' +
        '<li>' +
          '<span class="jv2-bl-label">' + esc(x.label) + '</span>' +
          '<span class="jv2-bl-barre"><i style="width:' + pct + '%"></i></span>' +
          '<span class="jv2-bl-valeur mono">' + x.valeur + '</span>' +
        '</li>';
    }).join('');
    return '' +
      '<div class="jv2-barlist">' +
        '<div class="jv2-barlist-titre">' + esc(titre) + '</div>' +
        '<ul>' + rows + '</ul>' +
      '</div>';
  }

  // ─── Vue ─────────────────────────────────────────────────────────────
  function vueVideHTML() {
    return '' +
      '<div class="jv2 jv2-dashboard">' +
        '<div class="jv2-dash-vide">' +
          '<div class="jv2-dash-vide-titre">Votre pipeline en un coup d’œil</div>' +
          '<div class="jv2-dash-vide-sous">Aucun envoi sur les 30 derniers jours.</div>' +
          '<a class="btn" href="#journee">Ouvrir Ma journée</a>' +
        '</div>' +
      '</div>';
  }

  function vueHTML(data) {
    var jours = data.jours;
    var totalEnvois = somme(jours, 'envois');
    if (!jours.length || totalEnvois === 0) return vueVideHTML();

    var k = data.kpis;
    var sparkEnv = jours.slice(-14).map(function (j) { return j.envois; });
    var sparkOuv = jours.slice(-14).map(function (j) { return j.ouverts; });
    var sparkClic = jours.slice(-14).map(function (j) { return j.clics; });

    return '' +
      '<div class="jv2 jv2-dashboard">' +
        '<div class="jv2-kpis">' +
          kpiHTML('Envois aujourd’hui', k.envoisAuj, 'courriels', k.deltaEnvois, sparkEnv, 'envois') +
          kpiHTML('Taux d’ouverture · 7 j', k.ouvSemaine, '%', k.deltaOuv, sparkOuv, 'ouverts') +
          kpiHTML('Clics · 7 j', k.clicsSemaine, 'clics', k.deltaClics, sparkClic, 'clics') +
          kpiHTML('Partenaires signés', data.partenaires || 0, 'cumul', data.deltaPartenaires || 0, [data.partenaires || 0], 'partenaires') +
        '</div>' +
        '<div class="jv2-dash-grille">' +
          chartHTML(jours) +
          trackerHTML(jours) +
        '</div>' +
        '<div class="jv2-dash-barlists">' +
          barListHTML('Top modèles par ouverture', data.topModeles) +
          barListHTML('Maisons les plus engagées', data.topDepartements) +
        '</div>' +
      '</div>';
  }

  // ─── Chargement ──────────────────────────────────────────────────────
  async function chargerJournal() {
    try {
      var res = await fetch('/api/prospect-mail', {
        method: 'POST',
        headers: J.entetes(),
        credentials: 'same-origin',
        body: JSON.stringify({ mode: 'journal' })
      });
      if (!res.ok) return [];
      var data = await res.json();
      return Array.isArray(data.lignes) ? data.lignes : [];
    } catch (_) {
      return [];
    }
  }

  async function chargerPartenaires() {
    try {
      if (window.MelodiaProspects && typeof window.MelodiaProspects.mine === 'function') {
        var liste = await Promise.resolve(window.MelodiaProspects.mine());
        if (Array.isArray(liste)) {
          return liste.filter(function (p) {
            return p && p.statut === 'partenaire';
          }).length;
        }
      }
    } catch (_) { /* silencieux */ }
    return 0;
  }

  async function charger() {
    var lignes = await chargerJournal();
    var jours = agreger(lignes);
    var kpis = calculerKpis(jours);
    var topModeles = calculerTop(lignes, 'modele');
    var topDepartements = calculerTop(lignes, 'societe');
    var partenaires = await chargerPartenaires();
    return {
      jours: jours,
      kpis: kpis,
      topModeles: topModeles,
      topDepartements: topDepartements,
      partenaires: partenaires
    };
  }

  // ─── Rendu ───────────────────────────────────────────────────────────
  async function rendre() {
    var cible = document.querySelector('[data-julie-vue="dashboard"]');
    if (!cible) return;
    if (etat.chargement) return;
    etat.chargement = true;

    if (window.MelodiaMotion && window.MelodiaMotion.skeleton) {
      window.MelodiaMotion.skeleton(cible, 4);
    }

    try {
      var data = await charger();
      etat.data = data;
      cible.innerHTML = vueHTML(data);

      // Compteur animé sur les KPI (respecte reduced-motion)
      if (!(window.MelodiaMotion && window.MelodiaMotion.reduced)) {
        var cibles = cible.querySelectorAll('[data-count]');
        Array.prototype.forEach.call(cibles, function (el) {
          var fin = Number(el.dataset.count) || 0;
          if (fin <= 0) return;
          var debut = 0;
          var t0 = performance.now();
          var duree = 520;
          function frame(t) {
            var p = Math.min(1, (t - t0) / duree);
            var v = Math.round(debut + (fin - debut) * p);
            el.textContent = String(v);
            if (p < 1) requestAnimationFrame(frame);
            else el.textContent = String(fin);
          }
          requestAnimationFrame(frame);
        });
      }

      // Si relief.js expose un flip counter, on l’utilise (respecte reduced-motion aussi)
      if (window.MelodiaRelief && typeof window.MelodiaRelief.flipCounters === 'function') {
        try { window.MelodiaRelief.flipCounters(cible); } catch (_) {}
      }
    } catch (e) {
      cible.innerHTML = '<div class="jv2 jv2-erreur">Impossible de charger le tableau de bord : ' + esc(e.message) + '</div>';
    } finally {
      etat.chargement = false;
    }
  }

  window.MelodiaJulieDashboard = {
    vue: function () { return '<div data-julie-vue="dashboard"><div class="jv2 jv2-chargement">Chargement…</div></div>'; },
    brancher: function () { rendre(); },
    rendre: rendre
  };
})();
