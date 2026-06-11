import { cpSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ProjectStateManager } from '@chimera/core';
import {
  chimeraDir,
  knowledgeDir,
  hooksDir,
  cacheDir,
  archiveBlocksDir,
  claudeSettingsPath,
} from '@chimera/core';
import { ensureDir, writeJson, readJson, writeText } from '@chimera/core';

const TEMPLATES_DIR = resolve(import.meta.dirname, '../../..', 'templates');
const HOOKS_DIR = resolve(import.meta.dirname, '../../..', 'hooks');
const SKILLS_DIR = resolve(import.meta.dirname, '../../..', 'skills');

export interface InitOptions {
  preset?: string;
  force?: boolean;
  skipHooks?: boolean;
}

export function init(projectRoot: string, options: InitOptions = {}): void {
  const preset = options.preset || 'minimal';
  const chimera = chimeraDir(projectRoot);

  if (existsSync(chimera) && !options.force) {
    console.error('Error: .chimera/ already exists. Use --force to overwrite.');
    process.exit(1);
  }

  ensureDir(chimera);
  ensureDir(knowledgeDir(projectRoot));
  ensureDir(hooksDir(projectRoot));
  ensureDir(cacheDir(projectRoot));
  ensureDir(archiveBlocksDir(projectRoot));

  const stateManager = new ProjectStateManager(projectRoot);
  stateManager.create(preset);

  copyTemplate('state-machine.yaml', join(chimera, 'state-machine.yaml'));
  copyTemplate('config.yaml', join(chimera, 'config.yaml'));

  if (preset !== 'minimal') {
    copyTemplate('constitution.md', join(chimera, 'constitution.md'));
    copyTemplate('knowledge/business.md', join(chimera, 'knowledge', 'business.md'));
    copyTemplate('knowledge/conventions.md', join(chimera, 'knowledge', 'conventions.md'));

    const presetDir = join(TEMPLATES_DIR, 'presets', preset);
    if (existsSync(presetDir)) {
      cpSync(presetDir, chimera, { recursive: true, force: true });
    }
  }

  // Copy hook scripts and skills to .chimera/
  copyHooks(projectRoot);
  copySkills(projectRoot);

  if (!options.skipHooks) {
    registerHooks(projectRoot);
  }

  console.log(`Chimera initialized at .chimera/ (preset: ${preset})`);
  if (!options.skipHooks) {
    console.log('Hooks registered in .claude/settings.json');
  }
  console.log("Run 'chimera status' to see project state.");
}

function copyTemplate(templateName: string, destPath: string): void {
  const srcPath = join(TEMPLATES_DIR, templateName);
  if (existsSync(srcPath)) {
    ensureDir(join(destPath, '..'));
    cpSync(srcPath, destPath);
  }
}

function copyHooks(projectRoot: string): void {
  const destHooks = hooksDir(projectRoot);
  if (existsSync(HOOKS_DIR)) {
    cpSync(HOOKS_DIR, destHooks, { recursive: true, force: true });
  }
}

function copySkills(projectRoot: string): void {
  const destSkills = join(chimeraDir(projectRoot), 'skills');
  ensureDir(destSkills);
  if (existsSync(SKILLS_DIR)) {
    cpSync(SKILLS_DIR, destSkills, { recursive: true, force: true });
  }
}

function registerHooks(projectRoot: string): void {
  const settingsPath = claudeSettingsPath(projectRoot);
  ensureDir(join(projectRoot, '.claude'));

  const existing = readJson<Record<string, unknown>>(settingsPath) || {};
  const hooks = {
    PreToolUse: [
      { matcher: 'Write|Edit', command: '.chimera/hooks/pre-tool-use.sh "$TOOL_NAME" "$FILE_PATH"' },
    ],
    PostToolUse: [
      { matcher: 'Write|Edit', command: '.chimera/hooks/post-tool-use.sh "$TOOL_NAME" "$FILE_PATH"' },
    ],
    SessionStart: [
      { command: '.chimera/hooks/session-start.sh' },
    ],
  };

  writeJson(settingsPath, { ...existing, hooks });
}
