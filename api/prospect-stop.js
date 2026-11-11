// ═══════════════════════════════════════════════════════════════
// /api/prospect-stop — Désinscription prospection (RFC 8058)
//
// GET  : page de confirmation (évite un désabonnement par simple
//        préchargement du lien), puis ?confirm=1 pour l'appliquer.
// POST : un clic (List-Unsubscribe-Post), sans page.
// Le jeton HMAC lie l'adresse ; sans lui, rien n'est écrit.
// ═══════════════════════════════════════════════════════════════

import { verifierJeton, normaliserEmail, SITE } from './_desabonnement.js';
import { entetesService } from './_courrier.js';

const SB_URL = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');

function lireParams(req) {
  const q = req.query || {};
  let e = String(q.e || q.email || '').trim();
  let t = String(q.t || q.token || '').trim();
  if ((!e || !t) && req.url) {
    try {
      const u = new URL(req.url, 'https://melodia-funebre.fr');
      e = e || u.searchParams.get('e') || '';
      t = t || u.searchParams.get('t') || '';
    } catch (err) { /* ignore */ }
  }
  if (req.body && typeof req.body === 'object') {
    e = e || String(req.body.e || req.body.email || '').trim();
    t = t || String(req.body.t || req.body.token || '').trim();
  }
  return { email: normaliserEmail(e), jeton: t };
}

function page(titre, corps) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${titre}</title>
<style>
  body{margin:0;background:#f4f1ea;color:#17150f;font-family:Georgia,'Times New Roman',serif;}
  .c{max-width:520px;margin:12vh auto;padding:32px 24px;background:#fff;border:1px solid #e2ddd0;}
  h1{font-weight:400;font-size:28px;margin:0 0 16px;}
  p{font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#3d3a33;}
  a.btn,button{display:inline-block;margin-top:12px;padding:12px 22px;background:#c9a84c;color:#1a1408;
    text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:.06em;border:0;cursor:pointer;}
  .pied{margin-top:28px;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#8b8474;}
  .pied a{color:#8b8474;}
</style></head>
<body><div class="c">
  <h1>${titre}</h1>
  ${corps}
  <p class="pied">Melodia Funèbre — Maxime Charavet<br>
  <a href="${SITE}/mentions-legales">Mentions légales</a></p>
</div></body></html>`;
}

async function marquerOpposition(email) {
  const service = entetesService({ 'Content-Type': 'application/json', Prefer: 'return=minimal' });
  if (service) {
    try {
      await fetch(SB_URL + '/rest/v1/prospects?email=ilike.' + encodeURIComponent(email), {
        method: 'PATCH',
        headers: service,
        body: JSON.stringify({ oppose: true })
      });
    } catch (e) { /* on continue : l'essentiel est d'avoir répondu à la personne */ }
  }
  const cle = process.env.RESEND_API_KEY;
  if (cle) {
    try {
      await fetch('https://api.resend.com/suppressions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + cle, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (e) { /* liste Resend facultative */ }
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { email, jeton } = lireParams(req);
  if (!email || !verifierJeton(email, jeton)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).end(page(
      'Lien invalide',
      '<p>Ce lien de désinscription n’est pas valide ou a expiré. Répondez simplement STOP au courriel reçu, ou écrivez à <a href="mailto:julie@melodia-funebre.fr">julie@melodia-funebre.fr</a>.</p>'
    ));
  }

  if (req.method === 'POST') {
    await marquerOpposition(email);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).end('OK');
  }

  if (req.method !== 'GET') return res.status(405).end('GET ou POST uniquement');

  const confirm = String((req.query && (req.query.confirm || req.query.ok)) || '') === '1';
  if (!confirm) {
    const href = '/api/prospect-stop?e=' + encodeURIComponent(email) + '&t=' + encodeURIComponent(jeton) + '&confirm=1';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).end(page(
      'Ne plus être contacté',
      '<p>Vous ne souhaitez plus recevoir les courriels professionnels de Melodia Funèbre à l’adresse <b>' +
      email.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</b> ?</p>' +
      '<p><a class="btn" href="' + href + '">Confirmer la désinscription</a></p>'
    ));
  }

  await marquerOpposition(email);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).end(page(
    'Désinscription confirmée',
    '<p>Votre adresse a été retirée. Vous ne recevrez plus de courriels de prospection de Melodia Funèbre.</p>' +
    '<p class="pied"><a href="' + SITE + '">Retour au site</a></p>'
  ));
}
