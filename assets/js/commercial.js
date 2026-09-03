/* ═══════════════════════════════════════════════════════════════
   MELODIA — Console commerciale
   Recherche des pompes funèbres de France, suivi de prospection,
   courriels de premier contact, de relance et d'offre.

   Les fiches appartiennent au collaborateur connecté. Le fondateur,
   lui, voit l'ensemble et peut filtrer par collaborateur.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var U = window.MelodiaAuth.guard();
  if (!U) return;
  if (U.role !== 'commercial' && U.role !== 'master') {
    location.href = window.MelodiaAuth.home();
    return;
  }

  var EST_MAITRE = U.role === 'master';
  var ST = window.MELODIA_PROSPECT_STATUTS;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  var PROSPECTS = [];
  var vueCourante = 'accueil';
  var filtreStatut = '';
  var filtreOwner = '';

  window.logout = function () { window.MelodiaAuth.logout(); location.href = 'compte.html'; };

  /* ═══ Modèles de courriel ═══
     Prospection entre professionnels : autorisée en France sur la base
     de l'opposition, à condition que le message concerne leur métier et
     comporte un moyen de refuser. La ligne de refus est donc intégrée. */
  var MODELES = {
    contact: {
      nom: 'Premier contact',
      objet: function (p) { return 'Un service que vos confrères de ' + (p.ville || 'votre ville') + ' ne proposent pas encore'; },
      corps: function (p) {
        return [
          'Bonjour' + (p.dirigeant ? ' ' + p.dirigeant : '') + ',',
          '',
          'Je me permets de vous écrire au sujet d\'un service que nous proposons aux',
          'pompes funèbres, et que ' + (p.nom || 'votre maison') + ' pourrait présenter dès cette semaine.',
          '',
          'Nous composons, pour chaque défunt, une chanson originale à partir de ce que',
          'la famille nous raconte : trois traits de caractère, un métier, une habitude.',
          'Livrée en vingt-quatre heures, diffusable en cérémonie, sans aucun droit SACEM',
          'à régler, et conservée par la famille pour toujours.',
          '',
          'Concrètement pour vous :',
          '  · vous conservez 60 % du montant, soit 179 € nets sur une offre à 299 €',
          '  · aucun investissement, aucun stock, aucune charge technique',
          '  · trente secondes de présentation en rendez-vous suffisent',
          '',
          'Pour que vous jugiez sur pièce plutôt que sur promesse, nous composons',
          'gratuitement un premier hommage pour votre prochaine famille. Vous le',
          'présentez. Si cela ne touche pas, nous en restons là.',
          '',
          'Trois hommages sont en écoute libre ici : https://melodia-funebre.fr/demos',
          '',
          'Seriez-vous disponible quelques minutes cette semaine ?',
          '',
          SIGNATURE(),
          '',
          '—',
          'Vous recevez ce message dans un cadre professionnel. Pour ne plus être',
          'contacté, répondez « STOP » à ce courriel : nous vous retirons immédiatement.'
        ].join('\n');
      }
    },
    relance: {
      nom: 'Relance',
      objet: function (p) { return 'Une chanson pour vos familles — ' + (p.nom || '') ; },
      corps: function (p) {
        return [
          'Bonjour' + (p.dirigeant ? ' ' + p.dirigeant : '') + ',',
          '',
          'Je me permets de revenir vers vous brièvement.',
          '',
          'Le plus simple reste d\'écouter. Voici un hommage composé pour un pêcheur de',
          'Loire, à partir de trois mots donnés par sa fille — « patient, taquin,',
          'silencieux » : https://melodia-funebre.fr/demos',
          '',
          'Si le principe vous parle, la première composition est offerte : vous la',
          'présentez à une famille, sans engagement.',
          '',
          'Et si le moment n\'est pas le bon, dites-le moi simplement, je ne reviendrai pas.',
          '',
          SIGNATURE(),
          '',
          '—',
          'Pour ne plus être contacté, répondez « STOP » à ce courriel.'
        ].join('\n');
      }
    },
    offre: {
      nom: 'Composition offerte',
      objet: function (p) { return 'Nous composons votre premier hommage, offert'; },
      corps: function (p) {
        return [
          'Bonjour' + (p.dirigeant ? ' ' + p.dirigeant : '') + ',',
          '',
          'Comme convenu, nous composons gratuitement un premier hommage pour ' + (p.nom || 'votre agence') + '.',
          '',
          'Le fonctionnement est simple : à la prochaine famille qui vous semble',
          'réceptive, posez cinq questions sur le défunt — trois traits de caractère,',
          'son métier ou sa passion, une habitude que tout le monde lui connaissait.',
          'Transmettez-les moi, et vous recevez la chanson sous vingt-quatre heures.',
          '',
          'Vous la présentez à la famille. Si cela touche, nous continuons ensemble.',
          'Sinon, vous n\'avez rien avancé et rien à nous devoir.',
          '',
          'Votre espace partenaire est prêt : https://melodia-funebre.fr/compte',
          '',
          SIGNATURE(),
          '',
          '—',
          'Pour ne plus être contacté, répondez « STOP » à ce courriel.'
        ].join('\n');
      }
    }
  };

  function SIGNATURE() {
    return [U.name || 'Melodia Funèbre', 'Melodia Funèbre', 'https://melodia-funebre.fr'].join('\n');
  }

  /* ═══ Chargement ═══ */
  async function charger() {
    PROSPECTS = await window.MelodiaProspects.mine();
    var b = $('badge-pro');
    if (b) b.textContent = PROSPECTS.length;
    var mb = $('mode-badge');
    if (mb) mb.textContent = EST_MAITRE ? 'Vue fondateur · toutes les fiches'
      : (window.MelodiaProspects.mode === 'supabase' ? 'Base partagée' : 'Base locale');
  }

  /* ═══ Navigation ═══ */
  var TITRES = {
    accueil: ['Prospection', 'Tableau de <em>bord</em>'],
    recherche: ['Annuaire', 'Trouver des <em>agences</em>'],
    prospects: ['Portefeuille', 'Mes <em>prospects</em>'],
    modeles: ['Ressources', 'Modèles de <em>courriel</em>'],
    argumentaire: ['Ressources', 'L\'<em>argumentaire</em>']
  };

  function go(v) {
    vueCourante = v;
    Array.prototype.forEach.call(document.querySelectorAll('.side-item'), function (b) {
      b.classList.toggle('active', b.dataset.v === v);
    });
    var t = TITRES[v] || TITRES.accueil;
    $('head-eyebrow').textContent = t[0];
    $('head-title').innerHTML = t[1];
    var rendus = { accueil: vAccueil, recherche: vRecherche, prospects: vProspects, modeles: vModeles, argumentaire: vArgumentaire };
    $('view').innerHTML = (rendus[v] || vAccueil)();
    if (v === 'recherche') brancherRecherche();
    if (v === 'prospects') brancherProspects();
    if (v === 'modeles') brancherModeles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.go = go;

  /* ═══ Vue : tableau de bord ═══ */
  function compte(statut) { return PROSPECTS.filter(function (p) { return p.statut === statut; }).length; }

  function vAccueil() {
    var total = PROSPECTS.length;
    var touches = PROSPECTS.filter(function (p) { return p.statut !== 'nouveau'; }).length;
    var partenaires = compte('partenaire');
    var taux = touches ? Math.round(partenaires / touches * 100) : 0;
    /* Revenu mensuel estimé : 3 hommages par agence partenaire, 40 % pour la maison */
    var potentiel = partenaires * 3 * 299 * 0.4;

    var pipeline = window.MelodiaProspects.STATUTS.map(function (s) {
      var n = compte(s);
      var pct = total ? Math.round(n / total * 100) : 0;
      return '<div class="pl-seg" style="flex:' + Math.max(n, 0.04) + ';background:' + ST[s].color + '22;border-color:' + ST[s].color + '55;">' +
        '<div class="pl-n" style="color:' + ST[s].color + ';">' + n + '</div>' +
        '<div class="pl-l">' + ST[s].label + '</div>' +
        '<div class="pl-p">' + pct + ' %</div></div>';
    }).join('');

    var recents = PROSPECTS.slice().sort(function (a, b) {
      return (b.updated_at || '').localeCompare(a.updated_at || '');
    }).slice(0, 6);

    return '<div class="kpi-grid">' +
        kpi(total, 'Agences suivies', 'Dans votre portefeuille') +
        kpi(touches, 'Contactées', 'Au moins un courriel envoyé') +
        kpi(compte('interesse') + compte('demo_offerte'), 'En discussion', 'Intéressées ou démo offerte') +
        kpi(partenaires, 'Partenaires', taux + ' % des agences contactées') +
      '</div>' +

      '<div class="panel" style="margin-top:1.2rem;">' +
        '<div class="panel-title">Le <em>pipeline</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.3rem;">Où en sont vos agences.</div>' +
        (total ? '<div class="pipeline">' + pipeline + '</div>'
               : '<p style="color:var(--ash);font-size:.9rem;">Aucune agence suivie. Commencez par l\'onglet <b style="color:var(--or);">Rechercher</b>.</p>') +
        (partenaires ? '<p style="margin-top:1.3rem;font-size:.9rem;color:var(--bone);line-height:1.7;">' +
          'À raison de trois hommages par mois et par agence partenaire, votre réseau représente environ <b style="color:var(--or);">' +
          Math.round(potentiel).toLocaleString('fr-FR') + ' €</b> de chiffre mensuel pour la maison.</p>' : '') +
      '</div>' +

      '<div class="grid-2" style="gap:1.2rem;margin-top:1.2rem;align-items:start;">' +
        '<div class="panel">' +
          '<div class="panel-head"><div><div class="panel-title">Dernières <em>fiches</em></div>' +
          '<div class="panel-sub">Par ordre de mise à jour</div></div>' +
          '<button class="btn btn-outline btn-sm" onclick="go(\'prospects\')">Tout voir</button></div>' +
          (recents.length ? recents.map(ligneCourte).join('') :
            '<p style="color:var(--ash);font-size:.9rem;">Rien pour l\'instant.</p>') +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-title">Par où <em>commencer</em></div>' +
          '<div class="panel-sub" style="margin-bottom:1.2rem;">Une méthode qui tient en trois gestes</div>' +
          '<div style="font-size:.9rem;color:var(--bone);line-height:1.9;">' +
            '<p><b style="color:var(--or);">I.</b> Cherchez votre département dans l\'annuaire, ajoutez dix agences.</p>' +
            '<p><b style="color:var(--or);">II.</b> Trouvez leur adresse email — site, page Contact, Pages Jaunes. Complétez la fiche.</p>' +
            '<p><b style="color:var(--or);">III.</b> Envoyez le premier contact, puis relancez une seule fois, huit jours après.</p>' +
            '<p style="color:var(--ash);font-size:.85rem;margin-top:1rem;">Dix agences travaillées valent mieux que cent listées.</p>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function kpi(v, l, f) {
    return '<div class="kpi"><div class="kpi-label">' + l + '</div><div class="kpi-value">' + v + '</div><div class="kpi-foot">' + f + '</div></div>';
  }

  function ligneCourte(p) {
    var s = ST[p.statut] || ST.nouveau;
    return '<div class="o-row" style="padding:.8rem 0;border-bottom:1px solid var(--line-soft);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">' +
        '<div style="min-width:0;"><div class="o-name" style="font-size:1.05rem;">' + esc(p.nom) + '</div>' +
        '<div class="o-meta">' + esc(p.ville || '') + (p.cp ? ' · ' + esc(p.cp) : '') +
        (EST_MAITRE && p.owner_nom ? ' · ' + esc(p.owner_nom) : '') + '</div></div>' +
        '<span class="pill" style="color:' + s.color + ';border-color:' + s.color + '55;">' + s.label + '</span>' +
      '</div></div>';
  }

  /* ═══ Vue : recherche dans l'annuaire ═══ */
  function vRecherche() {
    return '<div class="panel">' +
        '<div class="panel-title">L\'annuaire des <em>pompes funèbres</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.4rem;">' +
          'Toutes les entreprises françaises déclarées en services funéraires, depuis l\'annuaire public de l\'État.</div>' +
        '<div class="field-row">' +
          '<div class="field"><label class="field-label" for="rc-dep">Département *</label>' +
            '<input class="field-input" id="rc-dep" placeholder="69" maxlength="3" list="deps">' +
            '<datalist id="deps">' + DEPS.map(function (d) { return '<option value="' + d[0] + '">' + d[0] + ' — ' + d[1] + '</option>'; }).join('') + '</datalist>' +
            '<div class="field-hint">Numéro à deux chiffres. Corse : 2A ou 2B. Outre-mer : 971 à 976.</div></div>' +
          '<div class="field"><label class="field-label" for="rc-q">Filtrer par nom ou ville</label>' +
            '<input class="field-input" id="rc-q" placeholder="facultatif"></div>' +
        '</div>' +
        '<button class="btn btn-gold" style="width:100%;" id="rc-go">Rechercher</button>' +
        '<div class="form-msg" id="rc-msg" style="margin-top:1rem;"></div>' +
      '</div>' +
      '<div id="rc-res" style="margin-top:1.2rem;"></div>';
  }

  function brancherRecherche() {
    $('rc-go').addEventListener('click', chercher);
    $('rc-dep').addEventListener('keydown', function (e) { if (e.key === 'Enter') chercher(); });
    $('rc-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') chercher(); });
  }

  var pageCourante = 1, derniereRecherche = null;

  async function chercher(page) {
    var dep = ($('rc-dep').value || '').trim();
    var q = ($('rc-q').value || '').trim();
    var msg = $('rc-msg');
    if (!dep && !q) { msg.className = 'form-msg err'; msg.textContent = 'Indiquez au moins un département.'; return; }

    var btn = $('rc-go');
    btn.disabled = true; btn.classList.add('is-loading');
    msg.className = 'form-msg'; msg.textContent = '';
    pageCourante = page || 1;

    try {
      var url = '/api/prospects?page=' + pageCourante + (dep ? '&departement=' + encodeURIComponent(dep) : '') + (q ? '&q=' + encodeURIComponent(q) : '');
      var r = await fetch(url);
      var d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Recherche impossible.');
      derniereRecherche = d;
      afficherResultats(d);
      msg.className = 'form-msg ok';
      msg.textContent = d.total.toLocaleString('fr-FR') + ' établissement' + (d.total > 1 ? 's' : '') + ' trouvé' + (d.total > 1 ? 's' : '') + ' · source : ' + d.source;
    } catch (e) {
      msg.className = 'form-msg err';
      msg.textContent = e.message;
      $('rc-res').innerHTML = '';
    } finally {
      btn.disabled = false; btn.classList.remove('is-loading');
    }
  }

  function afficherResultats(d) {
    var connus = {};
    PROSPECTS.forEach(function (p) { connus[p.siret] = true; });

    $('rc-res').innerHTML = '<div class="panel">' +
      '<div class="panel-head"><div><div class="panel-title">Résultats</div>' +
      '<div class="panel-sub">Page ' + d.page + ' sur ' + d.pages + '</div></div>' +
      '<button class="btn btn-gold btn-sm" id="rc-tout">Tout ajouter</button></div>' +
      d.resultats.map(function (e) {
        var deja = connus[e.siret];
        return '<div class="o-row" style="padding:.9rem 0;border-bottom:1px solid var(--line-soft);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">' +
            '<div style="min-width:0;flex:1;">' +
              '<div class="o-name" style="font-size:1.05rem;">' + esc(e.nom) + (e.enseigne && e.enseigne !== e.nom ? ' <span style="color:var(--ash);font-size:.85rem;">· ' + esc(e.enseigne) + '</span>' : '') + '</div>' +
              '<div class="o-meta">' + esc([e.adresse, e.cp, e.ville].filter(Boolean).join(' · ')) +
              (e.dirigeant ? ' · <span style="color:var(--or-patina);">' + esc(e.dirigeant) + '</span>' : '') + '</div>' +
            '</div>' +
            (deja ? '<span class="pill" style="color:var(--green);border-color:rgba(74,222,128,.35);">Déjà suivie</span>'
                  : '<button class="btn btn-outline btn-sm" data-ajout="' + esc(e.siret) + '">Ajouter</button>') +
          '</div></div>';
      }).join('') +
      (d.pages > 1 ? '<div style="display:flex;gap:.6rem;justify-content:center;margin-top:1.2rem;">' +
        '<button class="btn btn-outline btn-sm" id="rc-prev"' + (d.page <= 1 ? ' disabled' : '') + '>Précédent</button>' +
        '<button class="btn btn-outline btn-sm" id="rc-next"' + (d.page >= d.pages ? ' disabled' : '') + '>Suivant</button>' +
      '</div>' : '') +
    '</div>';

    Array.prototype.forEach.call(document.querySelectorAll('[data-ajout]'), function (b) {
      b.addEventListener('click', function () {
        var e = d.resultats.filter(function (x) { return x.siret === b.dataset.ajout; })[0];
        if (e) ajouter(e, b);
      });
    });
    var tout = $('rc-tout');
    if (tout) tout.addEventListener('click', async function () {
      tout.disabled = true; tout.textContent = 'Ajout…';
      for (var i = 0; i < d.resultats.length; i++) {
        if (!connus[d.resultats[i].siret]) await window.MelodiaProspects.enregistrer(d.resultats[i]);
      }
      await charger();
      afficherResultats(d);
      if (window.melodiaToast) window.melodiaToast(d.resultats.length + ' agences ajoutées.');
    });
    var prev = $('rc-prev'), next = $('rc-next');
    if (prev) prev.addEventListener('click', function () { chercher(d.page - 1); });
    if (next) next.addEventListener('click', function () { chercher(d.page + 1); });
  }

  async function ajouter(e, btn) {
    btn.disabled = true; btn.textContent = 'Ajout…';
    try {
      await window.MelodiaProspects.enregistrer(e);
      await charger();
      btn.outerHTML = '<span class="pill" style="color:var(--green);border-color:rgba(74,222,128,.35);">Ajoutée</span>';
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Ajouter';
      if (window.melodiaToast) window.melodiaToast('Ajout impossible : ' + err.message);
    }
  }

  /* ═══ Vue : portefeuille ═══ */
  function vProspects() {
    var liste = PROSPECTS.filter(function (p) {
      if (filtreStatut && p.statut !== filtreStatut) return false;
      if (filtreOwner && (p.owner || '') !== filtreOwner) return false;
      return true;
    });

    var owners = {};
    PROSPECTS.forEach(function (p) { if (p.owner) owners[p.owner] = p.owner_nom || p.owner; });

    return '<div class="panel">' +
        '<div class="panel-head"><div><div class="panel-title">Mes <em>prospects</em></div>' +
          '<div class="panel-sub">' + liste.length + ' fiche' + (liste.length > 1 ? 's' : '') +
          (filtreStatut || filtreOwner ? ' · filtre actif' : '') + '</div></div>' +
          '<button class="btn btn-outline btn-sm" onclick="go(\'recherche\')">Ajouter des agences</button></div>' +
        '<div class="own-tabs" style="margin-bottom:1rem;">' +
          '<button class="own-tab' + (filtreStatut === '' ? ' active' : '') + '" data-filtre="">Toutes</button>' +
          window.MelodiaProspects.STATUTS.map(function (s) {
            return '<button class="own-tab' + (filtreStatut === s ? ' active' : '') + '" data-filtre="' + s + '">' +
              ST[s].label + ' (' + compte(s) + ')</button>';
          }).join('') +
        '</div>' +
        (EST_MAITRE && Object.keys(owners).length > 1 ?
          '<div class="field" style="max-width:320px;"><label class="field-label">Collaborateur</label>' +
          '<select class="field-select" id="pr-owner"><option value="">Tous</option>' +
          Object.keys(owners).map(function (k) {
            return '<option value="' + esc(k) + '"' + (filtreOwner === k ? ' selected' : '') + '>' + esc(owners[k]) + '</option>';
          }).join('') + '</select></div>' : '') +
        (liste.length ? liste.map(fiche).join('') :
          '<p style="color:var(--ash);font-size:.9rem;">Aucune fiche dans ce filtre.</p>') +
      '</div>';
  }

  function fiche(p) {
    var s = ST[p.statut] || ST.nouveau;
    return '<div class="o-row" data-fiche="' + esc(p.siret) + '">' +
      '<div class="o-head">' +
        '<div style="min-width:0;">' +
          '<div class="o-name">' + esc(p.nom) + '</div>' +
          '<div class="o-meta">' + esc([p.adresse, p.cp, p.ville].filter(Boolean).join(' · ')) +
          (p.dirigeant ? ' · ' + esc(p.dirigeant) : '') +
          (EST_MAITRE && p.owner_nom ? ' · <span style="color:var(--or-patina);">' + esc(p.owner_nom) + '</span>' : '') + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;">' +
          '<span class="pill" style="color:' + s.color + ';border-color:' + s.color + '55;">' + s.label + '</span>' +
          '<button class="own-mini" data-ouvrir="' + esc(p.siret) + '" title="Ouvrir la fiche">✎</button>' +
        '</div>' +
      '</div>' +
      '<div class="fiche-detail" id="fd-' + esc(p.siret) + '" hidden>' +
        '<div class="field-row" style="margin-top:1rem;">' +
          '<div class="field"><label class="field-label">Adresse email</label>' +
            '<input class="field-input" data-champ="email" data-siret="' + esc(p.siret) + '" value="' + esc(p.email || '') + '" placeholder="contact@agence.fr"></div>' +
          '<div class="field"><label class="field-label">Téléphone</label>' +
            '<input class="field-input" data-champ="tel" data-siret="' + esc(p.siret) + '" value="' + esc(p.tel || '') + '"></div>' +
        '</div>' +
        '<div class="field"><label class="field-label">Interlocuteur</label>' +
          '<input class="field-input" data-champ="dirigeant" data-siret="' + esc(p.siret) + '" value="' + esc(p.dirigeant || '') + '"></div>' +
        '<div class="field"><label class="field-label">Notes</label>' +
          '<textarea class="field-area" data-champ="notes" data-siret="' + esc(p.siret) + '" style="min-height:80px;" placeholder="Ce qui s\'est dit, ce qu\'il faut retenir…">' + esc(p.notes || '') + '</textarea></div>' +
        '<div class="field"><label class="field-label">Statut</label>' +
          '<select class="field-select" data-champ="statut" data-siret="' + esc(p.siret) + '">' +
            window.MelodiaProspects.STATUTS.map(function (k) {
              return '<option value="' + k + '"' + (p.statut === k ? ' selected' : '') + '>' + ST[k].label + '</option>';
            }).join('') + '</select></div>' +
        '<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem;">' +
          Object.keys(MODELES).map(function (m) {
            return '<button class="btn btn-' + (m === 'contact' ? 'gold' : 'outline') + ' btn-sm" data-mail="' + m + '" data-siret="' + esc(p.siret) + '">' +
              MODELES[m].nom + '</button>';
          }).join('') +
          '<button class="own-mini danger" data-suppr="' + esc(p.siret) + '" title="Retirer la fiche" style="margin-left:auto;">✕</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function brancherProspects() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-filtre]'), function (b) {
      b.addEventListener('click', function () { filtreStatut = b.dataset.filtre; go('prospects'); });
    });
    var o = $('pr-owner');
    if (o) o.addEventListener('change', function () { filtreOwner = o.value; go('prospects'); });

    Array.prototype.forEach.call(document.querySelectorAll('[data-ouvrir]'), function (b) {
      b.addEventListener('click', function () {
        var d = $('fd-' + b.dataset.ouvrir);
        if (d) d.hidden = !d.hidden;
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-champ][data-siret]'), function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () { majFiche(el.dataset.siret, el.dataset.champ, el.value); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-mail]'), function (b) {
      b.addEventListener('click', function () { ecrire(b.dataset.siret, b.dataset.mail); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-suppr]'), function (b) {
      b.addEventListener('click', async function () {
        var p = trouver(b.dataset.suppr);
        if (!confirm('Retirer « ' + (p ? p.nom : '') + ' » de votre portefeuille ?')) return;
        await window.MelodiaProspects.supprimer(b.dataset.suppr);
        await charger();
        go('prospects');
      });
    });
  }

  function trouver(siret) { return PROSPECTS.filter(function (p) { return p.siret === siret; })[0]; }

  var minuteur = null;
  function majFiche(siret, champ, valeur) {
    var p = trouver(siret);
    if (!p) return;
    p[champ] = valeur;
    clearTimeout(minuteur);
    minuteur = setTimeout(function () {
      window.MelodiaProspects.enregistrer(p).then(function () {
        if (champ === 'statut') { charger().then(function () { go('prospects'); }); }
      });
    }, 400);
  }

  /* ═══ Courriels ═══ */
  function ecrire(siret, modele) {
    var p = trouver(siret);
    if (!p) return;
    if (!p.email) {
      if (window.melodiaToast) window.melodiaToast('Renseignez d\'abord l\'adresse email de l\'agence.');
      var champ = document.querySelector('[data-champ="email"][data-siret="' + siret + '"]');
      if (champ) { champ.focus(); champ.classList.add('invalid'); }
      return;
    }
    var m = MODELES[modele];
    window.location.href = 'mailto:' + encodeURIComponent(p.email) +
      '?subject=' + encodeURIComponent(m.objet(p)) +
      '&body=' + encodeURIComponent(m.corps(p));

    /* Le statut avance tout seul : une action de moins à ne pas oublier */
    var suite = modele === 'contact' ? 'contacte' : (modele === 'relance' ? 'relance' : 'demo_offerte');
    if (window.MelodiaProspects.STATUTS.indexOf(p.statut) < window.MelodiaProspects.STATUTS.indexOf(suite)) {
      p.statut = suite;
      p.dernier_contact = new Date().toISOString();
      window.MelodiaProspects.enregistrer(p).then(function () {
        charger().then(function () { go('prospects'); });
      });
    }
  }

  /* ═══ Vue : modèles ═══ */
  function vModeles() {
    var exemple = { nom: 'Pompes Funèbres Exemple', ville: 'Lyon', dirigeant: 'Monsieur Roblot', cp: '69003' };
    return Object.keys(MODELES).map(function (k) {
      var m = MODELES[k];
      return '<div class="panel" style="margin-bottom:1.2rem;">' +
        '<div class="panel-title">' + esc(m.nom) + '</div>' +
        '<div class="panel-sub" style="margin-bottom:1.2rem;">Objet : ' + esc(m.objet(exemple)) + '</div>' +
        '<textarea class="field-area" readonly style="min-height:340px;font-size:.86rem;line-height:1.7;">' + esc(m.corps(exemple)) + '</textarea>' +
        '<p style="font-size:.8rem;color:var(--ash);margin-top:.8rem;line-height:1.6;">' +
          'Le nom de l\'agence, la ville et l\'interlocuteur sont remplacés automatiquement pour chaque fiche.</p>' +
      '</div>';
    }).join('') +
    '<div class="panel">' +
      '<div class="panel-title">Ce que dit la <em>loi</em></div>' +
      '<div style="font-size:.9rem;color:var(--bone);line-height:1.8;margin-top:1rem;">' +
        '<p>La prospection entre professionnels est autorisée en France sans accord préalable, à trois conditions : le message concerne leur activité professionnelle, votre identité est claire, et un moyen de refuser figure dans le message.</p>' +
        '<p style="margin-top:.8rem;">Les trois modèles comportent la ligne de refus. <b style="color:var(--paper);">Une agence qui répond « STOP » doit être passée en « Sans suite » immédiatement</b>, et ne plus jamais être recontactée.</p>' +
      '</div>' +
    '</div>';
  }

  function brancherModeles() {}

  /* ═══ Vue : argumentaire ═══ */
  function vArgumentaire() {
    return '<div class="grid-2" style="gap:1.2rem;align-items:start;">' +
      '<div class="panel">' +
        '<div class="panel-title">Trente secondes en <em>rendez-vous</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.2rem;">À dire, puis se taire</div>' +
        '<p style="font-family:var(--ff-d);font-style:italic;font-size:1.15rem;line-height:1.75;color:var(--bone);">' +
          '« Nous pouvons faire composer une chanson originale pour [Prénom] — sa vie, ses gestes, ' +
          'à partir de trois mots que vous nous donnez. Livrée avant la cérémonie, et elle reste à la famille. ' +
          'Voulez-vous en écouter une ? »</p>' +
        '<p style="font-size:.88rem;color:var(--ash);margin-top:1.2rem;line-height:1.7;">' +
          'Puis vous faites écouter. Ne décrivez pas la musique : laissez-la faire son travail.</p>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title">Les <em>objections</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.2rem;">Les trois qui reviennent</div>' +
        '<div style="font-size:.9rem;color:var(--bone);line-height:1.75;">' +
          '<p><b style="color:var(--paper);">« C\'est cher »</b><br>149 € sur un budget moyen de 3 500 € : quatre pour cent, pour l\'unique objet que la famille gardera.</p>' +
          '<p style="margin-top:1.1rem;"><b style="color:var(--paper);">« Les familles ne voudront pas »</b><br>Ne le proposez pas à toutes. Proposez-le quand la famille parle du défunt avec des détails — c\'est le signal.</p>' +
          '<p style="margin-top:1.1rem;"><b style="color:var(--paper);">« Je n\'ai pas le temps »</b><br>Trente secondes en rendez-vous, trois minutes de brief. Nous faisons le reste.</p>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title">Les <em>chiffres</em></div>' +
        '<table class="tbl" style="margin-top:1rem;"><tbody>' +
          '<tr><td style="color:var(--ash);">Marge agence</td><td style="color:var(--or);">60 %</td></tr>' +
          '<tr><td style="color:var(--ash);">Sur une offre Prestige</td><td>179 € nets</td></tr>' +
          '<tr><td style="color:var(--ash);">Investissement</td><td>Aucun</td></tr>' +
          '<tr><td style="color:var(--ash);">Délai de livraison</td><td>24 heures</td></tr>' +
          '<tr><td style="color:var(--ash);">Droits SACEM</td><td>Aucun</td></tr>' +
          '<tr><td style="color:var(--ash);">Première composition</td><td style="color:var(--green);">Offerte</td></tr>' +
        '</tbody></table>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="panel-title">Ce qu\'il ne faut <em>pas faire</em></div>' +
        '<div style="font-size:.9rem;color:var(--bone);line-height:1.8;margin-top:1rem;">' +
          '<p>· Insister après un refus. Une agence qui dit non aujourd\'hui peut dire oui dans six mois — pas si vous l\'avez lassée.</p>' +
          '<p>· Relancer plus d\'une fois. Un rappel, puis on laisse.</p>' +
          '<p>· Promettre un volume. Nous vendons une différenciation, pas un chiffre d\'affaires garanti.</p>' +
          '<p>· Parler de technologie. Les familles et les agences achètent une émotion juste, pas un procédé.</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* Départements, pour la saisie assistée */
  var DEPS = [['01','Ain'],['02','Aisne'],['03','Allier'],['04','Alpes-de-Haute-Provence'],['05','Hautes-Alpes'],['06','Alpes-Maritimes'],['07','Ardèche'],['08','Ardennes'],['09','Ariège'],['10','Aube'],['11','Aude'],['12','Aveyron'],['13','Bouches-du-Rhône'],['14','Calvados'],['15','Cantal'],['16','Charente'],['17','Charente-Maritime'],['18','Cher'],['19','Corrèze'],['2A','Corse-du-Sud'],['2B','Haute-Corse'],['21','Côte-d\'Or'],['22','Côtes-d\'Armor'],['23','Creuse'],['24','Dordogne'],['25','Doubs'],['26','Drôme'],['27','Eure'],['28','Eure-et-Loir'],['29','Finistère'],['30','Gard'],['31','Haute-Garonne'],['32','Gers'],['33','Gironde'],['34','Hérault'],['35','Ille-et-Vilaine'],['36','Indre'],['37','Indre-et-Loire'],['38','Isère'],['39','Jura'],['40','Landes'],['41','Loir-et-Cher'],['42','Loire'],['43','Haute-Loire'],['44','Loire-Atlantique'],['45','Loiret'],['46','Lot'],['47','Lot-et-Garonne'],['48','Lozère'],['49','Maine-et-Loire'],['50','Manche'],['51','Marne'],['52','Haute-Marne'],['53','Mayenne'],['54','Meurthe-et-Moselle'],['55','Meuse'],['56','Morbihan'],['57','Moselle'],['58','Nièvre'],['59','Nord'],['60','Oise'],['61','Orne'],['62','Pas-de-Calais'],['63','Puy-de-Dôme'],['64','Pyrénées-Atlantiques'],['65','Hautes-Pyrénées'],['66','Pyrénées-Orientales'],['67','Bas-Rhin'],['68','Haut-Rhin'],['69','Rhône'],['70','Haute-Saône'],['71','Saône-et-Loire'],['72','Sarthe'],['73','Savoie'],['74','Haute-Savoie'],['75','Paris'],['76','Seine-Maritime'],['77','Seine-et-Marne'],['78','Yvelines'],['79','Deux-Sèvres'],['80','Somme'],['81','Tarn'],['82','Tarn-et-Garonne'],['83','Var'],['84','Vaucluse'],['85','Vendée'],['86','Vienne'],['87','Haute-Vienne'],['88','Vosges'],['89','Yonne'],['90','Territoire de Belfort'],['91','Essonne'],['92','Hauts-de-Seine'],['93','Seine-Saint-Denis'],['94','Val-de-Marne'],['95','Val-d\'Oise'],['971','Guadeloupe'],['972','Martinique'],['973','Guyane'],['974','La Réunion'],['976','Mayotte']];

  /* ═══ Démarrage ═══ */
  Array.prototype.forEach.call(document.querySelectorAll('.side-item'), function (b) {
    b.addEventListener('click', function () {
      go(b.dataset.v);
      document.getElementById('side').classList.remove('open');
    });
  });

  (async function () {
    $('u-initial').textContent = (U.name || 'C').charAt(0).toUpperCase();
    $('u-name').textContent = U.name || U.email;
    $('u-role').textContent = EST_MAITRE ? 'Fondateur · vue totale' : 'Collaborateur' + (U.secteur ? ' · ' + U.secteur : '');
    await charger();
    go('accueil');
  })();
})();
