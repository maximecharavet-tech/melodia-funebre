const { ICON, SITE } = require('./gen.js');
const P = require('./parts.js');
const { OFFERS } = require('./data.js');

/* La part du prescripteur. Les montants nets ne sont PAS écrits à la
   main : ils se calculent depuis les offres publiées, comme partout
   ailleurs dans la maison. Un tarif modifié en console corrige donc
   cette page au prochain « npm run pages » — sans quoi elle
   annoncerait un jour une rémunération qui n'existe plus. */
const PART = 0.40;
/* Arrondi vers le bas à l'euro, comme la page des pompes funèbres :
   on n'annonce jamais plus que ce qu'on verse. */
const net = (prix) => Math.floor(prix * PART);
const partCent = Math.round(PART * 100);

const montants = () => OFFERS
  .map((o) => net(o.price) + ' € sur ' + o.name + ' à ' + o.price + ' €')
  .join(', ');

/* ═══════════════════════════════════════════════════════════════
   L'HOMMAGE DE SON VIVANT — la page qui change la taille du marché

   Jusqu'ici, ce service ne se vendait qu'au pire moment : dans les
   quarante-huit heures qui suivent un décès, à des gens en état de
   choc, qui n'avaient jamais entendu parler de la maison, et qui
   n'achèteront jamais deux fois. Le plan réseaux sociaux en tire la
   conclusion honnête : on ne crée pas ce besoin-là, on ne peut
   qu'être en mémoire quand il tombe.

   Il existe pourtant un second marché, adossé à la même production,
   et qui échappe à toutes ces contraintes : la même œuvre, commandée
   pendant que la personne est encore là.

   Ce que cela change, point par point :

     · l'acheteur n'est pas en deuil — il choisit, compare, prend son
       temps, et peut être touché par une publicité ;
     · la personne honorée ENTEND son œuvre. Elle peut corriger un
       souvenir, rire d'une anecdote, demander un couplet de plus.
       C'est impossible après, et c'est ce qui rend l'œuvre juste ;
     · il y a une date — un anniversaire, des noces d'or, un départ en
       retraite — donc une urgence naturelle, ce que le funéraire
       n'offre jamais à l'avance ;
     · un cadeau à 149 ou 299 € pour les quatre-vingts ans d'un père
       n'a rien d'extravagant : c'est le prix d'un beau repas de
       famille, et il reste.

   Le site le disait déjà — dans UNE réponse de la foire aux
   questions, invisible. Il y avait là une seconde activité enterrée
   sous un paragraphe.

   CE QUE CETTE PAGE NE FAIT PAS

   Elle ne promet pas de guérir, ne joue pas sur la peur, et ne
   suggère jamais de commander « avant qu'il ne soit trop tard ». La
   seule mention d'une personne malade est traitée avec la même
   retenue que le reste du site — sans quoi cette page deviendrait
   exactement ce que la maison refuse d'être.
   ═══════════════════════════════════════════════════════════════ */

const OCCASIONS = [
  ['Un anniversaire qui compte',
   'Quatre-vingts ans, quatre-vingt-dix ans. On a déjà offert des fleurs, un cadre, un voyage. ' +
   'Une chanson écrite pour elle seule, jouée devant toute la table, ne ressemble à rien de ce ' +
   'qu’elle a reçu jusque-là.'],
  ['Des noces d’or, ou de diamant',
   'Cinquante ans de mariage racontés en trois minutes, avec la rencontre, les déménagements, ' +
   'les enfants et les habitudes que tout le monde connaît. C’est l’histoire des deux, pas ' +
   'un morceau choisi au hasard.'],
  ['Un départ en retraite',
   'Quarante ans de métier, des collègues qui ne sauront pas quoi dire au micro. Une œuvre ' +
   'écrite à partir de ce qu’ils racontent règle le discours et le cadeau d’un seul coup.'],
  ['Un grand-parent qu’on veut remercier',
   'Pendant qu’il peut l’entendre. C’est la raison la plus fréquente, et la plus simple : ' +
   'dire de son vivant ce qu’on dit trop souvent après.'],
  ['Une naissance, un baptême',
   'L’autre bout de la vie. Une œuvre pour l’arrivée de quelqu’un, qu’on lui fera écouter ' +
   'à ses vingt ans.'],
  ['Pour soi-même',
   'Certains préparent leurs obsèques de leur vivant, jusqu’à la musique. Choisir soi-même ' +
   'ce qu’on fera entendre à ceux qui restent, c’est leur épargner une décision de plus.']
];

