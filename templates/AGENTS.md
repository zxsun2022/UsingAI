# AGENTS.md

Operating contract for coding agents working in this repository.

This file defines project-level rules shared by Claude Code, Codex, OpenCode, and future coding agents. Tool-specific files may import or reference this file, but must not duplicate it.

## 1. Project

* **Name:** `<PROJECT_NAME>`
* **Purpose:** `<ONE_SENTENCE_PRODUCT_PURPOSE>`
* **Core user outcome:** `<PRIMARY_USER_OUTCOME>`
* **Current phase:** `<PROTOTYPE | PRIVATE_BETA | PRODUCTION>`
* **Primary application directory:** `<PATH>`
* **Package manager:** `<PACKAGE_MANAGER>`

Before implementing a new capability, confirm that it supports the product contract in [`docs/contract/`](./docs/contract/). A useful idea is not automatically authorized work.

## 2. Sources of Truth

Use the following authority order:

1. [`docs/contract/`](./docs/contract/) — product purpose, principles, non-goals, and invariants.
2. [`docs/decisions/`](./docs/decisions/) — accepted architectural decision records.
3. [`docs/specs/`](./docs/specs/) — approved feature behavior and acceptance criteria.
4. Executable code, tests, schemas, and configuration — current implemented behavior.
5. [`docs/ops/`](./docs/ops/) — operational and deployment procedures.
6. [`docs/derived/`](./docs/derived/) — facts generated deterministically from the repository.
7. Task tracker and roadmap views — current execution state and prioritization.
8. Archived documents — historical context only.

When sources conflict:

* Product intent comes from the contract and approved specifications.
* Architectural intent comes from accepted ADRs.
* Current behavior comes from code and tests.
* Delivery evidence comes from Git history and verification output.
* Priority and authorization come from the owner-approved task system.

Chat transcripts, external AI advice, TODO lists, idea documents, and roadmap entries are context, not implementation authorization.

## 3. Required Reading

Before editing:

* Read this file.
* Read [`docs/README.md`](./docs/README.md).
* Read the relevant product contract, specification, ADR, and operational document.
* Inspect repository-local instructions in the directory being changed.
* Inspect `git status`, the current branch, and recent commits.

Read only the documents relevant to the task. Do not load the entire documentation tree without a reason.

## 4. Authorization and Scope

An implementation task must originate from one of the following:

* A direct instruction from the owner.
* An approved specification marked ready for implementation.
* An authorized task in the configured task system.

Do not treat adjacent TODOs, deferred work, comments, failing unrelated tests, or attractive cleanup opportunities as part of the task.

Implement the smallest coherent change that satisfies the authorized acceptance criteria.

Do not:

* Expand scope without explicit authorization.
* Reprioritize work.
* silently change product requirements.
* Perform unrelated refactors or formatting.
* Add infrastructure for hypothetical future needs.
* Replace an existing project convention merely because another convention is preferable.

When information is incomplete, make and record a reasonable reversible assumption. Stop and ask only when the missing information would materially alter product behavior, architecture, security, data integrity, cost, or an irreversible operation.

## 5. Documentation Model

Documentation is separated by responsibility and rate of change:

```text
docs/
  README.md       Documentation map and authority rules
  contract/       Stable product intent, non-goals, invariants
  decisions/      Append-only ADRs
  specs/          Feature specifications and acceptance criteria
  ops/            Deployment, migration, recovery, and operations
  derived/        Deterministically generated repository facts
  archive/        Superseded historical documents
```

Rules:

* Human-authored documents describe intent, decisions, constraints, and acceptance conditions.
* Facts that can be generated reliably from code or configuration should not be duplicated manually.
* Do not edit generated files directly.
* ADRs are append-only. Supersede an old decision with a new ADR rather than rewriting history.
* A code change that alters externally observable behavior must update the relevant specification or operational documentation in the same change.
* Internal refactors with no contract or behavior change do not require artificial documentation edits.
* When no documentation change is required, report `Docs impact: none` and explain why.

## 6. Specifications

Create or update a feature specification when misunderstanding the requirement would cause meaningful rework.

A specification should contain, as applicable:

* Problem and reason for doing the work now.
* User outcome.
* Scope.
* Explicit non-goals.
* Observable acceptance criteria.
* Edge cases and failure states.
* Data, API, security, UX, and operational impact.
* Verification approach.
* Rollback approach.
* Open questions and accepted decisions.

Do not start substantial implementation when the required behavior cannot be evaluated. An idea without observable acceptance criteria remains exploratory work.

## 7. Task State

