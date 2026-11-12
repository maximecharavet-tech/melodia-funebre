// Admin maison : file de génération, comptes à valider, écoute avant livraison,
// coûts du jour et plafond, réglages TBD, tarifs, codes promo (miroir), journal.
import { h, titre, toast, vider } from '../ui.js';
import { prix, dateHeure } from '../i18n.js';

export async function rendre(el, ctx) {
  el.append(h('p', { class: 'surtitre' }, 'Maison'), titre(1, 'Administration de la', 'maison'));
  const zone = h('div', { class: 'pile' });
  el.append(zone);

  async function dessiner() {
    const a = await ctx.donnees.admin();
    vider(zone);
    const c = a.couts_du_jour;
    zone.append(h('div', { class: 'grille' },
      h('div', { class: 'carte filet-or' }, h('p', { class: 'surtitre' }, 'Coûts du jour'), h('div', { class: 'chiffre' }, prix(c.total_cents)),
        h('p', { class: 'petit' }, c.nombre + ' génération(s) · plafond ' + (c.plafond_cents == null ? 'non saisi : génération coupée' : prix(c.plafond_cents)))),
      h('div', { class: 'carte' }, h('p', { class: 'surtitre' }, 'À écouter'), h('div', { class: 'chiffre' }, a.controle.length)),
      h('div', { class: 'carte' }, h('p', { class: 'surtitre' }, 'File'), h('div', { class: 'chiffre' }, a.file.length)),
      h('div', { class: 'carte' }, h('p', { class: 'surtitre' }, 'Comptes à valider'), h('div', { class: 'chiffre' }, a.a_valider.length))));

    if (a.controle.length) zone.append(h('section', { class: 'carte' }, h('h2', null, 'Écoute avant livraison'),
      h('ul', null, a.controle.map((d) => h('li', null, h('a', { href: '#/dossiers/' + d.id }, d.reference), d.mode === 'essai' ? ' · essai' : '')))));

    if (a.file.length) zone.append(h('section', { class: 'carte' }, h('h2', null, 'File de génération'),
      h('table', { class: 'tableau' }, h('thead', null, h('tr', null, ['Dossier', 'Travail', 'État', 'Essais', 'Détail', ''].map((x) => h('th', null, x)))),
        h('tbody', null, a.file.map((j) => h('tr', null, h('td', null, h('a', { href: '#/dossiers/' + j.dossier_id }, String(j.dossier_id).slice(0, 8))), h('td', null, j.type), h('td', null, j.etat),
          h('td', null, j.tentatives), h('td', { class: 'petit' }, j.erreur || ''),
          h('td', null, ['echec', 'bloque'].includes(j.etat) ? h('button', { class: 'btn btn-petit', type: 'button', onclick: () => act({ action: 'relancer', dossier_id: j.dossier_id, type: j.type }) }, 'Relancer') : null))))))));

    if (a.a_valider.length) zone.append(h('section', { class: 'carte' }, h('h2', null, 'Comptes à valider'),
      a.a_valider.map((o) => h('div', { class: 'rangee', style: { justifyContent: 'space-between', borderBottom: '1px solid var(--line-soft)', padding: '.6rem 0' } },
        h('span', null, h('strong', null, o.nom), ' · ', h('span', { class: 'mono' }, o.siret), ' · ', o.email),
        h('span', { class: 'rangee' }, h('button', { class: 'btn btn-petit btn-or', type: 'button', onclick: () => act({ action: 'valider_org', org_id: o.id, decision: 'valide' }) }, 'Valider'),
          h('button', { class: 'btn btn-petit btn-danger', type: 'button', onclick: () => act({ action: 'valider_org', org_id: o.id, decision: 'refuse' }) }, 'Refuser'))))));

    zone.append(h('section', { class: 'carte pile' }, h('h2', null, 'Réglages à saisir'),
      h('p', { class: 'petit' }, 'Une valeur vide reste « à fixer ». Tant que le plafond du jour est vide, aucune génération ne part.'),
      a.reglages.map((r) => {
        const i = h('input', { type: 'text', value: r.valeur == null ? '' : r.valeur, placeholder: 'à fixer', 'aria-label': r.cle });
        return h('div', { class: 'rangee' }, h('label', { style: { flex: '1 1 260px' } }, h('span', { class: 'mono' }, r.cle), h('br'), h('span', { class: 'petit' }, r.description)), i,
          h('button', { class: 'btn btn-petit', type: 'button', onclick: () => act({ action: 'reglage', cle: r.cle, valeur: i.value.trim() }) }, 'Enregistrer'));
      })));

    zone.append(h('section', { class: 'carte pile' }, h('h2', null, 'Tarifs agence'),
      h('p', { class: 'petit' }, 'En centimes. Vide : tarif non fixé, le paiement est alors refusé avec un message clair.'),
      // Repère v3 : le site public promet 60 % à l'agence ; le tarif agence
      // cohérent vaut donc 40 % du prix public. Simple indication, rien n'est saisi.
      h('p', { class: 'petit' }, 'Cohérence avec le site public (« l’agence garde 60 % ») : tarif agence = 40 % du prix public, indiqué en repère sous chaque offre. Décision de la maison.'),
      a.offres.map((o) => {
        const i = h('input', { type: 'number', min: 0, step: 1, value: o.prix_cents == null ? '' : o.prix_cents, placeholder: 'à fixer', 'aria-label': 'Tarif ' + o.nom });
        const repere = o.prix_public_cents == null ? null : Math.round(o.prix_public_cents * 0.4);
        return h('div', { class: 'rangee' }, h('span', { style: { flex: '1 1 200px' } }, o.nom, ' · ', h('span', { class: 'petit' }, prix(o.prix_cents)),
          repere == null ? null : h('span', { class: 'petit discret' }, ' · repère 40 % : ' + repere + ' centimes')), i,
          h('button', { class: 'btn btn-petit', type: 'button', onclick: () => act({ action: 'offre', id: o.id, price_cents: i.value === '' ? null : i.value }) }, 'Enregistrer'));
      })));

    zone.append(h('section', { class: 'carte pile' }, h('h2', null, 'Codes promo'),
      h('p', { class: 'petit' }, 'Les codes se créent dans le tableau de bord de paiement ; ils sont recopiés ici pour mémoire.'),
      h('button', { class: 'btn btn-petit', type: 'button', onclick: () => act({ action: 'promos_sync' }) }, 'Synchroniser'),
      (a.promos || []).length ? h('ul', null, a.promos.map((p) => h('li', null, h('span', { class: 'mono' }, p.code), ' · ', p.actif ? 'actif' : 'inactif',
        p.pourcent_bp != null ? ' · ' + p.pourcent_bp / 100 + ' %' : '', p.montant_cents != null ? ' · ' + prix(p.montant_cents) : ''))) : null));

    zone.append(h('section', { class: 'carte' }, h('h2', null, 'Journal'),
      h('ol', { class: 'frise' }, a.journal.slice(0, 40).map((j) => h('li', null, h('span', { class: 'mono' }, j.action), ' · ', j.qui || '', ' ', h('span', { class: 'petit' }, dateHeure(j.quand)))))));
  }

  async function act(corps) {
    try { await ctx.donnees.adminAction(corps); toast('Fait.'); await dessiner(); } catch (e) { toast(e.message, { erreur: true }); }
  }
  await dessiner();
}
