# Rückwand24 – Plattengenerator

Umsetzung der technischen Probeaufgabe von R24: ein responsiver Konfigurator für individuelle Rückwandplatten. Mehrere Platten bilden ein gemeinsames Motiv; Größenänderungen und die Plattenreihenfolge werden unmittelbar in der Vorschau dargestellt.

**[Online-Demo öffnen](https://rueckwand24-iota.vercel.app/)**

## Einrichtung und Start

### Voraussetzungen

- **Node.js 24** und **npm**
- Ein moderner Browser
- Internetzugang für die Installation der Abhängigkeiten

Die Anwendung benötigt weder Backend noch Datenbank. Das Standardmotiv liegt lokal im Projekt; zum Start sind keine Zugangsdaten oder Umgebungsvariablen erforderlich.

### Lokal ausführen

1. Repository herunterladen oder die ZIP-Datei entpacken.
2. Im Terminal den Projektordner öffnen, der die Datei `package.json` enthält.
3. Abhängigkeiten installieren und den Entwicklungsserver starten:

```sh
npm ci
npm run dev
```

Anschließend die im Terminal angezeigte Adresse öffnen, normalerweise **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)**. Das Terminal während der Nutzung geöffnet lassen; **Strg+C** beendet den Server. Falls der Port belegt ist, zeigt Vite eine andere Adresse an.

Bei späteren Starts genügt `npm run dev`, solange die Abhängigkeiten bereits installiert sind.

### Fehlerbehebung bei `npm ci` (macOS)

Wenn `npm ci` mit `EACCES: permission denied` oder `EEXIST` unter `~/.npm/_cacache` abbricht, liegt das typischerweise an fehlenden Schreibrechten oder einem Konflikt im lokalen **npm-Cache**. Das ist kein Hinweis auf einen Fehler im Quellcode des Plattengenerators.

1. Node-Version prüfen (für dieses Projekt: **Node.js 24**):

   ```sh
   node -v
   npm -v
   ```

2. Eigentümer des aktuell konfigurierten npm-Caches auf den angemeldeten Benutzer setzen (macOS fragt gegebenenfalls nach dem Benutzerpasswort):

   ```sh
   sudo chown -R "$(id -un)":"$(id -gn)" "$(npm config get cache)"
   ```

3. Cache prüfen und Abhängigkeiten erneut installieren:

   ```sh
   npm cache verify
   npm ci
   npm run dev
   ```

Falls die Installation weiterhin an einer bestehenden Cache-Datei scheitert, stattdessen einen **neuen Cache im Benutzerverzeichnis** verwenden:

```sh
npm ci --cache "$HOME/.npm-r24-cache"
npm run dev
```

Die Meldung `npm warn deprecated whatwg-encoding@3.1.1` ist eine Warnung über eine indirekte Abhängigkeit und verhindert die Installation für sich genommen nicht. **Nicht** `sudo npm ci` oder `npm ci --force` als Workaround ausführen: Das kann weitere Berechtigungsprobleme verursachen bzw. Prüfungen umgehen.

### Produktionsbuild prüfen

```sh
npm run build
npx vite preview
```

