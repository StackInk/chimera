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

# ─── Quick integrity warnings ─────────────────────────────────────────
WARNINGS=""
if [ ! -d "$CHIMERA_DIR/skills" ] || [ -z "$(ls -A "$CHIMERA_DIR/skills" 2>/dev/null)" ]; then
  WARNINGS="${WARNINGS}  [WARNING] Skills directory missing or empty. Run 'chimera doctor --fix'\n"
fi
if [ ! -f "$CONFIG_FILE" ]; then
  WARNINGS="${WARNINGS}  [WARNING] config.yaml missing. Run 'chimera doctor --fix'\n"
fi

# ─── Parse state ──────────────────────────────────────────────────────
VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$STATE_FILE" | head -1 | grep -o '"[^"]*"$' | tr -d '"')
PRESET=$(grep -o '"preset"[[:space:]]*:[[:space:]]*"[^"]*"' "$STATE_FILE" | head -1 | grep -o '"[^"]*"$' | tr -d '"')

# Output warnings first if any
if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS"
fi

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

    # Inject primary skill content for current phase
    PRIMARY_SKILL=$(echo "$SKILLS" | awk '{print $1}')
    SKILL_FILE="$CHIMERA_DIR/skills/$PRIMARY_SKILL/SKILL.md"
    if [ -f "$SKILL_FILE" ]; then
      echo "  ─── Active Skill: $PRIMARY_SKILL ───"
      # Output skill content (skip the title line)
      tail -n +3 "$SKILL_FILE" | head -30
      echo ""
      echo "  (Full skill: .chimera/skills/$PRIMARY_SKILL/SKILL.md)"
      echo ""
    fi
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

# ─── Archived Knowledge (summaries for reference) ────────────────────
BLOCKS_DIR="$CHIMERA_DIR/archive/blocks"
if [ -d "$BLOCKS_DIR" ] && [ -n "$(ls "$BLOCKS_DIR"/*.json 2>/dev/null)" ]; then
  ACTIVE_COUNT=0
  STALE_COUNT=0
  INVALID_COUNT=0
  ACTIVE_OUTPUT=""

  for f in "$BLOCKS_DIR"/*.json; do
    STATUS=$(grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | grep -o '"[^"]*"$' | tr -d '"')
    case "$STATUS" in
      active)
        ACTIVE_COUNT=$((ACTIVE_COUNT + 1))
        if [ $ACTIVE_COUNT -le 10 ]; then
          BID=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | grep -o '"[^"]*"$' | tr -d '"')
          BTITLE=$(grep -o '"title"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | grep -o '"[^"]*"$' | tr -d '"')
          BSUMMARY=$(grep -o '"summary"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | grep -o '"[^"]*"$' | tr -d '"')
          ACTIVE_OUTPUT="${ACTIVE_OUTPUT}    [${BID}] ${BTITLE}: ${BSUMMARY}\n"
        fi
        ;;
      stale) STALE_COUNT=$((STALE_COUNT + 1)) ;;
      invalidated) INVALID_COUNT=$((INVALID_COUNT + 1)) ;;
    esac
  done

  if [ $ACTIVE_COUNT -gt 0 ]; then
    echo "  ─── Archived Decisions (reference) ───"
    echo -e "$ACTIVE_OUTPUT"
    if [ $ACTIVE_COUNT -gt 10 ]; then
      echo "    ... and $((ACTIVE_COUNT - 10)) more"
    fi
  fi

  if [ $STALE_COUNT -gt 0 ]; then
    echo "  ⚠ ${STALE_COUNT} knowledge block(s) STALE. Run 'chimera knowledge check'"
  fi
  if [ $INVALID_COUNT -gt 0 ]; then
    echo "  ℹ ${INVALID_COUNT} block(s) invalidated (superseded by newer knowledge)"
  fi
  if [ $STALE_COUNT -gt 0 ] || [ $INVALID_COUNT -gt 0 ]; then
    echo ""
  fi

  # ─── Drift scan (lightweight: check commit distance) ─────────────
  DRIFT_WARNINGS=""
  for f in "$BLOCKS_DIR"/*.json; do
    STATUS=$(grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | grep -o '"[^"]*"$' | tr -d '"')
    [ "$STATUS" != "active" ] && continue

    GIT_REF=$(grep -o '"git_ref"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | grep -o '"[^"]*"$' | tr -d '"')
    [ -z "$GIT_REF" ] && continue

    COMMIT_DIST=$(git rev-list --count "$GIT_REF"..HEAD 2>/dev/null || echo 0)
    if [ "$COMMIT_DIST" -gt 50 ]; then
      BID=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | grep -o '"[^"]*"$' | tr -d '"')
      # Auto-mark as stale
      sed -i '' "s/\"status\"[[:space:]]*:[[:space:]]*\"active\"/\"status\": \"stale\"/" "$f" 2>/dev/null || \
        sed -i "s/\"status\"[[:space:]]*:[[:space:]]*\"active\"/\"status\": \"stale\"/" "$f"
      DRIFT_WARNINGS="${DRIFT_WARNINGS}    [${BID}] ${COMMIT_DIST} commits since creation → marked STALE\n"
    elif [ "$COMMIT_DIST" -gt 20 ]; then
      BID=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | grep -o '"[^"]*"$' | tr -d '"')
      DRIFT_WARNINGS="${DRIFT_WARNINGS}    [${BID}] ${COMMIT_DIST} commits since creation → may need review\n"
    fi
  done

  if [ -n "$DRIFT_WARNINGS" ]; then
    echo "  ─── Drift Detection ───"
    echo -e "$DRIFT_WARNINGS"
  fi
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

# ─── Bootstrap Behavior Rules ─────────────────────────────────────────
CURRENT_PHASE="${CURRENT_PHASE:-idle}"
echo ""
echo "  [Chimera Rules]"
echo "  1. State machine is the authority. Never skip phases."
echo "  2. Phase determines allowed actions:"
case "$CURRENT_PHASE" in
  idle|"")
    echo "     → Ask what user wants to build. Any description → create feature → spec" ;;
  spec)
    echo "     → Clarify requirements, write spec.md. NO code, NO implementation files." ;;
  plan)
    echo "     → Design architecture, write plan.md. Check constitution gate. NO code." ;;
  tasks)
    echo "     → Decompose into 2-5 min tasks with file paths. Write tasks.md." ;;
  workspace)
    echo "     → Create worktree, install deps, verify baseline." ;;
  implement)
    echo "     → TDD only: Red(test)→Green(src)→Refactor. Multi-agent dispatch available." ;;
  review)
    echo "     → Two-stage review: spec compliance + code quality." ;;
  finish)
    echo "     → Choose: merge / PR / keep / discard. Run tests first." ;;
esac
echo "  3. Constitution MUST rules = hard block. SHOULD = warning."
echo "  4. TDD is non-negotiable (when enabled). No src without failing test."
echo "  5. Cross-phase operations require explicit user confirmation."
echo ""
echo "  [Red Flags — if you think these, STOP]"
echo "  - \"Too simple for TDD\" → Write the test."
echo "  - \"I'll spec later\" → Hidden requirements will bite."
echo "  - \"The rule doesn't apply here\" → If MUST, it applies."
echo "  - \"Let me skip to implement\" → Transition properly."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
