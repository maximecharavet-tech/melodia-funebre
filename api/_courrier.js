// ═══════════════════════════════════════════════════════════════
// api/_courrier.js — Le socle commun de tous les envois
//
// Le gabarit HTML et l'appel à Resend étaient recopiés dans chaque
// fonction : une correction d'en-tête devait être faite deux fois, et
// une seule des deux la recevait. Tout passe désormais par ici.
//
// Le préfixe « _ » est significatif : Vercel n'expose pas comme route
// les fichiers d'/api qui commencent par un souligné. Ce module est
// donc importable, mais jamais appelable de l'extérieur.
//
// ─── LES DEUX DOMAINES D'ENVOI ───
// Un courriel de prospection qu'une agence signale comme indésirable
// abîme la réputation du domaine qui l'a envoyé. Si ce domaine est
// aussi celui qui porte les livraisons, c'est l'hommage d'une famille
// endeuillée qui finit dans les indésirables — pour une cause qui n'a
// rien à voir avec elle. D'où deux sous-domaines distincts :
//
//   COURRIER_FROM    envoi.melodia-funebre.fr    familles, agences
//   PROSPECT_FROM    contact.melodia-funebre.fr  démarchage à froid
//
// Tant que ces variables ne sont pas renseignées, tout retombe sur
// LEAD_FROM : le site continue de fonctionner, sans cloisonnement.
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_MS = 15000;

export const SITE = (process.env.SITE_URL || 'https://melodia-funebre.fr').replace(/\/+$/, '');

/** Expéditeur des courriels transactionnels (famille, agence, maison) */
export function expediteurCourrier() {
  return process.env.COURRIER_FROM || process.env.LEAD_FROM || null;
}

/** Expéditeur du démarchage à froid — jamais le même que ci-dessus */
export function expediteurProspection() {
  return process.env.PROSPECT_FROM || process.env.LEAD_FROM || null;
}

