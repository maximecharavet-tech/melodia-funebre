/* Pont ESM vers lib/prospect-outils.cjs — importable depuis les routes. */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const o = require('../lib/prospect-outils.cjs');

export const SITE = o.SITE;
export const BROCHURE_CHEMIN = o.BROCHURE_CHEMIN;
export const BROCHURE_NOM = o.BROCHURE_NOM;
export const BROCHURE_URL = o.BROCHURE_URL;
export const PDF_MAX = o.PDF_MAX;
export const validerEmail = o.validerEmail;
export const civilite = o.civilite;
export const varsNormalisees = o.varsNormalisees;
export const remplir = o.remplir;
export const objetDe = o.objetDe;
export const mentionBrochure = o.mentionBrochure;
export const avecBrochure = o.avecBrochure;
export const parseCsv = o.parseCsv;
export const validerPdf = o.validerPdf;
export const pdfDepuisBase64 = o.pdfDepuisBase64;
export const evenementVersStatut = o.evenementVersStatut;
export const rangerStatut = o.rangerStatut;
export const verifierSignatureResend = o.verifierSignatureResend;
export const nomPiecePropre = o.nomPiecePropre;
