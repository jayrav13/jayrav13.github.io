# Redesign progress — 2026-04-25

This file tracks where the Astro redesign is in the subagent-driven implementation flow. Update as tasks complete; delete (or move out of the PR) before merging.

## Where we are

**Branch:** `redesign` (this worktree, at `/Users/jravaliya/Code/jayrav13.github.io-redesign`).
**Last commit:** `7165728 Scaffold Astro 5 minimal template alongside Jekyll site` (despite the message, it actually installed Astro 6 — see below).

**Authoritative documents:**
- Design spec: `docs/superpowers/specs/2026-04-25-site-redesign-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-25-site-redesign.md`

The plan has 18 tasks. Subagent-driven-development flow (per `superpowers:subagent-driven-development`): for each task, dispatch implementer → spec reviewer → code-quality reviewer → mark complete.

## Task status

| # | Task | Status |
|---|---|---|
| 1 | Branch setup | ✅ Done implicitly by `git worktree add ../jayrav13.github.io-redesign -b redesign main` |
| 2 | Scaffold Astro | ⚠️ **In progress — spec reviewer found 2 issues, awaiting fix** |
| 3 | Project configuration | ⏳ Queued |
| 4 | Content collection schemas | ⏳ Queued |
| 5 | Theme system & global styles | ⏳ Queued |
| 6 | BaseLayout | ⏳ Queued |
| 7 | Header, ThemeToggle, Footer | ⏳ Queued |
| 8 | Home page components | ⏳ Queued |
| 9 | Home page composition | ⏳ Queued |
| 10 | Post detail page | ⏳ Queued |
| 11 | Project detail page | ⏳ Queued |
| 12 | RSS, sitemap, 404, robots | ⏳ Queued |
| 13 | Migrate posts | ⏳ Queued |
| 14 | Migrate projects | ⏳ Queued |
| 15 | Migrate static assets | ⏳ Queued |
| 16 | Delete Jekyll scaffolding | ⏳ Queued |
| 17 | GitHub Actions deploy workflow | ⏳ Queued |
| 18 | Final verification & PR | ⏳ Queued |
|   | Final whole-implementation code review | ⏳ Queued |

## Open issues blocking Task 2 completion

The spec reviewer flagged two issues against the Task 2 commit (`7165728`) that need fixing before moving on:

1. **Astro version mismatch (CRITICAL).** The plan specifies "Astro 5.x." `npm create astro@latest` now ships Astro `^6.1.9`. The plan's later content-collection code (Tasks 4, 10, 11, 12) was written against Astro 5 idioms — `glob` from `astro/loaders`, `render(entry)` from `astro:content`, `entry.id` shape — and those APIs evolved between 5 and 6. Pin to v5 to keep the plan internally consistent. Fix:
   ```bash
   npm install astro@^5
   rm -rf node_modules .astro
   npm install
   npm run build  # confirm still boots
   ```
2. **`package.json` "name" field** is `"tmp-jay-astro-scaffold"` (derived from the temp scaffold dir). Should be something like `"jayravaliya-com"`. Trivial.

Re-commit (or amend `7165728`) after the fix, then proceed to spec re-review and code-quality review for Task 2 before starting Task 3.

## Operational notes for the next session

- **Working directory:** This worktree (`/Users/jravaliya/Code/jayrav13.github.io-redesign`). Sandbox writes to `.` are allowed, so most subagent commands shouldn't need `dangerouslyDisableSandbox`. Network is restricted to `registry.npmjs.org` by default — should cover everything but `git push`. For pushes, the user will need to allow it.
- **Skill stack:** `superpowers:subagent-driven-development` is driving execution. Continue using fresh subagent dispatches per task, with two-stage review per task (spec then quality), per the skill.
- **Visual companion:** Server is stopped. Re-start only if a new visual question comes up.
- **Memory:** The original-cwd memory dir (`-Users-jravaliya-Code-jayrav13-github-io`) has user/project context that may not have copied to this worktree's memory dir. The new session may want to seed memory by reading this note.

## Subsequent work pointer

Once Task 2 closes out, the controller should walk Tasks 3 → 18 in order, dispatching implementer + spec reviewer + code-quality reviewer per task. Task 18 ends with `gh pr create` — that PR is the merge candidate. After PR merges, follow `superpowers:finishing-a-development-branch` for cleanup (worktree removal, branch deletion).
