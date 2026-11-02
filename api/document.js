// ═══════════════════════════════════════════════════════════════
// /api/document — PDF internes (manuel, plans)
//
// Ces fichiers ne sont plus servis en statique : vercel.json réécrit
// leur URL publique vers ici. Sans session de la maison, 401.
// La brochure partenaire n'est pas dans cette liste : elle reste
// publique, à /documents/melodia-brochure-partenaire.pdf.
// ═══════════════════════════════════════════════════════════════

import { readFile } from 'fs/promises';
import { origineAutorisee, entetesOrigine } from './_courrier.js';

const URL_BASE = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
const ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dmdta29vemVyZmdnZHZ2dWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NjA1MTUsImV4cCI6MjEwNDEzNjUxNX0.FfvtgMMC7KqbANL7Zz4Ecwd9br5o7_ToDPCIZoB23sw';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const FICHIERS = {
  manuel: 'documents/melodia-manuel-de-vente.pdf',
  linkedin: 'documents/melodia-plan-linkedin.pdf',
  reseaux: 'documents/melodia-plan-reseaux-sociaux.pdf'
};
const NOMS = {
  manuel: 'melodia-manuel-de-vente.pdf',
  linkedin: 'melodia-plan-linkedin.pdf',
  reseaux: 'melodia-plan-reseaux-sociaux.pdf'
};

async function roleDe(jeton) {
  const r = await fetch(URL_BASE + '/auth/v1/user', {
    headers: { apikey: ANON, Authorization: 'Bearer ' + jeton }
  });
  if (!r.ok) return null;
  const moi = await r.json();
  const email = String((moi && moi.email) || '').toLowerCase();
  if (!email) return null;
  const cle = SERVICE || ANON;
  const q = await fetch(URL_BASE + '/rest/v1/roles?select=role&email=ilike.' + encodeURIComponent(email), {
    headers: { apikey: cle, Authorization: 'Bearer ' + (SERVICE || jeton) }
  });
  if (!q.ok) return null;
  const lignes = await q.json();
  return (lignes && lignes[0] && lignes[0].role) || null;
}

export default async function handler(req, res) {
  entetesOrigine(req, res, 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  if (req.method === 'OPTIONS') return res.status(origineAutorisee(req) ? 204 : 403).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET uniquement' });

  const cle = String((req.query && req.query.fichier) || '');
  const chemin = FICHIERS[cle];
  if (!chemin) return res.status(404).json({ error: 'Document inconnu.' });

  const entete = req.headers.authorization || req.headers.Authorization || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : '';
  if (!jeton) return res.status(401).json({ error: 'Connexion requise.', code: 'NON_CONNECTE' });

  let role = null;
  try { role = await roleDe(jeton); } catch (e) { role = null; }
  if (role !== 'master' && role !== 'commercial') {
    return res.status(401).json({ error: 'Ce document est réservé à la maison.', code: 'INTERDIT' });
  }

  try {
    const buf = await readFile(chemin);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + NOMS[cle] + '"');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(404).json({ error: 'Fichier absent du déploiement.' });
  }
}
