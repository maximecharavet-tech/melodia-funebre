/* Rend brochure.html en PDF A4 : node brochure/pdf.js */
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'brochure.html'), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(__dirname, 'melodia-funebre-brochure-pro.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await p.setViewportSize({ width: 794, height: 1123 });
  await p.screenshot({ path: path.join(process.argv[2] || __dirname, 'apercu.png'), fullPage: true });
  await b.close();
})();
