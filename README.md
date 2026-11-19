# σ Statistik leicht – Lernplattform für die Statistik-Klausur

Eine komplette, kostenlose Lernplattform für **Statistik im Studium (Wirtschaftsinformatik / BWL)** –
gebaut für alle, die mit Mathe kämpfen und die Klausur trotzdem **bestehen** wollen.

> „Okay, wir schauen uns zuerst an, was überhaupt gefragt wird. Dann die Formel. Dann setzen wir ein. Fertig.“

Reines **HTML + CSS + Vanilla JavaScript**. Kein Framework, kein Backend, keine Datenbank, keine Build-Tools.
Läuft per **Doppelklick auf `index.html`** und ohne Änderung auf **GitHub Pages**.

---

## ✨ Funktionen

| Bereich | Was du bekommst |
|---|---|
| 🏠 **Dashboard** | Gesamtfortschritt, Level & XP, nächstes Kapitel, letzte Aufgabe, Stärken, Schwächen, **Bestehenswahrscheinlichkeit** und geschätzte Note |
| 📚 **16 Kapitel** | Grundbegriffe → Skalen → Häufigkeiten → Lagemaße → Streuung → Gini → Kontingenztafeln → Kombinatorik → Wahrscheinlichkeit → **Bayes** → Zufallsvariablen → Verteilungen → **Konfidenzintervalle** → **Hypothesentests** → **Regression** → **Indexrechnung** |
| 🎮 **16 interaktive Widgets** | Drag-and-Drop-Skalenspiel, Live-Häufigkeitstabelle, Mittelwert-vs-Median-Animation, Streuungs-Visualisierung, Lorenzkurve, Vierfeldertafel, Baumdiagramm, **Bayes mit 10.000 Personen**, Verteilungen mit 68-95-99,7-Animation, KI-Simulation, **Hypothesentest-Assistent**, Regression zum Anklicken, Index-Rechner |
| 🎯 **960 Aufgaben** | Pro Kapitel 30 leichte, 20 mittlere, 10 schwere – erzeugt aus 81 Vorlagen mit festen Zufallszahlen |
| 🆘 **Hilfe bei jeder Aufgabe** | 💡 Hinweis · 👣 Nächster Schritt · 🧸 Noch einfacher erklären · 👀 Lösung zeigen · 🎬 Videoartige Erklärung (mit Vorlesen) · 🤝 Gemeinsam lösen · 🎲 Neue Zahlen |
| 🤝 **Tutor-Modus** | Löst Aufgaben im Chat gemeinsam mit dir. Bei Fehlern: „Lass uns gemeinsam schauen.“ statt „Falsch.“ |
| 📝 **Klausurmodus** | Mini (15 min), Probe (30 min), **Komplett (90 min, 100 Punkte – Aufbau wie die echte Prüfung WS 22/23)**; Timer übersteht Neuladen |
| 🎓 **Auswertung** | Punkte, Prozent, Note (1,0–5,0), Fehleranalyse pro Thema, Schwachstellen, Schritt-für-Schritt-Lösungen |
| 🧮 **Statistik-Rechner** | Mittelwert, Median, Modus, Quartile, Spannweite, Varianz, Standardabweichung, Variationskoeffizient, Konfidenzintervalle, Normalverteilung, Regression – jeweils mit „Wie wurde gerechnet?“ |
| 📊 **Lernstatistiken** | Lernzeit pro Tag, Sitzungen, Erfolgsquote, Klausurtrend, Kapitel-Fortschritt, Badges, Levels |
| 💾 **Speichern** | Alles automatisch im `localStorage`; **Export/Import als JSON**; „Willkommen zurück“-Popup mit *Weiterlernen* |
| 🏅 **Gamification** | 8 Level (Statistik-Noob → Statistik-Gott), 10 Badges (Mittelwert Meister, Bayes Boss, Gini Gott …), XP, Konfetti |
| 🌙 **Dark Mode** | automatisch nach Systemeinstellung oder per Knopf |
| 📱 **Mobile First** | große Buttons (≥ 48 px), Tab-Leiste unten, alles in ≤ 3 Klicks erreichbar |

