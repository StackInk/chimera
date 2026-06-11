# Project Constitution (library preset)

## MUST

- C-001: All public APIs must have JSDoc/TSDoc documentation
- C-002: Test coverage must not drop below 90%
- C-003: Zero runtime dependencies (devDependencies only)
- C-004: All breaking changes must follow semver MAJOR bump
- C-005: Exported types must be stable across minor versions

## SHOULD

- C-010: Public API surface should be minimal
- C-011: Functions should not exceed 20 lines
- C-012: Prefer pure functions over stateful classes

## MAY

- C-020: Provide usage examples in JSDoc
- C-021: Consider tree-shaking friendly exports
