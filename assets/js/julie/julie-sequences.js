/*!
 * julie-sequences.js — Console Julie v2 · vue « Séquences ».
 *
 * Permet de cloner, éditer, activer une séquence et d'y inscrire des prospects.
 * Par défaut, une séquence « Premier contact » (3 étapes J0/J+3/J+7) est créée.
 *
 * Fallback sans migration 09 : les inscriptions sont stockées dans
 * `prospects.journal` (quoi:'sequence', detail:JSON) et dans localStorage.
 *
 * Dépend de : window.MelodiaJulie, window.MelodiaProspects, window.MelodiaJulieWasm.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var J = window.MelodiaJulie;
  if (!J) return;

  var CLE_SEQ = 'melodia.julie.sequences.v1';
  var CLE_INSCR = 'melodia.julie.inscriptions.v1';

  var SEQ_DEFAUT = {
    id: 'seq-premier-contact',
    nom: 'Premier contact',
    cible: 'funeraire',
    actif: true,
    etapes: [
      { jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: ['professionnels'] },
      { jour: 3, modele: 'pf-relance-j4', canal: 'mail', brochures: [] },
      { jour: 7, modele: 'pf-relance-j10', canal: 'mail', brochures: [] }
    ]
  };

  var etat = {
    sequences: [],
    inscriptions: [],
    chargement: false,
    edition: null
  };

  function esc(s) { return J.esc(s); }

  function lireSequences() {
    var local = J.lireCache(CLE_SEQ, null);
    if (Array.isArray(local) && local.length) return local;
    return [SEQ_DEFAUT];
  }

  function ecrireSequences(liste) {
    J.ecrireCache(CLE_SEQ, liste);
  }

  function lireInscriptions() {
    return J.lireCache(CLE_INSCR, []);
  }

  function ecrireInscriptions(liste) {
    J.ecrireCache(CLE_INSCR, liste);
  }

  // ─── Vue ─────────────────────────────────────────────────────────────
  function vueHTML() {
    var rows = etat.sequences.map(function (s) {
      var inscriptions = etat.inscriptions.filter(function (i) { return i.sequence_id === s.id && i.statut === 'active'; });
      return '' +
        '<li class="jv2-seq-ligne" data-seq="' + esc(s.id) + '">' +
          '<div class="jv2-seq-titre">' + esc(s.nom) + '</div>' +
          '<div class="jv2-seq-meta">' + esc(s.cible) + ' · ' + s.etapes.length + ' étapes · ' + inscriptions.length + ' inscrit' + (inscriptions.length > 1 ? 's' : '') + ' actif' + (inscriptions.length > 1 ? 's' : '') + '</div>' +
          '<div class="jv2-seq-actions">' +
            '<button type="button" class="btn btn-sm btn-outline" data-act="editer">Éditer</button>' +
            '<button type="button" class="btn btn-sm" data-act="inscrire">Inscrire</button>' +
          '</div>' +
        '</li>';
    }).join('');
    return '' +
      '<div class="jv2 jv2-sequences">' +
        '<div class="jv2-seq-entete">' +
          '<div class="jv2-seq-note">Séquences semi-automatiques : les étapes dues apparaissent dans « Ma journée ». Rien n’est envoyé sans votre clic.</div>' +
          '<button type="button" class="btn" data-act="creer">Nouvelle séquence</button>' +
        '</div>' +
        '<ul class="jv2-seq-liste">' + (rows || '<li class="jv2-vide">Aucune séquence.</li>') + '</ul>' +
        (etat.edition ? editeurHTML() : '') +
      '</div>';
  }

  function editeurHTML() {
    var s = etat.edition;
    var etapes = s.etapes.map(function (e, i) {
      return '' +
        '<li class="jv2-etape" data-index="' + i + '">' +
          '<label>J+<input type="number" min="0" max="60" value="' + e.jour + '" data-champ="jour"></label>' +
          '<select data-champ="modele">' +
            ['pf-premier-contact', 'pf-relance-j4', 'pf-relance-j10', 'pf-apres-appel', 'pf-partenariat', 'pf-brochure', 'pf-merci'].map(function (m) {
              return '<option value="' + m + '"' + (e.modele === m ? ' selected' : '') + '>' + m + '</option>';
            }).join('') +
          '</select>' +
          '<select data-champ="canal">' +
            '<option value="mail"' + (e.canal === 'mail' ? ' selected' : '') + '>mail</option>' +
            '<option value="appel"' + (e.canal === 'appel' ? ' selected' : '') + '>appel</option>' +
          '</select>' +
          '<button type="button" class="btn btn-sm btn-outline" data-act="supprimer-etape">×</button>' +
        '</li>';
    }).join('');
    return '' +
      '<div class="jv2-seq-editeur panel">' +
        '<div class="panel-title">Éditer « ' + esc(s.nom) + ' »</div>' +
        '<div class="field"><label class="field-label">Nom</label><input class="field-input" data-champ="nom" value="' + esc(s.nom) + '"></div>' +
        '<div class="field"><label class="field-label">Cible</label>' +
          '<select class="field-select" data-champ="cible">' +
            ['funeraire', 'crematorium', 'marbrier', 'culte'].map(function (t) {
              return '<option value="' + t + '"' + (s.cible === t ? ' selected' : '') + '>' + t + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<ul class="jv2-etapes">' + etapes + '</ul>' +
        '<button type="button" class="btn btn-sm btn-outline" data-act="ajouter-etape">Ajouter une étape</button>' +
        '<div class="jv2-seq-editeur-pied">' +
          '<button type="button" class="btn btn-outline" data-act="annuler">Annuler</button>' +
          '<button type="button" class="btn" data-act="sauver">Sauver</button>' +
        '</div>' +
      '</div>';
  }

  // ─── Chargement ──────────────────────────────────────────────────────
  function chargerLocal() {
    etat.sequences = lireSequences();
    etat.inscriptions = lireInscriptions();
  }

  // Tente de synchroniser avec Supabase si la migration 09 est appliquée.
  async function chargerServeur() {
    if (!window.MelodiaDB) return;
    var dispo = await J.consoleV2Dispo();
    if (!dispo) return;
    try {
      var supabase = window.MelodiaDB.sb && window.MelodiaDB.sb();
      if (!supabase) return;
      var seq = await supabase.from('sequences').select('*');
      if (seq.data && seq.data.length) {
        etat.sequences = seq.data.map(function (r) {
          return { id: String(r.id), nom: r.nom, cible: r.cible, actif: r.actif, etapes: r.etapes || [] };
        });
      }
      var insc = await supabase.from('sequence_inscriptions').select('*').eq('statut', 'active');
      if (insc.data) {
        etat.inscriptions = insc.data.map(function (r) {
          return { sequence_id: String(r.sequence_id), prospect_siret: r.prospect_siret, etape: r.etape, prochaine_le: r.prochaine_le, statut: r.statut };
        });
      }
    } catch (_) { /* fallback local */ }
  }

  async function rendre() {
    var cible = document.querySelector('[data-julie-vue="sequences"]');
    if (!cible) return;
    if (etat.chargement) return;
    etat.chargement = true;
    cible.innerHTML = '<div class="jv2 jv2-chargement">Chargement…</div>';
    try {
      chargerLocal();
      await chargerServeur();
      cible.innerHTML = vueHTML();
      brancher(cible);
    } finally {
      etat.chargement = false;
    }
  }

  // ─── Bindings ────────────────────────────────────────────────────────
  function brancher(cible) {
    cible.addEventListener('click', async function (ev) {
      var t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      var act = t.dataset.act;

      if (act === 'creer') {
        etat.edition = { id: 'seq-' + Date.now(), nom: 'Nouvelle séquence', cible: 'funeraire', actif: true, etapes: [{ jour: 0, modele: 'pf-premier-contact', canal: 'mail', brochures: [] }] };
        return rendre();
      }
      if (act === 'editer') {
        var id = t.closest('.jv2-seq-ligne').dataset.seq;
        etat.edition = JSON.parse(JSON.stringify(etat.sequences.find(function (s) { return s.id === id; })));
        return rendre();
      }
      if (act === 'inscrire') {
        var sid = t.closest('.jv2-seq-ligne').dataset.seq;
        return inscrire(sid);
      }
      if (act === 'ajouter-etape') {
        etat.edition.etapes.push({ jour: 14, modele: 'pf-relance-j10', canal: 'mail', brochures: [] });
        return rendre();
      }
      if (act === 'supprimer-etape') {
        var idx = Number(t.closest('.jv2-etape').dataset.index);
        etat.edition.etapes.splice(idx, 1);
        return rendre();
      }
      if (act === 'annuler') {
        etat.edition = null;
        return rendre();
      }
      if (act === 'sauver') {
        return sauver();
      }
    });

    cible.querySelectorAll('[data-champ]').forEach(function (el) {
      el.addEventListener('change', function () {
        if (!etat.edition) return;
        var champ = el.dataset.champ;
        var etape = el.closest('.jv2-etape');
        if (etape) {
          var idx = Number(etape.dataset.index);
          var e = etat.edition.etapes[idx];
          if (champ === 'jour') e.jour = Number(el.value) || 0;
          if (champ === 'modele') e.modele = el.value;
          if (champ === 'canal') e.canal = el.value;
        } else {
          if (champ === 'nom') etat.edition.nom = el.value;
          if (champ === 'cible') etat.edition.cible = el.value;
        }
      });
    });
  }

  async function sauver() {
    var s = etat.edition;
    if (!s) return;
    var idx = etat.sequences.findIndex(function (x) { return x.id === s.id; });
    if (idx >= 0) etat.sequences[idx] = s;
    else etat.sequences.push(s);
    ecrireSequences(etat.sequences);
    // Sync serveur si dispo
    if (await J.consoleV2Dispo() && window.MelodiaDB) {
      try {
        var supabase = window.MelodiaDB.sb && window.MelodiaDB.sb();
        if (supabase) {
          await supabase.from('sequences').upsert({
            id: isNaN(Number(s.id)) ? undefined : Number(s.id),
            nom: s.nom, cible: s.cible, actif: s.actif, etapes: s.etapes
          });
        }
      } catch (_) { /* local only */ }
    }
    etat.edition = null;
    if (window.melodiaToast) window.melodiaToast('Séquence sauvegardée.');
    rendre();
  }

  async function inscrire(sequenceId) {
    var seq = etat.sequences.find(function (s) { return s.id === sequenceId; });
    if (!seq) return;
    var prospects = [];
    try {
      if (window.MelodiaProspects && typeof window.MelodiaProspects.mine === 'function') {
        prospects = await Promise.resolve(window.MelodiaProspects.mine());
      }
    } catch (_) { prospects = []; }
    var cibles = (prospects || []).filter(function (p) {
      var n = J.normaliseProspect(p);
      return n.statut === 'nouveau' && !n.oppose && !n.rejete && !!n.email && (n.type === seq.cible || !seq.cible);
    });
    if (!cibles.length) {
      if (window.melodiaToast) window.melodiaToast('Aucun prospect éligible (' + seq.cible + ', statut « À contacter »).');
      return;
    }
    var limite = Math.min(cibles.length, 10);
    var compte = 0;
    for (var i = 0; i < limite; i++) {
      var p = cibles[i];
      var inscription = {
        sequence_id: sequenceId,
        prospect_siret: p.siret,
        etape: 0,
        prochaine_le: J.isoParis(new Date()),
        statut: 'active',
        debut_iso: J.isoParis(new Date())
      };
      // Évite le doublon
      var deja = etat.inscriptions.some(function (x) { return x.sequence_id === sequenceId && x.prospect_siret === p.siret && x.statut === 'active'; });
      if (deja) continue;
      etat.inscriptions.push(inscription);
      compte++;
      try {
        if (window.MelodiaProspects && typeof window.MelodiaProspects.noter === 'function') {
          await window.MelodiaProspects.noter(p.siret, 'sequence', JSON.stringify({ sequence_id: sequenceId, etape: 0 }));
        }
      } catch (_) { /* local */ }
    }
    ecrireInscriptions(etat.inscriptions);
    if (window.melodiaToast) window.melodiaToast(compte + ' prospect' + (compte > 1 ? 's' : '') + ' inscrit' + (compte > 1 ? 's' : '') + '.');
    rendre();
  }

  /**
   * Sortie d'une séquence (appelée depuis pipeline.js ou journee.js).
   * Met à jour l'inscription locale et, si migration 09 dispo, la ligne serveur.
   */
  async function sortir(siret, motif) {
    var modifie = false;
    etat.inscriptions.forEach(function (i) {
      if (i.prospect_siret === siret && i.statut === 'active') {
        i.statut = 'sortie';
        i.motif_sortie = motif || '';
        modifie = true;
      }
    });
    if (modifie) ecrireInscriptions(etat.inscriptions);
    if (await J.consoleV2Dispo() && window.MelodiaDB) {
      try {
        var supabase = window.MelodiaDB.sb && window.MelodiaDB.sb();
        if (supabase) {
          await supabase.from('sequence_inscriptions').update({
            statut: 'sortie', motif_sortie: motif || '', updated_at: new Date().toISOString()
          }).eq('prospect_siret', siret).eq('statut', 'active');
        }
      } catch (_) { /* local */ }
    }
  }

  window.MelodiaJulieSequences = {
    vue: function () { return '<div data-julie-vue="sequences"><div class="jv2 jv2-chargement">Chargement…</div></div>'; },
    brancher: function () { rendre(); },
    rendre: rendre,
    sortir: sortir,
    lireSequences: lireSequences,
    lireInscriptions: lireInscriptions
  };
})();
