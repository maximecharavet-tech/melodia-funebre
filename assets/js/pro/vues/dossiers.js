// Dossiers : tableau de bord de suivi.
// Recherche (sans accents), filtres rapides avec compteurs, filtre par état et par
// date de cérémonie, tri, sélection multiple avec export CSV, duplication comme
// modèle, vue « Suivi » en colonnes. L'organisation d'une table de données
// (colonnes triables, sélection, barre d'actions groupées) s'inspire des
// exemples de tableaux de shadcn/ui et de TanStack Table (MIT) — réécrite ici.
import { h, titre, badgeStatut, vide, vider } from '../ui.js';
import { t, date, relatif } from '../i18n.js';
import { icone } from '../icones.js';
import { compterGroupes, filtrerDossiers, GROUPES } from '../logique.js';
import { dupliquerCommeModele, exporterCsv } from '../actions-dossier.js';

const COLONNES = [
  ['À préparer', ['brouillon', 'complet', 'en_attente_paiement']],
  ['En composition', ['paye', 'essai_accorde', 'paroles_en_cours', 'musique_en_cours']],
  ['À relire', ['paroles_a_valider', 'revision_demandee']],
  ['Écoute maison', ['controle_maison', 'echec']],
  ['Livrés', ['livre']]
];

const TRIS = [['recent', 'Modifiés récemment'], ['ceremonie', 'Cérémonie la plus proche'], ['prenom', 'Prénom (A → Z)'], ['etat', 'État']];

/** « dans 30 h », « il y a 3 j » : repère relatif pour la date de cérémonie. */
function repereCeremonie(v) {
  if (!v) return '—';
  return date(v) + ' · ' + relatif(v);
}

