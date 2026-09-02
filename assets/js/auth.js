/* ═══════════════════════════════════════════════════════════════
   MELODIA — Authentification & données
   Rôles : master (fondateur) · partner (agence PF) · client (famille)
   Stockage : localStorage (démo) ou Supabase (production via config.js)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CFG = window.MELODIA_CONFIG || {};
  var HAS_SB = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
  var SB = HAS_SB ? CFG.SUPABASE_URL.replace(/\/+$/, '') : '';
  var SBK = HAS_SB ? CFG.SUPABASE_ANON_KEY : '';

  /* Identifiants maître — mode débutant, prototype local */
  var MASTER_ID = 'mastermax07';
  var MASTER_PW = 'mastermax07';

  var LS = {
    get: function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
    set: function (k, v) { localStorage.setItem(k, JSON.stringify(v)); },
    del: function (k) { localStorage.removeItem(k); }
  };
  function uid() { return 'MEL-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }
  function hash(s) { return btoa(unescape(encodeURIComponent(s))); }

  async function sb(path, opts) {
    opts = opts || {};
    var s = LS.get('melodia_session', null);
    var h = { apikey: SBK, 'Content-Type': 'application/json' };
    Object.keys(opts.headers || {}).forEach(function (k) { h[k] = opts.headers[k]; });
    h.Authorization = 'Bearer ' + ((s && s.access_token) || SBK);
    var r = await fetch(SB + path, { method: opts.method || 'GET', headers: h, body: opts.body });
    var t = await r.text(); var d = null;
    try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
    if (!r.ok) throw new Error((d && (d.msg || d.message || d.error_description || d.error)) || ('Erreur ' + r.status));
    return d;
  }

  /* ═══ AUTH ═══ */
  window.MelodiaAuth = {
    mode: HAS_SB ? 'supabase' : 'local',

    current: function () {
      var m = LS.get('melodia_master', null);
      if (m) return { id: 'master', name: 'Maxime Charavet', email: MASTER_ID, role: 'master' };
      if (HAS_SB) {
        var s = LS.get('melodia_session', null);
        if (!s || !s.user) return null;
        var meta = s.user.user_metadata || {};
        return { id: s.user.id, email: s.user.email, name: meta.name || s.user.email.split('@')[0], role: meta.role || 'partner', agence: meta.agence || '' };
      }
      return LS.get('melodia_user', null);
    },

    isMaster: function () { var u = this.current(); return !!u && u.role === 'master'; },

    async login(identifiant, password) {
      var id = (identifiant || '').trim();
      // 1) Compte maître
      if (id.toLowerCase() === MASTER_ID && password === MASTER_PW) {
        LS.set('melodia_master', { at: Date.now() });
        return { id: 'master', name: 'Maxime Charavet', email: MASTER_ID, role: 'master' };
      }
      var email = id.toLowerCase();
      if (HAS_SB) {
        var d = await sb('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: email, password: password }) });
        LS.set('melodia_session', d);
        return this.current();
      }
      var users = LS.get('melodia_users', {});
      var u = users[email];
      if (!u || u.pw !== hash(password)) throw new Error('Identifiant ou mot de passe incorrect.');
      var user = { id: u.id, name: u.name, email: u.email, role: u.role || 'partner', agence: u.agence || '' };
      LS.set('melodia_user', user);
      return user;
    },

    async signup(data) {
      var email = (data.email || '').trim().toLowerCase();
      if (!data.name || !email || !data.password) throw new Error('Tous les champs marqués * sont requis.');
      if (data.password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
      if (email === MASTER_ID) throw new Error('Cet identifiant est réservé.');
      if (HAS_SB) {
        var d = await sb('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email: email, password: data.password, data: { name: data.name, role: 'partner', agence: data.agence || '', ville: data.ville || '', tel: data.tel || '' } }) });
        if (d.access_token) LS.set('melodia_session', d);
        return this.current() || { email: email, name: data.name, role: 'partner', pending: true };
      }
      var users = LS.get('melodia_users', {});
      if (users[email]) throw new Error('Un compte existe déjà avec cet email.');
      users[email] = { id: uid(), name: data.name, email: email, pw: hash(data.password), role: 'partner', agence: data.agence || '', ville: data.ville || '', tel: data.tel || '' };
      LS.set('melodia_users', users);
      var user = { id: users[email].id, name: data.name, email: email, role: 'partner', agence: data.agence || '' };
      LS.set('melodia_user', user);
      return user;
    },

    async resetPassword(email) {
      email = (email || '').trim().toLowerCase();
      if (!email) throw new Error('Renseignez votre email.');
      if (HAS_SB) {
        await sb('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email: email }) });
        return 'Un lien de réinitialisation vient d\'être envoyé à ' + email + '.';
      }
      var users = LS.get('melodia_users', {});
      if (!users[email]) throw new Error('Aucun compte associé à cet email.');
      var temp = 'MF' + Math.random().toString(36).slice(2, 8).toUpperCase();
      users[email].pw = hash(temp);
      LS.set('melodia_users', users);
      return 'Mode démo — mot de passe provisoire : ' + temp + ' (à changer après connexion). En production, un email est envoyé.';
    },

    logout: function () { LS.del('melodia_master'); LS.del('melodia_session'); LS.del('melodia_user'); },

    /** Redirige vers le bon tableau de bord, ou vers compte.html si non connecté */
    guard: function () {
      var u = this.current();
      if (!u) { location.href = 'compte.html'; return null; }
      return u;
    },
    home: function () { return this.isMaster() ? 'dashboard-master.html' : 'dashboard-partenaire.html'; }
  };

  /* ═══ DONNÉES ═══ */
  var FLOW = ['recue', 'brief', 'composition', 'livree'];
  window.MELODIA_FLOW = FLOW;
  window.MELODIA_STATUS = {
    recue: { label: 'Reçue', color: '#fbbf24' },
    brief: { label: 'Brief validé', color: '#38bdf8' },
    composition: { label: 'En composition', color: '#a78bfa' },
    livree: { label: 'Livrée', color: '#4ade80' }
  };

  window.MelodiaDB = {
    mode: HAS_SB ? 'supabase' : 'local',

    async create(o) {
      var u = window.MelodiaAuth.current();
      var rec = {
        ref: uid(), created_at: new Date().toISOString(), status: 'recue',
        /* Les coordonnées transmises l'emportent sur celles du compte connecté :
           une commande saisie par le fondateur ou par une agence pour une
           famille doit être rattachée à cette famille, pas à qui la saisit. */
        user_email: o.email || (u && u.email) || '', user_name: o.name || (u && u.name) || '',
        agence: o.agence || (u && u.agence) || '',
        offer: o.offer, price: o.price, defunt: o.defunt,
        traits: o.traits || '', metier: o.metier || '', habitude: o.habitude || '',
        anecdote: o.anecdote || '', style: o.style || '',
        urgence: !!o.urgence, paid: !!o.paid, paypal_id: o.paypal_id || ''
      };
      if (HAS_SB) {
        var rows = await sb('/rest/v1/orders', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rec) });
        return (rows && rows[0]) || rec;
      }
      var all = LS.get('melodia_orders', []);
      all.unshift(rec); LS.set('melodia_orders', all);
      return rec;
    },

    async mine() {
      var u = window.MelodiaAuth.current();
      if (!u) return [];
      if (u.role === 'master') return this.all();
      if (HAS_SB) return sb('/rest/v1/orders?user_email=eq.' + encodeURIComponent(u.email) + '&order=created_at.desc');
      return LS.get('melodia_orders', []).filter(function (o) { return o.user_email === u.email; });
    },

    async all() {
      if (HAS_SB) return sb('/rest/v1/orders?order=created_at.desc');
      return LS.get('melodia_orders', []);
    },

    async setStatus(ref, status) {
      if (HAS_SB) { await sb('/rest/v1/orders?ref=eq.' + encodeURIComponent(ref), { method: 'PATCH', body: JSON.stringify({ status: status }) }); return true; }
      var all = LS.get('melodia_orders', []);
      var o = all.filter(function (x) { return x.ref === ref; })[0];
      if (o) { o.status = status; LS.set('melodia_orders', all); }
      return true;
    },

    /** Rattache l'oeuvre composee a la commande (ecoute par la famille) */
    async setAudio(ref, audio) {
      var patch = {
        audio_url: audio.url || '',
        audio_title: audio.title || '',
        music_task_id: audio.taskId || ''
      };
      if (HAS_SB) {
        try {
          await sb('/rest/v1/orders?ref=eq.' + encodeURIComponent(ref), { method: 'PATCH', body: JSON.stringify(patch) });
        } catch (e) {
          /* Les colonnes doivent exister cote Supabase : message explicite plutot qu'echec muet */
          throw new Error('Supabase a refuse l\'enregistrement. Ajoutez les colonnes audio_url, audio_title et music_task_id a la table orders (voir README).');
        }
        return true;
      }
      var all = LS.get('melodia_orders', []);
      var o = all.filter(function (x) { return x.ref === ref; })[0];
      if (o) { o.audio_url = patch.audio_url; o.audio_title = patch.audio_title; o.music_task_id = patch.music_task_id; LS.set('melodia_orders', all); }
      return true;
    },

    async partners() {
      if (HAS_SB) return [];
      var users = LS.get('melodia_users', {});
      return Object.keys(users).map(function (k) { return users[k]; });
    },

    /** Jeu de démonstration si la base est vide (pour visualiser les dashboards) */
    async seedIfEmpty() {
      if (HAS_SB) return;
      var all = LS.get('melodia_orders', []);
      if (all.length) return;
      var now = Date.now();
      var demo = [
        { defunt: 'Maurice', offer: 'Prestige', price: 299, style: 'Chanson française', status: 'composition', traits: 'têtu, généreux, taquin', metier: 'pêcheur', habitude: 'sifflait en marchant', anecdote: 'a appris à pêcher à ses 4 petits-enfants', d: 1 },
        { defunt: 'Monique', offer: 'Mémorial', price: 499, style: 'Folk acoustique', status: 'livree', traits: 'douce, patiente, lumineuse', metier: 'jardinière', habitude: 'parlait à ses roses', anecdote: 'un jasmin planté à la naissance de chaque enfant', d: 6 },
        { defunt: 'Sergio', offer: 'Prestige', price: 299, style: 'Bossa nova', status: 'recue', traits: 'joyeux, danseur, bavard', metier: 'restaurateur', habitude: 'chantait en cuisine', anecdote: 'a dansé à son propre 69e anniversaire jusqu\'à 3h', d: 0 }
      ];
      LS.set('melodia_orders', demo.map(function (x) {
        return {
          ref: 'MEL-DEMO' + x.d, created_at: new Date(now - x.d * 86400000).toISOString(), status: x.status,
          user_email: 'demo@agence.fr', user_name: 'Agence démonstration', agence: 'PF Démonstration',
          offer: x.offer, price: x.price, defunt: x.defunt, traits: x.traits, metier: x.metier,
          habitude: x.habitude, anecdote: x.anecdote, style: x.style, urgence: false, paid: true, paypal_id: ''
        };
      }));
    }
  };

  /* ═══ IA — paroles + direction musicale (Pollinations, sans clé) ═══ */
  window.MelodiaAI = {
    async lyrics(brief) {
      var p = 'Tu es un parolier français spécialisé dans les hommages funéraires respectueux et émouvants, et un directeur artistique musical.\n\n'
        + 'Défunt : ' + brief.defunt + ' · Traits : ' + (brief.traits || '-') + ' · Métier/passion : ' + (brief.metier || '-')
        + ' · Habitude : ' + (brief.habitude || '-') + ' · Anecdote : ' + (brief.anecdote || '-') + ' · Style : ' + (brief.style || 'Chanson française') + '\n\n'
        + 'Réponds UNIQUEMENT en JSON strict sans backticks : {"title":"titre poétique 3-5 mots","lyrics":"[Couplet 1]\\n4 vers\\n\\n[Refrain]\\n4 vers\\n\\n[Couplet 2]\\n4 vers","style_prompt":"description EN ANGLAIS pour Mureka : genre, voix, instruments, tempo BPM, ambiance, 15-25 mots"}\n'
        + 'Paroles : ton respectueux jamais pleurnichard, images concrètes de sa vraie vie, zéro cliché, vers chantables de 8-10 syllabes, rimes, le prénom apparaît au moins 2 fois.';
      var r = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', messages: [{ role: 'user', content: p }], temperature: 0.85 })
      });
      if (!r.ok) throw new Error('Service IA momentanément indisponible (' + r.status + ').');
      var d = await r.json();
      var raw = ((d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '').replace(/```json|```/g, '').trim();
      var a = raw.indexOf('{'), b = raw.lastIndexOf('}');
      if (a < 0 || b < 0) throw new Error('Réponse illisible — relancez.');
      var o = JSON.parse(raw.slice(a, b + 1));
      return { title: o.title || ('Hommage à ' + brief.defunt), lyrics: (o.lyrics || '').replace(/\\n/g, '\n'), style_prompt: o.style_prompt || '' };
    },

    /* ═══ Composition musicale via l'API Mureka ═══
       Le circuit passe par nos fonctions serveur : la cle n'atteint
       jamais le navigateur. */

    /** Verifie si la composition automatique est branchee cote serveur */
    async musicConfig() {
      try {
        var r = await fetch('/api/music-config');
        if (!r.ok) return { configured: false };
        return await r.json();
      } catch (e) { return { configured: false, offline: true }; }
    },

    /** Lance une composition. Renvoie { taskId }. */
    async music(payload) {
      var r = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title || 'Hommage Melodia',
          lyrics: payload.lyrics || '',
          style_prompt: payload.style_prompt || '',
          instrumental: !!payload.instrumental,
          negative_tags: payload.negative_tags || '',
          vocal_gender: payload.vocal_gender || ''
        })
      });
      var d = null;
      try { d = await r.json(); } catch (e) { d = {}; }
      if (!r.ok) {
        var err = new Error(d.error || 'La composition n\'a pas pu demarrer.');
        err.code = d.code;
        err.hint = d.hint;
        throw err;
      }
      return d;
    },

    /** Etat d'une composition en cours (kind : 'song' ou 'instrumental') */
    async musicStatus(taskId, kind) {
      var r = await fetch('/api/music-status?taskId=' + encodeURIComponent(taskId)
        + '&kind=' + encodeURIComponent(kind || 'song'));
      var d = null;
      try { d = await r.json(); } catch (e) { d = {}; }
      if (!r.ok) throw new Error(d.error || 'Suivi indisponible.');
      return d;
    },

    /**
     * Interroge le service jusqu'a obtention des titres.
     * onTick(etat) est appele a chaque passage pour l'affichage.
     * Mureka met typiquement 30 a 120 secondes.
     */
    async musicPoll(taskId, onTick, options) {
      var opt = options || {};
      var intervalle = opt.interval || 5000;
      var limite = opt.timeout || 420000;      /* 7 minutes */
      var debut = Date.now();
      var echecsReseau = 0;

      while (Date.now() - debut < limite) {
        if (opt.signal && opt.signal.aborted) throw new Error('Composition interrompue.');
        var etat;
        try {
          etat = await this.musicStatus(taskId, opt.kind);
          echecsReseau = 0;
        } catch (e) {
          /* Une coupure passagere ne doit pas annuler une composition en cours */
          if (++echecsReseau >= 4) throw e;
          await new Promise(function (r) { setTimeout(r, intervalle); });
          continue;
        }
        etat.elapsed = Math.round((Date.now() - debut) / 1000);
        if (onTick) onTick(etat);
        if (etat.failed) { var er = new Error(etat.error || 'La composition a echoue.'); er.failed = true; throw er; }
        if (etat.done) return etat;
        await new Promise(function (r) { setTimeout(r, intervalle); });
      }
      throw new Error('La composition depasse le delai attendu. Le titre peut encore arriver : rouvrez l\'atelier dans quelques minutes.');
    },

    /**
     * Mode manuel : le brief est copie dans le presse-papiers et Suno
     * s'ouvre. C'est le circuit courant, tant que la composition n'est
     * pas automatisee.
     */
    manualExport(title, lyrics, style) {
      var t = 'TITRE\n' + title
        + '\n\nSTYLE OF MUSIC (a coller dans le champ Style)\n' + style
        + '\n\nLYRICS (a coller dans le champ Lyrics, mode Custom)\n' + lyrics;
      var ouvrir = function () { window.open('https://suno.com/create', '_blank', 'noopener'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(t).then(ouvrir, ouvrir);
      }
      ouvrir();
      return Promise.resolve();
    }
  };
})();
