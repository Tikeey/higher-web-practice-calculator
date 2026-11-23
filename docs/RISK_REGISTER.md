# Tasks 4 and 5 — Risk review and risk register

Scope: branch `assignment-05` at commit `9becd07` (after the Task 3 refactoring).

Method: AI-assisted read-only review (Claude, Anthropic) on a fresh clone; the repository was not modified
during the review (`git status` showed 0 changed files). The student re-ran the evidence commands on his own
machine (Windows, time zone UTC+5, Node v26.13.1); outputs are in `docs/evidence/risk-*.txt`.
Status values: **confirmed** = shown by code and/or reproducible output; **plausible/unverified** = reasonable
but not shown by execution; **unsupported** = the evidence contradicts the claim.

## Part A — Findings and classification (Task 4)

| ID | Category | Candidate finding | Status | Evidence |
|---|---|---|---|---|
| F1 | correctness | "Today" is the UTC date, days are counted in local time; in UTC+5 the daily limit is wrong between 00:00 and 05:00 | Confirmed | `src/services/budget-calculator.ts:16` (`toISOString`) vs `:40` (`startOfDay(new Date())`); transactions stamped with `toISOString()` in `src/pages/main-page.ts:229` and `src/pages/edit-budget-page.ts:140`. `docs/evidence/risk-repro-output.txt`: at 02:30 local with 1000 spent the previous afternoon: todaySpent=1000, dailyBudget=1111, todayRemaining=111; at 12:00: 0 / 1000 / 1000 |
| F2 | correctness | Money is a float; spending exactly the remaining balance can be rejected | Confirmed (logic level) | UI accepts decimals (`inputMode: 'decimal'`, `src/components/input.ts`), check `tx.amount > totalBalance` in `src/utils/state.ts`. Output: balance 0.3 after spending 0.1 is 0.19999999999999998, so 0.2 is rejected. Assistant simulation: 2814 of 9901 random cent amounts rejected (28.4%), 0 of 19643 whole-number cases |
| F3 | correctness | After deleting an income, a negative balance is shown as 0 | Confirmed (calculator level) | `removeTransaction` in `src/utils/state.ts` has no balance check; `Math.max(..., 0)` in `calculateMetrics`. Output: balance 300 with income+expense; 0 after deleting the income (arithmetic value −200) |
| F4 | dependency | Vulnerable dependency versions | Confirmed present; exploitability unverified | `docs/evidence/baseline-audit.txt`: 14 findings (7 moderate, 7 high). `docs/evidence/risk-audit-prod.txt`: 5 high with `--omit=dev` (nanoid, postcss, source-map-js, vite, zod). The zod advisory concerns oversized collections (the schemas contain none); the vite advisories concern the dev server |
| F5 | agent operations | CI deploys without tests, lint or type-check | Confirmed | `.github/workflows/deploy.yml`: trigger `workflow_dispatch`, steps `npm ci` and `npm run build` only |
| F6 | security | GitHub Actions pinned to major tags, not commit SHAs | Plausible/unverified | `deploy.yml`: `actions/checkout@v4`, `setup-node@v4`, `configure-pages@v4`, `upload-pages-artifact@v3`, `deploy-pages@v4`; permissions are minimal (`contents: read`, `pages: write`, `id-token: write`) |
| F7 | security | XSS through `innerHTML` | Unsupported | `docs/evidence/risk-innerhtml.txt`: 11 assignments; seven are `''`, four are constant SVG string literals; no interpolation of user data; no `insertAdjacentHTML` or `outerHTML` |
| F8 | correctness | A startup failure (e.g. IndexedDB unavailable) leaves a blank page | Plausible/unverified | `src/App.ts` calls `void loadInitial()`; `loadInitial` in `src/utils/state.ts` has no error handling; while `loaded` is false `render` clears the root. Not run in a browser |
| F9 | agent operations | Setup is not reproducible and the README is inaccurate | Confirmed | No `engines` field and no `.nvmrc`; CI uses Node 24, the review machines used Node 22 and 26; README says `npm install` (not `npm ci`), does not mention tests, and its structure omits `src/pages/edit-budget-page.ts` |
| F10 | maintainability | Contradictory tooling configuration | Confirmed | `.editorconfig` (spaces) vs `prettier.config.js` (tabs) and the code; obsolete `.eslintignore` (ESLint 9 warning); no `.gitattributes`, giving 1618 lint warnings on Windows (`docs/evidence/baseline-lint.txt`) |
| F11 | security / dependency | `npm` warns about the `esbuild` install script | Plausible/unverified, informational | Warning text from `npm ci`; the script was not inspected, so it is not claimed to be a risk |

Not executed: the app in a browser; the functions of `state.ts` end to end (the `amount > totalBalance` check was
reproduced next to the real `calculateMetrics`); an IndexedDB failure; the GitHub Actions workflow.

## Part B — Risk register (Task 5)

Scales. Likelihood: 1 = needs a rare condition, 2 = possible in normal use, 3 = expected in normal use.
Impact: 1 = process or cosmetic effect, 2 = wrong information or a valid action is blocked, 3 = data loss,
compromise of a developer machine, or failure of the main function. Score = likelihood × impact (1–9).
F7 (unsupported) and F11 (informational) are not scored.

