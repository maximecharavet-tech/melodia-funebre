/* ═══════════════════════════════════════════════════════════════
   MELODIA — Atelier : composition musicale
   Monté dans la console maître, sous le brief et les paroles.

   Deux circuits, le bon s'affiche tout seul :

   • MANUEL (circuit courant) — le brief part dans le presse-papiers,
     Suno s'ouvre, vous composez avec votre abonnement, puis vous
     rattachez le lien de l'hommage terminé à la commande.

   • AUTOMATIQUE — dès qu'une clé musicale est renseignée côté serveur,
     un second bloc apparaît et compose sans quitter la console.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLE_TACHE = 'melodia_music_task';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  var estAudio = function (u) { return /\.(mp3|m4a|wav|ogg|flac)(\?|#|$)/i.test(u || ''); };

  var etatCourant = null;
  var enCours = false;
  var config = null;

  function sauver(t) {
    try { t ? localStorage.setItem(CLE_TACHE, JSON.stringify(t)) : localStorage.removeItem(CLE_TACHE); } catch (e) {}
  }
  function relire() {
    try { return JSON.parse(localStorage.getItem(CLE_TACHE) || 'null'); } catch (e) { return null; }
  }

  /* ═══ Rendu du panneau ═══ */
  function panneau() {
    var auto = config && config.configured;
    var etiquette = auto
      ? '<span style="color:var(--green);">Automatique</span> · ' + esc(config.engine || 'API') + ' · ' + esc(config.model)
      : '<span style="color:var(--or);">Mode manuel</span> · Suno, votre abonnement';

    var stock = window.MelodiaLivraison;
    var distant = stock && stock.mode === 'supabase';

    var blocManuel =
      '<div style="border:1px solid var(--line-strong); border-radius:6px; padding:1.3rem; background:rgba(201,168,76,.04);">' +
        '<div class="mono" style="color:var(--or-patina); margin-bottom:1rem;">Étape 1 — composer sur Suno</div>' +
        '<p style="font-size:.9rem; color:var(--bone); line-height:1.7; margin-bottom:1.1rem;">' +
          'Le bouton copie le titre, la direction musicale et les paroles, puis ouvre Suno. ' +
          'Sur place : <b style="color:var(--paper);">Create</b> → onglet <b style="color:var(--paper);">Custom</b> → ' +
          'collez les paroles dans <b style="color:var(--paper);">Lyrics</b> et le style dans ' +
          '<b style="color:var(--paper);">Style of Music</b>. Puis téléchargez le MP3.</p>' +
        '<button class="btn btn-gold" style="width:100%;" id="mus-suno">Copier le brief et ouvrir Suno</button>' +

        '<div class="mono" style="color:var(--or-patina); margin:1.8rem 0 1rem;">Étape 2 — déposer le MP3</div>' +
        '<div class="depot" id="mus-depot" tabindex="0" role="button" aria-label="Déposer le fichier audio">' +
          '<div class="depot-ico">♪</div>' +
          '<div class="depot-txt">Glissez le MP3 ici, ou <u>choisissez un fichier</u></div>' +
          '<div class="depot-sub">' + (distant
            ? 'Envoyé sur votre stockage : le client obtient un lien permanent.'
            : 'Conservé sur cet appareil, à joindre au courriel. Activez Supabase pour un lien permanent.') + '</div>' +
          '<input type="file" id="mus-fichier" accept="audio/*,.mp3,.m4a,.wav,.flac" hidden>' +
        '</div>' +
        '<div id="mus-progres" class="depot-progres" hidden><div class="depot-barre"><span></span></div><div class="depot-pct">0 %</div></div>' +

        '<details style="margin-top:1rem;">' +
          '<summary style="cursor:pointer; font-family:var(--ff-m); font-size:.55rem; letter-spacing:.16em; text-transform:uppercase; color:var(--ash);">Ou rattacher un lien</summary>' +
          '<div style="margin-top:.9rem;">' +
            '<div class="field" style="margin-bottom:.7rem;">' +
              '<input class="field-input" id="mus-lien" type="url" placeholder="https://suno.com/song/… ou https://…/hommage.mp3">' +
            '</div>' +
            '<button class="btn btn-outline btn-sm" id="mus-attacher">Rattacher ce lien</button>' +
          '</div>' +
        '</details>' +
        '<div class="field" style="margin:1rem 0 0;">' +
          '<input class="field-input" id="mus-lien-titre" placeholder="Titre de l\'hommage (facultatif)">' +
        '</div>' +
      '</div>' +
      '<div id="mus-livraison" style="margin-top:1.2rem;"></div>';

    var blocAuto = auto ?
      '<div style="margin-top:1.4rem; border:1px solid var(--line-soft); border-radius:6px; padding:1.3rem;">' +
        '<div class="mono" style="color:var(--or-patina); margin-bottom:1rem;">Ou composer automatiquement</div>' +
        '<div class="field-row" style="margin-bottom:1rem;">' +
          '<div class="field"><label class="field-label" for="mus-voix">Voix</label>' +
            '<select class="field-select" id="mus-voix">' +
              '<option value="">Laisser décider</option>' +
              '<option value="m">Masculine</option>' +
              '<option value="f">Féminine</option>' +
            '</select></div>' +
          '<div class="field"><label class="field-label" for="mus-exclure">À éviter</label>' +
            '<input class="field-input" id="mus-exclure" placeholder="heavy drums, electronic"></div>' +
        '</div>' +
        '<label class="check" style="margin-bottom:1.1rem;"><input type="checkbox" id="mus-instru"> ' +
          '<span>Version instrumentale, sans voix</span></label>' +
        '<div style="display:flex; gap:.8rem; flex-wrap:wrap;">' +
          '<button class="btn btn-gold" id="mus-go" style="flex:1; min-width:180px;">Composer la musique</button>' +
          '<button class="btn btn-ghost" id="mus-stop" style="display:none;">Arrêter le suivi</button>' +
        '</div>' +
        '<div id="mus-suivi" style="display:none; margin-top:1.2rem;"></div>' +
      '</div>' : '';

    return '' +
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<div><div class="panel-title">La <em>composition</em></div>' +
          '<div class="panel-sub">' + etiquette + '</div></div>' +
        '</div>' +
        '<div id="mus-msg" class="form-msg"></div>' +
        blocManuel + blocAuto +
        '<div id="mus-titres" style="margin-top:1.3rem;"></div>' +
      '</div>';
  }

  function message(texte, type) {
    var m = $('mus-msg');
    if (!m) return;
    m.className = 'form-msg' + (type ? ' ' + type : '');
    m.textContent = texte || '';
    if (texte) m.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function suivi(html) {
    var s = $('mus-suivi');
    if (!s) return;
    s.style.display = html ? 'block' : 'none';
    s.innerHTML = html || '';
  }

  var LIBELLES = {
    PREPARING: 'Préparation de la composition…',
    QUEUED: 'En file d\'attente…',
    PENDING: 'En file d\'attente…',
    RUNNING: 'La musique s\'écrit…',
    PROCESSING: 'La musique s\'écrit…',
    STREAMING: 'Premiers extraits disponibles…',
    SUCCEEDED: 'Composition terminée.',
    SUCCESS: 'Composition terminée.'
  };

  function afficherSuivi(etat) {
    var libelle = LIBELLES[etat.status] || ('État : ' + etat.status);
    var min = Math.floor(etat.elapsed / 60), sec = etat.elapsed % 60;
    suivi(
      '<div class="status-live" style="display:inline-flex;">' + esc(libelle) + '</div>' +
      '<div style="font-family:var(--ff-m); font-size:.6rem; color:var(--dust); margin-top:.6rem;">' +
        min + ' min ' + String(sec).padStart(2, '0') + ' s écoulées</div>'
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
        return '<div style="border:1px solid var(--line-soft); border-radius:6px; padding:1rem; margin-bottom:.8rem;">' +
            '<div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:.7rem;">' +
              '<div style="font-family:var(--ff-d); font-size:1.1rem; color:var(--paper);">' + esc(t.title || 'Version ' + (i + 1)) + '</div>' +
              '<div style="display:flex; gap:.5rem;">' +
                '<a class="btn btn-outline btn-sm" href="' + esc(url) + '" download target="_blank" rel="noopener">Télécharger</a>' +
                '<button class="btn btn-gold btn-sm" data-attacher="' + esc(url) + '" data-titre="' + esc(t.title || '') + '">Attacher</button>' +
              '</div></div>' +
            '<audio controls preload="none" style="width:100%;" src="' + esc(url) + '"></audio></div>';
      }).join('');
    Array.prototype.forEach.call(z.querySelectorAll('[data-attacher]'), function (b) {
      b.addEventListener('click', function () { attacher(b.getAttribute('data-attacher'), b.getAttribute('data-titre')); });
    });
  }

  /* ═══ Rattachement à la commande ═══ */
  async function attacher(url, titre) {
    var ref = window.MELODIA_ATELIER_REF;
    if (!ref) {
      message('Aucune commande n\'est chargée. Ouvrez-en une depuis l\'onglet Commandes (bouton « Composer »), puis réessayez.', 'err');
      return false;
    }
    try {
      await window.MelodiaDB.setAudio(ref, { url: url, title: titre, taskId: etatCourant && etatCourant.taskId });
      /* La console garde une copie des commandes en mémoire : sans ce
         rappel, la fiche afficherait encore l'état d'avant le rattachement. */
      if (window.MELODIA_REFRESH) { try { await window.MELODIA_REFRESH(); } catch (e) {} }
      message('Hommage rattaché à la commande ' + ref + '. Il apparaît maintenant dans la fiche, ici et dans l\'espace de l\'agence.', 'ok');
      if (window.melodiaToast) window.melodiaToast('Hommage rattaché à ' + ref + '.');
      return true;
    } catch (e) {
      message(e.message, 'err');
      return false;
    }
  }

  async function attacherLien() {
    var champ = $('mus-lien');
    var url = (champ.value || '').trim();
    if (!/^https?:\/\/.+/i.test(url)) {
      champ.classList.add('invalid');
      message('Collez un lien complet, commençant par https://', 'err');
      return;
    }
    champ.classList.remove('invalid');
    var titre = ($('mus-lien-titre').value || '').trim();
    if (!titre) {
      var h = $('at-title-h');
      titre = h ? h.textContent.replace(/[«»]/g, '').trim() : '';
      if (/^Les paroles$/i.test(titre)) titre = '';
    }
    var ok = await attacher(url, titre);
    if (ok) {
      /* Aperçu immédiat, pour vérifier qu'on a collé le bon lien */
      await apercuRattache(url, titre);
    }
  }

  /* ═══ Dépôt du fichier ═══ */
  async function deposerFichier(fichier) {
    var ref = window.MELODIA_ATELIER_REF;
    if (!ref) {
      message('Ouvrez d\'abord une commande depuis l\'onglet Commandes (bouton « Composer »).', 'err');
      return;
    }
    var stock = window.MelodiaLivraison;
    var souci = stock.verifier(fichier);
    if (souci) { message(souci, 'err'); return; }

    var zone = $('mus-progres');
    var barre = zone.querySelector('span');
    var pct = zone.querySelector('.depot-pct');
    zone.hidden = false;
    barre.style.width = '0%'; pct.textContent = '0 %';
    message('Envoi de « ' + fichier.name +' » (' + (fichier.size / 1048576).toFixed(1) + ' Mo)…', 'info');

    try {
      var res = await stock.deposer(fichier, ref, function (p) {
        barre.style.width = p + '%';
        pct.textContent = p + ' %';
      });
      var titre = ($('mus-lien-titre').value || '').trim();
      if (!titre) {
        var h = $('at-title-h');
        titre = h ? h.textContent.replace(/[«»]/g, '').trim() : '';
        if (/^Les paroles$/i.test(titre)) titre = fichier.name.replace(/\.[a-z0-9]+$/i, '');
      }
      var ok = await attacher(res.url, titre);
      zone.hidden = true;
      if (ok) {
        message(res.local
          ? 'MP3 enregistré sur cet appareil et rattaché à la commande. Il est à joindre au courriel de livraison ci-dessous.'
          : 'MP3 envoyé et rattaché à la commande. Le client dispose d\'un lien permanent.', 'ok');
        await apercuRattache(res.url, titre);
      }
    } catch (e) {
      zone.hidden = true;
      message(e.message, 'err');
    }
  }

  /* ═══ Aperçu de l'hommage rattaché ═══ */
  async function apercuRattache(url, titre) {
    var z = $('mus-titres');
    if (!z) return;
    var stock = window.MelodiaLivraison;
    var local = stock.estLocal(url);
    var lecture = await stock.urlEcoute(url);

    z.innerHTML =
      '<div class="mono" style="margin-bottom:.7rem;">Hommage rattaché' + (local ? ' · sur cet appareil' : '') + '</div>' +
      '<div style="border:1px solid var(--line-strong); border-radius:6px; padding:1rem;">' +
        '<div style="font-family:var(--ff-d); font-size:1.1rem; color:var(--paper); margin-bottom:.7rem;">' +
          esc(titre || 'Hommage') + '</div>' +
        (lecture && (local || estAudio(url))
          ? '<audio controls preload="none" style="width:100%;" src="' + esc(lecture) + '"></audio>'
          : '<a class="btn btn-outline btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener">Ouvrir le lien</a>') +
      '</div>';
    await rendreLivraison();
  }

  /* ═══ Livraison au client ═══ */
  async function rendreLivraison() {
    var hote = $('mus-livraison');
    if (!hote) return;
    var ref = window.MELODIA_ATELIER_REF;
    var cmd = (window.ORDERS || []).filter(function (o) { return o.ref === ref; })[0];
    if (!cmd || !cmd.audio_url) { hote.innerHTML = ''; return; }

    var stock = window.MelodiaLivraison;
    var lettre = stock.composer(cmd, cmd.audio_url);

    hote.innerHTML =
      '<div style="border:1px solid var(--line-strong); border-radius:6px; padding:1.3rem;">' +
        '<div class="mono" style="color:var(--or-patina); margin-bottom:.9rem;">Étape 3 — livrer à la famille</div>' +
        '<div class="wz-line" style="padding:.3rem 0;"><span>Destinataire</span><b>' + esc(cmd.user_email || '—') + '</b></div>' +
        '<div class="wz-line" style="padding:.3rem 0; margin-bottom:1rem;"><span>Commande</span><b>' + esc(cmd.ref) + ' · ' + esc(cmd.defunt || '') + '</b></div>' +
        (lettre.local
          ? '<div class="form-msg info" style="display:block; margin-bottom:1rem;">Le fichier est sur cet appareil : téléchargez-le, puis joignez-le au message.</div>'
          : '') +
        '<div class="field">' +
          '<label class="field-label" for="liv-corps">Message — modifiable avant envoi</label>' +
          '<textarea class="field-area" id="liv-corps" style="min-height:260px; font-size:.88rem; line-height:1.7;">' + esc(lettre.corps) + '</textarea>' +
        '</div>' +
        '<div style="display:flex; gap:.7rem; flex-wrap:wrap;">' +
          (lettre.local ? '<button class="btn btn-outline" id="liv-dl">Télécharger le MP3</button>' : '') +
          '<button class="btn btn-gold" id="liv-envoi" style="flex:1; min-width:180px;">Ouvrir ma messagerie</button>' +
          '<button class="btn btn-ghost" id="liv-copie">Copier le message</button>' +
        '</div>' +
        '<p style="font-size:.78rem; color:var(--ash); margin-top:.9rem; line-height:1.6;">' +
          'Après envoi, pensez à passer la commande au statut <b style="color:var(--bone);">Livrée</b> depuis l\'onglet Commandes.</p>' +
      '</div>';

    var envoi = $('liv-envoi');
    envoi.addEventListener('click', function () {
      stock.ouvrirMessagerie(cmd.user_email, lettre.sujet, $('liv-corps').value);
      message('Votre messagerie s\'ouvre avec le message pré-rempli.', 'info');
    });
    $('liv-copie').addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText($('liv-corps').value);
      message('Message copié.', 'ok');
    });
    var dl = $('liv-dl');
    if (dl) dl.addEventListener('click', async function () {
      var enr = await stock.lireLocal(ref);
      if (!enr) { message('Fichier introuvable sur cet appareil — redéposez-le.', 'err'); return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(enr.blob);
      a.download = enr.nom || (ref + '.mp3');
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    });
  }

  /* ═══ Composition automatique ═══ */
  async function composer() {
    var paroles = ($('at-lyrics') || {}).value || '';
    var style = ($('at-style-prompt') || {}).value || '';
    var instru = $('mus-instru') && $('mus-instru').checked;
    if (!paroles.trim() && !instru) {
      message('Écrivez d\'abord les paroles, ou cochez « version instrumentale ».', 'err');
      return;
    }
    var h = $('at-title-h');
    var titre = h ? h.textContent.replace(/[«»]/g, '').trim() : '';
    if (!titre || /^Les paroles$/i.test(titre)) titre = 'Hommage Melodia';

    var go = $('mus-go'), stop = $('mus-stop');
    go.disabled = true; go.textContent = 'Envoi en cours…';
    message('');
    $('mus-titres').innerHTML = '';
    try {
      var lancement = await window.MelodiaAI.music({
        title: titre, lyrics: paroles, style_prompt: style, instrumental: instru,
        negative_tags: ($('mus-exclure') || {}).value || '',
        vocal_gender: ($('mus-voix') || {}).value || ''
      });
      etatCourant = { taskId: lancement.taskId, kind: lancement.kind || 'song', title: titre,
                      ref: window.MELODIA_ATELIER_REF || '', startedAt: Date.now() };
      sauver(etatCourant);
      go.textContent = 'Composition en cours…';
      stop.style.display = '';
      await surveiller(lancement.taskId, lancement.kind);
    } catch (e) {
      message(e.message + (e.hint ? ' ' + e.hint : ''), 'err');
      suivi('');
      go.disabled = false; go.textContent = 'Composer la musique';
      stop.style.display = 'none';
    }
  }

  var abandon = null;

  async function surveiller(taskId, kind) {
    var go = $('mus-go'), stop = $('mus-stop');
    enCours = true;
    abandon = { aborted: false };
    try {
      var fin = await window.MelodiaAI.musicPoll(taskId, afficherSuivi, { signal: abandon, kind: kind || 'song' });
      suivi('');
      afficherTitres(fin.tracks, false);
      message('Composition terminée : écoutez, puis attachez la version retenue.', 'ok');
      sauver(null);
    } catch (e) {
      suivi('');
      message(e.message, e.failed ? 'err' : 'info');
      if (e.failed) { sauver(null); etatCourant = null; }
    } finally {
      enCours = false;
      if (go) { go.disabled = false; go.textContent = 'Composer la musique'; }
      if (stop) stop.style.display = 'none';
    }
  }

  /* ═══ Montage ═══ */
  async function mount() {
    var hote = $('at-music');
    if (!hote) return;
    if (!config) config = await window.MelodiaAI.musicConfig();
    hote.innerHTML = panneau();

    $('mus-suno').addEventListener('click', function () {
      var l = ($('at-lyrics') || {}).value || '';
      if (!l.trim()) { message('Écrivez d\'abord les paroles, à gauche.', 'err'); return; }
      var h = $('at-title-h');
      window.MelodiaAI.manualExport(
        h ? h.textContent.replace(/[«»]/g, '').trim() : 'Hommage Melodia',
        l, ($('at-style-prompt') || {}).value || ''
      );
      message('Brief copié. Suno s\'ouvre : mode Custom, collez les paroles puis le style. Revenez ensuite coller le lien ci-dessous.', 'info');
    });

    $('mus-attacher').addEventListener('click', attacherLien);
    $('mus-lien').addEventListener('keydown', function (e) { if (e.key === 'Enter') attacherLien(); });

    /* Zone de dépôt : clic, clavier et glisser-déposer */
    var depot = $('mus-depot'), champFichier = $('mus-fichier');
    depot.addEventListener('click', function () { champFichier.click(); });
    depot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); champFichier.click(); }
    });
    champFichier.addEventListener('change', function () {
      if (champFichier.files[0]) deposerFichier(champFichier.files[0]);
      champFichier.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      depot.addEventListener(ev, function (e) { e.preventDefault(); depot.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      depot.addEventListener(ev, function (e) { e.preventDefault(); depot.classList.remove('over'); });
    });
    depot.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files[0];
      if (f) deposerFichier(f);
    });

    /* Si la commande a déjà un hommage, on reprend au bon endroit */
    var refOuverte = window.MELODIA_ATELIER_REF;
    if (refOuverte) {
      var dejaLa = (window.ORDERS || []).filter(function (o) { return o.ref === refOuverte; })[0];
      if (dejaLa && dejaLa.audio_url) apercuRattache(dejaLa.audio_url, dejaLa.audio_title);
    }

    if (config.configured) {
      $('mus-go').addEventListener('click', composer);
      $('mus-stop').addEventListener('click', function () {
        if (abandon) abandon.aborted = true;
        message('Suivi interrompu. La composition continue côté service : rouvrez l\'atelier pour la récupérer.', 'info');
      });

      var reprise = relire();
      if (reprise && reprise.taskId && !enCours) {
        var age = Math.round((Date.now() - (reprise.startedAt || 0)) / 1000);
        if (age > 3600) { sauver(null); return; }
        etatCourant = reprise;
        message('Reprise du suivi d\'une composition lancée il y a ' + Math.round(age / 60) + ' min…', 'info');
        $('mus-go').disabled = true;
        $('mus-go').textContent = 'Composition en cours…';
        $('mus-stop').style.display = '';
        surveiller(reprise.taskId, reprise.kind);
      }
    }
  }

  window.MelodiaAtelier = { mount: mount };
})();
