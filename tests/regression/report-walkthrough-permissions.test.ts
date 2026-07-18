import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { parseCurrentVerdict } from '../../skills/report-walkthrough/scripts/current-verdict.mjs';
import { workflowPolicy } from '../../skills/legion-workflow/scripts/profile-policy.mjs';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const renderer = 'skills/report-walkthrough/scripts/render-report.mjs';

function runRenderer(input: string, check = true) {
  return spawnSync(process.execPath, [renderer, '--input', relative(repoRoot, input), ...(check ? ['--check'] : [])], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function taskPaths(taskId: string) {
  const taskRoot = join(repoRoot, '.legion', 'tasks', taskId);
  const docs = join(taskRoot, 'docs');
  return { taskRoot, docs };
}

type ArtifactProfile = 'implementation' | 'rfc-only' | 'contract-only';
type WorkflowProfile = 'lite' | 'standard' | 'strict';

function stageLocators(taskId: string, profile: ArtifactProfile, workflowProfile: WorkflowProfile, designRequired: boolean) {
  const root = `.legion/tasks/${taskId}/docs`;
  if (profile === 'contract-only') return [
    { kind: 'plan', locator: `.legion/tasks/${taskId}/plan.md` },
  ];
  if (profile === 'rfc-only') return [
    { kind: 'rfc', locator: `${root}/rfc.md` },
    { kind: 'review-rfc', locator: `${root}/review-rfc.md` },
  ];
  const result = [
    { kind: 'test-report', locator: `${root}/test-report.md` },
  ];
  if (workflowProfile !== 'lite') result.push({ kind: 'review-change', locator: `${root}/review-change.md` });
  if (workflowProfile === 'strict' || designRequired) result.push(
    { kind: 'rfc', locator: `${root}/rfc.md` },
    { kind: 'review-rfc', locator: `${root}/review-rfc.md` },
  );
  return result;
}

function reportData(taskId: string, options: {
  profile?: ArtifactProfile;
  risk?: 'low' | 'medium' | 'high';
  workflowProfile?: WorkflowProfile;
  designRequired?: boolean;
  claims?: unknown[];
  attention?: Record<string, unknown>;
} = {}) {
  const profile = options.profile ?? 'implementation';
  const risk = options.risk ?? 'low';
  const workflowProfile = options.workflowProfile ?? ({ low: 'lite', medium: 'standard', high: 'strict' } as const)[risk];
  const designRequired = options.designRequired ?? (profile === 'rfc-only' || workflowProfile === 'strict');
  const stages = stageLocators(taskId, profile, workflowProfile, designRequired);
  return {
    schemaVersion: '1.1',
    task: { id: taskId, title: '报告协议回归', purpose: '验证当前证据门', reviewer: '独立审查者' },
    profile,
    workflowProfile,
    designRequired,
    risk,
    stageConclusion: 'PASS',
    reviewStatus: profile === 'contract-only' || (profile === 'implementation' && workflowProfile === 'lite') ? 'NOT_REQUIRED' : 'PASS',
    summary: '同一输入只在当前阶段证据通过后生成三份产物。',
    attention: {
      level: 'none',
      summary: '当前没有额外人类注意力。',
      humanAction: '无需动作。',
      lifecycleBoundary: '可继续既有 lifecycle。',
      evidence: [stages[0].locator],
      ...options.attention,
    },
    claims: options.claims ?? [],
    scope: { included: ['报告协议'], excluded: ['自动调度'] },
    evidence: stages.map((stage) => ({ ...stage, label: `${stage.kind} 当前证据`, status: 'PASS' })),
    deliveryPath: ['当前阶段文档', '生成器'],
    changes: ['v1.1 输入门'],
    verification: [{ label: '当前 Verdict', status: 'PASS', evidence: stages[0].locator }],
    risks: [],
    checklist: ['阶段证据必须为当前 PASS。'],
    final: { state: '可生成', nextStage: '后续独立审查', lifecycleDisclaimer: '生成物不代表 PR 已完成。' },
    render: { prBacked: false, state: 'local', note: '仅用于本地回归。' },
  };
}

function completeDomainVerifier(taskId: string) {
  const source = 'skills/example-verifier/SKILL.md';
  return {
    kind: 'domain',
    source,
    version: 'sha256:fixture',
    method: '独立样本检查',
    independence: 'high',
    independenceReason: '使用独立工具输出。',
    confidence: 'medium',
    conclusion: '当前不能确定。',
    unproven: '未证明生产正确性。',
    residualUncertainty: '样本覆盖有限。',
    failureConditions: '输入分布变化。',
    rawEvidence: `.legion/tasks/${taskId}/docs/domain-evidence.json`,
    resources: [source],
    executions: ['node verify-domain.mjs：exit 0'],
  };
}

function prepareTask(taskId: string, profile: ArtifactProfile = 'implementation', risk: 'low' | 'medium' | 'high' = 'low', policy: {
  workflowProfile?: WorkflowProfile;
  designRequired?: boolean;
} = {}) {
  const paths = taskPaths(taskId);
  rmSync(paths.taskRoot, { recursive: true, force: true });
  mkdirSync(paths.docs, { recursive: true });
  writeFileSync(join(paths.taskRoot, 'plan.md'), '# Contract\n');
  writeFileSync(join(paths.docs, 'rfc.md'), '# RFC\n');
  writeFileSync(join(paths.docs, 'review-rfc.md'), '# RFC 审查\n\n## Verdict\n\nPASS\n');
  writeFileSync(join(paths.docs, 'test-report.md'), '# 验证\n\n## Verdict\n\nPASS\n');
  writeFileSync(join(paths.docs, 'review-change.md'), '# 变更审查\n\n## Verdict\n\nPASS\n');
  const input = join(paths.docs, 'report-data.json');
  writeFileSync(input, `${JSON.stringify(reportData(taskId, { profile, risk, ...policy }), null, 2)}\n`);
  return { ...paths, input };
}

function writeInput(input: string, data: unknown) {
  writeFileSync(input, `${JSON.stringify(data, null, 2)}\n`);
}

test('共享 current Verdict parser 只认唯一规范标题后的精确当前值', () => {
  assert.equal(parseCurrentVerdict('# 审查\n\n## Verdict\n\n<!-- 注释 -->\nPASS\n').verdict, 'PASS');
  assert.equal(parseCurrentVerdict('# 历史 PASS\n\n## Verdict\n\nFAIL\n').verdict, 'FAIL');
  for (const source of [
    '# 缺失\nPASS\n',
    '# 重复\n\n## Verdict\nPASS\n\n## Verdict\nPASS\n',
    '# 非精确\n\n## Verdict\nPASS - 通过\n',
    '# 代码块\n\n## Verdict\n```text\nPASS\n```\n',
    '<!--\n## Verdict\nPASS\n-->\n',
    '```md\n## Verdict\nPASS\n```\n',
  ]) {
    assert.equal(parseCurrentVerdict(source).verdict, null);
  }
});

test('OpenCode 不再依赖 custom agents，外部只读验证与目录授权分离', () => {
  const config = JSON.parse(readFileSync(join(repoRoot, 'opencode.json'), 'utf8'));
  assert.equal(existsSync(join(repoRoot, '.opencode', 'agents')), false);
  assert.equal(config.default_agent, undefined);
  assert.equal(config.permission.webfetch, 'allow');
  assert.equal(config.permission.websearch, 'allow');
  assert.equal(config.permission.external_directory, 'ask');
  for (const pattern of ['rm -rf *', 'sudo *', 'ssh *', 'bash -c *', 'node -e *']) {
    assert.equal(config.permission.bash[pattern], 'deny', `${pattern} must remain denied`);
  }
});

test('walkthrough 只要求当前 profile 的最低阶段，不反向升级流程', () => {
  const lite = prepareTask('report-profile-lite', 'implementation', 'low');
  const standard = prepareTask('report-profile-standard', 'implementation', 'medium');
  const strict = prepareTask('report-profile-strict', 'implementation', 'high');
  const strictOverride = prepareTask('report-profile-strict-override', 'implementation', 'low', { workflowProfile: 'strict' });
  const designUpgrade = prepareTask('report-profile-design-upgrade', 'implementation', 'low', { designRequired: true });
  const contractOnly = prepareTask('report-profile-contract-only', 'contract-only', 'low');
  const contractSource = prepareTask('report-profile-contract-source', 'contract-only', 'low');
  const outside = mkdtempSync(join(tmpdir(), 'legion-contract-only-'));
  try {
    for (const name of ['review-change.md', 'rfc.md', 'review-rfc.md']) rmSync(join(lite.docs, name));
    assert.equal(runRenderer(lite.input).status, 0, 'Lite walkthrough only needs current verification');

    for (const name of ['rfc.md', 'review-rfc.md']) rmSync(join(standard.docs, name));
    assert.equal(runRenderer(standard.input).status, 0, 'Standard walkthrough must not imply a Strict RFC gate');

    rmSync(join(strict.docs, 'review-rfc.md'));
    assert.notEqual(runRenderer(strict.input).status, 0, 'Strict walkthrough keeps the reviewed RFC gate');

    rmSync(join(strictOverride.docs, 'review-rfc.md'));
    assert.notEqual(runRenderer(strictOverride.input).status, 0, 'explicit Strict override must survive into walkthrough validation');

    rmSync(join(designUpgrade.docs, 'review-rfc.md'));
    assert.notEqual(runRenderer(designUpgrade.input).status, 0, 'explicit design gate must survive into walkthrough validation');

    for (const name of ['test-report.md', 'review-change.md', 'rfc.md', 'review-rfc.md']) rmSync(join(contractOnly.docs, name));
    assert.equal(runRenderer(contractOnly.input).status, 0, 'Lite design-only contract walkthrough must not invent RFC or review evidence');

    rmSync(join(contractOnly.taskRoot, 'plan.md'));
    assert.notEqual(runRenderer(contractOnly.input).status, 0, 'contract-only must reopen the current plan');
    symlinkSync(join(contractSource.taskRoot, 'plan.md'), join(contractOnly.taskRoot, 'plan.md'));
    assert.notEqual(runRenderer(contractOnly.input).status, 0, 'contract-only must reject a cross-task plan symlink');
    rmSync(join(contractOnly.taskRoot, 'plan.md'));
    const outsidePlan = join(outside, 'plan.md');
    writeFileSync(outsidePlan, '# Outside contract\n');
    symlinkSync(outsidePlan, join(contractOnly.taskRoot, 'plan.md'));
    assert.notEqual(runRenderer(contractOnly.input).status, 0, 'contract-only must reject an outside-repo plan symlink');
  } finally {
    for (const fixture of [lite, standard, strict, strictOverride, designUpgrade, contractOnly, contractSource]) {
      rmSync(fixture.taskRoot, { recursive: true, force: true });
    }
    rmSync(outside, { recursive: true, force: true });
  }
});

test('renderer 把 report-data 与阶段文档绑定到当前 task 的固定规范路径', () => {
  const source = prepareTask('report-path-source');
  const target = prepareTask('report-path-target');
  const outside = mkdtempSync(join(tmpdir(), 'legion-renderer-path-'));
  try {
    assert.equal(runRenderer(target.input).status, 0, '合法普通文件应通过固定路径检查');
    const absoluteInput = spawnSync(process.execPath, [renderer, '--input', target.input, '--check'], { cwd: repoRoot, encoding: 'utf8' });
    assert.notEqual(absoluteInput.status, 0, 'renderer 输入必须使用固定 repo-relative locator');
    assert.match(absoluteInput.stderr, /repo-relative 固定路径/);

    const testReport = join(target.docs, 'test-report.md');
    rmSync(testReport);
    symlinkSync(join(source.docs, 'test-report.md'), testReport);
    const crossTaskStage = runRenderer(target.input);
    assert.notEqual(crossTaskStage.status, 0, '跨 task PASS 阶段文件 symlink 必须拒绝');
    assert.match(crossTaskStage.stderr, /解引用后必须精确等于当前 task 的规范路径/);

    rmSync(testReport);
    writeFileSync(testReport, '# 当前 task 验证\n\n## Verdict\n\nPASS\n');
    const outsideReview = join(outside, 'test-report.md');
    writeFileSync(outsideReview, '# 仓库外审查\n\n## Verdict\n\nPASS\n');
    rmSync(testReport);
    symlinkSync(outsideReview, testReport);
    const outsideStage = runRenderer(target.input);
    assert.notEqual(outsideStage.status, 0, '仓库外 PASS 阶段 symlink 必须拒绝');
    assert.match(outsideStage.stderr, /解引用后必须精确等于当前 task 的规范路径/);

    rmSync(testReport);
    writeFileSync(testReport, '# 当前 task 验证\n\n## Verdict\n\nPASS\n');
    const targetInputSource = readFileSync(target.input, 'utf8');
    rmSync(target.input);
    symlinkSync(source.input, target.input);
    const crossTaskInput = runRenderer(target.input);
    assert.notEqual(crossTaskInput.status, 0, '跨 task report-data.json 文件 symlink 必须拒绝');
    assert.match(crossTaskInput.stderr, /解引用后必须精确等于当前 task 的规范路径/);

    rmSync(target.input);
    const outsideInput = join(outside, 'report-data.json');
    writeFileSync(outsideInput, targetInputSource);
    symlinkSync(outsideInput, target.input);
    const outsideReportData = runRenderer(target.input);
    assert.notEqual(outsideReportData.status, 0, '仓库外 report-data.json 文件 symlink 必须拒绝');
    assert.match(outsideReportData.stderr, /解引用后必须精确等于当前 task 的规范路径/);
  } finally {
    rmSync(source.taskRoot, { recursive: true, force: true });
    rmSync(target.taskRoot, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('renderer 在 repo root 由 symlink 访问时仍接受合法普通文件', () => {
  const target = prepareTask('report-symlink-root-positive');
  const outside = mkdtempSync(join(tmpdir(), 'legion-renderer-root-'));
  const linkedRoot = join(outside, 'repo-link');
  try {
    symlinkSync(repoRoot, linkedRoot, 'dir');
    const rendered = spawnSync(process.execPath, [renderer, '--input', relative(repoRoot, target.input), '--check'], {
      cwd: linkedRoot,
      encoding: 'utf8',
    });
    assert.equal(rendered.status, 0, rendered.stderr);
  } finally {
    rmSync(target.taskRoot, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('v1.1 renderer 对无 verifier 未决项如实生成，并在三份产物顶部投影注意力', () => {
  const taskId = 'report-unverified-fixture';
  const { taskRoot, docs, input } = prepareTask(taskId);
  try {
    const domainLocator = `.legion/tasks/${taskId}/docs/domain-gap.md`;
    writeFileSync(join(docs, 'domain-gap.md'), '# 领域证据缺口\n');
    const claim = {
      claimId: 'claim-domain-gap',
      statement: '当前没有可用领域 verifier。',
      status: 'INCONCLUSIVE',
      expertise: 'domain',
      impact: '不能作为客观验收依据。',
      owner: '领域负责人',
      mitigation: '保持保守默认值。',
      evidence: domainLocator,
      evidenceGap: '缺少可执行的独立领域方法。',
      escalation: '安装匹配 verifier 或缩小主张。',
    };
    const data = reportData(taskId, {
      claims: [claim],
      attention: {
        level: 'review',
        summary: '领域证据尚未获得。',
        humanAction: '复核并接受当前证据缺口。',
        stopPoint: 'auto-merge/merge 前。',
        evidence: [`.legion/tasks/${taskId}/docs/test-report.md`, domainLocator],
      },
    });
    writeInput(input, data);
    const rendered = runRenderer(input, false);
    assert.equal(rendered.status, 0, rendered.stderr);
    for (const name of ['report-walkthrough.html', 'report-walkthrough.md', 'pr-body.md']) {
      const output = readFileSync(join(docs, name), 'utf8');
      for (const expected of ['未获得 verifier', 'claim-domain-gap', 'review', '复核并接受当前证据缺口', 'auto-merge/merge 前', domainLocator]) {
        const markdownLiteral = expected.replaceAll('-', '\\-').replaceAll('.', '\\.');
        assert.ok(output.includes(expected) || output.includes(markdownLiteral), `${name} 顶部或明细应包含 ${expected}`);
      }
      assert.match(output, /implementation/);
      assert.match(output, /low/);
      assert.match(output, /交付类型/);
      assert.match(output, /风险/);
      const topBoundary = name.endsWith('.html') ? output.indexOf('</header>') : output.indexOf('## 未解决的认知状态');
      assert.ok(topBoundary > 0 && output.slice(0, topBoundary).includes('未获得 verifier'), `${name} 顶部必须显式提示 verifier 缺口`);
      const verifierSection = output.slice(output.indexOf('领域验证摘要'));
      assert.match(verifierSection, /未获得 verifier/, `${name} 的领域验证摘要必须逐 claim 显示 verifier 缺口`);
    }

    for (const mutation of [
      (value: any) => { value.attention.level = 'skim'; },
      (value: any) => { value.attention.humanAction = ' '; },
      (value: any) => { value.attention.stopPoint = ' '; },
      (value: any) => { value.attention.evidence = [`.legion/tasks/${taskId}/docs/test-report.md`]; },
      (value: any) => { value.attention.humanAction = '无需动作。'; },
      (value: any) => { value.attention.stopPoint = 'N/A'; },
    ]) {
      const invalid = structuredClone(data) as any;
      mutation(invalid);
      writeInput(input, invalid);
      const checked = runRenderer(input);
      assert.notEqual(checked.status, 0, '无 verifier 的 attention/证据映射缺口必须拒绝');
    }
    for (const field of ['humanAction', 'stopPoint'] as const) {
      for (const placeholder of ['无', '无需动作', 'none', 'n/a', '-']) {
        const invalid = structuredClone(data) as any;
        invalid.attention[field] = placeholder;
        writeInput(input, invalid);
        assert.notEqual(runRenderer(input).status, 0, `${field} 不得使用占位值 ${placeholder}`);
      }
    }

    const recommendation = reportData(taskId, {
      claims: [{
        claimId: 'claim-domain-recommendation',
        statement: '这是需要领域知识的判断性建议。',
        status: 'RECOMMENDATION',
        expertise: 'domain',
        impact: '影响后续方案选择。',
        owner: '方案负责人',
        mitigation: '保留可逆路径。',
        evidence: domainLocator,
        options: ['方案甲', '方案乙'],
        recommendation: '优先方案甲。',
        tradeoff: '成本更低但覆盖较窄。',
        decisionStatus: '待决定',
        decisionOwner: '产品负责人',
      }],
    });
    writeInput(input, recommendation);
    const recommendationRendered = runRenderer(input, false);
    assert.equal(recommendationRendered.status, 0, 'domain RECOMMENDATION 不得被迫伪造 verifier');
    for (const name of ['report-walkthrough.html', 'report-walkthrough.md', 'pr-body.md']) {
      const output = readFileSync(join(docs, name), 'utf8');
      const claimSection = output.slice(output.indexOf('未解决的认知状态'));
      assert.ok(claimSection.includes('claim-domain-recommendation') || claimSection.includes('claim\\-domain\\-recommendation'));
      assert.match(claimSection, /未获得 verifier/);
      assert.match(output.slice(output.indexOf('领域验证摘要')), /未获得 verifier/);
    }
  } finally {
    rmSync(taskRoot, { recursive: true, force: true });
  }
});

test('v1.1 严格拒绝旧输入、状态冲突、严格 Verdict 和缺失高风险阶段', () => {
  const taskId = 'report-strict-verdict-fixture';
  const { taskRoot, docs, input } = prepareTask(taskId);
  try {
    const base = reportData(taskId);
    assert.equal(runRenderer(input).status, 0, 'implementation+low 应只要求 test-report');
    writeInput(input, base);
    assert.equal(runRenderer(input, false).status, 0);
    const outputNames = ['report-walkthrough.html', 'report-walkthrough.md', 'pr-body.md'];
    const beforeV1 = Object.fromEntries(outputNames.map((name) => [name, readFileSync(join(docs, name), 'utf8')]));
    const v1 = structuredClone(base) as any;
    v1.schemaVersion = '1.0';
    v1.summary = '该内容不得写入任何输出。';
    writeInput(input, v1);
    const rejectedV1 = runRenderer(input, false);
    assert.notEqual(rejectedV1.status, 0);
    assert.match(rejectedV1.stderr, /v1\.0 仅为历史 artifact，需按 v1\.1 当前证据重建输入/);
    assert.deepEqual(Object.fromEntries(outputNames.map((name) => [name, readFileSync(join(docs, name), 'utf8')])), beforeV1, 'v1.0 必须在任何输出写入前失败');
    for (const risk of ['medium', 'high'] as const) {
      writeInput(input, reportData(taskId, { risk }));
      assert.equal(runRenderer(input).status, 0, `implementation+${risk} 应在该 profile 当前证据齐全时通过`);
    }
    const invalidInputs: Array<{ name: string; mutate: (value: any) => void; expected?: RegExp }> = [
      { name: 'v1.0 历史输入', mutate: (value) => { value.schemaVersion = '1.0'; }, expected: /v1\.0 仅为历史 artifact，需按 v1\.1 当前证据重建输入/ },
      { name: 'evidence FAIL', mutate: (value) => { value.evidence[0].status = 'FAIL'; } },
      { name: 'verification BLOCKED', mutate: (value) => { value.verification[0].status = 'BLOCKED'; } },
      { name: '缺顶层 risk', mutate: (value) => { delete value.risk; } },
      { name: '缺 resolved workflowProfile', mutate: (value) => { delete value.workflowProfile; }, expected: /必须显式携带已解析 workflowProfile/ },
      { name: '缺 resolved designRequired', mutate: (value) => { delete value.designRequired; }, expected: /必须显式携带已解析 designRequired/ },
      { name: 'Lite 虚报 review PASS', mutate: (value) => { value.reviewStatus = 'PASS'; }, expected: /reviewStatus 必须为 NOT_REQUIRED/ },
      { name: 'Strict 否认设计门', mutate: (value) => { value.workflowProfile = 'strict'; value.designRequired = false; }, expected: /Strict walkthrough 必须声明 designRequired=true/ },
      { name: '未知 risk', mutate: (value) => { value.risk = 'urgent'; } },
      { name: 'risk 放错位置', mutate: (value) => { delete value.risk; value.task.risk = 'low'; } },
      { name: '高风险缺 review-rfc', mutate: (value) => { value.risk = 'high'; } },
    ];
    for (const scenario of invalidInputs) {
      const invalid = structuredClone(base) as any;
      scenario.mutate(invalid);
      writeInput(input, invalid);
      const checked = runRenderer(input);
      assert.notEqual(checked.status, 0, `${scenario.name}必须拒绝`);
      if (scenario.expected) assert.match(checked.stderr, scenario.expected);
    }

    writeInput(input, base);
    for (const source of [
      '# 审查\n\n## Verdict\n\nFAIL\n',
      '# 历史\n\n## 历史 Verdict\n\nPASS\n\n## Verdict\n\nFAIL\n',
      '# 审查\n\n## Verdict\n\nPASS - 不精确\n',
      '# 审查\n\n## Verdict\n\nPASS\n\n## Verdict\n\nPASS\n',
      '# 审查\n\n## Verdict\n\n```text\nPASS\n```\n',
      '# 审查\n\n## verdict\n\nPASS\n',
    ]) {
      writeFileSync(join(docs, 'test-report.md'), source);
      const checked = runRenderer(input);
      assert.notEqual(checked.status, 0, '当前 FAIL、历史 PASS、重复或非精确 Verdict 都必须拒绝');
    }

    writeFileSync(join(docs, 'test-report.md'), '# 验证\n\n## Verdict\n\n<!-- 当前阶段机器结论 -->\n\nPASS\n');
    writeInput(input, base);
    assert.equal(runRenderer(input).status, 0, 'Verdict 后允许跳过空行与 HTML 注释');

    for (const risk of ['low', 'medium', 'high'] as const) {
      writeInput(input, reportData(taskId, { profile: 'rfc-only', risk }));
      assert.equal(runRenderer(input).status, 0, `rfc-only+${risk} 只要求当前 rfc/review-rfc`);
    }
  } finally {
    rmSync(taskRoot, { recursive: true, force: true });
  }
});

test('DEFERRED 无 verifier 的完整协议可生成，伪 verifier 或非法时态字段必须拒绝', () => {
  const taskId = 'report-deferred-fixture';
  const { taskRoot, docs, input } = prepareTask(taskId);
  try {
    const claimLocator = `.legion/tasks/${taskId}/docs/deferred-record.md`;
    writeFileSync(join(docs, 'deferred-record.md'), '# 延后协议\n');
    const claim = {
      claimId: 'claim-authority-deferred',
      statement: '等待可观察触发后再校验权威要求。',
      status: 'DEFERRED',
      expertise: 'authority',
      impact: '当前不对外承诺权威结论。',
      owner: '合规负责人',
      mitigation: '保持受限发布。',
      evidence: claimLocator,
      deferredProtocol: {
        trigger: '签署方发布可核验凭证。',
        method: '按权威证据协议重开并校验凭证。',
        requiredData: [{ name: '签署凭证', source: '签署方登记源', acceptance: '可读取且覆盖当前 claim。' }],
        stopCondition: '凭证无效、过期或范围不覆盖时升级。',
        successorTask: '创建或恢复合规后续 task，并保存原始数据、执行记录和结论。',
        onPass: { nextAction: '在后续 task 继续独立审查。', conclusionUpdate: '在后续证据中记录支持范围。' },
        onFail: { nextAction: '停止发布并升级。', conclusionUpdate: '在后续证据中记录未满足原因。' },
      },
    };
    const data = reportData(taskId, {
      claims: [claim],
      attention: {
        level: 'decide',
        summary: '权威 verifier 尚未获得。',
        humanAction: '决定是否接受 defer-by-contract 风险。',
        stopPoint: '合并前。',
        evidence: [`.legion/tasks/${taskId}/docs/test-report.md`, claimLocator],
      },
    });
    writeInput(input, data);
    const rendered = runRenderer(input, false);
    assert.equal(rendered.status, 0, rendered.stderr);
    for (const name of ['report-walkthrough.html', 'report-walkthrough.md', 'pr-body.md']) {
      const output = readFileSync(join(docs, name), 'utf8');
      for (const expected of ['未获得 verifier', 'claim-authority-deferred', '签署方发布可核验凭证', '合规负责人', '创建或恢复合规后续 task', '在后续 task 继续独立审查', '停止发布并升级']) {
        const escaped = expected.replaceAll('-', '\\-').replaceAll('.', '\\.');
        assert.ok(output.includes(expected) || output.includes(escaped), `${name} 应完整展示 DEFERRED 协议 ${expected}`);
      }
    }

    for (const mutation of [
      (value: any) => { delete value.claims[0].deferredProtocol.trigger; },
      (value: any) => { delete value.claims[0].deferredProtocol.method; },
      (value: any) => { delete value.claims[0].deferredProtocol.requiredData; },
      (value: any) => { value.claims[0].deferredProtocol.requiredData = []; },
      (value: any) => { delete value.claims[0].deferredProtocol.stopCondition; },
      (value: any) => { delete value.claims[0].deferredProtocol.successorTask; },
      (value: any) => { delete value.claims[0].deferredProtocol.onPass.nextAction; },
      (value: any) => { delete value.claims[0].deferredProtocol.onPass.conclusionUpdate; },
      (value: any) => { delete value.claims[0].deferredProtocol.onFail.nextAction; },
      (value: any) => { delete value.claims[0].deferredProtocol.onFail.conclusionUpdate; },
      (value: any) => { value.claims[0].deferredProtocol.onPass.status = 'PASS'; },
      (value: any) => { value.claims[0].deferredProtocol.onFail.status = 'FAIL'; },
      (value: any) => { value.claims[0].deferredProtocol.trigger = '有空时。'; },
      (value: any) => { value.claims[0].triggerObserved = false; },
      (value: any) => { value.claims[0].verifier = completeDomainVerifier(taskId); },
      (value: any) => { value.claims[0].expertise = 'routine'; value.claims[0].verifier = completeDomainVerifier(taskId); },
    ]) {
      const invalid = structuredClone(data) as any;
      mutation(invalid);
      writeInput(input, invalid);
      assert.notEqual(runRenderer(input).status, 0, '不完整协议、未来自报或伪 verifier 必须拒绝');
    }
  } finally {
    rmSync(taskRoot, { recursive: true, force: true });
  }
});

test('DEFERRED 触发后在后续 task 重跑验证与审查，旧报告保持历史且 scheduler 不自动唤醒', () => {
  const originalTaskId = 'report-deferred-history-fixture';
  const successorTaskId = 'report-deferred-successor-fixture';
  const original = prepareTask(originalTaskId);
  const successor = prepareTask(successorTaskId);
  try {
    const claimLocator = `.legion/tasks/${originalTaskId}/docs/deferred-record.md`;
    writeFileSync(join(original.docs, 'deferred-record.md'), '# 延后协议\n');
    const originalData = reportData(originalTaskId, {
      claims: [{
        claimId: 'claim-domain-deferred-history',
        statement: '等待独立生产样本到达后验证。',
        status: 'DEFERRED',
        expertise: 'domain',
        impact: '当前不扩大结论范围。',
        owner: '验证负责人',
        mitigation: '保持保守默认值。',
        evidence: claimLocator,
        deferredProtocol: {
          trigger: '生产样本登记源出现满足验收条件的新批次。',
          method: '在后续 task 运行独立样本验证。',
          requiredData: [{ name: '生产样本批次', source: '生产样本登记源', acceptance: '批次完整且覆盖当前 claim。' }],
          stopCondition: '样本不完整或范围不覆盖时停止并升级。',
          successorTask: `创建或恢复 ${successorTaskId}，保存触发原始数据、验收对应关系、执行记录和结论。`,
          onPass: { nextAction: '在后续 task 进入独立 review-change。', conclusionUpdate: '只在后续证据记录支持范围。' },
          onFail: { nextAction: '在后续 task 停止扩大结论。', conclusionUpdate: '只在后续证据记录失败原因。' },
        },
      }],
      attention: {
        level: 'review',
        summary: '等待可观察触发。',
        humanAction: '复核并接受当前延后验证协议。',
        stopPoint: '合并前。',
        evidence: [`.legion/tasks/${originalTaskId}/docs/test-report.md`, claimLocator],
      },
    });
    writeInput(original.input, originalData);
    assert.equal(runRenderer(original.input, false).status, 0);
    const oldOutputs = Object.fromEntries(['report-walkthrough.html', 'report-walkthrough.md', 'pr-body.md']
      .map((name) => [name, readFileSync(join(original.docs, name), 'utf8')]));

    const triggerLocator = `.legion/tasks/${successorTaskId}/docs/trigger-raw.json`;
    const acceptanceLocator = `.legion/tasks/${successorTaskId}/docs/required-data-map.md`;
    const oldReportLocator = `.legion/tasks/${originalTaskId}/docs/report-walkthrough.md`;
    writeFileSync(join(successor.docs, 'trigger-raw.json'), '{"batch":"production-2026-07-13"}\n');
    writeFileSync(join(successor.docs, 'required-data-map.md'), '# 所需数据验收对应关系\n');
    const successorData = reportData(successorTaskId);
    successorData.summary = '触发事实已在后续 task 落盘，并重新完成验证与独立审查；旧报告只作历史证据。';
    successorData.evidence.push(
      { kind: 'other', label: '满足触发条件的原始证据', locator: triggerLocator, status: 'INFO' },
      { kind: 'other', label: '所需数据与验收条件对应关系', locator: acceptanceLocator, status: 'INFO' },
      { kind: 'other', label: '旧报告历史证据', locator: oldReportLocator, status: 'INFO' },
    );
    successorData.deliveryPath = ['观察可判定触发', '创建或恢复后续 task', 'verify-change', 'review-change', '生成新的 v1.1 报告'];
    successorData.changes = ['新报告只投影当前仍未解决的 claim；已解决结论保留在后续验证与审查证据中。'];
    successorData.verification = [
      { label: '后续 verify-change', status: 'PASS', evidence: `.legion/tasks/${successorTaskId}/docs/test-report.md` },
      { label: '后续独立 review-change', status: 'PASS', evidence: `.legion/tasks/${successorTaskId}/docs/review-change.md` },
    ];
    writeInput(successor.input, successorData);
    assert.equal(runRenderer(successor.input, false).status, 0);

    const successorReport = readFileSync(join(successor.docs, 'report-walkthrough.md'), 'utf8');
    for (const locator of [triggerLocator, acceptanceLocator, oldReportLocator]) {
      assert.ok(successorReport.includes(locator.replaceAll('-', '\\-').replaceAll('.', '\\.')), `后续报告必须记录 ${locator}`);
    }
    const deliverySection = successorReport.slice(successorReport.indexOf('## 交付路径'), successorReport.indexOf('## 变更与决定'));
    assert.ok(deliverySection.indexOf('verify\\-change') < deliverySection.indexOf('review\\-change'), '后续 task 必须先 verify-change，再独立 review-change');
    assert.deepEqual(Object.fromEntries(Object.keys(oldOutputs).map((name) => [name, readFileSync(join(original.docs, name), 'utf8')])), oldOutputs, '后续 task 不得回写或重渲染旧报告');

    const scheduler = readFileSync(join(repoRoot, 'scheduler/src/worker-runner.ts'), 'utf8');
    assert.doesNotMatch(scheduler, /triggerObserved|deferredProtocol|successorTask/, 'scheduler 不得把 DEFERRED 协议误实现为自动唤醒');
  } finally {
    rmSync(original.taskRoot, { recursive: true, force: true });
    rmSync(successor.taskRoot, { recursive: true, force: true });
  }
});

test('profile policy 以行为决定阶段与条件交付，不把阶段切换等同于派生 Agent', () => {
  assert.deepEqual(workflowPolicy({ risk: 'low' }), {
    profile: 'lite', designRequired: false, stages: ['engineer', 'verify-change'], deliveryDisposition: 'summary', wikiDisposition: 'no-change',
  });
  assert.deepEqual(workflowPolicy({ risk: 'medium' }), {
    profile: 'standard', designRequired: false, stages: ['engineer', 'verify-change', 'review-change'], deliveryDisposition: 'summary', wikiDisposition: 'no-change',
  });
  assert.deepEqual(workflowPolicy({ risk: 'high' }), {
    profile: 'strict', designRequired: true, stages: ['spec-rfc', 'review-rfc', 'engineer', 'verify-change', 'review-change'], deliveryDisposition: 'walkthrough', wikiDisposition: 'no-change',
  });
  const upgraded = workflowPolicy({ risk: 'low', labels: ['workflow:strict', 'wiki:write'] });
  assert.equal(upgraded.profile, 'strict');
  assert.equal(upgraded.wikiDisposition, 'write');
  assert.equal(workflowPolicy({ risk: 'medium', labels: ['workflow:lite'] }).profile, 'standard');
  assert.equal(workflowPolicy({ risk: 'medium', labels: ['delivery:walkthrough'] }).deliveryDisposition, 'walkthrough');
  assert.equal(workflowPolicy({ risk: 'low', attention: 'review' }).deliveryDisposition, 'walkthrough');
  assert.equal(workflowPolicy({ risk: 'high', labels: ['delivery:summary'] }).deliveryDisposition, 'walkthrough');
  assert.equal(workflowPolicy({ risk: 'high', runKind: 'brainstorm_only' }).deliveryDisposition, 'walkthrough');
  assert.equal(workflowPolicy({ risk: 'low', labels: ['wiki:write', 'wiki:no-change'] }).wikiDisposition, 'write');
  assert.deepEqual(workflowPolicy({ risk: 'medium', runKind: 'design_only' }).stages, ['spec-rfc', 'review-rfc']);
  assert.deepEqual(workflowPolicy({ risk: 'low', runKind: 'design_only', labels: ['design:rfc'] }).stages, ['spec-rfc', 'review-rfc']);
  assert.deepEqual(workflowPolicy({ risk: 'low', labels: ['design:rfc'] }).stages, ['spec-rfc', 'review-rfc', 'engineer', 'verify-change']);
  assert.throws(() => workflowPolicy({ risk: 'low', labels: ['workflow:stict'] }), /Unsupported workflow control label/);
  assert.throws(() => workflowPolicy({ risk: 'low', labels: ['delivery:walkthough'] }), /Unsupported delivery control label/);
  assert.throws(() => workflowPolicy({ risk: 'low', labels: ['wiki:required'] }), /Unsupported wiki control label/);
  assert.throws(() => workflowPolicy({ risk: 'low', labels: ['design:rfcx'] }), /Unsupported design control label/);
  assert.throws(() => workflowPolicy({ risk: 'low', labels: ['rfc:hevy'] }), /Unsupported rfc control label/);
  assert.doesNotThrow(() => workflowPolicy({ risk: 'low', labels: ['owner:platform'] }), 'unrelated labels remain available to callers');
  assert.throws(() => workflowPolicy({ risk: 'unknown' as any }), /Unsupported workflow risk/);
  assert.throws(() => workflowPolicy({ risk: 'low', attention: 'urgent' as any }), /Unsupported attention level/);
});
