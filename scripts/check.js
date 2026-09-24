/* Vérifie que le site est complet avant tout déploiement. */
const fs = require('fs');

const files = [
  'index.html', 'processus.html', 'demos.html', 'rites.html', 'offres.html', 'professionnels.html',
  'contact.html', 'qui-sommes-nous.html', 'hyper-ai-engine.html', 'application.html', 'sw.js', 'assets/js/application.js', 'rejoindre.html', 'compte.html', 'espace.html', 'dashboard-partenaire.html', 'dashboard-master.html', 'dashboard-commercial.html',
  'chanson-hommage.html', 'qr-code-memorial.html',
  'mentions-legales.html', 'cgv.html', 'confidentialite.html', '404.html',
  'assets/css/style.css', 'assets/css/dashboard.css',
  'assets/js/main.js', 'assets/js/catalogue.js', 'assets/js/order.js', 'assets/js/atelier-music.js',
  'assets/js/content.js', 'assets/js/proprietaire.js', 'assets/js/intranet.js', 'assets/js/livraison.js', 'assets/js/rappel.js', 'assets/js/commercial.js', 'assets/js/courrier.js', 'assets/js/ornements.js', 'api/lead.js', 'api/prospects.js', 'assets/data/content.json',
  'api/_courrier.js', 'api/famille.js', 'api/prospect-mail.js',
  'assets/js/auth.js', 'assets/js/config.js', 'assets/js/candidature.js', 'assets/js/espace.js',
  'assets/img/logo-melodia.jpg', 'assets/img/logo-melodia-complet.jpg', 'assets/img/logo-melodia-anime.mp4',
  'assets/img/plaque-qr-700.webp', 'assets/img/plaque-qr-700.jpg',
  'assets/img/plaque-qr-1100.webp', 'assets/img/plaque-qr-1100.jpg',
  'assets/img/og-melodia.jpg', 'assets/img/intro-logo.jpg', 'assets/img/maxime.png', 'assets/img/hyper-engine.png', 'assets/img/equipe.jpg', 'favicon.ico', 'site.webmanifest',
  'assets/img/icons/icon-192.png', 'assets/img/icons/icon-512.png',
  'assets/img/icons/icon-48.png', 'assets/img/icons/icon-32.png',
  'assets/img/icons/icon-180.png', 'assets/img/icons/maskable-512.png',
  'api/generate-music.js', 'api/music-status.js', 'api/music-config.js', 'api/generate-lyrics.js',
  'vercel.json', 'robots.txt', 'sitemap.xml'
];

/* Les hommages étaient listés à la main, et la liste avait pris du
   retard : sept fichiers y figuraient pour dix-sept réellement servis.
   Un catalogue qui grandit à chaque commande ne se tient pas à jour à
   la main — on relit donc ce que le contenu publié référence vraiment,
   ce qui vérifie du même coup que rien n'y pointe dans le vide. */
function audiosDuCatalogue() {
  try {
    const c = JSON.parse(fs.readFileSync('assets/data/content.json', 'utf8'));
    return [...new Set((c.demos || []).map((d) => d.audio).filter((a) => a && !/^https?:/i.test(a)))];
  } catch (e) {
    console.error('  ILLISIBLE assets/data/content.json —', e.message);
    return [];
  }
}
const audios = audiosDuCatalogue();
if (!audios.length) console.error('  ATTENTION aucun hommage trouvé dans le catalogue');
files.push(...audios);

let ok = true;
for (const f of files) {
  if (fs.existsSync(f)) console.log('  ok  ', f);
  else { console.error('  MANQUE', f); ok = false; }
}

/* Deux hommages portant le même titre : les cartes du catalogue
   deviennent indiscernables, et le balisage ItemList annonce deux fois
   le même nom. C'est arrivé une fois, en ajoutant un morceau dont le
   fichier portait déjà le titre d'un autre — d'où ce garde-fou. */
try {
  const cat = JSON.parse(fs.readFileSync('assets/data/content.json', 'utf8')).demos || [];
  const vus = new Map();
  for (const d of cat) {
    const cle = (d.title || '').trim().toLowerCase();
    if (!cle) continue;
    if (vus.has(cle)) {
      console.error(`  DOUBLON titre « ${d.title} » : ${vus.get(cle)} et ${d.id}`);
      ok = false;
    } else vus.set(cle, d.id);
  }
} catch (e) { /* l'illisibilité est déjà signalée plus haut */ }

/* Les deux documents imprimés sont servis en statique et référencés
   par les consoles. Un lien qui télécharge une page 404 se voit à
   l'ouverture du fichier, jamais avant — d'où ce contrôle, qui vérifie
   aussi que le PDF n'est pas un fichier vide de zéro octet. */
for (const [f, mini] of [['documents/melodia-brochure-partenaire.pdf', 400],
                         ['documents/melodia-manuel-de-vente.pdf', 200],
                         ['documents/melodia-plan-linkedin.pdf', 200],
                         ['documents/melodia-plan-reseaux-sociaux.pdf', 200]]) {
  if (!fs.existsSync(f)) {
    console.error(`  MANQUE ${f} — relancez « npm run pdf »`);
    ok = false;
  } else {
    const ko = Math.round(fs.statSync(f).size / 1024);
    if (ko < mini) { console.error(`  SUSPECT ${f} ne pèse que ${ko} Ko`); ok = false; }
    else console.log(`  ok   ${f} (${ko} Ko)`);
  }
}

/* Chaque œuvre a sa vignette d'aperçu. Sans elle, un lien partagé
   s'affiche sans image dans le fil — c'est-à-dire qu'il ne s'affiche
   pas. Le défaut est invisible sur le site : il ne se voit qu'une fois
   le lien posté, trop tard. */
try {
  const cat = JSON.parse(fs.readFileSync('assets/data/content.json', 'utf8')).demos || [];
  const { adresses } = require('../build/adresses.js');
  const visibles = cat.filter((d) => d.visible !== false);
  const slugs = adresses(visibles);
  const manquantes = slugs.filter((s) => !fs.existsSync('assets/img/partage/' + s + '.jpg'));
  if (manquantes.length) {
    console.error(`  MANQUE ${manquantes.length} vignette(s) de partage — relancez « npm run partage »`);
    manquantes.slice(0, 5).forEach((s) => console.error('         assets/img/partage/' + s + '.jpg'));
    ok = false;
  } else {
    console.log(`  ok   ${slugs.length} vignettes de partage`);
  }
} catch (e) { console.error('  vignettes de partage : ' + e.message); ok = false; }

