/* ═══════════════════════════════════════════════════════════════
   MELODIA — Demande de rappel
   Remplace l'affichage public du numéro. La famille laisse ses
   coordonnées, la maison rappelle.

   Le message part par /api/lead. Si la notification n'est pas encore
   configurée, la messagerie du visiteur prend le relais : une demande
   n'est jamais perdue en silence.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var EMAIL_MAISON = 'contact@melodia-funebre.fr';
  var CLE = 'melodia_rappels';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var boite = null;

  function construire() {
    if (boite) return boite;
    boite = document.createElement('div');
    boite.className = 'modal';
    boite.id = 'modal-rappel';
    boite.setAttribute('role', 'dialog');
    boite.setAttribute('aria-modal', 'true');
    boite.setAttribute('aria-label', 'Demander à être rappelé');
    boite.innerHTML =
      '<div class="modal-box">' +
        '<button class="modal-close" type="button" aria-label="Fermer">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '<div id="rp-vue-form">' +
          '<div class="eyebrow">Nous vous rappelons</div>' +
          '<h2 class="h-lg" style="margin-bottom:.7rem;">Laissez-nous <em>vos coordonnées.</em></h2>' +
          '<p style="color:var(--ash);font-size:.9rem;line-height:1.65;margin-bottom:1.6rem;">' +
            'Nous rappelons sous deux heures ouvrées. Si la cérémonie approche, cochez la case : nous passons en priorité.</p>' +
          '<div class="form-msg" id="rp-msg"></div>' +
          '<div class="field-row">' +
            '<div class="field"><label class="field-label" for="rp-nom">Votre nom *</label>' +
              '<input class="field-input" id="rp-nom" autocomplete="name" placeholder="Prénom Nom"><div class="field-err"></div></div>' +
            '<div class="field"><label class="field-label" for="rp-tel">Votre téléphone *</label>' +
              '<input class="field-input" id="rp-tel" type="tel" autocomplete="tel" placeholder="06 12 34 56 78"><div class="field-err"></div></div>' +
          '</div>' +
          '<div class="field-row">' +
            '<div class="field"><label class="field-label" for="rp-email">Email</label>' +
              '<input class="field-input" id="rp-email" type="email" autocomplete="email" placeholder="vous@email.fr"></div>' +
            '<div class="field"><label class="field-label" for="rp-moment">Meilleur moment</label>' +
              '<select class="field-select" id="rp-moment">' +
                '<option>Dès que possible</option><option>Ce matin</option>' +
                '<option>Cet après-midi</option><option>En fin de journée</option><option>Demain</option>' +
              '</select></div>' +
          '</div>' +
          '<div class="field"><label class="field-label" for="rp-message">Votre demande</label>' +
            '<textarea class="field-area" id="rp-message" style="min-height:90px;" placeholder="Quelques mots, si vous le souhaitez."></textarea></div>' +
          '<label class="check"><input type="checkbox" id="rp-urgent">' +
            '<span>La cérémonie a lieu dans moins de 72 heures</span></label>' +
          '<button class="btn btn-gold btn-block" id="rp-envoi" type="button">Demander à être rappelé</button>' +
          '<p style="font-size:.76rem;color:var(--dust);margin-top:.9rem;line-height:1.6;text-align:center;">' +
            'Vos coordonnées servent uniquement à vous rappeler. ' +
            '<a href="confidentialite.html" style="color:var(--or-patina);text-decoration:underline;">Politique de confidentialité</a>' +
          '</p>' +
        '</div>' +
        '<div id="rp-vue-ok" style="display:none;text-align:center;padding:1rem 0;">' +
          '<div style="font-family:var(--ff-d);font-size:3rem;color:var(--or);line-height:1;">✓</div>' +
          '<h2 class="h-lg" style="margin:1.2rem 0 .8rem;">Nous vous <em>rappelons.</em></h2>' +
          '<p style="color:var(--ash);font-size:.95rem;line-height:1.7;" id="rp-ok-txt"></p>' +
          '<button class="btn btn-outline" style="margin-top:1.6rem;" data-modal-close>Fermer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(boite);

    $('.modal-close', boite).addEventListener('click', fermer);
    $$('[data-modal-close]', boite).forEach(function (b) { b.addEventListener('click', fermer); });
    boite.addEventListener('click', function (e) { if (e.target === boite) fermer(); });
    $('#rp-envoi', boite).addEventListener('click', envoyer);
    /* Entrée valide, sauf dans la zone de message */
    boite.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); envoyer(); }
      if (e.key === 'Escape') fermer();
    });
    return boite;
  }

  var focusAvant = null;

  function ouvrir() {
    construire();
    focusAvant = document.activeElement;
    boite.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var n = $('#rp-nom'); if (n) n.focus(); }, 80);
  }

  function fermer() {
    if (!boite) return;
    boite.classList.remove('open');
    document.body.style.overflow = '';
    if (focusAvant && focusAvant.focus) focusAvant.focus();
  }

  function message(txt, type) {
    var m = $('#rp-msg');
    if (!m) return;
    m.className = 'form-msg' + (type ? ' ' + type : '');
    m.textContent = txt || '';
  }

  /* Un numéro français, tapé comme les gens le tapent */
  function telValide(t) {
    var n = (t || '').replace(/[^0-9+]/g, '');
    return /^(\+33|0)[1-9][0-9]{8}$/.test(n);
  }

  function conserverLocal(demande) {
    try {
      var l = JSON.parse(localStorage.getItem(CLE) || '[]');
      l.unshift(demande);
      localStorage.setItem(CLE, JSON.stringify(l.slice(0, 50)));
    } catch (e) {}
  }

  async function envoyer() {
    var val = function (id) { var e = $('#' + id); return e ? e.value.trim() : ''; };
    var nom = val('rp-nom'), tel = val('rp-tel');

    $$('.invalid', boite).forEach(function (e) { e.classList.remove('invalid'); });
    var manque = [];
    if (!nom) manque.push(['rp-nom', 'Indiquez votre nom.']);
    if (!telValide(tel)) manque.push(['rp-tel', 'Numéro invalide — 10 chiffres, ou +33.']);
    if (manque.length) {
      manque.forEach(function (m) {
        var el = $('#' + m[0]);
        el.classList.add('invalid');
        var err = el.parentNode.querySelector('.field-err');
        if (err) err.textContent = m[1];
      });
      message('Merci de compléter les champs signalés.', 'err');
      return;
    }

    var demande = {
      type: 'rappel',
      nom: nom, tel: tel, email: val('rp-email'),
      moment: val('rp-moment'), message: val('rp-message'),
      urgent: $('#rp-urgent').checked,
      page: location.pathname,
      date: new Date().toISOString()
    };
    conserverLocal(demande);

    var btn = $('#rp-envoi');
    btn.disabled = true; btn.classList.add('is-loading');
    message('');

    try {
      var r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demande)
      });
      if (r.ok) { confirmer(demande, false); return; }
      var d = null; try { d = await r.json(); } catch (e) {}
      /* Notification non configurée : la messagerie du visiteur prend le relais */
      if (d && d.code === 'NOT_CONFIGURED') { replimessagerie(demande); return; }
      throw new Error((d && d.error) || 'Envoi impossible.');
    } catch (e) {
      replimessagerie(demande);
    } finally {
      btn.disabled = false; btn.classList.remove('is-loading');
    }
  }

  function replimessagerie(demande) {
    var corps = [
      'Bonjour,', '',
      'Je souhaite être rappelé' + (demande.urgent ? ' en priorité (cérémonie sous 72 heures)' : '') + '.', '',
      'Nom : ' + demande.nom,
      'Téléphone : ' + demande.tel,
      demande.email ? 'Email : ' + demande.email : '',
      'Moment : ' + demande.moment,
      demande.message ? '' : null,
      demande.message || null
    ].filter(function (x) { return x !== null && x !== ''; }).join('\n');

    window.location.href = 'mailto:' + EMAIL_MAISON +
      '?subject=' + encodeURIComponent((demande.urgent ? '[URGENT] ' : '') + 'Demande de rappel — ' + demande.nom) +
      '&body=' + encodeURIComponent(corps);
    confirmer(demande, true);
  }

  function confirmer(demande, parMessagerie) {
    $('#rp-vue-form').style.display = 'none';
    $('#rp-vue-ok').style.display = 'block';
    $('#rp-ok-txt').innerHTML = parMessagerie
      ? 'Votre messagerie s\'ouvre avec la demande pré-remplie : il ne reste qu\'à l\'envoyer.<br><br>Vous pouvez aussi écrire directement à <b style="color:var(--or);">' + EMAIL_MAISON + '</b>.'
      : (demande.urgent
        ? 'Votre demande est signalée comme urgente. Nous vous rappelons au <b style="color:var(--or);">' + esc(demande.tel) + '</b> dans les meilleurs délais.'
        : 'Nous vous rappelons au <b style="color:var(--or);">' + esc(demande.tel) + '</b> sous deux heures ouvrées.');
  }

  /* Tout élément portant data-rappel ouvre la modale */
  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('[data-rappel]');
    if (d) { e.preventDefault(); ouvrir(); }
  });

  window.MelodiaRappel = { ouvrir: ouvrir, fermer: fermer };
})();
