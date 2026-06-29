---
description: Übergib die aktuelle Aufgabe an den besten verfügbaren SailSmart-Agent
---

Der Nutzer möchte die aktuelle Aufgabe an den am besten passenden Agent delegieren.

Wähle automatisch den richtigen Agent basierend auf dem Thema:

| Thema | Agent |
|---|---|
| Zahlen, Kosten, Pricing, Investoren, Break-even | `cfo` |
| Marketing, Kanäle, Content, Community, SEO | `cmo` |
| Strategie, Richtung, Pivot, Business Model | `co-founder` |
| Features, Roadmap, User Stories, Priorisierung | `cpo` |
| Sales, Outreach, Pipeline, B2B-Deals | `cso` |
| Metriken, KPIs, SQL, Datenanalyse | `data-analyst` |
| Operatives, Recherche, E-Mails, Protokolle, Drive | `pa` |
| Code, Architektur, Bugs, Performance | `software-engineer` |
| UX, Interface, Flows, Design-Feedback | `ux-designer` |

Spawne den gewählten Agent mit dem vollständigen Kontext der bisherigen Konversation als Prompt. Teile dem Nutzer kurz mit, an welchen Agent du delegierst und warum. Liefere das Ergebnis des Agents direkt zurück.

Bei Unklarheit (Thema passt zu mehreren Agents): Frage kurz nach oder spawne die zwei wahrscheinlichsten parallel.
