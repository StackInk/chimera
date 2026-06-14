# Chimera Skill: CodeGraph

## Priority: HIGH — Loaded in plan/implement/review phases

This skill enables semantic code search via CodeGraph, a code knowledge graph that understands code relationships and semantics.

## When to Use

During **plan**, **implement**, and **review** phases, use CodeGraph to:

- **plan**: Search existing code for architecture decisions, find related modules, understand current patterns before designing
- **implement**: Find relevant code to reference, locate similar implementations, check existing patterns
- **review**: Cross-reference changed code with related modules, verify consistency

## How to Search

Run `chimera knowledge search "<query>"` to search the code graph. The query should be:

- **Specific**: "authentication middleware" not "auth stuff"
- **Concept-aware**: "error handling pattern" or "database connection pool"
- **File-targeted**: "src/auth.ts" to find related code

## Search Strategy

1. **Before writing code**: Search for existing patterns you're about to implement
2. **During implementation**: Search when you need to understand a related module
3. **During review**: Search to verify your changes align with surrounding code

## Example Searches

```
chimera knowledge search "error handling middleware"
chimera knowledge search "database connection pool"
chimera knowledge search "user authentication flow"
```

## Integration with Chimera Flow

CodeGraph search complements the existing knowledge system:

- **Static knowledge** (business.md, conventions.md): Project-level context
- **Archived blocks**: Historical decisions
- **CodeGraph**: Live code relationships and semantics

Use all three to make informed decisions during development.