export async function rendre(el, ctx, route) {
  const { dossiers } = ctx.org ? await ctx.donnees.dossiers(ctx.org) : { dossiers: [] };
  const p = route.params || {};
  const etat = {
    mode: localStorage.getItem('melodia_pro_vue_dossiers') || 'liste',
    q: p.q || '', groupe: GROUPES.some((g) => g.id === p.groupe) ? p.groupe : 'tous', sous48h: p.groupe === '48h',
    statut: '', du: '', au: '', tri: 'recent', sens: 'asc'
  };
  const choisis = new Set();

  el.append(h('div', { class: 'tete-page' },
    h('div', null, h('p', { class: 'surtitre' }, dossiers.length + ' dossier' + (dossiers.length > 1 ? 's' : '')), titre(1, 'Les', 'dossiers')),
    h('div', { class: 'rangee' },
      dossiers.length ? h('button', { class: 'btn', type: 'button', onclick: () => exporterCsv(filtrer(), null) }, icone('telecharger', { taille: 18 }), 'Exporter (CSV)') : null,
      h('a', { class: 'btn btn-or', href: '#/nouveau' }, icone('nouveau', { taille: 18 }), 'Nouveau dossier'))));

  if (!dossiers.length) {
    el.append(vide({ image: '/assets/img/pro/empty-dossiers.webp', texte: t('vide.dossiers'), action: h('a', { class: 'btn btn-or', href: '#/nouveau' }, 'Nouveau dossier') }));
    return;
  }

  const comptes = compterGroupes(dossiers);
  const puces = h('div', { class: 'puces', role: 'group', 'aria-label': 'Filtres rapides' });
  const recherche = h('input', { type: 'search', value: etat.q, placeholder: 'Prénom, référence, titre…', 'aria-label': 'Filtrer les dossiers' });
  const choixStatut = h('select', { 'aria-label': 'Filtrer par état' }, h('option', { value: '' }, 'Tous les états'),
    [...new Set(dossiers.map((d) => d.status))].map((s) => h('option', { value: s }, t('statut.' + s))));
  const choixTri = h('select', { 'aria-label': 'Trier par' }, TRIS.map(([v, l]) => h('option', { value: v }, l)));
  const du = h('input', { type: 'date', 'aria-label': 'Cérémonie à partir du' });
  const au = h('input', { type: 'date', 'aria-label': 'Cérémonie jusqu’au' });
  const raz = h('button', { class: 'btn btn-petit', type: 'button', hidden: true, onclick: reinitialiser }, 'Effacer les filtres');
  const bascule = h('div', { class: 'rangee', role: 'group', 'aria-label': 'Affichage' },
    h('button', { class: 'btn btn-petit', type: 'button', 'data-mode': 'liste', onclick: () => { etat.mode = 'liste'; maj(); } }, icone('tableau', { taille: 16 }), 'Liste'),
    h('button', { class: 'btn btn-petit', type: 'button', 'data-mode': 'kanban', onclick: () => { etat.mode = 'kanban'; maj(); } }, icone('colonnes', { taille: 16 }), 'Suivi'));
  const zone = h('div');
  const barre = h('div', { class: 'barre-groupe', hidden: true, role: 'region', 'aria-label': 'Actions sur la sélection' });
  const annonce = h('p', { class: 'sr', role: 'status', 'aria-live': 'polite' });

  el.append(puces,
    h('div', { class: 'filtres' }, h('div', { class: 'recherche-liste' }, recherche), choixStatut, choixTri, bascule, raz),
    h('details', { style: { marginBottom: '.6rem' } }, h('summary', { style: { cursor: 'pointer', minHeight: '36px', display: 'flex', alignItems: 'center', gap: '.4rem' } }, icone('filtre', { taille: 16 }), 'Filtrer par date de cérémonie'),
      h('div', { class: 'filtres' }, h('label', { class: 'rangee petit' }, 'Du', du), h('label', { class: 'rangee petit' }, 'Au', au))),
    annonce, zone, barre);

  recherche.addEventListener('input', () => { etat.q = recherche.value; maj(); });
  choixStatut.addEventListener('change', () => { etat.statut = choixStatut.value; maj(); });
  choixTri.addEventListener('change', () => { etat.tri = choixTri.value; etat.sens = 'asc'; maj(); });
  du.addEventListener('change', () => { etat.du = du.value; maj(); });
  au.addEventListener('change', () => { etat.au = au.value; maj(); });

  function reinitialiser() {
    Object.assign(etat, { q: '', groupe: 'tous', sous48h: false, statut: '', du: '', au: '', tri: 'recent', sens: 'asc' });
    recherche.value = ''; choixStatut.value = ''; choixTri.value = 'recent'; du.value = ''; au.value = '';
    maj();
  }

  const filtrer = () => filtrerDossiers(dossiers, etat);

  function dessinerPuces() {
    vider(puces);
    const liste = GROUPES.map((g) => ({ id: g.id, libelle: g.libelle, n: comptes[g.id] }));
    for (const g of liste) {
      if (g.id !== 'tous' && !g.n && etat.groupe !== g.id) continue;
      puces.append(h('button', { class: 'puce', type: 'button', 'aria-pressed': String(etat.groupe === g.id && !etat.sous48h), onclick: () => { etat.groupe = g.id; etat.sous48h = false; maj(); } },
        g.libelle, h('span', { class: 'n' }, g.n)));
    }
    if (etat.sous48h) puces.append(h('button', { class: 'puce', type: 'button', 'aria-pressed': 'true', onclick: () => { etat.sous48h = false; maj(); } }, 'Cérémonies sous 48 h ✕'));
  }

  function majBarre() {
    barre.hidden = !choisis.size;
    if (!choisis.size) return;
    vider(barre).append(h('span', null, `${choisis.size} dossier${choisis.size > 1 ? 's' : ''} sélectionné${choisis.size > 1 ? 's' : ''}`),
      h('div', { class: 'rangee' },
        h('button', { class: 'btn btn-petit', type: 'button', onclick: () => exporterCsv(dossiers.filter((d) => choisis.has(d.id)), null) }, icone('telecharger', { taille: 16 }), 'Exporter la sélection (CSV)'),
        h('button', { class: 'btn btn-petit', type: 'button', onclick: () => { choisis.clear(); maj(); } }, 'Tout désélectionner')));
  }

  function enTete(libelle, cle, classe) {
    const actif = etat.tri === cle;
    const th = h('th', { class: classe || '', scope: 'col', 'aria-sort': actif ? (etat.sens === 'desc' ? 'descending' : 'ascending') : null },
      h('button', { type: 'button', onclick: () => {
        if (etat.tri === cle) etat.sens = etat.sens === 'asc' ? 'desc' : 'asc'; else { etat.tri = cle; etat.sens = 'asc'; }
        choixTri.value = etat.tri; maj();
      } }, libelle, actif ? (etat.sens === 'desc' ? ' ↓' : ' ↑') : ''));
    return th;
  }

  function maj() {
    localStorage.setItem('melodia_pro_vue_dossiers', etat.mode);
    for (const b of bascule.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.mode === etat.mode));
    dessinerPuces();
    const liste = filtrer();
    const filtre = etat.q || etat.statut || etat.du || etat.au || etat.sous48h || etat.groupe !== 'tous';
    raz.hidden = !filtre;
    annonce.textContent = `${liste.length} dossier${liste.length > 1 ? 's' : ''} affiché${liste.length > 1 ? 's' : ''}`;
    vider(zone);
    majBarre();
    if (!liste.length) {
      zone.append(h('div', { class: 'vide' }, h('p', { class: 'discret' }, 'Aucun dossier ne correspond à ces filtres.'), h('button', { class: 'btn', type: 'button', onclick: reinitialiser }, 'Effacer les filtres')));
      return;
    }
    if (etat.mode === 'kanban') {
      zone.append(h('div', { class: 'kanban' }, COLONNES.map(([nom, etats]) => {
        const l = liste.filter((d) => etats.includes(d.status));
        return h('section', { class: 'colonne', 'aria-label': nom },
          h('h3', null, h('span', null, nom), h('span', null, l.length)),
          l.map((d) => h('a', { class: 'carte carte-lien', href: '#/dossiers/' + d.id },
            h('strong', null, d.prenom || '—'), h('div', { class: 'petit' }, d.reference),
            d.ceremonie_le ? h('div', { class: 'petit' }, 'Cérémonie ' + relatif(d.ceremonie_le)) : null,
            h('div', { style: { marginTop: '.4rem' } }, badgeStatut(d.status, t('statut.' + d.status))))));
      })));
      return;
    }
    const toutes = h('input', { type: 'checkbox', 'aria-label': 'Sélectionner tous les dossiers affichés', checked: liste.every((d) => choisis.has(d.id)), onchange: (e) => {
      for (const d of liste) e.target.checked ? choisis.add(d.id) : choisis.delete(d.id);
      maj();
    } });
    toutes.indeterminate = liste.some((d) => choisis.has(d.id)) && !liste.every((d) => choisis.has(d.id));
    zone.append(h('div', { class: 'tableau-cadre' }, h('table', { class: 'tableau' },
      h('caption', { class: 'sr' }, 'Liste des dossiers'),
      h('thead', null, h('tr', null, h('th', { class: 'case', scope: 'col' }, toutes),
        enTete('Pour', 'prenom'), enTete('État', 'etat'), enTete('Cérémonie', 'ceremonie', 'cache-mobile'), h('th', { class: 'cache-mobile', scope: 'col' }, 'Référence'), enTete('Modifié', 'recent'), h('th', { class: 'actions', scope: 'col' }, h('span', { class: 'sr' }, 'Actions')))),
      h('tbody', null, liste.map((d) => h('tr', { class: choisis.has(d.id) ? 'choisie' : '' },
        h('td', { class: 'case' }, h('input', { type: 'checkbox', 'aria-label': 'Sélectionner ' + (d.prenom || d.reference), checked: choisis.has(d.id), onchange: (e) => {
          e.target.checked ? choisis.add(d.id) : choisis.delete(d.id);
          e.target.closest('tr').classList.toggle('choisie', e.target.checked);
          majBarre();
        } })),
        h('td', null, h('a', { href: '#/dossiers/' + d.id }, d.prenom || 'Sans prénom'), d.exemple ? [' ', h('span', { class: 'badge exemple' }, 'Exemple')] : null),
        h('td', null, badgeStatut(d.status, t('statut.' + d.status))),
        h('td', { class: 'cache-mobile petit' }, repereCeremonie(d.ceremonie_le)),
        h('td', { class: 'cache-mobile mono' }, d.reference),
        h('td', { class: 'petit' }, relatif(d.updated_at)),
        h('td', { class: 'actions' }, h('button', { class: 'bouton-icone', type: 'button', title: 'Dupliquer comme modèle', 'aria-label': 'Dupliquer le dossier de ' + (d.prenom || d.reference) + ' comme modèle', onclick: () => dupliquerCommeModele(ctx, d.id) }, icone('dupliquer', { taille: 18 })))))))));
  }
  maj();
}
