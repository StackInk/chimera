import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FSM } from '../fsm.js';
import { createProjectGuards } from '../guards.js';
import type { StateMachineConfig } from '../types.js';

const fullConfig: StateMachineConfig = {
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
    { from: 'tasks', to: 'workspace', guard: 'tasks_file_exists' },
    { from: 'workspace', to: 'implement', guard: 'worktree_ready' },
    { from: 'implement', to: 'review', guard: 'all_tasks_done' },
    { from: 'review', to: 'finish', guard: 'review_approved' },
    { from: 'finish', to: 'archive', guard: 'merged_or_pr_created' },
    { from: 'plan', to: 'spec', guard: 'user_confirmed_rollback', requires_confirmation: true },
    { from: 'tasks', to: 'plan', guard: 'user_confirmed_rollback', requires_confirmation: true },
    { from: 'implement', to: 'tasks', guard: 'user_confirmed_rollback', requires_confirmation: true },
  ],
};

describe('Full lifecycle transitions', () => {
  let tempDir: string;
  let featureDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-lifecycle-'));
    featureDir = join(tempDir, '.chimera', 'features', 'test-feature');
    mkdirSync(featureDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('transitions idle → spec when feature description exists', () => {
    const guards = createProjectGuards(tempDir, 'test-feature');
    const fsm = new FSM(fullConfig, guards);

    writeFileSync(join(featureDir, 'description.md'), 'Build a login page');
    const result = fsm.transition('spec');
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('spec');
  });

  it('blocks idle → spec without feature description', () => {
    const guards = createProjectGuards(tempDir, 'test-feature');
    const fsm = new FSM(fullConfig, guards);

    const result = fsm.transition('spec');
    expect(result.success).toBe(false);
  });

  it('transitions spec → plan when spec.md exists', () => {
    const guards = createProjectGuards(tempDir, 'test-feature');
    const fsm = new FSM(fullConfig, guards);

    writeFileSync(join(featureDir, 'description.md'), 'desc');
    fsm.transition('spec');

    writeFileSync(join(featureDir, 'spec.md'), '# Spec\n## Requirements');
    const result = fsm.transition('plan');
    expect(result.success).toBe(true);
  });

  it('transitions plan → tasks when plan.md exists', () => {
    const guards = createProjectGuards(tempDir, 'test-feature');
    const fsm = new FSM(fullConfig, guards);

    writeFileSync(join(featureDir, 'description.md'), 'desc');
    fsm.transition('spec');
    writeFileSync(join(featureDir, 'spec.md'), '# Spec');
    fsm.transition('plan');
    writeFileSync(join(featureDir, 'plan.md'), '# Plan');
    const result = fsm.transition('tasks');
    expect(result.success).toBe(true);
  });

  it('transitions tasks → workspace when tasks.md exists', () => {
    const guards = createProjectGuards(tempDir, 'test-feature');
    const fsm = new FSM(fullConfig, guards);

    writeFileSync(join(featureDir, 'description.md'), 'desc');
    fsm.transition('spec');
    writeFileSync(join(featureDir, 'spec.md'), '# Spec');
    fsm.transition('plan');
    writeFileSync(join(featureDir, 'plan.md'), '# Plan');
    fsm.transition('tasks');
    writeFileSync(join(featureDir, 'tasks.md'), '# Tasks');
    const result = fsm.transition('workspace');
    expect(result.success).toBe(true);
  });

  it('completes full lifecycle idle → archive', () => {
    const guards = createProjectGuards(tempDir, 'test-feature');
    const fsm = new FSM(fullConfig, guards);

    writeFileSync(join(featureDir, 'description.md'), 'desc');
    expect(fsm.transition('spec').success).toBe(true);

    writeFileSync(join(featureDir, 'spec.md'), '# Spec');
    expect(fsm.transition('plan').success).toBe(true);

    writeFileSync(join(featureDir, 'plan.md'), '# Plan');
    expect(fsm.transition('tasks').success).toBe(true);

    writeFileSync(join(featureDir, 'tasks.md'), '# Tasks');
    expect(fsm.transition('workspace').success).toBe(true);

    writeFileSync(join(featureDir, '.worktree-ready'), '');
    expect(fsm.transition('implement').success).toBe(true);

    writeFileSync(join(featureDir, '.tasks-done'), '');
    expect(fsm.transition('review').success).toBe(true);

    writeFileSync(join(featureDir, '.review-approved'), '');
    expect(fsm.transition('finish').success).toBe(true);

    writeFileSync(join(featureDir, '.merged'), '');
    expect(fsm.transition('archive').success).toBe(true);

    expect(fsm.getCurrentState()).toBe('archive');
    expect(fsm.getHistory()).toHaveLength(8);
  });
});
