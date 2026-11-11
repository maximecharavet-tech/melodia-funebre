//! Questionnaire en sept étapes : schéma, validation, complétude, et retrait
//! des données sensibles avant tout envoi à un fournisseur de composition.
//!
//! Le questionnaire est un objet JSON plat par étape :
//!   { "defunt": {...}, "vie": {...}, "musique": {...}, "ceremonie": {...},
//!     "message": {...}, "consentements": {...}, "offre": {...} }

use crate::texte::{champ, longueur, plier};
use serde_json::{json, Value};

pub const ANECDOTE_MAX: usize = 1500;
pub const CHAMP_MAX: usize = 600;

pub const ETAPES: &[&str] = &["defunt", "vie", "musique", "ceremonie", "message", "consentements", "offre"];

const GENRES: &[&str] = &["il", "elle", "iel"];
const VOIX: &[&str] = &["homme", "femme", "choeur", "instrumental"];
const ADRESSES: &[&str] = &["tu", "il_elle", "nous"];
const VISIBILITES: &[&str] = &["public", "lien", "code", "non"];

fn liste(v: &Value, cle: &str) -> Vec<String> {
    v.get(cle)
        .and_then(|x| x.as_array())
        .map(|a| a.iter().filter_map(|s| s.as_str()).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect())
        .unwrap_or_default()
}

fn vrai(v: &Value, cle: &str) -> bool {
    v.get(cle).and_then(|x| x.as_bool()).unwrap_or(false)
}

/// Rend (manquants, erreurs) pour une étape.
fn verifier_etape(nom: &str, q: &Value) -> (Vec<String>, Vec<String>) {
    let e = q.get(nom).cloned().unwrap_or(Value::Null);
    let mut manq: Vec<String> = Vec::new();
    let mut err: Vec<String> = Vec::new();
    let mut requis = |cle: &str, ok: bool| {
        if !ok {
            manq.push(format!("{nom}.{cle}"));
        }
    };
    match nom {
        "defunt" => {
            requis("prenom", !champ(&e, "prenom").is_empty());
            let g = champ(&e, "genre");
            requis("genre", !g.is_empty());
            if !g.is_empty() && !GENRES.contains(&g) {
                err.push("defunt.genre".into());
            }
        }
        "vie" => {
            let traits = liste(&e, "traits");
            requis("traits", !traits.is_empty() || !champ(&e, "traits_libre").is_empty());
            requis("metier", !champ(&e, "metier").is_empty() || !champ(&e, "passion").is_empty());
            if longueur(champ(&e, "anecdote")) > ANECDOTE_MAX {
                err.push("vie.anecdote".into());
            }
            // Un proche nommé exige le consentement de qui remplit le dossier.
            if !liste(&e, "proches").is_empty() && !vrai(&e, "proches_consentement") {
                err.push("vie.proches_consentement".into());
            }
        }
        "musique" => {
            requis("style", !champ(&e, "style").is_empty());
            let v = champ(&e, "voix");
            requis("voix", !v.is_empty());
            if !v.is_empty() && !VOIX.contains(&v) {
                err.push("musique.voix".into());
            }
            if let Some(n) = e.get("energie").and_then(|x| x.as_i64()) {
                if !(0..=100).contains(&n) {
                    err.push("musique.energie".into());
                }
            }
        }
        "ceremonie" => {
            requis("date_limite", !champ(&e, "date_limite").is_empty());
        }
        "message" => {
            requis("ton", !champ(&e, "ton").is_empty());
            let a = champ(&e, "adresse");
            if !a.is_empty() && !ADRESSES.contains(&a) {
                err.push("message.adresse".into());
            }
        }
        "consentements" => {
            requis("rgpd", vrai(&e, "rgpd"));
            requis("relecture_famille", e.get("relecture_famille").map(|x| x.is_boolean()).unwrap_or(false));
            let vis = champ(&e, "visibilite");
            requis("visibilite", !vis.is_empty());
            if !vis.is_empty() && !VISIBILITES.contains(&vis) {
                err.push("consentements.visibilite".into());
            }
        }
        "offre" => {
            let mode = champ(&e, "mode");
            requis("mode", mode == "payant" || mode == "essai");
            if mode == "payant" {
                requis("offre_id", !champ(&e, "offre_id").is_empty());
            }
        }
        _ => {}
    }
    // Aucun champ texte ne dépasse la borne générale (l'anecdote a la sienne).
    if let Some(obj) = e.as_object() {
        for (k, val) in obj {
            if let Some(s) = val.as_str() {
                let max = if k == "anecdote" { ANECDOTE_MAX } else { CHAMP_MAX };
                if longueur(s) > max && !err.iter().any(|x| x.ends_with(k.as_str())) {
                    err.push(format!("{nom}.{k}"));
                }
            }
        }
    }
    (manq, err)
}

