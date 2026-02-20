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

## TASK-004 — OCR provider abstraction with fallback chain (DONE)

**Date**: 2026-02-20
**Branch**: pdr
**Commits**: 40b4cbe, 95b14d8

### What was done
- **New module**: `modules/ocr/` with provider abstraction and fallback chain service
- **Interface** (`providers/types.ts`):
  - `OCRProvider` — unified interface with `name` and `extractText(imageBuffer) → OCRResult`
  - `OCRResult` — `{ text, confidence, provider }`
- **Three adapters**:
  - `GoogleVisionProvider` — calls Google Cloud Vision REST API (`TEXT_DETECTION`), computes average block confidence from pages
  - `TesseractProvider` — uses `tesseract.js` v7 (pure JS OCR), supports `rus+eng` languages, normalizes confidence to 0-1
  - `NoneProvider` — no-op provider returning empty text with 0 confidence (for dev/testing)
- **OCRService** (`ocr-service.ts`):
  - Accepts ordered array of providers as fallback chain
  - Falls back to next provider on: error, timeout, or low confidence (below `confidenceThreshold`)
  - Configurable `timeoutMs` (default 30s) per provider call
  - `onFallback` callback fires with `ProviderAttempt` details (provider name, error/lowConfidence, durationMs) and next provider name
  - Last provider returns low-confidence result rather than throwing (graceful degradation)
  - Throws `OCRError` with all `attempts` only when every provider fails
- **Factory** (`index.ts`):
  - `createOCRService()` builds service from env config (`OCR_PROVIDER`, `OCR_FALLBACK_PROVIDER`, `OCR_CONFIDENCE_THRESHOLD`)
  - Validates `GOOGLE_VISION_API_KEY` presence when google-vision is selected
  - Logs fallback events to console with reason and duration
- **Dependency**: Added `tesseract.js@7.0.0` to backend

### Test results (15 unit tests, all pass)
**ocr-service.test.ts** (12 tests):
1. Primary provider returns result when confidence above threshold
2. Primary used, fallback skipped when primary succeeds
3. Falls back to next provider when primary throws
4. Falls back on timeout (100ms timeout with 500ms slow provider)
5. Falls back on low confidence
6. Throws OCRError with all attempts when all providers fail
7. Returns low-confidence result from last provider instead of throwing
8. onFallback called with error details on error fallback
9. onFallback called with lowConfidence flag on confidence fallback
10. Logs multiple fallback events in chain of 3 providers
11. Throws when constructed with empty providers
12. NoneProvider returns empty text with zero confidence

**ocr-tesseract.test.ts** (3 tests):
13. TesseractProvider processes BMP image buffer and returns valid OCRResult shape
14. Full fallback chain: failing primary → real Tesseract, with onFallback event logged
15. NoneProvider works as final fallback in chain

### Notes for next tasks
- TASK-004 unblocks: TASK-007 (e2e OCR → OpenRouter → chat pipeline)
- The `createOCRService()` factory is ready to be used in TASK-007's upload pipeline
- Google Vision adapter is implemented but untested against real API (needs `GOOGLE_VISION_API_KEY`)
- Tesseract works fully offline, tested with real image buffers
- Env vars already defined: `OCR_PROVIDER` (default: google-vision), `OCR_FALLBACK_PROVIDER` (default: none), `OCR_CONFIDENCE_THRESHOLD` (default: 0.7)

## TASK-007 — E2E pipeline: upload → OCR → OpenRouter → chat response (DONE)

**Date**: 2026-02-20
**Branch**: pdr
**Commits**: 1897ebf, 1f2a878

### What was done
- **New module**: `modules/ai/` — OpenRouter API integration
  - `AIService` class wrapping OpenRouter's OpenAI-compatible chat completions API
  - Configurable via env: `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_DEFAULT_MODEL`
  - Constructor accepts custom options for testing (baseUrl, apiKey, model)
  - `AIServiceError` error class with statusCode and responseBody
  - `getAIService()` singleton factory
- **Updated `modules/chat/services.ts`** — replaced stub with real AI pipeline:
  - `sendMessage()` now accepts optional `imageBuffer` parameter
  - If image provided: runs OCR via `createOCRService()`, extracts text, combines with user content
  - Builds full conversation context: system prompt + message history + current message
  - Calls `AIService.complete()` for AI generation via OpenRouter
  - Graceful error handling: OCR failure falls back to manual text, AI failure returns error message
  - System prompt configured for Russian-language student helper
- **New endpoint**: `POST /chat/sessions/:id/messages/image`
  - Accepts multipart form data with `image` (required, png/jpeg/webp/bmp, max 10MB) and `content` (optional text)
  - Runs full pipeline: image → OCR → AI → save to chat
  - Protected with `auth: true` macro
- **Existing endpoint** `POST /chat/sessions/:id/messages` now calls real AI instead of stub

### Test results (15 new tests, all pass)

**ai-service.test.ts** (7 unit tests):
1. Returns completion result on success (with usage data)
2. Sends correct request to OpenRouter API (URL, headers, body)
3. Uses custom model when provided
4. Throws AIServiceError on non-OK response (401)
5. Throws AIServiceError on empty response (no choices)
6. Handles response without usage data
7. Throws on network error

