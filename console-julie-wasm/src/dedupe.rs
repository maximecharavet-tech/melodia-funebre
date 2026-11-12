//! Similarité (Jaro-Winkler + trigrammes), clé de dédoublonnage, suggestion de domaine.
//! Le domaine suit l'algorithme de mailcheck.js (MIT, kylehill) :

use serde::{Deserialize, Serialize};

// ─── Jaro-Winkler ─────────────────────────────────────────────────────

fn jaro(a: &str, b: &str) -> f64 {
    let a: Vec<char> = a.chars().collect();
    let b: Vec<char> = b.chars().collect();
    if a.is_empty() && b.is_empty() {
        return 1.0;
    }
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }
    let max_dist = (a.len().max(b.len()) / 2).saturating_sub(1);
    let mut a_match = vec![false; a.len()];
    let mut b_match = vec![false; b.len()];
    let mut matches = 0usize;
    for (i, &ca) in a.iter().enumerate() {
        let start = i.saturating_sub(max_dist);
        let end = (i + max_dist + 1).min(b.len());
        for j in start..end {
            if !b_match[j] && b[j] == ca {
                a_match[i] = true;
                b_match[j] = true;
                matches += 1;
                break;
            }
        }
    }
    if matches == 0 {
        return 0.0;
    }
    let mut transpositions = 0usize;
    let mut k = 0usize;
    for i in 0..a.len() {
        if a_match[i] {
            while !b_match[k] {
                k += 1;
            }
            if a[i] != b[k] {
                transpositions += 1;
            }
            k += 1;
        }
    }
    let m = matches as f64;
    (m / a.len() as f64 + m / b.len() as f64 + (m - (transpositions / 2) as f64) / m) / 3.0
}

fn jaro_winkler(a: &str, b: &str) -> f64 {
    let j = jaro(a, b);
    let prefix: usize = a
        .chars()
        .zip(b.chars())
        .take(4)
        .take_while(|(x, y)| x == y)
        .count();
    j + (prefix as f64) * 0.1 * (1.0 - j)
}

fn trigrammes(s: &str) -> Vec<String> {
    let s = format!("  {}  ", s.to_lowercase());
    let chars: Vec<char> = s.chars().collect();
    let mut out = Vec::new();
    for i in 0..chars.len().saturating_sub(2) {
        out.push(chars[i..i + 3].iter().collect::<String>());
    }
    out
}

fn trigram_sim(a: &str, b: &str) -> f64 {
    let ta = trigrammes(a);
    let tb = trigrammes(b);
    if ta.is_empty() && tb.is_empty() {
        return 1.0;
    }
    let inter = ta.iter().filter(|t| tb.contains(t)).count();
    let union = ta.len() + tb.len() - inter;
    if union == 0 {
        1.0
    } else {
        2.0 * inter as f64 / union as f64
    }
}

#[derive(Deserialize)]
struct SimIn {
    a: String,
    b: String,
}

#[derive(Serialize)]
struct SimOut {
    score: f64,
    methode: &'static str,
}

pub fn similarite_json(input: &str) -> String {
    match serde_json::from_str::<SimIn>(input) {
        Ok(s) => {
            let jw = jaro_winkler(&s.a, &s.b);
            let tri = trigram_sim(&s.a, &s.b);
            let score = (jw * 0.6 + tri * 0.4).clamp(0.0, 1.0);
            serde_json::to_string(&SimOut { score, methode: "jaro-winkler+trigram" }).unwrap_or_default()
        }
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    }
}

// ─── Clé de dédoublonnage ─────────────────────────────────────────────

#[derive(Deserialize)]
struct CleIn {
    #[serde(default)]
    siret: String,
    #[serde(default)]
    email: String,
    #[serde(default)]
    nom: String,
    #[serde(default)]
    cp: String,
}

#[derive(Serialize)]
struct CleOut {
    siret: String,
    email: String,
    nom_cp: String,
}

fn norm_email(s: &str) -> String {
    s.trim().to_lowercase()
}

