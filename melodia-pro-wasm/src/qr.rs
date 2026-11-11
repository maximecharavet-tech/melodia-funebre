//! QR codes stylés pour les cartes, plaques et faire-part.
//!
//! Encodage : crate `qrcode` (MIT/Apache-2.0), niveau de correction H
//! (30 % de redondance) toujours — c'est ce qui autorise un logo au centre et
//! une plaque un peu abîmée par les années.
//!
//! Le dessin est fait ici, à la main : une liste de formes (rectangles
//! arrondis ou non, cercles) dans l'ordre de peinture. La même liste sert à
//! écrire le SVG, à peindre le PNG (canvas) et à tracer le PDF côté
//! navigateur, et, dans les tests, à rastériser l'image pour la faire relire
//! par `rqrr` : chaque style est prouvé lisible.
//!
//! Garde-fous : zone de silence ≥ 4 modules, logo ≤ 20 % du côté, contraste
//! WCAG ≥ 4,5:1 avec une encre plus foncée que le fond (les QR inversés ne
//! sont pas lus par tous les téléphones), alerte si un module imprimé fait
//! moins de 0,4 mm.

use qrcode::{Color, EcLevel, QrCode};
use crate::texte::{b_de, f_opt, i_opt, objet, s_de};
use serde_json::{json, Value};

pub const LOGO_MAX: f64 = 0.20;
pub const MODULE_MIN_MM: f64 = 0.4;
pub const CONTRASTE_MIN: f64 = 4.5;

#[derive(Debug, Clone, PartialEq)]
pub enum Forme {
    /// x, y, largeur, hauteur, rayon d'angle, sombre ?
    Rect(f64, f64, f64, f64, f64, bool),
    /// cx, cy, rayon, sombre ?
    Cercle(f64, f64, f64, bool),
}

#[derive(Default, Clone)]
pub struct Options {
    pub texte: String,
    /// "carre" | "arrondi" | "point"
    pub modules: String,
    /// "carre" | "arrondi"
    pub yeux: String,
    pub encre: String,
    pub fond: String,
    pub oeil: String,
    /// Fraction du côté réservée au logo (0 = aucun ; plafonnée à 0,20).
    pub logo: f64,
    /// data:image/(png|jpeg|webp);base64,… ou /assets/img/…
    pub logo_href: String,
    pub marge: Option<u32>,
    pub taille_mm: Option<f64>,
    pub titre: String,
    /// Rendre aussi la liste des formes (pour le canvas et le PDF).
    pub formes: bool,
}

impl Options {
    pub fn depuis(v: &Value) -> Self {
        Options {
            texte: s_de(v, "texte"),
            modules: s_de(v, "modules"),
            yeux: s_de(v, "yeux"),
            encre: s_de(v, "encre"),
            fond: s_de(v, "fond"),
            oeil: s_de(v, "oeil"),
            logo: f_opt(v, "logo").unwrap_or(0.0),
            logo_href: s_de(v, "logo_href"),
            marge: i_opt(v, "marge").map(|m| m.clamp(0, 64) as u32),
            taille_mm: f_opt(v, "taille_mm"),
            titre: s_de(v, "titre"),
            formes: b_de(v, "formes"),
        }
    }
}

// ─── Couleurs ───────────────────────────────────────────────────────────

pub fn couleur(hex: &str) -> Option<(u8, u8, u8)> {
    let h = hex.trim().trim_start_matches('#');
    let p = |s: &str| u8::from_str_radix(s, 16).ok();
    match h.len() {
        3 => {
            let c: Vec<char> = h.chars().collect();
            Some((p(&c[0].to_string().repeat(2))?, p(&c[1].to_string().repeat(2))?, p(&c[2].to_string().repeat(2))?))
        }
        6 => Some((p(&h[0..2])?, p(&h[2..4])?, p(&h[4..6])?)),
        _ => None,
    }
}

fn lin(c: u8) -> f64 {
    let s = c as f64 / 255.0;
    if s <= 0.03928 {
        s / 12.92
    } else {
        ((s + 0.055) / 1.055).powf(2.4)
    }
}

