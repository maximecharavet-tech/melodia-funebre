/* Outils purs des courriels de prospection (ESM, pour les routes Vercel). */
import * as crypto from 'crypto';

const SITE = 'https://melodia-funebre.fr';
const BROCHURE_CHEMIN = 'documents/melodia-brochure-professionnels.pdf';
const BROCHURE_NOM = 'Melodia-Funebre-Brochure-professionnels.pdf';
const BROCHURE_URL = SITE + '/' + BROCHURE_CHEMIN;
/* La limite réelle de Vercel (corps de requête 4,5 Mo) : un PDF en
   base64 gonfle d’un tiers. 2,5 Mo tiennent ; 10 Mo, non. */
const PDF_MAX = Math.floor(2.5 * 1024 * 1024);

function validerEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
}

function civilite(nom) {
  const n = String(nom || '').replace(/\s+/g, ' ').trim();
  return n ? ' ' + n : '';
}

function varsNormalisees(v) {
  v = v || {};
  const nom = String(v.nom || v.dirigeant || '').replace(/\s+/g, ' ').trim();
  const societe = String(v.societe || v.agence || '').replace(/\s+/g, ' ').trim();
  const ville = String(v.ville || '').replace(/\s+/g, ' ').trim();
  const email = String(v.email || v.to || '').trim();
  return {
    nom,
    societe,
    ville,
    email,
    civilite: civilite(nom),
    agence: societe || 'votre maison',
    ville_rel: ville ? ' à ' + ville : '',
    lien_brochure: BROCHURE_URL
  };
}

function remplir(texte, vars) {
  const v = varsNormalisees(vars);
  return String(texte || '').replace(/\{([^{}]+)\}/g, (m, k) => {
    if (Object.prototype.hasOwnProperty.call(v, k)) return String(v[k] == null ? '' : v[k]);
    return m;
  });
}

function objetDe(modele, vars) {
  const v = varsNormalisees(vars);
  const societe = v.societe;
  const brut = (!societe && modele.objetNu) ? modele.objetNu : modele.objet;
  return remplir(brut, vars).replace(/\s{2,}/g, ' ').replace(/\s+—\s*$/, '').trim();
}

function mentionBrochure(joindre, url) {
  if (!joindre) return '';
  return 'La brochure professionnelle est jointe à ce courriel. Vous pouvez aussi la consulter ici :\n' +
    (url || BROCHURE_URL);
}

function avecBrochure(texte, joindre, url) {
  const t = String(texte || '').replace(/\s+$/, '');
  const lien = url || BROCHURE_URL;
  if (!joindre) return t;
  if (t.indexOf(lien) !== -1 || /brochure professionnelle est jointe/i.test(t)) return t;
  return t + '\n\n' + mentionBrochure(true, lien);
}

