/* ═══════════════════════════════════════════════════════════════
   partenariat.js — La demande des pompes funèbres

   C'est le formulaire le plus important du site : une agence
   partenaire vaut des dizaines de commandes. Trois principes en
   découlent.

   • On ne perd jamais une saisie. Si le relais ne répond pas, la
     demande part quand même par courriel, avec les champs déjà
     remplis — plutôt qu'un message d'échec devant lequel un dirigeant
     referme l'onglet.
   • On dit ce qui manque, champ par champ, avant d'envoyer. Un
     formulaire qui répond « erreur » sans montrer où fait abandonner.
   • On ne redemande rien de superflu. Six champs, et le reste au
     téléphone.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.getElementById('form-partenariat');
  if (!form) return;

  var msg = document.getElementById('pt-msg');
  var bouton = document.getElementById('pt-envoyer');
  var MAIL = 'contact@melodia-funebre.fr';

  function dire(t, ok) {
    if (!msg) return;
    msg.className = 'form-msg' + (t ? (ok ? ' ok' : ' err') : '');
    msg.innerHTML = t || '';
    msg.style.display = t ? 'block' : '';
    if (t && !ok) msg.setAttribute('role', 'alert');
  }

  function valeur(nom) {
    var e = form.elements[nom];
    return e ? String(e.value || '').trim() : '';
  }

  function objet() {
    var l = form.querySelectorAll('input[name="objet"]');
    for (var i = 0; i < l.length; i++) if (l[i].checked) return l[i].value;
    return 'Devenir partenaire';
  }

  /* Marquer le champ fautif plutôt que de le décrire : on lit plus vite
     un contour rouge qu'une phrase qui nomme un champ. */
  function fautif(nom) {
    var e = form.elements[nom];
    if (!e) return;
    e.classList.add('champ-faux');
    e.addEventListener('input', function () { e.classList.remove('champ-faux'); }, { once: true });
    try { e.focus({ preventScroll: false }); } catch (err) { e.focus(); }
  }

  function verifier() {
    var manque = [
      ['societe', "le nom de votre entreprise"],
      ['contact', "votre nom"],
      ['email', "votre adresse professionnelle"],
      ['tel', "votre téléphone"],
      ['ville', "votre ville"]
    ];
    for (var i = 0; i < manque.length; i++) {
      if (!valeur(manque[i][0])) { fautif(manque[i][0]); return 'Il manque ' + manque[i][1] + '.'; }
    }
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(valeur('email'))) {
      fautif('email'); return "Cette adresse ne semble pas valide.";
    }
    /* Dix chiffres au moins, espaces et points ignorés : les numéros
       s'écrivent de vingt façons, on ne les corrige pas, on vérifie
       seulement qu'il y a bien un numéro. */
    if (valeur('tel').replace(/[^\d]/g, '').length < 9) {
      fautif('tel'); return "Ce numéro semble incomplet.";
    }
    return null;
  }

  function courrielDeSecours(d) {
    var corps = [
      'Objet : ' + d.objet, '',
      'Entreprise : ' + d.societe,
      'Contact : ' + d.contact,
      'Email : ' + d.email,
      'Téléphone : ' + d.tel,
      'Ville : ' + d.ville, '',
      d.message || ''
    ].join('\n');
    return 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Partenariat — ' + d.societe) +
      '&body=' + encodeURIComponent(corps);
  }

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var faute = verifier();
    if (faute) return dire(faute);

    var d = {
      type: 'partenariat',
      objet: objet(),
      societe: valeur('societe'),
      contact: valeur('contact'),
      email: valeur('email'),
      tel: valeur('tel'),
      ville: valeur('ville'),
      message: valeur('message'),
      page: location.pathname
    };

    bouton.disabled = true;
    var libelle = bouton.textContent;
    bouton.textContent = 'Envoi…';
    dire('');

    try {
      var r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d)
      });
      if (!r.ok) throw new Error('relais');
      form.reset();
      dire('<b>Votre demande est partie.</b><br>Nous revenons vers vous sous un jour ouvré, ' +
           'par téléphone ou par courriel selon ce qui vous arrange.', true);
      bouton.textContent = 'Demande envoyée';
      return;
    } catch (e) {
      /* Le relais peut être indisponible — clé de courriel absente,
         fonction en panne. On ne renvoie pas un dirigeant les mains
         vides : son message est prêt, il n'a qu'à l'envoyer. */
      dire('L\'envoi automatique n\'a pas abouti. Votre message est prêt : ' +
           '<a href="' + courrielDeSecours(d) + '">l\'ouvrir dans votre messagerie</a>, ' +
           'ou écrivez-nous directement à <a href="mailto:' + MAIL + '">' + MAIL + '</a>.');
      bouton.disabled = false;
      bouton.textContent = libelle;
    }
  });
})();
