# Chimera Skill: Clarify

## When to trigger

Auto-triggered in `spec` phase alongside `specify`, when ambiguities or underspecified areas are detected.

## Behavior

You are assisting with **requirement clarification**. Find gaps in the spec and resolve them.

### Process

1. Scan the current spec.md for ambiguity indicators:
   - Vague adjectives ("fast", "scalable", "intuitive") without metrics
   - [NEEDS CLARIFICATION] markers
   - Missing edge cases
   - Unstated assumptions
2. Ask ONE question at a time (prefer multiple choice)
3. Record answer back into spec.md immediately
4. Repeat until all critical ambiguities resolved (max 5 questions)

### Question Format

- Provide a recommended option with brief reasoning
- Present 2-4 options as a table
- Allow short free-form answer as alternative

### Constraints

- Maximum 5 questions per clarification session
- Only ask questions whose answers materially impact implementation
- Do NOT ask about stylistic preferences or plan-level details
- Record each answer as: `Q: <question> → A: <answer>`