| ID | Category | Component | Status | L | I | Score | Rank |
|---|---|---|---|---|---|---|---|
| F1 | correctness | `budget-calculator.ts`, `main-page.ts`, `edit-budget-page.ts` | Confirmed | 2 | 2 | 4 | 1 (tie) |
| F2 | correctness | `budget-calculator.ts`, `state.ts`, `validation.ts` | Confirmed | 2 | 2 | 4 | 1 (tie) |
| F4 | dependency | `package.json`, `package-lock.json` | Confirmed (present) | 1 | 3 | 3 | 3 |
| F10 | maintainability | `.editorconfig`, `.eslintignore`, repo root | Confirmed | 3 | 1 | 3 | 3 |
| F3 | correctness | `state.ts`, `budget-calculator.ts` | Confirmed | 1 | 2 | 2 | 5 |
| F5 | agent operations | `.github/workflows/deploy.yml` | Confirmed | 1 | 2 | 2 | 5 |
| F9 | agent operations | `package.json`, `README.md` | Confirmed | 2 | 1 | 2 | 5 |
| F6 | security | `.github/workflows/deploy.yml` | Plausible | 1 | 2 | 2 | not ranked |
| F8 | correctness | `App.ts`, `state.ts` | Plausible | 1 | 2 | 2 | not ranked |

Top two confirmed risks for corrective action (Task 7): **F1** and **F2**. They are the only confirmed risks with
a score of 4, both have reproducible evidence, and both can be fixed with a small change and tests.

### Details

**F1 — UTC/local day mismatch.** Cause: `todayISO()` uses the UTC date while `daysRemaining` uses the local
calendar day, and transactions are stamped with the UTC time. Event: the app is opened in the first hours after
local midnight (up to 5 hours a day in UTC+5). Consequence: the daily limit and the amount left for today are
wrong (111 shown instead of 1000 in the reproduction). Likelihood 2: needs night-time use after a day with
spending. Impact 2: wrong information, no data loss.
Mitigation: derive the day key from the local calendar date for both "today" and every transaction (parse stored
timestamps as instants, which also keeps existing data valid). Owner: T1key. Verification: tests that fail
before and pass after the change, using the 02:30 UTC+5 case; full checks re-run. Residual risk (planned
estimate, to be updated in Task 7): 1.

**F2 — Float money.** Cause: amounts are binary floats and the validation compares with `>`. Event: a user
spends exactly the remaining balance in decimal amounts. Consequence: a valid expense is rejected with the
message that the amount exceeds the balance. Likelihood 2: decimals are allowed, the situation is not common.
Impact 2: a valid action is blocked. Mitigation: do the arithmetic in integer minor units or round to cents
before comparing. Owner: T1key. Verification: tests for the 0.3 − 0.1 case and a range of cent amounts, failing
before and passing after. Residual risk: 1.

**F4 — Dependencies.** Cause: pinned versions with published advisories. Event: the dev server is exposed or a
crafted input reaches the build. Consequence: file disclosure or denial of service on a developer machine.
Likelihood 1: the app is a client-only static site and the affected code is mostly build tooling. Impact 3.
Mitigation: upgrade zod (4.6.7), vite (7.3.8) and typescript-eslint (8.73.0) after approval, as the audit lists
them as non-major fixes; keep the dev server on localhost. Owner: T1key. Verification: `npm audit --omit=dev`,
tests, build. Residual risk: remaining transitive advisories.

**F10 — Tooling configuration.** Cause: no `.gitattributes`, contradictory `.editorconfig`. Event: any Windows
checkout or lint run. Consequence: noisy warnings hide real problems. Likelihood 3, impact 1. Mitigation: add
`.gitattributes` (`* text=auto eol=lf`), align `.editorconfig` with Prettier, remove `.eslintignore`. Owner:
T1key. Verification: `npm run lint` and `npm run format:check` on a fresh Windows clone. Residual risk: low.

**F3 — Hidden negative balance.** Cause: no check in `removeTransaction` and a clamp to 0. Event: an income is
deleted after expenses that relied on it. Consequence: overspending is shown as 0. Likelihood 1, impact 2.
Mitigation: block such deletions or show the negative balance. Owner: T1key. Verification: test of the
income-deletion case. Residual risk: low.

**F5 — CI without checks.** Cause: the workflow only builds. Event: a manual deploy of a change that fails
tests or the type-check. Consequence: a broken version is published. Likelihood 1 (manual trigger), impact 2.
Mitigation: add a workflow that runs type-check, lint, tests and build on every push and pull request.
Owner: T1key. Verification: a workflow run (not executable locally). Residual risk: low.

**F9 — Setup not reproducible.** Cause: no pinned Node version and an outdated README. Event: a new
contributor or agent follows the README. Consequence: wasted time and inconsistent results. Likelihood 2,
impact 1. Mitigation: add `engines` and `.nvmrc`, update the README (`npm ci`, `npm test`, structure). Owner:
T1key. Verification: fresh clone, `npm ci`, `npm test`. Residual risk: low.

**F6 — Action pinning.** Cause: version tags can move. Event: a compromised action release. Consequence: a
tampered site deployment. Likelihood 1, impact 2. Mitigation: pin to commit SHAs and enable update monitoring.
Owner: T1key. Verification: file inspection. Residual risk: low. Not planned for Task 7.

**F8 — Startup failure.** Cause: no error handling around `loadInitial`. Event: IndexedDB is unavailable.
Consequence: a blank page without an explanation. Likelihood 1, impact 2. Mitigation: catch the error and show
a message. Owner: T1key. Verification: a test with a rejecting storage mock or a manual check in a browser.
Residual risk: low. Not planned for Task 7.
