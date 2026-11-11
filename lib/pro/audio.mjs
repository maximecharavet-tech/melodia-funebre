// ═══════════════════════════════════════════════════════════════
// Métadonnées des fichiers audio — marque blanche.
//
// Un MP3 sorti d'un service de composition porte souvent son nom dans
// ses balises ID3 (logiciel, commentaire, artiste). On retire TOUTES les
// balises (ID3v2 en tête, ID3v1 et APE en queue), puis on écrit les
// nôtres : titre, « Melodia Funèbre », « composé par Melodia Funèbre ».
// Le prénom du défunt n'y figure pas : un fichier se transfère, se
// partage, s'indexe.
// ═══════════════════════════════════════════════════════════════

function tailleSynchsafe(b, i) {
  return ((b[i] & 0x7f) << 21) | ((b[i + 1] & 0x7f) << 14) | ((b[i + 2] & 0x7f) << 7) | (b[i + 3] & 0x7f);
}

/** Retire ID3v2 (éventuellement plusieurs), ID3v1 et APEv2. */
export function retirerBalises(octets) {
  let b = Buffer.from(octets);
  // ID3v2 en tête (parfois empilées)
  while (b.length > 10 && b.toString('latin1', 0, 3) === 'ID3') {
    const pied = (b[5] & 0x10) ? 10 : 0;
    const n = 10 + tailleSynchsafe(b, 6) + pied;
    if (n > b.length) break;
    b = b.subarray(n);
  }
  // ID3v1 en queue
  if (b.length > 128 && b.toString('latin1', b.length - 128, b.length - 125) === 'TAG') {
    b = b.subarray(0, b.length - 128);
  }
  // APEv2 en queue (pied de 32 octets « APETAGEX »)
  if (b.length > 32 && b.toString('latin1', b.length - 32, b.length - 24) === 'APETAGEX') {
    const taille = b.readUInt32LE(b.length - 20);
    const avecEntete = (b.readUInt32LE(b.length - 12) & 0x80000000) !== 0;
    const total = taille + (avecEntete ? 32 : 0);
    if (total <= b.length) b = b.subarray(0, b.length - total);
  }
  return Buffer.from(b);
}

function synchsafe(n) {
  return Buffer.from([(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f]);
}

function cadreTexte(id, texte) {
  // encodage 3 = UTF-8 (ID3v2.4)
  const contenu = Buffer.concat([Buffer.from([3]), Buffer.from(String(texte), 'utf8')]);
  return Buffer.concat([Buffer.from(id, 'latin1'), synchsafe(contenu.length), Buffer.from([0, 0]), contenu]);
}

function cadreCommentaire(texte) {
  const contenu = Buffer.concat([Buffer.from([3]), Buffer.from('fra', 'latin1'), Buffer.from([0]), Buffer.from(String(texte), 'utf8')]);
  return Buffer.concat([Buffer.from('COMM', 'latin1'), synchsafe(contenu.length), Buffer.from([0, 0]), contenu]);
}

/** Écrit un ID3v2.4 minimal, sans aucune trace de fournisseur. */
export function poserBalises(octets, { titre, annee }) {
  const cadres = [
    cadreTexte('TIT2', titre || 'Hommage'),
    cadreTexte('TPE1', 'Melodia Funèbre'),
    cadreTexte('TALB', 'Melodia Funèbre'),
    cadreTexte('TCOP', (annee || new Date().getFullYear()) + ' Melodia Funèbre'),
    cadreTexte('TENC', 'Melodia Funèbre'),
    cadreCommentaire('Composé par Melodia Funèbre — melodia-funebre.fr')
  ];
  const corps = Buffer.concat(cadres);
  const entete = Buffer.concat([Buffer.from('ID3', 'latin1'), Buffer.from([4, 0, 0]), synchsafe(corps.length)]);
  return Buffer.concat([entete, corps, retirerBalises(octets)]);
}

/** Vrai si les octets contiennent un nom de fournisseur (contrôle de sortie). */
export function traceFournisseur(octets) {
  const t = Buffer.from(octets).toString('latin1').toLowerCase();
  return /mureka|suno|udio|skywork|mistral|openai/.test(t);
}
