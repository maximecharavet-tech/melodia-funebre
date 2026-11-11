//! Essai « première composition offerte ».
//!
//! Décision de Maxime (11/11/2026) : une composition d'essai par agence, de
//! 2 min 30 (150 s). Le nombre et la durée sont relus dans `pro_settings` :
//! ce module ne fait qu'appliquer les règles qu'on lui passe.
//!
//! Éligibilité : compte validé par la maison, SIRET au bon format (Luhn),
//! e-mail non jetable, aucune empreinte (SIRET, domaine, téléphone, appareil)
//! déjà consommée par une autre organisation, plafond global du jour non
//! atteint. Les empreintes arrivent déjà hachées et salées par le serveur.

use crate::texte::{b_de, i_opt, liste_s, objet, s_de};
use serde_json::{json, Value};

/// Domaines d'adresses jetables les plus courants. Liste volontairement
/// courte et sûre : un faux positif refuserait un vrai professionnel.
const JETABLES: &[&str] = &[
    "yopmail.com", "yopmail.fr", "yopmail.net", "mailinator.com", "guerrillamail.com",
    "guerrillamail.info", "sharklasers.com", "10minutemail.com", "10minutemail.net",
    "tempmail.com", "temp-mail.org", "temp-mail.io", "trashmail.com", "trashmail.fr",
    "jetable.org", "jetable.fr.nf", "getnada.com", "nada.email", "dispostable.com",
    "maildrop.cc", "mailnesia.com", "mintemail.com", "throwawaymail.com", "fakeinbox.com",
    "emailondeck.com", "mohmal.com", "spamgourmet.com", "mailcatch.com", "moakt.com",
    "tempail.com", "burnermail.io", "33mail.com", "spambox.us", "mytemp.email",
    "tempr.email", "discard.email", "inboxkitten.com", "harakirimail.com", "mail-temp.com",
    "crazymailing.com", "trash-mail.com", "wegwerfmail.de", "einrot.com", "cool.fr.nf",
];

#[derive(Default)]
pub struct Empreintes {
    pub siret: String,
    pub domaine: String,
    pub telephone: String,
    pub appareil: String,
}

#[derive(Default)]
pub struct Entree {
    pub compte_valide: bool,
    pub siret: String,
    pub email: String,
    pub empreintes: Empreintes,
    /// Empreintes déjà consommées par un essai d'une AUTRE organisation.
    pub empreintes_connues: Vec<String>,
    pub essais_org_utilises: i64,
    /// pro_settings.essai_par_org — None : essais fermés (valeur TBD).
    pub essais_par_org: Option<i64>,
    pub essais_jour: i64,
    /// pro_settings.essai_plafond_jour — None : pas de plafond saisi, essais fermés.
    pub plafond_jour: Option<i64>,
    /// pro_settings.essai_duree_s
    pub duree_s: Option<i64>,
    /// pro_settings.essai_mode : "complet" ou "extrait"
    pub mode: Option<String>,
}

impl Entree {
    pub fn depuis(v: &Value) -> Self {
        let e = v.get("empreintes").cloned().unwrap_or(Value::Null);
        Entree {
            compte_valide: b_de(v, "compte_valide"),
            siret: s_de(v, "siret"),
            email: s_de(v, "email"),
            empreintes: Empreintes {
                siret: s_de(&e, "siret"),
                domaine: s_de(&e, "domaine"),
                telephone: s_de(&e, "telephone"),
                appareil: s_de(&e, "appareil"),
            },
            empreintes_connues: liste_s(v, "empreintes_connues"),
            essais_org_utilises: i_opt(v, "essais_org_utilises").unwrap_or(0),
            essais_par_org: i_opt(v, "essais_par_org"),
            essais_jour: i_opt(v, "essais_jour").unwrap_or(0),
            plafond_jour: i_opt(v, "plafond_jour"),
            duree_s: i_opt(v, "duree_s"),
            mode: v.get("mode").and_then(|x| x.as_str()).map(|s| s.to_string()),
        }
    }
}

pub fn domaine_de(email: &str) -> Option<String> {
    let e = email.trim().to_ascii_lowercase();
    let (local, dom) = e.rsplit_once('@')?;
    if local.is_empty() || !dom.contains('.') || dom.starts_with('.') || dom.ends_with('.') {
        return None;
    }
    Some(dom.to_string())
}

pub fn jetable(email: &str) -> bool {
    match domaine_de(email) {
        Some(d) => JETABLES.iter().any(|j| d == *j || d.ends_with(&format!(".{j}"))),
        None => true,
    }
}

