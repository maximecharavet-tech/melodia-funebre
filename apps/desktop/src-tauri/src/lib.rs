//! Melodia Funèbre Pro pour Windows.
//!
//! La fenêtre ouvre la console https://melodia-funebre.fr/pro (toujours à
//! jour, aucune donnée stockée par l'application elle-même). Deux gestes
//! propres au poste de travail s'y ajoutent :
//!   - enregistrer un fichier (SVG pour le graveur, PDF, PNG) dans le
//!     dossier de son choix ;
//!   - envoyer un PDF directement à l'imprimante par défaut.
//! Les mises à jour automatiques sont préparées mais désactivées (fonction
//! cargo « updater », sans clé de signature).

use base64::Engine;
use std::path::PathBuf;
use tauri_plugin_dialog::DialogExt;

const TAILLE_MAX: usize = 40 * 1024 * 1024;
const EXTENSIONS: &[&str] = &["svg", "pdf", "png", "csv"];

fn decoder(base64: &str) -> Result<Vec<u8>, String> {
    let octets = base64::engine::general_purpose::STANDARD
        .decode(base64.as_bytes())
        .map_err(|_| "Fichier illisible.".to_string())?;
    if octets.len() > TAILLE_MAX {
        return Err("Fichier trop volumineux.".into());
    }
    Ok(octets)
}

/// Nom de fichier sûr : pas de chemin, une extension connue.
fn nom_sur(nom: &str) -> Result<String, String> {
    let propre: String = nom
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || "-_.".contains(*c))
        .collect();
    let ext = propre.rsplit('.').next().unwrap_or("").to_ascii_lowercase();
    if propre.is_empty() || propre.starts_with('.') || !EXTENSIONS.contains(&ext.as_str()) {
        return Err("Nom de fichier refusé.".into());
    }
    Ok(propre)
}

/// Demande où enregistrer, puis écrit le fichier. Rend le chemin choisi,
/// ou None si la personne a annulé.
#[tauri::command]
async fn enregistrer_fichier(app: tauri::AppHandle, nom: String, base64: String) -> Result<Option<String>, String> {
    let nom = nom_sur(&nom)?;
    let octets = decoder(&base64)?;
    let ext = nom.rsplit('.').next().unwrap_or("").to_string();
    let choix = app
        .dialog()
        .file()
        .set_file_name(&nom)
        .add_filter(ext.to_uppercase(), &[ext.as_str()])
        .blocking_save_file();
    let Some(chemin) = choix else { return Ok(None) };
    let chemin: PathBuf = chemin.into_path().map_err(|_| "Emplacement invalide.".to_string())?;
    std::fs::write(&chemin, octets).map_err(|e| format!("Écriture impossible : {e}"))?;
    Ok(Some(chemin.display().to_string()))
}

/// Envoie un PDF à l'imprimante par défaut (Windows : verbe « Print » du
/// lecteur PDF installé). Ailleurs, l'ouvre avec l'application par défaut.
#[tauri::command]
async fn imprimer_pdf(nom: String, base64: String) -> Result<(), String> {
    let nom = nom_sur(&nom)?;
    if !nom.ends_with(".pdf") {
        return Err("Seuls les PDF s'impriment directement.".into());
    }
    let octets = decoder(&base64)?;
    if !octets.starts_with(b"%PDF-") {
        return Err("Ce fichier n'est pas un PDF.".into());
    }
    let chemin = std::env::temp_dir().join(format!("melodia-{}-{}", std::process::id(), nom));
    std::fs::write(&chemin, octets).map_err(|e| format!("Écriture impossible : {e}"))?;
    imprimer(&chemin)
}

#[cfg(target_os = "windows")]
fn imprimer(chemin: &std::path::Path) -> Result<(), String> {
    let cible = chemin.display().to_string().replace('\'', "''");
    std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &format!("Start-Process -FilePath '{cible}' -Verb Print")])
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Impression impossible : {e}"))
}

#[cfg(not(target_os = "windows"))]
fn imprimer(chemin: &std::path::Path) -> Result<(), String> {
    let ouvrir = if cfg!(target_os = "macos") { "open" } else { "xdg-open" };
    std::process::Command::new(ouvrir)
        .arg(chemin)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Ouverture impossible : {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let constructeur = tauri::Builder::default().plugin(tauri_plugin_dialog::init());
    #[cfg(feature = "updater")]
    let constructeur = constructeur.plugin(tauri_plugin_updater::Builder::new().build());
    constructeur
        .invoke_handler(tauri::generate_handler![enregistrer_fichier, imprimer_pdf])
        .run(tauri::generate_context!())
        .expect("impossible de lancer Melodia Funèbre Pro");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn noms_de_fichier() {
        assert_eq!(nom_sur("melodia-MF-ABC123-carte.svg").unwrap(), "melodia-MF-ABC123-carte.svg");
        assert!(nom_sur("../../windows/system32/x.dll").is_err());
        assert!(nom_sur("rapport.exe").is_err());
        assert_eq!(nom_sur("C:\\temp\\carte.pdf").unwrap(), "Ctempcarte.pdf");
    }

    #[test]
    fn base64_borne() {
        assert!(decoder("JVBERi0=").is_ok());
        assert!(decoder("%%%").is_err());
    }
}
