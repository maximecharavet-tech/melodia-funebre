/**
 * api/_courrier-v2.js — Trois dispositions de courriel raffinées.
 *
 * ─── DISPOSITIONS ─────────────────────────────────────────────────────
 *   lettre     la plus sobre et la plus délivrable : fond ivoire, texte
 *              encre, filet or de 1 px, aucun visuel, aucune pièce jointe
 *              en tête. Recommandée pour les relances.
 *   editorial  visuel de campagne en tête, texte, bouton, carte de visite.
 *              La disposition actuelle, resserrée.
 *   carte      carte ivoire centrée, filet or, portrait de Julie dans la
 *              signature. Recommandée pour les prises de contact.
 *
 * ─── PATTERNS repris de react-email (MIT, resend/react-email) ─────────
 *   · preheader caché (texte d’aperçu en boîte de réception) ;
 *   · bouton « bulletproof » avec VML pour Outlook (arrondi conservé) ;
 *   · meta `color-scheme` + `supported-color-schemes` pour le mode sombre ;
 *   · largeur 600 px max, retina via attributs `width`/`height` + CSS ;
 *   · reset CSS inline, aucune feuille externe, aucune police distante.
 *
 * ─── CONTRAT ─────────────────────────────────────────────────────────
 *   Les fonctions exportées sont pures : elles prennent un objet, rendent
 *   une chaîne HTML complète. Aucune lecture d’environnement. Aucun accès
 *   réseau. Ce module n’est branché dans /api/prospect-mail.js que lors
 *   d’une PR de suivi (voir la description de la PR). Tant qu’il n’est pas
 *   branché, le serveur continue d’utiliser `gabarit()` de _courrier.js,
 *   qui n’est pas modifié.
 *
 * Variables d’environnement : aucune propre. `SITE` est importé de
 * _courrier.js pour cohérence.
 *
 * License: internal. Patterns inspirés de react-email (MIT), aucun code
 * copié (les composants react-email sont en JSX/React).
 */
import {
  SITE,
  echapper,
  carteVisite,
  DISQUE_OR
} from './_courrier.js';
import { htmlPiedProspection } from './_desabonnement.js';

export const LAYOUTS = ['lettre', 'editorial', 'carte'];

export function layoutValide(nom) {
  return LAYOUTS.indexOf(String(nom || '').toLowerCase()) >= 0;
}

/* ─── Utilitaires ───────────────────────────────────────────────────── */

function esc(s) {
  return echapper(String(s == null ? '' : s));
}

function attrsRetina(src, w, h, alt, style) {
  return '<img src="' + esc(src) + '" width="' + w + '" height="' + h + '" ' +
    'alt="' + esc(alt || '') + '" border="0" ' +
    'style="display:block;border:0;outline:none;text-decoration:none;' +
    '-ms-interpolation-mode:bicubic;max-width:' + w + 'px;width:100%;height:auto;' +
    (style || '') + '">';
}

function boutonBulletproof({ texte, url, bg, fg, bord }) {
  var t = esc(texte || 'Découvrir');
  var u = esc(url || SITE);
  var fond = bg || '#c9a84c';
  var couleur = fg || '#040407';
  var bordure = bord || fond;
  return '' +
    '<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" ' +
      'href="' + u + '" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="14%" strokecolor="' + bordure + '" fillcolor="' + fond + '">' +
      '<w:anchorlock/><center style="color:' + couleur + ';font-family:Arial,sans-serif;font-size:15px;font-weight:600;">' + t + '</center>' +
    '</v:roundrect><![endif]-->' +
    '<!--[if !mso]><!-- -->' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;">' +
      '<tr><td align="center" bgcolor="' + fond + '" style="border-radius:6px;background:' + fond + ';">' +
        '<a href="' + u + '" target="_blank" style="display:inline-block;padding:12px 24px;' +
          'font-family:Arial,sans-serif;font-size:15px;font-weight:600;color:' + couleur + ';' +
          'text-decoration:none;border-radius:6px;">' + t + '</a>' +
      '</td></tr>' +
    '</table>' +
    '<!--<![endif]-->';
}

