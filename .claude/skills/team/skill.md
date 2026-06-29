---
description: Spawne mehrere SailSmart-Agents parallel für eine komplexe strategische Frage
---

Der Nutzer möchte mehrere Agents gleichzeitig an einem Problem arbeiten lassen.

Analysiere die Anfrage des Nutzers und entscheide, welche der folgenden Agents relevant sind:
- `cfo` — Finanzen, Pricing, Unit Economics, Kosten
- `cmo` — Marketing, Go-to-Market, Community, Content
- `co-founder` — Strategie, Prioritäten, Pivots, Business Model
- `cpo` — Product, Roadmap, Features, User Stories
- `cso` — Sales, Pipeline, Outreach, B2B-Deals
- `data-analyst` — Metriken, KPIs, SQL, Retention
- `pa` — Operatives, Recherche, Protokolle, Drive
- `software-engineer` — Code, Architektur, Implementation, Tech
- `ux-designer` — UX/UI, Flows, Design-Feedback, Konversion

Spawne **alle relevanten Agents gleichzeitig** (parallel, nicht sequenziell) mit einem klaren, spezifischen Prompt für jeden. Jeder Agent bekommt:
1. Die genaue Aufgabe die seiner Rolle entspricht
2. Den nötigen SailSmart-Kontext für diese Aufgabe
3. Eine klare Erwartung was er zurückliefern soll

Warte bis alle Agents fertig sind, fasse dann die Ergebnisse geordnet zusammen — pro Agent ein Block mit seiner Perspektive.

**Wenn kein Thema angegeben:** Frage kurz nach: "Welches Thema soll das Team angehen?"
