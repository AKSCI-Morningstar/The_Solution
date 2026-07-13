# Coding Standards

## TypeScript

- **Strict mode always** — `strict: true` in tsconfig, no exceptions
- **No `any`** — use `unknown` if the type is truly unknown, then narrow
- **No implicit returns** in functions that might return `undefined`
- **Explicit return types** on exported functions
- **No type assertions** (`as`) unless absolutely necessary with a comment explaining why
- **Prefer interfaces** over type aliases for object shapes
- **Discriminated unions** for state management

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Bad
type User = {
  id: string;
  name: string;
  email: string;
};
```

## Naming Conventions

| Element          | Convention             | Example                  |
| ---------------- | ---------------------- | ------------------------ |
| Files            | `kebab-case`           | `use-mutation.ts`        |
| Components       | `PascalCase`           | `Button.tsx`             |
| Functions        | `camelCase`            | `formatTimestamp()`      |
| Constants        | `UPPER_SNAKE_CASE`     | `APP_NAME`               |
| Types/Interfaces | `PascalCase`           | `TimestampRecord`        |
| Zod schemas      | `camelCase` + `Schema` | `timestampSchema`        |
| React hooks      | `use` prefix           | `useMutation()`          |
| CSS classes      | Tailwind utilities     | `className="flex gap-4"` |

## Component Guidelines

- **Functional components only** — no class components
- **Use `"use client"` directive** only when the component needs browser APIs or React hooks
- **Co-locate styles** — use Tailwind utility classes, no separate CSS files per component
- **Component composition** — prefer composition over prop drilling
- **Forward refs** for reusable UI primitives

```tsx
// Good: Simple, focused component
export function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return <span className={status === "active" ? "text-green-600" : "text-red-600"}>{status}</span>;
}
```

## File Organization

1. Imports (React → third-party → local)
2. Type definitions / interfaces
3. Component or function exports
4. Helper functions (not exported)

```typescript
import { useState } from "react";
import { z } from "zod";

import { cn } from "@/lib/utils";
import type { TimestampRecord } from "@/types";

interface Props {
  record: TimestampRecord;
}

export function RecordCard({ record }: Props) {
  // component logic
}

function formatDate(date: Date): string {
  // helper — not exported
  return date.toLocaleDateString();
}
```

## Error Handling

- Use `Result<T, E>` types for business logic
- API routes return structured error responses with status codes
- Never swallow errors silently
- Log errors with context for debugging

## Validation

- Validate all external data at system boundaries (API routes, form submissions)
- Use Zod schemas for runtime validation
- Derive TypeScript types from Zod schemas

```typescript
import { z } from "zod";

export const timestampSchema = z.object({
  label: z.string().min(1).max(255),
  value: z.coerce.date(),
});

export type TimestampInput = z.infer<typeof timestampSchema>;
```

## Testing

- **Unit tests** for all pure functions and utilities
- **Component tests** for UI components with user interactions
- **E2E tests** for critical user flows
- **One assertion concept per test** — keep tests focused
- **Descriptive test names** that explain the expected behavior

```typescript
// Good
it("clamps value to minimum when below range", () => {
  expect(clamp(-5, 0, 10)).toBe(0);
});
```

## Git

- Descriptive commit messages following Conventional Commits
- Small, focused commits — one logical change per commit
- No generated files, secrets, or build artifacts in commits
- Branch names: `feature/`, `fix/`, `chore/`, `docs/`

## Code Quality

- Zero tolerance for TypeScript errors
- Zero tolerance for ESLint errors
- Format all code with Prettier before committing
- Run the full quality suite before pushing
