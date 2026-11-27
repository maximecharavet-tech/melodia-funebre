const P = require('./parts.js');

/* ═══════════════════════════════════════════════════════════════
   /telechargements — L'application Questionnaire famille (Android)
   et le questionnaire à remplir à la main (PDF).

   CE QUE CETTE PAGE NE PROMET PAS
   L'application n'est pas sur le Play Store : c'est une version de
   démonstration, installée à la main. La page le dit en tête, et elle
   explique honnêtement l'avertissement qu'Android affichera. Aucun
   prix, aucune coordonnée autre que celles déjà publiées sur le site.
   ═══════════════════════════════════════════════════════════════ */

const APK = '/documents/melodia-questionnaire-pro-demo.apk';
const PDF = '/documents/melodia-questionnaire-famille.pdf';
const IMG = 'assets/img/telechargements/';

const ecran = (n, alt, legende) => `
          <figure class="tl-ecran reveal">
            <div class="tl-tablette petite"><img src="${IMG}${n}-480.webp" srcset="${IMG}${n}-480.webp 480w, ${IMG}${n}-900.webp 900w" sizes="(max-width: 760px) 70vw, 260px" alt="${alt}" width="480" height="768" loading="lazy" decoding="async"></div>
            <figcaption>${legende}</figcaption>
          </figure>`;

const QUESTIONS = [
  { q: "Pourquoi l'application n'est-elle pas sur le Play Store ?",
    a: "C'est une version de démonstration, distribuée directement aux agences partenaires pour qu'elles l'essaient en conditions réelles. La publication sur le Play Store viendra avec la version définitive." },
  { q: "Android affiche un avertissement : est-ce normal ?",
    a: "Oui. Android prévient chaque fois qu'une application ne vient pas du Play Store. L'application ne demande aucune autorisation particulière : ni contacts, ni photos, ni localisation." },
  { q: "Les réponses de la famille quittent-elles la tablette ?",
    a: "Pas dans cette version. Tout reste enregistré sur l'appareil, même sans réseau. L'envoi vers votre espace Melodia Pro sera activé avec la connexion conseiller." },
  { q: "Fonctionne-t-elle sur iPhone ou iPad ?",
    a: "Pas encore : cette version est réservée à Android, sur tablette comme sur téléphone. Sur iPad, le questionnaire à imprimer prend le relais." },
  { q: "Le PDF reprend-il les mêmes questions que l'application ?",
    a: "Exactement les mêmes, avec la même numérotation, de 1.1 à 6.4. Les réponses écrites à la main se reportent donc sans erreur dans le dossier de la famille." }
];

