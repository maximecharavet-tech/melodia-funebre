const { ICON, MAIL } = require('./gen.js');
const P = require('./parts.js');

module.exports = {
  file: 'rejoindre.html',
  title: 'Nous rejoindre — devenir collaborateur | Melodia Funèbre',
  desc: "Melodia Funèbre recrute commerciaux et compositeurs. Métier inédit, marché sans concurrent, rémunération à la commission. Déposez votre CV.",
  /* Le fil d'Ariane manquait sur cette seule page : les moteurs
     l'affichent sous le titre, et son absence faisait apparaître
     l'adresse brute là où les autres pages montrent leur chemin. */
  jsonld: [P.jsonldFil('Nous rejoindre', '/rejoindre')],
  body: `
  <section class="section" style="padding-top:9rem;padding-bottom:0;">
    <div class="wrap">
      <div class="eyebrow reveal in">Nous rejoindre</div>
      <h1 class="h-hero reveal in reveal-d1">Un métier<br>qui <em>n'existait pas.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.8rem;max-width:60ch;">
        Melodia Funèbre est la première maison française à composer une œuvre originale pour
        chaque défunt. Personne ne fait ce travail avant nous : celles et ceux qui nous
        rejoignent aujourd'hui écrivent le métier en même temps qu'ils l'exercent.
      </p>
    </div>
  </section>

  <!-- ═══ LA MAISON AU TRAVAIL ═══ -->
  <section class="section-sm">
    <div class="wrap">
      <figure class="equipe reveal">
        <img src="assets/img/equipe.jpg" alt="L'atelier de Melodia Funèbre : la maison au travail, casques sur les oreilles, devant les stations de composition." width="1600" height="900" loading="lazy" decoding="async">
        <figcaption>L'atelier. Chaque écran, une famille qui attend.</figcaption>
      </figure>
    </div>
  </section>

  <section class="section section-tight">
    <div class="wrap">
      <div class="grid-3">
        <div class="card card-gold card-lift reveal">
          <div class="card-icon">${ICON.note}</div>
          <h3 class="h-lg">Collaborateur commercial</h3>
          <p>Vous présentez le service aux agences de pompes funèbres de votre région. Pas de porte-à-porte
             au hasard : un annuaire, un script, des hommages réels à faire écouter, et une première
             composition offerte à chaque agence pour qu'elle juge sur pièce.</p>
          <div class="mono" style="margin-top:1rem;">Commission sur chaque hommage · Secteur réservé</div>
        </div>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.pen}</div>
          <h3 class="h-lg">Composition</h3>
          <p>Vous écoutez une famille cinq minutes, et vous en tirez un texte qui lui ressemble.
             Il faut de l'oreille, une plume, et surtout du tact : ce que l'on vous confiera
             a été dit une seule fois, souvent en pleurant.</p>
          <div class="mono" style="margin-top:1rem;">À la mission · Formation assurée</div>
        </div>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.shield}</div>
          <h3 class="h-lg">Ce que nous ne demandons pas</h3>
          <p>Ni diplôme de musique, ni expérience du funéraire, ni investissement d'aucune sorte.
             Nous demandons de la rigueur sur les délais — une cérémonie ne se reporte pas —
             et une manière de parler aux familles.</p>
          <div class="mono" style="margin-top:1rem;">Aucun frais d'entrée · Aucun stock</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-light">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.5rem;">
        <div class="eyebrow">Le métier</div>
        <h2 class="h-xl">Pourquoi c'est <em>différent.</em></h2>
      </div>
      <div class="reveal">
        <div class="faq-item">
          <button class="faq-q" type="button">Que vend-on, exactement ?</button>
          <div class="faq-a"><div class="faq-a-inner">Une chanson qui n'existe pas encore, écrite pour une personne
            précise à partir de ce que sa famille en raconte. Ce n'est ni une playlist, ni un morceau de catalogue
            adapté : l'œuvre naît de l'entretien et n'est vendue qu'une fois. C'est ce qui rend l'argumentaire
            facile — il n'y a rien à comparer.</div></div>
        </div>
        <div class="faq-item">
          <button class="faq-q" type="button">À qui parle-t-on ?</button>
          <div class="faq-a"><div class="faq-a-inner">Aux agences de pompes funèbres, qui cherchent à se distinguer
            sur un marché où toutes proposent la même chose. Elles conservent 60 % du montant payé par la famille,
            sans investissement ni charge technique. L'entretien avec la famille, la composition et la livraison
            restent chez nous.</div></div>
        </div>
        <div class="faq-item">
          <button class="faq-q" type="button">Comment est-on payé ?</button>
          <div class="faq-a"><div class="faq-a-inner">À la commission, sur les hommages effectivement commandés par
            les agences que vous avez signées, aussi longtemps qu'elles restent partenaires. Le détail chiffré
            se discute à l'entretien : il dépend du statut choisi et du secteur.</div></div>
        </div>
        <div class="faq-item">
          <button class="faq-q" type="button">Faut-il un statut particulier ?</button>
          <div class="faq-a"><div class="faq-a-inner">Le plus souvent, un statut d'indépendant — agent commercial ou
            micro-entreprise. Nous en parlons ensemble : si vous n'en avez pas encore, ce n'est pas un obstacle
            pour candidater.</div></div>
        </div>
        <div class="faq-item">
          <button class="faq-q" type="button">Travaille-t-on avec des familles en deuil ?</button>
          <div class="faq-a"><div class="faq-a-inner">Le collaborateur commercial parle aux professionnels, pas aux
            familles. Mais il faut savoir que derrière chaque commande il y a un enterrement, et que la légèreté
            n'a pas sa place. C'est le seul trait de caractère sur lequel nous ne transigeons pas.</div></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ CANDIDATURE ═══ -->
  <section class="section" id="candidater">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.5rem;">
        <div class="eyebrow">Candidater</div>
        <h2 class="h-xl">Dites-nous <em>qui vous êtes.</em></h2>
        <p class="lead" style="margin-top:1.2rem;">Nous lisons tout, et nous répondons à tout le monde —
          y compris pour dire non.</p>
      </div>
      <div class="card reveal">
        <div class="form-msg" id="cd-msg"></div>
        <div id="cd-formulaire">
          <div class="field-row">
            <div class="field"><label class="field-label" for="cd-nom">Votre nom *</label>
              <input class="field-input" id="cd-nom" placeholder="Prénom Nom" autocomplete="name"><div class="field-err"></div></div>
            <div class="field"><label class="field-label" for="cd-email">Votre email *</label>
              <input class="field-input" id="cd-email" type="email" placeholder="vous@exemple.fr" autocomplete="email"><div class="field-err"></div></div>
          </div>
          <div class="field-row">
            <div class="field"><label class="field-label" for="cd-tel">Téléphone</label>
              <input class="field-input" id="cd-tel" type="tel" placeholder="06 12 34 56 78" autocomplete="tel"></div>
            <div class="field"><label class="field-label" for="cd-ville">Ville ou département</label>
              <input class="field-input" id="cd-ville" placeholder="Lyon, ou 69" autocomplete="address-level2"></div>
          </div>
          <div class="field-row">
            <div class="field"><label class="field-label" for="cd-poste">Ce qui vous intéresse</label>
              <select class="field-select" id="cd-poste">
                <option value="commercial">Collaborateur commercial</option>
                <option value="composition">Composition et écriture</option>
                <option value="administratif">Administratif et suivi</option>
                <option value="autre">Autre — je vous explique</option>
              </select></div>
            <div class="field"><label class="field-label" for="cd-statut">Votre situation</label>
              <select class="field-select" id="cd-statut">
                <option value="">Je préfère en parler</option>
                <option>En poste, je cherche à changer</option>
                <option>Sans emploi, disponible tout de suite</option>
                <option>Déjà indépendant</option>
                <option>En complément d'activité</option>
                <option>Étudiant ou en formation</option>
              </select></div>
          </div>
          <div class="field">
            <label class="field-label" for="cd-exp">Votre parcours en deux lignes</label>
            <input class="field-input" id="cd-exp" placeholder="Dix ans de vente en B2B, dont trois dans le médical">
          </div>
          <div class="field">
            <label class="field-label" for="cd-message">Pourquoi celui-ci ? *</label>
            <textarea class="field-area" id="cd-message" placeholder="Ce qui vous attire dans ce métier, et ce que vous savez faire que nous ne savons pas."></textarea>
            <div class="field-err"></div>
          </div>

          <div class="field">
            <label class="field-label" for="cd-cv">Votre CV</label>
            <div class="depot-cv" id="cd-depot">
              <input type="file" id="cd-cv" accept="application/pdf,.pdf" hidden>
              <button type="button" class="depot-cv-btn" id="cd-parcourir">
                ${ICON.upload}
                <span id="cd-cv-nom">Choisir un fichier PDF</span>
              </button>
              <div class="depot-cv-aide">PDF uniquement, 5 Mo au maximum. Facultatif — mais il nous fait gagner l'entretien de tri.</div>
              <div class="depot-cv-progres" id="cd-progres" hidden><div class="depot-cv-barre" id="cd-barre"></div></div>
            </div>
          </div>

          <label class="check" style="margin:1.2rem 0;">
            <input type="checkbox" id="cd-accord">
            <span>J'accepte que ces informations et mon CV soient conservés le temps de l'étude de ma
              candidature, conformément à la <a href="/confidentialite" style="color:var(--or);text-decoration:underline;">politique de confidentialité</a>. *</span>
          </label>

          <button class="btn btn-gold btn-block" type="button" id="cd-envoyer">Envoyer ma candidature</button>
          <p class="note-inline">Vos données ne servent qu'au recrutement. Elles ne sont ni revendues, ni versées à une liste de diffusion.</p>
        </div>

        <div id="cd-merci" hidden style="text-align:center;padding:1.5rem 0;">
          <div class="eyebrow" style="justify-content:center;">Candidature reçue</div>
          <h3 class="h-lg" style="margin:1rem 0;">Merci.</h3>
          <p style="color:var(--bone);line-height:1.8;max-width:44ch;margin:0 auto 1.6rem;">
            Nous l'avons bien reçue, avec votre référence <b id="cd-ref" style="color:var(--or);"></b>.
            Nous revenons vers vous sous une semaine, quelle que soit notre réponse.</p>
          <a href="/" class="btn btn-outline">Retour à l'accueil</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">Une question <em>avant ?</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;">Écrivez-nous, ou demandez à être rappelé. C'est le fondateur qui répond.</p>
      <div class="hero-actions" style="justify-content:center;">
        <a href="mailto:${MAIL}" class="btn btn-outline btn-lg">Écrire à la maison</a>
        <button type="button" class="btn btn-ghost btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
    </div>
  </section>`,
  scripts: ['assets/js/candidature.js']
};
