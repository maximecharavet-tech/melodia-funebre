// ═══════════════════════════════════════════════════════════════
// _medias.js — règles pures du module « Générer un visuel Melodia »
//
// Julie décrit librement son image. Le serveur l'enveloppe dans le style
// Melodia (or et ivoire, pénombre chaude, lumière douce, sobre) et ajoute
// des interdits de sécurité (pas de texte, pas de logo généré, pas de
// cercueil, pas d'effet gadget, pas de visage réaliste d'enfant). Une carte
// d'idée (api/_medias-idees.json) ajoute son pré-prompt détaillé quand son
// idée est gardée telle quelle. Le logo officiel est posé ENSUITE, par la
// console, à l'identique : il n'est jamais demandé au moteur.
//
// Interrupteur : MEDIAS_GENERATION === 'true' ET HYPER_ENGINE_IMAGE_TOKEN
// présent. Sans les deux, la route répond 503 GENERATION_INACTIVE.
// ═══════════════════════════════════════════════════════════════
import { readFileSync } from 'fs';

// lu depuis la racine du projet, comme assets/data/modeles-julie.json (fourni par includeFiles dans vercel.json)
export const IDEES = JSON.parse(readFileSync('api/_medias-idees.json', 'utf8')).idees;
const PAR_ID = Object.fromEntries(IDEES.map((i) => [i.id, i]));

// Styles artistiques (aquarelle, cubisme doux, vitrail…) : le pré-prompt de chaque style reste ici, côté serveur.
export const STYLES = JSON.parse(readFileSync('api/_medias-styles.json', 'utf8')).styles;
const STYLE_ID = Object.fromEntries(STYLES.map((s) => [s.id, s]));

/* Intensité du style : 1 léger, 2 marqué (par défaut), 3 affirmé. */
export const INTENSITES = { 1: 'léger', 2: 'marqué', 3: 'affirmé' };
export const VARIANTES = [1, 2, 4];

export const FORMATS = {
  post: { label: 'Post (1:1)', ratio: '1:1', l: 1080, h: 1080 },
  story: { label: 'Story (9:16)', ratio: '9:16', l: 1080, h: 1920 },
  banniere: { label: 'Bannière (16:9)', ratio: '16:9', l: 1920, h: 1080 }
};

/* L'enveloppe de style : ce qui fait « Melodia » sur les affiches approuvées. */
/* Version courte de l'enveloppe quand un style artistique est choisi : on garde la palette et le ton, on laisse la technique au style. */
export const STYLE_PALETTE = 'Mood: refined, dignified and calm image for a funeral music tribute brand. Palette leaning on deep warm blacks, ivory and soft gold, gold only as light and thin highlights. Quiet, contemplative, timeless.';

export const STYLE = 'Style: refined, dignified and calm image for a funeral music tribute brand. Palette of deep warm blacks, ivory and soft gold; gold appears only as light, reflections and thin highlights, never as a flat fill. Soft directional light (candlelight, late-afternoon sun, dusk), gentle contrast, subtle film grain, painterly photographic finish. Noble textures: pale stone, dark wood, laid paper, linen, patinated brass, white flowers (lilies, roses). Quiet, contemplative, timeless.';

/* Les interdits de sécurité, toujours ajoutés. */
export const INTERDITS = 'Avoid: any text, letters, numbers, captions, watermark, signature, logo, monogram, emblem or brand mark (the official logo is added afterwards); realistic faces of children; recognisable real or famous people; coffin, corpse, grave digging, blood, tears in close-up; religious symbols unless explicitly described; neon, glitter, sparkles, particles, lens flare, magic or sci-fi effects, futuristic interface, cartoon, 3D render look, oversaturated colours, kitsch.';

const MOTS_REFUSES = /\b(nue?s?|nude|naked|sexe?|sexy|porn\w*|gore|sang|blood|arme|weapon|cadavre|corpse)\b/i;

function propre(t, max) {
  return String(t || '').replace(/[\u0000-\u001f<>{}\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function lireChoix(corps) {
  const d = corps && typeof corps === 'object' ? corps : {};
  const format = FORMATS[d.format] ? d.format : '';
  if (!format) return { ok: false, error: 'Choisissez un format.' };
  const texte = propre(d.texte, 400);
  if (texte.length < 3) return { ok: false, error: 'Décrivez votre image en quelques mots.' };
  if (MOTS_REFUSES.test(texte)) return { ok: false, error: 'Cette description ne convient pas à Melodia.' };
  const carte = PAR_ID[d.carte] ? d.carte : '';
  const style = STYLE_ID[d.style] ? d.style : '';
  const i = Math.round(Number(d.intensite));
  const intensite = INTENSITES[i] ? i : 2;
  const v = Math.round(Number(d.variantes));
  const variantes = VARIANTES.indexOf(v) !== -1 ? v : 1;
  return { ok: true, format, texte, carte, style, intensite, variantes };
}

export function composerDemande(c) {
  const morceaux = ['Image to create: ' + c.texte + '.'];
  if (c.carte && PAR_ID[c.carte]) morceaux.push('Visual direction: ' + PAR_ID[c.carte].prompt);
  const st = c.style && STYLE_ID[c.style];
  if (st) {
    const n = INTENSITES[c.intensite] ? c.intensite : 2;
    if (n === 1) morceaux.push('Artistic style, applied lightly (a gentle touch of this medium over a calm, natural rendering): ' + st.prompt + '.', STYLE);
    else if (n === 3) morceaux.push('Artistic style, fully affirmed (the whole image is clearly rendered in this medium and technique): ' + st.prompt + '.', STYLE_PALETTE);
    else morceaux.push('Artistic style: ' + st.prompt + '.', STYLE_PALETTE);
  } else {
    morceaux.push(STYLE);
  }
  if (c.format === 'banniere') morceaux.push('Composition: wide 16:9 frame, keep the upper-left area calm and uncluttered for a logo.');
  else if (c.format === 'story') morceaux.push('Composition: vertical 9:16 frame, keep the top fifth and bottom fifth calm and uncluttered for a logo and a caption.');
  else morceaux.push('Composition: square frame, keep the top centre calm and uncluttered for a logo.');
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

/* « Garder dans Mes créations » : une image déjà composée (logo posé) envoyée en data URL. */
export function lireGarde(data) {
  const m = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(String(data || ''));
  if (!m) return null;
  const octets = Buffer.from(m[2], 'base64');
  if (octets.length < 1000 || octets.length > 3 * 1024 * 1024) return null;
  return { type: m[1], ext: m[1] === 'image/png' ? 'png' : 'jpg', octets };
}

export const TACHE = /^imt_[0-9a-f-]{8,24}$/;
export const BUCKET = 'medias-commerciaux';
