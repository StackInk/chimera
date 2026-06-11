# Chimera Skill: Implement

## When to trigger

Auto-triggered when feature enters `implement` phase.

## Behavior

You are in the **Implement** phase. Execute tasks using strict TDD.

### Process

For each task in tasks.md (respecting dependency order):

1. **RED**: Write a failing test first
2. **GREEN**: Write minimum code to pass
3. **REFACTOR**: Clean up while tests stay green
4. Commit after each task or logical group

### Multi-Agent dispatch

- Identify tasks with no unresolved dependencies (DAG layer 0)
- Dispatch independent tasks to parallel subagents
- Each subagent follows the same RED-GREEN-REFACTOR cycle
- After completion: spec compliance review + code quality review

### Constraints

- NEVER write production code before a failing test
- NEVER modify test files during GREEN phase
- NEVER modify src files during RED phase
- Commit frequently (after each GREEN or REFACTOR)
- If blocked: mark task as BLOCKED and move to next available

### Completion

When all tasks pass and tests are green, signal transition to `review` phase.
