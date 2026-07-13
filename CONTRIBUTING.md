# Contributing to The Morningstar Solution

Thank you for considering contributing to The Morningstar Solution.

## Development Workflow

1. **Branch from `main`** — use descriptive branch names:
   - `feature/add-user-auth`
   - `fix/resolve-timestamp-validation`
   - `chore/update-dependencies`

2. **Make changes** following our [coding standards](docs/coding-standards.md).

3. **Write tests** — every feature and bug fix needs tests.

4. **Run quality checks** before pushing:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm format:check
   ```

5. **Commit** with clear messages following [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add timestamp validation`
   - `fix: resolve date parsing edge case`
   - `docs: update architecture overview`
   - `chore: update dependencies`

6. **Open a PR** using the provided PR template. Fill in all sections.

## Branch Protection

- `main` requires PR review
- All CI checks must pass (lint, typecheck, tests, build)
- Squash merge preferred

## Code Review Standards

- Code must be readable and self-documenting
- No `any` types
- No TODO placeholders in production code
- All public APIs must be documented
- Error handling must be explicit

## Reporting Issues

Use the GitHub issue templates for bug reports and feature requests. Include:

- Reproduction steps for bugs
- Motivation and constraints for features
- Engineering trade-offs considered
