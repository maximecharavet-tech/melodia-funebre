// ═══════════════════════════════════════════════════════════════
// Centre de notifications : cloche de l'en-tête et panneau.
//
// Les notifications sont dérivées de l'état réel des dossiers (jamais
// inventées, voir logique.notificationsDepuis). « Lu » est gardé sur
// l'appareil, par agence. Aucune notification système (push) : il faudrait
// un service d'envoi côté serveur — voir CLAUDE_REPORT_PRO_V4.md.
// ═══════════════════════════════════════════════════════════════

import { h, vider } from './ui.js';
import { icone } from './icones.js';
import { notificationsDepuis } from './logique.js';
import { relatif } from './i18n.js';

const cle = (org) => 'melodia_pro_lues_' + (org || 'x');
function lues(org) { try { return new Set(JSON.parse(localStorage.getItem(cle(org)) || '[]')); } catch (e) { return new Set(); } }
function garder(org, set) { localStorage.setItem(cle(org), JSON.stringify([...set].slice(-300))); }

export function creerCentre(ctx) {
  const compte = h('span', { class: 'compte', hidden: true });
  const bouton = h('button', { class: 'bouton-icone', type: 'button', 'aria-label': 'Notifications', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', id: 'btn-notifs' }, icone('cloche'), compte);
  const racine = h('div', { class: 'relatif' }, bouton);
  let panneau = null;
  let liste = [];

  async function charger() {
    if (!ctx.org) { liste = []; return; }
    try { liste = notificationsDepuis((await ctx.donnees.dossiers(ctx.org)).dossiers); } catch (e) { liste = []; }
  }
  function nonLues() { const l = lues(ctx.org); return liste.filter((n) => !l.has(n.id)); }

  function majCompte() {
    const n = nonLues().length;
    compte.hidden = !n;
    compte.textContent = n > 9 ? '9+' : String(n);
    bouton.setAttribute('aria-label', n ? `Notifications, ${n} non lue${n > 1 ? 's' : ''}` : 'Notifications');
  }

  function fermer() {
    if (!panneau) return;
    panneau.remove(); panneau = null;
    bouton.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', dehors, true);
    document.removeEventListener('keydown', echap, true);
  }
  const dehors = (e) => { if (panneau && !racine.contains(e.target)) fermer(); };
  const echap = (e) => { if (e.key === 'Escape') { fermer(); bouton.focus(); } };

  function dessinerPanneau() {
    const l = lues(ctx.org);
    vider(panneau);
    panneau.append(h('header', null, h('h2', null, 'Notifications'),
      h('button', { class: 'btn btn-petit', type: 'button', disabled: !nonLues().length, onclick: () => { const s = lues(ctx.org); liste.forEach((n) => s.add(n.id)); garder(ctx.org, s); majCompte(); dessinerPanneau(); } }, 'Tout marquer comme lu')));
    if (!liste.length) panneau.append(h('div', { class: 'vide-notif' }, 'Rien à signaler. Les nouveautés de vos dossiers apparaîtront ici.'));
    for (const n of liste) {
      const a = h('a', { class: 'notif' + (l.has(n.id) ? '' : ' non-lue') + (n.genre === 'urgent' ? ' urgent' : ''), href: '#/dossiers/' + n.dossier },
        h('span', { class: 'point', 'aria-hidden': 'true' }), h('span', null, n.texte, h('span', { class: 'quand' }, relatif(n.quand))));
      a.addEventListener('click', () => { const s = lues(ctx.org); s.add(n.id); garder(ctx.org, s); majCompte(); fermer(); });
      panneau.append(a);
    }
  }

  async function ouvrir() {
    await charger();
    majCompte();
    panneau = h('div', { class: 'panneau', role: 'dialog', 'aria-label': 'Notifications' });
    racine.append(panneau);
    dessinerPanneau();
    bouton.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', dehors, true);
    document.addEventListener('keydown', echap, true);
  }
  bouton.addEventListener('click', () => (panneau ? fermer() : ouvrir()));

  return { racine, rafraichir: async () => { await charger(); majCompte(); if (panneau) dessinerPanneau(); }, fermer };
}
