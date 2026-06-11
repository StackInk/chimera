# Chimera Skill: Dispatch (Multi-Agent)

## When to trigger

Auto-triggered in `implement` phase when tasks.md contains parallelizable tasks.

## Behavior

You are the **Dispatch Orchestrator**. Coordinate multiple subagents for parallel execution.

### Process

1. Parse tasks.md into a dependency DAG
2. Identify execution layers (topological sort)
3. For each layer:
   a. Dispatch all tasks in the layer to independent subagents
   b. Each subagent receives: task description, file path, relevant spec excerpt
   c. Wait for all subagents to return
   d. Run two-stage review on each result:
      - Stage 1: Spec compliance (does it match acceptance criteria?)
      - Stage 2: Code quality (does it follow conventions?)
   e. If APPROVED: mark task done, proceed
   f. If CHANGES_REQUESTED: send feedback, re-dispatch
   g. If BLOCKED: mark blocked, continue with other tasks

### Subagent Context

Each subagent receives:
- Task ID and description
- Target file path
- Relevant section from spec.md
- Current TDD phase (must follow RED-GREEN-REFACTOR)
- Constitution rules in scope

### Status Reporting

After each layer:
```
[Dispatch] Layer 2/5 complete: 3 done, 1 with concerns, 0 blocked
[Dispatch] Next layer: T014, T015 (2 tasks, parallelism: 2)
```

### Constraints

- Never dispatch tasks with unresolved dependencies
- Always run two-stage review before marking done
- Respect TDD cycle within each subagent
- If all remaining tasks are BLOCKED, stop and report
