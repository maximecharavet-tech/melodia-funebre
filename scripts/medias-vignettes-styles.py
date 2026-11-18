#!/usr/bin/env python3
"""Vignettes des styles : AI Horde (réseau bénévole, gratuit, clé anonyme), modèle SDXL."""
import json, sys, time, base64, urllib.request, io, os
from PIL import Image
API = 'https://aihorde.net/api/v2'
H = {'apikey': '0000000000', 'Content-Type': 'application/json', 'Client-Agent': 'melodia-vignettes:1.0:anonymous', 'User-Agent': 'curl/8.5.0'}
SUJET = 'a still life of white lilies in a glass vase and a single lit candle on a wooden table by a window, soft light'
NEG = 'text, letters, words, watermark, signature, logo, person, people, face, hands, child, coffin, neon, glitter, sparkles, lens flare, cartoon, 3d render, oversaturated, blurry, deformed, lowres, frame border'
# vignettes seulement : quand le modèle reste trop photographique, on nomme le médium plus franchement
RENFORT = json.loads(os.environ.get('RENFORT', '{}'))
OUT = os.path.dirname(os.path.abspath(__file__))
DOSSIER = os.environ.get('DOSSIER', 'sortie')
def req(m, path, body=None):
    r = urllib.request.Request(API + path, method=m, headers=H, data=json.dumps(body).encode() if body else None)
    with urllib.request.urlopen(r, timeout=60) as f: return json.load(f)
def lancer(style, seed, modele):
    tete, _, reste = style['prompt'].partition(', ')
    if style['id'] in RENFORT: tete = RENFORT[style['id']]
    photo = style['id'] in ('argentique', 'noir-blanc')
    p = f"({tete}:1.4), {reste}, depicting {SUJET}, harmonious, dignified ### {NEG}" + ('' if photo else ', photograph, photorealistic, photo')
    reglages = {'width': 512, 'height': 512, 'seed': str(seed), 'n': 1, 'karras': True}
    if 'DreamShaper' in modele: reglages.update(steps=6, cfg_scale=2, sampler_name='k_euler_a')
    else: reglages.update(steps=30, cfg_scale=6, sampler_name='k_dpmpp_2m')
    body = {'prompt': p, 'params': reglages,
            'models': [modele], 'nsfw': False, 'censor_nsfw': True, 'r2': True, 'shared': False, 'trusted_workers': False}
    return req('POST', '/generate/async', body)['id']
def attendre(i):
    while True:
        c = req('GET', f'/generate/check/{i}')
        if c.get('done'): break
        if c.get('faulted') or not c.get('is_possible', True): return None
        time.sleep(8)
    s = req('GET', f'/generate/status/{i}')
    g = (s.get('generations') or [None])[0]
    if not g: return None
    img = g['img']
    data = urllib.request.urlopen(urllib.request.Request(img, headers={'User-Agent': 'curl/8.5.0'}), timeout=60).read() if img.startswith('http') else base64.b64decode(img)
    return Image.open(io.BytesIO(data)).convert('RGB'), g.get('model')
if __name__ == '__main__':
    styles = json.load(open(sys.argv[1]))['styles']
    ids = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else [s['id'] for s in styles]
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1234
    modele = sys.argv[4] if len(sys.argv) > 4 else 'Juggernaut XL'
    def un(s):
        essai = 0
        while essai < 3:
            try:
                i = lancer(s, seed + essai, modele)
                r = attendre(i)
                if r:
                    im, m = r
                    im = im.resize((512, 512), Image.LANCZOS)
                    clean = Image.new('RGB', im.size); clean.paste(im)
                    os.makedirs(os.path.join(OUT, DOSSIER), exist_ok=True); clean.save(os.path.join(OUT, DOSSIER, s['id'] + '.webp'), quality=80)
                    print('ok', s['id'], m, flush=True); return
                essai += 1
            except Exception as e:
                if '429' in str(e): time.sleep(45); continue
                essai += 1
                print('erreur', s['id'], e, flush=True); time.sleep(15)
        print('echec', s['id'], flush=True)
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(int(os.environ.get('PAR', '6'))) as ex:
        list(ex.map(un, [x for x in styles if x['id'] in ids]))
