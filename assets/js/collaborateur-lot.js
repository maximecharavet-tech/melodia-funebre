/* ═══ Console collaborateur — Envoi groupé personnalisé ═══
   Julie coche des contacts, choisit un modèle, voit l'aperçu de chaque
   destinataire, clique UN bouton « Envoyer » : le lot part tout seul,
   personnalisé, dans les plafonds Resend. Les envois passent par
   /api/prospect-mail (modes lot_*) : même chemin que l'envoi unitaire
   (rôle relu en base, désabonnés écartés, doublons < 60 jours sautés).

   Rien ne part depuis l'aperçu. L'état du lot est relu après un
   rechargement (jamais relancé tout seul : « Continuer » est un clic).

   Les fonctions pures (séparer un nom, filtrer, analyser un collage CSV)
   sont exportées pour les tests Node (module.exports). */
(function (racineGlobale) {
  'use strict';

  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var FENETRE_MS = 60 * 24 * 3600 * 1000;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(e) { return String(e || '').trim().toLowerCase(); }
  function sansAccent(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  /* ─── Dates : « 12/11 », avec l'année si ce n'est pas l'année courante ─── */
  function dateFr(quand, maintenant) {
    var t = new Date(quand);
    if (isNaN(t.getTime())) return '';
    var f = function (d, o) { return new Intl.DateTimeFormat('fr-FR', Object.assign({ timeZone: 'Europe/Paris' }, o)).format(d); };
    var jm = f(t, { day: '2-digit', month: '2-digit' });
    var an = f(t, { year: 'numeric' });
    var ref = maintenant ? new Date(maintenant) : new Date();
    return an === f(ref, { year: 'numeric' }) ? jm : jm + '/' + an;
  }
  function libelleDeja(x, maintenant) {
    if (!x) return '';
    if (x.statut === 'reserve' || x.statut === 'incertain') return 'Envoi en cours ou à vérifier dans Resend';
    return 'Déjà envoyé le ' + dateFr(x.precedent, maintenant) + ' — renvoi possible à partir du ' + dateFr(x.renvoi, maintenant);
  }

  /* ─── Un nom de personne → civilité, prénom, nom de famille ───
     Rien n'est inventé : « Mme Claire Dupont » → Madame / Claire / Dupont ;
     « Claire Dupont » → — / Claire / Dupont ; un seul mot est pris pour un
     nom de famille (la formule restera neutre sans civilité). */
  var CIVILITES = { 'm': 'Monsieur', 'mr': 'Monsieur', 'monsieur': 'Monsieur', 'mme': 'Madame', 'madame': 'Madame', 'mlle': 'Madame', 'mademoiselle': 'Madame' };
  var TITRES_IGNORES = { 'dr': 1, 'docteur': 1, 'me': 1, 'maitre': 1, 'pr': 1, 'professeur': 1 };
  function separerPersonne(texte) {
    var mots = String(texte || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    var civilite = '';
    while (mots.length) {
      var cle = sansAccent(mots[0]).toLowerCase().replace(/[.,]/g, '');
      if (CIVILITES[cle] && !civilite) { civilite = CIVILITES[cle]; mots.shift(); }
      else if (TITRES_IGNORES[cle]) mots.shift();
      else break;
    }
    if (!mots.length) return { civilite: civilite, prenom: '', nom_famille: '' };
    if (mots.length === 1) return { civilite: civilite, prenom: '', nom_famille: mots[0] };
    return { civilite: civilite, prenom: mots[0], nom_famille: mots.slice(1).join(' ') };
  }

  /* ─── Une fiche prospect → un contact d'envoi ─── */
  function contactDe(p) {
    var email = String((p && p.email) || '').trim();
    var pers = separerPersonne(p && p.dirigeant);
    return {
      cle: norm(email) || ('sans-mail-' + String((p && p.siret) || '')),
      siret: String((p && p.siret) || ''),
      email: email,
      civilite: pers.civilite, prenom: pers.prenom, nom_famille: pers.nom_famille,
      organisation: String((p && (p.enseigne || p.nom)) || '').replace(/\s+/g, ' ').trim(),
      ville: String((p && p.ville) || '').trim(),
      statut: String((p && p.statut) || ''),
      oppose: !!(p && p.oppose),
      valide: RE_EMAIL.test(email)
    };
  }
  function nomAffiche(c) {
    var n = [c.prenom, c.nom_famille].filter(Boolean).join(' ');
    return n || '—';
  }
  function eligible(c) { return c.valide && !c.oppose; }

  /* ─── Filtres : le sous-ensemble affiché, rien de caché ─── */
  function filtrer(contacts, f) {
    f = f || {};
    var q = sansAccent(f.q || '').toLowerCase().trim();
    return contacts.filter(function (c) {
      if (f.org && c.organisation !== f.org) return false;
      if (f.ville && c.ville !== f.ville) return false;
      if (f.statut && c.statut !== f.statut) return false;
      if (q) {
        var hay = sansAccent([c.prenom, c.nom_famille, c.email, c.organisation, c.ville].join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }
  /* « Tout sélectionner » : les contacts affichés ET éligibles, jamais plus. */
  function toutSelectionner(affiches, selection) {
    var sel = Object.assign({}, selection);
    affiches.forEach(function (c) { if (eligible(c)) sel[c.cle] = true; });
    return sel;
  }
  function toutDeselectionner(affiches, selection) {
    var sel = Object.assign({}, selection);
    affiches.forEach(function (c) { delete sel[c.cle]; });
    return sel;
  }

  /* ─── Import par collage CSV : analyser sans rien écrire ─── */
  var ALIAS = {
    civilite: ['civilite', 'titre', 'genre'],
    prenom: ['prenom', 'first name', 'firstname', 'prenom du contact'],
    nom: ['nom', 'nom de famille', 'last name', 'lastname', 'nom du contact'],
    email: ['email', 'e mail', 'courriel', 'mail', 'adresse e mail', 'adresse email', 'adresse mail'],
    organisation: ['organisation', 'societe', 'agence', 'entreprise', 'raison sociale', 'structure', 'pompes funebres', 'professionnel'],
    ville: ['ville', 'commune', 'city']
  };
  function champDe(entete) {
    var e = sansAccent(entete).toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    var noms = Object.keys(ALIAS);
    for (var i = 0; i < noms.length; i++) if (ALIAS[noms[i]].indexOf(e) !== -1) return noms[i];
    return '';
  }
  /**
   * @param parse     { entetes, lignes } (sortie du parseur CSV)
   * @param existants liste d'e-mails déjà dans la liste de contacts
   * @returns { colonnes, lignes:[{ligne, statut, motif, contact}], nouveaux, erreur? }
   *   statut : nouveau | invalide | doublon_import | existant
   */
  function analyserImport(parse, existants) {
    var out = { colonnes: {}, lignes: [], nouveaux: 0, ignores: 0 };
    if (!parse || !parse.entetes || !parse.entetes.length) { out.erreur = 'Rien à analyser : collez la liste, première ligne = noms des colonnes.'; return out; }
    var idx = {};
    parse.entetes.forEach(function (h, i) { var c = champDe(h); if (c && idx[c] === undefined) idx[c] = i; });
    out.colonnes = idx;
    if (idx.email === undefined) { out.erreur = 'Colonne e-mail introuvable. La première ligne doit nommer les colonnes : prénom, nom, e-mail, organisation (civilité et ville facultatives).'; return out; }
    var deja = {}; (existants || []).forEach(function (e) { deja[norm(e)] = true; });
    var vus = {};
    parse.lignes.forEach(function (l, n) {
      var v = function (c) { return idx[c] === undefined ? '' : String(l[idx[c]] || '').replace(/\s+/g, ' ').trim(); };
      var contact = {
        civilite: v('civilite'), prenom: v('prenom'), nom_famille: v('nom'), email: v('email'),
        organisation: v('organisation'), ville: v('ville')
      };
      var civ = CIVILITES[sansAccent(contact.civilite).toLowerCase().replace(/[.,]/g, '')] || '';
      if (contact.civilite && !civ) contact.civilite_inconnue = contact.civilite;
      contact.civilite = civ;
      var e = norm(contact.email);
      var r = { ligne: n + 2, contact: contact, statut: 'nouveau', motif: '' };
      if (!RE_EMAIL.test(contact.email)) { r.statut = 'invalide'; r.motif = contact.email ? 'Adresse e-mail invalide.' : 'Adresse e-mail absente.'; }
      else if (vus[e]) { r.statut = 'doublon_import'; r.motif = 'Doublon dans le collage (déjà ligne ' + vus[e] + ') : ignoré.'; }
      else if (deja[e]) { r.statut = 'existant'; r.motif = 'Déjà dans votre liste : rien n’est écrasé.'; }
      else {
        var avis = [];
        if (!contact.nom_famille && !contact.prenom) avis.push('sans nom : formule neutre « Bonjour, »');
        if (!contact.organisation) avis.push('sans organisation : rien d’inventé');
        if (contact.civilite_inconnue) avis.push('civilité « ' + contact.civilite_inconnue + ' » non reconnue, ignorée');
        r.motif = avis.join(' · ');
      }
      if (RE_EMAIL.test(contact.email) && !vus[e]) vus[e] = n + 2;
      if (r.statut === 'nouveau') out.nouveaux++; else out.ignores++;
      out.lignes.push(r);
    });
    return out;
  }
  /* La fiche prospect écrite après confirmation. Le nom de la personne est
     recomposé tel qu'on le relira : « Mme Claire Dupont ». */
  function ficheDepuisImport(c) {
    var civ = c.civilite === 'Madame' ? 'Mme' : c.civilite === 'Monsieur' ? 'M.' : '';
    var slug = norm(c.email).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
    return {
      siret: 'imp-' + slug,
      nom: c.organisation || '',
      dirigeant: [civ, c.prenom, c.nom_famille].filter(Boolean).join(' '),
      email: c.email, ville: c.ville, statut: 'nouveau',
      journal: [{ le: new Date().toISOString(), quoi: 'Fiche créée', detail: 'Import CSV (envoi groupé)' }]
    };
  }

  var LIBELLE_STATUT = { attente: 'En attente', en_cours: 'En cours…', envoye: 'Envoyé', deja: 'Déjà envoyé (< 2 mois)', desabonne: 'Désabonné', erreur: 'Erreur', reporte: 'Reporté (quota)', ignore: 'Ignoré' };

  var api = {
    separerPersonne: separerPersonne, contactDe: contactDe, filtrer: filtrer, toutSelectionner: toutSelectionner,
    toutDeselectionner: toutDeselectionner, analyserImport: analyserImport, ficheDepuisImport: ficheDepuisImport,
    dateFr: dateFr, libelleDeja: libelleDeja, eligible: eligible, champDe: champDe, LIBELLE_STATUT: LIBELLE_STATUT, FENETRE_MS: FENETRE_MS
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof window === 'undefined') return;

  // ═══ Partie navigateur ═══════════════════════════════════════════
  var lireProspects = function () { return []; };
  var etat = {
    sel: {}, filtre: { q: '', org: '', ville: '', statut: '' }, modele: '', apercuIdx: 0,
    deja: {}, lot: null, pompe: false, ajoutes: [], analyse: null, parseBrut: ''
  };

  function toast(t) { if (window.melodiaToast) window.melodiaToast(t); }
  function utilisateur() { return (window.MelodiaAuth && window.MelodiaAuth.current()) || {}; }
  function cleLocale() { return 'melodia_lot_dernier_' + norm(utilisateur().email); }
  function appeler(corps) {
    var C = window.MelodiaCampagne;
    return C && C.appeler ? C.appeler(corps) : Promise.resolve({ ok: false, status: 0, d: { error: 'Envoi indisponible hors session.' } });
  }

  function tousContacts() {
    var vus = {};
    var liste = (lireProspects() || []).concat(etat.ajoutes).map(contactDe).filter(function (c) {
      if (!c.valide && !c.email) return false; // fiche sans adresse : pas un contact d'envoi
      if (vus[c.cle]) return false; vus[c.cle] = true; return true;
    });
    return liste;
  }
  function contactsChoisis() { return tousContacts().filter(function (c) { return etat.sel[c.cle] && eligible(c); }); }
  function modeles() { return window.MelodiaMails && window.MelodiaMails.modelesPret ? window.MelodiaMails.modelesPret() : []; }
  function distincts(liste, k) {
    var o = {}; liste.forEach(function (c) { if (c[k]) o[c[k]] = true; });
    return Object.keys(o).sort(function (a, b) { return a.localeCompare(b, 'fr'); });
  }
  function statutsLabels() { return window.MELODIA_PROSPECT_STATUTS || {}; }

  function charge(c) {
    return { to: c.email, prenom: c.prenom, nom_famille: c.nom_famille, nom: [c.prenom, c.nom_famille].filter(Boolean).join(' '),
      civilite: c.civilite, societe: c.organisation, ville: c.ville };
  }

  // ─── Vue ───
  function vue() {
    var ms = modeles();
    if (!etat.modele && ms[0]) etat.modele = ms[0].id;
    return '<div class="lot">' +
      '<p class="panel-note">Cochez les personnes, choisissez le modèle, vérifiez l’aperçu de chacune, puis un seul clic sur « Envoyer ». ' +
      'Chaque courriel est personnalisé (prénom, nom, civilité, organisation ; formule neutre si une information manque). ' +
      'Les personnes déjà écrites il y a moins de 2 mois sont sautées, les désabonnés écartés.</p>' +
      '<div id="lot-etat"></div>' +
      '<section class="lot-bloc"><h3 class="lot-t">1 · Contacts</h3>' +
        '<div class="lot-filtres">' +
          '<input class="field-input" id="lot-q" type="search" placeholder="Rechercher : nom, e-mail, organisation…" aria-label="Rechercher">' +
          '<select class="field-select" id="lot-org" aria-label="Organisation"></select>' +
          '<select class="field-select" id="lot-ville" aria-label="Ville"></select>' +
          '<select class="field-select" id="lot-statut" aria-label="Statut"></select>' +
        '</div>' +
        '<div class="lot-actions"><button type="button" class="btn btn-outline btn-sm" id="lot-tout">Tout sélectionner (affichés)</button>' +
          '<button type="button" class="btn btn-outline btn-sm" id="lot-aucun">Tout désélectionner (affichés)</button>' +
          '<span class="col-aide" id="lot-compte" role="status" aria-live="polite"></span></div>' +
        '<div class="lot-table-wrap"><table class="lot-table"><thead><tr><th></th><th>Personne</th><th>E-mail</th><th>Organisation</th><th>Ville</th><th>Statut</th></tr></thead><tbody id="lot-corps"></tbody></table></div>' +
      '</section>' +
      '<section class="lot-bloc"><h3 class="lot-t">2 · Modèle et aperçu</h3>' +
        '<div class="field"><label class="field-label" for="lot-modele">Modèle</label><select class="field-select" id="lot-modele">' +
          ms.map(function (m) { return '<option value="' + esc(m.id) + '"' + (m.id === etat.modele ? ' selected' : '') + '>' + esc(m.nom) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="lot-nav"><button type="button" class="btn btn-outline btn-sm" id="lot-prec" aria-label="Destinataire précédent">◀</button>' +
          '<span id="lot-nav-t" class="col-aide" role="status"></span>' +
          '<button type="button" class="btn btn-outline btn-sm" id="lot-suiv" aria-label="Destinataire suivant">▶</button></div>' +
        '<p class="lot-champs" id="lot-champs"></p>' +
        '<p class="lot-sujet" id="lot-sujet"></p>' +
        '<div class="col-apercu-cadre est-desktop"><iframe class="col-apercu" id="lot-apercu" title="Aperçu du courriel personnalisé" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe></div>' +
        '<p class="col-aide">L’aperçu ne déclenche aucun envoi.</p>' +
      '</section>' +
      '<section class="lot-bloc"><h3 class="lot-t">3 · Envoyer</h3>' +
        '<p class="col-deja" id="lot-deja" role="status" aria-live="polite" hidden></p>' +
        '<div class="lot-actions"><button type="button" class="btn btn-gold" id="lot-envoyer" disabled>Envoyer</button>' +
          '<span class="col-aide" id="lot-envoi-etat" role="status" aria-live="polite"></span></div>' +
        '<p class="col-aide">Limites du forfait Resend : 100 courriels par jour et 3 000 par mois. Au-delà, le lot s’arrête proprement et le reste est reporté.</p>' +
      '</section>' +
      '<details class="col-lot lot-import"><summary>Importer des contacts (collage CSV)</summary>' +
        '<p class="col-aide">Première ligne = noms des colonnes : <strong>prénom, nom, e-mail, organisation</strong> (civilité et ville facultatives). Rien n’est écrit avant votre confirmation ; rien n’est envoyé à l’import.</p>' +
        '<textarea class="field-input col-lot-liste" id="lot-csv" rows="6" placeholder="civilité;prénom;nom;e-mail;organisation;ville&#10;Mme;Claire;Dupont;claire@dupont.fr;Pompes funèbres Dupont;Lyon"></textarea>' +
        '<div class="lot-actions"><button type="button" class="btn btn-outline btn-sm" id="lot-csv-analyser">Analyser</button></div>' +
        '<div id="lot-csv-resultat"></div>' +
      '</details>' +
    '</div>';
  }

  function dessinerFiltres() {
    var tous = tousContacts();
    var opt = function (id, vide, liste, courant, libelle) {
      var z = document.getElementById(id); if (!z) return;
      z.innerHTML = '<option value="">' + esc(vide) + '</option>' + liste.map(function (v) {
        return '<option value="' + esc(v) + '"' + (v === courant ? ' selected' : '') + '>' + esc(libelle ? libelle(v) : v) + '</option>';
      }).join('');
    };
    opt('lot-org', 'Toutes les organisations', distincts(tous, 'organisation'), etat.filtre.org);
    opt('lot-ville', 'Toutes les villes', distincts(tous, 'ville'), etat.filtre.ville);
    opt('lot-statut', 'Tous les statuts', distincts(tous, 'statut'), etat.filtre.statut, function (s) { return (statutsLabels()[s] || {}).label || s; });
  }

  function dessinerListe() {
    var tous = tousContacts();
    var affiches = filtrer(tous, etat.filtre);
    var corps = document.getElementById('lot-corps'); if (!corps) return;
    corps.innerHTML = affiches.length ? affiches.map(function (c) {
      var ok = eligible(c);
      var d = etat.deja[c.cle];
      return '<tr class="' + (etat.sel[c.cle] ? 'est-on' : '') + '"><td><input type="checkbox" data-sel="' + esc(c.cle) + '"' + (etat.sel[c.cle] && ok ? ' checked' : '') + (ok ? '' : ' disabled') +
        ' aria-label="Sélectionner ' + esc(nomAffiche(c)) + '"></td>' +
        '<td>' + esc(nomAffiche(c)) + '</td><td>' + esc(c.email || '—') + (c.oppose ? ' <span class="col-opt">désabonné</span>' : (!c.valide ? ' <span class="col-opt">adresse invalide</span>' : '')) + '</td>' +
        '<td>' + esc(c.organisation || '—') + '</td><td>' + esc(c.ville || '—') + '</td>' +
        '<td>' + esc((statutsLabels()[c.statut] || {}).label || c.statut || '—') + (d ? '<br><span class="col-opt">' + esc(libelleDeja(d)) + '</span>' : '') + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="col-vide">Aucun contact dans ce filtre.' + (tous.length ? '' : ' Importez une liste ci-dessous, ou ajoutez des fiches depuis Rechercher.') + '</td></tr>';
    var n = contactsChoisis().length;
    var cpt = document.getElementById('lot-compte');
    if (cpt) cpt.textContent = n + ' sélectionné' + (n > 1 ? 's' : '') + ' · ' + affiches.length + ' affiché' + (affiches.length > 1 ? 's' : '') + ' sur ' + tous.length;
    majBoutons();
  }

  function majBoutons() {
    var n = contactsChoisis().length;
    var btn = document.getElementById('lot-envoyer'); if (!btn) return;
    var enCours = etat.lot && etat.lot.lot && etat.lot.lot.statut === 'en_cours';
    var dispo = !window.MelodiaMails || window.MelodiaMails.ENVOI_ACTIF !== false;
    btn.disabled = !n || enCours || etat.pompe || !dispo;
    btn.textContent = n ? 'Envoyer à ' + n + ' personne' + (n > 1 ? 's' : '') : 'Envoyer';
    var z = document.getElementById('lot-envoi-etat');
    if (z && !n && !enCours) z.textContent = 'Cochez au moins une personne.';
    else if (z && n && !enCours && !etat.pompe) z.textContent = '';
    var nav = document.getElementById('lot-nav-t');
    if (nav) nav.textContent = n ? 'Aperçu de ' + (Math.min(etat.apercuIdx, n - 1) + 1) + ' sur ' + n : 'Cochez une personne pour voir son aperçu.';
    var prec = document.getElementById('lot-prec'), suiv = document.getElementById('lot-suiv');
    if (prec) prec.disabled = n < 2; if (suiv) suiv.disabled = n < 2;
  }

  // ─── Aperçu personnalisé (rendu par le serveur : ce qu'on voit est ce qui part) ───
  var apercuTimer = null, apercuNum = 0;
  function planifierApercu() {
    clearTimeout(apercuTimer);
    apercuTimer = setTimeout(dessinerApercu, 300);
  }
  function dessinerApercu() {
    var ch = contactsChoisis();
    var iframe = document.getElementById('lot-apercu'); if (!iframe) return;
    var champs = document.getElementById('lot-champs'), suj = document.getElementById('lot-sujet');
    if (!ch.length) { iframe.srcdoc = ''; if (champs) champs.textContent = ''; if (suj) suj.textContent = ''; return; }
    etat.apercuIdx = Math.max(0, Math.min(etat.apercuIdx, ch.length - 1));
    var c = ch[etat.apercuIdx];
    if (champs) {
      champs.innerHTML = 'Champs de fusion : prénom <strong>' + esc(c.prenom || '—') + '</strong> · nom <strong>' + esc(c.nom_famille || '—') +
        '</strong> · civilité <strong>' + esc(c.civilite || '—') + '</strong> · organisation <strong>' + esc(c.organisation || '—') + '</strong>' +
        ((!c.prenom && !c.nom_famille) ? ' — sans nom : « Bonjour, »' : '');
    }
    majBoutons();
    var n = ++apercuNum;
    var C = window.MelodiaCampagne;
    appeler({ mode: 'apercu', modele: etat.modele, envois: [charge(c)], signature: C && C.signature ? C.signature() : {} }).then(function (r) {
      if (n !== apercuNum) return;
      if (r.ok && r.d && r.d.html) { iframe.srcdoc = r.d.html; if (suj) suj.textContent = 'Objet : ' + (r.d.sujet || ''); }
      else { iframe.srcdoc = '<body style="font:15px Helvetica,Arial,sans-serif;padding:24px;color:#3d3a33;">Aperçu indisponible pour le moment.</body>'; if (suj) suj.textContent = ''; }
    });
  }

  // ─── « Déjà envoyé » pour la sélection (même clé que l'envoi) ───
  var dejaTimer = null, dejaNum = 0;
  function planifierDeja() { clearTimeout(dejaTimer); dejaTimer = setTimeout(verifierDeja, 400); }
  function verifierDeja() {
    var ch = contactsChoisis();
    var z = document.getElementById('lot-deja');
    if (!ch.length || !etat.modele) { etat.deja = {}; if (z) { z.hidden = true; } dessinerListe(); return; }
    var n = ++dejaNum;
    appeler({ mode: 'deja', modele: etat.modele, envois: ch.map(function (c) { return { to: c.email }; }) }).then(function (r) {
      if (n !== dejaNum || !r.ok || !r.d || !r.d.deja) return;
      etat.deja = {};
      var nb = 0;
      r.d.deja.forEach(function (x, i) { if (x.deja) { etat.deja[ch[i].cle] = x; nb++; } });
      var zone = document.getElementById('lot-deja');
      if (zone) {
        zone.hidden = !nb;
        zone.textContent = nb ? nb + ' personne' + (nb > 1 ? 's' : '') + ' déjà écrite' + (nb > 1 ? 's' : '') + ' avec ce modèle il y a moins de 2 mois : ' + (nb > 1 ? 'elles seront sautées' : 'elle sera sautée') + ' automatiquement et comptées dans le bilan.' : '';
      }
      dessinerListe();
    });
  }

  // ─── Le lot : création, pompe, affichage ───
  function memoriser(etatLot) {
    try { localStorage.setItem(cleLocale(), JSON.stringify({ id: etatLot.lot.id, instantane: etatLot, le: new Date().toISOString() })); } catch (e) { /* stockage plein */ }
  }
  function lireMemoire() { try { return JSON.parse(localStorage.getItem(cleLocale()) || 'null'); } catch (e) { return null; } }

  function dessinerLot() {
    var z = document.getElementById('lot-etat'); if (!z) return;
    var e = etat.lot;
    if (!e || !e.lot) { z.innerHTML = ''; majBoutons(); return; }
    var c = e.compte, lot = e.lot;
    var enCours = lot.statut === 'en_cours';
    var titre = { en_cours: etat.pompe ? 'Envoi en cours…' : 'Lot en cours (en pause)', termine: 'Lot terminé', quota: 'Lot arrêté : quota Resend atteint', arrete: 'Lot arrêté', annule: 'Lot annulé' }[lot.statut] || 'Lot';
    z.innerHTML = '<section class="lot-bloc lot-suivi lot-' + esc(lot.statut) + '" aria-live="polite">' +
      '<h3 class="lot-t">' + esc(titre) + ' <span class="col-opt">· lot n° ' + esc(lot.id) + (lot.persistant ? '' : ' · état non partagé (migration 13 non appliquée)') + '</span></h3>' +
      '<div class="lot-barre" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + e.progression + '"><span style="width:' + e.progression + '%"></span></div>' +
      '<p class="lot-bilan"><strong>' + esc(e.bilan) + '</strong> · ' + c.total + ' destinataire' + (c.total > 1 ? 's' : '') + '</p>' +
      (lot.note ? '<p class="form-msg err" style="display:block;">' + esc(lot.note) + '</p>' : '') +
      (e.quota ? '<p class="col-aide">Aujourd’hui : ' + e.quota.jour + ' / ' + e.quota.limiteJour + ' · ce mois : ' + e.quota.mois + ' / ' + e.quota.limiteMois + '.</p>' : '') +
      '<div class="lot-actions">' +
        (enCours && !etat.pompe ? '<button type="button" class="btn btn-gold btn-sm" id="lot-continuer">Continuer l’envoi</button>' : '') +
        ((lot.statut === 'quota' || lot.statut === 'arrete' || c.reporte || (c.erreur && e.items.some(function (x) { return x.statut === 'erreur' && x.retentable; }))) && !enCours ? '<button type="button" class="btn btn-gold btn-sm" id="lot-reprendre">Reprendre (reportés et erreurs réessayables)</button>' : '') +
        (enCours || lot.statut === 'quota' || lot.statut === 'arrete' ? '<button type="button" class="btn btn-outline btn-sm" id="lot-annuler">Annuler le reste</button>' : '') +
      '</div>' +
      '<div class="lot-table-wrap"><table class="lot-table"><thead><tr><th>Destinataire</th><th>Résultat</th><th>Détail</th></tr></thead><tbody>' +
        e.items.map(function (x) {
          return '<tr class="lot-st-' + esc(x.statut) + '"><td>' + esc([x.prenom, x.nom_famille].filter(Boolean).join(' ') || '—') + '<br><span class="col-opt">' + esc(x.email) + '</span></td>' +
            '<td><strong>' + esc(LIBELLE_STATUT[x.statut] || x.statut) + '</strong></td><td>' +
            esc(x.statut === 'deja' && x.precedent ? libelleDeja({ statut: 'envoye', precedent: x.precedent, renvoi: x.renvoi }) : (x.detail || '')) + '</td></tr>';
        }).join('') +
      '</tbody></table></div></section>';
    majBoutons();
  }

  function recevoir(r) {
    if (r && r.ok && r.d && r.d.lot) { etat.lot = r.d; memoriser(r.d); dessinerLot(); return true; }
    return false;
  }

  /* La pompe : tant que le lot est « en cours », la console demande un tour de file
     (un tour = quelques envois, au rythme autorisé) ; elle s'arrête si l'on quitte la vue. */
  async function pomper() {
    if (etat.pompe) return;
    etat.pompe = true; dessinerLot();
    try {
      while (etat.lot && etat.lot.lot && etat.lot.lot.statut === 'en_cours' && document.getElementById('lot-etat')) {
        var r = await appeler({ mode: 'lot_traiter', lot_id: etat.lot.lot.id });
        if (!recevoir(r)) {
          var z = document.getElementById('lot-envoi-etat');
          if (z) z.textContent = messageErreur(r);
          break;
        }
        if (r.d.arret) { toast(r.d.arret.message); break; }
      }
    } finally { etat.pompe = false; dessinerLot(); }
    if (etat.lot && etat.lot.lot && etat.lot.lot.statut !== 'en_cours') {
      toast(etat.lot.bilan);
      if (window.MelodiaCampagne && window.MelodiaCampagne.quota) { try { window.MelodiaCampagne.quota(); } catch (e) { /* facultatif */ } }
    }
  }

  function messageErreur(r) {
    var d = (r && r.d) || {};
    if (r.status === 401 || d.code === 'NON_CONNECTE') return 'Session expirée : reconnectez-vous, puis cliquez sur « Continuer l’envoi ». Rien d’autre n’est parti.';
    if (r.status === 403) return 'Votre compte n’a pas le droit d’envoyer : réservé aux comptes commercial et fondateur.';
    if (d.code === 'LOT_EN_COURS') return d.error;
    if (d.code === 'NOT_CONFIGURED' || d.code === 'ENVOI_DESACTIVE') return 'L’envoi direct n’est pas encore activé : rien n’est parti. Utilisez « Copier le mail » en attendant.';
    if (r.status === 0) return 'Le serveur ne répond pas : vérifiez la connexion. Le lot, s’il existe, reprendra avec « Continuer l’envoi ».';
    return d.error || ('Erreur ' + r.status + '.');
  }

  async function envoyer() {
    var ch = contactsChoisis();
    var z = document.getElementById('lot-envoi-etat');
    if (!ch.length) { if (z) z.textContent = 'Cochez au moins une personne.'; return; }
    var m = modeles().filter(function (x) { return x.id === etat.modele; })[0];
    if (!window.confirm('Envoyer « ' + (m ? m.nom : etat.modele) + ' » à ' + ch.length + ' personne' + (ch.length > 1 ? 's' : '') + ' ?\n' +
      'Les doublons de moins de 2 mois sont sautés ; les désabonnés écartés.')) return;
    var C = window.MelodiaCampagne;
    if (z) z.textContent = 'Création du lot…';
    var r = await appeler({ mode: 'lot_creer', modele: etat.modele, destinataires: ch.map(function (c) { return Object.assign(charge(c), { email: c.email, organisation: c.organisation, nom_famille: c.nom_famille, ref: c.siret }); }),
      signature: C && C.signature ? C.signature() : {} });
    if (!recevoir(r)) { if (z) z.textContent = messageErreur(r); return; }
    if (z) z.textContent = '';
    pomper();
  }

  async function agirSurLot(mode) {
    if (!etat.lot || !etat.lot.lot) return;
    var r = await appeler({ mode: mode, lot_id: etat.lot.lot.id });
    if (!recevoir(r)) { var z = document.getElementById('lot-envoi-etat'); if (z) z.textContent = messageErreur(r); return; }
    if (mode === 'lot_reprendre') pomper();
  }

  async function relireDernier() {
    var r = await appeler({ mode: 'lot_etat' });
    if (r.ok && r.d && r.d.lot) { recevoir(r); return; }
    /* Serveur sans mémoire du lot (autre instance, migration 13 absente) : dernier état connu, signalé. */
    var m = lireMemoire();
    if (m && m.instantane) {
      etat.lot = m.instantane;
      etat.lot.lot.note = (etat.lot.lot.note ? etat.lot.lot.note + ' ' : '') + 'Dernier état connu sur cet appareil (' + dateFr(m.le) + ') : le serveur n’a plus ce lot en mémoire.';
      etat.lot.lot.persistant = false;
      if (etat.lot.lot.statut === 'en_cours') etat.lot.lot.statut = 'arrete';
      dessinerLot();
    }
  }

  // ─── Import CSV (collage) ───
  async function analyserCsv() {
    var brut = (document.getElementById('lot-csv') || {}).value || '';
    var zone = document.getElementById('lot-csv-resultat'); if (!zone) return;
    var J = window.MelodiaJulieWasm;
    var parse = null;
    try { if (J && J.csvParser) parse = await J.csvParser(brut); } catch (e) { parse = null; }
    if (!parse || !parse.entetes) { zone.innerHTML = '<p class="form-msg err" style="display:block;">Impossible de lire la liste.</p>'; return; }
    var a = analyserImport(parse, tousContacts().map(function (c) { return c.email; }));
    etat.analyse = a;
    if (a.erreur) { zone.innerHTML = '<p class="form-msg err" style="display:block;">' + esc(a.erreur) + '</p>'; return; }
    var NOMS = { nouveau: 'Nouveau', invalide: 'Invalide', doublon_import: 'Doublon', existant: 'Déjà présent' };
    zone.innerHTML = '<p class="col-aide"><strong>' + a.nouveaux + ' nouveau' + (a.nouveaux > 1 ? 'x' : '') + '</strong> à importer · ' + a.ignores + ' ligne' + (a.ignores > 1 ? 's' : '') + ' ignorée' + (a.ignores > 1 ? 's' : '') + ' (rien n’est écrasé).</p>' +
      '<div class="lot-table-wrap"><table class="lot-table"><thead><tr><th>Ligne</th><th>Personne</th><th>E-mail</th><th>Organisation</th><th>Statut</th></tr></thead><tbody>' +
      a.lignes.map(function (l) {
        var c = l.contact;
        return '<tr class="lot-st-' + (l.statut === 'nouveau' ? 'envoye' : 'erreur') + '"><td>' + l.ligne + '</td><td>' + esc([c.civilite, c.prenom, c.nom_famille].filter(Boolean).join(' ') || '—') + '</td><td>' + esc(c.email || '—') +
          '</td><td>' + esc(c.organisation || '—') + '</td><td><strong>' + esc(NOMS[l.statut]) + '</strong>' + (l.motif ? '<br><span class="col-opt">' + esc(l.motif) + '</span>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (a.nouveaux ? '<div class="lot-actions"><button type="button" class="btn btn-gold btn-sm" id="lot-csv-ecrire">Importer ' + a.nouveaux + ' contact' + (a.nouveaux > 1 ? 's' : '') + '</button></div>' : '');
  }

  async function ecrireImport() {
    var a = etat.analyse; if (!a || !a.nouveaux) return;
    var P = window.MelodiaProspects;
    var nouveaux = a.lignes.filter(function (l) { return l.statut === 'nouveau'; });
    if (!window.confirm('Ajouter ' + nouveaux.length + ' contact' + (nouveaux.length > 1 ? 's' : '') + ' à votre liste ? Aucun courriel ne part.')) return;
    var faits = 0, echecs = 0;
    for (var i = 0; i < nouveaux.length; i++) {
      var fiche = ficheDepuisImport(nouveaux[i].contact);
      try {
        var f = P && P.enregistrer ? await P.enregistrer(fiche) : fiche;
        etat.ajoutes.push(f || fiche); faits++;
      } catch (e) { echecs++; }
    }
    etat.analyse = null;
    var zone = document.getElementById('lot-csv-resultat');
    if (zone) zone.innerHTML = '<p class="form-msg ok" style="display:block;">' + faits + ' contact' + (faits > 1 ? 's' : '') + ' importé' + (faits > 1 ? 's' : '') + '.' + (echecs ? ' ' + echecs + ' en échec : réessayez.' : '') + '</p>';
    var t = document.getElementById('lot-csv'); if (t && !echecs) t.value = '';
    dessinerFiltres(); dessinerListe();
  }

  // ─── Branchement ───
  function brancher() {
    var racine = document.getElementById('view') || document;
    dessinerFiltres(); dessinerListe(); dessinerLot(); majBoutons();

    var q = document.getElementById('lot-q');
    if (q) { q.value = etat.filtre.q; q.addEventListener('input', function () { etat.filtre.q = q.value; dessinerListe(); }); }
    [['lot-org', 'org'], ['lot-ville', 'ville'], ['lot-statut', 'statut']].forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (el) el.addEventListener('change', function () { etat.filtre[p[1]] = el.value; dessinerListe(); });
    });
    var onSel = function () { etat.apercuIdx = 0; dessinerListe(); planifierApercu(); planifierDeja(); };
    var tout = document.getElementById('lot-tout');
    if (tout) tout.addEventListener('click', function () { etat.sel = toutSelectionner(filtrer(tousContacts(), etat.filtre), etat.sel); onSel(); });
    var aucun = document.getElementById('lot-aucun');
    if (aucun) aucun.addEventListener('click', function () { etat.sel = toutDeselectionner(filtrer(tousContacts(), etat.filtre), etat.sel); onSel(); });
    var corps = document.getElementById('lot-corps');
    if (corps) corps.addEventListener('change', function (e) {
      var k = e.target && e.target.getAttribute && e.target.getAttribute('data-sel'); if (!k) return;
      if (e.target.checked) etat.sel[k] = true; else delete etat.sel[k];
      onSel();
    });
    var mod = document.getElementById('lot-modele');
    if (mod) mod.addEventListener('change', function () { etat.modele = mod.value; planifierApercu(); planifierDeja(); });
    var nav = function (d) { var n = contactsChoisis().length; if (!n) return; etat.apercuIdx = (etat.apercuIdx + d + n) % n; planifierApercu(); };
    var prec = document.getElementById('lot-prec'), suiv = document.getElementById('lot-suiv');
    if (prec) prec.addEventListener('click', function () { nav(-1); });
    if (suiv) suiv.addEventListener('click', function () { nav(1); });
    var env = document.getElementById('lot-envoyer');
    if (env) env.addEventListener('click', envoyer);
    var zEtat = document.getElementById('lot-etat');
    if (zEtat) zEtat.addEventListener('click', function (e) {
      var id = e.target && e.target.id;
      if (id === 'lot-continuer') pomper();
      else if (id === 'lot-reprendre') agirSurLot('lot_reprendre');
      else if (id === 'lot-annuler') { if (window.confirm('Annuler les envois restants ? Ce qui est déjà parti reste parti.')) agirSurLot('lot_annuler'); }
    });
    var an = document.getElementById('lot-csv-analyser');
    if (an) an.addEventListener('click', analyserCsv);
    var zr = document.getElementById('lot-csv-resultat');
    if (zr) zr.addEventListener('click', function (e) { if (e.target && e.target.id === 'lot-csv-ecrire') ecrireImport(); });
    void racine;

    planifierApercu(); planifierDeja();
    if (!etat.lot) relireDernier();
  }

  window.MelodiaLot = Object.assign({
    attacher: function (o) { if (o && o.prospects) lireProspects = o.prospects; },
    vue: vue, brancher: brancher
  }, api);
})(typeof window !== 'undefined' ? window : globalThis);
