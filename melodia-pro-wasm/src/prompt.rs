//! Construction déterministe des consignes envoyées aux fournisseurs.
//!
//! Deux sorties :
//!  - `consigne_paroles` : la consigne de l'agent parolier (français), qui rend
//!    titre, paroles et une proposition de prompt musical ;
//!  - `prompt_musique` : la description musicale (anglais, ≤ 500 caractères),
//!    socle déterministe tiré du questionnaire + proposition de l'agent
//!    assainie. Le conseiller la relit et peut la corriger avant l'envoi.
//!
//! Règles :
//!  - les artistes aimés ne sortent JAMAIS du questionnaire : ils ne sont ni
//!    nommés ni imités, dans aucune consigne ;
//!  - toute proposition de l'agent est filtrée (liste noire d'artistes, artistes
//!    saisis par la famille, tournures « in the style of », noms de
//!    fournisseurs) ;
//!  - les données sensibles (téléphone, e-mail, IBAN, adresse) sont retirées ;
//!  - paroles bornées à 3 000 caractères, prompt musical à 500.

use crate::questionnaire::{nettoyer, nettoyer_valeur};
use crate::texte::{champ, plier, tronquer};
use serde_json::{json, Value};

pub const PROMPT_MUSIQUE_MAX: usize = 500;
pub const PAROLES_MAX: usize = 3000;
pub const CONSIGNE_MAX: usize = 6000;

/// Artistes qu'aucun prompt ne doit citer (formes repliées, minuscules).
/// La liste n'est pas exhaustive : elle s'ajoute aux artistes saisis par la
/// famille, et aux tournures d'imitation filtrées plus bas.
const ARTISTES: &[&str] = &[
    "edith piaf", "piaf", "jacques brel", "brel", "charles aznavour", "aznavour", "georges brassens",
    "brassens", "barbara", "johnny hallyday", "hallyday", "celine dion", "michel sardou", "sardou",
    "francis cabrel", "cabrel", "jean-jacques goldman", "goldman", "serge gainsbourg", "gainsbourg",
    "renaud", "alain souchon", "souchon", "julien clerc", "michel berger", "france gall",
    "dalida", "claude francois", "joe dassin", "dassin", "mylene farmer", "stromae", "angele",
    "zaz", "indila", "louane", "vianney", "kendji girac", "christophe mae", "calogero",
    "patrick bruel", "bruel", "florent pagny", "pagny", "garou", "lara fabian", "yves montand",
    "jean ferrat", "ferrat", "leo ferre", "nana mouskouri", "mireille mathieu", "enrico macias",
    "adamo", "hugues aufray", "maxime le forestier", "jean-louis aubert", "noir desir",
    "indochine", "the beatles", "beatles", "elvis presley", "elvis", "frank sinatra", "sinatra",
    "adele", "taylor swift", "ed sheeran", "beyonce", "rihanna", "madonna", "michael jackson",
    "whitney houston", "leonard cohen", "bob dylan", "dylan", "johnny cash", "eric clapton",
    "queen", "freddie mercury", "pink floyd", "coldplay", "u2", "abba", "andrea bocelli",
    "bocelli", "luciano pavarotti", "pavarotti", "ennio morricone", "morricone", "hans zimmer",
    "yann tiersen", "ludovico einaudi", "einaudi", "amy winehouse", "nina simone", "louis armstrong",
    "ray charles", "aretha franklin", "billie eilish", "bruno mars", "sting", "phil collins",
    "david bowie", "bowie", "elton john", "mariah carey", "celine", "aya nakamura", "jul", "pnl",
    "orelsan", "booba", "nekfeu", "gims", "maitre gims", "soprano", "black m",
];

/// Fournisseurs : jamais nommés hors du serveur (marque blanche).
const FOURNISSEURS: &[&str] = &["mureka", "suno", "udio", "mistral", "openai", "chatgpt", "gpt", "skywork", "pollinations"];

/// Tournures d'imitation : un segment qui en contient une est retiré.
const IMITATION: &[&str] = &[
    "style of", "in the vein of", "inspired by", "sounds like", "reminiscent of", "like ", "a la maniere",
    "facon ", "comme ", "fa\u{e7}on ", "tribute to", "cover of", "imitat", "voice of", "similar to",
];

