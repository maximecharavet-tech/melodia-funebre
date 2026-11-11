// Dossiers : liste ou tableau de suivi (kanban), filtres, recherche.
import { h, titre, badgeStatut, vide, vider } from '../ui.js';
import { t, date, relatif } from '../i18n.js';

const COLONNES = [
  ['A préparer', ['brouillon', 'complet', 'en_attente_paiement']],
  ['En composition', ['paye', 'essai_accorde', 'paroles_en_cours', 'musique_en_cours']],
  ['À relire', ['paroles_a_valider', 'revision_demandee']],
  ['Écoute maison', ['controle_maison', 'echec']],
  ['Livrés', ['livre']]
];

export async function rendre(el, ctx, route) {
  const { dossiers } = ctx.org ? await ctx.donnees.dossiers(ctx.org) : { dossiers: [] };
  let mode = localStorage.getItem('melodia_pro_vue_dossiers') || 'liste';
  let q = route.params.q || '';
  let statut = '';

  el.append(h('p', { class: 'surtitre' }, dossiers.length + ' dossier(s)'), titre(1, 'Les', 'dossiers'));
  if (!dossiers.length) {
    el.append(vide({ image: '/assets/img/pro/empty-dossiers.webp', texte: t('vide.dossiers'), action: h('a', { class: 'btn btn-or', href: '#/nouveau' }, 'Nouveau dossier') }));
    return;
  }

  const recherche = h('input', { type: 'search', value: q, placeholder: 'Prénom, référence…', 'aria-label': 'Filtrer les dossiers' });
  const choixStatut = h('select', { 'aria-label': 'Filtrer par état' }, h('option', { value: '' }, 'Tous les états'),
    [...new Set(dossiers.map((d) => d.status))].map((s) => h('option', { value: s }, t('statut.' + s))));
  const bascule = h('div', { class: 'rangee', role: 'group', 'aria-label': 'Affichage' },
    h('button', { class: 'btn btn-petit', type: 'button', 'aria-pressed': String(mode === 'liste'), onclick: () => { mode = 'liste'; maj(); } }, 'Liste'),
    h('button', { class: 'btn btn-petit', type: 'button', 'aria-pressed': String(mode === 'kanban'), onclick: () => { mode = 'kanban'; maj(); } }, 'Suivi'));
  const zone = h('div');
  el.append(h('div', { class: 'filtres' }, recherche, choixStatut, bascule), zone);
  recherche.addEventListener('input', () => { q = recherche.value; maj(); });
  choixStatut.addEventListener('change', () => { statut = choixStatut.value; maj(); });

  function filtrer() {
    const n = q.trim().toLowerCase();
    return dossiers.filter((d) => (!statut || d.status === statut) &&
      (!n || (d.prenom || '').toLowerCase().includes(n) || (d.reference || '').toLowerCase().includes(n) || (d.titre || '').toLowerCase().includes(n)));
  }

  function maj() {
    localStorage.setItem('melodia_pro_vue_dossiers', mode);
    for (const b of bascule.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.textContent === (mode === 'liste' ? 'Liste' : 'Suivi')));
    const liste = filtrer();
    vider(zone);
    if (!liste.length) { zone.append(h('p', { class: 'discret' }, 'Aucun dossier ne correspond.')); return; }
    if (mode === 'kanban') {
      zone.append(h('div', { class: 'kanban' }, COLONNES.map(([nom, etats]) => {
        const l = liste.filter((d) => etats.includes(d.status));
        return h('section', { class: 'colonne', 'aria-label': nom },
          h('h3', null, h('span', null, nom), h('span', null, l.length)),
          l.map((d) => h('a', { class: 'carte carte-lien', href: '#/dossiers/' + d.id },
            h('strong', null, d.prenom || '—'), h('div', { class: 'petit' }, d.reference),
            h('div', { style: { marginTop: '.4rem' } }, badgeStatut(d.status, t('statut.' + d.status))))));
      })));
    } else {
      zone.append(h('table', { class: 'tableau' },
        h('thead', null, h('tr', null, h('th', null, 'Pour'), h('th', null, 'État'), h('th', { class: 'cache-mobile' }, 'Cérémonie'), h('th', { class: 'cache-mobile' }, 'Référence'), h('th', null, 'Modifié'))),
        h('tbody', null, liste.map((d) => h('tr', null,
          h('td', null, h('a', { href: '#/dossiers/' + d.id }, d.prenom || 'Sans prénom')),
          h('td', null, badgeStatut(d.status, t('statut.' + d.status))),
          h('td', { class: 'cache-mobile' }, date(d.ceremonie_le)),
          h('td', { class: 'cache-mobile mono' }, d.reference),
          h('td', { class: 'petit' }, relatif(d.updated_at)))))));
    }
  }
  maj();
}
