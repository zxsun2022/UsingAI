# StrucTrade OS

Language: [中文](./README.md) | [English](./README.en.md)  
Specs: [中文 Spec v3.0](./StrucTrade_OS.md) | [English Spec v3.0](./StrucTrade_OS.en.md)

StrucTrade OS 是一个面向 AI Agent 的个人投资操作系统规格。它不是荐股机器人，也不是自动交易系统，而是一套把研究、交易计划、风控、提醒、快照和复盘整合成单一纪律系统的 Agent 宪章。

## v3.0 更新重点

- 文档升级为**宪章层 + 实现层**两层结构：规格书只定义原则、实体、流程和规则，不再内嵌 SQL 实现。
- **退出计划前置**：没有止损、减仓/止盈条件和论点失效退出条件，就不能激活 TradePlan。
- 保留 v2.0 的全部核心模块，但把重点从“写死实现”转到“让 Agent 自主设计、但不得绕过纪律”。

## 如何使用

最简单的使用方式，是把下面这段内容直接复制给 Agent：

```text
请读取并执行这个文档：
https://raw.githubusercontent.com/zxsun2022/UsingAI/main/agents/structrade-os/StrucTrade_OS.md

要求：
1. 从 Phase 0 开始执行。
2. 严格按 Phase 顺序推进。
3. 每完成一个 Phase，先向我汇报结果并等待确认。
4. 遇到 Schema 设计歧义时，问而不猜。
```

如果目标 Agent 不支持直接读取 URL，就直接粘贴 `StrucTrade_OS.md` 全文，并附上同样的执行要求。

## 系统定位

StrucTrade OS 的核心价值不是“帮你找更多信息”，而是“在情绪波动时仍然按规则执行”。

- 研究先结构化，再形成观点
- 观点必须可证伪，不能只有故事没有失效条件
- 任何交易都先过风控，再谈收益
- 系统只建议，不自动下单
- 复盘和归因不是附属功能，而是纪律闭环的一部分

## v3.0 的结构变化

v3.0 明确把规格拆成两层：

- **宪章层**：给人和 Agent 共同阅读，定义系统目标、角色、原则、实体、决策流程和交易宪法
- **实现层**：由 Agent 根据宪章生成具体 Schema、迁移、索引、视图、SQL 和代码

这意味着该目录里的规格文件现在更适合作为跨平台主说明，而不是某个具体实现框架下的一次性代码脚手架。

## 适合的场景

StrucTrade OS 更适合这些使用方式：

- 有明确主观看法，想把投资过程系统化
- 愿意持续输入研究资料、持仓和交易计划
- 希望建立硬性风控和交易纪律，而不是只做记录
- 需要把 Thesis、TradePlan、Snapshot、Behavior 和 Attribution 串成一个闭环

## 文件说明

- `StrucTrade_OS.md`：中文 v3.0 宪章规格书
- `StrucTrade_OS.en.md`：英文 v3.0 规格书
- `README.md`：中文概览
- `README.en.md`：英文概览

## 目录定位

这个目录属于 `agents/`，不是 `skills/`。

- `skills/` 更适合单一、可复用、边界清晰的能力模块
- `agents/structrade-os/` 适合承载完整 Agent 宪章、系统角色分工和执行流程

## 分发建议

1. 将规格书作为 Agent 的主输入，而不是只截取局部规则。
2. 平台支持抓取文档时，优先使用 raw URL。
3. 若需跨平台分发，优先保留整个 `agents/structrade-os/` 目录结构。
