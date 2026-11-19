#!/usr/bin/env python3
"""
build-data.py
-------------
Bündelt alle JSON-Dateien aus /data in data/data.js.

Warum? Öffnet man index.html direkt per Doppelklick (file://), verbieten
Browser das Laden von JSON-Dateien per fetch(). data/data.js wird dagegen
als normales <script> geladen und funktioniert immer.

Auf GitHub Pages (https://) lädt die App die JSON-Dateien direkt –
dort ist dieser Schritt nur für den Offline-Betrieb nötig.

Aufruf (im Projektordner):  python3 tools/build-data.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
FILES = ["theorie", "aufgaben", "klausuren", "formeln"]

bundle = {}
for name in FILES:
    with open(DATA / f"{name}.json", encoding="utf-8") as fh:
        bundle[name] = json.load(fh)

header = (
    "/* Automatisch erzeugt von tools/build-data.py – nicht von Hand bearbeiten.\n"
    "   Quelle: data/theorie.json, data/aufgaben.json, data/klausuren.json, data/formeln.json */\n"
)
out = header + "window.STAT_DATA = " + json.dumps(bundle, ensure_ascii=False, indent=1) + ";\n"
(DATA / "data.js").write_text(out, encoding="utf-8")
print(f"data/data.js geschrieben ({len(out) // 1024} KB)")
