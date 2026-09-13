// ═══════════════════════════════════════════════════════════════
// /api/lead — Prévient la maison qu'une demande est arrivée
//
// Sans ce relais, une demande déposée sur le site reste dans le
// navigateur du visiteur : personne ne la voit jamais. Cette fonction
// envoie l'alerte par courriel.
//
// Variables d'environnement (Vercel → Settings → Environment Variables) :
//   RESEND_API_KEY    clé Resend (resend.com) — offre gratuite suffisante
//   LEAD_TO           destinataire, ex. contact@melodia-funebre.fr
//   COURRIER_FROM     expéditeur transactionnel vérifié chez Resend
//                     ex. Melodia <bonjour@envoi.melodia-funebre.fr>
//                     à défaut, LEAD_FROM est utilisé
// ═══════════════════════════════════════════════════════════════

import { envoyer, expediteurCourrier, boiteMaison } from './_courrier.js';

const TITRES = {
  rappel: 'Demande de rappel',
  commande: 'Nouvelle commande',
  contact: 'Message depuis le site',
  prospect: 'Réponse de prospection',
  /* La demande d'une pompe funèbre : c'est le courriel qu'il ne faut
     pas manquer, d'où son titre explicite en objet. */
  partenariat: 'DEMANDE DE PARTENARIAT'
};

function ligne(cle, valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return '';
  return '<tr><td style="padding:6px 14px 6px 0;color:#8e8878;white-space:nowrap;vertical-align:top;">' +
    echapper(cle) + '</td><td style="padding:6px 0;color:#17150f;">' + echapper(String(valeur)).replace(/\n/g, '<br>') + '</td></tr>';
}

