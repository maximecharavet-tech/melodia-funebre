//! Petits outils de texte partagés : repli des accents, troncature sûre en
//! caractères (jamais au milieu d'un caractère UTF-8), format des jetons.

use serde_json::{json, Value};

/// Replie les lettres accentuées françaises (et quelques voisines) sur l'ASCII,
/// en minuscules. Sert aux comparaisons insensibles : liste noire d'artistes,
/// domaines jetables, mots de rue.
pub fn plier(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        let r = match c {
            'à' | 'â' | 'ä' | 'á' | 'ã' | 'å' | 'À' | 'Â' | 'Ä' | 'Á' | 'Ã' | 'Å' => 'a',
            'ç' | 'Ç' => 'c',
            'é' | 'è' | 'ê' | 'ë' | 'É' | 'È' | 'Ê' | 'Ë' => 'e',
            'î' | 'ï' | 'í' | 'ì' | 'Î' | 'Ï' | 'Í' | 'Ì' => 'i',
            'ô' | 'ö' | 'ó' | 'ò' | 'õ' | 'Ô' | 'Ö' | 'Ó' | 'Ò' | 'Õ' => 'o',
            'ù' | 'û' | 'ü' | 'ú' | 'Ù' | 'Û' | 'Ü' | 'Ú' => 'u',
            'ÿ' | 'Ÿ' | 'ý' | 'Ý' => 'y',
            'ñ' | 'Ñ' => 'n',
            'œ' | 'Œ' => {
                out.push('o');
                'e'
            }
            'æ' | 'Æ' => {
                out.push('a');
                'e'
            }
            '’' | '‘' | '`' | '´' => '\'',
            _ => c.to_ascii_lowercase(),
        };
        out.push(r);
    }
    out
}

/// Lettre ou chiffre, alphabets latins seulement (ASCII, Latin-1, Latin étendu A
/// et B). Remplace char::is_alphanumeric, dont les tables Unicode pèseraient
/// plusieurs dizaines de kilo-octets dans le .wasm pour un usage français.
pub fn alnum(c: char) -> bool {
    c.is_ascii_alphanumeric() || (('À'..='ɏ').contains(&c) && c != '×' && c != '÷')
}

/// Tronque à `max` caractères (et non octets).
pub fn tronquer(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        return s.to_string();
    }
    s.chars().take(max).collect()
}

/// Nombre de caractères (et non d'octets).
pub fn longueur(s: &str) -> usize {
    s.chars().count()
}

/// Lecture tolérante d'un champ texte d'un objet JSON.
pub fn champ<'a>(v: &'a Value, cle: &str) -> &'a str {
    v.get(cle).and_then(|x| x.as_str()).unwrap_or("").trim()
}

/// Alphabet base32 de Crockford, sans I, L, O ni U : pas de confusion à la
/// recopie d'un lien imprimé, pas de mot grossier possible par accident.
pub const CROCKFORD: &str = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/// Un jeton de mémorial : 10 à 12 caractères Crockford, rien d'autre.
/// Aucun nom ne peut s'y glisser, puisque les voyelles I, O, U et la lettre L
/// sont exclues et que la longueur est bornée.
pub fn jeton_valide(j: &str) -> bool {
    let n = j.chars().count();
    (10..=12).contains(&n) && j.chars().all(|c| CROCKFORD.contains(c))
}

pub fn jeton_json(entree: &str) -> String {
    let v: Value = serde_json::from_str(entree).unwrap_or(Value::Null);
    let j = v.get("jeton").and_then(|x| x.as_str()).unwrap_or("");
    json!({ "valide": jeton_valide(j) }).to_string()
}

pub fn s_de(v: &Value, k: &str) -> String {
    v.get(k).and_then(|x| x.as_str()).unwrap_or("").to_string()
}
pub fn b_de(v: &Value, k: &str) -> bool {
    v.get(k).and_then(|x| x.as_bool()).unwrap_or(false)
}
pub fn i_opt(v: &Value, k: &str) -> Option<i64> {
    v.get(k).and_then(|x| x.as_i64())
}
pub fn f_opt(v: &Value, k: &str) -> Option<f64> {
    v.get(k).and_then(|x| x.as_f64())
}
pub fn liste_s(v: &Value, k: &str) -> Vec<String> {
    v.get(k)
        .and_then(|x| x.as_array())
        .map(|a| a.iter().filter_map(|s| s.as_str()).map(|s| s.to_string()).collect())
        .unwrap_or_default()
}
/// Objet JSON, ou None si l'entrée n'en est pas un.
pub fn objet(entree: &str) -> Option<Value> {
    serde_json::from_str::<Value>(entree).ok().filter(|v| v.is_object())
}

pub fn erreur(code: &str, message: &str) -> String {
    json!({ "ok": false, "erreur": code, "message": message }).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plie_les_accents() {
        assert_eq!(plier("Édith Piaf"), "edith piaf");
        assert_eq!(plier("Cœur"), "coeur");
    }

    #[test]
    fn tronque_en_caracteres() {
        assert_eq!(tronquer("ééééé", 3), "ééé");
    }

    #[test]
    fn jetons() {
        assert!(jeton_valide("7K3M9QXT2B"));
        assert!(jeton_valide("7K3M9QXT2BZZ"));
        assert!(!jeton_valide("7K3M9QXT2")); // trop court
        assert!(!jeton_valide("JEANDUPONTXX")); // U interdit
        assert!(!jeton_valide("7k3m9qxt2b")); // minuscules refusées
        assert!(!jeton_valide("MARIE-LOUISE"));
    }
}
