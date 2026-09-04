/* ═══════════════════════════════════════════════════════════════
   MELODIA — Mode propriétaire
   La main sur le contenu du site sans ouvrir une ligne de code.

   Principe : le site lit assets/data/content.json. Ce module édite ce
   contenu, conserve un brouillon local, permet de l'essayer en aperçu
   sur le site réel, puis de le publier.

   Les quatre éditeurs (démos, offres, témoignages, questions) sont
   produits par un même moteur piloté par schéma : ajouter un champ se
   fait en une ligne, pas en réécrivant un formulaire.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLE_BROUILLON = 'melodia_content_draft';
  var CLE_APERCU = 'melodia_content_preview';
  var FICHIER = 'assets/data/content.json';

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  var copie = function (o) { return JSON.parse(JSON.stringify(o)); };
  var uid = function (p) { return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); };

  var etat = { contenu: null, publie: null, section: 'demos', ouvert: null, charge: false };

  /* ═══ Schémas — un éditeur par entrée, sans code dupliqué ═══ */
  var SCHEMAS = {
    demos: {
      cle: 'demos',
      titre: 'Catalogue des réalisations',
      sous: 'Les hommages présentés sur l\'accueil, la page Écouter et l\'espace partenaire. Le catalogue grandit à chaque ajout — aucune mise en page n\'est à reprendre.',
      resume: function (d) { return (d.title || 'Sans titre') + (d.who ? ' — ' + d.who : ''); },
      detail: function (d) { return [d.style, d.lieu].filter(Boolean).join(' · '); },
      champs: [
        { k: 'title', l: 'Titre de l\'hommage', t: 'text', req: true, ph: 'Le Papi Pêcheur' },
        { k: 'who', l: 'La personne', t: 'text', ph: 'Maurice, 78 ans',
          aide: 'Prénom et âge. Sans portrait, l\'initiale devient le sceau de la fiche.' },
        { k: 'photo', l: 'Portrait', t: 'text', ph: 'assets/img/portraits/maurice.jpg',
          aide: 'Facultatif. Une image carrée déposée dans assets/img/portraits/, ou un lien complet. Laissé vide, le sceau doré à l\'initiale reprend sa place — une famille n\'a pas toujours de photo qu\'elle accepte de voir publiée.' },
        { k: 'lieu', l: 'Ville', t: 'text', ph: 'Nantes',
          aide: 'Facultatif. Affichée à côté du style : elle ancre l\'hommage dans un lieu réel.' },
        { k: 'mention', l: 'Mention particulière', t: 'text', ph: 'Hommage à une vivante',
          aide: 'Facultatif. Une étiquette affichée sur la fiche, pour ce qui doit être dit tout de suite : un hommage composé pour une personne vivante, une cérémonie laïque, une commande en urgence. Laissée vide, rien ne s\'affiche.' },
        { k: 'style', l: 'Style musical', t: 'text', ph: 'Chanson française',
          aide: 'Sert aussi de filtre sur la page Écouter. Reprenez un intitulé existant pour regrouper les hommages.' },
        { k: 'audio', l: 'Fichier audio', t: 'text', req: true, ph: 'audio/maurice.mp3',
          aide: 'Un fichier déposé dans le dossier audio/ du site (ex. audio/maurice.mp3), ou un lien complet vers un MP3 hébergé ailleurs.' },
        { k: 'story', l: 'Le texte sur le défunt', t: 'area', ph: 'Pêcheur en bord de Loire pendant quarante ans…',
          aide: 'Qui était cette personne, ce que la famille a raconté, ce que vous en avez fait musicalement. C\'est le cœur de la fiche.' },
        { k: 'lyrics', l: 'Extrait des paroles', t: 'area', ph: 'Quatre paires de mains sur la même canne\nQuatre silences appris au bord de l\'eau',
          aide: 'Deux ou trois vers, un par ligne. Rien ne montre mieux le travail que les mots eux-mêmes.' },
        { k: 'brief', l: 'Les mots de la famille', t: 'text', ph: 'patient · taquin · silencieux',
          aide: 'Les trois mots confiés au départ. Affichés en bas de la fiche : c\'est la preuve la plus parlante du service.' }
      ],
      neuf: function () { return { id: uid('demo'), visible: true, title: '', who: '', lieu: '', style: 'Chanson française', mention: '', audio: '', photo: '', story: '', lyrics: '', brief: '' }; }
    },
    offers: {
      cle: 'offers',
      titre: 'Offres et tarifs',
      sous: 'Prix, intitulés et contenu des trois formules. Appliqués sur l\'accueil et la page Offres.',
      resume: function (o) { return (o.name || 'Sans nom') + ' — ' + (o.price || 0) + ' €'; },
      detail: function (o) { return o.featured ? 'Mise en avant' : ''; },
      sansAjout: true,
      champs: [
        { k: 'name', l: 'Nom de l\'offre', t: 'text', req: true },
        { k: 'price', l: 'Prix en euros', t: 'number', req: true },
        { k: 'desc', l: 'Phrase de présentation', t: 'text' },
        { k: 'tag', l: 'Étiquette', t: 'text', ph: 'Le plus choisi', aide: 'Laissez vide pour n\'afficher aucune étiquette.' },
        { k: 'feats', l: 'Ce que comprend l\'offre', t: 'lignes', aide: 'Une prestation par ligne.' },
        { k: 'muted', l: 'Limites affichées en gris', t: 'lignes', aide: 'Une par ligne. Facultatif.' }
      ],
      neuf: function () { return { id: uid('offre'), name: '', price: 0, desc: '', tag: '', feats: [], muted: [] }; }
    },
    testimonials: {
      cle: 'testimonials',
      titre: 'Témoignages',
      sous: 'Le carrousel de l\'accueil. Rien ne doit y figurer sans l\'accord écrit de la famille.',
      resume: function (t) { return (t.who || 'Anonyme'); },
      detail: function (t) { return (t.text || '').slice(0, 70) + '…'; },
      champs: [
        { k: 'text', l: 'Le témoignage', t: 'area', req: true },
        { k: 'who', l: 'Signature', t: 'text', req: true, ph: 'Claire B. — fille de Maurice, Nantes' },
        { k: 'stars', l: 'Étoiles', t: 'number', ph: '5' }
      ],
      neuf: function () { return { id: uid('temoin'), visible: true, stars: 5, text: '', who: '' }; }
    },
    faq: {
      cle: 'faq',
      titre: 'Questions fréquentes',
      sous: 'Affichées sur l\'accueil, et reprises par Google en résultat enrichi.',
      resume: function (f) { return f.q || 'Nouvelle question'; },
      detail: function (f) { return (f.a || '').slice(0, 70) + '…'; },
      champs: [
        { k: 'q', l: 'La question', t: 'text', req: true },
        { k: 'a', l: 'La réponse', t: 'area', req: true }
      ],
      neuf: function () { return { id: uid('faq'), visible: true, q: '', a: '' }; }
    }
  };

  var ONGLETS = [
    { id: 'demos', l: 'Catalogue' },
    { id: 'offers', l: 'Tarifs' },
    { id: 'testimonials', l: 'Témoignages' },
    { id: 'faq', l: 'Questions' },
    { id: 'reglages', l: 'Réglages' },
    { id: 'clients', l: 'Clients' },
    { id: 'equipe', l: 'Collaborateurs' },
    { id: 'publication', l: 'Publication' }
  ];

  /* ═══ Chargement et brouillon ═══ */
  async function charger() {
    if (etat.charge) return;
    try {
      var r = await fetch(FICHIER + '?t=' + Date.now(), { cache: 'no-store' });
      etat.publie = r.ok ? await r.json() : null;
    } catch (e) { etat.publie = null; }
    var brouillon = null;
    try { brouillon = JSON.parse(localStorage.getItem(CLE_BROUILLON) || 'null'); } catch (e) {}
    etat.contenu = brouillon || copie(etat.publie || { demos: [], offers: [], testimonials: [], faq: [] });
    etat.charge = true;
  }

  function sauver() {
    etat.contenu.updated = new Date().toISOString();
    try { localStorage.setItem(CLE_BROUILLON, JSON.stringify(etat.contenu)); } catch (e) {}
  }

  /** Nombre de blocs différents du contenu publié — sert l'indicateur d'en-tête */
  function modifs() {
    if (!etat.publie) return 0;
    var n = 0;
    ['demos', 'offers', 'testimonials', 'faq', 'contact', 'intro'].forEach(function (k) {
      if (JSON.stringify(etat.contenu[k]) !== JSON.stringify(etat.publie[k])) n++;
    });
    return n;
  }

  /* ═══ Rendu ═══ */
  function render() {
    var hote = $('own-root');
    if (!hote) return;
    var n = modifs();

    hote.innerHTML =
      '<div class="own-bar">' +
        '<div class="own-tabs">' +
          ONGLETS.map(function (o) {
            return '<button class="own-tab' + (etat.section === o.id ? ' active' : '') + '" data-onglet="' + o.id + '">' + o.l + '</button>';
          }).join('') +
        '</div>' +
        '<div class="own-state">' +
          (n ? '<span class="own-dot"></span>' + n + ' bloc' + (n > 1 ? 's' : '') + ' non publié' + (n > 1 ? 's' : '')
             : '<span style="color:var(--green);">✓</span> Tout est publié') +
        '</div>' +
      '</div>' +
      '<div id="own-msg" class="form-msg"></div>' +
      '<div id="own-corps"></div>';

    Array.prototype.forEach.call(hote.querySelectorAll('[data-onglet]'), function (b) {
      b.addEventListener('click', function () { etat.section = b.dataset.onglet; etat.ouvert = null; render(); });
    });

    var corps = $('own-corps');
    if (SCHEMAS[etat.section]) rendreListe(corps, SCHEMAS[etat.section]);
    else if (etat.section === 'reglages') rendreReglages(corps);
    else if (etat.section === 'clients') rendreClients(corps);
    else if (etat.section === 'equipe') rendreEquipe(corps);
    else rendrePublication(corps);
  }

  function message(txt, type) {
    var m = $('own-msg');
    if (!m) return;
    m.className = 'form-msg' + (type ? ' ' + type : '');
    m.textContent = txt || '';
  }

  /* ═══ Éditeur de liste, commun aux quatre contenus ═══ */
  function rendreListe(hote, sc) {
    var liste = etat.contenu[sc.cle] || (etat.contenu[sc.cle] = []);

    hote.innerHTML =
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div><div class="panel-title">' + esc(sc.titre) + '</div>' +
          '<div class="panel-sub">' + esc(sc.sous) + '</div></div>' +
          (sc.sansAjout ? '' : '<button class="btn btn-gold btn-sm" id="own-add">Ajouter</button>') +
        '</div>' +
        (liste.length ? '<div class="own-list">' + liste.map(function (it, i) {
          var ouvert = etat.ouvert === it.id;
          return '<div class="own-item' + (ouvert ? ' open' : '') + (it.visible === false ? ' hidden' : '') + '">' +
            '<div class="own-row">' +
              '<button class="own-grab" data-open="' + esc(it.id) + '">' +
                '<span class="own-name">' + esc(sc.resume(it)) + '</span>' +
                '<span class="own-detail">' + esc(sc.detail(it) || '') + '</span>' +
              '</button>' +
              '<div class="own-acts">' +
                '<button class="own-mini" data-up="' + i + '" ' + (i === 0 ? 'disabled' : '') + ' title="Monter">↑</button>' +
                '<button class="own-mini" data-down="' + i + '" ' + (i === liste.length - 1 ? 'disabled' : '') + ' title="Descendre">↓</button>' +
                (it.visible === undefined ? '' :
                  '<button class="own-mini' + (it.visible === false ? '' : ' on') + '" data-vis="' + i + '" title="Afficher ou masquer sur le site">' +
                  (it.visible === false ? '◌' : '◉') + '</button>') +
                (sc.sansAjout ? '' : '<button class="own-mini danger" data-del="' + i + '" title="Supprimer">✕</button>') +
              '</div>' +
            '</div>' +
            (ouvert ? '<div class="own-form">' + champs(sc, it, i) + '</div>' : '') +
          '</div>';
        }).join('') + '</div>'
        : '<p style="color:var(--ash); font-size:.9rem;">Aucune entrée pour le moment.</p>') +
      '</div>';

    /* Ouverture / fermeture */
    Array.prototype.forEach.call(hote.querySelectorAll('[data-open]'), function (b) {
      b.addEventListener('click', function () {
        etat.ouvert = etat.ouvert === b.dataset.open ? null : b.dataset.open;
        render();
      });
    });
    /* Réordonnancement, visibilité, suppression */
    Array.prototype.forEach.call(hote.querySelectorAll('[data-up]'), function (b) {
      b.addEventListener('click', function () { var i = +b.dataset.up; permuter(liste, i, i - 1); });
    });
    Array.prototype.forEach.call(hote.querySelectorAll('[data-down]'), function (b) {
      b.addEventListener('click', function () { var i = +b.dataset.down; permuter(liste, i, i + 1); });
    });
    Array.prototype.forEach.call(hote.querySelectorAll('[data-vis]'), function (b) {
      b.addEventListener('click', function () {
        var it = liste[+b.dataset.vis];
        it.visible = it.visible === false;
        sauver(); render();
      });
    });
    Array.prototype.forEach.call(hote.querySelectorAll('[data-del]'), function (b) {
      b.addEventListener('click', function () {
        var it = liste[+b.dataset.del];
        if (!confirm('Supprimer « ' + sc.resume(it) +' » ?\n\nLa suppression ne prendra effet sur le site qu\'après publication.')) return;
        liste.splice(+b.dataset.del, 1);
        sauver(); render();
        message('Entrée supprimée du brouillon.', 'info');
      });
    });
    var add = $('own-add');
    if (add) add.addEventListener('click', function () {
      var it = sc.neuf();
      liste.push(it);
      etat.ouvert = it.id;
      sauver(); render();
    });

    brancherChamps(hote, sc, liste);
  }

  function permuter(liste, a, b) {
    if (b < 0 || b >= liste.length) return;
    var t = liste[a]; liste[a] = liste[b]; liste[b] = t;
    sauver(); render();
  }

  function champs(sc, it, i) {
    return sc.champs.map(function (c) {
      var val = it[c.k];
      if (c.t === 'lignes') val = (val || []).join('\n');
      var commun = 'data-champ="' + c.k + '" data-index="' + i + '"';
      var corps;
      if (c.t === 'area' || c.t === 'lignes') {
        corps = '<textarea class="field-area" ' + commun + ' placeholder="' + esc(c.ph || '') + '"' +
          (c.t === 'lignes' ? ' style="min-height:130px;font-family:var(--ff-m);font-size:.8rem;"' : '') + '>' +
          esc(val == null ? '' : val) + '</textarea>';
      } else {
        corps = '<input class="field-input" type="' + (c.t === 'number' ? 'number' : 'text') + '" ' + commun +
          ' value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(c.ph || '') + '">';
      }
      return '<div class="field">' +
        '<label class="field-label">' + esc(c.l) + (c.req ? ' *' : '') + '</label>' + corps +
        (c.aide ? '<div class="field-hint">' + esc(c.aide) + '</div>' : '') +
      '</div>';
    }).join('');
  }

  function brancherChamps(hote, sc, liste) {
    Array.prototype.forEach.call(hote.querySelectorAll('[data-champ]'), function (el) {
      el.addEventListener('input', function () {
        var it = liste[+el.dataset.index];
        var def = sc.champs.filter(function (c) { return c.k === el.dataset.champ; })[0];
        var v = el.value;
        if (def.t === 'number') v = parseInt(v, 10) || 0;
        if (def.t === 'lignes') v = v.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        it[el.dataset.champ] = v;
        sauver();
        /* Le libellé de la ligne suit la saisie, sans tout redessiner */
        var carte = el.closest('.own-item');
        if (carte) {
          var n = carte.querySelector('.own-name'), d = carte.querySelector('.own-detail');
          if (n) n.textContent = sc.resume(it);
          if (d) d.textContent = sc.detail(it) || '';
        }
        majIndicateur();
      });
    });
  }

  function majIndicateur() {
    var z = document.querySelector('.own-state');
    if (!z) return;
    var n = modifs();
    z.innerHTML = n
      ? '<span class="own-dot"></span>' + n + ' bloc' + (n > 1 ? 's' : '') + ' non publié' + (n > 1 ? 's' : '')
      : '<span style="color:var(--green);">✓</span> Tout est publié';
  }

  /* ═══ Réglages ═══ */
  function rendreReglages(hote) {
    var c = etat.contenu.contact || (etat.contenu.contact = {});
    var i = etat.contenu.intro || (etat.contenu.intro = { enabled: true, claim: '' });
    hote.innerHTML =
      '<div class="panel">' +
        '<div class="panel-title">Coordonnées</div>' +
        '<div class="panel-sub" style="margin-bottom:1.4rem;">Le numéro n\'est plus affiché sur le site — les visiteurs demandent à être rappelés. Il sert à votre signature de livraison.</div>' +
        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Votre numéro (interne)</label>' +
            '<input class="field-input" id="rg-tel" value="' + esc(c.telInterne || c.tel || '') + '" placeholder="06 00 00 00 00"></div>' +
          '<div class="field"><label class="field-label">Format international</label>' +
            '<input class="field-input" id="rg-telhref" value="' + esc(c.telHref || '') + '" placeholder="+33600000000">' +
            '<div class="field-hint">Sans espace. Non publié : conservé pour vos courriels de livraison.</div></div>' +
        '</div>' +
        '<div class="field"><label class="field-label">Adresse email</label>' +
          '<input class="field-input" id="rg-email" value="' + esc(c.email || '') + '"></div>' +
      '</div>' +
      '<div class="panel" style="margin-top:1.2rem;">' +
        '<div class="panel-title">Seuil d\'entrée</div>' +
        '<div class="panel-sub" style="margin-bottom:1.4rem;">L\'animation qui ouvre la page d\'accueil.</div>' +
        '<label class="check" style="margin-bottom:1.2rem;">' +
          '<input type="checkbox" id="rg-intro"' + (i.enabled === false ? '' : ' checked') + '>' +
          '<span>Afficher le seuil d\'entrée</span></label>' +
        '<div class="field"><label class="field-label">Message</label>' +
          '<textarea class="field-area" id="rg-claim" style="min-height:90px;">' + esc(i.claim || '') + '</textarea>' +
          '<div class="field-hint">Le HTML simple est accepté : &lt;br&gt; pour un retour à la ligne, &lt;em&gt;…&lt;/em&gt; pour l\'or.</div></div>' +
        '<div style="border:1px dashed rgba(251,191,36,.4);background:rgba(251,191,36,.08);border-radius:4px;padding:.9rem 1.1rem;">' +
          '<div style="color:var(--amber);font-size:.85rem;line-height:1.6;">' +
            '<b>Attention aux superlatifs.</b> En France, une allégation du type « premier site mondial » doit pouvoir être prouvée ' +
            '(article L121-2 du Code de la consommation). Une formulation comme « La première maison française dédiée à… » se défend sans démonstration.' +
          '</div></div>' +
      '</div>';

    var lier = function (id, appliquer) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('input', function () { appliquer(el.type === 'checkbox' ? el.checked : el.value); sauver(); majIndicateur(); });
      el.addEventListener('change', function () { appliquer(el.type === 'checkbox' ? el.checked : el.value); sauver(); majIndicateur(); });
    };
    lier('rg-tel', function (v) { c.telInterne = v; });
    lier('rg-telhref', function (v) { c.telHref = v; });
    lier('rg-email', function (v) { c.email = v; });
    lier('rg-claim', function (v) { i.claim = v; });
    lier('rg-intro', function (v) { i.enabled = v; });
  }

  /* ═══ Clients et commandes saisies à la main ═══ */
  function rendreClients(hote) {
    var commandes = (window.ORDERS || []).slice();
    /* Un client = une adresse email, avec l'historique agrégé */
    var parClient = {};
    commandes.forEach(function (o) {
      var k = (o.user_email || 'sans-email').toLowerCase();
      if (!parClient[k]) parClient[k] = { nom: o.user_name, email: o.user_email, agence: o.agence, n: 0, total: 0, derniere: o.created_at };
      parClient[k].n++;
      parClient[k].total += (o.price || 0);
      if (o.created_at > parClient[k].derniere) parClient[k].derniere = o.created_at;
    });
    var clients = Object.keys(parClient).map(function (k) { return parClient[k]; })
      .sort(function (a, b) { return b.total - a.total; });

    hote.innerHTML =
      '<div class="panel">' +
        '<div class="panel-title">Nouvelle commande <em>saisie à la main</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.4rem;">Pour une famille qui appelle : vous remplissez à sa place, la commande rejoint le circuit normal.</div>' +
        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Nom du client *</label><input class="field-input" id="cl-nom" placeholder="Claire Bernard"></div>' +
          '<div class="field"><label class="field-label">Email *</label><input class="field-input" id="cl-email" type="email" placeholder="claire@exemple.fr"></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Téléphone</label><input class="field-input" id="cl-tel" placeholder="06 12 34 56 78"></div>' +
          '<div class="field"><label class="field-label">Agence prescriptrice</label><input class="field-input" id="cl-agence" placeholder="laisser vide si commande directe"></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Offre</label><select class="field-select" id="cl-offre">' +
            (etat.contenu.offers || []).map(function (o) {
              return '<option value="' + esc(o.name) + '|' + o.price + '"' + (o.featured ? ' selected' : '') + '>' + esc(o.name) + ' — ' + o.price + ' €</option>';
            }).join('') + '</select></div>' +
          '<div class="field"><label class="field-label">Style musical</label><input class="field-input" id="cl-style" value="Chanson française"></div>' +
        '</div>' +
        '<div class="field"><label class="field-label">Prénom du défunt *</label><input class="field-input" id="cl-defunt" placeholder="Maurice"></div>' +
        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Traits de caractère</label><input class="field-input" id="cl-traits" placeholder="têtu, généreux, taquin"></div>' +
          '<div class="field"><label class="field-label">Métier ou passion</label><input class="field-input" id="cl-metier" placeholder="pêcheur"></div>' +
        '</div>' +
        '<div class="field"><label class="field-label">Habitude quotidienne</label><input class="field-input" id="cl-habitude"></div>' +
        '<div class="field"><label class="field-label">Anecdote</label><textarea class="field-area" id="cl-anecdote"></textarea></div>' +
        '<div style="display:flex;gap:1.4rem;flex-wrap:wrap;margin-bottom:1.2rem;">' +
          '<label class="check" style="margin:0;"><input type="checkbox" id="cl-urgence"><span>Urgence — cérémonie sous 72 h</span></label>' +
          '<label class="check" style="margin:0;"><input type="checkbox" id="cl-paye"><span>Déjà réglé</span></label>' +
        '</div>' +
        '<button class="btn btn-gold" style="width:100%;" id="cl-creer">Créer la commande</button>' +
      '</div>' +

      '<div class="panel" style="margin-top:1.2rem;">' +
        '<div class="panel-title">Vos <em>clients</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.2rem;">' + clients.length + ' client' + (clients.length > 1 ? 's' : '') + ' · constitué depuis les commandes</div>' +
        (clients.length ?
          '<table class="tbl"><thead><tr><th>Client</th><th>Email</th><th>Agence</th><th>Commandes</th><th>Total</th></tr></thead><tbody>' +
          clients.map(function (c) {
            return '<tr><td style="color:var(--paper);">' + esc(c.nom || '—') + '</td>' +
              '<td style="color:var(--ash);">' + esc(c.email || '—') + '</td>' +
              '<td style="color:var(--ash);">' + esc(c.agence || '—') + '</td>' +
              '<td>' + c.n + '</td>' +
              '<td style="color:var(--or);">' + c.total.toLocaleString('fr-FR') + ' €</td></tr>';
          }).join('') + '</tbody></table>'
          : '<p style="color:var(--ash);font-size:.9rem;">Aucun client pour l\'instant.</p>') +
      '</div>';

    $('cl-creer').addEventListener('click', creerCommande);
  }

  async function creerCommande() {
    var v = function (id) { var e = $(id); return e ? e.value.trim() : ''; };
    var nom = v('cl-nom'), email = v('cl-email'), defunt = v('cl-defunt');
    if (!nom || !email || !defunt) { message('Nom, email et prénom du défunt sont nécessaires.', 'err'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { message('Adresse email invalide.', 'err'); return; }

    var offre = v('cl-offre').split('|');
    var btn = $('cl-creer');
    btn.disabled = true; btn.textContent = 'Création…';
    try {
      var extra = [];
      if (v('cl-tel')) extra.push('Téléphone : ' + v('cl-tel'));
      extra.push('Commande saisie à la main depuis la console');
      var o = await window.MelodiaDB.create({
        offer: offre[0], price: parseInt(offre[1], 10) || 0,
        defunt: defunt, name: nom, email: email,
        agence: v('cl-agence'),
        traits: v('cl-traits'), metier: v('cl-metier'), habitude: v('cl-habitude'),
        anecdote: (v('cl-anecdote') ? v('cl-anecdote') + '\n\n' : '') + '— ' + extra.join(' · '),
        style: v('cl-style'),
        urgence: $('cl-urgence').checked, paid: $('cl-paye').checked
      });
      if (window.MELODIA_REFRESH) await window.MELODIA_REFRESH();
      message('Commande ' + o.ref + ' créée pour ' + nom + '. Elle apparaît dans l\'onglet Commandes.', 'ok');
      if (window.melodiaToast) window.melodiaToast('Commande ' + o.ref + ' créée.');
      ['cl-nom', 'cl-email', 'cl-tel', 'cl-agence', 'cl-defunt', 'cl-traits', 'cl-metier', 'cl-habitude', 'cl-anecdote'].forEach(function (id) { $(id).value = ''; });
      $('cl-urgence').checked = false; $('cl-paye').checked = false;
      rendreClients($('own-corps'));
    } catch (e) {
      message('Création impossible : ' + e.message, 'err');
    } finally {
      btn.disabled = false; btn.textContent = 'Créer la commande';
    }
  }

  /* ═══ Collaborateurs commerciaux ═══ */
  async function rendreEquipe(hote) {
    hote.innerHTML = '<div class="status-live" style="display:inline-flex;">Chargement de l\'équipe…</div>';
    var equipe = await window.MelodiaTeam.liste();
    var prospects = await window.MelodiaProspects.all();

    /* Chiffres par collaborateur : c'est là que se lit le travail réel */
    var parPersonne = {};
    prospects.forEach(function (pr) {
      var k = (pr.owner || '').toLowerCase();
      if (!parPersonne[k]) parPersonne[k] = { total: 0, contactes: 0, partenaires: 0 };
      parPersonne[k].total++;
      if (pr.statut && pr.statut !== 'nouveau') parPersonne[k].contactes++;
      if (pr.statut === 'partenaire') parPersonne[k].partenaires++;
    });

    hote.innerHTML =
      '<div class="panel">' +
        '<div class="panel-title">Créer un <em>collaborateur</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.4rem;">Il accède à la console commerciale et travaille son propre portefeuille. Vous voyez tout.</div>' +
        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Nom *</label><input class="field-input" id="eq-nom" placeholder="Julie Lambert"></div>' +
          '<div class="field"><label class="field-label">Email *</label><input class="field-input" id="eq-email" type="email" placeholder="julie@melodia-funebre.fr"></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Mot de passe *</label><input class="field-input" id="eq-pw" placeholder="6 caractères minimum"></div>' +
          '<div class="field"><label class="field-label">Secteur</label><input class="field-input" id="eq-secteur" placeholder="Rhône-Alpes"></div>' +
        '</div>' +
        '<button class="btn btn-gold" style="width:100%;" id="eq-creer">Créer le compte</button>' +
        '<p style="font-size:.8rem;color:var(--ash);margin-top:.9rem;line-height:1.6;">' +
          'Transmettez-lui l\'adresse et le mot de passe : il se connecte sur <b style="color:var(--bone);">/compte</b> et arrive directement sur sa console.</p>' +
      '</div>' +

      '<div class="panel" style="margin-top:1.2rem;">' +
        '<div class="panel-head"><div><div class="panel-title">L\'<em>équipe</em></div>' +
          '<div class="panel-sub">' + equipe.length + ' collaborateur' + (equipe.length > 1 ? 's' : '') + ' · ' + prospects.length + ' fiches au total</div></div>' +
          '<button class="btn btn-outline btn-sm" onclick="window.open(\'dashboard-commercial.html\')">Ouvrir la console commerciale</button></div>' +
        (equipe.length ?
          '<table class="tbl"><thead><tr><th>Collaborateur</th><th>Secteur</th><th>Fiches</th><th>Contactées</th><th>Partenaires</th><th></th></tr></thead><tbody>' +
          equipe.map(function (c) {
            var st = parPersonne[(c.email || '').toLowerCase()] || { total: 0, contactes: 0, partenaires: 0 };
            return '<tr>' +
              '<td><div style="color:var(--paper);">' + esc(c.nom || c.name) + '</div>' +
              '<div style="color:var(--dust);font-size:.8rem;">' + esc(c.email) + '</div></td>' +
              '<td style="color:var(--ash);">' + esc(c.secteur || '—') + '</td>' +
              '<td>' + st.total + '</td>' +
              '<td>' + st.contactes + '</td>' +
              '<td style="color:' + (st.partenaires ? 'var(--green)' : 'var(--ash)') + ';">' + st.partenaires + '</td>' +
              '<td style="text-align:right;"><button class="own-mini danger" data-suppr-eq="' + esc(c.email) + '" title="Supprimer le compte">✕</button></td>' +
            '</tr>';
          }).join('') + '</tbody></table>'
          : '<p style="color:var(--ash);font-size:.9rem;">Aucun collaborateur pour l\'instant.</p>') +
        (window.MelodiaTeam.mode === 'local' ?
          '<div class="form-msg info" style="display:block;margin-top:1.2rem;">' +
          'Base locale : les comptes créés ici n\'existent que dans ce navigateur. Pour qu\'un collaborateur se connecte depuis sa propre machine, activez Supabase (voir README).</div>' : '') +
      '</div>';

    $('eq-creer').addEventListener('click', creerCollaborateur);
    Array.prototype.forEach.call(hote.querySelectorAll('[data-suppr-eq]'), function (b) {
      b.addEventListener('click', async function () {
        if (!confirm('Supprimer le compte de ' + b.dataset.supprEq + ' ?\n\nSes fiches de prospection sont conservées.')) return;
        await window.MelodiaTeam.supprimer(b.dataset.supprEq);
        rendreEquipe(hote);
      });
    });
  }

  async function creerCollaborateur() {
    var v = function (id) { var e = $(id); return e ? e.value.trim() : ''; };
    var btn = $('eq-creer');
    btn.disabled = true; btn.textContent = 'Création…';
    try {
      var c = await window.MelodiaTeam.creer({
        nom: v('eq-nom'), email: v('eq-email'), pw: v('eq-pw'), secteur: v('eq-secteur')
      });
      message('Compte créé pour ' + c.nom + '. Transmettez-lui son adresse et son mot de passe.', 'ok');
      ['eq-nom', 'eq-email', 'eq-pw', 'eq-secteur'].forEach(function (id) { $(id).value = ''; });
      rendreEquipe($('own-corps'));
    } catch (e) {
      message(e.message, 'err');
    } finally {
      btn.disabled = false; btn.textContent = 'Créer le compte';
    }
  }

  /* ═══ Publication ═══ */
  function rendrePublication(hote) {
    var n = modifs();
    hote.innerHTML =
      '<div class="panel">' +
        '<div class="panel-title">Essayer avant de <em>publier</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.4rem;">L\'aperçu applique votre brouillon sur le vrai site, pour vous seul et sur cet appareil.</div>' +
        '<div style="display:flex;gap:.8rem;flex-wrap:wrap;">' +
          '<button class="btn btn-outline" id="pb-apercu">Voir l\'aperçu sur le site</button>' +
          '<button class="btn btn-ghost" id="pb-reset">Abandonner le brouillon</button>' +
        '</div>' +
      '</div>' +

      '<div class="panel" style="margin-top:1.2rem;">' +
        '<div class="panel-title">Publier pour <em>de bon</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.4rem;">' +
          (n ? n + ' bloc' + (n > 1 ? 's' : '') + ' à publier.' : 'Aucune modification en attente.') + '</div>' +
        '<div style="font-size:.9rem;color:var(--bone);line-height:1.9;margin-bottom:1.3rem;">' +
          '<p><b style="color:var(--or);">1.</b> Téléchargez le fichier de contenu ci-dessous.</p>' +
          '<p><b style="color:var(--or);">2.</b> Sur GitHub, ouvrez <code style="color:var(--or);">assets/data/content.json</code>, ' +
             'cliquez sur le crayon, remplacez tout le contenu par celui du fichier, puis <i>Commit changes</i>.</p>' +
          '<p><b style="color:var(--or);">3.</b> Le site se redéploie seul en une à deux minutes.</p>' +
        '</div>' +
        '<button class="btn btn-gold" style="width:100%;" id="pb-export">Télécharger content.json</button>' +
        '<div style="display:flex;gap:.8rem;flex-wrap:wrap;margin-top:.9rem;">' +
          '<button class="btn btn-outline btn-sm" id="pb-copier">Copier dans le presse-papiers</button>' +
          '<label class="btn btn-outline btn-sm" style="cursor:pointer;">Restaurer une sauvegarde' +
            '<input type="file" id="pb-import" accept="application/json" style="display:none;"></label>' +
        '</div>' +
      '</div>' +

      '<div class="panel" style="margin-top:1.2rem;">' +
        '<div class="panel-title">Le contenu <em>en clair</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1rem;">Ce qui sera publié.</div>' +
        '<textarea class="field-area" readonly style="min-height:260px;font-family:var(--ff-m);font-size:.72rem;line-height:1.6;">' +
          esc(JSON.stringify(etat.contenu, null, 2)) + '</textarea>' +
      '</div>';

    $('pb-apercu').addEventListener('click', function () {
      try { sessionStorage.setItem(CLE_APERCU, '1'); } catch (e) {}
      window.open('index.html', '_blank', 'noopener');
      message('Aperçu ouvert dans un nouvel onglet. Il ne concerne que ce navigateur.', 'info');
    });
    $('pb-reset').addEventListener('click', function () {
      if (!confirm('Abandonner toutes les modifications non publiées ?')) return;
      try { localStorage.removeItem(CLE_BROUILLON); sessionStorage.removeItem(CLE_APERCU); } catch (e) {}
      etat.charge = false;
      charger().then(render);
    });
    $('pb-export').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(etat.contenu, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'content.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      message('Fichier téléchargé. Déposez-le sur GitHub pour le mettre en ligne.', 'ok');
    });
    $('pb-copier').addEventListener('click', function () {
      var t = JSON.stringify(etat.contenu, null, 2);
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      message('Contenu copié.', 'ok');
    });
    $('pb-import').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var d = JSON.parse(fr.result);
          if (!d || typeof d !== 'object') throw new Error('structure inattendue');
          etat.contenu = d;
          sauver(); render();
          message('Sauvegarde restaurée dans le brouillon.', 'ok');
        } catch (err) { message('Fichier illisible : ' + err.message, 'err'); }
      };
      fr.readAsText(f);
    });
  }

  /* ═══ Montage ═══ */
  async function mount() {
    var hote = $('own-root');
    if (!hote) return;
    hote.innerHTML = '<div class="status-live" style="display:inline-flex;">Chargement du contenu…</div>';
    await charger();
    render();
  }

  window.MelodiaOwner = { mount: mount };
})();
