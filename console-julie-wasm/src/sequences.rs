//! Planificateur de séquences : dates absolues par étape, critères de sortie,
//! bascule appel sur clics répétés, clé d'idempotence.

use serde::{Deserialize, Serialize};
use crate::date::Date;

#[derive(Deserialize, Debug, Default)]
pub struct Etape {
    #[serde(default)]
    pub jour: i64,
    #[serde(default)]
    pub modele: String,
    #[serde(default)]
    pub canal: String, // "mail" | "appel"
    #[serde(default)]
    pub brochures: Vec<String>,
}

#[derive(Deserialize, Debug, Default)]
pub struct Entree {
    pub debut_iso: String,
    #[serde(default)]
    pub etapes: Vec<Etape>,
    #[serde(default)]
    pub etapes_faites: usize,
    #[serde(default)]
    pub statut: String, // "nouveau" | "contacte" | "interesse" | …
    #[serde(default)]
    pub oppose: bool,
    #[serde(default)]
    pub rejete: bool,
    #[serde(default)]
    pub a_repondu: bool,
    #[serde(default)]
    pub clics_recents: i64, // clics dans les 7 derniers jours
    #[serde(default)]
    pub prospect_siret: String,
}

#[derive(Serialize)]
pub struct Resultat {
    pub terminee: bool,
    pub index: usize,
    pub date_iso: String,
    pub modele: String,
    pub canal: String,
    pub brochures: Vec<String>,
    pub cle_idempotence: String,
    pub motif: String,
    pub motif_sortie: Option<String>,
}

fn parse_debut(s: &str) -> Option<Date> {
    let s = s.trim();
    if s.len() < 10 {
        return None;
    }
    let annee: i32 = s.get(0..4)?.parse().ok()?;
    let mois: u32 = s.get(5..7)?.parse().ok()?;
    let jour: u32 = s.get(8..10)?.parse().ok()?;
    Some(Date::new(annee, mois, jour))
}

fn statut_terminal(s: &str) -> bool {
    matches!(
        s,
        "interesse" | "demo_offerte" | "partenaire" | "refus"
            | "intéressé" | "démo offerte" | "sans suite"
    )
}

pub fn calculer(e: &Entree) -> Resultat {
    let vide = Resultat {
        terminee: true,
        index: 0,
        date_iso: String::new(),
        modele: String::new(),
        canal: String::new(),
        brochures: vec![],
        cle_idempotence: String::new(),
        motif: String::new(),
        motif_sortie: None,
    };

    if e.oppose {
        return Resultat { motif_sortie: Some("Opposition (STOP)".into()), ..vide };
    }
    if e.rejete {
        return Resultat { motif_sortie: Some("Adresse rejetée".into()), ..vide };
    }
    if e.a_repondu {
        return Resultat { motif_sortie: Some("A répondu".into()), ..vide };
    }
    if statut_terminal(&e.statut) {
        return Resultat {
            motif_sortie: Some(format!("Statut terminal : {}", e.statut)),
            ..vide
        };
    }
    if e.etapes.is_empty() {
        return Resultat { motif_sortie: Some("Séquence vide".into()), ..vide };
    }
    if e.etapes_faites >= e.etapes.len() {
        return Resultat { motif_sortie: Some("Toutes les étapes faites".into()), ..vide };
    }

    let debut = match parse_debut(&e.debut_iso) {
        Some(d) => d,
        None => {
            return Resultat { motif_sortie: Some("Date de début invalide".into()), ..vide };
        }
    };

    let index = e.etapes_faites;
    let etape = &e.etapes[index];
    let date_iso = debut.ajouter_jours(etape.jour).iso();

    // Bascule appel si l'étape était un mail et qu'il y a eu ≥ 2 clics récents.
    let mut canal = etape.canal.clone();
    let mut motif = format!("Étape {} · J+{}", index + 1, etape.jour);
    if canal.is_empty() || canal == "mail" {
        if e.clics_recents >= 2 {
            canal = "appel".into();
            motif.push_str(" · bascule appel (clics répétés)");
        } else {
            canal = "mail".into();
        }
    }

    let cle = format!(
        "seq:{}:{}:{}:{}",
        if e.prospect_siret.is_empty() { "?" } else { &e.prospect_siret },
        e.debut_iso.trim(),
        index,
        &etape.modele
    );

    Resultat {
        terminee: false,
        index,
        date_iso,
        modele: etape.modele.clone(),
        canal,
        brochures: etape.brochures.clone(),
        cle_idempotence: cle,
        motif,
        motif_sortie: None,
    }
}

pub fn calculer_json(input: &str) -> String {
    match serde_json::from_str::<Entree>(input) {
        Ok(e) => serde_json::to_string(&calculer(&e))
            .unwrap_or_else(|err| serde_json::json!({ "error": err.to_string() }).to_string()),
        Err(err) => serde_json::json!({ "error": err.to_string() }).to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn premiere_etape() {
        let e = Entree {
            debut_iso: "2026-11-10T08:40:00+01:00".into(),
            etapes: vec![
                Etape { jour: 0, modele: "pf-premier-contact".into(), canal: "mail".into(), brochures: vec![] },
                Etape { jour: 3, modele: "pf-relance-j4".into(), canal: "mail".into(), brochures: vec![] },
                Etape { jour: 7, modele: "pf-relance-j10".into(), canal: "mail".into(), brochures: vec![] },
            ],
            etapes_faites: 0,
            statut: "nouveau".into(),
            ..Default::default()
        };
        let r = calculer(&e);
        assert!(!r.terminee);
        assert_eq!(r.index, 0);
        assert_eq!(r.date_iso, "2026-11-10");
        assert_eq!(r.canal, "mail");
        assert!(r.cle_idempotence.contains(":0:"));
    }

    #[test]
    fn sortie_sur_reponse() {
        let e = Entree {
            debut_iso: "2026-11-10T08:40:00+01:00".into(),
            etapes: vec![Etape { jour: 0, modele: "pf-premier-contact".into(), canal: "mail".into(), brochures: vec![] }],
            etapes_faites: 0,
            a_repondu: true,
            ..Default::default()
        };
        let r = calculer(&e);
        assert!(r.terminee);
        assert!(r.motif_sortie.is_some());
    }

    #[test]
    fn bascule_appel_apres_deux_clics() {
        let e = Entree {
            debut_iso: "2026-11-10T08:40:00+01:00".into(),
            etapes: vec![
                Etape { jour: 0, modele: "pf-premier-contact".into(), canal: "mail".into(), brochures: vec![] },
                Etape { jour: 3, modele: "pf-relance-j4".into(), canal: "mail".into(), brochures: vec![] },
            ],
            etapes_faites: 1,
            clics_recents: 2,
            ..Default::default()
        };
        let r = calculer(&e);
        assert!(!r.terminee);
        assert_eq!(r.canal, "appel");
    }

    #[test]
    fn idempotence_stable() {
        let e = Entree {
            debut_iso: "2026-11-10T08:40:00+01:00".into(),
            etapes: vec![Etape { jour: 0, modele: "pf-premier-contact".into(), canal: "mail".into(), brochures: vec![] }],
            etapes_faites: 0,
            ..Default::default()
        };
        let a = calculer(&e);
        let b = calculer(&e);
        assert_eq!(a.cle_idempotence, b.cle_idempotence);
    }
}
