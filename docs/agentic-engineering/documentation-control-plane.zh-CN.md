# 文档控制面：让仓库成为跨 Agent 的长期记忆

版本：v1.0  
更新日期：2026-08-05

---

## 1. 为什么需要文档控制面

当 Claude Code、Codex、OpenCode、DeepSeek 等工具在不同 session、不同设备和不同 worktree 中协作时，聊天记录不能成为项目的权威状态。

真正需要跨工具保存的是：

- 产品为什么存在；
- 哪些行为已经被批准；
- 哪些边界不可违反；
- 为什么采用当前架构；
- 当前任务获得了什么授权；
- 哪些事实可以从代码推导；
- 本次交付如何被验证和签收。

因此，仓库不只是代码容器，也是 Agent 的共享控制面。

> 文档不是为了完整描述一切，而是为了保存代码无法可靠表达的意图、决定、边界和验收条件。

---

## 2. 不要让一份 Markdown 同时承担三种角色

常见失败模式是让 `roadmap.md` 或 `TODOS.md` 同时承担：

1. 想法和讨论稿；
2. Agent 的执行队列；
3. 人类查看进度的报告。

三者需要的结构不同：

- 讨论稿需要宽松、允许分叉；
- 执行队列需要状态、依赖、授权和原子更新；
- 进度视图需要简洁、可扫描。

应当分离：

```text
探索与想法       → notes / research / exploration
产品行为         → specs
架构取舍         → decisions / ADR
执行状态         → task source of truth
人类进度视图     → roadmap / board projection
交付记录         → PR + commit + verification evidence
```

Roadmap 可以保留 `Now / Next / Later / Done`，但它应是战略视图或只读投影，不应同时成为依赖图和授权系统。

---

## 3. 按责任和腐烂速率分层

推荐结构：

```text
AGENTS.md
README.md

docs/
  README.md
  contract/
  decisions/
  specs/
  ops/
  derived/
  archive/

plans/
  active/
  archive/
```

### `AGENTS.md`

只保存项目级执行契约：

- 权威来源；
- 授权与范围；
- Git / worktree 纪律；
- 验证要求；
- 人工闸门；
- 完成门禁；
- 文档索引。

它不应成为完整项目百科。

### `docs/contract/`

保存变化慢、由人负责的内容：

- 产品目的；
- 核心循环；
- 产品原则；
- 非目标；
- 产品和工程不变量。

### `docs/decisions/`

保存已经接受的高代价决定：

- 背景；
- 决定；
- 替代方案；
- 后果；
- 重新评估条件。

ADR 应 append-only。新决定可以 supersede 旧决定，但不要重写历史。

### `docs/specs/`

保存功能的 durable contract：

- 问题；
- 用户结果；
- scope；
- non-goals；
- 可观察的验收条件；
- 边界与失败状态；
- 验证和回滚。

Spec 描述“应该实现什么”，不是“Agent 下一步修改哪些文件”。

### `docs/ops/`

保存需要人工判断的运行程序：

- 部署；
- migration；
- 密钥；
- 备份与恢复；
- incident response；
- rollback。

### `docs/derived/`

只保存从代码或配置确定性生成的事实：

- 命令列表；
- route / endpoint inventory；
- schema summary；
- environment variable inventory；
- package map；
- migration inventory。

生成必须确定性、可重复、不依赖 LLM、不包含 secret。

### `plans/`

保存临时施工计划：

- 拟修改范围；
- 实施顺序；
- 临时假设；
- 当前 checkpoint；
- 下一 session 起点。

纯施工计划完成后可以删除或归档，但必须先把长期知识提炼到 spec、ADR、ops 或测试中。

---

## 4. 五类 truth 必须区分

| 问题 | 权威来源 |
|---|---|
| 产品为什么这样做 | contract / approved spec |
| 架构为什么这样选 | accepted ADR |
| 当前代码实际上怎样运行 | code / tests / schema / config |
| 当前优先级和任务状态 | authorized task system |
| 本次交付是否成立 | Git + verification evidence + reviewer acceptance |

可以概括为：

