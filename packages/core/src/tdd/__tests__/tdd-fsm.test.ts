import { describe, it, expect } from 'vitest';
import { TDDFSM } from '../tdd-fsm.js';

describe('TDDFSM', () => {
  it('starts in red cycle', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    expect(fsm.getState().cycle).toBe('red');
  });

  it('transitions red → green when tests fail', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    const result = fsm.verifyRed(1);
    expect(result.success).toBe(true);
    expect(fsm.getState().cycle).toBe('green');
  });

  it('blocks red → green when tests pass (should fail)', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    const result = fsm.verifyRed(0);
    expect(result.success).toBe(false);
    expect(result.message).toContain('should fail');
    expect(fsm.getState().cycle).toBe('red');
  });

  it('transitions green → refactor when tests pass', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    fsm.verifyRed(1);
    const result = fsm.verifyGreen(0);
    expect(result.success).toBe(true);
    expect(fsm.getState().cycle).toBe('refactor');
  });

  it('blocks green → refactor when tests fail', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    fsm.verifyRed(1);
    const result = fsm.verifyGreen(1);
    expect(result.success).toBe(false);
    expect(result.message).toContain('still failing');
    expect(fsm.getState().cycle).toBe('green');
  });

  it('transitions refactor → red (next cycle)', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    fsm.verifyRed(1);
    fsm.verifyGreen(0);
    const result = fsm.completeRefactor(0);
    expect(result.success).toBe(true);
    expect(fsm.getState().cycle).toBe('red');
    expect(fsm.getState().cycles_completed).toBe(1);
  });

  it('blocks refactor completion when tests fail', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    fsm.verifyRed(1);
    fsm.verifyGreen(0);
    const result = fsm.completeRefactor(1);
    expect(result.success).toBe(false);
    expect(result.message).toContain('broke');
    expect(fsm.getState().cycle).toBe('refactor');
  });

  it('marks task done from refactor phase', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    fsm.verifyRed(1);
    fsm.verifyGreen(0);
    const result = fsm.markDone(0);
    expect(result.success).toBe(true);
    expect(fsm.getState().cycles_completed).toBe(1);
  });

  it('blocks markDone when tests fail', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    fsm.verifyRed(1);
    fsm.verifyGreen(0);
    const result = fsm.markDone(1);
    expect(result.success).toBe(false);
  });

  it('tracks test and src files', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');
    fsm.setTestFile('tests/auth.test.ts');
    fsm.setSrcFile('src/auth.ts');
    const state = fsm.getState();
    expect(state.test_file).toBe('tests/auth.test.ts');
    expect(state.src_file).toBe('src/auth.ts');
  });
});
