# Project Constitution (cli-tool preset)

## MUST

- C-001: All commands must have --help documentation
- C-002: Test coverage must be 100%
- C-003: Exit codes must be meaningful (0=success, 1=user error, 2=system error)
- C-004: All user-facing output goes to stdout, errors to stderr
- C-005: No interactive prompts without --interactive flag

## SHOULD

- C-010: Support both human-readable and JSON output (--json flag)
- C-011: Functions should not exceed 25 lines
- C-012: Commands should complete within 5 seconds

## MAY

- C-020: Support stdin piping for batch operations
