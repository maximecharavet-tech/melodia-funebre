/**
 * Visuels de la console Pro : intègre ceux de art/ s'ils existent, sinon
 * fabrique des placeholders aux mêmes noms et dimensions (fond #040407,
 * filet or, logo officiel posé tel quel — jamais redessiné).
 *
 * Sorties : assets/img/pro/<nom>.png + .webp (+ 1/2 largeur en .webp pour
 * srcset), icônes PWA dans assets/img/pro/icons/.
 *
 *   npm install --prefix /tmp/pw playwright      (outil de poste, hors dépôt)
 *   PLAYWRIGHT=/tmp/pw/node_modules/playwright/index.js node scripts/pro-assets.mjs
 *
 * Les vidéos (assets/video/pro/) se fabriquent avec ffmpeg : voir
 * docs/pro-app/ASSETS.md.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ASSETS = [
  ['icon-1024', 1024, 1024, 'Icône'],
  ['splash-2732', 2732, 2732, 'Écran de lancement'],
  ['onboarding-1-questionnaire', 1280, 800, 'Le questionnaire'],
  ['onboarding-2-composition', 1280, 800, 'La composition'],
  ['onboarding-3-qr', 1280, 800, 'Le QR code'],
  ['empty-dossiers', 960, 540, 'Aucun dossier'],
  ['empty-bibliotheque', 960, 540, 'Bibliothèque'],
  ['empty-qr', 960, 540, 'QR & impressions'],
  ['qr-card-mockup', 1600, 1200, 'Carte QR'],
  ['store-bg-phone', 1080, 1920, 'Store — téléphone'],
  ['store-bg-tablet', 2560, 1600, 'Store — tablette']
];
const ICONES = [['pro-192', 192, false], ['pro-512', 512, false], ['pro-maskable-512', 512, true]];

const SORTIE = 'assets/img/pro';
mkdirSync(SORTIE + '/icons', { recursive: true });

const chemin = process.env.PLAYWRIGHT || 'playwright';
const pw = await import(chemin.includes('/') || chemin.includes('\\') ? pathToFileURL(chemin).href : chemin);
const chromium = (pw.default || pw).chromium;
const navigateur = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await navigateur.newPage();
const logo = 'data:image/webp;base64,' + readFileSync('assets/img/logo-melodia-600.webp').toString('base64');
await page.setContent('<html><body style="margin:0;background:#040407"></body></html>');

/** Dessine dans un canvas et rend PNG + WebP (pleine et demi-largeur). */
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
      g.fillStyle = '#040407'; g.fillRect(0, 0, l, h);
      const m = Math.min(l, h);
      if (!opts.icone) {
        const grad = g.createLinearGradient(0, 0, l, h);
        grad.addColorStop(0, '#97803c'); grad.addColorStop(0.45, '#e3c977'); grad.addColorStop(1, '#c9a84c');
        g.strokeStyle = grad; g.lineWidth = Math.max(2, m * 0.004);
        const e = m * 0.04;
        g.strokeRect(e, e, l - 2 * e, h - 2 * e);
      }
      const t = opts.icone ? m * (opts.masquable ? 0.62 : 0.86) : m * 0.34;
      g.drawImage(img, (l - t) / 2, (h - t) / 2 - (opts.icone ? 0 : m * 0.06), t, t);
      if (!opts.icone) {
        g.fillStyle = '#c9a84c';
        g.textAlign = 'center';
        g.font = `${Math.round(m * 0.028)}px "Courier New", monospace`;
        g.fillText('MELODIA FUNÈBRE PRO', l / 2, h / 2 + t / 2 + m * 0.02);
        g.fillStyle = '#c4bba6';
        g.font = `italic ${Math.round(m * 0.045)}px Georgia, serif`;
        g.fillText(opts.titre, l / 2, h / 2 + t / 2 + m * 0.085);
        g.fillStyle = '#7c786c';
        g.font = `${Math.round(m * 0.022)}px Arial, sans-serif`;
        g.fillText('Visuel provisoire — à remplacer par le fichier définitif', l / 2, h - m * 0.08);
      }
    }
    const lire = (canvas, type, q) => new Promise((ok) => canvas.toBlob(async (b) => ok(Array.from(new Uint8Array(await b.arrayBuffer()))), type, q));
    const demi = document.createElement('canvas');
    demi.width = Math.round(l / 2); demi.height = Math.round(h / 2);
    demi.getContext('2d').drawImage(c, 0, 0, demi.width, demi.height);
    return { png: await lire(c, 'image/png'), webp: await lire(c, 'image/webp', 0.86), webpDemi: await lire(demi, 'image/webp', 0.86) };
  }, { l, h, logo, opts });
}

const rapport = [];
for (const [nom, l, h, titre] of ASSETS) {
  const fourni = `art/${nom}.png`;
  const source = existsSync(fourni) ? 'data:image/png;base64,' + readFileSync(fourni).toString('base64') : null;
  const r = await rendre(l, h, { titre, source });
  // Le PNG pleine taille n'est gardé que pour l'icône et l'écran de lancement (stores, Capacitor).
  if (['icon-1024', 'splash-2732'].includes(nom)) writeFileSync(`${SORTIE}/${nom}.png`, Buffer.from(r.png));
  writeFileSync(`${SORTIE}/${nom}.webp`, Buffer.from(r.webp));
  writeFileSync(`${SORTIE}/${nom}-${Math.round(l / 2)}.webp`, Buffer.from(r.webpDemi));
  rapport.push(`${source ? 'intégré ' : 'placeholder'}  ${nom} (${l}×${h})`);
}
for (const [nom, t, masquable] of ICONES) {
  const r = await rendre(t, t, { icone: true, masquable });
  writeFileSync(`${SORTIE}/icons/${nom}.png`, Buffer.from(r.png));
  rapport.push(`icône        ${nom} (${t}×${t})`);
}
await navigateur.close();
console.log(rapport.join('\n'));
