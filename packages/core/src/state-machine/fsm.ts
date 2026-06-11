import type { Phase, TransitionRecord, GuardResult } from '../types.js';
import type { StateMachineConfig, TransitionConfig } from './types.js';

export type GuardFn = () => { passed: boolean; message?: string };
export type GuardRegistry = Record<string, GuardFn>;

export interface TransitionResult {
  success: boolean;
  error?: string;
  guard_results: GuardResult[];
  record?: TransitionRecord;
}

export interface TransitionOptions {
  confirmed?: boolean;
  trigger?: 'user' | 'auto' | 'guard_pass';
  reason?: string;
}

export class FSM {
  private state: Phase;
  private config: StateMachineConfig;
  private guards: GuardRegistry;
  private history: TransitionRecord[] = [];

  constructor(config: StateMachineConfig, guards: GuardRegistry) {
    this.config = config;
    this.guards = guards;
    this.state = this.findInitialState();
  }

  getCurrentState(): Phase {
    return this.state;
  }

  getHistory(): TransitionRecord[] {
    return [...this.history];
  }

  canTransition(target: Phase): boolean {
    const transition = this.findTransition(target);
    if (!transition) return false;
    const guardFn = this.guards[transition.guard];
    if (!guardFn) return false;
    return guardFn().passed;
  }

  transition(target: Phase, options: TransitionOptions = {}): TransitionResult {
    const transitionConfig = this.findTransition(target);

    if (!transitionConfig) {
      return {
        success: false,
        error: `No valid transition from '${this.state}' to '${target}'`,
        guard_results: [],
      };
    }

    if (transitionConfig.requires_confirmation && !options.confirmed) {
      return {
        success: false,
        error: `Transition from '${this.state}' to '${target}' requires confirmation`,
        guard_results: [],
      };
    }

    const guardFn = this.guards[transitionConfig.guard];
    if (!guardFn) {
      return {
        success: false,
        error: `Guard '${transitionConfig.guard}' not found`,
        guard_results: [],
      };
    }

    const guardResult = guardFn();
    const guardResults: GuardResult[] = [{
      guard: transitionConfig.guard,
      passed: guardResult.passed,
      message: guardResult.message,
    }];

    if (!guardResult.passed) {
      return {
        success: false,
        error: guardResult.message || `Guard '${transitionConfig.guard}' failed`,
        guard_results: guardResults,
      };
    }

    const record: TransitionRecord = {
      from: this.state,
      to: target,
      timestamp: new Date().toISOString(),
      trigger: options.trigger || 'user',
      reason: options.reason || `Transition to ${target}`,
      guard_results: guardResults,
    };

    this.state = target;
    this.history.push(record);

    return { success: true, guard_results: guardResults, record };
  }

  setState(phase: Phase): void {
    this.state = phase;
  }

  setHistory(history: TransitionRecord[]): void {
    this.history = [...history];
  }

  private findTransition(target: Phase): TransitionConfig | undefined {
    return this.config.transitions.find(
      t => t.from === this.state && t.to === target
    );
  }

  private findInitialState(): Phase {
    const entry = Object.entries(this.config.states).find(
      ([, config]) => config.initial
    );
    return (entry?.[0] as Phase) || 'idle';
  }
}
