// Accepter une invitation (le jeton est dans le fragment : il n'atteint jamais les journaux du serveur).
import { h, titre, toast } from '../ui.js';

export async function rendre(el, ctx, route) {
  el.append(h('p', { class: 'surtitre' }, 'Invitation'), titre(1, 'Rejoindre une', 'agence'));
  const b = h('button', { class: 'btn btn-or', type: 'button', onclick: async () => {
    b.disabled = true;
    try {
      const r = await ctx.donnees.accepter(route.id);
      localStorage.setItem('melodia_pro_org', r.org_id);
      toast('Bienvenue dans l’équipe.');
      location.hash = '#/journee';
      location.reload();
    } catch (e) { toast(e.message, { erreur: true }); b.disabled = false; }
  } }, 'Accepter l’invitation');
  el.append(h('p', { class: 'discret' }, 'Vous êtes connecté avec ' + (ctx.me.utilisateur.email || 'votre compte') + '. L’invitation doit avoir été envoyée à cette adresse.'), b);
}
