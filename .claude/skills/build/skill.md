---
description: Feature von der Idee bis zur Implementierung — cpo + ux-designer planen, software-engineer setzt um
---

Der Nutzer möchte ein neues Feature für SailSmart entwickeln.

## Schritt 1 — Parallel planen

Spawne **sofort parallel**:

**1. `cpo`** mit diesem Prompt:
> Feature-Planung für SailSmart: [FEATURE-BESCHREIBUNG vom Nutzer]. Schreibe: (1) User Story im Format "Als C50-Eigner möchte ich X, damit Y", (2) Acceptance Criteria (3–5 Punkte), (3) Edge Cases die wir bedenken müssen, (4) Impact/Effort-Einschätzung (Low/Medium/High), (5) Was wir explizit NICHT bauen (Out of Scope). Halte es knapp und implementierungsbereit.

**2. `ux-designer`** mit diesem Prompt:
> UX-Planung für SailSmart: [FEATURE-BESCHREIBUNG vom Nutzer]. Gib: (1) Kritische UX-Fragen die vor der Implementierung geklärt sein müssen, (2) Vorgeschlagener User Flow (Schritt für Schritt), (3) Wie fügt sich das ins bestehende Design System ein (glass-panel, ocean-blue, Outfit Font, CSS Modules), (4) Mobile/Tablet-Überlegungen (Zielgruppe nutzt App im Cockpit), (5) Konkrete CSS-Hinweise oder Komponenten-Vorschläge wenn relevant.

## Schritt 2 — Zusammenfassen und Software Engineer einsetzen

Warte auf beide Ergebnisse. Fasse sie zu einem klaren **Feature Brief** zusammen:

```
## Feature Brief: [Name]

### User Story
[aus cpo]

### Acceptance Criteria
[aus cpo]

### UX Flow
[aus ux-designer]

### Out of Scope
[aus cpo]

### CSS / Design Notes
[aus ux-designer]
```

**Frage dann:** "Soll ich jetzt mit der Implementierung anfangen?" — wenn ja, spawne `software-engineer` mit dem vollständigen Feature Brief als Kontext und dem Auftrag, das Feature zu implementieren.

## Wenn kein Feature angegeben

Frage kurz: "Was soll gebaut werden?"
