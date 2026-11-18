'use strict';
// Phase 1 vente (espace collaborateur) : logique pure de assets/js/julie/julie-vente.js.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const V = require('../../assets/js/julie/julie-vente.js');

const RACINE = path.join(__dirname, '..', '..');
const AUJ = '2026-11-18'; // un mercredi

test('jours ouvrés : jamais un week-end', () => {
  assert.equal(V.plusJoursOuvres(AUJ, 2), '2026-11-20');
  assert.equal(V.plusJoursOuvres(AUJ, 3), '2026-11-23');
  assert.equal(V.plusJoursOuvres('2026-11-21', 0) >= '2026-11-21', true);
});

test('prochaine action : lecture / écriture « type|texte » et anciennes valeurs libres', () => {
  const s = V.ecrireProchaineAction('visite', 'Passer avec la plaquette');
  assert.deepEqual(V.lireProchaineAction(s), { type: 'visite', texte: 'Passer avec la plaquette' });
  assert.equal(V.lireProchaineAction('rappeler mardi').type, 'appel');
  assert.equal(V.lireProchaineAction('').type, '');
  assert.ok(V.ecrireProchaineAction('appel', 'x'.repeat(500)).length <= 200);
});

test('prochaine action obligatoire : date et type exigés, sauf pour « Sans suite »', () => {
  assert.equal(V.validerProchaineAction({ date: '', type: 'appel', aujourdhui: AUJ }).ok, false);
  assert.equal(V.validerProchaineAction({ date: '2026-11-17', type: 'appel', aujourdhui: AUJ }).ok, false);
  assert.equal(V.validerProchaineAction({ date: '2026-11-20', type: '', aujourdhui: AUJ }).ok, false);
  assert.equal(V.validerProchaineAction({ date: '2027-12-01', type: 'appel', aujourdhui: AUJ }).ok, false);
  assert.equal(V.validerProchaineAction({ date: '2026-11-20', type: 'rdv', aujourdhui: AUJ }).ok, true);
  assert.equal(V.validerProchaineAction({ statut: 'refus' }).ok, true);
});

test('sans prochaine action : fiche engagée sans date, ou date oubliée depuis plus de 30 jours', () => {
  assert.equal(V.sansProchaineAction({ statut: 'contacte' }, AUJ), true);
  assert.equal(V.sansProchaineAction({ statut: 'interesse', relance_le: '2026-10-01' }, AUJ), true);
  assert.equal(V.sansProchaineAction({ statut: 'interesse', relance_le: '2026-11-10' }, AUJ), false);
  assert.equal(V.sansProchaineAction({ statut: 'nouveau' }, AUJ), false, 'une fiche jamais contactée vit dans « Nouveaux »');
  assert.equal(V.sansProchaineAction({ statut: 'refus' }, AUJ), false);
  assert.equal(V.sansProchaineAction({ statut: 'contacte', oppose: true }, AUJ), false);
});

test('issues d’appel : statut qui n’avance jamais à rebours, prochaine action toujours posée', () => {
  const r1 = V.appliquerIssue({ statut: 'nouveau' }, 'messagerie', { aujourdhui: AUJ });
  assert.equal(r1.statut, 'contacte');
  assert.equal(r1.relance_le, '2026-11-20');
  assert.equal(V.lireProchaineAction(r1.prochaine_action).type, 'appel');
  const r2 = V.appliquerIssue({ statut: 'demo_offerte' }, 'interesse', { aujourdhui: AUJ, note: '  Veut   écouter  ' });
  assert.equal(r2.statut, 'demo_offerte');
  assert.equal(r2.journal.detail, 'Veut écouter');
  assert.match(r2.journal.quoi, /^Appel/);
  const r3 = V.appliquerIssue({ statut: 'contacte' }, 'interesse', { aujourdhui: AUJ, date: '2026-11-30' });
  assert.equal(r3.statut, 'interesse');
  assert.equal(r3.relance_le, '2026-11-30');
  const stop = V.appliquerIssue({ statut: 'interesse' }, 'stop', { aujourdhui: AUJ });
  assert.equal(stop.statut, 'refus');
  assert.equal(stop.oppose, true);
  assert.equal(stop.relance_le, '');
  assert.equal(stop.prochaine_action, '');
  assert.equal(V.appliquerIssue({}, 'inconnue'), null);
  for (const is of V.ISSUES) {
    const r = V.appliquerIssue({ statut: 'contacte' }, is.id, { aujourdhui: AUJ });
    if (!is.oppose) assert.ok(V.validerProchaineAction({ date: r.relance_le, type: V.lireProchaineAction(r.prochaine_action).type, aujourdhui: AUJ }).ok, is.id);
  }
});

test('faits du jour : appels et relances relus dans les journaux, courriels depuis le quota', () => {
  const p = [
    { journal: [{ le: '2026-11-18T09:00:00Z', quoi: 'Appel — messagerie' }, { le: '2026-11-18T10:00:00Z', quoi: 'Relance envoyée' }, { le: '2026-11-17T10:00:00Z', quoi: 'Appel — intéressé' }] },
    { journal: [{ le: '2026-11-18T23:30:00Z', quoi: 'Appel — à rappeler' }, { le: '2026-11-18T11:00:00Z', quoi: 'Statut' }] }
  ];
  // 23:30 UTC le 18 = 00:30 le 19 à Paris : ne compte pas
  assert.deepEqual(V.faitsDuJour(p, AUJ, 12), { mails: 12, appels: 1, relances: 1 });
  assert.deepEqual(V.objectifPropre({ mails: '40', appels: -1, relances: 'x' }), { mails: 40, appels: 5, relances: 3 });
});

