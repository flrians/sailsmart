---
name: project-mvp-tech-stack
description: SailSmart MVP technischer Stand — RAG-Pipeline, Manuale, Datenbankschema, Multi-Boat-Architektur
metadata:
  type: project
---

Stand: 2026-06-25

**RAG-Pipeline:**
- GPT-4o-mini (Chat), text-embedding-3-small 1536-dim (Embeddings)
- Supabase pgvector: match_manual_chunks RPC, top 15 Chunks, Threshold 0.2
- System-Prompt: boat_type-aware, engine_model-aware, Strict Citation Rules (Page X — filename.pdf)
- Vercel AI SDK (streaming), maxDuration: 30s

**Embedded Manuale (Bavaria C50):**
- Owners_Manual_Bavaria_C50.pdf
- C50_Interieur_Exterieur_Configurations.pdf
- Engine_YARMEE_Operation_Manual.pdf
- Engine_Information_Sheet_YARMEE_4JH_Series_80_110.pdf

**Datenbankschema (relevant):**
- profiles: boat_type_id, configuration (Kabinen-Variante), engine_model
- boat_types: id, name, engine_model, available (Bool)
- manuals: id, filename
- manual_boat_types: Junction-Table (Multi-Boat-Unterstützung bereits angelegt)
- manual_chunks: pgvector Embeddings

**Multi-Tenant-Architektur:** Bereits vorbereitet — manual_boat_types Junction-Table erlaubt mehrere Bootmodelle. Chat-Route prüft bereits ob Manuale für boat_type_id existieren und gibt saubere Fallback-Message.

**Config-Viewer:**
- 11 Bavaria C50 Kabinen-Varianten (3/4/5/6-Cabin-Kombinationen über A1/A2 x B1/B2 x C1 x D1/D2/D3 x E2)
- PNG-Rotation-Trick: 2410×908 Landscape → Portrait via CSS (width: 265.6%, rotate(-90deg))
- Served via Route Handler aus Manuals/ Ordner (nicht public/)

**Why:** Multi-Boat-Architektur war bewusste Entscheidung für Skalierung — technische Schulden für Expansion sind minimal.
