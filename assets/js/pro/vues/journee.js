// Ma journée : ce qui presse, ce qui attend une relecture, ce qui vient d'être livré.
import { h, titre, badgeStatut } from '../ui.js';
import { t, dateHeure, relatif } from '../i18n.js';

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

export async function rendre(el, ctx) {
  const { dossiers } = ctx.org ? await ctx.donnees.dossiers(ctx.org) : { dossiers: [] };
  const maintenant = Date.now();
  const sous48 = dossiers.filter((d) => d.ceremonie_le && new Date(d.ceremonie_le) - maintenant < 48 * 3600e3 && new Date(d.ceremonie_le) > maintenant - 6 * 3600e3 && !['annule', 'rembourse'].includes(d.status));
  const aValider = dossiers.filter((d) => ['paroles_a_valider', 'complet', 'en_attente_paiement'].includes(d.status));
  const enCours = dossiers.filter((d) => ['paye', 'essai_accorde', 'paroles_en_cours', 'musique_en_cours', 'controle_maison'].includes(d.status));
  const livres = dossiers.filter((d) => d.status === 'livre').slice(0, 6);
  const alertes = dossiers.filter((d) => ['echec', 'revision_demandee'].includes(d.status));
  const s = ctx.me.services || {};
  const prenom = (ctx.me.utilisateur.email || '').split('@')[0];

  el.append(
    h('p', { class: 'surtitre' }, new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())),
    titre(1, 'Ma', 'journée'),
    h('p', { class: 'discret' }, prenom ? `Bonjour. ` : '', dossiers.length
      ? `${enCours.length} dossier(s) en cours, ${aValider.length} attendent un geste de votre part.`
      : 'Votre premier dossier commence par un questionnaire de quelques minutes.')
  );

  const tuiles = h('div', { class: 'grille', style: { margin: '1.4rem 0' } },
    h('div', { class: 'carte filet-or' }, h('p', { class: 'surtitre' }, 'Cérémonies sous 48 h'), h('div', { class: 'chiffre' }, sous48.length)),
    h('div', { class: 'carte' }, h('p', { class: 'surtitre' }, 'À relire ou à régler'), h('div', { class: 'chiffre' }, aValider.length)),
    h('div', { class: 'carte' }, h('p', { class: 'surtitre' }, 'En composition'), h('div', { class: 'chiffre' }, enCours.length)),
    h('div', { class: 'carte' }, h('p', { class: 'surtitre' }, 'Composition d’essai'),
      h('p', { class: 'petit', style: { margin: 0 } }, s.essais_ouverts
        ? `Une première composition offerte par agence${s.essai_duree_s ? ', d’environ ' + Math.floor(s.essai_duree_s / 60) + ' min ' + String(s.essai_duree_s % 60).padStart(2, '0') : ''}.`
        : 'Les compositions d’essai ouvriront prochainement.'))
  );
  el.append(tuiles);

  if (alertes.length) {
    el.append(h('div', { class: 'alerte', role: 'note', style: { marginBottom: '1.2rem' } },
      `${alertes.length} dossier(s) repris par la maison. Nous revenons vers vous rapidement ; vous n’avez rien à faire.`));
  }

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
