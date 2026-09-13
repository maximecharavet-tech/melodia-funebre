/* ═══════════════════════════════════════════════════════════════
   MELODIA — Partager une œuvre

   Un réseau social ne partage jamais un fichier audio : il partage une
   adresse, puis va lire les balises de la page pour en faire un
   aperçu. Tout ce module fait donc une seule chose bien : donner
   l'adresse de l'œuvre, avec le texte qui va avec.

   Aucun bouton officiel, aucun script tiers. Les boutons « Partager »
   de Facebook et consorts posent un traceur sur toutes les pages où
   ils apparaissent, y compris chez les visiteurs qui ne cliquent
   jamais. Ici, ce sont de simples liens : rien ne part avant le clic,
   et rien ne suit personne. Sur un site où l'on vient chercher une
   chanson pour un mort, cela n'est pas un détail.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var ICONES = {
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-5.9l-4.6-6-5.3 6H3l7-8L2.6 3h6l4.2 5.5L17.5 3zm-1 16h1.7L7.6 4.8H5.8L16.5 19z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.7.7-.9 1.6-.6 2.6.4 1.4 1.4 2.7 2.6 3.7 1.3 1.1 2.8 1.7 4 1.7.7 0 1.3-.2 1.8-.6.4-.4.6-1 .6-1.5v-.4c0-.1-.1-.2-.2-.2z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.9 8.4H4V20h2.9V8.4zM5.4 4a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4zM20 13.8c0-3.2-1.7-4.7-4-4.7-1.8 0-2.6 1-3.1 1.7V8.4H10V20h2.9v-6.2c0-1.4.6-2.3 1.9-2.3 1.2 0 1.7.8 1.7 2.3V20H20v-6.2z"/></svg>',
    courriel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    lien: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7L12.2 19"/></svg>',
    partager: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>'
  };

  /* Les adresses de partage, telles que chaque réseau les attend.
     Aucune ne dépend d'un compte développeur ni d'une clé. */
  function liens(d) {
    var u = encodeURIComponent(d.url);
    var t = encodeURIComponent(d.texte);
    var tu = encodeURIComponent(d.texte + '\n' + d.url);
    return [
      ['facebook', 'Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u],
      ['whatsapp', 'WhatsApp', 'https://wa.me/?text=' + tu],
      ['x', 'X', 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u],
      ['linkedin', 'LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u],
      ['courriel', 'Courriel', 'mailto:?subject=' + encodeURIComponent(d.titre) + '&body=' + tu]
    ];
  }

  function monter(hote) {
    var d = {
      titre: hote.dataset.titre || document.title,
      texte: hote.dataset.texte || '',
      url: hote.dataset.url || location.href
    };
    if (!d.texte) d.texte = d.titre;

    /* Le partage natif du téléphone ouvre la feuille du système :
       Instagram, Messages, AirDrop, tout ce que la personne a
       réellement installé. Aucune liste de boutons ne fait mieux. */
    var natif = !!(navigator.share && navigator.canShare !== undefined);

    var h = '<div class="pa-tete">' +
      '<span class="pa-libelle">Faire écouter cet hommage</span>' +
      '<span class="pa-dit">Un lien, une page, et l’œuvre se lance.</span>' +
    '</div><div class="pa-boutons">';

    if (natif) {
      h += '<button type="button" class="pa-bouton pa-natif" data-natif>' +
        ICONES.partager + '<span>Partager</span></button>';
    }
    h += liens(d).map(function (l) {
      return '<a class="pa-bouton" href="' + esc(l[2]) + '" target="_blank" rel="noopener noreferrer"' +
        ' aria-label="Partager sur ' + esc(l[1]) + '">' + ICONES[l[0]] + '<span>' + esc(l[1]) + '</span></a>';
    }).join('');
    h += '<button type="button" class="pa-bouton" data-copier>' + ICONES.lien +
      '<span data-copier-libelle>Copier le lien</span></button>';
    h += '</div>';

    /* Instagram n'accepte pas de lien depuis un navigateur : ni une
       publication, ni un partage. Le dire évite de chercher un bouton
       qui n'existe pas, et propose ce qui marche vraiment. */
    h += '<p class="pa-insta">Sur Instagram, les liens ne se partagent pas depuis le web : ' +
      '<button type="button" class="pa-texte-lien" data-copier-texte>copiez le texte et l’adresse</button>, ' +
      'puis collez-les dans votre publication, votre story ou votre bio.</p>';

    h += '<div class="pa-echo" role="status" aria-live="polite"></div>';

    hote.innerHTML = h;
    brancher(hote, d);
  }

  function brancher(hote, d) {
    var echo = hote.querySelector('.pa-echo');
    var dire = function (t) {
      echo.textContent = t;
      clearTimeout(dire.t);
      dire.t = setTimeout(function () { echo.textContent = ''; }, 2600);
    };

    async function presse(texte, message) {
      try {
        await navigator.clipboard.writeText(texte);
        dire(message);
      } catch (e) {
        /* Sans presse-papiers — vieux navigateur, page non sécurisée —
           on sélectionne le texte pour que la copie manuelle reste
           possible, plutôt que d'échouer en silence. */
        var z = document.createElement('textarea');
        z.value = texte;
        z.setAttribute('readonly', '');
        z.style.position = 'fixed';
        z.style.opacity = '0';
        hote.appendChild(z);
        z.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        hote.removeChild(z);
        dire(ok ? message : 'La copie a échoué — sélectionnez l’adresse à la main.');
      }
    }

    hote.addEventListener('click', async function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-natif],[data-copier],[data-copier-texte]') : null;
      if (!b) return;

      if (b.hasAttribute('data-natif')) {
        try { await navigator.share({ title: d.titre, text: d.texte, url: d.url }); }
        catch (e) { /* la personne a fermé la feuille : ce n'est pas une erreur */ }
        return;
      }
      if (b.hasAttribute('data-copier')) {
        await presse(d.url, 'Lien copié.');
        var l = hote.querySelector('[data-copier-libelle]');
        if (l) { l.textContent = 'Copié'; setTimeout(function () { l.textContent = 'Copier le lien'; }, 1800); }
        return;
      }
      await presse(d.texte + '\n' + d.url, 'Texte et adresse copiés.');
    });
  }

  function tout() {
    document.querySelectorAll('[data-partage]').forEach(function (h) {
      if (h.dataset.partageMonte) return;
      h.dataset.partageMonte = '1';
      monter(h);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tout);
  else tout();

  window.MelodiaPartage = { monter: monter, tout: tout };
})();
