# Development Workflow

## Quick Start

```bash
git clone https://github.com/AKSCI-Morningstar/The_Solution.git
cd The_Solution
pnpm install
cp .env.example .env
pnpm dev
```

## Daily Development

### Starting Work

1. Pull latest `main`:

   ```bash
   git checkout main && git pull
   ```

2. Create a feature branch:

   ```bash
   git checkout -b feature/my-feature
   ```

3. Start the dev server:

   ```bash
   pnpm dev
   ```

4. Open http://localhost:3000

### During Development

- Write code following [coding standards](coding-standards.md)
- Run tests frequently:
  ```bash
  pnpm test:watch     # Unit tests in watch mode
  ```
- Check types as you go:
  ```bash
  pnpm typecheck
  ```

### Before Pushing

Run the full quality suite:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
```

Or run everything in sequence:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm format:check && pnpm build
```

### Committing

Husky runs lint-staged automatically on commit, which will:

- Run ESLint with auto-fix on staged `.ts`, `.tsx`, `.js`, `.jsx` files
- Run Prettier on staged files

If lint-staged fails, fix the issues before committing.

### Opening a PR

1. Push your branch:

   ```bash
   git push -u origin feature/my-feature
   ```

2. Open a PR against `main`
3. Fill in the PR template completely
4. Ensure CI passes
5. Request review

## Database Development

When working with Prisma:

```bash
pnpm db:generate    # Regenerate Prisma client after schema changes
pnpm db:push        # Push schema changes to dev database
pnpm db:migrate     # Create migration files
pnpm db:studio      # Visual database browser
```

## Adding New Features

1. Create feature directory: `src/features/<feature-name>/`
2. Add components in `components/`
3. Add feature-specific hooks in `hooks/`
4. Add types in `types/`
5. Add validation schemas alongside types
6. Create API routes in `src/app/api/<feature>/`
7. Write unit tests in `tests/unit/`
8. Write E2E tests in `tests/e2e/`
9. Export public API from `index.ts`

## Debugging

- **TypeScript errors**: Run `pnpm typecheck` for detailed errors
- **ESLint errors**: Run `pnpm lint` for detailed errors
- **Build errors**: Run `pnpm build` for Next.js build output
- **Runtime errors**: Check the browser console and terminal output
- **Database issues**: Use `pnpm db:studio` to inspect data

## Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in the values for your local setup
3. Never commit `.env` files
4. Document any new variables in `.env.example`

## Performance

- Use React DevTools Profiler for component performance
- Use Next.js build analysis for bundle size
- Keep components small and focused
- Avoid unnecessary re-renders with proper memoization
- Use dynamic imports for heavy components