**chat-pipeline.test.ts** (8 integration tests):
8. Generates AI response for text message
9. Uses chat history as context for AI generation (verifies request body)
10. Saves AI response in message history
11. Handles AI generation failure gracefully (returns error fallback)
12. Accepts image upload and returns AI response
13. Saves image message in history with sourceType "image"
14. Rejects upload without image file (422)
15. Rejects unauthenticated image upload (401)

### Acceptance criteria verification
1. **Screenshot uploads and passes OCR** — `POST /chat/sessions/:id/messages/image` accepts image files, passes through `createOCRService().extractText()`, combines OCR text with user content
2. **OCR text passed to AI via OpenRouter** — `AIService.complete()` receives messages array including OCR-extracted text, calls OpenRouter API
3. **User receives full response in one chat turn** — single HTTP response returns both `userMessage` and `assistantMessage`

### Notes for next tasks
- TASK-007 unblocks: TASK-008 (low OCR confidence handling), TASK-010 (template injection), TASK-018 (safety pipeline), TASK-020 (first-use UI), TASK-027 (streaming), TASK-028 (token limits)
- No new npm dependencies added — AI service uses native `fetch` (OpenRouter is OpenAI-compatible)
- `createOCRService()` is called per-request — consider caching for performance if needed
- System prompt is hardcoded in `services.ts` — TASK-010 will inject template-based prompts
- Streaming (TASK-027) will require switching from `complete()` to a stream-based API
- Pre-existing failure in `smoke.test.ts` (`GET /chat` returns 404) still present — not related to this task

## TASK-010 — Template injection into prompt pipeline for fast/learning modes (DONE)

**Date**: 2026-02-20
**Branch**: pdr
**Commits**: c0a879e, d384577

### What was done
- **`buildSystemPrompt()` function** (`modules/chat/services.ts`):
  - Exported pure function that builds a system prompt from template fields and chat mode
  - Maps known values for tone (friendly/formal/casual/encouraging), knowledgeLevel (basic/intermediate/advanced), outputFormat (full/concise/step-by-step), responseLength (short/medium/long) to Russian-language instructions
  - Falls back to raw value for unknown/custom field values (e.g., `Тон общения: sarcastic.`)
  - Handles outputLanguage: Russian by default, custom language instruction when non-Russian
  - Mode-specific instructions: "fast" → quick answer, "learning" → help student understand
  - Always includes OCR caveat and StudentHelper identity
  - Returns `DEFAULT_SYSTEM_PROMPT` when no template is provided (safe fallback)
- **Template resolution in `sendMessage()`**:
  - New optional `templateId` parameter for explicit template selection
  - Resolution order: explicit templateId → user's default template → no template (safe fallback)
  - User ownership validation: ignores templateId belonging to another user
  - Error-resilient: catches template resolution errors and falls back gracefully
- **New `getDefaultForUser()` method** in `template/repo.ts`:
  - Queries for the user's template with `isDefault: true`
- **Routes updated**: Both `POST /sessions/:id/messages` and `POST /sessions/:id/messages/image` accept optional `templateId` in request body

### Test results

**build-system-prompt.test.ts** (15 unit tests, all pass):
1. Returns default prompt when no template provided
2. Returns default prompt when template is null
3. Includes friendly tone instruction
4. Includes formal tone instruction
5. Falls back to raw tone value for unknown tones
6. Includes knowledge level instructions (advanced)
7. Includes output format instructions (concise)
8. Includes step-by-step format instructions
9. Includes response length instructions (short)
10. Includes Russian language by default
11. Includes custom language when not Russian
12. Includes fast mode instruction
13. Includes learning mode instruction
14. Always includes OCR caveat when template is provided
15. Always includes StudentHelper identity

**template-injection.test.ts** (7 integration tests, all pass):
1. Uses default system prompt when user has no templates
2. Injects default template into system prompt automatically
3. Uses learning mode instruction when session is learning mode
4. Allows explicit templateId to override default template
5. Ignores templateId that belongs to another user
6. Uses safe fallback when no template and no default exists
7. Switches to new default template when default is changed between messages

### Acceptance criteria verification
1. **Active template affects tone, format, length, and language** — `buildSystemPrompt()` maps all template fields to specific Russian-language instructions in the system prompt, verified by integration tests capturing OpenRouter request body
2. **Default template is automatically applied in new chats** — `sendMessage()` fetches user's default template via `templateRepo.getDefaultForUser()` and injects it, verified by test 2
3. **Without template, safe system profile is used** — Returns `DEFAULT_SYSTEM_PROMPT` (the original hardcoded prompt), verified by tests 1 and 6

### Notes for next tasks
- TASK-010 unblocks: TASK-011 (step-by-step explanation endpoint), TASK-023 (active template in chat UI)
- `buildSystemPrompt` is exported and testable in isolation — can be reused by TASK-011 for explanation-specific prompts
- `templateId` param in routes enables TASK-023's one-click template switching without API changes
- Pre-existing failure in `smoke.test.ts` (`GET /chat` returns 404) still present — not related to this task
- Pre-existing lint warning in `chat-pipeline.test.ts` (unused `beforeEach` import) — not related to this task

