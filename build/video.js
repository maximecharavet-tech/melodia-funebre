#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   MELODIA — Les vidéos verticales, une par hommage

       npm run video                 les dix-huit, en 9:16
       npm run video -- saudade      celle-là seulement
       npm run video -- --format 4:5 le format du fil Instagram

   TikTok, Reels et les Stories ne publient pas de fichier audio :
   ils publient de la vidéo. Dix-huit œuvres originales ne servaient
   donc à rien sur ces réseaux, faute d'un contenant. Ce script en
   fabrique un.

   CE QU'IL PRODUIT

   Le disque d'or du site, qui tourne, sur fond noir ; le titre, pour
   qui l'œuvre a été écrite, son registre ; une barre qui avance ; et
   l'œuvre elle-même, en extrait de trente-cinq secondes.

   LE DISQUE N'EST PAS REDESSINÉ

   Sa matière vit dans assets/css/style.css, que cette page charge
   comme le ferait un navigateur. Une retouche de l'or sur le site se
   retrouve dans les vidéos au prochain « npm run video ». Rien n'est
   recopié, donc rien ne pourra diverger — même règle que pour les
   documents imprimés.

   L'EXTRAIT EST MESURÉ, PAS DEVINÉ

   Une chanson qui commence par vingt secondes de nappe est morte sur
   TikTok : la première seconde décide. Le script décode donc la piste
   en basse définition, calcule son énergie seconde par seconde, et
   retient la fenêtre la plus dense. C'est le refrain, presque
   toujours.

   DEUX OUTILS, AUCUN COMPTE

   Chromium pour le dessin, ffmpeg pour le montage. Les deux sont
   locaux et gratuits, il n'y a ni abonnement, ni clé d'API, ni envoi
   de vos œuvres chez un tiers. Le site, lui, reste sans dépendance :
   « npm run pages » n'a pas bougé.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const RACINE = path.join(__dirname, '..');
