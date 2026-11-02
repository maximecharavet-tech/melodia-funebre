/* Captures PNG pour la vue « Mail prêt à envoyer » (Playwright + serve statique). */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = '/opt/cursor/artifacts/screenshots';
fs.mkdirSync(outDir, { recursive: true });

function attendre(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pret() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('melodia_session', JSON.stringify({
      access_token: 'demo-token-screenshot',
      refresh_token: 'demo-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'demo-julie',
        email: 'julie@melodia-funebre.fr',
        user_metadata: { name: 'Julie Serve', role: 'commercial' }
      }
    }));
    localStorage.setItem('melodia_role', JSON.stringify('commercial'));
    localStorage.setItem('melodia_agence', JSON.stringify('Melodia Funèbre'));
    localStorage.setItem('melodia_prospects', JSON.stringify([{
      siret: 'demo-roblot',
      nom: 'Pompes Funèbres Roblot',
      ville: 'Lyon',
      dirigeant: 'Monsieur Roblot',
      email: 'contact@roblot.fr',
      statut: 'nouveau',
      owner: 'julie@melodia-funebre.fr',
      journal: [{ le: new Date().toISOString(), quoi: 'Mail préparé — Séquence 1 — Présentation' }]
    }]));
  });
  const page = await context.newPage();
  await page.route('**/*supabase.co/**', (route) => {
    const url = route.request().url();
    if (url.includes('/rest/v1/roles')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ role: 'commercial' }]) });
    }
    if (url.includes('/rest/v1/prospects')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          siret: 'demo-roblot',
          nom: 'Pompes Funèbres Roblot',
          ville: 'Lyon',
          dirigeant: 'Monsieur Roblot',
          email: 'contact@roblot.fr',
          statut: 'nouveau',
          owner: 'julie@melodia-funebre.fr',
          relance_le: '2020-01-01',
          journal: []
        }])
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  const base = 'http://127.0.0.1:3456/dashboard-commercial.html';
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await attendre(2000);

  async function shot(name, hash) {
    await page.goto(base + '#' + hash, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await attendre(1500);
    await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: true });
  }

  await shot('f1-pret-vide', 'pret');
  await page.fill('#pret-dirigeant', 'Monsieur Roblot');
  await page.fill('#pret-email', 'contact@roblot.fr');
  await page.fill('#pret-agence', 'Pompes Funèbres Roblot');
  await page.fill('#pret-ville', 'Lyon');
  await attendre(600);
  await page.screenshot({ path: path.join(outDir, 'f1-pret-rempli.png'), fullPage: true });

  await page.click('#pret-copier');
  await attendre(400);
  await page.screenshot({ path: path.join(outDir, 'f1-pret-toast.png'), fullPage: true });

  const modeles = ['seq-1', 'apres-rencontre', 'merci-rdv', 'premiere-offerte', 'premium-presentation', 'pf-contact', 'pf-relance'];
  for (const id of modeles) {
    await shot('template-' + id, 'pret?modele=' + id + '&siret=demo-roblot');
  }

  await page.evaluate(() => {
    const b = document.querySelector('[data-pret-layout="premium"]');
    if (b) b.click();
  });
  await attendre(500);
  await page.screenshot({ path: path.join(outDir, 'premium-seq-1.png'), fullPage: true });

  await shot('kanban-pipeline', 'analyse');
  await shot('historique-pret', 'pret');

  await browser.close();
  console.log('Captures enregistrées dans', outDir);
}

pret().catch((e) => {
  console.error(e);
  process.exit(1);
});
