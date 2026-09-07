/* ═══════════════════════════════════════════════════════════════
   motdepasse.js — Changer son mot de passe depuis son espace

   POURQUOI

   Le seul chemin pour changer de mot de passe passait par « mot de
   passe oublié » : il fallait se déconnecter, demander un courriel,
   attendre, cliquer. Et ce chemin-là ne fonctionnait pas — le lien
   reçu était pris pour un retour de connexion Google, si bien que la
   page connectait la personne et l'envoyait au tableau de bord sans
   jamais lui demander de nouveau mot de passe.

   Quelqu'un de connecté qui veut simplement changer son mot de passe
   doit pouvoir le faire là où il est, en trois champs. C'est ce
   module, monté à l'identique dans les quatre espaces.

   POURQUOI DEMANDER L'ANCIEN

   Supabase ne l'exige pas : le jeton de session suffit. Nous le
   demandons quand même, et nous le vérifions vraiment — en tentant
   une connexion avec. Un écran laissé ouvert dans une agence
   funéraire, et n'importe qui change le mot de passe et prend la
   main sur les commandes des familles. Ce champ est le seul rempart.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  function force(v) {
    var n = 0;
    if (v.length >= 8) n++;
    if (v.length >= 14) n++;
    if (/[0-9]/.test(v) && /[a-zA-Z]/.test(v)) n++;
    if (/[^a-zA-Z0-9]/.test(v)) n++;
    return n;
  }

  /* Trois mots courts et deux chiffres : plus facile à retenir et à
     dicter qu'une suite de symboles, et bien plus solide qu'un mot
     unique avec un « 1 » au bout. */
  function proposer() {
    var mots = ['saule', 'orgue', 'cendre', 'archet', 'brume', 'colline', 'ivoire', 'lampe',
                'marbre', 'nacre', 'oiseau', 'pluie', 'racine', 'silence', 'tilleul', 'velours'];
    var t = new Uint32Array(4);
    (window.crypto || window.msCrypto).getRandomValues(t);
    return [mots[t[0] % 16], mots[t[1] % 16], mots[t[2] % 16]].join('-') + '-' + (10 + (t[3] % 90));
  }

  function vue(titre) {
    var u = (window.MelodiaAuth && window.MelodiaAuth.current()) || {};
    return '<div class="panel mdp-bloc">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">' + (titre || 'Changer mon <em>mot de passe</em>') + '</div>' +
        '<div class="panel-sub">' + esc(u.email || '') + '</div>' +
      '</div></div>' +
      '<p class="panel-note">Le nouveau mot de passe est actif immédiatement. ' +
      'Vos autres appareils déjà connectés le restent ; c\'est à la prochaine connexion ' +
      'qu\'il faudra saisir le nouveau.</p>' +

      '<div class="field">' +
        '<label class="field-label" for="mdp-ancien">Mot de passe actuel</label>' +
        '<input class="field-input" id="mdp-ancien" type="password" autocomplete="current-password">' +
      '</div>' +

      '<div class="field">' +
        '<label class="field-label" for="mdp-neuf">Nouveau mot de passe</label>' +
        '<div class="mdp-ligne">' +
          '<input class="field-input" id="mdp-neuf" type="password" autocomplete="new-password" placeholder="8 caractères minimum">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="mdp-proposer">Proposer</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="mdp-voir">Afficher</button>' +
        '</div>' +
        '<div class="mdp-force" id="mdp-force"><span></span></div>' +
      '</div>' +

      '<div class="field">' +
        '<label class="field-label" for="mdp-neuf2">Confirmez le nouveau</label>' +
        '<input class="field-input" id="mdp-neuf2" type="password" autocomplete="new-password">' +
      '</div>' +

      '<div class="form-msg" id="mdp-msg"></div>' +
      '<button class="btn btn-gold" id="mdp-valider">Enregistrer le nouveau mot de passe</button>' +
    '</div>';
  }

  function brancher(hote) {
    var racine = hote || document;
    var q = function (id) { return racine.querySelector('#' + id); };
    var neuf = q('mdp-neuf'), jauge = q('mdp-force'), msg = q('mdp-msg');
    if (!neuf) return;

    var dire = function (t, ok) {
      if (!msg) return;
      msg.className = 'form-msg' + (t ? (ok ? ' ok' : ' err') : '');
      msg.textContent = t || '';
      msg.style.display = t ? 'block' : '';
    };

    var MOTS = ['Trop court', 'Faible', 'Correct', 'Solide', 'Excellent'];
    var TEINTES = ['var(--red)', 'var(--red)', 'var(--amber)', 'var(--green)', 'var(--green)'];
    var majJauge = function () {
      if (!jauge) return;
      var v = neuf.value;
      if (!v) { jauge.firstChild.style.width = '0'; jauge.dataset.mot = ''; return; }
      var n = force(v);
      jauge.firstChild.style.width = (25 * Math.max(n, 1)) + '%';
      jauge.firstChild.style.background = TEINTES[n];
      jauge.dataset.mot = MOTS[n];
    };
    neuf.addEventListener('input', majJauge);

    var prop = q('mdp-proposer');
    if (prop) prop.addEventListener('click', function () {
      var p = proposer();
      neuf.value = p;
      var c = q('mdp-neuf2'); if (c) c.value = p;
      neuf.type = 'text'; if (c) c.type = 'text';
      var v = q('mdp-voir'); if (v) v.textContent = 'Masquer';
      majJauge();
      dire('Notez-le avant d\'enregistrer : il ne sera plus affiché.', true);
    });

    var voir = q('mdp-voir');
    if (voir) voir.addEventListener('click', function () {
      var cache = neuf.type === 'password';
      neuf.type = cache ? 'text' : 'password';
      var c = q('mdp-neuf2'); if (c) c.type = cache ? 'text' : 'password';
      voir.textContent = cache ? 'Masquer' : 'Afficher';
    });

    var b = q('mdp-valider');
    if (b) b.addEventListener('click', async function () {
      var ancien = (q('mdp-ancien') || {}).value || '';
      var a = neuf.value, c = (q('mdp-neuf2') || {}).value || '';
      if (!ancien) return dire('Saisissez votre mot de passe actuel.');
      if (a !== c) return dire('Les deux nouveaux mots de passe ne sont pas identiques.');
      if (a.length < 8) return dire('Huit caractères minimum : ce compte ouvre des données de familles.');
      if (a === ancien) return dire('Le nouveau mot de passe est identique à l\'ancien.');

      b.disabled = true; b.textContent = 'Vérification…';
      var u = (window.MelodiaAuth && window.MelodiaAuth.current()) || {};
      try {
        /* On vérifie l'ancien pour de bon plutôt que de le croire sur
           parole : sinon le champ n'est qu'un décor, et un écran
           laissé ouvert suffit à prendre la main. */
        await window.MelodiaAuth.login(u.email, ancien);
      } catch (e) {
        b.disabled = false; b.textContent = 'Enregistrer le nouveau mot de passe';
        return dire('Le mot de passe actuel est incorrect.');
      }

      b.textContent = 'Enregistrement…';
      try {
        var r = await window.MelodiaAuth.changerMotDePasse(a);
        dire(r, true);
        b.textContent = 'Mot de passe modifié';
        ['mdp-ancien', 'mdp-neuf', 'mdp-neuf2'].forEach(function (id) { var e = q(id); if (e) e.value = ''; });
        majJauge();
        setTimeout(function () { b.disabled = false; b.textContent = 'Enregistrer le nouveau mot de passe'; }, 2500);
      } catch (e) {
        b.disabled = false; b.textContent = 'Enregistrer le nouveau mot de passe';
        dire(e.message);
      }
    });
  }

  window.MelodiaMotDePasse = { vue: vue, brancher: brancher, proposer: proposer };
})();
