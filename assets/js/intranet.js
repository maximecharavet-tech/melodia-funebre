/* ═══════════════════════════════════════════════════════════════
   MELODIA — L'intranet de la maison
   Agenda · Messagerie · Réseaux sociaux · Catalogue classé

   Ces quatre outils servent les deux consoles, celle du fondateur et
   celle des collaborateurs, avec le même code : ce qui change entre
   les deux, ce sont les droits, et ils sont tenus par la base, pas
   par le navigateur. Une console qui cacherait un bouton sans que la
   règle RLS l'interdise ne protégerait rien.

   Les trois premiers vivent en base (tables agenda, messages,
   publications) : deux personnes sur deux appareils doivent voir la
   même chose. Le quatrième lit le catalogue publié.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REST = window.MelodiaRest || null;
  var enLigne = function () { return !!(REST && REST.actif); };

  function moi() {
    var u = window.MelodiaAuth && window.MelodiaAuth.current();
    return u || { email: '', name: '', role: '' };
  }
  function estMaitre() { return moi().role === 'master'; }

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function uid(p) { return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ─── Dates ───
     Tout est manipulé en ISO et affiché en français. Les bornes de
     journée se calculent en heure locale : un rendez-vous de 23 h
     rangé dans la veille par un décalage UTC serait manqué. */
  function iso(d) { return new Date(d).toISOString(); }
  function jourCle(d) {
    var x = new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function debutJour(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function ajouteJours(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }

  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
              'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function dateLongue(d) {
    var x = new Date(d);
    return JOURS[x.getDay()] + ' ' + x.getDate() + ' ' + MOIS[x.getMonth()];
  }
  function heure(d) {
    var x = new Date(d);
    return String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0');
  }
  /* « aujourd'hui » et « demain » se lisent plus vite qu'une date : ce
     sont les deux seuls jours sur lesquels on agit vraiment. */
  function quand(d) {
    var j = jourCle(d), a = jourCle(new Date());
    if (j === a) return "aujourd'hui";
    if (j === jourCle(ajouteJours(new Date(), 1))) return 'demain';
    if (j === jourCle(ajouteJours(new Date(), -1))) return 'hier';
    return dateLongue(d);
  }
  /* Valeur d'un <input type="datetime-local"> : heure locale, sans zone. */
  function pourChamp(d) {
    var x = new Date(d), p = function (n) { return String(n).padStart(2, '0'); };
    return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()) +
           'T' + p(x.getHours()) + ':' + p(x.getMinutes());
  }

  /* ═══ Couche données ═══ */

  var TYPES = {
    rdv: { l: 'Rendez-vous', c: 'or' },
    appel: { l: 'Appel', c: 'cyan' },
    ceremonie: { l: 'Cérémonie', c: 'violet' },
    composition: { l: 'Composition', c: 'green' },
    relance: { l: 'Relance', c: 'amber' },
    autre: { l: 'Autre', c: 'silver-dim' }
  };
  var RESEAUX = {
    instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
    linkedin: 'LinkedIn', youtube: 'YouTube', x: 'X'
  };
  var ETATS_PUB = {
    idee: { l: 'Idée', c: 'silver-dim' },
    brouillon: { l: 'Brouillon', c: 'amber' },
    planifie: { l: 'Planifié', c: 'cyan' },
    publie: { l: 'Publié', c: 'green' }
  };

  var Agenda = {
    async liste(depuis, jusqua) {
      if (!enLigne()) return [];
      var q = '/rest/v1/agenda?select=*&order=debut.asc';
      if (depuis) q += '&debut=gte.' + encodeURIComponent(iso(depuis));
      if (jusqua) q += '&debut=lte.' + encodeURIComponent(iso(jusqua));
      return (await REST.appel(q)) || [];
    },
    async creer(o) {
      var u = moi();
      var rec = {
        id: uid('rdv'), titre: o.titre || '', type: o.type || 'rdv',
        debut: iso(o.debut), fin: o.fin ? iso(o.fin) : null,
        lieu: o.lieu || '', notes: o.notes || '',
        assigne: o.assigne || '', assigne_nom: o.assigne_nom || '',
        ref: o.ref || '', contact: o.contact || '', tel: o.tel || '',
        statut: 'prevu', cree_par: u.email
      };
      var r = await REST.appel('/rest/v1/agenda', {
        method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rec)
      });
      return (r && r[0]) || rec;
    },
    async modifier(id, champs) {
      await REST.appel('/rest/v1/agenda?id=eq.' + encodeURIComponent(id), {
        method: 'PATCH', body: JSON.stringify(champs)
      });
    },
    async supprimer(id) {
      await REST.appel('/rest/v1/agenda?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
    }
  };

  var Messages = {
    /* Le fil réunit deux adresses triées : la conversation reste la
       même quel que soit celui qui a écrit en premier. */
    fil: function (a, b) { return [a, b].map(function (x) { return (x || '').toLowerCase(); }).sort().join('|'); },

    async tous() {
      if (!enLigne()) return [];
      return (await REST.appel('/rest/v1/messages?select=*&order=created_at.asc')) || [];
    },
    async duFil(fil) {
      if (!enLigne()) return [];
      return (await REST.appel('/rest/v1/messages?select=*&fil=eq.' +
        encodeURIComponent(fil) + '&order=created_at.asc')) || [];
    },
    async envoyer(destinataire, corps) {
      var u = moi();
      var rec = {
        id: uid('msg'), fil: this.fil(u.email, destinataire),
        expediteur: u.email, expediteur_nom: u.name || '',
        destinataire: destinataire, corps: corps, lu: false
      };
      var r = await REST.appel('/rest/v1/messages', {
        method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rec)
      });
      return (r && r[0]) || rec;
    },
    /* Marquer lu ne concerne que ce qu'on a reçu : la règle de la base
       le vérifie aussi, ceci n'est que l'appel correspondant. */
    async marquerLus(fil) {
      var u = moi();
      if (!enLigne() || !u.email) return;
      await REST.appel('/rest/v1/messages?fil=eq.' + encodeURIComponent(fil) +
        '&destinataire=eq.' + encodeURIComponent(u.email) + '&lu=is.false', {
        method: 'PATCH', body: JSON.stringify({ lu: true })
      });
    },
    async nonLus() {
      var u = moi();
      if (!enLigne() || !u.email) return 0;
      try {
        var r = await REST.appel('/rest/v1/messages?select=id&lu=is.false&destinataire=eq.' +
          encodeURIComponent(u.email));
        return (r || []).length;
      } catch (e) { return 0; }
    }
  };

  var Publications = {
    async liste() {
      if (!enLigne()) return [];
      return (await REST.appel('/rest/v1/publications?select=*&order=created_at.desc')) || [];
    },
    async creer(o) {
      var u = moi();
      var rec = {
        id: uid('pub'), reseau: o.reseau || 'instagram', statut: o.statut || 'idee',
        titre: o.titre || '', texte: o.texte || '', hashtags: o.hashtags || '',
        media: o.media || '', hommage: o.hommage || '',
        publier_le: o.publier_le ? iso(o.publier_le) : null,
        lien: o.lien || '', cree_par: u.email
      };
      var r = await REST.appel('/rest/v1/publications', {
        method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rec)
      });
      return (r && r[0]) || rec;
    },
    async modifier(id, champs) {
      await REST.appel('/rest/v1/publications?id=eq.' + encodeURIComponent(id), {
        method: 'PATCH', body: JSON.stringify(champs)
      });
    },
    async supprimer(id) {
      await REST.appel('/rest/v1/publications?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
    }
  };

  /* ─── Collaborateurs, pour l'assignation et la messagerie ─── */
  async function equipe() {
    if (!enLigne()) return [];
    try {
      var l = await REST.appel('/rest/v1/collaborateurs?select=email,nom,name,role,actif&order=nom.asc');
      return (l || []).filter(function (c) { return c.actif !== false; })
        .map(function (c) { return { email: c.email, nom: c.nom || c.name || c.email, role: c.role }; });
    } catch (e) { return []; }
  }

  /* ─── Panneau d'attente et d'erreur, commun aux quatre vues ─── */
  function attente(hote, quoi) {
    hote.innerHTML = '<div class="status-live" style="display:inline-flex;">Chargement ' + esc(quoi) + '…</div>';
  }
  function panne(hote, e) {
    hote.innerHTML = '<div class="form-msg err" style="display:block;">' +
      'Base injoignable : ' + esc(e && e.message ? e.message : 'erreur réseau') + '.<br>' +
      'Ces outils travaillent en base — ils ont besoin du réseau, contrairement au mode propriétaire.</div>';
  }
  function horsLigne(hote, quoi) {
    hote.innerHTML = '<div class="form-msg err" style="display:block;">' +
      esc(quoi) + ' a besoin de la base de données, qui n\'est pas configurée sur cette installation.</div>';
  }

  window.MelodiaIntranet = {
    Agenda: Agenda, Messages: Messages, Publications: Publications,
    equipe: equipe, TYPES: TYPES, RESEAUX: RESEAUX, ETATS_PUB: ETATS_PUB,
    _outils: { esc: esc, uid: uid, moi: moi, estMaitre: estMaitre, enLigne: enLigne,
               $: $, iso: iso, jourCle: jourCle, debutJour: debutJour, ajouteJours: ajouteJours,
               dateLongue: dateLongue, heure: heure, quand: quand, pourChamp: pourChamp,
               attente: attente, panne: panne, horsLigne: horsLigne },
    vues: {}
  };
})();

