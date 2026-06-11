import type { Phase } from '../types.js';

export type RulePriority = 'MUST' | 'SHOULD' | 'MAY';
export type CheckType = 'file_pattern' | 'content_match' | 'coverage' | 'custom';

export interface ConstitutionRule {
  id: string;
  priority: RulePriority;
  description: string;
  scope?: Phase[];
  check_type: CheckType;
  pattern?: string;
  threshold?: number;
}

export interface ViolationRecord {
  rule_id: string;
  timestamp: string;
  operation: string;
  file?: string;
  result: 'blocked' | 'warned';
  message: string;
}
