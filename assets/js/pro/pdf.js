// ═══════════════════════════════════════════════════════════════
// Un petit écrivain PDF, écrit pour la maison (aucune bibliothèque tierce).
//
// Vectoriel : le QR est tracé module par module (net à toute taille, ce que
// demandent les graveurs et les imprimeurs). Polices standard du PDF
// (Times, Helvetica, Courier) en WinAnsi : les accents français, « », —, ’,
// œ et € passent. Images : JPEG seulement (DCTDecode).
// Fond perdu et traits de coupe : MediaBox = format + 3 mm de fond perdu
// + 7 mm pour les traits ; TrimBox et BleedBox déclarés.
// ═══════════════════════════════════════════════════════════════

const PT = 72 / 25.4; // points par millimètre

const POLICES = { serif: 'Times-Roman', italique: 'Times-Italic', sans: 'Helvetica', gras: 'Helvetica-Bold', mono: 'Courier' };
const LARGEUR_MOY = { serif: 0.45, italique: 0.42, sans: 0.5, gras: 0.54, mono: 0.6 };
const WINANSI = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, 'œ': 0x9c, 'Œ': 0x8c, 'Ÿ': 0x9f, '·': 0xb7 };

function octetsWinAnsi(s) {
  const out = [];
  for (const c of String(s).normalize('NFC')) {
    const code = c.codePointAt(0);
    let b = WINANSI[c];
    if (b == null) b = code < 256 ? code : 0x3f; // « ? » pour l'inconnu
    if (b === 0x28 || b === 0x29 || b === 0x5c) out.push(0x5c);
    out.push(b);
  }
  return out;
}

function couleur(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '#000000');
  const n = parseInt(m ? m[1] : '000000', 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((x) => x.toFixed(3)).join(' ');
}

const f = (x) => (Math.round(x * 100) / 100).toString();

export class Pdf {
  constructor() { this.pages = []; this.images = []; }

  /** Nouvelle page : format en mm. options.coupe → fond perdu 3 mm + traits de coupe. */
  page(l, hgt, options = {}) {
    const marge = options.coupe ? 10 : 0;
    const p = { l, h: hgt, marge, coupe: !!options.coupe, flux: [], images: new Set() };
    this.pages.push(p);
    this.p = p;
    if (options.coupe) this.traitsDeCoupe();
    return this;
  }

  // Coordonnées en mm depuis le coin haut-gauche du format fini.
  X(x) { return (x + this.p.marge) * PT; }
  Y(y) { return (this.p.h + this.p.marge - y) * PT; }
  op(s) { this.p.flux.push(s); }

  rect(x, y, w, hgt, o = {}) {
    if (o.r) return this.rectArrondi(x, y, w, hgt, o.r, o);
    if (o.fond) this.op(`${couleur(o.fond)} rg ${f(this.X(x))} ${f(this.Y(y + hgt))} ${f(w * PT)} ${f(hgt * PT)} re f`);
    if (o.trait) this.op(`${couleur(o.trait)} RG ${f((o.epaisseur || 0.3) * PT)} w ${f(this.X(x))} ${f(this.Y(y + hgt))} ${f(w * PT)} ${f(hgt * PT)} re S`);
    return this;
  }

  rectArrondi(x, y, w, hgt, r, o = {}) {
    r = Math.min(r, w / 2, hgt / 2);
    const k = 0.5523 * r;
    const [x0, x1, y0, y1] = [x, x + w, y, y + hgt];
    const P = (a, b) => `${f(this.X(a))} ${f(this.Y(b))}`;
    const chemin = `${P(x0 + r, y0)} m ${P(x1 - r, y0)} l ${P(x1 - r + k, y0)} ${P(x1, y0 + r - k)} ${P(x1, y0 + r)} c ` +
      `${P(x1, y1 - r)} l ${P(x1, y1 - r + k)} ${P(x1 - r + k, y1)} ${P(x1 - r, y1)} c ${P(x0 + r, y1)} l ` +
      `${P(x0 + r - k, y1)} ${P(x0, y1 - r + k)} ${P(x0, y1 - r)} c ${P(x0, y0 + r)} l ${P(x0, y0 + r - k)} ${P(x0 + r - k, y0)} ${P(x0 + r, y0)} c h`;
    if (o.fond) this.op(`${couleur(o.fond)} rg ${chemin} f`);
    if (o.trait) this.op(`${couleur(o.trait)} RG ${f((o.epaisseur || 0.3) * PT)} w ${chemin} S`);
    return this;
  }

