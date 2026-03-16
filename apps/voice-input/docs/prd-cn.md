# VoiceInput — 产品需求文档 (PRD)

> **项目定位**：最简单的语音输入法，掌握你自己的数据！  
> **仓库位置**：`UsingAI/apps/voice-input/`  
> **部署方式**：GitHub Pages（静态版） + 带数据库的登录版（后续）  
> **Slogan**：不需要购买 Typeless / Wispr Flow / Monologue，有一个 Gemini Key 就可以。

---

## 一、背景与竞品分析

### 1.1 要解决的问题

语音转文字工具（Typeless $12/月、Wispr Flow $12/月、Monologue $10/月或 Every 订阅）功能强大，但：

- 需要付费订阅
- 数据经过第三方服务器（虽然声称 zero retention）
- 用户无法自托管、无法审计

**VoiceInput 的核心主张**：用 Gemini API 的极低成本（Flash-Lite 约 $0.25/M input tokens）实现 80% 的功能，数据完全在用户手中。

### 1.2 从竞品借鉴的关键特性

| 特性 | Typeless | Wispr Flow | Monologue | VoiceInput（本项目） |
|------|----------|------------|-----------|---------------------|
| 语音转文字 | ✅ | ✅ | ✅ | ✅ Gemini API |
| 去填充词、润色 | ✅ AI 自动 | ✅ AI 自动 | ✅ AI 自动 | ✅ Prompt 控制 |
| Personal Dictionary | ✅ 自动学习 | ✅ 自动+手动 | ✅ 手动 | ✅ 手动设置 |
| 快捷键录音 | 系统级热键 | 按住热键 | 按住/双击 | 空格键 hold-to-talk |
| 语义续写/修改 | ❌ | ✅ 有限 | ✅ 有限 | ✅ Gemini 语义判断 |
| 历史记录 | 各有实现 | ✅ 云端同步 | ✅ 本地 | ✅ 本地 localStorage |
| 跨平台 | 全平台 | Mac/Win/iOS/Android | Mac（iOS新增） | Web（全平台） |
| 价格 | $12/月 | $12/月 | $10/月 | **免费开源（BYOK）** |
| Modes（场景模式） | ❌ | ❌ | ✅ 自定义模式 | ✅ Custom Instructions + Modes（v0.3） |
| 数据控制 | 第三方 | 第三方 | 第三方 | **完全本地** |

---

## 二、功能模块拆解

### 2.1 核心录音交互

**两种录音触发方式（借鉴 Monologue 的交互设计）：**

1. **点击模式**：点击录音按钮开始录制 → 再次点击停止录制并自动提交
2. **空格键模式**（v0.2）：按住空格键开始录音 → 松开空格键停止录制并自动提交

**录音按钮设计**：

录音按钮是页面的视觉主角，居中突出展示于文本编辑区下方正中央：
- 大尺寸圆形按钮，带精致动效
- 新建按钮在其左侧，更小更低调
- 一键复制按钮在其右侧

```
         [+新建]  [ 🎤 录音按钮（大） ]  [复制]
```

**状态指示**：
- 空闲态：麦克风图标 + 微弱呼吸光晕动画
- 录音中：麦克风图标（红色/琥珀色脉冲扩散动画）+ 录音时长计时 + 音频波形可视化（几根跳动竖条）
- 提交中：加载动画（等待 Gemini API 返回）

**音频波形可视化**：
- 使用 Web Audio API 的 AnalyserNode 获取实时频率数据
- 渲染为简约的跳动竖条，给用户"正在听你说话"的视觉反馈
- 代码量极小，视觉效果好

**技术要点**：
- 使用 Web Audio API / MediaRecorder API 录音
- 录音格式：WebM (Opus) 或 WAV — 需要确认 Gemini API 支持的 MIME type
- 空格键监听需要在非输入框聚焦时才生效，避免与文本编辑冲突

### 2.2 语义续写与修改（核心差异化功能）

**核心逻辑**：每次提交新音频时，Gemini 不仅转录当前音频，还要理解它与已有文本的关系：

- **续写场景**：新语音是对已有文本的延续 → 追加到文本末尾
- **修改场景**：新语音是要求修改已有文本的某部分 → 替换/编辑原文

