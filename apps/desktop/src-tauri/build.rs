fn main() {
    // Les deux commandes de l'application reçoivent leurs permissions
    // « allow-… », que la capacité console-pro accorde à la console distante.
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["enregistrer_fichier", "imprimer_pdf"])),
    )
    .expect("échec de la préparation Tauri");
}
