//! Moteur de prix : centimes entiers, jamais de flottant pour l'argent.
//!
//! Aucun tarif n'est écrit ici : le prix unitaire vient de `pro_offers`
//! (colonne `price_cents`), qui vaut NULL tant que Maxime ne l'a pas fixé.
//! Un prix absent est une erreur explicite, pas un zéro.
//!
//! Le serveur fait foi pour le montant demandé ; Stripe fait foi pour le
//! montant effectivement payé (le webhook le recopie tel quel).

use crate::texte::{b_de, i_opt, objet, s_de};
use serde_json::{json, Value};

#[derive(Default)]
pub struct Remise {
    /// "pourcent" (en points de base : 10 % = 1000) ou "montant" (centimes)
    pub genre: String,
    pub valeur: i64,
}

#[derive(Default)]
pub struct Entree {
    pub prix_unitaire_cents: Option<i64>,
    pub quantite: Option<i64>,
    pub remise: Option<Remise>,
    /// Taux de TVA en points de base (20 % = 2000). Absent : franchise en base.
    pub tva_bp: Option<i64>,
    /// Mention affichée en franchise ; paramétrable dans pro_settings.
    pub mention_franchise: Option<String>,
    /// Code maître validé côté serveur : gratuité totale.
    pub code_maitre: bool,
}

impl Entree {
    pub fn depuis(v: &Value) -> Self {
        Entree {
            prix_unitaire_cents: i_opt(v, "prix_unitaire_cents"),
            quantite: i_opt(v, "quantite"),
            remise: v.get("remise").filter(|r| r.is_object()).map(|r| Remise { genre: s_de(r, "type"), valeur: i_opt(r, "valeur").unwrap_or(0) }),
            tva_bp: i_opt(v, "tva_bp"),
            mention_franchise: v.get("mention_franchise").and_then(|x| x.as_str()).map(|s| s.to_string()),
            code_maitre: b_de(v, "code_maitre"),
        }
    }
}

pub struct Resultat {
    pub sous_total: i64,
    pub remise: i64,
    pub ht: i64,
    pub tva: i64,
    pub ttc: i64,
}

/// Arrondi au centime le plus proche, demi vers le haut, sur entiers.
fn part(montant: i64, bp: i64) -> i64 {
    (montant * bp + 5000) / 10000
}

pub fn calculer(e: &Entree) -> Result<Resultat, &'static str> {
    let pu = match e.prix_unitaire_cents {
        Some(p) if p >= 0 => p,
        Some(_) => return Err("PRIX_NEGATIF"),
        None => return Err("TARIF_NON_FIXE"),
    };
    let q = e.quantite.unwrap_or(1);
    if !(1..=1000).contains(&q) {
        return Err("QUANTITE_INVALIDE");
    }
    let sous_total = pu.checked_mul(q).ok_or("DEPASSEMENT")?;
    let mut remise = 0;
    if e.code_maitre {
        remise = sous_total;
    } else if let Some(r) = &e.remise {
        remise = match r.genre.as_str() {
            "pourcent" => {
                if !(0..=10000).contains(&r.valeur) {
                    return Err("REMISE_INVALIDE");
                }
                part(sous_total, r.valeur)
            }
            "montant" => {
                if r.valeur < 0 {
                    return Err("REMISE_INVALIDE");
                }
                r.valeur
            }
            "" => 0,
            _ => return Err("REMISE_INVALIDE"),
        };
    }
    let ht = (sous_total - remise).max(0);
    let remise = sous_total - ht;
    let tva = match e.tva_bp {
        Some(bp) if (0..=10000).contains(&bp) => part(ht, bp),
        Some(_) => return Err("TVA_INVALIDE"),
        None => 0,
    };
    Ok(Resultat { sous_total, remise, ht, tva, ttc: ht + tva })
}

pub fn calculer_json(entree: &str) -> String {
    let e: Entree = match objet(entree) {
        Some(v) => Entree::depuis(&v),
        None => return crate::texte::erreur("ENTREE_INVALIDE", "Entrée illisible."),
    };
    match calculer(&e) {
        Ok(r) => {
            let mention = if e.tva_bp.is_none() {
                e.mention_franchise
                    .clone()
                    .unwrap_or_else(|| "TVA non applicable, art. 293 B du CGI".to_string())
            } else {
                String::new()
            };
            json!({
                "ok": true,
                "sous_total_cents": r.sous_total,
                "remise_cents": r.remise,
                "ht_cents": r.ht,
                "tva_cents": r.tva,
                "ttc_cents": r.ttc,
                "gratuit": r.ttc == 0,
                "mention_tva": mention
            })
            .to_string()
        }
        Err(code) => {
            let msg = match code {
                "TARIF_NON_FIXE" => "Le tarif de cette offre n'est pas encore fixé.",
                "QUANTITE_INVALIDE" => "Quantité invalide.",
                "REMISE_INVALIDE" => "Remise invalide.",
                "TVA_INVALIDE" => "Taux de TVA invalide.",
                _ => "Calcul impossible.",
            };
            crate::texte::erreur(code, msg)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn e(pu: Option<i64>) -> Entree {
        Entree { prix_unitaire_cents: pu, ..Default::default() }
    }

    #[test]
    fn prix_absent_est_une_erreur() {
        assert_eq!(calculer(&e(None)).err(), Some("TARIF_NON_FIXE"));
    }

    #[test]
    fn centimes_entiers_et_franchise() {
        let r = calculer(&e(Some(14_900))).unwrap();
        assert_eq!((r.ht, r.tva, r.ttc), (14_900, 0, 14_900));
    }

    #[test]
    fn remise_pourcent_arrondie() {
        let mut x = e(Some(999));
        x.remise = Some(Remise { genre: "pourcent".into(), valeur: 1500 }); // 15 %
        let r = calculer(&x).unwrap();
        assert_eq!(r.remise, 150); // 149,85 → 150
        assert_eq!(r.ttc, 849);
    }

    #[test]
    fn remise_montant_ne_passe_pas_sous_zero() {
        let mut x = e(Some(1000));
        x.remise = Some(Remise { genre: "montant".into(), valeur: 5000 });
        let r = calculer(&x).unwrap();
        assert_eq!((r.remise, r.ttc), (1000, 0));
    }

    #[test]
    fn code_maitre_rend_gratuit() {
        let mut x = e(Some(29_900));
        x.code_maitre = true;
        x.tva_bp = Some(2000);
        let r = calculer(&x).unwrap();
        assert_eq!(r.ttc, 0);
    }

    #[test]
    fn tva_vingt_pourcent() {
        let mut x = e(Some(10_000));
        x.tva_bp = Some(2000);
        let r = calculer(&x).unwrap();
        assert_eq!((r.ht, r.tva, r.ttc), (10_000, 2_000, 12_000));
    }

    #[test]
    fn refus_des_valeurs_absurdes() {
        let mut x = e(Some(100));
        x.quantite = Some(0);
        assert!(calculer(&x).is_err());
        let mut y = e(Some(100));
        y.remise = Some(Remise { genre: "pourcent".into(), valeur: 20_000 });
        assert!(calculer(&y).is_err());
        assert!(calculer(&e(Some(-1))).is_err());
    }

    #[test]
    fn json_mentionne_la_franchise() {
        let s = calculer_json(r#"{"prix_unitaire_cents":100}"#);
        assert!(s.contains("293 B"));
        let t = calculer_json(r#"{}"#);
        assert!(t.contains("TARIF_NON_FIXE"));
    }
}
