const { ICON, TEL, TEL_HREF, MAIL, SITE } = require('./gen.js');

const F = t => `<span class="tofill">${t}</span>`;

function legal(file, title, desc, h1, sub, prose) {
  return {
    file, title, desc, sticky: false,
    body: `
  <section class="section" style="padding-top:9rem;">
    <div class="wrap-tight">
      <div class="eyebrow reveal in">Informations légales</div>
      <h1 class="h-xl reveal in reveal-d1" style="margin-bottom:1.2rem;">${h1}</h1>
      <p class="lead reveal in reveal-d2" style="margin-bottom:2rem;">${sub}</p>
      <div class="legal-date">Dernière mise à jour : <span data-year>2026</span></div>
      <div class="prose reveal">
${prose}
      </div>
      <div style="margin-top:3.5rem;padding-top:2rem;border-top:1px solid var(--line-soft);">
        <div class="hero-actions">
          <a href="contact.html" class="btn btn-outline">Une question ?</a>
          <a href="tel:${TEL_HREF}" class="btn btn-ghost">${ICON.phone} ${TEL}</a>
        </div>
      </div>
    </div>
  </section>`
  };
}

const mentions = legal(
  'mentions-legales.html',
  'Mentions légales | Melodia Funèbre',
  "Mentions légales du site melodia-funebre.fr : éditeur, hébergeur, propriété intellectuelle et responsabilité.",
  'Mentions légales',
  "Informations relatives à l'éditeur et à l'hébergeur du site, conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.",
  `<h2>Éditeur du site</h2>
<p><strong>Melodia Funèbre</strong><br>
Statut juridique : ${F('[forme juridique — ex. entreprise individuelle]')}<br>
Siège social : ${F('[adresse complète]')}<br>
SIRET : ${F('[numéro SIRET]')}<br>
Numéro de TVA : TVA non applicable, article 293 B du Code général des impôts<br>
Directeur de la publication : Maxime Charavet<br>
Téléphone : <a href="tel:${TEL_HREF}">${TEL}</a><br>
Email : <a href="mailto:${MAIL}">${MAIL}</a></p>

<h2>Hébergement</h2>
<p>Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — <a href="https://vercel.com" rel="noopener">vercel.com</a>.</p>
<p>Le nom de domaine est enregistré auprès d'<strong>OVH SAS</strong>, 2 rue Kellermann, 59100 Roubaix, France.</p>

<h2>Propriété intellectuelle</h2>
<p>L'ensemble des éléments du site — textes, visuels, logo, charte graphique, extraits sonores de démonstration — est protégé par le droit de la propriété intellectuelle et demeure la propriété exclusive de Melodia Funèbre, sauf mention contraire.</p>
<p>Toute reproduction, représentation, adaptation ou exploitation, totale ou partielle, sans autorisation écrite préalable est interdite.</p>
<p><strong>Œuvres composées pour les clients :</strong> chaque hommage musical commandé fait l'objet d'une cession des droits d'usage au client, dans les conditions précisées par les <a href="cgv.html">conditions générales de vente</a>. Le client peut diffuser l'œuvre lors de la cérémonie, la copier pour les membres de sa famille et la conserver sans limitation de durée.</p>

<h2>Responsabilité</h2>
<p>Melodia Funèbre s'efforce d'assurer l'exactitude des informations publiées sur ce site. Les tarifs, délais et caractéristiques des offres peuvent toutefois évoluer ; seules les informations communiquées lors de la confirmation de commande font foi.</p>
<p>Les estimations affichées dans le simulateur de revenus de l'espace agences sont indicatives et ne constituent en aucun cas un engagement contractuel de résultat.</p>

<h2>Liens externes</h2>
<p>Le site peut contenir des liens vers des sites tiers. Melodia Funèbre n'exerce aucun contrôle sur leur contenu et décline toute responsabilité à leur égard.</p>

<h2>Droit applicable</h2>
<p>Le présent site est soumis au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français sont seuls compétents.</p>`
);