/* ═══════════════════════════════════════════════════════════════
   VUE — L'AGENDA

   Pas de grille mensuelle : une maison funéraire n'a pas besoin de
   voir un mois, elle a besoin de voir ce qui est en retard, puis ce
   qui vient, jour par jour. Le retard passe donc en tête, séparé —
   noyé dans l'ordre chronologique, il se manque.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var I = window.MelodiaIntranet, O = I._outils;
  var esc = O.esc;

  var etat = { rdv: [], equipe: [], hote: null, filtre: 'tous', edite: null, jours: 21 };

  function pastilleType(t) {
    var d = I.TYPES[t] || I.TYPES.autre;
    return '<span class="pill" style="border-color:var(--' + d.c + ');color:var(--' + d.c + ');">' +
           esc(d.l) + '</span>';
  }

  function ligne(r, enRetard) {
    var fini = r.statut === 'fait', annule = r.statut === 'annule';
    var style = annule ? 'opacity:.45;' : (fini ? 'opacity:.6;' : '');
    var detail = (enRetard ? '<span style="color:var(--red);">' + esc(O.quand(r.debut)) + ' · </span>' : '') +
      O.heure(r.debut) + (r.fin ? '–' + O.heure(r.fin) : '') +
      (r.lieu ? ' · ' + esc(r.lieu) : '') +
      (r.contact ? ' · ' + esc(r.contact) : '') +
      (r.tel ? ' · <a href="tel:' + esc(r.tel) + '" style="color:var(--or);">' + esc(r.tel) + '</a>' : '') +
      (r.ref ? ' · <span style="color:var(--or);">' + esc(r.ref) + '</span>' : '') +
      (r.assigne_nom || r.assigne ? ' · ' + esc(r.assigne_nom || r.assigne) : '');
    return '<div class="own-row" style="' + style + '">' +
      '<div class="own-item" style="flex:1;min-width:0;">' +
        '<div class="own-name"' + (annule ? ' style="text-decoration:line-through;"' : '') + '>' +
          esc(r.titre || 'Sans titre') + '</div>' +
        '<div class="own-detail">' + detail + '</div>' +
        (r.notes ? '<div class="own-detail" style="color:var(--dust);">' + esc(r.notes) + '</div>' : '') +
      '</div>' +
      '<div class="own-acts" style="gap:.4rem;flex-wrap:wrap;">' + pastilleType(r.type) +
        (r.calcule
          /* Rien à cocher : cette ligne disparaîtra d'elle-même quand la
             commande avancera. La toucher ici ne voudrait rien dire. */
          ? '<span class="pill" style="border-color:var(--line-soft);color:var(--dust);">Suit la commande</span>'
          : (annule ? '' : '<button class="btn btn-outline btn-sm" data-fait="' + esc(r.id) + '">' +
              (fini ? 'Rouvrir' : 'Fait') + '</button>') +
            '<button class="btn btn-ghost btn-sm" data-edit="' + esc(r.id) + '">Modifier</button>') +
      '</div></div>';
  }

  function retenus() {
    var m = O.moi();
    return etat.rdv.filter(function (r) {
      if (etat.filtre === 'moi') return r.assigne === m.email || r.cree_par === m.email;
      if (etat.filtre === 'ouverts') return r.statut === 'prevu';
      return true;
    });
  }

  function formulaire(r) {
    r = r || {};
    var neuf = !r.id;
    var opts = Object.keys(I.TYPES).map(function (t) {
      return '<option value="' + t + '"' + (r.type === t ? ' selected' : '') + '>' + esc(I.TYPES[t].l) + '</option>';
    }).join('');
    var gens = '<option value="">La maison (personne en particulier)</option>' +
      etat.equipe.map(function (c) {
        return '<option value="' + esc(c.email) + '"' + (r.assigne === c.email ? ' selected' : '') + '>' +
               esc(c.nom) + '</option>';
      }).join('');
    var debut = r.debut ? O.pourChamp(r.debut) : O.pourChamp(new Date(Date.now() + 3600000));
    return '<div class="panel" style="margin-top:1rem;border-color:var(--line-strong);">' +
      '<div class="panel-title">' + (neuf ? 'Nouveau <em>rendez-vous</em>' : 'Modifier le <em>rendez-vous</em>') + '</div>' +
      '<div class="own-form" style="margin-top:1.2rem;">' +
      '<div class="field"><label class="field-label" for="ag-titre">Intitulé *</label>' +
        '<input class="field-input" id="ag-titre" value="' + esc(r.titre || '') + '" placeholder="Entretien avec la famille Bernard"></div>' +
      '<div class="field-row">' +
        '<div class="field"><label class="field-label" for="ag-type">Nature</label>' +
          '<select class="field-select" id="ag-type">' + opts + '</select></div>' +
        '<div class="field"><label class="field-label" for="ag-statut">État</label>' +
          '<select class="field-select" id="ag-statut">' +
          ['prevu', 'fait', 'annule'].map(function (s) {
            var l = { prevu: 'Prévu', fait: 'Fait', annule: 'Annulé' }[s];
            return '<option value="' + s + '"' + (r.statut === s ? ' selected' : '') + '>' + l + '</option>';
          }).join('') + '</select></div>' +
      '</div>' +
      '<div class="field-row">' +
        '<div class="field"><label class="field-label" for="ag-debut">Début *</label>' +
          '<input class="field-input" id="ag-debut" type="datetime-local" value="' + debut + '"></div>' +
        '<div class="field"><label class="field-label" for="ag-fin">Fin</label>' +
          '<input class="field-input" id="ag-fin" type="datetime-local" value="' + (r.fin ? O.pourChamp(r.fin) : '') + '"></div>' +
      '</div>' +
      '<div class="field"><label class="field-label" for="ag-assigne">Qui s\'en charge</label>' +
        '<select class="field-select" id="ag-assigne">' + gens + '</select>' +
        '<div class="field-hint">Un collaborateur ne voit dans son agenda que ce qui lui est assigné, ce qu\'il a créé, et ce qui n\'est confié à personne.</div></div>' +
      '<div class="field-row">' +
        '<div class="field"><label class="field-label" for="ag-contact">Contact</label>' +
          '<input class="field-input" id="ag-contact" value="' + esc(r.contact || '') + '" placeholder="Claire B., fille de Maurice"></div>' +
        '<div class="field"><label class="field-label" for="ag-tel">Téléphone</label>' +
          '<input class="field-input" id="ag-tel" type="tel" value="' + esc(r.tel || '') + '" placeholder="06 …"></div>' +
      '</div>' +
      '<div class="field-row">' +
        '<div class="field"><label class="field-label" for="ag-lieu">Lieu</label>' +
          '<input class="field-input" id="ag-lieu" value="' + esc(r.lieu || '') + '" placeholder="Par téléphone, ou une adresse"></div>' +
        '<div class="field"><label class="field-label" for="ag-ref">Commande liée</label>' +
          '<input class="field-input" id="ag-ref" value="' + esc(r.ref || '') + '" placeholder="MEL-…"></div>' +
      '</div>' +
      '<div class="field"><label class="field-label" for="ag-notes">Notes</label>' +
        '<textarea class="field-area" id="ag-notes" placeholder="Ce qu\'il faut avoir en tête avant d\'appeler.">' + esc(r.notes || '') + '</textarea></div>' +
      '<div class="form-msg" id="ag-msg"></div>' +
      '<div style="display:flex;gap:.8rem;flex-wrap:wrap;">' +
        '<button class="btn btn-gold" id="ag-ok">' + (neuf ? 'Créer' : 'Enregistrer') + '</button>' +
        '<button class="btn btn-ghost" id="ag-annuler">Annuler</button>' +
        (neuf || !O.estMaitre() ? '' : '<button class="btn btn-ghost" id="ag-suppr" style="color:var(--red);margin-left:auto;">Supprimer</button>') +
      '</div></div></div>';
  }

  function rendre() {
    var hote = etat.hote, liste = retenus();
    var debutAuj = O.debutJour(new Date());
    var retard = liste.filter(function (r) { return r.statut === 'prevu' && new Date(r.debut) < debutAuj; });
    var aVenir = liste.filter(function (r) { return new Date(r.debut) >= debutAuj; });

    var parJour = {};
    aVenir.forEach(function (r) { var k = O.jourCle(r.debut); (parJour[k] = parJour[k] || []).push(r); });

    var h = '<div class="panel"><div class="panel-head">' +
      '<div><div class="panel-title">L\'<em>agenda</em></div>' +
      '<div class="panel-sub">' + liste.length + ' entrée(s) · ' + etat.jours + ' jours à venir</div></div>' +
      '<div style="display:flex;gap:.5rem;flex-wrap:wrap;">' +
      ['tous', 'ouverts', 'moi'].map(function (f) {
        var lib = { tous: 'Tout', ouverts: 'À faire', moi: 'Les miens' }[f];
        return '<button class="btn btn-' + (etat.filtre === f ? 'gold' : 'outline') +
               ' btn-sm" data-filtre="' + f + '">' + lib + '</button>';
      }).join('') +
      '<button class="btn btn-gold btn-sm" id="ag-neuf">+ Rendez-vous</button>' +
      '</div></div><div id="ag-form"></div>';

    if (retard.length) {
      h += '<div class="form-msg err" style="display:block;margin:1.2rem 0 .6rem;"><b>' + retard.length +
        ' en retard</b> — la date est passée et rien n\'a été coché.</div>' +
        '<div class="own-list">' + retard.map(function (r) { return ligne(r, true); }).join('') + '</div>';
    }

    var cles = Object.keys(parJour).sort();
    if (!cles.length && !retard.length) {
      h += '<p style="color:var(--ash);margin-top:1.4rem;line-height:1.8;">Rien de prévu. ' +
        'Le bouton « + Rendez-vous » ouvre la fiche de saisie — entretien avec une famille, ' +
        'rappel d\'agence, cérémonie, ou simple relance à ne pas oublier.</p>';
    }
    cles.forEach(function (k) {
      var jour = parJour[k][0].debut;
      h += '<div class="panel-sub" style="margin:1.6rem 0 .6rem;color:var(--or);">' +
        esc(O.quand(jour)) + ' <span style="color:var(--dust);">· ' + esc(O.dateLongue(jour)) + '</span></div>' +
        '<div class="own-list">' + parJour[k].map(function (r) { return ligne(r, false); }).join('') + '</div>';
    });

    h += '</div>';
    hote.innerHTML = h;
    brancher();
  }

  function brancher() {
    var hote = etat.hote;
    hote.querySelectorAll('[data-filtre]').forEach(function (b) {
      b.addEventListener('click', function () { etat.filtre = b.dataset.filtre; rendre(); });
    });
    var neuf = hote.querySelector('#ag-neuf');
    if (neuf) neuf.addEventListener('click', function () { ouvrirForm(null); });

    hote.querySelectorAll('[data-edit]').forEach(function (b) {
      b.addEventListener('click', function () {
        ouvrirForm(etat.rdv.filter(function (r) { return r.id === b.dataset.edit; })[0]);
      });
    });
    hote.querySelectorAll('[data-fait]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var r = etat.rdv.filter(function (x) { return x.id === b.dataset.fait; })[0];
        if (!r) return;
        b.disabled = true;
        try {
          var neufStatut = r.statut === 'fait' ? 'prevu' : 'fait';
          await I.Agenda.modifier(r.id, { statut: neufStatut });
          r.statut = neufStatut;
          rendre();
        } catch (e) { b.disabled = false; if (window.melodiaToast) window.melodiaToast('Refusé : ' + e.message); }
      });
    });
  }

  function ouvrirForm(r) {
    etat.edite = r || null;
    var zone = etat.hote.querySelector('#ag-form');
    zone.innerHTML = formulaire(r);
    zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    var msg = zone.querySelector('#ag-msg');
    var dire = function (t, ok) {
      msg.className = 'form-msg' + (t ? (ok ? ' ok' : ' err') : '');
      msg.textContent = t || '';
    };
    zone.querySelector('#ag-annuler').addEventListener('click', function () { zone.innerHTML = ''; });

    var suppr = zone.querySelector('#ag-suppr');
    if (suppr) suppr.addEventListener('click', async function () {
      if (!confirm('Supprimer définitivement ce rendez-vous ?')) return;
      try {
        await I.Agenda.supprimer(r.id);
        etat.rdv = etat.rdv.filter(function (x) { return x.id !== r.id; });
        rendre();
      } catch (e) { dire('Suppression refusée : ' + e.message); }
    });

    zone.querySelector('#ag-ok').addEventListener('click', async function () {
      var v = function (id) { var e = zone.querySelector('#' + id); return e ? e.value.trim() : ''; };
      var titre = v('ag-titre'), debut = v('ag-debut');
      if (!titre) return dire('Donnez un intitulé : c\'est ce qu\'on lira dans la liste.');
      if (!debut) return dire('Une date de début est nécessaire.');
      var fin = v('ag-fin');
      /* Une fin antérieure au début produirait un créneau négatif,
         affiché « 15:00–09:00 » sans que rien ne le signale. */
      if (fin && new Date(fin) <= new Date(debut)) return dire('La fin doit venir après le début.');

      var sel = zone.querySelector('#ag-assigne');
      var champs = {
        titre: titre, type: v('ag-type'), debut: O.iso(debut), fin: fin ? O.iso(fin) : null,
        lieu: v('ag-lieu'), notes: v('ag-notes'), ref: v('ag-ref'),
        contact: v('ag-contact'), tel: v('ag-tel'), statut: v('ag-statut'),
        assigne: sel.value,
        assigne_nom: sel.value ? sel.options[sel.selectedIndex].textContent : ''
      };
      var b = zone.querySelector('#ag-ok'); b.disabled = true; b.textContent = 'Enregistrement…';
      try {
        if (r && r.id) {
          await I.Agenda.modifier(r.id, champs);
          Object.keys(champs).forEach(function (k) { r[k] = champs[k]; });
        } else {
          etat.rdv.push(await I.Agenda.creer(champs));
        }
        etat.rdv.sort(function (a, c) { return new Date(a.debut) - new Date(c.debut); });
        rendre();
      } catch (e) {
        b.disabled = false; b.textContent = r && r.id ? 'Enregistrer' : 'Créer';
        dire('Refusé par la base : ' + e.message);
      }
    });
  }

  /* ─── Ce que les commandes imposent ───
     Une commande reçue appelle un rappel, et toute commande non livrée
     a une échéance. Plutôt que de recopier ces rendez-vous dans
     l'agenda — deux vérités qui finiraient par diverger — on les
     calcule à l'affichage. Ils ne sont pas modifiables : ce sont des
     faits, pas des notes. */
  function depuisCommandes(cmds) {
    var out = [];
    (cmds || []).forEach(function (c) {
      if (c.status === 'livree') return;
      if (c.status === 'recue') {
        /* Le rappel est dû sous deux heures ouvrées, une en urgence. */
        var quand = new Date(new Date(c.created_at).getTime() + (c.urgence ? 1 : 2) * 3600000);
        out.push({
          id: 'cmd-appel-' + c.ref, calcule: true, type: 'appel',
          titre: 'Appeler la famille — ' + (c.defunt || c.ref),
          debut: quand.toISOString(), fin: null,
          lieu: 'Par téléphone', contact: c.user_name || '', tel: c.tel || '',
          ref: c.ref, assigne: c.assigne || '', assigne_nom: '',
          notes: (c.urgence ? 'Urgence. ' : '') + 'Entretien de cinq minutes : le délai ne court qu\'après.',
          statut: 'prevu', cree_par: ''
        });
      }
      if (c.echeance) {
        out.push({
          id: 'cmd-fin-' + c.ref, calcule: true, type: 'composition',
          titre: 'Livrer l\'hommage — ' + (c.defunt || c.ref),
          debut: c.echeance, fin: null, lieu: '', contact: c.user_name || '', tel: '',
          ref: c.ref, assigne: c.assigne || '', assigne_nom: '',
          notes: c.offer + (c.urgence ? ' · urgence six heures' : ''),
          statut: 'prevu', cree_par: ''
        });
      }
    });
    return out;
  }

  I.vues.agenda = async function (hote) {
    etat.hote = hote;
    if (!O.enLigne()) return O.horsLigne(hote, 'L\'agenda');
    O.attente(hote, 'de l\'agenda');
    try {
      var depuis = O.ajouteJours(O.debutJour(new Date()), -60);
      var jusqua = O.ajouteJours(new Date(), etat.jours);
      var cmds = [];
      try { cmds = await window.MelodiaDB.all(); } catch (e) { cmds = []; }
      var r = await Promise.all([I.Agenda.liste(depuis, jusqua), I.equipe()]);
      etat.rdv = r[0].concat(depuisCommandes(cmds));
      etat.rdv.sort(function (a, b) { return new Date(a.debut) - new Date(b.debut); });
      etat.equipe = r[1];
      rendre();
    } catch (e) { O.panne(hote, e); }
  };
})();

