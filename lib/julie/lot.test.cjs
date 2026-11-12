'use strict';

// Envoi groupé — côté console : liste de contacts, filtres, sélection, import CSV par collage.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const wasm = require('./wasm-test-helper.cjs');
const L = require('../../assets/js/collaborateur-lot.js');

const PROSPECTS = [
  { siret: '1', email: 'claire@dupont.fr', dirigeant: 'Mme Claire Dupont', nom: 'Pompes funèbres Dupont', ville: 'Lyon', statut: 'nouveau' },
  { siret: '2', email: 'paul@martin.fr', dirigeant: 'Paul Martin', nom: 'Martin & Fils', ville: 'Lyon', statut: 'contacte' },
  { siret: '3', email: 'contact@sans-nom.fr', dirigeant: '', nom: '', ville: '', statut: 'nouveau' },
  { siret: '4', email: 'optout@x.fr', dirigeant: 'Jean Opposé', nom: 'Agence X', ville: 'Paris', statut: 'nouveau', oppose: true },
  { siret: '5', email: '', dirigeant: 'Sans Courriel', nom: 'Agence Y', ville: 'Nice', statut: 'nouveau' },
  { siret: '6', email: 'pas-un-mail', dirigeant: 'Adresse Cassée', nom: 'Agence Z', ville: 'Nice', statut: 'nouveau' }
];
const contacts = PROSPECTS.map(L.contactDe);

test('séparer une personne : civilité, prénom, nom — rien d’inventé', () => {
  assert.deepEqual(L.separerPersonne('Mme Claire Dupont'), { civilite: 'Madame', prenom: 'Claire', nom_famille: 'Dupont' });
  assert.deepEqual(L.separerPersonne('M. Jean-Luc de la Tour'), { civilite: 'Monsieur', prenom: 'Jean-Luc', nom_famille: 'de la Tour' });
  assert.deepEqual(L.separerPersonne('Paul Martin'), { civilite: '', prenom: 'Paul', nom_famille: 'Martin' });
  assert.deepEqual(L.separerPersonne('Dupont'), { civilite: '', prenom: '', nom_famille: 'Dupont' });
  assert.deepEqual(L.separerPersonne('Dr Marie Curie'), { civilite: '', prenom: 'Marie', nom_famille: 'Curie' });
  assert.deepEqual(L.separerPersonne(''), { civilite: '', prenom: '', nom_famille: '' });
  assert.deepEqual(L.separerPersonne(undefined), { civilite: '', prenom: '', nom_famille: '' });
});

test('contact : organisation absente → vide (jamais une fausse agence)', () => {
  const c = contacts[2];
  assert.equal(c.organisation, ''); assert.equal(c.prenom, ''); assert.equal(c.nom_famille, '');
  assert.equal(contacts[0].organisation, 'Pompes funèbres Dupont');
});

test('éligibilité : désabonné, sans adresse, adresse invalide → non cochables', () => {
  assert.deepEqual(contacts.map(L.eligible), [true, true, true, false, false, false]);
});

test('filtres : organisation, ville, statut, recherche (sans accent ni casse)', () => {
  assert.equal(L.filtrer(contacts, { ville: 'Lyon' }).length, 2);
  assert.equal(L.filtrer(contacts, { statut: 'contacte' }).length, 1);
  assert.equal(L.filtrer(contacts, { org: 'Martin & Fils' })[0].email, 'paul@martin.fr');
  assert.equal(L.filtrer(contacts, { q: 'FUNEBRES' }).length, 1);
  assert.equal(L.filtrer(contacts, { q: 'funèbres', ville: 'Paris' }).length, 0);
});

test('« Tout sélectionner » : seulement le sous-ensemble filtré et éligible, jamais toute la base', () => {
  const affiches = L.filtrer(contacts, { ville: 'Lyon' });
  const sel = L.toutSelectionner(affiches, {});
  assert.deepEqual(Object.keys(sel).sort(), ['claire@dupont.fr', 'paul@martin.fr']);
  const tousNice = L.toutSelectionner(L.filtrer(contacts, { ville: 'Nice' }), {});
  assert.deepEqual(Object.keys(tousNice), [], 'adresses absentes / invalides jamais cochées');
  const avecOppose = L.toutSelectionner(L.filtrer(contacts, { ville: 'Paris' }), {});
  assert.deepEqual(Object.keys(avecOppose), [], 'désabonné jamais coché');
  // désélectionner : seulement les affichés
  const garde = L.toutDeselectionner(affiches, Object.assign({}, sel, { 'contact@sans-nom.fr': true }));
  assert.deepEqual(Object.keys(garde), ['contact@sans-nom.fr']);
});

