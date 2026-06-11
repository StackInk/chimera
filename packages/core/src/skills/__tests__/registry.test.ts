import { describe, it, expect } from 'vitest';
import { SkillRegistry } from '../registry.js';
import type { StateMachineConfig } from '../../state-machine/types.js';

const config: StateMachineConfig = {
  states: {
    idle: { initial: true, skills: [] },
    spec: { skills: ['specify', 'clarify'] },
    plan: { skills: ['plan'] },
    tasks: { skills: ['tasks'] },
    workspace: { skills: [] },
    implement: { skills: ['implement', 'dispatch'] },
    review: { skills: ['review'] },
    finish: { skills: ['finish'] },
    archive: { final: true, skills: [] },
  },
  transitions: [],
};

describe('SkillRegistry', () => {
  it('returns skills for spec phase', () => {
    const registry = new SkillRegistry(config);
    expect(registry.getSkillsForPhase('spec')).toEqual(['specify', 'clarify']);
  });

  it('returns skills for implement phase', () => {
    const registry = new SkillRegistry(config);
    expect(registry.getSkillsForPhase('implement')).toEqual(['implement', 'dispatch']);
  });

  it('returns empty array for phases with no skills', () => {
    const registry = new SkillRegistry(config);
    expect(registry.getSkillsForPhase('workspace')).toEqual([]);
    expect(registry.getSkillsForPhase('idle')).toEqual([]);
  });

  it('returns empty array for unknown phase', () => {
    const registry = new SkillRegistry(config);
    expect(registry.getSkillsForPhase('nonexistent' as any)).toEqual([]);
  });

  it('checks if skill is active in current phase', () => {
    const registry = new SkillRegistry(config);
    expect(registry.isSkillActive('specify', 'spec')).toBe(true);
    expect(registry.isSkillActive('specify', 'plan')).toBe(false);
    expect(registry.isSkillActive('dispatch', 'implement')).toBe(true);
  });

  it('lists all available skills across all phases', () => {
    const registry = new SkillRegistry(config);
    const all = registry.getAllSkills();
    expect(all).toContain('specify');
    expect(all).toContain('implement');
    expect(all).toContain('dispatch');
    expect(all.length).toBe(8);
  });
});
