const { ICON } = require('./gen.js');
const P = require('./parts.js');
const { OFFERS, FAQ, STYLES } = require('./data.js');

const offerChoices = OFFERS.map(o => `            <button type="button" class="choice${o.name === 'Prestige' ? ' selected' : ''}" data-offer="${o.name}">
              <span class="choice-title">${o.name} — ${o.price} €</span>
              <span class="choice-sub">${o.desc}</span>
            </button>`).join('\n');

const styleOpts = STYLES.map(s => `<option${s === 'Chanson française' ? ' selected' : ''}>${s}</option>`).join('');

module.exports = {
  file: 'offres.html',
  title: 'Offres et tarifs — Un hommage musical dès 149 € | Melodia Funèbre',
  desc: "Trois offres de composition musicale funéraire : Essentiel 149 €, Prestige 299 €, Mémorial 499 €. Livraison en 24 h, aucun droit SACEM, révision incluse. Commande en ligne sécurisée.",
  jsonld: [P.jsonldService],
  scripts: ['assets/js/config.js', 'assets/js/auth.js', 'assets/js/order.js'],
  body: `
  <section class="section" style="padding-top:9rem;padding-bottom:0;">
    <div class="wrap">
      <div class="eyebrow reveal in">Offres et tarifs</div>
      <h1 class="h-hero reveal in reveal-d1">Trois façons<br>de dire <em>adieu.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.8rem;">Paiement sécurisé, entretien sous vingt-quatre heures, aucun droit de diffusion à régler. Et si l'œuvre ne vous touche pas, nous la reprenons.</p>
    </div>
  </section>

  <section class="section section-tight">
    <div class="wrap">
      <div class="grid-3">
${P.pricing('order')}
      </div>
      <div style="margin-top:2.5rem;">${P.trustStrip()}</div>
      <p class="center reveal note" style="margin-top:1rem;">
        Paiement PayPal et carte bancaire · Rétractation 14 jours · TVA non applicable, art. 293 B du CGI
      </p>
    </div>
  </section>

  <!-- ═══ COMPARATIF DÉTAILLÉ ═══ -->
  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Le détail</div>
        <h2 class="h-xl">Ce que comprend<br>chaque <em>offre.</em></h2>
      </div>
${P.scrollHint()}
      <div class="compare-wrap reveal">
        <table class="compare">
          <thead><tr><th scope="col">&nbsp;</th><th scope="col">Essentiel<br>149 €</th><th scope="col" class="col-hl">Prestige<br>299 €</th><th scope="col">Mémorial<br>499 €</th></tr></thead>
          <tbody>
            <tr><th scope="row">Œuvre originale personnalisée</th><td class="yes">✓</td><td class="col-hl yes">✓</td><td class="yes">✓</td></tr>
            <tr><th scope="row">Entretien téléphonique</th><td class="yes">✓</td><td class="col-hl yes">✓</td><td class="yes">✓</td></tr>
            <tr><th scope="row">Livraison sous 24 h</th><td class="yes">✓</td><td class="col-hl yes">✓</td><td class="yes">✓</td></tr>
            <tr><th scope="row">Droits d'usage à vie</th><td class="yes">✓</td><td class="col-hl yes">✓</td><td class="yes">✓</td></tr>
            <tr><th scope="row">Nombre de versions</th><td>1</td><td class="col-hl">2 au choix</td><td>3 titres</td></tr>
            <tr><th scope="row">Révisions incluses</th><td class="no">Option 49 €</td><td class="col-hl">1 offerte</td><td class="yes">Illimitées</td></tr>
            <tr><th scope="row">Version instrumentale</th><td class="no">—</td><td class="col-hl yes">✓</td><td class="yes">✓</td></tr>
            <tr><th scope="row">Paroles imprimables (PDF)</th><td class="no">—</td><td class="col-hl yes">✓</td><td class="yes">✓</td></tr>
            <tr><th scope="row">Fichier WAV sans perte</th><td class="no">—</td><td class="col-hl">Sur demande</td><td class="yes">✓</td></tr>
            <tr><th scope="row">Livret souvenir imprimé</th><td class="no">—</td><td class="col-hl no">—</td><td class="yes">✓</td></tr>
            <tr><th scope="row">Priorité urgence 6 h</th><td>+ 49 €</td><td class="col-hl">+ 49 €</td><td class="yes">Incluse</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

${P.urgency()}

  <!-- ═══ TUNNEL DE COMMANDE ═══ -->
  <section class="section" id="commander">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:3rem;">
        <div class="eyebrow">Votre commande</div>
        <h2 class="h-xl">Racontez-nous <em>qui il était.</em></h2>
        <p class="lead" style="margin-top:1.2rem;">Six étapes courtes, trois minutes en tout. Vous pouvez vous arrêter et revenir : votre brouillon est conservé sur cet appareil.</p>
      </div>

      <div class="wz-layout">
        <div class="card wizard">
          <div class="form-msg" id="o-draft-note" style="background:rgba(56,189,248,.08);border-color:rgba(56,189,248,.28);color:#7dd3fc;">
            Nous avons retrouvé votre brouillon.
            <button type="button" id="o-draft-clear" style="text-decoration:underline;color:inherit;margin-left:.4rem;">Recommencer à zéro</button>
          </div>

          <div class="wz-progress" aria-hidden="true">
            <div class="wz-node active"><div class="wz-dot">1</div><div class="wz-label">Offre</div></div>
            <div class="wz-node"><div class="wz-dot">2</div><div class="wz-label">Le défunt</div></div>
            <div class="wz-node"><div class="wz-dot">3</div><div class="wz-label">Portrait</div></div>
            <div class="wz-node"><div class="wz-dot">4</div><div class="wz-label">Musique</div></div>
            <div class="wz-node"><div class="wz-dot">5</div><div class="wz-label">Contact</div></div>
            <div class="wz-node"><div class="wz-dot">6</div><div class="wz-label">Paiement</div></div>
          </div>

          <!-- Étape 1 -->
          <div class="wz-step active">
            <h3 class="wz-title">Quel hommage souhaitez-vous ?</h3>
            <p class="wz-sub">Vous pourrez changer d'avis jusqu'au paiement.</p>
            <div class="choices">
${offerChoices}
            </div>
            <label class="check" style="margin-top:1.4rem;">
              <input type="checkbox" id="o-urgence">
              <span>La cérémonie a lieu dans moins de 72 heures — priorité 6 heures <span style="color:var(--or);">(+ 49 €, incluse en Mémorial)</span></span>
            </label>
            <div class="wz-actions"><button type="button" class="btn btn-gold" data-wz-next>Continuer</button></div>
          </div>

          <!-- Étape 2 -->
          <div class="wz-step">
            <h3 class="wz-title">Qui était-il, qui était-elle ?</h3>
            <p class="wz-sub">Donnez-nous le prénom que la famille employait vraiment — celui qu'on entendra dans la chanson.</p>
            <div class="field">
              <label class="field-label" for="o-defunt">Prénom du défunt *</label>
              <input class="field-input" id="o-defunt" placeholder="Maurice, ou « Papi Momo »" autocomplete="off">
              <div class="field-err"></div>
              <div class="field-hint">Si un surnom était plus employé que le prénom, indiquez-le : c'est celui-là qui touche.</div>
            </div>
            <div class="field-row">
              <div class="field"><label class="field-label" for="o-age">Âge</label><input class="field-input" id="o-age" placeholder="78 ans"></div>
              <div class="field"><label class="field-label" for="o-lien">Votre lien avec lui</label><input class="field-input" id="o-lien" placeholder="sa fille"></div>
            </div>
            <div class="wz-actions"><button type="button" class="btn btn-ghost" data-wz-prev>${ICON.arrowL} Retour</button><button type="button" class="btn btn-gold" data-wz-next>Continuer</button></div>
          </div>

          <!-- Étape 3 -->
          <div class="wz-step">
            <h3 class="wz-title">Son portrait, en quelques mots</h3>
            <p class="wz-sub">Le concret vaut mieux que le beau. « Il sifflait en marchant » nous sert davantage que « c'était quelqu'un de bien ».</p>
            <div class="field">
              <label class="field-label" for="o-traits">Trois traits de caractère *</label>
              <input class="field-input" id="o-traits" placeholder="têtu, généreux, taquin">
              <div class="field-err"></div>
            </div>
            <div class="field-row">
              <div class="field"><label class="field-label" for="o-metier">Métier ou passion</label><input class="field-input" id="o-metier" placeholder="pêcheur en bord de Loire"></div>
              <div class="field"><label class="field-label" for="o-habitude">Une habitude quotidienne</label><input class="field-input" id="o-habitude" placeholder="sifflait en marchant"></div>
            </div>
            <div class="field">
              <label class="field-label" for="o-anecdote">Une anecdote qui le résume</label>
              <textarea class="field-area" id="o-anecdote" placeholder="Il a appris à pêcher à ses quatre petits-enfants, un par un, au même endroit…"></textarea>
              <div class="field-hint">Facultatif — mais c'est souvent l'anecdote qui devient le refrain.</div>
            </div>
            <div class="wz-actions"><button type="button" class="btn btn-ghost" data-wz-prev>${ICON.arrowL} Retour</button><button type="button" class="btn btn-gold" data-wz-next>Continuer</button></div>
          </div>

          <!-- Étape 4 -->
          <div class="wz-step">
            <h3 class="wz-title">Quelle musique lui ressemble ?</h3>
            <p class="wz-sub">Si vous hésitez, laissez le choix par défaut : nous en reparlons pendant l'entretien.</p>
            <div class="field-row">
              <div class="field"><label class="field-label" for="o-style">Style musical</label><select class="field-select" id="o-style">${styleOpts}</select></div>
              <div class="field"><label class="field-label" for="o-ambiance">Ambiance</label><select class="field-select" id="o-ambiance"><option>Douce et lumineuse</option><option>Grave et recueillie</option><option>Joyeuse, à son image</option><option>Nostalgique</option><option>Solennelle</option></select></div>
            </div>
            <div class="field">
              <label class="field-label" for="o-voix">Voix</label>
              <select class="field-select" id="o-voix"><option>Peu importe</option><option>Voix masculine</option><option>Voix féminine</option><option>Instrumental seul, sans voix</option></select>
            </div>
            <div class="field">
              <label class="field-label" for="o-rite">Cérémonie religieuse ?</label>
              <select class="field-select" id="o-rite">
                <option value="">Cérémonie civile, sans rite religieux</option>
                <option>Catholique</option>
                <option>Protestante</option>
                <option>Orthodoxe</option>
                <option>Juive</option>
                <option>Musulmane</option>
                <option>Autre tradition</option>
                <option>Je ne sais pas encore</option>
              </select>
              <div class="field-hint">La musique doit s'accorder au rite : certaines traditions n'en admettent pas, et nous vous le dirons franchement. <a href="rites.html" style="color:var(--or-patina);">Ce que nous proposons selon le rite</a></div>
            </div>
            <div class="field">
              <label class="field-label" for="o-texte">Un texte, un verset ou une prière qui comptait</label>
              <input class="field-input" id="o-texte" placeholder="Le psaume 23, une sourate, un poème…">
              <div class="field-hint">Facultatif. S'il est cité, il devient la colonne de l'œuvre. Nous le soumettons au célébrant avant tout.</div>
            </div>
            <div class="wz-actions"><button type="button" class="btn btn-ghost" data-wz-prev>${ICON.arrowL} Retour</button><button type="button" class="btn btn-gold" data-wz-next>Continuer</button></div>
          </div>

          <!-- Étape 5 -->
          <div class="wz-step">
            <h3 class="wz-title">Où vous joignons-nous ?</h3>
            <p class="wz-sub">Nous vous rappelons sous deux heures ouvrées pour l'entretien de cinq minutes.</p>
            <div class="field-row">
              <div class="field"><label class="field-label" for="o-name">Votre nom *</label><input class="field-input" id="o-name" placeholder="Prénom Nom" autocomplete="name"><div class="field-err"></div></div>
              <div class="field"><label class="field-label" for="o-email">Votre email *</label><input class="field-input" id="o-email" type="email" placeholder="vous@email.fr" autocomplete="email"><div class="field-err"></div></div>
            </div>
            <div class="field">
              <label class="field-label" for="o-tel">Téléphone</label>
              <input class="field-input" id="o-tel" type="tel" placeholder="06 12 34 56 78" autocomplete="tel">
              <div class="field-hint">Vivement recommandé : l'entretien se fait au téléphone.</div>
            </div>
            <label class="check">
              <input type="checkbox" id="o-consent">
              <span>J'accepte que ces informations soient utilisées pour composer l'hommage, conformément à la <a href="confidentialite.html" style="color:var(--or);text-decoration:underline;">politique de confidentialité</a>. *</span>
            </label>
            <div class="wz-actions"><button type="button" class="btn btn-ghost" data-wz-prev>${ICON.arrowL} Retour</button><button type="button" class="btn btn-gold" data-wz-next>Vérifier ma commande</button></div>
          </div>

          <!-- Étape 6 -->
          <div class="wz-step">
            <h3 class="wz-title">Tout est prêt.</h3>
            <p class="wz-sub">Vérifiez le récapitulatif ci-contre, puis réglez en ligne — ou enregistrez et réglez après l'entretien.</p>
            <div class="form-msg" id="o-msg"></div>
            <div id="paypal-zone" style="min-height:46px;margin-bottom:1rem;"></div>
            <button class="btn btn-outline btn-block" id="o-submit" type="button" onclick="sendOrder(false)">Enregistrer et régler après l'entretien</button>
            <p style="font-size:.78rem;color:var(--dust);margin-top:1rem;line-height:1.6;">Aucun prélèvement n'est effectué tant que vous n'avez pas validé le paiement. Vous pouvez annuler sans frais jusqu'au début de la composition.</p>
            <div class="wz-actions"><button type="button" class="btn btn-ghost" data-wz-prev>${ICON.arrowL} Retour</button></div>
          </div>
        </div>

        <!-- Récapitulatif -->
        <aside class="wz-recap">
          <div class="wz-recap-head">Votre hommage</div>
          <div class="wz-line"><span>Offre</span><b id="rc-offer">Prestige</b></div>
          <div class="wz-line"><span>Pour</span><b id="rc-defunt">—</b></div>
          <div class="wz-line"><span>Style</span><b id="rc-style">—</b></div>
          <div class="wz-line"><span>Urgence</span><b id="rc-urgence">Non</b></div>
          <div class="wz-line" id="rc-supp-line" style="display:none;"><span>Priorité 6 h</span><b>+ 49 €</b></div>
          <div class="wz-total"><span>Total</span><b id="rc-total">299 €</b></div>
          <div style="margin-top:1.4rem;padding-top:1.2rem;border-top:1px solid var(--line-soft);">
            <div class="trust-item" style="margin-bottom:.7rem;">${ICON.clock}<span>Livré 24 h après l'entretien</span></div>
            <div class="trust-item" style="margin-bottom:.7rem;">${ICON.shield}<span>Aucun droit SACEM</span></div>
            <div class="trust-item">${ICON.heart}<span>Repris si ça sonne faux</span></div>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <!-- ═══ CONFIRMATION ═══ -->
  <section class="section" id="confirm" style="display:none;">
    <div class="wrap center" style="max-width:620px;">
      <img src="assets/img/logo-melodia.jpg" alt="" style="height:110px;width:110px;object-fit:cover;border-radius:50%;margin:0 auto 2rem;border:1px solid var(--line-strong);">
      <div class="eyebrow" style="justify-content:center;">Commande enregistrée</div>
      <h2 class="h-xl">Nous prenons<br>le <em>relais.</em></h2>
      <p class="lead" style="margin:1.4rem auto .6rem;">Référence <b id="confirm-ref" style="color:var(--or);"></b></p>
      <p style="color:var(--ash);margin-bottom:.4rem;" id="confirm-summary"></p>
      <p style="color:var(--ash);margin-bottom:2.4rem;max-width:46ch;margin-left:auto;margin-right:auto;">Nous vous appelons sous deux heures ouvrées pour l'entretien de cinq minutes. La composition démarre juste après.</p>
      <div class="hero-actions" style="justify-content:center;">
        <a href="compte.html" class="btn btn-gold">Suivre ma commande</a>
        <button type="button" class="btn btn-outline" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
    </div>
  </section>

  <section class="section section-light">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.5rem;">
        <div class="eyebrow">Paiement et garanties</div>
        <h2 class="h-xl">Les questions <em>d'argent.</em></h2>
      </div>
      <div class="reveal">
${P.faq([FAQ[6], FAQ[2], FAQ[1], FAQ[5]])}
      </div>
    </div>
  </section>`,
  inline: `<script src="https://www.paypal.com/sdk/js?client-id=sb&currency=EUR&components=buttons" data-namespace="paypal_sdk"></script>
<script>
/* Bouton PayPal — le montant est relu à l'ouverture pour refléter
   l'offre et l'option urgence choisies dans le tunnel. */
if (typeof paypal_sdk !== 'undefined') {
  paypal_sdk.Buttons({
    style: { layout: 'horizontal', color: 'gold', shape: 'rect', height: 46, tagline: false },
    createOrder: function (d, a) {
      var info = window.melodiaOrderInfo ? window.melodiaOrderInfo() : { offer: 'Prestige', price: 299 };
      return a.order.create({ purchase_units: [{ description: 'Melodia Funèbre — ' + info.offer, amount: { currency_code: 'EUR', value: info.price + '.00' } }] });
    },
    onApprove: function (d, a) { return a.order.capture().then(function (x) { sendOrder(true, x.id); }); },
    onError: function () { window.melodiaToast('Paiement interrompu — vous pouvez enregistrer et régler plus tard.'); }
  }).render('#paypal-zone');
}
</script>`
};