fn mots_de(s: &str) -> Vec<String> {
    plier(s)
        .split(|c: char| !(crate::texte::alnum(c) || c == '-' || c == '\''))
        .filter(|w| !w.is_empty())
        .map(|w| w.to_string())
        .collect()
}

/// `nom` (plusieurs mots possibles) figure-t-il en mots entiers dans `texte` ?
fn contient_nom(texte_plie_mots: &[String], nom: &str) -> bool {
    let n = mots_de(nom);
    if n.is_empty() || n.len() > texte_plie_mots.len() {
        return false;
    }
    texte_plie_mots.windows(n.len()).any(|w| w.iter().zip(n.iter()).all(|(a, b)| a == b))
}

fn interdit(segment: &str, artistes_famille: &[String]) -> bool {
    let mots = mots_de(segment);
    let plie = format!("{} ", plier(segment));
    ARTISTES.iter().any(|a| contient_nom(&mots, a))
        || FOURNISSEURS.iter().any(|f| contient_nom(&mots, f))
        || artistes_famille.iter().any(|a| a.chars().count() >= 2 && contient_nom(&mots, a))
        || IMITATION.iter().any(|t| plie.contains(t))
}

/// Ne garde que des caractères sûrs dans un prompt musical.
fn caracteres_surs(s: &str) -> String {
    s.chars()
        .map(|c| if crate::texte::alnum(c) || " ,.-'/&+".contains(c) { c } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

/// Tronque une liste séparée par des virgules sans couper un segment.
fn borner_segments(segments: &[String], max: usize) -> String {
    let mut out = String::new();
    for s in segments {
        let sep = if out.is_empty() { 0 } else { 2 };
        if out.chars().count() + sep + s.chars().count() > max {
            break;
        }
        if !out.is_empty() {
            out.push_str(", ");
        }
        out.push_str(s);
    }
    out
}

/// Assainit une proposition de prompt musical (venant de l'agent ou du
/// conseiller). Rend (texte, segments retirés).
pub fn assainir(texte: &str, artistes_famille: &[String]) -> (String, usize) {
    let (sans_donnees, _) = nettoyer(texte);
    let mut gardes: Vec<String> = Vec::new();
    let mut retires = 0;
    for seg in sans_donnees.split([',', ';', '\n']) {
        let s = caracteres_surs(seg);
        if s.is_empty() || s.contains("retir") {
            continue;
        }
        if interdit(&s, artistes_famille) {
            retires += 1;
            continue;
        }
        if !gardes.iter().any(|g| g.eq_ignore_ascii_case(&s)) {
            gardes.push(s);
        }
    }
    (borner_segments(&gardes, PROMPT_MUSIQUE_MAX), retires)
}

fn style_en(style: &str) -> Option<&'static str> {
    let s = plier(style);
    let table: &[(&str, &str)] = &[
        ("chanson francaise", "french chanson"),
        ("variete", "french pop ballad"),
        ("folk", "acoustic folk"),
        ("piano", "solo piano, classical"),
        ("classique", "classical, orchestral"),
        ("jazz", "soft jazz"),
        ("gospel", "gospel"),
        ("soul", "soul ballad"),
        ("pop", "soft pop ballad"),
        ("rock", "soft rock ballad"),
        ("celtique", "celtic folk"),
        ("bossa", "bossa nova"),
        ("country", "country ballad"),
        ("orient", "oriental, strings"),
        ("raï", "rai ballad"),
        ("rai", "rai ballad"),
        ("reggae", "soft reggae"),
        ("blues", "slow blues"),
        ("electro", "ambient electronic"),
        ("ambient", "ambient"),
        ("lyrique", "operatic, classical"),
        ("liturg", "sacred choral"),
        ("sacre", "sacred choral"),
        ("instrumental", "instrumental"),
    ];
    table.iter().find(|(k, _)| s.contains(k)).map(|(_, v)| *v)
}

fn instrument_en(i: &str) -> Option<&'static str> {
    let s = plier(i);
    let table: &[(&str, &str)] = &[
        ("piano", "piano"),
        ("guitare electrique", "electric guitar"),
        ("guitare", "acoustic guitar"),
        ("violoncelle", "cello"),
        ("violon", "violin"),
        ("cordes", "strings"),
        ("accordeon", "accordion"),
        ("harpe", "harp"),
        ("cornemuse", "bagpipes"),
        ("orgue", "church organ"),
        ("flute", "flute"),
        ("saxophone", "saxophone"),
        ("trompette", "trumpet"),
        ("batterie", "drums"),
        ("percussion", "percussion"),
        ("oud", "oud"),
        ("contrebasse", "double bass"),
        ("clarinette", "clarinet"),
        ("synth", "synth pads"),
    ];
    table.iter().find(|(k, _)| s.contains(k)).map(|(_, v)| *v)
}

