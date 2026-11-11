// ═══════════════════════════════════════════════════════════════
// QR & impressions : le studio.
// Rendu par le noyau Rust (mêmes règles que le serveur) ; repli sur
// assets/js/qr.js si le noyau ne se charge pas.
// ═══════════════════════════════════════════════════════════════

import { h, titre, vider, toast, vide, telecharger, debounce, confirmer, surBureau, imprimerSurBureau } from '../ui.js';
import { t } from '../i18n.js';
import { noyau } from '../noyau.js';
import { GABARITS, mettreEnPage, versSvg, versPng, versPdf, ENCRE, IVOIRE, OR_IVOIRE } from '../gabarits.js';

const PALETTES = [
  { nom: 'Encre sur ivoire', encre: ENCRE, fond: IVOIRE },
  { nom: 'Encre sur blanc', encre: ENCRE, fond: '#ffffff' },
  { nom: 'Or patiné sur ivoire', encre: OR_IVOIRE, fond: IVOIRE },
  { nom: 'Brun sur ivoire', encre: '#17150f', fond: '#ebe6db' }
];

async function enDataUrl(url) {
  const b = await (await fetch(url)).blob();
  return new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
}

async function qrDeRepli(texte) {
  if (!window.MelodiaQR) {
    await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = '/assets/js/qr.js'; s.onload = ok; s.onerror = ko; document.head.append(s); });
  }
  return window.MelodiaQR.svg(texte, { niveau: 'H', titre: 'QR code' });
}

async function liste(el, ctx) {
  el.append(h('p', { class: 'surtitre' }, 'Studio'), titre(1, 'QR &', 'impressions'));
  const { dossiers } = ctx.org ? await ctx.donnees.dossiers(ctx.org) : { dossiers: [] };
  const livres = dossiers.filter((d) => d.status === 'livre');
  if (!livres.length) {
    el.append(vide({ image: '/assets/img/pro/empty-qr.webp', texte: t('vide.qr') }));
    el.append(h('p', { class: 'petit', style: { marginTop: '1rem' } }, 'En attendant, le ', h('a', { href: '#/parametres' }, 'pack promotionnel'), ' présente le service à vos familles.'));
    return;
  }
  el.append(h('div', { class: 'grille' }, livres.map((d) => h('a', { class: 'carte carte-lien filet-or', href: '#/qr/' + d.id },
    h('h3', null, d.prenom || '—'), h('p', { class: 'petit' }, d.reference, ' · ', d.titre || '')))));
}

