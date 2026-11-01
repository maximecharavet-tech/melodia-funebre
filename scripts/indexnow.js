#!/usr/bin/env node
/* Soumet toutes les adresses de sitemap.xml à IndexNow (Bing, Yandex, Seznam…).
   Usage : npm run indexnow  (ou node scripts/indexnow.js --dry pour lister sans envoyer) */
'use strict';
const fs = require('fs');
const path = require('path');

const HOST = 'melodia-funebre.fr';
const KEY = 'baf5658c2b4874f8a74526f84dce3854';
const KEY_LOCATION = 'https://' + HOST + '/' + KEY + '.txt';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const xml = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
const urlList = [...new Set([...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]))]
  .filter((u) => new URL(u).hostname === HOST);

if (!urlList.length) { console.error('Aucune adresse trouvée dans sitemap.xml'); process.exit(1); }
console.log(urlList.length + ' adresse(s) à soumettre.');
if (process.argv.includes('--dry')) { urlList.forEach((u) => console.log('  ' + u)); process.exit(0); }

(async () => {
  for (let i = 0; i < urlList.length; i += 10000) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urlList.slice(i, i + 10000) }),
    });
    console.log('IndexNow : HTTP ' + res.status + ' ' + res.statusText);
    if (res.status !== 200 && res.status !== 202) { console.error(await res.text()); process.exit(1); }
  }
})().catch((e) => { console.error(e); process.exit(1); });
