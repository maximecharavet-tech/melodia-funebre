const { ICON, MAIL } = require('./gen.js');
const P = require('./parts.js');
const { MAISONS, avecFilm } = require('./groupe.js');

/* ═══════════════════════════════════════════════════════════════
   HYPER A.I ENGINE

   Le pied de page de ce site annonce « Propulsé par Hyper A.I Engine »
   depuis le premier jour, et ce n'était cliquable nulle part. Voici la
   page qui s'ouvre.

   POURQUOI ELLE NE S'INDEXE PAS

   Ce site parle de musique funéraire à des familles en deuil, et
   treize pages ont été écrites pour que Google le comprenne. Une page
   sur une société d'architecture logicielle, sur le même domaine,
   brouille ce signal : le moteur se met à associer melodia-funebre.fr
   à « intelligence artificielle » et « venture », ce qui n'aide ni les
   familles ni le référencement des treize autres.

   Elle porte donc « noindex, follow » — les moteurs la traversent sans
   la ranger — et elle ne figure pas dans le plan du site, que
   build.js construit en excluant les pages marquées ainsi. Elle reste
   accessible à quiconque clique depuis le pied de page, ce qui est
   exactement ce qu'on lui demande.

   Le jour où Hyper A.I Engine aura son propre domaine, cette page-ci
   y déménagera et pourra s'indexer chez elle. Une ligne à changer.

   CE QU'ELLE N'INVENTE PAS

   La planche fournie porte quatre intitulés — Strategic Intelligence,
   A.I Architecture, Venture Core, System Company — sans les expliquer.
   Ils sont donc reproduits tels quels. Écrire à la place du fondateur
   ce que « Venture Core » recouvre dans sa société serait inventer des
   faits sur une entreprise réelle, et cela se vérifie en un coup de
   téléphone.
   ═══════════════════════════════════════════════════════════════ */

/* Les quatre intitulés de la planche, dans son ordre. */
const PILIERS = [
  'Strategic Intelligence',
  'A.I Architecture',
  'Venture Core',
  'System Company'
];

