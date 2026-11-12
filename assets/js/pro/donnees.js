// ═══════════════════════════════════════════════════════════════
// Accès aux données de la console.
//
// Deux adaptateurs au même contrat :
//   - Api  : les fonctions /api/pro/* avec le jeton de session Supabase.
//            Hors ligne, les sauvegardes du questionnaire vont dans une file
//            IndexedDB et partent au retour du réseau.
//   - Demo : tout reste sur l'appareil ; le pipeline est simulé pas à pas
//            (aucun appel à un fournisseur, rien n'est facturé). Sert à la
//            découverte sans compte et aux tests de bout en bout.
// ═══════════════════════════════════════════════════════════════

import { lire, ecrire, tout, effacer } from './memoire.js';
import { noyau } from './noyau.js';

const CFG = window.MELODIA_CONFIG || {};
const SB = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '');

function session() {
  try { return JSON.parse(localStorage.getItem('melodia_session') || 'null'); } catch (e) { return null; }
}

async function jeton() {
  let s = session();
  if (s && s.refresh_token && s.expires_at && (s.expires_at - Date.now() / 1000) < 120 && SB) {
    try {
      const r = await fetch(SB + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', headers: { apikey: CFG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: s.refresh_token })
      });
      const d = await r.json();
      if (r.ok && d.access_token) {
        s = Object.assign({}, s, d, { expires_at: Math.floor(Date.now() / 1000) + Number(d.expires_in || 3600) });
        localStorage.setItem('melodia_session', JSON.stringify(s));
      }
    } catch (e) { /* hors ligne : on tente avec l'ancien jeton */ }
  }
  return s && s.access_token;
}

export function aUneSession() { const s = session(); return !!(s && s.access_token); }

export class ErreurPro extends Error {
  constructor(message, code, status) { super(message); this.code = code; this.status = status; }
}

// ─── API réelle ─────────────────────────────────────────────────────

class Api {
  constructor() { this.demo = false; this.sondage = 15000; }

  async appel(route, { methode = 'GET', corps, query } = {}) {
    const j = await jeton();
    const qs = query ? '?' + new URLSearchParams(query).toString() : '';
    const r = await fetch('/api/pro/' + route + qs, {
      method: methode,
      headers: Object.assign({ Authorization: 'Bearer ' + j }, corps ? { 'Content-Type': 'application/json' } : {}),
      body: corps ? JSON.stringify(corps) : undefined
    });
    if (r.headers.get('content-type') && r.headers.get('content-type').includes('text/csv')) return r.blob();
    let d = {};
    try { d = await r.json(); } catch (e) { d = {}; }
    if (!r.ok || d.ok === false) throw new ErreurPro(d.message || 'Une erreur est survenue.', d.code, r.status);
    return d;
  }

