import { parseCurrentVerdict } from './current-verdict.mjs';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'references', 'report-data.schema.json');

export function loadReportDataSchema() {
  return JSON.parse(readFileSync(schemaPath, 'utf8'));
}

function isStrictRepoChild(repoRoot, candidate) {
  const locator = relative(repoRoot, candidate);
  return locator !== ''
    && locator !== '..'
    && !locator.startsWith(`..${sep}`)
    && !isAbsolute(locator);
}

function isFixedRepoRelativeLocator(locator) {
  return typeof locator === 'string'
    && locator !== ''
    && !isAbsolute(locator)
    && !locator.includes('\\')
    && locator.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}

// 该同步 realpath 检查绑定本次读取边界；普通文件系统无法消除检查完成后的 TOCTOU。
export function resolveExactRepoFile(repoRoot, candidate, expectedLocator) {
  if (!isFixedRepoRelativeLocator(candidate)) {
    return { failure: `候选文件必须是当前仓库内的规范 repo-relative 固定路径：${String(candidate)}` };
  }
  const fixedLocator = expectedLocator ?? candidate;
  if (!isFixedRepoRelativeLocator(fixedLocator)) {
    return { failure: `当前 task 固定 locator 不合法：${String(fixedLocator)}` };
  }
  if (candidate !== fixedLocator) {
    return { failure: `候选文件必须精确等于当前 task 固定 locator ${fixedLocator}` };
  }

  let repoReal;
  try {
    repoReal = realpathSync(repoRoot);
  } catch (error) {
    return { failure: `仓库根目录无法解析：${error instanceof Error ? error.message : String(error)}` };
  }

  const candidateAbsolute = resolve(repoReal, candidate);
  if (!isStrictRepoChild(repoReal, candidateAbsolute)) {
    return { failure: `候选文件必须位于当前仓库内：${candidate}` };
  }
  const candidateLocator = relative(repoReal, candidateAbsolute).split(sep).join('/');
  const expectedAbsolute = resolve(repoReal, fixedLocator);
  if (!isStrictRepoChild(repoReal, expectedAbsolute)) {
    return { failure: `规范 locator 必须位于当前仓库内：${fixedLocator}` };
  }

  let candidateReal;
  try {
    candidateReal = realpathSync(candidateAbsolute);
  } catch (error) {
    return { failure: `固定证据无法解析：${candidateLocator}：${error instanceof Error ? error.message : String(error)}` };
  }
  if (candidateReal !== expectedAbsolute) {
    return {
      failure: `固定证据解引用后必须精确等于当前 task 的规范路径 ${fixedLocator}，实际为 ${candidateReal}`,
    };
  }
  return { path: candidateReal, locator: candidateLocator, repoRoot: repoReal };
}

