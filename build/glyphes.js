/* ═══════════════════════════════════════════════════════════════
   MELODIA — Un symbole par registre musical

   La grille des registres portait vingt noms et rien d'autre. Un mot
   se survole ; un objet s'identifie avant d'être lu. Chaque registre
   reçoit donc son emblème, tracé au même trait que les icônes du
   site — un filet, pas un pictogramme plein.

   POURQUOI DESSINÉS, ET PAS ILLUSTRÉS

   Aucune image générée, aucune photo d'instrument, aucune banque
   d'images. Ce sont des traits vectoriels : ils pèsent quelques
   centaines d'octets, restent nets à toutes les tailles, prennent la
   couleur de l'or par « currentColor », et se gravent. C'est la même
   règle que pour le sceau du QR — ce que la maison ne sait pas
   dessiner, elle ne le prétend pas.

   LE PARTI PRIS

   L'instrument quand il est reconnaissable en huit traits — un
   clavier, un accordéon, une harpe, un tambour. Un signe quand il ne
   l'est pas : la polyphonie corse n'a pas d'instrument, elle a une
   montagne ; le reggae n'en a pas non plus, il a un soleil.

   Deux registres ne doivent jamais porter le même emblème : c'est la
   seule règle dure, et scripts/check.js la fait respecter.

   LA MAIN COURANTE

   Le glyphe est cherché par le nom exact du registre, puis par un
   repli à la note de musique. Un registre inventé demain en console
   n'aura donc pas d'emblème choisi, mais il en aura un — plutôt
   qu'une carte trouée.
   ═══════════════════════════════════════════════════════════════ */

/* Tous les tracés vivent dans une boîte de 24 × 24, au trait de 1,5 —
   celui des icônes du site, pour que rien ne jure à côté. */
const T = (d) => '<path d="' + d + '"/>';
const C = (cx, cy, r) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>';