function echapper(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const dest = boiteMaison();
  const exp = expediteurCourrier();
  if (!process.env.RESEND_API_KEY || !dest.length || !exp) {
    return res.status(503).json({
      error: 'La notification par courriel n\'est pas configurée.',
      code: 'NOT_CONFIGURED',
      hint: 'Renseignez RESEND_API_KEY, LEAD_TO et COURRIER_FROM dans Vercel, puis redéployez.'
    });
  }

  const d = req.body || {};
  const type = TITRES[d.type] ? d.type : 'contact';

  /* La demande d'une pompe funèbre porte d'autres noms de champs que
     celle d'une famille : « contact » pour la personne, « societe »
     pour la maison. Cette fonction lisait « nom » et rien d'autre —
     le courriel de la demande la plus précieuse du site arrivait donc
     sans le nom de l'entreprise, sans celui du dirigeant, sans la
     ville et sans ce qu'il demandait. Il ne restait qu'un téléphone
     et un message. */
  const nom = String(d.nom || d.contact || '').slice(0, 120).trim();
  const societe = String(d.societe || '').slice(0, 160).trim();
  const ville = String(d.ville || '').slice(0, 120).trim();
  const objet = String(d.objet || '').slice(0, 160).trim();
  const email = String(d.email || '').slice(0, 160).trim();
  const tel = String(d.tel || '').slice(0, 40).trim();
  if (!nom && !email && !tel) {
    return res.status(400).json({ error: 'Demande vide.' });
  }

  const urgent = !!d.urgent;
  /* L'objet doit suffire à décider si on rappelle tout de suite :
     « DEMANDE DE PARTENARIAT — Pompes Funèbres Roblot · Villeurbanne »
     se lit d'un coup d'œil sur un téléphone. */
  const enTete = societe || nom;
  const sujet = (urgent ? '[URGENT] ' : '') + TITRES[type] +
    (enTete ? ' — ' + enTete : '') +
    (ville ? ' · ' + ville : '') +
    (d.defunt ? ' · ' + d.defunt : '');

  const corps =
    '<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;">' +
      '<div style="background:#040407;color:#c9a84c;padding:18px 22px;border-radius:6px 6px 0 0;">' +
        '<div style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;">Melodia Funèbre</div>' +
        '<div style="font-size:20px;color:#f2efe8;margin-top:6px;">' + echapper(TITRES[type]) + '</div>' +
        (urgent ? '<div style="margin-top:10px;display:inline-block;background:#f87171;color:#2a0a0a;font-size:11px;letter-spacing:.14em;text-transform:uppercase;padding:4px 10px;border-radius:100px;">Cérémonie imminente</div>' : '') +
      '</div>' +
      '<div style="border:1px solid #e7e2d6;border-top:0;border-radius:0 0 6px 6px;padding:20px 22px;background:#fff;">' +
        '<table style="border-collapse:collapse;font-size:14px;width:100%;">' +
          ligne('Entreprise', societe) +
          ligne(societe ? 'Contact' : 'Nom', nom) +
          ligne('Ville', ville) +
          ligne('Demande', objet) +
          ligne('Téléphone', tel) +
          ligne('Email', email) +
          ligne('Meilleur moment', d.moment) +
          ligne('Défunt', d.defunt) +
          ligne('Offre', d.offre) +
          ligne('Référence', d.ref) +
          ligne('Message', d.message) +
          ligne('Page', d.page) +
        '</table>' +
        (tel ? '<p style="margin-top:18px;"><a href="tel:' + echapper(tel.replace(/[^+0-9]/g, '')) +
          '" style="background:#c9a84c;color:#120e04;text-decoration:none;padding:10px 18px;border-radius:4px;font-weight:600;">Rappeler ' + echapper(nom || societe || '') + '</a></p>' : '') +
      '</div>' +
    '</div>';

  const r = await envoyer({
    from: exp,
    to: dest,
    subject: sujet,
    html: corps,
    // La famille peut être jointe d'un simple « Répondre »
    reply_to: email || undefined
  });

  if (!r.ok) return res.status(r.status).json({ error: r.error, code: r.code, motif: r.motif });

  /* Un dirigeant qui dépose sa demande à vingt-deux heures n'a, jusque
     là, rien reçu : seulement une phrase à l'écran, disparue dès qu'il
     ferme l'onglet. Le doute — « est-ce parti ? » — se règle par un
     accusé de réception court. Il n'est envoyé qu'aux professionnels :
     une famille en deuil qui demande un rappel n'a pas besoin d'un
     courriel de plus dans sa boîte.

     Son échec ne fait pas échouer la demande : l'essentiel, l'alerte à
     la maison, est déjà parti. */
  if (type === 'partenariat' && email) {
    const bonjour = nom ? 'Bonjour ' + echapper(nom) + ',' : 'Bonjour,';
    const accuse =
      '<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;color:#17150f;">' +
        '<div style="background:#040407;color:#c9a84c;padding:18px 22px;border-radius:6px 6px 0 0;">' +
          '<div style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;">Melodia Funèbre</div>' +
          '<div style="font-size:19px;color:#f2efe8;margin-top:6px;">Votre demande est bien arrivée</div>' +
        '</div>' +
        '<div style="border:1px solid #e7e2d6;border-top:0;border-radius:0 0 6px 6px;padding:20px 22px;background:#fff;line-height:1.7;font-size:14px;">' +
          '<p style="margin:0 0 14px;">' + bonjour + '</p>' +
          '<p style="margin:0 0 14px;">Nous avons bien reçu votre demande' +
            (societe ? ' pour <b>' + echapper(societe) + '</b>' : '') +
            '. Je vous rappelle sous un jour ouvré, au ' + echapper(tel || 'numéro indiqué') + ', ' +
            'ou par courriel si vous préférez — dites-le-moi en répondant à ce message.</p>' +
          '<p style="margin:0 0 14px;">D&rsquo;ici là, vous pouvez écouter des hommages déjà composés : ' +
            '<a href="https://melodia-funebre.fr/demos" style="color:#8a6f26;">melodia-funebre.fr/demos</a>. ' +
            'C&rsquo;est ce que vous ferez écouter à une famille, et c&rsquo;est ce qui décide.</p>' +
          '<p style="margin:0;color:#55503f;">Maxime Charavet<br>' +
            '<span style="font-size:12px;">Fondateur — Melodia Funèbre</span></p>' +
        '</div>' +
      '</div>';
    try {
      await envoyer({ from: exp, to: [email], subject: 'Votre demande de partenariat — Melodia Funèbre',
                      html: accuse, reply_to: dest[0] });
    } catch (e) { /* l'alerte à la maison est partie : c'est elle qui compte */ }
  }

  return res.status(200).json({ ok: true, id: r.id });
}
