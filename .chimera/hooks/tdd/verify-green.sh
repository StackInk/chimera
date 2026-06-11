#!/bin/bash
# Chimera TDD: Verify GREEN phase
# Run tests, assert they PASS (exit code = 0)
# If tests still fail, implementation is incomplete

CHIMERA_DIR=".chimera"
TDD_STATE="$CHIMERA_DIR/tdd-state.json"

[ ! -f "$TDD_STATE" ] && exit 0

CYCLE=$(grep -o '"cycle"[[:space:]]*:[[:space:]]*"[^"]*"' "$TDD_STATE" | grep -o '"[^"]*"$' | tr -d '"')
[ "$CYCLE" != "green" ] && exit 0

# Detect test runner
if [ -f "package.json" ]; then
  TEST_CMD="npx vitest run --reporter=dot 2>/dev/null"
elif [ -f "Cargo.toml" ]; then
  TEST_CMD="cargo test 2>/dev/null"
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  TEST_CMD="pytest --tb=no -q 2>/dev/null"
else
  echo "[Chimera TDD] No test runner detected. Skipping GREEN verification."
  exit 0
fi

eval $TEST_CMD
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "[Chimera TDD] ⚠ Tests still FAIL. Continue implementing."
  exit 0
fi

# Tests pass - transition to REFACTOR
sed -i '' 's/"cycle"[[:space:]]*:[[:space:]]*"green"/"cycle": "refactor"/' "$TDD_STATE" 2>/dev/null || \
  sed -i 's/"cycle"[[:space:]]*:[[:space:]]*"green"/"cycle": "refactor"/' "$TDD_STATE"

echo "[Chimera TDD] ✓ GREEN verified. Tests pass. Transitioning to REFACTOR."
echo "[Chimera TDD] Refactor if needed, then start next cycle or mark done."
exit 0
