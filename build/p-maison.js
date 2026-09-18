const { ICON, MAIL } = require('./gen.js');
const P = require('./parts.js');

/* ═══════════════════════════════════════════════════════════════
   QUI SOMMES-NOUS

   Le fondateur voulait une page qui dise « ce sont de vrais gens
   qu'on peut rencontrer, pas des I.A. ». La formule ne pouvait pas
   être reprise telle quelle, pour une raison qui tient en une ligne :
   les questions fréquentes du site disent, depuis toujours, que « la
   composition s'appuie sur des outils de création musicale assistée ».
   Une page qui proclamerait « aucune intelligence artificielle ici »
   contredirait la maison sur son propre site, et le premier visiteur
   qui ouvre la FAQ le verrait.

   La page dit donc la chose vraie, qui est plus forte : l'outil ne
   décroche pas le téléphone, ne relit pas les paroles, ne dit pas non,
   et ne rappelle personne. Ce sont des gens qui le font, ils ont des
   noms, et on peut leur parler.

   Et la preuve n'est pas portée par les images — une photographie ne
   prouve plus rien à personne. Elle est portée par ce qu'un visiteur
   peut FAIRE : demander un rappel, une visioconférence, un rendez-vous,
   écrire au fondateur à son adresse en clair. Ce sont des promesses
   vérifiables en trois minutes, et c'est ce qui distingue cette page
   d'une page d'entreprise ordinaire.
   ═══════════════════════════════════════════════════════════════ */

/* Les personnes, leurs fonctions et leur phrase, telles que le
   fondateur les a fournies. Rien n'est ajouté ni deviné ici : une
   fonction inventée sur une page « qui sommes-nous » est exactement
   le genre de détail qu'un partenaire vérifie. */
const EQUIPE = [
  {
    nom: 'Maxime Charavet',
    role: 'Fondateur &amp; CEO',
    mot: 'Faire de la musique un héritage émotionnel pour les générations de demain.'
  },
  {
    nom: 'Maghni Fares',
    role: 'Directeur artistique',
    precision: 'Ancien d’Universal Music',
    mot: 'Imaginer, créer, sublimer, donner une âme musicale à chaque histoire.'
  },
  {
    nom: 'Gael Moreau',
    role: 'Directeur de la production',
    mot: 'Piloter la création musicale avec passion, exigence et humanité.'
  },
  {
    nom: 'Julie Serve',
    role: 'Directrice marketing &amp; commerciale',
    mot: 'Développer la notoriété de Melodia Funèbre, créer des liens durables avec les familles et nos partenaires.'
  },
  {
    nom: 'Olivier Mailo',
    role: 'Directeur R&amp;D et innovations',
    mot: 'Explorer aujourd’hui les sons de demain.'
  }
];

/* Ce qu'aucun outil ne fait à notre place. Chaque ligne renvoie à un
   engagement déjà écrit ailleurs sur le site — la relecture humaine du
   processus, le « ce n'est peut-être pas le moment » de la page « De
   son vivant », la reprise des conditions de vente. Une promesse qui
   n'existe qu'ici serait une promesse de circonstance. */
const HUMAIN = [
  ['Quelqu’un décroche',
   'Une demande de rappel est reprise par une personne de la maison, pas par un serveur vocal. Quand les obsèques sont dans trois jours, c’est la seule chose qui compte.'],
  ['Quelqu’un écoute l’œuvre en entier',
   'Avant chaque envoi, l’hommage est écouté du début à la fin par la maison. Ce contrôle n’est jamais sauté, même dans l’urgence — c’est écrit noir sur blanc dans notre processus.'],
  ['Quelqu’un dit non',
   'Il nous arrive de déconseiller une commande : quand la personne est trop malade, quand le rite ne l’admet pas, quand ce n’est simplement pas le moment. Un logiciel ne refuse jamais une vente.'],
  ['Quelqu’un recommence',
   'Si l’œuvre ne ressemble pas à la personne, nous la reprenons. Ce n’est pas un geste commercial : c’est quelqu’un qui réécrit, parce que le texte était faux.']
];

