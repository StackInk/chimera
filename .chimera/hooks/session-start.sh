#!/bin/bash
# Chimera: Session start hook
# Outputs project context into AI conversation at session start.
# Registered in .claude/settings.json by `chimera init`

CHIMERA_DIR=".chimera"
STATE_FILE="$CHIMERA_DIR/state.json"
CONFIG_FILE="$CHIMERA_DIR/config.yaml"
CONSTITUTION="$CHIMERA_DIR/constitution.md"
SM_FILE="$CHIMERA_DIR/state-machine.yaml"

# ─── Guard: not initialized ───────────────────────────────────────────
if [ ! -f "$STATE_FILE" ]; then
  echo "[Chimera] Not initialized. Run 'chimera init' to start."
  exit 0
fi

# ─── Parse state ──────────────────────────────────────────────────────
VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$STATE_FILE" | head -1 | grep -o '"[^"]*"$' | tr -d '"')
PRESET=$(grep -o '"preset"[[:space:]]*:[[:space:]]*"[^"]*"' "$STATE_FILE" | head -1 | grep -o '"[^"]*"$' | tr -d '"')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Chimera v${VERSION} (preset: ${PRESET})"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─── Active features ──────────────────────────────────────────────────
FEATURES=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$STATE_FILE" | grep -o '"[^"]*"$' | tr -d '"')
PHASES=$(grep -o '"phase"[[:space:]]*:[[:space:]]*"[^"]*"' "$STATE_FILE" | grep -o '"[^"]*"$' | tr -d '"')

if [ -z "$FEATURES" ]; then
  echo "  No active features. Start by describing what you want to build."
  echo ""
else
  echo "  Active Features:"
  # Pair features with phases
  paste <(echo "$FEATURES") <(echo "$PHASES") | while IFS=$'\t' read -r fid fphase; do
    echo "    [$fphase] $fid"
  done
  echo ""

  # Get current phase of most recent feature
  CURRENT_PHASE=$(echo "$PHASES" | tail -1)
  echo "  Current Phase: $CURRENT_PHASE"
  echo ""
fi

# ─── Phase-specific skills ────────────────────────────────────────────
if [ -n "$CURRENT_PHASE" ] && [ -f "$SM_FILE" ]; then
  # Extract skills for current phase from state-machine.yaml
  IN_PHASE=0
  SKILLS=""
  while IFS= read -r line; do
    if echo "$line" | grep -q "^  ${CURRENT_PHASE}:"; then
      IN_PHASE=1
      continue
    fi
    if [ $IN_PHASE -eq 1 ] && echo "$line" | grep -q "^  [a-z]"; then
      IN_PHASE=0
      continue
    fi
    if [ $IN_PHASE -eq 1 ] && echo "$line" | grep -q "^      - "; then
      SKILL=$(echo "$line" | sed 's/^      - //')
      SKILLS="$SKILLS $SKILL"
    fi
  done < "$SM_FILE"

  if [ -n "$SKILLS" ]; then
    echo "  Available Skills:$SKILLS"
    echo ""
  fi
fi

# ─── TDD state ────────────────────────────────────────────────────────
TDD_STATE="$CHIMERA_DIR/tdd-state.json"
TDD_ENABLED=$(grep "enabled: true" "$CONFIG_FILE" 2>/dev/null | head -1)

if [ -f "$TDD_STATE" ] && [ -n "$TDD_ENABLED" ]; then
  TDD_CYCLE=$(grep -o '"cycle"[[:space:]]*:[[:space:]]*"[^"]*"' "$TDD_STATE" | grep -o '"[^"]*"$' | tr -d '"')
  TDD_TASK=$(grep -o '"task"[[:space:]]*:[[:space:]]*"[^"]*"' "$TDD_STATE" | grep -o '"[^"]*"$' | tr -d '"')
  if [ -n "$TDD_CYCLE" ] && [ "$TDD_CYCLE" != "" ]; then
    echo "  TDD: [$TDD_CYCLE] task=$TDD_TASK"
    case "$TDD_CYCLE" in
      red) echo "  → Write a failing test. Only test files can be modified." ;;
      green) echo "  → Write minimal code to pass. Only src files can be modified." ;;
      refactor) echo "  → Refactor freely. Tests must still pass." ;;
    esac
    echo ""
  fi
fi

# ─── Knowledge loading ────────────────────────────────────────────────
KNOWLEDGE_ENABLED=$(grep -A1 "^knowledge:" "$CONFIG_FILE" 2>/dev/null | grep "enabled: true")

if [ -n "$KNOWLEDGE_ENABLED" ]; then
  # Load phase-appropriate knowledge
  case "$CURRENT_PHASE" in
    spec|plan)
      KNOWLEDGE_FILE="$CHIMERA_DIR/knowledge/business.md"
      if [ -f "$KNOWLEDGE_FILE" ] && [ -s "$KNOWLEDGE_FILE" ]; then
        echo "  ─── Business Knowledge (loaded for $CURRENT_PHASE phase) ───"
        # Output content, skip empty template lines
        grep -v "^<!-- " "$KNOWLEDGE_FILE" | grep -v "^$" | head -20
        echo ""
      fi
      ;;
    implement|review)
      KNOWLEDGE_FILE="$CHIMERA_DIR/knowledge/conventions.md"
      if [ -f "$KNOWLEDGE_FILE" ] && [ -s "$KNOWLEDGE_FILE" ]; then
        echo "  ─── Code Conventions (loaded for $CURRENT_PHASE phase) ───"
        grep -v "^<!-- " "$KNOWLEDGE_FILE" | grep -v "^$" | head -20
        echo ""
      fi
      ;;
  esac
fi

# ─── Constitution summary ────────────────────────────────────────────
CONST_ENABLED=$(grep -A1 "^constitution:" "$CONFIG_FILE" 2>/dev/null | grep "enabled: true")

if [ -n "$CONST_ENABLED" ] && [ -f "$CONSTITUTION" ]; then
  MUST_COUNT=$(grep -c "^- C-" "$CONSTITUTION" 2>/dev/null || echo 0)
  echo "  Constitution: ${MUST_COUNT} rules active"
  # Show MUST rules as quick reference
  grep "^- C-" "$CONSTITUTION" | head -5 | while read -r rule; do
    echo "    $rule"
  done
  EXTRA=$(( MUST_COUNT - 5 ))
  if [ $EXTRA -gt 0 ]; then
    echo "    ... and $EXTRA more"
  fi
  echo ""
fi

# ─── Guidance ─────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -z "$FEATURES" ]; then
  echo "  Tell me what you want to build and I'll guide you through"
  echo "  the full development lifecycle: spec → plan → implement."
elif [ "$CURRENT_PHASE" = "idle" ]; then
  echo "  Describe the feature requirements to begin the spec phase."
elif [ "$CURRENT_PHASE" = "spec" ]; then
  echo "  I'll help clarify requirements. Ask questions or propose approaches."
elif [ "$CURRENT_PHASE" = "plan" ]; then
  echo "  Let's design the technical solution. Architecture, data model, contracts."
elif [ "$CURRENT_PHASE" = "tasks" ]; then
  echo "  Breaking down into executable tasks (2-5 min each, TDD)."
elif [ "$CURRENT_PHASE" = "implement" ]; then
  echo "  Implementing via TDD. Red→Green→Refactor. Multi-agent dispatch available."
elif [ "$CURRENT_PHASE" = "review" ]; then
  echo "  Reviewing: spec compliance + code quality. Two-stage review."
elif [ "$CURRENT_PHASE" = "finish" ]; then
  echo "  Ready to wrap up: merge, PR, keep, or discard."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
