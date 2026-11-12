// ═══════════════════════════════════════════════════════════════
// Melodia Funèbre Pro — coquille de la console (/pro)
//
// Routeur par fragment (#/journee, #/dossiers/<id>…), barre latérale sur
// grand écran, onglets en bas sur mobile, palette de commandes (Ctrl/⌘ K),
// raccourcis clavier (N, /, G puis lettre, T, ?), centre de notifications,
// thème clair/sombre, visite guidée ; vues chargées à la demande pour garder
// le premier chargement léger.
// ═══════════════════════════════════════════════════════════════

import { h, vider, toast, annoncer, squelettes, media } from './ui.js';
import { chargerChaines, t } from './i18n.js';
import { choisirDonnees, quitterDemo } from './donnees.js';
import { noyau } from './noyau.js';
import { icone } from './icones.js';
import { appliquerTheme, basculerTheme, suivreSysteme, themeEffectif, lireMarque } from './theme.js';
import { pauseTout } from './composants.js';
import { ouvrirPalette, ouvrirAideRaccourcis } from './palette.js';
import { creerCentre } from './notifications.js';
import { lancerVisite } from './visite.js';
import { dossiersEnCsv } from './logique.js';

const VUES = {
  journee: () => import('./vues/journee.js'),
  dossiers: () => import('./vues/dossiers.js'),
  statistiques: () => import('./vues/statistiques.js'),
  fiche: () => import('./vues/fiche.js'),
  questionnaire: () => import('./vues/questionnaire.js'),
  qr: () => import('./vues/qr.js'),
  bibliotheque: () => import('./vues/bibliotheque.js'),
  facturation: () => import('./vues/facturation.js'),
  equipe: () => import('./vues/equipe.js'),
  parametres: () => import('./vues/parametres.js'),
  aide: () => import('./vues/aide.js'),
  admin: () => import('./vues/admin.js'),
  memorial: () => import('./vues/memorial.js'),
  invitation: () => import('./vues/invitation.js')
};

const NAV = [
  ['travail', 'journee', 'journee'], ['travail', 'dossiers', 'dossiers'], ['travail', 'nouveau', 'nouveau'], ['travail', 'statistiques', 'statistiques'],
  ['travail', 'qr', 'qr'], ['travail', 'bibliotheque', 'bibliotheque'], ['agence', 'facturation', 'facturation'], ['agence', 'equipe', 'equipe'],
  ['agence', 'parametres', 'parametres'], ['agence', 'aide', 'aide'], ['maison', 'admin', 'admin']
];
const ONGLETS = ['journee', 'dossiers', 'nouveau', 'statistiques'];

const ctx = { donnees: null, me: null, org: null, nettoyage: null };
window.MelodiaPro = ctx; // inspection et tests de bout en bout

