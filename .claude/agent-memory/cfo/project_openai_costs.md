---
name: project-openai-costs
description: OpenAI API Preise 2026 — GPT-4o-mini + text-embedding-3-small, Kostenoptimierung
metadata:
  type: project
---

## Aktuelle Preise (Stand Juni 2026)

| Modell | Input | Output | Notiz |
|---|---|---|---|
| GPT-4o-mini | $0,15/1M Token | $0,60/1M Token | Legacy-Modell, noch aktiv |
| GPT-4.1 Mini (Nachfolger) | $0,40/1M Token | $1,60/1M Token | Empfohlenes aktuelles Mini-Modell |
| text-embedding-3-small | $0,02/1M Token | — | Für RAG-Embeddings |
| Cached Input (GPT-4.1 Mini) | $0,10/1M Token | — | 75% Ersparnis bei stabilem System-Prompt |

## Kostenabschätzung pro User/Monat

Annahme: ~10 Chat-Queries/Monat, je ~1.500 Input + 500 Output Token (inkl. System-Prompt + Context)

Mit GPT-4.1 Mini:
- Input: 10 × 1.500 = 15.000 Token = $0,006
- Output: 10 × 500 = 5.000 Token = $0,008
- Embeddings (nur bei neuen Docs): minimal
- **Total: ~$0,015–0,05/User/Monat** (mit Caching-Optimierung ~$0,01)

Konservative Annahme ohne Optimierung: **€0,05–0,15/User/Monat**

## Optimierungsoptionen

1. Prompt-Caching: 75–90% Ersparnis auf System-Prompt + RAG-Context (stabile Inhalte)
2. Batch-API: 50% Ersparnis für Embedding-Updates
3. Modell-Wahl: GPT-4.1 Mini statt GPT-4o ist bereits günstiger für Chat
4. Query-Limit (Free Tier): 5 Queries/Monat begrenzt API-Kosten für Free-User stark

**Why:** OpenAI-Kosten sind der primäre variable Kostenblock bei Skalierung. Prompt-Caching ist laut Research mit 1-Wochen-Engineering-Aufwand implementierbar und senkt Kosten um eine Größenordnung.

**How to apply:** Variable COGS = €0,10/User/Monat als konservative Basis für Gross-Margin-Berechnung verwenden. Optimierungspotenzial auf €0,02–0,05 kommunizieren.
