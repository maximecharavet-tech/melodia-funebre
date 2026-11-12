/* ═══════════════════════════════════════════════════════════════
   lumiere-3d.js — Un seul geste en trois dimensions (three.js, MIT)

   Une médaille sombre, posée dans la pénombre, cerclée d'un filet d'or.
   Une lumière chaude passe lentement sur sa tranche, comme celle d'une
   bougie qu'on déplace. Rien d'autre : pas de particules, pas de
   caméra qui virevolte, pas d'interaction à découvrir.

   QUAND IL NE SE PASSE RIEN (et c'est voulu)

   Le conteneur [data-lumiere-3d] porte déjà, en CSS, une version fixe
   du même motif (dégradé sombre et anneau d'un pixel). La 3D ne
   s'ajoute que si tout est réuni :
     · écran large (≥ 900 px) et pointeur précis ;
     · pas de réduction des animations, pas d'économie de données ;
     · au moins 4 cœurs, et 4 Go de mémoire quand le navigateur le dit ;
     · WebGL disponible ;
     · le conteneur approche de l'écran.
   Sinon, la version fixe reste — et elle suffit.

   La bibliothèque (≈ 135 Ko compressés) n'est téléchargée qu'à ce
   moment-là, jamais au premier affichage, jamais sur mobile, jamais
   mise en cache par le travailleur de service. Le rendu s'arrête quand
   le conteneur sort de l'écran ou que l'onglet passe en arrière-plan.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var hotes = document.querySelectorAll('[data-lumiere-3d]');
  if (!hotes.length || !('IntersectionObserver' in window)) return;

  var mm = function (q) { return window.matchMedia(q).matches; };
  var nav = navigator;
  var reseau = nav.connection || {};
  var apte = mm('(min-width: 900px)') && mm('(pointer: fine)') &&
    !mm('(prefers-reduced-motion: reduce)') && !reseau.saveData &&
    (nav.hardwareConcurrency || 2) >= 4 && (!nav.deviceMemory || nav.deviceMemory >= 4);
  if (!apte) return;

  try {
    var essai = document.createElement('canvas');
    if (!(essai.getContext('webgl2') || essai.getContext('webgl'))) return;
  } catch (e) { return; }

  var SOURCE = '/assets/js/vendor/three-melodia-0.187.min.js';
  var promesse = null;
  function three() { return promesse || (promesse = import(SOURCE)); }

  Array.prototype.forEach.call(hotes, function (hote) {
    var vu = new IntersectionObserver(function (entrees) {
      if (!entrees[0].isIntersecting) return;
      vu.disconnect();
      var lancer = function () { three().then(function (T) { monter(T, hote); }).catch(function () {}); };
      if ('requestIdleCallback' in window) window.requestIdleCallback(lancer, { timeout: 2500 });
      else setTimeout(lancer, 600);
    }, { rootMargin: '200px' });
    vu.observe(hote);
  });

  function monter(T, hote) {
    var largeur = hote.clientWidth, haut = hote.clientHeight;
    if (!largeur || !haut) return;

    var rendu;
    try {
      rendu = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) { return; }
    rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    rendu.setSize(largeur, haut, false);
    rendu.outputColorSpace = T.SRGBColorSpace;
    rendu.toneMapping = T.ACESFilmicToneMapping;
    rendu.toneMappingExposure = 0.9;
    var toile = rendu.domElement;
    toile.className = 'l3d-toile';
    toile.setAttribute('aria-hidden', 'true');
    hote.appendChild(toile);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(32, largeur / haut, 0.1, 50);
    camera.position.set(0, 0.15, 6.2);

    var medaille = new T.Group();
    scene.add(medaille);

    /* La matière : une pierre sombre, à peine métallique (charte #101018). */
    var pierre = new T.Mesh(
      new T.CylinderGeometry(1.25, 1.25, 0.16, 96, 1),
      new T.MeshStandardMaterial({ color: new T.Color('#1a1a24'), metalness: 0.25, roughness: 0.5 })
    );
    pierre.rotation.x = Math.PI / 2;
    medaille.add(pierre);

    /* Le filet d'or : un anneau d'épaisseur quasi nulle. Jamais un aplat. */
    var filet = new T.Mesh(
      new T.TorusGeometry(1.42, 0.006, 8, 220),
      new T.MeshBasicMaterial({ color: new T.Color('#c9a84c'), transparent: true, opacity: 0.85 })
    );
    medaille.add(filet);
    var filet2 = new T.Mesh(
      new T.TorusGeometry(1.31, 0.003, 8, 220),
      new T.MeshBasicMaterial({ color: new T.Color('#97803c'), transparent: true, opacity: 0.6 })
    );
    medaille.add(filet2);

    /* La lumière : très peu d'ambiance, une clé froide, une flamme qui passe. */
    scene.add(new T.AmbientLight(0xf2efe8, 0.12));
    var cle = new T.DirectionalLight(0xf2efe8, 0.35);
    cle.position.set(-3, 2, 4);
    scene.add(cle);
    var flamme = new T.PointLight(0xe3c977, 16, 10, 2);
    scene.add(flamme);

    medaille.rotation.y = -0.35;
    medaille.rotation.x = 0.12;

    var actif = false, visible = true, t0 = performance.now(), idAnim = 0;
    function image(maintenant) {
      if (!actif) return;
      var t = (maintenant - t0) / 1000;
      /* Une révolution de lumière toutes les quarante secondes. */
      var a = t * (Math.PI * 2 / 40);
      flamme.position.set(Math.cos(a) * 2.6, 0.6 + Math.sin(a * 0.5) * 0.4, 1.6 + Math.sin(a) * 1.2);
      medaille.rotation.y = -0.35 + Math.sin(t * 0.05) * 0.18;
      rendu.render(scene, camera);
      idAnim = requestAnimationFrame(image);
    }
    function etat() {
      var doit = visible && !document.hidden;
      if (doit && !actif) { actif = true; idAnim = requestAnimationFrame(image); }
      else if (!doit && actif) { actif = false; cancelAnimationFrame(idAnim); }
    }
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; etat(); }).observe(hote);
    document.addEventListener('visibilitychange', etat);
    window.addEventListener('resize', function () {
      var l = hote.clientWidth, h = hote.clientHeight;
      if (!l || !h) return;
      camera.aspect = l / h; camera.updateProjectionMatrix();
      rendu.setSize(l, h, false);
    });

    rendu.render(scene, camera);
    hote.classList.add('l3d-actif');
    etat();
  }
})();
