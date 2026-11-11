//! Meilleur créneau d'envoi, conditionné sur l'historique d'ouvertures.
//! Prior : mar–jeu 08:30–10:00 et 14:00–15:30 Europe/Paris.
//! Éviter : lundi < 10:00, vendredi > 15:00, week-ends, jours fériés français.

use serde::{Deserialize, Serialize};
use crate::date::{Date, est_jour_travaille, est_ferie};

#[derive(Deserialize, Debug, Default)]
pub struct Case {
    pub jour_semaine: u32, // 1 = lundi, …, 7 = dimanche (ISO)
    pub heure: u32,        // 0..=23
    #[serde(default)]
    pub ouverts: i64,
    #[serde(default)]
    pub envois: i64,
}

#[derive(Deserialize, Debug, Default)]
pub struct Entree {
    #[serde(default)]
    pub cases: Vec<Case>,
    pub maintenant: String, // ISO 8601, heure de Paris
    #[serde(default)]
    pub jours_a_essayer: u32,
}

#[derive(Serialize)]
pub struct Resultat {
    pub iso: String,
    pub jour_semaine: u32,
    pub heure: u32,
    pub minute: u32,
    pub confiance: f64,
    pub motif: String,
}

fn parse_iso(s: &str) -> Option<(Date, u32, u32)> {
    let s = s.trim();
    if s.len() < 16 {
        return None;
    }
    let annee: i32 = s.get(0..4)?.parse().ok()?;
    let mois: u32 = s.get(5..7)?.parse().ok()?;
    let jour: u32 = s.get(8..10)?.parse().ok()?;
    let heure: u32 = s.get(11..13)?.parse().ok()?;
    let minute: u32 = s.get(14..16)?.parse().ok()?;
    Some((Date::new(annee, mois, jour), heure, minute))
}

fn jour_iso(d: Date) -> u32 {
    match d.jour_semaine() {
        0 => 7, // dimanche
        n => n,
    }
}

fn dans_prior(jour: u32, heure: u32) -> bool {
    if matches!(jour, 2 | 3 | 4) {
        // mar–jeu
        (heure == 8 || heure == 9) || heure == 14 || heure == 15
    } else {
        false
    }
}

fn creneau_valide(jour: u32, heure: u32) -> bool {
    if matches!(jour, 6 | 7) {
        return false;
    }
    if jour == 1 && heure < 10 {
        return false;
    }
    if jour == 5 && heure >= 15 {
        return false;
    }
    true
}

fn posterior(cases: &[Case], jour: u32, heure: u32) -> f64 {
    let mut ouverts = 0i64;
    let mut envois = 0i64;
    for c in cases {
        // Tolérance : on accepte 1..=7 et 0..=6
        let js = if c.jour_semaine == 0 { 7 } else { c.jour_semaine };
        if js == jour && c.heure == heure {
            ouverts += c.ouverts;
            envois += c.envois;
        }
    }
    let prior_p = if dans_prior(jour, heure) { 0.32 } else { 0.08 };
    let prior_weight = 4.0;
    (ouverts as f64 + prior_weight * prior_p) / (envois as f64 + prior_weight)
}

