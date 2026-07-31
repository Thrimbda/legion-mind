import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);

function read(path: string): string {
  return readFileSync(join(repoRoot, path), 'utf8');
}

const schedulerPolicyPaths = [
  'docs/linear-legion-scheduler/rfc.md',
  'docs/linear-legion-scheduler/delivery-pr-writeback.md',
  'docs/linear-legion-scheduler/worker-runner.md',
  'docs/linear-legion-scheduler/scheduler-core-sqlite.md',
  'docs/linear-legion-scheduler/linear-wi-contract-policy.md',
  'docs/linear-legion-scheduler/work-items/WI-05-delivery-pr-writeback.md',
] as const;

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
  ...schedulerPolicyPaths,
] as const;

test('Legion policy surfaces preserve the one-PR task invariant', () => {
  const sources = Object.fromEntries(policyPaths.map((path) => [path, read(path)]));
  const combined = Object.values(sources).join('\n');

  assert.match(sources['AGENTS.md'], /每个 `taskId` 的 PR 配额为 `0\.\.1`/);
  assert.match(sources['README.md'], /PR 配额固定为 `0\.\.1`/);
  assert.match(sources['skills/legion-workflow/SKILL.md'], /PR 配额固定为 `0\.\.1`/);
  assert.match(sources['skills/git-worktree-pr/SKILL.md'], /PR cardinality 固定为 `0\.\.1`/);
  assert.match(sources['skills/legion-workflow/references/REF_ENVELOPE.md'], /identity.*不能换 URL/);
  assert.match(combined, /禁止 closeout、publish-result、deploy-result、wiki-only 或任何第二 PR/);
});

test('terminal PR state is external-only and repository evidence stops at delivery-ready', () => {
  const workflow = read('skills/legion-workflow/SKILL.md');
  const docs = read('skills/legion-docs/SKILL.md');
  const wiki = read('skills/legion-wiki/SKILL.md');
  const report = read('skills/report-walkthrough/SKILL.md');
  const summaryTemplate = read('skills/legion-wiki/references/TEMPLATE_TASK_SUMMARY.md');

  assert.match(workflow, /唯一 PR terminal 后设置 external-only 边界/);
  assert.match(workflow, /只允许外部 publish\/deploy、只读验证、worktree cleanup、refresh 与最终报告/);
  assert.match(docs, /raw docs 在唯一 PR 内停在 `delivery-ready`/);
  assert.match(wiki, /summary 在唯一 PR terminal 前写为 `delivery-ready`/);
  assert.match(report, /terminal 后不重渲染仓库 artifact/);
  assert.match(summaryTemplate, /PR-backed task 使用 `delivery-ready`，不在 PR terminal 后追写 `completed`/);
});

test('legacy text cannot authorize a design continuation or post-terminal closeout PR', () => {
  const autopilot = read('skills/legion-workflow/references/REF_AUTOPILOT.md');
  const designGate = read('skills/legion-workflow/references/GUIDE_DESIGN_GATE.md');
  const bestPractices = read('skills/legion-docs/references/REF_BEST_PRACTICES.md');

  assert.doesNotMatch(autopilot, /设计 PR merge 后进入 approved-design continuation/);
  assert.doesNotMatch(designGate, /设计 PR merge 后以 approved-design continuation 实现/);
  assert.doesNotMatch(bestPractices, /PR lifecycle 状态发生变化时更新 `log\.md`/);
  assert.match(autopilot, /release\/deploy\/post-merge failure 不构成第二 PR 例外/);
  assert.match(designGate, /不得先 merge 设计 PR 再为同一 task 创建实现 PR/);
  assert.match(bestPractices, /禁止再改 `log\.md` 或创建第二 PR/);
});

test('Scheduler legacy bindings and terminal evidence failures cannot reopen repository work', () => {
  const sources = Object.fromEntries(schedulerPolicyPaths.map((path) => [path, read(path)]));
  const combined = Object.values(sources).join('\n');

  assert.match(sources['docs/linear-legion-scheduler/rfc.md'], /brand-new candidate bound through the current ingress is `open`/);
  assert.match(sources['docs/linear-legion-scheduler/rfc.md'], /`unknown` blocks repository worker dispatch/);
  assert.match(
    sources['docs/linear-legion-scheduler/scheduler-core-sqlite.md'],
    /ambiguous legacy identities become `unknown` and block repository workers/,
  );
  assert.match(
    sources['docs/linear-legion-scheduler/worker-runner.md'],
    /only tracker observation of that same PR as open can re-enable repository dispatch/,
  );
  assert.match(combined, /recovery requires a user-created new task/);
  assert.match(
    sources['docs/linear-legion-scheduler/linear-wi-contract-policy.md'],
    /applies only to dependency calculation/,
  );
  assert.match(
    sources['docs/linear-legion-scheduler/linear-wi-contract-policy.md'],
    /never restores the original task\/run or repository worker and never renews that task's consumed PR quota/,
  );
  assert.doesNotMatch(combined, /downstream remains locked until evidence is repaired/);
  assert.doesNotMatch(combined, /retry\/repair if branch still available/);
  assert.doesNotMatch(combined, /If PR merged but required Legion evidence is missing, the run becomes `blocked`/);
  assert.doesNotMatch(combined, /若 PR merged 但缺少 required evidence，run 进入 `blocked`/);
});
