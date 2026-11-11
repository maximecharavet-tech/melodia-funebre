// ═══════════════════════════════════════════════════════════════
// /api/prospect-webhook — Événements Resend (ouvert, cliqué, rejeté)
//
// Resend appelle cette route quand un courriel de prospection change
// d'état. La signature Svix (RESEND_WEBHOOK_SECRET) est exigée : sans
// elle, rien n'est écrit. Cette route n'est pas soumise à la garde
// d'origine du site — l'appel vient de Resend, pas du navigateur.
//
// Variable à poser dans Vercel (sans redéploiement de valeur déjà
// existante, et seulement après accord) :
//   RESEND_WEBHOOK_SECRET    secret d'endpoint Resend (whsec_…)
// ═══════════════════════════════════════════════════════════════

import { evenementVersStatut, rangerStatut, verifierSignatureResend, interpreterLectureJournal } from './_prospect-outils.js';
import { entetesService } from './_courrier.js';

export const config = { api: { bodyParser: false } };

const SB_URL = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');

function lireCorps(req) {
  if (typeof req.body === 'string') return Promise.resolve(req.body);
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString('utf8'));
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ok: true, service: 'prospect-webhook' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const secret = process.env.RESEND_WEBHOOK_SECRET || '';
  if (!secret) return res.status(503).json({ error: 'Webhook non configuré.', code: 'NOT_CONFIGURED' });

  let brut;
  try { brut = await lireCorps(req); }
  catch (e) { return res.status(400).json({ error: 'Corps illisible.' }); }

  const verif = verifierSignatureResend(brut, req.headers, secret);
  if (!verif.ok) return res.status(401).json({ error: verif.motif, code: 'SIGNATURE' });

  let ev;
  try { ev = JSON.parse(brut); }
  catch (e) { return res.status(400).json({ error: 'JSON invalide.' }); }

  const type = ev && ev.type;
  const data = (ev && ev.data) || {};
  const resendId = data.email_id || data.id || null;
  const statut = evenementVersStatut(type);
  if (!resendId || !statut) return res.status(200).json({ ok: true, ignore: true });

  const service = entetesService({ 'Content-Type': 'application/json', Prefer: 'return=representation' });
  if (!service) {
    const brut = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (brut) return res.status(503).json({ error: 'Clé de service invalide.', code: 'BAD_SERVICE_KEY' });
    return res.status(503).json({ error: 'Journal inaccessible.', code: 'NO_SERVICE' });
  }

  try {
    const url = SB_URL + '/rest/v1/envois_prospect?select=id,statut,ouvert_nb,clique_nb,ouvert_le,clique_le,delivre_le,rejete_le&resend_id=eq.' + encodeURIComponent(resendId);
    const lu = await fetch(url, { headers: service });
    if (!lu.ok) {
      const texte = await lu.text();
      const lec = interpreterLectureJournal(lu.status, texte);
      if (lec.absent) {
        return res.status(200).json({ ok: true, ignore: true, note: 'Journal absent (migration 20261103_08 à appliquer).' });
      }
      console.error('[prospect-webhook] lecture journal', lu.status, String(texte || '').slice(0, 200));
      return res.status(502).json({ error: 'Lecture du journal impossible.', code: 'JOURNAL_READ' });
    }
    const lignes = await lu.json();
    if (!Array.isArray(lignes) || !lignes.length) return res.status(200).json({ ok: true, ignore: true });

    const maintenant = new Date().toISOString();
    await Promise.all(lignes.map((l) => {
      const suivant = rangerStatut(l.statut, statut);
      const patch = { statut: suivant, dernier_evenement: String(type).slice(0, 80) };
      if (statut === 'delivre' && !l.delivre_le) patch.delivre_le = maintenant;
      if (statut === 'ouvert') {
        patch.ouvert_nb = (l.ouvert_nb || 0) + 1;
        if (!l.ouvert_le) patch.ouvert_le = maintenant;
      }
      if (statut === 'clique') {
        patch.clique_nb = (l.clique_nb || 0) + 1;
        if (!l.clique_le) patch.clique_le = maintenant;
      }
      if ((statut === 'rejete' || statut === 'plainte') && !l.rejete_le) patch.rejete_le = maintenant;
      return fetch(SB_URL + '/rest/v1/envois_prospect?id=eq.' + l.id, {
        method: 'PATCH',
        headers: service,
        body: JSON.stringify(patch)
      });
    }));
    /* Plainte ou désinscription : on marque l'opposition pour ne plus relancer. */
    if (statut === 'plainte') {
      const dest = [].concat(data.to || data.recipients || []).map((x) => String(x || '').toLowerCase().trim()).filter(Boolean);
      await Promise.all(dest.map((adr) => fetch(SB_URL + '/rest/v1/prospects?email=ilike.' + encodeURIComponent(adr), {
        method: 'PATCH',
        headers: service,
        body: JSON.stringify({ oppose: true })
      }).catch(() => null)));
    }
    return res.status(200).json({ ok: true, statut, id: resendId });
  } catch (e) {
    return res.status(500).json({ error: 'Mise à jour impossible.' });
  }
}
