// Partage avec la famille : lien du mémorial, copie, QR de lecture à l'écran.
import { h } from './ui.js';
import { noyau } from './noyau.js';

/** SVG d'un QR (noyau Rust ; repli sur assets/js/qr.js). Le SVG est produit par notre code. */
export async function qrCourt(texte, couleurs = { encre: '#17150f', fond: '#ffffff' }) {
  try {
    const k = await noyau();
    const r = k.qrSvg({ texte, modules: 'carre', yeux: 'carre', encre: couleurs.encre, fond: couleurs.fond, logo: 0, logo_href: '', taille_mm: 40, formes: true, titre: 'QR code du mémorial' });
    if (r.ok) return r.svg;
  } catch (e) { /* repli */ }
  if (!window.MelodiaQR) {
    await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = '/assets/js/qr.js'; s.onload = ok; s.onerror = ko; document.head.append(s); });
  }
  return window.MelodiaQR.svg(texte, { niveau: 'H', titre: 'QR code du mémorial' });
}

export async function copier(texte) {
  try { await navigator.clipboard.writeText(texte); return true; } catch (e) {
    const t = h('textarea', { 'aria-hidden': 'true', style: { position: 'fixed', opacity: '0' } });
    t.value = texte; document.body.append(t); t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    t.remove();
    return ok;
  }
}

/** Bloc « Partager » : lien, copie, partage natif, QR. `qr` = { url, actif } */
export async function blocPartage({ url, actif, prenom, toast }) {
  const champ = h('input', { type: 'text', readonly: true, value: url, 'aria-label': 'Lien du mémorial', onfocus: (e) => e.target.select() });
  const mini = h('div', { class: 'mini', role: 'img', 'aria-label': 'QR code du lien du mémorial' });
  try {
    const tpl = document.createElement('template');
    tpl.innerHTML = await qrCourt(url); // eslint-disable-line no-unsanitized/property -- SVG produit par notre code
    mini.append(tpl.content);
  } catch (e) { mini.hidden = true; }
  return h('div', { class: 'qr-partage' }, mini,
    h('div', { class: 'pile' },
      h('p', { class: 'petit', style: { margin: 0 } }, actif ? 'Le mémorial est publié : toute personne ayant ce lien peut écouter la chanson.' : 'Le lien fonctionnera dès que le mémorial sera publié depuis le studio QR.'),
      h('div', { class: 'lien-copie' }, champ,
        h('button', { class: 'btn', type: 'button', onclick: async () => toast((await copier(url)) ? 'Lien copié.' : 'Copie impossible : sélectionnez le lien.', { erreur: false }) }, 'Copier')),
      navigator.share ? h('button', { class: 'btn btn-petit', type: 'button', onclick: () => navigator.share({ title: 'Une chanson pour ' + (prenom || ''), url }).catch(() => {}) }, 'Partager…') : null));
}
