/* Automatisch erzeugt von tools/build-data.py – nicht von Hand bearbeiten.
   Quelle: data/theorie.json, data/aufgaben.json, data/klausuren.json, data/formeln.json */
window.STAT_DATA = {
 "theorie": {
  "info": "Lerninhalte aller Kapitel. Blocktypen: p, list, steps, example, tip, warn, exam, formula, widget, check.",
  "chapters": [
   {
    "id": 1,
    "title": "Grundbegriffe",
    "icon": "🧱",
    "short": "Merkmal, Ausprägung, Grundgesamtheit, Stichprobe",
    "minutes": 10,
    "examWeight": 1,
    "sections": [
     {
      "title": "Worum geht es in Statistik überhaupt?",
      "blocks": [
       {
        "type": "p",
        "html": "Okay, ganz entspannt: Statistik heißt einfach <strong>Daten sammeln, ordnen und daraus etwas lernen</strong>. Mehr nicht."
       },
       {
        "type": "p",
        "html": "Es gibt zwei große Bereiche:"
       },
       {
        "type": "list",
        "items": [
         "<strong>Deskriptive Statistik</strong> = beschreiben. „Wie alt sind die Leute im Kurs im Schnitt?“",
         "<strong>Induktive Statistik</strong> = schließen. „Wir haben 100 Leute gefragt – was gilt dann wohl für alle?“"
        ]
       }
      ]
     },
     {
      "title": "Die 5 wichtigsten Begriffe – mit einem Fragebogen erklärt",
      "blocks": [
       {
        "type": "p",
        "html": "Stell dir vor, deine Hochschule verteilt einen Fragebogen: <em>„Wie viel Geld hast du im Monat zur Verfügung?“</em>"
       },
       {
        "type": "steps",
        "items": [
         "<strong>Grundgesamtheit</strong> = alle, über die wir etwas wissen wollen → alle Studierenden der Hochschule.",
         "<strong>Stichprobe</strong> = der Teil, den wir wirklich befragen → z. B. 200 zufällig ausgewählte Studierende.",
         "<strong>Merkmalsträger</strong> (statistische Einheit) = das einzelne Objekt → eine Person.",
         "<strong>Merkmal</strong> = die Eigenschaft, die uns interessiert → „monatliches Budget“. Das ist quasi die <em>Frage</em>.",
         "<strong>Merkmalsausprägung</strong> = ein konkreter Wert → „850 €“. Das ist quasi die <em>Antwort</em>."
        ]
       },
       {
        "type": "tip",
        "html": "Eselsbrücke: <strong>Merkmal = Frage</strong>, <strong>Ausprägung = Antwort</strong>, <strong>Merkmalsträger = wer antwortet</strong>."
       },
       {
        "type": "widget",
        "id": "merkmal-explorer"
       },
       {
        "type": "check",
        "id": "k1c1",
        "q": "Ein Supermarkt misst bei 80 Kunden die Wartezeit. Was ist „4 Minuten“?",
        "options": [
         "Merkmal",
         "Merkmalsausprägung",
         "Merkmalsträger",
         "Grundgesamtheit"
        ],
        "correct": 1,
        "explain": "„4 Minuten“ ist ein konkreter Wert – also eine Ausprägung des Merkmals „Wartezeit“."
       }
      ]
     },
     {
      "title": "Vollerhebung oder Stichprobe?",
      "blocks": [
       {
        "type": "p",
        "html": "Werden <strong>alle</strong> untersucht, heißt das <strong>Vollerhebung</strong> (z. B. Volkszählung). Wird nur ein <strong>Teil</strong> untersucht, ist es eine <strong>Stichprobe</strong>."
       },
       {
        "type": "example",
        "title": "Suppen-Beispiel",
        "html": "Du willst wissen, ob die Suppe salzig genug ist. Du isst nicht den ganzen Topf – ein Löffel reicht, wenn du vorher gut umrührst. Der Löffel ist die Stichprobe, das Umrühren sorgt dafür, dass sie <em>zufällig</em> und damit aussagekräftig ist."
       },
       {
        "type": "p",
        "html": "Warum Stichproben? Sie sind <strong>billiger</strong>, <strong>schneller</strong> und manchmal die <strong>einzige Möglichkeit</strong> (ein Crashtest mit allen Autos wäre sinnlos)."
       },
       {
        "type": "p",
        "html": "Typische <strong>Erhebungsmethoden</strong>: Befragung (schriftlich, online, telefonisch), Beobachtung, Experiment, Auswertung vorhandener Daten (z. B. Telefonanlage, Kassensystem)."
       }
      ]
     },
     {
      "title": "Diskret oder stetig?",
      "blocks": [
       {
        "type": "p",
        "html": "Bei Zahlen-Merkmalen gibt es noch eine Unterscheidung:"
       },
       {
        "type": "list",
        "items": [
         "<strong>Diskret</strong> = man <em>zählt</em>: Anzahl Kinder (0, 1, 2 …). Zwischenwerte wie 1,5 Kinder gibt es nicht.",
         "<strong>Stetig</strong> = man <em>misst</em>: Körpergröße, Zeit, Gewicht. Jeder Zwischenwert ist möglich."
        ]
       },
       {
        "type": "check",
        "id": "k1c2",
        "q": "Die Dauer eines Telefonats ist …",
        "options": [
         "diskret",
         "stetig"
        ],
        "correct": 1,
        "explain": "Zeit wird gemessen und kann beliebig fein sein (3,27 Minuten …) → stetig."
       }
      ]
     }
    ]
   },
   {
    "id": 2,
    "title": "Skalenniveaus",
    "icon": "📏",
    "short": "Nominal, ordinal, metrisch",
    "minutes": 10,
    "examWeight": 2,
    "sections": [
     {
      "title": "Warum ist das wichtig?",
      "blocks": [
       {
        "type": "p",
        "html": "Das Skalenniveau entscheidet, <strong>was du rechnen darfst</strong>. Den Durchschnitt von Haarfarben gibt es nun mal nicht. 😄"
       },
       {
        "type": "p",
        "html": "Es gibt drei Stufen – jede kann alles, was die vorherige kann, und noch etwas mehr:"
       }
      ]
     },
     {
      "title": "Die drei Stufen",
      "blocks": [
       {
        "type": "steps",
        "items": [
         "<strong>Nominal</strong> – nur Namen/Kategorien. Man kann nur sagen: <em>gleich oder verschieden</em>. Beispiele: Haarfarbe, Beruf, Geschlecht, Blutgruppe, Postleitzahl.",
         "<strong>Ordinal</strong> – Kategorien mit <em>Reihenfolge</em>, aber die Abstände sind nicht gleich. Beispiele: Schulnoten, Zufriedenheit (sehr gut … schlecht), Kleidergröße S/M/L, soziale Stellung.",
         "<strong>Metrisch</strong> (kardinal) – echte Zahlen mit gleichen Abständen. Man kann sinnvoll addieren und Differenzen bilden. Beispiele: Einkommen, Körperlänge, Alter, Anzahl Kontobewegungen."
        ]
       },
       {
        "type": "tip",
        "html": "Test-Frage 1: <em>Kann ich sortieren?</em> Nein → nominal. Test-Frage 2: <em>Sind Abstände sinnvoll?</em> Nein → ordinal, ja → metrisch."
       },
       {
        "type": "warn",
        "html": "Postleitzahlen sind Zahlen, aber <strong>nominal</strong>! 44139 ist nicht „mehr“ als 33100."
       }
      ]
     },
     {
      "title": "Spiel: Ordne die Merkmale zu",
      "blocks": [
       {
        "type": "p",
        "html": "Zieh jedes Merkmal in die richtige Box. Auf dem Handy: erst Merkmal antippen, dann die Box."
       },
       {
        "type": "widget",
        "id": "skalen-dnd"
       }
      ]
     },
     {
      "title": "Was darf ich berechnen?",
      "blocks": [
       {
        "type": "formula",
        "html": "nominal → Modus  ·  ordinal → Median, Quartile  ·  metrisch → Mittelwert, Standardabweichung",
        "legend": "Höhere Skalen dürfen auch alles von den niedrigeren."
       },
       {
        "type": "p",
        "html": "Für Zusammenhänge zwischen zwei Merkmalen gilt: Das <strong>schwächere</strong> Niveau entscheidet. Nominal → Kontingenz (φ), ordinal → Spearman, beide metrisch → Bravais-Pearson."
       },
       {
        "type": "check",
        "id": "k2c1",
        "q": "Welches Lagemaß ist für „Kleidergröße (S/M/L/XL)“ am besten?",
        "options": [
         "Arithmetisches Mittel",
         "Median",
         "Variationskoeffizient"
        ],
        "correct": 1,
        "explain": "Kleidergröße ist ordinal → man kann sortieren, also ist der Median erlaubt. Einen Durchschnitt gibt es nicht."
       }
      ]
     }
    ]
   },
   {
    "id": 3,
    "title": "Häufigkeiten",
    "icon": "📊",
    "short": "Absolute, relative und kumulierte Häufigkeiten",
    "minutes": 15,
    "examWeight": 6,
    "sections": [
     {
      "title": "Zählen ist der erste Schritt",
      "blocks": [
       {
        "type": "p",
        "html": "Okay, wir schauen uns zuerst an, was gefragt wird: <em>Wie oft kommt etwas vor?</em> Dafür gibt es drei Arten von Häufigkeiten:"
       },
       {
        "type": "steps",
        "items": [
         "<strong>Absolute Häufigkeit h(x)</strong> = einfach zählen. „5 Leute haben 2 Kinder.“",
         "<strong>Relative Häufigkeit f(x)</strong> = Anteil. f(x) = h(x) / n. „5 von 20 = 0,25 = 25 %.“",
         "<strong>Kumulierte Häufigkeit F(x)</strong> = alles bis einschließlich x aufaddieren. „Wie viele haben <em>höchstens</em> 2 Kinder?“"
        ]
       },
       {
        "type": "formula",
        "html": "f(x) = h(x) / n          F(x) = f(x₁) + f(x₂) + … + f(x)",
        "legend": "n = Anzahl aller Beobachtungen"
       }
      ]
     },
     {
      "title": "Probier es aus: Deine eigene Häufigkeitstabelle",
      "blocks": [
       {
        "type": "p",
        "html": "Gib Zahlen ein (z. B. das Alter von Kursteilnehmern) – die Tabelle und das Diagramm entstehen sofort."
       },
       {
        "type": "widget",
        "id": "haeufigkeit-tabelle"
       },
       {
        "type": "tip",
        "html": "„Höchstens 25“ → F(25) ablesen. „Mindestens 25“ → 1 − F(24). „Mehr als 25“ → 1 − F(25)."
       }
      ]
     },
     {
      "title": "Klassierte Daten – der Klausur-Klassiker",
      "blocks": [
       {
        "type": "p",
        "html": "Oft gibt es nicht jeden Einzelwert, sondern nur <strong>Klassen</strong>: „10.000 bis 24.000 km: 370 Personen“. Dann tun wir so, als wären die Personen innerhalb einer Klasse <strong>gleichmäßig verteilt</strong>."
       },
       {
        "type": "example",
        "title": "Beispiel aus der Klausur",
        "html": "Klasse „über 10.000 bis 24.000 km“ hat 370 Personen. Davor liegen 350 Personen. Wie viele fahren bis 15.000 km?<br>15.000 liegt 5.000 km weit in einer 14.000 km breiten Klasse → 5/14 der Klasse.<br>350 + 5/14 · 370 = 350 + 132,1 = <strong>482,1 Personen</strong>."
       },
       {
        "type": "formula",
        "html": "Anteil bis x = (Personen davor + (x − Untergrenze)/Klassenbreite · nⱼ) / n",
        "legend": "Für „zwischen a und b“: Anteil bis b minus Anteil bis a"
       },
       {
        "type": "exam",
        "html": "In der Klausur WS 22/23 gab es dafür <strong>7 Punkte</strong>: „Wie viel Prozent fahren zwischen 15.000 und 44.000 km?“"
       },
       {
        "type": "check",
        "id": "k3c1",
        "q": "Von 20 Personen haben 6 genau einen Hund. Wie groß ist die relative Häufigkeit?",
        "options": [
         "6",
         "0,3",
         "0,6",
         "3,3"
        ],
        "correct": 1,
        "explain": "f = 6/20 = 0,3 = 30 %."
       }
      ]
     }
    ]
   },
   {
    "id": 4,
    "title": "Lagemaße",
    "icon": "🎯",
    "short": "Mittelwert, Median, Modus, Quartile",
    "minutes": 20,
    "examWeight": 6,
    "sections": [
     {
      "title": "Wo liegt die „Mitte“ der Daten?",
      "blocks": [
       {
        "type": "p",
        "html": "Lagemaße beantworten eine Frage: <strong>Was ist ein typischer Wert?</strong> Es gibt drei wichtige:"
       },
       {
        "type": "steps",
        "items": [
         "<strong>Arithmetisches Mittel x̄</strong> – „gerecht verteilen“: alles zusammenzählen, durch die Anzahl teilen.",
         "<strong>Median</strong> – „die Person in der Mitte“: sortieren und den mittleren Wert nehmen.",
         "<strong>Modus</strong> – „der Lieblingswert“: der Wert, der am häufigsten vorkommt."
        ]
       },
       {
        "type": "formula",
        "html": "x̄ = (x₁ + x₂ + … + xₙ) / n",
        "legend": "Beispiel: 2, 4, 9 → x̄ = 15 / 3 = 5"
       }
      ]
     },
     {
      "title": "Animation: Mittelwert vs. Median",
      "blocks": [
       {
        "type": "p",
        "html": "Zieh den Regler und mach einen Wert zum <strong>Ausreißer</strong>. Schau, was passiert: Der Mittelwert rennt hinterher, der Median bleibt fast stehen."
       },
       {
        "type": "widget",
        "id": "lagemass-animation"
       },
       {
        "type": "tip",
        "html": "Darum nimmt man bei Einkommen oft den Median: Ein Millionär im Raum verzerrt den Durchschnitt, den Median kaum."
       }
      ]
     },
     {
      "title": "Den Median richtig bestimmen",
      "blocks": [
       {
        "type": "steps",
        "items": [
         "Daten <strong>sortieren</strong> (das vergessen viele!).",
         "n ungerade → der Wert in der Mitte, Position (n + 1)/2.",
         "n gerade → Durchschnitt der beiden mittleren Werte."
        ]
       },
       {
        "type": "example",
        "title": "Beispiel",
        "html": "3, 8, 1, 6 → sortiert: 1, 3, 6, 8 → Median = (3 + 6)/2 = <strong>4,5</strong>"
       }
      ]
     },
     {
      "title": "Quartile – die Daten in vier Stücke schneiden",
      "blocks": [
       {
        "type": "p",
        "html": "Das <strong>1. Quartil Q₀,₂₅</strong> ist der Wert, unter dem ein Viertel der Daten liegt. Das <strong>3. Quartil Q₀,₇₅</strong>: drei Viertel liegen darunter. Der Median ist Q₀,₅."
       },
       {
        "type": "formula",
        "html": "Position = n · p.  Ganzzahlig → Mittel aus dieser und der nächsten Position.  Sonst → aufrunden.",
        "legend": "Quartilsabstand IQR = Q₀,₇₅ − Q₀,₂₅ (die mittleren 50 %)"
       }
      ]
     },
     {
      "title": "Klassierte Daten: Mittelwert & „überschritten von …“",
      "blocks": [
       {
        "type": "p",
        "html": "Bei Klassen nimmt man die <strong>Klassenmitte mⱼ</strong> als Stellvertreter für alle Werte der Klasse."
       },
       {
        "type": "formula",
        "html": "x̄ = Σ mⱼ · nⱼ / n",
        "legend": "mⱼ = (Untergrenze + Obergrenze)/2"
       },
       {
        "type": "p",
        "html": "„Welcher Wert wird von 33 % überschritten?“ heißt: 67 % liegen darunter. Gesucht ist das 0,67-Quantil:"
       },
       {
        "type": "formula",
        "html": "x = Untergrenze + (p · n − kumuliert davor) / nⱼ · Klassenbreite"
       },
       {
        "type": "exam",
        "html": "Genau diese Aufgabe gab es in der Klausur für <strong>6 Punkte</strong>. Der häufigste Fehler: 33 % statt 67 % nehmen!"
       },
       {
        "type": "check",
        "id": "k4c1",
        "q": "Was ist der Median von 7, 2, 9, 4, 5?",
        "options": [
         "4",
         "5",
         "5,4",
         "9"
        ],
        "correct": 1,
        "explain": "Sortiert: 2, 4, 5, 7, 9 → der mittlere Wert ist 5."
       }
      ]
     },
     {
      "title": "Spezielle Mittelwerte",
      "blocks": [
       {
        "type": "list",
        "items": [
         "<strong>Geometrisches Mittel</strong> → für Wachstumsraten (Zinsen, Umsatzwachstum).",
         "<strong>Harmonisches Mittel</strong> → für Durchschnittspreise bei gleichem Budget (Mandel-Aufgabe!) oder Geschwindigkeiten."
        ]
       },
       {
        "type": "example",
        "title": "Mandel-Aufgabe",
        "html": "Je 6 € bei Preisen 1 €, 2 €, 1,5 €, 1,5 € → Tüten: 6 + 3 + 4 + 4 = 17 Tüten für 24 € → Durchschnittspreis 24/17 = <strong>1,41 €</strong> (nicht 1,50 €!)."
       }
      ]
     }
    ]
   },
   {
    "id": 5,
    "title": "Streuungsmaße",
    "icon": "↔️",
    "short": "Spannweite, Varianz, Standardabweichung, Variationskoeffizient",
    "minutes": 20,
    "examWeight": 10,
    "sections": [
     {
      "title": "Warum reicht der Mittelwert nicht?",
      "blocks": [
       {
        "type": "p",
        "html": "Zwei Klassen haben beide den Notenschnitt 3,0. In Klasse A haben alle eine 3. In Klasse B die Hälfte eine 1, die andere Hälfte eine 5. Gleicher Mittelwert – völlig andere Situation! Streuungsmaße messen genau diesen Unterschied."
       }
      ]
     },
     {
      "title": "Visualisierung: Was bedeutet Streuung?",
      "blocks": [
       {
        "type": "p",
        "html": "Verändere die Streuung mit dem Regler. Die grünen Linien sind die Abweichungen vom Mittelwert, das blaue Band ist ±1 Standardabweichung."
       },
       {
        "type": "widget",
        "id": "streuung-vis"
       }
      ]
     },
     {
      "title": "Die Maße – Schritt für Schritt",
      "blocks": [
       {
        "type": "steps",
        "items": [
         "<strong>Spannweite</strong> R = größter − kleinster Wert. Schnell, aber nur zwei Werte zählen.",
         "<strong>Varianz s²</strong> = durchschnittliche quadrierte Abweichung vom Mittelwert.",
         "<strong>Standardabweichung s</strong> = Wurzel aus der Varianz. Hat wieder die normale Einheit (€, km, …).",
         "<strong>Variationskoeffizient V</strong> = s / x̄. Streuung im Verhältnis zum Mittelwert – damit kann man ganz verschiedene Daten vergleichen."
        ]
       },
       {
        "type": "formula",
        "html": "s² = Σ(xᵢ − x̄)² / (n − 1)        s = √s²        V = s / x̄",
        "legend": "Stichprobe: durch n − 1. Grundgesamtheit und klassierte Verteilungen: durch n."
       },
       {
        "type": "example",
        "title": "Rechenweg für 2, 4, 6",
        "html": "Okay, erst der Mittelwert: x̄ = 12/3 = 4.<br>Dann die Abweichungen: −2, 0, 2. Quadriert: 4, 0, 4. Summe: 8.<br>Varianz: 8/(3 − 1) = 4. Standardabweichung: √4 = <strong>2</strong>. Fertig."
       },
       {
        "type": "tip",
        "html": "Warum quadrieren? Weil sich +2 und −2 sonst zu 0 aufheben würden – und das wäre gelogen, denn beide Werte weichen ab."
       }
      ]
     },
     {
      "title": "Klassierte Daten (Klausur!)",
      "blocks": [
       {
        "type": "formula",
        "html": "s² = Σ nⱼ · (mⱼ − x̄)² / n",
        "legend": "mⱼ = Klassenmitte, nⱼ = Anzahl in der Klasse"
       },
       {
        "type": "exam",
        "html": "Klausur WS 22/23: Mittelwert (2 P.), Standardabweichung (4 P.), Variationskoeffizient (1 P.) – das sind 7 Punkte, die du mit einer sauberen Tabelle sicher holst."
       },
       {
        "type": "check",
        "id": "k5c1",
        "q": "Mittelwert 50, Standardabweichung 10. Wie groß ist der Variationskoeffizient?",
        "options": [
         "5",
         "0,2",
         "500",
         "40"
        ],
        "correct": 1,
        "explain": "V = 10 / 50 = 0,2 = 20 %."
       }
      ]
     }
    ]
   },
   {
    "id": 6,
    "title": "Konzentrationsmaße",
    "icon": "🥧",
    "short": "Lorenzkurve und Gini-Koeffizient",
    "minutes": 15,
    "examWeight": 3,
    "sections": [
     {
      "title": "Wer hat wie viel vom Kuchen?",
      "blocks": [
       {
        "type": "p",
        "html": "Konzentration fragt: <strong>Ist etwas gleichmäßig verteilt – oder haben wenige fast alles?</strong> Zum Beispiel Umsatz auf Filialen oder Vermögen in der Bevölkerung."
       }
      ]
     },
     {
      "title": "Die Lorenzkurve – Schritt für Schritt",
      "blocks": [
       {
        "type": "steps",
        "items": [
         "Werte der Größe nach <strong>aufsteigend</strong> sortieren.",
         "Für jeden Schritt den kumulierten Anteil der Merkmalsträger kᵢ berechnen (1/5, 2/5, …).",
         "Den kumulierten Anteil an der Gesamtsumme lᵢ berechnen.",
         "Punkte (kᵢ | lᵢ) einzeichnen und verbinden – Start bei (0|0), Ende bei (1|1)."
        ]
       },
       {
        "type": "p",
        "html": "Liegt die Kurve auf der Diagonalen, haben alle gleich viel. Je stärker sie „durchhängt“, desto ungleicher."
       },
       {
        "type": "widget",
        "id": "lorenz"
       }
      ]
     },
     {
      "title": "Der Gini-Koeffizient",
      "blocks": [
       {
        "type": "p",
        "html": "Der Gini misst die Fläche zwischen Diagonale und Lorenzkurve (verdoppelt). <strong>0 = völlig gleich</strong>, nahe <strong>1 = einer hat alles</strong>."
       },
       {
        "type": "formula",
        "html": "G = 1 − Σ (kᵢ − kᵢ₋₁) · (lᵢ + lᵢ₋₁)        G* = n/(n − 1) · G",
        "legend": "G* ist der korrigierte Gini für n Einzelwerte"
       },
       {
        "type": "example",
        "title": "Übungsblatt 2.5: Umsätze 100, 400, 700, 500, 200",
        "html": "Sortiert: 100, 200, 400, 500, 700 (Summe 1.900).<br>lᵢ: 0,0526 · 0,1579 · 0,3684 · 0,6316 · 1<br>Σ 0,2 · (lᵢ + lᵢ₋₁) = 0,6842<br>G = 1 − 0,6842 = <strong>0,3158</strong>, korrigiert G* = 5/4 · 0,3158 = <strong>0,3947</strong>"
       },
       {
        "type": "check",
        "id": "k6c1",
        "q": "Alle 4 Filialen machen genau gleich viel Umsatz. Wie groß ist der Gini?",
        "options": [
         "0",
         "0,25",
         "1",
         "4"
        ],
        "correct": 0,
        "explain": "Gleichverteilung → Lorenzkurve = Diagonale → G = 0."
       }
      ]
     }
    ]
   },
   {
    "id": 7,
    "title": "Kontingenztafeln",
    "icon": "🔲",
    "short": "Vierfeldertafeln und Zusammenhangsmaße",
    "minutes": 15,
    "examWeight": 3,
    "sections": [
     {
      "title": "Zwei Merkmale gleichzeitig",
      "blocks": [
       {
        "type": "p",
        "html": "Eine Kontingenztafel (Kreuztabelle) zählt, wie oft Kombinationen vorkommen: z. B. <em>Whisky schmeckt / schmeckt nicht</em> × <em>Cognac schmeckt / schmeckt nicht</em>."
       },
       {
        "type": "p",
        "html": "Bei 2 × 2 Feldern heißt sie <strong>Vierfeldertafel</strong>. Am Rand stehen die Zeilen- und Spaltensummen."
       }
      ]
     },
     {
      "title": "Interaktiv: Vierfeldertafel & φ",
      "blocks": [
       {
        "type": "widget",
        "id": "vierfelder"
       },
       {
        "type": "tip",
        "html": "Prozentuieren ist der schnellste Blick auf einen Zusammenhang: Sind die Anteile in den Zeilen sehr unterschiedlich, gibt es einen Zusammenhang."
       }
      ]
     },
     {
      "title": "Der Zusammenhangskoeffizient φ",
      "blocks": [
       {
        "type": "formula",
        "html": "φ = (n₁₁ · n₂₂ − n₁₂ · n₂₁) / √(n₁. · n₂. · n.₁ · n.₂)",
        "legend": "Im Skript steht der Zähler mit umgekehrtem Vorzeichen – für die Stärke zählt nur |φ|."
       },
       {
        "type": "list",
        "items": [
         "0 bis 0,2: vernachlässigbar",
         "0,2 bis 0,4: schwach",
         "0,4 bis 0,6: mittel",
         "0,6 bis 0,8: stark",
         "0,8 bis 1: sehr stark"
        ]
       },
       {
        "type": "example",
        "title": "Whisky & Cognac (Übungsblatt 3.1)",
        "html": "200 · 90 − 50 · 30 = 16.500<br>√(250 · 120 · 230 · 140) = 31.081<br>φ = 16.500 / 31.081 = <strong>0,53</strong> → mittlerer Zusammenhang. Wem Whisky schmeckt, dem schmeckt eher auch Cognac."
       },
       {
        "type": "check",
        "id": "k7c1",
        "q": "|φ| = 0,15 bedeutet …",
        "options": [
         "sehr starker Zusammenhang",
         "mittlerer Zusammenhang",
         "vernachlässigbarer Zusammenhang"
        ],
        "correct": 2,
        "explain": "Unter 0,2 ist der Zusammenhang vernachlässigbar."
       }
      ]
     }
    ]
   },
   {
    "id": 8,
    "title": "Kombinatorik",
    "icon": "🧩",
    "short": "Fakultät, Permutation, Kombination",
    "minutes": 15,
    "examWeight": 2,
    "sections": [
     {
      "title": "Zwei Fragen lösen fast alles",
      "blocks": [
       {
        "type": "p",
        "html": "Bei jeder Kombinatorik-Aufgabe stellst du dir nur zwei Fragen:"
       },
       {
        "type": "steps",
        "items": [
         "<strong>Ist die Reihenfolge wichtig?</strong> (Gold/Silber/Bronze: ja. Ein Team: nein.)",
         "<strong>Darf etwas mehrfach vorkommen?</strong> (PIN-Code: ja. Lotto: nein.)"
        ]
       }
      ]
     },
     {
      "title": "Die Werkzeuge",
      "blocks": [
       {
        "type": "formula",
        "html": "Alle n anordnen:  n! = n · (n − 1) · … · 1",
        "legend": "5 Bücher ins Regal: 5! = 120"
       },
       {
        "type": "formula",
        "html": "k aus n, mit Reihenfolge:  n! / (n − k)!",
        "legend": "Podest bei 10 Läufern: 10 · 9 · 8 = 720"
       },
       {
        "type": "formula",
        "html": "k aus n, ohne Reihenfolge:  (n über k) = n! / (k! · (n − k)!)",
        "legend": "Team aus 3 von 10: 120"
       },
       {
        "type": "formula",
        "html": "mit Wiederholung, mit Reihenfolge:  nᵏ",
        "legend": "4-stellige PIN: 10⁴ = 10.000"
       },
       {
        "type": "widget",
        "id": "kombinatorik"
       }
      ]
     },
     {
      "title": "Typische Übungsaufgaben",
      "blocks": [
       {
        "type": "example",
        "title": "Händeschütteln",
        "html": "20 Personen, jeder gibt jedem die Hand: (20 über 2) = 20 · 19 / 2 = <strong>190</strong> Händedrücke."
       },
       {
        "type": "example",
        "title": "Liga mit 15 Mannschaften",
        "html": "Hin- und Rückrunde: 15 · 14 = <strong>210</strong> Spiele. Mögliche Tabellen: 15!. Wenn Platz 1 und 15 feststehen: 13!."
       },
       {
        "type": "check",
        "id": "k8c1",
        "q": "Aus 6 Kollegen werden 2 für eine Dienstreise ausgewählt. Wie viele Möglichkeiten?",
        "options": [
         "12",
         "15",
         "30",
         "36"
        ],
        "correct": 1,
        "explain": "Reihenfolge egal → (6 über 2) = 6 · 5 / 2 = 15."
       }
      ]
     }
    ]
   },
   {
    "id": 9,
    "title": "Wahrscheinlichkeiten",
    "icon": "🎲",
    "short": "Laplace, Baumdiagramme, Regeln",
    "minutes": 20,
    "examWeight": 3,
    "sections": [
     {
      "title": "Laplace – die einfachste Formel der Welt",
      "blocks": [
       {
        "type": "p",
        "html": "Wenn alle Ergebnisse gleich wahrscheinlich sind (fairer Würfel, faire Münze):"
       },
       {
        "type": "formula",
        "html": "P(A) = Anzahl günstige Ergebnisse / Anzahl mögliche Ergebnisse",
        "legend": "Würfel, gerade Zahl: 3/6 = 0,5"
       },
       {
        "type": "p",
        "html": "Wahrscheinlichkeiten liegen immer zwischen <strong>0</strong> (unmöglich) und <strong>1</strong> (sicher)."
       }
      ]
     },
     {
      "title": "Baumdiagramme",
      "blocks": [
       {
        "type": "p",
        "html": "Bei mehrstufigen Experimenten malst du einen Baum. Zwei Regeln reichen:"
       },
       {
        "type": "steps",
        "items": [
         "<strong>Pfadregel:</strong> Entlang eines Pfades wird <em>multipliziert</em>.",
         "<strong>Summenregel:</strong> Mehrere Pfade, die zum Ziel führen, werden <em>addiert</em>."
        ]
       },
       {
        "type": "widget",
        "id": "baum"
       },
       {
        "type": "warn",
        "html": "Ohne Zurücklegen ändern sich die Wahrscheinlichkeiten beim zweiten Zug – eine Kugel ist ja schon weg!"
       }
      ]
     },
     {
      "title": "Wichtige Regeln",
      "blocks": [
       {
        "type": "formula",
        "html": "P(nicht A) = 1 − P(A)",
        "legend": "„Mindestens einmal“ → immer über das Gegenereignis „keinmal“!"
       },
       {
        "type": "formula",
        "html": "P(A ∪ B) = P(A) + P(B) − P(A ∩ B)",
        "legend": "Additionssatz: Die Überschneidung nicht doppelt zählen"
       },
       {
        "type": "formula",
        "html": "Unabhängig ⇔ P(A ∩ B) = P(A) · P(B)"
       },
       {
        "type": "example",
        "title": "Übungsblatt 4.7",
        "html": "P(Statistik) = 0,7, P(Mathe) = 0,8, beide 0,6.<br>0,7 · 0,8 = 0,56 ≠ 0,6 → <strong>abhängig</strong>.<br>Wenigstens eine: 0,7 + 0,8 − 0,6 = <strong>0,9</strong>."
       },
       {
        "type": "check",
        "id": "k9c1",
        "q": "Wie groß ist die Wahrscheinlichkeit, bei 2 Würfen mindestens eine 6 zu werfen?",
        "options": [
         "1/3",
         "11/36",
         "1/6",
         "25/36"
        ],
        "correct": 1,
        "explain": "1 − (5/6)² = 1 − 25/36 = 11/36 ≈ 0,306."
       }
      ]
     }
    ]
   },
   {
    "id": 10,
    "title": "Bedingte Wahrscheinlichkeit & Bayes",
    "icon": "🕵️",
    "short": "Bayes mit 10.000 Personen – ganz ohne Panik",
    "minutes": 25,
    "examWeight": 10,
    "sections": [
     {
      "title": "Wir starten NICHT mit einer Formel",
      "blocks": [
       {
        "type": "p",
        "html": "Bayes klingt kompliziert, ist aber eigentlich nur <strong>geschicktes Zählen</strong>. Wir denken uns einfach echte Menschen."
       },
       {
        "type": "example",
        "title": "Die Situation",
        "html": "Eine Krankheit hat <strong>1 %</strong> der Menschen. Ein Test erkennt Kranke zu <strong>90 %</strong>. Bei Gesunden schlägt er leider in <strong>5 %</strong> der Fälle fälschlich an.<br><br><strong>Frage:</strong> Du wirst positiv getestet. Wie wahrscheinlich bist du wirklich krank?"
       },
       {
        "type": "p",
        "html": "Die meisten Menschen raten: „90 %!“ Lass uns gemeinsam schauen, ob das stimmt."
       }
      ]
     },
     {
      "title": "Schritt für Schritt mit 10.000 Personen",
      "blocks": [
       {
        "type": "steps",
        "items": [
         "Wir nehmen <strong>10.000 Personen</strong>.",
         "1 % davon sind krank → <strong>100 Kranke</strong>, <strong>9.900 Gesunde</strong>.",
         "Von den 100 Kranken testet der Test 90 % positiv → <strong>90 richtig Positive</strong>.",
         "Von den 9.900 Gesunden testet er 5 % fälschlich positiv → <strong>495 falsch Positive</strong>!",
         "Positiv sind also insgesamt 90 + 495 = <strong>585 Personen</strong>.",
         "Davon wirklich krank: 90. Also 90 / 585 = <strong>15,4 %</strong>."
        ]
       },
       {
        "type": "p",
        "html": "Überraschung: Nur 15 %! Der Grund: Es gibt so viele Gesunde, dass selbst wenige Fehlalarme die echten Treffer überwiegen."
       },
       {
        "type": "widget",
        "id": "bayes-10000"
       }
      ]
     },
     {
      "title": "Jetzt erst die Formel",
      "blocks": [
       {
        "type": "p",
        "html": "Die Formel macht <em>genau dasselbe</em> wie unsere Zählung – nur mit Wahrscheinlichkeiten statt Personen:"
       },
       {
        "type": "formula",
        "html": "P(krank | positiv) = P(positiv | krank) · P(krank) / P(positiv)",
        "legend": "„|“ liest man „unter der Bedingung“"
       },
       {
        "type": "formula",
        "html": "P(positiv) = P(pos | krank) · P(krank) + P(pos | gesund) · P(gesund)",
        "legend": "Totale Wahrscheinlichkeit = alle Wege zu „positiv“ addieren"
       },
       {
        "type": "example",
        "title": "Mit Zahlen",
        "html": "P(pos) = 0,9 · 0,01 + 0,05 · 0,99 = 0,009 + 0,0495 = 0,0585<br>P(krank | pos) = 0,009 / 0,0585 = <strong>0,154</strong> ✔ – wie oben gezählt!"
       }
      ]
     },
     {
      "title": "Die Klausuraufgabe (10 Punkte)",
      "blocks": [
       {
        "type": "example",
        "title": "Klausur WS 22/23",
        "html": "P(krank) = 0,0005, Test schlägt bei Kranken mit 0,91 an, bei Gesunden in 2 % der Fälle.<br><br>Denk dir 1.000.000 Personen: 500 krank → 455 positiv. 999.500 gesund → 19.990 positiv.<br>P(krank | positiv) = 455 / (455 + 19.990) = <strong>0,0223 ≈ 2,2 %</strong>."
       },
       {
        "type": "tip",
        "html": "Rezept: 1) Große Zahl Personen wählen. 2) Kranke/Gesunde ausrechnen. 3) Positive in beiden Gruppen. 4) Kranke Positive / alle Positiven."
       },
       {
        "type": "check",
        "id": "k10c1",
        "q": "Unter 1.000 Positiven sind 50 wirklich krank. Wie groß ist P(krank | positiv)?",
        "options": [
         "50 %",
         "5 %",
         "0,5 %",
         "95 %"
        ],
        "correct": 1,
        "explain": "50 / 1.000 = 0,05 = 5 %."
       }
      ]
     },
     {
      "title": "Noch mehr Beispiele",
      "blocks": [
       {
        "type": "example",
        "title": "Zeitungsleser (Übungsblatt 5.2)",
        "html": "60 % Männer, davon lesen 30 % Zeitung. 40 % Frauen, davon lesen 40 %.<br>Von 1.000 Personen: 600 Männer → 180 Leser. 400 Frauen → 160 Leser.<br>P(liest) = 340/1.000 = <strong>0,34</strong>. P(Mann | liest) = 180/340 = <strong>0,529</strong>."
       },
       {
        "type": "example",
        "title": "Maschinen",
        "html": "Maschine A macht 60 % der Teile (2 % defekt), B 40 % (5 % defekt).<br>Von 10.000 Teilen: A 6.000 → 120 defekt. B 4.000 → 200 defekt.<br>Ein defektes Teil stammt von B mit 200/320 = <strong>62,5 %</strong>."
       },
       {
        "type": "example",
        "title": "Spam-Filter",
        "html": "30 % aller Mails sind Spam. „Gewinn“ steht in 40 % der Spam-Mails und 2 % der normalen Mails.<br>Von 1.000 Mails: 300 Spam → 120 mit „Gewinn“. 700 normal → 14 mit „Gewinn“.<br>P(Spam | „Gewinn“) = 120/134 = <strong>89,6 %</strong>."
       },
       {
        "type": "example",
        "title": "Alarmanlage",
        "html": "Einbruch in 0,1 % der Nächte. Anlage meldet Einbrüche zu 99 %, Fehlalarm in 1 % der normalen Nächte.<br>Von 100.000 Nächten: 100 Einbrüche → 99 Alarme. 99.900 normale → 999 Fehlalarme.<br>P(Einbruch | Alarm) = 99/1.098 = <strong>9 %</strong>."
       }
      ]
     }
    ]
   },
   {
    "id": 11,
    "title": "Zufallsvariablen",
    "icon": "🎰",
    "short": "Erwartungswert, Varianz, Standardabweichung",
    "minutes": 15,
    "examWeight": 2,
    "sections": [
     {
      "title": "Was ist eine Zufallsvariable?",
      "blocks": [
       {
        "type": "p",
        "html": "Eine Zufallsvariable X ist einfach eine <strong>Zahl, die vom Zufall abhängt</strong>: die Augenzahl beim Würfeln, der Gewinn bei einem Spiel, die Anzahl defekter Teile."
       },
       {
        "type": "p",
        "html": "Die <strong>Wahrscheinlichkeitsfunktion</strong> sagt, wie wahrscheinlich jeder Wert ist. Alle Wahrscheinlichkeiten zusammen ergeben 1."
       }
      ]
     },
     {
      "title": "Erwartungswert – der Langzeit-Durchschnitt",
      "blocks": [
       {
        "type": "formula",
        "html": "E(X) = Σ xᵢ · p(xᵢ)",
        "legend": "Jeden Wert mit seiner Wahrscheinlichkeit gewichten"
       },
       {
        "type": "example",
        "title": "Feuerversicherung (Übungsblatt 5.5)",
        "html": "Prämie 100 €, Auszahlung 10.000 € mit Wahrscheinlichkeit 0,0008.<br>Erwartete Auszahlung: 0,0008 · 10.000 = 8 €.<br>Überschuss pro Vertrag: 100 − 8 = <strong>92 €</strong>."
       },
       {
        "type": "widget",
        "id": "erwartungswert"
       }
      ]
     },
     {
      "title": "Varianz & Standardabweichung",
      "blocks": [
       {
        "type": "formula",
        "html": "Var(X) = Σ (xᵢ − E(X))² · p(xᵢ)        σ = √Var(X)"
       },
       {
        "type": "p",
        "html": "Genau wie bei Daten – nur dass statt „durch n teilen“ jede Abweichung mit ihrer Wahrscheinlichkeit gewichtet wird."
       },
       {
        "type": "check",
        "id": "k11c1",
        "q": "X ist 0 oder 10, jeweils mit 0,5. E(X) = ?",
        "options": [
         "0",
         "5",
         "10",
         "2,5"
        ],
        "correct": 1,
        "explain": "0 · 0,5 + 10 · 0,5 = 5."
       }
      ]
     }
    ]
   },
   {
    "id": 12,
    "title": "Verteilungen",
    "icon": "🔔",
    "short": "Binomial-, Poisson- und Normalverteilung",
    "minutes": 30,
    "examWeight": 5,
    "sections": [
     {
      "title": "Welche Verteilung wann?",
      "blocks": [
       {
        "type": "list",
        "items": [
         "<strong>Binomial</strong>: n Versuche, je Erfolg/Misserfolg, gleiches p. „Von 5 Patienten werden mind. 4 gesund.“",
         "<strong>Poisson</strong>: Anzahl seltener Ereignisse in einem Zeitraum, nur der Durchschnitt λ ist bekannt. „Anrufe pro Minute.“",
         "<strong>Hypergeometrisch</strong>: Ziehen <em>ohne</em> Zurücklegen aus kleiner Menge. „Urne mit 7 blauen, 6 gelben Kugeln.“",
         "<strong>Normal</strong>: stetige Messwerte, die sich um einen Mittelwert gruppieren. „Füllgewicht, Körpergröße, Lebensdauer.“"
        ]
       },
       {
        "type": "formula",
        "html": "Binomial: P(X = k) = (n über k) · pᵏ · (1 − p)ⁿ⁻ᵏ        Poisson: P(X = k) = λᵏ / k! · e^(−λ)"
       },
       {
        "type": "widget",
        "id": "verteilungen"
       }
      ]
     },
     {
      "title": "Die Normalverteilung in 6 Fragen",
      "blocks": [
       {
        "type": "steps",
        "items": [
         "<strong>Wo liegt der Mittelwert?</strong> Genau in der Mitte, am höchsten Punkt der Glocke. Die Kurve ist symmetrisch um μ.",
         "<strong>Was bedeutet σ?</strong> Die Breite der Glocke. Kleines σ: schmal und hoch. Großes σ: breit und flach.",
         "<strong>Warum gibt es die Glockenkurve?</strong> Wenn viele kleine, zufällige Einflüsse zusammenkommen (Maschine, Material, Temperatur …), landen die meisten Werte nahe der Mitte, extreme Werte sind selten. Das ergibt automatisch eine Glocke.",
         "<strong>Wo liegen 68 %?</strong> Zwischen μ − σ und μ + σ.",
         "<strong>Wo liegen 95 %?</strong> Zwischen μ − 2σ und μ + 2σ (genau: ±1,96σ).",
         "<strong>Wo liegen 99,7 %?</strong> Zwischen μ − 3σ und μ + 3σ. Fast alles!"
        ]
       },
       {
        "type": "tip",
        "html": "Drück im Widget oben auf „68-95-99,7 animieren“ – dann siehst du die Bereiche nacheinander."
       }
      ]
     },
     {
      "title": "Rechnen mit der Normalverteilung",
      "blocks": [
       {
        "type": "steps",
        "items": [
         "Okay, zuerst übersetzen wir den Wert in z: <strong>z = (x − μ) / σ</strong>. z sagt: „Wie viele σ ist x vom Mittelwert weg?“",
         "Dann schauen wir in die Tabelle: <strong>P(X ≤ x) = Φ(z)</strong>.",
         "Negatives z? Kein Problem: <strong>Φ(−z) = 1 − Φ(z)</strong>.",
         "„Mehr als“: 1 − Φ(z). „Zwischen a und b“: Φ(z_b) − Φ(z_a)."
        ]
       },
       {
        "type": "example",
        "title": "Konservendosen (Übungsblatt 6.4)",
        "html": "μ = 249,2 g, σ = 11,37 g. Anteil unter 240 g?<br>z = (240 − 249,2)/11,37 = −0,81<br>Φ(−0,81) = 1 − 0,7910 = <strong>0,209 ≈ 21 %</strong> sind untergewichtig."
       },
       {
        "type": "check",
        "id": "k12c1",
        "q": "μ = 100, σ = 10. Welcher Bereich enthält ca. 95 % der Werte?",
        "options": [
         "90 bis 110",
         "80 bis 120",
         "70 bis 130",
         "95 bis 105"
        ],
        "correct": 1,
        "explain": "μ ± 2σ = 100 ± 20 → 80 bis 120."
       }
      ]
     }
    ]
   },
   {
    "id": 13,
    "title": "Konfidenzintervalle",
    "icon": "🎯",
    "short": "Vom Ausschnitt aufs Ganze schließen",
    "minutes": 25,
    "examWeight": 10,
    "sections": [
     {
      "title": "Warum reicht eine Stichprobe?",
      "blocks": [
       {
        "type": "p",
        "html": "Wir können nicht alle 10.000 Ärzte nach ihrem Einkommen fragen. Aber wenn wir <strong>zufällig</strong> 100 auswählen, sind die meistens ein ziemlich gutes Abbild der ganzen Gruppe – wie der Löffel Suppe nach dem Umrühren."
       }
      ]
     },
     {
      "title": "Warum schätzen wir?",
      "blocks": [
       {
        "type": "p",
        "html": "Der Mittelwert der Stichprobe x̄ trifft den <strong>wahren Mittelwert μ</strong> fast nie exakt. Eine andere Stichprobe hätte einen etwas anderen Wert geliefert. Deshalb sagen wir nicht „μ = 80.000 €“, sondern ehrlicher:"
       },
       {
        "type": "formula",
        "html": "„μ liegt wahrscheinlich zwischen 78.530 € und 81.470 €.“",
        "legend": "Das ist ein Konfidenzintervall"
       }
      ]
     },
     {
      "title": "Was bedeutet 95 %?",
      "blocks": [
       {
        "type": "p",
        "html": "Wenn wir das Ganze <strong>100-mal</strong> mit neuen Stichproben wiederholen würden, würden etwa <strong>95 der 100 Intervalle</strong> den wahren Wert enthalten. Probier es aus:"
       },
       {
        "type": "widget",
        "id": "ki-simulation"
       },
       {
        "type": "warn",
        "html": "Nicht sagen: „μ liegt mit 95 % Wahrscheinlichkeit im Intervall.“ Besser: „Das Verfahren liefert in 95 % der Fälle ein Intervall, das μ enthält.“ (Für die Klausur reicht meist: „Mit 95 % Vertrauen liegt μ zwischen … und …“)"
       }
      ]
     },
     {
      "title": "Die Formeln – und wann welche",
      "blocks": [
       {
        "type": "formula",
        "html": "σ bekannt:   x̄ ± z · σ / √n",
        "legend": "95 %: z = 1,96 · 99 %: z = 2,576 · 90 %: z = 1,645"
       },
       {
        "type": "formula",
        "html": "σ unbekannt:   x̄ ± t(n − 1) · s / √n",
        "legend": "t aus der t-Tabelle; bei großem n fast gleich z"
       },
       {
        "type": "formula",
        "html": "Anteil:   p ± z · √(p · (1 − p) / n)"
       },
       {
        "type": "example",
        "title": "Bildröhren (Klausur WS 22/23, 6 Punkte)",
        "html": "x̄ = 1388 h, σ = 60 h, n = 100, 95 %.<br>Standardfehler: 60 / √100 = 6<br>1388 ± 1,96 · 6 = 1388 ± 11,76 → <strong>[1376,24; 1399,76]</strong>"
       },
       {
        "type": "tip",
        "html": "Das Intervall wird <strong>schmaler</strong>, wenn n größer wird oder das Niveau sinkt. <strong>Breiter</strong>, wenn σ größer ist oder du sicherer sein willst."
       },
       {
        "type": "formula",
        "html": "Benötigtes n:   n ≥ (z · σ / e)²",
        "legend": "e = gewünschte halbe Breite; immer aufrunden"
       },
       {
        "type": "check",
        "id": "k13c1",
        "q": "Was passiert mit dem Konfidenzintervall, wenn man n vervierfacht?",
        "options": [
         "Es wird halb so breit",
         "Es wird viermal so breit",
         "Es bleibt gleich",
         "Es wird ein Viertel so breit"
        ],
        "correct": 0,
        "explain": "Die Breite hängt von 1/√n ab. √4 = 2 → halb so breit."
       }
      ]
     }
    ]
   },
   {
    "id": 14,
    "title": "Hypothesentests",
    "icon": "⚖️",
    "short": "Der wichtigste Teil – mit Assistent",
    "minutes": 30,
    "examWeight": 20,
    "sections": [
     {
      "title": "Die Idee: ein Gerichtsverfahren",
      "blocks": [
       {
        "type": "p",
        "html": "Ein Hersteller behauptet: „Unsere Festplatten halten <strong>mindestens 3.500 Stunden</strong>.“ Ein Prüfer testet 50 Stück und findet im Schnitt 3.470 Stunden. Lügt der Hersteller – oder ist das nur Zufall?"
       },
       {
        "type": "list",
        "items": [
         "<strong>H₀ (Nullhypothese)</strong> = „unschuldig“: die Behauptung stimmt. Sie enthält immer das Gleichheitszeichen (=, ≤, ≥).",
         "<strong>H₁ (Alternativhypothese)</strong> = das, was wir nachweisen wollen.",
         "Wir lehnen H₀ nur ab, wenn die Beweise (Stichprobe) <strong>sehr deutlich</strong> dagegen sprechen.",
         "<strong>α</strong> (z. B. 5 %) = das Risiko, einen Unschuldigen zu verurteilen."
        ]
       }
      ]
     },
     {
      "title": "Das Rezept in 6 Schritten",
      "blocks": [
       {
        "type": "steps",
        "items": [
         "<strong>Hypothesen aufstellen.</strong> „mindestens μ₀“ → H₀: μ ≥ μ₀, H₁: μ < μ₀ (linksseitig). „höchstens“ → rechtsseitig. „genau“ → beidseitig.",
         "<strong>Signifikanzniveau α</strong> festlegen (steht meist in der Aufgabe, z. B. 0,05).",
         "<strong>Test wählen:</strong> σ bekannt → z-Test. Nur s aus der Stichprobe → t-Test (df = n − 1). Anteil → Anteilstest.",
         "<strong>Kritischen Wert</strong> aus der Tabelle holen. Einseitig 5 %: 1,645. Zweiseitig 5 %: 1,96.",
         "<strong>Prüfgröße berechnen:</strong> z (oder t) = (x̄ − μ₀) / (σ / √n).",
         "<strong>Entscheiden:</strong> Liegt die Prüfgröße im Ablehnungsbereich? → H₀ ablehnen. Sonst H₀ beibehalten. Und in Worten antworten!"
        ]
       }
      ]
     },
     {
      "title": "Der Test-Assistent",
      "blocks": [
       {
        "type": "p",
        "html": "Gib die Werte einer Aufgabe ein – der Assistent führt dich durch alle Schritte und zeichnet den Ablehnungsbereich."
       },
       {
        "type": "widget",
        "id": "test-assistent"
       }
      ]
     },
     {
      "title": "Musterlösung Klausur WS 22/23 (15 Punkte)",
      "blocks": [
       {
        "type": "example",
        "title": "Festplatten",
        "html": "1) H₀: μ ≥ 3.500 gegen H₁: μ < 3.500 (linksseitig)<br>2) α = 0,05<br>3) σ unbekannt (Stichprobenvarianz 121) → t-Test, df = 49<br>4) kritischer Wert: −t(49; 0,95) ≈ −1,677<br>5) s = √121 = 11; t = (3.470 − 3.500) / (11 / √50) = −30 / 1,556 = <strong>−19,28</strong><br>6) −19,28 < −1,677 → <strong>H₀ ablehnen</strong>. Die Behauptung des Herstellers ist mit der Stichprobe <strong>nicht</strong> vereinbar."
       },
       {
        "type": "warn",
        "html": "Häufige Fehler: Varianz statt Standardabweichung einsetzen (Wurzel vergessen!) · Hypothesen vertauschen · bei einseitigem Test 1,96 statt 1,645 nehmen."
       },
       {
        "type": "check",
        "id": "k14c1",
        "q": "Behauptung: „Die Maschine verbraucht höchstens 3 Liter.“ Wie lautet H₀?",
        "options": [
         "μ ≥ 3",
         "μ ≤ 3",
         "μ = 3",
         "μ > 3"
        ],
        "correct": 1,
        "explain": "Die Behauptung inkl. Gleichheitszeichen kommt in H₀: μ ≤ 3. Der Prüfer vermutet μ > 3 (rechtsseitig)."
       }
      ]
     }
    ]
   },
   {
    "id": 15,
    "title": "Regression & Korrelation",
    "icon": "📈",
    "short": "Lineare Regression, Preis-Absatz-Funktion, Korrelation",
    "minutes": 25,
    "examWeight": 25,
    "sections": [
     {
      "title": "Die beste Gerade durch eine Punktwolke",
      "blocks": [
       {
        "type": "p",
        "html": "Ein Unternehmen verkauft ein Produkt zu verschiedenen Preisen und notiert die Absatzmengen. Frage: <strong>Wie hängt die Menge vom Preis ab?</strong>"
       },
       {
        "type": "p",
        "html": "Die Regression legt die Gerade <strong>ŷ = a + b · x</strong> so durch die Punkte, dass die quadrierten Abstände (Residuen) möglichst klein sind."
       },
       {
        "type": "widget",
        "id": "regression"
       }
      ]
     },
     {
      "title": "Das Rechenrezept (Klausur: 20 Punkte!)",
      "blocks": [
       {
        "type": "steps",
        "items": [
         "Mittelwerte x̄ und ȳ berechnen.",
         "Arbeitstabelle: (x − x̄), (y − ȳ), deren Produkt, (x − x̄)² und (y − ȳ)².",
         "Steigung: <strong>b = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²</strong>",
         "Achsenabschnitt: <strong>a = ȳ − b · x̄</strong>",
         "Funktion hinschreiben: ŷ = a + b · x – fertig!"
        ]
       },
       {
        "type": "example",
        "title": "Klausur WS 22/23",
        "html": "Preise 180, 190, 210, 200, 220 · Mengen 115, 100, 90, 90, 70<br>x̄ = 200, ȳ = 93<br>Σ(x − x̄)(y − ȳ) = −1.000, Σ(x − x̄)² = 1.000<br>b = −1.000 / 1.000 = <strong>−1</strong>, a = 93 − (−1) · 200 = <strong>293</strong><br>→ <strong>Menge = 293 − 1 · Preis</strong>"
       }
      ]
     },
     {
      "title": "Korrelation – wie gut passt die Gerade?",
      "blocks": [
       {
        "type": "formula",
        "html": "r = Σ(x − x̄)(y − ȳ) / √(Σ(x − x̄)² · Σ(y − ȳ)²)",
        "legend": "−1 ≤ r ≤ 1 · R² = r² = erklärter Anteil der Streuung"
       },
       {
        "type": "list",
        "items": [
         "r nahe +1: starker positiver Zusammenhang",
         "r nahe −1: starker negativer Zusammenhang (Preis ↑, Menge ↓)",
         "r nahe 0: kein linearer Zusammenhang"
        ]
       },
       {
        "type": "example",
        "title": "Fortsetzung",
        "html": "Σ(y − ȳ)² = 1.080 → r = −1.000 / √(1.000 · 1.080) = <strong>−0,962</strong> → sehr starker negativer Zusammenhang. Der Preis spielt eine große Rolle für den Absatz."
       },
       {
        "type": "warn",
        "html": "Korrelation ist keine Kausalität! Eisverkäufe und Sonnenbrände korrelieren – beide hängen von der Sonne ab."
       },
       {
        "type": "formula",
        "html": "Spearman (Ränge):  ρ = 1 − 6 · Σd² / (n · (n² − 1))",
        "legend": "für ordinale Daten, d = Rangdifferenz"
       },
       {
        "type": "check",
        "id": "k15c1",
        "q": "ŷ = 293 − 1 · x. Wie viel wird bei einem Preis von 205 € verkauft?",
        "options": [
         "88",
         "98",
         "293",
         "205"
        ],
        "correct": 0,
        "explain": "293 − 205 = 88 Stück."
       }
      ]
     }
    ]
   },
   {
    "id": 16,
    "title": "Indexrechnung",
    "icon": "🛒",
    "short": "Laspeyres, Paasche, Wachstumsraten",
    "minutes": 15,
    "examWeight": 15,
    "sections": [
     {
      "title": "Wie viel teurer ist alles geworden?",
      "blocks": [
       {
        "type": "p",
        "html": "Ein Preisindex vergleicht die Preise eines <strong>Warenkorbs</strong> zwischen einem Basisjahr (0) und einem Berichtsjahr (1). Die Frage ist nur: <em>welcher</em> Warenkorb?"
       },
       {
        "type": "steps",
        "items": [
         "<strong>Laspeyres</strong>: der <em>alte</em> Warenkorb (Mengen q₀). „Was kostet mein Einkauf von damals heute?“",
         "<strong>Paasche</strong>: der <em>neue</em> Warenkorb (Mengen q₁). „Was hätte mein heutiger Einkauf damals gekostet?“"
        ]
       },
       {
        "type": "formula",
        "html": "P_L = Σ p₁ · q₀ / Σ p₀ · q₀          P_P = Σ p₁ · q₁ / Σ p₀ · q₁",
        "legend": "Eselsbrücke: Laspeyres = „L“ wie „Last time“-Mengen"
       }
      ]
     },
     {
      "title": "Interaktiver Index-Rechner",
      "blocks": [
       {
        "type": "widget",
        "id": "index"
       }
      ]
     },
     {
      "title": "Musterlösung Klausur WS 22/23 (15 Punkte)",
      "blocks": [
       {
        "type": "example",
        "title": "Daten",
        "html": "Produkt 1: 55 → 70 € (Mengen 200 / 180)<br>Produkt 2: 65 → 58 € (Mengen 50 / 80)<br>Produkt 3: 150 → 190 € (Mengen 15 / 25)"
       },
       {
        "type": "example",
        "title": "Laspeyres",
        "html": "Σ p₁q₀ = 70·200 + 58·50 + 190·15 = 19.750<br>Σ p₀q₀ = 55·200 + 65·50 + 150·15 = 16.500<br>P_L = 19.750 / 16.500 = <strong>1,197</strong> → +19,7 %"
       },
       {
        "type": "example",
        "title": "Paasche",
        "html": "Σ p₁q₁ = 70·180 + 58·80 + 190·25 = 21.990<br>Σ p₀q₁ = 55·180 + 65·80 + 150·25 = 18.850<br>P_P = 21.990 / 18.850 = <strong>1,167</strong> → +16,7 %"
       },
       {
        "type": "example",
        "title": "Mittlere jährliche Preissteigerung",
        "html": "2015 → 2022 = 7 Jahre. Geometrisches Mittel:<br>1,197^(1/7) − 1 = <strong>2,6 % pro Jahr</strong>"
       },
       {
        "type": "tip",
        "html": "Wachstum ist „Zinseszins“ → immer das <strong>geometrische</strong> Mittel. Achtung: 5 Jahre Daten = 4 Wachstumsschritte!"
       },
       {
        "type": "check",
        "id": "k16c1",
        "q": "Welche Mengen verwendet der Laspeyres-Index?",
        "options": [
         "Mengen des Basisjahres q₀",
         "Mengen des Berichtsjahres q₁",
         "Durchschnitt beider Mengen"
        ],
        "correct": 0,
        "explain": "Laspeyres hält den alten Warenkorb fest: q₀."
       }
      ]
     }
    ]
   }
  ]
 },
 "aufgaben": {
  "info": "Welche Aufgabenvorlagen (scripts/generator.js) zu welchem Kapitel und Schwierigkeitsgrad gehören. Die Vorlagen werden der Reihe nach abwechselnd verwendet; jede Aufgabe bekommt eigene Zahlen.",
  "counts": {
   "easy": 30,
   "medium": 20,
   "hard": 10
  },
  "labels": {
   "easy": "Leicht",
   "medium": "Mittel",
   "hard": "Schwer"
  },
  "xp": {
   "easy": 10,
   "medium": 20,
   "hard": 40
  },
  "chapters": {
   "1": {
    "templates": {
     "easy": [
      "k1-rollen",
      "k1-vollerhebung"
     ],
     "medium": [
      "k1-diskret",
      "k1-aussage",
      "k1-rollen"
     ],
     "hard": [
      "k1-komplett"
     ]
    }
   },
   "2": {
    "templates": {
     "easy": [
      "k2-skala"
     ],
     "medium": [
      "k2-lagemass",
      "k2-skala"
     ],
     "hard": [
      "k2-zusammenhang"
     ]
    }
   },
   "3": {
    "templates": {
     "easy": [
      "k3-absolut",
      "k3-tabelle"
     ],
     "medium": [
      "k3-kumuliert",
      "k3-tabelle"
     ],
     "hard": [
      "k3-klassiert"
     ]
    }
   },
   "4": {
    "templates": {
     "easy": [
      "k4-mittelwert",
      "k4-median",
      "k4-modus"
     ],
     "medium": [
      "k4-haeufigkeitstabelle",
      "k4-quartile",
      "k4-harmonisch"
     ],
     "hard": [
      "k4-klassiert",
      "k4-ueberschritten"
     ]
    }
   },
   "5": {
    "templates": {
     "easy": [
      "k5-spannweite",
      "k5-varianz"
     ],
     "medium": [
      "k5-variationskoeffizient",
      "k5-varianz"
     ],
     "hard": [
      "k5-klassiert",
      "k5-klausur-deskriptiv"
     ]
    }
   },
   "6": {
    "templates": {
     "easy": [
      "k6-anteil"
     ],
     "medium": [
      "k6-gini",
      "k6-anteil"
     ],
     "hard": [
      "k6-gini-klassiert",
      "k6-gini"
     ]
    }
   },
   "7": {
    "templates": {
     "easy": [
      "k7-ergaenzen",
      "k7-prozent"
     ],
     "medium": [
      "k7-phi",
      "k7-prozent"
     ],
     "hard": [
      "k7-zusammenfassen"
     ]
    }
   },
   "8": {
    "templates": {
     "easy": [
      "k8-fakultaet",
      "k8-haendedruck"
     ],
     "medium": [
      "k8-kombination",
      "k8-variation"
     ],
     "hard": [
      "k8-hypergeometrisch",
      "k8-liga"
     ]
    }
   },
   "9": {
    "templates": {
     "easy": [
      "k9-laplace",
      "k9-muenze"
     ],
     "medium": [
      "k9-baum",
      "k9-mindestens"
     ],
     "hard": [
      "k9-additionssatz",
      "k9-wartezeit"
     ]
    }
   },
   "10": {
    "templates": {
     "easy": [
      "k10-haeufigkeiten",
      "k10-falschpositiv"
     ],
     "medium": [
      "k10-totale",
      "k10-bedingt-tabelle",
      "k10-falschpositiv"
     ],
     "hard": [
      "k10-bayes",
      "k10-maschinen"
     ]
    }
   },
   "11": {
    "templates": {
     "easy": [
      "k11-erwartungswert"
     ],
     "medium": [
      "k11-varianz",
      "k11-versicherung"
     ],
     "hard": [
      "k11-spiel",
      "k11-varianz"
     ]
    }
   },
   "12": {
    "templates": {
     "easy": [
      "k12-binomial",
      "k12-poisson"
     ],
     "medium": [
      "k12-normal-unter",
      "k12-normal-zwischen",
      "k12-binomial-mind"
     ],
     "hard": [
      "k12-normal-intervall",
      "k12-poisson-skaliert",
      "k12-seltene"
     ]
    }
   },
   "13": {
    "templates": {
     "easy": [
      "k13-ki-sigma"
     ],
     "medium": [
      "k13-ki-s",
      "k13-ki-anteil"
     ],
     "hard": [
      "k13-stichprobenumfang",
      "k13-ki-s"
     ]
    }
   },
   "14": {
    "templates": {
     "easy": [
      "k14-hypothesen"
     ],
     "medium": [
      "k14-entscheidung",
      "k14-anteil"
     ],
     "hard": [
      "k14-ttest",
      "k14-ki-test"
     ]
    }
   },
   "15": {
    "templates": {
     "easy": [
      "k15-r-deuten",
      "k15-prognose"
     ],
     "medium": [
      "k15-korrelation",
      "k15-spearman"
     ],
     "hard": [
      "k15-preis-absatz"
     ]
    }
   },
   "16": {
    "templates": {
     "easy": [
      "k16-preisaenderung",
      "k16-wachstum"
     ],
     "medium": [
      "k16-laspeyres",
      "k16-paasche"
     ],
     "hard": [
      "k16-klausur"
     ]
    }
   }
  }
 },
 "klausuren": {
  "info": "Aufbau der drei Klausurmodi. Jede Aufgabe wird beim Start mit neuen Zahlen erzeugt. 'pool' = mögliche Vorlagen, eine davon wird zufällig gewählt.",
  "passPercent": 50,
  "gradeScale": [
   {
    "min": 95,
    "grade": 1.0
   },
   {
    "min": 90,
    "grade": 1.3
   },
   {
    "min": 85,
    "grade": 1.7
   },
   {
    "min": 80,
    "grade": 2.0
   },
   {
    "min": 75,
    "grade": 2.3
   },
   {
    "min": 70,
    "grade": 2.7
   },
   {
    "min": 65,
    "grade": 3.0
   },
   {
    "min": 60,
    "grade": 3.3
   },
   {
    "min": 55,
    "grade": 3.7
   },
   {
    "min": 50,
    "grade": 4.0
   },
   {
    "min": 0,
    "grade": 5.0
   }
  ],
  "modes": {
   "mini": {
    "title": "Mini-Klausur",
    "icon": "⏱️",
    "minutes": 15,
    "description": "5 kurze Aufgaben quer durch den Stoff. Perfekt für zwischendurch.",
    "items": [
     {
      "chapter": 4,
      "pool": [
       "k4-mittelwert",
       "k4-median",
       "k4-haeufigkeitstabelle"
      ],
      "diff": "easy"
     },
     {
      "chapter": 5,
      "pool": [
       "k5-varianz",
       "k5-variationskoeffizient"
      ],
      "diff": "medium"
     },
     {
      "chapter": 10,
      "pool": [
       "k10-totale",
       "k10-haeufigkeiten"
      ],
      "diff": "medium"
     },
     {
      "chapter": 12,
      "pool": [
       "k12-normal-unter",
       "k12-binomial",
       "k12-poisson"
      ],
      "diff": "medium"
     },
     {
      "chapter": 13,
      "pool": [
       "k13-ki-sigma",
       "k13-ki-anteil"
      ],
      "diff": "medium"
     }
    ]
   },
   "probe": {
    "title": "Probe-Klausur",
    "icon": "📋",
    "minutes": 30,
    "description": "3 echte Klausuraufgaben: deskriptiv, induktiv und ein Bonus-Thema.",
    "items": [
     {
      "chapter": 5,
      "pool": [
       "k5-klassiert",
       "k4-klassiert"
      ],
      "diff": "hard"
     },
     {
      "chapter": 14,
      "pool": [
       "k14-ttest",
       "k13-ki-s",
       "k14-entscheidung"
      ],
      "diff": "hard"
     },
     {
      "chapter": 10,
      "pool": [
       "k10-bayes",
       "k16-klausur",
       "k12-normal-zwischen"
      ],
      "diff": "hard"
     }
    ]
   },
   "komplett": {
    "title": "Komplette Klausur",
    "icon": "🎓",
    "minutes": 90,
    "description": "Aufbau wie die echte Prüfung (WS 22/23): 6 Aufgaben, 100 Punkte.",
    "items": [
     {
      "chapter": 5,
      "pool": [
       "k5-klausur-deskriptiv"
      ],
      "diff": "hard",
      "title": "1. Deskriptive Statistik"
     },
     {
      "chapter": 14,
      "pool": [
       "k14-ttest"
      ],
      "diff": "hard",
      "title": "2. Stichproben / Hypothesentest"
     },
     {
      "chapter": 13,
      "pool": [
       "k14-ki-test"
      ],
      "diff": "hard",
      "title": "3. Schätzen und Testen"
     },
     {
      "chapter": 16,
      "pool": [
       "k16-klausur"
      ],
      "diff": "hard",
      "title": "4. Indexrechnung"
     },
     {
      "chapter": 15,
      "pool": [
       "k15-preis-absatz"
      ],
      "diff": "hard",
      "title": "5. Regression / Preis-Absatz-Funktion"
     },
     {
      "chapter": 10,
      "pool": [
       "k10-bayes"
      ],
      "diff": "hard",
      "title": "6. Bedingte Wahrscheinlichkeit"
     }
    ]
   }
  },
  "topics": {
   "Deskriptive Statistik": [
    3,
    4,
    5
   ],
   "Wahrscheinlichkeit": [
    9,
    10,
    11,
    12
   ],
   "Induktive Statistik": [
    13,
    14,
    15
   ],
   "Indexrechnung": [
    16
   ]
  }
 },
 "formeln": {
  "info": "Formelsammlung – wird im Lernbereich, in Aufgaben und im Klausurmodus angezeigt.",
  "groups": [
   {
    "title": "Lagemaße",
    "chapter": 4,
    "items": [
     {
      "name": "Arithmetisches Mittel",
      "formula": "x̄ = (x₁ + x₂ + … + xₙ) / n",
      "when": "metrische Daten"
     },
     {
      "name": "Mittel aus Häufigkeiten",
      "formula": "x̄ = Σ xᵢ · hᵢ / n",
      "when": "Häufigkeitstabelle"
     },
     {
      "name": "Mittel klassierter Daten",
      "formula": "x̄ = Σ mⱼ · nⱼ / n   (mⱼ = Klassenmitte)",
      "when": "Klassen statt Einzelwerte"
     },
     {
      "name": "Median",
      "formula": "mittlerer Wert der sortierten Reihe; bei geradem n: Mittel der beiden mittleren",
      "when": "ab ordinal"
     },
     {
      "name": "Quantil (Rohdaten)",
      "formula": "n·p ganzzahlig → (x₍ₙₚ₎ + x₍ₙₚ₊₁₎)/2, sonst x₍⌈ₙₚ⌉₎",
      "when": "Quartile: p = 0,25 / 0,75"
     },
     {
      "name": "Quantil (klassiert)",
      "formula": "x = u + (p·n − F_davor) / nⱼ · Klassenbreite",
      "when": "„Welcher Wert wird von … % überschritten?“"
     },
     {
      "name": "Geometrisches Mittel",
      "formula": "x̄_geo = ⁿ√(x₁ · x₂ · … · xₙ)",
      "when": "Wachstumsraten"
     },
     {
      "name": "Harmonisches Mittel",
      "formula": "x̄_harm = n / Σ(1/xᵢ)",
      "when": "Durchschnittspreise bei gleichem Budget, Geschwindigkeiten"
     }
    ]
   },
   {
    "title": "Streuungsmaße",
    "chapter": 5,
    "items": [
     {
      "name": "Spannweite",
      "formula": "R = x_max − x_min"
     },
     {
      "name": "Quartilsabstand",
      "formula": "IQR = Q₀,₇₅ − Q₀,₂₅"
     },
     {
      "name": "Varianz (Stichprobe)",
      "formula": "s² = Σ(xᵢ − x̄)² / (n − 1)",
      "when": "Grundgesamtheit / klassierte Verteilung: durch n"
     },
     {
      "name": "Varianz klassiert",
      "formula": "s² = Σ nⱼ · (mⱼ − x̄)² / n"
     },
     {
      "name": "Standardabweichung",
      "formula": "s = √s²"
     },
     {
      "name": "Variationskoeffizient",
      "formula": "V = s / x̄"
     }
    ]
   },
   {
    "title": "Konzentration & Zusammenhang",
    "chapter": 6,
    "items": [
     {
      "name": "Gini-Koeffizient",
      "formula": "G = 1 − Σ (kᵢ − kᵢ₋₁)(lᵢ + lᵢ₋₁)",
      "when": "kᵢ, lᵢ = kumulierte Anteile (Merkmalsträger, Merkmalssumme)"
     },
     {
      "name": "Gini korrigiert",
      "formula": "G* = n / (n − 1) · G",
      "when": "bei n Einzelwerten"
     },
     {
      "name": "φ-Koeffizient (4-Felder)",
      "formula": "φ = (n₁₁·n₂₂ − n₁₂·n₂₁) / √(n₁.·n₂.·n.₁·n.₂)",
      "when": "nominale Merkmale; Stärke = |φ|"
     },
     {
      "name": "Korrelation (Bravais-Pearson)",
      "formula": "r = Σ(x − x̄)(y − ȳ) / √(Σ(x − x̄)² · Σ(y − ȳ)²)",
      "when": "beide metrisch"
     },
     {
      "name": "Rangkorrelation (Spearman)",
      "formula": "ρ = 1 − 6·Σdᵢ² / (n·(n² − 1))",
      "when": "ordinal"
     },
     {
      "name": "Regressionsgerade",
      "formula": "ŷ = a + b·x,  b = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²,  a = ȳ − b·x̄"
     },
     {
      "name": "Bestimmtheitsmaß",
      "formula": "R² = r²"
     }
    ]
   },
   {
    "title": "Indexzahlen",
    "chapter": 16,
    "items": [
     {
      "name": "Preisindex Laspeyres",
      "formula": "P_L = Σ p₁·q₀ / Σ p₀·q₀",
      "when": "alter Warenkorb"
     },
     {
      "name": "Preisindex Paasche",
      "formula": "P_P = Σ p₁·q₁ / Σ p₀·q₁",
      "when": "neuer Warenkorb"
     },
     {
      "name": "Mittlere Wachstumsrate",
      "formula": "r = (Endwert / Anfangswert)^(1/Anzahl Jahre) − 1"
     }
    ]
   },
   {
    "title": "Wahrscheinlichkeit",
    "chapter": 9,
    "items": [
     {
      "name": "Laplace",
      "formula": "P(A) = günstige / mögliche Ergebnisse"
     },
     {
      "name": "Gegenereignis",
      "formula": "P(nicht A) = 1 − P(A)"
     },
     {
      "name": "Additionssatz",
      "formula": "P(A ∪ B) = P(A) + P(B) − P(A ∩ B)"
     },
     {
      "name": "Unabhängigkeit",
      "formula": "P(A ∩ B) = P(A) · P(B)"
     },
     {
      "name": "Bedingte Wahrscheinlichkeit",
      "formula": "P(B | A) = P(A ∩ B) / P(A)"
     },
     {
      "name": "Totale Wahrscheinlichkeit",
      "formula": "P(B) = Σ P(B | Aᵢ) · P(Aᵢ)"
     },
     {
      "name": "Satz von Bayes",
      "formula": "P(A | B) = P(B | A) · P(A) / P(B)"
     },
     {
      "name": "Fakultät / Permutation",
      "formula": "n! = n · (n − 1) · … · 1"
     },
     {
      "name": "Kombination",
      "formula": "(n über k) = n! / (k! · (n − k)!)",
      "when": "ohne Reihenfolge, ohne Wiederholung"
     },
     {
      "name": "Variation",
      "formula": "n! / (n − k)!",
      "when": "mit Reihenfolge, ohne Wiederholung"
     }
    ]
   },
   {
    "title": "Zufallsvariablen & Verteilungen",
    "chapter": 12,
    "items": [
     {
      "name": "Erwartungswert",
      "formula": "E(X) = Σ xᵢ · p(xᵢ)"
     },
     {
      "name": "Varianz",
      "formula": "Var(X) = Σ (xᵢ − E(X))² · p(xᵢ)"
     },
     {
      "name": "Binomialverteilung",
      "formula": "P(X = k) = (n über k) · pᵏ · (1 − p)ⁿ⁻ᵏ,  E = n·p,  Var = n·p·(1 − p)"
     },
     {
      "name": "Poissonverteilung",
      "formula": "P(X = k) = λᵏ / k! · e^(−λ),  E = Var = λ"
     },
     {
      "name": "Hypergeometrisch",
      "formula": "P(X = k) = (M über k)(N − M über n − k) / (N über n)"
     },
     {
      "name": "Standardisierung",
      "formula": "z = (x − μ) / σ,  P(X ≤ x) = Φ(z),  Φ(−z) = 1 − Φ(z)"
     },
     {
      "name": "68-95-99,7-Regel",
      "formula": "μ ± 1σ: 68,3 %   μ ± 2σ: 95,4 %   μ ± 3σ: 99,7 %"
     }
    ]
   },
   {
    "title": "Konfidenzintervalle & Tests",
    "chapter": 13,
    "items": [
     {
      "name": "KI Mittelwert, σ bekannt",
      "formula": "x̄ ± z(1 − α/2) · σ / √n"
     },
     {
      "name": "KI Mittelwert, σ unbekannt",
      "formula": "x̄ ± t(n − 1; 1 − α/2) · s / √n"
     },
     {
      "name": "KI Anteil",
      "formula": "p ± z(1 − α/2) · √(p(1 − p) / n)",
      "when": "n·p ≥ 5 und n·(1 − p) ≥ 5"
     },
     {
      "name": "Stichprobenumfang",
      "formula": "n ≥ (z · σ / e)²   bzw.   n ≥ z² · p(1 − p) / e²",
      "when": "e = halbe Intervallbreite, immer aufrunden"
     },
     {
      "name": "z-Test",
      "formula": "z = (x̄ − μ₀) / (σ / √n)"
     },
     {
      "name": "t-Test",
      "formula": "t = (x̄ − μ₀) / (s / √n),  df = n − 1"
     },
     {
      "name": "Anteilstest",
      "formula": "z = (p − π₀) / √(π₀(1 − π₀) / n)"
     },
     {
      "name": "Ablehnung von H₀",
      "formula": "beidseitig: |z| > z(1 − α/2)  ·  rechts: z > z(1 − α)  ·  links: z < −z(1 − α)"
     },
     {
      "name": "Wichtige z-Werte",
      "formula": "90 %: 1,645 (zweiseitig) · 95 %: 1,96 · 99 %: 2,576 · einseitig 5 %: 1,645 · einseitig 1 %: 2,326"
     }
    ]
   }
  ]
 }
};
