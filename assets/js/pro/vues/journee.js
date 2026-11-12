// Ma journée : ce qui presse, ce qui attend une relecture, ce qui vient d'être livré,
// et — tant que l'agence n'a pas tout fait — la prise en main guidée.
import { h, titre, badgeStatut } from '../ui.js';
import { t, dateHeure, relatif } from '../i18n.js';
import { compteur, anneau } from '../composants.js';
import { icone } from '../icones.js';
import { EN_COURS, A_TRAITER, CLOS, etapesAccueil } from '../logique.js';

function ligne(d) {
  return h('a', { class: 'carte carte-lien', href: '#/dossiers/' + d.id },
    h('div', { class: 'rangee', style: { justifyContent: 'space-between' } },
      h('strong', null, d.prenom || 'Dossier sans prénom'), badgeStatut(d.status, t('statut.' + d.status))),
    h('div', { class: 'petit' }, d.reference, d.ceremonie_le ? ' · cérémonie ' + dateHeure(d.ceremonie_le) : '', ' · modifié ', relatif(d.updated_at)));
}

function bloc(titreBloc, liste, videTexte) {
  return h('section', { class: 'pile', 'aria-label': titreBloc },
    h('h2', null, titreBloc, ' ', h('span', { class: 'petit' }, '(' + liste.length + ')')),
    liste.length ? h('div', { class: 'grille' }, liste.map(ligne)) : h('p', { class: 'petit' }, videTexte));
}

function tuile(libelle, valeur, { mise = false, lien = null, legende = '' } = {}) {
  const corps = [h('p', { class: 'surtitre' }, libelle), h('div', { class: 'valeur chiffre' }, compteur(valeur)), legende ? h('p', { class: 'legende' }, legende) : null];
  return lien
    ? h('a', { class: 'carte carte-lien tuile' + (mise ? ' filet-or mise' : ''), href: lien }, corps)
    : h('div', { class: 'carte tuile' + (mise ? ' filet-or mise' : '') }, corps);
}

/** Salutation selon l'heure, sans prétendre connaître le prénom du conseiller. */
function salut() {
  const hh = new Date().getHours();
  return hh < 5 || hh >= 18 ? 'Bonsoir.' : 'Bonjour.';
}

async function accueilGuide(ctx, dossiers) {
  const org = (ctx.me.organisations || []).find((o) => o.id === ctx.org) || {};
  let equipe = 0;
  try { equipe = ((await ctx.donnees.equipe(ctx.org)).membres || []).filter((m) => m.statut === 'actif').length; } catch (e) { equipe = 0; }
  let qrCrees = false;
  try { qrCrees = localStorage.getItem('melodia_pro_qr_' + ctx.org) === '1'; } catch (e) { qrCrees = false; }
  const etapes = etapesAccueil({ logo: org.logo, dossiers, qrCrees, equipe });
  const faites = etapes.filter((e) => e.fait).length;
  if (faites === etapes.length || localStorage.getItem('melodia_pro_accueil_ferme_' + ctx.org) === '1') return null;
  const fermer = h('button', { class: 'btn btn-petit', type: 'button', onclick: (e) => {
    localStorage.setItem('melodia_pro_accueil_ferme_' + ctx.org, '1');
    e.currentTarget.closest('section').remove();
  } }, 'Masquer');
  return h('section', { class: 'carte accueil', 'aria-labelledby': 'accueil-t', style: { margin: '1.4rem 0' } },
    anneau(Math.round((faites / etapes.length) * 100), `${faites} étape${faites > 1 ? 's' : ''} sur ${etapes.length}`),
    h('div', null,
      h('div', { class: 'rangee', style: { justifyContent: 'space-between' } }, h('h2', { id: 'accueil-t', style: { margin: 0 } }, 'Bien ', h('em', null, 'démarrer')), fermer),
      h('p', { class: 'petit', style: { margin: '.2rem 0 0' } }, `${faites} sur ${etapes.length} : ces étapes se cochent d’elles-mêmes à mesure que vous avancez.`),
      h('ul', { class: 'liste-accueil' }, etapes.map((e) => h('li', null, e.fait
        ? h('span', { class: 'fait' }, h('span', { class: 'rond' }, icone('coche', { taille: 14 })), e.libelle)
        : h('a', { href: e.lien }, h('span', { class: 'rond' }), e.libelle))))));
}

