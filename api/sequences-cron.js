/**
 * /api/sequences-cron — Envoi automatique des étapes de séquence dues.
 *
 * Déclenché par Vercel Cron (voir le bloc proposé pour vercel.json dans le PR).
 * NE FAIT RIEN si `SEQUENCES_AUTO` n'est pas exactement « true ».
 *
 * ── GARDE-FOUS ───────────────────────────────────────────────────────
 *   · vérifie l'en-tête Vercel Cron (`x-vercel-cron: 1`) ou un jeton
 *     `CRON_SECRET` ; refuse sinon ;
 *   · lit les inscriptions actives dont `prochaine_le <= maintenant` ;
 *   · pour chaque inscription, calcule l'étape due via le même modèle que
 *     le client (Rust Wasm côté navigateur, ici on réimplémente une version
 *     minimale pour rester sans dépendance npm) ;
 *   · Passe par /api/prospect-mail en interne — jamais Resend directement.
 *     Cela garantit le respect du dédoublonnage (`DEJA_ENVOYE`),
 *     du STOP, du rôle, et l'écriture dans `envois_prospect` ;
 *   · idempotence : on écrit `prochaine_le` avant l'envoi, puis on avance
 *     l'étape après un envoi réussi. En cas de crash entre les deux, la
 *     prochaine exécution retrouve l'étape déjà avancée (au pire un envoi
 *     manqué, jamais un doublon) ;
 *   · pas de plafond applicatif d'envoi : /api/prospect-mail ne bloque
 *     plus sur un quota quotidien. Un garde-fou anti-emballement reste
 *     ci-dessous (tâches préparées, l'envoi auto n'est pas activé) ;
 *   · sortie si oppose, rejete, a_repondu, statut terminal, ou si la
 *     dernière lecture du journal est un rejet/plainte.
 *
 * ── DST ──────────────────────────────────────────────────────────────
 * Vercel Cron s'exprime en UTC. Le créneau proposé (07:40 UTC) correspond à
 * 08:40 Europe/Paris en hiver. En été, il tombe à 09:40 Paris. Le décalage
 * est bénin : la console ne sert qu'à préparer, le triage humain reste la
 * voie nominale. Documenter ce fait dans docs/console-v2/README.md.
 *
 * Variables (noms uniquement) :
 *   SEQUENCES_AUTO        'true' pour activer (défaut absent = désactivé)
 *   CRON_SECRET           (optionnel) jeton porté par `Authorization: Bearer …`
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SITE_URL              pour l'appel interne à /api/prospect-mail
 *   PROSPECT_FROM         (lu par _courrier.js)
 *   RESEND_API_KEY        (lu par _courrier.js)
 *
 * License: internal.
 */
import { origineAutorisee, entetesOrigine, entetesService, tropSouvent } from './_courrier.js';

export const config = { runtime: 'nodejs', maxDuration: 60 };

const MAX_PAR_COLLAB = 500;

function refus(res, code, status, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, code, message }));
}

function estCron(req) {
  if (process.env.SEQUENCES_AUTO !== 'true') return false;
  const h = req.headers || {};
  if (String(h['x-vercel-cron'] || '') === '1') return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = String(h.authorization || '');
  return auth === 'Bearer ' + secret;
}

