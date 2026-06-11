# Chimera Skill: Finish

## When to trigger

Auto-triggered when feature enters `finish` phase.

## Behavior

You are in the **Finish** phase. Wrap up the feature.

### Process

1. Verify all tests pass (run full test suite)
2. Verify no uncommitted changes remain
3. Present options to user:
   - **merge**: Merge feature branch into main locally
   - **pr**: Create a pull request (use `gh pr create`)
   - **keep**: Leave branch as-is for later
   - **discard**: Delete branch and changes

4. Execute chosen action
5. Clean up worktree if applicable

### Constraints

- MUST run tests before any action
- MUST confirm with user before destructive actions (discard)
- Do NOT push without explicit user approval

### Completion

After action is complete, signal transition to `archive` phase.
