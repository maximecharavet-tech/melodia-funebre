const { ICON } = require('./gen.js');
const P = require('./parts.js');
const { STYLES, TRACKS } = require('./data.js');
const { adresses } = require('./adresses.js');
const { illustration, DEFS } = require('./instruments.js');

const esc = (x) => String(x == null ? '' : x)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ─── LES REGISTRES ──────────────────────────────────────────────
   Cette section annonçait « huit registres de départ » et en listait
   dix-sept ; la page promettait « 17 hommages » quand le catalogue en
   comptait vingt. Trois nombres écrits à la main, trois mensonges
   involontaires. Tout se compte désormais.

   Et surtout : trois registres du catalogue — soul jazz, musette,
   country americana — n'étaient PAS proposés, parce qu'ils avaient
   été ajoutés aux œuvres sans l'être à la liste. Une famille pouvait
   entendre une musette sur le site sans pouvoir en commander une.
   La liste est donc l'union des deux, et scripts/check.js refuse
   désormais qu'elles divergent.

   La forme, elle, a changé trois fois. Grille de mots, puis grille de
   pictogrammes, puis ceci : une bande qui défile, où chaque registre
   porte l'instrument qui le joue, dessiné en grand. Vingt cartes ne
   prennent plus cinq rangées mais une seule ligne. */
function registres() {
  const slugs = adresses(TRACKS);

  /* Pour chaque registre, la première œuvre qui l'illustre. C'est elle
     qui transforme un mot en porte : on n'ouvre pas une liste, on
     ouvre une écoute. */
  const exemple = {};
  TRACKS.forEach((t) => { if (t.style && !exemple[t.style]) exemple[t.style] = t; });

  const tous = [...new Set([...TRACKS.map((t) => t.style), ...STYLES])].filter(Boolean);
  /* Ceux qui ont une preuve d'abord : ils portent l'argument, et ce
     sont eux qu'on voit sans avoir à faire défiler. Les autres
     suivent, et disent honnêtement qu'ils sont sur demande. */
  return tous
    .map((nom) => ({ nom, t: exemple[nom] }))
    .sort((a, b) => (a.t ? 0 : 1) - (b.t ? 0 : 1))
    .map((r) => {
      const visuel = `<div class="reg-cadre">${illustration(r.nom)}</div>`;
      if (!r.t) {
        return `          <div class="reg-carte reg-vide">
            ${visuel}
            <div class="reg-corps">
              <h3 class="reg-nom">${esc(r.nom)}</h3>
              <span class="reg-sur">Sur demande</span>
            </div>
          </div>`;
      }
      const slug = slugs[TRACKS.indexOf(r.t)];
      const pour = (r.t.categorie || 'hommage') === 'message' ? 'De' : 'Pour';
      return `          <a class="reg-carte" href="/ecouter/${esc(slug)}">
            ${visuel}
            <div class="reg-corps">
              <h3 class="reg-nom">${esc(r.nom)}</h3>
              <p class="reg-oeuvre"><em class="reg-titre">${esc(r.t.title)}</em><span class="reg-qui">${pour} ${esc(r.t.who)}</span></p>
              <span class="reg-lien"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Écouter</span>
            </div>
          </a>`;
    }).join('\n');
}

const nbHommages = TRACKS.filter((t) => (t.categorie || 'hommage') === 'hommage').length;
const nbRegistres = new Set([...TRACKS.map((t) => t.style), ...STYLES].filter(Boolean)).size;

const LETTRES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit',
  'dix-neuf', 'vingt', 'vingt et un', 'vingt-deux', 'vingt-trois', 'vingt-quatre', 'vingt-cinq'];
const mot = (n) => LETTRES[n] || String(n);
const Cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);

