# UsingAI

[English README](./README.md)

这是一个用于公开展示我 AI 工作的仓库，包含可独立分发的 skills、可复用的 agents，以及后续会持续补充的 prompts、experiments 和 workflows。

## 文档语言约定

在项目层面，英文是本仓库的主语言。

- 根目录文档默认使用英文；如有需要，可提供单独的中文对应文件。
- `agents/` 目录在有助于使用时可以保持双语。
- `skills/` 目录在专业术语翻译会影响准确性时，可以保持中文优先。

## 仓库定位

这是一个展示与聚合仓库，不是单一 Skill 仓库。

- `skills/` 下的每个子目录都是一个独立的 Skill 单元。
- `agents/` 下的每个子目录都是一个独立的 Agent 或 Agent Spec 单元。
- 实际使用时，请复制、软链接或打包你需要的具体子目录，不要直接把整个仓库当成一个可安装 Skill 来使用。
- 当前所有公开示例都使用虚构出生信息，例如 `2000-1-1`，以避免混入真实个人数据。

## 当前内容

- [`skills/ziwei-iztro-reader`](./skills/ziwei-iztro-reader)：基于 `iztro` 的紫微斗数排盘与分层解读 Skill。
- [`skills/ziwei-zhongzhou-reader`](./skills/ziwei-zhongzhou-reader)：在 `iztro` 排盘基础上融合王亭之中州派理论的深度解读 Skill。
- [`skills/institutional_equity_research_memo`](./skills/institutional_equity_research_memo)：面向公开股票多空研究、基于公开资料生成机构级投资备忘录的 Skill。
- [`skills/axiom-extractor`](./skills/axiom-extractor)：通过增量阅读大型文本语料，提炼作者核心公理、信念与世界观的 Skill。
- [`agents/structrade-os`](./agents/structrade-os)：面向 AI Agent 的个人投资操作系统规格，当前版本为 v3.0 宪章版。

## 使用方式

1. 克隆本仓库。
2. 进入目标 Skill 或 Agent 的子目录。
3. 按该子目录自己的文档接入对应平台。
4. 如果需要上传到 Claude.ai 或类似平台，请只打包目标子目录，不要直接打包整个仓库。

## 计划中的扩展

后续会继续补充以下内容：

- 更多可复用的 AI skills
- 更多可复用的 AI agents 与 agent specs
- prompts 与 agent 配置
- 实验性 workflow 与案例
- 关于 AI 使用方法的整理文档
