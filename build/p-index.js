const fs = require('fs');
const path = require('path');
const { ICON, versionne } = require('./gen.js');
const P = require('./parts.js');

/* La succession du hero se lit dans le manifeste des clips, pas dans
   le gabarit : l'ordre, le point de cadrage et les fichiers restent
   une seule source. L'empreinte dans l'adresse suit le fichier, comme
   pour le reste du site. */
function adresse(relatif) {
  return '/' + versionne(relatif);
}
function ratio(bloc) {
  return {
    webm: adresse(bloc.webm.path),
    mp4: adresse(bloc.mp4.path),
    avif: adresse(bloc.poster.avif),
    jpg: adresse(bloc.poster.jpg),
    leger: bloc.leger ? adresse(bloc.leger.path) : ''
  };
}
function suiteHero() {
  const manifeste = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../assets/video/hero/manifest.json'), 'utf8'));
  return {
    tenue: 6.8,
    fondu: 1.55,
    plans: manifeste.clips.map((c) => ({
      id: c.id,
      titre: c.title,
      posL: c.objectPosition['16x9'],
      posP: c.objectPosition['9x16'],
      l: ratio(c.files['16x9']),
      p: ratio(c.files['9x16'])
    }))
  };
}
const SUITE = suiteHero();
const PREMIER = SUITE.plans[0];

function sceneHero() {
  return `<div class="hero-scene" aria-hidden="true">
      <picture class="hero-affiche">
        <source media="(max-width: 860px) and (orientation: portrait)" type="image/avif" srcset="${PREMIER.p.avif}">
        <source media="(max-width: 860px) and (orientation: portrait)" type="image/jpeg" srcset="${PREMIER.p.jpg}">
        <source type="image/avif" srcset="${PREMIER.l.avif}">
        <img src="${PREMIER.l.jpg}" alt="" width="1600" height="900" fetchpriority="high" decoding="async">
      </picture>
      <video class="hero-plan" data-plan="a" muted playsinline autoplay preload="none" disablepictureinpicture tabindex="-1"></video>
      <video class="hero-plan" data-plan="b" muted playsinline preload="none" disablepictureinpicture tabindex="-1"></video>
    </div>`;
}
function regieHero() {
  const traits = SUITE.plans.map(() => '<li class="hero-chap"><span></span></li>').join('');
  return `<div class="hero-regie">
      <ol class="hero-chapitres" aria-hidden="true">${traits}</ol>
      <button type="button" class="hero-pause" aria-pressed="false" aria-label="Mettre le film en pause">
        <svg class="ico-pause" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false"><rect x="6" y="4.5" width="3.4" height="15" rx="0.4" fill="currentColor"/><rect x="14.6" y="4.5" width="3.4" height="15" rx="0.4" fill="currentColor"/></svg>
        <svg class="ico-lire" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false"><path d="M8.2 4.8v14.4L19.2 12z" fill="currentColor"/></svg>
      </button>
    </div>
    <script type="application/json" id="hero-suite">${JSON.stringify(SUITE).replace(/</g, '\\u003c')}</script>`;
}

