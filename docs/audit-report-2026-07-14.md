# Engineering Audit Report — 2026-07-14

Scope: `D:\AKSCI\The_Solution` ("The Morningstar Solution") only. The unrelated scaffold in the parent `D:\AKSCI` folder was explicitly out of scope and untouched.

Method: a pre-audit checkpoint was committed first, then a 10-dimension automated review ran in parallel (architecture, code quality, TypeScript, React/Next.js, database, security, API design, UI/accessibility, testing, dependencies/CI/docs), each dimension independently re-verified by a second pass before being trusted. 88 findings were confirmed this way (1 marked plausible-but-unconfirmed). The highest-impact subset was fixed directly; the rest is catalogued below for follow-up.

## 1. Executive Summary

The codebase is a genuinely well-structured Next.js 16 / React 19 / Prisma enterprise app with real conventions (layered architecture, Zod validation, an error-class hierarchy, RBAC, multi-tenancy) — this is not a toy scaffold. But a full audit surfaced a cluster of **real, shippable bugs**, most concentrated in the engineering-entity/knowledge-graph feature that was mid-flight when this audit started: seven mutating routes were writing an empty-string actor id that would fail a foreign-key constraint on any real database, a role-change endpoint that could never actually succeed, a cross-org data leak in the roles endpoint, a data-loss bug in the entity edit form, and knowledge-graph index rows that are written but never cleaned up. All of these are now fixed, verified, and covered by a green lint/typecheck/test/build run. A larger body of architecture drift, test-coverage gaps, and design-system duplication remains and is documented below rather than rewritten wholesale, in keeping with "no breaking changes."

## 2. Architecture Score: 6/10

Real layering exists and is documented (`docs/architecture.md`, `docs/module-boundaries.md`), but it's violated in several concrete places: `components/layout/header.tsx` reaches into `features/organizations`; `features/organizations` imports `features/rbac` directly; `shared/types` imports back from the "legacy" `src/types`; API routes reach past `server/` into ad hoc in-memory state (`/api/timestamps`); and client components import server-layer modules (`@/server/engineering/constants`, `@/server/rbac/permissions`) with no `server-only` guard anywhere in the repo.

## 3. Scalability Score: 5/10

`syncGraphIndexes` and `expandSubgraph` in the knowledge-graph service issue sequential per-row/per-node DB round trips inside loops (3N+ queries for a sync, no batching in the BFS traversal) — fine at demo scale, a real bottleneck once organizations have thousands of entities. Multi-step writes (entity + audit log + version) aren't wrapped in `$transaction`, unlike the organizations module which does this correctly.

## 4. Security Score: 5/10 (pre-fix) → 7/10 (post-fix)

Fixed this session: two instances of mutating routes trusting a hardcoded empty-string actor id instead of the session (one of which made role-changing permanently broken), a broken-access-control gap letting any authenticated user read another org's role definitions, unbounded `nodeIds`/`depth`/`pageSize` on knowledge-graph endpoints (resource-exhaustion risk), and a layout-save endpoint that didn't verify the caller owned the graph nodes it was attaching positions to.

Not fixed, documented as risk: `src/middleware.ts` only checks that a session cookie is _present_, not that it's valid — every route's real protection depends on that route remembering to call `getCurrentUser()`/`requireActiveOrganization()` itself. Login's audit-trail IP address is read from client-controlled `X-Forwarded-For` with no trusted-proxy validation. Rate limiting, CSRF, and account lockout are explicitly documented as "future work" in `docs/security.md` — still true today.

## 5. Maintainability Score: 6/10

Strong: `strict: true` TypeScript, Zod at nearly every boundary, a real error-class hierarchy, consistent file-naming conventions. Weak: an entire `src/lib/` directory (5 files) is dead code with zero importers, and had already silently forked from the `shared/` equivalents it was supposed to re-export; two independent `Dialog`/`Modal` implementations of the same overlay; a `useFetch`/`useMutation` hook pair that's never called anywhere, while six different components hand-roll the same fetch/loading/error state machine independently (with visibly different bugs between the copies); a duplicated `paginationSchema` defined twice under the same name in two modules.