module.exports = {
  file: 'demos.html',
  title: `Écouter ${nbHommages} hommages composés sur mesure | Melodia Funèbre`,
  desc: "Pour chaque hommage : la personne, son histoire, les mots que sa famille nous avait confiés, et l'œuvre qui en est née — écoutable en ligne.",
  scripts: ['assets/js/catalogue.js', 'assets/js/registres.js'],
  /* Chaque œuvre porte « byArtist » vers l'entité « maison » : elle
     est donc déclarée sur cette page, sans quoi les dix-sept
     références pointent dans le vide. */
  jsonld: [P.jsonldOrg, P.jsonldCatalogue, P.jsonldFil('Nos réalisations', '/demos')],
  body: `
  <section class="page-head">
    <div class="wrap">
      <div class="eyebrow reveal in">Nos réalisations</div>
      <h1 class="h-xl reveal in reveal-d1" style="margin-top:.8rem;">Écoutez ce que<br>nous <em>composons.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.4rem;max-width:62ch;">Tous nos hommages, réunis ici. Pour chacun : la personne, son histoire telle que sa famille nous l'a racontée, les mots qu'elle nous avait confiés, et l'œuvre qui en est née.</p>
    </div>
  </section>

  <section class="section-sm" style="padding-top:2.4rem;">
    <div class="wrap">
${P.vitrineBarre()}
${P.oeuvres('hommage')}
    </div>
  </section>

  <!-- ═══ DU BRIEF À LA CHANSON ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3.5rem;">
        <div class="eyebrow">Ce qui se passe entre les deux</div>
        <h2 class="h-xl">De trois mots<br>à <em>trois minutes.</em></h2>
        <p class="lead" style="margin:1.4rem auto 0;max-width:58ch;">Reprenons l'hommage de Maurice, le pêcheur de Loire, et suivons le chemin d'un bout à l'autre.</p>
      </div>
      <div class="grid-3">
        <div class="card reveal">
          <div class="mono">Ce que la famille dit</div>
          <p style="font-family:var(--ff-d);font-style:italic;font-size:1.22rem;color:var(--ivory-ink);margin-top:.8rem;line-height:1.5;">« Il était patient. Il pêchait. Il ne parlait presque pas, mais il a appris à pêcher à ses quatre petits-enfants. »</p>
        </div>
        <div class="card reveal">
          <div class="mono">Ce que ça devient</div>
          <p style="font-family:var(--ff-d);font-style:italic;font-size:1.22rem;color:var(--ivory-ink);margin-top:.8rem;line-height:1.5;">« Quatre paires de mains sur la même canne / Quatre silences appris au bord de l'eau »</p>
        </div>
        <div class="card reveal">
          <div class="mono">Ce que la famille entend</div>
          <p style="font-family:var(--ff-d);font-style:italic;font-size:1.22rem;color:var(--ivory-ink);margin-top:.8rem;line-height:1.5;">Une chanson de trois minutes que personne d'autre au monde ne possède — et que ses petits-enfants garderont.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ REGISTRES ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Les registres</div>
        <h2 class="h-xl">Chaque vie a <em>sa musique.</em></h2>
        <p class="lead" style="margin-top:1.4rem;max-width:64ch;margin-left:auto;margin-right:auto;">${Cap(mot(nbRegistres))} registres de départ, ajustés pendant l'entretien. Ceux que nous avons déjà composés s'écoutent d'un clic. Si le style qui lui ressemble n'est dans aucun d'eux, dites-le-nous : nous composons aussi hors catalogue.</p>
      </div>
${DEFS}
      <div class="reg-carrousel reveal" data-carrousel>
        <div class="reg-piste" data-piste role="list" aria-label="Les registres musicaux">
${registres()}
        </div>
        <div class="reg-jauge"><span data-jauge></span></div>
        <p class="reg-aide">Faites glisser pour voir les ${mot(nbRegistres)} registres</p>
      </div>
      <div class="center reveal" style="margin-top:3rem;">
        <a href="/offres" class="btn btn-gold btn-lg">Commander dans ce style</a>
      </div>
    </div>
  </section>

${P.partage(`${Cap(mot(nbHommages))} hommages composés sur mesure`, "Chacun écrit pour une seule personne, d'après ce que sa famille en a raconté.")}
${P.urgency()}

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">La sienne n'existe<br>pas <em>encore.</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;">Trois mots, un souvenir, et nous nous occupons du reste.</p>
      <div class="hero-actions">
        <a href="/offres" class="btn btn-gold btn-lg">Commander un hommage</a>
        <button type="button" class="btn btn-outline btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
    </div>
  </section>`
};
