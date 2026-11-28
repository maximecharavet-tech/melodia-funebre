/* ═══════════════════════════════════════════════════════════════
   « ALLEZ, MONTE » — la chanson d'exemple de la page papa

   La page /chanson-pour-papa-decede expliquait ce qu'est une chanson
   d'hommage pour un père sans en faire entendre une qui soit écrite
   pour ce cas : les exemples cités (Jean, Giuseppe, Bernard) sont
   chacun très particuliers. Celle-ci est un exemple, écrit pour
   aucun père en particulier — un enfant devenu grand lui parle —
   et enregistré en deux versions orchestrales, pour qu'on choisisse
   celle qui lui parle.

   Le lecteur est la platine du catalogue (assets/js/catalogue.js),
   le même disque d'or que sur /demos, réglé par trois attributs :
   ordre fixe, pas d'enchaînement, frise « deux versions ». Les
   paroles sont posées en dessous, en livret, et le texte complet
   est repris dans le JSON-LD (MusicComposition.lyrics).
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { SITE } = require('./gen.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const TITRE = 'Allez, monte';
const URL = SITE + '/chanson-pour-papa-decede';
const RACINE = path.join(__dirname, '..');

function dureeIso(fichier, repli) {
  const p = path.join(RACINE, fichier);
  if (!fs.existsSync(p)) return repli;
  try {
    const s = parseFloat(execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p
    ], { encoding: 'utf8' }));
    if (!Number.isFinite(s) || s <= 0) return repli;
    const m = Math.floor(s / 60);
    const sec = Math.round(s - m * 60);
    return 'PT' + m + 'M' + sec + 'S';
  } catch (e) {
    return repli;
  }
}

const VOIX = [
  {
    id: 'allez-monte-orchestre-1',
    who: 'Version 1',
    voix: 'version 1',
    fichier: 'audio/allez-monte-orchestre-1.mp3',
    duree: dureeIso('audio/allez-monte-orchestre-1.mp3', 'PT4M30S'),
    story: 'Une fille chante à son père, tout près ; une voix plus grave, ' +
           'plus loin, lui rend sa phrase, « allez, monte ». Orchestre de ' +
           'chambre : le piano ouvre la chanson, les cordes entrent avec ' +
           'le refrain.'
  },
  {
    id: 'allez-monte-orchestre-2',
    who: 'Version 2',
    voix: 'version 2',
    fichier: 'audio/allez-monte-orchestre-2.mp3',
    duree: dureeIso('audio/allez-monte-orchestre-2.mp3', 'PT4M30S'),
    story: 'La même chanson, une autre prise. Une fille chante à son père ; ' +
           'une voix plus grave, plus loin, lui rend sa phrase, « allez, monte ». ' +
           'Orchestre de chambre : piano, puis les cordes au refrain.'
  }
];

/* ─── Les paroles
   Une seule source : le livret, le JSON-LD et le texte complet en
   sont tirés. Les indications de voix du livret de travail ont été
   retirées : ici, seule la chanson se lit. « reprise » marque le
   deuxième refrain, identique au premier : le livret l'abrège, le
   JSON-LD le donne en entier. */
const REFRAIN = [
  'Papa, papa,',
  'Dis-le encore.',
  '« Allez, monte. »',
  'Ta main sur le volant,',
  'Et la route attendait.',
  'Papa, papa,',
  'J’ouvre la portière',
  'Et je t’attends encore.'
];
const PARTIES = [
  { k: 'couplet', nom: 'Couplet', num: 'I', strophes: [
    ['Le siège a gardé ta forme,', 'Ton manteau contre le cuir.', 'Sous tes ongles, un peu d’huile,', 'Et le froid avant le jour.'],
    ['Tu fermais ma portière', 'Sans un mot de trop.', '« Allez, monte. »', 'Trois notes entre tes dents,', 'À peine un air.']
  ] },
  { k: 'refrain', nom: 'Refrain', strophes: [REFRAIN] },
  { k: 'couplet', nom: 'Couplet', num: 'II', strophes: [
    ['Longtemps j’ai pris la route', 'Sans regarder mon côté.', 'Je parlais trop, trop vite,', 'Je me croyais bien loin.'],
    ['Un matin, sans le vouloir,', 'Tes trois notes m’ont traversé.', 'Un enfant attendait dehors,', 'J’ai ouvert, comme toi.', '« Allez, monte. »']
  ] },
  { k: 'reprise', nom: 'Refrain', strophes: [REFRAIN] },
  { k: 'pont', nom: 'Pont', note: 'presque murmuré', strophes: [
    ['Le dernier soir, près de toi,', 'Je n’avais plus un mot.', 'J’ai pris ta main seulement,', 'J’ai sifflé tes trois notes.'],
    ['Entre deux souffles,', 'J’ai entendu :', '« Allez, monte. »']
  ] },
  { k: 'final', nom: 'Dernier refrain', strophes: [[
    'Papa, papa,',
    'À mon tour.',
    '« Allez, monte. »',
    'Ma main sur le volant,',
    'Et la route peut attendre.',
    'Papa, papa,',
    'La portière est ouverte,',
    'Je t’emmène encore.'
  ]] },
  { k: 'fin', nom: 'Fin', strophes: [['Papa…', 'Le siège a encore ta forme.']] }
];

const TEXTE = PARTIES.map((p) => p.strophes.map((s) => s.join('\n')).join('\n\n')).join('\n\n');

