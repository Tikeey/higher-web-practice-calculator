# Task 9 — Release decision

Reviewed version: branch `assignment-05`, commit `3364148` (plus the documentation files). "Release" means a manual
deployment of the site with the existing `workflow_dispatch` workflow.

## Decision: **CONDITIONAL**

The critical checks pass and the two highest-scoring confirmed risks are mitigated and verified, but one
verification gap (the user interface was never run in a browser) and one set of known, unresolved risks (dependency
advisories) remain. The limitations have explicit controls and owners, which is the CONDITIONAL case.

## Supporting evidence

| Source | Result |
|---|---|
| Critical checks (`docs/evidence/task7-2-final-*.txt`) | `npm test`: 6 files, 31 tests passed, exit 0; `type-check`: exit 0; `build`: exit 0; `lint`: 0 errors (1818 warnings, mostly line endings, F10) |
| Test history (`docs/evidence/task7-0-…`, `task7-1-…`) | Before the fixes 6 of 31 tests failed; after F1 4 failed; after F2 all passed |
| Risk register (`docs/RISK_REGISTER.md`, `docs/MITIGATIONS.md`) | F1 and F2 reduced from 4 to 2; no confirmed risk above 3 remains (F4 and F10 score 3) |
| Readiness (`docs/AGENT_READINESS.md`) | Level 2 Documented; Level 3 not reached |

## Why not GO

GO needs all critical checks to pass **and** no unacceptable unresolved risk. Checks pass, but:
- `npm audit --omit=dev` lists 5 high findings (F4; last run before Task 7, and the dependencies have not changed since); their exploitability for this application is judged low but was not proven;
- the browser behaviour was not verified, and the last code change touched what the user sees (date display and money amounts).

## Why not NO-GO

No serious risk is both unmitigated and likely: the confirmed correctness risks are fixed and tested, the XSS
hypothesis was rejected by evidence (F7), and the remaining advisories concern mainly build and development tooling
of a client-only static site. The verification gap can be closed in minutes by a manual test.

## Conditions, controls and owners

| # | Condition before deployment | Control / verification | Owner |
|---|---|---|---|
| C1 | Manual smoke test in a browser: create a budget, add an expense, add a decimal expense equal to the remaining balance, check the dates in the history list, reload the page to check persistence | Screenshots or notes saved in `docs/evidence/`; the release stays blocked while no record exists | T1key |
| C2 | Either upgrade `zod` and `vite` to the fixed versions or write down why the advisories are accepted | `npm audit --omit=dev` output after the change, or an acceptance note; any dependency change needs a human decision (`AGENTS.md`) and the full checks re-run | T1key |
| C3 | Run `npm run validate` and `npm test` manually before every deployment, because CI does not (F5) | Output of both commands saved with the release | T1key |

## Accepted limitations (not conditions)

| ID | Limitation | Control |
|---|---|---|
| F3 | A negative balance after deleting an income is shown as 0 | Documented; test pins the behaviour |
| F8 | A startup storage failure is not handled | Documented; plausible, not reproduced |
| F9, F10 | Node version not pinned, README outdated, line-ending configuration | Documented in the register |
| F6 | GitHub Actions pinned by tag | Low impact; minimal workflow permissions |

## What would change the decision

- **To GO:** C1 to C3 are done with evidence stored in the repository and nothing new is found.
- **To NO-GO:** the smoke test shows a failure in the budget or transaction flow, or an advisory is shown to be
  reachable in the built application.

## Limits of this decision

It rests on the evidence listed above and on the assistant's reading of the code. The application was not run in a
browser, the GitHub Actions workflow was not run, and no coverage report exists.