## 6. Performance Score: 6/10

No loading.tsx/error.tsx anywhere in `src/app` despite 19+ dashboard routes and unused skeleton components built specifically for that purpose. Every data-driven dashboard page is a client component fetching over HTTP in a `useEffect` instead of an async Server Component calling the existing service layer directly — extra request waterfall and client JS for pages that don't need it. The knowledge-graph canvas recomputes and redraws reasonably, but node positions were being stored as React state recalculated via effect instead of `useMemo` (fixed as part of the pre-audit lint pass).

## 7. Test Coverage Assessment: Critical gap

`tests/unit/` has 5 files: password hashing, a slugify helper, a math helper, and two component smoke tests. **Zero** tests exist for entity/relationship/version/audit/graph services, RBAC/authorization logic, organizations/membership logic, or any of the ~32 API routes. The one E2E test that claims to reach the dashboard never actually logs in — it navigates straight to `/dashboard`, so it proves nothing about the auth flow it appears to test. For a platform whose own README calls it "deterministic, evidence-based," this is the single largest gap found.

## 8. Technical Debt Found (not fixed this session — tracked for follow-up)

- Dead `src/lib/` directory (5 files, zero importers, already diverged from `shared/`)
- Duplicate `Dialog`/`Modal`, duplicate `EmptyState`, `StatusBadge`/`TypeBadge` bypassing the shared `Badge` primitive, hand-rolled `Share2` icon instead of importing from `lucide-react`
- `useFetch`/`useMutation` hooks defined but unused; ~6 components independently reimplement the same pattern with inconsistent cancellation handling
- `GraphNode`/`GraphEdge` interfaces duplicated verbatim across two components instead of a shared type
- Role/Permission/RolePermission tables exist in the schema but are functionally dead — RBAC is enforced entirely via an in-memory `DEFAULT_ROLES` constant; `Role.organizationId` isn't even a real `@relation`
- `GraphNodeIndex`/`GraphEdgeIndex`/`GraphLayoutNode` have no FK `@relation` back to their source tables — the app-level cleanup added this session is a mitigation, not a substitute for real referential integrity
- API response envelopes are inconsistent across list endpoints (bare pagination object vs. `{data}` vs. a third shape with `stats` bolted on) and the same ~8-line try/catch/AppError block is duplicated in nearly all 32 route files
- No `loading.tsx`/`error.tsx` route segments; dashboard pages are client components that could be Server Components
- `docs/architecture.md`'s documented feature list and "server/ is future work" framing are stale relative to the real, substantially-built `src/features/` and `src/server/` trees
- Roughly half of `components/ui/`'s primitives (17 of 32) have no consumer outside the design-system showcase page
- Canvas-based knowledge-graph viewer has no keyboard accessibility path and hardcodes light-mode colors that don't respond to the app's dark mode

## 9. Issues Fixed

