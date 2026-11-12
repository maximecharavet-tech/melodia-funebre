// Petits outils d'interface, sans dépendance. Aucune donnée saisie n'est
// jamais injectée en HTML : h() pose du texte, pas du balisage.

export function h(tag, attrs, ...enfants) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') throw new Error('html interdit');
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const e of enfants.flat(Infinity)) {
    if (e == null || e === false) continue;
    el.append(e instanceof Node ? e : document.createTextNode(String(e)));
  }
  return el;
}

/** Titre avec un mot en italique or : titre('Ma', 'journée'). */
export function titre(niveau, avant, mot, apres) {
  return h('h' + niveau, null, avant ? avant + ' ' : '', mot ? h('em', null, mot) : '', apres ? ' ' + apres : '');
}

export function vider(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function annoncer(texte) {
  const a = document.getElementById('annonce');
  if (!a) return;
  a.textContent = '';
  setTimeout(() => { a.textContent = texte; }, 30);
}

/** Toast ; options : { erreur, annuler: () => {}, duree } */
export function toast(message, options = {}) {
  const zone = document.getElementById('toasts');
  const t = h('div', { class: 'toast' + (options.erreur ? ' erreur' : ''), role: options.erreur ? 'alert' : 'status' }, h('span', null, message));
  let fini = false;
  const retirer = () => { if (!fini) { fini = true; t.remove(); } };
  if (options.annuler) {
    t.append(h('button', { class: 'btn btn-petit', type: 'button', onclick: () => { retirer(); options.annuler(); } }, 'Annuler'));
  }
  zone.append(t);
  setTimeout(retirer, options.duree || (options.annuler ? 8000 : 4500));
  return retirer;
}

/**
 * Confirmation forte : pour les gestes graves, la personne doit retaper un mot.
 * Rend une promesse booléenne.
 */
export function confirmer({ titre: t, texte, bouton = 'Confirmer', mot = null, danger = false }) {
  return new Promise((resoudre) => {
    const champ = mot ? h('input', { type: 'text', 'aria-label': `Tapez ${mot} pour confirmer`, autocomplete: 'off' }) : null;
    const ok = h('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-or'), type: 'button', disabled: !!mot }, bouton);
    const d = h('dialog', { 'aria-labelledby': 'dlg-t' },
      h('h2', { id: 'dlg-t' }, t),
      h('p', { class: 'discret' }, texte),
      mot ? h('div', { class: 'champ' }, h('label', null, `Pour confirmer, tapez « ${mot} »`), champ) : null,
      h('div', { class: 'rangee fin', style: { marginTop: '1.2rem' } },
        h('button', { class: 'btn', type: 'button', onclick: () => fermer(false) }, 'Annuler'), ok));
    function fermer(v) { d.close(); d.remove(); resoudre(v); }
    if (champ) champ.addEventListener('input', () => { ok.disabled = champ.value.trim().toLowerCase() !== mot.toLowerCase(); });
    ok.addEventListener('click', () => fermer(true));
    d.addEventListener('cancel', (e) => { e.preventDefault(); fermer(false); });
    document.body.append(d);
    d.showModal();
    (champ || ok).focus();
  });
}

/** Squelettes de chargement, à la forme de la vue attendue ('liste', 'tuiles', 'tableau'). */
export function squelettes(n = 3, forme = 'liste') {
  const bloc = (hauteur, largeur) => h('div', { class: 'squelette', style: { height: hauteur, width: largeur || '100%' } });
  if (forme === 'tuiles') {
    return h('div', { class: 'pile', 'aria-hidden': 'true' }, bloc('2.2rem', '35%'), bloc('1rem', '55%'),
      h('div', { class: 'tuiles' }, ...Array.from({ length: 4 }, () => bloc('7.5rem'))), bloc('11rem'));
  }
  if (forme === 'tableau') {
    return h('div', { class: 'pile', 'aria-hidden': 'true' }, bloc('2.2rem', '30%'),
      h('div', { class: 'rangee' }, bloc('44px', '240px'), bloc('38px', '90px'), bloc('38px', '110px'), bloc('38px', '90px')),
      ...Array.from({ length: 6 }, () => bloc('3.2rem')));
  }
  return h('div', { class: 'pile', 'aria-hidden': 'true' },
    h('div', { class: 'squelette', style: { height: '2rem', width: '35%' } }),
    ...Array.from({ length: n }, () => h('div', { class: 'squelette', style: { height: '5.5rem' } })));
}

export function vide({ image, texte, action }) {
  return h('div', { class: 'vide' },
    image ? h('img', { src: image, srcset: image.replace(/.webp$/, '-480.webp') + ' 480w, ' + image + ' 960w', sizes: '(max-width: 600px) 80vw, 320px', alt: '', width: 320, height: 180, loading: 'lazy' }) : null,
    h('p', { class: 'discret' }, texte),
    action || null);
}

export function badgeStatut(statut, libelle) {
  return h('span', { class: 'badge s-' + statut }, libelle);
}

async function enBase64(blob) {
  const octets = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode.apply(null, octets.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Application Windows (Tauri) : la commande native existe-t-elle ? */
export function surBureau() { return !!(window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke); }

/** Impression directe d'un PDF depuis l'application Windows. */
export async function imprimerSurBureau(blob, nom) {
  await window.__TAURI__.core.invoke('imprimer_pdf', { nom, base64: await enBase64(blob) });
}

/** Téléchargement d'un Blob sous un nom donné (dans l'application Windows :
    boîte « Enregistrer sous », pour choisir le dossier du graveur). */
export function telecharger(blob, nom) {
  if (surBureau()) {
    enBase64(blob).then((base64) => window.__TAURI__.core.invoke('enregistrer_fichier', { nom, base64 })).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: nom });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
}

/** Différé ; .flush() exécute tout de suite l'appel en attente (et rend sa promesse). */
export function debounce(f, ms) {
  let t = null;
  let args = [];
  const d = (...a) => { args = a; clearTimeout(t); t = setTimeout(() => { t = null; f(...args); }, ms); };
  d.flush = async () => { if (t) { clearTimeout(t); t = null; return f(...args); } return undefined; };
  return d;
}

/** Vidéo en boucle, ou son image fixe si la personne a demandé moins de mouvement. */
export function media(nom, legende) {
  const poster = '/assets/video/pro/' + nom + '.webp';
  const calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cadre = { maxWidth: '640px', margin: '6vh auto 0', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--line)' };
  if (calme) return h('figure', { style: Object.assign({ padding: 0 }, cadre) }, h('img', { src: poster, alt: legende, width: 1280, height: 720 }));
  return h('figure', { style: Object.assign({ padding: 0 }, cadre) },
    h('video', { autoplay: true, muted: true, loop: true, playsinline: true, poster, width: 1280, height: 720, 'aria-label': legende },
      h('source', { src: '/assets/video/pro/' + nom + '.webm', type: 'video/webm' }),
      h('source', { src: '/assets/video/pro/' + nom + '.mp4', type: 'video/mp4' })));
}
