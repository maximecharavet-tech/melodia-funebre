// ═══════════════════════════════════════════════════════════════
// /api/prospect-mail — Courriels de prospection : aperçu, test, envoi
//
// La console commerciale composait un lien « mailto: » : le message
// partait du logiciel de messagerie du collaborateur, sans mise en
// forme, sans logo, et sans trace côté maison. Cette fonction l'envoie
// vraiment, habillé — bannière en tête, carte de visite en signature.
//
// ─── TROIS MODES ───
//   apercu  rend le courriel tel qu'il partira, sans rien envoyer.
//           C'est le gabarit du serveur qui s'affiche dans la console :
//           ce que le collaborateur voit est exactement ce qui part.
//   test    l'envoie au seul collaborateur connecté, objet « [Test] ».
//   envoi   un ou plusieurs destinataires (50 au plus par appel), en
//           un seul appel au service d'envoi. Plus de plafond
//           applicatif bloquant : le compteur du jour reste affiché.
//           Le forfait Resend gratuit (100/jour, 3 000/mois) reste
//           le seul plafond dur, côté prestataire.
//   quota   le nombre d'envois déjà partis aujourd'hui, sans rien
//           envoyer. Chaque réponse porte quota: {utilise, illimite}.
//
// ─── QUI A LE DROIT D'ENVOYER ───
// Cette route envoyait n'importe quel texte à n'importe quelle adresse,
// signé Melodia, à qui l'appelait — sans session ni contrôle d'origine.
// Avec l'envoi groupé, c'eût été un relais de pourriel aux couleurs de
// la maison. Désormais, test et envoi exigent une session valide, que
// Supabase authentifie, et un rôle « commercial » ou « master » lu dans
// la base. L'adresse de réponse est celle du compte connecté, jamais
// une adresse fournie par le navigateur.
//
// ─── EXPÉDITEUR SÉPARÉ ───
// Le démarchage part de PROSPECT_FROM (contact.melodia-funebre.fr) et
// non de l'adresse qui porte les livraisons : une agence agacée qui le
// signale comme indésirable n'abîme pas le domaine par lequel une
// famille reçoit l'hommage de son père.
//
// Variables d'environnement (Vercel → Settings → Environment Variables) :
//   RESEND_API_KEY             clé Resend (resend.com)
//   PROSPECT_FROM              expéditeur de prospection, vérifié chez Resend ;
//                              seul son domaine sert : chaque courriel part
//                              au nom du collaborateur connecté
//                              (« Julie Serve <julie@contact.…> »)
//   LEAD_TO                    copie invisible des envois unitaires
//   SITE_URL                   adresse publique du site (logo, bannière)
//   SUPABASE_URL               projet Supabase (repli : celui du site)
//   SUPABASE_SERVICE_ROLE_KEY  lecture du rôle dans la table « roles »
//
// Sans clé d'envoi, test et envoi répondent 503 NOT_CONFIGURED et la
// console retombe sur le « mailto: » — rien n'est perdu en silence.
// ═══════════════════════════════════════════════════════════════

import { readFile } from 'fs/promises';
import {
  SITE, gabarit, carteVisite, envoyer, envoyerLot, valideEmail,
  expediteurProspection, boiteMaison, origineAutorisee, entetesOrigine, tropSouvent,
  entetesService
} from './_courrier.js';
import { urlDesabo, entetesDesabonnement, textePiedProspection, normaliserEmail } from './_desabonnement.js';
import { cleEnvoi, creerStoreMemoire, creerStoreSupabase, envoyerUnique, ligneAncienne } from './_envoi-unique.js';
import { timingSafeEqual } from 'crypto';
import { estModeleJulie, composerModele } from './_modeles-prospect.js';
import { gabaritV2, layoutValide } from './_courrier-v2.js';
import {
  BROCHURE_CHEMIN, BROCHURE_NOM, BROCHURE_URL,
  pdfDepuisBase64, nomPiecePropre, avecBrochure,
  resoudreBrochures
} from './_prospect-outils.js';

const SB_URL = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
/* La clé « anon » est publique par construction (elle est dans le source
   du site) : elle sert seulement à demander à Supabase qui porte le jeton. */
const SB_ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dmdta29vemVyZmdnZHZ2dWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NjA1MTUsImV4cCI6MjEwNDEzNjUxNX0.FfvtgMMC7KqbANL7Zz4Ecwd9br5o7_ToDPCIZoB23sw';
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ROLES_PERMIS = ['commercial', 'master'];
const LOT_MAX = 50;

/* ─── Compteur du jour (jour de Paris) ───
   Plus de plafond applicatif bloquant. On continue de compter les
   envois dans public.envois_prospect pour l'affichage. Les anciens
   écrans lisent encore max/restant : on leur envoie une valeur assez
   haute pour ne jamais bloquer le bouton. Le forfait Resend gratuit
   (100/jour, 3 000/mois, tous envois du compte) reste un plafond du
   prestataire, non retirable sans offre payante. */
