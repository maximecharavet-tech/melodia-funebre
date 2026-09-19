const { ICON } = require('./gen.js');
const P = require('./parts.js');

/* ═══════════════════════════════════════════════════════════════
   /application — Installer Melodia sur son téléphone

   CE QUE CETTE PAGE NE PROMET PAS

   Elle ne prétend pas qu'il existe une application à télécharger sur
   l'App Store ou le Play Store : il n'y en a pas, et l'écrire ferait
   chercher les gens pour rien. Elle dit ce qui est vrai — le site
   s'installe lui-même sur l'écran d'accueil, sur les deux plateformes,
   sans passer par un magasin.

   Et elle dit franchement la limite d'iPhone : Safari n'ouvre aucune
   boîte de dialogue, il faut passer par le bouton Partager. Le cacher
   ferait abandonner à la première tentative.
   ═══════════════════════════════════════════════════════════════ */

const QUESTIONS = [
  { q: "Melodia Funèbre est-elle sur l'App Store ou le Play Store ?",
    a: "Pas aujourd'hui. Le site s'installe directement sur l'écran d'accueil, sur iPhone comme sur Android, sans passer par un magasin d'applications — et sans occuper la place d'une application classique." },
  { q: "Que se passe-t-il si je n'ai plus de réseau ?",
    a: "Les pages déjà consultées restent lisibles, et les hommages déjà écoutés restent écoutables. C'est utile dans un cimetière, où le réseau est souvent faible : la page d'un hommage scannée une première fois reste disponible ensuite." },
  { q: "L'application prend-elle de la place sur mon téléphone ?",
    a: "Quelques mégaoctets, contre plusieurs dizaines pour une application classique. Elle se retire comme n'importe quelle icône, par un appui long." },
  { q: "Mes données sont-elles envoyées quelque part de plus ?",
    a: "Non. L'application est le site lui-même : rien de plus n'est collecté, rien de plus n'est transmis. Voir notre politique de confidentialité." },
  { q: "Sur iPhone, pourquoi faut-il passer par Safari ?",
    a: "Parce qu'Apple ne l'autorise que depuis Safari : les autres navigateurs sur iPhone n'ont pas accès à cette fonction. C'est une règle d'Apple, pas un choix de notre part." },
  { q: "L'application se met-elle à jour toute seule ?",
    a: "Oui. Quand une nouvelle version est publiée, elle est signalée discrètement et s'installe d'un geste — sans passer par un magasin ni attendre une validation." }
];

module.exports = {
  file: 'application.html',
  title: "Installer Melodia sur votre téléphone | Melodia Funèbre",
  desc: "Ajoutez Melodia Funèbre à votre écran d'accueil, sur iPhone comme sur Android. Vos hommages restent écoutables même sans réseau.",
  jsonld: [P.jsonldFil('Application', '/application'), {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: QUESTIONS.map((x) => ({
      '@type': 'Question', name: x.q,
      acceptedAnswer: { '@type': 'Answer', text: x.a }
    }))
  }],
  body: `
  <section class="page-head">
    <div class="wrap">
      <div class="eyebrow reveal in">L'application</div>
      <h1 class="h-xl reveal in reveal-d1" style="margin-top:.8rem;">Melodia sur<br><em>votre écran d'accueil.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.4rem;max-width:60ch;">Une icône avec vos applications, le site en plein écran, et vos hommages qui restent écoutables quand le réseau faiblit. Rien à télécharger sur un magasin : l'installation se fait depuis cette page, en trois gestes.</p>
      <div class="hero-actions reveal in reveal-d3" style="margin-top:2.2rem;">
        <button type="button" class="btn btn-gold btn-lg" data-installer>Installer l'application</button>
        <button type="button" class="btn btn-outline btn-lg" data-marche-installation>Voir la marche à suivre</button>
      </div>
      <p class="note reveal in reveal-d4" style="margin-top:1.4rem;">
        Gratuit · Quelques mégaoctets · Se retire comme n'importe quelle icône
      </p>
    </div>
  </section>

  <section class="section-sm" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="grid-2">
        <div class="card reveal">
          <div class="eyebrow" style="margin-bottom:.7rem;">Android</div>
          <h2>Chrome vous le propose</h2>
          <p>Ouvrez le menu du navigateur, puis <b>Installer l'application</b>. Selon la version, Chrome l'offre aussi tout seul en bas de l'écran.</p>
          <button type="button" class="btn btn-outline btn-sm" style="margin-top:1rem;" data-installer>Installer maintenant</button>
        </div>
        <div class="card reveal">
          <div class="eyebrow" style="margin-bottom:.7rem;">iPhone et iPad</div>
          <h2>Par le bouton Partager</h2>
          <p>Apple n'ouvre aucune boîte de dialogue : il faut toucher <b>Partager</b>, puis <b>Sur l'écran d'accueil</b>. Et uniquement depuis <b>Safari</b> — les autres navigateurs n'ont pas accès à cette fonction sur iPhone.</p>
          <button type="button" class="btn btn-outline btn-sm" style="margin-top:1rem;" data-marche-installation>Voir les trois gestes</button>
        </div>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.4rem;">
        <div class="eyebrow">Ce que ça change</div>
        <h2 class="h-xl">Quatre choses,<br>et pas une <em>de plus.</em></h2>
      </div>
      <div class="grid-4">
        <div class="card reveal"><h3>Sans réseau</h3>
          <p>Les pages vues et les hommages écoutés restent disponibles. Dans un cimetière, c'est souvent la différence entre entendre la musique et regarder un écran vide.</p></div>
        <div class="card reveal"><h3>En plein écran</h3>
          <p>Sans barre d'adresse ni onglets. La page d'un hommage se présente comme elle a été pensée.</p></div>
        <div class="card reveal"><h3>D'un seul doigt</h3>
          <p>Une icône avec vos applications, plutôt qu'une adresse à retaper ou un marque-page perdu dans une liste.</p></div>
        <div class="card reveal"><h3>À jour toute seule</h3>
          <p>Les nouveautés arrivent sans passer par un magasin ni attendre une validation. Un geste, et c'est fait.</p></div>
      </div>
    </div>
  </section>

  <section class="section-sm">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.4rem;">
        <div class="eyebrow">Questions</div>
        <h2 class="h-xl">Ce qu'on nous<br><em>demande.</em></h2>
      </div>
      <div class="reveal">
${P.faq(QUESTIONS, true)}
      </div>
    </div>
  </section>

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">Vous êtes une <em>agence ?</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.2rem;max-width:44rem;">Vos conseillers peuvent installer Melodia sur leur téléphone professionnel : le catalogue à faire écouter en rendez-vous, et les commandes de l'agence, sans ouvrir un ordinateur.</p>
      <div class="hero-actions">
        <a href="/professionnels#partenariat" class="btn btn-gold btn-lg">Devenir partenaire</a>
        <a href="/exemple" class="btn btn-outline btn-lg">Voir un hommage</a>
      </div>
    </div>
  </section>`
};
