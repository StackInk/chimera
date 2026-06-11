# Chimera Skill: Tasks

## When to trigger

Auto-triggered when feature enters `tasks` phase.

## Behavior

You are in the **Tasks** phase. Decompose the plan into executable tasks.

### Process

1. Load plan.md, spec.md, data-model.md, contracts/
2. Break work into 2-5 minute tasks with exact file paths
3. Identify dependencies between tasks (build DAG)
4. Mark parallelizable tasks with [P]
5. Group by user story for independent delivery
6. Produce tasks.md

### Task format

```
- [ ] T001 [P] [US1] Description with exact file path
```

### Constraints

- Each task must be completable by a single agent in one pass
- Include verification command for each task
- No task should modify more than 2-3 files
- Tests come before implementation (TDD)

### Completion

When tasks.md is complete and user approves, signal transition to `workspace` phase.
