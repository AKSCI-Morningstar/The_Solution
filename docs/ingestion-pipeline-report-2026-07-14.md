# Engineering Ingestion Pipeline — Delivery Report (2026-07-14)

## Scope Correction

The brief assumed a "Document Workspace" already existed. It didn't: `prisma/schema.prisma` had zero Document/Storage/Ingestion models, `src/features/documents/` was an empty directory, and `src/app/(dashboard)/documents/page.tsx` was a placeholder stub (`docs/future-roadmap.md` still lists document management as unchecked). This milestone therefore builds the first real ingestion system from scratch, following the conventions already established by the engineering/knowledge-graph modules. The existing `/documents` placeholder was left untouched; ingestion got its own `/ingestion` nav section.

## 1. Pipeline Architecture

Thirteen stages (`src/server/ingestion/pipeline/stages/`), each a separately-exported, independently unit-tested function, run in order by `orchestrator.ts`:

File Validation → Document Classification → Metadata Extraction → Structural Parsing → Section Detection → Table Detection → Entity Extraction → Relationship Extraction → Reference Extraction → Validation → Provenance Assignment → Graph Preparation → Persistence.

The orchestrator logs every stage to `IngestionStageLog` (name, status, duration, error), updates `IngestionJob.currentStage`/`progressPercent` as it runs, checks a `cancelRequested` flag between stages, and marks the job `FAILED` with `errorStage`/`errorMessage` on any stage exception — never silently continuing. Full detail in `docs/ingestion-pipeline.md`.

## 2. Parser Architecture

A `Parser` interface (`name`, `version`, `supportedExtensions/MimeTypes`, `canParse()`, `parse()`) resolved by a hot-reload-safe registry singleton. Six real parsers ship: `txt`, `markdown` (extracts `#` headings as sections), `csv` (hand-written quoted-field parser), `docx` (via `mammoth`), `pdf` (via `pdf-parse` v2's `PDFParse` class), and `image` (metadata-only — format/size, no OCR, no pixel dimensions, per the mission's explicit scope). The registry tracks per-parser health (runs/failures/consecutive failures/timestamps, exposed via `GET /api/ingestion/parsers`) and falls back to a generic text parser only for text-representable formats when the specialized parser throws — binary formats fail cleanly instead. Adding a future CAD/PLM/ERP parser is a one-file addition plus one `register()` call; no other code changes. Full detail in `docs/parser-framework.md`.

## 3. Provenance Model

Every `ExtractedEntity`/`ExtractedRelationship`/`ExtractedReference` row carries `organizationId`, `jobId`, `documentId`, `documentVersionId` (entities), `page`, `section` (nearest resolvable heading), `extractionMethod` (a specific versioned rule label, e.g. `regex:part-number-v1`), `parserVersion`, a single `extractedAt` timestamp shared by the whole job run, and `confidence`. Section resolution is exact for single-page-equivalent formats (txt/md/csv/docx) and honestly `null` for multi-page PDFs rather than approximated — documented as a deliberate accuracy-over-completeness choice in `docs/provenance.md`.

## 4. Entity Extraction Architecture

Deterministic regex/keyword rules only — no AI, no LLM, no inference. `entity-extraction-rules.ts` covers 13 of the 21 `EntityType` values (reusing the existing `EntityType`/`RelationshipType` enums from `server/engineering/constants.ts` so a future promotion step never has to reconcile vocabularies); `reference-extraction-rules.ts` covers all 6 reference types; `relationship-extraction-rules.ts` detects 10 connector phrases via lexical co-occurrence on the same line. Full rule table in `docs/entity-extraction.md`.

## 5. Validation Architecture

Three layers: (a) `file-validation.ts` — extension/size/magic-byte checks, fatal on the job; (b) `stage-validation.ts` — duplicate entities, unresolved references (informational, since a reference's target is often defined in a _different_ document), missing content; (c) `provenance-assignment.ts` — confidence-range sanity checks. All findings persist as `IngestionValidationIssue` rows (`severity`, `code`, `message`, `stage`, `context`), surfaced in the job detail UI.

## 6. Queue Architecture

No cloud dependencies. `IngestionJob` itself is the queue: `processNextJob()` atomically claims one row via a conditional `updateMany`; `startQueueLoop()` is an idempotent, hot-reload-safe in-process poller lazily started on first job creation; retry/cancel/priority/`scheduledAt` are all plain columns; `reconcileStuckJobs()` recovers jobs left `RUNNING` past a staleness threshold after a process restart. Swapping in a durable worker (BullMQ+Redis, pg-boss) later touches only `queue/runner.ts` — no schema or API change. Full detail in `docs/ingestion-pipeline.md`.

## 7. Performance Strategy

Architected for, not load-tested: stage-per-page processing, batched `createMany` for relationships/references/issues, a single `$transaction` for persistence, indexed `organizationId`/`status`/`scheduledAt` columns for queue polling. Explicitly **not** implemented this milestone: distributed/multi-node execution and stage-level chunking for extremely large (tens of thousands of pages) documents — both called out as known limitations rather than silently assumed solved.

## 8. Documentation Summary

Five new docs, each describing what was actually built (not aspirational): `docs/ingestion-pipeline.md` (architecture + stages + queue + limitations), `docs/parser-framework.md` (interface + registry + how to extend), `docs/entity-extraction.md` (full rule tables), `docs/provenance.md` (field-by-field model + the section-resolution limitation), `docs/pipeline-api.md` (full endpoint reference).

## 9. Verification Checklist

```
pnpm db:generate     ✅ (db:push could not be run — no local Postgres server is
                         installed/running in this environment; schema is valid
                         and the client generates cleanly from it)
pnpm format:check    ✅ all files match Prettier style
pnpm lint            ✅ 0 problems
pnpm typecheck       ✅ 0 errors
pnpm test            ✅ 25 files, 104 tests passed (76 new for this feature)
pnpm build           ✅ compiled successfully, 49/49 static pages generated
```

Two real bugs were caught and fixed by the tests themselves, not just written around: (1) `pdf-parse` v2 transfers its input buffer to a worker thread and detaches it — calling `getText()` and `getInfo()` concurrently via `Promise.all` on the same `PDFParse` instance failed every time (`Cannot transfer object of unsupported type`) once a real fixture exercised it; fixed by sequencing the two calls. (2) `config.databaseUrl` threw eagerly at module-import time for any code importing `@/shared/config`, even though nothing in the app actually consumes that property (Prisma reads `DATABASE_URL` directly) — converted to a lazy getter, matching the `isDev`/`isProd`/`isTest` pattern already in that file, which also happens to make the module properly testable.

**Known gap:** `runPipeline()` (the orchestrator), `processNextJob()`, and the document/job service layer all require a live Postgres connection and are not covered by automated tests in this environment. Every pure function they call (all 13 stage bodies, the parser registry, validation schemas) is tested; the DB-touching glue is not. Flagging this rather than claiming full coverage.

## 10. Recommended Git Commit

```
feat: implement engineering ingestion pipeline
```
