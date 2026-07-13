#!/bin/bash
# Full quality check script
echo "Running lint..."
pnpm lint
if [ $? -ne 0 ]; then echo "Lint failed"; exit 1; fi

echo "Running typecheck..."
pnpm typecheck
if [ $? -ne 0 ]; then echo "Typecheck failed"; exit 1; fi

echo "Running tests..."
pnpm test
if [ $? -ne 0 ]; then echo "Tests failed"; exit 1; fi

echo "Checking format..."
pnpm format:check
if [ $? -ne 0 ]; then echo "Format check failed"; exit 1; fi

echo "Building..."
pnpm build
if [ $? -ne 0 ]; then echo "Build failed"; exit 1; fi

echo "All checks passed!"
