import { describe, it, expect } from 'vitest';
import { TDDFSM } from '../../packages/core/src/tdd/tdd-fsm.js';
import { checkFileRestriction } from '../../packages/core/src/tdd/restrictions.js';

describe('E2E: TDD Red-Green-Refactor enforcement', () => {
  it('complete TDD cycle: red → green → refactor → done', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');

    // RED: write test, verify it fails
    fsm.setTestFile('tests/auth.test.ts');
    expect(checkFileRestriction('red', 'tests/auth.test.ts').allowed).toBe(true);
    expect(checkFileRestriction('red', 'src/auth.ts').allowed).toBe(false);

    const red = fsm.verifyRed(1); // exit code 1 = tests fail
    expect(red.success).toBe(true);
    expect(fsm.getState().cycle).toBe('green');

    // GREEN: write src, verify tests pass
    fsm.setSrcFile('src/auth.ts');
    expect(checkFileRestriction('green', 'src/auth.ts').allowed).toBe(true);
    expect(checkFileRestriction('green', 'tests/auth.test.ts').allowed).toBe(false);

    const green = fsm.verifyGreen(0); // exit code 0 = tests pass
    expect(green.success).toBe(true);
    expect(fsm.getState().cycle).toBe('refactor');

    // REFACTOR: any file allowed
    expect(checkFileRestriction('refactor', 'src/auth.ts').allowed).toBe(true);
    expect(checkFileRestriction('refactor', 'tests/auth.test.ts').allowed).toBe(true);

    // Mark done
    const done = fsm.markDone(0);
    expect(done.success).toBe(true);
    expect(fsm.getState().cycles_completed).toBe(1);
  });

  it('blocks invalid transitions', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');

    // Cannot go green if tests pass (they should fail in RED)
    const invalid = fsm.verifyRed(0);
    expect(invalid.success).toBe(false);
    expect(fsm.getState().cycle).toBe('red');
  });

  it('multiple cycles accumulate count', () => {
    const fsm = new TDDFSM('feature-1', 'task-1');

    // Cycle 1
    fsm.verifyRed(1);
    fsm.verifyGreen(0);
    fsm.completeRefactor(0);
    expect(fsm.getState().cycles_completed).toBe(1);

    // Cycle 2
    fsm.verifyRed(1);
    fsm.verifyGreen(0);
    fsm.completeRefactor(0);
    expect(fsm.getState().cycles_completed).toBe(2);
  });
});
