#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   MELODIA — Serveur local accessible depuis le réseau Wi-Fi
   Usage : npm run dev:lan   (ou : node scripts/serve-lan.js 3000)

   Sert le site sur toutes les interfaces réseau et affiche l'adresse
   à saisir dans le navigateur du téléphone. Reproduit le comportement
   de Vercel : cleanUrls (/processus → processus.html) et requêtes
   Range (lecture et avance rapide des MP3 / MP4 sur mobile).
   Aucune dépendance : Node seul suffit.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2] || process.env.PORT || 3000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

/* Empêche de sortir du dossier du site via ../ dans l'URL */
function resolveSafe(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const target = path.resolve(ROOT, '.' + path.posix.normalize(clean));
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null;
  return target;
}

/* cleanUrls : /processus et /processus/ mènent à processus.html */
function findFile(target) {
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const idx = path.join(target, 'index.html');
    if (fs.existsSync(idx)) return idx;
  }
  const withExt = target + '.html';
  if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) return withExt;
  return null;
}

const server = http.createServer((req, res) => {
  const target = resolveSafe(req.url === '/' ? '/index.html' : req.url);
  const file = target && findFile(target);

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1><p>Page introuvable — <a href="/">retour à l\'accueil</a></p>');
    console.log('  404  ' + req.url);
    return;
  }

  const stat = fs.statSync(file);
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;

  /* Requête Range : lecture et avance rapide de l'audio / vidéo sur mobile */
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      let start = m[1] ? parseInt(m[1], 10) : 0;
      let end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
      if (isNaN(start) || isNaN(end) || start > end || end >= stat.size) {
        res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size });
        res.end();
        return;
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.size,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(file, { start, end }).pipe(res);
      console.log('  206  ' + req.url);
      return;
    }
  }

  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(file).pipe(res);
  console.log('  200  ' + req.url);
});

/* Adresses IPv4 du réseau local, à saisir sur le téléphone */
function lanAddresses() {
  const out = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) out.push({ name, address: net.address });
    }
  }
  return out;
}

server.listen(PORT, '0.0.0.0', () => {
  const addrs = lanAddresses();
  console.log('\n  ♪ Melodia Funèbre — serveur local\n');
  console.log('  Sur cet ordinateur :  http://localhost:' + PORT);
  if (addrs.length) {
    console.log('\n  Depuis votre téléphone (même réseau Wi-Fi) :');
    addrs.forEach((a) => console.log('    http://' + a.address + ':' + PORT + '   (' + a.name + ')'));
  } else {
    console.log('\n  Aucune interface réseau détectée : le téléphone ne pourra pas se connecter.');
  }
  console.log('\n  Ctrl+C pour arrêter.\n');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('\n  Le port ' + PORT + ' est déjà utilisé.');
    console.error('  Essayez un autre port :  node scripts/serve-lan.js 3001\n');
    process.exit(1);
  }
  throw e;
});
