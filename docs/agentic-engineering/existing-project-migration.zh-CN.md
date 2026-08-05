# 已有项目的 Agentic Engineering 文档迁移

版本：v1.0  
更新日期：2026-08-05

---

## 1. 迁移目标

已有项目通常已经存在：

- 过长的 `AGENTS.md`；
- `CLAUDE.md`、`AGENTS.md` 和 README 中重复的规则；
- 同时承担想法、任务和进度的 `roadmap.md` / `TODOS.md`；
- 手写且容易过期的 route、schema、command 和 env 列表；
- 产品约束、架构事实、运维程序混在同一文件；
- Agent 可以自行把任务标成 Done；
- 代码变更后文档、版本和任务状态不同步。

迁移目标不是建立更复杂的文档系统，而是：

> 在不改变产品行为的前提下，明确每类信息的权威来源，并建立可重复的交付闭环。

---

## 2. 迁移原则

- 先审计，后移动；
- 第一轮不静默删除历史信息；
- 优先保留更安全的规则；
- 不凭空补写不存在的产品意图；
- 不把代码当前行为误写成产品原始意图；
- 能从代码确定性生成的事实不继续手工维护；
- 不自动安装 Beads、Linear 或新任务服务；
- 不因文档迁移顺手实现 TODO 或重构产品代码；
- 用 `git mv` 保留历史；
- 每一步可通过 Git revert 撤销。

---

## 3. 审计分类

把每个重要文档或段落分类为：

1. **Contract**：产品目的、原则、非目标、不变量；
2. **Decision**：已接受的产品或架构取舍；
3. **Specification**：功能行为和验收条件；
4. **Operations**：部署、migration、secret、恢复；
5. **Derived fact**：可从代码或配置生成的事实；
6. **Task state**：优先级、依赖、进度、review；
7. **Exploration**：想法、研究、未决方案；
8. **Historical**：已被取代但需要保留的背景。

同时识别：

- 重复规则；
- 相互冲突的权威来源；
- stale facts；
- 缺失 acceptance criteria；
- prose 中可以机械执行的规则；
- 移动后会断开的链接；
- 无法可靠分类的内容。

建议建立：

```text
docs/documentation-audit.md
```

包含迁移表：

| Original location | Original responsibility | New location | Action | Notes |
|---|---|---|---|---|

---

## 4. 推荐目标结构

仅创建实际需要的目录和文件：

```text
AGENTS.md
CLAUDE.md
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

职责详见：[文档控制面](./documentation-control-plane.zh-CN.md)。

---

## 5. 迁移步骤

### Phase 1：建立文档地图

先创建 `docs/README.md`，明确：

- 每类 truth 的权威来源；
- 冲突时的优先级；
- 谁负责写、谁负责批准；
- 哪些是 generated；
- 不同任务应读取哪些文档；
- 当前 task source of truth。

### Phase 2：拆出长期意图

从旧 `AGENTS.md`、README 和 roadmap 中提取：

- 产品目的和核心循环；
- 非目标；
- 产品与工程不变量；
- 不可逆操作的人类闸门。

只迁移有证据支持的内容。模糊处记录为 unresolved。

### Phase 3：恢复决策边界

把高代价、已经接受的取舍写为 ADR。

不要把每个小选择升级为 ADR：

- 小型可逆决定 → commit message；
- 中型决定 → decision log；
- 高代价长期决定 → ADR。

### Phase 4：建立 durable specs

对重要 feature 建立 spec：

- problem；
- user outcome；
- scope；
- non-goals；
- acceptance criteria；
- edge cases；
- verification；
- rollback。

不要为历史小修机械补齐大量假验收条件；缺失时明确记录。

### Phase 5：移出易腐烂事实

检查 route、schema、command、env、migration 和 package map。

如果可确定性生成：

- 写低成本 generator；
- 输出到 `docs/derived/`；
- 标记 generated；
- 加 `docs:generate` 和 `docs:check`；
- CI 检查 drift。

如果暂时不值得自动化，优先链接真实 source，而不是复制一份散文。

### Phase 6：缩短 `AGENTS.md`

保留：

- mission；
- sources of truth；
- required reading；
- scope / authorization；
- task state 权限；
- Git / worktree；
- verification；
- human gates；
- completion gate；
- repo map。

移出百科式内容。`CLAUDE.md` 等工具文件尽量只引用 `AGENTS.md`。

### Phase 7：澄清 roadmap、TODO 和 task state

不要让一个 Markdown 同时承担探索、队列和报告。

如果已有 GitHub Issues、Linear、Beads 等 task system：

- 文档中声明它是状态真源；
- roadmap 只做战略视图；
- 不重复维护实时状态。

如果没有：

- 暂时保留最简单机制；
- 明确哪个文件拥有优先级和状态；
- Agent 最多推进到 `in_review`；
- 不自动安装新系统。

### Phase 8：加入 Change Closure

把 [Task Completion Gate](./change-closure-protocol.zh-CN.md) 加入项目 `AGENTS.md`，并按项目补齐：

- versioning policy；
- docs generation command；
- verification command；
- task source；
- push policy；
- rollback policy。

### Phase 9：机械 enforcement

优先复用现有 CI / hooks，加入真正高价值的检查：

- docs drift；
- broken links；
- version consistency；
- lint / type / tests / build；
- generated file direct edit；
- secret scanning。

不要创建会自动 commit、push、deploy 或修改 production 的 hook。

### Phase 10：验证与归档

- 搜索旧路径引用；
- 检查 Markdown links；
- review semantic diff；
- 确认无产品行为变化；
- 标记 archive 为 historical；
- 保留迁移表；
- 用一个或多个 coherent commits 提交。

---

## 6. 可直接交给 Coding Agent 的迁移指令

```markdown
I want to restructure this repository into a documentation-controlled,
multi-agent development workflow.

