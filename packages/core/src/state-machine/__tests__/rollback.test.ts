import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FSM } from '../fsm.js';
import { createProjectGuards } from '../guards.js';
import type { StateMachineConfig } from '../types.js';

const config: StateMachineConfig = {
  states: {
    idle: { initial: true },
    spec: {},
    plan: {},
    tasks: {},
    workspace: {},
    implement: {},
    review: {},
    finish: {},
    archive: { final: true },
  },
  transitions: [
    { from: 'idle', to: 'spec', guard: 'has_feature_description' },
    { from: 'spec', to: 'plan', guard: 'spec_file_exists' },
    { from: 'plan', to: 'tasks', guard: 'plan_file_exists' },
    { from: 'plan', to: 'spec', guard: 'user_confirmed_rollback', requires_confirmation: true },
    { from: 'tasks', to: 'plan', guard: 'user_confirmed_rollback', requires_confirmation: true },
    { from: 'implement', to: 'tasks', guard: 'user_confirmed_rollback', requires_confirmation: true },
  ],
};

describe('Rollback transitions', () => {
  let tempDir: string;
  let featureDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-rollback-'));
    featureDir = join(tempDir, '.chimera', 'features', 'test-feature');
    mkdirSync(featureDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('blocks rollback plan → spec without confirmation', () => {
    const guards = createProjectGuards(tempDir, 'test-feature');
    const fsm = new FSM(config, guards);

    writeFileSync(join(featureDir, 'description.md'), 'desc');
    fsm.transition('spec');
    writeFileSync(join(featureDir, 'spec.md'), '# Spec');
    fsm.transition('plan');

    const result = fsm.transition('spec');
    expect(result.success).toBe(false);
    expect(result.error).toContain('confirmation');
  });

  it('allows rollback plan → spec with confirmation', () => {
    const guards = createProjectGuards(tempDir, 'test-feature');
    const fsm = new FSM(config, guards);

    writeFileSync(join(featureDir, 'description.md'), 'desc');
    fsm.transition('spec');
    writeFileSync(join(featureDir, 'spec.md'), '# Spec');
    fsm.transition('plan');

    const result = fsm.transition('spec', { confirmed: true });
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('spec');
  });

  it('records rollback in history', () => {
    const guards = createProjectGuards(tempDir, 'test-feature');
    const fsm = new FSM(config, guards);

    writeFileSync(join(featureDir, 'description.md'), 'desc');
    fsm.transition('spec');
    writeFileSync(join(featureDir, 'spec.md'), '# Spec');
    fsm.transition('plan');
    fsm.transition('spec', { confirmed: true });

    const history = fsm.getHistory();
    expect(history).toHaveLength(3);
    expect(history[2].from).toBe('plan');
    expect(history[2].to).toBe('spec');
  });
});
