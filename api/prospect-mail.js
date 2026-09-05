// ═══════════════════════════════════════════════════════════════
// /api/prospect-mail — Envoie un courriel de prospection
//
// La console commerciale composait un lien « mailto: » : le message
// partait du logiciel de messagerie du collaborateur, sans mise en
// forme, sans logo, et sans trace côté maison. Cette fonction l'envoie
// vraiment, habillé, et met le fondateur en copie invisible.
//
// L'adresse de réponse est celle du collaborateur : l'agence répond à
// la personne qui l'a contactée, pas à une boîte anonyme.
//
// ─── EXPÉDITEUR SÉPARÉ ───
// Le démarchage part de PROSPECT_FROM (contact.melodia-funebre.fr) et
// non de l'adresse qui porte les livraisons. Une agence agacée qui
// signale ce message comme indésirable abîme la réputation de ce
// sous-domaine-là — pas celle du courriel par lequel une famille reçoit
// l'hommage de son père.
//
// Variables d'environnement (Vercel → Settings → Environment Variables) :
//   RESEND_API_KEY   clé Resend (resend.com) — l'offre gratuite suffit
//   PROSPECT_FROM    expéditeur de prospection, vérifié chez Resend
//                    ex. Melodia Funèbre <contact@contact.melodia-funebre.fr>
//                    à défaut, LEAD_FROM est utilisé
//   LEAD_TO          copie invisible, pour que la maison voie ce qui part
//   SITE_URL         adresse publique du site, pour le logo et les liens
//
// Sans clé, la fonction répond 503 NOT_CONFIGURED et la console
// retombe sur le « mailto: » — rien n'est jamais perdu en silence.
// ═══════════════════════════════════════════════════════════════

import {
  SITE, gabarit, envoyer, valideEmail,
  expediteurProspection, boiteMaison
} from './_courrier.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const exp = expediteurProspection();
  if (!process.env.RESEND_API_KEY || !exp) {
    return res.status(503).json({
      error: 'L\'envoi de courriels n\'est pas configuré.',
      code: 'NOT_CONFIGURED',
      hint: 'Renseignez RESEND_API_KEY et PROSPECT_FROM dans Vercel, puis redéployez.'
    });
  }

  const d = req.body || {};
  const dest = String(d.to || '').trim().slice(0, 160);
  const sujet = String(d.sujet || '').trim().slice(0, 200);
  const texte = String(d.texte || '').slice(0, 12000);

  if (!valideEmail(dest)) return res.status(400).json({ error: 'Adresse du destinataire invalide.', code: 'BAD_TO' });
  if (!sujet) return res.status(400).json({ error: 'Objet manquant.', code: 'BAD_SUBJECT' });
  if (texte.trim().length < 30) return res.status(400).json({ error: 'Message trop court.', code: 'BAD_BODY' });

  const repondreA = valideEmail(d.expediteurEmail) ? String(d.expediteurEmail).trim() : null;

  const html = gabarit({
    sujet: sujet,
    titre: String(d.titre || '').slice(0, 160),
    apercu: String(d.apercu || texte).replace(/\s+/g, ' ').slice(0, 140),
    texte: texte,
    lienTexte: String(d.lienTexte || '').slice(0, 60),
    lienUrl: String(d.lienUrl || '').slice(0, 300),
    expediteurNom: String(d.expediteurNom || '').slice(0, 120),
    expediteurRole: String(d.expediteurRole || '').slice(0, 120),
    expediteurEmail: repondreA,
    pied: 'prospection'
  });

  const charge = {
    from: exp,
    to: [dest],
    subject: sujet,
    html: html,
    text: texte + '\n\n—\n' + (d.expediteurNom || 'Melodia Funèbre') +
          (repondreA ? '\n' + repondreA : '') + '\n' + SITE +
          '\n\nPour ne plus être contacté, répondez STOP à ce courriel.'
  };
  if (repondreA) charge.reply_to = repondreA;
  /* La maison voit ce qui part en son nom, sans que l'agence le sache */
  const maison = boiteMaison();
  if (maison.length) charge.bcc = maison;

  const r = await envoyer(charge);
  if (!r.ok) {
    return res.status(r.status).json({ error: r.error, code: r.code, motif: r.motif });
  }
  return res.status(200).json({
    ok: true,
    id: r.id,
    envoye_a: dest,
    envoye_le: new Date().toISOString()
  });
}
