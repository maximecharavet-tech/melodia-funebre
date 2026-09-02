const { ICON, TEL, TEL_HREF, MAIL } = require('./gen.js');
const P = require('./parts.js');
const { FAQ } = require('./data.js');

module.exports = {
  file: 'contact.html',
  title: 'Nous contacter — 7 j/7 pour les urgences | Melodia Funèbre',
  desc: "Joignez Melodia Funèbre par téléphone au 07 84 10 16 96 ou par email. Urgences traitées sept jours sur sept, réponse sous deux heures ouvrées.",
  body: `
  <section class="section" style="padding-top:9rem;padding-bottom:0;">
    <div class="wrap">
      <div class="eyebrow reveal in">Nous joindre</div>
      <h1 class="h-hero reveal in reveal-d1">Nous décrochons<br><em>nous-mêmes.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin-top:1.8rem;">Pas de standard, pas de formulaire sans réponse. Vous parlez au fondateur, du premier appel à la livraison de l'œuvre.</p>
    </div>
  </section>

${P.urgency()}

  <section class="section section-tight">
    <div class="wrap">
      <div class="grid-3">
        <div class="card card-gold card-lift reveal">
          <div class="card-icon">${ICON.phone}</div>
          <h3 class="h-lg">Par téléphone</h3>
          <p>Le plus rapide, et de loin. Sept jours sur sept pour les urgences funéraires.</p>
          <a href="tel:${TEL_HREF}" class="btn btn-gold btn-block" style="margin-top:1.4rem;">${TEL}</a>
          <div class="mono" style="margin-top:1rem;text-align:center;">Lun – Ven 9 h – 19 h · Urgences 7 j/7</div>
        </div>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.pen}</div>
          <h3 class="h-lg">Par email</h3>
          <p>Pour les demandes détaillées, les devis d'agence ou l'envoi de documents.</p>
          <a href="mailto:${MAIL}" class="btn btn-outline btn-block" style="margin-top:1.4rem;">Écrire un email</a>
          <div class="mono" style="margin-top:1rem;text-align:center;">Réponse sous 2 h ouvrées</div>
        </div>
        <div class="card card-lift reveal">
          <div class="card-icon">${ICON.users}</div>
          <h3 class="h-lg">Vous êtes une agence</h3>
          <p>Pompes funèbres : découvrez les conditions du partenariat et simulez vos revenus.</p>
          <a href="agences.html" class="btn btn-outline btn-block" style="margin-top:1.4rem;">Espace agences</a>
          <div class="mono" style="margin-top:1rem;text-align:center;">60 % de marge · 0 € d'investissement</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ FORMULAIRE ═══ -->
  <section class="section section-light">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.5rem;">
        <div class="eyebrow">Nous écrire</div>
        <h2 class="h-xl">Dites-nous <em>où vous en êtes.</em></h2>
        <p class="lead" style="margin-top:1.2rem;">Si la cérémonie est imminente, appelez plutôt : nous répondons immédiatement.</p>
      </div>
      <div class="card reveal">
        <div class="form-msg" id="ct-msg"></div>
        <div class="field-row">
          <div class="field"><label class="field-label" for="ct-name">Votre nom *</label><input class="field-input" id="ct-name" placeholder="Prénom Nom" autocomplete="name"><div class="field-err"></div></div>
          <div class="field"><label class="field-label" for="ct-email">Votre email *</label><input class="field-input" id="ct-email" type="email" placeholder="vous@email.fr" autocomplete="email"><div class="field-err"></div></div>
        </div>
        <div class="field-row">
          <div class="field"><label class="field-label" for="ct-tel">Téléphone</label><input class="field-input" id="ct-tel" type="tel" placeholder="06 12 34 56 78" autocomplete="tel"></div>
          <div class="field"><label class="field-label" for="ct-sujet">Votre demande</label><select class="field-select" id="ct-sujet"><option>Commander un hommage</option><option>Cérémonie imminente — urgence</option><option>Devenir agence partenaire</option><option>Question sur une commande en cours</option><option>Autre</option></select></div>
        </div>
        <div class="field">
          <label class="field-label" for="ct-msg-txt">Votre message *</label>
          <textarea class="field-area" id="ct-msg-txt" placeholder="Dites-nous en quelques lignes de qui il s'agit et quand a lieu la cérémonie."></textarea>
          <div class="field-err"></div>
        </div>
        <button class="btn btn-gold btn-block" type="button" id="ct-send">Envoyer le message</button>
        <p style="font-size:.78rem;color:var(--ivory-dim);margin-top:1rem;line-height:1.6;text-align:center;">Ce bouton ouvre votre logiciel de messagerie avec le message pré-rempli. Vous pouvez aussi écrire directement à <a href="mailto:${MAIL}" style="color:var(--or-deep);text-decoration:underline;">${MAIL}</a>.</p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap-tight">
      <div class="center reveal" style="margin-bottom:2.5rem;">
        <div class="eyebrow">Réponses rapides</div>
        <h2 class="h-xl">Peut-être <em>déjà ici.</em></h2>
      </div>
      <div class="reveal">
${P.faq([FAQ[0], FAQ[1], FAQ[3], FAQ[6]])}
      </div>
    </div>
  </section>

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">Le temps <em>presse ?</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.4rem;">Un appel de trois minutes, et la composition peut démarrer aujourd'hui.</p>
      <div class="hero-actions">
        <a href="tel:${TEL_HREF}" class="btn btn-gold btn-lg">${ICON.phone} ${TEL}</a>
        <a href="offres.html" class="btn btn-outline btn-lg">Commander en ligne</a>
      </div>
    </div>
  </section>`,
  inline: `<script>
/* Le formulaire compose un email pré-rempli : aucun serveur à maintenir,
   et le message part depuis la messagerie du visiteur (traçable pour lui). */
(function () {
  var btn = document.getElementById('ct-send');
  if (!btn) return;
  var val = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
  btn.addEventListener('click', function () {
    var msg = document.getElementById('ct-msg');
    var name = val('ct-name'), email = val('ct-email'), texte = val('ct-msg-txt');
    var manque = [];
    if (!name) manque.push('ct-name');
    if (!/^[^@\\s]+@[^@\\s]+\\.[a-z]{2,}$/i.test(email)) manque.push('ct-email');
    if (!texte) manque.push('ct-msg-txt');
    document.querySelectorAll('.invalid').forEach(function (e) { e.classList.remove('invalid'); });
    if (manque.length) {
      manque.forEach(function (id) { document.getElementById(id).classList.add('invalid'); });
      msg.className = 'form-msg err';
      msg.textContent = 'Merci de renseigner votre nom, un email valide et votre message.';
      return;
    }
    var corps = [
      'Nom : ' + name,
      'Email : ' + email,
      'Téléphone : ' + (val('ct-tel') || 'non communiqué'),
      'Demande : ' + val('ct-sujet'),
      '', texte
    ].join('\\n');
    window.location.href = 'mailto:${MAIL}'
      + '?subject=' + encodeURIComponent('[Site] ' + val('ct-sujet') + ' — ' + name)
      + '&body=' + encodeURIComponent(corps);
    msg.className = 'form-msg ok';
    msg.textContent = 'Votre logiciel de messagerie va s\\'ouvrir. Si rien ne se passe, écrivez-nous à ${MAIL}.';
  });
})();
</script>`
};
