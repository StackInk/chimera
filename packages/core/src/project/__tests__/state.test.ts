import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ProjectStateManager } from '../state.js';

describe('ProjectStateManager', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates initial project state', () => {
    const manager = new ProjectStateManager(tempDir);
    const state = manager.create('minimal');
    expect(state.version).toBe('0.1.0');
    expect(state.features).toEqual([]);
    expect(state.config.preset).toBe('minimal');
  });

  it('saves and loads state', () => {
    const manager = new ProjectStateManager(tempDir);
    manager.create('minimal');
    const loaded = manager.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe('0.1.0');
  });

  it('returns null when no state file', () => {
    const manager = new ProjectStateManager(tempDir);
    const loaded = manager.load();
    expect(loaded).toBeNull();
  });

  it('adds a feature', () => {
    const manager = new ProjectStateManager(tempDir);
    manager.create('minimal');
    const feature = manager.addFeature('test-feature', 'Test Feature');
    expect(feature.id).toBe('test-feature');
    expect(feature.phase).toBe('idle');
    const state = manager.load()!;
    expect(state.features).toHaveLength(1);
  });

  it('gets feature by id', () => {
    const manager = new ProjectStateManager(tempDir);
    manager.create('minimal');
    manager.addFeature('feat-1', 'Feature One');
    const feature = manager.getFeature('feat-1');
    expect(feature).not.toBeNull();
    expect(feature!.name).toBe('Feature One');
  });
});
