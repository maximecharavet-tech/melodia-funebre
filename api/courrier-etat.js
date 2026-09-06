// ═══════════════════════════════════════════════════════════════
// /api/courrier-etat — Le courriel marche-t-il ?
//
// Sans ce point d'entrée, la seule façon de savoir si la chaîne
// d'envoi est configurée était de passer une vraie commande et
// d'attendre. Une configuration en six enregistrements DNS et cinq
// variables se règle mal à l'aveugle : c'est ici qu'on lit ce qui
// manque, nommément.
//
// Ce qui sort d'ici n'est jamais un secret : des booléens, les
// adresses d'expédition — qui figurent en clair dans l'en-tête de
// chaque courriel envoyé — et l'état de vérification des domaines
// chez Resend. Jamais la clé, ni un fragment de clé.
// ═══════════════════════════════════════════════════════════════

import {
  SITE, expediteurCourrier, expediteurProspection,
  boiteMaison, origineAutorisee, tropSouvent
} from './_courrier.js';

/** Le domaine d'une adresse « Nom <boite@domaine> » ou « boite@domaine » */
function domaineDe(adresse) {
  const m = String(adresse || '').match(/<([^>]+)>/);
  const brute = (m ? m[1] : adresse) || '';
  const at = brute.lastIndexOf('@');
  return at === -1 ? null : brute.slice(at + 1).trim().toLowerCase();
}

/* Resend refuse d'envoyer depuis un domaine non vérifié : c'est la
   panne la plus fréquente, et la moins lisible — l'envoi part sans
   erreur côté site, et rien n'arrive. On va donc lire le statut à la
   source plutôt que de le supposer. */
async function domainesResend(cle) {
  const stop = AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined;
  try {
    const r = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: 'Bearer ' + cle },
      signal: stop
    });
    if (r.status === 401 || r.status === 403) {
      /* Rien ne partira. C'est une panne, pas une simple lecture
         impossible : elle doit faire passer l'état au rouge. */
      return { lisible: false, fatal: true,
               motif: 'Resend refuse la clé (' + r.status + '). Elle a été révoquée, ou c\'est celle d\'un autre compte.' };
    }
    if (r.status === 422 || r.status === 404) {
      /* Une clé « Sending access » ne peut pas lister les domaines.
         Ce n'est pas une panne : elle envoie très bien. */
      return { lisible: false, motif: 'Clé d\'envoi seul : elle ne peut pas lister les domaines, ce qui est normal.' };
    }
    if (!r.ok) return { lisible: false, motif: 'Resend a répondu ' + r.status + '.' };
    const j = await r.json();
    const liste = Array.isArray(j && j.data) ? j.data : [];
    return {
      lisible: true,
      domaines: liste.map((d) => ({
        nom: d.name,
        statut: d.status,                       /* verified | pending | failed | not_started */
        region: d.region || null
      }))
    };
  } catch (e) {
    return { lisible: false, motif: 'Resend injoignable : ' + (e && e.message ? e.message : 'erreur réseau') };
  }
}

export default async function handler(req, res) {
  const ok = origineAutorisee(req);
  if (ok) {
    const o = req.headers.origin || req.headers.Origin;
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(ok ? 200 : 403).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET uniquement' });
  if (!ok) return res.status(403).json({ error: 'Origine non autorisée.' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnue';
  if (tropSouvent('etat:' + ip, 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Trop de vérifications. Réessayez dans quelques minutes.' });
  }

  const cle = process.env.RESEND_API_KEY || '';
  const courrier = expediteurCourrier();
  const prospect = expediteurProspection();
  const maison = boiteMaison();

  const etat = {
    pret: Boolean(cle && courrier && maison.length),
    variables: {
      RESEND_API_KEY: Boolean(cle),
      COURRIER_FROM: Boolean(process.env.COURRIER_FROM),
      PROSPECT_FROM: Boolean(process.env.PROSPECT_FROM),
      LEAD_TO: Boolean(process.env.LEAD_TO),
      SITE_URL: Boolean(process.env.SITE_URL)
    },
    expediteurs: {
      courrier: courrier || null,
      prospection: prospect || null,
      /* Le cloisonnement des réputations n'existe que si les deux
         envois partent de domaines différents. */
      cloisonnes: Boolean(courrier && prospect && domaineDe(courrier) !== domaineDe(prospect))
    },
    maison: maison.length,
    site: SITE,
    manque: []
  };

  if (!cle) etat.manque.push('RESEND_API_KEY : la clé Resend n\'est pas posée dans Vercel.');
  if (!courrier) etat.manque.push('COURRIER_FROM : aucune adresse d\'expédition transactionnelle.');
  if (!maison.length) etat.manque.push('LEAD_TO : aucune boîte de la maison, les copies ne partiront nulle part.');
  if (courrier && prospect && !etat.expediteurs.cloisonnes) {
    etat.manque.push('Les deux expéditeurs partagent le même domaine : un signalement pour démarchage abîmerait la remise des hommages.');
  }

  if (cle) {
    etat.resend = await domainesResend(cle);
    if (etat.resend.fatal) {
      etat.manque.push(etat.resend.motif);
      etat.pret = false;
    }
    if (etat.resend.lisible) {
      const attendus = [domaineDe(courrier), domaineDe(prospect)].filter(Boolean);
      for (const d of attendus) {
        const trouve = etat.resend.domaines.find((x) => d === x.nom || d.endsWith('.' + x.nom) || x.nom === d);
        if (!trouve) etat.manque.push('Le domaine « ' + d + ' » n\'existe pas chez Resend.');
        else if (trouve.statut !== 'verified') {
          etat.manque.push('Le domaine « ' + trouve.nom + ' » est « ' + trouve.statut +
                           ' » : les enregistrements DNS ne sont pas encore reconnus.');
        }
      }
      etat.pret = etat.pret && etat.manque.length === 0;
    }
  }

  return res.status(200).json(etat);
}
