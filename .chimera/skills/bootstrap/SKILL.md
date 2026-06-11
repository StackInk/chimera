# Chimera Skill: Bootstrap (using-chimera)

## Priority: HIGHEST — Always loaded at session start

This skill governs ALL behavior in a Chimera-managed project. Before taking ANY action, check the current phase and follow the corresponding skill.

## Core Discipline

1. **State machine is the authority.** Never skip phases. Never guess what phase you're in — read `.chimera/state.json`.
2. **Phase determines what you can do.** Each phase has allowed actions. Attempting cross-phase work requires explicit user confirmation.
3. **Constitution is law.** MUST rules cannot be violated. SHOULD rules produce warnings. Check before acting.
4. **TDD is non-negotiable** (when enabled). No production code without a failing test first.

## Phase Behaviors

### idle
- User hasn't described a feature yet
- **Action**: Ask what they want to build
- **Trigger**: Any feature description → create feature → transition to `spec`

### spec
- Clarifying requirements
- **Allowed**: Ask questions, propose approaches, write spec.md
- **Forbidden**: Writing code, creating files outside spec documentation
- **Skill**: `specify`
- **Exit**: spec.md complete + user approval → transition to `plan`

### plan
- Designing technical solution
- **Allowed**: Research, architecture decisions, write plan.md
- **Forbidden**: Writing implementation code
- **Skill**: `plan`
- **Check**: Constitution gate (plan must not violate MUST rules)
- **Exit**: plan.md complete + user approval → transition to `tasks`

### tasks
- Decomposing into executable units
- **Allowed**: Write tasks.md, analyze dependencies
- **Forbidden**: Implementation
- **Skill**: `tasks`
- **Exit**: tasks.md complete → transition to `workspace`

### workspace
- Setting up isolated environment
- **Allowed**: Create worktree, install deps, verify baseline
- **Exit**: Worktree ready → transition to `implement`

### implement
- Writing code via TDD
- **Allowed**: Write tests (red), write src (green), refactor
- **Required**: Follow Red-Green-Refactor strictly
- **Skills**: `implement`, `dispatch`
- **Forbidden**: Modifying src in Red phase, modifying tests in Green phase
- **Exit**: All tasks done + tests pass → transition to `review`

### review
- Two-stage code review
- **Allowed**: Review findings, request changes
- **Skill**: `review`
- **Exit**: APPROVED → transition to `finish`

### finish
- Wrapping up
- **Allowed**: Merge, PR, keep, discard
- **Skill**: `finish`
- **Exit**: Action complete → transition to `archive`

## Red Flags — Rationalization Detection

If you catch yourself thinking any of these, STOP:

| Rationalization | Reality |
|----------------|---------|
| "I'll just write the code quickly, we can spec later" | Spec phase exists for a reason. Hidden requirements will bite. |
| "This is too simple for TDD" | Simple things have edge cases. Write the test. |
| "I'll add tests after" | That's not TDD. Red comes first. Always. |
| "The constitution rule doesn't apply here" | If it's MUST, it applies. No exceptions without explicit override. |
| "Let me skip to implement, we know what we're doing" | The state machine enforces order. Transition properly. |
| "I'll fix the spec after coding" | You're building the wrong thing. Go back to spec. |

## Multi-Feature Handling

- Each feature has its own phase (independent state)
- Check which feature is active before acting
- Don't mix work across features without explicit user direction

## Override Protocol

If the user explicitly requests a cross-phase action:
1. Warn: "This is a cross-phase operation. Current phase is [X], you're requesting [Y] action."
2. If user confirms: Execute, but record in state history
3. Never silently skip phases

## Session Start Checklist

At the beginning of every session:
1. ✓ Read `.chimera/state.json` (loaded by session-start.sh)
2. ✓ Identify current phase
3. ✓ Load phase-appropriate skill
4. ✓ Check constitution constraints
5. ✓ Check TDD state (if in implement)
6. ✓ Greet user with current context
