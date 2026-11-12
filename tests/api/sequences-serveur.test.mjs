// Séquences côté serveur : la console écrit en base, le cron lit ; le propriétaire vient de la session.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { monterFauxServeur, fausseReponse, requete } from './_faux-serveur.mjs';

process.env.SUPABASE_URL = 'https://faux.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_' + 'x'.repeat(30);
process.env.RESEND_API_KEY = 're_faux';
process.env.PROSPECT_FROM = 'Melodia <contact@contact.melodia-funebre.fr>';
delete process.env.SEQUENCES_AUTO;
const handler = (await import('../../api/prospect-mail.js')).default;

let faux;
before(() => { faux = monterFauxServeur(); });
after(() => { faux.restaurer(); delete process.env.SEQUENCES_AUTO; });
async function appeler(corps) { const res = fausseReponse(); await handler(requete(corps), res); return res; }
const SEQ = { nom: 'Premier contact', cible: 'funeraire', actif: true, etapes: [
  { jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: ['professionnels'] },
  { jour: 3, modele: 'pf-relance-j4', canal: 'mail' }, { jour: 7, modele: 'x<script>', canal: 'mail' }] };

test('sequence_enregistrer : modèle invalide refusé, rien d’écrit', async () => {
  faux.etat.sequences = []; faux.etat.inscriptions = [];
  const r = await appeler({ mode: 'sequence_enregistrer', sequence: SEQ });
  assert.equal(r.statusCode, 400); assert.equal(faux.etat.sequences.length, 0);
});

test('sequence_enregistrer : crée la séquence au nom de la SESSION et inscrit ; réinscrire ne remet rien à zéro', async () => {
  faux.etat.sequences = []; faux.etat.inscriptions = [];
  SEQ.etapes[2].modele = 'pf-relance-j10';
  const r = await appeler({ mode: 'sequence_enregistrer', sequence: SEQ, owner: 'pirate@x.fr', inscriptions: [{ prospect_siret: '111' }, { prospect_siret: '222' }, { prospect_siret: '111' }] });
  assert.equal(r.statusCode, 200, JSON.stringify(r.corps));
  assert.equal(r.corps.inscrits, 2);
  assert.equal(faux.etat.sequences[0].owner, 'julie@melodia.test');
  assert.ok(faux.etat.inscriptions.every((i) => i.owner === 'julie@melodia.test' && i.etape === 0 && i.statut === 'active'));
  faux.etat.inscriptions[0].etape = 2;
  const r2 = await appeler({ mode: 'sequence_enregistrer', sequence: SEQ, inscriptions: [{ prospect_siret: '111' }] });
  assert.equal(r2.corps.inscrits, 0);
  assert.equal(faux.etat.inscriptions[0].etape, 2, 'pas de remise à zéro');
  assert.equal(faux.etat.sequences.length, 1, 'même séquence mise à jour, pas dupliquée');
});

test('automatisation : drapeau lisible (booléen seulement), file et pauses', async () => {
  faux.etat.inscriptions = [
    { id: 1, owner: 'julie@melodia.test', prospect_siret: '111', sequence_id: 100, etape: 1, prochaine_le: new Date().toISOString(), statut: 'active', motif_sortie: '' },
    { id: 2, owner: 'julie@melodia.test', prospect_siret: '222', sequence_id: 100, etape: 0, prochaine_le: new Date().toISOString(), statut: 'pause', motif_sortie: 'Envoi incertain' }];
  const off = await appeler({ mode: 'automatisation' });
  assert.equal(off.corps.auto, false);
  assert.equal(off.corps.file[0].modele, 'pf-relance-j4');
  assert.equal(off.corps.pauses[0].motif, 'Envoi incertain');
  process.env.SEQUENCES_AUTO = 'true';
  assert.equal((await appeler({ mode: 'automatisation' })).corps.auto, true);
  process.env.SEQUENCES_AUTO = '1';
  assert.equal((await appeler({ mode: 'automatisation' })).corps.auto, false);
  assert.ok(!JSON.stringify(off.corps).includes('secret-'), 'aucun secret exposé');
});