/* ─── LES PRESCRIPTEURS ──────────────────────────────────────────
   Le funéraire a ses pompes funèbres ; ce marché-ci a les siens, et
   ce ne sont pas les mêmes. Ils partagent un trait : ils accompagnent
   des gens pour qui c'est exactement le bon moment, et ils cherchent
   tous quelque chose à proposer qui ne soit ni un soin ni une
   facture. */
const LIEUX = [
  ['EHPAD et résidences seniors',
   'Un budget animation, une équipe qui cherche toute l’année ce qui sortira de l’ordinaire, ' +
   'et des familles avec qui il faut entretenir un lien qui ne parle pas que de santé.'],
  ['Résidences autonomie et foyers-logements',
   'Les résidents y sont valides et décident eux-mêmes. C’est le public le plus direct : ' +
   'ils commandent pour eux, ou leurs enfants pour eux.'],
  ['Clubs et associations d’aînés',
   'Générations, clubs du troisième âge, amicales. Une seule présentation devant trente ' +
   'personnes vaut trente conversations, et le bouche-à-oreille y est réel.'],
  ['CCAS et services municipaux',
   'Semaine bleue, repas des aînés, doyens de la commune. Une œuvre pour les cent ans ' +
   'du doyen se photographie, se raconte, et fait le tour du bulletin municipal.'],
  ['Comités d’entreprise et CSE',
   'Les départs en retraite. Le budget existe, il est prévu, et personne ne sait jamais ' +
   'quoi offrir après quarante ans de métier. Aucun tabou, aucune urgence, une date connue ' +
   'des mois à l’avance.'],
  ['Biographes familiaux et généalogistes',
   'Ils recueillent déjà des récits de vie : nous en faisons la version qui s’écoute. ' +
   'Le métier est voisin, la clientèle identique, et les deux services se renforcent.']
];

const FACONS = [
  ['L’établissement commande',
   'Sur son budget animation. Une œuvre pour un résident dont c’est l’anniversaire, ou une ' +
   'œuvre collective pour la maison entière, écrite à partir des récits de plusieurs ' +
   'résidents. C’est l’établissement qui paie, et la famille ne débourse rien.'],
  ['L’établissement prescrit',
   'Il informe simplement les familles que cela existe. Elles commandent, et vous conservez ' +
   '<b>' + partCent + ' % du montant réglé</b> : ' + montants() + '. Le même taux pour les ' +
   'trois offres, réglé sur facture récapitulative mensuelle. Aucun investissement, aucun ' +
   'stock, aucun minimum, aucun engagement de durée.']
];

const GARDES = [
  'Nous ne démarchons jamais un résident directement. Jamais.',
  'La famille décide et paie — sauf si l’établissement commande sur son propre budget.',
  'Aucune exclusivité, aucun minimum, aucun engagement de durée.',
  'Nous ne mettons jamais en avant la maladie, l’âge ou la fin de vie pour vendre.',
  'Rien n’est affiché ni distribué chez vous sans que vous l’ayez lu et approuvé.',
  'La part qui vous revient est écrite sur cette page, pas négociée au cas par cas.'
];

const DIFFERENCES = [
  ['Elle l’entend', 'Et c’est tout ce qui change. Une œuvre écrite après ne peut plus être ' +
   'corrigée par celui qu’elle raconte. Ici, elle peut dire « ce n’était pas en 1974 », ' +
   'ou « ajoutez le chien ». L’œuvre devient juste.'],
  ['Vous avez le temps', 'Pas de délai de vingt-quatre heures, pas de décision prise entre ' +
   'deux formalités. Vous nous racontez tranquillement, vous relisez le texte, vous demandez ' +
   'une modification si quelque chose sonne faux.'],
  ['Elle peut y participer', 'Beaucoup de familles nous font parler directement à la personne. ' +
   'L’entretien devient alors ce qu’il devrait toujours être : quelqu’un qui raconte sa vie ' +
   'à quelqu’un qui l’écoute.'],
  ['Elle reste, après', 'Ce n’est pas un cadeau qui s’use. Le jour venu — dans dix ans, dans ' +
   'vingt — cette œuvre existe déjà, elle a été approuvée par celui qu’elle raconte, et ' +
   'personne n’aura à choisir dans l’urgence.']
];