module.exports = {
  file: 'hyper-ai-engine.html',
  noindex: true,
  title: 'Hyper A.I Engine — la maison qui outille Melodia Funèbre',
  desc: "Hyper A.I Engine, fondée par Maxime Charavet, est la maison d'architecture logicielle d'où sortent les outils de Melodia Funèbre. Quatre maisons, une même charpente.",
  jsonld: [P.jsonldFil('Hyper A.I Engine', '/hyper-ai-engine')],
  body: `
  <section class="page-head hyper-tete">
    <div class="wrap">
      <div class="hyper-intro">
        <!-- Recadré sur l'emblème seul : l'image d'origine portait
             « HYPER A.I ENGINE / STRATEGIC A.I ARCHITECTURE / VENTURE
             CORE SYSTEM COMPANY » gravé dedans, c'est-à-dire exactement
             les mots que la page écrit en texte juste à côté. Les
             donner deux fois n'aidait personne, et un titre en image
             ne se lit ni par un moteur ni par un lecteur d'écran. -->
        <img class="hyper-embleme reveal in"
             src="assets/img/hyper/embleme-950.webp"
             srcset="assets/img/hyper/embleme-540.webp 540w, assets/img/hyper/embleme-950.webp 950w"
             sizes="(max-width: 860px) 70vw, 340px"
             width="950" height="675" decoding="async"
             alt="Emblème de Hyper A.I Engine : une étoile à quatre branches en acier bleuté, parcourue de pistes de circuit imprimé, un noyau lumineux en son centre.">
        <div>
          <div class="eyebrow reveal in">La maison qui nous outille</div>
          <h1 class="h-xl reveal in reveal-d1" style="margin-top:.8rem;">Hyper<br><em>A.I Engine.</em></h1>
          <p class="hyper-baseline reveal in reveal-d2">Strategic A.I Architecture<br><span>Venture Core System Company</span></p>
          <p class="lead reveal in reveal-d3" style="margin-top:1.4rem;max-width:56ch;">
            Au bas de chaque page de ce site, une ligne annonce « Propulsé par
            Hyper A.I Engine ». Vous venez de cliquer dessus. Voici ce que c’est :
            la maison d’architecture logicielle fondée par <b>Maxime Charavet</b>,
            d’où sortent les outils sur lesquels s’appuie la composition
            de Melodia Funèbre.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ CE QUE CELA CHANGE ICI ═══
       La seule partie qui intéresse vraiment quelqu'un arrivé depuis un
       site de musique funéraire : pourquoi cela le concerne. -->
  <section class="section section-light">
    <div class="wrap wrap-tight">
      <div class="reveal">
        <div class="eyebrow">Pourquoi cette page existe ici</div>
        <h2 class="h-xl" style="margin-top:.8rem;">L’outil n’est pas loué,<br><em>il est fabriqué.</em></h2>
        <p class="lead" style="margin-top:1.4rem;">
          La plupart des services de ce genre louent leur moteur à un tiers et
          subissent ce qu’il décide. Melodia Funèbre est dans l’autre cas : la
          maison qui fabrique l’outil et la maison qui compose ont le même
          fondateur.
        </p>
      </div>
      <div class="grid-2" style="margin-top:2.6rem;">
        <div class="carte reveal reveal-d1">
          <h3 class="h-sm">Ce que la maison peut décider</h3>
          <p style="margin-top:.7rem;">Qu’aucun hommage ne parte sans avoir été écouté en entier par quelqu’un. Ce n’est pas une option de l’outil, c’est une règle de la maison — et elle peut la tenir parce qu’elle ne dépend de personne pour l’appliquer.</p>
        </div>
        <div class="carte reveal reveal-d2">
          <h3 class="h-sm">Ce que nous continuons d’écrire</h3>
          <p style="margin-top:.7rem;">Que la composition s’appuie sur des outils de création musicale assistée. C’est dans nos <a href="/#faq">questions fréquentes</a> depuis le premier jour, et cette page ne change rien à cela — elle dit seulement d’où viennent les outils.</p>
        </div>
      </div>
      <p class="reveal" style="margin:2.2rem auto 0;max-width:58ch;text-align:center;">
        Le détail de qui fait quoi, chez Melodia, est sur
        <a href="/qui-sommes-nous">la page de la maison</a>.
      </p>
    </div>
  </section>

  <!-- ═══ LES QUATRE INTITULÉS ═══
       Reproduits tels quels : la planche ne les explique pas, et
       inventer ce qu'ils recouvrent serait écrire à la place du
       fondateur sur sa propre société. -->
  <section class="section">
    <div class="wrap">
      <div class="hyper-piliers">
        <figure class="guide-photo reveal">
          <img src="assets/img/hyper/piliers-940.webp"
               srcset="assets/img/hyper/piliers-480.webp 480w, assets/img/hyper/piliers-940.webp 940w"
               sizes="(max-width: 860px) 88vw, 400px"
               width="940" height="1672" loading="lazy" decoding="async"
               alt="Affiche de Hyper A.I Engine : une silhouette de réseau lumineux tient un noyau hexagonal au-dessus d’une Terre constellée de satellites ; à droite, quatre intitulés — Strategic Intelligence, A.I Architecture, Venture Core, System Company.">
        </figure>
        <div class="reveal reveal-d1">
          <div class="eyebrow">Les quatre axes</div>
          <h2 class="h-lg" style="margin-top:.8rem;">Ce que la maison<br><em>annonce d’elle-même.</em></h2>
          <ul class="liste-or" style="margin-top:1.8rem;">
${PILIERS.map((t) => `            <li><b>${t}</b></li>`).join('\n')}
          </ul>
          <p style="margin-top:1.6rem;color:var(--dust);font-size:.92rem;">
            Design · Innovate · Integrate · Elevate
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ LES QUATRE MAISONS ═══
       La même liste que sur « qui sommes-nous » : elle vit dans
       build/groupe.js et n'est écrite qu'une fois. -->
  <section class="section section-alt" id="maisons">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.8rem;">
        <div class="eyebrow">Le groupe</div>
        <h2 class="h-xl">Quatre maisons,<br><em>une même charpente.</em></h2>
      </div>
      <div class="maisons">
${MAISONS.map((m, i) => `        <div class="maison-carte reveal reveal-d${(i % 3) + 1}">
          <img class="maison-embleme" src="assets/img/ventures/${m.id}-640.webp"
               srcset="assets/img/ventures/${m.id}-320.webp 320w, assets/img/ventures/${m.id}-640.webp 640w"
               sizes="132px" width="640" height="${m.haut}" loading="lazy" decoding="async"
               alt="${m.alt}">
          <h3 class="h-sm">${m.nom}</h3>
          <p>${m.quoi}</p>
        </div>`).join('\n')}
      </div>

      <figure class="guide-photo reveal" style="margin-top:3rem;max-width:34rem;">
        <img src="assets/img/hyper/groupe-1024.webp"
             srcset="assets/img/hyper/groupe-540.webp 540w, assets/img/hyper/groupe-1024.webp 1024w"
             sizes="(max-width: 780px) 88vw, 520px"
             width="1024" height="1536" loading="lazy" decoding="async"
             alt="Planche du groupe Hyper A.I Engine : l’emblème en haut, puis les quatre maisons — Vigie Orbitale, Melodia Funèbre, AuthenticSeal AI et Ziggy — reliées par un arbre de liaison, au-dessus d’une Terre vue de l’espace.">
        <figcaption>La planche du groupe, telle que la maison la présente.</figcaption>
      </figure>

      <p class="reveal center" style="margin:2.6rem auto 0;max-width:54ch;color:var(--bone);font-style:italic;">
        « Unir l’intelligence artificielle, la technologie et l’humain pour construire
        un futur sûr, authentique et harmonieux. »
      </p>
    </div>
  </section>

  <!-- ═══ LES FILMS ═══
       Trois emblèmes animés, un par maison qui en a un. Ils portent du
       son : ils ne se lancent donc jamais tout seuls — contrairement à
       la boucle muette de l'atelier, qui démarre à l'entrée dans
       l'écran. Ici, « controls » et « preload=none » : rien ne quitte
       le serveur avant que quelqu'un appuie.

       Le cadre est carré pour les trois, alors que celui de Ziggy est
       vertical : c'est le seul moyen d'aligner les légendes sur une
       même ligne. Les bandes sur les côtés sont le prix à payer pour
       montrer l'image entière — le même parti que pour le kit des
       agences.

       UN SEUL FORMAT, ET C'EST MESURÉ. La vidéo de l'atelier est
       servie en WebM parce qu'il y pèse 1084 Ko contre 1229 au MP4.
       Ici c'est l'inverse, et largement : ces trois films sont pleins
       de scintillement doré, ce qui est le pire cas pour VP9. Sur
       Ziggy, ramené à 480 de large : 1737 Ko en H.264, 3795 en VP9 au
       réglage le plus dur essayé. Un encodage « léger » deux fois plus
       lourd que l'original ne sert personne — c'est exactement ce que
       refuse le garde-fou de la médiathèque. Donc MP4 seul. -->
  <section class="section" id="films">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.8rem;">
        <div class="eyebrow">En mouvement</div>
        <h2 class="h-xl">Les emblèmes,<br><em>animés.</em></h2>
        <p class="lead" style="margin:1.6rem auto 0;max-width:46rem;">
          Ils ont du son. Rien ne se lance tout seul, et rien ne se télécharge
          avant que vous appuyiez sur lecture.
        </p>
      </div>
      <div class="films">
${avecFilm().map((m, i) => `        <figure class="film reveal reveal-d${(i % 3) + 1}">
          <div class="film-cadre">
            <video controls preload="none" playsinline
                   poster="assets/img/films/${m.id}.webp"
                   aria-label="Film de présentation de ${m.nom}, ${m.film.duree} secondes, avec son.">
              <source src="assets/img/films/${m.id}.mp4" type="video/mp4">
              Votre navigateur ne sait pas lire cette vidéo.
            </video>
          </div>
          <figcaption>
            <b>${m.nom}</b>
            <span>${m.film.duree} secondes, avec son</span>
          </figcaption>
        </figure>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-lg">Vous cherchiez de la musique,<br><em>pas une société de logiciel.</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;max-width:56ch;">
        C’est le plus probable, et c’est par là qu’il faut revenir. Pour joindre
        Hyper A.I Engine, écrivez à son fondateur : <a href="mailto:${MAIL}">${MAIL}</a>.
      </p>
      <div class="hero-actions">
        <a href="/" class="btn btn-gold btn-lg">Revenir à Melodia Funèbre</a>
        <a href="/qui-sommes-nous" class="btn btn-outline btn-lg">${ICON.users} Qui sommes-nous</a>
      </div>
    </div>
  </section>
`
};
