# Baseline — Expense Calculator (Assignment #05)

Baseline commit: `c235228` (tag `baseline`), branch `main` of the fork.

## Repository map

| Area | Files | Role |
|---|---|---|
| Entry point | `index.html`, `src/main.ts`, `src/App.ts` | `main.ts` calls `initApp()` on DOMContentLoaded; `App.ts` subscribes to state and renders one of four routes (start, main, history, edit) |
| Pages | `src/pages/*.ts` | Build the DOM by hand with `innerHTML` and DOM APIs; call `calculateMetrics` and the state functions directly |
| Components | `src/components/{input,date-input,period-select}.ts` | Reusable UI widgets |
| Business logic | `src/services/budget-calculator.ts` | `calculateMetrics(budget, transactions)`: balance, days remaining, daily budget, today remaining, averages |
| State | `src/utils/state.ts` | Module-level mutable state, subscribe/emit, navigation, add/remove transactions (expense checked against balance) |
| Persistence | `src/utils/db.ts` | IndexedDB via `idb` (stores: `budget`, `transactions`) |
| Validation | `src/models/schemas.ts`, `src/utils/validation.ts` | Zod schemas; `parseAmount` |
| Formatting | `src/utils/format.ts` | Money, dates, day labels, transaction id |
| Build / tooling | `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `prettier.config.js`, `.editorconfig` | Vite 7, TypeScript 5.9, ESLint 9, Prettier 3 |
| CI | `.github/workflows/deploy.yml` | Manual (`workflow_dispatch`) deploy to GitHub Pages: `npm ci`, `npm run build` |
| Tests | none | No test script, no framework, no test files |

## Commands

| Purpose | Command |
|---|---|
| Install | `npm ci` |
| Dev server | `npm run dev` (http://localhost:3000) |
| Type check | `npm run type-check` |
| Lint | `npm run lint` |
| Format check | `npm run format:check` |
| Build | `npm run build` |
| Dependency audit | `npm audit` |

## Acceptance criteria (must stay true after all changes)

1. `npm run type-check` and `npm run build` finish with exit code 0, and `npm run lint` reports 0 errors.
2. For a budget of 10000 ending in 10 calendar days (today inclusive) with no transactions, `calculateMetrics` returns `daysRemaining = 10` and `dailyBudget = 1000`. (To be confirmed by a test.)
3. Adding an expense of X (within the balance) raises `totalSpent` by X and lowers `todayRemaining` by X. (To be confirmed by a test.)
4. Validation rejects a non-positive amount and an end date earlier than the start date. (To be confirmed by a test.)

## Baseline results

See `docs/evidence/baseline-*.txt` and `docs/evidence/environment.txt`.
Note: results were produced on Windows with `core.autocrlf=true`; line endings in the working tree are CRLF while the repository stores LF (`git ls-files --eol`: `i/lf w/crlf`). This causes the lint/prettier warnings recorded in the evidence files.
