import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type HarnessType = 'claude-code' | 'cursor' | 'copilot' | 'windsurf' | 'unknown';
export type HarnessMode = 'full' | 'skill-only';

export interface HarnessInfo {
  type: HarnessType;
  supportsHooks: boolean;
  mode: HarnessMode;
}

export function detectHarness(projectRoot: string): HarnessInfo {
  if (existsSync(join(projectRoot, '.claude')) || existsSync(join(projectRoot, 'CLAUDE.md'))) {
    return { type: 'claude-code', supportsHooks: true, mode: 'full' };
  }

  if (existsSync(join(projectRoot, '.cursor'))) {
    return { type: 'cursor', supportsHooks: false, mode: 'skill-only' };
  }

  if (existsSync(join(projectRoot, '.github', 'copilot'))) {
    return { type: 'copilot', supportsHooks: false, mode: 'skill-only' };
  }

  if (existsSync(join(projectRoot, '.windsurf'))) {
    return { type: 'windsurf', supportsHooks: false, mode: 'skill-only' };
  }

  return { type: 'unknown', supportsHooks: false, mode: 'skill-only' };
}
