// Chaînes de la console (assets/i18n/pro.fr.json) et formats Intl.
let chaines = {};

export async function chargerChaines() {
  try {
    const r = await fetch('/assets/i18n/pro.fr.json', { cache: 'no-cache' });
    chaines = await r.json();
  } catch (e) { chaines = {}; }
  return chaines;
}

export function t(chemin, repli) {
  const v = chemin.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), chaines);
  return v == null ? (repli != null ? repli : chemin) : v;
}

const DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const DATE_HEURE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const EUROS = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const RELATIF = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

export function date(v) { return v ? DATE.format(new Date(v)) : '—'; }
export function dateHeure(v) { return v ? DATE_HEURE.format(new Date(v)) : '—'; }
/** Centimes → « 149,00 € » ; null → libellé TBD. */
export function prix(cents) { return cents == null ? t('commun.tarif_tbd') : EUROS.format(cents / 100); }
export function relatif(v) {
  if (!v) return '';
  const s = (new Date(v).getTime() - Date.now()) / 1000;
  const a = Math.abs(s);
  if (a < 3600) return RELATIF.format(Math.round(s / 60), 'minute');
  if (a < 86400 * 2) return RELATIF.format(Math.round(s / 3600), 'hour');
  return RELATIF.format(Math.round(s / 86400), 'day');
}
