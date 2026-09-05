/* ═══════════════════════════════════════════════════════════════
   DÉVERROUILLAGE PAR EMPREINTE

   Le mot de passe d'un compte de fondateur est long, et la console
   s'ouvre plusieurs fois par jour, souvent d'une main, entre deux
   rendez-vous. Après une première connexion normale, l'appareil peut
   donc retenir la session — mais seulement derrière l'empreinte ou
   le visage de son propriétaire.

   ─── Ce que cela protège, et ce que cela ne protège pas ───

   Le doigt ne prouve rien à Supabase : il n'y a pas de serveur
   WebAuthn en face. Il prouve à CE téléphone que c'est bien son
   propriétaire qui le tient. C'est donc un déverrouillage d'appareil,
   pas un second facteur contre un attaquant distant. Il ne faut pas
   le vendre pour autre chose.

   Ce qu'il apporte réellement : le jeton de session n'est pas gardé
   en clair. Il est chiffré par une clé dérivée de l'authentificateur
   lui-même (extension « prf » de WebAuthn), clé qui n'existe nulle
   part sur le disque et ne réapparaît qu'après une vérification
   biométrique réussie. Un octet volé sans le doigt ne vaut rien.

   Quand « prf » n'est pas disponible — Safari ancien, certains
   Android — on refuse d'activer plutôt que de stocker un jeton en
   clair derrière une porte décorative. Mieux vaut retaper son mot de
   passe que croire à une sécurité qui n'existe pas.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLE_ID   = 'melodia_empreinte_id';    /* identifiant de la clé d'appareil */
  var CLE_COFFRE = 'melodia_empreinte_coffre'; /* jeton chiffré + sel */
  var CLE_QUI  = 'melodia_empreinte_qui';   /* pour dire « Continuer comme … » */

  function b64(buf) {
    var o = '', b = new Uint8Array(buf);
    for (var i = 0; i < b.length; i++) o += String.fromCharCode(b[i]);
    return btoa(o).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function deB64(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var b = atob(s), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  function lire(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function jeter(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* Le domaine de la clé. WebAuthn exige que ce soit le domaine
     courant ou un domaine parent — on prend donc celui de la page,
     ce qui vaut aussi bien en local qu'en production. */
  function domaine() { return location.hostname; }

  var API = {

    /* L'appareil sait-il vérifier une empreinte ou un visage ? */
    async disponible() {
      if (!window.PublicKeyCredential ||
          !window.isSecureContext ||
          !navigator.credentials ||
          !window.crypto || !crypto.subtle) return false;
      try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch (e) { return false; }
    },

    /* Une clé a-t-elle déjà été posée sur cet appareil ? */
    enrole: function () { return !!(lire(CLE_ID) && lire(CLE_COFFRE)); },
    qui: function () { return lire(CLE_QUI) || ''; },

    /* ─── Poser la clé ───
       Appelé juste après une connexion réussie, et seulement si la
       personne le demande. Rend un message d'erreur explicite : un
       refus silencieux ferait croire à une panne. */
    async activer(nomAffiche) {
      var jeton = window.MelodiaAuth && window.MelodiaAuth.jetonDeRetour();
      if (!jeton) throw new Error('Connectez-vous d\'abord : il n\'y a pas encore de session à retenir.');

      var defi = crypto.getRandomValues(new Uint8Array(32));
      var idUtil = crypto.getRandomValues(new Uint8Array(16));
      var sel = crypto.getRandomValues(new Uint8Array(32));

      var cred = await navigator.credentials.create({
        publicKey: {
          challenge: defi,
          rp: { name: 'Melodia Funèbre', id: domaine() },
          user: { id: idUtil, name: nomAffiche || 'compte', displayName: nomAffiche || 'compte' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred'
          },
          timeout: 60000,
          attestation: 'none',
          extensions: { prf: {} }
        }
      });
      if (!cred) throw new Error('L\'appareil n\'a pas créé de clé.');

      var ext = cred.getClientExtensionResults ? cred.getClientExtensionResults() : {};
      if (!ext.prf || !ext.prf.enabled) {
        throw new Error(
          "Cet appareil sait lire une empreinte, mais pas en dériver une clé de " +
          "chiffrement. Le jeton devrait alors être gardé en clair : nous " +
          "préférons ne pas l'activer. Votre mot de passe reste la voie sûre.");
      }

      /* La clé de chiffrement se dérive à l'usage, jamais à la création :
         il faut donc une première vérification pour l'obtenir. */
      var secret = await this._secret(cred.rawId, sel);
      var coffre = await this._sceller(jeton, secret, sel);

      ecrire(CLE_ID, b64(cred.rawId));
      ecrire(CLE_COFFRE, { sel: b64(sel), iv: coffre.iv, data: coffre.data });
      ecrire(CLE_QUI, nomAffiche || '');
      return true;
    },

    /* ─── Ouvrir ───
       Une vérification biométrique, la clé qui en sort, le jeton
       déchiffré, et une session neuve demandée à Supabase. */
    async ouvrir() {
      var id = lire(CLE_ID), coffre = lire(CLE_COFFRE);
      if (!id || !coffre) throw new Error('Aucune empreinte enregistrée sur cet appareil.');

      var secret = await this._secret(deB64(id), deB64(coffre.sel));
      var jeton = await this._ouvrirCoffre(coffre, secret);
      /* Le jeton de rafraîchissement est à usage unique : Supabase en
         rend un neuf à chaque fois, qu'il faut resceller sans quoi le
         déverrouillage ne marcherait qu'une seule fois. */
      var u = await window.MelodiaAuth.rouvrir(jeton);
      await this._resceller();
      return u;
    },

    /* ─── Oublier cet appareil ─── */
    oublier: function () { jeter(CLE_ID); jeter(CLE_COFFRE); jeter(CLE_QUI); },

    /* ─── Rouages ─── */

    /* Demande à l'authentificateur la clé dérivée « prf ». C'est ici
       que le doigt est réclamé. */
    async _secret(rawId, sel) {
      var demande = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: domaine(),
        userVerification: 'required',
        timeout: 60000,
        extensions: { prf: { eval: { first: sel } } }
      };
      demande.allowCredentials = [{ type: 'public-key', id: rawId, transports: ['internal'] }];
      var a = await navigator.credentials.get({ publicKey: demande });
      var ext = a && a.getClientExtensionResults ? a.getClientExtensionResults() : {};
      if (!ext.prf || !ext.prf.results || !ext.prf.results.first) {
        throw new Error("La clé de déverrouillage n'a pas pu être dérivée.");
      }
      return crypto.subtle.importKey('raw', ext.prf.results.first, 'HKDF', false, ['deriveKey']);
    },

    async _aes(secret, sel) {
      return crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: sel, info: new TextEncoder().encode('melodia-empreinte') },
        secret, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    },

    /* Le sel est passé explicitement : le déduire du stockage marchait
       au rescellement mais donnait un sel vide à la toute première
       pose, donc une clé dérivée d'autre chose que ce qu'on relira. */
    async _sceller(texte, secret, sel) {
      var cle = await this._aes(await secret, sel);
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv },
        cle, new TextEncoder().encode(texte));
      return { iv: b64(iv), data: b64(chiffre) };
    },

    async _ouvrirCoffre(coffre, secret) {
      var cle = await this._aes(await secret, deB64(coffre.sel));
      var clair = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(coffre.iv) },
        cle, deB64(coffre.data));
      return new TextDecoder().decode(clair);
    },

    /* Après chaque ouverture, le jeton a changé : on rescelle le neuf.
       Sans cela, la deuxième tentative échouerait sur un jeton déjà
       consommé — et la panne serait incompréhensible. */
    async _resceller() {
      try {
        var neuf = window.MelodiaAuth.jetonDeRetour();
        var coffre = lire(CLE_COFFRE), id = lire(CLE_ID);
        if (!neuf || !coffre || !id) return;
        var sel = deB64(coffre.sel);
        var secret = this._secret(deB64(id), sel);
        var scelle = await this._sceller(neuf, secret, sel);
        ecrire(CLE_COFFRE, { sel: coffre.sel, iv: scelle.iv, data: scelle.data });
      } catch (e) { /* Le déverrouillage a réussi : ne pas le gâcher pour ça */ }
    }
  };

  window.MelodiaEmpreinte = API;
})();
