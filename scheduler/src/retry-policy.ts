export type FailureClassification = 'retryable' | 'conditionally_retryable' | 'non_retryable' | 'control_signal';

export const RETRYABLE_FAILURE_TYPES = [
  'linear_api_5xx',
  'github_api_transient',
  'worker_infra_crash',
  'network_timeout',
  'worker_timeout',
  'agent_failed',
] as const;

export const CONDITIONALLY_RETRYABLE_FAILURE_TYPES = [
  'verification_failed',
  'merge_conflict',
  'checks_failure',
  'pr_blocked',
] as const;

export const NON_RETRYABLE_FAILURE_TYPES = [
  'contract_missing',
  'needs_human',
  'security_blocked',
  'dependency_cycle',
  'permission_denied',
  'result_identity_mismatch',
  'unknown_result',
] as const;

export const CONTROL_SIGNAL_FAILURE_TYPES = [
  'native_stop_requested',
  'admin_cancelled',
  'worker_cancelled',
] as const;

export interface RetryPolicyOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface RetryDecisionInput extends RetryPolicyOptions {
  failureType: string;
  attemptNumber: number;
  scopeRepairable?: boolean;
  now?: string;
}

export interface RetryDecision {
  retry: boolean;
  classification: FailureClassification;
  reason: string;
  nextAttemptNumber?: number;
  notBefore?: string;
  backoffMs?: number;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 60_000;

function includes<const T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value as T[number]);
}

export function classifyFailure(failureType: string): FailureClassification {
  if (includes(RETRYABLE_FAILURE_TYPES, failureType)) return 'retryable';
  if (includes(CONDITIONALLY_RETRYABLE_FAILURE_TYPES, failureType)) return 'conditionally_retryable';
  if (includes(CONTROL_SIGNAL_FAILURE_TYPES, failureType)) return 'control_signal';
  return 'non_retryable';
}

export function retryBackoffMs(attemptNumber: number, options: RetryPolicyOptions = {}): number {
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const exponent = Math.max(0, attemptNumber - 1);
  return Math.min(baseDelayMs * (2 ** exponent), maxDelayMs);
}

export function decideRetry(input: RetryDecisionInput): RetryDecision {
  const classification = classifyFailure(input.failureType);
  const maxAttempts = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const now = input.now ?? new Date().toISOString();

  if (classification === 'control_signal') {
    return { retry: false, classification, reason: `${input.failureType} is a control signal and is not retried automatically.` };
  }
  if (classification === 'non_retryable') {
    return { retry: false, classification, reason: `${input.failureType} is non-retryable.` };
  }
  if (classification === 'conditionally_retryable' && input.scopeRepairable !== true) {
    return { retry: false, classification, reason: `${input.failureType} is retryable only when the worker can repair it in scope.` };
  }
  if (input.attemptNumber >= maxAttempts) {
    return { retry: false, classification, reason: `Retry limit reached (${input.attemptNumber}/${maxAttempts}).` };
  }

  const backoffMs = retryBackoffMs(input.attemptNumber, input);
  return {
    retry: true,
    classification,
    reason: `${input.failureType} is ${classification}; scheduling retry ${input.attemptNumber + 1}/${maxAttempts}.`,
    nextAttemptNumber: input.attemptNumber + 1,
    backoffMs,
    notBefore: new Date(Date.parse(now) + backoffMs).toISOString(),
  };
}

export function retryNotBeforeDue(notBefore: string | null | undefined, now = new Date().toISOString()): boolean {
  if (!notBefore) return true;
  return Date.parse(notBefore) <= Date.parse(now);
}
