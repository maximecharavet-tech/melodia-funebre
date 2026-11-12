// Thème choisi, appliqué avant le premier affichage (pas de flash clair/sombre).
// « auto » suit le réglage du système ; le choix est gardé sur l'appareil.
(function () {
  try {
    var choix = localStorage.getItem('melodia_pro_theme') || 'auto';
    var clair = choix === 'light' || (choix === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    document.documentElement.setAttribute('data-theme', clair ? 'light' : 'dark');
    var m = JSON.parse(localStorage.getItem('melodia_pro_marque') || 'null');
    var T = { bleu: ['#7da3d9', '#2d5a99'], vert: ['#8cbf9e', '#2b6a45'], rose: ['#d99aa6', '#9a3f55'], lavande: ['#a99ae0', '#5a449c'], cuivre: ['#d49a6a', '#8f4f1e'] };
    if (m && T[m.accent]) document.documentElement.style.setProperty('--accent', T[m.accent][clair ? 1 : 0]);
  } catch (e) { document.documentElement.setAttribute('data-theme', 'dark'); }
})();
