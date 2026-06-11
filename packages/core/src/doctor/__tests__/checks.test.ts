import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runAllChecks } from '../checks.js';

describe('Doctor checks', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-doctor-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports all critical failures when .chimera/ is empty', () => {
    mkdirSync(join(tempDir, '.chimera'));
    const results = runAllChecks(tempDir);
    const failures = results.filter(r => r.status === 'fail');
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some(r => r.name === 'state.json')).toBe(true);
  });

  it('passes all critical checks for healthy project', () => {
    setupHealthyProject(tempDir);
    const results = runAllChecks(tempDir);
    const criticalFails = results.filter(r => r.status === 'fail' && r.severity === 'critical');
    expect(criticalFails).toHaveLength(0);
  });

  it('detects missing skills directory', () => {
    setupHealthyProject(tempDir);
    rmSync(join(tempDir, '.chimera', 'skills'), { recursive: true });
    const results = runAllChecks(tempDir);
    const skillCheck = results.find(r => r.name === 'skills/');
    expect(skillCheck?.status).toBe('fail');
  });

  it('detects referenced skill without SKILL.md', () => {
    setupHealthyProject(tempDir);
    // state-machine references 'specify' but remove its file
    rmSync(join(tempDir, '.chimera', 'skills', 'specify'), { recursive: true });
    const results = runAllChecks(tempDir);
    const missing = results.find(r => r.name === 'skill:specify');
    expect(missing?.status).toBe('fail');
  });

  it('detects unregistered hooks', () => {
    setupHealthyProject(tempDir);
    writeFileSync(join(tempDir, '.claude', 'settings.json'), '{}');
    const results = runAllChecks(tempDir);
    const hookReg = results.find(r => r.name === 'hooks registration');
    expect(hookReg?.status).toBe('fail');
  });

  it('detects missing feature directory', () => {
    setupHealthyProject(tempDir);
    // Add feature to state but no directory
    const state = JSON.parse(require('fs').readFileSync(join(tempDir, '.chimera', 'state.json'), 'utf-8'));
    state.features.push({ id: 'orphan', name: 'Orphan', phase: 'spec', branch: 'b', created_at: '', updated_at: '', history: [], artifacts: {} });
    writeFileSync(join(tempDir, '.chimera', 'state.json'), JSON.stringify(state));
    const results = runAllChecks(tempDir);
    const featureCheck = results.find(r => r.name === 'feature:orphan');
    expect(featureCheck?.status).toBe('fail');
  });

  it('detects TDD enabled but no tdd-state.json', () => {
    setupHealthyProject(tempDir);
    // Enable TDD in config
    const config = 'tdd:\n  enabled: true\n  coverage_threshold: 80\nconstitution:\n  enabled: false\nknowledge:\n  enabled: false\n';
    writeFileSync(join(tempDir, '.chimera', 'config.yaml'), config);
    const results = runAllChecks(tempDir);
    const tddCheck = results.find(r => r.name === 'tdd-state.json');
    expect(tddCheck?.status).toBe('fail');
  });
});

function setupHealthyProject(dir: string): void {
  const chimera = join(dir, '.chimera');
  mkdirSync(chimera, { recursive: true });
  mkdirSync(join(chimera, 'skills', 'specify'), { recursive: true });
  mkdirSync(join(chimera, 'skills', 'plan'), { recursive: true });
  mkdirSync(join(chimera, 'hooks'), { recursive: true });
  mkdirSync(join(dir, '.claude'), { recursive: true });

  writeFileSync(join(chimera, 'state.json'), JSON.stringify({ version: '0.1.0', initialized_at: '', features: [], config: { path: '', preset: 'minimal' } }));
  writeFileSync(join(chimera, 'state-machine.yaml'), 'states:\n  idle:\n    initial: true\n    skills:\n      - specify\n      - plan\ntransitions: []\n');
  writeFileSync(join(chimera, 'config.yaml'), 'tdd:\n  enabled: false\nconstitution:\n  enabled: false\nknowledge:\n  enabled: false\n');
  writeFileSync(join(chimera, 'skills', 'specify', 'SKILL.md'), '# Specify');
  writeFileSync(join(chimera, 'skills', 'plan', 'SKILL.md'), '# Plan');

  const hooks = ['session-start.sh', 'pre-tool-use.sh', 'post-tool-use.sh', 'pre-commit.sh'];
  for (const h of hooks) {
    writeFileSync(join(chimera, 'hooks', h), '#!/bin/bash\nexit 0');
    chmodSync(join(chimera, 'hooks', h), 0o755);
  }

  writeFileSync(join(dir, '.claude', 'settings.json'), JSON.stringify({
    hooks: {
      SessionStart: [{ command: '.chimera/hooks/session-start.sh' }],
      PreToolUse: [{ matcher: 'Write|Edit', command: '.chimera/hooks/pre-tool-use.sh' }],
      PreCommit: [{ command: '.chimera/hooks/pre-commit.sh' }],
    }
  }));
}
