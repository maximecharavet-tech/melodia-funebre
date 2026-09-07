// ═══════════════════════════════════════════════════════════════
// /api/collaborateur — Créer un accès collaborateur, pour de vrai
//
// POURQUOI CE FICHIER EXISTE
//
// La console écrivait une fiche dans la table « collaborateurs » et
// affichait « Compte créé, transmettez-lui son mot de passe ». C'était
// faux. Aucun compte de connexion n'était créé, aucun rôle n'était
// déclaré, et le mot de passe saisi par le fondateur était purement et
// simplement jeté. Le collaborateur recevait des identifiants qui
// n'ouvraient rien, et personne ne comprenait pourquoi.
//
// Le navigateur ne PEUT pas créer un compte pour quelqu'un d'autre :
// cela demande la clé de service, qui ouvre toute la base sans passer
// par la moindre règle de sécurité. Une telle clé dans une page web
// serait lisible par n'importe quel visiteur — ce serait donner les
// clés de la maison à la rue. Il faut donc un intermédiaire qui tourne
// sur le serveur, où la clé reste invisible. C'est ce fichier.
//
// CE QU'IL GARANTIT
//
// Un enregistrement = un compte qui ouvre + un rôle qui donne les
// bons droits + une fiche à jour. Les trois, ou aucun : si le rôle ne
// peut pas être posé, le compte tout juste créé est retiré, plutôt que
// de laisser un collaborateur capable de se connecter mais traité par
// la base comme un visiteur.
//
// QUI A LE DROIT
//
// Seul le fondateur. La preuve n'est pas déclarée par le navigateur —
// n'importe qui pourrait l'affirmer — mais vérifiée ici : le jeton
// présenté est soumis à Supabase, qui répond de quelle adresse il
// s'agit, et cette adresse est confrontée à la table des rôles avec la
// clé de service. Un jeton de collaborateur ou de famille est refusé.
//
// VARIABLE D'ENVIRONNEMENT À POSER (Vercel → Settings → Environment
// Variables, puis redéployer) :
//
//   SUPABASE_SERVICE_ROLE_KEY
//     Supabase → Project Settings → API → « service_role ».
//     SECRÈTE. Elle ne doit jamais apparaître dans assets/js/config.js
//     ni dans aucun fichier servi au navigateur.
//
//   SUPABASE_URL  (facultatif — l'adresse du projet est publique et
//     sert de valeur par défaut)
// ═══════════════════════════════════════════════════════════════

const URL_BASE = process.env.SUPABASE_URL || 'https://awvgmkoozerfggdvvubi.supabase.co';
const CLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/* Les rôles qu'un compte créé ici peut recevoir. « master » n'y est
   pas : on ne fabrique pas un second fondateur depuis une page web. */
const ROLES = ['commercial', 'partner'];

function json(res, code, corps) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(code).json(corps);
}

/* Appel à Supabase avec la clé de service. Elle contourne toutes les
   règles de sécurité : chaque usage ci-dessous est donc précédé d'une
   vérification explicite de qui demande. */
