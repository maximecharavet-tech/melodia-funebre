/* ═══════════════════════════════════════════════════════════════
   MELODIA — Le plan Instagram · Facebook · TikTok

   Quatrième document de la maison. Là où le plan LinkedIn s'adresse
   aux dirigeants de pompes funèbres, celui-ci s'adresse au grand
   public — et il part d'un constat qui commande tout le reste :

       ON NE CRÉE PAS LE BESOIN D'UNE CHANSON D'OBSÈQUES.

   Personne ne décide un mardi d'avoir besoin de ce service. Le
   marketing de conversion — susciter l'envie, la transformer en achat
   — ne s'applique donc pas. Ce document décrit ce qui s'applique à la
   place : être en mémoire avant que le besoin arrive, être trouvable
   au moment où il arrive, et servir de preuve aux professionnels.

   Ce qui est lu, et non retapé :
     · les offres et les dix-huit œuvres, du contenu publié ;
     · les interdits de prospection, de commercial-contenu.js ;
     · les adresses /ecouter/<titre>, calculées par adresses.js ;
     · les limites de signes par réseau, lues dans intranet.js —
       celles-là mêmes que le planificateur de la console applique.

   La mise en page coule comme celle du plan LinkedIn, dont elle
   reprend la feuille : les deux documents sont frères, et deux copies
   auraient divergé au premier réglage.

   AUCUN OBJECTIF DE PERFORMANCE N'EST AVANCÉ, pour la même raison que
   dans le plan LinkedIn : la maison n'a pas d'historique sur ces
   réseaux. Ce qui est donné, c'est la méthode pour fabriquer sa base
   de référence, et les seuils à partir desquels une décision change.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { fontes, image, CLAIR } = require('./pdf-style.js');
const { FLUX } = require('./pdf-linkedin.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const RACINE = path.join(__dirname, '..');

function venteDeLaConsole() {
  const src = fs.readFileSync(path.join(RACINE, 'assets/js/commercial-contenu.js'), 'utf8');
  const faux = {};
  new Function('window', src)(faux);
  if (!faux.MELODIA_VENTE) throw new Error('commercial-contenu.js n’expose plus MELODIA_VENTE');
  return faux.MELODIA_VENTE;
}

function oeuvres() {
  const c = JSON.parse(fs.readFileSync(path.join(RACINE, 'assets/data/content.json'), 'utf8'));
  const liste = (c.demos || []).filter((d) => d.visible !== false);
  const slugs = require('./adresses.js').adresses(liste);
  return liste.map((d, i) => ({
    titre: d.title, qui: d.who, style: d.style, adresse: '/ecouter/' + slugs[i], slug: slugs[i]
  }));
}

/* Les limites de signes ne sont pas recopiées : elles sont lues dans le
   planificateur de la console, qui les applique déjà à l'écran. Si l'une
   d'elles change là-bas, ce document la corrige au prochain tirage. */
function limites() {
  const src = fs.readFileSync(path.join(RACINE, 'assets/js/intranet.js'), 'utf8');
  const m = src.match(/var LIMITES = \{([^}]+)\}/);
  if (!m) throw new Error('intranet.js n’expose plus LIMITES');
  const o = {};
  m[1].split(',').forEach((p) => {
    const [k, v] = p.split(':').map((x) => x.trim());
    if (k) o[k] = parseInt(v, 10);
  });
  return o;
}

