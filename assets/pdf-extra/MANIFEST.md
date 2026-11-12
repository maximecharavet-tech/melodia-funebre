# Visuels pour les PDF premium supplémentaires (console Julie)

Dossier préparé pour le second passage Claude Code. Ce sont des visuels **déjà existants** (campagne, charte, site, carte officielle). Aucun logo ni portrait de famille n’a été généré pour cette livraison.

À utiliser tels quels (redimensionnement uniforme autorisé, pas de recadrage qui coupe un visage, un logo ou la carte). Formats PNG/JPEG uniquement, prêts pour `build/pdf-style.js` (`image()`).

La carte de Julie Serve **doit figurer sur chaque PDF** (verso ou bloc contact). Fichier à utiliser : `carte-julie-serve.png`.

| Fichier | px | Poids | Usage conseillé | Source |
|---|---|---|---|---|
| `carte-julie-serve.png` | 1659×948 | 2,2 Mo PNG | **Obligatoire sur chaque PDF.** Carte de visite officielle de Julie Serve, Directrice marketing & commerciale (`julie@melodia-funebre.fr`). Ne pas la redessiner, ne pas la recadrer, ne pas régénérer le portrait. Positionner entière, avec marges, au verso ou dans un bloc contact. | `/workspace/uploads/julie/carte-julie.png` (meilleure version ; le JPEG `melodia-ad/brochures/surreal2/assets/img/carte-julie.jpg` est le même visuel, plus compressé — ne pas l’utiliser) |
| `lockup-officiel.png` | 1600×1590 RGBA | 1,4 Mo | Logo officiel (fond transparent) pour couvertures, en-têtes, pieds de page. Ne pas redessiner le logo. | `melodia-ad/brochures/v2/assets/logo/lockup.png` |
| `logo-melodia-v1.png` | 1254×1254 | 1,5 Mo | Monogramme + lockup circulaire officiel, fond clair. | `assets/img/logo-melodia-v1.png` (dépôt) |
| `monogramme.png` | 1024×1024 RGBA | 529 Ko | Monogramme MF seul, fond transparent (filigrane discret, coins, QR habillé). | `melodia-ad/brochures/v2/assets/logo/monogramme.png` |
| `visuel-colombe-vitrail.jpg` | 2258×4012 | 2,9 Mo | **Meilleure définition.** Couverture / pleine page : colombe, lys, bougies, paysage, style vitrail. | `melodia-ad/brochures/surreal2/assets/img/visuel-1.jpg` |
| `visuel-souvenirs-violon.jpg` | 2258×4012 | 2,1 Mo | Couverture ou intérieure « souvenirs qui résonnent » : violoniste au coucher de soleil. Visuel de campagne déjà en brochure (pas un portrait de famille cliente). | `melodia-ad/brochures/surreal2/assets/img/visuel-2.jpg` |
| `visuel-ceremonie.jpg` | 2457×3686 | 2,0 Mo | Intérieure cérémonie uniquement, usage respectueux. Visuel de campagne déjà en brochure. | `melodia-ad/brochures/surreal2/assets/img/visuel-3.jpg` |
| `visuel-violon-detail.jpg` | 1364×1716 | 555 Ko | Détail violon / musicien, hors-texte. | `surreal2/assets/img/visuel-2-violin.jpg` |
| `visuel-colombe-detail.jpg` | 1716×1474 | 907 Ko | Détail colombe, ouverture ou encadré. | `surreal2/assets/img/visuel-1-dove.jpg` |
| `visuel-lys.jpg` | 924×1698 | 524 Ko | Lys, verticale poétique. | `surreal2/assets/img/visuel-1-lily.jpg` |
| `visuel-partition.jpg` | 1146×1082 | 321 Ko | Partition ancienne, encadré musical. | `surreal2/assets/img/visuel-2-score.jpg` |
| `visuel-crepuscule.jpg` | 2252×1100 | 535 Ko | Bandeau paysage / coucher de soleil (format large). | `surreal2/assets/img/visuel-3-sunset.jpg` |
| `visuel-fleurs.jpg` | 1320×1210 | 400 Ko | Composition florale. | `surreal2/assets/img/visuel-3-flowers.jpg` |
| `visuel-bougies.jpg` | 1100×1258 | 479 Ko | Bougies, atmosphère recueillie. | `surreal2/assets/img/visuel-1-candles.jpg` |
| `visuel-gramophone.png` | 941×1672 | 1,9 Mo | Visuel signature « gramophone-lys ». Idéal couverture ou page d’écoute. | `melodia-ad/ref/ref-04.png` |
| `visuel-arches.png` | 941×1672 | 2,6 Mo | Arcades, cyprès, violoncelliste — charte campagne. | `melodia-ad/ref/ref-09.png` |
| `visuel-piano-lac.png` | 941×1672 | 2,1 Mo | Piano au bord de l’eau, lumière dorée. | `melodia-ad/ref/ref-02.png` |
| `plaque-qr.jpg` | 1100×1525 | 229 Ko | Plaque funéraire avec QR d’écoute (offre Pro / partenaires). Le QR de la photo est illustratif : les QR **fonctionnels** des PDF doivent être générés (comme dans `build/pdf-ecoute.js`) vers des URLs réelles du site. | `assets/img/plaque-qr-1100.jpg` (dépôt) |
| `salon-tourne-disque.jpg` | 1024×1536 | 557 Ko | Affiche campagne « Un dernier message en musique » (salon, tourne-disque). JPEG converti depuis le WebP du site (le helper `image()` n’accepte que PNG/JPEG). Le QR de l’affiche est illustratif ; générer des QR réels. | `assets/img/campagne/salon-tourne-disque.webp` |
| `disque-or.png` | 480×480 | 258 Ko | Raster du disque d’or (meilleur que `assets/img/courriel/disque-or.jpg` en 240×240, **inutilisable en impression**). Pour un disque grand format, **reproduire le disque CSS du site** (`assets/css/style.css`, bloc « Le disque », déjà fait dans `build/pdf-ecoute.js`) à haute résolution — ne pas inventer un nouveau disque. | `/workspace/melodia-mail/disque-480.png` |

## Ce qu’il ne faut pas faire

- Ne pas générer de nouveau logo, ni de nouveaux portraits (familles ou Julie).
- Ne pas inventer de témoignages, de chiffres, d’interfaces ou de QR qui n’auraient pas d’URL réelle.
- Ne pas nommer Mureka (ni aucun fournisseur musical) dans les PDF : la musique est « composé par Melodia Funèbre ».
- Ne pas y faire figurer `MASTERMAX` ni aucun secret.
