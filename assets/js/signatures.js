/* ═══════════════════════════════════════════════════════════════
   signatures.js — La carte de visite de chaque collaborateur

   Chaque courriel de prospection se termine par une carte : nom,
   fonction, coordonnées, portrait. Le portrait doit être hébergé sur
   le site (assets/img/equipe/) : le serveur refuse toute autre adresse
   d'image, pour qu'aucun courriel signé Melodia n'aille chercher une
   image ailleurs.

   POUR AJOUTER UN COLLABORATEUR
   1. Déposer son portrait carré (240 × 240) dans assets/img/equipe/.
   2. Ajouter une ligne ci-dessous, à son adresse de connexion.
   La fonction et le téléphone restent modifiables par la personne
   elle-même, dans « Mon compte ».
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var EQUIPE = {
    'julie@melodia-funebre.fr': {
      nom: 'Julie Serve',
      role: 'Directrice marketing & commerciale',
      photo: '/assets/img/equipe/julie-serve.jpg'
    },
    'maxime@melodia-funebre.fr': {
      nom: 'Maxime Charavet',
      role: 'Fondateur',
      photo: ''
    }
  };

  function cle(email) { return 'melodia_signature_' + String(email || '').toLowerCase(); }

  function lireReglages(email) {
    try { return JSON.parse(localStorage.getItem(cle(email)) || '{}') || {}; } catch (e) { return {}; }
  }

  window.MelodiaSignature = {
    /* La carte de l'utilisateur connecté : la fiche de l'équipe, puis ce
       qu'il a lui-même réglé par-dessus. */
    pour: function (u) {
      u = u || {};
      var email = String(u.email || '').toLowerCase();
      var base = EQUIPE[email] || {};
      var r = lireReglages(email);
      return {
        nom: r.nom || base.nom || u.name || u.nom || 'Melodia Funèbre',
        role: r.role != null && r.role !== '' ? r.role : (base.role || (u.role === 'master' ? 'Fondateur' : 'Chargé·e de partenariats')),
        tel: r.tel || base.tel || '',
        photo: base.photo || '',
        email: email
      };
    },
    enregistrer: function (u, reglages) {
      try { localStorage.setItem(cle(u && u.email), JSON.stringify(reglages || {})); } catch (e) {}
    }
  };
})();
