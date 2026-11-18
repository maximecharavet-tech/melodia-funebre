#!/usr/bin/env python3
"""Prépare l'espace Médias de la console commerciale (assets/medias/).

Sources (machine de travail, hors dépôt) : voir docs/MEDIAS.md.
Toutes les métadonnées sont retirées (marque blanche). Le logo n'est jamais
généré : il est déjà sur les affiches approuvées, et posé tel quel ailleurs.
"""
import json, os, subprocess, sys
from PIL import Image, ImageFilter, ImageEnhance

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(RACINE, 'assets', 'medias')
CGPT = '/workspace/melodia-cgpt'
CLIPS = '/workspace/campagne-pub-melodia-ziggy/video/clips'
HERO = os.path.join(RACINE, 'assets', 'video', 'hero')

VISUELS = [
  ('mélodies-dorées', 'Mélodies dorées des souvenirs.png', 'Parce que leurs souvenirs méritent une musique unique'),
  ('resonnent-toujours', 'Souvenirs qui résonnent toujours.png', 'Parce que certains souvenirs méritent une musique unique'),
  ('souvenirs-eternels', 'Mélodie funèbre des souvenirs éternels.png', 'Des souvenirs qui résonnent toujours'),
  ('continuent-de-vibrer', 'Souvenirs en harmonie éternelle.png', 'Des souvenirs qui continuent de vibrer'),
  ('un-lien', 'Mélodie funèbre _ souvenirs éternels.png', 'Plus qu’une musique, un lien qui ne s’éteint pas'),
  ('sous-les-arches', 'Mélodie funèbre sous les arches.png', 'Chaque souvenir mérite sa musique'),
  ('plus-beaux-souvenirs', 'Mélodie funèbre, souvenirs en musique.png', 'Parce que les plus beaux souvenirs méritent une musique unique'),
  ('grand-mere', 'Mélodies dorées pour une grand-mère bien-aimée.png', 'Parce que leurs souvenirs méritent une musique unique'),
  ('harmonie', 'Souvenirs en harmonie éternelle (1).png', 'Parce que leurs souvenirs méritent une musique unique'),
  ('celestes', 'Mélodie funèbre des souvenirs célestes.png', 'Des souvenirs qui résonnent toujours'),
]
VISUELS = [(s.replace('é', 'e'), f, t) for s, f, t in VISUELS]

FOND = (4, 4, 7)

def propre(im):
  """Copie sans métadonnées (EXIF, XMP, C2PA)."""
  im = im.convert('RGB')
  out = Image.new('RGB', im.size)
  out.paste(im)
  return out

def remplir(im, w, h):
  """L'affiche entière, centrée, sur un fond tiré d'elle-même, flouté et assombri."""
  fond = im.copy()
  r = max(w / fond.width, h / fond.height)
  fond = fond.resize((round(fond.width * r), round(fond.height * r)), Image.LANCZOS)
  x, y = (fond.width - w) // 2, (fond.height - h) // 2
  fond = fond.crop((x, y, x + w, y + h)).filter(ImageFilter.GaussianBlur(28))
  fond = ImageEnhance.Brightness(fond).enhance(0.38)
  r = min(w / im.width, h / im.height)
  av = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
  fond.paste(av, ((w - av.width) // 2, (h - av.height) // 2))
  return fond

def visuels():
  d = os.path.join(OUT, 'visuels'); os.makedirs(d, exist_ok=True)
  for slug, src, _ in VISUELS:
    im = propre(Image.open(os.path.join(CGPT, src)))
    im.save(os.path.join(d, slug + '.jpg'), quality=90, optimize=True, progressive=True)
    remplir(im, 1080, 1080).save(os.path.join(d, slug + '-1x1.jpg'), quality=88, optimize=True, progressive=True)
    remplir(im, 1080, 1350).save(os.path.join(d, slug + '-4x5.jpg'), quality=88, optimize=True, progressive=True)
    v = im.copy(); v.thumbnail((420, 760)); v.save(os.path.join(d, slug + '-vignette.webp'), quality=78)

def ff(*a):
  subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)

X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-an', '-map_metadata', '-1', '-movflags', '+faststart', '-r', '24']

def videos():
  d = os.path.join(OUT, 'videos'); os.makedirs(d, exist_ok=True)
  for i in range(1, 9):
    n = 'm0%d' % i
    a = os.path.join(CLIPS, 'melodia', n + '.mp4'); b = os.path.join(CLIPS, 'melodia-16x9', n + '.mp4')
    ff('-i', a, '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', *X264, os.path.join(d, n + '-9x16.mp4'))
    ff('-i', b, '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080', *X264, os.path.join(d, n + '-16x9.mp4'))
    ff('-i', b, '-vf', 'scale=-2:1080,crop=1080:1080', *X264, os.path.join(d, n + '-1x1.mp4'))
    ff('-ss', '3', '-i', a, '-frames:v', '1', '-vf', 'scale=420:-2', '-map_metadata', '-1', os.path.join(d, n + '-vignette.webp'))
  # deux plans du hero (déjà dans le dépôt en 16:9 et 9:16) : seul le carré manque
  ff('-i', os.path.join(HERO, '01-seuil-16x9.mp4'), '-vf', 'crop=900:900', *X264, os.path.join(d, 'seuil-1x1.mp4'))
  ff('-i', os.path.join(HERO, '05-lys-9x16.mp4'), '-vf', 'crop=900:900:0:350', *X264, os.path.join(d, 'lys-1x1.mp4'))
  for s, h in (('seuil', '01-seuil-9x16'), ('lys', '05-lys-9x16')):
    ff('-ss', '5', '-i', os.path.join(HERO, h + '.mp4'), '-frames:v', '1', '-vf', 'scale=420:-2', '-map_metadata', '-1', os.path.join(d, s + '-vignette.webp'))

if __name__ == '__main__':
  quoi = sys.argv[1:] or ['visuels', 'videos']
  if 'visuels' in quoi: visuels()
  if 'videos' in quoi: videos()
