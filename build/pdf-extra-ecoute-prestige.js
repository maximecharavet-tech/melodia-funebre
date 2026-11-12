/* MELODIA — Plaquette « Écoutez » prestige (7 pages A4).
   Complète build/pdf-ecoute.js (catalogue exhaustif) : ici, six musiques mises en scène avec leur
   disque d'or (CSS du site, haute résolution), un extrait de paroles, le lien et le QR d'écoute.
   Titres, prénoms, styles et paroles viennent de assets/data/content.json. « Composé par Melodia Funèbre ». */
const { enveloppe, versoCarte, qr, img, esc, disque, catalogue, SITE, SITE_COURT } = require('./pdf-extra-commun.js');
const fs = require('fs');
const path = require('path');

const norm = t => String(t).replace(/['’]/g, '').toLowerCase();

function html(d) {
  const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets/data/content.json'), 'utf8'));
  const cat = catalogue();
  const brut = (c.demos || []).filter(x => x && x.visible !== false && x.audio && x.title);
  const riche = t => {
    const u = cat.find(x => norm(x.titre) === norm(t));
    const b = brut.find(x => norm(x.title) === norm(t));
    return u && b ? Object.assign({}, u, { brief: b.brief || '', paroles: String(b.lyrics || '').split('\n').slice(0, 2).join(' / ') }) : null;
  };
  const choix = ['Le roi de la route', 'Constantine dans ton cœur', 'Jusqu’au jour où l’on se retrouve', 'Sous le lierre', 'Saudade noite', 'Le jardin du temps']
    .map(riche).filter(Boolean);
  const initiale = m => (m.qui || m.titre).trim().charAt(0).toUpperCase();

  const couv = `<section class="page">
    <img class="plein" src="${img('visuel-piano-lac.jpg')}" alt="Piano au bord de l’eau, lumière dorée">
    <div class="degrade-bas" style="height:175mm;"></div>
    <div style="position:absolute;left:0;right:0;bottom:92mm;display:flex;justify-content:center;">${disque('M', 230)}</div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm;text-align:center;">
      <p class="surtitre">Plaquette d’écoute · Exemples publiés sur le site</p>
      <h1 style="margin-top:5mm;font-size:38pt;">Chaque souvenir <em>mérite sa musique.</em></h1>
      <p class="surtitre" style="margin-top:6mm;color:#8a7a46;">Composé par Melodia Funèbre · ${SITE_COURT}/ecouter</p>
    </div></section>`;

  const p2 = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">Comment naît une musique</p><p class="surtitre sourd">02</p></div><div class="filet-or"></div>
    <div style="display:flex;gap:11mm;">
      <div style="flex:1;">
        <h2>Elle commence par <em>quelques phrases.</em></h2>
        <p style="margin-top:6mm;">Un prénom, un métier, une manie, un dimanche. La famille raconte en cinq minutes ; nous écrivons des paroles biographiques uniques, puis nous composons une œuvre originale de deux à trois minutes, relue par une personne avant d’être livrée.</p>
        <p style="margin-top:4mm;">Chaque musique de cette plaquette est <strong class="ivoire">composée par Melodia Funèbre</strong> à partir de ce qu’une famille a raconté. Elles sont publiées sur le site : vous pouvez les entendre avant de décider.</p>
        <div style="margin-top:10mm;display:flex;justify-content:center;">${disque('M', 260)}</div>
        <p class="fine" style="text-align:center;margin-top:5mm;">Le disque d’or de Melodia Funèbre</p>
        <div class="carte2" style="margin-top:12mm;display:flex;gap:6mm;align-items:center;padding:5mm;">${qr(SITE + '/ecouter', 24, 'QR code vers les pages d’écoute')}<div><h3 style="font-size:12pt;white-space:nowrap;">Écouter en ligne</h3><p style="font-size:7.6pt;white-space:nowrap;"><a href="${SITE}/ecouter">${SITE_COURT}/ecouter</a></p></div></div>
      </div>
      <div class="cadre-photo" style="width:96mm;flex:none;align-self:flex-start;margin-top:2mm;"><img style="height:auto;object-fit:contain" src="${img('visuel-souvenirs-violon.jpg')}" alt="Affiche « Des souvenirs qui résonnent toujours » : un violoniste au coucher du soleil"></div>
    </div>
  </div></section>`;

  const fiche = (m, n) => `<div class="carte2" style="padding:7mm;display:flex;flex-direction:column;gap:5mm;height:100%;">
      <div style="display:flex;gap:8mm;align-items:center;">
        ${disque(initiale(m), 150)}
        <div style="flex:1;">
          <p class="num">${String(n).padStart(2, '0')}</p>
          <h3 style="font-size:20pt;line-height:1.12;margin:1.5mm 0;">${esc(m.titre)}</h3>
          <p style="font-size:9.6pt;">${esc(m.qui)}</p>
          <p class="surtitre" style="margin-top:2mm;">${esc(m.style)}</p>
          ${m.brief ? `<p style="font-size:8.6pt;color:#9a927e;margin-top:1.5mm;">${esc(m.brief)}</p>` : ''}
        </div>
      </div>
      ${m.paroles ? `<p style="font-family:var(--ff-d);font-style:italic;font-size:15pt;line-height:1.5;color:#e7e2d6;border-left:.5mm solid #c9a84c;padding-left:5mm;">«&nbsp;${esc(m.paroles)}&nbsp;»</p>` : ''}
      <div style="display:flex;gap:6mm;align-items:center;margin-top:auto;">
        ${qr(m.url, 30, 'QR code vers la page d’écoute de ' + m.titre)}
        <div><p class="surtitre" style="margin-bottom:1.5mm;">Écouter</p><p style="font-size:9pt;"><a href="${esc(m.url)}">${esc(m.url.replace('https://', ''))}</a></p><p class="fine" style="margin-top:1mm;">Composé par Melodia Funèbre</p></div>
      </div></div>`;
  const pagesMus = [];
  for (let i = 0; i < choix.length; i += 2) {
    pagesMus.push(`<section class="page"><div class="cadre"></div><div class="dedans">
      <div class="tete"><p class="surtitre">La sélection</p><p class="surtitre sourd">0${3 + i / 2}</p></div><div class="filet-or"></div>
      <div style="display:grid;grid-template-rows:1fr 1fr;gap:7mm;height:244mm;">${choix.slice(i, i + 2).map((m, k) => fiche(m, i + k + 1)).join('')}</div>
    </div></section>`);
  }

  const col = (a) => a.map(m => `<li style="padding:2.3mm 0;border-bottom:.2mm solid rgba(201,168,76,.18);"><a href="${esc(m.url)}" style="color:#f4f1ea;font-size:9.4pt;">${esc(m.titre)}</a><span class="surtitre" style="display:block;font-size:5.8pt;margin-top:.6mm;">${esc(m.style)}</span></li>`).join('');
  const moitie = Math.ceil(cat.length / 2);
  const pIndex = `<section class="page"><div class="cadre"></div><div class="dedans">
    <div class="tete"><p class="surtitre">Toutes les musiques</p><p class="surtitre sourd">06</p></div><div class="filet-or"></div>
    <h2 class="moyen">Les ${cat.length} pages d’écoute.</h2>
    <p style="margin-top:3mm;">Chaque titre est cliquable et ouvre sa page d’écoute.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 9mm;margin-top:6mm;"><ul>${col(cat.slice(0, moitie))}</ul><ul>${col(cat.slice(moitie))}</ul></div>
    <div class="carte2" style="margin-top:8mm;display:flex;gap:8mm;align-items:center;">${qr(SITE + '/ecouter', 30, 'QR code vers toutes les pages d’écoute')}
      <div><h3>Tout le catalogue en ligne</h3><p><a href="${SITE}/ecouter">${SITE_COURT}/ecouter</a></p></div></div>
  </div></section>`;

  return enveloppe('Melodia Funèbre — Plaquette Écoutez (prestige)',
    couv + p2 + pagesMus.join('') + pIndex + versoCarte({ titre: 'Faire entendre, <em>d’abord.</em>', chapeau: 'Pour recevoir d’autres exemples ou présenter l’offre à votre équipe : Julie Serve vous répond.', n: '07' }));
}
module.exports = { html, fichier: 'melodia-plaquette-ecoute-prestige.pdf' };
