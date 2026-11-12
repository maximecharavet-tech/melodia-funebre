/* ═══════════════════════════════════════════════════════════════
   collaborateur-espace.js — Profil, atelier, outils

   Branché dans la console commerciale. Les chiffres viennent des
   fiches réellement chargées. Les ventes et les commissions n’ont
   pas de colonne dans les commandes : on affiche un vide, pas un zéro
   inventé. Les courriels partent seulement par « Envoyer directement »,
   via /api/prospect-mail, qui compose le HTML côté serveur.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SITE = 'https://melodia-funebre.fr';
  var JULIE = 'julie@melodia-funebre.fr';
  var lireProspects = function () { return []; };
  var aller = function () {};
  var pretEtat = { id: 'pf-premier-contact', layout: '', siret: '', vars: {}, pisteId: '', creerFiche: false, dest: '', brochures: null, brochuresManuel: false, apercuFmt: 'desktop', piece: null };

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
    return banniereEnvoi('Envoi automatique désactivé. Rien ne part vers un service : vous copiez le message, ou vous l’ouvrez dans votre messagerie. Les images et les liens musicaux viennent du site.') +
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
            '<div class="field"><label class="field-label" for="mail-dest">Destinataire</label>' +
              '<input class="field-input" id="mail-dest" type="email" autocomplete="off" value="' + esc(brouillon.dest) + '" placeholder="adresse@exemple.fr"></div>' +
            '<div class="field"><label class="field-label" for="mail-piste">Exemple musical du catalogue</label>' +
              '<select class="field-select" id="mail-piste"><option value="">Chargement du catalogue…</option></select></div>' +
            (m.proposition
              ? '<label class="col-case"><input type="checkbox" id="mail-exemple"' + (brouillon.exemple ? ' checked' : '') + '> Ce lien est un exemple du catalogue, pas la chanson de la famille</label>'
              : '<p class="col-aide">Le morceau choisi est présenté comme un exemple du catalogue, jamais comme la chanson du défunt.</p>') +
          '</div>' +
          '<div class="col-actions">' +
            boutonEnvoiDirect('mail-envoyer') +
            '<button type="button" class="btn btn-outline btn-sm" id="mail-copier">Copier le texte</button>' +
            '<button type="button" class="btn btn-outline btn-sm" id="mail-html">Copier le HTML</button>' +
            '<button type="button" class="btn ' + (window.MelodiaMails && window.MelodiaMails.ENVOI_ACTIF ? 'btn-outline' : 'btn-gold') + ' btn-sm" id="mail-mailto">Ouvrir dans la messagerie</button>' +
          '</div>' +
          '<p class="col-aide" id="mail-etat" role="status"></p>' +
          '<p class="col-aide" id="mail-envoi" role="status" aria-live="polite"></p>' +
          '<iframe class="col-apercu" id="mail-apercu" title="Aperçu du courriel" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe>' +
        '</div>' +
      '</div>';
  }

  /* Le bandeau d'état dit la vérité sur l'envoi : quand l'envoi direct
     (Resend) est actif, il l'annonce, avec le quota du jour ; l'ancien
     texte ne sert plus que de repli quand l'interrupteur est coupé. */
  function banniereEnvoi(repli) {
    var M = window.MelodiaMails;
    if (M && M.ENVOI_ACTIF) {
      return '<p class="col-banniere-etat">Envoi direct actif : depuis Mes prospects, cochez les fiches puis « Écrire à la sélection ». ' +
        'Les courriels partent avec les visuels. Ici, « ✉ Envoyer directement » envoie ce courriel tel qu’affiché ; copier le message ou l’ouvrir dans votre messagerie reste possible.</p>';
    }
    return '<p class="col-banniere-etat">' + esc(repli) + '</p>';
  }

  /* ─── Envoi direct ───
     Le lien mailto ne porte que du texte et casse au-delà de ~2 000
     caractères. Ici le courrier part par le serveur (/api/prospect-mail,
     mode « envoi »), exactement comme une campagne : le navigateur
     transmet des champs de texte (objet, titre, corps, lien, chemin du
     visuel), le serveur les échappe et compose lui-même le HTML, avec
     la bannière, les disques d'or, la signature et le quota du jour. */
  var RE_EMAIL = /^[^\s@<>(),;:"']+@[^\s@<>(),;:"']+\.[a-z]{2,}$/i;
  var TEXTE_ENVOI = '✉ Envoyer directement';
  var MSG_MAILTO_LONG = 'Trop long pour un lien mailto : utilisez « Envoyer directement » (avec les images).';

  function envoiDirectDispo() {
    return !!(window.MelodiaMails && window.MelodiaMails.ENVOI_ACTIF && window.MelodiaCampagne && window.MelodiaCampagne.appeler);
  }
  function boutonEnvoiDirect(id) {
    if (!window.MelodiaMails || !window.MelodiaMails.ENVOI_ACTIF) return '';
    return '<button type="button" class="btn btn-gold btn-sm" id="' + id + '">' + TEXTE_ENVOI + '</button>';
  }
  function texteQuotaEnvoi(q) {
    var C = window.MelodiaCampagne;
    if (!q) return '';
    if (C && C.texteQuota) return C.texteQuota(q);
    return q.utilise + ' / ' + q.max + ' envoyés aujourd’hui';
  }
  function ficheParEmail(email) {
    var a = String(email || '').trim().toLowerCase();
    if (!a) return null;
    var tous = lireProspects() || [];
    for (var i = 0; i < tous.length; i++) if (String(tous[i].email || '').trim().toLowerCase() === a) return tous[i];
    return null;
  }
  function messageEchecEnvoi(r) {
    var d = (r && r.d) || {};
    var q = d.quota;
    if (r.status === 401 || d.code === 'NON_CONNECTE') return 'Session expirée : reconnectez-vous, puis renvoyez. Rien n’est parti.';
    if (r.status === 403 && d.code === 'INTERDIT') return 'Votre compte n’a pas le droit d’envoyer : l’envoi direct est réservé aux comptes commercial et fondateur. Utilisez « Copier » en attendant.';
    if (d.code === 'DEJA_ENVOYE' || r.status === 409) {
      var dj = d.refuses && d.refuses[0];
      return (dj && dj.motif) ? dj.motif + '. Pour écrire plus tôt, choisissez un autre modèle (une relance, par exemple).'
        : 'Déjà envoyé à cette adresse avec ce modèle il y a moins de 60 jours. Choisissez un autre modèle (une relance, par exemple).';
    }
    if (d.code === 'ENVOI_INCERTAIN') return 'Le service d’envoi n’a pas répondu à temps : on ne sait pas si le message est parti. Il est bloqué contre un second envoi — vérifiez dans Resend (journal des e-mails) avant de décider.';
    if (d.code === 'JOURNAL_INDISPONIBLE') return 'Le journal des envois est injoignable : rien n’est parti, par prudence. Réessayez dans un instant.';
    if (d.code === 'RIEN' && d.refuses && d.refuses[0] && (d.refuses[0].code === 'DESABONNE' || d.refuses[0].code === 'REJETE')) return d.refuses[0].motif;
    if (d.retentable) return 'Le prestataire a refusé l’envoi (' + (d.motif || d.code || r.status) + '). Rien n’est compté : vous pouvez réessayer.';
    if (d.code === 'QUOTA') return 'L’envoi a été refusé par le service (plafond du prestataire atteint, ou limite temporaire). Réessayez plus tard.';
    if (d.code === 'RATE_LIMIT') return 'Trop d’envois en peu de temps : réessayez dans quelques minutes.';
    if (d.code === 'ENVOI_DESACTIVE' || d.code === 'NOT_CONFIGURED') return 'Envoi direct indisponible pour le moment : copiez le mail à la place.';
    if (d.code === 'ORIGINE') return 'Envoi refusé : ouvrez la console depuis melodia-funebre.fr.';
    if (d.refuses && d.refuses[0] && d.refuses[0].motif) return 'Non envoyé : ' + d.refuses[0].motif;
    if (r.status === 0) return 'Le serveur ne répond pas : vérifiez la connexion, puis réessayez.';
    return 'Non envoyé : ' + (d.error || ('erreur ' + r.status)) + '.';
  }
  /* Le corps tel qu'il part : si le morceau choisi n'apparaît pas dans le
     texte (modèles à bouton), sa ligne est ajoutée, et le serveur en fait
     une carte au disque d'or. */
  function texteEnvoi(rendu) {
    var t = String(rendu.texte || '').replace(/\s+$/, '');
    var p = rendu.piste;
    if (rendu.lien && t.indexOf(rendu.lien) === -1 && p) {
      t += '\n\n· ' + p.titre + (p.qui ? ' — ' + p.qui : '') + ' : ' + rendu.lien;
    }
    return t;
  }
  /* o : { bouton, etat, dest, rendu, modele, apres(fiche, res) } */
  function envoyerDirect(o) {
    var C = window.MelodiaCampagne;
    var dire = function (t) { if (o.etat) o.etat.textContent = t; toast(t); };
    if (!envoiDirectDispo()) { dire('Envoi direct indisponible ici : copiez le mail à la place.'); return; }
    var dest = String(o.dest || '').trim();
    if (!RE_EMAIL.test(dest)) { dire(dest ? 'Adresse invalide : ' + dest + '. Corrigez le champ destinataire.' : 'Indiquez l’adresse du destinataire avant d’envoyer.'); return; }
    var rendu = o.rendu;
    if (!rendu) return;
    if (rendu.manquants && rendu.manquants.length) { dire('À remplir avant l’envoi : ' + rendu.manquants.join(', ') + '.'); return; }
    if (rendu.sansMusique && !(o.modele && o.modele.categorie === 'julie')) { dire('Choisissez un morceau du catalogue avant d’envoyer.'); return; }
    var texte = texteEnvoi(rendu);
    if (/\{\{?[A-Za-zÀ-ÿ_]/.test(texte + ' ' + rendu.sujet + ' ' + (rendu.titre || ''))) {
      dire('Le message contient encore des variables vides (entre accolades) : complétez-les avant d’envoyer.');
      return;
    }
    if (!window.confirm((o.mode === 'test' ? 'S’envoyer ce courriel de test à ' : 'Envoyer ce courriel à ') + dest + ' ?')) return;
    var fiche = ficheParEmail(dest);
    var b = o.bouton;
    b.disabled = true;
    b.setAttribute('aria-busy', 'true');
    b.textContent = 'Envoi en cours…';
    dire('Envoi en cours à ' + dest + '…');
    var corps = {
      mode: o.mode || 'envoi',
      modele: (o.modele && o.modele.id) || (o.modele && o.modele.nom) || rendu.sujet,
      joindreBrochure: o.joindreBrochure !== false,
      brochures: Array.isArray(o.brochures) ? o.brochures : undefined,
      layout: pretEtat.dispositionV2 || undefined,
      envois: [{
        to: dest,
        ref: fiche ? fiche.siret : '',
        nom: o.nom || '',
        societe: o.societe || '',
        ville: o.ville || '',
        accroche: pretEtat.accroche || '',
        sujet: rendu.sujet,
        titre: rendu.titre || '',
        texte: texte
      }],
      signature: C.signature ? C.signature() : {},
      lienTexte: rendu.bouton ? rendu.bouton.texte : '',
      lienUrl: rendu.bouton ? rendu.bouton.url : '',
      visuel: rendu.visuel || '',
      visuelAlt: rendu.visuelAlt || ''
    };
    if (o.pieceBase64) { corps.pieceBase64 = o.pieceBase64; corps.pieceNom = o.pieceNom || 'piece.pdf'; }
    return C.appeler(corps).then(function (r) {
      var parti = r.ok && r.d && r.d.envoyes && r.d.envoyes.length;
      if (!parti) { dire(messageEchecEnvoi(r)); return; }
      var q = texteQuotaEnvoi(r.d.quota);
      dire((corps.mode === 'test' ? 'Test envoyé à ' : 'Courriel envoyé à ') + dest + ', avec les images.' + (q ? ' ' + q + '.' : '') + (fiche && corps.mode !== 'test' ? ' Noté sur la fiche ' + fiche.nom + '.' : ''));
      var u = utilisateur();
      if (u.email) noterGeste(u.email, 'mails');
      if (fiche && corps.mode !== 'test' && window.MelodiaProspects && window.MelodiaProspects.enregistrer) {
        var journal = (fiche.journal || []).concat([{
          le: new Date().toISOString(),
          quoi: 'Courriel envoyé',
          detail: 'Envoi direct — modèle « ' + ((o.modele && o.modele.nom) || rendu.sujet) + ' »'
        }]);
        var maj = { journal: journal, relance_le: joursPlus(7) };
        if (fiche.statut === 'nouveau') maj.statut = 'contacte';
        Promise.resolve(window.MelodiaProspects.enregistrer(Object.assign({}, fiche, maj))).catch(function () {});
      }
      if (o.apres) { try { o.apres(fiche, r); } catch (e) {} }
    }).catch(function () {
      dire('Le serveur ne répond pas : vérifiez la connexion, puis réessayez.');
    }).then(function () {
      b.disabled = false;
      b.removeAttribute('aria-busy');
      b.textContent = TEXTE_ENVOI;
    });
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
      if (url.length > 1900) {
        var etatM = racine.querySelector('#mail-envoi');
        if (etatM) etatM.textContent = MSG_MAILTO_LONG;
        toast(MSG_MAILTO_LONG);
        return;
      }
      location.href = url;
    });
    var envoi = racine.querySelector('#mail-envoyer');
    if (envoi) envoi.addEventListener('click', function () {
      var rendu = renduAbsolu(racine, catalogue);
      if (!rendu) return;
      envoyerDirect({
        bouton: envoi,
        etat: racine.querySelector('#mail-envoi'),
        dest: (racine.querySelector('#mail-dest') || {}).value || '',
        rendu: rendu,
        modele: modeleCourant()
      });
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
    { t: 'Écoutez — exemples de musiques (disque d’or)', f: '/documents/melodia-brochure-ecoute-exemples.pdf', d: 'Les musiques déjà sur le site, avec liens et QR d’écoute. Joignable à un mail.' },
    { t: 'Présentation agences partenaires', f: '/documents/melodia-presentation-agences-partenaires.pdf', d: 'Plaquette premium pour pompes funèbres, crématoriums, marbriers, officiants. Joignable à un mail.' },
    { t: 'Offre Pro', f: '/documents/melodia-offre-pro.pdf', d: 'Questionnaire, composition, QR, plaque, mémorial : l’offre professionnelle expliquée. Joignable à un mail.' },
    { t: 'Plaquette Écoutez prestige', f: '/documents/melodia-plaquette-ecoute-prestige.pdf', d: 'Six musiques mises en scène, disque d’or, liens et QR d’écoute. Joignable à un mail.' },
    { t: 'Fiche contact Julie Serve', f: '/documents/melodia-fiche-contact-julie-serve.pdf', d: 'La carte de visite de Julie, ses coordonnées et trois QR. Joignable à un mail.' },
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
          '><strong>' + esc(k.t) + '</strong><span>' + esc(k.d) + '</span></a>' +
          (/\.pdf$/i.test(k.f) && !k.doc ? '<a class="col-kit-apercu" href="' + esc(k.f) + '" target="_blank" rel="noopener">Aperçu dans un nouvel onglet</a>' : '') +
          '</li>';
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


  function catalogueBrochures() {
    var M = window.MelodiaMails;
    return (M && M.BROCHURES) ? M.BROCHURES : {};
  }
  function idsCatalogueBrochures() {
    var M = window.MelodiaMails;
    if (M && M.BROCHURE_IDS) return M.BROCHURE_IDS.slice();
    return Object.keys(catalogueBrochures());
  }
  function brochureSuggereePret(fiche) {
    var M = window.MelodiaMails;
    if (!M || !M.brochureSuggeree) return null;
    var m = modelePretCourant();
    var v = pretEtat.vars || {};
    return M.brochureSuggeree({
      categorie: m && m.categorie,
      societe: v.societe || v.agence || '',
      nom: (fiche && fiche.nom) || v.nom || '',
      enseigne: fiche && (fiche.enseigne || fiche.nom),
      type: fiche && (fiche.type || fiche.activite || fiche.metier),
      activite: fiche && fiche.activite,
      metier: fiche && fiche.metier
    });
  }
  function brochuresParDefaut(fiche) {
    var ids = ['professionnels'];
    var s = brochureSuggereePret(fiche);
    if (s && ids.indexOf(s) === -1) ids.push(s);
    return ids;
  }
  function brochuresPret(fiche) {
    if (pretEtat.brochures && pretEtat.brochuresManuel) return pretEtat.brochures.slice();
    if (pretEtat.brochures && !pretEtat.brochuresManuel) {
      /* Recalcule la suggestion tant que Julie n’a pas touché aux cases. */
    }
    return brochuresParDefaut(fiche);
  }
  function casesBrochuresHtml(idsCoches, suggeree) {
    var cat = catalogueBrochures();
    var ids = idsCatalogueBrochures();
    var cases = ids.map(function (id) {
      var b = cat[id];
      if (!b) return '';
      var on = idsCoches.indexOf(id) !== -1;
      var hint = (suggeree === id) ? ' <span class="col-opt">suggérée</span>' : '';
      return '<label class="col-case"><input type="checkbox" data-brochure="' + esc(id) + '"' +
        (on ? ' checked' : '') + '> ' + esc(b.label) + hint + '</label>';
    }).join('');
    var aide = suggeree && cat[suggeree]
      ? '<p class="col-aide col-brochure-hint" id="pret-brochure-suggestion">Suggestion d’après le prospect : ' + esc(cat[suggeree].label) + '.</p>'
      : '<p class="col-aide col-brochure-hint" id="pret-brochure-suggestion">Aucune, une ou plusieurs brochures peuvent être jointes.</p>';
    return '<div class="col-brochures" role="group" aria-label="Brochures à joindre">' +
      '<p class="field-label">Brochures à joindre <span class="col-opt">(au choix)</span></p>' +
      cases + aide + '</div>';
  }
  function lireBrochuresCochees(racine) {
    var ids = [];
    Array.prototype.forEach.call(racine.querySelectorAll('[data-brochure]'), function (el) {
      if (el.checked) ids.push(el.getAttribute('data-brochure'));
    });
    return ids;
  }
  function libellesPieces(ids, piece) {
    var cat = catalogueBrochures();
    var noms = (ids || []).map(function (id) { return cat[id] && cat[id].label; }).filter(Boolean);
    if (piece && piece.nom) noms.push(piece.nom);
    return noms;
  }
  function dessinerPieces(racine, ids, piece) {
    var el = racine.querySelector('#pret-pieces');
    if (!el) return;
    var noms = libellesPieces(ids, piece);
    if (!noms.length) {
      el.innerHTML = '<strong>Pièces jointes</strong> : aucune.';
      return;
    }
    el.innerHTML = '<strong>Pièces jointes</strong> (' + noms.length + ') :' +
      '<ul>' + noms.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
  }

  function vuePret() {
    appliquerPrefillPret();
    var M = window.MelodiaMails;
    if (!M) return '<p class="form-msg err" style="display:block;">La bibliothèque de mails n’est pas chargée.</p>';
    var liste = M.modelesPret();
    var m = modelePretCourant() || liste[0];
    if (m && !pretEtat.id) pretEtat.id = m.id;
    var fiche = ficheParSiret(pretEtat.siret);
    var idsBrochure = brochuresPret(fiche);
    var suggeree = brochureSuggereePret(fiche);
    return banniereEnvoi('Rien ne part automatiquement : vous copiez le message ou l’ouvrez dans Gmail.') +
      '<div class="col-pret-entete">' +
        '<p class="col-pret-objectif" id="pret-quota">Envois du jour : en cours de lecture…</p>' +
        (fiche ? '<p class="col-aide">Fiche liée : <strong>' + esc(fiche.nom) + '</strong></p>' : '') +
      '</div>' +
      '<div class="col-mails col-pret">' +
        '<div class="col-mails-liste">' +
          '<ul class="col-modeles">' + liste.map(function (x) {
            return '<li><button type="button" class="col-modele' + (x.id === m.id ? ' est-on' : '') + '" data-pret-modele="' + esc(x.id) + '">' +
              '<strong>' + esc(x.nom) + '</strong><span>' + esc(x.quand) + '</span></button></li>';
          }).join('') + '</ul>' +
        '</div>' +
        '<div class="col-mails-edit">' +
          '<p class="panel-note">' + esc(m.quand) + ' Choisissez un modèle, indiquez le nom et l’e-mail : le reste se remplit tout seul.</p>' +
          '<div class="col-champs">' +
            '<div class="field"><label class="field-label" for="pret-dirigeant">Nom du contact</label>' +
              '<input class="field-input" id="pret-dirigeant" value="' + esc((pretEtat.vars && pretEtat.vars.dirigeant) || '') + '" placeholder="Marie Dupont" autocomplete="name"></div>' +
            '<div class="field"><label class="field-label" for="pret-email">E-mail</label>' +
              '<input class="field-input" id="pret-email" type="email" value="' + esc(pretEtat.dest || (fiche && fiche.email) || '') + '" placeholder="contact@agence.fr" autocomplete="email"></div>' +
            '<div class="field-row">' +
              '<div class="field"><label class="field-label" for="pret-agence">Agence <span class="col-opt">(facultatif)</span></label>' +
                '<input class="field-input" id="pret-agence" value="' + esc((pretEtat.vars && pretEtat.vars.agence) || '') + '" placeholder="Nom de la maison"></div>' +
              '<div class="field"><label class="field-label" for="pret-ville">Ville <span class="col-opt">(facultatif)</span></label>' +
                '<input class="field-input" id="pret-ville" value="' + esc((pretEtat.vars && pretEtat.vars.ville) || '') + '" placeholder="Ville"></div>' +
            '</div>' +
          '</div>' +
          casesBrochuresHtml(idsBrochure, suggeree) +
          '<div class="field"><label class="field-label" for="pret-pdf">PDF personnel <span class="col-opt">(facultatif, 2,5 Mo maximum)</span></label>' +
            '<input class="field-input" id="pret-pdf" type="file" accept="application/pdf,.pdf">' +
            '<p class="col-aide" id="pret-pdf-etat">Cochez une ou plusieurs brochures, ou aucune. Un PDF personnel peut s’ajouter, dans la limite technique du serveur (2,5 Mo).</p></div>' +
          '<div class="col-actions">' +
            boutonEnvoiDirect('pret-envoyer') +
            (M.ENVOI_ACTIF ? '<button type="button" class="btn btn-outline btn-sm" id="pret-test">M’envoyer un test</button>' : '') +
            '<button type="button" class="btn btn-outline btn-sm" id="pret-copier">Copier le mail</button>' +
          '</div>' +
          '<p class="col-aide" id="pret-etat" role="status"></p>' +
          '<p class="col-deja" id="pret-deja" role="status" aria-live="polite" hidden></p>' +
          '<p class="col-aide" id="pret-envoi" role="status" aria-live="polite"></p>' +
          '<div class="col-apercu-barre" role="group" aria-label="Format de l’aperçu">' +
            '<button type="button" class="col-filtre' + (pretEtat.apercuFmt !== 'mobile' ? ' est-on' : '') + '" data-apercu-fmt="desktop">Ordinateur</button>' +
            '<button type="button" class="col-filtre' + (pretEtat.apercuFmt === 'mobile' ? ' est-on' : '') + '" data-apercu-fmt="mobile">Mobile</button>' +
          '</div>' +
          '<div class="col-apercu-cadre' + (pretEtat.apercuFmt === 'mobile' ? ' est-mobile' : ' est-desktop') + '" id="pret-cadre">' +
            '<iframe class="col-apercu" id="pret-apercu" title="Aperçu du courriel" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe>' +
          '</div>' +
          '<div class="col-pieces" id="pret-pieces" aria-live="polite"></div>' +
          '<details class="col-lot">' +
            '<summary>Envoi groupé (CSV ou liste)</summary>' +
            '<p class="col-aide">Colonne : nom, e-mail, société, ville. L’e-mail suffit. Les doublons et les adresses invalides sont écartés. Les doublons du jour et les adresses en opposition sont écartés.</p>' +
            '<div class="field"><label class="field-label" for="pret-csv">Fichier CSV</label>' +
              '<input class="field-input" id="pret-csv" type="file" accept=".csv,text/csv,text/plain,.txt"></div>' +
            '<div class="field"><label class="field-label" for="pret-liste">Ou collez une liste</label>' +
              '<textarea class="field-input col-lot-liste" id="pret-liste" rows="5" placeholder="Marie Dupont, marie@agence.fr, Pompes Dupont, Lyon"></textarea></div>' +
            '<p class="col-aide" id="pret-lot-etat" role="status"></p>' +
            '<div id="pret-lot-apercu" class="col-lot-apercu"></div>' +
            '<button type="button" class="btn btn-gold btn-sm" id="pret-lot-envoyer">Envoyer le lot</button>' +
          '</details>' +
          '<div class="col-suivi">' +
            '<h3 class="col-suivi-t">Suivi des envois</h3>' +
            '<p class="col-aide" id="pret-suivi-note">Chargement du journal…</p>' +
            '<div class="col-suivi-table-wrap"><table class="col-suivi-table" id="pret-suivi"><thead><tr>' +
              '<th>Date</th><th>Destinataire</th><th>Modèle</th><th>Statut</th>' +
              '</tr></thead><tbody></tbody></table></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function varsPret(racine) {
    return {
      dirigeant: ((racine.querySelector('#pret-dirigeant') || {}).value || '').trim(),
      nom: ((racine.querySelector('#pret-dirigeant') || {}).value || '').trim(),
      agence: ((racine.querySelector('#pret-agence') || {}).value || '').trim(),
      societe: ((racine.querySelector('#pret-agence') || {}).value || '').trim(),
      ville: ((racine.querySelector('#pret-ville') || {}).value || '').trim(),
      accroche: pretEtat.accroche || ''
    };
  }

  function renduPret(racine, catalogue, absolu) {
    var M = window.MelodiaMails;
    var m = modelePretCourant();
    if (!M || !m) return null;
    var u = utilisateur();
    return M.composer({
      modele: m,
      vars: varsPret(racine),
      piste: null,
      exemple: true,
      signature: m.signatureFixe || signatureDe(u.email, u),
      absolu: !!absolu,
      layout: 'premium'
    });
  }

  function libelleStatut(s) {
    return ({
      envoye: 'Envoyé', delivre: 'Délivré', ouvert: 'Ouvert',
      clique: 'Cliqué', rejete: 'Rejeté', plainte: 'Signalé', differe: 'Différé',
      reserve: 'En cours', incertain: 'À vérifier dans Resend'
    })[s] || s || '—';
  }

  function formaterQuand(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return String(iso); }
  }

  function majApresPreparation(racine, rendu, sansFiche) {
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
    if (sansFiche) return;
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
    var C = window.MelodiaCampagne;
    var timer = null;
    var lotLu = { ok: [], erreurs: [], ignores: 0 };

    function quotaTexte(q) {
      if (!q) return 'Compteur du jour indisponible pour le moment.';
      if (q.illimite || q.bloque === false) {
        var n = q.utilise || 0;
        return n + ' courriel' + (n > 1 ? 's' : '') + ' envoyé' + (n > 1 ? 's' : '') + ' aujourd’hui' + (q.conseil ? ' · ' + q.conseil : '');
      }
      return 'Envois du jour : ' + (q.utilise || 0) + ' / ' + (q.max || 30) + ' envoyés' +
        (q.restant ? ' · ' + q.restant + ' restant' + (q.restant > 1 ? 's' : '') : ' · limite atteinte') +
        (q.persistant ? '' : ' (journal non appliqué : le compteur est provisoire)');
    }
    function lireQuota() {
      if (!C || !C.appeler) return;
      C.appeler({ mode: 'quota' }).then(function (r) {
        var z = racine.querySelector('#pret-quota');
        if (z) z.textContent = quotaTexte(r.ok && r.d && r.d.quota);
      });
    }
    function lireJournal() {
      var note = racine.querySelector('#pret-suivi-note');
      var corps = racine.querySelector('#pret-suivi tbody');
      if (!C || !C.appeler) {
        if (note) note.textContent = 'Suivi indisponible hors session.';
        return;
      }
      C.appeler({ mode: 'journal' }).then(function (r) {
        if (!r.ok || !r.d) {
          if (note) note.textContent = 'Suivi indisponible pour le moment.';
          return;
        }
        if (r.d.note) { if (note) note.textContent = r.d.note; }
        else if (note) note.textContent = (r.d.lignes && r.d.lignes.length)
          ? r.d.lignes.length + ' envoi' + (r.d.lignes.length > 1 ? 's' : '') + ' récents.'
          : 'Aucun envoi enregistré pour le moment.';
        if (!corps) return;
        var lignes = r.d.lignes || [];
        if (!lignes.length) { corps.innerHTML = '<tr><td colspan="4">—</td></tr>'; return; }
        corps.innerHTML = lignes.map(function (l) {
          return '<tr><td>' + esc(formaterQuand(l.envoye_le)) + '</td><td>' + esc(l.destinataire || '') +
            (l.societe ? '<br><span class="col-opt">' + esc(l.societe) + '</span>' : '') + '</td><td>' +
            esc(l.modele || l.sujet || '') + '</td><td><span class="col-statut col-statut-' + esc(l.statut || 'envoye') + '">' +
            esc(libelleStatut(l.statut)) +
            (l.ouvert_nb ? ' · ' + l.ouvert_nb + ' ouv.' : '') +
            (l.clique_nb ? ' · ' + l.clique_nb + ' clic' : '') +
            '</span></td></tr>';
        }).join('');
      });
    }
    function relireClient() {
      var rendu = renduPret(racine, [], false);
      var iframe = racine.querySelector('#pret-apercu');
      var etat = racine.querySelector('#pret-etat');
      if (!rendu || !iframe) return null;
      iframe.srcdoc = rendu.html;
      if (etat) etat.textContent = 'Aperçu à jour.';
      dessinerPieces(racine, lireBrochuresCochees(racine), pretEtat.piece);
      return rendu;
    }
    function relireServeur() {
      var rendu = relireClient();
      if (!rendu || !C || !C.appeler) return;
      var v = varsPret(racine);
      var dest = ((racine.querySelector('#pret-email') || {}).value || '').trim();
      var m = modelePretCourant();
      C.appeler({
        mode: 'apercu',
        modele: m && m.id,
        layout: pretEtat.dispositionV2 || undefined,
        brochures: lireBrochuresCochees(racine),
        joindreBrochure: lireBrochuresCochees(racine).length > 0,
        envois: [{ to: dest, nom: v.nom, societe: v.societe, ville: v.ville, accroche: v.accroche, sujet: rendu.sujet, titre: rendu.titre, texte: rendu.texte }],
        visuel: rendu.visuel || '',
        visuelAlt: rendu.visuelAlt || '',
        lienTexte: rendu.bouton ? rendu.bouton.texte : '',
        lienUrl: rendu.bouton ? rendu.bouton.url : '',
        signature: C.signature ? C.signature() : {}
      }).then(function (r) {
        var iframe = racine.querySelector('#pret-apercu');
        if (r.ok && r.d && r.d.html && iframe) iframe.srcdoc = r.d.html;
      });
    }
    function planifier() {
      relireClient();
      if (timer) clearTimeout(timer);
      timer = setTimeout(relireServeur, 280);
    }
    /* « Déjà envoyé » : le serveur dit si ce couple destinataire + modèle est
       déjà parti (même clé que celle qui bloque l'envoi). Le bouton est
       alors désactivé — le serveur refuserait de toute façon. */
    var dejaTimer = null;
    function verifierDeja() {
      var btn = racine.querySelector('#pret-envoyer');
      var z = racine.querySelector('#pret-deja');
      if (!btn || !z) return;
      var c = champsEnvoi();
      var m = modelePretCourant();
      var libre = function () {
        z.hidden = true; z.textContent = '';
        if (btn.getAttribute('data-deja') === '1') { btn.disabled = false; btn.removeAttribute('data-deja'); btn.removeAttribute('aria-disabled'); }
      };
      if (!C || !C.appeler || !m || !RE_EMAIL.test(c.dest)) { libre(); return; }
      C.appeler({ mode: 'deja', modele: m.id || m.nom, envois: [{ to: c.dest }] }).then(function (r) {
        var x = r.ok && r.d && r.d.deja && r.d.deja[0];
        if (!x || !x.deja) { libre(); return; }
        z.hidden = false;
        /* « Déjà envoyé le JJ/MM — renvoi possible à partir du … » : texte du serveur,
           qui calcule la fenêtre de 60 jours. */
        z.textContent = x.texte || 'Déjà envoyé à ' + c.dest + ' avec ce modèle il y a moins de 60 jours.';
        btn.disabled = true; btn.setAttribute('data-deja', '1'); btn.setAttribute('aria-disabled', 'true');
      });
    }
    function programmerDeja() {
      if (dejaTimer) clearTimeout(dejaTimer);
      dejaTimer = setTimeout(verifierDeja, 350);
    }
    function champsEnvoi() {
      var v = varsPret(racine);
      var piece = pretEtat.piece;
      return {
        dest: ((racine.querySelector('#pret-email') || {}).value || '').trim(),
        nom: v.nom,
        societe: v.societe,
        ville: v.ville,
        brochures: lireBrochuresCochees(racine),
        joindreBrochure: lireBrochuresCochees(racine).length > 0,
        pieceBase64: piece && piece.base64,
        pieceNom: piece && piece.nom
      };
    }
    function dessinerLot() {
      var z = racine.querySelector('#pret-lot-etat');
      var liste = racine.querySelector('#pret-lot-apercu');
      var n = lotLu.ok.length, e = lotLu.erreurs.length, i = lotLu.ignores;
      if (z) {
        z.textContent = n
          ? (n + ' destinataire' + (n > 1 ? 's' : '') + ' prêt' + (n > 1 ? 's' : '') +
            (e ? ' · ' + e + ' ligne' + (e > 1 ? 's' : '') + ' écartée' + (e > 1 ? 's' : '') : '') +
            (i ? ' · ' + i + ' doublon' + (i > 1 ? 's' : '') : '') + '.')
          : (e ? e + ' ligne' + (e > 1 ? 's' : '') + ' invalide' + (e > 1 ? 's' : '') + '.' : 'Aucune adresse reconnue.');
      }
      if (liste) {
        liste.innerHTML = lotLu.ok.slice(0, 12).map(function (l) {
          return '<div>' + esc(l.nom || '—') + ' · ' + esc(l.email) + (l.societe ? ' · ' + esc(l.societe) : '') + '</div>';
        }).join('') + (n > 12 ? '<div class="col-opt">… et ' + (n - 12) + ' de plus</div>' : '');
      }
    }
    function lireListe(texte) {
      lotLu = M.parseCsv ? M.parseCsv(texte) : { ok: [], erreurs: [], ignores: 0 };
      dessinerLot();
    }

    var zone = racine.querySelector('.col-pret') || racine;
    zone.addEventListener('click', function (e) {
      var mod = e.target.closest && e.target.closest('[data-pret-modele]');
      if (mod) {
        pretEtat.id = mod.getAttribute('data-pret-modele');
        pretEtat.vars = varsPret(racine);
        pretEtat.dest = ((racine.querySelector('#pret-email') || {}).value || '').trim();
        aller('pret');
        return;
      }
      var fmt = e.target.closest && e.target.closest('[data-apercu-fmt]');
      if (fmt) {
        pretEtat.apercuFmt = fmt.getAttribute('data-apercu-fmt');
        var cadre = racine.querySelector('#pret-cadre');
        if (cadre) {
          cadre.classList.toggle('est-mobile', pretEtat.apercuFmt === 'mobile');
          cadre.classList.toggle('est-desktop', pretEtat.apercuFmt !== 'mobile');
        }
        Array.prototype.forEach.call(racine.querySelectorAll('[data-apercu-fmt]'), function (b) {
          b.classList.toggle('est-on', b.getAttribute('data-apercu-fmt') === pretEtat.apercuFmt);
        });
      }
    });
    zone.addEventListener('input', function (e) {
      if (e.target && e.target.id === 'pret-liste') lireListe(e.target.value);
      if (e.target && (e.target.id === 'pret-dirigeant' || e.target.id === 'pret-email' || e.target.id === 'pret-agence' || e.target.id === 'pret-ville')) {
        pretEtat.vars = varsPret(racine);
        pretEtat.dest = ((racine.querySelector('#pret-email') || {}).value || '').trim();
        if (e.target.id === 'pret-email') programmerDeja();
        if (!pretEtat.brochuresManuel && (e.target.id === 'pret-agence' || e.target.id === 'pret-dirigeant')) {
          pretEtat.brochures = brochuresParDefaut(ficheParSiret(pretEtat.siret));
          Array.prototype.forEach.call(racine.querySelectorAll('[data-brochure]'), function (el) {
            el.checked = pretEtat.brochures.indexOf(el.getAttribute('data-brochure')) !== -1;
          });
          var s = brochureSuggereePret(ficheParSiret(pretEtat.siret));
          var cat = catalogueBrochures();
          var hint = racine.querySelector('#pret-brochure-suggestion');
          if (hint) {
            hint.textContent = (s && cat[s])
              ? 'Suggestion d’après le prospect : ' + cat[s].label + '.'
              : 'Aucune, une ou plusieurs brochures peuvent être jointes.';
          }
        }
        planifier();
      }
    });
    zone.addEventListener('change', function (e) {
      if (e.target && e.target.getAttribute && e.target.getAttribute('data-brochure')) {
        pretEtat.brochures = lireBrochuresCochees(racine);
        pretEtat.brochuresManuel = true;
        planifier();
      }
    });

    var pdf = racine.querySelector('#pret-pdf');
    if (pdf) pdf.addEventListener('change', function () {
      var f = pdf.files && pdf.files[0];
      var etat = racine.querySelector('#pret-pdf-etat');
      pretEtat.piece = null;
      if (!f) { if (etat) etat.textContent = 'Aucun PDF personnel.'; return; }
      var verif = M.validerPdfFichier ? M.validerPdfFichier(f) : Promise.resolve({ ok: false, motif: 'Contrôle indisponible.' });
      verif.then(function (v) {
        if (!v.ok) { if (etat) etat.textContent = v.motif; pdf.value = ''; return; }
        var reader = new FileReader();
        reader.onload = function () {
          var r = String(reader.result || '');
          var b64 = r.indexOf(',') >= 0 ? r.split(',')[1] : r;
          pretEtat.piece = { nom: f.name, base64: b64 };
          if (etat) etat.textContent = 'PDF personnel prêt : ' + f.name + ' (' + Math.round(f.size / 1024) + ' Ko).';
          dessinerPieces(racine, lireBrochuresCochees(racine), pretEtat.piece);
        };
        reader.readAsDataURL(f);
      });
    });

    var csv = racine.querySelector('#pret-csv');
    if (csv) csv.addEventListener('change', function () {
      var f = csv.files && csv.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var zoneListe = racine.querySelector('#pret-liste');
        if (zoneListe) zoneListe.value = String(reader.result || '');
        lireListe(String(reader.result || ''));
      };
      reader.readAsText(f, 'utf-8');
    });

    planifier();
    lireQuota();
    lireJournal();
    verifierDeja();

    var copier = racine.querySelector('#pret-copier');
    if (copier) copier.addEventListener('click', function () {
      var rendu = renduPret(racine, [], true);
      if (!rendu) return;
      M.copierMailHtml(rendu.html, rendu.texte).then(function (ok) {
        toast(ok ? 'Mail copié (HTML et texte).' : 'Copie impossible.');
        if (ok) majApresPreparation(racine, rendu);
      });
    });

    function lancer(mode) {
      var rendu = renduPret(racine, [], true);
      if (!rendu) return;
      var m = modelePretCourant();
      var c = champsEnvoi();
      envoyerDirect({
        bouton: mode === 'test' ? racine.querySelector('#pret-test') : racine.querySelector('#pret-envoyer'),
        etat: racine.querySelector('#pret-envoi'),
        dest: c.dest,
        rendu: rendu,
        modele: m,
        mode: mode,
        nom: c.nom,
        societe: c.societe,
        ville: c.ville,
        joindreBrochure: c.joindreBrochure,
        brochures: c.brochures,
        pieceBase64: c.pieceBase64,
        pieceNom: c.pieceNom,
        apres: function () {
          if (mode !== 'test') majApresPreparation(racine, rendu, true);
          lireQuota();
          lireJournal();
          verifierDeja();
        }
      });
    }
    var envoiP = racine.querySelector('#pret-envoyer');
    if (envoiP) envoiP.addEventListener('click', function () { lancer('envoi'); });
    var testP = racine.querySelector('#pret-test');
    if (testP) testP.addEventListener('click', function () { lancer('test'); });

    var lotBtn = racine.querySelector('#pret-lot-envoyer');
    if (lotBtn) lotBtn.addEventListener('click', function () {
      if (!envoiDirectDispo()) { toast('Envoi direct indisponible.'); return; }
      if (!lotLu.ok.length) { toast('Aucune adresse valide à envoyer.'); return; }
      var m = modelePretCourant();
      var rendu = renduPret(racine, [], true);
      if (!rendu) return;
      var c = champsEnvoi();
      if (!window.confirm('Envoyer « ' + m.nom + ' » à ' + lotLu.ok.length + ' destinataire' + (lotLu.ok.length > 1 ? 's' : '') + ' ?')) return;
      lotBtn.disabled = true;
      lotBtn.textContent = 'Envoi en cours…';
      var etat = racine.querySelector('#pret-lot-etat');
      var corps = {
        mode: 'envoi',
        modele: m.id,
        brochures: c.brochures || [],
        joindreBrochure: (c.brochures || []).length > 0,
        envois: lotLu.ok.map(function (l) {
          return { to: l.email, nom: l.nom, societe: l.societe, ville: l.ville };
        }),
        signature: C.signature ? C.signature() : {}
      };
      C.appeler(corps).then(function (r) {
        var parti = r.ok && r.d && r.d.envoyes && r.d.envoyes.length;
        var q = r.d && r.d.quota ? texteQuotaEnvoi(r.d.quota) : '';
        var refuses = (r.d && r.d.refuses) || [];
        if (!parti) {
          if (etat) etat.textContent = messageEchecEnvoi(r);
          toast(messageEchecEnvoi(r));
          return;
        }
        var msg = r.d.envoyes.length + ' courriel' + (r.d.envoyes.length > 1 ? 's' : '') + ' envoyé' + (r.d.envoyes.length > 1 ? 's' : '') +
          (refuses.length ? ' · ' + refuses.length + ' écarté' + (refuses.length > 1 ? 's' : '') : '') +
          (q ? ' · ' + q : '') + '.';
        if (etat) etat.textContent = msg;
        toast(msg);
        lireQuota();
        lireJournal();
      }).catch(function () {
        if (etat) etat.textContent = 'Le serveur ne répond pas.';
      }).then(function () {
        lotBtn.disabled = false;
        lotBtn.textContent = 'Envoyer le lot';
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
      /* L'accroche ne vaut que pour la fiche préparée : jamais reportée sur une autre. */
      Object.assign(pretEtat, { accroche: '', dispositionV2: '' }, o || {});
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
