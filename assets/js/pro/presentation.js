// Mode présentation famille : plein écran, calme, sans aucune information
// interne (ni prix, ni statut, ni notes). Un prénom, une chanson, l'écoute.
import { h } from './ui.js';
import { lecteurOnde, pauseTout } from './composants.js';
import { icone } from './icones.js';

export function ouvrirPresentation({ prenom, dates, titre, paroles, audio, duree, agence, logo, cobranding }) {
  if (document.querySelector('.presentation')) return;
  const precedent = document.activeElement;
  const lecteur = audio ? lecteurOnde(audio, { grand: true, duree, titre: titre || prenom }) : null;
  const zoneParoles = paroles ? h('div', { class: 'paroles-pres', hidden: true, tabindex: '0', 'aria-label': 'Paroles de la chanson' }, paroles) : null;
  const quitter = h('button', { class: 'btn quitter', type: 'button', onclick: () => fermer() }, icone('fermer', { taille: 18 }), 'Quitter la présentation (Échap)');
  const racine = h('div', { class: 'presentation', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Présentation pour la famille' }, quitter,
    h('div', { class: 'contenu' },
      h('p', { class: 'surtitre' }, 'Une chanson pour'),
      h('h1', { class: 'prenom' }, prenom || '…'),
      dates ? h('div', { class: 'dates' }, dates) : null,
      titre ? h('p', { class: 'titre-chanson' }, '« ' + titre + ' »') : null,
      lecteur || h('p', { class: 'discret' }, 'La chanson n’est pas encore disponible.'),
      paroles ? h('button', { class: 'btn btn-petit', type: 'button', 'aria-expanded': 'false', onclick: (e) => { zoneParoles.hidden = !zoneParoles.hidden; e.currentTarget.setAttribute('aria-expanded', String(!zoneParoles.hidden)); e.currentTarget.textContent = zoneParoles.hidden ? 'Afficher les paroles' : 'Masquer les paroles'; } }, 'Afficher les paroles') : null,
      zoneParoles,
      h('div', { class: 'signature' }, cobranding && logo ? h('img', { src: logo, alt: '' }) : null,
        h('span', null, 'Composé par Melodia Funèbre', cobranding && agence ? ' · ' + agence : ''))));
  const touche = (e) => { if (e.key === 'Escape') { e.preventDefault(); fermer(); } };
  function fermer() {
    pauseTout();
    document.removeEventListener('keydown', touche, true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    racine.remove();
    document.body.style.overflow = '';
    if (precedent && precedent.focus) precedent.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', touche, true);
  document.body.append(racine);
  document.body.style.overflow = 'hidden';
  if (racine.requestFullscreen) racine.requestFullscreen().catch(() => {});
  quitter.focus({ preventScroll: true });
  return fermer;
}