test('dates : jour/mois, année si elle n’est pas l’année courante', () => {
  const now = Date.parse('2026-11-12T10:00:00Z');
  assert.equal(L.dateFr('2026-11-12T09:00:00Z', now), '12/11');
  assert.equal(L.dateFr('2027-01-11T09:00:00Z', now), '11/01/2027');
  assert.equal(L.libelleDeja({ statut: 'envoye', precedent: '2026-11-12T09:00:00Z', renvoi: '2027-01-11T09:00:00Z' }, now),
    'Déjà envoyé le 12/11 — renvoi possible à partir du 11/01/2027');
});

// ─── Import par collage CSV ───
const EXISTANTS = ['claire@dupont.fr'];
async function analyser(texte) { return L.analyserImport(await wasm.csvParser(texte), EXISTANTS); }

test('import CSV : aperçu par ligne, doublons, invalides, déjà présents — rien n’est écrasé', async () => {
  const a = await analyser([
    'civilité;prénom;nom;e-mail;organisation;ville',
    'Mme;Anne;Durand;anne@durand.fr;Pompes Durand;Lille',
    'M.;Luc;Petit;LUC@petit.fr;;',
    ';;;pas-un-mail;X;',
    'M.;Luc;Petit;luc@petit.fr;Autre;',
    'Mme;Claire;Dupont;Claire@Dupont.fr;Pompes funèbres Dupont;Lyon',
    ';;Seul;seul@x.fr;;'
  ].join('\n'));
  assert.equal(a.erreur, undefined);
  assert.deepEqual(a.lignes.map((l) => l.statut), ['nouveau', 'nouveau', 'invalide', 'doublon_import', 'existant', 'nouveau']);
  assert.equal(a.nouveaux, 3); assert.equal(a.ignores, 3);
  assert.equal(a.lignes[0].contact.civilite, 'Madame');
  assert.match(a.lignes[1].motif, /sans organisation/);
  assert.match(a.lignes[4].motif, /rien n’est écrasé/);
  assert.match(a.lignes[2].motif, /invalide/i);
});

test('import CSV : colonnes par synonymes (courriel, société, commune), séparateur « , » ou tabulation', async () => {
  const a = await analyser('Prénom,Nom,Courriel,Société,Commune\nAnne,Durand,anne@durand.fr,Durand SARL,Lille');
  assert.equal(a.nouveaux, 1);
  assert.equal(a.lignes[0].contact.organisation, 'Durand SARL');
  assert.equal(a.lignes[0].contact.ville, 'Lille');
  const b = await analyser('prenom\tnom\temail\nAnne\tDurand\tanne@durand.fr');
  assert.equal(b.nouveaux, 1);
});

test('import CSV : sans colonne e-mail, ou vide → message actionnable, rien d’importable', async () => {
  const a = await analyser('prénom;nom\nAnne;Durand');
  assert.match(a.erreur, /Colonne e-mail introuvable/); assert.equal(a.nouveaux, 0);
  const b = L.analyserImport(null, []);
  assert.match(b.erreur, /Rien à analyser/);
});

test('import CSV : la fiche écrite recompose le nom, sans rien inventer', () => {
  const f = L.ficheDepuisImport({ civilite: 'Madame', prenom: 'Anne', nom_famille: 'Durand', email: 'Anne@Durand.fr', organisation: '', ville: '' });
  assert.equal(f.dirigeant, 'Mme Anne Durand'); assert.equal(f.nom, ''); assert.equal(f.siret, 'imp-anne-durand-fr');
  assert.equal(L.separerPersonne(f.dirigeant).civilite, 'Madame');
  assert.equal(L.ficheDepuisImport({ civilite: '', prenom: '', nom_famille: '', email: 'a@b.fr', organisation: 'X', ville: '' }).dirigeant, '');
});
