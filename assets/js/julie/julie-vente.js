/*!
 * julie-vente.js — Console Julie · règles de vente, sans écran.
 *
 * Fonctions pures, partagées par le mode appel, la fiche agence, le pipeline,
 * Ma journée et la proposition PDF. Chargé dans le navigateur
 * (window.MelodiaVente) et dans Node pour les tests (module.exports).
 *
 *   - les issues d'un appel et ce qu'elles écrivent sur la fiche ;
 *   - la règle « aucune fiche ouverte sans prochaine action » ;
 *   - les chiffres du jour (appels, relances) relus dans le journal des fiches,
 *     donc identiques sur tous les appareils ;
 *   - la chronologie unique d'une fiche (journal + envois) ;
 *   - le calcul et le dessin de la proposition de partenariat.
 *
 * Aucune donnée de famille ni de défunt n'entre ici : seulement l'agence,
 * les offres publiques et les titres des œuvres du catalogue.
 *
 * License: internal.
 */
(function (racine, fabrique) {
  'use strict';
  var api = fabrique();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (racine) racine.MelodiaVente = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var JOUR_MS = 86400000;

  /* ─── Dates (jour civil à Paris) ─────────────────────────────────── */
  function jourParis(d) {
    var date = d instanceof Date ? d : new Date(d == null ? Date.now() : d);
    var f = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
    return f.format(date); // AAAA-MM-JJ
  }

  /** Ajoute n jours ouvrés à un jour AAAA-MM-JJ (samedi et dimanche sautés). */
  function plusJoursOuvres(iso, n) {
    var d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z');
    var reste = Math.max(0, Math.floor(n));
    while (reste > 0) {
      d = new Date(d.getTime() + JOUR_MS);
      var j = d.getUTCDay();
      if (j !== 0 && j !== 6) reste--;
    }
    return d.toISOString().slice(0, 10);
  }

  /* ─── Statuts ────────────────────────────────────────────────────── */
  /* Une fiche close n'attend plus d'action : refus, ou opposition (STOP). */
  function estClose(p) {
    return !!(p && (p.oppose || p.statut === 'refus'));
  }

  /* ─── Types de prochaine action ──────────────────────────────────── */
  var TYPES_ACTION = {
    appel: 'Appeler',
    mail: 'Écrire',
    visite: 'Passer à l’agence',
    rdv: 'Rendez-vous',
    attendre: 'Attendre leur retour'
  };

  function libelleAction(type) { return TYPES_ACTION[type] || 'Action'; }

  /** « appel|Rappeler après la réunion d'équipe » → { type, texte }. */
  function lireProchaineAction(valeur) {
    var s = String(valeur || '');
    var i = s.indexOf('|');
    if (i < 0) return { type: s && TYPES_ACTION[s] ? s : (s ? 'appel' : ''), texte: TYPES_ACTION[s] ? '' : s };
    var type = s.slice(0, i);
    return { type: TYPES_ACTION[type] ? type : 'appel', texte: s.slice(i + 1) };
  }

  function ecrireProchaineAction(type, texte) {
    var t = TYPES_ACTION[type] ? type : 'appel';
    return t + '|' + String(texte || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  }

  /**
   * Valide une prochaine action saisie.
   * @returns {{ok:boolean, erreur?:string}}
   */
  function validerProchaineAction(o) {
    o = o || {};
    if (o.statut === 'refus' || o.oppose) return { ok: true };
    var date = String(o.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, erreur: 'Choisissez la date de la prochaine action.' };
    var auj = String(o.aujourdhui || jourParis()).slice(0, 10);
    if (date < auj) return { ok: false, erreur: 'La date est déjà passée.' };
    if (date > plusJoursOuvres(auj, 130)) return { ok: false, erreur: 'Plus de six mois : choisissez une date plus proche.' };
    if (!TYPES_ACTION[o.type]) return { ok: false, erreur: 'Choisissez le type d’action.' };
    return { ok: true };
  }

  /** Fiche ouverte sans date de prochaine action (ou avec une date oubliée depuis plus de 30 jours). */
  function sansProchaineAction(p, aujourdhui) {
    /* Une fiche « À contacter » n'est pas encore engagée : elle vit dans « Nouveaux à contacter ». */
    if (!p || estClose(p) || (p.statut || 'nouveau') === 'nouveau') return false;
    var r = String(p.relance_le || p.relance || '').slice(0, 10);
    if (!r) return true;
    var auj = String(aujourdhui || jourParis()).slice(0, 10);
    var ecart = (Date.parse(auj + 'T12:00:00Z') - Date.parse(r + 'T12:00:00Z')) / JOUR_MS;
    return ecart > 30;
  }

  /* ─── Issues d'un appel ──────────────────────────────────────────── */
  var ISSUES = [
    { id: 'interesse', label: 'Joint — intéressé', statut: 'interesse', jours: 2, action: 'appel', texte: 'Rappeler pour fixer l’écoute ou le rendez-vous', journal: 'Appel — intéressé' },
    { id: 'rappeler', label: 'Joint — à rappeler', statut: null, jours: 3, action: 'appel', texte: 'Rappeler comme convenu', journal: 'Appel — à rappeler' },
    { id: 'messagerie', label: 'Messagerie / pas de réponse', statut: null, jours: 2, action: 'appel', texte: 'Nouvel essai d’appel', journal: 'Appel — messagerie' },
    { id: 'interlocuteur', label: 'Pas le bon interlocuteur', statut: null, jours: 2, action: 'appel', texte: 'Demander le responsable', journal: 'Appel — mauvais interlocuteur' },
    { id: 'stop', label: 'Ne plus contacter', statut: 'refus', jours: 0, action: '', texte: '', journal: 'Appel — opposition (ne plus contacter)', oppose: true }
  ];

  function issue(id) {
    for (var i = 0; i < ISSUES.length; i++) if (ISSUES[i].id === id) return ISSUES[i];
    return null;
  }

  /**
   * Ce qu'une issue d'appel écrit sur la fiche.
   * Le statut n'avance jamais à rebours : « à rappeler » ne fait pas
   * redescendre une agence déjà « intéressée ».
   * @returns {{statut, relance_le, prochaine_action, oppose, journal:{quoi,detail}}|null}
   */
  function appliquerIssue(p, id, o) {
    var is = issue(id);
    if (!is) return null;
    o = o || {};
    var auj = String(o.aujourdhui || jourParis()).slice(0, 10);
    var note = String(o.note || '').replace(/\s+/g, ' ').trim().slice(0, 400);
    var ordre = ['nouveau', 'contacte', 'relance', 'interesse', 'demo_offerte', 'partenaire'];
    var actuel = (p && p.statut) || 'nouveau';
    var statut = actuel;
    if (is.oppose) statut = 'refus';
    else if (is.statut && ordre.indexOf(is.statut) > ordre.indexOf(actuel)) statut = is.statut;
    else if (actuel === 'nouveau') statut = 'contacte';
    var date = is.oppose ? '' : (o.date && /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : plusJoursOuvres(auj, is.jours));
    return {
      statut: statut,
      oppose: !!is.oppose || !!(p && p.oppose),
      relance_le: date,
      prochaine_action: is.oppose ? '' : ecrireProchaineAction(is.action, o.texte || is.texte),
      journal: { quoi: is.journal, detail: note }
    };
  }

  /* ─── Chiffres du jour, relus dans les fiches ────────────────────── */
  function faitsDuJour(prospects, aujourdhui, envoisDuJour) {
    var auj = String(aujourdhui || jourParis()).slice(0, 10);
    var faits = { mails: Number(envoisDuJour) || 0, appels: 0, relances: 0 };
    (prospects || []).forEach(function (p) {
      (Array.isArray(p && p.journal) ? p.journal : []).forEach(function (j) {
        if (!j || !j.le) return;
        if (jourParis(j.le) !== auj) return;
        var q = String(j.quoi || '').toLowerCase();
        if (q.indexOf('appel') === 0) faits.appels++;
        else if (q.indexOf('relance') === 0) faits.relances++;
      });
    });
    return faits;
  }

  var OBJECTIF_DEFAUT = { mails: 30, appels: 5, relances: 3 };

  function objectifPropre(o) {
    o = o || {};
    function n(v, d) { v = Math.floor(Number(v)); return isFinite(v) && v >= 0 && v <= 500 ? v : d; }
    return { mails: n(o.mails, OBJECTIF_DEFAUT.mails), appels: n(o.appels, OBJECTIF_DEFAUT.appels), relances: n(o.relances, OBJECTIF_DEFAUT.relances) };
  }

  /* ─── Chronologie unique d'une fiche ─────────────────────────────── */
  var LIB_ENVOI = { envoye: 'envoyé', delivre: 'délivré', ouvert: 'ouvert', clique: 'lien ouvert', differe: 'différé', rejete: 'rejeté', plainte: 'signalé' };

  function chronologie(p, envois) {
    var lignes = [];
    (Array.isArray(p && p.journal) ? p.journal : []).forEach(function (j) {
      if (!j || !j.le) return;
      lignes.push({ le: j.le, genre: 'note', quoi: String(j.quoi || ''), detail: String(j.detail || ''), par: j.par || '' });
    });
    var adresse = String((p && p.email) || '').toLowerCase();
    (Array.isArray(envois) ? envois : []).forEach(function (e) {
      if (!e) return;
      var dest = String(e.destinataire || e.to || '').toLowerCase();
      if (adresse && dest && dest !== adresse) return;
      if (e.mode === 'test') return;
      var le = e.envoye_le || e.le || e.created_at;
      if (!le) return;
      lignes.push({ le: le, genre: 'courriel', quoi: 'Courriel — ' + (e.sujet || e.modele || 'sans objet'),
        detail: LIB_ENVOI[e.statut] || String(e.statut || ''), par: '' });
    });
    lignes.sort(function (a, b) { return String(b.le).localeCompare(String(a.le)); });
    return lignes;
  }

  /* ─── Proposition de partenariat ─────────────────────────────────── */
  var PART_AGENCE = 0.6;

  function offresDepuisContenu(contenu) {
    var liste = (contenu && Array.isArray(contenu.offers)) ? contenu.offers : [];
    return liste.filter(function (o) { return o && o.name && Number(o.price) > 0; }).map(function (o) {
      var prix = Number(o.price);
      return { id: String(o.id || ''), nom: String(o.name), prix: prix, agence: Math.round(prix * PART_AGENCE), mise: !!o.featured };
    });
  }

  /**
   * Estimation prudente. ceremonies = cérémonies par an ; part = % de familles
   * qui choisiraient une œuvre (défaut 5 %). Calcul sur l'offre mise en avant
   * (Prestige) : c'est une estimation, pas un engagement.
   */
  function calculerProposition(o) {
    o = o || {};
    var offres = Array.isArray(o.offres) ? o.offres : [];
    var ceremonies = Math.max(0, Math.min(5000, Math.floor(Number(o.ceremonies) || 0)));
    var part = Number(o.part);
    if (!isFinite(part) || part <= 0) part = 5;
    part = Math.min(50, part);
    var reference = offres.filter(function (x) { return x.mise; })[0] || offres[1] || offres[0] || null;
    var familles = Math.round(ceremonies * part / 100);
    return {
      ceremonies: ceremonies,
      part: part,
      familles: familles,
      reference: reference,
      parAn: reference ? familles * reference.agence : 0,
      offres: offres
    };
  }

  function limace(texte) {
    return String(texte || '')
      .replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'hommage';
  }

  /** Œuvres du catalogue public : titre, style, lien d'écoute. Jamais le prénom ni l'histoire du défunt. */
  function oeuvresDepuisContenu(contenu, site, parrain) {
    var base = String(site || 'https://melodia-funebre.fr').replace(/\/+$/, '');
    var suffixe = parrain && /^[a-z0-9-]{2,40}$/.test(parrain) ? '?parrain=' + parrain : '';
    return ((contenu && contenu.demos) || []).filter(function (d) {
      return d && d.visible !== false && d.title && d.audio;
    }).map(function (d) {
      return { id: String(d.id || ''), titre: String(d.title), style: String(d.style || ''), url: base + '/ecouter/' + limace(d.title) + suffixe };
    });
  }

  function euros(n) {
    var s = String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return s + '\u00a0€';
  }

  /**
   * Dessine la proposition (A4, une page) sur un écrivain Pdf (assets/js/pro/pdf.js).
   * qr(texte) → { modules: bool[][], taille } (window.MelodiaQR.matrice), facultatif.
   */
  function dessinerProposition(pdf, d, qr) {
    d = d || {};
    var NOIR = '#0b0a08', OR = '#9a7b2f', ENCRE = '#17150f', GRIS = '#6a6453', TRAIT = '#d9d2c2';
    var c = d.calcul || calculerProposition({});
    var agence = d.agence || {};
    pdf.page(210, 297);
    pdf.rect(0, 0, 210, 20, { fond: NOIR });
    pdf.texte('MELODIA FUNÈBRE', 20, 12.5, { police: 'mono', taille: 9, couleur: '#c9a84c' });
    pdf.texte('Proposition de partenariat', 190, 12.5, { police: 'sans', taille: 9, couleur: '#f2efe8', align: 'droite' });

    var y = 38;
    pdf.texte('Pour ' + (agence.nom || 'votre maison'), 20, y, { police: 'italique', taille: 22, couleur: ENCRE });
    y += 7;
    pdf.texte([agence.ville, d.date].filter(Boolean).join(' · '), 20, y, { police: 'sans', taille: 9, couleur: GRIS });
    y += 10;
    y = pdf.paragraphe('Une œuvre musicale originale, composée pour le défunt à partir de ce que la famille raconte. ' +
      'Vous la proposez, nous composons, l’œuvre est livrée en vingt-quatre heures. Votre maison conserve soixante pour cent du montant payé par la famille.',
      20, y, 170, { police: 'serif', taille: 11, couleur: ENCRE }) + 4;

    pdf.texte('CE QUE CONSERVE VOTRE MAISON', 20, y, { police: 'mono', taille: 8, couleur: OR });
    pdf.ligne(20, y + 2, 190, y + 2, { trait: TRAIT, epaisseur: 0.2 });
    y += 9;
    (c.offres || []).forEach(function (o) {
      pdf.texte(o.nom + (o.mise ? '  ·  la plus choisie' : ''), 20, y, { police: 'serif', taille: 12, couleur: ENCRE });
      pdf.texte('Prix famille ' + euros(o.prix), 120, y, { police: 'sans', taille: 9, couleur: GRIS, align: 'droite' });
      pdf.texte(euros(o.agence) + ' pour vous', 190, y, { police: 'gras', taille: 10, couleur: ENCRE, align: 'droite' });
      y += 7;
    });
    y += 3;

    if (c.ceremonies > 0 && c.reference) {
      pdf.rect(20, y, 170, 22, { fond: '#f6f2e8', r: 2 });
      pdf.texte('ESTIMATION PRUDENTE', 26, y + 7, { police: 'mono', taille: 8, couleur: OR });
      pdf.texte(c.ceremonies + ' cérémonies par an × ' + String(c.part).replace('.', ',') + ' % de familles = ' + c.familles + ' œuvre' + (c.familles > 1 ? 's' : '') +
        ' (' + c.reference.nom + ')', 26, y + 13.5, { police: 'serif', taille: 11, couleur: ENCRE });
      pdf.texte('Environ ' + euros(c.parAn) + ' par an pour votre maison. Une estimation, pas un engagement.', 26, y + 19, { police: 'sans', taille: 9, couleur: GRIS });
      y += 30;
    }

    pdf.texte('COMMENT CELA SE PASSE', 20, y, { police: 'mono', taille: 8, couleur: OR });
    pdf.ligne(20, y + 2, 190, y + 2, { trait: TRAIT, epaisseur: 0.2 });
    y += 9;
    [
      'Vous présentez l’offre aux familles qui parlent du défunt avec des détails.',
      'Le brief prend cinq minutes, avec la famille ou à sa place.',
      'L’œuvre est livrée en vingt-quatre heures, présentée à la famille avant la cérémonie.',
      'Aucun investissement, aucun stock, aucun minimum, aucun engagement de durée.',
      'Un essai gratuit pour votre maison : un extrait composé de deux minutes trente.'
    ].forEach(function (l) {
      pdf.texte('—', 20, y, { police: 'serif', taille: 11, couleur: OR });
      y = pdf.paragraphe(l, 27, y, 163, { police: 'serif', taille: 11, couleur: ENCRE }) + 0.5;
    });
    y += 4;

    var oeuvres = (d.oeuvres || []).slice(0, 3);
    if (oeuvres.length) {
      pdf.texte('À ÉCOUTER', 20, y, { police: 'mono', taille: 8, couleur: OR });
      pdf.ligne(20, y + 2, 190, y + 2, { trait: TRAIT, epaisseur: 0.2 });
      y += 6;
      var largeur = 170 / oeuvres.length;
      oeuvres.forEach(function (o, i) {
        var x = 20 + i * largeur;
        if (typeof qr === 'function') {
          try {
            var m = qr(o.url);
            var cote = 24, n = m.taille, pas = cote / n;
            pdf.rect(x, y, cote, cote, { fond: '#ffffff' });
            for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) {
              if (m.modules[r][k]) pdf.rect(x + k * pas, y + r * pas, pas + 0.02, pas + 0.02, { fond: NOIR });
            }
          } catch (e) { /* sans QR : le lien suffit */ }
        }
        pdf.texte(o.titre, x, y + 30, { police: 'italique', taille: 10, couleur: ENCRE });
        if (o.style) pdf.texte(o.style, x, y + 34.5, { police: 'sans', taille: 8, couleur: GRIS });
      });
      y += 42;
    }

    var ct = d.contact || {};
    var yc = Math.max(y + 4, 262);
    pdf.ligne(20, yc, 190, yc, { trait: TRAIT, epaisseur: 0.2 });
    pdf.texte(ct.nom || 'Melodia Funèbre', 20, yc + 7, { police: 'serif', taille: 12, couleur: ENCRE });
    if (ct.role) pdf.texte(ct.role, 20, yc + 12, { police: 'sans', taille: 9, couleur: GRIS });
    pdf.texte([ct.email, ct.tel].filter(Boolean).join('  ·  '), 190, yc + 7, { police: 'sans', taille: 9, couleur: ENCRE, align: 'droite' });
    pdf.texte('melodia-funebre.fr', 190, yc + 12, { police: 'sans', taille: 9, couleur: GRIS, align: 'droite' });
    pdf.texte('Composé par Melodia Funèbre · Chaque vie mérite sa chanson.', 105, 288, { police: 'italique', taille: 9, couleur: OR, align: 'centre' });
    return pdf;
  }

  /* ─── Les cinq espaces du menu ───────────────────────────────────── */
  var ESPACES = [
    { titre: 'Aujourd’hui', vues: ['journee', 'appels', 'relances', 'rappels', 'agenda'] },
    { titre: 'Prospects', vues: ['pipeline', 'prospects', 'recherche', 'import'] },
    { titre: 'Écrire', vues: ['composer', 'pret', 'lot', 'sequences', 'suivi', 'mails', 'modeles', 'boite', 'messagerie'] },
    { titre: 'Ressources', vues: ['playbook', 'ecoute', 'kit', 'catalogue', 'traditions', 'faq', 'social', 'posts', 'plan', 'atelier', 'checklist'] },
    { titre: 'Mon poste', vues: ['accueil', 'analyse', 'simulateur', 'profil', 'julie', 'compte'] }
  ];

  return {
    JOUR_MS: JOUR_MS,
    jourParis: jourParis,
    plusJoursOuvres: plusJoursOuvres,
    estClose: estClose,
    TYPES_ACTION: TYPES_ACTION,
    libelleAction: libelleAction,
    lireProchaineAction: lireProchaineAction,
    ecrireProchaineAction: ecrireProchaineAction,
    validerProchaineAction: validerProchaineAction,
    sansProchaineAction: sansProchaineAction,
    ISSUES: ISSUES,
    issue: issue,
    appliquerIssue: appliquerIssue,
    faitsDuJour: faitsDuJour,
    OBJECTIF_DEFAUT: OBJECTIF_DEFAUT,
    objectifPropre: objectifPropre,
    chronologie: chronologie,
    PART_AGENCE: PART_AGENCE,
    offresDepuisContenu: offresDepuisContenu,
    calculerProposition: calculerProposition,
    oeuvresDepuisContenu: oeuvresDepuisContenu,
    limace: limace,
    euros: euros,
    dessinerProposition: dessinerProposition,
    ESPACES: ESPACES
  };
});
