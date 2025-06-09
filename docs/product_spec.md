# Energiekuchen - Produktspezifikation

## Projektübersicht

**Projektname:** Energiekuchen  
**Zielgruppe:** Deutschsprachige Nutzer, die ihre Energieverteilung im Alltag visualisieren und optimieren möchten  
**Domain:** energiekuchen.de

## Executive Summary

Energiekuchen ist eine webbasierte Anwendung, die als visuelles Coaching-Tool dient, um Nutzern dabei zu helfen, ihre Energiequellen und -verbraucher im täglichen Leben zu bewerten und auszubalancieren. Durch die Erstellung von Kreisdiagrammen können Nutzer Aktivitäten visualisieren, die entweder Energie verbrauchen oder wieder auffüllen, wodurch Ungleichgewichte identifiziert und Verbesserungen geplant werden können.

## Technische Spezifikationen

### Tech Stack

- **Frontend Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Rendering:** Client-side rendering (CSR) - keine Server-side Rendering oder Backend-Komponenten
- **Charts:** Chart.js für Kreisdiagramm-Visualisierung
- **State Management:** React useState/useReducer
- **Persistierung:** Browser localStorage für lokale Datenspeicherung
- **Sharing:** URL-basierte Datenübertragung mit Base64-encoded JSON
- **Sprache:** Deutsch (einzige unterstützte Sprache)

### Browser-Unterstützung

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Funktionale Anforderungen

### 1. Energiekuchen-Erstellung

#### 1.1 Dual-Chart System

- **Positiver Energiekuchen:** Visualisiert energiegebende Aktivitäten
  - Grüne Farbpalette
  - Symbol: ⚡ oder ☀️
- **Negativer Energiekuchen:** Visualisiert energiezehrende Aktivitäten
  - Rote/Orange Farbpalette
  - Symbol: 🔋 oder ⚠️

#### 1.2 Aktivitäten-Management

- **Hinzufügen von Aktivitäten:**
  - Eingabefeld für Aktivitätsname (max. 50 Zeichen)
  - Slider oder Eingabefeld für Energielevel (1-9)
  - Bestätigungsbutton
- **Bearbeiten von Aktivitäten:**
  - Klick auf Aktivität öffnet Bearbeitungsmodus
  - Inline-Editing oder Modal-Dialog
  - Speichern/Abbrechen-Buttons
- **Löschen von Aktivitäten:**
  - Löschen-Button mit Bestätigungsdialog
  - Drag-to-delete Funktionalität

#### 1.3 Anpassungsoptionen

- **Segment-Größe:** Benutzer können das Energielevel jeder Aktivität anpassen (1-9)
- **Farbschema:** Vordefinierte Farbpaletten für bessere Visualisierung

### 2. Datenmanagement

#### 2.1 Lokale Speicherung

- Automatisches Speichern in localStorage nach jeder Änderung
- Speicherung als JSON-Objekt mit Struktur:

```json
{
  "version": "1.0",
  "lastModified": "2025-05-24T10:30:00Z",
  "positive": {
    "activities": [
      {
        "id": "uuid",
        "name": "Sport",
        "value": 3
      }
    ]
  },
  "negative": {
    "activities": [
      {
        "id": "uuid",
        "name": "Überstunden",
        "value": 5
      }
    ]
  }
}
```

#### 2.2 Import/Export

- **Export:** Download als JSON-Datei
- **Import:** Upload von JSON-Datei mit Validierung
- **Reset:** Komplett zurücksetzen mit Bestätigung

### 3. Sharing-Funktionalität

#### 3.1 URL-basiertes Teilen

- Generierung einer einzigartigen URL mit Base64-encoded Daten
- Format: `energiekuchen.de/share/{base64EncodedData}`
- Maximale URL-Länge beachten (2048 Zeichen)
- Komprimierung der Daten falls notwendig

#### 3.2 Share-Optionen

- **Kopieren-Button:** URL in Zwischenablage kopieren
- **QR-Code:** Generierung für mobile Geräte
- **Social Media:** Vorgefertigte Texte für WhatsApp, E-Mail, etc.

### 4. Benutzeroberfläche

#### 4.1 Layout

- **Header:**
  - Logo/Titel "Energiekuchen"
  - Navigation (Neu, Laden, Teilen)
- **Hauptbereich:**
  - Side-by-side Anordnung der beiden Kreisdiagramme (Desktop)
  - Gestapelte Anordnung (Mobile)
  - Aktivitätenliste unter jedem Diagramm
- **Sidebar/Panel:**
  - Aktivität hinzufügen
  - Export/Import