  me() { return this.appel('me'); }
  dossiers(org) { return this.appel('dossiers', { query: { org_id: org } }); }
  dossier(id) { return this.appel('dossiers', { query: { id } }); }
  creerDossier(org) { return this.appel('dossiers', { methode: 'POST', corps: { action: 'creer', org_id: org } }); }
  async sauverQuestionnaire(id, donnees, versionBase) {
    const corps = { action: 'questionnaire', id, donnees, version_base: versionBase };
    if (!navigator.onLine) {
      await ecrire('file', 'q-' + id, corps);
      return { hors_ligne: true };
    }
    return this.appel('dossiers', { methode: 'POST', corps });
  }
  async viderFile() {
    if (!navigator.onLine) return 0;
    let n = 0;
    for (const { cle, valeur } of await tout('file')) {
      try { await this.appel('dossiers', { methode: 'POST', corps: Object.assign({}, valeur, { version_base: undefined }) }); await effacer('file', cle); n++; } catch (e) { /* on retentera */ }
    }
    return n;
  }
  changerStatut(id, vers) { return this.appel('dossiers', { methode: 'POST', corps: { action: 'statut', id, vers } }); }
  editerParoles(id, p) { return this.appel('dossiers', { methode: 'POST', corps: Object.assign({ action: 'paroles', id }, p) }); }
  promo(code) { return this.appel('promo', { methode: 'POST', corps: { code } }); }
  checkout(id, code) { return this.appel('checkout', { methode: 'POST', corps: { dossier_id: id, code } }); }
  portail(org) { return this.appel('portal', { methode: 'POST', corps: { org_id: org } }); }
  essai(id, appareil) { return this.appel('trial', { methode: 'POST', corps: { dossier_id: id, appareil } }); }
  redemanderParoles(id) { return this.appel('lyrics', { methode: 'POST', corps: { dossier_id: id } }); }
  lancerMusique(id, version) { return this.appel('music', { methode: 'POST', corps: { dossier_id: id, version } }); }
  tick(id) { return this.appel('job-tick', { methode: 'POST', corps: { dossier_id: id } }); }
  qr(id, options) { return this.appel('qr', { methode: 'POST', corps: Object.assign({ dossier_id: id }, options || {}) }); }
  admin() { return this.appel('admin'); }
  adminAction(corps) { return this.appel('admin', { methode: 'POST', corps }); }
  exporter(mois, org) { return this.appel('export', { query: Object.assign({ mois }, org ? { org_id: org } : {}) }); }
  equipe(org) { return this.appel('invitations', { query: { org_id: org } }); }
  inviter(org, email, role) { return this.appel('invitations', { methode: 'POST', corps: { action: 'inviter', org_id: org, email, role } }); }
  accepter(j) { return this.appel('invitations', { methode: 'POST', corps: { action: 'accepter', jeton: j } }); }
  changerRole(org, membre, role) { return this.appel('invitations', { methode: 'POST', corps: { action: 'role', org_id: org, membre_id: membre, role } }); }
  retirerMembre(org, membre) { return this.appel('invitations', { methode: 'POST', corps: { action: 'retirer', org_id: org, membre_id: membre } }); }
  creerOrg(o) { return this.appel('orgs', { methode: 'POST', corps: Object.assign({ action: 'creer' }, o) }); }
  reglagesOrg(org, r) { return this.appel('orgs', { methode: 'POST', corps: Object.assign({ action: 'reglages', org_id: org }, r) }); }
  logo(org, type, base64) { return this.appel('orgs', { methode: 'POST', corps: { action: 'logo', org_id: org, type, base64 } }); }
}

// ─── Démonstration locale ───────────────────────────────────────────

const ORG_DEMO = 'demo-agence';

function etatInitial() {
  return {
    v: 2,
    orgs: [{ id: ORG_DEMO, nom: 'Pompes funèbres de démonstration', statut: 'valide', cobranding: true, siret: '73282932000074', email: 'contact@agence-demo.fr', role: 'owner', logo: null }],
    dossiers: [], questionnaires: {}, paroles: {}, pistes: {}, qr: {}, essais: 0, journal: [], seq: 1,
    equipe: [{ id: 'm-1', email: 'vous@agence-demo.fr', role: 'owner', statut: 'actif' }], invitations: []
  };
}

/**
 * Dossiers d'exemple de la démonstration (?demo=1). Ils portent `exemple: true`,
 * s'affichent avec une pastille « Exemple » et restent sur l'appareil. Les prénoms
 * sont des prénoms d'usage courants, sans nom de famille. La chanson écoutée est
 * une composition de démonstration de la maison. Aucun chiffre n'est fixé à
 * l'avance : les statistiques sont calculées à partir de ces dossiers.
 */
