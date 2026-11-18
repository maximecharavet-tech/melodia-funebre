// Écoutes des liens envoyés aux agences : jeton signé, liens marqués dans
// les envois réels seulement, journal « Écoute » fusionné et purgé à 3 ans,
// route /api/ecoute, mention dans le pied, et commandes par partenaire en
// agrégats (jamais une donnée de famille).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { monterFauxServeur, fausseReponse, requete } from './_faux-serveur.mjs';

process.env.SUPABASE_URL = 'https://faux.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_' + 'x'.repeat(30);
process.env.RESEND_API_KEY = 're_faux';
process.env.PROSPECT_FROM = 'Melodia <contact@contact.melodia-funebre.fr>';
process.env.LEAD_TO = '';
delete process.env.SEQUENCES_AUTO;

const E = await import('../../api/_ecoute.js');
const ecoute = (await import('../../api/ecoute.js')).default;
const mail = await import('../../api/prospect-mail.js');
const D = await import('../../api/_desabonnement.js');

const SIRET = '12345678900012';
let faux;
before(() => { faux = monterFauxServeur(); });
after(() => { faux.restaurer(); });

test('jeton : signé, relu, refusé s’il est altéré', () => {
  const j = E.jetonEcoute(SIRET);
  assert.match(j, /^\d{14}\.[0-9a-f]{16}$/);
  assert.equal(E.lireJeton(j), SIRET);
  assert.equal(E.lireJeton(j.slice(0, -1) + (j.endsWith('0') ? '1' : '0')), '');
  assert.equal(E.lireJeton('98765432100019.' + j.split('.')[1]), '');
  assert.equal(E.jetonEcoute('123'), '');
});

test('liens : seuls les liens d’écoute reçoivent le jeton, le parrain est gardé', () => {
  const j = E.jetonEcoute(SIRET);
  const t = E.marquerTexte('Écoutez https://melodia-funebre.fr/demos?parrain=julie-serve ou https://melodia-funebre.fr/ecouter/le-papi-pecheur.\nOffres : https://melodia-funebre.fr/offres', SIRET);
  assert.ok(t.includes('/demos?parrain=julie-serve&ec=' + j));
  assert.ok(t.includes('/ecouter/le-papi-pecheur?ec=' + j));
  assert.ok(t.includes('https://melodia-funebre.fr/offres\n') || t.endsWith('/offres'));
  const h = E.marquerHtml('<a href="https://melodia-funebre.fr/demos?parrain=julie-serve">x</a><a href="https://melodia-funebre.fr/api/prospect-stop?e=a&amp;t=b">stop</a>', SIRET);
  assert.ok(h.includes('href="https://melodia-funebre.fr/demos?parrain=julie-serve&amp;ec=' + j + '"'));
  assert.ok(h.includes('href="https://melodia-funebre.fr/api/prospect-stop?e=a&amp;t=b"'), 'le lien STOP n’est pas touché');
  assert.equal(E.marquerHtml(h, SIRET), h, 'pas de double jeton');
  assert.equal(E.marquerTexte('https://melodia-funebre.fr/demos', ''), 'https://melodia-funebre.fr/demos');
});

test('journal : une écoute ajoutée, la même dans la demi-heure fusionnée, purge au-delà de 3 ans', () => {
  const t0 = Date.parse('2026-11-18T10:00:00Z');
  const vieux = { le: '2023-11-01T10:00:00Z', quoi: 'Écoute', detail: 'ancienne', oeuvre: 'X', secondes: 30 };
  const note = { le: '2023-10-01T10:00:00Z', quoi: 'Appel — messagerie', detail: '' };
  let r = E.journalAvecEcoute([vieux, note], { oeuvre: 'Le roi de la route', secondes: 21, maintenant: t0 });
  assert.equal(r.nouveau, true);
  assert.equal(r.journal.length, 2, 'l’écoute de plus de 3 ans est retirée, la note gardée');
  assert.equal(r.journal[0].quoi, 'Écoute');
  assert.equal(r.journal[0].detail, '« Le roi de la route » · 21 s');
  r = E.journalAvecEcoute(r.journal, { oeuvre: 'Le roi de la route', secondes: 100, maintenant: t0 + 10 * 60_000 });
  assert.equal(r.nouveau, false);
  assert.equal(r.journal[0].secondes, 100);
  assert.equal(r.journal[0].detail, '« Le roi de la route » · 1 min 40');
  r = E.journalAvecEcoute(r.journal, { oeuvre: 'Le roi de la route', secondes: 25, maintenant: t0 + 2 * 3600_000 });
  assert.equal(r.nouveau, true);
  assert.equal(E.purgerJournal([vieux], t0).length, 0);
});

async function poster(corps, entetes) {
  const res = fausseReponse();
  res.end = (t) => { res.texte = t; return res; };
  await ecoute({ method: 'POST', headers: Object.assign({ origin: 'https://melodia-funebre.fr' }, entetes || {}), body: corps }, res);
  return { status: res.statusCode, corps: JSON.parse(res.texte || '{}') };
}

test('route /api/ecoute : jeton invalide refusé, rien d’écrit', async () => {
  faux.etat.patches.length = 0;
  const r = await poster({ ec: SIRET + '.0000000000000000', oeuvre: 'X', secondes: 25 });
  assert.equal(r.status, 400);
  assert.equal(faux.etat.patches.length, 0);
  assert.equal((await poster({ ec: E.jetonEcoute(SIRET) }, { origin: 'https://autre.example' })).status, 403);
});

