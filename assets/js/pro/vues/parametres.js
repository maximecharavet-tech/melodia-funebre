// Paramètres : co-branding (logo de l'agence), mode famille par défaut, pack promotionnel.
import { h, titre, toast } from '../ui.js';
import { ACCENTS, choixTheme, definirTheme, lireMarque, ecrireMarque, themeEffectif } from '../theme.js';
import { accentPour } from '../logique.js';
import { icone } from '../icones.js';

const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function rendre(el, ctx) {
  const org = (ctx.me.organisations || []).find((o) => o.id === ctx.org) || {};
  el.append(h('p', { class: 'surtitre' }, 'Agence'), titre(1, 'Les', 'paramètres'));

  const fichier = h('input', { type: 'file', accept: TYPES.join(','), 'aria-describedby': 'logo-aide' });
  const apercu = h('div', { class: 'apercu', style: { minHeight: '140px' } }, h('p', { class: 'petit' }, org.logo ? 'Logo déposé.' : 'Aucun logo pour l’instant.'));
  fichier.addEventListener('change', async () => {
    const f = fichier.files[0];
    if (!f) return;
    if (!TYPES.includes(f.type)) { toast('Formats acceptés : PNG, JPEG ou WebP. Le SVG n’est pas accepté.', { erreur: true }); return; }
    if (f.size > 2 * 1024 * 1024) { toast('Le logo dépasse 2 Mo.', { erreur: true }); return; }
    const b64 = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.readAsDataURL(f); });
    try {
      await ctx.donnees.logo(ctx.org, f.type, b64);
      apercu.replaceChildren(h('img', { src: URL.createObjectURL(f), alt: 'Logo de l’agence', style: { maxHeight: '120px', width: 'auto' } }));
      org.logo = true;
      toast('Logo enregistré.');
    } catch (e) { toast(e.message, { erreur: true }); }
  });

  const cob = h('input', { type: 'checkbox', checked: org.cobranding !== false });
  cob.addEventListener('change', async () => {
    try { await ctx.donnees.reglagesOrg(ctx.org, { cobranding: cob.checked }); org.cobranding = cob.checked; toast('Préférence enregistrée.'); } catch (e) { toast(e.message, { erreur: true }); }
  });
  const fam = h('input', { type: 'checkbox', checked: localStorage.getItem('melodia_pro_famille') === '1' });
  fam.addEventListener('change', () => { localStorage.setItem('melodia_pro_famille', fam.checked ? '1' : '0'); toast('Préférence enregistrée sur cet appareil.'); });

  // ─── Apparence et marque de l'agence (gardées sur cet appareil) ───
  const marque = lireMarque();
  const radios = (nom, options, valeur, surChoix) => h('div', { class: 'choix', role: 'radiogroup', 'aria-label': nom },
    options.map(([v, l]) => h('label', null, h('input', { type: 'radio', name: 'rg-' + nom, value: v, checked: v === valeur, onchange: () => surChoix(v) }), h('span', null, l))));
  const apercuMarque = h('p', { class: 'petit', 'aria-live': 'polite' });
  const nomAffiche = h('input', { type: 'text', maxlength: 60, value: marque.nom || '', placeholder: org.nom || 'Nom de votre agence', id: 'marque-nom' });
  const signature = h('input', { type: 'text', maxlength: 80, value: marque.signature || '', placeholder: 'Ex. : Votre conseiller funéraire', id: 'marque-signature' });
  const sauverTexte = () => { ecrireMarque(Object.assign(lireMarque(), { nom: nomAffiche.value.trim(), signature: signature.value.trim() })); if (ctx.majPiedAgence) ctx.majPiedAgence(); };
  nomAffiche.addEventListener('change', () => { sauverTexte(); toast('Nom d’affichage enregistré sur cet appareil.'); });
  signature.addEventListener('change', () => { sauverTexte(); toast('Signature enregistrée sur cet appareil.'); });
  const clair = () => themeEffectif() === 'light';
  const pastilles = h('div', { class: 'pastilles-couleur', role: 'radiogroup', 'aria-label': 'Couleur d’accent' }, ACCENTS.map((a) => {
    const hex = a.sombre ? (clair() ? a.clair : a.sombre) : null;
    const fond = hex || 'linear-gradient(135deg, #97803c, #e3c977 55%, #c9a84c)';
    return h('label', { title: a.nom, style: { background: fond } },
      h('input', { type: 'radio', name: 'accent', value: a.id, 'aria-label': a.nom, checked: (marque.accent || 'or') === a.id, onchange: () => {
        ecrireMarque(Object.assign(lireMarque(), { accent: a.id }));
        apercuMarque.textContent = a.nom + ' : appliqué à la console sur cet appareil.';
      } }));
  }));

  el.append(
    h('section', { class: 'carte pile' },
      h('h2', null, 'Apparence de la ', h('em', null, 'console')),
      h('div', { class: 'champ' }, h('span', { class: 'etiquette' }, 'Thème'),
        radios('Thème', [['auto', 'Suivre mon appareil'], ['light', 'Clair'], ['dark', 'Sombre']], choixTheme(), (v) => { definirTheme(v); toast('Thème appliqué.'); })),
      h('div', { class: 'champ' }, h('span', { class: 'etiquette' }, 'Couleur d’accent de votre agence'),
        h('p', { class: 'aide', style: { margin: 0 } }, 'Elle colore le focus, la frise d’avancement, les barres de lecture et les filtres. L’or de la maison reste celui des titres et du logo.'),
        pastilles, apercuMarque),
      h('div', { class: 'deux' },
        h('div', { class: 'champ' }, h('label', { for: 'marque-nom' }, 'Nom d’affichage'), nomAffiche, h('span', { class: 'aide' }, 'Remplace le nom dans la barre latérale de cet appareil.')),
        h('div', { class: 'champ' }, h('label', { for: 'marque-signature' }, 'Signature du conseiller'), signature, h('span', { class: 'aide' }, 'Pour vos propres repères sur cet appareil.'))),
      h('p', { class: 'petit' }, icone('alerte', { taille: 14 }), ' Ces réglages restent sur cet appareil. Les partager entre vos collègues et les faire figurer sur les pages mémorial demandera un champ côté serveur : la maison en décide.')),
    h('section', { class: 'carte pile', style: { marginTop: '1.2rem' } },
      h('h2', null, 'Le logo de votre ', h('em', null, 'agence')),
      h('p', { class: 'petit', id: 'logo-aide' }, 'Il peut figurer, discrètement, sur les cartes QR, la page mémorial et le pack promotionnel. PNG, JPEG ou WebP, 2 Mo au plus.'),
      apercu, fichier,
      h('label', { class: 'rangee' }, cob, 'Afficher le nom et le logo de l’agence aux côtés de Melodia Funèbre')),
    h('section', { class: 'carte pile', style: { marginTop: '1.2rem' } },
      h('h2', null, 'Avec les ', h('em', null, 'familles')),
      h('label', { class: 'rangee' }, fam, 'Ouvrir le questionnaire en mode « avec la famille » (gros caractères, ni notes internes ni prix)')),
    h('section', { class: 'carte filet-or pile', style: { marginTop: '1.2rem' } },
      h('h2', null, 'Le pack ', h('em', null, 'promotionnel')),
      h('p', { class: 'discret' }, 'Une affiche, un flyer, une carte à QR et une présentation du service, au nom de Melodia Funèbre et de votre agence, prêts à imprimer.'),
      h('div', { class: 'rangee' }, h('button', { class: 'btn btn-or', type: 'button', id: 'btn-pack', onclick: async (e) => {
        const bouton = e.currentTarget; // currentTarget redevient nul après le premier await
        bouton.disabled = true;
        try {
          const { genererPack } = await import('../pack.js');
          await genererPack(ctx, org);
          toast('Pack prêt.');
        } catch (err) { toast(err.message || 'Création impossible.', { erreur: true }); }
        finally { bouton.disabled = false; }
      } }, 'Télécharger le pack (PDF)'))));
}
