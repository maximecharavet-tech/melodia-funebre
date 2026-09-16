/* ═══════════════════════════════════════════════════════════════
   MELODIA — Les instruments, dessinés

   Les emblèmes précédents étaient des pictogrammes de 24 pixels : un
   filet, huit traits, et rien à regarder. À côté d'un site qui joue
   de l'or et du velours, ils faisaient pauvres — et la grille de
   vingt cartes qu'ils remplissaient mangeait un écran entier.

   Ici, chaque registre reçoit une VRAIE illustration : un objet
   dessiné dans une boîte de 180 × 180, avec du volume, de la matière,
   des reflets et de la gravure. Un piano à queue vu de dessus avec
   ses cordes, un accordéon et son soufflet plissé, une harpe dont les
   cordes sont calculées le long de la console, un banjo cerclé de ses
   tirants, une trompette avec ses trois pistons.

   POURQUOI DESSINÉ, ET PAS PHOTOGRAPHIÉ

   Pas de banque d'images, pas de photo d'instrument sous licence
   incertaine, pas d'image générée. Du vectoriel : quelques kilo-octets,
   net à toutes les tailles, aux couleurs de la maison, et qui ne
   ressemblera jamais au stock d'un concurrent.

   LA MATIÈRE

   Cinq dégradés partagés — l'or vertical, l'or de biais, l'ombre, le
   bois, la nacre — déclarés UNE fois par page et référencés par tous
   les dessins. Vingt illustrations ne coûtent donc pas vingt jeux de
   dégradés.

   LA GÉOMÉTRIE RÉPÉTITIVE EST CALCULÉE

   Les cordes de la harpe, les tirants du banjo, les rayons du soleil,
   le laçage du tambour, les barbes de la plume : tout ce qui se répète
   régulièrement est produit par une boucle, jamais recopié à la main.
   C'est plus court, et c'est surtout exact.
   ═══════════════════════════════════════════════════════════════ */

/* ─── La matière ─── */
const OR = 'url(#ins-or)';        /* l'or vertical : les corps */
const ORH = 'url(#ins-orh)';      /* l'or de biais : les faces éclairées */
const OMBRE = 'url(#ins-ombre)';  /* le creux : ouïes, grilles, pavillons */
const BOIS = 'url(#ins-bois)';    /* le bois : manches, fûts */
const NACRE = 'url(#ins-nacre)';  /* la nacre froide : touches de piano, lune */
const IVOIRE = 'url(#ins-ivoire)'; /* l'ivoire chaud : les peaux tendues */
const TR = '#1d1709';             /* le trait gravé */

/* Les dégradés, déclarés une seule fois par page. */
const DEFS = `<svg class="ins-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
<linearGradient id="ins-or" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#fff6dc"/><stop offset=".11" stop-color="#e6cd85"/>
<stop offset=".27" stop-color="#ab8a3e"/><stop offset=".42" stop-color="#6b5525"/>
<stop offset=".57" stop-color="#c7a64b"/><stop offset=".71" stop-color="#f2dfa8"/>
<stop offset=".86" stop-color="#9b7e37"/><stop offset="1" stop-color="#4b3c1b"/></linearGradient>
<linearGradient id="ins-orh" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#fffaec"/><stop offset=".17" stop-color="#eed898"/>
<stop offset=".37" stop-color="#b19040"/><stop offset=".54" stop-color="#78602a"/>
<stop offset=".71" stop-color="#dcc06c"/><stop offset=".87" stop-color="#f6e6b6"/>
<stop offset="1" stop-color="#877030"/></linearGradient>
<linearGradient id="ins-ombre" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#312817"/><stop offset=".5" stop-color="#171308"/>
<stop offset="1" stop-color="#0a0905"/></linearGradient>
<linearGradient id="ins-bois" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#b58447"/><stop offset=".22" stop-color="#7a5a29"/>
<stop offset=".5" stop-color="#412f13"/><stop offset=".78" stop-color="#83612d"/>
<stop offset="1" stop-color="#2a1d0b"/></linearGradient>
<linearGradient id="ins-nacre" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#fffdf6"/><stop offset=".38" stop-color="#eae3d0"/>
<stop offset=".72" stop-color="#c2baa3"/><stop offset="1" stop-color="#8f8874"/></linearGradient>
<radialGradient id="ins-lueur"><stop offset="0" stop-color="rgba(224,186,104,.34)"/>
<stop offset=".42" stop-color="rgba(201,168,76,.13)"/>
<stop offset="1" stop-color="rgba(201,168,76,0)"/></radialGradient>
<radialGradient id="ins-sol"><stop offset="0" stop-color="rgba(232,204,140,.42)"/>
<stop offset=".6" stop-color="rgba(201,168,76,.12)"/>
<stop offset="1" stop-color="rgba(201,168,76,0)"/></radialGradient>
<linearGradient id="ins-fondu" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#fff" stop-opacity=".5"/>
<stop offset=".45" stop-color="#fff" stop-opacity=".12"/>
<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="ins-reflet" maskUnits="userSpaceOnUse" x="0" y="179" width="180" height="23">
<rect x="0" y="179" width="180" height="23" fill="url(#ins-fondu)"/></mask>
<!-- L'ORFÈVRERIE.

     Un dégradé, si riche soit-il, reste plat : il colore une surface,
     il ne lui donne pas d'arête. Ce filtre, lui, en fabrique une.

     Il prend la silhouette du dessin, la floute pour en faire une
     carte de hauteur, y fait tomber une lumière rasante, et ne garde
     l'éclat obtenu qu'à l'intérieur du tracé. Résultat : chaque bord
     reçoit son biseau, chaque corde son filet de lumière — le même
     relief qu'un objet massif tourné vers une fenêtre.

     Puis l'objet rayonne : une copie floutée, teintée d'or, posée
     DERRIÈRE lui. C'est ce halo rapproché qui fait la différence
     entre « doré » et « en or ».

     Tout est calculé par le navigateur, à chaque affichage. Aucune
     image, aucun octet de plus. -->
<filter id="ins-orfevre" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="bosse"/>
<feSpecularLighting in="bosse" surfaceScale="1.8" specularConstant="0.42" specularExponent="32"
lighting-color="#fff7e2" result="eclat"><feDistantLight azimuth="238" elevation="56"/></feSpecularLighting>
<feComposite in="eclat" in2="SourceAlpha" operator="in" result="eclatDedans"/>
<feComposite in="SourceGraphic" in2="eclatDedans" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="metal"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="5" result="aura"/>
<feColorMatrix in="aura" type="matrix" result="auraOr"
values="0 0 0 0 0.86  0 0 0 0 0.70  0 0 0 0 0.32  0 0 0 0.2 0"/>
<feMerge><feMergeNode in="auraOr"/><feMergeNode in="metal"/></feMerge>
</filter>
<linearGradient id="ins-ivoire" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#fdf3dd"/><stop offset=".4" stop-color="#e8d7b2"/>
<stop offset=".75" stop-color="#c0a878"/><stop offset="1" stop-color="#8e7a50"/></linearGradient>
<clipPath id="ins-rond"><circle cx="90" cy="90" r="64"/></clipPath>
<clipPath id="ins-grille"><rect x="32" y="66" width="116" height="74" rx="3"/></clipPath>
<clipPath id="ins-capsule"><rect x="70" y="28" width="40" height="62" rx="20"/></clipPath>
<clipPath id="ins-capsule2"><rect x="66" y="22" width="48" height="72" rx="24"/></clipPath>
<clipPath id="ins-globe"><circle cx="90" cy="90" r="44"/></clipPath>
</defs></svg>`;

