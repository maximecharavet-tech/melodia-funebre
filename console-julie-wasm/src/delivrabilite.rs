//! Vérificateur de délivrabilité A–F. Score au clavier (debounce côté JS).
//! Règles : mots spam FR/EN, MAJUSCULES, `!`, `€` objet, longueurs, liens, variables,
//! image seule, poids pièces jointes, personnalisation, désabonnement.

use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug, Default)]
pub struct Entree {
    #[serde(default)]
    pub objet: String,
    #[serde(default)]
    pub preheader: String,
    #[serde(default)]
    pub texte: String,
    #[serde(default)]
    pub html: String,
    #[serde(default)]
    pub liens: Vec<String>,
    #[serde(default)]
    pub piece_jointe_ko: bool,
    #[serde(default)]
    pub poids_pieces_octets: u64,
    #[serde(default)]
    pub variables_non_resolues: Vec<String>,
    #[serde(default)]
    pub personnalise: bool,
    #[serde(default)]
    pub a_desabonnement: bool,
}

#[derive(Serialize)]
pub struct Resultat {
    pub score: i64,
    pub note: String,
    pub problemes: Vec<String>,
    pub ok: Vec<String>,
}

const SPAM_WORDS: &[&str] = &[
    "gratuit", "gratuite", "100 %", "100%", "urgent", "cliquez ici", "offre exceptionnelle",
    "sans engagement", "promotion", "soldes", "cash", "argent facile", "gagnez",
    "free", "act now", "click here", "limited time", "buy now", "winner", "cash",
];

const SHORTENERS: &[&str] = &[
    "bit.ly", "goo.gl", "tinyurl.com", "t.co", "ow.ly", "is.gd", "buff.ly",
    "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy",
];

fn compte_mots(s: &str) -> usize {
    s.split(|c: char| c.is_whitespace() || c == ',' || c == ';' || c == '.')
        .filter(|w| !w.is_empty())
        .count()
}

fn ratio_majuscules(s: &str) -> f64 {
    let lettres: Vec<char> = s.chars().filter(|c| c.is_alphabetic()).collect();
    if lettres.is_empty() {
        return 0.0;
    }
    let maj = lettres.iter().filter(|c| c.is_uppercase()).count();
    maj as f64 / lettres.len() as f64
}

fn domaine(url: &str) -> Option<String> {
    let s = url.trim();
    let after_scheme = if let Some(i) = s.find("://") { &s[i + 3..] } else { s };
    let host = after_scheme.split(|c| c == '/' || c == '?' || c == '#').next()?;
    let host = host.split('@').last()?.split(':').next()?;
    if host.is_empty() {
        None
    } else {
        Some(host.to_lowercase())
    }
}

