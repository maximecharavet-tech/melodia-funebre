// Ce qui ne doit pas être lisible en ligne.
//
// Un site statique sert tout ce qui est à sa racine. Les plans, rapports
// et audits nomment des fournisseurs (marque blanche) ; lib/ contient le
// code serveur. Constaté le 12/11/2026 dans la sortie de « vercel build » :
// tout était servi. Ce test empêche que cela revienne.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ignore = readFileSync(join(RACINE, '.vercelignore'), 'utf8').split(/\r?\n/).map((l) => l.trim());
const vercel = JSON.parse(readFileSync(join(RACINE, 'vercel.json'), 'utf8'));

test('les documents de travail à la racine ne sont pas téléversés', () => {
  assert.ok(ignore.includes('/*.md'), '.vercelignore doit contenir /*.md');
  const md = readdirSync(RACINE).filter((f) => f.endsWith('.md'));
  assert.ok(md.length > 0);
});

test('sources et outils internes non téléversés', () => {
  for (const d of ['docs/', 'tests/', 'apps/', 'melodia-pro-wasm/', 'console-julie-wasm/', 'build/', 'scripts/', 'supabase/', 'archive/']) {
    assert.ok(ignore.includes(d), `.vercelignore doit contenir ${d}`);
  }
});

test('lib/ reste téléversé (les fonctions le requièrent) mais son accès HTTP est redirigé', () => {
  assert.ok(!ignore.some((l) => /^\/?lib\/?$/.test(l)), 'lib/ ne doit pas être ignoré : api/ en dépend');
  const r = vercel.redirects.find((x) => x.source === '/lib/:chemin*');
  assert.ok(r && r.destination === '/404', 'redirection /lib/:chemin* → /404 attendue dans vercel.json');
});
