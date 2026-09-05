/* ═══════════════════════════════════════════════════════════════
   courrier.js — Le côté navigateur des courriels adressés à la famille

   Un seul point de passage vers /api/famille, pour trois raisons :

   1. Un envoi ne doit JAMAIS faire échouer l'action qui le déclenche.
      Une commande enregistrée reste enregistrée même si son accusé de
      réception se perd ; un statut passé à « livrée » reste passé même
      si la boîte de la famille refuse le message. D'où une promesse
      qui ne se rejette pas.
   2. Le point d'entrée répond 503 tant que Resend n'est pas branché.
      C'est normal, ce n'est pas une erreur à afficher au visiteur.
   3. Le navigateur n'envoie jamais de texte : il choisit un modèle et
      passe des données. Le message est écrit côté serveur.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function envoyer(type, donnees) {
    var d = donnees || {};
    if (!d.email) return Promise.resolve({ ok: false, code: 'NO_EMAIL' });

    return fetch('/api/famille', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        email: d.email, nom: d.nom, defunt: d.defunt, ref: d.ref,
        offre: d.offre, moment: d.moment, urgence: !!d.urgence, lien: d.lien
      })
    }).then(function (r) {
      return r.json().then(function (j) { return j; }, function () { return {}; })
        .then(function (j) {
          if (!r.ok) {
            /* Tracé en console pour le fondateur, muet pour le visiteur :
               il n'a pas à savoir qu'une variable manque chez Vercel. */
            if (window.console) console.warn('[courrier] ' + type + ' non envoyé —', j.code || r.status, j.motif || j.error || '');
            return { ok: false, code: j.code || String(r.status) };
          }
          return { ok: true, id: j.id || null };
        });
    }).catch(function (e) {
      if (window.console) console.warn('[courrier] ' + type + ' — réseau indisponible', e && e.message);
      return { ok: false, code: 'FETCH_FAILED' };
    });
  }

  window.MelodiaCourrier = {
    /** Accusé de commande, envoyé à la famille juste après l'enregistrement */
    confirmation: function (d) { return envoyer('confirmation', d); },
    /** Accusé de demande de rappel */
    rappel: function (d) { return envoyer('rappel', d); },
    /** Suit l'avancement : brief → composition → livraison */
    etape: function (statut, d) {
      var m = { brief: 'brief', composition: 'composition', livree: 'livraison' }[statut];
      return m ? envoyer(m, d) : Promise.resolve({ ok: false, code: 'NO_TEMPLATE' });
    }
  };
})();
