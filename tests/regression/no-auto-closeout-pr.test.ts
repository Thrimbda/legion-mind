import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);

function read(path: string): string {
  return readFileSync(join(repoRoot, path), 'utf8');
}

const policyPaths = [
  'AGENTS.md',
  'README.md',
  'skills/brainstorm/SKILL.md',
  'skills/git-worktree-pr/SKILL.md',
  'skills/legion-docs/SKILL.md',
  'skills/legion-docs/references/REF_BEST_PRACTICES.md',
  'skills/legion-wiki/SKILL.md',
  'skills/legion-wiki/references/REF_WRITEBACK_RULES.md',
  'skills/legion-wiki/references/TEMPLATE_TASK_SUMMARY.md',
  'skills/legion-workflow/SKILL.md',
  'skills/legion-workflow/references/REF_AUTOPILOT.md',
  'skills/legion-workflow/references/REF_ENVELOPE.md',
  'skills/legion-workflow/references/REF_HUMAN_ATTENTION.md',
  'skills/legion-workflow/references/GUIDE_DESIGN_GATE.md',
  'skills/report-walkthrough/SKILL.md',
  'docs/linear-legion-scheduler/rfc.md',
  'docs/linear-legion-scheduler/delivery-pr-writeback.md',
  'docs/linear-legion-scheduler/worker-runner.md',
  'docs/linear-legion-scheduler/scheduler-core-sqlite.md',
  'docs/linear-legion-scheduler/linear-wi-contract-policy.md',
  'docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md',
  'docs/linear-legion-scheduler/work-items/WI-05-delivery-pr-writeback.md',
] as const;

test('current policy has no task-level PR quota or permanent identity gate', () => {
  const combined = policyPaths.map(read).join('\n');

  assert.doesNotMatch(combined, /0\.\.1/);
  assert.doesNotMatch(combined, /PR (?:配额|cardinality)/);
  assert.doesNotMatch(combined, /compareAndBindTaskPr|pr_identity_conflict/);
  assert.doesNotMatch(combined, /terminal PR binding|task binding is conflicted|Legacy identity backfill|same PR as open can re-enable/i);
  assert.match(combined, /用户明确授权/);
  assert.match(combined, /授权后的交付可以使用新的 PR/);
});

test('terminal facts are external and cannot autonomously create a status-only PR', () => {
  const agents = read('AGENTS.md');
  const workflow = read('skills/legion-workflow/SKILL.md');
  const worktree = read('skills/git-worktree-pr/SKILL.md');
  const schedulerPrompt = read('scheduler/src/worker-runner.ts');

  assert.match(agents, /不得自动开 closeout\/status-writeback PR/);
  assert.match(workflow, /不得自动.*closeout\/publish-result\/deploy-result\/wiki-only PR/);
  assert.match(worktree, /不得自动为 terminal 状态写回创建 closeout、publish-result、deploy-result 或 wiki-only PR/);
  assert.match(schedulerPrompt, /Do not autonomously create a closeout, publish-result, deploy-result, or wiki-only PR solely to record terminal lifecycle facts/);
  assert.match(workflow, /terminal 后.*只进入外部 lifecycle 与最终交接/);
});

test('Scheduler uses run-level PR metadata and keeps direct lifecycle observation', () => {
  const store = read('scheduler/src/sqlite-store.ts');
  const worker = read('scheduler/src/worker-runner.ts');
  const tracker = read('scheduler/src/pr-tracker.ts');

  assert.equal(existsSync(join(repoRoot, 'scheduler/src/pr-identity.ts')), false);
  assert.doesNotMatch(store, /task_pr_bindings|TaskPrState|compareAndBindTaskPr/);
  assert.doesNotMatch(worker, /taskPrBinding|compareAndBindTaskPr/);
  assert.doesNotMatch(tracker, /task_pr_bindings|compareAndBindTaskPr|observeTaskPrState/);
  assert.match(store, /pr_url = COALESCE\(\?, pr_url\)/);
  assert.match(tracker, /observeLocalGitLifecycle/);
  assert.match(tracker, /wait for explicit user authorization before any follow-up repository change/);
  assert.doesNotMatch(worker, /git-worktree-lifecycle\.json|prMerged|mainRefreshed/);
});

test('current Wiki truth supersedes the historical quota decision', () => {
  const decisions = read('.legion/wiki/decisions.md');
  const currentTask = read('.legion/wiki/tasks/remove-pr-quota-enforcement-v1.md');
  const historicalTask = read('.legion/wiki/tasks/enforce-single-pr-lifecycle-v1.md');

  assert.match(decisions, /不设 task 级 PR 数量或 identity 限制/);
  assert.match(currentTask, /用户明确授权后，后续仓库交付可以使用新的 branch\/PR/);
  assert.match(historicalTask, /`historical`: `true`/);
  assert.match(historicalTask, /`superseded-by`: `remove-pr-quota-enforcement-v1`/);
});
