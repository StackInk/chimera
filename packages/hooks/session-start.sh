#!/bin/bash
# Chimera: Session start hook
# Loads project state and injects context into AI session
# Registered in .claude/settings.json by `chimera init`

CHIMERA_DIR=".chimera"
STATE_FILE="$CHIMERA_DIR/state.json"

if [ ! -f "$STATE_FILE" ]; then
  echo "[Chimera] No state file found. Run 'chimera init' to initialize."
  exit 0
fi

echo "[Chimera] State loaded from $STATE_FILE"
