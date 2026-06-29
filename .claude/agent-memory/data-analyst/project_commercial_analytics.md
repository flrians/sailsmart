---
name: commercial-charter-analytics
description: Commercial Charter Analytics Dashboard — anonyme Gast-Chats via QR-Code pro Boot, kein Auth, KPIs und Event-Schema für Charter-Operators
metadata:
  type: project
---

SailSmart baut ein Analytics Dashboard exklusiv für Commercial Accounts (Chartergesellschaften).

**Setup:** Pro Boot ein QR-Code mit `qr_token`. Gäste scannen, chatten anonym (kein Auth). Charter-Operator sieht Aggregat-Analytics pro Boot-Flotte.

**Key Design Decision:** Session-Start = QR-Scan (kein Login), daher ist `qr_token` der primäre Gruppen-Schlüssel.

**Topic-Klassifikation:** Entschieden für AI-Classification beim Speichern (nicht Keyword-Matching, nicht Embedding-Clustering) — pragmatischster MVP-Ansatz mit guter Qualität.

**Why:** Charter-Operators wollen verstehen, welche Fragen Gäste stellen (Produktverbesserung, Boarding-Unterlagen), wann Boote am meisten genutzt werden (Staffing), und ob der AI-Assistent Wert liefert (Retention-Argument für SailSmart).

**How to apply:** Schema-Empfehlungen müssen anonym bleiben (kein personenbezogenes Tracking). Topic-Labels in einem festen Enum halten damit SQL-Aggregationen funktionieren.
