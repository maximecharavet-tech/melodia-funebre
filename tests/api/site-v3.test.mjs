// Garde-fous v3 (12/11/2026) : promesses commerciales, marque blanche, données
// structurées, feuille minifiée. Lancé par « npm test ».
//
// Ce test lit les fichiers tels qu'ils seraient servis : il ne dépend ni du
// réseau ni d'un navigateur. Les fins de ligne sont normalisées (poste Windows).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RACINE = fileURLToPath(new URL('../../', import.meta.url));
const lire = (f) => readFileSync(join(RACINE, f), 'utf8').replace(/\r\n/g, '\n');

// ─── Ce qui part en ligne : tout, sauf ce que .vercelignore écarte ───
const ECARTES = ['.git', 'node_modules', 'archive', 'build', 'scripts', '.github', 'supabase', '.claude',
  'docs', 'tests', 'apps', 'melodia-pro-wasm', 'console-julie-wasm', 'art', 'lib', 'api', '.vercel'];
const TEXTE = /\.(html|js|mjs|css|json|txt|webmanifest|xml|svg)$/i;
function servis(dossier = RACINE, acc = []) {
  for (const nom of readdirSync(dossier)) {
    const abs = join(dossier, nom);
    const rel = relative(RACINE, abs).split(sep).join('/');
    if (ECARTES.includes(rel.split('/')[0])) continue;
    if (!rel.includes('/') && rel.endsWith('.md')) continue; // « /*.md » ignoré
    const st = statSync(abs);
    if (st.isDirectory()) servis(abs, acc);
    else if (TEXTE.test(nom) && st.size < 3_000_000) acc.push(rel);
  }
  return acc;
}
const FICHIERS = servis();
const PAGES = readdirSync(RACINE).filter((f) => f.endsWith('.html'));

test('marque blanche : aucun nom de fournisseur dans les fichiers servis', () => {
  // three.js (vendor) emploie « gamma » au sens colorimétrique : seul ce mot y est toléré.
  const fautes = [];
  for (const f of FICHIERS) {
    const t = lire(f);
    if (/mureka|mistral|openai|higgsfield/i.test(t)) fautes.push(f);
    else if (!f.startsWith('assets/js/vendor/') && /\bgamma\b/i.test(t)) fautes.push(f + ' (gamma)');
  }
  assert.deepEqual(fautes, []);
});

test('code maître : jamais écrit dans le dépôt, ni côté client ni côté serveur', () => {
  const motif = new RegExp(['MASTER', 'MAX'].join('\\s*'), 'i');
  const fautes = [];
  const tout = (d) => {
    for (const nom of readdirSync(d)) {
      if (nom === '.git' || nom === 'node_modules' || nom === 'target') continue;
      const abs = join(d, nom);
      const st = statSync(abs);
      if (st.isDirectory()) tout(abs);
      else if (TEXTE.test(nom) || /\.(md|cjs|sql|rs|toml|sh)$/.test(nom)) {
        if (st.size < 3_000_000 && motif.test(readFileSync(abs, 'utf8'))) fautes.push(relative(RACINE, abs));
      }
    }
  };
  tout(RACINE);
  assert.deepEqual(fautes, []);
});

test('le client ne lit aucun réglage secret', () => {
  const fautes = FICHIERS.filter((f) => /PRO_CODE_MAITRE|PRO_EMPREINTE_SEL|STRIPE_SECRET|SERVICE_ROLE_KEY|STRIPE_WEBHOOK_SECRET/.test(lire(f)));
  assert.deepEqual(fautes, []);
});

test('repli tiers des paroles retiré du script public', () => {
  assert.doesNotMatch(lire('assets/js/auth.js'), /text\.pollinations|_lyricsPollinations/);
});

test('promesse agence : l’essai est décrit tel qu’il existe dans /pro', () => {
  for (const f of ['index.html', 'offres.html', 'professionnels.html', 'rejoindre.html', 'llms.txt']) {
    const t = lire(f);
    assert.doesNotMatch(t, /premi[eè]re (composition|œuvre)[^.<]{0,20}offerte|composition est offerte/i, f);
  }
  const pro = lire('professionnels.html');
  assert.match(pro, /deux minutes trente|2 min 30/);
  assert.match(pro, /href="\/pro\?demo=1"/);
});

