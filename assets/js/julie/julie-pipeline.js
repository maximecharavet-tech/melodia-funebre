/*!
 * julie-pipeline.js — Console Julie v2 · vue « Pipeline » (kanban).
 *
 * Sept colonnes = sept statuts. Chaque carte affiche nom, ville, score,
 * dernier événement, prochaine action, chips séquence/brochures. Drag & drop
 * par Pointer Events (aucune lib). Clavier : focus carte + M ouvre le menu
 * « Déplacer vers… ».
 *
 * Dépend de : window.MelodiaJulie, window.MelodiaProspects, window.MELODIA_PROSPECT_STATUTS.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J) return;

  var etat = {
    prospects: [],
    filtreType: '',
    filtreDep: '',
    chargement: false,
    drag: null
  };

  function esc(s) { return J.esc(s); }

  function statuts() {
    return window.MELODIA_PROSPECT_STATUTS || {};
  }

  function normalise(p) { return J.normaliseProspect(p || {}); }

  function libelleStatut(k) {
    var s = statuts()[k];
    return s ? s.label : k;
  }

  function couleurStatut(k) {
    var s = statuts()[k];
    return s ? s.color : '#8e8878';
  }

  function fmtEvent(iso) {
    var d = J.parseDate(iso);
    if (!d) return '';
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'à l’instant';
    if (diff < 3600) return 'il y a ' + Math.floor(diff / 60) + ' min';
    if (diff < 86400) return 'il y a ' + Math.floor(diff / 3600) + ' h';
    return 'il y a ' + Math.floor(diff / 86400) + ' j';
  }

  function dernierEvenement(p) {
    var n = normalise(p);
    if (!n.journal || !n.journal.length) return '';
    var j = n.journal[0];
    if (!j || !j.quoi) return '';
    return String(j.quoi) + (j.le ? ' · ' + fmtEvent(j.le) : '');
  }

  function prochainEvenementLabel(kind) {
    var map = { ouvert: 'Ouvert', clique: 'Cliqué', repondu: 'A répondu' };
    return map[kind] || kind;
  }

  // ─── Vue ─────────────────────────────────────────────────────────────
  function colonneHTML(k, items) {
    var cartes = items.map(carteHTML).join('');
    var potentiel = Math.round(items.reduce(function (acc, p) {
      var proba = { nouveau: 0.05, contacte: 0.10, relance: 0.15, interesse: 0.35, demo_offerte: 0.60, partenaire: 1.0, refus: 0 }[k] || 0;
      var ceremonies = 3; // hypothèse conservatrice (cf. simulateur)
      return acc + ceremonies * 179 * proba;
    }, 0));
    return '' +
      '<div class="jv2-col" data-statut="' + esc(k) + '">' +
        '<header class="jv2-col-tete" style="--statut:' + esc(couleurStatut(k)) + '">' +
          '<span class="jv2-col-titre">' + esc(libelleStatut(k)) + '</span>' +
          '<span class="jv2-col-count mono">' + items.length + '</span>' +
          (potentiel > 0 ? '<span class="jv2-col-potentiel mono" title="Potentiel pondéré">' + potentiel + ' €</span>' : '') +
        '</header>' +
        '<div class="jv2-col-corps" data-statut="' + esc(k) + '">' + cartes + '</div>' +
      '</div>';
  }

  function carteHTML(p) {
    var n = normalise(p);
    var dernier = dernierEvenement(p);
    var score = n._score == null ? '' : '<span class="jv2-score-ring jv2-score-' + (n._score >= 75 ? 'a' : n._score >= 50 ? 'b' : n._score >= 25 ? 'c' : 'd') + '">' + n._score + '</span>';
    return '' +
      '<article class="jv2-carte" draggable="true" data-siret="' + esc(n.siret) + '" tabindex="0">' +
        '<div class="jv2-carte-tete">' +
          '<span class="jv2-carte-nom">' + esc(n.nom || '(sans nom)') + '</span>' +
          score +
        '</div>' +
        '<div class="jv2-carte-ville">' + esc(n.ville || '') + (n.departement ? ' · ' + esc(n.departement) : '') + '</div>' +
        (dernier ? '<div class="jv2-carte-dernier">' + esc(dernier) + '</div>' : '') +
        (n.relance_le ? '<div class="jv2-carte-relance">Relance ' + esc(n.relance_le.slice(0, 10)) + '</div>' : '') +
        '<div class="jv2-carte-chips">' +
          (n.statut === 'contacte' || n.statut === 'relance' ? '<span class="jv2-chip">Séquence</span>' : '') +
        '</div>' +
        '<div class="jv2-carte-menu" hidden role="menu">' +
          Object.keys(statuts()).filter(function (k) { return k !== n.statut; }).map(function (k) {
            return '<button type="button" role="menuitem" data-act="deplacer" data-vers="' + esc(k) + '">' + esc(libelleStatut(k)) + '</button>';
          }).join('') +
        '</div>' +
      '</article>';
  }

  function vueHTML() {
    var st = statuts();
    var colonnes = Object.keys(st).map(function (k) {
      var items = etat.prospects.filter(function (p) { return p.statut === k; });
      return colonneHTML(k, items);
    }).join('');
    return '' +
      '<div class="jv2-pipeline">' +
        '<div class="jv2-pipeline-filtres">' +
          '<select class="field-select" data-filtre="type">' +
            '<option value="">Tous les types</option>' +
            '<option value="funeraire"' + (etat.filtreType === 'funeraire' ? ' selected' : '') + '>Pompes funèbres</option>' +
            '<option value="crematorium"' + (etat.filtreType === 'crematorium' ? ' selected' : '') + '>Crématoriums</option>' +
            '<option value="marbrier"' + (etat.filtreType === 'marbrier' ? ' selected' : '') + '>Marbriers</option>' +
            '<option value="culte"' + (etat.filtreType === 'culte' ? ' selected' : '') + '>Cultes</option>' +
          '</select>' +
          '<input class="field-input" data-filtre="dep" placeholder="Département (ex. 69)" value="' + esc(etat.filtreDep) + '">' +
        '</div>' +
        '<div class="jv2-pipeline-plateau">' + colonnes + '</div>' +
      '</div>';
  }

  // ─── Chargement ──────────────────────────────────────────────────────
  async function charger() {
    var liste = [];
    try {
      if (window.MelodiaProspects && typeof window.MelodiaProspects.mine === 'function') {
        liste = await Promise.resolve(window.MelodiaProspects.mine());
      }
    } catch (_) { liste = []; }
    if (!Array.isArray(liste)) liste = [];
    var out = [];
    for (var i = 0; i < liste.length; i++) {
      var n = normalise(liste[i]);
      if (etat.filtreType && n.type !== etat.filtreType) continue;
      if (etat.filtreDep && n.departement !== etat.filtreDep) continue;
      try {
        var s = await J.score(liste[i]);
        n._score = s.score;
      } catch (_) { n._score = 0; }
      out.push(n);
    }
    etat.prospects = out;
  }

  async function rendre() {
    var cible = document.querySelector('[data-julie-vue="pipeline"]');
    if (!cible) return;
    if (etat.chargement) return;
    etat.chargement = true;
    cible.innerHTML = '<div class="jv2 jv2-chargement">Chargement…</div>';
    try {
      await charger();
      cible.innerHTML = vueHTML();
      brancher(cible);
    } catch (e) {
      cible.innerHTML = '<div class="jv2 jv2-erreur">Erreur : ' + esc(e.message) + '</div>';
    } finally {
      etat.chargement = false;
    }
  }

  // ─── Drag & drop + clavier ───────────────────────────────────────────
  function brancher(cible) {
    // Filtres
    cible.querySelectorAll('[data-filtre]').forEach(function (el) {
      el.addEventListener('change', function () {
        if (el.dataset.filtre === 'type') etat.filtreType = el.value;
        if (el.dataset.filtre === 'dep') etat.filtreDep = el.value.trim();
        rendre();
      });
      if (el.tagName === 'INPUT') {
        var t;
        el.addEventListener('input', function () {
          clearTimeout(t);
          t = setTimeout(function () {
            etat.filtreDep = el.value.trim();
            rendre();
          }, 350);
        });
      }
    });

    // Drag natif (fallback robuste : Pointer Events en plus)
    cible.querySelectorAll('.jv2-carte').forEach(function (carte) {
      carte.addEventListener('dragstart', function (ev) {
        etat.drag = carte.dataset.siret;
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', carte.dataset.siret);
        carte.classList.add('jv2-carte-drag');
      });
      carte.addEventListener('dragend', function () {
        carte.classList.remove('jv2-carte-drag');
        etat.drag = null;
      });
      carte.addEventListener('keydown', function (ev) {
        if (ev.key === 'm' || ev.key === 'M') {
          ev.preventDefault();
          var menu = carte.querySelector('.jv2-carte-menu');
          if (menu) {
            menu.hidden = !menu.hidden;
            if (!menu.hidden) {
              var first = menu.querySelector('button');
              if (first) first.focus();
            }
          }
        }
      });
    });

    cible.querySelectorAll('.jv2-col-corps').forEach(function (col) {
      col.addEventListener('dragover', function (ev) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
        col.classList.add('jv2-col-survol');
      });
      col.addEventListener('dragleave', function () {
        col.classList.remove('jv2-col-survol');
      });
      col.addEventListener('drop', function (ev) {
        ev.preventDefault();
        col.classList.remove('jv2-col-survol');
        var siret = ev.dataTransfer.getData('text/plain') || etat.drag;
        var vers = col.dataset.statut;
        if (siret && vers) deplacer(siret, vers);
      });
    });

    // Menu clavier « Déplacer vers… »
    cible.querySelectorAll('.jv2-carte-menu button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var carte = btn.closest('.jv2-carte');
        var siret = carte.dataset.siret;
        var vers = btn.dataset.vers;
        deplacer(siret, vers);
      });
    });
  }

  async function deplacer(siret, vers) {
    var p = etat.prospects.find(function (x) { return x.siret === siret; });
    if (!p || p.statut === vers) return;
    var ancien = p.statut;
    p.statut = vers;
    // Optimistic UI
    await rendre();
    try {
      if (window.MelodiaProspects && typeof window.MelodiaProspects.enregistrer === 'function') {
        await window.MelodiaProspects.enregistrer(p);
      }
      if (window.MelodiaProspects && typeof window.MelodiaProspects.noter === 'function') {
        await window.MelodiaProspects.noter(siret, 'statut', ancien + ' → ' + vers);
      }
      // Sortie de séquence automatique
      if (['interesse', 'demo_offerte', 'partenaire', 'refus'].indexOf(vers) >= 0) {
        try {
          if (window.MelodiaJulieSequences && window.MelodiaJulieSequences.sortir) {
            await window.MelodiaJulieSequences.sortir(siret, 'statut ' + vers);
          }
        } catch (_) { /* optionnel */ }
      }
      if (window.melodiaToast) window.melodiaToast('Déplacé vers « ' + libelleStatut(vers) + ' ».');
    } catch (e) {
      p.statut = ancien;
      await rendre();
      if (window.melodiaToast) window.melodiaToast('Erreur : ' + e.message);
    }
  }

  window.MelodiaJuliePipeline = {
    vue: function () { return '<div data-julie-vue="pipeline"><div class="jv2 jv2-chargement">Chargement…</div></div>'; },
    brancher: function () { rendre(); },
    rendre: rendre
  };
})();
