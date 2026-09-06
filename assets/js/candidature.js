/* ═══════════════════════════════════════════════════════════════
   MELODIA — Le dépôt de candidature

   Un visiteur non connecté écrit dans la base et y dépose un fichier.
   C'est le seul endroit du site dans ce cas, et c'est voulu : une
   page « Nous rejoindre » qui exigerait un compte ne recevrait rien.

   Ce qui protège :
   — la règle d'écriture n'accepte qu'un statut « nouveau » et des
     notes vides, donc personne ne se recrute lui-même ;
   — la lecture est fermée à tout le monde sauf au fondateur ;
   — le casier de stockage n'accepte que des PDF de 5 Mo au plus, et
     c'est lui qui le vérifie, pas ce fichier.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CFG = window.MELODIA_CONFIG || {};
  var SB = (CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var CLE = CFG.SUPABASE_ANON_KEY || '';
  var PRET = !!(SB && CLE);

  var MAX = 5 * 1024 * 1024;

  var $ = function (id) { return document.getElementById(id); };
  var champ = $('cd-formulaire');
  if (!champ) return;

  var fichier = null;

  function dire(t, ok) {
    var m = $('cd-msg');
    m.className = 'form-msg' + (t ? (ok ? ' ok' : ' err') : '');
    m.textContent = t || '';
    if (t) m.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function marquer(id, faux) {
    var e = $(id);
    if (!e) return;
    e.classList.toggle('invalid', !!faux);
  }

  /* ─── Choix du fichier ─── */
  $('cd-parcourir').addEventListener('click', function () { $('cd-cv').click(); });

  $('cd-cv').addEventListener('change', function () {
    var f = this.files && this.files[0];
    var nom = $('cd-cv-nom');
    if (!f) { fichier = null; nom.textContent = 'Choisir un fichier PDF'; return; }
    /* Le casier refuserait de toute façon, mais l'apprendre après un
       téléversement de 5 Mo sur un forfait mobile serait pénible. */
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) {
      fichier = null; this.value = '';
      nom.textContent = 'Choisir un fichier PDF';
      return dire('Le CV doit être un PDF. Un document Word s\'exporte en PDF depuis « Enregistrer sous ».');
    }
    if (f.size > MAX) {
      fichier = null; this.value = '';
      nom.textContent = 'Choisir un fichier PDF';
      return dire('Ce PDF fait ' + (f.size / 1048576).toFixed(1) + ' Mo, la limite est de 5 Mo. ' +
                  'Un CV dépasse rarement 1 Mo : le vôtre contient sans doute une image en pleine page.');
    }
    fichier = f;
    nom.textContent = f.name + ' · ' + (f.size / 1024).toFixed(0) + ' Ko';
    dire('');
  });

  /* ─── Envoi ─── */
  function ref() {
    return 'CAND-' + Date.now().toString(36).toUpperCase().slice(-6) +
           Math.random().toString(36).slice(2, 4).toUpperCase();
  }

  async function poster(chemin, corps, entetes) {
    var h = { apikey: CLE, Authorization: 'Bearer ' + CLE };
    Object.keys(entetes || {}).forEach(function (k) { h[k] = entetes[k]; });
    var r = await fetch(SB + chemin, { method: 'POST', headers: h, body: corps });
    if (!r.ok) {
      var t = await r.text(); var d = null;
      try { d = JSON.parse(t); } catch (e) {}
      throw new Error((d && (d.message || d.error || d.msg)) || ('Erreur ' + r.status));
    }
    return r;
  }

  async function deposerCV(id) {
    if (!fichier) return { chemin: '', nom: '' };
    var propre = fichier.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80);
    var chemin = id + '/' + propre;
    var barre = $('cd-barre'), progres = $('cd-progres');
    progres.hidden = false; barre.style.width = '35%';
    await poster('/storage/v1/object/cv/' + encodeURI(chemin), fichier, {
      'Content-Type': 'application/pdf', 'x-upsert': 'true'
    });
    barre.style.width = '100%';
    return { chemin: chemin, nom: fichier.name };
  }

  $('cd-envoyer').addEventListener('click', async function () {
    var b = this;
    var v = function (id) { var e = $(id); return e ? e.value.trim() : ''; };
    var nom = v('cd-nom'), email = v('cd-email'), message = v('cd-message');

    ['cd-nom', 'cd-email', 'cd-message'].forEach(function (id) { marquer(id, false); });
    var manque = [];
    if (!nom) { marquer('cd-nom', true); manque.push('votre nom'); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { marquer('cd-email', true); manque.push('un email valide'); }
    if (!message) { marquer('cd-message', true); manque.push('quelques mots sur votre motivation'); }
    if (manque.length) return dire('Il manque ' + manque.join(', ') + '.');
    if (!$('cd-accord').checked) return dire('Merci de cocher l\'accord de conservation : sans lui nous n\'avons pas le droit de garder votre candidature.');

    if (!PRET) {
      return dire('Le dépôt en ligne n\'est pas disponible sur cette installation. ' +
                  'Écrivez-nous à contact@melodia-funebre.fr, nous lirons votre candidature de la même façon.');
    }

    b.disabled = true; b.classList.add('is-loading');
    var avant = b.textContent; b.textContent = 'Envoi…';
    dire('');

    var id = ref();
    try {
      /* Le CV part en premier : si le stockage refuse, aucune
         candidature muette ne reste en base avec un CV manquant. */
      var cv = await deposerCV(id);
      await poster('/rest/v1/candidatures', JSON.stringify({
        id: id, nom: nom, email: email, tel: v('cd-tel'), ville: v('cd-ville'),
        poste: v('cd-poste') || 'commercial', statut_pro: v('cd-statut'),
        experience: v('cd-exp'), message: message,
        cv: cv.chemin, cv_nom: cv.nom
      }), { 'Content-Type': 'application/json', Prefer: 'return=minimal' });

      /* Prévenir la maison. L'envoi n'est pas attendu : l'écran de
         remerciement ne doit pas dépendre d'un service de courriel. */
      fetch('/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'candidature', ref: id, nom: nom, email: email, tel: v('cd-tel'),
          offre: 'Candidature — ' + v('cd-poste'),
          message: [v('cd-ville'), v('cd-statut'), v('cd-exp'), message, cv.nom ? 'CV : ' + cv.nom : 'Sans CV']
            .filter(Boolean).join('\n'),
          page: location.pathname
        })
      }).catch(function () {});

      $('cd-ref').textContent = id;
      $('cd-formulaire').hidden = true;
      $('cd-merci').hidden = false;
      dire('');
      $('cd-merci').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
      b.disabled = false; b.classList.remove('is-loading'); b.textContent = avant;
      var p = $('cd-progres'); if (p) p.hidden = true;
      dire('L\'envoi a échoué : ' + e.message +
           '. Vous pouvez aussi nous écrire à contact@melodia-funebre.fr — nous lirons votre candidature de la même façon.');
    }
  });
})();
