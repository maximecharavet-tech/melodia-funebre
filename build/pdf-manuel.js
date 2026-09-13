/* ═══════════════════════════════════════════════════════════════
   MELODIA — Le manuel de vente du collaborateur

   Rien n'est écrit ici. Tout est lu dans assets/js/commercial-contenu.js,
   c'est-à-dire dans le contenu que la console affiche déjà au
   collaborateur : le script téléphonique, les objections, le plan de
   prospection, les modèles de courriel, les chiffres.

   C'est le point : un manuel recopié à la main diverge de l'écran au
   bout de trois semaines, et le jour où le tarif bouge, le
   collaborateur lit un chiffre faux en pleine négociation. Ici, une
   correction dans la console se retrouve dans le PDF au prochain
   « npm run pdf ».

   Le document est mis en page à l'ivoire, en flux, avec des sauts de
   page automatiques : il s'imprime en noir et blanc, se glisse dans
   une sacoche et s'annote au stylo pendant un appel.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { fontes, image, CLAIR } = require('./pdf-style.js');

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Le contenu de la console, lu tel quel. Le fichier est un IIFE qui
   pose window.MELODIA_VENTE : on lui fournit un « window » et on
   récupère ce qu'il y accroche. Aucune copie, aucune traduction. */
function venteDeLaConsole() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'assets/js/commercial-contenu.js'), 'utf8');
  const faux = {};
  new Function('window', src)(faux);
  if (!faux.MELODIA_VENTE) throw new Error('commercial-contenu.js n’expose plus MELODIA_VENTE');
  return faux.MELODIA_VENTE;
}

const FLUX = `
  /* Le manuel coule d'une page à l'autre : c'est Chromium qui coupe,
     et l'on se contente de lui interdire de couper au mauvais endroit. */
  @page { size: A4; margin: 20mm 16mm 18mm; }
  @page :first { margin: 0; }

  .couv { background: #040407; color: #f4f1ea; height: 297mm; padding: 20mm 18mm;
          display: flex; flex-direction: column; break-after: page; }
  .couv h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 40pt; line-height: 1.04; color: #f4f1ea; }
  .couv h1 em { color: #c9a84c; }
  .couv p { color: #c4bba6; }
  .couv .surtitre { color: #c9a84c; }

  section.part { break-before: page; }
  section.part:first-of-type { break-before: auto; }

  .titre-part { margin-bottom: 8mm; }
  .titre-part hr { width: 26mm; margin: 3mm 0 5mm; }

  /* Les coupes de page : un titre seul en bas de feuille et une
     réponse qui commence à la suivante rendent le manuel pénible à
     suivre en plein appel. On interdit donc la coupe dans un bloc, et
     la coupe juste après un titre. */
  h2, h3, .titre-part { break-after: avoid; }
  p { orphans: 3; widows: 3; }

  .bloc { break-inside: avoid; margin-bottom: 5mm; }
  /* Une citation de fin de section, seule sur sa feuille, gaspille une
     page et perd son effet : elle conclut ce qui précède, elle reste
     donc avec lui. */
  .conclut { break-before: avoid; }
  .rang { display: grid; grid-template-columns: 1fr auto; gap: 4mm; align-items: baseline;
          padding: 2.6mm 0; border-bottom: 1px solid #e8e2d2; break-inside: avoid; }
  .rang b { font-weight: 400; font-size: 9.2pt; color: #3a362c; }
  .rang span { font-family: 'Jetbrains Mono', monospace; font-size: 8.6pt; color: #8a6f26; letter-spacing: .04em; }

  .etiquette { font-family: 'Jetbrains Mono', monospace; font-size: 6.6pt; letter-spacing: .2em;
               text-transform: uppercase; color: #9a8a5c; }
  .puces li { position: relative; padding-left: 6mm; margin-bottom: 2.2mm; font-size: 9.2pt;
              line-height: 1.6; color: #3a362c; break-inside: avoid; }
  .puces li::before { content: '—'; position: absolute; left: 0; color: #c9a84c; }

  .dire { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 12.5pt; line-height: 1.5;
          font-style: italic; color: #17150f; }
  .ligne-or { border-left: 2px solid #c9a84c; padding-left: 5mm; }
`;

/* ═══ LES PARTIES ═══ */

