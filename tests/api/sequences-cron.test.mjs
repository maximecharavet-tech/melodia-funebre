// /api/sequences-cron : inerte sans SEQUENCES_AUTO ; avec, il envoie vraiment,
// sans jamais doubler un courriel, même avec des exécutions concurrentes.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { monterFauxServeur, fausseReponse } from './_faux-serveur.mjs';

process.env.SUPABASE_URL = 'https://faux.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_' + 'x'.repeat(30);
process.env.RESEND_API_KEY = 're_faux';
process.env.PROSPECT_FROM = 'Melodia <contact@contact.melodia-funebre.fr>';
process.env.LEAD_TO = '';
delete process.env.SEQUENCES_AUTO;
process.env.CRON_SECRET = 'secret-de-test';

const mail = await import('../../api/prospect-mail.js');
const cron = await import('../../api/sequences-cron.js');

let faux;
before(() => { faux = monterFauxServeur(); });
after(() => { faux.restaurer(); delete process.env.SEQUENCES_AUTO; });

const ETAPES = [
  { jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: [] },
  { jour: 3, modele: 'pf-relance-j4', canal: 'mail', brochures: [] },
  { jour: 7, modele: 'pf-relance-j10', canal: 'appel', brochures: [] }
];
const IL_Y_A = (j) => new Date(Date.now() - j * 86400_000).toISOString();

function monter({ etape = 0, prospect = {}, inscription = {} } = {}) {
  mail.reinitialiserMagasinEnvois();
  const e = faux.etat;
  e.envois.length = 0; e.resend.length = 0; e.taches.length = 0; e.patches.length = 0; e.resendReponse = null;
  e.colonneIdempotence = true; e.journalEnPanne = false; e.role = 'commercial';
  e.sequences = [{ id: 7, etapes: ETAPES, actif: true, nom: 'Premier contact' }];
  e.prospects = [Object.assign({ siret: '12345678900012', email: 'Agence@Martin.fr', nom: 'Pompes Martin', ville: 'Lyon', statut: 'nouveau', oppose: false, rejete: false }, prospect)];
  e.inscriptions = [Object.assign({ id: 1, owner: 'julie@melodia.test', prospect_siret: '12345678900012', sequence_id: 7, etape, prochaine_le: IL_Y_A(0.01), statut: 'active', motif_sortie: '', created_at: IL_Y_A(8) }, inscription)];
}

async function http(headers = {}, methode = 'POST') {
  const res = fausseReponse();
  res.end = (t) => { res.texte = t; return res; };
  await cron.default({ method: methode, headers, body: {} }, res);
  return { status: res.statusCode, corps: res.texte ? JSON.parse(res.texte) : res.corps };
}
const AUTH = { authorization: 'Bearer secret-de-test' };

test('SEQUENCES_AUTO absent : le cron ne fait rien (même avec le bon secret)', async () => {
  monter(); delete process.env.SEQUENCES_AUTO;
  const r = await http(AUTH);
  assert.equal(r.corps.code, 'DESACTIVE');
  assert.equal(faux.etat.resend.length, 0);
  assert.equal(faux.etat.inscriptions[0].etape, 0);
});

test('SEQUENCES_AUTO autre que « true » (1, True, yes) : toujours inerte', async () => {
  for (const v of ['1', 'True', 'TRUE', 'yes', 'on', ' true']) {
    monter(); process.env.SEQUENCES_AUTO = v;
    const r = await http(AUTH);
    assert.equal(r.corps.code, 'DESACTIVE', v);
    assert.equal(faux.etat.resend.length, 0);
  }
  delete process.env.SEQUENCES_AUTO;
});

test('SEQUENCES_AUTO=true sans secret ou avec x-vercel-cron seul : refusé', async () => {
  monter(); process.env.SEQUENCES_AUTO = 'true';
  assert.equal((await http({})).status, 401);
  assert.equal((await http({ 'x-vercel-cron': '1' })).status, 401);
  assert.equal((await http({ authorization: 'Bearer faux' })).status, 401);
  assert.equal(faux.etat.resend.length, 0);
});