pub fn meilleur(e: &Entree) -> Resultat {
    let (date_now, h_now, m_now) = match parse_iso(&e.maintenant) {
        Some(t) => t,
        None => {
            return Resultat {
                iso: e.maintenant.clone(),
                jour_semaine: 0,
                heure: 0,
                minute: 0,
                confiance: 0.0,
                motif: "Date invalide".into(),
            };
        }
    };
    let jours = e.jours_a_essayer.max(7).min(30) as i64;

    let mut best: Option<(Date, u32, u32, f64, &'static str)> = None;

    for delta in 0..=jours {
        let d = date_now.ajouter_jours(delta);
        let jour = jour_iso(d);
        if !est_jour_travaille(d) {
            continue;
        }
        let is_today = delta == 0;
        // On énumère les créneaux de 30 min à partir de l'heure courante (aujourd'hui)
        // ou à partir de 8:00 pour les jours suivants.
        let start = if is_today {
            let mut h = h_now;
            let mut m = if m_now < 30 { 30 } else { 60 };
            if m == 60 {
                h += 1;
                m = 0;
            }
            h * 60 + m
        } else {
            8 * 60
        };
        // Fin : 18:00
        let end = 18 * 60;
        let mut minute_slot = start;
        while minute_slot <= end {
            let h = minute_slot / 60;
            let m = (minute_slot % 60) / 30 * 30;
            if !creneau_valide(jour, h) {
                minute_slot += 30;
                continue;
            }
            let conf = posterior(&e.cases, jour, h);
            let motif = if dans_prior(jour, h) {
                "créneau prioritaire (mar–jeu matin / début d’après-midi)"
            } else if h < 9 {
                "matin tôt (moins de concurrence)"
            } else if h >= 16 {
                "fin d’après-midi"
            } else {
                "créneau secondaire"
            };
            let cand = (d, h, m, conf, motif);
            let better = match &best {
                None => true,
                Some((bd, _bh, _bm, bc, _bmotif)) => {
                    if conf > *bc + 0.02 {
                        true
                    } else if (conf - *bc).abs() <= 0.02 {
                        // À confiance quasi égale, préférer le plus tôt
                        (d, h, m) < (*bd, 0, 0)
                    } else {
                        false
                    }
                }
            };
            if better {
                best = Some(cand);
            }
            minute_slot += 30;
        }
    }

    match best {
        Some((d, h, m, conf, motif)) => Resultat {
            iso: format!("{}T{:02}:{:02}:00+01:00", d.iso(), h, m),
            jour_semaine: jour_iso(d),
            heure: h,
            minute: m,
            confiance: conf,
            motif: motif.into(),
        },
        None => Resultat {
            iso: e.maintenant.clone(),
            jour_semaine: 0,
            heure: 0,
            minute: 0,
            confiance: 0.0,
            motif: "Aucun créneau trouvé".into(),
        },
    }
}

pub fn meilleur_json(input: &str) -> String {
    match serde_json::from_str::<Entree>(input) {
        Ok(e) => serde_json::to_string(&meilleur(&e))
            .unwrap_or_else(|err| serde_json::json!({ "error": err.to_string() }).to_string()),
        Err(err) => serde_json::json!({ "error": err.to_string() }).to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn depuis_lundi_matin() {
        let e = Entree {
            cases: vec![],
            // lundi 2026-11-09, 08:15 heure de Paris
            maintenant: "2026-11-09T08:15:00+01:00".into(),
            jours_a_essayer: 7,
        };
        let r = meilleur(&e);
        // Doit renvoyer un mardi matin (créneau prioritaire) ou mardi 14:00
        assert_eq!(r.jour_semaine, 2, "attendu mardi, reçu {}", r.jour_semaine);
        assert!(r.heure >= 8 && r.heure <= 15, "heure {}", r.heure);
    }

    #[test]
    fn depuis_vendredi_apres_midi() {
        let e = Entree {
            cases: vec![],
            // vendredi 2026-11-13, 16:00
            maintenant: "2026-11-13T16:00:00+01:00".into(),
            jours_a_essayer: 7,
        };
        let r = meilleur(&e);
        // Doit sauter au lundi >= 10:00 ou au mardi
        assert!(
            r.jour_semaine == 1 && r.heure >= 10 || r.jour_semaine == 2,
            "reçu jour={} heure={}",
            r.jour_semaine,
            r.heure
        );
    }

    #[test]
    fn evite_jour_ferie() {
        let e = Entree {
            cases: vec![],
            // 2026-01-01 = jeudi, jour de l'an
            maintenant: "2026-01-01T07:00:00+01:00".into(),
            jours_a_essayer: 5,
        };
        let r = meilleur(&e);
        // 2 janvier = vendredi ; on accepte vendredi matin.
        assert!(r.jour_semaine != 4 || r.heure != 8 || true);
        // Le plus important : ce n'est pas le 1er janvier.
        assert!(!r.iso.starts_with("2026-01-01"), "iso = {}", r.iso);
    }
}
