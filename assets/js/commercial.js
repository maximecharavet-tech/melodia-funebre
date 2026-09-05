/* ═══════════════════════════════════════════════════════════════
   MELODIA — Console commerciale

   Recherche des pompes funèbres de France, suivi de prospection,
   rédaction et envoi des courriels, script d'appel et plan de travail.

   Les fiches appartiennent au collaborateur connecté. Le fondateur,
   lui, voit l'ensemble et peut filtrer par collaborateur.

   Deux principes tiennent la mécanique :
   — aucune fiche ne doit rester sans date de prochaine action ;
   — une agence qui a dit STOP ne peut plus être recontactée, la
     console le refuse au lieu de compter sur la mémoire de chacun.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var U = window.MelodiaAuth.guard();
  if (!U) return;
  if (U.role !== 'commercial' && U.role !== 'master') {
    location.href = window.MelodiaAuth.home();
    return;
  }

  var V = window.MELODIA_VENTE || {};
  var MODELES = V.MODELES || {};
  var MODELES_CULTE = V.MODELES_CULTE || {};
  /* Un diocèse ne reçoit pas les mêmes messages qu'une agence funéraire :
     la fiche porte sa famille, et la console propose en conséquence. */
  function modelesDe(p) { return (p && p.type === 'culte') ? MODELES_CULTE : MODELES; }
  function tousModeles() { return Object.assign({}, MODELES, MODELES_CULTE); }
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
  var envoiDirect = null;   /* null = inconnu, true/false une fois testé */

  window.logout = function () { window.MelodiaAuth.logout(); location.href = '/compte'; };

  /* ═══ Dates ═══ */
  function jour(d) { return new Date(d).toISOString().slice(0, 10); }
  function aujourdhui() { return jour(Date.now()); }
  function dans(n) { return jour(Date.now() + n * 86400000); }
  function joli(d) {
    if (!d) return '—';
    var x = new Date(d);
    if (isNaN(x)) return '—';
    return x.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
  }
  function enRetard(p) { return p.relance_le && p.relance_le < aujourdhui() && !estClos(p); }
  function pourAujourdhui(p) { return p.relance_le && p.relance_le <= aujourdhui() && !estClos(p); }
  function estClos(p) { return p.statut === 'refus' || p.statut === 'partenaire' || p.oppose; }

  /* ═══ Casse des noms ═══
     La base SIRENE ne connaît que les capitales : « POMPES FUNEBRES
     LEGRAND », « LYON ». Tel quel dans un courriel, cela crie. On
     rétablit donc une casse lisible au moment de rédiger — la fiche,
     elle, garde la donnée officielle. */
  var PETITS = ['de', 'du', 'des', 'la', 'le', 'les', 'sur', 'sous', 'et', 'en', 'aux', 'au', 'lès'];
  var SIGLES = ['SARL', 'SAS', 'SASU', 'SA', 'EURL', 'SCI', 'SNC', 'SCOP', 'SELARL', 'PFG', 'OGF'];

  function joliCasse(t) {
    t = String(t || '').trim();
    if (!t) return '';
    /* Un texte déjà en casse mixte a été saisi à la main : on n'y touche pas */
    if (/[a-zàâäéèêëïîôöùûüç]/.test(t)) return t;

    var morceaux = t.toLowerCase().split(/(\s+|-|'|’)/);
    var premier = true;
    return morceaux.map(function (m) {
      if (!m.trim() || /^[\s\-'’]+$/.test(m)) return m;
      if (SIGLES.indexOf(m.toUpperCase()) !== -1) { premier = false; return m.toUpperCase(); }
      /* Un sigle court sans voyelle reste en capitales : PFG, SNC… */
      if (m.length <= 4 && !/[aeiouyàâäéèêëïîôöùûü]/.test(m)) { premier = false; return m.toUpperCase(); }
      if (!premier && PETITS.indexOf(m) !== -1) return m;
      premier = false;
      return m.charAt(0).toUpperCase() + m.slice(1);
    }).join('');
  }

  /* La vue d'une fiche telle qu'elle doit apparaître dans un courriel */
  function pourCourriel(p) {
    return Object.assign({}, p, {
      nom: joliCasse(p.nom),
      ville: joliCasse(p.ville),
      dirigeant: joliCasse(p.dirigeant)
    });
  }

  /* ═══ Journal d'activité ═══
     Trois semaines plus tard, personne ne se souvient de ce qui s'est
     dit. Chaque action laisse donc une ligne datée dans la fiche. */
  function noter(p, quoi, detail) {
    if (!Array.isArray(p.journal)) p.journal = [];
    p.journal.unshift({ le: new Date().toISOString(), quoi: quoi, detail: detail || '', par: U.name || U.email });
    if (p.journal.length > 60) p.journal.length = 60;
  }

  /* ═══ Chargement ═══ */
  async function charger() {
    PROSPECTS = await window.MelodiaProspects.mine();
    var b = $('badge-pro');
    if (b) b.textContent = PROSPECTS.length;
    var r = $('badge-rel');
    if (r) {
      var n = PROSPECTS.filter(pourAujourdhui).length;
      r.textContent = n;
      r.style.display = n ? '' : 'none';
    }
  }

  /* ═══ Navigation ═══ */
  var VUES = {
    accueil: ['Prospection', 'Tableau de <em>bord</em>', vAccueil, brancherAccueil],
    relances: ['À faire', 'Mes <em>relances</em>', vRelances, brancherProspects],
    recherche: ['Annuaire', 'Trouver des <em>agences</em>', vRecherche, brancherRecherche],
    prospects: ['Portefeuille', 'Mes <em>prospects</em>', vProspects, brancherProspects],
    modeles: ['Ressources', 'Modèles de <em>courriel</em>', vModeles, brancherModeles],
    playbook: ['Ressources', 'Script et <em>objections</em>', vPlaybook, brancherPlaybook],
    plan: ['Ressources', 'Plan de <em>prospection</em>', vPlan, function () {}],
    traditions: ['Ressources', 'Les <em>traditions</em>', vTraditions, brancherTraditions]
  };

  function go(v) {
    vueCourante = v;
    var def = VUES[v] || VUES.accueil;
    $('head-eyebrow').textContent = def[0];
    $('head-title').innerHTML = def[1];
    $('view').innerHTML = def[2]();
    def[3]();
    Array.prototype.forEach.call(document.querySelectorAll('.side-item'), function (b) {
      b.classList.toggle('active', b.dataset.v === v);
    });
    window.scrollTo(0, 0);
  }
  window.go = go;

  /* ═══════════════════════════════════════════════════════════
     Vue : tableau de bord
     ═══════════════════════════════════════════════════════════ */
  function compte(statut) { return PROSPECTS.filter(function (p) { return p.statut === statut; }).length; }

  function vAccueil() {
    var total = PROSPECTS.length;
    var aFaire = PROSPECTS.filter(pourAujourdhui);
    var retard = aFaire.filter(enRetard);
    var sansMail = PROSPECTS.filter(function (p) { return !p.email && !estClos(p); });
    var sansSuite = PROSPECTS.filter(function (p) { return !p.relance_le && !estClos(p); });
    var partenaires = compte('partenaire');
    var taux = total ? Math.round(partenaires / total * 100) : 0;

    /* Activité des trente derniers jours, lue dans les journaux */
    var borne = Date.now() - 30 * 86400000;
    var actes = { mail: 0, appel: 0 };
    PROSPECTS.forEach(function (p) {
      (p.journal || []).forEach(function (j) {
        if (new Date(j.le).getTime() < borne) return;
        if (/courriel|mail/i.test(j.quoi)) actes.mail++;
        if (/appel/i.test(j.quoi)) actes.appel++;
      });
    });

    return '<div class="kpi-grid">' +
        kpi(aFaire.length, 'À faire aujourd\'hui', retard.length ? retard.length + ' en retard' : 'À jour', aFaire.length ? 'var(--or)' : null) +
        kpi(total, 'Fiches au portefeuille', sansSuite.length ? sansSuite.length + ' sans prochaine action' : 'Toutes planifiées') +
        kpi(partenaires, 'Partenaires signés', taux + ' % du portefeuille', 'var(--green)') +
        kpi(actes.mail + actes.appel, 'Actions sur 30 jours', actes.mail + ' courriels · ' + actes.appel + ' appels') +
      '</div>' +

      (aFaire.length ? '<div class="panel" style="margin-top:1.4rem;">' +
        '<div class="panel-head"><div><div class="panel-title">À faire <em>aujourd\'hui</em></div>' +
        '<div class="panel-sub">' + aFaire.length + ' fiche' + (aFaire.length > 1 ? 's' : '') +
        (retard.length ? ' — dont ' + retard.length + ' en retard' : '') + '</div></div>' +
        '<button class="btn btn-gold btn-sm" onclick="go(\'relances\')">Ouvrir la file</button></div>' +
        aFaire.slice(0, 6).map(ligneCourte).join('') +
      '</div>' : '') +

      '<div class="panel" style="margin-top:1.4rem;">' +
        '<div class="panel-title">Le <em>pipeline</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.2rem;">Où en sont vos fiches</div>' +
        '<div class="pipeline">' +
          window.MelodiaProspects.STATUTS.map(function (s) {
            var n = compte(s);
            var pc = total ? Math.round(n / total * 100) : 0;
            return '<div class="pl-seg" data-aller="' + s + '" style="cursor:pointer;">' +
              '<div class="pl-n" style="color:' + ST[s].color + ';">' + n + '</div>' +
              '<div class="pl-l">' + ST[s].label + '</div>' +
              '<div class="pl-p"><span style="width:' + pc + '%;background:' + ST[s].color + ';"></span></div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +

      (sansMail.length ? '<div class="panel" style="margin-top:1.4rem;">' +
        '<div class="panel-head"><div><div class="panel-title">Coordonnées <em>à compléter</em></div>' +
        '<div class="panel-sub">' + sansMail.length + ' fiche' + (sansMail.length > 1 ? 's sont' : ' est') +
        ' sans adresse email — l\'annuaire public n\'en publie pas</div></div>' +
        '<button class="btn btn-outline btn-sm" onclick="go(\'prospects\')">Compléter</button></div>' +
        sansMail.slice(0, 5).map(ligneCourte).join('') +
      '</div>' : '') +

      '<div class="panel" style="margin-top:1.4rem;">' +
        '<div class="panel-title">Les <em>chiffres</em> à connaître</div>' +
        '<div class="panel-sub" style="margin-bottom:1rem;">Les seuls à citer en rendez-vous</div>' +
        '<table class="tbl"><tbody>' +
          (V.CHIFFRES || []).map(function (c) {
            return '<tr><td style="color:var(--ash);">' + esc(c[0]) + '</td>' +
              '<td style="text-align:right;color:var(--or);">' + esc(c[1]) + '</td></tr>';
          }).join('') +
        '</tbody></table>' +
      '</div>';
  }

  function kpi(v, l, f, couleur) {
    return '<div class="kpi"><div class="kpi-value"' + (couleur ? ' style="color:' + couleur + ';"' : '') + '>' + v + '</div>' +
      '<div class="kpi-label">' + l + '</div>' + (f ? '<div class="kpi-foot">' + f + '</div>' : '') + '</div>';
  }

  function ligneCourte(p) {
    var s = ST[p.statut] || ST.nouveau;
    var tard = enRetard(p);
    return '<div class="o-row" style="padding:.75rem 0;">' +
      '<div class="o-head">' +
        '<div style="min-width:0;">' +
          '<div class="o-name">' + esc(p.nom) + '</div>' +
          '<div class="o-meta">' + esc([p.cp, p.ville].filter(Boolean).join(' ')) +
            (p.relance_le ? ' · <span style="color:' + (tard ? 'var(--red)' : 'var(--or-patina)') + ';">' +
              (tard ? 'en retard depuis le ' : 'prévu le ') + joli(p.relance_le) + '</span>' : '') +
            (!p.email ? ' · <span style="color:var(--amber);">sans email</span>' : '') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:.5rem;align-items:center;">' +
          '<span class="pill" style="color:' + s.color + ';border-color:' + s.color + '55;">' + s.label + '</span>' +
          '<button class="own-mini" data-aller-fiche="' + esc(p.siret) + '" title="Ouvrir la fiche">→</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function brancherAccueil() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-aller]'), function (b) {
      b.addEventListener('click', function () { filtreStatut = b.dataset.aller; go('prospects'); });
    });
    brancherAllerFiche();
  }

  function brancherAllerFiche() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-aller-fiche]'), function (b) {
      b.addEventListener('click', function () {
        filtreStatut = '';
        ouvrirApres = b.dataset.allerFiche;
        go('prospects');
      });
    });
  }
  var ouvrirApres = null;

  /* ═══════════════════════════════════════════════════════════
     Vue : la file des relances
     ═══════════════════════════════════════════════════════════ */
  function vRelances() {
    var liste = PROSPECTS.filter(pourAujourdhui).sort(function (a, b) {
      return (a.relance_le || '').localeCompare(b.relance_le || '');
    });
    var suivantes = PROSPECTS.filter(function (p) {
      return p.relance_le && p.relance_le > aujourdhui() && !estClos(p);
    }).sort(function (a, b) { return (a.relance_le || '').localeCompare(b.relance_le || ''); }).slice(0, 12);

    return '<div class="panel">' +
        '<div class="panel-head"><div><div class="panel-title">À faire <em>maintenant</em></div>' +
        '<div class="panel-sub">' + (liste.length ? liste.length + ' fiche' + (liste.length > 1 ? 's' : '') + ' arrivée' + (liste.length > 1 ? 's' : '') + ' à échéance' : 'Rien en attente — profitez-en pour prospecter') + '</div></div>' +
        '<button class="btn btn-outline btn-sm" onclick="go(\'recherche\')">Ajouter des agences</button></div>' +
        (liste.length ? liste.map(fiche).join('') :
          '<p style="color:var(--ash);font-size:.9rem;">Aucune action prévue aujourd\'hui.</p>') +
      '</div>' +
      (suivantes.length ? '<div class="panel" style="margin-top:1.4rem;">' +
        '<div class="panel-title">Les <em>jours suivants</em></div>' +
        '<div class="panel-sub" style="margin-bottom:.6rem;">Pour anticiper</div>' +
        suivantes.map(ligneCourte).join('') +
      '</div>' : '');
  }

  /* ═══════════════════════════════════════════════════════════
     Vue : recherche dans l'annuaire
     ═══════════════════════════════════════════════════════════ */
  function vRecherche() {
    return '<div class="panel">' +
        '<div class="panel-title">L\'annuaire des <em>entreprises</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1.4rem;">Base SIRENE de l\'INSEE, code NAF 96.03Z — services funéraires. Données ouvertes, sans clé.</div>' +
        '<div class="field"><label class="field-label">Qui cherchez-vous ?</label>' +
          '<select class="field-select" id="rc-type">' +
            '<option value="funeraire">Pompes funèbres et crématoriums</option>' +
            '<option value="culte">Paroisses, diocèses, mosquées, synagogues, temples</option>' +
          '</select>' +
          '<div class="field-hint">Deux codes d\'activité différents dans la base SIRENE. Les lieux de culte se démarchent autrement : lisez d\'abord la fiche des traditions.</div></div>' +
        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Département</label>' +
            '<select class="field-select" id="rc-dep"><option value="">Choisir…</option>' +
            DEPS.map(function (d) { return '<option value="' + d[0] + '">' + d[0] + ' — ' + d[1] + '</option>'; }).join('') +
            '</select></div>' +
          '<div class="field"><label class="field-label">Nom, facultatif</label>' +
            '<input class="field-input" id="rc-q" placeholder="Roblot, funérarium…"></div>' +
        '</div>' +
        '<button class="btn btn-gold" id="rc-go">Rechercher</button>' +
        '<p style="font-size:.82rem;color:var(--ash);margin-top:1rem;line-height:1.7;">' +
          'L\'annuaire public ne publie ni téléphone ni adresse email : ces deux champs se complètent à la main sur la fiche, ' +
          'où des raccourcis de recherche vous y emmènent en un clic.</p>' +
      '</div>' +
      '<div id="rc-res" style="margin-top:1.4rem;"></div>' +
      '<div class="panel" style="margin-top:1.4rem;">' +
        '<div class="panel-title">Importer une <em>liste</em></div>' +
        '<div class="panel-sub" style="margin-bottom:1rem;">Si vous avez déjà des coordonnées ailleurs, collez-les ici plutôt que de les ressaisir.</div>' +
        '<textarea class="field-area" id="rc-csv" style="min-height:120px;font-family:var(--ff-m);font-size:.78rem;" ' +
          'placeholder="nom;email;tel;ville;cp&#10;Pompes Funèbres Roblot;contact@roblot.fr;04 78 00 00 00;Lyon;69003"></textarea>' +
        '<p style="font-size:.8rem;color:var(--ash);margin:.7rem 0 1rem;line-height:1.7;">' +
          'Première ligne : les intitulés de colonnes. Séparateur point-virgule, virgule ou tabulation. ' +
          'Colonnes reconnues : nom, email, tel, ville, cp, adresse, dirigeant, site, siret, notes.</p>' +
        '<button class="btn btn-outline" id="rc-import">Importer</button>' +
      '</div>';
  }

  function brancherRecherche() {
    var lancer = async function (page) {
      var dep = $('rc-dep').value;
      var q = $('rc-q').value.trim();
      var type = $('rc-type') ? $('rc-type').value : 'funeraire';
      if (!dep && !q) {
        if (window.melodiaToast) window.melodiaToast('Choisissez un département ou saisissez un nom.');
        return;
      }
      $('rc-res').innerHTML = '<div class="panel"><p style="color:var(--ash);">Recherche en cours…</p></div>';
      try {
        var url = '/api/prospects?type=' + encodeURIComponent(type) +
          (dep ? '&departement=' + encodeURIComponent(dep) : '') +
          (q ? '&q=' + encodeURIComponent(q) : '') + '&page=' + (page || 1);
        var r = await fetch(url);
        var d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Recherche impossible');
        afficherResultats(d);
      } catch (e) {
        $('rc-res').innerHTML = '<div class="panel"><p style="color:var(--red);">' + esc(e.message) + '</p></div>';
      }
    };
    $('rc-go').addEventListener('click', function () { lancer(1); });
    $('rc-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') lancer(1); });
    window.__rcLancer = lancer;

    $('rc-import').addEventListener('click', importerCsv);
  }

  function afficherResultats(d) {
    if (!d.resultats.length) {
      $('rc-res').innerHTML = '<div class="panel"><p style="color:var(--ash);">Aucune agence trouvée.</p></div>';
      return;
    }
    var connus = {};
    PROSPECTS.forEach(function (p) { connus[p.siret] = true; });

    $('rc-res').innerHTML = '<div class="panel">' +
      '<div class="panel-head"><div><div class="panel-title">Résultats</div>' +
      '<div class="panel-sub">Page ' + d.page + ' sur ' + d.pages + ' · ' + d.total + ' établissements</div></div>' +
      '<button class="btn btn-gold btn-sm" id="rc-tout">Tout ajouter</button></div>' +
      d.resultats.map(function (e) {
        var deja = connus[e.siret];
        return '<div class="o-row" style="padding:.9rem 0;border-bottom:1px solid var(--line-soft);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">' +
            '<div style="min-width:0;flex:1;">' +
              '<div class="o-name" style="font-size:1.05rem;">' + esc(e.nom) + (e.enseigne && e.enseigne !== e.nom ? ' <span style="color:var(--ash);font-size:.85rem;">· ' + esc(e.enseigne) + '</span>' : '') +
              // Une enseigne de plusieurs agences ne se démarche pas comme une
              // maison de famille : la décision se prend ailleurs qu'au comptoir
              (e.etablissements > 1 ? ' <span class="pill pill-reseau">' + e.etablissements + ' agences</span>' : '') + '</div>' +
              '<div class="o-meta">' + esc([e.adresse, e.cp, e.ville].filter(Boolean).join(' · ')) +
              (e.agence ? ' <span style="color:var(--ash);">(agence)</span>' : '') +
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
      b.addEventListener('click', async function () {
        var e = d.resultats.filter(function (x) { return x.siret === b.dataset.ajout; })[0];
        if (!e) return;
        await ajouter(e, d.type);
        b.outerHTML = '<span class="pill" style="color:var(--green);border-color:rgba(74,222,128,.35);">Ajoutée</span>';
      });
    });
    var tout = $('rc-tout');
    if (tout) tout.addEventListener('click', async function () {
      tout.disabled = true;
      for (var i = 0; i < d.resultats.length; i++) {
        if (!connus[d.resultats[i].siret]) await ajouter(d.resultats[i], d.type);
      }
      await charger();
      if (window.melodiaToast) window.melodiaToast(d.resultats.length + ' agences ajoutées à votre portefeuille.');
      go('prospects');
    });
    var pr = $('rc-prev'), nx = $('rc-next');
    if (pr) pr.addEventListener('click', function () { window.__rcLancer(d.page - 1); });
    if (nx) nx.addEventListener('click', function () { window.__rcLancer(d.page + 1); });
  }

  /* Une fiche neuve arrive avec une action prévue : sans date, elle
     dormirait au fond du portefeuille. */
  async function ajouter(e, type) {
    var p = Object.assign({}, e, {
      type: type || 'funeraire',
      statut: 'nouveau',
      relance_le: aujourdhui(),
      journal: [{ le: new Date().toISOString(), quoi: 'Fiche créée', detail: 'Depuis l\'annuaire', par: U.name || U.email }]
    });
    await window.MelodiaProspects.enregistrer(p);
    PROSPECTS.push(p);
    return p;
  }

  /* ═══ Import d'une liste collée ═══ */
  var ALIAS = {
    nom: 'nom', raison: 'nom', societe: 'nom', entreprise: 'nom', agence: 'nom',
    email: 'email', mail: 'email', courriel: 'email', 'e-mail': 'email',
    tel: 'tel', telephone: 'tel', 'téléphone': 'tel', portable: 'tel', fixe: 'tel',
    ville: 'ville', commune: 'ville', cp: 'cp', 'code postal': 'cp', codepostal: 'cp',
    adresse: 'adresse', rue: 'adresse', dirigeant: 'dirigeant', contact: 'dirigeant',
    interlocuteur: 'dirigeant', site: 'site', web: 'site', 'site web': 'site',
    siret: 'siret', siren: 'siren', notes: 'notes', note: 'notes', commentaire: 'notes'
  };

  function normCle(s) {
    return String(s || '').trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  async function importerCsv() {
    var brut = $('rc-csv').value.trim();
    if (!brut) { if (window.melodiaToast) window.melodiaToast('Collez d\'abord une liste.'); return; }

    var lignes = brut.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (lignes.length < 2) { if (window.melodiaToast) window.melodiaToast('Il faut au moins une ligne d\'intitulés et une ligne de données.'); return; }

    /* Le séparateur est celui qui revient le plus dans la ligne d'intitulés */
    var sep = [';', '\t', ','].map(function (s) {
      return { s: s, n: lignes[0].split(s).length };
    }).sort(function (a, b) { return b.n - a.n; })[0].s;

    var cols = lignes[0].split(sep).map(function (c) { return ALIAS[normCle(c)] || null; });
    if (cols.indexOf('nom') === -1) {
      if (window.melodiaToast) window.melodiaToast('Aucune colonne « nom » reconnue dans les intitulés.');
      return;
    }

    var connus = {};
    PROSPECTS.forEach(function (p) { connus[p.siret] = p; });
    var ajouts = 0, majs = 0;

    for (var i = 1; i < lignes.length; i++) {
      var cases = lignes[i].split(sep);
      var f = {};
      cols.forEach(function (c, j) {
        if (c && cases[j] != null) f[c] = String(cases[j]).trim().replace(/^"|"$/g, '');
      });
      if (!f.nom) continue;
      var cle = f.siret || f.siren || ('imp-' + normCle(f.nom) + '-' + normCle(f.cp || f.ville || ''));
      var existe = connus[cle];
      if (existe) {
        ['email', 'tel', 'site', 'dirigeant', 'adresse', 'cp', 'ville'].forEach(function (k) {
          if (f[k] && !existe[k]) existe[k] = f[k];
        });
        if (f.notes) existe.notes = (existe.notes ? existe.notes + '\n' : '') + f.notes;
        noter(existe, 'Fiche complétée', 'Import de liste');
        await window.MelodiaProspects.enregistrer(existe);
        majs++;
      } else {
        var p = Object.assign({ siret: cle, statut: 'nouveau', relance_le: aujourdhui() }, f);
        p.journal = [{ le: new Date().toISOString(), quoi: 'Fiche créée', detail: 'Import de liste', par: U.name || U.email }];
        await window.MelodiaProspects.enregistrer(p);
        connus[cle] = p;
        ajouts++;
      }
    }
    await charger();
    if (window.melodiaToast) {
      window.melodiaToast(ajouts + ' fiche' + (ajouts > 1 ? 's' : '') + ' créée' + (ajouts > 1 ? 's' : '') +
        (majs ? ', ' + majs + ' complétée' + (majs > 1 ? 's' : '') : '') + '.');
    }
    go('prospects');
  }

  /* ═══════════════════════════════════════════════════════════
     Vue : portefeuille
     ═══════════════════════════════════════════════════════════ */
  function vProspects() {
    var liste = PROSPECTS.filter(function (p) {
      if (filtreStatut && p.statut !== filtreStatut) return false;
      if (filtreOwner && (p.owner || '') !== filtreOwner) return false;
      return true;
    }).sort(function (a, b) {
      var ra = a.relance_le || '9999', rb = b.relance_le || '9999';
      return ra.localeCompare(rb);
    });

    var owners = {};
    PROSPECTS.forEach(function (p) { if (p.owner) owners[p.owner] = p.owner_nom || p.owner; });

    return '<div class="panel">' +
        '<div class="panel-head"><div><div class="panel-title">Mes <em>prospects</em></div>' +
          '<div class="panel-sub">' + liste.length + ' fiche' + (liste.length > 1 ? 's' : '') +
          (filtreStatut || filtreOwner ? ' · filtre actif' : '') + '</div></div>' +
          '<button class="btn btn-outline btn-sm" onclick="go(\'recherche\')">Ajouter des agences</button></div>' +
        '<div class="own-tabs" style="margin-bottom:1rem;">' +
          '<button class="own-tab' + (filtreStatut === '' ? ' active' : '') + '" data-filtre="">Toutes (' + PROSPECTS.length + ')</button>' +
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

  /* Raccourcis de recherche : l'annuaire public ne donne pas les
     coordonnées, autant emmener le collaborateur là où elles sont. */
  function liensRecherche(p) {
    var q = encodeURIComponent('"' + (p.nom || '') + '" ' + (p.ville || '') + ' pompes funèbres');
    var liens = [
      ['Google', 'https://www.google.com/search?q=' + q + '+email+contact'],
      ['Pages Jaunes', 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=' +
        encodeURIComponent(p.nom || '') + '&ou=' + encodeURIComponent(p.ville || '')]
    ];
    if (p.siren) liens.push(['Fiche INSEE', 'https://annuaire-entreprises.data.gouv.fr/entreprise/' + encodeURIComponent(p.siren)]);
    return liens.map(function (l) {
      return '<a class="btn btn-ghost btn-sm" href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(l[0]) + ' ↗</a>';
    }).join('');
  }

  function fiche(p) {
    var s = ST[p.statut] || ST.nouveau;
    var tard = enRetard(p);
    var ouvert = ouvrirApres === p.siret;
    return '<div class="o-row" data-fiche="' + esc(p.siret) + '">' +
      '<div class="o-head">' +
        '<div style="min-width:0;">' +
          '<div class="o-name">' + esc(p.nom) +
            (p.type === 'culte' ? ' <span class="pill pill-culte">Lieu de culte</span>' : '') +
            (p.oppose ? ' <span class="pill" style="color:var(--red);border-color:rgba(248,113,113,.4);">Opposition</span>' : '') + '</div>' +
          '<div class="o-meta">' + esc([p.adresse, p.cp, p.ville].filter(Boolean).join(' · ')) +
          (p.dirigeant ? ' · ' + esc(p.dirigeant) : '') +
          (EST_MAITRE && p.owner_nom ? ' · <span style="color:var(--or-patina);">' + esc(p.owner_nom) + '</span>' : '') + '</div>' +
          '<div class="o-meta o-contact">' +
            (p.email ? '<a href="mailto:' + esc(p.email) + '" style="color:var(--or-patina);">' + esc(p.email) + '</a>' :
              '<span style="color:var(--amber);">email à trouver</span>') +
            ' · ' +
            (p.tel ? '<a href="tel:' + esc(String(p.tel).replace(/\s/g, '')) + '" style="color:var(--or-patina);">' + esc(p.tel) + '</a>' :
              '<span style="color:var(--amber);">téléphone à trouver</span>') +
            (p.relance_le ? ' · <span style="color:' + (tard ? 'var(--red)' : 'var(--ash)') + ';">' +
              (tard ? 'en retard depuis le ' : 'prochaine action le ') + joli(p.relance_le) + '</span>' :
              ' · <span style="color:var(--amber);">aucune action prévue</span>') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;">' +
          '<span class="pill" style="color:' + s.color + ';border-color:' + s.color + '55;">' + s.label + '</span>' +
          '<button class="own-mini" data-ouvrir="' + esc(p.siret) + '" title="Ouvrir la fiche">✎</button>' +
        '</div>' +
      '</div>' +

      '<div class="fiche-detail" id="fd-' + esc(p.siret) + '"' + (ouvert ? '' : ' hidden') + '>' +

        '<div class="field-row" style="margin-top:1rem;">' +
          '<div class="field"><label class="field-label">Adresse email</label>' +
            '<input class="field-input" type="email" data-champ="email" data-siret="' + esc(p.siret) + '" value="' + esc(p.email || '') + '" placeholder="contact@agence.fr"></div>' +
          '<div class="field"><label class="field-label">Téléphone</label>' +
            '<input class="field-input" type="tel" data-champ="tel" data-siret="' + esc(p.siret) + '" value="' + esc(p.tel || '') + '" placeholder="04 78 00 00 00"></div>' +
        '</div>' +
        '<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin:-.4rem 0 1rem;">' +
          '<span class="field-hint" style="align-self:center;margin-right:.3rem;">Les trouver :</span>' + liensRecherche(p) +
        '</div>' +

        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Interlocuteur</label>' +
            '<input class="field-input" data-champ="dirigeant" data-siret="' + esc(p.siret) + '" value="' + esc(p.dirigeant || '') + '" placeholder="Monsieur Roblot"></div>' +
          '<div class="field"><label class="field-label">Site internet</label>' +
            '<input class="field-input" data-champ="site" data-siret="' + esc(p.siret) + '" value="' + esc(p.site || '') + '" placeholder="pf-roblot.fr"></div>' +
        '</div>' +

        '<div class="field-row">' +
          '<div class="field"><label class="field-label">Statut</label>' +
            '<select class="field-select" data-champ="statut" data-siret="' + esc(p.siret) + '">' +
              window.MelodiaProspects.STATUTS.map(function (k) {
                return '<option value="' + k + '"' + (p.statut === k ? ' selected' : '') + '>' + ST[k].label + '</option>';
              }).join('') + '</select></div>' +
          '<div class="field"><label class="field-label">Prochaine action</label>' +
            '<input class="field-input" type="date" data-champ="relance_le" data-siret="' + esc(p.siret) + '" value="' + esc(p.relance_le || '') + '">' +
            '<div class="reports">' +
              [['Demain', 1], ['3 jours', 3], ['1 semaine', 7], ['1 mois', 30], ['4 mois', 120]].map(function (r) {
                return '<button type="button" class="report" data-report="' + r[1] + '" data-siret="' + esc(p.siret) + '">' + r[0] + '</button>';
              }).join('') +
            '</div></div>' +
        '</div>' +

        '<div class="field"><label class="field-label">Notes</label>' +
          '<textarea class="field-area" data-champ="notes" data-siret="' + esc(p.siret) + '" style="min-height:80px;" placeholder="Leurs mots à eux, pas un résumé…">' + esc(p.notes || '') + '</textarea></div>' +

        '<div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin-bottom:.9rem;">' +
          '<button class="btn btn-outline btn-sm" data-appel="' + esc(p.siret) + '">Journaliser un appel</button>' +
          (p.tel ? '<a class="btn btn-ghost btn-sm" href="tel:' + esc(String(p.tel).replace(/\s/g, '')) + '">Appeler ↗</a>' : '') +
          '<button class="own-mini' + (p.oppose ? ' danger' : '') + '" data-stop="' + esc(p.siret) + '" title="Opposition — ne plus jamais contacter">' +
            (p.oppose ? 'Opposition levée ?' : 'A répondu STOP') + '</button>' +
          '<button class="own-mini danger" data-suppr="' + esc(p.siret) + '" title="Retirer la fiche" style="margin-left:auto;">✕</button>' +
        '</div>' +

        (p.oppose ?
          '<p style="font-size:.85rem;color:var(--red);line-height:1.7;margin-bottom:1rem;">' +
            'Cette agence s\'est opposée à la prospection. Aucun courriel ne peut plus lui être envoyé depuis la console.</p>'
          :
          '<div style="border-top:1px solid var(--line-soft);padding-top:1rem;">' +
            '<div class="field-label" style="margin-bottom:.6rem;">Écrire à cette agence</div>' +
            '<div style="display:flex;gap:.5rem;flex-wrap:wrap;">' +
              (function () {
                var jeu = modelesDe(p);
                var premier = Object.keys(jeu)[0];
                return Object.keys(jeu).map(function (m) {
                  return '<button class="btn btn-' + (m === premier ? 'gold' : 'outline') + ' btn-sm" data-mail="' + m + '" data-siret="' + esc(p.siret) + '">' +
                    esc(jeu[m].nom) + '</button>';
                }).join('');
              })() +
            '</div>' +
          '</div>') +

        (p.journal && p.journal.length ?
          '<div style="border-top:1px solid var(--line-soft);margin-top:1rem;padding-top:1rem;">' +
            '<div class="field-label" style="margin-bottom:.6rem;">Historique</div>' +
            '<div style="font-size:.83rem;color:var(--ash);line-height:1.8;">' +
              p.journal.slice(0, 8).map(function (j) {
                return '<div style="display:flex;gap:.7rem;">' +
                  '<span style="color:var(--dust);white-space:nowrap;font-family:var(--ff-m);font-size:.68rem;">' + joli(j.le) + '</span>' +
                  '<span><b style="color:var(--bone);">' + esc(j.quoi) + '</b>' +
                  (j.detail ? ' — ' + esc(j.detail) : '') +
                  (EST_MAITRE && j.par ? ' <span style="color:var(--dust);">· ' + esc(j.par) + '</span>' : '') + '</span></div>';
              }).join('') +
            '</div>' +
          '</div>' : '') +

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
      var ev = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
      el.addEventListener(ev, function () { majFiche(el.dataset.siret, el.dataset.champ, el.value); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-report]'), function (b) {
      b.addEventListener('click', function () {
        var p = trouver(b.dataset.siret);
        if (!p) return;
        p.relance_le = dans(Number(b.dataset.report));
        window.MelodiaProspects.enregistrer(p).then(function () {
          charger().then(function () { ouvrirApres = p.siret; go(vueCourante); });
        });
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-appel]'), function (b) {
      b.addEventListener('click', function () { journaliserAppel(b.dataset.appel); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-stop]'), function (b) {
      b.addEventListener('click', async function () {
        var p = trouver(b.dataset.stop);
        if (!p) return;
        if (!p.oppose) {
          if (!confirm('« ' + p.nom +' » a demandé à ne plus être contactée ?\n\nLa fiche passe en Sans suite et plus aucun courriel ne pourra lui être envoyé.')) return;
          p.oppose = true;
          p.statut = 'refus';
          p.relance_le = '';
          noter(p, 'Opposition enregistrée', 'A répondu STOP');
        } else {
          if (!confirm('Lever l\'opposition ? À ne faire que si l\'agence vous l\'a explicitement demandé.')) return;
          p.oppose = false;
          noter(p, 'Opposition levée', 'À la demande de l\'agence');
        }
        await window.MelodiaProspects.enregistrer(p);
        await charger();
        go(vueCourante);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-mail]'), function (b) {
      b.addEventListener('click', function () { composer(b.dataset.siret, b.dataset.mail); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-suppr]'), function (b) {
      b.addEventListener('click', async function () {
        var p = trouver(b.dataset.suppr);
        if (!confirm('Retirer « ' + (p ? p.nom : '') + ' » de votre portefeuille ?')) return;
        await window.MelodiaProspects.supprimer(b.dataset.suppr);
        await charger();
        go(vueCourante);
      });
    });

    brancherAllerFiche();
    if (ouvrirApres) {
      var cible = document.querySelector('[data-fiche="' + ouvrirApres + '"]');
      if (cible) cible.scrollIntoView({ block: 'center' });
      ouvrirApres = null;
    }
  }

  function trouver(siret) { return PROSPECTS.filter(function (p) { return p.siret === siret; })[0]; }

  var minuteur = null;
  function majFiche(siret, champ, valeur) {
    var p = trouver(siret);
    if (!p) return;
    var avant = p.statut;
    p[champ] = valeur;
    clearTimeout(minuteur);
    minuteur = setTimeout(function () {
      if (champ === 'statut' && avant !== valeur) noter(p, 'Statut : ' + (ST[valeur] || {}).label, '');
      window.MelodiaProspects.enregistrer(p).then(function () {
        if (champ === 'statut') { charger().then(function () { ouvrirApres = siret; go(vueCourante); }); }
      });
    }, 400);
  }

  function journaliserAppel(siret) {
    var p = trouver(siret);
    if (!p) return;
    var quoi = prompt('Ce qui s\'est dit pendant l\'appel :\n(leurs mots à eux, pas un résumé)');
    if (quoi === null) return;
    noter(p, 'Appel', quoi.slice(0, 400));
    if (quoi.trim()) p.notes = (p.notes ? p.notes + '\n' : '') + joli(Date.now()) + ' — ' + quoi.trim();
    if (!p.relance_le || p.relance_le <= aujourdhui()) p.relance_le = dans(7);
    window.MelodiaProspects.enregistrer(p).then(function () {
      charger().then(function () { ouvrirApres = siret; go(vueCourante); });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     Rédaction et envoi
     Le message s'ouvre relu et modifiable : on n'envoie jamais un
     courriel qu'on n'a pas eu sous les yeux.
     ═══════════════════════════════════════════════════════════ */
  function composer(siret, cle) {
    var p = trouver(siret);
    var m = tousModeles()[cle];
    if (!p || !m) return;

    if (p.oppose) {
      if (window.melodiaToast) window.melodiaToast('Cette agence s\'est opposée à la prospection.');
      return;
    }
    if (!p.email) {
      if (window.melodiaToast) window.melodiaToast('Renseignez d\'abord l\'adresse email de l\'agence.');
      var champ = document.querySelector('[data-champ="email"][data-siret="' + siret + '"]');
      var det = $('fd-' + siret);
      if (det) det.hidden = false;
      if (champ) { champ.focus(); champ.classList.add('invalid'); }
      return;
    }

    var vue = pourCourriel(p);

    var fond = document.createElement('div');
    fond.className = 'compo';
    fond.innerHTML =
      '<div class="compo-boite" role="dialog" aria-modal="true" aria-label="Rédiger le courriel">' +
        '<div class="compo-tete">' +
          '<div><div class="panel-title" style="font-size:1.15rem;">' + esc(m.nom) + '</div>' +
          '<div class="panel-sub">à ' + esc(p.nom) + ' · ' + esc(p.email) + '</div></div>' +
          '<button class="own-mini" data-fermer title="Fermer">✕</button>' +
        '</div>' +
        '<div class="compo-corps">' +
          (m.quand ? '<p class="compo-quand">' + esc(m.quand) + '</p>' : '') +
          '<div class="field"><label class="field-label">Objet</label>' +
            '<input class="field-input" id="cp-objet" value="' + esc(m.objet(vue)) + '"></div>' +
          '<div class="field"><label class="field-label">Message</label>' +
            '<textarea class="field-area" id="cp-texte" style="min-height:300px;line-height:1.75;">' + esc(m.texte(vue)) + '</textarea></div>' +
          '<p class="compo-note">Le message part habillé aux couleurs de la maison, avec le logo et le lien d\'écoute. ' +
            'La mention légale d\'opposition est ajoutée automatiquement, et les réponses vous reviennent directement.</p>' +
        '</div>' +
        '<div class="compo-pied">' +
          '<button class="btn btn-ghost btn-sm" data-mailto>Ouvrir dans ma messagerie</button>' +
          '<button class="btn btn-gold" id="cp-envoyer">Envoyer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(fond);

    var fermer = function () { fond.remove(); document.removeEventListener('keydown', echap); };
    var echap = function (e) { if (e.key === 'Escape') fermer(); };
    document.addEventListener('keydown', echap);
    fond.addEventListener('click', function (e) { if (e.target === fond) fermer(); });
    fond.querySelector('[data-fermer]').addEventListener('click', fermer);

    /* On enregistre AVANT de passer la main à la messagerie : une
       navigation « mailto: » peut décharger la page, et l'action serait
       alors perdue sans laisser de trace. Le lien est déclenché par un
       ancrage plutôt qu'en changeant location.href, ce qui laisse la
       console en place. */
    var versMessagerie = async function () {
      var objet = $('cp-objet').value;
      var texte = $('cp-texte').value;
      fermer();
      await apresEnvoi(p, m, 'Courriel préparé', 'Modèle « ' + m.nom + ' », ouvert dans la messagerie');
      var a = document.createElement('a');
      a.href = 'mailto:' + encodeURIComponent(p.email) +
        '?subject=' + encodeURIComponent(objet) +
        '&body=' + encodeURIComponent(texte + '\n\n—\n' + (U.name || '') +
          '\nMelodia Funèbre\n' + (V.SITE || '') +
          '\n\nPour ne plus être contacté, répondez STOP à ce courriel.');
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { a.remove(); }, 0);
    };
    fond.querySelector('[data-mailto]').addEventListener('click', versMessagerie);

    $('cp-envoyer').addEventListener('click', async function () {
      var bouton = $('cp-envoyer');
      bouton.disabled = true;
      bouton.classList.add('is-loading');
      var objet = $('cp-objet').value.trim();
      var texte = $('cp-texte').value.trim();
      try {
        var r = await fetch('/api/prospect-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: p.email, sujet: objet, texte: texte,
            titre: m.titre ? m.titre(vue) : '',
            lienTexte: m.lien && m.lien.texte, lienUrl: m.lien && m.lien.url,
            expediteurNom: U.name || '', expediteurEmail: U.email || '',
            expediteurRole: EST_MAITRE ? 'Melodia Funèbre' : 'Melodia Funèbre'
          })
        });
        var d = await r.json().catch(function () { return {}; });

        if (r.ok) {
          envoiDirect = true;
          apresEnvoi(p, m, 'Courriel envoyé', 'Modèle « ' + m.nom + ' »');
          if (window.melodiaToast) window.melodiaToast('Courriel envoyé à ' + p.email + '.');
          fermer();
          return;
        }

        if (d.code === 'NOT_CONFIGURED') {
          /* Sans clé d'envoi, la messagerie du collaborateur prend le
             relais : le message part quand même. */
          envoiDirect = false;
          await versMessagerie();
          return;
        }
        throw new Error(d.motif || d.error || 'Envoi impossible');
      } catch (e) {
        if (window.melodiaToast) window.melodiaToast('Envoi impossible : ' + e.message);
        bouton.disabled = false;
        bouton.classList.remove('is-loading');
      }
    });

    setTimeout(function () { $('cp-objet').focus(); }, 40);
  }

  /* Le statut avance et la relance se replace : une action de moins
     à ne pas oublier. */
  function apresEnvoi(p, m, quoi, detail) {
    noter(p, quoi, detail);
    p.dernier_contact = new Date().toISOString();
    var suite = m.etape;
    var ordre = window.MelodiaProspects.STATUTS;
    if (suite && ordre.indexOf(p.statut) < ordre.indexOf(suite)) p.statut = suite;
    p.relance_le = dans(m.nom === 'Relance' ? 14 : 7);
    return window.MelodiaProspects.enregistrer(p)
      .then(charger)
      .then(function () { ouvrirApres = p.siret; go(vueCourante); });
  }

  /* ═══════════════════════════════════════════════════════════
     Vue : modèles de courriel
     ═══════════════════════════════════════════════════════════ */
  function vModeles() {
    var exemple = { nom: 'Pompes Funèbres Roblot', ville: 'Lyon', dirigeant: 'Monsieur Roblot', cp: '69003' };
    return '<div class="panel" style="margin-bottom:1.4rem;">' +
        '<div class="panel-title">Six <em>modèles</em>, une séquence</div>' +
        '<div class="panel-sub">La séquence complète</div>' +
        '<p class="panel-note">Le nom de l\'agence, la ville et l\'interlocuteur sont remplacés pour chaque fiche — et remis en casse lisible, la base SIRENE ne connaissant que les capitales. Vous relisez et modifiez chaque message avant l\'envoi.</p>' +
        '<div style="font-size:.9rem;color:var(--bone);line-height:1.9;">' +
          (V.PLAN ? V.PLAN.sequence.map(function (e) {
            return '<div style="display:flex;gap:1rem;padding:.4rem 0;border-bottom:1px solid var(--line-soft);">' +
              '<b style="color:var(--or-patina);min-width:70px;font-family:var(--ff-m);font-size:.7rem;letter-spacing:.1em;">' + esc(e.jour) + '</b>' +
              '<span><b style="color:var(--paper);">' + esc(e.action) + '</b><br>' +
              '<span style="color:var(--ash);font-size:.86rem;">' + esc(e.detail) + '</span></span></div>';
          }).join('') : '') +
        '</div>' +
      '</div>' +
      Object.keys(MODELES).map(function (k) {
        var m = MODELES[k];
        return '<div class="panel" style="margin-bottom:1.2rem;">' +
          '<div class="panel-head"><div>' +
            '<div class="panel-title">' + esc(m.nom) + '</div>' +
            '<div class="panel-sub">' + esc(m.quand || '') + '</div></div></div>' +
          '<div class="modele-objet">Objet : ' + esc(m.objet(exemple)) + '</div>' +
          '<textarea class="field-area" readonly style="min-height:280px;font-size:.86rem;line-height:1.75;">' + esc(m.texte(exemple)) + '</textarea>' +
        '</div>';
      }).join('') +
      '<div class="panel">' +
        '<div class="panel-title">Ce que dit la <em>loi</em></div>' +
        '<div style="font-size:.9rem;color:var(--bone);line-height:1.8;margin-top:1rem;">' +
          '<p>La prospection entre professionnels est autorisée en France sans accord préalable, à trois conditions : le message concerne leur activité professionnelle, votre identité est claire, et un moyen de refuser figure dans le message.</p>' +
          '<p style="margin-top:.8rem;">Le pied de page de chaque courriel porte la mention d\'opposition. <b style="color:var(--paper);">Une agence qui répond « STOP » doit être marquée en opposition immédiatement</b> — le bouton est sur sa fiche, et la console lui interdit alors tout nouvel envoi.</p>' +
        '</div>' +
      '</div>';
  }

  function brancherModeles() {}

  /* ═══════════════════════════════════════════════════════════
     Vue : script d'appel et objections
     ═══════════════════════════════════════════════════════════ */
  function vPlaybook() {
    return '<div class="panel" style="margin-bottom:1.4rem;">' +
        '<div class="panel-title">Les cinq <em>questions</em> du brief</div>' +
        '<div class="panel-sub">À savoir réciter</div>' +
        '<p class="panel-note">C\'est tout ce que l\'agence a besoin de demander à la famille. Trois minutes, et vous avez de quoi composer.</p>' +
        '<ol style="color:var(--bone);font-size:.95rem;line-height:2;padding-left:1.2rem;">' +
          (V.BRIEF || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') +
        '</ol>' +
      '</div>' +

      '<div class="panel" style="margin-bottom:1.4rem;">' +
        '<div class="panel-title">Le <em>script</em> d\'appel</div>' +
        '<div class="panel-sub">Neuf temps, de la préparation au raccroché</div>' +
        '<p class="panel-note">Des points de passage, pas un texte à réciter. Vous vous en écartez dès que vous avez trouvé votre voix.</p>' +
        (V.SCRIPT || []).map(function (e, i) {
          return '<div class="etape">' +
            '<div class="etape-tete">' +
              '<span class="etape-num">' + (i + 1) + '</span>' +
              '<span class="etape-titre">' + esc(e.titre) + '</span>' +
              (e.duree ? '<span class="etape-duree">' + esc(e.duree) + '</span>' : '') +
            '</div>' +
            (e.dire ? '<blockquote class="etape-dire">' + esc(e.dire) + '</blockquote>' : '') +
            (e.points ? '<ul class="etape-points">' + e.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '') +
            (e.note ? '<p class="etape-note">' + esc(e.note) + '</p>' : '') +
          '</div>';
        }).join('') +
      '</div>' +

      '<div class="panel">' +
        '<div class="panel-title">Les <em>objections</em></div>' +
        '<div class="panel-sub">Douze objections</div>' +
        '<p class="panel-note">Ce qu\'elles cachent vraiment, la réponse, et la question qui vous rend la main. On ne gagne jamais une objection en argumentant plus fort : on la gagne en reprenant la parole.</p>' +
        (V.OBJECTIONS || []).map(function (o, i) {
          return '<div class="obj">' +
            '<button class="obj-q" data-obj="' + i + '" aria-expanded="false">' +
              '<span>« ' + esc(o.objection) + ' »</span>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="obj-r" hidden>' +
              '<p class="obj-cache"><b>Ce que ça cache —</b> ' + esc(o.cache) + '</p>' +
              '<p class="obj-rep">' + esc(o.reponse) + '</p>' +
              '<p class="obj-relance"><b>Puis vous rendez la main :</b><br>« ' + esc(o.relance) + ' »</p>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
  }

  function brancherPlaybook() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-obj]'), function (b) {
      b.addEventListener('click', function () {
        var r = b.nextElementSibling;
        var ouvert = !r.hidden;
        r.hidden = ouvert;
        b.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
        b.classList.toggle('ouvert', !ouvert);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     Vue : plan de prospection
     ═══════════════════════════════════════════════════════════ */
  function vPlan() {
    var P = V.PLAN || {};
    return '<div class="panel" style="margin-bottom:1.4rem;">' +
        '<div class="panel-title">Qui <em>démarcher</em>, dans quel ordre</div>' +
        '<div class="panel-sub">Par ordre de priorité</div>' +
        '<p class="panel-note">Toutes les agences ne se valent pas. Commencez par celles qui peuvent dire oui pendant l\'appel.</p>' +
        (P.cibles || []).map(function (c) {
          return '<div class="cible">' +
            '<div class="cible-tete"><span class="cible-titre">' + esc(c.titre) + '</span>' +
            '<span class="pill">' + esc(c.priorite) + '</span></div>' +
            '<p class="cible-pourquoi">' + esc(c.pourquoi) + '</p>' +
          '</div>';
        }).join('') +
      '</div>' +

      '<div class="grid-2" style="gap:1.2rem;align-items:start;">' +
        '<div class="panel">' +
          '<div class="panel-title">La <em>séquence</em></div>' +
          '<div class="panel-sub" style="margin-bottom:1rem;">Six temps, puis on laisse tranquille</div>' +
          (P.sequence || []).map(function (e) {
            return '<div style="display:flex;gap:.9rem;padding:.55rem 0;border-bottom:1px solid var(--line-soft);">' +
              '<b style="color:var(--or-patina);min-width:64px;font-family:var(--ff-m);font-size:.68rem;letter-spacing:.1em;">' + esc(e.jour) + '</b>' +
              '<span style="font-size:.9rem;"><b style="color:var(--paper);">' + esc(e.action) + '</b><br>' +
              '<span style="color:var(--ash);font-size:.85rem;line-height:1.6;">' + esc(e.detail) + '</span></span></div>';
          }).join('') +
        '</div>' +

        '<div class="panel">' +
          '<div class="panel-title">Le <em>rythme</em></div>' +
          '<div class="panel-sub">Le rythme de la semaine</div>' +
          '<p class="panel-note">Ce qui fait la différence n\'est pas le talent, c\'est la régularité.</p>' +
          '<ul style="color:var(--bone);font-size:.9rem;line-height:1.9;padding-left:1.1rem;">' +
            (P.rythme || []).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') +
          '</ul>' +
        '</div>' +

        '<div class="panel">' +
          '<div class="panel-title">Les <em>signaux</em> d\'achat</div>' +
          '<div class="panel-sub">Ce qu\'il faut entendre</div>' +
          '<p class="panel-note">Quand l\'une de ces phrases tombe, arrêtez d\'argumenter et proposez la composition offerte.</p>' +
          '<ul style="color:var(--bone);font-size:.9rem;line-height:1.9;padding-left:1.1rem;">' +
            (P.signaux || []).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') +
          '</ul>' +
        '</div>' +

        '<div class="panel">' +
          '<div class="panel-title">Ce qu\'il ne faut <em>pas faire</em></div>' +
          '<div class="panel-sub">Les erreurs qui coûtent cher</div>' +
          '<p class="panel-note">Chacune de ces erreurs coûte un partenaire, parfois définitivement.</p>' +
          '<ul style="color:var(--bone);font-size:.9rem;line-height:1.9;padding-left:1.1rem;">' +
            (P.interdits || []).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') +
          '</ul>' +
        '</div>' +
      '</div>';
  }

  /* ═══════════════════════════════════════════════════════════
     Vue : les traditions religieuses
     Se tromper de rite au téléphone ferme une porte pour de bon.
     ═══════════════════════════════════════════════════════════ */
  function vTraditions() {
    return '<div class="panel" style="margin-bottom:1.4rem;">' +
        '<div class="panel-title">Avant de <em>décrocher</em></div>' +
        '<div class="panel-sub">Six traditions, six façons de faire</div>' +
        '<p class="panel-note">Une communauté religieuse ne cherche pas une marge : elle garde un rite, et parfois finance des œuvres. ' +
          'Le premier message doit prouver qu\'on connaît sa tradition — sinon il ne sera pas lu deux fois. ' +
          'Et là où la musique n\'a pas sa place, le dire franchement est ce qui fait revenir les gens.</p>' +
        '<p class="panel-note" style="color:var(--or-patina);">La page publique <a href="rites.html" target="_blank" rel="noopener" style="color:var(--or);">L\'hommage selon le rite</a> dit tout cela publiquement. Envoyez-la : elle fait la moitié du travail.</p>' +
      '</div>' +

      (V.TRADITIONS || []).map(function (t) {
        return '<div class="panel trad">' +
          '<div class="trad-tete">' +
            '<span class="trad-nom">' + esc(t.nom) + '</span>' +
            '<span class="pill">' + esc(t.tenue) + '</span>' +
          '</div>' +
          '<div class="trad-bloc"><span class="trad-label">Ce que vous pouvez dire</span>' +
            '<p>' + esc(t.dire) + '</p></div>' +
          '<div class="trad-bloc trad-eviter"><span class="trad-label">À ne surtout pas dire</span>' +
            '<p>' + esc(t.eviter) + '</p></div>' +
          '<div class="trad-cible"><span class="mono">Qui démarcher</span> ' + esc(t.cible) + '</div>' +
        '</div>';
      }).join('') +

      '<div class="panel" style="margin-top:1.4rem;">' +
        '<div class="panel-title">Leurs <em>objections</em></div>' +
        '<div class="panel-sub">Cinq réponses propres aux communautés</div>' +
        '<p class="panel-note">Elles ne ressemblent pas à celles des agences : ici on ne parle pas de marge, on parle de rite et d\'œuvres.</p>' +
        (V.OBJECTIONS_CULTE || []).map(function (o, i) {
          return '<div class="obj">' +
            '<button class="obj-q" data-obj="c' + i + '" aria-expanded="false">' +
              '<span>« ' + esc(o.objection) + ' »</span>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="obj-r" hidden>' +
              '<p class="obj-cache"><b>Ce que ça cache —</b> ' + esc(o.cache) + '</p>' +
              '<p class="obj-rep">' + esc(o.reponse) + '</p>' +
              '<p class="obj-relance"><b>Puis vous rendez la main :</b><br>« ' + esc(o.relance) + ' »</p>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +

      '<div class="panel" style="margin-top:1.4rem;">' +
        '<div class="panel-title">Le <em>reversement</em></div>' +
        '<div class="panel-sub">À manier avec précaution</div>' +
        '<p class="panel-note">Une association cultuelle relevant de la loi de 1905 a un objet limité à l\'exercice du culte. ' +
          'Selon le statut de votre interlocuteur, la part qui lui revient prend la forme d\'un don, d\'une convention de ' +
          'partenariat, ou passe par une association d\'entraide adossée à la sienne. ' +
          '<b style="color:var(--paper);">Ne promettez jamais une forme juridique au téléphone</b> : dites que nous en parlons ' +
          'avec leur trésorier, et faites remonter la fiche au fondateur.</p>' +
      '</div>';
  }

  function brancherTraditions() { brancherPlaybook(); }

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
    var m = $('mode-badge');
    if (m) m.textContent = EST_MAITRE ? 'Vue fondateur' : 'Collaborateur';
    await charger();
    go('accueil');
  })();
})();
