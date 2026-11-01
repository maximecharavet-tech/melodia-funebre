/* ═══════════════════════════════════════════════════════════════
   LES PAGES DE REQUÊTE FUSIONNÉES

   Treize pages visaient des formulations voisines (« chanson hommage
   défunt », « chanson personnalisée défunt », « créer une chanson pour
   un défunt »…). Leur contenu était distinct, mais l'intention de
   recherche ne l'était pas : Google n'en indexait presque aucune
   (« Détectée, actuellement non indexée » dans la Search Console) et
   elles se disputaient les mêmes requêtes.

   Chaque intention a désormais UNE page pilier :
     · ce qu'est la chanson d'hommage, pour qui, à quel prix  → /chanson-hommage
     · comment elle se crée et se compose                      → /processus
     · la musique le jour des obsèques                         → /musique-obseques

   Les adresses ci-dessous sont redirigées en 301 vers leur pilier
   (vercel.json), retirées du plan du site, et ne sont plus générées.
   Leur source reste dans p-chansons.js, p-fabrication.js,
   p-ceremonie.js et p-memoire.js : c'est une matière à reprendre dans
   les piliers, pas à jeter.
   ═══════════════════════════════════════════════════════════════ */
const FUSIONS = {
  'chanson-hommage-defunt': '/chanson-hommage',
  'chanson-personnalisee-defunt': '/chanson-hommage',
  'chanson-funeraire-personnalisee': '/chanson-hommage',
  'musique-personnalisee-defunt': '/chanson-hommage',
  'hommage-musical-defunt': '/chanson-hommage',
  'chanson-dernier-hommage': '/chanson-hommage',
  'dernier-hommage-musical': '/chanson-hommage',
  'creer-chanson-pour-defunt': '/processus',
  'composer-chanson-pour-defunt': '/processus',
  'chanson-pour-obseques': '/musique-obseques',
  'hommage-musical-obseques': '/musique-obseques',
  'musique-personnalisee-obseques': '/musique-obseques',
  'musique-pour-hommage-funeraire': '/musique-obseques'
};

const fusionnee = (p) => Object.prototype.hasOwnProperty.call(FUSIONS, p.file.replace(/\.html$/, ''));

/* Un lien interne vers une adresse fusionnée coûterait une redirection
   à chaque clic et à chaque passage de robot : on le réécrit vers le
   pilier dans le HTML produit. */
function liensVersPiliers(html) {
  return html.replace(/href="\/([a-z-]+)(#[^"]*)?"/g, (m, slug, ancre) =>
    FUSIONS[slug] ? `href="${FUSIONS[slug]}"` : m);
}

module.exports = { FUSIONS, fusionnee, liensVersPiliers };
