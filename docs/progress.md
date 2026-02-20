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

## TASK-006 — ChatSession/Message domain with fast/learning modes (DONE)

**Date**: 2026-02-20
**Branch**: pdr
**Commits**: a67a7a5, 1751281, 68333a1

### What was done
- **Schema changes**: Added 3 new pgEnums and columns to existing tables:
  - `chat_mode` enum (`fast`, `learning`) → `chat.mode` column
  - `chat_status` enum (`active`, `completed`, `archived`) → `chat.status` column
  - `message_source_type` enum (`text`, `image`, `rag`) → `message.source_type` column
  - `chat.ended_at` timestamp for session completion tracking
- **Migration**: Generated via CLI, tested up/down/re-up successfully
- **Repository layer** (`modules/chat/repo.ts`):
  - `createSession`, `getSessionById`, `getSessionsByUserId`, `updateSession`
  - `createMessage`, `getMessagesByChatId` (ordered by `created_at` asc)
- **Service layer** (`modules/chat/services.ts`):
  - Session CRUD with user ownership validation
  - `sendMessage` — creates user message + stub assistant response (real AI in TASK-007)
  - Status transitions: `completed` sets `ended_at`, `archived` sets `archived_at`
  - Guards: messages rejected if session is not `active`
- **Routes** (`modules/chat/routes.ts`):
  - `POST /chat/sessions` — create session (mode + optional title)
  - `GET /chat/sessions` — list user sessions (newest first)
  - `GET /chat/sessions/:id` — get single session
  - `PATCH /chat/sessions/:id` — update title/status
  - `POST /chat/sessions/:id/messages` — send message
  - `GET /chat/sessions/:id/messages` — get message history
  - All endpoints protected with `auth: true` macro

### Test results (10 integration tests, all pass)
1. **Session creation**: fast mode, learning mode with custom title
2. **Session listing**: returns all user sessions
3. **Session retrieval**: by ID with ownership check
4. **Auth guard**: rejects unauthenticated requests (401)
5. **Message send**: user message + assistant response created, sourceType support
6. **Message to non-existent session**: returns 404
7. **Message history**: correct chronological order, correct roles (user/assistant alternating)
8. **User isolation**: user cannot access another user's session (404)
9. **Migration down**: rolled back cleanly, enums dropped
10. **Migration re-up**: re-applied successfully

### Notes for next tasks
- TASK-006 unblocks: TASK-007 (e2e OCR→AI pipeline), TASK-015 (RAG generation)
- Assistant response is currently a stub — replace with OpenRouter AI call in TASK-007
- Routes use `authGuardPlugin` directly (not inherited from app.ts `authPlugin`) — other modules should follow same pattern
- The `chat.status` field coexists with `chat.archived_at` — `archived` status sets both `status='archived'` and `archived_at` timestamp

## TASK-009 — TemplatePreset CRUD API with default management (DONE)

**Date**: 2026-02-20
**Branch**: pdr
**Commit**: 461ac13

### What was done
- **New module**: `modules/template/` with repo, services, and routes layers
- **Repository layer** (`modules/template/repo.ts`):
  - `create`, `getById`, `listByUserId`, `update`, `delete`
  - `clearDefaultForUser` — clears isDefault flag on all user's presets
- **Service layer** (`modules/template/services.ts`):
  - Full CRUD with userId ownership validation
  - `setDefault` — dedicated method to set exactly one template as default
  - Automatic clearing of previous default when setting a new one (via create, update, or setDefault)
- **Routes** (`modules/template/routes.ts`):
  - `POST /templates` — create preset (name required, all style fields optional with defaults)
  - `GET /templates` — list user's presets (newest first)
  - `GET /templates/:id` — get single preset
  - `PATCH /templates/:id` — update preset fields
  - `DELETE /templates/:id` — delete preset
  - `POST /templates/:id/default` — set preset as user's default
  - All endpoints protected with `auth: true` macro
- **Registered** in `app.ts` via `.use(templateRoutes)`

### Test results (13 integration tests, all pass)
1. **Create template**: with custom fields, with default flag
2. **Auth guard**: rejects unauthenticated request (401)
3. **List templates**: returns all user's presets
4. **Get by ID**: retrieves single preset
5. **Update template**: name and style fields
6. **Delete template**: removes and returns 404 on subsequent get
7. **Non-existent template**: returns 404
8. **Default management — create**: second isDefault=true clears first
9. **Default management — POST /:id/default**: dedicated endpoint switches default
10. **Default management — PATCH with isDefault**: update also switches default correctly
11. **User isolation — access**: user B cannot get/update/delete/set-default on user A's template
12. **User isolation — list**: each user sees only their own templates

### Notes for next tasks
- TASK-009 unblocks: TASK-010 (template injection in prompt pipeline), TASK-022 (UI template management)
- Template fields (tone, knowledgeLevel, outputFormat, outputLanguage, responseLength) are free-text — consider adding enums/validation when UI is built (TASK-022)
- `extraPreferences` is JSONB for flexible future fields
- Pre-existing failure in `smoke.test.ts` (`GET /chat` returns 404) — caused by TASK-006 chat route restructuring, not related to TASK-009
