# 模型分层与成本路由

版本：v1.0  
更新日期：2026-08-05

---

## 1. 基本思想

廉价、开源或本地模型可以承担大量编码工作，但不应自动获得产品定义、架构决策和最终验收权。

更可靠的模式是：

```text
高能力模型定义任务和验收条件
→ 低成本模型在明确边界内执行
→ 自动检查提供机械证据
→ 独立高能力模型审查
→ Owner 最终验收
```

这不是“强模型监督弱模型”这么简单，而是把不同类型的认知工作分配给不同成本和可靠性的模型。

---

## 2. 四种角色

### Planner / Architect

负责：

- 收敛需求；
- 比较技术路线；
- 识别高代价决定；
- 写或审 spec；
- 定义 acceptance criteria；
- 拆分 task；
- 设定 scope、non-goals 和 stop conditions；
- 判断任务风险等级。

### Worker / Implementer

负责：

- 按 task packet 修改代码；
- 编写或补充测试；
- 运行机械反馈循环；
- 根据 review findings 定点修复；
- 更新明确要求的文档和 task state；
- 创建 checkpoint 或 delivery commit。

### Reviewer

负责独立检查：

- 是否满足 spec；
- 是否 scope creep；
- 是否存在安全、并发、数据、兼容性和运维问题；
- 测试是否真正覆盖故障；
- 文档与实现是否一致；
- 仍需什么人工验证。

### Verifier

负责：

- test / lint / typecheck / build；
- 浏览器或设备验证；
- benchmark / backtest；
- 收集真实输出；
- 证明而不是推断结果。

Verifier 可以是脚本、CI、浏览器自动化或专门 Agent。机械检查优先于模型判断。

---

## 3. 最适合低成本模型的任务

共同特征：

```text
边界清晰
+ 仓库已有模式
+ 可自动验证
+ 失败易定位
+ 易回滚
+ 不涉及高风险权限或生产数据
```

典型任务：

- 常规 CRUD；
- 既有组件模式下的 UI；
- API client 和数据转换；
- 根据失败测试修复局部 bug；
- 单元测试生成；
- 类型、lint 和明确 build error；
- 机械迁移和重复性重构；
- 按明确 review findings 修改；
- 文档格式和索引维护；
- 简单脚本。

廉价模型的价值不只在首轮成功率，也在于可以低成本完成更多次“实现 → 运行 → 读错误 → 修复”的循环。

---

## 4. 不适合低成本模型独立负责的任务

### 架构首创

- 新认证体系；
- 多租户权限模型；
- offline-first sync；
- 冲突解决；
- 新插件体系；
- 跨服务事务。

### 高风险数据与外部状态

- production migration；
- 数据回填；
- schema rebuild；
- 永久删除；
- 支付、计费和资金状态；
- 不可逆第三方副作用。

### 安全边界

- authorization；
- tenant isolation；
- secret handling；
- webhook validation；
- XSS / CSRF / SSRF；
- 文件上传和权限。

### 无清晰评分器的任务

- “整体优化项目”；
- “让 UX 更高级”；
- “重构前端架构”；
- “提高代码质量”；
- 长期维护性判断。

这些任务首先需要规格、架构或视觉决策，而不是直接执行。

---

## 5. 三档路由

### Tier 1：低风险执行

条件：

- 修改范围小；
- acceptance criteria 清楚；
- 有现成模式；
- 有自动检查；
- 可轻易 revert；
- 不涉及核心架构、安全和不可逆数据。

```yaml
planning: lightweight_or_existing_spec
execution: low_cost
review: mechanical_or_sampled_frontier
```

### Tier 2：强规划、廉价执行、强审查

适合中等复杂度任务：

```yaml
planning: frontier
execution: low_cost
review: independent_frontier
verification: mechanical
```

这是 DeepSeek 等廉价模型最有价值的区域。

### Tier 3：强模型端到端

适合：