function couverture() {
  return `<div class="couv">
    <img src="${image('assets/img/logo-melodia-complet.jpg')}" alt="Melodia Funèbre"
         style="width:40mm;height:40mm;object-fit:contain;mix-blend-mode:screen;">
    <div style="margin-top:auto;">
      <div class="surtitre">Document interne · Réservé aux collaborateurs</div>
      <hr class="filet" style="width:30mm;margin:4mm 0 6mm;">
      <h1>Manuel<br><em>de vente.</em></h1>
      <p style="margin-top:7mm;font-size:12pt;line-height:1.7;max-width:120mm;">
        Prospecter les pompes funèbres, décrocher le rendez-vous, répondre aux objections,
        signer. Tout ce qui est écrit ici a été éprouvé au téléphone.
      </p>
      <p style="margin-top:8mm;font-family:'Jetbrains Mono',monospace;font-size:7.4pt;
                letter-spacing:.16em;text-transform:uppercase;color:#6b5828;">
        Ce document reprend le contenu de votre console · Il n’est pas destiné à être diffusé
      </p>
    </div>
  </div>`;
}

function chiffres(V, offres, options) {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Ce que vous vendez</div>
      <hr class="filet">
      <h2>Les chiffres <em>à savoir par cœur.</em></h2>
    </div>

    <p>On ne cherche pas une fiche pendant un appel. Ces dix lignes doivent sortir sans hésiter :
    une hésitation sur le tarif coûte la crédibilité de tout le reste.</p>

    <div style="margin-top:6mm;">
      ${V.CHIFFRES.map(([l, v]) => `<div class="rang"><b>${esc(l)}</b><span>${esc(v)}</span></div>`).join('')}
    </div>

    <h3 style="margin-top:9mm;">Les trois offres</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:4mm;">
      ${offres.map(o => `
      <div class="carte" style="text-align:center;">
        <div class="etiquette">${esc(o.name)}</div>
        <div class="chiffre" style="margin-top:2mm;">${o.price} €</div>
        <p style="margin-top:2mm;font-size:8pt;">dont <strong>${Math.round(o.price * 0.6)} €</strong> à l’agence</p>
      </div>`).join('')}
    </div>

    <h3 style="margin-top:9mm;">Les options, que l’on oublie de proposer</h3>
    <p style="margin-top:2mm;">Elles ne se vendent jamais seules : on les propose une fois l’hommage accepté,
    dans la même phrase que la confirmation. C’est le moment où la famille est le plus ouverte.</p>
    <div style="margin-top:4mm;">
      ${options.map(o => `<div class="rang"><b>${esc(o.titre || o.nom || o.id)}</b><span>${o.prix} €</span></div>`).join('')}
    </div>

    <div class="carte ligne-or" style="margin-top:9mm;border:0;">
      <p class="dire">« Un budget d’obsèques se compte en milliers d’euros.
      Notre première offre est à 149 €, dont 89 € vous reviennent. »</p>
      <p style="margin-top:3mm;font-size:8.6pt;">À dire posément, sans s’excuser du prix.
      Celui qui s’excuse d’un tarif vient de le rendre cher.</p>
    </div>
  </section>`;
}

function cibles(V) {
  const P = V.PLAN;
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Le plan de prospection</div>
      <hr class="filet">
      <h2>À qui l’on parle, <em>et dans quel ordre.</em></h2>
    </div>

    ${P.cibles.map(c => `
    <div class="bloc carte">
      <div class="etiquette">${esc(c.priorite)}</div>
      <h3 style="margin-top:2mm;">${esc(c.titre)}</h3>
      <p style="margin-top:2mm;">${esc(c.pourquoi)}</p>
    </div>`).join('')}

    <h3 style="margin-top:8mm;">La séquence, agence par agence</h3>
    <p style="margin-top:2mm;">Six contacts étalés. Ni plus — on devient pénible — ni moins :
    la majorité des accords se décrochent après le troisième.</p>
    <div style="margin-top:4mm;">
      ${P.sequence.map(s => `
      <div class="bloc" style="display:grid;grid-template-columns:20mm 1fr;gap:4mm;
                               padding-bottom:3mm;border-bottom:1px solid #e8e2d2;">
        <span class="etiquette" style="padding-top:1mm;">${esc(s.jour)}</span>
        <div>
          <b style="font-size:9.6pt;">${esc(s.action)}</b>
          <p style="margin-top:1.5mm;font-size:8.8pt;">${esc(s.detail)}</p>
        </div>
      </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:8mm;">
      <div>
        <h3>Le rythme</h3>
        <ul class="puces" style="margin-top:3mm;">${P.rythme.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      </div>
      <div>
        <h3>Les signaux d’achat</h3>
        <ul class="puces" style="margin-top:3mm;">${P.signaux.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      </div>
    </div>

    <div class="bloc carte" style="margin-top:8mm;border-color:#d8b4b4;background:#fdf8f6;">
      <h3>Ce qu’on ne fait jamais</h3>
      <ul class="puces" style="margin-top:3mm;">${P.interdits.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
    </div>
  </section>`;
}

function script(V) {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">L’appel</div>
      <hr class="filet">
      <h2>Le script, <em>minute par minute.</em></h2>
    </div>

    <p>Il ne se récite pas : il se connaît, puis il s’oublie. Ce qui compte, c’est l’ordre —
    découvrir avant de proposer, faire écouter avant d’expliquer, demander un engagement daté
    avant de raccrocher.</p>

    ${V.SCRIPT.map((e, i) => `
    <div class="bloc" style="margin-top:6mm;padding-bottom:4mm;border-bottom:1px solid #e8e2d2;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:5mm;">
        <h3><span style="color:#c9a84c;font-size:11pt;">${String(i + 1).padStart(2, '0')}</span>&nbsp;&nbsp;${esc(e.titre)}</h3>
        <span class="etiquette">${esc(e.duree)}</span>
      </div>
      <ul class="puces" style="margin-top:3mm;">${(e.points || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul>
      ${e.note ? `<p style="margin-top:3mm;font-size:8.4pt;color:#77715f;border-left:2px solid #c9a84c;padding-left:4mm;">${esc(e.note)}</p>` : ''}
    </div>`).join('')}

    <div class="bloc carte" style="margin-top:8mm;">
      <h3>Les cinq questions du brief</h3>
      <p style="margin-top:2mm;font-size:8.8pt;">À savoir réciter. L’entretien avec la famille dure cinq minutes
      et ne demande rien d’autre.</p>
      <ol style="margin-top:4mm;display:grid;gap:2.5mm;">
        ${V.BRIEF.map((b, i) => `
        <li style="display:grid;grid-template-columns:8mm 1fr;gap:3mm;font-size:9.2pt;line-height:1.6;">
          <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:13pt;color:#c9a84c;">${i + 1}</span>
          <span>${esc(b)}</span>
        </li>`).join('')}
      </ol>
    </div>
  </section>`;
}

function objections(liste, titre, chapeau, intro) {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">${esc(chapeau)}</div>
      <hr class="filet">
      <h2>${titre}</h2>
    </div>

    <p>${esc(intro)}</p>

    ${liste.map(o => `
    <div class="bloc carte" style="margin-top:5mm;">
      <h3 style="color:#17150f;">« ${esc(o.objection)} »</h3>
      ${o.cache ? `<p style="margin-top:2.5mm;font-size:8.4pt;color:#77715f;">
        <span class="etiquette">Ce qu’ils ne disent pas</span><br>${esc(o.cache)}</p>` : ''}
      <p style="margin-top:3mm;" class="ligne-or">${esc(o.reponse)}</p>
      ${o.relance ? `<p style="margin-top:3mm;font-size:8.8pt;">
        <span class="etiquette">Puis on rend la parole</span><br>
        <em style="font-family:'Cormorant Garamond',Georgia,serif;font-size:11.5pt;">« ${esc(o.relance)} »</em></p>` : ''}
    </div>`).join('')}
  </section>`;
}

function traditions(V) {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Les lieux de culte</div>
      <hr class="filet">
      <h2>Ce qui se dit, <em>et ce qui ne se dit pas.</em></h2>
    </div>

    <p>Un célébrant n’achète rien : il autorise, ou il n’autorise pas. On ne lui vend donc pas
    une prestation, on lui montre qu’on connaît son cadre. Ces six lignes évitent la faute
    qui ferme une porte pour de bon.</p>

    <div style="margin-top:6mm;">
      ${V.TRADITIONS.map(t => `
      <div class="bloc" style="padding-bottom:4mm;border-bottom:1px solid #e8e2d2;margin-bottom:4mm;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:5mm;">
          <h3>${esc(t.nom)}</h3>
          <span class="etiquette">${esc(t.tenue)}</span>
        </div>
        <p style="margin-top:2mm;">${esc(t.dire)}</p>
        ${t.eviter ? `<p style="margin-top:2mm;font-size:8.4pt;color:#9c5252;">
          <span class="etiquette" style="color:#9c5252;">À éviter</span> ${esc(t.eviter)}</p>` : ''}
      </div>`).join('')}
    </div>
  </section>`;
}

function modeles(V) {
  const cles = Object.keys(V.MODELES);
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Les écrits</div>
      <hr class="filet">
      <h2>Six modèles, <em>à personnaliser en trois mots.</em></h2>
    </div>

    <p>Ils sont dans votre console, prêts à envoyer, avec le nom de la maison déjà rempli.
    Cette page sert à les connaître : savoir lequel part à quel moment vaut mieux que
    savoir les réciter.</p>

    <div style="margin-top:6mm;">
      ${cles.map(k => {
        const m = V.MODELES[k];
        return `<div class="bloc carte" style="margin-bottom:4mm;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:5mm;">
            <h3>${esc(m.nom)}</h3>
            ${m.etape ? `<span class="etiquette">${esc(m.etape)}</span>` : ''}
          </div>
          <p style="margin-top:2mm;font-size:8.8pt;">${esc(m.quand)}</p>
          ${m.lien ? `<p style="margin-top:2mm;font-family:'Jetbrains Mono',monospace;font-size:7.4pt;color:#8a6f26;">
            ${esc(m.lien.texte)} · ${esc(m.lien.url)}</p>` : ''}
        </div>`;
      }).join('')}
    </div>

    <div class="bloc carte ligne-or conclut" style="margin-top:8mm;border:0;">
      <p class="dire">Un courriel de prospection se lit en six secondes.
      S’il faut faire défiler, il ne sera pas lu.</p>
      <p style="margin-top:3mm;font-size:8.8pt;">Objet court, trois lignes, un seul lien,
      une seule question à la fin. Rien d’autre.</p>
    </div>
  </section>`;
}

function derniere() {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Pour finir</div>
      <hr class="filet">
      <h2>Ce métier <em>n’est pas un métier de volume.</em></h2>
    </div>

    <p>Vous appelez des gens qui enterrent des morts toute l’année. Ils repèrent en deux phrases
    celui qui récite un argumentaire, et ils raccrochent poliment. Ce qui marche, ici,
    c’est de connaître leur métier mieux que le concurrent qui les a appelés la semaine dernière.</p>

    <p style="margin-top:4mm;">Trois choses tiennent tout le reste :</p>

    <ul class="puces" style="margin-top:4mm;">
      <li><strong>Faire écouter avant d’expliquer.</strong> Trente secondes d’hommage valent
      dix minutes d’argumentaire. Ayez toujours un morceau prêt à lancer.</li>
      <li><strong>Ne jamais promettre ce qu’on ne tient pas.</strong> Vingt-quatre heures veut dire
      vingt-quatre heures. Une seule livraison en retard efface dix appels réussis.</li>
      <li><strong>Repartir avec une date.</strong> Un « rappelez-moi un de ces jours » n’est pas un oui :
      c’est un non poli. On sort de l’appel avec un jour et une heure, ou avec un non clair.</li>
    </ul>

    <div class="carte" style="margin-top:9mm;text-align:center;padding:8mm;">
      <p class="dire" style="font-size:15pt;">« La musique traverse le temps. »</p>
      <p style="margin-top:4mm;font-size:8.6pt;">Ce n’est pas une signature de marque :
      c’est ce que vous vendez. Une famille n’achète pas un fichier audio,
      elle achète ce qu’elle fera écouter dans quinze ans.</p>
    </div>

    <p class="disc" style="margin-top:10mm;">
      Document interne à Melodia Funèbre. Il contient des tarifs, des marges et des méthodes
      de prospection : il n’est pas destiné à être remis à une agence, ni diffusé hors de la maison.
    </p>
  </section>`;
}

/* ═══ LE DOCUMENT ═══ */
function html(donnees) {
  const V = venteDeLaConsole();
  const offres = (donnees.offres || []).map(o => ({ name: o.name, price: Number(o.price) }));

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Melodia Funèbre — Manuel de vente</title>
<style>${fontes()}${CLAIR}${FLUX}</style></head><body>
${couverture()}
${chiffres(V, offres, donnees.options || [])}
${cibles(V)}
${script(V)}
${objections(V.OBJECTIONS, 'Les douze objections <em>et ce qu’on répond.</em>', 'Au téléphone',
  'Une objection n’est pas un refus : c’est une demande de précision mal formulée. On écoute jusqu’au bout, on reformule, puis on répond — jamais l’inverse.')}
${objections(V.OBJECTIONS_CULTE, 'Les objections <em>d’un célébrant.</em>', 'En paroisse',
  'Elles ne se traitent pas comme celles d’une agence : il n’y a rien à vendre, et tout à respecter.')}
${traditions(V)}
${modeles(V)}
${derniere()}
</body></html>`;
}

/* Les titres que la relecture surveille : voir scripts/relire-pdf.js.
   Ils sont exportés d'ici pour n'être écrits qu'une fois. */
const TITRES = [
  'Les chiffres à savoir par cœur.', 'Les trois offres', 'Les options, que l’on oublie de proposer',
  'À qui l’on parle, et dans quel ordre.', 'La séquence, agence par agence', 'Le rythme',
  'Les signaux d’achat', 'Ce qu’on ne fait jamais', 'Le script, minute par minute.',
  'Les cinq questions du brief', 'Les douze objections et ce qu’on répond.',
  'Les objections d’un célébrant.', 'Ce qui se dit, et ce qui ne se dit pas.',
  'Six modèles, à personnaliser en trois mots.', 'Ce métier n’est pas un métier de volume.',
  'Et le marbrier ?', 'La famille garde la main', 'Une phrase suffit, en rendez-vous'
];

module.exports = { html, fichier: 'melodia-manuel-de-vente.pdf', TITRES };
