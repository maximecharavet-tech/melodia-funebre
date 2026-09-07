const { ICON } = require('./gen.js');
const P = require('./parts.js');
const { OFFERS, FAQ, STYLES, OPTIONS } = require('./data.js');

const offerChoices = OFFERS.map(o => `            <button type="button" class="choice${o.name === 'Prestige' ? ' selected' : ''}" data-offer="${o.name}">
              <span class="choice-title">${o.name} — ${o.price} €</span>
              <span class="choice-sub">${o.desc}</span>
            </button>`).join('\n');

/* Les cases portent leur prix en attribut : order.js les relit dans le
   DOM plutôt que de recopier un tarif qui divergerait au premier
   changement. « data-inclus » nomme les offres où l'option est déjà
   comprise, pour ne pas la facturer deux fois. */
const optionsBloc = OPTIONS.map(o => `              <label class="opt">
                <input type="checkbox" class="opt-case" id="o-opt-${o.id}" data-opt="${o.id}" data-prix="${o.prix}" data-inclus="${(o.inclusDans || []).join(',')}">
                <span class="opt-corps">
                  <span class="opt-tete">
                    <span class="opt-titre">${o.titre}</span>
                    <span class="opt-prix" data-prix-affiche="${o.id}">+ ${o.prix} €</span>
                  </span>
                  <span class="opt-aide">${o.aide}</span>
                </span>
              </label>`).join('\n');

const styleOpts = STYLES.map(s => `<option${s === 'Chanson française' ? ' selected' : ''}>${s}</option>`).join('');

