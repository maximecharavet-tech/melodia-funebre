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
//           un seul appel au service d'envoi.
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
//   PROSPECT_FROM              expéditeur de prospection, vérifié chez Resend
//   LEAD_TO                    copie invisible des envois unitaires
//   SITE_URL                   adresse publique du site (logo, bannière)
//   SUPABASE_URL               projet Supabase (repli : celui du site)
//   SUPABASE_SERVICE_ROLE_KEY  lecture du rôle dans la table « roles »
//
// Sans clé d'envoi, test et envoi répondent 503 NOT_CONFIGURED et la
// console retombe sur le « mailto: » — rien n'est perdu en silence.
// ═══════════════════════════════════════════════════════════════

import {
  SITE, gabarit, carteVisite, envoyer, envoyerLot, valideEmail,
  expediteurProspection, boiteMaison, origineAutorisee, tropSouvent
} from './_courrier.js';

const SB_URL = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
/* La clé « anon » est publique par construction (elle est dans le source
   du site) : elle sert seulement à demander à Supabase qui porte le jeton. */
const SB_ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dmdta29vemVyZmdnZHZ2dWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NjA1MTUsImV4cCI6MjEwNDEzNjUxNX0.FfvtgMMC7KqbANL7Zz4Ecwd9br5o7_ToDPCIZoB23sw';
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ROLES_PERMIS = ['commercial', 'master'];
const LOT_MAX = 50;

function json(res, code, corps) { return res.status(code).json(corps); }

/* ─── Qui demande ? ───
   Le jeton vient du navigateur : il ne prouve rien par lui-même. Supabase
   seul dit s'il est authentique et à qui il appartient ; le rôle se lit
   ensuite dans la table « roles », jamais dans les métadonnées du compte,
   que son titulaire peut écrire. */
async function demandeur(req) {
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

  let role = null;
  try {
    const cle = SB_SERVICE || SB_ANON;
    const r = await fetch(SB_URL + '/rest/v1/roles?select=role&email=eq.' + encodeURIComponent(email), {
      headers: { apikey: cle, Authorization: 'Bearer ' + (SB_SERVICE || jeton) }
    });
    if (r.ok) { const l = await r.json(); role = (l && l[0] && l[0].role) || null; }
  } catch (e) { /* rôle inconnu : refusé plus bas */ }

  const meta = (moi && moi.user_metadata) || {};
  return { email, role, nom: String(meta.name || meta.nom || email.split('@')[0]).slice(0, 120) };
}

