# PRD — Lerio Web MVP

**Project:** Lerio  
**Version:** 1.0 (MVP PRD)  
**Date:** February 20, 2026  
**Source of truth:** `/Users/artem/Github/studentHelper/docs/lerio-business-spec-v1.1.md`

## 1) App Overview and Goals
Lerio is a web-first AI study assistant for school students (grades 5-11) in Russia. The core value proposition is immediate practical help with homework, while preserving learning value through optional step-by-step explanations.

### Product Goal
Deliver a first-use experience where a student clearly feels that Lerio drastically simplifies homework and makes study time more useful.

### MVP Outcome Goal
Within 1-2 minutes from opening the app, user can:
1. Upload a task screenshot.
2. Ask for a direct solution.
3. Open a step-by-step explanation when needed.
4. Save/tune personal response template for future tasks.

### Business/Usage Alignment
According to `lerio-business-spec-v1.1.md`, North Star is `WLS` and monetization North Star is `WPLS`. This PRD aligns with that model and web-first launch strategy.

## 2) Target Audience
### Primary Segment
- Students (grades 5-11), self-serve usage.
- Main JTBD: "solve homework quickly, then optionally understand it in simple language matching my level".

### Secondary Segment (MVP-adjacent)
- Parents as controlling stakeholders.
- In MVP scope, parent role is present as a future-ready extension, but student flow is prioritized.

## 3) Core Features and Functionality
## 3.1 Feature A: Instant Homework Solution (Must-Have)
User uploads a screenshot and sends a short command (e.g., "реши"); system returns a direct answer quickly.

### Functional Scope
- Image upload (screenshot/photo).
- OCR extraction.
- AI response generation via OpenRouter.
- Fast response formatting.

### Acceptance Criteria
1. User can upload an image and receive a complete answer in one chat turn.
2. Median response time feels near-instant for typical school tasks (target SLO defined below).
3. If OCR confidence is low, system returns a clear fallback prompt (e.g., ask for clearer image or text input).
4. System supports Russian language output by default.

### Technical Considerations
- OCR quality may vary by image quality; UX should communicate this clearly.
- Use strict token/context limits to keep costs inside budget (<= $100/month MVP constraint).

## 3.2 Feature B: Personal Answer Templates (Must-Have)
Students can create reusable template presets for how answers should look.

### Configurable Parameters
- Explanation tone (simple/formal/friendly/strict).
- Knowledge level (match student level; avoid advanced university-level language).
- Output format (short/full/"notebook-style").
- Language.
- Response length.
- Additional optional preferences (fine-tuning options).

### Acceptance Criteria
1. User can create, edit, delete, and apply templates.
2. Applied template measurably changes AI response style/structure.
3. User can set one default template for new chats.
4. Template settings persist between sessions.

### Technical Considerations
- Keep template schema extensible for future new parameters.
- Add guardrails so template cannot disable safety rules.

## 3.3 Feature C: Optional Step-by-Step Explanation (High Priority for MVP+)
After instant answer, user can open guided step explanation.

### Acceptance Criteria
1. For any generated final answer, user can request a step-by-step breakdown.
2. Explanation matches student level from template/profile settings.
3. Steps avoid over-complex notation unless requested.

## 3.4 Feature D: User Textbook Upload + Search (MVP limited)
Users upload personal study materials and query them.

### MVP Boundary
- Only user-owned/personal textbook corpus.
- No shared global textbook catalog in MVP.

### Acceptance Criteria
1. User can upload supported file formats (MVP exact formats defined in tech design).
2. User can run search/query over own documents.
3. Answers cite source snippets from uploaded material.
4. User can delete uploaded files and associated indexed data.

### Technical Considerations
- RAG quality and relevance is a top technical risk.
- Need clear source attribution and storage retention policy.

## 4) Recommended Tech Stack
Recommendation is aligned with current repository architecture and fastest path to MVP.

