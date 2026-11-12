// Logique pure de la console v4 (assets/js/pro/logique.js, theme.js) et garde-fous
// des sources : marque blanche, icônes, accents lisibles, CSV sûr.
// Les modules du navigateur sont des ES modules en .js : on les copie dans un
// dossier temporaire avec un package.json « module » pour les importer ici.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = 'assets/js/pro';
const tmp = mkdtempSync(join(tmpdir(), 'pro-console-'));
writeFileSync(join(tmp, 'package.json'), '{"type":"module"}');
for (const f of ['logique.js', 'theme.js']) cpSync(join(SRC, f), join(tmp, f));
const L = await import(pathToFileURL(join(tmp, 'logique.js')).href);
const T = await import(pathToFileURL(join(tmp, 'theme.js')).href).catch(() => null);

const NOW = Date.parse('2026-11-12T10:00:00Z');
const iso = (ms) => new Date(NOW + ms).toISOString();
const H = 3600e3, J = 24 * H;
const D = [
  { id: 'a', reference: 'MF-A', prenom: 'Éléonore', titre: 'La lumière', status: 'paroles_a_valider', ceremonie_le: iso(30 * H), created_at: iso(-2 * J), updated_at: iso(-3 * H), mode: 'payant' },
  { id: 'b', reference: 'MF-B', prenom: 'Colette', titre: '', status: 'livre', ceremonie_le: iso(-7 * J), created_at: iso(-9 * J), updated_at: iso(-6 * J), mode: 'payant' },
  { id: 'c', reference: 'MF-C', prenom: 'Joseph', titre: '', status: 'livre', ceremonie_le: null, created_at: iso(-21 * J), updated_at: iso(-18 * J), mode: 'essai' },
  { id: 'd', reference: 'MF-D', prenom: 'Odette', titre: '', status: 'musique_en_cours', ceremonie_le: iso(6 * J), created_at: iso(-1 * J), updated_at: iso(-20 * 60e3), mode: 'essai' },
  { id: 'e', reference: 'MF-E', prenom: 'Simone', titre: '', status: 'brouillon', ceremonie_le: null, created_at: iso(-5 * J), updated_at: iso(-4 * J), mode: null },
  { id: 'f', reference: 'MF-F', prenom: 'Paul', titre: '', status: 'annule', ceremonie_le: iso(20 * H), created_at: iso(-3 * J), updated_at: iso(-2 * J), mode: null }
];

test('recherche : sans accents ni casse, sur prénom, référence et titre', () => {
  assert.deepEqual(L.filtrerDossiers(D, { q: 'ELEONORE' }).map((d) => d.id), ['a']);
  assert.deepEqual(L.filtrerDossiers(D, { q: 'mf-b' }).map((d) => d.id), ['b']);
  assert.deepEqual(L.filtrerDossiers(D, { q: 'lumiere' }).map((d) => d.id), ['a']);
  assert.equal(L.filtrerDossiers(D, { q: 'zzz' }).length, 0);
});

test('filtres : groupes, état, cérémonies sous 48 h, période', () => {
  assert.deepEqual(L.filtrerDossiers(D, { groupe: 'livres', tri: 'prenom' }).map((d) => d.id), ['b', 'c']);
  assert.deepEqual(L.filtrerDossiers(D, { statut: 'brouillon' }).map((d) => d.id), ['e']);
  // « Paul » est annulé : jamais dans les cérémonies à venir
  assert.deepEqual(L.filtrerDossiers(D, { sous48h: true, maintenant: NOW }).map((d) => d.id), ['a']);
  assert.deepEqual(L.filtrerDossiers(D, { du: '2026-11-17', au: '2026-11-19' }).map((d) => d.id), ['d']);
  assert.equal(L.filtrerDossiers(D, { du: '2030-01-01' }).length, 0);
});

