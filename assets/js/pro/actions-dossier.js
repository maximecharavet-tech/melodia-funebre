// Gestes partagés entre la liste, la fiche et la bibliothèque.
import { toast, telecharger } from './ui.js';
import { ecrire } from './memoire.js';
import { modeleDepuis, dossiersEnCsv } from './logique.js';
import { t } from './i18n.js';

/**
 * Duplication « comme modèle » : un nouveau questionnaire s'ouvre, prérempli avec
 * le style musical, le rite et le mode du dossier d'origine. RIEN de la personne
 * n'est copié (identité, vie, message, dates, consentements). Le brouillon reste sur
 * l'appareil jusqu'à ce que le prénom soit saisi, comme pour tout nouveau dossier.
 */
export async function dupliquerCommeModele(ctx, id) {
  try {
    const f = await ctx.donnees.dossier(id);
    const modele = modeleDepuis(f.questionnaire && f.questionnaire.donnees);
    await ecrire('brouillons', 'q-nouveau-' + ctx.org, { q: modele, version_base: 0, modifie: Date.now() });
    toast('Nouveau dossier ouvert avec le style et le rite du précédent. Rien de la personne n’est repris.');
    ctx.aller('nouveau');
  } catch (e) { toast(e.message || 'Duplication impossible.', { erreur: true }); }
}

export function exporterCsv(liste, nom) {
  const csv = dossiersEnCsv(liste, (s) => t('statut.' + s, s));
  telecharger(new Blob([csv], { type: 'text/csv;charset=utf-8' }), nom || ('melodia-dossiers-' + new Date().toISOString().slice(0, 10) + '.csv'));
  toast(`${liste.length} dossier${liste.length > 1 ? 's' : ''} exporté${liste.length > 1 ? 's' : ''}.`);
}
