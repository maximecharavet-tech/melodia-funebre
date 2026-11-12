// Visite guidée de la console : quelques bulles ancrées aux vrais éléments.
// Se lance une fois (puis à la demande depuis l'aide). Clavier : Entrée / → suivant,
// ← précédent, Échap passer. Principe des « product tours » (Shepherd.js,
// Driver.js : MIT) ; réécrit ici sans dépendance.
import { h } from './ui.js';
import { calme } from './composants.js';

const CLE = 'melodia_pro_visite';
export const visiteVue = () => localStorage.getItem(CLE) === '1';

const PAS = [
  { cible: ['#nav-laterale', '#nav-bas'], titre: 'Votre console', texte: 'Ma journée, vos dossiers, les statistiques, la bibliothèque et le studio QR : tout se trouve ici.' },
  { cible: ['#btn-nouveau'], titre: 'Un nouveau dossier', texte: 'Le questionnaire se remplit en quelques minutes, seul ou avec la famille. Raccourci : N.' },
  { cible: ['#recherche'], titre: 'Aller vite', texte: 'Tapez / pour chercher un dossier, ou Ctrl/⌘ + K pour la palette : pages, actions et dossiers au même endroit.' },
  { cible: ['#btn-notifs'], titre: 'Ce qui vous attend', texte: 'Les paroles à relire, les chansons livrées et les cérémonies proches apparaissent ici.' },
  { cible: ['#btn-theme'], titre: 'À votre goût', texte: 'Thème clair ou sombre. Les couleurs et le nom de votre agence se règlent dans les paramètres.' }
];

function visible(el) { return el && el.getClientRects().length > 0; }

export function lancerVisite({ force = false } = {}) {
  if (!force && visiteVue()) return;
  if (document.querySelector('.visite')) return;
  const pas = PAS.map((p) => ({ ...p, el: p.cible.map((s) => document.querySelector(s)).find(visible) })).filter((p) => p.el);
  if (!pas.length) return;
  let i = 0;
  const halo = h('div', { class: 'halo-visite', 'aria-hidden': 'true' });
  const titre = h('h2', { id: 'visite-t' });
  const texte = h('p');
  const num = h('span', { class: 'pas' });
  const prec = h('button', { class: 'btn btn-petit', type: 'button', onclick: () => aller(i - 1) }, 'Précédent');
  const suiv = h('button', { class: 'btn btn-petit btn-or', type: 'button', onclick: () => (i === pas.length - 1 ? fin() : aller(i + 1)) });
  const passer = h('button', { class: 'btn btn-petit', type: 'button', onclick: () => fin() }, 'Passer');
  const bulle = h('div', { class: 'visite', role: 'dialog', 'aria-labelledby': 'visite-t', 'aria-modal': 'false' }, titre, texte, h('div', { class: 'rangee', style: { justifyContent: 'space-between' } }, num, h('div', { class: 'rangee' }, passer, prec, suiv)));

  function placer() {
    const p = pas[i];
    const r = p.el.getBoundingClientRect();
    const marge = 6;
    Object.assign(halo.style, { left: r.left - marge + 'px', top: r.top - marge + 'px', width: r.width + 2 * marge + 'px', height: r.height + 2 * marge + 'px' });
    const bw = bulle.offsetWidth || 340, bh = bulle.offsetHeight || 160;
    let top = r.bottom + 14;
    if (top + bh > innerHeight - 8) top = Math.max(8, r.top - bh - 14);
    let left = Math.min(Math.max(8, r.left), innerWidth - bw - 8);
    if (r.width > innerWidth * 0.5 || r.height > innerHeight * 0.5) { left = Math.min(innerWidth - bw - 8, r.right + 14); top = Math.max(8, r.top + 12); if (left < 8) left = 8; }
    Object.assign(bulle.style, { left: left + 'px', top: top + 'px' });
  }
  function aller(n) {
    i = Math.min(pas.length - 1, Math.max(0, n));
    const p = pas[i];
    titre.textContent = p.titre; texte.textContent = p.texte;
    num.textContent = `${i + 1} / ${pas.length}`;
    prec.hidden = i === 0;
    suiv.textContent = i === pas.length - 1 ? 'Terminer' : 'Suivant';
    p.el.scrollIntoView({ block: 'nearest', behavior: calme() ? 'auto' : 'smooth' });
    placer();
    suiv.focus({ preventScroll: true });
  }
  function fin() {
    localStorage.setItem(CLE, '1');
    halo.remove(); bulle.remove();
    window.removeEventListener('resize', placer);
    document.removeEventListener('keydown', touche, true);
    const retour = document.getElementById('recherche');
    if (retour) retour.focus({ preventScroll: true });
  }
  const touche = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); fin(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); i === pas.length - 1 ? fin() : aller(i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); aller(i - 1); }
  };
  document.body.append(halo, bulle);
  window.addEventListener('resize', placer);
  document.addEventListener('keydown', touche, true);
  aller(0);
}
