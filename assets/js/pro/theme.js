// Thème clair / sombre / automatique et couleur d'accent de l'agence.
import { accentPour } from './logique.js';

const CLE = 'melodia_pro_theme';
const FONDS = { dark: '#0b0b11', light: '#f4f1ea' };

export function choixTheme() { return localStorage.getItem(CLE) || 'auto'; }

export function themeEffectif(choix = choixTheme()) {
  if (choix === 'light' || choix === 'dark') return choix;
  return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function appliquerTheme(choix = choixTheme()) {
  const eff = themeEffectif(choix);
  document.documentElement.setAttribute('data-theme', eff);
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', eff === 'light' ? '#f4f1ea' : '#040407');
  appliquerMarque();
  window.dispatchEvent(new CustomEvent('melodia-theme', { detail: eff }));
  return eff;
}

export function definirTheme(choix) {
  localStorage.setItem(CLE, choix);
  return appliquerTheme(choix);
}

/** Bascule clair ↔ sombre (sort de « auto » en fixant l'inverse du thème courant). */
export function basculerTheme() { return definirTheme(themeEffectif() === 'light' ? 'dark' : 'light'); }

export function suivreSysteme() {
  if (!window.matchMedia) return;
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (choixTheme() === 'auto') appliquerTheme('auto'); });
}

// ─── Marque de l'agence (sur cet appareil) ───

const CLE_MARQUE = 'melodia_pro_marque';
export const ACCENTS = [
  { id: 'or', nom: 'Or de la maison', sombre: null, clair: null },
  { id: 'bleu', nom: 'Bleu nuit', sombre: '#7da3d9', clair: '#2d5a99' },
  { id: 'vert', nom: 'Vert sauge', sombre: '#8cbf9e', clair: '#2b6a45' },
  { id: 'rose', nom: 'Rose ancien', sombre: '#d99aa6', clair: '#9a3f55' },
  { id: 'lavande', nom: 'Lavande', sombre: '#a99ae0', clair: '#5a449c' },
  { id: 'cuivre', nom: 'Cuivre', sombre: '#d49a6a', clair: '#8f4f1e' }
];

export function lireMarque() {
  try { return JSON.parse(localStorage.getItem(CLE_MARQUE) || 'null') || {}; } catch (e) { return {}; }
}
export function ecrireMarque(m) { localStorage.setItem(CLE_MARQUE, JSON.stringify(m)); appliquerMarque(); }

/**
 * Chaque accent a une teinte pour le fond sombre et une pour le fond clair.
 * Elle n'est appliquée que si elle se lit (contraste ≥ 4,5:1) ; sinon on
 * garde l'or, pour ne jamais rendre un texte illisible.
 */
export function appliquerMarque() {
  const m = lireMarque();
  const clair = document.documentElement.getAttribute('data-theme') === 'light';
  const a = ACCENTS.find((x) => x.id === m.accent);
  const hex = a && (clair ? a.clair : a.sombre);
  const ok = hex && accentPour(hex, FONDS[clair ? 'light' : 'dark']);
  if (ok) document.documentElement.style.setProperty('--accent', ok);
  else document.documentElement.style.removeProperty('--accent');
}