pub fn evaluer(e: &Entree) -> (bool, Vec<&'static str>) {
    let mut motifs = Vec::new();
    if !e.compte_valide {
        motifs.push("COMPTE_NON_VALIDE");
    }
    if !crate::siret::siret_valide(&e.siret) {
        motifs.push("SIRET_INVALIDE");
    }
    if domaine_de(&e.email).is_none() {
        motifs.push("EMAIL_INVALIDE");
    } else if jetable(&e.email) {
        motifs.push("EMAIL_JETABLE");
    }
    match e.essais_par_org {
        None => motifs.push("ESSAIS_NON_CONFIGURES"),
        Some(n) if e.essais_org_utilises >= n => motifs.push("ESSAI_DEJA_UTILISE"),
        _ => {}
    }
    match e.plafond_jour {
        None => motifs.push("PLAFOND_NON_CONFIGURE"),
        Some(p) if e.essais_jour >= p => motifs.push("PLAFOND_JOUR_ATTEINT"),
        _ => {}
    }
    let em = &e.empreintes;
    let deja = [&em.siret, &em.domaine, &em.telephone, &em.appareil]
        .iter()
        .any(|h| !h.is_empty() && e.empreintes_connues.iter().any(|k| k == *h));
    if deja {
        motifs.push("EMPREINTE_DEJA_UTILISEE");
    }
    (motifs.is_empty(), motifs)
}

pub fn eligibilite_json(entree: &str) -> String {
    let e: Entree = match objet(entree) {
        Some(v) => Entree::depuis(&v),
        None => return crate::texte::erreur("ENTREE_INVALIDE", "Entrée illisible."),
    };
    let (ok, motifs) = evaluer(&e);
    let mode = match e.mode.as_deref() {
        Some("extrait") => "extrait",
        _ => "complet",
    };
    json!({
        "eligible": ok,
        "motifs": motifs,
        "duree_s": e.duree_s,
        "mode": mode,
        "revue_maison": true
    })
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base() -> Entree {
        Entree {
            compte_valide: true,
            siret: "73282932000074".into(),
            email: "contact@pompes-funebres-exemple.fr".into(),
            essais_par_org: Some(1),
            plafond_jour: Some(5),
            duree_s: Some(150),
            ..Default::default()
        }
    }

    #[test]
    fn eligible_nominal() {
        assert_eq!(evaluer(&base()), (true, vec![]));
    }

    #[test]
    fn essai_consomme_deux_fois() {
        let mut e = base();
        e.essais_org_utilises = 1;
        assert_eq!(evaluer(&e).1, vec!["ESSAI_DEJA_UTILISE"]);
    }

    #[test]
    fn jetable_refuse() {
        let mut e = base();
        e.email = "x@yopmail.com".into();
        assert!(evaluer(&e).1.contains(&"EMAIL_JETABLE"));
        e.email = "x@sub.mailinator.com".into();
        assert!(evaluer(&e).1.contains(&"EMAIL_JETABLE"));
    }

    #[test]
    fn siret_et_compte() {
        let mut e = base();
        e.siret = "12345678901234".into();
        e.compte_valide = false;
        let m = evaluer(&e).1;
        assert!(m.contains(&"SIRET_INVALIDE") && m.contains(&"COMPTE_NON_VALIDE"));
    }

    #[test]
    fn plafond_et_tbd() {
        let mut e = base();
        e.essais_jour = 5;
        assert!(evaluer(&e).1.contains(&"PLAFOND_JOUR_ATTEINT"));
        e.plafond_jour = None;
        assert!(evaluer(&e).1.contains(&"PLAFOND_NON_CONFIGURE"));
        e.essais_par_org = None;
        assert!(evaluer(&e).1.contains(&"ESSAIS_NON_CONFIGURES"));
    }

    #[test]
    fn empreinte_reutilisee() {
        let mut e = base();
        e.empreintes.appareil = "h-appareil".into();
        e.empreintes_connues = vec!["h-appareil".into()];
        assert!(evaluer(&e).1.contains(&"EMPREINTE_DEJA_UTILISEE"));
        // une empreinte vide ne correspond jamais
        let mut f = base();
        f.empreintes_connues = vec!["".into()];
        assert!(evaluer(&f).0);
    }

    #[test]
    fn json_duree_150() {
        let s = eligibilite_json(r#"{"compte_valide":true,"siret":"73282932000074","email":"a@b.fr","essais_par_org":1,"plafond_jour":3,"duree_s":150}"#);
        assert!(s.contains("\"eligible\":true") && s.contains("\"duree_s\":150"));
    }
}
