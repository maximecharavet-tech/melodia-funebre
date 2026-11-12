//! Console Julie v2 — exports WebAssembly (ABI C, JSON in/JSON out).
//!
//! Aucun `wasm-bindgen` : les exports sont en `#[no_mangle] extern "C"`. Le glue
//! JS (assets/js/vendor/julie-wasm-glue.js) écrit la chaîne JSON en mémoire
//! linéaire via `alloc`, appelle l'export, lit `[u32 len][bytes]`, puis libère.
//!
//! Chaque module est importable/testable hors wasm via `cargo test` (voir
//! src/*.rs : les fonctions `*_json` prennent et rendent une chaîne).

use std::alloc::{alloc as sys_alloc, dealloc as sys_dealloc, Layout};

mod date;
mod score;
mod delivrabilite;
mod csv;
mod dedupe;
mod creneau;
mod sequences;

/// Alloue `len` octets en mémoire linéaire. Retourne null si `len == 0`.
#[no_mangle]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    if len == 0 {
        return std::ptr::null_mut();
    }
    let layout = match Layout::from_size_align(len, 1) {
        Ok(l) => l,
        Err(_) => return std::ptr::null_mut(),
    };
    unsafe { sys_alloc(layout) }
}

/// Libère un buffer alloué par `alloc` (ou par `retourner`).
#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, len: usize) {
    if ptr.is_null() || len == 0 {
        return;
    }
    if let Ok(layout) = Layout::from_size_align(len, 1) {
        unsafe { sys_dealloc(ptr, layout); }
    }
}

/// Écrit `[u32 LE len][bytes]` dans un buffer fraîchement alloué et retourne le
/// pointeur. Le caller (JS) doit appeler `dealloc(ptr, 4 + len)`.
fn retourner(s: String) -> *mut u8 {
    let bytes = s.into_bytes();
    let len = bytes.len();
    let buf = alloc(len + 4);
    if buf.is_null() {
        return buf;
    }
    unsafe {
        let len_bytes = (len as u32).to_le_bytes();
        std::ptr::copy_nonoverlapping(len_bytes.as_ptr(), buf, 4);
        if len > 0 {
            std::ptr::copy_nonoverlapping(bytes.as_ptr(), buf.add(4), len);
        }
    }
    buf
}

/// Lit une chaîne UTF-8 depuis la mémoire linéaire.
unsafe fn lire(ptr: *const u8, len: usize) -> String {
    if ptr.is_null() || len == 0 {
        return String::new();
    }
    let slice = std::slice::from_raw_parts(ptr, len);
    String::from_utf8_lossy(slice).into_owned()
}

/// Macro qui génère un export `extern "C"` wrappant une fonction `fn(&str) -> String`.
macro_rules! export_str {
    ($nom:ident, $f:path) => {
        #[no_mangle]
        pub extern "C" fn $nom(ptr: *const u8, len: usize) -> *mut u8 {
            let input = unsafe { lire(ptr, len) };
            retourner($f(&input))
        }
    };
}

export_str!(score_prospect, score::calculer_json);
export_str!(delivrabilite_verifier, delivrabilite::verifier_json);
export_str!(csv_parser, csv::parser_json);
export_str!(csv_detecter_colonnes, csv::detecter_json);
export_str!(similarite, dedupe::similarite_json);
export_str!(dedupe_cle, dedupe::cle_json);
export_str!(domaine_suggere, dedupe::domaine_json);
export_str!(envoi_cle, dedupe::cle_envoi_json);
export_str!(envoi_fenetre, dedupe::fenetre_envoi_json);
export_str!(meilleur_creneau, creneau::meilleur_json);
export_str!(sequence_prochaine_etape, sequences::calculer_json);

/// Jours fériés français (y compris Pâques) pour une année.
fn jours_feries_json(input: &str) -> String {
    #[derive(serde::Deserialize)]
    struct A {
        annee: i32,
    }
    match serde_json::from_str::<A>(input) {
        Ok(a) => {
            let isos: Vec<String> = date::jours_feries(a.annee).iter().map(|d| d.iso()).collect();
            serde_json::to_string(&isos)
                .unwrap_or_else(|_| "[]".into())
        }
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    }
}

export_str!(jours_feries_annee, jours_feries_json);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aller_retour_memoire() {
        let payload = r#"{"annee":2026}"#;
        let bytes = payload.as_bytes();
        let ptr = alloc(bytes.len());
        unsafe {
            std::ptr::copy_nonoverlapping(bytes.as_ptr(), ptr, bytes.len());
        }
        let out_ptr = jours_feries_annee(ptr, bytes.len());
        unsafe {
            let view = std::slice::from_raw_parts(out_ptr, 4);
            let len = u32::from_le_bytes([view[0], view[1], view[2], view[3]]) as usize;
            let data = std::slice::from_raw_parts(out_ptr.add(4), len);
            let s = std::str::from_utf8(data).unwrap();
            assert!(s.contains("2026-01-01"), "année présente : {}", s);
            dealloc(out_ptr, 4 + len);
        }
        dealloc(ptr, bytes.len());
    }
}