pub fn valider(q: &Value) -> Value {
    let mut etapes = Vec::new();
    let mut total_manq = 0;
    let mut total_err = 0;
    let mut completes = 0;
    for (i, nom) in ETAPES.iter().enumerate() {
        let (m, e) = verifier_etape(nom, q);
        let complete = m.is_empty() && e.is_empty();
        if complete {
            completes += 1;
        }
        total_manq += m.len();
        total_err += e.len();
        etapes.push(json!({ "n": i + 1, "nom": nom, "complete": complete, "manquants": m, "erreurs": e }));
    }
    json!({
        "complet": total_manq == 0 && total_err == 0,
        "pourcentage": completes * 100 / ETAPES.len(),
        "etapes": etapes,
        "nb_manquants": total_manq,
        "nb_erreurs": total_err
    })
}

pub fn valider_json(entree: &str) -> String {
    let q: Value = serde_json::from_str(entree).unwrap_or(Value::Null);
    valider(&q).to_string()
}

// ─── Données sensibles ──────────────────────────────────────────────────

const MOTS_VOIE: &[&str] = &[
    "rue", "avenue", "av", "boulevard", "bd", "chemin", "allee", "impasse", "place", "route",
    "quai", "cours", "square", "lieu-dit", "lieudit", "passage", "faubourg", "residence", "hameau",
];

#[derive(Clone, Copy, PartialEq)]
enum Genre {
    Email,
    Telephone,
    Iban,
    Numero,
    Adresse,
}

impl Genre {
    fn remplacement(self) -> &'static str {
        match self {
            Genre::Email => "[e-mail retiré]",
            Genre::Telephone => "[téléphone retiré]",
            Genre::Iban => "[IBAN retiré]",
            Genre::Numero => "[numéro retiré]",
            Genre::Adresse => "[adresse retirée]",
        }
    }
    fn nom(self) -> &'static str {
        match self {
            Genre::Email => "email",
            Genre::Telephone => "telephone",
            Genre::Iban => "iban",
            Genre::Numero => "numero",
            Genre::Adresse => "adresse",
        }
    }
}

fn est_mot(c: char) -> bool {
    crate::texte::alnum(c) || c == '-' || c == '\'' || c == '’'
}

/// Rend la fin (exclue) d'un e-mail commençant en `i`, s'il y en a un.
fn email_a(ch: &[char], i: usize) -> Option<usize> {
    let ok_local = |c: char| crate::texte::alnum(c) || "._%+-".contains(c);
    if i > 0 && ok_local(ch[i - 1]) {
        return None;
    }
    let mut j = i;
    while j < ch.len() && ok_local(ch[j]) {
        j += 1;
    }
    if j == i || j >= ch.len() || ch[j] != '@' {
        return None;
    }
    let mut k = j + 1;
    let debut_dom = k;
    while k < ch.len() && (crate::texte::alnum(ch[k]) || ch[k] == '.' || ch[k] == '-') {
        k += 1;
    }
    while k > debut_dom && ch[k - 1] == '.' {
        k -= 1;
    }
    let dom: String = ch[debut_dom..k].iter().collect();
    if dom.contains('.') && !dom.starts_with('.') {
        Some(k)
    } else {
        None
    }
}

/// Suite de chiffres avec séparateurs (espace, point, tiret, slash) : rend
/// (fin, nombre de chiffres, préfixe +).
fn suite_chiffres(ch: &[char], i: usize) -> Option<(usize, usize, bool)> {
    let plus = ch[i] == '+';
    let mut j = if plus { i + 1 } else { i };
    if j >= ch.len() || !ch[j].is_ascii_digit() {
        return None;
    }
    if i > 0 && (crate::texte::alnum(ch[i - 1])) {
        return None;
    }
    let mut n = 0;
    let mut fin = j;
    while j < ch.len() {
        if ch[j].is_ascii_digit() {
            n += 1;
            j += 1;
            fin = j;
        } else if " .-/".contains(ch[j]) && j + 1 < ch.len() && ch[j + 1].is_ascii_digit() {
            j += 1;
        } else if ch[j] == '(' || ch[j] == ')' {
            j += 1;
        } else {
            break;
        }
    }
    Some((fin, n, plus))
}

