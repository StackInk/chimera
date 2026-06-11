import { describe, it, expect } from 'vitest';
import { FSM } from '../fsm.js';
import type { StateMachineConfig } from '../types.js';

const testConfig: StateMachineConfig = {
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
    { from: 'idle', to: 'spec', guard: 'always_pass' },
    { from: 'spec', to: 'plan', guard: 'always_pass' },
    { from: 'plan', to: 'tasks', guard: 'always_pass' },
    { from: 'tasks', to: 'workspace', guard: 'always_pass' },
    { from: 'workspace', to: 'implement', guard: 'always_pass' },
    { from: 'implement', to: 'review', guard: 'always_pass' },
    { from: 'review', to: 'finish', guard: 'always_pass' },
    { from: 'finish', to: 'archive', guard: 'always_pass' },
    { from: 'plan', to: 'spec', guard: 'always_pass', requires_confirmation: true },
  ],
};

const guards = {
  always_pass: () => ({ passed: true }),
  always_fail: () => ({ passed: false, message: 'Guard failed' }),
};

describe('FSM', () => {
  it('creates with initial state', () => {
    const fsm = new FSM(testConfig, guards);
    expect(fsm.getCurrentState()).toBe('idle');
  });

  it('transitions to valid next state', () => {
    const fsm = new FSM(testConfig, guards);
    const result = fsm.transition('spec');
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('spec');
  });

  it('rejects invalid transition', () => {
    const fsm = new FSM(testConfig, guards);
    const result = fsm.transition('implement');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No valid transition');
    expect(fsm.getCurrentState()).toBe('idle');
  });

  it('rejects transition when guard fails', () => {
    const failConfig: StateMachineConfig = {
      ...testConfig,
      transitions: [
        { from: 'idle', to: 'spec', guard: 'always_fail' },
      ],
    };
    const fsm = new FSM(failConfig, { ...guards });
    const result = fsm.transition('spec');
    expect(result.success).toBe(false);
    expect(result.guard_results[0].passed).toBe(false);
  });

  it('canTransition returns true for valid path', () => {
    const fsm = new FSM(testConfig, guards);
    expect(fsm.canTransition('spec')).toBe(true);
  });

  it('canTransition returns false for invalid path', () => {
    const fsm = new FSM(testConfig, guards);
    expect(fsm.canTransition('archive')).toBe(false);
  });

  it('records transition history', () => {
    const fsm = new FSM(testConfig, guards);
    fsm.transition('spec');
    fsm.transition('plan');
    const history = fsm.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].from).toBe('idle');
    expect(history[0].to).toBe('spec');
    expect(history[1].from).toBe('spec');
    expect(history[1].to).toBe('plan');
  });

  it('supports rollback with confirmation flag', () => {
    const fsm = new FSM(testConfig, guards);
    fsm.transition('spec');
    fsm.transition('plan');
    const result = fsm.transition('spec', { confirmed: true });
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('spec');
  });

  it('blocks rollback without confirmation', () => {
    const fsm = new FSM(testConfig, guards);
    fsm.transition('spec');
    fsm.transition('plan');
    const result = fsm.transition('spec');
    expect(result.success).toBe(false);
    expect(result.error).toContain('confirmation');
  });
});
