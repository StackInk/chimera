import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ProjectStateManager } from '../../packages/core/src/project/state.js';
import { readJson } from '../../packages/core/src/utils/fs.js';
import type { ProjectState } from '../../packages/core/src/types.js';

describe('E2E: Init → Status → Transition flow', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-e2e-init-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('full init creates expected structure', () => {
    const manager = new ProjectStateManager(tempDir);
    manager.create('minimal');

    expect(existsSync(join(tempDir, '.chimera', 'state.json'))).toBe(true);
    const state = readJson<ProjectState>(join(tempDir, '.chimera', 'state.json'));
    expect(state?.version).toBe('0.1.0');
    expect(state?.config.preset).toBe('minimal');
  });

  it('add feature and transition through phases', () => {
    const manager = new ProjectStateManager(tempDir);
    manager.create('minimal');

    const feature = manager.addFeature('auth', 'User Authentication');
    expect(feature.phase).toBe('idle');

    manager.updateFeature('auth', { phase: 'spec' });
    const updated = manager.getFeature('auth');
    expect(updated?.phase).toBe('spec');

    manager.updateFeature('auth', { phase: 'plan' });
    expect(manager.getFeature('auth')?.phase).toBe('plan');
  });

  it('status shows features after creation', () => {
    const manager = new ProjectStateManager(tempDir);
    manager.create('web-app');
    manager.addFeature('login', 'Login Page');
    manager.addFeature('dashboard', 'Dashboard');

    const state = manager.load()!;
    expect(state.features).toHaveLength(2);
    expect(state.features[0].name).toBe('Login Page');
    expect(state.features[1].name).toBe('Dashboard');
  });
});
