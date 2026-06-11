import type { Phase } from '@chimera/core';
import { ProjectStateManager } from '@chimera/core';

export interface TransitionOptions {
  feature?: string;
  force?: boolean;
}

export function transition(
  projectRoot: string,
  targetPhase: string,
  options: TransitionOptions = {}
): void {
  const manager = new ProjectStateManager(projectRoot);
  const state = manager.load();

  if (!state) {
    console.error("Error: Project not initialized. Run 'chimera init' first.");
    process.exit(1);
  }

  if (state.features.length === 0) {
    console.error('Error: No features exist. Create a feature first.');
    process.exit(1);
  }

  const featureId = options.feature || state.features[state.features.length - 1].id;
  const feature = manager.getFeature(featureId);

  if (!feature) {
    console.error(`Error: Feature '${featureId}' not found.`);
    process.exit(1);
  }

  const from = feature.phase;
  const to = targetPhase as Phase;

  manager.updateFeature(featureId, {
    phase: to,
    history: [
      ...feature.history,
      {
        from,
        to,
        timestamp: new Date().toISOString(),
        trigger: 'user',
        reason: `Manual transition to ${to}`,
        guard_results: [{ guard: 'manual', passed: true }],
      },
    ],
  });

  console.log(`${featureId}: ${from} → ${to}`);
}
