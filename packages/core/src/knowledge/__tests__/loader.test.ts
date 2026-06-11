import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { KnowledgeLoader } from '../loader.js';

describe('KnowledgeLoader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-knowledge-'));
    mkdirSync(join(tempDir, '.chimera', 'knowledge'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads business.md in spec phase', () => {
    writeFileSync(join(tempDir, '.chimera', 'knowledge', 'business.md'), '# Business\nUser auth flow');
    const loader = new KnowledgeLoader(tempDir);
    const result = loader.loadForPhase('spec');
    expect(result).toContain('User auth flow');
  });

  it('loads business.md in plan phase', () => {
    writeFileSync(join(tempDir, '.chimera', 'knowledge', 'business.md'), '# Biz');
    const loader = new KnowledgeLoader(tempDir);
    const result = loader.loadForPhase('plan');
    expect(result).toContain('Biz');
  });

  it('loads conventions.md in implement phase', () => {
    writeFileSync(join(tempDir, '.chimera', 'knowledge', 'conventions.md'), '# Code Rules');
    const loader = new KnowledgeLoader(tempDir);
    const result = loader.loadForPhase('implement');
    expect(result).toContain('Code Rules');
  });

  it('returns empty for phases with no knowledge', () => {
    const loader = new KnowledgeLoader(tempDir);
    const result = loader.loadForPhase('workspace');
    expect(result).toBe('');
  });

  it('returns empty when knowledge files do not exist', () => {
    rmSync(join(tempDir, '.chimera', 'knowledge'), { recursive: true });
    const loader = new KnowledgeLoader(tempDir);
    const result = loader.loadForPhase('spec');
    expect(result).toBe('');
  });
});