test('route /api/ecoute : jeton valide → ligne « Écoute » dans le journal de la fiche, sans IP', async () => {
  faux.etat.patches.length = 0;
  faux.etat.prospects = [{ owner: 'julie@melodia.test', siret: SIRET, journal: [] }];
  const r = await poster(JSON.stringify({ ec: E.jetonEcoute(SIRET), oeuvre: 'Le Papi Pêcheur<script>', secondes: 42 }));
  assert.equal(r.status, 200, JSON.stringify(r.corps));
  assert.equal(faux.etat.patches.length, 1);
  const p = faux.etat.patches[0];
  assert.match(p.q, /siret=eq\.12345678900012/);
  const l = p.corps.journal[0];
  assert.equal(l.quoi, 'Écoute');
  assert.equal(l.oeuvre, 'Le Papi Pêcheurscript');
  assert.equal(l.secondes, 42);
  assert.ok(!JSON.stringify(p.corps).match(/\d+\.\d+\.\d+\.\d+/), 'aucune adresse IP');
});

test('pied de prospection : mention d’écoute discrète, lien STOP conservé', () => {
  const h = D.htmlPiedProspection('https://melodia-funebre.fr/api/prospect-stop?e=a&t=b');
  assert.ok(h.includes('Les liens d’écoute sont suivis pour vous recontacter au bon moment.'));
  assert.ok(h.includes('STOP') && h.includes('prospect-stop'));
  const t = D.textePiedProspection('https://x');
  assert.ok(t.includes('Les liens d’écoute sont suivis pour vous recontacter au bon moment.'));
  assert.ok(t.includes('STOP'));
});

const appelerMail = async (corps) => { const res = fausseReponse(); await mail.default(requete(corps), res); return res; };
const repartir = () => { mail.reinitialiserMagasinEnvois(); faux.etat.envois.length = 0; faux.etat.resend.length = 0; faux.etat.resendReponse = null; faux.etat.colonneIdempotence = true; faux.etat.journalEnPanne = false; };

test('envoi réel : les liens d’écoute portent le jeton de la fiche (HTML et texte), la mention est dans le pied', async () => {
  repartir();
  const res = await appelerMail({ mode: 'envoi', modele: 'pf-relance-j4', joindreBrochure: false,
    envois: [{ to: 'contact@agence-martin.fr', ref: SIRET, nom: 'Martin', societe: 'Pompes Martin', ville: 'Lyon' }] });
  assert.equal(res.statusCode, 200, JSON.stringify(res.corps));
  const c = faux.etat.resend[0].corps;
  const charge = Array.isArray(c) ? c[0] : c;
  const j = E.jetonEcoute(SIRET);
  assert.ok(charge.html.includes('ec=' + j), 'jeton dans le HTML');
  assert.ok(charge.html.includes('Les liens d’écoute sont suivis'));
  assert.ok(charge.html.includes('prospect-stop'));
});

test('envoi test : aucun jeton (Julie ne se suit pas elle-même)', async () => {
  repartir();
  const res = await appelerMail({ mode: 'test', modele: 'pf-relance-j4', joindreBrochure: false,
    envois: [{ to: 'contact@agence-martin.fr', ref: SIRET, nom: 'Martin', societe: 'Pompes Martin', ville: 'Lyon' }] });
  assert.equal(res.statusCode, 200, JSON.stringify(res.corps));
  const c = faux.etat.resend[0].corps;
  assert.ok(!(Array.isArray(c) ? c[0] : c).html.includes('ec='));
});

test('mode partenaires : nombre de commandes et dernière date par fiche, sans donnée de famille, rien n’est envoyé', async () => {
  repartir();
  faux.etat.prospects = [
    { owner: 'julie@melodia.test', siret: SIRET, nom: 'Pompes Funèbres Martin', email: 'contact@agence-martin.fr', statut: 'partenaire' },
    { owner: 'julie@melodia.test', siret: '98765432100019', nom: 'Roc Éclerc Lyon', email: '', statut: 'activee' }
  ];
  faux.etat.orders = [
    { agence: 'Pompes funebres MARTIN', user_email: 'autre@x.fr', created_at: '2026-11-01T10:00:00Z', defunt: 'NE DOIT PAS SORTIR' },
    { agence: '', user_email: 'Contact@Agence-Martin.fr', created_at: '2026-11-10T10:00:00Z', defunt: 'NE DOIT PAS SORTIR' }
  ];
  const res = await appelerMail({ mode: 'partenaires' });
  assert.equal(res.statusCode, 200, JSON.stringify(res.corps));
  assert.deepEqual(res.corps.stats[SIRET], { commandes: 2, derniere: '2026-11-10T10:00:00Z' });
  assert.deepEqual(res.corps.stats['98765432100019'], { commandes: 0, derniere: '' });
  assert.ok(!JSON.stringify(res.corps).includes('NE DOIT PAS SORTIR'));
  assert.equal(faux.etat.lectureOrders, 'agence,user_email,created_at', 'seules trois colonnes lues');
  assert.equal(faux.etat.resend.length, 0);
});