`npm run build` führt die TypeScript-Prüfung durch und erstellt den Ordner `dist/`. Der Vorschau-Server ist normalerweise unter **[http://localhost:4173/](http://localhost:4173/)** erreichbar; maßgeblich ist die Terminalausgabe. `dist/` muss über einen Webserver ausgeliefert werden, nicht durch direktes Öffnen der HTML-Datei.

## Funktionsumfang

- **1–10 Platten:** hinzufügen, entfernen, unabhängig skalieren und automatisch neu nummerieren.
- **Maßeingabe:** Breite **20–300 cm**, Höhe **30–128 cm**, jeweils einschließlich der Grenzen.
- **Validierung:** deutsche und englische Dezimaltrennzeichen, verständliche Fehlermeldungen und Wiederherstellung des letzten gültigen Werts beim Verlassen eines ungültigen Felds.
- **Gemeinsame Motivdarstellung:** proportional skalierte, unten ausgerichtete Platten mit durchgehenden Bildkoordinaten und gespiegelter Erweiterung über 300 cm.
- **Speicherung:** gültige Maße, Reihenfolge sowie Einheiten- und Zahlenformatpräferenzen bleiben nach einem Neuladen erhalten.
- **Responsive Bedienung:** Desktop- und Mobilansicht, Tastaturbedienung, sichtbare Fokuszustände und Touch-Alternativen.

Unter **Weitere Optionen** sind alle fünf optionalen Funktionen verfügbar:

| Funktion | Bedienung |
| --- | --- |
| Eigenes Motiv | Über **Motiv hochladen** JPG, PNG oder WebP auswählen; **Standardmotiv** stellt das mitgelieferte Bild wieder her. |
| PNG-Export | **PNG exportieren** lädt die aktuelle Komposition herunter. |
| Reihenfolge | **Reihenfolge ändern** aktivieren, am Griff ziehen oder die Pfeilbuttons verwenden. Am fokussierten Griff funktionieren auch ↑/↓. **Fertig** beendet den Modus. |
| Einheiten und Zahlenformat | Zwischen cm/Inches sowie deutschem und englischem Zahlenformat wechseln. |
| Animationen | Dezente Übergänge beim Hinzufügen, Entfernen, Sortieren und Ändern von Maßen; berücksichtigen die Systemeinstellung für reduzierte Bewegung. |

Bestehende Platten werden beim Bearbeiten hervorgehoben; neue Platten sind sofort aktiv. Das Entfernen der aktiven Platte aktiviert keine andere Platte automatisch.

## Tests und Qualitätssicherung

### Unit- und Komponententests

```sh
npm test
```

### Browsertests mit Playwright

```sh
npx playwright install chromium
npm run test:e2e
```

Die Browsertests starten den Entwicklungsserver bei Bedarf automatisch und verwenden Port **5173**. Sie aktualisieren außerdem die Screenshots im Ordner `screenshots/`.

Falls der Chromium-Installer das Betriebssystem nicht unterstützt, kann ein installiertes Google Chrome verwendet werden. So wurden die Browsertests auf macOS 13 ausgeführt:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

Zuletzt erfolgreich ausgeführt: **44 Unit-/Komponententests**, **9 Browsertests**, TypeScript-Prüfung und Produktionsbuild. Geprüft wurden unter anderem Dezimalformate, Grenzwerte, ungültige Eingaben, Speicherung, Plattenlimits, Motivkontinuität an Spiegelgrenzen, Touch-Bedienung, Upload, Export und Sortierung. Die feste Position der Fehlermeldung am oberen Kartenrand und die Darstellung ohne horizontalen Überlauf werden bei 320, 390, 700 und 1440 px geprüft.

Die Testfälle liegen in `src/` und `tests/`. Die Grenzen der Geräte- und Browserprüfung sind unten dokumentiert.

## Technischer Ansatz

**React + TypeScript**, **Vite**, **CSS Modules**, **Canvas 2D**, **useReducer**, **localStorage**, **Vitest / React Testing Library** und **Playwright**.

| Bereich | Umsetzung |
| --- | --- |
| Zustand | `model.ts`: Platten mit stabilen IDs und Reducer-Aktionen für Größen, Hinzufügen, Entfernen und Reihenfolge. |
| Eingaben | `Dimension.tsx`, `validation.ts`, `units.ts`: separate Bearbeitungstexte, Prüfung, Umrechnung und Formatierung. |
| Speicherung | `persistence.ts`: versioniertes Schema mit Validierung und Rückfall auf eine gültige Startkonfiguration. |
| Vorschau | `geometry.ts`, `renderer.ts`, `Preview.tsx`: gemeinsame Geometrie, Bildausschnitt, Spiegelung und Canvas-Ausgabe. |
| Zusatzfunktionen | `Tools.tsx`, `motion.ts`: Upload, Optionen und Bewegungsübergänge. |

Canvas 2D verwendet für Vorschau und Export dasselbe Darstellungsmodell. Dadurch behalten alle Platten eine gemeinsame Motivskalierung und Positionierung. Ein gemeinsamer Clipping-Pfad begrenzt das Motiv auf die Plattenflächen; maximal zehn Motivsegmente werden gezeichnet. Die Vorschau verwendet einen Canvas in Containergröße, berücksichtigt `devicePixelRatio` und reagiert über `ResizeObserver` auf Größenänderungen.

### Geometrie und Motiv

**1 cm entspricht einem logischen Pixel.** Die gesamte Anordnung wird anschließend gleichmäßig an die verfügbare Bildschirmfläche angepasst. Die Gesamtbreite ist die Summe der Plattenbreiten, die Gesamthöhe die größte Plattenhöhe. Kleinere Platten sind unten ausgerichtet; Trennlinien verbrauchen keine zusätzliche Motivbreite.

Das Motiv wird proportional auf ein **300 cm breites Segment** und die maximale Plattenhöhe skaliert. Überstehende Bildteile werden zentriert beschnitten. Unter 300 cm Gesamtbreite ist der mittlere Ausschnitt sichtbar; darüber folgen abwechselnd horizontal gespiegelte und normale Segmente. Bei 400 cm sind somit das erste 300-cm-Segment und 100 cm seiner gespiegelten Fortsetzung sichtbar. Auch eine Platte, die eine Spiegelgrenze überschreitet, verwendet diese durchgehenden Koordinaten.

## Annahmen und Einschränkungen

- **Startmaße:** Die erste und jede neu hinzugefügte Platte beginnen mit **250 × 128 cm**. Diese Maße wurden aus dem Designbeispiel übernommen.
- **Gestaltung:** Grundlage sind die bereitgestellten Desktop- und Mobil-Screenshots. Direkter Zugriff auf die Figma-Datei war nicht verfügbar; eine Prüfung gegen die ursprünglichen Figma-Ebenen konnte daher nicht erfolgen.
- **Dezimalpräzision:** cm-Eingaben unterstützen zwei, Inch-Eingaben vier Nachkommastellen. Inches werden vor der Bereichsprüfung auf 0,01 cm gerundet. Komma und Punkt sind Dezimaltrennzeichen; Tausendergruppierung wird nicht unterstützt. Einheitenwechsel ohne Bearbeitung verändert die gespeicherten Zentimeterwerte nicht.
- **Ungültige Eingaben:** Während des Tippens erfolgt keine automatische Korrektur oder Begrenzung. Die Vorschau behält die letzte gültige Geometrie; ungültige Bearbeitungstexte werden nicht gespeichert. Beim Verlassen des Felds wird der letzte gültige Wert wiederhergestellt.
- **Browserlokale Speicherung:** Daten bleiben nur im jeweiligen Browser und Ursprung erhalten. Es gibt keine Synchronisierung zwischen Geräten oder Tabs. Beschädigte oder inkompatible gespeicherte Konfigurationen werden durch eine gültige Standardkonfiguration ersetzt; nicht verfügbarer Speicher wird abgefangen.
- **Eigene Motive:** Uploads sind auf JPG, PNG und WebP mit maximal **10 MB / 40 Megapixeln** begrenzt und bleiben **nur bis zum Neuladen** erhalten. Sie werden nicht in localStorage gespeichert.
- **Export:** PNGs werden mit **2 Pixeln pro Zentimeter** ausgegeben, maximal 6000 × 256 px. Freie Flächen über kürzeren Platten bleiben transparent. Der Export ist eine Vorschau und keine druckfertige Produktionsdatei.
- **Externe Bilder:** Das mitgelieferte Standardmotiv funktioniert ohne externen Bildabruf. Ein optional über `VITE_MOTIF_URL` konfigurierter Bildserver muss CORS erlauben.
- **Geräteprüfung:** Die Browserprüfungen wurden mit Chrome und simulierten mobilen Ansichten einschließlich Touch und höherer Pixeldichte durchgeführt. Physische Mobilgeräte, Safari/Firefox und messbare Leistungswerte auf Low-End-Geräten wurden nicht geprüft.

Das vorgegebene Motiv wurde erfolgreich heruntergeladen und liegt unter `public/motif.jpg`. [Originalquelle des Motivs](https://cdn.shopify.com/s/files/1/0514/2511/6352/files/Kuechenrueckwand-Kuechenrueckwand-Gruene-frische-Kraeuter-KR-000018-HB.jpg?v=1695288356).

## Screenshots

Die Bilder zeigen die laufende Anwendung, keine Design-Mockups:

| Ansicht | Screenshot |
| --- | --- |
| Desktop | [Öffnen](screenshots/desktop.png) |
| Mobil | [Öffnen](screenshots/mobile.png) |
| Desktop mit Zusatzoptionen | [Öffnen](screenshots/desktop-options.png) |
| Mobil mit Sortiersteuerung | [Öffnen](screenshots/mobile-options.png) |
| Zehn Platten auf Mobil | [Öffnen](screenshots/mobile-ten-plates.png) |
| Validierung auf Desktop | [Öffnen](screenshots/validation-desktop.png) |
| Validierung auf Mobil | [Öffnen](screenshots/validation-mobile.png) |

## Weitere Unterlagen

- [INSTRUCTIONS.md](INSTRUCTIONS.md): ausführliche Bedienung und Fehlerbehebung.

Die Vercel-Konfiguration steht in `vercel.json`: Installation mit `npm ci`, Build mit `npm run build`, Ausgabeordner `dist/`. Generierte Builds, Abhängigkeiten und lokale Zugangsdaten gehören nicht in das Git-Repository.
