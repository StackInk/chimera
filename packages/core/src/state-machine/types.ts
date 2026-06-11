import type { Phase } from '../types.js';

export interface StateMachineConfig {
  states: Record<string, StateConfig>;
  transitions: TransitionConfig[];
}

export interface StateConfig {
  initial?: boolean;
  final?: boolean;
  skills?: string[];
  knowledge_scope?: string[];
}

export interface TransitionConfig {
  from: Phase;
  to: Phase;
  guard: string;
  action?: string;
  requires_confirmation?: boolean;
}
