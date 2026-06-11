import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { KnowledgeBlockStore } from '../../packages/core/src/knowledge/block.js';
import { checkExpiry } from '../../packages/core/src/knowledge/expiry.js';
import { CCRCache } from '../../packages/core/src/compression/ccr-cache.js';
import { ContentRouter } from '../../packages/core/src/compression/content-router.js';

describe('E2E: Knowledge archive → check → read cycle', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-e2e-knowledge-'));
    mkdirSync(join(tempDir, '.chimera', 'archive', 'blocks'), { recursive: true });
    mkdirSync(join(tempDir, '.chimera', 'cache'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('archive → compress → cache → retrieve cycle', () => {
    const store = new KnowledgeBlockStore(tempDir);
    const router = new ContentRouter();
    const cache = new CCRCache(tempDir);

    // Archive: create knowledge block
    const content = 'export function authenticate(token: string): boolean {\n  return jwt.verify(token) !== null;\n}';
    const compressed = router.compress(content);

    const block = store.create({
      title: 'Auth Function',
      summary: compressed.summary,
      content,
      tags: ['auth', 'security'],
      source_feature: 'feature-001',
      git_ref: 'abc123',
      expires_at: '2026-09-10',
    });

    // Cache original
    cache.store(block.id, content);

    // Read: retrieve summary (compressed)
    const stored = store.read(block.id)!;
    expect(stored.summary).toBe(compressed.summary);
    expect(stored.summary.length).toBeLessThan(content.length);

    // CCR retrieve: get full original
    const original = cache.retrieve(block.id);
    expect(original).toBe(content);
  });

  it('expiry check detects overdue blocks', () => {
    const store = new KnowledgeBlockStore(tempDir);
    const block = store.create({
      title: 'Old Decision',
      summary: 'sum',
      content: 'details',
      tags: ['old'],
      source_feature: 'f-1',
      git_ref: 'xyz',
      expires_at: '2025-01-01',
    });

    const result = checkExpiry(store.read(block.id)!);
    expect(result.expired).toBe(true);
    expect(result.daysOverdue).toBeGreaterThan(0);
  });

  it('active block with future expiry is not expired', () => {
    const store = new KnowledgeBlockStore(tempDir);
    const block = store.create({
      title: 'Fresh',
      summary: 'sum',
      content: 'c',
      tags: [],
      source_feature: 'f',
      git_ref: 'g',
      expires_at: '2099-12-31',
    });

    const result = checkExpiry(store.read(block.id)!);
    expect(result.expired).toBe(false);
  });

  it('stale marking via updateStatus', () => {
    const store = new KnowledgeBlockStore(tempDir);
    const block = store.create({
      title: 'Will be stale',
      summary: 's',
      content: 'c',
      tags: [],
      source_feature: 'f',
      git_ref: 'g',
      expires_at: null,
    });

    store.updateStatus(block.id, 'stale');
    expect(store.read(block.id)!.status).toBe('stale');

    store.updateStatus(block.id, 'active');
    expect(store.read(block.id)!.status).toBe('active');
  });
});
