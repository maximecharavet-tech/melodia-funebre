/*!
 * julie-wasm-glue.js — Console Julie v2
 *
 * Petit pont JavaScript (aucune dépendance, aucun bundler) entre le fichier
 * `julie_v2.wasm` (crate Rust `console-julie-wasm`, voir console-julie-wasm/BUILD.md)
 * et la console Melodia. Expose `window.MelodiaJulieWasm` avec des méthodes
 * asynchrones nommées : `scoreProspect`, `delivrabilite`, `csvParser`,
 * `csvDetecterColonnes`, `similarite`, `dedupeCle`, `domaineSuggere`,
 * `meilleurCreneau`, `sequenceProchaineEtape`, `joursFeries`.
 *
 * ABI : chaque export Rust prend (ptr, len) et retourne un pointeur sur
 * `[u32 LE len][bytes UTF-8 JSON]`. Ce glue alloue, écrit, appelle, lit, libère.
 *
 * Chargement paresseux : on n'instancie le module qu'au premier usage. Le fichier
 * `.wasm` est `fetch`é une seule fois puis mis en cache par le navigateur.
 * Respecte la CSP `script-src 'self'` : le `.wasm` est servi par le même origine.
 *
 * License: internal, no third-party code.
 */
(function () {
  'use strict';

  var WASM_URL = '/assets/js/vendor/julie_v2.wasm';
  var instPromise = null;
  var exportsRef = null;

  function enc(str) {
    return new TextEncoder().encode(str);
  }

  function dec(bytes) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  function lireRetour(ptr, exports) {
    if (!ptr) {
      throw new Error('julie-wasm: pointeur nul');
    }
    var memory = new Uint8Array(exports.memory.buffer);
    var lenBytes = memory.subarray(ptr, ptr + 4);
    var len = lenBytes[0] | (lenBytes[1] << 8) | (lenBytes[2] << 16) | (lenBytes[3] << 24);
    len = len >>> 0;
    var data = memory.slice(ptr + 4, ptr + 4 + len);
    try {
      exports.dealloc(ptr, 4 + len);
    } catch (_) { /* ignore */ }
    return dec(data);
  }

  function appelle(nomExport, payload) {
    if (!exportsRef) {
      throw new Error('julie-wasm: module non chargé');
    }
    var input = JSON.stringify(payload == null ? {} : payload);
    var bytes = enc(input);
    var ptr = exportsRef.alloc(bytes.length);
    if (!ptr) {
      throw new Error('julie-wasm: alloc a échoué');
    }
    var memory = new Uint8Array(exportsRef.memory.buffer);
    memory.set(bytes, ptr);
    var outPtr;
    try {
      outPtr = exportsRef[nomExport](ptr, bytes.length);
    } finally {
      try { exportsRef.dealloc(ptr, bytes.length); } catch (_) { /* ignore */ }
    }
    var json = lireRetour(outPtr, exportsRef);
    return JSON.parse(json);
  }

  function charger() {
    if (instPromise) {
      return instPromise;
    }
    instPromise = fetch(WASM_URL, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('julie-wasm: HTTP ' + res.status);
        }
        return res.arrayBuffer();
      })
      .then(function (buf) {
        return WebAssembly.instantiate(buf, {});
      })
      .then(function (result) {
        var exports = (result.instance && result.instance.exports) || result.exports;
        exportsRef = exports;
        return exports;
      });
    return instPromise;
  }

  function pret() {
    return !!exportsRef;
  }

  /* Repli : si le wasm ne se charge pas (ou lève), le même calcul passe par
     julie-fallback.js (JavaScript pur). La console ne casse jamais. */
  var repli = false;
  function avec(fn, nom, payload) {
    var F = window.MelodiaJulieFallback;
    function viaRepli(err) {
      if (F && typeof F[nom] === 'function') { repli = true; return F[nom](payload); }
      throw err;
    }
    return charger().then(function () {
      try { return fn(); } catch (e) { return viaRepli(e); }
    }, viaRepli);
  }

  var API = {
    pret: pret,
    enRepli: function () { return repli; },
    charger: charger,

    scoreProspect: function (p) {
      return avec(function () { return appelle('score_prospect', p); }, 'score_prospect', p);
    },
    delivrabilite: function (e) {
      return avec(function () { return appelle('delivrabilite_verifier', e); }, 'delivrabilite_verifier', e);
    },
    csvParser: function (texte) {
      return avec(function () { return appelle('csv_parser', { texte: texte }); }, 'csv_parser', { texte: texte });
    },
    csvDetecterColonnes: function (entetes) {
      return avec(function () { return appelle('csv_detecter_colonnes', entetes); }, 'csv_detecter_colonnes', entetes);
    },
    similarite: function (a, b) {
      return avec(function () { return appelle('similarite', { a: a, b: b }); }, 'similarite', { a: a, b: b });
    },
    dedupeCle: function (o) {
      return avec(function () { return appelle('dedupe_cle', o); }, 'dedupe_cle', o);
    },
    /* Clé d'idempotence d'un envoi : la même que celle du serveur. */
    envoiCle: function (o) {
      return avec(function () { return appelle('envoi_cle', o); }, 'envoi_cle', o);
    },
    /* Fenêtre de 60 jours d'un précédent envoi : { bloque, renvoi_ms, jours_restants }. */
    envoiFenetre: function (o) {
      return avec(function () { return appelle('envoi_fenetre', o); }, 'envoi_fenetre', o);
    },
    domaineSuggere: function (domaine) {
      return avec(function () { return appelle('domaine_suggere', { domaine: domaine }); }, 'domaine_suggere', { domaine: domaine });
    },
    meilleurCreneau: function (o) {
      return avec(function () { return appelle('meilleur_creneau', o); }, 'meilleur_creneau', o);
    },
    sequenceProchaineEtape: function (o) {
      return avec(function () { return appelle('sequence_prochaine_etape', o); }, 'sequence_prochaine_etape', o);
    },
    joursFeries: function (annee) {
      return avec(function () { return appelle('jours_feries_annee', { annee: annee }); }, 'jours_feries_annee', { annee: annee });
    }
  };

  window.MelodiaJulieWasm = API;

  // Préchargement opportuniste : sans bloquer le premier rendu.
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(function () { charger().catch(function () {}); }, { timeout: 2500 });
  } else {
    window.setTimeout(function () { charger().catch(function () {}); }, 1500);
  }
})();