const cgv = legal(
  'cgv.html',
  'Conditions générales de vente | Melodia Funèbre',
  "Conditions générales de vente de Melodia Funèbre : offres, tarifs, délais de livraison, droit de rétractation, révisions et cession des droits d'usage.",
  'Conditions générales de vente',
  "Elles régissent toute commande passée sur melodia-funebre.fr, par téléphone ou par l'intermédiaire d'une agence partenaire.",
  `<h2>Article 1 — Objet</h2>
<p>Les présentes conditions régissent la vente de compositions musicales personnalisées destinées aux cérémonies funéraires, réalisées par Melodia Funèbre à la demande d'un client particulier ou d'une agence de pompes funèbres partenaire.</p>

<h2>Article 2 — Offres et tarifs</h2>
<table>
  <tr><th>Offre</th><th>Prix TTC</th><th>Révisions incluses</th></tr>
  <tr><td>Essentiel</td><td>149 €</td><td>Aucune (option 49 €)</td></tr>
  <tr><td>Prestige</td><td>299 €</td><td>Une révision</td></tr>
  <tr><td>Mémorial</td><td>499 €</td><td>Illimitées</td></tr>
</table>
<p>TVA non applicable, article 293 B du Code général des impôts. L'option « priorité 6 heures » est facturée 49 € et incluse dans l'offre Mémorial. Les tarifs en vigueur sont ceux affichés sur le site au moment de la commande.</p>

<h2>Article 3 — Commande</h2>
<p>La commande est réputée ferme après validation du récapitulatif par le client. Un entretien téléphonique de cinq minutes environ est ensuite programmé : il constitue le point de départ du délai de livraison.</p>
<p>Melodia Funèbre se réserve le droit de refuser une commande dont le contenu serait contraire à l'ordre public, aux bonnes mœurs, ou porterait atteinte à la dignité d'une personne.</p>

<h2>Article 4 — Paiement</h2>
<p>Le règlement s'effectue par carte bancaire ou via PayPal, au moment de la commande ou après l'entretien téléphonique selon l'option choisie. Aucun prélèvement n'intervient sans validation expresse du client.</p>
<p>Pour les agences partenaires, la facturation intervient mensuellement sur récapitulatif, Melodia Funèbre facturant 40 % du montant réglé par la famille.</p>

<h2>Article 5 — Délai de livraison</h2>
<p>L'œuvre est livrée dans un délai de <strong>vingt-quatre heures à compter de l'entretien téléphonique</strong>, et non de la commande. L'option « priorité 6 heures » ramène ce délai à six heures ouvrées.</p>
<p>La livraison s'effectue par courrier électronique et dans l'espace client, au format MP3 320 kbps, complété des formats prévus par l'offre souscrite.</p>
<p>En cas d'impossibilité de tenir le délai annoncé, le client en est informé avant tout encaissement et peut annuler sa commande sans frais.</p>

<h2>Article 6 — Révisions</h2>
<p>Une révision consiste en la reprise de l'œuvre — texte, mélodie ou interprétation — à la demande du client. Elle est réalisée sous douze heures. Le nombre de révisions incluses dépend de l'offre souscrite, conformément au tableau de l'article 2.</p>

<h2>Article 7 — Droit de rétractation</h2>
<p>Conformément à l'article L. 221-28 3° du Code de la consommation, le droit de rétractation ne peut être exercé pour les biens confectionnés selon les spécifications du consommateur ou nettement personnalisés — ce qui est le cas d'une œuvre composée pour une personne déterminée.</p>
<p><strong>Engagement volontaire de Melodia Funèbre :</strong> le client peut néanmoins annuler sa commande sans frais et obtenir le remboursement intégral des sommes versées <strong>tant que la composition n'a pas débuté</strong>, c'est-à-dire jusqu'à l'entretien téléphonique. Passé ce stade, l'œuvre étant en cours de réalisation sur mesure, l'annulation n'ouvre plus droit à remboursement, mais les révisions prévues à l'article 6 restent acquises.</p>

<h2>Article 8 — Cession des droits d'usage</h2>
<p>Chaque œuvre est composée spécifiquement pour le client et lui est cédée avec les droits d'usage suivants, à titre non exclusif, pour le monde entier et sans limitation de durée :</p>
<ul>
  <li>diffusion lors de la cérémonie funéraire et de tout événement familial ultérieur ;</li>
  <li>reproduction et copie au profit des membres de la famille et des proches ;</li>
  <li>conservation et transmission aux générations suivantes.</li>
</ul>
<p>L'œuvre étant originale, sa diffusion <strong>n'entraîne aucune déclaration ni redevance auprès d'un organisme de gestion collective</strong>.</p>
<p>Toute exploitation commerciale de l'œuvre — vente, mise à disposition payante, utilisation publicitaire — reste soumise à autorisation écrite préalable de Melodia Funèbre.</p>

<h2>Article 9 — Confidentialité des informations transmises</h2>
<p>Les éléments biographiques confiés lors de l'entretien servent exclusivement à la composition de l'œuvre. Ils ne font l'objet d'aucune diffusion, publication ni cession à des tiers. Une œuvre ne peut être présentée en démonstration qu'avec l'accord écrit exprès de la famille.</p>

<h2>Article 10 — Réclamations et litiges</h2>
<p>Toute réclamation peut être adressée à <a href="mailto:${MAIL}">${MAIL}</a> ou au <a href="tel:${TEL_HREF}">${TEL}</a>.</p>
<p>Conformément à l'article L. 612-1 du Code de la consommation, le consommateur peut recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un litige : ${F('[médiateur à désigner — adhésion obligatoire pour les professionnels vendant aux consommateurs]')}.</p>
<p>La plateforme européenne de règlement en ligne des litiges est accessible à l'adresse <a href="https://ec.europa.eu/consumers/odr" rel="noopener">ec.europa.eu/consumers/odr</a>.</p>
<p>À défaut de résolution amiable, le litige relève des tribunaux français compétents.</p>`
);

