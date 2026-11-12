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

  test('clé service JWT', o.cleServiceValide('eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.sig') === true);
  test('clé service sb_secret', o.cleServiceValide('sb_secret_xxxxxxxxxxxxxxxxxxxx') === true);
  test('clé service vide', o.cleServiceValide('') === false && o.cleServiceValide('   ') === false);
  test('clé service URL tableau de bord', o.cleServiceValide('https://supabase.com/dashboard/project/awvgmkoozerfggdvvubi/settings/api-keys') === false);
  test('journal 200', o.interpreterLectureJournal(200, '[]').ok === true);
  test('journal table absente', o.interpreterLectureJournal(404, '{"code":"PGRST205"}').absent === true);
  test('journal Invalid API key', (() => { const r = o.interpreterLectureJournal(401, '{"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}'); return r.ok === false && r.absent === false; })());
  test('journal permission denied n’est pas une table absente', o.interpreterLectureJournal(401, '{"code":"42501","message":"permission denied for table envois_prospect"}').absent === false);

  test('catalogue 17 brochures', o.BROCHURE_IDS && o.BROCHURE_IDS.length === 17 &&
    o.BROCHURES['pompes-funebres'] && o.BROCHURES.marbriers && o.BROCHURES.crematoriums);
  test('libellé Pompes funèbres', o.BROCHURES['pompes-funebres'].label === 'Brochure Pompes funèbres');
  test('libellé Marbriers', o.BROCHURES.marbriers.label === 'Brochure Marbriers');
  test('libellé Crématoriums', o.BROCHURES.crematoriums.label === 'Brochure Crématoriums');
  test('nouvelles éditions ajoutées sans remplacer',
    o.BROCHURES['pompes-funebres'].chemin === 'documents/melodia-brochure-pompes-funebres.pdf' &&
    o.BROCHURES['pompes-funebres-v2'].chemin === 'documents/melodia-brochure-pompes-funebres-v2.pdf' &&
    o.BROCHURES['marbriers-v2'] && o.BROCHURES['crematoriums-v2'] &&
    o.BROCHURES['prestige-offrande'] && o.BROCHURES['prestige-ecoute'] &&
    o.BROCHURES['prestige-art'] && o.BROCHURES['souvenirs-qui-resonnent'] && o.BROCHURES.ceremonie);
  const nouvelles = o.resoudreBrochures(['prestige-offrande', 'prestige-ecoute', 'marbriers-v2']);
  test('brochures prestige acceptées', nouvelles.ok && nouvelles.ids.join(',') === 'prestige-offrande,prestige-ecoute,marbriers-v2');
  const surreal = o.resoudreBrochures(['prestige-art', 'souvenirs-qui-resonnent', 'ceremonie']);
  test('brochures surréalistes acceptées', surreal.ok && surreal.ids.join(',') === 'prestige-art,souvenirs-qui-resonnent,ceremonie');
  test('libellé Prestige œuvre d’art', o.BROCHURES['prestige-art'].label === 'Brochure prestige — Œuvre d’art (pompes funèbres)');
  test('libellé Souvenirs qui résonnent', o.BROCHURES['souvenirs-qui-resonnent'].label === 'Brochure Souvenirs qui résonnent (familles)');
  test('libellé Cérémonie', o.BROCHURES.ceremonie.label === 'Brochure Cérémonie (pompes funèbres & officiants)');
  test('orthographe Melodia Funèbre absente des libellés fautifs',
    !Object.keys(o.BROCHURES).some((id) => /Mélodia|Mélodie|Funebre(?!-)/.test(o.BROCHURES[id].label)));

  const refus = o.resoudreBrochures(['inconnue']);
  test('allowlist refuse un id inconnu', refus.ok === false && refus.ids.length === 0);

  const aucune = o.resoudreBrochures([]);
  test('aucune brochure acceptée', aucune.ok === true && aucune.ids.length === 0);

  const une = o.resoudreBrochures(['marbriers']);
  test('une brochure', une.ok && une.ids.join(',') === 'marbriers');

  const plusieurs = o.resoudreBrochures(['pompes-funebres', 'crematoriums', 'pompes-funebres']);
  test('plusieurs brochures dédoublonnées', plusieurs.ok && plusieurs.ids.join(',') === 'pompes-funebres,crematoriums');

  const compatOn = o.resoudreBrochures(undefined, true);
  test('compat joindreBrochure true', compatOn.ok && compatOn.ids.join(',') === 'professionnels');
  const compatOff = o.resoudreBrochures(undefined, false);
  test('compat joindreBrochure false', compatOff.ok && compatOff.ids.length === 0);

  test('suggestion marbrier', o.brochureSuggeree({ societe: 'Marbriers Dupont' }) === 'marbriers');
  test('suggestion crématorium', o.brochureSuggeree({ societe: 'Crématorium de Lyon' }) === 'crematoriums');
  test('suggestion pompes par catégorie', o.brochureSuggeree({ categorie: 'pompes' }) === 'pompes-funebres');
  test('suggestion pompes par type', o.brochureSuggeree({ type: 'pompes funèbres' }) === 'pompes-funebres');
  test('suggestion famille sans type', o.brochureSuggeree({ categorie: 'famille', societe: '' }) === null);

  const mentionUne = o.mentionBrochure(une.brochures);
  test('mention une brochure', /brochure Pompes funèbres est jointe/i.test(o.mentionBrochure(o.resoudreBrochures(['pompes-funebres']).brochures)) &&
    mentionUne.indexOf(o.SITE + '/' + o.BROCHURES.marbriers.chemin) !== -1);
  const mentionPlus = o.mentionBrochure(plusieurs.brochures);
  test('mention plusieurs brochures', /Les brochures suivantes sont jointes/.test(mentionPlus) &&
    mentionPlus.indexOf('Brochure Pompes funèbres') !== -1 && mentionPlus.indexOf('Brochure Crématoriums') !== -1);
  test('mention vide', o.mentionBrochure([]) === '' && o.avecBrochure('Bonjour.', []) === 'Bonjour.');
  test('mention compat true', /brochure professionnelle est jointe/.test(o.mentionBrochure(true)));

  /* Alignement du catalogue exposé par la console. */
  const fs = require('fs');
  const srcMails = fs.readFileSync(require('path').join(__dirname, '../assets/js/collaborateur-mails.js'), 'utf8');
  test('console : mêmes ids de brochures', BROCHURE_IDS_MAILS(srcMails).join(',') === o.BROCHURE_IDS.join(','));
  test('console : libellés identiques',
    srcMails.indexOf('Brochure Pompes funèbres') !== -1 &&
    srcMails.indexOf('Brochure Marbriers') !== -1 &&
    srcMails.indexOf('Brochure Crématoriums') !== -1 &&
    srcMails.indexOf('Brochure prestige « L’Offrande » — pompes funèbres') !== -1 &&
    srcMails.indexOf('Brochure prestige « L’Écoute » — professionnels') !== -1 &&
    srcMails.indexOf('Brochure prestige — Œuvre d’art (pompes funèbres)') !== -1 &&
    srcMails.indexOf('Brochure Souvenirs qui résonnent (familles)') !== -1 &&
    srcMails.indexOf('Brochure Cérémonie (pompes funèbres & officiants)') !== -1);

  const fsPdf = require('fs');
  ['documents/melodia-brochure-pompes-funebres.pdf',
   'documents/melodia-brochure-marbriers.pdf',
   'documents/melodia-brochure-crematoriums.pdf',
   'documents/melodia-brochure-pompes-funebres-v2.pdf',
   'documents/melodia-brochure-marbriers-v2.pdf',
   'documents/melodia-brochure-crematoriums-v2.pdf',
   'documents/melodia-brochure-prestige-offrande.pdf',
   'documents/melodia-brochure-prestige-ecoute.pdf',
   'documents/melodia-brochure-prestige-art.pdf',
   'documents/melodia-brochure-souvenirs-qui-resonnent.pdf',
   'documents/melodia-brochure-ceremonie.pdf',
   'documents/melodia-brochure-ecoute-exemples.pdf',
   'documents/melodia-presentation-agences-partenaires.pdf',
   'documents/melodia-offre-pro.pdf',
   'documents/melodia-plaquette-ecoute-prestige.pdf',
   'documents/melodia-fiche-contact-julie-serve.pdf'].forEach((f) => {
    const buf = fsPdf.readFileSync(require('path').join(__dirname, '..', f));
    const plafond = /presentation-agences|offre-pro|plaquette-ecoute|fiche-contact/.test(f) ? 2.5
      : /prestige-art|souvenirs-qui-resonnent|ceremonie|ecoute-exemples/.test(f) ? 4
      : (/-v2|prestige/.test(f) ? 2 : 3);
    test('PDF ' + f, buf.slice(0, 5).toString() === '%PDF-' && buf.length > 100 * 1024 && buf.length < plafond * 1024 * 1024);
  });

  return ok;
}

function BROCHURE_IDS_MAILS(src) {
  const m = src.match(/var BROCHURE_IDS = \[([^\]]+)\]/);
  if (!m) return [];
  return m[1].split(',').map((x) => x.replace(/['"\s]/g, '')).filter(Boolean);
}

if (require.main === module) process.exit(run() ? 0 : 1);
module.exports = run;
