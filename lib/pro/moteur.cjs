// ═══════════════════════════════════════════════════════════════
// Le moteur de la file de travaux (pro_jobs).
//
// Jamais de travail long dans une requête HTTP : chaque passage
// (job-tick) prend au plus deux travaux, fait UNE étape de chacun
// (rédiger, soumettre, interroger, rapatrier), et rend la main. Le
// sondage du client (15 s) ou un cron fait avancer la file.
//
//   verrou        verrou_jusqua : un travail n'est traité que par un
//                 passage à la fois (mise à jour conditionnelle) ;
//   tentatives    backoff exponentiel 30 s → 30 min, puis échec et alerte ;
//   idempotence   (dossier_id, type, version) unique ;
//   plafond       pro_settings.plafond_jour_cents : NULL ou atteint, la
//                 génération s'arrête et la maison est alertée.
// ═══════════════════════════════════════════════════════════════
'use strict';

const { transition, reglages, nombre, auditer } = require('./socle.cjs');
const { noyau } = require('./noyau.cjs');
const { ecrireParoles, parolierConfigure, musiqueConfiguree, soumettreMusique, suivreMusique, telecharger } = require('./fournisseurs.cjs');
const { poserBalises } = require('./audio.cjs');

const VERROU_MS = 90_000;
const SUIVI_MS = 20_000;
const SUIVI_MAX_MS = 25 * 60_000;

class Bloque extends Error {
  constructor(code) { super(code); this.bloque = true; this.code = code; }
}

function iso(d) { return new Date(d).toISOString(); }

async function questionnaire(ctx, dossierId) {
  const q = (await ctx.depot.select('pro_questionnaires', { dossier_id: dossierId }, { ordre: 'version.desc', limite: 1 }))[0];
  return q ? q.donnees : {};
}

/** Vérifie le plafond de dépense du jour. Lève Bloque si NULL ou atteint. */
async function verifierPlafond(ctx, type) {
  const r = await reglages(ctx);
  const plafond = nombre(r.plafond_jour_cents);
  if (plafond == null) throw new Bloque('PLAFOND_NON_CONFIGURE');
  const jour = ctx.maintenant().toISOString().slice(0, 10);
  const usages = await ctx.depot.select('pro_usage', { jour });
  const depense = usages.reduce((s, u) => s + (Number(u.cout_cents) || 0), 0);
  const estime = nombre(type === 'musique' ? r.cout_estime_musique_cents : r.cout_estime_paroles_cents) || 0;
  if (depense + estime > plafond) throw new Bloque('PLAFOND_ATTEINT');
  return estime;
}

async function noterUsage(ctx, dossierId, type, fournisseur, cout, details) {
  await ctx.depot.insert('pro_usage', {
    jour: ctx.maintenant().toISOString().slice(0, 10), dossier_id: dossierId, type, fournisseur, cout_cents: cout || 0, details: details || {}
  });
}

async function etapeParoles(ctx, job, d) {
  if (['paye', 'essai_accorde', 'revision_demandee', 'echec', 'paroles_a_valider'].includes(d.status)) {
    const t = await transition(ctx, d, 'paroles_en_cours', 'service', 'moteur');
    if (!t.ok) throw new Error('ETAT_' + d.status);
  } else if (d.status !== 'paroles_en_cours') {
    return 'fait'; // le dossier a avancé autrement (annulé, remboursé…) : rien à faire
  }
  if (!parolierConfigure(ctx.env)) throw new Bloque('PAROLIER_NON_CONFIGURE');
  const cout = await verifierPlafond(ctx, 'paroles');
  const k = await noyau();
  const q = await questionnaire(ctx, d.id);
  const essai = !!(job.donnees && job.donnees.essai);
  const duree = job.donnees && job.donnees.duree_s;
  const base = k.promptConstruire({ questionnaire: q, essai, duree_s: duree });
  const res = await ecrireParoles(ctx.env, base.consigne_paroles);
  const fin = k.promptConstruire({ questionnaire: q, essai, duree_s: duree, proposition: res.style_prompt, paroles: res.lyrics });
  const prec = (await ctx.depot.select('pro_lyrics_versions', { dossier_id: d.id }, { ordre: 'version.desc', limite: 1 }))[0];
  const version = (prec ? prec.version : 0) + 1;
  const paroles = k.questionnaireNettoyer({ texte: res.lyrics.slice(0, 3000) }).propre;
  await ctx.depot.insert('pro_lyrics_versions', {
    dossier_id: d.id, version, titre: res.title || (q.message && q.message.titre) || '', paroles,
    prompt_musique: fin.prompt_musique, auteur: 'agent'
  });
  await noterUsage(ctx, d.id, 'paroles', res.fournisseur, cout, { jetons: res.jetons, alertes: fin.alertes });
  if (fin.alertes.length) await auditer(ctx, 'moteur', 'alerte_paroles', d.id, { alertes: fin.alertes });
  await transition(ctx, d, 'paroles_a_valider', 'service', 'moteur');
  return 'fait';
}