/* Le QR de démonstration doit être là, et être un vrai QR.
   Il est encodé à la génération ; la première fois, « fs » n'était pas
   importé dans parts.js, le bloc sortait vide et un catch muet ne
   disait rien. Une page qui invite à scanner un code absent est pire
   que pas de section du tout. */
{
  const porteuses = ['index.html', 'professionnels.html', 'qr-code-memorial.html'].filter((f) => fs.existsSync(f));
  const sans = porteuses.filter((f) => {
    const h = fs.readFileSync(f, 'utf8');
    const m = h.match(/<div class="chaine-qr">([\s\S]*?)<\/div>/);
    return !m || !/<path[^>]+d="M/.test(m[1]);
  });
  if (sans.length) {
    console.error('  QR de démonstration absent ou vide : ' + sans.join(', '));
    ok = false;
  } else if (porteuses.length) {
    console.log(`  ok   QR de démonstration présent sur ${porteuses.length} pages`);
  }
}

/* Le service worker doit précharger de quoi afficher une page.
   Sa liste est moissonnée dans index.html : le jour où les chemins
   sont passés en absolu, la moisson n'a plus rien trouvé et le site
   hors ligne se serait ouvert sans style. Une liste vide ne se voit
   nulle part — sauf ici. */
try {
  const sw = fs.readFileSync('sw.js', 'utf8');
  const m = sw.match(/const PRECHARGE = \[([\s\S]*?)\];/);
  const liste = m ? JSON.parse('[' + m[1] + ']') : [];
  const actifs = liste.filter((u) => /^\/assets\//.test(u));
  if (actifs.length < 5) {
    console.error(`  sw.js ne précharge que ${actifs.length} actif(s) — la moisson dans index.html a échoué`);
    ok = false;
  } else {
    console.log(`  ok   sw.js précharge ${liste.length} adresses, dont ${actifs.length} actifs`);
  }
} catch (e) { console.error('  sw.js illisible — ' + e.message); ok = false; }

/* Aucun chemin d'actif relatif, nulle part.
   Trois pages ne vivent pas à la racine : « /m/<jeton> » pour la page
   mémorielle, « /ecouter/<titre> » pour chaque œuvre. « assets/css/
   style.css » y désigne « /m/assets/css/style.css ». La page arrive
   alors en texte brut, sans une ligne de style — c'est exactement ce
   qui est arrivé, et cela n'a été vu qu'en production, sur la page
   qu'ouvre un QR code devant une tombe.

   Le contrôle vaut pour toutes les pages : une page aujourd'hui à la
   racine peut être réécrite demain, et le défaut ne se voit jamais
   avant d'être en ligne. */
{
  const aVerifier = new Set(files.filter((f) => f.endsWith('.html')));
  for (const f of fs.readdirSync('.')) if (/\.html$/.test(f)) aVerifier.add(f);
  const fautives = [];
  for (const f of aVerifier) {
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    let n = (html.match(/\s(?:href|src|poster|data-src)="(?:assets|audio)\//g) || []).length;
    /* Le même angle mort que dans la fonction qui rend les chemins
       absolus : l'expression ci-dessus s'accroche au guillemet
       ouvrant et ne voit donc que la première adresse d'un
       « srcset ». Les suivantes passaient. */
    for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) {
      n += m[1].split(',').filter((c) => /^\s*(?:assets|audio)\//.test(c)).length;
    }
    if (n) fautives.push(`${f} (${n})`);
  }
  if (fautives.length) {
    console.error('  CHEMINS RELATIFS vers les actifs — ils casseront sous /m/ ou /ecouter/ :');
    fautives.forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log(`  ok   ${aVerifier.size} pages, aucun chemin d'actif relatif`);
  }
}

/* Chaque empreinte doit correspondre au fichier qu'elle désigne.
   Les feuilles de style et les scripts sont servis « immutable » pour un
   an : l'empreinte dans leur adresse est la seule chose qui dit à un
   navigateur qu'il faut les recharger. Elle a déjà été figée une fois —
   le jour où les chemins sont devenus absolus, l'expression qui la
   réécrivait dans les cinq consoles ne correspondait plus, et personne
   ne l'a vu : une page marquée d'une empreinte périmée s'affiche très
   bien chez qui ne l'avait jamais ouverte. */
{
  const crypto = require('crypto');
  const periculum = [];
  const aVerifier = new Set(files.filter((f) => f.endsWith('.html')));
  for (const f of fs.readdirSync('.')) if (/\.html$/.test(f)) aVerifier.add(f);
  let n = 0;
  for (const f of aVerifier) {
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/\/(assets\/(?:css|js|img)\/[a-z0-9./-]+)\?v=([a-f0-9]+)/gi)) {
      const [, actif, marque] = m;
      if (!fs.existsSync(actif)) continue;
      const vrai = crypto.createHash('sha1').update(fs.readFileSync(actif)).digest('hex').slice(0, 8);
      n++;
      if (vrai !== marque) periculum.push(`${f} → ${actif} porte ?v=${marque}, le fichier vaut ${vrai}`);
    }
  }
  if (periculum.length) {
    console.error('  EMPREINTES PÉRIMÉES — ces actifs resteront en cache un an :');
    [...new Set(periculum)].forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log(`  ok   ${n} empreintes d'actifs à jour`);
  }
}

/* Deux registres ne doivent jamais porter la même illustration : ce
   serait pire que pas d'illustration du tout, puisque le lecteur y
   lirait une parenté qui n'existe pas. Le repli au disque ne compte
   pas — il est fait pour être partagé par tous les registres sans
   dessin.

   Et chaque registre du catalogue doit AVOIR son dessin : sans ce
   contrôle, un style ajouté demain en console sortirait avec un
   disque générique au milieu de dix-neuf instruments, et personne ne
   le verrait avant un client. */
{
  const { INSTRUMENTS } = require('../build/instruments.js');
  const vus = new Map();
  const jumeaux = [];
  for (const [nom, d] of Object.entries(INSTRUMENTS)) {
    if (vus.has(d)) jumeaux.push(vus.get(d) + ' et ' + nom);
    else vus.set(d, nom);
  }
  if (jumeaux.length) {
    console.error('  ILLUSTRATIONS EN DOUBLE :');
    jumeaux.forEach((x) => console.error('         ' + x));
    ok = false;
  }

  const { STYLES } = require('../build/data.js');
  const c = JSON.parse(fs.readFileSync('assets/data/content.json', 'utf8'));
  const attendus = [...new Set([
    ...(c.demos || []).filter((d) => d.visible !== false).map((d) => d.style),
    ...STYLES
  ])].filter(Boolean);
  const nus = attendus.filter((x) => !INSTRUMENTS[x]);
  if (nus.length) {
    console.error('  REGISTRE SANS ILLUSTRATION — il sortirait avec le disque de repli :');
    nus.forEach((x) => console.error('         ' + x));
    ok = false;
  }

  /* Et ses deux mots. Un registre qui en manque sort avec une carte
     amputée d'une ligne, et le lot perd son alignement. */
  const { MOTS } = require('../build/instruments.js');
  const muets = attendus.filter((x) => !MOTS[x]);
  if (muets.length) {
    console.error('  REGISTRE SANS SES DEUX MOTS — la carte sortirait amputée :');
    muets.forEach((x) => console.error('         ' + x));
    ok = false;
  }

  if (!jumeaux.length && !nus.length && !muets.length) {
    console.log(`  ok   ${Object.keys(INSTRUMENTS).length} illustrations, toutes distinctes, ` +
                `${attendus.length} registres servis, tous avec leurs deux mots`);
  }
}

/* Un registre du catalogue doit être proposé à la commande.
   Trois l'avaient cessé : soul jazz, musette et country americana
   avaient été ajoutés aux œuvres sans l'être à la liste des styles.
   Une famille pouvait donc entendre une musette sur le site sans
   pouvoir en commander une — et rien ne le signalait. */
{
  const { STYLES } = require('../build/data.js');
  const c = JSON.parse(fs.readFileSync('assets/data/content.json', 'utf8'));
  const duCatalogue = [...new Set((c.demos || [])
    .filter((d) => d.visible !== false).map((d) => d.style).filter(Boolean))];
  const html = fs.existsSync('demos.html') ? fs.readFileSync('demos.html', 'utf8') : '';
  /* Le nom est cherché tel que la page l'ÉCRIT, pas tel qu'il est
     stocké : « R&B » y devient « R&amp;B », et un contrôle naïf
     accusait la page d'un défaut qu'elle n'avait pas. */
  const ech = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const absents = duCatalogue.filter((st) => !html.includes('>' + ech(st) + '<'));
  if (absents.length) {
    console.error('  REGISTRE NON PROPOSÉ — au catalogue, absent de /demos :');
    absents.forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log(`  ok   ${duCatalogue.length} registres du catalogue, tous proposés ` +
                `(${STYLES.length} dans la liste de départ)`);
  }
}

/* LA MÉDIATHÈQUE DE CAMPAGNE DOIT TENIR SES PROMESSES.

   build/medias.js déclare chaque affiche et chaque vidéo avec son
   fichier, ses dimensions et son audience. Une déclaration qui ment
   est pire que pas de déclaration : la page afficherait un cadre vide,
   ou annoncerait « 941 × 1672 » sous une image qui n'en fait pas
   autant.

   On vérifie donc trois choses : que le fichier existe, que les
   dimensions annoncées sont celles du fichier, et qu'aucune pièce ne
   dépasse son budget de poids — une page de vente qui met huit
   secondes à charger ne vend rien. */
{
  const MED = require('../build/medias.js');
  const BUDGET = { affiche: 400 * 1024, video: 8 * 1024 * 1024 };

  /* Les dimensions d'un JPEG se lisent dans ses marqueurs SOF. */
  const tailleJpeg = (f) => {
    const b = fs.readFileSync(f);
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
    return [0, 0];
  };

  /* Les affiches reçues en WebP se mesurent autrement : après « RIFF »
     et « WEBP » vient un bloc qui porte la taille. VP8X la donne sur
     trois octets moins un, VP8 (avec perte) sur quatorze bits, VP8L
     (sans perte) sur un entier compacté. Sans cette lecture, une
     affiche WebP échappait au contrôle des dimensions — et c'est
     justement là qu'une déclaration fausse ne se voit pas. */
  const tailleWebp = (f) => {
    const b = fs.readFileSync(f);
    if (b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP') return [0, 0];
    const bloc = b.toString('latin1', 12, 16);
    if (bloc === 'VP8X') return [(b.readUIntLE(24, 3) & 0xFFFFFF) + 1, (b.readUIntLE(27, 3) & 0xFFFFFF) + 1];
    if (bloc === 'VP8 ') return [b.readUInt16LE(26) & 0x3FFF, b.readUInt16LE(28) & 0x3FFF];
    if (bloc === 'VP8L') {
      const n = b.readUInt32LE(21);
      return [(n & 0x3FFF) + 1, ((n >> 14) & 0x3FFF) + 1];
    }
    return [0, 0];
  };

  const mesurable = (f) => /\.(webp|jpe?g)$/i.test(f);
  const mesure = (f) => (/\.webp$/i.test(f) ? tailleWebp(f) : tailleJpeg(f));

  const fautes = [];
  for (const m of MED.MEDIAS) {
    const f = MED.DOSSIER + m.fichier;
    if (!fs.existsSync(f)) { fautes.push(`${m.fichier} : déclaré, absent du dépôt`); continue; }
    const poids = fs.statSync(f).size;
    if (poids > BUDGET[m.type]) {
      fautes.push(`${m.fichier} : ${Math.round(poids / 1024)} Ko, budget ${Math.round(BUDGET[m.type] / 1024)} Ko`);
    }
    if (m.affiche && !fs.existsSync(MED.DOSSIER + m.affiche)) {
      fautes.push(`${m.affiche} : image d'attente déclarée, absente`);
    }
    /* Un encodage « léger » qui pèse plus lourd que l'original ne
       sert à rien et coûte un fichier de plus : le dire. */
    if (m.leger) {
      const fl = MED.DOSSIER + m.leger;
      if (!fs.existsSync(fl)) fautes.push(`${m.leger} : version légère déclarée, absente`);
      else if (fs.statSync(fl).size >= poids) {
        fautes.push(`${m.leger} : ${Math.round(fs.statSync(fl).size / 1024)} Ko, ` +
                    `soit plus que l'original (${Math.round(poids / 1024)} Ko)`);
      }
    }
    /* Les dimensions se lisent dans le fichier image : pour la vidéo
       il faudrait décoder le conteneur, et l'affiche d'attente en
       porte déjà la preuve. */
    const image = m.type === 'video' ? (m.affiche || '') : m.fichier;
    if (image && mesurable(image)) {
      const [w, h] = mesure(MED.DOSSIER + image);
      if (w !== m.largeur || h !== m.hauteur) {
        fautes.push(`${image} : annoncé ${m.largeur} × ${m.hauteur}, mesuré ${w} × ${h}`);
      }
    } else if (image) {
      fautes.push(`${image} : format d'image non mesurable par le contrôle`);
    }
  }

  if (fautes.length) {
    console.error('  MÉDIATHÈQUE — déclaration fausse :');
    fautes.forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    const total = MED.MEDIAS.reduce((s, m) => s + fs.statSync(MED.DOSSIER + m.fichier).size, 0);
    console.log(`  ok   ${MED.MEDIAS.length} pièces de campagne, dimensions exactes, ` +
                `${Math.round(total / 1024)} Ko au total ` +
                `(${MED.ATTENDUS.length} annoncées, pas encore reçues)`);
  }
}

/* AUCUN TEXTE SOUS 12,5 PIXELS.

   Les familles qui lisent ce site ont souvent soixante-dix ou
   quatre-vingts ans. La feuille de style comptait 190 déclarations
   de taille sous 13 px, jusqu'à 7,2 px — des libellés en capitales
   espacées, illisibles pour qui n'a plus toute sa vue. Ils ont été
   relevés au-dessus d'un plancher de 0,78 rem, soit 12,5 px.

   Ce contrôle empêche le retour en arrière. Il accepte les deux
   écritures — « 0.5rem » et « .5rem » —, faute de quoi la moitié des
   déclarations lui échapperait : c'est exactement ce qui est arrivé
   au premier passage, et quatre familles de libellés étaient restées
   à 7 px sans que rien ne le signale. */
{
  const PLANCHER = 0.78;
  /* TOUTES les feuilles, pas seulement style.css.
     Ce contrôle ne lisait que la feuille publique. Pendant ce temps
     dashboard.css comptait 81 déclarations sous le plancher, jusqu'à
     7 px, et mobile.css six autres — dans les consoles, c'est-à-dire
     dans l'outil que l'équipe regarde huit heures par jour. Le garde-fou
     existait, il gardait la mauvaise porte. */
  const FEUILLES = fs.readdirSync('assets/css')
    .filter((f) => f.endsWith('.css'))
    .map((f) => 'assets/css/' + f);
  const trop = [];
  for (const feuille of FEUILLES) {
    const css = fs.readFileSync(feuille, 'utf8');
    const re = /font-size:\s*(0?\.\d+)rem/g;
    let m;
    while ((m = re.exec(css))) {
      const v = parseFloat('0' + m[1].replace(/^0/, ''));
      if (v < PLANCHER - 0.001) {
        const ligne = css.slice(0, m.index).split('\n').length;
        trop.push(`${feuille}:${ligne} : ${m[0]} (${(v * 16).toFixed(1)} px)`);
      }
    }
  }
  if (trop.length) {
    console.error(`  TEXTE SOUS ${(PLANCHER * 16).toFixed(1)} PX — illisible pour une personne âgée :`);
    trop.slice(0, 8).forEach((x) => console.error('         ' + x));
    if (trop.length > 8) console.error(`         … et ${trop.length - 8} autres`);
    ok = false;
  } else {
    console.log(`  ok   aucune taille sous ${(PLANCHER * 16).toFixed(1)} px, sur ${FEUILLES.length} feuilles`);
  }
}

/* AUCUNE PAGE NE DOIT SERVIR LE MOT « undefined ».

   Trouvé en production : le JSON-LD des treize pages de requête
   partait sans « headline », et le bloc de partage recevait
   « undefined » comme titre. La cause : le gabarit lisait un champ
   que pas une seule page ne renseignait. Rien ne le signalait —
   un champ absent disparaît à la sérialisation, et une chaîne
   « undefined » s'affiche sans faire d'erreur.

   Ce contrôle attrape toute la classe de bogues d'un coup, sur les
   quarante-six pages et pas seulement sur les treize. Les blocs de
   script sont retirés avant la recherche : « typeof x === 'undefined' »
   y est parfaitement légitime. */
{
  /* Toutes les pages du répertoire, et pas seulement la liste écrite
     à la main en tête de ce fichier : elle n'en contient que vingt,
     et les treize nouvelles n'y étaient pas. */
  const toutes = new Set(files.filter((f) => f.endsWith('.html')));
  for (const f of fs.readdirSync('.')) if (/\.html$/.test(f)) toutes.add(f);
  const suspectes = [];
  for (const f of toutes) {
    if (!fs.existsSync(f)) continue;
    const sansScripts = fs.readFileSync(f, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ');
    if (/\bundefined\b/.test(sansScripts) || /\bNaN\b/.test(sansScripts)) {
      const ou = (sansScripts.match(/.{0,40}\b(?:undefined|NaN)\b.{0,30}/) || [''])[0];
      suspectes.push(`${f} : …${ou.replace(/\s+/g, ' ').trim()}…`);
    }
  }
  if (suspectes.length) {
    console.error('  VALEUR MANQUANTE SERVIE À L’ÉCRAN :');
    suspectes.forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log(`  ok   aucune valeur « undefined » ni « NaN » servie (${toutes.size} pages)`);
  }
}

/* Et pour les pages de requête, le champ précis qui manquait : Google
   exige « headline » sur un Article, et son absence ne se voit pas. */
{
  const modules = ['../build/p-chansons.js', '../build/p-fabrication.js',
                   '../build/p-ceremonie.js', '../build/p-memoire.js'];
  const nus = [].concat(...modules.map((m) => require(m)))
    .filter((p) => {
      const art = (p.jsonld || []).find((x) => x['@type'] === 'Article');
      return !art || !art.headline || !String(art.headline).trim();
    })
    .map((p) => p.file);
  if (nus.length) {
    console.error('  ARTICLE JSON-LD SANS « headline » :');
    nus.forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log('  ok   toutes les pages de requête ont leur « headline »');
  }
}

/* LES TREIZE PAGES DE REQUÊTE NE DOIVENT PAS SE RESSEMBLER.

   Elles visent des formulations voisines — « chanson hommage défunt »,
   « chanson personnalisée défunt », « créer une chanson pour un
   défunt ». Google appelle « doorway pages » une grappe de pages
   quasi identiques qui ne diffèrent que par le mot-clé, et les
   déclasse en bloc. Le risque n'est pas théorique : il suffit qu'un
   jour on reprenne un paragraphe d'une page pour l'autre.

   On mesure donc la ressemblance réelle, en séquences de six mots
   consécutifs (deux textes différents n'en partagent presque aucune),
   sur la partie propre à chaque page — le corps et les questions,
   sans le bloc de proposition ni les pieds communs.

   Au moment où ce contrôle a été écrit, la paire la plus proche était
   à 1 %. Le seuil est fixé à 12 % : très au-dessus de ce qui existe,
   très en dessous de ce que produirait un gabarit rempli. */
{
  const modules = ['../build/p-chansons.js', '../build/p-fabrication.js',
                   '../build/p-ceremonie.js', '../build/p-memoire.js'];
  const requetes = [].concat(...modules.map((m) => require(m)));
  const SEUIL = 0.12;

  const mots = (p) => p.body.split('guide-fin')[0]
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ')
    .toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüç' -]/g, ' ')
    .split(/\s+/).filter(Boolean);
  const seqs = (w) => {
    const s = new Set();
    for (let i = 0; i + 6 <= w.length; i++) s.add(w.slice(i, i + 6).join(' '));
    return s;
  };

  const vus = requetes.map((p) => ({ f: p.file, s: seqs(mots(p)), n: mots(p).length }));
  const trop = [];
  let pire = 0;
  for (let i = 0; i < vus.length; i++) {
    for (let j = i + 1; j < vus.length; j++) {
      let inter = 0;
      for (const x of vus[i].s) if (vus[j].s.has(x)) inter++;
      const jac = inter / (vus[i].s.size + vus[j].s.size - inter);
      if (jac > pire) pire = jac;
      if (jac > SEUIL) trop.push(`${vus[i].f} et ${vus[j].f} : ${(jac * 100).toFixed(0)} %`);
    }
  }

  /* Une page trop courte ne se classe pas, quelle que soit sa
     singularité. Cinq cents mots est le plancher que la maison
     s'impose pour une page d'acquisition. */
  const courtes = vus.filter((x) => x.n < 500);

  if (trop.length) {
    console.error('  PAGES DE REQUÊTE TROP RESSEMBLANTES :');
    trop.forEach((x) => console.error('         ' + x));
    ok = false;
  }
  if (courtes.length) {
    console.error('  PAGE DE REQUÊTE TROP COURTE (moins de 500 mots) :');
    courtes.forEach((x) => console.error(`         ${x.f} : ${x.n} mots`));
    ok = false;
  }
  if (!trop.length && !courtes.length) {
    console.log(`  ok   ${vus.length} pages de requête, ressemblance maximale ` +
                `${(pire * 100).toFixed(1)} % (seuil ${SEUIL * 100} %), ` +
                `${Math.min(...vus.map((x) => x.n))} mots au minimum`);
  }
}

/* Aucune page ne doit partir avec un lien mort vers une page du site. */
const pages = files.filter(f => f.endsWith('.html'));
/* Toutes les pages du dépôt, pas seulement celles de la liste : les
   dix-huit pages d'écoute sont générées et ne sont pas énumérées. */
for (const f of fs.readdirSync('.')) if (/^ecouter-.+\.html$/.test(f)) pages.push(f);
const internes = new Set(pages);
for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  const liens = [...html.matchAll(/href="([^"#?:]+\.html)/g)].map(m => m[1]);
  for (const l of new Set(liens)) {
    if (!internes.has(l) && !fs.existsSync(l)) { console.error('  LIEN MORT', p, '->', l); ok = false; }
  }

  /* Les liens « /ecouter/<titre> » n'ont pas d'extension : le contrôle
     ci-dessus ne les voyait pas, et une adresse fautive serait partie
     sans bruit — c'est exactement ce qui est arrivé au premier
     renommage. La réécriture de vercel.json les sert depuis le fichier
     « ecouter-<titre>.html », qu'on vérifie donc ici. */
  const ecoutes = [...html.matchAll(/href="\/ecouter\/([a-z0-9-]+)"/g)].map(m => m[1]);
  for (const e of new Set(ecoutes)) {
    if (!fs.existsSync('ecouter-' + e + '.html')) {
      console.error(`  LIEN MORT ${p} -> /ecouter/${e} (ecouter-${e}.html est absent)`);
      ok = false;
    }
  }
}

/* Le manifeste ne doit pas référencer d'icône absente. */
try {
  const man = JSON.parse(fs.readFileSync('site.webmanifest', 'utf8'));
  for (const ic of man.icons || []) {
    /* Les icônes portent une empreinte (?v=…) depuis la construction */
    const f = ic.src.replace(/^\//, '').replace(/\?.*$/, '');
    if (!fs.existsSync(f)) { console.error('  ICÔNE MANQUANTE', ic.src); ok = false; }
  }
} catch (e) { console.error('  site.webmanifest illisible :', e.message); ok = false; }

/* ─── Le prix du service QR, à deux endroits ───
   « build/data.js » fabrique la case à cocher du tunnel de commande ;
   « assets/js/memorial.js » affiche le même tarif aux partenaires. Un
   prix changé d'un seul côté ferait payer 79 € à une famille pendant
   qu'une agence en facturerait 99 — et personne ne s'en apercevrait
   avant la première réclamation. On compare, et on refuse de passer. */
try {
  const donnees = fs.readFileSync('build/data.js', 'utf8');
  const module_ = fs.readFileSync('assets/js/memorial.js', 'utf8');
  const a = donnees.match(/id:\s*'plaque',\s*prix:\s*(\d+)/);
  const b = module_.match(/var PRIX_QR = (\d+)/);
  if (!a || !b) {
    console.error('  PRIX QR introuvable', a ? 'dans memorial.js' : 'dans data.js');
    ok = false;
  } else if (a[1] !== b[1]) {
    console.error('  ÉCART DE PRIX  service QR : ' + a[1] + ' € dans data.js, ' + b[1] + ' € dans memorial.js');
    ok = false;
  } else {
    console.log('  ok   service QR à ' + a[1] + ' €, identique des deux côtés');
  }
} catch (e) { console.error('  vérification du prix QR impossible :', e.message); ok = false; }

/* ─── L'icône que Google affiche à côté du site ───
   Google va chercher les <link rel="icon"> de la page et retient celle
   qui approche le plus 48 pixels. Deux pannes silencieuses guettent :
   un favicon.ico qui n'embarque pas de vignette 48 (Google rapetisse
   alors la 32 et les lettres bavent), et une taille annoncée dans
   « sizes » qui ne correspond pas au fichier — la déclaration ment,
   Google choisit une autre icône, et le logo affiché n'est pas celui
   qu'on croit. On lit donc les en-têtes des fichiers eux-mêmes. */
function taillesIco(f) {
  const b = fs.readFileSync(f);
  if (b.readUInt16LE(0) !== 0 || b.readUInt16LE(2) !== 1) return null;  /* pas un ICO */
  const n = b.readUInt16LE(4);
  const t = [];
  for (let i = 0; i < n; i++) {
    const o = 6 + i * 16;
    t.push([b[o] || 256, b[o + 1] || 256]);
  }
  return t;
}
function taillePng(f) {
  const b = fs.readFileSync(f);
  /* IHDR est toujours le premier bloc : 8 octets de signature, 8 d'en-tête
     de bloc, puis largeur et hauteur sur quatre octets chacune. */
  if (b.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

try {
  const ico = taillesIco('favicon.ico');
  if (!ico) { console.error('  favicon.ico n’est pas un fichier ICO valide'); ok = false; }
  else {
    for (const attendu of [16, 32, 48]) {
      if (!ico.some(([l, h]) => l === attendu && h === attendu)) {
        console.error('  FAVICON  aucune vignette ' + attendu + '×' + attendu +
          ' dans favicon.ico (présentes : ' + ico.map((t) => t.join('×')).join(', ') + ')');
        ok = false;
      }
    }
    if (ok) console.log('  ok   favicon.ico : ' + ico.map((t) => t.join('×')).join(', '));
  }

  /* Toutes les pages, et non la seule accueil : cinq pages sont écrites
     à la main, hors du gabarit, et c'est précisément là que la
     déclaration avait pris du retard — la console maître annonçait
     encore le logo JPG, illisible à seize pixels. */
  let pagesVues = 0;
  for (const page of fs.readdirSync('.').filter((f) => f.endsWith('.html'))) {
    const src = fs.readFileSync(page, 'utf8');
    const liens = [...src.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g)].map((m) => m[0]);
    if (!liens.length) { console.error('  aucune icône déclarée dans ' + page); ok = false; continue; }
    let quaranteHuit = ico && ico.some(([l, h]) => l === 48 && h === 48) &&
      liens.some((l) => /favicon\.ico/.test(l));
    for (const lien of liens) {
      const href = (lien.match(/href="([^"]+)"/) || [])[1];
      if (!href) continue;
      const f = href.replace(/^\//, '').replace(/\?.*$/, '');
      if (!fs.existsSync(f)) { console.error('  ICÔNE MANQUANTE  ' + href + ' (' + page + ')'); ok = false; continue; }
      const annonce = (lien.match(/sizes="([^"]+)"/) || [])[1];
      if (!/\.png$/.test(f)) continue;
      const reelle = taillePng(f);
      if (!reelle) { console.error('  ' + f + ' n’est pas un PNG lisible'); ok = false; continue; }
      if (reelle[0] === 48 && reelle[1] === 48) quaranteHuit = true;
      if (annonce && !annonce.split(/\s+/).includes(reelle.join('x'))) {
        console.error('  TAILLE ANNONCÉE FAUSSE  ' + f + ' fait ' + reelle.join('×') +
          ' mais se déclare « ' + annonce + ' » dans ' + page);
        ok = false;
      }
    }
    if (!quaranteHuit) {
      console.error('  FAVICON  ' + page + ' ne déclare aucune icône de 48×48 — ' +
        'c’est la taille que Google préfère, sans elle il prendra ce qu’il trouve');
      ok = false;
    }
    pagesVues++;
  }
  if (ok) console.log('  ok   ' + pagesVues + ' pages déclarent une icône de 48×48, tailles annoncées exactes');
} catch (e) { console.error('  vérification des icônes impossible :', e.message); ok = false; }

/* ─── La palette sombre servie sur fond ivoire ───
   Le site a deux palettes : --paper / --ash / --bone pour le texte sur
   noir, --ivory-ink / --ivory-soft pour le texte sur ivoire. Les blocs
   sont écrits sur fond noir, puis certains sont réemployés dans une
   « .section-light » — et la couleur, elle, ne suit pas. Mesuré sur la
   page professionnels : 1,02 de contraste pour les intitulés en gras,
   c'est-à-dire blanc sur blanc. L'or a le même défaut : --or vaut 2,03
   sur l'ivoire, et le point clair de --or-grad tombe à 1,53.

   On croise donc deux choses : les classes réellement employées dans une
   section claire d'une page servie, et les règles qui leur donnent une
   couleur de la palette sombre. Toute classe dans les deux listes doit
   avoir sa contrepartie « .section-light ». Le rapprochement est fait
   par nom de classe, pas par sélecteur exact : un « .section-light
   .valeur li » couvre aussi « .valeur b ». C'est volontaire — la
   vérification dit où regarder, elle ne remplace pas l'œil. */
try {
  /* Les teintes trop claires pour l'ivoire, mesurées sur #f4f1ea :
     --paper 1,02 · --silver 1,26 · --bone 1,69 · --or 2,03 ·
     --silver-dim 2,48 · --ash 3,13 · --or-patina 3,40. --dust, lui,
     donne 6,11 : il est assez sombre pour les deux fonds, il ne figure
     donc pas ici. */
  const SOMBRES = ['--paper', '--ash', '--bone', '--silver', '--silver-dim',
                   '--or', '--or-patina', '--or-bright', '--or-grad'];
  /* « var(--or) » ne doit pas se déclencher sur « var(--or-deep) » : on
     exige la parenthèse fermante ou une virgule juste après le nom. */
  const cite = (decl, jeton) =>
    new RegExp('var\\(\\s*' + jeton + '\\s*[,)]').test(decl);

  /* Les classes présentes dans une section claire d'une page servie. */
  const classesClaires = new Set();
  let sections = 0;
  for (const f of fs.readdirSync('.').filter((x) => x.endsWith('.html'))) {
    const src = fs.readFileSync(f, 'utf8');
    const ouvre = /<section[^>]*class="[^"]*\bsection-light\b[^"]*"[^>]*>/g;
    let m;
    while ((m = ouvre.exec(src))) {
      sections++;
      const balises = /<\/?section\b/g;
      balises.lastIndex = ouvre.lastIndex;
      let prof = 1, t, fin = src.length;
      while ((t = balises.exec(src))) {
        prof += t[0][1] === '/' ? -1 : 1;
        if (!prof) { fin = t.index; break; }
      }
      for (const c of src.slice(ouvre.lastIndex, fin).matchAll(/class="([^"]+)"/g)) {
        for (const x of c[1].trim().split(/\s+/)) classesClaires.add(x);
      }
    }
  }

  /* Les règles de la feuille, commentaires ôtés. */
  const feuille = fs.readFileSync('assets/css/style.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const regles = [...feuille.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({ sel: m[1].trim(), decl: m[2] }));

  /* Celles qui posent une couleur de texte sombre, ou le dégradé doré
     découpé dans le texte — dont la couleur affichée est le dégradé. */
  /* Une pastille noire posée dans une section claire garde légitimement
     sa couleur claire : c'est le cas de « .parcours-n », disque d'encre
     à chiffre doré. On ne signale donc pas une règle qui se donne
     elle-même un fond sombre opaque. */
  const FONDS_SOMBRES = ['--ink', '--ink-2', '--ink-3', '--surface', '--surface-2', '--surface-3'];
  const ilotSombre = (decl) =>
    /(^|;|\s)background(-color|-image)?\s*:/.test(decl) &&
    FONDS_SOMBRES.some((j) => cite(decl, j));

  /* La couleur d'un texte se lit dans « color », ou dans le dégradé
     quand celui-ci est découpé dedans. */
  const couleurLue = (decl) => {
    const c = (decl.match(/(?:^|;|\s)color\s*:([^;]*)/) || [, ''])[1];
    const g = /background-clip\s*:\s*text/.test(decl)
      ? (decl.match(/(?:^|;|\s)background(?:-image)?\s*:([^;]*)/) || [, ''])[1] : '';
    return c + ' ' + g;
  };

  /* Une règle « .section-light » qui reprend elle-même une teinte de la
     palette sombre : c'est l'antidote qui rend malade. On la signale
     tout de suite, sans passer par le rapprochement des classes. */
  let rechutes = 0;
  for (const r of regles) {
    if (!/\.section-light/.test(r.sel)) continue;
    if (ilotSombre(r.decl)) continue;
    const j = SOMBRES.find((x) => cite(couleurLue(r.decl), x));
    if (j) {
      console.error('  PALETTE SOMBRE SUR IVOIRE  « ' + r.sel.replace(/\s+/g, ' ') +
        ' » est une règle de section claire, et elle y pose « var(' + j + ') »');
      rechutes++; ok = false;
    }
  }

  const fautives = new Map();
  for (const r of regles) {
    if (/\.section-light/.test(r.sel)) continue;
    if (ilotSombre(r.decl)) continue;
    /* C'est la valeur de « color » qui compte, pas le fait que la règle
       cite une teinte claire quelque part : un bouton doré à texte noir
       écrit « background: var(--or-grad); color: #120e04 » et va très
       bien. Le dégradé ne compte que s'il est découpé dans le texte,
       auquel cas c'est lui qu'on lit. */
    const valeurCouleur = (r.decl.match(/(?:^|;|\s)color\s*:([^;]*)/) || [, ''])[1];
    const decoupe = /background-clip\s*:\s*text/.test(r.decl) &&
      (r.decl.match(/(?:^|;|\s)background(?:-image)?\s*:([^;]*)/) || [, ''])[1];
    const texteSombre = SOMBRES.some((j) => cite(valeurCouleur, j)) ||
      (decoupe && SOMBRES.some((j) => cite(decoupe, j)));
    if (!texteSombre) continue;
    for (const c of r.sel.matchAll(/\.([A-Za-z0-9_-]+)/g)) {
      if (classesClaires.has(c[1])) {
        if (!fautives.has(c[1])) fautives.set(c[1], []);
        fautives.get(c[1]).push(r.sel);
      }
    }
  }

  /* Une contrepartie claire pose bien une couleur, et pas seulement une
     bordure ou un fond. */
  const couvertes = new Set();
  for (const r of regles) {
    if (!/\.section-light/.test(r.sel)) continue;
    if (!/(^|;|\s)color\s*:/.test(r.decl) && !/background-clip\s*:\s*text/.test(r.decl)) continue;
    for (const c of r.sel.matchAll(/\.([A-Za-z0-9_-]+)/g)) couvertes.add(c[1]);
  }

  let nues = rechutes;
  for (const [c, sels] of fautives) {
    if (couvertes.has(c)) continue;
    console.error('  PALETTE SOMBRE SUR IVOIRE  « .' + c + '  » est servie dans une section claire ' +
      'mais n’a pas de règle « .section-light » qui lui rende une couleur lisible');
    console.error('        en cause : ' + [...new Set(sels)].join(' , '));
    nues++; ok = false;
  }
  if (!nues) {
    console.log('  ok   ' + sections + ' sections claires, ' + classesClaires.size +
      ' classes employées dedans, toutes avec leur couleur d’ivoire');
  }
} catch (e) { console.error('  vérification des palettes impossible :', e.message); ok = false; }

/* ─── Ce que Google a la place d'afficher ───
   Un titre au-delà d'une soixantaine de caractères est coupé dans les
   résultats, une description au-delà de cent soixante aussi. Quatorze
   titres dépassaient, dont un à quatre-vingt-onze : le mot-clé passait,
   mais la moitié de phrase qui donne envie de cliquer était tronquée.

   Le générateur ne remet plus le suffixe « | Melodia Funèbre » que s'il
   tient, le site déclarant déjà son nom dans ses données structurées.
   Ce contrôle-ci surveille le reste, et ne regarde que les pages
   indexées : une console en « noindex » n'a pas de résultat à soigner. */
{
  const TITRE_MAX = 62, DESC_MIN = 70, DESC_MAX = 160;
  const mauvais = [];
  let vues = 0;
  for (const f of fs.readdirSync('.').filter((x) => x.endsWith('.html'))) {
    const src = fs.readFileSync(f, 'utf8');
    if (/content="noindex/.test(src)) continue;
    vues++;
    const t = (src.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const d = (src.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    if (!t) mauvais.push(f + ' : sans titre');
    else if (t.length > TITRE_MAX) mauvais.push(f + ' : titre de ' + t.length + ' caractères');
    if (!d) mauvais.push(f + ' : sans description');
    else if (d.length > DESC_MAX || d.length < DESC_MIN) {
      mauvais.push(f + ' : description de ' + d.length + ' caractères');
    }
  }
  if (mauvais.length) {
    console.error('  TITRES ET DESCRIPTIONS — hors des limites d’affichage :');
    mauvais.forEach((x) => console.error('         ' + x));
    ok = false;
  } else {
    console.log('  ok   ' + vues + ' pages indexées, titres sous ' + TITRE_MAX +
      ' caractères et descriptions entre ' + DESC_MIN + ' et ' + DESC_MAX);
  }
}

/* ─── Une image servie bien plus grande qu'elle ne s'affiche ───
   Deux fois le même défaut, trouvé deux fois à la main : le médaillon
   du générique était un fichier de 880 px affiché à 164, servi en
   « fetchpriority=high » sur les soixante et une pages ; l'emblème de
   l'accueil, un fichier de 1024 px affiché à 370. Quatre-vingts kilos
   et quatre-vingt-dix-sept kilos, sur le chemin critique, pour des
   pixels que personne ne voit.

   Un attribut « width » est la promesse de la page : voilà la largeur
   à laquelle je compte afficher cette image. Un fichier qui dépasse
   nettement cette promesse est du poids payé pour rien. On tolère le
   double — un téléphone à deux pixels par point a besoin du double,
   et c'est la raison d'être de la marge. Au-delà, c'est un oubli.

   Le contrôle ne lit que les images qui déclarent leur largeur : sans
   déclaration, il n'y a pas de promesse à confronter.

   Et il ne compte que ce qui pèse. Un médaillon de 160 px affiché à
   30 est bien à cinq fois sa taille, mais le fichier fait quatre
   kilos : en fabriquer un de 90 px économiserait trois kilos et
   ajouterait un fichier de plus à tenir à jour. Le seuil de poids
   garde le contrôle pointé sur ce qu'il a été écrit pour trouver —
   les quatre-vingts et quatre-vingt-dix-sept kilos du chemin
   critique — au lieu d'imposer une variante par usage. */
{
  const MARGE = 2, POIDS = 20 * 1024;
  const lire = (f) => {
    const b = fs.readFileSync(f);
    if (/\.webp$/i.test(f)) {
      if (b.toString('latin1', 0, 4) !== 'RIFF') return 0;
      const bloc = b.toString('latin1', 12, 16);
      if (bloc === 'VP8X') return (b.readUIntLE(24, 3) & 0xFFFFFF) + 1;
      if (bloc === 'VP8 ') return b.readUInt16LE(26) & 0x3FFF;
      if (bloc === 'VP8L') return (b.readUInt32LE(21) & 0x3FFF) + 1;
      return 0;
    }
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return b.readUInt16BE(i + 7);
      i += 2 + b.readUInt16BE(i + 2);
    }
    return 0;
  };

  const trop = new Map();
  let regardees = 0;
  const pages = fs.readdirSync('.').filter((x) => x.endsWith('.html'));
  for (const f of pages) {
    const src = fs.readFileSync(f, 'utf8');
    for (const [, balise] of src.matchAll(/<img\s([^>]*)>/g)) {
      const src2 = (balise.match(/\bsrc="\/?([^"?]+)/) || [])[1];
      const w = +((balise.match(/\bwidth="(\d+)"/) || [])[1] || 0);
      if (!src2 || !w || !/\.(webp|jpe?g)$/i.test(src2)) continue;
      if (!fs.existsSync(src2)) continue;
      regardees++;
      const nat = lire(src2);
      const poids = fs.statSync(src2).size;
      if (nat > w * MARGE && poids > POIDS) trop.set(src2, { nat, w, poids, page: f });
    }
  }
  if (trop.size) {
    console.error('  IMAGES TROP GRANDES — plus de ' + MARGE + '× la largeur annoncée :');
    [...trop.entries()].forEach(([f, x]) => console.error('         ' + f + ' : ' +
      x.nat + ' px servis, ' + x.w + ' px annoncés (×' + (x.nat / x.w).toFixed(1) + '), ' +
      Math.round(x.poids / 1024) + ' Ko — ' + x.page));
    ok = false;
  } else {
    console.log('  ok   ' + regardees + ' images mesurées, aucune de plus de ' +
      Math.round(POIDS / 1024) + ' Ko servie à plus de ' + MARGE + '× sa largeur d’affichage');
  }
}

/* Le message de fin doit dire ce qui ne va pas. « Des fichiers
   manquent » sur un écart de tarif envoie chercher au mauvais
   endroit. */
console.log(ok ? '\nSite complet, liens internes valides.'
                : '\nLa vérification a échoué — voir les lignes ci-dessus.');
process.exit(ok ? 0 : 1);
