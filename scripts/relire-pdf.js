/* ═══════════════════════════════════════════════════════════════
   Relire un PDF produit par Chromium, sans lecteur PDF.

   Trois pièges, découverts un par un :

   1. L'ordre des pages est dans l'arbre /Root → /Pages → /Kids, pas
      dans l'ordre des objets. Le premier essai prenait le premier
      nœud /Pages venu et ne trouvait que 3 pages sur 18.

   2. Le texte n'est presque jamais dans le flux de la page : il est
      dans des Form XObjects que la page invoque par « /X44 Do ».

   3. Les chaînes sont des chaînes hexadécimales de codes de glyphes
      — « <1D> Tj » — propres à chaque sous-ensemble de police. Une
      table ToUnicode fusionnée rend du charabia : il faut suivre le
      « /F33 Tf » courant et décoder avec la table de CETTE police.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const zlib = require('zlib');

function charger(fichier) {
  const s = fs.readFileSync(fichier).toString('latin1');
  const objs = {};
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = re.exec(s))) {
    const debut = m.index + m[0].length;
    const fin = s.indexOf('endobj', debut);
    if (fin > 0) objs[m[1]] = { debut, dict: s.slice(debut, fin) };
  }
  return { s, objs };
}

function flux(s, o) {
  if (!o) return null;
  const i = o.dict.indexOf('stream');
  if (i < 0) return null;
  const entete = o.dict.slice(0, i);
  let d = o.debut + i + 6;
  while (s[d] === '\r' || s[d] === '\n') d++;
  const f = s.indexOf('endstream', d);
  const b = Buffer.from(s.slice(d, f), 'latin1');
  if (!/FlateDecode/.test(entete)) return b;
  try { return zlib.inflateSync(b); } catch (e) { return null; }
}

function cmap(txt) {
  const t = {};
  let m;
  const rc = /beginbfchar([\s\S]*?)endbfchar/g;
  while ((m = rc.exec(txt))) {
    const p = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g; let q;
    while ((q = p.exec(m[1]))) {
      t[parseInt(q[1], 16)] = (q[2].match(/.{1,4}/g) || []).map(h => String.fromCharCode(parseInt(h, 16))).join('');
    }
  }
  const rr = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((m = rr.exec(txt))) {
    const p = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g; let q;
    while ((q = p.exec(m[1]))) {
      const a = parseInt(q[1], 16), b = parseInt(q[2], 16), c = parseInt(q[3], 16);
      for (let i = a; i <= b && i - a < 9000; i++) t[i] = String.fromCharCode(c + (i - a));
    }
  }
  return t;
}

function lire(fichier) {
  const { s, objs } = charger(fichier);

  /* ─ l'ordre des pages ─ */
  const racine = Object.keys(objs).find(id => /\/Type\s*\/Catalog/.test(objs[id].dict));
  const ordre = [];
  const vus = new Set();
  (function descendre(id) {
    if (!id || vus.has(id) || !objs[id]) return;
    vus.add(id);
    const d = objs[id].dict;
    if (/\/Type\s*\/Page\b/.test(d) && !/\/Type\s*\/Pages\b/.test(d)) { ordre.push(id); return; }
    const k = d.match(/\/Kids\s*\[([\s\S]*?)\]/);
    if (k) for (const x of k[1].matchAll(/(\d+)\s+\d+\s+R/g)) descendre(x[1]);
  })(racine ? (objs[racine].dict.match(/\/Pages\s+(\d+)\s+\d+\s+R/) || [])[1] : null);

  const tables = {};   /* id d'objet police → table ToUnicode */
  function tableDe(idPolice) {
    if (tables[idPolice] !== undefined) return tables[idPolice];
    const o = objs[idPolice];
    let t = {};
    if (o) {
      const u = o.dict.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/);
      if (u) { const f = flux(s, objs[u[1]]); if (f) t = cmap(f.toString('latin1')); }
    }
    tables[idPolice] = t;
    return t;
  }

  function polices(dictRessources) {
    const f = dictRessources.match(/\/Font\s*<<([\s\S]*?)>>/);
    const t = {};
    if (f) for (const m of f[1].matchAll(/\/(\w+)\s+(\d+)\s+\d+\s+R/g)) t[m[1]] = m[2];
    return t;
  }
  function xobjets(dictRessources) {
    const x = dictRessources.match(/\/XObject\s*<<([\s\S]*?)>>/);
    const l = [];
    if (x) for (const m of x[1].matchAll(/\/(\w+)\s+(\d+)\s+\d+\s+R/g)) l.push(m[2]);
    return l;
  }

  /* ─ le texte d'un flux, en suivant la police courante ─ */
  function texteDe(contenu, pol) {
    let courante = {};
    const out = [];
    const re = /\/(\w+)\s+[\d.]+\s+Tf|<([0-9A-Fa-f\s]*)>\s*Tj|\(((?:\\.|[^\\()])*)\)\s*Tj|\[((?:[^\]\\]|\\.)*)\]\s*TJ|\bET\b|\bTd\b|\bT\*\b/g;
    let m;
    const hexVersTexte = (h) => {
      const n = h.replace(/\s+/g, '');
      let o = '';
      /* Codes d'un octet dans ces sous-ensembles ; on bascule sur deux
         octets si la table ne connaît aucun code simple. */
      const pas = Object.keys(courante).some(k => +k > 255) ? 4 : 2;
      for (let i = 0; i + pas <= n.length; i += pas) {
        const c = parseInt(n.slice(i, i + pas), 16);
        o += courante[c] !== undefined ? courante[c] : '';
      }
      return o;
    };
    while ((m = re.exec(contenu))) {
      if (m[1] !== undefined) { courante = tableDe(pol[m[1]]) || {}; continue; }
      if (m[2] !== undefined) { out.push(hexVersTexte(m[2])); continue; }
      if (m[3] !== undefined) { out.push(m[3]); continue; }
      if (m[4] !== undefined) {
        for (const q of m[4].matchAll(/<([0-9A-Fa-f\s]*)>/g)) out.push(hexVersTexte(q[1]));
        continue;
      }
      /* Chromium positionne chaque glyphe par son propre « Td » :
         y voir un espace collait un blanc entre toutes les lettres.
         Seuls « ET » et « T* » séparent vraiment. Les espaces réels
         sont des glyphes comme les autres. */
      out.push(m[0] === 'Td' ? '' : '\n');
    }
    return out.join('');
  }

  return ordre.map((id, i) => {
    const d = objs[id].dict;
    const pol = polices(d);
    const morceaux = [];
    const c = d.match(/\/Contents\s+(\d+)\s+\d+\s+R/);
    if (c) { const f = flux(s, objs[c[1]]); if (f) morceaux.push(texteDe(f.toString('latin1'), pol)); }
    for (const x of xobjets(d)) {
      const o = objs[x];
      if (!o) continue;
      const f = flux(s, o);
      if (!f) continue;
      const polX = Object.assign({}, pol, polices(o.dict));
      morceaux.push(texteDe(f.toString('latin1'), polX));
    }
    const texte = morceaux.join('\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
    return { page: i + 1, texte };
  });
}

