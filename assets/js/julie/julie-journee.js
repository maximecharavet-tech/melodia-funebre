/*!
 * julie-journee.js — Console Julie v2 · vue « Ma journée » (par défaut).
 *
 * Vue principale. Ordre des sections :
 *   1. À traiter maintenant  (réponses marquées + prospects chauds)
 *   2. Relances prêtes       (étapes de séquence dues aujourd'hui, triage)
 *   3. Nouveaux à contacter  (top score, jamais contactés)
 *   4. À enrichir            (email / site / dirigeant manquants)
 *   5. Plus tard             (prévu cette semaine)
 *
 * En-tête : « Bonjour Julie », date, citation calme, anneau d'objectif, quota.
 *
 * Dépend de : window.MelodiaJulie (julie-core.js), window.MelodiaProspects
 * (auth.js), window.MelodiaJulieWasm (via julie-core). Aucune dépendance npm.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J) return;

  var etat = {
    chargement: false,
    triage: null, // { items: [...], index: 0, faits: [] }
    data: null
  };

  // ─── Utilitaires ──────────────────────────────────────────────────────
  function esc(s) { return J.esc(s); }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = J.parseDate(iso);
    if (!d) return '';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d);
  }

  function aujourdhui() { return J.aujourdhuiParis(); }

  function jourSemaineFr(iso) {
    var d = J.parseDate(iso);
    if (!d) return '';
    var s = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function citationDuJour() {
    // Une phrase calme, tirée d'un corpus sobre, selon le jour.
    var citations = [
      'Une chanson juste vaut mieux que dix relances.',
      'Vouloir être utile avant d’être convaincant.',
      'Le silence est une donnée. Notez-le, ne le subissez pas.',
      'Une agence qui répond pense à ses familles.',
      'La constance, discrètement, ouvre plus de portes que le talent.',
      'Un bon suivi ressemble à une conversation, pas à une campagne.'
    ];
    var d = J.parseDate(aujourdhui());
    var i = d ? d.getDate() % citations.length : 0;
    return citations[i];
  }

  function normalise(p) {
    return J.normaliseProspect(p || {});
  }

  // ─── Calcul des sections ──────────────────────────────────────────────
  function estChaud(p, maintenantIso) {
    var n = normalise(p);
    if (n.oppose || n.rejete) return false;
    var clics = n.evenements.filter(function (e) {
      if (e.kind !== 'clique') return false;
      var d = J.parseDate(e.le);
      return d && (J.parseDate(maintenantIso) - d) < 48 * 3600 * 1000;
    }).length;
    var ouverts = n.evenements.filter(function (e) {
      if (e.kind !== 'ouvert') return false;
      var d = J.parseDate(e.le);
      return d && (J.parseDate(maintenantIso) - d) < 48 * 3600 * 1000;
    }).length;
    return clics >= 1 || ouverts >= 2;
  }

  function aRepondu(p) {
    var n = normalise(p);
    return !!n.journal && n.journal.some(function (j) {
      return j && String(j.quoi || '').toLowerCase().indexOf('répondu') >= 0;
    });
  }

  function estEnAttente(p, isoJour) {
    var n = normalise(p);
    if (n.oppose || n.rejete) return false;
    if (!n.relance_le) return false;
    return n.relance_le.slice(0, 10) <= isoJour;
  }

  function jamaisContacte(p) {
    var n = normalise(p);
    if (n.oppose || n.rejete) return false;
    if (n.statut !== 'nouveau') return false;
    if (n.dernier_contact_le) return false;
    return !!n.email || !!n.tel;
  }

  function aEnrichir(p) {
    var n = normalise(p);
    if (n.oppose || n.rejete) return false;
    return !n.email || !n.site || !n.dirigeant;
  }

  function plusTard(p, isoJour) {
    var n = normalise(p);
    if (n.oppose || n.rejete) return false;
    if (!n.relance_le) return false;
    var d = n.relance_le.slice(0, 10);
    if (d <= isoJour) return false;
    var diff = J.joursEntre(isoJour, d);
    return diff >= 1 && diff <= 7;
  }

  function trierParScore(liste) {
    return liste.slice().sort(function (a, b) {
      return (b._score || 0) - (a._score || 0);
    });
  }

  async function calculerScores(liste) {
    var out = [];
    for (var i = 0; i < liste.length; i++) {
      try {
        var r = await J.score(liste[i]);
        out.push(Object.assign({}, liste[i], { _score: r.score, _contributions: r.contributions }));
      } catch (_) {
        out.push(Object.assign({}, liste[i], { _score: 0 }));
      }
    }
    return out;
  }

  // ─── Rendu : en-tête ─────────────────────────────────────────────────
  async function enteteHTML(data) {
    var quota = data.quota || { utilise: 0, max: 30, restant: 30 };
    var objectif = data.objectif || { mails: 30, appels: 5, relances: 3 };
    var faits = data.faits || { mails: 0, appels: 0, relances: 0 };
    var pct = quota.max > 0 ? Math.min(100, Math.round((quota.utilise / quota.max) * 100)) : 0;

    return '' +
      '<div class="jv2-entete">' +
        '<div class="jv2-entete-gauche">' +
          '<div class="jv2-hello">Bonjour <em>Julie</em></div>' +
          '<div class="jv2-jour">' + esc(jourSemaineFr(aujourdhui())) + '</div>' +
          '<div class="jv2-citation">« ' + esc(citationDuJour()) + ' »</div>' +
        '</div>' +
        '<div class="jv2-entete-droite">' +
          anneauObjectifHTML(objectif, faits) +
          '<div class="jv2-quota" title="Quota d’envoi du jour">' +
            '<div class="jv2-quota-label">Quota</div>' +
            '<div class="jv2-quota-chiffres"><span class="mono">' + quota.utilise + '</span><span class="jv2-quota-sep">/</span><span class="mono">' + quota.max + '</span></div>' +
            '<div class="jv2-quota-barre"><span style="width:' + pct + '%"></span></div>' +
            '<div class="jv2-quota-reste">' + quota.restant + ' restant' + (quota.restant === 1 ? '' : 's') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function anneauObjectifHTML(obj, faits) {
    var m = obj.mails > 0 ? faits.mails / obj.mails : 0;
    var a = obj.appels > 0 ? faits.appels / obj.appels : 0;
    var r = obj.relances > 0 ? faits.relances / obj.relances : 0;
    var circumference = 2 * Math.PI * 32;
    function ring(pct, couleur, offset) {
      return '<circle cx="40" cy="40" r="' + (32 - offset) + '" fill="none" stroke="rgba(201,168,76,.10)" stroke-width="4"/>' +
        '<circle cx="40" cy="40" r="' + (32 - offset) + '" fill="none" stroke="' + couleur + '" stroke-width="4" ' +
        'stroke-dasharray="' + circumference + '" stroke-dashoffset="' + (circumference * (1 - Math.min(1, pct))) + '" ' +
        'transform="rotate(-90 40 40)"/>';
    }
    return '' +
      '<div class="jv2-anneau" title="Objectif du jour">' +
        '<svg viewBox="0 0 80 80" width="80" height="80">' +
          ring(m, 'var(--or-bright)', 0) +
          ring(a, 'var(--ivory)', 5) +
          ring(r, 'var(--bone)', 10) +
        '</svg>' +
        '<div class="jv2-anneau-texte">' +
          '<div>' + faits.mails + '/' + obj.mails + ' mails</div>' +
          '<div>' + faits.appels + '/' + obj.appels + ' appels</div>' +
          '<div>' + faits.relances + '/' + obj.relances + ' relances</div>' +
        '</div>' +
      '</div>';
  }

  // ─── Rendu : section à traiter ───────────────────────────────────────
  function sectionTraiterHTML(items) {
    if (!items.length) return '';
    var cards = items.map(cardChaudHTML).join('');
    return '' +
      '<section class="jv2-section" data-section="traiter">' +
        '<header class="jv2-section-tete">' +
          '<h3>À traiter <em>maintenant</em></h3>' +
          '<span class="jv2-badge">' + items.length + '</span>' +
        '</header>' +
        '<div class="jv2-cartes">' + cards + '</div>' +
      '</section>';
  }

  function cardChaudHTML(p) {
    var n = normalise(p);
    var dernier = n.evenements[0];
    var motif = dernier ? (dernier.kind === 'clique' ? 'A cliqué récemment' : 'A ouvert plusieurs fois') : 'À rappeler';
    return '' +
      '<article class="jv2-card jv2-card-chaud" data-siret="' + esc(n.siret) + '">' +
        '<div class="jv2-card-entete">' +
          '<div class="jv2-card-nom">' + esc(n.nom || '(sans nom)') + '</div>' +
          '<div class="jv2-card-ville">' + esc(n.ville || '') + '</div>' +
        '</div>' +
        '<div class="jv2-card-motif">' + esc(motif) + '</div>' +
        '<div class="jv2-card-actions">' +
          (n.tel ? '<a class="btn btn-sm btn-outline" href="tel:' + esc(n.tel) + '" data-act="appeler">Appeler ' + esc(n.tel) + '</a>' : '') +
          '<button type="button" class="btn btn-sm" data-act="interesse">Intéressé</button>' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="rappeler">Rappeler</button>' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="pas-maintenant">Pas maintenant</button>' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="stop" title="Ne plus contacter">STOP</button>' +
        '</div>' +
      '</article>';
  }

  // ─── Rendu : section relances ────────────────────────────────────────
  function sectionRelancesHTML(items) {
    if (!items.length) {
      return '' +
        '<section class="jv2-section" data-section="relances">' +
          '<header class="jv2-section-tete"><h3>Relances <em>prêtes</em></h3></header>' +
          '<div class="jv2-vide">Aucune relance due aujourd’hui. Respirez.</div>' +
        '</section>';
    }
    var rows = items.map(function (p) {
      var n = normalise(p);
      return '' +
        '<li class="jv2-relance-ligne" data-siret="' + esc(n.siret) + '">' +
          '<div class="jv2-relance-nom">' + esc(n.nom || '(sans nom)') + '</div>' +
          '<div class="jv2-relance-meta">' + esc(n.ville || '') + ' · ' + esc(fmtDate(n.relance_le)) + '</div>' +
          '<div class="jv2-relance-actions">' +
            '<button type="button" class="btn btn-sm btn-outline" data-act="relire">Relire</button>' +
            '<button type="button" class="btn btn-sm btn-outline" data-act="reporter">Reporter</button>' +
          '</div>' +
        '</li>';
    }).join('');
    return '' +
      '<section class="jv2-section" data-section="relances">' +
        '<header class="jv2-section-tete">' +
          '<h3>Relances <em>prêtes</em></h3>' +
          '<button type="button" class="btn btn-sm" data-act="triage">Relire et envoyer les ' + items.length + ' relances</button>' +
        '</header>' +
        '<ul class="jv2-relances">' + rows + '</ul>' +
      '</section>';
  }

  // ─── Rendu : section nouveaux ────────────────────────────────────────
  function sectionNouveauxHTML(items, resteQuota) {
    if (!items.length) return '';
    var limite = Math.min(items.length, Math.max(0, resteQuota || 0, 10));
    var selection = items.slice(0, limite);
    var rows = selection.map(function (p) {
      var n = normalise(p);
      return '' +
        '<li class="jv2-nouveau-ligne" data-siret="' + esc(n.siret) + '">' +
          '<span class="jv2-score" title="Score">' + (n._score || 0) + '</span>' +
          '<span class="jv2-nouveau-nom">' + esc(n.nom || '') + '</span>' +
          '<span class="jv2-nouveau-ville">' + esc(n.ville || '') + '</span>' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="composer">Composer</button>' +
        '</li>';
    }).join('');
    return '' +
      '<section class="jv2-section" data-section="nouveaux">' +
        '<header class="jv2-section-tete">' +
          '<h3>Nouveaux à <em>contacter</em></h3>' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="inscrire">Inscrire dans la séquence</button>' +
        '</header>' +
        '<ul class="jv2-nouveaux">' + rows + '</ul>' +
      '</section>';
  }

  function sectionEnrichirHTML(items) {
    if (!items.length) return '';
    var rows = items.slice(0, 6).map(function (p) {
      var n = normalise(p);
      var manquants = [];
      if (!n.email) manquants.push('courriel');
      if (!n.site) manquants.push('site');
      if (!n.dirigeant) manquants.push('dirigeant');
      return '' +
        '<li class="jv2-enrichir-ligne" data-siret="' + esc(n.siret) + '">' +
          '<span class="jv2-enrichir-nom">' + esc(n.nom || '') + '</span>' +
          '<span class="jv2-enrichir-meta">manque : ' + esc(manquants.join(', ')) + '</span>' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="completer">Compléter</button>' +
        '</li>';
    }).join('');
    return '' +
      '<section class="jv2-section" data-section="enrichir">' +
        '<header class="jv2-section-tete"><h3>À <em>enrichir</em></h3></header>' +
        '<ul class="jv2-enrichir">' + rows + '</ul>' +
      '</section>';
  }

  function sectionPlusTardHTML(items) {
    if (!items.length) return '';
    return '' +
      '<section class="jv2-section" data-section="plus-tard">' +
        '<header class="jv2-section-tete"><h3>Plus <em>tard</em></h3></header>' +
        '<p class="jv2-plus-tard-note">' + items.length + ' relance' + (items.length > 1 ? 's' : '') + ' prévue' + (items.length > 1 ? 's' : '') + ' cette semaine.</p>' +
      '</section>';
  }

  // ─── Triage modal (Superhuman style) ─────────────────────────────────
  function triageHTML() {
    var t = etat.triage;
    if (!t || !t.items.length) return '';
    var p = t.items[t.index];
    var n = normalise(p);
    var i = t.index + 1;
    var total = t.items.length;
    return '' +
      '<div class="jv2-triage" role="dialog" aria-modal="true" aria-label="Triage des relances">' +
        '<div class="jv2-triage-tete">' +
          '<span class="jv2-triage-compteur mono">' + i + ' / ' + total + '</span>' +
          '<button type="button" class="jv2-triage-fermer" data-act="fermer" aria-label="Fermer">×</button>' +
        '</div>' +
        '<div class="jv2-triage-corps">' +
          '<div class="jv2-triage-cible">' +
            '<div class="jv2-triage-nom">' + esc(n.nom || '') + '</div>' +
            '<div class="jv2-triage-ville">' + esc(n.ville || '') + ' · ' + esc(n.email || '') + '</div>' +
          '</div>' +
          '<div class="jv2-triage-apercu">' +
            '<p>Objet : <strong>Une chanson pour les familles de ' + esc(n.nom || 'votre agence') + '</strong></p>' +
            '<p class="jv2-triage-texte">Prévisualisation du courriel — cliquez sur « Relire » pour ouvrir l’aperçu serveur complet.</p>' +
          '</div>' +
        '</div>' +
        '<div class="jv2-triage-pied">' +
          '<button type="button" class="btn btn-outline" data-act="precedent">← Précédent</button>' +
          '<button type="button" class="btn btn-outline" data-act="suivant">Suivant →</button>' +
          '<button type="button" class="btn" data-act="envoyer">Envoyer (E)</button>' +
          '<button type="button" class="btn btn-outline" data-act="passer">Passer (S)</button>' +
          '<button type="button" class="btn btn-outline" data-act="editer">Éditer (✎)</button>' +
        '</div>' +
      '</div>' +
      '<div class="jv2-triage-voile"></div>';
  }

  // ─── Rendu principal ─────────────────────────────────────────────────
  function vueHTML(data) {
    var reste = (data.quota && data.quota.restant) || 0;
    return '' +
      '<div class="jv2">' +
        data.entete +
        sectionTraiterHTML(data.traiter) +
        sectionRelancesHTML(data.relances) +
        sectionNouveauxHTML(data.nouveaux, reste) +
        sectionEnrichirHTML(data.enrichir) +
        sectionPlusTardHTML(data.plusTard) +
      '</div>' +
      triageHTML();
  }

  // ─── Chargement des données ──────────────────────────────────────────
  async function chargerDonnees() {
    var prospects = [];
    try {
      if (window.MelodiaProspects && typeof window.MelodiaProspects.mine === 'function') {
        prospects = await Promise.resolve(window.MelodiaProspects.mine());
      }
    } catch (_) { prospects = []; }
    if (!Array.isArray(prospects)) prospects = [];

    var isoJour = aujourdhui();
    var maintenantIso = J.isoParis(new Date());

    var enrichis = await calculerScores(prospects);

    var traiter = enrichis.filter(function (p) {
      return aRepondu(p) || estChaud(p, maintenantIso);
    });
    var relances = enrichis.filter(function (p) { return estEnAttente(p, isoJour); });
    var nouveaux = trierParScore(enrichis.filter(jamaisContacte));
    var enrichir = enrichis.filter(aEnrichir);
    var plusTard = enrichis.filter(function (p) { return plusTardCheck(p, isoJour); });

    var quota = { utilise: 0, max: 30, restant: 30 };
    try {
      if (window.MelodiaAuth && typeof window.MelodiaAuth.quota === 'function') {
        var q = await Promise.resolve(window.MelodiaAuth.quota());
        if (q && typeof q.utilise === 'number') quota = q;
      }
    } catch (_) { /* quota par défaut */ }

    // Objectif et faits du jour (fallback : localStorage)
    var objectif = J.lireCache('objectif.' + isoJour, { mails: 30, appels: 5, relances: 3 });
    var faits = J.lireCache('faits.' + isoJour, { mails: 0, appels: 0, relances: 0 });

    var entete = await enteteHTML({ quota: quota, objectif: objectif, faits: faits });

    return {
      entete: entete,
      traiter: traiter,
      relances: relances,
      nouveaux: nouveaux,
      enrichir: enrichir,
      plusTard: plusTard,
      quota: quota,
      objectif: objectif,
      faits: faits,
      isoJour: isoJour
    };
  }

  function plusTardCheck(p, isoJour) {
    var n = normalise(p);
    if (n.oppose || n.rejete) return false;
    if (!n.relance_le) return false;
    var d = n.relance_le.slice(0, 10);
    if (d <= isoJour) return false;
    var diff = J.joursEntre(isoJour, d);
    return diff >= 1 && diff <= 7;
  }

  // ─── Journalisation locale ───────────────────────────────────────────
  function noter(p, quoi, detail) {
    try {
      if (window.MelodiaProspects && typeof window.MelodiaProspects.noter === 'function') {
        return window.MelodiaProspects.noter(p.siret, quoi, detail || '');
      }
    } catch (_) { /* ignore */ }
    // Fallback : journal local
    var j = p.journal || [];
    j.unshift({ le: new Date().toISOString(), quoi: quoi, detail: detail || '', par: 'local' });
    p.journal = j.slice(0, 60);
    return Promise.resolve();
  }

  async function incrementerFait(cle) {
    var iso = aujourdhui();
    var faits = J.lireCache('faits.' + iso, { mails: 0, appels: 0, relances: 0 });
    faits[cle] = (faits[cle] || 0) + 1;
    J.ecrireCache('faits.' + iso, faits);
  }

  // ─── Bindings ────────────────────────────────────────────────────────
  function trouverProspect(siret) {
    if (!etat.data) return null;
    var toutes = [].concat(etat.data.traiter, etat.data.relances, etat.data.nouveaux, etat.data.enrichir);
    for (var i = 0; i < toutes.length; i++) {
      if (toutes[i].siret === siret) return toutes[i];
    }
    return null;
  }

  async function rendre() {
    var cible = document.querySelector('[data-julie-vue="journee"]');
    if (!cible) return;
    if (etat.chargement) return;
    etat.chargement = true;
    cible.innerHTML = '<div class="jv2 jv2-chargement">Chargement…</div>';
    try {
      var data = await chargerDonnees();
      etat.data = data;
      cible.innerHTML = vueHTML(data);
      brancher(cible);
    } catch (e) {
      cible.innerHTML = '<div class="jv2 jv2-erreur">Impossible de charger la journée. ' + esc(e.message) + '</div>';
    } finally {
      etat.chargement = false;
    }
  }

  function brancher(cible) {
    cible.addEventListener('click', async function (ev) {
      var t = ev.target;
      if (!(t instanceof HTMLElement)) return;

      // Section relances → triage
      if (t.dataset.act === 'triage') {
        ouvrirTriage();
        return;
      }

      // Card chaude : boutons d'issue
      var card = t.closest('.jv2-card-chaud, .jv2-relance-ligne, .jv2-nouveau-ligne, .jv2-enrichir-ligne');
      if (card) {
        var siret = card.dataset.siret;
        var p = trouverProspect(siret);
        var act = t.dataset.act;
        if (!p || !act) return;

        if (act === 'interesse') {
          p.statut = 'interesse';
          await noter(p, 'appel', 'Intéressé (Ma journée)');
          await incrementerFait('appels');
          return rendre();
        }
        if (act === 'rappeler') {
          var d = prompt('Rappeler le (AAAA-MM-JJ) ?', aujourdhui());
          if (d) {
            p.relance_le = d + 'T09:00:00+01:00';
            await noter(p, 'rappel', 'Rappel programmé pour le ' + d);
          }
          return rendre();
        }
        if (act === 'pas-maintenant') {
          p.relance_le = J.isoParis(new Date(Date.now() + 14 * 86400000));
          await noter(p, 'report', 'Reporté de 14 jours');
          return rendre();
        }
        if (act === 'stop') {
          if (!confirm('Marquer ce prospect comme opposé (STOP) ? Il ne sera plus jamais contacté.')) return;
          p.oppose = true;
          await noter(p, 'stop', 'Opposition enregistrée');
          return rendre();
        }
        if (act === 'relire') {
          return ouvrirTriage(siret);
        }
        if (act === 'reporter') {
          p.relance_le = J.isoParis(new Date(Date.now() + 3 * 86400000));
          await noter(p, 'report', 'Relance reportée de 3 jours');
          return rendre();
        }
        if (act === 'composer' || act === 'completer') {
          window.location.hash = '#prospects';
          return;
        }
      }

      // Triage
      if (t.dataset.act === 'fermer' || t.dataset.act === 'passer') {
        return triageSuivant(false);
      }
      if (t.dataset.act === 'precedent') {
        etat.triage.index = Math.max(0, etat.triage.index - 1);
        return rafraichirTriage();
      }
      if (t.dataset.act === 'suivant') {
        etat.triage.index = Math.min(etat.triage.items.length - 1, etat.triage.index + 1);
        return rafraichirTriage();
      }
      if (t.dataset.act === 'envoyer') {
        return triageEnvoyer();
      }
      if (t.dataset.act === 'editer') {
        window.location.hash = '#prospects';
        return;
      }
    });

    // Touches clavier globales du triage
    document.addEventListener('keydown', triageTouches);
  }

  function triageTouches(ev) {
    if (!etat.triage) return;
    if (ev.key === 'Escape') { fermerTriage(); return; }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); etat.triage.index = Math.max(0, etat.triage.index - 1); rafraichirTriage(); return; }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); etat.triage.index = Math.min(etat.triage.items.length - 1, etat.triage.index + 1); rafraichirTriage(); return; }
    if (ev.key === 'e' || ev.key === 'E') { ev.preventDefault(); triageEnvoyer(); return; }
    if (ev.key === 's' || ev.key === 'S') { ev.preventDefault(); triageSuivant(false); return; }
  }

  function ouvrirTriage(siretFocus) {
    if (!etat.data || !etat.data.relances.length) {
      if (window.melodiaToast) window.melodiaToast('Aucune relance à envoyer aujourd’hui.');
      return;
    }
    var items = etat.data.relances.slice();
    var idx = 0;
    if (siretFocus) {
      var f = items.findIndex(function (p) { return p.siret === siretFocus; });
      if (f >= 0) idx = f;
    }
    etat.triage = { items: items, index: idx, faits: [] };
    rafraichirTriage();
  }

  function rafraichirTriage() {
    var cible = document.querySelector('[data-julie-vue="journee"]');
    if (!cible) return;
    var voile = cible.querySelector('.jv2-triage-voile');
    if (voile) voile.remove();
    var modal = cible.querySelector('.jv2-triage');
    if (modal) modal.remove();
    cible.insertAdjacentHTML('beforeend', triageHTML());
  }

  function fermerTriage() {
    etat.triage = null;
    var cible = document.querySelector('[data-julie-vue="journee"]');
    if (!cible) return;
    var modal = cible.querySelector('.jv2-triage');
    if (modal) modal.remove();
    var voile = cible.querySelector('.jv2-triage-voile');
    if (voile) voile.remove();
    document.removeEventListener('keydown', triageTouches);
  }

  function triageSuivant(envoye) {
    if (!etat.triage) return;
    if (envoye) etat.triage.faits.push(etat.triage.items[etat.triage.index]);
    etat.triage.index += 1;
    if (etat.triage.index >= etat.triage.items.length) {
      var faits = etat.triage.faits.length;
      fermerTriage();
      if (faits > 0 && window.melodiaToast) {
        window.melodiaToast(faits + ' relance' + (faits > 1 ? 's' : '') + ' envoyée' + (faits > 1 ? 's' : '') + '.');
      }
      return rendre();
    }
    rafraichirTriage();
  }

  async function triageEnvoyer() {
    if (!etat.triage) return;
    var p = etat.triage.items[etat.triage.index];
    try {
      var reponse = await fetch('/api/prospect-mail', {
        method: 'POST',
        headers: J.entetes(),
        credentials: 'same-origin',
        body: JSON.stringify({
          mode: 'envoi',
          modele: 'pf-relance-j4',
          envois: [{ to: p.email, ref: p.siret, societe: p.nom, nom: p.dirigeant || '', ville: p.ville || '', sujet: 'Une chanson pour les familles de ' + (p.nom || 'votre agence') }]
        })
      });
      if (!reponse.ok) {
        var err = await reponse.json().catch(function () { return {}; });
        if (window.melodiaToast) window.melodiaToast('Envoi refusé : ' + (err.code || reponse.status));
        if (reponse.status === 503) {
          window.location.href = 'mailto:' + encodeURIComponent(p.email) + '?subject=' + encodeURIComponent('Une chanson pour les familles');
        }
        return;
      }
      await noter(p, 'relance', 'Relance envoyée (triage)');
      await incrementerFait('relances');
      triageSuivant(true);
    } catch (e) {
      if (window.melodiaToast) window.melodiaToast('Erreur réseau : ' + e.message);
    }
  }

  // ─── Exposition à la console ─────────────────────────────────────────
  window.MelodiaJulieJournee = {
    vue: function () { return '<div data-julie-vue="journee"><div class="jv2 jv2-chargement">Chargement…</div></div>'; },
    brancher: function () { rendre(); },
    rendre: rendre
  };
})();
