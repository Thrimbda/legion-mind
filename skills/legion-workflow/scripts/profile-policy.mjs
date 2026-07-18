const PROFILE_RANK = Object.freeze({ lite: 0, standard: 1, strict: 2 });
const RISK_PROFILE = Object.freeze({ low: 'lite', medium: 'standard', high: 'strict' });
const CONTROL_LABEL_VALUES = Object.freeze({
  profile: new Set(['lite', 'standard', 'strict']),
  workflow: new Set(['lite', 'standard', 'strict']),
  delivery: new Set(['summary', 'walkthrough']),
  wiki: new Set(['no-change', 'write']),
  design: new Set(['rfc']),
  rfc: new Set(['standard', 'heavy']),
});

function normalizedLabels(labels = []) {
  if (!Array.isArray(labels)) throw new Error('Workflow labels must be an array');
  const normalized = labels.map((label) => String(label).trim().toLowerCase()).filter(Boolean);
  for (const label of normalized) {
    const separator = label.indexOf(':');
    if (separator < 0) continue;
    const namespace = label.slice(0, separator);
    const value = label.slice(separator + 1);
    const allowed = CONTROL_LABEL_VALUES[namespace];
    if (allowed && !allowed.has(value)) {
      throw new Error(`Unsupported ${namespace} control label: ${label}`);
    }
  }
  return new Set(normalized);
}

function assertedProfile(labels) {
  const requested = ['lite', 'standard', 'strict'].filter((profile) =>
    labels.has(`profile:${profile}`) || labels.has(`workflow:${profile}`));
  return requested.sort((left, right) => PROFILE_RANK[right] - PROFILE_RANK[left])[0];
}

export function workflowProfileForRisk(risk, labels = []) {
  const base = RISK_PROFILE[risk];
  if (!base) throw new Error(`Unsupported workflow risk: ${String(risk)}`);
  const requested = assertedProfile(normalizedLabels(labels));
  if (!requested || PROFILE_RANK[requested] <= PROFILE_RANK[base]) return base;
  return requested;
}

export function workflowPolicy({ risk, runKind = 'implementation', labels = [], attention = 'none' }) {
  const labelSet = normalizedLabels(labels);
  const profile = workflowProfileForRisk(risk, labels);
  if (!['none', 'skim', 'review', 'decide'].includes(attention)) {
    throw new Error(`Unsupported attention level: ${String(attention)}`);
  }
  const explicitDesign = labelSet.has('design:rfc')
    || labelSet.has('rfc:standard')
    || labelSet.has('rfc:heavy');
  const designRequired = profile === 'strict'
    || explicitDesign
    || (runKind === 'design_only' && profile === 'standard');

  const stages = [];
  if (runKind === 'brainstorm_only') {
    stages.push('brainstorm');
  } else if (designRequired) {
    stages.push('spec-rfc', 'review-rfc');
  }
  if (runKind === 'implementation') {
    stages.push('engineer', 'verify-change');
    if (profile !== 'lite') stages.push('review-change');
  } else if (!['design_only', 'brainstorm_only'].includes(runKind)) {
    throw new Error(`Unsupported workflow run kind: ${String(runKind)}`);
  }

  const deliveryDisposition = (
    profile === 'strict'
    || labelSet.has('delivery:walkthrough')
    || attention === 'review'
    || attention === 'decide'
  )
    ? 'walkthrough'
    : 'summary';
  const wikiDisposition = labelSet.has('wiki:write') ? 'write' : 'no-change';

  return Object.freeze({
    profile,
    designRequired,
    stages: Object.freeze(stages),
    deliveryDisposition,
    wikiDisposition,
  });
}