**Prompt 设计思路**：
```
System Prompt:
你是一个语音输入助手。用户会持续通过语音输入文本。

你收到的信息包括：
1. 当前已有的文本（如果有）
2. 用户的个人词典（专有名词、缩写等）
3. 用户最新的语音转录

你的任务：
- 判断语音内容与已有文本的关系，并以 JSON 格式返回操作指令
- 去除口语填充词（嗯、那个、就是说...）
- 使用用户词典中的专有名词正确拼写

返回严格的 JSON 格式（不要 markdown 代码块包裹），根据场景选择以下之一：

1. 续写（新语音是对已有文本的自然延续）：
{"action": "append", "content": "要追加的新内容"}

2. 局部修改（新语音指示修改已有文本的某部分）：
{"action": "replace", "search": "要被替换的原文片段", "replace": "替换后的新内容"}

3. 全文重写（无法通过局部替换完成的大规模修改）：
{"action": "rewrite", "content": "完整的新文本"}

4. 纯转录（没有已有文本时，直接转录语音内容）：
{"action": "transcribe", "content": "转录的文本内容"}

只输出 JSON，不要任何解释。
```

**结构化输出的优势**：
- 前端可以精确执行 append / 局部替换 / 全文重写，保留用户手动编辑的格式
- 局部替换避免每次都传回全文，降低 token 消耗
- 为 undo/redo 提供清晰的操作记录（每个操作都是可逆的）
- 只有在 rewrite 时才返回全文

**System Prompt 语言选择**：
> 为提高模型指令遵循能力与 JSON 输出稳定性，系统底层实际采用**全英文 System Prompt** 进行交互。PRD 中上方的中文 Prompt 仅用于说明设计思路，代码中的英文版本才是真正执行的版本。

**API 调用方式（Gemini generateContent）**：
```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["transcribe", "append", "replace", "rewrite"] },
            content: { type: "string" },
            search: { type: "string" },
            replace: { type: "string" }
          },
          required: ["action"]
        }
      },
      contents: [{
        parts: [
          { text: userPrompt },
          { inline_data: { mime_type: mimeType, data: audioBase64 } }
        ]
      }]
    })
  }
);
```

> **技术决策**：使用 `responseMimeType: "application/json"` + `responseSchema` 强制 Gemini 输出合法 JSON，从而无需在客户端做正则/fallback 解析。这是对输出稳定性最高 ROI 的改动。

**关于模型选择**：
- 默认使用 `gemini-flash-lite-latest`，成本极低（$0.25/M input tokens）
- 备选：`gemini-2.5-flash`（更准确但更贵）
- v0.3 在设置中允许用户选择模型

**长文本优化策略**（v0.3 实现）：
- 当文本超过 3000 字时，只发送最近的 N 段 + 前文摘要给 Gemini
- 避免 input token 消耗和延迟随文本长度线性增长

### 2.3 左侧历史列表（可折叠）— v0.3 实现

**数据结构**：
```javascript
// localStorage key: 'voiceinput_sessions'
{
  sessions: [
    {
      id: 'uuid',
      title: '自动取前20字或用户自定义',
      text: '完整文本内容',
      createdAt: 'ISO timestamp',
      updatedAt: 'ISO timestamp'
    }
  ]
}
```

> 注意：v0.1-v0.2 存储层只维护单一 session（`voiceinput_current_session`）。v0.3 将引入 `voiceinput_sessions` 列表，新建 session 时自动保留旧 session 数据。v0.4 才加入历史列表 UI。

**交互设计**：
- 左侧面板可通过汉堡菜单图标折叠/展开
- 每条记录显示：标题（前 20 字截断）+ 更新时间
- 点击记录 → 加载到主编辑区
- 长按或右键 → 删除、重命名
- 移动端默认折叠，桌面端默认展开
- 设置入口（⚙️ 齿轮图标）放在侧边栏底部

**"新建" 按钮**：
- 位置：录音按钮左侧
- 功能：清空当前编辑区，创建新的空白 session
- 如果当前 session 有内容，自动保存后再新建

### 2.4 文本编辑区

- 主区域展示当前 session 的文本
- 支持手动编辑（contenteditable 或 textarea）
- **一键复制按钮**：点击后复制全文到剪贴板，显示"已复制"反馈
- 文本变化时自动保存到 localStorage

### 2.5 设置面板

设置入口位于侧边栏底部（齿轮图标），点击后以抽屉/面板形式展开。

**设置项**：