test('tris : récent, cérémonie la plus proche, prénom, sens inverse', () => {
  assert.equal(L.filtrerDossiers(D, {})[0].id, 'd');
  const parCer = L.filtrerDossiers(D, { tri: 'ceremonie' }).map((d) => d.id);
  assert.deepEqual(parCer.slice(0, 3), ['b', 'f', 'a']); // passé, puis le plus proche
  assert.deepEqual(parCer.slice(-2).sort(), ['c', 'e']); // sans date : à la fin
  assert.equal(L.filtrerDossiers(D, { tri: 'prenom' })[0].prenom, 'Colette');
  assert.equal(L.filtrerDossiers(D, { tri: 'prenom', sens: 'desc' })[0].prenom, 'Simone');
});

test('compteurs de groupes', () => {
  const c = L.compterGroupes(D);
  assert.equal(c.tous, 6); assert.equal(c.livres, 2); assert.equal(c.a_traiter, 1);
  assert.equal(c.en_cours, 1); assert.equal(c.brouillons, 1); assert.equal(c.clos, 1);
});

test('CSV : séparateur « ; », BOM, guillemets, formules neutralisées', () => {
  assert.equal(L.celluleCsv('=1+1'), "'=1+1");
  assert.equal(L.celluleCsv('+33 6'), "'+33 6");
  assert.equal(L.celluleCsv('@x'), "'@x");
  assert.equal(L.celluleCsv('a;b'), '"a;b"');
  assert.equal(L.celluleCsv('dit "oui"'), '"dit ""oui"""');
  const csv = L.dossiersEnCsv([{ ...D[0], prenom: '=HYPERLINK("x")' }], (s) => 'Libellé ' + s);
  assert.ok(csv.startsWith('﻿Référence;Pour;Titre;État'));
  assert.ok(csv.includes("\"'=HYPERLINK(\"\"x\"\")\""));
  assert.ok(csv.includes('Libellé paroles_a_valider'));
  assert.equal(csv.trimEnd().split('\r\n').length, 2);
});

test('statistiques : calculées sur les dossiers, rien d’estimé', () => {
  const s = L.statistiques(D, new Date(NOW));
  assert.equal(s.total, 6); assert.equal(s.actifs, 5); assert.equal(s.livres, 2); assert.equal(s.essais, 2);
  // lancés = ni brouillon, ni complet, ni en attente de paiement, ni annulé → a, b, c, d
  assert.equal(s.tauxLivraison, 50);
  assert.equal(s.delaiMedianJours, 3); // b : 3 j, c : 3 j
  assert.equal(s.ceremoniesAVenir, 2); // a et d (f est annulé)
  assert.equal(s.mois.length, 6);
  assert.equal(s.mois.at(-1).mois, '2026-11');
  assert.equal(s.mois.at(-1).ouverts, 5); // tous sauf c (ouvert le 22 oct.)
  const vide = L.statistiques([], new Date(NOW));
  assert.equal(vide.tauxLivraison, null); assert.equal(vide.delaiMedianJours, null); assert.equal(vide.total, 0);
});

test('derniersMois : six mois, passage d’année', () => {
  assert.deepEqual(L.derniersMois(3, new Date('2027-01-15T00:00:00Z')), ['2026-11', '2026-12', '2027-01']);
});

test('frise : position selon l’état, dossier clos sans position', () => {
  assert.equal(L.positionDossier('brouillon').index, 0);
  assert.equal(L.positionDossier('paroles_a_valider').index, 2);
  assert.equal(L.positionDossier('musique_en_cours').index, 3);
  assert.deepEqual(L.positionDossier('livre'), { index: 5, termine: true });
  assert.equal(L.positionDossier('annule'), null);
  assert.equal(L.ETAPES.length, 6);
  assert.ok(L.attendGeste('paroles_a_valider')); assert.ok(!L.attendGeste('musique_en_cours'));
});

