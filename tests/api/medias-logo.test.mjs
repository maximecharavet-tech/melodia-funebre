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
