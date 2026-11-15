"""Monta data/jezero/texture.jpg (2048x2048) juntando quadradinhos do mosaico HiRISE do Mars Trek
que cobrem exatamente o bbox de data/jezero/terrain.json.
Uso: python tools/prep_texture.py   (requer Pillow 13.0.0)
"""
import io, json, math, urllib.request, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image

Z = 15
TILE = 256
URL = ("https://trek.nasa.gov/tiles/Mars/EQ/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd/"
       "1.0.0/default/default028mm/{z}/{y}/{x}.png")
DIR = Path(__file__).resolve().parent.parent / "data" / "jezero"
if '--gale' in sys.argv:
    DIR = DIR.parent / 'gale'
    URL = 'https://trek.nasa.gov/tiles/Mars/EQ/curiosity_hirise_mosaic/1.0.0/default/default028mm/{z}/{y}/{x}.png'


def tile(xy):
    x, y = xy
    with urllib.request.urlopen(URL.format(z=Z, y=y, x=x), timeout=60) as r:
        return xy, Image.open(io.BytesIO(r.read())).convert("RGB")


def main():
    w, s, e, n = json.loads((DIR / "terrain.json").read_text(encoding="utf-8"))["bbox"]
    deg = 180 / 2 ** Z                       # graus por quadradinho (grade EPSG:4326 do Trek)
    x0, x1 = math.floor((w + 180) / deg), math.floor((e + 180) / deg)
    y0, y1 = math.floor((90 - n) / deg), math.floor((90 - s) / deg)
    xs, ys = range(x0, x1 + 1), range(y0, y1 + 1)
    canvas = Image.new("RGB", (len(xs) * TILE, len(ys) * TILE))
    with ThreadPoolExecutor(8) as ex:
        for (x, y), im in ex.map(tile, [(x, y) for y in ys for x in xs]):
            canvas.paste(im, ((x - x0) * TILE, (y - y0) * TILE))
    px = TILE / deg                           # pixels por grau
    box = (round((w + 180 - x0 * deg) * px), round((90 - n - y0 * deg) * px),
           round((e + 180 - x0 * deg) * px), round((90 - s - y0 * deg) * px))
    canvas.crop(box).resize((2048, 2048), Image.LANCZOS).save(DIR / "texture.jpg", quality=85)
    print(f"OK  {len(xs)}x{len(ys)} quadradinhos, recorte {box}, salvo texture.jpg")


if __name__ == "__main__":
    main()
