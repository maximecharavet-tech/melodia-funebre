/* ═══════════════════════════════════════════════════════════════
   MELODIA — Atelier : composition musicale par l'API Suno
   Monté dans la console maître, sous le brief et les paroles.

   Le circuit : /api/generate-music renvoie un identifiant de tâche,
   puis /api/music-status est interrogé jusqu'à obtention des titres.
   La clé Suno reste côté serveur, jamais dans le navigateur.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLE_TACHE = 'melodia_suno_task';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  var etatCourant = null;   // { taskId, title, ref, startedAt }
  var enCours = false;
  var config = null;

  /* ─── Persistance : une composition survit à un rechargement ─── */
  function sauver(t) {
    try { t ? localStorage.setItem(CLE_TACHE, JSON.stringify(t)) : localStorage.removeItem(CLE_TACHE); } catch (e) {}
  }
  function relire() {
    try { return JSON.parse(localStorage.getItem(CLE_TACHE) || 'null'); } catch (e) { return null; }
  }

  /* ─── Rendu ─── */
  function panneau() {
    var etatCfg = !config ? 'Vérification…'
      : config.configured
        ? '<span style="color:var(--green);">API Suno branchée</span> · ' + esc(config.provider) + ' · modèle ' + esc(config.model)
        : '<span style="color:var(--amber);">API Suno non configurée</span> — export manuel disponible';

    return '' +
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div><div class="panel-title">La <em>composition</em></div>' +
          '<div class="panel-sub">' + etatCfg + '</div></div>' +
          '<button class="btn btn-outline btn-sm" id="mus-manuel">Export manuel</button>' +
        '</div>' +
        '<div id="mus-msg" class="form-msg"></div>' +
        '<div class="field-row" style="margin-bottom:1rem;">' +
          '<div class="field"><label class="field-label" for="mus-voix">Voix</label>' +
            '<select class="field-select" id="mus-voix">' +
              '<option value="">Laisser Suno décider</option>' +
              '<option value="m">Masculine</option>' +
              '<option value="f">Féminine</option>' +
            '</select></div>' +
          '<div class="field"><label class="field-label" for="mus-exclure">À éviter</label>' +
            '<input class="field-input" id="mus-exclure" placeholder="heavy drums, electronic, aggressive"></div>' +
        '</div>' +
        '<label class="check" style="margin-bottom:1.2rem;"><input type="checkbox" id="mus-instru"> ' +
          '<span>Version instrumentale, sans voix</span></label>' +
        '<div style="display:flex; gap:.8rem; flex-wrap:wrap;">' +
          '<button class="btn btn-gold" id="mus-go" style="flex:1; min-width:200px;">Composer la musique</button>' +
          '<button class="btn btn-ghost" id="mus-stop" style="display:none;">Arrêter le suivi</button>' +
        '</div>' +
        '<div id="mus-suivi" style="display:none; margin-top:1.3rem;"></div>' +
        '<div id="mus-titres" style="margin-top:1.3rem;"></div>' +
        '<p style="font-family:var(--ff-m); font-size:.5rem; letter-spacing:.14em; color:var(--dust); margin-top:1.1rem; text-align:center;">' +
          'SUNO · MODE CUSTOM · 2 VERSIONS PAR COMPOSITION · 60 À 180 SECONDES</p>' +
      '</div>';
  }

  function message(texte, type) {
    var m = $('mus-msg');
    if (!m) return;
    m.className = 'form-msg' + (type ? ' ' + type : '');
    m.textContent = texte || '';
  }

  function suivi(html) {
    var s = $('mus-suivi');
    if (!s) return;
    s.style.display = html ? 'block' : 'none';
    s.innerHTML = html || '';
  }

  var LIBELLES = {
    PENDING: 'En file d\'attente chez Suno…',
    TEXT_SUCCESS: 'Paroles acceptées, la musique s\'écrit…',
    FIRST_SUCCESS: 'Première version prête, la seconde arrive…',
    SUCCESS: 'Composition terminée.'
  };

  function afficherSuivi(etat) {
    var libelle = LIBELLES[etat.status] || ('État : ' + etat.status);
    var min = Math.floor(etat.elapsed / 60), sec = etat.elapsed % 60;
    suivi(
      '<div class="status-live" style="display:inline-flex;">' + esc(libelle) + '</div>' +
      '<div style="font-family:var(--ff-m); font-size:.6rem; color:var(--dust); margin-top:.6rem;">' +
        min + ' min ' + String(sec).padStart(2, '0') + ' s écoulées' +
      '</div>'
    );
    if (etat.tracks && etat.tracks.length) afficherTitres(etat.tracks, !etat.done);
  }

  function afficherTitres(titres, partiel) {
    var z = $('mus-titres');
    if (!z) return;
    if (!titres || !titres.length) { z.innerHTML = ''; return; }

    z.innerHTML =
      '<div class="mono" style="margin-bottom:.8rem;">' +
        (partiel ? 'Version disponible' : titres.length + ' version' + (titres.length > 1 ? 's' : '') + ' à écouter') +
      '</div>' +
      titres.map(function (t, i) {
        var url = t.audio_url || t.stream_url;
        return '' +
          '<div style="border:1px solid var(--line-soft); border-radius:6px; padding:1rem; margin-bottom:.8rem;">' +
            '<div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:.7rem;">' +
              '<div><div style="font-family:var(--ff-d); font-size:1.1rem; color:var(--paper);">' +
                esc(t.title || 'Version ' + (i + 1)) + '</div>' +
                (t.tags ? '<div class="mono" style="color:var(--dust); margin-top:.2rem;">' + esc(t.tags) + '</div>' : '') +
              '</div>' +
              '<div style="display:flex; gap:.5rem;">' +
                '<a class="btn btn-outline btn-sm" href="' + esc(url) + '" download target="_blank" rel="noopener">Télécharger</a>' +
                '<button class="btn btn-gold btn-sm" data-attacher="' + esc(url) + '" data-titre="' + esc(t.title || '') + '">Attacher</button>' +
              '</div>' +
            '</div>' +
            '<audio controls preload="none" style="width:100%;" src="' + esc(url) + '"></audio>' +
          '</div>';
      }).join('') +
      (partiel ? '' : '<p style="font-size:.78rem; color:var(--ash); line-height:1.6;">Les liens fournis par Suno expirent au bout de quelques semaines : téléchargez le fichier retenu et archivez-le.</p>');

    Array.prototype.forEach.call(z.querySelectorAll('[data-attacher]'), function (b) {
      b.addEventListener('click', function () { attacher(b.getAttribute('data-attacher'), b.getAttribute('data-titre')); });
    });
  }

  /* ─── Rattacher l'œuvre à la commande en cours ─── */
  async function attacher(url, titre) {
    var ref = window.MELODIA_ATELIER_REF;
    if (!ref) {
      message('Aucune commande chargée dans l\'atelier. Ouvrez une commande depuis l\'onglet Commandes, puis réessayez.', 'err');
      return;
    }
    try {
      await window.MelodiaDB.setAudio(ref, { url: url, title: titre, taskId: etatCourant && etatCourant.taskId });
      message('Œuvre rattachée à la commande ' + ref + '. Elle est désormais lisible depuis la fiche de commande, ici et dans l\'espace de l\'agence.', 'ok');
      if (window.melodiaToast) window.melodiaToast('Hommage rattaché à ' + ref + '.');
    } catch (e) {
      message(e.message, 'err');
    }
  }

  /* ─── Lancement ─── */
  async function composer() {
    var paroles = ($('at-lyrics') || {}).value || '';
    var style = ($('at-style-prompt') || {}).value || '';
    var instru = $('mus-instru') && $('mus-instru').checked;

    if (!paroles.trim() && !instru) {
      message('Écrivez d\'abord les paroles, ou cochez « version instrumentale ».', 'err');
      return;
    }

    var titreEl = $('at-title-h');
    var titre = titreEl ? titreEl.textContent.replace(/[«»]/g, '').trim() : '';
    if (!titre || /^Les paroles$/i.test(titre)) titre = 'Hommage Melodia';

    var go = $('mus-go'), stop = $('mus-stop');
    go.disabled = true; go.textContent = 'Envoi à Suno…';
    message('');
    $('mus-titres').innerHTML = '';

    try {
      var lancement = await window.MelodiaAI.music({
        title: titre,
        lyrics: paroles,
        style_prompt: style,
        instrumental: instru,
        negative_tags: ($('mus-exclure') || {}).value || '',
        vocal_gender: ($('mus-voix') || {}).value || ''
      });

      etatCourant = { taskId: lancement.taskId, title: titre, ref: window.MELODIA_ATELIER_REF || '', startedAt: Date.now() };
      sauver(etatCourant);
      go.textContent = 'Composition en cours…';
      stop.style.display = '';
      await surveiller(lancement.taskId);
    } catch (e) {
      message(e.message + (e.hint ? ' ' + e.hint : ''), 'err');
      suivi('');
      go.disabled = false; go.textContent = 'Composer la musique';
      stop.style.display = 'none';
    }
  }

  var abandon = null;

  async function surveiller(taskId) {
    var go = $('mus-go'), stop = $('mus-stop');
    enCours = true;
    abandon = { aborted: false };
    try {
      var fin = await window.MelodiaAI.musicPoll(taskId, afficherSuivi, { signal: abandon });
      suivi('');
      afficherTitres(fin.tracks, false);
      message('Composition terminée : écoutez, puis attachez la version retenue à la commande.', 'ok');
      /* On oublie la reprise au rechargement, mais on garde la tâche en mémoire :
         « Attacher » doit encore pouvoir consigner l'identifiant Suno. */
      sauver(null);
    } catch (e) {
      suivi('');
      message(e.message, e.failed ? 'err' : 'info');
      /* Un dépassement de délai n'annule pas la tâche : on garde l'identifiant */
      if (e.failed) { sauver(null); etatCourant = null; }
    } finally {
      enCours = false;
      if (go) { go.disabled = false; go.textContent = 'Composer la musique'; }
      if (stop) stop.style.display = 'none';
    }
  }

  /* ─── Montage ─── */
  async function mount() {
    var hote = $('at-music');
    if (!hote) return;
    if (!config) config = await window.MelodiaAI.musicConfig();
    hote.innerHTML = panneau();

    $('mus-go').addEventListener('click', composer);
    $('mus-stop').addEventListener('click', function () {
      if (abandon) abandon.aborted = true;
      message('Suivi interrompu. La composition continue chez Suno : rouvrez l\'atelier pour la récupérer.', 'info');
    });
    $('mus-manuel').addEventListener('click', function () {
      var l = ($('at-lyrics') || {}).value || '';
      if (!l.trim()) { message('Écrivez d\'abord les paroles.', 'err'); return; }
      var titreEl = $('at-title-h');
      window.MelodiaAI.sunoExport(
        titreEl ? titreEl.textContent.replace(/[«»]/g, '').trim() : 'Hommage Melodia',
        l, ($('at-style-prompt') || {}).value || ''
      );
      message('Paroles et direction musicale copiées. Dans Suno : mode Custom, collez les deux champs.', 'info');
    });

    if (!config.configured) {
      message('La composition automatique n\'est pas encore branchée. Renseignez SUNO_API_URL et SUNO_API_KEY dans Vercel → Settings → Environment Variables, puis redéployez. En attendant, le bouton « Export manuel » reste opérationnel.', 'info');
      $('mus-go').disabled = true;
      return;
    }

    /* Reprise d'une composition lancée avant un rechargement de page */
    var reprise = relire();
    if (reprise && reprise.taskId && !enCours) {
      var age = Math.round((Date.now() - (reprise.startedAt || 0)) / 1000);
      if (age > 3600) { sauver(null); return; }   /* trop vieille, on oublie */
      etatCourant = reprise;
      message('Reprise du suivi d\'une composition lancée il y a ' + Math.round(age / 60) + ' min…', 'info');
      $('mus-go').disabled = true;
      $('mus-go').textContent = 'Composition en cours…';
      $('mus-stop').style.display = '';
      surveiller(reprise.taskId);
    }
  }

  window.MelodiaAtelier = { mount: mount };
})();
