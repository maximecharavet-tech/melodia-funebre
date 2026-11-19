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
  var LOGO = '/assets/img/logo-melodia-complet.jpg'; // fichier officiel 1600 px, posé tel quel
  var CLE_CREES = 'melodia_medias_crees';
  var CLE_FAVORIS = 'melodia_medias_styles_favoris';
  var CLE_HISTO = 'melodia_medias_historique';
  var INTENSITES = { 1: 'Léger', 2: 'Marqué', 3: 'Affirmé' };
  var VARIANTES = [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']];
  var INTENSITE_CHOIX = [['1', 'Léger'], ['2', 'Marqué']];

  var FORMATS_GEN = [['post', 'Post 1:1'], ['story', 'Story 9:16'], ['banniere', 'Bannière 16:9']];
  var DEVISE = 'Chaque vie mérite sa chanson.';
  var FORMATS_EDIT = { post: [1080, 1080, 'Publication 1:1'], portrait: [1080, 1350, 'Portrait 4:5'], story: [1080, 1920, 'Story 9:16'], banniere: [1920, 1080, 'Bannière 16:9'] };
  var LEGENDE_CREE = 'Chaque vie mérite sa chanson. Melodia Funèbre compose une chanson originale pour rendre hommage à un proche. melodia-funebre.fr';

  var etat = { medias: null, erreur: '', filtre: 'tous', serveur: [], actif: null, stockage: null, idees: [], styles: [], gen: { texte: '', carte: '', style: '', intensite: 2, variantes: '1', format: 'post', motActif: false, mot: '', signature: true }, enCours: false, message: '' };

  /* ─── Données ─────────────────────────────────────────────────── */
  function lireCrees() {
    try { var l = JSON.parse(localStorage.getItem(CLE_CREES) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; }
  }
  function ecrireCrees(l) { try { localStorage.setItem(CLE_CREES, JSON.stringify(l.slice(0, 60))); } catch (e) { /* plein */ } }
  function lireListe(cle) { try { var l = JSON.parse(localStorage.getItem(cle) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  function ecrireListe(cle, l) { try { localStorage.setItem(cle, JSON.stringify(l)); } catch (e) { /* plein */ } }
  function favoris() { return lireListe(CLE_FAVORIS).filter(function (x) { return typeof x === 'string'; }); }
  function basculerFavori(id) {
    var f = favoris(), i = f.indexOf(id);
    if (i === -1) f.unshift(id); else f.splice(i, 1);
    ecrireListe(CLE_FAVORIS, f.slice(0, 40));
  }
  /* Historique des demandes : les 8 dernières, pour relancer en un geste. */
  function historique() { return lireListe(CLE_HISTO).filter(function (h) { return h && h.texte; }); }
  function noterHistorique(g) {
    var h = { texte: String(g.texte).trim(), carte: g.carte || '', style: g.style || '', intensite: g.intensite || 2, format: g.format };
    var l = historique().filter(function (x) { return !(x.texte === h.texte && x.style === h.style && x.format === h.format); });
    l.unshift(h); ecrireListe(CLE_HISTO, l.slice(0, 8));
  }
  function styleDe(id) { return etat.styles.filter(function (x) { return x.id === id; })[0] || null; }

  /* Deux sortes de créations : « gardée » (image déjà composée, logo posé, rangée en ligne)
     et « locale » (image brute du moteur + réglages : on la recompose, logo compris, à chaque ouverture). */
  function creation(c) {
    var garde = !c.tache;
    return {
      id: 'c-' + c.id, type: 'creation', titre: c.titre || 'Visuel Melodia', legende: LEGENDE_CREE, vignette: c.vignette || c.url, ratio: '',
      formats: [{ k: 'original', label: 'Visuel avec logo', url: c.url }], modifiable: garde, le: c.le,
      note: (c.le ? 'Créé le ' + jour(c.le) + '. ' : '') + (garde ? 'Rangé dans Mes créations.' : 'Gardé dans ce navigateur.'),
      locale: garde ? null : c
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
      var cat = await r.json();
      etat.medias = cat.medias || [];
      etat.idees = cat.idees || [];
      etat.styles = cat.styles || [];
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
    return '<section class="panel jm-gen" aria-labelledby="jm-gen-t">' +
      '<div class="jm-gen-tete"><h2 class="jm-gen-t" id="jm-gen-t">Générer un visuel Melodia</h2>' + statut + '</div>' +
      '<label class="jm-gen-k" for="jm-texte">Décrivez votre image</label>' +
      '<textarea id="jm-texte" class="jm-champ jm-texte" rows="3" maxlength="400" data-jm-texte placeholder="Ex. : un bouquet de roses blanches sur un piano, lumière du soir">' + esc(g.texte) + '</textarea>' +
      (etat.idees.length ? '<p class="jm-aide">Besoin d’une idée ? Touchez une carte, puis modifiez le texte à votre goût.</p>' +
        '<ul class="jm-idees">' + etat.idees.map(function (i) {
          return '<li><button type="button" class="jm-idee' + (g.carte === i.id ? ' est-actif' : '') + '" data-jm-idee="' + esc(i.id) + '" aria-pressed="' + (g.carte === i.id) + '">' +
            '<img src="' + esc(i.vignette) + '" alt="" loading="lazy" width="96" height="96"><span>' + esc(i.nom) + '</span></button></li>';
        }).join('') + '</ul>' : '') +
      selecteurStyles() +
      '<div class="jm-gen-l"><span class="jm-gen-k">Format</span>' + puces('format', FORMATS_GEN, g.format) + '</div>' +
      '<div class="jm-gen-l"><span class="jm-gen-k">Variantes</span>' + puces('variantes', VARIANTES, String(g.variantes)) + '</div>' +
      '<label class="jm-case"><input type="checkbox" data-jm-signature' + (g.signature ? ' checked' : '') + '> Signature en bas : « ' + DEVISE + ' » et melodia-funebre.fr</label>' +
      '<label class="jm-case"><input type="checkbox" data-jm-mot-actif' + (g.motActif ? ' checked' : '') + '> Ajouter un mot (un prénom, une phrase)</label>' +
      (g.motActif ? '<input type="text" class="jm-champ" maxlength="60" data-jm-mot value="' + esc(g.mot) + '" placeholder="Ex. : En mémoire de Jeanne">' : '') +
      '<button type="button" class="btn btn-gold jm-generer" data-jm-generer' + (etat.enCours ? ' disabled' : '') + '>' + (etat.enCours ? 'Génération…' : 'Générer') + '</button>' +
      '<p class="jm-aide">Le logo officiel Melodia est posé sur chaque image, tel quel : il n’est jamais généré. Chaque variante compte dans les visuels du jour.</p>' +
      (etat.message ? '<p class="jm-msg" role="status">' + etat.message + '</p>' : '') +
      blocHistorique() + '</section>';
  }

  /* Style artistique : vignettes d'exemple (même sujet pour toutes), favoris en tête. */
  function selecteurStyles() {
    if (!etat.styles.length) return '';
    var g = etat.gen, fav = favoris();
    var l = etat.styles.slice().sort(function (a, b) {
      var fa = fav.indexOf(a.id), fb = fav.indexOf(b.id);
      return (fa === -1 ? 999 : fa) - (fb === -1 ? 999 : fb);
    });
    var choisi = styleDe(g.style);
    var tuile = function (id, nom, img, estFav, desc) {
      var actif = g.style === id;
      return '<li class="jm-style' + (actif ? ' est-actif' : '') + '">' +
        '<button type="button" class="jm-style-b" data-jm-style="' + esc(id) + '" aria-pressed="' + actif + '"' + (desc ? ' title="' + esc(desc) + '"' : '') + '>' +
          (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" decoding="async" width="112" height="112">' : '<span class="jm-style-sans" aria-hidden="true">M</span>') +
          '<span>' + esc(nom) + '</span></button>' +
        (id ? '<button type="button" class="jm-favori' + (estFav ? ' est-actif' : '') + '" data-jm-favori="' + esc(id) + '" aria-pressed="' + estFav + '" title="' + (estFav ? 'Retirer des favoris' : 'Ajouter aux favoris') + '" aria-label="' + (estFav ? 'Retirer « ' : 'Ajouter « ') + esc(nom) + (estFav ? ' » des favoris' : ' » aux favoris') + '">★</button>' : '') +
        '</li>';
    };
    return '<div class="jm-gen-bloc"><span class="jm-gen-k">Style artistique' + (choisi ? ' : <em>' + esc(choisi.nom) + '</em>' : '') + '</span>' +
      '<p class="jm-aide">Toutes les vignettes montrent le même sujet, pour comparer les styles. ★ : vos favoris passent en tête.</p>' +
      '<ul class="jm-styles">' + tuile('', 'Aucun style', '', false, 'Le style photo Melodia : or, ivoire, lumière douce.') +
        l.map(function (x) { return tuile(x.id, x.nom, x.vignette, fav.indexOf(x.id) !== -1, x.desc); }).join('') + '</ul>' +
      (choisi && choisi.desc ? '<p class="jm-style-desc">' + esc(choisi.desc) + '</p>' : '') +
      (choisi ? '<div class="jm-gen-l jm-intensite"><span class="jm-gen-k">Intensité du style</span>' + puces('intensite', INTENSITE_CHOIX, Number(g.intensite) === 1 ? '1' : '2') + '</div>' : '') +
      '</div>';
  }

  function blocHistorique() {
    var h = historique();
    if (!h.length) return '';
    return '<details class="jm-historique"><summary>Mes dernières demandes (' + h.length + ')</summary><ul>' + h.map(function (x, i) {
      var st = styleDe(x.style);
      return '<li><button type="button" class="jm-histo" data-jm-histo="' + i + '">' + esc(x.texte.length > 90 ? x.texte.slice(0, 88) + '…' : x.texte) +
        '<small>' + esc((st ? st.nom + ' · ' + INTENSITES[x.intensite || 2] : 'Sans style') + ' · ' + ((FORMATS_GEN.filter(function (f) { return f[0] === x.format; })[0] || ['', ''])[1])) + '</small></button></li>';
    }).join('') + '</ul></details>';
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
    if (o.logo !== 'aucun' && logo) poserLogo(x, W, H, logo, o.logo === 'bas' ? 'bas' : o.logo === 'gauche' ? 'gauche' : 'haut', o.format);
  }

  /* ─── Logo officiel : posé à l'identique ─────────────────────────
     Proportions d'origine, fichier 1600 px réduit en haute qualité (net),
     marges de sécurité (zones d'interface des stories comprises), et
     variante choisie selon la clarté du fond : sur fond sombre, le logo
     or est posé en mode « écran » (son noir disparaît, le dessin reste
     exact) ; sur fond clair, il est posé sur sa propre pastille noire,
     comme le fichier d'origine, pour rester lisible. */
  function clarte(x, bx, by, bw, bh) { return analyser(x, bx, by, bw, bh).moy; }
  /* Ce qu'il y a sous le logo : clarté moyenne, clarté des points les plus clairs (95e centile),
     part de points clairs et agitation (écart type). Toile illisible : fond Melodia supposé sombre et calme. */
  function analyser(x, bx, by, bw, bh) {
    try {
      var d = x.getImageData(Math.max(0, bx | 0), Math.max(0, by | 0), Math.max(1, bw | 0), Math.max(1, bh | 0)).data;
      var l = [], t = 0, t2 = 0, clairs = 0;
      for (var i = 0; i < d.length; i += 16) {
        var v = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        l.push(v); t += v; t2 += v * v; if (v > 0.3) clairs++;
      }
      if (!l.length) return { moy: 0, p95: 0, clairs: 0, ecart: 0 };
      l.sort(function (u, w) { return u - w; });
      var m = t / l.length;
      return { moy: m, p95: l[Math.min(l.length - 1, Math.floor(l.length * 0.95))], clairs: clairs / l.length, ecart: Math.sqrt(Math.max(0, t2 / l.length - m * m)) };
    } catch (e) { return { moy: 0, p95: 0, clairs: 0, ecart: 0 }; }
  }
  function placeLogo(W, H, ou, format) {
    var story = H / W > 1.5, large = W / H > 1.5;
    var t = Math.round(large ? H * 0.3 : story ? W * 0.34 : W * 0.26);
    var marge = Math.round(Math.min(W, H) * (story ? 0.06 : 0.05));
    var haut = story ? Math.round(H * 0.075) : marge;
    var bas = story ? Math.round(H * 0.13) : marge;
    var x0 = ou === 'gauche' || (large && ou !== 'bas') ? marge : Math.round((W - t) / 2);
    var y0 = ou === 'bas' ? H - bas - t : haut;
    return { x: x0, y: y0, t: t };
  }
  /* Voile doux (ellipse) sous le logo : plein au centre, fondu vers les bords, jamais de bord net. */
  function voile(x, cx, cy, rx, ry, couleur, a) {
    x.save();
    x.translate(cx, cy); x.scale(1, ry / rx);
    var g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(' + couleur + ',' + a + ')');
    g.addColorStop(0.62, 'rgba(' + couleur + ',' + a + ')');
    g.addColorStop(0.84, 'rgba(' + couleur + ',' + (a * 0.4).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + couleur + ',0)');
    x.fillStyle = g; x.fillRect(-rx, -rx, rx * 2, rx * 2);
    x.restore();
  }
  /* En mode « écran », le fond presque noir du fichier (halo sombre de 1 à 14/255) éclaircirait la zone en un carré
     à peine visible. On en fait une copie dont seul ce fond est ramené au noir pur (point noir), les ors
     étant remis à leur valeur par la même règle : le dessin, ses couleurs et ses proportions ne changent pas. */
  var logoEcranCache = null;
  function logoEcran(logo) {
    if (logoEcranCache && logoEcranCache.src === logo) return logoEcranCache.cv;
    try {
      var cv = document.createElement('canvas'); cv.width = logo.naturalWidth; cv.height = logo.naturalHeight;
      var c = cv.getContext('2d'); c.drawImage(logo, 0, 0);
      var im = c.getImageData(0, 0, cv.width, cv.height), d = im.data, k = 14, f = 255 / (255 - k);
      for (var i = 0; i < d.length; i += 4) {
        d[i] = Math.max(0, d[i] - k) * f; d[i + 1] = Math.max(0, d[i + 1] - k) * f; d[i + 2] = Math.max(0, d[i + 2] - k) * f;
      }
      c.putImageData(im, 0, 0);
      logoEcranCache = { src: logo, cv: cv };
      return cv;
    } catch (e) { return logo; } // toile protégée : le fichier tel quel
  }
  var SEUIL_CLAIR = 0.42;
  var PART_CLAIRS_MAX = 0.25;
  var SEUIL_SOMBRE = 0.3;      // en dessous : toujours « écran » (avec voile si besoin), jamais de pastille sur une image sombre      // au-delà : fond clair, pastille noire d'origine
  var NOIR_VISE = 0.05;        // sous le logo « écran », les points clairs ne doivent pas dépasser cette clarté
  function poserLogo(x, W, H, logo, ou, format) {
    var p = placeLogo(W, H, ou, format);
    var ratio = logo.naturalHeight / logo.naturalWidth || 1;
    var l = p.t, h = Math.round(p.t * ratio);
    var cx = p.x + l / 2, cy = p.y + h / 2;
    var a0 = analyser(x, p.x, p.y, l, h);
    var agite = a0.p95 > 0.16 || a0.ecart > 0.07 || a0.clairs > 0.02;
    var voileA = 0;
    x.save();
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    // « écran » seulement si le fond est sombre ET surtout sombre : un fond coloré et clair par endroits
    // (plus d'un quart de points clairs) reçoit la pastille d'origine, plus nette qu'un grand voile ;
    // le halo ivoire n'est mis que sur une image claire.
    var ecran = a0.moy < SEUIL_SOMBRE || (a0.moy < SEUIL_CLAIR && a0.clairs < PART_CLAIRS_MAX);
    if (ecran) {
      // fond sombre : logo or en « écran » (son noir disparaît). Tout point clair dessous traverserait le
      // dessin (pétale derrière le « F ») : on assombrit doucement la zone jusqu'à un noir presque pur.
      voileA = agite ? Math.min(0.97, Math.max(0.7, 1 - NOIR_VISE / Math.max(a0.p95, 0.01))) : 0.55;
      voile(x, cx, cy, l * 0.95, h * 0.95, '4,4,7', voileA);
      var a1 = analyser(x, p.x + l * 0.08, p.y + h * 0.08, l * 0.84, h * 0.84);
      if (a1.p95 > NOIR_VISE * 1.6) { // encore des reflets : seconde passe, plus serrée
        voile(x, cx, cy, l * 0.8, h * 0.8, '4,4,7', Math.min(0.92, 1 - NOIR_VISE / Math.max(a1.p95, 0.01)));
        voileA = Math.min(0.99, voileA + 0.3);
      }
      x.globalCompositeOperation = 'screen';
      x.drawImage(logoEcran(logo), p.x, p.y, l, h);
    } else {
      // fond clair : pastille noire du fichier d'origine (logo exact, dessin et fond d'origine).
      // Sur un fond chargé, un halo ivoire doux détache la pastille ; sinon une ombre légère suffit.
      if (agite && a0.moy >= SEUIL_CLAIR) { voile(x, cx, cy, l * 0.82, h * 0.82, '244,241,234', 0.75); voileA = 0.75; }
      var r = Math.round(l * 0.12);
      x.save();
      x.shadowColor = 'rgba(0,0,0,.28)'; x.shadowBlur = Math.round(l * 0.06); x.shadowOffsetY = Math.round(l * 0.012);
      x.fillStyle = '#040407';
      x.beginPath(); if (x.roundRect) x.roundRect(p.x, p.y, l, h, r); else x.rect(p.x, p.y, l, h); x.fill();
      x.restore();
      x.beginPath();
      if (x.roundRect) x.roundRect(p.x, p.y, l, h, r); else x.rect(p.x, p.y, l, h);
      x.closePath(); x.clip();
      x.drawImage(logo, p.x, p.y, l, h);
    }
    x.restore();
    return { x: p.x, y: p.y, l: l, h: h, variante: ecran ? 'clair' : 'sombre', voile: Number(voileA.toFixed(2)), agite: agite, mesure: { moy: +a0.moy.toFixed(3), p95: +a0.p95.toFixed(3), clairs: +a0.clairs.toFixed(3), ecart: +a0.ecart.toFixed(3) } };
  }

  /* ─── Visuel final d'une génération (v2 : « bandeau ») ──────────────
     Le moteur d'images n'obéit pas toujours à la consigne « zone du logo vide ».
     On ne lui demande donc plus rien de certain : la scène est posée SOUS un
     bandeau uni (en haut pour le post et la story, à gauche pour la bannière),
     de la teinte sombre de la scène elle-même, fondu en dégradé sur toute la
     largeur. Le logo officiel est posé sur ce fond uni : rien derrière lui,
     jamais de voile local. Le pied (mot, devise, adresse) repose de même sur
     un fond uni, ce qui efface aussi les faux sigles que le moteur dessine
     parfois en bas d'image. */
  var TON_DEFAUT = { r: 4, g: 4, b: 7, lum: 0.016, sombre: true };
  function lumDe(r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
  /* L'image réduite en petit (lecture rapide) : pixels RGBA, ou null si la toile est protégée. */
  function petite(img, n) {
    try {
      var k = n / Math.max(img.width, img.height), w = Math.max(8, Math.round(img.width * k)), h = Math.max(8, Math.round(img.height * k));
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      var c = cv.getContext('2d'); c.drawImage(img, 0, 0, w, h);
      return { w: w, h: h, d: c.getImageData(0, 0, w, h).data };
    } catch (e) { return null; }
  }
  /* Teinte du fond de la scène : médiane des points les plus sombres de ses bords (haut, côtés). */
  function tonScene(px) {
    if (!px) return TON_DEFAUT;
    var l = [];
    for (var y = 0; y < px.h; y++) for (var x = 0; x < px.w; x++) {
      if (y > px.h * 0.18 && x > px.w * 0.1 && x < px.w * 0.9) continue;
      var i = (y * px.w + x) * 4; l.push([lumDe(px.d[i], px.d[i + 1], px.d[i + 2]), px.d[i], px.d[i + 1], px.d[i + 2]]);
    }
    if (!l.length) return TON_DEFAUT;
    l.sort(function (u, v) { return u[0] - v[0]; });
    var m = l[Math.floor(l.length * 0.3)];
    if (m[0] < SEUIL_CLAIR) {
      // fond sombre : la teinte de la scène, ramenée assez bas pour que l'or du logo chante (≤ 6 %)
      var f = m[0] > 0.06 ? 0.06 / m[0] : 1;
      return { r: Math.round(m[1] * f), g: Math.round(m[2] * f), b: Math.round(m[3] * f), lum: m[0] * f, sombre: true };
    }
    return { r: m[1], g: m[2], b: m[3], lum: m[0], sombre: false };
  }
  /* Où commence le sujet : première ligne (dans le tiers central, sous le logo) et première colonne
     (dans la hauteur centrale, à côté du logo) qui s'écartent nettement du fond. */
  function bordsSujet(px, ton) {
    if (!px) return { haut: 0.2, gauche: 0.2, bas: 0.9 };
    function ecarte(x, y) { var i = (y * px.w + x) * 4; return Math.abs(lumDe(px.d[i], px.d[i + 1], px.d[i + 2]) - ton.lum) > 0.25; }
    var x, y, n, x0 = Math.floor(px.w * 0.35), x1 = Math.ceil(px.w * 0.65), y0 = Math.floor(px.h * 0.15), y1 = Math.ceil(px.h * 0.85);
    for (y = 0; y < px.h; y++) { n = 0; for (x = x0; x < x1; x++) if (ecarte(x, y)) n++; if (n / (x1 - x0) > 0.04) break; }
    var haut = y / px.h;
    for (x = 0; x < px.w; x++) { n = 0; for (y = y0; y < y1; y++) if (ecarte(x, y)) n++; if (n / (y1 - y0) > 0.04) break; }
    var gauche = x / px.w;
    for (y = px.h - 1; y > 0; y--) { n = 0; for (x = x0; x < x1; x++) if (ecarte(x, y)) n++; if (n / (x1 - x0) > 0.04) break; }
    var bas = (y + 1) / px.h;
    return { haut: Math.min(haut, 0.6), gauche: Math.min(gauche, 0.6), bas: Math.max(bas, Math.min(haut, 0.6) + 0.3) };
  }
  function rgba(t, a) { return 'rgba(' + t.r + ',' + t.g + ',' + t.b + ',' + a + ')'; }
  /* Dégradé vers le ton, de a0 à a1, en courbe douce (smoothstep, huit arrêts) : aucune marche visible. */
  function fondu(x, ton, x0, y0, x1, y1, a0, a1, rx, ry, rw, rh) {
    var g = x.createLinearGradient(x0, y0, x1, y1);
    for (var k = 0; k <= 8; k++) { var t = k / 8, e = t * t * (3 - 2 * t); g.addColorStop(t, rgba(ton, (a0 + (a1 - a0) * e).toFixed(3))); }
    x.fillStyle = g; x.fillRect(rx, ry, rw, rh);
  }
  /* Mise en page : bandeau du logo, place de la scène (plein cadre, décalée sous le bandeau), pied. Pure (testable). */
  function plan(W, H, ratioLogo, bords, iw, ih, pied) {
    var story = H / W > 1.5, large = W / H > 1.5;
    var m = Math.round(Math.min(W, H) * (story ? 0.06 : 0.05));
    var r = { story: story, large: large }, s, couvre;
    if (large) {
      var tl = Math.round(H * 0.34), hl = Math.round(tl * ratioLogo);
      r.logo = { x: Math.round(m * 1.4), y: Math.round((H - hl) / 2 - H * 0.04), l: tl, h: hl };
      r.bande = Math.round(m * 2.8 + tl);               // fin du bandeau uni (à gauche)
      r.fondu = Math.round(W * 0.12);
      var L = r.bande + r.fondu * 0.25;                   // le sujet commence au-delà du bandeau uni
      couvre = H / ih;
      s = Math.min(Math.max(couvre, (W - L) / ((1 - bords.gauche) * iw)), couvre * 1.6);
      r.scene = { w: iw * s, h: ih * s };
      r.scene.x = Math.min(L - bords.gauche * r.scene.w, r.bande);
      if (r.scene.x + r.scene.w < W) r.scene.x = Math.max(r.bande - r.fondu, W - r.scene.w);
      r.scene.y = (H - r.scene.h) / 2;
      r.cx = r.bande + (W - r.bande) / 2;
    } else {
      var t = Math.round(story ? W * 0.34 : W * 0.21), h = Math.round(t * ratioLogo);
      var haut = story ? Math.round(H * 0.075) : m;
      r.logo = { x: Math.round((W - t) / 2), y: haut, l: t, h: h };
      r.bande = haut + h + Math.round(m * 0.5);         // fin du bandeau uni (en haut)
      r.fondu = Math.round(H * (story ? 0.1 : 0.14));
      var T = r.bande + r.fondu * 0.25;
      couvre = W / iw;
      // le sujet (du haut des fleurs au pied du vase) doit tenir entre le bandeau et le pied ;
      // plein cadre s'il y tient, sinon la scène est réduite et ses côtés fondus dans le ton
      var place = (pied || H) - T - Math.round(H * 0.02);
      s = Math.max(couvre * 0.68, Math.min(couvre, place / (Math.max(0.3, (bords.bas || 0.9) - bords.haut) * ih)));
      r.scene = { w: iw * s, h: ih * s };
      r.scene.x = (W - r.scene.w) / 2;
      r.scene.y = Math.min(T - bords.haut * r.scene.h, r.bande);
      // plein cadre : pas de vide sous la scène ; scène réduite : elle reste où le sujet tient
      if (s >= couvre - 1e-6 && r.scene.y + r.scene.h < H) r.scene.y = Math.max(r.bande - r.fondu, H - r.scene.h);
      r.cx = W / 2;
    }
    r.marge = m;
    return r;
  }
  function composer(cv, img, logo, o) {
    var F = FORMATS_EDIT[o.format] || FORMATS_EDIT.post, W = F[0], H = F[1];
    cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    var px = petite(img, 96), ton = tonScene(px), bords = bordsSujet(px, ton);
    var ratio = logo ? (logo.naturalHeight / logo.naturalWidth || 1) : 1;
    var story = H / W > 1.5, large = W / H > 1.5;
    var bas = story ? Math.round(H * 0.13) : Math.round(Math.min(W, H) * 0.05);
    var t2 = Math.round(Math.min(W, H) * (large ? 0.03 : 0.026));
    var tm = Math.round(Math.min(W, H) * (large ? 0.065 : 0.06));
    var zone = (o.signature ? t2 * 3.4 : 0) + (o.mot ? tm * 1.6 * Math.min(2, couperN(x, o.mot, tm, W * 0.84)) : 0);
    var haut = zone ? H - bas - zone - t2 : H - Math.round(H * 0.06);
    var P = plan(W, H, ratio, bords, img.width, img.height, haut);
    x.fillStyle = rgba(ton, 1); x.fillRect(0, 0, W, H);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    var sc = P.scene;
    x.drawImage(img, sc.x, sc.y, sc.w, sc.h);
    // bords de la scène restés dans le cadre : fondus dans le ton (aucune arête)
    var fe = Math.round(Math.min(W, H) * 0.12);
    if (sc.x > 0.5) { fondu(x, ton, sc.x, 0, sc.x + fe, 0, 1, 0, sc.x, 0, fe, H); fondu(x, ton, sc.x + sc.w, 0, sc.x + sc.w - fe, 0, 1, 0, sc.x + sc.w - fe, 0, fe, H); }
    if (sc.y > 0.5) fondu(x, ton, 0, sc.y, 0, sc.y + fe, 1, 0, 0, sc.y, W, fe);
    if (sc.y + sc.h < H - 0.5) fondu(x, ton, 0, sc.y + sc.h, 0, sc.y + sc.h - fe, 1, 0, 0, sc.y + sc.h - fe, W, fe);
    // bandeau du logo : uni, puis dégradé sur toute la largeur (ou hauteur)
    if (P.large) {
      x.fillStyle = rgba(ton, 1); x.fillRect(0, 0, P.bande, H);
      fondu(x, ton, P.bande, 0, P.bande + P.fondu, 0, 1, 0, P.bande, 0, P.fondu, H);
    } else {
      x.fillStyle = rgba(ton, 1); x.fillRect(0, 0, W, P.bande);
      fondu(x, ton, 0, P.bande, 0, P.bande + P.fondu, 1, 0, 0, P.bande, W, P.fondu);
    }
    // pied : fond uni sous le texte (et sous les faux sigles du moteur)
    var ff = Math.round(H * 0.08);
    fondu(x, ton, 0, haut - ff, 0, haut, 0, 1, 0, haut - ff, W, ff);
    x.fillStyle = rgba(ton, 1); x.fillRect(0, haut, W, H - haut);
    var clair = !ton.sombre;
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    var y = H - bas, cx = P.cx;
    if (o.signature) {
      x.font = '400 ' + t2 + 'px Jost, Arial, sans-serif';
      x.fillStyle = clair ? '#806a30' : '#c9a84c';
      x.fillText('MELODIA-FUNEBRE.FR', cx, y);
      y -= t2 * 1.6;
      x.font = 'italic 300 ' + Math.round(t2 * 1.25) + 'px "Cormorant Garamond", Georgia, serif';
      x.fillStyle = clair ? '#17150f' : '#f2efe8';
      x.fillText(DEVISE, cx, y);
      y -= t2 * 1.9;
    }
    if (o.mot) {
      x.font = '300 ' + tm + 'px "Cormorant Garamond", Georgia, serif';
      x.fillStyle = clair ? '#17150f' : '#f2efe8';
      couper(x, o.mot, W * 0.84).slice(0, 2).reverse().forEach(function (l) { x.fillText(l, cx, y); y -= tm * 1.15; });
    }
    if (!logo) return null;
    var L = P.logo;
    x.save();
    if (ton.sombre) {
      // fond uni sombre : logo or en « écran », son noir se fond exactement dans le ton
      x.globalCompositeOperation = 'screen';
      x.drawImage(logoEcran(logo), L.x, L.y, L.l, L.h);
    } else {
      // fond clair : la pastille noire d'origine, coins adoucis, ombre légère
      var rr = Math.round(L.l * 0.12);
      x.shadowColor = 'rgba(0,0,0,.22)'; x.shadowBlur = Math.round(L.l * 0.05); x.shadowOffsetY = Math.round(L.l * 0.01);
      x.fillStyle = '#040407';
      x.beginPath(); if (x.roundRect) x.roundRect(L.x, L.y, L.l, L.h, rr); else x.rect(L.x, L.y, L.l, L.h); x.fill();
      x.shadowColor = 'transparent';
      x.beginPath(); if (x.roundRect) x.roundRect(L.x, L.y, L.l, L.h, rr); else x.rect(L.x, L.y, L.l, L.h); x.closePath(); x.clip();
      x.drawImage(logo, L.x, L.y, L.l, L.h);
    }
    x.restore();
    return { x: L.x, y: L.y, l: L.l, h: L.h, variante: ton.sombre ? 'clair' : 'sombre', mise: 'bandeau', ton: ton, bande: P.bande, scene: sc };
  }
  function couperN(x, t, tm, max) {
    x.font = '300 ' + tm + 'px "Cormorant Garamond", Georgia, serif';
    return couper(x, t, max).length;
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

  /* ─── Résultat : logo posé, puis Télécharger / Partager / Garder ─── */
  async function imageBrute(c) {
    // relais par le serveur (même origine) : la toile reste lisible et exportable
    if (c.tache && session()) {
      try {
        var r = await fetch('/api/medias-generer?brut=' + encodeURIComponent(c.tache) + (c.n ? '&n=' + c.n : ''), { headers: J.entetes(), credentials: 'same-origin' });
        if (r.ok) return await charge(URL.createObjectURL(await r.blob()));
      } catch (e) { /* repli sur l'adresse directe */ }
    }
    return charge(c.url);
  }

  async function resultat(c) {
    var o = { format: c.format || 'post', signature: c.signature !== false, mot: c.mot || '' };
    var d = dialogue('jm-edition jm-resultat', '<div class="jm-apercu-media"><canvas class="jm-toile" aria-label="Votre visuel Melodia"></canvas></div><div class="jm-apercu-cote">' +
      '<h2 class="jm-apercu-t">Votre visuel</h2>' +
      '<p class="jm-aide">' + esc(c.texte || '') + '</p>' +
      '<label class="jm-case"><input type="checkbox" data-r="signature"' + (o.signature ? ' checked' : '') + '> Signature et melodia-funebre.fr</label>' +
      '<label class="jm-gen-l"><span class="jm-gen-k">Un mot</span><input type="text" class="jm-champ" maxlength="60" data-r="mot" value="' + esc(o.mot) + '" placeholder="Facultatif"></label>' +
      '<div class="jm-partage jm-gros"><button type="button" class="btn btn-gold" data-r-telecharger>⇩ Télécharger</button>' +
      '<button type="button" class="btn btn-outline" data-r-partager>Partager</button>' +
      '<button type="button" class="btn btn-outline" data-r-garder>Garder dans Mes créations</button></div>' +
      (c.texte ? '<button type="button" class="btn btn-sm btn-outline jm-recommencer" data-r-recommencer>↻ Recommencer avec le même style</button>' : '') +
      '<details class="jm-legendes"><summary>Légendes prêtes par réseau</summary>' + Object.keys(LEGENDES).map(function (k) {
        return '<div class="jm-legende-l"><span class="jm-gen-k">' + LEGENDES[k][0] + '</span><textarea class="jm-champ" rows="3" data-r-legende-t="' + k + '">' + esc(legende(k, o)) + '</textarea>' +
          '<button type="button" class="btn btn-sm btn-outline" data-r-copier="' + k + '">Copier</button></div>';
      }).join('') + '</details>' +
      '<label class="jm-gen-l"><span class="jm-gen-k">Texte alternatif (accessibilité)</span><textarea class="jm-champ" rows="2" data-r-alt>' + esc(texteAlt(c, o)) + '</textarea>' +
        '<button type="button" class="btn btn-sm btn-outline" data-r-copier="alt">Copier le texte alternatif</button></label>' +
      '<p class="jm-aide">Le logo est le fichier officiel, posé à l’identique ; sa variante (sur fond sombre ou clair) se choisit seule.</p></div>');
    var cv = d.querySelector('canvas'), img, logo;
    try {
      if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load('300 40px "Cormorant Garamond"'), document.fonts.load('italic 300 40px "Cormorant Garamond"'), document.fonts.load('400 20px Jost')]).catch(function () {});
      img = await imageBrute(c); logo = await charge(LOGO);
    } catch (e) { dire(e.message || 'Image illisible.'); return; }
    function maj() { composer(cv, img, logo, o); }
    maj();
    d.addEventListener('input', function (ev) {
      var k = ev.target.dataset && ev.target.dataset.r; if (!k) return;
      o[k] = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value; maj();
      // le mot et la signature se reportent dans les légendes et le texte alternatif tant qu'ils n'ont pas été retouchés à la main
      d.querySelectorAll('[data-r-legende-t]').forEach(function (t) { if (!t.dataset.touche) t.value = legende(t.dataset.rLegendeT, o); });
      var al = d.querySelector('[data-r-alt]'); if (al && !al.dataset.touche) al.value = texteAlt(c, o);
    });
    d.addEventListener('change', function (ev) { if (ev.target.matches('[data-r-legende-t], [data-r-alt]')) ev.target.dataset.touche = '1'; });
    function blob() { return new Promise(function (ok, ko) { try { cv.toBlob(function (b) { b ? ok(b) : ko(new Error('Export impossible.')); }, 'image/jpeg', 0.92); } catch (e) { ko(new Error('Export impossible : image d’une autre origine.')); } }); }
    var nom = 'melodia-visuel-' + o.format + '-' + new Date().toISOString().slice(0, 10) + '.jpg';
    d.addEventListener('click', async function (ev) {
      try {
        if (ev.target.closest('[data-r-telecharger]')) {
          var u = URL.createObjectURL(await blob()), a = document.createElement('a'); a.href = u; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(u); }, 4000); return dire('Visuel téléchargé.');
        }
        if (ev.target.closest('[data-r-partager]')) {
          var f = new File([await blob()], nom, { type: 'image/jpeg' });
          var leg = (d.querySelector('[data-r-legende-t="instagram"]') || {}).value || LEGENDE_CREE;
          if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: leg }); return; }
          await copier(leg);
          return dire('Ce navigateur ne partage pas d’image : téléchargez-la puis publiez-la (légende copiée).');
        }
        if (ev.target.closest('[data-r-garder]')) return garder(c, o, cv);
        var cp = ev.target.closest('[data-r-copier]');
        if (cp) {
          var z = cp.dataset.rCopier === 'alt' ? d.querySelector('[data-r-alt]') : d.querySelector('[data-r-legende-t="' + cp.dataset.rCopier + '"]');
          if (z) { await copier(z.value); dire('Texte copié.'); }
          return;
        }
        if (ev.target.closest('[data-r-recommencer]')) {
          d.close();
          etat.gen.texte = c.texte; etat.gen.carte = c.carte || ''; etat.gen.style = c.style || ''; etat.gen.intensite = c.intensite || 2;
          etat.gen.format = c.format || etat.gen.format;
          return generer();
        }
      } catch (e) { if (!(e && e.name === 'AbortError')) dire(e.message || 'Action impossible.'); }
    });
  }

  async function garder(c, o, cv) {
    var data = '';
    try { data = cv.toDataURL('image/jpeg', 0.9); } catch (e) { data = ''; }
    var st = styleDe(c.style);
    var titre = (c.carteNom || 'Visuel Melodia') + (st ? ' · ' + st.nom : '');
    if (data && session()) {
      try {
        var r = await fetch('/api/medias-generer', { method: 'POST', headers: J.entetes(), credentials: 'same-origin', body: JSON.stringify({ garder: data }) });
        var d = await r.json().catch(function () { return {}; });
        if (r.ok && d.url) {
          etat.serveur.unshift({ id: d.id, url: d.url, le: new Date().toISOString(), titre: titre });
          rendre(); return dire('Gardé dans Mes créations.');
        }
      } catch (e) { /* repli local */ }
    }
    if (!c.tache) return dire('Impossible de garder cette image.');
    var l = lireCrees().filter(function (x) { return !(x.tache === c.tache && (x.n || 0) === (c.n || 0)); });
    l.unshift({ id: c.tache + (c.n ? '-' + c.n : ''), tache: c.tache, n: c.n || 0, url: c.url, format: o.format, mot: o.mot, signature: o.signature, texte: c.texte, carte: c.carte || '', style: c.style || '', intensite: c.intensite || 2, titre: titre, le: c.le || new Date().toISOString() });
    ecrireCrees(l); rendre();
    dire('Gardé dans Mes créations (dans ce navigateur).');
  }

  /* ─── Génération ─────────────────────────────────────────────── */
  function carteDe(id) { return etat.idees.filter(function (i) { return i.id === id; })[0] || null; }
  // la carte compte tant que son idée est encore dans le texte (Julie peut compléter)
  function carteGardee() {
    var c = carteDe(etat.gen.carte);
    return c && etat.gen.texte.indexOf(c.idee.slice(0, 30)) !== -1 ? c : null;
  }

  async function generer() {
    if (etat.enCours) return;
    var g = etat.gen;
    if (String(g.texte).trim().length < 3) { etat.message = 'Décrivez votre image en quelques mots, ou touchez une carte d’idée.'; return rendre(); }
    if (!session()) { etat.message = 'Connectez-vous pour générer un visuel.'; return rendre(); }
    var carte = carteGardee();
    etat.enCours = true; etat.message = 'Demande envoyée…'; rendre();
    try {
      var r = await fetch('/api/medias-generer', { method: 'POST', headers: J.entetes(), credentials: 'same-origin', body: JSON.stringify({ texte: g.texte, format: g.format, carte: carte ? carte.id : '', style: g.style, intensite: Number(g.intensite) === 1 ? 1 : 2, variantes: Math.min(4, Math.max(1, Number(g.variantes) || 1)) }) });
      var d = await r.json().catch(function () { return {}; });
      if (r.status === 503 && d.code === 'GENERATION_INACTIVE') {
        etat.actif = false;
        etat.message = esc(d.error);
        return;
      }
      if (!r.ok || !d.tache) { etat.message = esc(d.error || 'La génération a échoué.'); return; }
      noterHistorique({ texte: g.texte, carte: carte ? carte.id : '', style: g.style, intensite: g.intensite, format: g.format });
      var nv = Number(d.variantes) || 1;
      etat.message = (nv > 1 ? nv + ' variantes' : 'Image') + ' en préparation (environ ' + Math.max(1, Math.round((d.eta || 60) / 60)) + ' min)…' + (d.plafonne ? ' Plafond du jour presque atteint : ' + nv + ' seulement.' : ''); rendre();
      var fin = Date.now() + 4 * 60 * 1000;
      while (Date.now() < fin) {
        await new Promise(function (ok) { setTimeout(ok, 6000); });
        var s = await fetch('/api/medias-generer?tache=' + encodeURIComponent(d.tache), { headers: J.entetes(), credentials: 'same-origin' });
        var e = await s.json().catch(function () { return {}; });
        if (e.statut === 'fait' && e.url) {
          etat.message = 'Visuel prêt.';
          etat.enCours = false; rendre();
          var base = { tache: d.tache, format: d.format || g.format, texte: g.texte, mot: g.motActif ? g.mot : '', signature: g.signature, carte: carte ? carte.id : '', carteNom: carte ? carte.nom : '', style: g.style, intensite: g.intensite, le: new Date().toISOString() };
          var imgs = Array.isArray(e.images) && e.images.length ? e.images : [{ n: 0, url: e.url }];
          if (imgs.length === 1) return resultat(Object.assign({}, base, { n: imgs[0].n || 0, url: imgs[0].url }));
          return choisirVariante(base, imgs);
        }
        if (e.statut === 'en-cours' && e.total > 1) { etat.message = 'Variantes prêtes : ' + (e.faites || 0) + ' sur ' + e.total + '…'; rendre(); }
        if (e.statut === 'echec' || !s.ok) { etat.message = esc(e.error || 'La génération a échoué.'); return; }
      }
      etat.message = 'Le moteur est lent : la tâche continue, revenez dans quelques minutes.';
    } catch (err) {
      etat.message = 'Réseau indisponible.';
    } finally { etat.enCours = false; rendre(); }
  }

  /* Plusieurs variantes : Julie choisit, puis la variante s'ouvre avec le logo posé. */
  function choisirVariante(base, imgs) {
    var d = dialogue('jm-edition jm-variantes', '<div class="jm-apercu-cote jm-variantes-c"><h2 class="jm-apercu-t">Choisissez votre variante</h2>' +
      '<p class="jm-aide">Touchez une image : le logo officiel y sera posé, puis vous pourrez la télécharger, la partager ou la garder.</p>' +
      '<ul class="jm-variantes-g">' + imgs.map(function (x, i) {
        return '<li><button type="button" class="jm-variante" data-jm-variante="' + i + '"><img src="' + esc(x.url) + '" alt="Variante ' + (i + 1) + '" loading="lazy"><span>Variante ' + (i + 1) + '</span></button></li>';
      }).join('') + '</ul></div>');
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-jm-variante]'); if (!b) return;
      var x = imgs[Number(b.dataset.jmVariante)] || imgs[0];
      d.close();
      resultat(Object.assign({}, base, { n: x.n || 0, url: x.url }));
    });
    return d;
  }

  /* ─── Légendes par réseau et texte alternatif ─────────────────── */
  var LEGENDES = {
    instagram: ['Instagram', function (mot) { return (mot ? mot + '\n\n' : '') + 'Une chanson originale, écrite et composée pour rendre hommage à celles et ceux que l’on aime.\n\nChaque vie mérite sa chanson.\nLien en bio · melodia-funebre.fr\n\n#hommage #souvenir #chansonoriginale #musique #deuil #melodiafunebre'; }],
    facebook: ['Facebook', function (mot) { return (mot ? mot + '\n\n' : '') + 'Rendre hommage autrement : Melodia Funèbre compose une chanson originale à partir de vos souvenirs, pour accompagner un adieu ou un moment de mémoire.\n\nChaque vie mérite sa chanson.\n' + SITE; }],
    linkedin: ['LinkedIn', function (mot) { return (mot ? mot + '\n\n' : '') + 'Melodia Funèbre compose des chansons originales pour les cérémonies et les hommages : un accompagnement humain, une musique unique, aux côtés des familles et des professionnels du funéraire.\n\n' + SITE; }],
    whatsapp: ['WhatsApp', function (mot) { return (mot ? mot + ' · ' : '') + 'Chaque vie mérite sa chanson. Melodia Funèbre compose une chanson originale pour rendre hommage à un proche : ' + SITE; }]
  };
  function legende(k, o) { var l = LEGENDES[k]; return l ? l[1](String((o && o.mot) || '').trim()) : LEGENDE_CREE; }
  function texteAlt(c, o) {
    var t = String(c.texte || '').trim().replace(/[.\s]+$/, '');
    var st = styleDe(c.style);
    var a = 'Visuel Melodia Funèbre' + (t ? ' : ' + t.charAt(0).toLowerCase() + t.slice(1) : '') + (st ? ', en style ' + st.nom.toLowerCase() : '') + '.';
    var mot = String((o && o.mot) || '').trim();
    if (mot) a += ' Texte : « ' + mot + ' ».';
    a += ' Logo Melodia Funèbre' + (o && o.signature === false ? '' : ' et mention « ' + DEVISE.replace(/\.$/, '') + ' »') + '.';
    return a;
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
      var fv = ev.target.closest('[data-jm-favori]');
      if (fv) { basculerFavori(fv.dataset.jmFavori); return rendre(); }
      var sy = ev.target.closest('[data-jm-style]');
      if (sy) { etat.gen.style = sy.dataset.jmStyle; return rendre(); }
      var hi = ev.target.closest('[data-jm-histo]');
      if (hi) {
        var h = historique()[Number(hi.dataset.jmHisto)];
        if (h) {
          etat.gen.texte = h.texte; etat.gen.carte = h.carte || ''; etat.gen.style = styleDe(h.style) ? h.style : '';
          etat.gen.intensite = INTENSITES[h.intensite] ? h.intensite : 2; etat.gen.format = h.format || 'post'; rendre();
        }
        return;
      }
      var id = ev.target.closest('[data-jm-idee]');
      if (id) {
        var c = carteDe(id.dataset.jmIdee);
        if (c) { etat.gen.texte = c.idee; etat.gen.carte = c.id; rendre(); var t = view.querySelector('[data-jm-texte]'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }
        return;
      }
      if (ev.target.closest('[data-jm-generer]')) return generer();
      var li = ev.target.closest('[data-jm-id]');
      var m = li && parId(li.dataset.jmId);
      if (!m) return;
      if (m.locale) return resultat(m.locale); // création brute : toujours recomposée, logo compris
      if (ev.target.closest('[data-jm-voir]')) return ouvrir(m);
      if (ev.target.closest('[data-jm-telecharger]')) return ouvrir(m, 'telecharger');
      if (ev.target.closest('[data-jm-partager]')) {
        if (navigator.share && window.matchMedia && window.matchMedia('(pointer: coarse)').matches && (await partageNatif(m, m.formats[0], m.legende))) return;
        return ouvrir(m, 'partager');
      }
      if (ev.target.closest('[data-jm-modifier]')) return editer(m);
    });
    view.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.matches('[data-jm-signature]')) etat.gen.signature = t.checked;
      if (t.matches('[data-jm-mot-actif]')) { etat.gen.motActif = t.checked; rendre(); }
    });
    view.addEventListener('input', function (ev) {
      var t = ev.target;
      if (!t.matches) return;
      if (t.matches('[data-jm-texte]')) {
        etat.gen.texte = t.value;
        var garde = carteGardee();
        if (!garde && etat.gen.carte) { etat.gen.carte = ''; view.querySelectorAll('.jm-idee.est-actif').forEach(function (b) { b.classList.remove('est-actif'); b.setAttribute('aria-pressed', 'false'); }); }
      }
      if (t.matches('[data-jm-mot]')) etat.gen.mot = t.value;
      if (t.matches('[data-jm-intensite]')) {
        etat.gen.intensite = Math.min(3, Math.max(1, Number(t.value) || 2));
        t.setAttribute('aria-valuetext', INTENSITES[etat.gen.intensite]);
        var v = view.querySelector('[data-jm-intensite-v]'); if (v) v.textContent = INTENSITES[etat.gen.intensite];
      }
    });
  }

  window.MelodiaJulieMedias = { vue: vue, dessiner: dessiner, composer: composer, plan: plan, tonScene: tonScene, bordsSujet: bordsSujet, poserLogo: poserLogo, placeLogo: placeLogo, analyser: analyser, resultat: resultat, choisirVariante: choisirVariante, legende: legende, texteAlt: texteAlt, liensPartage: liensPartage, nomFichier: nomFichier, reinitialiser: function () { etat.medias = null; etat.charge = false; } };

  window.MelodiaConsole.ajouterVue('medias', ['Ressources', 'Mes <em>médias</em>', function () { etat.charge = false; return vue(); }, brancher]);
  var hv = (location.hash || '').replace(/^#/, '').split('?')[0];
  // la console a pu démarrer avant ce script, sur la vue par défaut : on relit le hash d'origine
  if (window.MelodiaConsole.hashDemarrage === 'medias') hv = 'medias';
  if (hv === 'medias' && window.MelodiaConsole.demarree && window.MelodiaConsole.courante() !== hv && typeof window.go === 'function') window.go(hv);
})();