pub fn luminance(c: (u8, u8, u8)) -> f64 {
    0.2126 * lin(c.0) + 0.7152 * lin(c.1) + 0.0722 * lin(c.2)
}

pub fn contraste(a: (u8, u8, u8), b: (u8, u8, u8)) -> f64 {
    let (la, lb) = (luminance(a), luminance(b));
    let (hi, lo) = if la > lb { (la, lb) } else { (lb, la) };
    (hi + 0.05) / (lo + 0.05)
}

/// Vérifie qu'une encre se lit sur un fond : plus foncée, et assez contrastée.
pub fn lisible(encre: (u8, u8, u8), fond: (u8, u8, u8)) -> Result<f64, &'static str> {
    if luminance(encre) >= luminance(fond) {
        return Err("ENCRE_PLUS_CLAIRE_QUE_LE_FOND");
    }
    let r = contraste(encre, fond);
    if r < CONTRASTE_MIN {
        return Err("CONTRASTE_INSUFFISANT");
    }
    Ok(r)
}

fn hex(c: (u8, u8, u8)) -> String {
    format!("#{:02x}{:02x}{:02x}", c.0, c.1, c.2)
}

fn logo_sur(href: &str) -> bool {
    if href.len() > 600_000 || href.contains('"') || href.contains('<') || href.contains('>') || href.contains('\'') {
        return false;
    }
    let data = ["data:image/png;base64,", "data:image/jpeg;base64,", "data:image/webp;base64,"];
    if let Some(p) = data.iter().find(|p| href.starts_with(*p)) {
        return href[p.len()..].chars().all(|c| c.is_ascii_alphanumeric() || c == '+' || c == '/' || c == '=');
    }
    href.starts_with("/assets/img/")
        && !href.contains("..")
        && href.chars().all(|c| c.is_ascii_alphanumeric() || "/-_.?=".contains(c))
        && !href.to_ascii_lowercase().contains(".svg")
}

// ─── Géométrie ──────────────────────────────────────────────────────────

pub struct Rendu {
    pub largeur: usize,
    pub cote: f64,
    pub formes: Vec<Forme>,
    pub logo_zone: Option<(f64, f64, f64)>,
}

/// Modules de format (autour des yeux) et lignes de synchronisation.
fn fonctionnel(x: usize, y: usize, w: usize) -> bool {
    let format = (y == 8 && (x <= 8 || x >= w - 8)) || (x == 8 && (y <= 8 || y >= w - 8));
    format || x == 6 || y == 6 || dans_alignement(x, y, w)
}

/// Motifs d'alignement (versions 2 à 10, celles de nos adresses courtes).
fn dans_alignement(x: usize, y: usize, w: usize) -> bool {
    let v = (w - 17) / 4;
    let centres: &[usize] = match v {
        2 => &[6, 18],
        3 => &[6, 22],
        4 => &[6, 26],
        5 => &[6, 30],
        6 => &[6, 34],
        7 => &[6, 22, 38],
        8 => &[6, 24, 42],
        9 => &[6, 26, 46],
        10 => &[6, 28, 50],
        _ => &[],
    };
    for &cy in centres {
        for &cx in centres {
            if dans_oeil(cx, cy, w) {
                continue;
            }
            if x + 2 >= cx && x <= cx + 2 && y + 2 >= cy && y <= cy + 2 {
                return true;
            }
        }
    }
    false
}

fn dans_oeil(x: usize, y: usize, w: usize) -> bool {
    (x < 7 && y < 7) || (x >= w - 7 && y < 7) || (x < 7 && y >= w - 7)
}