fn iban_a(ch: &[char], i: usize) -> Option<usize> {
    if i + 4 > ch.len() || (i > 0 && crate::texte::alnum(ch[i - 1])) {
        return None;
    }
    if !(ch[i].is_ascii_uppercase() && ch[i + 1].is_ascii_uppercase() && ch[i + 2].is_ascii_digit() && ch[i + 3].is_ascii_digit()) {
        return None;
    }
    let mut j = i + 4;
    let mut n = 4;
    let mut fin = j;
    while j < ch.len() {
        if ch[j].is_ascii_alphanumeric() {
            n += 1;
            j += 1;
            fin = j;
        } else if ch[j] == ' ' && j + 1 < ch.len() && ch[j + 1].is_ascii_alphanumeric() {
            j += 1;
        } else {
            break;
        }
    }
    if (15..=34).contains(&n) {
        Some(fin)
    } else {
        None
    }
}

/// « 12 rue des Lilas », « 3 bis, avenue Foch » : numéro puis mot de voie,
/// puis les mots qui suivent jusqu'à la ponctuation forte ou la fin de ligne.
fn adresse_a(ch: &[char], i: usize) -> Option<usize> {
    if !ch[i].is_ascii_digit() || (i > 0 && crate::texte::alnum(ch[i - 1])) {
        return None;
    }
    let mut j = i;
    while j < ch.len() && ch[j].is_ascii_digit() {
        j += 1;
    }
    if j - i > 4 {
        return None;
    }
    // espaces, « bis/ter », virgule
    let sauter = |j: &mut usize| {
        while *j < ch.len() && (ch[*j] == ' ' || ch[*j] == ',') {
            *j += 1;
        }
    };
    sauter(&mut j);
    let mot = |j: usize| -> (String, usize) {
        let mut k = j;
        while k < ch.len() && est_mot(ch[k]) {
            k += 1;
        }
        (plier(&ch[j..k].iter().collect::<String>()), k)
    };
    let (m, k) = mot(j);
    let mut j = k;
    let m = if m == "bis" || m == "ter" {
        sauter(&mut j);
        let (m2, k2) = mot(j);
        j = k2;
        m2
    } else {
        m
    };
    let m = m.trim_end_matches('.').to_string();
    if !MOTS_VOIE.contains(&m.as_str()) {
        return None;
    }
    // la suite du nom de voie (au plus six mots)
    let mut mots = 0;
    while j < ch.len() && mots < 6 {
        if ch[j] == ' ' {
            j += 1;
            continue;
        }
        if !est_mot(ch[j]) {
            break;
        }
        while j < ch.len() && est_mot(ch[j]) {
            j += 1;
        }
        mots += 1;
    }
    Some(j)
}

pub fn nettoyer(texte: &str) -> (String, Vec<&'static str>) {
    let ch: Vec<char> = texte.chars().collect();
    let mut out = String::with_capacity(texte.len());
    let mut retraits: Vec<&'static str> = Vec::new();
    let mut i = 0;
    let mut noter = |g: Genre, out: &mut String| {
        out.push_str(g.remplacement());
        if !retraits.contains(&g.nom()) {
            retraits.push(g.nom());
        }
    };
    while i < ch.len() {
        if let Some(f) = email_a(&ch, i) {
            noter(Genre::Email, &mut out);
            i = f;
            continue;
        }
        if let Some(f) = iban_a(&ch, i) {
            noter(Genre::Iban, &mut out);
            i = f;
            continue;
        }
        if let Some(f) = adresse_a(&ch, i) {
            noter(Genre::Adresse, &mut out);
            i = f;
            continue;
        }
        if ch[i].is_ascii_digit() || ch[i] == '+' {
            if let Some((f, n, plus)) = suite_chiffres(&ch, i) {
                let debut: String = ch[i..f].iter().filter(|c| c.is_ascii_digit()).collect();
                let tel_fr = n == 10 && debut.starts_with('0') && !debut.starts_with("00");
                let tel_int = plus && (9..=15).contains(&n);
                let tel_00 = debut.starts_with("00") && (11..=15).contains(&n);
                if tel_fr || tel_int || tel_00 {
                    noter(Genre::Telephone, &mut out);
                    i = f;
                    continue;
                }
                if n >= 11 {
                    noter(Genre::Numero, &mut out);
                    i = f;
                    continue;
                }
            }
        }
        out.push(ch[i]);
        i += 1;
    }
    (out, retraits)
}

