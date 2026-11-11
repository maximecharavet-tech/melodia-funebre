// ═══════════════════════════════════════════════════════════════
// Gabarits d'impression : cartes, faire-part, livret, marque-page,
// plaques, sticker d'urne, chevalet, planche d'étiquettes.
//
// Chaque gabarit décrit sa mise en page en millimètres (une liste de
// primitives). La même liste sert à l'aperçu SVG, à l'export SVG (graveur),
// au PNG 300/600 dpi et au PDF vectoriel avec fond perdu et traits de coupe.
// Le QR est toujours posé sur une plaque claire : un QR clair sur fond noir
// n'est pas lu par tous les téléphones (le noyau refuse ces combinaisons).
// ═══════════════════════════════════════════════════════════════

export const ENCRE = '#040407';
export const IVOIRE = '#f4f1ea';
export const OR = '#c9a84c';
export const OR_IVOIRE = '#806a30';

export const GABARITS = [
  { id: 'carte-a6-noire', nom: 'Carte A6 noire', l: 105, h: 148, theme: 'noir' },
  { id: 'carte-a6-ivoire', nom: 'Carte A6 ivoire', l: 105, h: 148, theme: 'ivoire' },
  { id: 'carte-a5-noire', nom: 'Carte A5 noire', l: 148, h: 210, theme: 'noir' },
  { id: 'faire-part', nom: 'Faire-part', l: 148, h: 105, theme: 'ivoire', paysage: true },
  { id: 'livret', nom: 'Dos de livret', l: 148, h: 210, theme: 'ivoire' },
  { id: 'marque-page', nom: 'Marque-page', l: 50, h: 180, theme: 'noir', etroit: true },
  { id: 'plaque-6', nom: 'Plaque 6 cm', l: 60, h: 60, theme: 'ivoire', plaque: true },
  { id: 'plaque-8', nom: 'Plaque 8 cm', l: 80, h: 80, theme: 'ivoire', plaque: true },
  { id: 'plaque-10', nom: 'Plaque 10 cm', l: 100, h: 100, theme: 'noir', plaque: true },
  { id: 'sticker-urne', nom: 'Sticker d’urne', l: 50, h: 50, theme: 'ivoire', plaque: true, rond: true },
  { id: 'chevalet', nom: 'Chevalet', l: 100, h: 150, theme: 'noir' },
  { id: 'planche-a4', nom: 'Planche A4 (12)', l: 210, h: 297, theme: 'ivoire', planche: true }
];

/**
 * Mise en page. t = { prenom, dates, phrase, agence } (tous facultatifs),
 * o = { textes: bool, logoAgence: dataURL|null }.
 * Rend une liste de primitives et la taille du QR.
 */
