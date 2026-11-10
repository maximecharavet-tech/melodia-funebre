'use strict';
const { objetDe, remplir, avecBrochure, varsNormalisees, BROCHURE_URL } = require('./prospect-outils.cjs');
const data = require('../assets/js/modeles-julie.js');

const MODELES_JULIE = data.modeles;
const SIGNATURE_JULIE = data.signature;

function modeleJulie(id) {
  const cle = String(id || '');
  return MODELES_JULIE.find((m) => m.id === cle) || null;
}

function estModeleJulie(id) {
  return !!modeleJulie(id);
}

function composerModele(id, vars, options) {
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

module.exports = {
  MODELES_JULIE,
  SIGNATURE_JULIE,
  modeleJulie,
  estModeleJulie,
  composerModele
};