This is a documentation and workflow migration task. It is not authorization
to change product behavior, implement deferred features, reprioritize work,
or perform unrelated code cleanup.

Objectives:
1. Separate product contract, decisions, feature specifications, operations,
   generated facts, task state, exploration, and history.
2. Reduce AGENTS.md to a concise project operating contract.
3. Make repository state sufficient for Claude Code, Codex, OpenCode, and
   future agents to resume work without chat history.
4. Generate deterministic facts instead of duplicating them manually.
5. Separate implementation authorization, task progress, roadmap views, and
   product acceptance.
6. Preserve traceability and existing knowledge.

Constraints:
- Do not change externally observable behavior.
- Do not implement TODOs or roadmap items.
- Do not silently delete historical information.
- Do not install a new task tracker or coordination service without approval.
- Do not rewrite accepted decision history.
- Prefer git mv and small semantic diffs.
- Ask only for irreversible, destructive, dependency-installing, or
  task-source-of-truth decisions. Otherwise make reversible choices and
  document them.

Process:
1. Audit all agent instructions, docs, task files, scripts, CI, schemas,
   routes, environment declarations, and recent Git history.
2. Create docs/documentation-audit.md with classification, conflicts, stale
   facts, missing acceptance criteria, and a migration table.
3. Create or revise docs/README.md with the authority model.
4. Adapt this structure without creating empty placeholders:
   docs/contract, docs/decisions, docs/specs, docs/ops, docs/derived,
   docs/archive.
5. Move stable intent, decisions, specs, and operations into their proper
   locations. Record ambiguity instead of inventing intent.
6. Reduce AGENTS.md while preserving project-specific safety, data integrity,
   versioning, testing, compatibility, and human-gate constraints.
7. Reduce tool-specific instruction files to references to AGENTS.md unless
   a genuine tool-specific rule is required.
8. Reuse or add deterministic generation only when low-maintenance and useful.
9. Clarify the current task source of truth. Agents may set in_progress,
   blocked, or in_review; only the owner or designated reviewer may set done,
   accepted, or released.
10. Add a completion gate covering scope, docs, versioning, verification,
    commit, post-commit status, external state, and rollback.
11. Validate links, generated docs, repository checks, and absence of product
    behavior changes.
12. Commit the migration in coherent semantic commits; do not push unless
    repository policy authorizes it.

Final report:
- authority model;
- migration map;
- AGENTS.md changes and final size;
- generated docs and commands;
- task-state decision;
- verification with actual output;
- branch, commits, push status;
- unresolved owner decisions;
- rollback.
```

---

## 7. 迁移完成标准

- `AGENTS.md` 主要是执行契约，不再是百科；
- `docs/README.md` 清楚说明权威来源；
- intent、decision、behavior、planning 和 delivery truth 分离；
- 重要 feature 有可观察验收条件；
- 易过期事实已生成或指向真实 source；
- roadmap / TODO 的权限和角色清楚；
- Agent 不能自行写 `done`；
- completion gate 已覆盖 docs、version、verification 和 Git；
- 没有显著文档内容被静默丢弃；
- 没有产品行为变化；
- 迁移可通过 Git revert 撤销。

---

## 8. 两周证伪测试

迁移后不要继续无限优化文档结构。运行两周并检查：

- 是否减少过至少一次返工；
- 新 Agent 是否更快恢复上下文；
- 文档和代码 drift 是否减少；
- completion gate 是否捕获过遗漏；
- 管理成本是否高于收益；
- task tracker 是否真的需要升级。

如果没有产生可观察收益，应删除多余层次，而不是继续建设基础设施。

---

## 结语

已有项目迁移的重点不是把文件移动到更漂亮的目录，而是恢复权威边界：谁定义意图、谁授权实施、谁记录当前行为、谁维护任务状态，以及谁拥有最终签收权。
