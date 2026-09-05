// ═══════════════════════════════════════════════════════════════
// /api/famille — Les courriels adressés à la famille
//
// Jusqu'ici, tous les envois du site prévenaient la maison. La famille,
// elle, ne recevait rien : ni accusé de commande, ni annonce de
// livraison, ni trace de sa référence. Elle payait, puis silence — sur
// un service commandé en deuil, à quelques jours d'une cérémonie.
//
// Cette fonction ne prend pas de texte libre : l'appelant choisit un
// modèle et fournit des données (prénom, référence, offre). Le message
// est composé ici. Un tiers qui abuserait du point d'entrée ne pourrait
// donc expédier qu'un accusé de réception Melodia, jamais un message
// de son cru.
//
// Variables d'environnement :
//   RESEND_API_KEY   clé Resend
//   COURRIER_FROM    expéditeur transactionnel, vérifié chez Resend
//                    ex. Melodia Funèbre <bonjour@envoi.melodia-funebre.fr>
//   LEAD_TO          boîte de la maison (copie invisible des livraisons)
//   SITE_URL         adresse publique, pour le logo et les liens
// ═══════════════════════════════════════════════════════════════

import {
  SITE, gabarit, envoyer, valideEmail,
  expediteurCourrier, boiteMaison, origineAutorisee, tropSouvent
} from './_courrier.js';

/* Le vouvoiement, des phrases courtes, aucune formule commerciale.
   Le destinataire vient d'enterrer quelqu'un : ni « Bonne nouvelle ! »,
   ni point d'exclamation, ni relance déguisée. */
const MODELES = {

  /* 1. La commande vient d'être enregistrée ─────────────────────── */
  confirmation: (d) => ({
    sujet: 'Votre commande est enregistrée — ' + d.ref,
    apercu: 'Nous vous appelons sous deux heures ouvrées pour l\'entretien.',
    titre: 'Votre commande est enregistrée',
    texte: [
      salut(d) + 'Nous avons bien reçu votre demande d\'hommage' + (d.defunt ? ' pour ' + d.defunt : '') + '.',
      'Un membre de la maison vous appelle ' + (d.urgence
        ? 'dans l\'heure'
        : 'sous deux heures ouvrées') +
        ' au numéro que vous nous avez laissé. Cet entretien dure cinq minutes environ : nous vous écoutons parler de la personne, et c\'est de là que naît le texte.',
      'Le délai de livraison court à partir de cet appel, pas à partir de maintenant : ' +
        (d.urgence ? 'six heures ouvrées' : 'vingt-quatre heures') + '.',
      'Conservez ce courriel — il porte votre référence. Vous pouvez y répondre à tout moment : il arrive dans notre boîte.'
    ].join('\n\n'),
    fiche: fiche(d),
    lienTexte: 'Suivre ma commande',
    lienUrl: SITE + '/compte'
  }),

  /* 2. L'entretien a eu lieu, le brief est arrêté ───────────────── */
  brief: (d) => ({
    sujet: 'Le brief est validé — ' + d.ref,
    apercu: 'La composition commence. Livraison sous ' + (d.urgence ? 'six heures' : 'vingt-quatre heures') + '.',
    titre: 'Le brief est validé',
    texte: [
      salut(d) + 'Merci pour cet échange. Ce que vous nous avez confié' +
        (d.defunt ? ' sur ' + d.defunt : '') + ' est maintenant entre les mains du compositeur.',
      'Vous recevez l\'hommage sous ' + (d.urgence ? 'six heures ouvrées' : 'vingt-quatre heures') +
        '. Nous vous écrivons dès qu\'il est prêt : vous n\'avez rien à faire d\'ici là.',
      'Si un détail vous revient — une expression, une chanson qu\'elle aimait, un lieu — répondez à ce courriel. Tant que la composition n\'est pas achevée, nous pouvons encore l\'intégrer.'
    ].join('\n\n'),
    fiche: fiche(d)
  }),

  /* 3. La composition est en cours ──────────────────────────────── */
  composition: (d) => ({
    sujet: 'La composition a commencé — ' + d.ref,
    apercu: 'L\'hommage' + (d.defunt ? ' à ' + d.defunt : '') + ' est en cours d\'écriture.',
    titre: 'La composition a commencé',
    texte: [
      salut(d) + 'L\'écriture' + (d.defunt ? ' de l\'hommage à ' + d.defunt : ' de votre hommage') + ' est en cours.',
      'Nous vous préviendrons dès que l\'œuvre sera prête à écouter. Rien n\'est attendu de votre part.'
    ].join('\n\n'),
    fiche: fiche(d)
  }),

  /* 4. L'hommage est prêt ───────────────────────────────────────── */
  livraison: (d) => ({
    sujet: 'L\'hommage' + (d.defunt ? ' à ' + d.defunt : '') + ' est prêt — ' + d.ref,
    apercu: 'Vous pouvez l\'écouter et le télécharger dès maintenant.',
    titre: d.defunt ? 'L\'hommage à ' + d.defunt : 'Votre hommage est prêt',
    texte: [
      salut(d) + 'L\'œuvre est achevée. Vous pouvez l\'écouter, la télécharger, et la remettre à la personne qui s\'occupe de la sonorisation.',
      'Le fichier est au format MP3, lisible sur n\'importe quel téléphone, ordinateur ou sono de salle. Nous vous conseillons de le télécharger dès à présent plutôt que de compter sur une connexion le jour de la cérémonie.',
      'Si quelque chose ne va pas — un prénom mal prononcé, un couplet à reprendre — répondez à ce courriel. Une révision est comprise dans votre offre.',
      'Nous pensons à vous pour ce jour.'
    ].join('\n\n'),
    fiche: fiche(d),
    lienTexte: 'Écouter l\'hommage',
    lienUrl: d.lien || (SITE + '/compte'),
    /* La maison garde une trace de ce qui a été livré, et quand */
    copieMaison: true
  }),

  /* 5. Une demande de rappel vient d'arriver ────────────────────── */
  rappel: (d) => ({
    sujet: 'Nous vous rappelons',
    apercu: d.urgence ? 'Nous vous appelons dans l\'heure.' : 'Nous vous appelons sous deux heures ouvrées.',
    titre: 'Votre demande est arrivée',
    texte: [
      salut(d) + 'Nous avons bien reçu votre demande de rappel.',
      'Un membre de la maison vous appelle ' + (d.urgence ? 'dans l\'heure' : 'sous deux heures ouvrées') +
        (d.moment ? ', en tenant compte du moment que vous avez indiqué (' + d.moment + ')' : '') + '.',
      'Si vous préférez écrire, répondez simplement à ce courriel.'
    ].join('\n\n')
  })
};

