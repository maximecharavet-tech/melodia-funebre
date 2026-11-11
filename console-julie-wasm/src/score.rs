//! Score prospect 0–100, transparent (contributions énumérées) et déterministe.
//! Conforme au brief PASS 3 §1 mais calculable dès PASS 1 (utilisé en tri, kanban).

use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug, Default)]
pub struct Prospect {
    #[serde(default, rename = "type")]
    pub type_: String,
    #[serde(default)]
    pub etablissements: Option<i64>,
    #[serde(default)]
    pub effectif: String,
    #[serde(default)]
    pub email: String,
    #[serde(default)]
    pub site: String,
    #[serde(default)]
    pub dirigeant: String,
    #[serde(default)]
    pub departement: String,
    #[serde(default)]
    pub oppose: bool,
    #[serde(default)]
    pub rejete: bool,
    #[serde(default)]
    pub dernier_contact_le: Option<String>,
    #[serde(default)]
    pub evenements: Vec<Evenement>,
    #[serde(default)]
    pub departements_prioritaires: Vec<String>,
    #[serde(default)]
    pub maintenant_iso: String,
}

#[derive(Deserialize, Debug, Default)]
pub struct Evenement {
    #[serde(default)]
    pub kind: String,
    #[serde(default)]
    pub le: String,
}

#[derive(Serialize)]
pub struct Resultat {
    pub score: i64,
    pub contributions: Vec<Contribution>,
    pub couleur: String,
    pub motif_zero: Option<String>,
}

#[derive(Serialize)]
pub struct Contribution {
    pub label: String,
    pub points: i64,
}

fn iso_minute(s: &str) -> Option<i64> {
    // Parse "YYYY-MM-DDTHH:MM" (ou avec :SS, .sss, Z, +01:00). Retourne minutes UTC.
    let s = s.trim();
    if s.len() < 16 {
        return None;
    }
    let bytes = s.as_bytes();
    if bytes[4] != b'-' || bytes[7] != b'-' {
        return None;
    }
    let annee: i32 = s.get(0..4)?.parse().ok()?;
    let mois: u32 = s.get(5..7)?.parse().ok()?;
    let jour: u32 = s.get(8..10)?.parse().ok()?;
    let sep = *bytes.get(10)?;
    if sep != b'T' && sep != b' ' {
        return None;
    }
    let heure: i64 = s.get(11..13)?.parse().ok()?;
    let minute: i64 = s.get(14..16)?.parse().ok()?;
    let d = crate::date::Date::new(annee, mois, jour);
    let mut total = d.jours_depuis_epoch() * 1440 + heure * 60 + minute;
    // Offset explicite "+HH:MM" / "-HH:MM" / "Z" à la fin
    let after = &s[16..];
    let after = after.trim_end_matches('Z');
    if let Some(off_idx) = after.find(|c| c == '+' || c == '-') {
        if let Some(sign) = after.chars().nth(off_idx) {
            let rest = &after[off_idx + 1..];
            if rest.len() >= 5 && rest.as_bytes()[2] == b':' {
                let oh: i64 = rest.get(0..2).and_then(|x| x.parse().ok()).unwrap_or(0);
                let om: i64 = rest.get(3..5).and_then(|x| x.parse().ok()).unwrap_or(0);
                let delta = oh * 60 + om;
                total -= if sign == '+' { delta } else { -delta };
            }
        }
    }
    Some(total)
}

