// Facturation : offres (tarifs fixés par la maison), portail Stripe, export comptable.
import { h, titre, toast, telecharger } from '../ui.js';
import { prix } from '../i18n.js';

export async function rendre(el, ctx) {
  const s = ctx.me.services || {};
  el.append(h('p', { class: 'surtitre' }, 'Agence'), titre(1, 'La', 'facturation'),
    h('p', { class: 'discret' }, 'Les compositions sont réglées par l’agence. Les tarifs sont fixés par la maison ; tant qu’un tarif n’est pas arrêté, il apparaît comme tel.'));
  el.append(h('div', { class: 'grille', style: { margin: '1.2rem 0' } }, (ctx.me.offres || []).map((o) => h('div', { class: 'carte' },
    h('h3', null, o.nom), h('p', { class: 'petit' }, o.description), h('p', { class: 'mono' }, prix(o.prix_cents))))));
  if (s.mention_tva) el.append(h('p', { class: 'petit' }, s.mention_tva));

  const mois = h('input', { type: 'month', value: new Date().toISOString().slice(0, 7), 'aria-label': 'Mois à exporter' });
  el.append(h('section', { class: 'carte pile', style: { marginTop: '1.2rem' } },
    h('h2', null, 'Factures et moyens de ', h('em', null, 'paiement')),
    h('p', { class: 'petit' }, s.paiement ? 'Vos factures et vos cartes sont gérées sur l’espace sécurisé de notre prestataire de paiement.' : 'Le paiement en ligne n’est pas encore configuré.'),
    h('div', { class: 'rangee' }, h('button', { class: 'btn', type: 'button', disabled: !s.paiement, onclick: async () => {
      try { const r = await ctx.donnees.portail(ctx.org); location.href = r.url; } catch (e) { toast(e.message, { erreur: true }); }
    } }, 'Ouvrir l’espace de facturation'))));
  el.append(h('section', { class: 'carte pile', style: { marginTop: '1.2rem' } },
    h('h2', null, 'Export ', h('em', null, 'comptable')),
    h('p', { class: 'petit' }, 'Un fichier CSV par mois (séparateur point-virgule), lisible dans un tableur.'),
    h('div', { class: 'rangee' }, mois, h('button', { class: 'btn', type: 'button', onclick: async () => {
      try { const b = await ctx.donnees.exporter(mois.value, ctx.org); telecharger(b, `melodia-pro-${mois.value}.csv`); } catch (e) { toast(e.message, { erreur: true }); }
    } }, 'Télécharger le CSV'))));
}
