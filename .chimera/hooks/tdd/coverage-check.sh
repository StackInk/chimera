#!/bin/bash
# Chimera TDD: Coverage check (used by pre-commit.sh)
# Runs coverage tool, compares against threshold from config

CHIMERA_DIR=".chimera"
CONFIG="$CHIMERA_DIR/config.yaml"

[ ! -f "$CONFIG" ] && exit 0

# Extract threshold
THRESHOLD=$(grep "coverage_threshold" "$CONFIG" | grep -o "[0-9]*")
[ -z "$THRESHOLD" ] && exit 0

# Detect coverage tool and run
COVERAGE=0
if [ -f "package.json" ]; then
  # Try vitest coverage
  OUTPUT=$(npx vitest run --coverage --reporter=dot 2>&1)
  COVERAGE=$(echo "$OUTPUT" | grep -oE "All files[^|]*\|[[:space:]]*([0-9.]+)" | grep -oE "[0-9.]+" | head -1)
elif [ -f "pyproject.toml" ]; then
  OUTPUT=$(pytest --cov --cov-report=term-missing --tb=no -q 2>&1)
  COVERAGE=$(echo "$OUTPUT" | grep "TOTAL" | grep -oE "[0-9]+%" | tr -d '%')
fi

if [ -z "$COVERAGE" ]; then
  echo "[Chimera TDD] Coverage tool not available. Skipping check."
  exit 0
fi

COVERAGE_INT=${COVERAGE%.*}

if [ "$COVERAGE_INT" -lt "$THRESHOLD" ]; then
  echo "[Chimera TDD] ✗ Coverage: ${COVERAGE_INT}% < required ${THRESHOLD}%"
  exit 1
fi

echo "[Chimera TDD] ✓ Coverage: ${COVERAGE_INT}% >= ${THRESHOLD}%"
exit 0
