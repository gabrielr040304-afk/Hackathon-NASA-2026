"""Salva uma cópia dos eventos recentes de clima espacial da NASA DONKI em data/spaceweather.json.
O site tenta a API ao vivo primeiro; esta cópia é o plano B.
Uso: python tools/prep_spaceweather.py [dias=30]
"""
import json, sys, urllib.request
from datetime import date, timedelta, datetime, timezone
from pathlib import Path

API = "https://api.nasa.gov/DONKI/{kind}?startDate={start}&endDate={end}&api_key=DEMO_KEY"
OUT = Path(__file__).resolve().parent.parent / "data" / "spaceweather.json"


def fetch(kind, start, end):
    try:
        with urllib.request.urlopen(API.format(kind=kind, start=start, end=end), timeout=60) as r:
            return json.load(r)
    except Exception as e:  # DONKI às vezes devolve 404 para um tipo; os outros continuam valendo
        print(f"aviso: {kind} indisponível ({e})")
        return []


def main(days):
    end = date.today()
    start = end - timedelta(days=days)
    events = []
    for c in fetch("CME", start, end):
        a = (c.get("cmeAnalyses") or [{}])[0] or {}
        events.append({"type": "CME", "time": c.get("startTime"), "speed_kms": a.get("speed"), "id": c.get("activityID")})
    for f in fetch("FLR", start, end):
        events.append({"type": "FLR", "time": f.get("peakTime") or f.get("beginTime"), "class": f.get("classType"), "id": f.get("flrID")})
    for s in fetch("SEP", start, end):
        events.append({"type": "SEP", "time": s.get("eventTime"), "id": s.get("sepID")})
    events.sort(key=lambda e: e["time"] or "", reverse=True)
    OUT.write_text(json.dumps({"fetched": datetime.now(timezone.utc).isoformat(timespec="minutes"),
                               "start": str(start), "end": str(end), "events": events}, indent=1), encoding="utf-8")
    print(f"OK {len(events)} eventos de {start} a {end}: "
          + ", ".join(f"{t}={sum(e['type'] == t for e in events)}" for t in ("CME", "FLR", "SEP")))


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 30)
