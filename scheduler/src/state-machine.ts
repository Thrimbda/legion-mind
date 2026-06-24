export const RUN_STATES = [
  'queued',
  'running',
  'in_review',
  'blocked',
  'done',
  'failed',
  'cancelled',
  'abandoned',
] as const;

export type RunState = typeof RUN_STATES[number];

export const ACTIVE_RUN_STATES = ['queued', 'running', 'in_review', 'blocked'] as const;
export const TERMINAL_NON_SUCCESS_RUN_STATES = ['failed', 'cancelled', 'abandoned'] as const;

const transitionTable: Record<RunState, RunState[]> = {
  queued: ['running', 'blocked', 'failed', 'cancelled', 'abandoned'],
  running: ['in_review', 'blocked', 'failed', 'cancelled', 'abandoned'],
  in_review: ['done', 'blocked', 'failed', 'cancelled', 'abandoned'],
  blocked: ['running', 'in_review', 'failed', 'cancelled', 'abandoned'],
  done: [],
  failed: [],
  cancelled: [],
  abandoned: [],
};

export function isRunState(value: string): value is RunState {
  return RUN_STATES.includes(value as RunState);
}

export function isActiveRunState(state: RunState): boolean {
  return ACTIVE_RUN_STATES.includes(state as typeof ACTIVE_RUN_STATES[number]);
}

export function isTerminalSuccessRunState(state: RunState): boolean {
  return state === 'done';
}

export function isTerminalNonSuccessRunState(state: RunState): boolean {
  return TERMINAL_NON_SUCCESS_RUN_STATES.includes(state as typeof TERMINAL_NON_SUCCESS_RUN_STATES[number]);
}

export function isTerminalRunState(state: RunState): boolean {
  return isTerminalSuccessRunState(state) || isTerminalNonSuccessRunState(state);
}

export function canTransitionRun(from: RunState, to: RunState): boolean {
  return transitionTable[from].includes(to);
}

export function assertValidRunTransition(from: RunState, to: RunState) {
  if (from === to) {
    return;
  }
  if (!canTransitionRun(from, to)) {
    throw new Error(`Illegal run state transition: ${from} -> ${to}`);
  }
}
