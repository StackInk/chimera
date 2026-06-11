import type { ProjectState, FeatureState, Phase } from '../types.js';
import { readJson, writeJson, ensureDir } from '../utils/fs.js';
import { statePath, chimeraDir } from '../utils/paths.js';
import { join } from 'node:path';

export class ProjectStateManager {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  load(): ProjectState | null {
    return readJson<ProjectState>(statePath(this.projectRoot));
  }

  save(state: ProjectState): void {
    writeJson(statePath(this.projectRoot), state);
  }

  create(preset: string): ProjectState {
    const state: ProjectState = {
      version: '0.1.0',
      initialized_at: new Date().toISOString(),
      features: [],
      config: {
        path: '.chimera/config.yaml',
        preset,
      },
    };
    this.save(state);
    return state;
  }

  addFeature(id: string, name: string, branch?: string): FeatureState {
    const state = this.load();
    if (!state) throw new Error('Project not initialized');

    const feature: FeatureState = {
      id,
      name,
      phase: 'idle' as Phase,
      branch: branch || `feature/${id}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      history: [],
      artifacts: {},
    };

    state.features.push(feature);
    this.save(state);

    ensureDir(join(chimeraDir(this.projectRoot), 'features', id));

    return feature;
  }

  getFeature(id: string): FeatureState | null {
    const state = this.load();
    if (!state) return null;
    return state.features.find(f => f.id === id) || null;
  }

  updateFeature(id: string, updates: Partial<FeatureState>): void {
    const state = this.load();
    if (!state) throw new Error('Project not initialized');

    const index = state.features.findIndex(f => f.id === id);
    if (index === -1) throw new Error(`Feature '${id}' not found`);

    state.features[index] = {
      ...state.features[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save(state);
  }
}
