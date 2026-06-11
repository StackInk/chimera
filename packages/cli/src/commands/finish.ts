import { ProjectStateManager } from '@chimera/core';

export type FinishAction = 'merge' | 'pr' | 'keep' | 'discard';

export interface FinishOptions {
  feature?: string;
  action?: FinishAction;
}

export function finish(projectRoot: string, options: FinishOptions = {}): void {
  const manager = new ProjectStateManager(projectRoot);
  const state = manager.load();

  if (!state) {
    console.error("Error: Project not initialized.");
    process.exit(1);
  }

  const featureId = options.feature || state.features[state.features.length - 1]?.id;
  if (!featureId) {
    console.error('Error: No features found.');
    process.exit(1);
  }

  const feature = manager.getFeature(featureId);
  if (!feature) {
    console.error(`Error: Feature '${featureId}' not found.`);
    process.exit(1);
  }

  if (feature.phase !== 'finish') {
    console.error(`Error: Feature '${featureId}' is in '${feature.phase}' phase, not 'finish'.`);
    process.exit(1);
  }

  const action = options.action;
  if (!action) {
    console.log(`Feature: ${featureId} (${feature.name})`);
    console.log('');
    console.log('Available actions:');
    console.log('  --action merge    Merge branch locally');
    console.log('  --action pr       Create a pull request');
    console.log('  --action keep     Keep branch as-is');
    console.log('  --action discard  Discard branch and changes');
    return;
  }

  switch (action) {
    case 'merge':
      console.log(`[${featureId}] Merging branch '${feature.branch}' into main...`);
      break;
    case 'pr':
      console.log(`[${featureId}] Creating pull request for '${feature.branch}'...`);
      break;
    case 'keep':
      console.log(`[${featureId}] Keeping branch '${feature.branch}' as-is.`);
      break;
    case 'discard':
      console.log(`[${featureId}] Discarding branch '${feature.branch}'.`);
      break;
  }

  manager.updateFeature(featureId, { phase: 'archive' });
  console.log(`[${featureId}] → archive (action: ${action})`);
}