pub fn dessiner(o: &Options) -> Result<Rendu, &'static str> {
    if o.texte.is_empty() {
        return Err("TEXTE_VIDE");
    }
    if o.texte.len() > 1200 {
        return Err("TEXTE_TROP_LONG");
    }
    let code = QrCode::with_error_correction_level(o.texte.as_bytes(), EcLevel::H).map_err(|_| "ENCODAGE_IMPOSSIBLE")?;
    let w = code.width();
    let couleurs = code.to_colors();
    let marge = o.marge.unwrap_or(4).max(4) as f64;
    let cote = w as f64 + 2.0 * marge;
    let mut formes = vec![Forme::Rect(0.0, 0.0, cote, cote, 0.0, false)];

    // Réserve du logo, centrée, en modules entiers de même parité que w.
    let frac = if o.logo > 0.0 { o.logo.min(LOGO_MAX) } else { 0.0 };
    let mut zone: Option<(f64, f64, f64)> = None;
    if frac > 0.0 {
        let mut s = (frac * w as f64).floor() as usize;
        if s % 2 != w % 2 {
            s = s.saturating_sub(1);
        }
        if s >= 3 {
            let debut = (w - s) as f64 / 2.0;
            zone = Some((debut, debut, s as f64));
        }
    }
    let dans_logo = |x: usize, y: usize| -> bool {
        match zone {
            Some((zx, zy, s)) => {
                let (fx, fy) = (x as f64, y as f64);
                fx + 1.0 > zx && fx < zx + s && fy + 1.0 > zy && fy < zy + s
            }
            None => false,
        }
    };

    for y in 0..w {
        for x in 0..w {
            if couleurs[y * w + x] != Color::Dark || dans_oeil(x, y, w) || dans_logo(x, y) {
                continue;
            }
            let (px, py) = (x as f64 + marge, y as f64 + marge);
            // Format et synchronisation restent carrés quel que soit le style :
            // ce sont les modules que le lecteur lit en premier.
            let style = if fonctionnel(x, y, w) { "carre" } else { o.modules.as_str() };
            formes.push(match style {
                "arrondi" => Forme::Rect(px + 0.04, py + 0.04, 0.92, 0.92, 0.3, true),
                "point" => Forme::Cercle(px + 0.5, py + 0.5, 0.48, true),
                _ => Forme::Rect(px, py, 1.0, 1.0, 0.0, true),
            });
        }
    }

    let arrondi = o.yeux == "arrondi";
    for (ex, ey) in [(0usize, 0usize), (w - 7, 0), (0, w - 7)] {
        let (x, y) = (ex as f64 + marge, ey as f64 + marge);
        let (r1, r2, r3) = if arrondi { (1.0, 0.6, 0.4) } else { (0.0, 0.0, 0.0) };
        formes.push(Forme::Rect(x, y, 7.0, 7.0, r1, true));
        formes.push(Forme::Rect(x + 1.0, y + 1.0, 5.0, 5.0, r2, false));
        formes.push(Forme::Rect(x + 2.0, y + 2.0, 3.0, 3.0, r3, true));
    }

    let logo_zone = zone.map(|(zx, zy, s)| (zx + marge, zy + marge, s));
    if let Some((zx, zy, s)) = logo_zone {
        formes.push(Forme::Rect(zx, zy, s, s, 0.6, false));
    }
    Ok(Rendu { largeur: w, cote, formes, logo_zone })
}

// ─── SVG ────────────────────────────────────────────────────────────────

/// Écrit un nombre au centième, sans passer par le formatage des flottants
/// (qui pèse lourd dans un .wasm).
fn n(v: f64) -> String {
    let c = (v * 100.0).round() as i64;
    let signe = if c < 0 { "-" } else { "" };
    let a = c.unsigned_abs();
    let (e, f) = (a / 100, a % 100);
    if f == 0 {
        if a == 0 { "0".into() } else { format!("{signe}{e}") }
    } else if f % 10 == 0 {
        format!("{signe}{e}.{}", f / 10)
    } else {
        format!("{signe}{e}.{:02}", f)
    }
}

/// Centièmes entiers, pour le JSON (évite le code de sérialisation des flottants).
fn c(v: f64) -> i64 {
    (v * 100.0).round() as i64
}

