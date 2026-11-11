/**
 * Icônes des applications (Tauri pour Windows, Capacitor pour Android),
 * dérivées de l'icône PWA — elle-même faite du logo officiel posé sur le
 * fond de la maison, sans retouche.
 *
 *   PLAYWRIGHT=/tmp/pw/node_modules/playwright/index.js node scripts/pro-icones-apps.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const chemin = process.env.PLAYWRIGHT || 'playwright';
const pw = await import(chemin.includes('/') || chemin.includes('\\') ? pathToFileURL(chemin).href : chemin);
const b = await (pw.default || pw).chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await b.newPage();
const source = 'data:image/png;base64,' + readFileSync('assets/img/pro/icons/pro-512.png').toString('base64');
const masquable = 'data:image/png;base64,' + readFileSync('assets/img/pro/icons/pro-maskable-512.png').toString('base64');

async function taille(src, t) {
  return Buffer.from(await page.evaluate(async ({ src, t }) => {
    const i = new Image();
    await new Promise((ok) => { i.onload = ok; i.src = src; });
    const c = document.createElement('canvas'); c.width = t; c.height = t;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(i, 0, 0, t, t);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  }, { src, t }));
}

/** ICO contenant des PNG (format admis depuis Windows Vista). */
function ico(pngs) {
  const entete = Buffer.alloc(6); entete.writeUInt16LE(0, 0); entete.writeUInt16LE(1, 2); entete.writeUInt16LE(pngs.length, 4);
  let decalage = 6 + 16 * pngs.length;
  const entrees = [];
  for (const [t, png] of pngs) {
    const e = Buffer.alloc(16);
    e[0] = t >= 256 ? 0 : t; e[1] = t >= 256 ? 0 : t; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8); e.writeUInt32LE(decalage, 12);
    decalage += png.length;
    entrees.push(e);
  }
  return Buffer.concat([entete, ...entrees, ...pngs.map((p) => p[1])]);
}

const T = 'apps/desktop/src-tauri/icons';
mkdirSync(T, { recursive: true });
writeFileSync(`${T}/32x32.png`, await taille(source, 32));
writeFileSync(`${T}/128x128.png`, await taille(source, 128));
writeFileSync(`${T}/128x128@2x.png`, await taille(source, 256));
writeFileSync(`${T}/icon.png`, await taille(source, 512));
writeFileSync(`${T}/icon.ico`, ico([[16, await taille(source, 16)], [32, await taille(source, 32)], [48, await taille(source, 48)], [256, await taille(source, 256)]]));

// Android : icônes de lancement (mipmap) et premier plan adaptatif.
const A = 'apps/android/ressources';
mkdirSync(A, { recursive: true });
for (const [d, t] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  writeFileSync(`${A}/ic_launcher-${d}.png`, await taille(source, t));
  writeFileSync(`${A}/ic_launcher_foreground-${d}.png`, await taille(masquable, Math.round(t * 108 / 48)));
}
// Écrans de lancement Android : le splash 2732 recadré au centre, à chaque densité.
const splash = 'data:image/png;base64,' + readFileSync('assets/img/pro/splash-2732.png').toString('base64');
const RES = 'apps/android/android/app/src/main/res';
for (const d of ['drawable', ...['land', 'port'].flatMap((o) => ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].map((x) => `drawable-${o}-${x}`))]) {
  const f = `${RES}/${d}/splash.png`;
  let l = 480, h = 320;
  try { const x = readFileSync(f); l = x.readUInt32BE(16); h = x.readUInt32BE(20); } catch (e) { continue; }
  const png = Buffer.from(await page.evaluate(async ({ src, l, h }) => {
    const i = new Image(); await new Promise((ok) => { i.onload = ok; i.src = src; });
    const c = document.createElement('canvas'); c.width = l; c.height = h;
    const g = c.getContext('2d'); g.fillStyle = '#040407'; g.fillRect(0, 0, l, h);
    const t = Math.min(l, h); g.drawImage(i, (l - t) / 2, (h - t) / 2, t, t);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  }, { src: splash, l, h }));
  writeFileSync(f, png);
}
await b.close();
console.log('icônes Tauri et Android écrites');
