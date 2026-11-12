#!/usr/bin/env python3
"""Dérivés allégés des visuels de assets/pdf-extra/ pour les PDF premium.

Les originaux restent intacts. Les dérivés (assets/pdf-extra/opt/) sont
redimensionnés de façon uniforme (jamais recadrés) et recompressés pour que
chaque PDF reste sous les 2,5 Mo de la pièce jointe d'un e-mail.
Usage : python3 scripts/optimiser-pdf-extra.py   (Pillow requis, une seule fois)
"""
import os
from PIL import Image
ICI = os.path.join(os.path.dirname(__file__), '..', 'assets', 'pdf-extra')
OUT = os.path.join(ICI, 'opt')
os.makedirs(OUT, exist_ok=True)
# nom : (largeur max, qualité JPEG) ; None = PNG avec transparence conservée
JOBS = {
  'carte-julie-serve.png': (1659, 93),          # pleine définition : c'est un objet imprimé
  'visuel-colombe-vitrail.jpg': (1240, 84),
  'visuel-piano-lac.png': (941, 88),
  'visuel-gramophone.png': (941, 88),
  'visuel-arches.png': (941, 88),
  'visuel-souvenirs-violon.jpg': (1240, 84),
  'visuel-ceremonie.jpg': (1100, 84),
  'visuel-violon-detail.jpg': (1000, 85),
  'visuel-colombe-detail.jpg': (1300, 85),
  'visuel-lys.jpg': (760, 85),
  'visuel-partition.jpg': (1000, 85),
  'visuel-crepuscule.jpg': (1800, 85),
  'visuel-fleurs.jpg': (1000, 85),
  'visuel-bougies.jpg': (900, 85),
  'plaque-qr.jpg': (1100, 86),
  'salon-tourne-disque.jpg': (1024, 86),
  'lockup-officiel.png': (700, None),
  'monogramme.png': (420, None),
}
for nom, (larg, q) in JOBS.items():
    im = Image.open(os.path.join(ICI, nom))
    if im.width > larg:
        im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
    base = nom.rsplit('.', 1)[0]
    if q is None:
        im.save(os.path.join(OUT, base + '.png'), optimize=True)
    else:
        im.convert('RGB').save(os.path.join(OUT, base + '.jpg'), quality=q, optimize=True, progressive=False, subsampling=0 if base.startswith('carte') else 2)
    print(nom, '->', im.size)
