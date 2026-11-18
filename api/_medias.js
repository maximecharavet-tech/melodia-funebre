// ═══════════════════════════════════════════════════════════════
// _medias.js — règles pures du module « Générer un visuel Melodia »
//
// Le navigateur n'envoie que des choix (style, couleur, format, une
// précision courte) ; le texte de la demande est composé ICI, avec les
// règles de la maison : pas de texte, pas de logo, pas de visage net,
// pas de cercueil, l'or en lumière seulement. Le logo officiel est posé
// ensuite, tel quel, par la console : il n'est jamais généré.
//
// Interrupteur : MEDIAS_GENERATION === 'true' ET HYPER_ENGINE_IMAGE_TOKEN
// présent. Sans les deux, la route répond 503 GENERATION_INACTIVE.
// ═══════════════════════════════════════════════════════════════

export const STYLES = {
  lys: { label: 'Lys blancs', texte: 'white lilies resting on dark stone, soft raking light, quiet stillness' },
  bougies: { label: 'Bougies', texte: 'a few lit candles of different heights in a dim calm room, warm glow, gentle depth of field' },
  lumiere: { label: 'Lumière douce', texte: 'soft late-afternoon light through a tall window onto an empty wooden bench, dust-free, serene' },
  partition: { label: 'Mains sur partition', texte: 'close-up of two elderly hands resting gently on an open handwritten music score on a wooden desk, natural anatomy, five fingers on each hand, face out of frame' },
  nature: { label: 'Nature', texte: 'a quiet tree-lined path at dusk, cypress and poplar trees, soft mist, peaceful landscape' },
  colombes: { label: 'Colombes', texte: 'two white doves in calm flight against a dark warm evening sky, graceful, unhurried' }
};

export const COULEURS = {
  or: { label: 'Or', texte: 'deep near-black background, warm gold only as light, reflections and thin highlights, never a flat gold fill' },
  ivoire: { label: 'Ivoire', texte: 'ivory and warm off-white tones, cream paper, soft gold reflections, dark vignette' },
  gris: { label: 'Gris', texte: 'muted silver-grey palette, overcast natural light, discreet warm accent' }
};

export const FORMATS = {
  post: { label: 'Publication (1:1)', ratio: '1:1', l: 1080, h: 1080 },
  story: { label: 'Story (9:16)', ratio: '9:16', l: 1080, h: 1920 },
  banniere: { label: 'Bannière (16:9)', ratio: '16:9', l: 1920, h: 1080 }
};

const SOCLE = 'Photographic, dignified and restrained image for a funeral music tribute service. Calm, contemplative, warm dusk light, noble materials (stone, dark wood, laid paper, patinated brass).';
const INTERDITS = 'Strictly no text, no letters, no watermark, no logo, no monogram, no signature, no faces in focus, no coffin, no tears, no religious symbol, no neon, no particles, no sparkles, no lens flare, no futuristic look, no cartoon, not oversaturated.';
const MOTS_REFUSES = /\b(logo|monogram|watermark|texte|text|visage|face|portrait|cercueil|coffin|nu|nude|sang|blood|brand)\b/i;

export function lireChoix(corps) {
  const d = corps && typeof corps === 'object' ? corps : {};
  const style = STYLES[d.style] ? d.style : '';
  const couleur = COULEURS[d.couleur] ? d.couleur : '';
  const format = FORMATS[d.format] ? d.format : '';
  if (!style) return { ok: false, error: 'Choisissez un style.' };
  if (!couleur) return { ok: false, error: 'Choisissez une couleur.' };
  if (!format) return { ok: false, error: 'Choisissez un format.' };
  const precision = String(d.precision || '').replace(/[\u0000-\u001f<>{}]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (precision && MOTS_REFUSES.test(precision)) {
    return { ok: false, error: 'Précision refusée : pas de texte, de logo ni de visage dans l’image (le logo officiel est posé ensuite).' };
  }
  return { ok: true, style, couleur, format, precision };
}

export function composerDemande(c) {
  const morceaux = [SOCLE, STYLES[c.style].texte + '.', COULEURS[c.couleur].texte + '.'];
  if (c.precision) morceaux.push('Detail: ' + c.precision + '.');
  if (c.format === 'banniere') morceaux.push('Leave the left third dark and empty for a title.');
  if (c.format === 'story') morceaux.push('Leave the top and bottom fifths calm and dark for overlays.');
  morceaux.push(INTERDITS);
  return morceaux.join(' ');
}

export function generationActive(env) {
  const e = env || {};
  return String(e.MEDIAS_GENERATION || '').trim() === 'true' && Boolean(String(e.HYPER_ENGINE_IMAGE_TOKEN || '').trim());
}

export function plafondJour(env) {
  const n = Math.floor(Number((env || {}).MEDIAS_GENERATION_JOUR));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 10;
}

export const TACHE = /^imt_[0-9a-f-]{8,24}$/;
export const BUCKET = 'medias-commerciaux';