const COMPAT_AFFICHAGE = 9999;

/* Visuel de campagne en .webp : Outlook n'affiche pas le WebP. On
   sert la copie JPG déjà rangée dans /assets/img/courriel/. */
function visuelCourriel(chemin) {
  const m = String(chemin || '').match(/^\/assets\/img\/campagne\/([a-z0-9-]+)\.webp$/i);
  return m ? '/assets/img/courriel/' + m[1] + '.jpg' : String(chemin || '');
}

function visuelAutorise(chemin) {
  const v = visuelCourriel(chemin);
  return /^\/assets\/img\/(?:courriel|campagne)\/[a-z0-9-]+\.jpg$/i.test(v) ? v : '';
}

function urlPubliqueDe(chemin) {
  const c = String(chemin || BROCHURE_CHEMIN).replace(/^\/+/, '');
  const h = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  if (h) return 'https://' + String(h).replace(/^https?:\/\//, '') + '/' + c;
  return 'https://melodia-funebre.fr/' + c;
}

function urlBrochurePublique() {
  return urlPubliqueDe(BROCHURE_CHEMIN);
}

const cacheBrochures = new Map();
async function lireBrochureChemin(chemin) {
  const cle = String(chemin || '');
  if (cacheBrochures.has(cle)) {
    const v = cacheBrochures.get(cle);
    return v === false ? null : v;
  }
  try {
    const buf = await readFile(cle);
    cacheBrochures.set(cle, buf);
    return buf;
  } catch (e) {
    cacheBrochures.set(cle, false);
    return null;
  }
}

async function lireBrochure() {
  return lireBrochureChemin(BROCHURE_CHEMIN);
}

async function piecesJointes(brochures, perso, lot) {
  const atts = [];
  const liste = Array.isArray(brochures) ? brochures : (brochures ? [BROCHURES_FALLBACK] : []);
  for (let i = 0; i < liste.length; i++) {
    const b = liste[i];
    const buf = lot ? null : await lireBrochureChemin(b.chemin);
    if (buf) atts.push({ filename: b.nom, content: buf.toString('base64') });
    else atts.push({ filename: b.nom, path: urlPubliqueDe(b.chemin) });
  }
  if (perso) atts.push(perso);
  return atts;
}

const BROCHURES_FALLBACK = { chemin: BROCHURE_CHEMIN, nom: BROCHURE_NOM };

/* Interrupteur de l’envoi (Resend). Vrai : test et envoi partent, après
   contrôle de session et de rôle. Faux : 503 ENVOI_DESACTIVE, l’aperçu
   continue et la console retombe sur la messagerie du collaborateur. */
const ENVOI_ACTIF = true;

function json(res, code, corps) { return res.status(code).json(corps); }

/* ─── Qui demande ? ───
   Le jeton vient du navigateur : il ne prouve rien par lui-même. Supabase
   seul dit s'il est authentique et à qui il appartient ; le rôle se lit
   ensuite dans la table « roles », jamais dans les métadonnées du compte,
   que son titulaire peut écrire. */
/* Une ligne lue d'abord AVEC LA SESSION de l'utilisateur (clé anon +
   son jeton : la RLS « chacun lit son role » / « chacun lit sa propre
   fiche » la lui ouvre), puis, à défaut, avec la clé de service.
   L'ancienne version envoyait d'emblée la clé de service en Bearer :
   une clé secrète sb_secret_… n'est pas un JWT, PostgREST refusait, le
   rôle restait vide et Julie recevait « Seuls les collaborateurs… ». */
async function lireLigne(table, colonnes, email, jeton) {
  const chemin = SB_URL + '/rest/v1/' + table + '?select=' + colonnes + ',email&email=ilike.' + encodeURIComponent(email);
  const exacte = (l) => (Array.isArray(l) ? l : []).filter((x) => String((x && x.email) || '').toLowerCase() === email)[0] || null;
  const essais = [{ apikey: SB_ANON, Authorization: 'Bearer ' + jeton }];
  const service = entetesService();
  if (service) essais.push(service);
  for (const headers of essais) {
    try {
      const r = await fetch(chemin, { headers });
      if (!r.ok) continue;
      const ligne = exacte(await r.json());
      if (ligne) return ligne;
    } catch (e) { /* essai suivant */ }
  }
  return null;
}

/* Appel interne de /api/sequences-cron : jamais sans SEQUENCES_AUTO === 'true',
   ni sans le secret CRON_SECRET (comparaison à temps constant). Le cron
   nomme le collaborateur propriétaire de l'inscription ; son rôle est relu
   en base comme pour une session ordinaire — aucun privilège de plus. */
function appelCronValide(req) {
  if (process.env.SEQUENCES_AUTO !== 'true') return null;
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  const h = req.headers || {};
  const bearer = String(h.authorization || h.Authorization || '');
  const a = Buffer.from(bearer), b = Buffer.from('Bearer ' + secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const owner = normaliserEmail(h['x-melodia-sequence-owner']);
  return owner || null;
}

async function demandeur(req) {
  const proprietaire = appelCronValide(req);
  if (proprietaire) {
    const r = await lireLigne('roles', 'role', proprietaire, '');
    const f = await lireLigne('collaborateurs', 'nom,name', proprietaire, '');
    return { email: proprietaire, role: (r && r.role) || null, cron: true,
      nom: String((f && (f.nom || f.name)) || proprietaire.split('@')[0]).slice(0, 120) };
  }
  const entete = req.headers.authorization || req.headers.Authorization || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : '';
  if (!jeton) return null;
  let moi;
  try {
    const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_ANON, Authorization: 'Bearer ' + jeton } });
    if (!r.ok) return null;
    moi = await r.json();
  } catch (e) { return null; }
  const email = String((moi && moi.email) || '').toLowerCase();
  if (!email) return null;

  /* Le rôle se lit dans la table « roles », jamais dans les métadonnées
     du compte, que son titulaire peut écrire. */
  const r = await lireLigne('roles', 'role', email, jeton);
  const role = (r && r.role) || null;

  /* Le nom affiché vient d'abord de la fiche « collaborateurs », que seul
     le fondateur écrit ; à défaut, du compte authentifié par Supabase.
     Jamais d'un champ envoyé par le navigateur. */
  const f = await lireLigne('collaborateurs', 'nom,name', email, jeton);
  const fiche = (f && (f.nom || f.name)) || '';

  const meta = (moi && moi.user_metadata) || {};
  return { email, role, nom: String(fiche || meta.name || meta.nom || meta.full_name || email.split('@')[0]).slice(0, 120) };
}

