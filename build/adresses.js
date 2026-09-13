/* ═══════════════════════════════════════════════════════════════
   MELODIA — L'adresse d'un hommage

   Un seul endroit décide de l'adresse d'une œuvre. Le catalogue y
   renvoie, la page d'écoute la porte, les images d'aperçu en prennent
   le nom : si deux fichiers calculaient chacun leur version, le
   premier lien cassé ne se verrait qu'une fois publié.
   ═══════════════════════════════════════════════════════════════ */

/* « Jusqu'au jour où l'on se retrouve » → « jusqu-au-jour-ou-l-on-se-retrouve » */
function limace(texte) {
  /* « œ » et « æ » ne se décomposent pas : la normalisation les laisse
     intacts, puis le filtre les efface. « Le rocker au cœur d'or »
     donnait « le-rocker-au-c-ur-d-or ». On les transcrit d'abord. */
  return String(texte || '')
    .replace(/œ/g, 'oe').replace(/Œ/g, 'OE')
    .replace(/æ/g, 'ae').replace(/Æ/g, 'AE')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'hommage';
}

/* Deux œuvres peuvent porter un titre proche. Une adresse qui en
   écraserait une autre ferait disparaître une page sans rien dire :
   on numérote plutôt. */
function adresses(liste) {
  const vues = {};
  return (liste || []).map((t) => {
    let l = limace(t && t.title);
    if (vues[l]) { vues[l]++; l = l + '-' + vues[l]; } else { vues[l] = 1; }
    return l;
  });
}

module.exports = { limace, adresses };
