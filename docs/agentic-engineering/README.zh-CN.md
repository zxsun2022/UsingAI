# Agentic Engineering：AI Coding 最佳实践

> 面向独立开发者和小型产品团队的一套文档控制、任务授权、模型分工、Git 协作与交付闭环方法。

版本：v1.0  
更新日期：2026-08-05

---

## 核心判断

AI Coding 降低了代码生产成本，但没有自动解决以下问题：

- 人的模糊意图如何变成可验收行为；
- 多个 Agent、多个工具和多台设备如何共享可靠状态；
- 代码、任务、文档、版本和 Git 历史如何保持一致；
- 廉价模型怎样被安全地用于生产工作；
- Agent 的“完成”声明如何转化为真实证据；
- 长程开发如何避免范围漂移、上下文衰减和文档腐烂。

因此，这套方法把软件开发理解为一个受文档控制、由证据验收的交付系统：

```text
人的意图、优先级与验收权
→ 规格和任务授权
→ Agent 在隔离工作区执行
→ 自动检查和独立审查
→ 文档、版本、任务与 Git 状态闭环
→ 人工签收
```

这里最重要的分工不是“人写文档、AI 写代码”，而是：

> **人拥有意图、取舍、优先级和最终验收权；AI 负责结构化、实现、验证和生成交付证据。**

---

## 文档地图

### 1. [Day-0 Kit：项目启动与协作方法](./day-0-kit.zh-CN.md)

适合项目启动或从 Prototype 升级到 Production 时使用。覆盖：

- 项目模式；
- 产品、风险和运行契约；
- Definition of Ready；
- 最薄端到端切片；
- 任务模式与任务包；
- 可靠性不变量；
- 验收、停止和复盘。

### 2. [文档控制面与权威来源](./documentation-control-plane.zh-CN.md)

解释怎样把仓库变成跨 Claude Code、Codex、OpenCode 和未来 Agent 共享的长期知识系统。覆盖：

- `AGENTS.md` 的边界；
- contract、ADR、spec、ops、derived、task state 的职责；
- 规格、施工计划、roadmap 和任务状态的分离；
- 文档腐烂与生成式文档；
- Owner-only acceptance。

### 3. [多 Agent、Worktree 与多设备 Git 工作流](./multi-agent-git-workflow.zh-CN.md)

解释并行开发和设备切换时如何保持可审计状态。覆盖：

- 一个 Agent 一个 worktree；
- checkpoint commit 与 delivery commit；
- 主分支、短命分支和 squash；
- session handoff；
- 多 Agent 的分解、竞争和接力模式。

### 4. [模型分层与成本路由](./model-routing.zh-CN.md)

说明如何让高能力模型掌握规划和验收，让廉价模型承担边界清晰的实现工作。覆盖：

- Planner / Worker / Reviewer / Verifier；
- 风险分级；
- 适合与不适合廉价模型的任务；
- 独立 review；
- 如何用项目实测建立自己的 routing policy。

### 5. [Change Closure：任务完成与提交闭环](./change-closure-protocol.zh-CN.md)

定义每次可交付变更必须如何闭合。覆盖：

- 代码、文档、任务、版本、验证和 Git 的一致性；
- Task Completion Gate；
- 文档影响分类；
- 版本号语义；
- PR 模板；
- hooks、CI 和 `change:check`。

### 6. [已有项目的文档结构迁移](./existing-project-migration.zh-CN.md)

给已有仓库使用的迁移方法和可复制指令。目标是在不改变产品行为的前提下：

- 审计现有文档；
- 建立权威来源；
- 缩短 `AGENTS.md`；
- 分离长期文档、临时计划和任务状态；
- 保留可追溯性。

---

## 推荐阅读顺序

### 新项目

```text
Day-0 Kit
→ 文档控制面
→ 生成项目级 AGENTS.md
→ Git 工作流
→ Change Closure
→ 按风险选择模型路由
```

### 已有项目

```text
已有项目迁移
→ 文档控制面
→ Change Closure
→ Git 工作流
→ 模型路由
```

### 单个复杂功能

```text
产品讨论
→ durable spec
→ task packet
→ isolated worktree
→ implementation
→ mechanical verification
→ independent review
→ delivery gate
→ owner acceptance
```

---

## 最小落地版本

不要一次建设完整的 Agent 平台。一个项目只要先做到以下六点，就已经建立了可靠基础：

1. 有一份短而明确的项目级 `AGENTS.md`；
2. 有可观察的验收标准；
3. 一个并行任务使用一个 branch 和一个 worktree；
4. Agent 用真实命令输出证明结果；
5. 每个可交付 change set 同步代码、文档、任务状态和版本；
6. Agent 只能推进到 `in_review`，由 Owner 或指定 Reviewer 签收。

只有在真实摩擦出现后，再考虑任务图、自动路由、生成式看板或更复杂的编排系统。

---

## 配套模板

- [`templates/AGENTS.md`](../../templates/AGENTS.md)：项目级 Agent 执行契约模板。
- 本目录各篇章中的代码块：任务包、完成门禁、PR 模板、路由记录和迁移指令。

---

## 总原则

- 文档记录意图、决定、约束和验收条件，不手工复制可生成事实；
- 任务状态、产品规格和战略 roadmap 不共用一个模糊 Markdown 列表；
- Git 保存精确代码状态，版本号表示可交付产品状态；
- 模型自信不是证据，测试通过也不自动等于产品验收；
- 能机械强制的规则，不长期依赖 Agent “记得”；
- 自动化只能在明确授权、有限范围和可验收目标内推进；
- 最终的 `done`、`accepted` 和 `released` 属于人类授权事件。
