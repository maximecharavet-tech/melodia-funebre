/*!
 * julie-partenaires.js — Console Julie · « Mes partenaires » et « Mes résultats ».
 *
 * Mes partenaires : les agences signées (Partenaire, Activée), leurs
 * commandes en agrégats (nombre, dernière date — rien sur les familles),
 * et l'alerte « silencieuse depuis 45 jours : passer la voir ».
 * Mes résultats : quatre chiffres, semaine en cours contre la précédente
 * (contacts utiles, écoutes, rendez-vous, agences activées), et huit
 * semaines en barres sobres.
 *
 * Dépend de : MelodiaVente, MelodiaJulie, MelodiaJulieActions, MelodiaConsole.
 * License: internal.
 */
(function () {
  'use strict';

  var V = window.MelodiaVente;
  var J = window.MelodiaJulie;
  var A = window.MelodiaJulieActions;
  if (!V || !J || !window.MelodiaConsole) return;
  var esc = J.esc;

  function prospects() { return window.MelodiaConsole.prospects() || []; }
  function joliJour(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return isNaN(d) ? '—' : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(d);
  }

  /* ─── Mes partenaires ─────────────────────────────────────────── */
  var etat = { stats: null, erreur: '' };

  async function chargerStats() {
    if (!window.MelodiaRest || !window.MelodiaRest.actif) return {};
    var r = await fetch('/api/prospect-mail', { method: 'POST', credentials: 'same-origin', headers: J.entetes(), body: JSON.stringify({ mode: 'partenaires' }) });
    var d = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(d.error || 'Commandes indisponibles.');
    return d.stats || {};
  }

  function vuePartenaires() {
    var lignes = V.partenaires(prospects(), etat.stats || {}, V.jourParis());
    if (!lignes.length) {
      return '<div class="jv" data-julie-vue="partenaires"><section class="panel jv-panel">' +
        '<p class="col-vide">Aucune agence partenaire pour l’instant. Une fiche passée en « Partenaire » apparaîtra ici avec ses commandes.</p></section></div>';
    }
    var silencieuses = lignes.filter(function (l) { return l.silencieuse; }).length;
    return '<div class="jv" data-julie-vue="partenaires">' +
      '<p class="panel-note">' + lignes.length + ' agence' + (lignes.length > 1 ? 's' : '') + ' signée' + (lignes.length > 1 ? 's' : '') +
        (silencieuses ? ' · <b class="jv-retard">' + silencieuses + ' silencieuse' + (silencieuses > 1 ? 's' : '') + '</b>' : '') +
        (etat.stats === null ? ' · chargement des commandes…' : '') + (etat.erreur ? ' · ' + esc(etat.erreur) : '') + '</p>' +
      '<ul class="jv-liste-appels">' + lignes.map(function (l) {
        var ST = (window.MELODIA_PROSPECT_STATUTS || {})[l.statut] || { label: l.statut };
        return '<li class="jv-ligne-appel" data-siret="' + esc(l.siret) + '" data-owner="' + esc(l.owner) + '">' +
          '<div class="jv-ligne-corps"><div class="jv-ligne-nom">' + esc(l.nom) + ' <span class="jv-ligne-meta">· ' + esc(l.ville) + ' · ' + esc(ST.label) + '</span></div>' +
          '<div class="jv-ligne-meta">Signée le ' + esc(joliJour(l.signee)) + ' · ' +
            (l.commandes ? l.commandes + ' commande' + (l.commandes > 1 ? 's' : '') + ', la dernière le ' + esc(joliJour(l.derniere)) : 'aucune commande encore') + '</div>' +
          (l.silencieuse ? '<div class="jv-ligne-meta jv-retard">Silencieuse depuis ' + l.silence + ' jours : passer la voir.</div>' : '') +
          '</div>' +
          '<div class="jv-ligne-actions">' +
            (l.aActiver ? '<button type="button" class="btn btn-sm btn-gold" data-jv-activer>Marquer activée</button>' : '') +
            (l.silencieuse ? '<button type="button" class="btn btn-sm" data-jv-visite>Prévoir une visite</button>' : '') +
            '<button type="button" class="btn btn-sm btn-outline" data-jv-fiche>Fiche</button>' +
          '</div></li>';
      }).join('') + '</ul></div>';
  }

  function rendrePartenaires() {
    var h = document.querySelector('[data-julie-vue="partenaires"]');
    if (h) h.outerHTML = vuePartenaires();
  }

  function brancherPartenaires() {
    var view = document.getElementById('view');
    if (!view) return;
    if (etat.stats === null) {
      chargerStats().then(function (s) { etat.stats = s; etat.erreur = ''; })
        .catch(function (e) { etat.stats = {}; etat.erreur = e.message; })
        .then(rendrePartenaires);
    }
    if (view.dataset.jvPartenaires === '1') return;
    view.dataset.jvPartenaires = '1';
    view.addEventListener('click', async function (ev) {
      var li = ev.target.closest('[data-julie-vue="partenaires"] [data-siret]');
      if (!li || !A) return;
      var siret = li.dataset.siret, owner = li.dataset.owner;
      if (ev.target.closest('[data-jv-fiche]')) return A.ouvrirFiche(siret);
      if (ev.target.closest('[data-jv-activer]')) { if (await A.changerStatut(siret, 'activee', owner)) rendrePartenaires(); return; }
      if (ev.target.closest('[data-jv-visite]')) { if (await A.poserSuite(siret, owner)) rendrePartenaires(); }
    });
  }

  /* ─── Mes résultats ───────────────────────────────────────────── */
  var CHIFFRES = [
    { k: 'contacts', t: 'Contacts utiles', d: 'Appels où vous avez joint quelqu’un, et réponses reçues' },
    { k: 'ecoutes', t: 'Écoutes', d: 'Liens d’écoute ouverts plus de vingt secondes' },
    { k: 'rdv', t: 'Rendez-vous', d: 'Rendez-vous posés comme prochaine action' },
    { k: 'activees', t: 'Agences activées', d: 'Première famille servie par l’agence' }
  ];

  function ecart(a, b) {
    var d = a - b;
    if (!d) return '<span class="jv-kpi-ecart">comme la semaine dernière</span>';
    return '<span class="jv-kpi-ecart ' + (d > 0 ? 'est-hausse' : 'est-baisse') + '">' + (d > 0 ? '+' : '−') + Math.abs(d) + ' sur la semaine dernière</span>';
  }

  function barres(semaines, k) {
    var max = Math.max.apply(null, semaines.map(function (s) { return s[k]; }).concat([1]));
    var l = 14, g = 6, h = 40;
    return '<svg class="jv-kpi-barres" viewBox="0 0 ' + (semaines.length * (l + g)) + ' ' + h + '" role="img" aria-label="Huit dernières semaines : ' +
      semaines.map(function (s) { return s[k]; }).join(', ') + '">' +
      semaines.map(function (s, i) {
        var y = Math.round((s[k] / max) * (h - 4));
        return '<rect x="' + (i * (l + g)) + '" y="' + (h - Math.max(y, 1)) + '" width="' + l + '" height="' + Math.max(y, 1) + '" rx="2"' +
          (i === semaines.length - 1 ? ' class="est-courante"' : '') + '></rect>';
      }).join('') + '</svg>';
  }

  function vueResultats() {
    var r = V.kpiSemaines(prospects(), V.jourParis(), 8);
    return '<div class="jv" data-julie-vue="resultats">' +
      '<p class="panel-note">Semaine du ' + esc(joliJour(r.courante.lundi + 'T12:00:00Z')) + ', comparée à la précédente. Chiffres relus dans vos fiches.</p>' +
      '<div class="jv-kpi">' + CHIFFRES.map(function (c) {
        return '<section class="jv-kpi-carte"><h3 class="jv-appel-h">' + esc(c.t) + '</h3>' +
          '<div class="jv-kpi-n">' + r.courante[c.k] + '</div>' + ecart(r.courante[c.k], r.precedente[c.k]) +
          barres(r.semaines, c.k) + '<p class="jv-kpi-d">' + esc(c.d) + '</p></section>';
      }).join('') + '</div></div>';
  }

  window.MelodiaJuliePartenaires = { vuePartenaires: vuePartenaires, vueResultats: vueResultats, reinitialiser: function () { etat.stats = null; } };

  window.MelodiaConsole.ajouterVue('partenaires', ['Prospects', 'Mes <em>partenaires</em>', function () { etat.stats = null; return vuePartenaires(); }, brancherPartenaires]);
  window.MelodiaConsole.ajouterVue('resultats', ['Mon poste', 'Mes <em>résultats</em>', vueResultats, function () {}]);
  var hv = (location.hash || '').replace(/^#/, '').split('?')[0];
  if ((hv === 'partenaires' || hv === 'resultats') && window.MelodiaConsole.demarree && window.MelodiaConsole.courante() !== hv && typeof window.go === 'function') window.go(hv);
})();
