export const REDACTED = '[REDACTED]';

export interface SchedulerLogContext {
  traceId?: string | null;
  projectKey?: string | null;
  projectId?: string | null;
  linearIdentifier?: string | null;
  runId?: string | null;
  attemptId?: string | null;
  taskId?: string | null;
  repoKey?: string | null;
  prUrl?: string | null;
  linearAgentSessionId?: string | null;
  eventType?: string | null;
}

export interface StructuredLogEvent {
  event_type: string;
  context: Record<string, string>;
  payload: unknown;
}

export interface MetricSample {
  name: string;
  value: number;
  labels: Record<string, string>;
}

export interface MetricsSnapshot {
  counters: MetricSample[];
  gauges: MetricSample[];
  timings: MetricSample[];
}

const SENSITIVE_KEY_PATTERN = /(^|[-_])(token|secret|password|passwd|api[-_]?key|authorization|signature|cookie|set[-_]?cookie|client[-_]?secret|access[-_]?token|refresh[-_]?token)($|[-_])/i;
const KNOWN_TOKEN_VALUE_PATTERN = /\b(Bearer|Linear)\s+[A-Za-z0-9._~+/-]+=*|\bghp_[A-Za-z0-9_]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/gi;
const OPAQUE_SECRET_PATTERN = /^[A-Za-z0-9_.+=-]{48,}$/;
const SIGNED_URL_PARAMS = new Set([
  'x-amz-signature',
  'x-amz-security-token',
  'x-goog-signature',
  'x-goog-credential',
  'signature',
  'sig',
  'token',
  'access_token',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function sensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

function redactUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return value;
  }
  let changed = false;
  for (const key of [...parsed.searchParams.keys()]) {
    if (SIGNED_URL_PARAMS.has(key.toLowerCase()) || sensitiveKey(key)) {
      parsed.searchParams.set(key, REDACTED);
      changed = true;
    }
  }
  return changed ? parsed.toString() : value;
}

function redactString(value: string): string {
  const urlRedacted = redactUrl(value);
  const tokenRedacted = urlRedacted.replace(KNOWN_TOKEN_VALUE_PATTERN, (match) => {
    const prefix = match.match(/^(Bearer|Linear)\s+/i)?.[0] ?? '';
    return `${prefix}${REDACTED}`;
  });
  if (OPAQUE_SECRET_PATTERN.test(tokenRedacted) && /[A-Za-z]/.test(tokenRedacted) && /[0-9]/.test(tokenRedacted)) {
    return REDACTED;
  }
  return tokenRedacted;
}

export function redactSecrets<T>(value: T): T {
  if (typeof value === 'string') {
    return redactString(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }
  if (isPlainObject(value)) {
    const redacted: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      redacted[key] = sensitiveKey(key) ? REDACTED : redactSecrets(item);
    }
    return redacted as T;
  }
  return value;
}

function contextEntries(context: SchedulerLogContext = {}): Record<string, string> {
  const mapping: Array<[string, string | null | undefined]> = [
    ['trace_id', context.traceId],
    ['project_key', context.projectKey],
    ['project_id', context.projectId],
    ['linear_identifier', context.linearIdentifier],
    ['run_id', context.runId],
    ['attempt_id', context.attemptId],
    ['task_id', context.taskId],
    ['repo_key', context.repoKey],
    ['pr_url', context.prUrl],
    ['linear_agent_session_id', context.linearAgentSessionId],
    ['event_type', context.eventType],
  ];
  return Object.fromEntries(mapping.filter(([, value]) => value !== null && value !== undefined && value !== '').map(([key, value]) => [key, String(value)]));
}

export function structuredLog(eventType: string, context: SchedulerLogContext = {}, payload: unknown = {}): StructuredLogEvent {
  return {
    event_type: eventType,
    context: contextEntries({ ...context, eventType }),
    payload: redactSecrets(payload),
  };
}

function labelsKey(labels: Record<string, string> = {}): string {
  return JSON.stringify(Object.entries(labels).sort(([left], [right]) => left.localeCompare(right)));
}

function sample(name: string, value: number, labels: Record<string, string> = {}): MetricSample {
  return { name, value, labels: Object.fromEntries(Object.entries(labels).sort(([left], [right]) => left.localeCompare(right))) };
}

export class SchedulerMetrics {
  private readonly counters = new Map<string, MetricSample>();
  private readonly gauges = new Map<string, MetricSample>();
  private readonly timings = new Map<string, MetricSample>();

  increment(name: string, labels: Record<string, string> = {}, value = 1) {
    const key = `${name}:${labelsKey(labels)}`;
    const current = this.counters.get(key) ?? sample(name, 0, labels);
    current.value += value;
    this.counters.set(key, current);
  }

  gauge(name: string, value: number, labels: Record<string, string> = {}) {
    this.gauges.set(`${name}:${labelsKey(labels)}`, sample(name, value, labels));
  }

  timing(name: string, durationMs: number, labels: Record<string, string> = {}) {
    this.timings.set(`${name}:${labelsKey(labels)}`, sample(name, durationMs, labels));
  }

  snapshot(): MetricsSnapshot {
    const sortSamples = (values: Iterable<MetricSample>) => [...values].sort((left, right) => left.name.localeCompare(right.name) || labelsKey(left.labels).localeCompare(labelsKey(right.labels)));
    return {
      counters: sortSamples(this.counters.values()),
      gauges: sortSamples(this.gauges.values()),
      timings: sortSamples(this.timings.values()),
    };
  }
}