#### 4.2 Responsive Design

- **Large (1280px+):** Zwei-Spalten-Layout
- **Medium (640px-1279px):** Gestapeltes Layout mit größeren Touch-Targets
- **Small (Below 640px):** Single-Column mit Touch-optimierten Elementen

#### 4.3 Farbschema

- **Primär:** Energiegelb (#FCD34D)
- **Sekundär:** Neutralgrau (#6B7280)
- **Positiv:** Grüntöne (#10B981, #34D399, #6EE7B7)
- **Negativ:** Rottöne (#EF4444, #F87171, #FCA5A5)
- **Hintergrund:** Hellgrau (#F9FAFB)

### 5. Interaktivität

#### 5.1 Chart-Interaktionen

- **Hover-Effekte:** Highlight von Segmenten
- **Click-Events:** Auswahl und Bearbeitung von Aktivitäten
- **Tooltips:** Anzeige von Aktivitätsname und Energiewert
- **Animations:** Smooth transitions bei Änderungen

#### 5.2 Drag & Drop

- Neuanordnung von Aktivitäten
- Verschieben zwischen positivem und negativem Chart

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

## User Stories

### Hauptfunktionen

1. **Als Nutzer möchte ich einen positiven Energiekuchen erstellen, um meine energiegebenden Aktivitäten zu visualisieren.**
2. **Als Nutzer möchte ich einen negativen Energiekuchen erstellen, um meine energiezehrenden Aktivitäten zu identifizieren.**
3. **Als Nutzer möchte ich Aktivitäten hinzufügen, bearbeiten und löschen können.**
4. **Als Nutzer möchte ich die Größe der Segmente anpassen können, um die relative Wichtigkeit zu reflektieren.**
5. **Als Nutzer möchte ich meine Energiekuchen speichern und später wieder öffnen können.**
6. **Als Nutzer möchte ich meine Energiekuchen mit anderen teilen können.**

### Erweiterte Funktionen

7. **Als Nutzer möchte ich verschiedene Farbschemata wählen können.**
8. **Als Nutzer möchte ich meine Daten exportieren und importieren können.**
9. **Als Nutzer möchte ich eine mobile-optimierte Ansicht haben.**
10. **Als Nutzer möchte ich Tooltips zur Bedienung erhalten.**

## Wireframes & UI-Komponenten

### Hauptkomponenten

1. **EnergyChart:** Kreisdiagramm-Komponente
2. **ActivityList:** Liste der Aktivitäten mit Edit/Delete
3. **ActivityForm:** Formular zum Hinzufügen/Bearbeiten
4. **ShareModal:** Modal für Sharing-Optionen
5. **Header:** Navigation und Aktionen
6. **Sidebar:** Schnellzugriff auf Funktionen

### Seiten-Struktur

- **/** - Hauptanwendung
- **/share/[data]** - Geteilte Energiekuchen
- **/datenschutz** - Datenschutzerklärung
- **/impressum** - Impressum

## Technische Implementation

### Datenstruktur

```typescript
interface Activity {
  id: string;
  name: string;
  value: number; // 1-9 (Energielevel)
}

interface EnergyChart {
  activities: Activity[];
}

interface EnergyKuchen {
  version: string;
  lastModified: string;
  positive: EnergyChart;
  negative: EnergyChart;
}
```

### Key Libraries

- **Chart.js** für Kreisdiagramme
- **react-hot-toast** für Notifications
- **qrcode** für QR-Code-Generierung

### Ordnerstruktur

```
/app
  /components
    /ui           # Basis UI-Komponenten
    /charts       # Chart-Komponenten
    /forms        # Formular-Komponenten
  /lib
    /utils        # Utility-Funktionen
    /storage      # localStorage-Management
    /sharing      # URL-Encoding/Decoding
  /types          # TypeScript-Definitionen
  /(main)         # Hauptseiten
  /share/[data]   # Sharing-Route
```

## Testing-Strategie

### Unit Tests

- Utility-Funktionen (Storage, Sharing, Calculations)
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

- **Hosting:** Vercel
- **Domain:** energiekuchen.de

## Risiken & Mitigation

### Technische Risiken

1. **Browser-Kompatibilität:** Polyfills und progressive Enhancement
2. **URL-Länge:** Datenkomprimierung und Fallback-Lösungen
3. **Performance:** Code-Splitting und Lazy Loading

### UX-Risiken

1. **Komplexität:** Schrittweise Einführung von Features
2. **Mobile Usability:** Extensive Testing auf verschiedenen Geräten
3. **Accessibility:** Regelmäßige Audits und Tests mit Screen Readern
