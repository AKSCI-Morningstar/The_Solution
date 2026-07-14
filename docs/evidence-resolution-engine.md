# Evidence Resolution Engine

The Deterministic Evidence Resolution Engine is a core intellectual property system of AKSCI: The Morningstar Solution. It evaluates engineering evidence to determine what supports a claim, what contradicts it, what is missing, and whether sufficient evidence exists.

## Core Principles

The engine is:

- **Deterministic**: No probabilistic reasoning, no hallucinations, no fabricated confidence scores
- **Traceable**: Every conclusion traces back to source documents, entities, and relationships
- **Explainable**: Every result exposes the full evidence chain and reasoning path
- **Evidence-backed**: All conclusions are grounded in the knowledge graph and document provenance
- **Repeatable**: The same inputs always produce the same outputs
- **Auditable**: Full traceability records preserve document, page, section, version, entity, organization, and timestamp

## Architecture

```
┌─────────────────────────────────────────────┐
│           Resolution Engine                  │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ Evidence │  │ Conflict  │  │ Missing     │ │
│  │ Graph    │  │ Detector  │  │ Evidence    │ │
│  │ Builder  │  │           │  │ Detector    │ │
│  └────┬─────┘  └─────┬─────┘  └──────┬──────┘ │
│       │              │               │        │
│  ┌────┴─────┐  ┌─────┴─────┐  ┌─────┴──────┐ │
│  │ Evidence │  │ Traceabil-│  │ Quality    │ │
│  │ Chain    │  │ ity       │  │ Indicators │ │
│  │ Builder  │  │ Builder   │  │             │ │
│  └──────────┘  └───────────┘  └────────────┘ │
└─────────────────────────────────────────────┘
         │
    ┌────┴────┐
    │  Result │
    └─────────┘
```

## Resolution Workflow

1. **Input**: An entity ID within an organization context
2. **Evidence Graph Construction**: BFS traversal of the knowledge graph from the root entity, up to `maxDepth` levels deep, collecting entities, relationships, and extracted document facts
3. **Supporting Evidence Extraction**: Nodes connected via SUPPORTS or VERIFIES relationships
4. **Conflicting Evidence Extraction**: Nodes connected via CONTRADICTS relationships
5. **Conflict Detection**: Duplicate entities, superseded evidence, stale evidence, broken references, conflicting specifications, conflicting suppliers
6. **Missing Evidence Detection**: Missing tests, certifications, specifications, approvals, traceability, document references — based on entity type requirements
7. **Evidence Chain Generation**: DFS from root through incoming edges, building complete traceability chains with source references
8. **Traceability Graph**: BFS traversal recording document provenance, page references, section, version, and relationship path for every entity
9. **Quality Assessment**: Deterministic quality indicators (Complete, Incomplete, Conflicting, Outdated, Verified, Needs Review)
10. **Resolution**: Final status determination based on supporting, conflicting, and missing evidence

## Resolution Statuses

| Status | Meaning |
|--------|---------|
| `VERIFIED` | Evidence is complete, no conflicts, no missing items, document provenance and version info present |
| `SUFFICIENT` | Supporting evidence exists, no conflicts, no missing items |
| `INSUFFICIENT` | High-severity missing evidence or no supporting evidence at all |
| `CONFLICTING` | Conflicting evidence detected |
| `INCOMPLETE` | Some missing evidence (non-high-severity) detected |
| `NEEDS_REVIEW` | Evidence quality is outdated |

## Key Files

| Module | Path |
|--------|------|
| Constants | `src/server/evidence/constants.ts` |
| Types | `src/server/evidence/types.ts` |
| Validation | `src/server/evidence/validation.ts` |
| Evidence Graph | `src/server/evidence/evidence-graph.ts` |
| Evidence Chains | `src/server/evidence/evidence-chain.ts` |
| Conflict Detector | `src/server/evidence/conflict-detector.ts` |
| Missing Evidence | `src/server/evidence/missing-evidence-detector.ts` |
| Traceability Builder | `src/server/evidence/traceability-builder.ts` |
| Resolution Engine | `src/server/evidence/resolution-engine.ts` |
| Barrel Export | `src/server/evidence/index.ts` |

## Performance

The engine is designed for large engineering datasets:

- BFS traversal with visited set prevents infinite loops and redundant queries
- Evidence graph is built in memory, all analysis runs on the in-memory graph
- Max depth parameter limits traversal scope
- Conflict detection and missing evidence detection run in O(N+E) time
- Evidence chain DFS uses path-local visited sets to handle cycles
- Document evidence is loaded in a single batch query per root entity