### Frontend
- Next.js (App Router) web app.
- Shared UI package (`@student-helper/ui`) and Tailwind.

Alternative:
- React SPA + custom backend rendering.
Pros: simpler mental model for some teams. Cons: loses current project alignment and platform conventions.

### Backend
- Elysia API (existing backend foundation).
- Drizzle + Postgres for transactional data.
- Redis + BullMQ for async jobs (OCR/RAG processing queues).

### AI Layer
- OpenRouter as model gateway (confirmed by product owner).
- Structured prompt pipeline with mode controls (fast vs step-by-step) and template injection.

### OCR
- Dedicated OCR provider/service abstraction with fallback strategy.

### Observability
- Sentry (errors, traces).
- Grafana dashboards (latency, queue health, core product events).
- Prometheus optional in MVP+ (not mandatory at launch).

### Why this stack
- Maximizes reuse of existing monorepo.
- Reduces implementation risk and time-to-MVP.
- Supports future scaling beyond 1,000 MAU.

### Reference Docs
- Next.js docs: https://nextjs.org/docs
- Drizzle docs: https://orm.drizzle.team/docs/overview
- BullMQ docs: https://docs.bullmq.io/
- Sentry docs: https://docs.sentry.io/
- Grafana docs: https://grafana.com/docs/
- OpenRouter docs: https://openrouter.ai/docs

## 5) Conceptual Data Model
## 5.1 Entities
### User
- id: uuid
- email: string (unique)
- auth_provider: enum(email_magic_link, google, ...)
- created_at: datetime
- locale: string (default ru-RU)

### StudentProfile
- id: uuid
- user_id: uuid (FK -> User)
- grade_level: enum(5..11)
- preferred_language: string
- default_template_id: uuid (nullable)

### ChatSession
- id: uuid
- user_id: uuid
- mode: enum(fast, learning)
- status: enum(active, completed, archived)
- created_at: datetime
- ended_at: datetime (nullable)

### Message
- id: uuid
- session_id: uuid
- role: enum(user, assistant, system)
- content: text
- source_type: enum(text, image, rag)
- created_at: datetime

### TemplatePreset
- id: uuid
- user_id: uuid
- name: string
- tone: string
- knowledge_level: string
- output_format: string
- output_language: string
- response_length: string
- extra_preferences: jsonb
- is_default: boolean
- created_at: datetime
- updated_at: datetime

### UploadedDocument
- id: uuid
- user_id: uuid
- file_name: string
- file_type: string
- storage_key: string
- status: enum(uploaded, processed, failed)
- created_at: datetime
- deleted_at: datetime (nullable)

### DocumentChunk
- id: uuid
- document_id: uuid
- chunk_text: text
- embedding_vector: vector/blob (implementation-defined)
- page_ref: string (nullable)

### SafetyEvent
- id: uuid
- user_id: uuid
- session_id: uuid (nullable)
- event_type: enum(blocked_prompt, unsafe_response_filtered, warning_shown)
- severity: enum(low, medium, high)
- created_at: datetime

## 5.2 Relationships
- User 1..1 StudentProfile
- User 1..N ChatSession
- ChatSession 1..N Message
- User 1..N TemplatePreset
- User 1..N UploadedDocument
- UploadedDocument 1..N DocumentChunk

## 6) UI/UX Principles
1. Time-to-value first: first successful result in <= 2 minutes.
2. One primary action on entry: upload image or paste task text.
3. Directness by default: instant answer first, deeper explanation optional.
4. Personalization visible: active template shown and editable in one click.
5. Clarity under failure: explicit OCR/RAG fallback messages, no silent failure.
6. Student-level language: responses should match school-level understanding.
7. Safety by design: when blocked/filtered, explain what happened and provide safe alternative.

## 7) Security and Safety Considerations
## 7.1 Authentication and Access
- MVP auth methods: Google OAuth + magic link.
- Architecture must allow adding extra OAuth providers later.
- Session management with secure cookies/tokens and CSRF-safe flows.

