// ═══════════════════════════════════════════════════════════════
// Dépôt de données de la console Pro.
//
// Deux implémentations du même petit contrat :
//   - depotSupabase : PostgREST + Storage avec la clé de service (serveur
//     uniquement ; la clé ne quitte jamais les fonctions Vercel) ;
//   - depotMemoire  : tables en mémoire, pour les tests (node --test) et
//     pour prouver les règles sans base.
//
// Filtres : { col: valeur }            égalité
//           { col: { op, v } }         op ∈ eq, neq, lt, lte, gt, gte, is, in
//           { $ou: [ {…}, {…} ] }      disjonction de filtres simples
// ═══════════════════════════════════════════════════════════════
'use strict';

const SB_URL = () => (process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co').replace(/\/+$/, '');
const CLE = () => String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function cleValide(c) {
  return !!c && !/^https?:/i.test(c) && c.length > 20;
}

function entetes(extra) {
  const c = CLE();
  const h = { apikey: c };
  if (c.startsWith('eyJ')) h.Authorization = 'Bearer ' + c;
  return Object.assign(h, extra || {});
}

function valeurPg(v) {
  if (v === null) return 'null';
  if (v === true) return 'true';
  if (v === false) return 'false';
  return String(v);
}

function filtreSimple(col, f) {
  if (f && typeof f === 'object' && !Array.isArray(f) && 'op' in f) {
    if (f.op === 'in') return `${col}=in.(${f.v.map((x) => '"' + String(x).replace(/"/g, '') + '"').join(',')})`;
    return `${col}=${f.op}.${encodeURIComponent(valeurPg(f.v))}`;
  }
  return `${col}=eq.${encodeURIComponent(valeurPg(f))}`;
}

function filtreOu(liste) {
  const parts = liste.map((f) => {
    const [col, val] = Object.entries(f)[0];
    if (val && typeof val === 'object' && 'op' in val) return `${col}.${val.op}.${valeurPg(val.v)}`;
    return `${col}.eq.${valeurPg(val)}`;
  });
  return 'or=(' + encodeURIComponent(parts.join(',')) + ')';
}

function requete(filtres) {
  const q = [];
  for (const [col, f] of Object.entries(filtres || {})) {
    if (col === '$ou') q.push(filtreOu(f));
    else q.push(filtreSimple(col, f));
  }
  return q;
}

function depotSupabase() {
  if (!cleValide(CLE())) return null;
  async function appel(chemin, opts = {}) {
    const r = await fetch(SB_URL() + chemin, {
      method: opts.method || 'GET',
      headers: entetes(Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {})),
      body: opts.body
    });
    const t = await r.text();
    let d = null;
    try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
    if (!r.ok) {
      const err = new Error('BASE_' + r.status);
      err.status = r.status;
      err.code = d && d.code;
      err.detail = d && (d.message || d.error);
      throw err;
    }
    return d;
  }
  return {
    nom: 'supabase',
    async select(table, filtres, o = {}) {
      const q = ['select=' + encodeURIComponent(o.colonnes || '*'), ...requete(filtres)];
      if (o.ordre) q.push('order=' + encodeURIComponent(o.ordre));
      if (o.limite) q.push('limit=' + o.limite);
      return (await appel(`/rest/v1/${table}?${q.join('&')}`)) || [];
    },
    async insert(table, lignes, o = {}) {
      const prefer = ['return=representation'];
      let chemin = `/rest/v1/${table}`;
      if (o.ignorerDoublon) {
        prefer.push('resolution=ignore-duplicates');
        if (o.conflit) chemin += '?on_conflict=' + encodeURIComponent(o.conflit);
      }
      try {
        return (await appel(chemin, { method: 'POST', headers: { Prefer: prefer.join(',') }, body: JSON.stringify(lignes) })) || [];
      } catch (e) {
        if (e.code === '23505') { const x = new Error('DOUBLON'); x.doublon = true; throw x; }
        throw e;
      }
    },
    async update(table, filtres, patch) {
      const q = requete(filtres);
      if (!q.length) throw new Error('MISE_A_JOUR_SANS_FILTRE');
      return (await appel(`/rest/v1/${table}?${q.join('&')}`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch)
      })) || [];
    },
    async rpc(nom, args) {
      return appel(`/rest/v1/rpc/${nom}`, { method: 'POST', body: JSON.stringify(args || {}) });
    },
    async deposer(bucket, chemin, octets, type) {
      const r = await fetch(`${SB_URL()}/storage/v1/object/${bucket}/${chemin}`, {
        method: 'POST',
        headers: entetes({ 'Content-Type': type, 'x-upsert': 'true', 'Cache-Control': 'private, max-age=0' }),
        body: octets
      });
      if (!r.ok) throw new Error('STOCKAGE_' + r.status);
      return chemin;
    },
    async urlSignee(bucket, chemin, secondes) {
      const d = await appel(`/storage/v1/object/sign/${bucket}/${chemin}`, {
        method: 'POST', body: JSON.stringify({ expiresIn: secondes || 3600 })
      });
      const u = d && (d.signedURL || d.signedUrl);
      return u ? SB_URL() + '/storage/v1' + u : null;
    }
  };
}