fn norm_nom(s: &str) -> String {
    s.trim()
        .to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn cle_json(input: &str) -> String {
    match serde_json::from_str::<CleIn>(input) {
        Ok(c) => {
            let siret = c.siret.chars().filter(|x| x.is_ascii_digit()).collect::<String>();
            let out = CleOut {
                siret: siret,
                email: norm_email(&c.email),
                nom_cp: format!("{}|{}", norm_nom(&c.nom), c.cp.trim()),
            };
            serde_json::to_string(&out).unwrap_or_default()
        }
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    }
}


// ─── Clé d'idempotence d'un envoi ─────────────────────────────────────
// Miroir EXACT de cleEnvoi() dans api/_envoi-unique.js : la console grise
// « déjà envoyé » avec la même clé que celle qui bloque le serveur.
//   <destinataire normalisé>|m:<modèle> | c:<campagne> | o:<objet>[#e<étape>]

#[derive(Deserialize)]
struct EnvoiIn {
    #[serde(default)]
    destinataire: String,
    #[serde(default)]
    modele: String,
    #[serde(default)]
    campagne: String,
    #[serde(default)]
    sujet: String,
    #[serde(default)]
    etape: Option<i64>,
}

fn norm_texte_envoi(s: &str) -> String {
    s.to_lowercase()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(120)
        .collect::<String>()
}

pub fn cle_envoi_json(input: &str) -> String {
    match serde_json::from_str::<EnvoiIn>(input) {
        Ok(e) => {
            let dest = e.destinataire.trim().to_lowercase();
            let modele = e.modele.trim().to_lowercase();
            let campagne = e.campagne.trim().to_lowercase();
            let mut portee = if !modele.is_empty() {
                format!("m:{}", modele)
            } else if !campagne.is_empty() {
                format!("c:{}", campagne)
            } else {
                format!("o:{}", norm_texte_envoi(&e.sujet))
            };
            if let Some(n) = e.etape {
                portee.push_str(&format!("#e{}", n));
            }
            serde_json::json!({ "cle": format!("{}|{}", dest, portee) }).to_string()
        }
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    }
}

// ─── Suggestion de domaine ────────────────────────────────────────────

const DOMAINES: &[&str] = &[
    "gmail.com", "orange.fr", "wanadoo.fr", "hotmail.fr", "free.fr", "yahoo.fr",
    "outlook.fr", "sfr.fr", "laposte.net", "live.fr", "bbox.fr", "me.com", "icloud.com",
];

fn levenshtein(a: &str, b: &str) -> usize {
    let a: Vec<char> = a.chars().collect();
    let b: Vec<char> = b.chars().collect();
    let mut prev: Vec<usize> = (0..=b.len()).collect();
    let mut cur = vec![0; b.len() + 1];
    for i in 1..=a.len() {
        cur[0] = i;
        for j in 1..=b.len() {
            let cost = if a[i - 1] == b[j - 1] { 0 } else { 1 };
            cur[j] = (prev[j] + 1).min(cur[j - 1] + 1).min(prev[j - 1] + cost);
        }
        std::mem::swap(&mut prev, &mut cur);
    }
    prev[b.len()]
}

#[derive(Deserialize)]
struct DomIn {
    domaine: String,
}

pub fn domaine_json(input: &str) -> String {
    match serde_json::from_str::<DomIn>(input) {
        Ok(d) => {
            let dom = d.domaine.trim().to_lowercase();
            let mut best: Option<&str> = None;
            let mut best_dist = usize::MAX;
            for cand in DOMAINES {
                let dist = levenshtein(&dom, cand);
                if dist < best_dist && dist <= 2 {
                    best_dist = dist;
                    best = Some(cand);
                }
            }
            if let Some(b) = best {
                if b != dom {
                    serde_json::json!({ "suggestion": b }).to_string()
                } else {
                    serde_json::json!({ "suggestion": null }).to_string()
                }
            } else {
                serde_json::json!({ "suggestion": null }).to_string()
            }
        }
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn jw_identiques() {
        assert!(jaro_winkler("martin", "martin") > 0.999);
    }

    #[test]
    fn jw_proches() {
        let s: f64 = jaro_winkler("pompes funebres martin", "pompes funebres marti");
        assert!(s > 0.95, "s = {}", s);
    }

    #[test]
    fn simil_json() {
        let out = similarite_json(r#"{"a":"martin","b":"martin"}"#);
        assert!(out.contains("\"score\":1.0") || out.contains("\"score\":0.99"), "{}", out);
    }

    #[test]
    fn cle() {
        let out = cle_json(r#"{"siret":"123 456 789 00012","email":" A@B.FR ","nom":"  Pompes Martin ","cp":"69001"}"#);
        assert!(out.contains("\"siret\":\"12345678900012\""), "{}", out);
        assert!(out.contains("\"email\":\"a@b.fr\""), "{}", out);
        assert!(out.contains("\"nom_cp\":\"pompes martin|69001\""), "{}", out);
    }

    #[test]
    fn cle_envoi_normalisee() {
        let a = cle_envoi_json(r#"{"destinataire":" Foo@Bar.COM ","modele":"PF-Relance-J4"}"#);
        let b = cle_envoi_json(r#"{"destinataire":"foo@bar.com","modele":"pf-relance-j4"}"#);
        assert_eq!(a, b);
        assert!(a.contains("foo@bar.com|m:pf-relance-j4"), "{}", a);
    }

    #[test]
    fn cle_envoi_portees() {
        let m = cle_envoi_json(r#"{"destinataire":"a@b.fr","modele":"x","etape":1}"#);
        assert!(m.contains("a@b.fr|m:x#e1"), "{}", m);
        let c = cle_envoi_json(r#"{"destinataire":"a@b.fr","campagne":"Salon"}"#);
        assert!(c.contains("a@b.fr|c:salon"), "{}", c);
        let o = cle_envoi_json(r#"{"destinataire":"a@b.fr","sujet":"  Bonjour   MONDE "}"#);
        assert!(o.contains("a@b.fr|o:bonjour monde"), "{}", o);
        assert_ne!(
            cle_envoi_json(r#"{"destinataire":"a@b.fr","modele":"x","etape":1}"#),
            cle_envoi_json(r#"{"destinataire":"a@b.fr","modele":"x","etape":2}"#)
        );
    }

    #[test]
    fn suggestion_domaine() {
        let out = domaine_json(r#"{"domaine":"gmial.com"}"#);
        assert!(out.contains("gmail.com"), "{}", out);
    }
}
