// File de travaux, plafond quotidien, pipeline complet simulé, mémorial, audio en marque blanche.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tick } from '../../lib/pro/moteur.cjs';
import { retirerBalises, poserBalises, traceFournisseur } from '../../lib/pro/audio.cjs';
import dossiers from '../../lib/pro/routes/dossiers.cjs';
import music from '../../lib/pro/routes/music.cjs';
import admin from '../../lib/pro/routes/admin.cjs';
import qr from '../../lib/pro/routes/qr.cjs';
import memorial from '../../lib/pro/routes/memorial.cjs';
import exporter from '../../lib/pro/routes/export.cjs';
import invitations from '../../lib/pro/routes/invitations.cjs';
import { base, contexte, utilisateur, fauxReseau, creerDossier, ORG_A } from './aide.mjs';

const ENV = { MISTRAL_API_KEY: 'cle-simulee', MUREKA_API_KEY: 'cle-simulee' };

/** Un faux MP3 qui porte, comme souvent, le nom du service dans ses balises. */
function fauxMp3() {
  const texte = Buffer.from('\x03Made with Mureka', 'latin1');
  const cadre = Buffer.concat([Buffer.from('TSSE'), Buffer.from([0, 0, 0, texte.length]), Buffer.from([0, 0]), texte]);
  const id3 = Buffer.concat([Buffer.from('ID3'), Buffer.from([4, 0, 0, 0, 0, 0, cadre.length]), cadre]);
  const trame = Buffer.alloc(417, 0x55); trame[0] = 0xff; trame[1] = 0xfb;
  const v1 = Buffer.alloc(128, 0); Buffer.from('TAGmureka title', 'latin1').copy(v1);
  return Buffer.concat([id3, trame, trame, v1]);
}

function reseauGeneration(compteur) {
  return fauxReseau([
    [/api\.mistral\.ai/, () => {
      compteur.paroles = (compteur.paroles || 0) + 1;
      return { json: { choices: [{ message: { content: JSON.stringify({
        title: 'La maîtresse', lyrics: '[Couplet 1]\nJeanne, ta craie dessinait le monde\n…\n[Refrain]\nJeanne, ta voix reste',
        style_prompt: 'warm piano ballad, in the style of Barbara, gentle strings'
      }) } }], usage: { total_tokens: 900 } } };
    }],
    [/api\.mureka\.ai\/v1\/song\/generate/, (u, o) => {
      compteur.soumis = JSON.parse(o.body);
      return { json: { id: 'tache-1', status: 'preparing' } };
    }],
    [/api\.mureka\.ai\/v1\/song\/query/, () => {
      compteur.suivis = (compteur.suivis || 0) + 1;
      return compteur.suivis < 2
        ? { json: { status: 'running' } }
        : { json: { status: 'succeeded', choices: [{ mp3_url: 'https://cdn.exemple.test/a.mp3', duration_milliseconds: 150000 }] } };
    }],
    [/cdn\.exemple\.test/, () => fauxMp3()]
  ]);
}

async function payer(ctx, id) {
  await ctx.depot.update('pro_dossiers', { id }, { status: 'paye', paid: true });
  await ctx.depot.insert('pro_jobs', { dossier_id: id, type: 'paroles', version: 1, etat: 'a_faire', tentatives: 0, prochain_essai: ctx.maintenant().toISOString(), donnees: {} });
}

test('plafond quotidien non saisi (TBD) : la génération est coupée et la maison alertée', async () => {
  const ctx = contexte(base({ plafond_jour_cents: null }), ENV);
  const id = await creerDossier(ctx);
  await payer(ctx, id);
  const net = reseauGeneration({});
  try {
    const f = await tick(ctx);
    assert.equal(f[0].issue, 'bloque');
    assert.equal(net.appels.length, 0, 'aucun appel fournisseur');
  } finally { net.restaurer(); }
  assert.equal(ctx.depot.tables.pro_jobs[0].etat, 'bloque');
  assert.ok(ctx.depot.tables.pro_audit.some((a) => a.action === 'alerte_plafond_non_configure'));
});

test('plafond quotidien atteint : coupe, même si le dossier est payé', async () => {
  const ctx = contexte(base({ plafond_jour_cents: '100', cout_estime_paroles_cents: '10' }), ENV);
  await ctx.depot.insert('pro_usage', { jour: '2026-11-12', type: 'musique', cout_cents: 95 });
  const id = await creerDossier(ctx);
  await payer(ctx, id);
  const net = reseauGeneration({});
  try { assert.equal((await tick(ctx))[0].issue, 'bloque'); } finally { net.restaurer(); }
  assert.equal(ctx.depot.tables.pro_jobs[0].derniere_erreur, 'PLAFOND_ATTEINT');
});

test('verrou : deux passages simultanés ne traitent le travail qu’une fois', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  await payer(ctx, id);
  const c = {};
  const net = reseauGeneration(c);
  try {
    const [a, b] = await Promise.all([tick(ctx), tick(ctx)]);
    assert.equal(a.length + b.length, 1);
    assert.equal(c.paroles, 1);
  } finally { net.restaurer(); }
});

