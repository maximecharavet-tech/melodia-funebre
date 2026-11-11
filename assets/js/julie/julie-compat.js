/*!
 * julie-compat.js — Console Julie v2 : petites passerelles vers l'existant.
 * Ajoute, sans rien modifier d'auth.js, les deux méthodes attendues par les
 * vues v2 : MelodiaProspects.noter (journal d'un prospect) et
 * MelodiaAuth.quota (compteur du jour lu sur /api/prospect-mail, mode « quota »).
 * Aucune dépendance. License: internal.
 */
(function () {
  'use strict';
  var P = window.MelodiaProspects;
  if (P && typeof P.noter !== 'function') {
    P.noter = async function (siret, quoi, detail) {
      var liste = await P.mine();
      var p = (liste || []).filter(function (x) { return x.siret === siret; })[0];
      if (!p) return null;
      var j = Array.isArray(p.journal) ? p.journal.slice() : [];
      j.unshift({ le: new Date().toISOString(), quoi: String(quoi || ''), detail: String(detail || '') });
      return P.enregistrer(Object.assign({}, p, { journal: j.slice(0, 80) }));
    };
  }
  var A = window.MelodiaAuth;
  var cache = null;
  if (A && typeof A.quota !== 'function') {
    A.quota = async function () {
      if (cache && Date.now() - cache.t < 60000) return cache.q;
      var q = null;
      try {
        var h = window.MelodiaJulie ? window.MelodiaJulie.entetes() : { 'Content-Type': 'application/json' };
        var r = await fetch('/api/prospect-mail', { method: 'POST', headers: h, body: JSON.stringify({ mode: 'quota' }) });
        var d = r.ok ? await r.json() : null;
        var qt = d && d.quota;
        if (qt && typeof qt === 'object') {
          var util = Number(qt.utilise != null ? qt.utilise : (qt.envoyes != null ? qt.envoyes : 0));
          if (qt.illimite || qt.bloque === false) {
            q = { utilise: util, illimite: true, bloque: false, conseil: qt.conseil || '', max: null, restant: null };
          } else {
            var max = Number(qt.max || qt.limite || 30);
            q = { utilise: util, max: max, restant: Math.max(0, max - util) };
          }
        }
      } catch (_) { /* hors ligne : quota par défaut */ }
      cache = { t: Date.now(), q: q };
      return q;
    };
  }
})();
