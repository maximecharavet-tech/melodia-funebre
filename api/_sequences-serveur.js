// ═══════════════════════════════════════════════════════════════
// api/_sequences-serveur.js — Séquences : inscription, sortie, état
//
// La console gardait séquences et inscriptions dans le navigateur
// (localStorage) : le cron n'avait RIEN à envoyer. Ces trois actions,
// appelées par /api/prospect-mail une fois la session et le rôle
// vérifiés, écrivent dans public.sequences / public.sequence_inscriptions
// (migration 11) avec la clé de service — le propriétaire est TOUJOURS
// la session, jamais un champ du navigateur.
//
//   sequence_enregistrer  crée ou met à jour la séquence (clé naturelle :
//                         propriétaire + nom) et inscrit des prospects.
//                         Réinscrire ne remet rien à zéro (ignore-duplicates).
//   sequence_sortie       sort un prospect de ses séquences actives.
//   automatisation        l'état lisible par la console : drapeau
//                         SEQUENCES_AUTO (booléen seulement), file d'attente,
//                         pauses et leur motif.
//
// Le préfixe « _ » : Vercel n'expose pas cette route.
// ═══════════════════════════════════════════════════════════════
import { entetesService } from './_courrier.js';

const URL_BASE = () => (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
const MODELES_OK = /^[a-z0-9-]{2,60}$/;

async function sb(chemin, { methode = 'GET', corps, prefer } = {}) {
  const h = entetesService({ 'Content-Type': 'application/json', Prefer: prefer || 'return=minimal' });
  if (!h) return { ok: false, status: 0, data: null, absent: true };
  try {
    const r = await fetch(URL_BASE() + '/rest/v1/' + chemin, { method: methode, headers: h, body: corps ? JSON.stringify(corps) : undefined });
    const t = await r.text();
    let data = null; try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
    return { ok: r.ok, status: r.status, data, texte: t };
  } catch (e) { return { ok: false, status: 0, data: null }; }
}

function etapesPropres(etapes) {
  return (Array.isArray(etapes) ? etapes : []).slice(0, 12).map((e) => ({
    jour: Math.max(0, Math.min(90, Math.floor(Number(e && e.jour) || 0))),
    modele: MODELES_OK.test(String((e && e.modele) || '')) ? String(e.modele) : '',
    canal: e && e.canal === 'appel' ? 'appel' : 'mail',
    brochures: (Array.isArray(e && e.brochures) ? e.brochures : []).map(String).filter((b) => MODELES_OK.test(b)).slice(0, 4)
  }));
}

export function drapeauAuto() { return process.env.SEQUENCES_AUTO === 'true'; }

export async function gererSequences(mode, d, qui, repondre) {
  const owner = qui.email;
  if (mode === 'automatisation') {
    const r = await sb('sequence_inscriptions?select=id,prospect_siret,sequence_id,etape,prochaine_le,statut,motif_sortie' +
      '&owner=eq.' + encodeURIComponent(owner) + '&statut=in.(active,pause)&order=prochaine_le.asc&limit=200');
    if (r.absent || (!r.ok && /42P01|PGRST205/.test(r.texte || ''))) {
      return repondre(200, { ok: true, mode, auto: drapeauAuto(), secret: !!process.env.CRON_SECRET, tables: false, file: [], pauses: [] });
    }
    const lignes = Array.isArray(r.data) ? r.data : [];
    const ids = [...new Set(lignes.map((l) => Number(l.sequence_id)).filter(Number.isFinite))];
    const seqs = ids.length ? await sb('sequences?select=id,nom,etapes&id=in.(' + ids.join(',') + ')') : { data: [] };
    const parSeq = {};
    (Array.isArray(seqs.data) ? seqs.data : []).forEach((s) => { parSeq[String(s.id)] = s; });
    const vue = (l) => {
      const s = parSeq[String(l.sequence_id)] || {};
      const e = (Array.isArray(s.etapes) ? s.etapes : [])[Number(l.etape)] || {};
      return { id: l.id, prospect_siret: l.prospect_siret, sequence: s.nom || '', etape: l.etape, modele: e.modele || '',
        canal: e.canal || 'mail', prochaine_le: l.prochaine_le, motif: l.motif_sortie || '' };
    };
    return repondre(200, { ok: true, mode, auto: drapeauAuto(), secret: !!process.env.CRON_SECRET, tables: true,
      file: lignes.filter((l) => l.statut === 'active').map(vue), pauses: lignes.filter((l) => l.statut === 'pause').map(vue) });
  }

  if (mode === 'sequence_sortie') {
    const siret = String(d.prospect_siret || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 20);
    if (!siret) return repondre(400, { error: 'Prospect manquant.', code: 'PROSPECT' });
    const r = await sb('sequence_inscriptions?owner=eq.' + encodeURIComponent(owner) + '&prospect_siret=eq.' + encodeURIComponent(siret) + '&statut=in.(active,pause)',
      { methode: 'PATCH', corps: { statut: 'sortie', motif_sortie: String(d.motif || 'Sortie manuelle').slice(0, 120), updated_at: new Date().toISOString() } });
    return repondre(200, { ok: r.ok, mode });
  }

  // sequence_enregistrer
  const s = (d.sequence && typeof d.sequence === 'object') ? d.sequence : {};
  const nom = String(s.nom || '').trim().slice(0, 80);
  const etapes = etapesPropres(s.etapes);
  if (!nom || !etapes.length) return repondre(400, { error: 'Séquence incomplète (nom, étapes).', code: 'SEQUENCE' });
  if (etapes.some((e) => e.canal === 'mail' && !e.modele)) return repondre(400, { error: 'Une étape mail n’a pas de modèle.', code: 'SEQUENCE' });

  const ex = await sb('sequences?select=id&owner=eq.' + encodeURIComponent(owner) + '&nom=eq.' + encodeURIComponent(nom) + '&limit=1');
  if (ex.absent || (!ex.ok && /42P01|PGRST205/.test(ex.texte || ''))) {
    return repondre(503, { error: 'Les séquences serveur ne sont pas disponibles : appliquez la migration 20261113_11 (console v2).', code: 'TABLES_ABSENTES' });
  }
  let seqId;
  const champs = { cible: String(s.cible || '').slice(0, 30), etapes, actif: s.actif !== false, updated_at: new Date().toISOString() };
  if (Array.isArray(ex.data) && ex.data[0]) {
    seqId = ex.data[0].id;
    await sb('sequences?id=eq.' + seqId, { methode: 'PATCH', corps: champs });
  } else {
    const c = await sb('sequences', { methode: 'POST', prefer: 'return=representation', corps: Object.assign({ owner, nom }, champs) });
    seqId = Array.isArray(c.data) && c.data[0] ? c.data[0].id : null;
    if (!c.ok || seqId == null) return repondre(502, { error: 'Séquence non enregistrée.', code: 'SEQUENCE' });
  }

  const sirets = [...new Set((Array.isArray(d.inscriptions) ? d.inscriptions : []).map((i) => String((i && i.prospect_siret) || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 20)).filter(Boolean))].slice(0, 50);
  let inscrits = 0;
  if (sirets.length) {
    const maintenant = new Date().toISOString();
    const r = await sb('sequence_inscriptions?on_conflict=owner,prospect_siret,sequence_id', {
      methode: 'POST', prefer: 'resolution=ignore-duplicates,return=representation',
      corps: sirets.map((p) => ({ owner, prospect_siret: p, sequence_id: seqId, etape: 0, prochaine_le: maintenant, statut: 'active' }))
    });
    inscrits = Array.isArray(r.data) ? r.data.length : 0;
  }
  return repondre(200, { ok: true, mode, sequence_id: seqId, inscrits });
}
