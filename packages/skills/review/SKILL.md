# Chimera Skill: Review

## When to trigger

Auto-triggered when feature enters `review` phase.

## Behavior

You are in the **Review** phase. Perform two-stage code review.

### Stage 1: Spec Compliance

- Compare implementation against spec.md acceptance criteria
- Verify each user story is independently testable
- Check all functional requirements are covered
- Flag any deviation from spec

### Stage 2: Code Quality

- Check adherence to conventions.md
- Verify constitution rules are not violated
- Check test coverage meets threshold
- Look for: duplication, complexity, naming, error handling

### Output

Produce a review summary:
- APPROVED: All checks pass
- CHANGES_REQUESTED: List specific issues with file:line references

### Constraints

- Do NOT auto-fix code (just report findings)
- Be specific: file path, line number, what's wrong, how to fix
- Distinguish blocking issues from suggestions

### Completion

When review is APPROVED, signal transition to `finish` phase.
