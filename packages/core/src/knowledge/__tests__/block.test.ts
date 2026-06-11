import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { KnowledgeBlockStore } from '../block.js';

describe('KnowledgeBlockStore', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-blocks-'));
    mkdirSync(join(tempDir, '.chimera', 'archive', 'blocks'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates a knowledge block', () => {
    const store = new KnowledgeBlockStore(tempDir);
    const block = store.create({
      title: 'Auth Decision',
      summary: 'JWT + refresh token',
      content: 'Full auth design...',
      tags: ['auth', 'security'],
      source_feature: 'feature-001',
      git_ref: 'abc123',
      expires_at: '2026-09-10',
    });
    expect(block.id).toMatch(/^kb-\d+$/);
    expect(block.status).toBe('active');
  });

  it('reads a block by id', () => {
    const store = new KnowledgeBlockStore(tempDir);
    const created = store.create({
      title: 'Test',
      summary: 'sum',
      content: 'full content here',
      tags: ['test'],
      source_feature: 'f-1',
      git_ref: 'def456',
      expires_at: null,
    });
    const read = store.read(created.id);
    expect(read).not.toBeNull();
    expect(read!.content).toBe('full content here');
  });

  it('updates block status', () => {
    const store = new KnowledgeBlockStore(tempDir);
    const block = store.create({ title: 'X', summary: 's', content: 'c', tags: [], source_feature: 'f', git_ref: 'g', expires_at: null });
    store.updateStatus(block.id, 'stale');
    const updated = store.read(block.id);
    expect(updated!.status).toBe('stale');
  });

  it('lists all blocks', () => {
    const store = new KnowledgeBlockStore(tempDir);
    store.create({ title: 'A', summary: 's', content: 'c', tags: ['a'], source_feature: 'f', git_ref: 'g', expires_at: null });
    store.create({ title: 'B', summary: 's', content: 'c', tags: ['b'], source_feature: 'f', git_ref: 'g', expires_at: null });
    const all = store.list();
    expect(all).toHaveLength(2);
  });
});
