# Test report: Git worktree PR envelope documentation change

## Re-run

- Date: 2026-04-25
- Trigger: re-run `verify-change` after adding `git-worktree-pr` to `scripts/setup-opencode.ts` `INSTALLED_SKILLS`.
- Follow-up: re-run after tightening AIM fidelity for push-before-rebase, strict completion, auto-merge/checks follow-up, main/master prohibitions, and repo-only filesystem boundary.

## Result

PASS

The targeted documentation/skill validation passed. The change adds the required `git-worktree-pr` skill, includes it in `scripts/setup-opencode.ts` `INSTALLED_SKILLS`, keeps Git/PR lifecycle as an envelope rather than a fourth execution mode, preserves the three canonical Legion execution mode names, records PR follow-up semantics, tightens AIM-derived hard rules, and leaves `skills/legion-workflow/scripts/**` unchanged.

## Commands and checks

| Check | Evidence | Result |
|---|---|---|
| Whitespace/conflict marker check | `git diff --check` | PASS; command produced no output. |
| Required skill file exists | Read `skills/git-worktree-pr/SKILL.md` | PASS; file exists and defines hard gate, `.worktrees/<task-id>/`, lifecycle phases, completion definition, and red flags. |
| Installed skill list includes new skill | Read `scripts/setup-opencode.ts` and targeted assertion | PASS; `INSTALLED_SKILLS` includes `git-worktree-pr`, so install / verify asset collection includes the new skill. |
| Repository entry rules mention mandatory envelope and worktree path | Read `AGENTS.md` and `.opencode/agents/legion.md` | PASS; both mention mandatory `git-worktree-pr` for modifying Legion development tasks and `.worktrees/<task-id>/`. |
| `legion-workflow` envelope semantics | Read `skills/legion-workflow/SKILL.md` | PASS; states Git/PR lifecycle is mandatory for non-bypass modifying development tasks, wraps selected modes, and is not a fourth execution mode. |
| Canonical execution mode names remain exactly present | Read `skills/legion-workflow/SKILL.md` and `SUBAGENT_DISPATCH_MATRIX.md`; ran targeted Python assertions | PASS; canonical names remain `默认实现模式`, `已批准设计后的续跑模式`, and `重型仅设计模式`. Dispatch matrix has exactly these three `## ...模式` headings. |
| Dispatch matrix treats envelope as wrapper, not mode | Read `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md` | PASS; says `git-worktree-pr` envelope wraps existing modes/chains and PR follow-up is not a fourth execution mode. |
| Autopilot PR follow-up and no waiver | Read `skills/legion-workflow/references/REF_AUTOPILOT.md` | PASS; covers checks/review/cleanup/main refresh follow-up and says speed/autopilot does not waive the envelope. |
| Git lifecycle fields | Read `skills/legion-workflow/references/REF_ENVELOPE.md` | PASS; contains `git.lifecycle`, `baseRef`, `branch`, `worktreePath`, `prUrl`, `prState`, `checksState`, `reviewState`, `cleanupState`, and `mainWorkspaceRefresh`. |
| No workflow script changes | `git status --short -- "skills/legion-workflow/scripts/**"`; `git diff -- "skills/legion-workflow/scripts/**"`; `git ls-files --others --exclude-standard -- "skills/legion-workflow/scripts/**"` | PASS; all produced no output. |
| Targeted assertion script | `python3 - <<'PY' ... PY` checking required strings, installed skill list, exact dispatch headings, autopilot coverage, envelope fields, push-before-rebase, strict completion, auto-merge/checks follow-up, main/master prohibitions, and repo-only filesystem boundary | PASS; 57/57 assertions passed. |

## Changed files reviewed

- `skills/git-worktree-pr/SKILL.md`
- `scripts/setup-opencode.ts`
- `AGENTS.md`
- `.opencode/agents/legion.md`
- `skills/legion-workflow/SKILL.md`
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`
- `skills/legion-workflow/references/REF_AUTOPILOT.md`
- `skills/legion-workflow/references/REF_ENVELOPE.md`
- `README.md`
- Task design/review context: `.legion/tasks/add-git-worktree-pr-envelope/plan.md`, `docs/rfc.md`, `docs/review-rfc.md`, `log.md`, `tasks.md`

`git status --short` also showed untracked `superpowers/`; it was not part of this task's acceptance criteria or requested validation surface and was not modified during verification.

## Skipped items

- Full test suite / install verification: skipped because this is a documentation/skill consistency change and the requested validation surface was targeted textual checks plus `git diff --check`.
- GitHub PR checks/review follow-up: skipped because no PR lifecycle was requested or available for this verification run; this report validates that the new docs require that lifecycle for future modifying development tasks.

## Rationale

The selected checks directly prove the RFC acceptance criteria for this documentation-only change and the requested re-run surface: required files and references exist, the new skill is included in the OpenCode installed skill list, the Git lifecycle is consistently described as an envelope, the canonical Legion execution modes are preserved, PR follow-up is covered, lifecycle handoff fields exist, and prohibited workflow script changes did not occur. Broader runtime tests would add cost without stronger evidence for these prose/skill contract claims.

## Final result

PASS. Required re-run checks passed, including the new `scripts/setup-opencode.ts` `INSTALLED_SKILLS` assertion and the 57/57 AIM fidelity assertions.
