/**
 * Visuels du site public (v2) : intègre ceux de art/v2/ s'ils existent,
 * sinon fabrique des placeholders aux noms et proportions attendus
 * (fond #040407, filet or d'un trait, logo officiel posé tel quel —
 * jamais redessiné, mention « Visuel provisoire »).
 *
 * Aucun service de génération n'est appelé : la liste des visuels à
 * produire, avec leurs prompts, est dans VISUELS_A_GENERER.md.
 *
 *   npm install --prefix /tmp/pw playwright-core     (outil de poste, hors dépôt)
 *   PLAYWRIGHT=/tmp/pw/node_modules/playwright-core/index.js CHROME=<chrome.exe> node scripts/v2-visuels.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

// [nom, largeur, hauteur, titre, sortie, format]
const VISUELS = [
  ['og-offres', 1200, 630, 'Offres et tarifs', 'assets/img/v2/og-offres', 'jpeg'],
  ['og-professionnels', 1200, 630, 'Pour les pompes funèbres', 'assets/img/v2/og-professionnels', 'jpeg'],
  ['console-portable', 1600, 1000, 'La console des agences', 'assets/img/v2/console-portable', 'webp'],
  ['kit-agence-couverture', 1240, 1754, 'Kit agence — couverture', 'assets/img/v2/kit-agence-couverture', 'webp'],
  ['presentation-agence-poster', 1920, 1080, 'Présentation aux agences', 'assets/video/v2/presentation-agence', 'webp']
];

const chemin = process.env.PLAYWRIGHT || 'playwright-core';
const pw = await import(chemin.includes('/') || chemin.includes('\\') ? pathToFileURL(chemin).href : chemin);
const chromium = (pw.default || pw).chromium;
const navigateur = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await navigateur.newPage();
const logo = 'data:image/webp;base64,' + readFileSync('assets/img/logo-melodia-600.webp').toString('base64');
await page.setContent('<html><body style="margin:0;background:#040407"></body></html>');

async function rendre(l, h, opts) {
  return page.evaluate(async ({ l, h, logo, opts }) => {
    const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = opts.source || logo; });
    const c = document.createElement('canvas');
    c.width = l; c.height = h;
    const g = c.getContext('2d');
    if (opts.source) {
      const r = Math.max(l / img.width, h / img.height);
      g.drawImage(img, (l - img.width * r) / 2, (h - img.height * r) / 2, img.width * r, img.height * r);
    } else {
      const fond = g.createRadialGradient(l / 2, h * 0.45, 0, l / 2, h * 0.45, Math.max(l, h) * 0.7);
      fond.addColorStop(0, '#101018'); fond.addColorStop(0.6, '#0b0b11'); fond.addColorStop(1, '#040407');
      g.fillStyle = fond; g.fillRect(0, 0, l, h);
      const m = Math.min(l, h);
      const grad = g.createLinearGradient(0, 0, l, h);
      grad.addColorStop(0, '#97803c'); grad.addColorStop(0.45, '#e3c977'); grad.addColorStop(1, '#c9a84c');
      g.strokeStyle = grad; g.lineWidth = Math.max(1, Math.round(m * 0.002));
      const e = m * 0.045;
      g.strokeRect(e, e, l - 2 * e, h - 2 * e);
      const t = m * 0.3;
      g.drawImage(img, (l - t) / 2, (h - t) / 2 - m * 0.07, t, t);
      g.textAlign = 'center';
      g.fillStyle = '#c9a84c';
      g.font = `${Math.round(m * 0.026)}px "Courier New", monospace`;
      g.fillText('MELODIA FUNÈBRE', l / 2, h / 2 + t / 2 + m * 0.0);
      g.fillStyle = '#f2efe8';
      g.font = `italic ${Math.round(m * 0.05)}px Georgia, serif`;
      g.fillText(opts.titre, l / 2, h / 2 + t / 2 + m * 0.075);
      g.fillStyle = '#7c786c';
      g.font = `${Math.round(m * 0.022)}px Arial, sans-serif`;
      g.fillText(`Visuel provisoire — ${l} × ${h} — voir VISUELS_A_GENERER.md`, l / 2, h - e - m * 0.03);
    }
    const lire = (type, q) => new Promise((ok) => c.toBlob(async (b) => ok(Array.from(new Uint8Array(await b.arrayBuffer()))), type, q));
    return lire('image/' + opts.format, 0.86);
  }, { l, h, logo, opts });
}

const rapport = [];
for (const [nom, l, h, titre, sortie, format] of VISUELS) {
  const fourni = `art/v2/${nom}.png`;
  const source = existsSync(fourni) ? 'data:image/png;base64,' + readFileSync(fourni).toString('base64') : null;
  const octets = await rendre(l, h, { titre, source, format });
  const fichier = `${sortie}.${format === 'jpeg' ? 'jpg' : format}`;
  mkdirSync(dirname(fichier), { recursive: true });
  writeFileSync(fichier, Buffer.from(octets));
  rapport.push(`${source ? 'intégré    ' : 'placeholder'}  ${fichier} (${l}×${h})`);
}
await navigateur.close();
console.log(rapport.join('\n'));
