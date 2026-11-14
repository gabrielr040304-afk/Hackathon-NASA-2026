"""Recorta 2 km x 2 km do relevo HiRISE de Jezero (1 m) e salva data/jezero/terrain.bin + terrain.json.

Le so as linhas necessarias do GeoTIFF remoto (HTTP Range), sem baixar os 1,8 GB.
Uso: python tools/prep_terrain.py
"""
import json, math, struct, sys, urllib.request
from array import array
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

URL = ("https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/HiRISE/"
       "JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m_Eqc_latTs0_lon0_blend40.tif")
R = 3396190.0                      # esfera Mars 2000 IAU (mesma do DTM)
CENTER_LAT, CENTER_LON = 18.4975, 77.305   # Cheyava Falls (paradas do Perseverance, sois 1204-1215)
HALF_M = 1000.0                    # meia largura da area, em metros de chao
OUT = 512
OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "jezero"


def get(start, length):
    req = urllib.request.Request(URL, headers={"Range": f"bytes={start}-{start + length - 1}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def read_tags():
    head = get(0, 65536)
    if head[:2] != b"II" or struct.unpack("<H", head[2:4])[0] != 42:
        sys.exit("ERRO: esperado TIFF classico little-endian")
    ifd = struct.unpack("<I", head[4:8])[0]
    n = struct.unpack("<H", head[ifd:ifd + 2])[0]
    sizes = {1: 1, 2: 1, 3: 2, 4: 4, 12: 8, 16: 8}
    fmt = {1: "B", 2: "c", 3: "H", 4: "I", 12: "d", 16: "Q"}
    tags = {}
    for i in range(n):
        e = head[ifd + 2 + 12 * i: ifd + 14 + 12 * i]
        tag, typ, cnt = struct.unpack("<HHI", e[:8])
        nbytes = sizes[typ] * cnt
        raw = e[8:8 + nbytes] if nbytes <= 4 else None
        if raw is None:
            off = struct.unpack("<I", e[8:12])[0]
            raw = head[off:off + nbytes] if off + nbytes <= len(head) else get(off, nbytes)
        tags[tag] = raw if typ == 2 else struct.unpack(f"<{cnt}{fmt[typ]}", raw)
    return tags


def main():
    t = read_tags()
    width, height = t[256][0], t[257][0]
    if t[258][0] != 32 or t[339][0] != 3 or t[259][0] != 1 or t[278][0] != 1:
        sys.exit("ERRO: esperado float32 sem compressao, 1 linha por faixa")
    sx, sy = t[33550][0], t[33550][1]
    x0, y0 = t[33922][3], t[33922][4]
    offsets = t[273]
    nodata = float(t[42113].rstrip(b"\x00").decode()) if 42113 in t else None

    lat = math.radians(CENTER_LAT)
    dlat = HALF_M / R
    dlon = HALF_M / (R * math.cos(lat))
    west, east = math.radians(CENTER_LON) - dlon, math.radians(CENTER_LON) + dlon
    north, south = lat + dlat, lat - dlat
    col0, col1 = int((R * west - x0) / sx), int(math.ceil((R * east - x0) / sx))
    row0, row1 = int((y0 - R * north) / sy), int(math.ceil((y0 - R * south) / sy))
    if not (0 <= col0 < col1 <= width and 0 <= row0 < row1 <= height):
        sys.exit("ERRO: area fora da cobertura do DTM")
    cols, rows = col1 - col0, row1 - row0
    print(f"janela: {cols} x {rows} px (colunas {col0}-{col1}, linhas {row0}-{row1})")

    def fetch(r):
        return array("f", get(offsets[r] + col0 * 4, cols * 4))

    with ThreadPoolExecutor(16) as ex:
        src = list(ex.map(fetch, range(row0, row1)))
    if sys.byteorder != "little":
        for a in src:
            a.byteswap()

    def valid(v):
        return math.isfinite(v) and (nodata is None or abs(v - nodata) > 1) and v > -1e30

    out = array("f", [0.0]) * (OUT * OUT)
    ok = [False] * (OUT * OUT)
    for i in range(OUT):
        ra, rb = i * rows // OUT, max((i + 1) * rows // OUT, i * rows // OUT + 1)
        for j in range(OUT):
            ca, cb = j * cols // OUT, max((j + 1) * cols // OUT, j * cols // OUT + 1)
            vals = [v for r in range(ra, rb) for v in src[r][ca:cb] if valid(v)]
            if vals:
                out[i * OUT + j] = sum(vals) / len(vals)
                ok[i * OUT + j] = True

    # preenche celulas sem dado com a media dos vizinhos validos
    missing = ok.count(False)
    for _ in range(OUT):
        if all(ok):
            break
        new = ok[:]
        for k in (k for k, v in enumerate(ok) if not v):
            i, j = divmod(k, OUT)
            nb = [out[a * OUT + b] for a, b in ((i - 1, j), (i + 1, j), (i, j - 1), (i, j + 1))
                  if 0 <= a < OUT and 0 <= b < OUT and ok[a * OUT + b]]
            if nb:
                out[k] = sum(nb) / len(nb)
                new[k] = True
        ok = new

    # autoverificacao
    assert all(ok), "sobrou celula sem dado"
    lo, hi = min(out), max(out)
    assert -3000 <= lo and hi <= -1500, f"alturas fora do esperado: {lo} .. {hi}"
    c = out[(OUT // 2) * OUT + OUT // 2]
    assert abs(c - (-2353)) < 30, f"centro {c:.1f} m longe de -2353 m (Perseverance sol 1206)"

    ground_w = cols * sx * math.cos(lat)
    ground_h = rows * sy
    meta = {
        "width": OUT, "height": OUT,
        "m_per_px_x": ground_w / OUT, "m_per_px_y": ground_h / OUT,
        "center_lat": CENTER_LAT, "center_lon": CENTER_LON,
        "bbox": [math.degrees((x0 + col0 * sx) / R), math.degrees((y0 - row1 * sy) / R),
                 math.degrees((x0 + col1 * sx) / R), math.degrees((y0 - row0 * sy) / R)],
        "elev_min": lo, "elev_max": hi,
        "source": "USGS Mars 2020 TRN HiRISE DTM (JEZ_hirise_soc_006, 1 m), media em blocos para 512x512",
        "source_url": URL,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUT_DIR / "terrain.bin", "wb") as f:
        out.tofile(f)
    (OUT_DIR / "terrain.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"OK  min {lo:.1f} m  max {hi:.1f} m  centro {c:.1f} m  "
          f"area {ground_w:.0f} x {ground_h:.0f} m  celulas preenchidas {missing}")


if __name__ == "__main__":
    main()
