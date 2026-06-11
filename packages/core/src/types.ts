import type { TDDState } from './tdd/types.js';

export type { TDDState };

export type Phase =
  | 'idle'
  | 'spec'
  | 'plan'
  | 'tasks'
  | 'workspace'
  | 'implement'
  | 'review'
  | 'finish'
  | 'archive';

export interface ProjectState {
  version: string;
  initialized_at: string;
  features: FeatureState[];
  config: ConfigRef;
}

export interface ConfigRef {
  path: string;
  preset: string;
}

export interface FeatureState {
  id: string;
  name: string;
  phase: Phase;
  branch: string;
  created_at: string;
  updated_at: string;
  history: TransitionRecord[];
  tdd_state?: TDDState;
  artifacts: {
    spec?: string;
    plan?: string;
    tasks?: string;
  };
}

export interface TransitionRecord {
  from: Phase;
  to: Phase;
  timestamp: string;
  trigger: 'user' | 'auto' | 'guard_pass';
  reason: string;
  guard_results: GuardResult[];
}

export interface GuardResult {
  guard: string;
  passed: boolean;
  message?: string;
}