| 设置项 | 说明 | 存储 | 版本 |
|--------|------|------|------|
| Gemini API Key | 用户输入自己的 key，密码式输入框 | localStorage | v0.1 |
| 界面语言 | 切换 UI 文案语言（中文 / English），不影响语音输出语言 | localStorage | v0.1 |
| Dictionary（词典） | 个人语音纠错词典，帮助模型正确识别专有名词 | localStorage | v0.2 |
| 模型选择 | 下拉选择 gemini 模型，默认 flash-lite，可选 flash/pro | localStorage | v0.3 |
| Custom Instructions | 全局自定义指令，始终注入 system prompt | localStorage | v0.3 |
| Modes（场景模式） | 可切换的上下文模式，影响输出风格和格式 | localStorage | v0.3 |

**Dictionary 设计（借鉴竞品）**：
```
格式：每行一条，"常见误听/发音 → 正确书写形式"
左侧是语音中可能出现的发音或误听形式，右侧是期望的正确写法。

示例：
安斯罗匹克/Anthropic → Anthropic
克劳德 → Claude
斯特拉克OS → StrucTrade OS
MCP → Model Context Protocol
BYOK → Bring Your Own Key
```

词典内容会被注入到每次 API 调用的 user prompt 中，格式为 `"pronunciation/misheard form → correct written form"`。当音频中出现左侧的发音时，模型会自动写成右侧的正确形式。

**Modes 设计（借鉴 Monologue）**：

Monologue 的 Modes 功能允许用户为不同场景定义不同的输出风格指令。VoiceInput 借鉴这一设计，分为两层：

*Custom Instructions（全局指令）*：
- 始终生效的自定义指令，注入每次 API 调用的 system prompt
- 例如："use British English"、"保持简洁"、"所有输出用繁体中文"

*Modes（场景模式）*：
- 用户可在多个模式之间快速切换，选中的模式指令会追加到 system prompt
- 预设模式 + 用户自定义模式

| 模式 | 说明 | 指令示例 |
|------|------|----------|
| 通用 | 默认模式，标准转录润色 | （无额外指令） |
| 消息 | 口语化、简短，适合聊天 | 保持语气轻松友好，使用口语化表达，句子简短 |
| 编程 | 保留代码标识符原样 | 变量名、函数名、类型名按原样保留（camelCase、snake_case），代码片段用反引号包裹 |
| 邮件 | 半正式商务风格 | 保持礼貌、半正式的语气，使用适当的称呼和结尾 |
| 笔记 | 结构化要点 | 使用要点列表，保持简洁，突出关键信息 |

*UI 交互*：
- 主界面 action bar 提供模式快速切换（小型下拉或图标按钮）
- 设置面板中管理所有模式的详细指令（编辑/新增/删除）
- 当前模式名称在 UI 中有轻量提示

### 2.6 错误处理 UX

| 错误场景 | 处理方式 |
|----------|----------|
| 网络错误 / API 错误 | 文本区下方显示淡红色 toast 提示，不阻断用户操作 |
| API Key 无效 | 设置面板中实时验证（发一个小请求测试 Key），显示验证状态 |
| 麦克风权限被拒 | 提示用户在浏览器设置中授权，提供操作指引 |
| 录音超时（>5分钟）| 自动停止录音并提交，显示提示信息 |

---

## 三、技术架构

### 3.1 整体架构

```
┌─────────────────────────────────────────┐
│              浏览器 (客户端)               │
│                                         │
│  Vite + React 应用                       │
│  ┌──────────┬────────────┬───────────┐  │
│  │ 录音模块  │  UI 组件    │ 存储模块   │  │
│  │MediaRec. │  React     │ localStorage│ │
│  │Web Audio │  Components│           │  │
│  └────┬─────┴─────┬──────┴───────────┘  │
│       │           │                     │
│       └─────┬─────┘                     │
│             │ audio base64 + text       │
│             ▼                           │
│       API 调用模块                       │
│             │                           │
└─────────────┼───────────────────────────┘
              │ HTTPS (REST)
              ▼
┌─────────────────────────────────────────┐
│     Google Gemini API                    │
│     (generativelanguage.googleapis.com)  │
└─────────────────────────────────────────┘
```

### 3.2 技术栈

| 层面 | 选择 | 理由 |
|------|------|------|
| 构建工具 | Vite | 极快的开发体验，产出纯静态文件，兼容 GitHub Pages |
| 框架 | React | 组件化管理录音/编辑/设置等多个交互模块，状态管理清晰 |
| 样式 | CSS Modules 或 Tailwind CSS | 按需选择，保持轻量 |
| 录音 | MediaRecorder API + Web Audio API | 浏览器原生，无需第三方；AnalyserNode 用于波形可视化 |
| 音频格式 | WebM (Opus) | Chrome/Firefox 原生支持，Gemini API 支持 |
| AI 后端 | Gemini API (REST) | 浏览器直接调用，无需中间服务器 |
| 存储 | localStorage | 纯本地，GitHub Pages 无服务端 |
| 部署 | GitHub Pages | 免费、开源、用户可 fork；部署 dist/ 构建产物 |