const memeTitre = (s) => String(s).replace(/[’‘‛`´]/g, "'").trim().toLowerCase();
function parTitre(liste, titre) {
  const o = liste.filter((x) => memeTitre(x.titre) === memeTitre(titre))[0];
  if (!o) throw new Error('Œuvre absente du catalogue : ' + titre);
  return o;
}

/* Quelques ajouts de mise en page propres à ce document : le tableau
   de décision par réseau, et l'encadré « ce que vous possédez déjà ». */
const SUPPLEMENT = `
  .reseau { break-inside: avoid; margin-bottom: 6mm; border: 1px solid #e3ddcd; background: #fffefb; }
  .reseau-tete { display: grid; grid-template-columns: 1fr auto; gap: 4mm; align-items: baseline;
                 padding: 4mm 5mm; background: #f7f4ec; border-bottom: 1px solid #e3ddcd; }
  .reseau-tete h3 { font-size: 15pt; }
  .reseau-tete .role { font-family: 'Jetbrains Mono', monospace; font-size: 7pt;
                       letter-spacing: .16em; text-transform: uppercase; color: #8a6f26; }
  .reseau-corps { padding: 5mm; }
  .reseau-corps p { margin-bottom: 3mm; }
  .reseau-corps p:last-child { margin-bottom: 0; }
  .fiche { display: grid; grid-template-columns: 34mm 1fr; gap: 4mm; padding: 2mm 0;
           border-top: 1px solid #eee9db; font-size: 8.6pt; break-inside: avoid; }
  .fiche b { font-family: 'Jetbrains Mono', monospace; font-size: 7.2pt; font-weight: 400;
             letter-spacing: .1em; text-transform: uppercase; color: #9a8a5c; }
  .fiche span { color: #3a362c; line-height: 1.55; }

  .avoir { break-inside: avoid; border-left: 2px solid #c9a84c; padding: 0 0 0 5mm; margin-bottom: 5mm; }
  .avoir h3 { font-size: 12.5pt; margin-bottom: 1.5mm; }
  .avoir p { font-size: 8.8pt; }
  .avoir .cout { font-family: 'Jetbrains Mono', monospace; font-size: 7.2pt;
                 letter-spacing: .12em; text-transform: uppercase; color: #8a6f26; }

  .these { background: #17150f; color: #f4f1ea; padding: 7mm 8mm; break-inside: avoid; margin: 6mm 0; }
  .these p { color: #ded7c4; font-size: 9.6pt; line-height: 1.7; }
  .these .cle { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic;
                font-size: 16pt; line-height: 1.34; color: #f4f1ea; margin-bottom: 4mm; }
  .these .cle em { color: #c9a84c; font-style: italic; }

  /* Une adresse qu'on doit recopier à la main ne se coupe pas en fin de
     ligne : on ne sait plus si le trait d'union appartient à l'adresse.
     Elle prend donc sa propre ligne, en chasse fixe, où elle tient. */
  .adresse {
    display: block; margin-top: 2mm;
    font-family: 'Jetbrains Mono', monospace; font-size: 8pt;
    color: #8a6f26; letter-spacing: -0.01em; white-space: nowrap;
  }
`;

/* ═══ COUVERTURE ═══ */
function couverture(O) {
  return `<div class="couv">
    <img src="${image('assets/img/logo-melodia-complet.jpg')}" alt="Melodia Funèbre"
         style="width:40mm;height:40mm;object-fit:contain;mix-blend-mode:screen;">
    <div style="margin-top:auto;">
      <div class="surtitre">Document interne · Stratégie grand public</div>
      <hr class="filet" style="width:30mm;margin:4mm 0 6mm;">
      <h1>Instagram,<br>Facebook,<br><em>TikTok.</em></h1>
      <p style="margin-top:7mm;font-size:12pt;line-height:1.7;max-width:122mm;">
        On ne crée pas le besoin d’une chanson d’obsèques. Ce plan ne cherche donc pas à
        le créer : il vise à être en mémoire avant que le besoin arrive, et trouvable
        au moment où il arrive.
      </p>
      <p style="margin-top:8mm;font-family:'Jetbrains Mono',monospace;font-size:7.4pt;
                letter-spacing:.16em;text-transform:uppercase;color:#6b5828;">
        ${O.length} œuvres · trois réseaux · aucun budget publicitaire
      </p>
    </div>
  </div>`;
}

/* ═══ 1. LA THÈSE ═══ */
function these() {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">La thèse</div>
      <hr class="filet">
      <h2>Le marketing classique<br><em>ne s’applique pas ici.</em></h2>
    </div>

    <p>Tout ce qu’on lit sur les réseaux sociaux repose sur une chaîne : on attire
    l’attention, on suscite l’envie, on transforme l’envie en achat. Cette chaîne marche pour
    une paire de chaussures. Elle est inopérante ici, et il faut le dire avant d’écrire une
    ligne de calendrier.</p>

    <p style="margin-top:4mm;">Personne ne décide un mardi matin d’avoir besoin d’une chanson
    d’obsèques. Le besoin ne se crée pas : il tombe, sans prévenir, et celui à qui il tombe
    dessus n’est pas en état de découvrir une marque. Une publicité qui chercherait à
    <em>provoquer</em> la demande serait à la fois inefficace et indécente.</p>

    <div class="these">
      <p class="cle">Sur ces trois réseaux, nous ne vendons rien.<br>
      Nous faisons en sorte d’être <em>la première idée qui vient</em><br>
      le jour où quelqu’un cherche quoi diffuser.</p>
      <p>Ce n’est pas une posture modeste : c’est le seul mécanisme qui fonctionne sur un
      marché où l’achat est imprévisible, unique dans une vie, et décidé en quarante-huit
      heures par des gens en état de choc.</p>
    </div>

    <h3 style="margin-top:6mm;">Trois mécanismes, et un seul est social</h3>
    <div style="margin-top:3mm;">
      <div class="fiche"><b>La mémoire</b><span>Planter l’idée chez des milliers de gens
      qui n’en ont pas besoin aujourd’hui, pour qu’elle remonte dans trois ans. C’est le
      travail d’Instagram, de TikTok et de Facebook. Il se mesure en portée et en
      mémorisation, jamais en ventes du mois.</span></div>
      <div class="fiche"><b>La disponibilité</b><span>Être trouvé à l’instant précis où
      quelqu’un cherche. C’est le travail du référencement et des pages de conseil du site,
      déjà en place. Les réseaux n’y contribuent qu’indirectement.</span></div>
      <div class="fiche"><b>La preuve</b><span>Rassurer un dirigeant de pompes funèbres qui
      vous vérifie avant de signer. C’est le travail des réseaux aussi — et c’est le plus
      rentable des trois. La page suivante lui est consacrée.</span></div>
    </div>

    <h3 style="margin-top:8mm;">Ce que cela interdit, concrètement</h3>
    <ul class="puces" style="margin-top:3mm;">
      <li>Aucune publicité payante au lancement. Cibler « personnes en deuil » est
      impossible proprement, et les régies encadrent très strictement le funéraire.
      L’argent n’achèterait ici que du gaspillage et du risque.</li>
      <li>Aucun appel à l’action pressant. « Commandez maintenant » sous une vidéo qui parle
      de mort est une faute qui ne se rattrape pas.</li>
      <li>Aucune promesse de délai ou de prix en légende d’un contenu émotionnel. Le prix
      existe, il est sur le site, il n’a rien à faire sous un hommage.</li>
      <li>Aucune impatience. Ce plan produit ses effets sur des années, et c’est normal :
      c’est la durée du cycle d’achat réel.</li>
    </ul>

    <div class="bloc ligne-or conclut" style="margin-top:7mm;">
      <p>Si, au bout de trois mois, vous jugez ce travail à son nombre de commandes, vous
      l’arrêterez — et vous aurez détruit le seul actif qui se construisait. Jugez-le à ce
      qu’il produit vraiment : de la portée, des partages, et des professionnels qui vous
      répondent parce qu’ils vous ont déjà vu.</p>
    </div>
  </section>`;
}

/* ═══ 2. QUI REGARDE VRAIMENT ═══ */
function audience(V) {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">L’angle mort</div>
      <hr class="filet">
      <h2>Votre spectateur le plus précieux<br><em>n’est pas une famille.</em></h2>
    </div>

    <p>Voici l’observation qui vaut le reste du document, et que presque personne ne fait.</p>

    <p style="margin-top:4mm;">Quand vous démarchez une pompe funèbre — courriel, appel,
    message LinkedIn —, le dirigeant fait systématiquement une chose avant de vous répondre :
    <strong>il tape votre nom et il regarde vos comptes.</strong> Pas votre site, qu’il
    soupçonne d’être une vitrine. Vos comptes sociaux, parce qu’il pense y voir la vérité.</p>

    <p style="margin-top:4mm;">Ce qu’il y trouve décide de sa réponse. Un compte vide, ou un
    compte maladroit, et il conclut que vous n’existez pas vraiment. Un compte vivant, sobre,
    avec de vraies œuvres qu’il peut écouter, et il conclut l’inverse — souvent avant même de
    vous avoir parlé.</p>

    <div class="these">
      <p class="cle">Deux cents abonnés qui sont les bonnes personnes<br>
      valent mieux que <em>vingt mille</em> qui ne le sont pas.</p>
      <p>Cela change toutes les décisions qui suivent : ce qu’on publie, ce qu’on refuse de
      publier, et ce qu’on mesure. On n’optimise pas pour le compteur d’abonnés. On optimise
      pour ce que verra un dirigeant de cinquante ans qui vous vérifie un jeudi soir.</p>
    </div>

    <h3 style="margin-top:6mm;">Les trois publics, par ordre de valeur</h3>
    <div style="margin-top:3mm;">
      <div class="fiche"><b>1 · Le professionnel</b><span>Dirigeant de pompes funèbres,
      conseiller funéraire, responsable de crématorium. Peu nombreux, décisifs. Ils ne
      commentent jamais, ne likent presque pas, et regardent tout. Votre fil est leur enquête
      de moralité.</span></div>
      <div class="fiche"><b>2 · Le relais</b><span>Celui qui n’a pas besoin du service mais
      qui partage la vidéo à sa sœur, ou qui s’en souviendra pour ses parents. C’est lui qui
      fait le volume, et la seule chose qu’on puisse lui demander est de
      transmettre.</span></div>
      <div class="fiche"><b>3 · La famille</b><span>Celle qui a besoin maintenant. Elle est
      rarissime dans un fil, et elle n’arrive presque jamais par un réseau social : elle
      arrive par sa pompe funèbre ou par une recherche. On ne construit pas pour elle, on
      lui laisse simplement une porte ouverte et lisible.</span></div>
    </div>

    <h3 style="margin-top:8mm;">Les interdits du manuel valent ici aussi</h3>
    <p style="margin-top:3mm;">Le manuel de vente en fixe six pour le démarchage. Trois
    s’appliquent mot pour mot à une publication :</p>
    <div style="margin-top:3mm;">
      ${V.PLAN.interdits.filter((i) => /volume|chiffre|technologie|refus/i.test(i))
        .map((i) => `<div class="rang"><b>${esc(i)}</b><span>s’applique</span></div>`).join('')}
    </div>
    <p class="mode conclut" style="margin-top:3.4mm;">Lus dans la console, pas recopiés :
    s’ils changent là-bas, ils changent ici.</p>
  </section>`;
}

/* ═══ 3. LES TROIS RÉSEAUX ═══ */
function reseaux(L) {
  const R = [
    {
      nom: 'TikTok', role: 'La portée',
      corps: [
        'C’est le seul réseau où un compte neuf, sans un seul abonné, peut être vu par cent mille personnes dès la troisième vidéo. Aucun autre ne fait cela. Pour une maison inconnue, c’est décisif.',
        'Et c’est un réseau <strong>sonore</strong> : la musique n’y est pas un décor, c’est le contenu. Dix-huit œuvres originales sont exactement la matière qu’il récompense.'
      ],
      fiches: [
        ['Ce qu’on y met', 'Les vidéos verticales du catalogue, une œuvre par publication. Le disque qui tourne, le titre, trente-cinq secondes.'],
        ['Le rythme', 'Trois à cinq par semaine. C’est le seul réseau où la quantité compte vraiment : chaque vidéo est un billet de loterie indépendant.'],
        ['Le piège', 'Les commentaires. Sur un contenu qui touche à la mort, une minorité vient chercher la provocation. La modération n’est pas optionnelle — voir la partie qui lui est consacrée.'],
        ['Légende', L.tiktok + ' signes maximum, mais trois lignes suffisent.']
      ]
    },
    {
      nom: 'Instagram', role: 'La vitrine',
      corps: [
        'C’est le compte que le dirigeant de pompes funèbres ira voir. Il doit donc être beau, cohérent et manifestement soigné — la grille elle-même est un argument commercial.',
        'Les Reels y cherchent la portée, exactement comme TikTok et avec les mêmes fichiers. Le fil, lui, ne cherche pas la portée : il cherche la crédibilité.'
      ],
      fiches: [
        ['Ce qu’on y met', 'Reels : les mêmes vidéos verticales. Fil : les vignettes du catalogue, en 4:5. Stories : les coulisses, le seul endroit où l’on peut être informel.'],
        ['Le rythme', 'Deux Reels et une publication de fil par semaine. Des Stories quand il y a quelque chose à montrer, jamais pour meubler.'],
        ['Le piège', 'Publier au fil de l’eau sans penser à la grille. Regardez votre profil sur un téléphone après chaque publication : c’est ainsi qu’on le découvre.'],
        ['Légende', L.instagram + ' signes maximum. Les premières lignes seules sont visibles.']
      ]
    },
    {
      nom: 'Facebook', role: 'L’âge juste',
      corps: [
        'C’est le seul des trois où se trouve réellement la personne qui décide : celle de cinquante à soixante-quinze ans, qui organise les obsèques d’un parent. Les deux autres touchent surtout ses enfants.',
        'C’est aussi le seul qui porte une vie locale — groupes de commune, pages de village, culture du souvenir et de l’hommage public. C’est là que le partage a le plus de sens.'
      ],
      fiches: [
        ['Ce qu’on y met', 'Les mêmes vidéos, mais un texte deux fois plus long et beaucoup plus explicite : ici on lit vraiment, et on n’a pas peur d’une phrase entière.'],
        ['Le rythme', 'Deux publications par semaine. La régularité y compte plus que le volume.'],
        ['Le piège', 'Les groupes locaux. Y publier une promotion vous fait exclure. On n’y va que pour répondre à une question posée par quelqu’un d’autre — et encore, en s’identifiant clairement.'],
        ['Légende', 'Aucune limite utile (' + L.facebook + ' signes). Visez cinq à huit lignes.']
      ]
    }
  ];

  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Les trois réseaux</div>
      <hr class="filet">
      <h2>Trois rôles différents,<br><em>un seul catalogue.</em></h2>
    </div>

    <p>Le même fichier vidéo sert les trois. Ce qui change, c’est le texte autour, le rythme,
    et ce qu’on attend de chacun. Traiter les trois de la même façon est l’erreur la plus
    commune, et la plus coûteuse en temps.</p>

    <div style="margin-top:6mm;">
      ${R.map((r) => `
        <div class="reseau">
          <div class="reseau-tete"><h3>${esc(r.nom)}</h3><span class="role">${esc(r.role)}</span></div>
          <div class="reseau-corps">
            ${r.corps.map((p) => `<p>${p}</p>`).join('')}
            ${r.fiches.map(([k, v]) => `<div class="fiche"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}
          </div>
        </div>`).join('')}
    </div>

    <p class="disc conclut">Les limites de signes sont lues dans le planificateur de la
    console, qui les applique déjà à l’écran et passe au rouge en cas de dépassement.</p>
  </section>`;
}

/* ═══ 4. CE QUE VOUS POSSÉDEZ DÉJÀ ═══ */
function arsenal(O) {
  const A = [
    ['Dix-huit œuvres originales', 'gratuit · déjà là',
     'Composées, mixées, à vous. Aucun droit à régler, aucune limite d’usage. C’est la seule ' +
     'matière que personne d’autre au monde ne peut publier — et sur des réseaux sonores, ' +
     'c’est un avantage que l’argent n’achète pas.'],
    ['Dix-huit vidéos verticales', 'gratuit · npm run video',
     'Le disque d’or qui tourne, le titre, l’extrait le plus fort de la piste, en 1080 × 1920. ' +
     'Prêtes pour TikTok, les Reels et les Stories. Le format 4:5 du fil Instagram se fabrique ' +
     'avec la même commande.'],
    ['Dix-huit vignettes 1200 × 630', 'gratuit · npm run partage',
     'Déjà en place pour le partage de liens. Elles servent telles quelles au fil Facebook.'],
    ['Dix-huit pages d’écoute', 'gratuit · déjà en ligne',
     'Une adresse par œuvre, avec le lecteur, le récit et les paroles. C’est la destination ' +
     'de tous vos liens de profil : jamais la page d’accueil, toujours l’œuvre dont vous ' +
     'venez de parler.'],
    ['Un planificateur', 'gratuit · dans votre console',
     'Écran Publications : les textes se préparent, se datent, se rattachent à une œuvre, et ' +
     'le compteur de signes passe au rouge au-delà de la limite du réseau. Il relève aussi ' +
     'vues, réactions et partages — c’est votre tableau de bord.']
  ];
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">L’arsenal</div>
      <hr class="filet">
      <h2>Vous possédez déjà<br><em>tout ce qu’il faut.</em></h2>
    </div>

    <p>La plupart des plans de ce genre commencent par une liste d’achats. Celui-ci commence
    par un inventaire, parce que l’essentiel est fait et que rien de ce qui suit ne coûte
    un euro.</p>

    <div style="margin-top:6mm;">
      ${A.map(([t, c, p]) => `
        <div class="avoir">
          <div class="cout">${esc(c)}</div>
          <h3>${esc(t)}</h3>
          <p>${p}</p>
        </div>`).join('')}
    </div>

    <h3 style="margin-top:4mm;">La vidéo, en une commande</h3>
    <div class="copie" style="margin-top:3mm;">
      <p style="font-family:'Jetbrains Mono',monospace;font-size:8.6pt;">npm run video<br>
      npm run video -- ${esc(O[0].slug)}<br>
      npm run video -- --format 4:5</p>
    </div>
    <p class="mode" style="margin-top:2.6mm;">La première fabrique les ${O.length} vidéos
    verticales. La deuxième n’en refait qu’une. La troisième produit le format haut du fil
    Instagram. <b>Deux outils locaux, aucun compte, aucun envoi de vos œuvres chez un tiers.</b>
    Il faut les installer une fois : <span style="font-family:'Jetbrains Mono',monospace;">npm
    i -D playwright-core ffmpeg-static</span>.</p>

    <div class="bloc ligne-or conclut" style="margin-top:6mm;">
      <p>Le disque des vidéos n’est pas redessiné : il est lu dans la feuille de style du
      site. Une retouche de l’or sur le site se retrouve dans les dix-huit vidéos à la
      commande suivante. C’est la règle de toute la maison — rien n’est recopié, donc rien ne
      peut diverger.</p>
    </div>
  </section>`;
}

/* ═══ 5. L'IA, GRATUITEMENT ═══ */
function ia() {
  const U = [
    ['Écrire et décliner les textes', 'Claude, ChatGPT, Gemini — tous ont une offre gratuite',
     'Le vrai gain n’est pas d’écrire un texte, c’est d’en décliner un en trois versions pour ' +
     'trois réseaux en une minute. Donnez-lui vos propres modèles de ce document comme exemple ' +
     'de ton : sans cela, il produira de la publicité générique, exactement ce qu’il ne faut pas.'],
    ['Sous-titrer les vidéos', 'CapCut et les éditeurs de TikTok le font sans frais',
     'Quatre-vingts pour cent des vidéos sont regardées sans le son au premier coup d’œil. Des ' +
     'sous-titres incrustés ne sont pas un confort, c’est ce qui décide si l’on reste. Comme ' +
     'vos œuvres sont chantées, la transcription automatique suffit — relisez-la, elle se ' +
     'trompe sur les prénoms.'],
    ['Transcrire et traduire', 'Whisper, en local et libre',
     'Utile le jour où vous voudrez sous-titrer en anglais une œuvre corse ou antillaise. ' +
     'Tourne sur votre machine, rien ne sort de chez vous.'],
    ['Analyser ce qui a marché', 'Vos propres relevés, lus par une IA',
     'Au bout de deux mois, collez vos chiffres du planificateur et demandez ce que les trois ' +
     'meilleures publications ont en commun. C’est le seul usage de l’IA qui vous apprend ' +
     'quelque chose sur VOTRE audience plutôt que sur les moyennes du monde.']
  ];
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">L’intelligence artificielle</div>
      <hr class="filet">
      <h2>Ce qu’elle fait bien,<br><em>et ce qu’il ne faut pas lui donner.</em></h2>
    </div>

    <p>Votre outil d’IA le plus rentable, vous venez de le lire : c’est le générateur de
    vidéos. Il fabrique dix-huit montages à la demande, indéfiniment, sans abonnement et sans
    que vos œuvres quittent votre machine. Aucun service en ligne ne fera mieux, et la
    plupart vous factureraient au fichier.</p>

    <p style="margin-top:4mm;">Pour le reste, quatre usages valent le temps qu’ils prennent.
    Les autres — générateurs de calendriers, de « tendances », d’avatars — vous feront perdre
    plus d’heures qu’ils n’en font gagner.</p>

    <div style="margin-top:6mm;">
      ${U.map(([t, o, p]) => `
        <div class="avoir">
          <div class="cout">${esc(o)}</div>
          <h3>${esc(t)}</h3>
          <p>${p}</p>
        </div>`).join('')}
    </div>

    <h3 style="margin-top:4mm;">Deux avertissements, et ils comptent plus que la liste</h3>

    <div class="interdits" style="margin-top:3mm;">
      <ul class="puces">
        <li><strong>Jamais de visage ni de scène générés.</strong> Pas de faux portrait de
        défunt, pas de fausse famille en deuil, pas de fausse cérémonie — même « pour
        illustrer », même en précisant que c’est une image de synthèse. Vous vendez
        l’authenticité d’une œuvre écrite pour une personne réelle : une image inventée
        contredit votre unique argument. Le disque qui tourne et le catalogue suffisent.</li>
        <li><strong>Jamais une donnée de famille dans un outil en ligne.</strong> Ni un
        prénom, ni un enregistrement, ni le texte d’un brief, ni une capture d’un échange.
        Ce qu’on colle dans un service gratuit peut servir à l’entraîner. Les récits du
        catalogue sont déjà modifiés et publics : eux seuls peuvent sortir.</li>
      </ul>
    </div>

    <div class="bloc ligne-or conclut" style="margin-top:6mm;">
      <p>Les offres gratuites de ces services changent tous les trimestres — limites,
      conditions, propriété de ce que vous y produisez. Ce document ne promet donc aucune
      gratuité : vérifiez-la le jour où vous vous engagez, et ne bâtissez jamais une routine
      hebdomadaire sur un service dont la disparition vous arrêterait. Vos deux outils
      locaux, eux, ne peuvent pas changer d’avis.</p>
    </div>
  </section>`;
}

/* ═══ 6. LES FORMATS ═══ */
function formats(O) {
  const corse = parTitre(O, 'Vers les pâturages d’en haut');
  const F = [
    ['L’œuvre nue', 'TikTok · Reels · Facebook',
     'La vidéo du catalogue, trois lignes de texte, rien d’autre. C’est le format de base et ' +
     'celui qui porte tout : il démontre au lieu d’affirmer.',
     'Deux fois par semaine, indéfiniment. Dix-huit œuvres tiennent neuf semaines sans répétition.'],
    ['Le registre inattendu', 'TikTok · Reels',
     'Une polyphonie corse, un bélé antillais, un klezmer. La surprise est le moteur : on ' +
     'n’attend pas cela d’un service funéraire, donc on regarde jusqu’au bout.',
     'Le meilleur candidat du catalogue : ' + corse.titre + ', pour ' + corse.qui + '.'],
    ['Les cinq questions', 'Les trois',
     'Ce qu’il faut nous dire pour écrire la chanson de quelqu’un. Montrer la mécanique ' +
     'rassure, et répond sans qu’elle soit posée à l’objection « et si ce n’est pas bien ? ».',
     'Une fois par mois. C’est aussi le contenu que les professionnels enregistrent.'],
    ['Le QR code', 'Reels · Facebook',
     'PLAQUE → QR CODE → PAGE DE SOUVENIR → SA MUSIQUE. Filmé sur une vraie plaque, avec un ' +
     'vrai téléphone qui scanne. C’est ce que personne d’autre ne propose.',
     'Une fois par mois. C’est le contenu le plus partagé du lot, parce qu’il étonne.'],
    ['La question ouverte', 'Facebook surtout',
     'Une observation sur le métier, terminée par une vraie question. Aucun lien, aucune ' +
     'mention du service. C’est ce qui fait commenter, et un commentaire vaut dix vues.',
     'Une fois par semaine sur Facebook, où l’on discute encore.'],
    ['Le contre-pied', 'TikTok',
     'Les trois mêmes morceaux dans toutes les cérémonies, la playlist du téléphone posé sur ' +
     'une enceinte. On critique un usage, jamais une profession — la nuance n’est pas ' +
     'négociable.',
     'Une fois par mois au maximum. Deux, et vous devenez celui qui donne des leçons.']
  ];
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Les formats</div>
      <hr class="filet">
      <h2>Six formats,<br><em>et rien d’autre.</em></h2>
    </div>

    <p>Un format qui marche se répète jusqu’à ce qu’il cesse de marcher. Chercher la
    nouveauté à chaque publication est le meilleur moyen de ne jamais être identifiable.</p>

    <div style="margin-top:6mm;">
      ${F.map(([t, ou, quoi, quand], i) => `
        <div class="pilier">
          <div class="tete">
            <span class="num">${i + 1}</span>
            <h3>${esc(t)}</h3>
            <span class="part">${esc(ou)}</span>
          </div>
          <p style="font-size:9pt;">${esc(quoi)}</p>
          <p style="font-size:8.6pt;margin-top:2.6mm;color:#6f6857;">${esc(quand)}</p>
        </div>`).join('')}
    </div>

    <div class="bloc ligne-or conclut">
      <p>Les trois premières secondes décident de tout, sur les trois réseaux. Le disque d’or
      qui tourne y sert exactement à cela : c’est un objet qu’on n’a pas déjà vu mille fois,
      et il apparaît à l’image zéro.</p>
    </div>
  </section>`;
}

/* ═══ 7. LES MODÈLES ═══ */
function modeles(O, V, L) {
  const site = V.SITE;
  const papi = parTitre(O, 'Le Papi Pêcheur');
  const corse = parTitre(O, 'Vers les pâturages d’en haut');

  const M = [
    ['TikTok · l’œuvre nue', L.tiktok, [
      'Maurice était pêcheur. Le dimanche, un seau et un thermos.',
      'Sa famille nous a dit trois mots : patient, taquin, toujours le premier levé.',
      'On en a fait une chanson. Elle n’existe que pour lui.'
    ], '#hommage #musique #chansonfrancaise',
     'Trois lignes. La première ne parle ni de vous, ni du service : elle parle de Maurice. ' +
     'C’est ce qui fait rester.'],

    ['Instagram · Reel', L.instagram, [
      'Une polyphonie corse, pour un berger du Niolu.',
      'On nous demande parfois si on sait faire autre chose que du piano triste.',
      'Le catalogue compte ' + O.length + ' hommages, dans des registres qui n’ont rien à voir entre eux — parce que les gens non plus.',
      'Écoute complète en bio.'
    ], '#hommage #polyphoniecorse #musiqueoriginale',
     'Le lien ne se met pas dans la légende : Instagram ne les rend pas cliquables. ' +
     'Mettez celle-ci dans la bio, et changez-la à chaque Reel :' +
     '<span class="adresse">' + site + corse.adresse + '</span>'],

    ['Facebook · le format long', null, [
      'Il y a un moment, dans un rendez-vous d’organisation d’obsèques, où le conseiller demande : « et pour la musique ? »',
      'Et très souvent, un silence.',
      'La famille cherche. Quelqu’un propose une chanson que le défunt aimait. Un autre dit que c’est trop gai. On finit par prendre un morceau connu, parce qu’il faut décider et qu’il reste douze points à voir.',
      'Ce n’est la faute de personne : on demande à des gens en état de choc de faire un choix artistique en quatre minutes.',
      'Depuis deux ans, je compose des chansons écrites pour une seule personne, à partir de ce que sa famille raconte d’elle. Voilà celle de Maurice, 78 ans, pêcheur le dimanche : ' + site + papi.adresse,
      'Et vous, à ce moment-là, qu’est-ce que vous avez choisi ?'
    ], '',
     'Facebook est le seul des trois où l’on lit vraiment, et où le lien est cliquable dans ' +
     'la légende. La question finale est le moteur : <b>répondez à chaque commentaire, le ' +
     'jour même.</b>'],

    ['Les trois · le QR code', null, [
      'La cérémonie dure une heure. La plaque, elle, reste.',
      'Un QR code gravé dessus. On le scanne des années plus tard, et on retrouve la page de son proche : sa musique, ses photos, les mots qui avaient été dits.',
      'PLAQUE → QR CODE → PAGE DE SOUVENIR → SA MUSIQUE',
      'C’est la différence entre un hommage qui s’arrête au cimetière et un hommage que les petits-enfants pourront ouvrir.'
    ], '#memoire #hommage #qrcode',
     'À filmer en vrai : une main, un téléphone, la page qui s’ouvre. Une capture d’écran ne ' +
     'produit pas le même effet — c’est le geste qui se comprend.']
  ];

  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Prêt à publier</div>
      <hr class="filet">
      <h2>Quatre modèles,<br><em>un par usage.</em></h2>
    </div>

    <p>Le même fichier vidéo, quatre textes différents. C’est exactement le travail que l’IA
    fait bien : donnez-lui ces quatre-là comme exemples de ton, et demandez-lui de décliner
    les autres œuvres du catalogue.</p>

    <div style="margin-top:7mm;">
      ${M.map(([titre, limite, texte, diese, note]) => {
        const brut = texte.join('\n\n') + (diese ? '\n' + diese : '');
        const compte = limite ? brut.length + ' signes / ' + limite : brut.length + ' signes';
        return `<div class="modele">
          <div class="modele-tete">
            <h3>${esc(titre)}</h3>
            <span class="compte">${compte}</span>
          </div>
          <div class="copie">
            ${texte.map((p) => `<p>${esc(p)}</p>`).join('')}
            ${diese ? `<p class="mots-diese">${esc(diese)}</p>` : ''}
          </div>
          <p class="mode">${note}</p>
        </div>`;
      }).join('')}
    </div>

    <div class="bloc ligne-or conclut">
      <p>Trois mots-dièse, sans accent, et toujours les mêmes. Quinze ne multiplient pas la
      portée : ils signalent l’amateur, y compris au dirigeant qui vous vérifie.</p>
    </div>
  </section>`;
}

/* ═══ 8. LE CALENDRIER ═══ */
function calendrier(O) {
  const PH = [
    ['Semaines 1-2', 'On fabrique le stock. On ne publie pas.', [
      ['Semaine 1', 'npm run video : les ' + O.length + ' vidéos verticales, puis le format 4:5. Vous avez neuf semaines de contenu en une soirée.'],
      ['Semaine 1', 'Les trois comptes créés avec le même nom, la même photo, la même bio. Lien vers une page d’œuvre, jamais vers l’accueil.'],
      ['Semaine 2', 'Les douze premiers textes écrits et datés dans le planificateur de la console. On écrit tout d’avance, une fois — c’est la seule façon de tenir.']
    ]],
    ['Semaines 3-8', 'On publie, on répond, on ne vend rien.', [
      ['TikTok', 'Trois vidéos par semaine. Chaque vidéo est un billet indépendant : le volume est la stratégie.'],
      ['Instagram', 'Deux Reels et une publication de fil. Regardez la grille sur un téléphone après chaque envoi.'],
      ['Facebook', 'Deux publications, format long, question finale.'],
      ['Tous les jours', 'Vingt minutes de réponses aux commentaires. C’est la moitié du travail, et celle qu’on saute.'],
      ['Jamais', 'Aucun appel à l’action commercial pendant ces six semaines.']
    ]],
    ['Semaines 9-12', 'On mesure, on taille, on branche au commerce.', [
      ['Semaine 9', 'Relevé des quatre chiffres. C’est votre première base de référence — avant, il n’y avait rien à comparer.'],
      ['Semaine 10', 'On arrête le réseau qui ne donne rien. Deux réseaux tenus valent mieux que trois abandonnés.'],
      ['Semaine 11', 'Les meilleures publications deviennent des arguments : on les montre aux pompes funèbres démarchées. C’est le raccord avec le plan LinkedIn.'],
      ['Semaine 12', 'Les objectifs se fixent — maintenant, et à partir de vos chiffres réels.']
    ]]
  ];
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Le calendrier</div>
      <hr class="filet">
      <h2>Quatre-vingt-dix jours,<br><em>en trois phases.</em></h2>
    </div>

    <p>Ce plan est calibré pour <strong>deux à trois heures par semaine</strong>, tenues. Un
    plan qui en demande dix ne sera pas tenu, et un plan non tenu ne vaut rien. Tout repose
    donc sur la production par lots : une soirée qui fabrique deux mois de contenu.</p>

    <div style="margin-top:7mm;">
      ${PH.map(([quand, titre, lignes]) => `
        <div class="phase">
          <div class="phase-tete">
            <span class="quand">${esc(quand)}</span>
            <h3>${esc(titre)}</h3>
          </div>
          ${lignes.map(([q, quoi]) => `<div class="semaine"><b>${esc(q)}</b><span>${esc(quoi)}</span></div>`).join('')}
        </div>`).join('')}
    </div>

    <div class="bloc ligne-or conclut" style="margin-top:6mm;">
      <p>La seule chose qui ne se rattrape pas est la régularité. Un texte moyen, une accroche
      ratée, une vidéo qui ne prend pas : tout cela se corrige à la publication suivante. Trois
      semaines de silence, non.</p>
    </div>
  </section>`;
}

/* ═══ 9. LA MODÉRATION ═══ */
function moderation() {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Le risque</div>
      <hr class="filet">
      <h2>Les commentaires,<br><em>et ce qui s’y joue.</em></h2>
    </div>

    <p>C’est la partie que les plans marketing omettent, et c’est celle qui peut coûter le
    plus cher. Publier sur la mort attire trois sortes de réactions, et une seule est
    inoffensive.</p>

    <div style="margin-top:6mm;">
      <div class="fiche"><b>La personne touchée</b><span>Elle raconte son propre deuil, parfois
      longuement, parfois durement. <strong>On répond toujours, brièvement, sans rien vendre.</strong>
      Un mot humain suffit ; proposer un service à ce moment est une faute.</span></div>
      <div class="fiche"><b>Le provocateur</b><span>Il vient chercher une réaction sur un sujet
      sensible. <strong>On ne répond jamais.</strong> On masque le commentaire — il reste
      visible pour son auteur, qui ne comprend pas qu’il parle dans le vide et s’en va. La
      suppression, elle, provoque une escalade.</span></div>
      <div class="fiche"><b>Le curieux</b><span>Il demande le prix, le délai, comment ça marche.
      <strong>On répond avec précision et sans détour</strong>, et on renvoie vers la page de
      l’offre. C’est le seul endroit où parler d’argent est juste : il l’a demandé.</span></div>
    </div>

    <h3 style="margin-top:8mm;">Trois réglages à faire le premier jour</h3>
    <ul class="puces" style="margin-top:3mm;">
      <li>Le filtre de mots-clés, sur les trois réseaux. Chargez-y les insultes courantes et
      les termes ordurier liés à la mort : les commentaires concernés sont masqués avant
      d’être vus par quiconque.</li>
      <li>Le masquage par défaut des commentaires d’inconnus sur TikTok, le temps de prendre
      la main.</li>
      <li>Une règle personnelle, écrite : <em>on ne répond jamais à chaud.</em> Un commentaire
      blessant sur ce métier touche pour de vrai. On laisse passer une nuit.</li>
    </ul>

    <h3 style="margin-top:8mm;">Et la règle qui prime sur toutes</h3>
    <div class="interdits" style="margin-top:3mm;">
      <p style="font-size:9.4pt;color:#3a362c;"><strong>Jamais une famille réelle.</strong>
      Ni un prénom, ni une ville, ni une date, ni une capture d’un message reçu — même
      anonymisée, même avec l’accord de la famille, même des années après.</p>
      <p style="font-size:9.4pt;color:#3a362c;margin-top:3mm;">Le catalogue applique déjà
      cette règle : les prénoms et les récits y sont modifiés, et les pages le disent. Sur un
      réseau où une publication se partage hors de votre contrôle, l’exigence est plus haute
      encore. Une seule entorse détruit la seule chose qu’une pompe funèbre achète chez un
      prestataire : la certitude qu’il sera discret.</p>
    </div>
  </section>`;
}

/* ═══ 10. LA MESURE ═══ */
function mesure() {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">La mesure</div>
      <hr class="filet">
      <h2>Quatre chiffres,<br><em>et aucun objectif inventé.</em></h2>
    </div>

    <p><strong>Ce document ne vous donne aucun objectif chiffré, et c’est délibéré.</strong>
    Annoncer « dix mille abonnés en six mois » serait de l’invention pure : la maison n’a
    aucun historique sur ces réseaux, et vous jugeriez un travail réel à l’aune d’un nombre
    sorti de nulle part.</p>

    <p style="margin-top:4mm;">On relève quatre chiffres pendant huit semaines sans rien en
    attendre. C’est la base de référence. Les objectifs se fixent ensuite, à partir d’elle.</p>

    <div style="margin-top:6mm;">
      <div class="rang"><b>Vues, par publication</b><span>fourni par chaque réseau</span></div>
      <div class="rang"><b>Taux d’écoute complète</b><span>le seul qui compte vraiment</span></div>
      <div class="rang"><b>Partages et enregistrements</b><span>relevé à la main</span></div>
      <div class="rang"><b>Visites du site venues des réseaux</b><span>lisible dans Vercel</span></div>
    </div>

    <h3 style="margin-top:8mm;">Pourquoi le taux d’écoute complète prime</h3>
    <p style="margin-top:3mm;">Une vidéo vue trois secondes par cent mille personnes n’a rien
    produit. Une vidéo écoutée jusqu’au bout par deux mille en a marqué deux mille. Sur un
    marché où l’achat arrive des années plus tard, seule la seconde compte — et c’est
    précisément le chiffre que les tableaux de bord mettent en avant le moins.</p>

    <h3 style="margin-top:8mm;">Ce qu’on ne mesure pas</h3>
    <ul class="puces" style="margin-top:3mm;">
      <li>Le nombre d’abonnés. Deux cents professionnels du funéraire valent mieux que vingt
      mille curieux, et le compteur ne fait pas la différence.</li>
      <li>Les « j’aime ». Ils ne coûtent rien à celui qui les donne, donc ils ne disent rien.</li>
      <li>La portée d’une publication isolée. Elle varie du simple au centuple sans que vous y
      soyez pour quoi que ce soit. Regardez la moyenne d’un mois, jamais un pic.</li>
      <li>Les commandes du mois. C’est la mesure qui vous ferait tout arrêter au troisième
      mois, six semaines avant que cela commence à produire.</li>
    </ul>

    <div class="bloc ligne-or conclut" style="margin-top:7mm;">
      <p>Au bout de huit semaines, vous saurez ce que vaut une semaine normale. Alors
      seulement, fixez un objectif — et fixez-le sur le taux d’écoute complète, pas sur les
      vues. Les vues flattent ; l’écoute complète informe.</p>
    </div>
  </section>`;
}

/* ═══ 11. LUNDI MATIN ═══ */
function derniere(V, O) {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Pour commencer</div>
      <hr class="filet">
      <h2>Ce qu’il y a à faire<br><em>lundi matin.</em></h2>
    </div>

    <p>Un plan qu’on lit et qu’on referme ne sert à rien. Six actions, dans l’ordre, dont
    aucune ne demande de décider quoi que ce soit.</p>

    <div style="margin-top:6mm;">
      ${[
        'Lancer « npm run video ». Vous aurez ' + O.length + ' vidéos verticales en une heure, sans rien faire d’autre.',
        'Créer les trois comptes : même nom, même photo, même bio, lien vers une page d’œuvre.',
        'Régler les trois filtres de mots-clés avant la première publication, pas après.',
        'Écrire douze textes d’un coup dans le planificateur de la console, et les dater.',
        'Publier la première vidéo un mardi matin. Pas un dimanche soir.',
        'Bloquer vingt minutes par jour pour les commentaires. C’est la moitié du travail.'
      ].map((a, i) => `<div class="rang"><b>${esc(a)}</b><span>${i + 1}</span></div>`).join('')}
    </div>

    <div class="bloc ligne-or" style="margin-top:8mm;">
      <p class="dire">Ces réseaux ne vous apporteront pas de commande ce mois-ci. Ils vous
      apporteront, dans deux ans, des familles qui se souviendront d’avoir vu passer un disque
      d’or — et des pompes funèbres qui répondront à votre appel parce qu’elles vous auront
      déjà vu. C’est long, c’est le seul chemin, et il ne coûte rien d’autre que de la
      constance.</p>
    </div>

    <div style="margin-top:10mm;border-top:1px solid #e3ddcd;padding-top:5mm;">
      <div class="etiquette">Les documents de la maison</div>
      <div style="margin-top:3mm;">
        <div class="rang"><b>Brochure partenaire — à envoyer à une agence</b><span>console</span></div>
        <div class="rang"><b>Manuel de vente — le téléphone, les objections</b><span>console</span></div>
        <div class="rang"><b>Plan LinkedIn — les dirigeants de pompes funèbres</b><span>console</span></div>
        <div class="rang"><b>Ce plan — Instagram, Facebook, TikTok</b><span>console</span></div>
      </div>
      <p class="disc" style="margin-top:4mm;">Les quatre sont fabriqués à partir du contenu
      réel du site et de la console. Une correction de tarif ou d’argumentaire faite à l’écran
      se retrouve dans les PDF au prochain « npm run pdf ». Aucun chiffre n’est recopié à la
      main, ici comme ailleurs.</p>
      <p class="disc" style="margin-top:3mm;">${esc(V.SITE)}</p>
    </div>
  </section>`;
}

/* ═══ L'ASSEMBLAGE ═══ */
function html() {
  const V = venteDeLaConsole();
  const O = oeuvres();
  const L = limites();
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Melodia Funèbre — Plan Instagram, Facebook, TikTok</title>
<style>${fontes()}${CLAIR}${FLUX}${SUPPLEMENT}</style></head><body>
${couverture(O)}
${these()}
${audience(V)}
${reseaux(L)}
${arsenal(O)}
${ia()}
${formats(O)}
${modeles(O, V, L)}
${calendrier(O)}
${moderation()}
${mesure()}
${derniere(V, O)}
</body></html>`;
}

const TITRES = [
  'Le marketing classique',
  'Votre spectateur le plus précieux',
  'Trois rôles différents,',
  'Vous possédez déjà',
  'Ce qu’elle fait bien,',
  'Six formats,',
  'Quatre modèles,',
  'Quatre-vingt-dix jours,',
  'Les commentaires,',
  'Quatre chiffres,',
  'Ce qu’il y a à faire'
];

module.exports = { html, fichier: 'melodia-plan-reseaux-sociaux.pdf', TITRES };
