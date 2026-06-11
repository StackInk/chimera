import type { TDDState, TDDCycle } from './types.js';

export interface TDDTransitionResult {
  success: boolean;
  message?: string;
}

export class TDDFSM {
  private state: TDDState;

  constructor(feature: string, task: string) {
    this.state = {
      feature,
      task,
      cycle: 'red',
      cycles_completed: 0,
    };
  }

  getState(): TDDState {
    return { ...this.state };
  }

  setTestFile(path: string): void {
    this.state.test_file = path;
  }

  setSrcFile(path: string): void {
    this.state.src_file = path;
  }

  verifyRed(testExitCode: number): TDDTransitionResult {
    if (this.state.cycle !== 'red') {
      return { success: false, message: 'Not in RED phase' };
    }
    if (testExitCode === 0) {
      return { success: false, message: 'Tests pass but should fail in RED phase. Check your assertions.' };
    }
    this.state.cycle = 'green';
    return { success: true, message: 'Tests fail as expected. Now write minimal code to make them pass.' };
  }

  verifyGreen(testExitCode: number): TDDTransitionResult {
    if (this.state.cycle !== 'green') {
      return { success: false, message: 'Not in GREEN phase' };
    }
    if (testExitCode !== 0) {
      return { success: false, message: 'Tests still failing. Continue writing code to make them pass.' };
    }
    this.state.cycle = 'refactor';
    return { success: true, message: 'Tests pass. Now refactor if needed, or mark task done.' };
  }

  completeRefactor(testExitCode: number): TDDTransitionResult {
    if (this.state.cycle !== 'refactor') {
      return { success: false, message: 'Not in REFACTOR phase' };
    }
    if (testExitCode !== 0) {
      return { success: false, message: 'Refactoring broke tests. Fix before continuing.' };
    }
    this.state.cycle = 'red';
    this.state.cycles_completed++;
    this.state.test_file = undefined;
    this.state.src_file = undefined;
    return { success: true, message: 'Refactor complete. Starting next RED cycle.' };
  }

  markDone(testExitCode: number): TDDTransitionResult {
    if (this.state.cycle !== 'refactor') {
      return { success: false, message: 'Can only mark done from REFACTOR phase' };
    }
    if (testExitCode !== 0) {
      return { success: false, message: 'Tests must pass before marking done' };
    }
    this.state.cycles_completed++;
    return { success: true, message: 'Task complete.' };
  }

  static fromState(state: TDDState): TDDFSM {
    const fsm = new TDDFSM(state.feature, state.task);
    fsm.state = { ...state };
    return fsm;
  }
}
