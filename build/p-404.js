const { ICON } = require('./gen.js');
module.exports = {
  file: '404.html',
  title: 'Page introuvable | Melodia Funèbre',
  desc: "Cette page n'existe pas ou a été déplacée. Retrouvez les offres, les démonstrations et le contact de Melodia Funèbre.",
  noindex: true,
  sticky: false,
  body: `
  <section class="section" style="padding-top:10rem; min-height:70vh; display:flex; align-items:center;">
    <div class="wrap center">
      <div class="eyebrow reveal in" style="justify-content:center;">Erreur 404</div>
      <h1 class="h-hero reveal in reveal-d1">Cette page<br>n'existe <em>pas.</em></h1>
      <p class="lead reveal in reveal-d2" style="margin:1.8rem auto 2.6rem; max-width:52ch;">
        Le lien est peut-être ancien, ou comporte une faute de frappe. Si vous cherchiez à commander un hommage
        ou si la cérémonie approche, demandez à être rappelé : nous répondons sept jours sur sept.
      </p>
      <div class="hero-actions reveal in reveal-d3" style="justify-content:center;">
        <a href="index.html" class="btn btn-gold btn-lg">Retour à l'accueil</a>
        <button type="button" class="btn btn-outline btn-lg" data-rappel>${ICON.phone} Être rappelé</button>
      </div>
      <div class="reveal in reveal-d4" style="margin-top:3.5rem;">
        <hr class="rule-gold" style="max-width:340px; margin:0 auto 2rem;">
        <div class="grid-4" style="max-width:820px; margin:0 auto; gap:.8rem;">
          <a href="offres.html" class="acte" style="text-align:center; padding:1.3rem .8rem;"><h3 style="font-size:1.05rem; margin:0;">Offres</h3></a>
          <a href="demos.html" class="acte" style="text-align:center; padding:1.3rem .8rem;"><h3 style="font-size:1.05rem; margin:0;">Écouter</h3></a>
          <a href="processus.html" class="acte" style="text-align:center; padding:1.3rem .8rem;"><h3 style="font-size:1.05rem; margin:0;">Processus</h3></a>
          <a href="agences.html" class="acte" style="text-align:center; padding:1.3rem .8rem;"><h3 style="font-size:1.05rem; margin:0;">Agences</h3></a>
        </div>
      </div>
    </div>
  </section>`
};