module.exports = {
  file: 'de-son-vivant.html',
  url: '/de-son-vivant',
  title: 'Offrir la chanson d’une vie, de son vivant | Melodia Funèbre',
  desc: 'Une œuvre originale composée pour quelqu’un qui est encore là — un anniversaire, ' +
        'des noces d’or, un départ. Elle l’entend, elle peut la corriger, et elle reste.',
  /* La platine — le disque d'or qui tourne — est montée par ce script,
     le même que sur /demos. Sans lui, la grille reste une liste de
     liens : lisible, mais ce n'est pas ce qui a été demandé. */
  scripts: ['assets/js/catalogue.js'],
  jsonld: [
    P.jsonldFil('De son vivant', '/de-son-vivant'),
    ...(P.jsonldVivants ? [P.jsonldVivants] : []),
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': SITE + '/de-son-vivant#service',
      name: 'Chanson personnalisée offerte de son vivant',
      serviceType: 'Composition musicale personnalisée',
      description: 'Une œuvre originale écrite pour une personne vivante, à offrir pour un ' +
                   'anniversaire, des noces d’or, un départ en retraite ou simplement pour dire merci.',
      provider: { '@id': SITE + '/#organisation' },
      areaServed: 'FR',
      audience: { '@type': 'Audience', audienceType: 'Familles et proches' }
    }
  ],
  body: `
  <section class="page-head">
    <div class="wrap">
      <div class="eyebrow reveal in">De son vivant</div>
      <h1 class="h-xl reveal in reveal-d1" style="margin-top:.8rem;">Dites-le-lui<br><em>pendant qu’elle peut l’entendre.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.4rem;max-width:64ch;">
        Nous composons des œuvres pour des cérémonies funéraires. Mais rien n’oblige à
        attendre. La même chanson, écrite pour la même personne, prend un tout autre sens
        quand elle est là pour l’écouter — et qu’elle peut nous dire ce que nous avons
        mal compris.
      </p>
      <div class="hero-actions reveal in reveal-d3" style="margin-top:2.2rem;">
        <a href="/offres" class="btn btn-gold btn-lg">Faire composer une chanson</a>
        <a href="/ecouter/eshet-chayil-femme-de-valeur" class="btn btn-outline btn-lg">Écouter celle de Ruth</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap wrap-tight">
      <div class="reveal">
        <div class="eyebrow">Ce que cela change</div>
        <h2 class="h-lg" style="margin-top:.8rem;">Quatre différences,<br><em>et la première suffit.</em></h2>
      </div>
      <div class="grid-2" style="margin-top:2.6rem;">
        ${DIFFERENCES.map(([t, p], i) => `
          <div class="carte reveal reveal-d${(i % 3) + 1}">
            <h3 class="h-sm">${t}</h3>
            <p style="margin-top:.7rem;">${p}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