/* ─── Relecture ───
   Ce qu'on cherche dans un document imprimé qu'on ne peut pas
   feuilleter : un titre resté seul en bas d'une feuille, et une page
   presque vide. Le reste se voit à l'œil, une fois le fichier ouvert. */
function auditer(fichier, titres) {
  const pages = lire(fichier);
  const soucis = [];
  console.log('\n' + fichier.split('/').pop() + ' — ' + pages.length + ' pages');
  for (const p of pages) {
    const l = p.texte.split('\n').map(x => x.trim()).filter(Boolean);
    const derniere = l[l.length - 1] || '';
    /* Un titre long se coupe en deux lignes dans le PDF : la dernière
       ligne de la page n'est alors que sa fin. Chercher l'égalité
       stricte laissait passer exactement les cas qu'on veut attraper —
       vérifié en déclarant « titre » une phrase connue de fin de page,
       que le contrôle n'a pas signalée. */
    const propre = x => x.replace(/\s+/g, ' ').trim();
    const fin = propre(derniere);
    const orphelin = fin.length >= 8 && titres.some(t => {
      const T = propre(t);
      return T === fin || T.endsWith(fin);
    });
    const maigre = l.length > 0 && l.length < 3 && p.texte.length < 60;
    if (orphelin) soucis.push('page ' + p.page + ' : le titre « ' + derniere + ' » est seul en bas de page');
    if (maigre) soucis.push('page ' + p.page + ' : presque vide');
    console.log(
      String(p.page).padStart(3) + ' │ ' + String(l.length).padStart(3) + ' lignes │ ' +
      (orphelin ? 'TITRE ORPHELIN ' : maigre ? 'PAGE MAIGRE    ' : '               ') +
      '│ ' + (l[0] || '(planche, sans texte)').slice(0, 44));
  }
  console.log(soucis.length ? '  → ' + soucis.join('\n  → ') : '  → aucun titre orphelin, aucune page maigre');
  return soucis.length;
}

module.exports = { lire, auditer };

if (require.main === module) {
  const a = process.argv.slice(2);
  if (!a.length) {
    /* Sans argument : les deux documents de la maison. */
    const path = require('path');
    const d = path.join(__dirname, '..', 'documents');
    const titres = require('../build/pdf-manuel.js').TITRES || [];
    let n = 0;
    for (const f of ['melodia-brochure-partenaire.pdf', 'melodia-manuel-de-vente.pdf']) {
      const c = path.join(d, f);
      if (fs.existsSync(c)) n += auditer(c, titres);
      else console.error('  MANQUE ' + c + ' — lancez « npm run pdf »');
    }
    process.exit(n ? 1 : 0);
  }
  const pages = lire(a[0]);
  const seule = +(a[1] || 0);
  console.log(pages.length + ' pages');
  for (const p of pages) {
    if (seule && p.page !== seule) continue;
    console.log('\n═════ page ' + p.page + ' ═════\n' + p.texte);
  }
}