// ─── Mémoire ────────────────────────────────────────────────────────

function correspond(ligne, filtres) {
  for (const [col, f] of Object.entries(filtres || {})) {
    if (col === '$ou') {
      if (!f.some((g) => correspond(ligne, g))) return false;
      continue;
    }
    const v = ligne[col];
    if (f && typeof f === 'object' && !Array.isArray(f) && 'op' in f) {
      const w = f.v;
      const ok = {
        eq: () => v === w,
        neq: () => v !== w,
        lt: () => v != null && v < w,
        lte: () => v != null && v <= w,
        gt: () => v != null && v > w,
        gte: () => v != null && v >= w,
        is: () => (w === null ? v == null : v === w),
        in: () => w.includes(v)
      }[f.op];
      if (!ok || !ok()) return false;
    } else if (v !== f) return false;
  }
  return true;
}

/**
 * @param {Object<string, string[][]>} uniques  table → liste de clés uniques
 *        (ex. { pro_jobs: [['dossier_id','type','version']] })
 */
function depotMemoire(initial = {}, uniques = {}) {
  const tables = {};
  let seq = 1;
  for (const [t, lignes] of Object.entries(initial)) tables[t] = lignes.map((l) => ({ ...l }));
  const fichiers = new Map();
  const T = (t) => (tables[t] = tables[t] || []);
  function viole(table, ligne) {
    for (const cle of uniques[table] || []) {
      if (T(table).some((l) => cle.every((c) => l[c] === ligne[c] && ligne[c] != null))) return true;
    }
    return false;
  }
  return {
    nom: 'memoire',
    tables,
    fichiers,
    async select(table, filtres, o = {}) {
      let r = T(table).filter((l) => correspond(l, filtres)).map((l) => ({ ...l }));
      if (o.ordre) {
        const [col, sens] = o.ordre.split('.');
        r.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (sens === 'desc' ? -1 : 1));
      }
      if (o.limite) r = r.slice(0, o.limite);
      return r;
    },
    async insert(table, lignes, o = {}) {
      const liste = Array.isArray(lignes) ? lignes : [lignes];
      const faites = [];
      for (const l of liste) {
        const ligne = { id: l.id != null ? l.id : seq++, created_at: new Date().toISOString(), ...l };
        if (viole(table, ligne)) {
          if (o.ignorerDoublon) continue;
          const e = new Error('DOUBLON'); e.doublon = true; throw e;
        }
        T(table).push(ligne);
        faites.push({ ...ligne });
      }
      return faites;
    },
    async update(table, filtres, patch) {
      const r = [];
      for (const l of T(table)) if (correspond(l, filtres)) { Object.assign(l, patch); r.push({ ...l }); }
      return r;
    },
    async rpc(nom) { throw new Error('RPC_INCONNUE ' + nom); },
    async deposer(bucket, chemin, octets, type) {
      fichiers.set(bucket + '/' + chemin, { octets, type });
      return chemin;
    },
    async urlSignee(bucket, chemin) {
      return fichiers.has(bucket + '/' + chemin) ? `memoire://${bucket}/${chemin}?signe=1` : null;
    }
  };
}

module.exports = { depotSupabase, depotMemoire };