/* ─── Outils de tracé ─── */
const n = (x) => Math.round(x * 10) / 10;
const ligne = (x1, y1, x2, y2, o) =>
  `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}"${o || ''}/>`;
/* Un point sur une courbe de Bézier cubique — sert aux cordes de la
   harpe, qui doivent partir EXACTEMENT de la console et non « à peu
   près le long ». */
const bez = (p, t) => {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p[0] + b * p[2] + c * p[4] + d * p[6], a * p[1] + b * p[3] + c * p[5] + d * p[7]];
};
const boucle = (nb, f) => { let s = ''; for (let i = 0; i < nb; i++) s += f(i, nb); return s; };

/* Le trait fin qui grave : posé par-dessus l'or, il donne le relief
   que le dégradé seul ne donne pas. */
const G = ` fill="none" stroke="${TR}" stroke-opacity=".5" stroke-width="1"`;
const GC = ` fill="none" stroke="${TR}" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"`;
const LUM = ` fill="none" stroke="#f6e7bd" stroke-opacity=".38" stroke-width="1.2" stroke-linecap="round"`;

const INSTRUMENTS = {

/* ─────────────────────────── LES CLAVIERS ─────────────────────── */

/* Le piano à queue vu de dessus : la courbe de la caisse, le cadre,
   les cordes en éventail, et le clavier sur le bord droit. C'est
   l'image que tout le monde reconnaît d'un piano — pas un clavier
   isolé, qui pourrait aussi bien être un synthétiseur. */
'Piano classique':
  `<path d="M26 152V62c0-13 8-21 22-22l62-4c36-2 62 22 60 56-2 32-26 56-58 58l-86 2z" fill="${OR}" stroke="${TR}" stroke-width="2"/>` +
  `<path d="M40 142V70c0-8 5-13 14-14l56-4c28-1 48 18 46 44-2 25-20 43-46 44l-70 2z" fill="${OMBRE}"/>` +
  boucle(9, (i) => ligne(46, 74 + i * 7.4, 146 - i * 7.2, 84 + i * 6.2,
    ' stroke="#c9a84c" stroke-opacity=".34" stroke-width="1"')) +
  `<path d="M42 96h96" stroke="#c9a84c" stroke-opacity=".5" stroke-width="2.4" fill="none"/>` +
  `<rect x="24" y="150" width="104" height="18" rx="2" fill="${NACRE}" stroke="${TR}" stroke-width="1.6"/>` +
  boucle(13, (i) => ligne(31 + i * 7.4, 150, 31 + i * 7.4, 168, G)) +
  boucle(9, (i) => `<rect x="${n(27.5 + [0, 1, 3, 4, 5, 7, 8, 10, 11][i] * 7.4)}" y="150" width="4.6" height="11" fill="#14100a"/>`) +
  `<path d="M46 56c4-6 12-9 22-10" ${LUM}/>`,

/* L'accordéon diatonique, de face : les deux flasques, le soufflet
   plissé entre elles, les boutons de basse à gauche, les touches à
   droite. Le soufflet est ce qui le distingue de tout le reste. */
'Musette':
  `<rect x="14" y="30" width="36" height="120" rx="7" fill="${OR}" stroke="${TR}" stroke-width="2"/>` +
  `<rect x="130" y="30" width="36" height="120" rx="7" fill="${OR}" stroke="${TR}" stroke-width="2"/>` +
  `<path d="M50 38l8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6v104l-8 6-8-6-8 6-8-6-8 6-8-6-8 6-8-6-8 6-8-6z" fill="${ORH}" stroke="${TR}" stroke-width="1.6"/>` +
  boucle(9, (i) => ligne(58 + i * 8, 32 + (i % 2 ? 6 : 0), 58 + i * 8, 148 + (i % 2 ? 6 : 0), G)) +
  `<rect x="20" y="38" width="24" height="104" rx="4" fill="${OMBRE}"/>` +
  boucle(21, (i) => `<circle cx="${26 + (i % 3) * 8}" cy="${46 + Math.floor(i / 3) * 13}" r="3" fill="${ORH}" stroke="${TR}" stroke-opacity=".6" stroke-width=".8"/>`) +
  `<rect x="136" y="38" width="24" height="104" rx="4" fill="${OMBRE}"/>` +
  boucle(11, (i) => `<rect x="139" y="${n(42 + i * 9.2)}" width="18" height="6.6" rx="1.4" fill="${i % 3 === 2 ? '#1a150c' : NACRE}"/>`) +
  `<path d="M18 36c2-3 6-4 10-4" ${LUM}/>`,

/* ─────────────────────────── LES CORDES ───────────────────────── */

/* La guitare folk : la caisse à deux lobes avec sa taille, la rosace
   cerclée, le chevalet et ses six chevilles, le manche fretté, six
   cordes qui vont du chevalet aux mécaniques. */
'Folk acoustique':
  `<path d="M90 48c23 0 36 11 36 24 0 9-7 14-7 22s10 14 10 29c0 22-17 39-39 39s-39-17-39-39c0-15 10-21 10-29s-7-13-7-22c0-13 13-24 36-24z" fill="${OR}" stroke="${TR}" stroke-width="2"/>` +
  `<circle cx="90" cy="92" r="17" fill="none" stroke="${TR}" stroke-opacity=".55" stroke-width="1.4"/>` +
  `<circle cx="90" cy="92" r="13" fill="${OMBRE}" stroke="${TR}" stroke-width="1.6"/>` +
  `<circle cx="90" cy="92" r="20" fill="none" stroke="#f6e7bd" stroke-opacity=".3" stroke-width="1"/>` +
  `<rect x="70" y="128" width="40" height="10" rx="3" fill="#191308" stroke="${TR}" stroke-width="1"/>` +
  boucle(6, (i) => `<circle cx="${n(75 + i * 6)}" cy="133" r="1.5" fill="${ORH}"/>`) +
  `<rect x="80" y="16" width="20" height="36" fill="${BOIS}" stroke="${TR}" stroke-width="1.4"/>` +
  boucle(5, (i) => ligne(80, 21 + i * 6.4, 100, 21 + i * 6.4, ' stroke="#c9a84c" stroke-opacity=".45" stroke-width="1"')) +
  `<path d="M78 4h24a5 5 0 0 1 5 5v9H73V9a5 5 0 0 1 5-5z" fill="${OR}" stroke="${TR}" stroke-width="1.4"/>` +
  boucle(6, (i) => `<circle cx="${i < 3 ? 70 : 110}" cy="${7 + (i % 3) * 5.5}" r="2.3" fill="${ORH}" stroke="${TR}" stroke-opacity=".6" stroke-width=".7"/>`) +
  boucle(6, (i) => ligne(75 + i * 6, 128, 79 + i * 4.4, 12, ' stroke="#efdfb0" stroke-opacity=".55" stroke-width=".9"')) +
  `<path d="M60 64c4-7 10-11 18-12" ${LUM}/>`,

/* L'ampli : caisse, toile de grille, façade à quatre potards, témoin
   allumé, poignée et coins renforcés. Une guitare électrique stylisée
   se lisait « stylo » ; l'ampli ne se lit que d'une façon. */
'Rock':
  `<rect x="22" y="38" width="136" height="112" rx="6" fill="${ORH}" stroke="${TR}" stroke-width="2.2"/>` +
  `<path d="M73 38v-8a5 5 0 0 1 5-5h24a5 5 0 0 1 5 5v8" fill="none" stroke="${OR}" stroke-width="4" stroke-linecap="round"/>` +
  `<rect x="32" y="44" width="116" height="18" rx="2.5" fill="${OMBRE}" stroke="${TR}" stroke-width="1"/>` +
  boucle(4, (i) => `<circle cx="${52 + i * 20}" cy="53" r="4.6" fill="${OR}" stroke="${TR}" stroke-width="1"/>` + ligne(52 + i * 20, 53, 52 + i * 20, 49, ' stroke="#1d1709" stroke-width="1.4"')) +
  `<circle cx="136" cy="53" r="4" fill="#d8603a"/><circle cx="136" cy="53" r="6.5" fill="none" stroke="${OR}" stroke-width="1.4"/>` +
  `<rect x="32" y="66" width="116" height="74" rx="3" fill="${OMBRE}" stroke="${TR}" stroke-width="1.4"/>` +
  `<g clip-path="url(#ins-grille)">` +
  boucle(26, (i) => ligne(20 + i * 8, 142, 52 + i * 8, 62, ' stroke="#c9a84c" stroke-opacity=".17" stroke-width="2"')) +
  boucle(26, (i) => ligne(150 - i * 8, 142, 118 - i * 8, 62, ' stroke="#c9a84c" stroke-opacity=".1" stroke-width="2"')) +
  `</g>` +
  boucle(4, (i) => `<path d="M${i % 2 ? 158 : 22} ${i < 2 ? 50 : 138}${i % 2 ? 'h-10' : 'h10'}${i < 2 ? 'm0 -12' : 'm0 12'}${i % 2 ? 'h10' : 'h-10'}" fill="none" stroke="${OR}" stroke-width="2.6" stroke-linecap="round"/>`) +
  `<rect x="36" y="150" width="18" height="7" rx="2" fill="#191308"/><rect x="126" y="150" width="18" height="7" rx="2" fill="#191308"/>` +
  `<path d="M28 44h8" ${LUM}/>`,

/* La guitare électrique : double pan coupé, deux micros, chevalet,
   potards, et six mécaniques du même côté. */
'Ballade rock':
  `<rect x="82" y="14" width="16" height="58" fill="#1b1508" stroke="${TR}" stroke-width="1.2"/>` +
  boucle(7, (i) => ligne(82, 20 + i * 7.2, 98, 20 + i * 7.2, ' stroke="#c9a84c" stroke-opacity=".4" stroke-width="1"')) +
  `<path d="M76 2h28a4 4 0 0 1 4 4v10H72V6a4 4 0 0 1 4-4z" fill="${OR}" stroke="${TR}" stroke-width="1.4"/>` +
  boucle(6, (i) => `<circle cx="${i < 3 ? 69 : 111}" cy="${5 + (i % 3) * 5}" r="2.2" fill="${ORH}" stroke="${TR}" stroke-opacity=".6" stroke-width=".7"/>`) +
  `<path d="M44 70c10-4 19 1 25 7 6 6 16 6 22 0 6-6 17-11 27-4 11 7 15 21 13 36-2 16-11 30-25 36-10 4-18-2-24-2s-14 6-24 2c-14-6-23-20-25-36-2-15 2-31 11-39z" fill="${OR}" stroke="${TR}" stroke-width="2"/>` +
  `<rect x="64" y="84" width="42" height="11" rx="2" fill="#141009" stroke="${TR}" stroke-width=".8"/>` +
  boucle(6, (i) => `<circle cx="${n(69 + i * 6.4)}" cy="89.5" r="1.5" fill="#b49a54"/>`) +
  `<rect x="64" y="101" width="42" height="11" rx="2" fill="#141009" stroke="${TR}" stroke-width=".8"/>` +
  boucle(6, (i) => `<circle cx="${n(69 + i * 6.4)}" cy="106.5" r="1.5" fill="#b49a54"/>`) +
  `<g transform="rotate(-9 85 124)"><rect x="62" y="118" width="46" height="11" rx="2" fill="#141009" stroke="${TR}" stroke-width=".8"/>` +
  boucle(6, (i) => `<circle cx="${n(67 + i * 6.8)}" cy="123.5" r="1.5" fill="#b49a54"/>`) + `</g>` +
  `<rect x="68" y="134" width="36" height="11" rx="2" fill="${ORH}" stroke="${TR}" stroke-width="1"/>` +
  boucle(6, (i) => ligne(72 + i * 6, 134, 72 + i * 6, 145, G)) +
  `<path d="M76 145h20l-2 12H78z" fill="${OR}" stroke="${TR}" stroke-width="1"/>` +
  boucle(3, (i) => `<circle cx="${[118, 126, 116][i]}" cy="${[110, 124, 138][i]}" r="5" fill="${ORH}" stroke="${TR}" stroke-width="1"/>` +
    ligne([118, 126, 116][i], [110, 124, 138][i], [118, 126, 116][i], [105, 119, 133][i], ' stroke="#1d1709" stroke-width="1.2"')) +
  boucle(6, (i) => ligne(72 + i * 6, 134, 79 + i * 4.2, 10, ' stroke="#efdfb0" stroke-opacity=".55" stroke-width=".9"')) +
  `<path d="M52 84c3-8 9-13 17-15" ${LUM}/>`,

/* La harpe celtique : colonne, console courbe, caisse en biais, et
   dix-sept cordes dont chaque extrémité est CALCULÉE sur la courbe de
   la console — pas posée à l'œil. */
'Celtique': (() => {
  const console_ = [54, 46, 72, 18, 112, 26, 132, 76];   /* la console, en Bézier */
  const A = [62, 158], B = [130, 84];                     /* l'arête de la caisse */
  const cordes = boucle(14, (i, nb) => {
    const t = 0.1 + (i / (nb - 1)) * 0.82;
    const h = bez(console_, t);
    const p = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
    return ligne(h[0], h[1], p[0], p[1],
      ` stroke="${i % 7 === 0 ? '#e3c977' : '#c9a84c'}" stroke-opacity="${i % 7 === 0 ? '.8' : '.45'}" stroke-width="${i % 7 === 0 ? 1.3 : 0.9}"`);
  });
  return `<path d="M56 164L74 164L138 82L124 68L56 150Z" fill="${BOIS}" stroke="${TR}" stroke-width="1.8"/>` +
    `<path d="M62 152L124 72" ${GC}/>` +
    `<rect x="46" y="42" width="13" height="124" rx="4" fill="${OR}" stroke="${TR}" stroke-width="1.8"/>` +
    `<path d="M49 70h7M49 96h7M49 122h7" ${G}/>` +
    `<path d="M${console_[0]} ${console_[1]}C${console_[2]} ${console_[3]} ${console_[4]} ${console_[5]} ${console_[6]} ${console_[7]}" fill="none" stroke="${OR}" stroke-width="11" stroke-linecap="round"/>` +
    `<path d="M${console_[0]} ${console_[1]}C${console_[2]} ${console_[3]} ${console_[4]} ${console_[5]} ${console_[6]} ${console_[7]}" fill="none" stroke="${TR}" stroke-opacity=".45" stroke-width="1.2"/>` +
    cordes +
    `<circle cx="52" cy="40" r="7" fill="${ORH}" stroke="${TR}" stroke-width="1.4"/>` +
    `<path d="M40 166h34l4 8H36z" fill="${OR}" stroke="${TR}" stroke-width="1.4"/>` +
    `<path d="M48 48v20" ${LUM}/>`;
})(),

/* ─────────────────────────── LES VENTS ────────────────────────── */

/* Le saxophone : bec, bocal, corps, culasse et pavillon évasé, avec
   ses clés et sa gravure. */
'Soul jazz':
  `<path d="M100 8l16 8-7 15-16-8z" fill="#15110a" stroke="${TR}" stroke-width="1.2"/>` +
  `<rect x="98" y="24" width="15" height="7" rx="2" transform="rotate(26 105 27)" fill="${ORH}" stroke="${TR}" stroke-width="1"/>` +
  `<path d="M100 32C90 42 86 48 84 58" fill="none" stroke="${OR}" stroke-width="9" stroke-linecap="round"/>` +
  `<path d="M83 56L74 112" fill="none" stroke="${OR}" stroke-width="16" stroke-linecap="round"/>` +
  `<path d="M74 112c-4 26 12 42 32 37" fill="none" stroke="${OR}" stroke-width="16" stroke-linecap="round"/>` +
  `<path d="M106 149c18-5 26-20 22-38l-3-13" fill="none" stroke="${OR}" stroke-width="15" stroke-linecap="round"/>` +
  `<path d="M123.6 97.6C128 76 134 58 145 44L179 72C165 85 148 98 134.4 106.4Z" fill="${OR}" stroke="${TR}" stroke-width="2"/>` +
  `<ellipse cx="162" cy="58" rx="8" ry="23" fill="${OMBRE}" stroke="${OR}" stroke-width="2.8" transform="rotate(-50 162 58)"/>` +
  `<path d="M129 96c4-18 11-32 20-44M136 101c4-17 10-30 19-41" ${GC}/>` +
  boucle(6, (i) => `<circle cx="${n(89 - i * 1.8)}" cy="${n(62 + i * 9)}" r="4.4" fill="${ORH}" stroke="${TR}" stroke-width="1"/>`) +
  boucle(3, (i) => `<circle cx="${n(64 + i * 1.5)}" cy="${n(76 + i * 15)}" r="3.6" fill="${ORH}" stroke="${TR}" stroke-width="1"/>`) +
  `<path d="M79 60L71 114" ${GC}/><path d="M92 56l-8 40" ${LUM}/>`,

/* La clarinette : bec, barillet, corps fretté de clés, et pavillon. */
'Klezmer':
  `<path d="M83 6h14l3 14H80z" fill="#15110a" stroke="${TR}" stroke-width="1.2"/>` +
  `<rect x="80" y="18" width="20" height="6" rx="1.6" fill="${ORH}" stroke="${TR}" stroke-width="1"/>` +
  `<rect x="79" y="24" width="22" height="13" rx="3" fill="${OMBRE}" stroke="${TR}" stroke-width="1.4"/>` +
  `<rect x="81" y="37" width="18" height="46" fill="#15110a" stroke="${TR}" stroke-width="1.4"/>` +
  `<rect x="79" y="83" width="22" height="8" rx="2" fill="${ORH}" stroke="${TR}" stroke-width="1"/>` +
  `<rect x="81" y="91" width="18" height="42" fill="#15110a" stroke="${TR}" stroke-width="1.4"/>` +
  `<path d="M81 133c-11 9-17 22-17 32 0 4 3 6 8 6h36c5 0 8-2 8-6 0-10-6-23-17-32z" fill="${OMBRE}" stroke="${OR}" stroke-width="2.4"/>` +
  `<path d="M70 165c0-9 5-19 12-26M110 165c0-9-5-19-12-26" ${GC}/>` +
  boucle(6, (i) => `<circle cx="90" cy="${n(45 + i * 13)}" r="3" fill="#0a0805" stroke="${TR}" stroke-opacity=".8" stroke-width=".8"/>`) +
  boucle(5, (i) => `<circle cx="${i % 2 ? 104 : 76}" cy="${n(50 + i * 16)}" r="4" fill="${ORH}" stroke="${TR}" stroke-width="1"/>`) +
  boucle(3, (i) => `<rect x="${i % 2 ? 99 : 74}" y="${n(60 + i * 22)}" width="7" height="3" rx="1.4" fill="${OR}"/>`) +
  `<path d="M84 40v40" ${LUM}/>`,

/* La trompette : bec, embouchure, coulisse d'accord, trois pistons et
   le pavillon. Essayée en pictogramme, elle se lisait « flèche » ;
   dessinée en entier, elle ne se confond avec rien. */
'Funk':
  `<ellipse cx="20" cy="90" rx="4.5" ry="9" fill="${ORH}" stroke="${TR}" stroke-width="1.2"/>` +
  `<path d="M20 82l14 4v8l-14 4z" fill="${OR}" stroke="${TR}" stroke-width="1"/>` +
  `<path d="M34 90h88" fill="none" stroke="${OR}" stroke-width="11" stroke-linecap="round"/>` +
  `<path d="M52 90v20a10 10 0 0 0 10 10h42a10 10 0 0 0 10-10V90" fill="none" stroke="${OR}" stroke-width="8" stroke-linecap="round"/>` +
  `<path d="M120 76c16-4 30-12 42-24 10 14 10 62 0 76-12-12-26-20-42-24z" fill="${OR}" stroke="${TR}" stroke-width="2"/>` +
  `<ellipse cx="162" cy="90" rx="7" ry="38" fill="${OMBRE}" stroke="${OR}" stroke-width="2.6"/>` +
  `<path d="M128 78c14-5 26-13 34-22M130 102c14 5 26 13 34 22" ${GC}/>` +
  boucle(3, (i) => `<rect x="${65 + i * 19}" y="52" width="14" height="42" rx="5" fill="${ORH}" stroke="${TR}" stroke-width="1.4"/>` +
    `<rect x="${67 + i * 19}" y="44" width="10" height="10" rx="3" fill="${OR}" stroke="${TR}" stroke-width="1"/>` +
    `<path d="M${69 + i * 19} 60h6" ${G}/>`) +
  `<path d="M38 86h74" ${LUM}/>`,

/* ─────────────────────── LES CORDES GRAVES ────────────────────── */

/* La contrebasse : caisse à ouïes, chevalet, cordier, manche et
   volute. Deux trompettes avaient été essayées ici et jetées : à
   cette place il fallait un corps, pas un pavillon. */
'Jazz doux':
  `<path d="M90 60c25 0 41 12 41 29 0 10-8 13-8 19s9 15 9 29c0 21-16 37-42 37s-42-16-42-37c0-14 9-23 9-29s-8-9-8-19c0-17 16-29 41-29z" fill="${OR}" stroke="${TR}" stroke-width="2"/>` +
  `<path d="M70 92c6 2 6 11 2 17-4 6-6 12-2 18" fill="none" stroke="${TR}" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>` +
  `<circle cx="71" cy="89" r="2.6" fill="${TR}" fill-opacity=".75"/><circle cx="69" cy="130" r="2.6" fill="${TR}" fill-opacity=".75"/>` +
  `<path d="M110 92c-6 2-6 11-2 17 4 6 6 12 2 18" fill="none" stroke="${TR}" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>` +
  `<circle cx="109" cy="89" r="2.6" fill="${TR}" fill-opacity=".75"/><circle cx="111" cy="130" r="2.6" fill="${TR}" fill-opacity=".75"/>` +
  `<path d="M73 130h34l-4 9H77z" fill="#efe3c0" stroke="${TR}" stroke-width="1"/>` +
  `<path d="M83 141h14l-2 24h-10z" fill="#191308" stroke="${TR}" stroke-width="1"/>` +
  `<rect x="82" y="16" width="16" height="46" fill="#1b1508" stroke="${TR}" stroke-width="1.2"/>` +
  `<path d="M84 18c-9-1-14-7-13-14 1-7 10-10 15-5 5 5 1 12-5 11-3-1-4-4-2-6" fill="none" stroke="${OR}" stroke-width="3.4" stroke-linecap="round"/>` +
  boucle(4, (i) => `<circle cx="${i % 2 ? 103 : 77}" cy="${12 + Math.floor(i / 2) * 12}" r="2.6" fill="${ORH}" stroke="${TR}" stroke-opacity=".6" stroke-width=".8"/>`) +
  boucle(4, (i) => ligne(78 + i * 8, 131, 82 + i * 5, 12, ' stroke="#efdfb0" stroke-opacity=".5" stroke-width=".9"')) +
  `<path d="M90 166v10" fill="none" stroke="${OR}" stroke-width="3"/>` +
  `<path d="M58 74c5-6 12-9 20-10" ${LUM}/>`,

/* Le banjo : le fût cerclé de ses tirants — calculés, pas recopiés —
   la peau, le chevalet, et le manche en diagonale avec sa cheville de
   cinquième corde. C'est elle qui dit « americana » et pas « guitare ». */
'Country americana': (() => {
  const cx = 72, cy = 118, r = 44;
  const tirants = boucle(20, (i, nb) => {
    const a = (i / nb) * Math.PI * 2 - Math.PI / 2;
    return `<rect x="${n(cx + Math.cos(a) * 39 - 1.6)}" y="${n(cy + Math.sin(a) * 39 - 3.5)}" width="3.2" height="7" rx="1.4" fill="#8d7436" stroke="${TR}" stroke-opacity=".5" stroke-width=".6" transform="rotate(${n(a * 180 / Math.PI + 90)} ${n(cx + Math.cos(a) * 39)} ${n(cy + Math.sin(a) * 39)})"/>`;
  });
  /* Les cordes suivent l'axe du manche, décalées perpendiculairement :
     calculées, elles restent sur la touche au lieu de la traverser. */
  const ux = 0.633, uy = -0.774, px = 0.774, py = 0.633;
  const cordes = boucle(4, (i) => ligne(
    68 + px * i * 4.4, 128 + py * i * 4.4,
    68 + ux * 108 + px * i * 4.4, 128 + uy * 108 + py * i * 4.4,
    ' stroke="#efdfb0" stroke-opacity=".6" stroke-width=".9"'));
  return `<path d="M96 96L150 28l16 12-54 68z" fill="${BOIS}" stroke="${TR}" stroke-width="1.8"/>` +
    /* Les frettes sont parallèles à la LARGEUR du manche, pas
       horizontales : posées à l'œil, elles en sortaient en biais. */
    boucle(6, (i) => { const t = 0.12 + i * 0.145;
      return ligne(96 + t * 54, 96 - t * 68, 96 + t * 54 + 16, 96 - t * 68 + 12,
        ' stroke="#c9a84c" stroke-opacity=".45" stroke-width="1"'); }) +
    `<path d="M148 30L164 8l16 12-16 22z" fill="${OR}" stroke="${TR}" stroke-width="1.4"/>` +
    boucle(4, (i) => `<circle cx="${[155, 163, 169, 177][i]}" cy="${[17, 11, 25, 19][i]}" r="2.4" fill="${ORH}" stroke="${TR}" stroke-opacity=".6" stroke-width=".7"/>`) +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${OR}" stroke="${TR}" stroke-width="2.2"/>` +
    tirants +
    `<circle cx="${cx}" cy="${cy}" r="${r - 9}" fill="${IVOIRE}" stroke="${TR}" stroke-width="1.6"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r - 14}" fill="none" stroke="${TR}" stroke-opacity=".18" stroke-width="1"/>` +
    cordes +
    `<path d="M60 126h26l-3 8H63z" fill="#191308" stroke="${TR}" stroke-width=".8"/>` +
    `<path d="M60 146h22l-4 16H64z" fill="${ORH}" stroke="${TR}" stroke-width="1"/>` +
    `<circle cx="120" cy="76" r="3" fill="${ORH}" stroke="${TR}" stroke-opacity=".6" stroke-width=".8"/>` +
    ligne(70, 130, 119, 78, ' stroke="#efdfb0" stroke-opacity=".5" stroke-width=".9"') +
    `<path d="M38 100a44 44 0 0 1 24-26" ${LUM}/>`;
})(),

/* ─────────────────────────── LES PEAUX ────────────────────────── */

/* Le tambour bélé : le fût conique, la peau tendue, les cercles, et
   le laçage en V qui court tout autour — calculé lui aussi. */
'Bélé antillais': (() => {
  /* Le laçage précédent alignait sept V courts et épais : on y lisait
     des lettres, pas de la corde. Ils sont maintenant hauts, fins, et
     tendus entre deux cercles de bois — ce qui est leur vrai rôle. */
  const lacets = boucle(9, (i) => {
    const x1 = 53 + i * 8.6, x2 = 57.5 + i * 8.6, x3 = 62 + i * 8.6;
    return `<path d="M${n(x1)} 78L${n(x2)} 128L${n(x3)} 78" fill="none" stroke="#d3b45e" stroke-opacity=".9" stroke-width="1.7" stroke-linejoin="round"/>`;
  });
  return `<path d="M50 64h80l-13 94c-1 8-11 13-27 13s-26-5-27-13z" fill="${BOIS}" stroke="${TR}" stroke-width="2"/>` +
    `<path d="M62 68l-9 88M90 68v92M118 68l9 88" ${GC}/>` +
    `<path d="M51 78c9 5 23 7 39 7s30-2 39-7" fill="none" stroke="${OR}" stroke-width="3.2"/>` +
    lacets +
    `<path d="M56 126c8 4 21 6 34 6s26-2 34-6" fill="none" stroke="${OR}" stroke-width="3.2"/>` +
    `<ellipse cx="90" cy="64" rx="41" ry="15" fill="${IVOIRE}" stroke="${TR}" stroke-width="1.8"/>` +
    `<ellipse cx="90" cy="64" rx="31" ry="10.5" fill="none" stroke="${TR}" stroke-opacity=".2" stroke-width="1"/>` +
    `<ellipse cx="90" cy="64" rx="43" ry="16" fill="none" stroke="${OR}" stroke-width="3.6"/>` +
    `<path d="M60 55c8-3 19-5 30-5" ${LUM}/>`;
})(),

/* ────────────────────── LES VOIX ET LES LIEUX ─────────────────── */

/* Le vitrail : l'arc, les meneaux, la rosace centrale, et la flaque de
   lumière au sol. Le gospel n'a pas d'instrument — il a un lieu. */
'Gospel':
  `<path d="M46 160V88a44 44 0 0 1 88 0v72z" fill="${OMBRE}" stroke="${OR}" stroke-width="3"/>` +
  `<path d="M54 160V88a36 36 0 0 1 72 0v72" fill="none" stroke="${TR}" stroke-opacity=".5" stroke-width="1.4"/>` +
  `<path d="M90 52v108M56 112h68M56 136h68" fill="none" stroke="${OR}" stroke-width="2.6"/>` +
  `<path d="M60 112V90a30 30 0 0 1 60 0v22" fill="none" stroke="${OR}" stroke-opacity=".5" stroke-width="1.4"/>` +
  `<path d="M58 114h28v20H58zM94 114h28v20H94z" fill="#c9a84c" fill-opacity=".12"/>` +
  `<path d="M58 138h28v20H58z" fill="#c9a84c" fill-opacity=".07"/>` +
  `<path d="M94 138h28v20H94z" fill="#c9a84c" fill-opacity=".16"/>` +
  `<circle cx="90" cy="84" r="13" fill="${ORH}" stroke="${TR}" stroke-width="1.4"/>` +
  boucle(8, (i) => {
    const a = (i / 8) * Math.PI * 2;
    return ligne(90 + Math.cos(a) * 15, 84 + Math.sin(a) * 15, 90 + Math.cos(a) * 23, 84 + Math.sin(a) * 23,
      ' stroke="#e3c977" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"');
  }) +
  `<circle cx="90" cy="84" r="6" fill="${OMBRE}"/>` +
  `<path d="M46 160L26 176h128l-20-16z" fill="#c9a84c" fill-opacity=".11"/>` +
  `<rect x="38" y="158" width="104" height="8" rx="2" fill="${OR}" stroke="${TR}" stroke-width="1.2"/>`,

/* Les crêtes : la polyphonie corse n'a pas d'instrument non plus, elle
   a une montagne, trois plans, et une lune. */
'Polyphonie corse':
  `<path d="M60 26a17 17 0 1 0 10 30 14 14 0 1 1-10-30z" fill="${NACRE}" opacity=".8"/>` +
  `<path d="M2 154L46 82l28 44 24-32 56 60z" fill="${OR}" fill-opacity=".3" stroke="${TR}" stroke-opacity=".3" stroke-width="1"/>` +
  `<path d="M0 160L38 98l30 38 24-26 52 50z" fill="${OR}" fill-opacity=".55"/>` +
  `<path d="M16 168L62 96l32 44 26-30 62 58z" fill="${ORH}" stroke="${TR}" stroke-width="1.6"/>` +
  `<path d="M62 96l-11 18c7 3 13 3 20 0zM120 110l-8 10c5 3 11 3 16 0z" fill="${NACRE}" opacity=".85"/>` +
  `<path d="M62 100L44 168M94 142l-20 26M120 114l24 32" ${GC}/>` +
  `<path d="M0 168h180" fill="none" stroke="${TR}" stroke-opacity=".4" stroke-width="1"/>` +
  `<path d="M68 104c6 8 12 18 16 26" ${LUM}/>`,

/* Le micro de studio : grille, suspension élastique, corps, pied. */
'Chanson française':
  /* Le micro de studio, troisième état. Avec sa suspension complète,
     on y lisait un miroir à main ; allégée, on y lisait un fer à
     cheval. La suspension saute : ce qui dit « micro » sans hésiter,
     c'est la grille bombée, son collier de métal et son pied lesté. */
  `<rect x="66" y="22" width="48" height="72" rx="24" fill="${OMBRE}" stroke="${OR}" stroke-width="2.8"/>` +
  `<g clip-path="url(#ins-capsule2)">` +
  boucle(12, (i) => ligne(66, 24 + i * 6.2, 114, 24 + i * 6.2, ' stroke="#c9a84c" stroke-opacity=".34" stroke-width="1"')) +
  boucle(8, (i) => ligne(68 + i * 6, 22, 68 + i * 6, 94, ' stroke="#c9a84c" stroke-opacity=".22" stroke-width="1"')) +
  `</g>` +
  `<rect x="64" y="52" width="52" height="7" rx="2" fill="${ORH}" stroke="${TR}" stroke-width="1"/>` +
  `<rect x="64" y="86" width="52" height="9" rx="3" fill="${OR}" stroke="${TR}" stroke-width="1.2"/>` +
  `<path d="M74 95h32l-4 26H78z" fill="${OR}" stroke="${TR}" stroke-width="1.4"/>` +
  `<path d="M78 103h24M78 110h24" ${G}/>` +
  `<rect x="85" y="121" width="10" height="26" fill="${ORH}" stroke="${TR}" stroke-width="1.2"/>` +
  `<ellipse cx="90" cy="150" rx="26" ry="7" fill="${ORH}" stroke="${TR}" stroke-width="1.4"/>` +
  `<path d="M64 150c0 8 12 14 26 14s26-6 26-14v8c0 8-12 14-26 14s-26-6-26-14z" fill="${OR}" stroke="${TR}" stroke-width="1.4"/>` +
  `<path d="M72 34a20 20 0 0 1 12-9" ${LUM}/>`,

/* La plume : la variété douce n'a pas d'instrument propre — elle a
   l'écriture. Les barbes sont calculées le long de la hampe. */
'Variété douce': (() => {
  const hampe = [46, 150, 74, 118, 116, 60, 152, 24];
  const barbes = boucle(18, (i, nb) => {
    const t = 0.1 + (i / nb) * 0.82;
    const p = bez(hampe, t);
    const q = bez(hampe, Math.min(t + 0.05, 1));
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const L = Math.hypot(dx, dy) || 1;
    const l = 24 * (1 - Math.abs(t - 0.5) * 1.15);
    const c = i % 2 ? 1 : -1;
    return ligne(p[0], p[1], p[0] + (-dy / L) * l * c - (dx / L) * 16, p[1] + (dx / L) * l * c - (dy / L) * 16,
      ' stroke="#4a3a1a" stroke-opacity=".75" stroke-width="1.2"');
  });
  return `<path d="M152 24c-28 6-52 26-68 54-6 10-11 21-15 32 8-2 14-8 20-12-3 8-8 16-14 22 9-1 17-6 24-12-2 8-6 15-11 21 26-8 48-30 60-56 8-18 10-38 4-49z" fill="${ORH}" stroke="${TR}" stroke-width="1.8"/>` +
    barbes +
    `<path d="M${hampe[0]} ${hampe[1]}C${hampe[2]} ${hampe[3]} ${hampe[4]} ${hampe[5]} ${hampe[6]} ${hampe[7]}" fill="none" stroke="${OR}" stroke-width="3.6" stroke-linecap="round"/>` +
    `<ellipse cx="46" cy="146" rx="22" ry="7" fill="#0c0a06" stroke="${OR}" stroke-width="2.4"/>` +
    `<path d="M25 146c0 14 2 22 5 26 3 4 9 6 16 6s13-2 16-6c3-4 5-12 5-26z" fill="${OR}" stroke="${TR}" stroke-width="1.6"/>` +
    `<path d="M28 156c10 4 26 4 36 0" ${GC}/>` +
    `<path d="M28 150a30 30 0 0 0 3 18" ${LUM}/>` +
    `<circle cx="30" cy="62" r="4.6" fill="${OR}"/><path d="M34.6 62V40l13-3v19" fill="none" stroke="${OR}" stroke-width="2.4" stroke-linecap="round"/><circle cx="44" cy="56" r="4" fill="${OR}"/>`;
})(),

/* Le casque de studio : le R&B se travaille au casque, pas à la scène. */
'R&B':
  `<path d="M34 112V88a56 56 0 0 1 112 0v24" fill="none" stroke="${OR}" stroke-width="9" stroke-linecap="round"/>` +
  `<path d="M42 104V88a48 48 0 0 1 96 0v16" fill="none" stroke="${TR}" stroke-opacity=".4" stroke-width="1.4"/>` +
  `<path d="M52 56a48 48 0 0 1 76 0" fill="none" stroke="#f6e7bd" stroke-opacity=".4" stroke-width="2.4" stroke-linecap="round"/>` +
  `<rect x="16" y="98" width="38" height="62" rx="15" fill="${ORH}" stroke="${TR}" stroke-width="2"/>` +
  `<rect x="126" y="98" width="38" height="62" rx="15" fill="${ORH}" stroke="${TR}" stroke-width="2"/>` +
  `<ellipse cx="35" cy="129" rx="12" ry="21" fill="${OMBRE}" stroke="${TR}" stroke-width="1.2"/>` +
  `<ellipse cx="145" cy="129" rx="12" ry="21" fill="${OMBRE}" stroke="${TR}" stroke-width="1.2"/>` +
  `<ellipse cx="35" cy="129" rx="6" ry="12" fill="none" stroke="${OR}" stroke-opacity=".5" stroke-width="1"/>` +
  `<ellipse cx="145" cy="129" rx="6" ry="12" fill="none" stroke="${OR}" stroke-opacity=".5" stroke-width="1"/>` +
  `<rect x="30" y="92" width="10" height="12" rx="3" fill="${OR}" stroke="${TR}" stroke-width="1"/>` +
  `<rect x="140" y="92" width="10" height="12" rx="3" fill="${OR}" stroke="${TR}" stroke-width="1"/>` +
  `<path d="M35 162c-2 9 1 15 8 18 5 2 11 2 16 0" fill="none" stroke="${OR}" stroke-width="3" stroke-linecap="round"/>` +
  `<path d="M22 112a14 14 0 0 1 8-9" ${LUM}/>`,

/* ─────────────────────────── LES SIGNES ───────────────────────── */

/* Le soleil : le reggae n'a pas d'instrument — il a une lumière. */
'Reggae': (() => {
  const rayons = boucle(24, (i, nb) => {
    const a = (i / nb) * Math.PI * 2;
    const r1 = 40, r2 = i % 2 ? 50 : 62;
    return ligne(90 + Math.cos(a) * r1, 90 + Math.sin(a) * r1, 90 + Math.cos(a) * r2, 90 + Math.sin(a) * r2,
      ` stroke="${i % 2 ? '#c9a84c' : '#e3c977'}" stroke-opacity="${i % 2 ? '.55' : '.9'}" stroke-width="${i % 2 ? 2 : 3}" stroke-linecap="round"`);
  });
  return `<circle cx="90" cy="90" r="72" fill="none" stroke="${OR}" stroke-opacity=".2" stroke-width="1"/>` +
    rayons +
    `<circle cx="90" cy="90" r="34" fill="${OR}" stroke="${TR}" stroke-width="2"/>` +
    `<circle cx="90" cy="90" r="26" fill="none" stroke="${TR}" stroke-opacity=".3" stroke-width="1"/>` +
    `<circle cx="90" cy="90" r="18" fill="none" stroke="${TR}" stroke-opacity=".22" stroke-width="1"/>` +
    `<circle cx="90" cy="90" r="9" fill="${ORH}" stroke="${TR}" stroke-opacity=".4" stroke-width="1"/>` +
    `<path d="M68 70a32 32 0 0 1 20-11" ${LUM}/>`;
})(),

/* La vague et la lune : la bossa se joue au bord de l'eau. */
'Bossa nova':
  `<circle cx="90" cy="90" r="64" fill="#0f0d09"/>` +
  `<g clip-path="url(#ins-rond)">` +
  `<path d="M132 34a19 19 0 1 0 12 34 15 15 0 1 1-12-34z" fill="${NACRE}" opacity=".9"/>` +
  `<circle cx="56" cy="46" r="2.4" fill="#f6e7bd" fill-opacity=".7"/><circle cx="80" cy="34" r="1.6" fill="#f6e7bd" fill-opacity=".5"/><circle cx="44" cy="66" r="1.8" fill="#f6e7bd" fill-opacity=".45"/>` +
  /* Les trois plans d'eau vont d'un bord à l'autre du hublot : la
     première version s'arrêtait en chemin et laissait un coin vide,
     où l'œil lisait une dune plutôt qu'une mer. */
  `<path d="M0 110c16-12 32-10 46 2 14 12 30 13 46 1 14-10 30-10 44 0 12 8 26 8 44 2v75H0z" fill="${OR}" fill-opacity=".3"/>` +
  `<path d="M0 132c16-12 32-10 46 2 14 12 30 13 46 1 14-10 30-10 44 0 12 8 26 8 44 2v55H0z" fill="${OR}" fill-opacity=".55"/>` +
  `<path d="M0 154c16-12 32-10 46 2 14 12 30 13 46 1 14-10 30-10 44 0 12 8 26 8 44 2v35H0z" fill="${ORH}"/>` +
  `<path d="M0 110c16-12 32-10 46 2" fill="none" stroke="#f6e7bd" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"/>` +
  `<path d="M0 132c16-12 32-10 46 2" fill="none" stroke="#f6e7bd" stroke-opacity=".36" stroke-width="2.2" stroke-linecap="round"/>` +
  `<path d="M96 112c14-10 30-10 44 0M94 134c14-10 30-10 44 0M14 162c16-8 34-7 48 3" ${GC}/>` +
  /* Le reflet de la lune, en trois traits sur l'eau. */
  `<path d="M124 120h24M120 132h32M126 144h20" fill="none" stroke="#f6e7bd" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/>` +
  `<circle cx="48" cy="112" r="2.6" fill="#f6e7bd" fill-opacity=".85"/><circle cx="56" cy="116" r="1.7" fill="#f6e7bd" fill-opacity=".6"/><circle cx="46" cy="134" r="2.2" fill="#f6e7bd" fill-opacity=".6"/>` +
  `</g>` +
  `<circle cx="90" cy="90" r="64" fill="none" stroke="${OR}" stroke-width="2.6"/>` +
  `<circle cx="90" cy="90" r="69" fill="none" stroke="${OR}" stroke-opacity=".3" stroke-width="1"/>`,

/* La sphère armillaire : le globe tenu dans son cercle, sur son pied.
   La musique du monde n'a pas d'instrument — elle a une carte. */
'Musique du monde':
  `<circle cx="90" cy="90" r="44" fill="#221b10" stroke="${OR}" stroke-width="2.6"/>` +
  `<g clip-path="url(#ins-globe)">` +
  `<path d="M52 66c11-9 24-7 30 2 7 10 3 19-8 21-13 3-30-13-22-23zM72 104c9-11 22-9 26 2 5 13-4 24-15 23-11-1-17-15-11-25zM106 58c13-4 24 4 22 15-2 10-15 14-22 7-6-7-6-20 0-22zM110 110c11-6 22 2 22 13 0 12-13 19-21 11-7-6-8-20-1-24z" fill="${ORH}" fill-opacity=".85"/>` +
  `<path d="M52 68c16 9 60 9 76 0M52 112c16-9 60-9 76 0" fill="none" stroke="${OR}" stroke-opacity=".45" stroke-width="1.2"/>` +
  `<ellipse cx="90" cy="90" rx="15" ry="44" fill="none" stroke="${OR}" stroke-opacity=".4" stroke-width="1.2"/>` +
  `<ellipse cx="90" cy="90" rx="31" ry="44" fill="none" stroke="${OR}" stroke-opacity=".3" stroke-width="1.2"/>` +
  `<path d="M46 90h88" fill="none" stroke="#e3c977" stroke-opacity=".7" stroke-width="1.8"/>` +
  `<path d="M60 56a44 44 0 0 0-14 34" fill="none" stroke="#f6e7bd" stroke-opacity=".25" stroke-width="7"/>` +
  `</g>` +
  `<ellipse cx="90" cy="90" rx="58" ry="21" fill="none" stroke="${OR}" stroke-width="4.4" transform="rotate(-22 90 90)"/>` +
  `<ellipse cx="90" cy="90" rx="58" ry="21" fill="none" stroke="${TR}" stroke-opacity=".35" stroke-width="1" transform="rotate(-22 90 90)"/>` +
  `<path d="M48 114c4 17 21 28 42 28s38-11 42-28" fill="none" stroke="${OR}" stroke-width="4.4" stroke-linecap="round"/>` +
  `<path d="M85 140h10v20h-10z" fill="${OR}" stroke="${TR}" stroke-width="1"/>` +
  `<path d="M62 174h56l-9-14H71z" fill="${OR}" stroke="${TR}" stroke-width="1.4"/>` +
  `<path d="M58 74a44 44 0 0 1 24-26" ${LUM}/>`

};

