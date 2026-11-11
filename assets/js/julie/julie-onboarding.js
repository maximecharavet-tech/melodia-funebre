/*!
 * julie-onboarding.js — Console Julie v2 · onboarding 3 étapes.
 *
 * Affiche une carte soignée quand Julie n’a encore aucun prospect.
 * Trois étapes :
 *   ① Vérifier ma signature
 *   ② Trouver 20 agences de mon secteur
 *   ③ M’envoyer un test
 *
 * Chaque étape se coche automatiquement quand son critère est rempli, ou au
 * clic sur le bouton. La carte se dissout une fois les trois étapes faites,
 * et un marqueur local empêche de la revoir.
 *
 * Dépend de : window.MelodiaJulie, window.MelodiaSignature (optionnel),
 *             window.MelodiaJulieWasm (via julie-core), window.MelodiaMotion.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J) return;

  var CLE = 'melodia.julie.onboarding.v1';

  function esc(s) { return J.esc(s); }

  function lireEtat() {
    var st = J.lireCache(CLE, { signature: false, agences: false, test: false, ferme: false });
    if (!st || typeof st !== 'object') st = { signature: false, agences: false, test: false, ferme: false };
    return st;
  }

  function ecrireEtat(st) {
    J.ecrireCache(CLE, st);
  }

  function etapes(st) {
    return [
      {
        cle: 'signature',
        texte: 'Vérifier ma signature',
        fait: !!st.signature,
        action: 'Vérifier'
      },
      {
        cle: 'agences',
        texte: 'Trouver 20 agences de mon secteur',
        fait: !!st.agences,
        action: 'Chercher'
      },
      {
        cle: 'test',
        texte: 'M’envoyer un courriel de test',
        fait: !!st.test,
        action: 'M’envoyer'
      }
    ];
  }

  function carteHTML(st) {
    var liste = etapes(st);
    var items = liste.map(function (e, i) {
      return '' +
        '<li class="jv2-etape-onboarding" data-etape="' + esc(e.cle) + '" data-etat="' + (e.fait ? 'fait' : 'attente') + '">' +
          '<span class="jv2-etape-rond" aria-hidden="true">' + (e.fait ? '✓' : (i + 1)) + '</span>' +
          '<span class="jv2-etape-texte">' + esc(e.texte) + '</span>' +
          (e.fait ? '' : '<button type="button" class="jv2-etape-action" data-act="' + esc(e.cle) + '">' + esc(e.action) + '</button>') +
        '</li>';
    }).join('');

    return '' +
      '<aside class="jv2-onboarding" role="region" aria-label="Bienvenue">' +
        '<button type="button" class="jv2-onboarding-fermer" aria-label="Fermer" data-act="fermer">×</button>' +
        '<img class="jv2-onboarding-visuel" src="/assets/img/campagne/affiche-partenaire.jpg" alt="" loading="lazy">' +
        '<div>' +
          '<div class="jv2-onboarding-titre">Bienvenue dans votre console</div>' +
          '<div class="jv2-onboarding-sous">Trois étapes pour démarrer, en moins de deux minutes.</div>' +
          '<ul class="jv2-etapes-onboarding">' + items + '</ul>' +
        '</div>' +
      '</aside>';
  }

  // ─── Conditions ──────────────────────────────────────────────────────
  function signatureOK() {
    try {
      var u = (window.MelodiaAuth && window.MelodiaAuth.current && window.MelodiaAuth.current()) || {};
      var sig = (window.MelodiaSignature && window.MelodiaSignature.pour && window.MelodiaSignature.pour(u)) || {};
      return !!(sig && (sig.nom || (u && (u.name || u.nom))));
    } catch (_) { return false; }
  }

  async function prospectsVides() {
    try {
      if (window.MelodiaProspects && typeof window.MelodiaProspects.mine === 'function') {
        var liste = await Promise.resolve(window.MelodiaProspects.mine());
        return !Array.isArray(liste) || liste.length === 0;
      }
    } catch (_) { /* silencieux */ }
    return true;
  }

  // ─── Actions ─────────────────────────────────────────────────────────
  async function actionSignature(conteneur) {
    // Redirige vers la vue profil, qui contient l’éditeur de signature
    window.location.hash = '#compte';
    if (signatureOK()) {
      var st = lireEtat();
      st.signature = true;
      ecrireEtat(st);
      rendreCarte(conteneur);
    }
  }

  async function actionAgences(conteneur) {
    // Utilise la recherche existante
    window.location.hash = '#recherche';
    var st = lireEtat();
    st.agences = true;
    ecrireEtat(st);
    rendreCarte(conteneur);
    if (window.MelodiaMotion && window.MelodiaMotion.toast) {
      window.MelodiaMotion.toast('Choisissez votre département dans l’annuaire.', { type: 'info' });
    }
  }

  async function actionTest(conteneur) {
    try {
      var res = await fetch('/api/prospect-mail', {
        method: 'POST',
        headers: J.entetes(),
        credentials: 'same-origin',
        body: JSON.stringify({
          mode: 'test',
          modele: 'pf-premier-contact',
          envois: [{ to: '', ref: 'onboarding', societe: 'Melodia' }]
        })
      });
      if (res.ok) {
        var st = lireEtat();
        st.test = true;
        ecrireEtat(st);
        rendreCarte(conteneur);
        if (window.MelodiaMotion && window.MelodiaMotion.toast) {
          window.MelodiaMotion.toast('Test envoyé.', { type: 'ok' });
        }
      } else if (res.status === 503) {
        if (window.MelodiaMotion && window.MelodiaMotion.toast) {
          window.MelodiaMotion.toast('Envoi non configuré : utilisez le lien mailto.', { type: 'warn' });
        }
      }
    } catch (e) {
      if (window.MelodiaMotion && window.MelodiaMotion.toast) {
        window.MelodiaMotion.toast('Test impossible : ' + e.message, { type: 'err' });
      }
    }
  }

  async function actionFermer(conteneur) {
    var st = lireEtat();
    st.ferme = true;
    ecrireEtat(st);
    dissoudre(conteneur);
  }

  function dissoudre(conteneur) {
    var carte = conteneur.querySelector('.jv2-onboarding');
    if (!carte) return;
    if (window.MelodiaMotion && window.MelodiaMotion.reduced) {
      carte.remove();
      return;
    }
    carte.classList.add('jv2-onboarding-dissolution');
    setTimeout(function () { if (carte.parentNode) carte.remove(); }, 380);
  }

  // ─── Montage ─────────────────────────────────────────────────────────
  async function rendreCarte(conteneur) {
    if (!conteneur) return;
    var st = lireEtat();
    if (st.ferme) { dissoudre(conteneur); return; }

    // Synchronise les états réels
    if (!st.signature && signatureOK()) st.signature = true;

    var vide = await prospectsVides();
    if (!vide) { st.ferme = true; ecrireEtat(st); dissoudre(conteneur); return; }

    conteneur.innerHTML = carteHTML(st);
    brancher(conteneur);

    // Dissolution automatique si tout est fait
    if (st.signature && st.agences && st.test) {
      setTimeout(function () { dissoudre(conteneur); }, 600);
    }
  }

  function brancher(conteneur) {
    conteneur.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      var act = t.dataset.act;
      if (act === 'signature') return actionSignature(conteneur);
      if (act === 'agences') return actionAgences(conteneur);
      if (act === 'test') return actionTest(conteneur);
      if (act === 'fermer') return actionFermer(conteneur);
    });
  }

  /**
   * Point d’entrée : monte la carte dans un conteneur. Appelé par la vue
   * « Ma journée » quand elle est rendue.
   */
  async function monter(conteneur) {
    if (!conteneur) return;
    var st = lireEtat();
    if (st.ferme) return;
    await rendreCarte(conteneur);
  }

  window.MelodiaJulieOnboarding = {
    monter: monter,
    dissoudre: dissoudre,
    etat: lireEtat
  };
})();
