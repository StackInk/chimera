#!/bin/bash
# Chimera: Post-tool-use hook
# TDD phase verification + SHOULD warnings
# Args: $1 = tool name, $2 = file path

TOOL_NAME="${1:-}"
FILE_PATH="${2:-}"
CHIMERA_DIR=".chimera"
TDD_STATE="$CHIMERA_DIR/tdd-state.json"

# Skip if not initialized
[ ! -f "$CHIMERA_DIR/state.json" ] && exit 0

# TDD verification after file write
if [ -f "$TDD_STATE" ]; then
  CYCLE=$(grep -o '"cycle"[[:space:]]*:[[:space:]]*"[^"]*"' "$TDD_STATE" | grep -o '"[^"]*"$' | tr -d '"')

  case "$CYCLE" in
    red)
      # After writing a test file in RED, run tests to verify they fail
      if [[ "$FILE_PATH" == *test* ]] || [[ "$FILE_PATH" == *spec* ]]; then
        echo "[Chimera] TDD RED: Test file modified. Run tests to verify failure."
      fi
      ;;
    green)
      # After writing src in GREEN, run tests to verify they pass
      if [[ "$FILE_PATH" != *test* ]]; then
        echo "[Chimera] TDD GREEN: Source modified. Run tests to verify pass."
      fi
      ;;
    refactor)
      echo "[Chimera] TDD REFACTOR: Ensure tests still pass after changes."
      ;;
  esac
fi

exit 0
