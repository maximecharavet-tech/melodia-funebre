/**
 * Mesure Lighthouse locale de /pro (mode démonstration) et de la page mémorial.
 * Lighthouse 12 n'a plus de catégorie « PWA » : l'installabilité est vérifiée
 * à part (manifeste, travailleur de service, icônes) et notée dans le rapport.
 *
 *   npm install --prefix /tmp/pw lighthouse playwright        (outils de poste)
 *   LIGHTHOUSE=/tmp/pw/node_modules/lighthouse/core/index.js CHROME=… node tests/e2e/lighthouse.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { demarrer } from './serveur.mjs';

const lighthouse = (await import(pathToFileURL(process.env.LIGHTHOUSE).href)).default;
const { serveur, url } = await demarrer();
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(process.env.CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--disable-gpu', '--user-data-dir=' + (process.env.TEMP || '/tmp') + '/lh-' + port, 'about:blank'], { stdio: 'ignore' });
await new Promise((ok) => setTimeout(ok, 2500));

const pages = [['console /pro (démonstration)', '/pro?demo=1'], ['page mémorial (exemple)', '/m/demo']];
const resultats = [];
for (const [nom, chemin] of pages) {
  for (const formFactor of ['mobile', 'desktop']) {
    const r = await lighthouse(url + chemin, { port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'], formFactor,
      screenEmulation: formFactor === 'desktop' ? { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false } : undefined,
      throttlingMethod: 'simulate' });
    const c = r.lhr.categories;
    const ligne = { page: nom, appareil: formFactor, performance: Math.round(c.performance.score * 100), accessibilite: Math.round(c.accessibility.score * 100), bonnes_pratiques: Math.round(c['best-practices'].score * 100) };
    const echecs = Object.values(r.lhr.audits).filter((a) => a.score !== null && a.score < 1 && r.lhr.categories.accessibility.auditRefs.some((x) => x.id === a.id)).map((a) => a.id);
    ligne.a11y_a_revoir = echecs;
    resultats.push(ligne);
    console.log(JSON.stringify(ligne));
  }
}
chrome.kill();
serveur.close();
mkdirSync('docs/pro-app/captures', { recursive: true });
writeFileSync('docs/pro-app/captures/lighthouse.json', JSON.stringify({ date: new Date().toISOString(), resultats }, null, 2));
