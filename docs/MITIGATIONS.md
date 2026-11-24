# Task 7 — Mitigation and verification

Branch `assignment-05`. Risks mitigated: **F1** (UTC/local day mismatch) and **F2** (floating-point money), the two
confirmed risks with the highest score in `docs/RISK_REGISTER.md`. Tests were written first and committed while red,
then the fixes were applied.

## Changes

| Change | Files | Risk |
|---|---|---|
| "Today" and every transaction date are converted to the local calendar day (`localDayKey`, `transactionDayKey`); a malformed date falls back to the old behaviour instead of throwing | `src/services/budget-calculator.ts` | F1 |
| History and the recent-transactions list show the local day of a transaction | `src/pages/history-page.ts`, `src/pages/main-page.ts` (one line each) | F1 |
| Money is summed and compared in integer cents (`toCents`, `fromCents`, `sumCents`); results are `cents / 100` | `src/services/budget-calculator.ts` | F2 |
| Test time zone forced to `Asia/Almaty` (UTC+5) so F1 is reproducible on any machine | `vitest.config.ts`, `tsconfig.json`, `AGENTS.md` | F1 |
| 11 new tests: `budget-calculator.regression.test.ts` (6, including an environment guard), `state.test.ts` (3, with `db.ts` mocked), `format.test.ts` (2) | `src/**/*.test.ts` | F1, F2 |

Per-fix diffs: `docs/evidence/task7-f1.diff`, `docs/evidence/task7-f2.diff`.

## Evidence (before / after)

| Stage | `npm test` | Exit code | Evidence file |
|---|---|---|---|
| Before the fixes (new tests added, code unchanged) | 6 failed, 25 passed (31) | 1 | `docs/evidence/task7-0-before-fixes-test.txt` |
| After the F1 fix only | 4 failed, 27 passed (31) | 1 | `docs/evidence/task7-1-after-f1-test.txt` |
| After the F1 and F2 fixes | 6 files, 31 passed | 0 | `docs/evidence/task7-2-final-test.txt` |

The six tests that failed before the fixes: two F1 tests (1000 spent instead of 0; 0 instead of 500) and four F2
tests (balance 0.19999999999999998 instead of 0.2; total 0.30000000000000004 instead of 0.3; spending the exact
remaining balance rejected; 70 of 300 cent amounts rejected). The three F1 tests pass after the first fix; the four
F2 tests pass after the second.

Other checks after the fixes (files `docs/evidence/task7-2-final-*.txt`):

| Check | Result |
|---|---|
| `npm run type-check` | exit 0 |
| `npm run build` | exit 0 |
| `npm run lint` | 0 errors, 1818 warnings, exit 0 |
| `npm run format:check` | 20 files reported, exit 1 |

The lint and format results are dominated by the line-ending problem recorded as F10 (Windows working tree with
`core.autocrlf=true`, repository stored with LF); the baseline had 1618 warnings and 17 files. The composition of the
increase was not analysed. In the assistant's own environment (LF line endings) lint reported 0 warnings and
Prettier accepted all changed files.

Acceptance criteria (`docs/BASELINE.md`): criterion 1 holds (type-check and build exit 0, lint 0 errors); criteria 2–4
are covered by the original 20 tests, which still pass unchanged.

Tests were also checked for sensitivity (assistant environment): reintroducing the UTC key for "today", removing
the malformed-date fallback, and rounding with `floor` instead of `round` each made a test fail.

## Review of AI-generated diffs

The fixes were proposed by the AI assistant as three patch files and applied by the student with `git apply`, after
`git apply --check` and a read of `git diff`. The commit contains only the expected source files
(`history-page.ts`, `main-page.ts`, `budget-calculator.ts`) besides evidence files. The public API of
`calculateMetrics` (signature and result fields) is unchanged.

Student's own review note: *(write 2–3 sentences here about what you personally read and checked in the diffs)*

## Behaviour changes and side effects

- Amounts with more than two decimals are rounded to the nearest cent when summed.
- Existing stored transactions remain valid: their UTC timestamps are parsed as instants and shown/bucketed by local day.
- The check `amount > todayRemaining` in `main-page.ts` still compares plain numbers; after the fix both sides are the
  nearest doubles to decimal values, so it is expected to be correct, but that UI path was not executed.
- All tests now run in UTC+5 by configuration; this is documented in `AGENTS.md`.

## Updated risk scores

| ID | Before (L × I) | After (L × I) | Reason for the residual score |
|---|---|---|---|
| F1 | 2 × 2 = 4 | 1 × 2 = 2 | Fixed and covered by tests; the UI was not run in a browser and other date edge cases (for example changing the device time zone) were not tested |
| F2 | 2 × 2 = 4 | 1 × 2 = 2 | Fixed and covered by tests at calculator and state level; the UI input path and the `main-page.ts` comparison were not executed |

The earlier "planned" residual estimate of 1 in `docs/RISK_REGISTER.md` is replaced by these values, because the UI
was not exercised.

## Not verified

The application in a browser; the `main-page.ts` and `history-page.ts` rendering (only `formatDate` is tested);
behaviour on devices in other time zones; the GitHub Actions workflow.

## Process notes

- The F1 and F2 fixes ended up in one commit (`3364148`) instead of two; the separate evidence files and per-fix
  diffs above preserve the before/after for each.
- The first version of the rounding test in the earlier characterization suite could not tell `floor` from `round`
  (1000 / 3 rounds the same way both ways); the assistant found this by deliberate mutation and replaced the example
  with 2000 / 3 before the suite was delivered (recorded in the AI log).