  cercle(cx, cy, r, o = {}) {
    const k = 0.5523 * r;
    const P = (a, b) => `${f(this.X(a))} ${f(this.Y(b))}`;
    const c = `${P(cx + r, cy)} m ${P(cx + r, cy + k)} ${P(cx + k, cy + r)} ${P(cx, cy + r)} c ${P(cx - k, cy + r)} ${P(cx - r, cy + k)} ${P(cx - r, cy)} c ` +
      `${P(cx - r, cy - k)} ${P(cx - k, cy - r)} ${P(cx, cy - r)} c ${P(cx + k, cy - r)} ${P(cx + r, cy - k)} ${P(cx + r, cy)} c h`;
    this.op(`${couleur(o.fond || '#000000')} rg ${c} f`);
    return this;
  }

  ligne(x1, y1, x2, y2, o = {}) {
    this.op(`${couleur(o.trait || '#000000')} RG ${f((o.epaisseur || 0.25) * PT)} w ${f(this.X(x1))} ${f(this.Y(y1))} m ${f(this.X(x2))} ${f(this.Y(y2))} l S`);
    return this;
  }

  largeur(texte, taille, police = 'serif') { return String(texte).length * taille * (LARGEUR_MOY[police] || 0.5) / PT; }

  /** Texte ; y = ligne de base en mm ; taille en points. */
  texte(texte, x, y, o = {}) {
    const taille = o.taille || 11;
    const police = o.police || 'serif';
    let px = x;
    const w = this.largeur(texte, taille, police);
    if (o.align === 'centre') px = x - w / 2;
    else if (o.align === 'droite') px = x - w;
    const nom = Object.keys(POLICES).indexOf(police) + 1;
    const oct = octetsWinAnsi(texte);
    this.op({ texte: true, avant: `BT ${couleur(o.couleur || '#000000')} rg /F${nom} ${f(taille)} Tf ${f(this.X(px))} ${f(this.Y(y))} Td (`, octets: oct, apres: ') Tj ET' });
    return this;
  }

  /** Paragraphe coupé à la largeur donnée ; rend l'ordonnée suivante. */
  paragraphe(texte, x, y, largeur, o = {}) {
    const taille = o.taille || 11;
    const inter = (o.interligne || 1.4) * taille / PT;
    for (const bloc of String(texte).split('\n')) {
      let ligne = '';
      for (const mot of bloc.split(/\s+/)) {
        const essai = ligne ? ligne + ' ' + mot : mot;
        if (this.largeur(essai, taille, o.police) > largeur && ligne) { this.texte(ligne, x, y, o); y += inter; ligne = mot; }
        else ligne = essai;
      }
      this.texte(ligne, x, y, o); y += inter;
    }
    return y;
  }

  /** Image JPEG (octets) posée en mm. */
  image(jpeg, lpx, hpx, x, y, w, hgt) {
    let i = this.images.findIndex((im) => im.octets === jpeg);
    if (i < 0) { this.images.push({ octets: jpeg, l: lpx, h: hpx }); i = this.images.length - 1; }
    this.p.images.add(i);
    this.op(`q ${f(w * PT)} 0 0 ${f(hgt * PT)} ${f(this.X(x))} ${f(this.Y(y + hgt))} cm /Im${i} Do Q`);
    return this;
  }

  /**
   * QR depuis les formes du noyau Rust (centièmes de module) :
   * ["r", x, y, w, h, rayon, sombre] et ["c", cx, cy, r, sombre].
   */
  qr(formes, cote, x, y, taille, { encre = '#040407', fond = '#ffffff', oeil } = {}) {
    const s = taille / (cote * 100);
    for (const fo of formes) {
      if (fo[0] === 'r') {
        const [, rx, ry, rw, rh, rr, sombre] = fo;
        const c = sombre ? encre : fond;
        const o = { fond: c };
        if (rr > 0) o.r = rr * s;
        this.rect(x + rx * s, y + ry * s, rw * s, rh * s, o);
      } else {
        const [, cx, cy, r, sombre] = fo;
        this.cercle(x + cx * s, y + cy * s, r * s, { fond: sombre ? encre : fond });
      }
    }
    void oeil;
    return this;
  }