module.exports = {
  file: 'qui-sommes-nous.html',
  title: 'Qui sommes-nous — l’équipe de Melodia Funèbre',
  desc: "L'équipe et la direction de Melodia Funèbre : cinq personnes, leurs noms, leurs fonctions. Un appel, une visioconférence ou un rendez-vous suffisent à les rencontrer.",
  jsonld: [P.jsonldFil('Qui sommes-nous', '/qui-sommes-nous')],
  body: `
  <section class="page-head">
    <div class="wrap">
      <div class="eyebrow reveal in">La maison</div>
      <h1 class="h-xl reveal in reveal-d1" style="margin-top:.8rem;">Derrière les outils,<br><em>des gens.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.4rem;max-width:64ch;">
        Melodia Funèbre est une maison française de composition, et elle tient en
        cinq personnes. Elles ont des noms, des fonctions, et un téléphone qui sonne.
        Cette page est là pour que vous puissiez leur parler avant de nous confier
        quoi que ce soit.
      </p>
      <div class="hero-actions reveal in reveal-d3" style="margin-top:2.2rem;">
        <button type="button" class="btn btn-gold btn-lg" data-rappel>${ICON.phone} Demander à être rappelé</button>
        <a href="/demos" class="btn btn-outline btn-lg">${ICON.note} Écouter ce que nous faisons</a>
      </div>
    </div>
  </section>

  <!-- ═══ LA DIRECTION, EN IMAGE ═══ -->
  <section class="section-sm">
    <div class="wrap">
      <figure class="equipe equipe-nue reveal">
        <img src="assets/img/maison/equipe-direction-1672.webp"
             srcset="assets/img/maison/equipe-direction-1120.webp 1120w, assets/img/maison/equipe-direction-1672.webp 1672w"
             sizes="(max-width: 1180px) 92vw, 1080px"
             width="1672" height="941" loading="lazy" decoding="async"
             alt="La direction de Melodia Funèbre, de gauche à droite : Olivier Mailo, Gael Moreau, Maxime Charavet, Maghni Fares et Julie Serve, assis à une même table.">
        <figcaption>De gauche à droite : Olivier Mailo, Gael Moreau, Maxime Charavet, Maghni Fares, Julie Serve.</figcaption>
      </figure>
    </div>
  </section>

  <!-- ═══ CE QUE L'OUTIL NE FAIT PAS ═══
       La partie qui porte la demande du fondateur, dite d'une façon
       qui ne contredit pas les questions fréquentes. -->
  <section class="section section-light">
    <div class="wrap wrap-tight">
      <div class="reveal">
        <div class="eyebrow">Ce qu’aucun outil ne fait</div>
        <h2 class="h-xl" style="margin-top:.8rem;">La machine ne décroche pas<br><em>le téléphone.</em></h2>
        <p class="lead" style="margin-top:1.4rem;">
          Nous n’allons pas vous raconter que tout se fait à la plume et à la guitare :
          la composition s’appuie sur des outils de création musicale assistée, et nous
          l’écrivons dans nos questions fréquentes depuis le premier jour. Ce que nous
          disons est autre chose, et c’est vérifiable.
        </p>
      </div>
      <div class="grid-2" style="margin-top:2.6rem;">
${HUMAIN.map(([t, p], i) => `        <div class="carte reveal reveal-d${(i % 3) + 1}">
          <h3 class="h-sm">${t}</h3>
          <p style="margin-top:.7rem;">${p}</p>
        </div>`).join('\n')}
      </div>
      <p class="reveal" style="margin:2.2rem auto 0;max-width:60ch;text-align:center;">
        Aucune famille ne reçoit un hommage que personne n’a écouté.
        C’est la seule promesse que nous tenons à répéter.
      </p>
    </div>
  </section>

  <!-- ═══ L'ATELIER ═══
       Placé juste après ce qu'aucun outil ne fait, et avant les noms :
       on lit ce que des gens font, on les voit le faire, puis on
       apprend comment ils s'appellent.

       Ces trois images sont les seules du site à montrer la maison au
       travail plutôt qu'une mise en scène. C'est pour cette page-ci
       qu'elles comptent le plus : elles ne prouvent rien à elles
       seules, mais elles montrent des écrans, des câbles et des tasses
       — pas un décor.

       À COMPLÉTER — les techniciens de production n'ont pas encore de
       noms sur cette page. Le fondateur les fournira ; ils prendront la
       même forme que les cinq cartes de la direction. En attendant, la
       partie ne nomme personne plutôt que d'inventer. -->
  <section class="section" id="atelier">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.6rem;">
        <div class="eyebrow">La production</div>
        <h2 class="h-xl">Ceux qui règlent<br><em>le son.</em></h2>
        <p class="lead" style="margin:1.6rem auto 0;max-width:52rem;">
          Entre l’entretien de cinq minutes et le fichier que reçoit la famille, il y a
          des gens devant des écrans : ceux qui écrivent les paroles, ceux qui composent
          et qui mixent, et celui qui écoute l’œuvre en entier avant qu’elle parte.
          C’est le métier le moins visible de la maison, et c’est celui qui sépare
          un hommage juste d’un hommage à peu près.
        </p>
      </div>

      <figure class="equipe equipe-nue reveal">
        <img src="assets/img/maison/atelier-salle-1264.webp"
             srcset="assets/img/maison/atelier-salle-880.webp 880w, assets/img/maison/atelier-salle-1264.webp 1264w"
             sizes="(max-width: 1180px) 92vw, 1080px"
             width="1264" height="720" loading="lazy" decoding="async"
             alt="L’atelier de Melodia Funèbre : plusieurs personnes devant des écrans de station audio, casques sur les oreilles, claviers maîtres et guitares au mur, sous le logo de la maison.">
        <figcaption>L’atelier. Chaque écran est un hommage en cours, et une famille qui attend.</figcaption>
      </figure>

      <div class="atelier-duo" style="margin-top:1.8rem;">
        <figure class="equipe equipe-nue reveal">
          <img src="assets/img/maison/atelier-clavier-1264.webp"
               srcset="assets/img/maison/atelier-clavier-640.webp 640w, assets/img/maison/atelier-clavier-1264.webp 1264w"
               sizes="(max-width: 860px) 92vw, 520px"
               width="1264" height="720" loading="lazy" decoding="async"
               alt="Un compositeur de la maison, tourné vers un collègue, devant deux claviers maîtres et une console de mixage.">
          <figcaption>La composition et le mixage : chercher le son qui ressemble à quelqu’un.</figcaption>
        </figure>
        <figure class="equipe equipe-nue reveal reveal-d1">
          <img src="assets/img/maison/atelier-ecoute-1264.webp"
               srcset="assets/img/maison/atelier-ecoute-640.webp 640w, assets/img/maison/atelier-ecoute-1264.webp 1264w"
               sizes="(max-width: 860px) 92vw, 520px"
               width="1264" height="720" loading="lazy" decoding="async"
               alt="Plusieurs membres de la maison réunis autour d’un même écran de montage audio, en train d’écouter ensemble.">
          <figcaption>La relecture. On écoute du début à la fin, ensemble — c’est l’étape que nous ne sautons jamais.</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <!-- ═══ L'ÉQUIPE ═══ -->
  <section class="section" id="equipe">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.8rem;">
        <div class="eyebrow">L’équipe</div>
        <h2 class="h-xl">Cinq personnes,<br><em>et leurs noms.</em></h2>
      </div>
      <div class="grid-3">
${EQUIPE.map((m, i) => `        <div class="carte reveal reveal-d${(i % 3) + 1}">
          <h3 class="h-sm">${m.nom}</h3>
          <div class="mono" style="margin-top:.45rem;">${m.role}</div>
          ${m.precision ? `<div class="maison-precision">${m.precision}</div>` : ''}
          <p style="margin-top:.9rem;">${m.mot}</p>
        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <!-- ═══ DEUX IMAGES ═══
       Légendées pour ce qu'elles montrent, sans rien affirmer de plus. -->
  <section class="section-sm">
    <div class="wrap">
      <div class="maison-duo">
        <figure class="guide-photo reveal">
          <img src="assets/img/maison/julie-serve-1024.webp"
               srcset="assets/img/maison/julie-serve-480.webp 480w, assets/img/maison/julie-serve-1024.webp 1024w"
               sizes="(max-width: 780px) 88vw, 420px"
               width="1024" height="1497" loading="lazy" decoding="async"
               alt="Julie Serve, directrice marketing et commerciale de Melodia Funèbre, à son bureau devant le logo de la maison.">
          <figcaption>Julie Serve, directrice marketing et commerciale.</figcaption>
        </figure>
        <figure class="guide-photo reveal reveal-d1">
          <img src="assets/img/maison/plaque-hommage-941.webp"
               srcset="assets/img/maison/plaque-hommage-480.webp 480w, assets/img/maison/plaque-hommage-941.webp 941w"
               sizes="(max-width: 780px) 88vw, 420px"
               width="941" height="1587" loading="lazy" decoding="async"
               alt="La plaque gravée et son QR code, posée sur une table entre un ordinateur portable et un bouquet de roses blanches, devant deux personnes en tenue sombre.">
          <figcaption>La plaque gravée et son QR code, tels que nous les présentons à une agence : on la scanne, la musique se met à jouer.</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <!-- ═══ LA PREUVE ═══
       Ce qui distingue vraiment une maison qu'on peut rencontrer d'une
       page de société : des choses que le visiteur peut vérifier
       lui-même, aujourd'hui, sans nous croire sur parole. -->
  <section class="section section-top">
    <div class="wrap wrap-tight">
      <div class="reveal center">
        <div class="eyebrow">Nous rencontrer</div>
        <h2 class="h-xl">Ne nous croyez pas sur parole.<br><em>Appelez.</em></h2>
        <p class="lead" style="margin:1.4rem auto 0;max-width:60ch;">
          Une page peut écrire n’importe quoi, et une image ne prouve plus grand-chose
          à personne. Voici cinq choses que vous pouvez vérifier vous-même, maintenant,
          sans nous croire sur parole.
        </p>
      </div>
      <ul class="liste-or" style="margin-top:2.2rem;">
        <li><b>Un appel.</b> Demandez à être rappelé : c’est une personne de la maison qui vous rappelle, et vous pouvez lui demander son prénom.</li>
        <li><b>Une adresse, en clair.</b> Le fondateur s’appelle Maxime Charavet et lit <a href="mailto:${MAIL}">${MAIL}</a>. Écrivez-lui, vous verrez bien.</li>
        <li><b>Une signature au bas de chaque page.</b> Descendez jusqu’au pied de n’importe quelle page de ce site : son nom et son portrait y sont, sur toutes.</li>
        <li><b>Des œuvres qu’on peut écouter en entier.</b> Il y en a {{HOMMAGES}}, chacune avec le récit de la personne pour qui elle a été écrite. <a href="/demos">Ils sont là</a>, sans formulaire à remplir et sans adresse à donner.</li>
        <li><b>Un accompagnement écrit dans l’offre.</b> L’offre Mémorial comprend l’accompagnement du fondateur lui-même — <a href="/offres">c’est inscrit dans nos tarifs</a>, pas dans une promesse commerciale.</li>
      </ul>
      <p class="reveal" style="margin:1.8rem auto 0;max-width:58ch;text-align:center;color:var(--ivory-dim);">
        Et si vous préférez un visage à une voix, dites-le en demandant le rappel :
        nous nous arrangerons.
      </p>
      <div class="center reveal" style="margin-top:3rem;">
        <div class="hero-actions" style="justify-content:center;">
          <button type="button" class="btn btn-gold btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
          <a href="/contact" class="btn btn-outline btn-lg">Nous écrire</a>
        </div>
      </div>
    </div>
  </section>

${P.partage('Qui sommes-nous', 'Cinq personnes, leurs noms et leurs fonctions — et quatre façons de vérifier qu’il y a quelqu’un au bout.')}
`
};