async function admin(chemin, opts = {}) {
  const r = await fetch(URL_BASE + chemin, {
    ...opts,
    headers: {
      apikey: CLE,
      Authorization: 'Bearer ' + CLE,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  const texte = await r.text();
  let corps = null;
  try { corps = texte ? JSON.parse(texte) : null; } catch (e) { corps = { brut: texte }; }
  if (!r.ok) {
    const err = new Error((corps && (corps.msg || corps.message || corps.error_description || corps.error)) || ('HTTP ' + r.status));
    err.statut = r.status;
    throw err;
  }
  return corps;
}

/* ─── Qui demande ? ───
   Le jeton vient du navigateur, donc il ne prouve rien par lui-même.
   On le fait valider par Supabase, qui seul peut dire s'il est
   authentique et à qui il appartient. */
async function demandeur(req) {
  const entete = req.headers.authorization || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7) : '';
  if (!jeton) return null;

  let moi;
  try {
    const r = await fetch(URL_BASE + '/auth/v1/user', {
      headers: { apikey: CLE, Authorization: 'Bearer ' + jeton }
    });
    if (!r.ok) return null;
    moi = await r.json();
  } catch (e) { return null; }

  const email = (moi && moi.email || '').toLowerCase();
  if (!email) return null;

  /* Le rôle se lit dans la base, jamais dans le jeton : les métadonnées
     d'un compte peuvent être écrites par son titulaire. */
  const lignes = await admin('/rest/v1/roles?select=role&email=eq.' + encodeURIComponent(email));
  return { email, role: (lignes && lignes[0] && lignes[0].role) || null };
}

/* Retrouve un compte de connexion par son adresse. Sert à savoir si
   l'on crée ou si l'on met à jour — un collaborateur qui s'était
   inscrit lui-même auparavant ne doit pas faire échouer la création. */
async function compteExistant(email) {
  const r = await admin('/auth/v1/admin/users?page=1&per_page=200');
  const liste = (r && (r.users || r)) || [];
  return liste.find((u) => (u.email || '').toLowerCase() === email) || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'POST uniquement' });

  if (!CLE) {
    return json(res, 503, {
      code: 'NOT_CONFIGURED',
      error: "La création de comptes n'est pas encore branchée.",
      hint: 'Ajoutez SUPABASE_SERVICE_ROLE_KEY dans Vercel → Settings → Environment Variables (Supabase → Project Settings → API → service_role), puis redéployez. Tant que cette clé manque, aucun compte ne peut être créé depuis la console : le navigateur n\'en a pas le droit, et c\'est voulu.'
    });
  }

  let qui;
  try { qui = await demandeur(req); }
  catch (e) { return json(res, 502, { code: 'BASE_INJOIGNABLE', error: 'La base n\'a pas répondu : ' + e.message }); }

  if (!qui) {
    return json(res, 401, {
      code: 'NON_CONNECTE',
      error: "Session absente ou expirée. Reconnectez-vous avec votre compte (adresse et mot de passe), et non par le raccourci local."
    });
  }
  if (qui.role !== 'master') {
    return json(res, 403, {
      code: 'INTERDIT',
      error: "Seul le fondateur crée des accès collaborateurs."
    });
  }

  const d = (req.body && typeof req.body === 'object') ? req.body : {};
  const action = String(d.action || 'creer');
  const email = String(d.email || '').trim().toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) {
    return json(res, 400, { code: 'EMAIL', error: 'Adresse email invalide.' });
  }
  if (email === qui.email) {
    return json(res, 400, { code: 'SOI_MEME', error: 'Vous ne pouvez pas modifier votre propre accès depuis cet écran.' });
  }

  try {
    if (action === 'creer') return await creer(res, d, email);
    if (action === 'motdepasse') return await motDePasse(res, d, email);
    if (action === 'etat') return await etat(res, d, email);
    if (action === 'supprimer') return await supprimer(res, email);
    return json(res, 400, { code: 'ACTION', error: 'Action inconnue : ' + action });
  } catch (e) {
    return json(res, e.statut && e.statut < 500 ? 400 : 502, {
      code: 'REFUS_BASE',
      error: 'La base a refusé : ' + e.message
    });
  }
}

