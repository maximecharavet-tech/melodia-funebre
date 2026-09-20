/* ═══════════════════════════════════════════════════════════════
   MELODIA — Une page par hommage

   Jusqu'ici, les dix-huit œuvres vivaient sur une seule page. Un lien
   posté sur Facebook menait donc au catalogue entier, avec la vignette
   générique du site : personne ne savait ce qu'il allait entendre, et
   personne ne cliquait.

   Chaque hommage a maintenant son adresse — /ecouter/<titre> — sa
   propre vignette d'aperçu, son balisage MusicRecording, et de quoi
   l'écouter en trois secondes sans rien chercher. C'est ce qu'on
   partage.

   Dix-huit pages, pas trois cents : chacune porte une œuvre réelle,
   son récit, ses paroles et les mots de sa famille. Ce n'est pas du
   remplissage pour moteur de recherche, c'est le catalogue déplié.
   ═══════════════════════════════════════════════════════════════ */
const { ICON, SITE } = require('./gen.js');
const { TRACKS } = require('./data.js');
const P = require('./parts.js');
/* Les vingt illustrations de registre existaient déjà, dessinées pour
   le catalogue, et ne servaient qu'à lui. Les pages d'écoute —
   vingt et une — n'avaient, elles, aucune image : un titre, un
   lecteur audio, trois blocs de texte. Chacune reçoit donc le dessin
   de SON registre : un piano à queue pour « Piano classique », un
   banjo pour « Country americana ». Vingt et une pages illustrées,
   toutes différentes, et pas un octet d'image — c'est du vectoriel.
   « mots » est renommé à l'import : le gabarit a déjà une variable de
   ce nom, qui porte les mots de la famille. */
