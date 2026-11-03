/* ═══════════════════════════════════════════════════════════════
   collaborateur-espace.js — Profil, atelier, outils

   Branché dans la console commerciale. Les chiffres viennent des
   fiches réellement chargées. Les ventes et les commissions n’ont
   pas de colonne dans les commandes : on affiche un vide, pas un zéro
   inventé. Aucun envoi de courriel ne part d’ici.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SITE = 'https://melodia-funebre.fr';
  var JULIE = 'julie@melodia-funebre.fr';
  var lireProspects = function () { return []; };
  var aller = function () {};
  var pretEtat = { id: 'seq-1', layout: '', siret: '', vars: {}, pisteId: '', creerFiche: false, dest: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(t) { if (window.melodiaToast) window.melodiaToast(t); }
  function utilisateur() { return (window.MelodiaAuth && window.MelodiaAuth.current()) || {}; }
  function signatureDe(email, secours) {
    if (window.MelodiaSignature) return window.MelodiaSignature.pour(Object.assign({ email: email, role: 'commercial' }, secours || {}));
    return { email: email, nom: (secours && secours.name) || email, role: '', photo: '', bio: '', tel: '', code: '' };
  }
  function cle(email, quoi) { return 'melodia_col_' + quoi + '_' + String(email || '').toLowerCase(); }
  function lire(email, quoi, defaut) {
    try { var v = JSON.parse(localStorage.getItem(cle(email, quoi)) || ''); return v == null ? defaut : v; }
    catch (e) { return defaut; }
  }
  function ecrire(email, quoi, v) {
    try { localStorage.setItem(cle(email, quoi), JSON.stringify(v)); } catch (e) {}
  }
  function moisCourant() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  /* ─── Qui regarde quelle fiche ─── */
  function cible(nomVue) {
    var u = utilisateur();
    if (nomVue === 'julie') {
      var pub = window.MelodiaSignature && window.MelodiaSignature.declaree(JULIE);
      return pub || signatureDe(JULIE, { name: 'Julie Serve' });
    }
    var email = String(u.email || '').toLowerCase();
    var s = signatureDe(email, u);
    /* La fiche publique de Julie reste dans le menu à son nom.
       « Mon profil » est le compte connecté, même quand c'est elle. */
    if (String(s.email || '').toLowerCase() === JULIE) {
      return Object.assign({}, s, {
        graine: false,
        bio: 'Votre fiche de travail. La fiche publique est dans le menu « Julie Serve ».'
      });
    }
    return s;
  }

  function fichesPour(email) {
    var u = utilisateur();
    var tous = lireProspects() || [];
    var moi = String(u.email || '').toLowerCase() === String(email || '').toLowerCase();
    if (moi && u.role === 'master') return { lignes: tous, porte: 'maison' };
    if (moi) return { lignes: tous, porte: 'mien' };
    return {
      lignes: tous.filter(function (p) { return String(p.owner || '').toLowerCase() === String(email || '').toLowerCase(); }),
      porte: 'filtre'
    };
  }

  function compte(lignes) {
    var partenaires = 0, contactes = 0;
    lignes.forEach(function (p) {
      if (p.statut === 'partenaire') partenaires++;
      if (p.statut && p.statut !== 'nouveau') contactes++;
    });
    return { fiches: lignes.length, partenaires: partenaires, contactes: contactes };
  }

  function gestes(email) { return lire(email, 'gestes', { mails: 0, ecoutes: 0 }); }
  function noterGeste(email, cleG) {
    var g = gestes(email);
    g[cleG] = (g[cleG] || 0) + 1;
    ecrire(email, 'gestes', g);
  }

  /* ─── Atelier : la grille, par métier ─── */
  var DEPARTEMENTS = [
    {
      id: 'prospection', nom: 'Prospection',
      cartes: [
        { v: 'recherche', t: 'Annuaire', d: 'Pompes funèbres, code NAF 96.03Z, données ouvertes.' },
        { v: 'prospects', t: 'Portefeuille', d: 'Fiches, statuts, du premier contact au partenaire.' },
        { v: 'playbook', t: 'Script d’appel', d: 'Les passages, les objections, les mots justes.' },
        { v: 'plan', t: 'Plan de semaine', d: 'Séquence, rythme, ce qu’on ne fait pas.' },
        { v: 'mails', t: 'Courrier agences', d: 'Premier contact et relance, avec un exemple musical.' }
      ]
    },
    {
      id: 'contenu', nom: 'Contenu & réseaux',
      cartes: [
        { v: 'posts', t: 'Publications', d: 'Textes prêts pour LinkedIn, Instagram, Facebook.' },
        { v: 'kit', t: 'Kit média', d: 'Affiches, brochure, vidéos déjà dans le dépôt.' },
        { v: 'social', t: 'Calendrier', d: 'Le planning des publications de la maison.' },
        { v: 'ecoute', t: 'Morceaux à citer', d: 'Le catalogue, pour montrer plutôt que décrire.' }
      ]
    },
    {
      id: 'emails', nom: 'Emails',
      cartes: [
        { v: 'pret', t: 'Mail prêt à envoyer', d: 'Composer, prévisualiser, copier ou ouvrir dans Gmail.' },
        { v: 'mails', t: 'Mails tout faits', d: 'Familles, pompes funèbres, fleuristes. Images et musiques.' },
        { v: 'modeles', t: 'Modèles du pipeline', d: 'Ceux qui font avancer le statut d’une fiche.' },
        { v: 'boite', t: 'Ma boîte', d: 'L’adresse professionnelle, sans service d’envoi externe.' }
      ]
    },
    {
      id: 'suivi', nom: 'Suivi client',
      cartes: [
        { v: 'relances', t: 'À faire', d: 'Les relances dont la date est arrivée.' },
        { v: 'rappels', t: 'Rappels', d: 'Vos propres rappels, sur cet appareil.' },
        { v: 'checklist', t: 'Parcours d’arrivée', d: 'Les gestes des premiers jours, à cocher.' },
        { v: 'faq', t: 'FAQ familles', d: 'Les réponses déjà tenues par la maison.' }
      ]
    },
    {
      id: 'analyse', nom: 'Analyse',
      cartes: [
        { v: 'analyse', t: 'Pipeline', d: 'Comptes réels des fiches chargées. Pas d’estimation.' },
        { v: 'simulateur', t: 'Simulateur', d: 'Part agence publiée, et votre taux si vous le saisissez.' }
      ]
    },
    {
      id: 'ressources', nom: 'Ressources',
      cartes: [
        { v: 'ecoute', t: 'Écouter', d: 'Les hommages du catalogue, sans lecture automatique.' },
        { v: 'traditions', t: 'Les traditions', d: 'Ce qu’on peut dire, rite par rite.' },
        { v: 'kit', t: 'Documents', d: 'Manuel de vente et plans internes.' },
        { v: 'profil', t: 'Mon profil', d: 'Lien personnel, QR, objectifs.' },
        { v: 'julie', t: 'Fiche de Julie', d: 'La collaboratrice de référence.' }
      ]
    }
  ];

  function vueAtelier() {
    return '<p class="panel-note">Six métiers, les outils qui existent déjà et ceux de cet espace. Chaque tuile ouvre une vue réelle. Rien ici n’envoie un courriel à votre place.</p>' +
      '<div class="col-atelier">' + DEPARTEMENTS.map(function (d) {
        return '<section class="col-dep" data-dep="' + d.id + '" aria-labelledby="dep-' + d.id + '">' +
          '<h2 class="col-dep-nom" id="dep-' + d.id + '">' + esc(d.nom) + '</h2>' +
          '<div class="col-dep-cartes">' + d.cartes.map(function (c) {
            return '<button type="button" class="col-tuile" data-aller="' + esc(c.v) + '">' +
              '<span class="col-tuile-t">' + esc(c.t) + '</span>' +
              '<small>' + esc(c.d) + '</small></button>';
          }).join('') + '</div></section>';
      }).join('') + '</div>';
  }

  function brancherAtelier(racine) {
    var z = racine.querySelector('.col-atelier');
    if (!z) return;
    z.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-aller]');
      if (!b) return;
      aller(b.getAttribute('data-aller'));
    });
  }

  /* ─── Profil ─── */
  var BADGES = [
    { id: 'fiche', nom: 'Première fiche', detail: 'Au moins une fiche est rattachée à cette adresse.' },
    { id: 'cinq', nom: 'Cinq maisons', detail: 'Cinq fiches suivies.' },
    { id: 'partenaire', nom: 'Première signature', detail: 'Une fiche est au statut Partenaire.' },
    { id: 'mail', nom: 'Courrier préparé', detail: 'Un mail tout fait a été copié ou ouvert, sur cet appareil, avec ce compte.' },
    { id: 'ecoute', nom: 'Catalogue écouté', detail: 'Un exemple a été lancé depuis l’écoute, sur cet appareil.' },
    { id: 'parcours', nom: 'Parcours commencé', detail: 'Une étape du parcours d’arrivée est cochée sur cet appareil.' }
  ];

  function badgeOk(id, stats, email, moi) {
    if (id === 'fiche') return stats.fiches >= 1;
    if (id === 'cinq') return stats.fiches >= 5;
    if (id === 'partenaire') return stats.partenaires >= 1;
    if (!moi) return false;
    var g = gestes(email);
    var checks = lire(email, 'parcours', {});
    var nChecks = Object.keys(checks).filter(function (k) { return checks[k]; }).length;
    if (id === 'mail') return (g.mails || 0) >= 1;
    if (id === 'ecoute') return (g.ecoutes || 0) >= 1;
    if (id === 'parcours') return nChecks >= 1;
    return false;
  }

  function lienParrain(code) {
    var c = String(code || '').trim().toLowerCase();
    if (!/^[a-z0-9-]{2,40}$/.test(c)) return '';
    return SITE + '/?parrain=' + c;
  }

  function phrasePorte(porte, email) {
    if (porte === 'maison') return 'Vue fondateur : toutes les fiches chargées, pas seulement les vôtres.';
    if (porte === 'filtre') return 'Fiches dont le responsable est ' + email + '.';
    return 'Fiches chargées pour ce compte.';
  }

  function vueProfil(nomVue) {
    var s = cible(nomVue);
    var pack = fichesPour(s.email);
    var stats = compte(pack.lignes);
    var u = utilisateur();
    var moi = String(u.email || '').toLowerCase() === String(s.email || '').toLowerCase();
    var lien = lienParrain(s.code);
    var obj = lire(s.email, 'objectifs', null);
    var parrainLocal = '';
    try { parrainLocal = localStorage.getItem('melodia_parrain') || ''; } catch (e) {}

    var portrait = s.photo
      ? '<img class="col-portrait" src="' + esc(s.photo) + '" alt="' + esc(s.nom) + '" width="200" height="200">'
      : '<div class="col-portrait col-portrait-vide" aria-hidden="true">' + esc((s.nom || '?').charAt(0)) + '</div>';

    return '<article class="col-profil">' +
      '<header class="col-hero">' + portrait +
        '<div class="col-identite">' +
          (s.graine ? '<p class="col-ruban">Collaboratrice de référence</p>' : '<p class="col-ruban">Compte connecté</p>') +
          '<h2 class="col-nom">' + esc(s.nom || 'Collaborateur') + '</h2>' +
          '<p class="col-role">' + esc(s.role || 'Collaborateur') + '</p>' +
          '<p class="col-bio">' + esc(s.bio || 'Aucune biographie n’a été rédigée pour ce compte.') + '</p>' +
          '<ul class="col-coords">' +
            '<li><span>Courriel</span> ' + (s.email ? '<a href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a>' : 'Non renseigné') + '</li>' +
            '<li><span>Téléphone</span> ' + (s.tel ? esc(s.tel) : 'Non renseigné sur cet appareil') + '</li>' +
            '<li><span>Code</span> ' + (s.code ? esc(s.code) : 'Non attribué') + '</li>' +
          '</ul>' +
          (moi ? '<p class="col-aide">Le téléphone se complète dans Mon compte : il reste sur cet appareil, avec la carte de visite.</p>' : '') +
        '</div>' +
      '</header>' +

      '<section class="col-bloc" aria-labelledby="col-lien-titre">' +
        '<h3 id="col-lien-titre">Lien personnel</h3>' +
        (lien
          ? '<p class="panel-note">Ce lien ouvre le site avec votre code. Le code est retenu dans le navigateur du visiteur. Le nombre de commandes qui le portent s’affiche ci-dessous quand la base a la colonne.</p>' +
            '<p class="col-aide" id="col-parrain-n" data-code="' + esc(s.code) + '">Compteur en cours de lecture…</p>' +
            '<div class="col-lien-ligne">' +
              '<label class="field-label" for="col-lien">Adresse</label>' +
              '<input class="field-input" id="col-lien" readonly value="' + esc(lien) + '">' +
              '<button type="button" class="btn btn-gold btn-sm" id="col-copier-lien">Copier le lien</button>' +
            '</div>' +
            '<div class="col-qr" id="col-qr" data-lien="' + esc(lien) + '" data-nom="' + esc(s.nom) + '"></div>' +
            '<button type="button" class="btn btn-outline btn-sm" id="col-qr-dl">Télécharger le QR</button>'
          : '<p class="col-vide">Aucun code de lien n’est attribué à ce compte.</p>') +
        (parrainLocal ? '<p class="col-aide">Sur cet appareil, le dernier code retenu est « ' + esc(parrainLocal) + ' ». Cela ne mesure pas vos visites.</p>' : '') +
      '</section>' +

      '<section class="col-bloc" aria-labelledby="col-stats-titre">' +
        '<h3 id="col-stats-titre">Activité</h3>' +
        '<p class="panel-note">' + esc(phrasePorte(pack.porte, s.email)) + '</p>' +
        '<div class="col-stats">' +
          stat('Fiches', String(stats.fiches), 'Responsable : cette adresse, ou le portefeuille chargé.') +
          stat('Partenaires', String(stats.partenaires), 'Fiches au statut Partenaire, parmi celles ci-dessus.') +
          stat('Ventes', null, 'Les commandes ne portent pas le nom du collaborateur. Aucun chiffre de vente n’est affiché.') +
          stat('Commissions', null, 'Aucun relevé de commission n’est tenu dans la maison. Le taux se fixe à l’entretien et n’est pas enregistré ici.') +
        '</div>' +
      '</section>' +

      '<section class="col-bloc" aria-labelledby="col-obj-titre">' +
        '<h3 id="col-obj-titre">Objectifs du mois</h3>' +
        '<p class="panel-note">Enregistrés sur cet appareil seulement. Ils ne suivent pas le compte d’un poste à l’autre.</p>' +
        (moi ? formulaireObjectifs(s.email, obj, stats) : '<p class="col-vide">Les objectifs se saisissent sur le compte concerné, pas depuis une autre session.</p>') +
      '</section>' +

      '<section class="col-bloc" aria-labelledby="col-badges-titre">' +
        '<h3 id="col-badges-titre">Signes de parcours</h3>' +
        '<p class="panel-note">Un signe n’apparaît obtenu que si la condition est vraie dans les données chargées, ou dans un geste fait sur cet appareil avec ce compte.</p>' +
        '<ul class="col-badges">' + BADGES.map(function (b) {
          var ok = badgeOk(b.id, stats, s.email, moi);
          return '<li class="col-badge' + (ok ? ' est-ok' : '') + '">' +
            '<span class="col-sceau" aria-hidden="true">' + (ok ? '◆' : '◇') + '</span>' +
            '<strong>' + esc(b.nom) + '</strong>' +
            '<span>' + esc(b.detail) + (ok ? '' : ' — pas encore.') + '</span></li>';
        }).join('') + '</ul>' +
      '</section>' +
    '</article>';
  }

  function stat(label, valeur, detail) {
    var vide = valeur == null;
    return '<div class="col-stat">' +
      '<span class="col-stat-k">' + esc(label) + '</span>' +
      '<span class="col-stat-v' + (vide ? ' est-vide' : '') + '">' + (vide ? '—' : esc(valeur)) + '</span>' +
      '<span class="col-stat-d">' + esc(detail) + '</span></div>';
  }

  function formulaireObjectifs(email, obj, stats) {
    var mois = moisCourant();
    var duMois = obj && obj.mois === mois ? obj : null;
    var ancien = obj && obj.mois && obj.mois !== mois;
    var fiches = duMois && duMois.fiches != null ? String(duMois.fiches) : '';
    var part = duMois && duMois.partenaires != null ? String(duMois.partenaires) : '';
    var barres = '';
    if (duMois && (duMois.fiches || duMois.partenaires)) {
      barres = barre('Fiches', stats.fiches, duMois.fiches) + barre('Partenaires', stats.partenaires, duMois.partenaires);
    } else {
      barres = '<p class="col-vide">Aucun objectif saisi pour ' + esc(mois) + '. Les cases restent vides jusqu’à ce que vous les remplissiez.</p>';
    }
    return (ancien ? '<p class="col-aide">Un objectif de ' + esc(obj.mois) + ' est encore enregistré sur cet appareil. Il ne s’applique pas au mois en cours.</p>' : '') +
      barres +
      '<form class="col-form" id="col-obj-form">' +
        '<div class="field"><label class="field-label" for="obj-fiches">Fiches à suivre en ' + esc(mois) + '</label>' +
          '<input class="field-input" id="obj-fiches" inputmode="numeric" value="' + esc(fiches) + '" placeholder="Laisser vide"></div>' +
        '<div class="field"><label class="field-label" for="obj-part">Partenaires à signer</label>' +
          '<input class="field-input" id="obj-part" inputmode="numeric" value="' + esc(part) + '" placeholder="Laisser vide"></div>' +
        '<button type="submit" class="btn btn-gold btn-sm">Enregistrer sur cet appareil</button>' +
      '</form>';
  }

  function barre(label, fait, cibleN) {
    var but = Number(cibleN);
    if (!but || but < 0) return '';
    var p = Math.max(0, Math.min(100, Math.round((fait / but) * 100)));
    return '<div class="col-barre"><div class="col-barre-l"><span>' + esc(label) + '</span><span>' + fait + ' / ' + but + '</span></div>' +
      '<div class="col-barre-p" role="progressbar" aria-valuemin="0" aria-valuemax="' + but + '" aria-valuenow="' + fait + '" aria-label="' + esc(label) + '">' +
      '<span style="width:' + p + '%"></span></div></div>';
  }

  function brancherProfil(racine, nomVue) {
    var s = cible(nomVue);
    var qrHote = racine.querySelector('#col-qr');
    var svg = '';
    if (qrHote && window.MelodiaQR) {
      var lien = qrHote.getAttribute('data-lien');
      svg = window.MelodiaQR.svg(lien, {
        encre: '#1a1408', fond: '#f7f3ea', marge: 2,
        titre: 'QR du lien de ' + (qrHote.getAttribute('data-nom') || 'collaborateur')
      });
      qrHote.innerHTML = svg;
    }
    var copier = racine.querySelector('#col-copier-lien');
    if (copier) copier.addEventListener('click', function () {
      var input = racine.querySelector('#col-lien');
      copierTexte(input ? input.value : '').then(function (ok) {
        toast(ok ? 'Lien copié.' : 'La copie a échoué : sélectionnez le champ.');
      });
    });
    var dl = racine.querySelector('#col-qr-dl');
    if (dl && svg) dl.addEventListener('click', function () {
      var blob = new Blob([svg], { type: 'image/svg+xml' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'melodia-' + (s.code || 'lien') + '.svg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    var compteur = racine.querySelector('#col-parrain-n');
    if (compteur && window.MelodiaDB && window.MelodiaDB.parrainages) {
      var code = compteur.getAttribute('data-code');
      window.MelodiaDB.parrainages(code).then(function (n) {
        if (!compteur.isConnected) return;
        if (n == null) compteur.textContent = 'Le nombre de commandes portant ce code s’affichera quand la colonne « parrain » sera en place. Aucune donnée de famille n’est montrée ici.';
        else compteur.textContent = n + ' commande' + (n > 1 ? 's' : '') + ' porte' + (n > 1 ? 'nt' : '') + ' ce code. Aucun nom de famille n’est affiché.';
      }).catch(function () {
        compteur.textContent = 'Le compteur n’a pas pu être lu.';
      });
    }
    var form = racine.querySelector('#col-obj-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = nombre(racine.querySelector('#obj-fiches').value);
      var p = nombre(racine.querySelector('#obj-part').value);
      if (f == null && p == null) {
        ecrire(s.email, 'objectifs', null);
        toast('Objectifs retirés de cet appareil.');
      } else {
        ecrire(s.email, 'objectifs', { mois: moisCourant(), fiches: f, partenaires: p });
        toast('Objectifs enregistrés sur cet appareil.');
      }
      aller(nomVue);
    });
  }

  function nombre(v) {
    var t = String(v || '').trim();
    if (!t) return null;
    if (!/^\d{1,4}$/.test(t)) return null;
    return Number(t);
  }

  function copierTexte(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return copierRepli(t); });
    }
    return Promise.resolve(copierRepli(t));
  }
  function copierRepli(t) {
    var ta = document.createElement('textarea');
    ta.value = t;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  /* ─── Mails ─── */
  var brouillon = { id: 'famille-contact', vars: {}, pisteId: '', exemple: true, dest: '', cat: 'tous' };

  function modeleCourant() {
    var M = window.MelodiaMails;
    if (!M) return null;
    for (var i = 0; i < M.MODELES.length; i++) if (M.MODELES[i].id === brouillon.id) return M.MODELES[i];
    return M.MODELES[0];
  }

  function vueMails() {
    var M = window.MelodiaMails;
    if (!M) return '<p class="form-msg err" style="display:block;">La bibliothèque de mails n’est pas chargée.</p>';
    var cats = [['tous', 'Tous'], ['sequence', 'Séquence agences'], ['famille', 'Familles'], ['pompes', 'Pompes funèbres'], ['fleuriste', 'Fleuristes']];
    var liste = M.MODELES.filter(function (m) { return brouillon.cat === 'tous' || m.categorie === brouillon.cat; });
    var m = modeleCourant();
    var champs = (m.champs || []).map(function (k) {
      var meta = M.CHAMPS[k] || { label: k, placeholder: '' };
      return '<div class="field"><label class="field-label" for="mail-' + esc(k) + '">' + esc(meta.label) + '</label>' +
        '<input class="field-input" id="mail-' + esc(k) + '" data-var="' + esc(k) + '" value="' + esc(brouillon.vars[k] || '') + '" placeholder="' + esc(meta.placeholder) + '"></div>';
    }).join('');
    return '<p class="col-banniere-etat">Envoi automatique désactivé. Rien ne part vers un service : vous copiez le message, ou vous l’ouvrez dans votre messagerie. Les images et les liens musicaux viennent du site.</p>' +
      '<div class="col-mails">' +
        '<div class="col-mails-liste">' +
          '<div class="col-filtres" role="tablist" aria-label="Familles de courriers">' + cats.map(function (c) {
            return '<button type="button" class="col-filtre' + (brouillon.cat === c[0] ? ' est-on' : '') + '" data-cat="' + c[0] + '" role="tab" aria-selected="' + (brouillon.cat === c[0]) + '">' + esc(c[1]) + '</button>';
          }).join('') + '</div>' +
          '<ul class="col-modeles">' + liste.map(function (x) {
            return '<li><button type="button" class="col-modele' + (x.id === m.id ? ' est-on' : '') + '" data-modele="' + esc(x.id) + '" aria-pressed="' + (x.id === m.id) + '">' +
              '<strong>' + esc(x.nom) + '</strong><span>' + esc(x.quand) + '</span></button></li>';
          }).join('') + '</ul>' +
        '</div>' +
        '<div class="col-mails-edit">' +
          '<p class="panel-note">' + esc(m.quand) + '</p>' +
          '<div class="col-champs">' + champs +
            '<div class="field"><label class="field-label" for="mail-dest">Destinataire, pour le lien mailto</label>' +
              '<input class="field-input" id="mail-dest" type="email" autocomplete="off" value="' + esc(brouillon.dest) + '" placeholder="adresse@exemple.fr"></div>' +
            '<div class="field"><label class="field-label" for="mail-piste">Exemple musical du catalogue</label>' +
              '<select class="field-select" id="mail-piste"><option value="">Chargement du catalogue…</option></select></div>' +
            (m.proposition
              ? '<label class="col-case"><input type="checkbox" id="mail-exemple"' + (brouillon.exemple ? ' checked' : '') + '> Ce lien est un exemple du catalogue, pas la chanson de la famille</label>'
              : '<p class="col-aide">Le morceau choisi est présenté comme un exemple du catalogue, jamais comme la chanson du défunt.</p>') +
          '</div>' +
          '<div class="col-actions">' +
            '<button type="button" class="btn btn-outline btn-sm" id="mail-copier">Copier le texte</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="mail-html">Copier le HTML</button>' +
            '<button type="button" class="btn btn-gold btn-sm" id="mail-mailto">Ouvrir dans la messagerie</button>' +
          '</div>' +
          '<p class="col-aide" id="mail-etat" role="status"></p>' +
          '<iframe class="col-apercu" id="mail-apercu" title="Aperçu du courriel" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe>' +
        '</div>' +
      '</div>';
  }

  function varsSaisies(racine) {
    var v = {};
    Array.prototype.forEach.call(racine.querySelectorAll('[data-var]'), function (el) {
      v[el.getAttribute('data-var')] = el.value.trim();
    });
    var u = utilisateur();
    var sig = signatureDe(u.email, u);
    v.collaborateur = sig.nom || u.name || '';
    return v;
  }

  function rafraichirMail(racine, catalogue) {
    var M = window.MelodiaMails;
    var m = modeleCourant();
    var iframe = racine.querySelector('#mail-apercu');
    var etat = racine.querySelector('#mail-etat');
    if (!M || !m || !iframe) return null;
    var select = racine.querySelector('#mail-piste');
    var piste = null;
    if (select && catalogue) {
      piste = catalogue.filter(function (p) { return p.id === select.value; })[0] || null;
    }
    var exemple = true;
    var caseEx = racine.querySelector('#mail-exemple');
    if (caseEx) exemple = caseEx.checked;
    else if (m.proposition) exemple = brouillon.exemple;
    var u = utilisateur();
    var rendu = M.composer({
      modele: m,
      vars: varsSaisies(racine),
      piste: piste,
      exemple: m.proposition ? exemple : true,
      signature: signatureDe(u.email, u),
      absolu: false
    });
    iframe.srcdoc = rendu.html;
    if (etat) {
      var msgs = [];
      if (rendu.manquants.length) msgs.push('À remplir : ' + rendu.manquants.join(', ') + '.');
      if (rendu.sansMusique) msgs.push('Aucun morceau du catalogue n’est disponible. Le lien musical n’a pas été inventé : ouvrez la page Écouter.');
      var sansEmplacements = rendu.html.replace(/\{\{LIEN_[A-Z0-9_]+\}\}/g, '');
      if (/\{\w/.test(sansEmplacements)) msgs.push('Les surlignages sont des variables encore vides.');
      if (/\{\{LIEN_/.test(rendu.html)) msgs.push('TikTok et le LinkedIn de Julie ne sont pas dans le dépôt : les emplacements restent nommés.');
      if (!msgs.length) msgs.push('Aperçu à jour.');
      etat.textContent = msgs.join(' ');
    }
    return rendu;
  }

  function renduAbsolu(racine, catalogue) {
    var M = window.MelodiaMails;
    var m = modeleCourant();
    var select = racine.querySelector('#mail-piste');
    var piste = catalogue && select ? (catalogue.filter(function (p) { return p.id === select.value; })[0] || null) : null;
    var caseEx = racine.querySelector('#mail-exemple');
    var u = utilisateur();
    return M.composer({
      modele: m,
      vars: varsSaisies(racine),
      piste: piste,
      exemple: caseEx ? caseEx.checked : true,
      signature: signatureDe(u.email, u),
      absolu: true
    });
  }

  function brancherMails(racine) {
    var M = window.MelodiaMails;
    var catalogue = [];
    function relire() { rafraichirMail(racine, catalogue); }
    var zoneMails = racine.querySelector('.col-mails') || racine;
    zoneMails.addEventListener('click', function (e) {
      var cat = e.target.closest && e.target.closest('[data-cat]');
      if (cat) { brouillon.cat = cat.getAttribute('data-cat'); brouillon.vars = varsSaisies(racine); aller('mails'); return; }
      var mod = e.target.closest && e.target.closest('[data-modele]');
      if (mod) {
        brouillon.vars = varsSaisies(racine);
        brouillon.id = mod.getAttribute('data-modele');
        brouillon.pisteId = '';
        aller('mails');
      }
    });
    function suiviSaisie(e) {
      if (!e.target) return;
      if (e.target.id === 'mail-dest') brouillon.dest = e.target.value.trim();
      if (e.target.id === 'mail-piste') brouillon.pisteId = e.target.value;
      if (e.target.id === 'mail-exemple') brouillon.exemple = !!e.target.checked;
      if (e.target.hasAttribute('data-var') || e.target.id === 'mail-piste' || e.target.id === 'mail-exemple') relire();
    }
    zoneMails.addEventListener('input', suiviSaisie);
    zoneMails.addEventListener('change', suiviSaisie);
    M.chargerCatalogue().then(function (liste) {
      catalogue = liste || [];
      var select = racine.querySelector('#mail-piste');
      var m = modeleCourant();
      if (!select || !m) return;
      if (!catalogue.length) {
        select.innerHTML = '<option value="">Catalogue indisponible</option>';
        relire();
        return;
      }
      var prefere = M.pisteParTitre(m.piste);
      var choisi = brouillon.pisteId || (prefere && prefere.id) || catalogue[0].id;
      select.innerHTML = catalogue.map(function (p) {
        return '<option value="' + esc(p.id) + '"' + (p.id === choisi ? ' selected' : '') + '>' +
          esc(p.titre) + (p.qui ? ' — ' + esc(p.qui) : '') + '</option>';
      }).join('');
      relire();
    });

    function garde() {
      var rendu = renduAbsolu(racine, catalogue);
      if (!rendu) return null;
      if (rendu.manquants.length || rendu.sansMusique) {
        toast(racine.querySelector('#mail-etat').textContent);
        return null;
      }
      if (rendu.texte.length > 1800) {
        toast('Le message est long pour un lien mailto. Copiez-le : certaines messageries le coupent.');
      }
      var u = utilisateur();
      if (u.email) noterGeste(u.email, 'mails');
      return rendu;
    }
    var copier = racine.querySelector('#mail-copier');
    if (copier) copier.addEventListener('click', function () {
      var rendu = garde(); if (!rendu) return;
      copierTexte(rendu.texte).then(function (ok) { toast(ok ? 'Texte copié.' : 'Copie impossible.'); });
    });
    var html = racine.querySelector('#mail-html');
    if (html) html.addEventListener('click', function () {
      var rendu = garde(); if (!rendu) return;
      copierTexte(rendu.html).then(function (ok) { toast(ok ? 'HTML copié, images en adresses du site.' : 'Copie impossible.'); });
    });
    var mail = racine.querySelector('#mail-mailto');
    if (mail) mail.addEventListener('click', function () {
      var rendu = garde(); if (!rendu) return;
      var dest = (racine.querySelector('#mail-dest') || {}).value || '';
      var url = M.mailto(dest, rendu.sujet, rendu.texte);
      if (url.length > 1900) { toast('Le lien mailto est trop long. Le texte a été copié à la place.'); copierTexte(rendu.texte); return; }
      location.href = url;
    });
  }

  /* ─── Publications ─── */
  var POSTS = [
    { reseau: 'LinkedIn', titre: 'Ce que la musique rate encore', texte: 'Aux obsèques, la musique a rarement connu la personne. Melodia Funèbre compose une chanson à partir de ce que la famille raconte : livrée en vingt-quatre heures, sans droit SACEM, et elle reste aux proches.\n\nPour entendre plutôt que lire :\nhttps://melodia-funebre.fr/ecouter/le-papi-pecheur' },
    { reseau: 'Instagram', titre: 'Trois minutes', texte: 'Trois minutes suffisent pour entendre ce qu’une famille a voulu dire.\n\nExemple du catalogue — ce n’est pas une commande, c’est une pièce déjà écrite :\nhttps://melodia-funebre.fr/ecouter/jean-paris\n\n#hommage #ceremonie #melodiafunebre' },
    { reseau: 'Facebook', titre: 'Pour les maisons', texte: 'Aux pompes funèbres : un hommage musical original, que vous présentez en rendez-vous. Vous conservez 60 % du montant. La première composition est offerte.\n\nhttps://melodia-funebre.fr/professionnels' },
    { reseau: 'LinkedIn', titre: 'Le catalogue', texte: 'Nous ne décrivons pas la musique. Nous la faisons écouter.\n\nLe catalogue :\nhttps://melodia-funebre.fr/demos' }
  ];

  function vuePosts() {
    return '<p class="panel-note">Textes à copier. Les liens pointent vers des pages du site. Aucun chiffre d’audience : nous n’en tenons pas ici.</p>' +
      '<div class="col-posts">' + POSTS.map(function (p, i) {
        return '<article class="panel col-post"><p class="col-ruban">' + esc(p.reseau) + '</p>' +
          '<h3 class="col-post-t">' + esc(p.titre) + '</h3>' +
          '<pre class="col-post-texte" id="post-' + i + '">' + esc(p.texte) + '</pre>' +
          '<button type="button" class="btn btn-outline btn-sm" data-copier-post="' + i + '">Copier</button></article>';
      }).join('') + '</div>';
  }
  function brancherPosts(racine) {
    var z = racine.querySelector('.col-posts');
    if (!z) return;
    z.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-copier-post]');
      if (!b) return;
      var pre = racine.querySelector('#post-' + b.getAttribute('data-copier-post'));
      copierTexte(pre ? pre.textContent : '').then(function (ok) { toast(ok ? 'Publication copiée.' : 'Copie impossible.'); });
    });
  }

  /* ─── Kit ─── */
  var KIT = [
    { t: 'Brochure partenaire', f: '/documents/melodia-brochure-partenaire.pdf', d: 'À remettre ou à envoyer à une agence.' },
    { t: 'Manuel de vente', f: '/api/document?fichier=manuel', doc: 'manuel', nom: 'melodia-manuel-de-vente.pdf', d: 'Document interne : script, objections, séquence.' },
    { t: 'Plan LinkedIn', f: '/api/document?fichier=linkedin', doc: 'linkedin', nom: 'melodia-plan-linkedin.pdf', d: 'Document interne.' },
    { t: 'Plan réseaux sociaux', f: '/api/document?fichier=reseaux', doc: 'reseaux', nom: 'melodia-plan-reseaux-sociaux.pdf', d: 'Document interne.' },
    { t: 'Affiche « Devenez partenaire »', f: '/assets/img/campagne/affiche-partenaire.jpg', d: 'JPEG, salon ou pièce jointe.' },
    { t: 'Affiche « Des adieux en musique »', f: '/assets/img/campagne/adieux-en-musique.jpg', d: 'Pour une vitrine ou une famille.' },
    { t: 'Visuel poignée de main', f: '/assets/img/campagne/poignee-de-main.webp', d: 'Pour un message à un prescripteur.' },
    { t: 'Vidéo — la violoncelliste', f: '/assets/img/campagne/violoncelliste.mp4', d: 'Format vertical, trente secondes.' }
  ];
  function vueKit() {
    return '<p class="panel-note">Fichiers déjà présents dans le dépôt. Le téléchargement est un lien direct, sans compte tiers.</p>' +
      '<ul class="col-kit">' + KIT.map(function (k) {
        return '<li><a class="col-kit-a" href="' + esc(k.f) + '"' +
          (k.doc ? ' data-doc="' + esc(k.doc) + '" data-nom="' + esc(k.nom) + '"' : ' download') +
          '><strong>' + esc(k.t) + '</strong><span>' + esc(k.d) + '</span></a></li>';
      }).join('') + '</ul>';
  }

  /* ─── Écoute ─── */
  function vueEcoute() {
    return '<p class="panel-note">Le catalogue publié. Rien ne se lance tout seul. Ce sont des exemples, pas des commandes en cours.</p><div id="col-ecoute"><p class="col-vide">Chargement du catalogue…</p></div>';
  }
  function brancherEcoute(racine) {
    var hote = racine.querySelector('#col-ecoute');
    if (!window.MelodiaMails) { hote.textContent = 'Module musical absent.'; return; }
    window.MelodiaMails.chargerCatalogue().then(function (liste) {
      if (!liste.length) {
        hote.innerHTML = '<p class="col-vide">Le catalogue n’a pas pu être chargé. Ouvrez la page Écouter du site plutôt que de coller un lien inventé.</p>';
        return;
      }
      hote.innerHTML = '<ul class="col-ecoute-liste">' + liste.map(function (p) {
        return '<li class="col-morceau"><img src="' + esc(p.image) + '" alt="" width="72" height="72">' +
          '<div><strong>' + esc(p.titre) + '</strong><span>' + esc(p.qui) + (p.style ? ' · ' + esc(p.style) : '') + '</span>' +
          '<audio controls preload="none" src="' + esc(p.audio) + '" data-ecoute></audio>' +
          '<a href="' + esc(p.page) + '">Page de l’hommage</a></div></li>';
      }).join('') + '</ul>';
      hote.addEventListener('play', function (e) {
        if (e.target && e.target.getAttribute('data-ecoute') != null) {
          var u = utilisateur();
          if (u.email) noterGeste(u.email, 'ecoutes');
        }
      }, true);
    });
  }

  /* ─── FAQ familles ─── */
  var FAQ = [
    { q: 'En combien de temps la chanson est-elle prête ?', r: 'Vingt-quatre heures à partir du moment où la maison a les réponses, pas de la première prise de contact. L’offre Mémorial prévoit une priorité quand la cérémonie est très proche.' },
    { q: 'Faut-il déclarer des droits SACEM ?', r: 'Non. La maison l’écrit ainsi : aucun droit SACEM à régler, pour la famille comme pour le lieu.' },
    { q: 'Que doit dire la famille ?', r: 'Le prénom, trois traits de caractère, un métier ou une passion, une habitude, et si elle le souhaite une anecdote. Rien n’est inventé sur la personne au-delà de ce qu’elle a confié.' },
    { q: 'Et si la famille n’aime pas le résultat ?', r: 'La pièce se reprend. Une révision est comprise dès l’offre à 299 €, et les révisions sont illimitées sur l’offre Mémorial. On présente toujours la chanson avant la cérémonie.' },
    { q: 'Combien cela coûte-t-il ?', r: 'Les trois offres annoncées par la maison : 149 €, 299 € et 499 €. Le détail des prestations est sur la page Offres.' },
    { q: 'Qui garde la musique ?', r: 'La famille. Elle peut la réécouter et la transmettre après la cérémonie.' }
  ];
  function vueFaq() {
    return '<p class="panel-note">Réponses alignées sur ce que le site et les courriers disent déjà. À lire à une famille, ou à copier. Ce n’est pas un argumentaire pour insister.</p>' +
      '<div class="col-faq">' + FAQ.map(function (f, i) {
        return '<div class="col-faq-item"><button type="button" class="col-faq-q" aria-expanded="false" aria-controls="faq-' + i + '" id="faq-b-' + i + '">' + esc(f.q) + '</button>' +
          '<div class="col-faq-r" id="faq-' + i + '" role="region" aria-labelledby="faq-b-' + i + '" hidden><p>' + esc(f.r) + '</p></div></div>';
      }).join('') + '</div>';
  }
  function brancherFaq(racine) {
    var z = racine.querySelector('.col-faq');
    if (!z) return;
    z.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.col-faq-q');
      if (!b) return;
      var p = document.getElementById(b.getAttribute('aria-controls'));
      var ouvert = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
      if (p) p.hidden = ouvert;
    });
  }

  /* ─── Rappels ─── */
  function vueRappels() {
    var u = utilisateur();
    var liste = lire(u.email, 'rappels', []);
    if (!Array.isArray(liste)) liste = [];
    return '<div class="col-outil"><p class="panel-note">Vos rappels, enregistrés sur cet appareil seulement. La liste est vide tant que vous n’en créez pas.</p>' +
      '<form class="col-form" id="col-rappel">' +
        '<div class="field"><label class="field-label" for="rap-date">Date</label><input class="field-input" id="rap-date" type="date" required></div>' +
        '<div class="field"><label class="field-label" for="rap-txt">Note</label><input class="field-input" id="rap-txt" required maxlength="180" placeholder="Relancer l’agence, rappeler une famille…"></div>' +
        '<button type="submit" class="btn btn-gold btn-sm">Ajouter</button></form>' +
      (liste.length ? '<ul class="col-rappels">' + liste.map(function (r) {
        return '<li class="' + (r.fait ? 'est-fait' : '') + '"><label><input type="checkbox" data-fait="' + esc(r.id) + '"' + (r.fait ? ' checked' : '') + '> ' +
          '<time datetime="' + esc(r.quand) + '">' + esc(r.quand) + '</time> ' + esc(r.texte) + '</label>' +
          '<button type="button" class="col-lien-btn" data-suppr="' + esc(r.id) + '">Retirer</button></li>';
      }).join('') + '</ul>' : '<p class="col-vide">Aucun rappel.</p>') + '</div>';
  }
  function brancherRappels(racine) {
    var u = utilisateur();
    var zoneR = racine.querySelector('.col-outil') || racine;
    var form = racine.querySelector('#col-rappel');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var liste = lire(u.email, 'rappels', []);
      if (!Array.isArray(liste)) liste = [];
      liste.push({
        id: 'r' + Date.now().toString(36),
        quand: racine.querySelector('#rap-date').value,
        texte: racine.querySelector('#rap-txt').value.trim().slice(0, 180),
        fait: false
      });
      liste.sort(function (a, b) { return String(a.quand).localeCompare(String(b.quand)); });
      ecrire(u.email, 'rappels', liste);
      aller('rappels');
    });
    zoneR.addEventListener('change', function (e) {
      var id = e.target && e.target.getAttribute && e.target.getAttribute('data-fait');
      if (!id) return;
      var liste = lire(u.email, 'rappels', []);
      liste.forEach(function (r) { if (r.id === id) r.fait = !!e.target.checked; });
      ecrire(u.email, 'rappels', liste);
    });
    zoneR.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-suppr]');
      if (!b) return;
      var id = b.getAttribute('data-suppr');
      ecrire(u.email, 'rappels', (lire(u.email, 'rappels', [])).filter(function (r) { return r.id !== id; }));
      aller('rappels');
    });
  }

  /* ─── Parcours ─── */
  var PARCOURS = [
    { id: 'manuel', t: 'Lire le manuel de vente', d: 'Le PDF est dans le kit média.' },
    { id: 'ecoute', t: 'Écouter trois hommages du catalogue', d: 'Depuis Écouter. On ne commente pas pendant la pièce.' },
    { id: 'carte', t: 'Compléter sa carte de visite', d: 'Nom, fonction, téléphone — dans Mon compte.' },
    { id: 'fiches', t: 'Ouvrir cinq fiches', d: 'L’annuaire public ne donne ni téléphone ni e-mail.' },
    { id: 'courrier', t: 'Préparer un courrier et l’ouvrir dans sa messagerie', d: 'L’envoi part de votre adresse.' },
    { id: 'relance', t: 'Poser une date sur chaque fiche ouverte', d: 'Une fiche sans date s’oublie.' }
  ];
  function vueChecklist() {
    var u = utilisateur();
    var etat = lire(u.email, 'parcours', {});
    var n = PARCOURS.filter(function (p) { return etat[p.id]; }).length;
    return '<div class="col-outil"><p class="panel-note">Parcours d’arrivée, coché sur cet appareil. ' + n + ' étape' + (n > 1 ? 's' : '') + ' sur ' + PARCOURS.length + '.</p>' +
      '<ul class="col-parcours">' + PARCOURS.map(function (p) {
        return '<li><label><input type="checkbox" data-parcours="' + p.id + '"' + (etat[p.id] ? ' checked' : '') + '><span><strong>' + esc(p.t) + '</strong><small>' + esc(p.d) + '</small></span></label></li>';
      }).join('') + '</ul></div>';
  }
  function brancherChecklist(racine) {
    var u = utilisateur();
    var zoneC = racine.querySelector('.col-outil') || racine;
    zoneC.addEventListener('change', function (e) {
      var id = e.target && e.target.getAttribute && e.target.getAttribute('data-parcours');
      if (!id) return;
      var etat = lire(u.email, 'parcours', {});
      etat[id] = !!e.target.checked;
      ecrire(u.email, 'parcours', etat);
      var note = racine.querySelector('.panel-note');
      if (note) {
        var n = PARCOURS.filter(function (p) { return etat[p.id]; }).length;
        note.textContent = 'Parcours d’arrivée, coché sur cet appareil. ' + n + ' étape' + (n > 1 ? 's' : '') + ' sur ' + PARCOURS.length + '.';
      }
    });
  }

  /* ─── Mail prêt à envoyer ─── */
  function paramsHash() {
    var h = (location.hash || '').replace(/^#/, '');
    var morceaux = h.split('?');
    var q = {};
    try {
      new URLSearchParams(morceaux[1] || '').forEach(function (v, k) { q[k] = v; });
    } catch (e) {}
    return { vue: morceaux[0], siret: q.siret || '', modele: q.modele || q.template || '' };
  }

  function aujourdhuiIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function modelePretCourant() {
    var M = window.MelodiaMails;
    if (!M) return null;
    var liste = M.modelesPret();
    for (var i = 0; i < liste.length; i++) if (liste[i].id === pretEtat.id) return liste[i];
    return liste[0] || null;
  }

  function objectifMails(email) {
    var n = lire(email, 'objectif_mails', 10);
    return typeof n === 'number' && n > 0 ? n : 10;
  }

  function compteurMailsJour(email) {
    var cle = 'mails_jour_' + aujourdhuiIso();
    return lire(email, cle, 0) || 0;
  }

  function noterMailPrepare(email, entree) {
    var hist = lire(email, 'historique_mails', []);
    if (!Array.isArray(hist)) hist = [];
    hist.unshift(entree);
    ecrire(email, 'historique_mails', hist.slice(0, 30));
    var cle = 'mails_jour_' + aujourdhuiIso();
    ecrire(email, cle, compteurMailsJour(email) + 1);
  }

  function joursPlus(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function ficheParSiret(siret) {
    if (!siret) return null;
    var tous = lireProspects() || [];
    for (var i = 0; i < tous.length; i++) if (tous[i].siret === siret) return tous[i];
    return null;
  }

  function appliquerPrefillPret() {
    var p = paramsHash();
    if (p.modele) pretEtat.id = p.modele;
    if (p.siret) {
      pretEtat.siret = p.siret;
      var f = ficheParSiret(p.siret);
      if (f) {
        pretEtat.vars = {
          dirigeant: f.dirigeant || '',
          agence: f.nom || '',
          ville: f.ville || ''
        };
        pretEtat.dest = f.email || '';
      }
    }
  }

  function vuePret() {
    appliquerPrefillPret();
    var M = window.MelodiaMails;
    if (!M) return '<p class="form-msg err" style="display:block;">La bibliothèque de mails n’est pas chargée.</p>';
    var u = utilisateur();
    var liste = M.modelesPret();
    var m = modelePretCourant() || liste[0];
    if (m && !pretEtat.id) pretEtat.id = m.id;
    var fiche = ficheParSiret(pretEtat.siret);
    var seq = fiche && M.prochaineSequence ? M.prochaineSequence(fiche) : null;
    var obj = objectifMails(u.email);
    var fait = compteurMailsJour(u.email);
    var hist = lire(u.email, 'historique_mails', []);
    if (!Array.isArray(hist)) hist = [];
    var prospects = (lireProspects() || []).filter(function (p) { return p.email; });
    var optionsProspects = prospects.map(function (p) {
      return '<option value="' + esc(p.siret) + '"' + (p.siret === pretEtat.siret ? ' selected' : '') + '>' +
        esc(p.nom) + (p.ville ? ' · ' + esc(p.ville) : '') + '</option>';
    }).join('');
    var premiumOn = pretEtat.layout ? pretEtat.layout === 'premium' : !!(m && m.layout === 'premium');
    return '<p class="col-banniere-etat">Rien ne part automatiquement : vous copiez le message ou l’ouvrez dans Gmail. Les images utilisent les adresses du site.</p>' +
      '<div class="col-pret-entete">' +
        '<p class="col-pret-objectif"><span id="pret-compteur">' + fait + ' / ' + obj + '</span> mails aujourd’hui · ' +
        '<label class="col-pret-obj-l">Objectif <input class="field-input col-pret-obj-i" id="pret-objectif" type="number" min="1" max="99" value="' + obj + '"></label></p>' +
        (seq ? '<p class="col-aide">Prochain : Séquence ' + seq.num + ' — le ' + esc(seq.le.split('-').reverse().join('/')) +
          ' <button type="button" class="btn btn-outline btn-sm" id="pret-seq">Ouvrir la séquence</button></p>' : '') +
        (fiche ? '<p class="col-aide">Fiche liée : <strong>' + esc(fiche.nom) + '</strong> · <a href="#prospects" class="col-lien-btn" data-aller-fiche="' + esc(fiche.siret) + '">Voir la fiche</a></p>' : '') +
      '</div>' +
      '<div class="col-mails col-pret">' +
        '<div class="col-mails-liste">' +
          '<ul class="col-modeles">' + liste.map(function (x) {
            return '<li><button type="button" class="col-modele' + (x.id === m.id ? ' est-on' : '') + '" data-pret-modele="' + esc(x.id) + '">' +
              '<strong>' + esc(x.nom) + '</strong><span>' + esc(x.quand) + '</span></button></li>';
          }).join('') + '</ul>' +
        '</div>' +
        '<div class="col-mails-edit">' +
          '<div class="col-pret-layout">' +
            '<span class="field-label">Mise en page</span>' +
            '<button type="button" class="col-filtre' + (!premiumOn ? ' est-on' : '') + '" data-pret-layout="standard">Standard</button>' +
            '<button type="button" class="col-filtre' + (premiumOn ? ' est-on' : '') + '" data-pret-layout="premium">Premium</button>' +
          '</div>' +
          '<div class="col-champs">' +
            '<div class="field"><label class="field-label" for="pret-prospect">Rattacher une fiche du portefeuille</label>' +
              '<select class="field-select" id="pret-prospect"><option value="">— Saisie libre —</option>' + optionsProspects + '</select></div>' +
            '<div class="field"><label class="field-label" for="pret-dirigeant">Nom du contact</label>' +
              '<input class="field-input" id="pret-dirigeant" list="pret-noms" value="' + esc((pretEtat.vars && pretEtat.vars.dirigeant) || '') + '" placeholder="Prénom ou nom"></div>' +
            '<datalist id="pret-noms">' + prospects.map(function (p) {
              return '<option value="' + esc(p.dirigeant || p.nom) + '">' + esc(p.nom) + '</option>';
            }).join('') + '</datalist>' +
            '<div class="field"><label class="field-label" for="pret-email">Email</label>' +
              '<input class="field-input" id="pret-email" type="email" value="' + esc(pretEtat.dest || (fiche && fiche.email) || '') + '" placeholder="contact@agence.fr"></div>' +
            '<div class="field-row">' +
              '<div class="field"><label class="field-label" for="pret-agence">Agence <span class="col-opt">(facultatif)</span></label>' +
                '<input class="field-input" id="pret-agence" value="' + esc((pretEtat.vars && pretEtat.vars.agence) || '') + '"></div>' +
              '<div class="field"><label class="field-label" for="pret-ville">Ville <span class="col-opt">(facultatif)</span></label>' +
                '<input class="field-input" id="pret-ville" value="' + esc((pretEtat.vars && pretEtat.vars.ville) || '') + '"></div>' +
            '</div>' +
            (pretEtat.siret ? '' : '<label class="col-case"><input type="checkbox" id="pret-creer"' + (pretEtat.creerFiche ? ' checked' : '') + '> Créer la fiche à l’enregistrement</label>') +
            '<div class="field"><label class="field-label" for="pret-piste">Exemple musical</label>' +
              '<select class="field-select" id="pret-piste"><option value="">Chargement…</option></select></div>' +
          '</div>' +
          '<div class="col-actions">' +
            '<button type="button" class="btn btn-gold btn-sm" id="pret-copier">Copier le mail</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="pret-objet">Copier l’objet</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="pret-gmail">Ouvrir dans Gmail</button>' +
            '<a class="btn btn-ghost btn-sm" id="pret-mailto" href="#">mailto</a>' +
          '</div>' +
          '<p class="col-aide" id="pret-etat" role="status"></p>' +
          '<iframe class="col-apercu" id="pret-apercu" title="Aperçu du courriel" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe>' +
          (hist.length ? '<div class="col-pret-hist"><div class="field-label">Derniers mails préparés</div><ul>' +
            hist.slice(0, 8).map(function (h, i) {
              return '<li><button type="button" class="col-lien-btn" data-pret-rouvrir="' + i + '">' + esc(h.quand + ' — ' + h.modele) + '</button></li>';
            }).join('') + '</ul></div>' : '') +
        '</div>' +
      '</div>';
  }

  function varsPret(racine) {
    return {
      dirigeant: ((racine.querySelector('#pret-dirigeant') || {}).value || '').trim(),
      agence: ((racine.querySelector('#pret-agence') || {}).value || '').trim(),
      ville: ((racine.querySelector('#pret-ville') || {}).value || '').trim()
    };
  }

  function renduPret(racine, catalogue, absolu) {
    var M = window.MelodiaMails;
    var m = modelePretCourant();
    if (!M || !m) return null;
    var select = racine.querySelector('#pret-piste');
    var piste = catalogue && select ? (catalogue.filter(function (p) { return p.id === select.value; })[0] || null) : null;
    var layout = (pretEtat.layout ? pretEtat.layout === 'premium' : m.layout === 'premium') ? 'premium' : 'standard';
    var u = utilisateur();
    return M.composer({
      modele: m,
      vars: varsPret(racine),
      piste: piste,
      exemple: true,
      signature: m.signatureFixe || signatureDe(u.email, u),
      absolu: !!absolu,
      layout: layout
    });
  }

  function majApresPreparation(racine, rendu) {
    var m = modelePretCourant();
    if (!m || !rendu) return;
    var email = ((racine.querySelector('#pret-email') || {}).value || '').trim();
    var u = utilisateur();
    noterMailPrepare(u.email, {
      quand: new Date().toLocaleString('fr-FR'),
      modele: m.nom,
      id: m.id,
      siret: pretEtat.siret,
      vars: varsPret(racine),
      layout: rendu.layout,
      dest: email
    });
    var cpt = racine.querySelector('#pret-compteur');
    if (cpt) cpt.textContent = compteurMailsJour(u.email) + ' / ' + objectifMails(u.email);
    if (!window.MelodiaProspects || !window.MelodiaProspects.enregistrer) return;
    var prom = Promise.resolve();
    if (!pretEtat.siret && racine.querySelector('#pret-creer') && racine.querySelector('#pret-creer').checked) {
      var v = varsPret(racine);
      var cle = 'imp-' + String(v.agence || email || 'prospect').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      prom = window.MelodiaProspects.enregistrer({
        siret: cle,
        nom: v.agence || 'Prospect',
        ville: v.ville,
        dirigeant: v.dirigeant,
        email: email,
        statut: 'nouveau',
        journal: [{ le: new Date().toISOString(), quoi: 'Fiche créée', detail: 'Depuis mail prêt' }]
      }).then(function (f) { pretEtat.siret = f.siret; });
    }
    prom.then(function () {
      var fiche = ficheParSiret(pretEtat.siret);
      if (!fiche) return;
      var journal = (fiche.journal || []).concat([{
        le: new Date().toISOString(),
        quoi: 'Mail préparé — ' + m.nom
      }]);
      var maj = { journal: journal, relance_le: joursPlus(7) };
      if (fiche.statut === 'nouveau') maj.statut = 'contacte';
      if (m.id === 'seq-4' || m.id === 'pf-relance') maj.statut = 'relance';
      return window.MelodiaProspects.enregistrer(Object.assign({}, fiche, maj));
    }).catch(function () {});
  }

  function brancherPret(racine) {
    var M = window.MelodiaMails;
    var catalogue = [];
    var timer = null;
    function relire() {
      var rendu = renduPret(racine, catalogue, false);
      var iframe = racine.querySelector('#pret-apercu');
      var etat = racine.querySelector('#pret-etat');
      if (!rendu || !iframe) return null;
      iframe.srcdoc = rendu.html;
      if (etat) {
        var msgs = [];
        if (rendu.manquants.length) msgs.push('À remplir : ' + rendu.manquants.map(function (k) {
          return (M.CHAMPS[k] && M.CHAMPS[k].label) || k;
        }).join(', ') + '.');
        if (rendu.sansMusique) msgs.push('Aucun morceau du catalogue : choisissez-en un dans la liste.');
        if (!msgs.length) msgs.push('Aperçu à jour.');
        etat.textContent = msgs.join(' ');
      }
      var ml = racine.querySelector('#pret-mailto');
      var dest = (racine.querySelector('#pret-email') || {}).value || '';
      if (ml) ml.href = M.mailto(dest, rendu.sujet, rendu.texte);
      return rendu;
    }
    function planifier() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(relire, 220);
    }
    var zone = racine.querySelector('.col-pret') || racine;
    zone.addEventListener('click', function (e) {
      var mod = e.target.closest && e.target.closest('[data-pret-modele]');
      if (mod) {
        pretEtat.id = mod.getAttribute('data-pret-modele');
        pretEtat.vars = varsPret(racine);
        aller('pret');
        return;
      }
      var lay = e.target.closest && e.target.closest('[data-pret-layout]');
      if (lay) {
        pretEtat.layout = lay.getAttribute('data-pret-layout');
        relire();
        Array.prototype.forEach.call(racine.querySelectorAll('[data-pret-layout]'), function (b) {
          b.classList.toggle('est-on', b.getAttribute('data-pret-layout') === pretEtat.layout);
        });
      }
      var rouv = e.target.closest && e.target.closest('[data-pret-rouvrir]');
      if (rouv) {
        var u = utilisateur();
        var hist = lire(u.email, 'historique_mails', []);
        var h = hist[Number(rouv.getAttribute('data-pret-rouvrir'))];
        if (h) {
          pretEtat.id = h.id;
          pretEtat.siret = h.siret || '';
          pretEtat.vars = h.vars || {};
          pretEtat.layout = h.layout || 'standard';
          pretEtat.dest = h.dest || '';
          aller('pret');
        }
      }
    });
    zone.addEventListener('input', planifier);
    zone.addEventListener('change', function (e) {
      if (e.target.id === 'pret-prospect') {
        var siret = e.target.value;
        pretEtat.siret = siret;
        var f = ficheParSiret(siret);
        if (f) {
          racine.querySelector('#pret-dirigeant').value = f.dirigeant || '';
          racine.querySelector('#pret-agence').value = f.nom || '';
          racine.querySelector('#pret-ville').value = f.ville || '';
          racine.querySelector('#pret-email').value = f.email || '';
        }
      }
      if (e.target.id === 'pret-objectif') {
        var u = utilisateur();
        var v = Number(e.target.value);
        if (v > 0) ecrire(u.email, 'objectif_mails', v);
      }
      planifier();
    });
    var seqBtn = racine.querySelector('#pret-seq');
    if (seqBtn) seqBtn.addEventListener('click', function () {
      var f = ficheParSiret(pretEtat.siret);
      var s = f && M.prochaineSequence(f);
      if (s) { pretEtat.id = s.id; aller('pret'); }
    });
    M.chargerCatalogue().then(function (liste) {
      catalogue = liste || [];
      var select = racine.querySelector('#pret-piste');
      var m = modelePretCourant();
      if (!select || !m) return;
      var pref = M.pisteParTitre(m.piste);
      var choisi = pretEtat.pisteId || (pref && pref.id) || (catalogue[0] && catalogue[0].id);
      select.innerHTML = catalogue.map(function (p) {
        return '<option value="' + esc(p.id) + '"' + (p.id === choisi ? ' selected' : '') + '>' + esc(p.titre) + '</option>';
      }).join('');
      relire();
    });
    function actionCopie(fn) {
      var rendu = renduPret(racine, catalogue, true);
      if (!rendu) return;
      fn(rendu);
    }
    var copier = racine.querySelector('#pret-copier');
    if (copier) copier.addEventListener('click', function () {
      actionCopie(function (rendu) {
        M.copierMailHtml(rendu.html, rendu.texte).then(function (ok) {
          toast(ok ? 'Mail copié (HTML et texte).' : 'Copie impossible.');
          if (ok) majApresPreparation(racine, rendu);
        });
      });
    });
    var objet = racine.querySelector('#pret-objet');
    if (objet) objet.addEventListener('click', function () {
      actionCopie(function (rendu) {
        copierTexte(rendu.sujet).then(function (ok) { toast(ok ? 'Objet copié.' : 'Copie impossible.'); });
      });
    });
    /* Un lien Gmail ou mailto ne peut porter que du texte : le corps
       HTML (bandeau, visuels, bouton, signature) passe par le
       presse-papiers, copié AVANT d'ouvrir la fenêtre, dans le geste.
       Le corps prérempli reste vide pour ne pas doubler le message ;
       si la copie échoue, on retombe sur le texte seul. */
    var gmail = racine.querySelector('#pret-gmail');
    if (gmail) gmail.addEventListener('click', function () {
      actionCopie(function (rendu) {
        var dest = (racine.querySelector('#pret-email') || {}).value || '';
        var ok = M.copierMailSync(rendu.html, rendu.texte);
        window.open(M.gmailCompose(dest, rendu.sujet, ok ? '' : rendu.texte), '_blank', 'noopener');
        toast(ok ? 'Mail copié : dans Gmail, cliquez dans le corps et collez (Ctrl+V / ⌘V).' : 'Copie HTML impossible : Gmail s’ouvre avec le texte seul.');
        majApresPreparation(racine, rendu);
      });
    });
    var mlien = racine.querySelector('#pret-mailto');
    if (mlien) mlien.addEventListener('click', function () {
      actionCopie(function (rendu) {
        var dest = (racine.querySelector('#pret-email') || {}).value || '';
        var ok = M.copierMailSync(rendu.html, rendu.texte);
        mlien.href = M.mailto(dest, rendu.sujet, ok ? '' : rendu.texte);
        toast(ok ? 'Mail copié : dans la messagerie, collez dans le corps (Ctrl+V / ⌘V).' : 'Copie HTML impossible : texte seul.');
      });
    });
  }

  /* ─── Analyse ─── */
  function vueAnalyse() {
    var u = utilisateur();
    var pack = fichesPour(u.email);
    var ST = window.MELODIA_PROSPECT_STATUTS || {};
    var ordre = (window.MelodiaProspects && window.MelodiaProspects.STATUTS) ||
      ['nouveau', 'contacte', 'relance', 'interesse', 'demo_offerte', 'partenaire', 'refus'];
    var auj = aujourdhuiIso();
    var colonnes = ordre.map(function (k) {
      var label = (ST[k] && ST[k].label) || k;
      var cartes = pack.lignes.filter(function (p) { return p.statut === k; }).map(function (p) {
        var tard = p.relance_le && p.relance_le < auj && k !== 'partenaire' && k !== 'refus';
        return '<article class="col-kanban-carte' + (tard ? ' est-retard' : '') + '" draggable="true" data-siret="' + esc(p.siret) + '">' +
          '<strong>' + esc(p.nom) + '</strong>' +
          '<span>' + esc(p.ville || '') + '</span>' +
          (p.relance_le ? '<em' + (tard ? ' class="est-retard"' : '') + '>Relance ' + esc(p.relance_le.split('-').reverse().join('/')) + '</em>' : '') +
          '<select class="field-select col-kanban-sel" data-kanban-sel="' + esc(p.siret) + '" aria-label="Changer le statut">' +
          ordre.map(function (s) {
            return '<option value="' + s + '"' + (s === k ? ' selected' : '') + '>' + esc((ST[s] && ST[s].label) || s) + '</option>';
          }).join('') + '</select></article>';
      }).join('');
      return '<div class="col-kanban-col" data-statut="' + esc(k) + '">' +
        '<h3 class="col-kanban-t">' + esc(label) + ' <span>' + pack.lignes.filter(function (p) { return p.statut === k; }).length + '</span></h3>' +
        '<div class="col-kanban-zone">' + (cartes || '<p class="col-vide">—</p>') + '</div></div>';
    }).join('');
    var total = pack.lignes.length;
    return '<p class="panel-note">' + esc(phrasePorte(pack.porte, u.email)) + ' Glissez une fiche ou changez le statut dans la liste.</p>' +
      '<p class="col-total">' + total + ' fiche' + (total > 1 ? 's' : '') + '.</p>' +
      '<div class="col-kanban">' + colonnes + '</div>' +
      (total ? '' : '<p class="col-vide">Le pipeline est vide.</p>');
  }

  function brancherAnalyse(racine) {
    var zone = racine.querySelector('.col-kanban');
    if (!zone || !window.MelodiaProspects) return;
    var dragSiret = '';
    zone.addEventListener('dragstart', function (e) {
      var c = e.target.closest && e.target.closest('.col-kanban-carte');
      if (!c) return;
      dragSiret = c.getAttribute('data-siret');
      e.dataTransfer.setData('text/plain', dragSiret);
    });
    zone.addEventListener('dragover', function (e) {
      if (e.target.closest && e.target.closest('.col-kanban-zone')) e.preventDefault();
    });
    zone.addEventListener('drop', function (e) {
      var z = e.target.closest && e.target.closest('.col-kanban-zone');
      if (!z) return;
      e.preventDefault();
      var col = z.closest('.col-kanban-col');
      var statut = col && col.getAttribute('data-statut');
      if (!statut || !dragSiret) return;
      enregistrerStatutKanban(dragSiret, statut);
    });
    zone.addEventListener('change', function (e) {
      if (!e.target || !e.target.getAttribute('data-kanban-sel')) return;
      enregistrerStatutKanban(e.target.getAttribute('data-kanban-sel'), e.target.value);
    });
  }

  function enregistrerStatutKanban(siret, statut) {
    var fiche = ficheParSiret(siret);
    if (!fiche || fiche.statut === statut) return;
    var ST = window.MELODIA_PROSPECT_STATUTS || {};
    var label = (ST[statut] && ST[statut].label) || statut;
    var journal = (fiche.journal || []).concat([{
      le: new Date().toISOString(),
      quoi: 'Pipeline — ' + label
    }]);
    window.MelodiaProspects.enregistrer(Object.assign({}, fiche, { statut: statut, journal: journal }))
      .then(function () { aller('analyse'); })
      .catch(function () { toast('Enregistrement impossible.'); });
  }

  /* ─── Simulateur ─── */
  function vueSimulateur() {
    return '<div class="col-sim">' +
      '<section class="panel"><h3 class="panel-title">Part <em>agence</em></h3>' +
        '<p class="panel-note">Chiffre publié sur le site : l’agence conserve 60 % du montant payé par la famille. Ce n’est pas la commission du collaborateur.</p>' +
        '<div class="field"><label class="field-label" for="sim-offre">Offre</label>' +
          '<select class="field-select" id="sim-offre"><option value="149">149 €</option><option value="299" selected>299 €</option><option value="499">499 €</option></select></div>' +
        '<div class="field"><label class="field-label" for="sim-vol">Cérémonies dans le mois, pour cette agence</label>' +
          '<input class="field-input" id="sim-vol" inputmode="numeric" placeholder="Vide tant que vous ne saisissez rien"></div>' +
        '<p id="sim-agence" class="col-resultat">Saisissez un volume pour voir la part agence.</p></section>' +
      '<section class="panel"><h3 class="panel-title">Votre <em>taux</em></h3>' +
        '<p class="panel-note">La maison ne publie pas de taux collaborateur : il se discute à l’entretien et n’est pas enregistré. Le montant ci-dessous ne sort que de ce que vous tapez. Ce n’est pas un relevé.</p>' +
        '<div class="field"><label class="field-label" for="sim-taux">Taux que vous avez convenu, en % du montant famille</label>' +
          '<input class="field-input" id="sim-taux" inputmode="decimal" placeholder="Laisser vide"></div>' +
        '<p id="sim-moi" class="col-resultat">Aucun montant : le taux n’est pas saisi.</p></section>' +
      '</div>';
  }
  function brancherSimulateur(racine) {
    function euro(n) { return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }); }
    function maj() {
      var prix = Number((racine.querySelector('#sim-offre') || {}).value || 0);
      var volT = String((racine.querySelector('#sim-vol') || {}).value || '').trim();
      var tauxT = String((racine.querySelector('#sim-taux') || {}).value || '').replace(',', '.').trim();
      var ag = racine.querySelector('#sim-agence');
      var moi = racine.querySelector('#sim-moi');
      var vol = /^\d{1,4}$/.test(volT) ? Number(volT) : null;
      if (ag) {
        var unitaire = Math.round(prix * 0.6);
        ag.textContent = vol == null
          ? 'Saisissez un volume pour voir la part agence.'
          : 'Part agence publiée (60 %, arrondie comme sur les courriers) : ' + euro(unitaire * vol) + ', soit ' + euro(unitaire) + ' par cérémonie.';
      }
      var taux = /^\d{1,2}(\.\d{1,2})?$/.test(tauxT) ? Number(tauxT) : null;
      if (moi) {
        if (taux == null || vol == null) moi.textContent = 'Aucun montant : il manque le volume ou le taux. Rien n’est inventé à la place.';
        else if (taux > 40) moi.textContent = 'Un taux au-dessus de 40 % dépasse la part que la maison conserve après les 60 % de l’agence. Vérifiez le chiffre convenu.';
        else moi.textContent = 'Estimation, d’après votre saisie seulement : ' + euro(Math.round(vol * prix * (taux / 100))) + '. Ce n’est pas une commission due.';
      }
    }
    var zoneS = racine.querySelector('.col-sim') || racine;
    zoneS.addEventListener('input', maj);
    zoneS.addEventListener('change', maj);
  }

  var VUES = {
    atelier: vueAtelier,
    profil: function () { return vueProfil('profil'); },
    julie: function () { return vueProfil('julie'); },
    mails: vueMails,
    pret: vuePret,
    posts: vuePosts,
    kit: vueKit,
    ecoute: vueEcoute,
    faq: vueFaq,
    rappels: vueRappels,
    checklist: vueChecklist,
    analyse: vueAnalyse,
    simulateur: vueSimulateur
  };
  var BRANCHES = {
    atelier: brancherAtelier,
    profil: function (r) { brancherProfil(r, 'profil'); },
    julie: function (r) { brancherProfil(r, 'julie'); },
    mails: brancherMails,
    pret: brancherPret,
    posts: brancherPosts,
    ecoute: brancherEcoute,
    faq: brancherFaq,
    rappels: brancherRappels,
    checklist: brancherChecklist,
    analyse: brancherAnalyse,
    simulateur: brancherSimulateur
  };

  window.MelodiaEspace = {
    attacher: function (o) {
      if (o && o.prospects) lireProspects = o.prospects;
      if (o && o.aller) aller = o.aller;
    },
    prefillPret: function (o) {
      Object.assign(pretEtat, o || {});
    },
    rendre: function (nom) {
      var fn = VUES[nom];
      return fn ? fn() : '<p class="col-vide">Cette vue n’existe pas.</p>';
    },
    brancher: function (nom) {
      var racine = document.getElementById('view');
      var fn = BRANCHES[nom];
      if (racine && fn) fn(racine);
    }
  };
})();
