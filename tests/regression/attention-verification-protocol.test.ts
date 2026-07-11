import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import {
  defaultEvidencePaths,
  verifyLegionEvidence,
} from '../../scheduler/src/worker-runner.ts';
import type { LegionEvidencePaths, WorkerResultBlock } from '../../scheduler/src/worker-runner.ts';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const regressionCacheRoot = join(repoRoot, '.cache', 'regression');

const attentionReferencePath = 'skills/legion-workflow/references/REF_HUMAN_ATTENTION.md';
const cognitiveReferencePath = 'skills/verify-change/references/REF_COGNITIVE_VERIFICATION.md';

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), 'utf-8');
}

function assertContains(source: string, expected: string, message: string): void {
  assert.equal(source.includes(expected), true, message);
}

function assertContainsAll(source: string, expected: string[], context: string): void {
  for (const item of expected) {
    assertContains(source, item, `${context}应包含“${item}”`);
  }
}

function temporaryRoot(name: string): string {
  mkdirSync(regressionCacheRoot, { recursive: true });
  return mkdtempSync(join(regressionCacheRoot, `${name}-`));
}

function writeRepoRelative(root: string, path: string, content: string): void {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

type ExecutableClaimStatus = 'PASS' | 'INCONCLUSIVE';

interface EvidenceEvaluation {
  status: ExecutableClaimStatus;
  checks: string[];
  reasons: string[];
}

interface ProvenanceResource {
  locator: string;
  sha256: string;
}

interface ProvenanceEvidence {
  verifierLocator?: string;
  verifierSha256?: string;
  resources?: ProvenanceResource[];
  executions?: Array<{ command: string; exitCode: number; resultId: string }>;
  rawOutputLocator?: string;
  claimMappings?: Array<{ claimId: string; method: string; rawOutputLocator: string }>;
}

interface AuthorityEvidence {
  evaluatedSubject: string;
  issuer: string;
  credential: string;
  credentialSourceLocator: string;
  claimScopes: string[];
  issuedAt: string;
  expiresAt: string;
  rawLocator: string;
  validations: {
    integrity: { method: string; passed: boolean };
    authenticity: { method: string; passed: boolean };
    signature: { method: string; passed: boolean };
  };
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function reopenLocator(root: string, locator: string | undefined): string | null {
  if (!locator || isAbsolute(locator)) return null;
  const normalizedRoot = resolve(root);
  const absolute = resolve(normalizedRoot, locator);
  if (absolute !== normalizedRoot && !absolute.startsWith(`${normalizedRoot}/`)) return null;
  try {
    return readFileSync(absolute, 'utf-8');
  } catch {
    return null;
  }
}

function evaluateProvenance(root: string, claimId: string, evidence: ProvenanceEvidence): EvidenceEvaluation {
  const checks: string[] = [];
  const reasons: string[] = [];
  const verifierContent = reopenLocator(root, evidence.verifierLocator);
  if (!evidence.verifierLocator) {
    reasons.push('缺少 verifier locator');
  } else if (verifierContent === null) {
    reasons.push('verifier locator 不可重开');
  } else {
    checks.push('已重开 verifier locator');
    if (!evidence.verifierSha256) {
      reasons.push('缺少 verifier 摘要');
    } else {
      checks.push('已重算 verifier SHA-256');
      if (sha256(verifierContent) !== evidence.verifierSha256) reasons.push('verifier 摘要不一致');
    }
  }

  if (!evidence.resources || evidence.resources.length === 0) {
    reasons.push('缺少实际读取资源清单');
  } else {
    for (const resource of evidence.resources) {
      const content = reopenLocator(root, resource.locator);
      if (content === null) {
        reasons.push(`资源 locator 不可重开：${resource.locator}`);
      } else if (!resource.sha256 || sha256(content) !== resource.sha256) {
        reasons.push(`资源摘要不一致：${resource.locator}`);
      } else {
        checks.push(`已重开并重算资源：${resource.locator}`);
      }
    }
  }

  if (!evidence.executions || evidence.executions.length === 0
    || evidence.executions.some((record) => !record.command || !Number.isInteger(record.exitCode) || !record.resultId)) {
    reasons.push('缺少完整执行记录');
  } else {
    checks.push('已核对执行记录');
  }

  const rawOutput = reopenLocator(root, evidence.rawOutputLocator);
  if (rawOutput === null) {
    reasons.push('缺少可重开的原始输出');
  } else {
    checks.push('已重开原始输出');
  }

  const matchingMapping = evidence.claimMappings?.find((mapping) => (
    mapping.claimId === claimId
    && Boolean(mapping.method)
    && mapping.rawOutputLocator === evidence.rawOutputLocator
  ));
  if (!matchingMapping) {
    reasons.push('缺少原始输出、方法与 claim-id 的映射');
  } else {
    checks.push('已核对 claim 映射');
  }

  return { status: reasons.length === 0 ? 'PASS' : 'INCONCLUSIVE', checks, reasons };
}

function evaluateAuthority(root: string, claimId: string, now: Date, evidence?: AuthorityEvidence): EvidenceEvaluation {
  const checks: string[] = [];
  const reasons: string[] = [];
  if (!evidence) return { status: 'INCONCLUSIVE', checks, reasons: ['权威证据缺失'] };

  if (!evidence.evaluatedSubject || !evidence.issuer || !evidence.credential) reasons.push('主体或资质缺失');
  const credentialSource = reopenLocator(root, evidence.credentialSourceLocator);
  if (credentialSource === null) reasons.push('资质来源 locator 不可读取');
  else checks.push('已读取并核对资质来源');
  if (!evidence.claimScopes.includes(claimId)) reasons.push('证据适用范围不覆盖 claim');

  const issuedAt = Date.parse(evidence.issuedAt);
  const expiresAt = Date.parse(evidence.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || issuedAt > now.getTime() || expiresAt <= now.getTime()) {
    reasons.push('权威证据已过期或有效期无效');
  }

  if (reopenLocator(root, evidence.rawLocator) === null) reasons.push('权威原始 locator 不可读取');
  else checks.push('已读取权威原始证据');

  for (const [name, label] of [
    ['integrity', '完整性'],
    ['authenticity', '真实性'],
    ['signature', '签名'],
  ] as const) {
    const validation = evidence.validations[name];
    if (!validation.method || validation.passed !== true) reasons.push(`${label}校验失败`);
    else checks.push(`${label}校验通过`);
  }

  return { status: reasons.length === 0 ? 'PASS' : 'INCONCLUSIVE', checks, reasons };
}

function evidenceFixture(root: string, taskId: string): LegionEvidencePaths {
  const paths = defaultEvidencePaths(taskId);
  const claimTable = `
## Claim 登记与状态

| claim-id | 当前状态 | blocking-policy |
|---|---|---|
| claim-domain | INCONCLUSIVE | block-merge |
| claim-future | DEFERRED | defer-by-contract |
`;
  const passReview = `# 阶段审查\n${claimTable}\n## Verdict\n\nPASS\n`;
  const entries: Array<[keyof LegionEvidencePaths, string]> = [
    ['plan', '# 任务契约\n'],
    ['tasks', '# 当前状态\n'],
    ['log', '# 过程日志\n'],
    ['rfc', '# 设计 RFC\n'],
    ['reviewRfc', passReview],
    ['testReport', `# 验证报告\n${claimTable}`],
    ['reviewChange', passReview],
    ['report', '# 交付审阅\n'],
    ['wiki', '# 任务知识摘要\n'],
  ];
  for (const [key, content] of entries) {
    const path = paths[key];
    assert.ok(path, `测试 fixture 应提供 ${String(key)} 路径`);
    writeRepoRelative(root, path, content);
  }
  return paths;
}

function verifyFixture(root: string, taskId: string, evidence: LegionEvidencePaths) {
  const result: WorkerResultBlock = {
    runResult: 'done',
    linearIssue: 'TEST-1',
    taskId,
    legionEvidence: evidence,
  };
  return verifyLegionEvidence(result, {
    repoPath: root,
    runKind: 'implementation',
    risk: 'high',
    prBacked: false,
  });
}

test('两份协议 reference 是单一真源，关键阶段正确引用而不另造协议', () => {
  const attention = readRepoFile(attentionReferencePath);
  const cognitive = readRepoFile(cognitiveReferencePath);

  assert.match(attention, /本协议是.+单一真源/s, '注意力 reference 应声明自己是摘要与门禁的单一真源');
  assert.match(cognitive, /它是.+单一真源/s, '认知验证 reference 应声明自己是验证分类与证据规则的单一真源');

  const stages = [
    ['review-rfc', readRepoFile('skills/review-rfc/SKILL.md')],
    ['verify-change', readRepoFile('skills/verify-change/SKILL.md')],
    ['review-change', readRepoFile('skills/review-change/SKILL.md')],
    ['report-walkthrough', readRepoFile('skills/report-walkthrough/SKILL.md')],
  ] as const;

  for (const [name, source] of stages) {
    assertContains(source, 'REF_HUMAN_ATTENTION.md', `${name} 应引用统一注意力协议`);
    assertContains(source, 'REF_COGNITIVE_VERIFICATION.md', `${name} 应引用统一认知验证协议`);
  }
});

test('注意力协议固定摘要字段、四级等级、噪音上限与 lifecycle 门禁', () => {
  const attention = readRepoFile(attentionReferencePath);
  const workflow = readRepoFile('skills/legion-workflow/SKILL.md');
  const autopilot = readRepoFile('skills/legion-workflow/references/REF_AUTOPILOT.md');

  assertContainsAll(attention, [
    '| 阶段 |',
    '| 阶段结论 |',
    '| 注意力等级 |',
    '| 判断变化 |',
    '| 关键发现 |',
    '| 阻塞项 |',
    '| 残余风险 |',
    '| 人类动作 |',
    '| 自动下一步 |',
    '| 完整证据 |',
  ], '注意力摘要 schema');

  assertContains(attention, 'decide > review > skim > none', '四级注意力应具有固定优先级');
  for (const level of ['none', 'skim', 'review', 'decide']) {
    assert.match(attention, new RegExp('^\\| `' + level + '` \\|', 'm'), `lifecycle 协议应定义 ${level} 行`);
  }
  assert.match(attention, /关键发现[^\n]*最多三项|关键发现最多三项/, '关键发现应限制为最多三项');
  assertContainsAll(attention, [
    '阶段链允许动作',
    'PR lifecycle 允许动作',
    '停止点与恢复条件',
    '不得启用 auto-merge、执行 merge、cleanup 或宣告完成',
    '`decide` 优先于阶段 `FAIL` 的普通回退',
    '等待人类决定',
  ], 'attention/lifecycle matrix');
  assert.match(attention, /在派生下一阶段.+之前.+摘要直接呈现给用户/s, '摘要必须在派生下一阶段前投影');
  assert.match(workflow, /投影未发生时不得派生下一阶段/, 'orchestrator 应把投影前置为硬门');
  assert.doesNotMatch(autopilot, /对话只贴路径\s*\+\s*一句话摘要|路径\s*\+\s*一句话摘要/, '旧“路径 + 一句话摘要”规则必须移除');
});

test('认知验证协议完整定义三轴、预注册字段、五种状态与专业证据边界', () => {
  const cognitive = readRepoFile(cognitiveReferencePath);

  assertContainsAll(cognitive, [
    '### 主张性质',
    '`objective`',
    '`formal`',
    '`judgmental`',
    '### 验证时机',
    '`now`',
    '`deferred`',
    '`unavailable`',
    '`not-applicable`',
    '### 专业门槛',
    '`routine`',
    '`domain`',
    '`authority`',
  ], '三轴验证模型');
  assertContainsAll(cognitive, [
    '`domain-id`',
    '`required-capability`',
    '`required-method`',
    '`criticality`',
    '`risk-if-wrong`',
    '`blocking-policy`',
  ], 'claim 预注册字段');

  const statusSection = cognitive.match(/Claim 状态只有以下五种：([\s\S]*?)Claim 状态不能替代阶段门/);
  assert.ok(statusSection, '应存在独立的五种 claim 状态定义区块');
  const statuses = [...statusSection[1].matchAll(/^- `([A-Z]+)`：/gm)].map((match) => match[1]);
  assert.deepEqual(statuses, ['PASS', 'FAIL', 'INCONCLUSIVE', 'DEFERRED', 'RECOMMENDATION'], 'claim 状态必须恰好保留五种诚实语义');

  assertContainsAll(cognitive, [
    'verifier 的精确 locator',
    '版本标识',
    '全部必要 reference 清单',
    '实际执行的命令或工具调用',
    'repo 内原始输出 locator',
    '与 `claim-id` 的逐项映射',
  ], 'verifier provenance');
  assert.match(cognitive, /只有主体与资质来源可确认.+才允许与其他证据共同支持 `PASS`/s, 'authority 正路径应要求主体、范围、有效性与校验同时成立');
  assert.match(cognitive, /任一负路径都必须返回 `INCONCLUSIVE`/, 'authority 负路径应诚实返回 INCONCLUSIVE');

  assertContainsAll(cognitive, [
    '触发类型与条件',
    '届时负责发起验证的人或角色',
    '届时方法、所需数据与证据保存位置',
    '当前风险、临时缓解、失败影响与回滚/停止条件',
    '触发后成功和失败分别如何更新结论',
  ], 'DEFERRED 协议');
  assertContainsAll(cognitive, [
    '可选方案',
    '判断标准与事实依据',
    '价值取舍与可逆性',
    '最强反方理由',
    '推荐方案与 decision owner',
  ], 'RECOMMENDATION 协议');
});

test('三个审查阶段都要求中文摘要 handoff，并保留独立精确 Verdict', () => {
  const stages = [
    ['review-rfc', 'skills/review-rfc/SKILL.md', 'docs/review-rfc.md'],
    ['verify-change', 'skills/verify-change/SKILL.md', 'docs/test-report.md'],
    ['review-change', 'skills/review-change/SKILL.md', 'docs/review-change.md'],
  ] as const;

  for (const [name, path, evidencePath] of stages) {
    const source = readRepoFile(path);
    assertContains(source, evidencePath, `${name} 应把摘要内嵌到既有证据 ${evidencePath}`);
    assertContains(source, '## 会话注意力摘要', `${name} 应产出中文会话注意力摘要`);
    assert.match(source, /handoff[^\n]*原样返回|最终 handoff 原样返回/, `${name} 应原样返回已落盘摘要`);
    assertContains(source, '## Verdict', `${name} 应保留独立阶段 Verdict`);
    assert.match(source, /下一有效内容只能是 `PASS` 或 `FAIL`|值为 `PASS` 或 `FAIL`/, `${name} 的 Verdict 应保持 scheduler 可识别的精确语义`);
  }
});

test('scheduler 只认独立 PASS Verdict，不会把细粒度 claim 状态误作阶段结论', () => {
  const root = temporaryRoot('attention-verdict');
  try {
    const taskId = 'attention-verdict-fixture';
    const evidence = evidenceFixture(root, taskId);

    const passed = verifyFixture(root, taskId, evidence);
    assert.equal(passed.ok, true, 'claim 表含 INCONCLUSIVE/DEFERRED 时，独立 ## Verdict PASS 仍应通过');

    const reviewChangePath = join(root, evidence.reviewChange as string);
    writeFileSync(reviewChangePath, '# 阶段审查\n\n| claim-id | 当前状态 |\n|---|---|\n| claim-ok | PASS |\n');
    const missingVerdict = verifyFixture(root, taskId, evidence);
    assert.equal(missingVerdict.ok, false, '缺少独立 Verdict 时，即使 claim 表含 PASS 也不得通过');
    assert.equal(missingVerdict.failures.some((failure) => failure.includes('review-change.md missing PASS verdict')), true, '缺失 Verdict 应由 scheduler 给出明确失败原因');

    writeFileSync(reviewChangePath, '# 阶段审查\n\n| claim-id | 当前状态 |\n|---|---|\n| claim-ok | PASS |\n\n## Verdict\n\nFAIL\n');
    const failedVerdict = verifyFixture(root, taskId, evidence);
    assert.equal(failedVerdict.ok, false, '独立 Verdict 为 FAIL 时不得被 claim PASS 行绕过');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('provenance 正例会重开 locator 与重算摘要，逐项缺失或不一致只能得到 INCONCLUSIVE', () => {
  const root = temporaryRoot('provenance');
  try {
    const claimId = 'claim-security-authz';
    const skillLocator = 'verifier/SKILL.md';
    const referenceLocator = 'verifier/references/checklist.md';
    const rawOutputLocator = 'evidence/authz-result.json';
    const skillContent = '# 授权边界验证器\n';
    const referenceContent = '# 检查清单\n- 校验跨租户访问\n';
    writeRepoRelative(root, skillLocator, skillContent);
    writeRepoRelative(root, referenceLocator, referenceContent);
    writeRepoRelative(root, rawOutputLocator, '{"crossTenantDenied":true}\n');

    const valid: ProvenanceEvidence = {
      verifierLocator: skillLocator,
      verifierSha256: sha256(skillContent),
      resources: [
        { locator: skillLocator, sha256: sha256(skillContent) },
        { locator: referenceLocator, sha256: sha256(referenceContent) },
      ],
      executions: [{ command: 'node verify-authz.mjs', exitCode: 0, resultId: 'authz-run-1' }],
      rawOutputLocator,
      claimMappings: [{ claimId, method: '跨租户拒绝实验', rawOutputLocator }],
    };

    const passed = evaluateProvenance(root, claimId, valid);
    assert.equal(passed.status, 'PASS', '完整 provenance 应实际导出 PASS');
    assertContainsAll(passed.checks, [
      '已重开 verifier locator',
      '已重算 verifier SHA-256',
      '已核对执行记录',
      '已重开原始输出',
      '已核对 claim 映射',
    ], 'provenance 正例执行轨迹');
    assert.equal(passed.checks.some((check) => check.includes(referenceLocator)), true, '正例应重开并重算必要 reference');

    const cases: Array<{ name: string; expectedReason: string; mutate: (fixture: ProvenanceEvidence) => void }> = [
      { name: '缺 verifier locator', expectedReason: '缺少 verifier locator', mutate: (fixture) => { delete fixture.verifierLocator; } },
      { name: '缺 verifier 摘要', expectedReason: '缺少 verifier 摘要', mutate: (fixture) => { delete fixture.verifierSha256; } },
      { name: '缺资源清单', expectedReason: '缺少实际读取资源清单', mutate: (fixture) => { fixture.resources = []; } },
      { name: '缺执行记录', expectedReason: '缺少完整执行记录', mutate: (fixture) => { fixture.executions = []; } },
      { name: '缺原始输出', expectedReason: '缺少可重开的原始输出', mutate: (fixture) => { fixture.rawOutputLocator = 'evidence/not-found.json'; } },
      { name: '缺 claim 映射', expectedReason: '缺少原始输出、方法与 claim-id 的映射', mutate: (fixture) => { fixture.claimMappings = []; } },
      { name: '摘要不一致', expectedReason: 'verifier 摘要不一致', mutate: (fixture) => { fixture.verifierSha256 = sha256('被篡改的摘要'); } },
    ];

    for (const scenario of cases) {
      const fixture = structuredClone(valid);
      scenario.mutate(fixture);
      const result = evaluateProvenance(root, claimId, fixture);
      assert.equal(result.status, 'INCONCLUSIVE', `${scenario.name}时只能导出 INCONCLUSIVE`);
      assert.equal(result.reasons.includes(scenario.expectedReason), true, `${scenario.name}应给出可读失败原因`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('authority 有效证据导出 PASS，缺失、过期、越界、不可读或任一校验失败均导出 INCONCLUSIVE', () => {
  const root = temporaryRoot('authority');
  try {
    const claimId = 'claim-privacy-compliance';
    const credentialSourceLocator = 'authority/credential-registry.json';
    const rawLocator = 'authority/signed-attestation.json';
    writeRepoRelative(root, credentialSourceLocator, '{"issuer":"独立审计机构","active":true}\n');
    writeRepoRelative(root, rawLocator, '{"claim":"claim-privacy-compliance","signature":"valid"}\n');

    const valid: AuthorityEvidence = {
      evaluatedSubject: 'LegionMind 隐私边界',
      issuer: '独立审计机构',
      credential: '合规审计资质 A-001',
      credentialSourceLocator,
      claimScopes: [claimId],
      issuedAt: '2026-07-01T00:00:00.000Z',
      expiresAt: '2027-07-01T00:00:00.000Z',
      rawLocator,
      validations: {
        integrity: { method: 'SHA-256 完整性校验', passed: true },
        authenticity: { method: '资质登记源交叉核对', passed: true },
        signature: { method: '签名链校验', passed: true },
      },
    };
    const now = new Date('2026-07-11T00:00:00.000Z');
    const passed = evaluateAuthority(root, claimId, now, valid);
    assert.equal(passed.status, 'PASS', '主体、资质来源、范围、有效期、locator 与三类校验完整时应导出 PASS');
    assertContainsAll(passed.checks, [
      '已读取并核对资质来源',
      '已读取权威原始证据',
      '完整性校验通过',
      '真实性校验通过',
      '签名校验通过',
    ], 'authority 正例执行轨迹');

    const cases: Array<{ name: string; expectedReason: string; fixture: AuthorityEvidence | undefined }> = [
      { name: '证据缺失', expectedReason: '权威证据缺失', fixture: undefined },
      { name: '证据过期', expectedReason: '权威证据已过期或有效期无效', fixture: { ...structuredClone(valid), expiresAt: '2026-07-10T00:00:00.000Z' } },
      { name: '范围越界', expectedReason: '证据适用范围不覆盖 claim', fixture: { ...structuredClone(valid), claimScopes: ['claim-other'] } },
      { name: 'locator 不可读', expectedReason: '权威原始 locator 不可读取', fixture: { ...structuredClone(valid), rawLocator: 'authority/not-found.json' } },
      { name: '完整性失败', expectedReason: '完整性校验失败', fixture: { ...structuredClone(valid), validations: { ...structuredClone(valid.validations), integrity: { method: 'SHA-256 完整性校验', passed: false } } } },
      { name: '真实性失败', expectedReason: '真实性校验失败', fixture: { ...structuredClone(valid), validations: { ...structuredClone(valid.validations), authenticity: { method: '资质登记源交叉核对', passed: false } } } },
      { name: '签名失败', expectedReason: '签名校验失败', fixture: { ...structuredClone(valid), validations: { ...structuredClone(valid.validations), signature: { method: '签名链校验', passed: false } } } },
    ];

    for (const scenario of cases) {
      const result = evaluateAuthority(root, claimId, now, scenario.fixture);
      assert.equal(result.status, 'INCONCLUSIVE', `${scenario.name}时只能导出 INCONCLUSIVE`);
      assert.equal(result.reasons.includes(scenario.expectedReason), true, `${scenario.name}应给出可读失败原因`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
