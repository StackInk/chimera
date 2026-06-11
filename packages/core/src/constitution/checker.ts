import type { ConstitutionRule, ViolationRecord } from './types.js';
import type { Phase } from '../types.js';

export interface CheckResult {
  passed: boolean;
  violations: ViolationRecord[];
}

export class ConstitutionChecker {
  private rules: ConstitutionRule[];
  private currentPhase?: Phase;

  constructor(rules: ConstitutionRule[], currentPhase?: Phase) {
    this.rules = rules;
    this.currentPhase = currentPhase;
  }

  checkFileOperation(operation: string, filePath: string): CheckResult {
    const violations: ViolationRecord[] = [];

    for (const rule of this.getActiveRules()) {
      if (rule.check_type !== 'file_pattern') continue;
      if (!rule.pattern) continue;

      if (matchesPattern(filePath, rule.pattern)) {
        violations.push({
          rule_id: rule.id,
          timestamp: new Date().toISOString(),
          operation,
          file: filePath,
          result: rule.priority === 'MUST' ? 'blocked' : 'warned',
          message: `Violates ${rule.id}: ${rule.description}`,
        });
      }
    }

    return {
      passed: violations.filter(v => v.result === 'blocked').length === 0,
      violations,
    };
  }

  checkCoverage(coveragePercent: number): CheckResult {
    const violations: ViolationRecord[] = [];

    for (const rule of this.getActiveRules()) {
      if (rule.check_type !== 'coverage') continue;
      if (rule.threshold === undefined) continue;

      if (coveragePercent < rule.threshold) {
        violations.push({
          rule_id: rule.id,
          timestamp: new Date().toISOString(),
          operation: 'coverage_check',
          result: rule.priority === 'MUST' ? 'blocked' : 'warned',
          message: `Coverage ${coveragePercent}% < required ${rule.threshold}% (${rule.id}: ${rule.description})`,
        });
      }
    }

    return {
      passed: violations.filter(v => v.result === 'blocked').length === 0,
      violations,
    };
  }

  private getActiveRules(): ConstitutionRule[] {
    if (!this.currentPhase) return this.rules;
    return this.rules.filter(rule => {
      if (!rule.scope) return true;
      return rule.scope.includes(this.currentPhase!);
    });
  }
}

function matchesPattern(filePath: string, pattern: string): boolean {
  const regex = globToRegex(pattern);
  return regex.test(filePath);
}

function globToRegex(glob: string): RegExp {
  let regexStr = glob
    .replace(/\./g, '\\.')
    .replace(/\*\*\//g, '(.+/)?')
    .replace(/\*/g, '[^/]*');
  return new RegExp('^' + regexStr + '$');
}