fn ton_en(ton: &str) -> &'static str {
    let s = plier(ton);
    if s.contains("lumin") || s.contains("espoir") {
        "warm, hopeful"
    } else if s.contains("joie") || s.contains("joyeu") || s.contains("fete") {
        "joyful celebration of life"
    } else if s.contains("nostalg") {
        "nostalgic, tender"
    } else if s.contains("recueil") || s.contains("solenn") || s.contains("grave") {
        "solemn, intimate"
    } else if s.contains("seren") || s.contains("paisib") || s.contains("doux") {
        "serene, gentle"
    } else {
        "dignified, emotional"
    }
}

fn liste(v: &Value, cle: &str) -> Vec<String> {
    v.get(cle)
        .and_then(|x| x.as_array())
        .map(|a| a.iter().filter_map(|s| s.as_str()).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect())
        .unwrap_or_default()
}

/// Socle déterministe du prompt musical.
pub fn socle_musique(q: &Value, duree_s: Option<i64>) -> Vec<String> {
    let m = q.get("musique").cloned().unwrap_or(Value::Null);
    let msg = q.get("message").cloned().unwrap_or(Value::Null);
    let mut seg: Vec<String> = Vec::new();
    match style_en(champ(&m, "style")) {
        Some(s) => seg.push(s.to_string()),
        None => seg.push("french chanson".to_string()),
    }
    seg.push(ton_en(champ(&msg, "ton")).to_string());
    let energie = m.get("energie").and_then(|x| x.as_i64()).unwrap_or(35);
    seg.push(
        if energie < 30 {
            "slow tempo, 60-70 bpm"
        } else if energie < 60 {
            "moderate tempo, 75-90 bpm"
        } else {
            "uplifting, 95-110 bpm"
        }
        .to_string(),
    );
    match champ(&m, "voix") {
        "homme" => seg.push("male vocal".into()),
        "femme" => seg.push("female vocal".into()),
        "choeur" => seg.push("choir vocals".into()),
        "instrumental" => seg.push("instrumental, no vocals".into()),
        _ => {}
    }
    let voulus: Vec<&str> = liste(&m, "instruments").iter().filter_map(|i| instrument_en(i)).collect();
    if !voulus.is_empty() {
        let mut u: Vec<&str> = Vec::new();
        for v in voulus {
            if !u.contains(&v) {
                u.push(v);
            }
        }
        seg.push(u.join(" and "));
    }
    for i in liste(&m, "instruments_eviter") {
        if let Some(e) = instrument_en(&i) {
            seg.push(format!("no {e}"));
        }
    }
    if let Some(d) = duree_s {
        if d > 0 {
            seg.push(format!("about {} min {:02} s", d / 60, d % 60));
        }
    }
    seg.push("respectful, dignified".into());
    seg
}

/// Remplace le prénom écrit par sa prononciation dans les paroles chantées
/// (les paroles affichées gardent l'orthographe de la famille).
pub fn paroles_pour_chant(paroles: &str, prenom: &str, prononciation: &str) -> String {
    let p = tronquer(paroles, PAROLES_MAX);
    if prenom.is_empty() || prononciation.is_empty() || prenom == prononciation {
        return p;
    }
    let ch: Vec<char> = p.chars().collect();
    let cible: Vec<char> = prenom.chars().collect();
    let mut out = String::with_capacity(p.len());
    let mut i = 0;
    while i < ch.len() {
        let fin = i + cible.len();
        let bord_g = i == 0 || !crate::texte::alnum(ch[i - 1]);
        let bord_d = fin >= ch.len() || !crate::texte::alnum(ch[fin]);
        if fin <= ch.len() && bord_g && bord_d && ch[i..fin] == cible[..] {
            out.push_str(prononciation);
            i = fin;
        } else {
            out.push(ch[i]);
            i += 1;
        }
    }
    tronquer(&out, PAROLES_MAX)
}

