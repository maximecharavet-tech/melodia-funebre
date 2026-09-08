/* ═══════════════════════════════════════════════════════════════
   relief.js — La profondeur des consoles

   POURQUOI

   Les quatre consoles étaient plates : des rectangles posés côte à
   côte, sans hiérarchie autre que la taille du texte. Rien ne disait
   ce qu'on pouvait saisir, ni ce qui venait de changer.

   Ce module ajoute une troisième dimension — mais une seule, et
   partagée. Les tuiles d'une même rangée s'inclinent vers un point de
   fuite commun : c'est ce qui fait lire une table où sont posées des
   cartes, plutôt que quatre images déformées chacune dans son coin.

   TROIS GESTES, PAS DIX

   1. Les chiffres basculent comme un volet d'horaire de gare, et
      comptent de l'ancienne valeur vers la nouvelle. Sur un tableau
      qui se rafraîchit tout seul, ce mouvement est la seule chose qui
      dise « ce nombre vient de bouger ».
   2. Les cartes suivent le curseur, à huit degrés au plus, avec un
      reflet d'or sous la pointe. Leur contenu est décollé du fond :
      c'est ce décalage-là qui fait l'épaisseur, pas l'inclinaison.
   3. Les panneaux se posent en cascade à l'arrivée d'une vue.

   CE QU'IL NE FAIT PAS

   Il ne rejoue rien sur un simple rafraîchissement. Les consoles se
   redessinent toutes seules ; une animation d'entrée à chaque cycle
   serait insupportable au bout de deux minutes. L'entrée ne joue qu'au
   changement de vue, et un chiffre ne bascule que s'il a changé.

   Il ne s'active pas au doigt : sans curseur, l'inclinaison n'a pas de
   sens, et elle coûterait des images par seconde là où elles sont le
   plus rares. Et il s'efface entièrement si le système demande moins
   d'animation.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUIT = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FIN = window.matchMedia('(pointer: fine)').matches;

  /* Huit degrés : au-delà, le texte se déforme et la carte devient un
     jouet. En deçà de quatre, personne ne voit rien. */
  var ANGLE = 8;
  var ANGLE_MENU = 4;

  /* ───────────────────────────────────────────────────────────────
     LES CHIFFRES QUI BASCULENT
     ─────────────────────────────────────────────────────────────── */

  /* Ce que la console a écrit la dernière fois, par libellé. Sans cette
     mémoire, chaque rafraîchissement relancerait la bascule sur des
     valeurs identiques. */
  var MEMOIRE = Object.create(null);

  function lireNombre(t) {
    var n = String(t).replace(/[  \s]/g, '').replace(',', '.');
    if (!/^-?\d+(?:\.\d+)?$/.test(n)) return null;
    return parseFloat(n);
  }

  /* On rend le nombre exactement comme la console l'écrit : si elle ne
     groupe pas les milliers, en ajouter pendant le comptage ferait
     clignoter la tuile entre deux écritures à chaque rafraîchissement. */
  function ecrire(v, dec, groupe, virgule) {
    var t = dec ? Math.abs(v).toFixed(dec) : String(Math.round(Math.abs(v)));
    var m = t.split('.');
    if (groupe) m[0] = m[0].replace(/\B(?=(\d{3})+(?!\d))/g, groupe);
    return (v < 0 ? '-' : '') + m[0] + (m[1] ? virgule + m[1] : '');
  }

  /* Le nombre est le premier nœud de texte de la tuile : le reste
     (« € », un pourcentage) est dans un élément à part et ne doit ni
     compter ni bouger indépendamment. */
  function noeudChiffre(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && lireNombre(n.nodeValue) !== null) return n;
    }
    return null;
  }

  /* Pendant qu'un chiffre roule, le texte affiché est le nôtre, pas
     celui de la console. Sans ce drapeau, un rafraîchissement tombant
     au milieu du comptage relèverait une valeur intermédiaire, la
     prendrait pour la vérité, et repartirait vers elle : le chiffre
     s'arrêtait alors sur un nombre qui n'existait nulle part. */
  function rouler(val, noeud, de, vers, f) {
    var t0 = 0, duree = 780;
    val.dataset.relRoule = '1';
    function pas(t) {
      /* La console remplace ses tuiles en bloc : le nœud d'un cycle
         précédent est détaché et n'intéresse plus personne. */
      if (!noeud.parentNode || !document.contains(noeud)) { delete val.dataset.relRoule; return; }
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / duree);
      var e = 1 - Math.pow(1 - p, 3);
      noeud.nodeValue = f.avant + ecrire(de + (vers - de) * e, f.dec, f.groupe, f.virgule) + f.apres;
      if (p < 1) return requestAnimationFrame(pas);
      noeud.nodeValue = f.avant + ecrire(vers, f.dec, f.groupe, f.virgule) + f.apres;
      delete val.dataset.relRoule;
    }
    requestAnimationFrame(pas);
  }

  /* Relevé de la façon dont ce nombre-ci est écrit : espace fine ou
     insécable, virgule ou point, et les blancs qui l'entourent. */
  function facon(brut) {
    var g = brut.match(/\d([  \s])\d{3}/);
    var bords = brut.match(/^(\s*)[\s\S]*?(\s*)$/);
    return {
      groupe: g ? g[1] : '',
      virgule: brut.indexOf(',') >= 0 ? ',' : '.',
      dec: (brut.replace(/[  \s]/g, '').split(/[.,]/)[1] || '').length,
      avant: bords ? bords[1] : '',
      apres: bords ? bords[2] : ''
    };
  }

  function traiterChiffre(val, cle) {
    if (val.dataset.relRoule) return;   /* le chiffre affiché est le nôtre */
    var noeud = noeudChiffre(val);
    if (!noeud) return;
    var brut = noeud.nodeValue;
    var arrivee = lireNombre(brut);
    var connu = MEMOIRE[cle];
    MEMOIRE[cle] = arrivee;

    if (connu === arrivee) return;          /* rien n'a bougé */
    if (REDUIT) return;                     /* le système demande le calme */

    rouler(val, noeud, (typeof connu === 'number') ? connu : 0, arrivee, facon(brut));

    /* Le volet retombe depuis son arête haute : c'est ce point de
       pivot, et lui seul, qui évoque un tableau d'horaires plutôt
       qu'une carte qu'on retourne. */
    val.classList.remove('rel-bascule');
    void val.offsetWidth;
    val.classList.add('rel-bascule');
  }

  /* ───────────────────────────────────────────────────────────────
     L'INCLINAISON AU CURSEUR
     Un seul écouteur pour toute la console : les vues se redessinent
     sans arrêt, et rattacher des écouteurs à chaque carte à chaque
     cycle en laisserait des centaines derrière soi.
     ─────────────────────────────────────────────────────────────── */

  var courante = null, dernier = null, attend = false;

  function appliquer() {
    attend = false;
    var e = dernier;
    if (!e) return;
    var cible = (e.target && typeof e.target.closest === 'function')
      ? e.target.closest('[data-relief]') : null;

    if (cible !== courante) { relacher(courante); courante = cible; }
    if (!cible) return;

    var r = cible.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var px = (e.clientX - r.left) / r.width;
    var py = (e.clientY - r.top) / r.height;
    var max = /^menu/.test(cible.dataset.relief) ? ANGLE_MENU : ANGLE;

    cible.style.setProperty('--rx', ((0.5 - py) * 2 * max).toFixed(2) + 'deg');
    cible.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
    cible.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    cible.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    cible.classList.add('rel-tenu');
  }

  function relacher(el) {
    if (!el) return;
    el.classList.remove('rel-tenu');
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
  }

  if (FIN && !REDUIT) {
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      dernier = e;
      if (!attend) { attend = true; requestAnimationFrame(appliquer); }
    }, { passive: true });

    /* Le curseur sorti de la fenêtre ne déclenche plus rien : sans ce
       filet, la dernière carte survolée resterait inclinée. */
    document.addEventListener('pointerleave', function () { relacher(courante); courante = null; });
    window.addEventListener('blur', function () { relacher(courante); courante = null; });
    document.addEventListener('scroll', function () { relacher(courante); courante = null; }, { passive: true, capture: true });
  }

  /* ───────────────────────────────────────────────────────────────
     ÉQUIPER CE QUI VIENT D'APPARAÎTRE
     ─────────────────────────────────────────────────────────────── */

  /* Une console redessine sa vue entière à chaque rafraîchissement.
     L'entrée en cascade ne se justifie qu'au changement de vue —
     sinon les panneaux tomberaient du ciel toutes les dix secondes. */
  function vueCourante() {
    var a = document.querySelector('.side-item.active, .own-tab.active');
    return a ? (a.dataset.v || a.dataset.vue || a.textContent.trim()) : '·';
  }
  var vuePrecedente = null;

  function scene(el) {
    var p = el.parentElement;
    if (p && !p.classList.contains('rel-scene')) p.classList.add('rel-scene');
  }

  function marquer(sel, genre, sansScene) {
    var l = document.querySelectorAll(sel), n = 0;
    for (var i = 0; i < l.length; i++) {
      if (l[i].dataset.relief) continue;
      l[i].dataset.relief = genre;
      if (!sansScene) scene(l[i]);
      n++;
    }
    return n;
  }

  function poser(sel, neuve) {
    var l = document.querySelectorAll(sel);
    for (var i = 0; i < l.length; i++) {
      if (l[i].dataset.relPose) continue;
      l[i].dataset.relPose = '1';
      if (REDUIT || !neuve) continue;
      l[i].style.setProperty('--i', Math.min(i, 7));
      l[i].classList.add('rel-pose');
    }
  }

  function equiper() {
    var vue = vueCourante();
    var neuve = vue !== vuePrecedente;
    vuePrecedente = vue;

    marquer('.kpi', 'carte');
    marquer('.pl-seg', 'carte');
    marquer('.mod-carte', 'carte');
    marquer('.side-item', 'menu');
    /* L'espace des familles n'a ni tuiles ni colonne de menu : ses
       cartes de commande et ses onglets jouent ces deux rôles. Sans
       ces deux lignes, le quatrième espace restait plat.

       Ils portent leur perspective eux-mêmes : la fenêtre « Nous
       écrire » est une couche `position: fixed` rendue à l'intérieur
       du même conteneur, et une perspective au-dessus d'elle la
       décrocherait du plein écran pour la caler sur ce conteneur. */
    marquer('.esp-carte', 'seule', true);
    marquer('.esp-onglet', 'menu-seul', true);

    poser('.kpi', neuve);
    poser('.panel', neuve);
    poser('.esp-carte', neuve);

    /* Le libellé identifie la tuile bien mieux que sa position : une
       console qui réordonne ses tuiles ferait autrement basculer des
       chiffres qui n'ont pas changé. */
    var vals = document.querySelectorAll('.kpi-value');
    for (var i = 0; i < vals.length; i++) {
      var t = vals[i].parentElement ? vals[i].parentElement.querySelector('.kpi-label') : null;
      traiterChiffre(vals[i], vue + '·' + (t ? t.textContent.trim() : i));
    }
  }

  /* Une classe d'animation qui reste accrochée après coup finit par se
     rejouer : il suffit qu'un bout de code recopie le fragment. On la
     retire dès que le mouvement est fini. */
  document.addEventListener('animationend', function (e) {
    if (e.animationName === 'relVolet') e.target.classList.remove('rel-bascule');
    else if (e.animationName === 'relPose') e.target.classList.remove('rel-pose');
  }, true);

  var enAttente = false;
  function planifier() {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(function () { enAttente = false; equiper(); });
  }

  function demarrer() {
    var hote = document.querySelector('.dash') || document.getElementById('esp-root') || document.body;
    if (!hote) return;
    equiper();
    if (!window.MutationObserver) return;
    /* On n'observe que la structure : les valeurs roulent en modifiant
       du texte, et s'observer soi-même tournerait en boucle. */
    new MutationObserver(planifier).observe(hote, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();

  window.MelodiaRelief = { equiper: planifier };
})();
