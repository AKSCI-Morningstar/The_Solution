# Module Boundaries & Dependency Rules

## Architectural Layers

The application follows a strict layered architecture. Dependencies flow inward only. No layer may depend on a layer outside itself.

```
┌──────────────────────────────────────────────────────┐
│                   Presentation                       │
│         app/ (pages, layouts, route handlers)        │
├──────────────────────────────────────────────────────┤
│                   Feature Modules                    │
│         features/<domain>/ (components, hooks)       │
├──────────────────────────────────────────────────────┤
│                   Application Shell                  │
│         components/layout/ (Shell, Sidebar, etc.)    │
├──────────────────────────────────────────────────────┤
│                   Shared Components                  │
│         components/ui/, components/shared/           │
├──────────────────────────────────────────────────────┤
│                   Shared Packages                    │
│   shared/{types,constants,utils,validation,config,   │
│           errors,logging}/                           │
├──────────────────────────────────────────────────────┤
│                   Infrastructure                     │
│         providers/, server/, config/                 │
└──────────────────────────────────────────────────────┘
```

## Dependency Direction

| Layer                | May Depend On                                               |
| -------------------- | ----------------------------------------------------------- |
| `app/` (pages)       | `features/`, `components/`, `shared/`, `providers/`         |
| `features/*/`        | `shared/`, `components/ui/`, `components/shared/`, `hooks/` |
| `components/layout/` | `shared/`, `components/ui/`                                 |
| `components/ui/`     | `shared/utils/` (only `cn`)                                 |
| `shared/*/`          | Nothing within the project                                  |
| `providers/`         | `shared/`                                                   |
| `server/`            | `shared/`                                                   |
| `hooks/`             | `shared/`                                                   |

## Forbidden Dependencies

- `components/ui/` must NOT import from `features/`
- `features/` must NOT import from another `features/*` module directly (use `shared/` for inter-module communication)
- `shared/` must NOT import from `app/`, `features/`, or `components/`
- `app/` must NOT contain business logic (only routing, layouts, API handlers that delegate to server/)

## Module Communication

Feature modules communicate through:

1. **Shared types** in `shared/types/` — domain contracts
2. **Shared constants** in `shared/constants/` — route names, nav definitions
3. **Shared validation** in `shared/validation/` — Zod schemas
4. **Shared utils** in `shared/utils/` — pure functions

## File Naming

| Directory          | Convention     | Example            |
| ------------------ | -------------- | ------------------ |
| `features/<name>/` | `kebab-case`   | `knowledge-graph/` |
| Feature components | `PascalCase`   | `EntityCard.tsx`   |
| Feature hooks      | `camelCase`    | `use-entities.ts`  |
| Feature types      | `camelCase`    | `types.ts`         |
| UI primitives      | Component name | `button.tsx`       |
| Layout components  | Component name | `sidebar.tsx`      |

## Barrel Exports

Each module directory should have an `index.ts` that exports its public API. Internal implementation details should not be exported.
