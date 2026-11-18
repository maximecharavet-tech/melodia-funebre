// ═══════════════════════════════════════════════════════════════
// api/_ecoute.js — Écoutes des liens envoyés aux agences
//
// Aucun cookie, aucun pixel, aucune adresse IP. Un jeton signé (SIRET
// de l'établissement + HMAC) est ajouté aux liens d'écoute des courriels
// de prospection. Quand la lecture dépasse 20 secondes, la page envoie
// une seule requête à /api/ecoute ; la route écrit une ligne « Écoute »
// dans le journal de la fiche (table prospects existante).
// Conservation : 3 ans au plus — chaque écriture purge les écoutes plus
// anciennes, et le passage quotidien du cron fait de même pour toutes
// les fiches.
// Le préfixe « _ » : Vercel n'expose pas ce fichier comme route.
// ═══════════════════════════════════════════════════════════════

import { createHmac, timingSafeEqual } from 'crypto';
import { estLienEcoute } from './_courrier.js';

export const QUOI_ECOUTE = 'Écoute';
export const CONSERVATION_MS = 3 * 365 * 86400_000;
const FUSION_MS = 30 * 60_000;
const JOURNAL_MAX = 60;

function cle() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.RESEND_API_KEY || 'melodia-funebre-ecoute';
}

export function siretPropre(s) {
  const v = String(s || '').replace(/\s+/g, '');
  return /^\d{14}$/.test(v) ? v : '';
}

export function jetonEcoute(siret) {
  const s = siretPropre(siret);
  if (!s) return '';
  return s + '.' + createHmac('sha256', cle()).update('ecoute|' + s).digest('hex').slice(0, 16);
}

/** Le SIRET porté par un jeton valide, ou '' . */
export function lireJeton(jeton) {
  const m = String(jeton || '').match(/^(\d{14})\.([0-9a-f]{16})$/);
  if (!m) return '';
  const attendu = jetonEcoute(m[1]).split('.')[1];
  try {
    return timingSafeEqual(Buffer.from(attendu), Buffer.from(m[2])) ? m[1] : '';
  } catch (e) { return ''; }
}

function avecJeton(url, jeton, sep) {
  if (/[?&](?:amp;)?ec=/.test(url)) return url;
  const [base, ancre] = url.split('#');
  return base + (base.indexOf('?') >= 0 ? sep : '?') + 'ec=' + jeton + (ancre !== undefined ? '#' + ancre : '');
}

const RE_URL_TEXTE = /https:\/\/(?:www\.)?melodia-funebre\.fr\/(?:ecouter(?:[\/-][a-z0-9-]+)?|demos)(?:[?#][^\s<>"')]*)?/gi;
const RE_HREF = /href="(https:\/\/(?:www\.)?melodia-funebre\.fr\/(?:ecouter(?:[\/-][a-z0-9-]+)?|demos)(?:[?#][^"]*)?)"/gi;

/** Ajoute le jeton aux liens d'écoute d'un texte brut. */
export function marquerTexte(texte, siret) {
  const j = jetonEcoute(siret);
  if (!j) return texte;
  return String(texte || '').replace(RE_URL_TEXTE, (u) => (estLienEcoute(u) ? avecJeton(u, j, '&') : u));
}

/** Ajoute le jeton aux href d'écoute d'un HTML (le texte visible n'est pas touché). */
export function marquerHtml(html, siret) {
  const j = jetonEcoute(siret);
  if (!j) return html;
  return String(html || '').replace(RE_HREF, (tout, u) => {
    const brut = u.replace(/&amp;/g, '&');
    if (!estLienEcoute(brut)) return tout;
    return 'href="' + avecJeton(u, j, '&amp;') + '"';
  });
}

export function oeuvrePropre(t) {
  return String(t || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function duree(secondes) {
  const s = Math.max(0, Math.round(Number(secondes) || 0));
  const m = Math.floor(s / 60);
  return m ? m + ' min' + (s % 60 ? ' ' + String(s % 60).padStart(2, '0') : '') : s + ' s';
}

/** Retire les écoutes plus vieilles que la durée de conservation. */
export function purgerJournal(journal, maintenant = Date.now()) {
  const l = Array.isArray(journal) ? journal : [];
  return l.filter((j) => !(j && j.quoi === QUOI_ECOUTE && (maintenant - Date.parse(j.le || 0)) > CONSERVATION_MS));
}

/**
 * Le journal après une écoute : une lecture du même titre dans la demi-heure
 * met à jour la ligne existante (durée la plus longue) au lieu d'en ajouter une.
 */
export function journalAvecEcoute(journal, { oeuvre, secondes, maintenant = Date.now() }) {
  const l = purgerJournal(journal, maintenant).slice();
  const titre = oeuvrePropre(oeuvre) || 'une création';
  const sec = Math.max(0, Math.min(3600, Math.round(Number(secondes) || 0)));
  const i = l.findIndex((j) => j && j.quoi === QUOI_ECOUTE && j.oeuvre === titre && (maintenant - Date.parse(j.le || 0)) < FUSION_MS);
  if (i >= 0) {
    const s = Math.max(Number(l[i].secondes) || 0, sec);
    l[i] = Object.assign({}, l[i], { secondes: s, detail: '« ' + titre + ' » · ' + duree(s) });
    return { journal: l, nouveau: false };
  }
  l.unshift({ le: new Date(maintenant).toISOString(), quoi: QUOI_ECOUTE, detail: '« ' + titre + ' » · ' + duree(sec), par: 'site', oeuvre: titre, secondes: sec });
  if (l.length > JOURNAL_MAX) l.length = JOURNAL_MAX;
  return { journal: l, nouveau: true };
}
