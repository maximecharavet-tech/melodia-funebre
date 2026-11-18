/*!
 * julie-taches.js — Console Julie · rappels et objectif du jour, synchronisés.
 *
 * Les rappels vivaient dans le navigateur (« sur cet appareil seulement ») et
 * l'objectif du jour aussi. Ils passent dans les tables de la migration 11,
 * déjà en base et protégées par leurs règles (chacun ses lignes) :
 *   public.taches          rappels et appels à passer (type, du_le, fait_le, payload)
 *   public.objectifs_jour  objectif mails / appels / relances (owner, jour)
 * Le même compte retrouve donc la même liste sur le PC et sur le téléphone.
 *
 * Sans base (site servi en statique), repli local, comme avant.
 * La vue « Mes rappels » de l'espace collaborateur est remplacée ici.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var V = window.MelodiaVente;
  var J = window.MelodiaJulie;
  if (!V || !J) return;
  var esc = J.esc;

  function toast(m) { if (window.melodiaToast) window.melodiaToast(m); }
  function moi() {
    var u = (window.MelodiaAuth && window.MelodiaAuth.current()) || {};
    return String(u.email || '').toLowerCase();
  }
  function rest() { return window.MelodiaRest && window.MelodiaRest.actif ? window.MelodiaRest : null; }
  function cleLocale(quoi) { return 'melodia.julie.' + quoi + '.' + moi(); }
  function lireLocal(quoi, d) { try { var v = JSON.parse(localStorage.getItem(cleLocale(quoi)) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function ecrireLocal(quoi, v) { try { localStorage.setItem(cleLocale(quoi), JSON.stringify(v)); } catch (e) {} }

  /* ─── Tâches ─────────────────────────────────────────────────────── */
  function normaliser(t) {
    var pl = (t && t.payload && typeof t.payload === 'object') ? t.payload : {};
    return {
      id: t.id,
      type: t.type || 'relance',
      prospect_siret: t.prospect_siret || '',
      du_le: t.du_le ? String(t.du_le) : '',
      jour: t.du_le ? V.jourParis(t.du_le) : '',
      fait_le: t.fait_le || null,
      texte: String(pl.texte || (t.type === 'appel' ? 'Appel à passer' : 'Rappel')),
      origine: pl.origine || (pl.sequence_id ? 'sequence' : '')
    };
  }

  async function lister(o) {
    o = o || {};
    var R = rest();
    if (!R) return lireLocal('taches', []).filter(function (t) { return o.faites || !t.fait_le; }).map(normaliser);
    var q = '/rest/v1/taches?select=id,type,prospect_siret,du_le,fait_le,payload&owner=ilike.' + encodeURIComponent(moi()) +
      (o.faites ? '' : '&fait_le=is.null') + '&order=du_le.asc.nullslast&limit=300';
    var l = await R.appel(q);
    return (Array.isArray(l) ? l : []).map(normaliser);
  }

  async function creer(o) {
    var texte = String(o.texte || '').trim().slice(0, 180);
    var jour = String(o.jour || '').slice(0, 10);
    if (!texte) throw new Error('Écrivez le rappel.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) throw new Error('Choisissez une date.');
    var ligne = {
      owner: moi(),
      prospect_siret: String(o.prospect_siret || '').slice(0, 20),
      type: o.type === 'appel' ? 'appel' : 'relance',
      du_le: jour + 'T09:00:00+01:00',
      payload: { texte: texte, origine: o.origine || 'rappel' }
    };
    var R = rest();
    if (!R) {
      var l = lireLocal('taches', []);
      ligne.id = 'l' + Date.now().toString(36);
      l.push(ligne); ecrireLocal('taches', l);
      return normaliser(ligne);
    }
    var r = await R.appel('/rest/v1/taches', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(ligne) });
    return normaliser((r && r[0]) || ligne);
  }

  async function marquer(id, fait) {
    var corps = { fait_le: fait ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
    var R = rest();
    if (!R) {
      var l = lireLocal('taches', []);
      l.forEach(function (t) { if (String(t.id) === String(id)) t.fait_le = corps.fait_le; });
      return ecrireLocal('taches', l);
    }
    await R.appel('/rest/v1/taches?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(corps) });
  }

  async function retirer(id) {
    var R = rest();
    if (!R) return ecrireLocal('taches', lireLocal('taches', []).filter(function (t) { return String(t.id) !== String(id); }));
    await R.appel('/rest/v1/taches?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
  }

  /* Les anciens rappels locaux (collaborateur-espace.js) montent une fois en base. */
  async function reprendreLocaux() {
    if (!rest() || !moi()) return 0;
    var cle = 'melodia_col_rappels_' + moi();
    var anciens;
    try { anciens = JSON.parse(localStorage.getItem(cle) || '[]'); } catch (e) { anciens = []; }
    if (!Array.isArray(anciens) || !anciens.length) return 0;
    var n = 0;
    for (var i = 0; i < anciens.length; i++) {
      var a = anciens[i];
      if (!a || a.fait || !a.texte) continue;
      try { await creer({ texte: a.texte, jour: a.quand || V.jourParis(), origine: 'rappel-local' }); n++; } catch (e) { return n; }
    }
    try { localStorage.removeItem(cle); } catch (e) {}
    return n;
  }

  /* ─── Objectif du jour ───────────────────────────────────────────── */
  async function lireObjectif(jour) {
    jour = jour || V.jourParis();
    var R = rest();
    if (!R) return V.objectifPropre(lireLocal('objectif', V.OBJECTIF_DEFAUT));
    try {
      /* Le plus récent fait foi : un objectif réglé hier vaut aujourd'hui tant qu'on n'y touche pas. */
      var l = await R.appel('/rest/v1/objectifs_jour?select=jour,mails,appels,relances&owner=ilike.' + encodeURIComponent(moi()) +
        '&jour=lte.' + jour + '&order=jour.desc&limit=1');
      return V.objectifPropre(Array.isArray(l) && l[0] ? l[0] : V.OBJECTIF_DEFAUT);
    } catch (e) {
      return V.objectifPropre(V.OBJECTIF_DEFAUT);
    }
  }

  async function ecrireObjectif(o, jour) {
    var obj = V.objectifPropre(o);
    jour = jour || V.jourParis();
    var R = rest();
    if (!R) { ecrireLocal('objectif', obj); return obj; }
    await R.appel('/rest/v1/objectifs_jour?on_conflict=owner,jour', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(Object.assign({ owner: moi(), jour: jour }, obj))
    });
    return obj;
  }

  /* ─── Vue « Mes rappels » ────────────────────────────────────────── */
  var etat = { liste: [], erreur: '' };

  function nomFiche(siret) {
    var l = (window.MelodiaConsole && window.MelodiaConsole.prospects) ? window.MelodiaConsole.prospects() : [];
    var p = l.filter(function (x) { return x.siret === siret; })[0];
    return p ? (p.nom || p.enseigne || siret) : '';
  }

  function ligneHTML(t, auj) {
    var retard = t.jour && t.jour < auj;
    var fiche = t.prospect_siret ? nomFiche(t.prospect_siret) : '';
    return '<li class="jv-tache' + (retard ? ' est-retard' : '') + '" data-id="' + esc(t.id) + '">' +
      '<label class="jv-tache-case"><input type="checkbox" data-jv-fait="' + esc(t.id) + '"' + (t.fait_le ? ' checked' : '') + '><span class="sr">Fait</span></label>' +
      '<div class="jv-tache-corps">' +
        '<div class="jv-tache-texte">' + esc(t.texte) + '</div>' +
        '<div class="jv-tache-meta"><time datetime="' + esc(t.jour) + '">' + esc(t.jour ? joli(t.jour) : 'sans date') + '</time>' +
          (t.type === 'appel' ? ' · appel' : '') +
          (fiche ? ' · <button type="button" class="jv-lien" data-jv-fiche="' + esc(t.prospect_siret) + '">' + esc(fiche) + '</button>' : '') +
        '</div>' +
      '</div>' +
      '<button type="button" class="jv-lien jv-tache-retirer" data-jv-retirer="' + esc(t.id) + '" aria-label="Retirer ce rappel">Retirer</button>' +
    '</li>';
  }

  function joli(jour) {
    var d = new Date(jour + 'T12:00:00Z');
    if (isNaN(d)) return jour;
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
  }

  function vue() {
    return '<div data-julie-vue="rappels" class="jv"><div class="jv2 jv2-chargement">Chargement…</div></div>';
  }

  function rendu() {
    var auj = V.jourParis();
    var l = etat.liste;
    var aujour = l.filter(function (t) { return !t.jour || t.jour <= auj; });
    var apres = l.filter(function (t) { return t.jour && t.jour > auj; });
    return '' +
      '<section class="panel jv-panel">' +
        '<form class="jv-rappel-form" id="jv-rappel-form">' +
          '<div class="field"><label class="field-label" for="jv-rap-txt">Rappel</label>' +
            '<input class="field-input" id="jv-rap-txt" maxlength="180" required placeholder="Relancer l’agence, envoyer la proposition…"></div>' +
          '<div class="field"><label class="field-label" for="jv-rap-date">Date</label>' +
            '<input class="field-input" id="jv-rap-date" type="date" value="' + auj + '" required></div>' +
          '<button type="submit" class="btn btn-gold btn-sm">Ajouter</button>' +
        '</form>' +
        '<p class="panel-note">' + (rest() ? 'Vos rappels sont enregistrés sur votre compte : les mêmes sur l’ordinateur et sur le téléphone.' :
          'Base indisponible : rappels gardés sur cet appareil.') + '</p>' +
        (etat.erreur ? '<p class="form-msg err" style="display:block;">' + esc(etat.erreur) + '</p>' : '') +
      '</section>' +
      '<section class="panel jv-panel"><h3 class="panel-title">Aujourd’hui <em>et en retard</em></h3>' +
        (aujour.length ? '<ul class="jv-taches">' + aujour.map(function (t) { return ligneHTML(t, auj); }).join('') + '</ul>' : '<p class="col-vide">Rien pour aujourd’hui.</p>') +
      '</section>' +
      (apres.length ? '<section class="panel jv-panel"><h3 class="panel-title">À <em>venir</em></h3><ul class="jv-taches">' +
        apres.map(function (t) { return ligneHTML(t, auj); }).join('') + '</ul></section>' : '');
  }

  async function rendre() {
    var h = document.querySelector('[data-julie-vue="rappels"]');
    if (!h) return;
    try {
      var n = await reprendreLocaux();
      if (n) toast(n + ' rappel' + (n > 1 ? 's' : '') + ' de cet appareil ajouté' + (n > 1 ? 's' : '') + ' à votre compte.');
      etat.liste = await lister();
      etat.erreur = '';
    } catch (e) {
      etat.erreur = 'Rappels illisibles : ' + ((e && e.message) || 'erreur');
    }
    h.innerHTML = rendu();
  }

  function brancher() {
    var h = document.querySelector('[data-julie-vue="rappels"]');
    if (!h) return;
    rendre();
    h.addEventListener('submit', async function (ev) {
      if (ev.target.id !== 'jv-rappel-form') return;
      ev.preventDefault();
      try {
        await creer({ texte: h.querySelector('#jv-rap-txt').value, jour: h.querySelector('#jv-rap-date').value });
        toast('Rappel ajouté.');
        rendre();
      } catch (e) { toast(e.message || 'Rappel refusé.'); }
    });
    h.addEventListener('change', async function (ev) {
      var id = ev.target.getAttribute && ev.target.getAttribute('data-jv-fait');
      if (!id) return;
      try { await marquer(id, ev.target.checked); rendre(); } catch (e) { toast('Non enregistré : ' + (e.message || 'erreur')); }
    });
    h.addEventListener('click', async function (ev) {
      var r = ev.target.closest('[data-jv-retirer]');
      if (r) {
        try { await retirer(r.getAttribute('data-jv-retirer')); rendre(); } catch (e) { toast('Non retiré : ' + (e.message || 'erreur')); }
        return;
      }
      var f = ev.target.closest('[data-jv-fiche]');
      if (f && window.MelodiaJulieActions) window.MelodiaJulieActions.ouvrirFiche(f.getAttribute('data-jv-fiche'));
    });
  }

  window.MelodiaJulieTaches = {
    lister: lister, creer: creer, marquer: marquer, retirer: retirer,
    lireObjectif: lireObjectif, ecrireObjectif: ecrireObjectif,
    reprendreLocaux: reprendreLocaux, normaliser: normaliser,
    vue: vue, brancher: brancher, rendre: rendre
  };

  if (window.MelodiaConsole) {
    window.MelodiaConsole.ajouterVue('rappels', ['Aujourd’hui', 'Mes <em>rappels</em>', vue, brancher]);
    /* Console déjà démarrée sur ce hash avant l'inscription : on l'ouvre maintenant. */
    var hv = (location.hash || '').replace(/^#/, '').split('?')[0];
    if (hv === 'rappels' && window.MelodiaConsole.demarree && window.MelodiaConsole.courante() !== hv && typeof window.go === 'function') window.go(hv);
  }
})();