export async function rendre(el, ctx) {
  const { dossiers } = ctx.org ? await ctx.donnees.dossiers(ctx.org) : { dossiers: [] };
  const maintenant = Date.now();
  const sous48 = dossiers.filter((d) => d.ceremonie_le && new Date(d.ceremonie_le) - maintenant < 48 * 3600e3 && new Date(d.ceremonie_le) > maintenant - 6 * 3600e3 && !CLOS.includes(d.status));
  const aValider = dossiers.filter((d) => A_TRAITER.includes(d.status));
  const enCours = dossiers.filter((d) => EN_COURS.includes(d.status));
  const livres = dossiers.filter((d) => d.status === 'livre').slice(0, 6);
  const alertes = dossiers.filter((d) => ['echec', 'revision_demandee'].includes(d.status));
  const s = ctx.me.services || {};

  el.append(
    h('p', { class: 'surtitre' }, new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())),
    titre(1, 'Ma', 'journée'),
    h('p', { class: 'discret' }, salut() + ' ', dossiers.length
      ? `${enCours.length} dossier(s) en cours, ${aValider.length} attendent un geste de votre part.`
      : 'Votre premier dossier commence par un questionnaire de quelques minutes.')
  );

  el.append(h('div', { class: 'tuiles', style: { margin: '1.4rem 0' } },
    tuile('Cérémonies sous 48 h', sous48.length, { mise: true, lien: '#/dossiers?groupe=48h' }),
    tuile('À relire ou à régler', aValider.length, { lien: '#/dossiers?groupe=a_traiter' }),
    tuile('En composition', enCours.length, { lien: '#/dossiers?groupe=en_cours' }),
    h('div', { class: 'carte tuile' }, h('p', { class: 'surtitre' }, 'Composition d’essai'),
      h('p', { class: 'petit', style: { margin: 0 } }, s.essais_ouverts
        ? `Une première composition offerte par agence${s.essai_duree_s ? ', d’environ ' + Math.floor(s.essai_duree_s / 60) + ' min ' + String(s.essai_duree_s % 60).padStart(2, '0') : ''}.`
        : 'Les compositions d’essai ouvriront prochainement.'))
  ));

  if (alertes.length) {
    el.append(h('div', { class: 'alerte', role: 'note', style: { marginBottom: '1.2rem' } },
      `${alertes.length} dossier(s) repris par la maison. Nous revenons vers vous rapidement ; vous n’avez rien à faire.`));
  }

  const guide = await accueilGuide(ctx, dossiers);
  if (guide) el.append(guide);

  if (!dossiers.length) {
    el.append(h('section', { class: 'pile' },
      h('h2', null, 'Trois gestes, une ', h('em', null, 'chanson')),
      h('div', { class: 'grille' },
        [['onboarding-1-questionnaire', 'Le questionnaire', 'Avec la famille ou seul, quelques minutes suffisent. Tout est gardé au fil de la saisie.'],
         ['onboarding-2-composition', 'La composition', 'La maison écrit, compose, puis écoute chaque chanson avant de vous la confier.'],
         ['onboarding-3-qr', 'Le QR code', 'Une carte, une plaque : la famille réécoute la chanson quand elle le souhaite.']]
          .map(([img, ti, tx]) => h('div', { class: 'carte' },
            h('img', { src: `/assets/img/pro/${img}.webp`, srcset: `/assets/img/pro/${img}-640.webp 640w, /assets/img/pro/${img}.webp 1280w`, sizes: '(max-width: 900px) 90vw, 400px', alt: '', width: 640, height: 400, loading: 'lazy', style: { borderRadius: '6px', marginBottom: '.8rem' } }),
            h('h3', null, ti), h('p', { class: 'petit' }, tx)))),
      h('div', { class: 'rangee' }, h('a', { class: 'btn btn-or', href: '#/nouveau' }, 'Ouvrir un premier dossier'))));
    return;
  }

  el.append(
    bloc('Cérémonies des prochaines 48 heures', sous48, 'Aucune cérémonie dans les deux jours.'),
    h('div', { style: { height: '1.4rem' } }),
    bloc('À relire ou à régler', aValider, 'Rien n’attend votre relecture.'),
    h('div', { style: { height: '1.4rem' } }),
    bloc('Livrés récemment', livres, 'Aucune livraison récente.')
  );
}