/* ─── Le jour de Paris ───
   Minuit à Paris, en instant UTC : c'est la borne du quota. */
export function debutJourParis(maintenant) {
  const t = maintenant || new Date();
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  const p = {};
  f.formatToParts(t).forEach((x) => { p[x.type] = x.value; });
  const commeUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const decalage = commeUtc - Math.floor(t.getTime() / 1000) * 1000;
  return new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - decalage);
}

/* Repli en mémoire de l'instance, quand le journal est inaccessible. */
const memoire = new Map();
function cleMemoire(email, mode) { return email + '|' + mode + '|' + debutJourParis().toISOString().slice(0, 10); }

let journalAbsent = false;

/* Ce qui est déjà parti aujourd'hui pour ce collaborateur et ce mode.
   Renvoie { persistant, lignes:[{destinataire, modele, sujet}] }. */
async function envoisDuJour(email, mode) {
  const service = entetesService();
  if (service && !journalAbsent) {
    try {
      const url = SB_URL + '/rest/v1/envois_prospect?select=destinataire,modele,sujet' +
        '&collaborateur=eq.' + encodeURIComponent(email) + '&mode=eq.' + mode + '&statut=neq.echec' +
        '&envoye_le=gte.' + encodeURIComponent(debutJourParis().toISOString()) + '&limit=1000';
      const r = await fetch(url, { headers: service });
      if (r.ok) {
        const l = await r.json();
        return { persistant: true, lignes: Array.isArray(l) ? l : [] };
      }
      const texte = await r.text();
      if (r.status === 404 || /42P01|PGRST205|envois_prospect/i.test(texte)) journalAbsent = true;
    } catch (e) { /* base injoignable : repli */ }
  }
  return { persistant: false, lignes: memoire.get(cleMemoire(email, mode)) || [] };
}

async function journaliser(email, mode, lignes) {
  const liste = memoire.get(cleMemoire(email, mode)) || [];
  lignes.forEach((l) => liste.push({ destinataire: l.destinataire, modele: l.modele, sujet: l.sujet }));
  memoire.set(cleMemoire(email, mode), liste);
  if (memoire.size > 500) memoire.clear();
  const service = entetesService({ 'Content-Type': 'application/json', Prefer: 'return=minimal' });
  if (!service || journalAbsent) return false;
  try {
    const r = await fetch(SB_URL + '/rest/v1/envois_prospect', {
      method: 'POST', headers: service,
      body: JSON.stringify(lignes.map((l) => Object.assign({ collaborateur: email, mode }, l)))
    });
    if (!r.ok) {
      const texte = await r.text();
      if (r.status === 404 || /42P01|PGRST205|envois_prospect/i.test(texte)) journalAbsent = true;
      return false;
    }
    return true;
  } catch (e) { return false; }
}

function quotaDe(role, mode, utilise, persistant) {
  return {
    utilise,
    max: COMPAT_AFFICHAGE,
    restant: COMPAT_AFFICHAGE,
    illimite: true,
    bloque: false,
    conseil: 'Le forfait Resend gratuit est limité à 100 courriels par jour et 3 000 par mois, tous envois du compte confondus.',
    mode,
    persistant
  };
}

