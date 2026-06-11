# Chimera Skill: Plan

## When to trigger

Auto-triggered when feature enters `plan` phase.

## Behavior

You are in the **Plan** phase. Your job is to design the technical solution and produce plan.md.

### Process

1. Research unknowns from spec (technologies, patterns, dependencies)
2. Define architecture, data model, and key interfaces
3. Check against constitution rules (Quality Gate)
4. Produce plan.md with: tech stack, project structure, architecture decisions, risk assessment
5. Identify what needs data-model.md and contracts/

### Constraints

- Do NOT write implementation code
- Do NOT skip constitution check
- All decisions must reference spec requirements
- Mark unresolved items as [NEEDS RESEARCH]

### Completion

When plan.md is complete and user approves, signal transition to `tasks` phase.