async function etapeMusique(ctx, job, d) {
  if (d.status !== 'musique_en_cours') return 'fait';
  const k = await noyau();
  const donnees = job.donnees || {};
  if (!musiqueConfiguree(ctx.env)) throw new Bloque('MUSIQUE_NON_CONFIGUREE');

  if (donnees.phase !== 'suivi') {
    const cout = await verifierPlafond(ctx, 'musique');
    const v = (await ctx.depot.select('pro_lyrics_versions', { dossier_id: d.id, version: job.version }, { limite: 1 }))[0]
      || (await ctx.depot.select('pro_lyrics_versions', { dossier_id: d.id }, { ordre: 'version.desc', limite: 1 }))[0];
    if (!v) throw new Error('SANS_PAROLES');
    const q = await questionnaire(ctx, d.id);
    const artistes = ((q.musique || {}).artistes) || [];
    const prompt = k.promptAssainir({ texte: v.prompt_musique || '', artistes }).texte;
    const chant = k.promptConstruire({ questionnaire: q, paroles: v.paroles }).paroles_chant;
    const instrumental = (q.musique || {}).voix === 'instrumental';
    const s = await soumettreMusique(ctx.env, { prompt, paroles: chant, instrumental });
    await noterUsage(ctx, d.id, 'musique', 'mureka', cout, { version: v.version });
    await ctx.depot.update('pro_jobs', { id: job.id }, {
      donnees: Object.assign({}, donnees, { phase: 'suivi', tache: s.tache, genre: s.genre, soumis_le: iso(ctx.maintenant()), titre: v.titre }),
      prochain_essai: iso(ctx.maintenant().getTime() + SUIVI_MS)
    });
    return 'suivi';
  }

  const s = await suivreMusique(ctx.env, donnees.tache, donnees.genre);
  if (s.etat === 'en_cours') {
    if (ctx.maintenant().getTime() - new Date(donnees.soumis_le).getTime() > SUIVI_MAX_MS) {
      await ctx.depot.update('pro_jobs', { id: job.id }, { donnees: Object.assign({}, donnees, { phase: null }) });
      throw new Error('MUSIQUE_TROP_LONGUE');
    }
    await ctx.depot.update('pro_jobs', { id: job.id }, { prochain_essai: iso(ctx.maintenant().getTime() + SUIVI_MS) });
    return 'suivi';
  }
  if (s.etat === 'echec') {
    await ctx.depot.update('pro_jobs', { id: job.id }, { donnees: Object.assign({}, donnees, { phase: null }) });
    throw new Error('MUSIQUE_ECHEC');
  }
  const brut = await telecharger(s.pistes[0].url);
  const propre = poserBalises(brut, { titre: donnees.titre || 'Hommage', annee: ctx.maintenant().getFullYear() });
  const chemin = `${d.org_id}/${d.id}/v${job.version}-${ctx.maintenant().getTime()}.mp3`;
  await ctx.depot.deposer('pro-audio', chemin, propre, 'audio/mpeg');
  await ctx.depot.insert('pro_tracks', {
    dossier_id: d.id, version: job.version, chemin, duree_s: s.pistes[0].duree || null,
    mode: d.mode === 'essai' ? 'essai' : 'complet', valide_maison: false
  });
  await transition(ctx, d, 'controle_maison', 'service', 'moteur');
  return 'fait';
}

