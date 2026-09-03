// ═══════════════════════════════════════════════════════════════
// /api/prospects — Les pompes funèbres de France
//
// S'appuie sur l'annuaire public des entreprises de l'État
// (recherche-entreprises.api.gouv.fr) : données ouvertes, sans clé,
// alimentées par la base SIRENE de l'INSEE.
//
// Code NAF retenu : 9603Z — « Services funéraires ».
//
//   GET /api/prospects?departement=69&page=1
//   GET /api/prospects?q=roblot&departement=69
//
// Passer par une fonction plutôt que d'appeler l'annuaire depuis le
// navigateur permet de normaliser la réponse, de mettre en cache, et de
// ne pas dépendre de la politique CORS d'un service tiers.
// ═══════════════════════════════════════════════════════════════

/* Surchargeable pour les essais ; en production, l'annuaire de l'État. */
const SOURCE = process.env.PROSPECTS_API_URL || 'https://recherche-entreprises.api.gouv.fr/search';
const NAF = '9603Z';
const TIMEOUT_MS = 15000;

function normaliser(e) {
  const s = e.siege || {};
  const ville = s.libelle_commune || '';
  const cp = s.code_postal || '';
  const adresse = [s.numero_voie, s.type_voie, s.libelle_voie]
    .filter(Boolean).join(' ') || s.adresse || '';

  // Le dirigeant, quand il est publié, vaut mieux qu'un « Bonjour »
  const d = (e.dirigeants || [])[0] || {};
  const dirigeant = [d.prenoms, d.nom].filter(Boolean).join(' ').trim()
    || d.denomination || '';

  return {
    siren: e.siren || '',
    siret: s.siret || '',
    nom: e.nom_complet || e.nom_raison_sociale || 'Sans nom',
    enseigne: (s.liste_enseignes || [])[0] || '',
    adresse: adresse,
    cp: cp,
    ville: ville,
    departement: cp.slice(0, 2),
    dirigeant: dirigeant,
    effectif: e.tranche_effectif_salarie || '',
    creation: e.date_creation || '',
    // Ni téléphone ni email : l'annuaire public n'en publie pas.
    // Le collaborateur les complète au fil de sa recherche.
    email: '',
    tel: ''
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET uniquement' });

  const { departement, q, page, per_page } = req.query || {};
  const dep = String(departement || '').trim();
  if (!dep && !q) {
    return res.status(400).json({ error: 'Indiquez au moins un département ou une recherche.' });
  }
  if (dep && !/^(0[1-9]|[1-8][0-9]|9[0-5]|2[AB]|97[1-6])$/i.test(dep)) {
    return res.status(400).json({ error: 'Département invalide. Exemples : 69, 2A, 974.' });
  }

  const params = new URLSearchParams({
    activite_principale: NAF,
    etat_administratif: 'A',            // établissements en activité seulement
    page: String(Math.max(1, parseInt(page, 10) || 1)),
    per_page: String(Math.min(25, Math.max(1, parseInt(per_page, 10) || 25)))
  });
  if (dep) params.set('departement', dep.toUpperCase());
  if (q) params.set('q', String(q).slice(0, 80));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(SOURCE + '?' + params.toString(), {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' }
    });
    const texte = await r.text();
    let data; try { data = JSON.parse(texte); } catch (e) { data = null; }

    if (!r.ok || !data) {
      return res.status(r.status === 429 ? 429 : 502).json({
        error: r.status === 429
          ? 'L\'annuaire public limite temporairement les requêtes. Réessayez dans un instant.'
          : 'L\'annuaire public a répondu ' + r.status + '.',
        code: 'SOURCE_ERROR'
      });
    }

    const resultats = (data.results || []).map(normaliser);
    // L'annuaire est stable au jour le jour : une journée de cache au bord suffit
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({
      resultats: resultats,
      total: data.total_results || resultats.length,
      page: data.page || 1,
      pages: data.total_pages || 1,
      source: 'annuaire-entreprises.data.gouv.fr · base SIRENE (INSEE)'
    });
  } catch (err) {
    const coupe = err.name === 'AbortError';
    return res.status(coupe ? 504 : 500).json({
      error: coupe ? 'L\'annuaire public n\'a pas répondu.' : 'Recherche impossible : ' + err.message,
      code: coupe ? 'TIMEOUT' : 'FETCH_FAILED'
    });
  } finally {
    clearTimeout(timer);
  }
}
