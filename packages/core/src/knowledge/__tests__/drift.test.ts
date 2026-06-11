import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { checkDrift } from '../drift.js';

describe('checkDrift', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'chimera-drift-'));
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'ignore' });

    mkdirSync(join(tempDir, 'src'), { recursive: true });
    writeFileSync(join(tempDir, 'src', 'auth.ts'), 'export function login() {\n  return true;\n}\n'.repeat(10));
    execSync('git add -A && git commit -m "initial"', { cwd: tempDir, stdio: 'ignore' });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports no drift when file unchanged', () => {
    const headRef = execSync('git rev-parse HEAD', { cwd: tempDir }).toString().trim();
    const result = checkDrift(tempDir, headRef, 'src/auth.ts');
    expect(result.drifted).toBe(false);
  });

  it('reports drift when file significantly changed', () => {
    const oldRef = execSync('git rev-parse HEAD', { cwd: tempDir }).toString().trim();

    // Rewrite the file completely
    writeFileSync(join(tempDir, 'src', 'auth.ts'), 'export function newAuth() {\n  // totally different\n}\n'.repeat(20));
    execSync('git add -A && git commit -m "big change"', { cwd: tempDir, stdio: 'ignore' });

    const result = checkDrift(tempDir, oldRef, 'src/auth.ts');
    expect(result.drifted).toBe(true);
    expect(result.changePercent).toBeGreaterThan(50);
  });

  it('reports no drift for small change', () => {
    const oldRef = execSync('git rev-parse HEAD', { cwd: tempDir }).toString().trim();

    // Small change: add one line
    const content = 'export function login() {\n  return true;\n}\n'.repeat(10) + '// minor fix\n';
    writeFileSync(join(tempDir, 'src', 'auth.ts'), content);
    execSync('git add -A && git commit -m "tiny change"', { cwd: tempDir, stdio: 'ignore' });

    const result = checkDrift(tempDir, oldRef, 'src/auth.ts');
    expect(result.drifted).toBe(false);
  });

  it('handles missing file gracefully', () => {
    const ref = execSync('git rev-parse HEAD', { cwd: tempDir }).toString().trim();
    const result = checkDrift(tempDir, ref, 'src/nonexistent.ts');
    expect(result.drifted).toBe(false);
  });

  it('handles invalid git ref gracefully', () => {
    const result = checkDrift(tempDir, 'invalid-ref', 'src/auth.ts');
    expect(result.drifted).toBe(false);
    expect(result.changePercent).toBe(0);
  });
});