/* ═══════════════════════════════════════════════════════════════
   VUE — LA MESSAGERIE INTRANET

   Une liste de correspondants à gauche, la conversation à droite.
   La règle de la base ne laisse lire à chacun que ses propres fils :
   le fondateur compris. Un message entre deux collaborateurs ne
   remonte pas à la direction, et ce n'est pas l'écran qui le décide.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var I = window.MelodiaIntranet, O = I._outils;
  var esc = O.esc;

  var etat = { hote: null, messages: [], equipe: [], actif: null };

  /* Les correspondants possibles : toute la maison, sauf soi-même. */
  function correspondants() {
    var m = O.moi();
    var gens = etat.equipe.filter(function (c) { return c.email !== m.email; });
    /* Le fondateur n'est pas toujours dans la table des collaborateurs :
       sans cette ligne, un collaborateur n'aurait personne à qui écrire. */
    var mail = 'contact@melodia-funebre.fr';
    if (m.role !== 'master' && !gens.some(function (c) { return c.email === mail; })) {
      gens.unshift({ email: mail, nom: 'Maxime Charavet', role: 'master' });
    }
    return gens;
  }

  function filAvec(email) { return I.Messages.fil(O.moi().email, email); }

  function resume(email) {
    var f = filAvec(email);
    var m = O.moi();
    var fil = etat.messages.filter(function (x) { return x.fil === f; });
    var dernier = fil[fil.length - 1];
    var nonLus = fil.filter(function (x) { return x.destinataire === m.email && !x.lu; }).length;
    return { dernier: dernier, nonLus: nonLus, total: fil.length };
  }

  function listeGens() {
    var gens = correspondants();
    if (!gens.length) {
      return '<p style="color:var(--ash);line-height:1.8;">Aucun correspondant. ' +
        'Les collaborateurs apparaissent ici dès qu\'ils sont créés dans l\'onglet Collaborateurs.</p>';
    }
    return '<div class="own-list">' + gens.map(function (c) {
      var r = resume(c.email);
      var actif = etat.actif === c.email;
      return '<button type="button" class="own-row" data-qui="' + esc(c.email) + '" ' +
        'style="width:100%;text-align:left;cursor:pointer;background:' +
        (actif ? 'var(--or-soft)' : 'transparent') + ';border-left:2px solid ' +
        (actif ? 'var(--or)' : 'transparent') + ';">' +
        '<div class="own-item" style="flex:1;min-width:0;">' +
          '<div class="own-name">' + esc(c.nom) +
            (r.nonLus ? ' <span class="side-badge" style="position:static;display:inline-block;">' +
              r.nonLus + '</span>' : '') + '</div>' +
          '<div class="own-detail">' +
            (r.dernier
              ? esc((r.dernier.expediteur === O.moi().email ? 'Vous : ' : '') +
                    r.dernier.corps.slice(0, 60)) + (r.dernier.corps.length > 60 ? '…' : '')
              : '<span style="color:var(--dust);">Aucun message</span>') +
          '</div>' +
        '</div>' +
        (r.dernier ? '<div class="own-detail" style="color:var(--dust);white-space:nowrap;">' +
          esc(O.quand(r.dernier.created_at)) + '</div>' : '') +
        '</button>';
    }).join('') + '</div>';
  }

  function bulles() {
    if (!etat.actif) {
      return '<p style="color:var(--ash);line-height:1.8;">Choisissez un correspondant à gauche. ' +
        'Les échanges restent entre vous deux : la base ne laisse lire un fil qu\'à ses deux extrémités.</p>';
    }
    var f = filAvec(etat.actif), m = O.moi();
    var fil = etat.messages.filter(function (x) { return x.fil === f; });
    var qui = correspondants().filter(function (c) { return c.email === etat.actif; })[0] || { nom: etat.actif };

    var corps = fil.length ? fil.map(function (x) {
      var demoi = x.expediteur === m.email;
      return '<div style="display:flex;justify-content:' + (demoi ? 'flex-end' : 'flex-start') +
        ';margin-bottom:.7rem;">' +
        '<div style="max-width:min(78%,42ch);padding:.7rem .95rem;border-radius:10px;' +
          'background:' + (demoi ? 'var(--or-soft)' : 'var(--surface-2)') + ';' +
          'border:1px solid ' + (demoi ? 'var(--line-strong)' : 'var(--line-soft)') + ';">' +
          '<div style="font-size:.92rem;line-height:1.6;color:var(--paper);white-space:pre-wrap;">' +
            esc(x.corps) + '</div>' +
          '<div style="font-family:var(--ff-m);font-size:.6rem;letter-spacing:.1em;' +
            'text-transform:uppercase;color:var(--dust);margin-top:.4rem;">' +
            esc(O.quand(x.created_at)) + ' ' + O.heure(x.created_at) + '</div>' +
        '</div></div>';
    }).join('') : '<p style="color:var(--dust);text-align:center;padding:2rem 0;">Aucun message. Écrivez le premier.</p>';

    return '<div class="panel-sub" style="margin-bottom:1rem;color:var(--or);">' + esc(qui.nom) + '</div>' +
      '<div id="ms-fil" style="max-height:46vh;overflow-y:auto;padding-right:.3rem;margin-bottom:1rem;">' +
        corps + '</div>' +
      '<div class="field" style="margin-bottom:.6rem;">' +
        '<textarea class="field-area" id="ms-texte" rows="3" placeholder="Votre message…"></textarea></div>' +
      '<div class="form-msg" id="ms-msg"></div>' +
      '<div style="display:flex;gap:.8rem;align-items:center;flex-wrap:wrap;">' +
        '<button class="btn btn-gold btn-sm" id="ms-envoyer">Envoyer</button>' +
        '<span style="color:var(--dust);font-size:.8rem;">Entrée + Ctrl pour envoyer</span>' +
      '</div>';
  }

  function rendre() {
    var m = O.moi();
    var nonLus = etat.messages.filter(function (x) { return x.destinataire === m.email && !x.lu; }).length;
    etat.hote.innerHTML =
      '<div class="panel"><div class="panel-head"><div>' +
        '<div class="panel-title">La <em>messagerie</em></div>' +
        '<div class="panel-sub">Entre la maison et ses collaborateurs' +
          (nonLus ? ' · <span style="color:var(--or);">' + nonLus + ' non lu(s)</span>' : '') + '</div>' +
      '</div><button class="btn btn-outline btn-sm" id="ms-rafraichir">Rafraîchir</button></div>' +
      '<div class="grid-2" style="gap:1.4rem;align-items:start;margin-top:1.2rem;">' +
        '<div>' + listeGens() + '</div>' +
        '<div>' + bulles() + '</div>' +
      '</div></div>';
    brancher();
  }

  function brancher() {
    var hote = etat.hote;
    hote.querySelectorAll('[data-qui]').forEach(function (b) {
      b.addEventListener('click', async function () {
        etat.actif = b.dataset.qui;
        rendre();
        /* Ouvrir un fil vaut lecture : on le marque, puis on rafraîchit
           les pastilles sans rappeler la base pour rien. */
        try {
          await I.Messages.marquerLus(filAvec(etat.actif));
          var m = O.moi();
          etat.messages.forEach(function (x) {
            if (x.fil === filAvec(etat.actif) && x.destinataire === m.email) x.lu = true;
          });
          majBadge();
          rendre();
          descendre();
        } catch (e) { /* la lecture reste affichée même si la marque échoue */ }
      });
    });

    var raf = hote.querySelector('#ms-rafraichir');
    if (raf) raf.addEventListener('click', function () { I.vues.messagerie(hote); });

    var env = hote.querySelector('#ms-envoyer');
    if (env) env.addEventListener('click', envoyer);
    var zone = hote.querySelector('#ms-texte');
    if (zone) {
      zone.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); envoyer(); }
      });
      zone.focus();
    }
    descendre();
  }

  /* Un fil s'ouvre sur son dernier message, pas sur le premier. */
  function descendre() {
    var f = etat.hote.querySelector('#ms-fil');
    if (f) f.scrollTop = f.scrollHeight;
  }

  async function envoyer() {
    var hote = etat.hote;
    var zone = hote.querySelector('#ms-texte'), b = hote.querySelector('#ms-envoyer');
    var msg = hote.querySelector('#ms-msg');
    var texte = (zone.value || '').trim();
    if (!texte) return;
    b.disabled = true; b.textContent = 'Envoi…';
    try {
      var m = await I.Messages.envoyer(etat.actif, texte);
      etat.messages.push(m);
      zone.value = '';
      rendre();
    } catch (e) {
      b.disabled = false; b.textContent = 'Envoyer';
      msg.className = 'form-msg err';
      msg.textContent = 'Envoi refusé : ' + e.message +
        (/violates|policy/i.test(e.message) ? ' — ce destinataire n\'est pas un compte de la maison.' : '');
    }
  }

  /* La pastille de la barre latérale, si la console en a posé une. */
  async function majBadge() {
    var b = document.getElementById('badge-msg');
    if (!b) return;
    var n = await I.Messages.nonLus();
    b.textContent = n;
    b.style.display = n ? '' : 'none';
  }
  I.majBadgeMessages = majBadge;

  I.vues.messagerie = async function (hote) {
    etat.hote = hote;
    if (!O.enLigne()) return O.horsLigne(hote, 'La messagerie');
    O.attente(hote, 'des messages');
    try {
      var r = await Promise.all([I.Messages.tous(), I.equipe()]);
      etat.messages = r[0]; etat.equipe = r[1];
      if (!etat.actif) {
        var g = correspondants();
        if (g.length) etat.actif = g[0].email;
      }
      rendre();
      if (etat.actif) {
        await I.Messages.marquerLus(filAvec(etat.actif));
        var m = O.moi();
        etat.messages.forEach(function (x) {
          if (x.fil === filAvec(etat.actif) && x.destinataire === m.email) x.lu = true;
        });
        majBadge();
        rendre();
      }
    } catch (e) { O.panne(hote, e); }
  };
})();

