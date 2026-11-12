// Chaque fonction serveur doit se charger telle que Vercel la charge.
//
// Contexte : sans « type": "module" » dans package.json, Vercel compile
// les fichiers api/**/*.js écrits en syntaxe import/export vers CommonJS ;
// chaque import devient un require(). Un require() d'un module ESM
// (.mjs) lève ERR_REQUIRE_ESM : c'est la panne du 11/11/2026, qui a fait
// tomber toutes les fonctions de la PR #27 et l'atelier musical public.
//
// Deux épreuves, pour chaque fichier de api/ :
//   1. graphe statique — aucun .mjs atteignable, aucune syntaxe ESM hors
//      de api/ (Vercel ne compile que ce qu'il reconnaît comme entrée) ;
//   2. chargement réel — la fonction est convertie en CommonJS comme le
//      fait Vercel, puis chargée par Node avec require(esm) désactivé.
//      Le gestionnaire exporté doit être une fonction.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync, cpSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname, relative, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SYNTAXE_ESM = /^\s*(import\s+[\w*{$]|import\s+['"]|export\s+(default|const|let|var|function|async|class|\{|\*))/m;

function lister(dossier) {
  const out = [];
  for (const nom of readdirSync(dossier)) {
    const p = join(dossier, nom);
    if (statSync(p).isDirectory()) out.push(...lister(p));
    else if (nom.endsWith('.js')) out.push(p);
  }
  return out;
}

const FONCTIONS = lister(join(RACINE, 'api'));
const rel = (p) => relative(RACINE, p).split(sep).join('/');

