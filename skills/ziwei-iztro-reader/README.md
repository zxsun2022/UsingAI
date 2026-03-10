# 紫微斗数解读助手

和 AI 聊天，就能解读你的紫微斗数命盘。

本项目是一个可独立分发的 AI Skill / Prompt 工具包，当前收录于 [UsingAI](https://github.com/zxsun2022/UsingAI) 展示仓库的 `skills/ziwei-iztro-reader/` 目录中。

> 使用时请把当前目录单独作为 Skill 安装或打包，不要直接把整个 `UsingAI` 仓库当成一个 Skill。

---

## 功能亮点

- **本命盘解读** — 输入出生信息，自动排出完整 12 宫命盘并逐宫解读
- **运势分析** — 查看流年、流月、流日运势
- **未来预测** — 分析未来某个日期的运势趋势，对比多个日期
- **对话式交互** — 用自然语言提问，AI 自动处理所有技术细节

---

## 适用平台

本 Skill 可在以下平台使用：

| 平台 | 说明 |
|------|------|
| **Claude Code** | 作为 Skill 安装，直接在终端对话使用 |
| **Claude.ai Web** | 将 Skill 打包为 ZIP 上传到 Settings > Capabilities，在网页端对话使用 |
| **其他 AI 工具** | Cursor、Windsurf 等支持 Skill 的工具均可使用，请参考对应工具的文档 |

---

## 快速开始

### Claude Code

```bash
# 1. 克隆展示仓库
git clone https://github.com/zxsun2022/UsingAI.git

# 2. 进入当前 Skill 目录并安装依赖（只需一次）
cd UsingAI/skills/ziwei-iztro-reader/scripts
npm install
```

然后将 `skills/ziwei-iztro-reader` 目录单独作为 Skill 使用（复制、软链接或按目标工具要求放置均可）。

### Claude.ai Web

1. 克隆或下载本仓库
2. 将 `skills/ziwei-iztro-reader` 目录单独打包为 ZIP 文件（ZIP 根目录需直接包含 `SKILL.md`）
3. 前往 [claude.ai/settings/capabilities](https://claude.ai/settings/capabilities)
4. 在 Skills 区域点击上传，选择打包好的 ZIP 文件
5. 确保 **Code execution and file creation** 已开启
6. 开始对话即可

> 详见 Anthropic 官方文档：[Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
>
> 你也可以在 [Skills Directory](https://claude.ai/connectors) 浏览和下载其他官方 Skill。

### 其他 AI 工具

Cursor、Windsurf 等支持 Skill 的工具各有不同的安装方式（如 Cursor 放在 `.cursor/skills/` 目录），请参考对应工具的 Skill 文档。核心文件是 `SKILL.md`，只要工具能读取它并执行 Node.js 脚本即可。

---

## 根目录脚本

```bash
cd UsingAI/skills/ziwei-iztro-reader
npm run install:deps
npm run test
npm run run -- example.input.json
npm run regen:example
```

---

## Agent 配置适配说明

- `SKILL.md` 是跨平台核心入口，任何支持 Skill 文本指令的 Agent 都应优先读取它。
- `agents/openai.yaml` 主要用于 OpenAI/Codex 系生态中的展示与默认提示词。
- Cursor、Claude、Windsurf 等是否读取 `agents/openai.yaml` 取决于各平台实现；即使忽略该文件，`SKILL.md` 仍可独立工作。

---

## 使用示例

安装完成后，直接和 AI 对话：

**解读本命盘**
```
我想看我的紫微斗数命盘
我是 1990 年 5 月 20 日上午 9 点出生的（公历）
性别男，出生地北京
```

**查看近期运势**
```
帮我看一下这个月的事业和感情运势
我现在在上海，时区 Asia/Shanghai
```

**分析未来某天**
```
帮我分析一下 2026 年 3 月 15 日这天的运势
这天适合谈重要的合作吗？
```

**对比多个日期**
```
帮我对比 3 月 1 日、3 月 15 日和 3 月 30 日
这三天哪天更适合开始新项目？
```

---

## 需要提供的信息

AI 会在对话中主动询问以下信息（如果你没有提供）：

| 信息 | 说明 | 示例 |
|------|------|------|
| **出生日期** | 公历或农历 | `1990-5-20`（公历）或 `1990-4-26`（农历） |
| **出生时辰** | 具体时间或时辰名称 | `上午 9 点` 或 `巳时` |
| **性别** | 男或女 | `男` / `女` |
| **出生地** | 城市名称 | `北京` / `Shanghai` |
| **当前时区**（可选） | 用于计算"今天"的运势 | `Asia/Shanghai` |

> 提示：出生日期必须明确是公历还是农历，AI 会在不确定时主动询问。

---

## 工作原理

1. **收集信息** — AI 通过对话获取出生信息和查询需求
2. **自动排盘** — 调用 [iztro](https://github.com/SylarLong/iztro) 库生成紫微斗数命盘
3. **结构化分析** — 整理 12 宫位、主星、辅星、四化等信息
4. **解读输出** — AI 用自然语言为你解读命盘和运势

---

## 项目结构

```
ziwei-iztro-reader/
├── package.json               # 根目录统一入口脚本
├── SKILL.md                  # Skill 定义（AI 的指令文档）
├── scripts/
│   ├── iztro_runner.mjs      # 排盘脚本（调用 iztro 生成命盘数据）
│   └── package.json
├── references/
│   ├── input-schema.md       # 输入输出格式参考
│   ├── time-index.md         # 时辰对照表
│   └── interpretation-template.md  # 解读模板
├── agents/
│   └── openai.yaml           # OpenAI Agent 配置
└── KNOWN_ISSUES.md                # 已知限制与问题
```

---

## 衍生版本

如果希望解读不只依赖 AI 自身的世界知识，而是基于具体的紫微斗数理论体系，可以使用衍生版：

**[ziwei-zhongzhou-reader](../ziwei-zhongzhou-reader)** — 在本 Skill 的排盘能力基础上，内置《王亭之谈紫微斗数》中州派理论知识库（17 个主题参考文件），AI 会按需加载星系组合论、格局论等内容进行深度解读。

---

## 示例输出说明

- `scripts/example.output.json` 是文档快照示例，不是回归测试黄金标准。
- 示例输入 `scripts/example.input.json` 使用虚构出生信息（`2000-1-1`）和固定 `baseDate=2026-2-6`，便于公开展示与结果复现。
- 需要刷新示例时，在当前 Skill 目录执行：`npm run regen:example`。

---

## 版本信息

- 当前 Skill 版本：`v0.3.0`
- 版本来源：Git Tag（以仓库中的 tag 为准）

---

## 致谢

本项目的排盘能力完全依赖 **[iztro](https://github.com/SylarLong/iztro)** — 一个轻量级开源紫微斗数排盘库，由 [SylarLong](https://github.com/SylarLong) 开发维护。iztro 提供了精准的紫微斗数排盘算法，是本项目的核心引擎。感谢 iztro 项目及其贡献者的出色工作。

---

## 免责声明

本项目输出仅用于**文化研究与娱乐参考**，不构成医疗、法律、投资等任何专业建议。排盘采用民用出生时间，默认不做真太阳时修正。

---

## 反馈与问题

如遇到问题或有改进建议，欢迎查看[Known Issues](./KNOWN_ISSUES.md)或提交 Issue。