## 7.2 Content Safety
- Mandatory unsafe-content protection mode.
- Prompt/response moderation pipeline before final output when required.
- Safety policy cannot be overridden by user templates.

## 7.3 Data Protection
- Personal documents isolated per user (strict access boundaries).
- Deletion path for chat/files/indexed data.
- Follow localization constraints in business spec for personal data handling in RF context.

## 8) Milestones and Development Phases
## Phase 0: Foundation Hardening (1-2 weeks)
- Finalize functional scope and KPI instrumentation plan.
- Set baseline observability (Sentry + Grafana).
- Define OCR provider abstraction.

## Phase 1: Core MVP Build (4-6 weeks)
- Chat session/message domain implementation.
- Instant solution flow with image upload + OCR + OpenRouter.
- Template presets CRUD + apply/default behavior.
- Basic safety guardrail pipeline.

## Phase 2: RAG MVP + Stabilization (2-4 weeks)
- User document upload and indexing.
- Search and source-grounded response flow.
- Quality tuning for relevance and answer format consistency.

## Phase 3: Launch Readiness (1-2 weeks)
- Performance tuning (latency, queue reliability).
- E2E journey validation.
- Operational runbook and incident basics.

## 9) Potential Risks and Mitigations
1. RAG quality is inconsistent.
Mitigation: retrieval quality eval set, source citation checks, fallback to non-RAG answer with warning.

2. OCR errors on low-quality images.
Mitigation: OCR confidence threshold, user correction loop, image quality tips.

3. Cost overrun vs $100/month budget.
Mitigation: strict free-tier caps, token budgets, response truncation policies, queue throttling.

4. Unsafe output/content leakage.
Mitigation: moderation filters, rule-based hard blocks, safety event logging.

5. Latency frustration in "fast" mode.
Mitigation: streaming responses, model routing by request type, cache frequent prompt scaffolds.

## 10) Future Expansion Opportunities
1. Parent dashboard (usage report + control toggles) from business spec family model.
2. Shared school content packs (after legal/content strategy).
3. Mobile apps after web MVP validation.
4. Smart study plans and weak-topic tracking.
5. Additional OAuth providers and richer account model.

## 11) Feature-by-Feature Acceptance Checklist
## A. Instant Solution
- User uploads screenshot and gets complete answer.
- Fast mode response is consistently quick.
- Clear fallback shown on OCR failure.

## B. Template Presets
- Full template lifecycle (CRUD) works.
- Default template works on new sessions.
- Output reflects selected template parameters.

## C. Step-by-Step Explanation
- User can expand answer into steps.
- Steps respect user level and language settings.

## D. User Textbook RAG
- User can upload own material.
- System can retrieve relevant passages.
- Response references source chunks.

## E. Safety
- Unsafe requests are filtered/blocked according to policy.
- Safety events are logged for monitoring.

## 12) Non-Functional Targets (MVP)
- API availability target: >= 99.5% (from business spec SLA).
- Time to first meaningful response event (p95): <= 2s for typical fast-mode requests where feasible.
- AI generation error rate: <= 3%.
- Operability: core dashboards and alerting baselines in place.

## 13) Open Decisions (Post-PRD)
1. Exact OCR vendor and fallback chain.
2. Exact model routing policy in OpenRouter (quality vs latency tiers).
3. Supported upload formats in v1 (image-only vs image+PDF first).
4. Retention defaults for docs/chats in MVP implementation.

## 14) Alignment Note with Business Spec
This PRD intentionally aligns with `/Users/artem/Github/studentHelper/docs/lerio-business-spec-v1.1.md` on:
- Web-first launch.
- Student-first value with parent-aware roadmap.
- Learning + fast modes.
- RAG and safety as critical capability.
- KPI orientation around `WLS` / `WPLS`.

Deliberate scoping decision in this PRD:
- Billing/payment details are intentionally omitted from requirement questioning and implementation scope in this iteration, per stakeholder instruction.