/* ═══════════════════════════════════════════════════════════════
   VUE — RÉSEAUX SOCIAUX

   Un planificateur, pas un robot de publication. Publier
   automatiquement sur Instagram ou TikTok demande un compte
   professionnel, une application déclarée chez chaque plateforme et
   un jeton d'accès révisé par elle : rien de tout cela ne se
   fabrique depuis ce site. Ce que l'outil fait vraiment : garder les
   idées, préparer les textes, tenir un calendrier, et relever à la
   main ce que chaque publication a donné. L'écran le dit lui-même,
   plutôt que de laisser croire à un envoi automatique.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var I = window.MelodiaIntranet, O = I._outils;
  var esc = O.esc;

  var etat = { hote: null, pubs: [], hommages: [], filtre: 'tous', edite: null };

  function pastille(p) {
    var e = I.ETATS_PUB[p.statut] || I.ETATS_PUB.idee;
    return '<span class="pill" style="border-color:var(--' + e.c + ');color:var(--' + e.c + ');">' +
      esc(e.l) + '</span>';
  }

  /* Le nombre de caractères compte vraiment : au-delà, la plateforme
     tronque le texte au milieu d'une phrase. */
  var LIMITES = { instagram: 2200, facebook: 63206, tiktok: 2200, linkedin: 3000, youtube: 5000, x: 280 };

  function carte(p) {
    var limite = LIMITES[p.reseau] || 2200;
    var n = (p.texte || '').length + (p.hashtags ? p.hashtags.length + 1 : 0);
    var trop = n > limite;
    var oeuvre = etat.hommages.filter(function (h) { return h.id === p.hommage; })[0];
    return '<div class="own-row" data-pub="' + esc(p.id) + '">' +
      '<div class="own-item" style="flex:1;min-width:0;">' +
        '<div class="own-name">' + esc(p.titre || '(sans titre)') + '</div>' +
        '<div class="own-detail">' + esc(I.RESEAUX[p.reseau] || p.reseau) +
          (p.publier_le ? ' · ' + esc(O.quand(p.publier_le)) + ' ' + O.heure(p.publier_le) : ' · sans date') +
          (oeuvre ? ' · <span style="color:var(--or);">' + esc(oeuvre.who || oeuvre.title) + '</span>' : '') +
          ' · <span style="color:var(--' + (trop ? 'red' : 'dust') + ');">' + n + '/' + limite + ' car.</span>' +
        '</div>' +
        (p.texte ? '<div class="own-detail" style="color:var(--dust);">' +
          esc(p.texte.slice(0, 110)) + (p.texte.length > 110 ? '…' : '') + '</div>' : '') +
        (p.statut === 'publie' && (p.vues || p.reactions || p.partages)
          ? '<div class="own-detail" style="color:var(--green);">' +
            (p.vues || 0) + ' vues · ' + (p.reactions || 0) + ' réactions · ' + (p.partages || 0) + ' partages</div>'
          : '') +
      '</div>' +
      '<div class="own-acts" style="gap:.4rem;flex-wrap:wrap;">' + pastille(p) +
        '<button class="btn btn-outline btn-sm" data-copier="' + esc(p.id) + '">Copier</button>' +
        '<button class="btn btn-ghost btn-sm" data-modif="' + esc(p.id) + '">Modifier</button>' +
      '</div></div>';
  }

  function texteComplet(p) {
    return [p.texte || '', p.hashtags || ''].filter(Boolean).join('\n\n');
  }

  function formulaire(p) {
    p = p || {};
    var neuf = !p.id;
    var res = Object.keys(I.RESEAUX).map(function (r) {
      return '<option value="' + r + '"' + (p.reseau === r ? ' selected' : '') + '>' + esc(I.RESEAUX[r]) + '</option>';
    }).join('');
    var ets = Object.keys(I.ETATS_PUB).map(function (s) {
      return '<option value="' + s + '"' + (p.statut === s ? ' selected' : '') + '>' + esc(I.ETATS_PUB[s].l) + '</option>';
    }).join('');
    var oeuvres = '<option value="">Aucun</option>' + etat.hommages.map(function (h) {
      return '<option value="' + esc(h.id) + '"' + (p.hommage === h.id ? ' selected' : '') + '>' +
        esc((h.who || h.title) + ' — ' + (h.style || '')) + '</option>';
    }).join('');

    return '<div class="panel" style="margin-top:1rem;border-color:var(--line-strong);">' +
      '<div class="panel-title">' + (neuf ? 'Nouvelle <em>publication</em>' : 'Modifier la <em>publication</em>') + '</div>' +
      '<div class="own-form" style="margin-top:1.2rem;">' +
      '<div class="field-row">' +
        '<div class="field"><label class="field-label" for="pb-reseau">Réseau</label>' +
          '<select class="field-select" id="pb-reseau">' + res + '</select></div>' +
        '<div class="field"><label class="field-label" for="pb-statut">État</label>' +
          '<select class="field-select" id="pb-statut">' + ets + '</select></div>' +
      '</div>' +
      '<div class="field"><label class="field-label" for="pb-titre">Titre interne</label>' +
        '<input class="field-input" id="pb-titre" value="' + esc(p.titre || '') + '" placeholder="Extrait — Bernard, le roi de la route"></div>' +
      '<div class="field"><label class="field-label" for="pb-hommage">Hommage mis en avant</label>' +
        '<select class="field-select" id="pb-hommage">' + oeuvres + '</select>' +
        '<div class="field-hint">Ne publiez un hommage réel qu\'avec l\'accord écrit de la famille. C\'est un engagement pris dans la politique de confidentialité.</div></div>' +
      '<div class="field"><label class="field-label" for="pb-texte">Le texte</label>' +
        '<textarea class="field-area" id="pb-texte" rows="6" placeholder="Ce que voit la personne qui fait défiler.">' + esc(p.texte || '') + '</textarea>' +
        '<div class="field-hint" id="pb-compte"></div></div>' +
      '<div class="field"><label class="field-label" for="pb-hashtags">Mots-dièse</label>' +
        '<input class="field-input" id="pb-hashtags" value="' + esc(p.hashtags || '') + '" placeholder="#hommage #ceremonie #musiquepersonnalisee"></div>' +
      '<div class="field-row">' +
        '<div class="field"><label class="field-label" for="pb-quand">Publier le</label>' +
          '<input class="field-input" id="pb-quand" type="datetime-local" value="' + (p.publier_le ? O.pourChamp(p.publier_le) : '') + '"></div>' +
        '<div class="field"><label class="field-label" for="pb-media">Visuel ou extrait</label>' +
          '<input class="field-input" id="pb-media" value="' + esc(p.media || '') + '" placeholder="audio/bernard.mp3 ou un lien"></div>' +
      '</div>' +
      '<div class="field"><label class="field-label" for="pb-lien">Lien de la publication</label>' +
        '<input class="field-input" id="pb-lien" value="' + esc(p.lien || '') + '" placeholder="Collez ici l\'adresse du post une fois publié"></div>' +
      '<div class="field-row">' +
        '<div class="field"><label class="field-label" for="pb-vues">Vues</label>' +
          '<input class="field-input" id="pb-vues" type="number" value="' + (p.vues == null ? '' : p.vues) + '"></div>' +
        '<div class="field"><label class="field-label" for="pb-reac">Réactions</label>' +
          '<input class="field-input" id="pb-reac" type="number" value="' + (p.reactions == null ? '' : p.reactions) + '"></div>' +
        '<div class="field"><label class="field-label" for="pb-part">Partages</label>' +
          '<input class="field-input" id="pb-part" type="number" value="' + (p.partages == null ? '' : p.partages) + '"></div>' +
      '</div>' +
      '<div class="form-msg" id="pb-msg"></div>' +
      '<div style="display:flex;gap:.8rem;flex-wrap:wrap;">' +
        '<button class="btn btn-gold" id="pb-ok">' + (neuf ? 'Créer' : 'Enregistrer') + '</button>' +
        '<button class="btn btn-ghost" id="pb-annuler">Annuler</button>' +
        (neuf || !O.estMaitre() ? '' :
          '<button class="btn btn-ghost" id="pb-suppr" style="color:var(--red);margin-left:auto;">Supprimer</button>') +
      '</div></div></div>';
  }

  function rendre() {
    var liste = etat.filtre === 'tous' ? etat.pubs
      : etat.pubs.filter(function (p) { return p.statut === etat.filtre; });

    var compte = {};
    Object.keys(I.ETATS_PUB).forEach(function (s) {
      compte[s] = etat.pubs.filter(function (p) { return p.statut === s; }).length;
    });

    var h = '<div class="panel"><div class="panel-head"><div>' +
      '<div class="panel-title">Réseaux <em>sociaux</em></div>' +
      '<div class="panel-sub">' + etat.pubs.length + ' publication(s) au plan</div></div>' +
      '<button class="btn btn-gold btn-sm" id="pb-neuf">+ Publication</button></div>' +

      '<div class="form-msg" style="display:block;background:rgba(56,189,248,.08);' +
        'border-color:rgba(56,189,248,.3);color:var(--cyan);margin:1rem 0;">' +
        'Cet outil prépare et planifie ; il ne publie pas à votre place. ' +
        'L\'envoi automatique demande un compte professionnel et une application validée par chaque plateforme. ' +
        'Le bouton « Copier » met le texte dans le presse-papiers : vous le collez dans l\'application du réseau.</div>' +

      '<div class="kpi-grid" style="margin-bottom:1.2rem;">' +
        Object.keys(I.ETATS_PUB).map(function (s) {
          return '<div class="kpi"><div class="kpi-label">' + esc(I.ETATS_PUB[s].l) + '</div>' +
            '<div class="kpi-value" style="color:var(--' + I.ETATS_PUB[s].c + ');">' + compte[s] + '</div></div>';
        }).join('') +
      '</div>' +

      '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;">' +
        ['tous'].concat(Object.keys(I.ETATS_PUB)).map(function (f) {
          var lib = f === 'tous' ? 'Tout' : I.ETATS_PUB[f].l;
          return '<button class="btn btn-' + (etat.filtre === f ? 'gold' : 'outline') +
            ' btn-sm" data-fpub="' + f + '">' + esc(lib) + '</button>';
        }).join('') +
      '</div>' +

      '<div id="pb-form"></div>';

    h += liste.length
      ? '<div class="own-list">' + liste.map(carte).join('') + '</div>'
      : '<p style="color:var(--ash);line-height:1.8;">Rien dans cette colonne. ' +
        'Commencez par déposer les idées : un extrait d\'hommage, un témoignage de famille, ' +
        'une explication du service. Elles se transformeront en brouillons puis en publications.</p>';

    h += '</div>';
    etat.hote.innerHTML = h;
    brancher();
  }

  function brancher() {
    var hote = etat.hote;
    hote.querySelectorAll('[data-fpub]').forEach(function (b) {
      b.addEventListener('click', function () { etat.filtre = b.dataset.fpub; rendre(); });
    });
    var n = hote.querySelector('#pb-neuf');
    if (n) n.addEventListener('click', function () { ouvrirForm(null); });

    hote.querySelectorAll('[data-modif]').forEach(function (b) {
      b.addEventListener('click', function () {
        ouvrirForm(etat.pubs.filter(function (p) { return p.id === b.dataset.modif; })[0]);
      });
    });
    hote.querySelectorAll('[data-copier]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = etat.pubs.filter(function (x) { return x.id === b.dataset.copier; })[0];
        if (!p) return;
        var t = texteComplet(p);
        var fini = function () { b.textContent = 'Copié'; setTimeout(function () { b.textContent = 'Copier'; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(fini, fini);
        else fini();
      });
    });
  }

  function ouvrirForm(p) {
    etat.edite = p || null;
    var zone = etat.hote.querySelector('#pb-form');
    zone.innerHTML = formulaire(p);
    zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    var msg = zone.querySelector('#pb-msg');
    var dire = function (t, ok) {
      msg.className = 'form-msg' + (t ? (ok ? ' ok' : ' err') : '');
      msg.textContent = t || '';
    };

    /* Le compteur suit la frappe : découvrir la troncature après
       publication ne sert plus à rien. */
    var texte = zone.querySelector('#pb-texte');
    var dieses = zone.querySelector('#pb-hashtags');
    var reseau = zone.querySelector('#pb-reseau');
    var compteur = zone.querySelector('#pb-compte');
    function majCompte() {
      var lim = LIMITES[reseau.value] || 2200;
      var n = texte.value.length + (dieses.value ? dieses.value.length + 1 : 0);
      compteur.textContent = n + ' / ' + lim + ' caractères' + (n > lim ? ' — trop long, le réseau coupera' : '');
      compteur.style.color = n > lim ? 'var(--red)' : '';
    }
    [texte, dieses].forEach(function (e) { e.addEventListener('input', majCompte); });
    reseau.addEventListener('change', majCompte);
    majCompte();

    zone.querySelector('#pb-annuler').addEventListener('click', function () { zone.innerHTML = ''; });

    var suppr = zone.querySelector('#pb-suppr');
    if (suppr) suppr.addEventListener('click', async function () {
      if (!confirm('Supprimer définitivement cette publication ?')) return;
      try {
        await I.Publications.supprimer(p.id);
        etat.pubs = etat.pubs.filter(function (x) { return x.id !== p.id; });
        rendre();
      } catch (e) { dire('Suppression refusée : ' + e.message); }
    });

    zone.querySelector('#pb-ok').addEventListener('click', async function () {
      var v = function (id) { var e = zone.querySelector('#' + id); return e ? e.value.trim() : ''; };
      var nb = function (id) { var x = v(id); return x === '' ? null : Number(x); };
      var statut = v('pb-statut'), quand = v('pb-quand');
      /* Un « planifié » sans date n'est pas planifié : il se perdrait
         dans une colonne où l'on ne regarde plus. */
      if (statut === 'planifie' && !quand) return dire('Une publication planifiée a besoin d\'une date.');

      var champs = {
        reseau: v('pb-reseau'), statut: statut, titre: v('pb-titre'),
        texte: v('pb-texte'), hashtags: v('pb-hashtags'), media: v('pb-media'),
        hommage: v('pb-hommage'), lien: v('pb-lien'),
        publier_le: quand ? O.iso(quand) : null,
        vues: nb('pb-vues'), reactions: nb('pb-reac'), partages: nb('pb-part')
      };
      if (statut === 'publie' && !(p && p.publie_le)) champs.publie_le = O.iso(new Date());

      var b = zone.querySelector('#pb-ok'); b.disabled = true; b.textContent = 'Enregistrement…';
      try {
        if (p && p.id) {
          await I.Publications.modifier(p.id, champs);
          Object.keys(champs).forEach(function (k) { p[k] = champs[k]; });
        } else {
          etat.pubs.unshift(await I.Publications.creer(champs));
        }
        rendre();
      } catch (e) {
        b.disabled = false; b.textContent = p && p.id ? 'Enregistrer' : 'Créer';
        dire('Refusé par la base : ' + e.message);
      }
    });
  }

  I.vues.publications = async function (hote) {
    etat.hote = hote;
    if (!O.enLigne()) return O.horsLigne(hote, 'Le planificateur');
    O.attente(hote, 'du plan de publication');
    try {
      etat.pubs = await I.Publications.liste();
      etat.hommages = await I.catalogue();
      rendre();
    } catch (e) { O.panne(hote, e); }
  };
})();

