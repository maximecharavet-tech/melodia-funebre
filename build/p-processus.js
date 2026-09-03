const { ICON, TEL, TEL_HREF } = require('./gen.js');
const P = require('./parts.js');
const { FAQ } = require('./data.js');

module.exports = {
  file: 'processus.html',
  title: 'Le processus — De cinq questions à une œuvre, en 24 h | Melodia Funèbre',
  desc: "Comment nous composons un hommage musical : entretien de 5 minutes, écriture des paroles, composition, relecture humaine, livraison en 24 heures. Ce que nous vous demandons, et ce que nous garantissons.",
  jsonld: [P.jsonldService],
  body: `
  <section class="section" style="padding-top:9rem;padding-bottom:0;">
    <div class="wrap">
      <div class="eyebrow reveal in">Le processus</div>
      <h1 class="h-hero reveal in reveal-d1">De cinq questions<br>à une <em>œuvre.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.8rem;">Vous n'avez rien à préparer, rien à rédiger, rien à installer. Vous racontez, nous composons. Voici exactement ce qui se passe entre votre appel et la cérémonie.</p>
    </div>
  </section>

  <section class="section-sm"><div class="wrap">${P.trustStrip()}</div></section>

  <!-- ═══ CHRONOLOGIE ═══ -->
  <section class="section section-light">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:3.5rem;">
        <div class="eyebrow">Heure par heure</div>
        <h2 class="h-xl">Ce qui se passe,<br><em>et quand.</em></h2>
      </div>
      <div class="steps">
        <div class="step reveal">
          <div class="step-dot">1</div>
          <div class="step-body">
            <h3>Vous nous appelez, ou vous commandez en ligne</h3>
            <p>Trois minutes suffisent pour lancer la commande : l'offre, le prénom du défunt, vos coordonnées. Si la cérémonie est imminente, dites-le : nous basculons immédiatement en priorité.</p>
            <span class="step-time">Immédiat</span>
          </div>
        </div>
        <div class="step reveal">
          <div class="step-dot">2</div>
          <div class="step-body">
            <h3>L'entretien : cinq questions, cinq minutes</h3>
            <p>Nous vous rappelons. Qui était-il ? Trois traits de caractère. Son métier ou sa passion. Une habitude que tout le monde lui connaissait. Une anecdote qui le résume. C'est tout — et c'est déjà beaucoup pour écrire une chanson juste.</p>
            <span class="step-time">Sous 2 heures ouvrées</span>
          </div>
        </div>
        <div class="step reveal">
          <div class="step-dot">3</div>
          <div class="step-body">
            <h3>L'écriture des paroles</h3>
            <p>Vos mots deviennent des couplets. On ne cherche pas le poème : on cherche <em>lui</em>. Les détails concrets — la canne à pêche, le jasmin, la 4L bleue — valent mieux que dix métaphores. Les paroles vous sont soumises si vous le souhaitez.</p>
            <span class="step-time">Quelques heures</span>
          </div>
        </div>
        <div class="step reveal">
          <div class="step-dot">4</div>
          <div class="step-body">
            <h3>La composition et le mixage</h3>
            <p>La mélodie s'écrit dans le style choisi : chanson française, folk, piano, jazz, bossa nova, gospel. Tempo, instrumentation, tonalité — tout est réglé pour qu'on le reconnaisse dès les premières mesures.</p>
            <span class="step-time">Quelques heures</span>
          </div>
        </div>
        <div class="step reveal">
          <div class="step-dot">5</div>
          <div class="step-body">
            <h3>La relecture humaine</h3>
            <p>Aucun hommage ne part sans avoir été écouté en entier par la maison. On vérifie le texte, la prononciation des prénoms, les niveaux, les silences. C'est l'étape qu'on ne saute jamais, même en urgence.</p>
            <span class="step-time">Contrôle systématique</span>
          </div>
        </div>
        <div class="step reveal">
          <div class="step-dot">6</div>
          <div class="step-body">
            <h3>La livraison</h3>
            <p>Vous recevez le fichier par email et dans votre espace personnel : MP3 haute qualité, prêt à diffuser sur n'importe quelle enceinte. Téléchargeable autant de fois que vous voulez, par toute la famille.</p>
            <span class="step-time">24 h après l'entretien</span>
          </div>
        </div>
        <div class="step reveal">
          <div class="step-dot">7</div>
          <div class="step-body">
            <h3>La reprise, si nécessaire</h3>
            <p>Si l'œuvre ne vous touche pas, nous la reprenons. Une révision est incluse dans l'offre Prestige, illimitée dans l'offre Mémorial. Nous préférons recommencer plutôt que livrer un hommage qui sonne faux.</p>
            <span class="step-time">Sous 12 heures</span>
          </div>
        </div>
      </div>
    </div>
  </section>

${P.urgency()}

  <!-- ═══ CE QU'ON VOUS DEMANDE ═══ -->
  <section class="section">
    <div class="wrap">
      <div class="grid-2" style="gap:4rem;align-items:start;">
        <div class="reveal">
          <div class="eyebrow">Votre part</div>
          <h2 class="h-xl">Cinq réponses,<br>et <em>c'est tout.</em></h2>
          <p class="lead" style="margin-top:1.6rem;">Voici littéralement les questions que nous posons. Vous pouvez y penser avant l'appel, ou les découvrir au téléphone : nous vous guidons.</p>
        </div>
        <div class="reveal reveal-d1">
          <div class="card" style="margin-bottom:1rem;"><div class="mono">Question 1</div><h3 class="h-lg" style="margin-top:.5rem;">Comment s'appelait-il ou elle ?</h3><p>Le prénom que la famille employait vraiment — « Papi Momo » vaut mieux que « Maurice » s'il n'a jamais été appelé Maurice.</p></div>
          <div class="card" style="margin-bottom:1rem;"><div class="mono">Question 2</div><h3 class="h-lg" style="margin-top:.5rem;">Trois traits de caractère</h3><p>Trois adjectifs, sans réfléchir. « Têtu, généreux, taquin » nous en dit plus qu'une biographie complète.</p></div>
          <div class="card" style="margin-bottom:1rem;"><div class="mono">Question 3</div><h3 class="h-lg" style="margin-top:.5rem;">Son métier, ou sa passion</h3><p>Ce à quoi il consacrait ses journées, ou ses dimanches. Le concret nourrit la chanson.</p></div>
          <div class="card" style="margin-bottom:1rem;"><div class="mono">Question 4</div><h3 class="h-lg" style="margin-top:.5rem;">Une habitude que tout le monde lui connaissait</h3><p>Il sifflait en marchant. Elle arrosait ses roses avant le café. Ce sont ces gestes-là qui font pleurer et sourire à la fois.</p></div>
          <div class="card"><div class="mono">Question 5</div><h3 class="h-lg" style="margin-top:.5rem;">Une anecdote qui le résume</h3><p>Facultative, mais précieuse. Souvent, c'est elle qui devient le refrain.</p></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ GARANTIES ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Nos engagements</div>
        <h2 class="h-xl">Ce sur quoi vous<br>pouvez <em>compter.</em></h2>
      </div>
      <div class="grid-3">
        <div class="card card-lift reveal"><div class="card-icon">${ICON.clock}</div><h3 class="h-lg">Le délai tenu</h3><p>Vingt-quatre heures après l'entretien, pas après la commande. En priorité six heures, livraison le jour même. Si nous ne pouvons pas tenir, nous vous le disons avant d'encaisser.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.shield}</div><h3 class="h-lg">Aucun droit à régler</h3><p>L'œuvre est originale et vous est cédée avec ses droits d'usage. Diffusion en cérémonie, copies pour la famille, conservation : rien à déclarer, aucune redevance.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.heart}</div><h3 class="h-lg">La reprise si ça sonne faux</h3><p>Une chanson d'hommage se juge à l'émotion, pas à la technique. Si elle ne vous touche pas, on la refait — c'est le seul critère qui compte.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.users}</div><h3 class="h-lg">Un interlocuteur unique</h3><p>Vous parlez au fondateur, pas à un centre d'appels. Le même interlocuteur du premier appel à la livraison.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.lock}</div><h3 class="h-lg">Vos confidences protégées</h3><p>Ce que vous nous racontez sert à composer, rien d'autre. Aucune diffusion, aucune revente, aucune publication sans votre accord écrit.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.note}</div><h3 class="h-lg">Une relecture humaine</h3><p>Chaque hommage est écouté en entier par la maison avant l'envoi. Ce contrôle n'est jamais sauté, même dans l'urgence.</p></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.5rem;">
        <div class="eyebrow">Questions fréquentes</div>
        <h2 class="h-xl">Avant de <em>commander.</em></h2>
      </div>
      <div class="reveal">
${P.faq(FAQ.slice(0, 5))}
      </div>
    </div>
  </section>

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">Commençons par<br>ses <em>trois mots.</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;">Trois minutes pour commander, cinq pour l'entretien. Le reste, c'est notre travail.</p>
      <div class="hero-actions">
        <a href="offres.html" class="btn btn-gold btn-lg">Commander un hommage</a>
        <button type="button" class="btn btn-outline btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
    </div>
  </section>`
};