fn ligne(etiquette: &str, valeur: &str) -> String {
    if valeur.is_empty() {
        String::new()
    } else {
        format!("- {etiquette} : {}\n", tronquer(valeur, 600))
    }
}

/// Consigne de l'agent parolier, à partir du questionnaire déjà nettoyé.
pub fn consigne_paroles(q: &Value, essai: bool, duree_s: Option<i64>) -> String {
    let d = q.get("defunt").cloned().unwrap_or(Value::Null);
    let v = q.get("vie").cloned().unwrap_or(Value::Null);
    let m = q.get("musique").cloned().unwrap_or(Value::Null);
    let c = q.get("ceremonie").cloned().unwrap_or(Value::Null);
    let msg = q.get("message").cloned().unwrap_or(Value::Null);
    let genre = match champ(&d, "genre") {
        "il" => "masculin (il)",
        "elle" => "féminin (elle)",
        "iel" => "neutre (iel) — évitez les accords genrés",
        _ => "non précisé",
    };
    let adresse = match champ(&msg, "adresse") {
        "tu" => "on s'adresse à la personne disparue (tu)",
        "nous" => "la famille parle d'une seule voix (nous)",
        _ => "on parle de la personne disparue (il / elle)",
    };
    let traits = liste(&v, "traits").join(", ");
    let proches = if v.get("proches_consentement").and_then(|x| x.as_bool()).unwrap_or(false) {
        liste(&v, "proches").join(", ")
    } else {
        String::new()
    };
    let structure = if essai {
        let s = duree_s.unwrap_or(150);
        format!("Composition d'essai d'environ {} min {:02} : 2 couplets de 4 vers et 1 refrain de 4 vers, pas davantage.", s / 60, s % 60)
    } else {
        match champ(&m, "duree") {
            "courte" => "Environ 2 min 30 : 2 couplets de 4 vers, 1 refrain de 4 vers.".to_string(),
            "longue" => "Environ 4 min 30 : 3 couplets de 4 vers, 1 refrain de 4 vers repris, 1 pont de 2 à 4 vers.".to_string(),
            _ => "Environ 3 min 30 : 3 couplets de 4 vers, 1 refrain de 4 vers.".to_string(),
        }
    };
    let mut s = String::new();
    s.push_str("Tu es parolier pour Melodia Funèbre. Tu écris une chanson d'hommage, digne, sobre et lumineuse, en français, pour une cérémonie d'obsèques.\n\n");
    s.push_str("La personne à honorer :\n");
    s.push_str(&ligne("Prénom d'usage", champ(&d, "prenom")));
    s.push_str(&ligne("Surnom", champ(&d, "surnom")));
    s.push_str(&format!("- Accords : {genre}\n"));
    s.push_str(&ligne("Lieux de vie", champ(&d, "lieux")));
    s.push_str(&ligne("Métier", champ(&v, "metier")));
    s.push_str(&ligne("Passion", champ(&v, "passion")));
    s.push_str(&ligne("Traits", &traits));
    s.push_str(&ligne("Autres traits", champ(&v, "traits_libre")));
    s.push_str(&ligne("Habitude", champ(&v, "habitude")));
    s.push_str(&ligne("Anecdote", champ(&v, "anecdote")));
    s.push_str(&ligne("Phrase qu'il ou elle répétait", champ(&v, "phrase")));
    s.push_str(&ligne("Ce qu'il ou elle aimait", champ(&v, "aimait")));
    s.push_str(&ligne("Proches à nommer (consentement recueilli)", &proches));
    s.push_str("\nLa cérémonie et le message :\n");
    s.push_str(&ligne("Rite", champ(&c, "rite")));
    s.push_str(&ligne("Texte à intégrer", champ(&c, "texte")));
    s.push_str(&ligne("Ton", champ(&msg, "ton")));
    s.push_str(&ligne("Mot ou phrase du refrain", champ(&msg, "refrain")));
    s.push_str(&ligne("Titre souhaité", champ(&msg, "titre")));
    s.push_str(&format!("- Adresse : {adresse}\n"));
    let langue_refrain = champ(&d, "langue_refrain");
    if !langue_refrain.is_empty() {
        s.push_str(&ligne("Le refrain peut être chanté en", langue_refrain));
    }
    s.push_str("\nCe qu'il faut éviter absolument :\n");
    s.push_str(&ligne("Sujets à ne pas aborder", champ(&v, "eviter")));
    s.push_str("- Aucun nom d'artiste, de chanson existante ni de marque. N'imite aucun artiste.\n");
    s.push_str("- Aucun cliché morbide, aucune formule religieuse si le rite est civil.\n");
    s.push_str(&format!("\nStructure : {structure}\n"));
    s.push_str("Vers chantables de 8 à 10 syllabes, rimes simples. Le prénom revient au moins deux fois. Balises [Couplet 1], [Refrain], [Couplet 2]…\n\n");
    s.push_str("Réponds UNIQUEMENT par un JSON strict à trois clés : {\"title\": titre court et poétique, \"lyrics\": les paroles, \"style_prompt\": description musicale EN ANGLAIS de 15 à 25 mots (genre, ambiance, instruments, tempo, voix), sans aucun nom d'artiste}.");
    tronquer(&s, CONSIGNE_MAX)
}

