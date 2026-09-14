/* ═══════════════════════════════════════════════════════════════
   MELODIA — Le plan LinkedIn

   Troisième document de la série, et le seul qui parle d'un canal
   plutôt que d'un produit. Il prolonge la doctrine qui existe déjà
   dans la console commerciale — les cibles, la séquence, les
   interdits — au lieu d'en inventer une deuxième à côté. Un
   collaborateur qui lit le manuel de vente et ce plan-ci ne doit
   jamais avoir à choisir entre deux règles contradictoires.

   Ce qui est lu, et non retapé :
     · les chiffres et les interdits, de commercial-contenu.js ;
     · les cibles de prospection, du même fichier ;
     · les offres et les dix-huit œuvres, du contenu publié ;
     · les adresses /ecouter/<titre>, calculées par adresses.js.

   Les modèles de publication affichent leur longueur réelle, comptée
   à la génération : LinkedIn tronque à 3 000 signes, et un modèle qui
   dépasse sans le dire serait un piège.

   AUCUN CHIFFRE DE PERFORMANCE N'EST AVANCÉ. Pas de taux de clic, pas
   de portée attendue, pas de nombre de partenaires espérés. La maison
   n'a pas encore d'historique sur ce canal : donner des objectifs
   serait inventer. Le document explique donc comment fabriquer sa
   propre base de référence en quatre semaines, puis fixer des cibles
   à partir d'elle.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { fontes, image, CLAIR } = require('./pdf-style.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Le contenu de la console, lu tel quel — même procédé que le manuel. */
function venteDeLaConsole() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'assets/js/commercial-contenu.js'), 'utf8');
  const faux = {};
  new Function('window', src)(faux);
  if (!faux.MELODIA_VENTE) throw new Error('commercial-contenu.js n’expose plus MELODIA_VENTE');
  return faux.MELODIA_VENTE;
}

/* Les œuvres, avec l'adresse que porte réellement chacune. Les
   modèles de publication citent ces adresses : si une œuvre est
   renommée, le prochain « npm run pdf » corrige le document. */
function oeuvres() {
  const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets/data/content.json'), 'utf8'));
  const liste = (c.demos || []).filter((d) => d.visible !== false);
  const slugs = require('./adresses.js').adresses(liste);
  return liste.map((d, i) => ({
    titre: d.title, qui: d.who, style: d.style, mots: d.brief,
    adresse: '/ecouter/' + slugs[i],
    vignette: 'assets/img/partage/' + slugs[i] + '.jpg'
  }));
}

/* Une œuvre par son titre — pour qu'un modèle nomme ce qu'il cite
   plutôt qu'un rang dans un tableau qui bougera.

   La comparaison ignore la forme de l'apostrophe : le catalogue écrit
   « d'en haut » avec l'apostrophe droite, ce fichier avec la courbe,
   et deux textes que l'œil lit identiques ne doivent pas faire échouer
   la fabrication. Le titre introuvable, lui, arrête tout : un modèle
   qui citerait une œuvre retirée du catalogue enverrait le lecteur sur
   une page morte. */
