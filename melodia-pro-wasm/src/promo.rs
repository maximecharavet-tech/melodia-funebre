//! Codes promo : format et normalisation seulement.
//!
//! La validité d'un code (actif, expiré, plafonné) se lit chez Stripe, côté
//! serveur. La valeur du code maître n'apparaît nulle part dans ce crate : le
//! `.wasm` est public, il est servi au navigateur.

use serde_json::{json, Value};

/// Majuscules, sans espaces ni tirets bas : « clef temoin » et « Clef-Temoin »
/// ne diffèrent pas de « CLEFTEMOIN » pour la comparaison au code maître.
pub fn normaliser_strict(code: &str) -> String {
    code.chars()
        .filter(|c| !c.is_whitespace() && *c != '-' && *c != '_' && *c != '.')
        .map(|c| c.to_ascii_uppercase())
        .collect()
}

/// Forme envoyée à Stripe : majuscules, espaces retirés, tirets conservés
/// (« NOEL-2026 » est un code Stripe légitime).
pub fn normaliser_stripe(code: &str) -> String {
    code.chars().filter(|c| !c.is_whitespace()).map(|c| c.to_ascii_uppercase()).collect()
}

pub fn format_valide(code: &str) -> bool {
    let n = code.chars().count();
    (3..=40).contains(&n) && code.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '-')
}

pub fn normaliser_json(entree: &str) -> String {
    let v: Value = serde_json::from_str(entree).unwrap_or(Value::Null);
    let brut = v.get("code").and_then(|x| x.as_str()).unwrap_or("");
    let brut = crate::texte::tronquer(brut, 80);
    let stripe = normaliser_stripe(&brut);
    json!({
        "stripe": stripe,
        "strict": normaliser_strict(&brut),
        "format_valide": format_valide(&stripe)
    })
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn insensible_a_la_casse_et_aux_espaces() {
        assert_eq!(normaliser_strict("clef temoin"), "CLEFTEMOIN");
        assert_eq!(normaliser_strict(" ClefTemoin "), "CLEFTEMOIN");
        assert_eq!(normaliser_strict("clef-temoin"), "CLEFTEMOIN");
    }

    #[test]
    fn format() {
        assert!(format_valide("NOEL-2026"));
        assert!(!format_valide("AB"));
        assert!(!format_valide("CODE<SCRIPT>"));
        assert!(!format_valide(&"A".repeat(41)));
    }

    #[test]
    fn json() {
        let s = normaliser_json(r#"{"code":"noel 2026"}"#);
        assert!(s.contains("\"stripe\":\"NOEL2026\""));
    }
}
