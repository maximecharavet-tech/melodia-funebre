#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   MELODIA — Les vignettes d'aperçu, une par hommage

       npm run partage

   Ce qui décide qu'on clique sur un lien dans un fil, ce n'est pas le
   texte : c'est l'image. Une vignette générique sous « Saudade Noite »
   ne dit rien de ce qu'on va entendre, et le lien passe inaperçu.

   Chaque œuvre reçoit donc sa carte 1200 × 630 : le sceau à son
   initiale, son registre musical, son titre, pour qui elle a été
   écrite, et les trois mots que sa famille avait donnés. C'est exactement
   ce qu'un lecteur a besoin de savoir avant d'appuyer sur lecture.

   Même fabrique que les documents imprimés : Chromium, les polices de
   la maison embarquées, aucune dépendance ajoutée au site.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const SORTIE = path.join(RACINE, 'assets/img/partage');
const { fontes } = require('./pdf-style.js');
const { adresses } = require('./adresses.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function chromium() {
  try { return require('playwright-core').chromium; }
  catch (e) {
    console.error(
      '\n  Ce script a besoin de Chromium pour dessiner les vignettes.\n' +
      '  Installez-le une fois :  npm i -D playwright-core\n' +
      '  puis relancez :          npm run partage\n');
    process.exit(1);
  }
}

function executable() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(base)) return undefined;
  const d = fs.readdirSync(base).filter((x) => /^chromium/.test(x)).sort().pop();
  if (!d) return undefined;
  for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
    const p = path.join(base, d, rel);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/* Le titre doit tenir. Cormorant à 78 px passe pour la plupart des
   titres du catalogue ; les longs descendent d'un cran plutôt que de
   déborder de la carte ou d'être coupés. */
function taille(titre) {
  const n = String(titre || '').length;
  if (n > 34) return 52;
  if (n > 24) return 62;
  return 78;
}

