// Aperçu de la page mémorial, tel que la famille la verra.
import { h, titre } from '../ui.js';

export async function rendre(el, ctx, route) {
  let m;
  if (ctx.donnees.demo) m = await ctx.donnees.memorial(route.id);
  else {
    const r = await fetch('/api/pro/memorial?j=' + encodeURIComponent(route.id));
    m = await r.json();
    if (!r.ok) m = { indisponible: true };
  }
  el.append(h('p', { class: 'surtitre' }, 'Aperçu de la page mémorial'));
  if (m.indisponible) {
    el.append(h('div', { class: 'alerte' }, 'La page n’est pas encore publiée, ou la chanson n’est pas livrée. Publiez-la depuis le studio QR.'));
    return;
  }
  if (ctx.donnees.demo && !m.publie) el.append(h('div', { class: 'alerte', style: { marginBottom: '1rem' } }, 'Cette page n’est pas encore publiée : seule votre équipe la voit ici.'));
  el.append(h('article', { class: 'memorial carte filet-or pile', 'aria-label': 'Page mémorial' },
    h('p', { class: 'surtitre' }, 'En mémoire de'),
    h('h1', { class: 'prenom' }, h('em', null, m.prenom || ''), m.nom ? ' ' + m.nom : ''),
    m.dates && m.dates.length ? h('p', { class: 'dates' }, m.dates.join(' — ')) : null,
    m.titre ? h('h2', null, m.titre) : null,
    m.audio ? h('audio', { controls: true, preload: 'metadata', src: m.audio }) : h('p', { class: 'petit' }, 'La chanson apparaîtra ici une fois validée par la maison.'),
    m.mot_famille ? h('blockquote', { class: 'discret', style: { fontFamily: 'var(--ff-d)', fontSize: '1.2rem' } }, m.mot_famille) : null,
    m.paroles ? h('div', { class: 'paroles', style: { textAlign: 'left' } }, m.paroles) : null,
    h('p', { class: 'petit' }, m.signature || 'Composé par Melodia Funèbre'),
    m.cobranding ? h('div', { class: 'cobrand' }, m.cobranding.logo ? h('img', { src: m.cobranding.logo, alt: '' }) : null, 'Avec ', m.cobranding.nom) : null));
  el.append(h('p', { class: 'petit', style: { textAlign: 'center', marginTop: '1rem' } }, 'Cette page n’est jamais indexée par les moteurs de recherche.'));
  void titre;
}