### Inhaltlich passend zur Vorlesung
- Varianz der Stichprobe mit **n − 1**, klassierte Verteilungen mit **n**
- Gini nach **G = 1 − Σ(kᵢ − kᵢ₋₁)(lᵢ + lᵢ₋₁)**, korrigiert mit **n/(n−1)**
- φ-Koeffizient für Vierfeldertafeln inkl. Stärke-Skala aus dem Skript
- Hypothesentests im **6-Schritte-Schema** der Vorlesung, z- und t-Test, Anteilstest
- Konfidenzintervalle mit σ bekannt (z) / unbekannt (t) und für Anteile
- Aufgaben im Stil der Übungsblätter 1–10 und der **Klausur WS 2022/23**
  (klassierte Daten, t-Test, Schätzen & Testen, Laspeyres/Paasche, Preis-Absatz-Funktion, Bayes)

---

## 🖼️ Screenshots

| Dashboard | Bayes-Widget | Aufgabe |
|---|---|---|
| ![Dashboard](assets/screenshots/dashboard.png) | ![Bayes](assets/screenshots/kapitel-bayes.png) | ![Aufgabe](assets/screenshots/aufgabe.png) |

| Klausur | Fortschritt |
|---|---|
| ![Klausur](assets/screenshots/klausur.png) | ![Fortschritt](assets/screenshots/fortschritt.png) |

*(Lege die Bilder mit diesen Dateinamen in `assets/screenshots/` ab.)*

---

## 🚀 Installation & Start

### Variante A – einfach öffnen
1. Ordner herunterladen bzw. entpacken.
2. **`index.html` doppelklicken.** Fertig.

Beim direkten Öffnen (`file://`) lädt die App ihre Inhalte aus `data/data.js`, weil Browser dort keine JSON-Dateien per `fetch()` erlauben.

### Variante B – lokaler Webserver (optional)
```bash
cd statistik-lernplattform
python3 -m http.server 8000
```
Dann `http://localhost:8000` öffnen. Hier werden die JSON-Dateien aus `data/` direkt geladen.

---

## 🌍 Deployment auf GitHub Pages

1. Neues Repository auf GitHub anlegen (z. B. `statistik-lernplattform`).
2. Den **Inhalt** dieses Ordners hochladen (so, dass `index.html` im Hauptverzeichnis liegt):
   ```bash
   git init
   git add .
   git commit -m "Statistik-Lernplattform"
   git branch -M main
   git remote add origin https://github.com/DEIN-NAME/statistik-lernplattform.git
   git push -u origin main
   ```
3. Auf GitHub: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“ → Branch `main`, Ordner `/ (root)` → Save.**
4. Nach ca. einer Minute ist die Seite unter `https://DEIN-NAME.github.io/statistik-lernplattform/` erreichbar.

Die Datei `.nojekyll` sorgt dafür, dass GitHub alle Dateien unverändert ausliefert. Alle Pfade sind relativ – es muss nichts angepasst werden.

### Upload nur über die GitHub-Webseite (ohne Ordner)

Beim Hochladen über „Add file → Upload files“ gehen Unterordner oft verloren. Dafür gibt es die **flache Version** im Ordner `github-upload/`: Alle Dateien liegen dort in einer Ebene, und die HTML-Seiten verweisen direkt darauf. Lade einfach **alle Dateien aus `github-upload/`** hoch (vorhandene überschreiben).

Nach Änderungen an Texten oder Code die flache Version neu erzeugen:
```bash
python3 tools/build-data.py
python3 tools/build-flat.py
```

---

## 🗂️ Projektstruktur

```
statistik-lernplattform/
├── index.html               Dashboard / Startseite
├── lernen.html              Kapitel, Theorie, Aufgaben, Tutor-Modus, Formelsammlung
├── quiz.html                Schnell-Quiz, Schwächen-Training, Fehler wiederholen
├── klausuren.html           Klausurmodus mit Timer und Auswertung
├── fortschritt.html         Lernstatistiken, Badges, Export/Import
├── statistik-rechner.html   Rechner mit Rechenweg
├── styles/
│   ├── main.css             Farben, Layout, Kopfzeile, Navigation (Mobile First)
│   ├── components.css       Buttons, Karten, Aufgaben, Widgets, Diagramme
│   └── darkmode.css         dunkles Farbschema
├── scripts/
│   ├── app.js               Seitengerüst, Daten laden, Dark Mode, Popups, Dashboard
│   ├── router.js            Hash-Router (#kapitel/4 …)
│   ├── storage.js           localStorage, XP, Level, Badges, Prognose, Export/Import
│   ├── statistik.js         Mathe-Bibliothek (alle Formeln, Verteilungen, Zahlenformat)
│   ├── generator.js         Aufgabengenerator (81 Vorlagen, Prüfung der Antworten)
│   ├── charts.js            SVG-Diagramme ohne Bibliothek
│   ├── quiz.js              Aufgaben-Player, Video-Erklärung, Tutor, Quiz-Seite
│   ├── lernen.js            Kapitelübersicht, Theorie, Aufgabenansicht
│   ├── widgets.js           16 interaktive Mini-Spiele/Visualisierungen
│   ├── klausuren.js         Klausurmodus und Notenberechnung
│   ├── fortschritt.js       Statistik-Seite
│   └── rechner.js           Statistik-Rechner
├── data/
│   ├── theorie.json         Lerninhalte aller 16 Kapitel
│   ├── aufgaben.json        Zuordnung Aufgabenvorlagen ↔ Kapitel/Schwierigkeit
│   ├── klausuren.json       Klausurmodi, Notenschlüssel
│   ├── formeln.json         Formelsammlung
│   └── data.js              Bündel aller JSON-Dateien (für file://)
├── assets/
│   ├── icons/favicon.svg
│   ├── images/              Logo, Grafiken
│   └── screenshots/         Platz für Screenshots
├── tools/build-data.py      erzeugt data/data.js aus den JSON-Dateien
├── .nojekyll
└── README.md
```

