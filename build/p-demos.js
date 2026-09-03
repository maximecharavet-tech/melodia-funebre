const { ICON, TEL, TEL_HREF } = require('./gen.js');
const P = require('./parts.js');
const { TRACKS, STYLES } = require('./data.js');

module.exports = {
  file: 'demos.html',
  title: 'Écouter — Trois hommages composés pour de vraies familles | Melodia Funèbre',
  desc: "Écoutez trois hommages musicaux composés à partir d'un entretien de cinq minutes : chanson française, folk acoustique, bossa nova. Le brief de départ est indiqué pour chacun.",
  scripts: ['assets/js/player.js'],
  body: `
  <section class="section" style="padding-top:9rem;padding-bottom:0;">
    <div class="wrap">
      <div class="eyebrow reveal in">Écouter</div>
      <h1 class="h-hero reveal in reveal-d1">Trois vies,<br>trois <em>mélodies.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.8rem;">Chacune de ces œuvres est née d'un entretien de cinq minutes. Rien n'a été choisi dans un catalogue. Pour chaque hommage, nous indiquons les trois mots que la famille nous avait donnés au départ.</p>
    </div>
  </section>

  <section class="section section-tight">
    <div class="wrap">
      <div class="grid-2" style="gap:3rem;align-items:start;">
        ${P.player('Sélectionnez un hommage')}
        <div id="demos-list">
${TRACKS.map(t => `          <div class="card card-lift reveal" style="margin-bottom:1.2rem;">
            <h3 class="h-lg"><em>${t.title}</em></h3>
            <div class="mono" style="margin:.6rem 0 1rem;">${t.who} · ${t.style}</div>
            <p>${t.story}</p>
            <div style="margin-top:1.2rem;padding-top:1rem;border-top:1px solid var(--line-soft);">
              <span class="mono" style="color:var(--dust);">Brief de départ</span>
              <div style="font-family:var(--ff-d);font-style:italic;font-size:1.1rem;color:var(--or-patina);margin-top:.4rem;">« ${t.brief} »</div>
            </div>
          </div>`).join('\n')}
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ DU BRIEF À LA CHANSON ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3.5rem;">
        <div class="eyebrow">Ce qui se passe entre les deux</div>
        <h2 class="h-xl">De trois mots<br>à <em>trois minutes.</em></h2>
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
        <a href="offres.html" class="btn btn-gold btn-lg">Commander dans ce style</a>
      </div>
    </div>
  </section>

${P.urgency()}

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">La sienne n'existe<br>pas <em>encore.</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;">Trois mots, un souvenir, et nous nous occupons du reste.</p>
      <div class="hero-actions">
        <a href="offres.html" class="btn btn-gold btn-lg">Commander un hommage</a>
        <button type="button" class="btn btn-outline btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
    </div>
  </section>`
};
