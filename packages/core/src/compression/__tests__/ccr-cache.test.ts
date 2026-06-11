import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CCRCache } from '../ccr-cache.js';

describe('CCRCache', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-ccr-'));
    mkdirSync(join(tempDir, '.chimera', 'cache'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('stores content and returns cache id', () => {
    const cache = new CCRCache(tempDir);
    const id = cache.store('kb-001', 'Full original content here');
    expect(id).toBe('kb-001');
  });

  it('retrieves stored content by id', () => {
    const cache = new CCRCache(tempDir);
    cache.store('kb-002', 'Original text');
    const content = cache.retrieve('kb-002');
    expect(content).toBe('Original text');
  });

  it('returns null for non-existent id', () => {
    const cache = new CCRCache(tempDir);
    expect(cache.retrieve('kb-999')).toBeNull();
  });

  it('overwrites existing cache entry', () => {
    const cache = new CCRCache(tempDir);
    cache.store('kb-003', 'First version');
    cache.store('kb-003', 'Updated version');
    expect(cache.retrieve('kb-003')).toBe('Updated version');
  });
});