/** Spécificateurs relatifs importés (statiques, require, import()). */
function dependances(source) {
  const sans = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const specs = new Set();
  const motifs = [
    /\bimport\s+[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const m of motifs) for (const r of sans.matchAll(m)) specs.add(r[1]);
  return [...specs].filter((s) => s.startsWith('.'));
}

function resoudre(depuis, spec) {
  const base = join(dirname(depuis), spec);
  for (const c of [base, base + '.js', base + '.cjs', join(base, 'index.js')]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

test('il y a bien des fonctions à vérifier', () => {
  assert.ok(FONCTIONS.length >= 30, `seulement ${FONCTIONS.length} fonctions trouvées`);
});

for (const fonction of FONCTIONS) {
  test(`graphe CommonJS : ${rel(fonction)}`, () => {
    const vus = new Set();
    const pile = [fonction];
    while (pile.length) {
      const f = pile.pop();
      if (vus.has(f)) continue;
      vus.add(f);
      const r = rel(f);
      assert.ok(!f.endsWith('.mjs'), `${rel(fonction)} atteint un module ESM : ${r} (ERR_REQUIRE_ESM sur Vercel)`);
      const src = readFileSync(f, 'utf8');
      if (!r.startsWith('api/')) {
        assert.ok(!SYNTAXE_ESM.test(src), `${r} (hors api/) est écrit en syntaxe ESM ; il doit être CommonJS`);
      }
      for (const spec of dependances(src)) {
        const cible = resoudre(f, spec);
        assert.ok(cible, `${r} : import introuvable « ${spec} »`);
        if (/\.(js|cjs|mjs)$/.test(cible)) pile.push(cible);
      }
    }
  });
}

// ── Conversion ESM → CommonJS, au plus près de ce que fait Vercel ──────
function clauseVersCjs(clause, mod) {
  const lignes = [];
  let reste = clause.trim();
  const etoile = reste.match(/^\*\s+as\s+([\w$]+)$/);
  if (etoile) return `const ${etoile[1]} = ${mod};`;
  const accolades = reste.match(/\{([\s\S]*)\}/);
  if (accolades) {
    const noms = accolades[1].split(',').map((s) => s.trim()).filter(Boolean)
      .map((s) => s.replace(/^([\w$]+)\s+as\s+([\w$]+)$/, '$1: $2'));
    lignes.push(`const { ${noms.join(', ')} } = ${mod};`);
    reste = reste.replace(accolades[0], '').replace(/,\s*$/, '').trim();
  }
  const defaut = reste.replace(/,$/, '').trim();
  if (defaut) lignes.unshift(`const ${defaut} = (${mod} && ${mod}.__esModule) ? ${mod}.default : ${mod};`);
  return lignes.join(' ');
}

function versCommonJs(source) {
  let n = 0;
  const exportes = [];
  let src = source.replace(/^import\s+([\s\S]*?)\s+from\s*(['"])([^'"]+)\2;?/gm, (_, clause, __, spec) => {
    const mod = `__m${n++}`;
    return `const ${mod} = require(${JSON.stringify(spec)}); ${clauseVersCjs(clause, mod)}`;
  });
  src = src.replace(/^import\s+(['"])([^'"]+)\1;?/gm, (_, __, spec) => `require(${JSON.stringify(spec)});`);
  src = src.replace(/^export\s+default\s+(async\s+)?function\s+([\w$]+)/gm, (_, a, nom) => {
    exportes.push(['default', nom]);
    return `${a || ''}function ${nom}`;
  });
  src = src.replace(/^export\s+default\s+/gm, 'exports.default = ');
  src = src.replace(/^export\s+(async\s+function|function|const|let|var|class)\s+([\w$]+)/gm, (_, mot, nom) => {
    exportes.push([nom, nom]);
    return `${mot} ${nom}`;
  });
  src = src.replace(/^export\s*\{([\s\S]*?)\};?/gm, (_, liste) => {
    for (const s of liste.split(',').map((x) => x.trim()).filter(Boolean)) {
      const m = s.match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/);
      exportes.push([m[2] || m[1], m[1]]);
    }
    return '';
  });
  const pied = exportes.map(([cle, nom]) => `exports.${cle} = ${nom};`).join('\n');
  return `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\n${src}\n${pied}\n`;
}

test('chargement réel en mode Vercel (CommonJS, require(esm) désactivé)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'melodia-api-'));
  try {
    // api + lib + ce que vercel.json fournit par includeFiles
    for (const d of ['api', 'lib', 'assets/js/vendor', 'assets/data']) {
      cpSync(join(RACINE, d), join(tmp, d), { recursive: true });
    }
    writeFileSync(join(tmp, 'package.json'), JSON.stringify({ private: true, type: 'commonjs' }));
    for (const f of lister(join(tmp, 'api'))) {
      const src = readFileSync(f, 'utf8');
      if (SYNTAXE_ESM.test(src)) writeFileSync(f, versCommonJs(src));
    }
    const cibles = FONCTIONS.map((f) => join(tmp, relative(RACINE, f)));
    const sonde = join(tmp, 'sonde.cjs');
    writeFileSync(sonde, `
      const out = [];
      for (const f of ${JSON.stringify(cibles)}) {
        try {
          const m = require(f);
          const h = (m && m.__esModule) ? m.default : m;
          const prive = /[\\\\/]_[^\\\\/]+$/.test(f);
          out.push({ f, ok: prive || typeof h === 'function', type: typeof h });
        } catch (e) {
          out.push({ f, ok: false, code: e.code || e.name, message: String(e.message).split('\\n')[0] });
        }
      }
      process.stdout.write(JSON.stringify(out));
    `);
    const r = spawnSync(process.execPath, ['--no-experimental-require-module', sonde], {
      cwd: tmp, encoding: 'utf8', env: { PATH: process.env.PATH, NODE_ENV: 'production' },
    });
    assert.equal(r.status, 0, r.stderr);
    const resultats = JSON.parse(r.stdout);
    const echecs = resultats.filter((x) => !x.ok)
      .map((x) => `${relative(tmp, x.f).split(sep).join('/')} → ${x.code || 'gestionnaire ' + x.type} ${x.message || ''}`);
    assert.equal(resultats.length, FONCTIONS.length);
    assert.deepEqual(echecs, [], 'fonctions qui ne se chargent pas :\n  ' + echecs.join('\n  '));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