pub fn verifier(e: &Entree) -> Resultat {
    let mut problemes = Vec::new();
    let mut ok = Vec::new();
    let mut malus: i64 = 0;

    // Sujet : longueur idéale 30–60
    let obj_len = e.objet.chars().count();
    if obj_len == 0 {
        problemes.push("Objet vide".into());
        malus += 25;
    } else if obj_len < 20 {
        problemes.push(format!("Objet court ({} caractères, idéal 30–60)", obj_len));
        malus += 8;
    } else if obj_len > 90 {
        problemes.push(format!("Objet long ({} caractères, idéal 30–60)", obj_len));
        malus += 8;
    } else if obj_len > 60 && obj_len <= 90 {
        // acceptable
        ok.push(format!("Objet : {} caractères", obj_len));
    } else {
        ok.push(format!("Objet : {} caractères", obj_len));
    }

    if e.objet.contains('€') {
        problemes.push("Symbole € dans l'objet (fréquemment filtré)".into());
        malus += 12;
    }
    if e.objet.matches('!').count() > 1 {
        problemes.push("Plus d'un « ! » dans l'objet".into());
        malus += 6;
    }
    if !e.objet.is_empty() && ratio_majuscules(&e.objet) > 0.5 {
        problemes.push("Objet majoritairement en MAJUSCULES".into());
        malus += 10;
    }

    // Preheader
    if e.preheader.trim().is_empty() {
        problemes.push("Pas de preheader (aperçu dans la boîte de réception)".into());
        malus += 5;
    } else if e.preheader.chars().count() > 140 {
        problemes.push("Preheader trop long (140 caractères max)".into());
        malus += 3;
    } else {
        ok.push("Preheader présent".into());
    }

    // Mots spam
    let texte_lower = format!("{} {} {}", e.objet, e.preheader, e.texte).to_lowercase();
    let mut hits: Vec<&str> = Vec::new();
    for w in SPAM_WORDS {
        if texte_lower.contains(w) {
            hits.push(w);
        }
    }
    if !hits.is_empty() {
        problemes.push(format!("Mots à risque : {}", hits.join(", ")));
        malus += (hits.len() as i64) * 6;
    } else {
        ok.push("Aucun mot spam détecté".into());
    }

    // Ratio majuscules dans le corps
    if ratio_majuscules(&e.texte) > 0.35 {
        problemes.push("Corps du texte majoritairement en MAJUSCULES".into());
        malus += 10;
    }

    // Liens
    let nb_liens = e.liens.len();
    if nb_liens > 3 {
        problemes.push(format!("{} liens (max 3 recommandé)", nb_liens));
        malus += ((nb_liens as i64) - 3) * 3;
    } else {
        ok.push(format!("{} lien(s)", nb_liens));
    }
    for l in &e.liens {
        if let Some(d) = domaine(l) {
            if SHORTENERS.iter().any(|s| &d == s) {
                problemes.push(format!("Raccourcisseur détecté : {}", d));
                malus += 12;
            } else if !(d == "melodia-funebre.fr" || d.ends_with(".melodia-funebre.fr")) {
                problemes.push(format!("Lien externe : {}", d));
                malus += 5;
            }
        } else {
            problemes.push(format!("URL invalide : {}", l));
            malus += 4;
        }
    }

    // Variables non résolues
    if !e.variables_non_resolues.is_empty() {
        problemes.push(format!(
            "Variables non résolues : {}",
            e.variables_non_resolues.join(", ")
        ));
        malus += (e.variables_non_resolues.len() as i64) * 5;
    } else {
        ok.push("Toutes les variables sont résolues".into());
    }

    // Longueur du texte (120–180 mots idéal pour un premier contact)
    let mots = compte_mots(&e.texte);
    if mots == 0 {
        problemes.push("Corps vide".into());
        malus += 25;
    } else if mots < 60 {
        problemes.push(format!("Texte court ({} mots, idéal 120–180)", mots));
        malus += 4;
    } else if mots > 300 {
        problemes.push(format!("Texte long ({} mots, idéal 120–180)", mots));
        malus += 4;
    } else {
        ok.push(format!("{} mots", mots));
    }

    // Image seule
    let texte_sans_html = strip_html(&e.texte);
    if !e.html.is_empty() && texte_sans_html.trim().is_empty() {
        problemes.push("Courriel en image seule (texte manquant)".into());
        malus += 18;
    }

    // Pièces jointes
    if e.piece_jointe_ko {
        problemes.push("Pièce jointe refusée (format ou taille)".into());
        malus += 15;
    } else if e.poids_pieces_octets > 3 * 1024 * 1024 {
        problemes.push(format!(
            "Pièces jointes lourdes ({} Ko, > 3 Mo)",
            e.poids_pieces_octets / 1024
        ));
        malus += 8;
    }

    // Personnalisation
    if !e.personnalise {
        problemes.push("Aucune personnalisation détectée".into());
        malus += 8;
    } else {
        ok.push("Personnalisation présente".into());
    }

    // Désabonnement
    if e.a_desabonnement {
        ok.push("Désabonnement présent".into());
    } else {
        problemes.push("Lien de désabonnement manquant (STOP texte)".into());
        malus += 10;
    }

    let score = (100 - malus).clamp(0, 100);
    let note = match score {
        90..=100 => "A",
        75..=89 => "B",
        60..=74 => "C",
        45..=59 => "D",
        30..=44 => "E",
        _ => "F",
    }
    .to_string();

    Resultat { score, note, problemes, ok }
}

fn strip_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut in_tag = false;
    for c in s.chars() {
        match c {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(c),
            _ => {}
        }
    }
    out
}

pub fn verifier_json(input: &str) -> String {
    match serde_json::from_str::<Entree>(input) {
        Ok(e) => serde_json::to_string(&verifier(&e))
            .unwrap_or_else(|err| serde_json::json!({ "error": err.to_string() }).to_string()),
        Err(err) => serde_json::json!({ "error": err.to_string() }).to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bon_courriel_note_a() {
        let e = Entree {
            objet: "Une chanson pour les familles de Martin".into(),
            preheader: "Découvrez notre partenariat Melodia".into(),
            texte: "Bonjour Madame, je me permets de vous écrire pour vous présenter \
                notre service de composition musicale sur mesure. Chaque chanson est \
                livrée en vingt-quatre heures, jouée à la cérémonie et conservée par \
                la famille. Nous partageons soixante pour cent du montant avec \
                l'agence partenaire. Seriez-vous disponible quelques minutes cette \
                semaine pour en parler ?"
                .into(),
            html: "<p>Bonjour</p>".into(),
            liens: vec!["https://melodia-funebre.fr/professionnels".into()],
            piece_jointe_ko: false,
            poids_pieces_octets: 200_000,
            variables_non_resolues: vec![],
            personnalise: true,
            a_desabonnement: true,
        };
        let r = verifier(&e);
        assert!(matches!(r.note.as_str(), "A" | "B"), "note = {}", r.note);
        assert!(r.problemes.is_empty() || r.problemes.len() <= 1, "{:?}", r.problemes);
    }

    #[test]
    fn mauvais_courriel_note_f() {
        let e = Entree {
            objet: "GRATUIT !!! URGENT".into(),
            preheader: "".into(),
            texte: "CLIQUEZ ICI".into(),
            html: "".into(),
            liens: vec!["https://bit.ly/xyz".into(), "https://a.fr".into(), "https://b.fr".into(), "https://c.fr".into()],
            piece_jointe_ko: true,
            poids_pieces_octets: 10_000_000,
            variables_non_resolues: vec!["{agence}".into(), "{ville}".into()],
            personnalise: false,
            a_desabonnement: false,
        };
        let r = verifier(&e);
        assert!(matches!(r.note.as_str(), "E" | "F"), "note = {}", r.note);
    }
}
