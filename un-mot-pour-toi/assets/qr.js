/* ═══════════════════════════════════════════════════════════════
   UN MOT POUR TOI — le fabricant de QR code

   POURQUOI CE FICHIER EXISTE PLUTÔT QU'UNE BIBLIOTHÈQUE

   Le QR part à l'imprimante et finit collé sur une carte qu'on
   offre. Une fois le papier distribué, on ne corrige rien. Le code
   est donc écrit ici, lisible, plutôt que tiré d'un paquet npm de
   provenance incertaine — et surtout il est VÉRIFIÉ : le script
   scripts/verifier-qr.mjs compare chaque module produit ici à ceux
   de « segno », un encodeur Python éprouvé et indépendant. Les deux
   doivent tomber d'accord sur la totalité de la matrice.

   CE QU'IL SAIT FAIRE, ET CE QU'IL NE SAIT PAS

   Mode « octet » uniquement, versions 1 à 10, correction M (15 %
   des modules peuvent être abîmés sans perte). C'est très au-delà
   du besoin : une adresse de cette application fait une soixantaine
   de caractères, ce qui tient en version 3. Les modes numérique et
   alphanumérique, qui compressent mieux, ne sont pas implémentés —
   ils ne serviraient à rien ici et doubleraient la surface à
   vérifier.

   LA CORRECTION M PLUTÔT QUE L : un QR imprimé sur une carte passe
   de main en main, se plie, prend le café. Quinze pour cent de
   tolérance, c'est ce qui fait qu'il se lit encore six mois plus
   tard.
   ═══════════════════════════════════════════════════════════════ */
