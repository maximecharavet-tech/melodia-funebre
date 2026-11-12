// Bibliothèque : les chansons livrées, à réécouter, présenter ou faire écouter.
import { h, titre, vide } from '../ui.js';
import { t, date } from '../i18n.js';
import { lecteurOnde } from '../composants.js';
import { normaliser } from '../logique.js';

export async function rendre(el, ctx) {
  el.append(h('p', { class: 'surtitre' }, 'Chansons livrées'), titre(1, 'La', 'bibliothèque'));
  const { dossiers } = ctx.org ? await ctx.donnees.dossiers(ctx.org) : { dossiers: [] };
  const livres = dossiers.filter((d) => d.status === 'livre');
  if (!livres.length) {
    el.append(vide({ image: '/assets/img/pro/empty-bibliotheque.webp', texte: t('vide.bibliotheque'),
      action: h('a', { class: 'btn', href: '/demos', target: '_blank', rel: 'noopener' }, 'Écouter des compositions de la maison') }));
    return;
  }
  const rech = h('input', { type: 'search', placeholder: 'Un prénom, un titre…', 'aria-label': 'Chercher dans la bibliothèque' });
  const grille = h('div', { class: 'grille', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' } });
  const vide0 = h('p', { class: 'discret', hidden: true }, 'Aucune chanson ne correspond.');
  el.append(h('div', { class: 'filtres' }, h('div', { class: 'recherche-liste' }, rech)), grille, vide0);
  const cartes = [];
  for (const d of livres) {
    const carte = h('article', { class: 'carte filet-or pile' }, h('h3', null, d.titre || ('Pour ' + d.prenom)),
      h('p', { class: 'petit' }, (d.prenom || '') + ' · livré le ' + date(d.updated_at)));
    cartes.push({ d, carte });
    grille.append(carte);
    ctx.donnees.dossier(d.id).then((f) => {
      const p = f.pistes[0];
      if (p && p.url) carte.append(lecteurOnde(p.url, { differe: true, duree: p.duree_s, titre: d.titre || d.prenom }));
      carte.append(h('div', { class: 'rangee' }, h('a', { class: 'btn btn-petit', href: '#/dossiers/' + d.id }, 'Fiche'), h('a', { class: 'btn btn-petit', href: '#/qr/' + d.id }, 'QR')));
    }).catch(() => {});
  }
  rech.addEventListener('input', () => {
    const n = normaliser(rech.value);
    let vus = 0;
    for (const { d, carte } of cartes) { const ok = !n || normaliser(d.prenom + ' ' + d.titre).includes(n); carte.hidden = !ok; if (ok) vus++; }
    vide0.hidden = vus > 0;
  });
}
