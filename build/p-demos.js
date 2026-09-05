const { ICON } = require('./gen.js');
const P = require('./parts.js');
const { STYLES } = require('./data.js');

module.exports = {
  file: 'demos.html',
  title: 'Nos réalisations — Le catalogue des hommages composés | Melodia Funèbre',
  desc: "Le catalogue des hommages composés par la maison : pour chacun, la personne, son histoire, les mots que sa famille nous avait confiés, et l'œuvre qui en est née — écoutable en ligne.",
  scripts: ['assets/js/catalogue.js'],
  jsonld: [P.jsonldCatalogue, P.jsonldFil('Nos réalisations', '/demos')],
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
${P.oeuvres()}
    </div>
  </section>

  <!-- ═══ DU BRIEF À LA CHANSON ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3.5rem;">
        <div class="eyebrow">Ce qui se passe entre les deux</div>
        <h2 class="h-xl">De trois mots<br>à <em>trois minutes.</em></h2>
        <p class="lead" style="margin:1.4rem auto 0;max-width:58ch;">Reprenons le premier hommage du catalogue, celui de Maurice, et suivons le chemin d'un bout à l'autre.</p>
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
        <p class="lead" style="margin-top:1.4rem;">Huit registres de départ, ajustés pendant l'entretien. Si le style qui lui ressemble n'est pas dans cette liste, dites-le nous : nous composons aussi hors catalogue.</p>
      </div>
      <div class="grid-4">
${STYLES.map(s => `        <div class="acte reveal" style="text-align:center;padding:1.6rem 1rem;"><h3 style="font-size:1.15rem;margin:0;">${s}</h3></div>`).join('\n')}
      </div>
      <div class="center reveal" style="margin-top:3rem;">
        <a href="/offres" class="btn btn-gold btn-lg">Commander dans ce style</a>
      </div>
    </div>
  </section>

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
