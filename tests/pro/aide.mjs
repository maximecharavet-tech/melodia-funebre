// Outils communs des tests de la console Pro : base en mémoire, faux
// utilisateurs, fausse réponse HTTP, et un faux réseau qui simule Stripe,
// le parolier et le service de composition. AUCUN appel réel ne sort.
import { depotMemoire } from '../../lib/pro/depot.cjs';
import { limiteMemoire } from '../../lib/pro/socle.cjs';

export const ORG_A = 'org-a';
export const ORG_B = 'org-b';

export const UTILISATEURS = {
  'jeton-maitre': { id: 'u-maitre', email: 'fondateur@example.test' },
  'jeton-atelier': { id: 'u-atelier', email: 'atelier@example.test' },
  'jeton-a': { id: 'u-a', email: 'a@agence-a.test' },
  'jeton-a-lecture': { id: 'u-al', email: 'lecture@agence-a.test' },
  'jeton-b': { id: 'u-b', email: 'b@agence-b.test' },
  'jeton-commercial': { id: 'u-c', email: 'julie@example.test' }
};

export const UNIQUES = {
  pro_stripe_events: [['event_id']],
  pro_jobs: [['dossier_id', 'type', 'version']],
  pro_trials: [['org_id', 'rang']],
  pro_qr: [['jeton'], ['dossier_id']],
  pro_payments: [['stripe_session_id']],
  pro_members: [['org_id', 'user_id']],
  pro_lyrics_versions: [['dossier_id', 'version']],
  pro_questionnaires: [['dossier_id', 'version']]
};

export function questionnaireComplet(extra = {}) {
  return Object.assign({
    defunt: { prenom: 'Jeanne', nom: 'Martin', genre: 'elle', prononciation: '', naissance: '1941', deces: '2026' },
    vie: { traits: ['généreuse'], metier: 'institutrice', anecdote: 'Elle chantait en corrigeant les cahiers.' },
    musique: { style: 'Chanson française', voix: 'femme', energie: 30, artistes: ['Barbara'], instruments: ['piano'] },
    ceremonie: { rite: 'civil', date_limite: '2026-11-20T10:00' },
    message: { ton: 'lumineux', adresse: 'tu', titre: 'La maîtresse' },
    consentements: { rgpd: true, relecture_famille: true, visibilite: 'lien' },
    offre: { mode: 'payant', offre_id: 'prestige' }
  }, extra);
}

export function base(reglages = {}) {
  const r = Object.assign({
    essai_par_org: '1', essai_duree_s: '150', essai_plafond_jour: '5', essai_mode: null,
    plafond_jour_cents: '10000', cout_estime_paroles_cents: '5', cout_estime_musique_cents: '50',
    tva_bp: null, mention_tva: 'TVA non applicable, art. 293 B du CGI', job_tentatives_max: '3'
  }, reglages);
  return depotMemoire({
    roles: [
      { email: 'fondateur@example.test', role: 'master' },
      { email: 'atelier@example.test', role: 'atelier' },
      { email: 'julie@example.test', role: 'commercial' }
    ],
    pro_orgs: [
      { id: ORG_A, nom: 'Agence A', siret: '73282932000074', email: 'contact@agence-a.fr', telephone: '0472000000', statut: 'valide', cobranding: true },
      { id: ORG_B, nom: 'Agence B', siret: '44300000000002', email: 'contact@agence-b.fr', telephone: '0473000000', statut: 'valide', cobranding: true }
    ],
    pro_members: [
      { id: 'm1', org_id: ORG_A, user_id: 'u-a', email: 'a@agence-a.test', role: 'owner', statut: 'actif' },
      { id: 'm2', org_id: ORG_A, user_id: 'u-al', email: 'lecture@agence-a.test', role: 'lecture', statut: 'actif' },
      { id: 'm3', org_id: ORG_B, user_id: 'u-b', email: 'b@agence-b.test', role: 'owner', statut: 'actif' }
    ],
    pro_offers: [
      { id: 'essentiel', nom: 'Essentiel', price_cents: null, actif: true, ordre: 1 },
      { id: 'prestige', nom: 'Prestige', price_cents: 12000, actif: true, ordre: 2 }
    ],
    pro_settings: Object.entries(r).map(([cle, valeur]) => ({ cle, valeur }))
  }, UNIQUES);
}

export function contexte(depot, env = {}, maintenant = new Date('2026-11-12T10:00:00Z')) {
  let t = maintenant.getTime();
  return {
    depot,
    env: Object.assign({}, env),
    verifierJeton: async (jwt) => (UTILISATEURS[jwt] ? { ...UTILISATEURS[jwt] } : null),
    limite: async () => false,
    maintenant: () => new Date(t),
    avancer: (ms) => { t += ms; },
    sansCourriel: true
  };
}

export function utilisateur(ctxDepot, jeton) {
  const u = { ...UTILISATEURS[jeton] };
  const r = ctxDepot.tables.roles.find((x) => x.email === u.email);
  u.roleMaison = r ? r.role : null;
  return u;
}

/** Fausse réponse Node/Vercel. */
export function reponse() {
  const r = {
    statusCode: 200, headers: {}, body: undefined, fini: false,
    status(c) { this.statusCode = c; return this; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    json(o) { this.body = o; this.fini = true; return this; },
    send(t) { this.body = t; this.fini = true; return this; },
    end(t) { if (t !== undefined) this.body = t; this.fini = true; return this; }
  };
  return r;
}

export function requete({ methode = 'POST', corps, jeton, origine, entetes = {}, query = {} } = {}) {
  const h = Object.assign({}, entetes);
  if (jeton) h.authorization = 'Bearer ' + jeton;
  if (origine) h.origin = origine;
  return { method: methode, headers: h, body: corps, query };
}

/**
 * Faux réseau. `routes` : tableau [motif RegExp, (url, opts) => {status, json}|octets].
 * Toute adresse non prévue fait échouer le test : rien ne sort.
 */
export function fauxReseau(routes) {
  const appels = [];
  const avant = globalThis.fetch;
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    appels.push({ url: u, opts });
    for (const [motif, f] of routes) {
      if (motif.test(u)) {
        const r = await f(u, opts);
        if (r instanceof Uint8Array || Buffer.isBuffer(r)) {
          return { ok: true, status: 200, arrayBuffer: async () => r, json: async () => ({}), text: async () => '' };
        }
        const status = r.status || 200;
        return { ok: status < 400, status, json: async () => r.json, text: async () => JSON.stringify(r.json) };
      }
    }
    throw new Error('APPEL RÉSEAU NON PRÉVU : ' + u);
  };
  return { appels, restaurer: () => { globalThis.fetch = avant; } };
}

export async function creerDossier(ctx, jeton = 'jeton-a', org = ORG_A, q = questionnaireComplet()) {
  const { default: dossiers } = await import('../../lib/pro/routes/dossiers.cjs');
  const u = utilisateur(ctx.depot, jeton);
  const c = await dossiers({ methode: 'POST', corps: { action: 'creer', org_id: org }, query: {}, utilisateur: u }, ctx);
  const id = c.json.dossier.id;
  await dossiers({ methode: 'POST', corps: { action: 'questionnaire', id, donnees: q }, query: {}, utilisateur: u }, ctx);
  return id;
}

export { limiteMemoire };