test('notifications : issues de l’état réel, urgentes d’abord, identifiants stables', () => {
  const n = L.notificationsDepuis(D, NOW);
  assert.equal(n[0].genre, 'urgent');
  assert.ok(n[0].texte.includes('Éléonore'));
  assert.ok(n.some((x) => x.id === 'a:paroles'));
  assert.ok(n.some((x) => x.id === 'b:livre' && x.genre === 'ok'));
  assert.ok(!n.some((x) => x.dossier === 'f'), 'un dossier annulé ne notifie pas');
  assert.ok(!n.some((x) => x.dossier === 'd'), 'une composition en cours ne notifie pas');
  assert.deepEqual(L.notificationsDepuis([], NOW), []);
  assert.equal(new Set(n.map((x) => x.id)).size, n.length);
});

test('prise en main : les étapes se cochent d’après ce qui est fait', () => {
  const e0 = L.etapesAccueil({ logo: false, dossiers: [], qrCrees: false, equipe: 1 });
  assert.equal(e0.filter((x) => x.fait).length, 0);
  const e1 = L.etapesAccueil({ logo: true, dossiers: [D[1]], qrCrees: true, equipe: 2 });
  assert.equal(e1.filter((x) => x.fait).length, 5);
  // les dossiers d’exemple de la démonstration ne comptent pas comme « premier dossier »
  const e2 = L.etapesAccueil({ logo: false, dossiers: [{ ...D[1], exemple: true }], qrCrees: false, equipe: 1 });
  assert.equal(e2.find((x) => x.id === 'dossier').fait, false);
});

test('duplication : le modèle n’emporte RIEN de la personne', () => {
  const q = {
    defunt: { prenom: 'Colette', nom: 'Durand', naissance: '1940-01-02', deces: '2026-11-01', lieux: 'Arles' },
    vie: { metier: 'institutrice', traits: ['tendre'], anecdote: 'Appelez-moi au 06 12 34 56 78' },
    musique: { style: 'Piano classique', energie: 30, instruments: ['piano'], artistes: ['Barbara'] },
    ceremonie: { rite: 'civil', date_ceremonie: '2026-11-05T10:00', lieu: 'Salle X' },
    message: { titre: 'La maîtresse', ton: 'serein', mot: 'Merci' },
    consentements: { visibilite: 'lien', famille_informee: true },
    offre: { mode: 'essai', offre_id: 'essentiel' }
  };
  const m = L.modeleDepuis(q);
  const json = JSON.stringify(m);
  for (const interdit of ['Colette', 'Durand', '1940', '2026', 'Arles', 'institutrice', 'tendre', '06 12', 'La maîtresse', 'Merci', 'Salle X', 'famille_informee']) {
    assert.ok(!json.includes(interdit), 'le modèle contient « ' + interdit + ' »');
  }
  assert.equal(m.musique.style, 'Piano classique');
  assert.equal(m.ceremonie.rite, 'civil');
  assert.equal(m.offre.mode, 'essai');
  assert.deepEqual(m.consentements, {}, 'les consentements se recueillent pour chaque famille');
  m.musique.instruments.push('x');
  assert.deepEqual(q.musique.instruments, ['piano'], 'copie profonde');
  assert.deepEqual(L.modeleDepuis(null).defunt, {});
});

test('barres de forme d’onde : normalisées, robustes', () => {
  assert.deepEqual(L.barresDepuis([], 10), []);
  const sig = Float32Array.from({ length: 1000 }, (_, i) => (i < 500 ? 0.1 : 0.8) * Math.sin(i));
  const b = L.barresDepuis(sig, 10);
  assert.equal(b.length, 10);
  assert.ok(b.every((v) => v >= 0 && v <= 1));
  assert.ok(b[9] > b[0] * 3, 'la partie forte est plus haute que la partie douce');
  const pic = Float32Array.from({ length: 1000 }, (_, i) => (i === 7 ? 1 : 0.2));
  assert.ok(L.barresDepuis(pic, 50).filter((v) => v > 0.5).length >= 40, 'un pic isolé n’écrase pas le reste');
});

test('durée au format m:ss', () => {
  assert.equal(L.formaterDuree(0), '0:00'); assert.equal(L.formaterDuree(351.56), '5:51'); assert.equal(L.formaterDuree(null), '');
});

