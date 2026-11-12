// ═══════════════════════════════════════════════════════════════
// Composants animés de la console : compteurs, anneau de progression,
// lecteur à forme d'onde, entrée des barres de graphique.
//
// Tout respecte prefers-reduced-motion (lu à chaque appel, donc aussi s'il
// change en cours de session) : sans animation, la valeur finale est posée
// tout de suite.
//
// Le lecteur est écrit pour ce dépôt. Principe repris de wavesurfer.js
// (BSD-3-Clause, https://wavesurfer.js.org) : décoder le fichier, réduire
// les échantillons à quelques centaines de barres, dessiner la progression
// sur ces barres et chercher dans le morceau en cliquant. Aucun code copié.
// ═══════════════════════════════════════════════════════════════

import { h } from './ui.js';
import { icone } from './icones.js';
import { barresDepuis, formaterDuree } from './logique.js';

export function calme() {
  return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
}

const decelerer = (x) => 1 - Math.pow(1 - x, 3);

/** Nombre qui monte jusqu'à sa valeur. Les lecteurs d'écran lisent la valeur finale, pas la montée. */
export function compteur(valeur, { suffixe = '', duree = 700, decimales = 0 } = {}) {
  const fmt = (v) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(v) + suffixe;
  if (calme() || !isFinite(valeur) || valeur === 0) return h('span', null, fmt(valeur));
  const visible = h('span', { 'aria-hidden': 'true' }, fmt(0));
  const el = h('span', null, visible, h('span', { class: 'sr' }, fmt(valeur)));
  const t0 = performance.now();
  const pas = (t) => {
    if (!el.isConnected && t - t0 > 60) { visible.textContent = fmt(valeur); return; }
    const x = Math.min(1, (t - t0) / duree);
    visible.textContent = fmt(valeur * decelerer(x));
    if (x < 1) requestAnimationFrame(pas); else visible.textContent = fmt(valeur);
  };
  requestAnimationFrame(pas);
  return el;
}

/** Anneau de progression : pourcentage 0‑100 au centre. */
export function anneau(pct, libelle) {
  const NS = 'http://www.w3.org/2000/svg';
  const R = 30, C = 2 * Math.PI * R;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 72 72');
  svg.setAttribute('aria-hidden', 'true');
  const cercle = (cls) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', '36'); c.setAttribute('cy', '36'); c.setAttribute('r', String(R));
    c.setAttribute('fill', 'none'); c.setAttribute('stroke-width', '5'); c.setAttribute('stroke-linecap', 'round');
    c.setAttribute('class', cls);
    return c;
  };
  const fond = cercle('fond');
  const val = cercle('val');
  val.setAttribute('stroke-dasharray', String(C));
  val.setAttribute('stroke-dashoffset', String(calme() ? C * (1 - pct / 100) : C));
  svg.append(fond, val);
  if (!calme()) requestAnimationFrame(() => requestAnimationFrame(() => val.setAttribute('stroke-dashoffset', String(C * (1 - pct / 100)))));
  return h('div', { class: 'anneau', role: 'img', 'aria-label': libelle || (pct + ' %') }, svg, h('b', null, Math.round(pct) + '%'));
}

/** Fait monter des barres de graphique depuis la base, l'une après l'autre. */
export function entreeBarres(conteneur, selecteur = '.barre, .repartition span') {
  const M = window.MelodiaMotion;
  const barres = Array.from(conteneur.querySelectorAll(selecteur));
  if (!M || !M.animate || calme() || !barres.length) return;
  const horizontal = (b) => b.parentElement && b.parentElement.classList.contains('repartition');
  try {
    barres.forEach((b, i) => {
      M.animate(b, horizontal(b) ? { transform: ['scaleX(0)', 'scaleX(1)'] } : { transform: ['scaleY(0)', 'scaleY(1)'] },
        { duration: 0.7, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] });
    });
  } catch (e) { /* le graphique reste visible */ }
}

// ─── Lecteur à forme d'onde ─────────────────────────────────────────

let enCours = null; // un seul lecteur à la fois

/** Met en pause tous les lecteurs (changement de vue). */
export function pauseTout() { if (enCours) { enCours.pause(); enCours = null; } }

const NB_BARRES = 240;