fn chemin(f: &Forme) -> String {
    match *f {
        Forme::Rect(x, y, w, h, r, _) if r <= 0.0 => format!("M{} {}h{}v{}h-{}z", n(x), n(y), n(w), n(h), n(w)),
        Forme::Rect(x, y, w, h, r, _) => {
            let r = r.min(w / 2.0).min(h / 2.0);
            format!(
                "M{} {}h{}a{r} {r} 0 0 1 {r} {r}v{}a{r} {r} 0 0 1 -{r} {r}h-{}a{r} {r} 0 0 1 -{r} -{r}v-{}a{r} {r} 0 0 1 {r} -{r}z",
                n(x + r),
                n(y),
                n(w - 2.0 * r),
                n(h - 2.0 * r),
                n(w - 2.0 * r),
                n(h - 2.0 * r),
                r = n(r)
            )
        }
        Forme::Cercle(cx, cy, r, _) => {
            format!("M{} {}a{r} {r} 0 1 0 {d} 0a{r} {r} 0 1 0 -{d} 0z", n(cx - r), n(cy), r = n(r), d = n(2.0 * r))
        }
    }
}

fn echapper(s: &str) -> String {
    s.chars()
        .filter(|c| !c.is_control())
        .map(|c| match c {
            '<' | '>' | '&' | '"' | '\'' => ' ',
            _ => c,
        })
        .collect()
}

pub fn svg(o: &Options, r: &Rendu, encre: (u8, u8, u8), fond: (u8, u8, u8), oeil: (u8, u8, u8)) -> String {
    let w = r.largeur as f64;
    let marge = (r.cote - w) / 2.0;
    let est_oeil = |f: &Forme| -> bool {
        if let Forme::Rect(x, y, _, _, _, _) = *f {
            let (mx, my) = (x - marge, y - marge);
            ((mx < 7.0 && my < 7.0) || (mx >= w - 7.0 && my < 7.0) || (mx < 7.0 && my >= w - 7.0)) && mx >= 0.0 && my >= 0.0
        } else {
            false
        }
    };
    let mut modules = String::new();
    let mut yeux_sombres = String::new();
    let mut yeux_clairs = String::new();
    for f in r.formes.iter().skip(1) {
        let sombre = matches!(f, Forme::Rect(.., true) | Forme::Cercle(.., true));
        if Some(f) == r.formes.last() && r.logo_zone.is_some() && !sombre {
            continue; // le coussin du logo est écrit à part
        }
        if est_oeil(f) {
            if sombre {
                yeux_sombres.push_str(&chemin(f));
            } else {
                yeux_clairs.push_str(&chemin(f));
            }
        } else if sombre {
            modules.push_str(&chemin(f));
        }
    }
    let dims = match o.taille_mm {
        Some(mm) if mm > 0.0 => format!(" width=\"{}mm\" height=\"{}mm\"", n(mm), n(mm)),
        _ => String::new(),
    };
    let titre = if o.titre.is_empty() { "QR code".to_string() } else { echapper(&o.titre) };
    let mut s = format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {c} {c}\"{dims} role=\"img\" aria-label=\"{titre}\">",
        c = n(r.cote)
    );
    if o.modules == "carre" || o.modules.is_empty() {
        s = s.replacen("role=", "shape-rendering=\"crispEdges\" role=", 1);
    }
    s.push_str(&format!("<rect width=\"{c}\" height=\"{c}\" fill=\"{}\"/>", hex(fond), c = n(r.cote)));
    s.push_str(&format!("<path fill=\"{}\" d=\"{}\"/>", hex(encre), modules));
    s.push_str(&format!("<path fill=\"{}\" d=\"{}\"/>", hex(oeil), yeux_sombres));
    s.push_str(&format!("<path fill=\"{}\" d=\"{}\"/>", hex(fond), yeux_clairs));
    if let Some((zx, zy, t)) = r.logo_zone {
        s.push_str(&format!(
            "<rect x=\"{}\" y=\"{}\" width=\"{}\" height=\"{}\" rx=\"0.6\" fill=\"{}\"/>",
            n(zx),
            n(zy),
            n(t),
            n(t),
            hex(fond)
        ));
        if logo_sur(&o.logo_href) {
            let m = (t * 0.1).max(0.4);
            s.push_str(&format!(
                "<image href=\"{}\" x=\"{}\" y=\"{}\" width=\"{}\" height=\"{}\" preserveAspectRatio=\"xMidYMid meet\"/>",
                o.logo_href,
                n(zx + m),
                n(zy + m),
                n(t - 2.0 * m),
                n(t - 2.0 * m)
            ));
        }
    }
    s.push_str("</svg>");
    s
}

