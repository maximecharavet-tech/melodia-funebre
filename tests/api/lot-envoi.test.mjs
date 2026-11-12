// Envoi groupé personnalisé : un clic, une file, les mêmes garde-fous que l'envoi unitaire.
// Supabase et Resend sont simulés ; aucun mail réel ne part.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { monterFauxServeur, fausseReponse, requete } from './_faux-serveur.mjs';

process.env.SUPABASE_URL = 'https://faux.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_' + 'x'.repeat(30);
process.env.RESEND_API_KEY = 're_faux';
process.env.PROSPECT_FROM = 'Melodia <contact@contact.melodia-funebre.fr>';
process.env.LEAD_TO = '';
delete process.env.SEQUENCES_AUTO;

const L = await import('../../api/_lot-envoi.js');
const O = await import('../../api/_prospect-outils.js');
const mail = await import('../../api/prospect-mail.js');
const handler = mail.default;

let faux;
before(() => { faux = monterFauxServeur({ delaiBase: 1 }); });
after(() => { faux.restaurer(); });

const JOUR = 86400000;
function repartir() {
  mail.reinitialiserMagasinEnvois();
  const e = faux.etat;
  e.envois.length = 0; e.resend.length = 0; e.resendReponse = null; e.colonneIdempotence = true; e.journalEnPanne = false;
  e.prospects = []; e.role = 'commercial'; e.lots.length = 0; e.lotItems.length = 0; e.tablesLotsAbsentes = false;
}
async function appeler(corps, extra) {
  const res = fausseReponse();
  const req = Object.assign(requete(corps), { __pauseLot: 0 }, extra || {});
  await handler(req, res);
  return res;
}
const DEST = [
  { email: 'Dupont@agence-a.fr', prenom: 'Claire', nom_famille: 'Dupont', civilite: 'Madame', organisation: 'Pompes Dupont', ville: 'Lyon' },
  { email: 'martin@agence-b.fr', prenom: 'Paul', nom_famille: 'Martin', civilite: '', organisation: '', ville: '' },
  { email: 'sans-nom@agence-c.fr', organisation: 'Maison C' }
];
const creer = (dest = DEST, extra = {}) => appeler(Object.assign({ mode: 'lot_creer', modele: 'pf-premier-contact', destinataires: dest }, extra));
const traiter = (id) => appeler({ mode: 'lot_traiter', lot_id: id });
async function tout(id) { let r; do { r = await traiter(id); } while (r.corps.lot && r.corps.lot.statut === 'en_cours' && r.statusCode === 200); return r; }
const parEmail = (corps) => Object.fromEntries(corps.items.map((x) => [x.email, x]));

// ─── personnalisation et replis ──────────────────────────────────
test('salutation : civilité + nom, prénom, nom complet hérité, rien → « Bonjour, » ; jamais « undefined »', () => {
  const s = (v) => O.remplir('Bonjour{civilite},', v);
  assert.equal(s({ civ: 'Mme', nomFamille: 'Dupont', prenom: 'Claire' }), 'Bonjour Madame Dupont,');
  assert.equal(s({ civ: 'M.', nomFamille: 'Martin' }), 'Bonjour Monsieur Martin,');
  assert.equal(s({ prenom: 'Paul', nomFamille: 'Martin' }), 'Bonjour Paul,');
  assert.equal(s({ nom: 'Marie Dupont' }), 'Bonjour Marie Dupont,');
  assert.equal(s({}), 'Bonjour,');
  assert.equal(s({ nomFamille: 'Martin' }), 'Bonjour,', 'nom de famille seul : formule neutre');
  assert.equal(s({ civ: 'Madame' }), 'Bonjour,', 'civilité sans nom : formule neutre');
  assert.equal(s({ civ: 'inconnue', prenom: 'Léa' }), 'Bonjour Léa,');
  for (const v of [{}, { prenom: undefined }, { civ: null }]) assert.doesNotMatch(O.remplir('{civilite}{agence}{ville_rel}', v), /undefined|null/);
  assert.equal(O.varsNormalisees({}).organisation, '');
  assert.equal(O.varsNormalisees({ organisation: 'Maison C' }).agence, 'Maison C');
});

