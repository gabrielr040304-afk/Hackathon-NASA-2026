"""Baixa clima diário (MEDA/Jezero, REMS/Gale) e trajetos dos rovers para data/.
Uso: python tools/prep_data.py
"""
import json, urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
WEATHER = "https://mars.nasa.gov/rss/api/?feed=weather&category={}&feedtype=json&ver=1.0"
TRAVERSES = {
    "m20_traverse.json": "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json",
    "msl_traverse.json": "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json",
}
GALE_KEEP = 60  # ponytail: só os sóis mais recentes; o feed completo tem ~4.700


def get(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def clean(rows, extra=()):
    out = []
    for r in rows:
        mn, mx, p = num(r.get("min_temp")), num(r.get("max_temp")), num(r.get("pressure"))
        if None in (mn, mx, p) or not r.get("sunrise") or not r.get("sunset"):
            continue  # sóis sem medição ("--") ficam de fora
        row = {"sol": int(r["sol"]), "terrestrial_date": r["terrestrial_date"], "min_temp": mn, "max_temp": mx,
               "pressure": p, "sunrise": r["sunrise"][:5], "sunset": r["sunset"][:5]}
        for k in extra:
            row[k] = num(r.get(k)) if "temp" in k else r.get(k)
        out.append(row)
    return sorted(out, key=lambda r: r["sol"])


def main():
    (DATA / "weather").mkdir(parents=True, exist_ok=True)
    (DATA / "traverse").mkdir(parents=True, exist_ok=True)
    jez = clean(json.loads(get(WEATHER.format("mars2020")))["sols"])
    gale = clean(json.loads(get(WEATHER.format("msl")))["soles"],
                 extra=("min_gts_temp", "max_gts_temp", "atmo_opacity", "local_uv_irradiance_index"))[-GALE_KEEP:]
    assert jez and gale, "clima vazio"
    (DATA / "weather" / "jezero.json").write_text(json.dumps(jez, indent=1), encoding="utf-8")
    (DATA / "weather" / "gale.json").write_text(json.dumps(gale, indent=1), encoding="utf-8")
    print(f"clima: jezero {len(jez)} sóis válidos ({jez[0]['sol']}-{jez[-1]['sol']}), "
          f"gale {len(gale)} sóis ({gale[0]['sol']}-{gale[-1]['sol']})")
    for name, url in TRAVERSES.items():
        raw = get(url)
        json.loads(raw)  # falha alto se não for JSON válido
        (DATA / "traverse" / name).write_bytes(raw)
        print(f"trajeto {name}: {len(raw) // 1024} KB")


if __name__ == "__main__":
    main()
