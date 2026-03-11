# UsingAI

用于公开展示我的 AI 工作，包括可独立分发的 skills，以及后续会持续补充的 prompts、agents、experiments 等内容。

## 仓库定位

这是一个展示聚合仓库，不是单一 Skill 仓库。

- `skills/` 下的每个子目录都是一个独立 Skill 单元。
- `agents/` 下的每个子目录都是一个独立 Agent / Agent Spec 单元。
- 实际使用时，请将具体子目录单独复制、软链接或打包，不要直接把整个仓库当成一个 Skill 安装。
- 当前所有公开示例都使用虚构出生信息（如 `2000-1-1`）以避免混入真实个人数据。

## 当前内容

- [`skills/ziwei-iztro-reader`](./skills/ziwei-iztro-reader): 基于 iztro 的紫微斗数排盘与分层解读 Skill
- [`skills/ziwei-zhongzhou-reader`](./skills/ziwei-zhongzhou-reader): 在 iztro 排盘基础上融合王亭之中州派理论的深度解读 Skill
- [`agents/structrade-os`](./agents/structrade-os): 面向 AI Agent 的个人投资操作系统规格

## 使用方式

1. 克隆本仓库。
2. 进入目标 Skill 或 Agent 子目录。
3. 按该子目录自己的文档接入对应平台。
4. 如果需要上传到 Claude.ai 或类似平台，请只打包目标子目录，不要直接打包整个仓库。

## 计划中的扩展

后续会继续补充：

- 更多可复用的 AI skills
- 更多可复用的 AI agents / agent specs
- prompts / agent 配置
- 实验性 workflow 与案例
- 关于 AI 使用方法的整理文档
