/* Melodia Pro — questionnaire famille, hors ligne.
   Tout reste sur l'appareil (localStorage) tant que le conseiller n'envoie
   pas. L'envoi vers POST /api/pro/dossiers (action « questionnaire ») est
   prévu mais désactivé dans ce prototype : aucun appel réseau. */
(function () {
  'use strict';
  const S = window.SCHEMA;
  const $app = document.getElementById('app');
  const CLE = 'mq_dossiers_v1', CLE_AG = 'mq_agence_v1';
  let dossiers = lireJSON(CLE, {});
  let agence = lireJSON(CLE_AG, { nom: '', conseiller: '' });
  let courant = null;       // id du dossier ouvert
  let conseiller = false;   // mode conseiller (champs internes visibles)

  function lireJSON(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function sauver() { localStorage.setItem(CLE, JSON.stringify(dossiers)); }
  function vierge() { return { defunt: {}, vie: { traits: [] }, musique: { energie: 35, instruments: [], instruments_eviter: [], artistes: [] }, ceremonie: {}, message: {}, consentements: {}, offre: {} }; }
  function nouvelleRef() { const d = new Date(); return 'MQ-' + d.toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }

  function h(tag, attrs, ...enfants) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of enfants.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
    return el;
  }
  let tId = 0;
  function toast(t) { const el = document.getElementById('toast'); el.textContent = t; el.classList.add('vu'); clearTimeout(tId); tId = setTimeout(() => el.classList.remove('vu'), 2600); }
  function vue(...enfants) { $app.replaceChildren(...enfants); window.scrollTo(0, 0); const f = $app.querySelector('h1, h2'); if (f) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } }

  /* Appui long sur le monogramme : mode conseiller (la famille ne le voit pas). */
  function monogramme() {
    let t = null;
    const img = h('img', { src: 'assets/monogramme.png', alt: 'Melodia Funèbre', class: 'mono' });
    const go = () => { t = setTimeout(() => { conseiller = !conseiller; toast(conseiller ? 'Mode conseiller' : 'Mode famille'); rerendre(); }, 900); };
    const stop = () => clearTimeout(t);
    img.addEventListener('pointerdown', go); img.addEventListener('pointerup', stop); img.addEventListener('pointerleave', stop);
    return img;
  }
  let rerendre = accueil;

  function barre(extra) {
    return h('header', { class: 'barre' }, monogramme(),
      h('div', { class: 'barre-t' }, h('span', { class: 'serif' }, 'Une vie, une ', h('em', null, 'chanson')),
        agence.nom ? h('span', { class: 'agence' }, 'avec ' + agence.nom) : null),
      extra || null, conseiller ? h('span', { class: 'badge' }, 'Conseiller') : null);
  }

  // ─── Accueil ───
  function accueil() {
    rerendre = accueil; courant = null;
    const liste = Object.values(dossiers).sort((a, b) => b.modifie - a.modifie);
    vue(h('main', { class: 'accueil' },
      h('div', { class: 'aube', 'aria-hidden': 'true' }),
      h('div', { class: 'accueil-c' },
        h('img', { class: 'lockup', src: 'assets/lockup.png', alt: 'Melodia Funèbre' }),
        h('p', { class: 'surtitre' }, agence.nom ? 'Questionnaire famille · ' + agence.nom : 'Questionnaire famille'),
        h('h1', null, 'Une vie, une ', h('em', null, 'chanson')),
        h('div', { class: 'filet' }, h('span'), '◆', h('span')),
        h('p', { class: 'intro' }, 'Quelques questions, à votre rythme, pour composer une chanson qui ressemble à la personne que vous avez aimée. Vous pouvez passer une question, et revenir en arrière à tout moment.'),
        h('button', { class: 'btn or grand', onclick: () => ouvrir(null) }, 'Commencer avec la famille'),
        liste.length ? h('section', { class: 'reprendre' }, h('h2', { class: 'petit-t' }, 'Reprendre un questionnaire'),
          liste.slice(0, 6).map((d) => h('button', { class: 'ligne-dossier', onclick: () => ouvrir(d.id) },
            h('span', { class: 'serif nom' }, (d.q.defunt.prenom || 'Sans prénom') + (d.q.defunt.nom ? ' ' + d.q.defunt.nom : '')),
            h('span', { class: 'meta' }, d.ref + ' · ' + progression(d.q) + ' %' + (d.statut === 'a_envoyer' ? ' · prêt à envoyer' : ''))))) : null,
        h('button', { class: 'lien', onclick: espaceConseiller }, 'Espace conseiller'),
        h('p', { class: 'pied' }, 'Composé par Melodia Funèbre · fonctionne sans connexion'))));
  }

  function progression(q) { const ok = S.filter((s) => !window.manquants(q, s).length).length; return Math.round(ok * 100 / S.length); }

  function ouvrir(id) {
    if (!id) { id = 'd' + Date.now(); dossiers[id] = { id, ref: nouvelleRef(), cree: Date.now(), modifie: Date.now(), statut: 'brouillon', q: vierge() }; sauver(); }
    courant = id; etape(0);
  }

  // ─── Une étape du questionnaire ───
  function etape(i) {
    rerendre = () => etape(i);
    const d = dossiers[courant], q = d.q, sec = S[i];
    q[sec.id] = q[sec.id] || {};
    const etat = h('span', { class: 'etat', role: 'status' }, 'Enregistré sur cet appareil');
    let tSave = 0;
    const changer = (cle, v) => { q[sec.id][cle] = v; d.modifie = Date.now(); etat.textContent = '…'; clearTimeout(tSave); tSave = setTimeout(() => { sauver(); etat.textContent = 'Enregistré sur cet appareil'; majPoints(); }, 300); };
    const champs = sec.champs.filter((c) => conseiller || !c.conseiller).map((c) => champ(c, q[sec.id], changer));
    const points = h('ol', { class: 'points', 'aria-label': 'Étapes' });
    function majPoints() {
      points.replaceChildren(...S.map((s, j) => h('li', { class: (j === i ? 'ici ' : '') + (!window.manquants(q, s).length ? 'fait' : '') },
        h('button', { 'aria-label': 'Étape ' + s.n + ' : ' + s.titre, 'aria-current': j === i ? 'step' : null, onclick: () => etape(j) }, String(s.n)))));
    }
    majPoints();
    vue(barre(h('button', { class: 'fermer', 'aria-label': 'Revenir à l’accueil', onclick: accueil }, '×')),
      h('div', { class: 'progres' }, h('i', { style: 'width:' + ((i + 1) * 100 / S.length) + '%' })),
      h('main', { class: 'etape' }, points,
        h('div', { class: 'sec' }, h('span', { class: 'secnum' }, String(sec.n)), h('div', null, h('h2', null, sec.titre), sec.sous ? h('p', { class: 'sous' }, sec.sous) : null)),
        sec.info ? h('p', { class: 'info' }, sec.info) : null,
        h('div', { class: 'champs' }, champs),
        h('p', { class: 'legende' }, h('span', { class: 'req' }, '◆'), ' nous est indispensable pour commencer. Tout le reste est facultatif.')),
      h('nav', { class: 'bas' },
        h('button', { class: 'btn', disabled: i === 0, onclick: () => etape(i - 1) }, '← Précédent'),
        etat,
        i < S.length - 1 ? h('button', { class: 'btn or', onclick: () => etape(i + 1) }, 'Suivant →')
          : h('button', { class: 'btn or', onclick: fin }, 'Terminer')));
  }

  let nId = 0;
  function champ(c, val, changer) {
    const id = 'c' + (++nId);
    const tete = (forId) => h(forId ? 'label' : 'div', { class: 'lab', for: forId || null },
      c.n ? h('span', { class: 'num' }, c.n) : h('span', { class: 'num' }), c.lab, c.req ? h('span', { class: 'req', 'aria-label': 'indispensable' }, ' ◆') : null,
      c.conseiller ? h('span', { class: 'interne' }, 'conseiller') : null);
    const aide = c.aide ? h('p', { class: 'aide', id: id + '-a' }, c.aide) : null;
    const v = val[c.cle];
    const cls = 'champ' + (c.demi ? ' demi' : '') + (c.n ? '' : ' suite');
    switch (c.type) {
      case 'radio': {
        return h('fieldset', { class: cls }, h('legend', null, tete()), aide,
          h('div', { class: 'choix' + (c.large ? ' large' : '') }, c.options.map(([o, l]) => h('label', { class: 'pastille' },
            h('input', { type: 'radio', name: id, checked: v === o, onchange: () => changer(c.cle, o) }), h('span', null, l)))));
      }
      case 'puces': {
        const set = new Set(v || []);
        return h('fieldset', { class: cls }, h('legend', null, tete()), aide,
          h('div', { class: 'choix' }, c.options.map(([o, l]) => h('button', { type: 'button', class: 'puce', 'aria-pressed': String(set.has(o)),
            onclick: (e) => { set.has(o) ? set.delete(o) : set.add(o); e.currentTarget.setAttribute('aria-pressed', String(set.has(o))); changer(c.cle, [...set]); } }, l))));
      }
      case 'case':
        return h('div', { class: cls + ' case' }, h('label', { class: 'case-l' },
          h('input', { type: 'checkbox', checked: v === true, onchange: (e) => changer(c.cle, e.target.checked) }),
          h('span', { class: 'coche', 'aria-hidden': 'true' }),
          h('span', null, c.n ? h('span', { class: 'num' }, c.n) : null, c.lab, c.req ? h('span', { class: 'req' }, ' ◆') : null)));
      case 'energie': {
        const lib = (x) => x < 30 ? 'Lente, intime' : x < 60 ? 'Modérée' : 'Élan, lumière';
        const out = h('output', { for: id }, lib(v == null ? 35 : v));
        return h('div', { class: cls }, tete(id), h('div', { class: 'energie' }, h('span', null, 'Intime'),
          h('input', { id, type: 'range', min: 0, max: 100, step: 5, value: v == null ? 35 : v, 'aria-valuetext': lib(v == null ? 35 : v),
            oninput: (e) => { const x = Number(e.target.value); out.textContent = lib(x); e.target.setAttribute('aria-valuetext', lib(x)); changer(c.cle, x); } }),
          h('span', null, 'Lumière')), out);
      }
      case 'texte': {
        const ta = h('textarea', { id, rows: c.lignes || 3, maxlength: c.max || 600, 'aria-describedby': aide ? id + '-a' : null });
        ta.value = v || '';
        const cpt = h('span', { class: 'cpt' }, (ta.value.length) + ' / ' + (c.max || 600));
        ta.addEventListener('input', () => { cpt.textContent = ta.value.length + ' / ' + (c.max || 600); changer(c.cle, ta.value); });
        return h('div', { class: cls }, tete(id), ta, aide, cpt);
      }
      case 'liste': {
        const inp = h('input', { id, type: 'text', autocomplete: 'off', value: (v || []).join(', '), 'aria-describedby': aide ? id + '-a' : null });
        inp.addEventListener('input', () => changer(c.cle, inp.value.split(',').map((x) => x.trim()).filter(Boolean)));
        return h('div', { class: cls }, tete(id), inp, aide);
      }
      default: {
        const inp = h('input', { id, type: c.type || 'text', autocomplete: 'off', maxlength: 200, value: v || '', 'aria-describedby': aide ? id + '-a' : null });
        inp.addEventListener('input', () => changer(c.cle, inp.value));
        return h('div', { class: cls }, tete(id), inp, aide);
      }
    }
  }

  // ─── Fin : merci, puis remise au conseiller ───
  function fin() {
    rerendre = fin;
    const d = dossiers[courant];
    vue(barre(), h('main', { class: 'fin' },
      h('img', { class: 'lockup petit', src: 'assets/lockup.png', alt: '' }),
      h('h1', null, h('em', null, 'Merci.')),
      h('p', { class: 'intro' }, 'Ce que vous nous avez confié' + (d.q.defunt.prenom ? ' sur ' + d.q.defunt.prenom : '') + ' est entre de bonnes mains. Votre conseiller s’occupe de la suite et vous tiendra informés jusqu’à l’écoute.'),
      h('div', { class: 'filet' }, h('span'), '◆', h('span')),
      h('button', { class: 'btn grand', onclick: () => { conseiller = true; recap(); } }, 'Rendre la tablette au conseiller')));
  }

  // ─── Récapitulatif conseiller ───
  function recap() {
    rerendre = recap;
    const d = dossiers[courant], q = d.q;
    const lignes = S.map((s) => { const m = window.manquants(q, s); return h('li', { class: m.length ? 'manque' : 'ok' },
      h('button', { class: 'ligne-sec', onclick: () => etape(s.n - 1) }, h('span', { class: 'secnum petit' }, String(s.n)), h('span', null, s.titre),
        h('span', { class: 'meta' }, m.length ? 'À compléter : ' + m.join(', ') : 'Complet'))); });
    const complet = S.every((s) => !window.manquants(q, s).length);
    vue(barre(h('button', { class: 'fermer', 'aria-label': 'Accueil', onclick: accueil }, '×')),
      h('main', { class: 'recap' },
        h('p', { class: 'surtitre' }, 'Dossier ' + d.ref),
        h('h1', null, (q.defunt.prenom || 'Sans prénom') + ' ', h('em', null, q.defunt.nom || '')),
        h('div', { class: 'jauge' }, h('i', { style: 'width:' + progression(q) + '%' }), h('span', null, progression(q) + ' % complet')),
        h('ol', { class: 'secs' }, lignes),
        h('div', { class: 'actions' },
          h('button', { class: 'btn or', disabled: !complet, onclick: () => { d.statut = 'a_envoyer'; sauver(); toast('Ajouté à la file d’envoi'); recap(); } },
            d.statut === 'a_envoyer' ? 'Dans la file d’envoi ✓' : 'Préparer l’envoi à Melodia'),
          h('button', { class: 'btn', onclick: copier }, 'Copier les réponses (JSON)')),
        h('p', { class: 'note' }, 'Prototype : l’envoi vers votre espace Melodia Pro sera activé avec la connexion conseiller. D’ici là, les réponses restent sur cette tablette, même sans réseau.')));
  }

  function copier() {
    const d = dossiers[courant];
    const charge = { action: 'questionnaire', reference_tablette: d.ref, donnees: d.q };
    const txt = JSON.stringify(charge, null, 2);
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Réponses copiées'), () => toast('Copie impossible sur cet appareil'));
  }

  // ─── Espace conseiller : agence, dossiers ───
  function espaceConseiller() {
    rerendre = espaceConseiller; conseiller = true;
    const nom = h('input', { id: 'ag-nom', type: 'text', value: agence.nom, autocomplete: 'organization' });
    const cons = h('input', { id: 'ag-cons', type: 'text', value: agence.conseiller, autocomplete: 'name' });
    const liste = Object.values(dossiers).sort((a, b) => b.modifie - a.modifie);
    vue(barre(h('button', { class: 'fermer', 'aria-label': 'Accueil', onclick: () => { conseiller = false; accueil(); } }, '×')),
      h('main', { class: 'recap' },
        h('p', { class: 'surtitre' }, 'Espace conseiller'),
        h('h1', null, 'Votre ', h('em', null, 'agence')),
        h('div', { class: 'champs' },
          h('div', { class: 'champ demi' }, h('label', { class: 'lab', for: 'ag-nom' }, 'Nom de l’agence'), nom),
          h('div', { class: 'champ demi' }, h('label', { class: 'lab', for: 'ag-cons' }, 'Conseiller'), cons)),
        h('button', { class: 'btn or', onclick: () => { agence = { nom: nom.value.trim(), conseiller: cons.value.trim() }; localStorage.setItem(CLE_AG, JSON.stringify(agence)); toast('Agence enregistrée'); } }, 'Enregistrer'),
        h('h2', { class: 'petit-t' }, 'Dossiers sur cette tablette (' + liste.length + ')'),
        h('ol', { class: 'secs' }, liste.map((d) => h('li', { class: d.statut === 'a_envoyer' ? 'ok' : 'manque' },
          h('button', { class: 'ligne-sec', onclick: () => { courant = d.id; recap(); } },
            h('span', { class: 'serif' }, (d.q.defunt.prenom || 'Sans prénom') + ' ' + (d.q.defunt.nom || '')),
            h('span', { class: 'meta' }, d.ref + ' · ' + progression(d.q) + ' % · ' + (d.statut === 'a_envoyer' ? 'prêt à envoyer' : 'brouillon')))))),
        h('p', { class: 'note' }, 'Astuce : un appui long sur le monogramme, en haut à gauche, bascule entre mode famille et mode conseiller.')));
  }

  // Démo pour les captures : ?demo=1 pré-remplit un dossier fictif.
  if (/[?&]demo=1/.test(location.search) && !Object.keys(dossiers).length) {
    agence = { nom: 'Agence partenaire (démo)', conseiller: '' };
    const q = vierge();
    Object.assign(q.defunt, { prenom: 'Jeanne', nom: 'Exemple', surnom: 'Mamie Jeanne', genre: 'elle', lieux: 'Quimper, la maison de Bénodet' });
    Object.assign(q.vie, { metier: 'Institutrice', passion: 'Le jardin', traits: ['tendre', 'rieur·se', 'têtu·e'], anecdote: 'Chaque été, elle plantait des capucines « pour les enfants qui passent ».' });
    Object.assign(q.musique, { style: 'Celtique', voix: 'femme', instruments: ['harpe', 'violon'], energie: 40 });
    dossiers.demo = { id: 'demo', ref: 'MQ-DEMO-0001', cree: Date.now(), modifie: Date.now(), statut: 'brouillon', q };
  }
  const m = /[?&]vue=([a-z0-9]+)/.exec(location.search);
  if (m && dossiers.demo) {
    courant = 'demo';
    if (m[1] === 'fin') fin(); else if (m[1] === 'recap') { conseiller = true; recap(); } else if (m[1] === 'conseiller') espaceConseiller(); else etape(Math.max(0, Math.min(5, Number(m[1]) - 1)));
  } else accueil();
})();
