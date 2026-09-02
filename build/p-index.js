const { ICON, TEL, TEL_HREF } = require('./gen.js');
const P = require('./parts.js');

module.exports = {
  file: 'index.html',
  title: 'Melodia Funèbre — La chanson qu\'il méritait, composée en 24 h',
  desc: "Maison française de composition musicale pour cérémonies funéraires. Une œuvre originale écrite pour votre défunt, livrée en 24 heures, sans droits SACEM. Dès 149 €.",
  jsonld: [P.jsonldOrg, P.jsonldService, P.jsonldFaq],
  intro: true,
  scripts: ['assets/js/player.js'],
  body: `
  <!-- ═══ COUVERTURE ═══ -->
  <section class="hero-video">
    <video muted loop playsinline preload="none" poster="assets/img/logo-melodia.jpg"
           data-src="assets/img/logo-melodia-anime.mp4" aria-hidden="true"></video>
    <div class="hero-caption">
      <div class="badge reveal in" style="margin-bottom:1.6rem;">Composition originale · Livrée en 24 heures</div>
      <h1 class="h-hero reveal in reveal-d1">Chaque vie mérite<br><em>une chanson.</em></h1>
      <p class="lead reveal in reveal-d2">Pour chaque personne qui s'en va, notre maison compose une œuvre originale — sa vie, ses gestes, sa mémoire — remise à la famille sous vingt-quatre heures. Sans droits à régler, à vous pour toujours.</p>
      <div class="hero-actions reveal in reveal-d3">
        <a href="offres.html" class="btn btn-gold btn-lg">Commander un hommage</a>
        <a href="demos.html" class="btn btn-outline btn-lg">${ICON.note} Écouter trois hommages</a>
      </div>
      <p class="reveal in reveal-d4 note" style="margin-top:1.8rem;">
        Dès 149 € · Sans engagement · Révision jusqu'à satisfaction
      </p>
    </div>
    <div class="hero-scroll" aria-hidden="true">Découvrir</div>
  </section>

  <!-- ═══ RÉASSURANCE ═══ -->
  <section class="section-sm" style="border-bottom:1px solid var(--line-soft);">
    <div class="wrap">
      ${P.trustStrip()}
    </div>
  </section>

${P.marquee()}

  <!-- ═══ LE PROBLÈME ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="grid-2" style="gap:4.5rem;align-items:center;">
        <div class="reveal">
          <div class="eyebrow">La maison</div>
          <h2 class="h-xl">Née d'un adieu<br>qui sonnait <em>faux.</em></h2>
          <p class="lead" style="margin-top:1.8rem;">Aux obsèques, la musique n'a presque jamais connu le défunt. Un Ave Maria pour une grand-mère qui ne chantait qu'en cuisine. Une valse pour un homme qui sifflait dans ses champs. L'hommage le plus intime d'une vie, réduit à une citation empruntée.</p>
          <p class="lead" style="margin-top:1.2rem;">Melodia Funèbre existe pour corriger cela : composer, pour chaque personne qui s'en va, la chanson qu'elle méritait.</p>
          <a href="processus.html" class="btn btn-outline" style="margin-top:2rem;">Comment nous procédons</a>
        </div>
        <div class="reveal reveal-d1">
          <div class="grid-2" style="gap:0;">
            <div class="stat" style="border-right:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);"><div class="stat-num"><span data-count="24" data-suffix="h">24h</span></div><div class="stat-label">De l'entretien à l'œuvre</div></div>
            <div class="stat" style="border-bottom:1px solid var(--line-soft);"><div class="stat-num"><span data-count="0" data-suffix="€">0€</span></div><div class="stat-label">Droits SACEM</div></div>
            <div class="stat" style="border-right:1px solid var(--line-soft);"><div class="stat-num"><span data-count="100" data-suffix="%">100%</span></div><div class="stat-label">Œuvre originale</div></div>
            <div class="stat"><div class="stat-num">∞</div><div class="stat-label">À vous, à vie</div></div>
          </div>
        </div>
      </div>
    </div>
  </section>

${P.urgency()}

  <!-- ═══ TROIS ACTES ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3.5rem;">
        <div class="eyebrow">Le rituel de composition</div>
        <h2 class="h-xl">Trois actes,<br>et <em>rien à préparer.</em></h2>
      </div>
      <div class="grid-3">
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.phone}</div>
          <h3 class="h-lg">I · La confidence</h3>
          <p>Cinq questions, cinq minutes, au téléphone. Vous nous confiez qui il était : ses gestes, ses manies, l'anecdote qui le résume. Nous posons les questions, vous n'avez rien à rédiger.</p>
          <div class="mono" style="margin-top:1.2rem;">Jour 1 · 5 minutes</div>
        </div>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.pen}</div>
          <h3 class="h-lg">II · La composition</h3>
          <p>Vos mots deviennent couplets et refrain. La mélodie s'écrit dans le style qui lui ressemble. Chaque étape est relue, corrigée et validée à la main par la maison avant d'aller plus loin.</p>
          <div class="mono" style="margin-top:1.2rem;">Jour 1 · quelques heures</div>
        </div>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.gift}</div>
          <h3 class="h-lg">III · La transmission</h3>
          <p>Sous vingt-quatre heures, l'œuvre vous est remise : diffusable à la cérémonie, copiable pour toute la famille, conservée pour les générations suivantes.</p>
          <div class="mono" style="margin-top:1.2rem;">Jour 2 · livraison</div>
        </div>
      </div>
      <div class="center reveal" style="margin-top:3rem;">
        <a href="processus.html" class="btn btn-outline">Le processus en détail</a>
      </div>
    </div>
  </section>

  <!-- ═══ ÉCOUTE ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="grid-2" style="gap:4rem;align-items:center;">
        <div class="reveal">
          <div class="eyebrow">Écouter</div>
          <h2 class="h-xl">Trois vies,<br>trois <em>mélodies.</em></h2>
          <p class="lead" style="margin-top:1.6rem;">Chacune de ces œuvres est née d'un entretien de cinq minutes avec une famille. Rien n'a été choisi dans un catalogue : tout a été écrit pour eux, à partir de trois mots et d'un souvenir.</p>
          <div class="hero-actions" style="margin-top:2rem;">
            <a href="demos.html" class="btn btn-outline">Toutes les démonstrations</a>
          </div>
        </div>
        ${P.player()}
      </div>
    </div>
  </section>

  <!-- ═══ COMPARATIF ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Sans détour</div>
        <h2 class="h-xl">Ce que les autres<br>solutions <em>ne font pas.</em></h2>
        <p class="lead" style="margin-top:1.4rem;">Trois façons d'apporter de la musique à une cérémonie. Voici honnêtement ce que chacune permet.</p>
      </div>
      <div class="compare-wrap reveal">
        <table class="compare">
          <thead>
            <tr>
              <th scope="col">&nbsp;</th>
              <th scope="col">Musique du commerce</th>
              <th scope="col">Musicien sur place</th>
              <th scope="col" class="col-hl">Melodia Funèbre</th>
            </tr>
          </thead>
          <tbody>
            <tr><th scope="row">Écrite pour le défunt</th><td class="no">Non</td><td class="no">Non</td><td class="col-hl yes">Oui</td></tr>
            <tr><th scope="row">Droits de diffusion à régler</th><td>Oui, SACEM</td><td>Oui, SACEM</td><td class="col-hl yes">Aucun</td></tr>
            <tr><th scope="row">Délai d'obtention</th><td>Immédiat</td><td>1 à 2 semaines</td><td class="col-hl">24 heures</td></tr>
            <tr><th scope="row">Budget courant</th><td>0 à 30 €</td><td>400 à 900 €</td><td class="col-hl">149 à 499 €</td></tr>
            <tr><th scope="row">Conservable par la famille</th><td class="no">Sous licence</td><td class="no">Rarement</td><td class="col-hl yes">Oui, à vie</td></tr>
            <tr><th scope="row">Rediffusable sans limite</th><td class="no">Non</td><td class="no">Non</td><td class="col-hl yes">Oui</td></tr>
            <tr><th scope="row">Reprise si elle ne convient pas</th><td class="no">—</td><td class="no">Non</td><td class="col-hl yes">Oui</td></tr>
          </tbody>
        </table>
      </div>
${P.scrollHint()}
      <p class="center reveal note" style="margin-top:1.6rem;">Budgets constatés en France métropolitaine, à titre indicatif</p>
    </div>
  </section>

  <!-- ═══ OFFRES ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3.5rem;">
        <div class="eyebrow">Les offres</div>
        <h2 class="h-xl">Trois façons de dire <em>adieu.</em></h2>
      </div>
      <div class="grid-3">
${P.pricing('link')}
      </div>
      <div class="center reveal" style="margin-top:2.5rem;">
        ${P.trustStrip()}
      </div>
    </div>
  </section>

  <!-- ═══ TÉMOIGNAGES ═══ -->
  <section class="section section-top">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Ils témoignent</div>
        <h2 class="h-xl">Des larmes, <em>et des sourires.</em></h2>
      </div>
${P.testimonials()}
    </div>
  </section>

  <!-- ═══ CITATION ═══ -->
  <div class="wrap"><hr class="rule-gold"></div>
  <section class="quote-band">
    <div class="wrap reveal">
      <p>« La musique commence là où s'arrête<br>le pouvoir des mots. »</p>
      <cite>Richard Wagner</cite>
    </div>
  </section>
  <div class="wrap"><hr class="rule-gold"></div>

  <!-- ═══ AGENCES ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="grid-2" style="gap:4rem;align-items:center;">
        <div class="reveal">
          <div class="eyebrow">Pompes funèbres</div>
          <h2 class="h-xl">Un service que vos confrères<br>ne proposent <em>pas encore.</em></h2>
          <p class="lead" style="margin-top:1.6rem;">Soixante pour cent de marge sur chaque hommage, aucun investissement, aucune charge technique. Vous présentez, la famille décide, nous composons. Votre espace partenaire suit chaque commande en temps réel.</p>
          <div class="hero-actions" style="margin-top:2rem;">
            <a href="agences.html" class="btn btn-gold">Espace agences</a>
            <a href="agences.html#calculateur" class="btn btn-outline">${ICON.euro} Simuler mes revenus</a>
          </div>
        </div>
        <div class="reveal reveal-d1">
          <div class="grid-2" style="gap:1rem;">
            <div class="card"><div class="stat-num" style="font-size:2.4rem;"><span data-count="60" data-suffix="%">60%</span></div><div class="stat-label">Marge agence</div></div>
            <div class="card"><div class="stat-num" style="font-size:2.4rem;"><span data-count="0" data-suffix="€">0€</span></div><div class="stat-label">Investissement</div></div>
            <div class="card"><div class="stat-num" style="font-size:2.4rem;"><span data-count="5" data-suffix="min">5min</span></div><div class="stat-label">Brief famille</div></div>
            <div class="card"><div class="stat-num" style="font-size:2.4rem;">1<sup style="font-size:.9rem;">re</sup></div><div class="stat-label">Composition offerte</div></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ FAQ ═══ -->
  <section class="section" id="faq">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.5rem;">
        <div class="eyebrow">Questions fréquentes</div>
        <h2 class="h-xl">Ce que les familles<br>nous <em>demandent.</em></h2>
      </div>
      <div class="reveal">
${P.faq(null, true)}
      </div>
      <div class="center reveal" style="margin-top:2.5rem;">
        <p class="lead" style="margin-bottom:1.4rem;">Une question qui n'est pas ici ?</p>
        <div class="hero-actions"><a href="tel:${TEL_HREF}" class="btn btn-outline">${ICON.phone} ${TEL}</a><a href="contact.html" class="btn btn-ghost">Nous écrire</a></div>
      </div>
    </div>
  </section>

  <!-- ═══ APPEL FINAL ═══ -->
  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">Offrez-leur la chanson<br>qu'ils <em>méritaient.</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;">Commande en trois minutes, entretien sous vingt-quatre heures, suivi en ligne à chaque étape. Et si l'œuvre ne vous touche pas, nous la reprenons.</p>
      <div class="hero-actions">
        <a href="offres.html" class="btn btn-gold btn-lg">Commander un hommage</a>
        <a href="tel:${TEL_HREF}" class="btn btn-outline btn-lg">${ICON.phone} ${TEL}</a>
      </div>
    </div>
  </section>`
};