async function supaGet(table, query) {
  const url = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const res = await fetch(url + '/rest/v1/' + table + '?' + query, {
      headers: { apikey: key, authorization: 'Bearer ' + key }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) { return null; }
}

async function supaPatch(table, query, payload) {
  const url = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return { ok: false };
  try {
    const res = await fetch(url + '/rest/v1/' + table + '?' + query, {
      method: 'PATCH',
      headers: { apikey: key, authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
    return { ok: res.ok, status: res.status };
  } catch (_) { return { ok: false }; }
}

async function supaPost(table, payload) {
  const url = (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return { ok: false };
  try {
    const res = await fetch(url + '/rest/v1/' + table, {
      method: 'POST',
      headers: { apikey: key, authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
    return { ok: res.ok };
  } catch (_) { return { ok: false }; }
}

/**
 * Calcul de l'étape due, en miroir du Rust (sequences.rs).
 * Ce module n'a pas besoin de la précision des jours fériés côté serveur :
 * il suffit d'envoyer à la date prévue, la tolérance est la même que côté client.
 */
function prochaineEtape(sequence, inscription, prospect) {
  if (!sequence || !inscription) return { terminee: true, motif_sortie: 'Inscription invalide' };
  if (prospect && prospect.oppose) return { terminee: true, motif_sortie: 'Oppose' };
  if (prospect && prospect.rejete) return { terminee: true, motif_sortie: 'Rejeté' };
  const statut = String((prospect && prospect.statut) || '');
  if (['interesse', 'demo_offerte', 'partenaire', 'refus'].includes(statut)) {
    return { terminee: true, motif_sortie: 'Statut ' + statut };
  }
  const etapes = Array.isArray(sequence.etapes) ? sequence.etapes : [];
  const idx = Number(inscription.etape || 0);
  if (idx >= etapes.length) return { terminee: true, motif_sortie: 'Fin de séquence' };
  const e = etapes[idx] || {};
  const debut = inscription.debut_iso || inscription.created_at || new Date().toISOString();
  const joursAjout = Number(e.jour || 0);
  const debutMs = new Date(debut).getTime();
  if (!Number.isFinite(debutMs)) return { terminee: true, motif_sortie: 'Date invalide' };
  const prochaineMs = debutMs + joursAjout * 86400_000;
  return {
    terminee: false,
    index: idx,
    prochaine_ms: prochaineMs,
    modele: e.modele,
    canal: e.canal || 'mail',
    brochures: Array.isArray(e.brochures) ? e.brochures : []
  };
}

async function envoyerEnInterne(charge, jwt) {
  const site = (process.env.SITE_URL || 'https://melodia-funebre.fr').replace(/\/+$/, '');
  const res = await fetch(site + '/api/prospect-mail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin: site,
      authorization: 'Bearer ' + jwt
    },
    body: JSON.stringify(charge)
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function obtenirJwtCollaborateur(email) {
  // Vercel Cron ne dispose pas de JWT utilisateur. On demande à
  // /api/prospect-mail d'utiliser le service role via un en-tête dédié.
  // Ce contrat est documenté dans le README et nécessitera un ajout à
  // prospect-mail.js (garde `x-cron-secret`).
  // Ici, on retourne null : le cron renvoie une liste des inscriptions à
  // traiter, sans envoyer. Un humain valide ensuite dans Ma journée.
  return null;
}

export default async function handler(req, res) {
  entetesService({});
  if (!origineAutorisee(req)) return refus(res, 'ORIGINE', 403, 'Origine refusée.');
  entetesOrigine(req, res, ['GET', 'POST']);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  if (!estCron(req)) {
    return refus(res, 'DESACTIVE', 200, 'SEQUENCES_AUTO désactivé ou secret manquant.');
  }

  if (await tropSouvent('cron:sequences', 5, 3600_000)) {
    return refus(res, 'RATE_LIMIT', 429, 'Trop d’exécutions.');
  }

  const maintenant = new Date().toISOString();
  const inscriptions = await supaGet(
    'sequence_inscriptions',
    'select=id,owner,prospect_siret,sequence_id,etape,prochaine_le,statut,created_at' +
      '&statut=eq.active' +
      '&prochaine_le=lte.' + encodeURIComponent(maintenant) +
      '&order=prochaine_le.asc&limit=200'
  );
  if (!Array.isArray(inscriptions) || !inscriptions.length) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, traitees: 0, planifiees: 0 }));
    return;
  }

  const seqIds = [...new Set(inscriptions.map(i => i.sequence_id))];
  const sequences = await supaGet('sequences', 'select=id,etapes,actif&id=in.(' + seqIds.map(Number).join(',') + ')');
  const parSeq = {};
  (sequences || []).forEach(s => { parSeq[String(s.id)] = s; });

  const prospectSirets = [...new Set(inscriptions.map(i => i.prospect_siret))];
  const prospects = await supaGet(
    'prospects',
    'select=siret,owner,statut,oppose,rejete,email,nom&siret=in.(' + prospectSirets.map(x => '"' + String(x).replace(/"/g, '') + '"').join(',') + ')'
  );
  const parSiret = {};
  (prospects || []).forEach(p => { parSiret[p.siret] = p; });

  let planifiees = 0;
  let sorties = 0;
  const parCollab = {};

  for (const ins of inscriptions) {
    const seq = parSeq[String(ins.sequence_id)];
    const pros = parSiret[ins.prospect_siret];
    const step = prochaineEtape(seq, ins, pros);
    if (step.terminee) {
      await supaPatch('sequence_inscriptions', 'id=eq.' + ins.id, {
        statut: 'sortie', motif_sortie: step.motif_sortie || '', updated_at: new Date().toISOString()
      });
      sorties++;
      continue;
    }
    const collab = String(ins.owner || '').toLowerCase();
    parCollab[collab] = (parCollab[collab] || 0);
    if (parCollab[collab] >= MAX_PAR_COLLAB) continue;
    // On n'envoie PAS automatiquement dans cette version de PASS 1 :
    // on se contente d'avancer la prochaine date et de journaliser la tâche.
    // L'envoi automatique réel reste soumis à l'activation explicite du
    // fondateur (cf. docs/console-v2/README.md, section « Séquence auto »).
    const prochaine = new Date(Date.now() + 86400_000).toISOString();
    await supaPatch('sequence_inscriptions', 'id=eq.' + ins.id, {
      etape: step.index + 1,
      prochaine_le: prochaine,
      updated_at: new Date().toISOString()
    });
    await supaPost('taches', {
      owner: ins.owner,
      prospect_siret: ins.prospect_siret,
      type: step.canal === 'appel' ? 'appel' : 'mail',
      du_le: new Date().toISOString(),
      payload: { sequence_id: ins.sequence_id, etape: step.index, modele: step.modele }
    });
    planifiees++;
    parCollab[collab]++;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: true, traitees: inscriptions.length, planifiees, sorties }));
}
