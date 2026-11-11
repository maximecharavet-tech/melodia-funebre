//! Dates civiles (sans dépendance externe), jour de semaine, jours fériés français.
//!
//! Les algorithmes `jours_depuis_epoch` et `depuis_jours` sont ceux de
//! Howard Hinnant ("chrono-Compatible Low-Level Date Algorithms", domaine public).
//! La date de Pâques suit l'algorithme de Meeus/Jones/Butcher.

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Date {
    pub annee: i32,
    pub mois: u32, // 1..=12
    pub jour: u32, // 1..=31
}

impl Date {
    pub fn new(annee: i32, mois: u32, jour: u32) -> Self {
        Self { annee, mois, jour }
    }

    /// Nombre de jours depuis l'époque Unix (1970-01-01 = 0).
    pub fn jours_depuis_epoch(&self) -> i64 {
        let y = if self.mois <= 2 { self.annee as i64 - 1 } else { self.annee as i64 };
        let era = if y >= 0 { y } else { y - 399 } / 400;
        let yoe = (y - era * 400) as u32;
        let mp = if self.mois > 2 { self.mois - 3 } else { self.mois + 9 };
        let doy = (153 * mp + 2) / 5 + self.jour - 1;
        let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
        era * 146097 + doe as i64 - 719468
    }

    pub fn depuis_jours(jours: i64) -> Self {
        let z = jours + 719468;
        let era = if z >= 0 { z } else { z - 146096 } / 146097;
        let doe = (z - era * 146097) as u32;
        let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        let y = yoe as i64 + era * 400;
        let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        let mp = (5 * doy + 2) / 153;
        let d = doy - (153 * mp + 2) / 5 + 1;
        let m = if mp < 10 { mp + 3 } else { mp - 9 };
        let annee = if m <= 2 { y + 1 } else { y };
        Date { annee: annee as i32, mois: m, jour: d }
    }

    /// 0 = dimanche, 1 = lundi, …, 6 = samedi.
    pub fn jour_semaine(&self) -> u32 {
        let j = self.jours_depuis_epoch();
        ((j + 4).rem_euclid(7)) as u32
    }

    pub fn est_weekend(&self) -> bool {
        matches!(self.jour_semaine(), 0 | 6)
    }

    pub fn ajouter_jours(&self, n: i64) -> Self {
        Self::depuis_jours(self.jours_depuis_epoch() + n)
    }

    pub fn iso(&self) -> String {
        format!("{:04}-{:02}-{:02}", self.annee, self.mois, self.jour)
    }
}

/// Dimanche de Pâques pour l'année grégorienne donnée.
pub fn paques(annee: i32) -> Date {
    let a = annee % 19;
    let b = annee / 100;
    let c = annee % 100;
    let d = b / 4;
    let e = b % 4;
    let f = (b + 8) / 25;
    let g = (b - f + 1) / 3;
    let h = (19 * a + b - d - g + 15) % 30;
    let i = c / 4;
    let k = c % 4;
    let l = (32 + 2 * e + 2 * i - h - k) % 7;
    let m = (a + 11 * h + 22 * l) / 451;
    let mois = (h + l - 7 * m + 114) / 31;
    let jour = ((h + l - 7 * m + 114) % 31) + 1;
    Date::new(annee, mois as u32, jour as u32)
}

/// Tous les jours fériés légaux en France métropolitaine pour une année.
pub fn jours_feries(annee: i32) -> Vec<Date> {
    let p = paques(annee);
    vec![
        Date::new(annee, 1, 1),        // Jour de l'an
        p.ajouter_jours(1),            // Lundi de Pâques
        Date::new(annee, 5, 1),        // Fête du Travail
        Date::new(annee, 5, 8),        // Victoire 1945
        p.ajouter_jours(39),           // Ascension
        p.ajouter_jours(49),           // Pentecôte (dimanche)
        p.ajouter_jours(50),           // Lundi de Pentecôte
        Date::new(annee, 7, 14),       // Fête nationale
        Date::new(annee, 8, 15),       // Assomption
        Date::new(annee, 11, 1),       // Toussaint
        Date::new(annee, 11, 11),      // Armistice
        Date::new(annee, 12, 25),      // Noël
    ]
}

pub fn est_ferie(d: Date) -> bool {
    jours_feries(d.annee)
        .iter()
        .any(|f| f.jours_depuis_epoch() == d.jours_depuis_epoch())
}

pub fn est_jour_travaille(d: Date) -> bool {
    !d.est_weekend() && !est_ferie(d)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip() {
        for (a, m, j) in [(1970, 1, 1), (2000, 2, 29), (2026, 11, 11), (2100, 12, 31)] {
            let d = Date::new(a, m, j);
            let back = Date::depuis_jours(d.jours_depuis_epoch());
            assert_eq!(d, back);
        }
    }

    #[test]
    fn jour_semaine_connu() {
        // 1970-01-01 = jeudi
        assert_eq!(Date::new(1970, 1, 1).jour_semaine(), 4);
        // 2026-11-11 = mercredi
        assert_eq!(Date::new(2026, 11, 11).jour_semaine(), 3);
    }

    #[test]
    fn paques_connues() {
        assert_eq!(paques(2024).iso(), "2024-03-31");
        assert_eq!(paques(2025).iso(), "2025-04-20");
        assert_eq!(paques(2026).iso(), "2026-04-05");
    }

    #[test]
    fn feries_2026() {
        let f = jours_feries(2026);
        assert!(f.iter().any(|d| d.iso() == "2026-01-01"));
        assert!(f.iter().any(|d| d.iso() == "2026-04-06")); // Lundi de Pâques
        assert!(f.iter().any(|d| d.iso() == "2026-05-14")); // Ascension
        assert!(f.iter().any(|d| d.iso() == "2026-05-25")); // Lundi de Pentecôte
    }
}
