// ═══════════════════════════════════════════════════════════════
// Le questionnaire en sept étapes.
//
// Sauvegarde à chaque frappe sur l'appareil (IndexedDB), puis sur le
// serveur (versionnée) quelques secondes plus tard ; hors ligne, la
// sauvegarde serveur attend le retour du réseau. Mode « avec la famille » :
// gros caractères, aucune note interne, aucun prix. Dictée vocale si le
// navigateur la propose. Les coordonnées repérées (téléphone, e-mail,
// IBAN, adresse) sont signalées : elles ne partent jamais vers la
// composition, le noyau Rust les retire du prompt.
// ═══════════════════════════════════════════════════════════════

import { h, titre, vider, toast, debounce, annoncer } from '../ui.js';
import { t, prix } from '../i18n.js';
import { lire, ecrire, effacer } from '../memoire.js';
import { noyau } from '../noyau.js';

const TRAITS = ['généreux·se', 'drôle', 'discret·e', 'courageux·se', 'tendre', 'têtu·e', 'rieur·se', 'curieux·se', 'bricoleur·se', 'voyageur·se', 'fidèle', 'solaire'];
const INSTRUMENTS = ['piano', 'guitare', 'violon', 'violoncelle', 'cordes', 'accordéon', 'harpe', 'orgue', 'flûte', 'cornemuse', 'saxophone', 'batterie'];
const STYLES = ['Chanson française', 'Variété', 'Folk acoustique', 'Piano classique', 'Jazz doux', 'Gospel', 'Pop douce', 'Celtique', 'Bossa nova', 'Country', 'Orientale', 'Sacré / liturgique', 'Instrumental'];
const RITES = [['civil', 'Civil ou laïque'], ['catholique', 'Catholique'], ['protestant', 'Protestant'], ['orthodoxe', 'Orthodoxe'], ['juif', 'Juif'], ['musulman', 'Musulman'], ['bouddhiste', 'Bouddhiste'], ['hindou', 'Hindou'], ['autre', 'Autre']];
const MOMENTS = ['Entrée', 'Recueillement', 'Hommage', 'Sortie', 'Crémation', 'Inhumation', 'Après la cérémonie'];
const TONS = [['lumineux', 'Lumineux'], ['recueilli', 'Recueilli'], ['nostalgique', 'Nostalgique'], ['joyeux', 'Joyeux, une fête de la vie'], ['serein', 'Serein']];

function vierge() {
  return { defunt: {}, vie: { traits: [] }, musique: { energie: 35, instruments: [], instruments_eviter: [], artistes: [] }, ceremonie: {}, message: {}, consentements: {}, offre: {} };
}