function piedLegal(signature, unsub) {
  var nom = esc((signature && signature.nom) || 'Julie Serve');
  var email = esc((signature && signature.email) || 'julie@melodia-funebre.fr');
  return '' +
    '<div style="font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#8e8878;text-align:center;padding:0 12px;">' +
      esc('Melodia Funèbre — Chaque vie mérite sa chanson.') + '<br>' +
      nom + ' · ' + email + ' · ' + esc(SITE.replace(/^https?:\/\//, '')) + '<br>' +
      '<div style="margin-top:8px;text-align:center;">' + htmlPiedProspection(unsub) + '</div>' +
    '</div>';
}

/**
 * Coquille commune : <!doctype>, preheader, table 600px, conditions MSO,
 * meta dark-mode.
 */
function squelette({ titre, preheader, bgPage, bgCard, texte, corps, unsub }) {
  var t = esc(titre || 'Melodia Funèbre');
  var p = esc(preheader || '');
  return '' +
    '<!doctype html>' +
    '<html lang="fr">' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="x-apple-disable-message-reformatting">' +
      '<meta name="color-scheme" content="light dark">' +
      '<meta name="supported-color-schemes" content="light dark">' +
      '<title>' + t + '</title>' +
      '<!--[if mso]><xml><o:OfficeDocumentSettings>' +
        '<o:PixelsPerInch>96</o:PixelsPerInch>' +
        '<o:AllowPNG/>' +
      '</o:OfficeDocumentSettings></xml><![endif]-->' +
      '<style>' +
        'body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}' +
        'table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}' +
        'img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}' +
        'body{margin:0;padding:0;width:100%!important;background:' + esc(bgPage) + ';color:' + esc(texte) + ';}' +
        '@media (max-width:600px){' +
          '.jv2-container{width:100%!important;}' +
          '.jv2-pad{padding-left:16px!important;padding-right:16px!important;}' +
          '.jv2-h1{font-size:22px!important;line-height:1.25!important;}' +
          '.jv2-btn a{display:block!important;width:100%!important;box-sizing:border-box!important;}' +
        '}' +
        '@media (prefers-color-scheme: dark){' +
          'body{background:' + esc(bgPage) + '!important;color:' + esc(texte) + '!important;}' +
        '}' +
      '</style>' +
    '</head>' +
    '<body style="margin:0;padding:0;background:' + esc(bgPage) + ';">' +
      '<div style="display:none;font-size:1px;color:' + esc(bgPage) + ';line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">' +
        p +
      '</div>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:' + esc(bgPage) + ';">' +
        '<tr><td align="center" style="padding:24px 12px;">' +
          '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" ' +
            'class="jv2-container" style="max-width:600px;width:100%;background:' + esc(bgCard) + ';' +
            'border-radius:8px;overflow:hidden;color:' + esc(texte) + ';">' +
            corps +
          '</table>' +
          '<div style="max-width:600px;margin:16px auto 0;">' + piedLegal({}, unsub) + '</div>' +
        '</td></tr>' +
      '</table>' +
    '</body>' +
    '</html>';
}

/* ─── Disposition « lettre » ────────────────────────────────────────── */

function layoutLettre(o) {
  var sujet = esc(o.sujet || '');
  var texte = String(o.texte || '').split(/\n{2,}/).map(function (para) {
    return '<p style="margin:0 0 14px;font-family:Georgia,\'Times New Roman\',serif;' +
      'font-size:16px;line-height:1.6;color:#17150f;">' +
      esc(para).replace(/\n/g, '<br>') +
    '</p>';
  }).join('');

  var bouton = '';
  if (o.lienUrl && o.lienTexte) {
    bouton = '<div style="margin:24px 0 8px;">' +
      boutonBulletproof({ texte: o.lienTexte, url: o.lienUrl, bg: '#c9a84c', fg: '#040407' }) +
    '</div>';
  }

  var corps =
    '<tr><td style="padding:36px 40px 12px;" class="jv2-pad">' +
      '<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:.16em;' +
        'text-transform:uppercase;color:#806a30;margin-bottom:18px;">Melodia Funèbre</div>' +
      '<h1 style="margin:0 0 20px;font-family:Georgia,\'Times New Roman\',serif;' +
        'font-weight:400;font-size:26px;line-height:1.2;color:#17150f;" class="jv2-h1">' +
        sujet +
      '</h1>' +
      '<div style="height:1px;background:#c9a84c;opacity:.35;margin:0 0 22px;"></div>' +
      texte +
      bouton +
    '</td></tr>' +
    '<tr><td style="padding:12px 40px 36px;" class="jv2-pad">' +
      carteVisite(o.signature || {}) +
    '</td></tr>';

  return squelette({
    titre: o.sujet || 'Melodia Funèbre',
    preheader: o.preheader || '',
    bgPage: '#ebe6db',
    bgCard: '#f4f1ea',
    texte: '#17150f',
    corps: corps,
    unsub: o.unsub
  });
}

/* ─── Disposition « éditorial » ─────────────────────────────────────── */

function layoutEditorial(o) {
  var sujet = esc(o.sujet || '');
  var preheader = esc(o.preheader || '');
  var texte = String(o.texte || '').split(/\n{2,}/).map(function (para) {
    return '<p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:15px;' +
      'line-height:1.65;color:#c4bba6;">' +
      esc(para).replace(/\n/g, '<br>') +
    '</p>';
  }).join('');

  var visuel = '';
  if (o.visuel && /^\/assets\/img\/(courriel|campagne)\/[^"']+\.(jpg|jpeg)$/i.test(o.visuel)) {
    visuel =
      '<tr><td style="padding:0;">' +
        '<a href="' + esc(o.lienUrl || SITE) + '" target="_blank" style="text-decoration:none;">' +
          attrsRetina(SITE + o.visuel, 600, 260, o.visuelAlt || 'Melodia Funèbre', '') +
        '</a>' +
      '</td></tr>';
  }

  var bouton = '';
  if (o.lienUrl && o.lienTexte) {
    bouton = '<div style="margin:26px 0 4px;">' +
      boutonBulletproof({ texte: o.lienTexte, url: o.lienUrl, bg: '#e3c977', fg: '#040407' }) +
    '</div>';
  }

  var corps =
    '<tr><td style="padding:0;text-align:center;background:#040407;">' +
      '<div style="padding:18px 12px;font-family:Arial,sans-serif;font-size:11px;' +
        'letter-spacing:.22em;text-transform:uppercase;color:#c9a84c;">Melodia Funèbre</div>' +
    '</td></tr>' +
    visuel +
    '<tr><td style="padding:32px 40px 8px;" class="jv2-pad">' +
      '<h1 style="margin:0 0 18px;font-family:Georgia,\'Times New Roman\',serif;' +
        'font-weight:400;font-size:26px;line-height:1.25;color:#f4f1ea;" class="jv2-h1">' +
        sujet +
      '</h1>' +
      (preheader ? '<p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:14px;' +
        'line-height:1.55;color:#8e8878;font-style:italic;">' + preheader + '</p>' : '') +
      texte +
      bouton +
    '</td></tr>' +
    '<tr><td style="padding:16px 40px 36px;" class="jv2-pad">' +
      carteVisite(o.signature || {}) +
    '</td></tr>';

  return squelette({
    titre: o.sujet || 'Melodia Funèbre',
    preheader: o.preheader || '',
    bgPage: '#040407',
    bgCard: '#0d0d14',
    texte: '#f4f1ea',
    corps: corps,
    unsub: o.unsub
  });
}

/* ─── Disposition « carte » ─────────────────────────────────────────── */

function layoutCarte(o) {
  var sujet = esc(o.sujet || '');
  var texte = String(o.texte || '').split(/\n{2,}/).map(function (para) {
    return '<p style="margin:0 0 14px;font-family:Georgia,\'Times New Roman\',serif;' +
      'font-size:16px;line-height:1.65;color:#17150f;">' +
      esc(para).replace(/\n/g, '<br>') +
    '</p>';
  }).join('');

  var portrait = '';
  if (o.signature && o.signature.photo && /^\/assets\/img\/equipe\/[^"']+\.(jpg|jpeg)$/i.test(o.signature.photo)) {
    portrait =
      '<tr><td align="center" style="padding:0 0 18px;">' +
        '<img src="' + esc(SITE + o.signature.photo) + '" width="72" height="72" ' +
          'alt="" border="0" style="display:inline-block;border-radius:50%;' +
          'border:2px solid #c9a84c;width:72px;height:72px;">' +
      '</td></tr>';
  }

  var bouton = '';
  if (o.lienUrl && o.lienTexte) {
    bouton = '<div style="margin:22px 0 4px;">' +
      boutonBulletproof({ texte: o.lienTexte, url: o.lienUrl, bg: '#c9a84c', fg: '#040407' }) +
    '</div>';
  }

  var corps =
    '<tr><td style="padding:0;text-align:center;background:#f4f1ea;">' +
      '<div style="height:3px;background:#c9a84c;"></div>' +
      '<div style="padding:26px 12px 8px;font-family:Arial,sans-serif;font-size:10px;' +
        'letter-spacing:.24em;text-transform:uppercase;color:#806a30;">Melodia Funèbre</div>' +
    '</td></tr>' +
    '<tr><td style="padding:24px 48px 8px;" class="jv2-pad">' +
      '<h1 style="margin:0 0 18px;font-family:Georgia,\'Times New Roman\',serif;' +
        'font-weight:400;font-size:28px;line-height:1.2;color:#17150f;text-align:center;" class="jv2-h1">' +
        sujet +
      '</h1>' +
      '<div style="height:1px;background:#c9a84c;opacity:.3;margin:0 0 22px;"></div>' +
      texte +
      bouton +
    '</td></tr>' +
    '<tr><td style="padding:8px 48px 36px;" class="jv2-pad">' +
      portrait +
      carteVisite(o.signature || {}) +
    '</td></tr>';

  return squelette({
    titre: o.sujet || 'Melodia Funèbre',
    preheader: o.preheader || '',
    bgPage: '#ebe6db',
    bgCard: '#f4f1ea',
    texte: '#17150f',
    corps: corps,
    unsub: o.unsub
  });
}

/* ─── Entrée publique ──────────────────────────────────────────────── */

/**
 * Rend le HTML complet du courriel dans la disposition demandée.
 *
 * o = {
 *   layout:   'lettre' | 'editorial' | 'carte' (défaut : editorial),
 *   sujet:    string,
 *   preheader: string,
 *   texte:    string (peut contenir des paragraphes séparés par \n\n),
 *   visuel:   '/assets/img/courriel/…' ou '/assets/img/campagne/…' (.jpg),
 *   visuelAlt: string,
 *   lienTexte, lienUrl,
 *   signature: { nom, role, tel, photo, email }
 * }
 *
 * Retourne une chaîne HTML complète.
 */
export function gabaritV2(o) {
  var choix = String((o && o.layout) || 'editorial').toLowerCase();
  if (!layoutValide(choix)) choix = 'editorial';
  var charge = Object.assign({}, o || {}, { layout: choix });
  if (choix === 'lettre') return layoutLettre(charge);
  if (choix === 'carte') return layoutCarte(charge);
  return layoutEditorial(charge);
}

/**
 * Rend un extrait de texte brut fidèle, utilisé par l’aperçu « Texte brut »
 * dans julie-apercu.js. Pure fonction, pas d’effet de bord.
 */
export function texteBrut(o) {
  var parties = [];
  if (o && o.sujet) parties.push(o.sujet);
  if (o && o.preheader) parties.push('', o.preheader);
  if (o && o.texte) parties.push('', String(o.texte).trim());
  if (o && o.lienUrl) parties.push('', o.lienTexte ? o.lienTexte + ' : ' + o.lienUrl : o.lienUrl);
  parties.push('', '— Melodia Funèbre');
  return parties.join('\n');
}