function routeCourante() {
  const brut = location.hash.replace(/^#\/?/, '') || 'journee';
  const [chemin, qs] = brut.split('?');
  const parts = chemin.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  if (parts[0] === 'dossiers' && parts[1]) return { vue: parts[2] === 'questionnaire' ? 'questionnaire' : 'fiche', id: parts[1], params, onglet: 'dossiers' };
  if (parts[0] === 'nouveau') return { vue: 'questionnaire', id: null, params, onglet: 'nouveau' };
  if (parts[0] === 'qr') return { vue: 'qr', id: parts[1] || null, params, onglet: 'qr' };
  if (parts[0] === 'memorial') return { vue: 'memorial', id: parts[1], params, onglet: 'qr' };
  if (parts[0] === 'invitation') return { vue: 'invitation', id: parts[1], params, onglet: 'equipe' };
  return { vue: VUES[parts[0]] ? parts[0] : 'journee', id: null, params, onglet: parts[0] || 'journee' };
}

export function aller(route) { location.hash = '#/' + route.replace(/^#?\/?/, ''); }
ctx.aller = aller;

function entreesVisibles() {
  const maison = ctx.me && ctx.me.utilisateur.maison && !ctx.donnees.demo;
  return NAV.filter(([g]) => g !== 'maison' || maison || ctx.donnees.demo);
}

function dessinerNav() {
  const lat = vider(document.getElementById('nav-laterale'));
  const bas = vider(document.getElementById('nav-bas'));
  let groupe = '';
  for (const [g, cle, ico] of entreesVisibles()) {
    if (g !== groupe) { lat.append(h('div', { class: 'nav-groupe' }, t('nav.groupe_' + g))); groupe = g; }
    lat.append(h('a', { class: 'nav-lien', href: '#/' + cle, 'data-cle': cle },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, icone(ico)), t('nav.' + cle, cle),
      cle === 'dossiers' ? h('span', { class: 'pastille', id: 'pastille-dossiers', hidden: true }) : null));
  }
  for (const cle of ONGLETS) {
    const ico = (NAV.find((n) => n[1] === cle) || [])[2];
    bas.append(h('a', { href: '#/' + cle, 'data-cle': cle }, h('span', { class: 'ico', 'aria-hidden': 'true' }, icone(ico, { taille: 22 })), cle === 'nouveau' ? 'Nouveau' : t('nav.' + cle, cle)));
  }
  bas.append(h('button', { type: 'button', class: 'onglet-plus', 'aria-haspopup': 'dialog', onclick: ouvrirPlus }, h('span', { class: 'ico', 'aria-hidden': 'true' }, icone('parametres', { taille: 22 })), 'Plus'));
}

/** Menu « Plus » du mobile : toutes les sections qui n'ont pas d'onglet. */
function ouvrirPlus() {
  const dlg = h('dialog', { 'aria-labelledby': 'plus-t' }, h('h2', { id: 'plus-t' }, 'Toute la ', h('em', null, 'console')),
    h('div', { class: 'pile' }, entreesVisibles().filter(([, cle]) => !ONGLETS.includes(cle)).map(([, cle, ico]) =>
      h('a', { class: 'nav-lien', href: '#/' + cle, onclick: () => { dlg.close(); dlg.remove(); } }, h('span', { class: 'ico', 'aria-hidden': 'true' }, icone(ico)), t('nav.' + cle, cle)))),
    h('div', { class: 'rangee', style: { marginTop: '1rem', justifyContent: 'space-between' } },
      h('button', { class: 'btn', type: 'button', onclick: () => { basculerTheme(); majBoutonTheme(); } }, 'Thème clair / sombre'),
      h('button', { class: 'btn', type: 'button', onclick: () => { dlg.close(); dlg.remove(); } }, t('commun.fermer', 'Fermer'))));
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); dlg.close(); dlg.remove(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) { dlg.close(); dlg.remove(); } });
  document.body.append(dlg);
  dlg.showModal();
}

