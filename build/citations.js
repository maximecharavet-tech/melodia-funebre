/* ═══════════════════════════════════════════════════════════════
   CITER LE CATALOGUE

   Les pages de requête s'appuient sur des œuvres réelles plutôt que
   sur des exemples inventés : c'est ce qui les rend impossibles à
   recopier, et c'est la seule preuve qui vaille — on peut cliquer et
   écouter.

   Deux précautions, apprises à leurs dépens :

     · LES APOSTROPHES. Le catalogue écrit « Vers l'île d'Ys » avec
       l'apostrophe droite, les textes rédigés ici avec la courbe.
       Comparés tels quels, trois titres sur quatre restaient
       introuvables et les exemples disparaissaient en silence.

     · LE RETRAIT D'UNE ŒUVRE. Le fondateur peut masquer une démo
       depuis sa console. Si une page la citait, la génération ne doit
       pas s'interrompre — sinon un simple retrait de démo bloquerait
       une mise en ligne. L'exemple disparaît proprement, et la
       génération le signale à l'écran.
   ═══════════════════════════════════════════════════════════════ */

const { TRACKS } = require('./data.js');
const { adresses } = require('./adresses.js');

const esc = (x) => String(x == null ? '' : x)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const memeTitre = (a, b) =>
  String(a).replace(/[’‘`´]/g, "'").toLowerCase().trim() ===
  String(b).replace(/[’‘`´]/g, "'").toLowerCase().trim();

function oeuvre(titre, ou) {
  const t = TRACKS.find((x) => memeTitre(x.title, titre));
  if (!t) {
    console.warn('  ! ' + (ou || 'page de requête') + ' : « ' + titre +
      ' » n’est plus au catalogue, exemple omis');
    return null;
  }
  return t;
}

const lien = (t) => '/ecouter/' + adresses(TRACKS)[TRACKS.indexOf(t)];

function vers(t, n) {
  if (!t || !t.lyrics) return '';
  return t.lyrics.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, n || 2)
    .map(esc).join('<br>');
}

/* Un encart d'exemple : le vers, puis d'où il vient. Vide si l'œuvre
   a disparu — jamais de cadre creux sur la page. */
function extrait(titre, legende, ou) {
  const t = oeuvre(titre, ou);
  if (!t) return '';
  return `        <figure class="req-extrait reveal">
          <blockquote>${vers(t, 2)}</blockquote>
          <figcaption>${esc(legende)} — <a href="${lien(t)}"><em>${esc(t.title)}</em></a>, pour ${esc(t.who)}</figcaption>
        </figure>`;
}

module.exports = { esc, memeTitre, oeuvre, lien, vers, extrait };
