import { describe, it, expect } from 'vitest';
import { checkFileRestriction } from '../restrictions.js';
import type { TDDCycle } from '../types.js';

describe('TDD file restrictions', () => {
  it('allows test files in red phase', () => {
    const result = checkFileRestriction('red', 'tests/unit/auth.test.ts');
    expect(result.allowed).toBe(true);
  });

  it('blocks src files in red phase', () => {
    const result = checkFileRestriction('red', 'src/services/auth.ts');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('RED');
  });

  it('allows src files in green phase', () => {
    const result = checkFileRestriction('green', 'src/services/auth.ts');
    expect(result.allowed).toBe(true);
  });

  it('blocks test files in green phase', () => {
    const result = checkFileRestriction('green', 'tests/unit/auth.test.ts');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('GREEN');
  });

  it('allows any file in refactor phase', () => {
    expect(checkFileRestriction('refactor', 'src/auth.ts').allowed).toBe(true);
    expect(checkFileRestriction('refactor', 'tests/auth.test.ts').allowed).toBe(true);
  });

  it('treats .spec. files as test files', () => {
    expect(checkFileRestriction('red', 'src/auth.spec.ts').allowed).toBe(true);
    expect(checkFileRestriction('green', 'src/auth.spec.ts').allowed).toBe(false);
  });

  it('allows config/non-code files in any phase', () => {
    expect(checkFileRestriction('red', 'package.json').allowed).toBe(true);
    expect(checkFileRestriction('green', 'tsconfig.json').allowed).toBe(true);
    expect(checkFileRestriction('red', 'README.md').allowed).toBe(true);
  });
});
