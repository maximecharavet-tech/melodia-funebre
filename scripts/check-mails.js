/* Vérifie la bibliothèque Julie, le CSV, le PDF et la signature Resend. */
'use strict';

const crypto = require('crypto');
const o = require('../lib/prospect-outils.cjs');
const pack = require('../assets/js/modeles-julie.js');
const packJson = require('../assets/data/modeles-julie.json');
const modeles = require('../lib/modeles-prospect.cjs');

function run() {
  let ok = true;
  function test(nom, cond, detail) {
    if (cond) console.log('  ok   ' + nom);
    else { console.error('  ECHEC ' + nom + (detail ? ' — ' + detail : '')); ok = false; }
  }

  test('civilité vide', o.civilite('') === '' && o.civilite('  ') === '');
  test('civilité avec nom', o.civilite('Marie Dupont') === ' Marie Dupont');

  const plein = o.varsNormalisees({ nom: 'Marie Dupont', societe: 'Pompes Dupont', ville: 'Lyon', email: 'marie@dupont.fr' });
  test('vars agence', plein.agence === 'Pompes Dupont' && plein.ville_rel === ' à Lyon' && plein.civilite === ' Marie Dupont');
  const vide = o.varsNormalisees({});
  test('vars par défaut', vide.agence === 'votre maison' && vide.ville_rel === '' && vide.civilite === '');

  const debut = o.remplir('Bonjour{civilite},', { nom: 'Jean' });
  test('remplir Bonjour Jean', debut === 'Bonjour Jean,');
  test('remplir Bonjour seul', o.remplir('Bonjour{civilite},', {}) === 'Bonjour,');

  const ids = (pack.modeles || []).map((m) => m.id);
  test('7 modèles Julie', ids.length === 7, 'trouvés : ' + ids.join(', '));
  const attendus = ['pf-premier-contact', 'pf-relance-j4', 'pf-relance-j10', 'pf-apres-appel', 'pf-partenariat', 'pf-brochure', 'pf-merci'];
  test('ids stables', JSON.stringify(ids) === JSON.stringify(attendus));
  test('JSON et UMD alignés', JSON.stringify(pack.modeles.map((m) => m.id + m.objet + m.texte)) === JSON.stringify(packJson.modeles.map((m) => m.id + m.objet + m.texte)));

  const compose = modeles.composerModele('pf-premier-contact', { nom: 'Marie Dupont', societe: 'Pompes Dupont', ville: 'Lyon' });
  test('composerModele sujet', !!(compose && compose.sujet.indexOf('Pompes Dupont') !== -1 && compose.sujet.indexOf('{') === -1));
  test('composerModele texte', !!(compose && compose.texte.indexOf('Marie Dupont') !== -1 && compose.texte.indexOf('Lyon') !== -1));


  pack.modeles.forEach((m) => {
    const sujet = o.objetDe(m, { nom: 'Marie Dupont', societe: 'Pompes Dupont', ville: 'Lyon' });
    const sujetNu = o.objetDe(m, { nom: 'Marie' });
    const texte = o.avecBrochure(o.remplir(m.texte, { nom: 'Marie Dupont', societe: 'Pompes Dupont', ville: 'Lyon' }), true);
    test(m.id + ' objet personnalisé', sujet.length > 8 && sujet.indexOf('{') === -1, sujet);
    test(m.id + ' objet sans agence', sujetNu.length > 8 && sujetNu.indexOf('{') === -1 && sujetNu.indexOf('votre maison') === -1, sujetNu);
    test(m.id + ' texte sans variable', texte.indexOf('{') === -1, texte.match(/\{[^}]+\}/g) && texte.match(/\{[^}]+\}/g).join(', '));
    test(m.id + ' accentué', /[éèêàùçîïôûÉÈÀÇ]/.test(m.texte + m.nom + m.quand));
  });

  const csv = o.parseCsv('nom,email,société,ville\nMarie Dupont, marie@dupont.fr, Pompes Dupont, Lyon\nPaul,paul@x.fr\nMarie 2,marie@dupont.fr,Autre\nbadline\n,invalide@\n');
  test('CSV 2 valides', csv.ok.length === 2 && csv.ok[0].email === 'marie@dupont.fr' && csv.ok[0].societe === 'Pompes Dupont');
  test('CSV doublon ignoré', csv.ignores === 1);
  test('CSV lignes invalides', csv.erreurs.length >= 1);

  const csv2 = o.parseCsv('Jean Martin; jean@agence.fr; Maison Martin\ncontact@seul.fr');
  test('CSV point-virgule et e-mail seul', csv2.ok.length === 2 && csv2.ok[0].nom === 'Jean Martin' && csv2.ok[1].email === 'contact@seul.fr');

  test('PDF magique', o.validerPdf(Buffer.from('%PDF-1.4 rest')).ok === true);
  test('PDF refusé si texte', o.validerPdf(Buffer.from('not a pdf')).ok === false);
  test('PDF trop lourd', o.validerPdf(Buffer.alloc(o.PDF_MAX + 1, 37), o.PDF_MAX).ok === false);

  test('statut ouvert après délivré', o.rangerStatut('delivre', 'ouvert') === 'ouvert');
  test('statut ne redescend pas', o.rangerStatut('ouvert', 'envoye') === 'ouvert');
  test('rejet terminal', o.rangerStatut('ouvert', 'rejete') === 'rejete');
  test('rejet ne s’efface pas', o.rangerStatut('rejete', 'ouvert') === 'rejete');
  test('événement opened', o.evenementVersStatut('email.opened') === 'ouvert');
  test('événement inconnu', o.evenementVersStatut('email.unknown') === null);

  const secret = 'whsec_' + Buffer.from('testsecret1234567890abcd').toString('base64');
  const id = 'msg_1';
  const ts = String(Math.floor(Date.now() / 1000));
  const payload = '{"type":"email.opened","data":{"email_id":"abc"}}';
  const cle = Buffer.from(secret.slice(6), 'base64');
  const sig = 'v1,' + crypto.createHmac('sha256', cle).update(id + '.' + ts + '.' + payload).digest('base64');
  test('signature Resend valide', o.verifierSignatureResend(payload, { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': sig }, secret).ok);
  test('signature Resend refusée', o.verifierSignatureResend(payload, { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': 'v1,xxxx' }, secret).ok === false);
  test('signature trop ancienne', o.verifierSignatureResend(payload, { 'svix-id': id, 'svix-timestamp': String(Math.floor(Date.now() / 1000) - 1000), 'svix-signature': sig }, secret).ok === false);
  test('secret absent', o.verifierSignatureResend(payload, { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': sig }, '').ok === false);

  return ok;
}

if (require.main === module) process.exit(run() ? 0 : 1);
module.exports = run;