export function mettreEnPage(g, t, o = {}) {
  const noir = g.theme === 'noir';
  const fond = noir ? ENCRE : IVOIRE;
  const texte = noir ? '#f2efe8' : '#17150f';
  const or = noir ? OR : OR_IVOIRE;
  const p = [{ type: 'fond', couleur: fond }];
  const textes = o.textes !== false;

  if (g.planche) {
    const cols = 3, lignes = 4, cl = 60, ch = 60, mx = (210 - cols * cl) / 2, my = (297 - lignes * ch) / 2;
    for (let i = 0; i < cols; i++) for (let j = 0; j < lignes; j++) {
      const x = mx + i * cl, y = my + j * ch;
      p.push({ type: 'cadre', x: x + 2, y: y + 2, l: cl - 4, h: ch - 4, couleur: '#d9d2c2', r: 3 });
      p.push({ type: 'qr', x: x + 12, y: y + 6, taille: 36 });
      if (textes) p.push({ type: 'texte', x: x + cl / 2, y: y + ch - 9, taille: 7, police: 'italique', couleur: texte, align: 'centre', texte: t.phrase || 'Écoutez sa chanson' });
    }
    return { primitives: p, qr: 36 };
  }

  if (g.plaque) {
    const marge = g.l * 0.1;
    const plaque = g.l - 2 * marge;
    const qr = textes ? plaque * 0.78 : plaque * 0.9;
    if (noir) p.push({ type: 'plaque', x: marge, y: marge, l: plaque, h: plaque, couleur: IVOIRE, r: 2 });
    const x = (g.l - qr) / 2;
    const y = textes ? marge + plaque * 0.05 : (g.h - qr) / 2;
    p.push({ type: 'qr', x, y, taille: qr });
    if (textes) p.push({ type: 'texte', x: g.l / 2, y: marge + plaque * 0.95, taille: Math.max(6, g.l / 9), police: 'italique', couleur: '#17150f', align: 'centre', texte: t.phrase || 'Écoutez sa chanson' });
    if (g.rond) p.push({ type: 'rond', couleur: or });
    return { primitives: p, qr };
  }

  if (g.paysage) {
    p.push({ type: 'filet', marge: 5, couleur: or });
    const qr = 42;
    p.push({ type: 'plaque', x: g.l - qr - 16, y: (g.h - qr) / 2 - 4, l: qr + 8, h: qr + 8, couleur: '#ffffff', r: 2 });
    p.push({ type: 'qr', x: g.l - qr - 12, y: (g.h - qr) / 2, taille: qr });
    if (textes) {
      p.push({ type: 'texte', x: 16, y: 30, taille: 8, police: 'mono', couleur: or, texte: 'EN MÉMOIRE DE' });
      p.push({ type: 'texte', x: 16, y: 48, taille: 26, police: 'italique', couleur: texte, texte: t.prenom || '' });
      if (t.dates) p.push({ type: 'texte', x: 16, y: 58, taille: 9, police: 'mono', couleur: or, texte: t.dates });
      p.push({ type: 'texte', x: 16, y: 78, taille: 11, police: 'italique', couleur: texte, texte: t.phrase || 'Écoutez sa chanson' });
    }
    p.push({ type: 'signature', x: 16, y: g.h - 12, couleur: or, agence: o.cobranding ? t.agence : null });
    return { primitives: p, qr };
  }

  // Cartes, livret, marque-page, chevalet : composition verticale centrée.
  const etroit = !!g.etroit;
  p.push({ type: 'filet', marge: etroit ? 3.5 : 6, couleur: or });
  const qr = etroit ? 32 : Math.min(g.l * 0.42, 52);
  const cx = g.l / 2;
  let y = etroit ? 22 : g.h * 0.16;
  if (textes) {
    p.push({ type: 'texte', x: cx, y, taille: etroit ? 6.5 : 8, police: 'mono', couleur: or, align: 'centre', texte: 'EN MÉMOIRE DE' });
    y += etroit ? 12 : g.h * 0.09;
    p.push({ type: 'texte', x: cx, y, taille: etroit ? 18 : Math.min(30, g.l / 4), police: 'italique', couleur: texte, align: 'centre', texte: t.prenom || '' });
    y += etroit ? 8 : g.h * 0.06;
    if (t.dates) p.push({ type: 'texte', x: cx, y, taille: etroit ? 6.5 : 8.5, police: 'mono', couleur: or, align: 'centre', texte: t.dates });
    y += etroit ? 10 : g.h * 0.06;
  } else y = (g.h - qr) / 2 - 6;
  const plaqueM = 4;
  p.push({ type: 'plaque', x: cx - qr / 2 - plaqueM, y: y - plaqueM, l: qr + 2 * plaqueM, h: qr + 2 * plaqueM, couleur: noir ? IVOIRE : '#ffffff', r: 2 });
  p.push({ type: 'qr', x: cx - qr / 2, y, taille: qr });
  y += qr + plaqueM + (etroit ? 9 : g.h * 0.07);
  if (textes) p.push({ type: 'texte', x: cx, y, taille: etroit ? 8 : 12, police: 'italique', couleur: texte, align: 'centre', texte: t.phrase || 'Écoutez sa chanson' });
  p.push({ type: 'signature', x: cx, y: g.h - (etroit ? 9 : 12), couleur: or, centre: true, agence: o.cobranding ? t.agence : null, petit: etroit });
  return { primitives: p, qr };
}

// ─── SVG ────────────────────────────────────────────────────────────

const ESC = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FONTES = { italique: "font-family=\"'Cormorant Garamond',Georgia,serif\" font-style=\"italic\" font-weight=\"300\"", serif: "font-family=\"'Cormorant Garamond',Georgia,serif\"", mono: "font-family=\"'JetBrains Mono',monospace\" letter-spacing=\"0.15em\"", sans: "font-family=\"Jost,Arial,sans-serif\"" };

