// Statistiques de l'agence : calculées sur les dossiers réels de l'agence, rien d'estimé.
// Graphiques dessinés en HTML/CSS (aucune bibliothèque) ; chaque graphique a son
// tableau de valeurs en alternative textuelle. Présentation des tuiles et des
// barres inspirée des tableaux de bord de Tremor et de shadcn/ui (MIT), réécrite.
import { h, titre, vide } from '../ui.js';
import { t } from '../i18n.js';
import { compteur, entreeBarres } from '../composants.js';
import { statistiques } from '../logique.js';
import { exporterCsv } from '../actions-dossier.js';
import { icone } from '../icones.js';

const MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });
const libMois = (m) => MOIS.format(new Date(m + '-01T00:00:00Z')).replace('.', '');

function tuile(libelle, valeur, { suffixe = '', legende = '', mise = false, decimales = 0 } = {}) {
  return h('div', { class: 'carte tuile' + (mise ? ' filet-or mise' : '') },
    h('p', { class: 'surtitre' }, libelle),
    h('div', { class: 'valeur' }, valeur == null ? '—' : compteur(valeur, { suffixe, decimales })),
    legende ? h('p', { class: 'legende' }, legende) : null);
}

export async function rendre(el, ctx) {
  const { dossiers } = ctx.org ? await ctx.donnees.dossiers(ctx.org) : { dossiers: [] };
  el.append(h('div', { class: 'tete-page' },
    h('div', null, h('p', { class: 'surtitre' }, 'Votre activité'), titre(1, 'Les', 'statistiques')),
    dossiers.length ? h('button', { class: 'btn', type: 'button', onclick: () => exporterCsv(dossiers, null) }, icone('telecharger', { taille: 18 }), 'Exporter les dossiers (CSV)') : null));

  if (!dossiers.length) {
    el.append(vide({ image: '/assets/img/pro/empty-dossiers.webp', texte: 'Les statistiques apparaissent dès le premier dossier. Elles sont calculées sur vos dossiers, rien d’autre.', action: h('a', { class: 'btn btn-or', href: '#/nouveau' }, 'Nouveau dossier') }));
    return;
  }
  if (ctx.donnees.demo) el.append(h('div', { class: 'alerte info', style: { marginBottom: '1.2rem' } }, 'Démonstration : ces chiffres sont calculés sur les dossiers d’exemple, pas sur une activité réelle.'));

  const st = statistiques(dossiers);
  el.append(h('div', { class: 'tuiles' },
    tuile('Dossiers ouverts', st.total, { mise: true, legende: `${st.actifs} actif${st.actifs > 1 ? 's' : ''}, les autres sont clos` }),
    tuile('Chansons livrées', st.livres, { legende: st.essais ? `dont ${st.essais} composition${st.essais > 1 ? 's' : ''} d’essai (tous dossiers confondus)` : 'depuis l’ouverture' }),
    tuile('Taux de livraison', st.tauxLivraison, { suffixe: ' %', legende: 'part des dossiers lancés qui sont livrés' }),
    tuile('Délai médian', st.delaiMedianJours, { suffixe: ' j', decimales: 1, legende: st.delaiMedianJours == null ? 'visible dès la première livraison' : 'de l’ouverture du dossier à la livraison' }),
    tuile('Cérémonies à venir', st.ceremoniesAVenir, { legende: 'dossiers non clos avec une date future' })));

  // Dossiers par mois
  const max = Math.max(1, ...st.mois.flatMap((m) => [m.ouverts, m.livres]));
  const histo = h('div', { class: 'histo', role: 'img', 'aria-label': 'Dossiers ouverts et livrés sur les six derniers mois ; le tableau ci-dessous donne les valeurs.' },
    st.mois.map((m) => h('div', { class: 'colonne-histo' },
      h('div', { class: 'paire' },
        h('div', { class: 'barre', style: { height: Math.max(m.ouverts ? 3 : 1, (m.ouverts / max) * 100) + '%' }, title: `${m.ouverts} ouvert(s)` }),
        h('div', { class: 'barre b2', style: { height: Math.max(m.livres ? 3 : 1, (m.livres / max) * 100) + '%' }, title: `${m.livres} livré(s)` })))));
  const eti = h('div', { class: 'etiquettes-histo', 'aria-hidden': 'true' }, st.mois.map((m) => h('span', null, libMois(m.mois))));
  el.append(h('section', { class: 'carte', style: { marginTop: '1.2rem' }, 'aria-labelledby': 'stat-mois' },
    h('h2', { id: 'stat-mois' }, 'Dossiers par ', h('em', null, 'mois')),
    histo, eti,
    h('div', { class: 'legende-graph' }, h('span', null, h('i', { style: { background: 'var(--or-deep)' } }), 'Ouverts'), h('span', null, h('i', { style: { background: 'var(--accent)' } }), 'Livrés (selon la date de livraison)')),
    h('details', { style: { marginTop: '.8rem' } }, h('summary', { style: { cursor: 'pointer', minHeight: '36px', display: 'flex', alignItems: 'center' } }, 'Voir les valeurs'),
      h('table', { class: 'tableau' }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Mois'), h('th', { scope: 'col' }, 'Ouverts'), h('th', { scope: 'col' }, 'Livrés'))),
        h('tbody', null, st.mois.map((m) => h('tr', null, h('td', null, libMois(m.mois) + ' ' + m.mois.slice(0, 4)), h('td', null, m.ouverts), h('td', null, m.livres))))))));
  entreeBarres(histo, '.barre');

  // Répartition par état
  const g = st.parGroupe;
  const parts = [
    ['À traiter', g.a_traiter, 'rep-1'], ['En composition', g.en_cours, 'rep-2'], ['Livrés', g.livres, 'rep-3'], ['Brouillons', g.brouillons, 'rep-4'], ['Clos', g.clos, 'rep-5']
  ].filter((x) => x[1]);
  const rep = h('div', { class: 'repartition', role: 'img', 'aria-label': 'Répartition des dossiers par état : ' + parts.map((p) => `${p[0]} ${p[1]}`).join(', ') },
    parts.map(([l, n, c]) => h('span', { class: c, style: { width: (n / st.total) * 100 + '%' }, title: `${l} : ${n}` })));
  el.append(h('section', { class: 'carte', style: { marginTop: '1.2rem' }, 'aria-labelledby': 'stat-etat' },
    h('h2', { id: 'stat-etat' }, 'Répartition par ', h('em', null, 'état')), rep,
    h('div', { class: 'legende-graph' }, parts.map(([l, n, c]) => h('span', null, h('i', { class: c }), `${l} · ${n}`)))));
  entreeBarres(rep, 'span');

  el.append(h('p', { class: 'petit', style: { marginTop: '1rem' } }, 'Les statistiques d’écoute des QR codes (nombre d’ouvertures) se lisent dans le studio QR, dossier par dossier.'));
}
