#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   MELODIA — Fabrique des documents imprimés

       node build/pdf.js           les trois
       node build/pdf.js manuel    celui-là seulement

   Le rendu passe par Chromium : c'est le seul moteur disponible ici
   qui sache poser une police embarquée, un fond perdu et une coupe de
   page correcte. Il n'est PAS une dépendance du site : « npm run
   pages » reste sans aucun paquet, comme avant. Ce script-ci, lui,
   demande playwright-core — et le dit clairement s'il manque, plutôt
   que d'échouer sur un « Cannot find module ».

   Les trois documents lisent les mêmes sources que le site : les
   offres et les options du contenu publié, le contenu commercial de
   la console. Aucun chiffre n'est retapé.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const SORTIE = path.join(RACINE, 'documents');

function chromium() {
  try { return require('playwright-core').chromium; }
  catch (e) {
    console.error(
      '\n  Ce script a besoin de Chromium pour imprimer.\n' +
      '  Installez-le une fois :  npm i -D playwright-core\n' +
      '  puis relancez :          npm run pdf\n');
    process.exit(1);
  }
}

/* Le navigateur préinstallé de l'environnement, s'il existe ; sinon
   celui que playwright a téléchargé pour son compte. */
function executable() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(base)) return undefined;
  const d = fs.readdirSync(base).filter(x => /^chromium/.test(x)).sort().pop();
  if (!d) return undefined;
  for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
    const p = path.join(base, d, rel);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function donnees() {
  const c = JSON.parse(fs.readFileSync(path.join(RACINE, 'assets/data/content.json'), 'utf8'));
  const { OPTIONS } = require('./data.js');
  const { MAIL } = require('./gen.js');
  return { offres: c.offers || [], options: OPTIONS, mail: MAIL, demos: (c.demos || []).length };
}

/* Le pied de page des documents en flux. Il porte le nom du document :
   deux outils internes qui circulent ensemble dans une sacoche doivent
   se distinguer sans qu'on remonte à la couverture. */
const pied = (nom) => `
  <div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:7pt;color:#9a8a5c;
              padding:0 16mm;display:flex;justify-content:space-between;">
    <span>Melodia Funèbre — ${nom} · document interne</span>
    <span class="pageNumber"></span>
  </div>`;

const enFlux = (nom) => ({
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: pied(nom)
});

async function fabriquer(quoi) {
  const nav = await chromium().launch({ executablePath: executable() });
  const d = donnees();
  fs.mkdirSync(SORTIE, { recursive: true });

  const tout = !quoi;
  const lot = [];
  if (tout || quoi === 'brochure') {
    lot.push([require('./pdf-brochure.js'), { margin: { top: 0, right: 0, bottom: 0, left: 0 } }]);
  }
  if (tout || quoi === 'manuel') lot.push([require('./pdf-manuel.js'), enFlux('Manuel de vente')]);
  if (tout || quoi === 'linkedin') lot.push([require('./pdf-linkedin.js'), enFlux('Plan LinkedIn')]);
  if (tout || quoi === 'social') lot.push([require('./pdf-social.js'), enFlux('Plan réseaux sociaux')]);

  for (const [mod, options] of lot) {
    const page = await nav.newPage();
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));

    await page.setContent(mod.html(d), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    const cible = path.join(SORTIE, mod.fichier);
    await page.pdf(Object.assign({ path: cible, format: 'A4', printBackground: true, preferCSSPageSize: true }, options));
    await page.close();

    const ko = Math.round(fs.statSync(cible).size / 1024);
    console.log('  ' + mod.fichier.padEnd(34) + String(ko).padStart(5) + ' Ko' +
                (erreurs.length ? '   ERREURS : ' + erreurs.join(' | ') : ''));
  }
  await nav.close();
}

const quoi = (process.argv[2] || '').toLowerCase();
if (quoi && ['manuel', 'brochure', 'linkedin', 'social'].indexOf(quoi) === -1) {
  console.error('  Usage : node build/pdf.js [brochure|manuel|linkedin|social]');
  process.exit(1);
}
fabriquer(quoi).catch(e => { console.error('  ' + e.message); process.exit(1); });