/** qrSvg : SVG rendu par le noyau ; on l'imbrique à la taille voulue. */
export function versSvg(g, mise, qrSvg) {
  const parts = [];
  for (const e of mise.primitives) {
    if (e.type === 'fond') parts.push(`<rect width="${g.l}" height="${g.h}" fill="${e.couleur}"/>`);
    else if (e.type === 'filet') parts.push(`<rect x="${e.marge}" y="${e.marge}" width="${g.l - 2 * e.marge}" height="${g.h - 2 * e.marge}" fill="none" stroke="${e.couleur}" stroke-width="0.35"/>`);
    else if (e.type === 'plaque') parts.push(`<rect x="${e.x}" y="${e.y}" width="${e.l}" height="${e.h}" rx="${e.r || 0}" fill="${e.couleur}"/>`);
    else if (e.type === 'cadre') parts.push(`<rect x="${e.x}" y="${e.y}" width="${e.l}" height="${e.h}" rx="${e.r || 0}" fill="none" stroke="${e.couleur}" stroke-width="0.25" stroke-dasharray="1.5 1.5"/>`);
    else if (e.type === 'rond') parts.push(`<circle cx="${g.l / 2}" cy="${g.h / 2}" r="${g.l / 2 - 0.6}" fill="none" stroke="${e.couleur}" stroke-width="0.4"/>`);
    else if (e.type === 'qr') {
      const interne = qrSvg.replace(/^<svg[^>]*viewBox="([^"]+)"[^>]*>/, (m, vb) => `<svg x="${e.x}" y="${e.y}" width="${e.taille}" height="${e.taille}" viewBox="${vb}">`);
      parts.push(interne);
    } else if (e.type === 'texte') {
      const ancre = e.align === 'centre' ? 'middle' : e.align === 'droite' ? 'end' : 'start';
      parts.push(`<text x="${e.x}" y="${e.y}" font-size="${(e.taille * 25.4 / 72).toFixed(2)}" fill="${e.couleur}" text-anchor="${ancre}" ${FONTES[e.police] || ''}>${ESC(e.texte)}</text>`);
    } else if (e.type === 'signature') {
      const ancre = e.centre ? 'middle' : 'start';
      const fs = (e.petit ? 5.5 : 6.5) * 25.4 / 72;
      const txt = 'Composé par Melodia Funèbre' + (e.agence ? ' · ' + e.agence : '');
      parts.push(`<text x="${e.x}" y="${e.y}" font-size="${fs.toFixed(2)}" fill="${e.couleur}" text-anchor="${ancre}" ${FONTES.italique}>${ESC(txt)}</text>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.l}mm" height="${g.h}mm" viewBox="0 0 ${g.l} ${g.h}" role="img" aria-label="${ESC(g.nom)}">${parts.join('')}</svg>`;
}

/** PNG à la résolution demandée (300 ou 600 dpi), depuis le SVG. */
export async function versPng(svg, g, dpi) {
  const l = Math.round(g.l / 25.4 * dpi);
  const hgt = Math.round(g.h / 25.4 * dpi);
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
  const c = document.createElement('canvas');
  c.width = l; c.height = hgt;
  c.getContext('2d').drawImage(img, 0, 0, l, hgt);
  return new Promise((ok) => c.toBlob(ok, 'image/png'));
}

/** PDF vectoriel avec fond perdu (3 mm) et traits de coupe. */
export async function versPdf(g, mise, qr, couleursQr, logo) {
  const { Pdf, versJpeg } = await import('./pdf.js');
  const pdf = new Pdf().page(g.l, g.h, { coupe: true });
  for (const e of mise.primitives) {
    if (e.type === 'fond') pdf.rect(-3, -3, g.l + 6, g.h + 6, { fond: e.couleur }); // fond perdu
    else if (e.type === 'filet') pdf.rect(e.marge, e.marge, g.l - 2 * e.marge, g.h - 2 * e.marge, { trait: e.couleur, epaisseur: 0.35 });
    else if (e.type === 'plaque') pdf.rect(e.x, e.y, e.l, e.h, { fond: e.couleur, r: e.r });
    else if (e.type === 'cadre') pdf.rect(e.x, e.y, e.l, e.h, { trait: e.couleur, epaisseur: 0.25, r: e.r });
    else if (e.type === 'qr') {
      pdf.qr(qr.formes, qr.cote, e.x, e.y, e.taille, couleursQr);
      if (logo && qr.logo_zone) {
        const s = e.taille / (qr.cote * 100);
        const [zx, zy, zs] = qr.logo_zone;
        const m = zs * 0.1;
        const j = await versJpeg(logo, couleursQr.fond || '#ffffff', 300);
        pdf.image(j.octets, j.l, j.h, e.x + (zx + m) * s, e.y + (zy + m) * s, (zs - 2 * m) * s, (zs - 2 * m) * s);
      }
    } else if (e.type === 'texte') pdf.texte(e.texte, e.x, e.y, { taille: e.taille, police: e.police === 'italique' ? 'italique' : e.police, couleur: e.couleur, align: e.align });
    else if (e.type === 'signature') pdf.texte('Composé par Melodia Funèbre' + (e.agence ? ' · ' + e.agence : ''), e.x, e.y, { taille: e.petit ? 5.5 : 6.5, police: 'italique', couleur: e.couleur, align: e.centre ? 'centre' : null });
  }
  return pdf.blob();
}