pub fn calculer(p: &Prospect) -> Resultat {
    if p.oppose {
        return Resultat {
            score: 0,
            contributions: vec![],
            couleur: "ash".into(),
            motif_zero: Some("Opposition (STOP)".into()),
        };
    }
    if p.rejete {
        return Resultat {
            score: 0,
            contributions: vec![],
            couleur: "ash".into(),
            motif_zero: Some("Adresse rejetée (bounce / plainte)".into()),
        };
    }

    let mut contributions: Vec<Contribution> = Vec::new();
    let mut total: i64 = 0;

    let type_pts = match p.type_.as_str() {
        "funeraire" | "pompes-funebres" | "pompes_funebres" | "pompes funebres" => 20,
        "crematorium" | "crematoriums" | "crématorium" | "crématoriums" => 15,
        "marbrier" | "marbriers" => 10,
        "culte" | "cultes" => 5,
        _ => 0,
    };
    if type_pts > 0 {
        contributions.push(Contribution {
            label: format!("Type : {}", if p.type_.is_empty() { "—" } else { &p.type_ }),
            points: type_pts,
        });
        total += type_pts;
    }

    if p.etablissements.unwrap_or(0) >= 2 {
        contributions.push(Contribution { label: "Multi-établissements".into(), points: 10 });
        total += 10;
    }

    match p.effectif.as_str() {
        "10+" | "10-19" | "20-49" | "50+" | "50-99" | "100+" => {
            contributions.push(Contribution { label: format!("Effectif {}", p.effectif), points: 10 });
            total += 10;
        }
        "3-9" | "3_9" | "3 à 9" => {
            contributions.push(Contribution { label: "Effectif 3–9".into(), points: 5 });
            total += 5;
        }
        _ => {}
    }

    if !p.email.trim().is_empty() {
        contributions.push(Contribution { label: "Courriel direct".into(), points: 10 });
        total += 10;
    }
    if !p.site.trim().is_empty() {
        contributions.push(Contribution { label: "Site web".into(), points: 5 });
        total += 5;
    }
    if !p.dirigeant.trim().is_empty() {
        contributions.push(Contribution { label: "Dirigeant identifié".into(), points: 5 });
        total += 5;
    }

    let mut ouverts: i64 = 0;
    let mut clics: i64 = 0;
    let mut repondu: i64 = 0;
    for e in &p.evenements {
        match e.kind.as_str() {
            "ouvert" | "opened" => ouverts += 1,
            "clique" | "clicked" => clics += 1,
            "repondu" | "replied" => repondu += 1,
            _ => {}
        }
    }
    let ouvert_pts = ouverts.min(3) * 8;
    if ouvert_pts > 0 {
        contributions.push(Contribution {
            label: format!("Ouvertures ({})", ouverts.min(3)),
            points: ouvert_pts,
        });
        total += ouvert_pts;
    }
    let clique_pts = clics.min(2) * 15;
    if clique_pts > 0 {
        contributions.push(Contribution { label: "Clics".into(), points: clique_pts });
        total += clique_pts;
    }
    let repondu_pts = repondu.min(1) * 30;
    if repondu_pts > 0 {
        contributions.push(Contribution { label: "A répondu".into(), points: repondu_pts });
        total += repondu_pts;
    }

    if let (Some(now), Some(dc)) = (iso_minute(&p.maintenant_iso), p.dernier_contact_le.as_deref().and_then(iso_minute)) {
        let age_jours = ((now - dc) as f64 / 1440.0).max(0.0);
        if age_jours > 30.0 {
            contributions.push(Contribution { label: "Sans activité depuis > 30 j".into(), points: -10 });
            total -= 10;
        }
    }

    if !p.departement.is_empty()
        && p.departements_prioritaires.iter().any(|d| d == &p.departement)
    {
        contributions.push(Contribution { label: "Département prioritaire".into(), points: 5 });
        total += 5;
    }

    total = total.clamp(0, 100);
    let couleur = match total {
        0..=25 => "ash",
        26..=50 => "bone",
        51..=75 => "or",
        _ => "or-bright",
    };

    Resultat {
        score: total,
        contributions,
        couleur: couleur.into(),
        motif_zero: None,
    }
}

pub fn calculer_json(input: &str) -> String {
    match serde_json::from_str::<Prospect>(input) {
        Ok(p) => serde_json::to_string(&calculer(&p))
            .unwrap_or_else(|e| serde_json::json!({ "error": e.to_string() }).to_string()),
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn oppose_donne_zero() {
        let mut p = Prospect::default();
        p.oppose = true;
        let r = calculer(&p);
        assert_eq!(r.score, 0);
        assert_eq!(r.couleur, "ash");
        assert!(r.motif_zero.is_some());
    }

    #[test]
    fn pompes_funebres_avec_email() {
        let mut p = Prospect::default();
        p.type_ = "funeraire".into();
        p.email = "contact@exemple.fr".into();
        let r = calculer(&p);
        // 20 (type) + 10 (email) = 30
        assert_eq!(r.score, 30);
        assert_eq!(r.contributions.len(), 2);
    }

    #[test]
    fn plafonne_a_100() {
        let mut p = Prospect::default();
        p.type_ = "funeraire".into();
        p.etablissements = Some(5);
        p.effectif = "50+".into();
        p.email = "a@b.fr".into();
        p.site = "https://x.fr".into();
        p.dirigeant = "M. X".into();
        p.evenements = vec![
            Evenement { kind: "ouvert".into(), le: "".into() },
            Evenement { kind: "ouvert".into(), le: "".into() },
            Evenement { kind: "ouvert".into(), le: "".into() },
            Evenement { kind: "clique".into(), le: "".into() },
            Evenement { kind: "clique".into(), le: "".into() },
            Evenement { kind: "repondu".into(), le: "".into() },
        ];
        let r = calculer(&p);
        assert_eq!(r.score, 100);
        assert_eq!(r.couleur, "or-bright");
    }

    #[test]
    fn json_round_trip() {
        let input = r#"{"type":"funeraire","email":"a@b.fr"}"#;
        let out = calculer_json(input);
        assert!(out.contains("\"score\":30"), "{}", out);
    }
}
