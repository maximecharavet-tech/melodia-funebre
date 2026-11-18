/*!
 * julie-actions.js — Console Julie · gestes communs sur une fiche.
 *
 *   modifier(siret, fn)    relit la fiche en base, applique fn, journalise,
 *                          enregistre : jamais d'objet partiel renvoyé en base.
 *   demanderSuite(p, o)    la fenêtre « Et ensuite ? » : date + type d'action,
 *                          obligatoire pour toute fiche ouverte.
 *   ouvrirFiche(siret)     la fiche agence plein écran (#fiche?siret=…).
 *
 * Dépend de : window.MelodiaVente, window.MelodiaProspects, window.MelodiaJulie.
 * License: internal.
 */
(function () {
  'use strict';

  var V = window.MelodiaVente;
  var J = window.MelodiaJulie;
  if (!V || !J) return;
  var esc = J.esc;

  function toast(m) { if (window.melodiaToast) window.melodiaToast(m); }
  function utilisateur() { return (window.MelodiaAuth && window.MelodiaAuth.current()) || {}; }

  function journaliser(p, quoi, detail) {
    var u = utilisateur();
    if (!Array.isArray(p.journal)) p.journal = [];
    p.journal.unshift({ le: new Date().toISOString(), quoi: String(quoi || ''), detail: String(detail || ''), par: u.name || u.email || '' });
    if (p.journal.length > 60) p.journal.length = 60;
  }

  /**
   * fn(p) modifie la fiche en place et peut rendre { quoi, detail } à journaliser.
   * Rend la fiche enregistrée.
   */
  async function modifier(siret, fn, owner) {
    var P = window.MelodiaProspects;
    if (!P) throw new Error('Portefeuille indisponible.');
    var p = await P.une(siret, owner);
    if (!p) throw new Error('Fiche introuvable.');
    var note = fn(p);
    if (note && note.quoi) journaliser(p, note.quoi, note.detail);
    /* relance_le est une date en base : une chaîne vide y serait refusée. */
    if (p.relance_le === '') p.relance_le = null;
    if (p.relance_le !== undefined) p.relance = p.relance_le || null;
    var r = await P.enregistrer(p);
    if (window.MelodiaConsole && window.MelodiaConsole.recharger) {
      try { await window.MelodiaConsole.recharger(); } catch (_) { /* la vue se relira */ }
    }
    return r || p;
  }

  /* ─── « Et ensuite ? » ──────────────────────────────────────────── */
  function suiteHTML(p, o) {
    var auj = V.jourParis();
    var defaut = (o && o.date) || V.plusJoursOuvres(auj, (o && o.jours) || 3);
    var pa = V.lireProchaineAction(p && p.prochaine_action);
    var type = (o && o.type) || pa.type || 'appel';
    return '' +
      '<div class="jv-voile" data-jv-fermer></div>' +
      '<div class="jv-dialogue" role="dialog" aria-modal="true" aria-labelledby="jv-suite-titre">' +
        '<div class="jv-dialogue-sur">' + esc((p && p.nom) || 'Fiche') + '</div>' +
        '<h2 class="jv-dialogue-titre" id="jv-suite-titre">' + esc((o && o.titre) || 'Et ensuite ?') + '</h2>' +
        '<p class="jv-dialogue-note">Aucune fiche ne reste sans prochaine action.</p>' +
        '<form class="jv-suite" novalidate>' +
          '<div class="jv-choix" role="radiogroup" aria-label="Type d’action">' +
            Object.keys(V.TYPES_ACTION).map(function (k) {
              return '<label class="jv-choix-item"><input type="radio" name="type" value="' + k + '"' + (k === type ? ' checked' : '') + '><span>' + esc(V.TYPES_ACTION[k]) + '</span></label>';
            }).join('') +
          '</div>' +
          '<div class="jv-raccourcis">' +
            [[1, 'Demain'], [3, 'Dans 3 jours'], [5, 'Dans une semaine'], [10, 'Dans deux semaines']].map(function (r) {
              return '<button type="button" class="btn btn-ghost btn-sm" data-jv-jours="' + r[0] + '">' + r[1] + '</button>';
            }).join('') +
          '</div>' +
          '<div class="field"><label class="field-label" for="jv-suite-date">Date</label>' +
            '<input class="field-input" type="date" id="jv-suite-date" name="date" min="' + auj + '" value="' + esc(defaut) + '" required></div>' +
          '<div class="field"><label class="field-label" for="jv-suite-texte">Précision (facultatif)</label>' +
            '<input class="field-input" id="jv-suite-texte" name="texte" maxlength="160" value="' + esc((o && o.texte) || pa.texte || '') + '" placeholder="Rappeler après leur réunion d’équipe"></div>' +
          '<p class="jv-erreur" role="alert" hidden></p>' +
          '<div class="jv-dialogue-pied">' +
            (o && o.annulable === false ? '' : '<button type="button" class="btn btn-outline" data-jv-fermer>Annuler</button>') +
            '<button type="submit" class="btn btn-gold">Enregistrer</button>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  /** Rend une promesse { date, type, texte, prochaine_action } ou null si annulé. */
  function demanderSuite(p, o) {
    o = o || {};
    return new Promise(function (resoudre) {
      var hote = document.createElement('div');
      hote.className = 'jv-hote';
      hote.innerHTML = suiteHTML(p, o);
      document.body.appendChild(hote);
      var avant = document.activeElement;
      var form = hote.querySelector('form');
      var champDate = hote.querySelector('#jv-suite-date');
      var err = hote.querySelector('.jv-erreur');
      function fin(v) {
        document.removeEventListener('keydown', touche);
        hote.remove();
        if (avant && avant.focus) { try { avant.focus(); } catch (_) {} }
        resoudre(v);
      }
      function touche(ev) { if (ev.key === 'Escape' && o.annulable !== false) fin(null); }
      document.addEventListener('keydown', touche);
      hote.addEventListener('click', function (ev) {
        var t = ev.target;
        if (t.closest('[data-jv-fermer]') && o.annulable !== false) return fin(null);
        var b = t.closest('[data-jv-jours]');
        if (b) champDate.value = V.plusJoursOuvres(V.jourParis(), Number(b.dataset.jvJours));
      });
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var type = (form.querySelector('input[name="type"]:checked') || {}).value;
        var r = { date: champDate.value, type: type, texte: form.texte.value };
        var v = V.validerProchaineAction({ date: r.date, type: r.type, aujourdhui: V.jourParis() });
        if (!v.ok) { err.textContent = v.erreur; err.hidden = false; return; }
        r.prochaine_action = V.ecrireProchaineAction(r.type, r.texte);
        fin(r);
      });
      setTimeout(function () { var x = hote.querySelector('input[name="type"]:checked'); if (x) x.focus(); }, 30);
    });
  }

  /** Change le statut d'une fiche en exigeant la suite (sauf « Sans suite »). Rend true si enregistré. */
  async function changerStatut(siret, vers, owner) {
    var P = window.MelodiaProspects;
    var p = P ? await P.une(siret, owner) : null;
    if (!p) { toast('Fiche introuvable.'); return false; }
    if (p.statut === vers) return false;
    var ST = window.MELODIA_PROSPECT_STATUTS || {};
    var suite = null;
    if (vers !== 'refus') {
      suite = await demanderSuite(p, { titre: 'Passer en « ' + ((ST[vers] || {}).label || vers) + ' » : et ensuite ?', jours: vers === 'interesse' ? 2 : 3 });
      if (!suite) return false;
    }
    var ancien = p.statut;
    await modifier(siret, function (f) {
      f.statut = vers;
      if (suite) { f.relance_le = suite.date; f.prochaine_action = suite.prochaine_action; }
      else { f.relance_le = ''; f.prochaine_action = ''; }
      return { quoi: 'Statut : ' + ((ST[vers] || {}).label || vers), detail: ((ST[ancien] || {}).label || ancien) + ' → ' + ((ST[vers] || {}).label || vers) +
        (suite ? ' · ensuite : ' + V.libelleAction(suite.type) + ' le ' + suite.date : '') };
    }, p.owner);
    if (['interesse', 'demo_offerte', 'partenaire', 'activee', 'refus'].indexOf(vers) >= 0 && window.MelodiaJulieSequences && window.MelodiaJulieSequences.sortir) {
      try { await window.MelodiaJulieSequences.sortir(siret, 'statut ' + vers); } catch (_) { /* facultatif */ }
    }
    return true;
  }

  /** Pose (ou change) la prochaine action d'une fiche. */
  async function poserSuite(siret, owner) {
    var P = window.MelodiaProspects;
    var p = P ? await P.une(siret, owner) : null;
    if (!p) { toast('Fiche introuvable.'); return false; }
    var suite = await demanderSuite(p, {});
    if (!suite) return false;
    await modifier(siret, function (f) {
      f.relance_le = suite.date; f.prochaine_action = suite.prochaine_action;
      return { quoi: 'Prochaine action', detail: V.libelleAction(suite.type) + ' le ' + suite.date + (suite.texte ? ' — ' + suite.texte : '') };
    }, p.owner);
    return true;
  }

  function ouvrirFiche(siret) {
    if (window.MelodiaJulieFiche && window.MelodiaJulieFiche.ouvrir) return window.MelodiaJulieFiche.ouvrir(siret);
    window.location.hash = '#fiche?siret=' + encodeURIComponent(siret);
  }

  window.MelodiaJulieActions = {
    modifier: modifier,
    journaliser: journaliser,
    demanderSuite: demanderSuite,
    changerStatut: changerStatut,
    poserSuite: poserSuite,
    ouvrirFiche: ouvrirFiche
  };
})();