- 核心架构；
- 安全；
- 权限；
- migration；
- 高耦合状态模型；
- 难以自动验收的体验问题。

```yaml
planning: frontier
execution: frontier
review: separate_frontier
verification: mechanical_plus_human
```

---

## 6. 高质量 Task Packet 是路由前提

不要把一句“实现搜索功能”交给 Worker。

推荐结构：

```markdown
## Objective
Prevent stale search responses from replacing newer results.

## Authorized scope
- `src/features/search/use-search.ts`
- Adjacent regression tests
- Relevant spec only

## Must preserve
- Existing API contract
- Existing debounce behavior
- Existing pagination behavior

## Acceptance criteria
1. A response from request A cannot replace request B when B started later.
2. Clearing the query prevents old responses from restoring prior results.
3. Existing pagination remains unchanged.
4. A regression test fails before the fix and passes after it.

## Verification
- Targeted tests
- Typecheck
- Final diff review

## Prohibited
- No API redesign
- No styling changes
- No new state-management dependency
```

任务越可观察、边界越清楚，低成本模型越安全。

---

## 7. Review 必须独立读取原始证据

Reviewer 不应只看 Worker 的总结。至少读取：

- spec；
- task packet；
- final diff；
- 相关完整文件；
- tests；
- actual command output。

结构化 review：

```markdown
## Decision
Changes requested

## Critical
- ...

## Major
- ...

## Minor
- ...

## Required changes
1. ...
```

然后把 findings 交回 Worker 定点修复。修复后重新运行机械验证，再由 Reviewer 复审关键项。

---

## 8. 避免协调成本吞掉模型成本

多模型流水线并不总是更便宜。

### 小任务

让一个可靠模型直接完成，交接成本可能高于节省的执行 token。

### 中等、规则明确的任务

最适合：

```text
frontier planning
→ low-cost implementation
→ frontier review
```

### 大型复杂任务

先拆成多个可独立验收的小任务，再分别路由。

### 高风险任务

直接让强模型实现，并让另一个强模型独立审查。

---

## 9. 不要把具体模型永久写死在项目规则中

项目级 `AGENTS.md` 应写角色和风险，不应写：

```text
Claude 规划
DeepSeek 编码
GPT 审查
```

模型能力、价格和 harness 集成会快速变化。

可以在个人配置中维护当前绑定：

```yaml
roles:
  planner:
    model: <current-frontier-model>
  worker:
    model: <current-low-cost-model>
  reviewer:
    model: <independent-review-model>
```

在流程未稳定前，手动路由通常优于自建 router。

---

## 10. 用项目实测建立 Routing Policy

公开 benchmark 不能完全预测你的仓库结果。应记录：

```yaml
model: <model>
task_type: local-feature
risk_tier: 2
first_pass_accepted: false
review_findings:
  critical: 0
  major: 2
  minor: 3
human_rework_minutes: 18
tests_passed: true
scope_violation: false
estimated_cost: 0.42
```

积累 20～30 个任务后分析：

- 哪些 task type 首轮成功率高；
- 哪些模型容易 scope creep；
- review 后平均返工多少；
- 总成本是否低于强模型直接完成；
- 哪些错误最常见；
- 哪些任务需要升级风险等级。

这会形成你自己的仓库级经验，而不是依赖通用排行榜。

---

## 11. 最小安全协议

低成本 Worker 至少应满足：

- 只能在授权 branch/worktree 工作；
- 读取 spec 和 task packet；
- 不得扩大 scope；
- 不得执行 production / destructive action；
- 必须运行指定 verification；
- 必须提交原始 diff 和真实输出供独立 review；
- 只能把任务推进到 `in_review`；
- review findings 未关闭前不得声明完成。

---

## 结语

最合理的模型路由不是按“思考”和“写代码”一刀切，而是按风险、可验证性和隐含判断量分配。

高能力模型掌握问题定义、架构边界和验收权；低成本模型承担可约束、可验证、可回滚的执行；自动检查负责机械事实；人保留最终产品签收权。
