# Energiekuchen - Produktspezifikation

## Projektübersicht

**Projektname:** Energiekuchen  
**Zielgruppe:** Deutschsprachige Nutzer, die ihre Energieverteilung im Alltag visualisieren und optimieren möchten  
**Domain:** energiekuchen.de

## Executive Summary

Energiekuchen ist eine webbasierte Anwendung, die als visuelles Coaching-Tool dient, um Nutzern dabei zu helfen, ihren aktuellen Energiezustand (Ist-Zustand) mit ihrem gewünschten Energiezustand (Wunsch-Zustand) zu vergleichen. Durch die Erstellung von zwei Kreisdiagrammen können Nutzer Aktivitäten visualisieren, die entweder Energie geben (positiv) oder nehmen (negativ), wodurch Ungleichgewichte identifiziert und Verbesserungen geplant werden können.

## Technische Spezifikationen

### Tech Stack

- **Frontend Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Rendering:** Client-side rendering (CSR) - keine Server-side Rendering oder Backend-Komponenten
- **Charts:** Chart.js für Kreisdiagramm-Visualisierung
- **Drag & Drop:** dnd-kit für Aktivitäten-Neuanordnung
- **State Management:** React useState/useReducer
- **Persistierung:** Browser localStorage für lokale Datenspeicherung
- **Sharing:** URL-basierte Datenübertragung mit Base64-encoded JSON im Fragment
- **Sprache:** Deutsch (einzige unterstützte Sprache)

### Browser-Unterstützung

Die Diagramm-Farben nutzen die relative CSS-Farbsyntax (`oklch(from …)`), die erst ab Baseline 2024 verfügbar ist:

- Chrome 119+
- Firefox 128+
- Safari 16.4+
- Edge 119+

## Funktionale Anforderungen

### 1. Energiekuchen-Erstellung

#### 1.1 Dual-Chart System

- **Ist-Zustand:** Visualisiert die aktuelle Energiebilanz
  - Gemischte Farbpalette (grün für energiegebende, rot für energiezehrende Aktivitäten)
  - Symbol: 📍
  - Enthält sowohl positive als auch negative Aktivitäten
- **Wunsch-Zustand:** Visualisiert die gewünschte Energiebilanz
  - Gemischte Farbpalette (grün für energiegebende, rot für energiezehrende Aktivitäten)
  - Symbol: 🎯
  - Enthält sowohl positive als auch negative Aktivitäten

#### 1.2 Aktivitäten-Management

- **Hinzufügen von Aktivitäten:**
  - Eingabefeld für Aktivitätsname (max. 50 Zeichen)
  - Slider für Energielevel (-5 bis +5, 0 nicht erlaubt)
    - Negative Werte (-5 bis -1): Energiezehrend (rot)
    - Positive Werte (+1 bis +5): Energiegebend (grün)
  - Bestätigungsbutton
- **Bearbeiten von Aktivitäten:**
  - Klick auf Aktivität öffnet Bearbeitungsmodus
  - Modal-Dialog mit Eingabefeldern für Name, Details (optional) und Energielevel
  - Details-Feld: Optionales Textfeld (max. 150 Zeichen, mehrzeilig)
  - Speichern/Abbrechen-Buttons
- **Löschen von Aktivitäten:**
  - Löschen-Button mit Bestätigungsdialog
  - Drag-to-delete Funktionalität
- **Neu anordnen von Aktivitäten:**
  - Drag-and-Drop zum Umordnen von Aktivitäten in der Liste
  - Visuelles Feedback während des Ziehens (Transparenz, Schatten)
  - Reihenfolge wird im Diagramm übernommen

#### 1.3 Anpassungsoptionen

- **Segment-Größe:** Benutzer können das Energielevel jeder Aktivität anpassen (-5 bis +5, ohne 0)
  - Die Größe basiert auf dem Absolutwert des Energielevels
  - Die Farbe basiert auf dem Vorzeichen (positiv = grün, negativ = rot)
- **Farbschema:** Vordefinierte Farbpaletten für bessere Visualisierung

### 2. Datenmanagement

#### 2.1 Lokale Speicherung

- Automatisches Speichern in localStorage nach jeder Änderung
- Speicherung als JSON-Objekt mit Struktur:

```json
{
  "version": "2.0",
  "current": {
    "activities": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Sport",
        "value": 3,
        "details": "Jeden Tag 30 Minuten joggen"
      },
      {
        "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "name": "Überstunden",
        "value": -4
      }
    ]
  },
  "desired": {
    "activities": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "name": "Sport",
        "value": 5,
        "details": "Morgens joggen\nAbends Yoga"
      },
      {
        "id": "8d8aa007-8df6-4f0f-b0e1-c7d5f3b8c9e2",
        "name": "Überstunden",
        "value": -1
      }
    ]
  }
}
```

#### 2.2 Import/Export/Löschen

