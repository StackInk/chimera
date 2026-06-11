import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { GuardFn, GuardRegistry } from './fsm.js';

export function createProjectGuards(projectRoot: string, featureId: string): GuardRegistry {
  const featureDir = join(projectRoot, '.chimera', 'features', featureId);

  return {
    has_feature_description: fileGuard(join(featureDir, 'description.md'), 'Feature description not found'),
    spec_file_exists: fileGuard(join(featureDir, 'spec.md'), 'spec.md not found'),
    plan_file_exists: fileGuard(join(featureDir, 'plan.md'), 'plan.md not found'),
    tasks_file_exists: fileGuard(join(featureDir, 'tasks.md'), 'tasks.md not found'),
    worktree_ready: fileGuard(join(featureDir, '.worktree-ready'), 'Worktree not ready'),
    all_tasks_done: fileGuard(join(featureDir, '.tasks-done'), 'Not all tasks completed'),
    review_approved: fileGuard(join(featureDir, '.review-approved'), 'Review not approved'),
    merged_or_pr_created: fileGuard(join(featureDir, '.merged'), 'Not merged or PR not created'),
    user_confirmed_rollback: alwaysPass(),
    always_pass: alwaysPass(),
    always_fail: alwaysFail('Guard explicitly failed'),
  };
}

function fileGuard(filePath: string, failMessage: string): GuardFn {
  return () => {
    if (existsSync(filePath)) {
      return { passed: true };
    }
    return { passed: false, message: failMessage };
  };
}

function alwaysPass(): GuardFn {
  return () => ({ passed: true });
}

function alwaysFail(message: string): GuardFn {
  return () => ({ passed: false, message });
}
