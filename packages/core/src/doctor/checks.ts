import { existsSync, readdirSync, accessSync, constants } from 'node:fs';
import { join } from 'node:path';
import { readJson, readText } from '../utils/fs.js';
import {
  chimeraDir, statePath, stateMachinePath, configPath,
  constitutionPath, knowledgeDir, hooksDir, tddStatePath,
  claudeSettingsPath,
} from '../utils/paths.js';
import type { ProjectState } from '../types.js';

export type CheckSeverity = 'critical' | 'high' | 'medium';
export type CheckStatus = 'pass' | 'fail' | 'warn';

export interface DoctorCheckResult {
  name: string;
  status: CheckStatus;
  severity: CheckSeverity;
  message: string;
  fix?: string;
}

export function runAllChecks(projectRoot: string): DoctorCheckResult[] {
  const results: DoctorCheckResult[] = [];

  results.push(checkStateFile(projectRoot));
  results.push(checkStateMachine(projectRoot));
  results.push(checkConfig(projectRoot));
  results.push(...checkSkills(projectRoot));
  results.push(...checkHooks(projectRoot));
  results.push(checkHooksRegistration(projectRoot));
  results.push(...checkFeatureDirectories(projectRoot));
  results.push(...checkEnabledCapabilities(projectRoot));

  return results;
}

function checkStateFile(projectRoot: string): DoctorCheckResult {
  const path = statePath(projectRoot);
  if (!existsSync(path)) {
    return { name: 'state.json', status: 'fail', severity: 'critical', message: 'state.json missing', fix: 'chimera init' };
  }
  const state = readJson<ProjectState>(path);
  if (!state || !state.version) {
    return { name: 'state.json', status: 'fail', severity: 'critical', message: 'state.json malformed (cannot parse)', fix: 'chimera init --force' };
  }
  return { name: 'state.json', status: 'pass', severity: 'critical', message: 'exists and valid' };
}

function checkStateMachine(projectRoot: string): DoctorCheckResult {
  const path = stateMachinePath(projectRoot);
  if (!existsSync(path)) {
    return { name: 'state-machine.yaml', status: 'fail', severity: 'critical', message: 'state-machine.yaml missing', fix: 'chimera init --force' };
  }
  return { name: 'state-machine.yaml', status: 'pass', severity: 'critical', message: 'exists' };
}

function checkConfig(projectRoot: string): DoctorCheckResult {
  const path = configPath(projectRoot);
  if (!existsSync(path)) {
    return { name: 'config.yaml', status: 'fail', severity: 'critical', message: 'config.yaml missing', fix: 'chimera init --force' };
  }
  return { name: 'config.yaml', status: 'pass', severity: 'critical', message: 'exists' };
}

function checkSkills(projectRoot: string): DoctorCheckResult[] {
  const results: DoctorCheckResult[] = [];
  const skillsDir = join(chimeraDir(projectRoot), 'skills');

  if (!existsSync(skillsDir)) {
    results.push({ name: 'skills/', status: 'fail', severity: 'critical', message: 'skills/ directory missing', fix: 'chimera doctor --fix' });
    return results;
  }

  const skillDirs = readdirSync(skillsDir).filter(f => {
    try { return readdirSync(join(skillsDir, f)).length > 0; } catch { return false; }
  });

  if (skillDirs.length === 0) {
    results.push({ name: 'skills/', status: 'fail', severity: 'critical', message: 'skills/ directory empty', fix: 'chimera doctor --fix' });
    return results;
  }

  results.push({ name: 'skills/', status: 'pass', severity: 'critical', message: `${skillDirs.length} skills found` });

  // Check referenced skills exist (only items under "skills:" sections)
  const smContent = readText(stateMachinePath(projectRoot));
  if (smContent) {
    const referencedSkills = new Set<string>();
    let inSkillsBlock = false;

    for (const line of smContent.split('\n')) {
      if (/^\s+skills:/.test(line)) {
        inSkillsBlock = true;
        continue;
      }
      if (inSkillsBlock && /^\s+- /.test(line)) {
        const skill = line.replace(/^\s+- /, '').trim();
        if (skill) referencedSkills.add(skill);
        continue;
      }
      if (inSkillsBlock && !/^\s+- /.test(line) && line.trim() !== '') {
        inSkillsBlock = false;
      }
    }

    for (const skill of referencedSkills) {
      const skillFile = join(skillsDir, skill, 'SKILL.md');
      if (!existsSync(skillFile)) {
        results.push({ name: `skill:${skill}`, status: 'fail', severity: 'high', message: `Skill '${skill}' referenced in state-machine.yaml but SKILL.md not found`, fix: `Create .chimera/skills/${skill}/SKILL.md` });
      }
    }
  }

  return results;
}

