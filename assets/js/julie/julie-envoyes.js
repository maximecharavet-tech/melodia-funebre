/*!
 * julie-envoyes.js — Console Julie · « Mails envoyés ».
 *
 * L'historique complet des courriels partis de la console (journal
 * envois_prospect, mode `journal` de /api/prospect-mail), le plus récent
 * en tête : date, destinataire, objet, statut, ouvertures et clics.
 * Une entrée directe du menu, pour ne plus avoir à le chercher au bas de
 * « Mail prêt à envoyer » ou derrière les graphiques du « Suivi des envois ».
 *
 * Dépend de : MelodiaJulie (esc, entetes), MelodiaConsole.
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J || !window.MelodiaConsole) return;
  var esc = J.esc;
  var etat = { lignes: null, note: '', filtre: '' };

  var STATUTS = {
    envoye: 'Envoyé', delivre: 'Délivré', ouvert: 'Ouvert', clique: 'Cliqué',
    rejete: 'Rejeté', plainte: 'Signalé', differe: 'Différé', reserve: 'En cours',
    incertain: 'À vérifier'
  };
  function statut(s) { return STATUTS[s] || s || '—'; }
  function quand(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return String(iso); }
  }

  function charger() {
    return fetch('/api/prospect-mail', {
      method: 'POST',
      headers: J.entetes(),
      credentials: 'same-origin',
      body: JSON.stringify({ mode: 'journal', limite: 500 })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { etat.lignes = []; etat.note = (d && d.error) || 'Historique indisponible pour le moment.'; return; }
        etat.lignes = Array.isArray(d.lignes) ? d.lignes : [];
        etat.note = d.note || '';
      });
    }).catch(function () { etat.lignes = []; etat.note = 'Historique indisponible (réseau).'; });
  }

  function filtrees() {
    var f = etat.filtre.trim().toLowerCase();
    if (!f) return etat.lignes || [];
    return (etat.lignes || []).filter(function (l) {
      return [l.destinataire, l.societe, l.sujet, l.modele, statut(l.statut)].join(' ').toLowerCase().indexOf(f) !== -1;
    });
  }

  function corps() {
    if (etat.lignes === null) return '<p class="col-aide">Chargement de l’historique…</p>';
    var l = filtrees();
    var tous = etat.lignes.length;
    var ouverts = etat.lignes.filter(function (x) { return x.ouvert_nb > 0 || x.statut === 'ouvert' || x.statut === 'clique'; }).length;
    var tete = '<p class="col-aide" id="envoyes-compte">' +
      (tous ? tous + ' courriel' + (tous > 1 ? 's' : '') + ' envoyé' + (tous > 1 ? 's' : '') + ' · ' + ouverts + ' ouvert' + (ouverts > 1 ? 's' : '') +
        (etat.filtre ? ' · ' + l.length + ' affiché' + (l.length > 1 ? 's' : '') : '') : (etat.note || 'Aucun envoi enregistré pour le moment.')) +
      (tous && etat.note ? ' · ' + esc(etat.note) : '') + '</p>';
    if (!l.length) return tete;
    return tete + '<div class="col-suivi-table-wrap"><table class="col-suivi-table" id="envoyes-table"><thead><tr>' +
      '<th>Envoyé le</th><th>Destinataire</th><th>Objet</th><th>Statut</th></tr></thead><tbody>' +
      l.map(function (x) {
        return '<tr><td>' + esc(quand(x.envoye_le)) + '</td><td>' + esc(x.destinataire || '') +
          (x.societe ? '<br><span class="col-opt">' + esc(x.societe) + '</span>' : '') + '</td><td>' +
          esc(x.sujet || x.modele || '') + (x.piece_jointe ? '<br><span class="col-opt">PJ : ' + esc(x.piece_jointe) + '</span>' : '') +
          '</td><td><span class="col-statut col-statut-' + esc(x.statut || 'envoye') + '">' + esc(statut(x.statut)) +
          (x.ouvert_nb ? ' · ' + x.ouvert_nb + ' ouv.' : '') + (x.clique_nb ? ' · ' + x.clique_nb + ' clic' + (x.clique_nb > 1 ? 's' : '') : '') +
          '</span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function vue() {
    return '<div class="jv" data-julie-vue="envoyes"><section class="panel">' +
      '<div style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center;margin-bottom:.4rem;">' +
        '<input class="field-input" type="search" id="envoyes-filtre" placeholder="Chercher un destinataire, une agence, un objet…" style="flex:1;min-width:220px;" value="' + esc(etat.filtre) + '">' +
        '<button class="btn btn-outline btn-sm" type="button" id="envoyes-relire">Actualiser</button>' +
      '</div><div id="envoyes-corps">' + corps() + '</div></section></div>';
  }

  function redessiner() {
    var z = document.getElementById('envoyes-corps');
    if (z) z.innerHTML = corps();
  }

  function brancher() {
    var f = document.getElementById('envoyes-filtre');
    if (f) f.addEventListener('input', function () { etat.filtre = f.value; redessiner(); });
    var b = document.getElementById('envoyes-relire');
    if (b) b.addEventListener('click', function () { etat.lignes = null; redessiner(); charger().then(redessiner); });
    if (etat.lignes === null) charger().then(redessiner);
  }

  window.MelodiaJulieEnvoyes = { recharger: function () { etat.lignes = null; return charger(); } };
  window.MelodiaConsole.ajouterVue('envoyes', ['Aujourd’hui', 'Mails <em>envoyés</em>', function () { etat.lignes = null; return vue(); }, brancher]);
  var hv = (location.hash || '').replace(/^#/, '').split('?')[0];
  if (hv === 'envoyes' && window.MelodiaConsole.demarree && window.MelodiaConsole.courante() !== hv && typeof window.go === 'function') window.go(hv);
})();
