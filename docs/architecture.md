# Architecture

## Overview

The Morningstar Solution is an Engineering Reality Platform built to verify engineering truth through deterministic, evidence-based reasoning.

## Design Principles

1. **Deterministic Behavior** — Given the same inputs, the system always produces the same outputs.

2. **Explainability** — Every decision, calculation, and transformation must be traceable and explainable.

3. **Traceability** — Every piece of data has a provenance chain linking back to source and logic.

4. **Maintainability** — Code is organized by domain features with strict dependency rules.

5. **Scalability** — The architecture supports horizontal scaling, feature-based code splitting, and stateless API routes.

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Presentation Layer                     │
│              app/ (Next.js App Router pages)              │
├──────────────────────────────────────────────────────────┤
│                    Feature Modules                        │
│         features/<domain>/ (components, hooks, types)     │
├──────────────────────────────────────────────────────────┤
│                   Application Shell                      │
│         components/layout/ (Shell, Sidebar, Header)       │
├──────────────────────────────────────────────────────────┤
│                   Shared Components                      │
│         components/ui/, components/shared/                │
├──────────────────────────────────────────────────────────┤
│                   Shared Packages                         │
│   shared/{types, constants, utils, validation, config,    │
│           errors, logging}/                               │
├──────────────────────────────────────────────────────────┤
│                   Infrastructure                          │
│         providers/, server/, config/                      │
├──────────────────────────────────────────────────────────┤
│                   Data Layer                              │
│         Prisma ORM + PostgreSQL                           │
└──────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Presentation Layer (`app/`)

- Next.js App Router pages and layouts
- Route groups for different application sections
- API route handlers (thin, delegate to feature modules)
- No business logic — route orchestration only

### Feature Modules (`features/<domain>/`)

Each feature module is self-contained with:

- `components/` — feature-specific UI components
- `hooks/` — feature-specific custom hooks
- `types/` — feature-specific type definitions
- `index.ts` — public API barrel export

Feature modules communicate only through shared packages. They never import directly from other feature modules.

### Application Shell (`components/layout/`)

- `Shell` — main layout wrapper (sidebar + header + content + footer)
- `Sidebar` — navigation sidebar with route links
- `Header` — top app bar with breadcrumbs and user menu
- `Breadcrumbs` — breadcrumb navigation trail
- `Footer` — application footer

### Shared UI (`components/ui/`, `components/shared/`)

- `ui/` — primitive components (Button, Input, etc.)
- `shared/` — compound components built from primitives

### Shared Packages (`shared/*/`)

- `types/` — domain contracts and interfaces
- `constants/` — centralized constants (routes, navigation, app metadata)
- `utils/` — pure utility functions
- `validation/` — shared Zod validation schemas
- `config/` — environment configuration access
- `errors/` — enterprise error class hierarchy
- `logging/` — centralized logging utilities

### Infrastructure (`providers/`, `server/`, `config/`)

- `providers/` — React context providers (theme, auth, notifications, feature flags)
- `server/` — server-side infrastructure (future: DB repositories, external integrations)
- `config/` — application-level configuration

## Dependency Rules

```
app/ → features/ → components/layout/ → components/ui/ → shared/
                                                              ↑
providers/ ---------------------------------------------------┘
  server/ ----------------------------------------------------┘
```

- Inward-only dependency flow
- `shared/` has zero internal dependencies
- No circular dependencies
- Feature modules cannot import other feature modules directly

## Module Structure

```
src/
├── app/                         # Next.js App Router
│   ├── (dashboard)/             # Authenticated app route group
│   │   ├── _components/         # Shared dashboard helpers
│   │   ├── layout.tsx           # Dashboard layout with Shell
│   │   ├── dashboard/           # Dashboard page
│   │   ├── documents/           # Document workspace list
│   │   ├── search/              # Full workspace search
│   │   ├── settings/            # Account & preferences
│   │   ├── audit/               # Audit log browser
│   │   ├── knowledge-graph/     # Knowledge Graph page
│   │   └── ...                  # Other feature pages
│   ├── api/                     # API route handlers
│   ├── layout.tsx               # Root layout with providers
│   └── page.tsx                 # Marketing/home page
├── components/
│   ├── layout/                  # Shell, Sidebar, Header, Footer, Breadcrumbs
│   ├── shared/                  # Compound/shared components
│   └── ui/                      # Primitives (Button, Input)
├── features/                    # Feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── documents/
│   └── ...                      # One per domain
├── providers/                   # React context providers
│   ├── index.ts                 # AppProvider composition root
│   ├── theme-provider.tsx
│   ├── error-boundary.tsx
│   └── ...                      # Future: AuthProvider, NotificationProvider
├── shared/                      # Shared packages (zero dependencies)
│   ├── config/
│   ├── constants/
│   ├── errors/
│   ├── logging/
│   ├── types/
│   ├── utils/
│   └── validation/
├── hooks/                       # Shared custom hooks
├── lib/                         # Legacy helpers (re-exports from shared)
├── styles/                      # Global CSS
├── types/                       # Legacy types (re-exports from shared)
└── server/                      # Server-side infrastructure
```

## Data Flow

```
User Action → React Component → Hook/Action → API Route → Validation → Service → Prisma → PostgreSQL
```

## Error Handling

Uses a typed `Result<T, E>` pattern and an `AppError` class hierarchy:

- `AppError` — base error with code, statusCode, details
- `ValidationError` — field-level validation errors
- `NotFoundError` — resource not found
- `UnauthorizedError` — authentication required
- `ForbiddenError` — insufficient permissions
- `ConfigurationError` — missing configuration

## Routing Architecture

The application uses Next.js route groups to separate concerns:

- `/` — Marketing/home page (no sidebar)
- `/dashboard/**` — Authenticated app (with Shell/Sidebar/Header)
- `/api/**` — API route handlers

Route groups:

- `(dashboard)` — wraps all authenticated routes with the Shell layout

## Providers Architecture

The `AppProvider` composes all global providers:

```
AppProvider
├── ErrorBoundary
└── ThemeProvider
    └── FeatureFlagProvider (future)
        └── AuthProvider (future)
            └── NotificationProvider (future)
```

## Security Model

- Environment variables for configuration
- Zod validation on all API inputs
- Strict TypeScript prevents type-level vulnerabilities
- `poweredByHeader: false` in production

## Testing Strategy

- **Unit tests** (Vitest): Pure functions, utilities, validation logic
- **Component tests**: UI components and feature components
- **E2E tests** (Playwright): Critical user flows, page rendering
- **TypeScript**: Compiler as test suite via strict mode