test('contraste WCAG et accents de la marque blanche', () => {
  assert.ok(Math.abs(L.contraste('#000000', '#ffffff') - 21) < 0.01);
  assert.equal(L.contraste('pas-une-couleur', '#fff'), 0);
  assert.ok(T, 'theme.js importable');
  for (const a of T.ACCENTS.filter((x) => x.sombre)) {
    assert.ok(L.contraste(a.sombre, '#0b0b11') >= 4.5, a.nom + ' illisible sur fond sombre');
    assert.ok(L.contraste(a.clair, '#f4f1ea') >= 4.5, a.nom + ' illisible sur fond clair');
  }
  assert.equal(L.accentPour('#222222', '#0b0b11'), null, 'un accent trop sombre est refusé');
});

// ─── Garde-fous sur les sources servies ───

function sources(dir, re) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...sources(p, re)); else if (re.test(f)) out.push(p);
  }
  return out;
}
const SERVIS = [...sources(SRC, /\.js$/), 'assets/css/pro.css', 'pro.html', 'assets/i18n/pro.fr.json', 'pro.webmanifest'];

// Les motifs sont assemblés : le dépôt interdit d'écrire ces noms en clair (tests/api/site-v3).
const FOURNISSEUR = new RegExp('mur' + 'eka', 'i');
const CODE_MAITRE = new RegExp('master' + 'max', 'i');
test('marque blanche : ni le fournisseur de musique ni le code maître dans ce que la console sert', () => {
  for (const f of SERVIS) {
    const t = readFileSync(f, 'utf8');
    assert.ok(!FOURNISSEUR.test(t), f + ' nomme le fournisseur de musique');
    assert.ok(!CODE_MAITRE.test(t), f + ' nomme le code maître');
  }
});

test('aucune injection HTML par les données : innerHTML limité au SVG produit par le code', () => {
  const permis = new Set(['assets/js/pro/vues/qr.js', 'assets/js/pro/partage.js']);
  for (const f of sources(SRC, /\.js$/)) {
    const t = readFileSync(f, 'utf8');
    if (/\.innerHTML\s*=|insertAdjacentHTML|document\.write|outerHTML\s*=/.test(t)) assert.ok(permis.has(f.replace(/\\/g, '/')), f + ' injecte du HTML');
  }
});

test('toutes les icônes demandées existent', async () => {
  const { readFileSync: lire } = await import('node:fs');
  const src = lire(join(SRC, 'icones.js'), 'utf8');
  const noms = new Set([...src.matchAll(/^\s{2}([a-z]+):\s*'/gm)].map((m) => m[1]));
  assert.ok(noms.size > 25);
  const manquantes = [];
  for (const f of sources(SRC, /\.js$/)) {
    const t = lire(f, 'utf8');
    for (const m of t.matchAll(/icone\('([a-z]+)'/g)) if (!noms.has(m[1])) manquantes.push(f + ' → ' + m[1]);
    for (const m of t.matchAll(/(?:\[|, )'(journee|dossiers|nouveau|statistiques|qr|bibliotheque|facturation|equipe|parametres|aide|admin)', '([a-z]+)'\]/g)) if (!noms.has(m[2])) manquantes.push(f + ' → ' + m[2]);
  }
  assert.deepEqual(manquantes, []);
});

test('mouvement réduit : le CSS et le JS le respectent', () => {
  const css = readFileSync('assets/css/pro.css', 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce/);
  const comp = readFileSync(join(SRC, 'composants.js'), 'utf8');
  assert.match(comp, /prefers-reduced-motion: reduce/);
  assert.match(readFileSync(join(SRC, 'app.js'), 'utf8'), /prefers-reduced-motion: reduce/);
});

test('thème : pas de flash (script de tête) et CSP intacte (aucun script en ligne)', () => {
  const html = readFileSync('pro.html', 'utf8');
  assert.match(html, /<script src="\/assets\/js\/pro\/theme-init\.js"><\/script>/);
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), 'aucun script en ligne dans pro.html');
  assert.ok(!/\bon[a-z]+="/.test(html), 'aucun gestionnaire en ligne');
});