### 3.3 项目模块划分

```
src/
├── components/          # UI 组件
│   ├── RecordButton     # 录音按钮 + 波形可视化
│   ├── TextEditor       # 文本编辑区
│   ├── Onboarding       # 首次引导卡片
│   └── Toast            # 轻量级通知
├── hooks/               # 自定义 hooks
│   ├── useRecorder      # 录音逻辑封装
│   └── useGemini        # API 调用封装
├── utils/               # 工具函数
│   ├── storage          # localStorage 操作
│   └── audio            # 音频处理
├── App.tsx
└── main.tsx
```

### 3.4 关键技术决策

**Q1: 为什么不用 Whisper/本地模型？**
- 浏览器环境无法高效运行本地 ASR 模型
- Gemini Flash-Lite 成本极低，速度快，且同时完成转录+润色+语义判断
- 一次 API 调用解决"转录+理解+编辑"，比 Whisper 转录 → LLM 润色 的双步流程更简洁

**Q2: 音频大小限制与格式兼容？**
- Gemini API inline_data 限制：总请求 < 20MB
- 对于普通语音录音（WebM Opus），1 分钟约 100KB-500KB
- 建议单次录音上限 5 分钟（前端限制）
- iOS Safari 的 MediaRecorder 生成 `audio/mp4` 而非 `audio/webm`，Gemini API 原生支持 `audio/mp4`，代码中使用 `audioBlob.type.split(';')[0]` 动态获取 MIME type，天然兼容 iOS

**Q3: API Key 安全性？**
- Key 存储在 localStorage，仅在用户浏览器中
- API 请求直接从浏览器发到 Google 服务器（CORS 已支持）
- 告知用户：Key 仅存在于你的浏览器本地，代码开源可审计

**Q4: 为什么用 Vite + React 而不是单文件零构建？**
- 项目有录音、API 调用、状态管理、历史列表、设置面板等多个交互模块，纯 Vanilla JS 管理状态会很痛苦
- Vite 构建极快，产出纯静态文件，完全兼容 GitHub Pages（部署 dist/）
- 模块化拆分让代码清晰可维护，构建后产物依然简洁

**Q5: 为什么用 `responseMimeType: "application/json"` 而不是在 prompt 中要求 JSON？**
- 仅靠 prompt 要求返回 JSON，模型仍可能输出 Markdown 代码块包裹（````json ... ````）、字段顺序不固定、字符串内含未转义换行等问题
- 客户端需要多层 fallback 解析（直接 parse → 换行转义 → 正则提取 → 原文兜底），代码脆弱且难以覆盖所有边界情况
- `responseMimeType` 从 API 层面强制输出合法 JSON，配合 `responseSchema` 约束字段结构，可完全消除解析失败风险
- 这是对输出稳定性最高 ROI 的改动，可删除约 50 行 fallback 代码

---

## 四、页面布局与交互细节

### 4.1 响应式布局

**桌面端（≥768px）**：
```
┌──────────┬──────────────────────────────────┐
│          │                                  │
│ 历史列表  │         文本编辑区                 │
│ (240px)  │                                  │
│ 可折叠    │                                  │
│          │     ┌─────────────────────┐      │
│          │     │ [+] [ 🎤 录音 ] [📋] │      │
│          │     └─────────────────────┘      │
│          │                                  │
├──────────┤                                  │
│ ⚙️ 设置  │                                  │
└──────────┴──────────────────────────────────┘
```

- 录音按钮居中突出，是视觉焦点
- 新建(+)和复制(📋)按钮左右伴随，体量更小
- 设置入口在侧边栏底部

**移动端（<768px）**：
```
┌──────────────────────────┐
│ ☰ 历史   VoiceInput      │  ← 顶栏
├──────────────────────────┤
│                          │
│       文本编辑区          │
│                          │
│                          │
├──────────────────────────┤
│   [+]  [ 🎤 录音 ]  [📋] │  ← 底栏
└──────────────────────────┘
```

- 侧边栏从左侧滑入（overlay），底部包含设置入口
- 录音按钮在底栏居中

### 4.2 关键交互流程

