/* Recalcule les empreintes ?v= des actifs locaux dans les pages HTML racine.
   Usage : node scripts/empreintes.js [page.html …] (défaut : toutes). */
const fs = require('fs');
const crypto = require('crypto');
const pages = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync('.').filter((f) => f.endsWith('.html'));
for (const f of pages) {
  const avant = fs.readFileSync(f, 'utf8');
  const apres = avant.replace(/\/(assets\/(?:css|js|img)\/[a-z0-9./_-]+)\?v=([a-f0-9]+)/gi, (m, actif, v) => {
    if (!fs.existsSync(actif)) return m;
    return '/' + actif + '?v=' + crypto.createHash('sha1').update(fs.readFileSync(actif)).digest('hex').slice(0, 8);
  });
  if (apres !== avant) { fs.writeFileSync(f, apres); console.log('empreintes mises à jour : ' + f); }
}
