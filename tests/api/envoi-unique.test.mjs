// Un même courriel ne part jamais deux fois à la même personne.
// Preuves : magasin mémoire, magasin Supabase émulé (index unique), et route
// /api/prospect-mail de bout en bout (Supabase + Resend simulés), y compris
// des envois concurrents.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { monterFauxServeur, fausseReponse, requete } from './_faux-serveur.mjs';

process.env.SUPABASE_URL = 'https://faux.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_' + 'x'.repeat(30);
process.env.RESEND_API_KEY = 're_faux';
process.env.PROSPECT_FROM = 'Melodia <contact@contact.melodia-funebre.fr>';
process.env.LEAD_TO = '';
delete process.env.SEQUENCES_AUTO;

const U = await import('../../api/_envoi-unique.js');
const mail = await import('../../api/prospect-mail.js');
const handler = mail.default;

// ─── clé d'idempotence ────────────────────────────────────────────
test('clé : Foo@Bar.com = foo@bar.com, espaces ignorés', () => {
  assert.equal(U.cleEnvoi({ destinataire: ' Foo@Bar.com ', modele: 'pf-relance-j4' }), U.cleEnvoi({ destinataire: 'foo@bar.com', modele: 'PF-relance-j4' }));
  assert.equal(U.cleEnvoi({ destinataire: 'A@B.fr', modele: 'm' }), 'a@b.fr|m:m');
});
test('clé : modèle, campagne, objet et étape se distinguent', () => {
  const k = (o) => U.cleEnvoi(Object.assign({ destinataire: 'a@b.fr' }, o));
  assert.notEqual(k({ modele: 'x' }), k({ modele: 'y' }));
  assert.notEqual(k({ modele: 'x', etape: 1 }), k({ modele: 'x', etape: 2 }));
  assert.equal(k({ modele: 'x', etape: 1 }), k({ modele: 'x', etape: 1 }));
  assert.notEqual(k({ campagne: 'salon' }), k({ campagne: 'noel' }));
  assert.equal(k({ sujet: 'Bonjour   Monde' }), k({ sujet: ' bonjour monde ' }));
});
test('clé : toujours en minuscules (contrainte SQL)', () => {
  const c = U.cleEnvoi({ destinataire: 'X@Y.FR', sujet: 'Objet ÉCLATANT' });
  assert.equal(c, c.toLowerCase());
});

// ─── magasin mémoire : concurrence, retry, échec transitoire ──────
function ligne(dest, modele = 'pf-premier-contact', extra = {}) {
  return { cle: U.cleEnvoi({ destinataire: dest, modele }), meta: { destinataire: dest.toLowerCase(), modele }, charge: { to: [dest] }, ...extra };
}

test('concurrence (mémoire) : 20 envois simultanés → un seul appel au prestataire', async () => {
  const store = U.creerStoreMemoire();
  let appels = 0;
  const envoyer = async () => { appels++; await new Promise((r) => setTimeout(r, 5)); return { ok: true, id: 'r1' }; };
  const rs = await Promise.all(Array.from({ length: 20 }, () => U.envoyerUnique({ store, lignes: [ligne('Foo@Bar.com')], envoyer })));
  assert.equal(appels, 1);
  assert.equal(rs.filter((r) => r.envoyes.length === 1).length, 1);
  assert.equal(rs.filter((r) => r.doublons.length === 1).length, 19);
});

test('normalisation : Foo@Bar.com puis foo@bar.com → second refusé', async () => {
  const store = U.creerStoreMemoire();
  let appels = 0;
  const envoyer = async () => { appels++; return { ok: true, id: 'r' }; };
  await U.envoyerUnique({ store, lignes: [ligne('Foo@Bar.com')], envoyer });
  const r2 = await U.envoyerUnique({ store, lignes: [ligne('foo@bar.com')], envoyer });
  assert.equal(appels, 1);
  assert.equal(r2.doublons.length, 1);
});