function marquerNav(onglet) {
  for (const a of document.querySelectorAll('[data-cle]')) {
    if (a.dataset.cle === onglet) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  const plus = document.querySelector('.onglet-plus');
  if (plus) { if (!ONGLETS.includes(onglet)) plus.setAttribute('aria-current', 'page'); else plus.removeAttribute('aria-current'); }
}

const FORMES = { journee: 'tuiles', statistiques: 'tuiles', dossiers: 'tableau', bibliotheque: 'tableau' };
let rendu = 0;
async function rendre() {
  const r = routeCourante();
  const n = ++rendu;
  const vue = document.getElementById('vue');
  if (typeof ctx.nettoyage === 'function') { try { ctx.nettoyage(); } catch (e) {} ctx.nettoyage = null; }
  marquerNav(r.onglet);
  pauseTout();
  ctx.presenter = null;
  vue.setAttribute('aria-busy', 'true');
  vider(vue).append(squelettes(3, FORMES[r.vue]));
  try {
    const mod = await VUES[r.vue]();
    if (n !== rendu) return;
    const cible = vider(vue);
    ctx.nettoyage = await mod.rendre(cible, ctx, r);
    entree(cible);
    const titre = cible.querySelector('h1');
    document.title = (titre ? titre.textContent + ' — ' : '') + 'Melodia Funèbre Pro';
    if (titre) annoncer(titre.textContent);
  } catch (e) {
    console.error(e);
    vider(vue).append(h('div', { class: 'alerte erreur' }, e.message || t('commun.erreur')));
  } finally {
    vue.setAttribute('aria-busy', 'false');
    if (r.vue !== 'questionnaire') vue.focus({ preventScroll: true });
  }
}

/* Entrée des vues (Motion, MIT) : les premiers blocs montent de quelques
   pixels, l'un après l'autre, en moins d'une demi-seconde. C'est un outil
   de travail : le geste doit se sentir, jamais se faire attendre. Rien
   pour qui a demandé à réduire les animations, ni si la bibliothèque
   n'est pas chargée — la vue est alors simplement là. */
function entree(cible) {
  const M = window.MelodiaMotion;
  if (!M || !M.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const blocs = Array.from(cible.children).slice(0, 8);
  if (!blocs.length) return;
  try {
    M.animate(blocs, { opacity: [0, 1], transform: ['translateY(6px)', 'translateY(0)'] },
      { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: M.stagger(0.05) });
  } catch (e) { /* la vue reste visible */ }
}

async function pastilles() {
  try {
    if (!ctx.org) return;
    const { dossiers } = await ctx.donnees.dossiers(ctx.org);
    const a = dossiers.filter((d) => ['paroles_a_valider', 'complet'].includes(d.status)).length;
    const p = document.getElementById('pastille-dossiers');
    if (p) { p.hidden = !a; p.textContent = a; p.setAttribute('aria-label', a + ' à traiter'); }
  } catch (e) { /* silencieux */ }
}
const centreMaj = () => { if (ctx.notifications) ctx.notifications.rafraichir(); };
ctx.rafraichir = () => { pastilles(); centreMaj(); };

const ALLERS = { j: 'journee', d: 'dossiers', s: 'statistiques', b: 'bibliotheque', q: 'qr' };
let attenteG = 0;

function majBoutonTheme() {
  const b = document.getElementById('btn-theme');
  if (!b) return;
  const clair = themeEffectif() === 'light';
  b.replaceChildren(icone(clair ? 'lune' : 'soleil'));
  b.setAttribute('aria-label', clair ? 'Passer au thème sombre' : 'Passer au thème clair');
}

/** Actions de la palette de commandes : pages, gestes, puis les dossiers de l'agence. */
async function actionsPalette() {
  const pages = entreesVisibles().filter(([, cle]) => cle !== 'nouveau').map(([, cle, ico]) => ({
    id: 'page-' + cle, groupe: 'Aller à', icone: ico, libelle: t('nav.' + cle, cle), executer: () => aller(cle)
  }));
  const gestes = [
    { id: 'nouveau', groupe: 'Actions', icone: 'nouveau', libelle: 'Nouveau dossier', aide: 'N', executer: () => aller('nouveau') },
    { id: 'theme', groupe: 'Actions', icone: themeEffectif() === 'light' ? 'lune' : 'soleil', libelle: 'Basculer le thème clair / sombre', aide: 'T', executer: () => { basculerTheme(); majBoutonTheme(); } },
    { id: 'csv', groupe: 'Actions', icone: 'telecharger', libelle: 'Exporter tous les dossiers (CSV)', executer: async () => {
      const { telecharger } = await import('./ui.js');
      const { dossiers } = await ctx.donnees.dossiers(ctx.org);
      telecharger(new Blob([dossiersEnCsv(dossiers, (x) => t('statut.' + x, x))], { type: 'text/csv;charset=utf-8' }), 'melodia-dossiers-' + new Date().toISOString().slice(0, 10) + '.csv');
      toast('Export des dossiers prêt.');
    } },
    { id: 'raccourcis', groupe: 'Actions', icone: 'clavier', libelle: 'Voir les raccourcis clavier', aide: '?', executer: ouvrirAideRaccourcis },
    { id: 'visite', groupe: 'Actions', icone: 'aide', libelle: 'Relancer la visite guidée', executer: () => lancerVisite({ force: true }) }
  ];
  if (ctx.presenter) gestes.unshift({ id: 'presenter', groupe: 'Actions', icone: 'presenter', libelle: 'Mode présentation famille', aide: 'P', executer: ctx.presenter });
  let dossiers = [];
  try { dossiers = ctx.org ? (await ctx.donnees.dossiers(ctx.org)).dossiers : []; } catch (e) { dossiers = []; }
  const lesDossiers = dossiers.slice(0, 60).map((d) => ({
    id: 'dossier-' + d.id, groupe: 'Dossiers', icone: 'dossiers', libelle: (d.prenom || 'Sans prénom') + (d.titre ? ' — ' + d.titre : ''),
    aide: d.reference, executer: () => aller('dossiers/' + d.id)
  }));
  return gestes.concat(pages, lesDossiers);
}
ctx.ouvrirPalette = async () => ouvrirPalette(await actionsPalette());

function raccourcis() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/⌘ K : partout, même dans un champ
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (ctx.donnees) ctx.ouvrirPalette(); return; }
    const cible = e.target;
    const saisie = cible && (cible.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName));
    if (saisie || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open], .presentation')) return;
    if (!ctx.donnees) return;
    const k = e.key.toLowerCase();
    if (attenteG && Date.now() - attenteG < 1200) {
      attenteG = 0;
      if (ALLERS[k]) { e.preventDefault(); aller(ALLERS[k]); return; }
    }
    if (k === 'g') { attenteG = Date.now(); return; }
    if (k === 'n') { e.preventDefault(); aller('nouveau'); }
    else if (e.key === '/') { e.preventDefault(); document.getElementById('recherche').focus(); }
    else if (k === 't') { e.preventDefault(); basculerTheme(); majBoutonTheme(); }
    else if (e.key === '?') { e.preventDefault(); ouvrirAideRaccourcis(); }
    else if (k === 'p' && ctx.presenter) { e.preventDefault(); ctx.presenter(); }
  });
  const rech = document.getElementById('recherche');
  rech.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') aller('dossiers?q=' + encodeURIComponent(rech.value.trim()));
    if (e.key === 'Escape') { rech.value = ''; rech.blur(); }
  });
}