pub fn construire_json(entree: &str) -> String {
    let v: Value = serde_json::from_str(entree).unwrap_or(Value::Null);
    let brut = v.get("questionnaire").cloned().unwrap_or(Value::Null);
    let essai = v.get("essai").and_then(|x| x.as_bool()).unwrap_or(false);
    let duree_s = v.get("duree_s").and_then(|x| x.as_i64());
    let mut retraits = Vec::new();
    let q = nettoyer_valeur(&brut, &mut retraits);
    let artistes = liste(&brut.get("musique").cloned().unwrap_or(Value::Null), "artistes");

    let consigne = consigne_paroles(&q, essai, duree_s);
    let mut segments = socle_musique(&q, if essai { duree_s.or(Some(150)) } else { None });
    let mut retires = 0;
    let proposition = v.get("proposition").and_then(|x| x.as_str()).unwrap_or("");
    if !proposition.is_empty() {
        let (p, r) = assainir(proposition, &artistes);
        retires = r;
        for s in p.split(", ") {
            let s = s.trim().to_string();
            if !s.is_empty() && !segments.iter().any(|g| g.eq_ignore_ascii_case(&s)) {
                segments.push(s);
            }
        }
    }
    let prompt = borner_segments(&segments, PROMPT_MUSIQUE_MAX);

    let d = q.get("defunt").cloned().unwrap_or(Value::Null);
    let paroles = v.get("paroles").and_then(|x| x.as_str()).unwrap_or("");
    let (paroles_propres, r2) = nettoyer(paroles);
    for x in r2 {
        if !retraits.contains(&x) {
            retraits.push(x);
        }
    }
    let chant = paroles_pour_chant(&paroles_propres, champ(&d, "prenom"), champ(&d, "prononciation"));
    let mut alertes: Vec<&str> = Vec::new();
    if paroles.chars().count() > PAROLES_MAX {
        alertes.push("PAROLES_TRONQUEES");
    }
    let mots_paroles = mots_de(&paroles_propres);
    // Une défunte prénommée Barbara n'est pas une citation d'artiste.
    let siens: Vec<String> = [champ(&d, "prenom"), champ(&d, "surnom")].iter().flat_map(|x| mots_de(x)).collect();
    let cite = |a: &str| !mots_de(a).iter().all(|m| siens.contains(m)) && contient_nom(&mots_paroles, a);
    if ARTISTES.iter().any(|a| cite(a)) || artistes.iter().any(|a| cite(a)) {
        alertes.push("ARTISTE_DANS_LES_PAROLES");
    }
    json!({
        "consigne_paroles": consigne,
        "prompt_musique": prompt,
        "paroles_chant": chant,
        "retraits": retraits,
        "segments_retires": retires,
        "alertes": alertes
    })
    .to_string()
}

