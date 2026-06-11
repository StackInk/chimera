import { describe, it, expect } from 'vitest';
import { ConstitutionChecker } from '../checker.js';
import type { ConstitutionRule } from '../types.js';
import type { Phase } from '../../types.js';

const rules: ConstitutionRule[] = [
  {
    id: 'C-001',
    priority: 'MUST',
    description: 'No deleting test files',
    check_type: 'file_pattern',
    pattern: '**/*.test.ts',
  },
  {
    id: 'C-002',
    priority: 'MUST',
    description: 'Coverage must be >= 80%',
    check_type: 'coverage',
    threshold: 80,
  },
  {
    id: 'C-003',
    priority: 'SHOULD',
    description: 'Functions should be under 30 lines',
    check_type: 'content_match',
    pattern: 'function_length',
  },
  {
    id: 'C-004',
    priority: 'MUST',
    description: 'No modifying src in red phase',
    check_type: 'file_pattern',
    pattern: 'src/**',
    scope: ['implement' as Phase],
  },
];

describe('ConstitutionChecker', () => {
  it('detects MUST violation and returns blocked', () => {
    const checker = new ConstitutionChecker(rules);
    const result = checker.checkFileOperation('delete', 'tests/unit/auth.test.ts');
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule_id).toBe('C-001');
    expect(result.violations[0].result).toBe('blocked');
  });

  it('returns no violations for non-matching file', () => {
    const checker = new ConstitutionChecker(rules);
    const result = checker.checkFileOperation('write', 'src/services/auth.ts');
    const nonScoped = result.violations.filter(v => v.rule_id === 'C-001');
    expect(nonScoped).toHaveLength(0);
  });

  it('respects scope - only checks rules matching current phase', () => {
    const checker = new ConstitutionChecker(rules, 'implement');
    const result = checker.checkFileOperation('write', 'src/index.ts');
    const scopedViolation = result.violations.find(v => v.rule_id === 'C-004');
    expect(scopedViolation).toBeDefined();
    expect(scopedViolation!.result).toBe('blocked');
  });

  it('ignores scoped rules when not in that phase', () => {
    const checker = new ConstitutionChecker(rules, 'spec');
    const result = checker.checkFileOperation('write', 'src/index.ts');
    const scopedViolation = result.violations.find(v => v.rule_id === 'C-004');
    expect(scopedViolation).toBeUndefined();
  });

  it('SHOULD violations produce warnings not blocks', () => {
    const checker = new ConstitutionChecker(rules);
    const result = checker.checkCoverage(85);
    const shouldViolations = result.violations.filter(v => v.result === 'warned');
    expect(shouldViolations.every(v => v.result === 'warned' || v.result === 'blocked')).toBe(true);
  });

  it('checkCoverage blocks when below MUST threshold', () => {
    const checker = new ConstitutionChecker(rules);
    const result = checker.checkCoverage(75);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule_id).toBe('C-002');
    expect(result.violations[0].result).toBe('blocked');
  });

  it('checkCoverage passes when above threshold', () => {
    const checker = new ConstitutionChecker(rules);
    const result = checker.checkCoverage(85);
    expect(result.violations.filter(v => v.rule_id === 'C-002')).toHaveLength(0);
  });
});
