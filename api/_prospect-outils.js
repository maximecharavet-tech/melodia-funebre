/* Outils purs des courriels de prospection (ESM, pour les routes Vercel). */
import * as crypto from 'crypto';

const SITE = 'https://melodia-funebre.fr';
const BROCHURES = {
  professionnels: {
    id: 'professionnels',
    label: 'Brochure professionnelle',
    chemin: 'documents/melodia-brochure-professionnels.pdf',
    nom: 'Melodia-Funebre-Brochure-professionnels.pdf'
  },
  'pompes-funebres': {
    id: 'pompes-funebres',
    label: 'Brochure Pompes funèbres',
    chemin: 'documents/melodia-brochure-pompes-funebres.pdf',
    nom: 'Melodia-Funebre-Brochure-Pompes-funebres.pdf'
  },
  marbriers: {
    id: 'marbriers',
    label: 'Brochure Marbriers',
    chemin: 'documents/melodia-brochure-marbriers.pdf',
    nom: 'Melodia-Funebre-Brochure-Marbriers.pdf'
  },
  crematoriums: {
    id: 'crematoriums',
    label: 'Brochure Crématoriums',
    chemin: 'documents/melodia-brochure-crematoriums.pdf',
    nom: 'Melodia-Funebre-Brochure-Crematoriums.pdf'
  },
  'pompes-funebres-v2': {
    id: 'pompes-funebres-v2',
    label: 'Brochure Pompes funèbres — nouvelle édition',
    chemin: 'documents/melodia-brochure-pompes-funebres-v2.pdf',
    nom: 'Melodia-Funebre-Brochure-Pompes-funebres-nouvelle-edition.pdf'
  },
  'marbriers-v2': {
    id: 'marbriers-v2',
    label: 'Brochure Marbriers — nouvelle édition',
    chemin: 'documents/melodia-brochure-marbriers-v2.pdf',
    nom: 'Melodia-Funebre-Brochure-Marbriers-nouvelle-edition.pdf'
  },
  'crematoriums-v2': {
    id: 'crematoriums-v2',
    label: 'Brochure Crématoriums — nouvelle édition',
    chemin: 'documents/melodia-brochure-crematoriums-v2.pdf',
    nom: 'Melodia-Funebre-Brochure-Crematoriums-nouvelle-edition.pdf'
  },
  'prestige-offrande': {
    id: 'prestige-offrande',
    label: 'Brochure prestige « L’Offrande » — pompes funèbres',
    chemin: 'documents/melodia-brochure-prestige-offrande.pdf',
    nom: 'Melodia-Funebre-Prestige-L-Offrande.pdf'
  },
  'prestige-ecoute': {
    id: 'prestige-ecoute',
    label: 'Brochure prestige « L’Écoute » — professionnels',
    chemin: 'documents/melodia-brochure-prestige-ecoute.pdf',
    nom: 'Melodia-Funebre-Prestige-L-Ecoute.pdf'
  },
  'prestige-art': {
    id: 'prestige-art',
    label: 'Brochure prestige — Œuvre d’art (pompes funèbres)',
    chemin: 'documents/melodia-brochure-prestige-art.pdf',
    nom: 'Melodia-Funebre-Prestige-Oeuvre-d-art.pdf'
  },
  'souvenirs-qui-resonnent': {
    id: 'souvenirs-qui-resonnent',
    label: 'Brochure Souvenirs qui résonnent (familles)',
    chemin: 'documents/melodia-brochure-souvenirs-qui-resonnent.pdf',
    nom: 'Melodia-Funebre-Souvenirs-qui-resonnent.pdf'
  },
  ceremonie: {
    id: 'ceremonie',
    label: 'Brochure Cérémonie (pompes funèbres & officiants)',
    chemin: 'documents/melodia-brochure-ceremonie.pdf',
    nom: 'Melodia-Funebre-Ceremonie-Pompes-funebres-Officiants.pdf'
  },
  'ecoute-exemples': {
    id: 'ecoute-exemples',
    label: 'Écoutez — exemples de musiques du site (disque d’or, liens et QR)',
    chemin: 'documents/melodia-brochure-ecoute-exemples.pdf',
    nom: 'Melodia-Funebre-Ecoutez-exemples-de-musiques.pdf'
  },
  'presentation-agences': {
    id: 'presentation-agences',
    label: 'Présentation agences partenaires (pompes funèbres, crématoriums, marbriers, officiants)',
    chemin: 'documents/melodia-presentation-agences-partenaires.pdf',
    nom: 'Melodia-Funebre-Presentation-agences-partenaires.pdf'
  },
  'offre-pro': {
    id: 'offre-pro',
    label: 'Offre Pro — questionnaire, composition, QR, plaque, mémorial',
    chemin: 'documents/melodia-offre-pro.pdf',
    nom: 'Melodia-Funebre-Offre-Pro.pdf'
  },
  'ecoute-prestige': {
    id: 'ecoute-prestige',
    label: 'Plaquette Écoutez prestige (disque d’or, extraits, liens et QR)',
    chemin: 'documents/melodia-plaquette-ecoute-prestige.pdf',
    nom: 'Melodia-Funebre-Plaquette-Ecoutez-prestige.pdf'
  },
  'fiche-contact-julie': {
    id: 'fiche-contact-julie',
    label: 'Fiche contact Julie Serve (carte de visite)',
    chemin: 'documents/melodia-fiche-contact-julie-serve.pdf',
    nom: 'Melodia-Funebre-Fiche-contact-Julie-Serve.pdf'
  }
};
const BROCHURE_IDS = Object.keys(BROCHURES);
const BROCHURE_CHEMIN = BROCHURES.professionnels.chemin;
const BROCHURE_NOM = BROCHURES.professionnels.nom;
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
    lien_brochure: BROCHURE_URL,
    /* Phrase d'accroche personnalisée (console v2) : une ligne, sans balise. */
    accroche: String(v.accroche || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 300)
  };
}

