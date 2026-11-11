// Bibliothèque : les chansons livrées, à réécouter ou à faire écouter.
import { h, titre, vide } from '../ui.js';
import { t, date } from '../i18n.js';

export async function rendre(el, ctx) {
  el.append(h('p', { class: 'surtitre' }, 'Chansons livrées'), titre(1, 'La', 'bibliothèque'));
  const { dossiers } = ctx.org ? await ctx.donnees.dossiers(ctx.org) : { dossiers: [] };
  const livres = dossiers.filter((d) => d.status === 'livre');
  if (!livres.length) {
    el.append(vide({ image: '/assets/img/pro/empty-bibliotheque.webp', texte: t('vide.bibliotheque'),
      action: h('a', { class: 'btn', href: '/demos', target: '_blank', rel: 'noopener' }, 'Écouter des compositions de la maison') }));
    return;
  }
  const grille = h('div', { class: 'grille' });
  el.append(grille);
  for (const d of livres) {
    const carte = h('article', { class: 'carte filet-or pile' }, h('h3', null, d.titre || ('Pour ' + d.prenom)), h('p', { class: 'petit' }, (d.prenom || '') + ' · livré le ' + date(d.updated_at)));
    grille.append(carte);
    ctx.donnees.dossier(d.id).then((f) => {
      const p = f.pistes[0];
      if (p && p.url) carte.append(h('audio', { controls: true, preload: 'none', src: p.url }));
      carte.append(h('div', { class: 'rangee' }, h('a', { class: 'btn btn-petit', href: '#/dossiers/' + d.id }, 'Fiche'), h('a', { class: 'btn btn-petit', href: '#/qr/' + d.id }, 'QR')));
    }).catch(() => {});
  }
}