function accueilSansSession() {
  const vue = vider(document.getElementById('vue'));
  vue.setAttribute('aria-busy', 'false');
  document.querySelector('.laterale').hidden = true;
  vue.append(media('hero-loop', 'Melodia Funèbre Pro'));
  vue.append(h('section', { class: 'carte filet-or', style: { maxWidth: '640px', margin: '2rem auto 8vh' } },
    h('p', { class: 'surtitre' }, 'Melodia Funèbre Pro'),
    h('h1', null, 'Bienvenue dans votre ', h('em', null, 'console')),
    h('p', { class: 'discret' }, t('connexion.texte')),
    h('p', { class: 'discret' }, t('commun.accroche')),
    h('div', { class: 'rangee', style: { marginTop: '1.4rem' } },
      h('a', { class: 'btn btn-or', href: '/compte?retour=' + encodeURIComponent('/pro') }, t('connexion.bouton')),
      h('a', { class: 'btn', href: '/pro?demo=1' }, t('connexion.demo')))));
}

function serviceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

function enteteIcones() {
  document.getElementById('ico-recherche').append(icone('recherche', { taille: 18 }));
  document.getElementById('ico-nouveau').append(icone('nouveau', { taille: 18 }));
  const pal = document.getElementById('btn-palette');
  pal.append(icone('clavier'));
  pal.addEventListener('click', () => ctx.ouvrirPalette());
  document.getElementById('btn-theme').addEventListener('click', () => { basculerTheme(); majBoutonTheme(); });
  majBoutonTheme();
}

