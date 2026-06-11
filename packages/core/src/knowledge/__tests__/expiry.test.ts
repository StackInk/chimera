import { describe, it, expect } from 'vitest';
import { checkExpiry } from '../expiry.js';
import type { KnowledgeBlock } from '../types.js';

function makeBlock(overrides: Partial<KnowledgeBlock> = {}): KnowledgeBlock {
  return {
    id: 'kb-001',
    title: 'Test',
    summary: 'sum',
    content: 'content',
    tags: [],
    source_feature: 'f-1',
    created_at: '2026-01-01T00:00:00Z',
    expires_at: '2026-03-01T00:00:00Z',
    git_ref: 'abc',
    status: 'active',
    dependencies: [],
    ...overrides,
  };
}

describe('checkExpiry', () => {
  it('marks as stale when expired', () => {
    const block = makeBlock({ expires_at: '2025-01-01T00:00:00Z' });
    const result = checkExpiry(block);
    expect(result.expired).toBe(true);
  });

  it('not expired when expires_at is in the future', () => {
    const block = makeBlock({ expires_at: '2099-01-01T00:00:00Z' });
    const result = checkExpiry(block);
    expect(result.expired).toBe(false);
  });

  it('never expires when expires_at is null', () => {
    const block = makeBlock({ expires_at: null });
    const result = checkExpiry(block);
    expect(result.expired).toBe(false);
  });

  it('returns days overdue for expired blocks', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const block = makeBlock({ expires_at: yesterday });
    const result = checkExpiry(block);
    expect(result.expired).toBe(true);
    expect(result.daysOverdue).toBeGreaterThanOrEqual(0);
  });
});
