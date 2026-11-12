// ═══════════════════════════════════════════════════════════════
// Melodia Funèbre Pro — coquille de la console (/pro)
//
// Routeur par fragment (#/journee, #/dossiers/<id>…), barre latérale sur
// grand écran, onglets en bas sur mobile, raccourcis N (nouveau dossier)
// et / (recherche), vues chargées à la demande pour garder le premier
// chargement léger.
// ═══════════════════════════════════════════════════════════════

import { h, vider, toast, annoncer, squelettes, media } from './ui.js';
import { chargerChaines, t } from './i18n.js';
import { choisirDonnees, quitterDemo } from './donnees.js';
import { noyau } from './noyau.js';

const VUES = {
  journee: () => import('./vues/journee.js'),
  dossiers: () => import('./vues/dossiers.js'),
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
  ['travail', 'journee', '◈'], ['travail', 'dossiers', '♪'], ['travail', 'nouveau', '✚'], ['travail', 'qr', '▦'],
  ['travail', 'bibliotheque', '♫'], ['agence', 'facturation', '€'], ['agence', 'equipe', '◎'],
  ['agence', 'parametres', '⚙'], ['agence', 'aide', '?'], ['maison', 'admin', '✦']
];
const ONGLETS = ['journee', 'dossiers', 'nouveau', 'qr', 'aide'];

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

function dessinerNav() {
  const lat = vider(document.getElementById('nav-laterale'));
  const bas = vider(document.getElementById('nav-bas'));
  const maison = ctx.me && ctx.me.utilisateur.maison && !ctx.donnees.demo;
  let groupe = '';
  for (const [g, cle, ico] of NAV) {
    if (g === 'maison' && !maison && !ctx.donnees.demo) continue;
    if (g !== groupe) { lat.append(h('div', { class: 'nav-groupe' }, t('nav.groupe_' + g))); groupe = g; }
    lat.append(h('a', { class: 'nav-lien', href: '#/' + cle, 'data-cle': cle },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, ico), t('nav.' + cle),
      cle === 'dossiers' ? h('span', { class: 'pastille', id: 'pastille-dossiers', hidden: true }) : null));
  }
  for (const cle of ONGLETS) {
    const ico = (NAV.find((n) => n[1] === cle) || [])[2];
    bas.append(h('a', { href: '#/' + cle, 'data-cle': cle }, h('span', { class: 'ico', 'aria-hidden': 'true' }, ico), t('nav.' + cle)));
  }
}

function marquerNav(onglet) {
  for (const a of document.querySelectorAll('[data-cle]')) {
    if (a.dataset.cle === onglet) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

let rendu = 0;
async function rendre() {
  const r = routeCourante();
  const n = ++rendu;
  const vue = document.getElementById('vue');
  if (typeof ctx.nettoyage === 'function') { try { ctx.nettoyage(); } catch (e) {} ctx.nettoyage = null; }
  marquerNav(r.onglet);
  vue.setAttribute('aria-busy', 'true');
  vider(vue).append(squelettes(3));
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
ctx.rafraichir = pastilles;

function raccourcis() {
  document.addEventListener('keydown', (e) => {
    const cible = e.target;
    const saisie = cible && (cible.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName));
    if (saisie || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); aller('nouveau'); }
    else if (e.key === '/') { e.preventDefault(); document.getElementById('recherche').focus(); }
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

async function demarrer() {
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
    choix.addEventListener('change', () => { ctx.org = choix.value; localStorage.setItem('melodia_pro_org', ctx.org); rendre(); pastilles(); });
  }
  const qui = document.getElementById('qui');
  qui.textContent = (ctx.me.utilisateur.email || '') + (orgs[0] ? ' · ' + (orgs.find((o) => o.id === ctx.org) || orgs[0]).nom : '');
  if (ctx.donnees.demo) {
    const b = document.getElementById('bandeau');
    b.hidden = false;
    b.append(t('connexion.demo_bandeau'), ' ', h('button', { class: 'btn btn-petit', type: 'button', onclick: () => { quitterDemo(); location.href = '/pro'; } }, 'Quitter la démonstration'));
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
  serviceWorker();
}

demarrer();
