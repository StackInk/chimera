import { describe, it, expect } from 'vitest';
import { parseConstitution } from '../parser.js';

const sampleConstitution = `# Project Constitution

## MUST

- C-001: All public APIs must have JSDoc comments
- C-002: Test coverage must not drop below 80%
- C-003: No direct push to main branch
- C-004: [scope:implement] No files larger than 300 lines

## SHOULD

- C-010: Functions should not exceed 30 lines
- C-011: [scope:implement,review] Prefer composition over inheritance

## MAY

- C-020: Use barrel exports for cleaner imports
`;

describe('parseConstitution', () => {
  it('parses MUST rules', () => {
    const rules = parseConstitution(sampleConstitution);
    const mustRules = rules.filter(r => r.priority === 'MUST');
    expect(mustRules).toHaveLength(4);
    expect(mustRules[0].id).toBe('C-001');
    expect(mustRules[0].description).toBe('All public APIs must have JSDoc comments');
  });

  it('parses SHOULD rules', () => {
    const rules = parseConstitution(sampleConstitution);
    const shouldRules = rules.filter(r => r.priority === 'SHOULD');
    expect(shouldRules).toHaveLength(2);
    expect(shouldRules[0].id).toBe('C-010');
  });

  it('parses MAY rules', () => {
    const rules = parseConstitution(sampleConstitution);
    const mayRules = rules.filter(r => r.priority === 'MAY');
    expect(mayRules).toHaveLength(1);
    expect(mayRules[0].id).toBe('C-020');
  });

  it('extracts scope from inline annotation', () => {
    const rules = parseConstitution(sampleConstitution);
    const scoped = rules.find(r => r.id === 'C-004');
    expect(scoped?.scope).toEqual(['implement']);
  });

  it('extracts multiple scopes', () => {
    const rules = parseConstitution(sampleConstitution);
    const scoped = rules.find(r => r.id === 'C-011');
    expect(scoped?.scope).toEqual(['implement', 'review']);
  });

  it('returns empty array for empty content', () => {
    expect(parseConstitution('')).toEqual([]);
  });

  it('handles constitution without rules', () => {
    const noRules = '# Constitution\n\nSome intro text.';
    expect(parseConstitution(noRules)).toEqual([]);
  });
});
