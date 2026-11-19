// Logo officiel dans « Générer un visuel Melodia » : zone réservée dans la demande, et pose robuste
// (voile sous le logo si le fond est agité ou clair, pastille d'origine sur fond clair, proportions exactes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import * as M from '../../api/_medias.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('demande : la zone du logo est réservée pour chaque format, sujet plus bas', () => {
  for (const f of ['post', 'story', 'banniere']) {
    const d = M.composerDemande(M.lireChoix({ texte: 'des lys blancs dans un vase', format: f }));
    assert.ok(d.includes(M.compositionLogo(f)), f);
    assert.match(d, /Reserved logo zone: .* must stay completely empty/);
    assert.match(d, /no flowers, no petals/);
    assert.ok(d.endsWith(M.INTERDITS));
  }
  assert.match(M.compositionLogo('post'), /top 34%/);
  assert.match(M.compositionLogo('story'), /top 30%/);
  assert.match(M.compositionLogo('banniere'), /upper-left corner/);
  assert.match(M.compositionLogo('post'), /centred lower/);
  // avec un style artistique aussi
  assert.match(M.composerDemande(M.lireChoix({ texte: 'des lys', format: 'post', style: 'aquarelle' })), /Reserved logo zone/);
});

/* La console chargée dans un bac à sable, avec une toile factice : getImageData rend le fond voulu,
   et chaque dessin est noté. */