pub fn assainir_json(entree: &str) -> String {
    let v: Value = serde_json::from_str(entree).unwrap_or(Value::Null);
    let t = v.get("texte").and_then(|x| x.as_str()).unwrap_or("");
    let artistes = liste(&v, "artistes");
    let (s, r) = assainir(t, &artistes);
    json!({ "texte": s, "segments_retires": r }).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn q() -> Value {
        json!({
            "defunt": { "prenom": "Siobhan", "genre": "elle", "prononciation": "Chivonne" },
            "vie": { "traits": ["drôle"], "metier": "fleuriste", "anecdote": "Son numéro : 06 11 22 33 44" },
            "musique": { "style": "Chanson française", "voix": "femme", "energie": 20,
                         "artistes": ["Barbara", "Zaz"], "instruments": ["piano", "violoncelle"],
                         "instruments_eviter": ["batterie"] },
            "message": { "ton": "lumineux", "adresse": "tu" }
        })
    }

    #[test]
    fn jamais_d_artiste_dans_les_consignes() {
        let s = construire_json(&json!({ "questionnaire": q() }).to_string());
        let v: Value = serde_json::from_str(&s).unwrap();
        let tout = plier(&format!("{} {}", v["consigne_paroles"], v["prompt_musique"]));
        assert!(!tout.contains("barbara") && !tout.contains("zaz"), "{tout}");
    }

    #[test]
    fn donnees_sensibles_retirees_de_la_consigne() {
        let s = construire_json(&json!({ "questionnaire": q() }).to_string());
        assert!(!s.contains("06 11 22"));
        assert!(s.contains("telephone"));
    }

    #[test]
    fn proposition_de_l_agent_assainie() {
        let prop = "french chanson, in the style of Edith Piaf, sounds like Zaz, warm piano, made with Mureka, cello";
        let s = construire_json(&json!({ "questionnaire": q(), "proposition": prop }).to_string());
        let v: Value = serde_json::from_str(&s).unwrap();
        let p = plier(v["prompt_musique"].as_str().unwrap());
        assert!(!p.contains("piaf") && !p.contains("zaz") && !p.contains("mureka"), "{p}");
        assert!(p.contains("warm piano"));
        assert!(v["segments_retires"].as_i64().unwrap() >= 3);
    }

    #[test]
    fn socle_deterministe_et_borne() {
        let a = construire_json(&json!({ "questionnaire": q() }).to_string());
        let b = construire_json(&json!({ "questionnaire": q() }).to_string());
        assert_eq!(a, b);
        let v: Value = serde_json::from_str(&a).unwrap();
        let p = v["prompt_musique"].as_str().unwrap();
        assert!(p.chars().count() <= PROMPT_MUSIQUE_MAX);
        assert!(p.contains("french chanson") && p.contains("female vocal") && p.contains("no drums"));
        assert!(p.contains("piano and cello"));
    }

    #[test]
    fn prompt_long_tronque_sans_couper_un_segment() {
        let prop = (0..200).map(|i| format!("soft texture {i}")).collect::<Vec<_>>().join(", ");
        let (s, _) = assainir(&prop, &[]);
        assert!(s.chars().count() <= PROMPT_MUSIQUE_MAX);
        assert!(!s.ends_with(','));
        assert!(s.split(", ").all(|x| x.starts_with("soft texture")));
    }

    #[test]
    fn essai_150_secondes() {
        let s = construire_json(&json!({ "questionnaire": q(), "essai": true, "duree_s": 150 }).to_string());
        assert!(s.contains("2 min 30"));
    }

    #[test]
    fn prononciation_dans_le_chant_seulement() {
        let p = "[Refrain]\nSiobhan, ton rire\nSiobhanne n'est pas toi";
        let c = paroles_pour_chant(p, "Siobhan", "Chivonne");
        assert!(c.contains("Chivonne, ton rire"));
        assert!(c.contains("Siobhanne")); // mot différent : non remplacé
    }

    #[test]
    fn paroles_bornees() {
        let longues = "la ".repeat(2000);
        let s = construire_json(&json!({ "questionnaire": q(), "paroles": longues }).to_string());
        let v: Value = serde_json::from_str(&s).unwrap();
        assert!(v["paroles_chant"].as_str().unwrap().chars().count() <= PAROLES_MAX);
        assert!(v["alertes"].to_string().contains("PAROLES_TRONQUEES"));
    }

    #[test]
    fn artiste_dans_les_paroles_signale() {
        let s = construire_json(&json!({ "questionnaire": q(), "paroles": "comme chantait Brel" }).to_string());
        assert!(s.contains("ARTISTE_DANS_LES_PAROLES"));
    }
}