test('retry après succès : pas de second envoi', async () => {
  const store = U.creerStoreMemoire();
  let appels = 0;
  const envoyer = async () => { appels++; return { ok: true, id: 'r' }; };
  await U.envoyerUnique({ store, lignes: [ligne('a@b.fr')], envoyer });
  const r = await U.envoyerUnique({ store, lignes: [ligne('a@b.fr')], envoyer });
  assert.equal(appels, 1); assert.equal(r.envoyes.length, 0);
});

test('échec transitoire net : la clé est libérée, un nouvel essai est permis — une seule remise au final', async () => {
  const store = U.creerStoreMemoire();
  let n = 0;
  const envoyer = async () => (++n === 1 ? { ok: false, status: 502, code: 'SEND_FAILED', error: 'x' } : { ok: true, id: 'r' });
  const r1 = await U.envoyerUnique({ store, lignes: [ligne('a@b.fr')], envoyer });
  assert.ok(r1.echec && !r1.echec.incertain);
  const r2 = await U.envoyerUnique({ store, lignes: [ligne('a@b.fr')], envoyer });
  assert.equal(r2.envoyes.length, 1);
  const r3 = await U.envoyerUnique({ store, lignes: [ligne('a@b.fr')], envoyer });
  assert.equal(r3.envoyes.length, 0);
  assert.equal(n, 2);
});

test('délai dépassé : résultat incertain, le renvoi reste BLOQUÉ', async () => {
  const store = U.creerStoreMemoire();
  let n = 0;
  const envoyer = async () => { n++; return { ok: false, status: 504, code: 'TIMEOUT', error: 'x' }; };
  const r1 = await U.envoyerUnique({ store, lignes: [ligne('a@b.fr')], envoyer });
  assert.equal(r1.echec.incertain, true);
  const r2 = await U.envoyerUnique({ store, lignes: [ligne('a@b.fr')], envoyer });
  assert.equal(n, 1); assert.equal(r2.doublons[0].deja, 'incertain');
});

test('doublon dans un même lot : une seule remise', async () => {
  const store = U.creerStoreMemoire();
  let charges = 0;
  const envoyer = async (cs) => { charges += cs.length; return { ok: true, ids: cs.map((_, i) => 'r' + i) }; };
  const r = await U.envoyerUnique({ store, lignes: [ligne('a@b.fr'), ligne('A@B.fr'), ligne('c@d.fr')], envoyer });
  assert.equal(charges, 2); assert.equal(r.doublons.length, 1);
});

test('un autre modèle ou une autre étape au même destinataire part', async () => {
  const store = U.creerStoreMemoire();
  const envoyer = async (cs) => ({ ok: true, ids: cs.map(() => 'r') });
  const a = { cle: U.cleEnvoi({ destinataire: 'a@b.fr', modele: 'm', etape: 0 }), meta: { destinataire: 'a@b.fr' }, charge: {} };
  const b = { cle: U.cleEnvoi({ destinataire: 'a@b.fr', modele: 'm', etape: 1 }), meta: { destinataire: 'a@b.fr' }, charge: {} };
  const r = await U.envoyerUnique({ store, lignes: [a], envoyer });
  const r2 = await U.envoyerUnique({ store, lignes: [b], envoyer });
  assert.equal(r.envoyes.length + r2.envoyes.length, 2);
});

// ─── route /api/prospect-mail de bout en bout ─────────────────────
let faux;
before(() => { faux = monterFauxServeur(); });
after(() => { faux.restaurer(); });

const corpsEnvoi = (extra = {}) => Object.assign({
  mode: 'envoi', modele: 'pf-premier-contact', joindreBrochure: false,
  envois: [{ to: 'Contact@Agence-Martin.fr', nom: 'Martin', societe: 'Pompes Martin', ville: 'Lyon' }]
}, extra);
async function appeler(corps) {
  const res = fausseReponse();
  await handler(requete(corps), res);
  return res;
}
function repartir() { mail.reinitialiserMagasinEnvois(); faux.etat.envois.length = 0; faux.etat.resend.length = 0; faux.etat.resendReponse = null; faux.etat.colonneIdempotence = true; faux.etat.journalEnPanne = false; }