module.exports = {
  file: 'offres.html',
  title: 'Tarifs d\'un hommage musical, dès 149 € | Melodia Funèbre',
  desc: "Trois offres : Essentiel 149 €, Prestige 299 €, Mémorial 499 €. Livraison en 24 h, aucun droit SACEM, révision incluse, commande en ligne.",
  /* L'entité « maison » est déclarée ici aussi : le Service la
     désigne par identifiant, et une référence dont la cible n'est
     déclarée sur aucune page lue en même temps ne se résout pas. Le
     nœud est léger, et le répéter rend le graphe de la page complet
     à lui seul. */
  jsonld: [P.jsonldOrg, P.jsonldService, P.jsonldFil('Offres et tarifs', '/offres')],
  scripts: ['assets/js/config.js', 'assets/js/auth.js', 'assets/js/order.js'],
  body: `
  <section class="section a-rosace" style="padding-top:9rem;padding-bottom:0;">
    <div class="orn-rosace-hote" data-orn-rosace="offres" data-orn-traits="3"></div>
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
            <tr><th scope="row">Livraison sous 6 h</th><td>+ 199 €</td><td class="col-hl">+ 199 €</td><td class="yes">Incluse</td></tr>
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
            <div class="opts">
              <div class="opts-tete">
                <span class="opts-titre">Pour aller plus loin</span>
                <span class="opts-sous">Facultatif, et décochable jusqu'au paiement</span>
              </div>
${optionsBloc}
            </div>
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
              <div class="field-hint">La musique doit s'accorder au rite : certaines traditions n'en admettent pas, et nous vous le dirons franchement. <a href="/rites" style="color:var(--or-patina);">Ce que nous proposons selon le rite</a></div>
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
              <span>J'accepte que ces informations soient utilisées pour composer l'hommage, conformément à la <a href="/confidentialite" style="color:var(--or);text-decoration:underline;">politique de confidentialité</a>. *</span>
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
          <div id="rc-options"></div>
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
      <p style="color:var(--ash);margin-bottom:1.2rem;max-width:46ch;margin-left:auto;margin-right:auto;">Nous vous appelons sous deux heures ouvrées pour l'entretien de cinq minutes. La composition démarre juste après.</p>
      <!-- Le règlement par lien PayPal se fait dans un autre onglet : sans
           ce rappel, une famille croit avoir payé alors que l'onglet
           attend encore, ou l'inverse. -->
      <p id="confirm-paiement" hidden style="color:var(--or);margin-bottom:2.4rem;max-width:46ch;margin-left:auto;margin-right:auto;font-size:.92rem;line-height:1.7;">PayPal s'est ouvert dans un autre onglet pour le règlement. Si vous l'avez fermé, écrivez-nous : nous vous renvoyons le lien. Votre commande, elle, est bien enregistrée.</p>
      <div style="height:1.2rem;"></div>
      <div class="hero-actions" style="justify-content:center;">
        <a href="/compte" class="btn btn-gold">Suivre ma commande</a>
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
  inline: `<script>
/* ═══ ENCAISSEMENT ═══════════════════════════════════════════════
   Trois modes, choisis d'après assets/js/config.js :

   1. Identifiant client PayPal renseigné → le bouton officiel. La
      famille paie sans quitter le site et la commande arrive marquée
      « payée », avec son numéro de transaction.
   2. Sinon, un pseudonyme PayPal.me → la commande est enregistrée,
      puis la famille part régler sur un lien au montant pré-rempli.
      PayPal ne nous répond pas : le règlement est à pointer à la main.
   3. Ni l'un ni l'autre → bac à sable, aucun encaissement réel.

   Le script du SDK est injecté ici plutôt que posé dans la page :
   son adresse contient l'identifiant, qui n'est connu qu'à
   l'exécution. Une balise figée obligerait à reconstruire le site
   pour changer de compte d'encaissement. */
(function () {
  var CFG = window.MELODIA_CONFIG || {};
  var zone = document.getElementById('paypal-zone');
  if (!zone) return;

  var info = function () {
    return window.melodiaOrderInfo
      ? window.melodiaOrderInfo()
      : { offer: 'Prestige', price: 299 };
  };

  /* ─── 1 et 3 : le bouton officiel ─── */
  function sdk(identifiant) {
    var el = document.createElement('script');
    el.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(identifiant) +
             '&currency=EUR&components=buttons';
    el.setAttribute('data-namespace', 'paypal_sdk');
    el.onload = function () {
      if (typeof paypal_sdk === 'undefined') return replier();
      paypal_sdk.Buttons({
        style: { layout: 'horizontal', color: 'gold', shape: 'rect', height: 46, tagline: false },
        createOrder: function (d, a) {
          var i = info();
          return a.order.create({ purchase_units: [{
            description: 'Melodia Funèbre — ' + i.offer,
            amount: { currency_code: 'EUR', value: i.price + '.00' }
          }] });
        },
        onApprove: function (d, a) { return a.order.capture().then(function (x) { sendOrder(true, x.id); }); },
        onError: function () { window.melodiaToast('Paiement interrompu — vous pouvez enregistrer et régler plus tard.'); }
      }).render('#paypal-zone');
    };
    /* PayPal injoignable — bloqueur, réseau coupé — ne doit pas laisser
       une zone vide en face d'une famille prête à payer. */
    el.onerror = replier;
    document.head.appendChild(el);
  }

  /* ─── 2 : le lien PayPal.me ─── */
  function lienPaypalMe(pseudo, prix) {
    return 'https://www.paypal.com/paypalme/' + encodeURIComponent(pseudo) +
           '/' + prix + 'EUR';
  }

  function replier() {
    var pseudo = CFG.PAYPAL_ME;
    if (!pseudo) { zone.innerHTML = ''; return; }
    zone.innerHTML =
      '<button type="button" class="btn btn-gold btn-block" id="pp-me">' +
        'Régler <span id="pp-me-prix"></span> par PayPal' +
      '</button>' +
      '<p style="font-size:.78rem;color:var(--dust);margin:.7rem 0 0;line-height:1.6;">' +
        'PayPal s\\'ouvre dans un nouvel onglet, le montant déjà rempli. ' +
        'Votre commande est enregistrée avant l\\'ouverture : rien n\\'est perdu ' +
        'si le paiement échoue.</p>';

    var prix = zone.querySelector('#pp-me-prix');
    var majPrix = function () { prix.textContent = info().price + ' €'; };
    majPrix();
    /* Le montant dépend de l'offre et de l'option urgence, choisies
       plus haut dans le tunnel. On le relit à chaque navigation dans
       le tunnel plutôt qu'une seule fois : afficher 199 € sur un
       bouton qui en prélèvera 299 serait la pire des erreurs ici. */
    var tunnel = document.querySelector('.wizard') || zone.closest('form') || document;
    tunnel.addEventListener('click', majPrix, true);
    tunnel.addEventListener('change', majPrix, true);

    zone.querySelector('#pp-me').addEventListener('click', function () {
      /* La validation doit être synchrone : un navigateur ne laisse
         ouvrir une fenêtre que dans le geste même du clic. */
      if (window.melodiaOrderPret && !window.melodiaOrderPret()) return;
      var i = info();
      window.open(lienPaypalMe(pseudo, i.price), '_blank', 'noopener');
      if (window.sendOrder) window.sendOrder(false, '', 'paypalme');
    });
  }

  var id = (CFG.PAYPAL_CLIENT_ID || '').trim();
  if (id) sdk(id);
  else if (CFG.PAYPAL_ME) replier();
  else sdk('sb');
})();
</script>`
};
