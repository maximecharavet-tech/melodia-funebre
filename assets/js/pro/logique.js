// ═══════════════════════════════════════════════════════════════
// Logique pure de la console (aucun accès au DOM, aucune E/S) : filtres,
// tris, statistiques, notifications, étapes d'accueil, export CSV, modèle
// de dossier. Séparée de l'interface pour être testée à part
// (tests/pro/console.test.mjs).
//
// Les chiffres produits ici sont toujours calculés sur les dossiers reçus ;
// rien n'est estimé ni inventé.
// ═══════════════════════════════════════════════════════════════

/** Minuscules sans accents : « Éléonore » est trouvée par « eleonore ». */
export function normaliser(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export const EN_COURS = ['paye', 'essai_accorde', 'paroles_en_cours', 'musique_en_cours', 'controle_maison'];
export const A_TRAITER = ['paroles_a_valider', 'complet', 'en_attente_paiement'];
export const CLOS = ['annule', 'rembourse'];

/** Groupes de filtres rapides du tableau de bord (puces avec compteur). */
export const GROUPES = [
  { id: 'tous', libelle: 'Tous', etats: null },
  { id: 'a_traiter', libelle: 'À traiter', etats: A_TRAITER.concat(['revision_demandee']) },
  { id: 'en_cours', libelle: 'En composition', etats: EN_COURS.concat(['echec']) },
  { id: 'livres', libelle: 'Livrés', etats: ['livre'] },
  { id: 'brouillons', libelle: 'Brouillons', etats: ['brouillon'] },
  { id: 'clos', libelle: 'Clos', etats: CLOS }
];

export function compterGroupes(dossiers) {
  const r = {};
  for (const g of GROUPES) r[g.id] = g.etats ? dossiers.filter((d) => g.etats.includes(d.status)).length : dossiers.length;
  return r;
}

const TRIS = {
  recent: (a, b) => (a.updated_at < b.updated_at ? 1 : -1),
  ceremonie: (a, b) => {
    // les cérémonies les plus proches d'abord ; sans date, à la fin
    const x = a.ceremonie_le ? Date.parse(a.ceremonie_le) : Infinity;
    const y = b.ceremonie_le ? Date.parse(b.ceremonie_le) : Infinity;
    return x === y ? 0 : x < y ? -1 : 1;
  },
  prenom: (a, b) => normaliser(a.prenom).localeCompare(normaliser(b.prenom), 'fr'),
  etat: (a, b) => String(a.status).localeCompare(String(b.status))
};
export const CLES_TRI = Object.keys(TRIS);

/**
 * Filtre et trie. options : { q, groupe, statut, du, au, tri, sens }.
 * `du`/`au` : bornes (AAAA-MM-JJ) sur la date de cérémonie.
 */
export function filtrerDossiers(dossiers, o = {}) {
  const n = normaliser(o.q);
  const groupe = GROUPES.find((g) => g.id === o.groupe);
  const du = o.du ? Date.parse(o.du + 'T00:00:00') : null;
  const au = o.au ? Date.parse(o.au + 'T23:59:59') : null;
  const liste = dossiers.filter((d) => {
    if (groupe && groupe.etats && !groupe.etats.includes(d.status)) return false;
    if (o.statut && d.status !== o.statut) return false;
    if (o.sous48h) {
      const c = d.ceremonie_le ? Date.parse(d.ceremonie_le) : NaN;
      const now = o.maintenant || Date.now();
      if (!(c - now < 48 * 3600e3 && c > now - 6 * 3600e3) || CLOS.includes(d.status)) return false;
    }
    if (n && !(normaliser(d.prenom).includes(n) || normaliser(d.reference).includes(n) || normaliser(d.titre).includes(n))) return false;
    if (du || au) {
      if (!d.ceremonie_le) return false;
      const c = Date.parse(d.ceremonie_le);
      if (du && c < du) return false;
      if (au && c > au) return false;
    }
    return true;
  });
  liste.sort(TRIS[o.tri] || TRIS.recent);
  if (o.sens === 'desc' && o.tri && o.tri !== 'recent') liste.reverse();
  return liste;
}

/** Neutralise l'injection de formules dans un tableur. */
export function celluleCsv(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** CSV des dossiers (séparateur « ; », BOM UTF-8 pour Excel). */
export function dossiersEnCsv(dossiers, libelleStatut = (s) => s) {
  const date = (v) => (v ? String(v).slice(0, 10) : '');
  const lignes = [['Référence', 'Pour', 'Titre', 'État', 'Mode', 'Cérémonie', 'Chanson attendue le', 'Ouvert le', 'Modifié le']];
  for (const d of dossiers) {
    lignes.push([d.reference, d.prenom, d.titre, libelleStatut(d.status), d.mode || '', date(d.ceremonie_le), date(d.date_limite), date(d.created_at), date(d.updated_at)]);
  }
  return '﻿' + lignes.map((l) => l.map(celluleCsv).join(';')).join('\r\n') + '\r\n';
}

/** Mois « AAAA-MM » (UTC) avant `d`, n mois en arrière, du plus ancien au plus récent. */
export function derniersMois(n, d = new Date()) {
  const r = [];
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    r.push(x.getUTCFullYear() + '-' + String(x.getUTCMonth() + 1).padStart(2, '0'));
  }
  return r;
}

/** Statistiques de l'agence, calculées sur les dossiers fournis. */
export function statistiques(dossiers, maintenant = new Date()) {
  const actifs = dossiers.filter((d) => !CLOS.includes(d.status));
  const mois = derniersMois(6, maintenant).map((m) => ({
    mois: m,
    ouverts: dossiers.filter((d) => String(d.created_at).slice(0, 7) === m).length,
    livres: dossiers.filter((d) => d.status === 'livre' && String(d.updated_at).slice(0, 7) === m).length
  }));
  const parGroupe = compterGroupes(dossiers);
  const livres = dossiers.filter((d) => d.status === 'livre');
  const lances = dossiers.filter((d) => !['brouillon', 'complet', 'en_attente_paiement', 'annule'].includes(d.status));
  // Délai « ouverture → livraison » : seulement pour les dossiers livrés, en jours entiers.
  const delais = livres.map((d) => (Date.parse(d.updated_at) - Date.parse(d.created_at)) / 864e5).filter((x) => x >= 0 && isFinite(x)).sort((a, b) => a - b);
  const mediane = delais.length ? delais[Math.floor((delais.length - 1) / 2)] : null;
  const t0 = maintenant.getTime();
  const ceremoniesAVenir = actifs.filter((d) => d.ceremonie_le && Date.parse(d.ceremonie_le) >= t0).length;
  return {
    total: dossiers.length,
    actifs: actifs.length,
    livres: livres.length,
    essais: dossiers.filter((d) => d.mode === 'essai').length,
    payes: dossiers.filter((d) => d.mode === 'payant' && !['brouillon', 'complet'].includes(d.status)).length,
    tauxLivraison: lances.length ? Math.round((livres.length / lances.length) * 100) : null,
    delaiMedianJours: mediane == null ? null : Math.round(mediane * 10) / 10,
    ceremoniesAVenir,
    parGroupe,
    mois
  };
}

/** Étapes d'avancement d'un dossier (frise de la fiche). */
export const ETAPES = ['Questionnaire', 'Règlement', 'Paroles', 'Composition', 'Écoute maison', 'Livré'];

const POSITION = {
  brouillon: 0, complet: 0, en_attente_paiement: 1, paye: 2, essai_accorde: 2, paroles_en_cours: 2,
  paroles_a_valider: 2, musique_en_cours: 3, controle_maison: 4, echec: 4, livre: 5, revision_demandee: 5
};

/** { index, termine } : l'étape en cours (0‑5) ; null pour un dossier clos. */
export function positionDossier(statut) {
  if (CLOS.includes(statut)) return null;
  const i = POSITION[statut];
  if (i == null) return { index: 0, termine: false };
  return { index: i, termine: statut === 'livre' };
}

/** Quelle étape attend un geste de l'agence ? (pour la mise en avant de la frise) */
export function attendGeste(statut) { return ['brouillon', 'complet', 'en_attente_paiement', 'paroles_a_valider'].includes(statut); }

/**
 * Notifications dérivées de l'état réel des dossiers (aucune n'est inventée).
 * Rend [{ id, genre, dossier, texte, quand }], les plus récentes d'abord.
 * L'identifiant change quand l'état change : une notification déjà lue ne
 * revient pas, une nouvelle étape en crée une nouvelle.
 */
export function notificationsDepuis(dossiers, maintenant = Date.now()) {
  const n = [];
  for (const d of dossiers) {
    const nom = d.prenom || 'Dossier sans prénom';
    const base = { dossier: d.id, quand: d.updated_at };
    if (d.status === 'paroles_a_valider') n.push({ ...base, id: d.id + ':paroles', genre: 'action', texte: `Les paroles pour ${nom} attendent votre relecture.` });
    else if (d.status === 'livre') n.push({ ...base, id: d.id + ':livre', genre: 'ok', texte: `La chanson pour ${nom} est livrée.` });
    else if (d.status === 'echec') n.push({ ...base, id: d.id + ':echec', genre: 'info', texte: `La maison a repris le dossier de ${nom}. Rien à faire de votre côté.` });
    else if (d.status === 'en_attente_paiement') n.push({ ...base, id: d.id + ':paiement', genre: 'action', texte: `Le paiement du dossier de ${nom} n’est pas confirmé.` });
    if (d.ceremonie_le && !CLOS.includes(d.status) && d.status !== 'livre') {
      const dt = Date.parse(d.ceremonie_le) - maintenant;
      if (dt > 0 && dt < 48 * 3600e3) n.push({ id: d.id + ':ceremonie:' + String(d.ceremonie_le).slice(0, 10), genre: 'urgent', dossier: d.id, quand: d.ceremonie_le, texte: `Cérémonie de ${nom} dans moins de 48 h, la chanson n’est pas encore livrée.` });
    }
  }
  const rang = { urgent: 0, action: 1, info: 2, ok: 3 };
  return n.sort((a, b) => (rang[a.genre] - rang[b.genre]) || (a.quand < b.quand ? 1 : -1));
}

/**
 * Étapes de la prise en main, déduites de ce que l'agence a vraiment fait.
 * `etat` : { logo, dossiers, qrCrees, equipe }.
 */
export function etapesAccueil(etat) {
  const d = etat.dossiers || [];
  const reels = d.filter((x) => !x.exemple);
  const base = reels.length ? reels : d;
  return [
    { id: 'logo', libelle: 'Déposer le logo de votre agence', lien: '#/parametres', fait: !!etat.logo },
    { id: 'dossier', libelle: 'Ouvrir un premier dossier', lien: '#/nouveau', fait: reels.length > 0 },
    { id: 'livre', libelle: 'Recevoir une première chanson livrée', lien: '#/dossiers', fait: base.some((x) => x.status === 'livre') },
    { id: 'qr', libelle: 'Préparer un QR code pour la famille', lien: '#/qr', fait: !!etat.qrCrees },
    { id: 'equipe', libelle: 'Inviter un collègue', lien: '#/equipe', fait: (etat.equipe || 0) > 1 }
  ];
}

/**
 * Modèle pour un nouveau dossier à partir d'un existant : on garde ce qui
 * relève de l'agence et du style (musique, rite, mode, consentements), on
 * n'emporte RIEN de la personne (identité, vie, message, dates, lieux).
 */
export function modeleDepuis(donnees) {
  const q = donnees || {};
  const copie = (o) => JSON.parse(JSON.stringify(o || {}));
  const musique = copie(q.musique);
  return {
    defunt: {}, vie: { traits: [] },
    musique,
    ceremonie: q.ceremonie && q.ceremonie.rite ? { rite: q.ceremonie.rite } : {},
    message: {},
    consentements: {},
    offre: q.offre && q.offre.mode ? { mode: q.offre.mode } : {}
  };
}

// ─── Couleur d'accent de l'agence (marque blanche) ──────────────────

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const c = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contraste(a, b) {
  const x = luminance(a), y = luminance(b);
  if (x == null || y == null) return 0;
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}

/** Un accent est utilisable s'il se lit (≥ 4,5:1) sur le fond sombre ET sur le fond clair. */
export function accentValide(hex, fondSombre = '#0b0b11', fondClair = '#f4f1ea') {
  return contraste(hex, fondSombre) >= 4.5 || contraste(hex, fondClair) >= 4.5;
}

/** Accent lisible sur un fond donné (≥ 4,5:1), sinon null. */
export function accentPour(hex, fond) { return contraste(hex, fond) >= 4.5 ? hex : null; }

export function formaterDuree(s) {
  if (s == null || !isFinite(s)) return '';
  const m = Math.floor(s / 60);
  return m + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}

/**
 * Réduit des échantillons audio à `n` barres normalisées [0‑1] : valeur efficace
 * (RMS) par tranche — elle suit le volume perçu, là où le maximum reste plat sur
 * une musique masterisée — puis normalisation sur le 98e percentile (un pic isolé
 * n'écrase pas le reste).
 */
export function barresDepuis(echantillons, n) {
  const len = echantillons.length;
  if (!len || n < 1) return [];
  const pas = len / n;
  const brut = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * pas), b = Math.max(a + 1, Math.floor((i + 1) * pas));
    let somme = 0, c = 0;
    for (let j = a; j < b && j < len; j++) { somme += echantillons[j] * echantillons[j]; c++; }
    brut.push(c ? Math.sqrt(somme / c) : 0);
  }
  const tri = brut.slice().sort((x, y) => x - y);
  const ref = tri[Math.min(tri.length - 1, Math.floor(tri.length * 0.98))] || tri[tri.length - 1] || 1;
  return brut.map((v) => Math.min(1, v / ref));
}