/* Le repli : un disque. Un registre ajouté demain en console n'aura
   pas d'illustration choisie, mais la carte ne sera pas trouée. */
const REPLI =
  `<circle cx="90" cy="90" r="62" fill="${OMBRE}" stroke="${OR}" stroke-width="2"/>` +
  boucle(7, (i) => `<circle cx="90" cy="90" r="${54 - i * 5}" fill="none" stroke="${OR}" stroke-opacity=".22" stroke-width="1"/>`) +
  `<circle cx="90" cy="90" r="18" fill="${OR}" stroke="${TR}" stroke-width="1.4"/>` +
  `<circle cx="90" cy="90" r="3.4" fill="${OMBRE}"/>` +
  `<path d="M52 66a46 46 0 0 1 26-22" ${LUM}/>`;

/* L'illustration complète. Ce qui la fait passer du pictogramme à
   l'objet, ce n'est pas le dessin — c'est ce qu'il y a autour :

     · une lueur derrière, qui décolle l'objet du fond ;
     · une ombre portée au sol, qui le POSE quelque part ;
     · et son reflet, retourné, fondu, qui dit que le sol est laqué.

   Le reflet ne redessine rien : c'est un « use » du même groupe,
   retourné par une matrice. Vingt reflets ne coûtent donc pas vingt
   dessins de plus, seulement vingt lignes.

   Le compteur sert à donner à chaque objet un identifiant unique dans
   la page — sans quoi le reflet de la vingtième carte pointerait sur
   le dessin de la première. */