test('échec fournisseur : nouvel essai différé (backoff), puis échec et alerte', async () => {
  const ctx = contexte(base({ job_tentatives_max: '2' }), ENV);
  const id = await creerDossier(ctx);
  await payer(ctx, id);
  const net = fauxReseau([[/mistral/, () => ({ status: 500, json: {} })]]);
  try {
    assert.equal((await tick(ctx))[0].issue, 'reessai');
    const j = ctx.depot.tables.pro_jobs[0];
    assert.ok(new Date(j.prochain_essai) > ctx.maintenant(), 'différé');
    assert.equal((await tick(ctx)).length, 0, 'pas avant l’échéance');
    ctx.avancer(31_000);
    assert.equal((await tick(ctx))[0].issue, 'echec');
  } finally { net.restaurer(); }
  assert.equal(ctx.depot.tables.pro_dossiers.find((x) => x.id === id).status, 'echec');
  assert.ok(ctx.depot.tables.pro_audit.some((a) => a.action === 'alerte_echec'));
});

test('pipeline complet simulé : payé → paroles → relecture → musique → contrôle maison → livré → mémorial', async () => {
  const ctx = contexte(base(), ENV);
  const ua = utilisateur(ctx.depot, 'jeton-a');
  const um = utilisateur(ctx.depot, 'jeton-maitre');
  const id = await creerDossier(ctx);
  await payer(ctx, id);
  const c = {};
  const net = reseauGeneration(c);
  try {
    // 1. paroles
    await tick(ctx);
    let d = ctx.depot.tables.pro_dossiers.find((x) => x.id === id);
    assert.equal(d.status, 'paroles_a_valider');
    const v1 = ctx.depot.tables.pro_lyrics_versions[0];
    assert.doesNotMatch(v1.prompt_musique.toLowerCase(), /barbara|style of/, 'artiste retiré du prompt');
    assert.match(v1.prompt_musique, /french chanson/);
    // 2. le conseiller relit et corrige le prompt
    const ed = await dossiers({ methode: 'POST', query: {}, utilisateur: ua, corps: {
      action: 'paroles', id, titre: 'La maîtresse', paroles: v1.paroles + '\nJeanne, merci.',
      prompt_musique: 'french chanson, soft piano, like Edith Piaf, warm cello'
    } }, ctx);
    assert.equal(ed.status, 200);
    assert.doesNotMatch(ed.json.prompt_musique, /piaf/i);
    // 3. lancer la musique
    const m = await music({ corps: { dossier_id: id }, utilisateur: ua }, ctx);
    assert.equal(m.status, 202, JSON.stringify(m.json));
    assert.equal(m.json.version, 2);
    await tick(ctx); // soumission
    assert.ok(c.soumis, 'soumis au service de composition');
    assert.doesNotMatch(JSON.stringify(c.soumis), /piaf|barbara/i);
    ctx.avancer(21_000); await tick(ctx); // en cours
    ctx.avancer(21_000); await tick(ctx); // fini → rapatrié
    d = ctx.depot.tables.pro_dossiers.find((x) => x.id === id);
    assert.equal(d.status, 'controle_maison');
  } finally { net.restaurer(); }

  // 4. l'audio stocké ne porte aucune trace du fournisseur
  const [fichier] = [...ctx.depot.fichiers.values()];
  assert.equal(fichier.type, 'audio/mpeg');
  assert.equal(traceFournisseur(fichier.octets), false);
  assert.match(fichier.octets.toString('utf8'), /Melodia Funèbre/);
  assert.doesNotMatch(fichier.octets.toString('utf8'), /Jeanne/, 'pas de prénom dans les métadonnées');

  // 5. l'agence n'entend rien avant la validation maison
  let fiche = await dossiers({ methode: 'GET', query: { id }, utilisateur: ua, corps: {} }, ctx);
  assert.equal(fiche.json.pistes.length, 0);

  // 6. la maison livre
  const piste = ctx.depot.tables.pro_tracks[0];
  const l = await admin({ methode: 'POST', corps: { action: 'livrer', dossier_id: id, piste_id: piste.id }, utilisateur: um }, ctx);
  assert.equal(l.status, 200, JSON.stringify(l.json));
  fiche = await dossiers({ methode: 'GET', query: { id }, utilisateur: ua, corps: {} }, ctx);
  assert.equal(fiche.json.dossier.status, 'livre');
  assert.equal(fiche.json.pistes.length, 1);

  // 7. QR et mémorial
  const q = await qr({ corps: { dossier_id: id }, utilisateur: ua }, ctx);
  assert.match(q.json.qr.url, /^https:\/\/melodia-funebre\.fr\/m\/[0-9A-HJKMNP-TV-Z]{12}$/);
  assert.doesNotMatch(q.json.qr.url, /jeanne|martin/i, 'aucun nom dans l’URL');
  const j = q.json.qr.jeton;
  assert.equal((await memorial({ query: { j } }, ctx)).status, 404, 'pas publié : indisponible');
  await qr({ corps: { dossier_id: id, actif: true, afficher_paroles: true, mot_famille: 'Merci d’être venus.' }, utilisateur: ua }, ctx);
  const page = await memorial({ query: { j } }, ctx);
  assert.equal(page.status, 200);
  assert.equal(page.json.noindex, true);
  assert.equal(page.json.prenom, 'Jeanne');
  assert.match(page.json.audio, /signe=1/);
  assert.equal(page.json.signature, 'Composé par Melodia Funèbre');
  assert.doesNotMatch(JSON.stringify(page.json), /mureka|mistral|openai/i);
  // visibilité par code
  await qr({ corps: { dossier_id: id, visibilite: 'code', code: 'lilas' }, utilisateur: ua }, ctx);
  assert.equal((await memorial({ query: { j } }, ctx)).json.code_requis, true);
  assert.equal((await memorial({ query: { j, code: 'faux' } }, ctx)).status, 403);
  assert.equal((await memorial({ query: { j, code: 'LILAS' } }, ctx)).status, 200);
  // jeton inconnu ou malformé : même réponse
  assert.equal((await memorial({ query: { j: 'ZZZZZZZZZZZZ' } }, ctx)).status, 404);
  assert.equal((await memorial({ query: { j: '../etc' } }, ctx)).status, 404);
});