const SORTIE = path.join(RACINE, 'videos');
const { fontes } = require('./pdf-style.js');
const { adresses } = require('./adresses.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Les deux formats qui servent vraiment. Le 9:16 couvre TikTok, les
   Reels et les Stories ; le 4:5 est le plus haut qu'accepte le fil
   Instagram, donc celui qui occupe le plus d'écran. */
const FORMATS = {
  /* « centre » est la hauteur, en fraction de l'image, où se pose le
     milieu du disque. Réglé à l'œil sur une image extraite : plus haut,
     il laissait un vide mort entre lui et le titre ; plus bas, il
     passait sous les boutons que TikTok superpose à droite. */
  '9:16': { l: 1080, h: 1920, disque: 0.72, centre: 0.355 },
  '4:5':  { l: 1080, h: 1350, disque: 0.60, centre: 0.330 }
};

const DUREE = 35;      /* secondes d'extrait */
const FONDU = 1.2;     /* fondu audio d'entrée et de sortie */
const TOURS = 0.55;    /* radians par seconde — un 33 tours fait 3,5 rad/s,
                          beaucoup trop rapide pour être regardable */

/* ─── Les deux outils, et un message clair s'ils manquent ─── */
function chromium() {
  try { return require('playwright-core').chromium; }
  catch (e) {
    console.error('\n  Il manque Chromium pour dessiner les images.\n' +
                  '  npm i -D playwright-core\n');
    process.exit(1);
  }
}

function navigateur() {
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

/* Le ffmpeg livré avec Playwright ne convient pas : il est compilé
   « --disable-everything » et ne sait ni lire un MP3, ni écrire un
   MP4. On exige donc une vraie version, et on le dit plutôt que
   d'échouer sur un codec introuvable au milieu du montage. */
function ffmpeg() {
  const candidats = [];
  try { candidats.push(require('ffmpeg-static')); } catch (e) { /* pas installé */ }
  candidats.push(process.env.FFMPEG, '/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg');
  for (const c of candidats.filter(Boolean)) {
    if (!fs.existsSync(c)) continue;
    try { fs.chmodSync(c, 0o755); } catch (e) { /* déjà exécutable */ }
    const v = spawnSync(c, ['-hide_banner', '-encoders'], { encoding: 'utf8' });
    if (v.status === 0 && /libx264/.test(v.stdout) && /\baac\b/.test(v.stdout)) return c;
  }
  console.error(
    '\n  Il manque ffmpeg, ou celui qui est installé ne sait pas encoder en H.264 + AAC.\n' +
    '  Installez-en un complet, une fois :  npm i -D ffmpeg-static\n' +
    '  (Le ffmpeg fourni avec Playwright ne convient pas : il est amputé de tous\n' +
    '   ses codecs audio et ne sait pas écrire de MP4.)\n');
  process.exit(1);
}

/* ─── Où commence l'extrait ─────────────────────────────────────
   On décode la piste en mono 8 kHz — largement assez pour mesurer une
   énergie, et cent fois plus léger que le fichier d'origine — puis on
   cherche la fenêtre de trente-cinq secondes dont l'énergie moyenne
   est la plus forte. C'est presque toujours le refrain, et c'est ce
   qu'il faut mettre en premier. */
function meilleurDepart(FF, mp3, duree) {
  let brut;
  try {
    brut = execFileSync(FF, ['-v', 'quiet', '-i', mp3, '-ac', '1', '-ar', '8000',
                             '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
  } catch (e) { return { depart: 0, mesure: false, total: 0 }; }

  const ECH = 8000;
  const total = brut.length / 2 / ECH;
  if (total <= duree + 1) return { depart: 0, mesure: true, total };

  /* Énergie par seconde */
  const par = [];
  for (let s = 0; s + 1 <= total; s++) {
    let somme = 0;
    const d = s * ECH * 2;
    for (let i = 0; i < ECH; i++) {
      const v = brut.readInt16LE(d + i * 2) / 32768;
      somme += v * v;
    }
    par.push(Math.sqrt(somme / ECH));
  }

  /* La meilleure fenêtre, en somme glissante */
  const n = Math.min(duree, par.length);
  let courant = par.slice(0, n).reduce((a, b) => a + b, 0);
  let meilleur = courant, ou = 0;
  for (let s = 1; s + n <= par.length; s++) {
    courant += par[s + n - 1] - par[s - 1];
    if (courant > meilleur) { meilleur = courant; ou = s; }
  }
  /* Une seconde de marge avant : on entre juste avant l'attaque plutôt
     que pile dessus, ce qui s'entend comme une coupure. */
  return { depart: Math.max(0, ou - 1), mesure: true, total };
}

/* ─── Les images ─────────────────────────────────────────────────
   Trois calques : le fond avec tout le texte, le disque seul qui
   tournera, et les parties du disque qui ne doivent PAS tourner —
   l'étiquette et son initiale, qu'une rotation rendrait illisibles. */
function gabarit(t, F, quoi) {
  const initiale = (t.who || t.title || '♪').trim().charAt(0).toUpperCase();
  const cote = Math.round(F.l * F.disque);
  const styleSite = fs.readFileSync(path.join(RACINE, 'assets/css/style.css'), 'utf8');

  const commun = `${fontes()}
    ${styleSite}
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: transparent; }
    /* Le disque du site se dimensionne en vw : ici on impose sa taille,
       sans quoi il se règlerait sur la fenêtre de rendu. */
    .disque-cadre { width: ${cote}px !important; aspect-ratio: 1; }
    /* L'initiale est plafonnée à 2,1 rem sur le site, où le disque fait
       250 px. Sur un disque trois fois plus grand, elle devenait un
       point. On la remet à l'échelle du disque. */
    .etiquette b { font-size: ${Math.round(cote * 0.135)}px !important; }
  `;

  if (quoi === 'disque') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${commun}
      body { width: ${cote}px; height: ${cote}px; }
    </style></head><body>
      <div class="disque-cadre"><div class="disque"></div></div>
    </body></html>`;
  }

  if (quoi === 'etiquette') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${commun}
      body { width: ${cote}px; height: ${cote}px; }
    </style></head><body>
      <div class="disque-cadre">
        <div class="disque-bord"></div>
        <div class="etiquette"><b>${esc(initiale)}</b></div>
      </div>
    </body></html>`;
  }

  /* Le fond : noir, la lueur hors cadre, le texte, la marque. La place
     du disque est laissée vide — ffmpeg l'y posera. */
  const grand = t.title.length > 26;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${commun}
    body {
      width: ${F.l}px; height: ${F.h}px; background: #040407; color: #f4f1ea;
      font-family: 'Jost', system-ui, sans-serif; overflow: hidden; position: relative;
      -webkit-font-smoothing: antialiased;
    }
    .lueur {
      position: absolute; width: ${Math.round(F.l * 1.5)}px; height: ${Math.round(F.l * 1.5)}px;
      left: 50%; top: ${Math.round(F.h * F.centre)}px; transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(201,168,76,.16) 0%, rgba(4,4,7,0) 66%);
    }
    .bas {
      position: absolute; left: 0; right: 0; bottom: 0;
      padding: 0 ${Math.round(F.l * 0.085)}px ${Math.round(F.h * 0.085)}px;
      text-align: center;
    }
    .registre {
      font-family: 'Jetbrains Mono', monospace; font-size: 25px;
      letter-spacing: .3em; text-transform: uppercase; color: #c9a84c; margin: 0 0 26px;
    }
    h1 {
      font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; font-style: italic;
      font-size: ${grand ? 72 : 92}px; line-height: 1.04; margin: 0; color: #f4f1ea;
      text-wrap: balance;
    }
    .qui { font-size: 34px; color: #c4bba6; margin: 30px 0 0; }
    .marque {
      margin-top: ${Math.round(F.h * 0.052)}px; padding-top: 30px;
      border-top: 1px solid rgba(201,168,76,.24);
      display: flex; justify-content: center; align-items: baseline; gap: 16px;
    }
    .marque b { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 40px; letter-spacing: .07em; }
    .marque i { font-style: normal; font-family: 'Jetbrains Mono', monospace; font-size: 18px;
                letter-spacing: .3em; text-transform: uppercase; color: #8e8878; }
  </style></head><body>
    <div class="lueur"></div>
    <div class="bas">
      <p class="registre">${esc(t.style)}</p>
      <h1>${esc(t.title)}</h1>
      <p class="qui">Composé pour ${esc(t.who)}</p>
      <div class="marque"><b>MELODIA</b><i>Funèbre</i></div>
    </div>
  </body></html>`;
}

/* ─── Le montage ─── */
function monter(FF, calques, mp3, depart, cible, F) {
  const cote = Math.round(F.l * F.disque);
  const y = Math.round(F.h * F.centre - cote / 2);
  const x = Math.round((F.l - cote) / 2);
  const barreH = 8;

  /* La rotation exige un canal alpha avant le filtre, sinon les coins
     du carré se peignent en noir par-dessus le fond. */
  const filtre = [
    `[1:v]format=rgba,rotate=a=t*${TOURS}:c=none:ow=iw:oh=ih[d]`,
    `[0:v][d]overlay=${x}:${y}[a]`,
    `[a][2:v]overlay=${x}:${y}[b]`,
    /* La barre de progression : elle donne au spectateur une raison de
       rester, et c'est mesurable — elle fait monter le temps de vue. */
    `[b]drawbox=x=0:y=${F.h - barreH}:w='iw*t/${DUREE}':h=${barreH}:` +
      `color=0xc9a84c@0.92:t=fill[v]`
  ].join(';');

  const args = [
    '-v', 'error', '-y',
    '-loop', '1', '-framerate', '30', '-i', calques.fond,
    '-loop', '1', '-framerate', '30', '-i', calques.disque,
    '-loop', '1', '-framerate', '30', '-i', calques.etiquette,
    '-ss', String(depart), '-t', String(DUREE), '-i', mp3,
    '-filter_complex', filtre,
    '-map', '[v]', '-map', '3:a',
    '-af', `afade=t=in:st=0:d=${FONDU},afade=t=out:st=${DUREE - FONDU}:d=${FONDU}`,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-level', '4.0',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
    '-movflags', '+faststart', '-t', String(DUREE), '-shortest',
    cible
  ];
  const r = spawnSync(FF, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('ffmpeg : ' + (r.stderr || '').trim().slice(0, 400));
}

/* ─── La fabrique ─── */
async function fabriquer(filtre, cleFormat) {
  const F = FORMATS[cleFormat];
  if (!F) { console.error('  Format inconnu. Au choix : ' + Object.keys(FORMATS).join(', ')); process.exit(1); }

  const FF = ffmpeg();
  const c = JSON.parse(fs.readFileSync(path.join(RACINE, 'assets/data/content.json'), 'utf8'));
  const toutes = (c.demos || []).filter((d) => d.visible !== false);
  const slugs = adresses(toutes);

  let liste = toutes.map((t, i) => Object.assign({}, t, { slug: slugs[i] }));
  if (filtre) {
    const f = filtre.toLowerCase();
    liste = liste.filter((t) => t.slug.includes(f) || t.title.toLowerCase().includes(f));
    if (!liste.length) { console.error('  Aucune œuvre ne correspond à « ' + filtre + ' ».'); process.exit(1); }
  }

  fs.mkdirSync(SORTIE, { recursive: true });
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'melodia-video-'));
  const nav = await chromium().launch({ executablePath: navigateur() });

  console.log('  ' + liste.length + ' vidéo(s) · ' + cleFormat + ' · ' + F.l + '×' + F.h);
  let n = 0;
  for (const t of liste) {
    const mp3 = path.join(RACINE, t.audio || t.file || '');
    if (!fs.existsSync(mp3)) { console.error('  AUDIO ABSENT  ' + t.title); continue; }

    const calques = {};
    for (const quoi of ['fond', 'disque', 'etiquette']) {
      const cote = Math.round(F.l * F.disque);
      const page = await nav.newPage({
        viewport: quoi === 'fond' ? { width: F.l, height: F.h } : { width: cote, height: cote },
        deviceScaleFactor: 1
      });
      await page.setContent(gabarit(t, F, quoi), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      calques[quoi] = path.join(temp, t.slug + '-' + quoi + '.png');
      await page.screenshot({ path: calques[quoi], omitBackground: quoi !== 'fond' });
      await page.close();
    }

    const { depart, mesure, total } = meilleurDepart(FF, mp3, DUREE);
    const cible = path.join(SORTIE, t.slug + (cleFormat === '4:5' ? '-4x5' : '') + '.mp4');
    monter(FF, calques, mp3, depart, cible, F);

    const ko = Math.round(fs.statSync(cible).size / 1024);
    console.log('  ' + path.basename(cible).padEnd(42) + String(ko).padStart(5) + ' Ko' +
      '  extrait ' + (mesure ? 'à ' + depart + ' s sur ' + Math.round(total) + ' s' : 'au début (non mesuré)'));
    n++;
  }

  await nav.close();
  fs.rmSync(temp, { recursive: true, force: true });
  console.log('\n  Dans ' + path.relative(RACINE, SORTIE) + '/ — à téléverser à la main.');
  console.log('  Aucune plateforme ne publie sans compte développeur : ces fichiers\n' +
              '  sont prêts, le téléversement reste le vôtre.');
}

/* ─── L'appel ─── */
const args = process.argv.slice(2);
let cleFormat = '9:16';
const iF = args.indexOf('--format');
if (iF !== -1) { cleFormat = args[iF + 1]; args.splice(iF, 2); }
fabriquer(args[0], cleFormat).catch((e) => { console.error('  ' + e.message); process.exit(1); });
