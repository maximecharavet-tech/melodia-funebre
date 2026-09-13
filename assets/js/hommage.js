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
    var t = document.getElementById('hom-piste-titre');
    if (t) t.textContent = pistes[i].titre || 'Hommage';
    [].forEach.call(document.querySelectorAll('.hom-piste'), function (e, k) {
      e.classList.toggle('actif', k === i);
      e.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
  }

  function brancherLecteur() {
    audio = document.getElementById('hom-audio');
    if (!audio) return;

    var barre = document.getElementById('hom-barre');
    var avance = document.getElementById('hom-avance');
    var ecoule = document.getElementById('hom-ecoule');
    var duree = document.getElementById('hom-duree');

    audio.addEventListener('timeupdate', function () {
      var p = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
      avance.style.width = p + '%';
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
  }

  /* ─── Le rendu ─── */
  function rendre(m) {
    pistes = (m.pistes || []).filter(function (p) { return p && p.url; });
    var d = dates(m);

    var h = '<article class="hom-carte">';

    h += '<header class="hom-tete">';
    if (m.portrait_url) {
      h += '<div class="hom-portrait"><img src="' + esc(m.portrait_url) + '" alt="Portrait de ' + esc(m.nom) + '" loading="eager"></div>';
    } else {
      h += '<div class="hom-portrait hom-portrait-vide" aria-hidden="true">' +
           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8"><path d="M12 3c-3 2-5 5-5 8a5 5 0 0 0 10 0c0-3-2-6-5-8z"/></svg></div>';
    }
    h += '<p class="hom-sur">En mémoire de</p>';
    h += '<h1 class="hom-nom">' + esc(m.nom || 'Un être cher') + '</h1>';
    if (d) h += '<p class="hom-dates">' + esc(d) + '</p>';
    h += '</header>';

    if (m.message) {
      h += '<blockquote class="hom-mot"><p>' + esc(m.message).replace(/\n+/g, '</p><p>') + '</p></blockquote>';
    }

    if (pistes.length) {
      h += '<section class="hom-lecteur" aria-label="Écouter l’hommage">' +
        '<audio id="hom-audio" preload="metadata" playsinline></audio>' +
        '<p class="hom-piste-titre" id="hom-piste-titre">Hommage</p>' +
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

    /* Partager : l'adresse de cette page, rien d'autre. Le lien est le
       même que celui du QR — c'est ce que les familles s'envoient. */
    h += '<div class="hom-partage">' +
      '<button type="button" class="btn btn-outline btn-sm" id="hom-partager">Partager cette page</button>' +
      '<span class="hom-partage-dit" id="hom-partage-dit" hidden>Lien copié</span></div>';

    h += '<p class="hom-signe">Un hommage composé pour lui seul par <a href="/">Melodia Funèbre</a></p>';
    h += '</article>';

    ecrire(h);
    document.title = (m.nom ? m.nom + ' — ' : '') + 'En mémoire · Melodia Funèbre';
    if (pistes.length) brancherLecteur();

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
