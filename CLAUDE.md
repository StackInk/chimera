# Chimera — AI Development Framework

## What is Chimera

Chimera 是一个状态驱动的 AI 辅助开发框架，通过项目级状态机替代纯意图猜测，融合 Superpowers（工作流）、Spec-Kit（结构化流程+宪法）、OpenSpec（知识归档）的最佳实践。核心设计：声明式 FSM + Claude Code hooks + 零依赖文件系统架构。

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run core tests
cd packages/core && npx vitest run

# Run E2E tests
npx vitest run

# Type check
cd packages/core && npx tsc --noEmit
cd packages/cli && npx tsc --noEmit
cd packages/vscode-extension && npx tsc --noEmit

# Build core (required before CLI type check)
cd packages/core && npx tsc
```

## Architecture

### Monorepo structure (npm workspaces)

- **packages/core/** — 零依赖核心库（状态机、知识管理、压缩、宪法、TDD）
- **packages/cli/** — CLI 工具（依赖 core），入口 `src/index.ts`
- **packages/hooks/** — Shell 脚本（pre-tool-use, post-tool-use, pre-commit, session-start, tdd/）
- **packages/skills/** — Markdown skill 文件（specify, plan, tasks, implement, review, finish, dispatch）
- **packages/templates/** — init 时复制到项目的模板（state.json, config.yaml, presets/）
- **packages/vscode-extension/** — VS Code 插件（Kanban 看板, 知识面板, 宪法面板）
- **tests/e2e/** — 端到端集成测试

### Key modules in core

| Module | Path | Responsibility |
|--------|------|---------------|
| FSM | `state-machine/fsm.ts` | 有限状态机引擎（transition, guards, history） |
| Guards | `state-machine/guards.ts` | 基于文件存在性的 guard conditions |
| ProjectState | `project/state.ts` | 项目状态 CRUD（features, phases） |
| Constitution | `constitution/parser.ts` + `checker.ts` | 规则解析 + 违规检测 |
| TDD | `tdd/tdd-fsm.ts` + `restrictions.ts` | Red-Green-Refactor 子状态机 + 文件限制 |
| Knowledge | `knowledge/block.ts` + `loader.ts` + `expiry.ts` | 块级存储、阶段加载、过期检测 |
| Compression | `compression/content-router.ts` + `ccr-cache.ts` | ContentRouter 类型检测 + CCR 缓存 |
| Skills | `skills/registry.ts` | 阶段→技能映射 |
| Dispatch | `dispatch/dag.ts` + `scheduler.ts` + `orchestrator.ts` | DAG 解析、拓扑排序、多 Agent 调度 |

### Design principles

1. Core 零运行时依赖 — 只用 Node.js 标准库
2. Hooks 纯 Shell — 不依赖 Node 运行时
3. Skills 纯 Markdown — 无代码执行
4. CLI 通过 TypeScript project references 引用 core
5. 状态机是唯一权威 — 所有流转由 FSM 驱动

## Testing

- Framework: Vitest 2.x
- Core tests: `packages/core/src/**/__tests__/*.test.ts` (101 tests)
- E2E tests: `tests/e2e/*.test.ts` (10 tests)
- Pattern: test 文件与源文件同目录下 `__tests__/` 文件夹
- 运行单个测试: `cd packages/core && npx vitest run src/tdd/__tests__/tdd-fsm.test.ts`

## CLI Commands

```
chimera init [--preset minimal|web-app|cli-tool|library] [--force] [--skip-hooks]
chimera status [--json]
chimera transition <phase> [--feature <id>]
chimera enable <constitution|tdd|knowledge|compression>
chimera finish [--action merge|pr|keep|discard] [--feature <id>]
chimera knowledge check|read|archive
```

## State Machine Phases

```
idle → spec → plan → tasks → workspace → implement → review → finish → archive
```

Rollback (requires confirmation): plan→spec, tasks→plan, implement→tasks

## Conventions

- TypeScript strict mode, ES2022 target, NodeNext module
- Type-only imports: `import type { ... } from '...'`
- File exports via `src/index.ts` barrel
- Commit messages: `feat:`, `fix:`, `test:`, `refactor:`
