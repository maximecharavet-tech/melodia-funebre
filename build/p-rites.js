const { ICON } = require('./gen.js');
const P = require('./parts.js');

/* ═══════════════════════════════════════════════════════════════
   L'hommage selon le rite.

   Chaque tradition a ses règles sur la musique aux obsèques, et
   elles ne se ressemblent pas. Prétendre « mettre les textes sacrés
   en musique » pour tout le monde serait à la fois faux et blessant :
   la prière funéraire musulmane n'a pas de musique, l'office orthodoxe
   n'admet pas d'instrument, l'enterrement juif traditionnel non plus.

   Cette page dit donc, tradition par tradition, ce que la maison
   propose et ce qu'elle ne propose pas. C'est la seule posture qui
   permette de frapper à la porte d'une paroisse, d'une mosquée ou
   d'une synagogue sans se faire refermer la porte au nez.
   ═══════════════════════════════════════════════════════════════ */

const TRADITIONS = [
  {
    id: 'catholique',
    nom: 'Catholique',
    tenue: 'La musique a sa place dans la liturgie',
    resume: "L'office des funérailles fait une large place au chant. Une œuvre composée pour le défunt peut y prendre place, aux côtés des chants propres à la célébration.",
    oui: [
      "Une pièce chantée pour l'entrée, l'offertoire, la communion ou le dernier adieu.",
      "Une composition sur un psaume, un texte de l'Écriture ou une prière que le défunt aimait.",
      "Une version instrumentale seule, pour un temps de recueillement.",
      "Un enregistrement remis à la famille, à écouter bien après la cérémonie."
    ],
    non: [
      "Rien ne remplace les chants propres à la liturgie : notre pièce s'y ajoute, elle ne s'y substitue pas.",
      "Le célébrant a le dernier mot. Nous lui soumettons le texte et l'enregistrement avant la cérémonie, toujours."
    ],
    mot: "« In paradisum deducant te angeli. » Les mots sont anciens ; la voix qui les porte peut parler de cette personne-là."
  },
  {
    id: 'protestant',
    nom: 'Protestant',
    tenue: 'Le témoignage personnel est au centre',
    resume: "Réformés, luthériens, évangéliques : le culte d'action de grâce laisse une grande liberté au témoignage et au chant. C'est la tradition où notre travail trouve le plus naturellement sa place.",
    oui: [
      "Une composition bâtie sur le verset biblique qui accompagnait la vie du défunt.",
      "Un chant nouveau, dans l'esprit des cantiques, écrit à partir de ce que la famille raconte.",
      "Une pièce pour le temps de recueillement ou la sortie.",
      "Une version que l'assemblée peut reprendre, si le pasteur le souhaite."
    ],
    non: [
      "Nous n'écrivons pas de prédication : le message revient au pasteur, la musique l'accompagne."
    ],
    mot: "Un verset, quelques mots d'une vie, et un chant que personne n'avait entendu avant ce jour-là."
  },
  {
    id: 'orthodoxe',
    nom: 'Orthodoxe',
    tenue: 'Le chant, oui — les instruments, non',
    resume: "L'office des défunts est chanté a cappella dans la plupart des Églises orthodoxes. L'instrument n'y a pas sa place, et nous n'essaierons pas de l'y introduire.",
    oui: [
      "Une pièce purement vocale, sans aucun instrument, dans l'esprit du chant liturgique.",
      "Un enregistrement remis à la famille, pour la mémoire et les commémoraisons.",
      "Une composition destinée au repas de mémoire ou à un temps hors de l'office."
    ],
    non: [
      "Aucune pièce instrumentale pendant l'office. Si c'est ce que vous cherchez, nous vous le dirons.",
      "Rien ne se substitue aux Mémoires éternelles ni aux tropaires : ils appartiennent à l'office."
    ],
    mot: "Ici, notre travail est modeste : une voix, et rien d'autre."
  },
  {
    id: 'juif',
    nom: 'Juif',
    tenue: 'Pas de musique à l\'enterrement — mais la mémoire a d\'autres temps',
    resume: "L'enterrement traditionnel ne comporte pas de musique instrumentale : le El Malé Rahamim est cantillé par l'officiant. Les temps de mémoire qui suivent, eux, peuvent en accueillir — dans les communautés qui le pratiquent, et avec l'accord du rabbin.",
    oui: [
      "Une composition pour la chiva, la azkara ou un dévoilement de stèle, si la famille et le rabbin le souhaitent.",
      "Une pièce vocale sobre, construite sur ce que la famille raconte du défunt.",
      "Un enregistrement de mémoire, remis à la famille, sans destination liturgique.",
      "Une œuvre pour un hommage civil tenu à côté de la cérémonie religieuse."
    ],
    non: [
      "Aucune musique pour l'enterrement lui-même : ce n'est pas notre place.",
      "Nous ne mettons pas en musique un texte liturgique sans l'accord explicite du rabbin de la communauté."
    ],
    mot: "Le silence a sa fonction dans ce rite. Nous le respectons, et nous proposons ailleurs."
  },
  {
    id: 'musulman',
    nom: 'Musulman',
    tenue: 'La prière funéraire n\'a pas de musique',
    resume: "La salat al-janaza ne comporte ni chant ni instrument, et la récitation coranique n'est pas de la musique. Nous ne proposerons donc jamais de composition musicale pour les funérailles, ni de mise en musique du Coran. Ce que nous pouvons offrir est autre chose, et c'est dit franchement.",
    oui: [
      "Un hommage parlé, sans musique : un texte écrit à partir des mots de la famille, lu ou enregistré sobrement.",
      "Un récit de vie remis aux proches, à garder et à transmettre aux enfants.",
      "Une composition pour un hommage civil, si la famille en organise un séparément — et seulement à sa demande."
    ],
    non: [
      "Aucune musique pendant la janaza, ni avant, ni pendant, ni au cimetière.",
      "Aucune mise en musique du Coran, sous aucune forme. La récitation appartient aux récitants.",
      "Si la famille ne souhaite rien d'autre que le rite, c'est une réponse entière et nous nous retirons."
    ],
    mot: "Une maison qui ne connaît pas le rite finit par le heurter. Nous préférons dire non que mal faire."
  },
  {
    id: 'laique',
    nom: 'Civil et laïque',
    tenue: 'Toute la liberté, et donc toute la responsabilité',
    resume: "Une cérémonie civile n'a pas de cadre imposé : c'est à la famille de tout choisir. C'est aussi le moment où une œuvre écrite pour la personne prend le plus de place, faute d'un rite qui la porte.",
    oui: [
      "Une composition libre, dans n'importe quel registre, sur la vie de la personne.",
      "Une pièce qui reprend une chanson qu'il aimait sans la copier — ses paroles à lui, sa musique à elle.",
      "Un texte lu, si la famille préfère la parole au chant.",
      "Un mini-album, pour les familles qui veulent plusieurs moments."
    ],
    non: [
      "Nous ne reprenons jamais une œuvre existante : ce serait un droit à payer, et une émotion empruntée."
    ],
    mot: "Quand rien n'est prescrit, tout devient un choix. Nous aidons la famille à le faire."
  }
];