function salut(d) {
  return d.nom ? 'Bonjour ' + d.nom + ',\n' : 'Bonjour,\n';
}

function fiche(d) {
  return [
    ['Référence', d.ref],
    ['Hommage à', d.defunt],
    ['Offre', d.offre],
    d.urgence ? ['Priorité', 'Cérémonie imminente'] : null
  ].filter(Boolean);
}

/* Un même champ ne doit pas pouvoir contenir un roman : ce qui arrive
   ici vient du navigateur d'un inconnu. */
function court(v, n) { return String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, n); }

export default async function handler(req, res) {
  /* Pas d'astérisque ici : le point d'entrée n'est ouvert qu'aux pages
     du site, et l'en-tête doit refléter exactement cette règle. */
  const ok = origineAutorisee(req);
  if (ok) res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(ok ? 200 : 403).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  if (!ok) {
    return res.status(403).json({ error: 'Origine non autorisée.', code: 'BAD_ORIGIN' });
  }

  const exp = expediteurCourrier();
  if (!process.env.RESEND_API_KEY || !exp) {
    return res.status(503).json({
      error: 'L\'envoi de courriels n\'est pas configuré.',
      code: 'NOT_CONFIGURED',
      hint: 'Renseignez RESEND_API_KEY et COURRIER_FROM dans Vercel, puis redéployez.'
    });
  }

  const d = req.body || {};
  const modele = MODELES[d.type];
  if (!modele) return res.status(400).json({ error: 'Modèle inconnu.', code: 'BAD_TYPE' });

  const dest = court(d.email, 160);
  if (!valideEmail(dest)) return res.status(400).json({ error: 'Adresse invalide.', code: 'BAD_TO' });

  /* Une adresse ne reçoit pas dix courriels en dix minutes, et une même
     source ne déclenche pas cent envois. */
  const ip = court((req.headers['x-forwarded-for'] || '').split(',')[0], 60) || 'inconnu';
  if (tropSouvent('a:' + dest.toLowerCase(), 6, 10 * 60 * 1000) || tropSouvent('i:' + ip, 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Trop d\'envois. Réessayez dans quelques minutes.', code: 'RATE_LIMIT' });
  }

  const donnees = {
    nom: court(d.nom, 80),
    defunt: court(d.defunt, 80),
    ref: court(d.ref, 40),
    offre: court(d.offre, 80),
    moment: court(d.moment, 60),
    urgence: !!d.urgence,
    /* Un lien fourni par le navigateur ne doit pas devenir un
       « javascript: » signé Melodia dans la boîte d'une famille. */
    lien: /^https:\/\//i.test(String(d.lien || '')) ? court(d.lien, 400) : ''
  };

  const m = modele(donnees);
  const html = gabarit({
    sujet: m.sujet, titre: m.titre, apercu: m.apercu, texte: m.texte, fiche: m.fiche,
    lienTexte: m.lienTexte, lienUrl: m.lienUrl,
    expediteurNom: 'Melodia Funèbre',
    expediteurRole: 'Maison de composition musicale',
    expediteurEmail: boiteMaison()[0] || '',
    pied: 'client'
  });

  const charge = {
    from: exp,
    to: [dest],
    subject: m.sujet,
    html: html,
    text: m.texte.replace(/\n{3,}/g, '\n\n') +
      (m.fiche && m.fiche.length ? '\n\n' + m.fiche.map((l) => l[0] + ' : ' + l[1]).join('\n') : '') +
      (m.lienUrl ? '\n\n' + (m.lienTexte || 'Lien') + ' : ' + m.lienUrl : '') +
      '\n\n—\nMelodia Funèbre\n' + SITE
  };
  const maison = boiteMaison();
  if (maison.length) {
    charge.reply_to = maison[0];
    if (m.copieMaison) charge.bcc = maison;
  }

  const r = await envoyer(charge);
  if (!r.ok) return res.status(r.status).json({ error: r.error, code: r.code, motif: r.motif });
  return res.status(200).json({ ok: true, id: r.id, type: d.type, envoye_a: dest });
}
