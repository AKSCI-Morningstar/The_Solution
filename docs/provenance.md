# Provenance Model

## Why

Engineering documents are the canonical source of truth. Every structured record the ingestion pipeline produces must be traceable back to the exact document, version, and location it came from - otherwise a structured entity is just an unverifiable claim. Nothing in this pipeline is allowed to lose that trail.

## Fields Carried by Every Extracted Object

`ExtractedEntity`, `ExtractedRelationship`, and `ExtractedReference` (see `prisma/schema.prisma`) all carry:

| Field               | Meaning                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationId`    | Tenant isolation - every query and every row is scoped by this.                                                                                                                          |
| `jobId`             | The specific pipeline run that produced this record.                                                                                                                                     |
| `documentId`        | The originating document.                                                                                                                                                                |
| `documentVersionId` | The specific version of that document (entities only - relationships/references key off `documentId` directly since they're already scoped via their source/target entities or the job). |
| `page`              | Page number within the document, when the parser/format has real pages (PDF) or a synthetic single page (txt/md/csv/docx).                                                               |
| `section`           | Nearest preceding heading/section title, when resolvable (see note below on multi-page limitations).                                                                                     |
| `paragraph`         | Reserved for future paragraph-level resolution (entities only; currently always `null` - see Known Limitations).                                                                         |
| `extractionMethod`  | A specific, versioned label identifying which rule produced this record (e.g. `regex:part-number-v1`), not just "regex."                                                                 |
| `parserVersion`     | The version of the `Parser` that structurally parsed the document (from `Parser.version`, e.g. `pdf-parser@1.0.0`'s `1.0.0`).                                                            |
| `extractedAt`       | A single timestamp shared by every record from the same job run (stamped once in the Provenance Assignment stage, not per-row at insert time).                                           |
| `confidence`        | The extraction rule's static confidence weight (see `entity-extraction.md`) - not a probability from any model.                                                                          |

`IngestionDocument`/`IngestionDocumentVersion` additionally record `checksum` (SHA-256 of the file bytes), `storageKey`, `uploadedById`/`createdById`, and `createdAt`, so the exact bytes behind any extraction can always be re-read from storage.

## Section Resolution: an Honest Limitation

For single-page-equivalent formats (`txt`, `md`, `csv`, `docx` - each produces exactly one `ParsedPage`), the extraction stages resolve `section` precisely by comparing the regex match's character offset against each detected section's `startOffset`.

For genuinely multi-page formats (PDF), each page has its own independent text buffer, and offsets don't line up cleanly against sections detected from `fullText`. Rather than fabricate an approximate section, multi-page extractions carry `page` (always accurate) with `section: null`. This is a deliberate accuracy-over-completeness choice, not an oversight - a `null` section is honest; a wrong one would silently corrupt provenance.

## What Provenance Does _Not_ Claim

Provenance says "this record came from this exact document/page/rule, at this time." It does not say "this record is true" or "this record has been reviewed." That distinction is why extraction lands in `PENDING`-status staging tables rather than the canonical `EngineeringEntity` graph - see `ingestion-pipeline.md`'s Core Philosophy section.
