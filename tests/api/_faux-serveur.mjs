// Faux Supabase (PostgREST) + faux Resend, pour prouver l'envoi de bout en bout
// sans réseau. La fonction reserver_envois (fenêtre de 60 jours) est émulée :
// la vérification et l'insertion sont synchrones (comme sous le verrou
// consultatif de Postgres), l'attente qui précède laisse les requêtes
// concurrentes s'entrelacer.
const BLOQUANTS = ['reserve', 'incertain', 'envoye', 'delivre', 'ouvert', 'clique', 'differe', 'rejete', 'plainte'];
const FENETRE = 60 * 24 * 3600 * 1000;
export function monterFauxServeur(opts = {}) {
  const etat = {
    envois: [], resend: [], sequence: 0,
    resendReponse: opts.resendReponse || null, // fonction (n) → { status, corps } | 'timeout'
    colonneIdempotence: opts.colonneIdempotence !== false,
    prospects: opts.prospects || [], inscriptions: opts.inscriptions || [], sequences: opts.sequences || [],
    taches: [], patches: [], role: opts.role || 'commercial', delaiBase: opts.delaiBase ?? 4,
    journalEnPanne: false
  };
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const rep = (status, corps) => ({
    ok: status >= 200 && status < 300, status,
    headers: { get: () => null },
    text: async () => (typeof corps === 'string' ? corps : JSON.stringify(corps)),
    json: async () => (typeof corps === 'string' ? JSON.parse(corps) : corps)
  });
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    const methode = (init.method || 'GET').toUpperCase();
    const corps = init.body ? JSON.parse(init.body) : null;
    if (u.host === 'api.resend.com') {
      etat.resend.push({ chemin: u.pathname, corps, entetes: init.headers || {} });
      await pause(etat.delaiBase);
      const n = etat.resend.length;
      const r = etat.resendReponse ? etat.resendReponse(n) : null;
      if (r === 'timeout') { const e = new Error('abort'); e.name = 'AbortError'; throw e; }
      if (r) return rep(r.status, r.corps);
      if (u.pathname === '/emails/batch') return rep(200, { data: corps.map((_, i) => ({ id: 'rs_' + n + '_' + i })) });
      return rep(200, { id: 'rs_' + n });
    }
    if (u.pathname === '/auth/v1/user') return rep(200, { email: 'Julie@Melodia.test', user_metadata: {} });
    if (u.pathname === '/rest/v1/rpc/reserver_envois') {
      if (etat.journalEnPanne) return rep(503, 'indisponible');
      if (!etat.colonneIdempotence) return rep(404, { code: 'PGRST202', message: 'Could not find the function public.reserver_envois' });
      await pause(etat.delaiBase);
      const maintenant = Date.now();
      const res = [];
      for (const l of corps.p_lignes) {
        const cle = l.cle_idempotence;
        const ex = etat.envois.filter((x) => x.cle_idempotence === cle && BLOQUANTS.includes(x.statut)
          && new Date(x.envoye_le).getTime() > maintenant - FENETRE)
          .sort((a, b) => new Date(b.envoye_le) - new Date(a.envoye_le))[0];
        if (ex) {
          res.push({ cle, ok: false, deja: ex.statut, precedent: ex.envoye_le, renvoi: new Date(new Date(ex.envoye_le).getTime() + FENETRE).toISOString() });
          continue;
        }
        const ligne = Object.assign({ id: ++etat.sequence, envoye_le: new Date(maintenant).toISOString() }, l, { statut: 'reserve' });
        etat.envois.push(ligne);
        res.push({ cle, ok: true, id: ligne.id });
      }
      return rep(200, res);
    }
    if (u.pathname === '/rest/v1/rpc/melodia_trop_souvent') return rep(404, 'PGRST202');
    if (u.pathname === '/rest/v1/roles') return rep(200, [{ email: u.searchParams.get('email')?.replace('ilike.', '').toLowerCase() || 'julie@melodia.test', role: etat.role }]);
    if (u.pathname === '/rest/v1/collaborateurs') return rep(200, [{ email: 'julie@melodia.test', nom: 'Julie Serve' }]);
    if (u.pathname === '/rest/v1/prospects') {
      if (methode === 'PATCH') { etat.patches.push({ table: 'prospects', q: u.search, corps }); return rep(204, ''); }
      return rep(200, etat.prospects);
    }
    if (u.pathname === '/rest/v1/sequences') {
      if (methode === 'POST') { const l = Object.assign({ id: 100 + etat.sequences.length }, corps); etat.sequences.push(l); return rep(201, [l]); }
      if (methode === 'PATCH') { const id = Number(u.searchParams.get('id').replace('eq.', '')); const l = etat.sequences.find((x) => x.id === id); if (l) Object.assign(l, corps); return rep(204, ''); }
      const nom = u.searchParams.get('nom');
      return rep(200, nom ? etat.sequences.filter((x) => x.nom === decodeURIComponent(nom.replace('eq.', ''))) : etat.sequences);
    }
    if (u.pathname === '/rest/v1/sequence_inscriptions') {
      if (methode === 'PATCH') {
        etat.patches.push({ table: 'sequence_inscriptions', q: u.search, corps });
        await pause(1);
        const id = Number(u.searchParams.get('id')?.replace('eq.', ''));
        const l = etat.inscriptions.find((x) => x.id === id);
        const exige = u.searchParams.get('prochaine_le');
        const st = u.searchParams.get('statut');
        const ok = l && (!exige || new Date(exige.replace('eq.', '')).getTime() === new Date(l.prochaine_le).getTime()) && (!st || st.replace('eq.', '') === l.statut);
        if (ok) Object.assign(l, corps);
        return /return=representation/.test(init.headers?.Prefer || '') ? rep(200, ok ? [l] : []) : rep(204, '');
      }
      if (methode === 'POST') {
        const nouvelles = [];
        for (const l of corps) {
          if (etat.inscriptions.some((x) => x.owner === l.owner && x.prospect_siret === l.prospect_siret && x.sequence_id === l.sequence_id)) continue;
          const ligne = Object.assign({ id: 500 + etat.inscriptions.length, motif_sortie: '', created_at: new Date().toISOString() }, l);
          etat.inscriptions.push(ligne); nouvelles.push(ligne);
        }
        return rep(201, nouvelles);
      }
      if (u.searchParams.get('owner') && !u.searchParams.get('prochaine_le')) {
        return rep(200, etat.inscriptions.filter((x) => ['active', 'pause'].includes(x.statut)));
      }
      return rep(200, etat.inscriptions.filter((x) => x.statut === 'active' && new Date(x.prochaine_le) <= new Date(u.searchParams.get('prochaine_le').replace('lte.', ''))));
    }
    if (u.pathname === '/rest/v1/taches') { if (methode === 'POST') etat.taches.push(corps); return rep(201, ''); }
    if (u.pathname === '/rest/v1/envois_prospect') {
      if (etat.journalEnPanne) return rep(503, 'indisponible');
      if (methode === 'POST') {
        await pause(etat.delaiBase);
        const lignes = Array.isArray(corps) ? corps : [corps];
        if (!etat.colonneIdempotence && lignes.some((l) => 'cle_idempotence' in l || 'campagne' in l)) {
          return rep(400, { code: 'PGRST204', message: "Could not find the 'cle_idempotence' column of 'envois_prospect'" });
        }
        const inseres = [];
        for (const l of lignes) {
          const ligne = Object.assign({ id: ++etat.sequence, statut: 'envoye', envoye_le: new Date().toISOString() }, l);
          etat.envois.push(ligne); inseres.push(ligne);
        }
        return /return=representation/.test(init.headers?.Prefer || '') ? rep(201, inseres) : rep(201, '');
      }
      if (methode === 'PATCH') {
        const id = Number(u.searchParams.get('id')?.replace('eq.', ''));
        const l = etat.envois.find((x) => x.id === id);
        if (l) Object.assign(l, corps);
        return rep(204, '');
      }
      // GET
      let liste = etat.envois.slice();
      const cle = u.searchParams.get('cle_idempotence');
      if (cle && !etat.colonneIdempotence) return rep(400, { code: '42703', message: 'column envois_prospect.cle_idempotence does not exist' });
      if (cle) { const v = cle.replace(/^in\.\(|\)$/g, '').split(',').map((x) => x.replace(/"/g, '')); liste = liste.filter((l) => v.includes(l.cle_idempotence)); }
      const st = u.searchParams.get('statut');
      if (st && st.startsWith('in.')) { const v = st.slice(4, -1).split(','); liste = liste.filter((l) => v.includes(l.statut)); }
      if (st === 'neq.echec') liste = liste.filter((l) => l.statut !== 'echec');
      const dest = u.searchParams.get('destinataire');
      if (dest && dest.startsWith('in.')) { const v = dest.slice(4, -1).split(',').map((x) => x.replace(/"/g, '')); liste = liste.filter((l) => v.includes(l.destinataire)); }
      const depuis = u.searchParams.get('envoye_le');
      if (depuis && depuis.startsWith('gt.')) liste = liste.filter((l) => new Date(l.envoye_le).getTime() > new Date(depuis.slice(3)).getTime());
      if (depuis && depuis.startsWith('gte.')) liste = liste.filter((l) => new Date(l.envoye_le).getTime() >= new Date(depuis.slice(4)).getTime());
      const mode = u.searchParams.get('mode'); if (mode) liste = liste.filter((l) => l.mode === mode.replace('eq.', ''));
      return rep(200, liste);
    }
    return rep(404, 'inconnu ' + u.pathname);
  };
  return { etat, restaurer() { globalThis.fetch = original; } };
}

export function fausseReponse() {
  const res = { statusCode: 200, entetes: {}, corps: undefined };
  res.setHeader = (k, v) => { res.entetes[k] = v; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.corps = o; return res; };
  res.end = () => res;
  return res;
}

export function requete(corps, extra = {}) {
  return {
    method: 'POST',
    headers: Object.assign({ origin: 'https://melodia-funebre.fr', authorization: 'Bearer jeton-julie' }, extra),
    body: corps
  };
}
