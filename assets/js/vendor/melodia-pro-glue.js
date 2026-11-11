/*!
 * melodia-pro-glue.js — pont entre melodia_pro.wasm et JavaScript.
 *
 * Le même fichier sert au navigateur (script classique : window.MelodiaProNoyau)
 * et aux fonctions Node (require / import par défaut) : il n'y a qu'une colle,
 * comme il n'y a qu'un noyau. Aucune dépendance. Code maison, sans tiers.
 *
 * ABI : chaque export Rust prend (ptr, len) d'une chaîne JSON et rend un
 * pointeur sur [u32 LE longueur][octets JSON], libéré ici après lecture.
 */
(function (racine) {
  'use strict';

  var EXPORTS = {
    version: 'pro_version',
    qrSvg: 'qr_svg',
    prix: 'prix_calculer',
    promoNormaliser: 'promo_normaliser',
    questionnaireValider: 'questionnaire_valider',
    questionnaireNettoyer: 'questionnaire_nettoyer',
    promptConstruire: 'prompt_construire',
    promptAssainir: 'prompt_assainir',
    statutTransition: 'statut_transition',
    statutSuivants: 'statut_suivants',
    essaiEligibilite: 'essai_eligibilite',
    siretValider: 'siret_valider',
    jetonValider: 'jeton_valider'
  };

  function lier(x) {
    var enc = new TextEncoder();
    var dec = new TextDecoder('utf-8');
    function appeler(nom, charge) {
      var octets = enc.encode(JSON.stringify(charge == null ? {} : charge));
      var ptr = octets.length ? x.alloc(octets.length) : 0;
      if (octets.length && !ptr) throw new Error('noyau : allocation impossible');
      if (octets.length) new Uint8Array(x.memory.buffer).set(octets, ptr);
      var ret = x[nom](ptr, octets.length);
      if (octets.length) x.dealloc(ptr, octets.length);
      if (!ret) throw new Error('noyau : réponse vide');
      var mem = new Uint8Array(x.memory.buffer);
      var n = (mem[ret] | (mem[ret + 1] << 8) | (mem[ret + 2] << 16) | (mem[ret + 3] << 24)) >>> 0;
      var texte = dec.decode(mem.slice(ret + 4, ret + 4 + n));
      x.dealloc(ret, 4 + n);
      return JSON.parse(texte);
    }
    var api = { brut: appeler };
    Object.keys(EXPORTS).forEach(function (k) {
      api[k] = function (charge) { return appeler(EXPORTS[k], charge); };
    });
    return api;
  }

  /** Instancie le noyau depuis des octets (Node) ou une URL (navigateur). */
  function charger(source) {
    var p;
    if (typeof source === 'string') {
      p = fetch(source).then(function (r) {
        if (!r.ok) throw new Error('noyau introuvable (' + r.status + ')');
        return r.arrayBuffer();
      }).then(function (b) { return WebAssembly.instantiate(b, {}); });
    } else {
      p = WebAssembly.instantiate(source, {});
    }
    return p.then(function (r) { return lier(r.instance.exports); });
  }

  var mod = { charger: charger, lier: lier, EXPORTS: EXPORTS };
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else racine.MelodiaProNoyau = mod;
})(typeof self !== 'undefined' ? self : this);