test('route : un envoi réussi part, est journalisé (clé, statut envoye, identifiant)', async () => {
  repartir();
  const res = await appeler(corpsEnvoi());
  assert.equal(res.statusCode, 200, JSON.stringify(res.corps));
  assert.equal(faux.etat.resend.length, 1);
  assert.equal(faux.etat.envois.length, 1);
  const l = faux.etat.envois[0];
  assert.equal(l.statut, 'envoye'); assert.equal(l.resend_id, 'rs_1');
  assert.equal(l.cle_idempotence, 'contact@agence-martin.fr|m:pf-premier-contact'.toLowerCase());
  assert.ok(faux.etat.resend[0].entetes['Idempotency-Key'], 'clé d’idempotence transmise au prestataire');
});

test('route : double clic (2 requêtes simultanées) → UN SEUL appel Resend, un seul insert', async () => {
  repartir();
  const [a, b] = await Promise.all([appeler(corpsEnvoi()), appeler(corpsEnvoi())]);
  assert.equal(faux.etat.resend.length, 1, 'un seul appel Resend');
  assert.equal(faux.etat.envois.filter((l) => l.statut !== 'echec').length, 1, 'un seul insert');
  const codes = [a, b].map((r) => r.statusCode).sort();
  assert.deepEqual(codes, [200, 409]);
  const perdant = [a, b].find((r) => r.statusCode === 409);
  assert.equal(perdant.corps.code, 'DEJA_ENVOYE');
});

test('route : 10 requêtes concurrentes (onglets, cron, clics) → un seul courriel', async () => {
  repartir();
  const rs = await Promise.all(Array.from({ length: 10 }, () => appeler(corpsEnvoi())));
  assert.equal(faux.etat.resend.length, 1);
  assert.equal(rs.filter((r) => r.statusCode === 200).length, 1);
});

test('route : retry après succès → refusé, pas de second envoi, adresse en casse différente', async () => {
  repartir();
  await appeler(corpsEnvoi());
  const r2 = await appeler(corpsEnvoi({ envois: [{ to: 'contact@agence-martin.FR', nom: 'Martin', societe: 'Pompes Martin' }] }));
  assert.equal(r2.statusCode, 409);
  assert.equal(faux.etat.resend.length, 1);
});

test('route : même modèle à deux destinataires différents → deux envois', async () => {
  repartir();
  await appeler(corpsEnvoi());
  const r = await appeler(corpsEnvoi({ envois: [{ to: 'autre@agence.fr', nom: 'Autre', societe: 'Autre SARL' }] }));
  assert.equal(r.statusCode, 200);
  assert.equal(faux.etat.resend.length, 2);
});

test('route : un lot avec une adresse déjà servie n’envoie que les nouvelles', async () => {
  repartir();
  await appeler(corpsEnvoi());
  const r = await appeler(corpsEnvoi({ envois: [
    { to: 'contact@agence-martin.fr', nom: 'M', societe: 'S' }, { to: 'neuf@agence.fr', nom: 'N', societe: 'N SARL' }] }));
  assert.equal(r.statusCode, 200);
  assert.equal(r.corps.envoyes.length, 1); assert.equal(r.corps.envoyes[0].to, 'neuf@agence.fr');
  assert.equal(r.corps.refuses[0].code, 'DEJA_ENVOYE');
  assert.equal(faux.etat.resend.length, 2);
});

test('route : échec transitoire du prestataire → réessayable, puis un seul envoi confirmé', async () => {
  repartir();
  faux.etat.resendReponse = (n) => (n <= 4 ? { status: 500, corps: { message: 'boom' } } : null);
  const r1 = await appeler(corpsEnvoi());
  assert.notEqual(r1.statusCode, 200);
  assert.equal(r1.corps.retentable, true);
  assert.equal(faux.etat.envois.filter((l) => l.statut === 'echec').length, 1, 'réservation libérée');
  faux.etat.resendReponse = null;
  const r2 = await appeler(corpsEnvoi());
  assert.equal(r2.statusCode, 200);
  const r3 = await appeler(corpsEnvoi());
  assert.equal(r3.statusCode, 409);
  assert.equal(faux.etat.envois.filter((l) => l.statut === 'envoye').length, 1);
});

