// Premiers courriels de prospection : un lien clair, direct et fonctionnel vers
// le site, dans le HTML (bouton + lien visible) ET dans le texte brut — en plus
// du désabonnement. Rendu par le vrai /api/prospect-mail (Resend simulé : rien ne part).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { monterFauxServeur, fausseReponse, requete } from './_faux-serveur.mjs';

process.env.SUPABASE_URL = 'https://faux.supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_' + 'x'.repeat(30);
process.env.RESEND_API_KEY = 're_faux';
process.env.PROSPECT_FROM = 'Melodia <contact@contact.melodia-funebre.fr>';
process.env.LEAD_TO = '';
delete process.env.SEQUENCES_AUTO;

const mail = await import('../../api/prospect-mail.js');
const C = await import('../../api/_courrier.js');
const SIRET = '12345678900012';
let faux;
before(() => { faux = monterFauxServeur(); });
after(() => { faux.restaurer(); });

const repartir = () => { mail.reinitialiserMagasinEnvois(); faux.etat.envois.length = 0; faux.etat.resend.length = 0; faux.etat.resendReponse = null; faux.etat.colonneIdempotence = true; faux.etat.journalEnPanne = false; };
async function envoyer(modele, layout) {
  repartir();
  const res = fausseReponse();
  await mail.default(requete({ mode: 'envoi', modele, layout, joindreBrochure: false,
    envois: [{ to: 'contact@agence-martin.fr', ref: SIRET, nom: 'Martin', societe: 'Pompes Martin', ville: 'Lyon' }] }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.corps));
  const c = faux.etat.resend[0].corps;
  return Array.isArray(c) ? c[0] : c;
}
const SITE_HREF = /href="https:\/\/melodia-funebre\.fr\/?(?:\?parrain=julie-serve)?"/;

for (const layout of [undefined, 'lettre', 'carte', 'editorial']) {
  test('premier contact (' + (layout || 'historique') + ') : bouton « Découvrir Melodia Funèbre » vers le site, liens visibles, texte brut', async () => {
    const ch = await envoyer('pf-premier-contact', layout);
    assert.match(ch.html, /href="https:\/\/melodia-funebre\.fr\/\?parrain=julie-serve"[^>]*>(?:<[^>]+>)*\s*Découvrir Melodia Funèbre/, 'bouton vers le site');
    assert.match(ch.html, /<a href="https:\/\/melodia-funebre\.fr"[^>]*>melodia-funebre\.fr<\/a>/, 'adresse du site cliquable dans le corps');
    assert.match(ch.html, /<a href="https:\/\/melodia-funebre\.fr\/professionnels"[^>]*>melodia-funebre\.fr\/professionnels<\/a>/);
    assert.match(ch.html, /<a href="https:\/\/melodia-funebre\.fr\/documents\/melodia-brochure-professionnels\.pdf"/, 'brochure cliquable');
    assert.ok(ch.html.includes('Si le bouton ne s’affiche pas'), 'repli sous le bouton');
    assert.ok(ch.html.includes('prospect-stop'), 'désabonnement conservé');
    assert.ok(ch.html.includes('linkedin.com/in/julie-serve') && ch.html.includes('tiktok.com/@melodia.funebre'), 'signature et réseaux conservés');
    assert.ok(ch.text.includes('Découvrir Melodia Funèbre : https://melodia-funebre.fr/?parrain=julie-serve'), 'bouton en clair');
    assert.ok(ch.text.includes('\nhttps://melodia-funebre.fr\n'), 'site en clair');
    assert.ok(ch.text.includes('https://melodia-funebre.fr/professionnels'));
  });
}

test('premier contact (historique) : le visuel de campagne est cliquable vers le site', async () => {
  const ch = await envoyer('pf-premier-contact');
  assert.match(ch.html, /<a href="https:\/\/melodia-funebre\.fr\/\?parrain=julie-serve"[^>]*><img src="https:\/\/melodia-funebre\.fr\/assets\/img\/campagne\//);
});

test('relances J+4 et J+10 : lien direct vers le site, suivi d’écoute intact', async () => {
  const j4 = await envoyer('pf-relance-j4');
  assert.match(j4.html, SITE_HREF); assert.ok(j4.text.includes('https://melodia-funebre.fr\n'));
  assert.match(j4.html, /demos\?parrain=julie-serve&amp;ec=/, 'jeton d’écoute toujours posé');
  assert.ok(j4.text.includes('Écouter un exemple : https://melodia-funebre.fr/demos?parrain=julie-serve&ec='), 'bouton d’écoute en clair, avec jeton');
  const j10 = await envoyer('pf-relance-j10');
  assert.match(j10.html, SITE_HREF); assert.ok(j10.text.includes('https://melodia-funebre.fr\n'));
});

test('lierSite : seules les adresses du site, ponctuation finale exclue, rien d’autre touché', () => {
  const h = C.lierSite('Voir https://melodia-funebre.fr/professionnels. Et https://exemple.com, et https://www.melodia-funebre.fr/?parrain=x');
  assert.ok(h.includes('<a href="https://melodia-funebre.fr/professionnels"') && h.includes('</a>.'));
  assert.ok(h.includes('https://exemple.com') && !h.includes('href="https://exemple.com'));
  assert.ok(h.includes('href="https://www.melodia-funebre.fr/?parrain=x"') && h.includes('>melodia-funebre.fr</a>'));
});