test('aperçu serveur par destinataire : même texte que celui qui partira', async () => {
  repartir();
  const r = await appeler({ mode: 'apercu', modele: 'pf-premier-contact', envois: [{ to: 'a@b.fr', prenom: 'Claire', nom_famille: 'Dupont', civilite: 'Mme', societe: 'Pompes Dupont', ville: 'Lyon' }] });
  assert.equal(r.statusCode, 200);
  assert.match(r.corps.sujet, /Pompes Dupont/);
  assert.match(r.corps.html, /Bonjour Madame Dupont,/);
  assert.doesNotMatch(r.corps.html, /undefined/);
  const sans = await appeler({ mode: 'apercu', modele: 'pf-premier-contact', envois: [{ to: 'a@b.fr' }] });
  assert.match(sans.corps.html, /Bonjour,/);
  assert.match(sans.corps.sujet, /Une chanson originale pour vos familles/, 'organisation absente : on n’invente rien');
});

// ─── cas nominal ─────────────────────────────────────────────────
test('lot : un clic crée le lot, tout part, chaque mail est personnalisé', async () => {
  repartir();
  const c = await creer();
  assert.equal(c.statusCode, 200, JSON.stringify(c.corps));
  assert.equal(c.corps.lot.total, 3); assert.equal(c.corps.lot.statut, 'en_cours');
  const r = await tout(c.corps.lot.id);
  assert.equal(r.corps.lot.statut, 'termine');
  assert.equal(r.corps.compte.envoye, 3);
  assert.equal(r.corps.progression, 100);
  assert.equal(faux.etat.resend.length, 3);
  const textes = faux.etat.resend.map((x) => x.corps.text);
  assert.ok(textes.some((t) => /Bonjour Madame Dupont,/.test(t)));
  assert.ok(textes.some((t) => /Bonjour Paul,/.test(t)));
  assert.ok(textes.some((t) => /^Bonjour,/.test(t)), 'sans nom : formule neutre');
  assert.ok(textes.every((t) => !/undefined/.test(t)));
  assert.equal(faux.etat.envois.filter((x) => x.statut === 'envoye').length, 3, 'journal de l’envoi unitaire');
  assert.match(r.corps.bilan, /^3 envoyés/);
});

test('lot : sélection vide refusée, modèle inconnu refusé, adresses invalides écartées', async () => {
  repartir();
  let r = await creer([]);
  assert.equal(r.statusCode, 400); assert.equal(r.corps.code, 'SELECTION_VIDE');
  r = await creer([{ email: 'pas-une-adresse' }]);
  assert.equal(r.statusCode, 400); assert.equal(r.corps.code, 'SELECTION_VIDE');
  r = await appeler({ mode: 'lot_creer', modele: 'inconnu', destinataires: DEST });
  assert.equal(r.corps.code, 'MODELE_INCONNU');
  r = await creer([DEST[0], { email: 'nope' }, { email: 'DUPONT@agence-a.fr' }]);
  assert.equal(r.corps.lot.total, 1);
  assert.equal(r.corps.invalides.length, 1); assert.equal(r.corps.doublonsSelection, 1);
  assert.equal(faux.etat.resend.length, 0, 'créer ne n’envoie rien');
});

test('lot : un second lot pendant qu’un lot est en cours → refusé (pas de double clic)', async () => {
  repartir();
  const [a, b] = await Promise.all([creer(), creer()]);
  assert.deepEqual([a.statusCode, b.statusCode].sort(), [200, 409]);
  assert.equal([a, b].find((x) => x.statusCode === 409).corps.code, 'LOT_EN_COURS');
});

