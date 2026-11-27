/* ═══════════════════════════════════════════════════════════════
   « MAMAN, ÇA VA ALLER » — la chanson d'exemple de la page maman

   La page /chanson-pour-maman-decedee expliquait ce qu'est une
   chanson d'hommage pour une mère sans en faire entendre une seule
   qui soit écrite pour ce cas : les trois hommages cités sont ceux
   d'Odette, Monique et Yvette, chacun très particulier. Celle-ci est
   un exemple, écrit pour aucune mère en particulier — un enfant
   devenu grand parle à la sienne — et enregistré en deux voix, une
   fille et un fils, pour qu'on choisisse celle qui lui parle.

   Le lecteur est la platine du catalogue (assets/js/catalogue.js),
   le même disque d'or que sur /demos, réglé par trois attributs :
   ordre fixe, pas d'enchaînement, frise « deux voix ». Les paroles
   sont posées en dessous, en livret, et le texte complet est repris
   dans le JSON-LD (MusicComposition.lyrics).
   ═══════════════════════════════════════════════════════════════ */
const { SITE } = require('./gen.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const TITRE = 'Maman, ça va aller';
const URL = SITE + '/chanson-pour-maman-decedee';

const VOIX = [
  {
    id: 'maman-ca-va-aller-femme',
    who: 'Voix de femme',
    voix: 'voix de femme',
    fichier: 'audio/maman-ca-va-aller-voix-de-femme.mp3',
    duree: 'PT4M2S',
    story: 'Une fille chante à sa mère, tout près, comme seule au piano. ' +
           'Le piano ouvre la chanson ; la guitare, le violoncelle et le ' +
           'quatuor à cordes entrent avec le premier refrain.'
  },
  {
    id: 'maman-ca-va-aller-homme',
    who: 'Voix d’homme',
    voix: 'voix d’homme',
    fichier: 'audio/maman-ca-va-aller-voix-d-homme.mp3',
    duree: 'PT3M48S',
    story: 'Un fils chante à sa mère, d’une voix grave, presque parlée sur ' +
           'les couplets. Le piano ouvre la chanson ; la guitare, le ' +
           'violoncelle et le quatuor à cordes entrent avec le premier refrain.'
  }
];

/* ─── Les paroles ───
   Une seule source : le livret, le JSON-LD et le texte complet en
   sont tirés. « reprise » marque le deuxième refrain, identique au
   premier : le livret l'abrège, le JSON-LD le donne en entier. */
const REFRAIN = [
  'Maman, maman,',
  'Redis-moi « ça va aller »,',
  'Ta main sur mon front,',
  'Et la nuit pouvait passer.',
  'Maman, maman,',
  'Je n’ai pas appris',
  'À vivre sans t’appeler.'
];
const PARTIES = [
  { k: 'couplet', nom: 'Couplet', num: 'I', strophes: [
    ['Maman, tes bras le soir,', 'C’était toute ma maison.', 'Tu chantais à mi-voix', 'Toujours la même chanson.'],
    ['Tes mains sentaient le savon,', 'Le café, le pain grillé.', 'Tu disais « dors, mon tout-petit,', 'Demain tout sera passé. »']
  ] },
  { k: 'refrain', nom: 'Refrain', strophes: [REFRAIN] },
  { k: 'couplet', nom: 'Couplet', num: 'II', strophes: [
    ['Tu me disais « couvre-toi »,', '« Mange un peu », « appelle-moi ».', 'Je riais, je partais,', 'Je ne me retournais pas.'],
    ['Un jour, devant mes enfants,', 'Ta voix est sortie de moi :', 'Les mêmes mots, la même chanson,', 'Le soir, à mi-voix.']
  ] },
  { k: 'reprise', nom: 'Refrain', strophes: [REFRAIN] },
  { k: 'pont', nom: 'Pont', note: 'presque murmuré', strophes: [
    ['Le dernier soir, c’est moi', 'Qui ai pris ta main.', 'J’ai chanté tout bas', 'Ta vieille chanson à toi.'],
    ['Tu as souri, je crois…', 'Et tu t’es endormie', 'Comme je m’endormais', 'Autrefois dans tes bras.']
  ] },
  { k: 'final', nom: 'Dernier refrain', strophes: [[
    'Maman, maman,',
    'À mon tour, « ça va aller »,',
    'Ma main sur ton front,',
    'Et la nuit peut passer.',
    'Maman, maman,',
    'Je n’ai pas appris',
    'À vivre sans t’appeler…',
    'Alors je t’appelle encore.'
  ]] },
  { k: 'fin', nom: 'Fin', strophes: [['Maman…', 'Je laisse la lampe allumée.']] }
];

/* Le texte intégral, strophes séparées d'une ligne vide. */
const TEXTE = PARTIES.map((p) => p.strophes.map((s) => s.join('\n')).join('\n\n')).join('\n\n');

/* Les mots qui portent la chanson, soulignés d'or : la phrase de la
   mère, et le moment où l'enfant la lui rend. */
function vers(l) {
  return esc(l)
    .replace(/« ça va aller »/g, '<em class="lv-cle">« ça va aller »</em>')
    .replace(/^À mon tour/, '<em class="lv-cle">À mon tour</em>');
}

function strophe(s, depart) {
  return `<p class="lv-strophe">${s.map((l, i) =>
    `<span class="lv-v" style="--i:${depart + i}">${vers(l)}</span>`).join('')}</p>`;
}

const LAMPE = '<svg class="lv-lampe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">' +
  '<path d="M12 3.2c1.9 2.3 2.9 4 2.9 5.5a2.9 2.9 0 0 1-5.8 0c0-1.5 1-3.2 2.9-5.5z"/>' +
  '<path d="M9.2 13.6h5.6l-.8 6.2h-4z"/><path d="M8 20.8h8"/></svg>';

function partie(p) {
  const etiquette = `<p class="lv-nom"><span>${esc(p.nom)}</span>${p.num ? ` <b>${p.num}</b>` : ''}${
    p.note ? ` <i>· ${esc(p.note)}</i>` : ''}${p.k === 'reprise' ? ' <i>· bis</i>' : ''}</p>`;
  if (p.k === 'reprise') {
    /* Le deuxième refrain est le premier : deux vers suffisent à le
       reconnaître, et le livret ne s'allonge pas de sept lignes déjà lues. */
    return `        <div class="lv-partie lv-refrain lv-reprise reveal">
          ${etiquette}
          <p class="lv-strophe"><span class="lv-v" style="--i:0">${vers(REFRAIN[0])}</span><span class="lv-v" style="--i:1">${vers(REFRAIN[1])} <span class="lv-etc" aria-label="et la suite du refrain">…</span></span></p>
        </div>`;
  }
  let n = 0;
  const corps = p.strophes.map((s) => { const h = strophe(s, n); n += s.length + 1; return h; }).join('\n          ');
  return `        <div class="lv-partie lv-${p.k === 'final' ? 'refrain lv-final' : p.k} reveal">
          ${etiquette}
          ${corps}${p.k === 'fin' ? '\n          ' + LAMPE : ''}
        </div>`;
}

/* ─── Le lecteur ─── */
function ecoute() {
  const donnees = VOIX.map((v) => ({
    id: v.id, title: TITRE, who: v.who, ini: 'M', lieu: '',
    style: 'Valse lente', audio: v.fichier, story: v.story,
    lyrics: '', brief: 'piano · guitare classique · violoncelle · quatuor à cordes',
    photo: '', mention: '', categorie: 'exemple', page: ''
  }));
  /* Sans JavaScript, deux lecteurs simples : la page reste écoutable.
     catalogue.js les remplace par la platine dès qu'il s'exécute. */
  const repli = VOIX.map((v) => `        <figure class="exemple-voix">
          <figcaption><em>${esc(TITRE)}</em> · ${esc(v.voix)}</figcaption>
          <audio controls preload="none" src="/${esc(v.fichier)}"></audio>
        </figure>`).join('\n');
  return `
  <section class="section-sm exemple-ecoute" style="padding-top:2.6rem;">
    <div class="wrap">
      <div class="center reveal">
        <div class="eyebrow">Une chanson d’exemple</div>
        <h2 id="ecouter" class="h-lg" style="margin-top:.8rem;">Écoutez-la,<br><em>en deux voix.</em></h2>
        <p class="lead" style="margin:1.3rem auto 0;max-width:60ch;">
          <em>${esc(TITRE)}</em> n’a été écrite pour aucune maman en particulier : c’est un
          exemple, pour entendre ce que nous composons. Un enfant devenu grand parle à sa mère,
          de ses bras le soir jusqu’au dernier soir, où c’est lui qui lui tient la main.
          Choisissez la voix : celle d’une fille, ou celle d’un fils.
        </p>
      </div>
      <div class="catalogue exemple-platine" data-catalogue data-ordre="fixe" data-enchainer="non"
           data-frise-titre="Une même chanson, deux voix">
${repli}
      </div>
      <p class="catalogue-mention center">Paroles et musique : composé par Melodia Funèbre.
      La chanson de votre maman sera écrite pour elle seule, avec son prénom et vos souvenirs.</p>
      <p class="center" style="margin-top:1.4rem;"><a href="#paroles" class="exemple-vers-paroles">Lire les paroles
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a></p>
      <script type="application/json" id="oeuvres-data">${JSON.stringify(donnees).replace(/</g, '\\u003c')}</script>
    </div>
  </section>`;
}

/* ─── Le livret ─── */
function paroles(prixEssentiel) {
  const gauche = PARTIES.slice(0, 4).map(partie).join('\n');
  const droite = PARTIES.slice(4).map(partie).join('\n');
  return `
  <section class="section section-light livret-section" data-livret>
    <div class="wrap">
      <header class="livret-tete center reveal">
        <div class="eyebrow">Les paroles</div>
        <h2 id="paroles" class="h-lg" style="margin-top:.8rem;">Mot pour mot,<br><em>ce qu’elle disait.</em></h2>
        <p class="livret-titre"><em>${esc(TITRE)}</em></p>
        <p class="livret-credit">Paroles et musique · composé par Melodia Funèbre</p>
        <p class="livret-ecoute" data-livret-ecoute aria-live="polite" hidden></p>
      </header>

      <div class="livret">
        <div class="livret-page">
${gauche}
        </div>
        <div class="livret-pli" aria-hidden="true"></div>
        <div class="livret-page">
${droite}
        </div>
      </div>

      <footer class="livret-pied reveal">
        <p>Ici, la phrase de la mère est « ça va aller ». Pour la vôtre, ce sera la sienne :
        celle qu’elle répétait, mot pour mot. Le texte s’écrit à partir de ce que vous nous
        racontez d’elle, en cinq minutes au téléphone, et vous recevez sa chanson sous
        vingt-quatre heures${prixEssentiel ? `, dès ${esc(prixEssentiel)}` : ''}.</p>
        <div class="hero-actions" style="justify-content:center;margin-top:1.6rem;">
          <a href="/offres" class="btn btn-gold btn-lg">Faire écrire la chanson de votre maman</a>
          <a href="/telechargements" class="btn btn-outline btn-lg">Le questionnaire à remplir</a>
        </div>
      </footer>
    </div>
  </section>`;
}

const jsonld = {
  '@context': 'https://schema.org',
  '@type': 'MusicComposition',
  '@id': URL + '#chanson-exemple',
  name: TITRE,
  description: 'Chanson d’exemple pour une maman disparue : un enfant devenu grand parle à sa mère. ' +
               'Ballade de chambre en valse lente, piano, guitare classique, violoncelle et quatuor à cordes, ' +
               'enregistrée en deux voix.',
  inLanguage: 'fr-FR',
  composer: { '@id': SITE + '/#organisation' },
  lyricist: { '@id': SITE + '/#organisation' },
  isFamilyFriendly: true,
  url: URL + '#ecouter',
  lyrics: { '@type': 'CreativeWork', inLanguage: 'fr-FR', text: TEXTE },
  recordedAs: VOIX.map((v) => ({
    '@type': 'MusicRecording',
    '@id': URL + '#' + v.id,
    name: TITRE + ' (' + v.voix + ')',
    duration: v.duree,
    inLanguage: 'fr-FR',
    byArtist: { '@id': SITE + '/#organisation' },
    audio: { '@type': 'AudioObject', contentUrl: SITE + '/' + v.fichier, encodingFormat: 'audio/mpeg', duration: v.duree }
  }))
};

const metas = [
  `<meta property="og:audio" content="${SITE}/${VOIX[0].fichier}">`,
  '<meta property="og:audio:type" content="audio/mpeg">'
].join('\n');

module.exports = { ecoute, paroles, jsonld, metas, VOIX, TEXTE };