const GLYPHES = {
  /* ─── Les claviers ─── */
  'Piano classique':
    '<rect x="3" y="6" width="18" height="12" rx="1"/>' +
    T('M8 6v7M12 6v7M16 6v7') +
    '<rect x="6" y="6" width="2" height="5" fill="currentColor" stroke="none"/>' +
    '<rect x="14" y="6" width="2" height="5" fill="currentColor" stroke="none"/>',

  /* L'accordéon : deux flasques et le soufflet entre elles. */
  'Musette':
    '<rect x="2.5" y="5" width="4" height="14" rx="1"/>' +
    '<rect x="17.5" y="5" width="4" height="14" rx="1"/>' +
    T('M6.5 7l11-1.4M6.5 10l11-1.4M6.5 13l11-1.4M6.5 16l11-1.4M6.5 19l11-1.4'),

  /* ─── Les cordes ─── */
  'Folk acoustique':   /* la guitare. Le corps est fait de deux cercles qui
                          se chevauchent — c'est la façon la plus courte de
                          dessiner une taille, et elle la distingue du banjo
                          rond de l'americana. */
    C(9.5, 16, 4.2) + C(11.5, 10.4, 3.2) + C(10.4, 13.6, 1.3) +
    T('M13.4 8.2L19.2 3M17.8 1.8l2.6 2.6'),

  'Rock':              /* l'ampli. Une guitare stylisée se lisait « stylo » :
                          l'objet qui dit le rock sans hésitation, c'est lui */
    '<rect x="3" y="4" width="18" height="16" rx="1.5"/>' +
    C(12, 13, 4) + C(12, 13, 1.2) +
    T('M6 7h5') + C(17, 7, 1),

  'Ballade rock':   /* le médiator : le geste plutôt que l'instrument */
    T('M12 3c4 0 7 2 7 5 0 4-4 9-7 13-3-4-7-9-7-13 0-3 3-5 7-5z') + T('M9 8h6'),

  'Celtique':       /* la harpe */
    T('M6 20V7c0-2 2-3 4-3s4 1 4 3v13') + T('M18 4c0 7-3 12-8 16') +
    T('M9 7v10M12 6v11M15 6v10'),

  'Soul jazz':      /* le saxophone */
    T('M12 4v7c0 4-3 6-3 8 0 2 2 3 4 3 3 0 5-2 5-5') + T('M18 17l3 2-2 2-2-2') +
    C(12, 3.4, 1.2) + C(11, 9, 0.9) + C(11, 12, 0.9),

  'Country americana':  /* le banjo : le corps rond barré d'un chevalet */
    C(8, 16, 5.4) + T('M4 16h8') + T('M11.6 12.4L19 5M17.5 3.5l2.8 2.8') + T('M6 16v1.5M10 16v1.5'),

  /* ─── Les vents ─── */
  'Jazz doux':      /* la contrebasse. Deux trompettes ont été essayées et
                       jetées : à cette taille, le pavillon se lit « flèche »,
                       puis « poisson ». Le grand corps et le long manche, eux,
                       ne se confondent avec rien. */
    T('M12 22c-3 0-5-2-5-4.5S9 13 12 13s5 2 5 4.5S15 22 12 22z') +
    T('M12 13V4') + T('M12 4c0-1.2 1-2 2-2s2 .8 2 2c0 1-.8 1.6-1.6 1.4') +
    T('M9.5 5.5h5M9.8 8h4.4') +
    T('M9.6 16.4c.5.6.5 1.8 0 2.6M14.4 16.4c-.5.6-.5 1.8 0 2.6'),

  'Klezmer':        /* la clarinette */
    T('M11 3h2v13l3 5H8l3-5z') + T('M11 7h2M11 10h2M11 13h2'),

  /* ─── Les peaux ─── */
  'Bélé antillais': /* le tambour, et ses tirants */
    T('M5 7h14l-2 12H7z') + '<ellipse cx="12" cy="7" rx="7" ry="2.2"/>' +
    T('M8 9l-1 8M12 9v9M16 9l1 8'),

  /* ─── Les voix et les lieux ─── */
  'Gospel':         /* l\'arc d\'un vitrail, et la lumière qui en sort */
    T('M7 21V11a5 5 0 0110 0v10z') + T('M12 6V3M6 8L4 6M18 8l2-2') + T('M10 21v-5a2 2 0 014 0v5'),

  'Polyphonie corse':  /* la montagne : trois voix, trois crêtes */
    T('M2 19l6-9 4 5 3-4 7 8z') + T('M8 10l1.5 2.2'),

  'Chanson française': /* le micro de studio, sur sa suspension */
    '<rect x="9" y="3" width="6" height="10" rx="3"/>' +
    T('M6 11a6 6 0 0012 0') + T('M12 17v4M9 21h6'),

  'Variété douce':  /* une note, portée par une courbe douce */
    C(8, 17, 2.6) + T('M10.6 17V6l8-2v10') + C(17.2, 14, 2.4),

  'R&B':            /* le cœur et la note : la soul, sans instrument */
    T('M20 7.5a3.5 3.5 0 00-6-2.4L12 7l-2-1.9A3.5 3.5 0 004 7.5c0 3 3.5 6 8 9.5') +
    T('M16 19v-5l4-1v5') + C(15, 19, 1.4) + C(19, 18, 1.4),

  /* ─── Les signes ─── */
  'Reggae':         /* le soleil */
    C(12, 12, 4) + T('M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2'),

  'Bossa nova':     /* la vague, et la note qu\'elle porte */
    T('M2 15c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1') + T('M12 11V4l6-1.5v7') + C(10.4, 11, 1.6),

  'Musique du monde':  /* le globe */
    C(12, 12, 9) + '<ellipse cx="12" cy="12" rx="4" ry="9"/>' + T('M3 9h18M3 15h18'),

  'Funk':           /* l\'égaliseur : le groove se voit mieux qu\'il ne se dessine */
    T('M4 14v6M8 8v12M12 3v17M16 10v10M20 6v14')
};

/* Le repli : une note. Un registre ajouté demain n'aura pas d'emblème
   choisi, mais la carte ne sera pas trouée pour autant. */
const REPLI = C(8, 17, 2.6) + T('M10.6 17V5l8-2v12') + C(17.2, 15, 2.6);

/* « pathLength="1" » normalise la longueur de chaque tracé : sans lui,
   un cercle de 30 unités et une ligne de 4 ne se dessineraient pas à la
   même vitesse, et l'animation partirait en désordre. Avec lui, une
   seule règle CSS anime les vingt emblèmes.

   Les formes pleines — les touches noires du piano — en sont exclues :
   on ne « trace » pas un aplat, on le montre. */
function normaliser(d) {
  return d.replace(/<(path|circle|rect|ellipse)(?![^>]*stroke="none")/g, '<$1 pathLength="1"');
}

function glyphe(registre) {
  const d = GLYPHES[registre] || REPLI;
  return '<svg class="registre-glyphe" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    normaliser(d) + '</svg>';
}

module.exports = { glyphe, GLYPHES, REPLI };
