/* ═══════════════════════════════════════════════════════════════
   hommage.js — La page qu'ouvre le QR code d'une plaque

   OÙ ELLE EST LUE

   Debout devant une tombe, en plein soleil, sur un réseau d'une barre.
   Trois contraintes qui décident de tout :

   • Elle ne charge rien d'autre que ce qu'elle montre. Pas de session,
     pas de tableau de bord, pas de bibliothèque.
   • Le contraste est poussé au-delà de celui du site : un thème sombre
     sous le soleil de midi se lit mal, et la personne qui scanne ne va
     pas chercher l'ombre pour ajuster sa luminosité.
   • Tout ce qui est tactile fait au moins cinquante pixels. On tient
     son téléphone d'une main et des fleurs de l'autre.

   CE QU'ELLE NE MONTRE JAMAIS

   La commande, le prix, le courriel, l'agence qui a vendu. La fonction
   « memorial » en base ne rend que sept champs, tous choisis par la
   famille. Cette page ne peut donc pas divulguer ce qu'elle n'a pas.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── L'exemple ───
     « /m/demo » ouvre cette fiche sans toucher à la base : un dirigeant
     de pompes funèbres doit pouvoir comprendre le produit en trente
     secondes, depuis une salle d'attente, sans formulaire et sans
     dépendre du réseau. La personne est fictive et la page le dit —
     inventer un vrai défunt pour une démonstration serait indigne. */
  var DEMO = {
    _demo: true,
    nom: 'Odette Vasseur',
    ne_le: '1938-04-12', parti_le: '2026-08-01',
    message: 'Elle chantait en cuisine, le dimanche, en épluchant les pommes.\nOn la reconnaissait à sa voix bien avant d\'entrer.',
    portrait_url: '',
    pistes: [{ titre: 'Toujours avec nous', url: '/audio/odette.mp3' }],
    paroles: 'Dans la cuisine du dimanche\nUne voix montait des casseroles\nElle ne savait pas qu\'on l\'écoutait\nElle chantait pour les pommes\n\nOdette, tu as nourri trois générations\nDe soupes et de chansons\nEt si le silence est venu\nTa voix, elle, n\'est pas perdue',
    photos: [],
    agence: ''
  };

  var CFG = window.MELODIA_CONFIG || {};
  var SB = (CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var CLE = CFG.SUPABASE_ANON_KEY || '';
  var racine = document.getElementById('hom-racine');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Le jeton vient du chemin « /m/xxxx » réécrit par l'hébergeur, ou
     de « ?j=xxxx » quand on ouvre la page en direct. */
  function jeton() {
    var q = new URLSearchParams(location.search).get('j');
    if (q) return q.trim();
    var m = location.pathname.match(/\/m\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function annee(d) { return d ? String(d).slice(0, 4) : ''; }

  function dates(m) {
    var a = annee(m.ne_le), b = annee(m.parti_le);
    if (a && b) return a + ' — ' + b;
    return b ? b : a;
  }

  function ecrire(h) { racine.innerHTML = h; }

  function messageSimple(titre, texte) {
    ecrire('<div class="hom-vide">' +
      '<div class="hom-orn" aria-hidden="true">✦</div>' +
      '<h1 class="hom-vide-titre">' + esc(titre) + '</h1>' +
      '<p class="hom-vide-txt">' + texte + '</p>' +
      '<a class="btn btn-outline" href="/">Découvrir Melodia Funèbre</a></div>');
  }

  /* ─── Le lecteur ───
     Un seul élément audio pour toutes les pistes : deux lecteurs qui
     jouent ensemble dans un cimetière, c'est le genre de détail qu'on
     ne pardonne pas. */
  var audio = null, pistes = [], courante = 0;

  function mmss(s) {
    if (!isFinite(s)) return '—:—';
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function majBouton() {
    var b = document.getElementById('hom-jouer');
    if (!b) return;
    var joue = audio && !audio.paused;
    b.classList.toggle('joue', joue);
    b.setAttribute('aria-label', joue ? 'Mettre en pause' : 'Écouter');
    b.querySelector('.hom-jouer-ico').innerHTML = joue
      ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z"/></svg>';
  }

  function choisir(i) {
    if (!pistes[i]) return;
    courante = i;
    audio.src = pistes[i].url;
    var onde = document.getElementById('hom-onde');
    if (onde) { onde.innerHTML = ''; delete onde.dataset.prete; }
    setTimeout(dessinerOnde, 60);
    var t = document.getElementById('hom-piste-titre');
    if (t) t.textContent = pistes[i].titre || 'Hommage';
    [].forEach.call(document.querySelectorAll('.hom-piste'), function (e, k) {
      e.classList.toggle('actif', k === i);
      e.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
  }

  /* ─── Le disque tourne ───
     Même comportement que sur la platine du catalogue : une masse qui
     prend sa vitesse et la perd, jamais une animation qu'on coupe net.
     La lueur monte vite et retombe lentement, comme une lumière.

     On ne réanime la boucle qu'à la lecture, et on l'arrête dès que
     tout est immobile : devant une tombe, sur un téléphone dont la
     batterie compte, une boucle qui tourne pour rien n'est pas un
     détail. */
  function brancherDisque() {
    var disque = document.getElementById('hom-vinyle');
    var cadre = disque && disque.parentNode;
    if (!disque || !audio) return;

    var reduit = false;
    try { reduit = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var lueur = 0, angle = 0, vitesse = 0, image = null;

    function pas() {
      var joue = !audio.paused && !audio.ended;
      var cibleLueur = joue ? 0.42 + Math.sin(Date.now() / 430) * 0.2 : 0;
      lueur += (cibleLueur - lueur) * (cibleLueur > lueur ? 0.3 : 0.06);
      cadre.style.setProperty('--lueur', lueur.toFixed(3));

      var cibleVitesse = joue && !reduit ? 0.42 : 0;
      vitesse += (cibleVitesse - vitesse) * (joue ? 0.022 : 0.014);
      if (vitesse > 0.0015) {
        angle = (angle + vitesse) % 360;
        disque.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
      }

      if (joue || lueur > 0.002 || vitesse > 0.0015) image = requestAnimationFrame(pas);
      else image = null;
    }
    function reveiller() { if (!image) image = requestAnimationFrame(pas); }

    audio.addEventListener('play', reveiller);
    audio.addEventListener('pause', reveiller);
    audio.addEventListener('ended', reveiller);
    /* Un onglet mis de côté ne doit pas continuer à faire tourner le
       disque en arrière-plan pour personne. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (image) { cancelAnimationFrame(image); image = null; } }
      else if (!audio.paused) reveiller();
    });
  }

  function brancherLecteur() {
    audio = document.getElementById('hom-audio');
    if (!audio) return;
    brancherDisque();

    var barre = document.getElementById('hom-barre');
    var avance = document.getElementById('hom-avance');
    var ecoule = document.getElementById('hom-ecoule');
    var duree = document.getElementById('hom-duree');

    audio.addEventListener('timeupdate', function () {
      var p = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
      avance.style.width = p + '%';
      majOnde(p);
      barre.setAttribute('aria-valuenow', Math.round(p));
      ecoule.textContent = mmss(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', function () { duree.textContent = mmss(audio.duration); });
    audio.addEventListener('play', majBouton);
    audio.addEventListener('pause', majBouton);
    audio.addEventListener('ended', function () {
      if (courante + 1 < pistes.length) { choisir(courante + 1); audio.play(); }
      else majBouton();
    });
    audio.addEventListener('error', function () {
      var e = document.getElementById('hom-erreur');
      if (e) { e.textContent = 'Cet enregistrement n’a pas pu être chargé. Vérifiez votre réseau, puis réessayez.'; e.hidden = false; }
    });

    document.getElementById('hom-jouer').addEventListener('click', function () {
      if (audio.paused) audio.play().catch(function () {
        var e = document.getElementById('hom-erreur');
        if (e) { e.textContent = 'La lecture n’a pas pu démarrer. Touchez à nouveau le bouton.'; e.hidden = false; }
      });
      else audio.pause();
    });

    /* Se déplacer dans le morceau, au doigt comme au clavier */
    var aller = function (ev) {
      var r = barre.getBoundingClientRect();
      var x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, x / r.width)) * audio.duration;
    };
    barre.addEventListener('click', aller);
    barre.addEventListener('keydown', function (ev) {
      if (!audio.duration) return;
      if (ev.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); ev.preventDefault(); }
      if (ev.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); ev.preventDefault(); }
    });

    [].forEach.call(document.querySelectorAll('.hom-piste'), function (e, k) {
      e.addEventListener('click', function () { choisir(k); audio.play(); });
    });

    choisir(0);
    majBouton();
    dessinerOnde();
  }

  /* ─── La forme d'onde ───
     Elle est calculée à partir du fichier réel, pas dessinée au
     hasard : une onde inventée qui prétend montrer la musique serait
     un mensonge visuel. Le calcul est différé et silencieux — sur un
     réseau de cimetière, mieux vaut une barre sobre qu'une attente.
     Si le décodage échoue ou traîne, la barre reste, et c'est très
     bien ainsi. */
  function dessinerOnde() {
    var toile = document.getElementById('hom-onde');
    if (!toile || !window.AudioContext || !pistes[courante]) return;
    var url = pistes[courante].url;

    fetch(url).then(function (r) {
      if (!r.ok) throw new Error('audio');
      return r.arrayBuffer();
    }).then(function (buf) {
      var ctx = new AudioContext();
      return ctx.decodeAudioData(buf).finally(function () { try { ctx.close(); } catch (e) {} });
    }).then(function (audioBuf) {
      var data = audioBuf.getChannelData(0);
      var barres = 64, pas = Math.floor(data.length / barres), pics = [];
      for (var i = 0; i < barres; i++) {
        var max = 0;
        for (var k = i * pas; k < (i + 1) * pas; k += 64) {
          var v = Math.abs(data[k] || 0);
          if (v > max) max = v;
        }
        pics.push(max);
      }
      var plafond = Math.max.apply(null, pics) || 1;
      toile.innerHTML = pics.map(function (p) {
        /* Un plancher de huit pour cent : une barre nulle laisse un
           trou dans le dessin, et un silence n'est pas une absence. */
        return '<span style="height:' + Math.max(8, Math.round(p / plafond * 100)) + '%"></span>';
      }).join('');
      toile.dataset.prete = '1';
    }).catch(function () { /* la barre sobre suffit */ });
  }

  function majOnde(p) {
    var toile = document.getElementById('hom-onde');
    if (!toile || !toile.dataset.prete) return;
    toile.style.setProperty('--avance', p + '%');
  }

  /* ─── Le rendu ─── */
  function rendre(m) {
    pistes = (m.pistes || []).filter(function (p) { return p && p.url; });
    var d = dates(m);

    var h = '';
    /* Le bandeau est en haut et ne se referme pas : une page de
       démonstration qui ressemble à une vraie page de défunt doit le
       dire en permanence, pas dans une note de bas de page. */
    if (m._demo) {
      h += '<div class="hom-demo" role="note">' +
        '<span class="hom-demo-pastille">Exemple</span>' +
        '<p>Cette page est une démonstration. Odette Vasseur est une personne fictive, ' +
        'et cet hommage a été composé pour montrer ce que reçoit une famille.</p>' +
        '<a href="/professionnels#partenariat" class="hom-demo-cta">Proposer ce service à vos familles →</a>' +
      '</div>';
    }
    h += '<article class="hom-carte">';

    h += '<header class="hom-tete">';
    /* Le disque d'or de la platine, plutôt qu'un médaillon fixe : c'est
       le même objet que sur le reste du site, et il tourne pendant
       l'écoute. Sa matière vit dans style.css — cette page la charge
       déjà, il n'y a rien à recopier.

       L'étiquette ne porte que l'initiale du nom. Le portrait y a été
       essayé puis retiré : un visage collé au centre d'un disque qui
       tourne n'est pas un hommage, c'est une pochette de disque. Il a
       sa place plus bas, immobile, à hauteur de regard. */
    var initiale = String(m.nom || '♪').trim().charAt(0).toUpperCase();
    h += '<div class="hom-disque disque-cadre">' +
           '<div class="disque" id="hom-vinyle" aria-hidden="true"></div>' +
           '<div class="disque-bord" aria-hidden="true"></div>' +
           '<div class="etiquette"><b aria-hidden="true">' + esc(initiale) + '</b></div>' +
         '</div>';
    h += '<p class="hom-sur">En mémoire de</p>';
    h += '<h1 class="hom-nom">' + esc(m.nom || 'Un être cher') + '</h1>';
    if (d) h += '<p class="hom-dates">' + esc(d) + '</p>';
    /* Le portrait confié par la famille ne disparaît pas pour autant :
       il se pose ici, rond et immobile, après le nom et les dates —
       on lit qui c'était, puis on le regarde. */
    if (m.portrait_url) {
      h += '<div class="hom-portrait"><img src="' + esc(m.portrait_url) +
           '" alt="Portrait de ' + esc(m.nom) + '" loading="eager"></div>';
    }
    h += '</header>';

    if (m.message) {
      h += '<blockquote class="hom-mot"><p>' + esc(m.message).replace(/\n+/g, '</p><p>') + '</p></blockquote>';
    }

    if (pistes.length) {
      h += '<section class="hom-lecteur" aria-label="Écouter l’hommage">' +
        '<audio id="hom-audio" preload="metadata" playsinline></audio>' +
        '<p class="hom-piste-titre" id="hom-piste-titre">Hommage</p>' +
        '<div class="hom-onde" id="hom-onde" aria-hidden="true"></div>' +
        '<div class="hom-commande">' +
          '<button type="button" class="hom-jouer" id="hom-jouer" aria-label="Écouter">' +
            '<span class="hom-jouer-ico" aria-hidden="true"></span></button>' +
        '</div>' +
        '<div class="hom-temps">' +
          '<span id="hom-ecoule">0:00</span>' +
          '<div class="hom-barre" id="hom-barre" role="slider" tabindex="0" aria-label="Position dans le morceau" ' +
               'aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="hom-avance"></span></div>' +
          '<span id="hom-duree">—:—</span>' +
        '</div>' +
        '<p class="form-msg err" id="hom-erreur" hidden></p>';
      if (pistes.length > 1) {
        h += '<ul class="hom-pistes">' + pistes.map(function (p, i) {
          return '<li><button type="button" class="hom-piste' + (i ? '' : ' actif') + '">' +
            '<span class="hom-piste-n">' + (i + 1) + '</span>' + esc(p.titre || 'Hommage ' + (i + 1)) + '</button></li>';
        }).join('') + '</ul>';
      }
      h += '</section>';
    } else {
      h += '<p class="hom-bientot">L’enregistrement sera déposé ici très bientôt.</p>';
    }

    if (m.paroles) {
      /* Les paroles se replient : sur un téléphone, quatre strophes
         repoussent le partage et le QR hors de l'écran, et personne ne
         défile jusqu'en bas devant une tombe. */
      h += '<details class="hom-paroles"><summary>Lire les paroles</summary>' +
        '<div class="hom-paroles-corps">' +
        esc(m.paroles).split(/\n{2,}/).map(function (bloc) {
          return '<p>' + bloc.replace(/\n/g, '<br>') + '</p>';
        }).join('') + '</div></details>';
    }

    var photos = (m.photos || []).filter(function (p) { return p && p.url; });
    if (photos.length) {
      /* La base en accepte cinq — contrainte memoriaux_cinq_photos. Le
         garde-fou reste plus large que la règle : si la maison décide
         un jour d'en autoriser huit, mieux vaut que la page les
         affiche toutes plutôt qu'elle en escamote trois en silence. */
      h += '<div class="hom-galerie">' + photos.slice(0, 12).map(function (p, i) {
        return '<figure><img src="' + esc(p.url) + '" alt="' + esc(p.legende || ('Photo ' + (i + 1))) +
          '" loading="lazy" decoding="async">' +
          (p.legende ? '<figcaption>' + esc(p.legende) + '</figcaption>' : '') + '</figure>';
      }).join('') + '</div>';
    }

    /* Le QR de cette page, sur la page elle-même : c'est ce qu'on
       photographie pour le montrer à quelqu'un, et ce qu'un
       marbrier demande. Il n'apparaît que si l'encodeur est chargé. */
    h += '<details class="hom-qr"><summary>Le code de cette page</summary>' +
      '<div class="hom-qr-corps" id="hom-qr-corps"></div></details>';

    /* Partager : l'adresse de cette page, rien d'autre. Le lien est le
       même que celui du QR — c'est ce que les familles s'envoient. */
    h += '<div class="hom-partage">' +
      '<button type="button" class="btn btn-outline btn-sm" id="hom-partager">Partager cette page</button>' +
      '<span class="hom-partage-dit" id="hom-partage-dit" hidden>Lien copié</span></div>';

    h += '<p class="hom-signe">Un hommage composé pour lui seul par <a href="/">Melodia Funèbre</a></p>';
    h += '</article>';

    ecrire(h);
    document.title = m._demo
      ? 'Exemple de page hommage · Melodia Funèbre'
      : (m.nom ? m.nom + ' — ' : '') + 'En mémoire · Melodia Funèbre';
    if (pistes.length) brancherLecteur();

    var qrBloc = document.querySelector('.hom-qr');
    if (qrBloc) qrBloc.addEventListener('toggle', function () {
      var hote = document.getElementById('hom-qr-corps');
      if (!qrBloc.open || !hote || hote.dataset.fait) return;
      hote.dataset.fait = '1';
      if (!window.MelodiaQR) {
        hote.innerHTML = '<p class="hom-qr-note">Le code se trouve sur la plaque fournie avec cet hommage.</p>';
        return;
      }
      hote.innerHTML = '<div class="hom-qr-image">' +
        window.MelodiaQR.svg(location.href, { niveau: 'H', marge: 3, fond: '#ffffff', encre: '#0b0b11' }) +
        '</div><p class="hom-qr-note">Scannez-le, ou photographiez-le pour le transmettre.</p>';
    });

    var bp = document.getElementById('hom-partager');
    bp.addEventListener('click', async function () {
      var url = location.href;
      var titre = 'En mémoire de ' + (m.nom || '');
      if (navigator.share) {
        try { await navigator.share({ title: titre, url: url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      try { await navigator.clipboard.writeText(url); } catch (e) {
        var z = document.createElement('textarea');
        z.value = url; document.body.appendChild(z); z.select();
        try { document.execCommand('copy'); } catch (e2) {}
        document.body.removeChild(z);
      }
      var dit = document.getElementById('hom-partage-dit');
      dit.hidden = false;
      setTimeout(function () { dit.hidden = true; }, 2200);
    });
  }

  /* ─── Aller chercher la fiche ─── */
  async function charger() {
    var j = jeton();
    if (j === 'demo' || j === 'exemple') return rendre(DEMO);
    if (!j) {
      return messageSimple('Adresse incomplète',
        'Ce lien ne désigne aucun hommage. Scannez à nouveau le code de la plaque, ou vérifiez l’adresse recopiée.');
    }
    if (!SB || !CLE) {
      return messageSimple('Service momentanément indisponible',
        'Réessayez dans un instant.');
    }
    try {
      var r = await fetch(SB + '/rest/v1/rpc/memorial', {
        method: 'POST',
        headers: { apikey: CLE, Authorization: 'Bearer ' + CLE, 'Content-Type': 'application/json' },
        body: JSON.stringify({ j: j })
      });
      if (!r.ok) throw new Error('reseau');
      var d = await r.json();
      var m = Array.isArray(d) ? d[0] : d;
      if (!m) {
        /* On ne dit pas si le jeton n'existe pas ou si la page a été
           retirée : c'est la même phrase dans les deux cas, sans quoi
           on renseignerait un curieux sur l'existence d'une fiche. */
        return messageSimple('Cette page n’est pas disponible',
          'Elle a peut-être été retirée par la famille, ou le code a été mal lu.<br>' +
          'Si vous pensez qu’il s’agit d’une erreur, écrivez-nous à ' +
          '<a href="mailto:contact@melodia-funebre.fr">contact@melodia-funebre.fr</a>.');
      }
      rendre(m);
    } catch (e) {
      messageSimple('Connexion interrompue',
        'La page n’a pas pu être chargée. Dans un cimetière le réseau est souvent faible :<br>' +
        'éloignez-vous de quelques pas, puis rechargez.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', charger);
  else charger();
})();