function carte(t) {
  const initiale = (t.who || t.title || '♪').trim().charAt(0).toUpperCase();
  const mots = String(t.brief || '').split('·').map((m) => m.trim()).filter(Boolean).slice(0, 3);
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>
${fontes()}
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: 1200px; height: 630px;
    background: #040407;
    color: #f4f1ea;
    font-family: 'Jost', system-ui, sans-serif;
    -webkit-print-color-adjust: exact;
    position: relative; overflow: hidden;
  }
  /* Une lueur dorée hors cadre : elle donne du relief sans rien
     ajouter à lire. */
  .lueur {
    position: absolute; width: 760px; height: 760px; right: -230px; top: -260px;
    background: radial-gradient(circle, rgba(201,168,76,.17) 0%, rgba(201,168,76,0) 66%);
  }
  .cadre { position: absolute; inset: 26px; border: 1px solid rgba(201,168,76,.26); }
  .dedans { position: relative; height: 100%; padding: 74px 78px; display: flex; flex-direction: column; }

  .haut { display: flex; align-items: center; gap: 26px; }
  .sceau {
    width: 92px; height: 92px; flex: none; border-radius: 50%;
    border: 1px solid rgba(201,168,76,.5);
    display: grid; place-items: center;
    background: radial-gradient(circle at 32% 28%, rgba(201,168,76,.2), rgba(4,4,7,0) 68%);
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 44px; color: #c9a84c;
  }
  .registre {
    font-family: 'Jetbrains Mono', monospace; font-size: 15px;
    letter-spacing: .26em; text-transform: uppercase; color: #c9a84c;
  }
  .lieu { font-size: 15px; letter-spacing: .04em; color: #8e8878; margin-top: 7px; }

  .titre {
    font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; font-style: italic;
    font-size: ${taille(t.title)}px; line-height: 1.06; color: #f4f1ea;
    margin-top: auto; text-wrap: balance;
  }
  .qui { font-size: 25px; color: #c4bba6; margin-top: 20px; }

  .mots { display: flex; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
  .mot {
    font-family: 'Jetbrains Mono', monospace; font-size: 13px;
    letter-spacing: .2em; text-transform: uppercase; color: #c9a84c;
    border: 1px solid rgba(201,168,76,.34); border-radius: 999px; padding: 8px 16px;
  }

  .pied {
    margin-top: auto; padding-top: 30px; border-top: 1px solid rgba(201,168,76,.2);
    display: flex; justify-content: space-between; align-items: center;
  }
  .marque { display: flex; align-items: baseline; gap: 12px; }
  .marque b { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 30px; letter-spacing: .06em; }
  .marque i { font-style: normal; font-family: 'Jetbrains Mono', monospace; font-size: 12px; letter-spacing: .3em; text-transform: uppercase; color: #8e8878; }
  .devise { font-family: 'Jetbrains Mono', monospace; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: #6b5828; }
</style></head><body>
  <div class="lueur"></div>
  <div class="cadre"></div>
  <div class="dedans">
    <div class="haut">
      <div class="sceau">${esc(initiale)}</div>
      <div>
        <div class="registre">${esc(t.style)}</div>
        ${t.lieu ? `<div class="lieu">${esc(t.lieu)}</div>` : ''}
      </div>
    </div>
    <div class="titre">${esc(t.title)}</div>
    <div class="qui">Composé pour ${esc(t.who)}</div>
    ${mots.length ? `<div class="mots">${mots.map((m) => `<span class="mot">${esc(m)}</span>`).join('')}</div>` : ''}
    <div class="pied">
      <div class="marque"><b>MELODIA</b><i>Funèbre</i></div>
      <div class="devise">La musique traverse le temps</div>
    </div>
  </div>
</body></html>`;
}

async function fabriquer() {
  /* Le contenu publié fait foi, comme pour les pages. */
  const data = require('./data.js');
  const fichierContenu = path.join(RACINE, 'assets/data/content.json');
  if (fs.existsSync(fichierContenu)) {
    try {
      const c = JSON.parse(fs.readFileSync(fichierContenu, 'utf8'));
      if (c.demos) {
        data.TRACKS.length = 0;
        c.demos.filter((d) => d.visible !== false).forEach((d) => data.TRACKS.push({
          id: d.id, title: d.title, who: d.who, lieu: d.lieu, style: d.style,
          file: d.audio, story: d.story, lyrics: d.lyrics, brief: d.brief
        }));
      }
    } catch (e) { console.error('  content.json illisible : ' + e.message); }
  }

  const liste = data.TRACKS;
  const slugs = adresses(liste);
  fs.mkdirSync(SORTIE, { recursive: true });

  const nav = await chromium().launch({ executablePath: executable() });
  const page = await nav.newPage({ viewport: { width: 1200, height: 630 } });

  let n = 0;
  for (let i = 0; i < liste.length; i++) {
    await page.setContent(carte(liste[i]), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const cible = path.join(SORTIE, slugs[i] + '.jpg');
    await page.screenshot({ path: cible, type: 'jpeg', quality: 88 });
    n++;
  }
  await nav.close();

  /* Une œuvre renommée laisse sa vignette derrière elle, comme sa page. */
  const attendues = new Set(slugs.map((s) => s + '.jpg'));
  let effacees = 0;
  for (const f of fs.readdirSync(SORTIE)) {
    if (f.endsWith('.jpg') && !attendues.has(f)) { fs.unlinkSync(path.join(SORTIE, f)); effacees++; }
  }

  const poids = fs.readdirSync(SORTIE)
    .reduce((a, f) => a + fs.statSync(path.join(SORTIE, f)).size, 0);
  console.log('  ' + n + ' vignettes 1200×630 · ' + Math.round(poids / 1024) + ' Ko au total' +
              (effacees ? ' · ' + effacees + ' orpheline(s) retirée(s)' : ''));
}

fabriquer().catch((e) => { console.error('  ' + e.message); process.exit(1); });
