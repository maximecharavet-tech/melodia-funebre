//! Melodia Funèbre Pro — exports WebAssembly (ABI C, JSON en entrée, JSON en sortie).
//!
//! Même contrat que `console-julie-wasm` : aucun `wasm-bindgen`. Le même fichier
//! `.wasm` est chargé par le navigateur (`assets/js/vendor/melodia-pro-glue.js`)
//! et par les fonctions Node (`lib/pro/noyau.cjs`) : une seule source de vérité
//! pour les règles (prix, statut, essai, nettoyage du prompt, QR).
//!
//! Chaque export prend `(ptr, len)` d'une chaîne JSON et rend un pointeur sur
//! `[u32 LE len][octets UTF-8 JSON]`, à libérer avec `dealloc(ptr, 4 + len)`.

use std::alloc::{alloc as sys_alloc, dealloc as sys_dealloc, Layout};

pub mod texte;
pub mod siret;
pub mod prix;
pub mod promo;
pub mod statut;
pub mod essai;
pub mod questionnaire;
pub mod prompt;
pub mod qr;

#[no_mangle]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    if len == 0 {
        return std::ptr::null_mut();
    }
    match Layout::from_size_align(len, 1) {
        Ok(l) => unsafe { sys_alloc(l) },
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, len: usize) {
    if ptr.is_null() || len == 0 {
        return;
    }
    if let Ok(l) = Layout::from_size_align(len, 1) {
        unsafe { sys_dealloc(ptr, l) }
    }
}

fn retourner(s: String) -> *mut u8 {
    let bytes = s.into_bytes();
    let len = bytes.len();
    let buf = alloc(len + 4);
    if buf.is_null() {
        return buf;
    }
    unsafe {
        std::ptr::copy_nonoverlapping((len as u32).to_le_bytes().as_ptr(), buf, 4);
        if len > 0 {
            std::ptr::copy_nonoverlapping(bytes.as_ptr(), buf.add(4), len);
        }
    }
    buf
}

unsafe fn lire(ptr: *const u8, len: usize) -> String {
    if ptr.is_null() || len == 0 {
        return String::new();
    }
    String::from_utf8_lossy(std::slice::from_raw_parts(ptr, len)).into_owned()
}

macro_rules! export_str {
    ($nom:ident, $f:path) => {
        #[no_mangle]
        pub extern "C" fn $nom(ptr: *const u8, len: usize) -> *mut u8 {
            let entree = unsafe { lire(ptr, len) };
            retourner($f(&entree))
        }
    };
}

/// Version du noyau, pour vérifier que navigateur et serveur parlent la même langue.
pub fn version_json(_: &str) -> String {
    format!("{{\"version\":\"{}\"}}", env!("CARGO_PKG_VERSION"))
}

export_str!(pro_version, version_json);
export_str!(qr_svg, qr::svg_json);
export_str!(prix_calculer, prix::calculer_json);
export_str!(promo_normaliser, promo::normaliser_json);
export_str!(questionnaire_valider, questionnaire::valider_json);
export_str!(questionnaire_nettoyer, questionnaire::nettoyer_json);
export_str!(prompt_construire, prompt::construire_json);
export_str!(prompt_assainir, prompt::assainir_json);
export_str!(statut_transition, statut::transition_json);
export_str!(statut_suivants, statut::suivants_json);
export_str!(essai_eligibilite, essai::eligibilite_json);
export_str!(siret_valider, siret::valider_json);
export_str!(jeton_valider, texte::jeton_json);
