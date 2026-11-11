// ═══════════════════════════════════════════════════════════════
// api/_desabonnement.js — Jeton, URL et mentions de désinscription
//
// Le préfixe « _ » : Vercel n'expose pas cette route. Importé par
// prospect-mail, prospect-stop et les gabarits.
// ═══════════════════════════════════════════════════════════════

import { createHmac, timingSafeEqual } from 'crypto';

export const SITE = (process.env.SITE_URL || 'https://melodia-funebre.fr').replace(/\/+$/, '');

function cleHmac() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.RESEND_API_KEY || 'melodia-funebre-desabo';
}

export function normaliserEmail(e) {
  return String(e || '').trim().toLowerCase();
}

export function jetonDesabo(email) {
  return createHmac('sha256', cleHmac()).update(normaliserEmail(email)).digest('hex').slice(0, 32);
}

export function verifierJeton(email, jeton) {
  const a = jetonDesabo(email);
  const b = String(jeton || '');
  if (a.length !== b.length || !/^[0-9a-f]+$/.test(b)) return false;
  try { return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')); }
  catch (e) { return false; }
}

export function urlDesabo(email) {
  const e = normaliserEmail(email);
  if (!e) return SITE + '/mentions-legales';
  return SITE + '/api/prospect-stop?e=' + encodeURIComponent(e) + '&t=' + jetonDesabo(e);
}

export function entetesDesabonnement(email, replyTo) {
  const url = urlDesabo(email);
  const dest = String(replyTo || '').trim() || 'contact@melodia-funebre.fr';
  return {
    'List-Unsubscribe': '<' + url + '>, <mailto:' + dest + '?subject=STOP>',
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  };
}

export function textePiedProspection(unsubUrl) {
  const u = String(unsubUrl || (SITE + '/api/prospect-stop'));
  return 'Vous recevez ce message dans un cadre strictement professionnel, parce que votre établissement exerce dans les services funéraires.\n' +
    'Pour ne plus être contacté, ouvrez ce lien : ' + u + '\n' +
    'ou répondez STOP à ce courriel : votre adresse est retirée immédiatement et définitivement.\n\n' +
    'Melodia Funèbre — Maxime Charavet\n' +
    'Mentions légales : ' + SITE + '/mentions-legales';
}

function echapperAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function htmlPiedProspection(unsubUrl) {
  const u = echapperAttr(unsubUrl || (SITE + '/api/prospect-stop'));
  return 'Vous recevez ce message dans un cadre strictement professionnel, parce que votre ' +
    'établissement exerce dans les services funéraires. Pour ne plus être contacté, ' +
    '<a href="' + u + '" style="color:#5c5749;text-decoration:underline;">désinscrivez-vous en un clic</a> ' +
    'ou répondez <b style="color:#5c5749;">STOP</b> à ce courriel : votre adresse est retirée immédiatement et définitivement.' +
    '<br><span style="color:#a49d8c;">Melodia Funèbre — Maxime Charavet — <a href="' +
    SITE + '/mentions-legales" style="color:#8b8474;text-decoration:underline;">Mentions légales</a></span>';
}
