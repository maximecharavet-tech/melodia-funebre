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
// Variables d'environnement (Vercel → Settings → Environment Variables) :
//   RESEND_API_KEY   clé Resend (resend.com) — l'offre gratuite suffit
//   LEAD_FROM        expéditeur vérifié chez Resend
//                    ex. Melodia Funèbre <contact@melodia-funebre.fr>
//   LEAD_TO          copie invisible, pour que la maison voie ce qui part
//   SITE_URL         adresse publique du site, pour le logo et les liens
//
// Sans clé, la fonction répond 503 NOT_CONFIGURED et la console
// retombe sur le « mailto: » — rien n'est jamais perdu en silence.
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_MS = 15000;

/* Le domaine n'étant pas encore rattaché, les images d'un courriel
   envoyé aujourd'hui doivent pointer vers une adresse qui répond. */
const SITE = (process.env.SITE_URL || 'https://melodia-funebre.vercel.app').replace(/\/+$/, '');

function echapper(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function valideEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
}

/* ─── Gabarit ───
   Fond ivoire et non fond sombre : la charte du site ne survit pas aux
   clients de messagerie, qui inversent les fonds noirs, rognent les
   dégradés et signalent volontiers les courriels très colorés. Tableaux
   et styles en ligne : c'est le seul HTML qu'Outlook rende fidèlement. */
function gabarit(o) {
  const corps = String(o.texte || '')
    .split(/\n{2,}/)
    .map((par) => {
      const t = par.trim();
      if (!t) return '';
      /* Une liste à puces reste une liste */
      if (/^[·•-]\s/m.test(t)) {
        const items = t.split('\n').map((l) => l.replace(/^[·•-]\s*/, '').trim()).filter(Boolean);
        return '<ul style="margin:0 0 18px;padding-left:20px;color:#3d3a33;font-size:15px;line-height:1.7;">' +
          items.map((i) => '<li style="margin-bottom:6px;">' + echapper(i) + '</li>').join('') + '</ul>';
      }
      return '<p style="margin:0 0 18px;color:#3d3a33;font-size:15px;line-height:1.7;">' +
        echapper(t).replace(/\n/g, '<br>') + '</p>';
    }).join('');

  const bouton = o.lienTexte && o.lienUrl
    ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 8px;">' +
      '<tr><td style="background:#c9a84c;border-radius:2px;">' +
      '<a href="' + echapper(o.lienUrl) + '" style="display:inline-block;padding:13px 26px;' +
      'font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;' +
      'color:#1a1408;text-decoration:none;font-weight:600;">' + echapper(o.lienTexte) + '</a>' +
      '</td></tr></table>'
    : '';

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${echapper(o.sujet || 'Melodia Funèbre')}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(o.apercu || '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0"
         style="width:600px;max-width:100%;background:#ffffff;border:1px solid #e2ddd0;">

    <!-- En-tête -->
    <tr><td style="padding:30px 34px 22px;text-align:center;background:#0b0b11;">
      <img src="${SITE}/assets/img/logo-melodia.jpg" width="66" height="66" alt="Melodia Funèbre"
           style="display:block;margin:0 auto 12px;border-radius:50%;border:1px solid rgba(201,168,76,.4);">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#f2efe8;letter-spacing:.5px;">Melodia Funèbre</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3.4px;text-transform:uppercase;color:#97803c;margin-top:5px;">
        Composition musicale personnalisée
      </div>
    </td></tr>
    <tr><td style="height:3px;background:linear-gradient(90deg,#97803c,#e3c977,#97803c);font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Corps -->
    <tr><td style="padding:32px 34px 26px;font-family:Helvetica,Arial,sans-serif;">
      ${o.titre ? '<h1 style="margin:0 0 20px;font-family:Georgia,\'Times New Roman\',serif;font-weight:400;font-size:25px;line-height:1.3;color:#17150f;">' + echapper(o.titre) + '</h1>' : ''}
      ${corps}
      ${bouton}
    </td></tr>

    <!-- Signature -->
    <tr><td style="padding:0 34px 30px;font-family:Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="border-top:1px solid #e2ddd0;padding-top:18px;">
        <tr><td style="padding-top:18px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#17150f;">${echapper(o.expediteurNom || 'Melodia Funèbre')}</div>
          ${o.expediteurRole ? '<div style="font-size:12px;color:#7d7663;margin-top:2px;">' + echapper(o.expediteurRole) + '</div>' : ''}
          <div style="font-size:12px;color:#7d7663;margin-top:8px;line-height:1.7;">
            ${o.expediteurEmail ? '<a href="mailto:' + echapper(o.expediteurEmail) + '" style="color:#97803c;text-decoration:none;">' + echapper(o.expediteurEmail) + '</a><br>' : ''}
            <a href="${SITE}" style="color:#97803c;text-decoration:none;">melodia-funebre.fr</a>
          </div>
        </td></tr>
      </table>
    </td></tr>

    <!-- Pied : la mention d'opposition est une obligation légale -->
    <tr><td style="padding:16px 34px 22px;background:#faf8f3;border-top:1px solid #e2ddd0;
                   font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#8b8474;">
      Vous recevez ce message dans un cadre strictement professionnel, parce que votre
      établissement exerce dans les services funéraires.
      Pour ne plus être contacté, répondez <b style="color:#5c5749;">STOP</b> à ce courriel :
      votre adresse est retirée immédiatement et définitivement.
    </td></tr>

  </table>
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:#a49d8c;margin-top:14px;">
    Melodia Funèbre — Maison française de composition musicale pour cérémonies funéraires
  </div>
</td></tr>
</table>
</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const cle = process.env.RESEND_API_KEY;
  const exp = process.env.LEAD_FROM;
  if (!cle || !exp) {
    return res.status(503).json({
      error: 'L\'envoi de courriels n\'est pas configuré.',
      code: 'NOT_CONFIGURED',
      hint: 'Renseignez RESEND_API_KEY et LEAD_FROM dans Vercel, puis redéployez.'
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
    expediteurEmail: repondreA
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
  if (process.env.LEAD_TO) charge.bcc = [process.env.LEAD_TO];

  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: 'Bearer ' + cle, 'Content-Type': 'application/json' },
      body: JSON.stringify(charge)
    });
    const brut = await r.text();
    let data; try { data = JSON.parse(brut); } catch (e) { data = null; }

    if (!r.ok) {
      /* Le motif exact vaut mieux qu'un code : une adresse d'expédition
         non vérifiée chez Resend est la cause la plus fréquente. */
      const motif = (data && (data.message || data.name)) || brut.slice(0, 300);
      return res.status(r.status === 429 ? 429 : 502).json({
        error: 'Le service d\'envoi a répondu ' + r.status + '.',
        code: 'SEND_FAILED',
        motif: motif
      });
    }

    return res.status(200).json({
      ok: true,
      id: (data && data.id) || null,
      envoye_a: dest,
      envoye_le: new Date().toISOString()
    });
  } catch (err) {
    const coupe = err.name === 'AbortError';
    return res.status(coupe ? 504 : 500).json({
      error: coupe ? 'Le service d\'envoi n\'a pas répondu.' : 'Envoi impossible : ' + err.message,
      code: coupe ? 'TIMEOUT' : 'FETCH_FAILED'
    });
  } finally {
    clearTimeout(minuteur);
  }
}
