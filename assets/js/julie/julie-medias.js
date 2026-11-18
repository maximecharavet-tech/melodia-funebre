/*!
 * julie-medias.js — Console commerciale · espace « Médias ».
 *
 * Les vidéos et visuels Melodia prêts à publier : aperçu, téléchargement
 * par format, partage (partage natif du téléphone, liens Facebook,
 * LinkedIn, X, WhatsApp, Pinterest, courriel, copie du lien) avec une
 * légende sobre déjà écrite, et deux ateliers :
 *  - « Modifier » : recadrer au format voulu, éclaircir, ajouter un titre
 *    et poser le logo officiel TEL QUEL (jamais redessiné) ;
 *  - « Générer un visuel Melodia » : styles maison, envoyés au moteur
 *    Image MAX Gen par /api/medias-generer (éteint tant que Maxime ne
 *    l'a pas activé : la route répond alors GENERATION_INACTIVE).
 *
 * Dépend de : MelodiaJulie (esc, entetes), MelodiaConsole.
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J || !window.MelodiaConsole) return;
  var esc = J.esc;

  var SITE = 'https://melodia-funebre.fr';
  var LOGO = '/assets/img/logo-melodia-600.webp';
  var CLE_CREES = 'melodia_medias_crees';

  var STYLES = [['lys', 'Lys blancs'], ['bougies', 'Bougies'], ['lumiere', 'Lumière douce'], ['partition', 'Mains sur partition'], ['nature', 'Nature'], ['colombes', 'Colombes']];
  var COULEURS = [['or', 'Or'], ['ivoire', 'Ivoire'], ['gris', 'Gris']];
  var FORMATS_GEN = [['post', 'Publication 1:1'], ['story', 'Story 9:16'], ['banniere', 'Bannière 16:9']];
  var FORMATS_EDIT = { post: [1080, 1080, 'Publication 1:1'], portrait: [1080, 1350, 'Portrait 4:5'], story: [1080, 1920, 'Story 9:16'], banniere: [1920, 1080, 'Bannière 16:9'] };
  var LEGENDE_CREE = 'Chaque vie mérite sa chanson. Melodia Funèbre compose une chanson originale pour rendre hommage à un proche. melodia-funebre.fr';

  var etat = { medias: null, erreur: '', filtre: 'tous', serveur: [], actif: null, stockage: null, gen: { style: 'lys', couleur: 'or', format: 'post', precision: '' }, enCours: false, message: '' };

  /* ─── Données ─────────────────────────────────────────────────── */
  function lireCrees() {
    try { var l = JSON.parse(localStorage.getItem(CLE_CREES) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; }
  }
  function ecrireCrees(l) { try { localStorage.setItem(CLE_CREES, JSON.stringify(l.slice(0, 60))); } catch (e) { /* plein */ } }

  function creation(c) {
    return {
      id: 'c-' + c.id, type: 'creation', titre: 'Visuel généré', legende: LEGENDE_CREE, vignette: c.url, ratio: '',
      formats: [{ k: 'original', label: 'Image générée', url: c.url }], note: (c.le ? 'Créé le ' + jour(c.le) + '. ' : '') + 'Sans logo : posez-le avec « Modifier ».', modifiable: true, le: c.le
    };
  }
  function creations() {
    var vus = {}, out = [];
    etat.serveur.concat(lireCrees()).forEach(function (c) { if (c && c.url && !vus[c.url]) { vus[c.url] = 1; out.push(creation(c)); } });
    return out.sort(function (a, b) { return String(b.le || '').localeCompare(String(a.le || '')); });
  }
  function tous() { return (etat.medias || []).concat(creations()); }
  function parId(id) { return tous().filter(function (m) { return m.id === id; })[0] || null; }
  function jour(iso) { var d = new Date(iso); return isNaN(d) ? '' : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(d); }
  function absolue(u) { return /^https?:/.test(u) ? u : SITE + u; }
  function nomFichier(m, f) {
    var ext = (String(f.url).split('?')[0].match(/\.([a-z0-9]+)$/i) || [0, 'jpg'])[1];
    return 'melodia-' + m.id.replace(/^[a-z]-/, '') + (f.k && f.k !== 'original' ? '-' + f.k : '') + '.' + ext;
  }
  function session() { return Boolean(J.entetes().Authorization); }

  async function charger() {
    if (etat.medias === null) {
      var r = await fetch('/assets/medias/medias.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error('Médias indisponibles.');
      etat.medias = (await r.json()).medias || [];
    }
    if (session()) {
      try {
        var s = await fetch('/api/medias-generer?liste=1', { headers: J.entetes(), credentials: 'same-origin' });
        var d = await s.json().catch(function () { return {}; });
        if (s.ok) { etat.serveur = d.images || []; etat.actif = Boolean(d.actif); etat.stockage = Boolean(d.stockage); }
      } catch (e) { /* hors ligne : la liste locale suffit */ }
    }
  }

  /* ─── Vue ─────────────────────────────────────────────────────── */
  function carte(m) {
    var video = m.type === 'video';
    return '<li class="jm-carte" data-jm-id="' + esc(m.id) + '">' +
      '<button type="button" class="jm-vignette" data-jm-voir aria-label="Voir « ' + esc(m.titre) + ' »">' +
        '<img src="' + esc(m.vignette) + '" alt="" loading="lazy" decoding="async">' +
        (video ? '<span class="jm-badge">▶ ' + (m.duree || '') + ' s</span>' : m.type === 'creation' ? '<span class="jm-badge">Création</span>' : '') +
      '</button>' +
      '<div class="jm-corps"><div class="jm-titre">' + esc(m.titre) + '</div>' +
      '<div class="jm-actions">' +
        '<button type="button" class="btn btn-sm btn-outline" data-jm-voir>Voir</button>' +
        '<button type="button" class="btn btn-sm btn-outline" data-jm-telecharger>Télécharger</button>' +
        '<button type="button" class="btn btn-sm btn-outline" data-jm-partager>Partager</button>' +
        (m.modifiable ? '<button type="button" class="btn btn-sm btn-outline" data-jm-modifier>Modifier</button>' : '') +
      '</div></div></li>';
  }

  function puces(nom, liste, actuel) {
    return '<div class="jm-puces" role="radiogroup" data-jm-gen="' + nom + '">' + liste.map(function (x) {
      return '<button type="button" role="radio" aria-checked="' + (x[0] === actuel) + '" class="jm-puce' + (x[0] === actuel ? ' est-actif' : '') + '" data-v="' + x[0] + '">' + esc(x[1]) + '</button>';
    }).join('') + '</div>';
  }

  function generateur() {
    var g = etat.gen;
    var statut = etat.actif === true ? '<span class="jm-etat est-on">Activé</span>' : etat.actif === false ? '<span class="jm-etat">En attente d’activation</span>' : '';
    return '<details class="panel jm-gen"' + (etat.genOuvert || etat.message ? ' open' : '') + '><summary><span class="jm-gen-t">Générer un visuel Melodia</span> ' + statut + '</summary>' +
      '<p class="panel-note">Styles de la maison : sobre, sans texte ni visage. Le logo officiel est posé ensuite, tel quel, jamais généré.</p>' +
      '<div class="jm-gen-l"><span class="jm-gen-k">Style</span>' + puces('style', STYLES, g.style) + '</div>' +
      '<div class="jm-gen-l"><span class="jm-gen-k">Couleur</span>' + puces('couleur', COULEURS, g.couleur) + '</div>' +
      '<div class="jm-gen-l"><span class="jm-gen-k">Format</span>' + puces('format', FORMATS_GEN, g.format) + '</div>' +
      '<label class="jm-gen-l"><span class="jm-gen-k">Précision</span><input type="text" class="jm-champ" maxlength="160" data-jm-precision value="' + esc(g.precision) + '" placeholder="Facultatif : « un piano au loin », « fin d’automne »…"></label>' +
      '<div class="jm-gen-bas"><button type="button" class="btn btn-gold" data-jm-generer' + (etat.enCours ? ' disabled' : '') + '>' + (etat.enCours ? 'Génération…' : 'Générer') + '</button>' +
      (etat.message ? '<p class="jm-msg" role="status">' + etat.message + '</p>' : '') + '</div></details>';
  }

  function vue() {
    if (etat.medias === null) return '<div class="jv jm" data-julie-vue="medias"><p class="panel-note">' + (etat.erreur ? esc(etat.erreur) : 'Chargement des médias…') + '</p></div>';
    var l = tous();
    var n = { tous: l.length, video: 0, visuel: 0, creation: 0 };
    l.forEach(function (m) { n[m.type] = (n[m.type] || 0) + 1; });
    var f = etat.filtre;
    var vis = l.filter(function (m) { return f === 'tous' || m.type === f; });
    var filtres = [['tous', 'Tout'], ['video', 'Vidéos'], ['visuel', 'Visuels'], ['creation', 'Mes créations']];
    return '<div class="jv jm" data-julie-vue="medias">' +
      '<p class="panel-note">Vidéos et visuels Melodia prêts à publier. Téléchargez le format voulu ou partagez directement : la légende est déjà écrite, vous pouvez la reprendre.</p>' +
      '<div class="jm-filtres" role="tablist">' + filtres.map(function (x) {
        return '<button type="button" role="tab" aria-selected="' + (x[0] === f) + '" class="jm-filtre' + (x[0] === f ? ' est-actif' : '') + '" data-jm-filtre="' + x[0] + '">' + x[1] + ' <span>' + (n[x[0]] || 0) + '</span></button>';
      }).join('') + '</div>' +
      generateur() +
      (vis.length ? '<ul class="jm-grille">' + vis.map(carte).join('') + '</ul>' :
        '<p class="col-vide">' + (f === 'creation' ? 'Aucune création pour l’instant. Les visuels générés arriveront ici.' : 'Rien dans cette catégorie.') + '</p>') +
      '</div>';
  }

  function rendre() {
    var h = document.querySelector('[data-julie-vue="medias"]');
    if (h) h.outerHTML = vue();
  }

  /* ─── Utilitaires ────────────────────────────────────────────── */
  function dire(t) { (window.melodiaToast || function (m) { var p = document.querySelector('.jm-annonce'); if (p) p.textContent = m; })(t); var a = document.querySelector('.jm-annonce'); if (a) a.textContent = t; }
  async function copier(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      var z = document.createElement('textarea'); z.value = t; z.setAttribute('readonly', ''); z.style.position = 'fixed'; z.style.opacity = '0';
      document.body.appendChild(z); z.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (_) { ok = false; } z.remove(); return ok;
    }
  }
  async function blobDe(url) {
    var r = await fetch(url, { mode: 'cors' });
    if (!r.ok) throw new Error('Fichier indisponible.');
    return r.blob();
  }
  async function telecharger(url, nom) {
    var meme = !/^https?:/.test(url) || url.indexOf(location.origin) === 0;
    var a = document.createElement('a');
    a.download = nom; a.rel = 'noopener';
    if (meme) { a.href = url; document.body.appendChild(a); a.click(); a.remove(); return; }
    try {
      var b = await blobDe(url); var u = URL.createObjectURL(b);
      a.href = u; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    } catch (e) { window.open(url, '_blank', 'noopener'); }
  }

  function dialogue(cls, html) {
    var d = document.createElement('dialog');
    d.className = 'jm-dialogue ' + cls;
    d.innerHTML = '<button type="button" class="jm-fermer" data-jm-fermer aria-label="Fermer">×</button>' + html + '<p class="jm-annonce" aria-live="polite"></p>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.querySelectorAll('video').forEach(function (v) { v.pause(); }); d.remove(); });
    d.addEventListener('click', function (ev) { if (ev.target === d || ev.target.closest('[data-jm-fermer]')) d.close(); });
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    return d;
  }

  /* ─── Partage ────────────────────────────────────────────────── */
  function liensPartage(m, f, texte) {
    var u = encodeURIComponent(absolue(f.url));
    var t = encodeURIComponent(texte);
    var img = encodeURIComponent(absolue(m.type === 'video' ? m.vignette : f.url));
    return [
      ['facebook', 'Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u, true],
      ['linkedin', 'LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u, true],
      ['x', 'X', 'https://x.com/intent/post?text=' + t + '&url=' + u, false],
      ['whatsapp', 'WhatsApp', 'https://wa.me/?text=' + t + '%20' + u, false],
      ['pinterest', 'Pinterest', 'https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(SITE) + '&media=' + img + '&description=' + t, false],
      ['courriel', 'Courriel', 'mailto:?subject=' + encodeURIComponent('Melodia Funèbre — ' + m.titre) + '&body=' + t + '%0A%0A' + u, false]
    ];
  }

  async function partageNatif(m, f, texte) {
    if (!navigator.share) return false;
    try {
      var b = await blobDe(f.url);
      var fichier = new File([b], nomFichier(m, f), { type: b.type || (m.type === 'video' ? 'video/mp4' : 'image/jpeg') });
      if (navigator.canShare && navigator.canShare({ files: [fichier] })) { await navigator.share({ files: [fichier], text: texte, title: 'Melodia Funèbre' }); return true; }
    } catch (e) { if (e && e.name === 'AbortError') return true; }
    try { await navigator.share({ title: 'Melodia Funèbre — ' + m.titre, text: texte, url: absolue(f.url) }); return true; } catch (e) { return Boolean(e && e.name === 'AbortError'); }
  }

  function blocPartage(m) {
    var f = m.formats[0];
    return '<section class="jm-bloc"><h3 class="jv-appel-h">Partager</h3>' +
      '<label class="jm-gen-k" for="jm-legende">Légende</label><textarea id="jm-legende" class="jm-champ jm-legende" rows="3" data-jm-legende>' + esc(m.legende) + '</textarea>' +
      '<div class="jm-partage">' +
        (navigator.share ? '<button type="button" class="btn btn-sm btn-gold" data-jm-natif>Partager depuis le téléphone…</button>' : '') +
        liensPartage(m, f, m.legende).map(function (l) {
          return '<a class="btn btn-sm btn-outline" data-jm-reseau="' + l[0] + '"' + (l[3] ? ' data-jm-copie-avant' : '') + ' href="' + esc(l[2]) + '" target="_blank" rel="noopener">' + l[1] + '</a>';
        }).join('') +
        '<button type="button" class="btn btn-sm btn-outline" data-jm-copier-lien>Copier le lien</button>' +
        '<button type="button" class="btn btn-sm btn-outline" data-jm-copier-legende>Copier la légende</button>' +
      '</div>' +
      '<p class="jm-aide">Facebook et LinkedIn n’acceptent pas de texte prérempli : la légende est copiée, collez-la. Instagram et TikTok : « Partager depuis le téléphone », ou téléchargez puis publiez.</p></section>';
  }

  function brancherPartage(d, m) {
    var f = m.formats[0];
    function texte() { var z = d.querySelector('[data-jm-legende]'); return z ? z.value : m.legende; }
    d.addEventListener('input', function (ev) {
      if (!ev.target.matches('[data-jm-legende]')) return;
      liensPartage(m, f, texte()).forEach(function (l) { var a = d.querySelector('[data-jm-reseau="' + l[0] + '"]'); if (a) a.href = l[2]; });
    });
    d.addEventListener('click', async function (ev) {
      var a = ev.target.closest('[data-jm-copie-avant]');
      if (a) { await copier(texte()); dire('Légende copiée : collez-la dans la publication.'); return; }
      if (ev.target.closest('[data-jm-natif]')) { if (!(await partageNatif(m, f, texte()))) dire('Le partage du téléphone n’est pas disponible ici.'); return; }
      if (ev.target.closest('[data-jm-copier-lien]')) { dire((await copier(absolue(f.url))) ? 'Lien copié.' : 'Copie impossible.'); return; }
      if (ev.target.closest('[data-jm-copier-legende]')) { dire((await copier(texte())) ? 'Légende copiée.' : 'Copie impossible.'); }
    });
  }

  /* ─── Aperçu ─────────────────────────────────────────────────── */
  function ouvrir(m, onglet) {
    var f = m.formats[0];
    var media = m.type === 'video'
      ? '<video src="' + esc(f.url) + '" poster="' + esc(m.vignette) + '" controls muted loop playsinline autoplay preload="metadata"></video>'
      : '<img src="' + esc(f.url) + '" alt="' + esc(m.titre) + '">';
    var d = dialogue('jm-apercu', '<div class="jm-apercu-media">' + media + '</div><div class="jm-apercu-cote">' +
      '<h2 class="jm-apercu-t">' + esc(m.titre) + '</h2>' + (m.note ? '<p class="jm-aide">' + esc(m.note) + '</p>' : '') +
      '<section class="jm-bloc" data-jm-bloc-telecharger><h3 class="jv-appel-h">Télécharger</h3><ul class="jm-formats">' + m.formats.map(function (x, i) {
        return '<li><button type="button" class="btn btn-sm btn-outline" data-jm-format="' + i + '">⇩ ' + esc(x.label) + (x.l ? ' <span>' + x.l + '×' + x.h + '</span>' : '') + '</button></li>';
      }).join('') + '</ul></section>' + blocPartage(m) +
      (m.modifiable ? '<button type="button" class="btn btn-sm btn-gold" data-jm-vers-edition>Modifier ce visuel</button>' : '') + '</div>');
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-jm-format]');
      if (b) { var x = m.formats[Number(b.dataset.jmFormat)]; telecharger(x.url, nomFichier(m, x)); dire('Téléchargement lancé.'); return; }
      if (ev.target.closest('[data-jm-vers-edition]')) { d.close(); editer(m); }
    });
    brancherPartage(d, m);
    var cible = onglet && d.querySelector(onglet === 'partager' ? '[data-jm-legende]' : '[data-jm-format]');
    if (cible) { cible.scrollIntoView({ block: 'center' }); cible.focus(); }
  }

  /* ─── Modifier (toile) ───────────────────────────────────────── */
  function charge(src) {
    return new Promise(function (ok, ko) {
      var i = new Image();
      if (/^https?:/.test(src) && src.indexOf(location.origin) !== 0) i.crossOrigin = 'anonymous';
      i.onload = function () { ok(i); }; i.onerror = function () { ko(new Error('Image illisible.')); }; i.src = src;
    });
  }

  function dessiner(cv, img, logo, o) {
    var F = FORMATS_EDIT[o.format], W = F[0], H = F[1];
    cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    x.fillStyle = '#040407'; x.fillRect(0, 0, W, H);
    var rc = Math.max(W / img.width, H / img.height), rn = Math.min(W / img.width, H / img.height);
    if (o.cadrage === 'entiere') {
      x.save(); x.filter = 'blur(28px) brightness(' + (0.38 * o.lum) + ')';
      x.drawImage(img, (W - img.width * rc) / 2, (H - img.height * rc) / 2, img.width * rc, img.height * rc); x.restore();
      x.save(); x.filter = 'brightness(' + o.lum + ')';
      x.drawImage(img, (W - img.width * rn) / 2, (H - img.height * rn) / 2, img.width * rn, img.height * rn); x.restore();
    } else {
      var w = img.width * rc, h = img.height * rc;
      x.save(); x.filter = 'brightness(' + o.lum + ')';
      x.drawImage(img, (W - w) / 2, (H - h) * (o.pos / 100), w, h); x.restore();
    }
    var marge = Math.round(Math.min(W, H) * 0.06);
    if (o.titre) {
      var taille = Math.round(Math.min(W, H) * 0.07);
      x.font = '300 ' + taille + 'px "Cormorant Garamond", Georgia, serif';
      x.fillStyle = '#f2efe8'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      x.shadowColor = 'rgba(0,0,0,.65)'; x.shadowBlur = taille * 0.4;
      var lignes = couper(x, o.titre, W - marge * 2), y0 = o.logo === 'bas' ? H * 0.2 : H - marge * 1.6 - (lignes.length - 1) * taille * 1.15;
      lignes.forEach(function (l, i) { x.fillText(l, W / 2, y0 + i * taille * 1.15); });
      x.shadowBlur = 0;
    }
    if (o.mention) {
      var t2 = Math.round(Math.min(W, H) * 0.024);
      x.font = '400 ' + t2 + 'px Jost, Arial, sans-serif'; x.fillStyle = '#c9a84c'; x.textAlign = 'center';
      x.fillText('MELODIA-FUNEBRE.FR', W / 2, H - marge * 0.6);
    }
    if (o.logo !== 'aucun' && logo) {
      // le fichier officiel tel quel ; « écran » fond son noir dans l'image, sans retoucher le dessin
      var s = Math.round(Math.min(W, H) * 0.24);
      var lx = o.logo === 'gauche' ? marge * 0.6 : (W - s) / 2;
      var ly = o.logo === 'bas' ? H - s - marge * 1.2 : marge * 0.4;
      x.save(); x.globalCompositeOperation = 'screen'; x.drawImage(logo, lx, ly, s, s); x.restore();
    }
  }
  function couper(x, t, max) {
    var mots = String(t).split(/ +/), l = [], c = '';
    mots.forEach(function (m) { var e = c ? c + ' ' + m : m; if (x.measureText(e).width > max && c) { l.push(c); c = m; } else c = e; });
    if (c) l.push(c);
    return l.slice(0, 4);
  }

  async function editer(m) {
    var o = { format: 'post', cadrage: 'entiere', pos: 50, lum: 1, titre: '', mention: false, logo: m.type === 'creation' ? 'haut' : 'aucun' };
    var choix = function (nom, liste, v) { return '<label class="jm-gen-l"><span class="jm-gen-k">' + nom + '</span><select class="jm-champ" data-o="' + liste[0] + '">' + liste[1].map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === v ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></label>'; };
    var d = dialogue('jm-edition', '<div class="jm-apercu-media"><canvas class="jm-toile" aria-label="Aperçu du visuel modifié"></canvas></div><div class="jm-apercu-cote">' +
      '<h2 class="jm-apercu-t">Modifier « ' + esc(m.titre) + ' »</h2>' +
      choix('Format', ['format', Object.keys(FORMATS_EDIT).map(function (k) { return [k, FORMATS_EDIT[k][2]]; })], o.format) +
      choix('Cadrage', ['cadrage', [['entiere', 'Image entière, fond flouté'], ['remplir', 'Remplir le cadre']]], o.cadrage) +
      '<label class="jm-gen-l"><span class="jm-gen-k">Position</span><input type="range" min="0" max="100" value="50" data-o="pos"></label>' +
      '<label class="jm-gen-l"><span class="jm-gen-k">Lumière</span><input type="range" min="60" max="130" value="100" data-o="lum"></label>' +
      '<label class="jm-gen-l"><span class="jm-gen-k">Titre</span><input type="text" class="jm-champ" maxlength="90" data-o="titre" placeholder="Ex. : Chaque vie mérite sa chanson."></label>' +
      choix('Logo officiel', ['logo', [['aucun', 'Aucun (déjà sur l’affiche)'], ['haut', 'En haut, centré'], ['gauche', 'En haut à gauche'], ['bas', 'En bas, centré']]], o.logo) +
      '<label class="jm-case"><input type="checkbox" data-o="mention"> Adresse du site en bas</label>' +
      '<div class="jm-partage"><button type="button" class="btn btn-sm btn-gold" data-jm-export="image/jpeg">⇩ JPEG</button><button type="button" class="btn btn-sm btn-outline" data-jm-export="image/png">⇩ PNG</button>' +
      (navigator.share ? '<button type="button" class="btn btn-sm btn-outline" data-jm-export-partage>Partager…</button>' : '') + '</div>' +
      '<p class="jm-aide">Le logo est le fichier officiel, posé tel quel. Rien n’est envoyé : la modification se fait dans votre navigateur.</p></div>');
    var cv = d.querySelector('canvas');
    var img, logo;
    try {
      if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load('300 40px "Cormorant Garamond"'), document.fonts.load('400 20px Jost')]).catch(function () {});
      img = await charge(m.formats[0].url); logo = await charge(LOGO).catch(function () { return null; });
    } catch (e) { dire(e.message); return; }
    function maj() { dessiner(cv, img, logo, o); }
    maj();
    d.addEventListener('input', function (ev) {
      var k = ev.target.dataset && ev.target.dataset.o; if (!k) return;
      var v = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
      o[k] = k === 'pos' ? Number(v) : k === 'lum' ? Number(v) / 100 : v; maj();
    });
    function exporter(type) {
      return new Promise(function (ok, ko) {
        try { cv.toBlob(function (b) { b ? ok(b) : ko(new Error('Export impossible.')); }, type, 0.92); } catch (e) { ko(new Error('Image d’une autre origine : téléchargez l’original.')); }
      });
    }
    d.addEventListener('click', async function (ev) {
      var b = ev.target.closest('[data-jm-export]');
      var p = ev.target.closest('[data-jm-export-partage]');
      if (!b && !p) return;
      try {
        var type = b ? b.dataset.jmExport : 'image/jpeg';
        var blob = await exporter(type);
        var nom = 'melodia-' + m.id.replace(/^[a-z]-/, '') + '-' + o.format + (type === 'image/png' ? '.png' : '.jpg');
        if (b) { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); dire('Visuel téléchargé.'); return; }
        var fi = new File([blob], nom, { type: type });
        if (navigator.canShare && navigator.canShare({ files: [fi] })) await navigator.share({ files: [fi], text: m.legende });
        else dire('Ce navigateur ne partage pas de fichier : téléchargez-le.');
      } catch (e) { if (!(e && e.name === 'AbortError')) dire(e.message || 'Export impossible.'); }
    });
  }

  /* ─── Génération ─────────────────────────────────────────────── */
  async function generer() {
    if (etat.enCours) return;
    if (!session()) { etat.message = 'Connectez-vous pour générer un visuel.'; return rendre(); }
    etat.enCours = true; etat.message = 'Demande envoyée…'; rendre();
    try {
      var r = await fetch('/api/medias-generer', { method: 'POST', headers: J.entetes(), credentials: 'same-origin', body: JSON.stringify(etat.gen) });
      var d = await r.json().catch(function () { return {}; });
      if (r.status === 503 && d.code === 'GENERATION_INACTIVE') {
        etat.actif = false; etat.demande = d.demande || '';
        etat.message = esc(d.error) + (d.demande ? ' <button type="button" class="btn btn-sm btn-outline" data-jm-copier-demande>Copier la demande</button>' : '');
        return;
      }
      if (!r.ok || !d.tache) { etat.message = esc(d.error || 'La génération a échoué.'); return; }
      etat.message = 'Image en préparation (environ ' + Math.max(1, Math.round((d.eta || 60) / 60)) + ' min)…'; rendre();
      var fin = Date.now() + 4 * 60 * 1000;
      while (Date.now() < fin) {
        await new Promise(function (ok) { setTimeout(ok, 6000); });
        var s = await fetch('/api/medias-generer?tache=' + encodeURIComponent(d.tache), { headers: J.entetes(), credentials: 'same-origin' });
        var e = await s.json().catch(function () { return {}; });
        if (e.statut === 'fait' && e.url) {
          var c = { id: d.tache, url: e.url, le: new Date().toISOString(), format: d.format };
          var l = lireCrees(); l.unshift(c); ecrireCrees(l);
          etat.message = 'Visuel prêt' + (e.stockage ? ', rangé dans l’espace Médias.' : ' (gardé dans ce navigateur).');
          etat.filtre = 'creation';
          etat.enCours = false; rendre();
          return editer(creation(c));
        }
        if (e.statut === 'echec' || !s.ok) { etat.message = esc(e.error || 'La génération a échoué.'); return; }
      }
      etat.message = 'Le moteur est lent : la tâche continue, revenez dans quelques minutes.';
    } catch (err) {
      etat.message = 'Réseau indisponible.';
    } finally { etat.enCours = false; rendre(); }
  }

  /* ─── Branchement ────────────────────────────────────────────── */
  function brancher() {
    var view = document.getElementById('view');
    if (!view) return;
    if (etat.medias === null || !etat.charge) {
      etat.charge = true;
      charger().catch(function (e) { etat.erreur = e.message; }).then(rendre);
    }
    if (view.dataset.jmBranche === '1') return;
    view.dataset.jmBranche = '1';
    view.addEventListener('click', async function (ev) {
      if (!ev.target.closest('[data-julie-vue="medias"]')) return;
      var fi = ev.target.closest('[data-jm-filtre]');
      if (fi) { etat.filtre = fi.dataset.jmFiltre; return rendre(); }
      var pu = ev.target.closest('[data-jm-gen] [data-v]');
      if (pu) { etat.gen[pu.parentNode.dataset.jmGen] = pu.dataset.v; return rendre(); }
      if (ev.target.closest('[data-jm-generer]')) return generer();
      if (ev.target.closest('[data-jm-copier-demande]')) { await copier(etat.demande || ''); var p = view.querySelector('.jm-msg'); if (p) p.insertAdjacentText('beforeend', ' Copiée.'); return; }
      var li = ev.target.closest('[data-jm-id]');
      var m = li && parId(li.dataset.jmId);
      if (!m) return;
      if (ev.target.closest('[data-jm-voir]')) return ouvrir(m);
      if (ev.target.closest('[data-jm-telecharger]')) return ouvrir(m, 'telecharger');
      if (ev.target.closest('[data-jm-partager]')) {
        if (navigator.share && window.matchMedia && window.matchMedia('(pointer: coarse)').matches && (await partageNatif(m, m.formats[0], m.legende))) return;
        return ouvrir(m, 'partager');
      }
      if (ev.target.closest('[data-jm-modifier]')) return editer(m);
    });
    view.addEventListener('toggle', function (ev) {
      if (ev.target.classList && ev.target.classList.contains('jm-gen')) etat.genOuvert = ev.target.open;
    }, true);
    view.addEventListener('input', function (ev) {
      if (ev.target.matches && ev.target.matches('[data-jm-precision]')) etat.gen.precision = ev.target.value;
    });
  }

  window.MelodiaJulieMedias = { vue: vue, dessiner: dessiner, liensPartage: liensPartage, nomFichier: nomFichier, reinitialiser: function () { etat.medias = null; etat.charge = false; } };

  window.MelodiaConsole.ajouterVue('medias', ['Ressources', 'Mes <em>médias</em>', function () { etat.charge = false; return vue(); }, brancher]);
  var hv = (location.hash || '').replace(/^#/, '').split('?')[0];
  // la console a pu démarrer avant ce script, sur la vue par défaut : on relit le hash d'origine
  if (window.MelodiaConsole.hashDemarrage === 'medias') hv = 'medias';
  if (hv === 'medias' && window.MelodiaConsole.demarree && window.MelodiaConsole.courante() !== hv && typeof window.go === 'function') window.go(hv);
})();