**首次使用流程（内联引导，不使用弹窗）**：
1. 用户打开页面 → 检测无 API Key
2. 主界面正中央展示优雅的 onboarding 卡片："输入你的 Gemini API Key 即可开始"
3. 卡片包含：密码式输入框 + "获取 Key" 链接 + 确认按钮
4. 用户输入 Key → 卡片淡出 → 主界面自然呈现
5. 自动创建第一个空 session

**录音-转写流程**：
1. 用户点击录音按钮 / 按住空格键（v0.2）
2. 请求麦克风权限（首次）
3. 开始录音，按钮变为脉冲态，显示波形可视化和录音时长
4. 用户再次点击 / 松开空格 → 停止录音
5. 音频转为 base64 → 调用 Gemini API
6. 等待返回 → 解析 JSON 操作指令 → 执行 append / replace / rewrite
7. 自动保存到 localStorage

**语义判断示例**：

| 场景 | 已有文本 | 语音输入 | API 返回 |
|------|---------|---------|---------|
| 续写 | "今天的会议讨论了三个议题。" | "第一个是关于Q2的预算分配" | `{"action":"append","content":"第一个是关于Q2的预算分配。"}` |
| 修改 | "今天的会议讨论了三个议题。" | "把三个改成四个" | `{"action":"replace","search":"三个议题","replace":"四个议题"}` |
| 替换 | "联系人是张三" | "不对，应该是李四" | `{"action":"replace","search":"张三","replace":"李四"}` |
| 新段落 | "第一段内容..." | "另起一段，接下来说说市场情况" | `{"action":"append","content":"\n\n接下来说说市场情况。"}` |

### 4.3 视觉风格

**设计原则**：轻盈、优雅、高效、简洁、清晰，大量留白让界面呼吸。

**配色方案**：
- 暗色模式（默认）：深灰蓝底色 + 琥珀/暖橙色 accent（录音按钮）
- 亮色模式：米白底色 + 同色系 accent
- 避免纯黑纯白，使用有温度的中性色

**字体**：
- 英文：Inter 或 Geist
- 中文：系统默认（苹方/思源黑体）
- 文本编辑区可使用等宽或半等宽字体，增强"输入"的专注感

**动效**（全部用 CSS transition/animation 实现，不引入动画库）：
- 录音按钮：空闲时微弱呼吸光晕，录音中脉冲扩散
- 波形竖条：实时跳动
- 文本更新：淡入效果
- 面板切换：滑入/滑出
- Toast 通知：从下方滑入，自动消失

---

## 五、部署与开源策略

### 5.1 仓库结构

```
UsingAI/
├── apps/
│   └── voice-input/
│       ├── docs/
│       │   └── prd-cn.md         # 本文档
│       ├── src/                   # 源代码
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── utils/
│       │   ├── App.tsx
│       │   ├── App.css
│       │   └── main.tsx
│       ├── public/                # 静态资源
│       ├── index.html             # Vite 入口
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── README.md              # 项目说明 + 使用指南
│       └── LICENSE                # 开源协议
├── agents/
├── skills/
└── README.md                      # 更新主 README 添加新项目
```

### 5.2 GitHub Pages 部署

- Vite 构建产出 `dist/` 目录
- 通过 GitHub Actions 或手动部署到 GitHub Pages
- 访问地址：`https://zxsun2022.github.io/UsingAI/apps/voice-input/`
- `vite.config.ts` 中设置 `base: '/UsingAI/apps/voice-input/'`

### 5.3 README 中的引导文案

```markdown
## VoiceInput — 最简单的语音输入法

掌握你自己的数据！

不需要购买 Typeless、Wispr Flow、Monologue，有一个 Gemini Key 就可以。

### 特性
- BYOK（Bring Your Own Key）— 使用你自己的 Gemini API Key
- AI 语义理解 — 自动判断续写还是修改
- 个人词典 — 确保专有名词正确识别
- 数据本地存储 — 你的录音和文本永远只在你的浏览器中
- 一键复制 — 快速将结果粘贴到任何应用
- 空格键快速录音 — 按住说话，松开提交
- 开源免费 — 代码可审计，可 fork 自己部署

### 使用方式
1. 获取 [Gemini API Key](https://aistudio.google.com/apikey)
2. 打开 [VoiceInput](https://zxsun2022.github.io/UsingAI/apps/voice-input/)
3. 输入你的 Key
4. 开始说话！
```

---

## 六、版本规划

### v0.1 — MVP