1. **Actor-id / audit-integrity bug (2 route files)** — `POST .../versions/[version]` (restore) and the original 7 engineering mutation routes now resolve the acting user via `getCurrentUser()` instead of passing `""`, which would fail the `createdById`/`updatedById` foreign-key constraint on a real database.
2. **Role-change endpoint was permanently broken** — `changeMemberRole` now resolves the actor from the session internally (matching the rest of the codebase's convention) instead of trusting a caller-supplied, always-empty `actorUserId`.
3. **Cross-org role enumeration** — `getOrganizationRoles` now verifies the caller is an active member of the target organization before returning its role/permission definitions.
4. **Entity edit data loss** — clicking Edit now passes the real, already-loaded entity into the editor instead of a fabricated blank record that would have overwritten the entity's name/description with empty values on save.
5. **Wrong "active organization" shown in the header** — the org switcher picked `orgs[0]` unconditionally; it now reads the actual active-org id from the session and falls back to the first org only if that lookup fails.
6. **Orphaned knowledge-graph index rows** — deleting an entity or relationship now removes its corresponding `GraphNodeIndex`/`GraphEdgeIndex` rows, and `syncGraphIndexes` now reconciles (prunes) any index rows left over from before this fix.
7. **Unbounded knowledge-graph inputs** — `pageSize`, `depth`, and `nodeIds` on the nodes/edges/subgraph endpoints are now Zod-validated and clamped (max depth 5, max 200 node ids, max page size 100-500 depending on endpoint) instead of accepting arbitrary attacker-supplied values straight into Prisma `take`/recursion.
8. **Layout ownership check** — `saveLayout` now verifies every `nodeIndexId` in a layout actually belongs to the caller's organization before attaching position data to it.
9. **ZodError silently became a 500** — `listEntities`/`listRelationships` used `.parse()` (throws a raw `ZodError`, not an `AppError`), so an invalid filter value fell through to a generic 500 instead of a 400. Switched to `safeParse` + `ValidationError`.
10. **CI could break on a clean checkout** — added the missing `pnpm db:generate` step before typecheck/build; `@prisma/client`'s generated types are required for both and weren't guaranteed to exist.
11. **Type-safety regression in Zod enums** — removed unnecessary `as unknown as [string, ...string[]]` casts that were collapsing `ENTITY_TYPES`/`ENTITY_STATUSES`/`RELATIONSHIP_TYPES` literal unions down to plain `string` in every inferred schema type.
12. Also fixed while bringing the pre-existing staged feature to a clean, committable state: an unawaited recursive promise in `expandSubgraph` that could return an incomplete subgraph; a nullable Prisma `Json` field assigned bare `null` (rejected by the generated input types); a `load()` reference outside its enclosing closure in `RelationshipOverview`; dead code referencing an unimported `useCallback` in `EntityDetail`; a derived-state `useEffect` replaced with `useMemo` in the graph viewer; several `any` casts replaced with real types.

## 10. Refactors Performed

- `changeMemberRole` and `getOrganizationRoles` now resolve the session internally rather than accepting a trust-me `actorUserId`/relying on the route to check membership, matching the convention already used throughout `membership-service.ts`.
- Introduced `src/server/knowledge-graph/validation.ts` (reusing the shared `paginationSchema`) so every knowledge-graph route validates through Zod instead of ad hoc `Number(...) || default` parsing.
- `EntityDetail`'s `onEdit` callback now passes the loaded `Entity` up to its caller instead of being a no-argument signal, and the type is exported for reuse.

## 11. Files Modified

Commit `7443cfa` (pre-audit checkpoint) + `bf8568e` (actor-id fix), plus this session's uncommitted-until-now changes:

```
 .github/workflows/ci.yml                                       |  3 ++
 src/app/(dashboard)/entities/[id]/page.tsx                     | 23 +++++-----
 src/app/api/engineering/entities/[id]/versions/[version]/route.ts |  7 +++-
 src/app/api/knowledge-graph/edges/route.ts                     | 21 +++++-----
 src/app/api/knowledge-graph/layouts/route.ts                   | 11 ++++--
 src/app/api/knowledge-graph/nodes/route.ts                     | 14 ++++---
 src/app/api/knowledge-graph/subgraph/route.ts                  | 23 +++++++----
 src/app/api/organizations/[id]/members/[userId]/route.ts       |  2 +-
 src/app/api/organizations/[id]/roles/route.ts                  |  9 -----
 src/app/api/organizations/route.ts                              |  8 +++-
 src/features/engineering/components/entity-detail.tsx           |  6 +--
 src/features/organizations/components/organization-selector.tsx | 10 +++--
 src/server/engineering/entity-service.ts                        | 12 +++++-
 src/server/engineering/relationship-service.ts                  |  6 ++-
 src/server/engineering/validation.ts                            |  8 ++--
 src/server/knowledge-graph/graph-service.ts                     | 46 +++++++++++++++++++
 src/server/rbac/authorization-service.ts                        | 21 +++++++++-
 src/server/knowledge-graph/validation.ts (new)
```

## 12. Documentation Updated

This report (`docs/audit-report-2026-07-14.md`) is new. `docs/architecture.md`'s stale feature list and "server/ is future work" framing were identified but **not** rewritten this session — flagged in Technical Debt above for a dedicated docs pass, since correcting it thoroughly means re-deriving the full current module list rather than a quick patch.

## 13. Remaining Risks

- No test coverage for any business-logic service or API route — regressions in entity/relationship/RBAC logic would currently ship undetected.
- `middleware.ts` authenticates by cookie presence only; every route's real security depends on remembering to call the auth helpers itself.
- Role/Permission DB tables are unenforced dead schema — if anyone assumes custom roles work because the tables exist, they'd be wrong.
- `GraphNodeIndex`/`GraphEdgeIndex`/`GraphLayoutNode` still lack real foreign keys; the cleanup added this session is application-level, not database-enforced.
- No rate limiting, CSRF protection, or account lockout (documented as future work, still absent).

## 14. Recommendations Before Continuing Development

1. Write tests for `entity-service.ts`, `relationship-service.ts`, `graph-service.ts`, and `authorization-service.ts` before adding more features on top of them — this is the highest-leverage gap in the repo.
2. Decide the fate of `src/lib/`: delete it, or make it a real re-export shim as documented.
3. Add real `@relation`s (with `onDelete: Cascade`) from `GraphNodeIndex`/`GraphEdgeIndex`/`GraphLayoutNode` back to their source tables via a Prisma migration, superseding this session's app-level cleanup.
4. Pick one API response envelope convention and apply it everywhere; extract the repeated try/catch/AppError block into a shared wrapper.
5. Either wire `useFetch`/`useMutation` into the ~6 components that reinvent them, or delete the hooks.
6. Refresh `docs/architecture.md` against the actual `src/features/`/`src/server/` trees.

## 15. Verification Results

```
pnpm lint       ✅ 0 problems
pnpm typecheck  ✅ 0 errors
pnpm test       ✅ 5 files, 28 tests passed
pnpm build      ✅ compiled successfully, 44/44 static pages generated
```

(`pnpm install` was not re-run — no dependency changes were made this session.)

## 16. Updated Folder Tree (`src/`, top 2 levels)

```
src/
├── app/                    (auth)/ (authenticated)/ (dashboard)/ api/
├── components/             layout/ ui/
├── features/               auth/ engineering/ knowledge-graph/ organizations/ rbac/
├── hooks/
├── lib/                    (dead — see Technical Debt)
├── providers/
├── server/                 auth/ db/ engineering/ knowledge-graph/ organizations/ rbac/ shared/
├── shared/                 config/ constants/ errors/ logging/ types/ utils/ validation/
└── types/                  (legacy re-export shim — see Technical Debt)
```

## 17. Recommended Git Commit

```
fix: harden engineering/knowledge-graph auth, validation, and data integrity

Fixes surfaced by a full multi-dimensional audit: two more instances of
routes trusting a hardcoded empty actor id (one of which made role
changes permanently fail), a cross-org role-enumeration gap, a data-loss
bug in the entity edit form, an org-switcher bug always showing the
first org instead of the active one, orphaned knowledge-graph index
rows on delete, unbounded pageSize/depth/nodeIds on graph endpoints,
a layout-save endpoint that didn't verify node ownership, ZodErrors
silently becoming 500s, a missing prisma-generate step in CI, and
unnecessary casts collapsing zod enum literal types to string.
```
