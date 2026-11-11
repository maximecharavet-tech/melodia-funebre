//! SIRET : 14 chiffres, clé de Luhn. Exception connue : les établissements de
//! La Poste (SIREN 356 000 000), dont la somme des chiffres doit être un
//! multiple de 5 au lieu de passer Luhn.

use serde_json::{json, Value};

fn chiffres(s: &str) -> Option<Vec<u32>> {
    let propre: String = s.chars().filter(|c| !c.is_whitespace() && *c != '.' && *c != '-').collect();
    if propre.is_empty() || !propre.chars().all(|c| c.is_ascii_digit()) {
        return None;
    }
    Some(propre.chars().map(|c| c.to_digit(10).unwrap()).collect())
}

pub fn luhn(d: &[u32]) -> bool {
    let mut somme = 0;
    for (i, &x) in d.iter().rev().enumerate() {
        let mut v = x;
        if i % 2 == 1 {
            v *= 2;
            if v > 9 {
                v -= 9;
            }
        }
        somme += v;
    }
    somme % 10 == 0
}

pub fn siren_valide(s: &str) -> bool {
    match chiffres(s) {
        Some(d) if d.len() == 9 => luhn(&d),
        _ => false,
    }
}

pub fn siret_valide(s: &str) -> bool {
    let d = match chiffres(s) {
        Some(d) if d.len() == 14 => d,
        _ => return false,
    };
    if d.iter().all(|&x| x == 0) {
        return false;
    }
    let siren: String = d[..9].iter().map(|x| char::from_digit(*x, 10).unwrap()).collect();
    if siren == "356000000" {
        return d.iter().sum::<u32>() % 5 == 0;
    }
    luhn(&d)
}

/// Forme canonique : 14 chiffres sans séparateur, ou chaîne vide si invalide.
pub fn canonique(s: &str) -> String {
    if !siret_valide(s) {
        return String::new();
    }
    s.chars().filter(|c| c.is_ascii_digit()).collect()
}

pub fn valider_json(entree: &str) -> String {
    let v: Value = serde_json::from_str(entree).unwrap_or(Value::Null);
    let s = v.get("siret").and_then(|x| x.as_str()).unwrap_or("");
    let ok = siret_valide(s);
    json!({ "valide": ok, "canonique": canonique(s) }).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn siret_valides() {
        // SIRET publics connus (siège d'entreprises, annuaire SIRENE)
        assert!(siret_valide("73282932000074")); // Apple France
        assert!(siret_valide("732 829 320 00074"));
        // La Poste : somme des chiffres multiple de 5, Luhn faux — accepté
        assert!(siret_valide("35600000000001"));
        assert!(!luhn(&[3, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]));
        assert!(siret_valide("44300000000002"));
    }

    #[test]
    fn siret_invalides() {
        assert!(!siret_valide("73282932000075"));
        assert!(!siret_valide("1234"));
        assert!(!siret_valide("00000000000000"));
        assert!(!siret_valide("7328293200007A"));
        assert!(!siret_valide(""));
    }

    #[test]
    fn siren() {
        assert!(siren_valide("732829320"));
        assert!(!siren_valide("732829321"));
    }

    #[test]
    fn canonique_retire_les_espaces() {
        assert_eq!(canonique("732 829 320 00074"), "73282932000074");
        assert_eq!(canonique("faux"), "");
    }
}
