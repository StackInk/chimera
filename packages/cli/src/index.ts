#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help') {
  console.log(`chimera - State-driven AI development framework

Commands:
  init [--preset <name>]   Initialize project
  status [--json]          Show project state
  transition <phase>       Trigger state transition
  enable <capability>      Enable a capability
  knowledge <subcommand>   Knowledge management

Run 'chimera <command> --help' for details.`);
  process.exit(0);
}

console.log(`chimera: command '${command}' not yet implemented`);
process.exit(1);
