/*!
 * julie-proposition.js — Console Julie · proposition de partenariat (PDF, une page).
 *
 * Depuis la fiche agence : Julie saisit le nombre de cérémonies par an et une
 * part prudente de familles, choisit trois œuvres du catalogue, puis télécharge
 * un A4 sobre au nom de l'agence. Prix lus dans content.json (une seule source),
 * part agence 60 % (chiffre publié). L'estimation est marquée comme telle.
 *
 * Le PDF est écrit dans le navigateur par l'écrivain maison
 * (assets/js/pro/pdf.js, sans bibliothèque) ; les QR par assets/js/qr.js.
 * Rien n'est envoyé : le fichier est téléchargé, Julie décide de son usage.
 *
 * License: internal.
 */
(function () {
  'use strict';

  var V = window.MelodiaVente;
  var J = window.MelodiaJulie;
  var A = window.MelodiaJulieActions;
  if (!V || !J || !A) return;
  var esc = J.esc;

  var SITE = 'https://melodia-funebre.fr';
  var contenuCache = null;

  function toast(m) { if (window.melodiaToast) window.melodiaToast(m); }
  function chargerContenu() {
    if (contenuCache) return Promise.resolve(contenuCache);
    return fetch('/assets/data/content.json', { cache: 'force-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Catalogue illisible.');
      return r.json();
    }).then(function (d) { contenuCache = d; return d; });
  }
  function signature() {
    var u = (window.MelodiaAuth && window.MelodiaAuth.current()) || {};
    return window.MelodiaSignature ? window.MelodiaSignature.pour(u) : { nom: u.name || 'Melodia Funèbre', email: u.email || '', role: '', tel: '', code: '' };
  }
  function nomFichier(nom) { return 'melodia-proposition-' + V.limace(nom || 'agence') + '.pdf'; }
  function dateLongue() {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date());
  }

  function formHTML(p, offres, oeuvres) {
    var choix = oeuvres.slice(0, 3).map(function (o) { return o.id; });
    return '' +
      '<div class="jv-voile" data-jv-fermer></div>' +
      '<div class="jv-dialogue jv-dialogue-large" role="dialog" aria-modal="true" aria-labelledby="jv-prop-titre">' +
        '<div class="jv-dialogue-sur">' + esc(p.nom || 'Agence') + '</div>' +
        '<h2 class="jv-dialogue-titre" id="jv-prop-titre">Proposition de partenariat</h2>' +
        '<p class="jv-dialogue-note">Une page A4 au nom de l’agence. Les prix sont ceux du site ; l’estimation est indiquée comme telle.</p>' +
        '<form class="jv-prop" novalidate>' +
          '<div class="field-row">' +
            '<div class="field"><label class="field-label" for="jv-prop-cer">Cérémonies par an (facultatif)</label>' +
              '<input class="field-input" id="jv-prop-cer" inputmode="numeric" maxlength="4" placeholder="ex. 120"></div>' +
            '<div class="field"><label class="field-label" for="jv-prop-part">Part de familles (%)</label>' +
              '<input class="field-input" id="jv-prop-part" inputmode="decimal" maxlength="4" value="5"></div>' +
          '</div>' +
          '<p class="jv-prop-calcul" id="jv-prop-calcul" aria-live="polite"></p>' +
          '<fieldset class="jv-prop-oeuvres"><legend class="field-label">Trois œuvres à faire écouter</legend>' +
            oeuvres.map(function (o) {
              return '<label class="jv-choix-item"><input type="checkbox" name="oeuvre" value="' + esc(o.id) + '"' + (choix.indexOf(o.id) >= 0 ? ' checked' : '') + '>' +
                '<span>' + esc(o.titre) + (o.style ? ' <small>· ' + esc(o.style) + '</small>' : '') + '</span></label>';
            }).join('') +
          '</fieldset>' +
          '<p class="jv-erreur" role="alert" hidden></p>' +
          '<div class="jv-dialogue-pied">' +
            '<button type="button" class="btn btn-outline" data-jv-fermer>Annuler</button>' +
            '<button type="submit" class="btn btn-gold">Télécharger le PDF</button>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  async function produire(p, donnees) {
    var mod = await import('/assets/js/pro/pdf.js');
    var pdf = new mod.Pdf();
    var qr = window.MelodiaQR && window.MelodiaQR.matrice ? function (t) { return window.MelodiaQR.matrice(t, { niveau: 'M' }); } : null;
    V.dessinerProposition(pdf, donnees, qr);
    var blob = pdf.blob();
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nomFichier(p.nom);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    return blob;
  }

  async function ouvrir(siret, owner) {
    var P = window.MelodiaProspects;
    var p = null;
    try { p = P ? await P.une(siret, owner) : null; } catch (e) { p = null; }
    if (!p) { toast('Fiche introuvable.'); return; }
    var contenu;
    try { contenu = await chargerContenu(); } catch (e) { toast(e.message); return; }
    var sig = signature();
    var offres = V.offresDepuisContenu(contenu);
    var oeuvres = V.oeuvresDepuisContenu(contenu, SITE, sig.code);

    var hote = document.createElement('div');
    hote.className = 'jv-hote';
    hote.innerHTML = formHTML(p, offres, oeuvres);
    document.body.appendChild(hote);
    var form = hote.querySelector('form');
    var err = hote.querySelector('.jv-erreur');
    function fermer() { document.removeEventListener('keydown', touche); hote.remove(); }
    function touche(ev) { if (ev.key === 'Escape') fermer(); }
    document.addEventListener('keydown', touche);

    function calcul() {
      return V.calculerProposition({
        offres: offres,
        ceremonies: String(hote.querySelector('#jv-prop-cer').value || '').replace(/\D/g, ''),
        part: String(hote.querySelector('#jv-prop-part').value || '').replace(',', '.')
      });
    }
    function majCalcul() {
      var c = calcul();
      hote.querySelector('#jv-prop-calcul').textContent = c.ceremonies && c.reference
        ? c.ceremonies + ' cérémonies × ' + String(c.part).replace('.', ',') + ' % = ' + c.familles + ' œuvre' + (c.familles > 1 ? 's' : '') + ' ' + c.reference.nom +
          ' par an, soit environ ' + V.euros(c.parAn) + ' pour l’agence (estimation).'
        : 'Sans nombre de cérémonies, le PDF montre seulement ce que l’agence conserve sur chaque offre.';
    }
    majCalcul();
    hote.addEventListener('input', majCalcul);
    hote.addEventListener('click', function (ev) { if (ev.target.closest('[data-jv-fermer]')) fermer(); });
    hote.addEventListener('change', function (ev) {
      if (ev.target.name !== 'oeuvre') return;
      var coches = hote.querySelectorAll('input[name="oeuvre"]:checked');
      if (coches.length > 3) { ev.target.checked = false; err.textContent = 'Trois œuvres au plus.'; err.hidden = false; }
      else err.hidden = true;
    });
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var ids = Array.prototype.map.call(hote.querySelectorAll('input[name="oeuvre"]:checked'), function (x) { return x.value; });
      var choisies = oeuvres.filter(function (o) { return ids.indexOf(o.id) >= 0; }).slice(0, 3);
      var bouton = form.querySelector('[type="submit"]');
      bouton.disabled = true;
      try {
        await produire(p, {
          agence: { nom: p.nom || p.enseigne || '', ville: p.ville || '' },
          date: dateLongue(),
          calcul: calcul(),
          oeuvres: choisies,
          contact: { nom: sig.nom, role: sig.role, email: sig.email, tel: sig.tel }
        });
        try {
          await A.modifier(p.siret, function () {
            return { quoi: 'Proposition PDF préparée', detail: choisies.map(function (o) { return o.titre; }).join(', ') };
          }, p.owner);
        } catch (e) { /* le PDF est là ; la note suivra */ }
        toast('Proposition téléchargée.');
        fermer();
      } catch (e) {
        bouton.disabled = false;
        err.textContent = 'PDF non produit : ' + ((e && e.message) || 'erreur');
        err.hidden = false;
      }
    });
    setTimeout(function () { var c = hote.querySelector('#jv-prop-cer'); if (c) c.focus(); }, 30);
  }

  window.MelodiaJulieProposition = { ouvrir: ouvrir };
})();
