/*!
 * julie-apercu.js — Console Julie v2 · panneau d’aperçu du courriel.
 *
 * Composant réutilisable. Il monte dans un conteneur et propose :
 *   · le rendu du courriel tel qu’il partira (iframe sandboxed, srcdoc,
 *     sans script) ;
 *   · des toggles Desktop 640 / Mobile 375 / Sombre / Texte brut ;
 *   · un cadre d’appareil ;
 *   · la note de délivrabilité (Wasm) à côté ;
 *   · le bouton « M’envoyer un test » (via /api/prospect-mail mode:test).
 *
 * Le HTML vient du serveur (`mode: 'apercu'`), donc le rendu est exactement
 * celui qui partira. Aucun script n’est injecté dans l’iframe (sandbox sans
 * allow-scripts) : seuls les styles inline produits par le serveur s’appliquent.
 *
 * API :
 *   MelodiaJulieApercu.monter(conteneur, options)
 *   MelodiaJulieApercu.demonter(conteneur)
 *   MelodiaJulieApercu.options — passer/relire l’état
 *
 * options = {
 *   modele: 'pf-premier-contact',
 *   layout: 'editorial' | 'lettre' | 'carte',
 *   sujet: string,
 *   preheader: string,
 *   texte: string,          // texte saisi (peut contenir {vars})
 *   prospect: { siret, nom, ville, email, civilite, dirigeant },
 *   pieces: ['professionnels'],
 *   visuel: '/assets/img/courriel/banniere.jpg',
 *   lienTexte: string,
 *   lienUrl: string,
 *   signature: { nom, role, tel, photo, email },
 *   onTest: function(donnees) {}
 * }
 *
 * Dépend de : window.MelodiaJulie, window.MelodiaJulieWasm (via julie-core),
 *             window.MelodiaMotion (optionnel).
 *
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J) return;

  var REDUCED = !!(window.MelodiaMotion && window.MelodiaMotion.reduced);

  var etatParConteneur = new WeakMap();

  function esc(s) { return J.esc(s); }

  function optionsParDefaut(options) {
    return Object.assign({
      modele: 'pf-premier-contact',
      layout: 'editorial',
      sujet: 'Une chanson pour les familles de votre agence',
      preheader: 'Découvrez le partenariat Melodia Funèbre.',
      texte: '',
      prospect: { siret: '', nom: '', ville: '', email: '', civilite: '', dirigeant: '' },
      pieces: [],
      visuel: '/assets/img/courriel/banniere.jpg',
      lienTexte: 'Voir le partenariat',
      lienUrl: 'https://melodia-funebre.fr/professionnels',
      signature: { nom: 'Julie Serve', role: 'Directrice marketing & commerciale', email: 'julie@melodia-funebre.fr', photo: '/assets/img/equipe/julie-serve.jpg', tel: '' }
    }, options || {});
  }

  // ─── Rendu de la coquille ────────────────────────────────────────────
  function coquilleHTML() {
    return '' +
      '<div class="jv2-apercu">' +
        '<div class="jv2-apercu-colonne">' +
          '<div class="jv2-apercu-barre" role="tablist" aria-label="Mode d’aperçu">' +
            '<button type="button" class="jv2-apercu-tab" data-mode="desktop" aria-pressed="true">Desktop 640</button>' +
            '<button type="button" class="jv2-apercu-tab" data-mode="mobile" aria-pressed="false">Mobile 375</button>' +
            '<button type="button" class="jv2-apercu-tab" data-mode="sombre" aria-pressed="false">Sombre</button>' +
            '<button type="button" class="jv2-apercu-tab" data-mode="texte" aria-pressed="false">Texte brut</button>' +
          '</div>' +
          '<div class="jv2-apercu-appareil" data-appareil="desktop">' +
            '<div class="jv2-apercu-cadre">' +
              '<div class="jv2-apercu-cadre-ombre"></div>' +
              '<iframe class="jv2-apercu-iframe" title="Aperçu du courriel" sandbox="" referrerpolicy="no-referrer"></iframe>' +
            '</div>' +
          '</div>' +
          '<pre class="jv2-apercu-texte" hidden></pre>' +
        '</div>' +
        '<aside class="jv2-apercu-panneau">' +
          '<div class="jv2-apercu-score" aria-live="polite">' +
            '<div class="jv2-apercu-score-ring"><svg viewBox="0 0 60 60" width="60" height="60">' +
              '<circle cx="30" cy="30" r="26" fill="none" stroke="rgba(201,168,76,.12)" stroke-width="4"/>' +
              '<circle cx="30" cy="30" r="26" fill="none" stroke="var(--or-bright, #e3c977)" stroke-width="4" ' +
                'stroke-dasharray="163.36" stroke-dashoffset="163.36" transform="rotate(-90 30 30)" class="jv2-apercu-score-arc"/>' +
            '</svg>' +
            '<span class="jv2-apercu-score-note mono" data-role="note">—</span></div>' +
            '<div class="jv2-apercu-score-label">Délivrabilité</div>' +
          '</div>' +
          '<div class="jv2-apercu-liste" data-role="problemes"></div>' +
          '<div class="jv2-apercu-actions">' +
            '<button type="button" class="btn btn-outline" data-act="test">M’envoyer un test</button>' +
            '<button type="button" class="btn btn-sm btn-outline" data-act="rafraichir" title="Rafraîchir">↻</button>' +
          '</div>' +
          '<div class="jv2-apercu-meta mono" data-role="meta"></div>' +
        '</aside>' +
      '</div>';
  }

  // ─── Calcul de la délivrabilité ──────────────────────────────────────
  async function calculerScore(conteneur, options) {
    var w = window.MelodiaJulieWasm;
    if (!w) return;

    var entrees = {
      objet: options.sujet || '',
      preheader: options.preheader || '',
      texte: options.texte || '',
      html: '',
      liens: extraireLiens(options.lienUrl),
      piece_jointe_ko: false,
      poids_pieces_octets: (options.pieces || []).length * 250_000,
      variables_non_resolues: variablesNonResolues(options.texte, options.prospect),
      personnalise: /\{agence\}|\{accroche\}/.test(options.texte || '') || !!options.accroche || !!(options.prospect && options.prospect.nom),
      a_desabonnement: true
    };

    try {
      var r = await J.delivrabilite(entrees);
      afficherScore(conteneur, r);
    } catch (_) { /* silencieux */ }
  }

  function extraireLiens(url) {
    if (!url) return [];
    return [url];
  }

  function variablesNonResolues(texte, prospect) {
    var vars = String(texte || '').match(/\{[a-z_]+\}/gi) || [];
    var uniques = [];
    vars.forEach(function (v) { if (uniques.indexOf(v) < 0) uniques.push(v); });
    return uniques.filter(function (v) {
      if (v === '{agence}' && prospect && prospect.nom) return false;
      if (v === '{ville_rel}' && prospect && prospect.ville) return false;
      if (v === '{dirigeant}' && prospect && prospect.dirigeant) return false;
      if (v === '{civilite}' && prospect && prospect.civilite) return false;
      if (v === '{accroche}') return false;
      if (v === '{lien_brochure}') return false;
      return true;
    });
  }

  function afficherScore(conteneur, r) {
    var note = conteneur.querySelector('[data-role="note"]');
    var arc = conteneur.querySelector('.jv2-apercu-score-arc');
    var liste = conteneur.querySelector('[data-role="problemes"]');
    if (note) note.textContent = r.note || '—';
    if (arc) {
      var circumference = 2 * Math.PI * 26;
      var offset = circumference * (1 - Math.max(0, Math.min(100, r.score)) / 100);
      arc.setAttribute('stroke-dashoffset', String(offset));
    }
    if (liste) {
      var items = [];
      (r.problemes || []).forEach(function (p) { items.push('<li class="jv2-apercu-pb">' + esc(p) + '</li>'); });
      (r.ok || []).slice(0, 3).forEach(function (o) { items.push('<li class="jv2-apercu-ok">' + esc(o) + '</li>'); });
      liste.innerHTML = items.length ? '<ul>' + items.join('') + '</ul>' : '';
    }
  }

  // ─── Rendu serveur (aperçu) ──────────────────────────────────────────
  async function chargerApercu(conteneur, options) {
    var payload = {
      mode: 'apercu',
      modele: options.modele,
      layout: options.layout,
      envois: [{
        to: (options.prospect && options.prospect.email) || '',
        ref: (options.prospect && options.prospect.siret) || '',
        societe: (options.prospect && options.prospect.nom) || '',
        nom: (options.prospect && options.prospect.dirigeant) || '',
        ville: (options.prospect && options.prospect.ville) || '',
        accroche: options.accroche || '',
        sujet: options.sujet,
        preheader: options.preheader,
        texte: options.texte,
        vars: options.prospect || {},
        visuel: options.visuel,
        visuelAlt: '',
        lienTexte: options.lienTexte,
        lienUrl: options.lienUrl
      }],
      brochures: options.pieces || [],
      signature: options.signature
    };
    var res = await fetch('/api/prospect-mail', {
      method: 'POST',
      headers: J.entetes(),
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    return data && data.html ? String(data.html) : '';
  }

  function injecter(conteneur, html) {
    var iframe = conteneur.querySelector('.jv2-apercu-iframe');
    if (!iframe) return;
    iframe.setAttribute('srcdoc', html || '<!doctype html><html><body style="padding:2rem;font-family:sans-serif;color:#8e8878;">Aperçu indisponible.</body></html>');
  }

  // ─── Modes : desktop / mobile / sombre / texte ───────────────────────
  function appliquerMode(conteneur, mode) {
    var appareil = conteneur.querySelector('[data-appareil]');
    var iframe = conteneur.querySelector('.jv2-apercu-iframe');
    var pre = conteneur.querySelector('.jv2-apercu-texte');
    conteneur.querySelectorAll('.jv2-apercu-tab').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false');
    });
    if (mode === 'texte') {
      if (appareil) appareil.hidden = true;
      if (pre) {
        pre.hidden = false;
        var st = etatParConteneur.get(conteneur);
        pre.textContent = (st && st.texteBrut) || '';
      }
      return;
    }
    if (appareil) appareil.hidden = false;
    if (pre) pre.hidden = true;
    if (!iframe) return;
    var largeur = mode === 'mobile' ? 375 : 640;
    iframe.style.width = largeur + 'px';
    iframe.style.maxWidth = '100%';
    iframe.style.filter = mode === 'sombre' ? 'invert(0.92) hue-rotate(180deg)' : '';
  }

  // ─── Test ────────────────────────────────────────────────────────────
  async function envoyerTest(conteneur, options, cb) {
    var bouton = conteneur.querySelector('[data-act="test"]');
    var promesse = fetch('/api/prospect-mail', {
      method: 'POST',
      headers: J.entetes(),
      credentials: 'same-origin',
      body: JSON.stringify({
        mode: 'test',
        modele: options.modele,
        layout: options.layout,
        envois: [{
          to: (options.prospect && options.prospect.email) || '',
          ref: (options.prospect && options.prospect.siret) || '',
          societe: (options.prospect && options.prospect.nom) || '',
          sujet: '[Test] ' + options.sujet,
          preheader: options.preheader,
          texte: options.texte,
          vars: options.prospect || {},
          visuel: options.visuel,
          lienTexte: options.lienTexte,
          lienUrl: options.lienUrl
        }],
        brochures: options.pieces || [],
        signature: options.signature
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (d) {
      if (window.MelodiaMotion && window.MelodiaMotion.toast) {
        window.MelodiaMotion.toast('Test envoyé à ' + (d.expediteur || 'votre adresse') + '.', { type: 'ok' });
      }
      if (typeof cb === 'function') cb(d);
      return d;
    }).catch(function (e) {
      if (window.MelodiaMotion && window.MelodiaMotion.toast) {
        window.MelodiaMotion.toast('Envoi du test impossible : ' + e.message, { type: 'err' });
      }
      throw e;
    });
    if (window.MelodiaMotion && window.MelodiaMotion.morphEnvoyer && bouton) {
      return window.MelodiaMotion.morphEnvoyer(bouton, promesse);
    }
    return promesse;
  }

  // ─── Cycle de vie ────────────────────────────────────────────────────
  async function monter(conteneur, options) {
    if (!conteneur || !(conteneur instanceof HTMLElement)) return;
    demonter(conteneur);
    var opts = optionsParDefaut(options);
    conteneur.innerHTML = coquilleHTML();

    var etat = { options: opts, texteBrut: '' };
    etatParConteneur.set(conteneur, etat);

    brancher(conteneur);

    try {
      var html = await chargerApercu(conteneur, opts);
      injecter(conteneur, html);
      etat.texteBrut = htmlToText(html);
    } catch (e) {
      injecter(conteneur, '');
    }

    calculerScore(conteneur, opts);
    appliquerMode(conteneur, 'desktop');

    // Remplit le meta après chargement
    var meta = conteneur.querySelector('[data-role="meta"]');
    if (meta) {
      var pieces = (opts.pieces || []).length;
      meta.textContent = 'Modèle ' + opts.modele + ' · ' + (pieces ? pieces + ' pièce(s) jointe(s)' : 'sans pièce jointe');
    }
  }

  function demonter(conteneur) {
    if (!conteneur) return;
    conteneur.innerHTML = '';
    etatParConteneur.delete(conteneur);
  }

  function brancher(conteneur) {
    conteneur.addEventListener('click', async function (ev) {
      var t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.dataset.mode) {
        appliquerMode(conteneur, t.dataset.mode);
        return;
      }
      if (t.dataset.act === 'test') {
        var st = etatParConteneur.get(conteneur);
        if (!st) return;
        try {
          await envoyerTest(conteneur, st.options, st.options.onTest);
        } catch (_) { /* toast déjà affiché */ }
        return;
      }
      if (t.dataset.act === 'rafraichir') {
        var s = etatParConteneur.get(conteneur);
        if (!s) return;
        try {
          var html = await chargerApercu(conteneur, s.options);
          injecter(conteneur, html);
          s.texteBrut = htmlToText(html);
          calculerScore(conteneur, s.options);
        } catch (_) { /* silencieux */ }
        return;
      }
    });
  }

  function htmlToText(html) {
    var s = String(html || '');
    s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
    s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, '\n');
    s = s.replace(/<[^>]+>/g, '');
    s = s.replace(/&nbsp;/g, ' ');
    s = s.replace(/&amp;/g, '&');
    s = s.replace(/&lt;/g, '<');
    s = s.replace(/&gt;/g, '>');
    s = s.replace(/&quot;/g, '"');
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trim();
  }

  window.MelodiaJulieApercu = {
    monter: monter,
    demonter: demonter,
    rendre: monter
  };
})();