let compteur = 0;

function illustration(registre) {
  const d = INSTRUMENTS[registre] || REPLI;
  const id = 'ins-o' + (++compteur);
  /* La boîte de dessin fait 180 × 180 ; la vue en montre un peu plus,
     pour que le manche d'une guitare ou le bec d'un saxophone ne
     viennent pas buter contre le bord de la carte. Les 24 unités du
     bas logent le reflet. */
  return '<svg class="reg-art" viewBox="-14 -12 208 226" aria-hidden="true" focusable="false">' +
    '<circle class="reg-halo" cx="90" cy="88" r="84" fill="url(#ins-lueur)"/>' +
    '<ellipse class="reg-sol" cx="90" cy="180" rx="56" ry="6" fill="url(#ins-sol)"/>' +
    /* Le filtre est porté par une enveloppe, PAS par le groupe lui-même :
       le reflet réutilise le groupe intérieur et échappe donc à
       l'orfèvrerie. Il est flouté et à un tiers d'opacité — personne
       n'y verra le biseau manquant, et la page économise la moitié
       des passes de filtre. */
    '<g filter="url(#ins-orfevre)"><g class="reg-objet" id="' + id + '">' + d + '</g></g>' +
    /* Le miroir : y devient 358 - y, soit un retournement autour de
       la ligne de sol (179). */
    '<g class="reg-reflet" mask="url(#ins-reflet)">' +
    '<use href="#' + id + '" transform="matrix(1 0 0 -1 0 358)"/></g>' +
    '</svg>';
}