test('chronologie : notes et courriels mêlés, du plus récent au plus ancien, sans les tests', () => {
  const l = V.chronologie({ email: 'A@B.fr', journal: [{ le: '2026-11-10T10:00:00Z', quoi: 'Appel — messagerie' }] }, [
    { destinataire: 'a@b.fr', envoye_le: '2026-11-12T10:00:00Z', sujet: 'Bonjour', statut: 'ouvert', mode: 'envoi' },
    { destinataire: 'a@b.fr', envoye_le: '2026-11-13T10:00:00Z', sujet: 'Essai', statut: 'envoye', mode: 'test' },
    { destinataire: 'autre@b.fr', envoye_le: '2026-11-14T10:00:00Z', sujet: 'Autre', statut: 'envoye', mode: 'envoi' }
  ]);
  assert.equal(l.length, 2);
  assert.equal(l[0].genre, 'courriel');
  assert.match(l[0].detail, /ouvert/);
  assert.equal(l[1].genre, 'note');
});

const contenu = JSON.parse(fs.readFileSync(path.join(RACINE, 'assets/data/content.json'), 'utf8'));

test('proposition : estimation sur l’offre mise en avant, 60 % pour la maison', () => {
  const offres = V.offresDepuisContenu(contenu);
  assert.ok(offres.length >= 2);
  const ref = offres.find((o) => o.mise);
  assert.equal(ref.agence, Math.round(ref.prix * 0.6));
  const c = V.calculerProposition({ offres, ceremonies: 200, part: 5 });
  assert.equal(c.familles, 10);
  assert.equal(c.parAn, 10 * ref.agence);
  assert.equal(V.calculerProposition({ offres, ceremonies: 200, part: 0 }).part, 5);
  assert.equal(V.calculerProposition({ offres, ceremonies: 99999 }).ceremonies, 5000);
  assert.equal(V.euros(12345), '12\u00a0345\u00a0€');
});

test('proposition : œuvres publiques uniquement — titre, style, lien d’écoute existant, jamais l’histoire', () => {
  const o = V.oeuvresDepuisContenu(contenu, 'https://melodia-funebre.fr', 'julie-serve');
  assert.ok(o.length > 0);
  for (const x of o) {
    assert.deepEqual(Object.keys(x).sort(), ['id', 'style', 'titre', 'url']);
    assert.match(x.url, /^https:\/\/melodia-funebre\.fr\/ecouter\/[a-z0-9-]+\?parrain=julie-serve$/);
    const page = 'ecouter-' + x.url.split('/ecouter/')[1].split('?')[0] + '.html';
    assert.ok(fs.existsSync(path.join(RACINE, page)), page + ' introuvable');
  }
  assert.ok(!/\?parrain/.test(V.oeuvresDepuisContenu(contenu, '', 'Pas Valide!')[0].url));
});

test('proposition : le PDF se construit avec l’écrivain maison (aucune dépendance)', async () => {
  const { Pdf } = await import(path.join(RACINE, 'assets/js/pro/pdf.js'));
  const offres = V.offresDepuisContenu(contenu);
  const oeuvres = V.oeuvresDepuisContenu(contenu, 'https://melodia-funebre.fr', 'julie-serve').slice(0, 3);
  const qr = () => ({ taille: 21, modules: Array.from({ length: 21 }, (_, i) => Array.from({ length: 21 }, (_, j) => (i + j) % 2 === 0)) });
  const pdf = V.dessinerProposition(new Pdf(), {
    agence: { nom: 'Pompes Funèbres Martin', ville: 'Lyon' }, date: '18 novembre 2026',
    calcul: V.calculerProposition({ offres, ceremonies: 180, part: 5 }), oeuvres,
    contact: { nom: 'Julie Serve', role: 'Conseillère partenariats', email: 'julie@melodia-funebre.fr', tel: '06 00 00 00 00' }
  }, qr);
  const blob = pdf.blob();
  const octets = Buffer.from(await blob.arrayBuffer());
  assert.equal(octets.subarray(0, 5).toString('latin1'), '%PDF-');
  assert.match(octets.subarray(-8).toString('latin1'), /%%EOF/);
  assert.ok(octets.length > 2000);
  // sans QR : toujours valide
  const sans = V.dessinerProposition(new Pdf(), { calcul: V.calculerProposition({ offres, ceremonies: 0 }) });
  assert.equal(Buffer.from(await sans.blob().arrayBuffer()).subarray(0, 5).toString('latin1'), '%PDF-');
});

test('menu en cinq espaces : chaque vue de la console y figure, une seule fois', () => {
  const html = fs.readFileSync(path.join(RACINE, 'dashboard-commercial.html'), 'utf8');
  const side = html.slice(html.indexOf('id="side"'), html.indexOf('class="side-foot"'));
  const vues = [...side.matchAll(/data-v="([a-z]+)"/g)].map((m) => m[1]);
  const espaces = V.ESPACES.flatMap((e) => e.vues);
  assert.equal(V.ESPACES.length, 5);
  assert.equal(new Set(espaces).size, espaces.length);
  assert.deepEqual([...vues].sort(), [...espaces].sort());
  const titres = [...side.matchAll(/class="side-label">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(titres, V.ESPACES.map((e) => e.titre));
  const mob = [...side.matchAll(/data-mob="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(mob.length <= 4 && mob.includes('Appeler'), mob.join(','));
});
