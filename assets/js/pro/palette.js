// ═══════════════════════════════════════════════════════════════
// Palette de commandes (Ctrl/⌘ + K) et aide des raccourcis (?).
//
// Interaction inspirée de cmdk (MIT, Paco Coursey) et du composant Command
// de shadcn/ui (MIT) : un champ, une liste filtrée à la frappe, flèches et
// Entrée. Réécrit sans dépendance pour ce dépôt.
// ═══════════════════════════════════════════════════════════════

import { h, vider } from './ui.js';
import { icone } from './icones.js';
import { normaliser } from './logique.js';
import { t } from './i18n.js';

/** Raccourcis documentés : [touches, description]. Source unique de l'aide. */
export const RACCOURCIS = [
  [['Ctrl/⌘', 'K'], 'Ouvrir la palette de commandes'],
  [['/'], 'Rechercher un dossier'],
  [['N'], 'Nouveau dossier'],
  [['G', 'puis J'], 'Aller à Ma journée'],
  [['G', 'puis D'], 'Aller aux dossiers'],
  [['G', 'puis S'], 'Aller aux statistiques'],
  [['G', 'puis B'], 'Aller à la bibliothèque'],
  [['G', 'puis Q'], 'Aller aux QR et impressions'],
  [['T'], 'Basculer thème clair / sombre'],
  [['P'], 'Mode présentation (sur la fiche d’une chanson livrée)'],
  [['?'], 'Afficher cette aide'],
  [['Échap'], 'Fermer le panneau ouvert']
];

let ouverte = false;

/**
 * Ouvre la palette. `actions` : [{ id, libelle, groupe, icone, aide, executer }]
 */
export function ouvrirPalette(actions) {
  if (ouverte) return;
  ouverte = true;
  let sel = 0;
  let visibles = actions;
  const champ = h('input', { type: 'text', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'palette-liste', 'aria-autocomplete': 'list', placeholder: 'Que cherchez-vous ? Un dossier, une page, une action…', autocomplete: 'off', 'aria-label': 'Palette de commandes' });
  const liste = h('ul', { id: 'palette-liste', role: 'listbox', 'aria-label': 'Résultats' });
  const dlg = h('dialog', { class: 'palette', 'aria-label': 'Palette de commandes' }, champ, liste,
    h('footer', null, h('span', null, h('kbd', null, '↑'), ' ', h('kbd', null, '↓'), ' choisir'), h('span', null, h('kbd', null, '↵'), ' ouvrir'), h('span', null, h('kbd', null, 'Échap'), ' fermer')));

  function dessiner() {
    vider(liste);
    let groupe = null;
    visibles.forEach((a, i) => {
      if (a.groupe !== groupe) { groupe = a.groupe; liste.append(h('li', { class: 'groupe-p', role: 'presentation' }, groupe)); }
      const li = h('li', { role: 'option', id: 'pal-' + i, 'aria-selected': String(i === sel) }, a.icone ? icone(a.icone, { taille: 18 }) : null, h('span', null, a.libelle), a.aide ? h('small', null, a.aide) : null);
      li.addEventListener('click', () => lancer(a));
      li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; marquer(); } });
      liste.append(li);
    });
    if (!visibles.length) liste.append(h('li', { role: 'presentation', style: { cursor: 'default' } }, 'Aucun résultat.'));
    champ.setAttribute('aria-activedescendant', visibles.length ? 'pal-' + sel : '');
  }
  function marquer() {
    liste.querySelectorAll('[role=option]').forEach((li, i) => li.setAttribute('aria-selected', String(i === sel)));
    const li = liste.querySelector('[aria-selected=true]');
    if (li) li.scrollIntoView({ block: 'nearest' });
    champ.setAttribute('aria-activedescendant', visibles.length ? 'pal-' + sel : '');
  }
  function fermer() { ouverte = false; if (dlg.open) dlg.close(); dlg.remove(); }
  function lancer(a) { fermer(); setTimeout(() => a.executer(), 0); }

  champ.addEventListener('input', () => {
    const n = normaliser(champ.value);
    visibles = n ? actions.filter((a) => normaliser(a.libelle + ' ' + (a.aide || '') + ' ' + a.groupe).includes(n)) : actions;
    sel = 0;
    dessiner();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = visibles.length ? (sel + 1) % visibles.length : 0; marquer(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = visibles.length ? (sel - 1 + visibles.length) % visibles.length : 0; marquer(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (visibles[sel]) lancer(visibles[sel]); }
  });
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); fermer(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) fermer(); });
  document.body.append(dlg);
  dessiner();
  dlg.showModal();
  champ.focus();
}

export function ouvrirAideRaccourcis() {
  const dlg = h('dialog', { 'aria-labelledby': 'aide-rac-t' },
    h('h2', { id: 'aide-rac-t' }, 'Raccourcis ', h('em', null, 'clavier')),
    h('p', { class: 'petit' }, 'Ils fonctionnent partout, sauf dans un champ de saisie.'),
    h('dl', { class: 'raccourcis-liste' }, RACCOURCIS.flatMap(([touches, desc]) => [
      h('dt', null, desc),
      h('dd', null, touches.map((x, i) => [i ? ' ' : '', /^puis/.test(x) ? h('span', { class: 'petit' }, 'puis ') : null, h('kbd', null, x.replace(/^puis /, ''))]))
    ])),
    h('div', { class: 'rangee fin', style: { marginTop: '1.2rem' } }, h('button', { class: 'btn', type: 'button', onclick: () => fermer() }, t('commun.fermer', 'Fermer'))));
  function fermer() { dlg.close(); dlg.remove(); }
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); fermer(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) fermer(); });
  document.body.append(dlg);
  dlg.showModal();
}