export async function rendre(el, ctx, route) {
  const k = await noyau();
  let id = route.id;
  let version = 0;
  let statut = 'brouillon';
  let q = vierge();
  const cleLocale = () => 'q-' + (id || 'nouveau-' + ctx.org);

  if (id) {
    const f = await ctx.donnees.dossier(id);
    statut = f.dossier.status;
    if (f.questionnaire) { q = Object.assign(vierge(), f.questionnaire.donnees); version = f.questionnaire.version; }
  }
  const local = await lire('brouillons', cleLocale()).catch(() => null);
  if (local && local.q && (!version || (local.version_base === version && local.modifie > 0))) q = Object.assign(vierge(), local.q);

  let etape = Math.min(Math.max(Number(route.params.etape) || 1, 1), 7);
  let famille = localStorage.getItem('melodia_pro_famille') === '1';
  const etat = h('span', { class: 'sauvegarde', role: 'status', 'aria-live': 'polite' }, '');
  const corps = h('div', { class: 'pile' });
  const navEtapes = h('ol', { class: 'etapes', 'aria-label': 'Étapes du questionnaire' });
  const editable = ['brouillon', 'complet'].includes(statut);

  el.append(
    h('p', { class: 'surtitre' }, id ? 'Questionnaire' : 'Nouveau dossier'),
    h('div', { class: 'rangee', style: { justifyContent: 'space-between' } },
      titre(1, 'Une vie, une', 'chanson'),
      h('label', { class: 'rangee petit', style: { cursor: 'pointer' } },
        h('input', { type: 'checkbox', checked: famille, onchange: (e) => { famille = e.target.checked; localStorage.setItem('melodia_pro_famille', famille ? '1' : '0'); appliquerFamille(); } }),
        'Remplir avec la famille')),
    h('p', { class: 'discret interne' }, 'Chaque réponse est gardée au fil de la saisie. Rien n’est envoyé à la composition avant votre validation.'),
    editable ? null : h('div', { class: 'alerte info' }, 'Ce dossier est en composition : le questionnaire se consulte, il ne se modifie plus.'),
    navEtapes, corps, h('div', { style: { marginTop: '1rem' } }, etat));

  function appliquerFamille() { el.classList.toggle('mode-famille', famille); dessiner(); }

  // ─── Sauvegardes ───
  const sauverServeur = debounce(async () => {
    if (!editable) return;
    try {
      if (!id) {
        if (!(q.defunt.prenom || '').trim()) return; // on n'ouvre pas de dossier vide
        const c = await ctx.donnees.creerDossier(ctx.org);
        const ancien = cleLocale();
        id = c.dossier.id;
        await effacer('brouillons', ancien).catch(() => {});
        history.replaceState(null, '', '#/dossiers/' + id + '/questionnaire?etape=' + etape);
      }
      etat.textContent = t('commun.enregistrement');
      const r = await ctx.donnees.sauverQuestionnaire(id, q, version);
      if (r.hors_ligne) { etat.textContent = 'Gardé sur cet appareil — envoi au retour du réseau'; return; }
      version = r.version;
      await ecrire('brouillons', cleLocale(), { q, version_base: version, modifie: 0 });
      etat.textContent = t('commun.enregistre') + ' · ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      majEtapes();
      majLancer();
    } catch (e) {
      etat.textContent = '';
      toast(e.message, { erreur: true });
    }
  }, 2200);

  const sauverLocal = debounce(() => ecrire('brouillons', cleLocale(), { q, version_base: version, modifie: Date.now() }).catch(() => {}), 400);

  let boutonLancer = null;
  let resteLancer = null;
  function majLancer() {
    if (!boutonLancer) return;
    const v = k.questionnaireValider(q);
    boutonLancer.disabled = !v.complet || !editable || !id;
    if (resteLancer) resteLancer.textContent = v.complet ? (id ? 'Tout est prêt.' : 'Enregistrement du dossier…') : `${v.pourcentage} % complété`;
  }

  function changer(section, cle, valeur) {
    q[section] = q[section] || {};
    q[section][cle] = valeur;
    sauverLocal();
    sauverServeur();
    etat.textContent = '…';
    if (section === 'offre' && cle === 'mode') dessiner(); else majLancer();
  }

  // ─── Champs ───
  let n = 0;
  const idc = () => 'qc-' + (++n);

  function champ(section, cle, etiquette, opts = {}) {
    const i = idc();
    const v = (q[section] || {})[cle];
    let input;
    if (opts.type === 'textarea') {
      input = h('textarea', { id: i, maxlength: opts.max || 600, rows: opts.lignes || 4, disabled: !editable });
      input.value = v || '';
    } else if (opts.type === 'select') {
      input = h('select', { id: i, disabled: !editable }, h('option', { value: '' }, '—'),
        opts.options.map(([val, lib]) => h('option', { value: val, selected: v === val }, lib)));
    } else {
      input = h('input', { id: i, type: opts.type || 'text', value: v || '', maxlength: opts.max || 200, autocomplete: 'off', disabled: !editable,
        inputmode: opts.inputmode || null });
    }
    const compteur = opts.max && opts.type === 'textarea' ? h('div', { class: 'compteur', 'aria-live': 'off' }, `${(v || '').length} / ${opts.max}`) : null;
    const signal = h('div', { class: 'aide', hidden: true, role: 'note' });
    input.addEventListener('input', () => {
      changer(section, cle, input.value);
      if (compteur) compteur.textContent = `${input.value.length} / ${opts.max}`;
    });
    if (opts.type === 'textarea' || !opts.type) {
      input.addEventListener('blur', () => {
        const r = k.questionnaireNettoyer({ texte: input.value || '' });
        signal.hidden = !r.retraits.length;
        signal.textContent = r.retraits.length ? 'Des coordonnées ont été repérées ici. Elles restent dans le dossier mais ne seront jamais transmises à la composition.' : '';
      });
    }
    const dictee = opts.type === 'textarea' && editable ? boutonDictee(input) : null;
    return h('div', { class: 'champ' + (opts.interne ? ' interne' : '') },
      h('label', { for: i }, etiquette, opts.requis ? h('span', { class: 'requis', 'aria-hidden': 'true' }, ' *') : null, opts.requis ? h('span', { class: 'sr' }, ' (obligatoire)') : null),
      opts.aide ? h('div', { class: 'aide' }, opts.aide) : null,
      input, h('div', { class: 'rangee', style: { justifyContent: 'space-between' } }, dictee || h('span'), compteur || h('span')), signal);
  }

  function radios(section, cle, etiquette, options, opts = {}) {
    const nom = idc();
    const v = (q[section] || {})[cle];
    return h('fieldset', { class: 'champ', style: { border: 0, padding: 0, margin: 0 } },
      h('legend', { class: 'etiquette' }, etiquette, opts.requis ? h('span', { class: 'requis' }, ' *') : null),
      opts.aide ? h('div', { class: 'aide' }, opts.aide) : null,
      h('div', { class: 'choix' }, options.map(([val, lib]) => h('label', null,
        h('input', { type: 'radio', name: nom, value: String(val), checked: v === val, disabled: !editable,
          onchange: () => changer(section, cle, val) }), h('span', null, lib)))));
  }

  function puces(section, cle, etiquette, choix, aide) {
    const v = new Set((q[section] || {})[cle] || []);
    return h('fieldset', { class: 'champ', style: { border: 0, padding: 0, margin: 0 } },
      h('legend', { class: 'etiquette' }, etiquette), aide ? h('div', { class: 'aide' }, aide) : null,
      h('div', { class: 'puces' }, choix.map((c) => h('button', { type: 'button', class: 'puce', 'aria-pressed': String(v.has(c)), disabled: !editable,
        onclick: (e) => { v.has(c) ? v.delete(c) : v.add(c); e.currentTarget.setAttribute('aria-pressed', String(v.has(c))); changer(section, cle, [...v]); } }, c))));
  }

  function liste(section, cle, etiquette, aide) {
    const i = idc();
    const input = h('input', { id: i, type: 'text', value: ((q[section] || {})[cle] || []).join(', '), disabled: !editable, autocomplete: 'off' });
    input.addEventListener('input', () => changer(section, cle, input.value.split(',').map((x) => x.trim()).filter(Boolean)));
    return h('div', { class: 'champ' }, h('label', { for: i }, etiquette), aide ? h('div', { class: 'aide' }, aide) : null, input);
  }

  function case_(section, cle, etiquette, aide, requis) {
    const i = idc();
    return h('div', { class: 'champ' }, h('label', { for: i, class: 'rangee', style: { alignItems: 'flex-start', flexWrap: 'nowrap' } },
      h('input', { id: i, type: 'checkbox', checked: !!(q[section] || {})[cle], disabled: !editable, onchange: (e) => changer(section, cle, e.target.checked) }),
      h('span', null, etiquette, requis ? h('span', { class: 'requis' }, ' *') : null)), aide ? h('div', { class: 'aide' }, aide) : null);
  }

  function boutonDictee(cible) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    let rec = null;
    const b = h('button', { type: 'button', class: 'btn btn-petit', 'aria-pressed': 'false' }, '🎙 Dicter');
    b.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = 'fr-FR'; rec.interimResults = false; rec.continuous = true;
      rec.onresult = (e) => {
        for (let j = e.resultIndex; j < e.results.length; j++) if (e.results[j].isFinal) {
          cible.value = (cible.value ? cible.value.trimEnd() + ' ' : '') + e.results[j][0].transcript.trim();
          cible.dispatchEvent(new Event('input'));
        }
      };
      rec.onend = () => { rec = null; b.setAttribute('aria-pressed', 'false'); b.textContent = '🎙 Dicter'; };
      rec.start();
      b.setAttribute('aria-pressed', 'true'); b.textContent = '■ Arrêter la dictée';
    });
    return b;
  }

  // ─── Étapes ───
  const ETAPES = [
    () => [
      h('div', { class: 'deux' },
        champ('defunt', 'prenom', 'Prénom d’usage', { requis: true, aide: 'Le prénom par lequel on l’appelait.' }),
        champ('defunt', 'nom', 'Nom de famille')),
      h('div', { class: 'deux' },
        champ('defunt', 'surnom', 'Surnom affectueux'),
        champ('defunt', 'prononciation', 'Prononciation du prénom', { aide: 'Écrivez-le comme il se dit : « Siobhan » → « Chivonne ». Seule la voix l’utilise.' })),
      radios('defunt', 'genre', 'Accord grammatical', [['il', 'il'], ['elle', 'elle'], ['iel', 'iel']], { requis: true, aide: 'Pour accorder les paroles.' }),
      h('div', { class: 'deux' },
        champ('defunt', 'naissance', 'Date de naissance', { type: 'date' }),
        champ('defunt', 'deces', 'Date du décès', { type: 'date' })),
      champ('defunt', 'lieux', 'Lieux de sa vie', { aide: 'Une ville, un village, une maison, un pays.' }),
      h('div', { class: 'deux' },
        champ('defunt', 'langues', 'Langue(s) parlée(s)'),
        champ('defunt', 'langue_refrain', 'Refrain dans une autre langue ?', { aide: 'Par exemple : en breton, en italien.' }))
    ],
    () => [
      h('div', { class: 'deux' }, champ('vie', 'metier', 'Métier', { requis: true, aide: 'Ou sa passion, si elle disait mieux qui il ou elle était.' }), champ('vie', 'passion', 'Passion')),
      puces('vie', 'traits', 'Trois traits de caractère', TRAITS, 'Choisissez, ou écrivez les vôtres juste en dessous.'),
      champ('vie', 'traits_libre', 'Autres traits, avec vos mots'),
      champ('vie', 'habitude', 'Une habitude qui lui ressemblait'),
      champ('vie', 'anecdote', 'Une anecdote', { type: 'textarea', max: 1500, lignes: 6, aide: 'Le souvenir qu’on raconte encore en famille.' }),
      champ('vie', 'phrase', 'Une phrase qu’il ou elle répétait'),
      champ('vie', 'aimait', 'Ce qu’il ou elle aimait'),
      liste('vie', 'proches', 'Proches à nommer dans la chanson', 'Séparés par des virgules. Ne les nommez qu’avec leur accord.'),
      case_('vie', 'proches_consentement', 'Les proches nommés ont donné leur accord.'),
      champ('vie', 'eviter', 'Sujets à éviter', { type: 'textarea', max: 600, lignes: 3, aide: 'La maladie, un conflit, un mot qui blesse : rien de ce qui est écrit ici ne sera abordé.' })
    ],
    () => [
      champ('musique', 'style', 'Style musical', { type: 'select', options: STYLES.map((s) => [s, s]), requis: true }),
      liste('musique', 'artistes', 'Artistes qu’il ou elle aimait', 'Pour comprendre l’ambiance seulement : aucun artiste n’est imité ni nommé dans la composition.'),
      (() => {
        const i = idc();
        const r = h('input', { id: i, type: 'range', min: 0, max: 100, step: 5, value: q.musique.energie == null ? 35 : q.musique.energie, disabled: !editable, 'aria-valuetext': '' });
        const lib = () => { const v = Number(r.value); return v < 30 ? 'Lente, intime' : v < 60 ? 'Modérée' : 'Élan, lumière'; };
        r.setAttribute('aria-valuetext', lib());
        const sortie = h('output', { for: i, class: 'petit' }, lib());
        r.addEventListener('input', () => { sortie.textContent = lib(); r.setAttribute('aria-valuetext', lib()); changer('musique', 'energie', Number(r.value)); });
        return h('div', { class: 'champ' }, h('label', { for: i }, 'Énergie'), r, sortie);
      })(),
      radios('musique', 'voix', 'Voix', [['homme', 'Voix d’homme'], ['femme', 'Voix de femme'], ['choeur', 'Chœur'], ['instrumental', 'Instrumental']], { requis: true }),
      puces('musique', 'instruments', 'Instruments souhaités', INSTRUMENTS),
      puces('musique', 'instruments_eviter', 'Instruments à éviter', INSTRUMENTS),
      radios('musique', 'duree', 'Durée', [['courte', 'Environ 2 min 30'], ['standard', 'Environ 3 min 30'], ['longue', 'Environ 4 min 30']]),
      h('p', { class: 'petit' }, 'Pour se faire une idée : ', h('a', { href: '/demos', target: '_blank', rel: 'noopener' }, 'écouter des compositions de la maison'), '.')
    ],
    () => [
      champ('ceremonie', 'rite', 'Rite', { type: 'select', options: RITES, aide: 'Les rites et textes sacrés possibles sont détaillés sur la page « Rites ».' }),
      champ('ceremonie', 'texte', 'Texte à intégrer (prière, poème, verset)', { type: 'textarea', max: 600, lignes: 3 }),
      champ('ceremonie', 'moment', 'Moment de diffusion', { type: 'select', options: MOMENTS.map((m) => [m, m]) }),
      champ('ceremonie', 'contraintes', 'Contraintes techniques du lieu', { type: 'textarea', max: 600, lignes: 2, interne: true, aide: 'Sonorisation, clé USB, durée maximale…' }),
      h('div', { class: 'deux' },
        champ('ceremonie', 'date_ceremonie', 'Date et heure de la cérémonie', { type: 'datetime-local' }),
        champ('ceremonie', 'date_limite', 'Chanson attendue au plus tard le', { type: 'datetime-local', requis: true }))
    ],
    () => [
      radios('message', 'ton', 'Le ton', TONS, { requis: true }),
      champ('message', 'refrain', 'Un mot ou une phrase pour le refrain'),
      champ('message', 'titre', 'Un titre, si la famille en a un'),
      radios('message', 'adresse', 'À qui parle la chanson ?', [['tu', 'À lui ou à elle (tu)'], ['il_elle', 'De lui ou d’elle (il, elle)'], ['nous', 'La famille, d’une seule voix (nous)']])
    ],
    () => [
      h('div', { class: 'alerte info' },
        'Les informations de ce dossier servent uniquement à composer la chanson et à la remettre à la famille (exécution du service demandé). ',
        'Elles sont conservées le temps nécessaire, jamais revendues, et la famille peut demander leur effacement à tout moment. ',
        h('a', { href: '/confidentialite', target: '_blank', rel: 'noopener' }, 'Politique de confidentialité'), '.'),
      case_('consentements', 'rgpd', 'La famille a été informée de l’usage de ces données et l’accepte.', null, true),
      radios('consentements', 'relecture_famille', 'La famille souhaite-t-elle relire les paroles ?', [[true, 'Oui'], [false, 'Non, le conseiller relit']], { requis: true }),
      case_('consentements', 'droit_image', 'Une photo pourra figurer sur la page mémorial (droit à l’image accordé).'),
      radios('consentements', 'visibilite', 'Page mémorial', [['lien', 'Lien privé (recommandé)'], ['code', 'Protégée par un code'], ['public', 'Publique'], ['non', 'Pas de page']], { requis: true,
        aide: 'La page n’est jamais indexée par les moteurs de recherche.' }),
      h('div', { class: 'rangee' }, h('button', { class: 'btn', type: 'button', onclick: recapPdf }, 'Récapitulatif (PDF)'))
    ],
    () => etapeOffre()
  ];

  function etapeOffre() {
    if (famille) {
      return [h('div', { class: 'carte filet-or' }, h('h3', null, 'Merci.'),
        h('p', { class: 'discret' }, 'Le questionnaire est rempli. Votre conseiller s’occupe de la suite et vous tiendra informés.'))];
    }
    const v = k.questionnaireValider(q);
    const s = ctx.me.services || {};
    const offres = ctx.me.offres || [];
    const codeIn = h('input', { type: 'text', id: 'code-promo', autocomplete: 'off', placeholder: 'Code promo', 'aria-describedby': 'code-retour', maxlength: 40 });
    const retour = h('div', { id: 'code-retour', class: 'aide', 'aria-live': 'polite' });
    let codeValide = null;
    const verifier = debounce(async () => {
      const c = codeIn.value.trim();
      codeValide = null;
      if (!c) { retour.textContent = ''; return; }
      try {
        const r = await ctx.donnees.promo(c);
        retour.textContent = r.message;
        codeValide = r.valide ? c : null;
      } catch (e) { retour.textContent = e.message; }
    }, 600);
    codeIn.addEventListener('input', verifier);

    const manquants = v.etapes.filter((e) => !e.complete);
    const bloc = [
      radios('offre', 'mode', 'Comment lancer la composition ?', [['payant', 'Composition réglée par l’agence'], ['essai', 'Composition d’essai offerte']], { requis: true,
        aide: s.essais_ouverts ? 'Une seule composition d’essai par agence, d’environ 2 min 30, écoutée par la maison avant livraison.' : 'Les compositions d’essai ne sont pas encore ouvertes.' }),
      q.offre.mode === 'payant' ? h('fieldset', { class: 'champ', style: { border: 0, padding: 0 } }, h('legend', { class: 'etiquette' }, 'Offre'),
        h('div', { class: 'grille' }, offres.map((o) => h('label', { class: 'carte', style: { cursor: 'pointer' } },
          h('input', { type: 'radio', name: 'offre', value: o.id, checked: q.offre.offre_id === o.id, disabled: !editable, onchange: () => { changer('offre', 'offre_id', o.id); dessiner(); } }),
          h('h3', null, o.nom), h('p', { class: 'petit' }, o.description), h('p', { class: 'mono' }, prix(o.prix_cents)))))) : null,
      q.offre.mode === 'payant' ? h('div', { class: 'champ' }, h('label', { for: 'code-promo' }, 'Code promo'), codeIn, retour) : null,
      s.mention_tva ? h('p', { class: 'petit' }, s.mention_tva) : null,
      manquants.length ? h('div', { class: 'alerte' }, h('strong', null, 'Il reste à compléter : '),
        manquants.map((e) => t('etapes')[e.n - 1]).join(', ')) : null,
      h('div', { class: 'rangee', style: { marginTop: '1rem' } },
        boutonLancer = h('button', { class: 'btn btn-or', type: 'button', id: 'btn-lancer', disabled: !v.complet || !editable || !id, onclick: async () => {
          try {
            await sauverServeur.flush();
            if (statut === 'brouillon') { await ctx.donnees.changerStatut(id, 'complet'); statut = 'complet'; }
            if (q.offre.mode === 'essai') {
              await ctx.donnees.essai(id, empreinteAppareil());
              toast('Composition d’essai accordée. La maison s’en occupe.');
            } else {
              const r = await ctx.donnees.checkout(id, codeValide || '');
              if (r.url) { location.href = r.url; return; }
              if (r.gratuit) toast('Code appliqué : composition offerte.');
            }
            ctx.aller('dossiers/' + id);
          } catch (e) { toast(e.message, { erreur: true }); }
        } }, q.offre.mode === 'essai' ? 'Demander la composition d’essai' : 'Valider et régler'),
        resteLancer = h('span', { class: 'petit' }, v.complet ? (id ? 'Tout est prêt.' : 'Enregistrement du dossier…') : `${v.pourcentage} % complété`))
    ];
    return bloc;
  }

  function empreinteAppareil() {
    let e = localStorage.getItem('melodia_pro_appareil');
    if (!e) { e = Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, '0')).join(''); localStorage.setItem('melodia_pro_appareil', e); }
    return e;
  }

  async function recapPdf() {
    const { recapitulatif } = await import('../pdf.js');
    recapitulatif(q, { famille, reference: id || 'brouillon' });
  }

  function majEtapes() {
    const v = k.questionnaireValider(q);
    vider(navEtapes);
    t('etapes').forEach((nom, i) => {
      const fait = v.etapes[i] && v.etapes[i].complete;
      navEtapes.append(h('li', null, h('button', { type: 'button', class: fait ? 'fait' : '', 'aria-current': etape === i + 1 ? 'step' : null,
        onclick: () => { etape = i + 1; dessiner(true); } }, h('span', { class: 'mono' }, String(i + 1)), ' ', nom, fait ? h('span', { class: 'sr' }, ' (complète)') : null)));
    });
  }

  function dessiner(focus) {
    n = 0;
    boutonLancer = null; resteLancer = null;
    majEtapes();
    vider(corps);
    const h2 = h('h2', { tabindex: '-1' }, h('span', { class: 'mono discret' }, etape + ' / 7 · '), t('etapes')[etape - 1]);
    corps.append(h2, ...ETAPES[etape - 1](),
      h('div', { class: 'rangee', style: { justifyContent: 'space-between', marginTop: '1.4rem' } },
        h('button', { class: 'btn', type: 'button', disabled: etape === 1, onclick: () => { etape--; dessiner(true); } }, '← ' + t('commun.precedent')),
        etape < 7 ? h('button', { class: 'btn btn-or', type: 'button', onclick: () => { etape++; dessiner(true); } }, t('commun.suivant') + ' →') : h('span')));
    if (id) history.replaceState(null, '', '#/dossiers/' + id + '/questionnaire?etape=' + etape);
    if (focus) { h2.focus(); annoncer('Étape ' + etape + ' : ' + t('etapes')[etape - 1]); }
  }

  appliquerFamille();
  return () => { /* les sauvegardes en attente partent d'elles-mêmes */ };
}