/* Deux mots par registre — ce qu'on entend, pas ce qu'on voit. Ils
   tiennent sous le nom, séparés d'un point médian. Aucun n'est un
   argument de vente : « Feutré · Intime » dit ce que ça fait à
   l'oreille, « Le plus demandé » dirait autre chose. */
const MOTS = {
  'Piano classique': ['Épuré', 'Intemporel'],
  'Musette': ['Tendre', 'Populaire'],
  'Folk acoustique': ['Simple', 'Sincère'],
  'Rock': ['Franc', 'Électrique'],
  'Ballade rock': ['Ample', 'Émouvant'],
  'Celtique': ['Ancien', 'Marin'],
  'Soul jazz': ['Chaleureux', 'Habité'],
  'Country americana': ['Rugueux', 'Tendre'],
  'Jazz doux': ['Feutré', 'Intime'],
  'Klezmer': ['Grave', 'Dansant'],
  'Bélé antillais': ['Vivant', 'Enraciné'],
  'Gospel': ['Lumineux', 'Choral'],
  'Polyphonie corse': ['Nu', 'Puissant'],
  'Chanson française': ['Écrit', 'Familier'],
  'Variété douce': ['Doux', 'Direct'],
  'R&B': ['Souple', 'Moderne'],
  'Reggae': ['Léger', 'Solaire'],
  'Bossa nova': ['Suave', 'Nostalgique'],
  'Musique du monde': ['Voyageur', 'Métissé'],
  'Funk': ['Joyeux', 'Entraînant']
};

/* Un registre sans mots n'en reçoit aucun plutôt qu'un mot faux :
   la carte se contente alors de son nom. scripts/check.js signale
   le manque au moment de la génération. */
const mots = (registre) => MOTS[registre] || null;

module.exports = { illustration, mots, INSTRUMENTS, MOTS, REPLI, DEFS };