function vers(l) {
  return esc(l)
    .replace(/« Allez, monte\.? »/g, '<em class="lv-cle">« Allez, monte. »</em>')
    .replace(/^À mon tour\.?$/, '<em class="lv-cle">À mon tour.</em>');
}

function strophe(s, depart) {
  return `<p class="lv-strophe">${s.map((l, i) =>
    `<span class="lv-v" style="--i:${depart + i}">${vers(l)}</span>`).join('')}</p>`;
}

const MANTEAU = '<svg class="lv-manteau" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">' +
  '<path d="M9 4.2c0-1 1.2-1.8 3-1.8s3 .8 3 1.8"/>' +
  '<path d="M8 4.6L12 7.2 16 4.6l3.6 3.2L17.2 21H6.8L4.4 7.8z"/>' +
  '<path d="M12 7.2V21"/>' +
  '</svg>';

function partie(p) {
  const etiquette = `<p class="lv-nom"><span>${esc(p.nom)}</span>${p.num ? ` <b>${esc(p.num)}</b>` : ''}${
    p.note ? ` <i>· ${esc(p.note)}</i>` : ''}${p.k === 'reprise' ? ' <i>· bis</i>' : ''}</p>`;
  if (p.k === 'reprise') {
    return `        <div class="lv-partie lv-refrain lv-reprise reveal">
          ${etiquette}
          <p class="lv-strophe"><span class="lv-v" style="--i:0">${vers(REFRAIN[0])}</span><span class="lv-v" style="--i:1">${vers(REFRAIN[1])} <span class="lv-etc" aria-label="et la suite du refrain">…</span></span></p>
        </div>`;
  }
  let n = 0;
  const corps = p.strophes.map((s) => { const h = strophe(s, n); n += s.length + 1; return h; }).join('\n          ');
  return `        <div class="lv-partie lv-${p.k === 'final' ? 'refrain lv-final' : p.k} reveal">
          ${etiquette}
          ${corps}${p.k === 'fin' ? '\n          ' + MANTEAU : ''}
        </div>`;
}

function ecoute() {
  const donnees = VOIX.map((v) => ({
    id: v.id, title: TITRE, who: v.who, ini: v.who.replace(/\D/g, '') || 'P', lieu: '',
    style: 'Ballade orchestrale', audio: v.fichier, story: v.story,
    lyrics: '', brief: 'orchestre · piano · cordes',
    photo: '', mention: '', categorie: 'exemple', page: ''
  }));
  const repli = VOIX.map((v) => `        <figure class="exemple-voix">
          <figcaption><em>${esc(TITRE)}</em> · ${esc(v.voix)}</figcaption>
          <audio controls preload="none" src="/${esc(v.fichier)}"></audio>
        </figure>`).join('\n');
  return `
  <section class="section-sm exemple-ecoute exemple-ecoute-papa" style="padding-top:2.6rem;">
    <div class="exemple-fond" aria-hidden="true"></div>
    <div class="wrap">
      <div class="center reveal">
        <div class="eyebrow">Une chanson d’exemple</div>
        <h2 id="ecouter" class="h-lg" style="margin-top:.8rem;">Écoutez-la,<br><em>en deux versions.</em></h2>
        <p class="lead" style="margin:1.3rem auto 0;max-width:60ch;">
          <em>${esc(TITRE)}</em> n’a été écrite pour aucun papa en particulier : c’est un
          exemple, pour entendre ce que nous composons. Un enfant devenu grand parle à son père,
          de la voiture le soir jusqu’au dernier soir, où c’est lui qui lui tient la main.
          Choisissez la version qui vous parle.
        </p>
      </div>
      <div class="catalogue exemple-platine" data-catalogue data-ordre="fixe" data-enchainer="non"
           data-frise-titre="Une même chanson, deux versions">
${repli}
      </div>
      <p class="catalogue-mention center">Paroles et musique : composé par Melodia Funèbre.
      La chanson de votre papa sera écrite pour lui seul, avec son prénom et vos souvenirs.</p>
      <p class="center" style="margin-top:1.4rem;"><a href="#paroles" class="exemple-vers-paroles">Lire les paroles
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a></p>
      <script type="application/json" id="oeuvres-data">${JSON.stringify(donnees).replace(/</g, '\\u003c')}</script>
    </div>
  </section>`;
}

function paroles(prixEssentiel) {
  const gauche = PARTIES.slice(0, 4).map(partie).join('\n');
  const droite = PARTIES.slice(4).map(partie).join('\n');
  return `
  <section class="section section-light livret-section" data-livret>
    <div class="wrap">
      <header class="livret-tete center reveal">
        <div class="eyebrow">Les paroles</div>
        <h2 id="paroles" class="h-lg" style="margin-top:.8rem;">Mot pour mot,<br><em>ce qu’il disait.</em></h2>
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
        <p>Ici, la phrase du père est « allez, monte ». Pour la vôtre, ce sera la sienne :
        celle qu’il répétait, mot pour mot, ou ce qu’il montrait sans le dire. Le texte s’écrit
        à partir de ce que vous nous racontez de lui, en cinq minutes au téléphone, et vous
        recevez sa chanson sous vingt-quatre heures${prixEssentiel ? `, dès ${esc(prixEssentiel)}` : ''}.</p>
        <div class="hero-actions" style="justify-content:center;margin-top:1.6rem;">
          <a href="/offres" class="btn btn-gold btn-lg">Faire écrire la chanson de votre papa</a>
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
  description: 'Chanson d’exemple pour un papa disparu : un enfant devenu grand parle à son père. ' +
               'Ballade orchestrale, piano et cordes, enregistrée en deux versions.',
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