/// Nettoie récursivement toutes les chaînes d'un objet JSON.
pub fn nettoyer_valeur(v: &Value, retraits: &mut Vec<&'static str>) -> Value {
    match v {
        Value::String(s) => {
            let (t, r) = nettoyer(s);
            for x in r {
                if !retraits.contains(&x) {
                    retraits.push(x);
                }
            }
            Value::String(t)
        }
        Value::Array(a) => Value::Array(a.iter().map(|x| nettoyer_valeur(x, retraits)).collect()),
        Value::Object(o) => Value::Object(o.iter().map(|(k, x)| (k.clone(), nettoyer_valeur(x, retraits))).collect()),
        autre => autre.clone(),
    }
}

pub fn nettoyer_json(entree: &str) -> String {
    let v: Value = serde_json::from_str(entree).unwrap_or(Value::Null);
    let mut retraits = Vec::new();
    let propre = if let Some(t) = v.get("texte").and_then(|x| x.as_str()) {
        let (s, r) = nettoyer(t);
        retraits = r;
        json!(s)
    } else {
        nettoyer_valeur(v.get("valeur").unwrap_or(&Value::Null), &mut retraits)
    };
    json!({ "propre": propre, "retraits": retraits }).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    pub fn complet() -> Value {
        json!({
            "defunt": { "prenom": "Jeanne", "genre": "elle", "prononciation": "Jane" },
            "vie": { "traits": ["généreuse", "têtue"], "metier": "institutrice", "anecdote": "Elle chantait faux." },
            "musique": { "style": "chanson française", "voix": "femme", "energie": 30 },
            "ceremonie": { "rite": "civil", "date_limite": "2026-11-20T10:00" },
            "message": { "ton": "lumineux", "adresse": "tu" },
            "consentements": { "rgpd": true, "relecture_famille": true, "visibilite": "lien" },
            "offre": { "mode": "essai" }
        })
    }

    #[test]
    fn questionnaire_complet() {
        let r = valider(&complet());
        assert_eq!(r["complet"], true, "{r}");
        assert_eq!(r["pourcentage"], 100);
    }

    #[test]
    fn manquants_et_erreurs() {
        let mut q = complet();
        q["defunt"]["prenom"] = json!("");
        q["defunt"]["genre"] = json!("x");
        q["vie"]["anecdote"] = json!("a".repeat(1501));
        q["vie"]["proches"] = json!(["Paul"]);
        let r = valider(&q);
        assert_eq!(r["complet"], false);
        let e1 = &r["etapes"][0];
        assert!(e1["manquants"].to_string().contains("defunt.prenom"));
        assert!(e1["erreurs"].to_string().contains("defunt.genre"));
        let e2 = r["etapes"][1]["erreurs"].to_string();
        assert!(e2.contains("vie.anecdote") && e2.contains("proches_consentement"));
    }

    #[test]
    fn offre_payante_exige_une_offre() {
        let mut q = complet();
        q["offre"] = json!({ "mode": "payant" });
        let r = valider(&q);
        assert!(r["etapes"][6]["manquants"].to_string().contains("offre_id"));
    }

    #[test]
    fn retire_email_telephone_iban_adresse() {
        let t = "Écrire à paul.martin@exemple.fr ou au 06 12 34 56 78, IBAN FR76 3000 6000 0112 3456 7890 189. Il habitait 12 rue des Lilas, à Lyon.";
        let (s, r) = nettoyer(t);
        assert!(!s.contains("paul.martin"), "{s}");
        assert!(!s.contains("06 12"), "{s}");
        assert!(!s.contains("FR76"), "{s}");
        assert!(!s.contains("Lilas"), "{s}");
        assert!(s.contains("à Lyon"), "{s}");
        for g in ["email", "telephone", "iban", "adresse"] {
            assert!(r.contains(&g), "{g} absent de {r:?}");
        }
    }

    #[test]
    fn telephone_international_et_numero_long() {
        let (s, r) = nettoyer("Appelez le +33 6 12 34 56 78. Sécu 1 85 05 78 006 084 36.");
        assert!(s.contains("[téléphone retiré]"), "{s}");
        assert!(s.contains("[numéro retiré]"), "{s}");
        assert!(r.contains(&"numero"));
    }

    #[test]
    fn laisse_dates_et_annees() {
        let t = "Né en 1942, mort le 03/11/2026 à 84 ans, 3 enfants.";
        let (s, r) = nettoyer(t);
        assert_eq!(s, t);
        assert!(r.is_empty());
    }

    #[test]
    fn nettoie_un_objet() {
        let v = json!({ "a": "mail: x@y.fr", "b": ["tel 0612345678"] });
        let mut r = Vec::new();
        let p = nettoyer_valeur(&v, &mut r);
        assert!(p.to_string().contains("[e-mail retiré]") && p.to_string().contains("[téléphone retiré]"));
    }
}
