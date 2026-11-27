#!/usr/bin/env python3
"""Variantes intermédiaires des grandes images (mobile).

Sur un téléphone, une affiche de 368 px affichée à 84 % de l'écran
demandait la version 941 px : le navigateur n'avait que 480 ou 941 à
choisir. On ajoute des largeurs intermédiaires, réduites depuis la
meilleure source disponible, en WebP qualité 88 (méthode 6) : à
l'œil, rien ne change. Relancer après l'ajout d'une affiche :
    python3 scripts/variantes-images.py
"""
import os, sys
from PIL import Image

RACINE = os.path.join(os.path.dirname(__file__), '..')
QUALITE = 88

def variante(source, sortie, largeur):
    sortie = os.path.join(RACINE, sortie)
    if os.path.exists(sortie):
        return False
    im = Image.open(os.path.join(RACINE, source))
    if im.width <= largeur:
        return False
    h = round(im.height * largeur / im.width)
    im = im.convert('RGB').resize((largeur, h), Image.LANCZOS)
    im.save(sortie, 'WEBP', quality=QUALITE, method=6)
    print('  ', sortie.replace(RACINE + '/', ''), os.path.getsize(sortie) // 1024, 'Ko')
    return True

def meilleure(*candidats):
    ex = [c for c in candidats if c and os.path.exists(os.path.join(RACINE, c))]
    return max(ex, key=lambda c: Image.open(os.path.join(RACINE, c)).width) if ex else None

# Affiches des guides
for nom in ('celebrer-une-vie', 'instruments-du-monde', 'la-musique-fait-vivre'):
    src = 'assets/img/guides/%s-941.webp' % nom
    for w in (640, 760):
        variante(src, 'assets/img/guides/%s-%d.webp' % (nom, w), w)

# Affiches de campagne (afficheCampagne)
for nom in ('adieux-en-musique', 'belle-note-finale', 'certaines-melodies', 'chaque-vie-sa-melodie',
            'duo-au-piano', 'plaque-et-telephone', 'poignee-de-main', 'souvenirs-ukulele'):
    d = 'assets/img/campagne/'
    src = meilleure(d + nom + '.jpg', d + nom + '.png', d + nom + '.webp', d + nom + '-941.webp')
    if not src:
        print('   (source introuvable)', nom); continue
    for w in (640, 760):
        variante(src, d + '%s-%d.webp' % (nom, w), w)

# Qui sommes-nous
for nom in ('atelier-clavier', 'atelier-ecoute'):
    variante('assets/img/maison/%s-1264.webp' % nom, 'assets/img/maison/%s-900.webp' % nom, 900)
variante('assets/img/ventures/maxime-bureau-960.webp', 'assets/img/ventures/maxime-bureau-720.webp', 720)

# Affiche (poster) de la vidéo de l'atelier : même image, en WebP
p = os.path.join(RACINE, 'assets/img/campagne/atelier-poster.webp')
if not os.path.exists(p):
    Image.open(os.path.join(RACINE, 'assets/img/campagne/atelier.jpg')).convert('RGB').save(p, 'WEBP', quality=QUALITE, method=6)
    print('   assets/img/campagne/atelier-poster.webp', os.path.getsize(p) // 1024, 'Ko')
