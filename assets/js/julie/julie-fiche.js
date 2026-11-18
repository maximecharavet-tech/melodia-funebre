/*!
 * julie-fiche.js — Console Julie · la fiche agence plein écran (#fiche?siret=…).
 *
 * Tout le contexte d'une agence en une page, sur ordinateur comme sur
 * téléphone : coordonnées, statut, prochaine action, rappels liés, et une
 * chronologie unique (journal de la fiche + courriels envoyés).
 * Actions : mode appel, écrire, proposition PDF, prochaine action, statut.
 *
 * Dépend de : MelodiaVente, MelodiaJulie, MelodiaJulieActions.
 * License: internal.
 */
(function () {
  'use strict';

  var V = window.MelodiaVente;
  var J = window.MelodiaJulie;
  var A = window.MelodiaJulieActions;
  if (!V || !J || !A) return;
  var esc = J.esc;

  var etat = { siret: '', envois: null, taches: null };

  function toast(m) { if (window.melodiaToast) window.melodiaToast(m); }
  function siretDuHash() {
    var m = /[?&]siret=([^&]+)/.exec(location.hash || '');
    return m ? decodeURIComponent(m[1]) : '';
  }
  function prospects() { return window.MelodiaConsole ? window.MelodiaConsole.prospects() : []; }
  function trouver(siret) { return prospects().filter(function (p) { return p.siret === siret; })[0] || null; }
  function joli(d, avecHeure) {
    var x = new Date(d);
    if (isNaN(x)) return '';
    var o = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' };
    if (avecHeure) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return new Intl.DateTimeFormat('fr-FR', o).format(x);
  }
  function joliJour(j) {
    if (!j) return '';
    var d = new Date(String(j).slice(0, 10) + 'T12:00:00Z');
    return isNaN(d) ? j : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(d);
  }
  var TYPES = { funeraire: 'Pompes funèbres', crematorium: 'Crématorium', marbrier: 'Marbrier', culte: 'Lieu de culte', fleuriste: 'Fleuriste' };

  function ouvrir(siret) {
    etat.siret = siret;
    etat.envois = null;
    etat.taches = null;
    try { history.replaceState(null, '', '#fiche?siret=' + encodeURIComponent(siret)); } catch (e) { location.hash = '#fiche?siret=' + encodeURIComponent(siret); }
    if (typeof window.go === 'function') window.go('fiche');
  }

  function vue() {
    var siret = siretDuHash() || etat.siret;
    etat.siret = siret;
    var p = trouver(siret);
    if (!p) {
      return '<div class="jv" data-julie-vue="fiche"><section class="panel jv-panel"><p class="col-vide">Fiche introuvable dans votre portefeuille.</p>' +
        '<button type="button" class="btn btn-outline btn-sm" data-jv-retour>Retour aux prospects</button></section></div>';
    }
    var ST = window.MELODIA_PROSPECT_STATUTS || {};
    var s = ST[p.statut] || { label: p.statut, color: '#8e8878' };
    var pa = V.lireProchaineAction(p.prochaine_action);
    var auj = V.jourParis();
    var r = String(p.relance_le || '').slice(0, 10);
    var sans = V.sansProchaineAction(p, auj);
    var tel = String(p.tel || '').replace(/[^\d+]/g, '');
    var adresse = [p.adresse, p.cp, p.ville].filter(Boolean).join(', ');
    var carte = adresse ? 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(adresse) : '';

    return '' +
      '<div class="jv jv-fiche" data-julie-vue="fiche" data-siret="' + esc(p.siret) + '">' +
        '<header class="jv-fiche-tete">' +
          '<button type="button" class="jv-lien" data-jv-retour>← Mes prospects</button>' +
          '<h2 class="jv-fiche-nom">' + esc(p.nom || p.enseigne || 'Agence') + '</h2>' +
          '<div class="jv-fiche-meta">' + esc([TYPES[p.type] || '', p.ville, p.dirigeant].filter(Boolean).join(' · ')) + '</div>' +
          '<div class="jv-fiche-etat">' +
            '<span class="pill" style="color:' + esc(s.color) + ';border-color:' + esc(s.color) + '55;">' + esc(s.label) + '</span>' +
            (p.oppose ? '<span class="pill jv-pill-stop">Opposition : ne plus contacter</span>' : '') +
          '</div>' +
        '</header>' +
        (function () {
          var ec = V.derniereEcoute(p, auj);
          return ec ? '<p class="jv-ecoute' + (ec.jours <= 2 ? ' est-recente' : '') + '">♪ ' + esc(ec.phrase) +
            (V.ecoutes(p).length > 1 ? ' · ' + V.ecoutes(p).length + ' écoutes en tout' : '') + '</p>' : '';
        })() +

        '<section class="jv-suite-bloc' + (sans ? ' est-manquante' : '') + '">' +
          '<div><div class="jv-appel-h">Prochaine action</div>' +
            (V.estClose(p) ? '<p>Fiche close.</p>' :
              (r ? '<p><b>' + esc(V.libelleAction(pa.type || 'appel')) + '</b> le ' + esc(joliJour(r)) + (pa.texte ? ' — ' + esc(pa.texte) : '') +
                (r < auj ? ' <span class="jv-retard">en retard</span>' : '') + '</p>'
                 : '<p class="jv-retard">Aucune prochaine action : à fixer maintenant.</p>')) +
          '</div>' +
          (V.estClose(p) ? '' : '<button type="button" class="btn btn-outline btn-sm" data-jv-suite>' + (r ? 'Changer' : 'Fixer la suite') + '</button>') +
        '</section>' +

        '<div class="jv-fiche-actions">' +
          (p.oppose ? '' : '<button type="button" class="btn btn-gold" data-jv-mode-appel' + (tel ? '' : ' title="Numéro à compléter"') + '>Mode appel</button>') +
          (p.oppose || !p.email ? '' : '<button type="button" class="btn btn-outline" data-jv-ecrire>Écrire</button>') +
          '<button type="button" class="btn btn-outline" data-jv-proposition>Proposition PDF</button>' +
          (tel ? '<a class="btn btn-ghost" href="tel:' + esc(tel) + '">' + esc(p.tel) + '</a>' : '') +
        '</div>' +

        '<div class="jv-fiche-grille">' +
          '<section class="panel jv-panel"><h3 class="panel-title">Coordonnées</h3>' +
            '<dl class="jv-dl">' +
              '<div><dt>Courriel</dt><dd>' + (p.email ? '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' : '<span class="jv-manque">à trouver</span>') + '</dd></div>' +
              '<div><dt>Téléphone</dt><dd>' + (p.tel ? esc(p.tel) : '<span class="jv-manque">à trouver</span>') + '</dd></div>' +
              '<div><dt>Interlocuteur</dt><dd>' + (p.dirigeant ? esc(p.dirigeant) : '<span class="jv-manque">à trouver</span>') + '</dd></div>' +
              '<div><dt>Adresse</dt><dd>' + (adresse ? esc(adresse) + ' · <a href="' + esc(carte) + '" target="_blank" rel="noopener noreferrer">itinéraire ↗</a>' : '—') + '</dd></div>' +
              (p.site ? '<div><dt>Site</dt><dd><a href="' + esc(/^https?:/i.test(p.site) ? p.site : 'https://' + p.site) + '" target="_blank" rel="noopener noreferrer">' + esc(p.site) + ' ↗</a></dd></div>' : '') +
              '<div><dt>SIRET</dt><dd class="mono">' + esc(p.siret) + '</dd></div>' +
            '</dl>' +
            '<div class="field" style="margin-top:1rem;"><label class="field-label" for="jv-statut">Statut</label>' +
              '<select class="field-select" id="jv-statut">' + Object.keys(ST).map(function (k) {
                return '<option value="' + esc(k) + '"' + (k === p.statut ? ' selected' : '') + '>' + esc(ST[k].label) + '</option>';
              }).join('') + '</select></div>' +
            (p.notes ? '<div class="jv-notes"><div class="jv-appel-h">Notes</div><p>' + esc(p.notes).replace(/\n/g, '<br>') + '</p></div>' : '') +
          '</section>' +
          '<section class="panel jv-panel"><h3 class="panel-title">Historique</h3>' +
            '<div id="jv-chrono"><p class="col-vide">Chargement…</p></div>' +
            '<div id="jv-fiche-taches"></div>' +
          '</section>' +
        '</div>' +
      '</div>';
  }

  function chronoHTML(p) {
    var lignes = V.chronologie(p, etat.envois || []);
    if (!lignes.length) return '<p class="col-vide">Aucun échange noté pour l’instant.</p>';
    return '<ol class="jv-chrono">' + lignes.slice(0, 40).map(function (l) {
      return '<li class="jv-chrono-' + esc(l.genre) + '"><time datetime="' + esc(l.le) + '">' + esc(joli(l.le, true)) + '</time>' +
        '<div><b>' + esc(l.quoi) + '</b>' + (l.detail ? ' — ' + esc(l.detail) : '') +
        (window.MelodiaConsole && window.MelodiaConsole.estMaitre && l.par ? ' <span class="jv-par">· ' + esc(l.par) + '</span>' : '') + '</div></li>';
    }).join('') + '</ol>';
  }

  async function chargerEnvois() {
    try {
      var r = await fetch('/api/prospect-mail', { method: 'POST', headers: J.entetes(), credentials: 'same-origin', body: JSON.stringify({ mode: 'journal' }) });
      if (!r.ok) return [];
      var d = await r.json();
      return Array.isArray(d.lignes) ? d.lignes : [];
    } catch (e) { return []; }
  }

  async function completer(h, p) {
    var envois = await chargerEnvois();
    if (!h.isConnected) return;
    etat.envois = envois;
    var c = h.querySelector('#jv-chrono');
    if (c) c.innerHTML = chronoHTML(p);
    if (window.MelodiaJulieTaches) {
      try {
        var t = (await window.MelodiaJulieTaches.lister()).filter(function (x) { return x.prospect_siret === p.siret; });
        var z = h.querySelector('#jv-fiche-taches');
        if (z && t.length) {
          z.innerHTML = '<div class="jv-appel-h" style="margin-top:1rem;">Rappels liés</div><ul class="jv-taches">' + t.map(function (x) {
            return '<li class="jv-tache"><div class="jv-tache-corps"><div class="jv-tache-texte">' + esc(x.texte) + '</div><div class="jv-tache-meta">' + esc(x.jour) + '</div></div></li>';
          }).join('') + '</ul>';
        }
      } catch (e) { /* rappels facultatifs ici */ }
    }
  }

  function brancher() {
    var h = document.querySelector('[data-julie-vue="fiche"]');
    if (!h) return;
    var p = trouver(etat.siret);
    if (p) completer(h, p);
    h.addEventListener('click', async function (ev) {
      var t = ev.target;
      if (t.closest('[data-jv-retour]')) { if (typeof window.go === 'function') window.go('prospects'); return; }
      if (!p) return;
      if (t.closest('[data-jv-mode-appel]')) { if (window.MelodiaJulieAppel) window.MelodiaJulieAppel.ouvrir(p.siret, p.owner); return; }
      if (t.closest('[data-jv-ecrire]')) { if (typeof window.ouvrirPret === 'function') window.ouvrirPret(p.siret); return; }
      if (t.closest('[data-jv-proposition]')) { if (window.MelodiaJulieProposition) window.MelodiaJulieProposition.ouvrir(p.siret, p.owner); return; }
      if (t.closest('[data-jv-suite]')) {
        try { if (await A.poserSuite(p.siret, p.owner)) { toast('Prochaine action enregistrée.'); ouvrir(p.siret); } }
        catch (e) { toast('Non enregistré : ' + (e.message || 'erreur')); }
      }
    });
    var sel = h.querySelector('#jv-statut');
    if (sel && p) sel.addEventListener('change', async function () {
      var vers = sel.value;
      try {
        var ok = await A.changerStatut(p.siret, vers, p.owner);
        if (!ok) { sel.value = p.statut; return; }
        toast('Statut enregistré.');
        ouvrir(p.siret);
      } catch (e) { sel.value = p.statut; toast('Statut non enregistré : ' + (e.message || 'erreur')); }
    });
  }

  window.MelodiaJulieFiche = { ouvrir: ouvrir, vue: vue, brancher: brancher };

  if (window.MelodiaConsole) {
    window.MelodiaConsole.ajouterVue('fiche', ['Prospects', 'Fiche <em>agence</em>', vue, brancher]);
    /* Console déjà démarrée sur ce hash avant l'inscription : on l'ouvre maintenant. */
    var hv = (location.hash || '').replace(/^#/, '').split('?')[0];
    if (hv === 'fiche' && window.MelodiaConsole.demarree && window.MelodiaConsole.courante() !== hv && typeof window.go === 'function') window.go(hv);
  }
})();
