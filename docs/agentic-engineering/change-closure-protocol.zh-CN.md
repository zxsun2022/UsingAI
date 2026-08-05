# Change Closure：任务完成与提交闭环

版本：v1.0  
更新日期：2026-08-05

---

## 1. 开发工作的原子单位是什么

开发工作的核心单位不是“修改了一次文件”，也不是“Agent 说完成了”，而是一个已经闭合的 change set：

```text
任务授权
+ 代码和测试
+ 文档影响
+ 任务状态
+ 版本状态
+ 验证证据
+ Git 记录
+ 人工签收
```

Commit 是这个 change set 的持久化凭证，但不是全部本身。

---

## 2. Commit、Change ID 与版本号

三个概念回答不同问题：

### Commit SHA

回答：仓库的精确状态是什么？

### Task / Change ID

回答：这次变化为什么存在，对应哪个需求或 Bug？

### Release version

回答：哪个可交付产品状态包含了这次变化？

推荐关系：

```text
一个 task/change
→ 一个或多个 branch checkpoint commits
→ 一个完整 delivery change set
→ 一次 version bump
```

不建议让每个临时 checkpoint 都 bump 产品版本，否则版本号只是 commit 计数器。

如果项目强制“一任务一 commit”，则必须同时保证该 commit 可部署、验证通过、文档同步且无 WIP 内容。

---

## 3. Task Completion Gate

以下段落适合直接加入项目级 `AGENTS.md`：

```markdown
## Task Completion Gate

Before the final response for any task that changed files, complete the following delivery gate.

1. **Review scope and repository state**
   - Inspect the current branch, `git status`, and the final diff.
   - Confirm that the diff contains only changes authorized by the current task.
   - Preserve and exclude unrelated, pre-existing, or concurrent user changes.

2. **Reconcile task and documentation impact**
   - User-visible or externally observable behavior → update the relevant specification.
   - A new or changed architectural/product decision → add a decision record.
   - Deployment, migration, configuration, recovery, or operational behavior → update the relevant operations document.
   - Code-derived repository facts → run the documented generation and drift-check commands for `docs/derived/`.
   - Task progress → update the authoritative task source without expanding scope.
   - If no documentation changes are required, report:
     `Docs impact: none — <specific reason>`.

3. **Reconcile versioning**
   - Determine whether the change is deployable under the repository’s versioning policy.
   - For every deployable change, update all canonical version locations exactly once before final verification.
   - Checkpoint, documentation-only, and test-only commits do not require a version bump unless the versioning policy explicitly says otherwise.

4. **Verify the changed surface**
   - Run the checks proportionate to the affected behavior and risk.
   - Report the commands executed and their actual results.
   - Do not claim that a check passed if it was not run successfully.
   - State explicitly anything that remains unverified.

5. **Create the delivery commit**
   - Create a scoped, descriptive commit unless the work is incomplete, blocked, read-only, or the user explicitly asked not to commit.
   - Stage only files or hunks belonging to the current task.
   - Do not push, amend, rebase, or rewrite history unless explicitly authorized.

6. **Inspect the post-commit state**
   - Confirm the final branch and commit hash.
   - Run `git status` again and report whether the working tree is clean.
   - Report push status accurately.
   - Identify remaining files or changes and explain why they were not committed.

7. **Respect acceptance authority**
   - An agent may mark implementation as `in_review`.
   - Do not mark any task or feature `done`, `accepted`, or `released` without explicit authorization from the owner or a designated reviewer.
   - Do not infer external acceptance from passing automated checks.

8. **Report rollback and residual risk**
   - For an ordinary code-only commit, provide the appropriate `git revert <commit>` command.
   - For migrations, configuration, infrastructure, or external-state changes, provide the actual recovery procedure and limitations.
   - Report unresolved risks, remaining work, and unverified behavior.

A task that changed files is not complete merely because the implementation was written. Code, task state, documentation, versioning, verification evidence, and Git state must agree before delivery.
```

---

## 4. 文档影响不应只是“检查过”

每次 deployable change 应明确分类：

```text
closes
advances
introduces
no impact
```

示例：

```yaml
task_impact:
  closes:
    - B-103
  advances:
    - F-014
  introduces: []

docs_impact:
  updated:
    - docs/specs/search.md
  no_impact_reason: null
```

无文档影响时：

```yaml
docs_impact:
  updated: []
  no_impact_reason: Internal refactor; no behavior or contract changed.
```

这比“Docs checked”更可审查。

---

## 5. 任务完成与产品签收分离

Agent 可以声明：

```text
implementation_complete
in_review
```

表示：

- 实现已写；
- 自动检查已运行；
- 文档和版本已同步；
- commit 已创建；
- 等待 review。

只有 Owner 或指定 Reviewer 可以声明：

```text
accepted
done
released
```

测试通过只证明已覆盖检查通过，不自动等于产品体验、业务意图或外部状态已被接受。

