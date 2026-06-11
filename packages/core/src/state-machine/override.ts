import type { Phase, TransitionRecord } from '../types.js';

export interface OverrideResult {
  allowed: boolean;
  record: TransitionRecord;
}

export function createOverrideRecord(from: Phase, to: Phase, reason: string): TransitionRecord {
  return {
    from,
    to,
    timestamp: new Date().toISOString(),
    trigger: 'user',
    reason: `[OVERRIDE] ${reason}`,
    guard_results: [{ guard: 'user_override', passed: true, message: 'User explicitly confirmed cross-phase operation' }],
  };
}
