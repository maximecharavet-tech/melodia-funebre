const { ICON, MAIL } = require('./gen.js');
const P = require('./parts.js');

const FAQ_B2B = [
  { q: "Comment sommes-nous rémunérés exactement ?", a: "Vous conservez 60 % du montant payé par la famille. Sur une offre Prestige à 299 €, votre agence garde 179,40 € et nous reverse 119,60 €. Le règlement se fait mensuellement, sur facture récapitulative." },
  { q: "Devons-nous avancer de l'argent ou acheter un stock ?", a: "Non. Aucun investissement, aucun stock, aucun abonnement, aucun minimum. Vous ne payez que sur les hommages effectivement commandés par vos familles." },
  { q: "Qui parle à la famille ?", a: "Vous restez l'interlocuteur de la famille. Vous pouvez soit saisir le brief vous-même en trois minutes depuis votre espace, soit nous transmettre le contact pour que nous menions l'entretien de cinq minutes à votre place, en votre nom." },
  { q: "Que se passe-t-il si la famille n'est pas satisfaite ?", a: "Nous reprenons la composition à nos frais. Si la famille refuse malgré tout l'œuvre, elle n'est pas facturée — et votre agence n'avance rien. Le risque commercial est intégralement de notre côté." },
  { q: "Combien de temps pour démarrer ?", a: "Vingt minutes. Vous créez votre compte partenaire, vous recevez le kit de présentation, et la première composition est offerte pour que vous puissiez la présenter à une famille avant tout engagement." },
  { q: "Y a-t-il une exclusivité territoriale ?", a: "Nous limitons volontairement le nombre d'agences partenaires par bassin de population, pour que le service reste un vrai facteur de différenciation. Demandez à être rappelé pour connaître la disponibilité de votre secteur." }
];

