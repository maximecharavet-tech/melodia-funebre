/*!
 * julie-composeur.js — Console Julie v2 · vue « Composer ».
 * Choix du prospect, du modèle, de la disposition (_courrier-v2), de
 * l'accroche ({accroche}, suggérée par /api/prospect-ia) et des brochures ;
 * aperçu serveur + note de délivrabilité (MelodiaJulieApercu). L'envoi passe
 * toujours par « Mail prêt à envoyer » : quotas, STOP, suivi d'ouverture et
 * pièces jointes restent ceux de /api/prospect-mail. License: internal.
 */
(function () {
  'use strict';
  var J = window.MelodiaJulie;
  if (!J) return;
  var esc = J.esc;
  var BROCHURES = [
    ['professionnels', 'Brochure professionnelle'], ['pompes-funebres', 'Pompes funèbres'],
    ['marbriers', 'Marbriers'], ['crematoriums', 'Crématoriums'],
    ['pompes-funebres-v2', 'Pompes funèbres — nouvelle édition'], ['marbriers-v2', 'Marbriers — nouvelle édition'],
    ['crematoriums-v2', 'Crématoriums — nouvelle édition'], ['prestige-offrande', 'Prestige « L’Offrande »'],
    ['prestige-ecoute', 'Prestige « L’Écoute »'],
    ['prestige-art', 'Prestige — Œuvre d’art (pompes funèbres)'],
    ['souvenirs-qui-resonnent', 'Souvenirs qui résonnent (familles)'],
    ['ceremonie', 'Cérémonie (pompes funèbres & officiants)']
  ];
  var DISPOSITIONS = [['editorial', 'Éditoriale (actuelle)'], ['lettre', 'Lettre — sobre, très délivrable'], ['carte', 'Carte — portrait de Julie']];
  var etat = { prospects: [], siret: '', modele: 'pf-premier-contact', layout: 'editorial', accroche: '', brochures: ['professionnels'] };
  var minuteur = null;

  function modeles() {
    var d = window.MELODIA_MODELES_JULIE || window.MelodiaModelesJulie;
    var l = (d && (d.modeles || d)) || [];
    return Array.isArray(l) && l.length ? l : [{ id: 'pf-premier-contact', nom: 'Premier contact' }, { id: 'pf-relance-j4', nom: 'Relance J+4' }, { id: 'pf-relance-j10', nom: 'Relance J+10' }];
  }
  function prospect() { return etat.prospects.filter(function (p) { return p.siret === etat.siret; })[0] || null; }
  function suggestionBrochure(p) {
    var t = J.normaliseType(p && (p.type || p.nom));
    return t === 'marbrier' ? 'marbriers-v2' : t === 'crematorium' ? 'crematoriums-v2' : 'prestige-offrande';
  }

  function vue() {
    return '<div class="jv2 jv2-compo" data-julie-vue="composer">' +
      '<section class="jv2-compo-form panel">' +
        '<div class="jv2-compo-eyebrow mono">Atelier d’écriture</div>' +
        '<h2 class="jv2-compo-titre">Un courriel <em>juste</em>, pour une maison précise</h2>' +
        '<label class="field-label" for="jc-prospect">Prospect</label>' +
        '<select class="field-input" id="jc-prospect"><option value="">— Aperçu générique —</option></select>' +
        '<div class="jv2-compo-2">' +
          '<div><label class="field-label" for="jc-modele">Modèle</label><select class="field-input" id="jc-modele">' +
            modeles().map(function (m) { return '<option value="' + esc(m.id) + '">' + esc(m.nom || m.id) + '</option>'; }).join('') + '</select></div>' +
          '<div><label class="field-label" for="jc-layout">Disposition</label><select class="field-input" id="jc-layout">' +
            DISPOSITIONS.map(function (d) { return '<option value="' + d[0] + '">' + esc(d[1]) + '</option>'; }).join('') + '</select></div>' +
        '</div>' +
        '<label class="field-label" for="jc-accroche">Accroche personnalisée <span class="mono jv2-compo-var">{accroche}</span></label>' +
        '<textarea class="field-input" id="jc-accroche" rows="3" maxlength="300" placeholder="Une phrase sincère sur cette maison : son histoire, son lieu, sa façon d’accompagner."></textarea>' +
        '<div class="jv2-compo-ia"><button type="button" class="btn btn-sm btn-outline" data-jc="ia">✦ Suggérer depuis son site</button><span class="jv2-compo-aide" id="jc-ia-msg">IA gratuite, à partir du site public. Rien n’est inventé.</span></div>' +
        '<fieldset class="jv2-compo-pieces"><legend class="field-label">Brochures jointes</legend>' +
          BROCHURES.map(function (b) { return '<label class="jv2-compo-piece"><input type="checkbox" data-jc-brochure="' + b[0] + '"> <span>' + esc(b[1]) + '</span></label>'; }).join('') +
        '</fieldset>' +
        '<div class="jv2-compo-actions"><button type="button" class="btn" data-jc="preparer">Préparer l’envoi →</button>' +
          '<span class="jv2-compo-aide">L’envoi se fait dans « Mail prêt à envoyer » (quota, STOP et suivi inclus).</span></div>' +
      '</section>' +
      '<section class="jv2-compo-apercu" id="jc-apercu"></section>' +
    '</div>';
  }

  /* Texte et objet tels qu'ils partiront, pour noter la délivrabilité. */
  function rendre(p) {
    var m = modeles().filter(function (x) { return x.id === etat.modele; })[0] || {};
    var nom = (p && p.dirigeant) || '', soc = (p && p.nom) || '', vil = (p && p.ville) || '';
    var v = { civilite: nom ? ' ' + nom : '', agence: soc || 'votre maison', ville_rel: vil ? ' à ' + vil : '', lien_brochure: 'https://melodia-funebre.fr/documents/melodia-brochure-professionnels.pdf', accroche: etat.accroche.trim() };
    function remplir(t) { return String(t || '').replace(/\{([a-z_]+)\}/g, function (x, k) { return Object.prototype.hasOwnProperty.call(v, k) ? v[k] : x; }); }
    var brut = String(m.texte || '');
    if (!v.accroche) brut = brut.replace(/\n*\{accroche\}\n*/g, function (x) { return x.split('\n').length > 2 ? '\n\n' : ''; });
    return { sujet: remplir(!soc && m.objetNu ? m.objetNu : m.objet).replace(/\s{2,}/g, ' ').trim(), texte: remplir(brut) };
  }
  function options() {
    var p = prospect();
    var rendu = rendre(p);
    var u = (window.MelodiaAuth && window.MelodiaAuth.current()) || {};
    var sig = window.MelodiaSignature ? window.MelodiaSignature.pour(u) : null;
    return {
      modele: etat.modele, layout: etat.layout, accroche: etat.accroche, pieces: etat.brochures.slice(),
      sujet: rendu.sujet, texte: rendu.texte,
      prospect: p ? { siret: p.siret, nom: p.nom || '', ville: p.ville || '', email: p.email || '', dirigeant: p.dirigeant || '' } : undefined,
      signature: sig || undefined
    };
  }
  function rafraichir() {
    clearTimeout(minuteur);
    minuteur = setTimeout(function () {
      var h = document.getElementById('jc-apercu');
      if (!h || !window.MelodiaJulieApercu) return;
      try { window.MelodiaJulieApercu.demonter(h); } catch (_) {}
      window.MelodiaJulieApercu.monter(h, options());
    }, 250);
  }
  function cocher(racine) {
    racine.querySelectorAll('[data-jc-brochure]').forEach(function (c) { c.checked = etat.brochures.indexOf(c.getAttribute('data-jc-brochure')) >= 0; });
  }

  async function suggerer(racine) {
    var p = prospect(), msg = racine.querySelector('#jc-ia-msg');
    if (!p || !p.site) { msg.textContent = p ? 'Ce prospect n’a pas de site connu.' : 'Choisissez d’abord un prospect.'; return; }
    msg.textContent = 'Lecture du site…';
    try {
      var r = await fetch('/api/prospect-ia', { method: 'POST', headers: J.entetes(), body: JSON.stringify({ mode: 'accroche', site: p.site, nom: p.nom, ville: p.ville }) });
      var d = await r.json().catch(function () { return {}; });
      if (d && d.accroche) {
        etat.accroche = String(d.accroche).slice(0, 300);
        racine.querySelector('#jc-accroche').value = etat.accroche;
        msg.textContent = 'Suggestion prête : relisez-la avant l’envoi.';
        rafraichir();
      } else msg.textContent = 'Rien de fiable trouvé' + (d && (d.raison || d.message) ? ' (' + (d.raison || d.message) + ')' : '') + '.';
    } catch (_) { msg.textContent = 'Service indisponible pour le moment.'; }
  }

  function preparer() {
    var p = prospect();
    var E = window.MelodiaEspace;
    if (E && E.prefillPret) {
      E.prefillPret({
        siret: p ? p.siret : '', id: etat.modele, dest: (p && p.email) || '',
        vars: p ? { dirigeant: p.dirigeant || '', agence: p.nom || '', ville: p.ville || '' } : {},
        brochures: etat.brochures.slice(), brochuresManuel: true,
        accroche: etat.accroche, dispositionV2: etat.layout === 'editorial' ? '' : etat.layout
      });
    }
    if (typeof window.go === 'function') window.go('pret'); else window.location.hash = '#pret';
  }

  async function brancher() {
    var racine = document.querySelector('[data-julie-vue="composer"]');
    if (!racine) return;
    try { etat.prospects = (window.MelodiaProspects ? await window.MelodiaProspects.mine() : []) || []; } catch (_) { etat.prospects = []; }
    var sel = racine.querySelector('#jc-prospect');
    sel.insertAdjacentHTML('beforeend', etat.prospects.filter(function (p) { return !p.oppose; }).map(function (p) {
      return '<option value="' + esc(p.siret) + '">' + esc((p.nom || '—') + (p.ville ? ' · ' + p.ville : '')) + '</option>';
    }).join(''));
    var voulu = (location.hash.split('?')[1] || '').match(/siret=([^&]+)/);
    if (voulu) etat.siret = decodeURIComponent(voulu[1]);
    sel.value = etat.siret;
    racine.querySelector('#jc-modele').value = etat.modele;
    racine.querySelector('#jc-layout').value = etat.layout;
    racine.querySelector('#jc-accroche').value = etat.accroche;
    cocher(racine);
    racine.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.id === 'jc-prospect') { etat.siret = t.value; etat.accroche = ''; racine.querySelector('#jc-accroche').value = ''; var s = suggestionBrochure(prospect()); if (etat.brochures.indexOf(s) < 0) etat.brochures = ['professionnels', s]; cocher(racine); }
      else if (t.id === 'jc-modele') etat.modele = t.value;
      else if (t.id === 'jc-layout') etat.layout = t.value;
      else if (t.hasAttribute('data-jc-brochure')) {
        etat.brochures = Array.prototype.map.call(racine.querySelectorAll('[data-jc-brochure]:checked'), function (c) { return c.getAttribute('data-jc-brochure'); });
      }
      rafraichir();
    });
    racine.querySelector('#jc-accroche').addEventListener('input', function (ev) { etat.accroche = ev.target.value.replace(/[<>]/g, ''); rafraichir(); });
    racine.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-jc]');
      if (!b) return;
      if (b.dataset.jc === 'ia') suggerer(racine);
      if (b.dataset.jc === 'preparer') preparer();
    });
    rafraichir();
  }

  window.MelodiaJulieComposeur = { vue: vue, brancher: brancher };
})();