/* ═══════════════════════════════════════════════════════════════
   VUE — LE CATALOGUE CLASSÉ

   Le même fonds que la page Écouter, mais rangé pour travailler :
   par registre, par ville, par rite, avec une recherche qui porte
   aussi sur le récit et les paroles. C'est ce qui permet, au
   téléphone avec une famille bretonne, de retrouver en trois
   secondes l'hommage à lui faire écouter.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var I = window.MelodiaIntranet, O = I._outils;
  var esc = O.esc;

  var etat = { hote: null, oeuvres: [], classement: 'style', q: '', ouvert: null };
  var cache = null;

  /* Le catalogue publié fait foi ; le fichier livré sert de repli.
     Même ordre de préséance que le site public. */
  I.catalogue = async function () {
    if (cache) return cache;
    var depuisBase = null;
    if (O.enLigne()) {
      try {
        var r = await window.MelodiaRest.appel('/rest/v1/site_contenu?id=eq.courant&select=contenu');
        if (r && r[0] && r[0].contenu && r[0].contenu.demos) depuisBase = r[0].contenu.demos;
      } catch (e) { /* la base peut être muette : le fichier reste */ }
    }
    if (!depuisBase) {
      try {
        var f = await fetch('assets/data/content.json?t=' + Date.now(), { cache: 'no-store' });
        var c = f.ok ? await f.json() : null;
        depuisBase = (c && c.demos) || [];
      } catch (e) { depuisBase = []; }
    }
    cache = depuisBase.filter(function (d) { return d.visible !== false; });
    return cache;
  };

  var CLASSEMENTS = {
    style: { l: 'Registre', cle: function (o) { return o.style || 'Sans registre'; } },
    lieu: { l: 'Ville', cle: function (o) { return o.lieu || 'Sans ville'; } },
    mention: { l: 'Particularité', cle: function (o) { return o.mention || 'Hommage funéraire'; } }
  };

  function correspond(o, q) {
    if (!q) return true;
    var t = [o.title, o.who, o.lieu, o.style, o.story, o.lyrics, o.brief, o.mention]
      .filter(Boolean).join(' ').toLowerCase();
    /* Chaque mot doit être présent : « corse berger » ne doit pas
       remonter tous les hommages corses puis tous les bergers. */
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (m) { return t.indexOf(m) !== -1; });
  }

  function fiche(o) {
    var ouvert = etat.ouvert === o.id;
    return '<div class="own-row" data-colonne>' +
      '<div style="display:flex;gap:1rem;align-items:flex-start;">' +
        '<div class="own-item" style="flex:1;min-width:0;">' +
          '<div class="own-name">' + esc(o.title || 'Sans titre') +
            (o.mention ? ' <span class="pill" style="border-color:var(--amber);color:var(--amber);">' +
              esc(o.mention) + '</span>' : '') + '</div>' +
          '<div class="own-detail">' + esc(o.who || '') +
            (o.lieu ? ' · ' + esc(o.lieu) : '') +
            ' · <span style="color:var(--or);">' + esc(o.style || '—') + '</span>' +
            (o.brief ? ' · ' + esc(o.brief) : '') + '</div>' +
        '</div>' +
        '<div class="own-acts" style="gap:.4rem;flex-wrap:wrap;">' +
          '<button class="btn btn-ghost btn-sm" data-fiche="' + esc(o.id) + '">' +
            (ouvert ? 'Replier' : 'Détail') + '</button>' +
        '</div>' +
      '</div>' +
      (o.audio ? '<audio controls preload="none" style="width:100%;margin-top:.7rem;height:34px;" ' +
        'src="' + esc(o.audio) + '"></audio>' : '') +
      (ouvert ? '<div style="margin-top:.9rem;padding-top:.9rem;border-top:1px solid var(--line-soft);">' +
        (o.story ? '<p style="color:var(--bone);font-size:.9rem;line-height:1.8;">' + esc(o.story) + '</p>' : '') +
        (o.lyrics ? '<p style="font-family:var(--ff-d);font-style:italic;color:var(--paper);' +
          'font-size:1.05rem;line-height:1.7;white-space:pre-line;margin-top:.8rem;">' + esc(o.lyrics) + '</p>' : '') +
        '<div class="own-detail" style="color:var(--dust);margin-top:.8rem;">' + esc(o.audio || '') + '</div>' +
      '</div>' : '') +
    '</div>';
  }

  function rendre() {
    var q = etat.q;
    var vus = etat.oeuvres.filter(function (o) { return correspond(o, q); });
    var mode = CLASSEMENTS[etat.classement];

    var groupes = {};
    vus.forEach(function (o) { var k = mode.cle(o); (groupes[k] = groupes[k] || []).push(o); });
    /* Les groupes les plus fournis d'abord : ils disent où est le fonds. */
    var cles = Object.keys(groupes).sort(function (a, b) {
      return groupes[b].length - groupes[a].length || a.localeCompare(b, 'fr');
    });

    var h = '<div class="panel"><div class="panel-head"><div>' +
      '<div class="panel-title">Le <em>catalogue</em></div>' +
      '<div class="panel-sub">' + etat.oeuvres.length + ' hommage(s) · ' +
        cles.length + ' ' + esc(mode.l.toLowerCase()) + '(s)' +
        (q ? ' · ' + vus.length + ' résultat(s)' : '') + '</div></div></div>' +

      '<div class="field-row" style="margin:1.2rem 0;">' +
        '<div class="field" style="margin:0;"><label class="field-label" for="ct-q">Rechercher</label>' +
          '<input class="field-input" id="ct-q" value="' + esc(q) + '" ' +
          'placeholder="breton, gospel, pêcheur, Lyon, un mot des paroles…"></div>' +
        '<div class="field" style="margin:0;"><label class="field-label" for="ct-mode">Classer par</label>' +
          '<select class="field-select" id="ct-mode">' +
            Object.keys(CLASSEMENTS).map(function (k) {
              return '<option value="' + k + '"' + (etat.classement === k ? ' selected' : '') + '>' +
                esc(CLASSEMENTS[k].l) + '</option>';
            }).join('') +
          '</select></div>' +
      '</div>';

    if (!vus.length) {
      h += '<p style="color:var(--ash);line-height:1.8;">Rien ne correspond à « ' + esc(q) + ' ». ' +
        'La recherche porte sur le titre, la personne, la ville, le registre, le récit et les paroles.</p>';
    }

    cles.forEach(function (k) {
      h += '<div class="panel-sub" style="margin:1.6rem 0 .6rem;color:var(--or);">' + esc(k) +
        ' <span style="color:var(--dust);">· ' + groupes[k].length + '</span></div>' +
        '<div class="own-list">' + groupes[k].map(fiche).join('') + '</div>';
    });

    h += '</div>';
    etat.hote.innerHTML = h;

    var champ = etat.hote.querySelector('#ct-q');
    champ.addEventListener('input', function () {
      etat.q = champ.value;
      var pos = champ.selectionStart;
      rendre();
      /* Le champ est reconstruit à chaque frappe : sans ceci, le
         curseur repartirait au début du mot en cours de saisie. */
      var neuf = etat.hote.querySelector('#ct-q');
      neuf.focus(); neuf.setSelectionRange(pos, pos);
    });
    etat.hote.querySelector('#ct-mode').addEventListener('change', function (e) {
      etat.classement = e.target.value; rendre();
    });
    etat.hote.querySelectorAll('[data-fiche]').forEach(function (b) {
      b.addEventListener('click', function () {
        etat.ouvert = etat.ouvert === b.dataset.fiche ? null : b.dataset.fiche;
        rendre();
      });
    });
  }

  I.vues.catalogue = async function (hote) {
    etat.hote = hote;
    O.attente(hote, 'du catalogue');
    try {
      etat.oeuvres = await I.catalogue();
      rendre();
    } catch (e) { O.panne(hote, e); }
  };
})();

