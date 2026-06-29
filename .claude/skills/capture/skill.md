---
description: Schnelle operative Erfassung via PA — Notiz, Entscheidung, Protokoll oder Aufgabe sofort in Google Drive ablegen
---

Der Nutzer möchte etwas schnell festhalten und/oder in Google Drive ablegen.

Spawne sofort den **`pa`** Agent mit folgendem Prompt:

> Florian möchte folgendes erfassen und ablegen: "[INHALT vom Nutzer]"
>
> Deine Aufgabe:
> 1. Identifiziere den Typ (Entscheidung · Protokoll · Notiz · Todo-Liste · Rechercheergebnis · E-Mail-Entwurf · anderes)
> 2. Formatiere den Inhalt passend (Markdown, strukturiert, mit Datum 2026-XX-XX)
> 3. Bestimme den richtigen Drive-Ordner:
>    - Protokoll/Meeting → `08_Operations/Meetings & Protokolle`
>    - Entscheidung/Strategie → `02_Strategy`
>    - Finanzen → `01_Finance`
>    - Product/Feature → `03_Product`
>    - Sales/CRM → `06_Sales`
>    - Investor → `07_Investors`
>    - Operations/Prozess → `08_Operations`
> 4. Lege das Dokument via Google Drive Tool an
> 5. Bestätige kurz: Was wurde wo abgelegt

Liefere das formatierte Dokument zurück damit Florian es bestätigen kann, bevor es abgelegt wird — außer er hat explizit "sofort" oder "direkt" gesagt.

## Wenn kein Inhalt angegeben

Frage kurz: "Was soll ich festhalten?"