/** Boîte de la maison : ce qui doit atterrir chez le fondateur */
export function boiteMaison() {
  return String(process.env.LEAD_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function echapper(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function valideEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
}

/* ─── La carte de visite ───
   Le démarchage partait signé d'un nom et d'une adresse sur deux
   lignes grises : rien qui ressemble à une maison. La signature est
   désormais une carte, sur le modèle de celle de l'équipe — fond nuit,
   or, logo, nom, fonction, devise, portrait.

   Tout en tableaux et en styles en ligne : c'est le seul HTML qu'Outlook
   rende fidèlement. Le portrait n'est accepté que s'il est hébergé sur le
   site (assets/img/) : une adresse d'image fournie par le navigateur
   pourrait sinon pointer n'importe où, y compris vers un pisteur. */
const PILIERS = ['Hommage sur mesure', 'Livré en 24 h', 'Sans droits SACEM', '60 % pour l’agence'];

export function photoAutorisee(chemin) {
  const c = String(chemin || '').trim();
  return /^\/assets\/img\/[a-z0-9/_-]+\.(jpe?g|png|webp)$/i.test(c) ? SITE + c : '';
}

export function carteVisite(sig) {
  const nom = String(sig.nom || 'Melodia Funèbre').trim();
  const mots = nom.split(/\s+/);
  const nomFamille = mots.length > 1 ? mots.pop() : '';
  const prenom = mots.join(' ');
  const photo = photoAutorisee(sig.photo);
  const tel = String(sig.tel || '').replace(/[^\d+ .()-]/g, '').slice(0, 24).trim();
  const or = '#d9b862';
  const ligne = (contenu) => '<tr><td style="padding:3px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#ece6d6;">' + contenu + '</td></tr>';

  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0b0b11" ' +
      'style="background:#0b0b11;border:1px solid #6b5a2a;border-radius:6px;">' +
    '<tr>' +
      '<td class="mf-carte-g" style="padding:22px 20px 16px 24px;vertical-align:top;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
          '<td style="vertical-align:middle;"><img src="' + SITE + '/assets/img/logo-melodia.jpg" width="44" height="44" alt="" ' +
            'style="display:block;border-radius:50%;border:1px solid #6b5a2a;"></td>' +
          '<td style="vertical-align:middle;padding-left:10px;">' +
            '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:15px;letter-spacing:3px;color:' + or + ';line-height:1.1;">MELODIA</div>' +
            '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:11px;letter-spacing:3.5px;color:#e8dcb4;line-height:1.3;">FUNÈBRE</div>' +
            '<div style="font-family:Helvetica,Arial,sans-serif;font-size:8px;letter-spacing:2px;color:#a89a74;margin-top:2px;">DES HOMMAGES EN MUSIQUE</div>' +
          '</td></tr></table>' +
        '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:24px;letter-spacing:1.5px;line-height:1.15;margin-top:16px;text-transform:uppercase;">' +
          '<span style="color:#f6f2e8;">' + echapper(prenom || nomFamille) + '</span>' +
          (prenom && nomFamille ? ' <span style="color:' + or + ';">' + echapper(nomFamille) + '</span>' : '') + '</div>' +
        (sig.role ? '<div style="font-family:Helvetica,Arial,sans-serif;font-size:10.5px;letter-spacing:2.4px;text-transform:uppercase;color:#d8d0bc;margin-top:6px;line-height:1.5;">' + echapper(sig.role) + '</div>' : '') +
        '<div style="width:110px;height:1px;background:' + or + ';margin:12px 0 10px;font-size:0;line-height:0;">&nbsp;</div>' +
        '<table role="presentation" cellpadding="0" cellspacing="0">' +
          (sig.email ? ligne('<span style="color:' + or + ';">&#9993;</span>&nbsp; <a href="mailto:' + echapper(sig.email) + '" style="color:#ece6d6;text-decoration:none;">' + echapper(sig.email) + '</a>') : '') +
          (tel ? ligne('<span style="color:' + or + ';">&#9742;</span>&nbsp; <a href="tel:' + echapper(tel.replace(/[^\d+]/g, '')) + '" style="color:#ece6d6;text-decoration:none;">' + echapper(tel) + '</a>') : '') +
          ligne('<span style="color:' + or + ';">&#9670;</span>&nbsp; <a href="' + SITE + '" style="color:#ece6d6;text-decoration:none;">melodia-funebre.fr</a>') +
        '</table>' +
        '<div style="font-family:Georgia,\'Times New Roman\',serif;font-style:italic;font-size:17px;color:' + or + ';margin-top:12px;">Des émotions qui rassemblent.</div>' +
      '</td>' +
      (photo
        ? '<td class="mf-carte-d" width="150" style="width:150px;padding:22px 22px 16px 0;vertical-align:middle;text-align:right;">' +
            '<img src="' + echapper(photo) + '" width="128" height="128" alt="' + echapper(nom) + '" ' +
            'style="display:inline-block;width:128px;height:128px;border-radius:50%;border:2px solid ' + or + ';object-fit:cover;"></td>'
        : '') +
    '</tr>' +
    '<tr><td colspan="' + (photo ? 2 : 1) + '" style="border-top:1px solid #3a321c;padding:10px 12px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
        PILIERS.map((t, i) => '<td align="center" style="width:25%;padding:4px 6px;font-family:Helvetica,Arial,sans-serif;font-size:9.5px;letter-spacing:1.2px;' +
          'text-transform:uppercase;color:#d8cfb6;line-height:1.4;' + (i ? 'border-left:1px solid #4a3f22;' : '') + '">' + t + '</td>').join('') +
      '</tr></table></td></tr>' +
  '</table>';
}

/* ─── Gabarit ───
   Fond ivoire et non fond sombre : la charte du site ne survit pas aux
   clients de messagerie, qui inversent les fonds noirs, rognent les
   dégradés et signalent volontiers les courriels très colorés. Tableaux
   et styles en ligne : c'est le seul HTML qu'Outlook rende fidèlement.

   o.pied : le bas de page. Le démarchage doit porter la mention
   d'opposition ; un courriel de livraison ne le doit pas — proposer
   « STOP » à une famille qui attend l'hommage de son père serait
   déplacé, et juridiquement inutile puisqu'il s'agit d'un message
   attaché à l'exécution du contrat. */
export function gabarit(o) {
  const corps = String(o.texte || '')
    .split(/\n{2,}/)
    .map((par) => {
      const t = par.trim();
      if (!t) return '';
      /* Une liste à puces reste une liste */
      if (/^[·•-]\s/m.test(t)) {
        const items = t.split('\n').map((l) => l.replace(/^[·•-]\s*/, '').trim()).filter(Boolean);
        return '<ul style="margin:0 0 18px;padding-left:20px;color:#3d3a33;font-size:15px;line-height:1.7;">' +
          items.map((i) => '<li style="margin-bottom:6px;">' + echapper(i) + '</li>').join('') + '</ul>';
      }
      return '<p style="margin:0 0 18px;color:#3d3a33;font-size:15px;line-height:1.7;">' +
        echapper(t).replace(/\n/g, '<br>') + '</p>';
    }).join('');

  const bouton = o.lienTexte && o.lienUrl
    ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 8px;">' +
      '<tr><td style="background:#c9a84c;border-radius:2px;">' +
      '<a href="' + echapper(o.lienUrl) + '" style="display:inline-block;padding:13px 26px;' +
      'font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;' +
      'color:#1a1408;text-decoration:none;font-weight:600;">' + echapper(o.lienTexte) + '</a>' +
      '</td></tr></table>'
    : '';

  /* Encadré de rappel : référence de commande, offre, prénom du défunt.
     Une famille qui écrit six mois plus tard n'a que ce courriel. */
  const fiche = Array.isArray(o.fiche) && o.fiche.length
    ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
      'style="margin:8px 0 22px;background:#faf8f3;border:1px solid #e8e3d6;">' +
      '<tr><td style="padding:16px 18px;font-family:Helvetica,Arial,sans-serif;font-size:13px;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">' +
      o.fiche.filter((l) => l && l[1]).map((l) =>
        '<tr><td style="padding:4px 14px 4px 0;color:#8b8474;white-space:nowrap;vertical-align:top;">' +
        echapper(l[0]) + '</td><td style="padding:4px 0;color:#17150f;font-weight:600;">' +
        echapper(l[1]) + '</td></tr>').join('') +
      '</table></td></tr></table>'
    : '';

  const pied = o.pied === 'prospection'
    ? 'Vous recevez ce message dans un cadre strictement professionnel, parce que votre ' +
      'établissement exerce dans les services funéraires. Pour ne plus être contacté, répondez ' +
      '<b style="color:#5c5749;">STOP</b> à ce courriel : votre adresse est retirée immédiatement et définitivement.'
    : 'Ce message vous est adressé au titre de la commande passée auprès de Melodia Funèbre. ' +
      'Vous pouvez répondre directement à ce courriel : il arrive dans notre boîte, une personne le lit.';

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${echapper(o.sujet || 'Melodia Funèbre')}</title>
<style>
@media (max-width:620px){
  /* Le cadre de 600 px ne rétrécissait pas : en tableaux, max-width est
     sans effet, et le courriel débordait l'écran d'un téléphone. */
  .mf-cadre{width:100%!important;}
}
@media (max-width:520px){
  .mf-carte-g,.mf-carte-d{display:block!important;width:100%!important;box-sizing:border-box;}
  .mf-carte-d{text-align:left!important;padding:0 24px 16px!important;}
  .mf-sig{padding:6px 12px 22px!important;}
}
</style></head>
<body style="margin:0;padding:0;background:#f4f1ea;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(o.apercu || '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" class="mf-cadre" width="600" cellpadding="0" cellspacing="0"
         style="width:600px;max-width:100%;background:#ffffff;border:1px solid #e2ddd0;">

    <!-- En-tête -->
    ${o.banniere ? `<tr><td bgcolor="#07070b" style="background:#07070b;padding:0;line-height:0;font-size:0;">
      <img src="${SITE}/assets/img/courriel/banniere.jpg" width="600" height="180"
           alt="Melodia Funèbre — Des hommages en musique"
           style="display:block;width:100%;max-width:600px;height:auto;border:0;color:#d9b862;font-family:Georgia,serif;font-size:20px;line-height:1.4;background:#07070b;">
    </td></tr>` : `<tr><td style="padding:30px 34px 22px;text-align:center;background:#0b0b11;">
      <img src="${SITE}/assets/img/logo-melodia.jpg" width="66" height="66" alt="Melodia Funèbre"
           style="display:block;margin:0 auto 12px;border-radius:50%;border:1px solid rgba(201,168,76,.4);">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#f2efe8;letter-spacing:.5px;">Melodia Funèbre</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3.4px;text-transform:uppercase;color:#97803c;margin-top:5px;">
        Composition musicale personnalisée
      </div>
    </td></tr>`}
    <tr><td style="height:3px;background:linear-gradient(90deg,#97803c,#e3c977,#97803c);font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Corps -->
    <tr><td style="padding:32px 34px 26px;font-family:Helvetica,Arial,sans-serif;">
      ${o.titre ? '<h1 style="margin:0 0 20px;font-family:Georgia,\'Times New Roman\',serif;font-weight:400;font-size:25px;line-height:1.3;color:#17150f;">' + echapper(o.titre) + '</h1>' : ''}
      ${corps}
      ${fiche}
      ${bouton}
    </td></tr>

    <!-- Signature -->
    ${o.signature ? `<tr><td class="mf-sig" style="padding:6px 26px 28px;">${carteVisite(o.signature)}</td></tr>` : `<tr><td style="padding:0 34px 30px;font-family:Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="border-top:1px solid #e2ddd0;padding-top:18px;">
        <tr><td style="padding-top:18px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#17150f;">${echapper(o.expediteurNom || 'Melodia Funèbre')}</div>
          ${o.expediteurRole ? '<div style="font-size:12px;color:#7d7663;margin-top:2px;">' + echapper(o.expediteurRole) + '</div>' : ''}
          <div style="font-size:12px;color:#7d7663;margin-top:8px;line-height:1.7;">
            ${o.expediteurEmail ? '<a href="mailto:' + echapper(o.expediteurEmail) + '" style="color:#97803c;text-decoration:none;">' + echapper(o.expediteurEmail) + '</a><br>' : ''}
            <a href="${SITE}" style="color:#97803c;text-decoration:none;">melodia-funebre.fr</a>
          </div>
        </td></tr>
      </table>
    </td></tr>`}

    <!-- Pied -->
    <tr><td style="padding:16px 34px 22px;background:#faf8f3;border-top:1px solid #e2ddd0;
                   font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#8b8474;">
      ${pied}
    </td></tr>

  </table>
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:#a49d8c;margin-top:14px;">
    Melodia Funèbre — Maison française de composition musicale pour cérémonies funéraires
  </div>
</td></tr>
</table>
</body></html>`;
}

/**
 * Remet la charge à Resend.
 * Renvoie { ok, id } ou { ok:false, status, code, error, motif } — jamais
 * d'exception : l'appelant décide quoi montrer, et un envoi raté ne doit
 * pas faire échouer l'action qui l'a déclenché (une commande enregistrée
 * reste enregistrée même si son accusé de réception se perd).
 */
export async function envoyer(charge) {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) return { ok: false, status: 503, code: 'NOT_CONFIGURED', error: 'RESEND_API_KEY absente.' };

  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: 'Bearer ' + cle, 'Content-Type': 'application/json' },
      body: JSON.stringify(charge)
    });
    const brut = await r.text();
    let data; try { data = JSON.parse(brut); } catch (e) { data = null; }

    if (!r.ok) {
      /* Le motif exact vaut mieux qu'un code : une adresse d'expédition
         non vérifiée chez Resend est la cause la plus fréquente. */
      return {
        ok: false,
        status: r.status === 429 ? 429 : (r.status === 401 || r.status === 403 ? r.status : 502),
        code: r.status === 401 || r.status === 403 ? 'BAD_KEY' : (r.status === 429 ? 'RATE_LIMIT' : 'SEND_FAILED'),
        error: 'Le service d\'envoi a répondu ' + r.status + '.',
        motif: (data && (data.message || data.name)) || brut.slice(0, 300)
      };
    }
    return { ok: true, id: (data && data.id) || null };
  } catch (err) {
    const coupe = err.name === 'AbortError';
    return {
      ok: false,
      status: coupe ? 504 : 500,
      code: coupe ? 'TIMEOUT' : 'FETCH_FAILED',
      error: coupe ? 'Le service d\'envoi n\'a pas répondu.' : 'Envoi impossible : ' + err.message
    };
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * Remet un lot de courriels à Resend en un seul appel (100 au plus).
 * Renvoie { ok, ids } ou { ok:false, ... } comme envoyer().
 */
export async function envoyerLot(charges) {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) return { ok: false, status: 503, code: 'NOT_CONFIGURED', error: 'RESEND_API_KEY absente.' };
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), TIMEOUT_MS * 2);
  try {
    const r = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST', signal: ctrl.signal,
      headers: { Authorization: 'Bearer ' + cle, 'Content-Type': 'application/json' },
      body: JSON.stringify(charges)
    });
    const brut = await r.text();
    let data; try { data = JSON.parse(brut); } catch (e) { data = null; }
    if (!r.ok) {
      return {
        ok: false,
        status: r.status === 429 ? 429 : (r.status === 401 || r.status === 403 ? r.status : 502),
        code: r.status === 401 || r.status === 403 ? 'BAD_KEY' : (r.status === 429 ? 'RATE_LIMIT' : 'SEND_FAILED'),
        error: 'Le service d\'envoi a répondu ' + r.status + '.',
        motif: (data && (data.message || data.name)) || brut.slice(0, 300)
      };
    }
    const liste = (data && (data.data || data)) || [];
    return { ok: true, ids: Array.isArray(liste) ? liste.map((x) => x && x.id) : [] };
  } catch (err) {
    const coupe = err.name === 'AbortError';
    return { ok: false, status: coupe ? 504 : 500, code: coupe ? 'TIMEOUT' : 'FETCH_FAILED',
             error: coupe ? 'Le service d\'envoi n\'a pas répondu.' : 'Envoi impossible : ' + err.message };
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * Le site est-il bien à l'origine de cet appel ?
 *
 * /api/famille écrit à une adresse fournie dans la requête : sans garde,
 * n'importe qui pourrait s'en servir pour expédier des courriels signés
 * Melodia. Le navigateur joint toujours un en-tête Origin à une requête
 * POST ; son absence trahit un appel fabriqué à la main.
 *
 * Ce n'est pas une authentification — un Origin se falsifie hors
 * navigateur. C'est la barrière proportionnée à un point d'entrée dont
 * le contenu est entièrement composé côté serveur : au pire, un abuseur
 * envoie à des tiers un accusé de réception Melodia, pas un message
 * de son choix.
 */
export function origineAutorisee(req) {
  const permis = [SITE, 'https://melodia-funebre.fr', 'https://www.melodia-funebre.fr'];
  if (process.env.VERCEL_URL) permis.push('https://' + process.env.VERCEL_URL);
  const o = req.headers && (req.headers.origin || req.headers.Origin);
  if (!o) return false;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return true;   /* développement */
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(o)) return true;         /* préproduction */
  return permis.indexOf(o) !== -1;
}

/**
 * Limite de débit, en mémoire de l'instance.
 *
 * Vercel démarre plusieurs instances en parallèle : ce compteur n'est
 * donc pas un plafond global, et ne prétend pas l'être. Il coupe les
 * rafales — le cas réel d'un script qui martèle le point d'entrée —
 * sans base de données ni dépendance supplémentaire.
 */
const compteurs = new Map();
export function tropSouvent(cle, max, fenetreMs) {
  const t = Date.now();
  const e = compteurs.get(cle);
  if (!e || t > e.fin) { compteurs.set(cle, { n: 1, fin: t + fenetreMs }); return false; }
  e.n += 1;
  if (compteurs.size > 500) {                       /* la mémoire d'une instance n'est pas extensible */
    for (const [k, v] of compteurs) if (t > v.fin) compteurs.delete(k);
  }
  return e.n > max;
}
