# Project Constitution (web-app preset)

## MUST

- C-001: All API endpoints must have request/response validation
- C-002: Test coverage must not drop below 80%
- C-003: No direct push to main branch
- C-004: All database queries must use parameterized statements
- C-005: Authentication required for all non-public endpoints

## SHOULD

- C-010: API responses should follow consistent envelope format
- C-011: Functions should not exceed 30 lines
- C-012: Files should not exceed 300 lines
- C-013: [scope:implement] Prefer composition over inheritance

## MAY

- C-020: Use barrel exports for cleaner imports
- C-021: Consider pagination for list endpoints