${P.oeuvres('vivant') ? `
  <section class="section section-alt" id="oeuvres">
    <div class="wrap">
      <div class="reveal center" style="margin-bottom:2.6rem;">
        <div class="eyebrow">Offertes de leur vivant</div>
        <h2 class="h-lg" style="margin-top:.8rem;">Elles les ont entendues,<br><em>et elles ont corrigé deux choses.</em></h2>
        <p class="lead" style="margin:1.4rem auto 0;max-width:62ch;">
          Ruth avait quatre-vingt-cinq ans. Ses enfants voulaient lui dire de son vivant ce
          qu’on dit trop souvent après. Elle a écouté son klezmer, assise, et elle a corrigé
          deux détails — c’est exactement ce qui a rendu l’œuvre juste.
        </p>
      </div>
${P.oeuvres('vivant')}
    </div>
  </section>` : ''}

  <section class="section">
    <div class="wrap wrap-tight">
      <div class="reveal">
        <div class="eyebrow">Les occasions</div>
        <h2 class="h-lg" style="margin-top:.8rem;">Six raisons de ne pas<br><em>attendre le pire moment.</em></h2>
      </div>
      <div class="grid-2" style="margin-top:2.6rem;">
        ${OCCASIONS.map(([t, p], i) => `
          <div class="carte reveal reveal-d${(i % 3) + 1}">
            <h3 class="h-sm">${t}</h3>
            <p style="margin-top:.7rem;">${p}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="wrap wrap-tight">
      <div class="reveal" style="max-width:66ch;margin:0 auto;">
        <div class="eyebrow">Une réserve, et nous la disons</div>
        <h2 class="h-lg" style="margin-top:.8rem;">Quand la personne <em>est malade.</em></h2>
        <p class="lead" style="margin-top:1.4rem;">
          C’est la situation la plus fréquente après les anniversaires, et la plus délicate.
          Nous ne vous dirons jamais de commander « avant qu’il ne soit trop tard » : ce n’est
          pas notre rôle, et cette phrase-là ne devrait pas servir à vendre.
        </p>
        <p style="margin-top:1.2rem;">
          Ce que nous pouvons dire : une œuvre écrite pendant qu’elle est encore là peut
          être écoutée avec elle. Beaucoup de familles nous disent que ce moment-là a compté
          davantage que la cérémonie. Si vous hésitez, appelez-nous et nous en parlerons
          franchement — y compris pour vous dire que ce n’est peut-être pas le moment.
        </p>
        <div class="hero-actions" style="margin-top:2rem;">
          <button type="button" class="btn btn-outline btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap wrap-tight">
      <div class="reveal center">
        <div class="eyebrow">Le déroulé</div>
        <h2 class="h-lg" style="margin-top:.8rem;">Exactement le même,<br><em>sans le chronomètre.</em></h2>
        <p class="lead" style="margin:1.4rem auto 0;max-width:60ch;">
          Un entretien de quelques minutes — son prénom, trois traits de caractère, un métier
          ou une passion, une habitude, une anecdote si vous voulez bien la confier. Nous
          écrivons, nous composons, et vous recevez l’œuvre. Les offres et les délais sont
          les mêmes que pour une cérémonie ; simplement, rien ne presse.
        </p>
        <div class="hero-actions" style="margin-top:2.2rem;justify-content:center;">
          <a href="/processus" class="btn btn-outline btn-lg">Voir comment ça marche</a>
        </div>
      </div>
    </div>
  </section>

${P.oeuvres('message') ? `
  <section class="section" id="messages">
    <div class="wrap">
      <div class="reveal center" style="margin-bottom:2.6rem;">
        <div class="eyebrow">Les messages laissés</div>
        <h2 class="h-lg" style="margin-top:.8rem;">Ce qu’ils ont voulu dire,<br><em>pour le jour où ils ne seraient plus là.</em></h2>
        <p class="lead" style="margin:1.4rem auto 0;max-width:62ch;">
          Ces œuvres-là ne racontent pas quelqu’un : c’est quelqu’un qui parle. Elles ont été
          commandées de leur vivant, avec leurs mots, pour être entendues par leurs proches
          le jour venu. Appuyez sur lecture — le disque tourne, comme pour les autres.
        </p>
      </div>
${P.oeuvres('message')}
    </div>
  </section>` : ''}

${P.pricing()}

  <!-- ═══ LES PRESCRIPTEURS ═══
       Un directeur d'EHPAD n'achète pas ce qu'achète une famille. Cette
       partie lui parle à lui : budget, lien avec les familles, charge de
       travail, et surtout les garde-fous — sa première crainte est qu'on
       vienne vendre quelque chose à ses résidents. -->
  <section class="section section-alt" id="etablissements">
    <div class="wrap">
      <div class="reveal center" style="margin-bottom:2.8rem;">
        <div class="eyebrow">Établissements et associations</div>
        <h2 class="h-lg" style="margin-top:.8rem;">Vous accompagnez des gens<br><em>pour qui c’est exactement le moment.</em></h2>
        <p class="lead" style="margin:1.4rem auto 0;max-width:64ch;">
          Une maison de retraite, un club d’aînés, un CSE qui prépare un départ : vous
          cherchez tous quelque chose à proposer qui ne soit ni un soin, ni une facture,
          ni un cadeau qu’on oublie dans un tiroir. C’est précisément ce que nous faisons.
        </p>
      </div>

      <div class="grid-3" style="margin-top:2rem;">
        ${LIEUX.map(([t, p], i) => `
          <div class="carte reveal reveal-d${(i % 3) + 1}">
            <h3 class="h-sm">${t}</h3>
            <p style="margin-top:.7rem;">${p}</p>
          </div>`).join('')}
      </div>

      <div class="wrap-tight" style="margin-top:4rem;padding:0;">
        <div class="reveal center">
          <div class="eyebrow">Deux façons de travailler ensemble</div>
          <h3 class="h-md" style="margin-top:.7rem;">Vous commandez,<br><em>ou vous prescrivez.</em></h3>
        </div>
        <div class="grid-2" style="margin-top:2.2rem;">
          ${FACONS.map(([t, p], i) => `
            <div class="carte reveal reveal-d${i + 1}">
              <h3 class="h-sm">${t}</h3>
              <p style="margin-top:.7rem;">${p}</p>
            </div>`).join('')}
        </div>
      </div>

      <!-- L'atelier : le seul format qui se facture à l'établissement
           plutôt qu'à une famille, et celui qui se raconte le mieux. -->
      <div class="wrap-tight reveal" style="margin-top:4rem;padding:0;">
        <div class="carte" style="padding:clamp(1.6rem,4vw,2.6rem);">
          <div class="eyebrow">Le format qui marche le mieux chez vous</div>
          <h3 class="h-md" style="margin-top:.7rem;">L’atelier <em>récits de vie</em></h3>
          <p style="margin-top:1rem;">
            Une séance chez vous, avec un petit groupe de résidents : chacun raconte ce qu’il
            veut bien raconter. Nous en tirons une œuvre — pour l’un d’eux, ou pour la maison
            entière. Quelques jours plus tard, écoute collective, avec les familles si vous
            le souhaitez.
          </p>
          <p style="margin-top:1rem;">
            C’est une animation dont on parle pendant des mois, qui se photographie, qui
            trouve sa place dans votre journal et dans vos échanges avec les familles — et
            qui ne vous demande aucune préparation. Nous venons avec les questions.
          </p>
        </div>
      </div>

      <!-- Les garde-fous. Ce n'est pas de la prudence juridique : c'est
           l'argument qui permet à un directeur de dire oui. -->
      <div class="wrap-tight reveal" style="margin-top:3rem;padding:0;">
        <div class="eyebrow center">Ce que nous nous interdisons</div>
        <h3 class="h-md center" style="margin-top:.7rem;">Cinq règles,<br><em>écrites avant que vous les demandiez.</em></h3>
        <ul class="liste-or" style="margin-top:1.8rem;">
          ${GARDES.map((g) => `<li>${g}</li>`).join('')}
        </ul>
        <p style="margin-top:1.4rem;text-align:center;color:var(--dust);font-size:.92rem;">
          Vous accueillez des personnes vulnérables. Si nous ne tenions pas ces règles-là,
          vous auriez raison de ne pas nous ouvrir la porte.
        </p>
      </div>

      <div class="center reveal" style="margin-top:3.4rem;">
        <div class="hero-actions" style="justify-content:center;">
          <a href="/professionnels?objet=etablissement#partenariat" class="btn btn-gold btn-lg">Recevoir le dossier établissement</a>
          <button type="button" class="btn btn-outline btn-lg" data-rappel>${ICON.phone} En parler de vive voix</button>
        </div>
        <p style="margin-top:1.2rem;color:var(--dust);font-size:.9rem;">
          Un appel de dix minutes suffit à savoir si cela a du sens chez vous.
        </p>
      </div>
    </div>
  </section>

${P.partage('Offrir la chanson d’une vie', 'Une œuvre composée pour quelqu’un qui est encore là — et qui peut l’entendre.')}

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">Il y a des choses<br>qu’on <em>répète trop tard.</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;max-width:60ch;">
        Racontez-nous qui elle est. Nous nous chargeons du reste, et elle l’entendra.
      </p>
      <div class="hero-actions">
        <a href="/offres" class="btn btn-gold btn-lg">Faire composer une chanson</a>
        <button type="button" class="btn btn-outline btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
    </div>
  </section>`
};
