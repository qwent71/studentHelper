# Progress

## TASK-005 — DB models & migrations for MVP entities (DONE)

**Date**: 2026-02-20
**Branch**: pdr
**Commit**: e3ea8d3

### What was done
- Added Drizzle schema definitions for 5 new entities from PRD section 5.1:
  - `student_profile` — 1:1 with user, grade level enum (5-11), preferred language, FK to default template
  - `template_preset` — user's response style presets (tone, format, language, length, extra jsonb)
  - `uploaded_document` — user textbook uploads with status tracking (uploaded/processed/failed)
  - `document_chunk` — chunked text from documents for RAG, with embedding_vector placeholder
  - `safety_event` — moderation/guardrail event log (event type, severity)
- 4 new pgEnums: `grade_level`, `document_status`, `safety_event_type`, `safety_severity`
- All tables have proper indexes on user_id and relevant FK columns
- Foreign keys with appropriate cascade rules (cascade delete for user, set null for template)
- Migration generated via CLI (`migrations:generate`) and tested both up and down

### Test results
1. `migrations:up` — applied successfully, all 5 tables created
2. Verified tables, indexes, and foreign keys via psql queries
3. `migrations:down` — rolled back cleanly, all tables and enums dropped
4. Re-applied migration successfully

### Notes for next tasks
- TASK-005 unblocks: TASK-006 (ChatSession/Message domain), TASK-009 (TemplatePreset CRUD), TASK-012 (document uploads), TASK-017 (data isolation), TASK-018 (safety pipeline)
- `embedding_vector` in `document_chunk` is currently `text` — will need pgvector extension when RAG pipeline (TASK-014) is implemented
- The existing `chat`/`message` tables don't yet have `mode`/`status`/`source_type` fields from PRD — those belong to TASK-006