fn formes_json(r: &Rendu) -> serde_json::Value {
    let v: Vec<serde_json::Value> = r
        .formes
        .iter()
        .map(|f| match *f {
            Forme::Rect(x, y, w, h, rr, s) => json!(["r", c(x), c(y), c(w), c(h), c(rr), s]),
            Forme::Cercle(cx, cy, rr, s) => json!(["c", c(cx), c(cy), c(rr), s]),
        })
        .collect();
    json!(v)
}

pub fn svg_json(entree: &str) -> String {
    let o: Options = match objet(entree) {
        Some(v) => Options::depuis(&v),
        None => return crate::texte::erreur("ENTREE_INVALIDE", "Options illisibles."),
    };
    let encre = couleur(if o.encre.is_empty() { "#040407" } else { &o.encre });
    let fond = couleur(if o.fond.is_empty() { "#ffffff" } else { &o.fond });
    let (encre, fond) = match (encre, fond) {
        (Some(a), Some(b)) => (a, b),
        _ => return crate::texte::erreur("COULEUR_INVALIDE", "Couleur illisible (#rrggbb attendu)."),
    };
    let oeil = if o.oeil.is_empty() { Some(encre) } else { couleur(&o.oeil) };
    let oeil = match oeil {
        Some(c) => c,
        None => return crate::texte::erreur("COULEUR_INVALIDE", "Couleur des yeux illisible."),
    };
    let ratio = match lisible(encre, fond).and(lisible(oeil, fond)) {
        Ok(_) => contraste(encre, fond).min(contraste(oeil, fond)),
        Err(code) => {
            let msg = if code == "CONTRASTE_INSUFFISANT" {
                "Ces deux couleurs ne se distinguent pas assez : le code ne serait pas lu à coup sûr."
            } else {
                "L'encre doit être plus foncée que le fond : beaucoup de téléphones ne lisent pas les codes inversés."
            };
            return crate::texte::erreur(code, msg);
        }
    };
    let r = match dessiner(&o) {
        Ok(r) => r,
        Err(code) => return crate::texte::erreur(code, "Le texte ne peut pas être encodé."),
    };
    let mut alertes: Vec<&str> = Vec::new();
    let module_mm = o.taille_mm.map(|mm| mm / r.cote);
    if let Some(m) = module_mm {
        if m < MODULE_MIN_MM {
            alertes.push("MODULE_TROP_PETIT");
        }
    }
    if o.logo > LOGO_MAX {
        alertes.push("LOGO_PLAFONNE");
    }
    if !o.logo_href.is_empty() && !logo_sur(&o.logo_href) {
        alertes.push("LOGO_REFUSE");
    }
    let mut sortie = json!({
        "ok": true,
        "svg": svg(&o, &r, encre, fond, oeil),
        "modules": r.largeur,
        "version": (r.largeur - 17) / 4,
        "cote": r.cote as i64,
        "echelle": 100,
        "module_um": module_mm.map(|m| (m * 1000.0).round() as i64),
        "contraste_x100": c(ratio),
        "logo_zone": r.logo_zone.map(|(x, y, s)| json!([c(x), c(y), c(s)])),
        "alertes": alertes
    });
    if o.formes {
        sortie["formes"] = formes_json(&r);
    }
    sortie.to_string()
}

// ─── Rastérisation (tests) ──────────────────────────────────────────────

