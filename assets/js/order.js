/* ═══════════════════════════════════════════════════════════════
   MELODIA — Tunnel de commande
   Six étapes, récapitulatif vivant, brouillon sauvegardé.
   Remplace le formulaire monobloc : on ne demande jamais plus de
   quatre informations à la fois à une famille en deuil.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var wizard = document.querySelector('.wizard');
  if (!wizard) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var OFFERS = {
    'Essentiel': { price: 149, urgenceIncluse: false },
    'Prestige': { price: 299, urgenceIncluse: false },
    'Mémorial': { price: 499, urgenceIncluse: true }
  };
  var SUPP_URGENCE = 49;
  var DRAFT = 'melodia_order_draft';

  var state = {
    offer: 'Prestige', urgence: false,
    defunt: '', age: '', lien: '',
    traits: '', metier: '', habitude: '', anecdote: '',
    style: 'Chanson française', ambiance: 'Douce et lumineuse', voix: 'Peu importe',
    name: '', email: '', tel: '', consent: false
  };

  var steps = $$('.wz-step', wizard);
  var nodes = $$('.wz-node', wizard);
  var idx = 0;

  /* ═══ Prix ═══ */
  function priceOf() {
    var base = OFFERS[state.offer].price;
    var supp = (state.urgence && !OFFERS[state.offer].urgenceIncluse) ? SUPP_URGENCE : 0;
    return base + supp;
  }
  function euro(n) { return n.toLocaleString('fr-FR') + ' €'; }

  /* ═══ Récapitulatif ═══ */
  function paintRecap() {
    var set = function (id, val) { var el = $('#' + id); if (el) el.textContent = val || '—'; };
    set('rc-offer', state.offer);
    set('rc-defunt', state.defunt);
    set('rc-style', state.style);
    set('rc-urgence', state.urgence
      ? (OFFERS[state.offer].urgenceIncluse ? 'Incluse (6 h)' : 'Oui (+ ' + SUPP_URGENCE + ' €)')
      : 'Non');
    set('rc-total', euro(priceOf()));
    var supLine = $('#rc-supp-line');
    if (supLine) supLine.style.display = (state.urgence && !OFFERS[state.offer].urgenceIncluse) ? 'flex' : 'none';
  }

  /* ═══ Navigation entre étapes ═══ */
  function show(n) {
    idx = Math.min(Math.max(n, 0), steps.length - 1);
    steps.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
    nodes.forEach(function (nd, i) {
      nd.classList.toggle('active', i === idx);
      nd.classList.toggle('done', i < idx);
    });
    paintRecap();
    var top = wizard.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: top, behavior: 'smooth' });
    var first = steps[idx].querySelector('input:not([type=hidden]), textarea, select, .choice');
    if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 340);
  }

  /* ═══ Validation ═══ */
  function fail(el, msg) {
    if (!el) return;
    el.classList.add('invalid');
    var err = el.parentNode.querySelector('.field-err');
    if (err && msg) err.textContent = msg;
    el.addEventListener('input', function () { el.classList.remove('invalid'); }, { once: true });
  }

  function validate(n) {
    var ok = true;
    $$('.invalid', steps[n]).forEach(function (e) { e.classList.remove('invalid'); });

    if (n === 1) {
      if (!state.defunt.trim()) { fail($('#o-defunt'), 'Ce prénom nous sert à écrire la chanson.'); ok = false; }
    }
    if (n === 2) {
      if (!state.traits.trim()) { fail($('#o-traits'), 'Trois mots suffisent.'); ok = false; }
    }
    if (n === 4) {
      if (!state.name.trim()) { fail($('#o-name'), 'Indiquez votre nom.'); ok = false; }
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(state.email.trim())) { fail($('#o-email'), 'Adresse email invalide.'); ok = false; }
      if (!state.consent) {
        var box = $('#o-consent');
        if (box) { box.parentNode.style.color = 'var(--red)'; }
        ok = false;
      }
    }
    if (!ok && window.melodiaToast) window.melodiaToast('Merci de compléter les champs signalés.');
    return ok;
  }

  /* ═══ Liaison des champs ═══ */
  function bind(id, key, transform) {
    var el = $('#' + id);
    if (!el) return;
    var ev = (el.type === 'checkbox') ? 'change' : 'input';
    el.addEventListener(ev, function () {
      state[key] = el.type === 'checkbox' ? el.checked : (transform ? transform(el.value) : el.value);
      paintRecap();
      saveDraft();
    });
  }
  ['defunt', 'age', 'lien', 'traits', 'metier', 'habitude', 'anecdote', 'name', 'email', 'tel'].forEach(function (k) {
    bind('o-' + k, k);
  });
  bind('o-consent', 'consent');
  bind('o-urgence', 'urgence');
  ['style', 'ambiance', 'voix'].forEach(function (k) { bind('o-' + k, k); });

  /* Cartes de choix (offre) */
  $$('[data-offer]', wizard).forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.offer = btn.getAttribute('data-offer');
      $$('[data-offer]', wizard).forEach(function (b) { b.classList.toggle('selected', b === btn); });
      paintRecap();
      saveDraft();
    });
  });

  /* ═══ Brouillon ═══ */
  var saveTimer = null;
  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch (e) {}
    }, 400);
  }
  function loadDraft() {
    var raw;
    try { raw = localStorage.getItem(DRAFT); } catch (e) { return; }
    if (!raw) return;
    var d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d || (!d.defunt && !d.name)) return;
    Object.keys(state).forEach(function (k) { if (d[k] !== undefined) state[k] = d[k]; });
    Object.keys(state).forEach(function (k) {
      var el = $('#o-' + k);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!state[k];
      else el.value = state[k];
    });
    $$('[data-offer]', wizard).forEach(function (b) {
      b.classList.toggle('selected', b.getAttribute('data-offer') === state.offer);
    });
    var note = $('#o-draft-note');
    if (note) note.classList.add('show');
  }

  var clearBtn = $('#o-draft-clear');
  if (clearBtn) clearBtn.addEventListener('click', function () {
    try { localStorage.removeItem(DRAFT); } catch (e) {}
    location.reload();
  });

  /* ═══ Boutons suivant / précédent ═══ */
  $$('[data-wz-next]', wizard).forEach(function (b) {
    b.addEventListener('click', function () { if (validate(idx)) show(idx + 1); });
  });
  $$('[data-wz-prev]', wizard).forEach(function (b) {
    b.addEventListener('click', function () { show(idx - 1); });
  });
  /* Entrée passe à l'étape suivante, sauf dans les zones de texte long */
  wizard.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;
    var next = steps[idx].querySelector('[data-wz-next]');
    if (next) { e.preventDefault(); next.click(); }
  });

  /* ═══ Entrée directe depuis la grille tarifaire ═══ */
  window.openOrder = function (offer) {
    if (OFFERS[offer]) {
      state.offer = offer;
      $$('[data-offer]', wizard).forEach(function (b) {
        b.classList.toggle('selected', b.getAttribute('data-offer') === offer);
      });
    }
    wizard.closest('section').style.display = '';
    paintRecap();
    show(1); /* On saute la sélection d'offre : elle vient d'être faite */
  };

  /* ═══ Envoi ═══ */
  function briefComplet() {
    /* Tout ce que la base ne stocke pas en colonne propre est consigné ici,
       pour que le compositeur dispose du brief entier. */
    var lignes = [];
    if (state.anecdote) lignes.push(state.anecdote);
    var extra = [];
    if (state.age) extra.push('Âge : ' + state.age);
    if (state.lien) extra.push('Lien avec la famille : ' + state.lien);
    if (state.ambiance) extra.push('Ambiance souhaitée : ' + state.ambiance);
    if (state.voix) extra.push('Voix : ' + state.voix);
    if (state.tel) extra.push('Téléphone : ' + state.tel);
    if (extra.length) lignes.push('— ' + extra.join(' · '));
    return lignes.join('\n\n');
  }

  window.sendOrder = async function (paid, pid) {
    if (!validate(4)) { show(4); return; }
    var btn = $('#o-submit');
    if (btn) { btn.classList.add('is-loading'); btn.disabled = true; }
    var msg = $('#o-msg');
    try {
      var order = await window.MelodiaDB.create({
        offer: state.offer, price: priceOf(),
        defunt: state.defunt, name: state.name, email: state.email,
        traits: state.traits, metier: state.metier, habitude: state.habitude,
        anecdote: briefComplet(), style: state.style,
        urgence: !!state.urgence, paid: !!paid, paypal_id: pid || ''
      });
      try { localStorage.removeItem(DRAFT); } catch (e) {}
      var ref = $('#confirm-ref');
      if (ref) ref.textContent = order.ref;
      var sum = $('#confirm-summary');
      if (sum) sum.textContent = state.offer + ' · ' + euro(priceOf()) + (state.urgence ? ' · urgence' : '');
      wizard.closest('section').style.display = 'none';
      var conf = $('#confirm');
      if (conf) { conf.style.display = 'block'; conf.scrollIntoView({ behavior: 'smooth' }); }
    } catch (err) {
      if (msg) { msg.className = 'form-msg err'; msg.textContent = 'Envoi impossible : ' + err.message; }
      if (window.melodiaToast) window.melodiaToast('L\'envoi a échoué. Appelez-nous au 07 84 10 16 96.');
    } finally {
      if (btn) { btn.classList.remove('is-loading'); btn.disabled = false; }
    }
  };

  /* Lu par le bouton PayPal pour connaître le montant à encaisser */
  window.melodiaOrderInfo = function () { return { offer: state.offer, price: priceOf() }; };

  loadDraft();
  paintRecap();
})();
