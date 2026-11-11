/*!
 * julie-csv.js — Console Julie v2 · CSV import 2.0.
 *
 * Upload ou collage → détection du séparateur → mapping des colonnes (auto-détecté
 * par le wasm `csv_detecter_colonnes`) → prévisualisation 5 lignes → normalisation
 * (email, tel, site, domaine) → rapport de dédoublonnage (nouveaux / doublons /
 * conflits / invalides) → enrichissement SIRENE via /api/prospects → inscription
 * facultative dans une séquence.
 *
 * Tout le calcul lourd (parsing, normalisation de similarité, détection des
 * domaines) passe par `MelodiaJulieWasm`. Le réseau n'est appelé que pour la
 * recherche SIRENE d'enrichissement.
 *
 * Dépend de : window.MelodiaJulie, window.MelodiaProspects, window.MelodiaJulieSequences.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J) return;

  var CHAMPS = [
    ['nom', 'Nom / raison sociale'],
    ['email', 'Courriel'],
    ['tel', 'Téléphone'],
    ['site', 'Site web'],
    ['ville', 'Ville'],
    ['cp', 'Code postal'],
    ['siret', 'SIRET'],
    ['dirigeant', 'Dirigeant'],
    ['type', 'Type (funeraire, marbrier, crematorium, culte)'],
    ['adresse', 'Adresse'],
    ['departement', 'Département'],
    ['effectif', 'Effectif']
  ];

  var etat = {
    brut: '',
    parsing: null,       // { entetes, lignes, separateur }
    mapping: {},         // { enteteOrigine: 'nom' | 'email' | … }
    normalisees: [],     // [{ siret, nom, email, … }]
    rapport: null,       // { nouveaux, doublons, conflits, invalides }
    inserer: 0,          // choix d'action séquence
    sequence: '',
    chargement: false
  };

  function esc(s) { return J.esc(s); }

  function normaliserEmail(s) {
    return String(s || '').trim().toLowerCase();
  }

  function normaliserTel(s) {
    var d = String(s || '').replace(/[^\d+]/g, '');
    if (d.startsWith('+33')) d = '0' + d.slice(3);
    if (d.startsWith('0033')) d = '0' + d.slice(4);
    return d;
  }

  function normaliserSite(s) {
    var v = String(s || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    return v.replace(/\/+$/, '');
  }

  function normaliserType(s) {
    return J.normaliseType(s);
  }

  // ─── Vue ─────────────────────────────────────────────────────────────
  function vueHTML() {
    if (!etat.parsing) return etape1HTML();
    if (!etat.rapport) return etape2HTML();
    return etape3HTML();
  }

  function etape1HTML() {
    return '' +
      '<div class="jv2 jv2-csv">' +
        '<div class="panel">' +
          '<div class="panel-title">Importer un <em>CSV</em></div>' +
          '<div class="panel-sub">Collez le contenu ou déposez un fichier. Séparateur ; , ou tabulation, BOM accepté.</div>' +
          '<div class="field">' +
            '<label class="field-label">Fichier CSV</label>' +
            '<input class="field-input" type="file" accept=".csv,text/csv" data-act="fichier">' +
          '</div>' +
          '<div class="field">' +
            '<label class="field-label">… ou collez ici</label>' +
            '<textarea class="field-area" rows="8" data-champ="brut" placeholder="nom;email;ville&#10;Martin;contact@martin.fr;Lyon"></textarea>' +
          '</div>' +
          '<button type="button" class="btn" data-act="analyser">Analyser</button>' +
        '</div>' +
      '</div>';
  }

  function etape2HTML() {
    var p = etat.parsing;
    var rowsEntetes = p.entetes.map(function (h) {
      var mapping = etat.mapping[h] || '';
      return '' +
        '<tr>' +
          '<td>' + esc(h) + '</td>' +
          '<td>' +
            '<select class="field-select" data-entete="' + esc(h) + '">' +
              '<option value="">(ignorer)</option>' +
              CHAMPS.map(function (c) {
                return '<option value="' + c[0] + '"' + (mapping === c[0] ? ' selected' : '') + '>' + esc(c[1]) + '</option>';
              }).join('') +
            '</select>' +
          '</td>' +
        '</tr>';
    }).join('');
    var apercu = p.lignes.slice(0, 5).map(function (l) {
      return '<tr>' + p.entetes.map(function (h, i) {
        return '<td>' + esc(l[i] || '') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '' +
      '<div class="jv2 jv2-csv">' +
        '<div class="panel">' +
          '<div class="panel-title">Colonnes <em>détectées</em> <span class="jv2-badge">' + p.lignes.length + ' ligne' + (p.lignes.length > 1 ? 's' : '') + ' · sep « ' + esc(p.separateur) + ' »</span></div>' +
          '<table class="tbl jv2-csv-mapping"><thead><tr><th>Colonne source</th><th>Champ Melodia</th></tr></thead><tbody>' +
            rowsEntetes +
          '</tbody></table>' +
          '<div class="panel-sub">Aperçu (5 premières lignes) :</div>' +
          '<div class="jv2-csv-apercu"><table class="tbl"><thead><tr>' +
            p.entetes.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' + apercu + '</tbody></table></div>' +
          '<div class="jv2-csv-actions">' +
            '<button type="button" class="btn btn-outline" data-act="retour">Retour</button>' +
            '<button type="button" class="btn" data-act="normaliser">Normaliser et dédoublonner</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function etape3HTML() {
    var r = etat.rapport;
    var seqs = window.MelodiaJulieSequences ? window.MelodiaJulieSequences.lireSequences() : [];
    return '' +
      '<div class="jv2 jv2-csv">' +
        '<div class="panel">' +
          '<div class="panel-title">Rapport de <em>dédoublonnage</em></div>' +
          '<div class="jv2-csv-rapport">' +
            rapportBloc('Nouveaux', r.nouveaux.length, 'ok') +
            rapportBloc('Doublons fusionnés', r.doublons.length, 'note') +
            rapportBloc('Conflits', r.conflits.length, 'warn') +
            rapportBloc('Invalides', r.invalides.length, 'err') +
          '</div>' +
          detailListeHTML('Nouveaux', r.nouveaux, 8) +
          detailListeHTML('Conflits', r.conflits, 5) +
          detailListeHTML('Invalides', r.invalides, 5) +
          '<div class="jv2-csv-enrichir">' +
            '<button type="button" class="btn btn-outline" data-act="enrichir">Enrichir les SIRET manquants (SIRENE)</button>' +
            '<span class="jv2-csv-note" data-etat="enrichir-note"></span>' +
          '</div>' +
          '<div class="jv2-csv-sequence">' +
            '<label class="field-label">Inscrire les nouveaux dans une séquence ?</label>' +
            '<select class="field-select" data-champ="sequence">' +
              '<option value="">Ne pas inscrire</option>' +
              seqs.map(function (s) {
                return '<option value="' + esc(s.id) + '">' + esc(s.nom) + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div class="jv2-csv-actions">' +
            '<button type="button" class="btn btn-outline" data-act="retour">Retour</button>' +
            '<button type="button" class="btn" data-act="enregistrer">Enregistrer les nouveaux</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function rapportBloc(label, n, classe) {
    return '<div class="jv2-csv-bloc jv2-csv-' + classe + '">' +
      '<div class="jv2-csv-n mono">' + n + '</div>' +
      '<div class="jv2-csv-l">' + esc(label) + '</div>' +
    '</div>';
  }

  function detailListeHTML(label, liste, limite) {
    if (!liste.length) return '';
    var rows = liste.slice(0, limite).map(function (x) {
      return '<li><span class="jv2-csv-nom">' + esc(x.nom || '(sans nom)') + '</span>' +
        '<span class="jv2-csv-detail">' + esc(x.raison || '') + '</span></li>';
    }).join('');
    return '<details class="jv2-csv-detail-bloc"><summary>' + esc(label) + ' (' + liste.length + ')</summary><ul>' + rows + '</ul></details>';
  }

  // ─── Étapes ──────────────────────────────────────────────────────────
  async function analyser(texte) {
    etat.brut = texte || etat.brut;
    if (!etat.brut.trim()) {
      if (window.melodiaToast) window.melodiaToast('Collez un CSV ou choisissez un fichier.');
      return;
    }
    var parsed = await J.csvParser(etat.brut);
    if (!parsed || !parsed.entetes || !parsed.entetes.length) {
      if (window.melodiaToast) window.melodiaToast('Impossible de lire le CSV.');
      return;
    }
    etat.parsing = parsed;
    // Auto-mapping
    var det = await J.csvDetecterColonnes(parsed.entetes);
    etat.mapping = det && det.mapping ? det.mapping : {};
    etat.rapport = null;
    rendre();
  }

  async function normaliserEtDedoublonner() {
    var p = etat.parsing;
    if (!p) return;
    var prospects = [];
    try {
      if (window.MelodiaProspects && typeof window.MelodiaProspects.mine === 'function') {
        prospects = await Promise.resolve(window.MelodiaProspects.mine());
      }
    } catch (_) { prospects = []; }
    if (!Array.isArray(prospects)) prospects = [];

    // Index locaux pour dedupe
    var parSiret = {};
    var parEmail = {};
    var parNomCp = {};
    for (var i = 0; i < prospects.length; i++) {
      var np = J.normaliseProspect(prospects[i]);
      if (np.siret) parSiret[np.siret] = np;
      if (np.email) parEmail[np.email.toLowerCase()] = np;
      if (np.nom) parNomCp[(np.nom.toLowerCase() + '|' + np.cp)] = np;
    }

    var nouveaux = [];
    var doublons = [];
    var conflits = [];
    var invalides = [];

    for (var ligne = 0; ligne < p.lignes.length; ligne++) {
      var l = p.lignes[ligne];
      var o = {};
      Object.keys(etat.mapping).forEach(function (h) {
        var champ = etat.mapping[h];
        if (!champ) return;
        var idx = p.entetes.indexOf(h);
        if (idx < 0) return;
        o[champ] = (l[idx] || '').trim();
      });
      o.email = normaliserEmail(o.email);
      o.tel = normaliserTel(o.tel);
      o.site = normaliserSite(o.site);
      o.type = normaliserType(o.type);
      o.siret = String(o.siret || '').replace(/\D/g, '');
      if (!o.nom && !o.email) {
        invalides.push({ nom: o.nom || '', raison: 'Nom et courriel manquants' });
        continue;
      }
      if (!o.email) {
        // Adresse probable si site fourni
        if (o.site) {
          try {
            var u = new URL(o.site);
            var host = u.hostname.replace(/^www\./, '');
            o.email = 'contact@' + host;
            o.email_probable = true;
          } catch (_) { /* ignore */ }
        }
      }

      // Dedupe : siret > email > nom+cp avec similarité
      var cle = await J.dedupeCle({ siret: o.siret, email: o.email, nom: o.nom || '', cp: o.cp || '' });
      if (cle && cle.siret && parSiret[cle.siret]) {
        doublons.push({ nom: o.nom || '', raison: 'SIRET déjà suivi' });
        continue;
      }
      if (cle && cle.email && parEmail[cle.email]) {
        doublons.push({ nom: o.nom || '', raison: 'Courriel déjà suivi' });
        continue;
      }
      if (cle && cle.nom_cp && parNomCp[cle.nom_cp]) {
        doublons.push({ nom: o.nom || '', raison: 'Nom + CP identiques' });
        continue;
      }

      // Similarité floue contre les existants (nom proche)
      if (o.nom) {
        var proche = null;
        for (var k = 0; k < prospects.length; k++) {
          var ex = J.normaliseProspect(prospects[k]);
          if (!ex.nom) continue;
          var sim = await J.similarite(o.nom, ex.nom);
          if (sim && sim.score >= 0.92) { proche = ex; break; }
        }
        if (proche) {
          conflits.push({ nom: o.nom, raison: 'Similaire à « ' + (proche.nom || '') + ' »' });
          continue;
        }
      }

      // Vérifie aussi les doublons internes au CSV
      if (parEmail[o.email.toLowerCase()]) {
        conflits.push({ nom: o.nom || '', raison: 'Doublon interne au CSV' });
        continue;
      }
      parEmail[o.email.toLowerCase()] = o;
      if (o.siret) parSiret[o.siret] = o;
      if (o.nom && o.cp) parNomCp[(o.nom.toLowerCase() + '|' + o.cp)] = o;
      nouveaux.push(o);
    }

    etat.rapport = { nouveaux, doublons, conflits, invalides };
    rendre();
  }

  async function enrichirSirene() {
    if (!etat.rapport) return;
    var sansSiret = etat.rapport.nouveaux.filter(function (p) { return !p.siret && p.nom; });
    if (!sansSiret.length) {
      if (window.melodiaToast) window.melodiaToast('Aucun SIRET à enrichir.');
      return;
    }
    var note = document.querySelector('[data-etat="enrichir-note"]');
    if (note) note.textContent = 'Recherche SIRENE…';
    var reussis = 0;
    for (var i = 0; i < Math.min(sansSiret.length, 10); i++) {
      var p = sansSiret[i];
      try {
        var q = new URLSearchParams({ q: p.nom, departement: (p.cp || '').slice(0, 2) });
        var res = await fetch('/api/prospects?' + q.toString(), { credentials: 'same-origin' });
        if (!res.ok) continue;
        var data = await res.json();
        var premier = (data && data.results && data.results[0]) || null;
        if (!premier) continue;
        p.siret = premier.siret || premier.siren || p.siret;
        p.dirigeant = premier.dirigeant || p.dirigeant;
        p.effectif = premier.effectif || p.effectif;
        if (!p.email && premier.site) p.site = normaliserSite(premier.site);
        reussis++;
      } catch (_) { /* silencieux */ }
    }
    if (note) note.textContent = reussis + '/' + sansSiret.length + ' enrichi' + (reussis > 1 ? 's' : '') + '.';
  }

  async function enregistrer() {
    if (!etat.rapport) return;
    var nouveaux = etat.rapport.nouveaux;
    if (!nouveaux.length) {
      if (window.melodiaToast) window.melodiaToast('Aucun nouveau prospect à enregistrer.');
      return;
    }
    var faits = 0;
    for (var i = 0; i < nouveaux.length; i++) {
      var p = nouveaux[i];
      var objet = {
        siret: p.siret || ('csv-' + Date.now() + '-' + i),
        nom: p.nom || p.email || '',
        type: p.type || 'funeraire',
        email: p.email || '',
        tel: p.tel || '',
        site: p.site || '',
        ville: p.ville || '',
        cp: p.cp || '',
        departement: p.departement || (p.cp ? String(p.cp).slice(0, 2) : ''),
        dirigeant: p.dirigeant || '',
        effectif: p.effectif || '',
        statut: 'nouveau',
        journal: [{ le: new Date().toISOString(), quoi: 'import', detail: 'CSV 2.0', par: 'local' }],
        source: 'csv',
        email_probable: !!p.email_probable
      };
      try {
        if (window.MelodiaProspects && typeof window.MelodiaProspects.enregistrer === 'function') {
          await window.MelodiaProspects.enregistrer(objet);
          faits++;
        }
      } catch (_) { /* silencieux */ }
    }

    // Inscription séquence (optionnelle)
    var seqId = etat.sequence;
    if (seqId && window.MelodiaJulieSequences) {
      try {
        var mod = window.MelodiaJulieSequences;
        // On utilise l'API indirecte via rendre/brancher si besoin ; ici on inscrit directement
        var sequences = mod.lireSequences ? mod.lireSequences() : [];
        var seq = sequences.find(function (s) { return s.id === seqId; });
        if (seq) {
          // Réutilise l'inscription standard en réutilisant la vue
          // (le module s'occupe de gérer le stockage local et la sync)
          var inscriptions = mod.lireInscriptions ? mod.lireInscriptions() : [];
          nouveaux.forEach(function (p) {
            var deja = inscriptions.some(function (x) { return x.sequence_id === seqId && x.prospect_siret === p.siret && x.statut === 'active'; });
            if (deja) return;
            inscriptions.push({
              sequence_id: seqId,
              prospect_siret: p.siret,
              etape: 0,
              prochaine_le: J.isoParis(new Date()),
              statut: 'active',
              debut_iso: J.isoParis(new Date())
            });
          });
          if (mod.brancher) mod.brancher(); // no-op sinon
          // écriture via cache
          J.ecrireCache('melodia.julie.inscriptions.v1', inscriptions);
        }
      } catch (_) { /* silencieux */ }
    }

    if (window.melodiaToast) window.melodiaToast(faits + ' prospect' + (faits > 1 ? 's' : '') + ' enregistré' + (faits > 1 ? 's' : '') + '.');
    // Réinitialise pour permettre un nouvel import
    etat.brut = '';
    etat.parsing = null;
    etat.mapping = {};
    etat.rapport = null;
    rendre();
  }

  // ─── Rendu & bindings ────────────────────────────────────────────────
  function rendre() {
    var cible = document.querySelector('[data-julie-vue="csv"]');
    if (!cible) return;
    cible.innerHTML = vueHTML();
    brancher(cible);
  }

  function brancher(cible) {
    cible.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      var act = t.dataset.act;
      if (act === 'analyser') {
        var ta = cible.querySelector('[data-champ="brut"]');
        return analyser(ta && ta.value);
      }
      if (act === 'retour') {
        if (etat.rapport) etat.rapport = null;
        else etat.parsing = null;
        return rendre();
      }
      if (act === 'normaliser') {
        return normaliserEtDedoublonner();
      }
      if (act === 'enrichir') {
        return enrichirSirene();
      }
      if (act === 'enregistrer') {
        return enregistrer();
      }
    });

    cible.querySelectorAll('[data-entete]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        etat.mapping[sel.dataset.entete] = sel.value;
      });
    });

    cible.querySelectorAll('[data-champ="sequence"]').forEach(function (sel) {
      sel.addEventListener('change', function () { etat.sequence = sel.value; });
    });

    var f = cible.querySelector('input[type="file"]');
    if (f) {
      f.addEventListener('change', function () {
        var file = f.files && f.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var texte = String(reader.result || '');
          var ta = cible.querySelector('[data-champ="brut"]');
          if (ta) ta.value = texte;
          analyser(texte);
        };
        reader.readAsText(file, 'UTF-8');
      });
    }
  }

  window.MelodiaJulieCsv = {
    vue: function () { return '<div data-julie-vue="csv"><div class="jv2 jv2-chargement">Chargement…</div></div>'; },
    brancher: function () { rendre(); },
    rendre: rendre,
    analyser: analyser
  };
})();
