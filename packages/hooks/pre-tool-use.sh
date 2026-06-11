#!/bin/bash
# Chimera: Pre-tool-use hook
# Constitutional MUST check + TDD phase file restrictions
# Args: $1 = tool name, $2 = file path

TOOL_NAME="${1:-}"
FILE_PATH="${2:-}"
CHIMERA_DIR=".chimera"
STATE_FILE="$CHIMERA_DIR/state.json"
CONSTITUTION="$CHIMERA_DIR/constitution.md"
TDD_STATE="$CHIMERA_DIR/tdd-state.json"

# Skip if not initialized
[ ! -f "$STATE_FILE" ] && exit 0

# Skip if no constitution
[ ! -f "$CONSTITUTION" ] && exit 0

# Check TDD file restrictions
if [ -f "$TDD_STATE" ]; then
  CYCLE=$(grep -o '"cycle"[[:space:]]*:[[:space:]]*"[^"]*"' "$TDD_STATE" | grep -o '"[^"]*"$' | tr -d '"')

  case "$CYCLE" in
    red)
      # Only test files allowed in RED phase
      if [[ "$FILE_PATH" != *test* ]] && [[ "$FILE_PATH" != *spec* ]]; then
        echo "[Chimera] BLOCKED: TDD is in RED phase. Only test files can be modified."
        echo "[Chimera] Hint: Write a failing test first, then transition to GREEN."
        exit 1
      fi
      ;;
    green)
      # Only src files allowed in GREEN phase
      if [[ "$FILE_PATH" == *test* ]] || [[ "$FILE_PATH" == *spec* ]]; then
        echo "[Chimera] BLOCKED: TDD is in GREEN phase. Only source files can be modified."
        echo "[Chimera] Hint: Write minimal code to make the test pass."
        exit 1
      fi
      ;;
  esac
fi

# Constitution MUST rules - file pattern check
# Parse constitution for MUST rules with file patterns
MUST_SECTION=0
while IFS= read -r line; do
  if echo "$line" | grep -q "^## MUST"; then
    MUST_SECTION=1
    continue
  fi
  if echo "$line" | grep -q "^## " && [ $MUST_SECTION -eq 1 ]; then
    MUST_SECTION=0
    continue
  fi

  if [ $MUST_SECTION -eq 1 ]; then
    # Check for "No deleting test files" type rules
    if echo "$line" | grep -qi "no.*delet.*test" && [ "$TOOL_NAME" = "delete" ]; then
      if echo "$FILE_PATH" | grep -q "test"; then
        RULE_ID=$(echo "$line" | grep -o "C-[0-9]*")
        echo "[Chimera] BLOCKED: Violates constitution $RULE_ID"
        echo "[Chimera] Rule: $(echo "$line" | sed 's/^- C-[0-9]*: //')"
        exit 1
      fi
    fi
  fi
done < "$CONSTITUTION"

exit 0
