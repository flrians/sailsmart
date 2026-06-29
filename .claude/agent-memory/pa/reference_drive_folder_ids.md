---
name: reference-drive-folder-ids
description: Google Drive folder IDs for all SailSmart directories — use when creating or filing documents
metadata:
  type: reference
---

SailSmart Google Drive root folder ID: `1RUqmjBXQsI_YbmbAUrEA5S1VNhlczX-Z`

## Top-Level Folders (all children of root)

| Folder | ID |
|--------|-----|
| 01_Finance | `1Qo6KQkGm4eQpgIv-sko45v7xNBdyF9Pg` |
| 02_Strategy | `1BwlQH6MTabYiuFYGh0p4bITPBYAXWxQw` |
| 06_Sales | `1ie7ynf7iQX1K9vxjCvztZNk6RSLmAyhn` |
| 07_Investors | `1SMQEDvuTHpXClbV6_AG37AKwC1bxzdUp` |

## Sub-Folders

| Folder | ID | Parent |
|--------|----|--------|
| 02_Strategy/Competitor Analysis | `1kwiLLRlHZ4QD1ruNaiSYKjfJhOteB0VL` | 02_Strategy |
| 06_Sales/Pitch Decks | `1_s6Xx8JlcmcOw3dKx3tbpreqscv_EvhX` | 06_Sales |
| 06_Sales/pitchdecks  | `1HGdGaCln4V3u_GT_TEXvKanFd3lttY8h` | 06_Sales | (neu angelegt 2026-06-26, enthält Charter B2B Pitch Deck)
| 06_Sales/Pricing & Pakete | `1Ze17_VfdvMKV9mKQxO_LC2wVyherDB_v` | 06_Sales |
| 07_Investors/Pitch Materials | `11krVGW_JiLUk441ypCEWnYht2zYO-2W-` | 07_Investors |

**How to apply:** Use these IDs directly as `parentId` in `mcp__claude_ai_Google_Drive__create_file` calls. No need to search again.

**Note on file creation:** Drive API converts `text/plain` content to Google Docs automatically. For Google Slides with structured content, the API also creates a Google Doc — use the Design Guide (07_Investors/Pitch Materials) to manually build slides in Google Slides from the doc content.