/** Pied de la barre latérale : l'agence (monogramme ou nom d'affichage choisi sur cet appareil). */
function piedAgence(orgs) {
  const org = orgs.find((o) => o.id === ctx.org) || orgs[0];
  const marque = lireMarque();
  const nom = (marque.nom && marque.nom.trim()) || (org && org.nom) || '';
  const qui = vider(document.getElementById('qui'));
  qui.className = 'agence-pied';
  qui.append(h('span', { class: 'monogramme', 'aria-hidden': 'true' }, (nom.trim()[0] || '·').toUpperCase()),
    h('span', null, h('strong', { style: { display: 'block', color: 'var(--paper)', fontWeight: 400 } }, nom || 'Votre agence'), h('span', { class: 'petit' }, ctx.me.utilisateur.email || '')));
}
ctx.majPiedAgence = () => piedAgence(ctx.me.organisations || []);

async function demarrer() {
  appliquerTheme();
  suivreSysteme();
  await chargerChaines();
  raccourcis();
  ctx.donnees = choisirDonnees();
  if (!ctx.donnees) return accueilSansSession();
  try { await noyau(); } catch (e) { toast('Le module de calcul n’a pas pu être chargé. Rechargez la page.', { erreur: true }); }
  try {
    ctx.me = await ctx.donnees.me();
  } catch (e) {
    if (e.status === 401) { localStorage.removeItem('melodia_session'); return accueilSansSession(); }
    toast(e.message || t('commun.erreur'), { erreur: true });
    ctx.me = { utilisateur: {}, organisations: [], offres: [], services: {} };
  }
  const orgs = ctx.me.organisations || [];
  const memo = localStorage.getItem('melodia_pro_org');
  ctx.org = (orgs.find((o) => o.id === memo) || orgs[0] || {}).id || null;
  const choix = document.getElementById('choix-org');
  if (orgs.length > 1) {
    choix.hidden = false;
    for (const o of orgs) choix.append(h('option', { value: o.id, selected: o.id === ctx.org }, o.nom));
    choix.addEventListener('change', () => { ctx.org = choix.value; localStorage.setItem('melodia_pro_org', ctx.org); piedAgence(orgs); rendre(); pastilles(); centreMaj(); });
  }
  piedAgence(orgs);
  enteteIcones();
  const centre = creerCentre(ctx);
  document.getElementById('zone-notifs').append(centre.racine);
  ctx.notifications = centre;
  if (ctx.donnees.demo) {
    const b = document.getElementById('bandeau');
    b.hidden = false;
    b.append(t('connexion.demo_bandeau'), ' ',
      h('button', { class: 'btn btn-petit', type: 'button', onclick: async () => { await ctx.donnees.reinitialiser(true); toast('Compte vierge : plus aucun dossier d’exemple.'); location.hash = '#/journee'; location.reload(); } }, 'Repartir de zéro'),
      h('button', { class: 'btn btn-petit', type: 'button', onclick: async () => { await ctx.donnees.reinitialiser(false); location.hash = '#/journee'; location.reload(); } }, 'Remettre les exemples'),
      h('button', { class: 'btn btn-petit', type: 'button', onclick: () => { quitterDemo(); location.href = '/pro'; } }, 'Quitter la démonstration'));
  }
  dessinerNav();
  window.addEventListener('hashchange', rendre);
  window.addEventListener('online', async () => {
    const n = await ctx.donnees.viderFile();
    if (n) toast(n + ' enregistrement(s) envoyé(s) au retour du réseau.');
  });
  window.addEventListener('offline', () => toast(t('commun.hors_ligne')));
  await rendre();
  pastilles();
  centreMaj();
  serviceWorker();
  setTimeout(() => lancerVisite(), 900);
}

demarrer();
