/*!
 * julie-bridge.js — Console Julie v2 : câblage dans la console existante.
 * Les vues v2 s'inscrivent dans le routeur de commercial.js
 * (window.MelodiaConsole.ajouterVue) : même #view, même en-tête, mêmes
 * boutons .side-item[data-v], même hash. Rien n'est caché ni dupliqué.
 * Raccourcis : G puis J (journée), P (pipeline), C (composer), S (séquences),
 * E (suivi des envois), R (prospects). License: internal.
 */
(function () {
  'use strict';
  var C = window.MelodiaConsole;
  if (!C || !window.MelodiaJulie) return;
  var M = window.MelodiaMotion;

  function brancheur(nomModule, apres) {
    return function () {
      var mod = window[nomModule];
      var h = document.getElementById('view');
      if (!mod) { if (h) h.innerHTML = '<div class="jv2 jv2-erreur">Module ' + nomModule + ' non chargé.</div>'; return; }
      try { if (typeof mod.brancher === 'function') mod.brancher(); else if (typeof mod.rendre === 'function') mod.rendre(); }
      catch (e) { if (h) h.innerHTML = '<div class="jv2 jv2-erreur">Erreur : ' + window.MelodiaJulie.esc(e.message || 'inconnue') + '</div>'; }
      if (apres) apres();
      if (h && M && M.entree) { try { M.entree(h); } catch (_) {} }
    };
  }
  function vueDe(nomModule) {
    return function () { var mod = window[nomModule]; return mod && mod.vue ? mod.vue() : '<div class="jv2 jv2-chargement">Chargement…</div>'; };
  }

  var premiere = true;
  function apresJournee() {
    var cible = document.querySelector('[data-julie-vue="journee"]');
    if (premiere && cible && M && M.arrivee) { premiere = false; try { M.arrivee(cible); } catch (_) {} }
    setTimeout(function () {
      if (!window.MelodiaJulieOnboarding) return;
      var hj = document.querySelector('[data-julie-vue="journee"]');
      if (!hj || !hj.parentNode) return;
      var host = document.getElementById('jv2-onboarding-host');
      if (!host) { host = document.createElement('div'); host.id = 'jv2-onboarding-host'; hj.parentNode.insertBefore(host, hj); }
      window.MelodiaJulieOnboarding.monter(host);
    }, 320);
  }

  var VUES = {
    journee:   ['Aujourd’hui', 'Ma <em>journée</em>', 'MelodiaJulieJournee', apresJournee],
    pipeline:  ['Prospection', 'Mon <em>pipeline</em>', 'MelodiaJuliePipeline'],
    composer:  ['Courriers', 'Composer un <em>courriel</em>', 'MelodiaJulieComposeur'],
    sequences: ['Automatisation', 'Mes <em>séquences</em>', 'MelodiaJulieSequences'],
    suivi:     ['Envois & ouvertures', 'Suivi des <em>envois</em>', 'MelodiaJulieDashboard'],
    import:    ['Portefeuille', 'Import <em>CSV</em>', 'MelodiaJulieCsv']
  };
  Object.keys(VUES).forEach(function (id) {
    var v = VUES[id];
    C.ajouterVue(id, [v[0], v[1], vueDe(v[2]), brancheur(v[2], v[3])]);
  });

  /* Si la console a déjà démarré sur une vue inconnue (hash v2 arrivé avant
     l'inscription), on l'ouvre maintenant. */
  var h = (location.hash || '').replace(/^#/, '').split('?')[0];
  if (VUES[h] && C.demarree && C.courante() !== h && typeof window.go === 'function') window.go(h);

  var tamponG = false, timerG = null;
  var RACC = { j: 'journee', p: 'pipeline', c: 'composer', s: 'sequences', e: 'suivi', r: 'prospects' };
  document.addEventListener('keydown', function (ev) {
    var t = ev.target, tag = (t && t.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var k = String(ev.key || '').toLowerCase();
    if (k === 'g') { tamponG = true; clearTimeout(timerG); timerG = setTimeout(function () { tamponG = false; }, 800); return; }
    if (tamponG && RACC[k] && typeof window.go === 'function') { tamponG = false; window.go(RACC[k]); }
  });

  window.MelodiaJulieBridge = { aller: function (r) { if (typeof window.go === 'function') window.go(r); } };
})();