/* ═══════════════════════════════════════════════════════════════
   VUE — LES CANDIDATURES

   La seule table du site où un visiteur non connecté écrit. La
   lecture, elle, n'est ouverte qu'au fondateur : une candidature
   porte un nom, un téléphone et un parcours.

   Le CV n'est pas servi par une adresse publique. On demande au
   stockage un lien signé, valable une heure : de quoi l'ouvrir
   maintenant, pas de quoi le faire circuler.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var I = window.MelodiaIntranet, O = I._outils;
  var esc = O.esc;

  var ETATS = {
    nouveau:   { l: 'Nouvelle', c: 'or' },
    vue:       { l: 'Lue', c: 'silver-dim' },
    entretien: { l: 'Entretien', c: 'cyan' },
    retenu:    { l: 'Retenu', c: 'green' },
    ecarte:    { l: 'Écarté', c: 'dust' }
  };
  var POSTES = {
    commercial: 'Collaborateur commercial', composition: 'Composition et écriture',
    administratif: 'Administratif et suivi', autre: 'Autre'
  };

  var etat = { hote: null, liste: [], filtre: 'tous', ouvert: null };

  function pastille(c) {
    var e = ETATS[c.statut] || ETATS.nouveau;
    return '<span class="pill" style="border-color:var(--' + e.c + ');color:var(--' + e.c + ');">' +
      esc(e.l) + '</span>';
  }

  function fiche(c) {
    var ouvert = etat.ouvert === c.id;
    return '<div class="own-row" data-colonne>' +
      '<div style="display:flex;gap:1rem;align-items:flex-start;">' +
        '<div class="own-item" style="flex:1;min-width:0;">' +
          '<div class="own-name">' + esc(c.nom || 'Sans nom') + '</div>' +
          '<div class="own-detail">' + esc(POSTES[c.poste] || c.poste) +
            (c.ville ? ' · ' + esc(c.ville) : '') +
            ' · ' + esc(O.quand(c.created_at)) +
            (c.cv ? ' · <span style="color:var(--or);">CV joint</span>' : ' · <span style="color:var(--dust);">sans CV</span>') +
          '</div>' +
          '<div class="own-detail">' +
            '<a href="mailto:' + esc(c.email) + '" style="color:var(--or);">' + esc(c.email) + '</a>' +
            (c.tel ? ' · <a href="tel:' + esc(c.tel) + '" style="color:var(--or);">' + esc(c.tel) + '</a>' : '') +
          '</div>' +
        '</div>' +
        '<div class="own-acts" style="gap:.4rem;flex-wrap:wrap;">' + pastille(c) +
          '<button class="btn btn-ghost btn-sm" data-cand="' + esc(c.id) + '">' +
            (ouvert ? 'Replier' : 'Ouvrir') + '</button>' +
        '</div>' +
      '</div>' +
      (ouvert ? detail(c) : '') +
    '</div>';
  }

  function detail(c) {
    var opts = Object.keys(ETATS).map(function (s) {
      return '<option value="' + s + '"' + (c.statut === s ? ' selected' : '') + '>' + esc(ETATS[s].l) + '</option>';
    }).join('');
    return '<div style="margin-top:.9rem;padding-top:.9rem;border-top:1px solid var(--line-soft);">' +
      (c.statut_pro ? '<div class="own-detail">Situation : ' + esc(c.statut_pro) + '</div>' : '') +
      (c.experience ? '<div class="own-detail">Parcours : ' + esc(c.experience) + '</div>' : '') +
      (c.message ? '<p style="color:var(--bone);font-size:.92rem;line-height:1.8;margin:.8rem 0;white-space:pre-wrap;">' +
        esc(c.message) + '</p>' : '') +
      '<div style="display:flex;gap:.8rem;flex-wrap:wrap;align-items:center;margin:1rem 0;">' +
        (c.cv
          ? '<button class="btn btn-outline btn-sm" data-cv="' + esc(c.id) + '">Ouvrir le CV — ' + esc(c.cv_nom || 'PDF') + '</button>'
          : '<span style="color:var(--dust);font-size:.85rem;">Aucun CV déposé.</span>') +
        '<span id="cv-etat-' + esc(c.id) + '" style="color:var(--ash);font-size:.82rem;"></span>' +
      '</div>' +
      '<div class="field-row">' +
        '<div class="field"><label class="field-label">Où en est-on</label>' +
          '<select class="field-select" data-statut="' + esc(c.id) + '">' + opts + '</select></div>' +
        '<div class="field"><label class="field-label">Notes internes</label>' +
          '<input class="field-input" data-notes="' + esc(c.id) + '" value="' + esc(c.notes || '') + '" ' +
          'placeholder="Rappeler après le 15, secteur Rhône"></div>' +
      '</div>' +
      '<div class="form-msg" id="cd-etat-' + esc(c.id) + '"></div>' +
    '</div>';
  }

  function rendre() {
    var liste = etat.filtre === 'tous' ? etat.liste
      : etat.liste.filter(function (c) { return c.statut === etat.filtre; });
    var compte = {};
    Object.keys(ETATS).forEach(function (s) {
      compte[s] = etat.liste.filter(function (c) { return c.statut === s; }).length;
    });

    var h = '<div class="panel"><div class="panel-head"><div>' +
      '<div class="panel-title">Les <em>candidatures</em></div>' +
      '<div class="panel-sub">' + etat.liste.length + ' reçue(s)' +
        (compte.nouveau ? ' · <span style="color:var(--or);">' + compte.nouveau + ' non lue(s)</span>' : '') +
      '</div></div>' +
      '<button class="btn btn-outline btn-sm" id="cd-rafraichir">Rafraîchir</button></div>' +

      '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin:1.2rem 0;">' +
        ['tous'].concat(Object.keys(ETATS)).map(function (f) {
          var lib = f === 'tous' ? 'Toutes' : ETATS[f].l;
          var n = f === 'tous' ? etat.liste.length : compte[f];
          return '<button class="btn btn-' + (etat.filtre === f ? 'gold' : 'outline') +
            ' btn-sm" data-fcand="' + f + '">' + esc(lib) + ' (' + n + ')</button>';
        }).join('') +
      '</div>';

    h += liste.length
      ? '<div class="own-list">' + liste.map(fiche).join('') + '</div>'
      : '<p style="color:var(--ash);line-height:1.8;">' +
        (etat.liste.length ? 'Aucune candidature dans cette colonne.'
          : 'Aucune candidature pour l\'instant. La page « Nous rejoindre » est en ligne : ' +
            'les dépôts arriveront ici, CV compris.') + '</p>';

    h += '</div>';
    etat.hote.innerHTML = h;
    brancher();
  }

  function brancher() {
    var hote = etat.hote;
    hote.querySelectorAll('[data-fcand]').forEach(function (b) {
      b.addEventListener('click', function () { etat.filtre = b.dataset.fcand; rendre(); });
    });
    var r = hote.querySelector('#cd-rafraichir');
    if (r) r.addEventListener('click', function () { I.vues.candidatures(hote); });

    hote.querySelectorAll('[data-cand]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var id = b.dataset.cand;
        var ouvre = etat.ouvert !== id;
        etat.ouvert = ouvre ? id : null;
        /* Ouvrir une candidature vaut lecture : le passage de
           « nouvelle » à « lue » se fait tout seul, sinon la pastille
           de non-lues ne descend jamais. */
        if (ouvre) {
          var c = etat.liste.filter(function (x) { return x.id === id; })[0];
          if (c && c.statut === 'nouveau') {
            try { await majer(id, { statut: 'vue' }); c.statut = 'vue'; } catch (e) {}
          }
        }
        rendre();
      });
    });

    hote.querySelectorAll('[data-statut]').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var id = sel.dataset.statut;
        try {
          await majer(id, { statut: sel.value });
          var c = etat.liste.filter(function (x) { return x.id === id; })[0];
          if (c) c.statut = sel.value;
          rendre();
        } catch (e) { dire(id, 'Refusé : ' + e.message); }
      });
    });

    hote.querySelectorAll('[data-notes]').forEach(function (inp) {
      var minuteur = null;
      inp.addEventListener('input', function () {
        clearTimeout(minuteur);
        /* On n'écrit pas à chaque touche : la note part une seconde
           après la dernière frappe. */
        minuteur = setTimeout(async function () {
          var id = inp.dataset.notes;
          try {
            await majer(id, { notes: inp.value });
            var c = etat.liste.filter(function (x) { return x.id === id; })[0];
            if (c) c.notes = inp.value;
            dire(id, 'Note enregistrée.', true);
          } catch (e) { dire(id, 'Note non enregistrée : ' + e.message); }
        }, 900);
      });
    });

    hote.querySelectorAll('[data-cv]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var id = b.dataset.cv;
        var c = etat.liste.filter(function (x) { return x.id === id; })[0];
        var mot = hote.querySelector('#cv-etat-' + id);
        b.disabled = true; mot.textContent = 'Préparation du lien…';
        try {
          var lien = await lienSigne(c.cv);
          mot.textContent = 'Lien valable une heure.';
          window.open(lien, '_blank', 'noopener');
        } catch (e) {
          mot.innerHTML = '<span style="color:var(--red);">Impossible d\'ouvrir le CV : ' + esc(e.message) + '</span>';
        } finally { b.disabled = false; }
      });
    });
  }

  function dire(id, t, ok) {
    var m = etat.hote.querySelector('#cd-etat-' + id);
    if (!m) return;
    m.className = 'form-msg' + (t ? (ok ? ' ok' : ' err') : '');
    m.textContent = t || '';
    m.style.display = t ? 'block' : '';
    if (ok) setTimeout(function () { m.textContent = ''; m.style.display = ''; }, 2200);
  }

  async function majer(id, champs) {
    await window.MelodiaRest.appel('/rest/v1/candidatures?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH', body: JSON.stringify(champs)
    });
  }

  /* Le casier des CV est privé. On demande un lien signé plutôt que de
     rendre le fichier public : il expire, et il ne se transmet pas. */
  async function lienSigne(chemin) {
    var r = await window.MelodiaRest.appel('/storage/v1/object/sign/cv/' + encodeURI(chemin), {
      method: 'POST', body: JSON.stringify({ expiresIn: 3600 })
    });
    var url = r && (r.signedURL || r.signedUrl || r.url);
    if (!url) throw new Error('le stockage n\'a pas renvoyé de lien');
    return (window.MELODIA_CONFIG.SUPABASE_URL || '').replace(/\/+$/, '') + '/storage/v1' +
      String(url).replace(/^\/storage\/v1/, '');
  }

  I.vues.candidatures = async function (hote) {
    etat.hote = hote;
    if (!O.enLigne()) return O.horsLigne(hote, 'Les candidatures');
    O.attente(hote, 'des candidatures');
    try {
      etat.liste = (await window.MelodiaRest.appel(
        '/rest/v1/candidatures?select=*&order=created_at.desc')) || [];
      rendre();
      majBadgeCandidatures();
    } catch (e) { O.panne(hote, e); }
  };

  /* La pastille de la barre latérale : le nombre de candidatures que
     personne n'a encore ouvertes. */
  async function majBadgeCandidatures() {
    var b = document.getElementById('badge-cand');
    if (!b || !O.enLigne() || !O.estMaitre()) return;
    try {
      var r = await window.MelodiaRest.appel('/rest/v1/candidatures?select=id&statut=eq.nouveau');
      var n = (r || []).length;
      b.textContent = n;
      b.style.display = n ? '' : 'none';
    } catch (e) { /* la console démarre même si la base est muette */ }
  }
  I.majBadgeCandidatures = majBadgeCandidatures;
})();