- **Import:** Upload von JSON-Datei mit Validierung oder JSON-Text einfügen
- **Export:** Download als JSON-Datei (über Teilen-Modal verfügbar)
- **Löschen:** Alle Daten zurücksetzen mit Bestätigung

### 3. Sharing-Funktionalität

#### 3.1 URL-basiertes Teilen

- Generierung einer einzigartigen URL mit Base64-encoded Daten im URL-Fragment
- Format: `energiekuchen.de/share/#{base64EncodedData}`
- Daten werden im Fragment gespeichert für erhöhte Privatsphäre (nicht an Server gesendet)
- Maximale URL-Länge beachten (2048 Zeichen)
- Komprimierung der Daten falls notwendig

#### 3.2 Share-Optionen

- **Kopieren-Button:** URL in Zwischenablage kopieren
- **Social Media:** Vorgefertigte Texte für WhatsApp und E-Mail
- **Export-Funktion:** JSON-Datei Download im gleichen Modal

#### 3.3 Fehlerbehandlung

- **Ungültige Daten:** Zeigt Fehlermeldung mit Verweis auf Fehlerbehebung
- **Fehlende Daten:** Zeigt freundliche Meldung, dass kein Energiekuchen vorhanden ist
- **Rückführung:** Button zur Erstellung eines eigenen Energiekuchens

### 4. Benutzeroberfläche

#### 4.1 Layout

- **Header:**
  - Logo/Titel "Energiekuchen"
  - Navigation (Importieren, Teilen, Löschen)
- **Hauptbereich:**
  - Side-by-side Anordnung der beiden Kreisdiagramme (Desktop)
  - Gestapelte Anordnung (Mobile)
- **ActivityList:**
  - Aktivitätenliste unter jedem Diagramm
  - Aktivität hinzufügen

#### 4.2 Responsive Design

- **Large (1280px+):** Zwei-Spalten-Layout
- **Medium (640px-1279px):** Gestapeltes Layout mit größeren Touch-Targets
- **Small (Below 640px):** Single-Column mit Touch-optimierten Elementen

#### 4.3 Farbschema

Alle Farben folgen dem Tailwind CSS 4 Standard mit oklch-Farbformat (siehe `docs/color-palette.md`):

- **Primär:** Yellow-400/500 - Energiegelb für Buttons und Akzente
- **Sekundär:** Gray-Palette - Neutrale Grautöne für UI-Elemente
  - Text: gray-900 (primär), gray-700 (sekundär), gray-500 (tertiär)
  - Buttons: gray-200/300 für sekundäre Aktionen
