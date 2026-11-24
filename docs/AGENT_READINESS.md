# Task 6 — Agent-readiness audit

Audited state: branch `assignment-05` at commit `3364148`. Baseline for comparison: tag `baseline` (`c235228`).
Evidence was collected by the AI assistant (Claude) by reading the repository and running read-only commands; the
dev-server check and the secret-pattern scan were run in the assistant's environment, the test, type-check, lint and
build results are the student's runs in `docs/evidence/`.

## Rubric used

The assignment names three levels but does not define them in the assignment deck, so this working rubric is used
(compare it with the lecture definitions if they differ):

| Level | Working definition |
|---|---|
| 1 Baseline | The project builds and runs from the repository; there is no agent-specific guidance and little or no automated verification |
| 2 Documented | Agent instructions exist (permissions, safe and forbidden commands, review gates); commands are documented; tests and static checks can be run locally |
| 3 Agent-ready | Level 2 plus a reproducible environment (pinned runtime and dependencies), automated checks enforced outside the developer's machine, an accurate README, observable runtime behaviour and security safeguards, so an agent's change can be verified with little manual effort |

## Audit by area

| Area | Evidence | Rating |
|---|---|---|
| Readable structure | 16 source files, 1632 lines in total, largest file `pages/main-page.ts` (295 lines); business logic is separated in `services/`, `models/`, `utils/`, UI in `pages/` and `components/`; TypeScript `strict`, `noUnusedLocals`, `noUnusedParameters`. Pages build the DOM by hand and call state functions directly | Met |
| README accuracy | The documented scripts exist and match `package.json` (`dev`, `build`, `preview`, `type-check`, `lint`, `validate`). Inaccuracies: install step says `npm install` (a lockfile exists and `npm ci` is the reproducible command); `npm test` is not mentioned; the structure omits `pages/edit-budget-page.ts` and all test and config files; `http://localhost:3000` only redirects (HTTP 302) to the real address `http://localhost:3000/higher-web-practice-calculator/` printed by Vite | Partial |
| Reproducible setup | `package-lock.json` is present; `npm ci` succeeded on Windows (Node v26) and Linux (Node 22); CI uses Node 24. No `engines` field, no `.nvmrc`; no `.gitattributes`, so a Windows checkout gets CRLF and lint prints 1818 warnings (F9, F10) | Partial |
| Pinned dependencies | 21 direct dependencies: 15 exact versions, 6 caret ranges (all in `devDependencies`); 14 npm audit findings (5 high in the production tree, exploitability unverified, F4) | Partial |
| Tests | 6 test files, 31 tests pass (`docs/evidence/task7-2-final-test.txt`). Covered: `calculateMetrics`, schemas, `parseAmount`, `state.ts` (with `db.ts` mocked), `formatDate`. Not covered: 11 of 16 source files (all pages, all components, `App.ts`, `main.ts`, `db.ts`, `tw.ts`). No coverage report is configured | Partial |
| Lint, type check, build commands | `type-check`, `lint`, `format:check`, `build`, `test` and the aggregate `validate` exist; type-check and build exit 0, lint reports 0 errors. `validate` does not include tests. None of the checks runs in CI (F5) | Partial |
| Logging and error handling | No `console` or logging calls in `src`; three `throw new Error` sites in `state.ts` and no `try/catch` anywhere; a startup failure is not handled (F8, plausible) | Missing |
| Security safeguards | No secret patterns in tracked files (the scan matched only the workflow permission `id-token: write`); `.env` files are listed in `.gitignore`; `innerHTML` receives only constants (F7 unsupported); workflow permissions are minimal. Gaps: no Content-Security-Policy meta tag, no Dependabot or security policy, Actions pinned by tag (F6), unresolved advisories | Partial |

## AGENTS.md inspection

| Item the assignment asks for | In `AGENTS.md` | Verified against the repository |
|---|---|---|
| Permissions / safe commands | Section "Safe commands" (install, type-check, lint, format check, build, dev, audit, read-only git) | Every listed script exists in `package.json` |
| Commands needing approval | Dependency changes, whole-project format/lint fix, workflow changes | Consistent with the line-ending problem (F10) |
| Prohibited actions | Secrets, deploy/publish, destructive git and shell commands, `npm audit fix --force`, new dependencies, edits outside the repository | n/a |
| Review gates | Human review of every diff, one task per commit, no merge to `main` without approval, stop and ask when unclear | n/a |
| Accuracy of conventions | Strict TypeScript; Prettier: tabs, single quotes, semicolons, trailing commas, width 100, `arrowParens: avoid`; dev server on port 3000; CI on Node 24 | All confirmed in `tsconfig.json`, `prettier.config.js`, `vite.config.ts`, `deploy.yml` |
| Test expectations | `npm test`, forced UTC+5 time zone, money in cents | Matches `vitest.config.ts` and `budget-calculator.ts` |

Gaps in `AGENTS.md`: no per-directory write scope (which paths may be changed), no mention that the dev URL includes
the `/higher-web-practice-calculator/` base path, and no rules for long-running or background work (see Task 8).

## Readiness level

| State | Level | Justification |
|---|---|---|
| Baseline `c235228` | **1 Baseline** | The project built and had a README with commands, but there was no `AGENTS.md`, no tests, and CI only built the site |
| Current `3364148` | **2 Documented** | `AGENTS.md` has permissions, safe and forbidden commands and review gates, all verified against the configuration; 31 tests and the static checks run locally |

Level 3 is **not** claimed. It is blocked by: checks not enforced in CI (F5), no pinned Node version (F9), an outdated
README, 11 of 16 source files without tests, no logging or error handling, and unresolved dependency advisories (F4).

## Missing evidence

- A CI run that executes tests, type-check and lint (no such workflow exists; it cannot be run locally).
- A manual or automated run of the application in a browser (not performed).
- A test coverage report (no coverage tool is configured).
- Evidence that an AI agent actually read and followed `AGENTS.md`: the assistant used here works in a chat, does not
  load the file automatically, and applied the rules only through the conversation.
- Analysis of whether the npm advisories are reachable in this application.
- A fresh-machine setup run by the student following the README (the assistant ran `npm ci` and the tests on clean
  Linux clones, but those outputs are not stored in the repository).

## Path to Level 3 (not implemented in this assignment)

1. Add a CI workflow that runs `type-check`, `lint`, `test` and `build` on every push and pull request (F5).
2. Pin Node with `engines` and `.nvmrc`, add `.gitattributes` with LF endings, and update the README (F9, F10).
3. Add error handling and minimal logging around startup and storage (F8).
4. Add tests for the page and component layer or a browser smoke test, and enable a coverage report.
5. Upgrade the dependencies with non-major fixes after approval and add dependency update monitoring (F4, F6).
