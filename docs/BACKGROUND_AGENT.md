# Task 8 — Background agent safeguards

This is a **design only**. No background agent was run and none of the commands below was executed as part of this
task; the numbers marked "proposed" are starting values, not measured ones.

## Hypothetical task

> Upgrade the production dependencies listed by `npm audit --omit=dev` (risk F4) to the fixed versions within the
> same major version: `zod` to 4.6.7 and `vite` to 7.3.8 (the audit also lists `typescript-eslint` 8.73.0 for the
> development tree). Keep the behaviour of the application unchanged.

Why this task: it is mechanical, has a clear definition of done, and can be verified by the existing checks, but it
touches the supply chain (lockfile, install scripts, network), which makes it a useful test of the safeguards.

## Isolation

| Item | Rule |
|---|---|
| Workspace | A fresh clone in an ephemeral container or `git worktree`, created from the current head of `assignment-05` (base commit recorded in the run manifest); the developer's working directory is never mounted |
| Branch | The agent works only on `agent/f4-dependency-upgrade`; its push permission is limited to the `agent/*` pattern |
| Protected branches | `main` and `assignment-05` accept changes only through a reviewed pull request; no direct pushes, no force pushes |
| Credentials | None in the environment: no personal tokens, no deploy keys, no `.env` files; the repository contains no secrets (checked in Task 6) |
| Network | Allowed: the npm registry and the repository host. Everything else is blocked. Web pages and package changelogs the agent reads are treated as data, never as instructions |

## Allowed and prohibited

| Category | Rule |
|---|---|
| Files the agent may change | `package.json`, `package-lock.json`, and its own report folder `docs/evidence/agent-run-<id>/` |
| Files the agent must not change | `src/**`, tests, `vitest.config.ts`, `tsconfig.json`, ESLint and Prettier configs, `.github/**`, `AGENTS.md`, `README.md`; also no deleting or skipping tests and no loosening lint rules to make a check pass |
| Allowed commands | The "Safe commands" of `AGENTS.md` (`npm ci`, `type-check`, `lint`, `format:check`, `build`, `npm audit`, read-only git), plus `npm test`, plus `npm install --save-exact zod@4.6.7 vite@7.3.8` (a human pre-approval for exactly these packages, which `AGENTS.md` otherwise requires), plus `git add`, `git commit` and `git push origin agent/f4-dependency-upgrade` |
| Prohibited operations | Everything under "Forbidden actions" of `AGENTS.md`, in particular `npm audit fix --force`, adding any other dependency, `git push --force`, pushing to protected branches, merging, deploying or publishing, reading or printing secrets, and any network access outside the allow-list. Install scripts of additional packages are not approved: `npm` already warns about the `esbuild` install script, and any further script needs a human decision |

## Limits (proposed values)

| Limit | Value |
|---|---|
| Wall-clock time | 30 minutes; the container is killed at the limit |
| Retries | At most 2 re-runs of a failing check, then stop and report |
| Scope guard | Stop if any file outside the allow-list changes, or if the lockfile changes packages that are not part of the dependency trees of the upgraded packages |
| Cost | A fixed token or cost budget set by the owner before the run |

## Definition of done

`npm run type-check` and `npm run build` exit 0; `npm test` passes all 31 tests; `npm run lint` reports 0 errors;
`npm audit --omit=dev` no longer lists `zod` or `vite`; only the allow-listed files changed.

## Artifacts the agent must deliver

Stored in `docs/evidence/agent-run-<id>/` on the agent branch and summarised in the pull request description.

| Artifact | Content |
|---|---|
| Change summary | Packages with old and new versions, why each change is needed, anything skipped |
| Diff | `git diff <base>..HEAD` of the branch |
| Test logs | Full output and exit code of `npm test`, `type-check`, `lint`, `format:check` |
| Build result | Output and exit code of `npm run build` |
| Audit | `npm audit --omit=dev` before and after |
| Risk notes | Breaking changes found in release notes, lockfile changes outside the expected trees, install scripts that ran, checks that could not be run, anything unverified |
| Run manifest | Base commit, start and end time, the exact list of commands run |

## Human review and approval

1. The change reaches `assignment-05` only through a pull request; the agent cannot merge it.
2. The reviewer reads the diff and the risk notes, confirms that only allowed files changed, and re-runs `npm ci`,
   `npm test`, `npm run build` and `npm audit --omit=dev` locally. The agent's logs are evidence, not a substitute.
3. A manual smoke test of the application in a browser is done before approval (the UI is not covered by automated tests).
4. Deployment stays a separate manual step (the existing `workflow_dispatch` workflow), performed by a human after the merge.

## Failure and rollback

| Situation | Handling |
|---|---|
| A check fails after the retry limit | The agent stops, pushes its report with the failing output, and does not open a mergeable pull request; the base branch is untouched |
| Scope guard or time limit triggered | The run is aborted and the container discarded; the branch is kept only if it contains a report, for inspection |
| Bad change found after review | Do not merge; delete the agent branch |
| Bad change found after merge | `git revert` the merge commit, restore the lockfile from the base commit, re-run the checks; if it was deployed, redeploy the previous commit manually |

## Threats and the safeguard that answers them

| Threat | Safeguard |
|---|---|
| Malicious or manipulated package release | Exact versions named in the task, human review of the lockfile diff, no extra install scripts approved |
| Prompt injection through changelogs or web pages | Fetched content treated as data; no credentials to leak; push limited to one branch |
| Agent edits tests or configs to turn checks green | Tests and configs are outside the allow-list; reviewer checks the file list |
| Runaway or looping run | Time limit, retry limit, container kill |
| Silent breakage of the UI | Mandatory manual smoke test before approval |

## What the repository still lacks for this to be enforced

`AGENTS.md` has safe and forbidden commands and review gates, but no per-directory write scope and no rules for
background work; branch protection and a CI workflow that runs the checks on pull requests do not exist yet (F5).
Until then these rules are a plan, not an enforced control.