/// Peint les formes en niveaux de gris, `px` pixels par module. Sert aux tests
/// de décodage ; le navigateur utilise canvas, avec la même liste de formes.
pub fn rasteriser(r: &Rendu, px: usize, logo_sombre: bool) -> (usize, Vec<u8>) {
    let taille = (r.cote * px as f64).round() as usize;
    let mut img = vec![255u8; taille * taille];
    let mut tout = r.formes.clone();
    if logo_sombre {
        // Pire cas réaliste : un logo foncé qui occupe 60 % de sa réserve.
        if let Some((zx, zy, s)) = r.logo_zone {
            tout.push(Forme::Rect(zx + s * 0.2, zy + s * 0.2, s * 0.6, s * 0.6, 0.0, true));
        }
    }
    for f in &tout {
        let (x0, y0, x1, y1, sombre) = match *f {
            Forme::Rect(x, y, w, h, _, s) => (x, y, x + w, y + h, s),
            Forme::Cercle(cx, cy, rr, s) => (cx - rr, cy - rr, cx + rr, cy + rr, s),
        };
        let a = |v: f64| ((v * px as f64).floor().max(0.0) as usize).min(taille);
        for py in a(y0)..a(y1 + 1.0 / px as f64).min(taille) {
            for pxx in a(x0)..a(x1 + 1.0 / px as f64).min(taille) {
                let (mx, my) = ((pxx as f64 + 0.5) / px as f64, (py as f64 + 0.5) / px as f64);
                let dedans = match *f {
                    Forme::Rect(x, y, w, h, rr, _) => {
                        if mx < x || mx > x + w || my < y || my > y + h {
                            false
                        } else if rr <= 0.0 {
                            true
                        } else {
                            let rr = rr.min(w / 2.0).min(h / 2.0);
                            let cx = mx.clamp(x + rr, x + w - rr);
                            let cy = my.clamp(y + rr, y + h - rr);
                            (mx - cx).powi(2) + (my - cy).powi(2) <= rr * rr
                        }
                    }
                    Forme::Cercle(cx, cy, rr, _) => (mx - cx).powi(2) + (my - cy).powi(2) <= rr * rr,
                };
                if dedans {
                    img[py * taille + pxx] = if sombre { 0 } else { 255 };
                }
            }
        }
    }
    (taille, img)
}

#[cfg(test)]
mod tests {
    use super::*;

    const URL: &str = "https://melodia-funebre.fr/m/7K3M9QXT2B";

    fn opts(modules: &str, yeux: &str, logo: f64) -> Options {
        Options { texte: URL.into(), modules: modules.into(), yeux: yeux.into(), logo, ..Default::default() }
    }

    fn decoder(r: &Rendu, logo_sombre: bool) -> String {
        let (t, img) = rasteriser(r, 8, logo_sombre);
        let mut prep = rqrr::PreparedImage::prepare_from_greyscale(t, t, |x, y| img[y * t + x]);
        let grilles = prep.detect_grids();
        assert!(!grilles.is_empty(), "aucune grille détectée");
        let (_, contenu) = grilles[0].decode().expect("décodage");
        contenu
    }

    #[test]
    fn chaque_style_se_lit() {
        for m in ["carre", "arrondi", "point"] {
            for y in ["carre", "arrondi"] {
                for logo in [0.0, 0.2] {
                    let r = dessiner(&opts(m, y, logo)).unwrap();
                    assert_eq!(decoder(&r, logo > 0.0), URL, "style {m}/{y}/logo {logo}");
                }
            }
        }
    }

    #[test]
    fn styles_lisibles_a_plusieurs_versions_et_resolutions() {
        let textes = [
            "https://melodia-funebre.fr/m/7K3M9QXT2BZZ".to_string(),
            format!("https://melodia-funebre.fr/m/7K3M9QXT2B?{}", "a".repeat(60)), // version 7+
        ];
        for t in &textes {
            for m in ["carre", "arrondi", "point"] {
                for y in ["carre", "arrondi"] {
                    for px in [6usize, 10] {
                        let o = Options { texte: t.clone(), modules: m.into(), yeux: y.into(), logo: 0.2, ..Default::default() };
                        let r = dessiner(&o).unwrap();
                        let (taille, img) = rasteriser(&r, px, true);
                        let mut prep = rqrr::PreparedImage::prepare_from_greyscale(taille, taille, |x, yy| img[yy * taille + x]);
                        let g = prep.detect_grids();
                        assert!(!g.is_empty(), "{m}/{y}/{px}px v{}", (r.largeur - 17) / 4);
                        let res = g[0].decode().map(|x| x.1).unwrap_or_else(|e| format!("ECHEC {e:?}")); assert_eq!(&res, t, "{m}/{y}/{px}px v{}", (r.largeur - 17) / 4);
                    }
                }
            }
        }
    }

