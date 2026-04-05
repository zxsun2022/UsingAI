# UsingAI

Public showcase for my AI work, including distributable skills, reusable agents, and future additions such as prompts, experiments, and workflows.  
这是一个用于公开展示我 AI 工作的仓库，包含可独立分发的 skills、可复用的 agents，以及后续会持续补充的 prompts、experiments 和 workflows。

## Documentation Language Policy / 文档语言约定

English is the primary language of this repository at the project level. Root-level documentation should prefer bilingual formatting with English first and Chinese immediately following. The `agents/` directory should stay bilingual, while `skills/` may remain Chinese-first when translating domain terms would reduce accuracy.  
在项目层面，英文是本仓库的主语言。根目录文档应优先采用中英文双语，默认英文在前、中文紧随其后。`agents/` 目录应保持双语，而 `skills/` 在专业术语翻译会影响准确性时，可以暂时保持中文优先。

## Repository Scope / 仓库定位

This is a showcase and aggregation repository, not a single-skill package.  
这是一个展示与聚合仓库，不是单一 Skill 仓库。

- Each subdirectory under `skills/` is an independent skill unit.  
  `skills/` 下的每个子目录都是一个独立的 Skill 单元。
- Each subdirectory under `agents/` is an independent agent or agent-spec unit.  
  `agents/` 下的每个子目录都是一个独立的 Agent 或 Agent Spec 单元。
- In actual use, copy, symlink, or package the specific subdirectory you need instead of treating the whole repository as one installable skill.  
  实际使用时，请复制、软链接或打包你需要的具体子目录，不要直接把整个仓库当成一个可安装 Skill 来使用。
- All public examples currently use fictional birth data such as `2000-1-1` to avoid mixing in real personal data.  
  当前所有公开示例都使用虚构出生信息，例如 `2000-1-1`，以避免混入真实个人数据。

## Current Contents / 当前内容

- [`skills/ziwei-iztro-reader`](./skills/ziwei-iztro-reader): A Ziwei Doushu charting and layered interpretation skill built on `iztro`.  
  [`skills/ziwei-iztro-reader`](./skills/ziwei-iztro-reader)：基于 `iztro` 的紫微斗数排盘与分层解读 Skill。
- [`skills/ziwei-zhongzhou-reader`](./skills/ziwei-zhongzhou-reader): A deeper interpretation skill that extends `iztro` charting with Wang Tingzhi's Zhongzhou-school framework.  
  [`skills/ziwei-zhongzhou-reader`](./skills/ziwei-zhongzhou-reader)：在 `iztro` 排盘基础上融合王亭之中州派理论的深度解读 Skill。
- [`skills/institutional_equity_research_memo`](./skills/institutional_equity_research_memo): A buy-side, institution-grade public-equity research memo skill for long/short analysis using public-source evidence.  
  [`skills/institutional_equity_research_memo`](./skills/institutional_equity_research_memo)：面向公开股票多空研究、基于公开资料生成机构级投资备忘录的 Skill。
- [`skills/axiom-extractor`](./skills/axiom-extractor): An incremental corpus-reading skill for distilling a person's core axioms, beliefs, and worldview from large collections of writings.  
  [`skills/axiom-extractor`](./skills/axiom-extractor)：通过增量阅读大型文本语料，提炼作者核心公理、信念与世界观的 Skill。
- [`agents/structrade-os`](./agents/structrade-os): A personal investment operating system spec for AI agents, currently updated to the v3.0 charter edition.  
  [`agents/structrade-os`](./agents/structrade-os)：面向 AI Agent 的个人投资操作系统规格，当前版本为 v3.0 宪章版。

## Usage / 使用方式

1. Clone this repository.  
   克隆本仓库。
2. Enter the subdirectory of the target skill or agent.  
   进入目标 Skill 或 Agent 的子目录。
3. Follow that subdirectory's own documentation for platform-specific integration.  
   按该子目录自己的文档接入对应平台。
4. If you need to upload content to Claude.ai or a similar platform, package only the target subdirectory rather than the entire repository.  
   如果需要上传到 Claude.ai 或类似平台，请只打包目标子目录，不要直接打包整个仓库。

## Planned Additions / 计划中的扩展

More content will be added over time, including:  
后续会继续补充以下内容：

- More reusable AI skills  
  更多可复用的 AI skills
- More reusable AI agents and agent specs  
  更多可复用的 AI agents 与 agent specs
- Prompts and agent configurations  
  prompts 与 agent 配置
- Experimental workflows and examples  
  实验性 workflow 与案例
- Documentation on practical AI usage  
  关于 AI 使用方法的整理文档
