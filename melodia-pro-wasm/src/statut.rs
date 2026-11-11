//! Machine à états d'un dossier.
//!
//! Les identifiants sont en ASCII (ils vivent en base, dans des URL d'API et
//! des journaux) ; les libellés accentués sont dans `assets/i18n/pro.fr.json`.
//!
//!   brouillon → complet → en_attente_paiement → paye | essai_accorde
//!   → paroles_en_cours → paroles_a_valider → musique_en_cours
//!   → controle_maison → livre (→ revision_demandee)
//!   + echec, annule, rembourse
//!
//! Trois acteurs : `agence` (membre pro qui peut écrire), `maison`
//! (master/atelier), `service` (le serveur lui-même : webhook Stripe, file de
//! tâches). La maison peut tout ce que peut l'agence. Seul `service` fait
//! passer un dossier à `paye` : c'est le webhook Stripe, ou le serveur après
//! validation du code maître à 0 €.

use serde_json::{json, Value};

pub const ETATS: &[&str] = &[
    "brouillon",
    "complet",
    "en_attente_paiement",
    "paye",
    "essai_accorde",
    "paroles_en_cours",
    "paroles_a_valider",
    "musique_en_cours",
    "controle_maison",
    "livre",
    "revision_demandee",
    "echec",
    "annule",
    "rembourse",
];

/// (de, vers, acteurs autorisés)
const TRANSITIONS: &[(&str, &str, &[&str])] = &[
    ("brouillon", "complet", &["agence", "maison"]),
    ("brouillon", "annule", &["agence", "maison"]),
    ("complet", "brouillon", &["agence", "maison"]),
    ("complet", "en_attente_paiement", &["agence", "maison", "service"]),
    ("complet", "essai_accorde", &["service"]),
    ("complet", "paye", &["service"]),
    ("complet", "annule", &["agence", "maison"]),
    ("en_attente_paiement", "paye", &["service"]),
    ("en_attente_paiement", "complet", &["service", "agence", "maison"]),
    ("en_attente_paiement", "annule", &["agence", "maison"]),
    ("paye", "paroles_en_cours", &["service"]),
    ("essai_accorde", "paroles_en_cours", &["service"]),
    ("paroles_en_cours", "paroles_a_valider", &["service"]),
    ("paroles_a_valider", "paroles_en_cours", &["agence", "maison", "service"]),
    ("paroles_a_valider", "musique_en_cours", &["agence", "maison", "service"]),
    ("musique_en_cours", "controle_maison", &["service"]),
    ("controle_maison", "livre", &["maison"]),
    ("controle_maison", "musique_en_cours", &["maison"]),
    ("controle_maison", "paroles_en_cours", &["maison"]),
    ("livre", "revision_demandee", &["agence", "maison"]),
    ("revision_demandee", "paroles_en_cours", &["maison", "service"]),
    ("revision_demandee", "musique_en_cours", &["maison", "service"]),
    ("revision_demandee", "livre", &["maison"]),
    ("echec", "paroles_en_cours", &["maison", "service"]),
    ("echec", "musique_en_cours", &["maison", "service"]),
];

/// États depuis lesquels le travail peut échouer.
const PEUT_ECHOUER: &[&str] = &["paroles_en_cours", "musique_en_cours", "paye", "essai_accorde"];
/// États remboursables (il y a eu un paiement réel).
const REMBOURSABLE: &[&str] = &[
    "paye",
    "paroles_en_cours",
    "paroles_a_valider",
    "musique_en_cours",
    "controle_maison",
    "livre",
    "revision_demandee",
    "echec",
];

pub fn existe(e: &str) -> bool {
    ETATS.contains(&e)
}

pub fn autorise(de: &str, vers: &str, acteur: &str) -> Result<(), &'static str> {
    if !existe(de) || !existe(vers) {
        return Err("ETAT_INCONNU");
    }
    if !["agence", "maison", "service"].contains(&acteur) {
        return Err("ACTEUR_INCONNU");
    }
    if de == vers {
        return Err("TRANSITION_NULLE");
    }
    if vers == "echec" {
        return if PEUT_ECHOUER.contains(&de) && acteur == "service" { Ok(()) } else { Err("TRANSITION_INTERDITE") };
    }
    if vers == "rembourse" {
        return if REMBOURSABLE.contains(&de) && acteur == "service" { Ok(()) } else { Err("TRANSITION_INTERDITE") };
    }
    for (a, b, acteurs) in TRANSITIONS {
        if *a == de && *b == vers {
            // La maison peut tout ce que peut l'agence.
            let ok = acteurs.contains(&acteur) || (acteur == "maison" && acteurs.contains(&"agence"));
            return if ok { Ok(()) } else { Err("ACTEUR_NON_AUTORISE") };
        }
    }
    Err("TRANSITION_INTERDITE")
}