module.exports = {
  file: 'index.html',
  title: 'Chanson d\'hommage pour obsèques, en 24 h | Melodia Funèbre',
  desc: "Une chanson originale composée pour votre défunt, d'après ce que vous nous racontez de lui. Livrée en 24 h, sans droit SACEM. Dès 149 €.",
  /* L'affiche du premier plan, dès le premier paint : c'est elle qui
     tient le plus grand contenu de l'accueil une fois le seuil passé.
     Le film, lui, n'est pas préchargé ici — il attendrait derrière
     l'animation d'entrée, ou pèserait sur un forfait pour rien. */
  metas: `<link rel="preload" as="image" type="image/avif" href="${PREMIER.p.avif}" media="(max-width: 860px) and (orientation: portrait)" fetchpriority="high">
<link rel="preload" as="image" type="image/avif" href="${PREMIER.l.avif}" media="not ((max-width: 860px) and (orientation: portrait))" fetchpriority="high">
`,
  /* Le catalogue des dix-sept œuvres n'est plus déclaré ici. Il porte
     l'identifiant « /demos#catalogue » et il est déjà déclaré sur
     /demos : le répéter sur l'accueil décrivait le même nœud à deux
     adresses, et alourdissait de 14 Ko la page la plus consultée du
     site pour ne rien dire de neuf. Un lien mène de l'une à l'autre —
     c'est ce que les moteurs suivent. */
  jsonld: [P.jsonldSite, P.jsonldOrg, P.jsonldService, P.jsonldFaq],
  intro: true,
  scripts: ['assets/js/hero-film.js', 'assets/js/catalogue.js', 'assets/js/vendor/motion-mini-14.12.min.js', 'assets/js/recueil.js', 'assets/js/lumiere-3d.js'],
  body: `
  <!-- ═══ COUVERTURE ═══ -->
  <section class="hero-video a-film" data-hero-film>
    <!-- Huit plans, dans l'ordre du manifeste. L'emblème, le titre et
         les deux portes restent devant. assets/img/logo-melodia-anime.mp4
         est l'ancien logo : il ne revient pas ici. -->
    ${sceneHero()}
    <!-- L'emblème en scène : l'anneau se trace, la gravure tourne, une
         lumière balaie la médaille. Le logo n'est pas redessiné, il est
         mis en scène — c'est une image matricielle, on ne peut pas
         l'animer trait par trait. -->
    <div class="hero-embleme" data-orn-embleme data-orn-priorite
         data-orn-alt="Melodia Funèbre" aria-hidden="true"></div>
    <!-- Le premier écran s'adresse d'abord aux pompes funèbres : ce
         sont elles qui rencontrent les familles, et une agence
         partenaire vaut des dizaines de commandes. Mais la porte des
         familles reste ouverte, en second bouton — la moitié du trafic
         de recherche arrive en cherchant « chanson hommage », et la
         refermer coûterait plus qu'elle ne rapporterait. -->
    <!-- DEUX PORTES. Le premier écran parlait aux pompes funèbres et
         renvoyait les familles à une ligne de bas de bloc — or la moitié
         du trafic arrive en cherchant « chanson hommage ». Chacun trouve
         désormais sa porte dès l'arrivée, avec son argument et son geste,
         sans avoir à se reconnaître dans un texte écrit pour l'autre. -->
    <div class="hero-caption">
      <div class="badge reveal in" style="margin-bottom:1.6rem;">Hommage musical personnalisé</div>
      <h1 class="h-hero reveal in reveal-d1" data-titre-anime>Chaque vie mérite<br><em>sa chanson.</em></h1>
      <p class="lead reveal in reveal-d2">Une œuvre originale composée à partir de l'histoire, des souvenirs et de la personnalité du défunt. Livrée en 24 heures, diffusée à la cérémonie, gardée pour toujours.</p>
      <div class="portes reveal in reveal-d3">
        <a href="/offres" class="porte" data-magnetique>
          <span class="porte-sur">Je suis une famille</span>
          <span class="porte-titre">Offrir sa chanson</span>
          <span class="porte-texte">Pour celui ou celle qu'on a perdu, une musique à son image.</span>
          <span class="porte-meta">Dès 149 € · livré en 24 h</span>
          <span class="porte-cta">Commander un hommage <span aria-hidden="true">→</span></span>
        </a>
        <a href="/professionnels" class="porte porte-pro" data-magnetique>
          <span class="porte-sur">Je suis une pompe funèbre</span>
          <span class="porte-titre">Proposer le service</span>
          <span class="porte-texte">Un hommage que vos confrères n'offrent pas encore.</span>
          <span class="porte-meta">60 % pour l'agence · 0 € d'investissement</span>
          <span class="porte-cta">Devenir partenaire <span aria-hidden="true">→</span></span>
        </a>
      </div>
      <p class="reveal in reveal-d4 note hero-note-famille">
        <a href="/demos">${ICON.note} Écouter un hommage</a> · sans inscription, en trente secondes
      </p>
    </div>
    ${regieHero()}
    <div class="hero-scroll" aria-hidden="true">Découvrir</div>
  </section>

  <!-- ═══ RÉASSURANCE ═══ -->
  <section class="section-sm" style="border-bottom:1px solid var(--line-soft);">
    <div class="wrap">
      ${P.trustStrip()}
    </div>
  </section>

${P.marquee()}

  <!-- ═══ LA VITRINE ═══ -->
  <section class="section" id="vitrine">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.6rem;">
        <div class="eyebrow">Nos réalisations</div>
        <h2 class="h-xl">Écoutez ce que<br>nous <em>composons.</em></h2>
        <p class="lead" style="margin:1.6rem auto 0;max-width:64ch;">Voici nos hommages, tous réunis. Chacun est né d'un entretien de cinq minutes avec une famille : rien n'a été pris dans un catalogue, tout a été écrit pour eux. La personne est décrite à côté de sa chanson.</p>
      </div>
${P.vitrineBarre()}
${P.oeuvres('hommage')}
    </div>
  </section>

  <!-- ═══ CE QUI N'EXISTE NULLE PART ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3.2rem;">
        <div class="eyebrow">Sans équivalent</div>
        <h2 class="h-xl">Une œuvre,<br><em>une seule fois.</em></h2>
        <p class="lead" style="margin:1.6rem auto 0;max-width:60ch;">
          Vous venez d'écouter {{HOMMAGES}} hommages. Aucun ne ressemble à un autre, et aucun
          n'existait avant qu'une famille ne décroche son téléphone.</p>
      </div>
      <div class="grid-4" data-cascade>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.pen}</div>
          <h3 class="h-lg">Elle naît de vous</h3>
          <p>Rien n'est écrit d'avance. Le texte part de ce que vous racontez : son métier, sa manie,
             la phrase qu'il répétait. Une chanson du commerce parle de quelqu'un d'autre — celle-ci
             ne parle que de lui.</p>
        </div>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.gift}</div>
          <h3 class="h-lg">Elle n'appartient qu'à vous</h3>
          <p>Composée une fois, vendue une fois. Elle ne sera jamais reproposée à une autre famille,
             ni versée à un catalogue. Personne d'autre au monde ne possède cet enregistrement.</p>
        </div>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.shield}</div>
          <h3 class="h-lg">Elle est libre de droits</h3>
          <p>Aucune déclaration, aucune redevance. Vous la diffusez à la cérémonie, vous la copiez
             pour toute la famille, vous la remettez aux petits-enfants. Sans rien demander à personne.</p>
        </div>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.heart}</div>
          <h3 class="h-lg">Elle vous survivra</h3>
          <p>Les fleurs fanent, les discours s'oublient. Un enregistrement se garde, se transmet,
             se réécoute dans dix ans — le jour où l'on veut réentendre qui il était.</p>
        </div>
      </div>
      <p class="center reveal note" style="margin-top:2rem;max-width:56ch;margin-left:auto;margin-right:auto;line-height:1.9;">
        Nous n'avons trouvé aucune autre maison française proposant cela. Si vous en connaissez une,
        écrivez-nous : nous corrigerons cette page le jour même.</p>
    </div>
  </section>

  <!-- ═══ LE PROBLÈME ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="grid-2" style="gap:4.5rem;align-items:center;">
        <div class="reveal">
          <div class="eyebrow">La maison</div>
          <h2 class="h-xl">Née d'un adieu<br>qui sonnait <em>faux.</em></h2>
          <p class="lead" style="margin-top:1.8rem;">Aux obsèques, la musique n'a presque jamais connu le défunt. Un Ave Maria pour une grand-mère qui ne chantait qu'en cuisine. Une valse pour un homme qui sifflait dans ses champs. L'hommage le plus intime d'une vie, réduit à une citation empruntée.</p>
          <p class="lead" style="margin-top:1.2rem;">Melodia Funèbre existe pour corriger cela : composer, pour chaque personne qui s'en va, la chanson qu'elle méritait.</p>
          <a href="/processus" class="btn btn-outline" style="margin-top:2rem;">Comment nous procédons</a>
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

${P.partage('Melodia Funèbre — une chanson composée pour votre défunt', "Une œuvre originale écrite à partir de ce que vous racontez de lui, livrée en 24 h.")}
${P.urgency()}

  
  <div class="orn-portee-hote" data-orn-portee="actes"></div>
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
        <a href="/processus" class="btn btn-outline">Le processus en détail</a>
      </div>
    </div>
  </section>


${P.chaineQR()}

  <!-- ═══ COMPARATIF ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Sans détour</div>
        <h2 class="h-xl">Ce que les autres<br>solutions <em>ne font pas.</em></h2>
        <p class="lead" style="margin-top:1.4rem;">Trois façons d'apporter de la musique à une cérémonie. Voici honnêtement ce que chacune permet.</p>
      </div>
${P.scrollHint()}
      <div class="compare-wrap reveal">
        <table class="compare">
          <thead>
            <tr>
              <th scope="col"><span class="hors-vue">Ce qui est comparé</span></th>
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

  
  <div class="orn-portee-hote" data-orn-portee="temoignages"></div>
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
  <section class="quote-band a-rosace">
    <div class="orn-rosace-hote" data-orn-rosace="citation" data-orn-traits="3"></div>
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
            <a href="/professionnels" class="btn btn-gold">Pour les professionnels</a>
            <a href="/professionnels#calculateur" class="btn btn-outline">${ICON.euro} Simuler mes revenus</a>
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
        <div class="hero-actions"><button type="button" class="btn btn-outline" data-rappel>${ICON.phone} Être rappelé</button><a href="/contact" class="btn btn-ghost">Nous écrire</a></div>
      </div>
    </div>
  </section>

  <!-- ═══ LES GUIDES ═══
       Ils ne vendent rien : ils répondent à ce qu'une famille cherche
       avant même de savoir que cette maison existe. Les placer ici, et
       non dans un coin, leur donne le lien le plus fort du site — et
       donne à la famille pressée quelque chose d'utile tout de suite,
       même si elle ne commande rien. -->
  <section class="section-sm" id="conseils">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.4rem;">
        <div class="eyebrow">Nos guides</div>
        <h2 class="h-xl">Ce qu'il faut savoir,<br><em>même sans nous.</em></h2>
        <p class="lead" style="margin:1.2rem auto 0;max-width:56ch;">Trois questions reviennent dans presque tous nos appels. Nous y avons répondu en entier, pour les familles qui ne feront jamais appel à nous comme pour les autres.</p>
      </div>
      <div class="grid-3">
        <a href="/musique-obseques" class="card card-lift reveal">
          <div class="card-icon">${ICON.note}</div>
          <h3 class="h-lg">Quelle musique pour un enterrement</h3>
          <p>Combien de morceaux, à quel moment, comment choisir sans se tromper — et les vérifications qui évitent l'accident du jour même.</p>
        </a>
        <a href="/musique-cremation" class="card card-lift reveal">
          <div class="card-icon">${ICON.clock}</div>
          <h3 class="h-lg">La musique en crémation</h3>
          <p>Le créneau qui commande tout, et cet instant qui n'existe nulle part ailleurs : la disparition du cercueil.</p>
        </a>
        <a href="/musique-sacem-obseques" class="card card-lift reveal">
          <div class="card-icon">${ICON.shield}</div>
          <h3 class="h-lg">Droits d'auteur et obsèques</h3>
          <p>A-t-on le droit de passer cette chanson ? Qui déclare quoi, à l'église, au crématorium — et les deux cas où cela vous concerne vraiment.</p>
        </a>
      </div>
      <p class="reveal" style="text-align:center;margin-top:2rem;color:var(--bone);">Et aussi : <a href="/chanson-hommage">la chanson d’hommage, tout savoir</a> · <a href="/chanson-pour-maman-decedee">une chanson pour maman</a> · <a href="/chanson-pour-papa-decede">une chanson pour papa</a> · <a href="/musique-obseques-instrumentale">une musique sans paroles</a> · <a href="/musique-ceremonie-civile">une cérémonie civile</a></p>
    </div>
  </section>

  
  <div class="orn-portee-hote" data-orn-portee="final"></div>
  <!-- ═══ APPEL FINAL ═══ -->
  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <!-- Un seul geste en volume sur tout l'accueil : la médaille, avant
           le dernier appel. Version fixe en CSS ; la 3D ne s'y ajoute que
           sur grand écran capable (voir assets/js/lumiere-3d.js). -->
      <div class="lumiere-3d lumiere-3d-final" data-lumiere-3d role="img" aria-label="Une médaille sombre cerclée d'un filet d'or, qu'une lumière chaude effleure"></div>
      <h2 class="h-xl">Offrez-leur la chanson<br>qu'ils <em>méritaient.</em></h2>
      <span class="filet-or" data-filet="centre" aria-hidden="true"></span>
      <p class="lead" style="margin:1.6rem auto 2.4rem;">Il n'y aura pas de deuxième cérémonie. Commande en trois minutes, entretien sous vingt-quatre heures, suivi en ligne à chaque étape — et si l'œuvre ne vous touche pas, nous la reprenons.</p>
      <div class="hero-actions">
        <a href="/offres" class="btn btn-gold btn-lg">Commander un hommage</a>
        <button type="button" class="btn btn-outline btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
    </div>
  </section>`
};
