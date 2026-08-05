# 多 Agent、Worktree 与多设备 Git 工作流

版本：v1.0  
更新日期：2026-08-05

---

## 1. Git 是跨 Agent 的持久状态层

Claude Code、Codex、OpenCode 和其他 harness 可以维护 session 内状态，但跨 vendor、跨设备、跨会话的可靠交接仍应落到仓库：

```text
Spec / task authorization
→ branch
→ worktree
→ commits
→ verification evidence
→ review
→ merge
```

聊天记录和 Agent memory 可以帮助当前会话，但不应成为下一个 Agent 的唯一上下文。

---

## 2. 基本单位：一个独立任务，一个 branch，一个 worktree

推荐默认：

```text
1 independent task
= 1 short-lived branch
= 1 isolated worktree
= 1 owning writable agent/session
```

示例：

```text
main repository:
~/code/vanmemo

worktrees:
~/code/worktrees/vanmemo-F014
~/code/worktrees/vanmemo-B103
```

分支命名：

```text
feature/F-014-anonymous-capture
fix/B-103-stale-search
chore/T-081-upgrade-dependency
docs/D-021-deployment-guide
```

不要让两个 Agent 同时写同一个 worktree。它会破坏文件所有权、diff 解释、commit 边界和回滚能力。

---

## 3. 什么时候必须使用 worktree

适合强制 worktree 的任务：

- 并行开发；
- 多文件 feature；
- 架构实验；
- dependency upgrade；
- database / schema change；
- 替代实现比较；
- 预计跨多个 commit 或 session；
- 需要独立 review 或验证环境。

可以直接使用干净当前工作区的情况：

- 只读分析；
- 小型文档修改；
- 单一、可逆、不会并行的微小改动；
- 临时诊断且不会保留修改。

Worktree 不要放进 Dropbox、OneDrive、iCloud Drive 等文件同步目录。跨设备同步依赖 Git remote，而不是文件系统同步。

---

## 4. 主分支的角色

`main` 或默认分支应当：

- 可构建；
- 核心检查通过；
- 不包含半成品；
- 文档、版本和代码状态一致；
- 可随时作为新 worktree 的基础。

主仓库更适合：

- 阅读文档；
- 规划；
- 创建 worktree；
- 审查 diff；
- 执行最终集成检查；
- merge。

Agent 不应在主分支上进行长期、多轮、易失败的施工。

---

## 5. Checkpoint commit 与 Delivery commit

### Checkpoint commit

服务于分支内施工：

- 恢复上下文；
- 多设备交接；
- 独立 review；
- 局部回滚；
- 保存阶段性成果。

示例：

```text
test(search): reproduce stale response overwrite
fix(search): gate response and cache updates
docs(search): clarify request ordering contract
```

Checkpoint 不自动代表可交付版本，也不一定需要 bump 产品版本。

### Delivery commit / squash merge

服务于进入主分支的完整 change set：

- 对应明确 task/change ID；
- 满足 acceptance criteria；
- 文档和 task state 已同步；
- deployable change 已 bump version；
- verification gate 通过；
- 已准备进入 `in_review` 或 merge。

推荐原则：

```text
branch 内 commit 细，便于 Agent 工作和回滚；
main 上 change 粗，便于人和下一 session 理解。
```

可以通过 squash merge 调和两种需求。

---

## 6. Commit 粒度

不要按时间或文件保存次数提交，而要按语义边界提交。

一个好 commit 应当：

- 有单一可解释意图；
- diff 可独立审查；
- 不混入无关改动；
- 能被安全 revert；
- message 说明改变了什么。

避免：

```text
WIP
fix
fix again
final
really final
```

也避免把测试、实现、文档和不相关重构一次性塞进巨大 commit。

---

## 7. 多设备 handoff

多设备场景中，remote 才是另一台机器可见的共享边界。

推荐 session 收尾：

1. 到达一个语义完整的 checkpoint；
2. 更新 task state；
3. review `git diff`；
4. 创建 descriptive checkpoint commit；
5. push 当前 task branch（仅当项目 policy 允许）；
6. 报告 branch、commit、working-tree state 和未完成项。

下一设备开始：

```bash
git fetch
git switch main
git pull --ff-only
git worktree add <path> <existing-task-branch>
```

同一个 branch 同一时间只应由一个设备拥有写权限。

---

## 8. 多 Agent 协作的三种模式

### A. 分解并行

```text
Agent A → API / storage
Agent B → frontend
Agent C → tests / review
```

只有在文件和契约边界清楚时使用。共享接口必须先确定。

### B. 竞争并行

```text
Agent A → proposal A
Agent B → proposal B
```

适合架构、UI、算法或性能方案不确定时。最后选择一个方案，不直接把两个实验性实现拼接。

### C. 顺序接力

```text
Planner
→ Implementer
→ Reviewer
→ Verifier
→ Owner acceptance
```

这是生产项目最稳健的默认方式。

推荐优先顺序：

```text
顺序接力 > 边界清晰的分解并行 > 竞争并行
```

不要为了“使用多个 Agent”而制造并发。

---

## 9. Review Agent 的工作方式

Reviewer 不应只阅读 Implementer 的总结。至少读取：

- 原始 spec；
- task packet；
- final diff；
- 相关完整文件；
- 新增或修改的 tests；
- actual verification output。

Review 应检查：

- acceptance criteria 是否逐条满足；
- 是否 scope creep；
- 是否弱化校验或测试；
- 是否引入并发、权限、数据或兼容性问题；
- docs 和 task state 是否同步；
- rollback 是否可信；
- 哪些行为仍需人工体验。

---

## 10. 冲突与集成

默认串行 merge。每次 merge 前：

1. fetch 最新主分支；
2. 评估是否需要 rebase/merge；
3. 由有权限的人处理冲突；
4. 再次执行集成级 verification；
5. 确认文档、版本和 task state 没有被另一个 merge 破坏。

Agent 不应擅自 force-push、重写共享历史或自动解决涉及产品语义的冲突。

---

## 11. Session Handoff 模板

```markdown
## Session handoff

- Task:
- Branch:
- Worktree:
- Last commit:
- Push status:
- Current state:
- Acceptance criteria completed:
- Remaining work:
- Known failures or blocked decisions:
- Verification already run:
- Files with intentional uncommitted changes:
- Recommended next action:
```

Handoff 的目标不是保存全部对话，而是让新 Agent 能从确定事实继续。

---

## 12. 最小 Git 协议

一个项目至少应明确：

- default branch；
- branch 命名；
- 哪些任务必须 worktree；
- commit policy；
- 是否允许 Agent push；
- multi-device handoff policy；
- merge / squash policy；
- 谁能 rebase、force-push 和 delete branch；
- deployable change 的 versioning policy；
- task completion gate。

---

## 结语

多 Agent 工程的核心不是同时启动更多模型，而是让每一个执行单元拥有清楚的边界和可恢复状态。

Git 提供了精确状态、历史和回滚；worktree 提供了隔离；spec 和 task packet 提供了意图与授权；review 和 verification 提供了验收证据。只有这些层对齐，并行才会提升产出，而不是放大混乱。