function graine(audio) {
  const e = etatInitial();
  const maintenant = Date.now();
  const H = 3600e3, J = 24 * H;
  const iso = (dt) => new Date(maintenant + dt).toISOString();
  const jour = (dt) => iso(dt).slice(0, 10);
  const fiches = [
    { p: 'Henri', st: 'paroles_a_valider', cree: -2 * J, maj: -3 * H, cer: 30 * H, mode: 'payant', style: 'Chanson française', rite: 'civil', titre: 'Le jardin d’Henri', parole: true, n: -26000, d: -3 },
    { p: 'Colette', st: 'livre', cree: -9 * J, maj: -6 * J, cer: -7 * J, mode: 'payant', style: 'Piano classique', rite: 'catholique', titre: 'Colette, la lumière', parole: true, piste: true, n: -31000, d: -10 },
    { p: 'Joseph', st: 'livre', cree: -21 * J, maj: -18 * J, cer: -19 * J, mode: 'essai', style: 'Folk acoustique', rite: 'civil', titre: 'Pour Joseph', parole: true, piste: true, n: -29500, d: -22 },
    { p: 'Marcel', st: 'controle_maison', cree: -2 * J, maj: -1 * H, cer: 5 * J, mode: 'payant', style: 'Jazz doux', rite: 'civil', titre: 'Marcel au piano', parole: true, piste: true, n: -33000, d: -3 },
    { p: 'Odette', st: 'musique_en_cours', cree: -1 * J, maj: -20 * 60e3, cer: 6 * J, mode: 'essai', style: 'Chanson française', rite: 'protestant', titre: 'Odette', parole: true, n: -30000, d: -2 },
    { p: 'Lucien', st: 'complet', cree: -3 * H, maj: -2 * H, cer: 9 * J, mode: null, style: 'Variété', rite: 'catholique', titre: '', n: -27000, d: -1 },
    { p: 'Simone', st: 'brouillon', cree: -5 * J, maj: -4 * J, cer: null, mode: null, style: '', rite: '', titre: '', n: -28000, d: -5 }
  ];
  fiches.forEach((f, i) => {
    const id = 'exemple-' + (i + 1);
    e.dossiers.push({
      id, reference: 'MF-EX' + String(i + 1).padStart(3, '0'), status: f.st, paid: f.mode === 'payant' && !['brouillon', 'complet'].includes(f.st), mode: f.mode, offre_id: f.mode === 'payant' ? 'essentiel' : null,
      prenom: f.p, titre: f.titre, ceremonie_le: f.cer == null ? null : iso(f.cer), date_limite: f.cer == null ? null : iso(f.cer - 12 * H), org_id: ORG_DEMO,
      created_at: iso(f.cree), updated_at: iso(f.maj), questionnaire_version: 1, exemple: true
    });
    e.questionnaires[id] = [{ version: 1, donnees: {
      defunt: { prenom: f.p, genre: 'il', naissance: jour(f.n * J), deces: jour(f.d * J) },
      vie: { metier: 'exemple', traits: ['discret·e'] }, musique: { style: f.style, energie: 35, instruments: ['piano'], instruments_eviter: [], artistes: [] },
      ceremonie: { rite: f.rite, date_ceremonie: f.cer == null ? '' : iso(f.cer).slice(0, 16) }, message: { titre: f.titre, ton: 'serein' },
      consentements: { visibilite: 'lien' }, offre: { mode: f.mode || 'essai' }
    } }];
    if (f.parole) e.paroles[id] = [{ version: 1, titre: f.titre, paroles: '[Couplet 1]\nExemple de paroles pour la démonstration.\n\n[Refrain]\nElles se remplacent par celles de votre dossier.', prompt_musique: 'gentle strings, intimate', auteur: 'agent', created_at: iso(f.maj - H) }];
    if (f.piste) e.pistes[id] = [{ id: 'p-ex' + (i + 1), version: 1, url: audio, duree_s: null, mode: f.mode === 'essai' ? 'essai' : 'complet', valide_maison: f.st === 'livre' }];
    if (f.st === 'livre') e.qr[id] = { jeton: 'EXEMPLE' + String(i + 1).padStart(5, '0'), visibilite: 'lien', actif: true, afficher_paroles: false, mot_famille: '', scans: 0, code: false, url: 'https://melodia-funebre.fr/m/EXEMPLE' + String(i + 1).padStart(5, '0') };
    const etapes = { brouillon: ['brouillon'], complet: ['brouillon', 'complet'], paroles_a_valider: ['brouillon', 'complet', 'paye', 'paroles_en_cours', 'paroles_a_valider'],
      musique_en_cours: ['brouillon', 'complet', 'essai_accorde', 'paroles_en_cours', 'paroles_a_valider', 'musique_en_cours'],
      controle_maison: ['brouillon', 'complet', 'paye', 'paroles_en_cours', 'paroles_a_valider', 'musique_en_cours', 'controle_maison'],
      livre: ['brouillon', 'complet', f.mode === 'essai' ? 'essai_accorde' : 'paye', 'paroles_en_cours', 'paroles_a_valider', 'musique_en_cours', 'controle_maison', 'livre'] }[f.st];
    const debut = f.cree, fin = f.maj;
    etapes.forEach((texte, k) => {
      const quand = iso(debut + ((fin - debut) * k) / Math.max(1, etapes.length - 1));
      e.journal.unshift({ quand, dossier: id, texte });
    });
  });
  e.journal.sort((a, b) => (a.quand < b.quand ? 1 : -1));
  e.seq = fiches.length + 1;
  return e;
}