function console_() {
  const fenetre = { MelodiaJulie: { esc: String, entetes: () => ({}) }, MelodiaConsole: { ajouterVue() {}, courante: () => '' }, location: { hash: '', origin: 'x' } };
  vm.runInNewContext(readFileSync(join(RACINE, 'assets/js/julie/julie-medias.js'), 'utf8'), { window: fenetre, location: fenetre.location, Math, Number, String, JSON, Array, Object });
  return fenetre.MelodiaJulieMedias;
}
function toile(lum, partClairs) {
  const journal = [];
  let voiles = 0;
  const ctx = {
    journal,
    getImageData(x, y, w, h) {
      const n = Math.max(1, Math.round(w)) * Math.max(1, Math.round(h)) * 4, d = new Uint8ClampedArray(n);
      // après un voile sombre, le fond est assombri (simple modèle)
      const f = voiles ? 0.04 : 1;
      for (let i = 0, k = 0; i < n; i += 4, k++) {
        const v = Math.round(255 * ((k % 100) < partClairs * 100 ? 0.95 : lum) * f);
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      return { data: d };
    },
    save() {}, restore() {}, translate() {}, scale() {}, beginPath() {}, closePath() {}, clip() { journal.push('clip'); }, fill() { journal.push('pastille'); }, roundRect() {}, rect() {},
    createRadialGradient() { return { addColorStop(o, c) { journal.push('voile ' + c); } }; },
    fillRect() { if (String(this.fillStyle).startsWith('#')) journal.push('fond ' + this.fillStyle); else voiles++; },
    drawImage(img, x, y, w, h) { journal.push({ op: this.globalCompositeOperation || 'source-over', w, h }); },
    set globalCompositeOperation(v) { this._g = v; }, get globalCompositeOperation() { return this._g; }
  };
  return ctx;
}
const LOGO = { naturalWidth: 1600, naturalHeight: 1590 };

test('fond sombre agité (bouquet sous le logo) : voile fort puis logo en « écran », proportions exactes', () => {
  const C = console_();
  for (const [f, W, H] of [['post', 1080, 1080], ['story', 1080, 1920], ['banniere', 1920, 1080]]) {
    const x = toile(0.03, 0.2);
    const r = C.poserLogo(x, W, H, LOGO, 'haut', f);
    assert.equal(r.variante, 'clair', f); assert.equal(r.agite, true);
    assert.ok(r.voile >= 0.9, 'voile fort : ' + r.voile);
    const d = x.journal.filter((e) => typeof e === 'object');
    assert.equal(d.length, 1); assert.equal(d[0].op, 'screen');
    assert.equal(d[0].w, r.l); assert.equal(d[0].h, Math.round(r.l * 1590 / 1600), 'proportions d’origine');
  }
});

test('fond sombre calme : voile léger, logo en « écran »', () => {
  const r = console_().poserLogo(toile(0.04, 0), 1080, 1080, LOGO, 'haut', 'post');
  assert.equal(r.variante, 'clair'); assert.equal(r.agite, false); assert.equal(r.voile, 0.55);
});

test('fond clair : pastille noire d’origine, halo ivoire si le fond est chargé', () => {
  const x = toile(0.8, 0.5);
  const r = console_().poserLogo(x, 1080, 1080, LOGO, 'haut', 'post');
  assert.equal(r.variante, 'sombre');
  assert.ok(x.journal.includes('pastille') && x.journal.includes('clip'));
  assert.ok(x.journal.some((e) => typeof e === 'string' && e.startsWith('voile rgba(244,241,234')), 'halo ivoire');
  const d = x.journal.filter((e) => typeof e === 'object');
  assert.equal(d.length, 1); assert.notEqual(d[0].op, 'screen');
});

test('fond moyen et coloré (beaucoup de points clairs) : pastille, sans halo ivoire', () => {
  const x = toile(0.12, 0.32);
  const r = console_().poserLogo(x, 1920, 1080, LOGO, 'haut', 'banniere');
  assert.equal(r.variante, 'sombre');
  assert.ok(x.journal.includes('pastille'));
  assert.ok(!x.journal.some((e) => typeof e === 'string' && e.startsWith('voile rgba(244')));
});

test('demande : jamais plus de 2000 caractères (limite du moteur), zone du logo et interdits jamais coupés', () => {
  for (const s of ['', ...M.STYLES.map((x) => x.id)]) for (const n of [1, 2, 3]) for (const f of ['post', 'story', 'banniere']) for (const c of ['', ...M.IDEES.map((i) => i.id)]) {
    const d = M.composerDemande({ texte: 'des lys blancs '.repeat(30).slice(0, 400), format: f, carte: c, style: s, intensite: n });
    assert.ok(d.length <= 2000, `${s}/${n}/${f}/${c} : ${d.length}`);
    assert.ok(d.includes(M.compositionLogo(f)) && d.endsWith(M.INTERDITS));
  }
});

/* v2 « bandeau » : le logo repose sur un fond uni, quelle que soit l'image du moteur. */
test('bandeau v2 : le logo tient dans le bandeau uni et le sujet commence en dessous (ou à côté)', () => {
  const C = console_();
  const ratio = LOGO.naturalHeight / LOGO.naturalWidth;
  const cas = [
    ['post', 1080, 1080, 1024, 1024], ['story', 1080, 1920, 736, 1312], ['banniere', 1920, 1080, 1312, 736],
    ['post', 1080, 1080, 1312, 736], ['story', 1080, 1920, 1024, 1024]
  ];
  for (const [f, W, H, iw, ih] of cas) {
    for (const bords of [{ haut: 0, gauche: 0, bas: 1 }, { haut: 0.18, gauche: 0.08, bas: 0.9 }, { haut: 0.4, gauche: 0.3, bas: 0.95 }]) {
      const P = C.plan(W, H, ratio, bords, iw, ih, H * 0.84);
      const L = P.logo, nom = f + ' ' + JSON.stringify(bords) + ' ' + iw + 'x' + ih;
      assert.ok(L.x >= 0 && L.y >= 0 && L.x + L.l <= W && L.y + L.h <= H, 'logo dans le cadre : ' + nom);
      if (P.large) {
        assert.ok(L.x + L.l <= P.bande, 'logo dans le bandeau gauche : ' + nom);
        assert.ok(P.scene.x + bords.gauche * P.scene.w >= P.bande - 1, 'sujet à droite du bandeau : ' + nom);
      } else {
        assert.ok(L.y + L.h <= P.bande, 'logo dans le bandeau haut : ' + nom);
        assert.ok(P.scene.y + bords.haut * P.scene.h >= P.bande - 1, 'sujet sous le bandeau : ' + nom);
      }
    }
  }
});

test('bandeau v2 : plus de voile local sous le logo ; ton de fond tiré de la scène, assombri pour l’or', () => {
  const js = readFileSync(join(RACINE, 'assets/js/julie/julie-medias.js'), 'utf8');
  const corps = js.slice(js.indexOf('function composer('), js.indexOf('function couperN('));
  assert.doesNotMatch(corps, /voile\(|poserLogo\(/, 'composer ne pose plus de voile local');
  const C = console_();
  const px = { w: 10, h: 10, d: new Uint8ClampedArray(400).fill(60) };
  for (let i = 3; i < 400; i += 4) px.d[i] = 255;
  const t = C.tonScene(px);
  assert.equal(t.sombre, true); assert.ok(t.lum <= 0.0601, 'ton ≤ 6 % : ' + t.lum);
  assert.equal(C.tonScene(null).sombre, true);
});
