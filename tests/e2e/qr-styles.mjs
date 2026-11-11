// Relit chaque style de QR (3 modules × 2 yeux × logo ou non × 2 résolutions) avec jsQR,
// décodeur indépendant du noyau. Variables : PLAYWRIGHT, CHROME, JSQR (outils de poste).
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const { demarrer } = await import(pathToFileURL(process.cwd() + '/tests/e2e/serveur.mjs').href);
const pw = await import(pathToFileURL(process.env.PLAYWRIGHT).href);
const { serveur, url } = await demarrer();
const b = await pw.default.chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage();
await p.goto(url + '/404.html');
await p.addScriptTag({ url: url + '/assets/js/vendor/melodia-pro-glue.js' });
await p.addScriptTag({ content: readFileSync(process.env.JSQR, 'utf8') });
const logo = 'data:image/webp;base64,' + readFileSync('assets/img/logo-melodia-160.webp').toString('base64');
const r = await p.evaluate(async ({ logo }) => {
  const k = await MelodiaProNoyau.charger('/assets/js/vendor/melodia_pro.wasm');
  const out = [];
  for (const modules of ['carre', 'arrondi', 'point']) for (const yeux of ['carre', 'arrondi']) for (const lg of [null, logo]) for (const px of [6, 11]) {
    const q = k.qrSvg({ texte: 'https://melodia-funebre.fr/m/7K3M9QXT2BZZ', modules, yeux, encre: '#040407', fond: '#f4f1ea', logo: lg ? 0.2 : 0, logo_href: lg || '' });
    const img = new Image();
    await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(q.svg); });
    const t = q.cote * px;
    const c = document.createElement('canvas'); c.width = t; c.height = t;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, t, t); g.drawImage(img, 0, 0, t, t);
    const d = g.getImageData(0, 0, t, t);
    const res = jsQR(d.data, t, t);
    out.push(`${modules}/${yeux}/${lg ? 'logo' : 'nu'}/${px}px → ${res ? 'OK' : 'ÉCHEC'}`);
  }
  return out;
}, { logo });
console.log(r.join('\n'));
await b.close(); serveur.close();