function hasard(n) {
  const a = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const o = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(o, (x) => a[x & 31]).join('');
}

class Demo {
  constructor() { this.demo = true; this.sondage = 1500; this.audio = null; }

  async etat() {
    const stocke = await lire('demo', 'etat');
    if (stocke && (stocke.v || stocke.dossiers.length)) return stocke;
    // première ouverture : dossiers d'exemple, sauf ?vide=1 (compte vierge)
    const e = sessionStorage.getItem('melodia_pro_demo_vide') === '1' ? etatInitial() : graine(await this.pisteDemo());
    await this.poser(e);
    return e;
  }
  async poser(e) { await ecrire('demo', 'etat', e); }
  /** Repart d'un compte vierge (vide = true) ou remet les dossiers d'exemple. */
  async reinitialiser(vide = false) { await this.poser(vide ? etatInitial() : graine(await this.pisteDemo())); }

  async noter(e, id, texte) { e.journal.unshift({ quand: new Date().toISOString(), dossier: id, texte }); e.journal = e.journal.slice(0, 200); }

  async transition(e, d, vers, acteur) {
    const k = await noyau();
    const v = k.statutTransition({ de: d.status, vers, acteur });
    if (!v.ok) throw new ErreurPro('Ce changement d’état n’est pas possible maintenant.', v.erreur, 409);
    d.status = vers;
    d.updated_at = new Date().toISOString();
    await this.noter(e, d.id, vers);
  }

  async me() {
    const e = await this.etat();
    return {
      utilisateur: { id: 'demo', email: 'vous@agence-demo.fr', maison: true, role_maison: 'demo' },
      organisations: e.orgs.map((o) => ({ id: o.id, nom: o.nom, statut: o.statut, role: o.role, cobranding: o.cobranding, logo: !!o.logo })),
      offres: [
        { id: 'essentiel', nom: 'Essentiel', description: 'L’hommage sobre et juste.', prix_cents: null },
        { id: 'prestige', nom: 'Prestige', description: 'Une composition plus ample.', prix_cents: null },
        { id: 'memorial', nom: 'Mémorial', description: 'L’héritage sonore complet.', prix_cents: null }
      ],
      services: { paiement: false, paroles: true, musique: true, essai_duree_s: 150, essais_ouverts: true, mention_tva: 'TVA non applicable, art. 293 B du CGI' }
    };
  }

  resume(d) { return Object.assign({}, d); }