async function decoder(url) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error('AudioContext absent');
  const r = await fetch(url, { credentials: 'omit' });
  if (!r.ok) throw new Error('lecture impossible');
  const buf = await r.arrayBuffer();
  const ctx = new AC();
  try {
    const audio = await new Promise((ok, ko) => ctx.decodeAudioData(buf, ok, ko));
    return { barres: barresDepuis(audio.getChannelData(0), NB_BARRES), duree: audio.duration };
  } finally { if (ctx.close) ctx.close().catch(() => {}); }
}

/**
 * Lecteur audio avec forme d'onde.
 * options : { grand, differe, titre, duree } ; rend un élément avec .pause().
 * Si le fichier ne peut pas être décodé (réseau, format), le lecteur
 * garde une simple ligne de progression : aucune onde n'est jamais inventée.
 */
export function lecteurOnde(url, options = {}) {
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.src = url;
  let barres = null;      // null tant que non décodé
  let echec = false;
  let duree = options.duree || 0;
  let survol = null;
  let apparition = calme() ? 1 : 0;
  let glisse = false;

  const canvas = h('canvas', { 'aria-hidden': 'true' });
  const jouer = h('button', { class: 'jouer', type: 'button', 'aria-label': 'Écouter' }, icone('lecture', { taille: 24 }));
  const courant = h('span', null, '0:00');
  const total = h('span', null, formaterDuree(duree) || '–:––');
  const note = h('p', { class: 'note', hidden: true });
  const onde = h('div', { class: 'onde', role: 'slider', tabindex: '0', 'aria-label': (options.titre ? options.titre + ' : position' : 'Position dans la chanson'), 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(duree) || 0), 'aria-valuenow': '0', 'aria-valuetext': '0:00' }, canvas);
  const racine = h('div', { class: 'lecteur' + (options.grand ? ' grand' : '') }, jouer, onde, h('div', { class: 'temps' }, courant, total), note);

  const couleur = (nom, repli) => getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || repli;

  function dessiner() {
    const dpr = window.devicePixelRatio || 1;
    const w = onde.clientWidth, hh = onde.clientHeight;
    if (!w || !hh) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hh * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(hh * dpr); }
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, hh);
    const p = duree ? audio.currentTime / duree : 0;
    const fait = couleur('--accent', '#e3c977');
    const reste = couleur('--ash', '#8e8878');
    const largeur = 3, ecart = 2;
    const n = Math.max(8, Math.floor((w + ecart) / (largeur + ecart)));
    const milieu = hh / 2;
    if (echec || !barres) {
      // Ligne de progression : état d'attente du décodage, ou repli sans onde.
      g.globalAlpha = .35; g.fillStyle = reste; g.fillRect(0, milieu - 1.5, w, 3);
      g.globalAlpha = 1; g.fillStyle = fait; g.fillRect(0, milieu - 1.5, w * p, 3);
      if (!echec) {
        // le décodage est en cours : une onde discrète balaie la ligne
        if (!calme()) { const x = ((performance.now() / 900) % 1) * w; const gr = g.createLinearGradient(x - 60, 0, x + 60, 0); gr.addColorStop(0, 'transparent'); gr.addColorStop(.5, fait); gr.addColorStop(1, 'transparent'); g.globalAlpha = .6; g.fillStyle = gr; g.fillRect(x - 60, milieu - 1.5, 120, 3); g.globalAlpha = 1; }
      }
      return;
    }
    const maintenant = performance.now();
    for (let i = 0; i < n; i++) {
      const v = barres[Math.min(barres.length - 1, Math.floor((i / n) * barres.length))];
      const delai = Math.min(1, Math.max(0, apparition * 1.6 - (i / n) * 0.6));
      let amp = Math.max(0.06, v) * delai;
      const x = i * (largeur + ecart);
      const pos = (i + .5) / n;
      const lu = pos <= p;
      if (!calme() && !audio.paused && Math.abs(pos - p) < 0.012) amp *= 1 + 0.12 * Math.sin(maintenant / 90);
      const hauteur = Math.max(3, amp * (hh - 6));
      g.globalAlpha = lu ? 1 : (survol != null && pos <= survol ? .75 : .4);
      g.fillStyle = lu ? fait : reste;
      const y = milieu - hauteur / 2;
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, largeur, hauteur, 1.5); else g.rect(x, y, largeur, hauteur);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  let raf = 0;
  function boucle() {
    if (apparition < 1) apparition = Math.min(1, apparition + 0.035);
    dessiner();
    const anime = !audio.paused || apparition < 1 || (!barres && !echec && !calme());
    raf = anime && racine.isConnected ? requestAnimationFrame(boucle) : 0;
  }
  const demarrerBoucle = () => { if (!raf) raf = requestAnimationFrame(boucle); };

  function majTemps() {
    courant.textContent = formaterDuree(audio.currentTime) || '0:00';
    onde.setAttribute('aria-valuenow', String(Math.round(audio.currentTime)));
    onde.setAttribute('aria-valuetext', `${formaterDuree(audio.currentTime) || '0:00'} sur ${formaterDuree(duree) || '–:––'}`);
    if (audio.paused) dessiner();
  }

  function chercher(fraction) {
    if (!duree) return;
    audio.currentTime = Math.min(duree, Math.max(0, fraction * duree));
    majTemps();
  }
  const fraction = (e) => { const r = onde.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };

  function basculer() {
    if (audio.paused) {
      if (enCours && enCours !== racine) enCours.pause();
      enCours = racine;
      audio.play().catch(() => { note.hidden = false; note.textContent = 'La lecture n’a pas pu démarrer.'; });
    } else audio.pause();
  }
  racine.pause = () => { audio.pause(); };

  jouer.addEventListener('click', basculer);
  onde.addEventListener('pointerdown', (e) => { glisse = true; onde.setPointerCapture(e.pointerId); chercher(fraction(e)); });
  onde.addEventListener('pointermove', (e) => { survol = fraction(e); if (glisse) chercher(survol); else if (audio.paused) dessiner(); });
  onde.addEventListener('pointerup', () => { glisse = false; });
  onde.addEventListener('pointerleave', () => { survol = null; if (audio.paused) dessiner(); });
  onde.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); basculer(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); audio.currentTime = Math.min(duree || Infinity, audio.currentTime + 5); majTemps(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); majTemps(); }
    else if (e.key === 'Home') { e.preventDefault(); chercher(0); }
    else if (e.key === 'End') { e.preventDefault(); chercher(1); }
  });
  audio.addEventListener('play', () => { jouer.replaceChildren(icone('pause', { taille: 24 })); jouer.setAttribute('aria-label', 'Mettre en pause'); demarrerBoucle(); });
  const arret = () => { jouer.replaceChildren(icone('lecture', { taille: 24 })); jouer.setAttribute('aria-label', 'Écouter'); majTemps(); };
  audio.addEventListener('pause', arret);
  audio.addEventListener('ended', () => { audio.currentTime = 0; arret(); });
  audio.addEventListener('timeupdate', () => { if (!audio.paused) { courant.textContent = formaterDuree(audio.currentTime); onde.setAttribute('aria-valuenow', String(Math.round(audio.currentTime))); onde.setAttribute('aria-valuetext', `${formaterDuree(audio.currentTime)} sur ${formaterDuree(duree) || '–:––'}`); } });
  audio.addEventListener('loadedmetadata', () => {
    if (isFinite(audio.duration) && audio.duration > 0) { duree = audio.duration; total.textContent = formaterDuree(duree); onde.setAttribute('aria-valuemax', String(Math.round(duree))); }
  });
  audio.addEventListener('error', () => { echec = true; note.hidden = false; note.textContent = 'Ce fichier audio n’a pas pu être chargé.'; dessiner(); });
  window.addEventListener('melodia-theme', () => dessiner());
  if (window.ResizeObserver) new ResizeObserver(() => dessiner()).observe(onde);

  let decodeLance = false;
  async function lancerDecodage() {
    if (decodeLance) return;
    decodeLance = true;
    demarrerBoucle();
    try {
      const r = await decoder(url);
      barres = r.barres;
      if (r.duree && isFinite(r.duree)) { duree = r.duree; total.textContent = formaterDuree(duree); onde.setAttribute('aria-valuemax', String(Math.round(duree))); }
      apparition = calme() ? 1 : 0;
    } catch (e) {
      echec = true;
      note.hidden = false;
      note.textContent = 'La forme d’onde n’est pas disponible pour ce fichier ; la lecture fonctionne normalement.';
    }
    demarrerBoucle();
    dessiner();
  }
  if (options.differe && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); lancerDecodage(); } }, { rootMargin: '120px' });
    queueMicrotask(() => io.observe(racine));
  } else queueMicrotask(lancerDecodage);
  queueMicrotask(dessiner);
  return racine;
}
