# Task 3 — Pattern decision

## Problem
`src/services/budget-calculator.ts` contained four private helpers (`sumExpenses`, `sumIncome`,
`sumExpensesOnDate`, `sumIncomeOnDate`) that differ only in the transaction type and in an optional
date filter. The filter-and-sum code and the date comparison `t.date.slice(0, 10) === dateISO` were
duplicated. Category: duplicated conditionals (maintainability).

## Options evaluated
| Option | Verdict | Reason |
|---|---|---|
| Strategy | Rejected | There is only one daily-budget formula; the helpers are the same sum with different filters, so there are no interchangeable algorithms to select |
| Adapter | Rejected | The only external dependency (IndexedDB) is already wrapped by `db.ts`; the duplication is not an interface mismatch |
| Single parameterised helper, no pattern | Chosen | Removes the duplication directly with the smallest possible change |

## Change (one refactoring)
The four helpers were replaced by `sumAmount(transactions, type, dateISO?)`. `calculateMetrics`
keeps the same signature and behaviour.

## Before / after
| Metric | Before (baseline `c235228`) | After |
|---|---|---|
| Lines in the file | 85 | 75 |
| Functions in the file | 7 | 4 |
| Filter-and-sum helpers | 4 | 1 |
| Date comparisons | 2 | 1 |

## Evidence that acceptance criteria still hold
- `npm test`: 20/20 tests pass before and after; test files were not modified.
- `npm run type-check`, `npm run lint` (0 errors) and `npm run build` pass after the change.
- Mutation checks (inverted date filter, ignored type filter, `floor` replaced by `round`) each make
  tests fail, so the tests are able to detect regressions in the refactored code.
- Raw outputs: `docs/evidence/after-refactor-*.txt`.

## Not addressed
The UTC/local-time mismatch in `todayISO()` is untouched; it is handled in the risk review.