test('actif : l’étape due part vraiment, l’inscription avance au jour suivant de la séquence', async () => {
  monter(); process.env.SEQUENCES_AUTO = 'true';
  const r = await http(AUTH);
  assert.equal(r.status, 200, JSON.stringify(r.corps));
  assert.equal(r.corps.envoyees, 1);
  assert.equal(faux.etat.resend.length, 1);
  const c = faux.etat.resend[0].corps;
  assert.deepEqual(c.to, ['Agence@Martin.fr']);
  assert.match(c.from, /julie@contact\.melodia-funebre\.fr/);
  assert.ok(c.headers['List-Unsubscribe'], 'en-tête de désabonnement');
  assert.equal(c.reply_to, 'julie@melodia.test');
  const l = faux.etat.envois[0];
  assert.equal(l.sequence_id, 7); assert.equal(l.etape, 0); assert.equal(l.statut, 'envoye');
  assert.equal(l.cle_idempotence, 'agence@martin.fr|m:pf-premier-contact#e0');
  const i = faux.etat.inscriptions[0];
  assert.equal(i.etape, 1); assert.equal(i.statut, 'active');
  assert.ok(new Date(i.prochaine_le) > new Date(), 'prochaine échéance dans le futur');
});

test('actif : 3 exécutions simultanées → un seul courriel (verrou + idempotence)', async () => {
  monter(); process.env.SEQUENCES_AUTO = 'true';
  const rs = await Promise.all([cron.traiterEcheances(), cron.traiterEcheances(), cron.traiterEcheances()]);
  assert.equal(faux.etat.resend.length, 1);
  assert.equal(rs.reduce((n, b) => n + b.envoyees, 0), 1);
  assert.equal(faux.etat.inscriptions[0].etape, 1);
});

test('actif : si le verrou est contourné, la clé d’idempotence protège encore (rejeu après crash)', async () => {
  monter(); process.env.SEQUENCES_AUTO = 'true';
  await cron.traiterEcheances();
  // l'inscription est « revenue en arrière » (crash entre envoi et avance)
  Object.assign(faux.etat.inscriptions[0], { etape: 0, prochaine_le: IL_Y_A(0.01), statut: 'active' });
  const b = await cron.traiterEcheances();
  assert.equal(faux.etat.resend.length, 1, 'aucun second courriel');
  assert.equal(b.dejaEnvoyees, 1);
  assert.equal(faux.etat.inscriptions[0].etape, 1, 'mais l’étape avance');
});

test('actif : dernière étape « appel » → tâche créée, aucun mail', async () => {
  monter({ etape: 2 }); process.env.SEQUENCES_AUTO = 'true';
  const b = await cron.traiterEcheances();
  assert.equal(b.appels, 1); assert.equal(faux.etat.resend.length, 0);
  assert.equal(faux.etat.taches[0].type, 'appel');
  assert.equal(faux.etat.inscriptions[0].statut, 'terminee');
});

test('actif : prospect opposé / répondu / intéressé / sans adresse → sortie, rien d’envoyé', async () => {
  process.env.SEQUENCES_AUTO = 'true';
  for (const p of [{ oppose: true }, { rejete: true }, { a_repondu_le: IL_Y_A(1) }, { statut: 'interesse' }, { email: 'pas-une-adresse' }]) {
    monter({ prospect: p });
    await cron.traiterEcheances();
    assert.equal(faux.etat.resend.length, 0, JSON.stringify(p));
    assert.equal(faux.etat.inscriptions[0].statut, 'sortie', JSON.stringify(p));
    assert.ok(faux.etat.inscriptions[0].motif_sortie);
  }
});

test('actif : échéance dans le futur → rien', async () => {
  monter({ inscription: { prochaine_le: new Date(Date.now() + 86400_000).toISOString() } }); process.env.SEQUENCES_AUTO = 'true';
  const b = await cron.traiterEcheances();
  assert.equal(b.traitees, 0); assert.equal(faux.etat.resend.length, 0);
});