---

## 6. PR 模板

```markdown
## Change

- Task / issue:
- Intended outcome:
- Acceptance criteria addressed:
- Scope intentionally excluded:

## Completion

### Documentation impact

- [ ] Specification
- [ ] Decision record
- [ ] Operations documentation
- [ ] Generated documentation regenerated and checked
- [ ] Authoritative task state
- [ ] No documentation impact

Reason or documents changed:

### Versioning

- [ ] Version bump required and completed
- [ ] Version bump not required

Previous version:
New version:
Reason no bump was required:

### Verification

| Check | Command or procedure | Actual result |
|---|---|---|
| Tests |  |  |
| Lint / typecheck |  |  |
| Build |  |  |
| Manual verification |  |  |
| Other |  |  |

Anything not run or not verified:

### Repository state

- Branch:
- Commit(s):
- Working tree clean:
- Push status:
- Unrelated changes excluded:

### External state

- [ ] No external state changed
- [ ] Database or migration state changed
- [ ] Deployment or routing state changed
- [ ] Configuration or environment state changed
- [ ] Third-party or cloud resource state changed
- [ ] Other external state changed

Details, authorization, and evidence:

### Acceptance state

- [ ] Ready for review
- [ ] Blocked
- [ ] Owner or designated reviewer accepted the change
- [ ] Released

Reviewer / authorization reference:

### Remaining work and risks

- Remaining work:
- Known risks:
- Unverified behavior:
- Follow-up task references:

### Rollback

- Code rollback:
- Data / schema rollback or recovery:
- Configuration / infrastructure rollback:
- Known rollback limitations:
```

PR 模板强化协议，但不是协议的唯一载体；没有 PR 的个人项目仍应执行 `AGENTS.md` completion gate。

---

## 7. 语义规则与机械 Gate 分工

### 写在 `AGENTS.md`

需要模型理解的语义：

- 哪份文档权威；
- 哪个任务授权当前改动；
- 什么算外部行为；
- 什么变化需要 spec / ADR / ops；
- 谁能写 accepted；
- 哪些操作需要人工授权。

### 写在 hooks / scripts / CI

适合机械检查的内容：

- version 是否同步；
- task ID 是否存在；
- generated docs 是否 drift；
- Markdown links；
- lint / typecheck / test / build；
- deployable files 变化时是否 bump version；
- forbidden files / secrets；
- generated file 是否被直接编辑。

能被机械强制的，不要长期依赖 Agent 记忆。

---

## 8. 统一命令：`change:check`

推荐提供一个入口：

```bash
pnpm change:check
```

内部依次运行：

```text
version:check
task-state:check
docs:generate
docs:check
docs:links
lint
typecheck
test
build
```

按项目实际风险裁剪。不要为了形式每次运行无关、昂贵的全量检查。

可以进一步提供：

```bash
pnpm change:prepare --task B-103
```

它可以检查 branch、task、version 和生成文档，并给出建议 commit message；但不应自动：

- 标记 accepted / done；
- push；
- deploy；
- 执行 production migration；
- 隐藏失败。

---

## 9. 外部状态必须单独报告

Git revert 只能撤销仓库内容，不能自动撤销：

- 已执行 migration；
- DNS；
- secret rotation；
- Cloudflare / cloud binding；
- 第三方服务配置；
- 已发送邮件或通知；
- 已写入外部系统的数据。

因此完成报告必须明确：

- external state 是否变化；
- 谁授权；
- 如何验证；
- 怎样恢复；
- 哪些副作用不可逆。

---

## 10. 临时 Plan 的关闭

施工计划完成后：

1. 把永久产品行为写入 spec；
2. 把高代价决定写入 ADR；
3. 把运行程序写入 ops；
4. 把可执行保障写成测试、脚本或约束；
5. 再删除或归档纯施工计划。

不要把所有过程笔记永久保留，也不要让长期知识随计划一起消失。

---

## 11. 最小 Delivery Report

```text
Result
- What changed and which acceptance criteria it satisfies.

Scope
- What was intentionally not changed.

Verification
- Commands and actual results.
- Anything not verified.

Documentation
- Documents updated.
- Or: Docs impact: none — <reason>.

Version
- Previous:
- New:
- Or reason no bump was required.

Git
- Branch:
- Worktree:
- Commit:
- Working tree:
- Push status:

External state
- Changed / unchanged and evidence.

Risks and remaining work
- Concrete unresolved items.

Rollback
- Code and external-state recovery.
```

---

## 结语

一个 change set 只有在代码、文档、任务、版本、验证和 Git 状态一致时，才具备可交付性。

Completion gate 的价值不是增加表格，而是防止最常见的漂移：代码改了但规格没改、任务被误标 Done、版本失去语义、测试结果被概括而不是记录、commit 后仍有遗漏，以及 Git 能回滚代码却无法恢复外部状态。