(function (racine) {
  'use strict';

  /* ─── Le corps fini GF(256) ───
     L'arithmétique des codes de Reed-Solomon se fait dans un corps à
     256 éléments : additionner, c'est faire un OU exclusif ;
     multiplier, c'est additionner des logarithmes. On tabule les
     deux une fois pour toutes. Le polynôme générateur du corps est
     0x11D, imposé par la norme. */
  var EXP = new Uint8Array(512);
  var LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function mul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  /* Le polynôme générateur pour n symboles de correction :
     (x - α⁰)(x - α¹)…(x - αⁿ⁻¹), développé. */
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

  /* La division polynomiale qui produit les symboles de correction :
     le reste de (données · xⁿ) divisé par le générateur. */
  function correction(donnees, n) {
    var g = generateur(n);
    var reste = new Array(donnees.length + n).fill(0);
    for (var i = 0; i < donnees.length; i++) reste[i] = donnees[i];
    for (var k = 0; k < donnees.length; k++) {
      var coef = reste[k];
      if (coef === 0) continue;
      for (var j = 0; j < g.length; j++) reste[k + j] ^= mul(g[j], coef);
    }
    return reste.slice(donnees.length);
  }

  /* ─── Les tables de la norme ───
     Pour chaque version en correction M : nombre total d'octets de
     correction, puis la répartition en blocs. Recopier ces nombres
     est la seule façon de les avoir : ils ne se déduisent d'aucune
     formule. C'est aussi pourquoi la vérification contre segno n'est
     pas un luxe — une ligne fausse ici donne un QR qui ne se lit
     pas, sans que rien ne le signale. */
  var VERSIONS = {
    /*      octets de correction par bloc, [groupe1: blocs, données], [groupe2: blocs, données] */
    1:  { ec: 10, blocs: [[1, 16]] },
    2:  { ec: 16, blocs: [[1, 28]] },
    3:  { ec: 26, blocs: [[1, 44]] },
    4:  { ec: 18, blocs: [[2, 32]] },
    5:  { ec: 24, blocs: [[2, 43]] },
    6:  { ec: 16, blocs: [[4, 27]] },
    7:  { ec: 18, blocs: [[4, 31]] },
    8:  { ec: 22, blocs: [[2, 38], [2, 39]] },
    /* 3 blocs de 36 et DEUX de 37, pas trois : 3×36 + 2×37 = 182
       octets de données, ce qui avec 5×22 de correction fait les 292
       de la version 9. Avec trois blocs de 37 on tombait à 219
       octets de données — vingt-sept de trop, et un QR illisible.
       C'est exactement le genre d'erreur que la comparaison à segno
       existe pour attraper. */
    9:  { ec: 22, blocs: [[3, 36], [2, 37]] },
    10: { ec: 26, blocs: [[4, 43], [1, 44]] }
  };

  /* Les centres des motifs d'alignement, par version. La version 1
     n'en a pas. */
  var ALIGNEMENT = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };

  function capacite(v) {
    var d = VERSIONS[v];
    var total = 0;
    d.blocs.forEach(function (b) { total += b[0] * b[1]; });
    return total;
  }

  /* ─── Le flux binaire ─── */
  function Bits() { this.bits = []; }
  Bits.prototype.pousser = function (valeur, longueur) {
    for (var i = longueur - 1; i >= 0; i--) this.bits.push((valeur >>> i) & 1);
  };
  Bits.prototype.octets = function () {
    var out = [];
    for (var i = 0; i < this.bits.length; i += 8) {
      var o = 0;
      for (var j = 0; j < 8; j++) o = (o << 1) | (this.bits[i + j] || 0);
      out.push(o);
    }
    return out;
  };

  function utf8(texte) {
    var out = [];
    var brut = unescape(encodeURIComponent(texte));
    for (var i = 0; i < brut.length; i++) out.push(brut.charCodeAt(i) & 0xFF);
    return out;
  }

  /* ─── Les données, mises en forme puis protégées ─── */
  function encoderDonnees(texte, version) {
    var octets = utf8(texte);
    var cap = capacite(version);
    var b = new Bits();
    b.pousser(0b0100, 4);                                   /* mode octet */
    b.pousser(octets.length, version < 10 ? 8 : 16);        /* compteur */
    octets.forEach(function (o) { b.pousser(o, 8); });
    /* Terminateur : jusqu'à quatre zéros, pas plus que la place restante. */
    var reste = cap * 8 - b.bits.length;
    b.pousser(0, Math.min(4, reste));
    while (b.bits.length % 8 !== 0) b.bits.push(0);
    /* Remplissage : deux octets qui alternent, imposés par la norme. */
    var mots = b.octets();
    var bourre = [0xEC, 0x11];
    for (var i = 0; mots.length < cap; i++) mots.push(bourre[i % 2]);

    /* Découpage en blocs, correction bloc par bloc, puis entrelacement :
       une tache d'encre abîme alors un octet de chaque bloc plutôt que
       tout un bloc, et chaque bloc reste réparable. */
    var d = VERSIONS[version];
    var blocsDonnees = [], blocsCorrection = [], curseur = 0;
    d.blocs.forEach(function (groupe) {
      for (var n = 0; n < groupe[0]; n++) {
        var part = mots.slice(curseur, curseur + groupe[1]);
        curseur += groupe[1];
        blocsDonnees.push(part);
        blocsCorrection.push(correction(part, d.ec));
      }
    });

    var sortie = [];
    var maxD = Math.max.apply(null, blocsDonnees.map(function (x) { return x.length; }));
    for (var i2 = 0; i2 < maxD; i2++) {
      for (var k = 0; k < blocsDonnees.length; k++) {
        if (i2 < blocsDonnees[k].length) sortie.push(blocsDonnees[k][i2]);
      }
    }
    for (var i3 = 0; i3 < d.ec; i3++) {
      for (var k2 = 0; k2 < blocsCorrection.length; k2++) sortie.push(blocsCorrection[k2][i3]);
    }
    return sortie;
  }

  /* ─── La matrice ───
     « reserve » distingue les modules de structure (motifs, timing,
     zones d'information) des modules de données : le masque ne doit
     jamais toucher aux premiers. */
  function matriceVide(taille) {
    var m = [], r = [];
    for (var i = 0; i < taille; i++) {
      m.push(new Array(taille).fill(0));
      r.push(new Array(taille).fill(false));
    }
    return { m: m, r: r };
  }

  function poserMotifs(g, version) {
    var n = g.m.length;

    function finder(li, co) {
      for (var y = -1; y <= 7; y++) {
        for (var x = -1; x <= 7; x++) {
          var ly = li + y, lx = co + x;
          if (ly < 0 || ly >= n || lx < 0 || lx >= n) continue;
          var dedans = (y >= 0 && y <= 6 && (x === 0 || x === 6)) ||
                       (x >= 0 && x <= 6 && (y === 0 || y === 6)) ||
                       (y >= 2 && y <= 4 && x >= 2 && x <= 4);
          g.m[ly][lx] = dedans ? 1 : 0;
          g.r[ly][lx] = true;
        }
      }
    }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);

    /* Les lignes de synchronisation : un module sur deux. */
    for (var i = 8; i < n - 8; i++) {
      var v = i % 2 === 0 ? 1 : 0;
      g.m[6][i] = v; g.r[6][i] = true;
      g.m[i][6] = v; g.r[i][6] = true;
    }

    /* Les motifs d'alignement, sauf là où ils chevaucheraient un
       motif de repérage. */
    var centres = ALIGNEMENT[version];
    for (var a = 0; a < centres.length; a++) {
      for (var b = 0; b < centres.length; b++) {
        var cy = centres[a], cx = centres[b];
        var coin = (cy <= 8 && cx <= 8) || (cy <= 8 && cx >= n - 9) || (cy >= n - 9 && cx <= 8);
        if (coin) continue;
        for (var y2 = -2; y2 <= 2; y2++) {
          for (var x2 = -2; x2 <= 2; x2++) {
            var plein = Math.max(Math.abs(y2), Math.abs(x2)) !== 1;
            g.m[cy + y2][cx + x2] = plein ? 1 : 0;
            g.r[cy + y2][cx + x2] = true;
          }
        }
      }
    }

    /* Le module toujours noir, et les emplacements réservés au format. */
    g.m[n - 8][8] = 1; g.r[n - 8][8] = true;
    for (var k = 0; k <= 8; k++) {
      if (!g.r[8][k]) { g.r[8][k] = true; g.m[8][k] = 0; }
      if (!g.r[k][8]) { g.r[k][8] = true; g.m[k][8] = 0; }
    }
    for (var k2 = 0; k2 < 8; k2++) {
      g.r[8][n - 1 - k2] = true;
      g.r[n - 1 - k2][8] = true;
    }

    /* À partir de la version 7, un bloc d'information de version
       occupe deux rectangles supplémentaires. */
    if (version >= 7) {
      var bits = infoVersion(version);
      for (var i4 = 0; i4 < 18; i4++) {
        var bit = (bits >> i4) & 1;
        var li = Math.floor(i4 / 3), co = i4 % 3;
        g.m[li][n - 11 + co] = bit; g.r[li][n - 11 + co] = true;
        g.m[n - 11 + co][li] = bit; g.r[n - 11 + co][li] = true;
      }
    }
  }

  /* Le code correcteur BCH(18,6) de l'information de version. */
  function infoVersion(v) {
    var reste = v << 12;
    for (var i = 0; i < 12; i++) {
      if (reste & (1 << (17 - i))) reste ^= 0x1F25 << (5 - i);
    }
    return (v << 12) | (reste & 0xFFF);
  }

  /* Le code correcteur BCH(15,5) de l'information de format, puis le
     masque 0x5412 imposé par la norme — sans lui, un format tout à
     zéro donnerait quinze modules blancs indiscernables du fond. */
  function infoFormat(niveau, masque) {
    var donnee = (niveau << 3) | masque;
    var reste = donnee << 10;
    for (var i = 0; i < 5; i++) {
      if (reste & (1 << (14 - i))) reste ^= 0x537 << (4 - i);
    }
    return ((donnee << 10) | (reste & 0x3FF)) ^ 0x5412;
  }

  function poserFormat(g, masque) {
    var n = g.m.length;
    var bits = infoFormat(0b00, masque);   /* 00 = niveau M */

    /* L'ORDRE DES BITS, QUI M'A COÛTÉ UNE HEURE

       Le premier emplacement, m[8][0], porte le bit de POIDS FORT des
       quinze, pas le poids faible. Écrit à l'envers, le QR reste
       parfaitement régulier — les repères sont là, les données sont
       là — et pourtant aucun lecteur ne le décode : il lit un niveau
       de correction et un masque qui ne sont pas les bons, défait le
       mauvais masque, et abandonne. À l'œil, rien ne distingue les
       deux. C'est précisément pour ça que ce fichier se vérifie en
       RELISANT ses propres codes, et pas en les regardant.

       Les quinze bits sont écrits deux fois, à des emplacements que
       la norme énumère un par un : il n'y a pas de formule. Un
       lecteur qui ne retrouve ni l'une ni l'autre copie ne sait pas
       quel masque défaire, et s'arrête avant les données. */
    function bit(i) { return (bits >> (14 - i)) & 1; }

    /* Première copie, en L autour du repère haut-gauche. Le saut
       à m[8][7] enjambe la colonne de synchronisation. */
    for (var i = 0; i <= 5; i++) g.m[8][i] = bit(i);
    g.m[8][7] = bit(6);
    g.m[8][8] = bit(7);
    g.m[7][8] = bit(8);
    for (var j = 9; j <= 14; j++) g.m[14 - j][8] = bit(j);

    /* Seconde copie : les sept premiers bits remontent le long du
       repère bas-gauche, les huit derniers filent vers le repère
       haut-droit. */
    for (var k = 0; k <= 6; k++) g.m[n - 1 - k][8] = bit(k);
    for (var l = 7; l <= 14; l++) g.m[8][n - 15 + l] = bit(l);

    /* Le module toujours noir, réécrit après coup : la boucle
       ci-dessus vient de passer dessus. */
    g.m[n - 8][8] = 1;
  }



  /* Le parcours en zigzag : deux colonnes à la fois, de droite à
     gauche, en évitant la colonne de synchronisation. */
  function poserDonnees(g, octets) {
    var n = g.m.length;
    var bits = [];
    octets.forEach(function (o) {
      for (var i = 7; i >= 0; i--) bits.push((o >> i) & 1);
    });
    var idx = 0, montant = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;                 /* la colonne de synchronisation */
      for (var pas = 0; pas < n; pas++) {
        var li = montant ? n - 1 - pas : pas;
        for (var d = 0; d < 2; d++) {
          var co = col - d;
          if (g.r[li][co]) continue;
          g.m[li][co] = idx < bits.length ? bits[idx] : 0;
          idx++;
        }
      }
      montant = !montant;
    }
  }

  function appliquerMasque(g, masque) {
    var n = g.m.length;
    for (var li = 0; li < n; li++) {
      for (var co = 0; co < n; co++) {
        if (g.r[li][co]) continue;
        var inverser = false;
        switch (masque) {
          case 0: inverser = (li + co) % 2 === 0; break;
          case 1: inverser = li % 2 === 0; break;
          case 2: inverser = co % 3 === 0; break;
          case 3: inverser = (li + co) % 3 === 0; break;
          case 4: inverser = (Math.floor(li / 2) + Math.floor(co / 3)) % 2 === 0; break;
          case 5: inverser = ((li * co) % 2) + ((li * co) % 3) === 0; break;
          case 6: inverser = (((li * co) % 2) + ((li * co) % 3)) % 2 === 0; break;
          case 7: inverser = (((li + co) % 2) + ((li * co) % 3)) % 2 === 0; break;
        }
        if (inverser) g.m[li][co] ^= 1;
      }
    }
  }

  /* Les quatre pénalités de la norme. Le masque retenu est celui qui
     donne le total le plus bas : c'est ce qui évite les grandes
     plages uniformes et les motifs qu'un lecteur confondrait avec un
     repère. */
  function penalite(m) {
    var n = m.length, total = 0, li, co, k;

    /* 1 — suites de cinq modules identiques ou plus */
    for (li = 0; li < n; li++) {
      for (var sens = 0; sens < 2; sens++) {
        var suite = 1;
        for (co = 1; co < n; co++) {
          var a = sens ? m[co][li] : m[li][co];
          var b = sens ? m[co - 1][li] : m[li][co - 1];
          if (a === b) { suite++; }
          else { if (suite >= 5) total += 3 + (suite - 5); suite = 1; }
        }
        if (suite >= 5) total += 3 + (suite - 5);
      }
    }

    /* 2 — carrés de 2 × 2 de même couleur */
    for (li = 0; li < n - 1; li++) {
      for (co = 0; co < n - 1; co++) {
        var v = m[li][co];
        if (v === m[li][co + 1] && v === m[li + 1][co] && v === m[li + 1][co + 1]) total += 3;
      }
    }

    /* 3 — la séquence 1:1:3:1:1 bordée de quatre blancs, dans les
       deux sens : c'est la signature d'un motif de repérage, et un
       lecteur s'y tromperait. */
    var MOTIF_A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    var MOTIF_B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    for (li = 0; li < n; li++) {
      for (co = 0; co <= n - 11; co++) {
        var okA = true, okB = true, okC = true, okD = true;
        for (k = 0; k < 11; k++) {
          if (m[li][co + k] !== MOTIF_A[k]) okA = false;
          if (m[li][co + k] !== MOTIF_B[k]) okB = false;
          if (m[co + k][li] !== MOTIF_A[k]) okC = false;
          if (m[co + k][li] !== MOTIF_B[k]) okD = false;
        }
        if (okA) total += 40;
        if (okB) total += 40;
        if (okC) total += 40;
        if (okD) total += 40;
      }
    }

    /* 4 — écart à un noir/blanc équilibré */
    var noirs = 0;
    for (li = 0; li < n; li++) for (co = 0; co < n; co++) noirs += m[li][co];
    var pourcent = (noirs * 100) / (n * n);
    total += Math.floor(Math.abs(pourcent - 50) / 5) * 10;
    return total;
  }

  /* ─── L'entrée publique ───
     Rend la matrice de modules : un tableau de tableaux de 0 et 1,
     sans la marge blanche. Celle-ci est ajoutée au dessin, parce
     qu'elle dépend du support. */
  function matrice(texte) {
    var octets = utf8(texte);
    var version = 0;
    for (var v = 1; v <= 10; v++) {
      var entete = 4 + (v < 10 ? 8 : 16);
      if (capacite(v) * 8 >= entete + octets.length * 8) { version = v; break; }
    }
    if (!version) throw new Error('Texte trop long pour un QR de version 10.');

    var donnees = encoderDonnees(texte, version);
    var taille = 17 + version * 4;
    var meilleur = null;

    for (var masque = 0; masque < 8; masque++) {
      var g = matriceVide(taille);
      poserMotifs(g, version);
      poserDonnees(g, donnees);
      appliquerMasque(g, masque);
      poserFormat(g, masque);
      var p = penalite(g.m);
      if (!meilleur || p < meilleur.p) meilleur = { p: p, m: g.m, masque: masque };
    }
    return meilleur.m;
  }

  /* Le dessin sur une toile. « module » est la taille d'un carré en
     pixels : au-delà de 8, un QR de version 3 dépasse le millier de
     pixels, ce qui est inutile même à l'impression. La marge de
     quatre modules est exigée par la norme — sans elle, beaucoup de
     lecteurs échouent. */
  function dessiner(texte, opts) {
    opts = opts || {};
    var module = opts.module || 8;
    var marge = opts.marge === undefined ? 4 : opts.marge;
    var encre = opts.encre || '#101418';
    var papier = opts.papier || '#ffffff';
    var m = matrice(texte);
    var n = m.length;
    var cote = (n + marge * 2) * module;

    var toile = document.createElement('canvas');
    toile.width = cote;
    toile.height = cote;
    var ctx = toile.getContext('2d');
    ctx.fillStyle = papier;
    ctx.fillRect(0, 0, cote, cote);
    ctx.fillStyle = encre;
    for (var li = 0; li < n; li++) {
      for (var co = 0; co < n; co++) {
        if (m[li][co]) {
          ctx.fillRect((co + marge) * module, (li + marge) * module, module, module);
        }
      }
    }
    return toile;
  }

  racine.MotQR = { matrice: matrice, dessiner: dessiner };
})(typeof globalThis !== 'undefined' ? globalThis : this);