pub fn suivants(de: &str, acteur: &str) -> Vec<&'static str> {
    ETATS.iter().copied().filter(|v| autorise(de, v, acteur).is_ok()).collect()
}

pub fn transition_json(entree: &str) -> String {
    let v: Value = serde_json::from_str(entree).unwrap_or(Value::Null);
    let de = v.get("de").and_then(|x| x.as_str()).unwrap_or("");
    let vers = v.get("vers").and_then(|x| x.as_str()).unwrap_or("");
    let acteur = v.get("acteur").and_then(|x| x.as_str()).unwrap_or("");
    match autorise(de, vers, acteur) {
        Ok(()) => json!({ "ok": true }).to_string(),
        Err(code) => json!({ "ok": false, "erreur": code }).to_string(),
    }
}

pub fn suivants_json(entree: &str) -> String {
    let v: Value = serde_json::from_str(entree).unwrap_or(Value::Null);
    let de = v.get("de").and_then(|x| x.as_str()).unwrap_or("");
    let acteur = v.get("acteur").and_then(|x| x.as_str()).unwrap_or("agence");
    json!({ "suivants": suivants(de, acteur), "etats": ETATS }).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chemin_nominal_paye() {
        let chemin = [
            ("brouillon", "complet", "agence"),
            ("complet", "en_attente_paiement", "agence"),
            ("en_attente_paiement", "paye", "service"),
            ("paye", "paroles_en_cours", "service"),
            ("paroles_en_cours", "paroles_a_valider", "service"),
            ("paroles_a_valider", "musique_en_cours", "agence"),
            ("musique_en_cours", "controle_maison", "service"),
            ("controle_maison", "livre", "maison"),
            ("livre", "revision_demandee", "agence"),
        ];
        for (a, b, qui) in chemin {
            assert_eq!(autorise(a, b, qui), Ok(()), "{a} → {b} par {qui}");
        }
    }

    #[test]
    fn seul_le_service_encaisse() {
        assert_eq!(autorise("en_attente_paiement", "paye", "agence"), Err("ACTEUR_NON_AUTORISE"));
        assert_eq!(autorise("en_attente_paiement", "paye", "maison"), Err("ACTEUR_NON_AUTORISE"));
        assert_eq!(autorise("complet", "paye", "agence"), Err("ACTEUR_NON_AUTORISE"));
        assert_eq!(autorise("complet", "essai_accorde", "agence"), Err("ACTEUR_NON_AUTORISE"));
    }

    #[test]
    fn l_agence_ne_livre_pas() {
        assert_eq!(autorise("controle_maison", "livre", "agence"), Err("ACTEUR_NON_AUTORISE"));
        assert_eq!(autorise("controle_maison", "livre", "maison"), Ok(()));
    }

    #[test]
    fn sauts_interdits() {
        assert_eq!(autorise("brouillon", "paye", "service"), Err("TRANSITION_INTERDITE"));
        assert_eq!(autorise("brouillon", "livre", "maison"), Err("TRANSITION_INTERDITE"));
        assert_eq!(autorise("annule", "complet", "agence"), Err("TRANSITION_INTERDITE"));
        assert_eq!(autorise("livre", "livre", "maison"), Err("TRANSITION_NULLE"));
        assert_eq!(autorise("brouillon", "rembourse", "service"), Err("TRANSITION_INTERDITE"));
        assert_eq!(autorise("paroles_en_cours", "echec", "agence"), Err("TRANSITION_INTERDITE"));
        assert_eq!(autorise("inconnu", "livre", "maison"), Err("ETAT_INCONNU"));
        assert_eq!(autorise("brouillon", "complet", "pirate"), Err("ACTEUR_INCONNU"));
    }

    #[test]
    fn echec_et_remboursement() {
        assert_eq!(autorise("musique_en_cours", "echec", "service"), Ok(()));
        assert_eq!(autorise("echec", "musique_en_cours", "maison"), Ok(()));
        assert_eq!(autorise("livre", "rembourse", "service"), Ok(()));
    }

    #[test]
    fn suivants_de_brouillon() {
        let s = suivants("brouillon", "agence");
        assert_eq!(s, vec!["complet", "annule"]);
    }
}
