// Serveur statique minimal pour les essais de bout en bout : « cleanUrls »,
// réécriture /m/<jeton> → hommage, et en-têtes de vercel.json (dont la CSP
// de /pro) pour que les essais tournent sous la même politique qu'en ligne.
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const RACINE = process.cwd();
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain'
};
const vercel = JSON.parse(readFileSync(join(RACINE, 'vercel.json'), 'utf8'));

function entetes(chemin) {
  const h = {};
  for (const r of vercel.headers) {
    const motif = new RegExp('^' + r.source.replace(/\(\.\*\)/g, '.*').replace(/:[a-z]+/g, '[^/]+') + '$');
    if (motif.test(chemin)) for (const { key, value } of r.headers) h[key] = value;
  }
  delete h['Strict-Transport-Security'];
  return h;
}

export function demarrer(port = 0) {
  const serveur = http.createServer((req, res) => {
    let chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const original = chemin;
    const m = /^\/m\/([^/]+)$/.exec(chemin);
    if (m) chemin = '/hommage.html';
    let fichier = normalize(join(RACINE, chemin));
    if (!fichier.startsWith(RACINE)) { res.writeHead(403); return res.end(); }
    if (existsSync(fichier) && statSync(fichier).isDirectory()) fichier = join(fichier, 'index.html');
    if (!existsSync(fichier) && existsSync(fichier + '.html')) fichier += '.html';
    if (!existsSync(fichier)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
    const h = Object.assign({ 'Content-Type': TYPES[extname(fichier)] || 'application/octet-stream' }, entetes(original));
    res.writeHead(200, h);
    res.end(readFileSync(fichier));
  });
  return new Promise((ok) => serveur.listen(port, '127.0.0.1', () => ok({ serveur, url: `http://127.0.0.1:${serveur.address().port}` })));
}