/* ─── Le magasin d'idempotence ───
   Un seul par instance : la base (clé unique) est la vraie source de
   vérité ; la mémoire ne sert que de repli (voir _envoi-unique.js). */
const memoireEnvois = creerStoreMemoire();
let storeEnvois = null;
function magasinEnvois() {
  const service = entetesService();
  if (!service) return memoireEnvois;
  if (!storeEnvois) storeEnvois = creerStoreSupabase({ url: SB_URL, entetes: () => entetesService() || {}, repli: memoireEnvois });
  return storeEnvois;
}
/* Pour les tests : repart d'un état neuf. */
export function reinitialiserMagasinEnvois() { storeEnvois = null; memoireEnvois.lignes.clear(); journalAbsent = false; }

/* Adresses à ne plus contacter : désabonnées (prospects.oppose), rejetées
   (prospects.rejete), ou dont un envoi précédent a rebondi / été signalé
   (envois_prospect.statut = rejete | plainte). Une requête par source,
   pour tout le lot. */
function adresseSure(a) { return String(a || '').toLowerCase().replace(/[^a-z0-9@._+-]/g, ''); }
async function adressesBloquees(adresses) {
  const liste = [...new Set((adresses || []).map(adresseSure).filter(Boolean))];
  const bloque = new Map();
  const service = entetesService();
  if (!liste.length || !service) return bloque;
  const ou = '(' + liste.map((a) => 'email.ilike.' + a).join(',') + ')';
  const lire = async (url) => { try { const r = await fetch(url, { headers: service }); return r.ok ? await r.json() : null; } catch (e) { return null; } };
  let pros = await lire(SB_URL + '/rest/v1/prospects?select=email,oppose,rejete&or=' + encodeURIComponent(ou) + '&limit=1000');
  if (pros === null) pros = await lire(SB_URL + '/rest/v1/prospects?select=email,oppose&or=' + encodeURIComponent(ou) + '&limit=1000');
  (Array.isArray(pros) ? pros : []).forEach((p) => {
    const a = normaliserEmail(p && p.email);
    if (p && p.oppose) bloque.set(a, 'DESABONNE');
    else if (p && p.rejete && !bloque.has(a)) bloque.set(a, 'REJETE');
  });
  const rebonds = await lire(SB_URL + '/rest/v1/envois_prospect?select=destinataire&statut=in.(rejete,plainte)&destinataire=in.(' +
    liste.map((a) => '"' + a + '"').join(',') + ')&limit=1000');
  (Array.isArray(rebonds) ? rebonds : []).forEach((l) => {
    const a = normaliserEmail(l && l.destinataire);
    if (!bloque.has(a)) bloque.set(a, 'REJETE');
  });
  return bloque;
}

/* ─── L'expéditeur : « Julie Serve <julie@contact.melodia-funebre.fr> » ───
   Le domaine est toujours celui de PROSPECT_FROM (le seul vérifié chez
   Resend). La partie locale reprend celle du compte du collaborateur,
   réduite à [a-z0-9._-] ; « contact » si rien n'en reste. Le nom est
   nettoyé de tout ce qui pourrait casser l'en-tête. Les réponses vont
   à la vraie adresse du compte (reply_to). */