* **Task source of truth:** `<NATIVE_TOOL | GITHUB_ISSUES | LINEAR | BEADS | OTHER>`
* **Human-readable status view:** `<PATH_OR_TOOL>`
* **Session handoff policy:** `<COMMIT_ONLY | COMMIT_AND_PUSH>`

The task system owns execution state. Specifications own intended behavior. A roadmap is a planning view, not an alternative task database.

Agents may move authorized work to `in_progress`, `blocked`, or `in_review`.

Only the owner or an explicitly designated reviewer may mark work `done`, `accepted`, or `released`.

Do not place work in the implementation queue unless it has sufficient acceptance criteria and authorization.

If a board or generated roadmap exists, treat it as a read-only projection unless its documentation explicitly says otherwise.

## 8. Git and Worktrees

* Keep `main` or the default branch runnable and free of unfinished work.
* Use one branch and one worktree for each independent concurrent task.
* A writable worktree has one owning agent or session at a time.
* Do not place worktrees inside cloud-synchronized directories.
* Treat pre-existing and concurrent changes as user-owned.
* Stage only files or hunks belonging to the current task.
* Commit at semantic boundaries, not after every file save.
* Use concise descriptive commit messages.
* Do not amend, rebase, force-push, rewrite shared history, or delete branches without explicit authorization.
* Never commit secrets, credentials, private production data, or generated local state.

For multi-device handoff:

* Finish or pause at a coherent boundary.
* Update task state.
* Create a descriptive checkpoint commit.
* Follow the configured handoff policy.
* Report the branch and commit hash.

If the handoff policy is `COMMIT_AND_PUSH`, push only the task branch. Never force-push.

## 9. Worktree Requirement

Use an isolated worktree for:

* Concurrent development.
* Multi-file features.
* Architectural experiments.
* Dependency upgrades.
* Database or schema changes.
* Alternative implementations.
* Work expected to span multiple commits or sessions.

A clean current workspace may be used for read-only work, documentation-only work, or a small isolated change when no parallel work exists.

## 10. Testing and Verification

Verification must be proportionate to the risk and surface area of the change.

* A bug fix should begin with a failing regression test when the defect can be reproduced reliably.
* Test observable behavior rather than implementation details.
* Run the relevant unit, integration, type, lint, build, and manual checks.
* Do not claim success from inspection or inference.
* Record the commands executed and their actual results.
* If a required check cannot run, state exactly why and what remains unverified.
* Do not weaken or delete a test merely to make the suite pass.

Canonical commands and generated repository facts live in [`docs/derived/`](./docs/derived/) or the relevant operational document.

## 11. Human Gates

Agents must not execute irreversible or production-impacting actions without explicit authorization.

Human-gated actions include:

* Production deployment.
* Production database migration.
* Domain or DNS changes.
* Secret creation, rotation, or deletion.
* Permanent data deletion.
* Destructive cloud commands.
* Billing or paid-resource changes.
* Security-policy changes.
* History rewriting.
* Any operation without a credible rollback path.

For a gated action, provide:

1. The proposed command or procedure.
2. Preconditions.
3. Expected effect.
4. Verification steps.
5. Rollback or recovery procedure.

Then stop before executing it.

## 12. Completion Protocol

Before reporting completion:

1. Review the final diff.
2. Confirm the change remains within authorized scope.
3. Run proportionate verification.
4. Update affected specifications, ADRs, operations docs, generated docs, and task state.
5. Commit the coherent change unless the task is read-only, blocked, incomplete, or the owner instructed otherwise.
6. Follow the configured session handoff policy.

Use this final report structure:

```text
Result
- What changed and which acceptance criteria it satisfies.

Scope
- What was intentionally not changed.

Files
- Files added, moved, generated, or modified.

Verification
- Commands and actual results.
- Manual checks.
- Anything not verified.

Documentation
- Documents updated.
- Or: Docs impact: none — <reason>.

Git
- Branch:
- Worktree:
- Commit:
- Push status:

Risks and remaining work
- Concrete unresolved items only.

Rollback
- How to revert or disable the change.
```

Do not use “done,” “fixed,” or “working” without evidence.

## 13. Repository Map

```text
<INSERT_SHORT_REPOSITORY_MAP>
```

Detailed architecture, commands, routes, schemas, environment variables, and deployment procedures belong in linked documentation or generated references, not in this file.

## 14. Tool-Specific Entry Files

Tool-specific instruction files should remain minimal.

Example `CLAUDE.md`:

```markdown
Read and follow ./AGENTS.md.
```

Do not maintain parallel copies of project rules.