---

## 🛠️ Anpassen

### Texte & Theorie ändern
`data/theorie.json` bearbeiten. Jedes Kapitel besteht aus Abschnitten mit Blöcken:

| Typ | Beispiel |
|---|---|
| `p` | `{ "type": "p", "html": "Ein Absatz mit <strong>fett</strong>." }` |
| `steps` / `list` | `{ "type": "steps", "items": ["Schritt 1", "Schritt 2"] }` |
| `example` | `{ "type": "example", "title": "Beispiel", "html": "…" }` |
| `tip` / `warn` / `exam` | farbige Hinweisboxen |
| `formula` | `{ "type": "formula", "html": "x̄ = Σx / n", "legend": "Erklärung" }` |
| `widget` | `{ "type": "widget", "id": "bayes-10000" }` |
| `check` | Kurz-Check mit `q`, `options`, `correct`, `explain` |

**Wichtig:** Danach einmal `python3 tools/build-data.py` ausführen, damit die Änderung auch beim Öffnen per Doppelklick (`file://`) sichtbar ist. Auf GitHub Pages werden die JSON-Dateien direkt gelesen.

### Aufgaben
- Welche Vorlagen ein Kapitel nutzt und wie viele Aufgaben es pro Stufe gibt: `data/aufgaben.json`.
- Neue Vorlage: in `scripts/generator.js` ein Objekt `T['k4-meine-vorlage'] = { title, gen(r) { … } }` anlegen
  und die ID in `aufgaben.json` eintragen. `r` liefert Zufallszahlen (`r.int`, `r.pick`, `r.float` …).

### Klausuren
In `data/klausuren.json` lassen sich Dauer, Aufgabenpools, Bestehensgrenze und Notenschlüssel ändern.

### Farben
Alle Farben stehen als CSS-Variablen oben in `styles/main.css` (hell) und `styles/darkmode.css` (dunkel).
Primärfarbe `#2563eb`, Erfolg `#22c55e`, Warnung `#f59e0b`, Fehler `#ef4444`, Dunkel `#0f172a`, Hell `#e2e8f0`.

### Level & Badges
In `scripts/storage.js` (`LEVELS`, `BADGES`). Jedes Badge hat eine `check(state)`-Funktion.

---

## 🔒 Datenschutz

Alle Daten bleiben **auf deinem Gerät** (Browser-`localStorage`). Es gibt keinen Server, kein Tracking, keine Cookies.
Über **Fortschritt → Daten exportieren** sicherst du deinen Lernstand als JSON-Datei und kannst ihn auf einem anderen Gerät wieder importieren.

---

## 🧪 Technische Hinweise

- Entwickelt für aktuelle Browser (Chrome, Edge, Safari, Firefox) – es werden nur Standard-Web-APIs verwendet, keine externen Bibliotheken oder CDNs.
- Zahleneingabe: `12,5`, `12.5`, `1.234,5`, `25 %` oder `1/4` werden verstanden. Kleine Rundungsabweichungen werden toleriert.
- Wahrscheinlichkeiten dürfen als `0,25` oder `25 %` eingegeben werden.
- Die Klausurprognose gewichtet Kapitel nach ihrem Gewicht in der echten Klausur (Feld `examWeight` in `theorie.json`).

Viel Erfolg bei der Klausur – du schaffst das! 🍀