/* Un destinataire du lot, nettoyé et validé. */
function lire(e) {
  return {
    to: String((e && e.to) || '').trim().slice(0, 160),
    sujet: String((e && e.sujet) || '').trim().slice(0, 200),
    texte: String((e && e.texte) || '').slice(0, 12000),
    titre: String((e && e.titre) || '').slice(0, 160),
    ref: String((e && (e.ref || e.siret)) || '').slice(0, 40)
  };
}
function defautDe(e, exigerDest) {
  if (exigerDest && !valideEmail(e.to)) return 'Adresse du destinataire invalide.';
  if (!e.sujet) return 'Objet manquant.';
  if (e.texte.trim().length < 30) return 'Message trop court.';
  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'POST uniquement' });

  if (!origineAutorisee(req)) {
    return json(res, 403, { error: 'Origine non autorisée.', code: 'ORIGINE' });
  }

  const d = (req.body && typeof req.body === 'object') ? req.body : {};
  const mode = ['apercu', 'test', 'envoi'].indexOf(d.mode) !== -1 ? d.mode : 'envoi';
  /* L'ancien appel (un seul destinataire à plat) reste compris. */
  const envois = (Array.isArray(d.envois) && d.envois.length ? d.envois : [d]).map(lire);
  const lien = {
    lienTexte: String(d.lienTexte || '').slice(0, 60),
    lienUrl: /^https:\/\//.test(String(d.lienUrl || '')) ? String(d.lienUrl).slice(0, 300) : ''
  };
  const sigEntree = (d.signature && typeof d.signature === 'object') ? d.signature : {};
  const habiller = (e, sig) => gabarit({
    sujet: e.sujet, titre: e.titre, texte: e.texte,
    apercu: e.texte.replace(/\s+/g, ' ').slice(0, 140),
    lienTexte: lien.lienTexte, lienUrl: lien.lienUrl,
    banniere: true, signature: sig, pied: 'prospection'
  });
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
    if (tropSouvent('apercu:' + ip, 120, 10 * 60 * 1000)) return json(res, 429, { error: 'Trop d\'aperçus demandés.', code: 'RATE_LIMIT' });
    const e = envois[0];
    if (!e.sujet) e.sujet = 'Melodia Funèbre';
    const email = valideEmail(sigEntree.email) ? String(sigEntree.email).trim() : '';
    /* « Mon compte » ne montre que la carte : la bannière et le texte
       la repoussaient sous le bord de l'aperçu. */
    if (d.partie === 'signature') {
      return json(res, 200, { ok: true, html: '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>' +
        '<body style="margin:0;padding:24px;background:#f4f1ea;">' + carteVisite(signature('', email)) + '</body></html>' });
    }
    return json(res, 200, { ok: true, html: habiller(e, signature('', email)) });
  }

  /* ─── Test et envoi : session obligatoire ─── */
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

  if (envois.length > LOT_MAX) {
    return json(res, 400, { error: 'Au plus ' + LOT_MAX + ' destinataires par envoi.', code: 'LOT_TROP_GRAND' });
  }
  if (tropSouvent('envoi:' + qui.email, 12, 60 * 60 * 1000)) {
    return json(res, 429, { error: 'Trop d\'envois cette heure-ci. Réessayez plus tard.', code: 'RATE_LIMIT' });
  }

  const sig = signature(qui.nom, qui.email);
  const refuses = [];
  const charges = [];
  const retenus = [];

  envois.forEach((e) => {
    if (mode === 'test') { e.to = qui.email; e.sujet = '[Test] ' + e.sujet; }
    const motif = defautDe(e, true);
    if (motif) { refuses.push({ to: e.to, ref: e.ref, motif }); return; }
    retenus.push(e);
    charges.push({
      from: exp,
      to: [e.to],
      subject: e.sujet,
      html: habiller(e, sig),
      text: e.texte + '\n\n—\n' + sig.nom + (sig.role ? '\n' + sig.role : '') + '\n' + qui.email + '\n' + SITE +
            '\n\nPour ne plus être contacté, répondez STOP à ce courriel.',
      reply_to: qui.email,
      /* Les messageries proposent alors un bouton « Se désabonner » :
         l'agence qui ne veut plus de nous le dit en un geste, plutôt que
         de nous signaler comme indésirables. */
      headers: { 'List-Unsubscribe': '<mailto:' + qui.email + '?subject=STOP>' }
    });
  });

  if (!charges.length) return json(res, 400, { error: refuses[0] ? refuses[0].motif : 'Rien à envoyer.', code: 'RIEN', refuses });

  /* La maison voit ce qui part en son nom. Pour un lot, une seule copie
     — la première — plutôt que cinquante dans la boîte du fondateur. */
  const maison = boiteMaison();
  if (maison.length && mode === 'envoi') charges[0].bcc = maison;

  const r = charges.length === 1 ? await envoyer(charges[0]) : await envoyerLot(charges);
  if (!r.ok) return json(res, r.status, { error: r.error, code: r.code, motif: r.motif, refuses });

  const ids = r.ids || [r.id];
  return json(res, 200, {
    ok: true,
    mode,
    envoyes: retenus.map((e, i) => ({ to: e.to, ref: e.ref, id: ids[i] || null })),
    refuses,
    envoye_le: new Date().toISOString()
  });
}
