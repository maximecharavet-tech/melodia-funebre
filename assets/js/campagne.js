/* ═══════════════════════════════════════════════════════════════
   campagne.js — Écrire à plusieurs agences, chacune à son nom

   POURQUOI

   Le collaborateur écrivait agence par agence : ouvrir la fiche,
   choisir le modèle, relire, envoyer — cinq gestes par message, et
   quarante fiches au portefeuille. Une campagne fait la même chose en
   une fois, sans rien perdre de ce qui rend un message lisible :

   · quand l’envoi automatique est actif, chaque agence reçoit SON
     message — son nom, sa ville, son dirigeant. Tant qu’il est
     désactivé, le repli est un seul mailto en copie cachée : le
     message n’est alors pas personnalisé destinataire par destinataire ;
   · on voit, avant d'envoyer, le courriel exact que recevra chacune,
     destinataire par destinataire : bannière, texte, carte de visite ;
   · les fiches qu'il ne faut pas toucher sont écartées d'office, avec
     la raison écrite : opposition, refus, adresse manquante ou en
     double. Celles qu'on préfère éviter (déjà partenaire, contactée
     cette semaine) le sont aussi, mais peuvent être rajoutées ;
   · un test part d'abord dans sa propre boîte ;
   · l'envoi se fait par petits lots de dix, l'un après l'autre avec
     une courte pause (Resend gratuit : 2 requêtes par seconde), avec une
     barre de progression et un compte rendu ligne à ligne ;
   · le quota du jour (30 courriels par collaborateur, jour de Paris)
     est affiché et respecté : au-delà, le bouton se limite à ce qui
     reste, et le serveur refuse le surplus de toute façon ;
   · une agence qui a déjà reçu CE modèle aujourd'hui est écartée ;
   · chaque fiche envoyée avance d'étape, note l'envoi dans son journal
     et reçoit sa prochaine relance.

   LE SERVEUR DÉCIDE

   L'aperçu est rendu par /api/prospect-mail lui-même : c'est le même
   gabarit que celui qui part. Et l'envoi exige la session du
   collaborateur — la console transmet son jeton, le serveur le fait
   valider par Supabase et lit le rôle dans la base.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LOT = 10;
  var PAUSE_MS = 1100;
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var pause = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* Le jour de Paris, « AAAA-MM-JJ » : la borne du quota et des doublons. */
  function jourParis(d) {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d || new Date()); }
    catch (e) { return (d || new Date()).toISOString().slice(0, 10); }
  }

  /* La fiche a-t-elle déjà reçu ce modèle aujourd'hui ? Le journal de la
     fiche le dit (« Courriel envoyé » — « … modèle « Nom » »). */
  function dejaRecu(p, nomModele) {
    if (!nomModele) return false;
    var auj = jourParis();
    return (p.journal || []).some(function (j) {
      if (!j || !/Courriel envoyé/i.test(j.quoi || '')) return false;
      if (String(j.detail || '').indexOf('« ' + nomModele + ' »') === -1) return false;
      var d = new Date(j.le);
      return !isNaN(d.getTime()) && jourParis(d) === auj;
    });
  }

  /* Le quota du jour, lu sur le serveur. */
  async function quota() {
    var r = await appeler({ mode: 'quota' });
    return r.ok && r.d && r.d.quota ? r.d.quota : null;
  }
  function texteQuota(q) {
    if (!q) return '';
    return q.utilise + ' / ' + q.max + ' envoyés aujourd’hui' + (q.restant ? ' · ' + q.restant + ' restant' + (q.restant > 1 ? 's' : '') : ' · quota atteint, reprise demain');
  }
  var SEPT_JOURS = 7 * 86400000;
  var JETONS = [['{agence}', 'Nom de l’agence'], ['{ville}', 'Ville'], ['{dirigeant}', 'Dirigeant']];

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var toast = function (t) { if (window.melodiaToast) window.melodiaToast(t); };

  function utilisateur() { return (window.MelodiaAuth && window.MelodiaAuth.current()) || {}; }
  function signature() { return window.MelodiaSignature ? window.MelodiaSignature.pour(utilisateur()) : {}; }

  function jeton() {
    try { var s = JSON.parse(localStorage.getItem('melodia_session') || 'null'); return (s && s.access_token) || ''; }
    catch (e) { return ''; }
  }

  /* Un seul point d'appel au serveur, avec la session. */
  async function appeler(corps) {
    var t = jeton();
    var h = { 'Content-Type': 'application/json' };
    if (t) h.Authorization = 'Bearer ' + t;
    try {
      var r = await fetch('/api/prospect-mail', { method: 'POST', headers: h, body: JSON.stringify(corps) });
      var d = await r.json().catch(function () { return {}; });
      return { status: r.status, ok: r.ok, d: d };
    } catch (e) {
      return { status: 0, ok: false, d: { error: 'Le serveur ne répond pas.' } };
    }
  }

  /* ─── L'aperçu, rendu par le serveur ───
     Hors ligne, ou sur un serveur de développement sans fonctions,
     l'aperçu se replie sur le texte brut : on voit au moins les mots. */
  function apercuSur(iframe) {
    var minuteur = null, numero = 0;
    return function (charge) {
      clearTimeout(minuteur);
      minuteur = setTimeout(async function () {
        var n = ++numero;
        var r = await appeler(Object.assign({ mode: 'apercu' }, charge, { signature: Object.assign({}, signature(), charge.signature || {}) }));
        if (n !== numero) return;
        if (r.ok && r.d.html) { iframe.srcdoc = r.d.html; return; }
        iframe.srcdoc = '<body style="font:15px/1.7 Helvetica,Arial,sans-serif;color:#3d3a33;padding:24px;background:#f4f1ea;">' +
          '<p style="color:#8b8474;font-size:12px;">Aperçu simplifié : le rendu complet (bannière et carte de visite) ' +
          's’affiche sur le site en ligne.</p><h2 style="font-family:Georgia,serif;font-weight:400;">' + esc(charge.titre || '') + '</h2>' +
          esc(charge.texte || '').replace(/\n/g, '<br>') + '</body>';
      }, 350);
    };
  }

  /* ─── Personnaliser un texte à jetons pour une fiche ───
     « Bonjour {dirigeant}, » devient « Bonjour, » quand le dirigeant
     n'est pas connu, et non « Bonjour , ». */
  function personnaliser(t, v) {
    return String(t || '')
      .replace(/ ?\{dirigeant\}/g, v.dirigeant ? ' ' + v.dirigeant : '')
      .replace(/\{agence\}/g, v.nom || 'votre maison')
      .replace(/\{ville\}/g, v.ville || 'votre secteur')
      .replace(/\{cp\}/g, v.cp || '');
  }

  /* ─── Qui reçoit, qui est écarté, et pourquoi ─── */
  function eligibilite(p, vues, modele) {
    var email = String(p.email || '').trim().toLowerCase();
    if (p.oppose) return { ok: false, fixe: true, motif: 'Opposition (STOP)' };
    if (!email) return { ok: false, fixe: true, motif: 'Sans adresse email' };
    if (!RE_EMAIL.test(email)) return { ok: false, fixe: true, motif: 'Adresse invalide' };
    if (p.statut === 'refus') return { ok: false, fixe: true, motif: 'A décliné' };
    if (vues[email]) return { ok: false, fixe: true, motif: 'Adresse en double' };
    vues[email] = 1;
    if (modele && dejaRecu(p, modele.nom)) return { ok: false, fixe: true, motif: 'A déjà reçu ce modèle aujourd’hui' };
    if (p.statut === 'partenaire') return { ok: false, fixe: false, motif: 'Déjà partenaire' };
    if (p.dernier_contact && Date.now() - new Date(p.dernier_contact).getTime() < SEPT_JOURS) {
      return { ok: false, fixe: false, motif: 'Contactée il y a moins de 7 jours' };
    }
    return { ok: true };
  }

  /* ═══ La fenêtre de campagne ═══
     o.prospects   fiches choisies
     o.modeles     { cle: modèle } — ceux de la famille des fiches
     o.pourCourriel(p)  la fiche en casse lisible
     o.apres(envoyees, modele)  journal, étape et relance des fiches parties */
  function ouvrir(o) {
    var modeles = o.modeles || {};
    var cles = Object.keys(modeles);
    if (!cles.length) { toast('Aucun modèle de courriel disponible.'); return; }

    var etat = { cle: cles.indexOf('contact') !== -1 ? 'contact' : cles[0], i: 0, quota: null };
    var lignes = o.prospects.map(function (p) { return { p: p, v: o.pourCourriel(p), e: { ok: false }, inclus: false, neuf: true }; });
    /* L'éligibilité dépend du modèle (déjà reçu aujourd'hui ?) : elle se
       refait à chaque changement, sans écraser un choix manuel tant que
       le verdict de la fiche ne change pas. */
    function evaluer() {
      var vues = {};
      lignes.forEach(function (l) {
        var e = eligibilite(l.p, vues, modeles[etat.cle]);
        if (l.neuf || e.ok !== l.e.ok || e.fixe !== l.e.fixe) l.inclus = e.ok;
        if (e.fixe) l.inclus = false;
        l.e = e; l.neuf = false;
      });
    }
    evaluer();

    var fond = document.createElement('div');
    fond.className = 'compo cmp-fond';
    fond.innerHTML =
      '<div class="compo-boite cmp" role="dialog" aria-modal="true" aria-labelledby="cmp-titre">' +
        '<div class="compo-tete">' +
          '<div><div class="panel-title" id="cmp-titre" style="font-size:1.2rem;">Campagne <em>personnalisée</em></div>' +
          '<div class="panel-sub" id="cmp-sous"></div></div>' +
          '<button class="own-mini" data-fermer aria-label="Fermer">✕</button>' +
        '</div>' +
        '<div class="cmp-corps">' +
          '<div class="cmp-redac">' +
            '<div class="field"><label class="field-label" for="cmp-modele">Modèle</label>' +
              '<select class="field-select" id="cmp-modele">' + cles.map(function (k) {
                return '<option value="' + esc(k) + '">' + esc(modeles[k].nom) + '</option>';
              }).join('') + '</select>' +
              '<p class="compo-quand" id="cmp-quand"></p></div>' +
            '<div class="field"><label class="field-label" for="cmp-objet">Objet</label><input class="field-input" id="cmp-objet"></div>' +
            '<div class="field"><label class="field-label" for="cmp-titre-mail">Titre dans le courriel</label><input class="field-input" id="cmp-titre-mail"></div>' +
            '<div class="field"><label class="field-label" for="cmp-texte">Message</label>' +
              '<div class="cmp-jetons" role="group" aria-label="Insérer un champ personnalisé">' +
                JETONS.map(function (j) { return '<button type="button" class="cmp-jeton" data-jeton="' + j[0] + '" title="' + esc(j[1]) + '">' + j[0] + '</button>'; }).join('') +
              '</div>' +
              '<textarea class="field-area" id="cmp-texte" style="min-height:260px;line-height:1.7;"></textarea></div>' +
            '<div class="cmp-dest">' +
              '<div class="cmp-dest-tete"><span class="field-label" style="margin:0;">Destinataires</span><span id="cmp-compte"></span></div>' +
              '<ul class="cmp-liste" id="cmp-liste"></ul>' +
            '</div>' +
          '</div>' +
          '<div class="cmp-apercu">' +
            '<div class="cmp-nav">' +
              '<button type="button" class="own-mini" data-prec aria-label="Destinataire précédent">‹</button>' +
              '<div class="cmp-qui" id="cmp-qui" aria-live="polite"></div>' +
              '<button type="button" class="own-mini" data-suiv aria-label="Destinataire suivant">›</button>' +
            '</div>' +
            '<iframe class="cmp-cadre" id="cmp-cadre" title="Aperçu du courriel" sandbox=""></iframe>' +
          '</div>' +
        '</div>' +
        '<div class="compo-pied cmp-pied">' +
          '<div class="cmp-etat" id="cmp-etat" role="status"></div>' +
          '<div class="cmp-etat" id="cmp-quota" aria-live="polite" style="white-space:nowrap;"></div>' +
          '<div class="cmp-prog" id="cmp-prog" hidden><span></span></div>' +
          '<button class="btn btn-ghost btn-sm" id="cmp-test">M’envoyer un test</button>' +
          '<button class="btn btn-gold" id="cmp-envoyer"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(fond);
    var $ = function (id) { return fond.querySelector('#' + id); };
    var retour = document.activeElement;
    var apercu = apercuSur($('cmp-cadre'));

    var fermer = function () {
      fond.remove(); document.removeEventListener('keydown', echap);
      if (retour && retour.focus) try { retour.focus(); } catch (e) {}
    };
    var echap = function (e) { if (e.key === 'Escape' && !fond.dataset.envoi) fermer(); };
    document.addEventListener('keydown', echap);
    fond.querySelector('[data-fermer]').addEventListener('click', function () { if (!fond.dataset.envoi) fermer(); });

    /* Le modèle choisi, écrit « à jetons » : c'est ce texte que le
       collaborateur relit et retouche, une fois pour toutes. */
    function chargerModele() {
      var m = modeles[etat.cle];
      evaluer(); dessinerListe();
      var gabarit = { nom: '{agence}', ville: '{ville}', dirigeant: '{dirigeant}', cp: '{cp}', type: o.prospects[0] && o.prospects[0].type };
      $('cmp-objet').value = m.objet(gabarit);
      $('cmp-titre-mail').value = m.titre ? m.titre(gabarit) : '';
      $('cmp-texte').value = m.texte(gabarit);
      $('cmp-quand').textContent = m.quand || '';
      rafraichir();
    }

    function retenues() { return lignes.filter(function (l) { return l.inclus; }); }

    /* Combien partiront vraiment : la sélection, rognée au quota. */
    function aEnvoyer() {
      var r = retenues();
      return etat.quota ? r.slice(0, etat.quota.restant) : r;
    }
    function dessinerQuota() {
      var q = etat.quota, z = $('cmp-quota');
      if (!z) return;
      z.textContent = texteQuota(q);
      z.className = 'cmp-etat' + (q && !q.restant ? ' mal' : (q && retenues().length > q.restant ? ' attention' : ''));
    }
    function dessinerListe() {
      var n = retenues().length;
      var k = aEnvoyer().length;
      var q = etat.quota;
      $('cmp-compte').textContent = n + ' sur ' + lignes.length;
      $('cmp-sous').textContent = n + ' agence' + (n > 1 ? 's' : '') + ' recevront chacune un message à leur nom';
      $('cmp-envoyer').textContent = q && !q.restant ? 'Quota du jour atteint'
        : (k ? 'Envoyer à ' + k + ' agence' + (k > 1 ? 's' : '') + (k < n ? ' (sur ' + n + ')' : '') : 'Aucun destinataire');
      $('cmp-envoyer').disabled = !k;
      if (q && n > q.restant) {
        dire(q.restant
          ? 'Quota : il reste ' + q.restant + ' envoi' + (q.restant > 1 ? 's' : '') + ' aujourd’hui. Seules les ' + q.restant + ' premières agences cochées partiront ; les autres attendront demain.'
          : 'Quota du jour atteint (' + q.utilise + ' / ' + q.max + ') : les envois reprennent demain.', 'attention');
      }
      dessinerQuota();
      $('cmp-liste').innerHTML = lignes.map(function (l, k) {
        var id = 'cmp-d' + k;
        return '<li class="cmp-ligne' + (l.inclus ? '' : ' exclu') + '">' +
          '<input type="checkbox" id="' + id + '" data-k="' + k + '"' + (l.inclus ? ' checked' : '') + (l.e.fixe ? ' disabled' : '') + '>' +
          '<label for="' + id + '"><span class="cmp-nom">' + esc(l.v.nom || '—') + '</span>' +
            '<span class="cmp-mail">' + esc(l.p.email || 'sans adresse') + '</span></label>' +
          (l.e.ok ? '' : '<span class="cmp-motif' + (l.e.fixe ? ' fixe' : '') + '">' + esc(l.e.motif) + '</span>') +
          '<button type="button" class="cmp-voir" data-voir="' + k + '" aria-label="Voir le message de ' + esc(l.v.nom) + '">voir</button>' +
        '</li>';
      }).join('');
    }

    function courrielPour(l) {
      return {
        to: l.p.email, ref: l.p.siret,
        sujet: personnaliser($('cmp-objet').value, l.v).trim(),
        titre: personnaliser($('cmp-titre-mail').value, l.v).trim(),
        texte: personnaliser($('cmp-texte').value, l.v).trim()
      };
    }
    function lien() { var m = modeles[etat.cle]; return { lienTexte: m.lien && m.lien.texte, lienUrl: m.lien && m.lien.url }; }

    function rafraichir() {
      var r = retenues();
      var liste = r.length ? r : lignes;
      if (etat.i >= liste.length) etat.i = 0;
      var l = liste[etat.i];
      $('cmp-qui').innerHTML = l
        ? '<b>' + esc(l.v.nom) + '</b><span>' + (etat.i + 1) + ' / ' + liste.length + (r.length ? '' : ' · aucune retenue') + '</span>'
        : '';
      if (l) apercu(Object.assign(courrielPour(l), lien()));
    }

    fond.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.id === 'cmp-modele') { etat.cle = t.value; chargerModele(); return; }
      if (t.dataset && t.dataset.k != null) { lignes[+t.dataset.k].inclus = t.checked; dessinerListe(); rafraichir(); }
    });
    ['cmp-objet', 'cmp-titre-mail', 'cmp-texte'].forEach(function (id) { $(id).addEventListener('input', rafraichir); });
    fond.addEventListener('click', function (ev) {
      var j = ev.target.closest && ev.target.closest('[data-jeton]');
      if (j) {
        var ta = $('cmp-texte'), a = ta.selectionStart, b = ta.selectionEnd;
        ta.value = ta.value.slice(0, a) + j.dataset.jeton + ta.value.slice(b);
        ta.focus(); ta.selectionStart = ta.selectionEnd = a + j.dataset.jeton.length;
        rafraichir(); return;
      }
      var v = ev.target.closest && ev.target.closest('[data-voir]');
      if (v) {
        var r = retenues(), l = lignes[+v.dataset.voir];
        var idx = r.indexOf(l);
        if (idx === -1) { r = lignes; idx = +v.dataset.voir; }
        etat.i = idx; rafraichir(); return;
      }
      if (ev.target.closest && ev.target.closest('[data-prec]')) { var n = (retenues().length || lignes.length); etat.i = (etat.i - 1 + n) % n; rafraichir(); }
      if (ev.target.closest && ev.target.closest('[data-suiv]')) { var n2 = (retenues().length || lignes.length); etat.i = (etat.i + 1) % n2; rafraichir(); }
    });

    function dire(t, ton) { var e = $('cmp-etat'); e.textContent = t; e.className = 'cmp-etat' + (ton ? ' ' + ton : ''); }

    /* Sans clé d'envoi : les adresses en copie cachée dans la messagerie
       du collaborateur. La personnalisation se perd, on le dit. */
    function repli(r) {
      var adresses = r.map(function (l) { return l.p.email; });
      var c = courrielPour({ p: { email: '' }, v: {} });
      dire('L’envoi automatique est désactivé. Vous pouvez copier les adresses ou ouvrir votre messagerie en copie cachée : ce repli n’envoie pas un message personnalisé à chaque agence.', 'attention');
      var pied = fond.querySelector('.cmp-pied');
      if (pied.querySelector('[data-copier]')) return;
      var b1 = document.createElement('button'); b1.className = 'btn btn-outline btn-sm'; b1.dataset.copier = '1'; b1.textContent = 'Copier les adresses';
      b1.addEventListener('click', function () { if (navigator.clipboard) navigator.clipboard.writeText(adresses.join(', ')); toast(adresses.length + ' adresses copiées.'); });
      var b2 = document.createElement('a'); b2.className = 'btn btn-outline btn-sm';
      b2.href = 'mailto:?bcc=' + encodeURIComponent(adresses.join(',')) + '&subject=' + encodeURIComponent(c.sujet) + '&body=' + encodeURIComponent(c.texte);
      b2.textContent = 'Messagerie (Cci)';
      pied.insertBefore(b2, $('cmp-test')); pied.insertBefore(b1, b2);
    }

    function erreur(r) {
      if (r.d.code === 'NON_CONNECTE') return 'Votre session a expiré : reconnectez-vous, puis relancez.';
      if (r.d.code === 'INTERDIT') return r.d.error;
      return (r.d.motif || r.d.error || 'Envoi impossible.');
    }

    $('cmp-test').addEventListener('click', async function () {
      var r = retenues(); var l = r[0] || lignes[0];
      if (!l) return;
      var b = this; b.disabled = true; dire('Envoi du test…');
      var res = await appeler(Object.assign({ mode: 'test', modele: modeles[etat.cle].nom, envois: [courrielPour(l)], signature: signature() }, lien()));
      b.disabled = false;
      if (res.ok) dire('Test envoyé à ' + (utilisateur().email || 'votre adresse') + ', avec le message de « ' + l.v.nom + ' »' +
        (res.d.quota ? ' (' + res.d.quota.utilise + ' / ' + res.d.quota.max + ' tests aujourd’hui)' : '') + '.', 'bon');
      else if (res.d.code === 'NOT_CONFIGURED' || res.d.code === 'ENVOI_DESACTIVE') repli(r);
      else dire(erreur(res), 'mal');
    });

    $('cmp-envoyer').addEventListener('click', async function () {
      var r = aEnvoyer();
      if (!r.length) return;
      var ecartees = retenues().length - r.length;
      if (!confirm('Envoyer ' + r.length + ' courriel' + (r.length > 1 ? 's' : '') + ' personnalisé' + (r.length > 1 ? 's' : '') + ' ?' +
        (ecartees ? '\n' + ecartees + ' agence' + (ecartees > 1 ? 's' : '') + ' au-delà du quota du jour attendront demain.' : ''))) return;
      fond.dataset.envoi = '1';
      var bouton = this; bouton.disabled = true; $('cmp-test').disabled = true;
      var prog = $('cmp-prog'), barre = prog.firstChild; prog.hidden = false;
      var partis = [], refus = [], arret = null;
      var m = modeles[etat.cle];
      for (var i = 0; i < r.length; i += LOT) {
        var lot = r.slice(i, i + LOT);
        if (i) await pause(PAUSE_MS);
        dire('Envoi… ' + Math.min(i + lot.length, r.length) + ' / ' + r.length);
        var res = await appeler(Object.assign({ mode: 'envoi', modele: m.nom, envois: lot.map(courrielPour), signature: signature() }, lien()));
        if (res.d && res.d.quota) { etat.quota = res.d.quota; dessinerQuota(); }
        if (!res.ok) {
          if (res.d.code === 'NOT_CONFIGURED' || res.d.code === 'ENVOI_DESACTIVE') { arret = 'repli'; break; }
          /* Un lot refusé en entier (quota, session, service) : on n'insiste
             pas sur les suivants, chaque fiche restante est listée. */
          arret = erreur(res);
          var motifs = {};
          (res.d.refuses || []).forEach(function (x) { motifs[x.ref] = x.motif; });
          r.slice(i).forEach(function (l) { refus.push({ l: l, motif: motifs[l.p.siret] || arret }); });
          break;
        }
        var parRef = {};
        (res.d.envoyes || []).forEach(function (x) { parRef[x.ref] = x; });
        (res.d.refuses || []).forEach(function (x) { var l = lot.filter(function (y) { return y.p.siret === x.ref; })[0]; if (l) refus.push({ l: l, motif: x.motif }); });
        lot.forEach(function (l) { if (parRef[l.p.siret]) partis.push(l); });
        barre.style.width = Math.round(Math.min(i + LOT, r.length) / r.length * 100) + '%';
      }
      delete fond.dataset.envoi;
      if (arret === 'repli' && !partis.length) { prog.hidden = true; bouton.disabled = false; $('cmp-test').disabled = false; repli(r); return; }

      if (partis.length && o.apres) {
        dire('Mise à jour des fiches…');
        try { await o.apres(partis.map(function (l) { return l.p; }), m); } catch (e) {}
      }
      var attente = retenues().filter(function (l) { return r.indexOf(l) === -1; });
      rapport(partis, refus, attente);
    });

    function rapport(partis, refus, attente) {
      attente = attente || [];
      var corps = fond.querySelector('.cmp-corps');
      corps.innerHTML = '<div class="cmp-rapport">' +
        '<div class="cmp-r-chiffres"><div><b>' + partis.length + '</b><span>envoyé' + (partis.length > 1 ? 's' : '') + '</span></div>' +
          '<div><b class="' + (refus.length ? 'mal' : '') + '">' + refus.length + '</b><span>non parti' + (refus.length > 1 ? 's' : '') + '</span></div>' +
          (attente.length ? '<div><b>' + attente.length + '</b><span>pour demain (quota)</span></div>' : '') + '</div>' +
        (etat.quota ? '<p class="gr-note">' + esc(texteQuota(etat.quota)) + '.</p>' : '') +
        (partis.length ? '<p class="gr-note">Chaque fiche envoyée est passée à l’étape suivante, l’envoi est noté dans son journal, et sa relance est prévue dans sept jours.</p>' : '') +
        '<ul class="cmp-liste">' +
          partis.map(function (l) {
            return '<li class="cmp-ligne"><span class="cmp-nom">' + esc(l.v.nom) + '</span><span class="cmp-mail">' + esc(l.p.email) + '</span><span class="cmp-motif">envoyé ✓</span></li>';
          }).join('') +
          refus.map(function (x) {
            return '<li class="cmp-ligne exclu"><span class="cmp-nom">' + esc(x.l.v.nom) + '</span><span class="cmp-mail">' + esc(x.l.p.email || '') + '</span><span class="cmp-motif fixe">' + esc(x.motif) + '</span></li>';
          }).join('') +
          attente.map(function (l) {
            return '<li class="cmp-ligne exclu"><span class="cmp-nom">' + esc(l.v.nom) + '</span><span class="cmp-mail">' + esc(l.p.email) + '</span><span class="cmp-motif">Quota du jour atteint : à envoyer demain</span></li>';
          }).join('') +
        '</ul>' +
      '</div>';
      var pied = fond.querySelector('.cmp-pied');
      pied.innerHTML = '<div class="cmp-etat bon" role="status">Campagne terminée.</div><button class="btn btn-gold" data-fin>Fermer</button>';
      pied.querySelector('[data-fin]').addEventListener('click', fermer);
      pied.querySelector('[data-fin]').focus();
    }

    $('cmp-modele').value = etat.cle;
    dessinerListe();
    chargerModele();
    quota().then(function (q) { if (q && document.body.contains(fond) && !fond.dataset.envoi) { etat.quota = q; dessinerListe(); } });
    setTimeout(function () { $('cmp-objet').focus(); }, 40);
  }

  /* ═══ La carte de visite, dans « Mon compte » ═══ */
  function vueSignature() {
    var s = signature();
    return '<div class="panel cmp-sig">' +
      '<div class="panel-head"><div><div class="panel-title">Votre carte de <em>visite</em></div>' +
      '<div class="panel-sub">Elle signe chacun de vos courriels de prospection</div></div></div>' +
      '<div class="cmp-sig-grille">' +
        '<div>' +
          '<div class="field"><label class="field-label" for="sig-nom">Nom affiché</label><input class="field-input" id="sig-nom" value="' + esc(s.nom) + '"></div>' +
          '<div class="field"><label class="field-label" for="sig-role">Fonction</label><input class="field-input" id="sig-role" value="' + esc(s.role) + '" placeholder="Directrice marketing & commerciale"></div>' +
          '<div class="field"><label class="field-label" for="sig-tel">Téléphone</label><input class="field-input" id="sig-tel" type="tel" value="' + esc(s.tel) + '" placeholder="06 12 34 56 78"></div>' +
          '<p class="gr-note">' + (s.photo ? 'Votre portrait est en place.' : 'Pas encore de portrait : envoyez une photo carrée à la maison, elle l’ajoutera à votre carte.') +
            ' L’adresse de réponse est toujours celle de votre compte.</p>' +
          '<button class="btn btn-gold btn-sm" id="sig-garder">Enregistrer</button>' +
        '</div>' +
        '<iframe class="cmp-cadre cmp-sig-cadre" id="sig-cadre" title="Aperçu de votre carte de visite" sandbox=""></iframe>' +
      '</div></div>';
  }
  function brancherSignature() {
    var cadre = document.getElementById('sig-cadre');
    if (!cadre) return;
    var apercu = apercuSur(cadre);
    var lire = function () {
      return { nom: document.getElementById('sig-nom').value.trim(), role: document.getElementById('sig-role').value.trim(), tel: document.getElementById('sig-tel').value.trim() };
    };
    var montrer = function () {
      apercu({ partie: 'signature', sujet: 'Votre signature', titre: 'Votre carte de visite',
        texte: 'Bonjour,\n\nVoici la carte qui signera vos courriels de prospection. Elle reprend votre nom, votre fonction et vos coordonnées.',
        signature: lire() });
    };
    ['sig-nom', 'sig-role', 'sig-tel'].forEach(function (id) { document.getElementById(id).addEventListener('input', montrer); });
    document.getElementById('sig-garder').addEventListener('click', function () {
      if (window.MelodiaSignature) window.MelodiaSignature.enregistrer(utilisateur(), lire());
      toast('Carte de visite enregistrée.');
    });
    montrer();
  }

  window.MelodiaCampagne = {
    ouvrir: ouvrir, appeler: appeler, apercuSur: apercuSur, signature: signature, quota: quota, texteQuota: texteQuota,
    personnaliser: personnaliser, vueSignature: vueSignature, brancherSignature: brancherSignature
  };
})();
