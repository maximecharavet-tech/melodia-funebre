/* ═══════════════════════════════════════════════════════════════
   memorial.js — La plaque à QR code, côté console

   CE QUE ÇA FAIT

   Pour une commande livrée : ouvrir une page d'hommage, choisir ce
   qu'elle montre, et produire le QR code qui partira chez le graveur.

   POURQUOI LE VECTORIEL D'ABORD

   Un graveur travaille en courbes, pas en pixels. Le SVG se met à
   l'échelle d'une plaque de quinze centimètres sans perdre un module ;
   un PNG agrandi donne des bords baveux que les lecteurs refusent. Le
   PNG reste offert pour les aperçus et les devis.

   LE POINT DÉLICAT

   Une page d'hommage porte le nom et la photo d'une personne décédée,
   derrière un code que n'importe quel passant peut scanner. Trois
   règles en découlent, tenues par le code et non par la bonne volonté :

   • Une fiche naît inactive. Il faut un geste explicite pour la
     publier, et le bouton dit ce qu'il fait.
   • La famille peut la retirer elle-même, immédiatement, sans passer
     par la maison. C'est la loi, et c'est surtout la moindre des
     choses.
   • Retirée, la page répond exactement la même chose qu'un code
     inexistant : on ne renseigne pas un curieux sur ce qui a existé.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REST = window.MelodiaRest || null;
  var enLigne = function () { return !!(REST && REST.actif); };
  var BASE = 'https://melodia-funebre.fr';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function adresse(jeton) { return BASE + '/m/' + jeton; }

  /* ─── La base ─── */
  async function lister(filtreEmail) {
    if (!enLigne()) return [];
    var q = '/rest/v1/memoriaux?select=*&order=created_at.desc';
    if (filtreEmail) q += '&proprietaire=eq.' + encodeURIComponent(filtreEmail);
    return (await REST.appel(q)) || [];
  }

  async function creer(commande, proprietaire) {
    var pistes = [];
    if (commande.audio_url) pistes.push({ titre: commande.audio_title || 'Hommage', url: commande.audio_url });
    var corps = {
      ref: commande.ref,
      proprietaire: proprietaire || commande.user_email || '',
      agence: commande.agence || '',
      nom: commande.defunt || '',
      pistes: pistes,
      actif: false          /* jamais publiée sans un geste explicite */
    };
    var r = await REST.appel('/rest/v1/memoriaux', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(corps)
    });
    return Array.isArray(r) ? r[0] : r;
  }

  async function enregistrer(jeton, champs) {
    var r = await REST.appel('/rest/v1/memoriaux?jeton=eq.' + encodeURIComponent(jeton), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(champs)
    });
    return Array.isArray(r) ? r[0] : r;
  }

  async function supprimer(jeton) {
    await REST.appel('/rest/v1/memoriaux?jeton=eq.' + encodeURIComponent(jeton), { method: 'DELETE' });
  }

  /* ─── La plaque ───
     Le dessin reprend celui des visuels : une phrase, le QR, la
     signature. Tout en vectoriel, en millimètres, pour qu'un graveur
     puisse l'ouvrir et le mettre à la taille de la plaque. */
  function plaqueSVG(m, options) {
    options = options || {};
    var L = 150, H = 105;                /* millimètres : format courant */
    var qr = window.MelodiaQR.svg(adresse(m.jeton), { niveau: 'H', marge: 2, fond: 'none', encre: options.encre || '#0b0b11' });
    var interne = qr.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    var boite = qr.match(/viewBox="0 0 (\d+) \d+"/);
    var cote = boite ? Number(boite[1]) : 33;
    var qrMM = options.qrMM || 44;
    var x = (L - qrMM) / 2, y = 34;
    var or = options.or || '#9c7f33';
    var encre = options.encre || '#0b0b11';

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + L + 'mm" height="' + H + 'mm" ' +
      'viewBox="0 0 ' + L + ' ' + H + '">' +
      '<rect width="' + L + '" height="' + H + '" fill="' + (options.fond || '#ffffff') + '"/>' +
      '<rect x="3" y="3" width="' + (L - 6) + '" height="' + (H - 6) + '" fill="none" stroke="' + or + '" stroke-width="0.4"/>' +
      '<text x="' + (L / 2) + '" y="16" text-anchor="middle" font-family="Georgia, serif" font-style="italic" ' +
        'font-size="7.5" fill="' + encre + '">' + esc(options.titre || 'À jamais dans nos cœurs') + '</text>' +
      '<line x1="' + (L / 2 - 18) + '" y1="21" x2="' + (L / 2 + 18) + '" y2="21" stroke="' + or + '" stroke-width="0.3"/>' +
      '<text x="' + (L / 2) + '" y="29" text-anchor="middle" font-family="Georgia, serif" ' +
        'font-size="4.2" fill="' + encre + '">Écoutez ses musiques en scannant ce QR code</text>' +
      '<g transform="translate(' + x + ' ' + y + ') scale(' + (qrMM / cote) + ')">' + interne + '</g>' +
      '<text x="' + (L / 2) + '" y="' + (y + qrMM + 10) + '" text-anchor="middle" font-family="Georgia, serif" ' +
        'letter-spacing="1.6" font-size="5" fill="' + encre + '">MELODIA FUNÈBRE</text>' +
      '<text x="' + (L / 2) + '" y="' + (y + qrMM + 15.5) + '" text-anchor="middle" font-family="Georgia, serif" ' +
        'letter-spacing="0.9" font-size="2.9" fill="' + or + '">DES HOMMAGES EN MUSIQUE</text>' +
      '</svg>';
  }

  function telecharger(nom, contenu, type) {
    var b = new Blob([contenu], { type: type });
    var u = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = u; a.download = nom;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }

  function telechargerPNG(m, cotePx) {
    /* Deux mille pixels de côté : au format d'une plaque de quinze
       centimètres, cela dépasse les trois cents points par pouce que
       demandent les graveurs. */
    var r = window.MelodiaQR.canevas(adresse(m.jeton), { niveau: 'H', taille: cotePx || 2000, marge: 4 });
    r.canevas.toBlob(function (b) {
      var u = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = u; a.download = 'qr-' + (m.nom || m.ref).replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase() + '.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    }, 'image/png');
  }

  /* ─── La fiche, dépliée ─── */
  function vueFiche(m, options) {
    options = options || {};
    var qr = window.MelodiaQR.svg(adresse(m.jeton), { niveau: 'H', marge: 3, fond: '#ffffff', encre: '#0b0b11' });
    var info = window.MelodiaQR.matrice(adresse(m.jeton), { niveau: 'H' });
    var pistes = m.pistes || [];

    return '<div class="mem-fiche" data-jeton="' + esc(m.jeton) + '">' +
      '<div class="mem-colonnes">' +

        '<div class="mem-qr-bloc">' +
          '<div class="mem-qr">' + qr + '</div>' +
          '<p class="mem-qr-note">Version ' + info.version + ' · correction H · ' + info.taille + '×' + info.taille + ' modules<br>' +
            'Trente pour cent du code peut être abîmé sans empêcher la lecture.</p>' +
          '<div class="mem-adresse">' +
            '<code id="mem-url-' + esc(m.jeton) + '">' + esc(adresse(m.jeton)) + '</code>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="copier">Copier</button>' +
          '</div>' +
          '<div class="mem-exports">' +
            '<button type="button" class="btn btn-outline btn-sm" data-act="svg">QR vectoriel (SVG)</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="png">QR en image (PNG)</button>' +
            '<button type="button" class="btn btn-gold btn-sm" data-act="plaque">Plaque complète</button>' +
          '</div>' +
          '<a class="mem-voir" href="' + esc(adresse(m.jeton)) + '" target="_blank" rel="noopener">Ouvrir la page telle que la verront les familles ↗</a>' +
        '</div>' +

        '<div class="mem-champs">' +
          '<div class="field"><label class="field-label" for="mem-nom">Nom gravé sur la page</label>' +
            '<input class="field-input" id="mem-nom" value="' + esc(m.nom) + '"></div>' +
          '<div class="mem-duo">' +
            '<div class="field"><label class="field-label" for="mem-ne">Né(e) le</label>' +
              '<input class="field-input" id="mem-ne" type="date" value="' + esc(m.ne_le || '') + '"></div>' +
            '<div class="field"><label class="field-label" for="mem-parti">Parti(e) le</label>' +
              '<input class="field-input" id="mem-parti" type="date" value="' + esc(m.parti_le || '') + '"></div>' +
          '</div>' +
          '<div class="field"><label class="field-label" for="mem-mot">Quelques mots</label>' +
            '<textarea class="field-area" id="mem-mot" rows="3" placeholder="Une phrase, pas un discours. C’est ce qu’on lit debout.">' + esc(m.message) + '</textarea></div>' +
          '<div class="field"><label class="field-label" for="mem-portrait">Adresse du portrait</label>' +
            '<input class="field-input" id="mem-portrait" placeholder="https://…" value="' + esc(m.portrait_url) + '">' +
            '<p class="field-aide">Facultatif. Sans photo, la page affiche un ornement sobre.</p></div>' +

          '<div class="mem-pistes-bloc">' +
            '<div class="field-label">Enregistrements proposés</div>' +
            (pistes.length
              ? '<ul class="mem-pistes">' + pistes.map(function (p, i) {
                  return '<li><span class="mem-piste-n">' + (i + 1) + '</span>' +
                    '<span class="mem-piste-t">' + esc(p.titre || 'Hommage') + '</span>' +
                    '<button type="button" class="own-mini danger" data-act="oter" data-i="' + i + '" aria-label="Retirer">✕</button></li>';
                }).join('') + '</ul>'
              : '<p class="mem-vide">Aucun enregistrement rattaché. La page annoncera qu’il arrive bientôt.</p>') +
          '</div>' +

          '<div class="form-msg" id="mem-msg-' + esc(m.jeton) + '"></div>' +
          '<div class="mem-actions">' +
            '<button type="button" class="btn btn-gold" data-act="enregistrer">Enregistrer</button>' +
            '<button type="button" class="btn ' + (m.actif ? 'btn-outline' : 'btn-gold') + '" data-act="bascule">' +
              (m.actif ? 'Retirer la page' : 'Publier la page') + '</button>' +
            (options.peutSupprimer ? '<button type="button" class="btn btn-ghost" data-act="supprimer">Supprimer définitivement</button>' : '') +
          '</div>' +
          '<p class="mem-etat ' + (m.actif ? 'en-ligne' : '') + '">' +
            (m.actif
              ? 'En ligne. Toute personne qui scanne la plaque voit cette page.'
              : 'Hors ligne. Le code renvoie exactement la même réponse qu’un code inexistant.') +
            (m.vues ? ' · ' + m.vues + ' consultation' + (m.vues > 1 ? 's' : '') : '') +
          '</p>' +
        '</div>' +
      '</div></div>';
  }

  /* ─── Brancher une fiche dépliée ─── */
  function brancher(hote, m, options, apres) {
    options = options || {};
    var dire = function (t, ok) {
      var e = $('mem-msg-' + m.jeton);
      if (!e) return;
      e.className = 'form-msg' + (t ? (ok ? ' ok' : ' err') : '');
      e.textContent = t || '';
      e.style.display = t ? 'block' : '';
    };

    hote.addEventListener('click', async function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      var act = b.dataset.act;

      if (act === 'copier') {
        var u = adresse(m.jeton);
        try { await navigator.clipboard.writeText(u); } catch (e) {
          var z = document.createElement('textarea'); z.value = u;
          document.body.appendChild(z); z.select();
          try { document.execCommand('copy'); } catch (e2) {}
          document.body.removeChild(z);
        }
        b.textContent = 'Copié'; setTimeout(function () { b.textContent = 'Copier'; }, 1600);
        return;
      }
      var base = (m.nom || m.ref).replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
      if (act === 'svg') return telecharger('qr-' + base + '.svg',
        window.MelodiaQR.svg(adresse(m.jeton), { niveau: 'H', marge: 4 }), 'image/svg+xml');
      if (act === 'png') return telechargerPNG(m);
      if (act === 'plaque') return telecharger('plaque-' + base + '.svg', plaqueSVG(m), 'image/svg+xml');

      if (act === 'oter') {
        var i = Number(b.dataset.i);
        m.pistes = (m.pistes || []).filter(function (_, k) { return k !== i; });
        try { await enregistrer(m.jeton, { pistes: m.pistes }); apres && apres(); }
        catch (e) { dire(e.message); }
        return;
      }

      if (act === 'enregistrer') {
        b.disabled = true; b.textContent = 'Enregistrement…';
        try {
          var maj = await enregistrer(m.jeton, {
            nom: $('mem-nom').value.trim(),
            ne_le: $('mem-ne').value || null,
            parti_le: $('mem-parti').value || null,
            message: $('mem-mot').value.trim(),
            portrait_url: $('mem-portrait').value.trim()
          });
          Object.assign(m, maj || {});
          dire('Enregistré.', true);
        } catch (e) { dire(e.message); }
        b.disabled = false; b.textContent = 'Enregistrer';
        return;
      }

      if (act === 'bascule') {
        /* Publier une page portant le nom d'un mort n'est pas un
           réglage : on demande confirmation, et on dit ce qui devient
           visible et par qui. */
        if (!m.actif && !confirm(
          'Publier cette page ?\n\n' +
          'Toute personne qui scanne la plaque — ou qui reçoit le lien — verra ' +
          'le nom, les dates, la photo et les enregistrements.\n\n' +
          'La page n’est pas référencée sur les moteurs de recherche, et vous ' +
          'pouvez la retirer à tout moment, d’un seul clic.')) return;
        b.disabled = true;
        try {
          var r = await enregistrer(m.jeton, { actif: !m.actif });
          Object.assign(m, r || {});
          apres && apres();
        } catch (e) { dire(e.message); b.disabled = false; }
        return;
      }

      if (act === 'supprimer') {
        if (!confirm('Supprimer définitivement cette page ?\n\nLe QR code déjà gravé ne mènera plus nulle part. Cette action est irréversible.')) return;
        try { await supprimer(m.jeton); apres && apres(); }
        catch (e) { dire(e.message); }
      }
    });
  }

  /* ═══ LE PANNEAU ═══
     Le même dans la console maître et dans l'espace des familles :
     seul change ce qu'on lui donne à lister. Une famille ne voit que
     son hommage, la maison les voit tous — et c'est la base qui le
     tient, pas ce fichier. */
  async function panneau(hote, options) {
    options = options || {};
    if (!hote) return;
    if (!enLigne()) {
      hote.innerHTML = '<div class="panel"><p class="panel-note">La base n’est pas connectée : les plaques ne peuvent pas être gérées ici.</p></div>';
      return;
    }
    hote.innerHTML = '<div class="panel"><div class="status-live" style="display:inline-flex;">Chargement…</div></div>';

    var fiches, commandes;
    try {
      fiches = await lister(options.email);
      var q = '/rest/v1/orders?select=ref,defunt,audio_url,audio_title,user_email,agence,status&order=created_at.desc&limit=200';
      if (options.email) q += '&user_email=eq.' + encodeURIComponent(options.email);
      commandes = (await REST.appel(q)) || [];
    } catch (e) {
      hote.innerHTML = '<div class="panel"><div class="form-msg err" style="display:block;">' + esc(e.message) + '</div></div>';
      return;
    }

    var avecFiche = {};
    fiches.forEach(function (f) { avecFiche[f.ref] = true; });
    /* On ne propose une plaque que pour un hommage livré : un QR posé
       sur une tombe avant que la musique existe mènerait une famille
       à une page vide, le jour de l'enterrement. */
    var candidates = commandes.filter(function (o) { return o.audio_url && !avecFiche[o.ref]; });

    var h = '<div class="panel">' +
      '<div class="panel-head"><div>' +
        '<div class="panel-title">Les <em>plaques</em> à QR code</div>' +
        '<div class="panel-sub">' + fiches.length + ' page' + (fiches.length > 1 ? 's' : '') + ' · ' +
          fiches.filter(function (f) { return f.actif; }).length + ' en ligne</div>' +
      '</div></div>' +
      '<p class="panel-note">Une plaque porte un code que l’on scanne sur le lieu de repos ; ' +
      'il ouvre une page où la famille écoute l’hommage. La page naît hors ligne : ' +
      'rien n’est visible tant que personne ne l’a publiée.</p>';

    if (candidates.length) {
      h += '<div class="mem-candidates"><div class="field-label">Hommages livrés, sans plaque</div><ul>' +
        candidates.slice(0, 12).map(function (o) {
          return '<li><span class="mem-c-nom">' + esc(o.defunt || o.ref) + '</span>' +
            '<span class="mem-c-ref">' + esc(o.ref) + '</span>' +
            '<button type="button" class="btn btn-outline btn-sm" data-creer="' + esc(o.ref) + '">Créer la page</button></li>';
        }).join('') + '</ul></div>';
    }

    h += fiches.length
      ? '<div class="mem-liste">' + fiches.map(function (f) {
          return '<div class="mem-item" data-jeton="' + esc(f.jeton) + '">' +
            '<button type="button" class="mem-tete" data-ouvrir="' + esc(f.jeton) + '">' +
              '<span class="mem-pastille' + (f.actif ? ' en-ligne' : '') + '" aria-hidden="true"></span>' +
              '<span class="mem-t-nom">' + esc(f.nom || f.ref) + '</span>' +
              '<span class="mem-t-etat">' + (f.actif ? 'en ligne' : 'hors ligne') + '</span>' +
            '</button><div class="mem-corps" hidden></div></div>';
        }).join('') + '</div>'
      : '<p class="mem-vide">Aucune plaque pour l’instant.</p>';

    h += '</div>';
    /* L'écouteur se pose sur un enfant recréé à chaque rendu, jamais
       sur l'hôte : posé sur l'hôte, il s'empilerait à chaque
       rechargement et le deuxième clic sur « Créer » créerait deux
       pages pour un seul défunt. */
    hote.innerHTML = '<div class="mem-hote"></div>';
    var boite = hote.firstChild;
    boite.innerHTML = h;

    var recharger = function () { panneau(hote, options); };

    boite.addEventListener('click', async function (ev) {
      var c = ev.target.closest ? ev.target.closest('[data-creer]') : null;
      if (c) {
        c.disabled = true; c.textContent = 'Création…';
        var o = commandes.filter(function (x) { return x.ref === c.dataset.creer; })[0];
        try { await creer(o, options.email || o.user_email); recharger(); }
        catch (e) { c.disabled = false; c.textContent = 'Créer la page'; alert(e.message); }
        return;
      }
      var t = ev.target.closest ? ev.target.closest('[data-ouvrir]') : null;
      if (!t) return;
      var item = t.parentElement, corps = item.querySelector('.mem-corps');
      if (!corps.hidden) { corps.hidden = true; item.classList.remove('ouvert'); return; }
      var f = fiches.filter(function (x) { return x.jeton === t.dataset.ouvrir; })[0];
      if (!f) return;
      /* Idem : ouvrir, fermer, rouvrir posait un écouteur de plus à
         chaque fois, et « Enregistrer » partait en double. */
      corps.innerHTML = '<div class="mem-boite"></div>';
      corps.firstChild.innerHTML = vueFiche(f, { peutSupprimer: !!options.peutSupprimer });
      corps.hidden = false;
      item.classList.add('ouvert');
      brancher(corps.firstChild, f, options, recharger);
    });
  }

  window.MelodiaMemorial = {
    panneau: panneau,
    lister: lister, creer: creer, enregistrer: enregistrer, supprimer: supprimer,
    vueFiche: vueFiche, brancher: brancher,
    adresse: adresse, plaqueSVG: plaqueSVG, telecharger: telecharger
  };
})();