// ─── doublons de la fenêtre, désabonnés, erreurs ─────────────────
test('lot : les doublons de moins de 60 jours sont sautés (jamais renvoyés) avec leurs dates, ceux de plus de 60 jours partent', async () => {
  repartir();
  const ligne = (dest, jours) => ({ id: 700 + jours, destinataire: dest, modele: 'pf-premier-contact', mode: 'envoi', statut: 'envoye',
    cle_idempotence: dest + '|m:pf-premier-contact', envoye_le: new Date(Date.now() - jours * JOUR).toISOString() });
  faux.etat.envois.push(ligne('dupont@agence-a.fr', 30), ligne('martin@agence-b.fr', 61));
  const c = await creer();
  const r = await tout(c.corps.lot.id);
  const x = parEmail(r.corps);
  assert.equal(x['dupont@agence-a.fr'].statut, 'deja');
  assert.match(x['dupont@agence-a.fr'].detail, /Déjà envoyé le \d\d\/\d\d — renvoi possible à partir du/);
  assert.ok(x['dupont@agence-a.fr'].precedent && x['dupont@agence-a.fr'].renvoi);
  assert.equal(x['martin@agence-b.fr'].statut, 'envoye', 'précédent à 61 jours : renvoi autorisé');
  assert.equal(x['sans-nom@agence-c.fr'].statut, 'envoye');
  assert.equal(faux.etat.resend.length, 2);
  assert.equal(r.corps.compte.deja, 1);
  assert.match(r.corps.bilan, /1 déjà envoyé \(moins de 2 mois, sautés\)/);
  assert.equal(r.corps.lot.statut, 'termine');
});

test('lot : un désabonné est écarté, le reste continue', async () => {
  repartir();
  faux.etat.prospects = [{ email: 'Martin@Agence-B.fr', oppose: true }];
  const r = await tout((await creer()).corps.lot.id);
  const x = parEmail(r.corps);
  assert.equal(x['martin@agence-b.fr'].statut, 'desabonne');
  assert.equal(r.corps.compte.envoye, 2);
  assert.equal(faux.etat.resend.length, 2);
  assert.ok(faux.etat.resend.every((y) => !y.corps.to.includes('martin@agence-b.fr')));
});

test('lot : erreur partielle — le destinataire en erreur est signalé, le reste du lot part', async () => {
  repartir();
  faux.etat.resendReponse = (n) => (n === 2 ? { status: 422, corps: { message: 'adresse refusée' } } : null);
  const r = await tout((await creer()).corps.lot.id);
  assert.equal(r.corps.compte.envoye, 2); assert.equal(r.corps.compte.erreur, 1);
  const e = r.corps.items.find((x) => x.statut === 'erreur');
  assert.ok(e.detail.length > 20, 'message actionnable');
  assert.equal(r.corps.lot.statut, 'termine');
  assert.match(r.corps.bilan, /1 erreur/);
  assert.equal(faux.etat.envois.filter((x) => x.statut === 'echec').length, 1, 'réservation libérée');
});

test('lot : rôle perdu → refusé dès l’entrée, le lot reste intact et reprenable', async () => {
  repartir();
  const c = await creer();
  faux.etat.role = 'client';
  const r = await traiter(c.corps.lot.id);
  assert.equal(r.statusCode, 403);
  assert.equal(faux.etat.resend.length, 0);
  faux.etat.role = 'commercial';
  const fin = await tout(c.corps.lot.id);
  assert.equal(fin.corps.compte.envoye, 3);
});

test('lot : session expirée / service indisponible en cours de route → lot arrêté, destinataire non consommé, reprise possible', async () => {
  for (const [status, code] of [[401, 'NON_CONNECTE'], [503, 'JOURNAL_INDISPONIBLE'], [503, 'NOT_CONFIGURED']]) {
    const store = L.creerStoreLotsMemoire();
    let n = 0;
    const ctx = { store, quota: async () => ({ jour: 0, mois: 0 }), pauseMs: 0, repondre: (c, corps) => ({ code: c, corps }),
      envoyerUn: async () => (++n === 2 ? { status, corps: { code } } : { status: 200, corps: { envoyes: [{ id: 'r' }] } }) };
    const qui = { email: 'julie@melodia.test', role: 'commercial', nom: 'Julie' };
    const c = await L.gererLots('lot_creer', { modele: 'pf-premier-contact', destinataires: [{ email: 'a@x.fr' }, { email: 'b@x.fr' }, { email: 'c@x.fr' }] }, qui, ctx);
    const r = await L.gererLots('lot_traiter', { lot_id: c.corps.lot.id }, qui, ctx);
    assert.equal(r.corps.lot.statut, 'arrete', code);
    assert.equal(r.corps.compte.envoye, 1); assert.equal(r.corps.compte.attente, 2, 'le destinataire en cours n’est pas consommé');
    assert.ok(r.corps.arret.message.length > 20);
    ctx.envoyerUn = async () => ({ status: 200, corps: { envoyes: [{ id: 'r' }] } });
    await L.gererLots('lot_reprendre', { lot_id: c.corps.lot.id }, qui, ctx);
    const fin = await L.gererLots('lot_traiter', { lot_id: c.corps.lot.id }, qui, ctx);
    assert.equal(fin.corps.compte.envoye, 3); assert.equal(fin.corps.lot.statut, 'termine');
  }
});