function remplir(texte, vars) {
  const v = varsNormalisees(vars);
  /* Sans accroche, sa ligne disparaît avec son paragraphe vide. */
  let t = String(texte || '');
  if (!v.accroche) t = t.replace(/\n*\{accroche\}\n*/g, (m) => (m.split('\n').length > 2 ? '\n\n' : ''));
  return t.replace(/\{([^{}]+)\}/g, (m, k) => {
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

function resoudreBrochures(entree, joindreBrochure) {
  if (entree !== undefined && entree !== null) {
    const list = Array.isArray(entree) ? entree : [entree];
    const out = [];
    const vus = new Set();
    for (let i = 0; i < list.length; i++) {
      const id = String(list[i] || '').trim();
      if (!id) continue;
      if (!BROCHURES[id]) {
        return { ok: false, motif: 'Brochure inconnue.', brochures: [], ids: [] };
      }
      if (vus.has(id)) continue;
      vus.add(id);
      out.push(BROCHURES[id]);
    }
    return { ok: true, brochures: out, ids: out.map((b) => b.id) };
  }
  if (joindreBrochure === false) return { ok: true, brochures: [], ids: [] };
  return { ok: true, brochures: [BROCHURES.professionnels], ids: ['professionnels'] };
}

function brochureSuggeree(contexte) {
  const c = contexte || {};
  const morceaux = [c.type, c.activite, c.activite_principale, c.metier, c.categorie,
    c.societe, c.agence, c.nom, c.enseigne]
    .map((x) => String(x || '').toLowerCase()).join(' ');
  if (/marbr/.test(morceaux)) return 'marbriers';
  if (/cr[eé]matorium/.test(morceaux)) return 'crematoriums';
  if (/pompe|fun[eè]bre|obs[eè]ques/.test(morceaux)) return 'pompes-funebres';
  const cat = String(c.categorie || '').toLowerCase();
  if (cat === 'pompes' || cat === 'sequence' || cat === 'prospection-plus') return 'pompes-funebres';
  return null;
}

function urlDeBrochure(b, urls) {
  if (!b) return BROCHURE_URL;
  if (typeof urls === 'string') return urls;
  if (urls && typeof urls === 'object') {
    if (urls[b.id]) return urls[b.id];
    if (urls[b.chemin]) return urls[b.chemin];
  }
  return SITE + '/' + b.chemin;
}

function itemsMention(joindreOuListe, urlOuMap) {
  if (joindreOuListe === false || joindreOuListe == null || joindreOuListe === '') return [];
  if (joindreOuListe === true) {
    return [{ label: BROCHURES.professionnels.label, url: (typeof urlOuMap === 'string' && urlOuMap) || BROCHURE_URL }];
  }
  const list = Array.isArray(joindreOuListe) ? joindreOuListe : [];
  const items = [];
  for (let i = 0; i < list.length; i++) {
    const b = typeof list[i] === 'string' ? BROCHURES[list[i]] : list[i];
    if (!b || !b.label) continue;
    items.push({ label: b.label, url: urlDeBrochure(b, urlOuMap) });
  }
  return items;
}

function mentionBrochure(joindreOuListe, urlOuMap) {
  const items = itemsMention(joindreOuListe, urlOuMap);
  if (!items.length) return '';
  if (items.length === 1) {
    const nom = items[0].label.replace(/^Brochure /i, 'brochure ');
    return 'La ' + nom + ' est jointe à ce courriel. Vous pouvez aussi la consulter ici :\n' + items[0].url;
  }
  return 'Les brochures suivantes sont jointes à ce courriel :\n' +
    items.map((it) => '— ' + it.label + ' : ' + it.url).join('\n');
}

function avecBrochure(texte, joindreOuListe, urlOuMap) {
  const t = String(texte || '').replace(/\s+$/, '');
  const mention = mentionBrochure(joindreOuListe, urlOuMap);
  if (!mention) return t;
  const items = itemsMention(joindreOuListe, urlOuMap);
  const deja = items.some((it) => t.indexOf(it.url) !== -1) || /brochure .+ est jointe/i.test(t) || /brochures suivantes sont jointes/i.test(t);
  if (deja) return t;
  return t + '\n\n' + mention;
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
    case 'email.unsubscribed': return 'plainte';
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
  BROCHURES,
  BROCHURE_IDS,
  BROCHURE_CHEMIN,
  BROCHURE_NOM,
  BROCHURE_URL,
  PDF_MAX,
  validerEmail,
  civilite,
  varsNormalisees,
  remplir,
  objetDe,
  resoudreBrochures,
  brochureSuggeree,
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