const memeTitre = (s) => String(s).replace(/[’‘‛`´]/g, "'").trim().toLowerCase();

function parTitre(liste, titre) {
  const o = liste.filter((x) => memeTitre(x.titre) === memeTitre(titre))[0];
  if (!o) throw new Error('Œuvre absente du catalogue : ' + titre);
  return o;
}

const FLUX = `
  @page { size: A4; margin: 20mm 16mm 18mm; }
  @page :first { margin: 0; }

  .couv { background: #040407; color: #f4f1ea; height: 297mm; padding: 20mm 18mm;
          display: flex; flex-direction: column; break-after: page; }
  .couv h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 40pt; line-height: 1.04; color: #f4f1ea; }
  .couv h1 em { color: #c9a84c; }
  .couv p { color: #c4bba6; }
  .couv .surtitre { color: #c9a84c; }

  section.part { break-before: page; }
  section.part:first-of-type { break-before: auto; }

  .titre-part { margin-bottom: 8mm; }
  .titre-part hr { width: 26mm; margin: 3mm 0 5mm; }

  h2, h3, .titre-part { break-after: avoid; }
  p { orphans: 3; widows: 3; }
  .bloc { break-inside: avoid; margin-bottom: 5mm; }
  .conclut { break-before: avoid; }

  .etiquette { font-family: 'Jetbrains Mono', monospace; font-size: 6.6pt; letter-spacing: .2em;
               text-transform: uppercase; color: #9a8a5c; }
  .puces li { position: relative; padding-left: 6mm; margin-bottom: 2.2mm; font-size: 9.2pt;
              line-height: 1.6; color: #3a362c; break-inside: avoid; }
  .puces li::before { content: '—'; position: absolute; left: 0; color: #c9a84c; }

  .rang { display: grid; grid-template-columns: 1fr auto; gap: 4mm; align-items: baseline;
          padding: 2.6mm 0; border-bottom: 1px solid #e8e2d2; break-inside: avoid; }
  .rang b { font-weight: 400; font-size: 9.2pt; color: #3a362c; }
  .rang span { font-family: 'Jetbrains Mono', monospace; font-size: 8.6pt; color: #8a6f26; letter-spacing: .04em; }

  .ligne-or { border-left: 2px solid #c9a84c; padding-left: 5mm; }
  .dire { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 12.5pt; line-height: 1.5;
          font-style: italic; color: #17150f; }

  /* ─── Les piliers éditoriaux ─── */
  .pilier { break-inside: avoid; margin-bottom: 5mm; border: 1px solid #e3ddcd; background: #fffefb; padding: 5mm; }
  .pilier .tete { display: flex; align-items: baseline; gap: 4mm; margin-bottom: 2.5mm; }
  .pilier .num { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 19pt; color: #c9a84c; line-height: 1; }
  .pilier h3 { flex: 1; }
  .pilier .part { font-family: 'Jetbrains Mono', monospace; font-size: 7.4pt; letter-spacing: .12em; color: #8a6f26; }

  /* ─── Un modèle de publication : ce qui se copie tel quel ─── */
  .modele { break-inside: avoid; margin-bottom: 7mm; }
  .modele-tete { display: flex; justify-content: space-between; align-items: baseline;
                 border-bottom: 1px solid #c9a84c; padding-bottom: 2mm; margin-bottom: 3mm; }
  .modele-tete h3 { font-size: 13pt; }
  .modele-tete .compte { font-family: 'Jetbrains Mono', monospace; font-size: 7.2pt;
                         letter-spacing: .1em; color: #8a6f26; white-space: nowrap; }
  .copie { background: #f7f4ec; border: 1px solid #e3ddcd; padding: 5mm; }
  .copie p { font-size: 9pt; line-height: 1.68; color: #24221b; margin-bottom: 3.4mm; }
  .copie p:last-child { margin-bottom: 0; }
  .copie .mots-diese { font-family: 'Jetbrains Mono', monospace; font-size: 8pt; color: #8a6f26; letter-spacing: .02em; }
  .modele .mode { margin-top: 2.6mm; font-size: 8.2pt; line-height: 1.6; color: #6f6857; }
  .modele .mode b { color: #3a362c; font-weight: 500; }

  /* ─── Le calendrier ─── */
  .phase { break-inside: avoid; margin-bottom: 6mm; }
  .phase-tete { display: grid; grid-template-columns: 30mm 1fr; gap: 5mm; align-items: baseline;
                border-bottom: 1px solid #e3ddcd; padding-bottom: 2mm; margin-bottom: 3mm; }
  .phase-tete .quand { font-family: 'Jetbrains Mono', monospace; font-size: 7.6pt;
                       letter-spacing: .12em; text-transform: uppercase; color: #8a6f26; }
  .phase-tete h3 { font-size: 13pt; }

  .semaine { display: grid; grid-template-columns: 22mm 1fr; gap: 5mm; padding: 2.4mm 0;
             border-bottom: 1px solid #eee9db; break-inside: avoid; }
  .semaine b { font-family: 'Jetbrains Mono', monospace; font-size: 7.6pt; color: #8a6f26;
               letter-spacing: .06em; font-weight: 400; }
  .semaine span { font-size: 9pt; line-height: 1.58; color: #3a362c; }

  /* ─── L'interdit : il doit se voir de loin ─── */
  .interdits { border: 1px solid #d9c9c9; background: #fdf8f6; padding: 5mm; break-inside: avoid; }
  .interdits li::before { content: '×'; color: #9c4a3c; font-weight: 600; }
  .interdits li { color: #3a362c; }

  .deux { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
  .vignette { width: 100%; border: 1px solid #e3ddcd; display: block; }
`;

/* ═══ LES PARTIES ═══ */

function couverture(oeuvres) {
  return `<div class="couv">
    <img src="${image('assets/img/logo-melodia-complet.jpg')}" alt="Melodia Funèbre"
         style="width:40mm;height:40mm;object-fit:contain;mix-blend-mode:screen;">
    <div style="margin-top:auto;">
      <div class="surtitre">Document interne · Communication et prospection</div>
      <hr class="filet" style="width:30mm;margin:4mm 0 6mm;">
      <h1>Plan<br><em>LinkedIn.</em></h1>
      <p style="margin-top:7mm;font-size:12pt;line-height:1.7;max-width:122mm;">
        Se faire connaître des dirigeants de pompes funèbres avant de les appeler,
        et transformer ${oeuvres.length} hommages déjà composés en la seule preuve
        qui compte dans ce métier : une musique qu’on écoute jusqu’au bout.
      </p>
      <p style="margin-top:8mm;font-family:'Jetbrains Mono',monospace;font-size:7.4pt;
                letter-spacing:.16em;text-transform:uppercase;color:#6b5828;">
        Prolonge le manuel de vente · Ne le remplace pas
      </p>
    </div>
  </div>`;
}

/* ─── 1. Ce que LinkedIn fait, et ce qu'il ne fait pas ─── */
function principe(V) {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Le principe</div>
      <hr class="filet">
      <h2>LinkedIn ne vend rien.<br><em>Il fait que l’appel ne soit plus à froid.</em></h2>
    </div>

    <p>Le manuel de vente commence au Jour 0 par un courriel adressé à quelqu’un qui n’a
    jamais entendu parler de nous. C’est le moment le plus difficile de toute la séquence :
    tout se joue avant que la personne ait compris de quoi il s’agit.</p>

    <p style="margin-top:4mm;">LinkedIn sert à supprimer ce moment. Un dirigeant qui vous a vu
    passer six fois dans son fil pendant deux mois n’est plus un contact froid le jour où vous
    l’appelez : il sait déjà ce que vous faites, il a peut-être déjà écouté une œuvre. L’appel
    ne commence plus par « qui êtes-vous », il commence par le sujet.</p>

    <div class="bloc ligne-or" style="margin-top:6mm;">
      <p class="dire">On ne publie pas pour vendre. On publie pour que le jour où l’on
      appelle, on ne soit plus un inconnu.</p>
    </div>

    <h3 style="margin-top:8mm;">Pourquoi ce réseau, et pas un autre</h3>
    <ul class="puces" style="margin-top:3mm;">
      <li>Le décideur d’une maison indépendante y est joignable <strong>par son nom</strong>,
      sans passer par un standard ni par un formulaire.</li>
      <li>C’est le seul endroit où l’on peut être vu pendant des mois sans rien demander.
      Dans un métier où la confiance se construit lentement, cela vaut plus qu’un argumentaire.</li>
      <li>Le sujet est professionnel, jamais intime. Sur un réseau familial, parler d’obsèques
      met tout le monde mal à l’aise ; ici, c’est le métier de la personne en face.</li>
      <li>Les ${18} vignettes de partage du catalogue sont déjà au format qu’attend LinkedIn.
      Rien à fabriquer.</li>
    </ul>

    <h3 style="margin-top:8mm;">La règle qui prime sur toutes les autres</h3>
    <div class="interdits" style="margin-top:3mm;">
      <p style="font-size:9.4pt;color:#3a362c;"><strong>Jamais une famille réelle.</strong>
      Ni un prénom, ni une ville, ni une date, ni une anecdote reconnaissable, ni une capture
      d’un message reçu — même anonymisée, même avec l’accord de la famille, même des années
      après.</p>
      <p style="font-size:9.4pt;color:#3a362c;margin-top:3mm;">Le catalogue du site applique
      déjà cette règle : les prénoms et les récits y sont modifiés, et la page le dit. Sur un
      réseau social, où une publication se partage hors de votre contrôle et reste indexée,
      l’exigence est plus haute encore. Une seule entorse suffit à détruire la seule chose
      qu’une pompe funèbre achète chez un prestataire : la certitude qu’il sera discret.</p>
    </div>

    <h3 style="margin-top:8mm;">Ce que le manuel dit déjà, et qui vaut ici sans changement</h3>
    <div style="margin-top:3mm;">
      ${V.PLAN.interdits.map((i) => `<div class="rang"><b>${esc(i)}</b><span>s’applique</span></div>`).join('')}
    </div>
    <p class="disc" style="margin-top:4mm;">Ces interdits sont lus dans la console commerciale.
    Ils ne sont pas recopiés ici : s’ils changent là-bas, ils changent dans ce document.</p>
  </section>`;
}

/* ─── 2. À qui l'on s'adresse ─── */
function cibles(V) {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">La cible</div>
      <hr class="filet">
      <h2>À qui l’on écrit,<br><em>et dans quel ordre.</em></h2>
    </div>

    <p>Les cibles sont les mêmes qu’au téléphone : ce n’est pas parce que le canal change que
    le marché change. Elles sont reprises de la console, avec ce que LinkedIn ajoute ou retire
    à chacune.</p>

    <div style="margin-top:6mm;">
      ${V.PLAN.cibles.map((c, i) => `
        <div class="pilier">
          <div class="tete">
            <span class="num">${i + 1}</span>
            <h3>${esc(c.titre)}</h3>
            <span class="part">${esc(c.priorite)}</span>
          </div>
          <p style="font-size:9pt;">${esc(c.pourquoi)}</p>
          ${LINKEDIN_CIBLE[c.titre] ? `<p style="font-size:8.6pt;margin-top:2.6mm;color:#6f6857;">
            <b style="color:#8a6f26;font-weight:500;">Sur LinkedIn :</b> ${esc(LINKEDIN_CIBLE[c.titre])}</p>` : ''}
        </div>`).join('')}
    </div>

    <h3 style="margin-top:6mm;">Comment on les trouve, sans aucun outil</h3>
    <ul class="puces" style="margin-top:3mm;">
      <li>La recherche LinkedIn, filtre <em>Personnes</em>, mots « pompes funèbres » ou
      « services funéraires », filtre <em>Région</em> sur un département à la fois.</li>
      <li>Les intitulés qui désignent un décideur : gérant, dirigeant, directeur,
      président, fondateur. Un conseiller funéraire ne signe pas ; il peut en revanche
      faire remonter, et c’est déjà utile.</li>
      <li>Les pages d’entreprise des maisons repérées : la section
      <em>Personnes</em> d’une page donne souvent le dirigeant plus vite que la recherche.</li>
      <li>Les groupes professionnels du secteur, et les commentaires sous les publications
      des fédérations : on y lit qui s’exprime, donc qui est actif.</li>
    </ul>

    <div class="bloc ligne-or" style="margin-top:6mm;">
      <p>Une fiche par personne trouvée, dans la console, avec sa date de prochaine action —
      exactement comme une fiche téléphonique. Une fiche LinkedIn sans date est une fiche
      morte, au même titre qu’une autre.</p>
    </div>
  </section>`;
}

const LINKEDIN_CIBLE = {
  'Maisons indépendantes, 1 à 3 agences':
    'le dirigeant est presque toujours sur le réseau à son nom propre, souvent peu actif. ' +
    'Une demande de connexion personnalisée y est lue.',
  'Petits groupes régionaux, 4 à 15 agences':
    'visez le directeur général ou le directeur du développement. Les intitulés sont explicites, ' +
    'et la page d’entreprise du groupe les liste.',
  'Enseignes nationales':
    'ne les sollicitez pas encore. En revanche, suivez leurs pages : ce qu’elles annoncent ' +
    'vous dit ce que le marché s’apprête à demander.',
  'Crématoriums et chambres funéraires':
    'moins présents à titre personnel, mais leurs responsables le sont. Un seul oui ' +
    'vous expose aux familles de plusieurs agences à la fois.'
};

/* ─── 3. Le profil, avant toute publication ─── */
function profil() {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Les fondations</div>
      <hr class="filet">
      <h2>Le profil se répare<br><em>avant la première publication.</em></h2>
    </div>

    <p>Une publication réussie envoie le lecteur sur votre profil. S’il y trouve un intitulé
    vague et une photo de vacances, le travail de la publication est perdu à l’endroit précis
    où il devait servir. Cette page se fait une fois, en une heure, et ne se refait plus.</p>

    <h3 style="margin-top:7mm;">Votre profil personnel, pas une page d’entreprise</h3>
    <p style="margin-top:3mm;">Personne ne suit la page d’un prestataire qu’il ne connaît pas.
    En revanche, on accepte la connexion d’une personne. Dans ce métier plus qu’ailleurs, ce qui
    se vend est un interlocuteur : la maison a un fondateur, et c’est lui qu’on suit. La page
    d’entreprise existe pour la crédibilité — on la remplit, on y republie, on n’en attend pas
    d’audience.</p>

    <div style="margin-top:6mm;">
      <div class="rang"><b>Le titre sous votre nom</b><span>220 signes</span></div>
      <div class="rang"><b>La photo de couverture</b><span>1584 × 396 px</span></div>
      <div class="rang"><b>La section « Infos »</b><span>2 600 signes</span></div>
      <div class="rang"><b>La sélection épinglée</b><span>3 à 5 éléments</span></div>
      <div class="rang"><b>Une demande de connexion avec note</b><span>300 signes</span></div>
      <div class="rang"><b>Une publication</b><span>3 000 signes</span></div>
    </div>
    <p class="disc" style="margin-top:3mm;">Les limites de LinkedIn changent sans préavis.
    Vérifiez-les le jour où vous écrivez : le planificateur de la console compte les signes
    pour vous et signale le dépassement en rouge.</p>

    <h3 style="margin-top:8mm;">Le titre : écrit pour un directeur d’agence, pas pour un confrère</h3>
    <div class="copie" style="margin-top:3mm;">
      <p>Je compose des chansons originales pour les cérémonies funéraires · Une œuvre écrite
      pour une seule personne, livrée en 24 h, sans droits SACEM · Partenariats avec les
      pompes funèbres</p>
    </div>
    <p class="mode" style="margin-top:2.6mm;">Trois informations, dans l’ordre où elles
    intéressent : <b>ce que c’est</b>, <b>ce que ça règle</b>, <b>à qui l’on parle</b>.
    Aucun mot de jargon, aucune mention de technologie — le manuel l’interdit tant qu’on ne
    vous l’a pas demandé, et la règle vaut sur un profil comme au téléphone.</p>

    <h3 style="margin-top:8mm;">La sélection épinglée : c’est elle qui travaille</h3>
    <p style="margin-top:3mm;">C’est la seule partie du profil où l’on peut faire écouter.
    Épinglez, dans cet ordre :</p>
    <ul class="puces" style="margin-top:3mm;">
      <li>Deux ou trois œuvres du catalogue, choisies dans des registres très différents —
      une chanson française et une polyphonie corse en disent plus long sur l’étendue du
      savoir-faire que n’importe quelle phrase.</li>
      <li>La page des professionnels, qui porte l’offre de partenariat.</li>
      <li>La page du QR code mémorial : c’est ce que personne d’autre ne propose, et c’est
      ce dont on se souvient.</li>
    </ul>

    <div class="bloc ligne-or conclut" style="margin-top:7mm;">
      <p>Tant que ces trois choses ne sont pas faites, ne publiez pas et n’envoyez aucune
      demande de connexion. Une première impression ne se rejoue pas.</p>
    </div>
  </section>`;
}

/* ─── 4. La ligne éditoriale ─── */
function piliers(oeuvres) {
  const P = [
    ['La preuve qui s’écoute', '2 fois sur 5',
     'Une œuvre du catalogue, son registre, pour qui elle a été écrite, et le lien pour ' +
     'l’entendre. C’est le seul contenu qui démontre au lieu d’affirmer : trente secondes ' +
     'd’écoute valent mieux que dix arguments. Le catalogue en compte ' + oeuvres.length + ' — ' +
     'il y a de quoi tenir des mois sans jamais se répéter.',
     'La vignette 1200 × 630 est déjà fabriquée pour chaque œuvre : assets/img/partage/.'],
    ['Le métier de celui qui lit', '1 fois sur 5',
     'Une observation sur le quotidien d’une agence : le moment du choix de la musique, ' +
     'la famille qui ne sait pas quoi répondre, la playlist qui ressert. On ne vend rien, ' +
     'on montre qu’on connaît le métier. C’est ce qui fait qu’un dirigeant vous lit une ' +
     'deuxième fois.',
     'Aucun lien, aucun appel à l’action. Une publication qui ne demande rien est celle ' +
     'qu’on partage.'],
    ['La maison, de l’intérieur', '1 fois sur 5',
     'Comment une œuvre se fabrique : les cinq questions du brief, les 24 heures, la plaque ' +
     'et son QR code. Montrer la mécanique rassure — un dirigeant qui comprend le processus ' +
     'peut l’expliquer à une famille, et c’est lui qui le fera.',
     'C’est ici qu’on répond, sans qu’elle soit posée, à l’objection « et si ce n’est pas ' +
     'bien ? ».'],
    ['La prise de position', '1 fois sur 5',
     'Le fond du sujet : ce que dit d’une vie une musique enregistrée par quelqu’un d’autre, ' +
     'diffusée depuis un téléphone. Ce pilier crée les commentaires, donc la visibilité — ' +
     'mais il se manie avec précaution : on critique un usage, jamais une profession.',
     'Une prise de position par mois suffit. Deux, et vous devenez celui qui donne des leçons.']
  ];
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">La ligne éditoriale</div>
      <hr class="filet">
      <h2>Quatre piliers,<br><em>et rien d’autre.</em></h2>
    </div>

    <p>Trois publications par semaine, réparties entre quatre familles de contenu. La
    répartition n’est pas décorative : elle empêche le seul travers qui tue un fil
    professionnel, celui de ne parler que de soi.</p>

    <div style="margin-top:6mm;">
      ${P.map(([titre, part, quoi, note], i) => `
        <div class="pilier">
          <div class="tete">
            <span class="num">${i + 1}</span>
            <h3>${titre}</h3>
            <span class="part">${part}</span>
          </div>
          <p style="font-size:9pt;">${quoi}</p>
          <p style="font-size:8.6pt;margin-top:2.6mm;color:#6f6857;">${note}</p>
        </div>`).join('')}
    </div>

    <h3 style="margin-top:6mm;">Le rythme</h3>
    <div style="margin-top:3mm;">
      <div class="rang"><b>Mardi matin</b><span>Pilier 1 — une œuvre</span></div>
      <div class="rang"><b>Jeudi matin</b><span>Pilier 2, 3 ou 4, en alternance</span></div>
      <div class="rang"><b>Samedi ou dimanche</b><span>Rien. Jamais.</span></div>
      <div class="rang"><b>Trente minutes après chaque publication</b><span>Répondre aux commentaires</span></div>
    </div>
    <p class="mode" style="margin-top:3.4mm;">Le manuel interdit déjà d’écrire à une agence
    le dimanche ou après 19 h. Une publication professionnelle sur le funéraire un dimanche
    soir tombe dans le même travers, et se voit davantage.</p>

    <div class="bloc ligne-or conclut" style="margin-top:6mm;">
      <p>Trois publications par semaine tenues pendant six mois valent infiniment mieux que
      douze en janvier et plus rien en février. Si vous doutez de pouvoir tenir trois, tenez-en
      deux : la régularité est le seul paramètre qui ne se rattrape pas.</p>
    </div>
  </section>`;
}

/* ─── 5. Les modèles prêts à publier ─── */
function modeles(oeuvres, V) {
  const site = V.SITE;
  const papi = parTitre(oeuvres, 'Le Papi Pêcheur');
  const corse = parTitre(oeuvres, 'Vers les pâturages d’en haut');
  const brief = V.BRIEF;

  /* Chaque modèle est un tableau de paragraphes. Le compteur de signes
     est calculé sur le texte réellement composé, pas estimé. */
  const M = [
    {
      pilier: 1, titre: 'Une œuvre, sans emballage',
      texte: [
        'Maurice était pêcheur. Pas professionnel — le dimanche, avec un seau et un thermos.',
        'Sa famille nous a dit trois choses de lui : patient, taquin, toujours le premier levé.',
        'Nous en avons fait une chanson française de trois minutes. Elle a été diffusée à sa cérémonie. Elle n’existe que pour lui.',
        'Vous pouvez l’écouter ici : ' + site + papi.adresse,
        'C’est une œuvre originale : aucun droit à déclarer, aucune autorisation à demander.'
      ],
      diese: '#servicesfuneraires #hommage #ceremonie',
      mode: 'Joignez la vignette de l’œuvre (<b>' + papi.vignette + '</b>). Le prénom est ' +
            'fictif, comme dans tout le catalogue — et vous n’avez pas à le préciser dans la ' +
            'publication, la page liée le dit déjà.'
    },
    {
      pilier: 2, titre: 'Le métier de celui qui lit',
      texte: [
        'Il y a un moment, dans un rendez-vous d’organisation, où le conseiller demande : « et pour la musique ? »',
        'Et très souvent, un silence.',
        'La famille cherche. Quelqu’un propose une chanson que le défunt aimait. Un autre dit que c’est trop gai. On finit par prendre un morceau connu, parce qu’il faut bien décider et qu’il reste douze points à voir.',
        'Ce n’est la faute de personne. On demande à des gens en état de choc de faire un choix artistique en quatre minutes.',
        'Je ne sais pas comment vous faites, vous, à ce moment-là. Je serais sincèrement curieux de le savoir.'
      ],
      diese: '#servicesfuneraires #ceremonie',
      mode: 'Aucun lien, aucune mention du service. Cette publication existe pour la question ' +
            'finale : c’est elle qui fait commenter, et un commentaire d’un dirigeant vaut ' +
            'une porte ouverte. <b>Répondez à chacun, le jour même.</b>'
    },
    {
      pilier: 3, titre: 'Comment c’est fabriqué',
      texte: [
        'On me demande souvent ce qu’il faut nous donner pour écrire la chanson de quelqu’un.',
        'Cinq choses. Pas une de plus :',
        brief.map((b) => '· ' + b).join('\n'),
        'Trois minutes de conversation avec la famille. Le reste est notre travail, et l’œuvre est livrée sous 24 heures.',
        'Pour une agence, cela veut dire : aucun matériel, aucun studio, aucune production à gérer. Une question posée pendant le rendez-vous, et c’est tout.'
      ],
      diese: '#servicesfuneraires #partenariat',
      mode: 'Le plus utile des quatre piliers pour un dirigeant : il répond à « qu’est-ce que ' +
            'ça va me coûter comme travail ». C’est l’objection réelle derrière « on n’a pas ' +
            'le temps ».'
    },
    {
      pilier: 4, titre: 'La prise de position',
      texte: [
        'Trois morceaux reviennent dans presque toutes les cérémonies auxquelles j’assiste.',
        'Ce sont de belles chansons. Elles ont été écrites pour des inconnus, il y a trente ans, et elles ont accompagné des milliers de personnes qui ne se ressemblaient pas.',
        'Je ne reproche rien à personne : il n’existait pas d’autre solution.',
        'Mais une vie de quatre-vingts ans mérite mieux qu’un morceau choisi par défaut et diffusé depuis un téléphone posé sur une enceinte.',
        'C’est la seule raison pour laquelle ce métier existe.'
      ],
      diese: '#servicesfuneraires #hommage',
      mode: 'On critique <b>un usage</b>, jamais une profession — la nuance est dans la ' +
            'troisième phrase, ne la retirez pas. Une publication de ce genre par mois, ' +
            'pas davantage.'
    },
    {
      pilier: 3, titre: 'Le QR code, la seule chose que personne d’autre ne fait',
      texte: [
        'La cérémonie dure une heure. La plaque, elle, reste.',
        'Nous gravons un QR code sur une plaque discrète. Une famille le scanne avec son téléphone, des mois ou des années plus tard, et retrouve la page de son proche : sa musique, ses photos, les mots qui avaient été dits.',
        'PLAQUE → QR CODE → PAGE DE SOUVENIR → SA MUSIQUE',
        'Ce n’est pas un gadget. C’est la différence entre un hommage qui se termine au cimetière et un hommage qui reste accessible aux petits-enfants.',
        'Le détail : ' + site + '/qr-code-memorial'
      ],
      diese: '#servicesfuneraires #innovation #memoire',
      mode: 'La flèche en majuscules se lit bien sur un téléphone et se retient. ' +
            'Joignez une photo de la plaque — <b>assets/img/plaque-qr-1100.jpg</b> est ' +
            'déjà dans le dépôt.'
    },
    {
      pilier: 1, titre: 'L’étendue du répertoire',
      texte: [
        'Une polyphonie corse pour un berger du Niolu. Un bélé pour un tambouyé de Fort-de-France. Un klezmer pour une femme de quatre-vingt-cinq ans.',
        'On me demande parfois si « on sait faire autre chose que du piano triste ».',
        'Le catalogue compte ' + oeuvres.length + ' hommages dans ' + registres(oeuvres) + ' registres différents, parce que les gens ne se ressemblent pas et que leur musique ne devrait pas se ressembler non plus.',
        'La corse est ici : ' + site + corse.adresse,
        'Les autres : ' + site + '/demos'
      ],
      diese: '#servicesfuneraires #musique #hommage',
      mode: 'À réserver au moment où votre fil compte déjà quelques publications du pilier 1 : ' +
            'elle prend tout son sens quand le lecteur a déjà entendu une œuvre.'
    }
  ];

  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Prêt à publier</div>
      <hr class="filet">
      <h2>Six modèles,<br><em>à copier tels quels.</em></h2>
    </div>

    <p>Écrits, comptés, utilisables ce matin. Modifiez-les : un texte recopié à l’identique par
    plusieurs personnes se repère. Mais gardez la structure — première ligne courte, une idée
    par paragraphe, le lien en fin de texte.</p>

    <p style="margin-top:4mm;"><strong>La première ligne décide de tout.</strong> LinkedIn
    n’affiche que les deux ou trois premières avant « …voir plus ». Une accroche qui commence
    par « Nous sommes heureux de vous annoncer » est morte à la deuxième ligne.</p>

    <div style="margin-top:7mm;">
      ${M.map((m) => {
        const texte = m.texte.join('\n\n');
        const signes = texte.length + m.diese.length + 1;
        return `<div class="modele">
          <div class="modele-tete">
            <h3>${esc(m.titre)}</h3>
            <span class="compte">Pilier ${m.pilier} · ${signes} signes / 3 000</span>
          </div>
          <div class="copie">
            ${m.texte.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}
            <p class="mots-diese">${esc(m.diese)}</p>
          </div>
          <p class="mode">${m.mode}</p>
        </div>`;
      }).join('')}
    </div>

    <div class="bloc ligne-or conclut">
      <p>Trois mots-dièse suffisent, et toujours les mêmes : c’est ainsi qu’on finit par être
      trouvé sur un sujet. Quinze mots-dièse ne multiplient pas la portée, ils signalent
      l’amateur.</p>
      <p style="margin-top:3mm;">Ils sont écrits sans accent — <em>#servicesfuneraires</em> et
      non <em>#servicesfunéraires</em>. Le réseau accepte les deux, mais une recherche se tape
      le plus souvent sans accent, et deux orthographes concurrentes divisent en deux le peu
      d’audience qu’un mot-dièse apporte. Choisissez-en trois une fois pour toutes, et ne les
      changez plus.</p>
    </div>
  </section>`;
}

/* Combien de registres musicaux distincts — compté, pas affirmé. */
function registres(oeuvres) {
  return new Set(oeuvres.map((o) => o.style)).size;
}

/* ─── 6. Le calendrier ─── */
function calendrier() {
  const PH = [
    ['Semaines 1-2', 'On prépare. On ne prospecte pas.', [
      ['Semaine 1', 'Profil, photo de couverture, section « Infos », sélection épinglée. Page d’entreprise créée et remplie. Aucune publication, aucune demande de connexion.'],
      ['Semaine 2', 'Première publication du pilier 1, puis du pilier 2. On observe : qui regarde le profil, qui réagit. On ne contacte encore personne.']
    ]],
    ['Semaines 3-6', 'On publie, on se connecte, on ne vend rien.', [
      ['Chaque semaine', 'Trois publications, selon la répartition des quatre piliers.'],
      ['Chaque semaine', 'Vingt demandes de connexion, avec note, vers des dirigeants repérés — le même volume que les vingt fiches hebdomadaires du manuel.'],
      ['Chaque semaine', 'Cinq commentaires utiles sous des publications du secteur. Un commentaire de trois lignes qui apporte quelque chose vaut mieux qu’une publication de plus.'],
      ['Jamais', 'Aucun message de vente à une connexion acceptée pendant cette phase. C’est le piège classique, et il grille le contact.']
    ]],
    ['Semaines 7-12', 'On enclenche la séquence commerciale.', [
      ['Chaque semaine', 'Même rythme de publication : il ne s’arrête plus.'],
      ['Chaque semaine', 'Dix messages aux connexions acceptées depuis plus de trois semaines, qui ont vu passer au moins quatre publications.'],
      ['À la réponse', 'On bascule sur la séquence du manuel de vente, au Jour 2 : l’appel. LinkedIn a remplacé le courriel du Jour 0.'],
      ['Semaine 12', 'Relevé des quatre chiffres de la page suivante. C’est votre première base de référence.']
    ]]
  ];
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Le calendrier</div>
      <hr class="filet">
      <h2>Quatre-vingt-dix jours,<br><em>en trois phases.</em></h2>
    </div>

    <p>La faute que fait tout le monde est de commencer par le message de vente. Le réseau
    fonctionne dans l’autre sens : on est vu d’abord, on écrit ensuite. Les six premières
    semaines ne rapportent rien, et c’est normal — elles rendent possibles les suivantes.</p>

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

    <h3 style="margin-top:6mm;">Où vit ce calendrier</h3>
    <p style="margin-top:3mm;">Dans la console, écran <em>Publications</em>. Chaque texte s’y
    prépare, s’y date, s’y rattache à une œuvre du catalogue, et le compteur de signes
    y devient rouge au-delà de la limite du réseau choisi. L’outil planifie et garde la trace ;
    il ne publie pas à votre place, et il vous le dit lui-même à l’écran.</p>

    <div class="bloc ligne-or conclut" style="margin-top:6mm;">
      <p>Écrivez trois semaines de publications d’avance, le vendredi après-midi — au moment
      où le manuel place déjà l’écriture des relances. Une semaine chargée ne doit jamais
      pouvoir interrompre la régularité.</p>
    </div>
  </section>`;
}

/* ─── 7. Les messages de prospection ─── */
function messages(V) {
  const site = V.SITE;
  const MSG = [
    ['La demande de connexion', 300,
     'Bonjour [Prénom], je compose des chansons originales pour les cérémonies funéraires et ' +
     'je suis avec intérêt ce que font les maisons indépendantes de [département]. Au plaisir ' +
     'd’échanger. Maxime Charavet',
     'Sans note, une demande de connexion est acceptée ou ignorée au hasard. Avec une note, ' +
     'elle est lue. <b>Aucune vente ici</b> : on demande une connexion, pas un rendez-vous.'],
    ['Le premier message, trois semaines plus tard', null,
     'Bonjour [Prénom],\n\nMerci d’avoir accepté ma demande. Je ne vais pas vous vendre quoi que ce soit dans ce message.\n\nJe compose des chansons originales pour les familles : une œuvre écrite pour une seule personne, à partir de ce qu’on nous raconte d’elle, livrée en 24 heures et sans droits à déclarer.\n\nSi vous avez trois minutes, en voici une : ' + site + '/demos\n\nÇa vous parle ou pas du tout — dans les deux cas votre avis de professionnel m’intéresse.\n\nMaxime',
     'La deuxième phrase désamorce ce que le lecteur redoute en ouvrant le message. La ' +
     'dernière laisse une porte de sortie : <b>un dirigeant qui peut dire non facilement ' +
     'répond plus souvent.</b>'],
    ['La relance, une seule fois, sept jours après', null,
     'Bonjour [Prénom], je me permets un dernier message — je ne reviendrai pas vers vous ' +
     'ensuite. Si le sujet vous intéresse un jour, ma porte est ouverte. Bonne continuation. Maxime',
     'Le manuel interdit de relancer deux fois : la règle vaut ici. Annoncer que c’est le ' +
     'dernier message est ce qui fait répondre — et vous engage.'],
    ['La réponse à un « envoyez-moi de la documentation »', null,
     'Avec plaisir. Je vous envoie la brochure partenaire par courriel — à quelle adresse ?\n\n' +
     'Et si vous préférez trois minutes au téléphone plutôt que quinze pages, dites-moi ' +
     'quand vous appeler : c’est plus rapide pour vous comme pour moi.',
     'On donne ce qui est demandé, et on propose l’appel sans l’imposer. La brochure ' +
     'partenaire existe déjà en PDF dans votre console.']
  ];
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">La prospection</div>
      <hr class="filet">
      <h2>Quatre messages,<br><em>et pas un de plus.</em></h2>
    </div>

    <p>La messagerie de LinkedIn n’est pas un canal de vente, c’est une porte. Ces quatre
    textes couvrent tout ce qui s’y passe ; au-delà, on est au téléphone, et c’est le manuel
    de vente qui prend le relais.</p>

    <div style="margin-top:7mm;">
      ${MSG.map(([titre, limite, texte, note]) => {
        const compte = limite
          ? texte.length + ' signes / ' + limite
          : texte.length + ' signes';
        return `<div class="modele">
          <div class="modele-tete">
            <h3>${esc(titre)}</h3>
            <span class="compte">${compte}</span>
          </div>
          <div class="copie">
            ${texte.split('\n\n').map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}
          </div>
          <p class="mode">${note}</p>
        </div>`;
      }).join('')}
    </div>

    <h3>Le raccord avec le manuel de vente</h3>
    <div style="margin-top:3mm;">
      <div class="rang"><b>Jour 0 — courriel de premier contact</b><span>remplacé par LinkedIn</span></div>
      ${V.PLAN.sequence.slice(1).map((s) => `<div class="rang"><b>${esc(s.jour)} — ${esc(s.action)}</b><span>inchangé</span></div>`).join('')}
    </div>
    <p class="mode conclut" style="margin-top:3.4mm;">Une fois la conversation engagée sur
    LinkedIn, <b>on bascule au téléphone dès que possible.</b> Un partenariat ne se signe pas
    dans une messagerie.</p>
  </section>`;
}

/* ─── 8. Les interdits propres au réseau ─── */
function interdits() {
  const I = [
    ['Aucun outil d’automatisation', 'Les robots d’envoi de messages et d’invitations violent les conditions d’utilisation de LinkedIn et font restreindre ou fermer les comptes. Le compte sur lequel vous aurez bâti six mois de crédibilité est le seul que vous ayez.'],
    ['Aucune invitation en masse', 'Vingt par semaine, personnalisées. Les invitations sans note envoyées par centaines aboutissent à une limitation du compte, et les refus répétés y contribuent.'],
    ['Aucun commentaire sous une annonce de décès', 'Ni condoléances suivies d’un message privé, ni présence discrète. Une famille ou une agence qui vous y repère ne vous fera plus jamais confiance, et elle aura raison.'],
    ['Aucune publication le jour d’un drame collectif', 'Accident, catastrophe, attentat : on ne publie rien ce jour-là, et rien le lendemain. Le planificateur de la console permet de décaler une publication en deux clics.'],
    ['Aucune capture d’écran d’un échange', 'Ni d’un message d’une famille, ni d’un message d’une agence, même flouté. C’est la promesse de discrétion qui est en jeu, et elle vaut plus que la preuve sociale que cela apporterait.'],
    ['Aucune promesse de volume', 'Le manuel l’interdit déjà au téléphone. Écrit sur un réseau social, cela reste publiquement consultable des années.'],
    ['Aucune photo générée pour faire illusion', 'Pas de faux portrait de famille, pas de fausse cérémonie. Les vignettes du catalogue et les visuels de campagne sont là pour ça, et ils ne prétendent rien.']
  ];
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Les interdits</div>
      <hr class="filet">
      <h2>Ce qui ferait<br><em>plus de mal que de bien.</em></h2>
    </div>

    <p>Dans la plupart des métiers, une maladresse sur un réseau social coûte quelques
    abonnés. Dans celui-ci, elle coûte la réputation — et la réputation est exactement ce
    qu’une pompe funèbre achète chez un prestataire.</p>

    <div class="interdits" style="margin-top:6mm;">
      <ul class="puces">
        ${I.map(([quoi, pourquoi]) => `<li><strong>${esc(quoi)}.</strong> ${esc(pourquoi)}</li>`).join('')}
      </ul>
    </div>

    <h3 style="margin-top:8mm;">Sur les données personnelles</h3>
    <p style="margin-top:3mm;">Un dirigeant contacté sur LinkedIn dans un cadre strictement
    professionnel relève de la prospection entre professionnels : le message doit avoir un
    rapport avec la fonction de la personne, et le refus doit être respecté immédiatement et
    définitivement. Si vous reportez un contact LinkedIn dans la console, il y entre comme
    n’importe quelle fiche, avec les mêmes droits — et un « stop » y est définitif.</p>
    <p class="disc" style="margin-top:3mm;">Ce paragraphe décrit une pratique prudente, il ne
    remplace pas un avis juridique. Pour la prospection écrite à grande échelle, faites valider
    vos modèles une fois par un conseil.</p>

    <div class="bloc ligne-or conclut" style="margin-top:7mm;">
      <p>La question à se poser avant de publier : <em>est-ce que je dirais cela à voix haute,
      dans le bureau d’un directeur d’agence, devant une famille qui attend dans le couloir ?</em>
      Si la réponse hésite, on ne publie pas.</p>
    </div>
  </section>`;
}

/* ─── 9. La mesure ─── */
function mesure() {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">La mesure</div>
      <hr class="filet">
      <h2>Quatre chiffres,<br><em>et aucun objectif inventé.</em></h2>
    </div>

    <p><strong>Ce document ne vous donne aucun objectif chiffré, et c’est délibéré.</strong>
    La maison n’a pas d’historique sur ce canal : annoncer « trente partenaires en six mois »
    ou « huit pour cent d’acceptation » serait de l’invention, et vous jugeriez votre travail
    réel à l’aune d’un chiffre sorti de nulle part.</p>

    <p style="margin-top:4mm;">On fait l’inverse. On relève quatre chiffres pendant quatre
    semaines sans rien en attendre : c’est la base de référence. Les objectifs se fixent
    ensuite, à partir d’elle.</p>

    <div style="margin-top:6mm;">
      <div class="rang"><b>Vues du profil, par semaine</b><span>LinkedIn, page d’accueil</span></div>
      <div class="rang"><b>Demandes de connexion acceptées / envoyées</b><span>relevé à la main</span></div>
      <div class="rang"><b>Réponses obtenues / messages envoyés</b><span>relevé à la main</span></div>
      <div class="rang"><b>Appels décrochés grâce à LinkedIn</b><span>le seul qui compte vraiment</span></div>
    </div>

    <h3 style="margin-top:8mm;">Ce qu’on ne mesure pas</h3>
    <ul class="puces" style="margin-top:3mm;">
      <li>Le nombre d’abonnés. Deux cents dirigeants de pompes funèbres valent mieux que
      trois mille inconnus, et le compteur ne fait pas la différence.</li>
      <li>Les « j’aime ». Ils viennent de vos pairs, pas de vos clients.</li>
      <li>La portée d’une publication isolée. Elle varie du simple au décuple sans que vous y
      soyez pour quoi que ce soit. Regardez la moyenne d’un mois, jamais un pic.</li>
    </ul>

    <h3 style="margin-top:8mm;">Où l’on note</h3>
    <p style="margin-top:3mm;">L’écran <em>Publications</em> de la console porte déjà, pour
    chaque publication marquée comme publiée, trois champs : vues, réactions, partages. Ils se
    remplissent à la main, une fois par semaine, en cinq minutes. C’est cette régularité-là,
    et non l’outil, qui produit la base de référence.</p>

    <div class="bloc ligne-or conclut" style="margin-top:7mm;">
      <p>Au bout de quatre semaines, vous saurez ce que vaut une semaine normale. Alors
      seulement, fixez un objectif — et fixez-le sur le quatrième chiffre, celui des appels.
      Les trois autres ne sont que des indices.</p>
    </div>
  </section>`;
}

/* ─── 10. Lundi matin ─── */
function derniere(V) {
  return `<section class="part">
    <div class="titre-part">
      <div class="surtitre">Pour commencer</div>
      <hr class="filet">
      <h2>Ce qu’il y a à faire<br><em>lundi matin.</em></h2>
    </div>

    <p>Un plan qu’on lit en entier et qu’on referme ne sert à rien. Voici les six premières
    actions, dans l’ordre, sans rien qui demande de décider quoi que ce soit.</p>

    <div style="margin-top:6mm;">
      ${[
        'Réécrire le titre du profil. Le modèle est page 4 — trente secondes.',
        'Remplacer la photo de couverture. Un visuel de campagne du dépôt fait l’affaire.',
        'Épingler trois œuvres du catalogue et la page des professionnels dans la sélection.',
        'Écrire les trois publications de la semaine dans la console, d’un coup.',
        'Chercher vingt dirigeants dans votre département et créer leurs fiches.',
        'Ne leur envoyer aucune demande de connexion avant que le profil soit fini.'
      ].map((a, i) => `<div class="rang"><b>${esc(a)}</b><span>${i + 1}</span></div>`).join('')}
    </div>

    <div class="bloc ligne-or" style="margin-top:8mm;">
      <p class="dire">Sur ce réseau, la seule chose qui ne se rattrape pas est la régularité.
      Tout le reste — un texte moyen, une accroche ratée, une publication qui ne prend pas —
      se corrige à la publication suivante.</p>
    </div>

    <div style="margin-top:10mm;border-top:1px solid #e3ddcd;padding-top:5mm;">
      <div class="etiquette">Les documents de la maison</div>
      <div style="margin-top:3mm;">
        <div class="rang"><b>Brochure partenaire — à envoyer à une agence</b><span>console</span></div>
        <div class="rang"><b>Manuel de vente — le téléphone, les objections</b><span>console</span></div>
        <div class="rang"><b>Ce plan LinkedIn</b><span>console</span></div>
      </div>
      <p class="disc" style="margin-top:4mm;">Les trois documents sont fabriqués à partir du
      contenu réel du site et de la console : une correction de tarif ou d’argumentaire faite
      à l’écran se retrouve dans les PDF au prochain « npm run pdf ». Aucun chiffre n’est
      recopié à la main, ici comme ailleurs.</p>
      <p class="disc" style="margin-top:3mm;">${esc(V.SITE)}</p>
    </div>
  </section>`;
}

/* ═══ L'ASSEMBLAGE ═══ */
function html() {
  const V = venteDeLaConsole();
  const O = oeuvres();
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Melodia Funèbre — Plan LinkedIn</title>
<style>${fontes()}${CLAIR}${FLUX}</style></head><body>
${couverture(O)}
${principe(V)}
${cibles(V)}
${profil()}
${piliers(O)}
${modeles(O, V)}
${calendrier()}
${messages(V)}
${interdits()}
${mesure()}
${derniere(V)}
</body></html>`;
}

/* Les titres attendus dans le document — le relecteur s'en sert pour
   vérifier qu'aucune partie n'a disparu d'une génération à l'autre. */
const TITRES = [
  'LinkedIn ne vend rien.',
  'À qui l’on écrit,',
  'Le profil se répare',
  'Quatre piliers,',
  'Six modèles,',
  'Quatre-vingt-dix jours,',
  'Quatre messages,',
  'Ce qui ferait',
  'Quatre chiffres,',
  'Ce qu’il y a à faire'
];

module.exports = { html, fichier: 'melodia-plan-linkedin.pdf', TITRES };
