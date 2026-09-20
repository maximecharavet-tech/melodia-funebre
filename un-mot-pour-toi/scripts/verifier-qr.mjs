/* ═══════════════════════════════════════════════════════════════
   LA PREUVE QUE LE QR EST JUSTE

   Comparer notre matrice à celle d'un autre encodeur ne prouve rien :
   deux encodeurs peuvent choisir des masques différents et produire
   deux QR également valides. Le seul critère qui compte est celui
   du lecteur : on dessine le code, on le RELIT avec un décodeur
   indépendant (OpenCV), et on vérifie qu'il rend le texte de départ.

   C'est aussi la seule vérification qui reproduise ce qui se passera
   vraiment : quelqu'un, un téléphone, une carte imprimée.
   ═══════════════════════════════════════════════════════════════ */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../assets/qr.js', import.meta.url), 'utf8');
const racine = {};
new Function('globalThis', src).call(racine, racine);
const { matrice } = racine.MotQR;

/* Un balayage de toutes les versions : chaque ligne des tables de la
   norme doit être exercée au moins une fois. Une seule valeur fausse
   — la version 9 en portait une — donne un code qui ne se lit pas,
   et rien d'autre ne le signale. Les longueurs visées tombent juste
   sous la capacité de chaque version en correction M. */
const CAPACITES = [16, 28, 44, 64, 86, 108, 124, 154, 182, 216];
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789-_./:';
let graine = 20260920;
function tirage(n) {
  let out = '';
  for (let i = 0; i < n; i++) {
    graine = (graine * 1103515245 + 12345) & 0x7fffffff;
    out += ALPHABET[graine % ALPHABET.length];
  }
  return out;
}
const BALAYAGE = CAPACITES.map((cap, i) => tirage(cap - (i < 9 ? 3 : 4)));

const CAS = [
  'A',
  'https://un-mot-pour-toi.vercel.app/a/Ab3xK9mQ2pRt7vLnCdEfGh',
  'https://melodia-funebre.fr/a/2222222222222222222222',
  'Bon vent, Camille — on se revoit.',
  'https://exemple.test/a/' + 'x'.repeat(40),
  'éàçùî'.repeat(6),
  'https://un-mot-pour-toi.vercel.app/a/' + 'W'.repeat(60),
  ...BALAYAGE
];

const LECTEUR = `
import sys, json, numpy as np, cv2
donnees = json.load(sys.stdin)
sorties = []
for cas in donnees:
    m = np.array(cas["m"], dtype=np.uint8)
    n = m.shape[0]
    marge, ech = 4, 10
    # 1 = module noir -> 0 en niveaux de gris ; le fond et la marge en blanc
    img = np.ones((n + 2 * marge, n + 2 * marge), dtype=np.uint8) * 255
    img[marge:marge + n, marge:marge + n] = np.where(m == 1, 0, 255)
    grand = np.kron(img, np.ones((ech, ech), dtype=np.uint8))
    lu, _, _ = cv2.QRCodeDetector().detectAndDecode(grand)
    sorties.append(lu)
print(json.dumps(sorties))
`;

const lots = CAS.map((texte) => ({ texte, m: matrice(texte) }));
const lus = JSON.parse(
  execFileSync('python3', ['-c', LECTEUR], {
    input: JSON.stringify(lots),
    encoding: 'utf8',
    maxBuffer: 1 << 26
  })
);

let ok = 0, faux = 0;
lots.forEach((lot, i) => {
  const attendu = lot.texte;
  const lu = lus[i];
  const etiquette = JSON.stringify(attendu.length > 40 ? attendu.slice(0, 37) + '…' : attendu);
  if (lu === attendu) {
    console.log(`  ✓ ${lot.m.length}×${lot.m.length}  relu à l'identique  ${etiquette}`);
    ok++;
  } else {
    console.log(`  ✗ ${lot.m.length}×${lot.m.length}  ${etiquette}`);
    console.log(`      lu : ${JSON.stringify(lu)}`);
    faux++;
  }
});
console.log(`\n${ok} sur ${ok + faux} relus correctement par OpenCV`);
process.exit(faux ? 1 : 0);