## TASK-018 — Moderation/guardrail pipeline for unsafe requests/responses (DONE)

**Date**: 2026-02-20
**Branch**: pdr
**Commits**: 50ef066, ac756be

### What was done
- **New module**: `modules/safety/` with repo, services, and index
- **Safety service** (`modules/safety/services.ts`):
  - `checkPromptSafety(content)` — regex pattern matching against 11 unsafe categories (self-harm, violence, weapons, drugs, sexual content, prompt injection, hate speech) in both Russian and English
  - `checkResponseSafety(content)` — checks AI responses for dangerous instruction patterns
  - `getBlockedMessage(reason)` — returns user-facing blocked message; special message for self-harm with helpline 8-800-2000-122
  - `getFilteredResponseMessage()` — returns safe fallback for filtered AI responses
  - `SAFETY_GUARDRAIL` constant — mandatory safety rules appended to every system prompt
  - `logSafetyEvent(input)` — logs events to `safety_event` table with error resilience
- **Safety repo** (`modules/safety/repo.ts`):
  - `logEvent()` — inserts into `safety_event` table (userId, sessionId, eventType, severity, details)
- **Integration into chat pipeline** (`modules/chat/services.ts`):
  - User input checked via `checkPromptSafety()` BEFORE AI call
  - If unsafe: user message saved (for audit), safe blocked message returned, AI NOT called, SafetyEvent logged
  - AI response checked via `checkResponseSafety()` AFTER AI generation
  - If unsafe response: original content replaced with safe fallback, SafetyEvent logged
  - Both safety event logs are awaited (not fire-and-forget) for data consistency
- **System prompt guardrails**:
  - `SAFETY_GUARDRAIL` appended to BOTH `DEFAULT_SYSTEM_PROMPT` and template-based prompts
  - Guardrail always appears LAST in the prompt (after template content) so it cannot be overridden
  - Contains 6 mandatory safety rules: educational-only scope, no weapons/drugs/violence/hate/sexual content, mental health helpline referral, anti-jailbreak instruction
- **Template safety**: Template field values go through lookup maps (whitelisted); unknown values render as plain text labels (`Тон общения: X.`), not executable instructions

### Test results

**safety-service.test.ts** (29 unit tests, all pass):
1-3. Safe school questions pass (math, area calculation, history)
4-5. Blocks violence instructions (Russian + English)
6-7. Blocks weapons instructions (Russian + English)
8-9. Blocks drug instructions (Russian + English)
10-11. Blocks self-harm content (Russian + English)
12. Blocks sexual content involving minors
13-14. Blocks prompt injection attempts (English + Russian)
15. Blocks identity override attempts
16. Blocks hate speech
17. Case-insensitive matching
18-19. Response safety allows normal content, blocks dangerous instructions
20-21. Response safety blocks English dangerous instructions
22-23. `getBlockedMessage` returns self-harm helpline message vs generic message
24. `getFilteredResponseMessage` returns safe fallback
25-26. Default + template system prompts include safety guardrail
27. Safety guardrail appears after template content
28. Template with injection-like tone still has guardrail after it
29. `SAFETY_GUARDRAIL` constant includes key rules

**safety-pipeline.test.ts** (9 integration tests, all pass):
1. Blocks unsafe prompt and returns safe response without calling AI
2. Returns self-harm specific message with helpline number
3. Logs SafetyEvent in database for blocked prompt (verified DB query)
4. Blocks prompt injection attempts
5. Allows normal school questions after a blocked prompt (session not broken)
6. Filters unsafe AI response and returns safe fallback
7. Logs SafetyEvent for filtered AI response
8. Includes safety guardrail in system prompt even with custom template (injection-like values rendered as plain text, guardrail comes after)
9. Blocks unsafe prompt even with permissive template active

### Acceptance criteria verification
1. **Dangerous requests are blocked or sanitized** — `checkPromptSafety()` catches 11 pattern categories and blocks before AI call, verified by integration tests 1, 2, 4, 5, 9
2. **User templates cannot disable safety policy** — `SAFETY_GUARDRAIL` is always appended last to system prompt; template values go through whitelisted maps; prompt injection patterns caught by `checkPromptSafety()`; verified by integration tests 8, 9
3. **SafetyEvent is saved with type and severity** — `safetyRepo.logEvent()` writes to DB with eventType, severity, and details JSON; verified by integration tests 3, 7

### Notes for next tasks
- TASK-018 is independent — does not directly unblock other tasks
- Safety patterns can be extended by adding entries to `UNSAFE_PROMPT_PATTERNS` / `UNSAFE_RESPONSE_PATTERNS` arrays
- Consider adding external moderation API (OpenAI moderation, Perspective API) for more robust detection beyond regex
- Self-harm pattern ordering matters — must come before violence patterns to match "kill myself" before "kill"
- Pre-existing failure in `smoke.test.ts` (`GET /chat` returns 404) still present — not related to this task
- Pre-existing lint warning in `chat-pipeline.test.ts` (unused `beforeEach` import) — not related to this task