module.exports = {
  file: 'telechargements.html',
  title: "Téléchargements : questionnaire famille, application et PDF | Melodia Funèbre",
  desc: "Pour les conseillers funéraires : l'application Android du questionnaire famille, utilisable sans réseau, et sa version PDF à remplir à la main.",
  jsonld: [P.jsonldFil('Téléchargements', '/telechargements'), {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: QUESTIONS.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } }))
  }],
  body: `
<style>
/* ── Téléchargements : appareils, galerie, PDF ── */
.tl-hero{padding:8.5rem 0 5rem;position:relative;overflow:hidden}
.tl-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(60% 55% at 72% 45%,rgba(201,168,76,.10),transparent 70%);pointer-events:none}
.tl-hero-grille{display:grid;grid-template-columns:1.25fr .9fr;gap:3rem;align-items:center}
.tl-hero .lead{max-width:34rem}
.tl-demo{display:inline-flex;align-items:center;gap:.55rem;margin-top:1.5rem;font-size:.8rem;letter-spacing:.06em;color:var(--ash);border:1px solid var(--line-strong);border-radius:999px;padding:.45rem 1rem}
.tl-demo b{color:var(--or);font-weight:400}
.tl-meta{margin-top:1rem;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ash)}
.tl-appareils{position:relative;height:560px}
.tl-tablette{position:relative;background:linear-gradient(145deg,#2a2723,#121110 55%,#1c1a17);border-radius:30px;padding:16px;box-shadow:0 40px 90px -30px rgba(0,0,0,.85),inset 0 0 0 1px rgba(201,168,76,.28),inset 0 0 0 4px rgba(255,255,255,.03)}
.tl-tablette::before{content:'';position:absolute;top:7px;left:50%;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:#34312b}
.tl-tablette img,.tl-tel img{display:block;width:100%;height:auto;border-radius:14px}
.tl-tablette.petite{border-radius:22px;padding:11px}
.tl-tablette.petite::before{top:4px;width:4px;height:4px;margin-left:-2px}
.tl-tablette.petite img{border-radius:10px}
.tl-tel{position:relative;background:linear-gradient(145deg,#2a2723,#121110 55%,#1c1a17);border-radius:34px;padding:10px;box-shadow:0 30px 70px -20px rgba(0,0,0,.9),inset 0 0 0 1px rgba(201,168,76,.32)}
.tl-tel img{border-radius:26px}
.tl-appareils .tl-tablette{position:absolute;right:0;top:0;width:330px}
.tl-appareils .tl-tel{position:absolute;left:0;bottom:0;width:190px}
.tl-atouts{display:grid;grid-template-columns:repeat(3,1fr);gap:1.4rem}
.tl-atout{padding:1.8rem 1.6rem;border-top:1px solid rgba(107,88,40,.35)}
.tl-atout .tl-n{font-family:var(--ff-d);font-style:italic;font-size:1.6rem;color:var(--or-ivoire)}
.tl-atout h3{font-family:var(--ff-d);font-weight:400;font-size:1.45rem;margin:.3rem 0 .5rem;color:var(--ivory-ink)}
.tl-atout p{color:var(--ivory-soft);font-size:.95rem;line-height:1.65}
.tl-galerie{display:grid;grid-template-columns:repeat(4,1fr);gap:1.6rem;margin-top:3rem}
.tl-ecran{margin:0}
.tl-ecran figcaption{margin-top:1rem;text-align:center;font-size:.86rem;color:var(--ash);letter-spacing:.02em}
.tl-ecran figcaption b{display:block;font-family:var(--ff-d);font-weight:400;font-size:1.2rem;color:var(--paper);letter-spacing:0;margin-bottom:.15rem}
.tl-etapes{list-style:none;padding:0;margin:0;counter-reset:e;display:grid;gap:1rem}
.tl-etapes li{counter-increment:e;display:grid;grid-template-columns:3rem 1fr;gap:1.1rem;align-items:start;padding:1.25rem 1.4rem;background:#fff;border:1px solid var(--ivory-line);border-radius:14px}
.tl-etapes li::before{content:counter(e);width:2.6rem;height:2.6rem;border-radius:50%;border:1px solid rgba(107,88,40,.45);display:grid;place-items:center;font-family:var(--ff-d);font-size:1.3rem;color:var(--or-ivoire)}
.tl-etapes h3{font-family:var(--ff-b);font-weight:500;font-size:1rem;color:var(--ivory-ink);margin:.35rem 0 .3rem}
.tl-etapes p{color:var(--ivory-soft);font-size:.92rem;line-height:1.6;margin:0}
.tl-install{display:grid;grid-template-columns:1fr 1.25fr;gap:3.5rem;align-items:start}
.tl-encadre{margin-top:1.6rem;padding:1.1rem 1.3rem;border-left:2px solid var(--or-ivoire);background:var(--ivory-2);border-radius:0 12px 12px 0;color:var(--ivory-soft);font-size:.9rem;line-height:1.6}
.tl-pdf{display:grid;grid-template-columns:1.2fr 1fr;gap:3.5rem;align-items:center}
.tl-pages{position:relative;height:520px}
.tl-pages img{position:absolute;width:290px;height:auto;border-radius:4px;box-shadow:0 26px 60px -24px rgba(10,8,4,.45),0 0 0 1px rgba(10,8,4,.06);background:#fff}
.tl-pages img:nth-child(1){left:0;top:40px;transform:rotate(-6deg);z-index:1}
.tl-pages img:nth-child(2){left:90px;top:16px;transform:rotate(-2deg);z-index:2}
.tl-pages img:nth-child(3){left:190px;top:0;z-index:3}
.tl-mini{display:flex;gap:.7rem;margin-top:1.6rem}
.tl-mini img{width:64px;height:auto;border-radius:3px;box-shadow:0 6px 16px -8px rgba(10,8,4,.4);background:#fff}
.tl-retour{list-style:none;padding:0;margin:1.6rem 0 0;display:grid;gap:.8rem}
.tl-retour li{display:flex;gap:.9rem;align-items:flex-start;color:var(--ivory-soft);font-size:.95rem;line-height:1.6}
.tl-retour li span{flex:none;width:1.9rem;height:1.9rem;border-radius:50%;border:1px solid rgba(107,88,40,.45);display:grid;place-items:center;font-family:var(--ff-d);font-size:1.05rem;color:var(--or-ivoire)}
.tl-retour b{color:var(--ivory-ink);font-weight:500}
.tl-boutons{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:2rem}
.tl-boutons .btn{display:inline-flex;align-items:center;gap:.6rem;letter-spacing:.1em;padding-left:1.7rem;padding-right:1.7rem}
.tl-boutons svg{width:17px;height:17px}
@media (max-width:980px){
  .tl-hero-grille,.tl-install,.tl-pdf{grid-template-columns:1fr;gap:2.6rem}
  .tl-appareils{height:470px;max-width:440px;margin:0 auto;width:100%}
  .tl-appareils .tl-tablette{width:290px;right:0}
  .tl-appareils .tl-tel{width:160px}
  .tl-galerie{grid-template-columns:repeat(2,1fr)}
  .tl-atouts{grid-template-columns:1fr 1fr}
  .tl-pages{height:440px;max-width:460px;margin:0 auto;width:100%}
  .tl-pages img{width:240px}
}
@media (max-width:600px){
  .tl-hero{padding:6.5rem 0 3.5rem}
  .tl-appareils{height:390px}
  .tl-appareils .tl-tablette{width:236px;padding:11px;border-radius:22px}
  .tl-appareils .tl-tel{width:128px;padding:7px;border-radius:24px}
  .tl-appareils .tl-tel img{border-radius:18px}
  .tl-galerie{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:1.1rem;padding-bottom:1rem;margin-left:calc(-1*var(--pad));margin-right:calc(-1*var(--pad));padding-left:var(--pad);padding-right:var(--pad)}
  .tl-galerie .tl-ecran{flex:0 0 68%;scroll-snap-align:center}
  .tl-atouts{grid-template-columns:1fr}
  .tl-atout{padding:1.4rem .2rem}
  .tl-pages{height:330px}
  .tl-pages img{width:180px}
  .tl-pages img:nth-child(2){left:60px}
  .tl-pages img:nth-child(3){left:125px}
  .tl-boutons .btn{width:100%;justify-content:center}
}
</style>

  <section class="tl-hero">
    <div class="wrap tl-hero-grille">
      <div>
        <div class="eyebrow reveal in">Téléchargements</div>
        <h1 class="h-xl reveal in reveal-d1" style="margin-top:.8rem;">Le questionnaire famille,<br><em>même sans réseau.</em></h1>
        <p class="lead reveal in reveal-d2" style="margin-top:1.4rem;">Une application Android pour remplir le questionnaire avec la famille, sur tablette ou téléphone, au salon comme à domicile. Et sa version papier, à laisser à la famille, qui revient remplie à la main.</p>
        <div class="tl-boutons reveal in reveal-d3">
          <a href="${APK}" class="btn btn-gold btn-lg" download type="application/vnd.android.package-archive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>Télécharger l'application</a>
          <a href="#questionnaire-papier" class="btn btn-outline btn-lg">Le questionnaire papier</a>
        </div>
        <p class="tl-meta reveal in reveal-d4">Android 6 et plus · Fichier APK · 6,3 Mo · Gratuit</p>
        <p class="tl-demo reveal in reveal-d4"><b>◆</b> Version de démonstration, hors Play Store</p>
      </div>
      <div class="tl-appareils reveal in reveal-d2" aria-hidden="true">
        <div class="tl-tablette"><img src="${IMG}tablette-accueil-900.webp" alt="" width="900" height="1440" decoding="async" fetchpriority="high"></div>
        <div class="tl-tel"><img src="${IMG}telephone-3-musique-412.webp" alt="" width="412" height="915" decoding="async"></div>
      </div>
    </div>
  </section>

  <section class="section section-light">
    <div class="wrap">
      <div class="center reveal" style="margin-bottom:2.8rem;">
        <div class="eyebrow">Pour votre agence</div>
        <h2 class="h-xl">Pensée pour le moment<br><em>où l'on écoute.</em></h2>
        <p class="lead" style="margin-top:1.2rem;max-width:42rem;">La tablette se tend à la famille. Les questions sont douces, une par une, et chacune peut rester vide.</p>
      </div>
      <div class="tl-atouts">
        <div class="tl-atout reveal"><span class="tl-n">i.</span><h3>Sans connexion</h3><p>Tout fonctionne hors ligne et s'enregistre à chaque mot sur l'appareil. Un salon sans wifi, une maison à la campagne : rien ne se perd.</p></div>
        <div class="tl-atout reveal"><span class="tl-n">ii.</span><h3>Le mode famille</h3><p>Aucun prix, aucune note interne. Un appui long sur le monogramme ouvre le mode conseiller : dates, contraintes du lieu, récapitulatif.</p></div>
        <div class="tl-atout reveal"><span class="tl-n">iii.</span><h3>Les bonnes questions</h3><p>La personne, sa vie, la musique, la cérémonie, le message : ce dont nous avons besoin pour composer, dans l'ordre où on le raconte.</p></div>
        <div class="tl-atout reveal"><span class="tl-n">iv.</span><h3>Tablette et téléphone</h3><p>Deux colonnes sur tablette, une sur téléphone. Grandes zones tactiles, texte lisible, contrastes soignés.</p></div>
        <div class="tl-atout reveal"><span class="tl-n">v.</span><h3>Le même dossier partout</h3><p>Les questions et leur numérotation sont celles de votre console Melodia Pro et du questionnaire papier.</p></div>
        <div class="tl-atout reveal"><span class="tl-n">vi.</span><h3>Discrète par nature</h3><p>Aucune autorisation demandée : ni contacts, ni photos, ni localisation. Les coordonnées écrites ne partent jamais à la composition.</p></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="center reveal">
        <div class="eyebrow">L'application</div>
        <h2 class="h-xl">Une vie, une <em>chanson.</em></h2>
      </div>
      <div class="tl-galerie">
${ecran('tablette-1-personne', "Écran de l'étape 1, la personne : prénom, surnom, accord des paroles", '<b>La personne</b>Prénom, surnom, prononciation')}
${ecran('tablette-2-vie', "Écran de l'étape 2, sa vie : métier, traits de caractère, anecdote", '<b>Sa vie</b>Traits, habitudes, anecdotes')}
${ecran('tablette-3-musique', "Écran de l'étape 3, la musique : style, voix, instruments", '<b>La musique</b>Style, voix, instruments')}
${ecran('tablette-recap', "Récapitulatif conseiller : avancement de chaque étape", '<b>Le récapitulatif</b>Pour le conseiller')}
      </div>
    </div>
  </section>

  <section class="section section-light" id="installer">
    <div class="wrap tl-install">
      <div class="reveal">
        <div class="eyebrow">Installation</div>
        <h2 class="h-xl">Installer l'application<br><em>en cinq gestes.</em></h2>
        <p class="lead" style="margin-top:1.2rem;">L'application n'étant pas encore sur le Play Store, elle s'installe depuis son fichier, une fois pour toutes.</p>
        <div class="tl-boutons">
          <a href="${APK}" class="btn btn-gold" download type="application/vnd.android.package-archive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>Télécharger l'APK · 6,3 Mo</a>
        </div>
        <div class="tl-encadre"><b>Version de démonstration.</b> Ce fichier est une version d'essai, signée pour le développement et non publiée sur le Play Store. Android l'indiquera par un avertissement : c'est attendu. Les réponses restent sur l'appareil ; l'envoi vers votre espace Melodia Pro arrivera avec la version définitive.</div>
      </div>
      <ol class="tl-etapes reveal">
        <li><div><h3>Ouvrez cette page sur la tablette</h3><p>Dans Chrome, sur l'appareil Android où l'application servira.</p></div></li>
        <li><div><h3>Téléchargez le fichier</h3><p>Touchez « Télécharger l'application ». Chrome peut demander confirmation pour ce type de fichier : touchez « Télécharger quand même ».</p></div></li>
        <li><div><h3>Ouvrez-le</h3><p>Depuis la notification de fin de téléchargement, ou dans l'application Fichiers, dossier « Téléchargements ».</p></div></li>
        <li><div><h3>Autorisez l'installation</h3><p>Android demande d'autoriser Chrome à installer des applications : touchez « Paramètres », activez « Autoriser cette source », puis revenez en arrière.</p></div></li>
        <li><div><h3>Installez, puis ouvrez</h3><p>Touchez « Installer ». Si Play Protect affiche un avertissement, touchez « Plus de détails » puis « Installer quand même ». L'icône Melodia Questionnaire rejoint vos applications.</p></div></li>
      </ol>
    </div>
  </section>

  <section class="section section-light section-top" id="questionnaire-papier" style="padding-top:2rem;">
    <div class="wrap tl-pdf">
      <div class="tl-pages reveal" aria-hidden="true">
        <img src="${IMG}pdf-page-3-420.webp" alt="" width="420" height="594" loading="lazy" decoding="async">
        <img src="${IMG}pdf-page-2-420.webp" alt="" width="420" height="594" loading="lazy" decoding="async">
        <img src="${IMG}pdf-page-1-840.webp" alt="" width="840" height="1188" loading="lazy" decoding="async">
      </div>
      <div class="reveal">
        <div class="eyebrow">Le questionnaire papier</div>
        <h2 class="h-xl">Quand la famille<br><em>préfère écrire.</em></h2>
        <p class="lead" style="margin-top:1.2rem;">Cinq pages A4, à imprimer et à laisser à la famille. De larges lignes pour écrire, des cases à cocher, un cadre pour le cachet de votre agence.</p>
        <div class="tl-mini" aria-hidden="true">
          ${[1, 2, 3, 4, 5].map((n) => `<img src="${IMG}pdf-page-${n}-420.webp" alt="" width="420" height="594" loading="lazy" decoding="async">`).join('')}
        </div>
        <ul class="tl-retour">
          <li><span>1</span><div><b>Imprimez</b> le questionnaire et apposez le cachet de l'agence en première page.</div></li>
          <li><span>2</span><div><b>La famille le remplit</b> à son rythme, au stylo. Seules les questions marquées ◆ sont indispensables.</div></li>
          <li><span>3</span><div><b>Il revient</b> à votre agence, ou scanné ou photographié à <a href="mailto:contact@melodia-funebre.fr">contact@melodia-funebre.fr</a>. Nous composons à partir de là.</div></li>
        </ul>
        <p class="tl-meta" style="color:var(--ivory-dim);margin-top:1.6rem;">PDF · 5 pages A4 · 2,3 Mo</p>
        <div class="tl-boutons" style="margin-top:.9rem;">
          <a href="${PDF}" class="btn btn-gold" download>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>Télécharger le PDF</a>
          <a href="${PDF}" class="btn btn-outline" target="_blank" rel="noopener">Imprimer</a>
        </div>
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
${P.faq(QUESTIONS, false)}
      </div>
    </div>
  </section>

  <section class="section section-top" style="padding-bottom:6rem;">
    <div class="wrap center reveal">
      <h2 class="h-xl">Pas encore <em>partenaire ?</em></h2>
      <p class="lead" style="margin:1.6rem auto 2.2rem;max-width:42rem;">Le questionnaire est l'outil de nos agences partenaires. Découvrez comment Melodia s'intègre à votre accompagnement des familles.</p>
      <div class="hero-actions" style="justify-content:center;">
        <a href="/professionnels" class="btn btn-gold btn-lg">La solution pour votre agence</a>
        <a href="/contact" class="btn btn-outline btn-lg">Prendre rendez-vous</a>
      </div>
    </div>
  </section>`
};
