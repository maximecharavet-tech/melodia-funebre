/* 7 modèles Julie, composés côté serveur : aperçu, test et envoi
   partent du même texte. */
import { createRequire } from 'module';
import { objetDe, remplir, avecBrochure, varsNormalisees, BROCHURE_URL } from './_prospect-outils.js';

const require = createRequire(import.meta.url);
const data = require('../assets/js/modeles-julie.js');

export const MODELES_JULIE = data.modeles;
export const SIGNATURE_JULIE = data.signature;

export function modeleJulie(id) {
  const cle = String(id || '');
  return MODELES_JULIE.find((m) => m.id === cle) || null;
}

export function estModeleJulie(id) {
  return !!modeleJulie(id);
}

export function composerModele(id, vars, options) {
  const modele = modeleJulie(id);
  if (!modele) return null;
  const o = options || {};
  const joindre = o.joindreBrochure !== false;
  const v = varsNormalisees(vars);
  const sujet = objetDe(modele, vars);
  const titre = remplir(modele.titre, vars);
  const texte = avecBrochure(remplir(modele.texte, vars), joindre, o.lienBrochure || BROCHURE_URL);
  const bouton = modele.bouton
    ? { texte: remplir(modele.bouton.texte, vars), url: modele.bouton.url }
    : null;
  return {
    modele,
    sujet,
    titre,
    texte,
    visuel: modele.visuel,
    visuelAlt: modele.visuelAlt || '',
    bouton,
    signature: modele.signatureFixe || SIGNATURE_JULIE,
    pied: modele.pied || 'prospection',
    vars: v,
    joindreBrochure: joindre
  };
}
