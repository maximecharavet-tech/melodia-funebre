/*!
 * julie-core.js — Console Julie v2 : pont entre le wasm et la console.
 *
 * Expose `window.MelodiaJulie` avec :
 *   - les primitives wasm déjà prêtes (score, délivrabilité, CSV, dédoublonnage,
 *     créneau, séquences) ;
 *   - un cache local (localStorage) pour tenir le premier rendu < 1 s même
 *     quand Supabase est lent ;
 *   - des helpers de normalisation (prospect, date, échappement) réutilisés par
 *     les modules de vue (journee, pipeline, sequences, csv, delivrabilite).
 *
 * Ne dépend d'aucun bundler, d'aucun CDN. Chargé après auth.js et avant
 * commercial.js (voir dashboard-commercial.html).
 *
 * License: internal.
 */
(function () {
  'use strict';

  var CLE_CACHE = 'melodia.julie.v2.cache.';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isoParis(d) {
    var date = d instanceof Date ? d : new Date();
    var fmt = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    var parts = {};
    fmt.formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
    return parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute + ':00+01:00';
  }

  function aujourdhuiParis() {
    return isoParis(new Date()).slice(0, 10);
  }

  function parseDate(s) {
    if (!s) return null;
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function joursEntre(a, b) {
    var da = parseDate(a), db = parseDate(b);
    if (!da || !db) return 0;
    return Math.round((db - da) / 86400000);
  }

  function lireCache(cle, defaut) {
    try {
      var s = window.localStorage.getItem(CLE_CACHE + cle);
      if (!s) return defaut;
      return JSON.parse(s);
    } catch (_) { return defaut; }
  }

  function ecrireCache(cle, valeur) {
    try {
      window.localStorage.setItem(CLE_CACHE + cle, JSON.stringify(valeur));
    } catch (_) { /* quota — silencieux */ }
  }

  // ─── Accès aux capacités Supabase (dégradation douce) ─────────────────
  var capsCache = null;
  function caps() {
    if (capsCache) return Promise.resolve(capsCache);
    if (window.MelodiaDB && typeof window.MelodiaDB._caps === 'function') {
      return window.MelodiaDB._caps().then(function (c) {
        capsCache = c || {};
        return capsCache;
      }).catch(function () {
        capsCache = {};
        return capsCache;
      });
    }
    return Promise.resolve({});
  }

  function consoleV2Dispo() {
    return caps().then(function (c) {
      return !!(c && c.console_v2);
    });
  }

  // ─── Avis discret « migration 09 à appliquer » ────────────────────────
  function avisMigration() {
    if (window.__julieAvisMigrationAffiche) return;
    window.__julieAvisMigrationAffiche = true;
    var toast = window.melodiaToast || function (m) { /* console.log */ };
    toast('Suivi avancé : migration 09 à appliquer. La console reste utilisable.');
  }

  // ─── Normalisation des prospects ──────────────────────────────────────
  function normaliseType(t) {
    var s = String(t || '').toLowerCase();
    if (s.indexOf('pompe') >= 0 || s === 'funeraire') return 'funeraire';
    if (s.indexOf('cremat') >= 0 || s.indexOf('crém') >= 0) return 'crematorium';
    if (s.indexOf('marbrier') >= 0 || s.indexOf('marbr') >= 0) return 'marbrier';
    if (s.indexOf('culte') >= 0) return 'culte';
    return s || 'funeraire';
  }

  function normaliseProspect(p) {
    var evenements = [];
    if (Array.isArray(p.journal)) {
      p.journal.forEach(function (j) {
        if (!j || !j.quoi) return;
        var k = String(j.quoi).toLowerCase();
        var kind = '';
        if (k.indexOf('ouvert') >= 0) kind = 'ouvert';
        else if (k.indexOf('cliqu') >= 0) kind = 'clique';
        else if (k.indexOf('repond') >= 0 || k.indexOf('répond') >= 0) kind = 'repondu';
        if (kind) evenements.push({ kind: kind, le: j.le || '' });
      });
    }
    return {
      siret: p.siret || '',
      siren: p.siren || '',
      nom: p.nom || p.enseigne || '',
      type: normaliseType(p.type),
      email: p.email || '',
      tel: p.tel || '',
      site: p.site || '',
      ville: p.ville || '',
      cp: p.cp || '',
      departement: p.departement || (p.cp ? String(p.cp).slice(0, 2) : ''),
      effectif: p.effectif || '',
      etablissements: typeof p.etablissements === 'number' ? p.etablissements : (p.agence ? 2 : null),
      dirigeant: p.dirigeant || '',
      statut: p.statut || 'nouveau',
      oppose: !!p.oppose,
      rejete: !!p.rejete,
      relance_le: p.relance_le || '',
      dernier_contact_le: p.dernier_contact_le || '',
      journal: p.journal || [],
      evenements: evenements,
      score: typeof p.score === 'number' ? p.score : null,
      accroche: p.accroche || ''
    };
  }

  // ─── En-têtes d'appel serveur : la session du collaborateur ───────────
  function entetes() {
    var h = { 'Content-Type': 'application/json' };
    try {
      var s = JSON.parse(window.localStorage.getItem('melodia_session') || 'null');
      if (s && s.access_token) h.Authorization = 'Bearer ' + s.access_token;
    } catch (_) { /* sans session */ }
    return h;
  }

  // ─── API publique ─────────────────────────────────────────────────────
  var MelodiaJulie = {
    version: '2.0.0',
    entetes: entetes,
    esc: esc,
    isoParis: isoParis,
    aujourdhuiParis: aujourdhuiParis,
    parseDate: parseDate,
    joursEntre: joursEntre,
    lireCache: lireCache,
    ecrireCache: ecrireCache,
    caps: caps,
    consoleV2Dispo: consoleV2Dispo,
    avisMigration: avisMigration,
    normaliseProspect: normaliseProspect,
    normaliseType: normaliseType,

    // Échafaudages (chaînés au wasm)
    score: function (p) {
      var w = window.MelodiaJulieWasm;
      if (!w) return Promise.resolve({ score: 0, contributions: [], couleur: 'ash', motif_zero: 'Wasm non chargé' });
      var n = normaliseProspect(p);
      var maintenant = isoParis(new Date());
      return w.scoreProspect({
        type: n.type,
        etablissements: n.etablissements,
        effectif: n.effectif,
        email: n.email,
        site: n.site,
        dirigeant: n.dirigeant,
        departement: n.departement,
        oppose: n.oppose,
        rejete: n.rejete,
        dernier_contact_le: n.dernier_contact_le,
        evenements: n.evenements,
        departements_prioritaires: lireCache('prioritaires', []),
        maintenant_iso: maintenant
      });
    },

    delivrabilite: function (entree) {
      var w = window.MelodiaJulieWasm;
      if (!w) return Promise.resolve({ score: 0, note: 'F', problemes: ['Wasm non chargé'], ok: [] });
      return w.delivrabilite(entree);
    },

    csvParser: function (texte) {
      var w = window.MelodiaJulieWasm;
      if (!w) return Promise.resolve({ entetes: [], lignes: [], separateur: ';' });
      return w.csvParser(texte);
    },

    csvDetecterColonnes: function (entetes) {
      var w = window.MelodiaJulieWasm;
      if (!w) return Promise.resolve({ mapping: {}, colonnes_reconnues: [], colonnes_inconnues: entetes });
      return w.csvDetecterColonnes(entetes);
    },

    similarite: function (a, b) {
      var w = window.MelodiaJulieWasm;
      if (!w) return Promise.resolve({ score: 0, methode: 'indisponible' });
      return w.similarite(a, b);
    },

    domaineSuggere: function (domaine) {
      var w = window.MelodiaJulieWasm;
      if (!w) return Promise.resolve({ suggestion: null });
      return w.domaineSuggere(domaine);
    },

    meilleurCreneau: function (historique) {
      var w = window.MelodiaJulieWasm;
      if (!w) return Promise.resolve({ iso: isoParis(new Date()), motif: 'Wasm non chargé' });
      return w.meilleurCreneau({
        cases: historique || [],
        maintenant: isoParis(new Date()),
        jours_a_essayer: 7
      });
    },

    sequenceProchaineEtape: function (inscription) {
      var w = window.MelodiaJulieWasm;
      if (!w) return Promise.resolve({ terminee: true, motif_sortie: 'Wasm non chargé' });
      return w.sequenceProchaineEtape(inscription);
    },

    joursFeries: function (annee) {
      var w = window.MelodiaJulieWasm;
      if (!w) return Promise.resolve([]);
      return w.joursFeries(annee);
    }
  };

  window.MelodiaJulie = MelodiaJulie;
})();