module.exports = {
  file: 'rites.html',
  title: 'L\'hommage selon le rite — Traditions religieuses et cérémonies civiles | Melodia Funèbre',
  desc: "Comment notre travail s'accorde à chaque tradition : catholique, protestante, orthodoxe, juive, musulmane, ou cérémonie civile. Ce que nous composons, et ce que nous ne composons pas.",
  scripts: [],
  jsonld: [P.jsonldFil('Rites et traditions', '/rites')],
  body: `
  <section class="page-head">
    <div class="wrap">
      <div class="eyebrow reveal in">Rites et traditions</div>
      <h1 class="h-xl reveal in reveal-d1" style="margin-top:.8rem;">La musique sert le rite,<br><em>jamais l'inverse.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.4rem;max-width:64ch;">Chaque tradition a ses règles sur la musique aux obsèques, et elles ne se ressemblent pas. Prétendre mettre les textes sacrés en musique pour tout le monde serait à la fois faux et blessant. Voici donc, tradition par tradition, ce que nous proposons — et ce que nous refusons de faire.</p>
    </div>
  </section>

  <!-- ═══ LE PRINCIPE ═══ -->
  <section class="section-sm a-rosace" style="padding-top:2.6rem;">
    <div class="orn-rosace-hote" data-orn-rosace="rites" data-orn-traits="3"></div>
    <div class="wrap">
      <div class="grid-3">
        <div class="card reveal">
          <div class="card-icon">${ICON.shield}</div>
          <h3 class="h-lg">Le célébrant décide</h3>
          <p>Prêtre, pasteur, rabbin, imam, officiant : le texte et l'enregistrement lui sont soumis avant la cérémonie. S'il dit non, il a raison et nous nous retirons.</p>
        </div>
        <div class="card reveal">
          <div class="card-icon">${ICON.pen}</div>
          <h3 class="h-lg">Les mots viennent de vous</h3>
          <p>Nous n'inventons rien sur la foi du défunt. Le verset, la prière ou le psaume qui compte, c'est la famille qui le donne — nous l'entourons, nous ne le remplaçons pas.</p>
        </div>
        <div class="card reveal">
          <div class="card-icon">${ICON.heart}</div>
          <h3 class="h-lg">Savoir dire non</h3>
          <p>Il y a des rites où la musique n'a pas sa place. Nous le disons avant de vous prendre le moindre euro, plutôt que d'apprendre à une famille le jour même que nous nous étions trompés.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ TRADITION PAR TRADITION ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.6rem;">
        <div class="eyebrow">Tradition par tradition</div>
        <h2 class="h-xl">Ce que nous faisons,<br>ce que nous <em>ne faisons pas.</em></h2>
      </div>

${TRADITIONS.map((t) => `      <article class="rite reveal" id="${t.id}">
        <div class="rite-tete">
          <h3 class="rite-nom">${t.nom}</h3>
          <span class="rite-tenue">${t.tenue}</span>
        </div>
        <p class="rite-resume">${t.resume}</p>
        <div class="rite-listes">
          <div class="rite-oui">
            <div class="rite-label">Ce que nous proposons</div>
            <ul>
${t.oui.map((x) => `              <li>${x}</li>`).join('\n')}
            </ul>
          </div>
          <div class="rite-non">
            <div class="rite-label">Ce que nous ne ferons pas</div>
            <ul>
${t.non.map((x) => `              <li>${x}</li>`).join('\n')}
            </ul>
          </div>
        </div>
        <p class="rite-mot">${t.mot}</p>
      </article>`).join('\n\n')}

      <p class="center reveal note" style="margin-top:2.4rem;max-width:70ch;margin-inline:auto;">
        Cette page décrit notre pratique, pas une doctrine. Les usages varient d'une communauté à l'autre,
        parfois d'une paroisse à la suivante : votre célébrant reste seul juge de ce qui convient chez lui.
      </p>
    </div>
  </section>

  <!-- ═══ LES TEXTES SACRÉS ═══ -->
  <section class="section section-light">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.4rem;">
        <div class="eyebrow">Les textes</div>
        <h2 class="h-xl">Un verset, et <em>une vie.</em></h2>
        <p class="lead" style="margin-top:1.4rem;">Là où la tradition l'admet, l'œuvre se construit autour du texte qui comptait pour le défunt. Ce n'est pas un décor : c'est la colonne qui tient le reste.</p>
      </div>
      <div class="grid-2" style="gap:2rem;">
        <div class="card reveal">
          <div class="mono">Ce que la famille donne</div>
          <p style="font-family:var(--ff-d);font-style:italic;font-size:1.2rem;color:var(--ivory-ink);margin-top:.8rem;line-height:1.55;">« Il lisait le psaume 23 tous les dimanches. Et il disait toujours : je ne manquerai de rien. »</p>
        </div>
        <div class="card reveal">
          <div class="mono">Ce que ça devient</div>
          <p style="font-family:var(--ff-d);font-style:italic;font-size:1.2rem;color:var(--ivory-ink);margin-top:.8rem;line-height:1.55;">« Tu ne manquais de rien / Et tu nous l'as appris / À la table du dimanche / Où tu servais d'abord les autres »</p>
        </div>
      </div>
      <p class="center reveal" style="margin-top:2rem;font-size:.92rem;color:var(--ivory-soft);line-height:1.8;max-width:66ch;margin-inline:auto;">
        Le texte sacré n'est pas modifié : il est cité, ou il inspire les mots qui l'entourent.
        Les traductions liturgiques récentes restent protégées par le droit d'auteur — nous nous en tenons
        aux versions libres de droits, ou nous demandons l'autorisation avant de citer.
      </p>
    </div>
  </section>

  <!-- ═══ POUR LES COMMUNAUTÉS ═══ -->
  <section class="section" id="communautes">
    <div class="wrap">
      <div class="grid-2" style="gap:3.5rem;align-items:center;">
        <div class="reveal">
          <div class="eyebrow">Paroisses, diocèses, associations cultuelles</div>
          <h2 class="h-xl">Un service à proposer,<br>des <em>œuvres</em> à financer.</h2>
          <p class="lead" style="margin-top:1.6rem;">Les familles vous demandent souvent une musique qui ressemble vraiment au défunt, et vous n'avez rien à leur offrir que le répertoire. Nous composons cette pièce ; vous restez l'interlocuteur de la famille et le garant du rite.</p>
          <p class="lead" style="margin-top:1.2rem;">La part qui vous revient — 60 % du montant — peut être affectée en totalité à vos œuvres : entraide, aumônerie, entretien du lieu, action caritative. Vous nous dites où elle va, nous la versons là.</p>
          <div class="hero-actions" style="margin-top:2rem;">
            <a href="/contact" class="btn btn-gold">Prendre contact</a>
            <button type="button" class="btn btn-outline" data-rappel>${ICON.phone} Être rappelé</button>
          </div>
        </div>
        <div class="reveal reveal-d1">
          <div class="grid-2" style="gap:1rem;">
            <div class="card"><div class="stat-num" style="font-size:2.4rem;"><span data-count="60" data-suffix="%">60%</span></div><div class="stat-label">Reversés à la communauté</div></div>
            <div class="card"><div class="stat-num" style="font-size:2.4rem;"><span data-count="0" data-suffix="€">0€</span></div><div class="stat-label">Investissement</div></div>
            <div class="card"><div class="stat-num" style="font-size:2.4rem;"><span data-count="24" data-suffix="h">24h</span></div><div class="stat-label">De la demande à l'œuvre</div></div>
            <div class="card"><div class="stat-num" style="font-size:2.4rem;">1<sup style="font-size:.9rem;">re</sup></div><div class="stat-label">Composition offerte</div></div>
          </div>
        </div>
      </div>

      <div class="grid-3" style="margin-top:3rem;">
        <div class="card reveal">
          <div class="mono">I · Vous proposez</div>
          <p style="margin-top:.8rem;">À la famille qui cherche une musique personnelle, vous présentez le service. Trente secondes suffisent, et vous restez maître de la cérémonie.</p>
        </div>
        <div class="card reveal">
          <div class="mono">II · Nous composons</div>
          <p style="margin-top:.8rem;">La famille nous confie ce qu'elle veut dire. Nous composons dans le respect de ce que vous nous indiquez, et nous vous soumettons le résultat avant tout.</p>
        </div>
        <div class="card reveal">
          <div class="mono">III · Vos œuvres reçoivent</div>
          <p style="margin-top:.8rem;">La part qui vous revient est versée à l'affectation que vous nous désignez, avec un relevé pour votre comptabilité.</p>
        </div>
      </div>

      <p class="center reveal note" style="margin-top:2.2rem;max-width:72ch;margin-inline:auto;">
        Les associations cultuelles régies par la loi de 1905 ont un objet limité à l'exercice du culte.
        Selon votre statut, le reversement prend la forme d'un don, d'une convention de partenariat ou
        passe par une association d'entraide adossée à la vôtre. Nous en parlons avec vous et votre
        trésorier avant tout engagement.
      </p>
    </div>
  </section>

${P.urgency()}

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">Dites-nous d'abord<br>ce que votre <em>rite permet.</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;max-width:60ch;">Nous composerons ensuite — ou nous vous dirons franchement que ce n'est pas notre place.</p>
      <div class="hero-actions">
        <a href="/offres" class="btn btn-gold btn-lg">Commander un hommage</a>
        <button type="button" class="btn btn-outline btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
    </div>
  </section>`
};