```text
Intent truth    → contract / spec
Decision truth  → ADR
Behavior truth  → executable repository
Planning truth  → task system
Delivery truth  → commit / PR / evidence
```

“代码是真相”只适用于当前行为，不适用于产品意图。代码可能准确实现了一个已经过时的需求。

---

## 5. `AGENTS.md` 的推荐边界

目标不是机械限制在 100 行，而是保证每次任务加载的内容都高价值。

应保留：

- 一句话项目目的；
- 文档权威顺序；
- 开工前读取规则；
- 不得擅自扩大 scope；
- task state 权限；
- worktree 与 commit 规则；
- verification；
- destructive action gate；
- task completion gate。

应移出：

- 完整 route 列表；
- 数据库每张表的当前字段；
- 详细 auth 流程；
- 长命令清单；
- 当前 feature inventory；
- 具体部署 walkthrough；
- 大量 deferred items；
- harness 已经默认具备的通用“如何思考”说明。

工具专属文件保持最小：

```markdown
# CLAUDE.md

Read and follow ./AGENTS.md.
```

不要复制维护两套规则。

---

## 6. Spec、Plan、Task 和 Commit 的区别

### Spec

回答：产品或系统应该表现成什么样。

### Plan

回答：这次施工准备怎样实现。

### Task

回答：当前 Agent 获得了什么执行授权，状态是什么。

### Commit

回答：仓库精确改变成了什么状态。

### Release version

回答：哪个可交付产品状态包含了这些变更。

因此：

```text
Spec ≠ task queue
Plan ≠ durable documentation
Task status ≠ product acceptance
Commit ≠ release version
```

---

## 7. 文档同步规则

任何 code change 都应做文档影响判断，但不是每次都强制修改文档。

建议分类：

- **Behavior**：用户可见行为、API contract、数据约束变化 → 更新 spec；
- **Decision**：产生新的高代价取舍 → 新 ADR；
- **Operations**：部署、migration、配置、恢复流程变化 → 更新 ops；
- **Derived facts**：从代码生成的事实变化 → 运行生成与 drift check；
- **Task state**：更新 authoritative task source；
- **No impact**：明确记录原因。

内部重构且无行为、契约、决策或运行变化时，不应为了“看起来同步”而制造无意义文档 diff。

---

## 8. 任务状态与签收权限

推荐状态：

```text
idea
→ specified
→ ready
→ in_progress
→ in_review
→ accepted
→ released
```

Agent 可以更新：

- `in_progress`；
- `blocked`；
- `in_review`。

只有 Owner 或指定 Reviewer 可以更新：

- `accepted`；
- `done`；
- `released`。

自动测试通过证明实现满足了已覆盖的检查，不代表产品已经被外部接受。

---

## 9. 什么时候需要结构化 task tracker

如果项目长期只有少量开放任务，一份结构清晰的 task 文件或 GitHub Issues 已经足够。

当出现以下情况时，才值得考虑 Beads、Linear 或其他结构化任务图：

- 开放任务长期超过约 20～30 个；
- 多 Agent 并行；
- 跨设备频繁切换；
- 依赖关系影响 ready queue；
- Markdown 冲突或全量重写频繁发生；
- 需要机器查询下一项无阻塞任务。

不要为了一个尚未出现的协调问题自建看板、锁系统或 Agent 调度平台。

---

## 10. 文档控制面的最小验收标准

一个仓库达到基本可用状态时，应满足：

- `AGENTS.md` 不再混合大量易过期事实；
- `docs/README.md` 明确每类 truth 的权威来源；
- 每个重要 feature 有可观察 acceptance criteria；
- roadmap、task state 和探索材料职责清楚；
- 可生成事实不再手工复制为权威文档；
- Agent 不能自行写 `done`；
- 交付时能说明哪些文档被更新，或为什么无影响；
- 新 session 可以仅靠仓库状态恢复工作。

---

## 结语

文档控制面的目标不是增加写作量，而是降低跨 session、跨模型和跨设备协作时的歧义。

最有效的文档不是最长的文档，而是：

- 权威范围清楚；
- 变化速率匹配；
- 能与代码和任务状态对齐；
- 能帮助 Agent 决定什么可以做、什么不能做、怎样算完成。
