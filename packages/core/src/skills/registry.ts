import type { Phase } from '../types.js';
import type { StateMachineConfig } from '../state-machine/types.js';

export class SkillRegistry {
  private phaseSkills: Map<string, string[]>;

  constructor(config: StateMachineConfig) {
    this.phaseSkills = new Map();
    for (const [state, stateConfig] of Object.entries(config.states)) {
      this.phaseSkills.set(state, stateConfig.skills || []);
    }
  }

  getSkillsForPhase(phase: Phase | string): string[] {
    return this.phaseSkills.get(phase) || [];
  }

  isSkillActive(skill: string, phase: Phase | string): boolean {
    const skills = this.getSkillsForPhase(phase);
    return skills.includes(skill);
  }

  getAllSkills(): string[] {
    const all = new Set<string>();
    for (const skills of this.phaseSkills.values()) {
      for (const s of skills) all.add(s);
    }
    return [...all];
  }
}