const { illustration, mots: motsRegistre, DEFS } = require('./instruments.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const { limace, adresses } = require('./adresses.js');

/* Le titre de l'onglet et du résultat de recherche. Google en affiche
   une soixantaine de caractères : au-delà, il coupe lui-même, et une
   coupure au milieu du nom de la maison fait négligé. */
function titre(t) {
  const complet = `${t.title} — hommage musical | Melodia Funèbre`;
  return complet.length <= 62 ? complet : `${t.title} | Melodia Funèbre`;
}

/* La durée n'est pas connue à la génération : elle est lue par le
   navigateur. Le gabarit laisse la place, catalogue.js la remplit. */
function corps(t, slug, voisines) {
  const initiale = (t.who || t.title || '♪').trim().charAt(0).toUpperCase();
  const mots = String(t.brief || '').split('·').map((m) => m.trim()).filter(Boolean);
  const url = SITE + '/ecouter/' + slug;

  return `
  <article class="section ec-page" style="padding-top:8rem;">
    <div class="wrap wrap-tight">
${DEFS}

      <nav class="ec-fil" aria-label="Fil d'Ariane">
        <a href="/demos">Nos réalisations</a>
        <span aria-hidden="true">·</span>
        <span>${esc(t.title)}</span>
      </nav>

      <header class="ec-tete reveal in">
        ${t.photo
          ? `<div class="ec-sceau ec-sceau-photo" aria-hidden="true"><img src="${esc(t.photo)}" alt="" width="120" height="120" decoding="async"><span>${esc(initiale)}</span></div>`
          : `<div class="ec-sceau" aria-hidden="true"><span>${esc(initiale)}</span></div>`}
        <div class="ec-style">${esc(t.style)}${t.lieu ? ' · ' + esc(t.lieu) : ''}</div>
        <h1 class="ec-titre"><em>${esc(t.title)}</em></h1>
        <p class="ec-qui">Composé pour ${esc(t.who)}</p>
      </header>

      <div class="ec-ecoute reveal in reveal-d1">
        <audio controls preload="metadata" src="/${esc(t.file)}" aria-label="Écouter ${esc(t.title)}"></audio>
        <p class="ec-note">Œuvre originale, écrite pour une seule personne. Aucun droit SACEM à régler.</p>
      </div>

      <div class="ec-partage reveal in reveal-d2"
           data-partage
           data-titre="${esc(t.title)}"
           data-texte="${esc('« ' + t.title + ' » — un hommage musical composé pour ' + t.who + '. Écoutez-le :')}"
           data-url="${esc(url)}"></div>

      <section class="ec-recit reveal">
        <h2 class="ec-h2">Son histoire</h2>
        <p>${esc(t.story)}</p>
        ${mots.length ? `<div class="ec-mots"><span class="mono">Les mots de la famille</span>${
          mots.map((m) => `<span class="ec-mot">${esc(m)}</span>`).join('')}</div>` : ''}
      </section>

      <figure class="ec-registre reveal">
        <div class="reg-cadre">${illustration(t.style)}</div>
        <figcaption>
          <span class="ec-reg-nom">${esc(t.style)}</span>${(() => {
            const m = motsRegistre(t.style);
            return m ? `<span class="ec-reg-mots">${esc(m[0])} &middot; ${esc(m[1])}</span>` : '';
          })()}
        </figcaption>
      </figure>

      ${t.lyrics ? `<section class="ec-vers reveal">
        <h2 class="ec-h2">Un extrait des paroles</h2>
        <blockquote>${esc(t.lyrics).replace(/\n/g, '<br>')}</blockquote>
      </section>` : ''}

      <section class="ec-appel reveal">
        <h2 class="ec-h2">Pour votre proche</h2>
        <p>Une chanson écrite à partir de ce que vous nous raconterez de lui :
        son prénom, trois traits de caractère, un métier ou une passion, une habitude.
        Livrée sous vingt-quatre heures, diffusable en cérémonie, à vous pour toujours.</p>
        <div class="ec-actions">
          <a href="/offres" class="btn btn-gold btn-lg">Faire composer un hommage</a>
          <a href="/demos" class="btn btn-outline btn-lg">Écouter les autres</a>
        </div>
      </section>

      ${voisines.length ? `<section class="ec-voisines reveal">
        <h2 class="ec-h2">À écouter aussi</h2>
        <ul>${voisines.map((v) => `<li><a href="/ecouter/${esc(v.slug)}">
          <span class="ec-v-style">${esc(v.style)}</span>
          <span class="ec-v-titre">${esc(v.title)}</span>
          <span class="ec-v-qui">Pour ${esc(v.who)}</span>
        </a></li>`).join('')}</ul>
      </section>` : ''}

      <p class="catalogue-mention center" style="margin-top:3rem;">Chaque œuvre a bien été composée
      pour une personne. Les prénoms et les récits qui les accompagnent ont été modifiés :
      nous ne publions jamais l’histoire d’une famille.</p>

    </div>
  </article>`;
}

/* ─── Les pages ─── */
module.exports = (function () {
  const liste = TRACKS;
  const slugs = adresses(liste);

  return liste.map((t, i) => {
    const slug = slugs[i];
    /* Trois voisines, prises en tournant : un lien de fin de page vers
       toujours les mêmes trois œuvres enfermerait le visiteur. */
    const voisines = [1, 2, 3]
      .map((d) => liste[(i + d) % liste.length])
      .filter((v, k) => v && v !== t)
      .map((v) => ({ title: v.title, who: v.who, style: v.style, slug: slugs[liste.indexOf(v)] }));

    const desc = (t.story || '').replace(/\s+/g, ' ').trim().slice(0, 155) ||
      `Un hommage musical en ${t.style.toLowerCase()}, composé pour ${t.who}.`;

    return {
      file: 'ecouter-' + slug + '.html',
      url: '/ecouter/' + slug,
      /* Un titre tronqué au couteau donnait « … | Melodi ». On choisit
         la forme qui tient plutôt que de couper : la marque en entier
         vaut mieux qu'une précision de registre à moitié affichée. */
      title: titre(t),
      desc: desc,
      ogType: 'music.song',
      image: '/assets/img/partage/' + slug + '.jpg',
      imageAlt: `${t.title} — hommage musical composé pour ${t.who}`,
      /* og:audio permet à Facebook de proposer l'écoute dans l'aperçu.
         Tous les réseaux ne l'honorent pas ; ceux qui le font offrent
         une écoute sans quitter le fil, et c'est là que se joue la
         démonstration de qualité. */
      metas: [
        `<meta property="og:audio" content="${SITE}/${t.file}">`,
        '<meta property="og:audio:type" content="audio/mpeg">',
        `<meta property="music:musician" content="${SITE}/#organisation">`
      ].join('\n'),
      scripts: ['assets/js/partage.js'],
      jsonld: [
        P.jsonldFil(t.title, '/ecouter/' + slug),
        {
          '@context': 'https://schema.org',
          '@type': 'MusicRecording',
          '@id': SITE + '/ecouter/' + slug + '#oeuvre',
          name: t.title,
          description: t.story,
          genre: t.style,
          inLanguage: 'fr-FR',
          byArtist: { '@id': SITE + '/#organisation' },
          audio: { '@type': 'AudioObject', contentUrl: SITE + '/' + t.file, encodingFormat: 'audio/mpeg' },
          isFamilyFriendly: true,
          url: SITE + '/ecouter/' + slug
        }
      ],
      body: corps(t, slug, voisines)
    };
  });
})();
