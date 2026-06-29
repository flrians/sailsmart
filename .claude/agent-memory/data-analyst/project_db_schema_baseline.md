---
name: db-schema-baseline
description: Bestehendes Supabase-Schema hat kein Chat-Logging — alle Chat-Analytics-Tabellen müssen neu erstellt werden
metadata:
  type: project
---

Stand 2026-06-29: `scripts/schema.sql` enthält nur:
- `boat_types`, `profiles`, `manuals`, `manual_boat_types`, `manual_chunks` (vector 1536-dim)
- RPC `match_manual_chunks` für RAG-Suche

Kein Chat-Logging, keine Sessions-Tabelle, kein Event-Tracking.

**Why:** Chat-Logs wurden nie persistiert — die App war bisher nur für registrierte Eigner (B2C), nicht für anonyme Charter-Gäste.

**How to apply:** Jede Analytics-Empfehlung muss davon ausgehen, dass die Logging-Infrastruktur noch nicht existiert und komplett neu gebaut wird. Schema-Änderungen zu `scripts/schema.sql` hinzufügen.