// ─── concurrence ─────────────────────────────────────────────────
test('concurrence : deux onglets traitent le même lot → chaque destinataire part UNE fois', async () => {
  repartir();
  const c = await creer(Array.from({ length: 8 }, (_, i) => ({ email: 'p' + i + '@agence.fr', prenom: 'P' + i })));
  const id = c.corps.lot.id;
  await Promise.all([tout(id), tout(id), tout(id)]);
  assert.equal(faux.etat.resend.length, 8);
  const lu = await appeler({ mode: 'lot_etat', lot_id: id });
  assert.equal(lu.corps.compte.envoye, 8);
  assert.equal(new Set(faux.etat.resend.map((x) => x.corps.to[0])).size, 8);
});

test('concurrence : un destinataire du lot écrit en même temps en envoi unitaire → un seul courriel', async () => {
  repartir();
  const c = await creer([DEST[0]]);
  const unitaire = appeler({ mode: 'envoi', modele: 'pf-premier-contact', joindreBrochure: false, envois: [{ to: 'dupont@agence-a.fr', nom: 'Dupont', societe: 'X' }] });
  const [, u] = await Promise.all([tout(c.corps.lot.id), unitaire]);
  assert.equal(faux.etat.resend.length, 1);
  const lot = await appeler({ mode: 'lot_etat', lot_id: c.corps.lot.id });
  const statuts = [lot.corps.items[0].statut, u.statusCode === 200 ? 'envoye' : 'deja'].sort();
  assert.deepEqual(statuts, ['deja', 'envoye']);
});

// ─── quotas ──────────────────────────────────────────────────────
test('quota quotidien : arrêt propre, reste reporté, bilan clair, reprise un autre jour', async () => {
  repartir();
  const rempli = Array.from({ length: 98 }, (_, i) => ({ id: 5000 + i, destinataire: 'x' + i + '@z.fr', modele: 'autre', mode: 'envoi', statut: 'envoye', cle_idempotence: 'x' + i + '@z.fr|m:autre', envoye_le: new Date().toISOString() }));
  faux.etat.envois.push(...rempli);
  const c = await creer(Array.from({ length: 5 }, (_, i) => ({ email: 'q' + i + '@agence.fr', prenom: 'Q' + i })));
  const r = await tout(c.corps.lot.id);
  assert.equal(r.corps.compte.envoye, 2);
  assert.equal(r.corps.compte.reporte, 3);
  assert.equal(r.corps.lot.statut, 'quota');
  assert.match(r.corps.bilan, /2 envoyés .*3 reportés faute de quota quotidien/);
  assert.match(r.corps.lot.note, /Quota quotidien Resend atteint/);
  assert.equal(faux.etat.resend.length, 2);
  assert.equal(r.corps.quota.restantJour, 0);
  // lendemain : le compteur est vide, un clic reprend
  faux.etat.envois.splice(0, 98);
  const rep = await appeler({ mode: 'lot_reprendre', lot_id: c.corps.lot.id });
  assert.equal(rep.corps.lot.statut, 'en_cours');
  const fin = await tout(c.corps.lot.id);
  assert.equal(fin.corps.compte.envoye, 5);
  assert.equal(faux.etat.resend.length, 5);
});