test('aucun avis fabriqué : ni note, ni témoignage d’agence anonyme, ni aggregateRating', () => {
  for (const f of PAGES) {
    const t = lire(f);
    assert.doesNotMatch(t, /aggregateRating|"@type":\s*"Review"/, f);
    assert.doesNotMatch(t, /testi-stars|étoiles sur 5/, f);
    assert.doesNotMatch(t, /Directeur d'agence de pompes funèbres — Lyon/, f);
  }
  assert.doesNotMatch(lire('assets/js/content.js'), /testi-stars/);
});

test('prix publics : 149 / 299 / 499 €, et le partage 60/40 affiché en découle', () => {
  const blocs = [...lire('offres.html').matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .flatMap((b) => (Array.isArray(b) ? b : [b]))
    .flatMap((b) => (b['@graph'] ? b['@graph'] : [b]));
  const prix = blocs.filter((b) => b['@type'] === 'Service').flatMap((b) => b.offers || []).map((o) => o.price).sort();
  assert.deepEqual(prix, ['149', '299', '499']);
  const pro = lire('professionnels.html');
  for (const p of [149, 299, 499]) {
    const agence = (p * 0.6).toFixed(2).replace('.', ',');
    const maison = (p * 0.4).toFixed(2).replace('.', ',');
    // La génération pose une espace insécable avant « € » : on accepte toutes les espaces.
    assert.match(pro, new RegExp(agence + '[\\s\\u00a0\\u202f]€'), `part agence ${agence} € absente`);
    assert.match(pro, new RegExp(maison + '[\\s\\u00a0\\u202f]€'), `part maison ${maison} € absente`);
  }
  // Aucun autre tarif famille que les trois publics dans le comparatif.
  assert.doesNotMatch(lire('offres.html'), /Le plus choisi/);
});

test('données structurées : chaque bloc JSON-LD des pages se lit', () => {
  for (const f of PAGES) {
    for (const m of lire(f).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(m[1]), f);
    }
  }
});

test('pages clés : titre, description, canonique et aperçu social complets', () => {
  for (const f of ['index.html', 'offres.html', 'professionnels.html', 'demos.html', 'processus.html']) {
    const t = lire(f);
    const titre = /<title>([^<]+)<\/title>/.exec(t);
    assert.ok(titre && titre[1].length <= 70, f + ' : titre');
    const desc = /<meta name="description" content="([^"]+)"/.exec(t);
    assert.ok(desc && desc[1].length >= 70 && desc[1].length <= 170, f + ' : description ' + (desc && desc[1].length));
    assert.match(t, /<link rel="canonical" href="https:\/\/melodia-funebre\.fr/, f);
    const og = /<meta property="og:image" content="https:\/\/melodia-funebre\.fr\/([^"?]+)/.exec(t);
    assert.ok(og && existsSync(join(RACINE, og[1])), f + ' : og:image');
  }
});

test('barre du pouce : elle suit le public de la page', () => {
  const barre = (f) => (/<div class="sticky-cta">([\s\S]*?)<\/div>/.exec(lire(f)) || [])[1] || '';
  assert.match(barre('professionnels.html'), /\/pro\?demo=1/);
  assert.doesNotMatch(barre('professionnels.html'), />Commander</);
  assert.match(barre('offres.html'), /href="#commander"/);
  assert.match(barre('index.html'), /href="\/offres"/);
});

test('tunnel familles : portrait facultatif, régler après l’entretien à égalité', () => {
  const o = lire('offres.html');
  assert.match(o, /data-wz-goto="4"/);
  assert.match(o, /for="o-traits">Trois traits de caractère</);
  assert.match(o, /id="o-submit"[^>]*data-act="sendOrder"/);
  assert.match(o, /id="paypal-zone"/);
  assert.doesNotMatch(lire('assets/js/order.js'), /Trois mots suffisent/);
});

test('feuille minifiée : à jour, chargée par les pages générées', () => {
  const { minifier, ENTETE } = require(join(RACINE, 'build/css-min.js'));
  const attendu = ENTETE + minifier(lire('assets/css/style.css'));
  assert.equal(lire('assets/css/style.min.css'), attendu, 'relancer « node build/build.js »');
  for (const f of ['index.html', 'offres.html', 'professionnels.html']) {
    assert.match(lire(f), /href="\/assets\/css\/style\.min\.css\?v=[a-f0-9]+"/, f);
  }
});

test('minificateur : chaînes, url() et calc() intacts', () => {
  const { minifier } = require(join(RACINE, 'build/css-min.js'));
  assert.equal(minifier('a { content: "x  /* y */  z" ; }'), 'a{content: "x  /* y */  z"}\n');
  assert.equal(minifier('b { width: calc(100% - 2rem + 1px) ; }'), 'b{width: calc(100% - 2rem + 1px)}\n');
  assert.equal(minifier('c { background: url(  ../img/a b.png ) }'), 'c{background: url(  ../img/a b.png )}\n');
  assert.equal(minifier('/* t */ .d :hover , .e > .f { color: red }'), '.d :hover,.e>.f{color: red}\n');
  assert.equal(minifier('@media (max-width: 600px) { .g { top: 0 } }'), '@media (max-width: 600px){.g{top: 0}}\n');
});

test('redirection courte /demo vers la démonstration', () => {
  const v = JSON.parse(lire('vercel.json'));
  const r = v.redirects.find((x) => x.source === '/demo');
  assert.ok(r && r.destination === '/pro?demo=1' && r.permanent === false);
  assert.deepEqual(v.regions, ['cdg1']);
});
