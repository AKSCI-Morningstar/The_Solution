# Developer Onboarding Guide

Welcome to **The Morningstar Solution**! This guide will help you get started with development quickly.

## Quick Start (5 minutes)

### Prerequisites

- **Node.js** 22+ ([download](https://nodejs.org/))
- **pnpm** 11+ (`npm install -g pnpm`)
- **PostgreSQL** 14+ (for database features)
- **Git**

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/AKSCI-Morningstar/The_Solution.git
cd The_Solution

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your local database URL and other settings

# 4. Set up the database
pnpm db:generate
pnpm db:push

# 5. Start development server
pnpm dev
```

Visit **http://localhost:3000** to see the app running.

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
├── components/       # Reusable UI components
├── features/         # Feature-specific business logic
├── hooks/            # Custom React hooks
├── lib/              # Library exports & utilities
├── providers/        # Context providers
├── server/           # Server-only utilities (auth, DB, security)
├── shared/           # Shared utilities, types, constants
│   ├── config/       # Configuration & env validation
│   ├── constants/    # App-wide constants
│   ├── errors/       # Error classes & handlers
│   ├── logging/      # Logger utility
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Helper functions
│   └── validation/   # Zod schemas
├── styles/           # Global CSS
├── types/            # Root-level type definitions
└── middleware.ts     # Next.js middleware (auth, security)

tests/
├── unit/             # Vitest unit tests
├── e2e/              # Playwright E2E tests
├── fixtures/         # Test data & mocks
└── setup.ts          # Test environment setup

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Migration history
```

---

## Core Concepts

### Error Handling with `Result<T>`

We use a functional error handling pattern to avoid exceptions:

```typescript
import { ok, err, isOk, isErr } from "@/lib";

// Function returning a Result
function parseUser(data: unknown): Result<User> {
  if (typeof data === "object" && data !== null && "id" in data) {
    return ok(data as User);
  }
  return err(new ValidationError({ user: ["Invalid format"] }));
}

// Usage with type guards
const result = parseUser(userData);
if (isOk(result)) {
  console.log(result.data); // User
} else {
  console.error(result.error); // Error
}
```

### Validation with Zod

Always validate external data at system boundaries (API routes, form submissions):

```typescript
import { z } from "zod";
import { ValidationError } from "@/lib";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type User = z.infer<typeof userSchema>;

// In API route:
const data = userSchema.safeParse(request.body);
if (!data.success) {
  return NextResponse.json(new ValidationError(data.error.flatten().fieldErrors).toJSON(), {
    status: 400,
  });
}
```

### Logging

Use the structured logger for better debugging:

```typescript
import { logger } from "@/lib";

logger.info("User logged in", { userId: "123", email: "user@example.com" });
logger.error("Database connection failed", {
  error: error.message,
  retries: 3,
});

// In development, logs are formatted with timestamps
// In production, logs are JSON lines for aggregators (CloudWatch, Datadog, etc.)
```

### Configuration

Access configuration through the centralized config object:

```typescript
import { config } from "@/lib";

if (config.isDev) {
  console.log("Running in development mode");
}

const appUrl = config.appUrl;
const storagePath = config.ingestionStorageDir;
```

---

## Common Development Tasks

### Adding a New API Route

```typescript
// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ok, err, NotFoundError } from "@/lib";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Your logic here
    const user = await db.user.findUnique({ where: { id: params.id } });

    if (!user) {
      const error = new NotFoundError("User", params.id);
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    logger.error("Failed to fetch user", {
      userId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
```

### Creating a React Component

```typescript
// src/components/user-card.tsx
"use client";

import { cn } from "@/shared/utils";

interface UserCardProps {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
}

/**
 * Displays a user profile card with status indicator.
 * @param props - User card configuration
 */
export function UserCard({
  id,
  name,
  email,
  isActive = true,
}: UserCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow",
        isActive ? "border-green-500" : "border-gray-300",
      )}
    >
      <h3 className="font-semibold">{name}</h3>
      <p className="text-sm text-gray-600">{email}</p>
    </div>
  );
}
```

### Writing Tests

```typescript
// tests/unit/my-utility.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "@/shared/utils";

describe("myFunction", () => {
  it("returns expected result for valid input", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });

  it("handles edge cases", () => {
    expect(myFunction("")).toBe("default");
  });
});
```

Run tests with:

```bash
pnpm test           # Run once
pnpm test:watch     # Watch mode
pnpm test:e2e       # Playwright E2E tests
```

---

## Quality Checks

Before committing, run the full quality suite:

```bash
pnpm lint          # ESLint checks
pnpm lint:fix      # Auto-fix issues
pnpm typecheck     # TypeScript strict checks
pnpm format:check  # Prettier formatting check
pnpm format        # Auto-format code
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
pnpm build         # Production build
```

Or use the provided script:

```bash
./scripts/quality-check.sh
```

---

## Git Workflow

1. **Create a feature branch:**

```bash
git checkout -b feature/my-feature
```

2. **Make commits with clear messages:**

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve timestamp parsing"
```

3. **Push and create a PR:**

```bash
git push origin feature/my-feature
```

4. **PR checklist:**

- [ ] Passes all tests (`pnpm test`)
- [ ] Passes linting (`pnpm lint`)
- [ ] Passes type checking (`pnpm typecheck`)
- [ ] Passes formatting (`pnpm format:check`)
- [ ] Has meaningful commit messages
- [ ] Includes relevant tests

---

## Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Sync schema with database (dev only)
pnpm db:push

# Create and run migrations
pnpm db:migrate

# Open Prisma Studio GUI
pnpm db:studio

# Reset database (⚠️ deletes all data)
pnpm db:reset
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/morningstar?schema=public"

# Node environment
NODE_ENV="development"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Ingestion Pipeline
INGESTION_STORAGE_DIR="./.data/ingestion-storage"
INGESTION_MAX_FILE_SIZE_BYTES="209715200"

# Logging level (debug, info, warn, error)
LOG_LEVEL="debug"

# Security (if needed)
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
```

---

## Debugging Tips

### 1. Enable Debug Logging

```bash
LOG_LEVEL=debug pnpm dev
```

### 2. Inspect Database

```bash
pnpm db:studio
```

### 3. Use VS Code Debugger

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "runtimeVersion": "22",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 4. Check Request IDs

Every request/response includes an `x-request-id` header for tracing:

```
x-request-id: 550e8400-e29b-41d4-a716-446655440000
```

Use this to correlate logs.

---

## Common Issues

### "Cannot find module '@/...'"

- Ensure `tsconfig.json` has correct path aliases
- Run `pnpm install` to install dependencies
- Restart TypeScript server in your editor

### Database connection failed

- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running locally
- Run `pnpm db:push` to sync schema

### Port 3000 already in use

```bash
PORT=3001 pnpm dev
```

---

## Performance Best Practices

1. **Use React.memo for expensive components**

```typescript
export const ExpensiveComponent = React.memo(function Component(props) {
  // ...
});
```

2. **Optimize images**

```typescript
import Image from "next/image";

<Image src="/hero.jpg" alt="Hero" width={1200} height={600} />;
```

3. **Profile with DevTools**

- Open Chrome DevTools → Performance
- Record a session
- Analyze the timeline

---

## Getting Help

- **Documentation:** See [docs/](../docs) folder
- **Coding Standards:** See [docs/coding-standards.md](../docs/coding-standards.md)
- **Issues:** Check [GitHub Issues](https://github.com/AKSCI-Morningstar/The_Solution/issues)
- **PRs:** Review [Pull Requests](https://github.com/AKSCI-Morningstar/The_Solution/pulls)

---

## Next Steps

1. ✅ Finish setup (you're here!)
2. Read [docs/coding-standards.md](../docs/coding-standards.md)
3. Explore [src/app/page.tsx](../src/app/page.tsx) to understand app structure
4. Run `pnpm test` to verify everything works
5. Start with a small feature or bug fix
6. Open a PR and ask for review

Happy coding! 🚀
