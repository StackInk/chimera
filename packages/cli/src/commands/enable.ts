import { existsSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readText, writeText, ensureDir } from '@chimera/core';
import { chimeraDir, configPath, constitutionPath, knowledgeDir } from '@chimera/core';

const TEMPLATES_DIR = resolve(import.meta.dirname, '../../..', 'templates');

export type Capability = 'constitution' | 'tdd' | 'knowledge' | 'compression';

const VALID_CAPABILITIES: Capability[] = ['constitution', 'tdd', 'knowledge', 'compression'];

export function enable(projectRoot: string, capability: string): void {
  if (!existsSync(chimeraDir(projectRoot))) {
    console.error("Error: Project not initialized. Run 'chimera init' first.");
    process.exit(1);
  }

  if (!VALID_CAPABILITIES.includes(capability as Capability)) {
    console.error(`Error: Unknown capability '${capability}'.`);
    console.error(`Valid capabilities: ${VALID_CAPABILITIES.join(', ')}`);
    process.exit(1);
  }

  const config = readText(configPath(projectRoot));
  if (!config) {
    console.error('Error: config.yaml not found.');
    process.exit(1);
  }

  switch (capability as Capability) {
    case 'constitution':
      enableConstitution(projectRoot, config);
      break;
    case 'tdd':
      enableTdd(config, projectRoot);
      break;
    case 'knowledge':
      enableKnowledge(projectRoot, config);
      break;
    case 'compression':
      enableCompression(config, projectRoot);
      break;
  }
}

function enableConstitution(projectRoot: string, config: string): void {
  const updated = config.replace(/constitution:\s*\n\s*enabled:\s*false/, 'constitution:\n  enabled: true');
  writeText(configPath(projectRoot), updated);

  if (!existsSync(constitutionPath(projectRoot))) {
    const templateSrc = join(TEMPLATES_DIR, 'constitution.md');
    if (existsSync(templateSrc)) {
      cpSync(templateSrc, constitutionPath(projectRoot));
    }
  }

  console.log('[Chimera] Constitution enabled.');
  console.log(`  Edit .chimera/constitution.md to define your rules.`);
}

function enableTdd(config: string, projectRoot: string): void {
  const updated = config.replace(/tdd:\s*\n\s*enabled:\s*false/, 'tdd:\n  enabled: true');
  writeText(configPath(projectRoot), updated);

  console.log('[Chimera] TDD mode enabled.');
  console.log('  Red-Green-Refactor will be enforced via hooks.');
}

function enableKnowledge(projectRoot: string, config: string): void {
  const updated = config.replace(/knowledge:\s*\n\s*enabled:\s*false/, 'knowledge:\n  enabled: true');
  writeText(configPath(projectRoot), updated);

  const kDir = knowledgeDir(projectRoot);
  ensureDir(kDir);

  const businessSrc = join(TEMPLATES_DIR, 'knowledge', 'business.md');
  const conventionsSrc = join(TEMPLATES_DIR, 'knowledge', 'conventions.md');
  const businessDst = join(kDir, 'business.md');
  const conventionsDst = join(kDir, 'conventions.md');

  if (!existsSync(businessDst) && existsSync(businessSrc)) cpSync(businessSrc, businessDst);
  if (!existsSync(conventionsDst) && existsSync(conventionsSrc)) cpSync(conventionsSrc, conventionsDst);

  console.log('[Chimera] Knowledge management enabled.');
  console.log('  Edit .chimera/knowledge/business.md and conventions.md');
}

function enableCompression(config: string, projectRoot: string): void {
  const updated = config.replace(/compression:\s*\n\s*enabled:\s*false/, 'compression:\n  enabled: true');
  writeText(configPath(projectRoot), updated);

  console.log('[Chimera] Compression enabled (engine: builtin).');
}
