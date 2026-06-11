#!/usr/bin/env node

import { init } from './commands/init.js';
import { status } from './commands/status.js';
import { transition } from './commands/transition.js';
import { finish } from './commands/finish.js';
import type { FinishAction } from './commands/finish.js';

const args = process.argv.slice(2);
const command = args[0];
const projectRoot = process.cwd();

function parseFlags(args: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

if (!command || command === '--help' || command === '-h') {
  console.log(`chimera - State-driven AI development framework

Commands:
  init [--preset <name>] [--force] [--skip-hooks]
  status [--json]
  transition <phase> [--feature <id>]

Run 'chimera <command> --help' for details.`);
  process.exit(0);
}

const flags = parseFlags(args.slice(1));

switch (command) {
  case 'init':
    init(projectRoot, {
      preset: flags.preset as string | undefined,
      force: flags.force === true,
      skipHooks: flags['skip-hooks'] === true,
    });
    break;

  case 'status':
    status(projectRoot, { json: flags.json === true });
    break;

  case 'transition': {
    const target = args[1];
    if (!target || target.startsWith('--')) {
      console.error('Usage: chimera transition <phase>');
      process.exit(1);
    }
    transition(projectRoot, target, {
      feature: flags.feature as string | undefined,
      force: flags.force === true,
    });
    break;
  }

  case 'finish':
    finish(projectRoot, {
      feature: flags.feature as string | undefined,
      action: flags.action as FinishAction | undefined,
    });
    break;

  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
