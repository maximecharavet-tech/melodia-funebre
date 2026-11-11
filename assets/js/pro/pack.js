// ═══════════════════════════════════════════════════════════════
// Pack promotionnel co-brandé Melodia Funèbre × agence (décision n° 4 du
// 11/11/2026) : affiche A4, flyer A5, carte A6 à QR, présentation du
// service. Un seul PDF, généré dans le navigateur, sans service tiers.
// ═══════════════════════════════════════════════════════════════

import { Pdf, versJpeg } from './pdf.js';
import { noyau } from './noyau.js';
import { telecharger } from './ui.js';

const NOIR = '#040407', IVOIRE = '#f4f1ea', OR = '#c9a84c', OR_IV = '#806a30', PAPIER = '#f2efe8', ENCRE_IV = '#17150f';
const URL_ECOUTE = 'https://melodia-funebre.fr/demos';

async function logoAgence(ctx, org) {
  try {
    if (ctx.donnees.demo) return await ctx.donnees.logoDonnee();
    return org.logo_url || null;
  } catch (e) { return null; }
}

export async function genererPack(ctx, org) {
  const k = await noyau();
  const qr = k.qrSvg({ texte: URL_ECOUTE, modules: 'arrondi', yeux: 'arrondi', encre: NOIR, fond: IVOIRE, formes: true });
  if (!qr.ok) throw new Error(qr.message);
  const marque = await versJpeg('/assets/img/logo-melodia-160.webp', NOIR, 320);
  const la = await logoAgence(ctx, org);
  const logo = la ? await versJpeg(la, '#ffffff', 400) : null;
  const agence = org.nom || 'votre agence';
  const pdf = new Pdf();

  const signature = (y, couleur, cx) => {
    pdf.texte('Melodia Funèbre × ' + agence, cx, y, { police: 'italique', taille: 12, couleur, align: 'centre' });
  };
  const logoPlaque = (x, y, l, hgt) => {
    if (!logo) return;
    pdf.rect(x, y, l, hgt, { fond: '#ffffff', r: 2 });
    const r = Math.min((l - 6) / logo.l, (hgt - 6) / logo.h);
    pdf.image(logo.octets, logo.l, logo.h, x + (l - logo.l * r) / 2, y + (hgt - logo.h * r) / 2, logo.l * r, logo.h * r);
  };

  // 1. Affiche A4
  pdf.page(210, 297, { coupe: true });
  pdf.rect(-3, -3, 216, 303, { fond: NOIR });
  pdf.rect(10, 10, 190, 277, { trait: OR, epaisseur: 0.4 });
  pdf.image(marque.octets, marque.l, marque.h, 90, 28, 30, 30);
  pdf.texte('MELODIA FUNÈBRE', 105, 70, { police: 'mono', taille: 10, couleur: OR, align: 'centre' });
  pdf.texte('Chaque vie mérite', 105, 104, { police: 'italique', taille: 44, couleur: PAPIER, align: 'centre' });
  pdf.texte('sa chanson.', 105, 124, { police: 'italique', taille: 44, couleur: OR, align: 'centre' });
  pdf.paragraphe('Une chanson écrite et composée pour la personne que vous perdez, à partir de ce qu’elle était : son métier, ses mots, ses manies, ce qu’elle aimait.', 40, 146, 130, { police: 'serif', taille: 15, couleur: PAPIER });
  pdf.rect(80, 182, 50, 50, { fond: IVOIRE, r: 2 });
  pdf.qr(qr.formes, qr.cote, 84, 186, 42, { encre: NOIR, fond: IVOIRE });
  pdf.texte('Écoutez des chansons de la maison', 105, 242, { police: 'italique', taille: 13, couleur: PAPIER, align: 'centre' });
  signature(262, OR, 105);
  logoPlaque(85, 268, 40, 14);

  // 2. Flyer A5
  pdf.page(148, 210, { coupe: true });
  pdf.rect(-3, -3, 154, 216, { fond: IVOIRE });
  pdf.rect(7, 7, 134, 196, { trait: OR_IV, epaisseur: 0.35 });
  pdf.texte('UN HOMMAGE QUI SE CHANTE', 74, 26, { police: 'mono', taille: 8, couleur: OR_IV, align: 'centre' });
  pdf.texte('Une chanson pour dire', 74, 44, { police: 'italique', taille: 24, couleur: ENCRE_IV, align: 'centre' });
  pdf.texte('au revoir.', 74, 56, { police: 'italique', taille: 24, couleur: OR_IV, align: 'centre' });
  let y = 76;
  for (const [n, ti, tx] of [['1', 'Vous nous racontez', 'Avec votre conseiller, quelques minutes de questions sur la personne et sur la cérémonie.'],
    ['2', 'Nous écrivons et composons', 'Les paroles vous sont soumises ; rien n’est composé sans votre accord.'],
    ['3', 'Vous la gardez', 'La chanson pour la cérémonie, et une page à écouter grâce à un QR code.']]) {
    pdf.texte(n, 20, y, { police: 'italique', taille: 26, couleur: OR_IV });
    pdf.texte(ti, 32, y - 4, { police: 'sans', taille: 11, couleur: ENCRE_IV });
    y = pdf.paragraphe(tx, 32, y + 2, 100, { police: 'serif', taille: 11, couleur: '#55503f' }) + 8;
  }
  pdf.rect(54, 158, 40, 40, { fond: '#ffffff', r: 2 });
  pdf.qr(qr.formes, qr.cote, 57, 161, 34, { encre: NOIR, fond: '#ffffff' });
  pdf.texte('Melodia Funèbre × ' + agence, 74, 154, { police: 'italique', taille: 10, couleur: OR_IV, align: 'centre' });

  // 3. Carte A6 à QR
  pdf.page(105, 148, { coupe: true });
  pdf.rect(-3, -3, 111, 154, { fond: NOIR });
  pdf.rect(6, 6, 93, 136, { trait: OR, epaisseur: 0.35 });
  pdf.texte('MELODIA FUNÈBRE', 52.5, 24, { police: 'mono', taille: 7.5, couleur: OR, align: 'centre' });
  pdf.texte('Chaque vie mérite', 52.5, 40, { police: 'italique', taille: 18, couleur: PAPIER, align: 'centre' });
  pdf.texte('sa chanson.', 52.5, 49, { police: 'italique', taille: 18, couleur: OR, align: 'centre' });
  pdf.rect(29, 60, 47, 47, { fond: IVOIRE, r: 2 });
  pdf.qr(qr.formes, qr.cote, 32.5, 63.5, 40, { encre: NOIR, fond: IVOIRE });
  pdf.texte('Écoutez des chansons de la maison', 52.5, 118, { police: 'italique', taille: 10, couleur: PAPIER, align: 'centre' });
  pdf.texte('Melodia Funèbre × ' + agence, 52.5, 134, { police: 'italique', taille: 8, couleur: OR, align: 'centre' });

  // 4. Présentation du service (A4)
  pdf.page(210, 297);
  pdf.rect(0, 0, 210, 297, { fond: IVOIRE });
  pdf.rect(0, 0, 210, 26, { fond: NOIR });
  pdf.texte('MELODIA FUNÈBRE  ×  ' + agence.toUpperCase(), 20, 16, { police: 'mono', taille: 9, couleur: OR });
  pdf.texte('Le service, en quelques mots', 20, 48, { police: 'italique', taille: 26, couleur: ENCRE_IV });
  y = 64;
  for (const [ti, tx] of [
    ['Ce que nous faisons', 'Melodia Funèbre écrit et compose une chanson unique pour chaque personne disparue. Elle part de ce que la famille raconte : un métier, une habitude, une phrase répétée cent fois, une passion. La chanson est diffusée pendant la cérémonie, puis reste à portée de main.'],
    ['Comment cela se passe', 'Le conseiller de l’agence remplit avec la famille un questionnaire de quelques minutes. Les paroles sont soumises à relecture ; rien n’est composé sans accord. La maison écoute chaque chanson avant de la confier à l’agence.'],
    ['La page mémorial et le QR code', 'Une carte ou une plaque porte un QR code. Il ouvre une page sobre où l’on réécoute la chanson. Elle n’est jamais indexée par les moteurs de recherche ; la famille choisit qui peut y accéder, et peut la retirer à tout moment.'],
    ['Respect et confidentialité', 'Les informations confiées ne servent qu’à composer la chanson et à la remettre à la famille. Aucun artiste n’est imité. Les coordonnées écrites par erreur ne sortent jamais du dossier.']
  ]) {
    pdf.texte(ti.toUpperCase(), 20, y, { police: 'mono', taille: 8, couleur: OR_IV });
    pdf.ligne(20, y + 2, 190, y + 2, { trait: '#d9d2c2', epaisseur: 0.2 });
    y = pdf.paragraphe(tx, 20, y + 9, 170, { police: 'serif', taille: 12, couleur: ENCRE_IV }) + 8;
  }
  pdf.texte('Chaque vie mérite sa chanson.', 105, 272, { police: 'italique', taille: 14, couleur: OR_IV, align: 'centre' });
  logoPlaque(85, 278, 40, 12);

  telecharger(pdf.blob(), 'melodia-funebre-pack-promotionnel.pdf');
}