  traitsDeCoupe() {
    const p = this.p;
    const m = p.marge;
    const lng = 5, ecart = 3; // 3 mm : hors du fond perdu
    const coins = [[0, 0], [p.l, 0], [0, p.h], [p.l, p.h]];
    const op = (x1, y1, x2, y2) => this.op(`0 0 0 RG ${f(0.25)} w ${f((x1 + m) * PT)} ${f((p.h + m - y1) * PT)} m ${f((x2 + m) * PT)} ${f((p.h + m - y2) * PT)} l S`);
    for (const [cx, cy] of coins) {
      const dx = cx === 0 ? -1 : 1;
      const dy = cy === 0 ? -1 : 1;
      op(cx + dx * ecart, cy, cx + dx * (ecart + lng), cy);
      op(cx, cy + dy * ecart, cx, cy + dy * (ecart + lng));
    }
  }

  blob() {
    const enc = new TextEncoder();
    const morceaux = [];
    let pos = 0;
    const offsets = [];
    const ecrire = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; morceaux.push(b); pos += b.length; };
    const objets = []; // [num, () => contenu]
    let num = 0;
    const nouveau = () => ++num;
    const catalogue = nouveau();
    const arbre = nouveau();
    const polices = Object.values(POLICES).map((nom) => ({ n: nouveau(), nom }));
    const imgs = this.images.map((im) => ({ n: nouveau(), im }));
    const pages = this.pages.map((p) => ({ p, n: nouveau(), flux: nouveau() }));

