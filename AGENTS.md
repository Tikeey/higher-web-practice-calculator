# AGENTS.md

Instructions for AI coding agents working in this repository.

## Purpose

Expense calculator ("Калькулятор расходов"): a TypeScript single-page app. The user sets a starting balance and an end date; the app computes a daily budget, tracks expenses and income, and stores history in the browser (IndexedDB). There is no backend.

## Architecture

- `src/main.ts` → `src/App.ts`: entry point and a simple router (routes: `start`, `main`, `history`, `edit`).
- `src/pages/*.ts`: pages; build the DOM by hand.
- `src/components/*.ts`: reusable UI widgets (`input`, `date-input`, `period-select`).
- `src/services/budget-calculator.ts`: the business logic, `calculateMetrics(budget, transactions)`. Keep it free of DOM and storage code.
- `src/utils/state.ts`: module-level state, subscribe/emit, add/remove transactions.
- `src/utils/db.ts`: IndexedDB access via `idb`. Only this file touches IndexedDB.
- `src/models/schemas.ts`, `src/utils/validation.ts`: Zod schemas and input parsing.
- `src/utils/format.ts`: money, date and label formatting.

## Setup

```bash
npm ci
```

Node.js LTS is required (CI uses Node 24).

## Safe commands (may run without asking)

```bash
npm ci
npm run type-check
npm run lint
npm run format:check
npm run build
npm run dev          # local dev server on http://localhost:3000
npm audit            # read-only report
git status
git diff
git log
```

## Commands that need human approval first

- Anything that changes dependencies: `npm install <pkg>`, `npm update`, `npm audit fix`, edits to `package.json` or `package-lock.json`.
- `npm run format` and `npm run lint:fix` on the whole project (see "Line endings" below).
- Any change to `.github/workflows/`.

## Forbidden actions

- Never read, create, print or commit secrets, tokens, `.env` files or real personal data.
- Never deploy or publish (no GitHub Pages deploy, no `npm publish`).
- Never run destructive commands: `rm -rf`, `git reset --hard`, `git push --force`, `git clean -fd`, deleting branches or tags (especially the `baseline` tag).
- Never use `npm audit fix --force`.
- Never add or upgrade dependencies without an explicit human decision.
- Never edit files outside this repository.

## Coding conventions

- TypeScript in strict mode; no `any` without a comment explaining why.
- Prettier is the source of truth: tabs, single quotes, semicolons, trailing commas, print width 100, arrow parentheses omitted for single parameters. (`.editorconfig` says spaces; it contradicts Prettier and the existing code; follow Prettier.)
- Keep functions small and pure where possible; business rules belong in `src/services/`, not in pages.
- User-facing text is Russian; code, identifiers and comments are English.

## Line endings

The repository stores LF (`prettier.config.js`: `endOfLine: 'lf'`). On Windows with `core.autocrlf=true` the working tree has CRLF, so `npm run lint` and `npm run format:check` print warnings for almost every file. Do not "fix" this by reformatting the whole project; change only the files your task needs.

## Test expectations

- Tests use Vitest; run them with `npm test`. Test files live next to the code as `*.test.ts`.
- Every change in `src/services/` or in validation must come with a new or updated test. Run `npm test`, `npm run type-check` and `npm run build` before finishing; `npm run lint` must report 0 errors.
- Some tests are marked "current behaviour": they pin down existing behaviour (for example, a negative balance is clamped to 0). If you change that behaviour on purpose, update the test and say so in the commit message.
- Never claim a command passed unless it was actually run; report the exact command and its result.

## Review gates

- Every AI-proposed diff is reviewed by a human before it is committed.
- One task = one branch commit with a clear message.
- Do not merge to `main` without human approval.
- If something is unclear or risky, stop and ask instead of guessing.
