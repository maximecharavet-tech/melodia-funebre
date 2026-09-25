/* ═══════════════════════════════════════════════════════════════
   application.js — Installer Melodia sur son téléphone

   CE QUE CHAQUE PLATEFORME AUTORISE VRAIMENT

   Android : Chrome émet « beforeinstallprompt » quand le site remplit
   les conditions. On garde l'événement et on l'utilise au moment où
   la personne le demande — l'appeler d'office ferait fuir.

   iPhone : Safari n'émet aucun événement et n'ouvre aucune boîte de
   dialogue. Le seul chemin est « Partager → Sur l'écran d'accueil »,
   et il faut l'expliquer, avec le bon mot et la bonne icône. C'est une
   limite d'Apple, pas un manque de ce fichier.

   QUAND ON PROPOSE, ET QUAND ON SE TAIT

   Jamais à la première visite : proposer d'installer à quelqu'un qui
   ne sait pas encore ce qu'est ce site, c'est le perdre. On attend
   qu'il soit revenu, ou qu'il ait passé un moment ici.

   Et jamais deux fois de suite : un refus vaut pour trois mois. Un
   bandeau qui revient à chaque page est la raison pour laquelle les
   gens détestent les applications web.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLEF = 'melodia_app';
  var TROIS_MOIS = 92 * 24 * 3600 * 1000;

  function etat() {
    try { return JSON.parse(localStorage.getItem(CLEF)) || {}; } catch (e) { return {}; }
  }
  function noter(o) {
    var e = etat();
    for (var k in o) e[k] = o[k];
    try { localStorage.setItem(CLEF, JSON.stringify(e)); } catch (err) {}
  }

  /* Déjà installée : « standalone » sur Android et sur iPhone, par
     deux chemins différents. */
  function installee() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  var estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var estSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

  /* ─── Le travailleur de service ───
     Sans lui, aucun navigateur ne propose l'installation. Il est
     enregistré après le chargement pour ne pas disputer la bande
     passante au premier affichage. */
  var majPrete = null;
  var majDemandee = false;
  function enregistrer() {
    /* « isSecureContext » est la question exacte : le navigateur y
       répond pour nous, et il compte 127.0.0.1 comme sûr là où une
       comparaison à « localhost » l'oubliait. La condition précédente
       mélangeait « ou » et « et » sans parenthèses — un lecteur ne
       pouvait pas deviner laquelle liait le plus fort. */
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () {
        var neuf = reg.installing;
        if (!neuf) return;
        neuf.addEventListener('statechange', function () {
          /* Une version neuve est prête ET une ancienne servait déjà :
             c'est une mise à jour, pas une première installation. */
          if (neuf.state === 'installed' && navigator.serviceWorker.controller) {
            majPrete = neuf;
            annoncerMaj();
          }
        });
      });
    }).catch(function () { /* l'absence d'application n'empêche rien */ });

    /* On ne recharge que si le visiteur l'a demandé. Le travailleur prend
       la main de lui-même (skipWaiting, clients.claim) : à la première
       visite, et à chaque version publiée. Recharger à ce moment-là
       coupait le seuil d'entrée une seconde après son ouverture, chez
       tout nouveau visiteur — la session le marquant déjà comme vu, il
       ne revenait pas —, et relançait la page en pleine lecture. */
    var recharge = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (recharge || !majDemandee) return;
      recharge = true;
      location.reload();
    });
  }

  /* Une mise à jour ne s'impose pas en pleine lecture : on la propose,
     discrètement, et elle attend. */
  function annoncerMaj() {
    if (document.querySelector('.app-maj')) return;
    var d = document.createElement('div');
    d.className = 'app-maj';
    d.setAttribute('role', 'status');
    d.innerHTML = '<span>Une version plus récente est disponible.</span>' +
      '<button type="button" class="btn btn-gold btn-sm">Mettre à jour</button>' +
      '<button type="button" class="app-maj-plus-tard" aria-label="Plus tard">✕</button>';
    d.querySelector('.btn').addEventListener('click', function () {
      majDemandee = true;
      /* Déjà aux commandes (il n'attend pas qu'on le lui demande) : la
         version neuve est là, il ne reste qu'à recharger. */
      if (majPrete && majPrete.state === 'installed') majPrete.postMessage('prendre-la-main');
      else location.reload();
      d.remove();
    });
    d.querySelector('.app-maj-plus-tard').addEventListener('click', function () { d.remove(); });
    document.body.appendChild(d);
  }

  /* ─── L'invitation ─── */
  var promesse = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();      /* on ne laisse pas le navigateur décider du moment */
    promesse = e;
    if (window.MelodiaApp) window.MelodiaApp._prete = true;
    majBoutons();
  });

  window.addEventListener('appinstalled', function () {
    noter({ installee: Date.now() });
    var b = document.querySelector('.app-bandeau');
    if (b) b.remove();
    majBoutons();
  });

  async function installer() {
    if (promesse) {
      promesse.prompt();
      var r = await promesse.userChoice;
      promesse = null;
      noter(r.outcome === 'accepted' ? { installee: Date.now() } : { refuse: Date.now() });
      return r.outcome;
    }
    /* Pas de promesse : soit iPhone, soit un navigateur qui n'en émet
       pas. On explique au lieu de ne rien faire. */
    ouvrirMarche();
    return 'explique';
  }

  /* La marche à suivre, adaptée à l'appareil qu'on tient. */
  function ouvrirMarche() {
    if (document.querySelector('.app-marche')) return;
    var etapes = estIOS
      ? (estSafari
        ? ['Touchez le bouton <b>Partager</b> en bas de l\'écran<br><span class="app-ico">⬆︎</span>',
           'Faites défiler et choisissez <b>Sur l\'écran d\'accueil</b>',
           'Touchez <b>Ajouter</b> — l\'icône Melodia apparaît avec vos applications']
        : ['Sur iPhone, l\'ajout à l\'écran d\'accueil ne fonctionne que depuis <b>Safari</b>',
           'Ouvrez <b>melodia-funebre.fr</b> dans Safari',
           'Puis <b>Partager → Sur l\'écran d\'accueil</b>'])
      : ['Ouvrez le menu de votre navigateur<br><span class="app-ico">⋮</span>',
         'Choisissez <b>Installer l\'application</b> ou <b>Ajouter à l\'écran d\'accueil</b>',
         'Confirmez — l\'icône Melodia apparaît avec vos applications'];

    var v = document.createElement('div');
    v.className = 'app-marche';
    v.setAttribute('role', 'dialog');
    v.setAttribute('aria-modal', 'true');
    v.setAttribute('aria-label', 'Installer l\'application');
    v.innerHTML = '<div class="app-marche-boite">' +
      '<button type="button" class="app-marche-fermer" aria-label="Fermer">✕</button>' +
      '<div class="app-marche-sur">' + (estIOS ? 'Sur iPhone et iPad' : 'Sur votre téléphone') + '</div>' +
      '<h3 class="app-marche-titre">Trois gestes,<br><em>et c\'est fait.</em></h3>' +
      '<ol class="app-marche-liste">' + etapes.map(function (e, i) {
        return '<li><span class="app-marche-n">' + (i + 1) + '</span><span>' + e + '</span></li>';
      }).join('') + '</ol>' +
      '<p class="app-marche-note">L\'application n\'occupe presque rien : c\'est le site lui-même, ' +
      'en plein écran, qui continue de fonctionner quand le réseau faiblit.</p>' +
      '</div>';
    var fermer = function () { v.remove(); document.body.style.overflow = ''; };
    v.addEventListener('click', function (e) {
      if (e.target === v || e.target.closest('.app-marche-fermer')) fermer();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { fermer(); document.removeEventListener('keydown', esc); }
    });
    document.body.appendChild(v);
    document.body.style.overflow = 'hidden';
  }

  /* ─── Le bandeau, proposé au bon moment ─── */
  function proposable() {
    if (installee()) return false;
    var e = etat();
    if (e.installee) return false;
    if (e.refuse && Date.now() - e.refuse < TROIS_MOIS) return false;
    /* Jamais à la première visite : on attend un retour, ou un moment
       passé sur le site. */
    var visites = (e.visites || 0);
    return visites >= 2;
  }

  function bandeau() {
    if (!proposable() || document.querySelector('.app-bandeau')) return;
    var d = document.createElement('div');
    d.className = 'app-bandeau';
    d.setAttribute('role', 'region');
    d.setAttribute('aria-label', 'Installer l\'application');
    d.innerHTML =
      '<img src="/assets/img/icons/icon-192.png" alt="" width="42" height="42" class="app-bandeau-ico">' +
      '<div class="app-bandeau-mots"><b>Melodia sur votre écran d\'accueil</b>' +
      '<span>Vos hommages à portée de doigt, même sans réseau.</span></div>' +
      '<button type="button" class="btn btn-gold btn-sm app-bandeau-oui">Installer</button>' +
      '<button type="button" class="app-bandeau-non" aria-label="Non merci">✕</button>';
    d.querySelector('.app-bandeau-oui').addEventListener('click', async function () {
      var r = await installer();
      if (r !== 'explique') d.remove();
    });
    d.querySelector('.app-bandeau-non').addEventListener('click', function () {
      noter({ refuse: Date.now() });
      d.remove();
    });
    document.body.appendChild(d);
  }

  /* Les boutons « Installer » posés dans les pages suivent l'état. */
  function majBoutons() {
    [].forEach.call(document.querySelectorAll('[data-installer]'), function (b) {
      if (installee() || etat().installee) {
        b.textContent = 'Application déjà installée';
        b.disabled = true;
        b.classList.add('btn-ghost');
        b.classList.remove('btn-gold');
      }
    });
  }

  function demarrer() {
    noter({ visites: (etat().visites || 0) + 1 });
    enregistrer();
    majBoutons();

    [].forEach.call(document.querySelectorAll('[data-installer]'), function (b) {
      b.addEventListener('click', function () { installer(); });
    });
    [].forEach.call(document.querySelectorAll('[data-marche-installation]'), function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); ouvrirMarche(); });
    });

    /* Le bandeau attend que la page soit lue, pas qu'elle s'affiche. */
    if (!installee()) setTimeout(bandeau, 12000);
  }

  window.MelodiaApp = {
    installer: installer, marche: ouvrirMarche,
    installee: installee, estIOS: estIOS
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
