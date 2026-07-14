# Engineering Entity Extraction

## Philosophy

Every extraction rule in this pipeline is a **deterministic regex or keyword match**. There is no AI, no LLM, no embedding similarity, no inference about meaning - only literal pattern matching against text the parser produced. Given the same document and the same rule set, extraction always produces the same output. This is intentional: this milestone extracts and structures information; it does not reason about whether that information is true, current, or consistent with other documents.

## Entity Extraction (`pipeline/entity-extraction-rules.ts`)

Each rule is `{ entityType, pattern, confidence, method }`. `entityType` reuses the existing `EntityType` union from `src/server/engineering/constants.ts` - the same vocabulary the canonical engineering entity CRUD already uses, so a future "promote extraction to truth" step never has to reconcile mismatched type systems.

| Entity Type          | Example pattern                                      | Confidence |
| -------------------- | ---------------------------------------------------- | ---------- |
| `PART_NUMBER`        | `P/N: ABC-1234`                                      | 0.75       |
| `DRAWING`            | `DWG-10293`, `Drawing No. 4471`                      | 0.75       |
| `REQUIREMENT`        | `REQ-4471`                                           | 0.75       |
| `SPECIFICATION`      | `SPEC-A100`                                          | 0.70       |
| `STANDARD`           | `MIL-STD-810`, `ASTM B117`, `ISO 9001`               | 0.85       |
| `TEST`               | `TEST-002`, `TR-118`                                 | 0.65       |
| `CERTIFICATION`      | `CERT-9981`                                          | 0.70       |
| `ENGINEERING_CHANGE` | `ECN-2024`, `ECO-118`                                | 0.75       |
| `MATERIAL`           | `titanium`, `carbon fiber`, `Inconel` (keyword list) | 0.50       |
| `PROCESS`            | `anodizing`, `heat treatment` (keyword list)         | 0.50       |
| `INTERFACE`          | `Interface Control Document ICD-100`                 | 0.60       |
| `SUPPLIER`           | `supplied by Acme Corp`                              | 0.55       |
| `MANUFACTURER`       | `manufactured by Acme Corp`                          | 0.55       |

Confidence is a static weight reflecting how specific the matched pattern is (a `MIL-STD-###` match is far less ambiguous than a bare material keyword) - it is **not** a probability estimate from any model.

`COMPONENT`, `ASSEMBLY`, `SYSTEM`, `SUBSYSTEM`, `FACILITY`, `DOCUMENT_REFERENCE`, and `EVIDENCE_REFERENCE` have no dedicated entity-extraction rule yet (they're either too free-form to regex reliably without excessive false positives, or - for the two reference-shaped types - are better served by the separate reference-extraction pass below). Adding a rule for any of them is a one-entry addition to the rule table; no other code changes.

## Reference Extraction (`pipeline/reference-extraction-rules.ts`)

A **separate** pass detecting cross-references between engineering objects, independent of whether the referenced object was itself extracted as an entity from this same document:

| Reference Type  | Example          |
| --------------- | ---------------- |
| `REQUIREMENT`   | `REQ-4471`       |
| `DRAWING`       | `DWG-10293`      |
| `PART`          | `P/N: ABC-1234`  |
| `SPECIFICATION` | `SPEC-A100`      |
| `DOCUMENT`      | `DOC-2201`       |
| `REVISION`      | `Rev C`, `REV-B` |

A reference whose `targetIdentifier` doesn't match any entity extracted from the _same_ document is not treated as an error - it's expected (the target is very often defined in a different document) and surfaces as a `BROKEN_REFERENCE` **warning** in the job's validation issues, not a failure.

## Relationship Extraction (`pipeline/relationship-extraction-rules.ts`)

Detects a relationship between two entities **already extracted from the same line of text**, connected by a known phrase:

`depends on` → `DEPENDS_ON`, `contains` → `CONTAINS`, `implements` → `IMPLEMENTS`, `verifies`/`is verified by` → `VERIFIES`, `manufactured by` → `MANUFACTURED_BY`, `supplied by` → `SUPPLIED_BY`, `tested by` → `TESTED_BY`, `certified by` → `CERTIFIED_BY`, `derived from` → `DERIVED_FROM`, `supersedes` → `SUPERSEDES`.

This is pure lexical co-occurrence - it says "these two identifiers appear on the same line separated by this phrase," not "this relationship is definitely true." Relationship confidence is derived from the two entities' own confidence (`min(source, target) × 0.9`).

## Provenance on Every Extracted Object

See `provenance.md` for the full field list. In short: every `ExtractedEntity`/`ExtractedRelationship`/`ExtractedReference` row carries its originating document, version, page, section (when resolvable), extraction method label (e.g. `regex:part-number-v1`), parser version, organization, and a single shared extraction timestamp per job run.
