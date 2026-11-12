// Aide : le déroulé, les raccourcis, les réponses aux questions fréquentes.
import { h, titre, media } from '../ui.js';
import { RACCOURCIS } from '../palette.js';
import { lancerVisite } from '../visite.js';

const FAQ = [
  ['Combien de temps faut-il pour recevoir une chanson ?', 'Les paroles arrivent en quelques minutes. Après votre relecture, la composition prend quelques minutes encore, puis la maison écoute la chanson avant de vous la confier.'],
  ['Qui écrit et compose ?', 'Melodia Funèbre. La maison relit et écoute chaque chanson avant qu’elle ne vous soit livrée.'],
  ['Les artistes que la famille aime seront-ils imités ?', 'Non. Ils nous aident à comprendre l’ambiance ; aucun artiste n’est nommé ni imité dans la composition.'],
  ['Que deviennent les coordonnées écrites par erreur dans le questionnaire ?', 'Elles restent dans le dossier, mais ne sont jamais transmises à la composition : téléphones, e-mails, IBAN et adresses sont retirés automatiquement.'],
  ['La page mémorial est-elle publique ?', 'Elle n’est jamais indexée par les moteurs de recherche. Par défaut, seules les personnes qui ont le lien ou le QR y accèdent ; un code peut être ajouté.'],
  ['Comment fonctionne la composition d’essai ?', 'Chaque agence validée peut demander une composition offerte, d’environ 2 min 30. Elle suit le même chemin qu’une commande, écoute par la maison comprise.'],
  ['Le QR sera-t-il lisible une fois gravé ?', 'Le studio refuse les couleurs trop proches et signale un module trop petit (sous 0,4 mm). Pour une plaque, préférez 6 cm au moins.']
];

export async function rendre(el) {
  el.append(h('p', { class: 'surtitre' }, 'Aide'), titre(1, 'Questions', 'fréquentes'), media('promo-app-pro', 'Présentation de la console Melodia Funèbre Pro'),
    h('section', { class: 'carte pile' }, h('h2', null, 'Le déroulé'),
      h('ol', { class: 'frise' }, ['Le questionnaire, seul ou avec la famille', 'Le règlement par l’agence, ou la composition d’essai', 'La relecture des paroles et de la description musicale', 'La composition, puis l’écoute par la maison', 'La livraison : chanson, QR, page mémorial'].map((x) => h('li', null, x)))),
    h('section', { class: 'pile', style: { marginTop: '1.2rem' } }, FAQ.map(([q, r]) => h('details', { class: 'carte' },
      h('summary', { style: { cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' } }, q), h('p', { class: 'discret' }, r)))),
    h('section', { class: 'carte pile', style: { marginTop: '1.2rem' } }, h('h2', null, 'Raccourcis ', h('em', null, 'clavier')),
      h('dl', { class: 'raccourcis-liste' }, RACCOURCIS.flatMap(([touches, desc]) => [
        h('dt', null, desc), h('dd', null, touches.map((x, i) => [i ? ' ' : '', h('kbd', null, x)]))])),
      h('div', { class: 'rangee' }, h('button', { class: 'btn', type: 'button', onclick: () => { location.hash = '#/journee'; setTimeout(() => lancerVisite({ force: true }), 400); } }, 'Relancer la visite guidée'))),
    h('p', { class: 'petit', style: { marginTop: '1.2rem' } }, 'Une question ? ', h('a', { href: 'mailto:contact@melodia-funebre.fr' }, 'contact@melodia-funebre.fr')));
}
