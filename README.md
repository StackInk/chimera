# Chimera

**State-driven AI development framework** — 融合 Superpowers、Spec-Kit、OpenSpec 的最佳实践。

通过项目级状态机驱动开发流程，替代纯意图猜测。框架始终知道你在哪个阶段，自动加载对应知识和技能，通过 hooks 硬性执行宪法和 TDD 规范。

## 核心特性

| 特性 | 描述 |
|------|------|
| **状态机驱动** | 声明式 FSM 管理 `idle→spec→plan→tasks→workspace→implement→review→finish→archive` |
| **宪法约束** | Quality Gate 模式，MUST 级规则通过 hooks 硬性阻断 |
| **严格 TDD** | Red-Green-Refactor 通过子状态机 + hooks 强制执行 |
| **知识管理** | 块级归档、过期检测、drift 感知、CCR 可逆压缩 |
| **多 Agent 调度** | DAG 依赖分析、并行 dispatch、两阶段 review |
| **Preset 系统** | minimal / web-app / cli-tool / library 一键配置 |
| **零依赖** | 核心纯 Node.js，hooks 纯 Shell，skills 纯 Markdown |

## 安装

```bash
# 全局安装
npm install -g @chimera/cli

# 或直接使用 npx
npx @chimera/cli init
```

## 快速开始

```bash
# 1. 初始化项目
chimera init                        # minimal 模式
chimera init --preset web-app       # 预配置模式

# 2. 查看状态
chimera status

# 3. 按需启用能力
chimera enable constitution         # 开启宪法约束
chimera enable tdd                  # 开启 TDD 强制
chimera enable knowledge            # 开启知识管理

# 4. 开始开发
# 在 Claude Code 中说 "我要做一个用户认证功能"
# Chimera 自动引导: spec → plan → tasks → implement → review → finish
```

## 工作流程

```
用户描述需求
     │
     ▼
┌─────────────────────────────────────────────────┐
│  Chimera State Machine                          │
│                                                 │
│  idle → spec → plan → tasks → workspace         │
│                                    │            │
│              implement ← ──────────┘            │
│                 │  (TDD: red→green→refactor)    │
│                 │  (Multi-Agent parallel)       │
│                 ▼                               │
│              review → finish → archive          │
└─────────────────────────────────────────────────┘
     │
     ▼
产出: 通过测试的代码 + PR/Merge
```

## 目录结构

初始化后项目中出现：

```
.chimera/
├── state.json            # 项目状态（feature 级）
├── state-machine.yaml    # 状态转换规则（可自定义）
├── config.yaml           # 框架配置
├── constitution.md       # 宪法规则（MUST/SHOULD/MAY）
├── knowledge/
│   ├── business.md       # 业务知识（spec/plan 阶段加载）
│   └── conventions.md    # 代码规范（implement 阶段加载）
├── hooks/                # Claude Code hooks
├── cache/                # CCR 压缩缓存
└── archive/              # 知识归档
    ├── blocks/           # 结构化知识块
    └── index.yaml        # 索引
```

## Preset 对比

| | minimal | web-app | cli-tool | library |
|---|---------|---------|----------|---------|
| 状态机 | ✓ | ✓ | ✓ | ✓ |
| 宪法 | - | REST/覆盖率 80% | IO 契约/100% | 零依赖/semver |
| TDD | - | ✓ | ✓ | ✓ |
| 知识 | - | ✓ | ✓ | ✓ |
| 压缩 | ✓ | ✓ | ✓ | ✓ |

## 命令参考

```bash
chimera init [--preset <name>] [--force] [--skip-hooks]
chimera status [--json]
chimera transition <phase> [--feature <id>]
chimera enable <capability>
chimera finish [--action merge|pr|keep|discard]
chimera knowledge check
chimera knowledge read <id>
chimera knowledge archive <feature-id>
```

## 设计哲学

1. **状态驱动 > 意图猜测**：状态机是唯一权威
2. **机制强制 > AI 自律**：hooks 阻断而非 prompt 建议
3. **渐进暴露 > 一次过载**：minimal 入门，按需启用
4. **零依赖 > 功能堆砌**：纯文件 + Shell + Markdown
5. **团队继承 > 个人配置**：`.chimera/` 纳入 git

## 与其他工具的关系

| 来源 | 迁移的能力 | Chimera 中的形态 |
|------|-----------|-----------------|
| Superpowers | Skill 触发 + 工作流 | 阶段感知 Skill + 多 Agent |
| Spec-Kit | Specify→Plan→Tasks | 状态机前三阶段 |
| Spec-Kit | Constitution | Hooks 硬性执行 |
| OpenSpec | 知识归档 | 块级结构化 + 过期管理 |
| Headroom | ContentRouter + CCR | 内建轻量压缩 |

## License

MIT