function decouperLigne(l) {
  const s = String(l || '');
  if (/[;\t]/.test(s) && s.indexOf(',') === -1) {
    return s.split(/[;\t]/).map((x) => x.replace(/^["']|["']$/g, '').trim());
  }
  const cols = [];
  let cur = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; }
        else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',' || c === ';' || c === '\t') { cols.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  cols.push(cur.trim());
  return cols.map((x) => x.replace(/^["']|["']$/g, '').trim());
}

function parseCsv(texte) {
  const brut = String(texte || '').replace(/^\uFEFF/, '');
  const lignes = brut.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out = { ok: [], erreurs: [], ignores: 0 };
  const vus = new Set();
  let start = 0;
  if (lignes[0] && /^(nom|name|pr[eé]nom|email|e-?mail|soci[eé]t[eé]|societe|agence|ville)\b/i.test(lignes[0].replace(/["']/g, ''))) {
    start = 1;
  }
  for (let i = start; i < lignes.length; i++) {
    const cols = decouperLigne(lignes[i]).filter((c) => c !== '');
    let email = '', nom = '', societe = '', ville = '';
    const restes = [];
    cols.forEach((c) => {
      if (!email && validerEmail(c)) email = c;
      else restes.push(c);
    });
    if (restes.length) nom = restes[0] || '';
    if (restes.length > 1) societe = restes[1] || '';
    if (restes.length > 2) ville = restes[2] || '';
    if (!email) {
      out.erreurs.push({ ligne: i + 1, motif: 'Adresse absente ou invalide.', brut: lignes[i] });
      continue;
    }
    const cle = email.toLowerCase();
    if (vus.has(cle)) { out.ignores += 1; continue; }
    vus.add(cle);
    out.ok.push({ nom: nom, email: email, societe: societe, ville: ville, ligne: i + 1 });
  }
  return out;
}

function validerPdf(buf, max) {
  const plafond = max == null ? PDF_MAX : max;
  if (!buf || !buf.length) return { ok: false, motif: 'Fichier vide.' };
  const len = buf.length;
  if (len > plafond) {
    const mo = Math.round((plafond / (1024 * 1024)) * 10) / 10;
    return { ok: false, motif: 'Fichier trop lourd (maximum ' + mo + ' Mo, limite technique du serveur).' };
  }
  let head = '';
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buf)) head = buf.slice(0, 5).toString('latin1');
  else if (buf instanceof Uint8Array) head = String.fromCharCode.apply(null, Array.from(buf.slice(0, 5)));
  else head = String(buf).slice(0, 5);
  if (head !== '%PDF-') return { ok: false, motif: 'Le fichier n’est pas un PDF.' };
  return { ok: true };
}

function pdfDepuisBase64(b64) {
  const s = String(b64 || '').replace(/^data:application\/pdf;base64,/i, '').replace(/\s+/g, '');
  if (!s) return { ok: false, motif: 'Pièce jointe vide.' };
  let buf;
  try { buf = Buffer.from(s, 'base64'); }
  catch (e) { return { ok: false, motif: 'Encodage de la pièce jointe invalide.' }; }
  const v = validerPdf(buf);
  if (!v.ok) return v;
  return { ok: true, buf };
}

const RANG = {
  envoye: 1,
  delivre: 2,
  differe: 2,
  ouvert: 3,
  clique: 4,
  rejete: 90,
  plainte: 91
};

function evenementVersStatut(type) {
  switch (String(type || '')) {
    case 'email.sent': return 'envoye';
    case 'email.delivered': return 'delivre';
    case 'email.opened': return 'ouvert';
    case 'email.clicked': return 'clique';
    case 'email.bounced': return 'rejete';
    case 'email.complained': return 'plainte';
    case 'email.delivery_delayed': return 'differe';
    default: return null;
  }
}

function rangerStatut(actuel, suivant) {
  if (actuel === 'rejete' || actuel === 'plainte') return actuel;
  if (!suivant) return actuel || 'envoye';
  if (suivant === 'rejete' || suivant === 'plainte') return suivant;
  if ((RANG[suivant] || 0) >= (RANG[actuel] || 0)) return suivant;
  return actuel || suivant;
}

function verifierSignatureResend(payload, headers, secret, maintenant) {
  if (!secret) return { ok: false, motif: 'Secret absent.' };
  const h = headers || {};
  const get = (k) => {
    const cible = k.toLowerCase();
    if (h[k] != null) return h[k];
    if (h[cible] != null) return h[cible];
    for (const cle of Object.keys(h)) if (cle.toLowerCase() === cible) return h[cle];
    return '';
  };
  const id = String(get('svix-id') || '');
  const ts = String(get('svix-timestamp') || '');
  const sig = String(get('svix-signature') || '');
  if (!id || !ts || !sig) return { ok: false, motif: 'En-têtes Svix manquants.' };
  const t = Number(ts);
  const now = Math.floor((maintenant || Date.now()) / 1000);
  if (!t || Math.abs(now - t) > 300) return { ok: false, motif: 'Horodatage trop ancien ou invalide.' };
  let cle;
  try {
    cle = String(secret).startsWith('whsec_')
      ? Buffer.from(String(secret).slice(6), 'base64')
      : Buffer.from(String(secret), 'base64');
  } catch (e) {
    return { ok: false, motif: 'Secret illisible.' };
  }
  const attendu = crypto.createHmac('sha256', cle).update(id + '.' + ts + '.' + String(payload)).digest('base64');
  const a = Buffer.from(attendu);
  const bon = String(sig).split(/\s+/).map((s) => s.replace(/^v1,/i, '').trim()).filter(Boolean).some((c) => {
    const b = Buffer.from(c);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  return bon ? { ok: true } : { ok: false, motif: 'Signature invalide.' };
}


function cleServiceValide(cle) {
  const c = String(cle || '').trim();
  if (!c) return false;
  if (/^https?:\/\//i.test(c)) return false;
  if (c.startsWith('sb_secret_') && c.length >= 20) return true;
  if (c.startsWith('eyJ') && c.split('.').length === 3) return true;
  return false;
}

function interpreterLectureJournal(status, texte) {
  const t = String(texte || '');
  if (status >= 200 && status < 300) return { ok: true, absent: false };
  if (status === 404 || /42P01|PGRST205/i.test(t) || /relation ["\']?public\.envois_prospect["\']? does not exist/i.test(t)) {
    return { ok: false, absent: true };
  }
  return { ok: false, absent: false };
}

function nomPiecePropre(nom) {
  let n = String(nom || BROCHURE_NOM).replace(/[/\\]/g, '').replace(/[^\w.\- àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/g, '_').trim();
  if (!/\.pdf$/i.test(n)) n += '.pdf';
  return n.slice(0, 80) || BROCHURE_NOM;
}

export {
  SITE,
  BROCHURE_CHEMIN,
  BROCHURE_NOM,
  BROCHURE_URL,
  PDF_MAX,
  validerEmail,
  civilite,
  varsNormalisees,
  remplir,
  objetDe,
  mentionBrochure,
  avecBrochure,
  decouperLigne,
  parseCsv,
  validerPdf,
  pdfDepuisBase64,
  evenementVersStatut,
  rangerStatut,
  verifierSignatureResend,
  cleServiceValide,
  interpreterLectureJournal,
  nomPiecePropre
};
