import { runAllChecks, type DoctorCheckResult } from '@chimera/core';
import { chimeraDir } from '@chimera/core';
import { existsSync } from 'node:fs';

export function doctor(projectRoot: string): void {
  if (!existsSync(chimeraDir(projectRoot))) {
    console.error("Error: No .chimera/ directory. Run 'chimera init' first.");
    process.exit(1);
  }

  console.log('[Chimera Doctor] Running health check...\n');

  const results = runAllChecks(projectRoot);
  const failures = results.filter(r => r.status === 'fail');
  const warnings = results.filter(r => r.status === 'warn');
  const passes = results.filter(r => r.status === 'pass');

  for (const r of results) {
    const icon = r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✗';
    const line = `  ${icon} ${r.name}: ${r.message}`;
    console.log(line);
    if (r.fix && r.status !== 'pass') {
      console.log(`    Fix: ${r.fix}`);
    }
  }

  console.log('');
  console.log(`Result: ${passes.length} pass, ${warnings.length} warnings, ${failures.length} failures`);

  if (failures.length > 0) {
    console.log("\nRun 'chimera doctor --fix' to auto-repair.");
    process.exit(1);
  }
}