    ecrire('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[\u0080-ÿ]/g, (c) => c)); // en-tête
    const obj = (n, contenu) => { offsets[n] = pos; ecrire(`${n} 0 obj\n`); if (Array.isArray(contenu)) contenu.forEach(ecrire); else ecrire(contenu); ecrire('\nendobj\n'); };

    obj(catalogue, `<< /Type /Catalog /Pages ${arbre} 0 R >>`);
    obj(arbre, `<< /Type /Pages /Kids [${pages.map((x) => x.n + ' 0 R').join(' ')}] /Count ${pages.length} >>`);
    polices.forEach(({ n, nom }) => obj(n, `<< /Type /Font /Subtype /Type1 /BaseFont /${nom} /Encoding /WinAnsiEncoding >>`));
    imgs.forEach(({ n, im }) => obj(n, [`<< /Type /XObject /Subtype /Image /Width ${im.l} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.octets.length} >>\nstream\n`, im.octets, '\nendstream']));
    for (const { p, n, flux } of pages) {
      const W = (p.l + 2 * p.marge) * PT;
      const H = (p.h + 2 * p.marge) * PT;
      const boites = p.coupe
        ? ` /BleedBox [${f((p.marge - 3) * PT)} ${f((p.marge - 3) * PT)} ${f((p.marge + p.l + 3) * PT)} ${f((p.marge + p.h + 3) * PT)}] /TrimBox [${f(p.marge * PT)} ${f(p.marge * PT)} ${f((p.marge + p.l) * PT)} ${f((p.marge + p.h) * PT)}]`
        : '';
      const fontes = polices.map((x, i) => `/F${i + 1} ${x.n} 0 R`).join(' ');
      const xo = [...p.images].map((i) => `/Im${i} ${imgs[i].n} 0 R`).join(' ');
      obj(n, `<< /Type /Page /Parent ${arbre} 0 R /MediaBox [0 0 ${f(W)} ${f(H)}]${boites} /Resources << /Font << ${fontes} >>${xo ? ` /XObject << ${xo} >>` : ''} >> /Contents ${flux} 0 R >>`);
      const parts = [];
      for (const o of p.flux) {
        if (typeof o === 'string') parts.push(enc.encode(o + '\n'));
        else parts.push(enc.encode(o.avant), Uint8Array.from(o.octets), enc.encode(o.apres + '\n'));
      }
      const long = parts.reduce((s, b) => s + b.length, 0);
      obj(flux, [`<< /Length ${long} >>\nstream\n`, ...parts, 'endstream']);
    }
    const xref = pos;
    ecrire(`xref\n0 ${num + 1}\n0000000000 65535 f \n`);
    for (let i = 1; i <= num; i++) ecrire(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
    ecrire(`trailer\n<< /Size ${num + 1} /Root ${catalogue} 0 R /Info << /Producer (Melodia Fun\\350bre) /Creator (Melodia Fun\\350bre Pro) >> >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(morceaux, { type: 'application/pdf' });
  }
}

/** Image (URL ou data URL) → JPEG sur fond donné, pour le PDF. */
export async function versJpeg(src, fond = '#ffffff', max = 600) {
  const img = await new Promise((resoudre, rejeter) => { const i = new Image(); i.onload = () => resoudre(i); i.onerror = rejeter; i.src = src; });
  const ratio = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * ratio));
  c.height = Math.max(1, Math.round(img.naturalHeight * ratio));
  const g = c.getContext('2d');
  g.fillStyle = fond; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
  return { octets: new Uint8Array(await blob.arrayBuffer()), l: c.width, h: c.height };
}

/** Récapitulatif du questionnaire (A4). En mode famille : ni prix ni notes internes. */
export async function recapitulatif(q, { famille, reference }) {
  const { telecharger } = await import('./ui.js');
  const pdf = new Pdf().page(210, 297);
  pdf.rect(0, 0, 210, 18, { fond: '#040407' });
  pdf.texte('MELODIA FUNÈBRE', 20, 11.5, { police: 'mono', taille: 9, couleur: '#c9a84c' });
  pdf.texte('Récapitulatif du questionnaire', 190, 11.5, { police: 'sans', taille: 9, couleur: '#f2efe8', align: 'droite' });
  let y = 36;
  const d = q.defunt || {};
  pdf.texte('Pour ' + (d.prenom || '…') + (d.nom ? ' ' + d.nom : ''), 20, y, { police: 'italique', taille: 24, couleur: '#17150f' });
  y += 8;
  pdf.texte('Dossier ' + reference + ' · ' + new Date().toLocaleDateString('fr-FR'), 20, y, { police: 'sans', taille: 9, couleur: '#6a6453' });
  y += 10;
  const sections = [
    ['La personne', [['Accord', d.genre], ['Surnom', d.surnom], ['Prononciation', d.prononciation], ['Dates', [d.naissance, d.deces].filter(Boolean).join(' – ')], ['Lieux', d.lieux], ['Langues', d.langues]]],
    ['Sa vie', [['Métier', q.vie?.metier], ['Passion', q.vie?.passion], ['Traits', (q.vie?.traits || []).join(', ')], ['Habitude', q.vie?.habitude], ['Anecdote', q.vie?.anecdote], ['Phrase', q.vie?.phrase], ['Aimait', q.vie?.aimait], ['À éviter', q.vie?.eviter]]],
    ['La musique', [['Style', q.musique?.style], ['Voix', q.musique?.voix], ['Instruments', (q.musique?.instruments || []).join(', ')], ['À éviter', (q.musique?.instruments_eviter || []).join(', ')]]],
    ['La cérémonie', [['Rite', q.ceremonie?.rite], ['Texte', q.ceremonie?.texte], ['Moment', q.ceremonie?.moment], ['Date', q.ceremonie?.date_ceremonie], famille ? null : ['Contraintes', q.ceremonie?.contraintes]].filter(Boolean)],
    ['Le message', [['Ton', q.message?.ton], ['Refrain', q.message?.refrain], ['Titre', q.message?.titre], ['Adresse', q.message?.adresse]]],
    ['Consentements', [['Information RGPD', q.consentements?.rgpd ? 'oui' : 'non'], ['Relecture famille', q.consentements?.relecture_famille ? 'oui' : 'non'], ['Page mémorial', q.consentements?.visibilite]]]
  ];
  for (const [ti, champs] of sections) {
    const remplis = champs.filter(([, v]) => v);
    if (!remplis.length) continue;
    if (y > 260) { pdf.page(210, 297); y = 24; }
    pdf.texte(ti.toUpperCase(), 20, y, { police: 'mono', taille: 8, couleur: '#806a30' });
    pdf.ligne(20, y + 2, 190, y + 2, { trait: '#d9d2c2', epaisseur: 0.2 });
    y += 8;
    for (const [k, v] of remplis) {
      if (y > 275) { pdf.page(210, 297); y = 24; }
      pdf.texte(k, 20, y, { police: 'sans', taille: 9, couleur: '#6a6453' });
      y = pdf.paragraphe(String(v), 62, y, 128, { police: 'serif', taille: 11, couleur: '#17150f' }) + 1.5;
    }
    y += 4;
  }
  pdf.texte('Composé par Melodia Funèbre · Chaque vie mérite sa chanson.', 105, 288, { police: 'italique', taille: 9, couleur: '#806a30', align: 'centre' });
  telecharger(pdf.blob(), `melodia-recapitulatif-${reference}.pdf`);
}
