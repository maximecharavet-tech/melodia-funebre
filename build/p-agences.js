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
      <p class="lead reveal in reveal-d2" style="margin-top:1.8rem;">Proposez à vos familles un service qu'aucune agence voisine n'offre : une œuvre musicale composée pour leur défunt, livrée en vingt-quatre heures, avec sa page hommage et son QR code. Vous présentez, nous composons, vous conservez 60 %.</p>
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

  <!-- ═══ BÉNÉFICES ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Pourquoi Melodia</div>
        <h2 class="h-xl">Ce que vous y <em>gagnez.</em></h2>
      </div>
      <div class="grid-3">
        <div class="card card-lift reveal"><div class="card-icon">${ICON.euro}</div><h3 class="h-lg">Soixante pour cent de marge</h3><p>Sur chaque hommage, vous conservez 60 % du montant. Sur une offre Prestige, cela représente 179 € nets — sans stock, sans risque, sans effort technique.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.clock}</div><h3 class="h-lg">Aucun effort opérationnel</h3><p>Vous présentez, la famille décide. Entretien, écriture, composition, livraison : tout est pris en charge. Vous n'avez rien à produire ni à installer.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.users}</div><h3 class="h-lg">Une différenciation réelle</h3><p>Quand trois agences se partagent la même ville, celle qui propose un hommage inoubliable devient celle qu'on recommande à la sortie de la cérémonie.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.shield}</div><h3 class="h-lg">Zéro droit SACEM</h3><p>Chaque œuvre est originale et cédée avec ses droits d'usage. Pas de déclaration, pas de redevance de diffusion, aucune démarche administrative pour vous.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.gift}</div><h3 class="h-lg">Première composition offerte</h3><p>Nous composons gratuitement un hommage pour votre prochaine famille. Vous le présentez. Si cela touche, on continue — sinon, vous n'avez rien perdu.</p></div>
        <div class="card card-lift reveal"><div class="card-icon">${ICON.phone}</div><h3 class="h-lg">Un interlocuteur unique</h3><p>Vous parlez au fondateur. Réponse sous deux heures ouvrées, urgences prioritaires, aucune plateforme impersonnelle entre vous et nous.</p></div>
      </div>
    </div>
  </section>

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
        <!-- Les conditions chiffrées ne sont pas affichées ici : elles
             se discutent selon le volume et le secteur, et un tarif
             gravé sur une page publique se retourne contre celui qui
             l'a écrit dès la première négociation. -->
        <div class="part-conditions reveal">
          <h3 class="part-titre">Ce qui est convenu</h3>
          <ul class="part-liste">
            <li><b>Marge agence</b><span>Vous conservez la majeure partie du montant réglé par la famille.</span></li>
            <li><b>Tarif conseillé</b><span>Nous vous transmettons une grille de prix conseillés, que vous restez libre d'ajuster.</span></li>
            <li><b>Options</b><span>Version longue, instruments rares, langue étrangère, plaque à QR code.</span></li>
            <li><b>Règlement</b><span>Mensuel, sur facture récapitulative. Rien à avancer.</span></li>
            <li><b>Exclusivité</b><span>Un nombre limité d'agences par bassin de population.</span></li>
          </ul>
          <p class="part-note">Conditions professionnelles détaillées sur demande — elles dépendent de votre volume et de votre secteur.</p>
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
