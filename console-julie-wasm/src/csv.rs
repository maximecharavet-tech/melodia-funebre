//! Parseur CSV tolérant (quotes, `;`, `,`, tabulation, BOM) + détection de colonnes.

use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug, Default)]
pub struct Entree {
    #[serde(default)]
    pub texte: String,
}

#[derive(Serialize)]
pub struct Resultat {
    pub entetes: Vec<String>,
    pub lignes: Vec<Vec<String>>,
    pub separateur: String,
}

fn choisir_separateur(texte: &str) -> char {
    // Compte les occurrences de chaque candidat sur la première ligne non vide.
    let premiere = texte.lines().find(|l| !l.trim().is_empty()).unwrap_or("");
    let mut best = (';', 0usize);
    for cand in [';', ',', '\t'] {
        let n = premiere.matches(cand).count();
        if n > best.1 {
            best = (cand, n);
        }
    }
    best.0
}

pub fn parser(texte: &str) -> Resultat {
    let texte = texte.strip_prefix('\u{feff}').unwrap_or(texte);
    let sep = choisir_separateur(texte);
    let mut lignes: Vec<Vec<String>> = Vec::new();
    let mut courante: Vec<String> = Vec::new();
    let mut champ = String::new();
    let mut en_quote = false;
    let mut prev_quote = false;

    let push_ligne = |lignes: &mut Vec<Vec<String>>, courante: &mut Vec<String>, champ: &mut String| {
        courante.push(std::mem::take(champ));
        lignes.push(std::mem::take(courante));
    };

    for c in texte.chars() {
        if en_quote {
            if c == '"' {
                if prev_quote {
                    champ.push('"');
                    prev_quote = false;
                } else {
                    prev_quote = true;
                }
            } else {
                if prev_quote {
                    en_quote = false;
                    prev_quote = false;
                    // traiter c comme hors quote
                    match c {
                        '\r' => {}
                        '\n' => {
                            push_ligne(&mut lignes, &mut courante, &mut champ);
                        }
                        s if s == sep => {
                            courante.push(std::mem::take(&mut champ));
                        }
                        _ => champ.push(c),
                    }
                } else {
                    champ.push(c);
                }
            }
        } else {
            match c {
                '"' => {
                    en_quote = true;
                    prev_quote = false;
                }
                '\r' => {}
                '\n' => {
                    push_ligne(&mut lignes, &mut courante, &mut champ);
                }
                s if s == sep => {
                    courante.push(std::mem::take(&mut champ));
                }
                _ => champ.push(c),
            }
        }
    }
    if !champ.is_empty() || !courante.is_empty() {
        push_ligne(&mut lignes, &mut courante, &mut champ);
    }

    // Normalise : trime chaque cellule, retire les lignes entièrement vides.
    let mut entetes: Vec<String> = Vec::new();
    let mut out: Vec<Vec<String>> = Vec::new();
    for (i, ligne) in lignes.into_iter().enumerate() {
        let l: Vec<String> = ligne.into_iter().map(|s| s.trim().to_string()).collect();
        if l.iter().all(|s| s.is_empty()) {
            continue;
        }
        if i == 0 {
            entetes = l;
        } else {
            out.push(l);
        }
    }

    Resultat { entetes, lignes: out, separateur: sep.to_string() }
}

pub fn parser_json(input: &str) -> String {
    match serde_json::from_str::<Entree>(input) {
        Ok(e) => serde_json::to_string(&parser(&e.texte))
            .unwrap_or_else(|err| serde_json::json!({ "error": err.to_string() }).to_string()),
        Err(err) => serde_json::json!({ "error": err.to_string() }).to_string(),
    }
}

// ─── Détection de colonnes ──────────────────────────────────────────────

const ALIASES: &[(&str, &[&str])] = &[
    ("nom", &["nom", "raison sociale", "agence", "entreprise", "nom commercial", "société", "societe"]),
    ("email", &["email", "e-mail", "courriel", "mail", "adresse email"]),
    ("tel", &["tel", "tél", "telephone", "téléphone", "phone", "portable"]),
    ("site", &["site", "web", "url", "site web", "site internet"]),
    ("ville", &["ville", "commune", "localité", "localite"]),
    ("cp", &["cp", "code postal", "zip", "postal"]),
    ("siret", &["siret", "siren", "num siret"]),
    ("dirigeant", &["dirigeant", "directeur", "gérant", "gerant", "responsable", "président", "president"]),
    ("type", &["type", "catégorie", "categorie", "secteur", "activité", "activite"]),
    ("adresse", &["adresse", "rue", "voie"]),
    ("departement", &["departement", "département", "dep", "dép"]),
    ("effectif", &["effectif", "taille", "salariés", "salaries"]),
];

fn normalise(s: &str) -> String {
    s.trim()
        .to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn detecter(entetes: &[String]) -> serde_json::Value {
    let mut mapping = serde_json::Map::new();
    let mut reconnues: Vec<String> = Vec::new();
    let mut inconnues: Vec<String> = Vec::new();
    for h in entetes {
        let n = normalise(h);
        let mut matched: Option<&str> = None;
        'outer: for (champ, alias) in ALIASES {
            for a in *alias {
                if n == *a {
                    matched = Some(champ);
                    break 'outer;
                }
            }
        }
        if matched.is_none() {
            'outer2: for (champ, alias) in ALIASES {
                for a in *alias {
                    if n.contains(a) || a.contains(&n.as_str()) {
                        matched = Some(champ);
                        break 'outer2;
                    }
                }
            }
        }
        if let Some(c) = matched {
            mapping.insert(h.clone(), serde_json::Value::String(c.into()));
            reconnues.push(h.clone());
        } else {
            inconnues.push(h.clone());
        }
    }
    serde_json::json!({
        "mapping": mapping,
        "colonnes_reconnues": reconnues,
        "colonnes_inconnues": inconnues,
    })
}

pub fn detecter_json(input: &str) -> String {
    match serde_json::from_str::<Vec<String>>(input) {
        Ok(v) => detecter(&v).to_string(),
        Err(err) => serde_json::json!({ "error": err.to_string() }).to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simple_semicolon() {
        let r = parser("nom;email;ville\nMartin;contact@martin.fr;Lyon");
        assert_eq!(r.separateur, ";");
        assert_eq!(r.entetes, vec!["nom", "email", "ville"]);
        assert_eq!(r.lignes[0], vec!["Martin", "contact@martin.fr", "Lyon"]);
    }

    #[test]
    fn quotes_internes() {
        let r = parser("nom;email\n\"Martin \"\"Frères\"\"\";\"contact@mf.fr\"");
        assert_eq!(r.lignes[0][0], "Martin \"Frères\"");
        assert_eq!(r.lignes[0][1], "contact@mf.fr");
    }

    #[test]
    fn tab_separated() {
        let r = parser("nom\temail\nMartin\tcontact@x.fr");
        assert_eq!(r.separateur, "\t");
        assert_eq!(r.entetes.len(), 2);
    }

    #[test]
    fn detection_colonnes() {
        let entetes = vec!["Raison sociale".to_string(), "Courriel".to_string(), "Code postal".to_string(), "Blah".to_string()];
        let v = detecter(&entetes);
        let map = v.get("mapping").unwrap().as_object().unwrap();
        assert_eq!(map.get("Raison sociale").unwrap(), "nom");
        assert_eq!(map.get("Courriel").unwrap(), "email");
        assert_eq!(map.get("Code postal").unwrap(), "cp");
        assert!(map.get("Blah").is_none());
    }
}