test('quotas (unitaire) : plafond mensuel de 3 000, plafond quotidien de 100, débit limité', async () => {
  assert.equal(L.QUOTA_JOUR, 100); assert.equal(L.QUOTA_MOIS, 3000);
  assert.ok(L.THROTTLE_MS >= 500, 'une pause raisonnable entre deux envois');
  const store = L.creerStoreLotsMemoire();
  let envoyes = 0;
  const ctx = { store, quota: async () => ({ jour: 5, mois: 2999 }), pauseMs: 0, repondre: (code, corps) => ({ code, corps }),
    envoyerUn: async () => { envoyes++; return { status: 200, corps: { envoyes: [{ id: 'r' }] } }; } };
  const qui = { email: 'julie@melodia.test', role: 'commercial', nom: 'Julie' };
  const c = await L.gererLots('lot_creer', { modele: 'pf-premier-contact', destinataires: [{ email: 'a@x.fr' }, { email: 'b@x.fr' }, { email: 'c@x.fr' }] }, qui, ctx);
  const r = await L.gererLots('lot_traiter', { lot_id: c.corps.lot.id }, qui, ctx);
  assert.equal(envoyes, 1);
  assert.equal(r.corps.compte.reporte, 2);
  assert.match(r.corps.bilan, /faute de quota mensuel/);
  assert.equal(r.corps.lot.statut, 'quota');
});

// ─── permissions, persistance ────────────────────────────────────
test('permissions : un client ne crée ni ne traite de lot ; un autre collaborateur ne lit pas mon lot', async () => {
  repartir();
  const c = await creer();
  faux.etat.role = 'client';
  const r = await creer();
  assert.equal(r.statusCode, 403); assert.equal(r.corps.code, 'INTERDIT');
  faux.etat.role = 'commercial';
  assert.equal(faux.etat.resend.length, 0);
  // lot d'un autre propriétaire
  faux.etat.lots.find((l) => l.id === c.corps.lot.id).proprietaire = 'autre@melodia.test';
  const lu = await appeler({ mode: 'lot_etat', lot_id: c.corps.lot.id });
  assert.equal(lu.statusCode, 403);
  const t = await traiter(c.corps.lot.id);
  assert.equal(t.statusCode, 403);
  assert.equal(faux.etat.resend.length, 0);
});

test('persistance : après rechargement (autre instance), l’état du dernier lot est relu sans rien relancer', async () => {
  repartir();
  const c = await creer();
  await tout(c.corps.lot.id);
  const n = faux.etat.resend.length;
  mail.reinitialiserMagasinEnvois(); // une autre instance : plus aucune mémoire
  const lu = await appeler({ mode: 'lot_etat' });
  assert.equal(lu.corps.lot.id, c.corps.lot.id);
  assert.equal(lu.corps.lot.statut, 'termine');
  assert.equal(lu.corps.compte.envoye, 3);
  assert.equal(lu.corps.lot.persistant, true);
  assert.equal(faux.etat.resend.length, n, 'lire l’état ne renvoie rien');
  assert.equal((await appeler({ mode: 'lot_traiter', lot_id: c.corps.lot.id })).corps.compte.envoye, 3);
  assert.equal(faux.etat.resend.length, n, 'traiter un lot terminé ne renvoie rien');
});

test('migration 13 absente : mode dégradé en mémoire, signalé (persistant: false), le lot fonctionne', async () => {
  repartir();
  faux.etat.tablesLotsAbsentes = true;
  const c = await creer();
  assert.equal(c.statusCode, 200, JSON.stringify(c.corps));
  assert.equal(c.corps.lot.persistant, false);
  const r = await tout(c.corps.lot.id);
  assert.equal(r.corps.compte.envoye, 3);
});

test('lot annulé : les destinataires restants ne partent pas', async () => {
  repartir();
  const c = await creer();
  const r = await appeler({ mode: 'lot_annuler', lot_id: c.corps.lot.id });
  assert.equal(r.corps.lot.statut, 'annule');
  assert.equal(r.corps.compte.ignore, 3);
  assert.equal((await traiter(c.corps.lot.id)).corps.compte.envoye, 0);
  assert.equal(faux.etat.resend.length, 0);
});

test('le lot n’ajoute pas de copie « maison » à chaque courriel (une seule, la première)', async () => {
  repartir();
  const bak = process.env.LEAD_TO; process.env.LEAD_TO = 'maison@melodia.test';
  try {
    const r = await tout((await creer()).corps.lot.id);
    assert.equal(r.corps.compte.envoye, 3);
    const avecBcc = faux.etat.resend.filter((x) => x.corps.bcc && x.corps.bcc.length);
    assert.ok(avecBcc.length <= 1, 'copies maison : ' + avecBcc.length);
  } finally { process.env.LEAD_TO = bak || ''; }
});
