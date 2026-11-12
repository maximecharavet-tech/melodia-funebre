/*!
 * julie-fallback.js — Console Julie v2 : repli JavaScript pur du noyau Rust.
 * Utilisé seulement si julie_v2.wasm ne se charge pas (navigateur ancien,
 * réseau, CSP). Mêmes entrées, mêmes formes de sortie que le wasm, règles
 * simplifiées. Aucune dépendance. License: internal.
 */
(function () {
  'use strict';
  function sansAccent(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function couleur(t) { return t <= 25 ? 'ash' : t <= 50 ? 'bone' : t <= 75 ? 'or' : 'or-bright'; }

  function score_prospect(p) {
    p = p || {};
    if (p.oppose || p.rejete) return { score: 0, contributions: [], couleur: 'ash', motif_zero: p.oppose ? 'A demandé STOP' : 'Adresse rejetée' };
    var c = [];
    function add(l, n) { c.push({ label: l, points: n }); }
    var t = p.type || p.type_ || '';
    if (t === 'funeraire') add('Pompes funèbres', 20); else if (t === 'crematorium') add('Crématorium', 15); else if (t === 'marbrier') add('Marbrier', 10);
    if ((p.etablissements || 0) >= 2) add('Plusieurs établissements', 10);
    if (/(10|20|50|\+)/.test(String(p.effectif || ''))) add('Effectif conséquent', 5);
    if (p.email) add('E-mail connu', 10);
    if (p.site) add('Site web', 5);
    if (p.dirigeant) add('Dirigeant identifié', 5);
    var ev = p.evenements || [];
    var o = ev.filter(function (e) { return e.kind === 'ouvert'; }).length;
    var k = ev.filter(function (e) { return e.kind === 'clique'; }).length;
    if (o) add('Ouvertures', Math.min(15, o * 5));
    if (k) add('Clics', Math.min(20, k * 10));
    if (ev.some(function (e) { return e.kind === 'repondu'; })) add('A répondu', 25);
    if (p.departement && (p.departements_prioritaires || []).indexOf(p.departement) >= 0) add('Département prioritaire', 5);
    var tot = Math.max(0, Math.min(100, c.reduce(function (a, x) { return a + x.points; }, 0)));
    return { score: tot, contributions: c, couleur: couleur(tot), motif_zero: tot ? null : 'Aucun signal' };
  }

  var MOTS_SPAM = ['gratuit !', 'urgent', '100 %', 'cliquez ici', 'offre limitée', '€€€', 'promo'];
  function delivrabilite_verifier(e) {
    e = e || {};
    var s = 100, pb = [], ok = [];
    var objet = String(e.objet || '');
    if (!objet) { s -= 25; pb.push('Objet vide'); }
    else if (objet.length > 70) { s -= 10; pb.push('Objet trop long (> 70 caractères)'); }
    else ok.push('Objet de bonne longueur');
    if (/[A-Z]{6,}/.test(objet)) { s -= 10; pb.push('Majuscules en série dans l’objet'); }
    if (/!{2,}|\?{2,}/.test(objet)) { s -= 8; pb.push('Ponctuation excessive'); }
    var txt = sansAccent(e.texte);
    var spam = MOTS_SPAM.filter(function (m) { return txt.indexOf(m) >= 0; });
    if (spam.length) { s -= 6 * spam.length; pb.push('Mots sensibles : ' + spam.join(', ')); }
    if (!e.preheader) { s -= 5; pb.push('Pré-en-tête absent'); } else ok.push('Pré-en-tête présent');
    if ((e.liens || []).length > 4) { s -= 8; pb.push('Trop de liens'); }
    if ((e.poids_pieces_octets || 0) > 5000000) { s -= 15; pb.push('Pièces jointes trop lourdes (> 5 Mo)'); }
    if ((e.variables_non_resolues || []).length) { s -= 20; pb.push('Variables non remplies : ' + e.variables_non_resolues.join(' ')); }
    if (e.personnalise) ok.push('Message personnalisé'); else { s -= 5; pb.push('Peu personnalisé'); }
    if (e.a_desabonnement) ok.push('Mention STOP présente'); else { s -= 15; pb.push('Mention de désinscription absente'); }
    s = Math.max(0, Math.min(100, s));
    var note = s >= 90 ? 'A' : s >= 75 ? 'B' : s >= 60 ? 'C' : s >= 45 ? 'D' : s >= 30 ? 'E' : 'F';
    return { score: s, note: note, problemes: pb, ok: ok };
  }

  function csv_parser(o) {
    var t = String((o && o.texte) || '').replace(/^\uFEFF/, '');
    var l1 = t.split(/\r?\n/)[0] || '';
    var sep = [';', ',', '\t', '|'].sort(function (a, b) { return l1.split(b).length - l1.split(a).length; })[0];
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < t.length; i++) {
      var ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cell.trim()); cell = ''; if (row.some(Boolean)) rows.push(row); row = []; }
      else cell += ch;
    }
    row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
    return { entetes: rows[0] || [], lignes: rows.slice(1), separateur: sep === '\t' ? '\\t' : sep };
  }

  var ALIAS = [['nom', ['nom', 'raison sociale', 'agence', 'entreprise', 'nom commercial', 'societe']], ['email', ['email', 'e-mail', 'courriel', 'mail', 'adresse email']], ['tel', ['tel', 'telephone', 'phone', 'portable']], ['site', ['site', 'web', 'url', 'site web', 'site internet']], ['ville', ['ville', 'commune', 'localite']], ['cp', ['cp', 'code postal', 'zip', 'postal']], ['siret', ['siret', 'siren', 'num siret']], ['dirigeant', ['dirigeant', 'directeur', 'gerant', 'responsable', 'president']], ['type', ['type', 'categorie', 'secteur', 'activite']], ['adresse', ['adresse', 'rue', 'voie']], ['departement', ['departement', 'dep']], ['effectif', ['effectif', 'taille', 'salaries']]];
  function csv_detecter_colonnes(ent) {
    var m = {}, r = [], inc = [];
    (ent || []).forEach(function (h) {
      var n = sansAccent(h), champ = null;
      ALIAS.forEach(function (a) { if (!champ && a[1].indexOf(n) >= 0) champ = a[0]; });
      ALIAS.forEach(function (a) { if (!champ && a[1].some(function (x) { return n.indexOf(x) >= 0 || (n && x.indexOf(n) >= 0); })) champ = a[0]; });
      if (champ) { m[h] = champ; r.push(h); } else inc.push(h);
    });
    return { mapping: m, colonnes_reconnues: r, colonnes_inconnues: inc };
  }

  function bigrammes(s) { s = sansAccent(s).replace(/[^a-z0-9]/g, ''); var b = []; for (var i = 0; i < s.length - 1; i++) b.push(s.slice(i, i + 2)); return b; }
  function similarite(o) {
    var a = bigrammes(o && o.a), b = bigrammes(o && o.b);
    if (!a.length || !b.length) return { score: 0, methode: 'dice-js' };
    var inter = 0, bb = b.slice();
    a.forEach(function (x) { var i = bb.indexOf(x); if (i >= 0) { inter++; bb.splice(i, 1); } });
    return { score: Math.round(200 * inter / (a.length + b.length)) / 100, methode: 'dice-js' };
  }
  function dedupe_cle(o) {
    o = o || {};
    return { siret: String(o.siret || '').replace(/\D/g, '').slice(0, 14), email: String(o.email || '').trim().toLowerCase(), nom_cp: sansAccent(o.nom).replace(/[^a-z0-9]/g, '') + '|' + String(o.cp || '').trim() };
  }
  function envoi_cle(o) {
    o = o || {};
    var dest = String(o.destinataire || '').trim().toLowerCase();
    var modele = String(o.modele || '').trim().toLowerCase();
    var campagne = String(o.campagne || '').trim().toLowerCase();
    var portee = modele ? 'm:' + modele : campagne ? 'c:' + campagne
      : 'o:' + String(o.sujet || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 120);
    if (o.etape !== null && o.etape !== undefined && o.etape !== '' && isFinite(Number(o.etape))) portee += '#e' + Number(o.etape);
    return { cle: dest + '|' + portee };
  }
  function envoi_fenetre(o) {
    o = o || {};
    var renvoi = Number(o.precedent_ms) + 60 * 24 * 3600 * 1000;
    var bloque = Number(o.maintenant_ms) < renvoi;
    return { bloque: bloque, renvoi_ms: renvoi, jours_restants: bloque ? Math.ceil((renvoi - Number(o.maintenant_ms)) / 86400000) : 0 };
  }
  var DOM = { 'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmail.fr': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmal.fr': 'hotmail.fr', 'oranje.fr': 'orange.fr', 'orange.com': 'orange.fr', 'wanado.fr': 'wanadoo.fr', 'yahou.fr': 'yahoo.fr', 'free.com': 'free.fr', 'laposte.fr': 'laposte.net', 'outlok.fr': 'outlook.fr' };
  function domaine_suggere(o) { return { suggestion: DOM[String((o && o.domaine) || '').toLowerCase()] || null }; }

  function paques(y) { var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return Date.UTC(y, mo - 1, da); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function jours_feries_annee(o) {
    var y = Number((o && o.annee) || new Date().getFullYear()), p = paques(y), J = 86400000;
    return ['01-01', '05-01', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25'].map(function (d) { return y + '-' + d; })
      .concat([iso(p + J), iso(p + 39 * J), iso(p + 50 * J)]).sort();
  }

  function meilleur_creneau(o) {
    o = o || {};
    var best = null;
    (o.cases || []).forEach(function (c) { if (c.envois >= 3) { var t = c.ouverts / c.envois; if (!best || t > best.t) best = { c: c, t: t }; } });
    var jour = best ? best.c.jour_semaine : 2, heure = best ? best.c.heure : 9;
    var base = new Date(String(o.maintenant || new Date().toISOString()).slice(0, 10) + 'T12:00:00Z');
    var feries = jours_feries_annee({ annee: base.getUTCFullYear() });
    for (var i = 1; i <= 14; i++) {
      var d = new Date(base.getTime() + i * 86400000), js = d.getUTCDay() || 7, s = iso(d.getTime());
      if (js <= 5 && feries.indexOf(s) < 0 && (!best || js === jour || i > 7)) {
        return { iso: s + 'T' + (heure < 10 ? '0' : '') + heure + ':10:00+01:00', jour_semaine: js, heure: heure, minute: 10, confiance: best ? Math.min(1, best.c.envois / 30) : 0.2, motif: best ? 'Meilleur taux d’ouverture observé' : 'Mardi–jeudi matin, hors jours fériés (par défaut)' };
      }
    }
    return { iso: o.maintenant || '', jour_semaine: 2, heure: 9, minute: 10, confiance: 0, motif: 'Par défaut' };
  }

  function sequence_prochaine_etape(o) {
    o = o || {};
    var sortie = o.oppose ? 'STOP demandé' : o.rejete ? 'Adresse rejetée' : o.a_repondu ? 'A répondu' : ['interesse', 'partenaire', 'refus', 'demo_offerte'].indexOf(o.statut) >= 0 ? 'Statut ' + o.statut : null;
    var et = o.etapes || [], i = o.etapes_faites || 0;
    if (sortie || i >= et.length) return { terminee: true, index: i, date_iso: '', modele: '', canal: '', brochures: [], cle_idempotence: '', motif: sortie || 'Séquence terminée', motif_sortie: sortie };
    var e = et[i], d = new Date(new Date(String(o.debut_iso || new Date().toISOString())).getTime() + (e.jour || 0) * 86400000);
    var js = d.getUTCDay(); if (js === 6) d = new Date(d.getTime() + 2 * 86400000); if (js === 0) d = new Date(d.getTime() + 86400000);
    return { terminee: false, index: i, date_iso: iso(d.getTime()), modele: e.modele || '', canal: e.canal || 'mail', brochures: e.brochures || [], cle_idempotence: (o.prospect_siret || '') + ':' + i + ':' + (e.modele || ''), motif: 'Étape ' + (i + 1) + ' sur ' + et.length, motif_sortie: null };
  }

  window.MelodiaJulieFallback = {
    score_prospect: score_prospect, delivrabilite_verifier: delivrabilite_verifier, csv_parser: csv_parser,
    csv_detecter_colonnes: csv_detecter_colonnes, similarite: similarite, dedupe_cle: dedupe_cle, envoi_cle: envoi_cle, envoi_fenetre: envoi_fenetre,
    domaine_suggere: domaine_suggere, meilleur_creneau: meilleur_creneau,
    sequence_prochaine_etape: sequence_prochaine_etape, jours_feries_annee: jours_feries_annee
  };
})();
