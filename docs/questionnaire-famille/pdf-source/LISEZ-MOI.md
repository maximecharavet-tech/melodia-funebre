# Source du PDF manuscrit

`build.py` génère `questionnaire.html` puis l'imprime en A4 avec Chromium (`google-chrome --headless`).
Il attend un dossier `assets/` à côté de lui :

- polices `assets/fonts/cormorant-garamond-*.woff2`, `jost-*.woff2` (OFL, déjà dans le dépôt) ;
- `assets/pdf-extra/lockup-officiel.png`, `monogramme.png` (logo officiel, déjà dans le dépôt) ;
- `visuel-2-sunset.jpg` (visuel de campagne, dossier `melodia-ad/brochures/surreal2/assets/img/`) ;
- `qr-demos.svg` : QR vers `https://melodia-funebre.fr/demos` (`python3 -m qrcode`, licence BSD).

Le PDF produit est `documents/melodia-questionnaire-famille.pdf`.