    #[test]
    fn logo_plafonne_a_20_pourcent() {
        let r = dessiner(&opts("carre", "carre", 0.9)).unwrap();
        let (_, _, s) = r.logo_zone.unwrap();
        assert!(s / r.largeur as f64 <= LOGO_MAX + 1e-9);
        assert_eq!(decoder(&r, true), URL);
    }

    #[test]
    fn zone_de_silence_minimale() {
        let mut o = opts("carre", "carre", 0.0);
        o.marge = Some(1);
        let r = dessiner(&o).unwrap();
        assert_eq!(r.cote, r.largeur as f64 + 8.0);
    }

    #[test]
    fn contraste_refuse() {
        // or sur noir : encre plus claire que le fond
        let s = svg_json(&format!(r##"{{"texte":"{URL}","encre":"#c9a84c","fond":"#040407"}}"##));
        assert!(s.contains("ENCRE_PLUS_CLAIRE_QUE_LE_FOND"), "{s}");
        // gris clair sur ivoire
        let s = svg_json(&format!(r##"{{"texte":"{URL}","encre":"#c4bba6","fond":"#f4f1ea"}}"##));
        assert!(s.contains("CONTRASTE_INSUFFISANT"), "{s}");
        // yeux trop pâles
        let s = svg_json(&format!(r##"{{"texte":"{URL}","encre":"#040407","oeil":"#e3c977","fond":"#f4f1ea"}}"##));
        assert!(s.contains("CONTRASTE_INSUFFISANT"), "{s}");
    }

    #[test]
    fn couleurs_de_marque_acceptees() {
        for (e, f) in [("#040407", "#f4f1ea"), ("#806a30", "#f4f1ea"), ("#17150f", "#ebe6db"), ("#040407", "#ffffff")] {
            let s = svg_json(&format!(r##"{{"texte":"{URL}","encre":"{e}","fond":"{f}"}}"##));
            assert!(s.contains("\"ok\":true"), "{e} sur {f} : {s}");
        }
    }

    #[test]
    fn alerte_module_trop_petit() {
        let s = svg_json(&format!(r##"{{"texte":"{URL}","taille_mm":12}}"##));
        assert!(s.contains("MODULE_TROP_PETIT"));
        let s = svg_json(&format!(r##"{{"texte":"{URL}","taille_mm":40}}"##));
        assert!(!s.contains("MODULE_TROP_PETIT"));
        assert!(s.contains("width=\\\"40mm\\\""));
    }

    #[test]
    fn logo_svg_utilisateur_refuse() {
        assert!(!logo_sur("data:image/svg+xml;base64,PHN2Zz4="));
        assert!(!logo_sur("https://exemple.fr/logo.png"));
        assert!(!logo_sur("/assets/img/x.svg"));
        assert!(!logo_sur("/assets/img/../../etc"));
        assert!(!logo_sur("data:image/png;base64,abc\" onload=\"x"));
        assert!(logo_sur("/assets/img/logo-melodia-160.webp"));
        assert!(logo_sur("data:image/png;base64,iVBORw0KGgo="));
        let s = svg_json(&format!(r##"{{"texte":"{URL}","logo":0.2,"logo_href":"javascript:alert(1)"}}"##));
        assert!(s.contains("LOGO_REFUSE") && !s.contains("javascript"));
    }

    #[test]
    fn svg_bien_forme_et_formes() {
        let s = svg_json(&format!(r##"{{"texte":"{URL}","modules":"point","yeux":"arrondi","formes":true,"titre":"<b>x</b>"}}"##));
        let v: serde_json::Value = serde_json::from_str(&s).unwrap();
        let svg = v["svg"].as_str().unwrap();
        assert!(svg.starts_with("<svg") && svg.ends_with("</svg>"));
        assert!(!svg.contains("<b>"));
        assert!(v["formes"].as_array().unwrap().len() > 50);
    }

    #[test]
    fn contraste_wcag() {
        let r = contraste((0, 0, 0), (255, 255, 255));
        assert!((r - 21.0).abs() < 0.01);
    }
}
