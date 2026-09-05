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
<title>${echapper(o.sujet || 'Melodia Funèbre')}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(o.apercu || '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0"
         style="width:600px;max-width:100%;background:#ffffff;border:1px solid #e2ddd0;">

    <!-- En-tête -->
    <tr><td style="padding:30px 34px 22px;text-align:center;background:#0b0b11;">
      <img src="${SITE}/assets/img/logo-melodia.jpg" width="66" height="66" alt="Melodia Funèbre"
           style="display:block;margin:0 auto 12px;border-radius:50%;border:1px solid rgba(201,168,76,.4);">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#f2efe8;letter-spacing:.5px;">Melodia Funèbre</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3.4px;text-transform:uppercase;color:#97803c;margin-top:5px;">
        Composition musicale personnalisée
      </div>
    </td></tr>
    <tr><td style="height:3px;background:linear-gradient(90deg,#97803c,#e3c977,#97803c);font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Corps -->
    <tr><td style="padding:32px 34px 26px;font-family:Helvetica,Arial,sans-serif;">
      ${o.titre ? '<h1 style="margin:0 0 20px;font-family:Georgia,\'Times New Roman\',serif;font-weight:400;font-size:25px;line-height:1.3;color:#17150f;">' + echapper(o.titre) + '</h1>' : ''}
      ${corps}
      ${fiche}
      ${bouton}
    </td></tr>

    <!-- Signature -->
    <tr><td style="padding:0 34px 30px;font-family:Helvetica,Arial,sans-serif;">
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
    </td></tr>

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
