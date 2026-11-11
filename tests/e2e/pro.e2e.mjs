/**
 * Parcours de bout en bout de la console Pro, en mode démonstration (aucun
 * appel réel : ni paiement, ni fournisseur) :
 *   créer un dossier → questionnaire → essai → « livré » simulé →
 *   QR exporté (SVG, PNG 300/600, PDF) et relu → page mémorial.
 * Trois largeurs : 390 (téléphone), 1024 (tablette), 1440 (bureau) ;
 * captures dans docs/pro-app/captures/.
 *
 *   npm install --prefix /tmp/pw playwright jsqr      (outils de poste, hors dépôt)
 *   PLAYWRIGHT=/tmp/pw/node_modules/playwright/index.js JSQR=/tmp/pw/node_modules/jsqr/dist/jsQR.js node tests/e2e/pro.e2e.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { demarrer } from './serveur.mjs';

const chemin = process.env.PLAYWRIGHT || 'playwright';
const pw = await import(chemin.includes('/') || chemin.includes('\\') ? pathToFileURL(chemin).href : chemin);
const { chromium } = pw.default || pw;
const CAPTURES = 'docs/pro-app/captures';
mkdirSync(CAPTURES + '/exports', { recursive: true });

const { serveur, url } = await demarrer();
const navigateur = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const resultats = [];
function etape(nom, ok, detail = '') { resultats.push({ nom, ok }); console.log((ok ? '  ✔ ' : '  ✘ ') + nom + (detail ? ' — ' + detail : '')); }

async function parcours(largeur, hauteur, suffixe, complet) {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, acceptDownloads: true, locale: 'fr-FR', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource.*404/.test(m.text())) erreurs.push(m.text()); });
  page.on('dialog', (d) => d.accept());

  await page.goto(url + '/pro?demo=1');
  await page.getByRole('heading', { level: 1, name: /Ma journée/ }).waitFor();
  etape(`[${suffixe}] la console s’ouvre en démonstration, sous la CSP de /pro`, true);
  await page.screenshot({ path: `${CAPTURES}/${suffixe}-1-journee.png`, fullPage: false });

  // Nouveau dossier
  await page.keyboard.press('n');
  await page.getByRole('heading', { level: 1, name: /Une vie, une chanson/ }).waitFor();
  await page.getByLabel(/Prénom d’usage/).fill('Jeanne');
  await page.getByLabel(/Nom de famille/).fill('Martin');
  await page.getByRole('radio', { name: 'elle', exact: true }).check();
  await page.getByLabel('Date de naissance').fill('1941-03-02');
  await page.getByLabel('Date du décès').fill('2026-11-08');
  await page.screenshot({ path: `${CAPTURES}/${suffixe}-2-questionnaire.png` });
  await page.getByRole('button', { name: /Étape suivante/ }).click();
  await page.getByLabel(/^Métier/).fill('institutrice');
  await page.getByRole('button', { name: 'généreux·se' }).click();
  await page.getByLabel(/Une anecdote/).fill('Elle chantait en corrigeant les cahiers. Appelez-moi au 06 12 34 56 78.');
  await page.getByLabel(/Une anecdote/).blur();
  const signal = await page.getByText(/Des coordonnées ont été repérées/).isVisible();
  etape(`[${suffixe}] un numéro de téléphone saisi est repéré et signalé`, signal);
  await page.getByRole('button', { name: /Étape suivante/ }).click();
  await page.getByLabel(/Style musical/).selectOption('Chanson française');
  await page.getByLabel(/Artistes qu’il ou elle aimait/).fill('Barbara');
  await page.getByRole('radio', { name: 'Voix de femme' }).check();
  await page.getByRole('button', { name: 'piano', exact: true }).first().click();
  await page.getByRole('button', { name: /Étape suivante/ }).click();
  await page.getByLabel(/Chanson attendue au plus tard/).fill('2026-11-20T10:00');
  await page.getByRole('button', { name: /Étape suivante/ }).click();
  await page.getByRole('radio', { name: 'Lumineux' }).check();
  await page.getByLabel(/Un titre/).fill('La maîtresse');
  await page.getByRole('button', { name: /Étape suivante/ }).click();
  await page.getByLabel(/La famille a été informée/).check();
  await page.getByRole('radio', { name: 'Oui' }).check();
  await page.getByRole('radio', { name: /Lien privé/ }).check();
  if (complet) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Récapitulatif/ }).click()]);
    const p = `${CAPTURES}/exports/recapitulatif.pdf`;
    await dl.saveAs(p);
    etape(`[${suffixe}] récapitulatif PDF du questionnaire`, readFileSync(p).toString('latin1', 0, 5) === '%PDF-');
  }
  await page.getByRole('button', { name: /Étape suivante/ }).click();
  await page.getByRole('radio', { name: /Composition d’essai offerte/ }).check();
  // la sauvegarde serveur (différée) doit avoir créé le dossier
  await page.waitForFunction(() => /\/dossiers\//.test(location.hash), null, { timeout: 8000 });
  await page.getByRole('button', { name: /Demander la composition d’essai/ }).click();

  // Fiche : pipeline simulé
  await page.getByText('Paroles à relire').first().waitFor({ timeout: 15000 });
  etape(`[${suffixe}] essai accordé, paroles proposées`, true);
  const prompt = await page.locator('#par-prompt').inputValue();
  etape(`[${suffixe}] la description musicale ne nomme pas l’artiste aimé`, !/barbara/i.test(prompt) && /french chanson/.test(prompt), prompt.slice(0, 80));
  await page.screenshot({ path: `${CAPTURES}/${suffixe}-3-relecture.png` });
  await page.getByRole('button', { name: /Valider et lancer la composition/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Lancer la composition' }).click();
  await page.getByText('Écoute par la maison').first().waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Simuler la validation de la maison/ }).click();
  await page.getByText('Livré', { exact: true }).first().waitFor({ timeout: 8000 });
  etape(`[${suffixe}] statut « livré » après la validation maison simulée`, true);
  await page.screenshot({ path: `${CAPTURES}/${suffixe}-4-livre.png` });

  // Studio QR
  await page.getByRole('link', { name: /Préparer le QR/ }).click();
  await page.locator('.apercu svg').first().waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${CAPTURES}/${suffixe}-5-studio-qr.png` });
  const infos = await page.locator('.apercu + div').textContent();
  etape(`[${suffixe}] le studio annonce la taille du module et le contraste`, /module de/.test(infos) && /contraste/.test(infos), infos.trim().slice(0, 90));

  if (complet) {
    for (const [bouton, nom, verif] of [
      ['SVG (graveur)', 'carte.svg', (b) => b.toString('utf8').startsWith('<svg') && b.toString('utf8').includes('105mm')],
      ['PNG 300 dpi', 'carte-300.png', (b) => b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(16) === 1240],
      ['PNG 600 dpi', 'carte-600.png', (b) => b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(16) === 2480],
      ['PDF imprimable', 'carte.pdf', (b) => b.toString('latin1', 0, 5) === '%PDF-' && /TrimBox/.test(b.toString('latin1')) && /BleedBox/.test(b.toString('latin1'))]
    ]) {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: bouton }).click()]);
      const p = `${CAPTURES}/exports/${nom}`;
      await dl.saveAs(p);
      const b = readFileSync(p);
      etape(`[${suffixe}] export ${bouton} (${Math.round(b.length / 1024)} Ko)`, verif(b));
    }
    // Le PNG exporté est-il lisible par un lecteur de QR ?
    if (process.env.JSQR) {
      // Page vierge à part : la CSP de /pro interdit (à raison) tout script injecté.
      const vierge = await ctx.newPage();
      await vierge.setContent('<html><body></body></html>');
      await vierge.addScriptTag({ content: readFileSync(process.env.JSQR, 'utf8') });
      const png = readFileSync(`${CAPTURES}/exports/carte-300.png`).toString('base64');
      const lu = await vierge.evaluate(async (b64) => {
        const img = new Image();
        await new Promise((ok) => { img.onload = ok; img.src = 'data:image/png;base64,' + b64; });
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height);
        const r = window.jsQR(d.data, d.width, d.height);
        return r ? r.data : null;
      }, png);
      await vierge.close();
      etape(`[${suffixe}] le PNG exporté se relit avec un décodeur QR indépendant`, /^https:\/\/melodia-funebre\.fr\/m\/[0-9A-HJKMNP-TV-Z]{12}$/.test(lu || ''), lu || 'illisible');
    }
    // Autres gabarits : chacun produit un PDF
    for (const g of ['Plaque 8 cm', 'Planche A4 (12)', 'Marque-page']) {
      await page.getByRole('button', { name: new RegExp('^' + g.replace(/[()]/g, '\\$&')) }).click();
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'PDF imprimable' }).click()]);
      const p = `${CAPTURES}/exports/${g.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
      await dl.saveAs(p);
      etape(`[${suffixe}] gabarit « ${g} » en PDF`, readFileSync(p).toString('latin1', 0, 5) === '%PDF-');
    }
  }

  // Publication et aperçu du mémorial
  await page.getByRole('button', { name: 'Publier la page' }).click();
  await page.getByText('Page publiée.').waitFor();
  await page.getByRole('link', { name: 'Aperçu' }).click();
  await page.locator('.memorial').waitFor();
  const prenom = await page.locator('.memorial .prenom').textContent();
  etape(`[${suffixe}] aperçu de la page mémorial`, /Jeanne/.test(prenom));
  await page.screenshot({ path: `${CAPTURES}/${suffixe}-6-memorial.png` });

  if (complet) {
    // Pack promotionnel
    await page.goto(url + '/pro#/parametres');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Télécharger le pack/ }).click()]);
    const p = `${CAPTURES}/exports/pack-promotionnel.pdf`;
    await dl.saveAs(p);
    const b = readFileSync(p).toString('latin1');
    etape(`[${suffixe}] pack promotionnel PDF (4 pages, co-brandé)`, b.startsWith('%PDF-') && /\/Count 4/.test(b));
  }
  etape(`[${suffixe}] aucune erreur JavaScript`, erreurs.length === 0, erreurs.slice(0, 3).join(' | '));
  await ctx.close();
}

async function memorialPublic() {
  const ctx = await navigateur.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' });
  const page = await ctx.newPage();
  let scans = 0;
  await page.route(/supabase\.co\/rest\/v1\/rpc\/memorial/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(/\/api\/pro\/scan/, (r) => { scans++; r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await page.route(/\/api\/pro\/memorial/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    ok: true, noindex: true, prenom: 'Jeanne', nom: 'Martin', dates: ['1941', '2026'], titre: 'La maîtresse',
    paroles: '[Refrain]\nJeanne, ta voix reste', mot_famille: 'Merci d’être venus.', audio: null, photo: null,
    cobranding: { nom: 'Pompes funèbres de démonstration', logo: null }, signature: 'Composé par Melodia Funèbre'
  }) }));
  await page.goto(url + '/m/7K3M9QXT2BZZ');
  await page.locator('.hom-nom').waitFor({ timeout: 8000 });
  const nom = await page.locator('.hom-nom').textContent();
  const robots = await page.locator('meta[name=robots]').getAttribute('content');
  etape('[390] page mémorial publique /m/<jeton> (repli pro)', nom === 'Jeanne Martin', nom);
  etape('[390] mémorial en noindex', /noindex/.test(robots));
  etape('[390] partage WhatsApp, SMS, courriel', await page.getByRole('link', { name: 'WhatsApp' }).isVisible() && await page.getByRole('link', { name: 'SMS' }).isVisible());
  etape('[390] co-branding discret de l’agence', await page.getByText('Avec Pompes funèbres de démonstration').isVisible());
  await page.waitForTimeout(300);
  etape('[390] compteur d’ouvertures appelé', scans === 1);
  await page.screenshot({ path: `${CAPTURES}/390-7-memorial-public.png`, fullPage: true });
  await ctx.close();
}

async function sansSession() {
  const ctx = await navigateur.newContext({ viewport: { width: 1024, height: 768 }, locale: 'fr-FR', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url + '/pro');
  await page.getByRole('link', { name: 'Se connecter' }).waitFor();
  const poster = await page.locator('figure img').count();
  etape('[1024] sans session : accueil sobre, poster fixe si mouvement réduit', poster === 1);
  await page.screenshot({ path: `${CAPTURES}/1024-0-accueil.png` });
  await ctx.close();
}

try {
  await parcours(1440, 900, '1440', true);
  await parcours(1024, 1366, '1024', false);
  await parcours(390, 844, '390', false);
  await memorialPublic();
  await sansSession();
} catch (e) {
  etape('parcours interrompu', false, e.message.split('\n')[0]);
} finally {
  await navigateur.close();
  serveur.close();
}
const ko = resultats.filter((r) => !r.ok).length;
writeFileSync(`${CAPTURES}/resultats.json`, JSON.stringify({ date: new Date().toISOString(), total: resultats.length, reussis: resultats.length - ko, resultats }, null, 2));
console.log(`\nE2E : ${resultats.length - ko} / ${resultats.length}`);
assert.equal(ko, 0);
