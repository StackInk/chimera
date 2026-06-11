import { join } from 'node:path';

const CHIMERA_DIR = '.chimera';

export function chimeraDir(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR);
}

export function statePath(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'state.json');
}

export function stateMachinePath(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'state-machine.yaml');
}

export function configPath(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'config.yaml');
}

export function constitutionPath(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'constitution.md');
}

export function knowledgeDir(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'knowledge');
}

export function businessKnowledgePath(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'knowledge', 'business.md');
}

export function conventionsKnowledgePath(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'knowledge', 'conventions.md');
}

export function hooksDir(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'hooks');
}

export function cacheDir(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'cache');
}

export function archiveDir(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'archive');
}

export function archiveBlocksDir(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'archive', 'blocks');
}

export function archiveIndexPath(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'archive', 'index.yaml');
}

export function tddStatePath(projectRoot: string): string {
  return join(projectRoot, CHIMERA_DIR, 'tdd-state.json');
}

export function claudeSettingsPath(projectRoot: string): string {
  return join(projectRoot, '.claude', 'settings.json');
}
