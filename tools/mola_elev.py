"""Lê a altitude MOLA (463 m/px, USGS) em pontos lat/lon, lendo só os bytes necessários do GeoTIFF remoto.
Uso: python tools/mola_elev.py 47.25 -164.0 [lat lon ...]
"""
import math, struct, sys, urllib.request

URL = "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"
R = 3396190.0


def get(start, length):
    req = urllib.request.Request(URL, headers={"Range": f"bytes={start}-{start + length - 1}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def tags():
    head = get(0, 65536)
    assert head[:2] == b"II" and struct.unpack("<H", head[2:4])[0] == 42, "esperado TIFF clássico"
    ifd = struct.unpack("<I", head[4:8])[0]
    if ifd + 2 > len(head):  # índice no fim do arquivo
        blk = get(ifd, 65536)
        n = struct.unpack("<H", blk[:2])[0]
        entries = blk[2:2 + 12 * n]
    else:
        n = struct.unpack("<H", head[ifd:ifd + 2])[0]
        entries = head[ifd + 2: ifd + 2 + 12 * n]
    size = {1: 1, 2: 1, 3: 2, 4: 4, 12: 8}
    fmt = {1: "B", 2: "c", 3: "H", 4: "I", 12: "d"}
    out = {}
    for i in range(n):
        e = entries[12 * i: 12 * i + 12]
        tag, typ, cnt = struct.unpack("<HHI", e[:8])
        nb = size[typ] * cnt
        if nb <= 4:
            raw = e[8:8 + nb]
        else:
            off = struct.unpack("<I", e[8:12])[0]
            raw = head[off:off + nb] if off + nb <= len(head) else get(off, nb)
        out[tag] = raw if typ == 2 else struct.unpack(f"<{cnt}{fmt[typ]}", raw)
    return out


def main(coords):
    t = tags()
    assert t[259][0] == 1, "esperado sem compressão"
    bps = t[258][0] // 8
    signed = t.get(339, (1,))[0] == 2
    sx, sy = t[33550][0], t[33550][1]
    x0, y0 = t[33922][3], t[33922][4]
    offsets, rows_per_strip = t[273], t[278][0]
    width = t[256][0]
    for lat, lon in coords:
        col = int((R * math.radians(lon) - x0) / sx)
        row = int((y0 - R * math.radians(lat)) / sy)
        strip, r_in = divmod(row, rows_per_strip)
        raw = get(offsets[strip] + (r_in * width + col) * bps, bps)
        v = struct.unpack("<h" if signed else "<H", raw)[0] if bps == 2 else struct.unpack("<f", raw)[0]
        print(f"{lat} {lon} {v}")


if __name__ == "__main__":
    a = list(map(float, sys.argv[1:]))
    main(list(zip(a[::2], a[1::2])))
