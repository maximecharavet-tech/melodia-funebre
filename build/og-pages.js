#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   Vignettes de partage (1200 × 630) des pages de situation.

       node build/og-pages.js

   Même carte que les vignettes d'œuvres (partage-images.js) : fond
   nuit, cadre or, polices de la maison. Une page qui parle d'une mère
   mérite mieux, dans un fil ou un résultat, que la vignette générique.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { fontes } = require('./pdf-style.js');

const RACINE = path.join(__dirname, '..');
const SORTIE = path.join(RACINE, 'assets/img/og');

const CARTES = [
  { fichier: 'chanson-pour-maman-decedee.jpg', sceau: 'M', registre: 'Pour une maman',
    titre: 'Une chanson d’hommage pour maman', sous: 'Écrite d’après ce que vous racontez d’elle',
    mots: ['son prénom', 'ses gestes', 'sa musique'] },
  { fichier: 'chanson-pour-papa-decede.jpg', sceau: 'P', registre: 'Pour un papa',
    titre: 'Une chanson d’hommage pour papa', sous: 'Écrite d’après ce que vous racontez de lui',
    mots: ['son prénom', 'ses preuves', 'sa musique'] }
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const carte = (c) => `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>
${fontes()}
*{box-sizing:border-box}html,body{margin:0}
body{width:1200px;height:630px;background:#040407;color:#f4f1ea;font-family:'Jost',sans-serif;position:relative;overflow:hidden}
.lueur{position:absolute;width:760px;height:760px;right:-230px;top:-260px;background:radial-gradient(circle,rgba(201,168,76,.17) 0%,rgba(201,168,76,0) 66%)}
.cadre{position:absolute;inset:26px;border:1px solid rgba(201,168,76,.26)}
.dedans{position:relative;height:100%;padding:74px 78px;display:flex;flex-direction:column}
.haut{display:flex;align-items:center;gap:26px}
.sceau{width:92px;height:92px;border-radius:50%;border:1px solid rgba(201,168,76,.5);display:grid;place-items:center;background:radial-gradient(circle at 32% 28%,rgba(201,168,76,.2),rgba(4,4,7,0) 68%);font-family:'Cormorant Garamond',serif;font-size:44px;color:#c9a84c}
.registre{font-family:'Jetbrains Mono',monospace;font-size:15px;letter-spacing:.26em;text-transform:uppercase;color:#c9a84c}
.titre{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:70px;line-height:1.06;margin-top:auto;text-wrap:balance}
.qui{font-size:25px;color:#c4bba6;margin-top:20px}
.mots{display:flex;gap:12px;margin-top:28px}
.mot{font-family:'Jetbrains Mono',monospace;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#c9a84c;border:1px solid rgba(201,168,76,.34);border-radius:999px;padding:8px 16px}
.pied{margin-top:auto;padding-top:30px;border-top:1px solid rgba(201,168,76,.2);display:flex;justify-content:space-between;align-items:center}
.marque{display:flex;align-items:baseline;gap:12px}.marque b{font-family:'Cormorant Garamond',serif;font-weight:400;font-size:30px;letter-spacing:.06em}
.marque i{font-style:normal;font-family:'Jetbrains Mono',monospace;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#8e8878}
.devise{font-family:'Jetbrains Mono',monospace;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#6b5828}
</style></head><body><div class="lueur"></div><div class="cadre"></div><div class="dedans">
<div class="haut"><div class="sceau">${esc(c.sceau)}</div><div class="registre">${esc(c.registre)}</div></div>
<div class="titre">${esc(c.titre)}</div><div class="qui">${esc(c.sous)}</div>
<div class="mots">${c.mots.map((m) => `<span class="mot">${esc(m)}</span>`).join('')}</div>
<div class="pied"><div class="marque"><b>MELODIA</b><i>Funèbre</i></div><div class="devise">Chaque vie mérite une chanson</div></div>
</div></body></html>`;

(async () => {
  let pw;
  try { pw = require('playwright-core'); } catch (e) { pw = require('playwright'); }
  fs.mkdirSync(SORTIE, { recursive: true });
  const nav = await pw.chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const page = await nav.newPage({ viewport: { width: 1200, height: 630 } });
  for (const c of CARTES) {
    await page.setContent(carte(c), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SORTIE, c.fichier), type: 'jpeg', quality: 88 });
    console.log('  assets/img/og/' + c.fichier);
  }
  await nav.close();
})().catch((e) => { console.error('  ' + e.message); process.exit(1); });
