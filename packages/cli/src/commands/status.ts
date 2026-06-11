import { ProjectStateManager } from '@chimera/core';

export interface StatusOptions {
  json?: boolean;
}

export function status(projectRoot: string, options: StatusOptions = {}): void {
  const manager = new ProjectStateManager(projectRoot);
  const state = manager.load();

  if (!state) {
    console.error("Error: Project not initialized. Run 'chimera init' first.");
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify(state, null, 2));
    return;
  }

  console.log(`Chimera v${state.version} (preset: ${state.config.preset})`);
  console.log(`Initialized: ${state.initialized_at}`);
  console.log('');

  if (state.features.length === 0) {
    console.log('No active features.');
    return;
  }

  console.log('Features:');
  for (const feature of state.features) {
    const taskInfo = feature.artifacts.tasks ? ' (has tasks)' : '';
    console.log(`  ${feature.id} [${feature.phase}] ${feature.name}${taskInfo}`);
  }
}