export async function rendre(el, ctx, route) {
  if (!route.id) return liste(el, ctx);
  const fiche = await ctx.donnees.dossier(route.id);
  const d = fiche.dossier;
  const q = (await ctx.donnees.qr(d.id)).qr;
  const def = (fiche.questionnaire && fiche.questionnaire.donnees.defunt) || {};
  const annee = (v) => (v ? String(v).slice(0, 4) : '');
  const org = (ctx.me.organisations || []).find((o) => o.id === ctx.org) || {};

  let k = null;
  try { k = await noyau(); } catch (e) { k = null; }
  const etat = {
    gabarit: GABARITS[0], modules: 'arrondi', yeux: 'arrondi', palette: PALETTES[0], logo: 'melodia',
    textes: true, prenom: d.prenom || def.prenom || '', dates: [annee(def.naissance), annee(def.deces)].filter(Boolean).join(' – '),
    phrase: 'Écoutez sa chanson', cobranding: !!org.cobranding
  };
  let monogramme = null, logoAgence = null, rendu = null, svgFinal = '';
  try { monogramme = await enDataUrl('/assets/img/logo-melodia-160.webp'); } catch (e) { monogramme = null; }
  try {
    logoAgence = ctx.donnees.demo ? await ctx.donnees.logoDonnee() : (org.logo_url ? await enDataUrl(org.logo_url) : null);
  } catch (e) { logoAgence = null; }

  const apercu = h('div', { class: 'apercu', role: 'img', 'aria-label': 'Aperçu du support imprimé' });
  const infos = h('div', { class: 'petit', 'aria-live': 'polite' });
  const alerte = h('div', { class: 'alerte erreur', hidden: true, role: 'alert' });

  function logoHref() {
    if (etat.logo === 'melodia') return monogramme;
    if (etat.logo === 'agence') return logoAgence;
    return null;
  }

  async function dessiner() {
    const g = etat.gabarit;
    const mise = mettreEnPage(g, { prenom: etat.prenom, dates: etat.dates, phrase: etat.phrase, agence: org.nom }, { textes: etat.textes, cobranding: etat.cobranding });
    let svgQr;
    if (k) {
      const href = logoHref();
      const r = k.qrSvg({ texte: q.url, modules: etat.modules, yeux: etat.yeux, encre: etat.palette.encre, fond: etat.palette.fond,
        logo: href ? 0.2 : 0, logo_href: href || '', taille_mm: mise.qr, formes: true, titre: 'QR code du mémorial' });
      if (!r.ok) { alerte.hidden = false; alerte.textContent = r.message; return; }
      alerte.hidden = true;
      rendu = r;
      svgQr = r.svg;
      const mm = (r.module_um / 1000).toFixed(2).replace('.', ',');
      infos.textContent = `QR de ${String(mise.qr.toFixed(0))} mm · module de ${mm} mm · contraste ${(r.contraste_x100 / 100).toFixed(1).replace('.', ',')}:1 · correction H` +
        (r.alertes.includes('MODULE_TROP_PETIT') ? ' — attention : module sous 0,4 mm, le code risque de mal se lire une fois imprimé.' : '');
    } else {
      svgQr = await qrDeRepli(q.url);
      rendu = null;
      infos.textContent = 'Rendu de secours (sans style).';
    }
    svgFinal = versSvg(g, mise, svgQr);
    vider(apercu);
    const tpl = document.createElement('template');
    // Le SVG est produit par notre code (noyau + gabarit, textes échappés) : aucune donnée brute n'y entre.
    tpl.innerHTML = svgFinal; // eslint-disable-line no-unsanitized/property
    apercu.append(tpl.content);
    etat.mise = mise;
  }
  const redessiner = debounce(dessiner, 120);

  // ─── Contrôles ───
  const boutonsGabarit = h('div', { class: 'gabarits', role: 'group', 'aria-label': 'Support' },
    GABARITS.map((g) => h('button', { type: 'button', 'aria-pressed': String(g === etat.gabarit), onclick: (e) => {
      etat.gabarit = g;
      for (const b of boutonsGabarit.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
      dessiner();
    } }, g.nom, h('br'), h('span', { class: 'petit' }, `${g.l} × ${g.h} mm`))));

  const choix = (nom, options, cle) => h('fieldset', { class: 'champ', style: { border: 0, padding: 0, margin: 0 } },
    h('legend', { class: 'etiquette' }, nom),
    h('div', { class: 'choix' }, options.map(([v, lib]) => h('label', null,
      h('input', { type: 'radio', name: 'qr-' + cle, value: v, checked: etat[cle] === v || etat[cle] === options.find((o) => o[0] === v)?.[2], onchange: () => { etat[cle] = options.find((o) => o[0] === v)[2] || v; dessiner(); } }),
      h('span', null, lib)))));

  const champTexte = (lib, cle) => {
    const i = h('input', { type: 'text', value: etat[cle], maxlength: 60 });
    i.addEventListener('input', () => { etat[cle] = i.value; redessiner(); });
    return h('div', { class: 'champ' }, h('label', null, lib, i));
  };

  const exporter = async (format) => {
    const g = etat.gabarit;
    const base = `melodia-${d.reference}-${g.id}`;
    try {
      if (format === 'svg') telecharger(new Blob([svgFinal], { type: 'image/svg+xml' }), base + '.svg');
      else if (format === 'png300' || format === 'png600') telecharger(await versPng(svgFinal, g, format === 'png600' ? 600 : 300), `${base}-${format.slice(3)}dpi.png`);
      else if (format === 'pdf') {
        if (!rendu) throw new Error('Le PDF demande le noyau de rendu.');
        telecharger(await versPdf(g, etat.mise, rendu, { encre: etat.palette.encre, fond: etat.palette.fond }, logoHref()), base + '.pdf');
      }
      toast('Fichier prêt.');
    } catch (e) { toast(e.message || 'Export impossible.', { erreur: true }); }
  };

  // Réglages du mémorial
  const vis = h('select', { 'aria-label': 'Visibilité du mémorial' },
    [['lien', 'Lien privé'], ['code', 'Protégé par un code'], ['public', 'Public'], ['non', 'Pas de page']].map(([v, l]) => h('option', { value: v, selected: q.visibilite === v }, l)));
  const code = h('input', { type: 'text', placeholder: q.code ? 'Code déjà défini' : 'Code d’accès (4 caractères ou plus)', autocomplete: 'off', maxlength: 40 });
  const mot = h('textarea', { rows: 3, maxlength: 800, placeholder: 'Un mot de la famille, affiché sous la chanson' });
  mot.value = q.mot_famille || '';
  const paroles = h('input', { type: 'checkbox', checked: !!q.afficher_paroles });
  const statutPub = h('p', { class: 'petit' }, q.actif ? 'Page publiée.' : 'Page non publiée.');
  const enregistrer = async (publier) => {
    try {
      const o = { visibilite: vis.value, afficher_paroles: paroles.checked, mot_famille: mot.value };
      if (code.value.trim()) o.code = code.value.trim();
      if (publier !== undefined) o.actif = publier;
      const r = await ctx.donnees.qr(d.id, o);
      Object.assign(q, r.qr);
      statutPub.textContent = q.actif ? 'Page publiée.' : 'Page non publiée.';
      code.value = '';
      toast('Réglages du mémorial enregistrés.');
    } catch (e) { toast(e.message, { erreur: true }); }
  };

  el.append(
    h('p', { class: 'surtitre' }, 'Studio · ' + d.reference),
    titre(1, 'Le QR de', etat.prenom || 'la chanson'),
    h('p', { class: 'petit' }, 'Adresse du mémorial : ', h('span', { class: 'mono' }, q.url), ' — aucune donnée personnelle dans le lien.'),
    alerte,
    h('div', { class: 'studio' },
      h('div', { class: 'pile' }, apercu, infos,
        h('div', { class: 'rangee' },
          h('button', { class: 'btn', type: 'button', onclick: () => exporter('svg') }, 'SVG (graveur)'),
          h('button', { class: 'btn', type: 'button', onclick: () => exporter('png300') }, 'PNG 300 dpi'),
          h('button', { class: 'btn', type: 'button', onclick: () => exporter('png600') }, 'PNG 600 dpi'),
          h('button', { class: 'btn btn-or', type: 'button', onclick: () => exporter('pdf') }, 'PDF imprimable'),
          surBureau() ? h('button', { class: 'btn', type: 'button', onclick: async () => {
            try { await imprimerSurBureau(await versPdf(etat.gabarit, etat.mise, rendu, { encre: etat.palette.encre, fond: etat.palette.fond }, logoHref()), 'melodia-' + d.reference + '.pdf'); toast('Envoyé à l’imprimante.'); }
            catch (e) { toast(String(e), { erreur: true }); }
          } }, 'Imprimer') : null),
        h('p', { class: 'petit' }, 'Le PDF comprend 3 mm de fond perdu et les traits de coupe.')),
      h('div', { class: 'pile carte' },
        h('h2', null, 'Support'), boutonsGabarit,
        choix('Modules', [['carre', 'Carrés'], ['arrondi', 'Arrondis'], ['point', 'Points']], 'modules'),
        choix('Yeux', [['carre', 'Carrés'], ['arrondi', 'Arrondis']], 'yeux'),
        h('fieldset', { class: 'champ', style: { border: 0, padding: 0, margin: 0 } }, h('legend', { class: 'etiquette' }, 'Couleurs'),
          h('div', { class: 'choix' }, PALETTES.map((p) => h('label', null, h('input', { type: 'radio', name: 'qr-pal', checked: p === etat.palette, onchange: () => { etat.palette = p; dessiner(); } }), h('span', null, p.nom))))),
        choix('Au centre', [['melodia', 'Monogramme Melodia'], ['agence', 'Logo de l’agence'], ['aucun', 'Rien']], 'logo'),
        logoAgence ? null : h('p', { class: 'petit' }, 'Le logo de l’agence se dépose dans ', h('a', { href: '#/parametres' }, 'Paramètres'), '.'),
        h('label', { class: 'rangee' }, h('input', { type: 'checkbox', checked: etat.textes, onchange: (e) => { etat.textes = e.target.checked; dessiner(); } }), 'Textes sur le support'),
        champTexte('Prénom', 'prenom'), champTexte('Dates', 'dates'), champTexte('Phrase', 'phrase'),
        h('label', { class: 'rangee' }, h('input', { type: 'checkbox', checked: etat.cobranding, onchange: (e) => { etat.cobranding = e.target.checked; dessiner(); } }), 'Nom de l’agence dans la signature'))),
    h('section', { class: 'carte', style: { marginTop: '1.4rem' } },
      h('h2', null, 'La page ', h('em', null, 'mémorial')),
      h('div', { class: 'deux' },
        h('div', { class: 'champ' }, h('label', null, 'Visibilité'), vis),
        h('div', { class: 'champ' }, h('label', null, 'Code d’accès'), code)),
      h('div', { class: 'champ' }, h('label', null, 'Mot de la famille'), mot),
      h('label', { class: 'rangee' }, paroles, 'Afficher les paroles sur la page'),
      statutPub,
      h('div', { class: 'rangee' },
        h('button', { class: 'btn', type: 'button', onclick: () => enregistrer() }, 'Enregistrer'),
        h('button', { class: 'btn btn-or', type: 'button', onclick: async () => {
          if (q.actif) {
            if (await confirmer({ titre: 'Retirer la page ?', texte: 'Les personnes qui scanneront le QR verront un message indiquant que la page n’est pas disponible.', bouton: 'Retirer la page', danger: true })) enregistrer(false);
          } else enregistrer(true);
        } }, q.actif ? 'Retirer la page' : 'Publier la page'),
        h('a', { class: 'btn', href: '#/memorial/' + q.jeton }, 'Aperçu'),
        h('span', { class: 'petit' }, (q.scans || 0) + ' ouverture(s)'))));

  await dessiner();
}