test('route : délai dépassé → ENVOI_INCERTAIN, et le renvoi est bloqué', async () => {
  repartir();
  faux.etat.resendReponse = () => 'timeout';
  const r1 = await appeler(corpsEnvoi());
  assert.equal(r1.statusCode, 504); assert.equal(r1.corps.code, 'ENVOI_INCERTAIN');
  const n = faux.etat.resend.length;
  faux.etat.resendReponse = null;
  const r2 = await appeler(corpsEnvoi());
  assert.equal(r2.statusCode, 409);
  assert.equal(faux.etat.resend.length, n, 'aucun nouvel appel au prestataire');
});

test('route : journal en panne → on refuse d’envoyer (jamais de risque de doublon)', async () => {
  repartir();
  faux.etat.journalEnPanne = true;
  const r = await appeler(corpsEnvoi());
  assert.equal(r.statusCode, 503); assert.equal(r.corps.code, 'JOURNAL_INDISPONIBLE');
  assert.equal(faux.etat.resend.length, 0);
});

test('route : migration absente → mode dégradé (verrou mémoire), toujours un seul envoi concurrent', async () => {
  repartir();
  faux.etat.colonneIdempotence = false;
  const rs = await Promise.all([appeler(corpsEnvoi()), appeler(corpsEnvoi()), appeler(corpsEnvoi())]);
  assert.equal(faux.etat.resend.length, 1);
  assert.equal(rs.filter((r) => r.statusCode === 200).length, 1);
  assert.match(rs.find((r) => r.statusCode === 200).corps.note || '', /20261114_12/);
});

test('route : mode test répétable (pas d’idempotence), à soi-même', async () => {
  repartir();
  const a = await appeler(corpsEnvoi({ mode: 'test' }));
  const b = await appeler(corpsEnvoi({ mode: 'test' }));
  assert.equal(a.statusCode, 200); assert.equal(b.statusCode, 200);
  assert.equal(faux.etat.resend.length, 2);
  assert.ok(faux.etat.envois.every((l) => !l.cle_idempotence));
});

test('route : mode deja → indique ce qui est déjà parti (état « déjà envoyé » de la console)', async () => {
  repartir();
  await appeler(corpsEnvoi());
  const r = await appeler({ mode: 'deja', modele: 'pf-premier-contact', envois: [{ to: 'CONTACT@agence-martin.fr' }, { to: 'neuf@agence.fr' }] });
  assert.equal(r.statusCode, 200);
  assert.deepEqual(r.corps.deja.map((x) => x.deja), [true, false]);
});

test('route : adresse désabonnée / rejetée → jamais envoyée', async () => {
  repartir();
  faux.etat.prospects = [{ email: 'Contact@Agence-Martin.fr', oppose: true }];
  const r = await appeler(corpsEnvoi());
  assert.equal(r.statusCode, 400); assert.equal(r.corps.refuses[0].code, 'DESABONNE');
  faux.etat.prospects = [];
  faux.etat.envois.push({ id: 99, destinataire: 'contact@agence-martin.fr', statut: 'rejete', mode: 'envoi', modele: 'autre', cle_idempotence: 'contact@agence-martin.fr|m:autre' });
  const r2 = await appeler(corpsEnvoi());
  assert.equal(r2.corps.refuses[0].code, 'REJETE');
  assert.equal(faux.etat.resend.length, 0);
});

test('route : sans session ou sans rôle → rien ne part', async () => {
  repartir();
  faux.etat.role = 'client';
  const r = await appeler(corpsEnvoi());
  faux.etat.role = 'commercial';
  assert.equal(r.statusCode, 403); assert.equal(faux.etat.resend.length, 0);
});
