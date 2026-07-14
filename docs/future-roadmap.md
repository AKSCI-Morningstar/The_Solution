# Future Roadmap

## Phase 1: Foundation (Complete)

- [x] Next.js 16 + TypeScript + Tailwind CSS 4
- [x] Enterprise project structure and tooling
- [x] ESLint, Prettier, Husky, lint-staged
- [x] Vitest (unit) + Playwright (e2e) testing
- [x] Prisma ORM with PostgreSQL schema
- [x] Shared packages (types, constants, utils, validation, errors, logging, config)
- [x] Application shell (Sidebar, Header, Breadcrumbs, Footer)
- [x] Route group architecture with feature placeholders
- [x] Global providers (Theme, ErrorBoundary)
- [x] CI/CD pipeline

## Phase 2: Authentication & Authorization (Complete)

- [x] User authentication (email/password)
- [x] User registration with validation
- [x] Secure password hashing (scrypt)
- [x] Session management (create, validate, renew, destroy)
- [x] Password reset flow (request + reset)
- [x] Auth middleware for API protection
- [x] Auth guard for client components
- [x] Authentication audit events
- [x] Login, register, forgot/reset password UI
- [x] Organization management (multi-tenancy)
- [x] Role-based access control (RBAC) - `resource:action` permissions enforced across every domain (organization, members, roles, settings, rules, engineering, documents, knowledge graph, evidence, contradictions); see `docs/security.md`
- [ ] OAuth / SSO integration
- [ ] Email verification (`User.isEmailVerified` exists on the model; nothing enforces it yet)
- [ ] MFA support

## Phase 3: Database & API Layer

- [x] Expanded Prisma schema (users, sessions, verification tokens, auth events, organizations, RBAC, engineering, ingestion, rules, evidence, contradictions)
- [x] Prisma client singleton with hot-reload protection
- [x] Auth API routes (register, login, logout, me, forgot-password, reset-password)
- [x] Input validation via Zod schemas at every API route (not centralized middleware - each route validates its own request shape)
- [x] Pagination, sorting, filtering utilities (shared `paginationSchema`, used consistently across list endpoints)
- [ ] Repository pattern for database access (services call Prisma directly; not adopted as an explicit layer)

## Phase 4: Core Domain Modules (Complete)

- [x] Dashboard with live org-scoped summary data
- [x] Document management with versioning (Engineering Ingestion Pipeline - see `docs/ingestion-pipeline.md`)
- [x] Engineering Knowledge Graph (see `docs/architecture.md`, `src/server/knowledge-graph/`)
- [x] Evidence Resolution Engine (see `docs/evidence-resolution-engine.md`)
- [x] Rule Engine with deterministic execution (see `docs/rule-engine.md`) - no AI, no probabilistic reasoning, every gap in evidence surfaces explicitly rather than being inferred
- [ ] Entity Resolution Service (extracted entities are soft-linked to canonical entities by natural key only; no dedicated resolution/merge service exists yet)

## Phase 5: Advanced Features

- [x] Contradiction Detection Engine (see `docs/contradiction-engine.md`)
- [x] Search (full-text via Postgres `contains`/`insensitive` filtering across entities, documents, organizations, users - not vector search)
- [ ] Change Impact Simulation
- [ ] Engineering Reality Engine
- [ ] Reports (generation, scheduling)
- [ ] Notifications (in-app, email)

## Phase 6: AI Integration

- [ ] AI Workspace
- [ ] AI-assisted evidence analysis
- [ ] Natural language search
- [ ] Automated rule suggestion
- [ ] Anomaly detection

Explicitly out of scope for every module built so far: the Rule Engine, Evidence Resolution Engine, and Contradiction Engine are all deterministic by design - no LLM calls, no confidence-scored inference. AI integration remains a distinct, not-yet-started future phase.

## Phase 7: Platform Scale

- [x] Audit logging (org-scoped `AuditLog` table for Rule Engine mutations; `AuthEvent` for authentication)
- [x] Rate limiting - login only, in-process, single-instance (see `docs/security.md`); registration/forgot-password and a distributed (multi-instance) implementation remain future work
- [x] Structured logging with environment-aware output (JSON in production, human-readable in development) and request-ID correlation
- [ ] Performance optimization (query-level fixes have been made ad hoc - e.g. batched graph traversal - not a dedicated optimization pass)
- [ ] Multi-region support
- [ ] Advanced monitoring and observability (structured logs and a DB-backed health check exist; no metrics/tracing backend is wired up)
- [ ] API versioning
- [ ] Distributed rate limiting and throttling (current login limiter is in-process only)

## Architecture Migration Path

As features are implemented, the architecture will grow:

1. Feature modules get their own `server/` subdirectory for business logic
2. API routes delegate to feature module services
3. Database access moves to feature-level repositories
4. Cross-cutting concerns move to shared infrastructure packages
5. Providers evolve to include auth, notification, and feature flag contexts
