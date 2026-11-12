/**
 * Console Pro v4, en démonstration (dossiers d'exemple) : palette de commandes,
 * raccourcis, thème, notifications, tableau de bord (filtres, tri, sélection, export CSV),
 * duplication, fiche (frise, lecteur à forme d'onde), mode présentation, statistiques,
 * visite guidée, marque blanche, mouvement réduit, mobile.
 *
 *   PLAYWRIGHT=/chemin/playwright/index.js CHROME=/usr/bin/google-chrome node tests/e2e/pro-v4.e2e.mjs
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { demarrer } from './serveur.mjs';

const chemin = process.env.PLAYWRIGHT || 'playwright';
const pw = await import(chemin.includes('/') || chemin.includes('\\') ? pathToFileURL(chemin).href : chemin);
const { chromium } = pw.default || pw;
const CAPTURES = 'docs/pro-app/captures-v4';
mkdirSync(CAPTURES + '/exports', { recursive: true });
const { serveur, url } = await demarrer();
const nav = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const res = [];
const etape = (nom, ok, detail = '') => { res.push(ok); console.log((ok ? '  ✔ ' : '  ✘ ') + nom + (detail ? ' — ' + detail : '')); };
const verifier = async (nom, f) => { try { await f(); etape(nom, true); } catch (e) { etape(nom, false, String(e.message).split('\n')[0]); } };

async function ouvrir(largeur, hauteur, options = {}) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur }, locale: 'fr-FR', acceptDownloads: true, colorScheme: options.schema || 'dark', reducedMotion: options.calme ? 'reduce' : 'no-preference' });
  if (!options.visite) await ctx.addInitScript(() => localStorage.setItem('melodia_pro_visite', '1'));
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) erreurs.push(m.text()); });
  await page.goto(url + '/pro?demo=1' + (options.requete || ''));
  await page.getByRole('heading', { level: 1, name: /Ma journée/ }).waitFor();
  return { ctx, page, erreurs };
}

// ─── Bureau, thème sombre ───
{
  const { ctx, page, erreurs } = await ouvrir(1440, 900);
  await verifier('la démonstration montre des dossiers d’exemple, marqués comme tels', async () => {
    await page.keyboard.press('g'); await page.keyboard.press('d');
    await page.getByRole('heading', { level: 1, name: /dossiers/ }).waitFor();
    assert.equal(await page.locator('.tableau tbody tr').count(), 7);
    assert.ok((await page.locator('.badge.exemple').count()) >= 7);
  });
  await verifier('raccourci G puis S : statistiques, chiffres calculés', async () => {
    await page.keyboard.press('g'); await page.keyboard.press('s');
    await page.getByRole('heading', { level: 1, name: /statistiques/ }).waitFor();
    await page.waitForTimeout(900);
    assert.match(await page.locator('.tuile').first().textContent(), /7/);
    assert.ok(await page.getByText(/dossiers d’exemple, pas sur une activité réelle/).isVisible());
    await page.screenshot({ path: CAPTURES + '/1440-statistiques.png' });
  });
  await verifier('palette Ctrl+K : filtre, flèches, Entrée ouvre le dossier', async () => {
    await page.keyboard.press('Control+k');
    await page.getByRole('dialog', { name: /Palette/ }).waitFor();
    await page.keyboard.type('eleo'); // aucun « Éléonore » : zéro résultat
    assert.ok(await page.getByText('Aucun résultat.').isVisible());
    await page.keyboard.press('Control+a'); await page.keyboard.type('colette');
    await page.keyboard.press('Enter');
    await page.getByRole('heading', { level: 1, name: /Colette/ }).waitFor();
  });
  await verifier('fiche : frise d’avancement, lecteur à forme d’onde animé, partage avec QR', async () => {
    assert.equal(await page.locator('.avancement li').count(), 6);
    assert.equal(await page.locator('.avancement li.termine').count(), 1);
    await page.locator('.lecteur canvas').first().waitFor();
    await page.waitForTimeout(3500);
    const dessine = await page.evaluate(() => { const c = document.querySelector('.lecteur canvas'); const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
    assert.ok(dessine > 500, 'la forme d’onde est dessinée');
    await page.locator('.lecteur .jouer').first().click();
    await page.waitForTimeout(800);
    assert.equal(await page.locator('.lecteur .jouer').first().getAttribute('aria-label'), 'Mettre en pause');
    await page.locator('.lecteur .jouer').first().click();
    await page.locator('.qr-partage .mini svg').waitFor();
    await page.screenshot({ path: CAPTURES + '/1440-fiche-livre.png' });
  });
  await verifier('mode présentation : plein écran, sans prix ni statut, Échap pour quitter', async () => {
    await page.keyboard.press('p');
    const pres = page.locator('.presentation');
    await pres.waitFor();
    const texte = await pres.textContent();
    assert.match(texte, /Colette/);
    assert.ok(!/€|Livré|Brouillon|essai|MF-/i.test(texte), 'rien d’interne : ' + texte.slice(0, 80));
    await page.screenshot({ path: CAPTURES + '/1440-presentation.png' });
    await page.keyboard.press('Escape');
    await pres.waitFor({ state: 'detached' });
  });
  await verifier('dupliquer comme modèle : rien de la personne n’est repris', async () => {
    await page.getByRole('button', { name: /Dupliquer comme modèle/ }).click();
    await page.getByRole('heading', { level: 1, name: /Une vie, une chanson/ }).waitFor();
    assert.equal(await page.getByLabel(/Prénom d’usage/).inputValue(), '');
    await page.getByRole('button', { name: /Étape suivante/ }).click();
    await page.getByRole('button', { name: /Étape suivante/ }).click();
    assert.equal(await page.getByLabel(/Style musical/).inputValue(), 'Piano classique');
  });
  await verifier('dossiers : filtre rapide, recherche sans accents, tri, sélection et export CSV', async () => {
    await page.goto(url + '/pro#/dossiers');
    await page.getByRole('heading', { level: 1, name: /dossiers/ }).waitFor();
    await page.getByRole('button', { name: /^Livrés/ }).click();
    assert.equal(await page.locator('.tableau tbody tr').count(), 2);
    await page.getByRole('button', { name: /^Tous/ }).click();
    await page.getByLabel('Filtrer les dossiers').fill('ODETTE');
    assert.equal(await page.locator('.tableau tbody tr').count(), 1);
    await page.getByLabel('Filtrer les dossiers').fill('');
    await page.getByRole('button', { name: /^Pour/ }).click();
    assert.equal(await page.locator('.tableau tbody tr').first().locator('td').nth(1).textContent().then((t) => t.trim().startsWith('Colette')), true);
    await page.locator('.tableau tbody input[type=checkbox]').nth(0).check();
    await page.locator('.tableau tbody input[type=checkbox]').nth(1).check();
    await page.getByText('2 dossiers sélectionnés').waitFor();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Exporter la sélection/ }).click()]);
    const p = CAPTURES + '/exports/selection.csv';
    await dl.saveAs(p);
    const csv = readFileSync(p, 'utf8');
    assert.ok(csv.startsWith('﻿Référence;Pour;Titre;État'));
    assert.equal(csv.trim().split('\r\n').length, 3);
    await page.screenshot({ path: CAPTURES + '/1440-dossiers.png' });
  });
  await verifier('notifications : non lues comptées, panneau, « tout marquer comme lu »', async () => {
    await page.goto(url + '/pro#/journee');
    await page.getByRole('heading', { level: 1, name: /Ma journée/ }).waitFor();
    await page.waitForTimeout(800);
    assert.match(await page.locator('#btn-notifs').getAttribute('aria-label'), /\d non lues?/);
    await page.locator('#btn-notifs').click();
    await page.getByRole('dialog', { name: 'Notifications' }).waitFor();
    assert.ok(await page.getByText(/dans moins de 48 h/).isVisible());
    await page.screenshot({ path: CAPTURES + '/1440-notifications.png' });
    await page.getByRole('button', { name: 'Tout marquer comme lu' }).click();
    assert.equal(await page.locator('#btn-notifs').getAttribute('aria-label'), 'Notifications');
    await page.keyboard.press('Escape');
  });
  await verifier('thème : bascule clair/sombre (T), mémorisé après rechargement', async () => {
    await page.keyboard.press('t');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
    await page.reload();
    await page.getByRole('heading', { level: 1, name: /Ma journée/ }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
    await page.screenshot({ path: CAPTURES + '/1440-journee-clair.png' });
    await page.keyboard.press('t');
  });
  await verifier('marque blanche : l’accent choisi s’applique et persiste', async () => {
    await page.goto(url + '/pro#/parametres');
    await page.getByRole('heading', { level: 1, name: /paramètres/ }).waitFor();
    await page.getByLabel('Vert sauge').check({ force: true });
    const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
    assert.equal(accent, '#8cbf9e');
    await page.getByLabel('Nom d’affichage').fill('Maison Test');
    await page.getByLabel('Nom d’affichage').blur();
    await page.waitForTimeout(200);
    assert.ok((await page.locator('#qui').textContent()).includes('Maison Test'));
  });
  await verifier('aide : raccourcis listés, « ? » ouvre l’aide, Échap la ferme', async () => {
    await page.keyboard.press('?');
    await page.getByRole('dialog').getByText(/Raccourcis/).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
  });
  etape('aucune erreur de console sur le parcours bureau', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));
  await ctx.close();
}

// ─── Visite guidée (première ouverture) ───
{
  const { ctx, page, erreurs } = await ouvrir(1280, 800, { visite: true });
  await verifier('visite guidée : se lance, se parcourt au clavier, ne revient plus', async () => {
    await page.getByRole('dialog', { name: /Votre console/ }).waitFor({ timeout: 5000 });
    await page.screenshot({ path: CAPTURES + '/1280-visite.png' });
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'Terminer' }).click();
    await page.locator('.visite').waitFor({ state: 'detached' });
    await page.reload();
    await page.getByRole('heading', { level: 1, name: /Ma journée/ }).waitFor();
    await page.waitForTimeout(1500);
    assert.equal(await page.locator('.visite').count(), 0);
  });
  etape('aucune erreur de console pendant la visite', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));
  await ctx.close();
}

// ─── Mobile, thème clair, mouvement réduit ───
{
  const { ctx, page, erreurs } = await ouvrir(390, 844, { schema: 'light', calme: true });
  await verifier('mobile : onglets du bas + menu « Plus », aucun débordement horizontal', async () => {
    assert.equal(await page.locator('#nav-bas > *').count(), 5);
    await page.getByRole('button', { name: 'Plus' }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Facturation' }).waitFor();
    await page.keyboard.press('Escape');
    for (const r of ['#/journee', '#/dossiers', '#/statistiques', '#/bibliotheque', '#/dossiers/exemple-1']) {
      await page.evaluate((x) => { location.hash = x; }, r);
      await page.waitForTimeout(500);
      const deborde = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.ok(!deborde, r + ' déborde en largeur');
    }
    await page.evaluate(() => { location.hash = '#/dossiers'; });
    await page.waitForTimeout(600);
    await page.screenshot({ path: CAPTURES + '/390-dossiers-clair.png' });
    await page.evaluate(() => { location.hash = '#/dossiers/exemple-1'; });
    await page.waitForTimeout(900);
    await page.screenshot({ path: CAPTURES + '/390-fiche-clair.png' });
  });
  await verifier('mouvement réduit : compteurs et barres tout de suite à leur valeur', async () => {
    await page.evaluate(() => { location.hash = '#/journee'; });
    await page.getByRole('heading', { level: 1, name: /Ma journée/ }).waitFor();
    const t = await page.locator('.tuile .valeur').first().textContent();
    assert.match(t, /^\d+$/);
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  });
  etape('aucune erreur de console sur mobile', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));
  await ctx.close();
}

await nav.close(); serveur.close();
const ok = res.filter(Boolean).length;
console.log(`\n${ok} / ${res.length}`);
process.exit(ok === res.length ? 0 : 1);