module.exports = {
  /* Cette page s'appelait « /agences ». Elle devient « /professionnels »
     : c'est le mot que tape un dirigeant, et celui que portent les
     campagnes. L'ancienne adresse est redirigée en 301 dans
     « vercel.json » — sans quoi les liens déjà posés et ce que Google
     a indexé partiraient à la poubelle. */
  file: 'professionnels.html',
  title: "Hommage musical pour pompes funèbres : devenir partenaire | Melodia Funèbre",
  desc: "Solution d'hommage musical pour les pompes funèbres : page hommage, QR code, 60 % de marge, aucun investissement. Demandez une démonstration.",
  jsonld: [P.jsonldFil('Pour les professionnels', '/professionnels')],
  scripts: ['assets/js/partenariat.js'],
  body: `
  <section class="section a-rosace" style="padding-top:9rem;padding-bottom:0;">
    <div class="orn-rosace-hote" data-orn-rosace="agences" data-orn-traits="3"></div>
    <div class="wrap">
      <div class="eyebrow reveal in">Melodia Funèbre pour les professionnels du funéraire</div>
      <!-- Ce titre est écrit pour Google autant que pour le lecteur :
           c'est la requête qu'un dirigeant tape, mot pour mot. -->
      <h1 class="h-hero reveal in reveal-d1">Solution d'hommage musical<br><em>pour les pompes funèbres.</em></h1>
      <!-- La promesse tient en une phrase, et c'est celle-là : ce que
           vit la famille, pas ce que gagne l'agence. La marge vient
           après — elle ne fait signer personne qui n'a pas d'abord
           compris ce qu'il va offrir. -->
      <p class="lead-fort reveal in reveal-d2" style="margin-top:1.8rem;">Une nouvelle expérience d'hommage<br><em>pour les familles que vous accompagnez.</em></p>
      <p class="lead reveal in reveal-d2" style="margin-top:1.4rem;">Une œuvre musicale composée pour leur défunt, à partir de ce qu'elles racontent de lui. Livrée en vingt-quatre heures, diffusée en cérémonie, prolongée par une page de souvenir et son QR code. Vous présentez, nous composons, vous conservez 60 %.</p>
      <div class="hero-actions reveal in reveal-d3" style="margin-top:2.4rem;">
        <a href="#partenariat" class="btn btn-gold btn-lg">Organiser une démonstration</a>
        <a href="/exemple" class="btn btn-outline btn-lg">Voir un hommage</a>
      </div>
      <p class="note" style="margin-top:1.4rem;">
        Aucun formulaire à remplir pour la démonstration · <a href="#calculateur">Simuler mes revenus</a>
      </p>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="grid-4 reveal">
        <div class="stat" style="border:1px solid var(--line-soft);border-radius:var(--radius-lg);"><div class="stat-num"><span data-count="60" data-suffix="%">60%</span></div><div class="stat-label">Marge agence</div></div>
        <div class="stat" style="border:1px solid var(--line-soft);border-radius:var(--radius-lg);"><div class="stat-num"><span data-count="0" data-suffix="€">0€</span></div><div class="stat-label">Investissement</div></div>
        <div class="stat" style="border:1px solid var(--line-soft);border-radius:var(--radius-lg);"><div class="stat-num"><span data-count="24" data-suffix="h">24h</span></div><div class="stat-label">Livraison</div></div>
        <div class="stat" style="border:1px solid var(--line-soft);border-radius:var(--radius-lg);"><div class="stat-num"><span data-count="5" data-suffix="min">5min</span></div><div class="stat-label">Brief famille</div></div>
      </div>
    </div>
  </section>

  <!-- ═══ SIMULATEUR ═══ -->
  <section class="section" id="calculateur">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Simulateur</div>
        <h2 class="h-xl">Ce que cela<br>représente <em>pour vous.</em></h2>
        <p class="lead" style="margin-top:1.4rem;">Déplacez les curseurs selon votre activité réelle. L'hypothèse retenue est prudente : une famille sur quatre retient l'hommage lorsqu'il lui est présenté.</p>
      </div>
      <div class="calc reveal" data-calc>
        <div class="calc-row">
          <div class="calc-head">
            <label for="calc-volume">Obsèques organisées par mois</label>
            <span class="calc-val" id="calc-volume-val">20 obsèques / mois</span>
          </div>
          <input type="range" class="calc-range" id="calc-volume" min="2" max="120" value="20" step="1">
        </div>
        <div class="calc-row">
          <div class="calc-head">
            <label for="calc-price">Offre habituellement présentée</label>
            <span class="calc-val" id="calc-price-val">299 €</span>
          </div>
          <input type="range" class="calc-range" id="calc-price" min="149" max="499" value="299" step="1">
        </div>
        <div class="calc-out">
          <div class="calc-cell"><div class="calc-cell-num" id="calc-out-ventes">5</div><div class="calc-cell-lbl">Hommages<br>par mois</div></div>
          <div class="calc-cell"><div class="calc-cell-num" id="calc-out-mois">897 €</div><div class="calc-cell-lbl">Marge nette<br>mensuelle</div></div>
          <div class="calc-cell"><div class="calc-cell-num" id="calc-out-an">10 764 €</div><div class="calc-cell-lbl">Marge nette<br>annuelle</div></div>
        </div>
        <p class="note">
          Estimation indicative · marge de 60 % · taux de prise retenu : 25 %<br>Ne constitue pas un engagement contractuel
        </p>
      </div>
      <div class="center reveal" style="margin-top:2.5rem;">
        <a href="/compte" class="btn btn-gold btn-lg">Créer mon compte partenaire</a>
      </div>
    </div>
  </section>

  <!-- ═══ POURQUOI PROPOSER MELODIA ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Sept raisons, une seule question</div>
        <h2 class="h-xl">Pourquoi votre agence devrait<br>proposer <em>Melodia Funèbre</em> ?</h2>
      </div>
      <div class="grid-3">
        <div class="card card-lift reveal"><div class="card-icon">${ICON.users}</div><h3 class="h-lg">Différenciation</h3><p>Trois agences se partagent la même ville et le même catalogue de cercueils. Celle qui fait entendre une chanson écrite pour le défunt devient celle qu'on recommande à la sortie. Nous limitons volontairement le nombre de partenaires par bassin de population, pour que l'avantage reste un avantage.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.heart}</div><h3 class="h-lg">Une expérience émotionnelle</h3><p>Aux obsèques, la musique n'a presque jamais connu le défunt. Un Ave Maria pour une grand-mère qui ne chantait qu'en cuisine. Ici, la salle entend son prénom, son métier, ses manies. C'est le seul moment de la cérémonie que les familles n'avaient pas pu rendre personnel.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.clock}</div><h3 class="h-lg">Aucun travail de production</h3><p>Vous présentez, nous produisons. Entretien, écriture, composition, mixage, relecture humaine, livraison : tout est de notre côté. Rien à installer, aucune compétence musicale requise, et aucune démarche SACEM — chaque œuvre est originale et cédée avec ses droits d'usage.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.ecran}</div><h3 class="h-lg">Une solution digitale</h3><p>Un espace partenaire, pas un classeur. Vous saisissez le brief en trois minutes, vous suivez l'avancement, vous faites écouter le catalogue en rendez-vous et vous retrouvez votre récapitulatif de fin de mois. Rien à installer : cela s'ouvre dans le navigateur, y compris sur le téléphone du conseiller.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.qr}</div><h3 class="h-lg">Le QR code</h3><p>L'hommage ne s'arrête pas au jour de la cérémonie. Un code à faire graver sur la plaque ou le monument ouvre une page où l'œuvre se joue, avec les mots de la famille et ses photos. Un petit-enfant qui passera au cimetière dans quinze ans entendra la chanson de son grand-père.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.phone}</div><h3 class="h-lg">L'accompagnement de la famille</h3><p>Cinq questions, cinq minutes : nous menons l'entretien, ou vous le menez vous-même. La famille garde ensuite son espace, où elle écoute, télécharge, ajoute ses photos et publie sa page quand elle le décide. Si l'œuvre ne touche pas, elle est reprise à nos frais.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.euro}</div><h3 class="h-lg">Un vrai partenariat</h3><p>Vous conservez 60 % du montant payé par la famille, soit 179 € nets sur une offre Prestige. Aucun investissement, aucun stock, aucun minimum, aucun engagement de durée. La première composition est offerte, et vous parlez au fondateur — pas à une plateforme.</p></div>
      </div>      </div>
    </div>
  </section>

${P.chaineQR({ clair: false })}


  <!-- ═══ COMMENT ÇA MARCHE ═══ -->
  <section class="section">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:3.5rem;">
        <div class="eyebrow">Le partenariat</div>
        <h2 class="h-xl">Vingt minutes<br>pour <em>démarrer.</em></h2>
      </div>
      <div class="steps">
        <div class="step reveal"><div class="step-dot">1</div><div class="step-body"><h3>Vous créez votre compte partenaire</h3><p>Trois minutes, aucune pièce justificative à ce stade. Vous accédez immédiatement à votre tableau de bord.</p><span class="step-time">3 minutes</span></div></div>
        <div class="step reveal"><div class="step-dot">2</div><div class="step-body"><h3>Vous recevez le kit de présentation</h3><p>Une plaquette à remettre aux familles, un argumentaire court, et les {{HOMMAGES}} hommages de démonstration à faire écouter en rendez-vous.</p><span class="step-time">Immédiat</span></div></div>
        <div class="step reveal"><div class="step-dot">3</div><div class="step-body"><h3>Nous composons votre première œuvre, offerte</h3><p>Sur la prochaine famille qui vous le demande. Vous présentez un hommage réel, pas une promesse commerciale.</p><span class="step-time">24 heures</span></div></div>
        <div class="step reveal"><div class="step-dot">4</div><div class="step-body"><h3>Vous présentez, la famille décide</h3><p>Trente secondes suffisent en rendez-vous : « Nous pouvons faire composer une chanson originale pour lui, livrée avant la cérémonie. » Puis vous faites écouter.</p><span class="step-time">30 secondes</span></div></div>
        <div class="step reveal"><div class="step-dot">5</div><div class="step-body"><h3>Vous saisissez le brief, ou vous nous passez le relais</h3><p>Trois minutes depuis votre espace, ou vous nous transmettez le contact et nous menons l'entretien en votre nom.</p><span class="step-time">3 minutes</span></div></div>
        <div class="step reveal"><div class="step-dot">6</div><div class="step-body"><h3>Vous encaissez votre marge</h3><p>Facture récapitulative mensuelle. Vous conservez 60 %, nous facturons les 40 % restants. Aucun minimum, aucun engagement de durée.</p><span class="step-time">Mensuel</span></div></div>
      </div>
    </div>
  </section>

  <!-- ═══ TÉMOIGNAGE PRO ═══ -->
  <section class="section section-light">
    <div class="wrap-tight center reveal">
      <div class="eyebrow" style="justify-content:center;">Ils l'ont fait</div>
      <p style="font-family:var(--ff-d);font-style:italic;font-size:clamp(1.4rem,3vw,2.1rem);line-height:1.45;color:var(--ivory-ink);margin-top:1.6rem;">« En trente ans de métier, je n'avais jamais vu une famille redemander la musique trois fois après la cérémonie. Depuis, je le propose à chaque premier rendez-vous. »</p>
      <div class="mono" style="margin-top:1.6rem;">Directeur d'agence de pompes funèbres — Lyon</div>
    </div>
  </section>

  <section class="section">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.5rem;">
        <div class="eyebrow">Questions des professionnels</div>
        <h2 class="h-xl">Ce que les agences<br>nous <em>demandent.</em></h2>
      </div>
      <div class="reveal">
${P.faq(FAQ_B2B)}
      </div>
    </div>
  </section>

  <!-- ═══ POURQUOI PROPOSER ═══
       Six cartes, pas douze : au-delà, on ne lit plus, on survole. -->
  <section class="section">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.8rem;">
        <div class="eyebrow">L'intérêt pour votre agence</div>
        <h2 class="h-xl">Pourquoi proposer<br><em>Melodia Funèbre ?</em></h2>
      </div>
      <div class="pq-grille">
        <article class="pq reveal"><span class="pq-ico" aria-hidden="true">♪</span>
          <h3>Une expérience mémorable</h3>
          <p>Transformez un hommage en souvenir musical durable. La famille repart avec une œuvre, pas avec un souvenir qui s'efface.</p></article>
        <article class="pq reveal"><span class="pq-ico" aria-hidden="true">◈</span>
          <h3>Un service différenciant</h3>
          <p>Proposez aux familles une expérience que les autres agences funéraires ne proposent pas. C'est souvent ce qui décide du choix d'une maison.</p></article>
        <article class="pq reveal"><span class="pq-ico" aria-hidden="true">✧</span>
          <h3>Simple pour vos équipes</h3>
          <p>Vous ne gérez aucune production musicale. Un brief de cinq minutes, ou un simple contact transmis, et nous nous occupons du reste.</p></article>
        <article class="pq reveal"><span class="pq-ico" aria-hidden="true">✎</span>
          <h3>Une solution personnalisée</h3>
          <p>Chaque hommage est créé autour de l'histoire du défunt : son métier, ses gestes, ses habitudes, ce que sa famille raconte de lui.</p></article>
        <article class="pq reveal"><span class="pq-ico" aria-hidden="true">◷</span>
          <h3>Un souvenir qui reste</h3>
          <p>La famille conserve la musique et retrouve l'hommage dans le temps. Un anniversaire, une Toussaint : l'œuvre est toujours là.</p></article>
        <article class="pq reveal"><span class="pq-ico" aria-hidden="true">▦</span>
          <h3>Une expérience digitale</h3>
          <p>Page hommage, écoute en ligne et QR code à graver sur une plaque. Le numérique au service du recueillement, pas l'inverse.</p></article>
      </div>
    </div>
  </section>

  <!-- ═══ LE PARCOURS DE LA FAMILLE ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Ce que vit la famille</div>
        <h2 class="h-xl">Quatre étapes,<br><em>et rien à porter.</em></h2>
      </div>
      <ol class="parcours">
        <li class="parcours-e reveal" style="--i:0">
          <span class="parcours-n">01</span>
          <h3>La famille raconte son histoire</h3>
          <p>Un entretien de cinq minutes, au téléphone ou dans vos bureaux. Son prénom, trois traits de caractère, son métier, une habitude. Rien de plus.</p>
        </li>
        <li class="parcours-e reveal" style="--i:1">
          <span class="parcours-n">02</span>
          <h3>Melodia Funèbre crée l'hommage</h3>
          <p>Paroles écrites pour elle seule, musique composée dans le style choisi. Livré en vingt-quatre heures, révisé jusqu'à ce que la famille s'y reconnaisse.</p>
        </li>
        <li class="parcours-e reveal" style="--i:2">
          <span class="parcours-n">03</span>
          <h3>Elle reçoit sa mélodie et sa page hommage</h3>
          <p>Le fichier à garder, et une page en ligne avec le portrait, les dates, les paroles et le lecteur. À partager avec ceux qui n'ont pas pu venir.</p>
        </li>
        <li class="parcours-e reveal" style="--i:3">
          <span class="parcours-n">04</span>
          <h3>Le QR code permet de retrouver l'hommage</h3>
          <p>Gravé sur une plaque que votre agence réalise. On le scanne sur le lieu de repos, et la musique se met à jouer, là, devant elle.</p>
        </li>
      </ol>
      <div class="center reveal" style="margin-top:2.6rem;">
        <a href="/exemple" class="btn btn-outline btn-lg">Voir la page que reçoit la famille</a>
      </div>
    </div>
  </section>

  <!-- ═══ LES SUPPORTS DU CODE ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.6rem;">
        <div class="eyebrow">Le code</div>
        <h2 class="h-xl">Un QR code pour<br>retrouver <em>son histoire.</em></h2>
        <p class="lead" style="margin:1.6rem auto 0;max-width:42rem;">Nous fournissons le fichier de gravure, en vectoriel et au format de la plaque. Votre agence choisit le support et le réalise.</p>
      </div>
      <figure class="guide-photo reveal" style="margin-bottom:2.4rem;">
        <picture>
          <source type="image/webp" srcset="assets/img/plaque-qr-700.webp 700w, assets/img/plaque-qr-1100.webp 1100w" sizes="(max-width: 760px) 92vw, 560px">
          <img src="assets/img/plaque-qr-700.jpg"
               srcset="assets/img/plaque-qr-700.jpg 700w, assets/img/plaque-qr-1100.jpg 1100w"
               sizes="(max-width: 760px) 92vw, 560px"
               width="700" height="971" loading="lazy" decoding="async"
               alt="Plaque de granit noir gravée d'un QR code, posée sur une sépulture entre une bougie et des lys blancs.">
        </picture>
        <figcaption>Le fichier de gravure est fourni en vectoriel, aux dimensions de la plaque.</figcaption>
      </figure>
      <div class="supports">
        <div class="support reveal"><b>Plaque commémorative</b><span>Granit, laiton ou inox, posée près de la sépulture.</span></div>
        <div class="support reveal"><b>Carte souvenir</b><span>Remise aux proches le jour de la cérémonie.</span></div>
        <div class="support reveal"><b>Livret de cérémonie</b><span>En dernière page, près du mot de la famille.</span></div>
        <div class="support reveal"><b>Urne</b><span>Discrètement gravé sous la base ou au dos.</span></div>
        <div class="support reveal"><b>Faire-part</b><span>Pour ceux qui n'ont pas pu se déplacer.</span></div>
        <div class="support reveal"><b>Votre propre support</b><span>Nous fournissons le fichier, vous décidez de la forme.</span></div>
      </div>
    </div>
  </section>

  <!-- ═══ L'ARGUMENT DU DIRIGEANT ═══
       Le ton compte plus que le fond ici : le contexte est celui du
       deuil, et une page qui parle de « nouveau relais de croissance »
       ferait fermer l'onglet à un homme de métier. -->
  <section class="section section-light">
    <div class="wrap-tight">
      <div class="reveal">
        <div class="eyebrow">Pour le dirigeant</div>
        <h2 class="h-xl">Une nouvelle source de valeur<br>pour <em>votre agence.</em></h2>
        <p class="lead" style="margin:1.8rem 0 2rem;">Nous n'allons pas vous promettre des chiffres. Ce que nous pouvons dire tient en cinq points, et chacun se vérifie dès les premières familles.</p>
        <ul class="valeur">
          <li><b>Différencier votre accompagnement</b> — là où toutes les maisons proposent les mêmes prestations, vous proposez quelque chose qui n'existe pas ailleurs.</li>
          <li><b>Enrichir votre offre</b> — sans stock, sans formation, sans matériel, et sans rien avancer.</li>
          <li><b>Proposer un service émotionnel supplémentaire</b> — une famille qui repart avec une œuvre s'en souvient longtemps, et le dit.</li>
          <li><b>Créer une expérience moderne</b> — page en ligne et QR code, pour des familles qui vivent déjà comme ça.</li>
          <li><b>Renforcer votre image de marque</b> — c'est souvent le détail qu'on raconte autour de soi après des obsèques.</li>
        </ul>
        <p class="valeur-note">Nous ne présentons pas cela comme une opportunité commerciale à saisir. C'est un service de plus à rendre à des familles en deuil, qui se trouve être aussi une source de marge.</p>
      </div>
    </div>
  </section>

  <!-- ═══ LA CONFIANCE ═══
       Aucune donnée réelle n'existe encore : le lancement commercial
       n'a pas eu lieu. Inventer un avis, un chiffre ou un logo de
       partenaire serait la pire chose à faire sur un marché où tout le
       monde se connaît. Les emplacements sont posés et marqués, prêts
       à recevoir du vrai.

       À REMPLACER — chercher « PLACEHOLDER » dans ce fichier. -->
  <section class="section">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.4rem;">
        <div class="eyebrow">Ce que nous pouvons prouver aujourd'hui</div>
        <h2 class="h-xl">Nous préférons<br>ne rien <em>inventer.</em></h2>
        <p class="lead" style="margin:1.6rem auto 0;max-width:44rem;">Melodia Funèbre ouvre son réseau de partenaires. Nous n'afficherons ni avis fabriqués, ni logos d'agences qui n'ont rien signé, ni chiffres qui n'existent pas. Ce que vous pouvez vérifier, en revanche :</p>
      </div>
      <div class="preuves">
        <div class="preuve reveal"><b>Écoutez le catalogue</b><span>Des hommages réellement composés, écoutables en entier, sans inscription.</span><a href="/demos">Écouter →</a></div>
        <div class="preuve reveal"><b>Voyez la page famille</b><span>La démonstration complète, telle qu'une famille la reçoit.</span><a href="/exemple">Voir un hommage →</a></div>
        <div class="preuve reveal"><b>Parlez au fondateur</b><span>Pas à un commercial. Maxime Charavet répond lui-même.</span><a href="#partenariat">Demander un rappel →</a></div>
      </div>
      <!-- PLACEHOLDER — avis d'agences partenaires.
           Décommenter et remplir dès qu'une agence a accepté d'être
           citée, par écrit. Structure prête : .temoignages > .temoignage
           avec <blockquote>, <cite> et le nom de l'agence.
      <div class="temoignages"></div>
      -->
      <!-- PLACEHOLDER — chiffres clés (agences partenaires, hommages
           livrés, familles accompagnées). Ne rien afficher tant que les
           nombres ne sont pas réels et vérifiables. -->
    </div>
  </section>

  <!-- ═══ LES CONDITIONS, ET LA DEMANDE ═══
       Cette section porte l'ancre « #partenariat » : c'est là que
       mènent tous les boutons « Devenir partenaire » du site. -->
  <section class="section section-top" id="partenariat">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.8rem;">
        <div class="eyebrow">Conditions professionnelles</div>
        <h2 class="h-xl">Devenir<br><em>partenaire.</em></h2>
        <p class="lead" style="margin:1.6rem auto 0;max-width:44rem;">Aucun investissement, aucun stock, aucun minimum. Vous ne réglez que les hommages effectivement commandés par vos familles.</p>
      </div>

      <div class="part-duo">
        <!-- Ce bloc disait « vous conservez la majeure partie » et
             « grille de prix conseillés », par prudence de négociation.
             Or la page annonce « 60 % » huit fois plus haut, avec les
             montants nets, et /offres publie les trois tarifs. Le flou
             ne protégeait donc rien : il arrivait seulement à l'endroit
             où le dirigeant s'engage, et une imprécision à cet endroit
             se lit « les vraies conditions seront moins bonnes ». On
             répète ici, mot pour mot, ce que le reste du site promet.
             Seule la disponibilité du secteur reste « sur demande » :
             celle-là varie pour de vrai. -->
        <div class="part-conditions reveal">
          <h3 class="part-titre">Ce qui est convenu</h3>
          <ul class="part-liste">
            <li><b>Marge agence</b><span>60 % du montant réglé par la famille, sur chaque hommage. C'est le même taux pour les trois offres et pour les options.</span></li>
            <li><b>Ce que cela fait</b><span>89 € nets sur l'offre Essentiel à 149 €, 179 € sur Prestige à 299 €, 299 € sur Mémorial à 499 €.</span></li>
            <li><b>Options</b><span>Version longue, instruments rares, langue étrangère, plaque à QR code à 79 € — même taux.</span></li>
            <li><b>Règlement</b><span>Mensuel, sur facture récapitulative. Aucun investissement, aucun stock, aucun minimum, aucun engagement de durée.</span></li>
            <li><b>Exclusivité</b><span>Un nombre limité d'agences par bassin de population. La disponibilité de votre secteur se vérifie en un appel.</span></li>
          </ul>
          <p class="part-note">Ces conditions sont les mêmes pour tout le monde : il n'y a pas de grille cachée, et rien ne dépend du volume que vous ferez.</p>
          <div class="part-supports">
            <span class="eyebrow">Ce que nous fournissons</span>
            <ul>
              <li>Kit de présentation pour vos conseillers</li>
              <li>Première composition offerte, à présenter à une famille</li>
              <li>Fichier de gravure pour la plaque à QR code</li>
              <li>Accès à votre espace partenaire en ligne</li>
            </ul>
          </div>
        </div>

        <!-- Six champs, pas douze : chaque champ supplémentaire coûte
             des demandes. Le reste se dit au téléphone. -->
        <form class="part-form reveal" id="form-partenariat" novalidate>
          <h3 class="part-titre">Votre demande</h3>

          <div class="field">
            <span class="field-label">Je souhaite</span>
            <div class="part-choix" role="radiogroup" aria-label="Objet de votre demande">
              <label><input type="radio" name="objet" value="Demander une démonstration" checked><span>Une démonstration</span></label>
              <label><input type="radio" name="objet" value="Devenir partenaire"><span>Devenir partenaire</span></label>
              <label><input type="radio" name="objet" value="Recevoir les informations professionnelles"><span>Les informations</span></label>
            </div>
          </div>

          <div class="field-row">
            <div class="field"><label class="field-label" for="pt-societe">Nom de l'entreprise *</label>
              <input class="field-input" id="pt-societe" name="societe" autocomplete="organization" required></div>
            <div class="field"><label class="field-label" for="pt-contact">Nom du contact *</label>
              <input class="field-input" id="pt-contact" name="contact" autocomplete="name" required></div>
          </div>
          <div class="field-row">
            <div class="field"><label class="field-label" for="pt-email">Email professionnel *</label>
              <input class="field-input" id="pt-email" name="email" type="email" autocomplete="email" inputmode="email" required></div>
            <div class="field"><label class="field-label" for="pt-tel">Téléphone *</label>
              <input class="field-input" id="pt-tel" name="tel" type="tel" autocomplete="tel" inputmode="tel" required></div>
          </div>
          <div class="field"><label class="field-label" for="pt-ville">Ville *</label>
            <input class="field-input" id="pt-ville" name="ville" autocomplete="address-level2" required></div>
          <div class="field"><label class="field-label" for="pt-message">Message</label>
            <textarea class="field-area" id="pt-message" name="message" rows="3" placeholder="Votre volume annuel, vos questions, vos contraintes."></textarea></div>

          <div class="form-msg" id="pt-msg"></div>
          <button type="submit" class="btn btn-gold btn-block btn-lg" id="pt-envoyer">Envoyer ma demande</button>
          <p class="part-rgpd">Vos coordonnées servent uniquement à répondre à cette demande. Elles ne sont ni revendues, ni utilisées pour autre chose. Voir notre <a href="/confidentialite">politique de confidentialité</a>.</p>
        </form>
      </div>
    </div>
  </section>

  <section class="section" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">Votre secteur est-il<br>encore <em>libre ?</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;">Nous limitons le nombre d'agences partenaires par bassin de population. Un appel de trois minutes suffit à le savoir.</p>
      <div class="hero-actions">
        <button type="button" class="btn btn-gold btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
        <a href="mailto:${MAIL}?subject=Partenariat%20agence" class="btn btn-outline btn-lg">Écrire au fondateur</a>
      </div>
    </div>
  </section>`
};