- [✅] Vite + React 项目脚手架搭建
- [✅] 基本录音功能（点击按钮开始/停止）
- [✅] 录音波形可视化（AnalyserNode 跳动竖条）
- [✅] Gemini API 调用（音频 → 结构化 JSON → 文本）
- [✅] API Key 输入与本地存储（内联 onboarding 卡片）
- [✅] 文本编辑区 + 一键复制
- [✅] 单一 session（数据模型按多 session 设计，UI 暂不展示列表）
- [✅] 基本错误处理（API 失败 toast）
- [✅] 暗色/亮色双主题，个性化配色与字体

### v0.2 — 核心体验 ✅

- [✅] 语义续写/修改逻辑（结构化 JSON 解析 + append/replace/rewrite 执行）
- [✅] 空格键 hold-to-talk
- [✅] Undo（一步回退，每次 API 操作前保存文本快照）
- [✅] Dictionary 词典设置 UI
- [✅] 新建 session 按钮

### v0.3 — 稳定性 + Modes ✅

**技术加固**：
- [✅] Gemini 结构化输出：启用 `responseMimeType: "application/json"` + `responseSchema`，替代客户端正则解析
- [✅] 修复 `vite.config.ts` 设置 `base: '/UsingAI/apps/voice-input/'`（GitHub Pages 部署必需）
- [✅] 新建 session 时保留旧 session 到 `voiceinput_sessions` 列表（防止数据丢失，为 v0.4 历史列表做数据准备）
- [✅] model 参数化：`useGemini` 接受 model 参数，URL 不再硬编码模型名

**新功能**：
- [✅] Custom Instructions（全局自定义指令，注入 system prompt）
- [✅] Modes（场景模式）— 借鉴 Monologue，可定义/切换不同输出风格（通用、消息、编程、邮件、笔记）
- [✅] 模型选择下拉（默认 flash-lite，可选 flash/pro）

### v0.4 — 完善

- [✅] 历史列表侧边栏 + 多 session 管理 UI
- [✅] 响应式移动端适配
- [ ] 长文本 prompt 截断策略（>3000 字时只发最近 N 段 + 摘要）
- [ ] 导出功能（Markdown / 纯文本）
- [ ] 录音时长限制（5 分钟）+ 提示

### v1.0 — 正式发布

- [ ] 完整的 README 和使用文档
- [ ] GitHub Pages 部署（GitHub Actions 自动化）
- [ ] 主仓库 README 更新
- [ ] 宣传物料（小红书 / X.com 发布）

### 后续 — Pro 版（带数据库）

- [ ] 用户注册/登录
- [ ] 云端存储 sessions
- [ ] 跨设备同步
- [ ] 团队共享词典

---

## 七、风险与注意事项

| 风险 | 影响 | 应对 |
|------|------|------|
| Gemini API 音频识别准确度不如 Whisper | 用户体验受损 | 允许切换更强模型（Flash/Pro）；词典辅助 |
| 浏览器 MediaRecorder 兼容性 | Safari 旧版不支持 WebM | iOS Safari 输出 `audio/mp4`，Gemini 原生支持；代码动态获取 MIME type 天然兼容 |
| API Key 泄露风险 | 用户 Key 被盗用 | 明确告知只存本地；建议设置 API 配额 |
| localStorage 大小限制（~5-10MB）| 历史记录过多时溢出 | 设置上限，提供导出/清理功能 |
| 语义续写/修改判断不准 | 文本被错误修改 | Undo 回退（v0.2）；每次操作前保存快照 |
| 空格键冲突 | 编辑文本时触发录音 | 仅在编辑区未聚焦时响应空格键 |
| 结构化 JSON 输出解析失败 | Gemini 偶尔返回非标准 JSON | v0.3 启用 `responseMimeType: "application/json"` + `responseSchema` 从 API 层面杜绝；过渡期保留 fallback 解析 |
| 新建 session 覆盖数据 | 用户点击新建时旧内容丢失 | v0.3 新建前将旧 session 存入 `voiceinput_sessions` 列表 |

---

## 八、核心宣传语

**中文**：
> 最简单的语音输入法，掌握你自己的数据！  
> 不需要每月花 $12 买 Typeless / Wispr Flow / Monologue。  
> 有一个 Gemini Key，就拥有了你自己的 AI 语音输入法。  
> 开源、免费、数据完全在你手中。

**英文**：
> The simplest voice input tool. Own your data.  
> No $12/month subscriptions. Just bring your Gemini API Key.  
> Open source. Free. Your data stays in your browser.
