# Engineering Ingestion Pipeline

## Purpose

The ingestion pipeline converts uploaded engineering documents into structured, fully-provenanced records. It is deliberately **not** part of the platform's reasoning/truth-determination layer:

- It extracts, structures, and validates information found in a document.
- It does **not** decide whether that information is correct, current, or authoritative.
- It contains no AI, no LLM calls, and no inference beyond deterministic pattern matching.

Engineering documents remain the canonical source of truth. Everything this pipeline produces is a **staging-layer extraction** (`ExtractedEntity` / `ExtractedRelationship` / `ExtractedReference`, each with a `PENDING/CONFIRMED/REJECTED` status), kept separate from the canonical `EngineeringEntity`/`EngineeringRelationship` graph that the existing engineering module and knowledge graph already use. Promoting a `PENDING` extraction into canonical truth is intentionally left to a future "reasoning" milestone.

## Module Layout

```
src/server/ingestion/
├── constants.ts              # supported formats, statuses, pipeline stage names
├── file-signature.ts         # magic-byte format detection
├── validation.ts             # Zod schemas for the API layer
├── document-service.ts       # upload, versioning, document listing
├── job-service.ts            # job lifecycle (create/list/cancel/retry/results)
├── storage/                  # StorageAdapter interface + local filesystem impl
├── parsers/                  # Parser interface, registry, 6 concrete parsers
├── pipeline/
│   ├── types.ts              # ExtractedEntityDraft/RelationshipDraft/ReferenceDraft/...
│   ├── entity-extraction-rules.ts
│   ├── relationship-extraction-rules.ts
│   ├── reference-extraction-rules.ts
│   ├── orchestrator.ts       # runs the 13 stages, tracks progress/cancellation
│   └── stages/               # one file per pipeline stage
└── queue/
    └── runner.ts             # in-process job queue (claim/run/reconcile)
```

This mirrors the existing `src/server/engineering/` and `src/server/knowledge-graph/` module layout exactly - same barrel-export convention, same `requireActiveOrganization()` + `getCurrentUser()` pattern on every route, same Zod `safeParse` + `AppError` error handling.

## The 13 Pipeline Stages

Each stage is a separately-exported, independently unit-testable function (see `pipeline/stages/`). The orchestrator (`pipeline/orchestrator.ts`) runs them in order, logs each one to `IngestionStageLog`, and updates `IngestionJob.currentStage`/`progressPercent` as it goes.

| #   | Stage                   | What it does                                                                                               |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | File Validation         | Extension/size/magic-byte checks. Fatal errors here stop the job immediately.                              |
| 2   | Document Classification | Keyword/structure heuristics → one of a small deterministic document-type label set.                       |
| 3   | Metadata Extraction     | Filename, size, checksum, page/word counts, format-specific metadata.                                      |
| 4   | Structural Parsing      | Invokes the resolved `Parser` to get text/pages/sections/tables.                                           |
| 5   | Section Detection       | Heading heuristics, skipped (logged `SKIPPED`) if the parser already supplied sections.                    |
| 6   | Table Detection         | Markdown-style pipe-table detection, skipped if the parser already supplied tables (CSV always does).      |
| 7   | Entity Extraction       | Regex rule set → `ExtractedEntity` drafts, reusing `EntityType` from the engineering module.               |
| 8   | Relationship Extraction | Co-occurrence + connector-phrase rules between entities found in stage 7.                                  |
| 9   | Reference Extraction    | Regex rules detecting requirement/drawing/part/spec/document/revision references.                          |
| 10  | Validation              | Duplicate entities, unresolved references, missing content.                                                |
| 11  | Provenance Assignment   | Stamps a single consistent `extractedAt` timestamp; sanity-checks confidence values.                       |
| 12  | Graph Preparation       | Builds a lightweight preview graph (JSON) for the UI - **not** written into the canonical knowledge graph. |
| 13  | Persistence             | Writes everything in one `prisma.$transaction`.                                                            |

A stage failure marks the job `FAILED` with `errorStage`/`errorMessage` set and stops the pipeline; it never silently continues. Cancellation is checked between stages (not mid-stage - see Known Limitations).

## Queue Architecture

No cloud dependencies. The `IngestionJob` table **is** the queue:

- `processNextJob()` atomically claims one `QUEUED` job (`scheduledAt <= now`, ordered by priority) via a conditional `updateMany` - safe under concurrent callers.
- `startQueueLoop()` runs an in-process, concurrency-limited `setInterval` poller. It's idempotent and lazily started the first time a job is created (`createJob`/`retryJob` both call it), guarded by the same hot-reload-safe global-singleton pattern already used for the Prisma client (`server/db/prisma.ts`).
- Retry: `POST /jobs/:id/retry` increments `attempt` (bounded by `maxAttempts`) and requeues.
- Cancellation: `POST /jobs/:id/cancel` sets `cancelRequested`; the orchestrator checks it between stages.
- Scheduling: `scheduledAt` on the job row - no cron dependency needed.
- Reconciliation: `reconcileStuckJobs()` runs on queue-loop startup and requeues (or fails, once attempts are exhausted) jobs left `RUNNING` past a staleness threshold - the recovery path for a process crash mid-job.

## Known Limitations (by design, not oversights)

- **Not distributed.** The queue runner is a single in-process poller. It survives Next.js dev hot-reload but not a process crash mid-job (see reconciliation above). Swapping in a durable worker (BullMQ+Redis, pg-boss) later requires no schema or API changes - only `queue/runner.ts`'s internals change.
- **Cancellation is stage-granular, not instruction-granular.** A long-running single stage can't be interrupted mid-execution.
- **Entity/relationship/reference extraction is regex/heuristic-based**, not exhaustive. It covers roughly half of the engineering entity type vocabulary with real rules (see `entity-extraction.md`); adding coverage is additive (new rule entries), never a pipeline change.
- **No OCR.** Images are ingested for metadata only (format/size), per the mission's explicit scope.
- **CAD/PLM/ERP/external-API parsers are not implemented** - the `Parser` interface and registry are ready for them (see `parser-framework.md`), but there's nothing to parse yet.
- **Large-document performance is architected for, not load-tested.** Entity/relationship extraction runs in a single pass per page; documents with tens of thousands of pages would benefit from stage-level chunking that isn't implemented yet.

## Related Documentation

- `parser-framework.md` - the `Parser` interface, registry, health tracking, and how to add a new format.
- `entity-extraction.md` - the deterministic rule sets for entities, relationships, and references.
- `provenance.md` - the provenance fields every extracted object carries.
- `pipeline-api.md` - full API reference.
