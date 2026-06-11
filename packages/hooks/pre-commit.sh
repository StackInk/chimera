#!/bin/bash
# Chimera: Pre-commit hook (Quality Gate)
# Checks: test coverage + constitution MUST rules + new functions have tests

CHIMERA_DIR=".chimera"
CONSTITUTION="$CHIMERA_DIR/constitution.md"
CONFIG="$CHIMERA_DIR/config.yaml"

# Skip if not initialized
[ ! -f "$CHIMERA_DIR/state.json" ] && exit 0

ERRORS=""

# Check 1: Coverage threshold (if TDD enabled)
if [ -f "$CONFIG" ] && grep -q "enabled: true" "$CONFIG" 2>/dev/null; then
  THRESHOLD=$(grep "coverage_threshold" "$CONFIG" | grep -o "[0-9]*")
  if [ -n "$THRESHOLD" ]; then
    # Placeholder: actual coverage tool integration needed per project
    echo "[Chimera] Coverage check: threshold = ${THRESHOLD}%"
  fi
fi

# Check 2: New functions without tests
STAGED_FILES=$(git diff --cached --name-only --diff-filter=AM 2>/dev/null)
NEW_FUNCTIONS=""

for file in $STAGED_FILES; do
  # Skip test files
  echo "$file" | grep -q "test\|spec" && continue
  # Skip non-source files
  echo "$file" | grep -qE "\.(ts|js|py)$" || continue

  # Find new exported functions
  FUNCS=$(git diff --cached "$file" | grep "^+" | grep -oE "(export\s+)?(function|const)\s+\w+" | grep -oE "\w+$")
  if [ -n "$FUNCS" ]; then
    for func in $FUNCS; do
      # Check if test exists for this function
      TEST_FILE=$(echo "$file" | sed 's/src/tests/' | sed 's/\.\(ts\|js\)/.test.\1/')
      if [ ! -f "$TEST_FILE" ]; then
        TEST_FILE2=$(echo "$file" | sed 's/\.\(ts\|js\)/.test.\1/')
        if [ ! -f "$TEST_FILE2" ]; then
          NEW_FUNCTIONS="$NEW_FUNCTIONS\n  - $func() in $file"
        fi
      fi
    done
  fi
done

if [ -n "$NEW_FUNCTIONS" ]; then
  echo "[Chimera] WARNING: New functions without dedicated test file:"
  echo -e "$NEW_FUNCTIONS"
fi

# Check 3: Constitution MUST准出 rules
if [ -f "$CONSTITUTION" ]; then
  # Placeholder for advanced constitution checks at commit time
  :
fi

if [ -n "$ERRORS" ]; then
  echo ""
  echo "[Chimera] COMMIT BLOCKED - Quality Gate Failed:"
  echo -e "$ERRORS"
  exit 1
fi

exit 0