function checkHooks(projectRoot: string): DoctorCheckResult[] {
  const results: DoctorCheckResult[] = [];
  const hooks = hooksDir(projectRoot);

  if (!existsSync(hooks)) {
    results.push({ name: 'hooks/', status: 'fail', severity: 'critical', message: 'hooks/ directory missing', fix: 'chimera doctor --fix' });
    return results;
  }

  const requiredHooks = ['session-start.sh', 'pre-tool-use.sh', 'post-tool-use.sh', 'pre-commit.sh'];
  for (const hook of requiredHooks) {
    const hookPath = join(hooks, hook);
    if (!existsSync(hookPath)) {
      results.push({ name: `hook:${hook}`, status: 'fail', severity: 'high', message: `${hook} missing`, fix: 'chimera doctor --fix' });
    } else {
      try {
        accessSync(hookPath, constants.X_OK);
        results.push({ name: `hook:${hook}`, status: 'pass', severity: 'high', message: 'exists and executable' });
      } catch {
        results.push({ name: `hook:${hook}`, status: 'warn', severity: 'high', message: `${hook} not executable`, fix: `chmod +x .chimera/hooks/${hook}` });
      }
    }
  }

  return results;
}

function checkHooksRegistration(projectRoot: string): DoctorCheckResult {
  const settingsPath = claudeSettingsPath(projectRoot);
  if (!existsSync(settingsPath)) {
    return { name: 'hooks registration', status: 'fail', severity: 'high', message: '.claude/settings.json missing', fix: 'chimera doctor --fix' };
  }

  const settings = readJson<Record<string, unknown>>(settingsPath);
  if (!settings || !settings.hooks) {
    return { name: 'hooks registration', status: 'fail', severity: 'high', message: 'No hooks registered in .claude/settings.json', fix: 'chimera doctor --fix' };
  }

  const hooks = settings.hooks as Record<string, unknown[]>;
  const hasSession = Array.isArray(hooks.SessionStart) && hooks.SessionStart.length > 0;
  const hasPreTool = Array.isArray(hooks.PreToolUse) && hooks.PreToolUse.length > 0;
  const hasPreCommit = Array.isArray(hooks.PreCommit) && hooks.PreCommit.length > 0;

  if (!hasSession || !hasPreTool) {
    return { name: 'hooks registration', status: 'fail', severity: 'high', message: 'Critical hooks not registered (SessionStart or PreToolUse missing)', fix: 'chimera doctor --fix' };
  }

  if (!hasPreCommit) {
    return { name: 'hooks registration', status: 'warn', severity: 'high', message: 'PreCommit hook not registered (quality gate inactive)', fix: 'chimera doctor --fix' };
  }

  return { name: 'hooks registration', status: 'pass', severity: 'high', message: 'all hooks registered' };
}

function checkFeatureDirectories(projectRoot: string): DoctorCheckResult[] {
  const results: DoctorCheckResult[] = [];
  const state = readJson<ProjectState>(statePath(projectRoot));
  if (!state || state.features.length === 0) return results;

  for (const feature of state.features) {
    const featureDir = join(chimeraDir(projectRoot), 'features', feature.id);
    if (!existsSync(featureDir)) {
      results.push({ name: `feature:${feature.id}`, status: 'fail', severity: 'medium', message: `Feature '${feature.id}' in state but .chimera/features/${feature.id}/ missing`, fix: `mkdir -p .chimera/features/${feature.id}` });
    }
  }

  return results;
}

function checkEnabledCapabilities(projectRoot: string): DoctorCheckResult[] {
  const results: DoctorCheckResult[] = [];
  const config = readText(configPath(projectRoot));
  if (!config) return results;

  // TDD enabled but no tdd-state.json
  if (config.includes('tdd:') && config.match(/tdd:\s*\n\s*enabled:\s*true/)) {
    if (!existsSync(tddStatePath(projectRoot))) {
      results.push({ name: 'tdd-state.json', status: 'fail', severity: 'medium', message: 'TDD enabled but tdd-state.json missing (TDD hooks will be inert)', fix: 'chimera doctor --fix' });
    }
  }

  // Constitution enabled but no file
  if (config.includes('constitution:') && config.match(/constitution:\s*\n\s*enabled:\s*true/)) {
    if (!existsSync(constitutionPath(projectRoot))) {
      results.push({ name: 'constitution.md', status: 'fail', severity: 'medium', message: 'Constitution enabled but constitution.md missing', fix: 'chimera doctor --fix' });
    }
  }

  // Knowledge enabled but no files
  if (config.includes('knowledge:') && config.match(/knowledge:\s*\n\s*enabled:\s*true/)) {
    const kDir = knowledgeDir(projectRoot);
    if (!existsSync(join(kDir, 'business.md')) && !existsSync(join(kDir, 'conventions.md'))) {
      results.push({ name: 'knowledge files', status: 'warn', severity: 'medium', message: 'Knowledge enabled but template files empty or missing', fix: 'chimera enable knowledge' });
    }
  }

  return results;
}