const confid = legal(
  'confidentialite.html',
  'Politique de confidentialité | Melodia Funèbre',
  "Comment Melodia Funèbre collecte, utilise et protège vos données personnelles et les informations biographiques confiées pour la composition d'un hommage.",
  'Politique de confidentialité',
  "Ce que nous collectons, pourquoi, combien de temps nous le conservons, et comment exercer vos droits.",
  `<h2>Responsable du traitement</h2>
<p>Melodia Funèbre, représentée par Maxime Charavet — <a href="mailto:${MAIL}">${MAIL}</a>, <a href="tel:${TEL_HREF}">${TEL}</a>, ${F('[adresse du siège]')}.</p>

<h2>Données collectées</h2>
<table>
  <tr><th>Catégorie</th><th>Données</th><th>Finalité</th></tr>
  <tr><td>Identification</td><td>Nom, email, téléphone</td><td>Traiter la commande, mener l'entretien, livrer l'œuvre</td></tr>
  <tr><td>Éléments biographiques</td><td>Prénom du défunt, traits de caractère, métier, habitudes, anecdotes</td><td>Composer l'hommage — usage exclusif</td></tr>
  <tr><td>Commande</td><td>Offre, montant, statut, référence</td><td>Suivi, facturation, obligations comptables</td></tr>
  <tr><td>Compte partenaire</td><td>Agence, ville, coordonnées professionnelles</td><td>Gestion du partenariat et des marges</td></tr>
</table>

<h2>Base légale</h2>
<ul>
  <li><strong>Exécution du contrat</strong> pour les données de commande et les éléments biographiques nécessaires à la composition ;</li>
  <li><strong>Obligation légale</strong> pour la conservation des pièces comptables ;</li>
  <li><strong>Consentement</strong> pour toute présentation d'une œuvre en démonstration publique.</li>
</ul>

<h2>Les éléments biographiques : un engagement particulier</h2>
<p>Les informations que vous nous confiez au sujet d'un défunt sont d'une nature intime. Nous prenons trois engagements fermes à leur égard :</p>
<ul>
  <li>elles servent <strong>uniquement</strong> à composer l'œuvre demandée ;</li>
  <li>elles ne sont <strong>jamais</strong> revendues, cédées ni transmises à des fins publicitaires ;</li>
  <li>aucune œuvre n'est présentée publiquement en démonstration sans l'<strong>accord écrit</strong> de la famille.</li>
</ul>

<h2>Durée de conservation</h2>
<ul>
  <li>Données de commande et œuvre livrée : <strong>3 ans</strong> à compter de la livraison, afin de pouvoir vous remettre une copie en cas de perte ;</li>
  <li>Pièces comptables : <strong>10 ans</strong>, conformément au Code de commerce ;</li>
  <li>Éléments biographiques bruts : supprimés <strong>12 mois</strong> après la livraison, sauf demande contraire de votre part.</li>
</ul>

<h2>Destinataires</h2>
<p>Les données sont traitées par Melodia Funèbre. Interviennent également, en qualité de sous-traitants techniques :</p>
<ul>
  <li><strong>Vercel Inc.</strong> — hébergement du site ;</li>
  <li><strong>PayPal</strong> — traitement des paiements (Melodia Funèbre n'a jamais accès à vos coordonnées bancaires) ;</li>
  <li>${F('[fournisseur de base de données — à compléter si Supabase est activé]')}.</li>
</ul>
<p>Lorsqu'une commande provient d'une agence partenaire, celle-ci a accès au statut d'avancement des commandes qu'elle a elle-même transmises.</p>

<h2>Stockage local sur votre appareil</h2>
<p>Le site enregistre certaines informations dans le stockage local de votre navigateur : le brouillon de commande en cours, afin que vous puissiez interrompre et reprendre votre saisie, ainsi que votre session si vous disposez d'un compte. Ces données restent sur votre appareil et peuvent être effacées à tout moment en vidant les données du site dans votre navigateur.</p>
<p>Le site n'utilise <strong>aucun cookie publicitaire ni traceur de mesure d'audience tiers</strong>.</p>

<h2>Vos droits</h2>
<p>Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données. Pour les exercer, écrivez à <a href="mailto:${MAIL}">${MAIL}</a> : nous répondons sous un mois.</p>
<p>Vous pouvez également introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL), 3 place de Fontenoy, 75007 Paris — <a href="https://www.cnil.fr" rel="noopener">cnil.fr</a>.</p>

<h2>Sécurité</h2>
<p>Le site est servi exclusivement en HTTPS. Les accès aux espaces client et partenaire sont protégés par mot de passe. Les paiements sont traités par PayPal, sans transit ni stockage de données bancaires chez Melodia Funèbre.</p>`
);

module.exports = [mentions, cgv, confid];
