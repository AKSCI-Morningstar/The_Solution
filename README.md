# The Morningstar Solution

**Engineering Reality Platform** — verifying engineering truth through deterministic, evidence-based reasoning.

## Architecture

Built on Next.js 16 with the App Router, TypeScript, Tailwind CSS, and Prisma ORM. Designed for deterministic behavior, explainability, traceability, maintainability, and scalability.

## Tech Stack

| Layer       | Technology                       |
| ----------- | -------------------------------- |
| Frontend    | Next.js 16, React 19, TypeScript |
| Styling     | Tailwind CSS 4                   |
| Validation  | Zod                              |
| Database    | PostgreSQL via Prisma ORM        |
| Testing     | Vitest (unit), Playwright (e2e)  |
| Linting     | ESLint 9, Prettier               |
| Git Hooks   | Husky, lint-staged               |
| Package Mgr | pnpm                             |

## Folder Structure

```
/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   │   ├── api/          # API route handlers
│   │   ├── dashboard/    # Dashboard page
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # Reusable UI components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Primitive UI components (Button, Input)
│   ├── features/         # Feature modules (domain-specific logic)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Shared utilities, constants, helpers
│   ├── styles/           # Global CSS
│   └── types/            # TypeScript type definitions and validators
├── prisma/               # Prisma schema and migrations
├── tests/
│   ├── unit/             # Vitest unit tests
│   ├── e2e/              # Playwright E2E tests
│   └── fixtures/         # Test fixtures
├── docs/                 # Project documentation
├── scripts/              # Build and utility scripts
├── public/               # Static assets
├── .github/              # GitHub config (CI, templates)
└── .vscode/              # VS Code workspace config
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 11+
- PostgreSQL (for database features)

### Installation

```bash
git clone https://github.com/AKSCI-Morningstar/The_Solution.git
cd The_Solution
pnpm install
cp .env.example .env
```

### Development

```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm build        # Production build
pnpm start        # Start production server
```

### Testing

```bash
pnpm test         # Run unit tests
pnpm test:watch   # Run unit tests in watch mode
pnpm test:e2e     # Run Playwright E2E tests
```

### Linting & Formatting

```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Format with Prettier
pnpm format:check # Check formatting
pnpm typecheck    # TypeScript type checking
```

### Database

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio
```

## Code Conventions

- **TypeScript strict mode** — no `any`, no exceptions
- **Functional components** — no class components
- **Named exports** — prefer named exports over default exports (except pages/layouts)
- **File naming** — `kebab-case` for files, `PascalCase` for components
- **Absolute imports** — use `@/` path alias
- **Validation** — Zod schemas for runtime validation
- **Result types** — use `Result<T>` for error handling instead of throwing

See [docs/coding-standards.md](docs/coding-standards.md) for full guidelines.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and contribution guidelines.

## License

Proprietary — AKSCI