- **Hintergrund:**
  - gray-50 für Seitenhintergrund
  - Weiß (#fff) für Content-Bereiche, Karten und Modals
- **Positiv (Energiegebend):** Grüntöne, abgestuft nach Gewichtungsrang innerhalb der Polarität (größter Anteil am dunkelsten)
  - Band von green-200 (hell) bis green-800 (dunkel), Mittelpunkt green-500 `oklch(0.723 0.219 149.579)`
  - Das Band weitet sich mit der Anzahl der Aktivitäten: wenige bleiben nahe green-500, erst ein voller Chart erreicht die Extreme
- **Negativ (Energiezehrend):** Rottöne, abgestuft nach Gewichtungsrang innerhalb der Polarität (größter Anteil am dunkelsten)
  - Band von red-200 (hell) bis red-800 (dunkel), Mittelpunkt red-500 `oklch(0.637 0.237 25.331)`
  - Zusätzlich red-500/600 für Lösch-Buttons und Fehlermeldungen

### 5. Interaktivität

#### 5.1 Chart-Interaktionen

- **Hover-Effekte:** Highlight von Segmenten
- **Click-Events:** Auswahl und Bearbeitung von Aktivitäten
- **Animations:** Smooth transitions bei Änderungen

#### 5.2 Drag & Drop

- Neuanordnung von Aktivitäten

## Nicht-funktionale Anforderungen

### 1. Usability

- **Deutsche Sprache:** Alle Texte, Labels und Nachrichten auf Deutsch
- **Intuitive Bedienung:** Selbsterklärende Icons und Buttons
- **Keyboard Navigation:** Vollständige Tastaturzugänglichkeit
- **Touch-optimiert:** Große Touch-Targets (min. 44px)

### 2. Accessibility (WCAG 2.1 AA)

- **Screen Reader:** Vollständige ARIA-Labels
- **Kontrast:** Mindestens 4.5:1 Verhältnis
- **Fokus-Management:** Sichtbare Fokus-Indikatoren
- **Alt-Texte:** Für alle visuellen Elemente

### 3. Security & Privacy

- **Keine Server-Kommunikation:** Alle Daten bleiben lokal
- **XSS-Schutz:** Input-Sanitization
- **URL-Sicherheit:** Validation von geteilten Daten
- **Fragment-basiertes Sharing:** Geteilte Daten werden nie an Server übertragen

## User Stories

### Hauptfunktionen

1. **Als Nutzer möchte ich meinen Ist-Zustand visualisieren, um meine aktuelle Energiebilanz zu verstehen.**
2. **Als Nutzer möchte ich meinen Wunsch-Zustand erstellen, um mein Energieziel zu definieren.**
3. **Als Nutzer möchte ich Aktivitäten mit positiven und negativen Energiewerten hinzufügen, bearbeiten und löschen können.**
4. **Als Nutzer möchte ich die Energiewerte der Aktivitäten anpassen können (-5 bis +5), um deren Einfluss zu reflektieren.**
5. **Als Nutzer möchte ich meine Energiekuchen speichern und später wieder öffnen können.**
6. **Als Nutzer möchte ich meine Energiekuchen mit anderen teilen können.**
7. **Als Nutzer möchte ich meine Daten exportieren und importieren können.**
8. **Als Nutzer möchte ich eine mobile-optimierte Ansicht haben.**
9. **Als Nutzer möchte ich sowohl energiegebende als auch energiezehrende Aktivitäten in einem Chart sehen können.**

## Wireframes & UI-Komponenten

### Hauptkomponenten

1. **EnergyChart:** Kreisdiagramm-Komponente für Visualisierung
2. **ChartLegend:** Legende mit Farbzuordnung für Energielevel
3. **ActivityList:** Liste der Aktivitäten mit Drag-and-Drop
4. **SortableActivityItem:** Einzelne Aktivität mit Bearbeitungs- und Löschfunktion
5. **AddActivity:** Komponente zum Hinzufügen neuer Aktivitäten
6. **Header:** Navigation mit Logo und Hauptaktionen
7. **Footer:** Footer mit Links zu Impressum und Datenschutz

### Modal-Komponenten

1. **ShareModal:** Teilen-Funktionalität mit URL-Generierung und Export
2. **ImportModal:** Import von JSON-Daten
3. **EditActivityModal:** Bearbeiten bestehender Aktivitäten
4. **DeleteActivityModal:** Bestätigung beim Löschen einzelner Aktivitäten
5. **DeleteModal:** Bestätigung beim Löschen aller Daten

### State Management

1. **EnergyContext:** Verwaltung der Aktivitätsdaten und localStorage-Synchronisation
2. **UIContext:** Verwaltung des UI-Zustands (Modals, aktuelle Bearbeitung)

### Seiten-Struktur

- **/** - Hauptanwendung
- **/share/** - Geteilte Energiekuchen (liest Daten aus URL-Fragment)
- **/datenschutz** - Datenschutzerklärung
- **/impressum** - Impressum

## Technische Implementation

### Datenstruktur

```typescript
interface Activity {
  id: string; // UUID v4
  name: string;
  value: number; // -5 to +5 (excluding 0) - Energielevel
  details?: string; // Optional details text (max 150 chars, supports multi-line)
}

interface EnergyChart {
  activities: Activity[];
}

interface EnergyPie {
  version: string;
  current: EnergyChart; // Ist-Zustand
  desired: EnergyChart; // Wunsch-Zustand
}
```

### Ordnerstruktur

```
/app
  /components
    /charts       # Chart-Visualisierungskomponenten
    /features     # Feature-spezifische Komponenten (Modals, Listen)
    /layout       # Layout-Komponenten (Header, Footer)
    /ui           # Basis UI-Komponenten (Button, Input, Modal, etc.)
  /lib
    /contexts     # React Context für State Management
    /hooks        # Custom React Hooks
    /utils        # Utility-Funktionen inkl. storage.ts und sharing.ts
  /types          # TypeScript-Definitionen
  /datenschutz    # Datenschutz-Seite
  /impressum      # Impressum-Seite
  /share          # Statische Sharing-Seite (Fragment-basiert)
  page.tsx        # Hauptanwendung (Dashboard)
  layout.tsx      # Root-Layout
```

## Testing-Strategie

### Unit Tests

- Utility-Funktionen (Storage, Sharing)
- Komponenten-Logic (Activity CRUD)
- Data Validation

### Integration Tests

- Chart-Updates bei Datenänderungen
- localStorage-Persistierung
- URL-Sharing Workflow

### E2E Tests

- Kompletter User Journey
- Responsive Breakpoints
- Accessibility Testing

## Deployment & Hosting

### Produktionsumgebung

- **Hosting:** GitHub Pages
- **Domain:** energiekuchen.de
- **DNS:** Cloudflare

## Risiken & Mitigation

### Technische Risiken

1. **Browser-Kompatibilität:** Polyfills und progressive Enhancement
2. **URL-Länge:** Datenkomprimierung und Fallback-Lösungen
3. **Performance:** Code-Splitting und Lazy Loading

### UX-Risiken

1. **Komplexität:** Schrittweise Einführung von Features
2. **Mobile Usability:** Extensive Testing auf verschiedenen Geräten
3. **Accessibility:** Regelmäßige Audits und Tests mit Screen Readern
