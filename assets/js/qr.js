/* ═══════════════════════════════════════════════════════════════
   qr.js — Un encodeur de QR code, écrit ici

   POURQUOI PAS UN SERVICE EXTÉRIEUR

   Le QR d'une plaque part chez un graveur et sera scellé sur une
   tombe pour vingt ans. Trois raisons de ne le confier à personne :

   • Un appel à une API d'images fait transiter l'adresse du mémorial
     — donc le nom d'un défunt — chez un tiers, sans nécessité.
   • Le jour où ce service ferme ou change d'adresse, la console ne
     sait plus produire une plaque. Le granit, lui, est déjà posé.
   • Il faut du vectoriel à la résolution du graveur, pas une image
     de 200 pixels redimensionnée.

   CE QU'IL FAIT

   Mode octet, versions 1 à 10, les quatre niveaux de correction.
   Assez pour une adresse courte — et l'adresse d'un mémorial fait
   cinquante-deux caractères.

   LE NIVEAU DE CORRECTION

   Par défaut « H » : trente pour cent du code peut être illisible
   sans que le scan échoue. Sur un écran ce serait du gaspillage ;
   sur une plaque exposée à la pluie, aux lichens et aux doigts, c'est
   la différence entre un QR qui fonctionne encore dans dix ans et une
   famille devant un carré muet.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── Corps de Galois GF(256), polynôme primitif 0x11D ─── */
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1; if (x & 0x100) x ^= 0x11d;
    }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function mul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  /* Polynôme générateur de Reed-Solomon pour n symboles de contrôle */
  function generateur(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var suivant = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) {
        suivant[j] ^= g[j];
        suivant[j + 1] ^= mul(g[j], EXP[i]);
      }
      g = suivant;
    }
    return g;
  }

  function controle(donnees, n) {
    var g = generateur(n);
    var reste = new Array(donnees.length + n).fill(0);
    for (var i = 0; i < donnees.length; i++) reste[i] = donnees[i];
    for (i = 0; i < donnees.length; i++) {
      var f = reste[i];
      if (!f) continue;
      for (var j = 0; j < g.length; j++) reste[i + j] ^= mul(g[j], f);
    }
    return reste.slice(donnees.length);
  }

  /* ─── Tables de la norme (ISO/IEC 18004) ───
     Par version et par niveau : [contrôle par bloc, blocs du groupe 1,
     octets de données du groupe 1, blocs du groupe 2, octets du
     groupe 2]. Aucune formule ne les remplace, elles sont tabulaires.
     Versions 1 à 10 : la dixième tient déjà cent dix-neuf octets en
     correction maximale, très au-delà d'une adresse de mémorial. */
  var BLOCS = {
    L: [[7,1,19,0,0],[10,1,34,0,0],[15,1,55,0,0],[20,1,80,0,0],[26,1,108,0,0],
        [18,2,68,0,0],[20,2,78,0,0],[24,2,97,0,0],[30,2,116,0,0],[18,2,68,2,69]],
    M: [[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],
        [16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44]],
    Q: [[13,1,13,0,0],[22,1,22,0,0],[18,2,17,0,0],[26,2,24,0,0],[18,2,15,2,16],
        [24,4,19,0,0],[18,2,14,4,15],[22,4,18,2,19],[20,4,16,4,17],[24,6,19,2,20]],
    H: [[17,1,9,0,0],[28,1,16,0,0],[22,2,13,0,0],[16,4,9,0,0],[22,2,11,2,12],
        [28,4,15,0,0],[26,4,13,1,14],[26,4,14,2,15],[24,4,12,4,13],[28,6,15,2,16]]
  };
  var TOTAL = [26,44,70,100,134,172,196,242,292,346];
  var ALIGNEMENTS = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
  var INDICATEUR = { L: 1, M: 0, Q: 3, H: 2 };

  function capacite(version, niveau) {
    var b = BLOCS[niveau][version - 1];
    return b[1] * b[2] + b[3] * b[4];
  }

  /* ─── Le flot binaire ─── */
  function Bits() { this.o = []; }
  Bits.prototype.pousser = function (valeur, n) {
    for (var i = n - 1; i >= 0; i--) this.o.push((valeur >>> i) & 1);
  };

  function octets(texte) {
    /* Toujours en UTF-8 : un nom avec accent dans l'adresse doit
       survivre au trajet jusqu'au lecteur du téléphone. */
    var s = unescape(encodeURIComponent(texte)), o = [];
    for (var i = 0; i < s.length; i++) o.push(s.charCodeAt(i) & 0xff);
    return o;
  }

  function encoder(texte, niveau, versionMin) {
    var donnees = octets(texte);
    var version = 0;
    for (var v = Math.max(1, versionMin || 1); v <= 10; v++) {
      var enTete = 4 + (v < 10 ? 8 : 16);
      if (donnees.length + Math.ceil(enTete / 8) <= capacite(v, niveau)) { version = v; break; }
    }
    if (!version) throw new Error('Adresse trop longue pour un QR code de cette taille.');

    var cap = capacite(version, niveau);
    var b = new Bits();
    b.pousser(4, 4);                                   /* mode octet */
    b.pousser(donnees.length, version < 10 ? 8 : 16);
    for (var i = 0; i < donnees.length; i++) b.pousser(donnees[i], 8);
    /* Terminateur, puis on complète jusqu'à l'octet */
    var reste = cap * 8 - b.o.length;
    b.pousser(0, Math.min(4, reste));
    while (b.o.length % 8) b.o.push(0);
    /* Remplissage réglementaire : 11101100 puis 00010001, en alternance */
    var bourre = [0xec, 0x11], k = 0;
    var mots = [];
    for (i = 0; i < b.o.length; i += 8) {
      var n = 0;
      for (var j = 0; j < 8; j++) n = (n << 1) | b.o[i + j];
      mots.push(n);
    }
    while (mots.length < cap) mots.push(bourre[k++ % 2]);

    /* ─── Découpe en blocs, contrôle, entrelacement ─── */
    var t = BLOCS[niveau][version - 1];
    var parBloc = t[0], g1 = t[1], d1 = t[2], g2 = t[3], d2 = t[4];
    var blocsD = [], blocsC = [], p = 0;
    for (i = 0; i < g1; i++) { blocsD.push(mots.slice(p, p + d1)); p += d1; }
    for (i = 0; i < g2; i++) { blocsD.push(mots.slice(p, p + d2)); p += d2; }
    for (i = 0; i < blocsD.length; i++) blocsC.push(controle(blocsD[i], parBloc));

    var flot = [];
    var maxD = Math.max(d1, d2);
    for (i = 0; i < maxD; i++)
      for (j = 0; j < blocsD.length; j++)
        if (i < blocsD[j].length) flot.push(blocsD[j][i]);
    for (i = 0; i < parBloc; i++)
      for (j = 0; j < blocsC.length; j++) flot.push(blocsC[j][i]);

    return { version: version, niveau: niveau, flot: flot };
  }

  /* ─── La trame ─── */
  function trame(version) {
    var n = 17 + version * 4;
    var m = [], reserve = [];
    for (var i = 0; i < n; i++) { m.push(new Array(n).fill(0)); reserve.push(new Array(n).fill(0)); }

    function poser(r, c, v) { m[r][c] = v; reserve[r][c] = 1; }

    /* Repères d'angle et leur séparateur */
    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(function (o) {
      for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) {
        var y = o[0] + r, x = o[1] + c;
        if (y < 0 || x < 0 || y >= n || x >= n) continue;
        var dedans = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                     (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                     (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        poser(y, x, dedans ? 1 : 0);
      }
    });

    /* Repères d'alignement */
    var a = ALIGNEMENTS[version - 1];
    for (var i1 = 0; i1 < a.length; i1++) for (var j1 = 0; j1 < a.length; j1++) {
      var cy = a[i1], cx = a[j1];
      if (reserve[cy][cx]) continue;
      for (var r2 = -2; r2 <= 2; r2++) for (var c2 = -2; c2 <= 2; c2++)
        poser(cy + r2, cx + c2, (Math.abs(r2) === 2 || Math.abs(c2) === 2 || (r2 === 0 && c2 === 0)) ? 1 : 0);
    }

    /* Lignes de cadence */
    for (i = 8; i < n - 8; i++) { poser(6, i, i % 2 === 0 ? 1 : 0); poser(i, 6, i % 2 === 0 ? 1 : 0); }
    /* Module toujours noir */
    poser(4 * version + 9, 8, 1);

    /* Emplacements réservés au format */
    for (i = 0; i <= 8; i++) { if (!reserve[8][i]) reserve[8][i] = 1; if (!reserve[i][8]) reserve[i][8] = 1; }
    for (i = 0; i < 8; i++) { reserve[8][n - 1 - i] = 1; reserve[n - 1 - i][8] = 1; }
    /* et à la version, à partir de la septième */
    if (version >= 7) {
      for (i = 0; i < 6; i++) for (var j2 = 0; j2 < 3; j2++) {
        reserve[n - 11 + j2][i] = 1; reserve[i][n - 11 + j2] = 1;
      }
    }
    return { m: m, reserve: reserve, n: n };
  }

  /* Le remplissage en zigzag, depuis le coin bas-droit, deux colonnes
     à la fois, en sautant la colonne de cadence. */
  function remplir(t, flot) {
    var n = t.n, bit = 0, total = flot.length * 8;
    var lire = function () {
      if (bit >= total) return 0;
      var v = (flot[bit >> 3] >>> (7 - (bit & 7))) & 1;
      bit++; return v;
    };
    var montant = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (var k = 0; k < n; k++) {
        var r = montant ? n - 1 - k : k;
        for (var d = 0; d < 2; d++) {
          var c = col - d;
          if (t.reserve[r][c]) continue;
          t.m[r][c] = lire();
        }
      }
      montant = !montant;
    }
  }

  var MASQUES = [
    function (i, j) { return (i + j) % 2 === 0; },
    function (i) { return i % 2 === 0; },
    function (i, j) { return j % 3 === 0; },
    function (i, j) { return (i + j) % 3 === 0; },
    function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; },
    function (i, j) { return (i * j) % 2 + (i * j) % 3 === 0; },
    function (i, j) { return ((i * j) % 2 + (i * j) % 3) % 2 === 0; },
    function (i, j) { return ((i + j) % 2 + (i * j) % 3) % 2 === 0; }
  ];

  /* Les quatre pénalités de la norme : on retient le masque qui donne
     le motif le moins piégeux pour un lecteur. */
  function penalite(m, n) {
    var p = 0, i, j, k, c;
    for (i = 0; i < n; i++) {
      for (var sens = 0; sens < 2; sens++) {
        var suite = 1, prec = -1;
        for (j = 0; j < n; j++) {
          var v = sens ? m[j][i] : m[i][j];
          if (v === prec) { suite++; if (suite === 5) p += 3; else if (suite > 5) p += 1; }
          else { suite = 1; prec = v; }
        }
      }
    }
    for (i = 0; i < n - 1; i++) for (j = 0; j < n - 1; j++) {
      var s = m[i][j] + m[i][j + 1] + m[i + 1][j] + m[i + 1][j + 1];
      if (s === 0 || s === 4) p += 3;
    }
    var MOTIF = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    var MOTIF2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    for (i = 0; i < n; i++) for (j = 0; j + 11 <= n; j++) {
      var okA = true, okB = true, okC = true, okD = true;
      for (k = 0; k < 11; k++) {
        if (m[i][j + k] !== MOTIF[k]) okA = false;
        if (m[i][j + k] !== MOTIF2[k]) okB = false;
        if (m[j + k][i] !== MOTIF[k]) okC = false;
        if (m[j + k][i] !== MOTIF2[k]) okD = false;
      }
      if (okA) p += 40; if (okB) p += 40; if (okC) p += 40; if (okD) p += 40;
    }
    var noirs = 0;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) noirs += m[i][j];
    p += Math.floor(Math.abs(noirs * 100 / (n * n) - 50) / 5) * 10;
    return p;
  }

  function bchFormat(v) {
    var d = v << 10;
    for (var i = 14; i >= 10; i--) if ((d >>> i) & 1) d ^= 0x537 << (i - 10);
    return ((v << 10) | d) ^ 0x5412;
  }
  function bchVersion(v) {
    var d = v << 12;
    for (var i = 17; i >= 12; i--) if ((d >>> i) & 1) d ^= 0x1f25 << (i - 12);
    return (v << 12) | d;
  }

  function poserFormat(m, n, niveau, masque) {
    var f = bchFormat((INDICATEUR[niveau] << 3) | masque);
    for (var i = 0; i < 15; i++) {
      var bit = (f >>> i) & 1;
      if (i < 6) m[i][8] = bit;
      else if (i === 6) m[7][8] = bit;
      else if (i === 7) m[8][8] = bit;
      else if (i === 8) m[8][7] = bit;
      else m[8][14 - i] = bit;

      if (i < 8) m[8][n - 1 - i] = bit;
      else m[n - 15 + i][8] = bit;
    }
    m[n - 8][8] = 1;
  }

  function poserVersion(m, n, version) {
    if (version < 7) return;
    var v = bchVersion(version);
    for (var i = 0; i < 18; i++) {
      var bit = (v >>> i) & 1;
      var r = Math.floor(i / 3), c = i % 3;
      m[n - 11 + c][r] = bit;
      m[r][n - 11 + c] = bit;
    }
  }

  /* ─── L'entrée publique ─── */
  function matrice(texte, options) {
    options = options || {};
    var niveau = options.niveau || 'H';
    if (!BLOCS[niveau]) throw new Error('Niveau de correction inconnu : ' + niveau);
    var e = encoder(texte, niveau, options.versionMin);
    var t = trame(e.version);
    remplir(t, e.flot);

    var meilleur = null;
    for (var k = 0; k < 8; k++) {
      var essai = [];
      for (var i = 0; i < t.n; i++) essai.push(t.m[i].slice());
      for (i = 0; i < t.n; i++) for (var j = 0; j < t.n; j++)
        if (!t.reserve[i][j] && MASQUES[k](i, j)) essai[i][j] ^= 1;
      poserFormat(essai, t.n, niveau, k);
      poserVersion(essai, t.n, e.version);
      var p = penalite(essai, t.n);
      if (!meilleur || p < meilleur.p) meilleur = { m: essai, p: p, k: k };
    }
    return { modules: meilleur.m, taille: t.n, version: e.version, niveau: niveau, masque: meilleur.k };
  }

  /* ─── Rendu vectoriel ───
     Un seul chemin pour tous les modules : c'est ce que les graveurs
     et les découpeuses attendent, et le fichier reste minuscule. La
     marge de quatre modules est exigée par la norme — sans elle,
     beaucoup de lecteurs échouent. */
  function svg(texte, options) {
    options = options || {};
    var q = matrice(texte, options);
    var marge = options.marge == null ? 4 : options.marge;
    var cote = q.taille + marge * 2;
    var d = '';
    for (var i = 0; i < q.taille; i++) {
      for (var j = 0; j < q.taille; j++) {
        if (!q.modules[i][j]) continue;
        d += 'M' + (j + marge) + ' ' + (i + marge) + 'h1v1h-1z';
      }
    }
    var fond = options.fond || '#ffffff';
    var encre = options.encre || '#000000';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + cote + ' ' + cote + '" ' +
      'shape-rendering="crispEdges" role="img" aria-label="' +
      (options.titre || 'QR code').replace(/[<>&"]/g, '') + '">' +
      (fond === 'none' ? '' : '<rect width="' + cote + '" height="' + cote + '" fill="' + fond + '"/>') +
      '<path fill="' + encre + '" d="' + d + '"/></svg>';
  }

  /* Rendu en pixels, pour l'aperçu à l'écran et l'export à la
     résolution du graveur. « pixelsParModule » entier : un module à
     virgule donne des bords flous que les lecteurs peinent à lire. */
  function canevas(texte, options) {
    options = options || {};
    var q = matrice(texte, options);
    var marge = options.marge == null ? 4 : options.marge;
    var cote = q.taille + marge * 2;
    var pas = Math.max(1, Math.floor((options.taille || 512) / cote));
    var px = cote * pas;
    var c = document.createElement('canvas');
    c.width = px; c.height = px;
    var g = c.getContext('2d');
    g.fillStyle = options.fond || '#ffffff';
    g.fillRect(0, 0, px, px);
    g.fillStyle = options.encre || '#000000';
    for (var i = 0; i < q.taille; i++) for (var j = 0; j < q.taille; j++)
      if (q.modules[i][j]) g.fillRect((j + marge) * pas, (i + marge) * pas, pas, pas);
    return { canevas: c, info: q };
  }

  window.MelodiaQR = { matrice: matrice, svg: svg, canevas: canevas, capacite: capacite };
})();
