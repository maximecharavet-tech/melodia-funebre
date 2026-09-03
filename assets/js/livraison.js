/* ═══════════════════════════════════════════════════════════════
   MELODIA — Dépôt du MP3 et livraison au client

   Deux modes, choisis tout seuls :

   • SUPABASE (recommandé) — le fichier part directement du navigateur
     vers le stockage, sans transiter par une fonction serveur. Aucune
     limite de taille à craindre, et le client obtient un lien permanent
     qu'il peut ouvrir depuis n'importe quel appareil.

   • LOCAL (sans configuration) — le fichier reste dans ce navigateur,
     conservé en IndexedDB. Écoutable et téléchargeable depuis la
     console, à joindre à la main au courriel de livraison.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BUCKET = 'hommages';
  var BASE_IDB = 'melodia-hommages';
  var MAX = 40 * 1024 * 1024;   /* 40 Mo : très au-delà d'un hommage normal */

  var CFG = window.MELODIA_CONFIG || {};
  var SB = (CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var CLE = CFG.SUPABASE_ANON_KEY || '';
  var AVEC_SB = !!(SB && CLE);

  /* ─── Conservation locale (IndexedDB : contrairement à localStorage,
         elle encaisse plusieurs mégaoctets sans broncher) ─── */
  function ouvrirBase() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(BASE_IDB, 1);
      r.onupgradeneeded = function () {
        if (!r.result.objectStoreNames.contains('fichiers')) r.result.createObjectStore('fichiers');
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error || new Error('IndexedDB indisponible')); };
    });
  }

  async function ecrireLocal(ref, fichier) {
    var db = await ouvrirBase();
    return new Promise(function (res, rej) {
      var tx = db.transaction('fichiers', 'readwrite');
      tx.objectStore('fichiers').put({ blob: fichier, nom: fichier.name, type: fichier.type, taille: fichier.size, date: Date.now() }, ref);
      tx.oncomplete = function () { db.close(); res(true); };
      tx.onerror = function () { db.close(); rej(tx.error); };
    });
  }

  async function lireLocal(ref) {
    try {
      var db = await ouvrirBase();
      return await new Promise(function (res) {
        var tx = db.transaction('fichiers', 'readonly');
        var q = tx.objectStore('fichiers').get(ref);
        q.onsuccess = function () { db.close(); res(q.result || null); };
        q.onerror = function () { db.close(); res(null); };
      });
    } catch (e) { return null; }
  }

  async function effacerLocal(ref) {
    try {
      var db = await ouvrirBase();
      var tx = db.transaction('fichiers', 'readwrite');
      tx.objectStore('fichiers').delete(ref);
      db.close();
    } catch (e) {}
  }

  /* ─── Envoi vers Supabase Storage ─── */
  function envoyerSupabase(fichier, chemin, onProgres) {
    return new Promise(function (res, rej) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', SB + '/storage/v1/object/' + BUCKET + '/' + chemin, true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + jeton());
      xhr.setRequestHeader('apikey', CLE);
      xhr.setRequestHeader('x-upsert', 'true');
      if (fichier.type) xhr.setRequestHeader('Content-Type', fichier.type);
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable && onProgres) onProgres(Math.round(e.loaded / e.total * 100));
      };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          res(SB + '/storage/v1/object/public/' + BUCKET + '/' + chemin);
        } else {
          var msg = 'Le stockage a répondu ' + xhr.status + '.';
          try {
            var d = JSON.parse(xhr.responseText);
            msg = d.message || d.error || msg;
            if (/bucket/i.test(msg) && /not found/i.test(msg)) {
              msg = 'Le dossier de stockage « ' + BUCKET + ' » n\'existe pas encore. Créez-le dans Supabase → Storage, en public.';
            }
            if (xhr.status === 403 || /policy|row-level/i.test(msg)) {
              msg = 'Le stockage refuse l\'envoi : il manque la règle d\'écriture sur le dossier « ' + BUCKET + ' » (voir README).';
            }
          } catch (e) {}
          rej(new Error(msg));
        }
      };
      xhr.onerror = function () { rej(new Error('Envoi interrompu — vérifiez la connexion.')); };
      xhr.send(fichier);
    });
  }

  function jeton() {
    try {
      var s = JSON.parse(localStorage.getItem('melodia_session') || 'null');
      return (s && s.access_token) || CLE;
    } catch (e) { return CLE; }
  }

  /* ─── Interface publique ─── */
  function nomPropre(nom) {
    return String(nom || 'hommage.mp3')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/-+/g, '-').slice(-80);
  }

  window.MelodiaLivraison = {
    mode: AVEC_SB ? 'supabase' : 'local',
    bucket: BUCKET,
    maxOctets: MAX,

    /** Vérifie le fichier avant tout envoi */
    verifier: function (fichier) {
      if (!fichier) return 'Aucun fichier sélectionné.';
      var ok = /^audio\//.test(fichier.type) || /\.(mp3|m4a|wav|ogg|flac)$/i.test(fichier.name);
      if (!ok) return 'Ce fichier n\'est pas un audio. Attendus : MP3, M4A, WAV, OGG ou FLAC.';
      if (fichier.size > MAX) return 'Fichier trop lourd (' + (fichier.size / 1048576).toFixed(1) + ' Mo). Maximum : 40 Mo.';
      if (fichier.size < 10000) return 'Fichier suspect : moins de 10 Ko.';
      return null;
    },

    /**
     * Dépose le fichier et renvoie de quoi le rattacher à la commande.
     * { url, local, taille, nom }
     */
    async deposer(fichier, ref, onProgres) {
      var probleme = this.verifier(fichier);
      if (probleme) throw new Error(probleme);

      if (AVEC_SB) {
        var chemin = ref + '/' + Date.now() + '-' + nomPropre(fichier.name);
        var url = await envoyerSupabase(fichier, chemin, onProgres);
        return { url: url, local: false, taille: fichier.size, nom: fichier.name };
      }

      /* Sans stockage distant : on garde le fichier ici, écoutable et
         téléchargeable, et la livraison se fait en pièce jointe. */
      await ecrireLocal(ref, fichier);
      if (onProgres) onProgres(100);
      return { url: 'local:' + ref, local: true, taille: fichier.size, nom: fichier.name };
    },

    estLocal: function (url) { return /^local:/.test(url || ''); },

    /** Rend une URL écoutable, y compris pour un fichier gardé sur l'appareil */
    async urlEcoute(url) {
      if (!this.estLocal(url)) return url;
      var enr = await lireLocal(url.slice(6));
      return enr ? URL.createObjectURL(enr.blob) : null;
    },

    lireLocal: lireLocal,
    effacerLocal: effacerLocal,

    /** Compose le courriel de livraison à la famille */
    composer: function (commande, url) {
      var prenom = (commande.user_name || '').split(' ')[0] || '';
      var defunt = commande.defunt || 'votre proche';
      var local = this.estLocal(url);
      var lignes = [
        prenom ? 'Bonjour ' + prenom + ',' : 'Bonjour,',
        '',
        'L\'hommage composé pour ' + defunt + ' est prêt.',
        ''
      ];
      if (local) {
        lignes.push('Vous le trouverez en pièce jointe de ce message, au format MP3.');
      } else {
        lignes.push('Vous pouvez l\'écouter et le télécharger ici :');
        lignes.push(url);
      }
      lignes.push(
        '',
        'Le fichier vous appartient : diffusez-le librement pendant la cérémonie,',
        'copiez-le pour vos proches, conservez-le sans limite de durée. Aucun droit',
        'de diffusion n\'est à régler.',
        '',
        'Si quelque chose ne vous touche pas — un mot, une intonation, un passage —',
        'dites-le nous, nous reprenons la composition.',
        '',
        'Avec toutes nos pensées,',
        '',
        'Maxime Charavet',
        'Melodia Funèbre',
        (window.MELODIA_TEL || '07 84 10 16 96'),
        'Référence ' + (commande.ref || '')
      );
      return {
        sujet: 'L\'hommage pour ' + defunt + ' — Melodia Funèbre',
        corps: lignes.join('\n'),
        local: local
      };
    },

    ouvrirMessagerie: function (destinataire, sujet, corps) {
      window.location.href = 'mailto:' + encodeURIComponent(destinataire || '') +
        '?subject=' + encodeURIComponent(sujet) +
        '&body=' + encodeURIComponent(corps);
    }
  };
})();