test('actif : échec transitoire → reportée avec espacement, puis reprise sans doublon', async () => {
  monter(); process.env.SEQUENCES_AUTO = 'true';
  faux.etat.resendReponse = () => ({ status: 500, corps: { message: 'boom' } });
  const b1 = await cron.traiterEcheances();
  assert.equal(b1.reportees, 1);
  const i = faux.etat.inscriptions[0];
  assert.equal(i.etape, 0); assert.equal(i.statut, 'active');
  assert.match(i.motif_sortie, /Nouvel essai 1\/3/);
  assert.ok(new Date(i.prochaine_le).getTime() > Date.now() + 30 * 60_000, 'au moins ~1 h plus tard');
  // reprise : l'heure est venue, Resend répond
  faux.etat.resendReponse = null; i.prochaine_le = IL_Y_A(0.01);
  const b2 = await cron.traiterEcheances();
  assert.equal(b2.envoyees, 1);
  assert.equal(faux.etat.envois.filter((l) => l.statut === 'envoye').length, 1);
  assert.equal(faux.etat.inscriptions[0].etape, 1);
});

test('actif : trois échecs → pause visible, plus de tentative automatique', async () => {
  monter({ inscription: { motif_sortie: 'Nouvel essai 2/3 : SEND_FAILED' } }); process.env.SEQUENCES_AUTO = 'true';
  faux.etat.resendReponse = () => ({ status: 500, corps: { message: 'boom' } });
  const b = await cron.traiterEcheances();
  assert.equal(b.pauses, 1);
  assert.equal(faux.etat.inscriptions[0].statut, 'pause');
  assert.match(faux.etat.inscriptions[0].motif_sortie, /Échec d’envoi/);
});

test('actif : délai dépassé (incertain) → pause immédiate, aucun renvoi à l’aveugle', async () => {
  monter(); process.env.SEQUENCES_AUTO = 'true';
  faux.etat.resendReponse = () => 'timeout';
  await cron.traiterEcheances();
  assert.equal(faux.etat.inscriptions[0].statut, 'pause');
  assert.match(faux.etat.inscriptions[0].motif_sortie, /incertain/i);
  const n = faux.etat.resend.length;
  faux.etat.resendReponse = null; faux.etat.inscriptions[0].statut = 'active'; faux.etat.inscriptions[0].prochaine_le = IL_Y_A(0.01);
  await cron.traiterEcheances();
  assert.equal(faux.etat.resend.length, n, 'toujours bloqué par la clé d’idempotence');
});

test('actif : adresse désabonnée entre-temps → sortie « désabonné », rien d’envoyé', async () => {
  monter(); process.env.SEQUENCES_AUTO = 'true';
  // le prospect est lu une fois (pas opposé) ; la route le découvre bloqué
  faux.etat.envois.push({ id: 50, destinataire: 'agence@martin.fr', statut: 'plainte', mode: 'envoi', modele: 'x', cle_idempotence: 'agence@martin.fr|m:x' });
  await cron.traiterEcheances();
  assert.equal(faux.etat.resend.length, 0);
  assert.equal(faux.etat.inscriptions[0].statut, 'sortie');
});

test('actif : pas de plafond quotidien — 31 inscriptions dues, 31 envois (au-delà de l’ancien plafond de 30)', async () => {
  monter(); process.env.SEQUENCES_AUTO = 'true';
  faux.etat.delaiBase = 0;
  faux.etat.prospects = []; faux.etat.inscriptions = [];
  for (let n = 0; n < 31; n++) {
    const siret = String(10000000000000 + n);
    faux.etat.prospects.push({ siret, email: 'p' + n + '@agence.fr', nom: 'Agence ' + n, statut: 'nouveau' });
    faux.etat.inscriptions.push({ id: n + 1, owner: 'julie@melodia.test', prospect_siret: siret, sequence_id: 7, etape: 0, prochaine_le: IL_Y_A(0.01), statut: 'active', motif_sortie: '', created_at: IL_Y_A(8) });
  }
  const b = await cron.traiterEcheances({ budgetMs: 10 * 60_000 });
  faux.etat.delaiBase = 4;
  assert.equal(b.envoyees, 31);
  assert.equal(new Set(faux.etat.envois.map((l) => l.cle_idempotence)).size, 31);
});

test('échéances : jamais un week-end, jamais avant demain', () => {
  const lundi = Date.UTC(2026, 10, 16, 9); // lundi 16/11/2026
  for (let j = 0; j < 14; j++) {
    const t = cron.echeanceEtape([{ jour: 0 }, { jour: j }], 1, new Date(lundi).toISOString(), lundi);
    const jour = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short' }).format(new Date(t));
    assert.ok(jour !== 'Sat' && jour !== 'Sun', 'j=' + j + ' → ' + jour);
    assert.ok(t >= lundi + 86400_000);
  }
});