function jsonPointer(root, reference) {
  if (!reference.startsWith('#/')) throw new Error(`只支持本地 schema 引用：${reference}`);
  return reference.slice(2).split('/').reduce((value, token) => {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    return value?.[key];
  }, root);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function matchesType(value, type) {
  if (type === 'object') return isObject(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'null') return value === null;
  return true;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateSchema(value, current, root, path = '$', errors = []) {
  if (current === true) return errors;
  if (current === false) {
    errors.push(`${path} 不被 schema 允许`);
    return errors;
  }
  if (current.$ref) {
    const target = jsonPointer(root, current.$ref);
    if (!target) throw new Error(`schema 引用不存在：${current.$ref}`);
    return validateSchema(value, target, root, path, errors);
  }

  if (current.const !== undefined && !sameValue(value, current.const)) {
    errors.push(`${path} 必须等于 ${JSON.stringify(current.const)}`);
  }
  if (current.enum && !current.enum.some((candidate) => sameValue(value, candidate))) {
    errors.push(`${path} 必须是 ${current.enum.map((item) => JSON.stringify(item)).join('、')} 之一`);
  }
  if (current.type && !matchesType(value, current.type)) {
    errors.push(`${path} 类型必须是 ${current.type}`);
    return errors;
  }

  for (const child of current.allOf ?? []) validateSchema(value, child, root, path, errors);
  if (current.anyOf) {
    const valid = current.anyOf.some((child) => validateSchema(value, child, root, path, []).length === 0);
    if (!valid) errors.push(`${path} 不满足 anyOf 中的任何分支`);
  }
  if (current.oneOf) {
    const count = current.oneOf.filter((child) => validateSchema(value, child, root, path, []).length === 0).length;
    if (count !== 1) errors.push(`${path} 必须且只能满足 oneOf 的一个分支`);
  }
  if (current.not && validateSchema(value, current.not, root, path, []).length === 0) {
    errors.push(`${path} 命中了禁止分支`);
  }
  if (current.if) {
    const branch = validateSchema(value, current.if, root, path, []).length === 0 ? current.then : current.else;
    if (branch) validateSchema(value, branch, root, path, errors);
  }

  if (typeof value === 'string') {
    if (current.minLength !== undefined && [...value].length < current.minLength) errors.push(`${path} 不能为空`);
    if (current.maxLength !== undefined && [...value].length > current.maxLength) errors.push(`${path} 超过长度上限 ${current.maxLength}`);
    if (current.pattern && !(new RegExp(current.pattern, 'u')).test(value)) errors.push(`${path} 格式不合法`);
  }

  if (Array.isArray(value)) {
    if (current.minItems !== undefined && value.length < current.minItems) errors.push(`${path} 至少需要 ${current.minItems} 项`);
    if (current.maxItems !== undefined && value.length > current.maxItems) errors.push(`${path} 最多允许 ${current.maxItems} 项`);
    if (current.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) errors.push(`${path} 不允许重复项`);
    }
    if (current.items) value.forEach((item, index) => validateSchema(item, current.items, root, `${path}[${index}]`, errors));
    if (current.contains) {
      const count = value.filter((item, index) => validateSchema(item, current.contains, root, `${path}[${index}]`, []).length === 0).length;
      const minimum = current.minContains ?? 1;
      const maximum = current.maxContains ?? Number.POSITIVE_INFINITY;
      if (count < minimum || count > maximum) errors.push(`${path} 没有满足 contains 要求的项目`);
    }
  }

  if (isObject(value)) {
    for (const key of current.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${path}.${key} 为必填字段`);
    }
    for (const [key, child] of Object.entries(current.properties ?? {})) {
      if (Object.hasOwn(value, key)) validateSchema(value[key], child, root, `${path}.${key}`, errors);
    }
    if (current.additionalProperties === false) {
      const allowed = new Set(Object.keys(current.properties ?? {}));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) errors.push(`${path}.${key} 是未声明字段`);
      }
    }
  }
  return errors;
}

function walkStrings(value, visitor, path = '$') {
  if (typeof value === 'string') {
    visitor(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, visitor, `${path}[${index}]`));
    return;
  }
  if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) walkStrings(item, visitor, `${path}.${key}`);
  }
}

export function reportStageRequirements(taskId, profile, risk) {
  const root = `.legion/tasks/${taskId}/docs`;
  if (profile === 'implementation') {
    const stages = [
      { kind: 'test-report', locator: `${root}/test-report.md`, requiresPass: true },
      { kind: 'review-change', locator: `${root}/review-change.md`, requiresPass: true },
    ];
    if (risk === 'medium' || risk === 'high') {
      stages.push(
        { kind: 'rfc', locator: `${root}/rfc.md`, requiresPass: false },
        { kind: 'review-rfc', locator: `${root}/review-rfc.md`, requiresPass: true },
      );
    }
    return stages;
  }
  if (profile === 'rfc-only') {
    return [
      { kind: 'rfc', locator: `${root}/rfc.md`, requiresPass: false },
      { kind: 'review-rfc', locator: `${root}/review-rfc.md`, requiresPass: true },
    ];
  }
  return [];
}

export function walkthroughStageRequirements(taskId, data) {
  const root = `.legion/tasks/${taskId}/docs`;
  const workflowProfile = data?.workflowProfile ?? ({ low: 'lite', medium: 'standard', high: 'strict' })[data?.risk];
  if (data?.profile === 'contract-only') {
    return [{ kind: 'plan', locator: `.legion/tasks/${taskId}/plan.md`, requiresPass: false }];
  }
  if (data?.profile === 'rfc-only') {
    return [
      { kind: 'rfc', locator: `${root}/rfc.md`, requiresPass: false },
      { kind: 'review-rfc', locator: `${root}/review-rfc.md`, requiresPass: true },
    ];
  }
  if (data?.profile !== 'implementation') return [];
  const stages = [{ kind: 'test-report', locator: `${root}/test-report.md`, requiresPass: true }];
  if (workflowProfile === 'standard' || workflowProfile === 'strict') {
    stages.push({ kind: 'review-change', locator: `${root}/review-change.md`, requiresPass: true });
  }
  if (workflowProfile === 'strict' || data?.designRequired === true) {
    stages.push(
      { kind: 'rfc', locator: `${root}/rfc.md`, requiresPass: false },
      { kind: 'review-rfc', locator: `${root}/review-rfc.md`, requiresPass: true },
    );
  }
  return stages;
}

export function expectedReportProfile(runKind) {
  if (runKind === 'implementation') return 'implementation';
  if (runKind === 'design_only') return 'rfc-only';
  return null;
}

export function validateRuntimeReportBinding(data, { runKind, risk }) {
  const expectedProfile = expectedReportProfile(runKind);
  if (!expectedProfile) return [`不支持 runKind=${runKind} 的 v1.1 收口报告`];
  const errors = [];
  if (data?.profile !== expectedProfile) {
    errors.push(`report-data.json profile 必须为 ${expectedProfile}，与 runKind=${runKind} 对应`);
  }
  if (data?.risk !== risk) {
    errors.push(`report-data.json risk 必须与 scheduler 风险 ${risk} 字面一致`);
  }
  return errors;
}

function isAttentionPlaceholder(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase().replace(/[。.!！]+$/u, '').trim();
  return new Set(['无', '无需动作', 'none', 'n/a', '-']).has(normalized);
}

function isVagueDeferredTrigger(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase().replace(/[。.!！]+$/u, '').trim();
  return new Set(['有空时', '以后再看']).has(normalized);
}

export function semanticErrors(data) {
  const errors = [];
  const claims = Array.isArray(data?.claims) ? data.claims : [];
  walkStrings(data, (value, path) => {
    if (value.includes('—')) errors.push(`${path} 含禁止的 em dash 字符`);
  });
  for (const [index, claim] of claims.entries()) {
    if (claim.verifier && claim.expertise === 'routine') {
      errors.push(`$.claims[${index}].verifier 不能用于 routine claim`);
    } else if (claim.verifier && claim.verifier.kind !== claim.expertise) {
      errors.push(`$.claims[${index}].verifier.kind 必须与 expertise 一致`);
    }
    if (claim.verifier && (!Array.isArray(claim.verifier.resources) || !claim.verifier.resources.includes(claim.verifier.source))) {
      errors.push(`$.claims[${index}].verifier.resources 必须包含 verifier.source 以保持 provenance 可追溯`);
    }
    if (claim.status === 'DEFERRED' && isVagueDeferredTrigger(claim.deferredProtocol?.trigger)) {
      errors.push(`$.claims[${index}].deferredProtocol.trigger 必须是可观察、可判定的触发条件`);
    }
  }
  if (data?.render?.url) {
    try {
      const url = new URL(data.render.url);
      if (url.protocol !== 'https:' || url.username || url.password) errors.push('$.render.url 只允许无凭据的 https URL');
    } catch {
      errors.push('$.render.url 不是有效 URL');
    }
  }

  if (data?.workflowProfile) {
    const rank = { lite: 0, standard: 1, strict: 2 };
    const riskMinimum = { low: 0, medium: 1, high: 2 };
    if (rank[data.workflowProfile] < riskMinimum[data.risk]) {
      errors.push('$.workflowProfile 不能低于 risk 对应的最低 profile');
    }
    if (data.workflowProfile === 'strict' && data.designRequired !== true) {
      errors.push('Strict walkthrough 必须声明 designRequired=true');
    }
    if (data.profile === 'contract-only') {
      if (data.workflowProfile !== 'lite' || data.designRequired !== false || data.reviewStatus !== 'NOT_REQUIRED') {
        errors.push('contract-only 只允许 Lite、designRequired=false、reviewStatus=NOT_REQUIRED');
      }
    } else if (data.profile === 'rfc-only') {
      if (data.designRequired !== true || data.reviewStatus !== 'PASS') {
        errors.push('rfc-only 必须声明 designRequired=true 且 reviewStatus=PASS');
      }
    } else if (data.profile === 'implementation') {
      if (data.workflowProfile === 'lite' && data.reviewStatus !== 'NOT_REQUIRED') {
        errors.push('Lite implementation 的 reviewStatus 必须为 NOT_REQUIRED');
      } else if (data.workflowProfile !== 'lite' && data.reviewStatus !== 'PASS') {
        errors.push('Standard/Strict implementation 的 reviewStatus 必须为 PASS');
      }
    }
  } else if (data?.reviewStatus !== 'PASS') {
    errors.push('legacy report-data 缺少 workflowProfile 时 reviewStatus 必须为 PASS');
  }

  const unresolvedWithoutVerifier = claims.filter((claim) => (
    (claim.expertise === 'domain' || claim.expertise === 'authority')
    && !claim.verifier
    && (claim.status === 'INCONCLUSIVE' || claim.status === 'DEFERRED')
  ));
  if (unresolvedWithoutVerifier.length > 0) {
    const levelOrder = { none: 0, skim: 1, review: 2, decide: 3 };
    const attention = data.attention ?? {};
    if ((levelOrder[attention.level] ?? -1) < levelOrder.review) {
      errors.push('未获得 verifier 的领域或权威 claim 要求 attention.level 至少为 review');
    }
    if (typeof attention.humanAction !== 'string' || attention.humanAction.trim() === '') {
      errors.push('未获得 verifier 时 attention.humanAction 必须是唯一且非空的当前人类动作');
    } else if (isAttentionPlaceholder(attention.humanAction)) {
      errors.push('未获得 verifier 时 attention.humanAction 不能使用占位值');
    }
    if (typeof attention.stopPoint !== 'string' || attention.stopPoint.trim() === '') {
      errors.push('未获得 verifier 时 attention.stopPoint 必须非空');
    } else if (isAttentionPlaceholder(attention.stopPoint)) {
      errors.push('未获得 verifier 时 attention.stopPoint 不能使用占位值');
    }
    const attentionEvidence = new Set(Array.isArray(attention.evidence) ? attention.evidence : []);
    for (const claim of unresolvedWithoutVerifier) {
      if (typeof claim.evidence !== 'string' || claim.evidence.trim() === '') {
        errors.push(`未获得 verifier 的 claim ${claim.claimId ?? '未知'} 必须有非空 evidence locator`);
      } else if (!attentionEvidence.has(claim.evidence)) {
        errors.push(`未获得 verifier 的 claim ${claim.claimId ?? '未知'} evidence 必须出现在 attention.evidence`);
      }
    }
  }
  return errors;
}

export function validateReportData(data, schema) {
  if (data?.schemaVersion === '1.0') {
    return ['v1.0 仅为历史 artifact，需按 v1.1 当前证据重建输入'];
  }
  return [...validateSchema(data, schema, schema), ...semanticErrors(data)];
}

export function validateWalkthroughPolicyBinding(data) {
  const errors = [];
  if (!['lite', 'standard', 'strict'].includes(data?.workflowProfile)) {
    errors.push('walkthrough 必须显式携带已解析 workflowProfile');
  }
  if (typeof data?.designRequired !== 'boolean') {
    errors.push('walkthrough 必须显式携带已解析 designRequired');
  }
  return errors;
}

export function validateCurrentReportEvidence(data, { taskId, documents, stages }) {
  const errors = [];
  if (data?.task?.id !== taskId) {
    errors.push(`report-data.json task.id 必须等于当前 taskId ${taskId}`);
    return errors;
  }
  for (const stage of stages ?? reportStageRequirements(taskId, data?.profile, data?.risk)) {
    const evidence = Array.isArray(data?.evidence) ? data.evidence : [];
    const matchingEvidence = evidence.filter((item) => item?.kind === stage.kind);
    if (!matchingEvidence.some((item) => item.locator === stage.locator && item.status === 'PASS')) {
      errors.push(`${stage.kind} 必须以 PASS 状态精确指向 ${stage.locator}`);
    }
    const source = documents?.[stage.locator];
    if (typeof source !== 'string') {
      errors.push(`无法重新读取当前阶段文档：${stage.locator}`);
      continue;
    }
    if (stage.requiresPass) {
      const verdict = parseCurrentVerdict(source);
      if (verdict.verdict !== 'PASS') {
        errors.push(`${stage.locator} 当前 Verdict 不是 PASS：${verdict.error ?? verdict.verdict}`);
      }
    }
  }
  return errors;
}