function domaineDe(from) {
  const m = String(from || '').match(/@([a-z0-9.-]+\.[a-z]{2,})\s*>?\s*$/i);
  return m ? m[1].toLowerCase() : '';
}
export function partieLocale(email) {
  let l = String(email || '').split('@')[0].toLowerCase().split('+')[0];
  l = l.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  l = l.replace(/[^a-z0-9._-]/g, '').replace(/\.{2,}/g, '.').replace(/^[._-]+|[._-]+$/g, '').slice(0, 40);
  l = l.replace(/[._-]+$/g, '');
  return l || 'contact';
}
export function nomAffiche(nom) {
  return String(nom || '').replace(/[\u0000-\u001f\u007f"<>@,;:\\()\[\]]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, 64).trim();
}
export function expediteurDe(qui, fromBase) {
  const domaine = domaineDe(fromBase);
  if (!domaine) return fromBase;
  const nom = nomAffiche(qui && qui.nom) || 'Melodia Funèbre';
  return '"' + nom + '" <' + partieLocale(qui && qui.email) + '@' + domaine + '>';
}

/* Un destinataire du lot, nettoyé et validé. */
function lire(e) {
  return {
    to: String((e && e.to) || '').trim().slice(0, 160),
    sujet: String((e && e.sujet) || '').trim().slice(0, 200),
    texte: String((e && e.texte) || '').slice(0, 12000),
    titre: String((e && e.titre) || '').slice(0, 160),
    ref: String((e && (e.ref || e.siret)) || '').slice(0, 40),
    nom: String((e && (e.nom || e.dirigeant)) || '').trim().slice(0, 120),
    societe: String((e && (e.societe || e.agence)) || '').trim().slice(0, 160),
    ville: String((e && e.ville) || '').trim().slice(0, 80),
    accroche: String((e && e.accroche) || '').slice(0, 300)
  };
}

/* Un modèle Julie se compose ici : le navigateur n'envoie que l'id
   et les champs (nom, e-mail, société, ville). */
function appliquerModele(e, modeleId, brochures, liensBrochure) {
  if (estModeleJulie(modeleId)) {
    const c = composerModele(modeleId, {
      nom: e.nom, societe: e.societe, ville: e.ville, email: e.to, accroche: e.accroche
    }, { brochures: brochures.map((b) => b.id), liensBrochure });
    return Object.assign({}, e, {
      sujet: c.sujet,
      titre: c.titre,
      texte: c.texte,
      visuel: visuelAutorise(c.visuel),
      visuelAlt: c.visuelAlt || '',
      lienTexte: (c.bouton && c.bouton.texte) || '',
      lienUrl: (c.bouton && c.bouton.url) || ''
    });
  }
  return Object.assign({}, e, { texte: avecBrochure(e.texte, brochures, liensBrochure) });
}
function defautDe(e, exigerDest) {
  if (exigerDest && !valideEmail(e.to)) return 'Adresse du destinataire invalide.';
  if (!e.sujet) return 'Objet manquant.';
  if (e.texte.trim().length < 30) return 'Message trop court.';
  return '';
}

export default async function handler(req, res) {
  entetesOrigine(req, res, 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(origineAutorisee(req) ? 200 : 403).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'POST uniquement' });

  if (!origineAutorisee(req)) {
    return json(res, 403, { error: 'Origine non autorisée.', code: 'ORIGINE' });
  }

  const d = (req.body && typeof req.body === 'object') ? req.body : {};
  const mode = ['apercu', 'test', 'envoi', 'quota', 'journal', 'deja'].indexOf(d.mode) !== -1 ? d.mode : 'envoi';
  /* Le modèle choisi : il sert à ne pas renvoyer le même courrier au
     même destinataire le même jour. À défaut, l'objet en tient lieu. */
  const modele = String(d.modele || '').trim().slice(0, 80);
  /* L'ancien appel (un seul destinataire à plat) reste compris. */
  const envois = (Array.isArray(d.envois) && d.envois.length ? d.envois : [d]).map(lire);
  const lien = {
    lienTexte: String(d.lienTexte || '').slice(0, 60),
    lienUrl: /^https:\/\//.test(String(d.lienUrl || '')) ? String(d.lienUrl).slice(0, 300) : ''
  };
  /* Le visuel du modèle : un chemin du site, jamais une adresse ni du
     HTML venus du navigateur. Seules les images JPG des dossiers
     courriel/ et campagne/ sont admises ; le gabarit écrit la balise. */
  const visuel = /^\/assets\/img\/(?:courriel|campagne)\/[a-z0-9-]+\.jpg$/i.test(String(d.visuel || ''))
    ? String(d.visuel) : '';
  const visuelAlt = String(d.visuelAlt || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  const choix = resoudreBrochures(d.brochures, d.joindreBrochure);
  if (!choix.ok) return json(res, 400, { error: choix.motif, code: 'BROCHURE' });
  const brochures = choix.brochures;
  const liensBrochure = {};
  brochures.forEach((b) => { liensBrochure[b.id] = urlPubliqueDe(b.chemin); });
  const joindreBrochure = brochures.length > 0;
  const lienBrochure = brochures[0] ? urlPubliqueDe(brochures[0].chemin) : urlBrochurePublique();
  let piecePerso = null;
  if (d.pieceBase64) {
    const v = pdfDepuisBase64(d.pieceBase64);
    if (!v.ok) return json(res, 400, { error: v.motif, code: 'PIECE' });
    piecePerso = { filename: nomPiecePropre(d.pieceNom), content: v.buf.toString('base64') };
  }
  const sigEntree = (d.signature && typeof d.signature === 'object') ? d.signature : {};
  /* Console v2 : « lettre » ou « carte » passent par _courrier-v2.js ;
     sans choix (ou « editorial »), le gabarit historique reste la règle. */
  const layout = layoutValide(d.layout) && String(d.layout).toLowerCase() !== 'editorial' ? String(d.layout).toLowerCase() : '';
  const habiller = (e, sig) => {
    const unsub = (e.to && valideEmail(e.to)) ? urlDesabo(e.to) : (SITE + '/api/prospect-stop');
    return layout ? gabaritV2({
      layout, sujet: e.sujet, preheader: e.texte.replace(/\s+/g, ' ').slice(0, 140), texte: e.texte,
      visuel: e.visuel || visuel, visuelAlt: e.visuelAlt || visuelAlt,
      lienTexte: e.lienTexte || lien.lienTexte, lienUrl: e.lienUrl || lien.lienUrl, signature: sig, unsub
    }) : gabarit({
      sujet: e.sujet, titre: e.titre, texte: e.texte,
      apercu: e.texte.replace(/\s+/g, ' ').slice(0, 140),
      lienTexte: e.lienTexte || lien.lienTexte, lienUrl: e.lienUrl || lien.lienUrl,
      visuel: e.visuel || visuel, visuelAlt: e.visuelAlt || visuelAlt,
      banniere: true, signature: sig, pied: 'prospection', cartesEcoute: true, unsub
    });
  };
  const signature = (nom, email) => ({
    nom: String(sigEntree.nom || nom || 'Melodia Funèbre').slice(0, 80),
    role: String(sigEntree.role || '').slice(0, 90),
    tel: String(sigEntree.tel || '').slice(0, 24),
    photo: String(sigEntree.photo || ''),
    email: email
  });

  /* ─── Aperçu : rien ne part ─── */
  if (mode === 'apercu') {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnu';
    if (await tropSouvent('apercu:' + ip, 120, 10 * 60 * 1000)) return json(res, 429, { error: 'Trop d\'aperçus demandés.', code: 'RATE_LIMIT' });
    let e = appliquerModele(envois[0], modele, brochures, liensBrochure);
    if (!e.sujet) e.sujet = 'Melodia Funèbre';
    const email = valideEmail(sigEntree.email) ? String(sigEntree.email).trim() : '';
    /* « Mon compte » ne montre que la carte : la bannière et le texte
       la repoussaient sous le bord de l'aperçu. */
    if (d.partie === 'signature') {
      return json(res, 200, { ok: true, html: '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>' +
        '<body style="margin:0;padding:24px;background:#f4f1ea;">' + carteVisite(signature('', email)) + '</body></html>' });
    }
    return json(res, 200, {
      ok: true,
      html: habiller(e, signature('', email)),
      pieces: brochures.map((b) => ({ id: b.id, label: b.label, nom: b.nom, url: liensBrochure[b.id] }))
    });
  }

  /* ─── Test et envoi : session obligatoire ─── */
  if (!ENVOI_ACTIF) {
    return json(res, 503, {
      error: 'L’envoi automatique est désactivé.',
      code: 'ENVOI_DESACTIVE',
      hint: 'Les courriers se copient ou s’ouvrent dans la messagerie. Aucun service payant n’est appelé.'
    });
  }

  const exp = expediteurProspection();
  if (!process.env.RESEND_API_KEY || !exp) {
    return json(res, 503, {
      error: 'L\'envoi de courriels n\'est pas configuré.',
      code: 'NOT_CONFIGURED',
      hint: 'Renseignez RESEND_API_KEY et PROSPECT_FROM dans Vercel, puis redéployez.'
    });
  }

  let qui;
  try { qui = await demandeur(req); } catch (e) { qui = null; }
  if (!qui) return json(res, 401, { error: 'Session absente ou expirée : reconnectez-vous.', code: 'NON_CONNECTE' });
  if (ROLES_PERMIS.indexOf(qui.role) === -1) {
    return json(res, 403, { error: 'Seuls les collaborateurs et le fondateur envoient des courriels de prospection.', code: 'INTERDIT' });
  }

  /* ─── Quota du jour, sans rien envoyer ─── */
  const modeQuota = mode === 'test' ? 'test' : 'envoi';
  const deja = await envoisDuJour(qui.email, modeQuota);
  if (mode === 'quota') {
    const qt = await envoisDuJour(qui.email, 'test');
    return json(res, 200, {
      ok: true, mode,
      quota: quotaDe(qui.role, 'envoi', deja.lignes.length, deja.persistant),
      quotaTest: quotaDe(qui.role, 'test', qt.lignes.length, qt.persistant)
    });
  }
  if (mode === 'journal') {
    const service = entetesService();
    if (!service || journalAbsent) {
      return json(res, 200, {
        ok: true, mode, lignes: [],
        quota: quotaDe(qui.role, 'envoi', deja.lignes.length, deja.persistant),
        note: 'Journal des envois indisponible : appliquez la migration 20261103_08 pour le suivi.'
      });
    }
    try {
      const url = SB_URL + '/rest/v1/envois_prospect?select=id,destinataire,sujet,modele,mode,societe,piece_jointe,resend_id,statut,ouvert_nb,clique_nb,envoye_le,delivre_le,ouvert_le,clique_le,rejete_le,dernier_evenement' +
        '&collaborateur=eq.' + encodeURIComponent(qui.email) + '&statut=neq.echec' +
        '&order=envoye_le.desc&limit=80';
      const r = await fetch(url, { headers: service });
      if (!r.ok) {
        const texte = await r.text();
        if (r.status === 404 || /42P01|PGRST205|envois_prospect/i.test(texte)) journalAbsent = true;
        return json(res, 200, { ok: true, mode, lignes: [], quota: quotaDe(qui.role, 'envoi', deja.lignes.length, deja.persistant),
          note: 'Journal des envois indisponible : appliquez la migration 20261103_08 pour le suivi.' });
      }
      const lignes = await r.json();
      return json(res, 200, {
        ok: true, mode,
        lignes: Array.isArray(lignes) ? lignes : [],
        quota: quotaDe(qui.role, 'envoi', deja.lignes.length, deja.persistant)
      });
    } catch (e) {
      return json(res, 200, { ok: true, mode, lignes: [], quota: quotaDe(qui.role, 'envoi', deja.lignes.length, deja.persistant),
        note: 'Journal des envois indisponible.' });
    }
  }
  /* ─── « Déjà envoyé ? » : pour griser l'envoi dans la console ─── */
  if (mode === 'deja') {
    const liste = envois.filter((x) => valideEmail(x.to));
    const cles = liste.map((x) => cleEnvoi({ destinataire: x.to, modele, campagne: String(d.campagne || '').trim().slice(0, 80),
      etape: d.etape != null && d.etape !== '' ? Number(d.etape) : null, sujet: x.sujet }));
    const pris = await magasinEnvois().dejaEnvoyes(cles, liste.map((x) => x.to));
    return json(res, 200, { ok: true, mode, deja: liste.map((x, i) => ({
      to: x.to, ref: x.ref, deja: !!pris[cles[i]], statut: pris[cles[i]] || null })) });
  }
  const quota = quotaDe(qui.role, modeQuota, deja.lignes.length, deja.persistant);

  if (envois.length > LOT_MAX) {
    return json(res, 400, { error: 'Au plus ' + LOT_MAX + ' destinataires par envoi.', code: 'LOT_TROP_GRAND' });
  }
  /* Anti-abus uniquement (appels, pas courriels) : 300 requêtes/heure.
     La cadence Resend (~2 req/s + nouvel essai sur 429) est dans _courrier.js. */
  if (await tropSouvent('envoi:' + qui.email, 300, 60 * 60 * 1000)) {
    return json(res, 429, { error: 'Trop d\'envois cette heure-ci. Réessayez plus tard.', code: 'RATE_LIMIT' });
  }

  const sig = signature(qui.nom, qui.email);
  const de = expediteurDe(qui, exp);
  const refuses = [];
  const lignes = [];
  const dansLot = new Set();
  const campagne = String(d.campagne || '').trim().slice(0, 80);
  const etape = d.etape != null && d.etape !== '' && Number.isFinite(Number(d.etape)) ? Math.max(0, Math.floor(Number(d.etape))) : null;
  const sequenceId = d.sequence_id != null && Number.isFinite(Number(d.sequence_id)) ? Number(d.sequence_id) : null;

  if (piecePerso && envois.length > 3) {
    return json(res, 400, { error: 'La pièce jointe personnelle est limitée à 3 destinataires à la fois.', code: 'PIECE_LOT' });
  }
  const atts = (brochures.length || piecePerso)
    ? await piecesJointes(brochures, piecePerso, envois.length > 3)
    : [];

  /* Adresses à ne pas contacter : une lecture pour tout le lot. */
  const bloquees = mode === 'test' ? new Map() : await adressesBloquees(envois.map((x) => x.to));
  const MOTIFS = {
    DESABONNE: 'Cette adresse a demandé à ne plus être contactée.',
    REJETE: 'Cette adresse a rebondi ou signalé un message : elle n’est plus contactée.'
  };

  for (let idx = 0; idx < envois.length; idx++) {
    const e = appliquerModele(envois[idx], modele, brochures, liensBrochure);
    envois[idx] = e;
    if (mode === 'test') { e.to = qui.email; if (e.sujet && e.sujet.indexOf('[Test] ') !== 0) e.sujet = '[Test] ' + e.sujet; }
    const motif = defautDe(e, true);
    if (motif) { refuses.push({ to: e.to, ref: e.ref, motif }); continue; }
    if (mode !== 'test') {
      const adr = normaliserEmail(e.to);
      if (dansLot.has(adr)) { refuses.push({ to: e.to, ref: e.ref, motif: 'Adresse en double dans cet envoi.', code: 'DOUBLON' }); continue; }
      const b = bloquees.get(adr);
      if (b) { refuses.push({ to: e.to, ref: e.ref, motif: MOTIFS[b], code: b }); continue; }
      dansLot.add(adr);
    }
    const unsub = urlDesabo(e.to);
    const charge = {
      from: de,
      to: [e.to],
      subject: e.sujet,
      html: habiller(e, sig),
      text: e.texte + '\n\n—\n' + sig.nom + (sig.role ? '\n' + sig.role : '') + '\n' + qui.email + '\n' + SITE +
            (brochures.length ? '\nBrochures :\n' + brochures.map((b) => b.label + ' : ' + liensBrochure[b.id]).join('\n') : '') +
            '\n\n' + textePiedProspection(unsub),
      reply_to: qui.email,
      /* Bouton « Se désabonner » (RFC 8058, un clic) + lien mailto STOP. */
      headers: entetesDesabonnement(e.to, qui.email)
    };
    if (atts.length) charge.attachments = atts;
    lignes.push({
      e, charge,
      cle: mode === 'test' ? null : cleEnvoi({ destinataire: e.to, modele, campagne, etape, sujet: e.sujet }),
      meta: {
        collaborateur: qui.email, mode: modeQuota, destinataire: normaliserEmail(e.to),
        sujet: e.sujet.slice(0, 200), modele, ref: e.ref, societe: e.societe || '',
        piece_jointe: atts.map((a) => a.filename).filter(Boolean).join(', '),
        campagne, sequence_id: sequenceId, etape
      }
    });
  }

  if (!lignes.length) return json(res, 400, { error: refuses[0] ? refuses[0].motif : 'Rien à envoyer.', code: 'RIEN', refuses, quota });

  /* La maison voit ce qui part en son nom. Pour un lot, une seule copie
     — la première — plutôt que cinquante dans la boîte du fondateur. */
  const maison = boiteMaison();
  if (maison.length && mode === 'envoi') lignes[0].charge.bcc = maison;

  const expedier = (charges, cleIdem) => (charges.length === 1
    ? envoyer(charges[0], { idempotence: cleIdem })
    : envoyerLot(charges, { idempotence: cleIdem }));

  /* ─── Test : à soi-même, répétable, hors idempotence ─── */
  if (mode === 'test') {
    const r = await expedier(lignes.map((l) => l.charge), null);
    if (!r.ok) return json(res, r.status, { error: r.error, code: r.code, motif: r.motif, refuses, quota });
    const ids = r.ids || [r.id];
    const persiste = await journaliser(qui.email, 'test', lignes.map((l, i) => Object.assign(ligneAncienne(l.meta), {
      statut: 'envoye', resend_id: ids[i] || null })));
    return json(res, 200, {
      ok: true, mode, expediteur: de,
      envoyes: lignes.map((l, i) => ({ to: l.e.to, ref: l.e.ref, id: ids[i] || null })),
      refuses, quota: quotaDe(qui.role, 'test', quota.utilise + lignes.length, deja.persistant && persiste),
      envoye_le: new Date().toISOString()
    });
  }

  /* ─── Envoi : réserver, envoyer, confirmer — jamais deux fois ─── */
  const magasin = magasinEnvois();
  let out;
  try {
    out = await envoyerUnique({ store: magasin, lignes, envoyer: expedier });
  } catch (err) {
    return json(res, 503, {
      error: 'Le journal des envois est injoignable : rien n’est parti, par prudence (pas de risque de doublon). Réessayez dans un instant.',
      code: 'JOURNAL_INDISPONIBLE', refuses, quota
    });
  }
  out.doublons.forEach((x) => refuses.push({
    to: x.ligne.e.to, ref: x.ligne.e.ref, code: x.deja === 'lot' ? 'DOUBLON' : 'DEJA_ENVOYE',
    motif: x.deja === 'lot' ? 'Adresse en double dans cet envoi.'
      : x.deja === 'reserve' || x.deja === 'incertain'
        ? 'Un envoi à cette adresse est en cours ou à vérifier : pas de second envoi.'
        : 'Déjà envoyé à cette adresse avec ce modèle.'
  }));
  if (out.echec) {
    const f = out.echec;
    if (f.incertain) {
      return json(res, 504, {
        error: 'Le service d’envoi n’a pas répondu à temps : on ne sait pas si le message est parti. Par prudence il est bloqué contre un second envoi — vérifiez dans Resend avant de décider.',
        code: 'ENVOI_INCERTAIN', incertain: true, refuses, quota
      });
    }
    return json(res, f.status || 502, { error: f.error, code: f.code, motif: f.motif, retentable: true, refuses, quota });
  }
  if (!out.envoyes.length) {
    return json(res, 409, { error: refuses[0] ? refuses[0].motif : 'Déjà envoyé.', code: 'DEJA_ENVOYE', refuses, quota });
  }
  const utilise = quota.utilise + out.envoyes.length;
  return json(res, 200, {
    ok: true,
    mode,
    expediteur: de,
    envoyes: out.envoyes.map((x) => ({ to: x.ligne.e.to, ref: x.ligne.e.ref, id: x.id })),
    refuses,
    quota: quotaDe(qui.role, modeQuota, utilise, magasin.persistant),
    note: magasin.persistant ? undefined
      : 'Journal des envois non verrouillé en base : appliquez la migration 20261114_12 (garantie anti-doublon entre instances).',
    envoye_le: new Date().toISOString()
  });
}