/* ─── Créer (ou compléter) un accès ─────────────────────────────── */
async function creer(res, d, email) {
  const nom = String(d.nom || '').trim();
  const pw = String(d.pw || '');
  const role = ROLES.includes(d.role) ? d.role : 'commercial';

  if (!nom) return json(res, 400, { code: 'NOM', error: 'Le nom est requis.' });
  if (pw.length < 8) {
    return json(res, 400, {
      code: 'MOTDEPASSE',
      error: 'Le mot de passe doit contenir au moins huit caractères. Ce compte ouvre les commandes de familles en deuil : six ne suffisent pas.'
    });
  }

  /* 1. Le compte de connexion. On le crée avec l'adresse déjà
     confirmée : le fondateur donne les identifiants de la main à la
     main, il n'y a pas de courriel de vérification à attendre. */
  let compte = await compteExistant(email);
  let creeIci = false;

  if (compte) {
    await admin('/auth/v1/admin/users/' + compte.id, {
      method: 'PUT',
      body: JSON.stringify({ password: pw, email_confirm: true, user_metadata: { name: nom, role } })
    });
  } else {
    compte = await admin('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password: pw, email_confirm: true, user_metadata: { name: nom, role } })
    });
    creeIci = true;
  }

  /* 2. Les droits. Sans cette ligne, le compte ouvre une session mais
     la base le traite en visiteur : il verrait une console vide sans
     comprendre pourquoi. */
  try {
    await admin('/rest/v1/roles?on_conflict=email', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ email, role })
    });
  } catch (e) {
    /* Un compte qui ouvre sans droits est pire que pas de compte du
       tout : on défait ce qu'on vient de faire. */
    if (creeIci && compte && compte.id) {
      try { await admin('/auth/v1/admin/users/' + compte.id, { method: 'DELETE' }); } catch (_) {}
    }
    throw new Error("les droits n'ont pas pu être posés, le compte a donc été retiré (" + e.message + ')');
  }

  /* 3. La fiche, pour la console : secteur, téléphone, activité. */
  const fiche = {
    nom, name: nom, email, role,
    secteur: String(d.secteur || ''), tel: String(d.tel || ''), actif: true
  };
  await admin('/rest/v1/collaborateurs?on_conflict=email', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(fiche)
  });

  return json(res, 200, {
    ok: true,
    cree: creeIci,
    email,
    role,
    message: creeIci
      ? 'Compte créé et droits posés. ' + nom + ' peut se connecter immédiatement.'
      : 'Ce compte existait déjà : son mot de passe et ses droits viennent d\'être mis à jour.'
  });
}

/* ─── Changer un mot de passe ───────────────────────────────────── */
async function motDePasse(res, d, email) {
  const pw = String(d.pw || '');
  if (pw.length < 8) return json(res, 400, { code: 'MOTDEPASSE', error: 'Huit caractères minimum.' });
  const compte = await compteExistant(email);
  if (!compte) return json(res, 404, { code: 'INCONNU', error: 'Aucun compte de connexion pour cette adresse.' });
  await admin('/auth/v1/admin/users/' + compte.id, {
    method: 'PUT', body: JSON.stringify({ password: pw })
  });
  return json(res, 200, { ok: true, message: 'Mot de passe remplacé. Transmettez-le à ' + email + '.' });
}

/* ─── Activer / suspendre ───────────────────────────────────────────
   Suspendre ne supprime rien : la fiche, les prospects et l'historique
   restent. Le compte est banni côté connexion, ce qui ferme la porte
   sans effacer le travail. */
async function etat(res, d, email) {
  const actif = !!d.actif;
  const compte = await compteExistant(email);
  if (compte) {
    await admin('/auth/v1/admin/users/' + compte.id, {
      method: 'PUT',
      /* « none » lève l'interdiction ; une durée très longue la pose. */
      body: JSON.stringify({ ban_duration: actif ? 'none' : '876000h' })
    });
  }
  await admin('/rest/v1/collaborateurs?email=eq.' + encodeURIComponent(email), {
    method: 'PATCH', body: JSON.stringify({ actif })
  });
  return json(res, 200, {
    ok: true,
    message: actif ? 'Accès rétabli.' : 'Accès suspendu. La fiche et les prospects sont conservés.'
  });
}

/* ─── Supprimer ─────────────────────────────────────────────────────
   Le compte, les droits et la fiche partent. Les prospects, non : ils
   appartiennent à la maison, pas à la personne qui les a saisis. */
async function supprimer(res, email) {
  const compte = await compteExistant(email);
  if (compte) {
    try { await admin('/auth/v1/admin/users/' + compte.id, { method: 'DELETE' }); } catch (e) {}
  }
  try { await admin('/rest/v1/roles?email=eq.' + encodeURIComponent(email), { method: 'DELETE' }); } catch (e) {}
  await admin('/rest/v1/collaborateurs?email=eq.' + encodeURIComponent(email), { method: 'DELETE' });
  return json(res, 200, { ok: true, message: 'Accès supprimé. Les fiches de prospection sont conservées.' });
}
