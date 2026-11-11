// Équipe : membres, rôles, invitations par lien.
import { h, titre, toast, confirmer, vider } from '../ui.js';
import { date } from '../i18n.js';

const ROLES = [['owner', 'Propriétaire'], ['admin', 'Administrateur'], ['conseiller', 'Conseiller'], ['lecture', 'Lecture seule']];
const lib = (r) => (ROLES.find((x) => x[0] === r) || [r, r])[1];

export async function rendre(el, ctx) {
  el.append(h('p', { class: 'surtitre' }, 'Agence'), titre(1, 'L’', 'équipe'),
    h('p', { class: 'discret' }, 'Le conseiller crée et suit les dossiers ; l’administrateur gère aussi l’équipe et la facturation ; la lecture seule consulte.'));
  const zone = h('div', { class: 'pile' });
  el.append(zone);

  async function dessiner() {
    const e = await ctx.donnees.equipe(ctx.org);
    vider(zone);
    zone.append(h('table', { class: 'tableau' },
      h('thead', null, h('tr', null, h('th', null, 'Membre'), h('th', null, 'Rôle'), h('th', null, ''))),
      h('tbody', null, e.membres.filter((m) => m.statut === 'actif').map((m) => {
        const sel = h('select', { 'aria-label': 'Rôle de ' + m.email }, ROLES.map(([v, l]) => h('option', { value: v, selected: v === m.role }, l)));
        sel.addEventListener('change', async () => {
          try { await ctx.donnees.changerRole(ctx.org, m.id, sel.value); toast('Rôle mis à jour.'); } catch (err) { toast(err.message, { erreur: true }); sel.value = m.role; }
        });
        return h('tr', null, h('td', null, m.email), h('td', null, sel), h('td', null, h('button', { class: 'btn btn-petit btn-danger', type: 'button', onclick: async () => {
          if (!await confirmer({ titre: 'Retirer ' + m.email + ' ?', texte: 'Cette personne n’aura plus accès aux dossiers de l’agence.', bouton: 'Retirer', danger: true })) return;
          try { await ctx.donnees.retirerMembre(ctx.org, m.id); dessiner(); } catch (err) { toast(err.message, { erreur: true }); }
        } }, 'Retirer')));
      }))));
    if (e.invitations.length) {
      zone.append(h('h2', null, 'Invitations en attente'), h('ul', null, e.invitations.map((i) => h('li', null, `${i.email} · ${lib(i.role)} · jusqu’au ${date(i.expire_le)}`))));
    }
  }

  const email = h('input', { type: 'email', placeholder: 'adresse@agence.fr', 'aria-label': 'Adresse e-mail à inviter', autocomplete: 'off' });
  const role = h('select', { 'aria-label': 'Rôle' }, ROLES.filter((r) => r[0] !== 'owner').map(([v, l]) => h('option', { value: v, selected: v === 'conseiller' }, l)));
  const lien = h('div', { class: 'alerte info', hidden: true });
  el.append(h('section', { class: 'carte pile', style: { marginTop: '1.4rem' } },
    h('h2', null, 'Inviter un ', h('em', null, 'collègue')),
    h('div', { class: 'rangee' }, email, role, h('button', { class: 'btn btn-or', type: 'button', onclick: async () => {
      try {
        const r = await ctx.donnees.inviter(ctx.org, email.value.trim(), role.value);
        lien.hidden = false;
        vider(lien).append('Lien d’invitation, valable ' + r.expire_jours + ' jours : ', h('span', { class: 'mono', style: { wordBreak: 'break-all' } }, r.lien), ' ',
          h('button', { class: 'btn btn-petit', type: 'button', onclick: () => navigator.clipboard.writeText(r.lien).then(() => toast('Lien copié.')) }, 'Copier'));
        email.value = '';
        dessiner();
      } catch (e) { toast(e.message, { erreur: true }); }
    } }, 'Créer le lien')), lien,
    h('p', { class: 'petit' }, 'La personne se connecte avec cette adresse, puis ouvre le lien. Il ne sert qu’une fois.')));
  await dessiner();
}
