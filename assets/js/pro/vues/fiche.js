// La fiche d'un dossier : où il en est, ce qu'il attend de vous, la chanson.
import { h, titre, vider, toast, confirmer, badgeStatut } from '../ui.js';
import { t, date, dateHeure } from '../i18n.js';

const ATTENTE = {
  paye: 'Réglé. La maison commence l’écriture des paroles.',
  essai_accorde: 'Composition d’essai accordée. La maison commence l’écriture des paroles.',
  paroles_en_cours: 'La maison écrit les paroles à partir du questionnaire.',
  musique_en_cours: 'La composition est en cours. Comptez quelques minutes.',
  controle_maison: 'La maison écoute la chanson avant de vous la confier.',
  echec: 'La maison a repris ce dossier pour le mener à bien. Vous n’avez rien à faire ; nous revenons vers vous.',
  revision_demandee: 'Votre demande de révision est entre les mains de la maison.',
  en_attente_paiement: 'Le paiement n’est pas encore confirmé.'
};

export async function rendre(el, ctx, route) {
  let fiche = await ctx.donnees.dossier(route.id);
  let minuteur = null;
  if (route.params.paiement === 'ok') toast('Paiement transmis : la confirmation arrive dans un instant.');
  if (route.params.paiement === 'annule') toast('Paiement interrompu. Vous pouvez le reprendre quand vous voulez.');

  async function recharger() {
    fiche = await ctx.donnees.dossier(route.id);
    dessiner();
  }

  function suivre() {
    clearInterval(minuteur);
    const s = fiche.dossier.status;
    if (!['paye', 'essai_accorde', 'paroles_en_cours', 'musique_en_cours', 'en_attente_paiement'].includes(s)) return;
    minuteur = setInterval(async () => {
      try {
        const r = await ctx.donnees.tick(route.id);
        if (r && r.statut && r.statut !== fiche.dossier.status) { await recharger(); toast(t('statut.' + r.statut)); }
      } catch (e) { /* le prochain passage réessaiera */ }
    }, ctx.donnees.sondage);
  }

  function blocParoles() {
    const v = fiche.paroles[0];
    if (!v) return null;
    const editable = fiche.dossier.status === 'paroles_a_valider' && fiche.acteur !== 'lecture';
    if (!editable) {
      return h('section', { class: 'carte' }, h('h2', null, v.titre || 'Les paroles'), h('div', { class: 'paroles' }, v.paroles),
        h('p', { class: 'petit' }, 'Version ' + v.version));
    }
    const ti = h('input', { type: 'text', value: v.titre || '', maxlength: 120, id: 'par-titre' });
    const pa = h('textarea', { class: 'paroles-edit', id: 'par-texte', maxlength: 3000 });
    pa.value = v.paroles;
    const pr = h('textarea', { id: 'par-prompt', rows: 3, maxlength: 500 });
    pr.value = v.prompt_musique || '';
    const choixV = fiche.paroles.length > 1 ? h('select', { 'aria-label': 'Version des paroles', onchange: (e) => {
      const x = fiche.paroles.find((p) => String(p.version) === e.target.value);
      ti.value = x.titre || ''; pa.value = x.paroles; pr.value = x.prompt_musique || '';
    } }, fiche.paroles.map((p) => h('option', { value: p.version }, `Version ${p.version} · ${p.auteur === 'agent' ? 'proposition' : 'corrigée'}`))) : null;
    return h('section', { class: 'carte filet-or pile' },
      h('div', { class: 'rangee', style: { justifyContent: 'space-between' } }, h('h2', null, 'Relire les ', h('em', null, 'paroles')), choixV),
      h('p', { class: 'discret' }, 'Corrigez librement : un prénom, une date, un mot qui sonne faux. Rien ne part à la composition avant votre accord.'),
      h('div', { class: 'champ' }, h('label', { for: 'par-titre' }, 'Titre'), ti),
      h('div', { class: 'champ' }, h('label', { for: 'par-texte' }, 'Paroles'), pa),
      h('div', { class: 'champ interne' }, h('label', { for: 'par-prompt' }, 'Description musicale'),
        h('div', { class: 'aide' }, 'Rédigée à partir du questionnaire : style, ambiance, instruments, tempo. Les noms d’artistes sont retirés d’office.'), pr),
      h('div', { class: 'rangee' },
        h('button', { class: 'btn', type: 'button', onclick: async () => {
          try {
            const r = await ctx.donnees.editerParoles(route.id, { titre: ti.value, paroles: pa.value, prompt_musique: pr.value });
            toast(r.segments_retires ? 'Corrections enregistrées. Une mention d’artiste a été retirée de la description musicale.' : 'Corrections enregistrées.');
            await recharger();
          } catch (e) { toast(e.message, { erreur: true }); }
        } }, 'Enregistrer mes corrections'),
        h('button', { class: 'btn', type: 'button', onclick: async () => {
          if (!await confirmer({ titre: 'Une autre proposition ?', texte: 'La maison rédigera une nouvelle version à partir du questionnaire. Vos corrections restent dans l’historique.', bouton: 'Demander' })) return;
          try { await ctx.donnees.redemanderParoles(route.id); await recharger(); suivre(); } catch (e) { toast(e.message, { erreur: true }); }
        } }, 'Une autre proposition'),
        h('button', { class: 'btn btn-or', type: 'button', id: 'btn-composer', onclick: async () => {
          if (!await confirmer({ titre: 'Lancer la composition ?', texte: 'Les paroles et la description musicale affichées partiront à la composition. Elles ne seront plus modifiables ensuite.', bouton: 'Lancer la composition' })) return;
          try {
            if (pa.value !== v.paroles || ti.value !== (v.titre || '') || pr.value !== (v.prompt_musique || '')) {
              await ctx.donnees.editerParoles(route.id, { titre: ti.value, paroles: pa.value, prompt_musique: pr.value });
              fiche = await ctx.donnees.dossier(route.id);
            }
            await ctx.donnees.lancerMusique(route.id, fiche.paroles[0].version);
            toast('Composition lancée.');
            await recharger(); suivre();
          } catch (e) { toast(e.message, { erreur: true }); }
        } }, 'Valider et lancer la composition')));
  }

  function blocChanson() {
    const p = fiche.pistes[0];
    const s = fiche.dossier.status;
    if (!p || !p.url) return null;
    const maisonVoit = s === 'controle_maison';
    return h('section', { class: 'carte filet-or pile' },
      h('h2', null, maisonVoit ? 'Écoute de la ' : 'La ', h('em', null, 'chanson')),
      h('audio', { controls: true, preload: 'metadata', src: p.url }),
      h('p', { class: 'petit' }, (p.mode === 'essai' ? 'Composition d’essai · ' : '') + (p.duree_s ? Math.floor(p.duree_s / 60) + ' min ' + String(p.duree_s % 60).padStart(2, '0') + ' · ' : '') + t('commun.signature')),
      maisonVoit && fiche.acteur === 'maison' ? h('div', { class: 'rangee' },
        h('button', { class: 'btn btn-or', type: 'button', id: 'btn-livrer', onclick: async () => {
          try { await ctx.donnees.adminAction({ action: 'livrer', dossier_id: route.id, piste_id: p.id }); toast('Chanson livrée.'); await recharger(); } catch (e) { toast(e.message, { erreur: true }); }
        } }, ctx.donnees.demo ? 'Simuler la validation de la maison' : 'Valider et livrer'),
        h('button', { class: 'btn', type: 'button', onclick: async () => {
          try { await ctx.donnees.adminAction({ action: 'reprendre', dossier_id: route.id, vers: 'musique_en_cours' }); await recharger(); suivre(); } catch (e) { toast(e.message, { erreur: true }); }
        } }, 'Recomposer')) : null,
      s === 'livre' ? h('div', { class: 'rangee' },
        h('a', { class: 'btn btn-or', href: '#/qr/' + route.id }, 'Préparer le QR et les impressions'),
        h('a', { class: 'btn', href: p.url, download: `melodia-${fiche.dossier.reference}.mp3` }, 'Télécharger le fichier'),
        navigator.share ? h('button', { class: 'btn', type: 'button', onclick: () => navigator.share({ title: 'Une chanson pour ' + (fiche.dossier.prenom || ''), url: fiche.qr ? 'https://melodia-funebre.fr/m/' + fiche.qr.jeton : location.href }).catch(() => {}) }, 'Partager') : null) : null);
  }

  function dessiner() {
    vider(el);
    const d = fiche.dossier;
    const s = d.status;
    el.append(
      h('p', { class: 'surtitre' }, 'Dossier ', h('span', { class: 'mono' }, d.reference)),
      h('div', { class: 'rangee', style: { justifyContent: 'space-between' } },
        titre(1, 'Pour', d.prenom || '…'), badgeStatut(s, t('statut.' + s))),
      h('p', { class: 'petit' }, d.ceremonie_le ? 'Cérémonie ' + dateHeure(d.ceremonie_le) + ' · ' : '', d.date_limite ? 'attendue le ' + date(d.date_limite) + ' · ' : '', 'ouvert le ' + date(d.created_at)));

    if (ATTENTE[s]) el.append(h('div', { class: 'alerte info', role: 'status', style: { margin: '1rem 0' } }, ATTENTE[s],
      ['paye', 'essai_accorde', 'paroles_en_cours', 'musique_en_cours'].includes(s) ? h('div', { class: 'squelette', style: { height: '4px', marginTop: '.7rem' } }) : null));

    const actions = h('div', { class: 'rangee', style: { margin: '1rem 0' } });
    if (['brouillon', 'complet'].includes(s) && fiche.acteur !== 'lecture') {
      actions.append(h('a', { class: 'btn btn-or', href: `#/dossiers/${d.id}/questionnaire` }, s === 'brouillon' ? 'Reprendre le questionnaire' : 'Revoir et lancer'));
    }
    if (s === 'en_attente_paiement' && fiche.acteur !== 'lecture') {
      actions.append(h('button', { class: 'btn btn-or', type: 'button', onclick: async () => {
        try { const r = await ctx.donnees.checkout(d.id, ''); if (r.url) location.href = r.url; } catch (e) { toast(e.message, { erreur: true }); }
      } }, 'Reprendre le paiement'));
    }
    if (s === 'livre' && fiche.acteur !== 'lecture') {
      actions.append(h('button', { class: 'btn', type: 'button', onclick: async () => {
        if (!await confirmer({ titre: 'Demander une révision ?', texte: 'La maison reprendra la chanson avec vous. La version livrée reste disponible en attendant.', bouton: 'Demander une révision' })) return;
        try { await ctx.donnees.changerStatut(d.id, 'revision_demandee'); await recharger(); } catch (e) { toast(e.message, { erreur: true }); }
      } }, 'Demander une révision'));
    }
    if (['brouillon', 'complet', 'en_attente_paiement'].includes(s) && fiche.acteur !== 'lecture') {
      actions.append(h('button', { class: 'btn btn-danger', type: 'button', onclick: async () => {
        if (!await confirmer({ titre: 'Annuler ce dossier ?', texte: 'Le dossier restera consultable mais ne pourra plus être composé.', bouton: 'Annuler le dossier', mot: 'annuler', danger: true })) return;
        try { await ctx.donnees.changerStatut(d.id, 'annule'); await recharger(); } catch (e) { toast(e.message, { erreur: true }); }
      } }, 'Annuler le dossier'));
    }
    el.append(actions);

    const colonnes = h('div', { class: 'pile' }, blocChanson(), blocParoles());
    el.append(colonnes);

    const q = fiche.questionnaire && fiche.questionnaire.donnees;
    if (q) {
      el.append(h('details', { class: 'carte', style: { marginTop: '1.2rem' } },
        h('summary', { style: { cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' } }, 'Récapitulatif du questionnaire'),
        h('dl', { class: 'deux' }, [
          ['Métier', q.vie?.metier], ['Traits', (q.vie?.traits || []).join(', ')], ['Style', q.musique?.style], ['Voix', q.musique?.voix],
          ['Ton', q.message?.ton], ['Rite', q.ceremonie?.rite], ['Page mémorial', q.consentements?.visibilite]
        ].filter(([, v]) => v).map(([k, v]) => h('div', null, h('dt', { class: 'petit' }, k), h('dd', { style: { margin: 0 } }, v))))));
    }
    if (fiche.journal && fiche.journal.length) {
      el.append(h('section', { class: 'carte', style: { marginTop: '1.2rem' } }, h('h2', null, 'Historique'),
        h('ol', { class: 'frise' }, fiche.journal.slice(0, 12).map((j) => h('li', null, t('statut.' + j.texte, j.texte), ' ', h('span', { class: 'petit' }, dateHeure(j.quand)))))));
    }
    suivre();
  }

  dessiner();
  return () => clearInterval(minuteur);
}