test('publier le mémorial avant la livraison est refusé', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  const r = await qr({ corps: { dossier_id: id, actif: true }, utilisateur: utilisateur(ctx.depot, 'jeton-a') }, ctx);
  assert.equal(r.status, 409);
});

test('un membre en lecture seule ne modifie rien', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  const r = await dossiers({ methode: 'POST', query: {}, utilisateur: utilisateur(ctx.depot, 'jeton-a-lecture'), corps: { action: 'statut', id, vers: 'complet' } }, ctx);
  assert.equal(r.status, 403);
  const lecture = await dossiers({ methode: 'GET', query: { id }, utilisateur: utilisateur(ctx.depot, 'jeton-a-lecture'), corps: {} }, ctx);
  assert.equal(lecture.status, 200);
});

test('audio : toutes les balises retirées, les nôtres posées', () => {
  const brut = fauxMp3();
  assert.equal(traceFournisseur(brut), true);
  const nu = retirerBalises(brut);
  assert.equal(nu[0], 0xff);
  assert.equal(nu.length, 417 * 2);
  const propre = poserBalises(brut, { titre: 'La maîtresse', annee: 2026 });
  assert.equal(propre.toString('latin1', 0, 3), 'ID3');
  assert.equal(traceFournisseur(propre), false);
});

test('export CSV : formules neutralisées, aucun prénom', async () => {
  const ctx = contexte(base(), ENV);
  const id = await creerDossier(ctx);
  await ctx.depot.insert('pro_payments', { dossier_id: id, org_id: ORG_A, methode: 'stripe', statut: 'paye', montant_cents: 12000, promo_code: '=HYPERLINK("x")', created_at: '2026-11-05T10:00:00.000Z' });
  const r = await exporter({ query: { mois: '2026-11', org_id: ORG_A }, utilisateur: utilisateur(ctx.depot, 'jeton-a') }, ctx);
  assert.equal(r.status, 200);
  assert.match(r.texte, /120,00/);
  assert.match(r.texte, /'=HYPERLINK/);
  assert.doesNotMatch(r.texte, /Jeanne/);
  assert.match(r.texte, /293 B/);
  const refus = await exporter({ query: { mois: '2026-11', org_id: ORG_A }, utilisateur: utilisateur(ctx.depot, 'jeton-b') }, ctx);
  assert.equal(refus.status, 403);
});

test('invitations : lien à usage unique, adresse vérifiée', async () => {
  const ctx = contexte(base(), ENV);
  const ua = utilisateur(ctx.depot, 'jeton-a');
  const r = await invitations({ methode: 'POST', query: {}, corps: { action: 'inviter', org_id: ORG_A, email: 'b@agence-b.test', role: 'conseiller' }, utilisateur: ua }, ctx);
  assert.equal(r.status, 201);
  const jeton = r.json.lien.split('/invitation/')[1];
  assert.doesNotMatch(JSON.stringify(ctx.depot.tables.pro_invitations), new RegExp(jeton), 'le jeton n’est stocké qu’en empreinte');
  const autre = await invitations({ methode: 'POST', query: {}, corps: { action: 'accepter', jeton }, utilisateur: utilisateur(ctx.depot, 'jeton-maitre') }, ctx);
  assert.equal(autre.status, 403);
  const okk = await invitations({ methode: 'POST', query: {}, corps: { action: 'accepter', jeton }, utilisateur: utilisateur(ctx.depot, 'jeton-b') }, ctx);
  assert.equal(okk.status, 200);
  const encore = await invitations({ methode: 'POST', query: {}, corps: { action: 'accepter', jeton }, utilisateur: utilisateur(ctx.depot, 'jeton-b') }, ctx);
  assert.equal(encore.status, 410);
  const lecture = await invitations({ methode: 'POST', query: {}, corps: { action: 'inviter', org_id: ORG_A, email: 'x@y.fr', role: 'owner' }, utilisateur: utilisateur(ctx.depot, 'jeton-a-lecture') }, ctx);
  assert.equal(lecture.status, 403);
});
