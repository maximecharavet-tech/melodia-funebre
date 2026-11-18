/*!
 * julie-appel.js — Console Julie · mode appel (téléphone d'abord).
 *
 * Plein écran sur téléphone, panneau latéral sur ordinateur :
 *   - le numéro en gros (lien tel:), l'interlocuteur, la dernière note ;
 *   - le script en points de passage, repliables ;
 *   - les objections en pastilles : une touche montre la réponse ;
 *   - cinq issues en un geste. Chaque issue écrit le journal, avance le
 *     statut si besoin et pose la prochaine action (date proposée, modifiable).
 *     « Ne plus contacter » pose l'opposition, comme le bouton STOP.
 *
 * Et la vue « À appeler » : les fiches dues aujourd'hui, avec un téléphone.
 *
 * Dépend de : MelodiaVente, MelodiaJulie, MelodiaJulieActions, MELODIA_VENTE.
 * License: internal.
 */
(function () {
  'use strict';

  var V = window.MelodiaVente;
  var J = window.MelodiaJulie;
  var A = window.MelodiaJulieActions;
  if (!V || !J || !A) return;
  var esc = J.esc;

  function toast(m) { if (window.melodiaToast) window.melodiaToast(m); }
  function contenu() { return window.MELODIA_VENTE || {}; }
  function telPropre(t) { return String(t || '').replace(/[^\d+]/g, ''); }
  function joliJour(j) {
    if (!j) return '';
    var d = new Date(String(j).slice(0, 10) + 'T12:00:00Z');
    return isNaN(d) ? j : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(d);
  }

  var etat = { p: null, hote: null, avant: null };

  function objectionsDe(p) {
    var C = contenu();
    var l = (p && p.type === 'culte' && Array.isArray(C.OBJECTIONS_CULTE) && C.OBJECTIONS_CULTE.length) ? C.OBJECTIONS_CULTE : (C.OBJECTIONS || []);
    return l.filter(function (o) { return o && o.objection; });
  }

  function scriptHTML() {
    var S = (contenu().SCRIPT || []).filter(function (e) { return e && e.titre; }).slice(0, 6);
    if (!S.length) return '';
    return '<section class="jv-appel-bloc"><h3 class="jv-appel-h">Le fil de l’appel</h3>' +
      S.map(function (e, i) {
        return '<details class="jv-etape"' + (i === 1 ? ' open' : '') + '><summary><span>' + esc(e.titre) + '</span>' +
          (e.duree ? '<span class="jv-etape-duree">' + esc(e.duree) + '</span>' : '') + '</summary>' +
          (e.dire ? '<p class="jv-dire">' + esc(e.dire) + '</p>' : '') +
          (Array.isArray(e.points) && e.points.length ? '<ul>' + e.points.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        '</details>';
      }).join('') + '</section>';
  }

  function objectionsHTML(p) {
    var O = objectionsDe(p);
    if (!O.length) return '';
    return '<section class="jv-appel-bloc"><h3 class="jv-appel-h">S’ils disent…</h3>' +
      '<div class="jv-pastilles">' + O.map(function (o, i) {
        return '<button type="button" class="jv-pastille" data-jv-obj="' + i + '" aria-expanded="false">' + esc(o.objection) + '</button>';
      }).join('') + '</div>' +
      '<div class="jv-reponse" id="jv-reponse" aria-live="polite" hidden></div></section>';
  }

  function panneauHTML(p) {
    var pa = V.lireProchaineAction(p.prochaine_action);
    var derniere = (Array.isArray(p.journal) ? p.journal : []).filter(function (j) { return j && (j.detail || j.quoi); })[0];
    var tel = telPropre(p.tel);
    return '' +
      '<div class="jv-voile" data-jv-fermer></div>' +
      '<aside class="jv-appel" role="dialog" aria-modal="true" aria-labelledby="jv-appel-nom">' +
        '<header class="jv-appel-tete">' +
          '<div><div class="jv-dialogue-sur">Mode appel</div>' +
          '<h2 class="jv-appel-nom" id="jv-appel-nom">' + esc(p.nom || p.enseigne || 'Agence') + '</h2>' +
          '<div class="jv-appel-meta">' + esc([p.ville, p.dirigeant].filter(Boolean).join(' · ')) + '</div></div>' +
          '<button type="button" class="jv-fermer" data-jv-fermer aria-label="Fermer le mode appel">✕</button>' +
        '</header>' +
        '<div class="jv-appel-corps">' +
          (tel ? '<a class="jv-appel-num" href="tel:' + esc(tel) + '" data-jv-composer>Appeler ' + esc(p.tel) + '</a>'
               : '<p class="jv-appel-num est-vide">Numéro à trouver : complétez la fiche.</p>') +
          (p.oppose ? '<p class="form-msg err" style="display:block;">Cette agence s’est opposée à la prospection : ne l’appelez pas.</p>' : '') +
          '<dl class="jv-appel-rappel">' +
            (derniere ? '<div><dt>Dernière note</dt><dd>' + esc(derniere.quoi) + (derniere.detail ? ' — ' + esc(derniere.detail) : '') + '</dd></div>' : '') +
            (p.relance_le ? '<div><dt>Prévu</dt><dd>' + esc(V.libelleAction(pa.type || 'appel')) + ' le ' + esc(joliJour(p.relance_le)) + (pa.texte ? ' — ' + esc(pa.texte) : '') + '</dd></div>' : '') +
          '</dl>' +
          scriptHTML() +
          objectionsHTML(p) +
          '<section class="jv-appel-bloc"><h3 class="jv-appel-h">Leurs mots</h3>' +
            '<textarea class="field-area" id="jv-appel-note" rows="3" maxlength="400" placeholder="Ce qu’ils ont dit, avec leurs mots à eux"></textarea></section>' +
        '</div>' +
        '<footer class="jv-appel-pied" id="jv-appel-pied">' +
          '<div class="jv-appel-h">Comment s’est passé l’appel ?</div>' +
          '<div class="jv-issues">' + V.ISSUES.map(function (is) {
            return '<button type="button" class="jv-issue' + (is.oppose ? ' est-stop' : '') + '" data-jv-issue="' + is.id + '">' + esc(is.label) + '</button>';
          }).join('') + '</div>' +
        '</footer>' +
      '</aside>';
  }

  function fermer() {
    if (!etat.hote) return;
    document.removeEventListener('keydown', touche);
    etat.hote.remove();
    etat.hote = null;
    document.documentElement.classList.remove('jv-sans-defilement');
    if (etat.avant && etat.avant.focus) { try { etat.avant.focus(); } catch (_) {} }
  }
  function touche(ev) { if (ev.key === 'Escape') fermer(); }

  async function enregistrerIssue(id) {
    var p = etat.p;
    var is = V.issue(id);
    if (!p || !is) return;
    if (is.oppose && !window.confirm('« ' + (p.nom || 'Cette agence') + ' » demande à ne plus être contactée ?\n\nLa fiche passe en « Sans suite » et plus aucun courriel ne pourra lui être envoyé.')) return;
    var note = (etat.hote.querySelector('#jv-appel-note') || {}).value || '';
    var r = V.appliquerIssue(p, id, { note: note, aujourdhui: V.jourParis() });
    var pied = etat.hote.querySelector('#jv-appel-pied');
    pied.classList.add('est-occupe');
    try {
      await A.modifier(p.siret, function (f) {
        f.statut = r.statut;
        f.oppose = r.oppose;
        f.relance_le = r.relance_le;
        f.prochaine_action = r.prochaine_action;
        f.dernier_contact = new Date().toISOString();
        if (note.trim()) f.notes = (f.notes ? f.notes + '\n' : '') + V.jourParis() + ' — ' + note.trim();
        return r.journal;
      }, p.owner);
      Object.assign(p, r);
      pied.classList.remove('est-occupe');
      pied.innerHTML = '<div class="jv-appel-fait" role="status">' +
        '<div class="jv-appel-h">Noté : ' + esc(is.label.toLowerCase()) + '</div>' +
        (r.relance_le ? '<p>Prochaine action : <b>' + esc(V.libelleAction(V.lireProchaineAction(r.prochaine_action).type)) + '</b> le ' + esc(joliJour(r.relance_le)) + '.</p>' :
          '<p>Plus aucun contact ne sera proposé pour cette fiche.</p>') +
        '<div class="jv-issues">' +
          (r.relance_le ? '<button type="button" class="btn btn-outline btn-sm" data-jv-changer>Changer la date</button>' : '') +
          '<button type="button" class="btn btn-ghost btn-sm" data-jv-voir-fiche>Fiche agence</button>' +
          '<button type="button" class="btn btn-gold btn-sm" data-jv-fermer>Terminer</button>' +
        '</div></div>';
      if (window.MelodiaConsole && typeof window.go === 'function') {
        var c = window.MelodiaConsole.courante();
        if (c === 'appels' || c === 'journee') setTimeout(function () { if (!etat.hote) window.go(c); }, 0);
      }
    } catch (e) {
      pied.classList.remove('est-occupe');
      toast('Appel non enregistré : ' + ((e && e.message) || 'erreur'));
    }
  }

  async function ouvrir(siret, owner) {
    var P = window.MelodiaProspects;
    var p = null;
    try { p = P ? await P.une(siret, owner) : null; } catch (e) { p = null; }
    if (!p) { toast('Fiche introuvable.'); return; }
    fermer();
    etat.p = p;
    etat.avant = document.activeElement;
    var hote = document.createElement('div');
    hote.className = 'jv-hote';
    hote.innerHTML = panneauHTML(p);
    document.body.appendChild(hote);
    etat.hote = hote;
    document.documentElement.classList.add('jv-sans-defilement');
    document.addEventListener('keydown', touche);
    var O = objectionsDe(p);
    hote.addEventListener('click', async function (ev) {
      var t = ev.target;
      if (t.closest('[data-jv-fermer]')) {
        fermer();
        if (window.MelodiaConsole && typeof window.go === 'function') window.go(window.MelodiaConsole.courante());
        return;
      }
      var ob = t.closest('[data-jv-obj]');
      if (ob) {
        var o = O[Number(ob.dataset.jvObj)];
        var zone = hote.querySelector('#jv-reponse');
        var deja = ob.getAttribute('aria-expanded') === 'true';
        hote.querySelectorAll('[data-jv-obj]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
        if (deja || !o) { zone.hidden = true; return; }
        ob.setAttribute('aria-expanded', 'true');
        zone.innerHTML = '<p class="jv-reponse-texte">' + esc(o.reponse || '') + '</p>' +
          (o.relance ? '<p class="jv-reponse-relance">Puis : ' + esc(o.relance) + '</p>' : '');
        zone.hidden = false;
        return;
      }
      var is = t.closest('[data-jv-issue]');
      if (is) return enregistrerIssue(is.dataset.jvIssue);
      if (t.closest('[data-jv-changer]')) {
        var ok = await A.poserSuite(etat.p.siret, etat.p.owner);
        if (ok) { toast('Prochaine action changée.'); fermer(); if (typeof window.go === 'function') window.go(window.MelodiaConsole.courante()); }
        return;
      }
      if (t.closest('[data-jv-voir-fiche]')) { var s = etat.p.siret; fermer(); A.ouvrirFiche(s); }
    });
    setTimeout(function () { var b = hote.querySelector('[data-jv-composer], .jv-fermer'); if (b) b.focus(); }, 30);
  }

  /* ─── Vue « À appeler » ─────────────────────────────────────────── */
  function aAppeler(liste) {
    var auj = V.jourParis();
    var out = [];
    (liste || []).forEach(function (p) {
      if (!p || V.estClose(p) || !p.tel) return;
      var r = String(p.relance_le || '').slice(0, 10);
      var pa = V.lireProchaineAction(p.prochaine_action);
      var motif = '';
      var rang = 9;
      if (r && r < auj) { motif = 'En retard depuis le ' + joliJour(r); rang = 0; }
      else if (r && r === auj) { motif = pa.type && pa.type !== 'appel' ? V.libelleAction(pa.type) + ' aujourd’hui' : 'Prévu aujourd’hui'; rang = pa.type && pa.type !== 'appel' ? 2 : 1; }
      else if (V.sansProchaineAction(p, auj)) { motif = 'Aucune prochaine action'; rang = 3; }
      else if (p.statut === 'nouveau' && !r) { motif = 'Jamais appelée'; rang = 4; }
      if (rang < 9) out.push({ p: p, motif: motif, rang: rang, texte: pa.texte });
    });
    out.sort(function (a, b) { return a.rang - b.rang || String(a.p.relance_le || '').localeCompare(String(b.p.relance_le || '')); });
    return out;
  }

  function vueAppels() {
    var l = aAppeler(window.MelodiaConsole ? window.MelodiaConsole.prospects() : []);
    if (!l.length) {
      return '<div class="jv" data-julie-vue="appels"><section class="panel jv-panel"><p class="col-vide">Aucun appel prévu aujourd’hui. Les fiches avec un téléphone et une action due apparaîtront ici.</p></section></div>';
    }
    return '<div class="jv" data-julie-vue="appels"><p class="panel-note">' + l.length + ' appel' + (l.length > 1 ? 's' : '') + ' à passer, du plus urgent au moins urgent.</p>' +
      '<ul class="jv-liste-appels">' + l.map(function (x) {
        var p = x.p;
        return '<li class="jv-ligne-appel">' +
          '<div class="jv-ligne-corps"><div class="jv-ligne-nom">' + esc(p.nom || p.enseigne || '') + '</div>' +
            '<div class="jv-ligne-meta">' + esc([p.ville, x.motif].filter(Boolean).join(' · ')) + (x.texte ? ' — ' + esc(x.texte) : '') + '</div></div>' +
          '<div class="jv-ligne-actions">' +
            '<button type="button" class="btn btn-gold btn-sm" data-jv-appeler="' + esc(p.siret) + '" data-owner="' + esc(p.owner || '') + '">Mode appel</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-jv-fiche="' + esc(p.siret) + '">Fiche</button>' +
          '</div></li>';
      }).join('') + '</ul></div>';
  }

  function brancherAppels() {
    var h = document.querySelector('[data-julie-vue="appels"]');
    if (!h) return;
    h.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-jv-appeler]');
      if (a) return ouvrir(a.dataset.jvAppeler, a.dataset.owner);
      var f = ev.target.closest('[data-jv-fiche]');
      if (f) A.ouvrirFiche(f.dataset.jvFiche);
    });
  }

  window.MelodiaJulieAppel = { ouvrir: ouvrir, fermer: fermer, aAppeler: aAppeler };

  if (window.MelodiaConsole) {
    window.MelodiaConsole.ajouterVue('appels', ['Aujourd’hui', 'À <em>appeler</em>', vueAppels, brancherAppels]);
    /* Console déjà démarrée sur ce hash avant l'inscription : on l'ouvre maintenant. */
    var hv = (location.hash || '').replace(/^#/, '').split('?')[0];
    if (hv === 'appels' && window.MelodiaConsole.demarree && window.MelodiaConsole.courante() !== hv && typeof window.go === 'function') window.go(hv);
  }
})();
