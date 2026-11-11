// Pas de console noire derrière la fenêtre, sous Windows, en version finale.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    melodia_pro_desktop_lib::run()
}