  async dossiers() { const e = await this.etat(); return { dossiers: e.dossiers.map((d) => this.resume(d)).sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)) }; }

  async dossier(id) {
    const e = await this.etat();
    const d = e.dossiers.find((x) => x.id === id);
    if (!d) throw new ErreurPro('Ce dossier est introuvable.', 'INTROUVABLE', 404);
    const k = await noyau();
    const qs = e.questionnaires[id] || [];
    const q = qs[qs.length - 1] || null;
    return {
      dossier: this.resume(d), acteur: 'maison',
      questionnaire: q,
      paroles: (e.paroles[id] || []).slice().reverse(),
      pistes: (e.pistes[id] || []).filter((p) => p.valide_maison || d.status === 'controle_maison').slice().reverse(),
      qr: e.qr[id] || null,
      travaux: [],
      suivants: k.statutSuivants({ de: d.status, acteur: 'maison' }).suivants,
      journal: e.journal.filter((j) => j.dossier === id)
    };
  }

  async creerDossier() {
    const e = await this.etat();
    const d = {
      id: 'demo-' + hasard(8), reference: 'MF-' + hasard(6), status: 'brouillon', paid: false, mode: null, offre_id: null,
      prenom: '', titre: '', ceremonie_le: null, date_limite: null, org_id: ORG_DEMO,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), questionnaire_version: 0
    };
    e.dossiers.push(d);
    await this.noter(e, d.id, 'brouillon');
    await this.poser(e);
    return { dossier: d };
  }

  async sauverQuestionnaire(id, donnees) {
    const e = await this.etat();
    const d = e.dossiers.find((x) => x.id === id);
    if (!['brouillon', 'complet'].includes(d.status)) throw new ErreurPro('Ce dossier n’est plus modifiable à ce stade.', 'NON_MODIFIABLE', 409);
    const k = await noyau();
    const v = (d.questionnaire_version || 0) + 1;
    (e.questionnaires[id] = e.questionnaires[id] || []).push({ version: v, donnees });
    e.questionnaires[id] = e.questionnaires[id].slice(-10);
    Object.assign(d, {
      questionnaire_version: v, updated_at: new Date().toISOString(),
      prenom: (donnees.defunt || {}).prenom || '', titre: (donnees.message || {}).titre || '',
      ceremonie_le: (donnees.ceremonie || {}).date_ceremonie || null, date_limite: (donnees.ceremonie || {}).date_limite || null,
      offre_id: (donnees.offre || {}).offre_id || null, mode: (donnees.offre || {}).mode || null
    });
    await this.poser(e);
    return { version: v, validation: k.questionnaireValider(donnees) };
  }
  async viderFile() { return 0; }

  async changerStatut(id, vers) {
    const e = await this.etat();
    const d = e.dossiers.find((x) => x.id === id);
    if (vers === 'complet') {
      const k = await noyau();
      const qs = e.questionnaires[id] || [];
      const v = k.questionnaireValider(qs.length ? qs[qs.length - 1].donnees : {});
      if (!v.complet) throw new ErreurPro('Le questionnaire n’est pas complet.', 'INCOMPLET', 422);
    }
    await this.transition(e, d, vers, 'agence');
    await this.poser(e);
    return { dossier: this.resume(d) };
  }

  async editerParoles(id, p) {
    const e = await this.etat();
    const k = await noyau();
    const qs = e.questionnaires[id] || [];
    const artistes = ((qs[qs.length - 1] || {}).donnees || {}).musique?.artistes || [];
    const a = k.promptAssainir({ texte: p.prompt_musique || '', artistes });
    const liste = e.paroles[id] = e.paroles[id] || [];
    const version = liste.length + 1;
    liste.push({ version, titre: p.titre, paroles: k.questionnaireNettoyer({ texte: p.paroles }).propre, prompt_musique: a.texte, auteur: 'conseiller', created_at: new Date().toISOString() });
    await this.poser(e);
    return { version, prompt_musique: a.texte, segments_retires: a.segments_retires };
  }

  async promo() { return { valide: false, message: 'Les codes ne s’appliquent pas en démonstration.' }; }
  async checkout() { throw new ErreurPro('Le paiement en ligne n’est pas actif en démonstration.', 'PAIEMENT_NON_CONFIGURE', 503); }
  async portail() { throw new ErreurPro('Le portail de facturation n’est pas actif en démonstration.', 'PAIEMENT_NON_CONFIGURE', 503); }

  async essai(id) {
    const e = await this.etat();
    const d = e.dossiers.find((x) => x.id === id);
    const k = await noyau();
    const r = k.essaiEligibilite({ compte_valide: true, siret: e.orgs[0].siret, email: e.orgs[0].email, essais_org_utilises: e.essais, essais_par_org: 1, essais_jour: 0, plafond_jour: 50, duree_s: 150 });
    if (d.status !== 'complet') throw new ErreurPro('Le questionnaire doit être complet avant de demander l’essai.', 'ETAT', 409);
    if (!r.eligible) throw new ErreurPro('La composition d’essai de votre agence a déjà été utilisée.', r.motifs[0], 403);
    e.essais += 1;
    d.mode = 'essai';
    await this.transition(e, d, 'essai_accorde', 'service');
    await this.poser(e);
    return { essai: { duree_s: r.duree_s, mode: r.mode, revue_maison: true } };
  }

  async redemanderParoles(id) {
    const e = await this.etat();
    const d = e.dossiers.find((x) => x.id === id);
    await this.transition(e, d, 'paroles_en_cours', 'agence');
    await this.poser(e);
    return { en_file: true };
  }

  async lancerMusique(id, version) {
    const e = await this.etat();
    const d = e.dossiers.find((x) => x.id === id);
    await this.transition(e, d, 'musique_en_cours', 'agence');
    d._version = version || (e.paroles[id] || []).length;
    await this.poser(e);
    return { en_file: true };
  }

  async pisteDemo() {
    if (this.audio) return this.audio;
    try {
      const c = await (await fetch('/assets/data/content.json')).json();
      const d = (c.demos || []).find((x) => x.visible !== false && x.audio && !/^https?:/.test(x.audio));
      this.audio = d ? '/' + d.audio.replace(/^\//, '') : null;
    } catch (e) { this.audio = null; }
    return this.audio;
  }

  /** Un pas de pipeline simulé : jamais d'appel à un fournisseur. */
  async tick(id) {
    const e = await this.etat();
    const d = e.dossiers.find((x) => x.id === id);
    if (!d) return { statut: null };
    const k = await noyau();
    if (['paye', 'essai_accorde'].includes(d.status)) {
      await this.transition(e, d, 'paroles_en_cours', 'service');
    } else if (d.status === 'paroles_en_cours') {
      const qs = e.questionnaires[id] || [];
      const q = (qs[qs.length - 1] || {}).donnees || {};
      const p = (q.defunt || {}).prenom || 'toi';
      const metier = (q.vie || {}).metier || 'tes jours';
      const trait = ((q.vie || {}).traits || [])[0] || 'ta lumière';
      const titre = (q.message || {}).titre || ('Pour ' + p);
      const paroles = `[Couplet 1]\n${p}, tu portais ${metier} comme on porte un nom,\nles gestes sûrs, la voix posée, le cœur sans façon.\n\n[Refrain]\n${p}, ${trait}, nous la gardons,\ndans chaque matin qui se lève, nous t'entendrons.\n\n[Couplet 2]\nIl reste ta place à table, et ton rire au salon,\n${p}, la vie continue, elle chante ton prénom.`;
      const prompt = k.promptConstruire({ questionnaire: q, essai: d.mode === 'essai', duree_s: d.mode === 'essai' ? 150 : null, proposition: 'gentle strings, intimate' }).prompt_musique;
      const liste = e.paroles[id] = e.paroles[id] || [];
      liste.push({ version: liste.length + 1, titre, paroles, prompt_musique: prompt, auteur: 'agent', created_at: new Date().toISOString() });
      await this.transition(e, d, 'paroles_a_valider', 'service');
    } else if (d.status === 'musique_en_cours') {
      const url = await this.pisteDemo();
      const liste = e.pistes[id] = e.pistes[id] || [];
      liste.push({ id: 'p-' + hasard(5), version: d._version || 1, url, duree_s: d.mode === 'essai' ? 150 : 210, mode: d.mode === 'essai' ? 'essai' : 'complet', valide_maison: false });
      await this.transition(e, d, 'controle_maison', 'service');
    }
    await this.poser(e);
    return { statut: d.status, traites: [] };
  }

  async qr(id, options = {}) {
    const e = await this.etat();
    const d = e.dossiers.find((x) => x.id === id);
    let q = e.qr[id];
    if (!q) {
      const qs = e.questionnaires[id] || [];
      const vis = ((qs[qs.length - 1] || {}).donnees || {}).consentements?.visibilite || 'lien';
      q = e.qr[id] = { jeton: hasard(12), visibilite: vis, actif: false, afficher_paroles: false, mot_famille: '', scans: 0, code: false };
    }
    if (options.actif === true && d.status !== 'livre') throw new ErreurPro('Le mémorial pourra être publié une fois la chanson livrée.', 'NON_LIVRE', 409);
    for (const k of ['visibilite', 'actif', 'afficher_paroles', 'mot_famille']) if (options[k] !== undefined) q[k] = options[k];
    if (options.code) q.code = true;
    q.url = 'https://melodia-funebre.fr/m/' + q.jeton;
    await this.poser(e);
    return { qr: Object.assign({}, q) };
  }

  /** Données du mémorial (aperçu local de la page /m/<jeton>). */
  async memorial(jeton) {
    const e = await this.etat();
    const id = Object.keys(e.qr).find((k) => e.qr[k].jeton === jeton);
    if (!id) throw new ErreurPro('Cette page n’est pas disponible.', 'INDISPONIBLE', 404);
    const d = e.dossiers.find((x) => x.id === id);
    const q = e.qr[id];
    const qs = e.questionnaires[id] || [];
    const def = ((qs[qs.length - 1] || {}).donnees || {}).defunt || {};
    const p = (e.paroles[id] || []).slice(-1)[0];
    const piste = (e.pistes[id] || []).filter((x) => x.valide_maison).slice(-1)[0];
    return {
      noindex: true, prenom: d.prenom || def.prenom, nom: def.nom || '', dates: [def.naissance, def.deces].filter(Boolean),
      titre: p ? p.titre : d.titre, paroles: q.afficher_paroles && p ? p.paroles : null, mot_famille: q.mot_famille,
      audio: piste ? piste.url : null, cobranding: e.orgs[0].cobranding ? { nom: e.orgs[0].nom, logo: e.orgs[0].logo } : null,
      signature: 'Composé par Melodia Funèbre', publie: q.actif
    };
  }

  async admin() {
    const e = await this.etat();
    return {
      file: [], a_valider: [], essais: [], promos: [], journal: e.journal.slice(0, 50).map((j) => ({ quand: j.quand, qui: 'démo', action: j.texte, cible: j.dossier })),
      controle: e.dossiers.filter((d) => d.status === 'controle_maison').map((d) => ({ id: d.id, reference: d.reference, mode: d.mode })),
      couts_du_jour: { total_cents: 0, nombre: 0, plafond_cents: null },
      reglages: [
        { cle: 'essai_par_org', valeur: '1', tbd: false, description: 'Compositions d’essai par agence' },
        { cle: 'essai_duree_s', valeur: '150', tbd: false, description: 'Durée de l’essai' },
        { cle: 'plafond_jour_cents', valeur: null, tbd: true, description: 'Plafond de dépense par jour' }
      ],
      offres: (await this.me()).offres.map((o) => ({ id: o.id, nom: o.nom, prix_cents: null, actif: true }))
    };
  }

  async adminAction(c) {
    const e = await this.etat();
    if (c.action === 'livrer') {
      const d = e.dossiers.find((x) => x.id === c.dossier_id);
      const p = (e.pistes[d.id] || []).find((x) => x.id === c.piste_id) || (e.pistes[d.id] || []).slice(-1)[0];
      if (!p) throw new ErreurPro('Choisissez la piste à livrer.', 'PISTE', 400);
      p.valide_maison = true;
      await this.transition(e, d, 'livre', 'maison');
      await this.poser(e);
      return { dossier: { id: d.id, status: 'livre' } };
    }
    if (c.action === 'reprendre') {
      const d = e.dossiers.find((x) => x.id === c.dossier_id);
      await this.transition(e, d, c.vers, 'maison');
      await this.poser(e);
      return { dossier: { id: d.id, status: c.vers } };
    }
    throw new ErreurPro('Action indisponible en démonstration.', 'DEMO', 400);
  }

  async exporter(mois) {
    const lignes = ['Date;Agence;SIRET;Dossier;Méthode;Statut;Montant TTC (EUR);Code promo;Référence paiement;TVA'];
    const e = await this.etat();
    for (const d of e.dossiers.filter((x) => x.mode === 'essai' && String(x.created_at).startsWith(mois))) {
      lignes.push([d.created_at.slice(0, 10), e.orgs[0].nom, e.orgs[0].siret, d.reference, 'essai', 'paye', '0,00', '', '', 'TVA non applicable, art. 293 B du CGI'].join(';'));
    }
    return new Blob(['﻿' + lignes.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
  }

  async equipe() { const e = await this.etat(); return { membres: e.equipe, invitations: e.invitations }; }
  async inviter(org, email, role) {
    const e = await this.etat();
    e.invitations.push({ id: 'i-' + hasard(4), email, role, expire_le: new Date(Date.now() + 7 * 864e5).toISOString() });
    await this.poser(e);
    return { lien: location.origin + '/pro#/invitation/' + hasard(32), expire_jours: 7 };
  }
  async accepter() { return { org_id: ORG_DEMO }; }
  async changerRole(org, membre, role) { const e = await this.etat(); const m = e.equipe.find((x) => x.id === membre); if (m) m.role = role; await this.poser(e); return {}; }
  async retirerMembre(org, membre) { const e = await this.etat(); e.equipe = e.equipe.filter((x) => x.id !== membre); await this.poser(e); return {}; }
  async creerOrg() { throw new ErreurPro('Indisponible en démonstration.', 'DEMO', 400); }
  async reglagesOrg(org, r) { const e = await this.etat(); Object.assign(e.orgs[0], r); await this.poser(e); return { organisation: e.orgs[0] }; }
  async logo(org, type, base64) { const e = await this.etat(); e.orgs[0].logo = `data:${type};base64,${base64}`; await this.poser(e); return { logo: true }; }
  async logoDonnee() { const e = await this.etat(); return e.orgs[0].logo; }
}

/** Démonstration (?demo=1, mémorisée pour l'onglet), API si une session existe, sinon null. */
export function choisirDonnees() {
  if (/[?&]demo=1(?:&|$)/.test(location.search)) sessionStorage.setItem('melodia_pro_demo', '1');
  if (/[?&]vide=1(?:&|$)/.test(location.search)) sessionStorage.setItem('melodia_pro_demo_vide', '1');
  if (sessionStorage.getItem('melodia_pro_demo') === '1') return new Demo();
  return aUneSession() ? new Api() : null;
}

export function quitterDemo() { sessionStorage.removeItem('melodia_pro_demo'); sessionStorage.removeItem('melodia_pro_demo_vide'); }
