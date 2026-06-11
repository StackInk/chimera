#!/bin/bash
# Chimera TDD: Verify RED phase
# Run the project's test command, assert tests FAIL (exit code != 0)
# If tests pass, RED phase is invalid (test doesn't actually test anything new)

CHIMERA_DIR=".chimera"
TDD_STATE="$CHIMERA_DIR/tdd-state.json"

[ ! -f "$TDD_STATE" ] && exit 0

CYCLE=$(grep -o '"cycle"[[:space:]]*:[[:space:]]*"[^"]*"' "$TDD_STATE" | grep -o '"[^"]*"$' | tr -d '"')
[ "$CYCLE" != "red" ] && exit 0

# Detect test runner
if [ -f "package.json" ]; then
  TEST_CMD="npx vitest run --reporter=dot 2>/dev/null"
elif [ -f "Cargo.toml" ]; then
  TEST_CMD="cargo test 2>/dev/null"
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  TEST_CMD="pytest --tb=no -q 2>/dev/null"
else
  echo "[Chimera TDD] No test runner detected. Skipping RED verification."
  exit 0
fi

eval $TEST_CMD
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "[Chimera TDD] ⚠ Tests PASS but should FAIL in RED phase."
  echo "[Chimera TDD] Your test doesn't assert anything new. Add a failing assertion."
  exit 1
fi

# Tests fail as expected - transition to GREEN
sed -i '' 's/"cycle"[[:space:]]*:[[:space:]]*"red"/"cycle": "green"/' "$TDD_STATE" 2>/dev/null || \
  sed -i 's/"cycle"[[:space:]]*:[[:space:]]*"red"/"cycle": "green"/' "$TDD_STATE"

echo "[Chimera TDD] ✓ RED verified. Tests fail. Transitioning to GREEN."
echo "[Chimera TDD] Now write minimal code to make the test pass."
exit 0
