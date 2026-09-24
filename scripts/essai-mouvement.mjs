import { chromium } from '/tmp/claude-0/-home-user-melodia-funebre/605820e2-df31-5713-aaec-63fe19a4e567/scratchpad/node_modules/playwright/index.mjs';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = (c, t) => console.log((c ? '  OK   ' : '  RATÉ ') + t);

async function console_(reducedMotion) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion });
  await ctx.route('**', r => {
    const u = r.request().url();
    if (/fonts\.(googleapis|gstatic)|supabase\.co\/(auth|storage)/.test(u)) return r.abort();
    if (/\/rest\/v1\//.test(u)) {
      const t = new URL(u).pathname.split('/rest/v1/')[1];
      const j = d => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(d) });
      if (t.startsWith('roles')) return j([{ email:'contact@melodia-funebre.fr', role:'master' }]);
      if (t.startsWith('orders')) return j([{ id:1, ref:'MF-1', defunt:'Odette Vasseur', status:'recue',
        price:390, paid:true, offer:'prestige', agence:'Duval', created_at:'2026-09-01T10:00:00Z',
        echeance:'2026-09-30T10:00:00Z', style:'Piano', user_name:'Claire' }]);
      return j([]);
    }
    return r.continue();
  });
  await ctx.addInitScript(() => {
    localStorage.setItem('melodia_session', JSON.stringify({ access_token:'J', user:{ id:'u0', email:'contact@melodia-funebre.fr', user_metadata:{ name:'Maxime' } } }));
    localStorage.setItem('melodia_role', JSON.stringify('master'));
  });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:3100/dashboard-master.html', { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(2500);
  return { ctx, p };
}

/* ─── Mouvement normal ─── */
{
  const { ctx, p } = await console_('no-preference');

  const dur = await p.evaluate(() => {
    const lis = (s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const c = getComputedStyle(e);
      return { d: c.transitionDuration, prop: c.transitionProperty };
    };
    return { nav: lis('.side-item'), carte: lis('.o-row'), tuile: lis('.kpi'), bouton: lis('.dash .btn') };
  });
  const ms = (v) => Math.round(parseFloat(v) * 1000);
  /* On mesure la COULEUR, pas « transform » : sur les éléments en relief
     transform porte le retour d'inclinaison, volontairement lent. */
  const durCouleur = (d) => ms(d.split(',')[d.split(',').length - 3] || d.split(',')[0]);
  ok(ms(dur.nav.d.split(',')[1] || dur.nav.d) <= 160, `navigation, couleur : ${dur.nav.d}`);
  ok(!/\ball\b/.test(dur.nav.prop), `  propriétés nommées, pas « all » : ${dur.nav.prop.slice(0,60)}`);
  ok(ms(dur.carte.d) <= 160, `carte de commande : ${dur.carte.d} (était 0.45s)`);
  ok(/0\.35s/.test(dur.tuile.d), `tuile : ${dur.tuile.d} — le 0,55 s est le retour d'inclinaison, voulu`);

  /* Le retour au clic : on mesure la transformée pendant l'appui. */
  const bouton = p.locator('.dash-main .btn').first();   /* dans le cadre, pas en pied de barre */
  await bouton.scrollIntoViewIfNeeded();
  const boite = await bouton.boundingBox();
  await p.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
  await p.mouse.down();
  await p.waitForTimeout(140);
  const pendant = await bouton.evaluate(e => getComputedStyle(e).transform);
  await p.mouse.up();
  await p.waitForTimeout(220);
  const apres = await bouton.evaluate(e => getComputedStyle(e).transform);
  const echelle = (m) => m && m !== 'none' ? +m.match(/matrix\(([^,]+)/)[1] : 1;
  ok(echelle(pendant) < 0.999, `retour au clic : échelle ${echelle(pendant).toFixed(3)} pendant l'appui`);
  ok(echelle(apres) > 0.999, `  et revient à ${echelle(apres).toFixed(3)} au relâchement`);

  /* L'anneau de focus au clavier. */
  /* « :focus-visible » ne se déclenche pas sur un .focus() programmé :
     le navigateur exige une vraie navigation au clavier. On tabule donc
     jusqu'à tomber sur un élément de menu, au lieu de compter les
     tabulations à l'aveugle — leur nombre dépend du rendu. */
  await p.evaluate(() => document.body.focus());
  let trouve = false;
  for (let i = 0; i < 12 && !trouve; i++) {
    await p.keyboard.press('Tab');
    trouve = await p.evaluate(() => !!document.activeElement.closest('.side-item'));
  }
  const anneau = await p.evaluate(() => {
    const e = document.activeElement;
    const c = getComputedStyle(e);
    return { quoi: e.className || e.tagName, largeur: c.outlineWidth, style: c.outlineStyle, couleur: c.outlineColor };
  });
  ok(parseFloat(anneau.largeur) >= 2 && anneau.style !== 'none',
     `focus clavier visible sur « ${String(anneau.quoi).slice(0,26)} » : ${anneau.largeur} ${anneau.style}`);
  await ctx.close();
}

/* ─── Mouvement réduit ─── */
{
  const { ctx, p } = await console_('reduce');
  const d = await p.evaluate(() => getComputedStyle(document.querySelector('.side-item')).transitionDuration);
  ok(parseFloat(d) < 0.002, `mouvement réduit respecté : navigation à ${d}`);
  const bouton = p.locator('.dash-main .btn').first();   /* dans le cadre, pas en pied de barre */
  await bouton.scrollIntoViewIfNeeded();
  const b = await bouton.boundingBox();
  await p.mouse.move(b.x + b.width/2, b.y + b.height/2);
  await p.mouse.down(); await p.waitForTimeout(120);
  const t = await bouton.evaluate(e => getComputedStyle(e).transform);
  await p.mouse.up();
  ok(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)', `  et aucun enfoncement : transform = ${t}`);
  await ctx.close();
}
await nav.close();
