import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectHarness, HarnessType } from '../harness-detect.js';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('detectHarness', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-harness-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects Claude Code when .claude/ directory exists', () => {
    mkdirSync(join(tempDir, '.claude'));
    const result = detectHarness(tempDir);
    expect(result.type).toBe('claude-code');
    expect(result.supportsHooks).toBe(true);
  });

  it('detects Cursor when .cursor/ directory exists', () => {
    mkdirSync(join(tempDir, '.cursor'));
    const result = detectHarness(tempDir);
    expect(result.type).toBe('cursor');
    expect(result.supportsHooks).toBe(false);
  });

  it('returns unknown when no harness detected', () => {
    const result = detectHarness(tempDir);
    expect(result.type).toBe('unknown');
    expect(result.supportsHooks).toBe(false);
  });

  it('prefers Claude Code when multiple harness dirs exist', () => {
    mkdirSync(join(tempDir, '.claude'));
    mkdirSync(join(tempDir, '.cursor'));
    const result = detectHarness(tempDir);
    expect(result.type).toBe('claude-code');
    expect(result.supportsHooks).toBe(true);
  });

  it('detects Claude Code from CLAUDE.md presence', () => {
    writeFileSync(join(tempDir, 'CLAUDE.md'), '# project');
    const result = detectHarness(tempDir);
    expect(result.type).toBe('claude-code');
    expect(result.supportsHooks).toBe(true);
  });

  it('skill-only mode for non-hooks harness', () => {
    mkdirSync(join(tempDir, '.cursor'));
    const result = detectHarness(tempDir);
    expect(result.mode).toBe('skill-only');
  });

  it('full mode for hooks-capable harness', () => {
    mkdirSync(join(tempDir, '.claude'));
    const result = detectHarness(tempDir);
    expect(result.mode).toBe('full');
  });
});