/** Traite une étape d'un travail déjà verrouillé. */
async function traiter(ctx, job) {
  const d = (await ctx.depot.select('pro_dossiers', { id: job.dossier_id }, { limite: 1 }))[0];
  if (!d) {
    await ctx.depot.update('pro_jobs', { id: job.id }, { etat: 'echec', derniere_erreur: 'DOSSIER_ABSENT', verrou_jusqua: null });
    return 'echec';
  }
  const r = await reglages(ctx);
  const max = nombre(r.job_tentatives_max) || 4;
  try {
    const issue = job.type === 'paroles' ? await etapeParoles(ctx, job, d) : await etapeMusique(ctx, job, d);
    await ctx.depot.update('pro_jobs', { id: job.id }, {
      etat: issue === 'fait' ? 'fait' : 'en_cours', verrou_jusqua: null, derniere_erreur: null, updated_at: iso(ctx.maintenant())
    });
    return issue;
  } catch (e) {
    if (e.bloque) {
      await ctx.depot.update('pro_jobs', { id: job.id }, { etat: 'bloque', derniere_erreur: e.code, verrou_jusqua: null });
      await auditer(ctx, 'moteur', 'alerte_' + e.code.toLowerCase(), d.id, { type: job.type });
      return 'bloque';
    }
    const n = (job.tentatives || 0) + 1;
    // Le détail interne (qui peut nommer un fournisseur) reste dans pro_jobs, lu par la maison seule.
    const detail = String(e.message || 'ERREUR').slice(0, 120) + (e.interne ? ' — ' + String(e.interne).slice(0, 200) : '');
    if (n >= max) {
      await ctx.depot.update('pro_jobs', { id: job.id }, { etat: 'echec', tentatives: n, derniere_erreur: detail, verrou_jusqua: null });
      const frais = (await ctx.depot.select('pro_dossiers', { id: d.id }, { limite: 1 }))[0];
      if (frais) await transition(ctx, frais, 'echec', 'service', 'moteur');
      await auditer(ctx, 'moteur', 'alerte_echec', d.id, { type: job.type, tentatives: n });
      return 'echec';
    }
    const attente = Math.min(30_000 * Math.pow(2, n - 1), 30 * 60_000);
    await ctx.depot.update('pro_jobs', { id: job.id }, {
      tentatives: n, derniere_erreur: detail, verrou_jusqua: null, prochain_essai: iso(ctx.maintenant().getTime() + attente)
    });
    return 'reessai';
  }
}

/** Un passage : prend au plus `max` travaux prêts et fait une étape de chacun. */
async function tick(ctx, { max = 2, dossierId = null } = {}) {
  const maintenant = iso(ctx.maintenant());
  const filtres = { etat: { op: 'in', v: ['a_faire', 'en_cours'] }, prochain_essai: { op: 'lte', v: maintenant } };
  if (dossierId) filtres.dossier_id = dossierId;
  const prets = await ctx.depot.select('pro_jobs', filtres, { ordre: 'prochain_essai.asc', limite: 10 });
  const faits = [];
  for (const job of prets) {
    if (faits.length >= max) break;
    const pris = await ctx.depot.update('pro_jobs',
      { id: job.id, $ou: [{ verrou_jusqua: { op: 'is', v: null } }, { verrou_jusqua: { op: 'lt', v: maintenant } }] },
      { verrou_jusqua: iso(ctx.maintenant().getTime() + VERROU_MS) });
    if (!pris.length) continue; // un autre passage l'a pris
    faits.push({ id: job.id, type: job.type, issue: await traiter(ctx, pris[0]) });
  }
  return faits;
}

module.exports = { verifierPlafond, traiter, tick };
